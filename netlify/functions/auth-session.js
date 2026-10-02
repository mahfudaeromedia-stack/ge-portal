
'use strict';

const { bad, ok, bearer, firebase, safeProfile } = require('./_firebase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return bad(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
  try {
    const token = bearer(event);
    if (!token) return bad(401, 'AUTH_REQUIRED', 'Authentication required.');
    const { auth, db } = firebase();
    const decoded = await auth.verifyIdToken(token);
    const snap = await db.collection('users').doc(decoded.uid).get();
    if (!snap.exists) return bad(403, 'PROFILE_NOT_FOUND', 'User profile tidak ditemukan.');
    if (String(snap.data().status || 'Active').trim().toLowerCase() === 'inactive') return bad(403, 'ACCOUNT_INACTIVE', 'Akun tidak aktif.');
    return ok({ profile: safeProfile({ id: snap.id, ...snap.data() }) });
  } catch (e) {
    return bad(401, 'AUTH_INVALID', 'Session tidak valid atau sudah kedaluwarsa.');
  }
};
