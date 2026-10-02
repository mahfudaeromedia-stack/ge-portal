/* Canonical portal shell — single active shell implementation */
(function(){
'use strict';
const NAV_SVG={
 home:'<path d="M3 10.5 10 4l7 6.5V18H6v-7.5"/><path d="M8.5 18v-5h3v5"/>',
 cx:'<circle cx="10" cy="10" r="7"/><path d="M7 11c1.8 2 4.2 2 6 0"/><path d="M7.5 8h.01M12.5 8h.01"/>',
 journey:'<path d="M3 10h14M5.5 7.5 3 10l2.5 2.5M14.5 7.5 17 10l-2.5 2.5"/>',
 network:'<path d="M2.5 11h15M10 3.5v13M4.5 6.5h11M4.5 15h11"/><circle cx="10" cy="10" r="7.5"/>',
 station:'<path d="M4 17V7l6-4 6 4v10M7 17v-4h6v4M7 9h.01M10 9h.01M13 9h.01"/>',
 initiative:'<circle cx="10" cy="10" r="3"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4"/>',
 opportunity:'<path d="M10 2.5a5 5 0 0 0-3 9v2h6v-2a5 5 0 0 0-3-9Z"/><path d="M8 16h4M8.5 18h3"/>',
 scenario:'<path d="M3 5h5l2 3 2-3h5M3 15h5l2-3 2 3h5"/>',
 calendar:'<rect x="3" y="4.5" width="14" height="12.5" rx="2"/><path d="M6 2.5v4M14 2.5v4M3 8h14M6 11h2M10 11h2M6 14h2M10 14h2"/>',
 budget:'<rect x="3" y="5" width="14" height="11" rx="2"/><path d="M3 8h14M6 12h3"/>',
 readiness:'<path d="m4 10 4 4 8-9"/>',
 document:'<path d="M5 2.5h7l3 3V17H5Z"/><path d="M12 2.5V6h3M7.5 10h5M7.5 13h5"/>',
 data:'<ellipse cx="10" cy="5" rx="6" ry="2.5"/><path d="M4 5v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V5M4 10v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5"/>',
 user:'<circle cx="10" cy="7" r="3"/><path d="M4.5 17c.5-3 2.3-4.5 5.5-4.5s5 1.5 5.5 4.5"/>',
 history:'<path d="M4 6H1.8V3.8"/><path d="M3 6a7 7 0 1 1-.2 7"/><path d="M10 6v4l3 2"/>',
 support:'<path d="M4 10a6 6 0 0 1 12 0v5M4 11H2.5v4H6v-4H4M16 11h1.5v4H14v-4h2M14 17h-3"/>',
 standard:'<path d="M4 5h12M4 10h12M4 15h12"/>'
};
function icon(x){const key=({'⌂':'home','◎':'cx','↔':'journey','✈':'network','⌾':'station','⚙':'initiative','✧':'opportunity','◇':'scenario','▦':'calendar','▣':'budget','◉':'budget','✓':'readiness','▤':'document','≡':'standard','⬡':'data','◫':'data','♙':'user','◷':'history','☎':'support','⇧':'data','◈':'station'})[x]||'standard';return `<span class="ni" aria-hidden="true"><svg viewBox="0 0 20 20">${NAV_SVG[key]}</svg></span>`;}
const path=()=>{const file=(location.pathname.split('/').pop()||'app.html').toLowerCase();if(file==='login.html')return'login.html';if(file==='app.html'){const route=String(new URLSearchParams(location.search).get('page')||'index').trim().toLowerCase();const aliases=(window.GE_ROUTE_ALIASES||{});const canonical=(aliases[route]||route).split('?')[0];return `${canonical}.html`;}return file;};
const cleanHref=(href)=>{const raw=String(href||'');const m=raw.match(/^([^?#]+)\.html(?:\?([^#]*))?/);if(!m||m[1]==='login'||m[1]==='change-password')return href;if(m[1]==='app'){const q=new URLSearchParams(m[2]||'');const requested=String(q.get('page')||'index').trim().toLowerCase();const aliases=(window.GE_ROUTE_ALIASES||{});const canonical=((aliases[requested]||requested).split('?')[0]||'index');q.set('page',canonical==='app'?'index':canonical);return 'app.html?'+q.toString();}const alias=(window.GE_ROUTE_ALIASES||{})[m[1]]||m[1];const parts=alias.split('?'),q=new URLSearchParams(parts[1]||'');new URLSearchParams(m[2]||'').forEach((v,k)=>q.set(k,v));q.set('page',parts[0]);return 'app.html?'+q.toString()};
const item=(href,label,i,sub=false)=>{const target=cleanHref(href),u=new URL(target,location.href),targetPage=(u.searchParams.get('page')||href.replace(/\.html.*$/,'')).toLowerCase()+'.html';return `<a class="ge-nav-link ${sub?'ge-nav-sub':''} ${path()===targetPage?'active':''}" href="${target}" title="${label}">${icon(i)}<span>${label}</span></a>`};
const airportChildren=()=>`<div class="ge-nav-section ge-airport-parent">AIRPORT EXPERIENCE NETWORK</div>${[
 item('airport-experience.html','Network & Map','✈',true),
 item('station-360.html','Station 360','⌾',true),
 item('service-experience.html','Service Experience','◎',true),
 item('capability-classification.html','Capability & Classification','◈',true)
].join('')}`;
const governanceItems=()=>[item('standar.html','Readiness & Standards','≡'),item('monitoring-assessment.html','Monitoring & Assessment','✓',true)];
function group(title,items){return `<div class="ge-nav-section">${title}</div>${items.join('')}`}
function isExternalPortalUser(s){const role=String(s?.role||'').trim().toLowerCase();const org=String(s?.organizationType||s?.organisationType||s?.orgType||'').trim().toLowerCase();return ['external user','external','collaborator','partner'].includes(role)||['partner','external','external partner','airline partner','vendor','supplier','ground handling agent','gha'].includes(org)}
function dashboardPOV(s){
 const r=String(s?.role||'').trim().toLowerCase().replace(/[\s_-]+/g,' ');
 const access=String(s?.accessLevel||'').trim().toLowerCase();
 if(r==='super admin'||r==='superadmin')return 'superadmin';
 if(isExternalPortalUser(s))return 'external';
 if(r==='admin')return 'admin';
 if(['head office','headoffice','ge team','ground experience team'].includes(r)&&access==='admin')return 'admin';
 if(r==='management')return 'management';
 if(['ge team','ground experience team','head office','headoffice','staff'].includes(r))return 'ge-team';
 if(['branch office','branchoffice','bo'].includes(r))return 'branch';
 return 'unresolved';
}
window.GXDashboardPOV=dashboardPOV;
const navItem=(href,label,i,sub=false)=>item(href,label,i,sub);
function navFor(s){
 const pov=dashboardPOV(s);
 const planning=[
   item('planning-workspace.html','Planning Workspace','◇')
 ];
 const commonSupport=group('SUPPORT',[item('berita.html','Berita & Informasi','▣'),item('kontak.html','Contact Support','☎')]);
 if(['Lounge Staff','Lounge Luar Biasa'].includes(s?.role)) return [
  group('LOUNGE OPERATION',[item('lounge-access.html','Lounge Access','◉'),item('lounge-visitor.html','Visitor & Report','▤')]),
  commonSupport].join('');
 if(pov==='external') {
  const extra=[];
  return [
   group('COLLABORATION',[item('inisiatif.html','Initiative','⚙'),item('calendar.html','Calendar & Project Tracking','▦')]),
   group('INFORMATION',[item('berita.html','Berita & Informasi','▣'),item('kontak.html','Contact Support','☎')]),
   ...extra].join('');
 }
 if(pov==='branch') return [
  item('index.html','Dashboard','⌂'),
  group('MY STATION',[item('station-360.html','Station Profile / 360','⌾'),item('readiness.html','Readiness','✓'),item('monitoring-assessment.html','Monitoring & Assessment','✓'),item('service-capability.html','Capability & Standards','◈')]),
  group('CUSTOMER EXPERIENCE',[item('customer-experience.html','Customer Experience','◎')]),
  group('TASKS & ACTIONS',[item('improvement-intake.html','Improvement Opportunity','✧'),item('inisiatif.html','Initiative & Action','⚙'),item('calendar.html','Calendar & Project Tracking','▦')]),
  group('IMPROVEMENT & PLANNING',planning),
  group('BUDGET & COST',[item('budget-cost.html','Budget & Cost','▣')]),
  group('DOCUMENTS / SUPPORT',[item('kontak.html','Support / Reference','☎')])].join('');
 if(pov==='ge-team') return [
  item('index.html','Dashboard','⌂'),
  group('CUSTOMER & AIRPORT EXPERIENCE',[item('customer-experience.html','Customer Experience','◎'),airportChildren()]),
  group('SERVICE GOVERNANCE',governanceItems()),
  group('IMPROVEMENT & PLANNING',[item('improvement-intake.html','Improvement Opportunity','✧'),item('inisiatif.html','Initiative & Improvement','⚙'),item('calendar.html','Calendar & Project Tracking','▦'),...planning]),
  group('BUDGET & COST',[item('budget-cost.html','Budget & Cost','▣'),item('cost-intelligence.html','Cost Intelligence','◉')]),
  group('DATA',[...((s?.accessLevel==='Admin')?[]:[item('data.html','Data Management','⬡')]),...(window.gxHasUserManagementPermission?.()?[item('admin.html','User & Access','♙')]:[])]),
  commonSupport].join('');
 if(pov==='admin') {
  const extraPerms=new Set([...(Array.isArray(s?.permissions)?s.permissions:[]),...(Array.isArray(s?.tabs)?s.tabs:[])].map(x=>String(x).toLowerCase()));
  const improve=[item('inisiatif.html','Initiative & Improvement','⚙'),item('calendar.html','Calendar & Project Tracking','▦'),...planning];
  if(extraPerms.has('improvement-opportunity')) improve.splice(1,0,item('improvement-intake.html','Improvement Opportunity','✧'));
  const cost=[item('budget-cost.html','Budget & Cost','▣')];if(extraPerms.has('cost-intelligence'))cost.push(item('cost-intelligence.html','Cost Intelligence','◉'));
  const adminData=[item('master-data.html','Master Data & Partners','◫'),item('app.html?page=attention-settings','Attention Rules','◉')];if(window.gxHasUserManagementPermission?.())adminData.push(item('admin.html','User & Access','♙'));if(extraPerms.has('data')&&s?.role==='Super Admin')adminData.splice(1,0,item('data.html','Data Management','⬡'));
  const decision=[];if(extraPerms.has('management-outcome'))decision.push(item('management-outcome.html','Management Outcome','◷'));
  return [item('index.html','Dashboard','⌂'),group('CUSTOMER & AIRPORT EXPERIENCE',[item('customer-experience.html','Customer Experience','◎'),airportChildren()]),group('SERVICE GOVERNANCE',governanceItems()),group('IMPROVEMENT & PLANNING',improve),group('BUDGET & COST',cost),...(decision.length?[group('REPORTS / DECISION SUPPORT',decision)]:[]),group('DATA & ADMINISTRATION',adminData),commonSupport].join('');
 }
 if(pov==='management') return [
  item('index.html','Dashboard','⌂'),
  group('EXPERIENCE & INSIGHT',[item('customer-experience.html','Customer Experience','◎'),airportChildren()]),
  group('SERVICE GOVERNANCE',governanceItems()),
  group('IMPROVEMENT & PLANNING',[item('inisiatif.html','Initiative & Improvement','⚙'),item('calendar.html','Calendar & Project Tracking','▦'),...planning]),
  group('BUDGET & COST',[item('budget-cost.html','Budget & Cost','▣')]),
  group('REPORTS / DECISION SUPPORT',[item('management-outcome.html','Management Outcome','◷')]),
  commonSupport].join('');
 if(pov==='superadmin') return [
  item('index.html','Dashboard','⌂'),
  group('CUSTOMER & AIRPORT EXPERIENCE',[item('customer-experience.html','Customer Experience','◎'),airportChildren()]),
  group('SERVICE GOVERNANCE',governanceItems()),
  group('IMPROVEMENT & PLANNING',[item('inisiatif.html','Initiative & Improvement','⚙'),item('improvement-intake.html','Improvement Opportunity','✧'),item('calendar.html','Calendar & Project Tracking','▦'),...planning]),
  group('BUDGET & COST',[item('budget-cost.html','Budget & Cost','▣'),item('cost-intelligence.html','Cost Intelligence','◉')]),
  group('DATA & ADMINISTRATION',[item('master-data.html','Master Data & Partners','◫'),item('app.html?page=attention-settings','Attention Rules','◉'),item('data.html','Data Management','⬡'),item('admin.html','User & Access','♙'),item('portal-management.html','Portal Management','⚙'),item('audit-log.html','Audit Log','◷')]),
  commonSupport].join('');
 return [group('DASHBOARD',[item('index.html','Dashboard','⌂')]),commonSupport].join('');
}

const DASHBOARD_CONTEXT_LABELS={superadmin:'Super Admin / System Dashboard',admin:'Ground Experience Admin Dashboard',management:'Management Dashboard','ge-team':'Ground Experience Team / Head Office Dashboard',branch:'Branch Office Dashboard',external:'Partner / External Collaboration'};
const finalUserPages=new Set(['index.html','customer-experience.html','cx-import.html','touchpoint.html','network-stations.html','airport-experience.html','service-experience.html','capability-classification.html','monitoring-assessment.html','station-360.html','inisiatif.html','improvement-intake.html','action-scenario.html','calendar.html','budget-cost.html','program-kerja.html','cost-intelligence.html','readiness.html','agreement-service.html','standar.html','data.html','master-data.html','attention-settings.html','admin.html','portal-management.html','audit-log.html','service-capability.html','service-locations.html','asset-facility.html','berita.html','kontak.html','management-outcome.html','airport-experience-map.html','map.html','profile.html','service-planning.html','planning-workspace.html','service-provider.html','space-building.html','station-resources.html','airport-systems-planning.html','planning-standards.html','planning-documents-hub.html','lounge-list.html','branch-office-planning.html','gaso-planning.html','planning-documents.html']);
const PLANNING_PAGES=new Set(['service-planning.html','planning-workspace.html','lounge-list.html','branch-office-planning.html','gaso-planning.html','planning-documents.html']);
const PLANNING_TABS=[
  ['lounge-list.html','Lounge / Tenant','lounge'],
  ['branch-office-planning.html','Branch Office','branch'],
  ['gaso-planning.html','GASO','gaso']
];
function planningContext(){
 const p=path();
 if(p==='lounge-list.html')return'lounge';
 if(p==='branch-office-planning.html')return'branch';
 if(p==='gaso-planning.html')return'gaso';
 return'';
}
function planningTabs(){
 if(!PLANNING_PAGES.has(path())||path()==='planning-workspace.html'||path()==='lounge-list.html')return;
 const main=document.querySelector('body > .shell > .main');if(!main||main.querySelector('.ge-planning-tabs'))return;
 const context=planningContext();
 const wrap=document.createElement('nav');wrap.className='ge-planning-tabs';wrap.setAttribute('aria-label','Planning Workspace');
 wrap.innerHTML=PLANNING_TABS.map(([href,label,key])=>`<a href="${cleanHref(href)}" class="${context===key?'active':''}" aria-current="${context===key?'page':'false'}"><span>${label}</span></a>`).join('');
 const target=main.querySelector('.hero,.ge-page-head,.title');
 if(target)target.insertAdjacentElement('afterend',wrap);else main.prepend(wrap);
 const title=main.querySelector('.hero h2,.ge-page-head h1');
 if(title&&path()!=='planning-workspace.html')title.dataset.gePlanningTitle=title.textContent.trim();
}
function cleanNavigation(){
 const side=document.querySelector('body > .shell > .side');if(!side)return;
 side.querySelectorAll('.ge-nav-section').forEach(section=>{
   let node=section.nextElementSibling,has=false;
   while(node&&!node.classList.contains('ge-nav-section')&&!node.classList.contains('ge-nav-divider')){
     if(node.matches?.('a.ge-nav-link')&&getComputedStyle(node).display!=='none'&&!node.classList.contains('rbac-hidden'))has=true;
     node=node.nextElementSibling;
   }
   section.style.display=has?'':'none';
 });
 side.querySelectorAll('.ge-nav-link[href]').forEach(a=>{const u=new URL(a.getAttribute('href')||'',location.href);const ap=(u.searchParams.get('page')||u.pathname.split('/').pop()?.replace(/\.html$/,'')||'index').toLowerCase()+'.html';const planningChild=PLANNING_PAGES.has(path())||(path()==='standar.html'&&new URLSearchParams(location.search).get('panel')==='skypriority');a.classList.toggle('active',planningChild?ap==='planning-workspace.html':path()===ap);});
}
function ensureShell(){
 if(path()==='login.html'||!finalUserPages.has(path())) return null;
 const top=document.querySelector('body > .top');
 const shell=document.querySelector('body > .shell');
 const side=shell&&shell.querySelector(':scope > .side');
 const main=shell&&shell.querySelector(':scope > .main');
 if(!top||!shell||!side||!main){console.warn('Final portal shell missing for',path());return null}
 return {top,shell,side,main};
}
function applyCollapsed(on){
 document.body.classList.toggle('sidebar-collapsed',!!on);document.documentElement.classList.remove('ge-precollapsed');
 try{localStorage.setItem('GE_V257_SIDEBAR_COLLAPSED',on?'1':'0')}catch(e){}
 const btn=document.querySelector('.ge-sidebar-toggle');
 if(btn){btn.setAttribute('aria-expanded',on?'false':'true');const a=btn.querySelector('.toggle-arrow');if(a)a.textContent=on?'»':'«'}
}
function sidebarToggle(){
 let btn=document.querySelector('.ge-sidebar-toggle');
 if(!btn){
   btn=document.createElement('button');btn.type='button';btn.className='ge-sidebar-toggle';btn.innerHTML='<span class="toggle-arrow">«</span><span class="toggle-label">Collapse</span>';const side=document.querySelector('body > .shell > .side');if(side)side.appendChild(btn);
 }
 btn.onclick=()=>applyCollapsed(!document.body.classList.contains('sidebar-collapsed'));
 let saved=false;try{saved=localStorage.getItem('GE_V257_SIDEBAR_COLLAPSED')==='1'}catch(e){}
 applyCollapsed(saved);
}
async function shell(){
 if(path()==='login.html'||!finalUserPages.has(path()))return;
 if(window.GX_AUTH_READY){
  try{await window.GX_AUTH_READY}catch(e){return}
  if(location.pathname.split('/').pop().toLowerCase()==='app.html' && !window.gxGetSession?.())return;
 }
 const refs=ensureShell();
 if(!refs)return;
 document.body.classList.add('final-v257','final-shell-r5');
 const s=window.gxGetSession?gxGetSession():window.GX_CURRENT_USER||{};
 const pov=dashboardPOV(s);
 const initials=(s.name||s.username||'GE').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
 const roleLabel=pov==='branch'?(s.unit||'Branch Office'):(pov==='ge-team'?'Ground Experience Team':(s.role||'User'));
 const context={superadmin:'Dashboard',admin:'Dashboard',management:'Dashboard','ge-team':'Ground Experience Team / Head Office Dashboard',branch:'Dashboard',external:'Partner / External Collaboration',unresolved:'Dashboard — Role Not Mapped'}[pov]||'Dashboard';
 refs.top.innerHTML=`<button id="mobileNavTriggerV233" class="mobile-nav-trigger-v233 ge-iconbtn" type="button" aria-label="Menu">☰</button>
 <div class="ge-brand-logos"><img class="garuda" src="assets/garuda-horizontal-white.png" alt="Garuda Indonesia"><img class="danantara" src="assets/danantara-white-user.png" alt="Danantara Indonesia"></div>
 <div class="ge-title"><strong>GROUND EXPERIENCE PORTAL</strong><span>${context}</span></div>
 <div class="ge-session"><label class="filter"><span>Period</span><select id="gePeriodSelect" aria-label="Period"></select></label><button class="ge-top-action ge-notify" id="geNotifyBtn" type="button" title="Notifications" aria-label="Notifications"><span class="bell-shape"></span><b class="ge-notify-badge" id="geNotifyBadge" hidden></b></button><a class="ge-top-action ge-help" href="kontak.html" title="Help" aria-label="Help">?</a><button class="ge-user-menu" id="geUserMenuBtn" type="button" aria-expanded="false" aria-haspopup="menu"><span class="avatar">${initials}</span><span class="who"><b>${s.name||s.username||'User'}</b><span>${roleLabel}</span></span></button><div class="ge-user-pop" id="geUserPop" role="menu"><a href="profile.html" role="menuitem">Profile</a><button type="button" id="geMenuNotifications" role="menuitem">Notifications</button><button type="button" id="geLogoutBtn" role="menuitem">Sign Out</button></div><div class="ge-notify-pop" id="geNotifyPop" role="dialog" aria-label="Notifications"><div class="ge-pop-head"><b>Notifications</b><button type="button" id="geNotifyClose" aria-label="Close">×</button></div><div id="geNotifyList" class="ge-notify-list"></div></div></div>`;
 refs.side.innerHTML=navFor(s);
 if(typeof gxApplyNavigation==='function')gxApplyNavigation();
 cleanNavigation();
 planningTabs();
 sidebarToggle();
 const mt=document.getElementById('mobileNavTriggerV233'); if(mt)mt.onclick=()=>document.body.classList.toggle('nav-open');
 setupAccountControls(s);
 setupPeriodControl();
}
function setupAccountControls(s){
 const umb=document.getElementById('geUserMenuBtn'),up=document.getElementById('geUserPop');
 const np=document.getElementById('geNotifyPop'),nb=document.getElementById('geNotifyBtn'),nc=document.getElementById('geNotifyClose');
 const list=document.getElementById('geNotifyList'),badge=document.getElementById('geNotifyBadge');
 const notifications=()=>{try{const d=window.GEStore?.get?.()||{},uid=String(s?.uid||s?.id||'');return (Array.isArray(d.inbox)?d.inbox:[]).filter(x=>String(x.recipientId||'')===uid).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))}catch{return[]}};
 const notice=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const notificationUnread=x=>(x.notificationStatus||x.status||'Unread')==='Unread';
 const notificationTarget=x=>{const ref=x.referenceId||x.relatedId||'';if(x.destination)return x.destination;if(x.relatedType==='contactMessages')return `app.html?page=admin&support=${encodeURIComponent(ref)}`;if(['Initiative','Milestone'].includes(x.referenceType))return `app.html?page=inisiatif&initiative=${encodeURIComponent(ref)}${x.milestoneIndex!==undefined&&x.milestoneIndex!==''?'&milestone='+encodeURIComponent(x.milestoneIndex):''}`;return `app.html?page=admin&inbox=${encodeURIComponent(x.id)}`};
 const renderNotifications=()=>{const rows=notifications(),unread=rows.filter(notificationUnread).length;if(badge){badge.textContent=unread>99?'99+':String(unread);badge.hidden=!unread}if(!list)return;list.style.maxHeight='60vh';list.style.overflowY='auto';list.innerHTML=rows.length?rows.map(x=>`<button type="button" class="ge-notify-item" data-notify-id="${notice(x.id)}" style="display:block;width:100%;text-align:left;border:0;cursor:pointer;${notificationUnread(x)?'font-weight:700;':''}"><b>${notice(x.subject||x.title||x.type||'Notification')}</b><span>${notice(x.message||x.detail||'')}</span></button>`).join(''):'<div class="ge-notify-empty">No notifications available.</div>';
 list.querySelectorAll('[data-notify-id]').forEach(b=>b.onclick=async()=>{const x=rows.find(v=>String(v.id)===b.dataset.notifyId);if(!x)return;const dest=notificationTarget(x);if(notificationUnread(x)){try{await window.GEStore.markInboxRead(x.id,'notification');renderNotifications()}catch(err){renderNotifications();const warning=document.createElement('p');warning.setAttribute('role','alert');warning.className='ge-notify-error';warning.textContent='Status notifikasi belum tersimpan: '+(err.message||err);list.prepend(warning);return}}location.assign(dest)})};
 const closeAll=()=>{up?.classList.remove('open');np?.classList.remove('open');umb?.setAttribute('aria-expanded','false')};
 umb?.addEventListener('click',e=>{e.stopPropagation();np?.classList.remove('open');up?.classList.toggle('open');umb.setAttribute('aria-expanded',up.classList.contains('open')?'true':'false')});
 nb?.addEventListener('click',async e=>{e.stopPropagation();up?.classList.remove('open');np?.classList.toggle('open');try{await window.GEStore?.hydrate?.(['inbox'])}catch(err){console.warn('[Notifications]',err)}renderNotifications()});
 nc?.addEventListener('click',closeAll);
 document.getElementById('geMenuNotifications')?.addEventListener('click',e=>{e.stopPropagation();up?.classList.remove('open');np?.classList.add('open');renderNotifications()});
 document.getElementById('geLogoutBtn')?.addEventListener('click',()=>gxLogout());
 document.addEventListener('click',closeAll,{capture:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
 window.addEventListener('gx-inbox-ready',renderNotifications);
 renderNotifications();
}
function setupPeriodControl(){
 const sel=document.getElementById('gePeriodSelect');if(!sel)return;
 const years=new Set();
 try{const d=window.GEStore?.get?.()||{};[...(d.initiatives||[]),...(d.budgets||[]),...(d.actuals||[]),...(d.measurements||[])].forEach(x=>{const raw=x.periodStart||x.period||x.year||x.date||x.updatedAt||x.createdAt;const m=String(raw||'').match(/(20\d{2})/);if(m)years.add(m[1])})}catch(e){}
 if(!years.size)years.add(String(new Date().getFullYear()));
 const ordered=[...years].sort((a,b)=>Number(b)-Number(a));sel.innerHTML=ordered.map(y=>`<option value="${y}">${y}</option>`).join('');
 let saved='';try{saved=localStorage.getItem('GE_V257_DASHBOARD_PERIOD')||''}catch(e){};if(saved&&ordered.includes(saved))sel.value=saved;
 sel.addEventListener('change',()=>{try{localStorage.setItem('GE_V257_DASHBOARD_PERIOD',sel.value)}catch(e){};document.dispatchEvent(new CustomEvent('ge-dashboard-period-change',{detail:{year:sel.value}}))});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{shell()}, {once:true});else shell();
})();
