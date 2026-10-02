/* P40 Clean Draft — reference shell runtime.
 * Single shell owner for app.html. Uses the existing final-v257/R9 visual system.
 * No legacy portal-shell is loaded by Clean Draft.
 */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const route=()=>new URLSearchParams(location.search).get('page')||'index';
const hrefFor=(r,extra='')=>{const p=new URLSearchParams(extra);p.set('page',r);return 'app.html?'+p.toString()};
const icon={
home:'<path d="M3 10.5 10 4l7 6.5V18H6v-7.5"/><path d="M8.5 18v-5h3v5"/>',
journey:'<circle cx="10" cy="10" r="7"/><path d="M7 11c1.8 2 4.2 2 6 0"/><path d="M7.5 8h.01M12.5 8h.01"/>',
import:'<path d="M4 5h12M4 10h12M4 15h12"/>',
touch:'<path d="M3 10h14M10 3v14"/><circle cx="10" cy="10" r="2.5"/>',
network:'<path d="M2.5 11h15M10 3.5v13M4.5 6.5h11M4.5 15h11"/><circle cx="10" cy="10" r="7.5"/>',
station:'<path d="M4 17V7l6-4 6 4v10M7 17v-4h6v4M7 9h.01M10 9h.01M13 9h.01"/>',
initiative:'<circle cx="10" cy="10" r="3"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4"/>',
opportunity:'<path d="M10 2.5a5 5 0 0 0-3 9v2h6v-2a5 5 0 0 0-3-9Z"/><path d="M8 16h4M8.5 18h3"/>',
scenario:'<path d="M3 5h14M3 10h14M3 15h14"/><circle cx="7" cy="5" r="2"/><circle cx="13" cy="10" r="2"/>',
planning:'<path d="M5 3h10v14H5Z"/><path d="M8 6h4M8 9h4M8 12h4"/>',
lounge:'<path d="M4 10V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3M3 10h14v4H3Z"/><path d="M5 14v3M15 14v3"/>',
cost:'<path d="M4 16V9M8 16V5M12 16v-8M16 16V3"/>',
data:'<ellipse cx="10" cy="5" rx="6" ry="2.5"/><path d="M4 5v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V5M4 10v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5"/>',
admin:'<circle cx="10" cy="7" r="3"/><path d="M4.5 17c.5-3 2.3-4.5 5.5-4.5s5 1.5 5.5 4.5"/>',
support:'<path d="M4 10a6 6 0 0 1 12 0v5M4 11H2.5v4H6v-4H4M16 11h1.5v4H14v-4h2M14 17h-3"/>'
};
const item=(r,label,ico,perm)=>{const active=route()===r;return `<a class="ge-nav-link${active?' active':''}" href="${hrefFor(r)}" data-permission="${perm||''}" title="${esc(label)}"><span class="ni" aria-hidden="true"><svg viewBox="0 0 20 20">${icon[ico]||icon.data}</svg></span><span>${esc(label)}</span></a>`};
const group=(title,html)=>`<div class="ge-nav-section">${esc(title)}</div>${html}`;
function session(){try{return window.gxGetSession?.()||window.GX_CURRENT_USER||{}}catch(e){return{}}}
function initials(s){return String(s?.name||s?.username||s?.email||'SA').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'SA'}
function nav(){return [
 group('MAIN',item('index','Dashboard Manajemen','home','home')),
 group('PENGALAMAN & INSIGHT',item('customer-experience','Journey & Experience','journey','services')+item('cx-import','Import CSI & NPS','import','services')+item('touchpoint','Journey & Touch Point','touch','services')+item('airport-experience','Jaringan Pengalaman Bandara','network','services')+item('station-360','Profil Station / 360','station','services')+item('readiness','Readiness Assessment','network','services')),
 group('PERBAIKAN & IMPLEMENTASI',item('inisiatif','Initiative & Improvement','initiative','initiatives')+item('improvement-intake','Improvement Opportunity','opportunity','initiatives')+item('action-scenario','Planning & Scenario','scenario','planning')+item('calendar','Calendar & Project Tracking','planning','initiatives')),
 group('PERENCANAAN & STRATEGI',item('planning-workspace','Planning Workspace','planning','planning')+item('lounge-list','Lounge / Tenant Planning','lounge','planning')+item('cost-intelligence','Cost Intelligence','cost','initiatives')+item('budget-cost','Budget & Financial','cost','initiatives')),
 group('DATA & ADMINISTRATION',item('data','Data Management','data','data')+item('master-data','Master Data','data','data')+item('admin','User & Access','admin','admin')+item('portal-management','Portal Management','admin','admin')+item('audit-log','Audit Log','data','admin')),
 group('SUPPORT',item('berita','Berita & Informasi','data','news')+item('kontak','Contact Support','support','contact'))
 ].join('')}
