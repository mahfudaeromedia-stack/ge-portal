/* Ground Experience V2.57 P1.1 Core Identity & Master Foundation
 * Canonical master projection: Firestore-backed GEStore is the runtime source.
 * Local memory is only the derived core index; it is not a business-data source.
 */
(function(){
'use strict';
const KEY='GE_V257_CORE_P11';
const SCHEMA='2.57-P1.1';
const now=()=>new Date().toISOString();
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const slug=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const id=(type,key)=>`${type}:${slug(key)||Math.random().toString(36).slice(2)}`;
const base=()=>({schemaVersion:SCHEMA,createdAt:now(),updatedAt:now(),masters:{organizations:[],airports:[],terminals:[],stations:[],serviceLocations:[],lounges:[],tenants:[],snackBoxes:[],journeys:[],touchpoints:[],services:[],serviceStandards:[],capabilities:[],users:[],periods:[],sources:[],masterCategories:[]},meta:{bootstrapComplete:false}});
function read(){try{return JSON.parse(localStorage.getItem(KEY))||base()}catch(e){return base()}}
function write(db){db.updatedAt=now();localStorage.setItem(KEY,JSON.stringify(db));return db}
function list(type,opts={}){const a=read().masters[type]||[];return clone(opts.includeArchived?a:a.filter(x=>x.lifecycleStatus!=='Archived'))}
function get(type,objectId){return clone((read().masters[type]||[]).find(x=>x.id===objectId||String(x.legacyId||'')===String(objectId)||String(x.code||'').toUpperCase()===String(objectId||'').toUpperCase())||null)}
function upsert(type,record){const db=read();if(!db.masters[type])throw Error('Unknown master '+type);const a=db.masters[type],t=now(),r=clone(record||{});if(!r.id)r.id=id(type.replace(/s$/,''),r.code||r.name||Date.now());const i=a.findIndex(x=>x.id===r.id);if(i>=0){r.createdAt=a[i].createdAt;r.updatedAt=t;a[i]={...a[i],...r}}else{r.createdAt=t;r.updatedAt=t;r.lifecycleStatus=r.lifecycleStatus||'Active';a.push(r)}write(db);return clone(r)}
function archive(type,objectId){const r=get(type,objectId);if(!r)return null;r.lifecycleStatus='Archived';r.archivedAt=now();return upsert(type,r)}
function seed(type,records){records.forEach(r=>{if(!get(type,r.id))upsert(type,r)})}
function syncFromStore(){
 const store=window.GEStore?.get?.();if(!store)return read();
 const db=read();
 const aps=Array.isArray(store.airports)?store.airports:[];
 const lounges=Array.isArray(store.lounges)?store.lounges:[];
 const users=Array.isArray(store.users)?store.users:[];
 const tps=Array.isArray(store.touchpoints)?store.touchpoints:[];
 db.masters.airports=aps.map(a=>({id:`airport:${String(a.code||a.id).toLowerCase()}`,code:a.code||a.iata||a.id,name:a.airportName||a.name||a.city||a.code,city:a.city||'',region:a.region||a.wilayah||'',latitude:a.lat??a.latitude??null,longitude:a.lon??a.longitude??null,lifecycleStatus:a.status==='Inactive'?'Inactive':'Active',legacyId:a.id,source:'Firestore'}));
 db.masters.stations=aps.map(a=>({id:`station:${String(a.code||a.id).toLowerCase()}`,code:a.code||a.iata||a.id,name:`${a.code||a.iata||a.id} Station`,airportId:`airport:${String(a.code||a.id).toLowerCase()}`,responsibleOrganizationId:'organization:garuda-indonesia',operationalStatus:a.status==='Inactive'?'Inactive':'Active',lifecycleStatus:a.status==='Inactive'?'Inactive':'Active',legacyId:a.id,source:'Firestore airport master'}));
 db.masters.lounges=lounges.map(x=>({id:`lounge:${x.id}`,code:x.code||`LOUNGE-${x.id}`,name:x.name||x.loungeName||`Lounge ${x.id}`,stationId:null,airportCode:x.airport||x.airportCode||'',lifecycleStatus:x.status==='Inactive'?'Inactive':'Active',legacyId:x.id,source:'Firestore'}));
 db.masters.users=users.map(x=>({id:`user:${x.id||x.uid||x.email||slug(x.username||x.name||'unknown')}`,code:x.username||x.email||'',name:x.name||x.username||x.email||'User',role:x.role||'',organizationId:x.organizationId||null,lifecycleStatus:x.status==='Inactive'?'Inactive':'Active',legacyId:x.id||x.uid||null,source:'Firestore'}));
 db.masters.touchpoints=tps.map((x,n)=>typeof x==='string'?{id:`touchpoint:${slug(x)}`,code:`TP${n+1}`,name:x,journeyId:null,lifecycleStatus:'Active',source:'Firestore'}:{id:`touchpoint:${slug(x.code||x.name||x.title||x.id||n+1)}`,code:x.code||`TP${n+1}`,name:x.name||x.title||x.touchpoint||x.code||`Touch Point ${n+1}`,journeyId:x.journeyId||null,lifecycleStatus:x.status==='Inactive'?'Inactive':'Active',legacyId:x.id,source:'Firestore'});
 db.meta.bootstrapComplete=true;db.meta.lastStoreSync=now();write(db);return db;
}
function bootstrap(){syncFromStore();const db=read();if(!db.masters.organizations.length)seed('organizations',[{id:'organization:garuda-indonesia',code:'GA',name:'PT Garuda Indonesia (Persero) Tbk',organizationType:'Internal',lifecycleStatus:'Active',source:'Core reference'}]);if(!db.masters.journeys.length)seed('journeys',[{id:'journey:pre-journey',code:'PREJ',name:'Pre-Journey',lifecycleStatus:'Active'},{id:'journey:pre-flight',code:'PREF',name:'Pre-Flight',lifecycleStatus:'Active'},{id:'journey:post-flight',code:'POSTF',name:'Post-Flight',lifecycleStatus:'Active'},{id:'journey:post-journey',code:'POSTJ',name:'Post-Journey',lifecycleStatus:'Active'}]);return read()}
function stats(){const d=read(),o={};Object.keys(d.masters).forEach(k=>o[k]={active:d.masters[k].filter(x=>x.lifecycleStatus!=='Archived').length,total:d.masters[k].length});return o}
window.GECore={schemaVersion:SCHEMA,storageKey:KEY,read,list,get,upsert,archive,bootstrap,syncFromStore,stats,reset:function(){localStorage.removeItem(KEY);return bootstrap()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap);else bootstrap();
})();
