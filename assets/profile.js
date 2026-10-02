/* P27 — Profile & Account Self-Service presentation + safe self-edit.
   Adds self-service on top of the frozen Authentication / Session Profile foundation. */
(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arr=v=>Array.isArray(v)?v.filter(x=>x!==null&&x!==undefined&&String(x).trim()!=='').map(x=>String(x)):[];
  const roleLabel=v=>({
    'Super Admin':'Super Admin','Management':'Management','Head Office':'Head Office','Branch Office':'Branch Office',
    'GE Team':'Ground Experience Team','Lounge Staff':'Lounge Staff','Lounge Luar Biasa':'Lounge Luar Biasa',
    'Admin':'Admin (legacy)','Staff':'Staff','Viewer':'Viewer','External User':'External User','External':'External User','Collaborator':'Collaborator'
  }[String(v||'').trim()]||String(v||'Not configured'));
  const accessLabel=v=>({Viewer:'Viewer',Editor:'Editor',Approver:'Approver',Admin:'Admin'}[String(v||'').trim()]||'Not configured');
  const scopeLabel=(u)=>{
    const s=String(u?.scopeType||'').trim().toUpperCase();
    if(s==='ALL')return 'All Area';
    if(s==='STATION')return 'Station';
    if(s==='MULTI_STATION')return 'Multiple Stations';
    if(s==='LOUNGE')return 'Lounge';
    if(s==='AIRPORT')return 'Airport';
    if(s==='CUSTOM')return 'Custom / Review';
    return 'Not configured';
  };
  const modules=[
    ['home','Dashboard'],['services','Customer Experience'],['network','Airport Experience Network'],['readiness','Readiness & Standards'],
    ['initiatives','Improvement & Planning'],['planning','Improvement & Planning'],['budget','Budget & Cost'],['data','Data Administration'],['support','Support'],
    ['calendar','Calendar'],['project-tracking','Project Tracking'],['inbox','Notifications / Inbox']
  ];
  function permissionKeys(u){
    const p=arr(u?.permissions).map(x=>x.toLowerCase());
    const t=arr(u?.tabs).map(x=>x.toLowerCase());
    if(String(u?.role||'')==='Super Admin')return modules.map(x=>x[0]);
    const raw=p.length?p:t;
    if(raw.includes('all'))return modules.map(x=>x[0]);
    return [...new Set(raw)];
  }
  function permissionLabels(u){
    const keys=new Set(permissionKeys(u));
    return modules.filter(([k])=>keys.has(k)).map(([,label])=>label).filter((v,i,a)=>a.indexOf(v)===i);
  }
  function isLegacyReview(u){
    const role=String(u?.role||'').trim();
    const access=String(u?.accessLevel||'').trim();
    const scope=String(u?.scopeType||'').trim();
    const supported=['Super Admin','Management','Head Office','Branch Office','GE Team','Lounge Staff','Lounge Luar Biasa'];
    const metadataIncomplete=!access||!scope||!String(u?.organizationType||'').trim()||!Array.isArray(u?.permissions);
    const normalizedLegacyGap=Array.isArray(u?.permissions)&&u.permissions.length===0&&Array.isArray(u?.tabs)&&u.tabs.length===0&&access==='Viewer'&&scope==='CUSTOM';
    return role==='Admin'||metadataIncomplete||normalizedLegacyGap||String(u?.authorizationState||'').toUpperCase()==='REVIEW_REQUIRED'||(!supported.includes(role)&&role);
  }
  function airportLabels(u){
    const values=arr(u?.assignedStations?.length?u.assignedStations:u?.airports).map(x=>x.toUpperCase());
    if(!values.length)return [];
    try{
      const d=window.GEStore?.get?.()||{};
      return values.map(code=>{const a=(d.airports||[]).find(x=>String(x.code||x.id).toUpperCase()===code);return a?.code&&a?.city?`${a.code} — ${a.city}`:code});
    }catch(e){return values}
  }
  function loungeLabels(u){
    const ids=arr(u?.assignedLounges?.length?u.assignedLounges:u?.loungeIds);if(!ids.length)return [];
    try{const d=window.GEStore?.get?.()||{};return ids.map(id=>{const l=(d.lounges||[]).find(x=>String(x.id)===String(id));return l?`${l.airport||''} — ${l.name||id}`:id})}catch(e){return ids}
  }
  function valueOr(label,v,review=false){return `<div class="p27-kv"><span>${esc(label)}</span><b>${esc(v||'Not configured')}</b>${review?'<small class="p27-review-note">Requires Review</small>':''}</div>`}
  function listValue(label,values,empty='None configured'){return `<div class="p27-kv"><span>${esc(label)}</span><b>${values.length?values.map(esc).join('<br>'):esc(empty)}</b></div>`}
  function statusBadge(v){
    const raw=String(v||'Active');const lower=raw.toLowerCase();
    let kind='neutral';if(['active','valid','enabled'].includes(lower))kind='positive';else if(['inactive','disabled','expired'].includes(lower))kind='critical';
    return `<span class="gx-status-badge gx-status-${kind}" data-status-semantic="${kind}">${esc(raw)}</span>`;
  }
  function render(u){
    const root=document.getElementById('profileBody');if(!root)return;
    const review=isLegacyReview(u);const stations=airportLabels(u),lounges=loungeLabels(u),perms=permissionLabels(u);
    root.innerHTML=`
      <section class="p27-section p27-personal"><div class="p27-section-head"><div><span class="p27-eyebrow">MY PROFILE</span><h2>Personal Information</h2><p>Informasi identitas akun yang berasal dari profil terautentikasi.</p></div><div>${review?'<span class="p27-review-chip">Legacy Account Configuration</span>':''}</div></div>
        <form id="p27ProfileForm" class="p27-form" novalidate>
          <label><span>Employee Name</span><input id="p27FullName" name="fullName" maxlength="120" value="${esc(u?.name||u?.username||'')}" autocomplete="name" required><small class="p27-help">Field personal yang dapat diperbarui sendiri.</small></label>
          ${valueOr('Employee Number',u?.employeeNo)}
          ${valueOr('Email',u?.email)}
          ${valueOr('Username',u?.username)}
          <div class="p27-form-actions"><button type="submit" class="ge-btn primary" id="p27SaveProfile">Save Changes</button><span id="p27ProfileMessage" class="p27-inline-message" aria-live="polite"></span></div>
        </form>
      </section>
      <section class="p27-section"><div class="p27-section-head"><div><span class="p27-eyebrow">ORGANIZATION</span><h2>Organization</h2></div></div><div class="p27-grid">${valueOr('Unit / Department',u?.unit,review)}${valueOr('Organization Type',u?.organizationType,review)}</div></section>
      <section class="p27-section"><div class="p27-section-head"><div><span class="p27-eyebrow">ACCOUNT ACCESS</span><h2>Access Information</h2><p>Access attributes are administrator-controlled and read-only here.</p></div></div><div class="p27-grid">${valueOr('Role',roleLabel(u?.role),false)}${valueOr('Access Level',accessLabel(u?.accessLevel),review)}${valueOr('Scope Type',scopeLabel(u),review)}<div class="p27-kv"><span>Account Status</span><div>${statusBadge(u?.status||'Active')}</div></div></div></section>
      <section class="p27-section"><div class="p27-section-head"><div><span class="p27-eyebrow">DATA SCOPE</span><h2>Data Scope</h2></div></div><div class="p27-grid p27-grid-wide">${listValue('Assigned Station(s)',stations)}${listValue('Assigned Lounge(s)',lounges)}</div></section>
      <section class="p27-section"><div class="p27-section-head"><div><span class="p27-eyebrow">MODULE ACCESS</span><h2>My Access</h2><p>Informational summary of the effective module context; it does not grant access.</p></div></div><div class="p27-access-list">${perms.length?perms.map(x=>`<span class="p27-access-chip">${esc(x)}</span>`).join(''):'<span class="p27-empty">No module permissions configured — Requires Review</span>'}</div></section>
      <section class="p27-section p27-security"><div class="p27-section-head"><div><span class="p27-eyebrow">SECURITY</span><h2>Password & Account Security</h2><p>Passwords are managed by Firebase Authentication. They are never displayed or stored in the profile.</p></div></div><div class="p27-security-row"><div><b>${u?.mustChangePassword?'Temporary password change required':'Password self-service available'}</b><span>${u?.mustChangePassword?'This account still has a temporary-password lifecycle flag.':'Use Change Password whenever you need to update your password.'}</span></div><a class="ge-btn primary" href="change-password.html">Change Password</a></div></section>`;
    bindForm();
  }
  async function load(){
    const root=document.getElementById('profileBody');if(!root)return;
    root.innerHTML='<div class="p27-loading">Loading your profile…</div>';
    try{
      const u=await window.GXFirebase?.currentProfile?.();
      const s=u||window.gxGetSession?.();
      if(!s||!s.uid){root.innerHTML='<div class="p27-error">Session profile is not available. Please sign in again.</div>';return}
      window.gxSetSession?.({...s,uid:s.uid});
      render(s);
    }catch(e){
      const s=window.gxGetSession?.();
      if(s?.uid){render(s);const m=document.getElementById('p27ProfileMessage');if(m)m.textContent='Profile service unavailable; showing the last authenticated session context.';}
      else root.innerHTML='<div class="p27-error">Profile could not be loaded. Please sign in again.</div>';
    }
  }
  function bindForm(){
    const form=document.getElementById('p27ProfileForm');if(!form||form.dataset.bound)return;form.dataset.bound='1';
    form.addEventListener('submit',async e=>{
      e.preventDefault();const input=document.getElementById('p27FullName'),msg=document.getElementById('p27ProfileMessage'),btn=document.getElementById('p27SaveProfile');
      const name=String(input?.value||'').trim();if(!name){msg.textContent='Employee Name wajib diisi.';msg.className='p27-inline-message error';input?.focus();return}
      if(name.length>120){msg.textContent='Employee Name terlalu panjang.';msg.className='p27-inline-message error';return}
      if(/[\u0000-\u001F\u007F]/.test(name)){msg.textContent='Employee Name mengandung karakter yang tidak valid.';msg.className='p27-inline-message error';return}
      btn.disabled=true;msg.textContent='Saving…';msg.className='p27-inline-message';
      try{
        const r=await window.gxApi('/auth-update-self-profile',{method:'POST',body:JSON.stringify({fullName:name})});
        const fresh=await window.GXFirebase?.currentProfile?.();
        const s=fresh||r.profile||window.gxGetSession?.();if(s?.uid)window.gxSetSession?.({...s,uid:s.uid});
        if(s)render(s);
        const refreshedMsg=document.getElementById('p27ProfileMessage');
        if(refreshedMsg){refreshedMsg.textContent='Profile berhasil diperbarui.';refreshedMsg.className='p27-inline-message success';}
        const headerName=document.querySelector('#geUserMenuBtn .who b');if(headerName)headerName.textContent=s?.name||s?.username||'User';
      }catch(err){msg.textContent=err?.message||'Profile gagal diperbarui.';msg.className='p27-inline-message error'}
      finally{btn.disabled=false}
    });
  }
  window.GXP27={load,render,permissionLabels,scopeLabel,isLegacyReview};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,80));else setTimeout(load,80);
})();
