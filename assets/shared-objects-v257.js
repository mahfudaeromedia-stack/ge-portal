/* Ground Experience V2.57 P1.6 Shared Objects Foundation
   Shared cross-module supporting records: Evidence, Attachment/Reference, Comment/Note, and Action.
   One supporting object may be linked to any Core/Relationship/Publication/business object without duplicating it per module.
   Action is intentionally distinct from Initiative Activity. */
(function(){
'use strict';
const KEY='GE_V257_SHARED_P16', SCHEMA='2.57-P1.6';
const TYPES=['Evidence','Attachment','Reference','Comment','Note','Action'];
const now=()=>new Date().toISOString();
const clone=x=>JSON.parse(JSON.stringify(x));
const uid=p=>`${p}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2,9)}`;
const base=()=>({schemaVersion:SCHEMA,createdAt:now(),updatedAt:now(),objects:[],links:[],meta:{bootstrapVersion:null}});
function normalize(db){db=db||base();db.schemaVersion=SCHEMA;db.objects=Array.isArray(db.objects)?db.objects:[];db.links=Array.isArray(db.links)?db.links:[];db.meta=db.meta||{};return db}
function read(){try{return normalize(JSON.parse(localStorage.getItem(KEY))||base())}catch(e){return base()}}
function write(db){db=normalize(db);db.updatedAt=now();localStorage.setItem(KEY,JSON.stringify(db));return db}
function currentUser(){try{return window.GEPermission&&GEPermission.currentUser?GEPermission.currentUser():null}catch(e){return null}}
function actor(){const u=currentUser();return (u&&(u.name||u.fullName||u.username||u.email||u.role))||'P1 Validation User'}
function requireAccess(action,obj){if(!window.GEPermission)return true;return GEPermission.requireAccess({domain:'Shared Objects',action,sensitivity:(obj&&obj.sensitivity)||'Internal',context:(obj&&obj.context)||{}})}
function history(action,before,after,remark){if(!window.GEHistory)return;const o=after||before||{};try{GEHistory.record({domain:'Shared Objects',entityType:'shared_object',entityId:o.id,action,before:before||null,after:after||null,actor:actor(),source:'P1.6 Shared Objects',remark:remark||''})}catch(e){console.warn('P1.6 history:',e)}}
function get(id){return clone(read().objects.find(x=>x.id===id)||null)}
function list(filter){const f=filter||{};return clone(read().objects.filter(x=>(f.includeArchived||x.lifecycleStatus!=='Archived')&&(!f.type||x.type===f.type)&&(!f.status||x.status===f.status)&&(!f.subjectId||linksForObject(x.id).some(l=>l.subjectId===f.subjectId))))}
function links(){return clone(read().links)}
function linksForObject(id){return clone(read().links.filter(l=>l.objectId===id&&l.lifecycleStatus!=='Archived'))}
function objectsForSubject(subjectType,subjectId,opts){const f=opts||{},db=read(),ids=db.links.filter(l=>l.lifecycleStatus!=='Archived'&&l.subjectType===subjectType&&l.subjectId===subjectId).map(l=>l.objectId);return clone(db.objects.filter(o=>ids.includes(o.id)&&(f.includeArchived||o.lifecycleStatus!=='Archived')&&(!f.type||o.type===f.type)))}
function validateObject(r){const e=[];if(!TYPES.includes(r.type))e.push('Shared object type tidak valid.');if(!String(r.title||'').trim())e.push('Title wajib diisi.');if(r.type==='Action'&&!String(r.status||'').trim())e.push('Action status wajib diisi.');if(r.dueDate&&r.completedAt&&String(r.completedAt).slice(0,10)<String(r.createdAt||'').slice(0,10))e.push('Completed date tidak valid.');return e}
function upsert(record){const input=record||{},before=input.id?get(input.id):null;requireAccess(before?'Edit':'Create',input);const db=read();const id=input.id||uid('shared');const rec={id,type:input.type||'Evidence',title:String(input.title||'').trim(),description:input.description||'',status:input.status||(input.type==='Action'?'Open':'Active'),lifecycleStatus:input.lifecycleStatus||'Active',sensitivity:input.sensitivity||'Internal',owner:input.owner||'',dueDate:input.dueDate||null,completedAt:input.completedAt||null,source:input.source||'Manual',sourceUri:input.sourceUri||'',referenceNo:input.referenceNo||'',fileName:input.fileName||'',fileType:input.fileType||'',fileSize:input.fileSize||null,tags:Array.isArray(input.tags)?input.tags:[],context:input.context||{},metadata:input.metadata||{},createdAt:before?before.createdAt:now(),createdBy:before?before.createdBy:actor(),updatedAt:now(),updatedBy:actor()};
 const errors=validateObject(rec);if(errors.length){const e=Error(errors.join(' '));e.validationErrors=errors;throw e}
 const idx=db.objects.findIndex(x=>x.id===id);if(idx>=0)db.objects[idx]=rec;else db.objects.push(rec);write(db);history(before?'UPDATE':'CREATE',before,rec);return clone(rec)}
function archive(id){const before=get(id);if(!before)throw Error('Shared object tidak ditemukan.');requireAccess('Edit',before);const db=read(),idx=db.objects.findIndex(x=>x.id===id);db.objects[idx]={...db.objects[idx],lifecycleStatus:'Archived',updatedAt:now(),updatedBy:actor()};db.links=db.links.map(l=>l.objectId===id?{...l,lifecycleStatus:'Archived',updatedAt:now()}:l);write(db);const after=get(id);history('ARCHIVE',before,after);return after}
function addLink(objectId,subjectType,subjectId,meta){const obj=get(objectId);if(!obj)throw Error('Shared object tidak ditemukan.');requireAccess('Edit',obj);if(!subjectType||!subjectId)throw Error('Subject type dan subject ID wajib diisi.');const db=read();const exists=db.links.find(l=>l.objectId===objectId&&l.subjectType===subjectType&&l.subjectId===subjectId&&l.lifecycleStatus!=='Archived');if(exists)return clone(exists);const link={id:uid('shared-link'),objectId,subjectType,subjectId,relationship:(meta&&meta.relationship)||'Supports',context:(meta&&meta.context)||{},lifecycleStatus:'Active',createdAt:now(),createdBy:actor(),updatedAt:now()};db.links.push(link);write(db);history('LINK',obj,obj,`${subjectType}:${subjectId}`);return clone(link)}
function removeLink(linkId){const db=read(),idx=db.links.findIndex(x=>x.id===linkId);if(idx<0)throw Error('Link tidak ditemukan.');const obj=get(db.links[idx].objectId);requireAccess('Edit',obj||{});db.links[idx]={...db.links[idx],lifecycleStatus:'Archived',updatedAt:now()};write(db);history('UNLINK',obj,obj,`${db.links[idx].subjectType}:${db.links[idx].subjectId}`);return clone(db.links[idx])}
function completeAction(id,completedAt){const before=get(id);if(!before||before.type!=='Action')throw Error('Action tidak ditemukan.');return upsert({...before,status:'Completed',completedAt:completedAt||now()})}
function stats(){const active=list({});const byType={};TYPES.forEach(t=>byType[t]=active.filter(x=>x.type===t).length);return{total:active.length,links:read().links.filter(x=>x.lifecycleStatus!=='Archived').length,byType,openActions:active.filter(x=>x.type==='Action'&&x.status!=='Completed'&&x.status!=='Closed').length}}
function seed(){const db=read();if(db.meta.bootstrapVersion===SCHEMA)return db;write(db);db.meta.bootstrapVersion=SCHEMA;db.meta.bootstrapAt=now();write(db);return db}
window.GEShared={schemaVersion:SCHEMA,storageKey:KEY,types:TYPES,read,list,get,upsert,archive,links,linksForObject,objectsForSubject,addLink,removeLink,completeAction,stats,bootstrap:seed,reset:function(){localStorage.removeItem(KEY);return seed()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',seed);else seed();
})();
