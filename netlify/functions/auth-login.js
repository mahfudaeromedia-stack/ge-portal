
'use strict';

const { firebase, json, bad, normalizeUsername, safeProfile } = require('./_firebase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return bad(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
  try {
    const { auth, db } = firebase();
    const body = JSON.parse(event.body || '{}');
    const identifier = String(body.identifier || body.username || body.email || '').trim();
    const password = String(body.password || '');

    if (!identifier || !password) return bad(400, 'INVALID_INPUT', 'Username/email dan password wajib diisi.');
    const key = identifier.toLowerCase();

    let profileSnap;
    if (key.includes('@')) {
      const q = await db.collection('users').where('email', '==', key).limit(1).get();
      profileSnap = q.empty ? null : q.docs[0];
    } else {
      const idx = await db.collection('usernameIndex').doc(normalizeUsername(key)).get();
      if (idx.exists) profileSnap = await db.collection('users').doc(idx.data().uid).get();
      if (!profileSnap) {
        const q = await db.collection('users').where('username', '==', normalizeUsername(key)).limit(1).get();
        profileSnap = q.empty ? null : q.docs[0];
      }
    }
    if (!profileSnap || !profileSnap.exists) return bad(401, 'INVALID_CREDENTIALS', 'Username/email atau password tidak sesuai.');

    const profile = profileSnap.data();
    if (profile.status === 'Inactive') return bad(403, 'ACCOUNT_DISABLED', 'Akun tidak aktif.');

    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) return bad(503, 'FIREBASE_WEB_API_KEY_MISSING', 'Firebase Web API key belum dikonfigurasi.');

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: profile.email, password, returnSecureToken: true })
    });
    const authResult = await response.json();
    if (!response.ok) return bad(401, 'INVALID_CREDENTIALS', 'Username/email atau password tidak sesuai.');

    let decoded;
    try { decoded = await auth.verifyIdToken(authResult.idToken, true); }
    catch { return bad(401, 'AUTH_INVALID', 'Authentication token tidak valid.'); }
    if (decoded.uid !== profileSnap.id) return bad(403, 'PROFILE_MISMATCH', 'Profile authentication tidak sesuai.');

    return json(200, {
      ok: true,
      idToken: authResult.idToken,
      expiresIn: authResult.expiresIn,
      profile: safeProfile({ id: profileSnap.id, ...profile })
    });
  } catch (e) {
    console.error('auth-login failed:', e.message);
    return bad(500, 'AUTH_LOGIN_FAILED', 'Login gagal diproses.');
  }
};
