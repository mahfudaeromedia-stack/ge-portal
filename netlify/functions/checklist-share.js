'use strict';
const crypto = require('crypto');
const { bad, ok, bearer, firebase } = require('./_firebase');
const { getStorage } = require('firebase-admin/storage');

const WORKS = 'monitoringWorks';
const SUBMISSIONS = 'formSubmissions';
const SHARES = 'checklistShares';
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function ref(db, collection, id) { return db.collection('portalData').doc(collection).collection('records').doc(id); }
function hashToken(token) { return crypto.createHash('sha256').update(String(token)).digest('hex'); }
function token() { return crypto.randomBytes(32).toString('base64url'); }
function id() { return crypto.randomUUID(); }
function clean(v, n = 240) { const s = String(v ?? '').trim(); return s.length > n ? s.slice(0, n) : s; }
function active(profile) { return String(profile?.status || 'Active').toLowerCase() !== 'inactive'; }

async function actor(event) {
  const t = bearer(event);
  if (!t) throw Object.assign(new Error('Authentication required.'), { statusCode: 401, code: 'AUTH_REQUIRED' });
  const { auth, db } = firebase();
  let decoded;
  try { decoded = await auth.verifyIdToken(t, true); }
  catch { throw Object.assign(new Error('Invalid or expired authentication token.'), { statusCode: 401, code: 'AUTH_INVALID' }); }
  const snap = await db.collection('users').doc(decoded.uid).get();
  if (!snap.exists) throw Object.assign(new Error('User profile not found.'), { statusCode: 403, code: 'PROFILE_NOT_FOUND' });
  const profile = { ...snap.data(), uid: decoded.uid };
  if (!active(profile)) throw Object.assign(new Error('Account inactive.'), { statusCode: 403, code: 'ACCOUNT_INACTIVE' });
  if (!(profile.role === 'Super Admin' || profile.role === 'Admin' || String(profile.accessLevel || '') === 'Admin' || String(profile.accessLevel || '') === 'Editor')) {
    throw Object.assign(new Error('Editor/Admin access required.'), { statusCode: 403, code: 'FORBIDDEN' });
  }
  return { db, profile };
}

function visible(field, answers) {
  return !field?.showIf?.fieldId || String(answers?.[field.showIf.fieldId] ?? '') === String(field.showIf.equals ?? '');
}
function evaluate(template, answers) {
  if (template.category !== 'Assessment') return { result: null, findings: [] };
  let earned = 0, total = 0; const findings = [];
  for (const section of template.sections || []) for (const field of section.fields || []) {
    if (!visible(field, answers)) continue;
    const value = answers[field.id];
    if (value === '' || value == null || value === 'N/A' || Array.isArray(value)) continue;
    const pass = field.passValue !== '' && field.passValue != null
      ? (['number','currency','numeric_scale','rating','score'].includes(field.type) ? Number(value) >= Number(field.passValue) : String(value) === String(field.passValue))
      : null;
    if (pass === null) continue;
    const weight = Number(field.weight) || 1; total += weight;
    if (pass) earned += weight;
    else findings.push({ fieldId: field.id, label: field.label, journey: field.journey || '', touchpointId: field.touchpointId || '', pillar: field.pillar || '', requirementRef: field.requirementRef || '', answer: value });
  }
  return { result: total ? Math.round(earned / total * 100) : null, findings };
}

