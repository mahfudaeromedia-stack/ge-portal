/* Ground Experience V2.57 P1.3 Source, Verification & Publication Engine
   Candidate/Draft -> Verification -> Published -> Superseded.
   Additive layer; does not mutate V2.55.5 business records or P1.1 masters. */
(function(){
'use strict';
const KEY='GE_V257_PUBLICATION_P13';
const SCHEMA='2.57-P1.3';
const now=()=>new Date().toISOString();
const clone=x=>JSON.parse(JSON.stringify(x));
const uid=p=>`${p}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2,8)}`;
const STATES=['Draft','Pending Verification','Verified','Published','Superseded','Rejected'];
const base=()=>({schemaVersion:SCHEMA,createdAt:now(),updatedAt:now(),sources:[],records:[],history:[],meta:{bootstrapComplete:false}});
function read(){try{return JSON.parse(localStorage.getItem(KEY))||base()}catch(e){return base()}}
function write(db){db.updatedAt=now();localStorage.setItem(KEY,JSON.stringify(db));return db}
function audit(db,action,record,extra){db.history.push({id:uid('pubhist'),at:now(),action,recordId:record&&record.id||null,objectType:record&&record.objectType||null,objectId:record&&record.objectId||null,state:record&&record.publicationStatus||null,...(extra||{})})}
function sourceUpsert(src){const db=read(),s=clone(src||{});if(!s.id)s.id=uid('source');if(!s.name)throw Error('Source name wajib diisi.');s.lifecycleStatus=s.lifecycleStatus||'Active';s.sourceType=s.sourceType||'Manual';s.authority=s.authority||'Reference';const i=db.sources.findIndex(x=>x.id===s.id);if(i>=0){s.createdAt=db.sources[i].createdAt;s.updatedAt=now();db.sources[i]={...db.sources[i],...s}}else{s.createdAt=now();s.updatedAt=now();db.sources.push(s)}write(db);return clone(s)}
function sources(opts={}){let a=read().sources.slice();if(!opts.includeInactive)a=a.filter(x=>x.lifecycleStatus!=='Inactive'&&x.lifecycleStatus!=='Archived');return clone(a)}
function snapshotObject(objectType,objectId){if(objectType==='relationship'){if(!window.GERelationship)throw Error('Relationship engine belum tersedia.');const r=GERelationship.get(objectId);if(!r)throw Error('Relationship tidak ditemukan.');return r}if(!window.GECore)throw Error('Core engine belum tersedia.');const r=GECore.get(objectType,objectId);if(!r)throw Error('Core object tidak ditemukan.');return r}
function createCandidate(input){const db=read(),x=clone(input||{});if(!x.objectType||!x.objectId)throw Error('Object Type dan Object wajib dipilih.');if(!x.sourceId)throw Error('Data Source wajib dipilih.');const source=db.sources.find(s=>s.id===x.sourceId);if(!source)throw Error('Data Source tidak ditemukan.');const payload=x.payload||snapshotObject(x.objectType,x.objectId);const existing=db.records.filter(r=>r.objectType===x.objectType&&r.objectId===x.objectId);const revision=(existing.reduce((m,r)=>Math.max(m,Number(r.revision)||0),0)||0)+1;const rec={id:uid('publication'),businessId:`PUB-${String(existing.length+1).padStart(5,'0')}`,domain:x.domain||'Core Master',objectType:x.objectType,objectId:x.objectId,sourceId:x.sourceId,sourceName:source.name,sourceAuthority:source.authority,period:x.period||null,coverage:x.coverage||null,remark:x.remark||'',payload:clone(payload),revision,publicationStatus:'Draft',verificationStatus:'Not Verified',createdBy:x.createdBy||'Current User',createdAt:now(),updatedAt:now()};db.records.push(rec);audit(db,'CREATE_DRAFT',rec);write(db);return clone(rec)}
function get(id){return clone(read().records.find(x=>x.id===id)||null)}
function list(opts={}){let a=read().records.slice();if(opts.status)a=a.filter(x=>x.publicationStatus===opts.status);if(opts.objectType)a=a.filter(x=>x.objectType===opts.objectType);if(opts.objectId)a=a.filter(x=>x.objectId===opts.objectId);return clone(a.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))))}
function transition(id,next,meta={}){if(!STATES.includes(next))throw Error('Publication status tidak dikenal.');const db=read(),i=db.records.findIndex(x=>x.id===id);if(i<0)throw Error('Publication record tidak ditemukan.');const r=db.records[i],from=r.publicationStatus;
 if(window.GEPermission){const action=next==='Pending Verification'?'Submit':next==='Verified'?'Verify':next==='Published'?'Publish':next==='Draft'?'Edit':null;if(action)GEPermission.requireAccess({domain:r.domain==='P1.3 Core Validation'?'Core Master':(r.domain||'Core Master'),action,sensitivity:r.sensitivity||'Internal',context:r.context||{}});}
 const allowed={Draft:['Pending Verification','Rejected'], 'Pending Verification':['Verified','Rejected','Draft'], Verified:['Published','Rejected','Draft'], Published:['Superseded'], Superseded:[], Rejected:['Draft']};
 if(!(allowed[from]||[]).includes(next))throw Error(`Transisi ${from} → ${next} tidak diizinkan.`);
 if(next==='Verified'){r.verificationStatus='Verified';r.verifiedBy=meta.actor||'Verifier';r.verifiedAt=now();r.verificationRemark=meta.remark||'';}
 if(next==='Published'){
   if(r.verificationStatus!=='Verified')throw Error('Record harus Verified sebelum Publish.');
   db.records.filter(x=>x.id!==r.id&&x.objectType===r.objectType&&x.objectId===r.objectId&&x.publicationStatus==='Published').forEach(old=>{old.publicationStatus='Superseded';old.supersededAt=now();old.supersededBy=r.id;audit(db,'AUTO_SUPERSEDE',old,{replacementId:r.id});});
   r.publishedBy=meta.actor||'Publisher';r.publishedAt=now();
 }
 if(next==='Rejected'){r.rejectedBy=meta.actor||'Verifier';r.rejectedAt=now();r.rejectionReason=meta.remark||'Rejected';}
 if(next==='Draft'&&from==='Rejected'){r.rejectionReason=null;}
 r.publicationStatus=next;r.updatedAt=now();audit(db,`STATE_${from}_TO_${next}`,r,{actor:meta.actor||'Current User',remark:meta.remark||''});write(db);return clone(r)}
