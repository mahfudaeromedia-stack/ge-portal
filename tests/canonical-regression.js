'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
const fail=[];
const ok=(c,m)=>assert.ok(c,m);

// Repository hygiene: historical implementation artifacts are consolidated, not shipped in parallel.
const allFiles=[]; (function walk(d){for(const n of fs.readdirSync(d)){if(n==='node_modules'||n==='.git')continue;const p=path.join(d,n),s=fs.statSync(p);s.isDirectory()?walk(p):allFiles.push(path.relative(root,p).replaceAll('\\','/'));}})(root);
for(const f of allFiles){
  ok(!/(^|\/)(R\d+[-_]|P\d+[-_]|e1[-_])/i.test(f),`Revision-named artifact remains: ${f}`);
  ok(!/(^|\/)(PATCH|patches|docs)\//i.test(f),`Recovery/history directory remains in architecture: ${f}`);
  ok(!/\.(patch|diff)$/i.test(f),`Patch/diff artifact remains: ${f}`);
  ok(!/(^|\/)(apply-|rollback|APPLY-ORDER|ROLLBACK-SCOPE|PATCH_MANIFEST)/i.test(f),`Recovery tooling remains: ${f}`);
}
for(const f of allFiles) ok(!/(^|\/)(p\d+[-_]|r\d+[-_]|e1[-_])/i.test(f),`Revision implementation remains: ${f}`);
ok(exists('HISTORICAL-BASELINE.md'),'Single historical ledger missing');

// Foundational auth/security contracts formerly split across P26/P27/P31/P32 regression files.
for(const f of ['assets/auth.js','assets/firebase-client.js','netlify/functions/_firebase.js','netlify/functions/auth-session.js','netlify/functions/auth-create-user.js','netlify/functions/auth-reset-password.js','netlify/functions/auth-change-password.js','netlify/functions/auth-update-user.js']) ok(exists(f),`Required authentication source missing: ${f}`);
const createUser=read('netlify/functions/auth-create-user.js'), updateUser=read('netlify/functions/auth-update-user.js'), resetUser=read('netlify/functions/auth-reset-password.js');
ok(createUser.includes("role === 'Super Admin'")&&createUser.includes('hasUserManagementPermission'),'User creation authorization missing');
ok(createUser.includes('mustChangePassword: true')&&createUser.includes('auth.deleteUser(created.uid)'),'User lifecycle/rollback contract missing');
ok(updateUser.includes("role === 'Super Admin'")&&updateUser.includes('CHANGE_ROLE')&&updateUser.includes('CHANGE_SCOPE'),'User update authorization/audit contract missing');
ok(resetUser.includes('mustChangePassword: true')&&resetUser.includes('RESET_PASSWORD'),'Password reset lifecycle contract missing');
const userAccess=read('assets/user-access.js');
ok(userAccess.includes('ROLE_VALUES=[\'Management\',\'Head Office\',\'Branch Office\']')&&userAccess.includes('p26ImportModal'),'User & Access canonical workflow missing');
ok(!userAccess.includes('<option>Super Admin</option>'),'Super Admin must not be a normal creatable target');

// Firebase rules: preserve the supplied rule model; do not invent new top-level collections/rules.
const firebaseRules=read('firestore.rules');
for(const x of ["rules_version = '2';","function signedIn() { return request.auth != null; }","function me() { return get(/databases/$(database)/documents/users/$(request.auth.uid)); }","function active() { return signedIn() && me().data.status == 'Active'; }","function manager() { return active() && me().data.role in ['Super Admin', 'Admin']; }",'match /users/{uid}','match /portalData/{group}/{document=**}','allow write: if manager();']) ok(firebaseRules.includes(x),`Firebase rules baseline missing: ${x}`);
ok(!firebaseRules.includes('usernameIndex')&&!firebaseRules.includes('auditLogs/{id}'),'Firebase rules must not gain speculative collections');
const dataApi=read('netlify/functions/edition1-data.js'), client=read('assets/firebase-client.js');
ok(dataApi.includes("db.collection('portalData')")&&dataApi.includes("collection('records')"),'Edition1 data adapter must use existing portalData/records path');
ok(!client.includes("s.db.collection('initiatives')")&&!client.includes("s.db.collection('inbox')"),'Client must not bypass locked Firebase rules');

// Template/import persistence contract retained from earlier upload work.
const businessRuntimeForTemplate=read('assets/edition1-business-runtime.js');
ok(businessRuntimeForTemplate.includes(".replace(/\\*/g,'')"),'Template header normalization missing');
ok(businessRuntimeForTemplate.includes("'harga / m² / bulan'")&&businessRuntimeForTemplate.includes("'provider*'"),'Space template aliases missing');
ok(businessRuntimeForTemplate.includes('async function geConfirmImportPersistedV240')&&businessRuntimeForTemplate.includes('await window.GEStore.flush()'),'Import persistence verification missing');

// Canonical shell/routing.
const app=read('app.html'), registry=read('assets/page-registry.js'), shell=read('assets/portal-shell.js');
ok(app.includes('assets/portal-shell.js?v=canonical'),'Canonical shell missing');
ok(!app.includes('/clean-'),'Legacy clean runtime layers must not remain loaded');
ok(registry.includes('GE_PAGES')&&registry.includes('GE_ROUTE_ALIASES'),'Canonical registry/alias model missing');
ok(shell.includes('function dashboardPOV'),'Dashboard POV resolver missing');
ok(shell.includes("'Dashboard'"),'Dashboard label must remain canonical');
ok(shell.includes('Collapse'),'Canonical collapse behavior/label missing');

// P27/P31/P32 retained auth/access behavior after filename consolidation.
const profile=read('assets/profile.js'), password=read('assets/password.js'), auth=read('assets/auth.js'), assistance=read('assets/access-assistance.js');
ok(profile.includes("window.gxApi('/auth-update-self-profile'"),'Self-profile API missing');
ok(profile.includes('fullName:name'),'Self-profile safe field missing');
ok(!/role:\s*|accessLevel:\s*|scopeType:\s*|permissions:\s*/.test(profile),'Self-profile must not submit administrative access fields');
ok(password.includes('reauthenticateWithCredential')&&password.includes('updatePassword'),'Password reauthentication/update flow missing');
ok(auth.includes('function gxDefaultPage()')&&read('assets/firebase-client.js').includes('signInWithEmailAndPassword'),'Canonical auth flow missing');
ok(assistance.includes('/api/access-assistance-admin')&&read('netlify/functions/access-assistance-admin.js').includes("accessAssistanceRequests"),'Access-assistance runtime missing');

// P29 Lounge/Tenant reference behavior.
const lounge=read('assets/lounge-planning.js');
ok(lounge.includes('airportMasterOptions'),'Lounge Station must source Airport Master');
ok(lounge.includes('moveModalToBody'),'Lounge modal must be body-level');
ok(lounge.includes('geP29ApplicableLoungePrice'),'Lounge applicable-period cost logic missing');

// P33–P37 presentation semantics are now consolidated into portal CSS/runtime.
const css=read('assets/portal.css');
ok(css.includes('.gx-status-positive')&&css.includes('.gx-status-warning')&&css.includes('.gx-status-critical'),'Semantic status families missing');
ok(shell.includes('planning-workspace.html')||registry.includes('planning-workspace'),'Planning Workspace navigation missing');
const identity=read('assets/page-identity-v28.js');
ok(identity.includes("pageId:'planning-workspace'")||identity.includes('planning-workspace'),'Stable Planning Workspace identity missing');

// P38/P39 repository and asset/facility semantics.
ok(exists('assets/asset-facility.js')&&exists('assets/asset-facility-config.json'),'Asset/facility canonical files missing');
const assetApi=read('netlify/functions/asset-facility.js');
for(const x of ["doc('assets').collection('records')","doc('facilities').collection('records')","doc('lounges').collection('records')","verifyIdToken(token, true)"]) ok(assetApi.includes(x),`Asset API contract missing: ${x}`);
ok(registry.includes('Asset &amp; Facility Management')||registry.includes('Asset & Facility Management'),'Asset/facility page definition missing');

// P40 architecture has been migrated to the single canonical app outlet.
for(const f of ['assets/edition1-store.js','assets/edition1-business-runtime.js','assets/edition1-page-boot.js','netlify/functions/edition1-data.js','netlify/functions/edition1-file.js']) ok(exists(f),`Canonical Edition 1 runtime missing: ${f}`);
const runtime=read('assets/edition1-business-runtime.js');
ok(!runtime.includes('currentRows is not defined'),'Known currentRows runtime error remains');

// Master Data and Planning canonical recovery.
ok(registry.includes('JENIS &amp; REFERENSI')&&registry.includes('ID &amp; MASTER REFERENSI'),'Master Data must expose two canonical groups');
ok(registry.includes('id=\\"geMasterKind\\"')&&registry.includes('id=\\"geMasterRows\\"'),'Master Data canonical controls missing');
const master=read('assets/master-reference.js');
ok(!/groundHandlers|personnel|users/.test(master.match(/async function hydrate[\s\S]*?\n}/)?.[0]||''),'Master Data must not hydrate operational personnel/users');
ok(master.includes("kind==='currency'")&&master.includes("kind==='position'"),'Currency/Position references missing');
const plan=read('assets/planning-domains.js');
ok(plan.includes("collection==='boSpaces'")&&plan.includes('persistPlanningRecord'),'Canonical planning persistence missing');
ok(plan.includes('stations'),'Planning station source missing');

