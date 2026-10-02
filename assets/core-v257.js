/* Ground Experience V2.57 P1.1 Core Identity & Master Foundation
   Additive compatibility layer: does not replace GEStore/V2.55.5 data. */
(function(){
'use strict';
const KEY='GE_V257_CORE_P11';
const SCHEMA='2.57-P1.1';
const now=()=>new Date().toISOString();
const clone=x=>JSON.parse(JSON.stringify(x));
const slug=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const id=(type,key)=>`${type}:${slug(key)||Math.random().toString(36).slice(2)}`;
const base=()=>({schemaVersion:SCHEMA,createdAt:now(),updatedAt:now(),masters:{organizations:[],airports:[],terminals:[],stations:[],serviceLocations:[],lounges:[],tenants:[],snackBoxes:[],journeys:[],touchpoints:[],services:[],serviceStandards:[],capabilities:[],users:[],periods:[],sources:[],masterCategories:[]},meta:{bootstrapComplete:false}});
function read(){try{return JSON.parse(localStorage.getItem(KEY))||base()}catch(e){return base()}}
function write(db){db.updatedAt=now();localStorage.setItem(KEY,JSON.stringify(db));return db}
function list(type,opts={}){const a=read().masters[type]||[];return clone(opts.includeArchived?a:a.filter(x=>x.lifecycleStatus!=='Archived'))}
function get(type,objectId){return clone((read().masters[type]||[]).find(x=>x.id===objectId)||null)}
function upsert(type,record){const db=read(); if(!db.masters[type]) throw Error('Unknown master '+type); const a=db.masters[type]; const t=now(); const r=clone(record||{}); if(!r.id) r.id=id(type.replace(/s$/,''),r.code||r.name||Date.now()); const i=a.findIndex(x=>x.id===r.id); if(i>=0){r.createdAt=a[i].createdAt;r.updatedAt=t;a[i]={...a[i],...r}} else {r.createdAt=t;r.updatedAt=t;r.lifecycleStatus=r.lifecycleStatus||'Active';a.push(r)} write(db);return clone(r)}
function archive(type,objectId){const r=get(type,objectId);if(!r)return null;r.lifecycleStatus='Archived';r.archivedAt=now();return upsert(type,r)}
function seed(type,records){records.forEach(r=>{if(!get(type,r.id))upsert(type,r)})}
function bootstrap(){const db=read(); if(db.meta&&db.meta.bootstrapComplete)return db; let legacy=null; try{legacy=window.GEStore&&window.GEStore.get?window.GEStore.get():null}catch(e){}
 seed('organizations',[{id:'organization:garuda-indonesia',code:'GA',name:'PT Garuda Indonesia (Persero) Tbk',organizationType:'Internal',lifecycleStatus:'Active',source:'P1.1 bootstrap'}]);
 const aps=(legacy&&legacy.airports)||[];
 const existingUsers=(legacy&&legacy.users)||[];
 const existingLounges=(legacy&&legacy.lounges)||[];
 seed('airports',aps.map(a=>({id:`airport:${String(a.code).toLowerCase()}`,code:a.code,name:a.airportName||a.city,city:a.city,region:a.region,latitude:a.lat,longitude:a.lon,lifecycleStatus:a.status==='Inactive'?'Inactive':'Active',legacyId:a.id,source:'V2.55.5 airports'})));
 seed('stations',aps.map(a=>({id:`station:${String(a.code).toLowerCase()}`,code:a.code,name:`${a.code} Station`,airportId:`airport:${String(a.code).toLowerCase()}`,responsibleOrganizationId:'organization:garuda-indonesia',operationalStatus:a.status==='Inactive'?'Inactive':'Active',lifecycleStatus:a.status==='Inactive'?'Inactive':'Active',migrationStatus:'Legacy Candidate',source:'V2.55.5 airport compatibility'})));
 const legacyTp=(legacy&&legacy.touchpoints)||[];
 seed('terminals',[]);
 seed('lounges',existingLounges.map(x=>({id:`lounge:${x.id}`,code:x.code||`LOUNGE-${x.id}`,name:x.name||x.loungeName||`Lounge ${x.id}`,stationId:null,airportCode:x.airport||'',lifecycleStatus:x.status==='Inactive'?'Inactive':'Active',legacyId:x.id,source:'V2.55.5 lounge compatibility'})));
 seed('tenants',[]); seed('snackBoxes',[]); seed('serviceStandards',[]);
 seed('users',existingUsers.map(x=>({id:`user:${x.id||x.uid||x.email||slug(x.username||x.name||'unknown')}`,code:x.username||x.email||'',name:x.name||x.username||x.email||'User',role:x.role||'',organizationId:x.organizationId||null,lifecycleStatus:x.status==='Inactive'?'Inactive':'Active',legacyId:x.id||x.uid||null,source:'Existing user profile'})));
 seed('periods',[]); seed('sources',[]); seed('masterCategories',[]);
 seed('touchpoints',legacyTp.map((x,n)=>({id:`touchpoint:${slug(x.code||x.name||x.title||n+1)}`,code:x.code||`TP${n+1}`,name:x.name||x.title||x.touchpoint||`Touch Point ${n+1}`,journeyId:null,lifecycleStatus:'Active',legacyId:x.id,source:'V2.55.5 touchpoints'})));
 seed('journeys',[{id:'journey:pre-journey',code:'PREJ',name:'Pre-Journey',lifecycleStatus:'Active'},{id:'journey:pre-flight',code:'PREF',name:'Pre-Flight',lifecycleStatus:'Active'},{id:'journey:post-flight',code:'POSTF',name:'Post-Flight',lifecycleStatus:'Active'},{id:'journey:post-journey',code:'POSTJ',name:'Post-Journey',lifecycleStatus:'Active'}]);
 const db2=read();db2.meta.bootstrapComplete=true;db2.meta.bootstrapAt=now();write(db2);return db2}
 function stats(){const d=read();const o={};Object.keys(d.masters).forEach(k=>o[k]={active:d.masters[k].filter(x=>x.lifecycleStatus!=='Archived').length,total:d.masters[k].length});return o}
 window.GECore={schemaVersion:SCHEMA,storageKey:KEY,read,list,get,upsert,archive,bootstrap,stats,reset:function(){localStorage.removeItem(KEY);return bootstrap()}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap);else bootstrap();
})();
