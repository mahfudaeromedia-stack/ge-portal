(function(){
'use strict';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function finalJourney(){try{return (typeof activeJourney!=='undefined'?activeJourney:'')||''}catch(e){return ''}}
function filteredRows(){
 let rows=(data.initiatives||[]).slice(); const j=finalJourney();
 if(j) rows=rows.filter(x=>{try{return typeof geMatchesJourneyV252==='function'?geMatchesJourneyV252(x,j):((x.journey||getJourney(x.tp))===j)}catch(e){return (x.journey||'')===j}});
 const q=(document.getElementById('q')?.value||'').toLowerCase(),ft=document.getElementById('ft')?.value||'',fs=document.getElementById('fs')?.value||'';
 return rows.filter(x=>{const status=typeof geInitiativeStatusV246==='function'?geInitiativeStatusV246(x):achievement(x.plan,x.real);const tps=typeof geTPsV252==='function'?geTPsV252(x):[x.tp].filter(Boolean);return (!q||`${x.name||''} ${tps.join(' ')} ${x.airport||''} ${x.pic||''}`.toLowerCase().includes(q))&&(!ft||tps.includes(ft))&&(!fs||status===fs)});
}

function install(){if(!document.getElementById('initRows'))return;
 window.renderInitiatives=function(){
  refreshInitiativeFilters();
  const rows=filteredRows().filter(typeof geInitiativeScopedV224==='function'?geInitiativeScopedV224:()=>true);const box=document.getElementById('initRows');
  box.innerHTML=rows.length?rows.map((x,i)=>{const ratio=progressRatio(x.plan,x.real),ach=achievement(x.plan,x.real),c=ach.toLowerCase(),btns=typeof geInitiativeManageButtonsV224==='function'?geInitiativeManageButtonsV224(x):'';return `<article class="initiative-card-final"><div class="ic-head"><div><div class="ic-no">${String(i+1).padStart(2,'0')}</div><div class="ic-ring" style="--p:${Math.min(100,ratio)}%"><b>${ratio}%</b></div></div><div><span class="ic-pill ${c}">${esc(ach)}</span><div class="ic-title" style="margin-top:8px">${esc(x.name||'Untitled Initiative')}</div></div></div><div class="ic-meta"><div><small>PIC</small><b>${esc(x.pic||'-')}</b></div><div><small>Due Date</small><b>${esc(x.dueDate||'-')}</b></div><div><small>Touch Point</small><b>${esc(x.tp||'-')}</b></div><div><small>Station</small><b>${esc(x.airport||'ALL STATION')}</b></div><div><small>Target</small><b>${Number(x.plan||0)}%</b></div><div><small>Realisasi</small><b>${Number(x.real||0)}%</b></div></div><div class="ic-progress"><i style="width:${Math.min(100,ratio)}%"></i></div><div class="ic-actions">${btns}</div></article>`}).join(''):'<div class="ge-card" style="padding:20px">Belum ada inisiatif sesuai filter yang dipilih.</div>';
  renderInitiativeCharts(rows);
 };
 document.querySelectorAll('.journey-tab').forEach(btn=>{btn.addEventListener('click',()=>setTimeout(()=>window.renderInitiatives(),0))});
 window.renderInitiatives();
}
window.addEventListener('load',install);
})();
