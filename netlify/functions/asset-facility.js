'use strict';

const { bad, ok, bearer, firebase } = require('./_firebase');

const READ_ROLES = ['Super Admin', 'Admin', 'Management', 'Head Office', 'GE Team', 'Branch Office'];
const CONFIG = require('../../assets/p39-asset-config.json');
const FACILITY_TYPES = new Set(['Lounge', ...CONFIG.facilityTypes]);
const OWNERSHIP_VALUES = new Set(CONFIG.ownership);
const CATEGORY_VALUES = new Set(CONFIG.categories);
const CONDITION_VALUES = new Set(CONFIG.conditions);
const STATUS_VALUES = new Set(CONFIG.operationalStatuses);
const TRACKING_VALUES = new Set(CONFIG.trackingModes);
const UNIT_VALUES = new Set(CONFIG.units);
const EDIT_LEVELS = new Set(['Editor', 'Admin']);

async function recordAudit(db, actor, action, targetId, result = 'SUCCESS') {
  await db.collection('portalData').doc('auditLogs').collection('records').add({
    actorId: actor.id,
    actorRole: actor.role,
    targetUserId: '',
    targetType: 'P39_ASSET_FACILITY',
    targetId: String(targetId || ''),
    action,
    timestamp: new Date().toISOString(),
    result
  });
}
async function assetHistory(db, assetId) {
  if (!assetId) return [];
  try {
    const snap = await db.collection('portalData').doc('auditLogs').collection('records').where('targetType', '==', 'P39_ASSET_FACILITY').limit(100).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => String(x.targetId || '') === String(assetId)).sort((a,b) => String(b.timestamp || '').localeCompare(String(a.timestamp || ''))).slice(0,30);
  } catch (e) {
    return [];
  }
}

