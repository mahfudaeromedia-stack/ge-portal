
'use strict';

const { bad, ok, requireActor, safeProfile, hasUserManagementPermission, userManagementScopeAllowed, USER_MANAGEMENT_ROLES, USER_ACCESS_LEVELS, USER_MODULES, defaultUserPermissions, normalizeAccessLevel, validateUserScopeShape } = require('./_firebase');

const ROLES = USER_MANAGEMENT_ROLES;
const LEGACY_ROLES = ['Admin','Staff','Lounge Staff','Lounge Luar Biasa','Viewer'];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return bad(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
  try {
    const { auth, db, actor } = await requireActor(event);
    const body = JSON.parse(event.body || '{}');
    const uid = String(body.userId || '');
    if (!uid) return bad(400, 'INVALID_USER', 'User ID wajib diisi.');
    if (uid === actor.id && body.role && body.role !== actor.role) return bad(400, 'SELF_ROLE_CHANGE', 'Role akun yang sedang digunakan tidak dapat diubah.');
    const targetRef = db.collection('users').doc(uid);
    const snap = await targetRef.get();
    if (!snap.exists) return bad(404, 'USER_NOT_FOUND', 'User tidak ditemukan.');
    const current = snap.data();
    const roleProvided = Object.prototype.hasOwnProperty.call(body, 'role') && String(body.role || '').trim() !== '';
    const role = String(roleProvided ? body.role : (current.role || '')).trim();
    const roleChanged = roleProvided && role !== String(current.role || '').trim();
    const accessLevel = normalizeAccessLevel(body.accessLevel ?? current.accessLevel, role);
    if (current.role === 'Super Admin') return bad(403, 'ROLE_PROTECTED', 'Super Admin adalah role terlindungi dan tidak dapat diedit melalui User Management.');
    if (role === 'Super Admin') return bad(403, 'ROLE_PROTECTED', 'Super Admin adalah role terlindungi dan tidak dapat ditetapkan melalui User Management.');
    if (!ROLES.includes(role) && !(LEGACY_ROLES.includes(role) && !roleChanged)) return bad(400, 'INVALID_ROLE', 'Role hanya dapat dikoreksi ke Role organisasi yang didukung.');
    if (roleChanged && !ROLES.includes(role)) return bad(400, 'INVALID_ROLE', 'Legacy Role hanya dapat dipertahankan tanpa perubahan atau dikoreksi ke Role organisasi yang didukung.');
    if (body.accessLevel && !USER_ACCESS_LEVELS.includes(String(body.accessLevel).trim())) return bad(400, 'INVALID_ACCESS_LEVEL', 'Access Level tidak valid.');
    if (!hasUserManagementPermission(actor)) return bad(403, 'USER_MANAGEMENT_PERMISSION_REQUIRED', 'Akun tidak memiliki permission User Management.');
    if (actor.role !== 'Super Admin' && (String(current.accessLevel||'') === 'Admin' || current.role === 'Admin')) return bad(403, 'ADMIN_PEER_PROTECTED', 'Admin HO tidak dapat mengubah akun admin lain.');
    const requestedScopeType = String(body.scopeType ?? current.scopeType ?? 'CUSTOM').trim();
    const scopeAirports = body.airports ?? current.airports;
    const scopeShapeError = validateUserScopeShape(requestedScopeType, scopeAirports);
    if (scopeShapeError && !(!Object.prototype.hasOwnProperty.call(body, 'scopeType') && ['AIRPORT','LOUNGE','CUSTOM'].includes(String(requestedScopeType).toUpperCase()))) return bad(400, 'INVALID_SCOPE', scopeShapeError);
    if (!userManagementScopeAllowed(actor, requestedScopeType, scopeAirports, body.loungeIds ?? current.loungeIds)) return bad(403, 'OUT_OF_SCOPE', 'User yang dikelola berada di luar scope User Management Anda.');

    const status = String(body.status || current.status || 'Active') === 'Inactive' ? 'Inactive' : 'Active';
    const organizationType = String(body.organizationType ?? current.organizationType ?? 'Internal').trim() || 'Internal';
    if (!['Internal','External'].includes(organizationType)) return bad(400, 'INVALID_ORGANIZATION_TYPE', 'Organization Type harus Internal atau External.');
    if (organizationType === 'External' && !['Viewer','Editor'].includes(accessLevel)) return bad(403, 'EXTERNAL_ACCESS_RESTRICTED', 'External hanya dapat memiliki access level Viewer atau Editor.');
    const fullName = String(body.fullName ?? current.name ?? '').trim();
    const employeeNo = String(body.employeeNo ?? current.employeeNo ?? '').trim();
    const unit = String(body.unit ?? current.unit ?? '').trim();
    const usernameProvided = Object.prototype.hasOwnProperty.call(body, 'username');
    const username = String(usernameProvided ? body.username : (current.username || '')).trim().toLowerCase();
    if (usernameProvided && username !== String(current.username || '').trim().toLowerCase()) {
      if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username)) return bad(400, 'INVALID_USERNAME', 'Username baru harus 3-64 karakter dan hanya boleh a-z, 0-9, titik, underscore, atau tanda minus.');
      const duplicate = await db.collection('users').where('username', '==', username).limit(1).get();
      if (!duplicate.empty && duplicate.docs[0].id !== uid) return bad(409, 'USERNAME_EXISTS', 'Username sudah digunakan akun lain.');
    }
    if (!fullName) return bad(400, 'INVALID_NAME', 'Employee Name wajib diisi.');
    if (!employeeNo) return bad(400, 'INVALID_EMPLOYEE_NO', 'Employee Number wajib diisi.');
    if (!unit) return bad(400, 'INVALID_UNIT', 'Unit / Department wajib diisi.');
    const patch = {
      name: fullName,
      employeeNo,
      username: username || current.username || '',
      role,
      accessLevel,
      organizationType,
      userManagementEnabled: actor.role==='Super Admin' ? (body.userManagementEnabled===true && ['Head Office','GE Team','Ground Experience Team'].includes(role) && accessLevel==='Admin') : !!current.userManagementEnabled,
      permissions: organizationType === 'External' ? ['initiatives','support'] : (Array.isArray(body.permissions) && body.permissions.length ? body.permissions.map(String).filter(x => USER_MODULES.includes(x)) : (Array.isArray(current.permissions) && current.permissions.length ? current.permissions : defaultUserPermissions(role))),
      unit,
      scopeType: String(body.scopeType ?? current.scopeType ?? 'CUSTOM'),
      airports: Array.isArray(body.airports) ? body.airports.map(x => String(x).trim().toUpperCase()).filter(Boolean) : (current.airports || []),
      loungeIds: Array.isArray(body.loungeIds) ? body.loungeIds.map(String) : (current.loungeIds || []),
      tabs: organizationType === 'External' ? ['initiatives','support'] : (Array.isArray(body.tabs) && body.tabs.length ? body.tabs.map(String) : (Array.isArray(current.tabs) && current.tabs.length ? current.tabs : defaultUserPermissions(role))),
      status,
      updatedAt: new Date().toISOString()
    };
    await auth.updateUser(uid, { disabled: status === 'Inactive', displayName: patch.name || current.username });
    try {
      await db.runTransaction(async tx => {
        tx.update(targetRef, patch);
        tx.create(db.collection('auditLogs').doc(), {
          actorId: actor.id, actorRole: actor.role, targetUserId: uid,
          action: current.status !== status ? (status === 'Inactive' ? 'DISABLE_USER' : 'ENABLE_USER') : (current.role !== role ? 'CHANGE_ROLE' : 'CHANGE_SCOPE'),
          timestamp: new Date().toISOString(), result: 'SUCCESS'
        });
      });
    } catch (e) {
      try { await auth.updateUser(uid, { disabled: current.status === 'Inactive', displayName: current.name || current.username }); }
      catch (rollbackError) { console.error('auth-update-user rollback failed:', rollbackError.message); }
      throw e;
    }
    return ok({ profile: safeProfile({ id: uid, ...current, ...patch }) });
  } catch (e) {
    console.error('auth-update-user failed:', e.message);
    return bad(e.statusCode || 500, e.code || 'UPDATE_USER_FAILED', e.statusCode ? e.message : 'User gagal diperbarui.');
  }
};
