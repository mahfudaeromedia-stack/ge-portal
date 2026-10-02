'use strict';

const { firebase, ok, bad, normalizeUsername } = require('./_firebase');

function normalizeIdentifier(value) {
  return String(value || '').trim().slice(0, 160);
}

function normalizeEmail(value) {
  const v = normalizeIdentifier(value).toLowerCase();
  return v.includes('@') ? v : '';
}

function isAuthorizedRecipient(profile) {
  if (profile?.status && String(profile.status).trim().toLowerCase() === 'inactive') return false;
  if (profile?.role === 'Super Admin') return true;
  if (profile?.role !== 'Admin') return false;
  const permissions = Array.isArray(profile.permissions) ? profile.permissions.map(x => String(x).toLowerCase()) : [];
  if (permissions.length) return permissions.some(x => ['user-management', 'user_management', 'users', 'admin'].includes(x));
  const tabs = Array.isArray(profile.tabs) ? profile.tabs.map(x => String(x).toLowerCase()) : [];
  return tabs.includes('all') || tabs.includes('admin');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return bad(405, 'METHOD_NOT_ALLOWED', 'Metode permintaan tidak didukung.');

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return bad(400, 'INVALID_REQUEST', 'Permintaan tidak dapat diproses.'); }

  const identifier = normalizeIdentifier(body.identifier);
  const reason = normalizeIdentifier(body.reason);
  if (!identifier) return bad(400, 'IDENTIFIER_REQUIRED', 'Username atau email wajib diisi.');

  try {
    const { db } = firebase();
    const usersSnap = await db.collection('users').get();
    const recipients = [];
    usersSnap.forEach(doc => {
      const profile = doc.data() || {};
      if (isAuthorizedRecipient(profile)) {
        recipients.push({ id: doc.id, role: String(profile.role || '') });
      }
    });

    if (!recipients.length) {
      return bad(503, 'ASSISTANCE_RECIPIENT_UNAVAILABLE', 'Layanan bantuan akses sedang tidak tersedia. Silakan hubungi administrator.');
    }

    const email = normalizeEmail(identifier);
    const username = normalizeUsername(identifier);
    const request = {
      type: 'ACCESS_ASSISTANCE',
      identifier,
      email: email || null,
      username: username || null,
      reason: reason || null,
      recipientUserIds: recipients.map(x => x.id),
      recipientRoles: [...new Set(recipients.map(x => x.role).filter(Boolean))],
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      source: 'login'
    };

    const ref = db.collection('accessAssistanceRequests').doc();
    const batch = db.batch();
    batch.set(ref, request);
    recipients.forEach(recipient => {
      const notificationRef = db.collection('inbox').doc(`access-assistance-${ref.id}-${recipient.id}`);
      batch.set(notificationRef, {
        type: 'ACCESS_ASSISTANCE',
        actorId: '',
        actorName: 'User',
        recipientId: String(recipient.id),
        accessAssistanceRequestId: ref.id,
        subject: 'Bantuan Akses Akun',
        message: `Bantuan Akses Akun • ${identifier} • Status: OPEN`,
        createdAt: request.createdAt,
        read: false,
        status: 'UNREAD'
      });
    });
    await batch.commit();
    return ok({ ok: true, requestId: ref.id });
  } catch (e) {
    console.error('access-assistance-request failed:', e?.message || e);
    return bad(500, 'ASSISTANCE_REQUEST_FAILED', 'Permintaan bantuan akses belum dapat disimpan. Silakan coba lagi.');
  }
};
