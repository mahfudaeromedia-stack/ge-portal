
/* V2.55.4 — stability reset on V2.54.4 baseline */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const split=v=>String(v||'').split(';').map(x=>x.trim()).filter(Boolean);
const num=v=>Number(String(v||'0').replace(/[^0-9.-]/g,''))||0;
const norm=s=>String(s||'').trim().toLowerCase().replace(/[\/&]/g,' ').replace(/[()]/g,'').replace(/\s+/g,' ');
const val=(row,map,...names)=>{for(const n of names){const i=map[norm(n)];if(i!=null&&row[i]!=null)return String(row[i]).trim()}return''};
function dateVal(v){if(!v)return'';if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;if(/^\d+(\.\d+)?$/.test(v)&&Number(v)>20000)return new Date((Number(v)-25569)*86400000).toISOString().slice(0,10);return v}
function notice(t,m,type='success'){if(typeof geStorageNoticeV223==='function')geStorageNoticeV223(t,m,type);else alert(t+'\n'+m)}

/* Preserve the exact V2.54.4 initiative card rendering; only add Priority filtering. */
function installInitiativeControls(){
 const host=$('initRows');if(!host)return;
 const title=document.querySelector('.initiative-list-title-v226');
 if(title&&!$('geV2554UploadInitiative')){
   const add=title.querySelector('button[onclick*="openInitiativeModalV224"]');
   const wrap=document.createElement('div');wrap.className='v2554-initiative-actions';
   wrap.innerHTML=`<a class="btn secondary compact-btn" href="assets/Template_Bulk_Import_Initiative_V2_55.xlsx" download>Template Excel</a><button class="btn secondary compact-btn" type="button" id="geV2554UploadInitiative">Upload CSV/Excel</button>`;
   if(add){add.parentNode.insertBefore(wrap,add);wrap.appendChild(add)}
   else title.appendChild(wrap);
   $('geV2554UploadInitiative').onclick=openBulk;
 }
 const grid=document.querySelector('.initiative-filter-grid-v226');
 if(grid&&!$('geV2554Priority')){
   const csv=[...grid.querySelectorAll('button')].find(b=>/Unduh CSV/i.test(b.textContent||''));
   const s=document.createElement('select');s.id='geV2554Priority';s.innerHTML='<option value="">Semua Priority</option><option>Critical</option><option>High</option><option>Normal</option><option>Low</option>';s.onchange=()=>renderInitiatives();
   if(csv)grid.insertBefore(s,csv);else grid.appendChild(s);
 }
 const baseRender=window.renderInitiatives;
 window.renderInitiatives=function(){
   refreshInitiativeFilters();
   let rows=currentInitiativeRows().filter(geInitiativeScopedV224);
   const p=$('geV2554Priority')?.value||'';if(p)rows=rows.filter(x=>String(x.priority||'Normal')===p);
   const t=$('initRows');if(t)t.innerHTML=rows.length?rows.map(geInitiativeCardV251).join(''):'<div class="initiative-empty-v246">Belum ada inisiatif pada filter ini.</div>';
   renderInitiativeCharts(rows);
 };
 renderInitiatives();
}

/* Draft button: use the established V2.54.2 draft list. */
function bindCalendar(){
 const draft=$('geV2554DraftBtn');
 if(draft)draft.onclick=e=>{e.preventDefault();e.stopPropagation();window.geV2542OpenDrafts?.()};
 const add=document.querySelector('[data-calendar-add-v2535]');
 if(add)add.onclick=e=>{e.preventDefault();e.stopPropagation();window.geV254OpenActivity?.()};
 // Robust calendar navigation: keep one explicit calendar date state and render from it.
 window.geCalMoveV2533=function(n){
   if(!(window.geV251CalDate instanceof Date))window.geV251CalDate=new Date();
   const d=new Date(window.geV251CalDate);
   const view=window.GE_CAL_VIEW_R2||'month';
   if(view==='day')d.setDate(d.getDate()+n);
   else if(view==='week')d.setDate(d.getDate()+7*n);
   else d.setMonth(d.getMonth()+n,1);
   window.geV251CalDate=d;
   try{ if(typeof geV251CalDate!=='undefined')geV251CalDate=d; }catch(_e){}
   window.geCalRenderV2533?.();
 };
}

