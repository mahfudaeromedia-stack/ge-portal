'use strict';

const { firebase, ok, bad, requireActor, hasUserManagementPermission } = require('./_firebase');

const REQUEST_COLLECTION = 'accessAssistanceRequests';
const INBOX_COLLECTION = 'inbox';
const ALLOWED_STATUSES = new Set(['OPEN', 'IN_PROGRESS', 'RESOLVED']);
const CREDENTIAL_PATTERN = /(password|kata\s*sandi|temporary\s*password|pwd|id\s*token|refresh\s*token|credential|private\s*key)/i;

function authorizedActor(actor) {
  if (!actor || String(actor.status || 'Active').trim().toLowerCase() === 'inactive') return false;
  if (actor.role === 'Super Admin') return true;
  return actor.role === 'Admin' && hasUserManagementPermission(actor);
}

function cleanText(value, max = 300) {
  return String(value || '').trim().slice(0, max);
}

function actorIdentity(actor) {
  return {
    id: String(actor.id || ''),
    name: cleanText(actor.name || actor.username || actor.email || 'Admin', 120),
    username: cleanText(actor.username || '', 80)
  };
}

function notificationId(requestId, recipientId) {
  return `access-assistance-${String(requestId)}-${String(recipientId)}`;
}

function notificationMessage(request) {
  const identifier = cleanText(request.identifier || request.username || request.email || 'User', 160);
  const status = String(request.status || 'OPEN');
  return `Bantuan Akses Akun • ${identifier} • Status: ${status}`;
}

function publicRequest(id, data, notification) {
  return {
    id: String(id),
    type: 'ACCESS_ASSISTANCE',
    identifier: cleanText(data.identifier || '', 160),
    email: data.email || null,
    username: data.username || null,
    reason: cleanText(data.reason || '', 300) || null,
    status: ALLOWED_STATUSES.has(String(data.status)) ? String(data.status) : 'OPEN',
    createdAt: data.createdAt || null,
    handledBy: data.handledBy || null,
    handledAt: data.handledAt || null,
    resolvedBy: data.resolvedBy || null,
    resolvedAt: data.resolvedAt || null,
    resolutionNote: cleanText(data.resolutionNote || '', 300) || null,
    notificationId: notification?.id || notificationId(id, notification?.recipientId || ''),
    notificationStatus: String(notification?.status || (notification?.read ? 'READ' : 'UNREAD')).toUpperCase() === 'READ' ? 'READ' : 'UNREAD'
  };
}

async function ensureNotifications(db, requests, actor) {
  const refs = requests.map(r => db.collection(INBOX_COLLECTION).doc(notificationId(r.id, actor.id)));
  if (!refs.length) return new Map();
  const docs = await Promise.all(refs.map(ref => ref.get()));
  const batch = db.batch();
  let writes = 0;
  docs.forEach((snap, i) => {
    if (snap.exists) return;
    const request = requests[i];
    batch.set(refs[i], {
      type: 'ACCESS_ASSISTANCE',
      actorId: '',
      actorName: 'User',
      recipientId: String(actor.id),
      accessAssistanceRequestId: String(request.id),
      subject: 'Bantuan Akses Akun',
      message: notificationMessage(request),
      createdAt: request.createdAt || new Date().toISOString(),
      read: false,
      status: 'UNREAD'
    });
    writes++;
  });
  if (writes) await batch.commit();

  const map = new Map();
  const currentDocs = writes ? await Promise.all(refs.map(ref => ref.get())) : docs;
  currentDocs.forEach(snap => { if (snap.exists) map.set(snap.id, { id: snap.id, ...snap.data() }); });
  return map;
}

async function listRequests(db, actor) {
  const snap = await db.collection(REQUEST_COLLECTION).where('recipientUserIds', 'array-contains', String(actor.id)).get();
  const requests = snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(r => ALLOWED_STATUSES.has(String(r.status || 'OPEN')))
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  const notifications = await ensureNotifications(db, requests, actor);
  return requests.map(r => publicRequest(r.id, r, notifications.get(notificationId(r.id, actor.id))));
}

async function assertRecipient(db, actor, requestId) {
  const ref = db.collection(REQUEST_COLLECTION).doc(String(requestId));
  const snap = await ref.get();
  if (!snap.exists) throw Object.assign(new Error('Permintaan tidak ditemukan.'), { statusCode: 404, code: 'REQUEST_NOT_FOUND' });
  const data = snap.data() || {};
  const recipients = Array.isArray(data.recipientUserIds) ? data.recipientUserIds.map(String) : [];
  if (!recipients.includes(String(actor.id))) throw Object.assign(new Error('Permintaan tidak dapat diakses.'), { statusCode: 403, code: 'FORBIDDEN' });
  return { ref, data };
}

