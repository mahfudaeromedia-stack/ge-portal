/* P26 — Account & Access Management workspace.
   UI-only orchestration over existing Firebase/Firestore account endpoints. */
(function(){
  'use strict';
  const ROLE_VALUES=['Management','Head Office','Branch Office'];
  const ACCESS_VALUES=['Viewer','Editor','Approver','Admin'];
  const SCOPE_VALUES=['ALL','STATION','MULTI_STATION'];
  const MODULES=[
    ['home','Dashboard'],['services','Customer Experience'],['network','Airport Experience Network'],
    ['readiness','Readiness & Standards'],['initiatives','Improvement & Planning'],['budget','Budget & Cost'],
    ['data','Data & Administration'],['support','Support']
  ];
  const LEGACY_ROLES=new Set(['Admin','Staff','Lounge Staff','Lounge Luar Biasa','Viewer']);
  const ROLE_LABEL={
    'Super Admin':'SuperAdmin (Protected)','Admin':'Admin (Legacy — Review)',
    'Management':'Management','Head Office':'HeadOffice / Ground Experience Team','Branch Office':'BranchOffice',
    'Staff':'Staff (Legacy — Review)','Lounge Staff':'Lounge Staff (Legacy — Review)',
    'Lounge Luar Biasa':'Lounge Luar Biasa (Legacy — Review)','Viewer':'Viewer (Legacy — Review)'
  };
  const esc=v=>typeof geEsc==='function'?geEsc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const csvCell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
  const session=()=>typeof gxGetSession==='function'?gxGetSession():null;
  const canManage=()=>typeof gxHasUserManagementPermission==='function'&&gxHasUserManagementPermission();
  const peerAdminProtected=u=>session()?.role!=='Super Admin'&&(u?.role==='Admin'||u?.accessLevel==='Admin');
  const orgType=u=>['External','Partner'].includes(u?.organizationType)?'External':'Internal';
  const accessRank=v=>({Viewer:0,Editor:1,Approver:2,Admin:3})[String(v||'Viewer')]??0;
  const roleDefaultAccess=r=>r==='Management'||r==='Head Office'||r==='Branch Office'?'Viewer':r==='Super Admin'||r==='Admin'?'Admin':'Viewer';
  const roleDefaultModules=r=>{
    if(r==='Management')return ['home','services','network','initiatives','planning','budget','support'];
    if(r==='Head Office')return ['home','services','network','readiness','initiatives','planning','budget','data','support'];
    if(r==='Branch Office')return ['home','services','initiatives','planning','data','support'];
    if(r==='Super Admin'||r==='Admin')return MODULES.map(x=>x[0]);
    return ['home'];
  };
  const effectiveScope=u=>String(u?.scopeType||'').toUpperCase()||((u?.role==='Branch Office')?'STATION':u?.role==='Head Office'?'MULTI_STATION':u?.role==='Management'?'ALL':'CUSTOM');
  const stationValues=()=>[...new Set((window.data?.airports||[]).map(x=>String(x.code||'').trim().toUpperCase()).filter(Boolean))].sort();
  function userFlags(u){
    const legacy=!ROLE_VALUES.includes(u?.role)&&u?.role!=='Super Admin';
    const incomplete=!u?.accessLevel||!u?.organizationType||(!Array.isArray(u?.permissions)&&!Array.isArray(u?.tabs));
    return {legacy,incomplete,review:legacy||incomplete};
  }
  function userScopeLabel(u){
    const scope=effectiveScope(u),stations=Array.isArray(u?.airports)?u.airports.filter(Boolean):[];
    if(scope==='ALL')return 'All data';
    if(scope==='STATION')return stations.length?stations.join(', '):'Station belum ditetapkan';
    if(scope==='MULTI_STATION')return stations.length?`${stations.length} station: ${stations.join(', ')}`:'Multi-station belum ditetapkan';
    if(scope==='LOUNGE')return `${Array.isArray(u?.loungeIds)?u.loungeIds.length:0} lounge (legacy)`;
    return 'Custom / legacy';
  }
  function userPermissions(u){
    if(Array.isArray(u?.permissions)&&u.permissions.length)return u.permissions.map(String);
    const tabs=Array.isArray(u?.tabs)?u.tabs.map(String):[];
    if(tabs.includes('ALL'))return roleDefaultModules(u?.role);
    return tabs;
  }
  function apiReady(){return typeof window.gxApi==='function'}
  function notify(title,message,type='warning'){
    if(typeof geStorageNoticeV223==='function')geStorageNoticeV223(title,message,type);else alert(message);
  }
  function setError(box,msgs){if(!box)return;box.innerHTML=msgs.length?`<div class="p26-form-error"><b>Periksa input</b><ul>${msgs.map(esc).map(x=>`<li>${x}</li>`).join('')}</ul></div>`:''}
  function ensureModal(id,html){let m=document.getElementById(id);if(!m){m=document.createElement('div');m.id=id;m.className='modal-backdrop';m.innerHTML=html;document.body.appendChild(m)}return m}

  function replaceAccountSection(){
    const sec=document.getElementById('adminSectionAccounts');if(!sec)return;
    sec.innerHTML=`
      <div class="p26-page-head">
        <div><span class="p26-eyebrow">ACCOUNT & ACCESS MANAGEMENT</span><h3>Account & Access Management</h3><p>Kelola akun pengguna, organizational role, access level, data scope, dan module permissions. Firebase Authentication tetap menangani kredensial; Firestore menyimpan metadata akses.</p></div>
        <div class="p26-head-actions"><button class="btn" type="button" data-p26-action="add">+ Add User</button><button class="btn secondary" type="button" data-p26-action="import">Import CSV</button><button class="btn secondary" type="button" data-p26-action="template">Download Template</button></div>
      </div>
      <div class="p26-model-help"><div><b>ROLE</b><span>Organizational context, Dashboard POV, dan primary navigation.</span></div><div><b>ACCESS LEVEL</b><span>Action yang dapat dilakukan: View, Edit, Approve, atau Admin.</span></div><div><b>SCOPE</b><span>Data yang dapat diakses berdasarkan station assignment.</span></div><div><b>PERMISSIONS</b><span>Granular capability yang dapat diturunkan atau dioverride secara terotorisasi.</span></div></div>
      <div class="p26-summary-grid"><div class="card"><span>Total Users</span><b id="p26TotalUsers">0</b></div><div class="card"><span>Active</span><b id="p26ActiveUsers">0</b></div><div class="card"><span>Inactive</span><b id="p26InactiveUsers">0</b></div><div class="card"><span>Requires Review</span><b id="p26ReviewUsers">0</b></div></div>
      <div class="card p26-filter-card"><div class="p26-filter-grid"><input id="p26Search" placeholder="Search employee / username / email / employee no"><select id="p26RoleFilter"><option value="">All Roles</option></select><select id="p26AccessFilter"><option value="">All Access Levels</option></select><select id="p26StatusFilter"><option value="">All Status</option><option>Active</option><option>Inactive</option></select><select id="p26ScopeFilter"><option value="">All Scope</option><option>ALL</option><option>STATION</option><option>MULTI_STATION</option><option>CUSTOM / legacy</option></select><input id="p26UnitFilter" placeholder="Unit / Department"></div></div>
      <div class="card table-scroll"><table class="p26-user-table"><thead><tr><th>No</th><th>Employee</th><th>Username / Email</th><th>Role</th><th>Access Level</th><th>Unit / Department</th><th>Scope</th><th>Assigned Station(s)</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead><tbody id="p26UserRows"></tbody></table></div>
      <div class="p26-legacy-note">Legacy fields such as <code>tabs[]</code>, <code>airports[]</code>, and <code>loungeIds[]</code> remain supported for compatibility. They are not the primary business-facing access model for new accounts.</div>`;
    bindFilters();
  }

  function bindFilters(){
    ['p26Search','p26RoleFilter','p26AccessFilter','p26StatusFilter','p26ScopeFilter','p26UnitFilter'].forEach(id=>document.getElementById(id)?.addEventListener('input',renderUsers));
    document.getElementById('p26RoleFilter')?.addEventListener('change',renderUsers);
    document.getElementById('p26AccessFilter')?.addEventListener('change',renderUsers);
    document.getElementById('p26StatusFilter')?.addEventListener('change',renderUsers);
    document.getElementById('p26ScopeFilter')?.addEventListener('change',renderUsers);
    document.getElementById('p26UnitFilter')?.addEventListener('input',renderUsers);
    document.querySelector('[data-p26-action="add"]')?.addEventListener('click',()=>openUserForm());
    document.querySelector('[data-p26-action="import"]')?.addEventListener('click',openImportModal);
    document.querySelector('[data-p26-action="template"]')?.addEventListener('click',downloadUserTemplate);
  }

  function populateFilters(rows){
    const fill=(id,values,label)=>{const e=document.getElementById(id);if(!e)return;const cur=e.value;e.innerHTML=`<option value="">${label}</option>`+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');e.value=cur};
    fill('p26RoleFilter',[...new Set(rows.map(u=>u.role).filter(Boolean))].sort(),'All Roles');
    fill('p26AccessFilter',ACCESS_VALUES,'All Access Levels');
  }

  function renderUsers(){
    const tbody=document.getElementById('p26UserRows');if(!tbody)return;
    const rows=Array.isArray(data?.users)?data.users:[];populateFilters(rows);
    const q=String(document.getElementById('p26Search')?.value||'').toLowerCase(),rf=document.getElementById('p26RoleFilter')?.value||'',af=document.getElementById('p26AccessFilter')?.value||'',sf=document.getElementById('p26StatusFilter')?.value||'',scf=document.getElementById('p26ScopeFilter')?.value||'',uf=String(document.getElementById('p26UnitFilter')?.value||'').toLowerCase();
    const filtered=rows.filter(u=>{const scope=effectiveScope(u),access=String(u.accessLevel||roleDefaultAccess(u.role));return(!q||`${u.name||''} ${u.username||''} ${u.email||''} ${u.employeeNo||''}`.toLowerCase().includes(q))&&(!rf||u.role===rf)&&(!af||access===af)&&(!sf||String(u.status||'Active')===sf)&&(!scf||(scf==='CUSTOM / legacy'?['CUSTOM','LOUNGE','AIRPORT',''].includes(scope):scope===scf))&&(!uf||`${u.unit||''} ${(u.airports||[]).join(' ')}`.toLowerCase().includes(uf))});
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
    set('p26TotalUsers',rows.length);set('p26ActiveUsers',rows.filter(u=>u.status!=='Inactive').length);set('p26InactiveUsers',rows.filter(u=>u.status==='Inactive').length);set('p26ReviewUsers',rows.filter(u=>userFlags(u).review).length);
    tbody.innerHTML=filtered.map((u,i)=>{
      const f=userFlags(u),access=String(u.accessLevel||roleDefaultAccess(u.role)),scope=effectiveScope(u),stations=Array.isArray(u.airports)?u.airports.filter(Boolean):[],status=String(u.status||'Active');
      const protectedRole=u.role==='Super Admin'||peerAdminProtected(u);
      const review=f.review?'<span class="p26-review-badge">Requires Review</span>':'';
      return `<tr><td>${i+1}</td><td><b>${esc(u.name||u.username||'Unnamed')}</b><small>${esc(u.employeeNo||'Employee no. not configured')}</small></td><td><b>${esc(u.username||'—')}</b><small>${esc(u.email||'—')}</small></td><td><span class="p26-role-badge ${f.legacy?'legacy':''}">${esc(ROLE_LABEL[u.role]||u.role||'Role not configured')}</span>${review}</td><td><span class="p26-access-badge">${esc(access)}</span></td><td>${esc(u.unit||'Not configured')}</td><td><b>${esc(scope)}</b><small>${esc(userScopeLabel(u))}</small></td><td>${esc(stations.join(', ')||'—')}</td><td><span class="pill">${esc(status)}</span>${u.mustChangePassword?'<small class="p26-password-note">Temporary credential active</small>':''}</td><td>${esc(u.lastLogin||u.lastLoginAt||'Not available')}</td><td class="p26-actions">${protectedRole?'<span class="p26-protected">Protected</span>':canManage()?`<button class="btn secondary compact-btn" data-edit-user="${esc(u.id)}">Edit</button><button class="btn secondary compact-btn" data-reset-user="${esc(u.id)}">Reset Password</button>`:'<span class="p26-view-only">View only</span>'}</td></tr>`;
    }).join('')||'<tr><td colspan="11" class="p26-empty">No users match the current filters.</td></tr>';
    tbody.querySelectorAll('[data-edit-user]').forEach(b=>b.addEventListener('click',()=>openUserForm(b.dataset.editUser)));
    tbody.querySelectorAll('[data-reset-user]').forEach(b=>b.addEventListener('click',()=>openResetModal(b.dataset.resetUser)));
    if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
  }

  function formMarkup(u){
    const isEdit=!!u,id=isEdit?String(u.id):'';
    const role=ROLE_VALUES.includes(u?.role)?u.role:(u?'':'Management'),access=ACCESS_VALUES.includes(u?.accessLevel)?u.accessLevel:roleDefaultAccess(u?.role),scope=SCOPE_VALUES.includes(effectiveScope(u))?effectiveScope(u):role==='Branch Office'?'STATION':role==='Head Office'?'MULTI_STATION':'ALL';
    const perms=new Set(userPermissions(u||{role}));
    const stations=Array.isArray(u?.airports)?u.airports:[];
    const stationOpts=stationValues().map(s=>`<option value="${esc(s)}" ${stations.includes(s)?'selected':''}>${esc(s)}</option>`).join('');
    return `<form id="p26UserForm" novalidate><input type="hidden" id="p26UserId" value="${esc(id)}"><div id="p26UserErrors"></div>
      <div class="p26-form-section"><div><span class="p26-section-kicker">PERSONAL INFORMATION</span><p>Identity dan account identifier. Temporary Password hanya digunakan untuk Firebase Authentication.</p></div><div class="p26-form-grid"><label>Employee Name *<input id="p26Name" required value="${esc(u?.name||'')}"></label><label>Employee Number *<input id="p26EmployeeNo" required value="${esc(u?.employeeNo||'')}"></label><label>Email *<input id="p26Email" type="email" required ${isEdit?'readonly':''} value="${esc(u?.email||'')}"></label><label>Username *<input id="p26Username" required value="${esc(u?.username||'')}"></label>${isEdit?'':'<label>Temporary Password *<input id="p26Password" type="password" minlength="10" autocomplete="new-password" required></label><label>Confirm Temporary Password *<input id="p26PasswordConfirm" type="password" minlength="10" autocomplete="new-password" required></label>'}</div></div>
      <div class="p26-form-section"><div><span class="p26-section-kicker">ORGANIZATION</span><p>Role defines organizational context; it does not by itself grant every action.</p></div><div class="p26-form-grid"><label>Unit / Department *<input id="p26Unit" required value="${esc(u?.unit||'')}"></label><label>Organization Type *<select id="p26OrgType"><option value="Internal">Internal</option><option value="External">External</option></select></label><label>Role *<select id="p26Role" required>${u&&!ROLE_VALUES.includes(u?.role)?'<option value="" selected>Select organizational role — current legacy role requires review</option>':''}${ROLE_VALUES.map(r=>`<option value="${r}" ${role===r?'selected':''}>${esc(r==='Head Office'?'HeadOffice / Ground Experience Team':r)}</option>`).join('')}</select></label><label>Access Level *<select id="p26Access" required>${ACCESS_VALUES.map(a=>`<option ${access===a?'selected':''}>${a}</option>`).join('')}</select></label><label>Status *<select id="p26Status"><option ${String(u?.status||'Active')==='Active'?'selected':''}>Active</option><option ${u?.status==='Inactive'?'selected':''}>Inactive</option></select></label></div></div>
      <div class="p26-form-section"><div><span class="p26-section-kicker">DATA SCOPE</span><p>Determines which station data is accessible. Assigned stations are stored using the existing compatible <code>airports[]</code> field.</p></div><div class="p26-form-grid"><label>Scope Type *<select id="p26Scope"><option>ALL</option><option>STATION</option><option>MULTI_STATION</option></select><small>ALL = network-wide. STATION = one operational station. MULTI_STATION = selected stations.</small></label><label class="p26-station-field" id="p26StationWrap">Assigned Station(s) *<select id="p26Stations" multiple size="6">${stationOpts}</select><small>Required for STATION or MULTI_STATION. Hold Ctrl/Cmd to select multiple.</small></label></div></div>
      <div class="p26-form-section"><div><span class="p26-section-kicker">MODULE PERMISSIONS</span><p>Defaults are derived from Role + Access Level. Existing <code>tabs[]</code> remains compatible.</p></div><div class="p26-module-grid">${MODULES.map(([v,l])=>`<label><input type="checkbox" data-p26-module value="${v}" ${perms.has(v)?'checked':''}> <span>${esc(l)}</span></label>`).join('')}</div><details class="p26-advanced"><summary>Advanced Permission Override</summary><p>Use only when the administrator is authorized to provide a non-default module capability.</p><div class="p26-module-grid">${MODULES.map(([v,l])=>`<label><input type="checkbox" data-p26-override value="${v}" ${perms.has(v)?'checked':''}> <span>${esc(l)}</span></label>`).join('')}</div></details></div>
            <div class="p26-form-section"><div><span class="p26-section-kicker">LOUNGE ASSIGNMENT</span><p>Optional operational context. Existing <code>loungeIds[]</code> is preserved.</p></div><select id="p26Lounges" multiple size="5">${(data.lounges||[]).map(x=>`<option value="${esc(x.id)}" ${(u?.loungeIds||[]).map(String).includes(String(x.id))?'selected':''}>${esc(x.airport||'')} — ${esc(x.name||x.id)}</option>`).join('')}</select></div>
      </form><div class="p26-modal-actions"><button class="btn" type="submit" form="p26UserForm">${isEdit?'Save Changes':'Create User'}</button><button class="btn secondary" type="button" id="p26Cancel">Cancel</button></div>`;
  }

  function openUserForm(id=null){
    if(!canManage()){notify('Access denied','User Management permission is required.');return}
    const u=id?(data.users||[]).find(x=>String(x.id)===String(id)):null;
    if(u?.role==='Super Admin'||peerAdminProtected(u)){notify('Protected account','Akun admin lain tidak dapat diedit oleh Admin HO.');return}
    const modal=ensureModal('p26UserModal',`<div class="modal-card p26-account-modal"><button class="modal-x" type="button" id="p26Close">×</button><span class="p26-eyebrow">ACCOUNT & ACCESS</span><h2>${u?'Edit User':'Add User'}</h2><p class="section-subtitle">Role, Access Level, Scope, and Permissions are maintained separately from Firebase Authentication credentials.</p><div id="p26FormHost"></div></div>`);
    modal.querySelector('#p26FormHost').innerHTML=formMarkup(u);modal.classList.add('show');
    const roleEl=modal.querySelector('#p26Role'),scopeEl=modal.querySelector('#p26Scope');
    if(u&&u.role&&!ROLE_VALUES.includes(u.role)){const opt=document.createElement('option');opt.value=u.role;opt.textContent=`${u.role} (Legacy)`;roleEl.prepend(opt)} if(u?.role)roleEl.value=u.role; if(u&&SCOPE_VALUES.includes(effectiveScope(u)))scopeEl.value=effectiveScope(u); else scopeEl.value=u?effectiveScope(u):'ALL';
    const org=modal.querySelector('#p26OrgType');org.value=orgType(u);
    org.addEventListener('change',()=>{const access=modal.querySelector('#p26Access');if(org.value==='External'){if(!['Viewer','Editor'].includes(access.value))access.value='Viewer';modal.querySelectorAll('[data-p26-module],[data-p26-override]').forEach(x=>x.checked=['initiatives','support'].includes(x.value))}});
    syncScopeFields(); roleEl.addEventListener('change',()=>{if(!u){const r=roleEl.value;scopeEl.value=r==='Branch Office'?'STATION':r==='Head Office'?'MULTI_STATION':'ALL';const defaults=new Set(roleDefaultModules(r));modal.querySelectorAll('[data-p26-module]').forEach(x=>x.checked=defaults.has(x.value));modal.querySelectorAll('[data-p26-override]').forEach(x=>x.checked=defaults.has(x.value));}syncScopeFields()});scopeEl.addEventListener('change',syncScopeFields);
    modal.querySelectorAll('[data-p26-module]').forEach(x=>x.addEventListener('change',()=>syncOverride(x)));
    modal.querySelector('#p26Close').onclick=closeUserForm;modal.querySelector('#p26Cancel').onclick=closeUserForm;modal.querySelector('#p26UserForm').addEventListener('submit',e=>{e.preventDefault();submitUserForm(u)});
    function syncScopeFields(){const scope=scopeEl.value,wrap=modal.querySelector('#p26StationWrap');wrap.style.display=scope==='ALL'?'none':'';}
    function syncOverride(changed){const ov=[...modal.querySelectorAll('[data-p26-override]')].find(x=>x.value===changed.value);if(ov)ov.checked=changed.checked}
  }
  function closeUserForm(){document.getElementById('p26UserModal')?.classList.remove('show')}

  function collectUserForm(){
    const m=document.getElementById('p26UserModal');
    const stations=[...m.querySelector('#p26Stations').selectedOptions].map(x=>x.value.toUpperCase());
    const lounges=[...m.querySelector('#p26Lounges').selectedOptions].map(x=>String(x.value));
    const permissions=[...m.querySelectorAll('[data-p26-override]:checked')].map(x=>x.value);
    return {fullName:m.querySelector('#p26Name').value.trim(),employeeNo:m.querySelector('#p26EmployeeNo').value.trim(),email:m.querySelector('#p26Email').value.trim().toLowerCase(),username:m.querySelector('#p26Username').value.trim().toLowerCase(),temporaryPassword:m.querySelector('#p26Password')?.value||'',confirmTemporaryPassword:m.querySelector('#p26PasswordConfirm')?.value||'',unit:m.querySelector('#p26Unit').value.trim(),organizationType:m.querySelector('#p26OrgType').value,role:m.querySelector('#p26Role').value,accessLevel:m.querySelector('#p26Access').value,status:m.querySelector('#p26Status').value,scopeType:m.querySelector('#p26Scope').value,airports:stations,loungeIds:lounges,permissions,tabs:permissions};
  }
  function validateUserInput(v,isEdit,existing=null){
    const e=[];if(!v.fullName)e.push('Employee Name wajib diisi.');if(!v.employeeNo)e.push('Employee Number wajib diisi.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))e.push('Email tidak valid.');if(!isEdit&&(!v.username||!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(v.username)))e.push('Username harus 3–64 karakter dan hanya a-z, 0-9, titik, underscore, atau minus.');if(isEdit&&v.username!==String(existing?.username||'').trim().toLowerCase()&&!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(v.username))e.push('Username baru harus 3–64 karakter dan hanya a-z, 0-9, titik, underscore, atau minus.');if(!ROLE_VALUES.includes(v.role)&&!(isEdit&&existing&&String(v.role)===String(existing.role)))e.push('Role tidak didukung untuk akun baru.');if(!ACCESS_VALUES.includes(v.accessLevel))e.push('Access Level tidak valid.');if(!SCOPE_VALUES.includes(v.scopeType))e.push('Scope Type tidak valid.');if(!v.unit)e.push('Unit / Department wajib diisi.');if(!['Internal','External'].includes(v.organizationType))e.push('Organization Type harus Internal atau External.');if(v.organizationType==='External'&&!['Viewer','Editor'].includes(v.accessLevel))e.push('External hanya dapat Viewer atau Editor.');if(v.scopeType!=='ALL'&&!v.airports.length)e.push('Assigned Station(s) wajib diisi untuk scope ini.');if(!isEdit){if(v.temporaryPassword.length<10)e.push('Temporary Password minimal 10 karakter.');if(v.temporaryPassword!==v.confirmTemporaryPassword)e.push('Temporary Password dan konfirmasi harus sama.');}if(!v.permissions.length)e.push('Pilih minimal satu Module Permission.');return e;
  }
  async function submitUserForm(existing){
    const m=document.getElementById('p26UserModal'),v=collectUserForm(),errors=validateUserInput(v,!!existing,existing);setError(m.querySelector('#p26UserErrors'),errors);if(errors.length)return;
    try{
      if(!apiReady())throw new Error('Secure account-management API belum tersedia.');
      const payload={...v};delete payload.confirmTemporaryPassword;if(existing){payload.userId=String(existing.id);delete payload.temporaryPassword;if(!ROLE_VALUES.includes(existing.role)&&String(payload.role)===String(existing.role))delete payload.role;if(!payload.username)delete payload.username;await gxApi('/auth-update-user',{method:'POST',body:JSON.stringify(payload)})}else await gxApi('/auth-create-user',{method:'POST',body:JSON.stringify(v)});
      await syncUsers();closeUserForm();notify(existing?'User updated':'User created',existing?'Account changes saved successfully.':'Account created. Temporary password must be changed by the user at first login.','success');
    }catch(e){setError(m.querySelector('#p26UserErrors'),[e.message||'Account operation failed.']);}
  }

  function openResetModal(id){
    if(!canManage())return;const u=(data.users||[]).find(x=>String(x.id)===String(id));if(!u||u.role==='Super Admin'||peerAdminProtected(u))return notify('Protected account','Akun admin lain tidak dapat direset oleh Admin HO.');
    const modal=ensureModal('p26ResetModal',`<div class="modal-card p26-reset-modal"><button class="modal-x" type="button" id="p26ResetClose">×</button><span class="p26-eyebrow">ACCOUNT SECURITY</span><h2>Reset Password</h2><p class="section-subtitle">A new temporary credential will be sent only to Firebase Authentication. It is never stored in the Firestore profile.</p><div id="p26ResetErrors"></div><div class="p26-form-grid"><label>New Temporary Password *<input id="p26ResetPassword" type="password" minlength="10" autocomplete="new-password"></label><label>Confirm Temporary Password *<input id="p26ResetConfirm" type="password" minlength="10" autocomplete="new-password"></label></div><div class="p26-modal-actions"><button class="btn" id="p26ResetSave">Reset Password</button><button class="btn secondary" id="p26ResetCancel">Cancel</button></div></div>`);
    modal.classList.add('show');const close=()=>modal.classList.remove('show');modal.querySelector('#p26ResetClose').onclick=close;modal.querySelector('#p26ResetCancel').onclick=close;modal.querySelector('#p26ResetSave').onclick=async()=>{const p=modal.querySelector('#p26ResetPassword').value,c=modal.querySelector('#p26ResetConfirm').value,errs=[];if(p.length<10)errs.push('Temporary Password minimal 10 karakter.');if(p!==c)errs.push('Password dan konfirmasi harus sama.');setError(modal.querySelector('#p26ResetErrors'),errs);if(errs.length)return;try{if(!apiReady())throw new Error('Secure account-management API belum tersedia.');await gxApi('/auth-reset-password',{method:'POST',body:JSON.stringify({userId:String(id),temporaryPassword:p,confirmTemporaryPassword:c})});close();await syncUsers();notify('Password reset','Temporary password reset berhasil. User wajib menggantinya saat login.','success')}catch(e){setError(modal.querySelector('#p26ResetErrors'),[e.message||'Reset password gagal.'])}};
  }

  function parseCSVText(text){return typeof geParseCSVV223==='function'?geParseCSVV223(text):[]}
  async function readCSVFile(file){
    if(typeof geReadTabularFileV223==='function')return geReadTabularFileV223(file);
    return parseCSVText(await file.text());
  }
  const CSV_FIELDS=['employeeName','employeeNo','email','username','temporaryPassword','role','accessLevel','unit','organizationType','scopeType','assignedStations','assignedLounges','status'];
  const CSV_LABELS=['Employee Name','Employee Number','Email','Username','Temporary Password','Role','Access Level','Unit / Department','Organization Type','Scope Type','Assigned Stations','Assigned Lounges','Status'];
  const csvAliases={};CSV_FIELDS.forEach((f,i)=>csvAliases[f]=[CSV_LABELS[i],f]);
  function rowsToObjects(rows){if(!rows.length)return[];const headers=rows[0].map(x=>String(x||'').trim());return rows.slice(1).filter(r=>r.some(x=>String(x||'').trim()!=='')).filter(r=>!String(r[0]||'').trim().startsWith('#')).map((r,i)=>Object.fromEntries(headers.map((h,j)=>[h,String(r[j]??'').trim()])))}
  function mapCsvRow(r){const get=(field)=>{const aliases=csvAliases[field]||[field];const key=Object.keys(r).find(k=>aliases.some(a=>k.trim().toLowerCase()===String(a).toLowerCase()));return key?r[key]:''};return {employeeName:get('employeeName'),employeeNo:get('employeeNo'),email:get('email').toLowerCase(),username:get('username').toLowerCase(),temporaryPassword:get('temporaryPassword'),role:get('role'),accessLevel:get('accessLevel')||'Viewer',unit:get('unit'),organizationType:get('organizationType')||'Internal',scopeType:get('scopeType'),assignedStations:get('assignedStations').split(';').map(x=>x.trim().toUpperCase()).filter(Boolean),assignedLounges:get('assignedLounges').split(';').map(x=>x.trim()).filter(Boolean),status:get('status')||'Active'};}
  function validateCsvRows(rows){const known=new Set(stationValues()),seenE=new Set(),seenU=new Set(),existingE=new Set((data.users||[]).map(u=>String(u.email||'').trim().toLowerCase()).filter(Boolean)),existingU=new Set((data.users||[]).map(u=>String(u.username||'').trim().toLowerCase()).filter(Boolean));return rows.map((r,i)=>{const v=mapCsvRow(r),e=[];if(!v.employeeName)e.push('Employee Name kosong');if(!v.employeeNo)e.push('Employee Number kosong');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))e.push('Email tidak valid');if(!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(v.username))e.push('Username tidak valid');if(!v.temporaryPassword||v.temporaryPassword.length<10)e.push('Temporary Password minimal 10 karakter');if(/\s/.test(v.temporaryPassword))e.push('Temporary Password tidak boleh mengandung spasi');if(v.temporaryPassword!==String(v.temporaryPassword))e.push('Temporary Password invalid');if(!ROLE_VALUES.includes(v.role))e.push(v.role==='SuperAdmin'||v.role==='Super Admin'?'SuperAdmin adalah protected role dan tidak dapat diimport.':'Role tidak didukung');if(!ACCESS_VALUES.includes(v.accessLevel))e.push('Access Level tidak valid');if(!['Internal','External'].includes(v.organizationType))e.push('Organization Type harus Internal atau External');if(v.organizationType==='External'&&!['Viewer','Editor'].includes(v.accessLevel))e.push('External hanya dapat Viewer atau Editor');if(!v.unit)e.push('Unit / Department kosong');if(!SCOPE_VALUES.includes(v.scopeType))e.push('Scope Type tidak valid');if(v.scopeType!=='ALL'&&!v.assignedStations.length)e.push('Assigned Station(s) wajib diisi');v.assignedStations.forEach(s=>{if(!known.has(s))e.push(`Station tidak ditemukan: ${s}`)});if(existingE.has(v.email))e.push('Email sudah ada pada account list');if(existingU.has(v.username))e.push('Username sudah ada pada account list');if(seenE.has(v.email))e.push('Duplicate email di file');if(seenU.has(v.username))e.push('Duplicate username di file');seenE.add(v.email);seenU.add(v.username);return {row:i+2,v,e}});}
  function downloadUserTemplate(){
    const header=CSV_LABELS.map(csvCell).join(','),notes=[
      '# P26 User Account Import — required: Employee Name, Employee Number, Email, Username, Temporary Password, Role, Access Level, Unit / Department, Scope Type.',
      '# Role: Management | Head Office | Branch Office. Access Level: Viewer | Editor | Approver | Admin. Scope: ALL | STATION | MULTI_STATION.',
      '# Assigned Stations / Assigned Lounges: multiple values separated by semicolon (;). Status: Active | Inactive.',
      '# Temporary Password is sent only to Firebase Authentication and is never stored in Firestore profile or audit log.'
    ];
    downloadBlob('\ufeff'+header+'\r\n'+notes.map(csvCell).join('\r\n')+'\r\n','User_Account_Access_Template_P26.csv','text/csv;charset=utf-8');
  }

  function openImportModal(){
    if(!canManage())return notify('Access denied','User Management permission is required.');
    const modal=ensureModal('p26ImportModal',`<div class="modal-card p26-import-modal"><button class="modal-x" type="button" id="p26ImportClose">×</button><span class="p26-eyebrow">BULK ACCOUNT CREATION</span><h2>Import Users</h2><p class="section-subtitle">Upload → Parse → Normalize → Validate → Preview → Confirm → Create. CREATE-only; no existing user is overwritten.</p><input id="p26ImportFile" type="file" accept=".csv,text/csv"><div id="p26ImportSummary"></div><div id="p26ImportPreview" class="p26-import-preview"><div class="p26-import-empty">Choose a CSV file to begin.</div></div><div class="p26-modal-actions"><button class="btn" id="p26ImportConfirm" disabled>Confirm Create</button><button class="btn secondary" id="p26ImportCancel">Cancel</button></div></div>`);
    modal.classList.add('show');const close=()=>modal.classList.remove('show');modal.querySelector('#p26ImportClose').onclick=close;modal.querySelector('#p26ImportCancel').onclick=close;modal.querySelector('#p26ImportFile').onchange=()=>previewImport(modal,modal.querySelector('#p26ImportFile').files[0]);modal.querySelector('#p26ImportConfirm').onclick=()=>confirmImport(modal);
  }
  async function previewImport(modal,file){const box=modal.querySelector('#p26ImportPreview'),sum=modal.querySelector('#p26ImportSummary'),confirm=modal.querySelector('#p26ImportConfirm');if(!file)return;confirm.disabled=true;box.innerHTML='<div class="p26-import-loading">Parsing and validating…</div>';try{const raw=await readCSVFile(file),rows=Array.isArray(raw)&&Array.isArray(raw[0])?rowsToObjects(raw):raw,result=validateCsvRows(rows);modal._p26Rows=result;const invalid=result.filter(x=>x.e.length),valid=result.length-invalid.length;sum.innerHTML=`<div class="p26-import-summary"><span>Total <b>${result.length}</b></span><span>Valid <b>${valid}</b></span><span>Invalid <b>${invalid.length}</b></span><span>Warnings <b>0</b></span></div>`;box.innerHTML=`<div class="p26-import-table"><table><thead><tr><th>Row</th><th>Employee</th><th>Email</th><th>Role</th><th>Access</th><th>Scope</th><th>Station(s)</th><th>Status</th><th>Validation</th></tr></thead><tbody>${result.map(x=>`<tr><td>${x.row}</td><td>${esc(x.v.employeeName)}</td><td>${esc(x.v.email)}</td><td>${esc(x.v.role)}</td><td>${esc(x.v.accessLevel)}</td><td>${esc(x.v.scopeType)}</td><td>${esc(x.v.assignedStations.join(', ')||'—')}</td><td><span class="${x.e.length?'p26-invalid':'p26-valid'}">${x.e.length?'INVALID':'CREATE'}</span></td><td>${esc(x.e.join('; ')||'Ready')}</td></tr>`).join('')}</tbody></table></div><p class="p26-import-note">Invalid rows are never sent to the server. Duplicate detection against existing Firebase/Firestore users is performed again by the secure create endpoint.</p>`;confirm.disabled=!valid}catch(e){box.innerHTML=`<div class="p26-form-error">CSV tidak dapat diproses: ${esc(e.message||e)}</div>`}}
  async function confirmImport(modal){const valid=(modal._p26Rows||[]).filter(x=>!x.e.length);if(!valid.length)return;const confirm=modal.querySelector('#p26ImportConfirm');confirm.disabled=true;let ok=0,failed=0;const failures=[];for(const item of valid){try{if(!apiReady())throw new Error('Secure account-management API belum tersedia.');const v=item.v;await gxApi('/auth-create-user',{method:'POST',body:JSON.stringify({username:v.username,email:v.email,fullName:v.employeeName,employeeNo:v.employeeNo,temporaryPassword:v.temporaryPassword,confirmTemporaryPassword:v.temporaryPassword,role:v.role,accessLevel:v.accessLevel,unit:v.unit,organizationType:v.organizationType,status:v.status,scopeType:v.scopeType,airports:v.assignedStations,loungeIds:v.assignedLounges,permissions:roleDefaultModules(v.role),tabs:roleDefaultModules(v.role)})});ok++}catch(e){failed++;failures.push(`Row ${item.row}: ${e.message||'Create failed'}`)}}await syncUsers();modal.querySelector('#p26ImportPreview').insertAdjacentHTML('afterbegin',`<div class="p26-import-result"><b>Import complete</b><span>Created: ${ok}</span><span>Failed: ${failed}</span>${failures.length?`<ul>${failures.map(esc).map(x=>`<li>${x}</li>`).join('')}</ul>`:''}</div>`);if(ok)notify('Import complete',`${ok} user account(s) created. ${failed} failed.` ,failed?'warning':'success');confirm.disabled=false;}

  async function syncUsers(){
    if(!canManage()||!apiReady())return;try{const r=await gxApi('/auth-list-users',{method:'GET'});if(Array.isArray(r.users)){data.users=r.users.map(u=>({...u,id:String(u.id),airports:Array.isArray(u.airports)?u.airports:[],loungeIds:Array.isArray(u.loungeIds)?u.loungeIds:[],tabs:Array.isArray(u.tabs)?u.tabs:[],permissions:Array.isArray(u.permissions)?u.permissions:[]}));}}catch(e){console.warn('P26 user sync failed:',e.message)}renderUsers();}

  function init(){if(!document.getElementById('adminSectionAccounts'))return;replaceAccountSection();renderUsers();setTimeout(syncUsers,80)}
  window.p26OpenUserForm=openUserForm;window.p26OpenUserImport=openImportModal;window.p26RenderUsers=renderUsers;window.p26SyncUsers=syncUsers;
  window.openUserModal=id=>openUserForm(id);window.closeUserModal=closeUserForm;window.renderUserAccounts=renderUsers;window.syncFirebaseUsers=syncUsers;window.resetUserPassword=openResetModal;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();
