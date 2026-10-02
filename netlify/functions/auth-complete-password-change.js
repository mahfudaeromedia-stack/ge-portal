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

    const authTime = Number(decoded.auth_time || 0) * 1000;
    if (!authTime || Date.now() - authTime > 10 * 60 * 1000) return bad(401, 'RECENT_AUTH_REQUIRED', 'Reauthentication diperlukan untuk menyelesaikan perubahan password.');

    const userRecord = await auth.getUser(decoded.uid);
    const passwordRefreshAt = Date.parse(userRecord.tokensValidAfterTime || '');
    if (!passwordRefreshAt || Date.now() - passwordRefreshAt > 5 * 60 * 1000) return bad(409, 'PASSWORD_UPDATE_NOT_CONFIRMED', 'Password update belum dapat dikonfirmasi. Silakan ulangi perubahan password.');

    const ref = db.collection('users').doc(decoded.uid);
    const snap = await ref.get();
    if (!snap.exists) return bad(404, 'PROFILE_NOT_FOUND', 'User profile tidak ditemukan.');
    const current = snap.data();
    if (String(current.status || 'Active').trim().toLowerCase() === 'inactive') return bad(403, 'ACCOUNT_INACTIVE', 'Akun tidak aktif.');

    const updatedAt = new Date().toISOString();
    await ref.update({ mustChangePassword: false, updatedAt });
    try {
      await db.collection('auditLogs').add({
        actorId: decoded.uid, actorRole: current.role || 'User', targetUserId: decoded.uid,
        action: 'COMPLETE_PASSWORD_LIFECYCLE', timestamp: updatedAt, result: 'SUCCESS'
      });
    } catch (auditError) { console.warn('auth-complete-password-change audit failed:', auditError.message); }

    return ok({ success: true, mustChangePassword: false, profile: safeProfile({ id: snap.id, ...current, mustChangePassword: false, updatedAt }) });
  } catch (e) {
    console.error('auth-complete-password-change failed:', e.message);
    return bad(500, 'PASSWORD_LIFECYCLE_FAILED', 'Status password account gagal disinkronkan.');
  }
};