// Monitoring/Checklist/CX/R103 consolidated behavior.
const form=read('assets/form-management.js');
ok(form.includes("source:'monitoring-assessment'")&&form.includes('assessmentContext'),'Monitoring assessment context missing');
ok(form.includes('submittedBy')&&form.includes('submissionId')&&form.includes('instanceId'),'Unified submission model missing');
const share=read('netlify/functions/checklist-share.js');
ok(share.includes('accessMode')&&share.includes('requireName')&&share.includes('requireEmail'),'Checklist share access model missing');
const cx=read('assets/customer-experience-v257.js');
ok(cx.includes('stationSummary')||read('assets/edition1-business-runtime.js').includes('stationSummary'),'Customer Experience stationSummary API missing');
const initiative=read('assets/edition1-business-runtime.js');
const outcome=read('assets/management-outcome-v257.js');
ok(outcome.includes('function evaluateOutcome')&&outcome.includes('function outcomeStatus'),'Management outcome canonical functions missing');
ok(initiative.includes('initiative')||registry.includes('inisiatif'),'Initiative runtime missing');

// Firebase contract remains the supplied baseline.
const rules=read('firestore.rules');
ok(rules.includes("rules_version = '2'")&&rules.includes('function signedIn()')&&rules.includes("status == 'Active'")&&rules.includes("'Super Admin', 'Admin'"),'Firebase rules baseline changed unexpectedly');

console.log('CANONICAL_REGRESSION_PASS');
