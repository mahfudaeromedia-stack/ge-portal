/* Station 360 consumes the requirement/current records without copying their truth. */
(function(){
  'use strict';
  const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sources=['Garuda','SkyTeam','Interline','Airport Class','Agreement / SLA'];
  let data;
  const $=x=>document.getElementById(x);
  function stationCode(){const picker=$('station'),value=picker?.value,record=window.GECore?.list('stations')?.find(x=>x.id===value);return String(record?.code||picker?.selectedOptions?.[0]?.textContent?.split(' — ')[0]||'').trim().toUpperCase()}
  function render(){if(!data)return;const code=stationCode(),target=$('r70StationSources');if(!target)return;
    $('r70StationMessage').textContent=code?`Station ${code} · kondisi aktual memerlukan record dan bukti yang ditautkan. Assessment dan Customer Voice tetap berasal dari engine masing-masing.`:'Pilih station untuk melihat capability.';
    target.innerHTML=code?`<div class="r70-station-grid">${sources.map(source=>{const r=GERequirementEngine.evaluate(data,{source,station:code});return `<article><b>${E(source)}</b><span>${r.rows.length} requirement berlaku · ${r.counts.Available} tersedia · ${r.counts.Partial} parsial · ${r.counts.Unavailable} gap · ${r.counts.Unknown} belum diverifikasi</span><small>${r.percent===null?'Pemenuhan belum dapat dinilai':r.percent+'% Capability Fulfilment'}${['SkyTeam','Interline'].includes(source)?' · pilih partner di detail':''}</small></article>`}).join('')}</div><p><a class="ge-btn" href="capability-classification.html?station=${encodeURIComponent(code)}">Buka Requirement &amp; Current Capability</a></p>`:'';
  }
  async function init(){if(!$('r70StationSummary'))return;try{await GEStore.waitAuth();const state=await GEStore.hydrate(['requirementMatrix','stationCapabilities']);data={requirements:state.requirementMatrix,current:state.stationCapabilities};render();$('station')?.addEventListener('change',render);$('refresh')?.addEventListener('click',()=>setTimeout(render,0));}catch(e){$('r70StationMessage').textContent='Capability belum dapat dimuat: '+e.message}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
