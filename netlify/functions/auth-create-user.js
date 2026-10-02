
'use strict';

const { bad, ok, requireActor, normalizeUsername, validatePassword, safeProfile, audit, hasUserManagementPermission, userManagementScopeAllowed, USER_MANAGEMENT_ROLES, USER_ACCESS_LEVELS, defaultUserPermissions, normalizeAccessLevel, validateUserScopeShape } = require('./_firebase');

const ROLES = USER_MANAGEMENT_ROLES;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return bad(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
  let actorCtx;
  try {
    actorCtx = await requireActor(event);
    const { auth, db, actor } = actorCtx;
    const body = JSON.parse(event.body || '{}');
    const username = normalizeUsername(body.username);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.temporaryPassword || '');
    const confirm = String(body.confirmTemporaryPassword || '');
    const role = String(body.role || '').trim();
    const accessLevel = normalizeAccessLevel(body.accessLevel, role);
    const status = String(body.status || 'Active') === 'Inactive' ? 'Inactive' : 'Active';

    if (role === 'Super Admin') return bad(403, 'ROLE_PROTECTED', 'Super Admin adalah role terlindungi dan tidak dapat dibuat melalui User Management.');
    if (!hasUserManagementPermission(actor)) return bad(403, 'USER_MANAGEMENT_PERMISSION_REQUIRED', 'Akun tidak memiliki permission User Management.');
    if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username)) return bad(400, 'INVALID_USERNAME', 'Username harus 3-64 karakter dan hanya boleh a-z, 0-9, titik, underscore, atau tanda minus.');
    if (!ROLES.includes(role)) return bad(400, 'INVALID_ROLE', 'Role tidak valid untuk akun baru.');
    const fullName = String(body.fullName || '').trim();
    const employeeNo = String(body.employeeNo || '').trim();
    const unit = String(body.unit || '').trim();
    const organizationType = String(body.organizationType || 'Internal').trim() || 'Internal';
    if (!fullName) return bad(400, 'INVALID_NAME', 'Employee Name wajib diisi.');
    if (!employeeNo) return bad(400, 'INVALID_EMPLOYEE_NO', 'Employee Number wajib diisi.');
    if (!unit) return bad(400, 'INVALID_UNIT', 'Unit / Department wajib diisi.');
    if (!['Internal','External'].includes(organizationType)) return bad(400, 'INVALID_ORGANIZATION_TYPE', 'Organization Type harus Internal atau External.');
    if (organizationType === 'External' && !['Viewer','Editor'].includes(accessLevel)) return bad(403, 'EXTERNAL_ACCESS_RESTRICTED', 'External hanya dapat memiliki access level Viewer atau Editor.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(400, 'INVALID_EMAIL', 'Email tidak valid.');
    if (body.accessLevel && !USER_ACCESS_LEVELS.includes(String(body.accessLevel).trim())) return bad(400, 'INVALID_ACCESS_LEVEL', 'Access Level tidak valid.');
    if (!hasUserManagementPermission(actor)) return bad(403, 'USER_MANAGEMENT_PERMISSION_REQUIRED', 'Akun tidak memiliki permission User Management.');
    const requestedScopeType = String(body.scopeType || '').trim() || (['Admin', 'Management'].includes(role) ? 'ALL' : role === 'Branch Office' ? 'STATION' : role === 'Head Office' ? 'MULTI_STATION' : role === 'Lounge Staff' || role === 'Lounge Luar Biasa' ? 'LOUNGE' : 'CUSTOM');
    const scopeShapeError = validateUserScopeShape(requestedScopeType, body.airports);
    if (scopeShapeError) return bad(400, 'INVALID_SCOPE', scopeShapeError);
    if (!userManagementScopeAllowed(actor, requestedScopeType, body.airports, body.loungeIds)) return bad(403, 'OUT_OF_SCOPE', 'User baru berada di luar scope User Management Anda.');
    if (password !== confirm) return bad(400, 'PASSWORD_MISMATCH', 'Konfirmasi temporary password tidak sama.');
    const passwordError = validatePassword(password, username, email);
    if (passwordError) return bad(400, 'INVALID_PASSWORD', passwordError);

    const indexRef = db.collection('usernameIndex').doc(username);
    const existingIndex = await indexRef.get();
    if (existingIndex.exists) return bad(409, 'DUPLICATE_USERNAME', 'Username sudah digunakan.');

    let created;
    try {
      created = await auth.createUser({
        email,
        password,
        displayName: String(body.fullName || '').trim() || username,
        disabled: status === 'Inactive'
      });

      const uid = created.uid;
      const profile = {
        username, email,
        name: fullName || username,
        employeeNo,
        role, accessLevel, organizationType, userManagementEnabled:actor.role==='Super Admin'&&body.userManagementEnabled===true&&['Head Office','GE Team','Ground Experience Team'].includes(role)&&accessLevel==='Admin', unit: String(body.unit || '').trim(),
        scopeType: requestedScopeType,
        airports: Array.isArray(body.airports) ? body.airports.map(x => String(x).trim().toUpperCase()).filter(Boolean) : [],
        loungeIds: Array.isArray(body.loungeIds) ? body.loungeIds.map(String) : [],
        tabs: organizationType === 'External' ? ['initiatives','support'] : (Array.isArray(body.tabs) ? body.tabs.map(String) : defaultUserPermissions(role)),
        permissions: organizationType === 'External' ? ['initiatives','support'] : (() => { const requested = Array.isArray(body.permissions) ? body.permissions.map(String).filter(x => USER_MODULES.includes(x)) : []; return requested.length ? requested : defaultUserPermissions(role); })(),
        status,
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.runTransaction(async tx => {
        const [idx, existingUser] = await Promise.all([
          tx.get(indexRef),
          tx.get(db.collection('users').doc(uid))
        ]);
        if (idx.exists || existingUser.exists) throw new Error('DUPLICATE_PROFILE');
        tx.set(db.collection('users').doc(uid), profile);
        tx.create(indexRef, { uid, username, createdAt: new Date().toISOString() });
        tx.create(db.collection('auditLogs').doc(), {
          actorId: actor.id, actorRole: actor.role, targetUserId: uid,
          action: 'CREATE_USER', timestamp: new Date().toISOString(), result: 'SUCCESS'
        });
      });

      return ok({ profile: safeProfile({ id: uid, ...profile }) });
    } catch (e) {
      if (e?.code === 'auth/email-already-exists') return bad(409, 'DUPLICATE_EMAIL', 'Email sudah digunakan.');
      if (created?.uid) {
        try { await auth.deleteUser(created.uid); }
        catch (rollbackError) { console.error('auth-create-user rollback failed:', rollbackError.message); }
      }
      if (e.message === 'DUPLICATE_PROFILE') return bad(409, 'DUPLICATE_USERNAME', 'Username sudah digunakan.');
      throw e;
    }
  } catch (e) {
    const status = e.statusCode || 500;
    if (actorCtx?.db && actorCtx?.actor && status >= 500) {
      try { await audit(actorCtx.db, { actor: actorCtx.actor, action: 'CREATE_USER', targetUserId: '', result: 'FAILURE' }); } catch {}
    }
    console.error('auth-create-user failed:', e.message);
    return bad(status, e.code || 'CREATE_USER_FAILED', status === 500 ? 'User gagal dibuat.' : e.message);
  }
};
