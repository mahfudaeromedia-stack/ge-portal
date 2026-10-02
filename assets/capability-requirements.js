/* Requirement → existing capability → station condition. No inferred class or partner score. */
(function(){
  'use strict';
  const page=new URLSearchParams(location.search).get('page')||location.pathname.split('/').pop()?.replace(/\.html$/,'');
  if(page!=='capability-classification')return;
  const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sources=['Garuda','SkyTeam','Interline','Airport Class','Agreement / SLA'];
  const pillars=['People','Premises','Process'];
  const currentStates=['Available','Partial','Unavailable','Unknown'];
  const id=()=>globalThis.crypto?.randomUUID?.()||'r70-'+Date.now().toString(36)+Math.random().toString(36).slice(2);
  const $=x=>document.getElementById(x);
  const arr=x=>Array.isArray(x)?x:[];
  let state,st='',src='SkyTeam',partner='';
  const canEdit=()=>{const s=window.gxGetSession?.()||{};return s.role==='Super Admin'||(['Head Office','GE Team','Ground Experience Team'].includes(s.role)&&s.accessLevel==='Admin')};
  const caps=()=>arr(state?.referenceCatalog).filter(x=>x.kind==='capability'&&x.status!=='Inactive');
  const airports=()=>arr(state?.airports).filter(x=>x.code).map(x=>({id:String(x.id),code:String(x.code).toUpperCase(),name:x.airportName||x.code}));
  const capName=x=>caps().find(c=>c.id===x)?.name||x||'—';
  const stationOptions=()=>airports().map(x=>`<option value="${E(x.code)}">${E(x.code)} · ${E(x.name)}</option>`).join('');
  function notice(s){$('r70Status').textContent=s}
  function option(value,label,selected){return `<option value="${E(value)}" ${String(value)===String(selected)?'selected':''}>${E(label)}</option>`}
  const selection=(xs,selected)=>xs.map(([v,label])=>option(v,label,selected)).join('');
  function modal(title,body,onSave){const d=$('r70Dialog');d.hidden=false;d.innerHTML=`<div class="r70-backdrop"><div class="r70-modal" role="dialog" aria-modal="true" aria-label="${E(title)}"><h2>${E(title)}</h2>${body}<p id="r70ModalStatus" role="status"></p><div class="r70-modal-actions"><button type="button" data-cancel class="ge-btn">Batal</button><button type="button" data-save class="ge-btn primary">Simpan</button></div></div></div>`;
    d.querySelector('[data-cancel]').onclick=()=>{d.hidden=true;d.replaceChildren()};d.querySelector('[data-save]').onclick=async e=>{e.target.disabled=true;try{await onSave(d);d.hidden=true;d.replaceChildren();render()}catch(err){d.querySelector('#r70ModalStatus').textContent=err.message;e.target.disabled=false}};
  }
  async function save(){GEStore.save(state);await GEStore.flush();notice('Perubahan berhasil disimpan ke Firestore.')}
  function requirementForm(row){if(!caps().length)return notice('Tambahkan Capability ID di Master Data sebelum membuat requirement.');
    modal(row?'Edit Requirement':'Tambah Requirement',`<div class="r70-form">
      <label>Source <select data-f="source">${selection(sources.map(x=>[x,x]),row?.source||src)}</select></label>
      <label>Judul requirement <input data-f="title" value="${E(row?.title||'')}"></label>
      <label>Capability ID <select data-f="capabilityId"><option value="">Pilih…</option>${selection(caps().map(x=>[x.id,x.name+' · '+x.id]),row?.capabilityId)}</select></label>
      <label>Touch Point ID <select data-f="touchpointId"><option value="">Tidak terkait</option>${selection(arr(state.touchpoints).filter(x=>x?.id).map(x=>[x.id,x.name||x.id]),row?.touchpointId)}</select></label>
      <label>3 Pilar <select data-f="pillar"><option value="">Belum dipetakan</option>${selection(pillars.map(x=>[x,x]),row?.pillar)}</select></label>
      <label>Scope station <select data-f="scopeType">${selection([['UNSET','Belum ditentukan'],['ALL','Semua station'],['SPECIFIC','Station terpilih']],row?.scopeType||'UNSET')}</select></label>
      <label>Station terpilih (Ctrl/Command untuk beberapa) <select data-f="stationCodes" multiple size="6">${airports().map(x=>`<option value="${E(x.code)}" ${arr(row?.stationCodes).includes(x.code)?'selected':''}>${E(x.code)} · ${E(x.name)}</option>`).join('')}</select></label>
      <label>Bobot (>0; kosong jika belum disepakati) <input data-f="weight" type="number" min="0" step="0.01" value="${Number(row?.weight)||''}"></label>
      <label>Partner Airline ID (opsional) <select data-f="airlineId"><option value="">Semua / tidak terkait</option>${selection(arr(state.airlines).map(x=>[x.id,(x.iata||'')+' · '+(x.name||'')]),row?.airlineId)}</select></label>
      <label>Reference <input data-f="reference" value="${E(row?.reference||'')}"></label>
      <label>Status <select data-f="status">${selection([['Draft','Draft'],['Active','Active']],row?.status||'Draft')}</select></label>
    </div>`,async d=>{const v=k=>d.querySelector(`[data-f="${k}"]`),title=v('title').value.trim(),capabilityId=v('capabilityId').value,scopeType=v('scopeType').value,stationCodes=[...v('stationCodes').selectedOptions].map(x=>x.value),weight=Number(v('weight').value||0),status=v('status').value;
      if(!title)throw Error('Judul requirement wajib diisi.');if(status==='Active'&&(!capabilityId||scopeType==='UNSET'||(scopeType==='SPECIFIC'&&!stationCodes.length)))throw Error('Requirement Active memerlukan Capability ID dan scope station yang jelas.');
      const next={...row,id:row?.id||id(),source:v('source').value,title,capabilityId,touchpointId:v('touchpointId').value,pillar:v('pillar').value,scopeType,stationCodes:scopeType==='SPECIFIC'?stationCodes:[],weight,airlineId:v('airlineId').value,reference:v('reference').value.trim(),status,updatedAt:new Date().toISOString()};
      if(row)Object.assign(row,next);else state.requirementMatrix.push(next);await save();
    });
  }
  function evidenceOptions(){return [
    ...arr(state.lounges).map(x=>['lounges',x.id,`${x.airport||''} · Lounge/Tenant · ${x.name||x.id}`]),
    ...arr(state.airportSystems).map(x=>['airportSystems',x.id,`${x.airport||''} · Airport System · ${x.provider||x.id}`]),
    ...arr(state.stationMaterials).map(x=>['stationMaterials',x.id,`${x.area||''} · Material · ${x.product||x.code||x.id}`]),
    ...arr(state.personnel).map(x=>['personnel',x.id,`${x.airport||''} · People · ${x.function||x.position||x.id}`]),
    ...arr(state.documents).map(x=>['documents',x.id,`Document · ${x.title||x.fileName||x.id}`])
  ]}
  function currentForm(row){if(!caps().length)return notice('Tambahkan Capability ID di Master Data dahulu.');const evidence=evidenceOptions();
    modal(row?'Edit Current Capability':'Catat Current Capability',`<div class="r70-form">
      <label>Station <select data-f="stationCode"><option value="">Pilih…</option>${selection(airports().map(x=>[x.code,x.code+' · '+x.name]),row?.stationCode||st)}</select></label>
      <label>Capability ID <select data-f="capabilityId"><option value="">Pilih…</option>${selection(caps().map(x=>[x.id,x.name+' · '+x.id]),row?.capabilityId)}</select></label>
      <label>Kondisi saat ini <select data-f="availability">${selection(currentStates.map(x=>[x,x]),row?.availability||'Unknown')}</select></label>
      <label>Record sumber existing <select data-f="sourceRef"><option value="">Belum ditautkan</option>${evidence.map(([collection,rid,label])=>option(collection+':'+rid,label,row?.sourceRef)).join('')}</select></label>
      <label>Referensi bukti lain <input data-f="evidenceReference" value="${E(row?.evidenceReference||'')}" placeholder="Nomor SOP / dokumen / URL"></label>
      <label>Catatan/verifikasi <textarea data-f="note">${E(row?.note||'')}</textarea></label>
    </div>`,async d=>{const v=k=>d.querySelector(`[data-f="${k}"]`).value,stationCode=v('stationCode'),capabilityId=v('capabilityId');if(!stationCode||!capabilityId)throw Error('Station dan Capability ID wajib dipilih.');if(arr(state.stationCapabilities).some(x=>x!==row&&x.stationCode===stationCode&&x.capabilityId===capabilityId))throw Error('Capability ini sudah memiliki record Current pada station tersebut. Edit record yang ada.');
      const sourceRef=v('sourceRef'),evidence=evidenceOptions().find(([collection,rid])=>collection+':'+rid===sourceRef);
      if(sourceRef&&!evidence)throw Error('Record sumber tidak ditemukan.');
      if(evidence&&['lounges','airportSystems','personnel'].includes(evidence[0])){const record=arr(state[evidence[0]]).find(x=>x.id===evidence[1]);const code=String(record?.airport||record?.stationCode||'').toUpperCase();if(code&&code!==stationCode)throw Error('Record sumber berada di station '+code+', bukan '+stationCode+'.')}
      const next={...row,id:row?.id||id(),stationCode,capabilityId,availability:v('availability'),sourceRef,evidenceReference:v('evidenceReference').trim(),note:v('note').trim(),updatedAt:new Date().toISOString()};if(row)Object.assign(row,next);else state.stationCapabilities.push(next);await save();
    });
  }
  function importCapabilityNames(){const existing=new Set(caps().map(x=>String(x.name||'').trim().toLocaleLowerCase()));const names=[...new Set(arr(state.serviceAlignments).map(x=>String(x.capability||'').trim()).filter(Boolean))].filter(x=>!existing.has(x.toLocaleLowerCase())).sort();
    if(!names.length)return notice('Semua nama capability pada alignment sudah ada di ID Catalog.');
    modal('Tinjau Capability ID',`<p>${names.length} nama dari alignment akan ditambahkan sebagai ID mandiri. Record alignment dan ID-nya tidak berubah.</p><ul>${names.map(x=>`<li>${E(x)}</li>`).join('')}</ul>`,async()=>{
      for(const name of names){if(caps().some(x=>String(x.name).toLocaleLowerCase()===name.toLocaleLowerCase()))continue;const base='CAP-'+name.toUpperCase().normalize('NFKD').replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');let code=base,n=2;while(arr(state.referenceCatalog).some(x=>x.kind==='capability'&&x.id===code))code=base+'-'+n++;
        state.referenceCatalog.push({kind:'capability',id:code,name,status:'Active',note:'Dari nama capability di Partner Service Alignment'});
      }await save();
    });
  }
  function render(){const s=$('r70Source'),station=$('r70Station');src=s.value;st=station.value;partner=$('r70Airline').value;
    const summary=GERequirementEngine.alignmentSummary(state.serviceAlignments,src);
    $('r70SourceSummary').innerHTML=`<b>${summary.records}</b> alignment ${E(src)} existing · <b>${summary.combinations}</b> kombinasi airline–capability · <b>${summary.repeated}</b> baris berulang · <b>${summary.explicitStationScope}</b> mempunyai scope station eksplisit. Alignment merupakan referensi, belum otomatis menjadi requirement.`;
    const result=st?GERequirementEngine.evaluate({requirements:state.requirementMatrix,current:state.stationCapabilities},{source:src,station:st,partner}):null;
    $('r70Score').textContent=!st?'Pilih station':!result.rows.length?'Requirement belum dikonfigurasi':result.percent===null?'Belum dapat dinilai':result.percent+'%';
    $('r70ScoreNote').textContent=result?.percent===null&&result?.rows.length?'Persentase menunggu bobot, bukti Current, aturan Partial, dan untuk SkyTeam/Interline pilihan airline yang spesifik.':result?.rows.length?`${result.numerator} / ${result.denominator} bobot terpenuhi penuh; ini Capability Fulfilment, bukan klasifikasi BO atau hasil monitoring.`:'Tidak ada denominator yang berlaku.';
    const c=result?.counts||{Available:0,Partial:0,Unavailable:0,Unknown:0};$('r70Counts').innerHTML=`<span>Berlaku <b>${result?.rows.length||0}</b></span><span>Available <b>${c.Available}</b></span><span>Partial <b>${c.Partial}</b></span><span>Gap <b>${c.Unavailable}</b></span><span>Belum diverifikasi <b>${c.Unknown}</b></span>`;
    const network=airports().map(x=>({station:x,summary:GERequirementEngine.evaluate({requirements:state.requirementMatrix,current:state.stationCapabilities},{source:src,station:x.code,partner})}));
    $('r70NetworkSummary').textContent=`${network.filter(x=>x.summary.percent!==null).length} dari ${network.length} station dapat dinilai untuk source dan partner ini. Persentase jaringan tidak digabung sebelum rumus agregasinya ditetapkan.`;
    $('r70NetworkRows').innerHTML=network.map(({station,summary})=>`<tr><td><button type="button" class="ge-btn compact" data-station="${E(station.code)}">${E(station.code)}</button></td><td>${summary.rows.length}</td><td>${summary.counts.Available}</td><td>${summary.counts.Partial}</td><td>${summary.counts.Unavailable}</td><td>${summary.counts.Unknown}</td><td>${summary.percent===null?'Belum dapat dinilai':summary.percent+'%'}</td></tr>`).join('');
    $('r70ReqRows').innerHTML=arr(state.requirementMatrix).filter(x=>x.source===src).map(x=>`<tr><td>${E(x.title)}</td><td>${E(capName(x.capabilityId))}</td><td>${E(x.scopeType==='ALL'?'Semua station':x.scopeType==='SPECIFIC'?arr(x.stationCodes).join(', '):'Belum ditentukan')}</td><td>${x.weight>0?E(x.weight):'—'}</td><td>${E(x.status)}</td><td>${canEdit()?`<button class="ge-btn compact" data-rid="${E(x.id)}">Edit</button>`:'—'}</td></tr>`).join('')||'<tr><td colspan="6">Belum ada requirement pada source ini.</td></tr>';
    $('r70CurrentRows').innerHTML=arr(state.stationCapabilities).filter(x=>!st||x.stationCode===st).map(x=>`<tr><td>${E(x.stationCode)}</td><td>${E(capName(x.capabilityId))}</td><td>${E(x.availability)}</td><td>${E(x.sourceRef||'Belum ditautkan')}</td><td>${canEdit()?`<button class="ge-btn compact" data-cid="${E(x.id)}">Edit</button>`:'—'}</td></tr>`).join('')||'<tr><td colspan="5">Current Capability belum dicatat untuk station ini.</td></tr>';
    $('r70ResultRows').innerHTML=result?.rows.length?result.rows.map(x=>`<tr><td>${E(x.requirement.title)}</td><td>${E(capName(x.requirement.capabilityId))}</td><td>${E(x.requirement.pillar||'—')}</td><td>${E(x.status)}</td><td>${E(x.capability?.sourceRef||x.capability?.evidenceReference||'Belum ditautkan')}</td></tr>`).join(''):'<tr><td colspan="5">Pilih station dengan requirement Active untuk melihat hasil.</td></tr>';
    document.querySelectorAll('[data-rid]').forEach(b=>b.onclick=()=>requirementForm(state.requirementMatrix.find(x=>x.id===b.dataset.rid)));
    document.querySelectorAll('[data-cid]').forEach(b=>b.onclick=()=>currentForm(state.stationCapabilities.find(x=>x.id===b.dataset.cid)));
    document.querySelectorAll('[data-station]').forEach(b=>b.onclick=()=>{$('r70Station').value=b.dataset.station;render();$('r70Score').scrollIntoView({block:'center',behavior:'smooth'})});
    $('r70AddRequirement').hidden=$('r70AddCurrent').hidden=$('r70ImportCapabilities').hidden=!canEdit();
  }
  async function init(){const host=$('r70RequirementWorkspace');if(!host)return;
    try{await GEStore.waitAuth();state=await GEStore.hydrate(['airports','airlines','touchpoints','referenceCatalog','serviceAlignments','requirementMatrix','stationCapabilities','lounges','airportSystems','stationMaterials','personnel','documents']);
      $('r70Station').innerHTML='<option value="">Pilih station</option>'+stationOptions();$('r70Station').value=new URLSearchParams(location.search).get('station')||'';$('r70Airline').innerHTML='<option value="">Seluruh partner (tanpa skor gabungan)</option>'+arr(state.airlines).map(x=>option(x.id,(x.iata||'')+' · '+(x.name||''))).join('');$('r70Source').value=src;
      $('r70Source').onchange=render;$('r70Station').onchange=render;$('r70Airline').onchange=render;$('r70AddRequirement').onclick=()=>requirementForm();$('r70AddCurrent').onclick=()=>currentForm();$('r70ImportCapabilities').onclick=importCapabilityNames;render();notice('Firestore terhubung. Record existing tidak diubah.');
    }catch(e){notice('Data belum dapat dimuat: '+e.message);host.querySelector('.r70-body').hidden=true}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
