/* Ground Experience V2.57 P1.8 Regression Gate & Foundation Acceptance
   Read-only acceptance checks across P1.1-P1.7. Does not mutate business data. */
(function(){
'use strict';
const SCHEMA='2.57-P1.8';
const now=()=>new Date().toISOString();
const clone=x=>JSON.parse(JSON.stringify(x));
function result(id,group,label,status,detail,meta){return {id,group,label,status,detail:detail||'',meta:meta||{},at:now()}}
function unique(arr){return new Set(arr).size===arr.length}
function safe(fn){try{return {ok:true,value:fn()}}catch(e){return {ok:false,error:e&&e.message||String(e)}}}
function checkCore(){const out=[];
 if(!window.GECore){out.push(result('p11-engine','P1.1','Core Engine tersedia','FAIL','GECore tidak ditemukan.'));return out}
 const masters=['organizations','airports','terminals','stations','serviceLocations','lounges','tenants','snackBoxes','journeys','touchpoints','services','serviceStandards','capabilities','users','periods','sources','masterCategories'];
 out.push(result('p11-engine','P1.1','Core Engine tersedia','PASS',GECore.schemaVersion||''));
 const d=safe(()=>GECore.read());
 out.push(result('p11-store','P1.1','Core repository dapat dibaca',d.ok?'PASS':'FAIL',d.ok?'Repository readable.':d.error));
 const ids=[];let invalid=[];masters.forEach(m=>{const rows=safe(()=>GECore.list(m,{includeArchived:true}));if(rows.ok){rows.value.forEach(x=>{ids.push(x.id);if(!x.id||typeof x.id!=='string')invalid.push(`${m}:missing-id`)})}});
 out.push(result('p11-id','P1.1','Core ID stabil & unik',invalid.length===0&&unique(ids)?'PASS':'FAIL',invalid.length?invalid.join(', '):`${ids.length} Core IDs checked.`));
 const s=safe(()=>GECore.stats());
 const c=safe(()=>GECore.completeness());
 out.push(result('p11-completeness','P1.1','Core baseline master schema lengkap',c.ok&&c.value.missing.length===0?'PASS':'FAIL',c.ok?`Coverage ${c.value.coverage}%; missing ${c.value.missing.join(', ')||'none'}`:c.error));
 out.push(result('p11-bootstrap','P1.1','Core master bootstrap tersedia',s.ok&&s.value.stations&&s.value.airports?'PASS':'FAIL',s.ok?`Stations ${s.value.stations&&s.value.stations.total||0}; Airports ${s.value.airports&&s.value.airports.total||0}.`:s.error));
 return out}
function checkRelationship(){const out=[];if(!window.GERelationship){out.push(result('p12-engine','P1.2','Relationship Engine tersedia','FAIL','GERelationship tidak ditemukan.'));return out}
 out.push(result('p12-engine','P1.2','Relationship Engine tersedia','PASS',GERelationship.schemaVersion||''));
 const integ=safe(()=>GERelationship.integrity());
 out.push(result('p12-integrity','P1.2','Relationship referential integrity',integ.ok&&integ.value.valid?'PASS':'FAIL',integ.ok?`${integ.value.count} relationship; ${integ.value.issues.length} issue.`:integ.error));
 const types=Object.keys(GERelationship.types||{});out.push(result('p12-types','P1.2','Structured relationship registry',types.length>=6?'PASS':'WARN',`${types.length} relationship types registered.`));
 const rel=safe(()=>GERelationship.list({includeArchived:true}));
 if(rel.ok){const invalid=rel.value.filter(x=>x.validFrom&&x.validTo&&x.validFrom>x.validTo);out.push(result('p12-effective','P1.2','Effective dating relationship valid',invalid.length===0?'PASS':'FAIL',invalid.length?`${invalid.length} invalid period.`:'No invalid effective period.'))}
 return out}
function checkPublication(){const out=[];if(!window.GEPublication){out.push(result('p13-engine','P1.3','Publication Engine tersedia','FAIL','GEPublication tidak ditemukan.'));return out}
 out.push(result('p13-engine','P1.3','Source & Publication Engine tersedia','PASS',GEPublication.schemaVersion||''));
 const src=safe(()=>GEPublication.sources({includeInactive:true}));out.push(result('p13-source','P1.3','Source Registry tersedia',src.ok&&src.value.length>=3?'PASS':'WARN',src.ok?`${src.value.length} sources registered.`:src.error));
 const rows=safe(()=>GEPublication.list());if(rows.ok){const invalid=rows.value.filter(x=>x.publicationStatus==='Published'&&x.verificationStatus!=='Verified');out.push(result('p13-verify','P1.3','Published harus Verified',invalid.length===0?'PASS':'FAIL',invalid.length?`${invalid.length} published record belum verified.`:'No unverified Published records.'));
 const groups={};rows.value.filter(x=>x.publicationStatus==='Published').forEach(x=>{const k=`${x.objectType}|${x.objectId}`;(groups[k]=groups[k]||[]).push(x)});const dup=Object.values(groups).filter(a=>a.length>1).length;out.push(result('p13-singlepub','P1.3','Satu current Published per object',dup===0?'PASS':'FAIL',dup?`${dup} object mempunyai lebih dari satu Published.`:'Published uniqueness valid.'))}
 const states=GEPublication.states||[];out.push(result('p13-state','P1.3','Publication state model lengkap',['Draft','Pending Verification','Verified','Published','Superseded','Rejected'].every(s=>states.includes(s))?'PASS':'FAIL',states.join(' → ')));
 return out}
function checkPermission(){const out=[];if(!window.GEPermission){out.push(result('p14-engine','P1.4','Permission Engine tersedia','FAIL','GEPermission tidak ditemukan.'));return out}
 out.push(result('p14-engine','P1.4','Permission Engine tersedia','PASS',GEPermission.schemaVersion||''));
 const tests=[
  ['p14-sys','Super Admin dapat Configure System',{user:{role:'Super Admin',airports:['CGK']},domain:'System Configuration',action:'Configure',sensitivity:'Internal',context:{}},true],
  ['p14-noauto','Super Admin tidak otomatis Publish Core',{user:{role:'Super Admin',airports:['CGK']},domain:'Core Master',action:'Publish',sensitivity:'Internal',context:{}},false],
  ['p14-adminpub','Admin dengan authority dapat Publish Core',{user:{role:'Admin',airports:['CGK']},domain:'Core Master',action:'Publish',sensitivity:'Internal',context:{}},true],
  ['p14-boscope','BO SUB dapat View SUB',{user:{role:'Branch Office',airports:['SUB']},domain:'Core Master',action:'View',sensitivity:'Internal',context:{stationCode:'SUB'}},true],
  ['p14-boout','BO SUB tidak dapat View CGK',{user:{role:'Branch Office',airports:['SUB']},domain:'Core Master',action:'View',sensitivity:'Internal',context:{stationCode:'CGK'}},false],
  ['p14-sens','GE Team tidak dapat Confidential Core',{user:{role:'GE Team'},domain:'Core Master',action:'View',sensitivity:'Confidential',context:{}},false]
 ];
 tests.forEach(([id,label,input,expect])=>{const x=safe(()=>GEPermission.check(input));const actual=x.ok&&!!x.value.allowed;out.push(result(id,'P1.4',label,x.ok&&actual===expect?'PASS':'FAIL',x.ok?`${x.value.code}: ${x.value.reason}`:x.error))});
 return out}
function checkHistory(){const out=[];if(!window.GEHistory){out.push(result('p15-engine','P1.5','History Engine tersedia','FAIL','GEHistory tidak ditemukan.'));return out}
 out.push(result('p15-engine','P1.5','History & As-Of Engine tersedia','PASS',GEHistory.schemaVersion||''));
 const st=safe(()=>GEHistory.stats());out.push(result('p15-events','P1.5','Baseline/history events tersedia',st.ok&&st.value.total>0?'PASS':'WARN',st.ok?`${st.value.total} history events.`:st.error));
 const d=safe(()=>GEHistory.read());if(d.ok){const ids=(d.value.events||[]).map(x=>x.id);out.push(result('p15-unique','P1.5','History event ID unik',unique(ids)?'PASS':'FAIL',`${ids.length} events checked.`));const bad=(d.value.events||[]).filter(x=>x.validFrom&&x.validTo&&x.validFrom>x.validTo);out.push(result('p15-period','P1.5','History effective period valid',bad.length===0?'PASS':'FAIL',bad.length?`${bad.length} invalid historical period.`:'No invalid historical period.'))}
 const rel=safe(()=>GEHistory.effectiveRelationships(now()));out.push(result('p15-asofrel','P1.5','As-Of relationship query berjalan',rel.ok?'PASS':'FAIL',rel.ok?`${rel.value.length} effective relationships resolved.`:rel.error));
 return out}
function checkShared(){const out=[];if(!window.GEShared){out.push(result('p16-engine','P1.6','Shared Object Engine tersedia','FAIL','GEShared tidak ditemukan.'));return out}
 out.push(result('p16-engine','P1.6','Shared Objects Engine tersedia','PASS',GEShared.schemaVersion||''));
 const needed=['Evidence','Attachment','Reference','Comment','Note','Action'];const types=GEShared.types||[];out.push(result('p16-types','P1.6','Shared object types lengkap',needed.every(x=>types.includes(x))?'PASS':'FAIL',types.join(', ')));
 const d=safe(()=>GEShared.read());if(d.ok){const objIds=(d.value.objects||[]).map(x=>x.id);const orphan=(d.value.links||[]).filter(l=>l.lifecycleStatus!=='Archived'&&!objIds.includes(l.objectId));out.push(result('p16-link','P1.6','Shared link tidak orphan',orphan.length===0?'PASS':'FAIL',orphan.length?`${orphan.length} orphan shared links.`:`${(d.value.links||[]).length} links checked.`))}
 return out}
function checkCompatibility(){const out=[];if(!window.GECompatibility){out.push(result('p17-engine','P1.7','Compatibility Engine tersedia','FAIL','GECompatibility tidak ditemukan.'));return out}
 out.push(result('p17-engine','P1.7','Compatibility & Migration Bridge tersedia','PASS',GECompatibility.schemaVersion||''));
 const rec=safe(()=>GECompatibility.reconcile());if(rec.ok){out.push(result('p17-recon','P1.7','Migration reconciliation',rec.value.pass?'PASS':'WARN',rec.value.rows.map(x=>`${x.label} ${x.mappedCount}/${x.legacyCount}`).join('; ')));out.push(result('p17-orphan','P1.7','Compatibility mapping tidak orphan',rec.value.orphanMappings===0?'PASS':'FAIL',`${rec.value.orphanMappings} orphan mapping.`));out.push(result('p17-exception','P1.7','Migration exception transparan',rec.value.openExceptions===0?'PASS':'WARN',`${rec.value.openExceptions} open exception; WARN diperbolehkan bila memang membutuhkan mapping manual.`))}else out.push(result('p17-recon','P1.7','Migration reconciliation','FAIL',rec.error));
 return out}
function checkGlobal(){const out=[];const engines=['GECore','GERelationship','GEPublication','GEPermission','GEHistory','GEShared','GECompatibility'];out.push(result('global-engines','Foundation','Seluruh P1 engine termuat',engines.every(k=>!!window[k])?'PASS':'FAIL',engines.map(k=>`${k}:${window[k]?'OK':'MISSING'}`).join(' | ')));
 const keys=engines.filter(k=>window[k]&&window[k].storageKey).map(k=>window[k].storageKey);out.push(result('global-storekeys','Foundation','Storage namespace tidak bertabrakan',unique(keys)?'PASS':'FAIL',keys.join(', ')));
 return out}
function run(){const rows=[...checkGlobal(),...checkCore(),...checkRelationship(),...checkPublication(),...checkPermission(),...checkHistory(),...checkShared(),...checkCompatibility()];const fail=rows.filter(x=>x.status==='FAIL').length,warn=rows.filter(x=>x.status==='WARN').length,pass=rows.filter(x=>x.status==='PASS').length;const overall=fail?'NOT READY':warn?'READY WITH REVIEW':'READY';return {schemaVersion:SCHEMA,at:now(),overall,pass,warn,fail,total:rows.length,rows}}
window.GEFoundationGate={schemaVersion:SCHEMA,run};
})();