async function publicShare(db, rawToken) {
  const h = hashToken(rawToken);
  const snap = await db.collection('portalData').doc(SHARES).collection('records').where('tokenHash', '==', h).limit(1).get();
  if (snap.empty) throw Object.assign(new Error('Share link is invalid or expired.'), { statusCode: 404, code: 'SHARE_NOT_FOUND' });
  const share = snap.docs[0].data();
  if (share.revokedAt) throw Object.assign(new Error('This share link has been revoked.'), { statusCode: 410, code: 'SHARE_REVOKED' });
  if (share.expiresAt && Date.parse(share.expiresAt) <= Date.now()) throw Object.assign(new Error('This share link has expired.'), { statusCode: 410, code: 'SHARE_EXPIRED' });
  const workSnap = await ref(db, WORKS, share.workId).get();
  if (!workSnap.exists) throw Object.assign(new Error('Checklist work is no longer available.'), { statusCode: 404, code: 'WORK_NOT_FOUND' });
  const work = workSnap.data();
  const template = work.formSnapshot;
  if (!template) throw Object.assign(new Error('Published checklist version is unavailable.'), { statusCode: 409, code: 'FORM_SNAPSHOT_MISSING' });
  const touchpointIds = [...new Set((template.sections || []).flatMap(s => s.fields || []).map(f => f.touchpointId).filter(Boolean).map(String))];
  let touchpoints = [];
  if (touchpointIds.length) {
    const snaps = await db.collection('portalData').doc('touchpoints').collection('records').get();
    touchpoints = snaps.docs.map(d => ({ id: d.id, ...(d.data() || {}) })).filter(x => touchpointIds.includes(String(x.id)));
  }
  return { share, work: { id: workSnap.id, title: work.title || '', stationCode: work.stationCode || '', dueDate: work.dueDate || '', templateId: work.templateId || '', templateVersion: work.templateVersion || 0 }, template, touchpoints };
}

async function handleGuestSubmit(db, payload) {
  const { share, work, template } = await publicShare(db, payload.token);
  const accessMode = String(share.accessMode || share.accessType || 'GUEST').toUpperCase(); if (!['GUEST','BOTH'].includes(accessMode)) throw Object.assign(new Error('This link requires an authenticated website user.'), { statusCode: 401, code: 'LOGIN_REQUIRED' });
  const answers = payload.answers && typeof payload.answers === 'object' ? payload.answers : {};
  for (const field of (template.sections || []).flatMap(s => s.fields || [])) {
    if (!visible(field, answers)) continue;
    const value = answers[field.id];
    if (field.required && (value === '' || value == null || (Array.isArray(value) && !value.length))) {
      throw Object.assign(new Error(`Complete: ${field.label}`), { statusCode: 400, code: 'REQUIRED_FIELD' });
    }
  }
  const result = evaluate(template, answers);
  const guest = payload.guest && typeof payload.guest === 'object' ? payload.guest : {}; if(share.requireName && !clean(guest.name,160)) throw Object.assign(new Error('Name is required for this checklist.'),{statusCode:400,code:'NAME_REQUIRED'}); if(share.requireEmail && !clean(guest.email,240)) throw Object.assign(new Error('Email is required for this checklist.'),{statusCode:400,code:'EMAIL_REQUIRED'});
  const submissionId = id();
  const storage = getStorage().bucket();
  const normalizedAnswers = { ...answers };
  for (const field of (template.sections || []).flatMap(s => s.fields || [])) {
    const value = normalizedAnswers[field.id];
    if (!value || typeof value !== 'object' || !value.__fileBase64) continue;
    const b64 = String(value.__fileBase64);
    const buf = Buffer.from(b64, 'base64');
    if (buf.length > MAX_FILE_BYTES) throw Object.assign(new Error('Maximum evidence file size is 5 MB.'), { statusCode: 413, code: 'FILE_TOO_LARGE' });
    const safeName = clean(value.name || 'evidence', 160).replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `monitoring/${work.stationCode || 'shared'}/guest/${submissionId}-${safeName}`;
    await storage.file(key).save(buf, { metadata: { contentType: clean(value.type || 'application/octet-stream', 120), metadata: { originalName: safeName, accessType: 'GUEST', shareId: share.id || '' } } });
    normalizedAnswers[field.id] = { key, name: safeName, type: value.type || 'application/octet-stream', size: buf.length };
  }
  const submission = {
    id: submissionId, submissionId, instanceId: work.id, workId: work.id, workTitle: work.title, stationCode: work.stationCode,
    templateId: work.templateId, templateVersion: work.templateVersion, formSnapshot: template,
    category: template.category, answers: normalizedAnswers, ...result,
    submittedAt: new Date().toISOString(), startedAt: work.startedAt || work.createdAt || new Date().toISOString(), status:'Submitted', accessType: 'GUEST',
    submittedBy: {uid:'',displayName:clean(guest.name,160)||'Guest',email:clean(guest.email,240),role:'Guest',accessLevel:''},
    submittedByUid: '', submittedByName: clean(guest.name, 160) || 'Guest', submittedByEmail: clean(guest.email, 240),
    source:'monitoring-assessment', sourceFormId: template.id || work.templateId || '', sourceFormVersion:Number(work.templateVersion || template.currentVersion || 0),
    assessmentContext:{formId:template.id||work.templateId||'',formVersion:Number(work.templateVersion||template.currentVersion||0),journeyScopes:Array.isArray(template.journeyScopes)?template.journeyScopes:[],touchpointIds:Array.isArray(template.touchpointIds)?template.touchpointIds:[],assessmentIndicator:template.assessmentIndicator||'',source:'monitoring-assessment'},
    findings: result.findings.map(f=>({...f,source:'monitoring-assessment',sourceFormId:template.id||work.templateId||'',sourceFormVersion:Number(work.templateVersion||template.currentVersion||0),assessmentContext:{formId:template.id||work.templateId||'',formVersion:Number(work.templateVersion||template.currentVersion||0),journeyScopes:Array.isArray(template.journeyScopes)?template.journeyScopes:[],touchpointIds:Array.isArray(template.touchpointIds)?template.touchpointIds:[],assessmentIndicator:template.assessmentIndicator||'',source:'monitoring-assessment'},status:'Open'})),
    shareId: share.id || '', shareTokenVersion: 1
  };
  await ref(db, SUBMISSIONS, submissionId).set(submission);
  return { submissionId, result: submission.result, findings: submission.findings.length, submittedByName: submission.submittedByName };
}

