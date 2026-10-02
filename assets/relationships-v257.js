/* Ground Experience V2.57 P1.2 Relationship Engine — canonical restored implementation. */
(function(){
'use strict';
const KEY='GE_V257_RELATIONSHIPS_P12',SCHEMA='2.57-P1.2';
const TYPES={station_responsibility:{source:'stations',target:'organizations'},station_service_location:{source:'stations',target:'serviceLocations'},location_touchpoint:{source:'serviceLocations',target:'touchpoints'},touchpoint_service:{source:'touchpoints',target:'services'},station_service:{source:'stations',target:'services'},service_capability:{source:'services',target:'capabilities'}};
const now=()=>new Date().toISOString(),clone=x=>JSON.parse(JSON.stringify(x));
const base=()=>({schemaVersion:SCHEMA,records:[],meta:{bootstrapComplete:false}});
function read(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');return d&&Array.isArray(d.records)?d:base()}catch(e){return base()}}
function write(d){d.updatedAt=now();localStorage.setItem(KEY,JSON.stringify(d));return d}
function relType(r){return String(r?.type||r?.relationshipType||'').trim()}
function list(opts={}){let a=read().records.slice();if(!opts.includeArchived)a=a.filter(x=>x.lifecycleStatus!=='Archived');if(opts.type)a=a.filter(x=>relType(x)===opts.type);if(opts.asOf){const t=String(opts.asOf).slice(0,10);a=a.filter(x=>(!x.validFrom||x.validFrom<=t)&&(!x.validTo||x.validTo>=t))}return clone(a)}
function get(id){return clone(read().records.find(x=>String(x.id)===String(id))||null)}
function upsert(record){const d=read(),r=clone(record||{}),type=relType(r);if(!TYPES[type])throw Error('Unknown relationship type: '+type);r.type=type;r.relationshipType=type;if(!r.sourceId||!r.targetId)throw Error('Relationship sourceId dan targetId wajib diisi.');if(!r.id)r.id=`relationship:${type}:${String(r.sourceId).replace(/[^a-z0-9]+/gi,'-')}:${String(r.targetId).replace(/[^a-z0-9]+/gi,'-')}`;const i=d.records.findIndex(x=>x.id===r.id),t=now();if(i>=0)d.records[i]={...d.records[i],...r,updatedAt:t};else d.records.push({...r,createdAt:t,updatedAt:t,lifecycleStatus:r.lifecycleStatus||'Active'});write(d);return get(r.id)}
function archive(id){const r=get(id);if(!r)return null;r.lifecycleStatus='Archived';r.archivedAt=now();return upsert(r)}
function end(id,date){const r=get(id);if(!r)return null;r.validTo=String(date||'').slice(0,10)||now().slice(0,10);return upsert(r)}
function resolve(sourceId,opts={}){return list({includeArchived:false,asOf:opts.asOf}).filter(r=>String(r.sourceId)===String(sourceId)||String(r.targetId)===String(sourceId))}
function bootstrap(){const d=read();if(d.meta?.bootstrapComplete)return d;try{window.GECore?.bootstrap?.();const existing=new Set(d.records.map(r=>`${relType(r)}|${r.sourceId}|${r.targetId}`));const add=(type,s,t,source)=>{if(!s||!t||existing.has(`${type}|${s}|${t}`))return;const r={type,sourceId:s,targetId:t,source,lifecycleStatus:'Active'};const x=upsert(r);existing.add(`${type}|${s}|${t}`);return x};(window.GECore?.list?.('stations',{includeArchived:true})||[]).forEach(s=>add('station_responsibility',s.id,s.responsibleOrganizationId,'P1.2 canonical bootstrap'));}catch(e){console.warn('[GERelationship bootstrap]',e)}const out=read();out.meta.bootstrapComplete=true;out.meta.bootstrapAt=now();write(out);return out}
function stats(){const a=list({includeArchived:true}),o={total:a.length,active:a.filter(x=>x.lifecycleStatus!=='Archived').length,byType:{}};a.forEach(x=>o.byType[relType(x)]=(o.byType[relType(x)]||0)+1);return o}
function integrity(){const issues=[];if(!window.GECore)return issues;list({includeArchived:false}).forEach(r=>{const def=TYPES[relType(r)];if(!def)return issues.push({severity:'FAIL',id:r.id,issue:'Unknown relationship type'});if(!GECore.get(def.source,r.sourceId)||!GECore.get(def.target,r.targetId))issues.push({severity:'FAIL',id:r.id,issue:'Invalid core reference'})});return issues}
window.GERelationship={schemaVersion:SCHEMA,storageKey:KEY,types:TYPES,read,list,get,upsert,archive,end,resolve,bootstrap,stats,integrity,reset(){localStorage.removeItem(KEY);return bootstrap()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap);else bootstrap();
})();
