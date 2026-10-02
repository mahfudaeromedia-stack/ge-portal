/* Ground Experience V2.57 P1.7 Compatibility & Migration Bridge
   Non-destructive bridge between V2.55.5 legacy store and V2.57 Core Foundation. */
(function(){
'use strict';
const KEY='GE_V257_COMPAT_P17', SCHEMA='2.57-P1.7';
const now=()=>new Date().toISOString(), clone=x=>JSON.parse(JSON.stringify(x));
const slug=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const base=()=>({schemaVersion:SCHEMA,createdAt:now(),updatedAt:now(),mappings:[],exceptions:[],runs:[],meta:{bootstrapVersion:null}});
function normalize(d){d=d||base();d.mappings=Array.isArray(d.mappings)?d.mappings:[];d.exceptions=Array.isArray(d.exceptions)?d.exceptions:[];d.runs=Array.isArray(d.runs)?d.runs:[];d.meta=d.meta||{};d.schemaVersion=SCHEMA;return d}
function read(){try{return normalize(JSON.parse(localStorage.getItem(KEY))||base())}catch(e){return base()}}
function write(db){db=normalize(db);db.updatedAt=now();localStorage.setItem(KEY,JSON.stringify(db));return db}
function legacy(){try{return window.GEStore&&GEStore.get?GEStore.get():{}}catch(e){return {}}}
function mapId(domain,legacyKey){return `compat:${domain}:${String(legacyKey).replace(/[^a-z0-9_-]+/gi,'-').toLowerCase()}`}
function setMapping(m){const db=read();m=clone(m||{});if(!m.domain||m.legacyKey==null)throw Error('Domain dan Legacy Key wajib.');m.id=m.id||mapId(m.domain,m.legacyKey);m.status=m.status||'Mapped';m.updatedAt=now();const i=db.mappings.findIndex(x=>x.id===m.id);if(i>=0){m.createdAt=db.mappings[i].createdAt;db.mappings[i]={...db.mappings[i],...m}}else{m.createdAt=now();db.mappings.push(m)}write(db);return clone(m)}
function mappings(opts={}){let a=read().mappings.slice();if(opts.domain)a=a.filter(x=>x.domain===opts.domain);if(opts.status)a=a.filter(x=>x.status===opts.status);return clone(a)}
function resolve(domain,legacyKey){return clone(read().mappings.find(x=>x.domain===domain&&String(x.legacyKey)===String(legacyKey)&&x.status==='Mapped')||null)}
function addException(x){const db=read();x=clone(x||{});const key=`${x.domain}|${x.legacyKey}|${x.reason}`;if(db.exceptions.some(e=>e.key===key&&e.status!=='Resolved'))return;db.exceptions.push({id:`exception:${Date.now().toString(36)}:${Math.random().toString(36).slice(2,7)}`,key,status:'Open',createdAt:now(),...x});write(db)}
function exceptions(opts={}){let a=read().exceptions.slice();if(opts.status)a=a.filter(x=>x.status===opts.status);if(opts.domain)a=a.filter(x=>x.domain===opts.domain);return clone(a)}
function coreExists(master,id){return !!(window.GECore&&GECore.get(master,id))}
function bootstrap(){if(!window.GECore||!window.GEStore)return read();GECore.bootstrap();const db0=read();if(db0.meta.bootstrapVersion===SCHEMA)return db0;const d=legacy();
 (d.airports||[]).forEach(a=>{const code=String(a.code||'').trim().toUpperCase();const aid=`airport:${code.toLowerCase()}`,sid=`station:${code.toLowerCase()}`;if(coreExists('airports',aid))setMapping({domain:'airport',legacyKey:a.id,legacyCode:code,coreType:'airports',coreId:aid,method:'Deterministic Code',status:'Mapped'});else addException({domain:'airport',legacyKey:a.id,legacyValue:code,reason:'Core Airport tidak ditemukan'});if(coreExists('stations',sid))setMapping({domain:'station',legacyKey:code,legacyCode:code,coreType:'stations',coreId:sid,method:'Deterministic Code',status:'Mapped'});});
 (d.touchpoints||[]).forEach((tp,i)=>{const name=typeof tp==='string'?tp:(tp.name||tp.title||tp.touchpoint||tp.code);const candidates=GECore.list('touchpoints',{includeArchived:true}).filter(x=>String(x.name).trim().toLowerCase()===String(name).trim().toLowerCase());if(candidates.length===1)setMapping({domain:'touchpoint',legacyKey:name,legacyCode:typeof tp==='object'?tp.code:null,coreType:'touchpoints',coreId:candidates[0].id,method:'Exact Normalized Name',status:'Mapped'});else addException({domain:'touchpoint',legacyKey:name,legacyValue:name,reason:candidates.length?'Multiple Core candidates':'Core Touch Point tidak ditemukan'});});
 (d.initiatives||[]).forEach(x=>{const key=x.id;const station=resolve('station',x.airport),tp=resolve('touchpoint',x.tp);const journey=(GECore.list('journeys').find(j=>String(j.name).toLowerCase()===String(x.journey||'').toLowerCase())||{}).id||null;setMapping({domain:'initiative',legacyKey:key,legacyCode:x.name,coreType:'legacy_projection',coreId:`legacy-initiative:${key}`,method:'Compatibility Projection',status:'Mapped',context:{stationId:station&&station.coreId||null,touchpointId:tp&&tp.coreId||null,journeyId:journey}});if(x.airport&&!station)addException({domain:'initiative',legacyKey:key,legacyValue:x.airport,reason:'Station reference belum termapping'});if(x.tp&&!tp)addException({domain:'initiative',legacyKey:key,legacyValue:x.tp,reason:'Touch Point reference belum termapping'});});
 const db=read();db.meta.bootstrapVersion=SCHEMA;db.meta.bootstrapAt=now();write(db);return db}
 function projectInitiative(x){if(!x)return null;const m=resolve('initiative',x.id);const c=m&&m.context||{};return {...clone(x),compatibility:{legacyId:x.id,stationId:c.stationId||null,touchpointId:c.touchpointId||null,journeyId:c.journeyId||null,source:'V2.55.5 Compatibility Projection',readOnlyCoreProjection:true}}}
 function legacyRead(domain,opts={}){const d=legacy();if(domain==='initiatives')return clone((d.initiatives||[]).map(projectInitiative));if(domain==='airports')return clone(d.airports||[]);if(domain==='touchpoints')return clone(d.touchpoints||[]);if(domain==='airportSystems')return clone(d.airportSystems||[]);if(domain==='stationMaterials')return clone(d.stationMaterials||[]);return clone(d[domain]||[])}
 function reconcile(){bootstrap();const d=legacy(), rows=[];const checks=[
  ['Airports','airport',(d.airports||[]),x=>x.id],
  ['Stations','station',(d.airports||[]),x=>x.code],
  ['Touch Points','touchpoint',(d.touchpoints||[]),x=>typeof x==='string'?x:(x.name||x.code)],
  ['Initiatives','initiative',(d.initiatives||[]),x=>x.id]
 ];checks.forEach(([label,domain,arr,keyFn])=>{const mapped=arr.filter(x=>!!resolve(domain,keyFn(x))).length;rows.push({label,domain,legacyCount:arr.length,mappedCount:mapped,unmappedCount:arr.length-mapped,status:mapped===arr.length?'PASS':'REVIEW'});});
 const orphanMappings=read().mappings.filter(m=>m.coreType!=='legacy_projection'&&!coreExists(m.coreType,m.coreId));const openExceptions=exceptions({status:'Open'});const result={at:now(),rows,orphanMappings:orphanMappings.length,openExceptions:openExceptions.length,pass:rows.every(r=>r.status==='PASS')&&orphanMappings.length===0};const db=read();db.runs.push({id:`run:${Date.now().toString(36)}`,...result});write(db);return clone(result)}
 function stats(){bootstrap();const d=read(),rec=reconcile();return {mapped:d.mappings.filter(x=>x.status==='Mapped').length,openExceptions:d.exceptions.filter(x=>x.status==='Open').length,reconciliation:rec}}
 window.GECompatibility={schemaVersion:SCHEMA,storageKey:KEY,read,bootstrap,mappings,resolve,setMapping,exceptions,legacyRead,projectInitiative,reconcile,stats,reset:function(){localStorage.removeItem(KEY);return bootstrap()}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap);else bootstrap();
})();
