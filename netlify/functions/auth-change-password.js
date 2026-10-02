
'use strict';

const { bad, ok, bearer, firebase, validatePassword } = require('./_firebase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return bad(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
  try {
    const token = bearer(event);
    if (!token) return bad(401, 'AUTH_REQUIRED', 'Authentication required.');
    const { auth, db } = firebase();
    let decoded;
    try { decoded = await auth.verifyIdToken(token, true); }
    catch { return bad(401, 'AUTH_INVALID', 'Invalid or expired authentication token.'); }

    const body = JSON.parse(event.body || '{}');
    const password = String(body.newPassword || '');
    const confirm = String(body.confirmNewPassword || '');
    if (password !== confirm) return bad(400, 'PASSWORD_MISMATCH', 'Konfirmasi password tidak sama.');

    const ref = db.collection('users').doc(decoded.uid);
    const snap = await ref.get();
    if (!snap.exists) return bad(404, 'PROFILE_NOT_FOUND', 'User profile tidak ditemukan.');
    const profile = snap.data();
    const passwordError = validatePassword(password, profile.username, profile.email);
    if (passwordError) return bad(400, 'INVALID_PASSWORD', passwordError);
    if (!profile.mustChangePassword) return bad(409, 'CHANGE_NOT_REQUIRED', 'Perubahan password sementara tidak sedang diwajibkan.');

    await auth.updateUser(decoded.uid, { password });
    await ref.update({ mustChangePassword: false, updatedAt: new Date().toISOString() });
    await db.collection('auditLogs').add({
      actorId: decoded.uid, actorRole: profile.role || 'User', targetUserId: decoded.uid,
      action: 'CHANGE_PASSWORD', timestamp: new Date().toISOString(), result: 'SUCCESS'
    });
    return ok({ success: true, mustChangePassword: false });
  } catch (e) {
    console.error('auth-change-password failed:', e.message);
    return bad(e.statusCode || 500, e.code || 'CHANGE_PASSWORD_FAILED', e.statusCode ? e.message : 'Password gagal diubah.');
  }
};