/* Gantt click-through for Initiative, Milestone and Activity. */
window.geV2554OpenGanttItem=function(id){
 id=String(id||'');
 if(id.startsWith('m-')){
   const m=id.match(/^m-(.+)-(\d+)$/);if(!m)return;
   const initId=Number(m[1]),idx=Number(m[2]);
   if(typeof openInitiativeTimelineV224==='function')openInitiativeTimelineV224(initId);
   setTimeout(()=>{const cards=document.querySelectorAll('#initiativeTimelineModalV224 .timeline-card-v224');cards[idx]?.scrollIntoView({behavior:'smooth',block:'center'});cards[idx]?.classList.add('v255-focus')},120);
   return;
 }
 const act=(data.events||[]).find(x=>String(x.id)===id);
 if(act&&typeof geV254OpenActivity==='function'){geV254OpenActivity(id);return}
 const init=(data.initiatives||[]).find(x=>String(x.id)===id);
 if(init&&typeof openInitiativeTimelineV224==='function')openInitiativeTimelineV224(Number(init.id));
};
window.geV2554BindGantt=function(){
 document.querySelectorAll('#geV254GanttView [data-gantt-id]').forEach(el=>{
   if(el.dataset.clickBound)return;el.dataset.clickBound='1';
   el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window.geV2554OpenGanttItem(el.dataset.ganttId)});
 });
 const gantt=document.querySelector('#geV254GanttView .v2554-gantt'),grip=gantt?.querySelector('.v2554-gantt-grip');
 if(gantt&&grip&&!grip.dataset.bound){
   grip.dataset.bound='1';grip.addEventListener('pointerdown',e=>{
     e.preventDefault();e.stopPropagation();
     const start=e.clientX,initial=parseFloat(getComputedStyle(gantt).getPropertyValue('--v2554-label-width'))||340;
     const move=ev=>gantt.style.setProperty('--v2554-label-width',Math.max(250,Math.min(520,initial+ev.clientX-start))+'px');
     const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up)};
     window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
   });
 }
};

