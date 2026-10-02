
'use strict';

const { getApps, initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  }
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }
  throw new Error('Firebase Admin credentials are not configured.');
}

function firebase() {
  if (!getApps().length) initializeApp({ credential: cert(getServiceAccount()) });
  return { auth: getAuth(), db: getFirestore() };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
  };
}

function ok(body) { return json(200, body); }
function bad(statusCode, code, message) { return json(statusCode, { ok: false, code, message }); }

function bearer(event) {
  const h = event.headers || {};
  const value = h.authorization || h.Authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match ? match[1] : '';
}


const USER_MANAGEMENT_ROLES = ['Management', 'Head Office', 'Branch Office'];
const USER_ACCESS_LEVELS = ['Viewer', 'Editor', 'Approver', 'Admin'];
const USER_MODULES = ['home','services','network','readiness','initiatives','planning','budget','data','support'];
function defaultUserPermissions(role) {
  if (role === 'Management') return ['home','services','network','initiatives','planning','budget','support'];
  if (role === 'Head Office') return [...USER_MODULES];
  if (role === 'Branch Office') return ['home','services','initiatives','planning','data','support'];
  if (role === 'Super Admin' || role === 'Admin') return [...USER_MODULES];
  return ['home'];
}
function normalizeAccessLevel(value, role) {
  const level = String(value || '').trim();
  return USER_ACCESS_LEVELS.includes(level) ? level : (role === 'Super Admin' || role === 'Admin' ? 'Admin' : 'Viewer');
}

function hasUserManagementPermission(actor) {
  return actor?.role === 'Super Admin' || (['Head Office','GE Team','Ground Experience Team'].includes(actor?.role) && actor?.accessLevel === 'Admin');
}


async function requireActor(event, allowedRoles = ['Super Admin', 'Head Office', 'GE Team', 'Ground Experience Team']) {
  const token = bearer(event);
  if (!token) throw Object.assign(new Error('Authentication required.'), { statusCode: 401, code: 'AUTH_REQUIRED' });

  const { auth, db } = firebase();
  let decoded;
  try {
    decoded = await auth.verifyIdToken(token, true);
  } catch {
    throw Object.assign(new Error('Invalid or expired authentication token.'), { statusCode: 401, code: 'AUTH_INVALID' });
  }

  const snap = await db.collection('users').doc(decoded.uid).get();
  if (!snap.exists) throw Object.assign(new Error('User profile not found.'), { statusCode: 403, code: 'PROFILE_NOT_FOUND' });
  const actor = { id: decoded.uid, ...snap.data() };
  if (!allowedRoles.includes(actor.role) || actor.status === 'Inactive') {
    throw Object.assign(new Error('Insufficient permission.'), { statusCode: 403, code: 'FORBIDDEN' });
  }
  return { auth, db, actor, decoded };
}


function validateUserScopeShape(scopeType, airports = []) {
  const scope = String(scopeType || '').toUpperCase();
  const stations = Array.isArray(airports) ? airports.filter(Boolean) : [];
  if (!['ALL','STATION','MULTI_STATION'].includes(scope)) return 'Scope Type tidak valid.';
  if (scope === 'ALL' && stations.length) return 'Scope ALL tidak boleh memiliki Assigned Station.';
  if (scope === 'STATION' && stations.length !== 1) return 'Scope STATION harus memiliki tepat satu Assigned Station.';
  if (scope === 'MULTI_STATION' && stations.length < 1) return 'Scope MULTI_STATION harus memiliki minimal satu Assigned Station.';
  return '';
}

function userManagementScopeAllowed(actor, requestedScopeType, requestedAirports = [], requestedLoungeIds = []) {
  if (actor?.role === 'Super Admin') return true;
  if (!hasUserManagementPermission(actor)) return false;
  if (String(actor.scopeType || 'ALL') === 'ALL') return true;
  const actorAirports = new Set((Array.isArray(actor.airports) ? actor.airports : []).map(x => String(x).trim().toUpperCase()).filter(Boolean));
  const actorLounges = new Set((Array.isArray(actor.loungeIds) ? actor.loungeIds : []).map(String));
  const scope = String(requestedScopeType || 'CUSTOM').toUpperCase();
  if (scope === 'ALL') return false;
  const airports = (Array.isArray(requestedAirports) ? requestedAirports : []).map(x => String(x).trim().toUpperCase()).filter(Boolean);
  const lounges = (Array.isArray(requestedLoungeIds) ? requestedLoungeIds : []).map(String).filter(Boolean);
  if (airports.some(x => !actorAirports.has(x))) return false;
  if (lounges.some(x => !actorLounges.has(x))) return false;
  if (['STATION','MULTI_STATION','AIRPORT'].includes(scope) && !airports.length && !actorAirports.size) return false;
  if (scope === 'LOUNGE' && !lounges.length && !actorLounges.size) return false;
  return true;
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function validatePassword(password, username, email) {
  const p = String(password || '');
  if (!p) return 'Temporary password wajib diisi.';
  if (p.length < 10) return 'Temporary password minimal 10 karakter.';
  if (p.length > 128) return 'Password terlalu panjang.';
  if (/\s/.test(p)) return 'Password tidak boleh mengandung spasi.';
  const u = normalizeUsername(username);
  const e = String(email || '').trim().toLowerCase();
  if (u && p.toLowerCase() === u) return 'Password tidak boleh sama dengan username.';
  if (e && p.toLowerCase() === e) return 'Password tidak boleh sama dengan email.';
  if (e && p.toLowerCase() === e.split('@')[0]) return 'Password tidak boleh sama dengan bagian awal email.';
  return '';
}

function safeProfile(data) {
  const out = { ...data };
  delete out.password;
  delete out.passwordHash;
  delete out.temporaryPassword;
  return out;
}

async function audit(db, { actor, targetUserId, action, result }) {
  await db.collection('auditLogs').add({
    actorId: actor.id,
    actorRole: actor.role,
    targetUserId: targetUserId || '',
    action,
    timestamp: FieldValue.serverTimestamp(),
    result
  });
}

module.exports = {
  firebase, json, ok, bad, requireActor, bearer, normalizeUsername,
  validatePassword, safeProfile, audit, hasUserManagementPermission, userManagementScopeAllowed, USER_MANAGEMENT_ROLES, USER_ACCESS_LEVELS, USER_MODULES, defaultUserPermissions, normalizeAccessLevel, validateUserScopeShape
};