function build(){
 document.body.classList.add('final-v257','final-shell-r5');
 const top=document.querySelector('body>.top'),shell=document.querySelector('body>.shell'),side=shell?.querySelector(':scope>.side');
 if(!top||!shell||!side)return;
 const s=session();
 const subtitle=route()==='index'?'Dashboard Manajemen':'Ground Experience • Service Experience Portal';
 top.innerHTML=`<button id="cleanMobileNav" class="mobile-nav-trigger-v233" type="button" aria-label="Menu">☰</button><div class="ge-brand-logos"><img class="garuda" src="assets/garuda-horizontal-white.png" alt="Garuda Indonesia"><img class="danantara" src="assets/danantara-white-user.png" alt="Danantara Indonesia"></div><div class="ge-title"><strong>GROUND EXPERIENCE PORTAL</strong><span>${esc(subtitle)}</span></div><div class="ge-session"><label class="filter"><span>Periode</span><select id="cleanPeriodSelect" aria-label="Period"><option>${new Date().getFullYear()}</option></select></label><button class="ge-top-action" id="cleanNotifyBtn" type="button" aria-label="Notifications" title="Notifications"><span class="bell-shape" aria-hidden="true"></span><b id="cleanNotifyBadge" hidden></b></button><a class="ge-top-action ge-help" href="${hrefFor('kontak')}" aria-label="Help" title="Help">?</a><button class="ge-user-menu" id="cleanUserBtn" type="button" aria-expanded="false" aria-label="User menu"><span class="avatar">${esc(initials(s))}</span><span class="who sr-only">${esc(s.name||s.username||s.email||'Super Administrator')}</span></button><div class="ge-user-pop" id="cleanUserPop"><a href="${hrefFor('profile')}">Profile</a><button type="button" id="cleanLogoutBtn">Sign Out</button></div><div class="ge-notify-pop" id="cleanNotifyPop"><b>Notifications</b><button type="button" id="cleanNotifyClose" aria-label="Close">×</button><div id="cleanNotifyList"></div></div></div>`;
 side.innerHTML=`<div class="r8-nav-scroll">${nav()}</div><button class="ge-sidebar-toggle" id="cleanCollapseBtn" type="button" aria-expanded="true" title="Collapse"><span class="toggle-arrow" aria-hidden="true">«</span><span class="toggle-label">Collapse</span></button>`;
 if(typeof window.gxApplyNavigation==='function')window.gxApplyNavigation();
 side.querySelectorAll('.ge-nav-link').forEach(a=>{const p=a.dataset.permission;if(p&&typeof window.gxHasPermission==='function'&&!window.gxHasPermission(p))a.style.display='none'});
 side.querySelectorAll('.ge-nav-section').forEach(sec=>{let n=sec.nextElementSibling,visible=false;while(n&&!n.classList.contains('ge-nav-section')){if(n.matches?.('.ge-nav-link')&&getComputedStyle(n).display!=='none')visible=true;n=n.nextElementSibling}sec.style.display=visible?'':'none'});
 const saved=localStorage.getItem('GE_CLEAN_SIDEBAR_COLLAPSED')==='1';
 const setCollapsed=(v)=>{document.body.classList.toggle('sidebar-collapsed',v);document.getElementById('cleanCollapseBtn')?.setAttribute('aria-expanded',v?'false':'true');document.getElementById('cleanCollapseBtn')?.setAttribute('title',v?'Expand':'Collapse');const ar=document.querySelector('#cleanCollapseBtn .toggle-arrow');if(ar)ar.textContent=v?'»':'«';localStorage.setItem('GE_CLEAN_SIDEBAR_COLLAPSED',v?'1':'0')};
 setCollapsed(saved);
 document.getElementById('cleanCollapseBtn')?.addEventListener('click',()=>setCollapsed(!document.body.classList.contains('sidebar-collapsed')));
 document.getElementById('cleanMobileNav')?.addEventListener('click',()=>document.body.classList.toggle('nav-open'));
 const userBtn=document.getElementById('cleanUserBtn'),pop=document.getElementById('cleanUserPop');
 userBtn?.addEventListener('click',e=>{e.stopPropagation();pop?.classList.toggle('open');userBtn.setAttribute('aria-expanded',pop?.classList.contains('open')?'true':'false')});
 document.addEventListener('click',e=>{if(!pop?.contains(e.target)&&!userBtn?.contains(e.target)){pop?.classList.remove('open');userBtn?.setAttribute('aria-expanded','false')}},{capture:true});
 document.getElementById('cleanLogoutBtn')?.addEventListener('click',()=>window.gxLogout?.());
 const np=document.getElementById('cleanNotifyPop'),nb=document.getElementById('cleanNotifyBtn');
 nb?.addEventListener('click',e=>{e.stopPropagation();np?.classList.toggle('open');renderNotifications()});
 document.getElementById('cleanNotifyClose')?.addEventListener('click',()=>np?.classList.remove('open'));
 function renderNotifications(){const list=document.getElementById('cleanNotifyList');if(!list)return;try{const rows=(window.GEStore?.get?.().inbox||[]).slice(0,8);list.innerHTML=rows.length?rows.map(x=>`<div><b>${esc(x.subject||x.title||x.type||'Notification')}</b><span>${esc(x.message||x.detail||'')}</span></div>`).join(''):'<span class="clean-empty">No notifications available.</span>';const unread=rows.filter(x=>String(x.status||'').toUpperCase()!=='READ').length;const badge=document.getElementById('cleanNotifyBadge');if(badge){badge.textContent=unread>99?'99+':String(unread);badge.hidden=!unread}}catch(e){list.innerHTML='<span class="clean-empty">Notifications unavailable.</span>'}}
 renderNotifications();
 document.getElementById('cleanPeriodSelect')?.addEventListener('change',e=>document.dispatchEvent(new CustomEvent('ge-dashboard-period-change',{detail:{year:e.target.value}})));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