function submit(id,meta){return transition(id,'Pending Verification',meta)}
function verify(id,meta){return transition(id,'Verified',meta)}
function publish(id,meta){return transition(id,'Published',meta)}
function reject(id,meta){return transition(id,'Rejected',meta)}
function currentPublished(objectType,objectId){return clone(read().records.filter(x=>x.objectType===objectType&&x.objectId===objectId&&x.publicationStatus==='Published').sort((a,b)=>String(b.publishedAt).localeCompare(String(a.publishedAt)))[0]||null)}
function history(recordId){return clone(read().history.filter(x=>!recordId||x.recordId===recordId).sort((a,b)=>String(b.at).localeCompare(String(a.at))))}
function bootstrap(){const db=read();if(db.meta&&db.meta.bootstrapComplete)return db;const defaults=[
 {id:'source:p11-core-bootstrap',name:'V2.57 Core Master / P1.1',sourceType:'System Generated',authority:'Primary',domain:'Core Master',lifecycleStatus:'Active'},
 {id:'source:p12-relationship-bootstrap',name:'V2.57 Relationship Engine / P1.2',sourceType:'System Generated',authority:'Primary',domain:'Relationship',lifecycleStatus:'Active'},
 {id:'source:v2555-legacy',name:'V2.55.5 Legacy Compatibility',sourceType:'System Generated',authority:'Reference',domain:'Legacy',lifecycleStatus:'Active'}];
 defaults.forEach(s=>{if(!db.sources.some(x=>x.id===s.id)){s.createdAt=now();s.updatedAt=now();db.sources.push(s)}});db.meta.bootstrapComplete=true;db.meta.bootstrapAt=now();write(db);return db}
function stats(){const d=read(),out={sources:sources().length,total:d.records.length};STATES.forEach(s=>out[s]=d.records.filter(x=>x.publicationStatus===s).length);out.currentPublished=d.records.filter(x=>x.publicationStatus==='Published').length;return out}
window.GEPublication={schemaVersion:SCHEMA,storageKey:KEY,states:STATES,read,sources,sourceUpsert,createCandidate,get,list,submit,verify,publish,reject,transition,currentPublished,history,bootstrap,stats,reset:function(){localStorage.removeItem(KEY);return bootstrap()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap);else bootstrap();
})();
