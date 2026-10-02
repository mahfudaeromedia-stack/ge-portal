/* Ground Experience V2.57 P1.4 Permission Foundation
   Effective Access = Role + Scope + Domain + Action + Sensitivity + Business Authority.
   Additive prototype policy layer. Super Admin is system authority, not automatic business authority. */
(function(){
'use strict';
const KEY='GE_V257_PERMISSION_P14', SCHEMA='2.57-P1.4.1/P1.6';
const now=()=>new Date().toISOString(); const clone=x=>JSON.parse(JSON.stringify(x));
const uid=p=>`${p}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2,8)}`;
const ACTIONS=['View','Create','Edit','Submit','Verify','Publish','Export','Configure','Assess','Recommend','Record Direction','Authorize'];
const SENS=['Internal','Restricted','Confidential'];
const base=()=>({schemaVersion:SCHEMA,createdAt:now(),updatedAt:now(),roles:[],grants:[],authorities:[],meta:{bootstrapComplete:false}});
function read(){try{return JSON.parse(localStorage.getItem(KEY))||base()}catch(e){return base()}}
function write(db){db.updatedAt=now();localStorage.setItem(KEY,JSON.stringify(db));return db}
function session(){try{return (window.gxGetSession&&gxGetSession())||JSON.parse(sessionStorage.getItem('GXP_SESSION_V24')||'null')}catch(e){return null}}
function roleKey(role){return String(role||'Viewer').toLowerCase().replace(/\s+/g,'-')}
function bootstrap(){const db=read();
 if(db.meta&&db.meta.bootstrapComplete){
  const addMissing=(role,domain,actions,scope='ALL',maxSensitivity='Internal')=>{if(!db.grants.some(g=>g.active&&g.role===role&&g.domain===domain))db.grants.push({id:uid('grant'),role,domain,actions,scope,maxSensitivity,active:true});};
  addMissing('Super Admin','Shared Objects',['View','Create','Edit','Export'],'ALL','Confidential');
  addMissing('Admin','Shared Objects',['View','Create','Edit','Export'],'ALL','Restricted');
  addMissing('GE Team','Shared Objects',['View','Create','Edit'],'ALL','Internal');
  addMissing('Branch Office','Shared Objects',['View','Create','Edit'],'STATION','Internal');
  addMissing('Management','Shared Objects',['View'],'ALL','Restricted');
  addMissing('Viewer','Shared Objects',['View'],'ALL','Internal');
  db.meta.p16SharedGrant=true; write(db); return db;
 }
 db.roles=[
  {id:'role:super-admin',name:'Super Admin',systemAuthority:true},
  {id:'role:admin',name:'Admin',systemAuthority:false},
  {id:'role:ge',name:'GE Team',systemAuthority:false},
  {id:'role:bo',name:'Branch Office',systemAuthority:false},
  {id:'role:management',name:'Management',systemAuthority:false},
  {id:'role:viewer',name:'Viewer',systemAuthority:false}
 ];
 const add=(role,domain,actions,scope='ALL',maxSensitivity='Internal')=>db.grants.push({id:uid('grant'),role,domain,actions,scope,maxSensitivity,active:true});
 add('Super Admin','System Configuration',['View','Create','Edit','Configure','Export'],'ALL','Confidential');
 add('Super Admin','Core Master',['View','Create','Edit','Submit','Export'],'ALL','Restricted');
 add('Super Admin','Relationship',['View','Create','Edit','Submit','Export'],'ALL','Restricted');
 add('Super Admin','Publication',['View','Create','Submit','Export'],'ALL','Restricted');
 add('Admin','Core Master',['View','Create','Edit','Submit','Export'],'ALL','Restricted');
 add('Admin','Relationship',['View','Create','Edit','Submit','Export'],'ALL','Restricted');
 add('Admin','Publication',['View','Create','Submit','Verify','Publish','Export'],'ALL','Restricted');
 add('GE Team','Core Master',['View'],'ALL','Internal'); add('GE Team','Relationship',['View'],'ALL','Internal'); add('GE Team','Publication',['View','Create','Submit'],'ALL','Internal');
 add('Branch Office','Core Master',['View'],'STATION','Internal'); add('Branch Office','Relationship',['View'],'STATION','Internal'); add('Branch Office','Publication',['View','Create','Submit'],'STATION','Internal');
 add('Management','Core Master',['View'],'ALL','Restricted'); add('Management','Relationship',['View'],'ALL','Restricted'); add('Management','Publication',['View'],'ALL','Restricted');
 add('Viewer','Core Master',['View'],'ALL','Internal'); add('Viewer','Relationship',['View'],'ALL','Internal');
 add('Super Admin','Shared Objects',['View','Create','Edit','Export'],'ALL','Confidential');
 add('Admin','Shared Objects',['View','Create','Edit','Export'],'ALL','Restricted');
 add('GE Team','Shared Objects',['View','Create','Edit'],'ALL','Internal');
 add('Branch Office','Shared Objects',['View','Create','Edit'],'STATION','Internal');
 add('Management','Shared Objects',['View'],'ALL','Restricted');
 add('Viewer','Shared Objects',['View'],'ALL','Internal');
 // Explicit business authorities. Super Admin intentionally gets none by default.
 db.authorities=[
  {id:'auth:admin-core-verifier',type:'Data Verification',domain:'Core Master',holderRole:'Admin',scope:'ALL',actions:['Verify'],active:true,validFrom:'2026-01-01',validTo:null},
  {id:'auth:admin-core-publisher',type:'Data Publication',domain:'Core Master',holderRole:'Admin',scope:'ALL',actions:['Publish'],active:true,validFrom:'2026-01-01',validTo:null},
  {id:'auth:admin-rel-verifier',type:'Data Verification',domain:'Relationship',holderRole:'Admin',scope:'ALL',actions:['Verify'],active:true,validFrom:'2026-01-01',validTo:null},
  {id:'auth:admin-rel-publisher',type:'Data Publication',domain:'Relationship',holderRole:'Admin',scope:'ALL',actions:['Publish'],active:true,validFrom:'2026-01-01',validTo:null}
 ];
 db.meta.bootstrapComplete=true;db.meta.bootstrapAt=now();write(db);return db}
function roleName(u){const r=String(u&&u.role||'Viewer'); if(r==='Staff')return 'GE Team'; return r}
function rankSensitivity(s){return {Internal:1,Restricted:2,Confidential:3}[s]||1}
function stationScope(u){const a=Array.isArray(u&&u.assignedStations)?u.assignedStations:Array.isArray(u&&u.airports)?u.airports:[];return a.map(x=>String(x).toUpperCase())}
function menuScope(u){const a=Array.isArray(u&&u.menuAccess)?u.menuAccess:Array.isArray(u&&u.tabs)?u.tabs:[];return a.map(x=>String(x))}
function menuAllowed(u,page){const items=menuScope(u);return !items.length||items.includes(page)||items.includes('*')}
function effectiveScope(u){return {stations:stationScope(u),lounges:Array.isArray(u&&u.assignedLounges)?u.assignedLounges:(Array.isArray(u&&u.loungeIds)?u.loungeIds:[]),initiatives:Array.isArray(u&&u.assignedInitiatives)?u.assignedInitiatives:[],tasks:Array.isArray(u&&u.assignedTasks)?u.assignedTasks:[]}}
function scopeAllowed(grant,u,ctx){if(grant.scope==='ALL')return true;if(grant.scope==='STATION'){
 const allowed=stationScope(u); if(!allowed.length)return false; const code=String(ctx.stationCode||ctx.station||'').toUpperCase(); return !!code&&allowed.includes(code);
 } return false}
function authorityAllowed(u,domain,action,ctx){const db=read(),today=new Date().toISOString().slice(0,10),rn=roleName(u);return db.authorities.some(a=>a.active&&a.domain===domain&&a.holderRole===rn&&(a.actions||[]).includes(action)&&(!a.validFrom||a.validFrom<=today)&&(!a.validTo||a.validTo>=today)&&(a.scope==='ALL'||scopeAllowed({scope:a.scope},u,ctx||{})))}
function check(input){bootstrap();const x=input||{},u=x.user||session();if(!u)return {allowed:false,reason:'No active session.',code:'NO_SESSION'};
 const rn=roleName(u),domain=x.domain||'Core Master',action=x.action||'View',sens=x.sensitivity||'Internal',ctx=x.context||{};
 const grants=read().grants.filter(g=>g.active&&g.role===rn&&(g.domain===domain||g.domain==='*')&&(g.actions||[]).includes(action));
 if(!grants.length)return {allowed:false,reason:`Role ${rn} tidak memiliki action ${action} pada domain ${domain}.`,code:'NO_GRANT'};
 const scoped=grants.find(g=>scopeAllowed(g,u,ctx));if(!scoped)return {allowed:false,reason:'Object berada di luar scope user.',code:'OUT_OF_SCOPE'};
 if(rankSensitivity(sens)>rankSensitivity(scoped.maxSensitivity))return {allowed:false,reason:`Sensitivity ${sens} melebihi batas akses ${scoped.maxSensitivity}.`,code:'SENSITIVITY'};
 const businessActions=['Verify','Publish','Assess','Record Direction','Authorize'];
 if(businessActions.includes(action)&&!authorityAllowed(u,domain,action,ctx))return {allowed:false,reason:`Action ${action} memerlukan Business Authority yang eksplisit. Role ${rn} saja tidak cukup.`,code:'AUTHORITY_REQUIRED'};
 return {allowed:true,reason:'Access granted.',code:'OK',role:rn,domain,action,scope:scoped.scope,maxSensitivity:scoped.maxSensitivity};
}
function requireAccess(input){const r=check(input);if(!r.allowed){const e=Error(r.reason);e.permissionResult=r;throw e}return r}
function explain(input){return check(input)}
function listAuthorities(){return clone(read().authorities)} function listGrants(){return clone(read().grants)}
function currentUser(){return clone(session())}
window.GEPermission={schemaVersion:SCHEMA,storageKey:KEY,actions:ACTIONS,sensitivities:SENS,read,bootstrap,check,requireAccess,explain,listAuthorities,listGrants,currentUser,stationScope,menuScope,menuAllowed,effectiveScope,reset:function(){localStorage.removeItem(KEY);return bootstrap()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap);else bootstrap();
})();