/* XLSX/CSV bulk import. Excel: sheet 1 Initiatives, sheet 2 Milestones. */
async function parseSheet(file,n){
 if(n===1)return geParseXLSXV223(file);
 const entries=await geReadZipEntriesV223(await file.arrayBuffer()),dec=new TextDecoder(),shared=[];
 if(entries.has('xl/sharedStrings.xml')){const d=new DOMParser().parseFromString(dec.decode(entries.get('xl/sharedStrings.xml')),'application/xml');[...d.getElementsByTagName('si')].forEach(si=>shared.push([...si.getElementsByTagName('t')].map(t=>t.textContent||'').join('')))}
 const key=`xl/worksheets/sheet${n}.xml`;if(!entries.has(key))return[];
 const d=new DOMParser().parseFromString(dec.decode(entries.get(key)),'application/xml'),rows=[];
 [...d.getElementsByTagName('row')].forEach(r=>{const vals=[];[...r.getElementsByTagName('c')].forEach(c=>{const ref=c.getAttribute('r')||'A1',letters=(ref.match(/[A-Z]+/i)||['A'])[0].toUpperCase();let idx=0;for(const ch of letters)idx=idx*26+(ch.charCodeAt(0)-64);idx--;const type=c.getAttribute('t')||'',raw=c.getElementsByTagName('v')[0]?.textContent??'';vals[idx]=type==='s'?(shared[Number(raw)]??''):type==='inlineStr'?[...c.getElementsByTagName('t')].map(t=>t.textContent||'').join(''):raw});rows.push(vals)});return rows;
}
function objectRows(rows,type){
 if(!rows.length)return[];const map={};(rows[0]||[]).forEach((h,i)=>map[norm(h)]=i);
 return rows.slice(1).filter(r=>r.some(v=>String(v||'').trim())).map((r,i)=>{
   if(type==='init'){const code=val(r,map,'Initiative Code'),name=val(r,map,'Initiative Name','Inisiatif'),js=split(val(r,map,'Journey Scope')),tp=split(val(r,map,'Touch Point'));return {row:i+2,errors:[!code&&'Initiative Code',!name&&'Initiative Name'].filter(Boolean),obj:{initiativeCode:code,name,planningYear:num(val(r,map,'Planning Year')),journeyScopes:js,journey:js[0]||'',touchpoints:tp,tp:tp[0]||'',airport:val(r,map,'Station').toUpperCase(),pic:val(r,map,'PIC'),priority:val(r,map,'Priority')||'Normal',strategicPriority:val(r,map,'Strategic Priority')||'No',portfolio:val(r,map,'Portfolio'),startDate:dateVal(val(r,map,'Start Date')),endDate:dateVal(val(r,map,'End Date')),dueDate:dateVal(val(r,map,'Due Date')),plan:num(val(r,map,'Target %','Target (%)')),estimatedCost:num(val(r,map,'Estimated Cost')),budget:num(val(r,map,'Budget')),status:val(r,map,'Status')||'Not Started',targetText:val(r,map,'Target Output','Target / Output'),remark:val(r,map,'Remark'),publicationStatus:'published'}}}
   const obj={initiativeCode:val(r,map,'Initiative Code'),title:val(r,map,'Milestone Name'),milestoneType:(val(r,map,'Milestone Type')||'Single Due Date').toLowerCase().includes('period')?'period':'date',startDate:dateVal(val(r,map,'Start Date')),endDate:dateVal(val(r,map,'End Date')),dueDate:dateVal(val(r,map,'Due Date')),pic:val(r,map,'PIC'),status:val(r,map,'Status')||'Not Started',estimatedCost:num(val(r,map,'Estimated Cost')),remark:val(r,map,'Remark')};return {row:i+2,errors:[!obj.initiativeCode&&'Initiative Code',!obj.title&&'Milestone Name',!obj.dueDate&&'Due Date'].filter(Boolean),obj};
 });
}
let bulk={init:[],milestone:[]};
function ensureBulk(){
 if($('geV2554BulkModal'))return;
 document.body.insertAdjacentHTML('beforeend',`<div id="geV2554BulkModal" class="modal-backdrop"><div class="modal-card v2554-bulk-card"><button class="modal-x" type="button" id="geV2554BulkX">×</button><span class="eyebrow">BULK IMPORT INITIATIVE</span><h2>Upload CSV / Excel</h2><p class="section-subtitle">Gunakan template agar struktur Initiative dan Milestone konsisten.</p><label class="v2554-upload-box"><input id="geV2554BulkFile" type="file" accept=".xlsx,.csv"><b>Pilih file XLSX / CSV</b><span>XLSX mendukung sheet Initiatives + Milestones.</span></label><label>Mode Import<select id="geV2554Mode"><option value="upsert">Create & Update</option><option value="create">Create New Only</option><option value="update">Update Existing Only</option></select></label><div id="geV2554BulkStats" class="v2554-bulk-stats"></div><div class="v2554-preview"><table><thead><tr><th>Row</th><th>Code</th><th>Initiative</th><th>Validation</th></tr></thead><tbody id="geV2554PreviewBody"></tbody></table></div><div class="modal-actions sticky-actions"><a class="btn secondary" href="assets/Template_Bulk_Import_Initiative_V2_55.xlsx" download>Download Template</a><button class="btn" id="geV2554Import" disabled>Import Data</button><button class="btn secondary" id="geV2554BulkClose">Close</button></div></div></div>`);
 $('geV2554BulkX').onclick=$('geV2554BulkClose').onclick=()=>$('geV2554BulkModal').classList.remove('show');
 $('geV2554BulkFile').onchange=e=>previewBulk(e.target.files[0]);
 $('geV2554Import').onclick=doImport;
}
function openBulk(){ensureBulk();$('geV2554BulkModal').classList.add('show')}
async function previewBulk(file){
 if(!file)return;
 try{
   const ext=file.name.split('.').pop().toLowerCase();let a,b=[];
   if(ext==='csv')a=geParseCSVV223(await file.text());else{a=await parseSheet(file,1);b=await parseSheet(file,2)}
   bulk={init:objectRows(a,'init'),milestone:objectRows(b,'mile')};
   const errors=[...bulk.init,...bulk.milestone].reduce((n,x)=>n+x.errors.length,0);
   $('geV2554BulkStats').innerHTML=`<span><b>${bulk.init.length}</b> Initiative</span><span><b>${bulk.milestone.length}</b> Milestone</span><span><b>${errors}</b> Error</span>`;
   $('geV2554PreviewBody').innerHTML=bulk.init.map(x=>`<tr><td>${x.row}</td><td>${esc(x.obj.initiativeCode)}</td><td>${esc(x.obj.name)}</td><td>${x.errors.length?'Lengkapi '+esc(x.errors.join(', ')):'Valid'}</td></tr>`).join('');
   $('geV2554Import').disabled=errors>0||!bulk.init.length;
 }catch(e){notice('File tidak dapat dibaca',e.message||String(e),'warning')}
}
function doImport(){
 const mode=$('geV2554Mode').value;data.initiatives=data.initiatives||[];let created=0,updated=0,skipped=0;
 bulk.init.forEach(r=>{const o=r.obj,old=data.initiatives.find(x=>String(x.initiativeCode||'')===String(o.initiativeCode));if(old){if(mode==='create'){skipped++;return}Object.assign(old,o,{id:old.id,workflow:old.workflow||[]});updated++}else{if(mode==='update'){skipped++;return}data.initiatives.push({...o,id:Date.now()+created,workflow:[]});created++}});
 bulk.milestone.forEach(r=>{const x=data.initiatives.find(v=>String(v.initiativeCode||'')===String(r.obj.initiativeCode));if(!x)return;x.workflow=x.workflow||[];const o={...r.obj};delete o.initiativeCode;const old=x.workflow.find(w=>w.title===o.title&&w.dueDate===o.dueDate);if(old)Object.assign(old,o);else x.workflow.push(o)});
 if(typeof save==='function')save();$('geV2554BulkModal').classList.remove('show');if(typeof renderInitiatives==='function')renderInitiatives();notice('Import selesai',`${created} dibuat • ${updated} diperbarui • ${skipped} dilewati.`,'success');
}

window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{installInitiativeControls();bindCalendar();ensureBulk();window.geV2554BindGantt?.()},80));
})();