exports.handler = async (event) => {
  if (!['GET', 'POST'].includes(event.httpMethod)) return bad(405, 'METHOD_NOT_ALLOWED', 'Metode permintaan tidak didukung.');
  try {
    const { db, actor } = await requireActor(event, ['Admin', 'Super Admin']);
    if (!authorizedActor(actor)) return bad(403, 'FORBIDDEN', 'Akun tidak memiliki akses ke permintaan bantuan akses.');

    if (event.httpMethod === 'GET') {
      const requests = await listRequests(db, actor);
      return ok({ requests });
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return bad(400, 'INVALID_REQUEST', 'Permintaan tidak dapat diproses.'); }
    const requestId = cleanText(body.requestId, 160);
    const action = cleanText(body.action, 40).toLowerCase();
    if (!requestId || !['read', 'process', 'resolve'].includes(action)) return bad(400, 'INVALID_ACTION', 'Tindakan permintaan tidak valid.');

    const { ref, data } = await assertRecipient(db, actor, requestId);
    const actorInfo = actorIdentity(actor);

    if (action === 'read') {
      const nref = db.collection(INBOX_COLLECTION).doc(notificationId(requestId, actor.id));
      await nref.set({
        type: 'ACCESS_ASSISTANCE',
        recipientId: String(actor.id),
        accessAssistanceRequestId: String(requestId),
        subject: 'Bantuan Akses Akun',
        read: true,
        status: 'READ',
        readAt: new Date().toISOString()
      }, { merge: true });
      return ok({ request: publicRequest(requestId, data, { id: nref.id, recipientId: actor.id, read: true, status: 'READ' }) });
    }

    const now = new Date().toISOString();
    let next;
    if (action === 'process') {
      await db.runTransaction(async tx => {
        const latest = await tx.get(ref);
        const current = latest.data() || {};
        const status = String(current.status || 'OPEN');
        if (status === 'IN_PROGRESS') throw Object.assign(new Error('Permintaan sedang diproses oleh admin lain.'), { statusCode: 409, code: 'REQUEST_ALREADY_IN_PROGRESS' });
        if (status === 'RESOLVED') throw Object.assign(new Error('Permintaan sudah diselesaikan.'), { statusCode: 409, code: 'REQUEST_ALREADY_RESOLVED' });
        if (status !== 'OPEN') throw Object.assign(new Error('Status permintaan tidak valid.'), { statusCode: 409, code: 'INVALID_STATUS_TRANSITION' });
        tx.update(ref, { status: 'IN_PROGRESS', handledBy: actorInfo, handledAt: now, updatedAt: now });
        tx.create(db.collection('auditLogs').doc(), {
          actorId: actorInfo.id, actorRole: actor.role, targetRequestId: String(requestId),
          action: 'ACCESS_ASSISTANCE_PROCESS', timestamp: now, result: 'SUCCESS'
        });
      });
      const latest = await ref.get();
      return ok({ request: publicRequest(requestId, latest.data() || {}, null) });
    }

    const resolutionNote = cleanText(body.resolutionNote, 300);
    if (resolutionNote && CREDENTIAL_PATTERN.test(resolutionNote)) {
      return bad(400, 'INVALID_RESOLUTION_NOTE', 'Keterangan penyelesaian tidak boleh berisi kredensial atau informasi keamanan.');
    }

    await db.runTransaction(async tx => {
      const latest = await tx.get(ref);
      const current = latest.data() || {};
      const status = String(current.status || 'OPEN');
      if (!['OPEN', 'IN_PROGRESS'].includes(status)) throw Object.assign(new Error('Permintaan sudah diselesaikan.'), { statusCode: 409, code: 'REQUEST_ALREADY_RESOLVED' });
      const patch = {
        status: 'RESOLVED',
        resolvedBy: actorInfo,
        resolvedAt: now,
        updatedAt: now
      };
      if (resolutionNote) patch.resolutionNote = resolutionNote;
      tx.update(ref, patch);
      tx.create(db.collection('auditLogs').doc(), {
        actorId: actorInfo.id, actorRole: actor.role, targetRequestId: String(requestId),
        action: 'ACCESS_ASSISTANCE_RESOLVE', timestamp: now, result: 'SUCCESS'
      });
    });

    const latest = await ref.get();
    return ok({ request: publicRequest(requestId, latest.data() || {}, null) });
  } catch (e) {
    console.error('access-assistance-admin failed:', e?.message || e);
    return bad(e.statusCode || 500, e.code || 'ACCESS_ASSISTANCE_ADMIN_FAILED', e.statusCode ? e.message : 'Permintaan belum dapat diperbarui. Silakan coba kembali.');
  }
};