function clean(v, max = 240) {
  const s = String(v ?? '').trim();
  if (s.length > max) throw Object.assign(new Error('Input terlalu panjang.'), { code: 'INVALID_INPUT' });
  return s;
}
function upper(v, max = 12) { return clean(v, max).toUpperCase(); }
function idSafe(v) { return clean(v, 180); }
function canRead(actor) { return READ_ROLES.includes(actor?.role) && String(actor?.status || 'Active').toLowerCase() === 'active'; }
function canEdit(actor) {
  if (!canRead(actor)) return false;
  if (actor.role === 'Super Admin') return true;
  return EDIT_LEVELS.has(String(actor.accessLevel || 'Viewer'));
}
function assignedStations(actor) {
  if (actor.role === 'Super Admin' || String(actor.scopeType || '').toUpperCase() === 'ALL') return null;
  return new Set((Array.isArray(actor.airports) ? actor.airports : []).map(x => String(x).trim().toUpperCase()).filter(Boolean));
}
function stationAllowed(actor, stationCode) {
  const code = String(stationCode || '').trim().toUpperCase();
  if (!code) return false;
  const allowed = assignedStations(actor);
  return !allowed || allowed.has(code);
}
function ensureEditPermission(actor) {
  if (!canEdit(actor)) throw Object.assign(new Error('Asset/Facility memerlukan Access Level Editor atau Admin.'), { statusCode: 403, code: 'FORBIDDEN' });
}
function ensureStation(actor, code) {
  if (!stationAllowed(actor, code)) throw Object.assign(new Error('Station berada di luar scope akun.'), { statusCode: 403, code: 'SCOPE_FORBIDDEN' });
}
function normalizeLounge(id, data, stationCode) {
  const rawAirport = data.airport ?? data.station ?? data.stationCode ?? '';
  const codes = String(rawAirport || '').split(/[\/,;\s]+/).map(x => x.trim().toUpperCase()).filter(Boolean);
  const code = stationCode || (codes.length === 1 ? codes[0] : '');
  if (!code) return null;
  return {
    id: String(id),
    stationCode: code,
    name: clean(data.name || data.serviceName || `Lounge ${id}`, 180),
    serviceType: clean(data.serviceType || data.serviceCategory || 'Lounge', 80) || 'Lounge',
    status: clean(data.status || data.documentStatus || 'Active', 60) || 'Active',
    source: 'Existing lounges collection'
  };
}
function toDateString(v) {
  const s = clean(v, 10);
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw Object.assign(new Error('Tanggal harus YYYY-MM-DD.'), { code: 'INVALID_DATE' });
  return s;
}
function validateAsset(body, existing = null) {
  const trackingMode = String(body.trackingMode || existing?.trackingMode || 'QUANTITY').toUpperCase();
  if (!TRACKING_VALUES.has(trackingMode)) throw Object.assign(new Error('Tracking Mode tidak valid.'), { code: 'INVALID_INPUT' });
  const stationCode = upper(body.stationCode ?? existing?.stationCode, 8);
  if (!stationCode) throw Object.assign(new Error('Station wajib diisi.'), { code: 'INVALID_INPUT' });
  const assetName = clean(body.assetName ?? existing?.assetName, 180);
  if (!assetName) throw Object.assign(new Error('Asset Name wajib diisi.'), { code: 'INVALID_INPUT' });
  const category = clean(body.category ?? existing?.category, 80);
  if (!CATEGORY_VALUES.has(category)) throw Object.assign(new Error('Asset Category tidak valid.'), { code: 'INVALID_INPUT' });
  const ownership = clean(body.ownership ?? existing?.ownership, 80);
  if (!OWNERSHIP_VALUES.has(ownership)) throw Object.assign(new Error('Ownership tidak valid.'), { code: 'INVALID_INPUT' });
  const quantity = Number(body.quantity ?? existing?.quantity ?? 1);
  if (!Number.isInteger(quantity) || quantity <= 0) throw Object.assign(new Error('Quantity harus berupa bilangan bulat lebih besar dari 0.'), { code: 'INVALID_INPUT' });
  const unit = clean(body.unit ?? existing?.unit ?? 'unit', 20).toLowerCase();
  if (!UNIT_VALUES.has(unit)) throw Object.assign(new Error('Unit tidak valid.'), { code: 'INVALID_INPUT' });
  const condition = clean(body.condition ?? existing?.condition, 60);
  if (!CONDITION_VALUES.has(condition)) throw Object.assign(new Error('Condition tidak valid.'), { code: 'INVALID_INPUT' });
  const operationalStatus = clean(body.operationalStatus ?? existing?.operationalStatus, 80);
  if (!STATUS_VALUES.has(operationalStatus)) throw Object.assign(new Error('Operational Status tidak valid.'), { code: 'INVALID_INPUT' });
  const facilityType = clean(body.facilityType ?? existing?.facilityType, 80);
  const facilityId = clean(body.facilityId ?? existing?.facilityId, 180);
  const loungeId = clean(body.loungeId ?? existing?.loungeId, 180);
  if (!FACILITY_TYPES.has(facilityType)) throw Object.assign(new Error('Facility Type tidak valid.'), { code: 'INVALID_LOCATION' });
  if (facilityType === 'Lounge') {
    if (!loungeId) throw Object.assign(new Error('Existing Lounge wajib dipilih.'), { code: 'INVALID_LOCATION' });
  } else if (!facilityId) {
    throw Object.assign(new Error('Facility / Service Location wajib dipilih.'), { code: 'INVALID_LOCATION' });
  }
  if (trackingMode === 'INDIVIDUAL' && !clean(body.assetTag ?? existing?.assetTag, 100)) {
    throw Object.assign(new Error('Asset Tag wajib untuk Individual Tracking.'), { code: 'INVALID_INPUT' });
  }
  return {
    ...(existing || {}),
    stationCode,
    facilityType,
    facilityId: facilityType === 'Lounge' ? null : facilityId,
    loungeId: facilityType === 'Lounge' ? loungeId : null,
    area: clean(body.area ?? existing?.area, 120),
    assetName,
    category,
    ownership,
    responsibleUnit: clean(body.responsibleUnit ?? existing?.responsibleUnit, 120),
    pic: clean(body.pic ?? existing?.pic, 120),
    trackingMode,
    assetTag: trackingMode === 'INDIVIDUAL' ? clean(body.assetTag ?? existing?.assetTag, 100) : '',
    serialNumber: trackingMode === 'INDIVIDUAL' ? clean(body.serialNumber ?? existing?.serialNumber, 120) : '',
    quantity,
    unit,
    condition,
    operationalStatus,
    acquisitionDate: toDateString(body.acquisitionDate ?? existing?.acquisitionDate),
    installationDate: toDateString(body.installationDate ?? existing?.installationDate),
    lastInspection: toDateString(body.lastInspection ?? existing?.lastInspection),
    evidenceRef: clean(body.evidenceRef ?? existing?.evidenceRef, 300),
    remarks: clean(body.remarks ?? existing?.remarks, 1000),
    lifecycleStatus: existing?.lifecycleStatus === 'Retired' ? 'Retired' : 'Active'
  };
}
async function getFacilities(db, actor) {
  const snap = await db.collection('portalData').doc('facilities').collection('records').get();
  const allowed = assignedStations(actor);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !allowed || allowed.has(String(x.stationCode || '').toUpperCase()));
}
async function getLoungeOptions(db, actor) {
  try {
    const snap = await db.collection('portalData').doc('lounges').collection('records').get();
    const allowed = assignedStations(actor);
    const out = [];
    snap.docs.forEach(d => {
      const data = d.data() || {};
      const codes = String(data.airport ?? data.station ?? data.stationCode ?? '').split(/[\/,;\s]+/).map(x => x.trim().toUpperCase()).filter(Boolean);
      codes.forEach(code => {
        if (!allowed || allowed.has(code)) {
          const x = normalizeLounge(d.id, data, code);
          if (x) out.push(x);
        }
      });
    });
    return out;
  } catch (e) {
    return [];
  }
}
async function getAssets(db, actor) {
  const snap = await db.collection('portalData').doc('assets').collection('records').get();
  const allowed = assignedStations(actor);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !allowed || allowed.has(String(x.stationCode || '').toUpperCase()));
}
async function ensureFacility(db, actor, facilityId) {
  const snap = await db.collection('portalData').doc('facilities').collection('records').doc(facilityId).get();
  if (!snap.exists) throw Object.assign(new Error('Facility tidak ditemukan.'), { statusCode: 400, code: 'FACILITY_NOT_FOUND' });
  const facility = { id: snap.id, ...snap.data() };
  ensureStation(actor, facility.stationCode);
  return facility;
}
async function ensureLounge(db, actor, loungeId, stationCode) {
  const snap = await db.collection('portalData').doc('lounges').collection('records').doc(String(loungeId)).get();
  if (!snap.exists) throw Object.assign(new Error('Lounge referensi tidak ditemukan pada existing Lounge Master.'), { statusCode: 400, code: 'LOUNGE_NOT_FOUND' });
  const x = normalizeLounge(snap.id, snap.data(), stationCode);
  if (!x || x.stationCode !== stationCode) throw Object.assign(new Error('Lounge tidak sesuai dengan Station.'), { statusCode: 400, code: 'LOUNGE_STATION_MISMATCH' });
  ensureStation(actor, stationCode);
  return x;
}
async function ensureUniqueAssetTag(db, stationCode, assetTag, id) {
  if (!assetTag) return;
  const snap = await db.collection('portalData').doc('assets').collection('records').where('assetTag', '==', assetTag).get();
  if (snap.docs.some(d => d.id !== id && String(d.data().stationCode || '').toUpperCase() === stationCode)) {
    throw Object.assign(new Error('Asset Tag sudah digunakan pada Station tersebut.'), { statusCode: 409, code: 'DUPLICATE_ASSET_TAG' });
  }
}
async function handleGet(event, actor, db) {
  const [assets, facilities, lounges] = await Promise.all([getAssets(db, actor), getFacilities(db, actor), getLoungeOptions(db, actor)]);
  const assetId = event.queryStringParameters?.assetId || '';
  let history = [];
  if (assetId) {
    const asset = assets.find(x => String(x.id) === String(assetId));
    if (asset) history = await assetHistory(db, assetId);
  }
  return ok({ assets, facilities, lounges, history, meta: { source: 'Firestore', assetCollection: 'geAssets', facilityCollection: 'geFacilities', scopeType: actor.scopeType || 'CUSTOM' } });
}
async function handleWrite(event, actor, db) {
  ensureEditPermission(actor);
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { throw Object.assign(new Error('Request body tidak valid.'), { statusCode: 400, code: 'INVALID_JSON' }); }
  const action = String(body.action || '').toUpperCase();
  if (!['CREATE_ASSET','UPDATE_ASSET','RETIRE_ASSET','CREATE_FACILITY','UPDATE_FACILITY'].includes(action)) {
    throw Object.assign(new Error('Action tidak didukung.'), { statusCode: 400, code: 'INVALID_ACTION' });
  }
  if (action === 'CREATE_FACILITY' || action === 'UPDATE_FACILITY') {
    const id = action === 'UPDATE_FACILITY' ? idSafe(body.id) : '';
    const existing = id ? await db.collection('portalData').doc('facilities').collection('records').doc(id).get() : null;
    if (action === 'UPDATE_FACILITY' && (!existing || !existing.exists)) throw Object.assign(new Error('Facility tidak ditemukan.'), { statusCode: 404, code: 'FACILITY_NOT_FOUND' });
    const prev = existing?.data() || {};
    const stationCode = upper(body.stationCode ?? prev.stationCode, 8);
    ensureStation(actor, stationCode);
    const facilityType = clean(body.facilityType ?? prev.facilityType, 80);
    if (!FACILITY_TYPES.has(facilityType) || facilityType === 'Lounge') throw Object.assign(new Error('Facility Type untuk record baru harus berupa non-Lounge Service Facility.'), { statusCode: 400, code: 'INVALID_FACILITY_TYPE' });
    const name = clean(body.name ?? prev.name, 180);
    if (!name) throw Object.assign(new Error('Facility Name wajib diisi.'), { statusCode: 400, code: 'INVALID_INPUT' });
    if (!STATUS_VALUES.has(clean(body.operationalStatus ?? prev.operationalStatus ?? 'In Service', 80))) throw Object.assign(new Error('Operational Status tidak valid.'), { statusCode: 400, code: 'INVALID_INPUT' });
    const next = {
      ...prev,
      stationCode,
      name,
      facilityType,
      terminal: clean(body.terminal ?? prev.terminal, 100),
      area: clean(body.area ?? prev.area, 120),
      zone: clean(body.zone ?? prev.zone, 120),
      operationalStatus: clean(body.operationalStatus ?? prev.operationalStatus ?? 'In Service', 80),
      remarks: clean(body.remarks ?? prev.remarks, 1000),
      lifecycleStatus: prev.lifecycleStatus === 'Retired' ? 'Retired' : 'Active',
      updatedAt: new Date().toISOString(),
      updatedBy: actor.id
    };
    if (action === 'CREATE_FACILITY') { next.createdAt = next.updatedAt; next.createdBy = actor.id; }
    const ref = id ? db.collection('portalData').doc('facilities').collection('records').doc(id) : db.collection('portalData').doc('facilities').collection('records').doc();
    await ref.set(next, { merge: true });
    await recordAudit(db, actor, action, ref.id);
    return ok({ facility: { id: ref.id, ...next } });
  }

  if (action === 'RETIRE_ASSET') {
    const id = idSafe(body.id);
    const ref = db.collection('portalData').doc('assets').collection('records').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw Object.assign(new Error('Asset tidak ditemukan.'), { statusCode: 404, code: 'ASSET_NOT_FOUND' });
    const prev = snap.data();
    ensureStation(actor, prev.stationCode);
    const next = { lifecycleStatus: 'Retired', operationalStatus: 'Inactive / Retired', updatedAt: new Date().toISOString(), updatedBy: actor.id, remarks: clean(body.remarks ?? prev.remarks, 1000) };
    await ref.set(next, { merge: true });
    await recordAudit(db, actor, action, ref.id);
    return ok({ asset: { id: ref.id, ...prev, ...next } });
  }

  const id = action === 'UPDATE_ASSET' ? idSafe(body.id) : '';
  const existingSnap = id ? await db.collection('portalData').doc('assets').collection('records').doc(id).get() : null;
  if (action === 'UPDATE_ASSET' && (!existingSnap || !existingSnap.exists)) throw Object.assign(new Error('Asset tidak ditemukan.'), { statusCode: 404, code: 'ASSET_NOT_FOUND' });
  const existing = existingSnap?.data() || null;
  if (existing) ensureStation(actor, existing.stationCode);
  const next = validateAsset(body, existing);
  ensureStation(actor, next.stationCode);
  if (next.facilityType === 'Lounge') await ensureLounge(db, actor, next.loungeId, next.stationCode);
  else await ensureFacility(db, actor, next.facilityId);
  await ensureUniqueAssetTag(db, next.stationCode, next.assetTag, id);
  if (next.trackingMode === 'INDIVIDUAL' && !next.assetTag) throw Object.assign(new Error('Asset Tag wajib untuk Individual Tracking.'), { statusCode: 400, code: 'INVALID_INPUT' });
  next.updatedAt = new Date().toISOString(); next.updatedBy = actor.id;
  if (!id) { next.createdAt = next.updatedAt; next.createdBy = actor.id; }
  if (next.trackingMode === 'INDIVIDUAL') next.quantity = 1;
  const ref = id ? db.collection('portalData').doc('assets').collection('records').doc(id) : db.collection('portalData').doc('assets').collection('records').doc();
  await ref.set(next, { merge: true });
  await recordAudit(db, actor, action, ref.id);
  return ok({ asset: { id: ref.id, ...next } });
}

exports.handler = async (event) => {
  if (!['GET', 'POST'].includes(event.httpMethod)) return bad(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
  try {
    const token = bearer(event);
    if (!token) return bad(401, 'AUTH_REQUIRED', 'Authentication required.');
    const { auth, db } = firebase();
    let decoded;
    try { decoded = await auth.verifyIdToken(token, true); }
    catch { return bad(401, 'AUTH_INVALID', 'Session tidak valid atau sudah kedaluwarsa.'); }
    const snap = await db.collection('users').doc(decoded.uid).get();
    if (!snap.exists) return bad(403, 'PROFILE_NOT_FOUND', 'User profile tidak ditemukan.');
    const actor = { id: decoded.uid, ...snap.data() };
    if (!canRead(actor)) return bad(403, 'FORBIDDEN', 'Asset/Facility tidak tersedia untuk akun ini.');
    if (event.httpMethod === 'GET') return await handleGet(event, actor, db);
    return await handleWrite(event, actor, db);
  } catch (e) {
    console.error('asset-facility failed:', e.message);
    return bad(e.statusCode || 500, e.code || 'ASSET_FACILITY_FAILED', e.statusCode ? e.message : 'Asset/Facility request gagal.');
  }
};
