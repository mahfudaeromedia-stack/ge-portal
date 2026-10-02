/* V2.57 P1.2.1 Relationship Bootstrap & Validation
   Only deterministic mappings from existing portal data are auto-published.
   Ambiguous physical-location relationships remain Mapping Required. */
(function(){
'use strict';
const VERSION='2.57-P1.2.1';
const META_KEY='GE_V257_P121_META';
const slug=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const legacy=()=>{try{return window.GEStore&&GEStore.get?GEStore.get():null}catch(e){return null}};
function ensureMaster(type,code,name,extra={}){let x=GECore.list(type,{includeArchived:true}).find(r=>String(r.code||'').toUpperCase()===String(code).toUpperCase()||String(r.name||'').toLowerCase()===String(name).toLowerCase());if(x)return x;return GECore.upsert(type,{id:`${type.replace(/s$/,'')}:${slug(code||name)}`,code,name,lifecycleStatus:'Active',source:'P1.2.1 deterministic bootstrap',...extra});}
function seedRel(type,sourceId,targetId,source){if(!sourceId||!targetId)return false;const exists=GERelationship.list({includeArchived:true,type}).some(r=>r.sourceId===sourceId&&r.targetId===targetId&&r.lifecycleStatus!=='Archived');if(exists)return false;try{GERelationship.upsert({relationshipType:type,sourceId,targetId,validFrom:null,validTo:null,lifecycleStatus:'Active',source});return true}catch(e){console.warn('P1.2.1 skip',type,e.message);return false}}
const TP_SERVICE={
 'Call Center':['CC','Customer Contact Service'],
 'Garuda Sales Office':['GSO','Sales Office Service'],
 'Airport Ticketing Office':['ATO','Airport Ticketing Service'],
 'Airport Transfer':['ATR','Airport Transfer Service'],
 'Check-in Counter':['CHK','Passenger Check-in Service'],
 'Security Check Point':['SEC','Security Checkpoint Support'],
 'Lounge':['LNG','Lounge Service'],
 'Buggy Car':['BUG','Buggy Car Service'],
 'Boarding Gate':['BRD','Passenger Boarding Service'],
 'Transfer Desk':['TRF','Transfer Desk Service'],
 'Arrival Hall':['ARR','Arrival Service'],
 'Baggage Claim':['BCL','Baggage Claim Service'],
 'Post Claim':['PCL','Post-Claim Service'],
 'Post Survey':['PSV','Post-Journey Survey Service']
};
const SYS_SERVICES={
 checkin:['CHK','Passenger Check-in Service'], boardingGate:['BRD','Passenger Boarding Service'], transferDesk:['TRF','Transfer Desk Service'],
 kiosk:['SSCI','Self Service Check-in'], sbd:['SBD','Self Baggage Drop']
};
const SERVICE_CAP={
 CHK:['CAP-CHK','Passenger Check-in Processing'], BRD:['CAP-BRD','Boarding Processing'], TRF:['CAP-TRF','Transfer Processing'],
 SSCI:['CAP-SSCI','Self Service Check-in Capability'], SBD:['CAP-SBD','Self Baggage Drop Capability'],
 LNG:['CAP-LNG','Lounge Service Capability'], BUG:['CAP-BUG','Buggy Service Capability']
};
function repairTouchpoints(d){const labels=(d&&d.touchpoints)||[];if(!labels.length)return 0;let n=0;labels.forEach((raw,i)=>{const label=typeof raw==='string'?raw:(raw.name||raw.title||raw.touchpoint||raw.code||`Touch Point ${i+1}`);const code=typeof raw==='object'&&raw.code?raw.code:`TP${i+1}`;let tp=GECore.list('touchpoints',{includeArchived:true}).find(x=>x.legacyId===(raw&&raw.id)||x.name===label||x.code===code);if(tp){if(/^Touch Point \d+$/.test(tp.name||'')||tp.name!==label){GECore.upsert('touchpoints',{...tp,code,name:label,source:'V2.55.5 touchpoints · P1.2.1 normalized'});n++;}}else{GECore.upsert('touchpoints',{id:`touchpoint:${slug(label)}`,code,name:label,lifecycleStatus:'Active',legacyId:raw&&raw.id,source:'V2.55.5 touchpoints · P1.2.1 normalized'});n++;}});return n;}
function available(v){const s=String(v||'').trim().toLowerCase();return s && !['-','n/a','na','tidak tersedia','none'].includes(s);}
function run(){if(!window.GECore||!window.GERelationship)return null;GECore.bootstrap();GERelationship.bootstrap();const d=legacy()||{};const result={version:VERSION,touchpointsNormalized:repairTouchpoints(d),created:{services:0,capabilities:0,relationships:0},mappingRequired:[]};
 // Touch Point -> Service: only exact labels from the existing controlled touchpoint list.
 Object.entries(TP_SERVICE).forEach(([tpName,[code,name]])=>{const tp=GECore.list('touchpoints',{includeArchived:true}).find(x=>x.name===tpName);if(!tp)return;const before=GECore.list('services',{includeArchived:true}).length;const svc=ensureMaster('services',code,name,{serviceType:'Ground Experience'});if(GECore.list('services',{includeArchived:true}).length>before)result.created.services++;if(seedRel('touchpoint_service',tp.id,svc.id,'P1.2.1 exact Touch Point label mapping'))result.created.relationships++;});
 // Explicit airport-system fields -> Station Service. No inference from free-text equipment content.
 const stationByCode=c=>GECore.list('stations',{includeArchived:true}).find(s=>String(s.code).toUpperCase()===String(c||'').toUpperCase());
 (d.airportSystems||[]).forEach(row=>{const st=stationByCode(row.airport);if(!st){result.mappingRequired.push({domain:'Airport Systems',source:String(row.airport||'—'),relationship:'Station → Service',reason:'Station master not found'});return;}Object.entries(SYS_SERVICES).forEach(([field,[code,name]])=>{if(!available(row[field]))return;const before=GECore.list('services',{includeArchived:true}).length;const svc=ensureMaster('services',code,name,{serviceType:'Airport Service'});if(GECore.list('services',{includeArchived:true}).length>before)result.created.services++;if(seedRel('station_service',st.id,svc.id,`P1.2.1 Airport Systems.${field} explicit availability`))result.created.relationships++;});});
 // Service -> Capability: controlled semantic mappings only.
 Object.entries(SERVICE_CAP).forEach(([serviceCode,[capCode,capName]])=>{const svc=GECore.list('services',{includeArchived:true}).find(s=>s.code===serviceCode);if(!svc)return;const before=GECore.list('capabilities',{includeArchived:true}).length;const cap=ensureMaster('capabilities',capCode,capName,{capabilityType:'Service Capability'});if(GECore.list('capabilities',{includeArchived:true}).length>before)result.created.capabilities++;if(seedRel('service_capability',svc.id,cap.id,'P1.2.1 controlled Service → Capability mapping'))result.created.relationships++;});
 // Physical Service Location cannot be safely derived from touchpoint/airport-system text.
 if(GECore.list('serviceLocations',{includeArchived:true}).length===0){result.mappingRequired.push({domain:'Service Location',source:'Existing portal data',relationship:'Station → Service Location',reason:'No explicit physical Service Location master/source available'});result.mappingRequired.push({domain:'Service Location',source:'Existing portal data',relationship:'Service Location → Touch Point',reason:'Cannot infer physical location from Touch Point label'});}
 result.stats=GERelationship.stats();result.integrity=GERelationship.integrity();result.runAt=new Date().toISOString();localStorage.setItem(META_KEY,JSON.stringify(result));return result;}
function report(){try{return JSON.parse(localStorage.getItem(META_KEY))||run()}catch(e){return run()}}
window.GEP121={version:VERSION,run,report,metaKey:META_KEY};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
