/* P40 Edition 1 canonical page boot.
 * Shell ownership: assets/portal-shell.js (same shell as the production dashboard).
 * Business-data ownership: Firebase/Firestore through /api/edition1-data.
 */
(function(){
'use strict';
const file=(location.pathname.split('/').pop()||'app.html').toLowerCase();
const page=file==='app.html'?String(new URLSearchParams(location.search).get('page')||'index').trim().toLowerCase():file.replace(/\.html$/,'').replace(/^e1-/,'');
const config={
 'standar':{perm:'services',collections:['airports','personnel','touchpointStandards','skyPriority','announcements','standardContent']},
 'inisiatif':{perm:'initiatives',collections:['initiatives','touchpoints','documents','inbox','airports']},
 'service-planning':{perm:'planning',collections:['stationMaterials','lounges','boSpaces','airportSystems','touchpointStandards','documents','serviceProcurement']},
 'calendar':{perm:'initiatives',collections:['initiatives','projectEvents','touchpoints','inbox','airports']},
 'planning-documents':{perm:'planning',collections:['documents','initiatives']},
 'data':{perm:'data',collections:['airports','personnel']},
 'admin':{perm:'admin',collections:['users','inbox','contactMessages','auditLogs','airports','lounges']},
 'berita':{perm:'news',collections:['articles','announcements','faqs','news','documents']},
 'kontak':{perm:'contact',collections:['contactMessages','inbox']},
 'lounge-list':{perm:'planning',collections:['lounges','loungeVisitors','serviceProcurement','documents']},
 'branch-office-planning':{perm:'planning',collections:['lounges','boSpaces','serviceProcurement','airportSystems','stationMaterials','documents']},
 'gaso-planning':{perm:'planning',collections:['gasoMaster','gasoServiceSupport','gasoPlanningService','airports','documents']},
 'airport-experience':{perm:'services',collections:['airports','lounges','airportSystems','personnel','serviceProcurement','facilities','assets']}
};
const cfg=config[page]; if(!cfg)return;
function session(){return typeof window.gxGetSession==='function'?(gxGetSession()||{}):window.GX_CURRENT_USER||{}}
function showStatus(message,error=false){const role=String(session().role||'');let b=document.getElementById('e1DataStatus');if(role!=='Super Admin'){b?.remove();return}if(!b){b=document.createElement('div');b.id='e1DataStatus';b.className='e1-data-status';document.querySelector('main.main')?.prepend(b)}b.textContent=message;b.dataset.error=error?'1':'0';b.style.display=message?'block':'none'}
async function ensureFirebase(){
 if(!window.GX_FIREBASE_CONFIG){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='assets/firebase-config.js?v=e1-runtime';s.onload=resolve;s.onerror=()=>reject(new Error('Firebase config gagal dimuat.'));document.head.appendChild(s)})}
 if(!window.GXFirebase){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='assets/firebase-client.js?v=e1-runtime';s.onload=resolve;s.onerror=()=>reject(new Error('Firebase client gagal dimuat.'));document.head.appendChild(s)})}
 if(!window.GXFirebase)throw new Error('Firebase runtime unavailable.');
 const state=await window.GXFirebase.init();
 if(!state?.ready)throw state?.error||new Error('Firebase runtime unavailable.');
 return state;
}
async function waitFirebase(){const state=await ensureFirebase();const u=await window.GXFirebase.currentUser();if(!u)throw new Error('Authentication required.');return{state,u}}
async function waitStore(){
 if(window.GEStore&&typeof window.GEStore.hydrate==='function')return window.GEStore;
 // If the declared store script did not initialize, retry the same canonical store once.
 await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='assets/edition1-store.js?v=r29&retry=1';s.dataset.e1StoreRetry='1';s.onload=resolve;s.onerror=()=>reject(new Error('Edition1 data store gagal dimuat.'));document.body.appendChild(s)});
 const deadline=Date.now()+5000;
 while(Date.now()<deadline){if(window.GEStore&&typeof window.GEStore.hydrate==='function')return window.GEStore;await new Promise(r=>setTimeout(r,25));}
 throw new Error('Edition1 data store gagal diinisialisasi setelah retry canonical store.');
}
function hasAccess(){if(cfg.perm==='admin')return window.gxHasUserManagementPermission?.()||session().role==='Super Admin';return window.gxHasPermission?.(cfg.perm)!==false}
function rerender(){
 if(page==='standar'){const panel=new URLSearchParams(location.search).get('panel');const panelButton=panel?document.querySelector(`[data-standard-panel="${panel}"]`):null;if(panel&&window.showStandardPanel)window.showStandardPanel(panel,panelButton);window.renderTouchpointStandards?.();window.renderPersonnelReadiness?.();window.renderSkyPriority?.();window.geEnsureStandardModalV248?.();window.geApplyStandardContentV248?.();window.renderAnnouncementLibraryV246?.()}
 else if(page==='inisiatif'){window.geInitInitiativeCanonical?.();window.geApplyInitiativePresentationV224?.();const params=new URLSearchParams(location.search),id=params.get('initiative');if(id)window.geFocusInitiativeR65?.(id,params.get('milestone'))}
 else if(page==='service-planning'){window.geRenderPlanningPage?.();window.renderStationMaterials?.()}
 else if(page==='calendar'){window.geUpgradeCalendarModalV252?.();window.geUpgradeReminderV253?.();window.geCalBuildFiltersV2533?.();window.geCalRenderV2533?.();window.geBindCalendarControlsCanonical?.();window.geInitCalendarWorkspaceCanonical?.()}
 else if(page==='planning-documents'){window.renderPlanningDocuments?.()}
 else if(page==='data'){window.renderAirports?.();window.renderPersonnel?.();window.renderDocumentsAdmin?.()}
 else if(page==='admin'){window.renderAdminOverview?.();window.renderAdminInbox?.();window.renderAuditLogs?.();window.p26RenderUsers?.();window.pmLoadPageR2?.();const params=new URLSearchParams(location.search),id=params.get('support'),message=params.get('inbox');if(id||message)window.showAdminSection?.('inbox',null);if(id)window.openSupportConversation?.(id);else if(message)window.openInboxDetail?.(message)}
 else if(page==='berita'){window.renderArticles?.();window.renderAnnouncements?.();window.renderFaqs?.();window.renderAnnouncementLibraryV246?.()}
 else if(page==='kontak'){if(!document.getElementById('supportConversations')){const el=document.createElement('section');el.id='supportConversations';el.className='card contact-form-card';document.querySelector('.contact-layout')?.after(el)}window.supportList?.();const id=new URLSearchParams(location.search).get('support');if(id)window.openSupportConversation?.(id)}
 else if(page==='lounge-list'){window.renderLounges?.();window.renderLoungeVisitors?.();window.renderLoungePriceSummaryV243?.();window.renderLoungeCardsV237?.();window.geInitFilterCombosR8?.('lounge')}
 else if(page==='branch-office-planning'){window.geRenderPlanningPage?.();window.renderAirportSystems?.();window.renderLoungeProcurement?.();window.renderBOSpaces?.()}
 else if(page==='gaso-planning'){window.renderGasoAllV231?.()}
 else if(page==='airport-experience'){window.geInitAirportCanonical?.();}
}
async function boot(){
 try{
  showStatus('Menghubungkan ke Firebase / Firestore…');
  const store=await waitStore();
  // Do not assume every deployed store revision exposes waitAuth. Auth/profile is already authoritative via GX_AUTH_READY.
  if(typeof store.waitAuth==='function') await store.waitAuth();
  else { if(window.GX_AUTH_READY) await window.GX_AUTH_READY; await waitFirebase(); }
  await waitFirebase();
  if(!hasAccess()){const target=typeof gxDefaultPage==='function'?gxDefaultPage():'app.html?page=index';if(new URL(target,location.href).href!==location.href)location.replace(target);return}
  showStatus('Mengambil data dari Firebase / Firestore…');
  await store.hydrate(page==='admin'&&session().role!=='Super Admin'?cfg.collections.filter(x=>x!=='auditLogs'):cfg.collections);
  if(page==='inisiatif'&&(session().role==='Super Admin'||session().role==='Admin'||String(session().accessLevel||'')==='Admin')) await store.hydrate(['users']);
  rerender();
  window.dispatchEvent(new Event('gx-inbox-ready'));
  if(!cfg.collections.includes('inbox'))store.hydrate(['inbox']).then(()=>window.dispatchEvent(new Event('gx-inbox-ready'))).catch(e=>console.warn('[Inbox notifications]',e));
  const d=store.get();
  const total=cfg.collections.reduce((n,k)=>{const v=d[k];return n+(Array.isArray(v)?v.length:(v&&typeof v==='object'?1:0))},0);
  showStatus(`Terhubung • Firestore • ${store.projectId||window.GX_FIREBASE_CONFIG?.projectId||'ground-experience-portal'} • ${total} record terhidrasi`);setTimeout(()=>showStatus(''),1400);
 }catch(e){console.error('[P40 Edition1 boot]',e);showStatus(e?.message||'Firebase / Firestore tidak dapat diakses.',true)}
}
window.addEventListener('gx-data-background-refresh',()=>{try{rerender()}catch(e){console.warn('[P40 background rerender]',e)}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
