/* P28 + P35 — stable page identity isolation and route/title consistency.
   P35 extends the registry; it does not alter business/data logic. */
(function(){
  'use strict';
  const REGISTRY={
    'index.html':{pageId:'dashboard',title:'Ground Experience Dashboard',description:'Central workspace untuk memantau service experience, airport, inisiatif, lounge, dokumen, dan informasi Ground Experience.'},
    'network-stations.html':{pageId:'airport-experience-network',title:'Airport Experience Network',description:'Network overview, station profile, responsible organization and operational coverage.'},
    'airport-experience-map.html':{pageId:'airport-experience-map',title:'Airport Experience Map',description:'Peta jaringan airport dan konteks experience per lokasi.'},
    'station-360.html':{pageId:'station-profile-360',title:'Station Profile / 360',description:'One station view: identity, organization, service location, capability, readiness, agreement and CX context.'},
    'customer-experience.html':{pageId:'customer-experience',title:'Customer Experience',description:'Measurement, insight, finding, dan publication untuk customer experience.'},
    'touchpoint.html':{pageId:'journey-touchpoint',title:'Touch Point & Station Condition',description:'Kondisi layanan per station/Branch Office, termasuk foto, status, dan keterangan terbaru.'},
    'standar.html':{pageId:'service-standard',title:'Standar Layanan Garuda Indonesia',description:'Framework People • Process • Premises untuk menjaga konsistensi service delivery.'},
    'readiness.html':{pageId:'readiness-compliance',title:'Readiness & Compliance',description:'Service standard, requirement, assessment, gap, dan evidence per station.'},
    'service-capability.html':{pageId:'service-capability',title:'Service Capability',description:'Touch Point, Service & Capability pada operational chain per station.'},
    'service-locations.html':{pageId:'service-locations',title:'Service Location',description:'Service location dan airport mapping.'},
    'inisiatif.html':{pageId:'initiative-management',title:'Initiative',description:'Management dan pengelolaan initiative Ground Experience.'},
    'improvement-intake.html':{pageId:'improvement-intake',title:'Improvement Intake & Opportunity',description:'Source intake, opportunity review, dan traceability.'},
    'initiative-conversion.html':{pageId:'initiative-conversion',title:'Controlled Initiative Conversion & Traceability',description:'Controlled conversion dari opportunity menjadi initiative.'},
    'initiative-traceability.html':{pageId:'initiative-traceability',title:'Initiative Traceability, Milestone & Activity Integration',description:'Traceability initiative, milestone, dan activity.'},
    'budget-cost.html':{pageId:'budget-cost',title:'Budget & Financial',description:'Budget envelope, cost object, allocation, actual cost, dan initiative financial trace.'},
    'management-outcome.html':{pageId:'management-outcome',title:'Management, Outcome & Transformation',description:'Management outcome dan transformation context.'},
    'service-planning.html':{pageId:'planning-overview',title:'Planning Overview',description:'Planning overview dan ringkasan Service Planning.'},
    'planning-workspace.html':{pageId:'planning-workspace',title:'Planning Workspace',description:'Satu workspace untuk konteks Lounge / Tenant, Branch Office, dan GASO.'},
    'lounge-list.html':{pageId:'lounge-tenant-planning',title:'Lounge/Tenant Planning',description:'Planning reference Lounge/Tenant seluruh Branch Office.'},
    'branch-office-planning.html':{pageId:'branch-office-planning',title:'Branch Office Planning',description:'Planning context untuk Branch Office dan station.'},
    'gaso-planning.html':{pageId:'gaso-planning',title:'GASO Planning',description:'GASO Master, Service Support, dan Planning Service.'},
    'planning-documents.html':{pageId:'planning-documents',title:'Planning Documents',description:'Repository dokumen terkait planning yang terunggah atau terhubung di portal.'},
    'station-material.html':{pageId:'station-material',title:'Station Material',description:'Station material, vendor, contract period, dan supporting document.'},
    'lounge-procurement.html':{pageId:'lounge-service-procurement',title:'Lounge & Service Procurement',description:'Procurement context untuk Lounge dan Service Planning.'},
    'airport-systems.html':{pageId:'airport-systems',title:'Airport Systems',description:'CUTE, CUPPS, terminal equipment, provider, dan availability.'},
    'bo-space.html':{pageId:'branch-office-space',title:'Branch Office Space',description:'Leased area, landlord, function, period, dan annual commitment.'},
    'agreement-service.html':{pageId:'agreement-document',title:'Agreement & Document',description:'Agreement, document, effective period, dan service availability.'},
    'data.html':{pageId:'data-management',title:'Data Management',description:'Master data airport dan personil sebagai referensi layanan dan initiative.'},
    'master-data.html':{pageId:'master-data',title:'Master Data',description:'Core reference untuk Network, Station, Journey, Touch Point, Service, dan Capability.'},
    'admin.html':{pageId:'account-access-management',title:'Account & Access Management',description:'Kelola user account, organizational role, access level, data scope, dan module permissions.'},
    'audit-log.html':{pageId:'audit-log',title:'Audit Log',description:'Jejak aktivitas dan audit trail portal.'},
    'profile.html':{pageId:'profile',title:'Profile',description:'Profile akun dan informasi akses.'},
    'change-password.html':{pageId:'change-password',title:'Ganti Password',description:'Perubahan password akun yang telah terautentikasi.'},
    'calendar.html':{pageId:'calendar-project-tracking',title:'Calendar & Project Tracking',description:'Calendar dan project tracking Ground Experience.'},
    'pre-journey.html':{pageId:'initiative-pre-journey',title:'Pre-Journey',description:'Kegiatan dan initiative pada konteks Pre-Journey.'},
    'pre-flight.html':{pageId:'initiative-pre-flight',title:'Pre-Flight',description:'Kegiatan dan initiative pada konteks Pre-Flight.'},
    'post-flight.html':{pageId:'initiative-post-flight',title:'Post-Flight',description:'Kegiatan dan initiative pada konteks Post-Flight.'},
    'post-journey.html':{pageId:'initiative-post-journey',title:'Post-Journey',description:'Kegiatan dan initiative pada konteks Post-Journey.'},
    'lounge-access.html':{pageId:'lounge-access',title:'Lounge Access',description:'Lounge Access dan eligibility workflow.'},
    'lounge-visitor.html':{pageId:'lounge-visitor',title:'Lounge/Tenant Visitor',description:'Lounge/Tenant visitor dan eligibility reference.'},
    'lounge-flights.html':{pageId:'lounge-flights',title:'Daftar Penerbangan',description:'Flight reference untuk Lounge workflow.'},
    'lounge-purchase.html':{pageId:'lounge-purchase',title:'Pembelian Akses Lounge/Tenant',description:'Pembelian akses Lounge/Tenant.'},
    'program-kerja.html':{pageId:'program-kerja',title:'Program Kerja & Budget',description:'Program kerja dan budget import.'},
    'cost-intelligence.html':{pageId:'cost-intelligence',title:'Cost Intelligence',description:'Cost intelligence dan financial trace.'},
    'map.html':{pageId:'airport-map',title:'Peta Airport',description:'Peta airport penerbangan.'},
    'layanan.html':{pageId:'service-experience',title:'Service Experience',description:'Service Experience portal reference.'},
    'berita.html':{pageId:'news-information',title:'Berita & Informasi',description:'Berita dan informasi Ground Experience.'},
    'kontak.html':{pageId:'contact',title:'Hubungi Kami',description:'Informasi kontak Ground Experience.'}
  };
  const route=()=>((location.pathname.split('/').pop()||'index.html').toLowerCase());
  const identity=()=>REGISTRY[route()]||{pageId:route().replace(/\.html$/,''),title:document.title||route(),description:''};
  const readConfig=(pageId,r)=>{try{const cfg=typeof pmCfgR2==='function'?pmCfgR2():null;return cfg?.pages?.[pageId]||cfg?.pages?.[r]||{}}catch(e){return{}}};
  function ensurePageOption(){
    const sel=document.getElementById('pmPage');if(!sel)return;
    Object.entries(REGISTRY).forEach(([r,v])=>{if(!sel.querySelector(`option[value="${r}"]`)){const o=document.createElement('option');o.value=r;o.textContent=v.title;sel.appendChild(o)}});
  }
  function load(){
    ensurePageOption();
    const r=String(document.getElementById('pmPage')?.value||route()).toLowerCase(),reg=REGISTRY[r]||identity(),cfg=readConfig(reg.pageId,r);
    const title=document.getElementById('pmTitle'),desc=document.getElementById('pmDescription');
    if(title)title.value=cfg.title||reg.title||'';if(desc)desc.value=cfg.description||reg.description||'';
    if(typeof pmRenderSectionsR2==='function')pmRenderSectionsR2();if(typeof pmRenderMenusR2==='function')pmRenderMenusR2();
  }
  function apply(){
    const r=route(),reg=REGISTRY[r]||identity(),cfg=readConfig(reg.pageId,r),title=cfg.title||reg.title,desc=cfg.description||reg.description;
    document.body?.setAttribute('data-page-id',reg.pageId);
    if(title){const hero=document.querySelector('.hero h2');const head=document.querySelector('.ge-page-head h1,.page-header h1,.tp-page-head h1,.head h1');const target=hero||head;if(target)target.textContent=title}
    if(desc){const p=document.querySelector('.hero p');const headP=document.querySelector('.ge-page-head p,.page-header p,.tp-page-head p,.head p');const target=p||headP;if(target)target.textContent=desc}
    document.body?.setAttribute('data-page-title',title||'');
    document.body?.setAttribute('data-page-description',desc||'');
    document.title=(title||document.title||r)+' · Ground Experience Portal';
  }
  function savePage(){
    const r=String(document.getElementById('pmPage')?.value||route()).toLowerCase(),reg=REGISTRY[r]||identity(),cfg=pmCfgR2();cfg.pages[reg.pageId]||={};
    cfg.pages[reg.pageId].title=document.getElementById('pmTitle')?.value.trim()||reg.title;
    cfg.pages[reg.pageId].description=document.getElementById('pmDescription')?.value.trim()||reg.description;
    cfg.pages[reg.pageId].draft=true;save();if(typeof pmActivity==='function')pmActivity('Page content disimpan dengan identity: '+reg.pageId);
  }
  function reset(){
    const r=String(document.getElementById('pmPage')?.value||route()).toLowerCase(),reg=REGISTRY[r]||identity(),cfg=pmCfgR2();
    delete cfg.pages[reg.pageId];delete cfg.pages[r];save();load();apply();
  }
  window.GX_PAGE_IDENTITY_V28=REGISTRY;
  window.GX_PAGE_IDENTITY_V35=REGISTRY;
  window.gxGetPageIdentityV28=identity;
  window.pmPageKeyR2=()=>identity().pageId;
  window.pmLoadPageR2=load;
  window.pmSavePageR2=savePage;
  window.pmResetPageIdentityV28=reset;
  window.pmApplyPageR2=apply;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{ensurePageOption();apply()},20));else setTimeout(()=>{ensurePageOption();apply()},20);
})();
