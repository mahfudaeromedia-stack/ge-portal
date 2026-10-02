'use strict';

const { bad, ok, bearer, firebase, safeProfile } = require('./_firebase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return bad(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
  try {
    const token = bearer(event);
    if (!token) return bad(401, 'AUTH_REQUIRED', 'Authentication required.');
    const { auth, db } = firebase();
    let decoded;
    try { decoded = await auth.verifyIdToken(token, true); }
    catch { return bad(401, 'AUTH_INVALID', 'Session tidak valid atau sudah kedaluwarsa.'); }

    const body = JSON.parse(event.body || '{}');
    const allowedKeys = new Set(['fullName']);
    if (Object.keys(body).some(k => !allowedKeys.has(k))) return bad(400, 'INVALID_PROFILE_FIELDS', 'Profile self-service hanya dapat memperbarui Employee Name.');
    const fullName = String(body.fullName || '').trim();
    if (!fullName) return bad(400, 'INVALID_NAME', 'Employee Name wajib diisi.');
    if (fullName.length > 120) return bad(400, 'INVALID_NAME', 'Employee Name terlalu panjang.');
    if (/[\u0000-\u001F\u007F]/.test(fullName)) return bad(400, 'INVALID_NAME', 'Employee Name mengandung karakter yang tidak valid.');

    const ref = db.collection('users').doc(decoded.uid);
    const snap = await ref.get();
    if (!snap.exists) return bad(404, 'PROFILE_NOT_FOUND', 'User profile tidak ditemukan.');
    const current = snap.data();
    if (String(current.status || 'Active').trim().toLowerCase() === 'inactive') return bad(403, 'ACCOUNT_INACTIVE', 'Akun tidak aktif.');

    const previousName = String(current.name || current.username || '');
    if (previousName === fullName) return ok({ profile: safeProfile({ id: snap.id, ...current }), changed: false });

    try {
      await auth.updateUser(decoded.uid, { displayName: fullName });
      try {
        await ref.update({ name: fullName, updatedAt: new Date().toISOString() });
      } catch (firestoreError) {
        try { await auth.updateUser(decoded.uid, { displayName: previousName || current.username || undefined }); } catch (rollbackError) { console.error('auth-update-self-profile rollback failed:', rollbackError.message); }
        throw firestoreError;
      }
    } catch (e) {
      throw e;
    }

    try {
      await db.collection('auditLogs').add({
        actorId: decoded.uid, actorRole: current.role || 'User', targetUserId: decoded.uid,
        action: 'UPDATE_SELF_PROFILE', timestamp: new Date().toISOString(), result: 'SUCCESS'
      });
    } catch (auditError) { console.warn('auth-update-self-profile audit failed:', auditError.message); }

    return ok({ profile: safeProfile({ id: snap.id, ...current, name: fullName, updatedAt: new Date().toISOString() }), changed: true });
  } catch (e) {
    console.error('auth-update-self-profile failed:', e.message);
    return bad(500, 'UPDATE_SELF_PROFILE_FAILED', 'Profile gagal diperbarui.');
  }
};
