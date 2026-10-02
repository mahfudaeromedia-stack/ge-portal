/* Ground Experience V2.57 P2.4 Station 360 / Network 360 */
(function(){
'use strict';
const SCHEMA='2.57-P2.4';
const clone=x=>JSON.parse(JSON.stringify(x));
const relType=r=>r.relationshipType||r.type||'';
function rels(){return window.GERelationship?GERelationship.list({includeArchived:false}):[]}
function sharedFor(type,id){try{return window.GEShared&&GEShared.objectsForSubject?GEShared.objectsForSubject(type,id):[]}catch(e){return []}}
function legacy(){try{return window.GEStore&&GEStore.get?GEStore.get():{}}catch(e){return {}}}
function station360(stationId,asOf){
 if(window.GENetwork)GENetwork.bootstrap(); if(window.GEServiceLocation)GEServiceLocation.bootstrap(); if(window.GEServiceChain)GEServiceChain.bootstrap();
 const station=GECore.get('stations',stationId); if(!station)return null;
 const network=GENetwork.station360(stationId,asOf), rr=rels(), chain=GEServiceChain.chainForStation(stationId);
 const directServices=chain?chain.directServices:[];
 const locations=(chain?chain.locations:[]).map(row=>({
   location:row.location,
   touchpoints:row.touchpoints.map(t=>({touchpoint:t.touchpoint,services:t.services.map(s=>({service:s.service,capabilities:s.capabilities}))})),
   supportingRecords:sharedFor('serviceLocations',row.location.id)
 }));
 const serviceIds=new Set(directServices.map(s=>s.id)); locations.forEach(l=>l.touchpoints.forEach(t=>t.services.forEach(s=>serviceIds.add(s.service.id))));
 const services=[...serviceIds].map(id=>GEServiceChain.service360(id)).filter(Boolean);
 const support=[...sharedFor('stations',stationId),...sharedFor('station',stationId)];
 const l=legacy(), code=String(station.code||'').toUpperCase();
 const sourceRefs=[];
 const add=(domain,rows,match)=>{const a=Array.isArray(rows)?rows:[];const n=a.filter(match).length;if(n)sourceRefs.push({domain,count:n,status:'Reference Only'});};
 add('Airport Systems',l.airportSystems,r=>String(r.airport||r.station||'').toUpperCase()===code);
 add('Lounge Master',l.lounges||l.loungeList,r=>String(r.airport||r.station||r.code||'').toUpperCase()===code);
 add('Station Material',l.stationMaterials,r=>String(r.station||r.airport||'').toUpperCase()===code);
 add('BO Space',l.boSpaces,r=>String(r.station||r.airport||'').toUpperCase()===code);
 const missing=[];
 if(!network.profile)missing.push('Station Profile');
 if(station.airportId&&!network.airport)missing.push('Airport reference');
 if(!network.responsibleOrganization)missing.push('Responsible Organization');
 if(!locations.length)missing.push('Service Location');
 if(!services.length)missing.push('Service mapping');
 const rd=(window.GEReadiness&&GEReadiness.stationReadiness)?GEReadiness.stationReadiness(stationId):null;
 const future=[
  {area:'Standards & Readiness',status:rd?rd.status:'Unavailable',reason:rd?(rd.score==null?'Belum ada assessment yang dapat dihitung':('Readiness '+rd.score+'% · '+rd.gaps+' gap')):'P2.5 engine belum tersedia'},
  {area:'Agreement & Service Availability',status:(window.GEAgreement?(GEAgreement.stationSummary(stationId,asOf).status):'Unavailable'),reason:(window.GEAgreement?(function(a){return a.total?(a.effective+' effective · '+a.expired+' expired · '+a.serviceAvailable+' service available'):'Belum ada agreement terdaftar'})(GEAgreement.stationSummary(stationId,asOf)):'P2.6 engine belum tersedia')},
  {area:'Customer Experience & Insight',status:(window.GECustomerExperience?(GECustomerExperience.stationSummary(stationId).status):'Unavailable'),reason:(window.GECustomerExperience?(function(c){return c.publishedMeasurements?(c.publishedMeasurements+' published measurement · '+c.openInsights+' open insight · '+c.openFindings+' open finding'):'Belum ada CX Measurement berstatus Published'})(GECustomerExperience.stationSummary(stationId)):'P2.7 engine belum tersedia')}
 ];
 return {schemaVersion:'2.57-P2.4.1',asOf:asOf||new Date().toISOString(),station,airport:network.airport,profile:network.profile,responsibleOrganization:network.responsibleOrganization,locations,services,supportingRecords:support,sourceReferences:sourceRefs,missing,future,relationshipCount:rr.filter(r=>r.sourceId===stationId||r.targetId===stationId).length};
}
function network360(asOf){
 const stations=GECore.list('stations'), locations=GECore.list('serviceLocations',{includeArchived:false}), rr=rels();
 const profiles=(window.GENetwork&&GENetwork.list)?GENetwork.list():[];
 const airports=new Map(GECore.list('airports').map(x=>[x.id,x])), orgs=new Map(GECore.list('organizations').map(x=>[x.id,x]));
 return stations.map(st=>{const p=profiles.find(x=>x.stationId===st.id)||null, airport=st.airportId?airports.get(st.airportId):null; const resp=rr.find(r=>relType(r)==='station_responsibility'&&r.sourceId===st.id), oid=(resp&&resp.targetId)||(p&&p.responsibleOrganizationId)||st.responsibleOrganizationId, org=oid?orgs.get(oid):null; const locs=locations.filter(l=>l.stationId===st.id), lids=new Set(locs.map(l=>l.id)), tids=new Set(rr.filter(r=>relType(r)==='location_touchpoint'&&lids.has(r.sourceId)).map(r=>r.targetId)), sids=new Set(rr.filter(r=>(relType(r)==='station_service'&&r.sourceId===st.id)||(relType(r)==='touchpoint_service'&&tids.has(r.sourceId))).map(r=>r.targetId)); const missing=[]; if(!p)missing.push('Station Profile'); if(st.airportId&&!airport)missing.push('Airport reference'); if(!org)missing.push('Responsible Organization'); if(!locs.length)missing.push('Service Location'); if(!sids.size)missing.push('Service mapping'); return {stationId:st.id,code:st.code,name:st.name,airport:airport?airport.name:'Non-airport context',organization:org?org.name:'Mapping Required',locations:locs.length,services:sids.size,support:0,status:missing.length?'REVIEW':'PASS',missing};});
}
function stats(asOf,rows){const r=rows||network360(asOf);return {stations:r.length,pass:r.filter(x=>x.status==='PASS').length,review:r.filter(x=>x.status==='REVIEW').length,locations:r.reduce((a,x)=>a+x.locations,0),services:r.reduce((a,x)=>a+x.services,0),support:r.reduce((a,x)=>a+x.support,0)};}
window.GEStation360={schemaVersion:'2.57-P2.4.1',station360,network360,stats};
})();
