const GX_SESSION_KEY='GXP_SESSION_V24';
const GX_SHARED_SESSION_KEY='GXP_SESSION_V24_SHARED';
const GX_RETURN_TO_KEY='GXP_RETURN_TO_V1';
const GX_DATA_KEY='GE_V2_1_DATA';
const GX_SYNC_KEY='GX_FIREBASE_SCOPE_SYNC_V1';
function gxGetPortalData(){try{return JSON.parse(localStorage.getItem(GX_DATA_KEY)||'null')}catch(e){return null}}
function gxGetUsers(){const d=gxGetPortalData();return Array.isArray(d?.users)?d.users:[]}
function gxGetSession(){try{const shared=JSON.parse(localStorage.getItem(GX_SHARED_SESSION_KEY)||'null');if(shared)return shared;const legacy=JSON.parse(sessionStorage.getItem(GX_SESSION_KEY)||'null');if(legacy){localStorage.setItem(GX_SHARED_SESSION_KEY,JSON.stringify(legacy));return legacy}}catch(e){}return null}
function gxSetSession(session){if(!session)return;const value=JSON.stringify(session);try{localStorage.setItem(GX_SHARED_SESSION_KEY,value)}catch(e){}try{sessionStorage.setItem(GX_SESSION_KEY,value)}catch(e){}window.GX_CURRENT_USER=session}
function gxClearSession(){try{sessionStorage.removeItem(GX_SESSION_KEY)}catch(e){}try{localStorage.removeItem(GX_SHARED_SESSION_KEY);localStorage.removeItem(GX_RETURN_TO_KEY);sessionStorage.removeItem(GX_SYNC_KEY)}catch(e){}window.GX_CURRENT_USER=null}
function gxCurrentRoute(){const page=(location.pathname.split('/').pop()||'index.html');return `${page}${location.search||''}${location.hash||''}`}
function gxSafeReturnTo(value){const raw=String(value||'').trim();if(!raw)return'';try{const url=new URL(raw,location.href);if(url.origin!==location.origin)return'';const page=(url.pathname.split('/').pop()||'index.html');if(!/^[a-z0-9][a-z0-9._-]*\.html$/i.test(page)||page.toLowerCase()==='login.html')return'';return `${page}${url.search}${url.hash}`}catch(e){return''}}
function gxRememberReturnTo(route=gxCurrentRoute()){const safe=gxSafeReturnTo(route);if(safe)try{localStorage.setItem(GX_RETURN_TO_KEY,safe)}catch(e){}return safe}
function gxConsumeReturnTo(){let candidate='';try{candidate=new URLSearchParams(location.search).get('next')||localStorage.getItem(GX_RETURN_TO_KEY)||'';localStorage.removeItem(GX_RETURN_TO_KEY)}catch(e){}return gxSafeReturnTo(candidate)}
function gxAuditDirect(action,module,objectLabel,detail,userOverride=null){try{const d=JSON.parse(localStorage.getItem(GX_DATA_KEY)||'null');if(!d)return;d.auditLogs=Array.isArray(d.auditLogs)?d.auditLogs:[];const u=userOverride||gxGetSession()||{};d.auditLogs.unshift({id:Date.now()+Math.floor(Math.random()*1000),timestamp:new Date().toISOString(),username:u.username||u.email||'system',name:u.name||u.username||u.email||'System',role:u.role||'System',action,module,object:objectLabel||'',detail:detail||''});if(d.auditLogs.length>5000)d.auditLogs=d.auditLogs.slice(0,5000);localStorage.setItem(GX_DATA_KEY,JSON.stringify(d))}catch(e){}}
async function gxAuthenticate(username,password){if(window.GXFirebase?.signInWithUsername)return window.GXFirebase.signInWithUsername(username,password);throw new Error('FIREBASE_UNAVAILABLE')}
async function gxApi(path,options={}){
  const clean=String(path||'').replace(/^\/+/, '').replace(/^api\//,'');
  if(!clean)throw new Error('API route tidak valid.');
  const authUser=await window.GXFirebase?.currentUser?.();
  if(!authUser)throw new Error('Authentication required.');
  const token=await authUser.getIdToken();
  const headers={...(options.headers||{}),Authorization:`Bearer ${token}`};
  if(options.body&&!headers['Content-Type'])headers['Content-Type']='application/json';
  const response=await fetch(`/api/${clean}`,{...options,headers});
  let payload=null;try{payload=await response.json()}catch(e){}
  if(!response.ok)throw new Error(payload?.message||`API request failed (${response.status}).`);
  return payload||{};
}

async function gxSyncFirebaseSession(){if(!window.GXFirebase?.currentUser)return null;const authUser=await window.GXFirebase.currentUser();if(!authUser)return null;const profile=await window.GXFirebase.currentProfile();if(!profile)return null;const session={...profile,uid:authUser.uid,email:profile.email||authUser.email||'',loginAt:Date.now(),authProvider:'firebase'};gxSetSession(session);return session}
async function gxLogout(){try{if(window.GXFirebase?.signOut)await window.GXFirebase.signOut()}catch(e){}const s=gxGetSession();gxAuditDirect('Logout','Authentication','Session','User logged out',s);gxClearSession();location.replace('login.html')}
function gxRoleLevel(role){return {'Lounge Staff':0,'Lounge Luar Biasa':0,'Staff':1,'Head Office':1,'GE Team':1,'Branch Office':1,'Management':1,'Viewer':1,'External User':1,'External':1,'Collaborator':1,'Admin':2,'Super Admin':3}[role]??0}
function gxCanManage(){const s=gxGetSession();return !!s&&(s.role==='Super Admin'||s.role==='Admin'||String(s.accessLevel||'')==='Admin')}
function gxHasUserManagementPermission(){const s=gxGetSession();return !!s&&(s.role==='Super Admin'||(['Head Office','GE Team','Ground Experience Team'].includes(s.role)&&String(s.accessLevel||'')==='Admin'))}
function gxAccessLevel(){const s=gxGetSession()||{};return String(s.accessLevel||(['Super Admin','Admin'].includes(s.role)?'Admin':'Viewer')).trim()}
function gxAccessLevelRank(){return ({Viewer:0,Editor:1,Approver:2,Admin:3})[gxAccessLevel()]??0}
function gxUserTabs(){const s=gxGetSession();return Array.isArray(s?.tabs)?s.tabs:[]}
function gxUserPermissions(){const s=gxGetSession();return Array.isArray(s?.permissions)?s.permissions:[]}
function gxIsExternal(){const s=gxGetSession()||{};const role=String(s.role||'').trim().toLowerCase();const org=String(s.organizationType||s.organisationType||s.orgType||'').trim().toLowerCase();return ['external user','external','collaborator','partner'].includes(role)||['partner','external','external partner','airline partner','vendor','supplier','ground handling agent','gha'].includes(org)}
function gxHasTab(tab){const s=gxGetSession();if(!s)return false;if(s.role==='Super Admin')return true;if(s.role==='Admin')return gxUserTabs().includes('ALL')||gxUserTabs().includes(tab);return gxUserTabs().includes('ALL')||gxUserTabs().includes(tab)}
function gxHasPermission(permission){
 const s=gxGetSession();if(!s)return false;
 if(permission==='user-admin')return gxHasUserManagementPermission();
 if(permission==='attention-settings')return s.role==='Super Admin'||(['Head Office','GE Team','Ground Experience Team'].includes(s.role)&&s.accessLevel==='Admin');
 if(permission==='data'&&['Head Office','GE Team','Ground Experience Team'].includes(s.role)&&String(s.accessLevel||'')==='Admin')return false;
 const role=String(s.role||'').trim().toLowerCase(),access=String(s.accessLevel||'').trim().toLowerCase();
 if(role==='super admin'||role==='superadmin')return true;
 if(gxIsExternal()){
   if(['initiatives','calendar','project-tracking','news','contact','inbox'].includes(permission))return true;
   return false;
 }
 if(role==='admin'||access==='admin'){
   const defaults=new Set(['home','services','initiatives','calendar','project-tracking','planning','budget','master','user-admin','news','contact','inbox']);
   if(defaults.has(permission))return true;
   return false;
 }
 const p=gxUserPermissions();if(p.length)return p.includes(permission);
 return gxHasTab(permission)
}
function gxAllowedAirports(){const s=gxGetSession();if(!s)return[];if(s.scopeType==='ALL'||s.role==='Super Admin')return[];return Array.isArray(s.airports)?s.airports:[]}
function gxAllowedLoungeIds(){const s=gxGetSession();if(!s)return[];if(s.scopeType==='ALL'||s.role==='Super Admin')return[];return Array.isArray(s.loungeIds)?s.loungeIds.map(String):[]}
function gxAirportAllowed(code){const allowed=gxAllowedAirports();return !allowed.length||allowed.includes(String(code||'').toUpperCase())}
function gxLoungeAllowed(id,airport){const ids=gxAllowedLoungeIds();if(ids.length)return ids.includes(String(id));return gxAirportAllowed(airport)}
const GX_PAGE_PERMISSION_MAP={'index.html':'home','customer-experience.html':'services','cx-import.html':'services','network-stations.html':'services','airport-experience.html':'services','service-experience.html':'services','capability-classification.html':'services','monitoring-assessment.html':'services','station-360.html':'services','airport-experience-map.html':'services','map.html':'services','touchpoint.html':'services','standar.html':'services','layanan.html':'services','service-capability.html':'services','service-locations.html':'services','readiness.html':'services','agreement-service.html':'services','pre-journey.html':'initiatives','pre-flight.html':'initiatives','post-flight.html':'initiatives','post-journey.html':'initiatives','inisiatif.html':'initiatives','improvement-intake.html':'improvement-opportunity','action-scenario.html':'initiatives','calendar.html':'initiatives','management-outcome.html':'management-outcome','budget-cost.html':'budget','program-kerja.html':'initiatives','cost-intelligence.html':'cost-intelligence','lounge-access.html':'lounge-access','lounge-visitor.html':'lounge-visitor','lounge-list.html':'planning','lounge-purchase.html':'lounge-purchase','lounge-flights.html':'lounge-flights','service-planning.html':'planning','planning-workspace.html':'planning','station-material.html':'planning','branch-office-planning.html':'planning','gaso-planning.html':'planning','lounge-procurement.html':'planning','bo-space.html':'planning','airport-systems.html':'planning','planning-documents.html':'planning','data.html':'data','master-data.html':'master','attention-settings.html':'attention-settings','berita.html':'news','kontak.html':'contact','admin.html':'user-admin','portal-management.html':'superadmin-only','audit-log.html':'superadmin-only','profile.html':'home'};
function gxDefaultPage(){const s=gxGetSession();if(!s)return'login.html';const pov=window.GXDashboardPOV?window.GXDashboardPOV(s):'unresolved';if(pov==='unresolved')return'app.html?page=index';if(gxIsExternal())return gxHasPermission('initiatives')?'app.html?page=inisiatif':'login.html';if(['Lounge Staff','Lounge Luar Biasa'].includes(s.role))return'app.html?page=lounge-access';if(gxHasTab('home'))return'app.html?page=index';const first=gxUserTabs()[0];return({services:'app.html?page=touchpoint',initiatives:'app.html?page=inisiatif',calendar:'app.html?page=calendar',planning:'app.html?page=service-planning','lounge-access':'app.html?page=lounge-access','lounge-visitor':'app.html?page=lounge-visitor','lounge-list':'app.html?page=lounge-list','lounge-flights':'app.html?page=lounge-flights',data:'app.html?page=data',news:'app.html?page=berita',contact:'app.html?page=kontak'})[first]||'app.html?page=index'}
function gxCurrentPageKey(){const file=(location.pathname.split('/').pop()||'app.html').toLowerCase();if(file==='app.html'){const route=String(new URLSearchParams(location.search).get('page')||'index').trim().toLowerCase();const alias={'airport-experience':'airport-experience-map','station-material':'station-material','bo-space':'bo-space','airport-systems':'airport-systems'};return `${alias[route]||route}.html`}return file}
function gxEnforcePageAccess(){const page=gxCurrentPageKey();if(page==='login.html'||page==='service.html')return;const s=gxGetSession();if(page==='index.html'&&s&&window.GXDashboardPOV&&window.GXDashboardPOV(s)==='unresolved')return;if(page==='admin.html'&&!gxHasUserManagementPermission())return;const permission=GX_PAGE_PERMISSION_MAP[page];if(permission&&!gxHasPermission(permission)){const target=gxDefaultPage();if(new URL(target,location.href).href!==location.href)location.replace(target)}}
function gxApplyRole(){const s=gxGetSession();if(!s)return;document.querySelectorAll('[data-role-min]').forEach(el=>{if(gxRoleLevel(s.role)<gxRoleLevel(el.dataset.roleMin))el.style.display='none'});document.querySelectorAll('[data-admin-only]').forEach(el=>{if(!gxCanManage())el.style.display='none'})}
function gxApplyNavigation(){const map=GX_PAGE_PERMISSION_MAP;document.querySelectorAll('.side a[href]').forEach(a=>{const u=new URL(a.getAttribute('href')||'',location.href);const href=u.pathname.endsWith('/app.html')?`${String(u.searchParams.get('page')||'index')}.html`:(u.pathname.split('/').pop()||'').toLowerCase();const permission=map[href];if(permission&&!gxHasPermission(permission))a.style.display='none'});document.querySelectorAll('[data-permission]').forEach(el=>{if(!gxHasPermission(el.dataset.permission))el.style.display='none'})}
function gxAuthDiagnostic(stage,details={}){try{const q=new URLSearchParams(location.search);const enabled=['localhost','127.0.0.1','::1'].includes(location.hostname)||q.get('authdiag')==='1';if(!enabled)return;const s={stage,...details};delete s.password;delete s.idToken;delete s.refreshToken;delete s.accessToken;console.info('[GX AUTH]',stage,s)}catch(_){}}
async function gxLoadFirebaseRuntime(){if(window.GXFirebase)return true;const add=src=>new Promise((resolve,reject)=>{if(document.querySelector('script[src^="'+src+'"]'))return resolve();const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});try{await add('assets/firebase-config.js');await add('assets/firebase-client.js');return !!window.GXFirebase}catch(e){return false}}
async function gxBootstrapProtectedPage(){
  if(location.pathname.endsWith('login.html'))return;
  const loaded=await gxLoadFirebaseRuntime();
  gxAuthDiagnostic('SESSION_INIT_START',{firebaseRuntimeLoaded:loaded,page:(location.pathname.split('/').pop()||'index.html')});
  if(loaded){try{
    const authUser=await GXFirebase.currentUser();
    if(!authUser){gxAuthDiagnostic('SESSION_AUTH_MISSING',{stage:'firebase-current-user'});gxClearSession();const next=gxRememberReturnTo();location.replace(`login.html${next?`?next=${encodeURIComponent(next)}`:''}`);return}
    gxAuthDiagnostic('SESSION_AUTH_SUCCESS',{uid:String(authUser.uid),emailPresent:!!authUser.email});
    let profile=null;
    try{profile=await GXFirebase.currentProfile();gxAuthDiagnostic('SESSION_PROFILE_SUCCESS',{uid:String(authUser.uid),profileFound:!!profile,rawRole:profile?.role??null,normalizedRole:profile?.role??null,rawAccessLevel:profile?.accessLevel??null,normalizedAccessLevel:profile?.accessLevel??null,scopeType:profile?.scopeType??null});}catch(profileError){gxAuthDiagnostic('SESSION_PROFILE_FAILED',{uid:String(authUser.uid),errorCode:profileError?.code||profileError?.message||null,errorName:profileError?.name||'Error',errorMessage:profileError?.authMessage||profileError?.message||'',errorStack:profileError?.stack||''});console.warn('Firebase profile read failed; using cached authenticated session',profileError)}
    const cached=gxGetSession();
    if(profile){
      gxSetSession({...profile,uid:authUser.uid,email:profile.email||authUser.email||'',authProvider:'firebase'});
    }else if(cached&&String(cached.uid||'')===String(authUser.uid)){
      gxSetSession({...cached,uid:authUser.uid,email:cached.email||authUser.email||'',authProvider:'firebase'});
    }else{
      gxAuthDiagnostic('SESSION_PROFILE_REQUIRED',{uid:String(authUser.uid),redirect:'login.html'});gxClearSession();const next=gxRememberReturnTo();location.replace(`login.html${next?`?next=${encodeURIComponent(next)}`:''}`);return;
    }
    if(gxIsExternal()&&window.GXFirebase.syncAccessibleInitiativesToLegacyStore){
      const syncDone=sessionStorage.getItem(GX_SYNC_KEY)==='1';
      if(!syncDone){try{await GXFirebase.syncAccessibleInitiativesToLegacyStore(gxGetSession());sessionStorage.setItem(GX_SYNC_KEY,'1');}catch(e){gxAuthDiagnostic('EXTERNAL_SCOPE_SYNC_FAILED',{uid:String(authUser.uid),errorName:e?.name||'Error',errorMessage:e?.message||''});console.warn('Firebase scope sync failed',e)}}
    }
    const pov=window.GXDashboardPOV?window.GXDashboardPOV(gxGetSession()):'unresolved';
    gxAuthDiagnostic('SESSION_AUTHORIZATION_RESOLVED',{uid:String(authUser.uid),rawRole:profile?.role??cached?.role??null,normalizedRole:gxGetSession()?.role??null,accessLevel:gxGetSession()?.accessLevel??null,scopeType:gxGetSession()?.scopeType??null,redirectTarget:gxDefaultPage(),dashboardPOV:pov});
    gxEnforcePageAccess();gxApplyRole();gxApplyNavigation();return
  }catch(e){gxAuthDiagnostic('SESSION_INIT_FAILED',{errorCode:e?.code||e?.message||null,errorName:e?.name||'Error',errorMessage:e?.authMessage||e?.message||'',errorStack:e?.stack||''});console.warn('Firebase session validation failed',e);const cached=gxGetSession();if(cached&&cached.uid){gxSetSession(cached);gxEnforcePageAccess();gxApplyRole();gxApplyNavigation();return}gxClearSession();const next=gxRememberReturnTo();location.replace(`login.html${next?`?next=${encodeURIComponent(next)}`:''}`);return}}
  if(!gxGetSession()){gxAuthDiagnostic('SESSION_NO_FIREBASE_NO_CACHE',{redirect:'login.html'});const next=gxRememberReturnTo();location.replace(`login.html${next?`?next=${encodeURIComponent(next)}`:''}`);return}
  gxEnforcePageAccess();gxApplyRole();gxApplyNavigation();
}
window.GX_AUTH_READY=(async function(){try{return await gxBootstrapProtectedPage()}catch(e){gxAuthDiagnostic('SESSION_BOOTSTRAP_UNHANDLED',{errorCode:e?.code||e?.message||null,errorName:e?.name||'Error',errorMessage:e?.authMessage||e?.message||'',errorStack:e?.stack||''});throw e}})();
