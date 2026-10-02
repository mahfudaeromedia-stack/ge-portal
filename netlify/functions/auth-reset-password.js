
'use strict';

const { bad, ok, requireActor, validatePassword, hasUserManagementPermission, userManagementScopeAllowed } = require('./_firebase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return bad(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
  try {
    const { auth, db, actor } = await requireActor(event);
    if (!hasUserManagementPermission(actor)) return bad(403, 'USER_MANAGEMENT_PERMISSION_REQUIRED', 'Akun tidak memiliki permission User Management.');
    const body = JSON.parse(event.body || '{}');
    const uid = String(body.userId || '');
    const password = String(body.temporaryPassword || '');
    const confirm = String(body.confirmTemporaryPassword || '');
    if (!uid) return bad(400, 'INVALID_USER', 'User ID wajib diisi.');
    if (password !== confirm) return bad(400, 'PASSWORD_MISMATCH', 'Konfirmasi temporary password tidak sama.');
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) return bad(404, 'USER_NOT_FOUND', 'User tidak ditemukan.');
    const target = snap.data();
    if (target.role === 'Super Admin') return bad(403, 'ROLE_PROTECTED', 'SuperAdmin adalah role terlindungi dan tidak dapat direset melalui User Management.');
    if (actor.role !== 'Super Admin' && (String(target.accessLevel||'') === 'Admin' || target.role === 'Admin')) return bad(403, 'ADMIN_PEER_PROTECTED', 'Admin HO tidak dapat mereset akun admin lain.');
    if (!userManagementScopeAllowed(actor, target.scopeType, target.airports, target.loungeIds)) return bad(403, 'OUT_OF_SCOPE', 'User berada di luar scope User Management Anda.');
    const passwordError = validatePassword(password, target.username, target.email);
    if (passwordError) return bad(400, 'INVALID_PASSWORD', passwordError);

    await auth.updateUser(uid, { password });
    await auth.revokeRefreshTokens(uid);
    await db.runTransaction(async tx => {
      tx.update(db.collection('users').doc(uid), { mustChangePassword: true, updatedAt: new Date().toISOString() });
      tx.create(db.collection('auditLogs').doc(), {
        actorId: actor.id, actorRole: actor.role, targetUserId: uid,
        action: 'RESET_PASSWORD', timestamp: new Date().toISOString(), result: 'SUCCESS'
      });
    });
    return ok({ success: true, mustChangePassword: true });
  } catch (e) {
    console.error('auth-reset-password failed:', e.message);
    return bad(e.statusCode || 500, e.code || 'RESET_PASSWORD_FAILED', e.statusCode ? e.message : 'Reset password gagal.');
  }
};