exports.handler = async event => {
  try {
    const method = event.httpMethod || 'GET';
    let body = {};
    if (event.body) { try { body = JSON.parse(event.body); } catch { return bad(400, 'INVALID_JSON', 'Invalid JSON.'); } }
    const queryToken = event.queryStringParameters?.token || body.token || '';
    const { db } = firebase();

    if (method === 'GET') {
      if (!queryToken) return bad(400, 'TOKEN_REQUIRED', 'Share token is required.');
      const payload = await publicShare(db, queryToken);
      return ok({ ok: true, accessType: payload.share.accessType || 'GUEST', shareId: payload.share.id || '', work: payload.work, template: payload.template, touchpoints: payload.touchpoints || [] });
    }

    if (method === 'POST' && body.action === 'SUBMIT_GUEST') {
      if (!queryToken) return bad(400, 'TOKEN_REQUIRED', 'Share token is required.');
      return ok({ ok: true, ...(await handleGuestSubmit(db, body)) });
    }

    if (method === 'POST' && body.action === 'CREATE') {
      const { profile } = await actor(event);
      const workId = clean(body.workId, 180); if (!workId) return bad(400, 'WORK_REQUIRED', 'Monitoring Work is required.');
      const workSnap = await ref(db, WORKS, workId).get();
      if (!workSnap.exists) return bad(404, 'WORK_NOT_FOUND', 'Monitoring Work not found.');
      const work = workSnap.data();
      const accessType = String(body.accessType || 'GUEST').toUpperCase() === 'USER' ? 'USER' : 'GUEST';
      const accessMode = String(body.accessMode || accessType).toUpperCase()==='BOTH'?'BOTH':accessType;
      const requireName = !!body.requireName, requireEmail = !!body.requireEmail;
      const raw = token(), shareId = id();
      const expiresAt = body.expiresAt ? new Date(body.expiresAt).toISOString() : '';
      await ref(db, SHARES, shareId).set({ id: shareId, workId, accessType, accessMode, requireName, requireEmail, tokenHash: hashToken(raw), createdAt: new Date().toISOString(), createdBy: profile.uid, createdByName: profile.name || profile.displayName || profile.email || '', expiresAt, revokedAt: '' });
      return ok({ ok: true, shareId, token: raw, accessType, expiresAt, work: { id: workSnap.id, title: work.title || '', stationCode: work.stationCode || '', dueDate: work.dueDate || '' } });
    }

    return bad(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
  } catch (e) {
    return bad(e.statusCode || 500, e.code || 'CHECKLIST_SHARE_ERROR', e.message || 'Checklist share request failed.');
  }
};
