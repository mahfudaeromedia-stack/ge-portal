/* P32 — Access Assistance administrator workflow.
   Reuses the existing notification popover and Admin / Pengelola inbox surface. */
(function(){
  'use strict';
  const API='/api/access-assistance-admin';
  const esc=v=>typeof geEsc==='function'?geEsc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const dateTime=v=>{try{return new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})}catch(_){return v||'-'}};
  const relative=v=>{
    const t=Date.parse(v||''); if(!Number.isFinite(t))return dateTime(v);
    const sec=Math.max(0,Math.floor((Date.now()-t)/1000));
    if(sec<60)return 'baru saja';
    if(sec<3600)return `${Math.floor(sec/60)} menit lalu`;
    if(sec<86400)return `${Math.floor(sec/3600)} jam lalu`;
    if(sec<604800)return `${Math.floor(sec/86400)} hari lalu`;
    return dateTime(v);
  };
  const session=()=>typeof gxGetSession==='function'?gxGetSession():null;
  const canSee=()=>{const s=session();if(!s)return false;if(s.role==='Super Admin')return true;if(s.role!=='Admin')return false;return typeof gxHasUserManagementPermission==='function'&&gxHasUserManagementPermission()};
  const api=async(action,body={})=>{
    if(typeof gxApi!=='function')throw new Error('Layanan bantuan belum tersedia.');
    const result=await gxApi(API.replace('/api/','/'),{method:action?'POST':'GET',body:action?JSON.stringify(body):undefined});
    return result;
  };
  let requests=[];
  let loading=false;

  function statusLabel(status){return ({OPEN:'Permintaan baru',IN_PROGRESS:'Sedang diproses',RESOLVED:'Selesai'})[status]||status||'Permintaan baru'}
  function statusPill(status){return `<span class="p32-status p32-status-${String(status||'OPEN').toLowerCase()}">${esc(statusLabel(status))}</span>`}
  function adminName(x){return x?.name||x?.username||x?.id||'Admin'}
  function findRequest(id){return requests.find(x=>String(x.id)===String(id));}

  async function loadRequests(){
    if(!canSee()||loading)return requests;
    loading=true;
    try{
      const result=await api('');
      requests=Array.isArray(result.requests)?result.requests:[];
      renderAdminPanel();
      renderPopover();
    }catch(e){
      // Do not surface raw API/Firebase errors in operational UI.
      requests=[];
      renderAdminPanel('Permintaan bantuan belum dapat dimuat. Silakan coba kembali.');
    }finally{loading=false}
    return requests;
  }

  function localNotifications(){
    try{
      const d=window.GEStore?.get?.()||{};const s=session();const uid=String(s?.uid||s?.id||'');
      return Array.isArray(d.inbox)?d.inbox.filter(x=>!x.recipientId||String(x.recipientId)===uid).slice(0,8):[];
    }catch(_){return[]}
  }

  function renderPopover(){
    const list=document.getElementById('geNotifyList');
    const badge=document.getElementById('geNotifyBadge');
    if(!list)return;
    const local=localNotifications();
    const localUnread=local.filter(x=>String(x.status||'').toUpperCase()!=='READ').length;
    const assistanceUnread=requests.filter(x=>x.notificationStatus==='UNREAD'&&x.status!=='RESOLVED').length;
    const totalUnread=localUnread+assistanceUnread;
    if(badge){badge.textContent=totalUnread>99?'99+':String(totalUnread);badge.hidden=!totalUnread}
    const remote=requests.slice(0,8).map(x=>`<button type="button" class="ge-notify-item p32-notify-item ${x.notificationStatus==='UNREAD'?'p32-unread':''}" data-p32-request="${esc(x.id)}"><b>Bantuan Akses Akun</b><span>${esc(x.identifier||x.username||x.email||'User')} • ${esc(relative(x.createdAt))}</span><span>Status: ${esc(statusLabel(x.status))}</span></button>`);
    const existing=local.slice(0,Math.max(0,8-remote.length)).map(x=>`<div class="ge-notify-item"><b>${esc(x.subject||x.title||x.type||'Notification')}</b><span>${esc(x.message||x.detail||'')}</span></div>`);
    list.innerHTML=remote.concat(existing).join('')||'<div class="ge-notify-empty">No notifications available.</div>';
    list.querySelectorAll('[data-p32-request]').forEach(el=>el.addEventListener('click',async()=>{
      const id=el.getAttribute('data-p32-request');
      try{await api('read',{action:'read',requestId:id});const r=findRequest(id);if(r)r.notificationStatus='READ';}catch(_){/* detail remains available */}
      openDetail(id);
      renderPopover();
    }));
  }

  function ensureDetailModal(){
    let modal=document.getElementById('p32AccessAssistanceModal');
    if(modal)return modal;
    modal=document.createElement('div');
    modal.id='p32AccessAssistanceModal';modal.className='modal-backdrop';
    modal.innerHTML='<div class="modal-card p32-assistance-modal"><button class="modal-x" type="button" id="p32AssistanceClose" aria-label="Tutup">×</button><div id="p32AssistanceBody"></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('#p32AssistanceClose').addEventListener('click',()=>modal.classList.remove('show'));
    modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('show')});
    return modal;
  }

  function openDetail(id){
    const x=findRequest(id);if(!x)return;
    const modal=ensureDetailModal(),body=modal.querySelector('#p32AssistanceBody');
    const handler=x.handledBy?adminName(x.handledBy):'Belum ditangani';
    const resolved=x.resolvedAt?dateTime(x.resolvedAt):'—';
    body.innerHTML=`<div class="p32-detail-head"><span class="inbox-type">Bantuan Akses Akun</span><h2>Bantuan Akses Akun</h2><p>${esc(x.identifier||x.username||x.email||'User')} • ${esc(dateTime(x.createdAt))}</p></div>
      <div class="p32-detail-grid">
        <div><small>Username / Email</small><b>${esc(x.identifier||x.username||x.email||'—')}</b></div>
        <div><small>Requested At</small><b>${esc(dateTime(x.createdAt))}</b></div>
        <div class="span2"><small>Keterangan</small><div>${esc(x.reason||'—').replace(/\n/g,'<br>')}</div></div>
        <div><small>Current Status</small><b>${statusPill(x.status)}</b></div>
        <div><small>Assigned / Handling Admin</small><b>${esc(handler)}</b></div>
        <div><small>Resolved At</small><b>${esc(resolved)}</b></div>
        ${x.resolutionNote?`<div class="span2"><small>Catatan Penyelesaian</small><div>${esc(x.resolutionNote)}</div></div>`:''}
      </div>
      <div id="p32DetailMessage" class="p32-action-message" aria-live="polite"></div>
      <div class="modal-actions p32-detail-actions">${x.status==='OPEN'?'<button class="btn" type="button" data-p32-action="process">Proses</button><button class="btn secondary" type="button" data-p32-action="resolve">Selesaikan</button>':x.status==='IN_PROGRESS'?'<button class="btn" type="button" data-p32-action="resolve">Selesaikan</button>':''}</div>`;
    modal.classList.add('show');
    modal.querySelectorAll('[data-p32-action]').forEach(btn=>btn.addEventListener('click',()=>performAction(id,btn.dataset.p32Action,modal)));
  }

  async function performAction(id,action,modal){
    const message=modal.querySelector('#p32DetailMessage');
    if(action==='resolve'){
      const note=window.prompt('Catatan penyelesaian (opsional, singkat). Jangan masukkan kredensial.','');
      if(note===null)return;
      if(note.length>300){if(message)message.textContent='Catatan terlalu panjang.';return}
      try{
        const result=await api('POST',{action:'resolve',requestId:id,resolutionNote:note});
        const idx=requests.findIndex(x=>String(x.id)===String(id));if(idx>=0)requests[idx]=result.request;
        renderAdminPanel();renderPopover();openDetail(id);
      }catch(e){if(message)message.textContent='Permintaan belum dapat diperbarui. Silakan coba kembali.'}
      return;
    }
    try{
      const result=await api('POST',{action,requestId:id});
      const idx=requests.findIndex(x=>String(x.id)===String(id));if(idx>=0)requests[idx]=result.request;
      renderAdminPanel();renderPopover();openDetail(id);
    }catch(e){if(message)message.textContent=action==='process'?'Permintaan sedang ditangani admin lain atau belum dapat diproses.':'Permintaan belum dapat diperbarui. Silakan coba kembali.'}
  }

  function renderAdminPanel(error=''){
    const panel=document.getElementById('p32AccessAssistancePanel');if(!panel)return;
    if(error){panel.querySelector('[data-p32-body]').innerHTML=`<div class="p32-empty">${esc(error)}</div>`;return}
    panel.querySelector('[data-p32-body]').innerHTML=requests.length?`<div class="table-scroll"><table class="admin-inbox-table p32-assistance-table"><thead><tr><th>No</th><th>Requested At</th><th>Username / Email</th><th>Keterangan</th><th>Status</th><th>Handling Admin</th><th>Kelola</th></tr></thead><tbody>${requests.map((x,i)=>`<tr class="${x.notificationStatus==='UNREAD'?'p32-unread-row':''}"><td>${i+1}</td><td>${esc(dateTime(x.createdAt))}</td><td><b>${esc(x.identifier||'—')}</b></td><td>${esc(x.reason||'—')}</td><td>${statusPill(x.status)}</td><td>${esc(x.handledBy?adminName(x.handledBy):'—')}</td><td><button class="btn secondary compact-btn" type="button" data-p32-open="${esc(x.id)}">Buka</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="p32-empty">Belum ada permintaan bantuan akses.</div>';
    panel.querySelectorAll('[data-p32-open]').forEach(btn=>btn.addEventListener('click',()=>openDetail(btn.getAttribute('data-p32-open'))));
  }

  async function init(){
    if(!canSee())return;
    const panel=document.getElementById('p32AccessAssistancePanel');
    if(panel)renderAdminPanel();
    if(!window.GXFirebase&&typeof gxLoadFirebaseRuntime==='function'){try{await gxLoadFirebaseRuntime()}catch(_){} }
    const notifyBtn=document.getElementById('geNotifyBtn');
    notifyBtn?.addEventListener('click',()=>setTimeout(()=>loadRequests().then(renderPopover),0));
    document.getElementById('geMenuNotifications')?.addEventListener('click',()=>setTimeout(()=>loadRequests().then(renderPopover),0));
    await loadRequests();
  }

  window.AccessAssistanceP32={load:loadRequests,open:openDetail,render:renderAdminPanel};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,120));else setTimeout(init,120);
})();
