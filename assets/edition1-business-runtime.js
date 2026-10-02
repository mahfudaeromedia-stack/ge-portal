/* Edition 1 Business Runtime
 * Consolidated legacy business definitions. DOMContentLoaded auto-boot is intentionally suppressed.
 * Page boot is owned by edition1-page-boot.js after Firestore hydration.
 */
(function(){
  const UI_STATE=window.__GE_EDITION1_UI_STATE||(window.__GE_EDITION1_UI_STATE={});
  const geUiGet=(key)=>Object.prototype.hasOwnProperty.call(UI_STATE,key)?UI_STATE[key]:null;
  const geUiSet=(key,value)=>{UI_STATE[key]=String(value);return value};
  const geUiRemove=(key)=>{delete UI_STATE[key]};
  const _w=window.addEventListener.bind(window);
  const _d=document.addEventListener.bind(document);
  window.addEventListener=function(type,fn,opt){ if(type==='DOMContentLoaded') return; return _w(type,fn,opt); };
  document.addEventListener=function(type,fn,opt){ if(type==='DOMContentLoaded') return; return _d(type,fn,opt); };

/* Canonical business runtime; legacy monolith logic has been consolidated here. */

const store=window.GEStore;
let data=store.get();
let activeJourney='';

function save(){store.save(data)}
function achievement(plan,real){return +real<+plan?'Below':(+real===+plan?'Meet':'Exceed')}
function achievementPill(plan,real){
 const s=achievement(plan,real);
 const c=s==='Below'?'danger':(s==='Meet'?'warn':'');
 return `<span class="pill ${c}">${s}</span>`;
}
function getJourney(tp){
 const key=String(tp||'').trim().toLowerCase();
 const map={
  'call center':'Pre-Journey',
  'garuda sales office':'Pre-Journey',
  'airport ticketing office':'Pre-Journey',
  'airport transfer':'Pre-Journey',
  'check-in counter':'Pre-Flight',
  'check in counter':'Pre-Flight',
  'security check point':'Pre-Flight',
  'lounge':'Pre-Flight',
  'buggy car':'Pre-Flight',
  'boarding gate':'Pre-Flight',
  'transfer desk':'Post-Flight',
  'arrival hall':'Post-Flight',
  'baggage claim':'Post-Flight',
  'post claim':'Post-Journey',
  'post survey':'Post-Journey'
 };
 return map[key]||'';
}
function uniqueTouchpoints(){
 return [...new Set([...(data.touchpoints||[]).map(x=>typeof x==='string'?x:(x.name||x.title||x.touchpoint||x.code||'')),...(data.initiatives||[]).flatMap(x=>{const v=x.touchpoints||x.tp||x.touchpoint||'';return Array.isArray(v)?v:String(v).split(/[|,;]/)})].map(x=>String(x||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
}
function refreshInitiativeFilters(){
 const ft=document.getElementById('ft');
 if(ft){
   const current=ft.value;
   ft.innerHTML='<option value="">Semua Touch Point</option>'+uniqueTouchpoints().map(x=>`<option>${x}</option>`).join('');
   if([...ft.options].some(o=>o.value===current))ft.value=current;
 }
 const fs=document.getElementById('fs');
 if(fs && ![...fs.options].some(o=>o.value==='Below')){
   fs.innerHTML='<option value="">Semua Pencapaian</option><option>Below</option><option>Meet</option><option>Exceed</option>';
 }
}
function progressRatio(plan,real){
 if(+plan<=0)return +real>0?100:0;
 return Math.max(0,Math.round((+real/+plan)*100));
}
function currentInitiativeRows(){
 const q=(document.getElementById('q')?.value||'').toLowerCase();
 const tp=document.getElementById('ft')?.value||'';
 const st=document.getElementById('fs')?.value||'';
 return (data.initiatives||[]).filter(x=>
   (!q||String(x.name||'').toLowerCase().includes(q)) &&
   (!tp||x.tp===tp) &&
   (!st||achievement(x.plan,x.real)===st) &&
   (!activeJourney||((x.journey||getJourney(x.tp))===activeJourney))
 );
}
function geProgressToneR17(value){
 const v=Math.max(0,Math.min(100,Number(value)||0));
 if(v<30)return '#b84b4b';
 if(v<=50)return '#c9822b';
 if(v<=70)return '#b79a2e';
 if(v<=90)return '#4f7d68';
 if(v<100)return '#2d6688';
 return '#073b67';
}
function renderInitiativeCharts(rows){
 const box=document.getElementById('initiativeCharts');
 if(!box)return;
 const groups={};
 rows.forEach(x=>{
   const key=x.tp||'Touch Point Lainnya';
   groups[key]??={plan:0,real:0,count:0};
   groups[key].plan+=+x.plan||0;
   groups[key].real+=+x.real||0;
   groups[key].count++;
 });
 const items=Object.entries(groups).slice(0,8);
 if(!items.length){
   box.innerHTML='<div class="card"><p>Belum ada data inisiatif untuk ditampilkan.</p></div>';
   return;
 }
 box.innerHTML=items.map(([tp,v])=>{
   const target=Math.min(100,Math.round(v.plan/v.count)||0);
   const actual=Math.min(100,Math.round(v.real/v.count)||0);
   const r=58,c=2*Math.PI*r;
   const td=(target/100)*c,ad=(actual/100)*c;
   const tone=geProgressToneR17(actual);
   return `<button type="button" class="radial-card ge-touchpoint-filter-card" style="--ge-progress-tone:${tone}" title="Buka Gantt: ${geEsc(tp)}" onclick="geFilterInitiativeTouchpoint(${JSON.stringify(tp)})">
    <div class="radial-chart">
      <svg viewBox="0 0 140 140">
        <circle class="track" cx="70" cy="70" r="${r}"></circle>
        <circle class="target" cx="70" cy="70" r="${r}" stroke-dasharray="${td} ${c-td}"></circle>
        <circle class="actual" cx="70" cy="70" r="${r}" stroke-dasharray="${ad} ${c-ad}"></circle>
      </svg>
      <div class="radial-center"><strong>${actual}%</strong><span>Realisasi</span></div>
    </div>
    <div class="chart-title">${tp}</div>
    <div class="chart-meta"><span>Target <b>${target}%</b></span><span>Realisasi <b>${actual}%</b></span></div>
   </button>`;
 }).join('');
}
function geFilterInitiativeTouchpoint(tp){
  const value=String(tp||'').trim();
  const ft=document.getElementById('ft');
  const q=document.getElementById('q');
  const fs=document.getElementById('fs');
  if(q)q.value='';
  if(fs)fs.value='';
  refreshInitiativeFilters();
  if(ft){ft.value=value;if(ft.value!==value)ft.value='';}
  renderInitiatives();
  document.getElementById('initRows')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function renderInitiatives(){
 refreshInitiativeFilters();
 const rows=currentInitiativeRows();
 const t=document.getElementById('initRows');
 if(t){
   t.innerHTML=rows.map((x,i)=>{
     const ratio=progressRatio(x.plan,x.real);
     return `<tr>
       <td>${i+1}</td><td><b>${x.name}</b></td><td>${x.tp}</td><td>${x.airport||''}</td>
       <td>${x.plan}%</td><td>${x.real}%</td><td>${achievementPill(x.plan,x.real)}</td>
       <td>${x.remark||''}</td>
       <td class="table-progress"><div class="mini-progress"><i style="width:${Math.min(100,ratio)}%"></i></div>
       <div class="mini-progress-text">${ratio}% terhadap target</div></td>
     </tr>`;
   }).join('');
 }
 renderInitiativeCharts(rows);
}
function setJourneyFilter(journey){
 activeJourney=journey||'';
 document.querySelectorAll('.journey-tab').forEach(x=>
   x.classList.toggle('active',x.dataset.journey===activeJourney)
 );
 renderInitiatives();
}
function addInitiative(){
 const tp=(document.getElementById('itp')?.value||'').trim();
 if(!tp){alert('Touch Point harus diisi.');return}
 const pageJourney=document.getElementById('journeyPageValue')?.value||'';
 const journey=pageJourney||activeJourney||getJourney(tp)||'';
 data.initiatives.push({
   id:Date.now(),
   name:(document.getElementById('iname')?.value||'').trim(),
   tp,journey,
   airport:(document.getElementById('iapt')?.value||'').trim().toUpperCase(),
   plan:+(document.getElementById('iplan')?.value||0),
   real:+(document.getElementById('ireal')?.value||0),
   remark:(document.getElementById('irem')?.value||'').trim()
 });
 if(!(data.touchpoints||[]).some(x=>(typeof x==='string'?x:x.name)===tp))data.touchpoints.push({id:'legacy:'+tp,name:tp,status:'Active'});
 save();
 document.getElementById('initForm')?.reset();
 renderInitiatives();
}
function downloadBlob(content,name,type){
 const a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob([content],{type}));
 a.download=name;a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function exportCSV(){
 let csv='No,Inisiatif,Touch Point,Airport,Target (%),Realisasi (%),Pencapaian,Keterangan\n';
 currentInitiativeRows().forEach((x,i)=>{
   csv+=`${i+1},"${String(x.name||'').replaceAll('"','""')}","${String(x.tp||'').replaceAll('"','""')}",${x.airport||''},${x.plan},${x.real},${achievement(x.plan,x.real)},"${String(x.remark||'').replaceAll('"','""')}"\n`;
 });
 downloadBlob(csv,'GE_Inisiatif.csv','text/csv;charset=utf-8');
}

function renderAirports(){
 const t=document.getElementById('airportRows');if(!t)return;
 t.innerHTML=(data.airports||[]).map((a,i)=>`<tr><td>${i+1}</td><td><b>${a.code}</b></td><td>${a.city}</td><td>${a.region}</td><td><span class="pill">${a.status}</span></td><td>${a.lounge}</td><td>${a.pending}</td></tr>`).join('');
}
function addAirport(){
 const a={code:(document.getElementById('acode')?.value||'').trim().toUpperCase(),city:(document.getElementById('acity')?.value||'').trim(),region:document.getElementById('areg')?.value||'Domestik',status:'Active',lounge:0,pending:'-'};
 if(!a.code||!a.city){alert('Kode dan kota airport harus diisi.');return}
 data.airports.push(a);save();renderAirports();document.getElementById('airportForm')?.reset();
}
function downloadAirportCSV(){
 let csv='Code,City,Region,Status,Lounge Visitors,Pending Item\n';
 (data.airports||[]).forEach(a=>csv+=`${a.code},"${String(a.city).replaceAll('"','""')}",${a.region},${a.status},${a.lounge},"${String(a.pending||'').replaceAll('"','""')}"\n`);
 downloadBlob(csv,'GE_Airport_Database.csv','text/csv;charset=utf-8');
}
function downloadAirportTemplate(){
 downloadBlob('Code,City,Region,Status,Lounge Visitors,Pending Item\nCGK,Jakarta,Domestik,Active,2540,2 Kontrak\n','GE_Airport_Import_Template.csv','text/csv;charset=utf-8');
}
function parseCSVLine(line){
 let out=[],cur='',q=false;
 for(let i=0;i<line.length;i++){
   const ch=line[i];
   if(ch==='"'&&line[i+1]==='"'){cur+='"';i++}
   else if(ch==='"'){q=!q}
   else if(ch===','&&!q){out.push(cur);cur=''}
   else cur+=ch;
 }
 out.push(cur);return out;
}
function importAirportCSV(input){
 const file=input.files?.[0];if(!file)return;
 const r=new FileReader();
 r.onload=()=>{
   const lines=String(r.result).split(/\r?\n/).filter(x=>x.trim());
   if(lines.length<2){alert('CSV kosong atau format tidak sesuai.');return}
   lines.shift();let count=0;
   lines.forEach(line=>{
     const c=parseCSVLine(line);if(c.length<2)return;
     data.airports.push({code:(c[0]||'').trim().toUpperCase(),city:(c[1]||'').trim(),region:(c[2]||'Domestik').trim(),status:(c[3]||'Active').trim(),lounge:+c[4]||0,pending:(c[5]||'-').trim()});
     count++;
   });
   save();renderAirports();input.value='';alert(`${count} airport berhasil ditambahkan dari CSV.`);
 };
 r.readAsText(file);
}

function renderNews(){
 const b=document.getElementById('headlineList');if(!b)return;
 b.innerHTML=(data.news||[]).slice().sort((a,b)=>b.date.localeCompare(a.date)).map((n,i)=>`<article class="card headline-card" style="${i===0?'grid-row:span 2':''}"><small>${n.date} • ${n.category}</small><h2>${n.title}</h2><p>${n.summary}</p><button class="btn secondary">Baca Selengkapnya</button></article>`).join('');
}
function renderNewsAdmin(){
 const t=document.getElementById('newsAdminRows');if(!t)return;
 t.innerHTML=(data.news||[]).map((n,i)=>`<tr><td>${i+1}</td><td>${n.title}</td><td>${n.category}</td><td>${n.date}</td><td><button class="btn secondary" onclick="editNews(${n.id})">Edit</button> <button class="btn" onclick="deleteNews(${n.id})">Hapus</button></td></tr>`).join('');
}
function saveNewsForm(){
 const form=document.getElementById('newsForm');if(!form)return;
 const id=+(form.dataset.edit||0);
 const obj={title:document.getElementById('ntitle').value.trim(),date:document.getElementById('ndate').value,category:document.getElementById('ncat').value.trim(),summary:document.getElementById('nsum').value.trim()};
 if(id)Object.assign(data.news.find(x=>x.id===id),obj);else data.news.push({id:Date.now(),...obj});
 save();form.reset();delete form.dataset.edit;
 const b=document.getElementById('newsSaveBtn');if(b)b.textContent='Tambah Headline';
 renderNews();renderNewsAdmin();
}
function editNews(id){
 const n=data.news.find(x=>x.id===id);if(!n)return;
 ntitle.value=n.title;ndate.value=n.date;ncat.value=n.category;nsum.value=n.summary;
 newsForm.dataset.edit=id;newsSaveBtn.textContent='Update Headline';
}
function deleteNews(id){
 if(confirm('Hapus headline ini?')){data.news=data.news.filter(x=>x.id!==id);save();renderNews();renderNewsAdmin()}
}
function airportPanel(a){
 const p=document.getElementById('mapPanel');if(!p)return;
 p.innerHTML=`<b style="font-size:20px">${a.code} — ${a.city}</b><p>${a.region}</p><hr><p>Status Layanan<br><b>${a.status}</b></p><p>Pending Item<br><b>${a.pending}</b></p><p>Visitor Lounge<br><b>${(+a.lounge||0).toLocaleString()}</b></p><p>Pejabat / Service Leader<br><b>Data belum diisi</b></p>`;
}

/* Navigation: deliberately isolated from authentication */
function toggleSidebar(){
 document.body.classList.toggle('side-hidden');
 geUiSet('GE_SIDE_HIDDEN',document.body.classList.contains('side-hidden')?'true':'false');
}
function toggleServices(event){
 event?.preventDefault();
 const nav=document.getElementById('serviceNav');if(!nav)return false;
 nav.classList.toggle('collapsed');
 geUiSet('GE_SERVICE_COLLAPSED',nav.classList.contains('collapsed')?'true':'false');
 return false;
}
function toggleInitiatives(event){
 event?.preventDefault();
 const nav=document.getElementById('initiativeNav');if(!nav)return false;
 nav.classList.toggle('collapsed');
 geUiSet('GE_INIT_COLLAPSED',nav.classList.contains('collapsed')?'true':'false');
 return false;
}
function restoreNavigationState(){
 document.body.classList.toggle('side-hidden',geUiGet('GE_SIDE_HIDDEN')==='true');
 const s=document.getElementById('serviceNav');
 const i=document.getElementById('initiativeNav');
 if(s)s.classList.toggle('collapsed',geUiGet('GE_SERVICE_COLLAPSED')==='true');
 if(i)i.classList.toggle('collapsed',geUiGet('GE_INIT_COLLAPSED')==='true');
}
function setupBackToTop(){
 const btn=document.getElementById('backToTop');if(!btn)return;
 const sync=()=>btn.classList.toggle('visible',window.scrollY>260);
 window.addEventListener('scroll',sync,{passive:true});sync();
 btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
}
function initSessionUI(){
 const s=window.GX_CURRENT_USER||(typeof gxGetSession==='function'?gxGetSession():null);
 if(s){
   const n=document.getElementById('sessionName'),r=document.getElementById('sessionRole');
   if(n)n.textContent=s.name;if(r)r.textContent=s.role;
 }
 if(typeof gxApplyRole==='function')gxApplyRole();
}
function initJourneyPage(){
 const hidden=document.getElementById('journeyPageValue');
 if(hidden)activeJourney=hidden.value||'';
 const q=new URLSearchParams(location.search).get('journey');
 const map={'pre-journey':'Pre-Journey','pre-flight':'Pre-Flight','post-flight':'Post-Flight','post-journey':'Post-Journey'};
 if(q&&map[q])activeJourney=map[q];
 const all=document.querySelector('.journey-tab[data-journey=""]');
 if(all&&!activeJourney)all.classList.add('active');
 document.querySelectorAll('.journey-tab').forEach(x=>x.classList.toggle('active',x.dataset.journey===activeJourney));
}
window.addEventListener('DOMContentLoaded',()=>{
 restoreNavigationState();
 initSessionUI();
 initJourneyPage();
 renderInitiatives();
 renderAirports();
 renderNews();
 renderNewsAdmin();
 setupBackToTop();
});

const airportMapInfo={
 CGK:{code:'CGK',name:'Soekarno-Hatta',city:'Jakarta',region:'Domestik',official:'Service Leader CGK',status:'Active',pending:'2 Kontrak',visitor:'2.540 visitor',facilities:'Lounge • Check-in • Boarding • Premium Service'},
 DPS:{code:'DPS',name:'I Gusti Ngurah Rai',city:'Denpasar',region:'Domestik',official:'Service Leader DPS',status:'Enhancement',pending:'1 Inisiatif',visitor:'1.830 visitor',facilities:'Lounge • Check-in • Boarding • Premium Service'},
 SIN:{code:'SIN',name:'Changi Airport',city:'Singapore',region:'Asia',official:'Service Leader SIN',status:'Active',pending:'-',visitor:'920 visitor',facilities:'Lounge • Check-in • Boarding'},
 JED:{code:'JED',name:'King Abdulaziz International',city:'Jeddah',region:'MEA',official:'Service Leader JED',status:'Active',pending:'-',visitor:'540 visitor',facilities:'Lounge • Check-in • Boarding'},
 AMS:{code:'AMS',name:'Schiphol Airport',city:'Amsterdam',region:'Europe',official:'Service Leader AMS',status:'Active',pending:'1 Kontrak',visitor:'680 visitor',facilities:'Check-in • Boarding • Lounge Partner'}
};
function showAirportTooltip(ev,code){
 const t=document.getElementById('mapTooltip'),m=document.getElementById('interactiveMap'),d=airportMapInfo[code];
 if(!t||!m||!d)return;
 const mr=m.getBoundingClientRect(),er=ev.currentTarget.getBoundingClientRect();
 t.innerHTML=`<b>${d.code} — ${d.name}</b><small>${d.city} • ${d.region}</small><small>Status: ${d.status} · Pending: ${d.pending}</small><small>Visitor Lounge: ${d.visitor}</small>`;
 t.style.left=(er.left-mr.left+er.width/2)+'px';
 t.style.top=(er.top-mr.top)+'px';
 t.classList.add('show');
}
function hideAirportTooltip(){document.getElementById('mapTooltip')?.classList.remove('show')}
function selectAirport(code,marker){
 document.querySelectorAll('.airport-marker').forEach(x=>x.classList.remove('active'));
 marker?.classList.add('active');
 const d=airportMapInfo[code],p=document.getElementById('airportDetail');if(!d||!p)return;
 p.innerHTML=`<div class="code">${d.code}</div><h2>${d.name}</h2><p class="section-subtitle">${d.city} • ${d.region}</p>
 <div class="detail-row">Pejabat / Service Leader<b>${d.official}</b></div>
 <div class="detail-row">Status Layanan<b>${d.status}</b></div>
 <div class="detail-row">Pending Item<b>${d.pending}</b></div>
 <div class="detail-row">Visitor Lounge<b>${d.visitor}</b></div>
 <div class="detail-row">Fasilitas<b>${d.facilities}</b></div>`;
}
function filterAirportMap(region,button){
 document.querySelectorAll('.map-chip').forEach(x=>x.classList.remove('active'));button?.classList.add('active');
 document.querySelectorAll('.airport-marker').forEach(m=>{
   const show=!region||m.dataset.region===region;
   m.style.opacity=show?'1':'.10';
   m.style.pointerEvents=show?'auto':'none';
 });
 hideAirportTooltip();
}

/* V2.8 Dashboard, Documents, Lounge */
function toggleLounge(event){event?.preventDefault();const n=document.getElementById('loungeNav');if(!n)return false;n.classList.toggle('collapsed');geUiSet('GE_LOUNGE_COLLAPSED',n.classList.contains('collapsed')?'true':'false');return false}
function restoreLoungeState(){const n=document.getElementById('loungeNav');if(n)n.classList.toggle('collapsed',geUiGet('GE_LOUNGE_COLLAPSED')==='true')}

function initDashboard(){
 const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
 set('dashAirport',(data.airports||[]).length);set('dashTouchpoint',(data.touchpoints||[]).length);set('dashInitiative',(data.initiatives||[]).length);
 const avg=(data.initiatives||[]).length?Math.round(data.initiatives.reduce((s,x)=>s+(+x.real||0),0)/data.initiatives.length):0;set('dashProgress',avg+'%');
 set('dashVisitor',(data.loungeVisitors||[]).length.toLocaleString('id-ID'));

 // Lounge is part of Pre-Flight. Contract Coverage = valid legal document + cooperation period still in force.
 const loungeRows=(data.lounges||[]);
 const today=new Date(); today.setHours(0,0,0,0);
 const covered=loungeRows.filter(x=>{
   const valid=String(x.documentStatus||'').trim().toLowerCase()==='valid';
   const end=x.endDate?new Date(x.endDate+'T00:00:00'):null;
   return valid && (!end || end>=today);
 }).length;
 const followup=Math.max(0,loungeRows.length-covered);
 const coverage=loungeRows.length?Math.round((covered/loungeRows.length)*100):0;
 set('dashLoungeCount',loungeRows.length.toLocaleString('id-ID'));
 set('dashLoungeCovered',covered.toLocaleString('id-ID'));
 set('dashLoungeFollowup',followup.toLocaleString('id-ID'));
 set('dashLoungeCoverage',coverage+'%');
 const donut=document.getElementById('dashLoungeCoverageDonut');
 if(donut)donut.style.setProperty('--coverage',coverage);

 renderDocumentsHome();renderDocumentsAdmin();
}
function documentCategories(){return [...new Set((data.documents||[]).map(x=>x.category).filter(Boolean))].sort()}
function renderDocumentsHome(){
 const q=(document.getElementById('docSearchHome')?.value||'').toLowerCase(),cat=document.getElementById('docCategoryHome')?.value||'';
 const sel=document.getElementById('docCategoryHome');if(sel){const cur=sel.value;sel.innerHTML='<option value="">Semua Kategori</option>'+documentCategories().map(x=>`<option>${x}</option>`).join('');sel.value=cur}
 const box=document.getElementById('documentHomeList');if(!box)return;
 const rows=(data.documents||[]).filter(x=>(!q||(x.title+' '+x.fileName+' '+x.note).toLowerCase().includes(q))&&(!cat||x.category===cat));
 box.innerHTML=rows.length?rows.map(x=>`<div class="document-row"><div><b>${x.title}</b><small>${x.fileName}${x.note?' • '+x.note:''}</small></div><span>${x.category}</span><span>${x.source}</span><span>${x.date}</span><button class="btn secondary" onclick="${x.blobKey?`GEFiles.download('${x.blobKey}','${String(x.fileName).replaceAll("'","")}')`:`alert('Sample metadata: file aktual belum diunggah pada browser ini.')`}">Unduh</button></div>`).join(''):'<p>Belum ada dokumen.</p>';
}
function renderDocumentsAdmin(){
 const box=document.getElementById('documentAdminList');if(!box)return;
 box.innerHTML=(data.documents||[]).map(x=>`<div class="document-row"><div><b>${x.title}</b><small>${x.fileName}</small></div><span>${x.category}</span><span>${x.source}</span><span>${x.date}</span><div>${x.blobKey?`<button class="btn secondary" onclick="GEFiles.download('${x.blobKey}','${String(x.fileName).replaceAll("'","")}')">Unduh</button>`:''} <button class="btn" data-role-min="Admin" onclick="deletePortalDocument(${x.id})">Hapus</button></div></div>`).join('');
 if(typeof gxApplyRole==='function')gxApplyRole();
}
async function addPortalDocument(){
 const f=document.getElementById('docFile')?.files?.[0];if(!f)return;
 const key='doc_'+Date.now();await GEFiles.put(key,f);
 data.documents.push({id:Date.now(),title:docTitle.value.trim(),category:docCategory.value.trim(),source:docSource.value,date:new Date().toISOString().slice(0,10),fileName:f.name,note:docNote.value.trim(),blobKey:key});
 save();documentForm.reset();renderDocumentsAdmin();renderDocumentsHome();alert('Dokumen berhasil disimpan offline dan ditampilkan pada Beranda.');
}
async function addInitiativeDocument(form){
 const f=form.elements.file.files?.[0];if(!f)return;const key='initdoc_'+Date.now();await GEFiles.put(key,f);
 data.documents.push({id:Date.now(),title:form.elements.title.value.trim(),category:form.elements.category.value.trim()||'Laporan Inisiatif',source:'Kegiatan & Inisiatif',date:new Date().toISOString().slice(0,10),fileName:f.name,note:activeJourney||'',blobKey:key});
 save();form.reset();alert('Dokumen berhasil diunggah dan akan tampil pada Beranda.');
}
function deletePortalDocument(id){if(confirm('Hapus dokumen dari daftar?')){data.documents=data.documents.filter(x=>x.id!==id);save();renderDocumentsAdmin();renderDocumentsHome()}}

function fillAirportSelects(){
 const codes=[...new Set((data.airports||[]).map(x=>x.code))].sort();
 ['scanAirport','visitorAirport','loungeAirportFilter'].forEach(id=>{const e=document.getElementById(id);if(!e)return;const first=e.options[0]?.outerHTML||'';e.innerHTML=first+codes.map(x=>`<option>${x}</option>`).join('')});
}



function loungeVisitorFiltered(){
 const s=document.getElementById('visitorStart')?.value||'',e=document.getElementById('visitorEnd')?.value||'',a=document.getElementById('visitorAirport')?.value||'',c=document.getElementById('visitorCategory')?.value||'';
 return (data.loungeVisitors||[]).filter(x=>(!s||x.date>=s)&&(!e||x.date<=e)&&(!a||x.airport===a)&&(!c||x.category===c));
}


function renderLounges(){
 const t=document.getElementById('loungeRows');if(!t)return;const admin=(typeof gxRoleLevel==='function'&&gxRoleLevel((gxGetSession()||{}).role)>=gxRoleLevel('Admin'));
 t.innerHTML=loungeFiltered().map((x,i)=>`<tr><td>${i+1}</td><td><b>${x.name}</b></td><td>${x.pic}</td><td>${x.airport}</td><td><span class="pill">${x.status}</span></td><td>${x.period}</td><td>${x.documentName?`<button class="btn secondary" onclick="${x.documentKey?`GEFiles.download('${x.documentKey}','${String(x.documentName).replaceAll("'","")}')`:`alert('Dokumen sample belum tersimpan pada browser ini.')`}">Unduh</button>`:'-'}</td>${admin?`<td><button class="btn" onclick="deleteLounge(${x.id})">Hapus</button></td>`:''}</tr>`).join('');
}
async function addLounge(){
 const f=document.getElementById('loungeDocument')?.files?.[0];let key='';if(f){key='lounge_'+Date.now();await GEFiles.put(key,f)}
 data.lounges.push({id:Date.now(),name:loungeName.value.trim(),pic:loungePIC.value.trim(),airport:loungeAirport.value.trim().toUpperCase(),status:loungeStatus.value,period:loungePeriod.value.trim(),documentName:f?.name||'',documentKey:key});save();loungeForm.reset();renderLounges();alert('Lounge berhasil ditambahkan.');
}
function deleteLounge(id){if(confirm('Hapus lounge ini?')){data.lounges=data.lounges.filter(x=>x.id!==id);save();renderLounges()}}
function downloadLoungesCSV(){let csv='No,Nama Lounge,PIC,Airport,Status,Periode Kerja Sama,Dokumen Kerja Sama\n';loungeFiltered().forEach((x,i)=>csv+=`${i+1},"${x.name}","${x.pic}",${x.airport},"${x.status}","${x.period}","${x.documentName||''}"\n`);downloadBlob(csv,'Daftar_Lounge.csv','text/csv;charset=utf-8')}

window.addEventListener('DOMContentLoaded',()=>{restoreLoungeState();fillAirportSelects();initDashboard();renderLoungeVisitors();renderLounges()});


/* =========================================================
   V2.9 — Lounge Access scan/manual/camera + duplicate guard
   ========================================================= */
let loungeCameraStream=null;
let loungeCameraLoop=null;
window._eligibleScan=null;

function normalizePaxName(v){
  return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').trim();
}
function normalizeFlight(v){
  return String(v||'').toUpperCase().replace(/\s+/g,'').trim();
}
function normalizeSeq(v){
  return String(v||'').toUpperCase().replace(/\s+/g,'').padStart(3,'0');
}
function visitorIdentityKey(obj){
  return [normalizePaxName(obj.name),normalizeFlight(obj.flight),normalizeSeq(obj.seq)].join('|');
}
function isDuplicateVisitor(obj){
  const key=visitorIdentityKey(obj);
  return (data.loungeVisitors||[]).some(x=>visitorIdentityKey(x)===key);
}

/* Temporary best-effort parser.
   Final field positions will be mapped after sample BP scan is provided. */
function parseBoardingScan(raw){
  raw=String(raw||'').trim();
  if(raw.length<5)return null;

  const indicator=raw.slice(-1).toUpperCase();
  let name='Passenger';
  let flight='-';
  let seq='';

  // BCBP-like heuristic for name
  const slash=raw.indexOf('/');
  if(slash>0){
    const start=raw.startsWith('M') ? 2 : 0;
    const end=Math.min(raw.length, slash+18);
    name=raw.slice(start,end).replace(/\s+/g,' ').trim();
  }

  // GA flight heuristic
  const fm=raw.match(/\bGA\s?(\d{2,4})\b/i) || raw.match(/GA(\d{3,4})/i);
  if(fm)flight='GA'+(fm[1]||'');

  // sequence heuristic: look for 3 digits near tail, excluding final Y/N
  const withoutFlag = ['Y','N'].includes(indicator) ? raw.slice(0,-1) : raw;
  const seqMatches=[...withoutFlag.matchAll(/(\d{3})(?!.*\d{3})/g)];
  if(seqMatches.length)seq=seqMatches[seqMatches.length-1][1];

  return {indicator:['Y','N'].includes(indicator)?indicator:'?',name,flight,seq,raw,source:'scan'};
}

function showPassengerPreview(parsed, status){
  const panel=document.getElementById('eligibilityPanel');
  if(!panel)return;

  const cls=status==='Y'?'eligible':status==='N'?'not-eligible':'warning-scan';
  const icon=status==='Y'?'✓':status==='N'?'×':'!';
  const title=status==='Y'?'Eligible':status==='N'?'Not Eligible':'Scan Tidak Terbaca';

  panel.innerHTML=`
    <div class="eligibility-result ${cls}">
      <div class="status-icon">${icon}</div>
      <h2>${title}</h2>
      <div class="passenger-preview">
        <div class="preview-grid">
          <div class="preview-item"><span>Nama Penumpang</span><b>${parsed?.name||'-'}</b></div>
          <div class="preview-item"><span>Flight Number</span><b>${parsed?.flight||'-'}</b></div>
          <div class="preview-item"><span>Sequence Check-in</span><b>${parsed?.seq||'-'}</b></div>
          <div class="preview-item"><span>Indicator</span><b>${parsed?.indicator||'-'}</b></div>
        </div>
      </div>
      ${status==='?'?'<div class="duplicate-warning">Data scan belum dapat dipetakan dengan lengkap. Gunakan Input Manual atau koreksi data sebelum proses dilanjutkan.</div>':''}
    </div>`;
}

function verifyBoardingPass(){
  const raw=document.getElementById('boardingScan')?.value||'';
  const parsed=parseBoardingScan(raw);

  if(!parsed){
    showPassengerPreview({name:'-',flight:'-',seq:'-',indicator:'?'},'?');
    openWarningModal('Boarding pass tidak terbaca. Silakan scan ulang atau gunakan Input Manual.');
    return;
  }

  showPassengerPreview(parsed,parsed.indicator);

  if(parsed.indicator==='?'){
    openWarningModal('Indicator eligibility Y/N tidak ditemukan pada akhir data scan. Silakan gunakan Input Manual atau scan ulang.');
    return;
  }

  if(parsed.indicator==='N'){
    const body=document.getElementById('eligibilityModalBody');
    body.innerHTML=`<div class="eligibility-result not-eligible"><div class="status-icon">×</div><h2>Not Eligible</h2>
      <div class="preview-grid">
        <div class="preview-item"><span>Nama Penumpang</span><b>${parsed.name||'-'}</b></div>
        <div class="preview-item"><span>Flight Number</span><b>${parsed.flight||'-'}</b></div>
        <div class="preview-item"><span>Sequence</span><b>${parsed.seq||'-'}</b></div>
      </div><p>Indicator boarding pass: N. Akses lounge tidak dapat diberikan.</p></div>`;
    document.getElementById('eligibilityModal').classList.add('show');
    return;
  }

  prepareEligibleConfirmation(parsed);
}

function toggleManualEntry(){
  document.getElementById('manualEntry')?.classList.toggle('show');
}

function verifyManualPassenger(){
  const parsed={
    name:(document.getElementById('manualName')?.value||'').trim(),
    flight:(document.getElementById('manualFlight')?.value||'').trim().toUpperCase(),
    seq:(document.getElementById('manualSeq')?.value||'').trim(),
    indicator:(document.getElementById('manualEligible')?.value||'').trim(),
    raw:'MANUAL',
    source:'manual'
  };
  if(!parsed.name||!parsed.flight||!parsed.seq||!['Y','N'].includes(parsed.indicator)){
    alert('Lengkapi Nama Penumpang, Flight Number, Sequence Check-in, dan Eligibility.');
    return;
  }
  showPassengerPreview(parsed,parsed.indicator);
  if(parsed.indicator==='N'){
    openWarningModal('Penumpang dinyatakan Not Eligible berdasarkan input manual.');
    return;
  }
  prepareEligibleConfirmation(parsed);
}

function prepareEligibleConfirmation(parsed){
  window._eligibleScan=parsed;
  const duplicate=isDuplicateVisitor(parsed);
  const body=document.getElementById('eligibilityModalBody');
  body.innerHTML=`<div class="eligibility-result eligible"><div class="status-icon">✓</div><h2>Eligible</h2>
    <p>Konfirmasi data penumpang sebelum visitor direkam.</p>
    <div class="preview-grid">
      <div class="preview-item"><span>Nama Penumpang</span><b>${parsed.name||'-'}</b></div>
      <div class="preview-item"><span>Flight Number</span><b>${parsed.flight||'-'}</b></div>
      <div class="preview-item"><span>Sequence</span><b>${parsed.seq||'-'}</b></div>
      <div class="preview-item"><span>Sumber</span><b>${parsed.source==='manual'?'Manual':'Scan'}</b></div>
    </div>
    ${duplicate?'<div class="duplicate-warning"><b>Duplikat terdeteksi.</b><br>Nama penumpang + Flight Number + Sequence Check-in sudah pernah direkam. Data tidak dapat direkam kembali.</div>':`
    <p style="margin-top:15px">Pilih kategori penumpang:</p>
    <div class="category-buttons">${['Business Class','Platinum','Elite Plus','GPS'].map(x=>`<button onclick="recordEligibleVisitor('${x}')">${x}</button>`).join('')}</div>`}
  </div>`;
  document.getElementById('eligibilityModal').classList.add('show');
}

function openWarningModal(message){
  const body=document.getElementById('eligibilityModalBody');
  body.innerHTML=`<div class="eligibility-result warning-scan"><div class="status-icon">!</div><h2>Perlu Verifikasi Manual</h2><p>${message}</p>
    <div class="confirm-actions"><button class="btn secondary" onclick="closeEligibilityModal();document.getElementById('manualEntry')?.classList.add('show')">Buka Input Manual</button></div></div>`;
  document.getElementById('eligibilityModal').classList.add('show');
}

function closeEligibilityModal(){
  document.getElementById('eligibilityModal')?.classList.remove('show');
}

function recordEligibleVisitor(category){
  const p=window._eligibleScan;
  if(!p)return;

  if(isDuplicateVisitor(p)){
    alert('Visitor tidak direkam karena kombinasi Nama Penumpang + Flight Number + Sequence Check-in sudah ada.');
    return;
  }

  const now=new Date();
  const airport=document.getElementById('scanAirport')?.value||'CGK';
  data.loungeVisitors.push({
    id:Date.now(),
    date:now.toISOString().slice(0,10),
    time:now.toTimeString().slice(0,5),
    name:p.name||'Passenger',
    flight:p.flight||'-',
    seq:normalizeSeq(p.seq||''),
    airport,
    category,
    raw:p.raw||'',
    source:p.source||'scan'
  });
  save();
  closeEligibilityModal();
  resetLoungeAccess();
  initDashboard();
  alert('Visitor berhasil direkam sebagai '+category+'.');
}

function resetLoungeAccess(){
  const scan=document.getElementById('boardingScan'); if(scan)scan.value='';
  ['manualName','manualFlight','manualSeq'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});
  const me=document.getElementById('manualEligible');if(me)me.value='';
  document.getElementById('manualEntry')?.classList.remove('show');
  const p=document.getElementById('eligibilityPanel');
  if(p)p.innerHTML='<div class="eligibility-idle"><b>Menunggu Scan</b><span>Data penumpang dan status eligibility akan tampil di sini.</span></div>';
  window._eligibleScan=null;
}

/* Camera scanner: BarcodeDetector when available */
async function startCameraScanner(){
  const panel=document.getElementById('cameraPanel');
  const video=document.getElementById('cameraVideo');
  const status=document.getElementById('cameraStatus');
  if(!navigator.mediaDevices?.getUserMedia){
    alert('Browser/perangkat ini tidak mendukung akses kamera.');
    return;
  }
  panel?.classList.add('show');
  try{
    loungeCameraStream=await navigator.mediaDevices.getUserMedia({
      video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},
      audio:false
    });
    video.srcObject=loungeCameraStream;
    await video.play();

    if(!('BarcodeDetector' in window)){
      status.textContent='Kamera aktif, tetapi BarcodeDetector tidak tersedia pada browser ini. Gunakan scanner eksternal atau Input Manual.';
      return;
    }

    const formats=await BarcodeDetector.getSupportedFormats();
    const preferred=['pdf417','qr_code','aztec','data_matrix','code_128'];
    const use=preferred.filter(x=>formats.includes(x));
    const detector=new BarcodeDetector({formats:use.length?use:formats});

    status.textContent='Kamera aktif. Arahkan barcode boarding pass ke area pemindaian.';
    const loop=async()=>{
      if(!loungeCameraStream)return;
      try{
        const codes=await detector.detect(video);
        if(codes?.length){
          const raw=codes[0].rawValue||'';
          if(raw){
            document.getElementById('boardingScan').value=raw;
            status.textContent='Barcode terdeteksi. Memproses data...';
            stopCameraScanner();
            verifyBoardingPass();
            return;
          }
        }
      }catch(e){}
      loungeCameraLoop=requestAnimationFrame(loop);
    };
    loungeCameraLoop=requestAnimationFrame(loop);
  }catch(err){
    status.textContent='Kamera tidak dapat diakses: '+err.message;
    alert('Akses kamera gagal. Pastikan izin kamera diberikan pada browser.');
  }
}

function stopCameraScanner(){
  if(loungeCameraLoop)cancelAnimationFrame(loungeCameraLoop);
  loungeCameraLoop=null;
  if(loungeCameraStream){
    loungeCameraStream.getTracks().forEach(t=>t.stop());
    loungeCameraStream=null;
  }
  const video=document.getElementById('cameraVideo');
  if(video)video.srcObject=null;
  const status=document.getElementById('cameraStatus');
  if(status)status.textContent='Kamera dihentikan.';
}

function loungeVisitorFiltered(){
  const s=document.getElementById('visitorStart')?.value||'',
        e=document.getElementById('visitorEnd')?.value||'',
        a=document.getElementById('visitorAirport')?.value||'',
        c=document.getElementById('visitorCategory')?.value||'';
  return (data.loungeVisitors||[]).filter(x=>(!s||x.date>=s)&&(!e||x.date<=e)&&(!a||x.airport===a)&&(!c||x.category===c));
}
function renderLoungeVisitors(){
  const rows=loungeVisitorFiltered(),t=document.getElementById('loungeVisitorRows');
  if(!t)return;
  t.innerHTML=rows.map((x,i)=>`<tr><td>${i+1}</td><td>${x.date}</td><td>${x.time}</td><td>${x.name}</td><td>${x.flight}</td><td>${x.seq||'-'}</td><td>${x.airport}</td><td>${x.category}</td></tr>`).join('');
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
  set('visitorCount',rows.length);
  set('visitorBusiness',rows.filter(x=>x.category==='Business Class').length);
  set('visitorTier',rows.filter(x=>x.category!=='Business Class').length);
}
function downloadLoungeVisitorsCSV(){
  let csv='No,Tanggal,Waktu,Nama Penumpang,Flight Number,Sequence Check-in,Airport,Kategori Penumpang\n';
  loungeVisitorFiltered().map(geResolveVisitorLounge).forEach((x,i)=>csv+=`${i+1},${x.date},${x.time},"${x.name}",${x.flight},${x.seq||''},${x.airport},"${x.category}"\n`);
  downloadBlob(csv,'Lounge_Visitor.csv','text/csv;charset=utf-8');
}

window.addEventListener('beforeunload',stopCameraScanner);


/* ==========================================================
   V2.10 — Lounge master, contract expiry, documents, pricing
   ========================================================== */
function currentUserIsAdmin(){
 const s=typeof gxGetSession==='function'?gxGetSession():null;
 return !!(s && typeof gxRoleLevel==='function' && gxRoleLevel(s.role)>=gxRoleLevel('Admin'));
}
function formatIDR(v){
 const n=Number(v||0);
 return n>0?'Rp'+n.toLocaleString('id-ID'):'Belum diisi';
}
function monthsUntil(dateString){
 if(!dateString)return null;
 const end=new Date(dateString+'T23:59:59');
 if(Number.isNaN(end.getTime()))return null;
 const now=new Date();
 return (end-now)/(1000*60*60*24*30.4375);
}
function loungeExpiryClass(x){
 const m=monthsUntil(x.endDate);
 if(m===null)return {row:'',period:'',label:''};
 if(m<0)return {row:'expired-row',period:'',label:'Masa kerja sama telah berakhir'};
 if(m<3)return {row:'',period:'expiry-three',label:'Berakhir kurang dari 3 bulan'};
 if(m<=5)return {row:'expiry-five',period:'',label:'Berakhir dalam 5 bulan'};
 return {row:'',period:'',label:''};
}
function loungePeriodText(x){
 if(x.startDate&&x.endDate){
   const fmt=d=>new Date(d+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
   return fmt(x.startDate)+' - '+fmt(x.endDate);
 }
 return x.period||'-';
}
function renderExpiryWarnings(){
 const box=document.getElementById('loungeExpiryAlert');if(!box)return;
 const expired=(data.lounges||[]).filter(x=>{const m=monthsUntil(x.endDate);return m!==null&&m<0});
 if(!expired.length){box.innerHTML='';return}
 const stations=[...new Set(expired.map(x=>x.airport).filter(Boolean))];
 box.innerHTML=`<div class="lounge-expiry-warning"><b>Warning — Masa Kerja Sama Lounge Telah Berakhir</b>
 <div>Station yang memerlukan tindak lanjut: ${stations.join(', ')}</div>
 <ul>${expired.map(x=>`<li>${x.airport} — ${x.name} (${loungePeriodText(x)})</li>`).join('')}</ul></div>`;
}
function loungeFiltered(){
 const a=document.getElementById('loungeAirportFilter')?.value||'',
       n=(document.getElementById('loungeNameFilter')?.value||'').toLowerCase(),
       s=document.getElementById('loungeStatusFilter')?.value||'';
 return (data.lounges||[]).filter(x=>(!a||x.airport===a)&&(!n||x.name.toLowerCase().includes(n))&&(!s||x.status===s));
}
function renderLounges(){
 const t=document.getElementById('loungeRows');if(!t)return;
 const admin=currentUserIsAdmin();
 renderExpiryWarnings();
 t.innerHTML=loungeFiltered().map((x,i)=>{
   const e=loungeExpiryClass(x);
   const doc=x.documentName
    ? `<button class="btn secondary" onclick="${x.documentKey?`GEFiles.download('${x.documentKey}','${String(x.documentName).replaceAll("'","")}')`:`alert('Lampiran metadata tersedia, tetapi file belum tersimpan pada browser ini.')`}">Unduh</button><small>${x.documentName}</small>`
    : '<span>-</span>';
   const actions=admin?`<td><div class="row-actions">
      <button class="btn secondary" onclick="openLoungeEdit(${x.id})">Update</button>
      <label class="btn secondary" style="cursor:pointer">Upload<input type="file" style="display:none" onchange="uploadLoungeDocument(${x.id},this)"></label>
      <button class="btn btn-danger" onclick="deleteLounge(${x.id})">Hapus</button>
    </div></td>`:'';
   return `<tr class="${e.row}">
    <td>${i+1}</td><td><b>${x.name}</b></td><td>${x.pic||'-'}</td><td><b>${x.airport}</b></td>
    <td><span class="pill">${x.status||'-'}</span></td>
    <td class="${e.period}">${loungePeriodText(x)}${e.label?`<span class="contract-status-note">${e.label}</span>`:''}</td>
    <td class="price-cell">${formatIDR(x.pricePerPax)}</td>
    <td class="document-cell">${doc}</td>${actions}
   </tr>`;
 }).join('');
 if(typeof gxApplyRole==='function')gxApplyRole();
}
async function addLounge(){
 const f=document.getElementById('loungeDocument')?.files?.[0];let key='';
 if(f){key='lounge_'+Date.now();await GEFiles.put(key,f)}
 data.lounges.push({
   id:Date.now(),name:loungeName.value.trim(),pic:loungePIC.value.trim(),
   airport:loungeAirport.value.trim().toUpperCase(),status:loungeStatus.value,
   startDate:loungeStartDate.value,endDate:loungeEndDate.value,
   period:'',pricePerPax:Number(loungePrice.value||0),currency:'IDR',
   documentName:f?.name||'',documentKey:key
 });
 save();loungeForm.reset();fillAirportSelects();renderLounges();alert('Lounge berhasil ditambahkan.');
}
function openLoungeEdit(id){
 if(!currentUserIsAdmin())return;
 const x=data.lounges.find(a=>a.id===id);if(!x)return;
 editLoungeId.value=x.id;editLoungeName.value=x.name||'';editLoungePIC.value=x.pic||'';
 editLoungeAirport.value=x.airport||'';editLoungeStatus.value=x.status||'Aktif';
 editLoungeStartDate.value=x.startDate||'';editLoungeEndDate.value=x.endDate||'';
 editLoungePrice.value=Number(x.pricePerPax||0);
 document.getElementById('loungeEditModal').classList.add('show');
}
function closeLoungeEdit(){document.getElementById('loungeEditModal')?.classList.remove('show')}
async function saveLoungeEdit(){
 if(!currentUserIsAdmin())return;
 const id=Number(editLoungeId.value),x=data.lounges.find(a=>a.id===id);if(!x)return;
 x.name=editLoungeName.value.trim();x.pic=editLoungePIC.value.trim();
 x.airport=editLoungeAirport.value.trim().toUpperCase();x.status=editLoungeStatus.value;
 x.startDate=editLoungeStartDate.value;x.endDate=editLoungeEndDate.value;
 x.pricePerPax=Number(editLoungePrice.value||0);x.currency='IDR';
 const f=editLoungeDocument.files?.[0];
 if(f){const key='lounge_doc_'+Date.now();await GEFiles.put(key,f);x.documentName=f.name;x.documentKey=key}
 save();closeLoungeEdit();fillAirportSelects();renderLounges();alert('Data lounge berhasil diperbarui.');
}
async function uploadLoungeDocument(id,input){
 if(!currentUserIsAdmin())return;
 const f=input.files?.[0];if(!f)return;const x=data.lounges.find(a=>a.id===id);if(!x)return;
 const key='lounge_doc_'+Date.now();await GEFiles.put(key,f);x.documentName=f.name;x.documentKey=key;save();renderLounges();input.value='';alert('Lampiran dokumen berhasil diperbarui.');
}
function deleteLounge(id){
 if(!currentUserIsAdmin())return;
 if(confirm('Hapus lounge ini dari daftar?')){data.lounges=data.lounges.filter(x=>x.id!==id);save();renderLounges();refreshScanLoungeOptions()}
}
function downloadLoungesCSV(){
 let csv='No,Nama Lounge,PIC,Airport,Status,Tanggal Mulai,Tanggal Berakhir,Harga per Pax,Lampiran Dokumen\n';
 loungeFiltered().forEach((x,i)=>csv+=`${i+1},"${x.name}","${x.pic||''}",${x.airport},"${x.status||''}",${x.startDate||''},${x.endDate||''},${Number(x.pricePerPax||0)},"${x.documentName||''}"\n`);
 downloadBlob(csv,'Daftar_Lounge.csv','text/csv;charset=utf-8');
}

/* Lounge Access reference by airport/lounge */
function refreshScanLoungeOptions(){
 const airport=document.getElementById('scanAirport')?.value||'';
 const select=document.getElementById('scanLounge');if(!select)return;
 const rows=(data.lounges||[]).filter(x=>(!airport||x.airport===airport)&&x.status!=='Berakhir');
 select.innerHTML=rows.length?rows.map(x=>`<option value="${x.id}">${x.name}${x.pricePerPax?` — ${formatIDR(x.pricePerPax)}`:''}</option>`).join(''):'<option value="">Belum ada lounge</option>';
}
function fillAirportSelects(){
 const codes=[...new Set([...(data.airports||[]).map(x=>x.code),...(data.lounges||[]).map(x=>x.airport)].filter(Boolean))].sort();
 ['scanAirport','visitorAirport','loungeAirportFilter'].forEach(id=>{
   const e=document.getElementById(id);if(!e)return;
   const wantsAll=id!=='scanAirport';
   e.innerHTML=(wantsAll?'<option value="">Semua Airport</option>':'')+codes.map(x=>`<option>${x}</option>`).join('');
 });
 refreshScanLoungeOptions();
}

/* Override visitor recording to snapshot lounge & price */
function recordEligibleVisitor(category){
 const p=window._eligibleScan;if(!p)return;
 if(isDuplicateVisitor(p)){alert('Visitor tidak direkam karena kombinasi Nama Penumpang + Flight Number + Sequence Check-in sudah ada.');return}
 const now=new Date(),airport=document.getElementById('scanAirport')?.value||'CGK';
 const loungeId=Number(document.getElementById('scanLounge')?.value||0);
 const lounge=(data.lounges||[]).find(x=>x.id===loungeId);
 data.loungeVisitors.push({
   id:Date.now(),date:now.toISOString().slice(0,10),time:now.toTimeString().slice(0,5),
   name:p.name||'Passenger',flight:p.flight||'-',seq:normalizeSeq(p.seq||''),airport,category,
   raw:p.raw||'',source:p.source||'scan',
   loungeId:lounge?.id||'',loungeName:lounge?.name||'-',
   pricePerPax:Number(lounge?.pricePerPax||0),currency:lounge?.currency||'IDR'
 });
 save();closeEligibilityModal();resetLoungeAccess();initDashboard();
 alert('Visitor berhasil direkam sebagai '+category+'.');
}
function loungeVisitorFiltered(){
 const s=document.getElementById('visitorStart')?.value||'',e=document.getElementById('visitorEnd')?.value||'',
       a=document.getElementById('visitorAirport')?.value||'',c=document.getElementById('visitorCategory')?.value||'';
 return (data.loungeVisitors||[]).filter(x=>(!s||x.date>=s)&&(!e||x.date<=e)&&(!a||x.airport===a)&&(!c||x.category===c));
}
function renderLoungeVisitors(){
 geBackfillHistoricalVisitorPrices();
 const rows=loungeVisitorFiltered().map(geResolveVisitorLounge),t=document.getElementById('loungeVisitorRows');if(!t)return;
 t.innerHTML=rows.map((x,i)=>`<tr><td>${i+1}</td><td>${x.date}</td><td>${x.time}</td><td>${x.name}</td><td>${x.flight}</td><td>${x.seq||'-'}</td><td>${x.airport}</td><td>${x.loungeName||'-'}</td><td>${x.category}</td><td class="price-cell">${x.pricePerPax?formatIDR(x.pricePerPax):'Belum diisi'}</td></tr>`).join('');
 const total=rows.reduce((s,x)=>s+Number(x.pricePerPax||0),0);
 const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
 set('visitorCount',rows.length);set('visitorBusiness',rows.filter(x=>x.category==='Business Class').length);set('visitorTier',rows.filter(x=>x.category!=='Business Class').length);
 set('visitorFilteredTotal',rows.length);set('visitorEstimatedCost','Rp'+total.toLocaleString('id-ID'));
}
function downloadLoungeVisitorsCSV(){
 let csv='No,Tanggal,Waktu,Nama Penumpang,Flight Number,Sequence Check-in,Airport,Nama Lounge,Kategori Penumpang,Harga per Pax\n';
 loungeVisitorFiltered().map(geResolveVisitorLounge).forEach((x,i)=>csv+=`${i+1},${x.date},${x.time},"${x.name}",${x.flight},${x.seq||''},${x.airport},"${x.loungeName||''}","${x.category}",${Number(x.pricePerPax||0)}\n`);
 downloadBlob(csv,'Lounge_Visitor.csv','text/csv;charset=utf-8');
}

window.addEventListener('DOMContentLoaded',()=>{fillAirportSelects();renderLounges();renderLoungeVisitors();});



/* ==============================================================
   V2.10.3 — Historical lounge-price resolution
   Existing visitor records are enriched from Lounge Master using:
   Airport/Station + visitor date within cooperation period.
   ============================================================== */
function geDateInsideLoungePeriod(visitorDate,lounge){
  if(!visitorDate)return false;
  const d=new Date(visitorDate+'T12:00:00');
  if(Number.isNaN(d.getTime()))return false;
  const start=lounge.startDate?new Date(lounge.startDate+'T00:00:00'):null;
  const end=lounge.endDate?new Date(lounge.endDate+'T23:59:59'):null;
  if(start && d<start)return false;
  if(end && d>end)return false;
  return !!(start||end);
}
function geResolveVisitorLounge(visitor){
  // Preserve a valid snapshot already recorded at the time of access.
  if(visitor.loungeName && visitor.loungeName!=='-' && visitor.currency && Number(visitor.pricePerPax||0)>0){
    return visitor;
  }
  const matches=(data.lounges||[]).filter(l=>
    String(l.airport||'').toUpperCase()===String(visitor.airport||'').toUpperCase() &&
    geDateInsideLoungePeriod(visitor.date,l)
  );
  if(!matches.length)return visitor;

  // If more than one provider is valid for the same station/date, prefer an explicitly
  // stored lounge id/name. Otherwise only auto-assign when the applicable price is unambiguous.
  let lounge=null;
  if(visitor.loungeId) lounge=matches.find(l=>String(l.id)===String(visitor.loungeId));
  if(!lounge && visitor.loungeName && visitor.loungeName!=='-'){
    lounge=matches.find(l=>String(l.name||'').toLowerCase()===String(visitor.loungeName).toLowerCase());
  }
  if(!lounge){
    const priced=matches.filter(l=>l.currency && Number(l.pricePerPax||0)>0);
    const signatures=[...new Set(priced.map(l=>`${l.currency}|${Number(l.pricePerPax||0)}`))];
    if(signatures.length===1) lounge=priced[0];
    else if(matches.length===1) lounge=matches[0];
  }
  if(!lounge)return visitor;

  visitor.loungeId=lounge.id;
  visitor.loungeName=lounge.name||visitor.loungeName||'-';
  visitor.pricePerPax=Number(lounge.pricePerPax||0);
  visitor.currency=lounge.currency||'';
  visitor.priceDisplay=lounge.priceDisplay||'';
  visitor.priceSource='Lounge Master — period match';
  return visitor;
}
function geBackfillHistoricalVisitorPrices(){
  let changed=false;
  (data.loungeVisitors||[]).forEach(v=>{
    const before=[v.loungeId,v.loungeName,v.pricePerPax,v.currency,v.priceDisplay].join('|');
    geResolveVisitorLounge(v);
    const after=[v.loungeId,v.loungeName,v.pricePerPax,v.currency,v.priceDisplay].join('|');
    if(before!==after)changed=true;
  });
  if(changed)save();
}

/* ==============================================================
   V2.10.1 — Latest Lounge Provider All BO master (uploaded source)
   ============================================================== */
function parsePriceInput(text){
 const s=String(text||'').trim();
 if(!s)return {currency:'',amount:0,display:''};
 const m=s.match(/^([A-Za-z]{3})\s*([\d.,]+)$/);
 if(!m)return {currency:'',amount:0,display:s};
 const currency=m[1].toUpperCase();
 let raw=m[2];
 let amount;
 if(currency==='IDR'||currency==='JPY') amount=Number(raw.replace(/[.,]/g,''));
 else amount=Number(raw.replace(/,/g,''));
 if(!Number.isFinite(amount))amount=0;
 return {currency,amount,display:s};
}
function displayLoungePrice(x){
 return x.priceDisplay || (x.currency&&x.pricePerPax?`${x.currency} ${Number(x.pricePerPax).toLocaleString('en-US')}`:'-');
}
function loungeStartText(x){return x.startDisplay||x.startDate||'-'}
function loungeEndText(x){return x.endDisplay||x.endDate||'-'}

function loungeFiltered(){
 const region=document.getElementById('loungeRegionFilter')?.value||'';
 const station=document.getElementById('loungeAirportFilter')?.value||'';
 const q=(document.getElementById('loungeNameFilter')?.value||'').toLowerCase();
 const status=document.getElementById('loungeStatusFilter')?.value||'';
 return (data.lounges||[]).filter(x=>
  (!region||x.region===region)&&
  (!station||x.airport===station)&&
  (!q||String(x.name||'').toLowerCase().includes(q))&&
  (!status||x.documentStatus===status)
 );
}
function populateLoungeMasterFilters(){
 const sf=document.getElementById('loungeStatusFilter');
 if(sf){
  const cur=sf.value;
  const sts=[...new Set((data.lounges||[]).map(x=>x.documentStatus).filter(Boolean))].sort();
  sf.innerHTML='<option value="">Semua Status Dokumen</option>'+sts.map(x=>`<option>${x}</option>`).join('');
  sf.value=cur;
 }
}
function renderExpiryWarnings(){
 const box=document.getElementById('loungeExpiryAlert');if(!box)return;
 const expired=(data.lounges||[]).filter(x=>{const m=monthsUntil(x.endDate);return m!==null&&m<0});
 if(!expired.length){box.innerHTML='';return}
 const stations=[...new Set(expired.map(x=>x.airport).filter(Boolean))];
 box.innerHTML=`<div class="lounge-expiry-warning compact">
  <b>Warning — Masa Kerja Sama Lounge Telah Berakhir</b>
  <div>Station: ${stations.join(', ')}</div>
 </div>`;
}
function renderLounges(){
 const t=document.getElementById('loungeRows');if(!t)return;
 populateLoungeMasterFilters();renderExpiryWarnings();
 const admin=currentUserIsAdmin();
 t.innerHTML=loungeFiltered().map((x,i)=>{
  const e=loungeExpiryClass(x);
  const doc=x.documentName
   ? `<button class="btn secondary" onclick="${x.documentKey?`GEFiles.download('${x.documentKey}','${String(x.documentName).replaceAll("'","")}')`:`alert('Lampiran file belum tersimpan pada browser ini.')`}">Unduh</button><small>${x.documentName}</small>`
   : '<span>-</span>';
  const statusClass=String(x.documentStatus||'').toLowerCase().includes('tidak')||String(x.documentStatus||'').toLowerCase().includes('invalid')?'doc-status-invalid':'';
  const actions=admin?`<td><div class="row-actions">
    <button class="btn secondary" onclick="openLoungeEdit(${x.id})">Update</button>
    <label class="btn secondary" style="cursor:pointer">Upload<input type="file" style="display:none" onchange="uploadLoungeDocument(${x.id},this)"></label>
    <button class="btn btn-danger" onclick="deleteLounge(${x.id})">Hapus</button>
   </div></td>`:'';
  return `<tr class="${e.row}">
   <td>${x.no??i+1}</td>
   <td>${x.region||'-'}</td>
   <td><b>${x.airport||'-'}</b></td>
   <td><b>${x.name||'-'}</b></td>
   <td>${x.serviceCategory||'Lounge'}</td>
   <td class="price-cell">${displayLoungePrice(x)}</td>
   <td>${loungeStartText(x)}</td>
   <td class="${e.period}">${loungeEndText(x)}${e.label?`<span class="contract-status-note">${e.label}</span>`:''}</td>
   <td>${x.documentNumber||'-'}</td>
   <td>${x.documentType||'-'}</td>
   <td class="${statusClass}">${x.documentStatus||'-'}</td>
   <td>${x.remarks||'-'}</td>
   <td class="document-cell">${doc}</td>
   ${actions}
  </tr>`;
 }).join('');
 if(typeof gxApplyRole==='function')gxApplyRole();
}

async function addLounge(){
 const f=document.getElementById('loungeDocument')?.files?.[0];let key='';
 if(f){key='lounge_'+Date.now();await GEFiles.put(key,f)}
 const price=parsePriceInput(loungePriceDisplay.value);
 const start=loungeStartDate.value,end=loungeEndDate.value;
 data.lounges.push({
  id:Date.now(),no:'',region:loungeRegion.value,airport:loungeAirport.value.trim().toUpperCase(),
  name:loungeName.value.trim(),serviceCategory:loungeCategory.value.trim()||'Lounge',
  pricePerPax:price.amount,currency:price.currency,priceDisplay:price.display,
  startDate:start,startDisplay:start,endDate:end,endDisplay:end,
  documentNumber:loungeDocumentNumber.value.trim(),documentType:loungeDocumentType.value.trim(),
  documentStatus:loungeDocumentStatus.value.trim(),remarks:loungeRemarks.value.trim(),
  documentName:f?.name||'',documentKey:key
 });
 save();loungeForm.reset();fillAirportSelects();renderLounges();refreshScanLoungeOptions();
 alert('Lounge berhasil ditambahkan.');
}
function openLoungeEdit(id){
 if(!currentUserIsAdmin())return;
 const x=data.lounges.find(a=>a.id===id);if(!x)return;
 editLoungeId.value=x.id;editLoungeRegion.value=x.region||'WEST';editLoungeAirport.value=x.airport||'';
 editLoungeName.value=x.name||'';editLoungeCategory.value=x.serviceCategory||'Lounge';
 editLoungePriceDisplay.value=x.priceDisplay||'';editLoungeStartDate.value=x.startDate||'';
 editLoungeEndDate.value=x.endDate||'';editLoungeDocumentNumber.value=x.documentNumber||'';
 editLoungeDocumentType.value=x.documentType||'';editLoungeDocumentStatus.value=x.documentStatus||'';
 editLoungeRemarks.value=x.remarks||'';
 document.getElementById('loungeEditModal').classList.add('show');
}
async function saveLoungeEdit(){
 if(!currentUserIsAdmin())return;
 const id=Number(editLoungeId.value),x=data.lounges.find(a=>a.id===id);if(!x)return;
 const price=parsePriceInput(editLoungePriceDisplay.value);
 x.region=editLoungeRegion.value;x.airport=editLoungeAirport.value.trim().toUpperCase();
 x.name=editLoungeName.value.trim();x.serviceCategory=editLoungeCategory.value.trim()||'Lounge';
 x.pricePerPax=price.amount;x.currency=price.currency;x.priceDisplay=price.display;
 x.startDate=editLoungeStartDate.value;x.startDisplay=x.startDate;
 x.endDate=editLoungeEndDate.value;x.endDisplay=x.endDate;
 x.documentNumber=editLoungeDocumentNumber.value.trim();x.documentType=editLoungeDocumentType.value.trim();
 x.documentStatus=editLoungeDocumentStatus.value.trim();x.remarks=editLoungeRemarks.value.trim();
 const f=editLoungeDocument.files?.[0];
 if(f){const key='lounge_doc_'+Date.now();await GEFiles.put(key,f);x.documentName=f.name;x.documentKey=key}
 save();closeLoungeEdit();fillAirportSelects();renderLounges();refreshScanLoungeOptions();
 alert('Data lounge berhasil diperbarui.');
}
function downloadLoungesCSV(){
 let csv='No,Region,Station,Lounge Provider,Kategori Layanan,Harga Per Pax,Mulai,Berakhir,Nomor Dokumen,Jenis,Status Dokumen,Remarks,Lampiran Dokumen\n';
 loungeFiltered().forEach((x,i)=>csv+=`${x.no??i+1},"${x.region||''}","${x.airport||''}","${String(x.name||'').replaceAll('"','""')}","${x.serviceCategory||''}","${String(displayLoungePrice(x)).replaceAll('"','""')}","${loungeStartText(x)}","${loungeEndText(x)}","${String(x.documentNumber||'').replaceAll('"','""')}","${String(x.documentType||'').replaceAll('"','""')}","${String(x.documentStatus||'').replaceAll('"','""')}","${String(x.remarks||'').replaceAll('"','""')}","${String(x.documentName||'').replaceAll('"','""')}"\n`);
 downloadBlob(csv,'Daftar_Lounge_Provider_All_BO.csv','text/csv;charset=utf-8');
}

function refreshScanLoungeOptions(){
 const airport=document.getElementById('scanAirport')?.value||'';
 const select=document.getElementById('scanLounge');if(!select)return;
 const rows=(data.lounges||[]).filter(x=>!airport||x.airport===airport);
 select.innerHTML=rows.length?rows.map(x=>`<option value="${x.id}">${x.name} — ${displayLoungePrice(x)}</option>`).join(''):'<option value="">Belum ada lounge</option>';
}

/* Multi-currency estimate: do not combine currencies without FX conversion. */
function renderLoungeVisitors(){
 geBackfillHistoricalVisitorPrices();
 const rows=loungeVisitorFiltered().map(geResolveVisitorLounge),t=document.getElementById('loungeVisitorRows');if(!t)return;
 t.innerHTML=rows.map((x,i)=>`<tr>
  <td>${i+1}</td><td>${x.date}</td><td>${x.time}</td><td>${x.name}</td><td>${x.flight}</td><td>${x.seq||'-'}</td>
  <td>${x.airport}</td><td>${x.loungeName||'-'}</td><td>${x.category}</td>
  <td class="price-cell">${x.priceDisplay||((x.currency&&x.pricePerPax)?`${x.currency} ${Number(x.pricePerPax).toLocaleString('en-US')}`:'Belum diisi')}</td>
 </tr>`).join('');

 const totals={};
 rows.forEach(x=>{
  const cur=x.currency||'';
  const val=Number(x.pricePerPax||0);
  if(cur&&val)totals[cur]=(totals[cur]||0)+val;
 });
 const totalText=Object.keys(totals).length
   ? Object.entries(totals).map(([c,v])=>`${c} ${v.toLocaleString(c==='IDR'?'id-ID':'en-US')}`).join(' • ')
   : 'Belum tersedia';

 const costBox=document.getElementById('visitorEstimatedCost');
 if(costBox){
   costBox.innerHTML=Object.keys(totals).length
    ? Object.entries(totals).map(([c,v])=>`<span class="currency-total"><small>${c}</small><strong>${v.toLocaleString(c==='IDR'?'id-ID':'en-US')}</strong></span>`).join('')
    : '<span class="currency-total empty"><strong>Belum tersedia</strong></span>';
 }
 const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
 set('visitorCount',rows.length);set('visitorBusiness',rows.filter(x=>x.category==='Business Class').length);
 set('visitorTier',rows.filter(x=>x.category!=='Business Class').length);
 set('visitorFilteredTotal',rows.length);
}
function recordEligibleVisitor(category){
 const p=window._eligibleScan;if(!p)return;
 if(isDuplicateVisitor(p)){alert('Visitor tidak direkam karena kombinasi Nama Penumpang + Flight Number + Sequence Check-in sudah ada.');return}
 const now=new Date(),airport=document.getElementById('scanAirport')?.value||'CGK';
 const loungeId=Number(document.getElementById('scanLounge')?.value||0);
 const lounge=(data.lounges||[]).find(x=>x.id===loungeId);
 data.loungeVisitors.push({
  id:Date.now(),date:now.toISOString().slice(0,10),time:now.toTimeString().slice(0,5),
  name:p.name||'Passenger',flight:p.flight||'-',seq:normalizeSeq(p.seq||''),airport,category,
  raw:p.raw||'',source:p.source||'scan',
  loungeId:lounge?.id||'',loungeName:lounge?.name||'-',
  pricePerPax:Number(lounge?.pricePerPax||0),currency:lounge?.currency||'',
  priceDisplay:lounge?.priceDisplay||''
 });
 save();closeEligibilityModal();resetLoungeAccess();initDashboard();
 alert('Visitor berhasil direkam sebagai '+category+'.');
}
function downloadLoungeVisitorsCSV(){
 let csv='No,Tanggal,Waktu,Nama Penumpang,Flight Number,Sequence Check-in,Airport,Nama Lounge,Kategori Penumpang,Harga per Pax\n';
 loungeVisitorFiltered().map(geResolveVisitorLounge).forEach((x,i)=>csv+=`${i+1},${x.date},${x.time},"${x.name}",${x.flight},${x.seq||''},${x.airport},"${String(x.loungeName||'').replaceAll('"','""')}","${x.category}","${String(x.priceDisplay||'').replaceAll('"','""')}"\n`);
 downloadBlob(csv,'Lounge_Visitor.csv','text/csv;charset=utf-8');
}
window.addEventListener('DOMContentLoaded',()=>{geBackfillHistoricalVisitorPrices();populateLoungeMasterFilters();renderLounges();refreshScanLoungeOptions();renderLoungeVisitors();});


/* ==============================================================
   V2.10.2 — Universal table controls
   Every table: 10 / 20 / 50 rows + clickable sortable headers.
   The displayed "No" value stays attached to its original row.
   ============================================================== */
const GETableState = new WeakMap();

function geComparable(text){
  const s=String(text??'').trim();
  const normalized=s.replace(/\s+/g,' ');
  if(/^[-+]?\d+(?:[.,]\d+)?%?$/.test(normalized)){
    return {type:'number', value:Number(normalized.replace('%','').replace(',','.'))};
  }
  const idDate=normalized.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if(idDate)return {type:'number',value:new Date(+idDate[3],+idDate[2]-1,+idDate[1]).getTime()};
  const iso=normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(iso)return {type:'number',value:new Date(+iso[1],+iso[2]-1,+iso[3]).getTime()};
  const currency=normalized.match(/^(IDR|USD|SGD|AUD|JPY|CNY|SAR|MYR)\s*([\d.,]+)/i);
  if(currency)return {type:'number',value:Number(currency[2].replace(/[.,]/g,''))};
  return {type:'text',value:normalized.toLocaleLowerCase('id-ID')};
}
function geCompare(a,b){
  if(a.type==='number'&&b.type==='number')return a.value-b.value;
  return String(a.value).localeCompare(String(b.value),'id',{numeric:true,sensitivity:'base'});
}
function geTableApply(table){
  const state=GETableState.get(table); if(!state)return;
  const tbody=table.tBodies[0]; if(!tbody)return;
  const rows=[...tbody.rows];
  const total=rows.length;
  const pages=Math.max(1,Math.ceil(total/state.size));
  state.page=Math.min(state.page,pages);
  const start=(state.page-1)*state.size, end=start+state.size;
  rows.forEach((r,i)=>r.style.display=(i>=start&&i<end)?'':'none');

  const from=total?start+1:0, to=Math.min(end,total);
  state.info.textContent=`Menampilkan ${from}–${to} dari ${total} data`;
  state.pageInfo.textContent=`Halaman ${state.page} / ${pages}`;
  state.prev.disabled=state.page<=1;
  state.next.disabled=state.page>=pages;
}
function geTableSort(table,col,th){
  const state=GETableState.get(table); if(!state)return;
  const tbody=table.tBodies[0]; if(!tbody)return;
  const dir=(state.sortCol===col && state.sortDir==='asc')?'desc':'asc';
  state.sortCol=col; state.sortDir=dir; state.page=1;
  [...table.tHead.querySelectorAll('th')].forEach(h=>{h.classList.remove('sort-asc','sort-desc');h.removeAttribute('aria-sort')});
  th.classList.add(dir==='asc'?'sort-asc':'sort-desc');
  th.setAttribute('aria-sort',dir==='asc'?'ascending':'descending');

  const rows=[...tbody.rows].map((row,idx)=>({row,idx,key:geComparable(row.cells[col]?.innerText||'')}));
  rows.sort((a,b)=>{const c=geCompare(a.key,b.key); return (c===0?a.idx-b.idx:c)*(dir==='asc'?1:-1)});
  state.muting=true;
  rows.forEach(x=>tbody.appendChild(x.row));
  state.muting=false;
  geTableApply(table);
}
function geEnhanceTable(table){
  if(GETableState.has(table) || !table.tHead || !table.tBodies.length)return;
  const wrap=table.closest('.table-scroll,.card')||table.parentElement;
  const controls=document.createElement('div');
  controls.className='table-controls';
  controls.innerHTML=`<div class="table-size-control"><span>Tampilkan</span>
    <select aria-label="Jumlah data per halaman"><option>10</option><option>20</option><option>50</option></select>
    <span>data</span></div>
    <div class="table-page-control"><span class="table-info"></span>
      <button type="button" class="table-page-btn prev" aria-label="Halaman sebelumnya">‹</button>
      <span class="table-page-info"></span>
      <button type="button" class="table-page-btn next" aria-label="Halaman berikutnya">›</button>
    </div>`;
  wrap.insertBefore(controls,table);

  const state={
    size:10,page:1,sortCol:null,sortDir:null,muting:false,
    info:controls.querySelector('.table-info'),
    pageInfo:controls.querySelector('.table-page-info'),
    prev:controls.querySelector('.prev'),
    next:controls.querySelector('.next')
  };
  GETableState.set(table,state);
  controls.querySelector('select').addEventListener('change',e=>{state.size=Number(e.target.value);state.page=1;geTableApply(table)});
  state.prev.addEventListener('click',()=>{if(state.page>1){state.page--;geTableApply(table)}});
  state.next.addEventListener('click',()=>{state.page++;geTableApply(table)});

  [...table.tHead.querySelectorAll('th')].forEach((th,col)=>{
    th.classList.add('sortable-th');
    th.tabIndex=0;
    th.title='Klik untuk mengurutkan data';
    th.addEventListener('click',()=>geTableSort(table,col,th));
    th.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();geTableSort(table,col,th)}});
  });

  const obs=new MutationObserver(()=>{
    if(state.muting)return;
    state.page=1;
    requestAnimationFrame(()=>geTableApply(table));
  });
  obs.observe(table.tBodies[0],{childList:true});
  geTableApply(table);
}
function geEnhanceAllTables(){
  document.querySelectorAll('table').forEach(geEnhanceTable);
}
window.addEventListener('DOMContentLoaded',()=>{
  setTimeout(geEnhanceAllTables,0);
  const pageObserver=new MutationObserver(()=>geEnhanceAllTables());
  pageObserver.observe(document.body,{childList:true,subtree:true});
});


/* ==============================================================
   V2.10.5 — Lounge Access categories + required eligibility ref
             Lounge Visitor Admin/Super Admin update/delete
   ============================================================== */
const GE_LOUNGE_CATEGORIES=[
  'Business Class','Platinum','Elite Plus','Gold Privilege',
  'Elite','GPS','Kerjasama MPA','EMD'
];
const GE_REFERENCE_REQUIRED=new Set([
  'Platinum','Elite Plus','Gold Privilege','Elite','GPS','Kerjasama MPA','EMD'
]);

function geCurrentUserCanManageVisitors(){
  const s=(typeof gxGetSession==='function')?gxGetSession():window.GX_CURRENT_USER;
  return !!s && (s.role==='Admin'||s.role==='Super Admin');
}
function geReferenceLabel(category){
  if(category==='Kerjasama MPA')return 'Nama Maskapai / Mitra';
  if(category==='EMD')return 'Nomor EMD';
  if(GE_REFERENCE_REQUIRED.has(category))return 'Nomor Member';
  return 'Referensi Eligibility';
}
function geEligibilityCategoryChanged(){
  const category=document.getElementById('eligibleCategory')?.value||'';
  const wrap=document.getElementById('eligibilityReferenceWrap');
  const input=document.getElementById('eligibilityReference');
  const label=document.getElementById('eligibilityReferenceLabel');
  if(!wrap||!input||!label)return;
  const required=GE_REFERENCE_REQUIRED.has(category);
  wrap.style.display=required?'block':'none';
  input.required=required;
  label.textContent=geReferenceLabel(category);
  input.placeholder=category==='Kerjasama MPA'?'Contoh: Malaysia Airlines':
                    category==='EMD'?'Masukkan Nomor EMD':'Masukkan Nomor Member';
  if(!required)input.value='';
}
function prepareEligibleConfirmation(parsed){
  window._eligibleScan=parsed;
  const duplicate=isDuplicateVisitor(parsed);
  const body=document.getElementById('eligibilityModalBody');
  body.innerHTML=`<div class="eligibility-result eligible"><div class="status-icon">✓</div><h2>Eligible</h2>
    <p>Konfirmasi data penumpang sebelum visitor direkam.</p>
    <div class="preview-grid">
      <div class="preview-item"><span>Nama Penumpang</span><b>${parsed.name||'-'}</b></div>
      <div class="preview-item"><span>Flight Number</span><b>${parsed.flight||'-'}</b></div>
      <div class="preview-item"><span>Sequence</span><b>${parsed.seq||'-'}</b></div>
      <div class="preview-item"><span>Sumber</span><b>${parsed.source==='manual'?'Manual':'Scan'}</b></div>
    </div>
    ${duplicate?'<div class="duplicate-warning"><b>Duplikat terdeteksi.</b><br>Nama penumpang + Flight Number + Sequence Check-in sudah pernah direkam. Data tidak dapat direkam kembali.</div>':`
      <div class="eligibility-confirm-form">
        <label>Kategori Penumpang
          <select id="eligibleCategory" onchange="geEligibilityCategoryChanged()">
            <option value="">Pilih Kategori</option>
            ${GE_LOUNGE_CATEGORIES.map(x=>`<option value="${x}">${x}</option>`).join('')}
          </select>
        </label>
        <label id="eligibilityReferenceWrap" style="display:none">
          <span id="eligibilityReferenceLabel">Referensi Eligibility</span>
          <input id="eligibilityReference" autocomplete="off">
          <small>Wajib diisi untuk kategori yang memerlukan validasi membership, partnership, atau EMD.</small>
        </label>
        <div class="confirm-actions">
          <button class="btn" onclick="recordEligibleVisitor()">Konfirmasi & Rekam Visitor</button>
          <button class="btn secondary" onclick="closeEligibilityModal()">Batal</button>
        </div>
      </div>`}
  </div>`;
  document.getElementById('eligibilityModal').classList.add('show');
}
function recordEligibleVisitor(categoryArg){
  const p=window._eligibleScan;if(!p)return;
  if(isDuplicateVisitor(p)){
    alert('Visitor tidak direkam karena kombinasi Nama Penumpang + Flight Number + Sequence Check-in sudah ada.');
    return;
  }
  const category=categoryArg||document.getElementById('eligibleCategory')?.value||'';
  if(!GE_LOUNGE_CATEGORIES.includes(category)){
    alert('Pilih kategori penumpang terlebih dahulu.');
    document.getElementById('eligibleCategory')?.focus();
    return;
  }
  const ref=(document.getElementById('eligibilityReference')?.value||'').trim();
  if(GE_REFERENCE_REQUIRED.has(category) && !ref){
    alert(`${geReferenceLabel(category)} wajib diisi untuk kategori ${category}.`);
    document.getElementById('eligibilityReference')?.focus();
    return;
  }

  const now=new Date(),airport=document.getElementById('scanAirport')?.value||'CGK';
  const loungeId=Number(document.getElementById('scanLounge')?.value||0);
  const lounge=(data.lounges||[]).find(x=>x.id===loungeId);
  data.loungeVisitors.push({
    id:Date.now(),date:now.toISOString().slice(0,10),time:now.toTimeString().slice(0,5),
    name:p.name||'Passenger',flight:p.flight||'-',seq:normalizeSeq(p.seq||''),airport,category,
    eligibilityReference:ref,
    raw:p.raw||'',source:p.source||'scan',
    loungeId:lounge?.id||'',loungeName:lounge?.name||'-',
    pricePerPax:Number(lounge?.pricePerPax||0),currency:lounge?.currency||'',
    priceDisplay:lounge?.priceDisplay||''
  });
  save();closeEligibilityModal();resetLoungeAccess();initDashboard();
  alert('Visitor berhasil direkam sebagai '+category+'.');
}

function geVisitorEdit(id){
  if(!geCurrentUserCanManageVisitors())return alert('Hanya Super Admin dan Admin yang dapat memperbarui data Lounge Visitor.');
  const x=(data.loungeVisitors||[]).find(v=>String(v.id)===String(id));if(!x)return;
  const name=prompt('Nama Penumpang:',x.name||''); if(name===null)return;
  const flight=prompt('Flight Number:',x.flight||''); if(flight===null)return;
  const seq=prompt('Sequence Check-in:',x.seq||''); if(seq===null)return;
  const airport=prompt('Airport:',x.airport||''); if(airport===null)return;
  const category=prompt('Kategori Penumpang:\n'+GE_LOUNGE_CATEGORIES.join(' / '),x.category||''); if(category===null)return;
  if(!GE_LOUNGE_CATEGORIES.includes(category.trim())){
    alert('Kategori tidak valid. Gunakan salah satu kategori yang tersedia.');return;
  }
  let ref=x.eligibilityReference||'';
  if(GE_REFERENCE_REQUIRED.has(category.trim())){
    const entered=prompt(geReferenceLabel(category.trim())+':',ref);
    if(entered===null)return;
    if(!entered.trim()){alert(geReferenceLabel(category.trim())+' wajib diisi.');return}
    ref=entered.trim();
  }else ref='';

  x.name=name.trim()||x.name;
  x.flight=flight.trim().toUpperCase()||x.flight;
  x.seq=normalizeSeq(seq.trim());
  x.airport=airport.trim().toUpperCase()||x.airport;
  x.category=category.trim();
  x.eligibilityReference=ref;
  save();renderLoungeVisitors();initDashboard();
  alert('Data Lounge Visitor berhasil diperbarui.');
}
function geVisitorDelete(id){
  if(!geCurrentUserCanManageVisitors())return alert('Hanya Super Admin dan Admin yang dapat menghapus data Lounge Visitor.');
  const x=(data.loungeVisitors||[]).find(v=>String(v.id)===String(id));if(!x)return;
  if(!confirm(`Hapus data visitor ${x.name||''} / ${x.flight||''} / ${x.seq||'-'}?`))return;
  data.loungeVisitors=(data.loungeVisitors||[]).filter(v=>String(v.id)!==String(id));
  save();renderLoungeVisitors();initDashboard();
}

function renderLoungeVisitors(){
 geBackfillHistoricalVisitorPrices();
 const rows=loungeVisitorFiltered().map(geResolveVisitorLounge),t=document.getElementById('loungeVisitorRows');if(!t)return;
 const canManage=geCurrentUserCanManageVisitors();
 t.innerHTML=rows.map((x,i)=>`<tr>
  <td>${i+1}</td><td>${x.date}</td><td>${x.time}</td><td>${x.name}</td><td>${x.flight}</td><td>${x.seq||'-'}</td>
  <td>${x.airport}</td><td>${x.loungeName||'-'}</td><td>${x.category}</td>
  <td>${x.eligibilityReference||'-'}</td>
  <td class="price-cell">${x.priceDisplay||((x.currency&&x.pricePerPax)?`${x.currency} ${Number(x.pricePerPax).toLocaleString('en-US')}`:'Belum diisi')}</td>
  ${canManage?`<td class="visitor-actions"><button class="btn secondary compact-btn" onclick="geVisitorEdit('${x.id}')">Update</button><button class="btn danger compact-btn" onclick="geVisitorDelete('${x.id}')">Hapus</button></td>`:''}
 </tr>`).join('');

 const totals={};
 rows.forEach(x=>{const cur=x.currency||'',val=Number(x.pricePerPax||0);if(cur&&val)totals[cur]=(totals[cur]||0)+val});
 const costBox=document.getElementById('visitorEstimatedCost');
 if(costBox)costBox.innerHTML=Object.keys(totals).length
   ? Object.entries(totals).map(([c,v])=>`<span class="currency-total"><small>${c}</small><strong>${v.toLocaleString(c==='IDR'?'id-ID':'en-US')}</strong></span>`).join('')
   : '<span class="currency-total empty"><strong>Belum tersedia</strong></span>';
 const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
 set('visitorCount',rows.length);
 set('visitorBusiness',rows.filter(x=>x.category==='Business Class').length);
 set('visitorTier',rows.filter(x=>x.category!=='Business Class').length);
 set('visitorFilteredTotal',rows.length);
 if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}
function downloadLoungeVisitorsCSV(){
 let csv='No,Tanggal,Waktu,Nama Penumpang,Flight Number,Sequence Check-in,Airport,Nama Lounge,Kategori Penumpang,Referensi Eligibility,Harga per Pax\n';
 loungeVisitorFiltered().map(geResolveVisitorLounge).forEach((x,i)=>csv+=`${i+1},${x.date},${x.time},"${String(x.name||'').replaceAll('"','""')}",${x.flight},${x.seq||''},${x.airport},"${String(x.loungeName||'').replaceAll('"','""')}","${x.category}","${String(x.eligibilityReference||'').replaceAll('"','""')}","${String(x.priceDisplay||'').replaceAll('"','""')}"\n`);
 downloadBlob(csv,'Lounge_Visitor.csv','text/csv;charset=utf-8');
}


/* ==============================================================
   V2.11 — Account & Access Management + professional visitor modal
   ============================================================== */
const GE_TAB_OPTIONS=[
 ['home','Beranda'],['services','Layanan Garuda Indonesia'],['initiatives','Kegiatan & Inisiatif'],
 ['lounge-access','Lounge Access'],['lounge-visitor','Lounge Visitor'],['lounge-list','Daftar Lounge'],['planning','Planning Workspace'],
 ['data','Data'],['news','Berita & Informasi'],['contact','Hubungi Kami'],['admin','Admin / Pengelola']
];

function geSession(){return typeof gxGetSession==='function'?gxGetSession():window.GX_CURRENT_USER}
function geCanManageAccounts(){return typeof gxHasUserManagementPermission==='function'?gxHasUserManagementPermission():typeof gxCanManage==='function'?gxCanManage():false}
function geVisibleAirports(){
 const allowed=typeof gxAllowedAirports==='function'?gxAllowedAirports():[];
 return allowed.length?allowed:[...new Set([...(data.airports||[]).map(x=>x.code),...(data.lounges||[]).map(x=>x.airport)].filter(Boolean))].sort();
}
function geVisibleLoungeRows(){
 const s=geSession();
 return (data.lounges||[]).filter(x=>{
   if(!s||['Admin','Super Admin'].includes(s.role)||s.scopeType==='ALL')return true;
   if(s.role==='Lounge Staff')return typeof gxLoungeAllowed==='function'?gxLoungeAllowed(x.id,x.airport):false;
   return typeof gxAirportAllowed==='function'?gxAirportAllowed(x.airport):true;
 });
}

/* Account manager */
function userDefaultTabs(role){
 if(role==='Super Admin'||role==='Admin')return['ALL'];
 if(role==='Management')return['home','services','initiatives','planning','news'];
 if(role==='Head Office')return['home','services','initiatives','planning','data','news'];
 if(role==='Branch Office')return['home','services','initiatives','lounge-list','lounge-visitor','data','news'];
 if(role==='Lounge Staff')return['lounge-access','lounge-visitor'];
 return['home','services','initiatives','data','news'];
}
function renderUserTabsChecklist(selected=[]){
 const box=document.getElementById('userTabsChecklist');if(!box)return;
 const role=document.getElementById('userRole')?.value||'Staff';
 const locked=role==='Super Admin'||role==='Admin'||role==='Lounge Staff';
 const values=selected.length?selected:userDefaultTabs(role);
 box.innerHTML=GE_TAB_OPTIONS.map(([v,label])=>`<label class="tab-check"><input type="checkbox" value="${v}" ${values.includes('ALL')||values.includes(v)?'checked':''} ${locked?'disabled':''}><span>${label}</span></label>`).join('');
}
function fillUserLoungeOptions(selected=[]){
 const e=document.getElementById('userLoungeIds');if(!e)return;
 e.innerHTML=(data.lounges||[]).map(x=>`<option value="${x.id}" ${selected.map(String).includes(String(x.id))?'selected':''}>${x.airport} — ${x.name}</option>`).join('');
}
function userRoleChanged(){
 const role=document.getElementById('userRole')?.value||'Staff';
 document.getElementById('userAirportScopeWrap').style.display=['Branch Office','Lounge Staff'].includes(role)?'block':'none';
 document.getElementById('userLoungeScopeWrap').style.display=role==='Lounge Staff'?'block':'none';
 renderUserTabsChecklist(userDefaultTabs(role));
}
function geFirebaseUserMap(users){
 return (users||[]).map(u=>({
   ...u,
   id:String(u.id),
   airports:Array.isArray(u.airports)?u.airports:[],
   loungeIds:Array.isArray(u.loungeIds)?u.loungeIds:[],
   tabs:Array.isArray(u.tabs)?u.tabs:[]
 }));
}
async function syncFirebaseUsers(){
 window.GE_FIREBASE_USERS_STATE='loading';
 window.GE_FIREBASE_USERS_ERROR='';
 renderUserAccounts();
 try{
   // Authoritative source: root Firestore /users collection. Never seed this page from data.js/local sample users.
   if(window.GXFirebase?.init) await window.GXFirebase.init();
   const db=window.GXFirebase?.state?.db;
   if(!db) throw new Error('Firestore runtime belum siap.');
   const snap=await db.collection('users').get();
   const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
   data.users=geFirebaseUserMap(rows).sort((a,b)=>String(a.name||a.username||a.email||'').localeCompare(String(b.name||b.username||b.email||''),'id'));
   window.GE_FIREBASE_USERS_STATE='ready';
   renderUserAccounts();
 }catch(directError){
   // Keep the existing authorized Netlify endpoint only as a transport fallback to the SAME root /users collection.
   try{
     if(typeof gxApi!=='function') throw directError;
     const r=await gxApi('/auth-list-users',{method:'GET'});
     if(!Array.isArray(r.users)) throw directError;
     data.users=geFirebaseUserMap(r.users).sort((a,b)=>String(a.name||a.username||a.email||'').localeCompare(String(b.name||b.username||b.email||''),'id'));
     window.GE_FIREBASE_USERS_STATE='ready';
     renderUserAccounts();
   }catch(e){
     window.GE_FIREBASE_USERS_STATE='error';
     window.GE_FIREBASE_USERS_ERROR=e?.message||directError?.message||String(e);
     console.warn('Firestore user sync failed:', window.GE_FIREBASE_USERS_ERROR);
     renderUserAccounts();
   }
 }
}
function setPasswordFields(mode){
 const p=document.getElementById('userPassword'),c=document.getElementById('userPasswordConfirm');
 if(!p||!c)return;
 const isCreate=mode==='create';
 p.required=isCreate;c.required=isCreate;
 p.value='';c.value='';
 p.closest('label').style.display=isCreate?'':'none';
 c.closest('label').style.display=isCreate?'':'none';
}
function openUserModal(id=null){
 if(!geCanManageAccounts())return;
 const modal=document.getElementById('userAccountModal');if(!modal)return;
 const u=id?(data.users||[]).find(x=>String(x.id)===String(id)):null;
 document.getElementById('userModalTitle').textContent=u?'Edit Akun':'Tambah Akun';
 userEditId.value=u?.id||'';userFullName.value=u?.name||'';userEmployeeNo.value=u?.employeeNo||'';
 userUsername.value=u?.username||'';userUsername.readOnly=!!u;
 userEmail.value=u?.email||'';userEmail.readOnly=!!u;
 setPasswordFields(u?'edit':'create');
 userRole.value=u?.role||'Staff';userUnit.value=u?.unit||'';userStatus.value=u?.status||'Active';
 userAirports.value=(u?.airports||[]).join(', ');
 fillUserLoungeOptions(u?.loungeIds||[]);
 renderUserTabsChecklist(u?.tabs||userDefaultTabs(userRole.value));
 userRoleChanged();
 if(u){fillUserLoungeOptions(u.loungeIds||[]);renderUserTabsChecklist(u.tabs||[])}
 modal.classList.add('show');
}
function closeUserModal(){document.getElementById('userAccountModal')?.classList.remove('show')}
async function saveUserAccount(){
 if(!geCanManageAccounts()||typeof gxApi!=='function')return;
 const id=String(userEditId.value||'');
 const username=userUsername.value.trim().toLowerCase();
 const role=userRole.value;
 let tabs;
 if(role==='Super Admin'||role==='Admin')tabs=['ALL'];
 else if(role==='Lounge Staff')tabs=['lounge-access','lounge-visitor'];
 else tabs=[...document.querySelectorAll('#userTabsChecklist input:checked')].map(x=>x.value);
 if(!tabs.length){alert('Pilih minimal satu TAB yang dapat diakses.');return}
 const airports=userAirports.value.split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);
 const loungeIds=[...userLoungeIds.selectedOptions].map(x=>String(x.value));
 const scopeType=role==='Super Admin'||role==='Admin'||role==='Management'?'ALL':role==='Branch Office'?'STATION':role==='Lounge Staff'?'LOUNGE':role==='Head Office'?'MULTI_STATION':'CUSTOM';
 if(['Branch Office','Head Office'].includes(role)&&!airports.length){alert(`${role} wajib memiliki minimal satu station scope.`);return}
 if(role==='Lounge Staff'&&!loungeIds.length){alert('Lounge Staff wajib ditugaskan ke minimal satu Lounge.');return}
 try{
   let profile;
   if(!id){
     const password=userPassword.value;
     const confirm=userPasswordConfirm.value;
     if(password!==confirm){alert('Confirm Temporary Password harus sama.');return}
     if(password.length<10){alert('Temporary Password minimal 10 karakter.');return}
     const r=await gxApi('/auth-create-user',{method:'POST',body:JSON.stringify({
       username,email:userEmail.value.trim().toLowerCase(),fullName:userFullName.value.trim(),employeeNo:userEmployeeNo.value.trim(),
       role,unit:userUnit.value.trim(),status:userStatus.value,scopeType,airports,loungeIds,tabs,
       temporaryPassword:password,confirmTemporaryPassword:confirm
     })});
     profile=r.profile;
   }else{
     const r=await gxApi('/auth-update-user',{method:'POST',body:JSON.stringify({
       userId:id,fullName:userFullName.value.trim(),employeeNo:userEmployeeNo.value.trim(),
       role,unit:userUnit.value.trim(),status:userStatus.value,scopeType,airports,loungeIds,tabs
     })});
     profile=r.profile;
   }
   const idx=(data.users||[]).findIndex(u=>String(u.id)===String(profile.id));
   if(idx>=0)data.users[idx]=profile;else data.users.push(profile);
   save();closeUserModal();renderUserAccounts();
   alert(id?'Akun berhasil diperbarui.':'Akun berhasil dibuat. User wajib mengganti temporary password saat login pertama.');
 }catch(e){
   alert(e.message||'Akun gagal disimpan.');
 }
}
async function resetUserPassword(id){
 if(!geCanManageAccounts()||typeof gxApi!=='function')return;
 const u=(data.users||[]).find(x=>String(x.id)===String(id));if(!u)return;
 const password=prompt('Masukkan temporary password baru (minimal 10 karakter).');
 if(password===null)return;
 const confirm=prompt('Ulangi temporary password baru.');
 if(password!==confirm){alert('Password dan konfirmasi tidak sama.');return}
 if(password.length<10){alert('Temporary password minimal 10 karakter.');return}
 try{
   await gxApi('/auth-reset-password',{method:'POST',body:JSON.stringify({userId:String(id),temporaryPassword:password,confirmTemporaryPassword:confirm})});
   u.mustChangePassword=true;save();renderUserAccounts();
   alert('Temporary password berhasil direset. User wajib menggantinya saat login.');
 }catch(e){alert(e.message||'Reset password gagal.')}
}
function deleteUserAccount(id){
 if(!geCanManageAccounts())return;
 const u=(data.users||[]).find(x=>String(x.id)===String(id));if(!u)return;
 if(String(u.id)===String(geSession()?.id)){alert('Akun yang sedang digunakan tidak dapat dihapus.');return}
 alert('Penghapusan akun Firebase harus melalui workflow server terotorisasi. Tombol hapus lokal dinonaktifkan untuk mencegah akun yatim.');
}
function renderUserAccounts(){
 const t=document.getElementById('userAccountRows');if(!t)return;
 const can=geCanManageAccounts();
 t.innerHTML=(data.users||[]).map((u,i)=>{
  const scope=u.scopeType==='ALL'?'All Area':u.scopeType==='LOUNGE'?`${(u.loungeIds||[]).length} Lounge`:u.scopeType==='AIRPORT'?(u.airports||[]).join(', '):(u.unit||'Custom');
  const tabs=(u.tabs||[]).includes('ALL')?'Semua TAB':(u.tabs||[]).map(v=>GE_TAB_OPTIONS.find(x=>x[0]===v)?.[1]||v).join(', ');
  return `<tr><td>${i+1}</td><td><b>${u.name||'-'}</b></td><td>${u.employeeNo||'-'}</td><td>${u.username||'-'}</td><td>${u.email||'-'}</td><td>${u.role||'-'}</td><td>${u.unit||'-'}</td><td>${scope}</td><td>${tabs}</td><td><span class="pill">${u.status||'-'}${u.mustChangePassword?' • Change password':''}</span></td>${can?`<td class="visitor-actions"><button class="btn secondary compact-btn" onclick="openUserModal('${String(u.id).replace(/'/g,"\\\\'")}')">Edit</button><button class="btn secondary compact-btn" onclick="resetUserPassword('${String(u.id).replace(/'/g,"\\\\'")}')">Reset Password</button></td>`:''}</tr>`;
 }).join('');
 if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}

/* Scope all Lounge selectors and visitor data */
function fillAirportSelects(){
 const codes=geVisibleAirports();
 ['scanAirport','visitorAirport','loungeAirportFilter'].forEach(id=>{
  const e=document.getElementById(id);if(!e)return;
  const all=id!=='scanAirport' && codes.length>1;
  e.innerHTML=(all?'<option value="">Semua Airport</option>':'')+codes.map(x=>`<option>${x}</option>`).join('');
 });
 refreshScanLoungeOptions();
}
function refreshScanLoungeOptions(){
 const airport=document.getElementById('scanAirport')?.value||'';
 const select=document.getElementById('scanLounge');if(!select)return;
 const rows=geVisibleLoungeRows().filter(x=>!airport||x.airport===airport);
 select.innerHTML=rows.length?rows.map(x=>`<option value="${x.id}">${x.name} — ${displayLoungePrice(x)}</option>`).join(''):'<option value="">Belum ada lounge yang dapat diakses</option>';
}
function loungeVisitorFiltered(){
 const s=document.getElementById('visitorStart')?.value||'',e=document.getElementById('visitorEnd')?.value||'',
 a=document.getElementById('visitorAirport')?.value||'',c=document.getElementById('visitorCategory')?.value||'';
 const user=geSession(),ids=typeof gxAllowedLoungeIds==='function'?gxAllowedLoungeIds():[];
 return (data.loungeVisitors||[]).filter(x=>
  (!s||x.date>=s)&&(!e||x.date<=e)&&(!a||x.airport===a)&&(!c||x.category===c) &&
  (!user||['Admin','Super Admin'].includes(user.role)||user.scopeType==='ALL'||
    (ids.length?ids.includes(String(x.loungeId)):typeof gxAirportAllowed==='function'?gxAirportAllowed(x.airport):true))
 );
}
function loungeFiltered(){
 const region=document.getElementById('loungeRegionFilter')?.value||'',station=document.getElementById('loungeAirportFilter')?.value||'',
 q=(document.getElementById('loungeNameFilter')?.value||'').toLowerCase(),status=document.getElementById('loungeStatusFilter')?.value||'';
 return geVisibleLoungeRows().filter(x=>(!region||x.region===region)&&(!station||x.airport===station)&&(!q||String(x.name||'').toLowerCase().includes(q))&&(!status||x.documentStatus===status));
}

/* Professional Lounge Visitor update modal */
function geVisitorEdit(id){
 if(!geCurrentUserCanManageVisitors())return;
 const x=(data.loungeVisitors||[]).find(v=>String(v.id)===String(id));if(!x)return;
 visitorEditId.value=x.id;visitorEditName.value=x.name||'';visitorEditFlight.value=x.flight||'';
 visitorEditSeq.value=x.seq||'';visitorEditAirport.value=x.airport||'';
 visitorEditCategory.innerHTML=GE_LOUNGE_CATEGORIES.map(c=>`<option ${c===x.category?'selected':''}>${c}</option>`).join('');
 visitorEditReference.value=x.eligibilityReference||'';
 visitorEditCategoryChanged();
 document.getElementById('visitorEditModal').classList.add('show');
}
function closeVisitorEditModal(){document.getElementById('visitorEditModal')?.classList.remove('show')}
function visitorEditCategoryChanged(){
 const c=visitorEditCategory.value,wrap=document.getElementById('visitorEditReferenceWrap');
 const req=GE_REFERENCE_REQUIRED.has(c);wrap.style.display=req?'block':'none';
 const label=geReferenceLabel(c);wrap.childNodes[0].textContent=label;
 visitorEditReference.placeholder=label;
 visitorEditReference.required=req;if(!req)visitorEditReference.value='';
}
function saveVisitorEditModal(){
 if(!geCurrentUserCanManageVisitors())return;
 const x=(data.loungeVisitors||[]).find(v=>String(v.id)===String(visitorEditId.value));if(!x)return;
 const c=visitorEditCategory.value,ref=visitorEditReference.value.trim();
 if(GE_REFERENCE_REQUIRED.has(c)&&!ref){alert(geReferenceLabel(c)+' wajib diisi.');visitorEditReference.focus();return}
 x.name=visitorEditName.value.trim();x.flight=visitorEditFlight.value.trim().toUpperCase();
 x.seq=normalizeSeq(visitorEditSeq.value.trim());x.airport=visitorEditAirport.value.trim().toUpperCase();
 x.category=c;x.eligibilityReference=ref;
 save();closeVisitorEditModal();renderLoungeVisitors();alert('Data Lounge Visitor berhasil diperbarui.');
}

function geInitV211(){
 if(typeof gxApplyNavigation==='function')gxApplyNavigation();
 if(typeof gxApplyRole==='function')gxApplyRole();
 renderUserAccounts();
 if(typeof syncFirebaseUsers==='function')syncFirebaseUsers();
 fillAirportSelects();
 renderLoungeVisitors();
 renderLounges();
}
window.addEventListener('DOMContentLoaded',geInitV211);
window.addEventListener('gx-auth-verified',()=>{if(typeof syncFirebaseUsers==='function')syncFirebaseUsers()});


/* ==============================================================
   V2.12 — Personnel Master + Data Filters + BO Readiness
   ============================================================== */
const GE_CORE_BO_FUNCTIONS=['GM','KK','SS','SV'];

function geCanManageMasterData(){
  return typeof gxCanManage==='function' ? gxCanManage() : ['Admin','Super Admin'].includes(geSession()?.role);
}
function gePersonnelVisibleRows(){
  const s=typeof geSession==='function'?geSession():gxGetSession();
  return (data.personnel||[]).filter(p=>{
    if(!s||['Admin','Super Admin'].includes(s.role)||s.scopeType==='ALL')return true;
    if(s.role==='Branch Office' && typeof gxAirportAllowed==='function')return gxAirportAllowed(p.airport);
    if(Array.isArray(s.airports)&&s.airports.length)return s.airports.includes(String(p.airport||'').trim().toUpperCase());
    return true;
  });
}
function populatePersonnelFilters(){
  const rows=gePersonnelVisibleRows();
  const ap=document.getElementById('personnelAirportFilter');
  if(ap){
    const cur=ap.value;
    const vals=[...new Set(rows.map(x=>String(x.airport||'').trim()).filter(Boolean))].sort();
    ap.innerHTML='<option value="">Semua Airport</option>'+vals.map(x=>`<option>${x}</option>`).join('');
    ap.value=cur;
  }
  const fn=document.getElementById('personnelFunctionFilter');
  if(fn){
    const cur=fn.value;
    const vals=[...new Set(rows.map(x=>String(x.function||'').trim()).filter(Boolean))].sort();
    fn.innerHTML='<option value="">Semua Fungsi</option>'+vals.map(x=>`<option>${x}</option>`).join('');
    fn.value=cur;
  }
}
function personnelFiltered(){
  const q=(document.getElementById('personnelSearch')?.value||'').toLowerCase();
  const airport=document.getElementById('personnelAirportFilter')?.value||'';
  const fn=document.getElementById('personnelFunctionFilter')?.value||'';
  const pos=(document.getElementById('personnelPositionFilter')?.value||'').toLowerCase();
  return gePersonnelVisibleRows().filter(x=>
    (!q||`${x.name} ${x.position} ${x.email} ${x.sitaCode} ${x.employeeNo}`.toLowerCase().includes(q)) &&
    (!airport||String(x.airport||'').trim()===airport) &&
    (!fn||String(x.function||'').trim()===fn) &&
    (!pos||String(x.position||'').toLowerCase().includes(pos))
  );
}
function renderPersonnel(){
  const t=document.getElementById('personnelRows');if(!t)return;
  populatePersonnelFilters();
  const can=geCanManageMasterData();
  t.innerHTML=personnelFiltered().map((x,i)=>`<tr>
    <td>${i+1}</td><td>${x.employeeNo||'-'}</td><td><b>${x.name||'-'}</b></td>
    <td>${x.position||'-'}</td><td>${x.sitaCode||'-'}</td><td><b>${x.airport||'-'}</b></td>
    <td><span class="function-pill">${x.function||'-'}</span></td><td>${x.email||'-'}</td>
    ${can?`<td class="visitor-actions"><button class="btn secondary compact-btn" onclick="openPersonnelModal(${x.id})">Update</button><button class="btn danger compact-btn" onclick="deletePersonnel(${x.id})">Hapus</button></td>`:''}
  </tr>`).join('');
  if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}
function openPersonnelModal(id=null){
  if(!geCanManageMasterData())return;
  const x=id?(data.personnel||[]).find(p=>String(p.id)===String(id)):null;
  personnelModalTitle.textContent=x?'Update Personil':'Tambah Personil';
  personnelEditId.value=x?.id||'';personnelEmployeeNo.value=x?.employeeNo||'';
  personnelName.value=x?.name||'';personnelPosition.value=x?.position||'';
  personnelSitaCode.value=x?.sitaCode||'';personnelAirport.value=x?.airport||'';
  personnelFunction.value=x?.function||'';personnelEmail.value=x?.email||'';
  document.getElementById('personnelModal').classList.add('show');
}
function closePersonnelModal(){document.getElementById('personnelModal')?.classList.remove('show')}
function savePersonnel(){
  if(!geCanManageMasterData())return;
  const id=Number(personnelEditId.value||0);
  const obj={
    id:id||Date.now(),employeeNo:personnelEmployeeNo.value.trim(),name:personnelName.value.trim(),
    position:personnelPosition.value.trim(),sitaCode:personnelSitaCode.value.trim(),
    airport:personnelAirport.value.trim().toUpperCase(),function:personnelFunction.value.trim().toUpperCase(),
    email:personnelEmail.value.trim().toUpperCase()
  };
  if(id)Object.assign(data.personnel.find(p=>p.id===id),obj);else data.personnel.push(obj);
  save();closePersonnelModal();renderPersonnel();renderPersonnelReadiness();
}
function deletePersonnel(id){
  if(!geCanManageMasterData())return;
  const x=(data.personnel||[]).find(p=>p.id===id);if(!x)return;
  if(!confirm(`Hapus personil ${x.name}?`))return;
  data.personnel=data.personnel.filter(p=>p.id!==id);save();renderPersonnel();renderPersonnelReadiness();
}

/* Filters for every table in Data */
function populateAccountFilters(){
  const role=document.getElementById('accountRoleFilter');
  if(role){
    const cur=role.value;
    const vals=[...new Set((data.users||[]).map(x=>x.role).filter(Boolean))].sort();
    role.innerHTML='<option value="">Semua Role</option>'+vals.map(x=>`<option>${x}</option>`).join('');
    role.value=cur;
  }
}
function renderUserAccounts(){
 const t=document.getElementById('userAccountRows');if(!t)return;
 populateAccountFilters();
 const state=window.GE_FIREBASE_USERS_STATE||'idle';
 if(state==='idle' && typeof syncFirebaseUsers==='function'){
   t.innerHTML='<tr><td colspan="11" class="ge-data-state-r13">Memuat akun dari Firebase / Firestore…</td></tr>';
   syncFirebaseUsers(); return;
 }
 if(state==='loading'){
   t.innerHTML='<tr><td colspan="11" class="ge-data-state-r13">Memuat akun dari Firebase / Firestore…</td></tr>'; return;
 }
 if(state==='error'){
   t.innerHTML=`<tr><td colspan="11" class="ge-data-state-r13 ge-data-error-r13">Data akun Firestore gagal dimuat: ${geEsc(window.GE_FIREBASE_USERS_ERROR||'Unknown error')}</td></tr>`; return;
 }
 const q=(document.getElementById('accountSearch')?.value||'').toLowerCase();
 const rf=document.getElementById('accountRoleFilter')?.value||'';
 const sf=document.getElementById('accountStatusFilter')?.value||'';
 const af=(document.getElementById('accountAreaFilter')?.value||'').toLowerCase();
 const can=geCanManageAccounts();
 const rows=(data.users||[]).filter(u=>(!q||`${u.name||''} ${u.username||''} ${u.email||''} ${u.employeeNo||''}`.toLowerCase().includes(q))&&(!rf||u.role===rf)&&(!sf||u.status===sf)&&(!af||`${u.unit||''} ${(u.airports||[]).join(' ')}`.toLowerCase().includes(af)));
 t.innerHTML=rows.length?rows.map((u,i)=>{
   const scope=u.scopeType==='ALL'?'ALL':u.scopeType==='LOUNGE'?'LOUNGE':u.scopeType==='AIRPORT'||u.scopeType==='STATION'?'AIRPORT':(u.scopeType||'CUSTOM');
   const assigned=(u.airports||[]).join(', ')||(u.loungeIds||[]).join(', ')||'—';
   const protectedUser=u.role==='Super Admin';
   return `<tr><td>${i+1}</td><td><b>${geEsc(u.name||u.fullName||'-')}</b><small>${geEsc(u.employeeNo||'')}</small></td><td><b>${geEsc(u.username||'-')}</b><small>${geEsc(u.email||'-')}</small></td><td>${geEsc(u.role||'-')}</td><td>${geEsc(u.accessLevel||u.level||'-')}</td><td>${geEsc(u.unit||u.department||'-')}</td><td><b>${geEsc(scope)}</b></td><td>${geEsc(assigned)}</td><td><span class="pill">${geEsc(u.status||'-')}</span></td><td>${geEsc(u.lastLogin||u.lastLoginAt||'Not available')}</td>${can?`<td class="visitor-actions">${protectedUser?'<span class="pill">Protected</span>':`<button class="btn secondary compact-btn" onclick="openUserModal('${String(u.id).replace(/'/g,"\\'")}')">Edit</button><button class="btn secondary compact-btn" onclick="resetUserPassword('${String(u.id).replace(/'/g,"\\'")}')">Reset Password</button>`}</td>`:''}</tr>`;
 }).join(''):`<tr><td colspan="11" class="ge-data-state-r13">Tidak ada akun pada Firestore yang sesuai filter.</td></tr>`;
 if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}
function renderAirports(){
  const t=document.getElementById('airportRows');if(!t)return;
  const q=(document.getElementById('airportSearch')?.value||'').toLowerCase();
  const reg=document.getElementById('airportRegionFilter')?.value||'';
  const st=document.getElementById('airportStatusFilter')?.value||'';
  const rows=(data.airports||[]).filter(a=>
    (typeof gxAirportAllowed!=='function'||gxAirportAllowed(a.code)) &&
    (!q||`${a.code} ${a.city}`.toLowerCase().includes(q))&&(!reg||a.region===reg)&&(!st||a.status===st)
  );
  const rsel=document.getElementById('airportRegionFilter');
  if(rsel){const cur=rsel.value;const vals=[...new Set((data.airports||[]).map(x=>x.region).filter(Boolean))].sort();rsel.innerHTML='<option value="">Semua Wilayah</option>'+vals.map(x=>`<option>${x}</option>`).join('');rsel.value=cur}
  const ssel=document.getElementById('airportStatusFilter');
  if(ssel){const cur=ssel.value;const vals=[...new Set((data.airports||[]).map(x=>x.status).filter(Boolean))].sort();ssel.innerHTML='<option value="">Semua Status</option>'+vals.map(x=>`<option>${x}</option>`).join('');ssel.value=cur}
  t.innerHTML=rows.map((a,i)=>`<tr><td>${i+1}</td><td><b>${a.code}</b></td><td>${a.city}</td><td>${a.region}</td><td><span class=pill>${a.status}</span></td><td>${a.lounge}</td><td>${a.pending}</td></tr>`).join('');
  if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}
function renderDocumentsAdmin(){
 const box=document.getElementById('documentAdminList');if(!box)return;
 const q=(document.getElementById('docAdminSearch')?.value||'').toLowerCase();
 const cat=document.getElementById('docAdminCategory')?.value||'';
 const src=document.getElementById('docAdminSource')?.value||'';
 const cats=[...new Set((data.documents||[]).map(x=>x.category).filter(Boolean))].sort();
 const sources=[...new Set((data.documents||[]).map(x=>x.source).filter(Boolean))].sort();
 const ce=document.getElementById('docAdminCategory');if(ce){const cur=ce.value;ce.innerHTML='<option value="">Semua Kategori</option>'+cats.map(x=>`<option>${x}</option>`).join('');ce.value=cur}
 const se=document.getElementById('docAdminSource');if(se){const cur=se.value;se.innerHTML='<option value="">Semua Sumber</option>'+sources.map(x=>`<option>${x}</option>`).join('');se.value=cur}
 const rows=(data.documents||[]).filter(x=>(!q||`${x.title} ${x.fileName} ${x.note}`.toLowerCase().includes(q))&&(!cat||x.category===cat)&&(!src||x.source===src));
 box.innerHTML=rows.map(x=>`<div class="document-row"><div><b>${x.title}</b><small>${x.fileName}</small></div><span>${x.category}</span><span>${x.source}</span><span>${x.date}</span><div>${x.blobKey?`<button class="btn secondary" onclick="GEFiles.download('${x.blobKey}','${String(x.fileName).replaceAll("'","")}')">Unduh</button>`:''} <button class="btn" data-role-min="Admin" onclick="deletePortalDocument(${x.id})">Hapus</button></div></div>`).join('');
 if(typeof gxApplyRole==='function')gxApplyRole();
}

/* Branch Office personnel readiness */
function personnelAirportMatrix(){
  const rows=(data.personnel||[]).filter(p=>String(p.airport||'').trim().toUpperCase()!=='HO' && String(p.airport||'').trim());
  const map={};
  rows.forEach(p=>{
    const airport=String(p.airport||'').trim().toUpperCase();
    map[airport]??={airport,functions:new Set(),count:0};
    const fn=String(p.function||'').trim().toUpperCase();
    if(GE_CORE_BO_FUNCTIONS.includes(fn))map[airport].functions.add(fn);
    map[airport].count++;
  });
  return Object.values(map).map(x=>{
    const n=GE_CORE_BO_FUNCTIONS.filter(f=>x.functions.has(f)).length;
    const classification=n>=4?'BO A':n===3?'BO B':'BO C';
    return {...x,functionCount:n,classification};
  }).sort((a,b)=>String(a.airport||'').localeCompare(String(b.airport||''),'id'));
}
function renderPersonnelReadiness(){
  const tbody=document.getElementById('readinessRows');if(!tbody)return;
  const matrix=personnelAirportMatrix();
  const q=(document.getElementById('readinessSearch')?.value||'').toUpperCase();
  const cf=document.getElementById('readinessClassFilter')?.value||'';
  const filtered=matrix.filter(x=>(!q||x.airport.includes(q))&&(!cf||x.classification===cf));
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  set('readinessAirportCount',matrix.length);
  const nonHO=(data.personnel||[]).filter(p=>String(p.airport||'').trim().toUpperCase()!=='HO');
  GE_CORE_BO_FUNCTIONS.forEach(fn=>set('readiness'+fn,nonHO.filter(p=>String(p.function||'').trim().toUpperCase()===fn).length));
  const a=matrix.filter(x=>x.classification==='BO A').length,b=matrix.filter(x=>x.classification==='BO B').length,c=matrix.filter(x=>x.classification==='BO C').length;
  set('classACount',a);set('classBCount',b);set('classCCount',c);
  const pct=matrix.length?Math.round(a/matrix.length*100):0;set('personnelCoveragePct',pct+'%');
  const donut=document.getElementById('personnelCoverageDonut');if(donut)donut.style.setProperty('--coverage',pct);
  tbody.innerHTML=filtered.map((x,i)=>`<tr>
    <td>${i+1}</td><td><b>${x.airport}</b></td><td><span class="bo-class ${x.classification.replace(' ','-').toLowerCase()}">${x.classification}</span></td>
    ${GE_CORE_BO_FUNCTIONS.map(fn=>`<td>${x.functions.has(fn)?'<span class="ready-yes">Ada</span>':'<span class="ready-no">Belum</span>'}</td>`).join('')}
    <td>${x.count}</td>
  </tr>`).join('');
  if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}

/* Strong RBAC navigation: hide all inaccessible links/groups. */
function gxApplyNavigationV212(){
  const pageMap={
    'index.html':'home','touchpoint.html':'services','standar.html':'services','map.html':'services',
    'pre-journey.html':'initiatives','pre-flight.html':'initiatives','post-flight.html':'initiatives','post-journey.html':'initiatives',
    'lounge-access.html':'lounge-access','lounge-visitor.html':'lounge-visitor','lounge-list.html':'lounge-list',
    'data.html':'data','berita.html':'news','kontak.html':'contact','admin.html':'admin'
  };
  document.querySelectorAll('.side a[href]').forEach(a=>{
    const href=(a.getAttribute('href')||'').split('?')[0];
    const tab=pageMap[href];
    a.style.display=(!tab||(typeof gxHasTab==='function'&&gxHasTab(tab)))?'':'none';
  });
  [
    ['serviceNav',['services']],
    ['initiativeNav',['initiatives']],
    ['loungeNav',['lounge-access','lounge-visitor','lounge-list']]
  ].forEach(([id,tabs])=>{
    const g=document.getElementById(id);if(!g)return;
    const allowed=tabs.some(t=>typeof gxHasTab==='function'&&gxHasTab(t));
    g.style.display=allowed?'':'none';
    if(allowed){
      [...g.querySelectorAll('a[href]')].forEach(a=>{
        const href=(a.getAttribute('href')||'').split('?')[0],tab=pageMap[href];
        a.style.display=(tab&&gxHasTab(tab))?'':'none';
      });
    }
  });
}
function geInitV212(){
  gxApplyNavigationV212();
  if(typeof gxApplyRole==='function')gxApplyRole();
  renderPersonnel();renderPersonnelReadiness();renderUserAccounts();renderAirports();renderDocumentsAdmin();
}
window.addEventListener('DOMContentLoaded',geInitV212);


/* ==============================================================
   V2.12.1 — Personnel data hotfix + clickable Standards + RBAC hide
   ============================================================== */

/* People / Process / Premises interactive selector */
function showStandardPanel(name,button){
  ['people','process','premises'].forEach(k=>{
    const el=document.getElementById('standard'+k.charAt(0).toUpperCase()+k.slice(1)+'Panel');
    if(el)el.style.display=(k===name)?'block':'none';
  });
  document.querySelectorAll('.standard-selector').forEach(x=>x.classList.remove('active'));
  button?.classList.add('active');
  if(name==='people')renderPersonnelReadiness();
}

/* Readiness must follow logged-in data scope. */
function personnelAirportMatrix(){
  const rows=gePersonnelVisibleRows().filter(p=>
    String(p.airport||'').trim().toUpperCase()!=='HO' &&
    String(p.airport||'').trim()
  );
  const map={};
  rows.forEach(p=>{
    const airport=String(p.airport||'').trim().toUpperCase();
    map[airport]??={airport,functions:new Set(),count:0};
    const fn=String(p.function||'').trim().toUpperCase();
    if(GE_CORE_BO_FUNCTIONS.includes(fn))map[airport].functions.add(fn);
    map[airport].count++;
  });
  return Object.values(map).map(x=>{
    const n=GE_CORE_BO_FUNCTIONS.filter(f=>x.functions.has(f)).length;
    return {...x,functionCount:n,classification:n>=4?'BO A':n===3?'BO B':'BO C'};
  }).sort((a,b)=>String(a.airport||'').localeCompare(String(b.airport||''),'id'));
}
function renderPersonnelReadiness(){
  const tbody=document.getElementById('readinessRows');if(!tbody)return;
  const matrix=personnelAirportMatrix();
  const q=(document.getElementById('readinessSearch')?.value||'').toUpperCase();
  const cf=document.getElementById('readinessClassFilter')?.value||'';
  const filtered=matrix.filter(x=>(!q||x.airport.includes(q))&&(!cf||x.classification===cf));
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  set('readinessAirportCount',matrix.length);

  const scoped=gePersonnelVisibleRows().filter(p=>String(p.airport||'').trim().toUpperCase()!=='HO');
  GE_CORE_BO_FUNCTIONS.forEach(fn=>set('readiness'+fn,scoped.filter(p=>String(p.function||'').trim().toUpperCase()===fn).length));

  const a=matrix.filter(x=>x.classification==='BO A').length;
  const b=matrix.filter(x=>x.classification==='BO B').length;
  const c=matrix.filter(x=>x.classification==='BO C').length;
  set('classACount',a);set('classBCount',b);set('classCCount',c);
  const pct=matrix.length?Math.round(a/matrix.length*100):0;
  set('personnelCoveragePct',pct+'%');
  const donut=document.getElementById('personnelCoverageDonut');
  if(donut)donut.style.setProperty('--coverage',pct);

  tbody.innerHTML=filtered.map((x,i)=>`<tr>
    <td>${i+1}</td><td><b>${x.airport}</b></td>
    <td><span class="bo-class ${x.classification.replace(' ','-').toLowerCase()}">${x.classification}</span></td>
    ${GE_CORE_BO_FUNCTIONS.map(fn=>`<td>${x.functions.has(fn)?'<span class="ready-yes">Ada</span>':'<span class="ready-no">Belum</span>'}</td>`).join('')}
    <td>${x.count}</td>
  </tr>`).join('');
  if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}

/* Staff can also carry Airport data scope. */
function userRoleChanged(){
 const role=document.getElementById('userRole')?.value||'Staff';
 document.getElementById('userAirportScopeWrap').style.display=['Branch Office','Staff','Lounge Staff'].includes(role)?'block':'none';
 document.getElementById('userLoungeScopeWrap').style.display=role==='Lounge Staff'?'block':'none';
 renderUserTabsChecklist(userDefaultTabs(role));
}
function saveUserAccount(){if(typeof window.p26OpenUserForm==='function'){window.p26OpenUserForm(document.getElementById('p26UserId')?.value||null);}}

/* Hard-hide unauthorized links/groups even against CSS display: block !important rules. */
function geHardHide(el){
  if(!el)return;
  el.classList.add('rbac-hidden');
  el.setAttribute('aria-hidden','true');
}
function geHardShow(el){
  if(!el)return;
  el.classList.remove('rbac-hidden');
  el.removeAttribute('aria-hidden');
}
function gxApplyNavigationV121(){
  const pageMap={
    'index.html':'home','touchpoint.html':'services','standar.html':'services','map.html':'services',
    'pre-journey.html':'initiatives','pre-flight.html':'initiatives','post-flight.html':'initiatives','post-journey.html':'initiatives',
    'lounge-access.html':'lounge-access','lounge-visitor.html':'lounge-visitor','lounge-list.html':'lounge-list',
    'data.html':'data','berita.html':'news','kontak.html':'contact','admin.html':'admin'
  };
  document.querySelectorAll('.side a[href]').forEach(a=>{
    const href=(a.getAttribute('href')||'').split('?')[0];
    const tab=pageMap[href];
    if(tab && !(typeof gxHasTab==='function'&&gxHasTab(tab))) geHardHide(a); else geHardShow(a);
  });
  [
    ['serviceNav',['services']],
    ['initiativeNav',['initiatives']],
    ['loungeNav',['lounge-access','lounge-visitor','lounge-list']]
  ].forEach(([id,tabs])=>{
    const group=document.getElementById(id);if(!group)return;
    const any=tabs.some(t=>typeof gxHasTab==='function'&&gxHasTab(t));
    if(!any){geHardHide(group);return}
    geHardShow(group);
    [...group.querySelectorAll('a[href]')].forEach(a=>{
      const href=(a.getAttribute('href')||'').split('?')[0],tab=pageMap[href];
      if(tab&&!gxHasTab(tab))geHardHide(a);else geHardShow(a);
    });
  });
}
window.addEventListener('DOMContentLoaded',()=>{
  gxApplyNavigationV121();
  renderPersonnel();
  if(document.getElementById('standardPeoplePanel'))showStandardPanel('people',document.querySelector('[data-standard-panel="people"]'));
});


/* ==============================================================
   V2.13 — Audit Trail, Content Workflow, Inbox, Admin Governance
   ============================================================== */

const GE_AUDIT_COLLECTIONS={
  airports:'Database Airport', initiatives:'Kegiatan & Inisiatif', documents:'Dokumen',
  loungeVisitors:'Lounge Visitor', lounges:'Daftar Lounge', users:'Account & Access',
  personnel:'Data Personil', articles:'Artikel', announcements:'Pengumuman', faqs:'FAQ',
  inbox:'Pesan Masuk'
};
const GE_AUDIT_LABEL={
  airports:x=>`${x.code||''} ${x.city||''}`.trim(),
  initiatives:x=>x.name||'Inisiatif',
  documents:x=>x.title||x.fileName||'Dokumen',
  loungeVisitors:x=>`${x.name||'Passenger'} / ${x.flight||'-'} / ${x.seq||'-'}`,
  lounges:x=>`${x.airport||''} — ${x.name||'Lounge'}`,
  users:x=>`${x.name||''} (${x.username||''})`,
  personnel:x=>`${x.name||''} / ${x.airport||''}`,
  articles:x=>x.title||'Artikel',
  announcements:x=>x.title||'Pengumuman',
  faqs:x=>x.question||'FAQ',
  inbox:x=>`${x.type||'Message'} — ${x.subject||x.title||''}`
};
let GE_LAST_SAVED_SNAPSHOT=null;
function geSafeClone(v){try{return JSON.parse(JSON.stringify(v))}catch(e){return null}}
function geAuditUser(){return typeof gxGetSession==='function'?(gxGetSession()||{}):(window.GX_CURRENT_USER||{})}
function geObjectChangedFields(a,b){
  const ignore=new Set(['updatedAt','password','raw','content','answer','body','coverKey','documentKey']);
  return [...new Set([...Object.keys(a||{}),...Object.keys(b||{})])]
    .filter(k=>!ignore.has(k)&&JSON.stringify(a?.[k])!==JSON.stringify(b?.[k]))
    .slice(0,8);
}
function geAuditPush(logs,action,module,obj,detail){
  const u=geAuditUser();
  logs.unshift({
    id:Date.now()+Math.floor(Math.random()*100000),
    timestamp:new Date().toISOString(),
    username:u.username||'system',name:u.name||u.username||'System',role:u.role||'System',
    action,module,object:obj||'',detail:detail||''
  });
}
function geBuildAuditDiff(before,after){
  const logs=[];
  Object.entries(GE_AUDIT_COLLECTIONS).forEach(([key,module])=>{
    const a=Array.isArray(before?.[key])?before[key]:[];
    const b=Array.isArray(after?.[key])?after[key]:[];
    const am=new Map(a.map(x=>[String(x.id),x])),bm=new Map(b.map(x=>[String(x.id),x]));
    b.forEach(x=>{
      if(!am.has(String(x.id))){
        geAuditPush(logs,'Create',module,GE_AUDIT_LABEL[key]?.(x)||String(x.id),'Data ditambahkan');
      }else{
        const old=am.get(String(x.id));
        const fields=geObjectChangedFields(old,x);
        if(fields.length)geAuditPush(logs,'Update',module,GE_AUDIT_LABEL[key]?.(x)||String(x.id),'Field diperbarui: '+fields.join(', '));
      }
    });
    a.forEach(x=>{
      if(!bm.has(String(x.id)))geAuditPush(logs,'Delete',module,GE_AUDIT_LABEL[key]?.(x)||String(x.id),'Data dihapus');
    });
  });
  return logs;
}
/* Edition 1 save authority remains the Firestore-backed GEStore. */

/* ---------- Admin dashboard ---------- */
function showAdminSection(name,btn){
 if(['audit','portal'].includes(name)&&geSession()?.role!=='Super Admin')return;
 ['accounts','inbox','audit','portal'].forEach(k=>{const e=document.getElementById('adminSection'+k.charAt(0).toUpperCase()+k.slice(1));if(e)e.style.display=k===name?'block':'none'});
 document.querySelectorAll('.admin-section-tab').forEach(x=>x.classList.remove('active'));btn?.classList.add('active');
 if(name==='accounts')renderUserAccounts();if(name==='inbox')renderAdminInbox();if(name==='audit')renderAuditLogs();if(name==='portal')pmActivity('Portal Management V2.50 siap digunakan sebagai foundation.');
}
function renderAdminOverview(){
 const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
 set('adminAccountCount',(data.users||[]).length);
 set('adminInboxCount',(data.inbox||[]).length);
 set('adminUnreadCount',(data.inbox||[]).filter(x=>x.status==='Unread').length);
 set('adminAuditCount',(data.auditLogs||[]).length);
 const targets={adminAccountCount:'accounts',adminInboxCount:'inbox',adminUnreadCount:'inbox',adminAuditCount:'audit'};
 Object.entries(targets).forEach(([id,section])=>{const card=document.getElementById(id)?.closest('.admin-overview-card');if(!card||card.dataset.summaryBound)return;if(section==='audit'&&geSession()?.role!=='Super Admin')return;card.dataset.summaryBound='1';card.tabIndex=0;card.setAttribute('role','button');card.style.cursor='pointer';const go=()=>{showAdminSection(section,document.querySelector(`.admin-section-tab[onclick*="'${section}'"]`));const filter=document.getElementById('inboxStatusFilter');if(section==='inbox'&&filter){filter.value=id==='adminUnreadCount'?'Unread':'';renderAdminInbox()}document.getElementById('adminSection'+section[0].toUpperCase()+section.slice(1))?.scrollIntoView({block:'start'})};card.addEventListener('click',go);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})});
}

/* ---------- Inbox ---------- */
function submitInbox(type,subject,body,extra={}){
 const u=geAuditUser();
 data.inbox.unshift({
  id:Date.now(),type,subject,body,status:'Unread',createdAt:new Date().toISOString(),
  senderName:extra.senderName||u.name||'User',senderUsername:u.username||'',senderRole:u.role||'',
  senderArea:extra.senderArea||u.unit||(u.airports||[]).join(', '),...extra
 });
 save();renderAdminOverview();
}
function inboxFiltered(){
 const q=(document.getElementById('inboxSearch')?.value||'').toLowerCase();
 const type=document.getElementById('inboxTypeFilter')?.value||'',status=document.getElementById('inboxStatusFilter')?.value||'';
 return (data.inbox||[]).filter(x=>(!q||`${x.senderName||''} ${x.subject||x.title||''} ${x.body||x.message||''}`.toLowerCase().includes(q))&&(!type||x.type===type)&&(!status||x.status===status));
}
function renderAdminInbox(){
 const t=document.getElementById('adminInboxRows');if(!t)return;
 const filter=document.getElementById('inboxTypeFilter');if(filter){const current=filter.value;filter.innerHTML='<option value="">Semua Jenis</option>'+[...new Set((data.inbox||[]).map(x=>x.type).filter(Boolean))].sort().map(v=>`<option value="${geEsc(v)}">${geEsc(v)}</option>`).join('');filter.value=current}
 t.innerHTML=inboxFiltered().map((x,i)=>`<tr class="${x.status==='Unread'?'unread-row':''}" data-inbox-id="${geEsc(x.id)}" style="cursor:pointer">
 <td>${i+1}</td><td>${geDateTime(x.createdAt)}</td><td><span class="inbox-type">${geEsc(x.type||'-')}</span></td>
 <td><b>${geEsc(x.senderName||x.from||'-')}</b><small>${geEsc(x.senderRole||'')}</small></td><td>${geEsc(x.senderArea||x.area||'-')}</td><td>${geEsc(x.subject||x.title||'-')}</td>
 <td><span class="pill">${geEsc(x.status||'Unread')}</span></td><td class="inbox-actions">
 <button class="btn secondary compact-btn" data-inbox-open="${geEsc(x.id)}">Buka</button>
 ${x.type==='Article Proposal'&&x.status!=='Handled'?`<button class="btn compact-btn" data-inbox-review="${geEsc(x.id)}">Review</button>`:''}
 <button class="btn danger compact-btn" data-inbox-delete="${geEsc(x.id)}">Hapus</button>
 </td></tr>`).join('')||'<tr><td colspan="8">Belum ada pesan sesuai filter.</td></tr>';
 if(!t.dataset.bound){t.dataset.bound='1';t.addEventListener('click',e=>{const row=e.target.closest('[data-inbox-id]');if(!row)return;const id=row.dataset.inboxId;if(e.target.closest('[data-inbox-delete]'))deleteInbox(id);else if(e.target.closest('[data-inbox-review]'))reviewProposal(id);else openInboxDetail(id)})}
 if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);renderAdminOverview();
}
function findInbox(id){return(data.inbox||[]).find(v=>String(v.id)===String(id))}
async function openInboxDetail(id){
 const x=findInbox(id);if(!x)return;
 if(x.status==='Unread'){try{await window.GEStore.markInboxRead(x.id,'inbox');window.dispatchEvent(new Event('gx-inbox-ready'))}catch(e){console.warn('[Inbox read]',e);const target=document.getElementById('adminInboxRows');if(target){const row=target.querySelector(`[data-inbox-id="${String(id).replace(/[^\w:.-]/g,'')}"]`);if(row)row.title='Status baca belum tersimpan: '+(e.message||e)}return}}
 const body=document.getElementById('inboxDetailBody');if(!body)return;
 const related=x.referenceId||x.relatedId||x.articleId;
 const support=x.relatedType==='contactMessages'||x.type==='Contact Support';
 body.innerHTML=`<div class="inbox-detail-head"><span class="inbox-type">${geEsc(x.type||'-')}</span><h2>${geEsc(x.subject||x.title||'-')}</h2>
 <p>Dari <b>${geEsc(x.senderName||x.from||'-')}</b> • ${geEsc(x.senderArea||x.area||'-')} • ${geDateTime(x.createdAt)}</p></div>
 <div class="inbox-body-content">${x.type==='Article Proposal'?geSanitizeHTML(x.body||''):`<p>${geEsc(x.body||x.message||'').replace(/\n/g,'<br>')}</p>`}</div>
 ${!support&&!['Task Assignment','System Notification'].includes(x.type)&&x.senderId&&x.recipientId?`<section class="ge-inbox-thread"><h3>Percakapan</h3><div id="inboxThreadHistory">Memuat percakapan…</div><label>Balasan<textarea id="inboxReplyText" rows="3" placeholder="Tulis balasan"></textarea></label><button type="button" class="btn" id="inboxReplySend">Kirim Balasan</button><p id="inboxReplyStatus" role="status"></p></section>`:''}
 <div class="modal-actions">${support&&related?`<button class="btn" id="inboxSupportOpen">Buka Percakapan</button>`:''}${x.type==='Article Proposal'&&x.status!=='Handled'?`<button class="btn" id="inboxReviewOpen">Review Artikel</button>`:''}${x.type==='Task Assignment'&&related?`<button class="btn" id="inboxTaskOpen">Lihat Task</button>`:''}<button class="btn secondary" id="inboxCloseButton">Tutup</button></div>`;
 if(body.querySelector('#inboxThreadHistory')){const history=body.querySelector('#inboxThreadHistory'),status=body.querySelector('#inboxReplyStatus');const load=async()=>{try{const messages=await window.GEStore.loadInboxThread(x.id);history.innerHTML=messages.map(m=>`<article><b>${geEsc(m.senderName||'Pengirim')}</b><small>${geDateTime(m.createdAt)}</small><p>${geEsc(m.body||m.message||'').replace(/\n/g,'<br>')}</p></article>`).join('')}catch(err){status.textContent='Percakapan belum dapat dimuat: '+err.message;history.textContent=''}};load();body.querySelector('#inboxReplySend').onclick=async e=>{const message=body.querySelector('#inboxReplyText').value.trim();if(!message)return; e.target.disabled=true;try{await window.GEStore.replyInbox(x.id,message);body.querySelector('#inboxReplyText').value='';status.textContent='Balasan terkirim.';await load()}catch(err){status.textContent='Balasan belum terkirim: '+err.message}finally{e.target.disabled=false}}}
 body.querySelector('#inboxSupportOpen')?.addEventListener('click',()=>{closeInboxDetail();openSupportConversation(related)});
 body.querySelector('#inboxReviewOpen')?.addEventListener('click',()=>{closeInboxDetail();reviewProposal(id)});
 body.querySelector('#inboxTaskOpen')?.addEventListener('click',()=>location.assign(`app.html?page=inisiatif&initiative=${encodeURIComponent(related)}`));
 body.querySelector('#inboxCloseButton')?.addEventListener('click',closeInboxDetail);
 document.getElementById('inboxDetailModal').classList.add('show');renderAdminInbox();
}
function closeInboxDetail(){document.getElementById('inboxDetailModal')?.classList.remove('show')}
function markInboxHandled(id){const x=findInbox(id);if(x){x.status='Handled';save();renderAdminInbox()}}
function deleteInbox(id){if(confirm('Hapus pesan ini?')){data.inbox=data.inbox.filter(x=>String(x.id)!==String(id));save();renderAdminInbox()}}

/* ---------- Audit ---------- */
function geDateTime(v){try{return new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})}catch(e){return v||'-'}}
function auditFiltered(){
 const q=(document.getElementById('auditSearch')?.value||'').toLowerCase(),act=document.getElementById('auditActionFilter')?.value||'',
 mod=document.getElementById('auditModuleFilter')?.value||'',date=document.getElementById('auditDateFilter')?.value||'';
 return (data.auditLogs||[]).filter(x=>(!q||`${x.name} ${x.username} ${x.module} ${x.object} ${x.detail} ${x.action}`.toLowerCase().includes(q))&&(!act||x.action===act)&&(!mod||x.module===mod)&&(!date||String(x.timestamp).slice(0,10)===date));
}
function populateAuditFilters(){
 const a=document.getElementById('auditActionFilter'),m=document.getElementById('auditModuleFilter');
 if(a){const cur=a.value,vals=[...new Set((data.auditLogs||[]).map(x=>x.action).filter(Boolean))].sort();a.innerHTML='<option value="">Semua Aktivitas</option>'+vals.map(x=>`<option>${x}</option>`).join('');a.value=cur}
 if(m){const cur=m.value,vals=[...new Set((data.auditLogs||[]).map(x=>x.module).filter(Boolean))].sort();m.innerHTML='<option value="">Semua Modul</option>'+vals.map(x=>`<option>${x}</option>`).join('');m.value=cur}
}
function renderAuditLogs(){
 const t=document.getElementById('auditRows');if(!t)return;populateAuditFilters();
 t.innerHTML=auditFiltered().map((x,i)=>`<tr><td>${i+1}</td><td>${geDateTime(x.timestamp)}</td><td><b>${geEsc(x.name||x.username)}</b><small>${geEsc(x.username||'')}</small></td><td>${geEsc(x.role||'-')}</td><td><span class="audit-action">${geEsc(x.action)}</span></td><td>${geEsc(x.module)}</td><td>${geEsc(x.object)}</td><td>${geEsc(x.detail)}</td></tr>`).join('');
 if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);renderAdminOverview();
}
function downloadAuditCSV(){
 let csv='No,Waktu,User,Username,Role,Aktivitas,Modul,Objek,Detail\n';
 auditFiltered().forEach((x,i)=>csv+=`${i+1},"${geDateTime(x.timestamp)}","${String(x.name||'').replaceAll('"','""')}","${x.username||''}","${x.role||''}","${x.action||''}","${x.module||''}","${String(x.object||'').replaceAll('"','""')}","${String(x.detail||'').replaceAll('"','""')}"\n`);
 downloadBlob(csv,'Ground_Experience_Audit_Log.csv','text/csv;charset=utf-8');
}

/* ---------- Helpers / Rich Content ---------- */
function geEsc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function geSanitizeHTML(input){
 const doc=new DOMParser().parseFromString(String(input||''),'text/html');
 doc.querySelectorAll('script,iframe,object,embed,form,input,button,select,textarea').forEach(x=>x.remove());
 doc.querySelectorAll('*').forEach(el=>{
  [...el.attributes].forEach(a=>{
    if(a.name.toLowerCase().startsWith('on')||a.name.toLowerCase()==='style')el.removeAttribute(a.name);
    if(['href','src'].includes(a.name.toLowerCase())&&/^\s*javascript:/i.test(a.value))el.removeAttribute(a.name);
  });
 });
 return doc.body.innerHTML;
}
async function geRichPaste(ev){
 const items=[...(ev.clipboardData?.items||[])],imgs=items.filter(x=>x.type.startsWith('image/'));
 if(!imgs.length)return;
 ev.preventDefault();
 const html=ev.clipboardData.getData('text/html'),text=ev.clipboardData.getData('text/plain');
 if(html)document.execCommand('insertHTML',false,geSanitizeHTML(html));
 else if(text)document.execCommand('insertText',false,text);
 for(const item of imgs){
  const file=item.getAsFile();if(!file)continue;
  const reader=new FileReader();
  reader.onload=()=>document.execCommand('insertHTML',false,`<p><img src="${reader.result}" alt="Pasted image"></p>`);
  reader.readAsDataURL(file);
 }
}
function geExcerpt(html,n=180){const d=document.createElement('div');d.innerHTML=html||'';const s=(d.textContent||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n).trim()+'…':s}
async function geSetImageFromKey(img,key){
 if(!img||!key)return;try{const f=await GEFiles.get(key);if(f){const u=URL.createObjectURL(f);img.src=u;img.onload=()=>setTimeout(()=>URL.revokeObjectURL(u),1000)}}catch(e){}
}
function geIsAdmin(){return typeof gxCanManage==='function'&&gxCanManage()}
function geIsBranchOffice(){return geAuditUser().role==='Branch Office'}

/* ---------- News content navigation ---------- */
function showContentPanel(name,btn){
 ['Articles','Announcements','Faqs'].forEach(k=>{const e=document.getElementById('contentPanel'+k);if(e)e.style.display=k.toLowerCase()===name?'block':'none'});
 document.querySelectorAll('.content-selector').forEach(x=>x.classList.remove('active'));btn?.classList.add('active');
 if(name==='articles')renderArticles();if(name==='announcements')renderAnnouncements();if(name==='faqs')renderFaqs();
}
function applyNewsRoleUI(){
 document.querySelectorAll('.branch-proposal-only').forEach(x=>x.style.display=geIsBranchOffice()?'':'none');
}

/* ---------- Articles ---------- */
function publishedArticles(){return (data.articles||[]).filter(x=>x.status==='Published').sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))}
function renderArticles(){
 const rows=publishedArticles(),feature=document.getElementById('featuredArticle'),grid=document.getElementById('articleGrid');if(!feature||!grid)return;
 if(!rows.length){feature.innerHTML='<div class="card"><p>Belum ada artikel.</p></div>';grid.innerHTML='';return}
 const f=rows[0];
 feature.innerHTML=`<article class="featured-article">
  <div class="featured-image">${f.coverKey?`<img id="articleCover_${f.id}" alt="${geEsc(f.title)}">`:'<div class="article-cover-placeholder">GROUND EXPERIENCE</div>'}</div>
  <div class="featured-copy"><span>Artikel Utama</span><h2>${geEsc(f.title)}</h2><p>${geEsc(geExcerpt(f.content,260))}</p>
   <div class="content-meta">By ${geEsc(f.authorInitial||'-')} • Created by ${geEsc(f.createdBy||'-')} • ${geDateTime(f.createdAt)}</div>
   <button class="btn" onclick="viewArticle(${f.id})">Selengkapnya</button>
   ${geIsAdmin()?`<div class="content-manage"><button class="btn secondary compact-btn" onclick="openArticleEditor(${f.id})">Edit</button><button class="btn danger compact-btn" onclick="deleteArticle(${f.id})">Hapus</button></div>`:''}
  </div></article>`;
 if(f.coverKey)geSetImageFromKey(document.getElementById('articleCover_'+f.id),f.coverKey);
 grid.innerHTML=rows.slice(1).map(x=>`<article class="article-card card">
  <div class="article-card-image">${x.coverKey?`<img id="articleCover_${x.id}" alt="${geEsc(x.title)}">`:'<div class="article-cover-placeholder small">GX</div>'}</div>
  <div><h3>${geEsc(x.title)}</h3><p>${geEsc(geExcerpt(x.content,145))} <button class="read-more-link" onclick="viewArticle(${x.id})">selengkapnya klik</button></p>
  <div class="content-meta">By ${geEsc(x.authorInitial||'-')} • ${geDateTime(x.createdAt)}</div>
  ${geIsAdmin()?`<div class="content-manage"><button class="btn secondary compact-btn" onclick="openArticleEditor(${x.id})">Edit</button><button class="btn danger compact-btn" onclick="deleteArticle(${x.id})">Hapus</button></div>`:''}</div>
 </article>`).join('');
 rows.slice(1).forEach(x=>{if(x.coverKey)geSetImageFromKey(document.getElementById('articleCover_'+x.id),x.coverKey)});
}
function viewArticle(id){
 const x=(data.articles||[]).find(a=>a.id===id);if(!x)return;
 articleViewBody.innerHTML=`<article class="article-full"><h1>${geEsc(x.title)}</h1><div class="content-meta">By ${geEsc(x.authorInitial||'-')} • Created by ${geEsc(x.createdBy||'-')} • ${geDateTime(x.createdAt)}</div><div class="article-full-body">${geSanitizeHTML(x.content)}</div></article>`;
 articleViewModal.classList.add('show');
}
function closeArticleView(){articleViewModal?.classList.remove('show')}
function openArticleEditor(id=null,proposalId=null){
 if(!geIsAdmin())return;
 const x=id?(data.articles||[]).find(a=>a.id===id):null;
 articleEditId.value=x?.id||'';articleTitle.value=x?.title||'';articleAuthorInitial.value=x?.authorInitial||'';
 articleContentEditor.innerHTML=x?.content||'';articleCover.value='';
 articleEditorTitle.textContent=x?'Edit Artikel':'Tulis Artikel';articleEditorModal.dataset.proposalId=proposalId||'';
 articleEditorModal.classList.add('show');
}
function closeArticleEditor(){articleEditorModal?.classList.remove('show')}
async function saveArticle(){
 if(!geIsAdmin())return;
 const title=articleTitle.value.trim(),content=geSanitizeHTML(articleContentEditor.innerHTML),initial=articleAuthorInitial.value.trim();
 if(!title||!content){alert('Judul dan isi artikel wajib diisi.');return}
 const id=Number(articleEditId.value||0),u=geAuditUser();let x=id?(data.articles||[]).find(a=>a.id===id):null;
 let coverKey=x?.coverKey||'',f=articleCover.files?.[0];
 if(f){coverKey='article_cover_'+Date.now();await GEFiles.put(coverKey,f)}
 if(x){x.title=title;x.content=content;x.authorInitial=initial;x.coverKey=coverKey;x.updatedAt=new Date().toISOString()}
 else data.articles.unshift({id:Date.now(),title,content,authorInitial:initial,coverKey,createdBy:u.name||u.username,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),status:'Published'});
 const proposalId=articleEditorModal.dataset.proposalId||'';
 if(proposalId){const p=(data.inbox||[]).find(v=>String(v.id)===String(proposalId));if(p)p.status='Handled';const article=(data.articles||[]).find(v=>v.title===title&&v.content===content);if(article)article.proposalId=proposalId}
 save();closeArticleEditor();renderArticles();renderAdminOverview();
}
function deleteArticle(id){if(geIsAdmin()&&confirm('Hapus artikel ini?')){data.articles=data.articles.filter(x=>x.id!==id);save();renderArticles()}}
function openArticleProposal(){if(!geIsBranchOffice())return;proposalTitle.value='';proposalAuthorInitial.value='';proposalContentEditor.innerHTML='';articleProposalModal.classList.add('show')}
function closeArticleProposal(){articleProposalModal?.classList.remove('show')}
async function submitArticleProposal(){
 if(!geIsBranchOffice())return;
 const title=proposalTitle.value.trim(),content=geSanitizeHTML(proposalContentEditor.innerHTML);
 if(!title||!content){alert('Judul dan isi artikel wajib diisi.');return}
 try{submitInbox('Article Proposal','Usulan Artikel: '+title,content,{title,authorInitial:proposalAuthorInitial.value.trim()});await window.GEStore.flush();closeArticleProposal();alert('Proposal artikel berhasil dikirim ke Admin/Pengelola.')}catch(error){alert('Proposal artikel gagal dikirim: '+error.message)}
}
function reviewProposal(id){
 const p=(data.inbox||[]).find(x=>String(x.id)===String(id));if(!p||!geIsAdmin())return;
 openArticleEditor(null,id);articleTitle.value=p.title||String(p.subject||'').replace(/^Usulan Artikel: /,'');articleAuthorInitial.value=p.authorInitial||'';articleContentEditor.innerHTML=geSanitizeHTML(p.body);
 closeInboxDetail();
}

/* ---------- Announcements ---------- */
function renderAnnouncements(){
 const box=document.getElementById('announcementList');if(!box)return;
 const rows=(data.announcements||[]).filter(x=>x.status==='Published').sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
 box.innerHTML=rows.map(x=>`<article class="announcement-card card"><div class="announcement-date">${geDateTime(x.createdAt)}</div><h3>${geEsc(x.title)}</h3><div>${geSanitizeHTML(x.content)}</div>
 ${geIsAdmin()?`<div class="content-manage"><button class="btn secondary compact-btn" onclick="openAnnouncementEditor(${x.id})">Edit</button><button class="btn danger compact-btn" onclick="deleteAnnouncement(${x.id})">Hapus</button></div>`:''}</article>`).join('');
}
function openAnnouncementEditor(id=null){if(!geIsAdmin())return;const x=id?(data.announcements||[]).find(v=>v.id===id):null;announcementEditId.value=x?.id||'';announcementTitle.value=x?.title||'';announcementContent.innerHTML=x?.content||'';announcementEditorTitle.textContent=x?'Edit Pengumuman':'Tambah Pengumuman';announcementEditorModal.classList.add('show')}
function closeAnnouncementEditor(){announcementEditorModal?.classList.remove('show')}
function saveAnnouncement(){if(!geIsAdmin())return;const title=announcementTitle.value.trim(),content=geSanitizeHTML(announcementContent.innerHTML),id=Number(announcementEditId.value||0),u=geAuditUser();if(!title||!content)return alert('Judul dan isi wajib diisi.');const x=id?(data.announcements||[]).find(v=>v.id===id):null;if(x){x.title=title;x.content=content;x.updatedAt=new Date().toISOString()}else data.announcements.unshift({id:Date.now(),title,content,createdBy:u.name||u.username,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),status:'Published'});save();closeAnnouncementEditor();renderAnnouncements()}
function deleteAnnouncement(id){if(geIsAdmin()&&confirm('Hapus pengumuman ini?')){data.announcements=data.announcements.filter(x=>x.id!==id);save();renderAnnouncements()}}

/* ---------- FAQ ---------- */
function renderFaqs(){
 const box=document.getElementById('faqList');if(!box)return;
 box.innerHTML=(data.faqs||[]).filter(x=>x.status==='Published').map(x=>`<details class="faq-item card"><summary>${geEsc(x.question)}</summary><p>${geEsc(x.answer).replace(/\n/g,'<br>')}</p>${geIsAdmin()?`<div class="content-manage"><button class="btn secondary compact-btn" onclick="openFaqEditor(${x.id})">Edit</button><button class="btn danger compact-btn" onclick="deleteFaq(${x.id})">Hapus</button></div>`:''}</details>`).join('');
}
function openFaqEditor(id=null){if(!geIsAdmin())return;const x=id?(data.faqs||[]).find(v=>v.id===id):null;faqEditId.value=x?.id||'';faqQuestion.value=x?.question||'';faqAnswer.value=x?.answer||'';faqEditorTitle.textContent=x?'Edit FAQ':'Tambah FAQ';faqEditorModal.classList.add('show')}
function closeFaqEditor(){faqEditorModal?.classList.remove('show')}
function saveFaq(){if(!geIsAdmin())return;const question=faqQuestion.value.trim(),answer=faqAnswer.value.trim(),id=Number(faqEditId.value||0),u=geAuditUser();if(!question||!answer)return alert('Pertanyaan dan jawaban wajib diisi.');const x=id?(data.faqs||[]).find(v=>v.id===id):null;if(x){x.question=question;x.answer=answer;x.updatedAt=new Date().toISOString()}else data.faqs.unshift({id:Date.now(),question,answer,createdBy:u.name||u.username,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),status:'Published'});save();closeFaqEditor();renderFaqs()}
function deleteFaq(id){if(geIsAdmin()&&confirm('Hapus FAQ ini?')){data.faqs=data.faqs.filter(x=>x.id!==id);save();renderFaqs()}}

/* ---------- Contact / Guestbook ---------- */
function supportActor(){const u=geAuditUser();return {id:String(u.uid||u.id||''),name:u.name||u.username||u.email||'User',area:u.unit||(u.airports||[]).join(', ')||''}}
function supportList(){const holder=document.getElementById('supportConversations');if(!holder)return;holder.innerHTML='<h3>Percakapan Bantuan</h3>'+((data.contactMessages||[]).length?(data.contactMessages||[]).map(x=>`<button type="button" class="btn secondary" data-support-id="${geEsc(x.id)}" style="display:block;margin:8px 0;width:100%;text-align:left">${geEsc(x.subject||'Permintaan Bantuan')} · ${geEsc(x.status||'Open')}</button>`).join(''):'<p>Belum ada percakapan.</p>');holder.querySelectorAll('[data-support-id]').forEach(b=>b.onclick=()=>openSupportConversation(b.dataset.supportId))}
function openSupportConversation(id){
 const x=(data.contactMessages||[]).find(v=>String(v.id)===String(id));if(!x){alert('Percakapan tidak tersedia atau akses Anda telah berubah.');return}
 let modal=document.getElementById('supportConversationModal');if(!modal){modal=document.createElement('div');modal.id='supportConversationModal';modal.className='modal-backdrop';modal.innerHTML='<div class="modal-card" style="max-width:720px;max-height:85vh;overflow:auto"><button type="button" class="modal-x" id="supportClose">×</button><div id="supportConversationBody"></div></div>';document.body.appendChild(modal);modal.querySelector('#supportClose').onclick=()=>modal.classList.remove('show')}
 modal.querySelector('#supportConversationBody').innerHTML=`<h2>${geEsc(x.subject)}</h2><p>${geEsc(x.senderName||'-')} · ${geEsc(x.senderArea||'-')}</p><div>${(x.messages||[]).map(m=>`<div class="card" style="padding:12px;margin:8px 0"><b>${geEsc(m.senderName||'User')}</b><small> · ${geDateTime(m.at)}</small><p>${geEsc(m.body||'').replace(/\n/g,'<br>')}</p></div>`).join('')}</div><form id="supportReplyForm"><label>Balasan<textarea id="supportReplyText" required rows="3"></textarea></label><button class="btn" type="submit">Kirim Balasan</button></form>`;
 modal.querySelector('#supportReplyForm').onsubmit=async e=>{e.preventDefault();const input=modal.querySelector('#supportReplyText'),reply=input.value.trim();if(!reply)return;const actor=supportActor(),button=e.target.querySelector('button');button.disabled=true;try{x.messages=[...(x.messages||[]),{actorId:actor.id,senderName:actor.name,body:reply,at:new Date().toISOString()}];window.GEStore.save(data);await window.GEStore.flush();openSupportConversation(id);supportList()}catch(error){x.messages.pop();alert('Balasan gagal disimpan: '+error.message)}finally{button.disabled=false}};
 modal.classList.add('show');
}
async function submitContactMessage(){
 const name=contactName.value.trim(),email=contactEmail.value.trim(),subject=contactSubject.value.trim(),body=contactMessage.value.trim();if(!name||!email||!subject||!body)return;
 const actor=supportActor(),row={id:String(Date.now())+'-'+Math.random().toString(36).slice(2,7),subject,message:body,senderName:actor.name,senderArea:actor.area,email,ownerUserId:actor.id,status:'Open',messages:[{actorId:actor.id,senderName:actor.name,body,at:new Date().toISOString()}]};
 data.contactMessages=data.contactMessages||[];data.contactMessages.unshift(row);
 try{window.GEStore.save(data);await window.GEStore.flush();contactMessageForm.reset();supportList();openSupportConversation(row.id);alert('Permintaan bantuan berhasil dikirim. Balasan akan muncul di percakapan ini.')}catch(error){data.contactMessages=data.contactMessages.filter(x=>x!==row);alert('Permintaan bantuan gagal dikirim: '+error.message)}
}
async function submitGuestbook(){
 const name=guestbookName.value.trim(),body=guestbookMessage.value.trim();if(!name||!body)return;
 const actor=supportActor();try{submitInbox('Suggestion / Guest Book','Saran Baru: '+body.slice(0,50),body,{senderName:actor.name,senderArea:actor.area,recipientId:''});await window.GEStore.flush();guestbookForm.reset();alert('Saran berhasil dikirim.')}catch(error){alert('Saran gagal dikirim: '+error.message)}
}

/* ---------- Page initialization ---------- */
function geInitV213(){
 renderAdminOverview();renderAdminInbox();renderAuditLogs();applyNewsRoleUI();renderArticles();renderAnnouncements();renderFaqs();renderUserAccounts();
}
window.addEventListener('DOMContentLoaded',geInitV213);


/* ==============================================================
   V2.14 — Airport Master + Derived Lounge Metrics + Dynamic Map
   ============================================================== */
function geAirportGM(code){
  const rows=(data.personnel||[]).filter(p=>
    String(p.airport||'').trim().toUpperCase()===String(code||'').trim().toUpperCase() &&
    String(p.function||'').trim().toUpperCase()==='GM'
  );
  return rows.length?rows.map(x=>x.name).join(' / '):'Belum tersedia';
}
function geLoungeAirportMatches(loungeAirport,code){
  const codes=String(loungeAirport||'').toUpperCase().split('/').map(x=>x.trim()).filter(Boolean);
  return codes.includes(String(code||'').toUpperCase());
}
function geAirportLoungeContracts(code){
  return (data.lounges||[]).filter(l=>geLoungeAirportMatches(l.airport,code));
}
function geContractNeedsFollowup(l){
  const ds=String(l.documentStatus||'').trim().toLowerCase();
  const dn=String(l.documentNumber||'').trim();
  const dt=String(l.documentType||'').trim();
  const remarks=String(l.remarks||'').toLowerCase();
  const expired=!!l.endDate && new Date(l.endDate+'T23:59:59') < new Date();
  const invalidStatus=ds!=='valid';
  const missingDoc=!dn||dn==='-'||!dt||dt==='-';
  const flagged=[
    'belum ada pks','sedang dalam proses','masih dalam proses',
    'belum dilakukan perpanjangan','dokumen tidak valid',
    'belum ada ba','draft pks','proses perpanjangan'
  ].some(k=>remarks.includes(k));
  return expired||invalidStatus||missingDoc||flagged;
}
function geAirportPendingContracts(code){
  return geAirportLoungeContracts(code).filter(geContractNeedsFollowup).length;
}
function geAirportVisitorCount(code){
  return (data.loungeVisitors||[]).filter(v=>String(v.airport||'').trim().toUpperCase()===String(code||'').trim().toUpperCase()).length;
}
function geAirportDerived(a){
  const contracts=geAirportLoungeContracts(a.code);
  return {
    ...a,
    gm:geAirportGM(a.code),
    visitorLounge:geAirportVisitorCount(a.code),
    contracts:contracts.length,
    pending:contracts.filter(geContractNeedsFollowup).length
  };
}
function geAirportCanonicalR8(a){
  const code=String(a?.code||a?.airportCode||a?.iata||a?.station||a?.stationCode||'').trim().toUpperCase();
  const GEO={CGK:[-6.1256,106.6559],DPS:[-8.7482,115.1672],SUB:[-7.3798,112.7873],KNO:[3.6422,98.8853],UPG:[-5.0616,119.5540],BPN:[-1.2683,116.8945],HLP:[-6.2666,106.8910],YIA:[-7.9053,110.0573],BDO:[-6.9006,107.5763],KOE:[-10.1716,123.6711],AAP:[-0.3744,117.2494],BDJ:[-3.4424,114.7626],BKS:[-3.8637,102.3390],PLM:[-2.8983,104.6999],PKU:[0.4608,101.4445],PDG:[-0.7869,100.2800],JOG:[-7.7882,110.4318],SRG:[-6.9707,110.3741],SOC:[-7.5161,110.7569],LOP:[-8.7573,116.2767],MDC:[1.5493,124.9263],AMQ:[-3.7103,128.0891],DJJ:[-2.5769,140.5164],TIM:[-4.5283,136.8874],SOQ:[-0.8940,131.2870],HKG:[22.3080,113.9185],SIN:[1.3644,103.9915],KUL:[2.7456,101.7099],BKK:[13.6900,100.7501],NRT:[35.7720,140.3929],HND:[35.5494,139.7798],ICN:[37.4602,126.4407],SYD:[-33.9399,151.1753],MEL:[-37.6690,144.8410],JED:[21.6702,39.1525],MED:[24.5534,39.7051],AMS:[52.3105,4.7683]};
  let lat=Number(a?.lat??a?.latitude??a?.coordinates?.lat??0),lon=Number(a?.lon??a?.lng??a?.longitude??a?.coordinates?.lng??0);if((!Number.isFinite(lat)||!Number.isFinite(lon)||(lat===0&&lon===0))&&GEO[code]){[lat,lon]=GEO[code]}
  return {...a,code,city:a?.city||a?.location||a?.airportCity||'',airportName:a?.airportName||a?.name||a?.airport||'',wilayah:a?.wilayah||a?.serviceRegion||a?.networkRegion||a?.region||'Domestik',region:a?.region||a?.countryRegion||a?.networkRegion||'',status:a?.status||'Active',gm:a?.gm||a?.generalManager||a?.manager||'',lat,lon};
}
function geAirportVisibleRows(){
  const base=[...(data.airports||[])],seen=new Set(base.map(x=>String(x.code||x.airportCode||x.iata||x.station||x.stationCode||'').toUpperCase()).filter(Boolean));
  const add=(code,src={})=>{code=String(code||'').trim().toUpperCase();if(code&&!seen.has(code)){seen.add(code);base.push({...src,code,status:src.status||'Active'})}};
  ;['lounges','serviceProcurement','stationMaterials','airportSystems','facilities','assets'].forEach(k=>(data[k]||[]).forEach(x=>add(x.airport||x.station||x.stationCode||x.code,x)));
  return base.map(geAirportCanonicalR8).filter(a=>a.code&&Number.isFinite(Number(a.lat))&&Number.isFinite(Number(a.lon))&&!(Number(a.lat)===0&&Number(a.lon)===0)&&(typeof gxAirportAllowed!=='function'||gxAirportAllowed(a.code))).map(geAirportDerived);
}
function geSetAirportStatus(code,status){
  if(!(typeof gxCanManage==='function'&&gxCanManage()))return;
  const a=(data.airports||[]).find(x=>x.code===code);if(!a)return;
  a.status=status;save();renderAirports();renderAirportMapMarkers();
}
function populateAirportMasterFilters(){
  const rows=geAirportVisibleRows();
  const fill=(id,label,vals)=>{
    const e=document.getElementById(id);if(!e)return;const cur=e.value;
    e.innerHTML=`<option value="">${label}</option>`+[...new Set(vals.filter(Boolean))].sort().map(x=>`<option>${x}</option>`).join('');
    e.value=cur;
  };
  fill('airportWilayahFilter','Semua Wilayah',rows.map(x=>x.wilayah));
  fill('airportRegionFilter','Semua Region',rows.map(x=>x.region));
}
function airportMasterFiltered(){
  const q=(document.getElementById('airportSearch')?.value||'').toLowerCase();
  const w=document.getElementById('airportWilayahFilter')?.value||'';
  const r=document.getElementById('airportRegionFilter')?.value||'';
  const s=document.getElementById('airportStatusFilter')?.value||'';
  return geAirportVisibleRows().filter(a=>
    (!q||`${a.code} ${a.city} ${a.gm}`.toLowerCase().includes(q))&&
    (!w||a.wilayah===w)&&(!r||a.region===r)&&(!s||a.status===s)
  );
}
function renderAirports(){
  const t=document.getElementById('airportRows');if(!t)return;
  populateAirportMasterFilters();
  const rows=airportMasterFiltered(),can=typeof gxCanManage==='function'&&gxCanManage();
  t.innerHTML=rows.map((a,i)=>`<tr>
    <td>${a.no||i+1}</td>
    <td><b>${a.code}</b></td><td>${a.city}</td><td>${a.wilayah}</td><td>${a.region||'-'}</td>
    <td>${can?`<select class="inline-status-select ${a.status==='Inactive'?'inactive':''}" onchange="geSetAirportStatus('${a.code}',this.value)"><option ${a.status==='Active'?'selected':''}>Active</option><option ${a.status==='Inactive'?'selected':''}>Inactive</option></select>`:`<span class="pill ${a.status==='Inactive'?'danger':''}">${a.status}</span>`}</td>
    <td>${a.gm}</td><td>${Number(a.visitorLounge).toLocaleString('id-ID')}</td><td>${a.contracts}</td>
    <td>${a.pending?`<span class="pending-count">${a.pending}</span>`:'<span class="clear-count">0</span>'}</td>
  </tr>`).join('');

  const all=geAirportVisibleRows(),set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  set('airportMasterTotal',all.length);
  set('airportMasterActive',all.filter(x=>x.status==='Active').length);
  set('airportMasterInactive',all.filter(x=>x.status==='Inactive').length);
  set('airportMasterContracts',all.reduce((s,x)=>s+x.contracts,0));
  set('airportMasterPending',all.reduce((s,x)=>s+x.pending,0));
  if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}

/* ---------- Dynamic world map ---------- */
let GE_MAP_REGION='';
const GE_MAP_ZOOM={
  '':{scale:1,origin:'50% 50%',label:'World View'},
  'Domestik':{scale:3.25,origin:'82.5% 52%',label:'Indonesia / Domestic View'},
  'Asia':{scale:1.95,origin:'78% 38%',label:'Asia View'},
  'Middle East':{scale:2.25,origin:'61.5% 39%',label:'Middle East View'},
  'Europe':{scale:2.15,origin:'51% 28%',label:'Europe View'},
  'Asia Pacific':{scale:2.15,origin:'88% 66%',label:'Asia Pacific View'}
};
function geMapPosition(lat,lon){
  return {left:((Number(lon)+180)/360*100),top:((90-Number(lat))/180*100)};
}
function geMapFilteredAirports(){
  const q=(document.getElementById('mapAirportSearch')?.value||'').toLowerCase();
  const status=document.getElementById('mapStatusFilter')?.value||'';
  const pending=document.getElementById('mapPendingFilter')?.value||'';
  return geAirportVisibleRows().filter(a=>
    (!GE_MAP_REGION||a.wilayah===GE_MAP_REGION)&&
    (!q||`${a.code} ${a.city} ${a.gm}`.toLowerCase().includes(q))&&
    (!status||a.status===status)&&
    (!pending||(pending==='pending'?a.pending>0:a.pending===0))
  );
}
function renderAirportMapMarkers(){
  const layer=document.getElementById('airportMarkerLayer');if(!layer)return;
  const rows=geMapFilteredAirports();
  layer.innerHTML=rows.map(a=>{
    const p=geMapPosition(a.lat,a.lon);
    return `<button class="airport-marker airport-marker-v214 ${a.status==='Inactive'?'inactive':''} ${a.pending?'has-pending':''}"
      style="left:${p.left}%;top:${p.top}%"
      data-code="${a.code}" data-region="${a.wilayah}" aria-label="${a.code} ${a.city}"
      onmouseenter="showAirportTooltip(event,'${a.code}')" onmouseleave="hideAirportTooltip()"
      onclick="selectAirport('${a.code}',this)"><span>${a.code}</span></button>`;
  }).join('');
}
function geAirportInfo(code){
  const a=(data.airports||[]).find(x=>x.code===code);return a?geAirportDerived(a):null;
}
function showAirportTooltip(ev,code){
  const d=geAirportInfo(code),t=document.getElementById('mapTooltip'),m=document.getElementById('interactiveMap');if(!d||!t||!m)return;
  const mr=m.getBoundingClientRect(),er=ev.currentTarget.getBoundingClientRect();
  t.innerHTML=`<div class="tooltip-airport-head"><b>${d.code} — ${geEsc(d.city)}</b><span class="${d.status==='Active'?'status-active':'status-inactive'}">${d.status}</span></div>
    <small>${geEsc(d.wilayah)} • ${geEsc(d.region||'-')}</small>
    <div class="tooltip-grid">
      <span>GM<b>${geEsc(d.gm)}</b></span>
      <span>Visitor Lounge<b>${Number(d.visitorLounge).toLocaleString('id-ID')}</b></span>
      <span>Kontrak<b>${d.contracts}</b></span>
      <span>Pending<b>${d.pending}</b></span>
    </div>`;
  t.style.left=Math.min(mr.width-145,Math.max(145,er.left-mr.left+er.width/2))+'px';
  t.style.top=Math.max(120,er.top-mr.top)+'px';t.classList.add('show');
}
function hideAirportTooltip(){document.getElementById('mapTooltip')?.classList.remove('show')}
function selectAirport(code,marker){
  document.querySelectorAll('.airport-marker').forEach(x=>x.classList.remove('active'));marker?.classList.add('active');
  const d=geAirportInfo(code),p=document.getElementById('airportDetail');if(!d||!p)return;
  const contractRows=geAirportLoungeContracts(code);
  p.innerHTML=`<div class="code">${d.code}</div><h2>${geEsc(d.city)}</h2>
    <p class="section-subtitle">${geEsc(d.airportName||'Airport / Branch Office')} • ${geEsc(d.wilayah)} • ${geEsc(d.region||'-')}</p>
    <div class="detail-status-line"><span class="${d.status==='Active'?'status-active':'status-inactive'}">${d.status}</span></div>
    <div class="detail-row">General Manager<b>${geEsc(d.gm)}</b></div>
    <div class="detail-row">Visitor Lounge<b>${Number(d.visitorLounge).toLocaleString('id-ID')} visitor</b></div>
    <div class="detail-row">Kontrak Lounge<b>${d.contracts} kontrak</b></div>
    <div class="detail-row">Pending Contract<b>${d.pending} item</b></div>
    <div class="detail-row">Koordinat<b>${Number(d.lat).toFixed(4)}, ${Number(d.lon).toFixed(4)}</b></div>
    ${contractRows.length?`<div class="map-contract-mini"><span>Provider Lounge</span>${contractRows.slice(0,4).map(l=>`<div>${geEsc(l.name)}<b>${geContractNeedsFollowup(l)?'Follow-up':'OK'}</b></div>`).join('')}${contractRows.length>4?`<small>+${contractRows.length-4} provider lainnya</small>`:''}</div>`:''}`;
}
function filterAirportMap(region,button){
  GE_MAP_REGION=region||'';
  document.querySelectorAll('.map-chip').forEach(x=>x.classList.remove('active'));button?.classList.add('active');
  const cfg=GE_MAP_ZOOM[GE_MAP_REGION]||GE_MAP_ZOOM[''],stage=document.getElementById('mapStage');
  if(stage){stage.style.transformOrigin=cfg.origin;stage.style.transform=`scale(${cfg.scale})`}
  const label=document.getElementById('mapZoomLabel');if(label)label.textContent=cfg.label;
  hideAirportTooltip();renderAirportMapMarkers();
}
function geInitAirportV214(){renderAirports();renderAirportMapMarkers()}
window.addEventListener('DOMContentLoaded',geInitAirportV214);


/* ==============================================================
   V2.15 — Proportional operational map viewport
   ============================================================== */
let GE_MAP_USER_ZOOM = 1;
const GE_MAP_VIEW_215={
  '':{scale:1.18,origin:'66% 47%',label:'Operational Network View'},
  'Domestik':{scale:1.78,origin:'72% 58%',label:'Indonesia / Domestic View'},
  'Asia':{scale:1.42,origin:'72% 38%',label:'Asia View'},
  'Middle East':{scale:1.62,origin:'40% 37%',label:'Middle East View'},
  'Europe':{scale:1.62,origin:'22% 18%',label:'Europe View'},
  'Asia Pacific':{scale:1.45,origin:'83% 64%',label:'Asia Pacific View'}
};
function geApplyMapView(){
  const stage=document.getElementById('mapStage');if(!stage)return;
  const cfg=GE_MAP_VIEW_215[GE_MAP_REGION]||GE_MAP_VIEW_215[''];
  const scale=Math.max(.85,Math.min(2.6,cfg.scale*GE_MAP_USER_ZOOM));
  stage.style.transformOrigin=cfg.origin;
  stage.style.transform=`scale(${scale})`;
  const label=document.getElementById('mapZoomLabel');
  if(label)label.textContent=`${cfg.label} • ${Math.round(scale*100)}%`;
}
function geMapZoomStep(direction){
  GE_MAP_USER_ZOOM=Math.max(.7,Math.min(1.75,GE_MAP_USER_ZOOM+(direction>0?.12:-.12)));
  geApplyMapView();
}
function geMapResetView(){GE_MAP_USER_ZOOM=1;geApplyMapView()}
function geMapRegionCount(region){
  return geAirportVisibleRows().filter(a=>!region||a.wilayah===region).length;
}
function geUpdateMapRegionCounts(){
  const ids={
    countAllAirport:'',
    countDomesticAirport:'Domestik',
    countAsiaAirport:'Asia',
    countAsiaPacificAirport:'Asia Pacific',
    countMiddleEastAirport:'Middle East',
    countEuropeAirport:'Europe'
  };
  Object.entries(ids).forEach(([id,r])=>{
    const e=document.getElementById(id);if(e)e.textContent=`${geMapRegionCount(r)} Airport`;
  });
}
function filterAirportMap(region,button){
  GE_MAP_REGION=region||'';GE_MAP_USER_ZOOM=1;
  document.querySelectorAll('.map-chip,.map-region-cards button').forEach(x=>x.classList.remove('active'));
  if(button)button.classList.add('active');
  document.querySelectorAll(`.map-chip[data-region="${GE_MAP_REGION}"]`).forEach(x=>x.classList.add('active'));
  hideAirportTooltip();renderAirportMapMarkers();geApplyMapView();geUpdateMapRegionCounts();
}
function geMapPosition(lat,lon){
  /* Crop the unused Americas by projecting only the operational longitude window.
     Longitudes outside this window are clamped instead of consuming half the map. */
  const minLon=-15,maxLon=155,minLat=-48,maxLat=68;
  const x=(Math.max(minLon,Math.min(maxLon,Number(lon)))-minLon)/(maxLon-minLon)*100;
  const y=(maxLat-Math.max(minLat,Math.min(maxLat,Number(lat))))/(maxLat-minLat)*100;
  return {left:x,top:y};
}
function showAirportTooltip(ev,code){
  const d=geAirportInfo(code),t=document.getElementById('mapTooltip'),m=document.getElementById('interactiveMap');
  if(!d||!t||!m)return;
  t.innerHTML=`<div class="tooltip-airport-head"><b>${d.code} — ${geEsc(d.city)}</b><span class="${d.status==='Active'?'status-active':'status-inactive'}">${d.status}</span></div>
    <small>${geEsc(d.wilayah)} • ${geEsc(d.region||'-')}</small>
    <div class="tooltip-grid">
      <span>GM<b>${geEsc(d.gm)}</b></span><span>Visitor Lounge<b>${Number(d.visitorLounge).toLocaleString('id-ID')}</b></span>
      <span>Kontrak<b>${d.contracts}</b></span><span>Pending<b>${d.pending}</b></span>
    </div>`;
  const mr=m.getBoundingClientRect(),er=ev.currentTarget.getBoundingClientRect();
  const tooltipW=310, tooltipH=185;
  let left=er.left-mr.left+er.width/2;
  let top=er.top-mr.top-tooltipH-18;
  if(top<12) top=er.bottom-mr.top+14;
  left=Math.max(tooltipW/2+12,Math.min(mr.width-tooltipW/2-12,left));
  top=Math.max(12,Math.min(mr.height-tooltipH-12,top));
  t.style.left=left+'px';t.style.top=top+'px';t.classList.add('show');
}
window.addEventListener('DOMContentLoaded',()=>{geUpdateMapRegionCounts();geApplyMapView()});


/* ==============================================================
   V2.16 — True Geographic Airport Map
   Geographic bounds match assets/garuda_operational_map.svg:
   longitude -20..180, latitude -50..75.
   ============================================================== */
let GE_MAP_USER_ZOOM_216 = 1;

const GE_MAP_VIEW_216 = {
  '':             {scale:1.00, origin:'62% 50%', label:'Operational Network'},
  'Domestik':     {scale:2.18, origin:'70% 66%', label:'Indonesia / Domestic'},
  'Asia':         {scale:1.52, origin:'66% 34%', label:'Asia'},
  'Middle East':  {scale:1.78, origin:'37% 38%', label:'Middle East'},
  'Europe':       {scale:1.70, origin:'20% 15%', label:'Europe'},
  'Asia Pacific': {scale:1.55, origin:'82% 68%', label:'Asia Pacific'}
};

function geMapPosition(lat,lon){
  const minLon=-20,maxLon=180,minLat=-50,maxLat=75;
  const x=(Math.max(minLon,Math.min(maxLon,Number(lon)))-minLon)/(maxLon-minLon)*100;
  const y=(maxLat-Math.max(minLat,Math.min(maxLat,Number(lat))))/(maxLat-minLat)*100;
  return {left:x,top:y};
}

function geApplyMapView(){
  const stage=document.getElementById('mapStage'); if(!stage)return;
  const cfg=GE_MAP_VIEW_216[GE_MAP_REGION]||GE_MAP_VIEW_216[''];
  const scale=Math.max(.82,Math.min(3.15,cfg.scale*GE_MAP_USER_ZOOM_216));
  stage.style.transformOrigin=cfg.origin;
  stage.style.transform=`scale(${scale})`;

  const label=document.getElementById('mapZoomLabel');
  if(label)label.textContent=`${cfg.label} • ${Math.round(scale*100)}%`;
}

function geMapZoomStep(direction){
  GE_MAP_USER_ZOOM_216=Math.max(.72,Math.min(1.65,GE_MAP_USER_ZOOM_216+(direction>0?.12:-.12)));
  geApplyMapView();
}
function geMapResetView(){
  GE_MAP_USER_ZOOM_216=1;
  GE_MAP_REGION='';
  document.querySelectorAll('.map-chip,.map-region-cards button').forEach(x=>x.classList.remove('active'));
  document.querySelector('.map-region-cards button:first-child')?.classList.add('active');
  document.querySelector('.map-chip[data-region=""]')?.classList.add('active');
  renderAirportMapMarkers();
  geApplyMapView();
}

function filterAirportMap(region,button){
  GE_MAP_REGION=region||'';
  GE_MAP_USER_ZOOM_216=1;

  document.querySelectorAll('.map-chip,.map-region-cards button').forEach(x=>x.classList.remove('active'));
  if(button)button.classList.add('active');
  document.querySelectorAll(`.map-chip[data-region="${GE_MAP_REGION}"]`).forEach(x=>x.classList.add('active'));

  hideAirportTooltip();
  renderAirportMapMarkers();
  geApplyMapView();
  geUpdateMapRegionCounts();
}

function renderAirportMapMarkers(){
  const layer=document.getElementById('airportMarkerLayer');if(!layer)return;
  const rows=geMapFilteredAirports();

  layer.innerHTML=rows.map(a=>{
    const p=geMapPosition(a.lat,a.lon);
    return `<button class="airport-marker airport-marker-v216 ${a.status==='Inactive'?'inactive':''} ${a.pending?'has-pending':''}"
      style="left:${p.left}%;top:${p.top}%"
      data-code="${a.code}" data-region="${a.wilayah}" aria-label="${a.code} ${a.city}"
      onmouseenter="showAirportTooltip(event,'${a.code}')"
      onmouseleave="hideAirportTooltip()"
      onclick="selectAirport('${a.code}',this)">
      <span>${a.code}</span>
    </button>`;
  }).join('');
}

function showAirportTooltip(ev,code){
  const d=geAirportInfo(code),t=document.getElementById('mapTooltip'),m=document.getElementById('interactiveMap');
  if(!d||!t||!m)return;

  t.innerHTML=`<div class="tooltip-airport-head">
      <b>${d.code} — ${geEsc(d.city)}</b>
      <span class="${d.status==='Active'?'status-active':'status-inactive'}">${d.status}</span>
    </div>
    <small>${geEsc(d.wilayah)} • ${geEsc(d.region||'-')}</small>
    <div class="tooltip-grid">
      <span>GM<b>${geEsc(d.gm)}</b></span>
      <span>Visitor Lounge<b>${Number(d.visitorLounge).toLocaleString('id-ID')}</b></span>
      <span>Kontrak<b>${d.contracts}</b></span>
      <span>Pending<b>${d.pending}</b></span>
    </div>`;

  const mr=m.getBoundingClientRect(),er=ev.currentTarget.getBoundingClientRect();
  const tooltipW=318, tooltipH=182;
  let left=er.left-mr.left + er.width/2;
  let top=er.top-mr.top - tooltipH - 15;

  if(top<12) top=er.bottom-mr.top+14;
  left=Math.max(tooltipW/2+12,Math.min(mr.width-tooltipW/2-12,left));
  top=Math.max(12,Math.min(mr.height-tooltipH-12,top));

  t.style.left=left+'px';
  t.style.top=top+'px';
  t.classList.add('show');
}

function geUpdateMapRegionCounts(){
  const all=geAirportVisibleRows();
  const map={
    countAllAirport:'',
    countDomesticAirport:'Domestik',
    countAsiaAirport:'Asia',
    countAsiaPacificAirport:'Asia Pacific',
    countMiddleEastAirport:'Middle East',
    countEuropeAirport:'Europe'
  };
  Object.entries(map).forEach(([id,r])=>{
    const e=document.getElementById(id);if(!e)return;
    e.textContent=`${all.filter(a=>!r||a.wilayah===r).length} Airport`;
  });
}

/* Wheel zoom is deliberately subtle, and only applies while pointer is over map. */
window.addEventListener('DOMContentLoaded',()=>{
  const map=document.getElementById('interactiveMap');
  if(map){
    map.addEventListener('wheel',e=>{
      if(!e.ctrlKey && Math.abs(e.deltaY)<2)return;
      e.preventDefault();
      GE_MAP_USER_ZOOM_216=Math.max(.72,Math.min(1.65,GE_MAP_USER_ZOOM_216+(e.deltaY<0?.08:-.08)));
      geApplyMapView();
    },{passive:false});
  }
  geUpdateMapRegionCounts();
  geApplyMapView();
  renderAirportMapMarkers();
});


/* ==============================================================
   V2.17 — Super Admin airport marker relocation
   ============================================================== */
let GE_MAP_RELOCATE_217=null;

function geIsSuperAdmin217(){
  const u=(typeof gxGetSession==='function'?gxGetSession():window.GX_CURRENT_USER)||{};
  return u.role==='Super Admin';
}
function geMapToast217(message,type='info'){
  let t=document.getElementById('geMapToast217');
  if(!t){t=document.createElement('div');t.id='geMapToast217';t.className='map-edit-toast-v217';document.body.appendChild(t)}
  t.className='map-edit-toast-v217 '+type;t.textContent=message;t.classList.add('show');
  clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),4200);
}
function geOpenAirportDetail217(code,marker){
  document.querySelectorAll('.airport-marker').forEach(x=>x.classList.remove('active'));marker?.classList.add('active');
  const d=geAirportInfo(code),p=document.getElementById('airportDetail');if(!d||!p)return;
  const contractRows=geAirportLoungeContracts(code);
  p.innerHTML=`<div class="code">${d.code}</div><h2>${geEsc(d.city)}</h2>
    <p class="section-subtitle">${geEsc(d.airportName||'Airport / Branch Office')} • ${geEsc(d.wilayah)} • ${geEsc(d.region||'-')}</p>
    <div class="detail-status-line"><span class="${d.status==='Active'?'status-active':'status-inactive'}">${d.status}</span></div>
    <div class="detail-row">General Manager<b>${geEsc(d.gm)}</b></div>
    <div class="detail-row">Visitor Lounge<b>${Number(d.visitorLounge).toLocaleString('id-ID')} visitor</b></div>
    <div class="detail-row">Kontrak Lounge<b>${d.contracts} kontrak</b></div>
    <div class="detail-row">Pending Contract<b>${d.pending} item</b></div>
    <div class="detail-row">Koordinat<b>${Number(d.lat).toFixed(4)}, ${Number(d.lon).toFixed(4)}</b></div>
    ${geIsSuperAdmin217()?`<div class="map-admin-note-v217">Pemindahan koordinat hanya aktif melalui tombol khusus ini.</div><button type="button" class="btn secondary compact-btn map-relocate-action-r104" onclick="geOpenMoveModal218('${d.code}',document.querySelector('.airport-marker[data-code=&quot;${d.code}&quot;]'))">Pindahkan Koordinat Station</button>`:''}
    ${contractRows.length?`<div class="map-contract-mini"><span>Provider Lounge</span>${contractRows.slice(0,4).map(l=>`<div>${geEsc(l.name)}<b>${geContractNeedsFollowup(l)?'Follow-up':'OK'}</b></div>`).join('')}${contractRows.length>4?`<small>+${contractRows.length-4} provider lainnya</small>`:''}</div>`:''}`;
}
function selectAirport(code,marker){
  hideAirportTooltip();
  if(!geIsSuperAdmin217()){geOpenAirportDetail217(code,marker);return}
  const d=geAirportInfo(code);if(!d)return;
  const move=confirm(`Airport ${d.code} — ${d.city}\
\
Apakah Anda ingin memindahkan titik airport ini?\
\
OK = Ya, pindahkan titik\
Cancel = Tidak, hanya lihat detail`);
  if(!move){geOpenAirportDetail217(code,marker);return}
  GE_MAP_RELOCATE_217=code;
  document.getElementById('interactiveMap')?.classList.add('map-relocate-mode-v217');
  document.querySelectorAll('.airport-marker').forEach(x=>x.classList.remove('relocating'));
  marker?.classList.add('relocating');
  geMapToast217(`Mode pindah aktif untuk ${code}. Geser titik ke lokasi yang benar, lalu lepaskan untuk menyimpan.`,'edit');
}
function geFinishRelocate217(ev,marker){
  const code=GE_MAP_RELOCATE_217;if(!code||!geIsSuperAdmin217())return;
  const stage=document.getElementById('mapStage');if(!stage)return;
  const r=stage.getBoundingClientRect();
  const x=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width));
  const y=Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height));
  const lon=-20+x*200, lat=75-y*125;
  const airport=(data.airports||[]).find(a=>a.code===code);if(!airport)return;
  airport.lat=Number(lat.toFixed(5));airport.lon=Number(lon.toFixed(5));
  save();
  GE_MAP_RELOCATE_217=null;
  document.getElementById('interactiveMap')?.classList.remove('map-relocate-mode-v217');
  renderAirportMapMarkers();
  const newMarker=document.querySelector(`.airport-marker[data-code="${code}"]`);
  geOpenAirportDetail217(code,newMarker);
  geMapToast217(`Lokasi ${code} berhasil diperbarui ke ${airport.lat.toFixed(4)}, ${airport.lon.toFixed(4)}.`,'success');
}
function geBindRelocation217(){
  const layer=document.getElementById('airportMarkerLayer');if(!layer||layer.dataset.relocate217)return;
  layer.dataset.relocate217='1';
  layer.addEventListener('pointerdown',ev=>{
    const marker=ev.target.closest('.airport-marker');
    if(!marker||GE_MAP_RELOCATE_217!==marker.dataset.code)return;
    ev.preventDefault();ev.stopPropagation();marker.setPointerCapture?.(ev.pointerId);marker.dataset.drag217='1';
  });
  layer.addEventListener('pointermove',ev=>{
    const marker=ev.target.closest('.airport-marker');
    if(!marker||marker.dataset.drag217!=='1'||GE_MAP_RELOCATE_217!==marker.dataset.code)return;
    const stage=document.getElementById('mapStage'),r=stage.getBoundingClientRect();
    const left=Math.max(0,Math.min(100,(ev.clientX-r.left)/r.width*100));
    const top=Math.max(0,Math.min(100,(ev.clientY-r.top)/r.height*100));
    marker.style.left=left+'%';marker.style.top=top+'%';
  });
  layer.addEventListener('pointerup',ev=>{
    const marker=ev.target.closest('.airport-marker');
    if(!marker||marker.dataset.drag217!=='1')return;
    marker.dataset.drag217='0';geFinishRelocate217(ev,marker);
  });
}
const GE_RENDER_MAP_216=renderAirportMapMarkers;
renderAirportMapMarkers=function(){GE_RENDER_MAP_216();geBindRelocation217();};
window.addEventListener('DOMContentLoaded',()=>{geBindRelocation217();renderAirportMapMarkers();});


/* ==============================================================
   V2.18 — Professional Airport Relocation UX
   ============================================================== */
let GE_MOVE_PENDING_218=null;

function geOpenMoveModal218(code,marker){
  const d=geAirportInfo(code);if(!d)return;
  GE_MOVE_PENDING_218={code,marker};
  const modal=document.getElementById('airportMoveModal');if(!modal)return;

  document.getElementById('airportMoveCode').textContent=d.code||'-';
  document.getElementById('airportMoveCity').textContent=d.city||'-';
  document.getElementById('airportMoveCoordinate').textContent=
    `${Number(d.lat).toFixed(5)}, ${Number(d.lon).toFixed(5)}`;
  document.getElementById('airportMoveDescription').textContent=
    `Anda memilih ${d.code} — ${d.city}. Apakah marker akan dipindahkan atau hanya membuka detail airport?`;

  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
}
function geCloseMoveModal218(){
  const modal=document.getElementById('airportMoveModal');
  modal?.classList.remove('show');
  modal?.setAttribute('aria-hidden','true');
}
function geMoveViewDetail218(){
  const p=GE_MOVE_PENDING_218;
  geCloseMoveModal218();
  GE_MOVE_PENDING_218=null;
  if(p)geOpenAirportDetail217(p.code,p.marker);
}
function geMoveConfirm218(){
  const p=GE_MOVE_PENDING_218;if(!p)return;
  geCloseMoveModal218();
  GE_MOVE_PENDING_218=null;
  geStartRelocate218(p.code,p.marker);
}
function geStartRelocate218(code,marker){
  GE_MAP_RELOCATE_217=code;
  const map=document.getElementById('interactiveMap');
  const shell=map?.closest('.airport-map-shell-v216,.airport-map-shell-v215,.airport-map-shell-v214');
  map?.classList.add('map-relocate-mode-v217','map-relocate-focus-v218');
  shell?.classList.add('map-relocate-shell-v218');

  hideAirportTooltip();
  document.querySelectorAll('.airport-marker').forEach(x=>x.classList.remove('relocating'));
  marker?.classList.add('relocating');

  const banner=document.getElementById('mapRelocationBanner218');
  const txt=document.getElementById('mapRelocationBannerText218');
  if(txt)txt.textContent=`${code} — drag marker, lalu lepaskan untuk menyimpan`;
  banner?.classList.add('show');

  geMapToast217(`Mode pindah ${code} aktif. Drag marker dan lepaskan di posisi yang benar.`,'edit');
}
function geEndRelocateFocus218(){
  const map=document.getElementById('interactiveMap');
  const shell=map?.closest('.airport-map-shell-v216,.airport-map-shell-v215,.airport-map-shell-v214');
  map?.classList.remove('map-relocate-mode-v217','map-relocate-focus-v218');
  shell?.classList.remove('map-relocate-shell-v218');
  document.getElementById('mapRelocationBanner218')?.classList.remove('show');
}
function geCancelRelocate218(){
  const code=GE_MAP_RELOCATE_217;
  GE_MAP_RELOCATE_217=null;
  geEndRelocateFocus218();
  renderAirportMapMarkers();
  if(code){
    const marker=document.querySelector(`.airport-marker[data-code="${code}"]`);
    geOpenAirportDetail217(code,marker);
    geMapToast217(`Pemindahan titik ${code} dibatalkan.`,'info');
  }
}

/* Override Super Admin airport click: use internal modal, never browser confirm(). */
selectAirport=function(code,marker){
  hideAirportTooltip();
  if(!geIsSuperAdmin217()){geOpenAirportDetail217(code,marker);return}
  if(GE_MAP_RELOCATE_217){
    if(GE_MAP_RELOCATE_217===code)return;
    geMapToast217('Selesaikan atau batalkan pemindahan titik yang sedang aktif terlebih dahulu.','edit');
    return;
  }
  geOpenMoveModal218(code,marker);
};

/* Disable quick-information overlays while relocating. */
const GE_SHOW_TOOLTIP_217=showAirportTooltip;
showAirportTooltip=function(ev,code){
  if(GE_MAP_RELOCATE_217)return;
  GE_SHOW_TOOLTIP_217(ev,code);
};

/* Finish relocation while preserving the cleaner focus mode. */
geFinishRelocate217=function(ev,marker){
  const code=GE_MAP_RELOCATE_217;if(!code||!geIsSuperAdmin217())return;
  const stage=document.getElementById('mapStage');if(!stage)return;
  const r=stage.getBoundingClientRect();
  const x=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width));
  const y=Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height));
  const lon=-20+x*200,lat=75-y*125;
  const airport=(data.airports||[]).find(a=>a.code===code);if(!airport)return;

  airport.lat=Number(lat.toFixed(5));
  airport.lon=Number(lon.toFixed(5));
  save();

  GE_MAP_RELOCATE_217=null;
  geEndRelocateFocus218();
  renderAirportMapMarkers();

  const newMarker=document.querySelector(`.airport-marker[data-code="${code}"]`);
  geOpenAirportDetail217(code,newMarker);
  geMapToast217(`Lokasi ${code} berhasil diperbarui ke ${airport.lat.toFixed(4)}, ${airport.lon.toFixed(4)}.`,'success');
};

/* ESC closes confirmation or cancels an active relocation. */
window.addEventListener('keydown',ev=>{
  if(ev.key!=='Escape')return;
  if(document.getElementById('airportMoveModal')?.classList.contains('show')){
    geCloseMoveModal218();GE_MOVE_PENDING_218=null;return;
  }
  if(GE_MAP_RELOCATE_217)geCancelRelocate218();
});


/* ==============================================================
   V2.19 — Exact relocation geometry
   Fixes marker jump after drop by using the exact marker-layer
   coordinate space and keeping map dimensions unchanged while editing.
   ============================================================== */

function gePointerToMapFraction219(ev){
  const layer=document.getElementById('airportMarkerLayer');
  if(!layer)return null;
  const r=layer.getBoundingClientRect();
  if(!r.width||!r.height)return null;
  return {
    x:Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width)),
    y:Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height))
  };
}
function geMapFractionToCoordinate219(f){
  return {
    lon:-20 + f.x*200,
    lat:75 - f.y*125
  };
}

/* Keep the right detail column's geometry reserved while relocating.
   The information disappears, but the map itself never changes size. */
geStartRelocate218=function(code,marker){
  GE_MAP_RELOCATE_217=code;
  const map=document.getElementById('interactiveMap');
  const shell=map?.closest('.airport-map-shell-v216,.airport-map-shell-v215,.airport-map-shell-v214');
  map?.classList.add('map-relocate-mode-v217','map-relocate-focus-v218','map-relocate-stable-v219');
  shell?.classList.add('map-relocate-shell-stable-v219');

  hideAirportTooltip();
  document.querySelectorAll('.airport-marker').forEach(x=>x.classList.remove('relocating'));
  marker?.classList.add('relocating');

  const banner=document.getElementById('mapRelocationBanner218');
  const txt=document.getElementById('mapRelocationBannerText218');
  if(txt)txt.textContent=`${code} — drag marker, lalu lepaskan untuk menyimpan`;
  banner?.classList.add('show');

  /* no large bottom toast while repositioning; keep the map unobstructed */
  document.getElementById('geMapToast217')?.classList.remove('show');
};

geEndRelocateFocus218=function(){
  const map=document.getElementById('interactiveMap');
  const shell=map?.closest('.airport-map-shell-v216,.airport-map-shell-v215,.airport-map-shell-v214');
  map?.classList.remove('map-relocate-mode-v217','map-relocate-focus-v218','map-relocate-stable-v219');
  shell?.classList.remove('map-relocate-shell-v218','map-relocate-shell-stable-v219');
  document.getElementById('mapRelocationBanner218')?.classList.remove('show');
};

/* Rebind pointer movement using the exact transformed overlay rectangle. */
function geBindRelocation219(){
  const layer=document.getElementById('airportMarkerLayer');
  if(!layer||layer.dataset.relocate219)return;
  layer.dataset.relocate219='1';

  layer.addEventListener('pointerdown',ev=>{
    const marker=ev.target.closest('.airport-marker');
    if(!marker||GE_MAP_RELOCATE_217!==marker.dataset.code)return;
    ev.preventDefault();ev.stopPropagation();
    marker.setPointerCapture?.(ev.pointerId);
    marker.dataset.drag219='1';
  },true);

  layer.addEventListener('pointermove',ev=>{
    const marker=ev.target.closest('.airport-marker');
    if(!marker||marker.dataset.drag219!=='1'||GE_MAP_RELOCATE_217!==marker.dataset.code)return;
    const f=gePointerToMapFraction219(ev);if(!f)return;
    marker.style.left=(f.x*100)+'%';
    marker.style.top=(f.y*100)+'%';
  },true);

  layer.addEventListener('pointerup',ev=>{
    const marker=ev.target.closest('.airport-marker');
    if(!marker||marker.dataset.drag219!=='1')return;
    marker.dataset.drag219='0';
    geFinishRelocate219(ev,marker);
  },true);

  layer.addEventListener('pointercancel',ev=>{
    const marker=ev.target.closest('.airport-marker');
    if(marker)marker.dataset.drag219='0';
  },true);
}

function geFinishRelocate219(ev,marker){
  const code=GE_MAP_RELOCATE_217;
  if(!code||!geIsSuperAdmin217())return;

  const f=gePointerToMapFraction219(ev);if(!f)return;
  const c=geMapFractionToCoordinate219(f);
  const airport=(data.airports||[]).find(a=>a.code===code);if(!airport)return;

  airport.lat=Number(c.lat.toFixed(5));
  airport.lon=Number(c.lon.toFixed(5));
  save();

  GE_MAP_RELOCATE_217=null;
  geEndRelocateFocus218();
  renderAirportMapMarkers();

  const newMarker=document.querySelector(`.airport-marker[data-code="${code}"]`);
  geOpenAirportDetail217(code,newMarker);
  geMapToast217(
    `Lokasi ${code} berhasil diperbarui ke ${airport.lat.toFixed(4)}, ${airport.lon.toFixed(4)}.`,
    'success'
  );
}

/* Override the older pointer binding path so it cannot save a second,
   differently calculated coordinate on the same release. */
geBindRelocation217=function(){geBindRelocation219();};
geFinishRelocate217=function(ev,marker){geFinishRelocate219(ev,marker);};

const GE_RENDER_MAP_219=renderAirportMapMarkers;
renderAirportMapMarkers=function(){
  GE_RENDER_MAP_219();
  geBindRelocation219();
};

window.addEventListener('DOMContentLoaded',()=>{
  geBindRelocation219();
  renderAirportMapMarkers();
});


/* ==============================================================
   V2.20 — Service Planning Architecture
   ============================================================== */
const GE_PLANNING_FIELDS={
 material:[
  ['airport','Airport','text'],['product','Product / Material','text'],['category','Category','text'],
  ['vendor','Vendor','text'],['contractNumber','Contract Number','text'],['startDate','Start','date'],
  ['endDate','End','date'],['status','Status','select:Active|Pending|Expiring|Expired'],['documentName','Document / Reference','text']
 ],
 space:[
  ['airport','Airport','text'],['location','Area / Location','text'],['function','Function','select:Office|Ticketing|Lounge|Storage|Operational Room|Other'],
  ['sizeM2','Size (m²)','number'],['ratePerM2','Harga / m² / Bulan','number'],['landlord','Provider','text'],['startDate','Start','date'],['endDate','End','date'],
  ['currency','Currency','text'],['status','Status','select:Active|Pending|Expiring|Expired'],['documentName','Document / Reference','text']
 ],
 system:[
  ['airport','Airport','text'],['terminal','Terminal','text'],['system','System','select:CUTE|CUPPS'],['provider','Provider','text'],
  ['unit','Counter / Unit','text'],['availability','Availability','select:Available|Partial|Unavailable'],['agreement','Contract / Agreement','text'],['remark','Remark','text']
 ],
 skypriority:[
  ['airport','Airport','text'],['serviceElement','Service Element','text'],['availability','Availability','select:Available|Partial|Not Available'],['reference','Reference','text'],['remark','Remark','text']
 ],
 touchpoint:[
  ['touchpoint','Touch Point','text'],['category','Category','select:People|Process|Premises'],['component','Component','text'],
  ['requirement','Requirement','textarea'],['applicability','Applicability','text'],['reference','Reference','text'],['documentName','Document','text']
 ]
};
const GE_PLANNING_COLLECTION={
 material:'stationMaterials',space:'boSpaces',system:'airportSystems',skypriority:'skyPriority',touchpoint:'touchpointStandards'
};
let GE_PLANNING_EDIT={type:null,id:null};

function gePlanningCanAction(action='View',context={}){
 const s=geSession();if(!s)return false;
 if(s.role==='Management'&&['Create','Edit','Update','Upload','Delete'].includes(action))return false;
 const required=({View:0,Detail:0,Report:0,Create:1,Edit:1,Update:1,Upload:1,Delete:1,Review:2,Verify:2,Approve:2,Configure:3})[action]??1;
 const rank=typeof gxAccessLevelRank==='function'?gxAccessLevelRank():(['Super Admin','Admin'].includes(s.role)?3:0);
 if(rank<required)return false;
 if(typeof GEPermission!=='undefined'&&typeof GEPermission.check==='function'){
   const permissionAction=required>=2?'View':required>=1?'Edit':'View';
   const result=GEPermission.check({user:s,domain:'Shared Objects',action:permissionAction,sensitivity:'Internal',context});
   if(!result.allowed)return false;
 }
 return true;
}
function gePlanningCanManage(){return gePlanningCanAction('Edit')}
function gePlanningAllowedAirport(code){
 return typeof gxAirportAllowed!=='function'||gxAirportAllowed(code);
}
function gePlanningScoped(rows){
 return (rows||[]).filter(x=>!x.airport||gePlanningAllowedAirport(x.airport));
}
function gePlanningStatusByPeriod(x){
 const now=new Date(),end=x.endDate?new Date(x.endDate+'T23:59:59'):null;
 if(end&&end<now)return'Expired';
 if(end){
   const months=(end-now)/(1000*60*60*24*30.44);
   if(months<=5)return'Expiring';
 }
 return x.status||'Active';
}
function gePlanningPopulateSelect(id,values,label){
 const e=document.getElementById(id);if(!e)return;const cur=e.value;
 e.innerHTML=`<option value="">${label}</option>`+[...new Set(values.filter(Boolean))].sort().map(v=>`<option>${geEsc(v)}</option>`).join('');
 e.value=cur;
}
function gePlanningEmpty(id,rows){
 const e=document.getElementById(id);if(!e)return;
 e.innerHTML=rows.length?'':'<div class="planning-empty">Belum ada master data pada modul ini. Struktur sudah siap untuk menerima file referensi berikutnya.</div>';
}

/* Generic Admin/Super Admin CRUD modal */
function openPlanningRecordModal(type,id=null){
 if(!gePlanningCanManage())return;
 const fields=GE_PLANNING_FIELDS[type],coll=GE_PLANNING_COLLECTION[type];if(!fields||!coll)return;
 const x=id?(data[coll]||[]).find(v=>String(v.id)===String(id)):null;
 GE_PLANNING_EDIT={type,id:x?.id||null};
 const titleMap={material:'Station Material',space:'Branch Office Space',system:'Airport System',skypriority:'SkyPriority',touchpoint:'Touch Point Standard'};
 planningRecordTitle.textContent=(x?'Update ':'Tambah ')+(titleMap[type]||'Record');
 planningRecordForm.innerHTML=`<form onsubmit="event.preventDefault();savePlanningRecord()"><div class="formgrid">${
  fields.map(([key,label,kind])=>{
   const val=x?.[key]??'';
   if(kind==='textarea')return`<label>${label}<textarea data-plan-field="${key}" rows="4">${geEsc(val)}</textarea></label>`;
   if(kind.startsWith('select:')){
    const opts=kind.slice(7).split('|');return`<label>${label}<select data-plan-field="${key}">${opts.map(o=>`<option ${String(val)===o?'selected':''}>${o}</option>`).join('')}</select></label>`;
   }
   return`<label>${label}<input data-plan-field="${key}" type="${kind}" value="${geEsc(val)}"></label>`;
  }).join('')
 }</div><div class="modal-actions sticky-actions"><button class="btn">Simpan</button><button type="button" class="btn secondary" onclick="closePlanningRecordModal()">Batal</button></div></form>`;
 document.getElementById('planningRecordModal').classList.add('show');
}
function closePlanningRecordModal(){document.getElementById('planningRecordModal')?.classList.remove('show')}
function savePlanningRecord(){
 if(!gePlanningCanManage())return;
 const {type,id}=GE_PLANNING_EDIT,coll=GE_PLANNING_COLLECTION[type],fields=GE_PLANNING_FIELDS[type];if(!coll)return;
 const obj={id:id||Date.now()};
 document.querySelectorAll('#planningRecordForm [data-plan-field]').forEach(el=>{
  obj[el.dataset.planField]=el.type==='number'?Number(el.value||0):el.value.trim();
 });
 if(obj.airport)obj.airport=obj.airport.toUpperCase();
 if(id)Object.assign((data[coll]||[]).find(x=>x.id===id),obj);else data[coll].push(obj);
 save();closePlanningRecordModal();geRenderPlanningPage();
}
function deletePlanningRecord(type,id){
 if(!gePlanningCanManage()||!confirm('Hapus planning record ini?'))return;
 const coll=GE_PLANNING_COLLECTION[type];data[coll]=(data[coll]||[]).filter(x=>x.id!==id);save();geRenderPlanningPage();
}
function planAction(type,id){return gePlanningCanManage()?`<td><button class="btn secondary compact-btn" onclick="openPlanningRecordModal('${type}',${id})">Update</button><button class="btn danger compact-btn" onclick="deletePlanningRecord('${type}',${id})">Hapus</button></td>`:''}

/* Landing */
function renderPlanningOverview(){
 const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
 const planningMaster=(data.stationMaterials||[]).length+(data.boSpaces||[]).length+(data.airportSystems||[]).length;
 set('planningMaterialCount',(data.stationMaterials||[]).length);
 set('planningLoungeCount',(data.lounges||[]).length);
 set('planningSpaceCount',(data.boSpaces||[]).length);
 set('planningSystemCount',(data.airportSystems||[]).length);
 set('planningStandardCount',(data.skyPriority||[]).length+(data.touchpointStandards||[]).length);
 set('planningDocumentCount',(data.documents||[]).length);
 set('snapshotLounge',(data.lounges||[]).length);
 set('snapshotContractPending',(data.lounges||[]).filter(geContractNeedsFollowup).length);
 set('snapshotAirport',(data.airports||[]).length);
 set('snapshotPlanningMaster',planningMaster);
}

/* Station Material */
function renderStationMaterials(){
 const tbody=document.getElementById('stationMaterialRows');if(!tbody)return;
 const rows=gePlanningScoped(data.stationMaterials||[]);
 gePlanningPopulateSelect('materialAirportFilter',rows.map(x=>x.airport),'Semua Airport');
 gePlanningPopulateSelect('materialCategoryFilter',rows.map(x=>x.category),'Semua Category');
 const q=(materialSearch?.value||'').toLowerCase(),a=materialAirportFilter?.value||'',c=materialCategoryFilter?.value||'',s=materialStatusFilter?.value||'';
 const filtered=rows.filter(x=>{const st=gePlanningStatusByPeriod(x);return(!q||`${x.product} ${x.vendor} ${x.contractNumber}`.toLowerCase().includes(q))&&(!a||x.airport===a)&&(!c||x.category===c)&&(!s||st===s)});
 tbody.innerHTML=filtered.map((x,i)=>`<tr><td>${i+1}</td><td><b>${geEsc(x.airport||'-')}</b></td><td>${geEsc(x.product||'-')}</td><td>${geEsc(x.category||'-')}</td><td>${geEsc(x.vendor||'-')}</td><td>${geEsc(x.contractNumber||'-')}</td><td>${x.startDate||'-'}</td><td>${x.endDate||'-'}</td><td><span class="planning-status">${gePlanningStatusByPeriod(x)}</span></td><td>${geEsc(x.documentName||'-')}</td>${planAction('material',x.id)}</tr>`).join('');
 gePlanningEmpty('stationMaterialEmpty',filtered);if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}

/* Lounge Procurement derived from lounge master */
function geBudgetApprovalForLounge(l){
 const airport=String(l.airport||'').toUpperCase();
 return (data.documents||[]).find(d=>{
   const text=`${d.title||''} ${d.category||''} ${d.note||''} ${d.source||''}`.toLowerCase();
   const related=String(d.airport||d.relatedAirport||'').toUpperCase();
   return (related===airport||text.includes(airport.toLowerCase())) && (text.includes('anggaran')||text.includes('budget')||text.includes('persetujuan'));
 });
}
function renderLoungeProcurement(){
 const tbody=document.getElementById('loungeProcurementRows');if(!tbody)return;
 const rows=geVisibleLoungeRows();
 gePlanningPopulateSelect('procAirportFilter',rows.map(x=>x.airport),'Semua Airport');
 const q=(procSearch?.value||'').toLowerCase(),a=procAirportFilter?.value||'',st=procContractFilter?.value||'';
 const filtered=rows.filter(x=>{const f=geContractNeedsFollowup(x);return(!q||`${x.airport} ${x.name}`.toLowerCase().includes(q))&&(!a||x.airport===a)&&(!st||(st==='followup'?f:!f))});
 tbody.innerHTML=filtered.map((x,i)=>{const b=geBudgetApprovalForLounge(x);return`<tr><td>${i+1}</td><td><b>${geEsc(x.airport)}</b></td><td>${geEsc(x.name)}</td><td>${geEsc(displayLoungePrice(x))}</td><td>${geEsc(loungeStartText(x))} — ${geEsc(loungeEndText(x))}</td><td><span class="planning-status">${geContractNeedsFollowup(x)?'Follow-up':'Covered'}</span></td><td>${b?geEsc(b.title):'Belum terhubung'}</td><td>${geEsc(x.documentNumber||x.documentName||'-')}</td></tr>`}).join('');
 const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
 set('procLoungeTotal',rows.length);set('procContractCovered',rows.filter(x=>!geContractNeedsFollowup(x)).length);set('procContractPending',rows.filter(geContractNeedsFollowup).length);set('procBudgetAvailable',rows.filter(x=>geBudgetApprovalForLounge(x)).length);
 if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}

/* BO Space */
function renderBOSpaces(){
 const tbody=document.getElementById('boSpaceRows');if(!tbody)return;const rows=gePlanningScoped(data.boSpaces||[]);
 gePlanningPopulateSelect('spaceAirportFilter',rows.map(x=>x.airport),'Semua Airport');gePlanningPopulateSelect('spaceFunctionFilter',rows.map(x=>x.function),'Semua Function');gePlanningPopulateSelect('spaceStatusFilter',rows.map(gePlanningStatusByPeriod),'Semua Status');
 const q=(spaceSearch?.value||'').toLowerCase(),a=spaceAirportFilter?.value||'',fn=spaceFunctionFilter?.value||'',st=spaceStatusFilter?.value||'';
 const filtered=rows.filter(x=>{const s=gePlanningStatusByPeriod(x);return(!q||`${x.airport} ${x.landlord} ${x.location}`.toLowerCase().includes(q))&&(!a||x.airport===a)&&(!fn||x.function===fn)&&(!st||s===st)});
 tbody.innerHTML=filtered.map((x,i)=>`<tr><td>${i+1}</td><td><b>${geEsc(x.airport)}</b></td><td>${geEsc(x.location||'-')}</td><td>${geEsc(x.function||'-')}</td><td>${Number(x.sizeM2||0).toLocaleString('id-ID')}</td><td>${geEsc(x.landlord||'-')}</td><td>${x.startDate||'-'} — ${x.endDate||'-'}</td><td>${x.currency||''} ${Number(x.annualCost||0).toLocaleString('id-ID')}</td><td><span class="planning-status">${gePlanningStatusByPeriod(x)}</span></td><td>${geEsc(x.documentName||'-')}</td>${planAction('space',x.id)}</tr>`).join('');
 const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set('spaceTotal',rows.length);set('spaceArea',rows.reduce((s,x)=>s+Number(x.sizeM2||0),0).toLocaleString('id-ID')+' m²');set('spaceCommitment',rows.length?'By Currency':'-');set('spaceExpiring',rows.filter(x=>['Expiring','Expired'].includes(gePlanningStatusByPeriod(x))).length);
 gePlanningEmpty('boSpaceEmpty',filtered);if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}

/* Airport Systems */
function renderAirportSystems(){
 const tbody=document.getElementById('airportSystemRows');if(!tbody)return;const rows=gePlanningScoped(data.airportSystems||[]);
 gePlanningPopulateSelect('systemAirportFilter',rows.map(x=>x.airport),'Semua Airport');
 const q=(systemSearch?.value||'').toLowerCase(),a=systemAirportFilter?.value||'',t=systemTypeFilter?.value||'',av=systemAvailabilityFilter?.value||'';
 const filtered=rows.filter(x=>(!q||`${x.airport} ${x.provider} ${x.terminal}`.toLowerCase().includes(q))&&(!a||x.airport===a)&&(!t||x.system===t)&&(!av||x.availability===av));
 tbody.innerHTML=filtered.map((x,i)=>`<tr><td>${i+1}</td><td><b>${geEsc(x.airport)}</b></td><td>${geEsc(x.terminal||'-')}</td><td>${geEsc(x.system||'-')}</td><td>${geEsc(x.provider||'-')}</td><td>${geEsc(x.unit||'-')}</td><td><span class="planning-status">${geEsc(x.availability||'-')}</span></td><td>${geEsc(x.agreement||'-')}</td><td>${geEsc(x.remark||'-')}</td>${planAction('system',x.id)}</tr>`).join('');
 const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set('systemCUTE',rows.filter(x=>x.system==='CUTE').length);set('systemCUPPS',rows.filter(x=>x.system==='CUPPS').length);set('systemAvailable',rows.filter(x=>x.availability==='Available').length);set('systemFollowup',rows.filter(x=>x.availability&&x.availability!=='Available').length);
 gePlanningEmpty('airportSystemEmpty',filtered);if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}

/* Planning Documents */
function renderPlanningDocuments(){
 const tbody=document.getElementById('planningDocumentRows');if(!tbody)return;const rows=data.documents||[];
 gePlanningPopulateSelect('planningDocCategory',rows.map(x=>x.category),'Semua Category');gePlanningPopulateSelect('planningDocAirport',rows.map(x=>x.airport||x.relatedAirport),'Semua Airport');
 const q=(planningDocSearch?.value||'').toLowerCase(),c=planningDocCategory?.value||'',a=planningDocAirport?.value||'';
 const filtered=rows.filter(x=>(!q||`${x.title} ${x.fileName} ${x.airport||''} ${x.relatedAirport||''}`.toLowerCase().includes(q))&&(!c||x.category===c)&&(!a||(x.airport||x.relatedAirport)===a));
 tbody.innerHTML=filtered.map((x,i)=>`<tr><td>${i+1}</td><td>${x.date||'-'}</td><td>${geEsc(x.category||'-')}</td><td><b>${geEsc(x.title||'-')}</b></td><td>${geEsc(x.airport||x.relatedAirport||'-')}</td><td>${geEsc(x.source||'-')}</td><td>${x.blobKey?`<button class="btn secondary compact-btn" onclick="GEFiles.download('${x.blobKey}','${String(x.fileName||'document').replaceAll("'","")}')">Unduh</button>`:geEsc(x.fileName||'-')}</td></tr>`).join('');
 gePlanningEmpty('planningDocumentEmpty',filtered);if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}

/* SkyPriority */
function renderSkyPriority(){
 const tbody=document.getElementById('skyPriorityRows');if(!tbody)return;const rows=gePlanningScoped(data.skyPriority||[]);
 gePlanningPopulateSelect('skyAirportFilter',rows.map(x=>x.airport),'Semua Airport');gePlanningPopulateSelect('skyServiceFilter',rows.map(x=>x.serviceElement),'Semua Service Element');
 const a=skyAirportFilter?.value||'',s=skyServiceFilter?.value||'',av=skyAvailableFilter?.value||'';
 const filtered=rows.filter(x=>(!a||x.airport===a)&&(!s||x.serviceElement===s)&&(!av||x.availability===av));
 tbody.innerHTML=filtered.map((x,i)=>`<tr><td>${i+1}</td><td><b>${geEsc(x.airport)}</b></td><td>${geEsc(x.serviceElement)}</td><td><span class="planning-status">${geEsc(x.availability)}</span></td><td>${geEsc(x.reference||'-')}</td><td>${geEsc(x.remark||'-')}</td>${planAction('skypriority',x.id)}</tr>`).join('');
 gePlanningEmpty('skyPriorityEmpty',filtered);if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}

/* Touch Point Standards */
function renderTouchpointStandards(){
 const tbody=document.getElementById('touchpointStandardRows');if(!tbody)return;const rows=data.touchpointStandards||[];
 gePlanningPopulateSelect('tpStdTouchpointFilter',rows.map(x=>x.touchpoint),'Semua Touch Point');
 const tp=tpStdTouchpointFilter?.value||'',cat=tpStdCategoryFilter?.value||'',q=(tpStdSearch?.value||'').toLowerCase();
 const filtered=rows.filter(x=>(!tp||x.touchpoint===tp)&&(!cat||x.category===cat)&&(!q||`${x.component} ${x.requirement}`.toLowerCase().includes(q)));
 tbody.innerHTML=filtered.map((x,i)=>`<tr><td>${i+1}</td><td><b>${geEsc(x.touchpoint)}</b></td><td>${geEsc(x.category)}</td><td>${geEsc(x.component)}</td><td>${geEsc(x.requirement)}</td><td>${geEsc(x.applicability||'-')}</td><td>${geEsc(x.reference||'-')}</td><td>${geEsc(x.documentName||'-')}</td>${planAction('touchpoint',x.id)}</tr>`).join('');
 gePlanningEmpty('touchpointStandardEmpty',filtered);if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}

/* Standard selector extended with SkyPriority */
const GE_STANDARD_SHOW_V220=showStandardPanel;
showStandardPanel=function(name,button){
 ['people','process','premises','skypriority'].forEach(k=>{
   const el=document.getElementById('standard'+k.charAt(0).toUpperCase()+k.slice(1)+'Panel');
   if(el)el.style.display=k===name?'block':'none';
 });
 document.querySelectorAll('.standard-selector').forEach(x=>x.classList.remove('active'));button?.classList.add('active');
 if(name==='people')renderPersonnelReadiness();
 if(name==='skypriority')renderSkyPriority();
};

/* Airport Profile — relational view across masters */
let GE_AIRPORT_PROFILE_TAB='overview';
function geAirportRelated(code){
 return {
  people:(data.personnel||[]).filter(x=>String(x.airport||'').toUpperCase()===code),
  lounges:geAirportLoungeContracts(code),
  materials:(data.stationMaterials||[]).filter(x=>x.airport===code),
  spaces:(data.boSpaces||[]).filter(x=>x.airport===code),
  systems:(data.airportSystems||[]).filter(x=>x.airport===code),
  sky:(data.skyPriority||[]).filter(x=>x.airport===code),
  docs:(data.documents||[]).filter(x=>String(x.airport||x.relatedAirport||'').toUpperCase()===code)
 };
}
function geAirportProfileHTML(code,tab){
 const d=geAirportInfo(code),r=geAirportRelated(code);if(!d)return'';
 if(tab==='overview')return`<div class="airport-profile-grid"><div><span>General Manager</span><b>${geEsc(d.gm)}</b></div><div><span>Status</span><b>${d.status}</b></div><div><span>Personnel</span><b>${r.people.length}</b></div><div><span>Lounge</span><b>${r.lounges.length}</b></div><div><span>Visitor Lounge</span><b>${Number(d.visitorLounge).toLocaleString('id-ID')}</b></div><div><span>Pending Contract</span><b>${d.pending}</b></div></div>`;
 if(tab==='service')return`<div class="airport-profile-list"><h4>SkyPriority</h4>${r.sky.length?r.sky.map(x=>`<div><span>${geEsc(x.serviceElement)}</span><b>${geEsc(x.availability)}</b></div>`).join(''):'<p>Belum ada master SkyPriority untuk airport ini.</p>'}</div>`;
 if(tab==='lounge')return`<div class="airport-profile-list">${r.lounges.length?r.lounges.map(x=>`<div><span>${geEsc(x.name)}</span><b>${geContractNeedsFollowup(x)?'Follow-up':'Covered'}</b></div>`).join(''):'<p>Belum ada Lounge Provider.</p>'}</div>`;
 if(tab==='people')return`<div class="airport-profile-list">${r.people.length?r.people.map(x=>`<div><span>${geEsc(x.name)}</span><b>${geEsc(x.function||x.position||'-')}</b></div>`).join(''):'<p>Belum ada data personil.</p>'}</div>`;
 if(tab==='facility')return`<div class="airport-profile-list"><h4>Branch Office Space</h4>${r.spaces.length?r.spaces.map(x=>`<div><span>${geEsc(x.location)}</span><b>${geEsc(x.function)}</b></div>`).join(''):'<p>Belum ada data sewa ruang.</p>'}<h4>Station Material</h4>${r.materials.length?r.materials.map(x=>`<div><span>${geEsc(x.product)}</span><b>${geEsc(x.vendor)}</b></div>`).join(''):'<p>Belum ada Station Material.</p>'}</div>`;
 if(tab==='system')return`<div class="airport-profile-list">${r.systems.length?r.systems.map(x=>`<div><span>${geEsc(x.system)} • ${geEsc(x.terminal||'-')}</span><b>${geEsc(x.availability)}</b></div>`).join(''):'<p>Belum ada data CUTE/CUPPS.</p>'}</div>`;
 if(tab==='contract'){const rows=[...r.lounges.map(x=>({label:x.name,status:geContractNeedsFollowup(x)?'Follow-up':'Covered'})),...r.materials.filter(x=>x.contractNumber).map(x=>({label:x.contractNumber,status:gePlanningStatusByPeriod(x)})),...r.spaces.map(x=>({label:`${x.landlord||'Lease'} — ${x.location||''}`,status:gePlanningStatusByPeriod(x)}))];return`<div class="airport-profile-list">${rows.length?rows.map(x=>`<div><span>${geEsc(x.label)}</span><b>${geEsc(x.status)}</b></div>`).join(''):'<p>Belum ada contract reference.</p>'}</div>`}
 if(tab==='document')return`<div class="airport-profile-list">${r.docs.length?r.docs.map(x=>`<div><span>${geEsc(x.title)}</span><b>${geEsc(x.category||'-')}</b></div>`).join(''):'<p>Belum ada dokumen yang direlasikan ke airport ini.</p>'}</div>`;
 return'';
}
function renderAirportProfileTab(code,tab,button){
 GE_AIRPORT_PROFILE_TAB=tab;document.querySelectorAll('.airport-profile-tabs button').forEach(x=>x.classList.remove('active'));button?.classList.add('active');
 const e=document.getElementById('airportProfileContent');if(e)e.innerHTML=geAirportProfileHTML(code,tab);
}
geOpenAirportDetail217=function(code,marker){
 document.querySelectorAll('.airport-marker').forEach(x=>x.classList.remove('active'));marker?.classList.add('active');
 const d=geAirportInfo(code),p=document.getElementById('airportDetail');if(!d||!p)return;
 p.innerHTML=`<div class="code">${d.code}</div><h2>${geEsc(d.city)}</h2><p class="section-subtitle">${geEsc(d.airportName||'Airport / Branch Office')} • ${geEsc(d.wilayah)} • ${geEsc(d.region||'-')}</p>
 <div class="airport-profile-tabs">${[['overview','Overview'],['service','Service'],['lounge','Lounge'],['people','People'],['facility','Facility'],['system','System'],['contract','Contract'],['document','Document']].map(([v,l])=>`<button class="${v==='overview'?'active':''}" onclick="renderAirportProfileTab('${code}','${v}',this)">${l}</button>`).join('')}</div>
 <div id="airportProfileContent">${geAirportProfileHTML(code,'overview')}</div>
 ${geIsSuperAdmin217()?'<div class="map-admin-note-v217">Super Admin dapat memindahkan marker melalui titik airport pada peta.</div>':''}`;
};

/* Navigation group */
function togglePlanning(event){event?.preventDefault();const n=document.getElementById('planningNav');if(!n)return false;n.classList.toggle('collapsed');geUiSet('GE_PLANNING_COLLAPSED',n.classList.contains('collapsed')?'true':'false');return false}
window.addEventListener('DOMContentLoaded',()=>{const n=document.getElementById('planningNav');if(n)n.classList.toggle('collapsed',geUiGet('GE_PLANNING_COLLAPSED')==='true')});

/* Final V2.20 RBAC nav — explicit planning tab support */
function gxApplyNavigationV220(){
 const map={
  'index.html':'home','touchpoint.html':'services','standar.html':'services','map.html':'services',
  'pre-journey.html':'initiatives','pre-flight.html':'initiatives','post-flight.html':'initiatives','post-journey.html':'initiatives',
  'lounge-access.html':'lounge-access','lounge-visitor.html':'lounge-visitor','lounge-list.html':'lounge-list',
  'service-planning.html':'planning','station-material.html':'planning','lounge-procurement.html':'planning','bo-space.html':'planning','airport-systems.html':'planning','planning-documents.html':'planning',
  'data.html':'data','berita.html':'news','kontak.html':'contact','admin.html':'admin'
 };
 document.querySelectorAll('.side a[href]').forEach(a=>{const href=(a.getAttribute('href')||'').split('?')[0],tab=map[href];if(tab&&!(typeof gxHasTab==='function'&&gxHasTab(tab)))geHardHide(a);else geHardShow(a)});
 [['serviceNav',['services']],['initiativeNav',['initiatives']],['loungeNav',['lounge-access','lounge-visitor','lounge-list']],['planningNav',['planning']]].forEach(([id,tabs])=>{const g=document.getElementById(id);if(!g)return;const any=tabs.some(t=>typeof gxHasTab==='function'&&gxHasTab(t));if(!any)geHardHide(g);else geHardShow(g)});
}

/* Extend account tab options once */
if(!GE_TAB_OPTIONS.some(x=>x[0]==='planning'))GE_TAB_OPTIONS.splice(6,0,['planning','Service Planning']);

/* Extend audit trail */
Object.assign(GE_AUDIT_COLLECTIONS,{stationMaterials:'Station Material',boSpaces:'Branch Office Space',airportSystems:'Airport Systems',skyPriority:'SkyPriority',touchpointStandards:'Touch Point Standard'});
Object.assign(GE_AUDIT_LABEL,{
 stationMaterials:x=>`${x.airport||''} — ${x.product||'Material'}`,
 boSpaces:x=>`${x.airport||''} — ${x.location||'Space'}`,
 airportSystems:x=>`${x.airport||''} — ${x.system||'System'}`,
 skyPriority:x=>`${x.airport||''} — ${x.serviceElement||'SkyPriority'}`,
 touchpointStandards:x=>`${x.touchpoint||''} — ${x.component||'Standard'}`
});

function geEnsureStationMaterialViewR65(){
 if(!document.getElementById('planningMaterialCount')||document.getElementById('stationMaterialRows'))return;
 const section=document.createElement('section');section.id='stationMaterialDatasetR65';section.className='card';section.style.cssText='padding:20px;margin:20px 0';
 section.innerHTML=`<div class="title"><div><small>Planning Workspace / Station Material</small><h3>Station Material</h3><p>Data barang cetak kestasiunan dari master yang sama dengan angka pada panel.</p></div></div>
 <div class="data-filter-grid"><input id="materialSearch" placeholder="Cari kode, barang, atau provider" oninput="renderStationMaterials()"><select id="materialAreaFilterV231" onchange="renderStationMaterials()"><option value="">Semua Area</option></select><select id="materialVendorFilterV231" onchange="renderStationMaterials()"><option value="">Semua Vendor</option></select><select id="materialStatusFilter" onchange="renderStationMaterials()"><option value="">Semua Status</option></select></div>
 <div class="modal-actions" id="materialActionsR65"></div><div class="table-scroll"><table><thead><tr><th>No</th><th>Kode</th><th>Nama Barang</th><th>Area</th><th>Provider</th><th>Mulai</th><th>Berakhir</th><th>Status</th><th>Dokumen</th><th>Kelola</th></tr></thead><tbody id="stationMaterialRows"></tbody></table></div><div id="stationMaterialEmpty"></div>`;
 document.getElementById('planning-master')?.insertAdjacentElement('afterend',section);
 if(geAdminV231())document.getElementById('materialActionsR65').innerHTML='<button class="btn secondary" type="button" id="materialTemplateR65">Download Template CSV</button><button class="btn secondary" type="button" id="materialUploadR65">Upload Data</button><button class="btn" type="button" id="materialAddR65">+ Add Data</button>';
 document.getElementById('materialTemplateR65')?.addEventListener('click',()=>{const csv='Kode Barang,Nama Barang Cetak Kestasiunan,Area,Provider,Mulai,Berakhir,Status\r\n';const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='station-material-template.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
 document.getElementById('materialUploadR65')?.addEventListener('click',()=>openBulkImportV223('station-material'));
 document.getElementById('materialAddR65')?.addEventListener('click',()=>openStationMaterialModalV231());
 document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="stationMaterialModalV231"><div class="modal-card"><button class="modal-x" type="button" onclick="closeStationMaterialModalV231()">×</button><h2 id="stationMaterialModalTitleV231">Station Material</h2><input id="stationMaterialEditIdV231" type="hidden"><div class="formgrid"><label>Kode Barang<input id="stationMaterialCodeV231"></label><label>Nama Barang<input id="stationMaterialNameV231"></label><label>Area<input id="stationMaterialAreaV231"></label><label>Provider<input id="stationMaterialVendorV231"></label><label>Periode<input id="stationMaterialPeriodV231"></label><label>Mulai<input id="stationMaterialStartV246" type="date"></label><label>Berakhir<input id="stationMaterialEndV246" type="date"></label><label>Status<input id="stationMaterialStatusV231"></label><label>Dokumen<input id="stationMaterialFileV231" type="file"></label></div><div class="modal-actions"><button class="btn" type="button" onclick="saveStationMaterialV231()">Simpan</button><button class="btn secondary" type="button" onclick="closeStationMaterialModalV231()">Batal</button></div></div></div>
 <div class="modal-backdrop" id="bulkImportModalV223"><div class="modal-card bulk-import-modal-v223"><button class="modal-x" type="button" onclick="closeBulkImportV223()">×</button><h2 id="bulkImportTitleV223">Upload Data</h2><p id="bulkImportHelpV223"></p><input id="bulkImportFileV223" type="file" accept=".csv,.xlsx" onchange="previewBulkImportV223(this.files[0])"><div id="bulkImportPreviewV223"></div><div class="modal-actions"><button class="btn" id="bulkImportConfirmV223" type="button" disabled onclick="confirmBulkImportV243()">Import Data</button><button class="btn secondary" type="button" onclick="closeBulkImportV223()">Batal</button></div></div></div>`);
 const panel=new URLSearchParams(location.search).get('panel');if(panel==='material')section.scrollIntoView({block:'start'});
}
function geRenderPlanningPage(){
 geEnsureStationMaterialViewR65();renderPlanningOverview();renderStationMaterials();renderLoungeProcurement();renderBOSpaces();renderAirportSystems();renderPlanningDocuments();renderSkyPriority();renderTouchpointStandards();
 if(typeof gxApplyRole==='function')gxApplyRole();
}
window.addEventListener('DOMContentLoaded',()=>{gxApplyNavigationV220();geRenderPlanningPage()});


/* ==============================================================
   V2.21 — Initiative + Lounge modal UX
   ============================================================== */
function openInitiativeModalV221(){
  if(!(typeof gxCanManage==='function'&&gxCanManage()))return;
  const hidden=document.getElementById('journeyPageValue');
  const journey=(hidden?.value||window.activeJourney||'Pre-Flight');
  initiativeJourneyV221.value=journey||'Pre-Flight';
  initiativeNameV221.value='';initiativeTouchpointV221.value='';initiativeActivityV221.value='';
  initiativePlanV221.value='';initiativeRealV221.value='';initiativeRemarkV221.value='';
  document.getElementById('initiativeModalV221')?.classList.add('show');
}
function closeInitiativeModalV221(){document.getElementById('initiativeModalV221')?.classList.remove('show')}
function saveInitiativeFromModalV221(){
  if(!(typeof gxCanManage==='function'&&gxCanManage()))return;
  const obj={
    id:Date.now(),
    name:initiativeNameV221.value.trim(),
    touchpoint:initiativeTouchpointV221.value.trim(),
    activity:initiativeActivityV221.value.trim(),
    journey:initiativeJourneyV221.value,
    plan:Number(initiativePlanV221.value||0),
    real:Number(initiativeRealV221.value||0),
    remark:initiativeRemarkV221.value.trim()
  };
  if(!obj.name||!obj.touchpoint||!obj.activity)return alert('Inisiatif, Touch Point, dan Kegiatan wajib diisi.');
  data.initiatives=data.initiatives||[];
  data.initiatives.push(obj);
  save();closeInitiativeModalV221();
  if(typeof renderInitiatives==='function')renderInitiatives();
  if(typeof renderJourneyInitiatives==='function')renderJourneyInitiatives();
  if(typeof renderJourney==='function')renderJourney();
  if(typeof renderJourneyPage==='function')renderJourneyPage();
  /* Refresh touch point filters dynamically */
  document.querySelectorAll('select').forEach(sel=>{
    if(/touch.?point/i.test(sel.id||'')||/touch.?point/i.test(sel.name||'')){
      const cur=sel.value;
      const vals=[...new Set((data.initiatives||[]).map(x=>x.touchpoint).filter(Boolean))].sort();
      if(sel.options.length && /semua/i.test(sel.options[0].textContent||'')){
        sel.innerHTML='<option value="">Semua Touch Point</option>'+vals.map(v=>`<option>${geEsc(v)}</option>`).join('');
        sel.value=cur;
      }
    }
  });
  alert('Inisiatif berhasil ditambahkan.');
}

/* Lounge add modal */
function openLoungeAddModalV221(){
  if(!(typeof gxCanManage==='function'&&gxCanManage()))return;
  ['loungeAirportV221','loungeNameV221','loungePicV221','loungeRegionV221','loungeCurrencyV221','loungeDocumentNumberV221','loungeDocumentTypeV221','loungeRemarksV221'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});
  loungeServiceCategoryV221.value='Lounge';loungeDocumentStatusV221.value='Valid';
  loungeStartV221.value='';loungeEndV221.value='';loungePriceV221.value='';
  document.getElementById('loungeAddModalV221')?.classList.add('show');
}
function closeLoungeAddModalV221(){document.getElementById('loungeAddModalV221')?.classList.remove('show')}
function saveLoungeFromModalV221(){
  if(!(typeof gxCanManage==='function'&&gxCanManage()))return;
  const airport=loungeAirportV221.value.trim().toUpperCase(),name=loungeNameV221.value.trim();
  if(!airport||!name)return alert('Airport dan Nama Lounge wajib diisi.');
  const obj={
    id:Date.now(),airport,name,pic:loungePicV221.value.trim(),region:loungeRegionV221.value.trim(),
    serviceCategory:loungeServiceCategoryV221.value.trim()||'Lounge',
    startDate:loungeStartV221.value,endDate:loungeEndV221.value,
    pricePerPax:Number(loungePriceV221.value||0),currency:loungeCurrencyV221.value.trim().toUpperCase(),
    documentNumber:loungeDocumentNumberV221.value.trim(),documentType:loungeDocumentTypeV221.value.trim(),
    documentStatus:loungeDocumentStatusV221.value,remarks:loungeRemarksV221.value.trim(),
    documentName:'',documentKey:'',priceDisplay:'',startDisplay:loungeStartV221.value,endDisplay:loungeEndV221.value
  };
  data.lounges=data.lounges||[];data.lounges.push(obj);save();closeLoungeAddModalV221();
  if(typeof renderLounges==='function')renderLounges();
  if(typeof renderLoungeList==='function')renderLoungeList();
  if(typeof renderLoungeProcurement==='function')renderLoungeProcurement();
  alert('Daftar Lounge berhasil ditambahkan.');
}

/* ==============================================================
   V2.22 — Branch Office Planning & lighter sidebar
   ============================================================== */
function showBOPlanningPanel(name,button){
  const map={lounge:'Lounge',space:'Space',systems:'Systems'};
  Object.entries(map).forEach(([key,suffix])=>{
    const el=document.getElementById('boPlanningPanel'+suffix);
    if(el)el.style.display=key===name?'block':'none';
  });
  document.querySelectorAll('.bo-planning-selector').forEach(x=>x.classList.remove('active'));
  if(button)button.classList.add('active');
  if(name==='lounge')renderLoungeProcurement();
  if(name==='space')renderBOSpaces();
  if(name==='systems')renderAirportSystems();
}
window.addEventListener('DOMContentLoaded',()=>{
  if(document.getElementById('boPlanningPanelLounge')){
    const p=new URLSearchParams(location.search).get('panel')||'lounge';
    const order={lounge:0,space:1,systems:2};
    const btn=document.querySelectorAll('.bo-planning-selector')[order[p]??0];
    showBOPlanningPanel(p,btn);
  }
});


/* ==============================================================
   V2.22.2 — Durable Lounge Visitor persistence & page sync
   ============================================================== */

/* Always compare duplicate identity against the freshest persisted state. */
function geFreshVisitorDuplicateV222(parsed,freshData){
  const key=visitorIdentityKey(parsed);
  return (freshData.loungeVisitors||[]).some(x=>visitorIdentityKey(x)===key);
}

function geBuildVisitorRecordV222(p,category,ref){
  const now=new Date();
  const airport=document.getElementById('scanAirport')?.value||'CGK';
  const loungeId=Number(document.getElementById('scanLounge')?.value||0);

  /* Use latest Lounge Master as well, not only the current page snapshot. */
  const latest=store.get();
  const lounge=(latest.lounges||[]).find(x=>String(x.id)===String(loungeId));

  return {
    id:Date.now(),
    date:now.toISOString().slice(0,10),
    time:now.toTimeString().slice(0,5),
    name:p.name||'Passenger',
    flight:p.flight||'-',
    seq:normalizeSeq(p.seq||''),
    airport:String(airport||'').trim().toUpperCase(),
    category,
    eligibilityReference:ref,
    raw:p.raw||'',
    source:p.source||'scan',
    loungeId:lounge?.id||'',
    loungeName:lounge?.name||'-',
    pricePerPax:Number(lounge?.pricePerPax||0),
    currency:lounge?.currency||'',
    priceDisplay:lounge?.priceDisplay||'',
    createdAt:new Date().toISOString()
  };
}

/* Final Lounge Access recorder.
   Read latest store -> duplicate check -> append -> audit/save -> verify persistence. */
recordEligibleVisitor=function(categoryArg){
  const p=window._eligibleScan;
  if(!p)return;

  const category=categoryArg||document.getElementById('eligibleCategory')?.value||'';
  if(!GE_LOUNGE_CATEGORIES.includes(category)){
    alert('Pilih kategori penumpang terlebih dahulu.');
    document.getElementById('eligibleCategory')?.focus();
    return;
  }

  const ref=(document.getElementById('eligibilityReference')?.value||'').trim();
  if(GE_REFERENCE_REQUIRED.has(category)&&!ref){
    alert(`${geReferenceLabel(category)} wajib diisi untuk kategori ${category}.`);
    document.getElementById('eligibilityReference')?.focus();
    return;
  }

  const latest=store.get();
  latest.loungeVisitors=Array.isArray(latest.loungeVisitors)?latest.loungeVisitors:[];

  if(geFreshVisitorDuplicateV222(p,latest)){
    alert('Visitor tidak direkam karena kombinasi Nama Penumpang + Flight Number + Sequence Check-in sudah ada.');
    return;
  }

  const record=geBuildVisitorRecordV222(p,category,ref);
  latest.loungeVisitors.push(record);

  /* Replace current page state with the freshest complete persistent state.
     This prevents an older in-memory object from overwriting records added elsewhere. */
  data=latest;

  /* Existing global save() keeps Audit Trail behavior. */
  save();

  /* Persistence verification before showing success to the operator. */
  const verified=store.get();
  const persisted=(verified.loungeVisitors||[]).some(x=>String(x.id)===String(record.id));
  if(!persisted){
    alert('Visitor belum berhasil tersimpan. Silakan ulangi proses konfirmasi.');
    return;
  }

  data=verified;
  closeEligibilityModal();
  resetLoungeAccess();
  initDashboard();
  window._eligibleScan=null;

  alert(`Visitor berhasil direkam sebagai ${category}.`);
};

/* Lounge Visitor must always render from the latest persistent state. */
function geRefreshLoungeVisitorStateV222(){
  if(!document.getElementById('loungeVisitorRows'))return;
  data=store.get();
  fillAirportSelects();
  renderLoungeVisitors();
  initDashboard();
}

/* Normal navigation, browser back-forward cache, and multi-tab synchronization. */
window.addEventListener('DOMContentLoaded',()=>{
  if(document.getElementById('loungeVisitorRows')){
    setTimeout(geRefreshLoungeVisitorStateV222,0);
  }
});

window.addEventListener('pageshow',()=>{
  if(document.getElementById('loungeVisitorRows')){
    geRefreshLoungeVisitorStateV222();
  }
});

window.addEventListener('storage',ev=>{
  if(ev.key===store.KEY && document.getElementById('loungeVisitorRows')){
    geRefreshLoungeVisitorStateV222();
  }
});

/* Refresh immediately when the Lounge Visitor tab/page regains focus. */
window.addEventListener('focus',()=>{
  if(document.getElementById('loungeVisitorRows')){
    geRefreshLoungeVisitorStateV222();
  }
});


/* ==============================================================
   V2.22.3 — Storage Integrity Root-Cause Fix
   ============================================================== */

function geStorageNoticeV223(title,message,type='warning'){
  let modal=document.getElementById('geStorageNoticeV223');
  if(!modal){
    modal=document.createElement('div');
    modal.id='geStorageNoticeV223';
    modal.className='modal-backdrop';
    modal.innerHTML=`<div class="modal-card ge-storage-notice-v223">
      <button class="modal-x" onclick="document.getElementById('geStorageNoticeV223')?.classList.remove('show')">×</button>
      <div class="ge-storage-notice-icon-v223">!</div>
      <h2 id="geStorageNoticeTitleV223"></h2>
      <p id="geStorageNoticeMessageV223"></p>
      <div class="modal-actions">
        <button class="btn" onclick="document.getElementById('geStorageNoticeV223')?.classList.remove('show')">OK</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
  }
  document.getElementById('geStorageNoticeTitleV223').textContent=title;
  document.getElementById('geStorageNoticeMessageV223').textContent=message;
  modal.dataset.type=type;
  modal.classList.add('show');
}

function geStorageIntegrityCheckV223(){
  try{
    const current=store.get();
    const token='GE_STORAGE_TEST_'+Date.now();
    const probe={...current,_storageProbeV223:token};
    store.save(probe);
    const reread=store.get();
    const ok=reread._storageProbeV223===token;
    if(ok){
      delete reread._storageProbeV223;
      store.save(reread);
      data=reread;
      if(typeof GE_LAST_SAVED_SNAPSHOT!=='undefined'){
        GE_LAST_SAVED_SNAPSHOT=typeof geSafeClone==='function'?geSafeClone(reread):reread;
      }
    }else{
      store.save(current);
    }
    return ok;
  }catch(e){
    return false;
  }
}

/* Final durable Lounge Access recorder. */
recordEligibleVisitor=function(categoryArg){
  const p=window._eligibleScan;
  if(!p)return;

  const category=categoryArg||document.getElementById('eligibleCategory')?.value||'';
  if(!GE_LOUNGE_CATEGORIES.includes(category)){
    geStorageNoticeV223('Kategori Belum Dipilih','Pilih kategori penumpang terlebih dahulu.');
    document.getElementById('eligibleCategory')?.focus();
    return;
  }

  const ref=(document.getElementById('eligibilityReference')?.value||'').trim();
  if(GE_REFERENCE_REQUIRED.has(category)&&!ref){
    geStorageNoticeV223(
      'Referensi Eligibility Wajib Diisi',
      `${geReferenceLabel(category)} wajib diisi untuk kategori ${category}.`
    );
    document.getElementById('eligibilityReference')?.focus();
    return;
  }

  let latest;
  try{
    latest=store.get();
  }catch(e){
    geStorageNoticeV223(
      'Penyimpanan Tidak Dapat Dibaca',
      'Data portal tidak dapat dibaca dari penyimpanan lokal. Silakan reload halaman.'
    );
    return;
  }

  latest.loungeVisitors=Array.isArray(latest.loungeVisitors)?latest.loungeVisitors:[];
  latest.auditLogs=Array.isArray(latest.auditLogs)?latest.auditLogs:[];

  if(geFreshVisitorDuplicateV222(p,latest)){
    geStorageNoticeV223(
      'Visitor Sudah Terekam',
      'Kombinasi Nama Penumpang, Flight Number, dan Sequence Check-in sudah ada sehingga tidak direkam ulang.'
    );
    return;
  }

  const record=geBuildVisitorRecordV222(p,category,ref);
  latest.loungeVisitors.push(record);

  const u=typeof gxGetSession==='function'?(gxGetSession()||{}):{};
  latest.auditLogs.unshift({
    id:Date.now()+Math.floor(Math.random()*10000),
    timestamp:new Date().toISOString(),
    username:u.username||'system',
    name:u.name||u.username||'System',
    role:u.role||'System',
    action:'Create',
    module:'Lounge Visitor',
    object:`${record.name} / ${record.flight} / ${record.seq}`,
    detail:`Visitor direkam dari Lounge Access • ${record.airport} • ${record.category}`
  });
  latest.auditLogs=latest.auditLogs.slice(0,5000);

  try{
    /* Write latest complete object directly. */
    store.save(latest);

    /* Fresh read must retain the exact new record. */
    const verified=store.get();
    const persisted=(verified.loungeVisitors||[]).some(x=>String(x.id)===String(record.id));

    if(!persisted){
      geStorageNoticeV223(
        'Visitor Belum Tersimpan',
        'Record tidak lolos verifikasi penyimpanan. Data tidak akan dianggap berhasil sampai tersimpan secara permanen.'
      );
      return;
    }

    data=verified;
    if(typeof GE_LAST_SAVED_SNAPSHOT!=='undefined'){
      GE_LAST_SAVED_SNAPSHOT=typeof geSafeClone==='function'?geSafeClone(verified):verified;
    }

    closeEligibilityModal();
    resetLoungeAccess();
    initDashboard();
    window._eligibleScan=null;

    geStorageNoticeV223(
      'Visitor Berhasil Direkam',
      `${record.name} • ${record.flight} • Sequence ${record.seq} telah masuk ke Lounge Visitor sebagai ${record.category}.`,
      'success'
    );
  }catch(e){
    geStorageNoticeV223(
      'Penyimpanan Gagal',
      'Terjadi kegagalan saat menyimpan Lounge Visitor ke penyimpanan lokal. Silakan coba kembali.'
    );
  }
};

/* Force Lounge Visitor to display the freshest persisted data. */
function geRefreshLoungeVisitorStateV223(){
  if(!document.getElementById('loungeVisitorRows'))return;
  data=store.get();
  if(typeof GE_LAST_SAVED_SNAPSHOT!=='undefined'){
    GE_LAST_SAVED_SNAPSHOT=typeof geSafeClone==='function'?geSafeClone(data):data;
  }
  fillAirportSelects();
  renderLoungeVisitors();
  initDashboard();
}

window.addEventListener('DOMContentLoaded',()=>{
  if(!geStorageIntegrityCheckV223()){
    setTimeout(()=>geStorageNoticeV223(
      'Penyimpanan Lokal Bermasalah',
      'Portal mendeteksi penyimpanan lokal tidak dapat melakukan read/write dengan benar. Silakan reload halaman sebelum melakukan input.'
    ),250);
  }
  if(document.getElementById('loungeVisitorRows')){
    setTimeout(geRefreshLoungeVisitorStateV223,0);
  }
});
window.addEventListener('pageshow',()=>geRefreshLoungeVisitorStateV223());
window.addEventListener('focus',()=>geRefreshLoungeVisitorStateV223());
window.addEventListener('storage',ev=>{
  if(ev.key===store.KEY)geRefreshLoungeVisitorStateV223();
});


/* ==============================================================
   V2.23 — Bulk Upload Planning + Lounge Visitor / New Lounge Role
   ============================================================== */

/* ---------- Role: Lounge Luar Biasa ---------- */
const GE_ORIGINAL_USER_DEFAULT_TABS_V223=userDefaultTabs;
userDefaultTabs=function(role){
  if(role==='Lounge Luar Biasa')return['lounge-access','lounge-visitor'];
  return GE_ORIGINAL_USER_DEFAULT_TABS_V223(role);
};

const GE_ORIGINAL_USER_ROLE_CHANGED_V223=userRoleChanged;
userRoleChanged=function(){
  const role=document.getElementById('userRole')?.value||'Staff';
  document.getElementById('userAirportScopeWrap').style.display=['Branch Office','Head Office','Staff','Lounge Staff','Lounge Luar Biasa'].includes(role)?'block':'none';
  document.getElementById('userLoungeScopeWrap').style.display=['Lounge Staff','Lounge Luar Biasa'].includes(role)?'block':'none';
  renderUserTabsChecklist(userDefaultTabs(role));
};

const GE_ORIGINAL_RENDER_USER_TABS_V223=renderUserTabsChecklist;
renderUserTabsChecklist=function(selected=[]){
  const box=document.getElementById('userTabsChecklist');if(!box)return;
  const role=document.getElementById('userRole')?.value||'Staff';
  const locked=['Super Admin','Admin','Lounge Staff','Lounge Luar Biasa'].includes(role);
  const values=selected.length?selected:userDefaultTabs(role);
  box.innerHTML=GE_TAB_OPTIONS.map(([v,label])=>`<label class="tab-check"><input type="checkbox" value="${v}" ${values.includes('ALL')||values.includes(v)?'checked':''} ${locked?'disabled':''}><span>${label}</span></label>`).join('');
};

const GE_ORIGINAL_SAVE_USER_ACCOUNT_V223=saveUserAccount;
saveUserAccount=function(){if(typeof window.p26OpenUserForm==='function'){window.p26OpenUserForm(document.getElementById('p26UserId')?.value||null);}};

const GE_ORIGINAL_VISIBLE_LOUNGES_V223=geVisibleLoungeRows;
geVisibleLoungeRows=function(){
  const s=geSession();
  return (data.lounges||[]).filter(x=>{
    if(!s||['Admin','Super Admin'].includes(s.role)||s.scopeType==='ALL')return true;
    if(['Lounge Staff','Lounge Luar Biasa'].includes(s.role)){
      return typeof gxLoungeAllowed==='function'?gxLoungeAllowed(x.id,x.airport):false;
    }
    return typeof gxAirportAllowed==='function'?gxAirportAllowed(x.airport):true;
  });
};

function geCanBulkUploadVisitorV223(){
  const role=(geSession()||{}).role;
  return ['Super Admin','Admin','Lounge Luar Biasa'].includes(role);
}

function geApplyBulkVisitorUIV223(){
  const box=document.getElementById('loungeVisitorBulkActionsV223');
  if(box)box.style.display=geCanBulkUploadVisitorV223()?'flex':'none';
}

/* ---------- Offline CSV/XLSX parsing (no external library) ---------- */
function geColumnIndexV223(ref){
  const letters=String(ref||'').match(/[A-Z]+/i)?.[0]?.toUpperCase()||'A';
  let n=0;for(const ch of letters)n=n*26+(ch.charCodeAt(0)-64);return n-1;
}
function geExcelSerialDateV223(v,timeOnly=false){
  const n=Number(v);if(!Number.isFinite(n))return String(v??'');
  if(timeOnly||n<1){
    const total=Math.round((n%1)*24*60);
    return String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0');
  }
  if(n>20000){
    const ms=(n-25569)*86400*1000;
    return new Date(ms).toISOString().slice(0,10);
  }
  return String(v);
}
function geParseCSVV223(text){
  const rows=[];let row=[],cell='',q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],n=text[i+1];
    if(q){
      if(c==='"'&&n==='"'){cell+='"';i++}
      else if(c==='"')q=false;
      else cell+=c;
    }else{
      if(c==='"')q=true;
      else if(c===','){row.push(cell);cell=''}
      else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell=''}
      else if(c!=='\r')cell+=c;
    }
  }
  if(cell.length||row.length){row.push(cell);rows.push(row)}
  return rows;
}
async function geInflateZipEntryV223(bytes,method){
  if(method===0)return bytes;
  if(method!==8)throw new Error('Unsupported ZIP compression method');
  if(typeof DecompressionStream==='undefined')throw new Error('Browser tidak mendukung decompression XLSX.');
  const ds=new DecompressionStream('deflate-raw');
  const stream=new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function geReadZipEntriesV223(buffer){
  const u=new Uint8Array(buffer),dv=new DataView(buffer);
  let eocd=-1;
  for(let i=u.length-22;i>=Math.max(0,u.length-65557);i--){
    if(dv.getUint32(i,true)===0x06054b50){eocd=i;break}
  }
  if(eocd<0)throw new Error('File XLSX tidak valid.');
  const count=dv.getUint16(eocd+10,true),central=dv.getUint32(eocd+16,true);
  let p=central;const entries=new Map(),dec=new TextDecoder();
  for(let k=0;k<count;k++){
    if(dv.getUint32(p,true)!==0x02014b50)break;
    const method=dv.getUint16(p+10,true),comp=dv.getUint32(p+20,true);
    const nameLen=dv.getUint16(p+28,true),extraLen=dv.getUint16(p+30,true),commentLen=dv.getUint16(p+32,true);
    const local=dv.getUint32(p+42,true);
    const name=dec.decode(u.slice(p+46,p+46+nameLen));
    if(dv.getUint32(local,true)!==0x04034b50)throw new Error('Local ZIP header tidak valid.');
    const ln=dv.getUint16(local+26,true),le=dv.getUint16(local+28,true);
    const start=local+30+ln+le;
    const raw=u.slice(start,start+comp);
    entries.set(name,await geInflateZipEntryV223(raw,method));
    p+=46+nameLen+extraLen+commentLen;
  }
  return entries;
}
async function geParseXLSXV223(file){
  const entries=await geReadZipEntriesV223(await file.arrayBuffer());
  const dec=new TextDecoder();
  const shared=[];
  if(entries.has('xl/sharedStrings.xml')){
    const doc=new DOMParser().parseFromString(dec.decode(entries.get('xl/sharedStrings.xml')),'application/xml');
    [...doc.getElementsByTagName('si')].forEach(si=>{
      shared.push([...si.getElementsByTagName('t')].map(t=>t.textContent||'').join(''));
    });
  }
  const sheetKey=[...entries.keys()].find(k=>/^xl\/worksheets\/sheet1\.xml$/i.test(k)) ||
                 [...entries.keys()].find(k=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(k));
  if(!sheetKey)throw new Error('Worksheet tidak ditemukan.');
  const doc=new DOMParser().parseFromString(dec.decode(entries.get(sheetKey)),'application/xml');
  const rows=[];
  [...doc.getElementsByTagName('row')].forEach(r=>{
    const vals=[];
    [...r.getElementsByTagName('c')].forEach(c=>{
      const idx=geColumnIndexV223(c.getAttribute('r'));
      const type=c.getAttribute('t')||'';
      let val='';
      if(type==='inlineStr')val=[...c.getElementsByTagName('t')].map(t=>t.textContent||'').join('');
      else{
        const v=c.getElementsByTagName('v')[0]?.textContent??'';
        val=type==='s'?shared[Number(v)]??'':v;
      }
      vals[idx]=val;
    });
    rows.push(vals);
  });
  return rows;
}
async function geReadTabularFileV223(file){
  if(!file)throw new Error('Pilih file terlebih dahulu.');
  const ext=file.name.toLowerCase().split('.').pop();
  if(ext==='csv')return geParseCSVV223(await file.text());
  if(ext==='xlsx')return geParseXLSXV223(file);
  throw new Error('Format file harus .xlsx atau .csv');
}
function geNormalizeHeaderV223(v){
  return String(v||'').replace(/^\uFEFF/,'').trim().toLowerCase()
   .replace(/[\/&]/g,' ')
   .replace(/[()]/g,'')
   .replace(/[²]/g,'2')
   .replace(/\*/g,'')
   .replace(/[._-]+/g,' ')
   .replace(/\s+/g,' ')
   .trim();
}
function geFindHeaderRowV223(rows,requiredAliases){
  for(let i=0;i<Math.min(rows.length,12);i++){
    const normalized=(rows[i]||[]).map(geNormalizeHeaderV223);
    const hits=requiredAliases.filter(aliasSet=>aliasSet.some(a=>normalized.includes(a))).length;
    if(hits>=Math.min(3,requiredAliases.length))return i;
  }
  return -1;
}
function geRowsToObjectsV223(rows,aliases){
  const sets=Object.values(aliases).map(v=>v.map(geNormalizeHeaderV223));
  const hi=geFindHeaderRowV223(rows,sets);
  if(hi<0)throw new Error('Header template tidak dikenali.');
  const hdr=(rows[hi]||[]).map(geNormalizeHeaderV223);
  const indexes={};
  Object.entries(aliases).forEach(([key,names])=>{
    indexes[key]=hdr.findIndex(h=>names.map(geNormalizeHeaderV223).includes(h));
  });
  return rows.slice(hi+1)
    .filter(r=>(r||[]).some(v=>String(v??'').trim()!==''))
    .map(r=>Object.fromEntries(Object.entries(indexes).map(([k,idx])=>[k,idx>=0?(r[idx]??''):''])));
}

/* ---------- Bulk import UI ---------- */
let GE_BULK_IMPORT_V223={type:null,rows:[],fileName:''};

const GE_IMPORT_SCHEMA_V223={
 space:{
  title:'Upload Space & Building',
  help:'Gunakan Template Space & Building. Data akan masuk ke Branch Office Space Portfolio.',
  aliases:{
    airport:['airport','airport*'],location:['area location','area / location','area / location*'],function:['function'],sizeM2:['size m2','size m²','size m2*','size m²*'],
    landlord:['landlord','provider','provider*'],startDate:['start date','start date*'],endDate:['end date','end date*'],currency:['currency','currency*'],annualCost:['annual cost','harga / m² / bulan','harga / m2 / bulan','harga m² bulan','harga m2 bulan'],
    status:['status'],documentName:['document reference','document / reference']
  }
 },
 system:{
  title:'Upload Airport Systems',
  help:'Gunakan Template Airport Systems. Data akan masuk ke master CUTE/CUPPS.',
  aliases:{
    airport:['airport'],terminal:['terminal'],system:['system'],provider:['provider'],unit:['counter unit','counter / unit'],
    availability:['availability'],agreement:['contract agreement','contract / agreement'],remark:['remark']
  }
 },
 visitor:{
  title:'Upload Lounge Visitor',
  help:'Fallback ketika scanner/perangkat bermasalah. Duplikat Nama Penumpang + Flight Number + Sequence akan dilewati.',
  aliases:{
    date:['tanggal','date'],time:['waktu','time'],name:['nama penumpang','passenger name'],flight:['flight number'],
    seq:['sequence','sequence check in'],airport:['airport'],loungeName:['nama lounge','lounge name'],
    category:['kategori penumpang','passenger category'],eligibilityReference:['referensi eligibility','eligibility reference']
  }
 }
};

function openBulkImportV223(type){
  if(type==='visitor'&&!geCanBulkUploadVisitorV223())return;
  if(['space','system'].includes(type)&&!gePlanningCanManage())return;
  const schema=GE_IMPORT_SCHEMA_V223[type];if(!schema)return;
  GE_BULK_IMPORT_V223={type,rows:[],fileName:''};
  bulkImportTitleV223.textContent=schema.title;
  bulkImportHelpV223.textContent=schema.help;
  bulkImportFileV223.value='';
  bulkImportPreviewV223.innerHTML='<div class="bulk-import-idle">Belum ada file dipilih.</div>';
  bulkImportConfirmV223.disabled=true;
  bulkImportModalV223.classList.add('show');
}
function closeBulkImportV223(){bulkImportModalV223?.classList.remove('show')}

async function previewBulkImportV223(file){
  const type=GE_BULK_IMPORT_V223.type,schema=GE_IMPORT_SCHEMA_V223[type];
  if(!file||!schema)return;
  bulkImportPreviewV223.innerHTML='<div class="bulk-import-loading">Membaca file…</div>';
  bulkImportConfirmV223.disabled=true;
  try{
    const raw=await geReadTabularFileV223(file);
    let rows=geRowsToObjectsV223(raw,schema.aliases);
    GE_BULK_IMPORT_V223={type,rows,fileName:file.name};
    const preview=rows.slice(0,5);
    bulkImportPreviewV223.innerHTML=`<div class="bulk-import-summary"><b>${rows.length}</b><span>baris data terbaca</span></div>
      <div class="bulk-preview-table"><table><thead><tr>${Object.keys(schema.aliases).slice(0,5).map(k=>`<th>${geEsc(k)}</th>`).join('')}</tr></thead>
      <tbody>${preview.map(r=>`<tr>${Object.keys(schema.aliases).slice(0,5).map(k=>`<td>${geEsc(r[k]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    if(type==='station-material'){
      const issues=[],seen=new Set();rows.forEach((r,i)=>{const code=String(r.code||'').trim(),name=String(r.product||'').trim(),start=String(r.startDate||'').trim(),end=String(r.endDate||'').trim();if(!code||!name||!start||!end)issues.push(`Baris ${i+2}: Kode Barang, Nama Barang, Mulai, dan Berakhir wajib diisi.`);if(start&&!geNormalizeDateUploadV223(start)||end&&!geNormalizeDateUploadV223(end))issues.push(`Baris ${i+2}: format tanggal tidak valid.`);if(code&&seen.has(code.toUpperCase()))issues.push(`Baris ${i+2}: Kode Barang ${code} duplikat dalam file.`);seen.add(code.toUpperCase())});
      if(issues.length)bulkImportPreviewV223.insertAdjacentHTML('beforeend',`<div class="bulk-import-error">${issues.slice(0,15).map(geEsc).join('<br>')}${issues.length>15?`<br>... ${issues.length-15} temuan lain`:''}</div>`);
      bulkImportConfirmV223.disabled=!rows.length||!!issues.length;
    }else bulkImportConfirmV223.disabled=!rows.length;
  }catch(e){
    bulkImportPreviewV223.innerHTML=`<div class="bulk-import-error">${geEsc(e.message||String(e))}</div>`;
  }
}

function geNormalizeDateUploadV223(v){
  const s=String(v??'').trim();
  if(!s)return'';
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
  if(/^\d+(\.\d+)?$/.test(s))return geExcelSerialDateV223(Number(s),false);
  const d=new Date(s);return Number.isNaN(d.getTime())?'':d.toISOString().slice(0,10);
}
function geNormalizeTimeUploadV223(v){
  const s=String(v??'').trim();
  if(!s)return'';
  if(/^\d{1,2}:\d{2}/.test(s)){const [h,m]=s.split(':');return h.padStart(2,'0')+':'+m.slice(0,2)}
  if(/^\d+(\.\d+)?$/.test(s))return geExcelSerialDateV223(Number(s),true);
  return s.slice(0,5);
}

function geImportSpaceV223(rows){
  let added=0,skipped=0;
  data.boSpaces=data.boSpaces||[];
  rows.forEach(r=>{
    const airport=String(r.airport||'').trim().toUpperCase();
    if(!airport){skipped++;return}
    data.boSpaces.push({
      id:Date.now()+added+Math.floor(Math.random()*1000),
      airport,location:String(r.location||'').trim(),function:String(r.function||'').trim(),
      sizeM2:Number(String(r.sizeM2||'0').replace(/,/g,''))||0,landlord:String(r.landlord||'').trim(),
      startDate:geNormalizeDateUploadV223(r.startDate),endDate:geNormalizeDateUploadV223(r.endDate),
      currency:String(r.currency||'').trim().toUpperCase(),
      annualCost:Number(String(r.annualCost||'0').replace(/,/g,''))||0,
      status:String(r.status||'Active').trim()||'Active',documentName:String(r.documentName||'').trim()
    });added++;
  });
  save();renderBOSpaces();return{added,skipped};
}
function geImportSystemV223(rows){
  let added=0,skipped=0;
  data.airportSystems=data.airportSystems||[];
  rows.forEach(r=>{
    const airport=String(r.airport||'').trim().toUpperCase(),system=String(r.system||'').trim().toUpperCase();
    if(!airport||!['CUTE','CUPPS'].includes(system)){skipped++;return}
    data.airportSystems.push({
      id:Date.now()+added+Math.floor(Math.random()*1000),
      airport,terminal:String(r.terminal||'').trim(),system,provider:String(r.provider||'').trim(),
      unit:String(r.unit||'').trim(),availability:String(r.availability||'Available').trim(),
      agreement:String(r.agreement||'').trim(),remark:String(r.remark||'').trim()
    });added++;
  });
  save();renderAirportSystems();return{added,skipped};
}
function geFindVisitorLoungeV223(airport,loungeName,date){
  const candidates=geVisibleLoungeRows().filter(l=>
    String(l.airport||'').toUpperCase()===airport &&
    (!date||typeof geDateInsideLoungePeriod!=='function'||geDateInsideLoungePeriod(date,l))
  );
  if(loungeName){
    const exact=candidates.find(l=>String(l.name||'').trim().toLowerCase()===loungeName.trim().toLowerCase());
    if(exact)return exact;
  }
  return candidates.length===1?candidates[0]:null;
}
function geImportVisitorV223(rows){
  if(!geCanBulkUploadVisitorV223())return{added:0,skipped:rows.length,duplicates:0};
  const latest=store.get();
  latest.loungeVisitors=Array.isArray(latest.loungeVisitors)?latest.loungeVisitors:[];
  latest.auditLogs=Array.isArray(latest.auditLogs)?latest.auditLogs:[];
  let added=0,skipped=0,duplicates=0;
  const existing=new Set(latest.loungeVisitors.map(visitorIdentityKey));
  const user=geSession()||{};

  rows.forEach(r=>{
    const record={
      date:geNormalizeDateUploadV223(r.date),
      time:geNormalizeTimeUploadV223(r.time)||new Date().toTimeString().slice(0,5),
      name:String(r.name||'').trim(),
      flight:normalizeFlight(r.flight),
      seq:normalizeSeq(r.seq),
      airport:String(r.airport||'').trim().toUpperCase(),
      category:String(r.category||'').trim(),
      eligibilityReference:String(r.eligibilityReference||'').trim(),
      loungeName:String(r.loungeName||'').trim(),
      source:'bulk-upload'
    };

    if(!record.date||!record.name||!record.flight||!record.seq||!record.airport||!GE_LOUNGE_CATEGORIES.includes(record.category)){
      skipped++;return;
    }

    const key=visitorIdentityKey(record);
    if(existing.has(key)){duplicates++;return}

    const lounge=geFindVisitorLoungeV223(record.airport,record.loungeName,record.date);
    if(user.role==='Lounge Luar Biasa'&&!lounge){skipped++;return}

    record.id=Date.now()+added+Math.floor(Math.random()*10000);
    record.loungeId=lounge?.id||'';
    record.loungeName=lounge?.name||record.loungeName||'-';
    record.pricePerPax=Number(lounge?.pricePerPax||0);
    record.currency=lounge?.currency||'';
    record.priceDisplay=lounge?.priceDisplay||'';
    record.createdAt=new Date().toISOString();

    latest.loungeVisitors.push(record);
    existing.add(key);
    added++;
  });

  if(added){
    latest.auditLogs.unshift({
      id:Date.now()+Math.floor(Math.random()*10000),
      timestamp:new Date().toISOString(),username:user.username||'system',name:user.name||user.username||'System',
      role:user.role||'System',action:'Bulk Import',module:'Lounge Visitor',
      object:`${added} visitor`,detail:`Bulk upload lounge visitor • added ${added} • duplicate ${duplicates} • skipped ${skipped}`
    });
    store.save(latest);data=store.get();
    if(typeof GE_LAST_SAVED_SNAPSHOT!=='undefined')GE_LAST_SAVED_SNAPSHOT=geSafeClone(data);
    renderLoungeVisitors();initDashboard();
  }
  return{added,skipped,duplicates};
}

function confirmBulkImportV223(){
  const {type,rows}=GE_BULK_IMPORT_V223;if(!rows.length)return;
  let result;
  if(type==='space')result=geImportSpaceV223(rows);
  if(type==='system')result=geImportSystemV223(rows);
  if(type==='visitor')result=geImportVisitorV223(rows);
  if(!result)return;
  closeBulkImportV223();
  const extra=result.duplicates!==undefined?` • ${result.duplicates} duplikat`:'';
  geStorageNoticeV223(
    'Import Selesai',
    `${result.added} data berhasil ditambahkan • ${result.skipped} baris dilewati${extra}.`,
    result.added?'success':'warning'
  );
}

window.addEventListener('DOMContentLoaded',()=>{geApplyBulkVisitorUIV223()});


/* ==============================================================
   V2.24 — Initiative Governance, Due Date Warning & Timeline
   ============================================================== */
function geInitiativeUserV224(){return typeof gxGetSession==='function'?(gxGetSession()||{}):{}}
function geInitiativeAdminV224(){const u=geInitiativeUserV224();return u.role==='Super Admin'||(!['External User','External','Collaborator'].includes(u.role)&&(u.role==='Admin'||String(u.accessLevel||'')==='Admin'))}
function geInitiativeCanProgressV224(){const u=geInitiativeUserV224();return geInitiativeAdminV224()||(!['External User','External','Collaborator'].includes(u.role)&&String(u.accessLevel||'')==='Editor')}
function geInitiativeProgressAllowedV224(x){const u=geInitiativeUserV224();return geInitiativeCanProgressV224()&&geInitiativeScopedV224(x)&&(geInitiativeAdminV224()||String(x.createdByAccessLevel||'').toLowerCase()!=='admin'&&String(x.createdByRole||'')!=='Super Admin')}

function geInitiativeScopedV224(x){
  const s=geInitiativeUserV224();
  if(!s||geInitiativeAdminV224()||s.scopeType==='ALL')return true;
  if(!x.airport)return true;
  return typeof gxAirportAllowed==='function'?gxAirportAllowed(x.airport):true;
}
function geDueStateV224(x){
  if(!x.dueDate)return'';
  const now=new Date();now.setHours(0,0,0,0);
  const due=new Date(x.dueDate+'T00:00:00');
  const days=Math.ceil((due-now)/(86400000));
  const completed=Number(x.real||0)>=Number(x.plan||0)&&Number(x.plan||0)>0;
  if(completed)return'';
  if(days<0)return'overdue';
  if(days<=14)return'due-soon';
  return'';
}
function geDueLabelV224(x){
  if(!x.dueDate)return'-';
  const state=geDueStateV224(x);
  const d=new Date(x.dueDate+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
  if(state==='overdue')return`<span class="due-badge overdue">${d} • Terlewat</span>`;
  if(state==='due-soon')return`<span class="due-badge warning">${d} • Mendekati</span>`;
  return`<span class="due-badge">${d}</span>`;
}
function geInitiativeManageButtonsV224(x){
  const parts=[`<button class="btn secondary compact-btn" onclick="openInitiativeTimelineV224(${x.id})">Detail / Timeline</button>`];
  if(geInitiativeAdminV224()){
    parts.push(`<button class="btn secondary compact-btn" onclick="openInitiativeModalV224(${x.id})">Update</button>`);
    parts.push(`<button class="btn danger compact-btn" onclick="deleteInitiativeV224(${x.id})">Hapus</button>`);
  }else if(geInitiativeProgressAllowedV224(x)){
    parts.push(`<button class="btn secondary compact-btn" onclick="openInitiativeProgressV224(${x.id})">Edit Progress</button>`);
  }
  return `<div class="initiative-actions-v224">${parts.join('')}</div>`;
}

/* Final initiative renderer */
renderInitiatives=function(){
  refreshInitiativeFilters();
  const rows=currentInitiativeRows().filter(geInitiativeScopedV224);
  const t=document.getElementById('initRows');
  if(t){
    t.innerHTML=rows.map((x,i)=>{
      const ratio=progressRatio(x.plan,x.real),dueState=geDueStateV224(x);
      return `<tr class="initiative-row-v224 ${dueState}">
        <td>${i+1}</td>
        <td><b>${geEsc(x.name||'')}</b></td>
        <td>${geEsc(x.tp||'')}</td>
        <td>${geEsc(x.airport||'')}</td>
        <td>${geEsc(x.pic||'-')}</td>
        <td>${geDueLabelV224(x)}</td>
        <td>${Number(x.plan||0)}%</td>
        <td>${Number(x.real||0)}%</td>
        <td>${achievementPill(x.plan,x.real)}</td>
        <td>${geEsc(x.remark||'')}</td>
        <td class="table-progress">
          <div class="mini-progress"><i style="width:${Math.min(100,ratio)}%"></i></div>
          <div class="mini-progress-text">${ratio}% terhadap target</div>
        </td>
        <td>${geInitiativeManageButtonsV224(x)}</td>
      </tr>`;
    }).join('');
  }
  renderInitiativeCharts(rows);
  if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
};

function openInitiativeModalV224(id=null){
  if(!geInitiativeAdminV224())return;
  const x=id?(data.initiatives||[]).find(v=>v.id===id):null;
  initiativeEditIdV224.value=x?.id||'';
  initiativeModalTitleV224.textContent=x?'Update Inisiatif':'Tambah Inisiatif';
  initiativeNameV224.value=x?.name||'';
  initiativeTouchpointV224.value=x?.tp||'';
  initiativeAirportV224.value=x?.airport||'';
  initiativePicV224.value=x?.pic||'';
  initiativeDueDateV224.value=x?.dueDate||'';
  initiativeJourneyV224.value=x?.journey||document.getElementById('journeyPageValue')?.value||'Pre-Flight';
  initiativePlanV224.value=x?.plan??0;
  initiativeRealV224.value=x?.real??0;
  initiativeRemarkV224.value=x?.remark||'';
  initiativeModalV224.classList.add('show');
}
function closeInitiativeModalV224(){initiativeModalV224?.classList.remove('show')}
function saveInitiativeV224(){
  if(!geInitiativeAdminV224())return;
  const id=Number(initiativeEditIdV224.value||0);
  const obj={
    name:initiativeNameV224.value.trim(),
    tp:initiativeTouchpointV224.value.trim(),
    airport:initiativeAirportV224.value.trim().toUpperCase(),
    pic:initiativePicV224.value.trim(),
    dueDate:initiativeDueDateV224.value,
    journey:initiativeJourneyV224.value,
    plan:Number(initiativePlanV224.value||0),
    real:Number(initiativeRealV224.value||0),
    remark:initiativeRemarkV224.value.trim()
  };
  if(!obj.name||!obj.tp)return geStorageNoticeV223('Data Belum Lengkap','Nama Inisiatif dan Touch Point wajib diisi.');
  if(id){
    const x=data.initiatives.find(v=>v.id===id);if(!x)return;
    Object.assign(x,obj);x.workflow=Array.isArray(x.workflow)?x.workflow:[];
  }else{
    data.initiatives.push({id:Date.now(),...obj,workflow:[],triggerDocuments:[],supportingDocuments:[]});
  }
  if(!(data.touchpoints||[]).some(x=>(typeof x==='string'?x:x.name)===obj.tp))data.touchpoints.push({id:'legacy:'+obj.tp,name:obj.tp,status:'Active'});
  save();closeInitiativeModalV224();renderInitiatives();
  geStorageNoticeV223('Inisiatif Tersimpan',`${obj.name} berhasil disimpan.`,'success');
}
function deleteInitiativeV224(id){
  if(!geInitiativeAdminV224()||!confirm('Hapus inisiatif ini?'))return;
  data.initiatives=data.initiatives.filter(x=>x.id!==id);save();renderInitiatives();
}

/* Staff / BO progress-only edit */
function openInitiativeProgressV224(id){
  const x=(data.initiatives||[]).find(v=>v.id===id);
  if(!x||!geInitiativeCanProgressV224()||!geInitiativeScopedV224(x))return;
  initiativeProgressIdV224.value=x.id;
  initiativeProgressNameV224.textContent=`${x.name} • Target ${x.plan}%`;
  initiativeProgressRealV224.value=x.real??0;
  initiativeProgressRemarkV224.value=x.remark||'';
  initiativeProgressModalV224.classList.add('show');
}
function closeInitiativeProgressV224(){initiativeProgressModalV224?.classList.remove('show')}
function saveInitiativeProgressV224(){
  const id=Number(initiativeProgressIdV224.value||0),x=(data.initiatives||[]).find(v=>v.id===id);
  if(!x||!geInitiativeCanProgressV224()||!geInitiativeScopedV224(x))return;
  x.real=Number(initiativeProgressRealV224.value||0);
  x.remark=initiativeProgressRemarkV224.value.trim();
  save();closeInitiativeProgressV224();renderInitiatives();
  geStorageNoticeV223('Progress Diperbarui',`${x.name} telah diperbarui.`,'success');
}


/* V2.27 — Initiative dossier / document governance */
function geInitDocsV227(x){
  x.triggerDocuments=Array.isArray(x.triggerDocuments)?x.triggerDocuments:[];
  x.supportingDocuments=Array.isArray(x.supportingDocuments)?x.supportingDocuments:[];
  return [...x.triggerDocuments,...x.supportingDocuments];
}
function geDocReadinessV227(x){
  const docs=geInitDocsV227(x), required=docs.filter(d=>d.required);
  if(!required.length)return {done:0,total:0,pct:100,label:'Belum ditetapkan'};
  const done=required.filter(d=>d.status==='Current' && (d.fileName||d.referenceNo)).length;
  return {done,total:required.length,pct:Math.round(done/required.length*100),label:`${done} / ${required.length}`};
}
function geDocTypeOptionsV227(){
  return ['Notice','IOC','Surat / Nota Dinas','Memo','Regulasi','Hasil Audit / Temuan','Management Direction','Minutes of Meeting','Email / Correspondence','PPA / FRA','TOR / Scope of Work','Kajian Bisnis','RFI / RFP','BA Evaluasi','BA Negosiasi','PKS / Kontrak','PO','BAST','Notice / IOC Implementasi','Dokumentasi Final','Lainnya'];
}
function geDocCardV227(d,kind,parentId,index){
  const can=geInitiativeAdminV224();
  return `<div class="initiative-doc-row-v227">
    <div class="initiative-doc-icon-v227">${kind==='trigger'?'T':'D'}</div>
    <div class="initiative-doc-main-v227">
      <div class="initiative-doc-title-v227">${geEsc(d.type||'Dokumen')} ${d.required?'<span class="doc-required-v227">Required</span>':''}</div>
      <div class="initiative-doc-meta-v227">${geEsc(d.referenceNo||'Tanpa nomor')} • ${geEsc(d.issuer||'Unit belum diisi')} • ${geEsc(d.documentDate||'-')}</div>
      <div class="initiative-doc-file-v227">${geEsc(d.fileName||'Belum ada file')} ${d.version?`• ${geEsc(d.version)}`:''} <span class="doc-status-v227 ${String(d.status||'Current').toLowerCase()}">${geEsc(d.status||'Current')}</span></div>
      ${d.description?`<div class="initiative-doc-desc-v227">${geEsc(d.description)}</div>`:''}
    </div>
    ${can?`<div class="initiative-doc-actions-v227"><button class="timeline-link-v224" onclick="openInitiativeDocumentV227(${parentId},'${kind}',${index})">Edit</button><button class="timeline-link-v224 danger" onclick="deleteInitiativeDocumentV227(${parentId},'${kind}',${index})">Hapus</button></div>`:''}
  </div>`;
}
function geInitiativeDocumentsSectionV227(x){
  const r=geDocReadinessV227(x),can=geInitiativeAdminV224();
  return `<div class="initiative-doc-section-v227">
    <div class="initiative-doc-summary-v227">
      <div><span class="eyebrow">Document Readiness</span><h3>Dokumen Inisiatif</h3><p>Dasar/trigger dan dokumen pendukung pelaksanaan inisiatif.</p></div>
      <div class="initiative-doc-readiness-v227"><b>${r.pct}%</b><span>${r.total?r.label+' required document':'Belum ada required document'}</span></div>
    </div>
    <div class="initiative-doc-progress-v227"><i style="width:${r.pct}%"></i></div>
    <div class="initiative-doc-columns-v227">
      <section>
        <div class="initiative-doc-column-head-v227"><div><h4>Dasar & Trigger Inisiatif</h4><p>Notice, IOC, memo, regulasi, temuan, arahan, atau correspondence yang memicu inisiatif.</p></div>${can?`<button class="btn secondary compact-btn" onclick="openInitiativeDocumentV227(${x.id},'trigger')">Tambah Dokumen</button>`:''}</div>
        <div class="initiative-doc-list-v227">${x.triggerDocuments.length?x.triggerDocuments.map((d,i)=>geDocCardV227(d,'trigger',x.id,i)).join(''):'<div class="planning-empty">Belum ada dokumen trigger.</div>'}</div>
      </section>
      <section>
        <div class="initiative-doc-column-head-v227"><div><h4>Dokumen Pelaksanaan</h4><p>PPA/FRA, TOR, kajian, BA, kontrak, BAST, dan dokumen pendukung lainnya.</p></div>${can?`<button class="btn secondary compact-btn" onclick="openInitiativeDocumentV227(${x.id},'supporting')">Tambah Dokumen</button>`:''}</div>
        <div class="initiative-doc-list-v227">${x.supportingDocuments.length?x.supportingDocuments.map((d,i)=>geDocCardV227(d,'supporting',x.id,i)).join(''):'<div class="planning-empty">Belum ada dokumen pelaksanaan.</div>'}</div>
      </section>
    </div>
  </div>`;
}
function openInitiativeDocumentV227(parentId,kind,index=''){
  if(!geInitiativeAdminV224())return;
  const x=(data.initiatives||[]).find(v=>v.id===parentId);if(!x)return;
  geInitDocsV227(x);
  const arr=kind==='trigger'?x.triggerDocuments:x.supportingDocuments;
  const d=index!==''?arr[Number(index)]:null;
  initiativeDocParentIdV227.value=parentId;
  initiativeDocKindV227.value=kind;
  initiativeDocEditIndexV227.value=index;
  initiativeDocModalTitleV227.textContent=d?'Update Dokumen Inisiatif':(kind==='trigger'?'Tambah Dasar / Trigger':'Tambah Dokumen Pelaksanaan');
  initiativeDocTypeV227.innerHTML=geDocTypeOptionsV227().map(v=>`<option>${v}</option>`).join('');
  initiativeDocTypeV227.value=d?.type|| (kind==='trigger'?'IOC':'PPA / FRA');
  initiativeDocReferenceV227.value=d?.referenceNo||'';
  initiativeDocIssuerV227.value=d?.issuer||'';
  initiativeDocDateV227.value=d?.documentDate||'';
  initiativeDocVersionV227.value=d?.version||'';
  initiativeDocStatusV227.value=d?.status||'Current';
  initiativeDocRequiredV227.checked=!!d?.required;
  initiativeDocDescriptionV227.value=d?.description||'';
  initiativeDocFileV227.value='';
  initiativeDocCurrentFileV227.textContent=d?.fileName?`File saat ini: ${d.fileName}`:'Belum ada file.';
  initiativeDocModalV227.classList.add('show');
}
function closeInitiativeDocumentV227(){initiativeDocModalV227?.classList.remove('show')}
function saveInitiativeDocumentV227(){
  if(!geInitiativeAdminV224())return;
  const id=Number(initiativeDocParentIdV227.value),x=(data.initiatives||[]).find(v=>v.id===id);if(!x)return;
  geInitDocsV227(x);
  const kind=initiativeDocKindV227.value,arr=kind==='trigger'?x.triggerDocuments:x.supportingDocuments;
  const idx=initiativeDocEditIndexV227.value,file=initiativeDocFileV227.files?.[0];
  const old=idx!==''?arr[Number(idx)]:null;
  const obj={
    type:initiativeDocTypeV227.value,
    referenceNo:initiativeDocReferenceV227.value.trim(),
    issuer:initiativeDocIssuerV227.value.trim(),
    documentDate:initiativeDocDateV227.value,
    version:initiativeDocVersionV227.value.trim(),
    status:initiativeDocStatusV227.value,
    required:initiativeDocRequiredV227.checked,
    description:initiativeDocDescriptionV227.value.trim(),
    fileName:file?.name||old?.fileName||'',
    fileType:file?.type||old?.fileType||'',
    fileSize:file?.size||old?.fileSize||0,
    updatedAt:new Date().toISOString(),
    updatedBy:geInitiativeUserV224()?.name||geInitiativeUserV224()?.username||'User'
  };
  if(!obj.type)return;
  if(idx==='')arr.push(obj);else arr[Number(idx)]=obj;
  save();closeInitiativeDocumentV227();openInitiativeTimelineV224(id);
  geStorageNoticeV223('Dokumen Tersimpan',`${obj.type} berhasil dikaitkan dengan inisiatif.`,'success');
}
function deleteInitiativeDocumentV227(id,kind,index){
  if(!geInitiativeAdminV224()||!confirm('Hapus dokumen dari inisiatif ini?'))return;
  const x=(data.initiatives||[]).find(v=>v.id===id);if(!x)return;
  geInitDocsV227(x);
  (kind==='trigger'?x.triggerDocuments:x.supportingDocuments).splice(index,1);
  save();openInitiativeTimelineV224(id);
}

/* Detail / Timeline */
function geWorkflowStatusClassV224(status){
  return String(status||'').toLowerCase().replace(/\s+/g,'-');
}
function openInitiativeTimelineV224(id){
  const x=(data.initiatives||[]).find(v=>v.id===id);if(!x)return;
  x.workflow=Array.isArray(x.workflow)?x.workflow:[];
  geInitDocsV227(x);
  const steps=x.workflow;
  initiativeTimelineBodyV224.innerHTML=`
    <div class="initiative-detail-head-v224">
      <div><span class="eyebrow">Initiative Detail</span><h2>${geEsc(x.name)}</h2>
      <p>${geEsc(x.tp)} • ${geEsc(x.airport||'All Airport')} • PIC ${geEsc(x.pic||'-')}</p></div>
      ${geInitiativeAdminV224()?`<button class="btn" onclick="openInitiativeStepV224(${x.id})">Tambah Tahapan</button>`:''}
    </div>
    <div class="initiative-detail-kpi-v224">
      <div><span>Target</span><b>${Number(x.plan||0)}%</b></div>
      <div><span>Realisasi</span><b>${Number(x.real||0)}%</b></div>
      <div><span>Pencapaian</span><b>${achievement(x.plan,x.real)}</b></div>
      <div><span>Due Date</span><b>${x.dueDate?new Date(x.dueDate+'T00:00:00').toLocaleDateString('id-ID'):'-'}</b></div>
    </div>
    <div class="initiative-flow-title-v224"><h3>Timeline & Alur Pekerjaan</h3><p>Tahapan pekerjaan dari persiapan sampai penyelesaian.</p></div>
    <div class="initiative-timeline-v224">
      ${steps.length?steps.map((s,i)=>`
        <div class="timeline-step-v224 ${geWorkflowStatusClassV224(s.status)}">
          <div class="timeline-marker-v224"><span>${i+1}</span></div>
          <div class="timeline-card-v224">
            <div class="timeline-card-head-v224"><div><h4>${geEsc(s.title||'Tahapan')}</h4><span>${geEsc(s.status||'Not Started')}</span></div>
            ${geInitiativeAdminV224()?`<div><button class="timeline-link-v224" onclick="openInitiativeStepV224(${x.id},${i})">Edit</button><button class="timeline-link-v224 danger" onclick="deleteInitiativeStepV224(${x.id},${i})">Hapus</button></div>`:''}</div>
            <div class="timeline-meta-v224"><span>PIC <b>${geEsc(s.pic||'-')}</b></span><span>Due <b>${s.dueDate||'-'}</b></span></div>
            ${s.remark?`<p>${geEsc(s.remark)}</p>`:''}
          </div>
        </div>`).join(''):`<div class="planning-empty">Belum ada tahapan pekerjaan. ${geInitiativeAdminV224()?'Tambahkan milestone agar alur inisiatif dapat terlihat.':''}</div>`}
    </div>
    ${geInitiativeDocumentsSectionV227(x)}`;
  initiativeTimelineModalV224.classList.add('show');
  const timelineCardV224=initiativeTimelineModalV224.querySelector('.initiative-dialog-card');if(timelineCardV224)timelineCardV224.scrollTop=0;
}
function closeInitiativeTimelineV224(){initiativeTimelineModalV224?.classList.remove('show')}

function openInitiativeStepV224(parentId,index=''){
  if(!geInitiativeAdminV224())return;
  const x=(data.initiatives||[]).find(v=>v.id===parentId);if(!x)return;
  x.workflow=Array.isArray(x.workflow)?x.workflow:[];
  const s=index!==''?x.workflow[Number(index)]:null;
  initiativeStepParentIdV224.value=parentId;
  initiativeStepEditIndexV224.value=index;
  initiativeStepTitleV224.value=s?.title||'';
  initiativeStepPicV224.value=s?.pic||'';
  initiativeStepDueDateV224.value=s?.dueDate||'';
  initiativeStepStatusV224.value=s?.status||'Not Started';
  initiativeStepRemarkV224.value=s?.remark||'';
  initiativeStepModalV224.classList.add('show');
}
function closeInitiativeStepV224(){initiativeStepModalV224?.classList.remove('show')}
function saveInitiativeStepV224(){
  if(!geInitiativeAdminV224())return;
  const id=Number(initiativeStepParentIdV224.value),x=(data.initiatives||[]).find(v=>v.id===id);if(!x)return;
  x.workflow=Array.isArray(x.workflow)?x.workflow:[];
  const obj={title:initiativeStepTitleV224.value.trim(),pic:initiativeStepPicV224.value.trim(),dueDate:initiativeStepDueDateV224.value,status:initiativeStepStatusV224.value,remark:initiativeStepRemarkV224.value.trim()};
  if(!obj.title)return;
  const idx=initiativeStepEditIndexV224.value;
  if(idx==='')x.workflow.push(obj);else x.workflow[Number(idx)]=obj;
  save();closeInitiativeStepV224();openInitiativeTimelineV224(id);
}
function deleteInitiativeStepV224(id,index){
  if(!geInitiativeAdminV224()||!confirm('Hapus tahapan ini?'))return;
  const x=(data.initiatives||[]).find(v=>v.id===id);if(!x)return;
  x.workflow.splice(index,1);save();openInitiativeTimelineV224(id);
}

/* Updated CSV — Initiative + Milestone visibility */
exportCSV=function(){
 let csv='Record Type,Initiative ID,Initiative,Journey Scope,Touch Point,Airport,PIC,Due Date,Target (%),Realisasi (%),Pencapaian,Milestone,Milestone PIC,Milestone Due Date,Milestone Status,Remark\n';
 currentInitiativeRows().filter(geInitiativeScopedV224).forEach((x)=>{
   const q=v=>'"'+String(v??'').replaceAll('"','""')+'"';
   csv+=['Initiative',x.id,q(x.name),q(geScopesV252(x).join(' | ')),q(geTPsV252(x).join(' | ')),q(x.airport||''),q(x.pic||''),x.dueDate||'',x.plan||0,x.real||0,achievement(x.plan,x.real),'','','','',q(x.remark||'')].join(',')+'\n';
   const milestones=Array.isArray(x.workflow)?x.workflow:(Array.isArray(x.milestones)?x.milestones:[]);
   milestones.forEach((m)=>{csv+=['Milestone',x.id,q(x.name),q(geScopesV252(x).join(' | ')),q(geTPsV252(x).join(' | ')),q(x.airport||''),q(x.pic||''),x.dueDate||'',x.plan||0,x.real||0,achievement(x.plan,x.real),q(m.title||m.name||'Milestone'),q(m.pic||x.pic||''),m.dueDate||m.date||'',q(m.status||''),q(m.remark||m.notes||'')].join(',')+'\n';});
 });
 downloadBlob(csv,'GE_Inisiatif_dan_Milestone.csv','text/csv;charset=utf-8');
};

/* Normalize old records after load */
window.addEventListener('DOMContentLoaded',()=>{
  let changed=false;
  (data.initiatives||[]).forEach(x=>{
    if(!('pic'in x)){x.pic='';changed=true}
    if(!('dueDate'in x)){x.dueDate='';changed=true}
    if(!Array.isArray(x.workflow)){x.workflow=[];changed=true}
    if(!Array.isArray(x.triggerDocuments)){x.triggerDocuments=[];changed=true}
    if(!Array.isArray(x.supportingDocuments)){x.supportingDocuments=[];changed=true}
  });
  if(changed)save();
  renderInitiatives();
});

/* ==============================================================
   V2.25 — Initiative horizontal scroll + robust Visitor template
   ============================================================== */
const GE_LOUNGE_VISITOR_TEMPLATE_B64_V225='UEsDBBQAAAAIAKxgF12pH5jVxwAAACwBAAAPAAAAeGwvd29ya2Jvb2sueG1sjc8xT8MwEAXgv2LdTuxAGlAUp0uXSkwM7K59SazavsjngH8+oiC6sp3ek56+G481BvGBmT0lDW2jQGCy5HxaNOxlfniB4zTW4ZPy9UJ0FTWGxEPVsJayDVKyXTEabmjDVGOYKUdTuKG8SN4yGscrYolBPirVy2h8gu+9W8p/l0gmooZX2tOC4t2zL5RB3Lqz09CCyIN3Gt5ap54unTr0+Nx3h87Cryj/R0Tz7C2eyO4RU/khZQymeEq8+o1ByGmUd568fz59AVBLAwQUAAAACACsYBddtby/NMACAAANIwAADQAAAHhsL3N0eWxlcy54bWzlWt1zojAQ/1eYvFsMoNdzSjvalpl76Uv7cK8IQTOTDyZED/rX35DwZatXvQoW6gubNfvLbze7ixJu7lJKjC0SCebMBfBqDAzEAh5itnLBRkaja3B3e5POEpkR9LxGSBopJSyZpS5YSxnPTDMJ1oj6yRWPEUspibigvkyuuFiZSSyQHya5GSWmNR5PTepjBnJEtqEelYkR8A2TLrAaSkNffoUusMZjYGjIex4iF2RZlo0oHYUhMMwDJnDXZL2eUapmm9WyuWXEWb2+A0qVcvfV2PrEBRCWq/gUadW9LwiWvMQrLcrrUs+vAJwCIOCEC0Osli7wis+p0PgNNNwHbU8m0+n8s6z3QsMf9rWzOA66EHScMSFVnCc6zpiQ/Br7UiLBPEyIUcgvWYxcwDhDFWIx+UOjlfAzaE1Otks4waHmtbpvejxeTL253kFzx/5M+I9zz/F+tof/8PC48Kx/4xeC2qklFyES1V5NQa3Uu/5e1pKUnBarNNUtT6hERT5AhDznbep3VHkAlQdp1GgPqp+wSsSEFKKGKgZ6oSZkuUQD3Zn8L3wa1eucDgAbAH4ck+xpQ5dIeKrnqa+V1uOsOcKE1KOFAlPjYylYh3xomQL8LhTUeE7wilFUJ69fKow1F/iVM5k33QAxiUSZp2nUT/ZbJCQOTvXnUE52WBbwu1DoOidh/3PSvlCTsr4LhY929Y/w4xeUaqjPbB68fOQGR6HNzXMulPb216VgDY3C2fPna9DedycakCvvb6pnq/MOO6T9dSnYQ6PQWZ3bw6lze2B1fvCpSXcPPXYoOJen0J9f0i1GrjPa3Ua7Lh7JY9DX4LflxeTyxdeff0ItRq4z2t1Gux9p24oXxRlr71vhUX44A/EDDsSPXtQHHEh9wH7Wh1mdvO6c87455a30Rv5ugguecspk96y1eaabqGH9YsvtX1BLAwQUAAAACACsYBdd+lwBWQMDAADaDQAAEwAAAHhsL3RoZW1lL3RoZW1lMS54bWy9V9tymzAU/BVG7w03c/OEZBLHbh/SaafJD8ggQI0QHkmOnb/vIG4CjOM0duwHS2LP2UXnsMLXt/ucaK+IcVzQEJhXBtAQjYoY0zQEW5F888HtzTWciwzlSKMwRyFYZFB8//0MtH1OKJ/DEGRCbOa6zqMM5ZBfFRtE9zlJCpZDwa8KluoxgztM05zolmG4eg4xBW3eJUE5ooKXCxFhT9EBsvJa/GKWP/yNLwjTXiEJwQ7TuNg9o70AGoFcLAgLgSE/QNNvrvU2ioiJYCVwJT9NYB0Rv1gykKXrNtJYWv7M7BgkgogxcOmX3y6jRMAoQrSWo4JNxzV8qwErqGp4IHvgmfYgQGGwxwyBe2/N+gESVQ1n4xtdBcsHpx8gUdXQGQXcGdZ9YPcDJKoauqOA2fLOs5b9AInKCKYvY7jr+b7bwFtMUpAfB/GB6xreQ4PvYLrSalUCKnqN9ytJcIRk3+Xwb8FWBRWyylBgqom3DUpgVDYoJHjNsPaI00xIHjhH8B1AxI8C9AFnjum7Ao5QHyFt6ToGXd0MuTW5mHwkE0zIk3gj6JFLcbwgOF5hQuRERrWl2GQLwhrCHjBlsBvzOlXKtU3BQ2CAyVzSQTAV1ZrrNU89nJNt/rOI66Y3WzuAcw5Fd8FwFJ9oGeQs5aqGEneyDs+e0NHRDXXYJ+qQd3KyEN/8sJDgqBBdKQ/BVIPlKeHMarvlESQoLgtWJ+iV9SwlDmZTd2R9dmtPKDHPYIyavMaUkqlm67rwDEVWpHj+YSVBMCGk3KpLFFkf2wGh/Zm2K/m95u7+yyw2jIsHyLMKJy+15ytVaALD+QIaq9yZy9Howz1ESYIiMbHSTR+5qLMcvPxZdDkptgKxpyzeaWuyZX9gHALHMx0DaDHmoimAFmPWtc/4/aJbh2STwdrJew9thZfjllMRK+UMpffnteJ1ujrLcfV+1MC1puzWm34SL3A+Bsq5pPhH4H/UUyurPPexqepQ5U0arT0hz76Q0XZd+XWGOmzZ0mOb1zE5G/yBalZu/gFQSwMEFAAAAAgArGAXXQ0euehlAAAAcwAAABQAAAB4bC9zaGFyZWRTdHJpbmdzLnhtbAXBUQrDIAwA0KtI/mfcPsaQ2p5F2rQKJhaTDY+/95ZtcnM/Glq7JHj6AI5k70eVK8HXzscHtnWZUdXc5CYaZ4JidkdE3QtxVt9vksnt7IOzqe/jQr0H5UMLkXHDVwhv5FwFHK5/UEsDBBQAAAAIAKxgF111Bp8QSQwAAPZdAAAYAAAAeGwvd29ya3NoZWV0cy9zaGVldDEueG1sndzbbtvGGobhWyF0WsfWfmPUKdp4duhyYbRdLXLIWLTMFUp0SSpJ736B8siZf+aVivSkqZ+Qtj/XQd8k4nz/w5dtlX0qmrasdzeD0eVwkBW7h3pd7jY3g333+GY5+OHt91+uP9fNx/apKLrsy7batddfbgZPXfd8fXXVPjwV27y9rJ+L3Zdt9Vg327xrL+tmc9U+N0W+Pty2ra7Gw+H8apuXu0H/Dg+qDxffN9m6eMz3Vfdr/dkW5eapuxmMZoPsqr/woa5a/2O2LftPcpBt8y+HHz+X6+7pZjCaDrKncr0udjeD4SB72Lddvf3T/9zXd/Ny+9jfPv56+/gbbp/42yevt4/n33D71N8+/frRv+X2mb999u8++bm/ff7vbl/42xf/bvvS3778evu3fPSVv331evtk+E+3X339/jl8w93mXd6/0dSfs+ZwUf+9Nl4eb3797jt8jz701/w4GmTt4Sve3Qzarjn8zKe3vxfb5yrviuy/z1Wdr7M32X/q/W5TZH+UbdnVTf+hP718Aod/NvXn4AP3u7ubwWR67gOPDx+4/y8kPrJry2y7r/Iy+5A3ZZvNLrPf891mk1fZyy++7P379+/f3N29ub29yP7MP3b7zNrru7uL7Lfir32xeyiytmj3/Tuo86b/pZ495217md3un6vyY95lv+Tb/Dtd9Z/Sd6/3dOU6/5jlH/Ndti6b4mO+zfZVvttcnp86DRZND4vGo/hr+fLpi/fjb/npxC2HWXTDuxM39JOy+2K33z7nuw3deXvizpevQ/bLfvuhaOhGdeLG41eO7tEn7vmxbJ7rpqNbzLllL998dJs9cdvPeVds6qY8/0VxJ+7+tXgsmmLXlpmqyk35oazK7u/z3wiz4Bthdnivk9Xx1/jhP/ULTichvvNXjkO8JVSEmtAQWkInMFk0DxbNadGcFs1pEaEi1ISG0BK6+dlFi2DRghYtaNGCFhEqQk1oCC2hW5xdtAwWLWnRkhYtaRGhItSEhtASuuXZRatg0YoWrWjRihYRKkJNaAgtoVudXTQahv+7HdImr9Go47VyFapC1agG1aI6qek2kRIj3DbCbSPcRqpQNapBtahOarptHG4b47YxbhvjNlKFqlENqkV1UtNtk3DbBLdNcNsEt5EqVI1qUC2qk5puC5us/80TbJvitiluI1WoGtWgWlQnNd0WZkb/m0jYhqFxvDbahqmBqlENqkV1UtNtYXD0v2+EbZgcx2ujbRgdqBrVoFpUJzXdFqbHCNvDa7wN6wNVoWpUg2pRndR0WxghI6wQr/E27BBUhapRDapFdVLTbWGOjLBHvMbbsEhQFapGNagW1UlNf5cedskYu8RrtO14rdyGqlA1qkG1qE5quk38SQN2idd4G3YJqkLVqAbVojqp6bawS/o/Y4Jt2CXHa6Nt2CWoGtWgWlQnNd0WdskYu8RrvA27BFWhalSDalGd1HRb2CVj7BKv8TbsElSFqlENqkV1UtNtYZeMsUu8xtuwS1AVqkY1qBbVSU23hV3S/5EwbMMuOV4bbcMuQdWoBtWiOqnptrBLxtglXuNt2CWoClWjGlSL6qSm28Iu6f8QHLZhlxyvjbZhl6BqVINqUZ3UdFvYJWPsEq/xNuwSVIWqUQ2qRXVSk22TsEv6vwRJt3mNth2vldtQFapGNagW1UlNt4VdMsEu8Rpvwy5BVaga1aBaVCc13RZ2SX8RbMMuOV4bbcMuQdWoBtWiOqnptrBLJtglXuNt2CWoClWjGlSL6qSm28Iu6f/ODrZhlxyvjbZhl6BqVINqUZ3UdFvYJRPsEq/xNuwSVIWqUQ2qRXVS021hl0ywS7zG27BLUBWqRjWoFtVJTbeFXTLBLvEab8MuQVWoGtWgWlQnNd0WdskEu8RrvA27BFWhalSDalGd1HRb2CX9KNiGXXK8NtqGXYKqUQ2qRXVS07/qD7tkil3iNdp2vFZuQ1WoGtWgWlQnNd0WdskUu8RrvA27BFWhalSDalGd1HRb2CVT7BKv8TbsElSFqlENqkV1UtNtYZf0nz5swy45Xhttwy5B1agG1aI6qek28doa7BKv8TbsElSFqlENqkV1UtNtYZdMsUu8xtuwS1AVqkY1qBbVSU23hV0yxS7xGm/DLkFVqBrVoFpUJzXdFnbJFLvEa7wNuwRVoWpUg2pRndR0W9glU+wSr/E27BJUhapRDapFdVLTbWGXTLFLvMbbsEtQFapGNagW1UlNX3kWdskMu8Rr/OIz7BJUhapRDapFdVLTbWGXzLBLvMbbsEtQFapGNagW1UlNt4VdMsMu8Rpvwy5BVaga1aBaVCc13RZ2yQy7xGu8DbsEVaFqVINqUZ3UdFvYJTPsEq/xNuwSVIWqUQ2qRXVS023iZaz8OlZ+ISu/kpVfysqvZeUXs/KrWfnlrOe7ZBZ2yQy7xGu8DbsEVaFqVINqUZ3UdFvYJTPsEq/xNuwSVIWqUQ2qRXVS021hl8ywS7zG27BLUBWqRjWoFtVJTbeFXTLDLvEab8MuQVWoGtWgWlQnNX39eNglc+wSr/FLyLFLUBWqRjWoFtVJTbeFXTLHLvEab8MuQVWoGtWgWlQnNd0Wdskcu8RrvA27BFWhalSDalGd1HRb2CVz7BKv8TbsElSFqlENqkV1UtNtYZfMsUu8xtuwS1AVqkY1qBbVSU23hV0yxy7xGm/DLkFVqBrVoFpUJzXdJh604Sdt+FEbftaGH7bhp234cRt+3oYfuDnfJfOwS+bYJV7jbdglqApVoxpUi+qkptvCLpljl3iNt2GXoCpUjWpQLaqTmm4Lu2SOXeI13oZdgqpQNapBtahOavoUWNglC+wSr/GDYNglqApVoxpUi+qkptvCLllgl3iNt2GXoCpUjWpQLaqTmm4Lu2SBXeI13oZdgqpQNapBtahOarot7JIFdonXeBt2CapC1agG1aI6qem2sEsW2CVe423YJagKVaMaVIvqpKbbwi5ZYJd4jbdhl6AqVI1qUC2qk5puC7tkgV3iNd6GXYKqUDWqQbWoTmq6TTwKzM8C88PA/DQwPw7MzwPzA8H8RDA/Eny+SxZhlyywS7zG27BLUBWqRjWoFtVJTbeFXbLALvEab8MuQVWoGtWgWlQnNX2WO+ySJXaJ1/hxbuwSVIWqUQ2qRXVS021hlyyxS7zG27BLUBWqRjWoFtVJTbeFXbLELvEab8MuQVWoGtWgWlQnNd0WdskSu8RrvA27BFWhalSDalGd1HRb2CVL7BKv8TbsElSFqlENqkV1UtNtYZcssUu8xtuwS1AVqkY1qBbVSU23hV2yxC7xGm/DLkFVqBrVoFpUJzXdFnbJErvEa7wNuwRVoWpUg2pRndR0mzishE8r4eNK+LwSPrCETyzhI0v4zBI+tOR8lyzDLllil3iNt2GXoCpUjWpQLaqTmp7IEnbJCrvEa3woC3YJqkLVqAbVojqp6bawS1bYJV7jbdglqApVoxpUi+qkptvCLllhl3iNt2GXoCpUjWpQLaqTmm4Lu2SFXeI13oZdgqpQNapBtahOarot7JIVdonXeBt2CapC1agG1aI6qem2sEtW2CVe423YJagKVaMaVIvqpKbbwi5ZYZd4jbdhl6AqVI1qUC2qk5puC7tkhV3iNd6GXYKqUDWqQbWoTmq6LeySFXaJ13gbdgmqQtWoBtWiOqnpNnGcGp+nxgeq8YlqfKQan6nGh6rxqWp8rNo/nasmD1Y7cbLaiaPVTpytduJwtROnq504Xu3E+WonDlj7hxPWhuKItSGfseY5WcmnrCErZs1smC2zixhWisPWhnzamudkJZ+3hqyYNbNhtswuYlgpjl0b8rlrnpOVfPIasmLWzIbZMruIYaU4gG3oW2UYrfQ8jVb6fhDjb5kVs2Y2zJbZRXxceRUdtbwtmk3xrqheTmF+fStrisd+/LU7HvQc/9T42r1+/eQ7Wedd/kdeleu8K+tdmz3U+93r2cnyJ7Pu7+fiZlCVbTfI2r8O79nOrg+b+qv7E5P3VT56O/hp35a7om2zd1Xethf3Vd6Vu/32QlVlV2T31b69MPe/XfxcNP/L2/7I3bv7Hy9MXa2z+6b8VFbFpni59kLd3Q76T/r1ffdvyE8L6LDsOd8Ud3mzKXdtVhWP3c1geLkYZM3L4dCHf+/q58O/zQbZh7rr6u3xraciXxdN/9ZkkD3Wdff6xsvX8PUI97f/B1BLAwQUAAAAAACsYBddhTfEpSgBAAAoAQAACwAAAF9yZWxzLy5yZWxz77u/PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48UmVsYXRpb25zaGlwcyB4bWxucz0iaHR0cDovL3NjaGVtYXMub3BlbnhtbGZvcm1hdHMub3JnL3BhY2thZ2UvMjAwNi9yZWxhdGlvbnNoaXBzIj48UmVsYXRpb25zaGlwIFR5cGU9Imh0dHA6Ly9zY2hlbWFzLm9wZW54bWxmb3JtYXRzLm9yZy9vZmZpY2VEb2N1bWVudC8yMDA2L3JlbGF0aW9uc2hpcHMvb2ZmaWNlRG9jdW1lbnQiIFRhcmdldD0iL3hsL3dvcmtib29rLnhtbCIgSWQ9IlI0MTZmOWY1NGM1OGU0NzI2IiAvPjwvUmVsYXRpb25zaGlwcz5QSwMEFAAAAAgArGAXXZOP4h8OAQAA8gIAABoAAAB4bC9fcmVscy93b3JrYm9vay54bWwucmVsc7WSTU7DMBBGr2J5T+ykjhujpt2wYVt6AdeZxFb9E9kupGdjwZG4AqIglCAWbLqZxTfS05tP8/76ttlNzqJniMkE3+KyoBiBV6EzfmjxOfd3Dd5tN3uwMpvgkzZjQpOzPrVY5zzeE5KUBidTEUbwk7N9iE7mVIQ4kFGqkxyAVJRyEucMvGSiw2WE/xBD3xsFD0GdHfj8B5ikfLGQMDrIOEBuMZnsd1ZMzmL02LV4f2y4qiSTQCmwZiUwIjcTyhocLH2u0dcsl1aUAeeMc8FKTm9plbSM0D3laPzwu635aqbXCy7UuoaKccGkgFvqvYR4ShogL9V+4s8DAPK8vbKjqyOjNYc1ZzVTVz2y+NztB1BLAwQUAAAACACsYBddjYLZqRYBAABTAwAAEwAAAFtDb250ZW50X1R5cGVzXS54bWytk0FOwzAQRa8SeYtqpywQQkm7ALaABBewnEli1R5bnmlIz8aCI3EFVAdFgJAi1G48m/F7/y/m4+292o7eFQMksgFrsZalKABNaCx2tdhzu7oW2031cohAxegdUi165nijFJkevCYZIuDoXRuS10wypE5FbXa6A3VZllfKBGRAXvGRITbVHbR677i4Hxlw0o7eieJ22juqaqFjdNZotgHVgM0vySq0rTXQBLP3gCwpJtAN9QDsncxTem3xIoPVn84Ejv4n/WolE7i8Q72NNCseB0jJNlA86cQP2kMt1OgU8cEByTM3zNAlNffgYXrXJwfImMWyvU7QPHOy2J2983f2UpDXkHb5I6k8Tu//M8zMn4OofCKbT1BLAQIUAxQAAAAIAKxgF12pH5jVxwAAACwBAAAPAAAAAAAAAAAAAACkgQAAAAB4bC93b3JrYm9vay54bWxQSwECFAMUAAAACACsYBddtby/NMACAAANIwAADQAAAAAAAAAAAAAApIH0AAAAeGwvc3R5bGVzLnhtbFBLAQIUAxQAAAAIAKxgF136XAFZAwMAANoNAAATAAAAAAAAAAAAAACkgd8DAAB4bC90aGVtZS90aGVtZTEueG1sUEsBAhQDFAAAAAgArGAXXQ0euehlAAAAcwAAABQAAAAAAAAAAAAAAKSBEwcAAHhsL3NoYXJlZFN0cmluZ3MueG1sUEsBAhQDFAAAAAgArGAXXXUGnxBJDAAA9l0AABgAAAAAAAAAAAAAAKSBqgcAAHhsL3dvcmtzaGVldHMvc2hlZXQxLnhtbFBLAQIUAxQAAAAAAKxgF12FN8SlKAEAACgBAAALAAAAAAAAAAAAAACkgSkUAABfcmVscy8ucmVsc1BLAQIUAxQAAAAIAKxgF12Tj+IfDgEAAPICAAAaAAAAAAAAAAAAAACkgXoVAAB4bC9fcmVscy93b3JrYm9vay54bWwucmVsc1BLAQIUAxQAAAAIAKxgF12NgtmpFgEAAFMDAAATAAAAAAAAAAAAAACkgcAWAABbQ29udGVudF9UeXBlc10ueG1sUEsFBgAAAAAIAAgAAwIAAAcYAAAAAA==';
function downloadLoungeVisitorTemplateV225(){
  try{
    const binary=atob(GE_LOUNGE_VISITOR_TEMPLATE_B64_V225);
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=url;
    anchor.download='Template_Lounge_Visitor_Bulk.xlsx';
    anchor.style.display='none';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(()=>{URL.revokeObjectURL(url);anchor.remove()},500);
  }catch(e){
    geStorageNoticeV223('Template Tidak Dapat Diunduh','Browser gagal membuat file template. Silakan gunakan file CSV template pada folder templates.');
  }
}


/* ==============================================================
   V2.29 — Layanan Lounge & consolidated Planning Documents
   ============================================================== */

/* New records use one master for Lounge, Tenant, and Snack Box. */
openLoungeAddModalV221 = (function(original){
  return function(){
    original();
    const e=document.getElementById('loungeServiceTypeV229');
    if(e)e.value='Lounge';
  };
})(openLoungeAddModalV221);

saveLoungeFromModalV221 = function(){
  if(!(typeof gxCanManage==='function'&&gxCanManage()))return;

  const airport=loungeAirportV221.value.trim().toUpperCase();
  const name=loungeNameV221.value.trim();
  const serviceType=document.getElementById('loungeServiceTypeV229')?.value||'Lounge';

  if(!airport||!name){
    if(typeof geStorageNoticeV223==='function')
      return geStorageNoticeV223('Data Belum Lengkap','Airport dan Nama Layanan / Provider wajib diisi.');
    return;
  }

  const obj={
    id:Date.now(),
    airport,
    name,
    pic:loungePicV221.value.trim(),
    region:loungeRegionV221.value.trim(),
    serviceCategory:serviceType,
    serviceType,
    startDate:loungeStartV221.value,
    endDate:loungeEndV221.value,
    pricePerPax:Number(loungePriceV221.value||0),
    currency:loungeCurrencyV221.value.trim().toUpperCase(),
    documentNumber:loungeDocumentNumberV221.value.trim(),
    documentType:loungeDocumentTypeV221.value.trim(),
    documentStatus:loungeDocumentStatusV221.value,
    remarks:loungeRemarksV221.value.trim(),
    documentName:'',
    documentKey:'',
    priceDisplay:'',
    startDisplay:loungeStartV221.value,
    endDisplay:loungeEndV221.value
  };

  data.lounges=data.lounges||[];
  data.lounges.push(obj);
  save();
  closeLoungeAddModalV221();

  if(typeof renderLounges==='function')renderLounges();
  if(typeof renderLoungeList==='function')renderLoungeList();
  if(typeof renderLoungeProcurement==='function')renderLoungeProcurement();

  if(typeof geStorageNoticeV223==='function'){
    geStorageNoticeV223('Layanan Tersimpan',`${serviceType} — ${name} berhasil ditambahkan.`,'success');
  }
};

/* Existing legacy records remain compatible: category = service type. */
window.addEventListener('DOMContentLoaded',()=>{
  let changed=false;
  (data.lounges||[]).forEach(l=>{
    if(!l.serviceType){
      l.serviceType=l.serviceCategory||'Lounge';
      changed=true;
    }
  });
  if(changed)save();
});

/* Consolidated planning-document library */
function gePlanningDocumentsV229(){
  const rows=[];
  const add=x=>rows.push({...x,_id:`PD-${rows.length+1}-${Date.now()}`});

  /* Central Document Master */
  (data.documents||[]).forEach(d=>add({
    date:d.date||d.documentDate||'',
    category:d.category||'Planning Document',
    title:d.title||d.fileName||'Document',
    airport:d.airport||d.relatedAirport||'',
    source:d.source||'Document Master',
    reference:d.referenceNo||d.documentNumber||'',
    fileName:d.fileName||'',
    blobKey:d.blobKey||''
  }));

  /* Initiative trigger + execution documents */
  (data.initiatives||[]).forEach(i=>{
    [
      ...((i.triggerDocuments||[]).map(d=>({...d,_group:'Trigger Inisiatif'}))),
      ...((i.supportingDocuments||[]).map(d=>({...d,_group:'Dokumen Pelaksanaan'})))
    ].forEach(d=>add({
      date:d.documentDate||'',
      category:d.type||d._group,
      title:`${i.name||'Inisiatif'} — ${d.type||d._group}`,
      airport:i.airport||'',
      source:`Kegiatan & Inisiatif / ${d._group}`,
      reference:d.referenceNo||'',
      fileName:d.fileName||'',
      blobKey:d.blobKey||''
    }));
  });

  /* Lounge / Tenant / Snack Box legal documents */
  (data.lounges||[]).forEach(l=>{
    if(l.documentName||l.documentNumber||l.documentKey){
      add({
        date:l.startDate||'',
        category:l.documentType||'Layanan Lounge',
        title:`${l.serviceType||l.serviceCategory||'Lounge'} — ${l.name||'Provider'}`,
        airport:l.airport||'',
        source:'Layanan Lounge',
        reference:l.documentNumber||'',
        fileName:l.documentName||'',
        blobKey:l.documentKey||''
      });
    }
  });

  /* Branch Office Space / Building */
  (data.boSpaces||[]).forEach(x=>{
    if(x.documentName||x.documentKey){
      add({
        date:x.startDate||'',
        category:'Space & Building',
        title:`${x.airport||''} — ${x.location||'Space & Building'}`,
        airport:x.airport||'',
        source:'Service Planning / Branch Office Planning',
        reference:x.documentName||'',
        fileName:x.documentName||'',
        blobKey:x.documentKey||''
      });
    }
  });

  /* Station Material */
  (data.stationMaterials||[]).forEach(x=>{
    if(x.documentName||x.documentKey||x.contractNumber){
      add({
        date:x.startDate||'',
        category:'Station Material',
        title:`${x.airport||''} — ${x.product||'Station Material'}`,
        airport:x.airport||'',
        source:'Service Planning / Station Material',
        reference:x.contractNumber||'',
        fileName:x.documentName||'',
        blobKey:x.documentKey||''
      });
    }
  });

  return rows;
}

renderPlanningDocuments = function(){
  const tbody=document.getElementById('planningDocumentRows');
  if(!tbody)return;

  const rows=gePlanningDocumentsV229();
  gePlanningPopulateSelect('planningDocCategory',rows.map(x=>x.category),'Semua Category');
  gePlanningPopulateSelect('planningDocAirport',rows.map(x=>x.airport),'Semua Airport');

  const q=(planningDocSearch?.value||'').toLowerCase();
  const c=planningDocCategory?.value||'';
  const a=planningDocAirport?.value||'';

  const filtered=rows.filter(x=>
    (!q||`${x.title} ${x.fileName} ${x.reference} ${x.source} ${x.airport}`.toLowerCase().includes(q)) &&
    (!c||x.category===c) &&
    (!a||x.airport===a)
  );

  tbody.innerHTML=filtered.map((x,i)=>`<tr>
    <td>${i+1}</td>
    <td>${x.date||'-'}</td>
    <td>${geEsc(x.category||'-')}</td>
    <td><b>${geEsc(x.title||'-')}</b>${x.reference?`<div class="planning-doc-ref-v229">${geEsc(x.reference)}</div>`:''}</td>
    <td>${geEsc(x.airport||'-')}</td>
    <td>${geEsc(x.source||'-')}</td>
    <td>${
      x.blobKey
        ? `<button class="btn secondary compact-btn" onclick="GEFiles.download('${x.blobKey}','${String(x.fileName||'document').replaceAll("'","")}')">Unduh</button>`
        : geEsc(x.fileName||'-')
    }</td>
  </tr>`).join('');

  gePlanningEmpty('planningDocumentEmpty',filtered);
  if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
};


/* ==============================================================
   V2.30 — Layanan Lounge modal hotfix + bulk upload/template
   ============================================================== */
const GE_LOUNGE_SERVICE_TEMPLATE_B64_V230='UEsDBBQAAAAIAP1qF10yK4aPxwAAACwBAAAPAAAAeGwvd29ya2Jvb2sueG1sjc/BTsMwDAbgV4l8p+mqsrKq6S5ckHbiDUzrttESu4pTKG+PGIhduVn/L/363J33GMw7JfXCDg5FCYZ4kNHz7GDL08MTnPtubz8kXd9ErmaPgbXdHSw5r621OiwUUQtZifcYJkkRsxaSZqtrIhx1Icox2KosjzaiZ/jeu6X6dxnGSA4u+ImMbC6y8Uxgbt3L6OAAJrV+dPBaV4/HqsbyhNTUp6aBX1H6j0imyQ/0LMMWifMPKVHA7IV18auCsX1n7zx7/7z/AlBLAwQUAAAACAD9ahddvDji474CAADIIQAADQAAAHhsL3N0eWxlcy54bWzlWt9zojAQ/leY+HoKAfV6jthRW2bupS/tw70iBM1MfjAhetC//gYCiFZbvSqK+pLNyn777Sa7UePwMaZEWyERYc5sADsG0BDzuI/Z3AZLGbQfwONoGA8imRD0ukBIajElLBrENlhIGQ50PfIWiLpRh4eIxZQEXFBXRh0u5noUCuT6UWpGiW4aRl+nLmYgRWRL6lAZaR5fMmkDs6LU1PDbt4FpGEBTkFPuIxskSZK0KW37PtD0PSZw06T1o9UyOimQPhrqpefUOOBsTaELClUW8bu2cokNICwcuRQp1dQVBEte4BUWxThTz5cA3RzA44QLTcxnNnDy17HQeAsa7oK2er1+f/xd1juh4U/roTs5DDoXVJ4xIWWeeyrPmJB0DF0pkWAOJkTL5bckRDZgnKESMX/4S6O5cBNo9o62izjBvuI1n1YjNiZ9Z6xWUN+wPxH+89jpOr/Oh//09DxxzM/xcyFbqRkXPhJbNaGUatU/ykqSktPcS1X96QOlmLn2ECGvaZ/5E5T+YeY/Dir1nTUEVoqYkFxUUPlEOapCFi4q6F3rf+HjYO3neABYAXDDkCQvSzpDwsmaVvZ2pnU4q84wIevZJAPL5odSMPfFcGYK8F4oZPMxwXNG0XrzuoVCW3CB3zmTacv0EJNIFPs0DprJfoWExN6x8ezbkzWWBbwXCnXvSdj8PWldqEmZ90Lhq1X9K9zwDcUK6juLBy+fuZujcM7F615o21v3QuHki3cdtHcdAzcUyscT7WRFVmN7su6FQm1FdvnPWjcUymmLbO/vBfV93d+gYF6ewpWfZPVkrjba9WZ7XTySh6CpyT9XFNbli+/KT7h6Mlcb7Xqz3Yxte5Yo8uvBxrfCg+IwbyQOeCNxNKI+4I3UB2xmfejlnePGDefW/Wap19I7dRu8pJTJ5i1j9TYzyqbr/2SM/gFQSwMEFAAAAAgA/WoXXfpcAVkDAwAA2g0AABMAAAB4bC90aGVtZS90aGVtZTEueG1svVfbcpswFPwVRu8NN3PzhGQSx24f0mmnyQ/IIECNEB5Jjp2/7yBuAozjNHbsB0tiz9lF57DC17f7nGiviHFc0BCYVwbQEI2KGNM0BFuRfPPB7c01nIsM5UijMEchWGRQfP/9DLR9TiifwxBkQmzmus6jDOWQXxUbRPc5SQqWQ8GvCpbqMYM7TNOc6JZhuHoOMQVt3iVBOaKClwsRYU/RAbLyWvxilj/8jS8I014hCcEO07jYPaO9ABqBXCwIC4EhP0DTb671NoqIiWAlcCU/TWAdEb9YMpCl6zbSWFr+zOwYJIKIMXDpl98uo0TAKEK0lqOCTcc1fKsBK6hqeCB74Jn2IEBhsMcMgXtvzfoBElUNZ+MbXQXLB6cfIFHV0BkF3BnWfWD3AySqGrqjgNnyzrOW/QCJygimL2O46/m+28BbTFKQHwfxgesa3kOD72C60mpVAip6jfcrSXCEZN/l8G/BVgUVsspQYKqJtw1KYFQ2KCR4zbD2iNNMSB44R/AdQMSPAvQBZ47puwKOUB8hbek6Bl3dDLk1uZh8JBNMyJN4I+iRS3G8IDheYULkREa1pdhkC8Iawh4wZbAb8zpVyrVNwUNggMlc0kEwFdWa6zVPPZyTbf6ziOumN1s7gHMORXfBcBSfaBnkLOWqhhJ3sg7PntDR0Q112CfqkHdyshDf/LCQ4KgQXSkPwVSD5SnhzGq75REkKC4LVifolfUsJQ5mU3dkfXZrTygxz2CMmrzGlJKpZuu68AxFVqR4/mElQTAhpNyqSxRZH9sBof2Ztiv5vebu/sssNoyLB8izCicvtecrVWgCw/kCGqvcmcvR6MM9REmCIjGx0k0fuaizHLz8WXQ5KbYCsacs3mlrsmV/YBwCxzMdA2gx5qIpgBZj1rXP+P2iW4dkk8HayXsPbYWX45ZTESvlDKX357Xidbo6y3H1ftTAtabs1pt+Ei9wPgbKuaT4R+B/1FMrqzz3sanqUOVNGq09Ic++kNF2Xfl1hjps2dJjm9cxORv8gWpWbv4BUEsDBBQAAAAIAP1qF10NHrnoZQAAAHMAAAAUAAAAeGwvc2hhcmVkU3RyaW5ncy54bWwFwVEKwyAMANCrSP5n3D7GkNqeRdq0CiYWkw2Pv/eWbXJzPxpauyR4+gCOZO9HlSvB187HB7Z1mVHV3OQmGmeCYnZHRN0LcVbfb5LJ7eyDs6nv40K9B+VDC5Fxw1cIb+RcBRyuf1BLAwQUAAAACAD9ahddlRxzH/4PAAASgwAAGAAAAHhsL3dvcmtzaGVldHMvc2hlZXQxLnhtbK3dWVMbVxrG8a/SpWubRaAFKmTKPlt8lpQrcSblyzZqg8paGEnYzrefanHAZ/kLj11zE8MPnVfyo4bqB6f7/PKvr8tF87nbbOfr1dXg9Ohk0HSr6/Vsvrq5GtzvPr6cDv716y9fL7+sN5+2t123a74uF6vt5derwe1ud3d5fLy9vu2W7fZofdetvi4XH9ebZbvbHq03N8fbu03XzvbLlovj4cnJ+HjZzleDfuBe9f7BbzfNrPvY3i92f6y//NbNb253V4PT0aA57h94vV5s45/Nct6/yEGzbL/u//wyn+1urwanw0FzO5/NutXV4GTQXN9vd+vl3/Fr38Y8LB/G5cOfW34Wl589LR9Of2D5eVx+/u3Zf2T5KC4ffXv2H3nx47h8/HN/90lcPvm2fPQDy6dx+fTnll/E5Rc/t/z05PG4OfkW3vmPDHg68L4decOTHxnweOj1H/zMu3/6ePD1H8QBZ999Bcffvof233Sy3bX9J5v1l2azf1D//dYfxQ+Ln74D99+n1/1jXp0Omu3+qNtdDba7zf4rn3991y3vFu2ua/66W6zbWfOy8e0/7apdNX59v7rp+qf+/PAC9v/drL8kT9wfeburwfnwuSce7p+4Dyx75jfbebO8X7Tz5kO7mW+b0VFju9V8+/gCLuMraI6bd92qXe2a4+bPVXv9qXm9/nrU/Llrd/P1qrm5X7Wf2lXz5tW7V831etYdNe/a1c1Nu3j60sPPs+b9+/fvX4bwUsqjxrfLu/mmXTWz9af7ZbdqZvP7ftFtc9dtmk13vd7MmmW3aBf382a3Xn5YL5p37fJDe3v8192szyu+yqPnAzpPcjjf59AfblkOf3Q38/UqGxNXvD6wIv7VaYk4sOT3dtk+vbPHzdvN+vN81m1ohDwwIntzaKE6sPDtG0EP1wceHtpd2/zVrm5okTmw6Ld2c9M2b7tN87b9Sgt/O7Dw8VgJ/ZFIC998Z+HrbtN+up1jlPbQu7FerjeNfDj0aKF79j14ZqF/5pC5f3ZlOHh4LtvNp+3zh/koOcxH+zn9z7Tjb0cyoSCUhIpQE5oHPH/6ubt/7+MjJym+IbQ00xF6wpBhldI4SWlMKREKQkmoCDWhGVNKY0qJ0NJMR+gJw/jZlCZJShNKiVAQSkJFqAnNhFKaUEqElmY6Qk8YJs+mNE1SmlJKhIJQEipCTWimlNKUUiK0NNMResIwfTaliySlC0qJUBBKQkWoCc0FpXRBKRFamukIPWG4eDal05P0NPGEckIVqBJVoWpUE7VI6/GxeVyoFuc6VI8acq0zy06tTzEzUoEqURWqRjVRy8xOMTNSi3MdqkcNudaZDdPMhpgZqUCVqApVo5qoZWZDzIzU4lyH6lFDrnVmZ2lmZ5gZqUCVqApVo5qoZWZnmBmpxbkO1aOGXOvM0tZ1eo6ZkQpUiapQNaqJWmZ2jpmRWpzrUD1qyLXOLD2F738pA5nhSTyqRFWoGtVELTPDU3lUi3MdqkcNudaZpSf0p3hGjypQJapC1agmapkZntijWpzrUD1qyLXOLD29P8Xze1SBKlEVqkY1UcvM8DQf1eJch+pRQ651ZunJfv/bRsgMT/dRJapC1agmapkZnvSjWpzrUD1qyLXOLD31P8Vzf1SBKlEVqkY1UcvMsAKgWpzrUD1qyLX+bW7aA/pfBNWZoQpUiapQNaqJWmT2+Ng8M1SLcx2qRw251pllv+nGHoAqUCWqQtWoJmqZGfYAVItzHapHDbnWmaU9oP/HL8gMewCqRFWoGtVELTPDHoBqca5D9agh1zqztAcMsQegClSJqlA1qolaZoY9ANXiXIfqUUOudWZpD+j/nRAywx6AKlEVqkY1UcvMsAegWpzrUD1qyLXOLO0BQ+wBqAJVoipUjWqilplhD0C1ONehetSQa51Z2gOG2ANQBapEVaga1UQtM8MegGpxrkP1qCHXOrO0BwyxB6AKVImqUDWqiVpmhj0A1eJch+pRQ651ZmkP6P+xHzLDHoAqURWqRjVRy8ywB6BanOtQPWrItc4s7QFD7AGoAlWiKlSNaqKWmWEPQLU416F61JBrldlZ2gP6B9WZoQpUiapQNaqJWmT2+Ng8M1SLcx2qRw251pmlPeAMewCqQJWoClWjmqhlZtgDUC3OdageNeRaZ5b2gDPsAagCVaIqVI1qopaZYQ9AtTjXoXrUkGudWdoDzrAHoApUiapQNaqJWmaGPQDV4lyH6lFDrnVmaQ84wx6AKlAlqkLVqCZqmRn2AFSLcx2qRw251pmlPeAMewCqQJWoClWjmqhlZtgDUC3OdageNeRaZ5b2gDPsAagCVaIqVI1qopaZYQ9AtTjXoXrUkGudWdoD+ieHzLAHoEpUhapRTdQyM+wBqBbnOlSPGnKtM0t7wBn2AFSBKlEVqkY1UcvMsAegWpzrUD1qyLXOLO0BZ9gDUAWqRFWoGtVELTPDHoBqca5D9agh1/p/Xk57wDn2AFSBKlEVqkY1UYvMHh+bZ4Zqca5D9agh1zqztAf0LxQywx6AKlEVqkY1UcvMsAegWpzrUD1qyLXOLO0B/bUEkBn2AFSJqlA1qolaZoY9ANXiXIfqUUOudWZpDzjHHoAqUCWqQtWoJmqZGfYAVItzHapHDbnWmWVXY2APQBWoElWhalQTtcwMewCqxbkO1aOGXOvM0h5wjj0AVaBKVIWqUU3UMjPsAagW5zpUjxpyrTNLe8A59gBUgSpRFapGNVHLzLAHoFqc61A9asi1ziztAefYA1AFqkRVqBrVRC0zwx6AanGuQ/WoIdc6s7QHnGMPQBWoElWhalQTtcwMewCqxbkO1aOGXOvM0h5wjj0AVaBKVIWqUU3UMjPsAagW5zpUjxpyra/uSnvACHsAqkCVqApVo5qo5VVe2ANQLc51qB415FpnlvaAEfYAVIEqURWqRjVRy8ywB6BanOtQPWrItc4s7QEj7AGoAlWiKlSNaqKWmWEPQLU416F61JBrnVnaA0bYA1AFqkRVqBrVRC0zwx6AanGuQ/WoIdc6s7QHjLAHoApUiapQNaqJWmaGPQDV4lyH6lFDrnVm2SW+fI0vX+TLV/nyZb58nS9f6MtX+vKlvnytL1/sy1f78uW+z/eAUdoDRtgDUAWqRFWoGtVELTPDHoBqca5D9agh1zqztAeMsAegClSJqlA1qolaZoY9ANXiXIfqUUOudWZpDxhhD0AVqBJVoWpUE7XMDHsAqsW5DtWjhlzrzNIeMMIegCpQJapC1agmapkZ9gBUi3MdqkcNudb3L0h7wBh7AKpAlagKVaOaqOV9DLAHoFqc61A9asi1ziztAWPsAagCVaIqVI1qopaZYQ9AtTjXoXrUkGudWdoDxtgDUAWqRFWoGtVELTPDHoBqca5D9agh1zqztAeMsQegClSJqlA1qolaZoY9ANXiXIfqUUOudWZpDxhjD0AVqBJVoWpUE7XMDHsAqsW5DtWjhlzrzNIeMMYegCpQJapC1agmapkZ9gBUi3MdqkcNudaZZTf+4Tv/8K1/+N4/fPMfvvsP3/6H7//DNwDiOwDxLYD4HkB8E6Dne8A47QFj7AGoAlWiKlSNaqKWmWEPQLU416F61JBrnVnaA8bYA1AFqkRVqBrVRC0zwx6AanGuQ/WoIdc6s7QHjLEHoApUiapQNaqJWmaGPQDV4lyH6lFDrvUdutIeMMEegCpQJapC1agmanmnLuwBqBbnOlSPGnKtM0t7wAR7AKpAlagKVaOaqGVm2ANQLc51qB415FpnlvaACfYAVIEqURWqRjVRy8ywB6BanOtQPWrItc4s7QET7AGoAlWiKlSNaqKWmWEPQLU416F61JBrnVnaAybYA1AFqkRVqBrVRC0zwx6AanGuQ/WoIdc6s7QHTLAHoApUiapQNaqJWmaGPQDV4lyH6lFDrnVmaQ+YYA9AFagSVaFqVBO1zAx7AKrFuQ7Vo4Zc68yy24Hy/UD5hqB8R1C+JSjfE5RvCsp3BeXbgvJ9QfnGoHxnUL416PM9YJL2gAn2AFSBKlEVqkY1UcvMsAegWpzrUD1qyLXOLO0BE+wBqAJVoipUjWqilplhD0C1ONehetSQa30P2rQHTLEHoApUiapQNaqJWt6LFnsAqsW5DtWjhlzrzNIeMMUegCpQJapC1agmapkZ9gBUi3MdqkcNudaZpT1gij0AVaBKVIWqUU3UMjPsAagW5zpUjxpyrTNLe8AUewCqQJWoClWjmqhlZtgDUC3OdageNeRaZ5b2gCn2AFSBKlEVqkY1UcvMsAegWpzrUD1qyLXOLO0BU+wBqAJVoipUjWqilplhD0C1ONehetSQa51Z2gOm2ANQBapEVaga1UQtM8MegGpxrkP1qCHXOrO0B0yxB6AKVImqUDWqiVpmhj0A1eJch+pRQ651ZtkmAbxLAG8TwPsE8EYBvFMAbxXAewXwZgG8WwBvF8D7BfCGAc/3gGnaA6bYA1AFqkRVqBrVRC0zwx6AanGuQ/WoIdd6l4W0B1xgD0AVqBJVoWpUE7XcbQF7AKrFuQ7Vo4Zc68zSHnCBPQBVoEpUhapRTdQyM+wBqBbnOlSPGnKtM0t7wAX2AFSBKlEVqkY1UcvMsAegWpzrUD1qyLXOLO0BF9gDUAWqRFWoGtVELTPDHoBqca5D9agh1zqztAdcYA9AFagSVaFqVBO1zAx7AKrFuQ7Vo4Zc68zSHnCBPQBVoEpUhapRTdQyM+wBqBbnOlSPGnKtM0t7wAX2AFSBKlEVqkY1UcvMsAegWpzrUD1qyLXOLO0BF9gDUAWqRFWoGtVELTPDHoBqca5D9agh1zqztAdcYA9AFagSVaFqVBO1zAx7AKrFuQ7Vo4Zc68yyrcN47zDePIx3D+Ptw3j/MN5AjHcQ4y3EeA8x3kSMdxHjbcS+t49YvpHYgZ3EDmwldmAvsQObiR3YTezAdmIH9hM7sKHYgR3FDmwpdmBPsQObin1nV7GTbFuxE95XDFkwS2bFrJnNI1cJ8vZiyJZnO2bPHAqGBLNNxk54lzFkwSyZFbNmNo9cJcibjSFbnu2YPXMoGBLMthw74T3HkAWzZFbMmtk8cpUgbz2GbHm2Y/bMoWBIMNuA7CSeOWev+zWzYJbMilkzm0fuby2VJRgfPS0SJLY82zF75lDwY4LHxfbmy25z04lu8bDz+dNnzab72Ad7GR6nll8aXoaHv+NxOWTW7tp/t4v5bL+F9ra5Xt+vdleDh0M+/2Kz++euuxos5tvdoNn+52Hy6HL/hvaP7rcVv1+0p78O/lZ/vnuhXv357sWb398N+id9+lr/ST72f3siObqU9RM97Ij+4mE/9BdPu6H/f57Sjy7371f+lPs1L952q9l8dfPizepz//n3n7Ciffp37U0X2s3NfLVtFt3H3dXg5GgyaDYPm8bvP96t7/YfjQbNh/Vut14+fnbbtbNu0392Nmg+rte7p08e3ucv682n/dHz638BUEsDBBQAAAAAAP1qF11z5LorKAEAACgBAAALAAAAX3JlbHMvLnJlbHPvu788P3htbCB2ZXJzaW9uPSIxLjAiIGVuY29kaW5nPSJ1dGYtOCI/PjxSZWxhdGlvbnNoaXBzIHhtbG5zPSJodHRwOi8vc2NoZW1hcy5vcGVueG1sZm9ybWF0cy5vcmcvcGFja2FnZS8yMDA2L3JlbGF0aW9uc2hpcHMiPjxSZWxhdGlvbnNoaXAgVHlwZT0iaHR0cDovL3NjaGVtYXMub3BlbnhtbGZvcm1hdHMub3JnL29mZmljZURvY3VtZW50LzIwMDYvcmVsYXRpb25zaGlwcy9vZmZpY2VEb2N1bWVudCIgVGFyZ2V0PSIveGwvd29ya2Jvb2sueG1sIiBJZD0iUjI1OGQ5ZTczMzE3ODRjN2QiIC8+PC9SZWxhdGlvbnNoaXBzPlBLAwQUAAAACAD9ahddDFsvRRABAADyAgAAGgAAAHhsL19yZWxzL3dvcmtib29rLnhtbC5yZWxztZJLTsMwEIavYnlP7DiO01RNu2HDtvQCQzJ5qH5Etgvp2VhwJK6AKAgliAWbbGbxj/Tpm1/z/vq2O0xGk2f0YXC2omnCKUFbu2awXUUvsb3b0MN+d0QNcXA29MMYyGS0DRXtYxy3jIW6RwMhcSPayejWeQMxJM53bIT6DB0ywblifs6gSyY5XUf8D9G17VDjvasvBm38A8xCvGoMlJzAdxgryib9nSWT0ZQ8NBU9IggsIcsFV4XMlKKErSYUezS49LlFXzOdWZUNzxWC2BStkFnO17QKPXhsHqMfbPe7rflqpqdKyFUqAVWmpISnNfVenD+HHjEu1X7izwMQ47w9KXIlJPASsJBlUdz02OJz9x9QSwMEFAAAAAgA/WoXXY2C2akWAQAAUwMAABMAAABbQ29udGVudF9UeXBlc10ueG1srZNBTsMwEEWvEnmLaqcsEEJJuwC2gAQXsJxJYtUeW55pSM/GgiNxBVQHRYCQItRuPJvxe/8v5uPtvdqO3hUDJLIBa7GWpSgATWgsdrXYc7u6FttN9XKIQMXoHVIteuZ4oxSZHrwmGSLg6F0bktdMMqRORW12ugN1WZZXygRkQF7xkSE21R20eu+4uB8ZcNKO3onidto7qmqhY3TWaLYB1YDNL8kqtK010ASz94AsKSbQDfUA7J3MU3pt8SKD1Z/OBI7+J/1qJRO4vEO9jTQrHgdIyTZQPOnED9pDLdToFPHBAckzN8zQJTX34GF61ycHyJjFsr1O0DxzstidvfN39lKQ15B2+SOpPE7v/zPMzJ+DqHwim09QSwECFAMUAAAACAD9ahddMiuGj8cAAAAsAQAADwAAAAAAAAAAAAAApIEAAAAAeGwvd29ya2Jvb2sueG1sUEsBAhQDFAAAAAgA/WoXXbw44uO+AgAAyCEAAA0AAAAAAAAAAAAAAKSB9AAAAHhsL3N0eWxlcy54bWxQSwECFAMUAAAACAD9ahdd+lwBWQMDAADaDQAAEwAAAAAAAAAAAAAApIHdAwAAeGwvdGhlbWUvdGhlbWUxLnhtbFBLAQIUAxQAAAAIAP1qF10NHrnoZQAAAHMAAAAUAAAAAAAAAAAAAACkgREHAAB4bC9zaGFyZWRTdHJpbmdzLnhtbFBLAQIUAxQAAAAIAP1qF12VHHMf/g8AABKDAAAYAAAAAAAAAAAAAACkgagHAAB4bC93b3Jrc2hlZXRzL3NoZWV0MS54bWxQSwECFAMUAAAAAAD9ahddc+S6KygBAAAoAQAACwAAAAAAAAAAAAAApIHcFwAAX3JlbHMvLnJlbHNQSwECFAMUAAAACAD9ahddDFsvRRABAADyAgAAGgAAAAAAAAAAAAAApIEtGQAAeGwvX3JlbHMvd29ya2Jvb2sueG1sLnJlbHNQSwECFAMUAAAACAD9ahddjYLZqRYBAABTAwAAEwAAAAAAAAAAAAAApIF1GgAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLBQYAAAAACAAIAAMCAAC8GwAAAAA=';

function downloadLoungeTemplateV230(){
  try{
    const binary=atob(GE_LOUNGE_SERVICE_TEMPLATE_B64_V230);
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='Template_Layanan_Lounge.xlsx';a.style.display='none';
    document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},500);
  }catch(e){
    geStorageNoticeV223('Template Tidak Dapat Diunduh','Browser gagal membuat template. Gunakan file pada folder templates.');
  }
}

/* Full override: do not call the legacy V2.21 opener, which referenced
   loungeServiceCategoryV221 after that field was removed in V2.29. */
function openLoungeAddModalV230(){
  if(!(typeof gxCanManage==='function'&&gxCanManage()))return;
  const ids=['loungeAirportV221','loungeNameV221','loungePicV221','loungeRegionV221',
    'loungeCurrencyV221','loungeDocumentNumberV221','loungeDocumentTypeV221','loungeRemarksV221'];
  ids.forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});
  const st=document.getElementById('loungeServiceTypeV229');if(st)st.value='Lounge';
  const ds=document.getElementById('loungeDocumentStatusV221');if(ds)ds.value='Valid';
  const sd=document.getElementById('loungeStartV221');if(sd)sd.value='';
  const ed=document.getElementById('loungeEndV221');if(ed)ed.value='';
  const pp=document.getElementById('loungePriceV221');if(pp)pp.value='';
  const df=document.getElementById('loungeDocumentFileV230');if(df)df.value='';
  document.getElementById('loungeAddModalV221')?.classList.add('show');
}

saveLoungeFromModalV221 = async function(){
  if(!(typeof gxCanManage==='function'&&gxCanManage()))return;

  const airport=document.getElementById('loungeAirportV221')?.value.trim().toUpperCase()||'';
  const name=document.getElementById('loungeNameV221')?.value.trim()||'';
  const serviceType=document.getElementById('loungeServiceTypeV229')?.value||'Lounge';

  if(!airport||!name){
    return geStorageNoticeV223('Data Belum Lengkap','Airport dan Nama Layanan / Provider wajib diisi.');
  }

  let documentName='',documentKey='';
  const file=document.getElementById('loungeDocumentFileV230')?.files?.[0];
  if(file){
    documentKey='lounge_doc_'+Date.now();
    await GEFiles.put(documentKey,file);
    documentName=file.name;
  }

  const obj={
    id:Date.now(),
    airport,
    name,
    pic:document.getElementById('loungePicV221')?.value.trim()||'',
    region:document.getElementById('loungeRegionV221')?.value.trim()||'',
    serviceCategory:serviceType,
    serviceType,
    startDate:document.getElementById('loungeStartV221')?.value||'',
    endDate:document.getElementById('loungeEndV221')?.value||'',
    pricePerPax:Number(document.getElementById('loungePriceV221')?.value||0),
    currency:(document.getElementById('loungeCurrencyV221')?.value||'').trim().toUpperCase(),
    documentNumber:document.getElementById('loungeDocumentNumberV221')?.value.trim()||'',
    documentType:document.getElementById('loungeDocumentTypeV221')?.value.trim()||'',
    documentStatus:document.getElementById('loungeDocumentStatusV221')?.value||'Valid',
    remarks:document.getElementById('loungeRemarksV221')?.value.trim()||'',
    documentName,documentKey,
    priceDisplay:'',
    startDisplay:document.getElementById('loungeStartV221')?.value||'',
    endDisplay:document.getElementById('loungeEndV221')?.value||''
  };

  data.lounges=data.lounges||[];
  data.lounges.push(obj);
  save();
  closeLoungeAddModalV221();
  fillAirportSelects();
  renderLounges();
  if(typeof renderLoungeProcurement==='function')renderLoungeProcurement();
  geStorageNoticeV223('Layanan Tersimpan',`${serviceType} — ${name} berhasil ditambahkan.`,'success');
};

/* Extend existing offline XLSX/CSV importer with Layanan Lounge */
GE_IMPORT_SCHEMA_V223.lounge={
  title:'Upload Data Layanan Lounge',
  help:'Gunakan Template Layanan Lounge. Data akan masuk ke master Lounge / Tenant / Snack Box. Lampiran file dapat ditambahkan melalui Update pada masing-masing record.',
  aliases:{
    region:['region'],
    airport:['station','airport'],
    name:['nama layanan provider','nama layanan / provider','lounge provider'],
    serviceType:['jenis layanan','kategori layanan'],
    pic:['pic'],
    currency:['mata uang','currency'],
    pricePerPax:['harga per pax'],
    startDate:['tanggal mulai','mulai','start date'],
    endDate:['tanggal berakhir','berakhir','end date'],
    documentNumber:['nomor dokumen'],
    documentType:['jenis dokumen'],
    documentStatus:['status dokumen'],
    remarks:['remarks','remark']
  }
};

function geImportLoungeV230(rows){
  if(!(typeof gxCanManage==='function'&&gxCanManage()))return{added:0,skipped:rows.length};
  data.lounges=data.lounges||[];
  let added=0,skipped=0;

  rows.forEach(r=>{
    const airport=String(r.airport||'').trim().toUpperCase();
    const name=String(r.name||'').trim();
    const serviceType=String(r.serviceType||'Lounge').trim()||'Lounge';
    if(!airport||!name||!['Lounge','Tenant','Snack Box'].includes(serviceType)){
      skipped++;return;
    }

    data.lounges.push({
      id:Date.now()+added+Math.floor(Math.random()*10000),
      region:String(r.region||'').trim(),
      airport,
      name,
      serviceCategory:serviceType,
      serviceType,
      pic:String(r.pic||'').trim(),
      currency:String(r.currency||'').trim().toUpperCase(),
      pricePerPax:Number(String(r.pricePerPax||'0').replace(/,/g,''))||0,
      startDate:geNormalizeDateUploadV223(r.startDate),
      endDate:geNormalizeDateUploadV223(r.endDate),
      documentNumber:String(r.documentNumber||'').trim(),
      documentType:String(r.documentType||'').trim(),
      documentStatus:String(r.documentStatus||'Valid').trim()||'Valid',
      remarks:String(r.remarks||'').trim(),
      documentName:'',
      documentKey:''
    });
    added++;
  });

  save();
  fillAirportSelects();
  renderLounges();
  if(typeof renderLoungeProcurement==='function')renderLoungeProcurement();
  return{added,skipped};
}

function confirmBulkImportV230(){
  const {type,rows}=GE_BULK_IMPORT_V223;if(!rows.length)return;
  let result;
  if(type==='lounge')result=geImportLoungeV230(rows);
  else if(type==='space')result=geImportSpaceV223(rows);
  else if(type==='system')result=geImportSystemV223(rows);
  else if(type==='visitor')result=geImportVisitorV223(rows);
  if(!result)return;
  closeBulkImportV223();
  const extra=result.duplicates!==undefined?` • ${result.duplicates} duplikat`:'';
  geStorageNoticeV223('Import Selesai',`${result.added} data berhasil ditambahkan • ${result.skipped} baris dilewati${extra}.`,result.added?'success':'warning');
}


/* ==============================================================
   V2.31 — GASO Planning, Data Bulk Management, User Master Data
   ============================================================== */

function geAdminV231(){return typeof gxCanManage==='function'&&gxCanManage()}
function geDeleteConfirmV231(label){return confirm(`Hapus ${label}?`)}

/* ---------- Airport Database CRUD ---------- */
function openAirportModalV231(id=null){
 if(!geAdminV231())return;
 const x=id?(data.airports||[]).find(a=>String(a.id)===String(id)):null;
 airportModalTitleV231.textContent=x?'Update Database Airport':'Tambah Database Airport';
 airportEditIdV231.value=x?.id||'';airportCodeV231.value=x?.code||'';airportCityV231.value=x?.city||'';
 airportNameV231.value=x?.airportName||'';airportWilayahV231.value=x?.wilayah||'Domestik';
 airportRegionV231.value=x?.region||'';airportStatusV231.value=x?.status||'Active';
 airportLatV231.value=x?.lat??'';airportLonV231.value=x?.lon??'';
 airportModalV231.classList.add('show');
}
function closeAirportModalV231(){airportModalV231?.classList.remove('show')}
function saveAirportV231(){
 if(!geAdminV231())return;
 const id=Number(airportEditIdV231.value||0),code=airportCodeV231.value.trim().toUpperCase();
 if(!code||!airportCityV231.value.trim())return geStorageNoticeV223('Data Belum Lengkap','Airport Code dan City wajib diisi.');
 const duplicate=(data.airports||[]).find(a=>a.code===code&&a.id!==id);
 if(duplicate)return geStorageNoticeV223('Airport Sudah Ada',`${code} sudah tersedia pada Database Airport.`);
 const obj={id:id||Date.now(),no:0,code,city:airportCityV231.value.trim(),airportName:airportNameV231.value.trim(),
   wilayah:airportWilayahV231.value,region:airportRegionV231.value.trim().toUpperCase(),regionSource:'Admin Master',
   status:airportStatusV231.value,lat:Number(airportLatV231.value||0),lon:Number(airportLonV231.value||0)};
 if(id)Object.assign(data.airports.find(a=>a.id===id),obj);else data.airports.push(obj);
 data.airports.forEach((a,i)=>a.no=i+1);save();closeAirportModalV231();renderAirports();renderAirportMapMarkers();
}
function deleteAirportV231(id){
 if(!geAdminV231())return;const x=(data.airports||[]).find(a=>a.id===id);if(!x||!geDeleteConfirmV231(`Airport ${x.code}`))return;
 data.airports=data.airports.filter(a=>a.id!==id);data.airports.forEach((a,i)=>a.no=i+1);save();renderAirports();renderAirportMapMarkers();
}
renderAirports=function(){
 const t=document.getElementById('airportRows');if(!t)return;
 populateAirportMasterFilters();const rows=airportMasterFiltered(),can=geAdminV231();
 t.innerHTML=rows.map((a,i)=>`<tr>
  <td>${a.no||i+1}</td><td><b>${geEsc(a.code)}</b></td><td>${geEsc(a.city)}</td><td>${geEsc(a.wilayah)}</td><td>${geEsc(a.region||'-')}</td>
  <td>${can?`<select class="inline-status-select ${a.status==='Inactive'?'inactive':''}" onchange="geSetAirportStatus('${a.code}',this.value)"><option ${a.status==='Active'?'selected':''}>Active</option><option ${a.status==='Inactive'?'selected':''}>Inactive</option></select>`:`<span class="pill">${geEsc(a.status)}</span>`}</td>
  <td>${geEsc(a.gm)}</td><td>${Number(a.visitorLounge).toLocaleString('id-ID')}</td><td>${a.contracts}</td><td>${a.pending?`<span class="pending-count">${a.pending}</span>`:'<span class="clear-count">0</span>'}</td>
  ${can?`<td class="visitor-actions"><button class="btn secondary compact-btn" onclick="openAirportModalV231(${a.id})">Update</button><button class="btn danger compact-btn" onclick="deleteAirportV231(${a.id})">Hapus</button></td>`:''}
 </tr>`).join('');
 const all=geAirportVisibleRows(),set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
 set('airportMasterTotal',all.length);set('airportMasterActive',all.filter(x=>x.status==='Active').length);set('airportMasterInactive',all.filter(x=>x.status==='Inactive').length);
 set('airportMasterContracts',all.reduce((s,x)=>s+x.contracts,0));set('airportMasterPending',all.reduce((s,x)=>s+x.pending,0));
 if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
};

/* ---------- Station Material ---------- */
function openStationMaterialModalV231(id=null){
 if(!geAdminV231())return;const x=id?(data.stationMaterials||[]).find(v=>v.id===id):null;
 stationMaterialModalTitleV231.textContent=x?'Update Station Material':'Tambah Station Material';stationMaterialEditIdV231.value=x?.id||'';
 stationMaterialCodeV231.value=x?.code||'';stationMaterialNameV231.value=x?.product||'';stationMaterialAreaV231.value=x?.area||'';
 stationMaterialVendorV231.value=x?.vendor||'';stationMaterialPeriodV231.value=x?.contractPeriod||'';stationMaterialStatusV231.value=x?.status||'Digunakan';
 stationMaterialFileV231.value='';stationMaterialModalV231.classList.add('show');
}
function closeStationMaterialModalV231(){stationMaterialModalV231?.classList.remove('show')}
async function saveStationMaterialV231(){
 if(!geAdminV231())return;const id=Number(stationMaterialEditIdV231.value||0),old=id?(data.stationMaterials||[]).find(x=>x.id===id):null;
 const file=stationMaterialFileV231.files?.[0];let documentName=old?.documentName||'',documentKey=old?.documentKey||'';
 if(file){documentKey=`station_material_${Date.now()}`;await GEFiles.put(documentKey,file);documentName=file.name}
 const obj={id:id||Date.now(),code:stationMaterialCodeV231.value.trim(),product:stationMaterialNameV231.value.trim(),area:stationMaterialAreaV231.value.trim(),
 vendor:stationMaterialVendorV231.value.trim(),startDate:document.getElementById('stationMaterialStartV246')?.value||'',endDate:document.getElementById('stationMaterialEndV246')?.value||'',contractPeriod:stationMaterialPeriodV231.value.trim(),status:stationMaterialStatusV231.value.trim(),documentName,documentKey};
 if(!obj.code||!obj.product||!obj.startDate||!obj.endDate||obj.endDate<obj.startDate)return geStorageNoticeV223('Data Belum Lengkap','Kode Barang, Nama Barang, serta periode Mulai–Berakhir yang valid wajib diisi.');
 if(id)Object.assign(old,obj);else data.stationMaterials.push(obj);try{save();await window.GEStore?.flush?.();closeStationMaterialModalV231();renderStationMaterials();renderPlanningOverview();geStorageNoticeV223('Station Material Tersimpan',`${obj.product} berhasil disimpan.`,'success')}catch(e){geStorageNoticeV223('Penyimpanan Gagal',e.message||String(e),'error')}
}
function deleteStationMaterialV231(id){if(!geAdminV231())return;const x=data.stationMaterials.find(v=>v.id===id);if(!x||!geDeleteConfirmV231(x.product))return;data.stationMaterials=data.stationMaterials.filter(v=>v.id!==id);save();renderStationMaterials()}
renderStationMaterials=function(){
 const tbody=document.getElementById('stationMaterialRows');if(!tbody)return;const rows=data.stationMaterials||[];
 gePlanningPopulateSelect('materialAreaFilterV231',rows.map(x=>x.area),'Semua Area');gePlanningPopulateSelect('materialVendorFilterV231',rows.map(x=>x.vendor),'Semua Vendor');gePlanningPopulateSelect('materialStatusFilter',rows.map(x=>x.status),'Semua Status');
 const q=(materialSearch?.value||'').toLowerCase(),a=materialAreaFilterV231?.value||'',v=materialVendorFilterV231?.value||'',s=materialStatusFilter?.value||'';
 const filtered=rows.filter(x=>(!q||`${x.code} ${x.product} ${x.vendor}`.toLowerCase().includes(q))&&(!a||x.area===a)&&(!v||x.vendor===v)&&(!s||x.status===s));
 tbody.innerHTML=filtered.map((x,i)=>`<tr><td>${i+1}</td><td><b>${geEsc(x.code)}</b></td><td>${geEsc(x.product)}</td><td>${geEsc(x.area||'-')}</td><td>${geEsc(x.vendor||'-')}</td><td>${geEsc(x.contractPeriod||'-')}</td><td><span class="planning-status">${geEsc(x.status||'-')}</span></td><td>${x.documentKey?`<button class="btn secondary compact-btn" onclick="GEFiles.download('${x.documentKey}','${String(x.documentName||'document').replaceAll("'","")}')">Unduh</button>`:geEsc(x.documentName||'-')}</td>${geAdminV231()?`<td class="visitor-actions"><button class="btn secondary compact-btn" onclick="openStationMaterialModalV231(${x.id})">Update</button><button class="btn danger compact-btn" onclick="deleteStationMaterialV231(${x.id})">Hapus</button></td>`:''}</tr>`).join('');
 gePlanningEmpty('stationMaterialEmpty',filtered);if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
};

/* ---------- Airport Systems based on user-supplied CUTE/CUPPS structure ---------- */
function openAirportSystemModalV231(id=null){
 if(!geAdminV231())return;const x=id?(data.airportSystems||[]).find(v=>v.id===id):null;
 airportSystemModalTitleV231.textContent=x?'Update Airport System':'Tambah Airport System';airportSystemEditIdV231.value=x?.id||'';
 airportSystemAirportV231.value=x?.airport||'';airportSystemProviderV231.value=x?.provider||'';airportSystemSbdV231.value=x?.sbd||'';
 airportSystemKioskV231.value=x?.kiosk||'';airportSystemCheckinV231.value=x?.checkin||'';airportSystemGateV231.value=x?.boardingGate||'';
 airportSystemTransferV231.value=x?.transferDesk||'';airportSystemAreaV231.value=x?.area||'';airportSystemRemarksV231.value=x?.remarks||'';
 airportSystemModalV231.classList.add('show');
}
function closeAirportSystemModalV231(){airportSystemModalV231?.classList.remove('show')}
function saveAirportSystemV231(){
 if(!geAdminV231())return;const id=Number(airportSystemEditIdV231.value||0),obj={id:id||Date.now(),airport:airportSystemAirportV231.value.trim().toUpperCase(),
 sbd:airportSystemSbdV231.value.trim(),kiosk:airportSystemKioskV231.value.trim(),checkin:airportSystemCheckinV231.value.trim(),boardingGate:airportSystemGateV231.value.trim(),
 transferDesk:airportSystemTransferV231.value.trim(),provider:airportSystemProviderV231.value.trim(),area:airportSystemAreaV231.value.trim(),remarks:airportSystemRemarksV231.value.trim()};
 if(!obj.airport)return; if(id)Object.assign(data.airportSystems.find(x=>x.id===id),obj);else data.airportSystems.push(obj);save();closeAirportSystemModalV231();renderAirportSystems();
}
function deleteAirportSystemV231(id){if(!geAdminV231())return;const x=data.airportSystems.find(v=>v.id===id);if(!x||!geDeleteConfirmV231(`Airport System ${x.airport}`))return;data.airportSystems=data.airportSystems.filter(v=>v.id!==id);save();renderAirportSystems()}
renderAirportSystems=function(){
 const tbody=document.getElementById('airportSystemRows');if(!tbody)return;const rows=gePlanningScoped(data.airportSystems||[]);
 gePlanningPopulateSelect('systemAirportFilter',rows.map(x=>x.airport),'Semua Airport');gePlanningPopulateSelect('systemProviderFilterV231',rows.map(x=>x.provider),'Semua Provider');gePlanningPopulateSelect('systemAreaFilterV231',rows.map(x=>x.area),'Semua Area');
 const q=(systemSearch?.value||'').toLowerCase(),a=systemAirportFilter?.value||'',p=systemProviderFilterV231?.value||'',ar=systemAreaFilterV231?.value||'';
 const filtered=rows.filter(x=>(!q||`${x.airport} ${x.provider} ${x.checkin} ${x.boardingGate}`.toLowerCase().includes(q))&&(!a||x.airport===a)&&(!p||x.provider===p)&&(!ar||x.area===ar));
 tbody.innerHTML=filtered.map((x,i)=>`<tr><td>${i+1}</td><td><b>${geEsc(x.airport)}</b></td><td>${geEsc(x.sbd||'-')}</td><td>${geEsc(x.kiosk||'-')}</td><td>${geEsc(x.checkin||'-')}</td><td>${geEsc(x.boardingGate||'-')}</td><td>${geEsc(x.transferDesk||'-')}</td><td>${geEsc(x.provider||'-')}</td><td>${geEsc(x.area||'-')}</td><td>${geEsc(x.remarks||'-')}</td>${geAdminV231()?`<td class="visitor-actions"><button class="btn secondary compact-btn" onclick="openAirportSystemModalV231(${x.id})">Update</button><button class="btn danger compact-btn" onclick="deleteAirportSystemV231(${x.id})">Hapus</button></td>`:''}</tr>`).join('');
 const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set('systemTotalV231',rows.length);set('systemKioskV231',rows.filter(x=>String(x.kiosk).toLowerCase().includes('tersedia')).length);set('systemSbdV231',rows.filter(x=>String(x.sbd).toLowerCase().includes('tersedia')).length);set('systemMcoV231',rows.filter(x=>String(x.provider).toUpperCase()==='MCO').length);
 gePlanningEmpty('airportSystemEmpty',filtered);if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
};

/* ---------- GASO three-panel CRUD ---------- */
const GE_GASO_FIELDS_V231={
 master:[['code','GASO Code','text'],['officeName','Office Name','text'],['city','City','text'],['region','Region','text'],['address','Address','textarea'],['status','Status','select:Active|Inactive'],['pic','PIC','text'],['contact','Contact','text'],['remarks','Remarks','textarea']],
 support:[['code','GASO Code','text'],['service','Facility / Service','text'],['provider','Provider','text'],['startDate','Start Date','date'],['endDate','End Date','date'],['status','Status','select:Active|Pending|Expired|Inactive'],['document','Document / Reference','text'],['remarks','Remarks','textarea']],
 planning:[['code','GASO Code','text'],['item','Planning Item','text'],['category','Category','text'],['vendor','Vendor / Partner','text'],['currency','Budget Currency','text'],['amount','Budget Amount','number'],['dueDate','Due Date','date'],['status','Status','select:Planned|On Progress|Completed|Hold'],['document','Document / Reference','text'],['remarks','Remarks','textarea']]
};
const GE_GASO_COLLECTION_V231={master:'gasoMaster',support:'gasoServiceSupport',planning:'gasoPlanningService'};
let GE_GASO_EDIT_V231={type:null,id:null};
function showGasoPanelV231(type,button){
 ['master','support','planning'].forEach(k=>{const e=document.getElementById('gasoPanel'+k.charAt(0).toUpperCase()+k.slice(1)+'V231');if(e)e.style.display=k===type?'block':'none'});
 document.querySelectorAll('.gaso-selector-v231').forEach(x=>x.classList.remove('active'));button?.classList.add('active');
 if(type==='master')renderGasoMasterV231();if(type==='support')renderGasoSupportV231();if(type==='planning')renderGasoPlanningV231();
}
function openGasoModalV231(type,id=null){
 if(!geAdminV231())return;const coll=GE_GASO_COLLECTION_V231[type],x=id?(data[coll]||[]).find(v=>v.id===id):null;GE_GASO_EDIT_V231={type,id:x?.id||null};
 gasoModalTitleV231.textContent=(x?'Update ':'Tambah ')+(type==='master'?'GASO Master':type==='support'?'Service Support':'Planning Service');
 gasoModalFormV231.innerHTML=`<form onsubmit="event.preventDefault();saveGasoV231()"><div class="formgrid">${GE_GASO_FIELDS_V231[type].map(([key,label,kind])=>{
  const val=x?.[key]??'';if(kind==='textarea')return`<label>${label}<textarea data-gaso-field="${key}" rows="3">${geEsc(val)}</textarea></label>`;
  if(kind.startsWith('select:'))return`<label>${label}<select data-gaso-field="${key}">${kind.slice(7).split('|').map(o=>`<option ${val===o?'selected':''}>${o}</option>`).join('')}</select></label>`;
  return`<label>${label}<input data-gaso-field="${key}" type="${kind}" value="${geEsc(val)}"></label>`}).join('')}</div><div class="modal-actions sticky-actions"><button class="btn">Simpan</button><button type="button" class="btn secondary" onclick="closeGasoModalV231()">Batal</button></div></form>`;
 gasoModalV231.classList.add('show');
}
function closeGasoModalV231(){gasoModalV231?.classList.remove('show')}
function saveGasoV231(){
 if(!geAdminV231())return;const {type,id}=GE_GASO_EDIT_V231,coll=GE_GASO_COLLECTION_V231[type],obj={id:id||Date.now()};
 document.querySelectorAll('#gasoModalFormV231 [data-gaso-field]').forEach(el=>obj[el.dataset.gasoField]=el.type==='number'?Number(el.value||0):el.value.trim());
 obj.code=String(obj.code||'').toUpperCase();if(!obj.code)return;
 if(id)Object.assign(data[coll].find(x=>x.id===id),obj);else data[coll].push(obj);save();closeGasoModalV231();renderGasoAllV231();
}
function deleteGasoV231(type,id){if(!geAdminV231())return;const coll=GE_GASO_COLLECTION_V231[type],x=data[coll].find(v=>v.id===id);if(!x||!geDeleteConfirmV231(x.code||'GASO record'))return;data[coll]=data[coll].filter(v=>v.id!==id);save();renderGasoAllV231()}
function gasoActionsV231(type,id){return geAdminV231()?`<td class="visitor-actions"><button class="btn secondary compact-btn" onclick="openGasoModalV231('${type}',${id})">Update</button><button class="btn danger compact-btn" onclick="deleteGasoV231('${type}',${id})">Hapus</button></td>`:''}
function renderGasoMasterV231(){
 const t=document.getElementById('gasoMasterRowsV231');if(!t)return;const rows=data.gasoMaster||[];gePlanningPopulateSelect('gasoMasterRegionV231',rows.map(x=>x.region),'Semua Region');
 const q=(gasoMasterSearchV231?.value||'').toLowerCase(),r=gasoMasterRegionV231?.value||'',s=gasoMasterStatusV231?.value||'',f=rows.filter(x=>(!q||`${x.code} ${x.officeName} ${x.city} ${x.pic}`.toLowerCase().includes(q))&&(!r||x.region===r)&&(!s||x.status===s));
 t.innerHTML=f.map((x,i)=>`<tr><td>${i+1}</td><td><b>${geEsc(x.code)}</b></td><td>${geEsc(x.officeName||'-')}</td><td>${geEsc(x.city||'-')}</td><td>${geEsc(x.region||'-')}</td><td>${geEsc(x.address||'-')}</td><td>${geEsc(x.status||'-')}</td><td>${geEsc(x.pic||'-')}</td><td>${geEsc(x.contact||'-')}</td><td>${geEsc(x.remarks||'-')}</td>${gasoActionsV231('master',x.id)}</tr>`).join('');gePlanningEmpty('gasoMasterEmptyV231',f);if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}
function renderGasoSupportV231(){
 const t=document.getElementById('gasoSupportRowsV231');if(!t)return;const rows=data.gasoServiceSupport||[];gePlanningPopulateSelect('gasoSupportStatusV231',rows.map(x=>x.status),'Semua Status');
 const q=(gasoSupportSearchV231?.value||'').toLowerCase(),s=gasoSupportStatusV231?.value||'',p=(gasoSupportProviderV231?.value||'').toLowerCase(),f=rows.filter(x=>(!q||`${x.code} ${x.service} ${x.provider}`.toLowerCase().includes(q))&&(!s||x.status===s)&&(!p||String(x.provider).toLowerCase().includes(p)));
 t.innerHTML=f.map((x,i)=>`<tr><td>${i+1}</td><td><b>${geEsc(x.code)}</b></td><td>${geEsc(x.service||'-')}</td><td>${geEsc(x.provider||'-')}</td><td>${x.startDate||'-'}</td><td>${x.endDate||'-'}</td><td>${geEsc(x.status||'-')}</td><td>${geEsc(x.document||'-')}</td><td>${geEsc(x.remarks||'-')}</td>${gasoActionsV231('support',x.id)}</tr>`).join('');gePlanningEmpty('gasoSupportEmptyV231',f);if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}
function renderGasoPlanningV231(){
 const t=document.getElementById('gasoPlanningRowsV231');if(!t)return;const rows=data.gasoPlanningService||[];gePlanningPopulateSelect('gasoPlanningCategoryV231',rows.map(x=>x.category),'Semua Category');gePlanningPopulateSelect('gasoPlanningStatusV231',rows.map(x=>x.status),'Semua Status');
 const q=(gasoPlanningSearchV231?.value||'').toLowerCase(),c=gasoPlanningCategoryV231?.value||'',s=gasoPlanningStatusV231?.value||'',f=rows.filter(x=>(!q||`${x.code} ${x.item} ${x.vendor}`.toLowerCase().includes(q))&&(!c||x.category===c)&&(!s||x.status===s));
 t.innerHTML=f.map((x,i)=>`<tr><td>${i+1}</td><td><b>${geEsc(x.code)}</b></td><td>${geEsc(x.item||'-')}</td><td>${geEsc(x.category||'-')}</td><td>${geEsc(x.vendor||'-')}</td><td>${geEsc(x.currency||'')} ${Number(x.amount||0).toLocaleString('id-ID')}</td><td>${x.dueDate||'-'}</td><td>${geEsc(x.status||'-')}</td><td>${geEsc(x.document||'-')}</td><td>${geEsc(x.remarks||'-')}</td>${gasoActionsV231('planning',x.id)}</tr>`).join('');gePlanningEmpty('gasoPlanningEmptyV231',f);if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}
function renderGasoAllV231(){renderGasoMasterV231();renderGasoSupportV231();renderGasoPlanningV231()}

/* ---------- Bulk import schemas ---------- */
Object.assign(GE_IMPORT_SCHEMA_V223,{
 airport:{title:'Upload Database Airport',help:'Gunakan Template Database Airport.',aliases:{code:['airport code'],city:['city'],airportName:['airport name'],wilayah:['wilayah'],region:['region'],status:['status'],lat:['latitude'],lon:['longitude']}},
 personnel:{title:'Upload Data Personil',help:'Gunakan Template Data Personil.',aliases:{employeeNo:['no pegawai','no. pegawai'],name:['nama'],position:['position'],sitaCode:['sita code'],airport:['airport'],function:['fungsi'],email:['email']}},
 'station-material':{title:'Upload Station Material',help:'CSV only. Kolom mandatory: Kode Barang, Nama Barang Cetak Kestasiunan, Mulai, Berakhir.',aliases:{code:['kode barang','kode barang*'],product:['nama barang cetak kestasiunan','nama barang cetak kestasiunan*'],area:['area'],vendor:['provider','vendor'],startDate:['mulai','mulai*'],endDate:['berakhir','berakhir*'],status:['status']}},
 'airport-system-v231':{title:'Upload Airport Systems',help:'Gunakan Template Airport Systems terbaru.',aliases:{airport:['airport'],sbd:['self baggage drop sbd','self baggage drop (sbd)'],kiosk:['kiosk-k'],checkin:['check-in'],boardingGate:['boarding gate'],transferDesk:['transfer desk'],provider:['provider'],area:['area'],remarks:['remarks']}},
 'gaso-master':{title:'Upload GASO Master',help:'Gunakan Template GASO Master.',aliases:{code:['gaso code'],officeName:['office name'],city:['city'],region:['region'],address:['address'],status:['status'],pic:['pic'],contact:['contact'],remarks:['remarks']}},
 'gaso-support':{title:'Upload GASO Service Support',help:'Gunakan Template GASO Service Support.',aliases:{code:['gaso code'],service:['facility service','facility / service'],provider:['provider'],startDate:['start date'],endDate:['end date'],status:['status'],document:['document reference','document / reference'],remarks:['remarks']}},
 'gaso-planning':{title:'Upload GASO Planning Service',help:'Gunakan Template GASO Planning Service.',aliases:{code:['gaso code'],item:['planning item'],category:['category'],vendor:['vendor partner','vendor / partner'],currency:['budget currency'],amount:['budget amount'],dueDate:['due date'],status:['status'],document:['document reference','document / reference'],remarks:['remarks']}}
});
function geImportSimpleV231(type,rows){
 let added=0,skipped=0;
 if(type==='airport'){rows.forEach(r=>{const code=String(r.code||'').trim().toUpperCase();if(!code){skipped++;return}const existing=data.airports.find(a=>a.code===code);const obj={id:existing?.id||Date.now()+added,code,city:String(r.city||'').trim(),airportName:String(r.airportName||'').trim(),wilayah:String(r.wilayah||'Domestik').trim(),region:String(r.region||'').trim().toUpperCase(),status:String(r.status||'Active').trim(),lat:Number(r.lat||0),lon:Number(r.lon||0),regionSource:'Bulk Upload'};if(existing)Object.assign(existing,obj);else data.airports.push(obj);added++});data.airports.forEach((a,i)=>a.no=i+1);save();renderAirports();return{added,skipped}}
 if(type==='personnel'){rows.forEach(r=>{if(!String(r.name||'').trim()){skipped++;return}data.personnel.push({id:Date.now()+added,employeeNo:String(r.employeeNo||'').trim(),name:String(r.name||'').trim(),position:String(r.position||'').trim(),sitaCode:String(r.sitaCode||'').trim(),airport:String(r.airport||'').trim().toUpperCase(),function:String(r.function||'').trim().toUpperCase(),email:String(r.email||'').trim()});added++});save();renderPersonnel();return{added,skipped}}
 if(type==='station-material'){rows.forEach(r=>{if(!r.code||!r.product){skipped++;return}data.stationMaterials.push({id:Date.now()+added,code:String(r.code).trim(),product:String(r.product).trim(),area:String(r.area||'').trim(),vendor:String(r.vendor||'').trim(),startDate:String(r.startDate||'').trim(),endDate:String(r.endDate||'').trim(),contractPeriod:[String(r.startDate||'').trim(),String(r.endDate||'').trim()].filter(Boolean).join(' — '),status:String(r.status||'').trim(),documentName:'',documentKey:''});added++});save();renderStationMaterials();return{added,skipped}}
 if(type==='airport-system-v231'){rows.forEach(r=>{if(!r.airport){skipped++;return}data.airportSystems.push({id:Date.now()+added,airport:String(r.airport).trim().toUpperCase(),sbd:String(r.sbd||'').trim(),kiosk:String(r.kiosk||'').trim(),checkin:String(r.checkin||'').trim(),boardingGate:String(r.boardingGate||'').trim(),transferDesk:String(r.transferDesk||'').trim(),provider:String(r.provider||'').trim(),area:String(r.area||'').trim(),remarks:String(r.remarks||'').trim()});added++});save();renderAirportSystems();return{added,skipped}}
 const gm={'gaso-master':'gasoMaster','gaso-support':'gasoServiceSupport','gaso-planning':'gasoPlanningService'};if(gm[type]){rows.forEach(r=>{if(!r.code){skipped++;return}const obj={id:Date.now()+added,...r,code:String(r.code).trim().toUpperCase()};if('amount'in obj)obj.amount=Number(obj.amount||0);data[gm[type]].push(obj);added++});save();renderGasoAllV231();return{added,skipped}}
 return null;
}
async function geConfirmImportPersistedV240(result,successMessage){
 if(!result)return false;
 try{
  if(window.GEStore?.flush)await window.GEStore.flush();
  closeBulkImportV223();
  geStorageNoticeV223('Import Selesai',successMessage,result.added?'success':'warning');
  return true;
 }catch(e){
  console.error('[Bulk Import Firestore]',e);
  geStorageNoticeV223('Import Gagal',`Data belum tersimpan ke Firestore. ${e?.message||String(e)}`,'error');
  return false;
 }
}
async function confirmBulkImportV231(){
 const {type,rows}=GE_BULK_IMPORT_V223;if(!rows.length)return;let result;
 if(['airport','personnel','station-material','airport-system-v231','gaso-master','gaso-support','gaso-planning'].includes(type))result=geImportSimpleV231(type,rows);
 else if(type==='lounge')result=geImportLoungeV230(rows);else if(type==='space')result=geImportSpaceV223(rows);else if(type==='system')result=geImportSystemV223(rows);else if(type==='visitor')result=geImportVisitorV223(rows);
 if(!result)return;const extra=result.duplicates!==undefined?` • ${result.duplicates} duplikat`:'';
 return geConfirmImportPersistedV240(result,`${result.added} data berhasil ditambahkan • ${result.skipped} baris dilewati${extra}.`);
}

/* ---------- Planning Documents: file download on every available binary ---------- */
renderPlanningDocuments=function(){
 const tbody=document.getElementById('planningDocumentRows');if(!tbody)return;const rows=typeof gePlanningDocumentsV229==='function'?gePlanningDocumentsV229():(data.documents||[]);
 gePlanningPopulateSelect('planningDocCategory',rows.map(x=>x.category),'Semua Category');gePlanningPopulateSelect('planningDocAirport',rows.map(x=>x.airport),'Semua Airport');
 const q=(planningDocSearch?.value||'').toLowerCase(),c=planningDocCategory?.value||'',a=planningDocAirport?.value||'',filtered=rows.filter(x=>(!q||`${x.title} ${x.fileName} ${x.reference||''} ${x.source||''} ${x.airport||''}`.toLowerCase().includes(q))&&(!c||x.category===c)&&(!a||x.airport===a));
 tbody.innerHTML=filtered.map((x,i)=>`<tr><td>${i+1}</td><td>${x.date||'-'}</td><td>${geEsc(x.category||'-')}</td><td><b>${geEsc(x.title||'-')}</b>${x.reference?`<div class="planning-doc-ref-v229">${geEsc(x.reference)}</div>`:''}</td><td>${geEsc(x.airport||'-')}</td><td>${geEsc(x.source||'-')}</td><td>${x.blobKey?`<button class="btn secondary compact-btn" onclick="GEFiles.download('${x.blobKey}','${String(x.fileName||'document').replaceAll("'","")}')">Unduh</button>`:(x.fileName?`<button class="btn secondary compact-btn" disabled title="File binary belum tersimpan">${geEsc(x.fileName)}</button>`:'-')}</td>${geAdminV231()?`<td><button class="btn secondary compact-btn" onclick="geStorageNoticeV223('Dokumen Planning','Edit/hapus dokumen dilakukan pada modul sumber: ${String(x.source||'Document Master').replaceAll("'","")}.')">Kelola di Sumber</button></td>`:''}</tr>`).join('');
 gePlanningEmpty('planningDocumentEmpty',filtered);if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
};

window.addEventListener('DOMContentLoaded',()=>{renderGasoAllV231();});


/* ==============================================================
   V2.32 — Lounge/Tenant naming, scanner enhancement, traffic chart,
           purchase access, responsive improvements
   ============================================================== */

/* Lounge/Tenant role visibility */
const GE_USER_DEFAULT_TABS_V232=userDefaultTabs;
userDefaultTabs=function(role){
  if(role==='Lounge Luar Biasa')return['lounge-access','lounge-visitor','lounge-purchase'];
  if(role==='Lounge Staff')return['lounge-access','lounge-visitor','lounge-purchase'];
  return GE_USER_DEFAULT_TABS_V232(role);
};

/* External USB/Bluetooth keyboard-wedge scanner:
   automatically verify when scanner sends Enter. */
window.addEventListener('DOMContentLoaded',()=>{
  const scan=document.getElementById('boardingScan');
  if(scan && !scan.dataset.autoScannerV232){
    scan.dataset.autoScannerV232='1';
    scan.addEventListener('keydown',e=>{
      if(e.key==='Enter' && !e.shiftKey){
        e.preventDefault();
        if(scan.value.trim().length>=8)verifyBoardingPass();
      }
    });
  }
});

/* ---------- Lounge/Tenant Visitor hourly traffic ---------- */
function geVisitorTimeInRangeV232(x){
  const hf=document.getElementById('visitorHourFromV232')?.value||'00:00';
  const ht=document.getElementById('visitorHourToV232')?.value||'23:59';
  const tm=String(x.time||'00:00').slice(0,5);
  return tm>=hf && tm<=ht;
}
function geVisitorRowsV232(){
  const base=typeof filteredLoungeVisitors==='function'?filteredLoungeVisitors():(data.loungeVisitors||[]);
  return base.filter(geVisitorTimeInRangeV232);
}
function renderVisitorTrafficV232(){
  const el=document.getElementById('visitorTrafficChartV232');if(!el)return;
  const rows=geVisitorRowsV232();
  const counts=Array(24).fill(0);
  rows.forEach(x=>{
    const h=parseInt(String(x.time||'0').split(':')[0],10);
    if(Number.isFinite(h)&&h>=0&&h<24)counts[h]++;
  });
  const max=Math.max(1,...counts),w=1000,h=270,pL=50,pR=20,pT=25,pB=44;
  const plotW=w-pL-pR,plotH=h-pT-pB;
  const pts=counts.map((v,i)=>{
    const x=pL+(i/23)*plotW, y=pT+plotH-(v/max)*plotH;
    return [x,y];
  });
  const line=pts.map(p=>p.join(',')).join(' ');
  const area=`${pL},${pT+plotH} ${line} ${pL+plotW},${pT+plotH}`;
  const grid=[0,.25,.5,.75,1].map(fr=>{
    const y=pT+plotH-fr*plotH,val=Math.round(max*fr);
    return `<line x1="${pL}" y1="${y}" x2="${pL+plotW}" y2="${y}" class="traffic-grid-v232"/>
      <text x="${pL-10}" y="${y+4}" text-anchor="end" class="traffic-axis-v232">${val}</text>`;
  }).join('');
  const labels=Array.from({length:24},(_,i)=>{
    const x=pL+(i/23)*plotW;
    return `<text x="${x}" y="${h-14}" text-anchor="middle" class="traffic-hour-v232">${String(i).padStart(2,'0')}</text>`;
  }).join('');
  const dots=pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" class="traffic-dot-v232"><title>${String(i).padStart(2,'0')}:00 — ${counts[i]} visitor</title></circle>`).join('');
  el.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Traffic Visitor per Jam">
    ${grid}<polygon points="${area}" class="traffic-area-v232"/><polyline points="${line}" class="traffic-line-v232"/>
    ${dots}${labels}
    <text x="${w/2}" y="${h-1}" text-anchor="middle" class="traffic-axis-title-v232">Jam (00–23)</text>
  </svg>`;
  const peak=Math.max(...counts),peakHours=counts.map((v,i)=>v===peak?i:null).filter(v=>v!==null);
  const peakEl=document.getElementById('visitorPeakHourV232');
  if(peakEl)peakEl.textContent=rows.length?`${String(peakHours[0]).padStart(2,'0')}:00 • ${peak} visitor`:'Belum ada data';
}

/* Keep visitor UI and chart synchronized with filters. */
const GE_RENDER_LOUNGE_VISITORS_V232=renderLoungeVisitors;
renderLoungeVisitors=function(){
  GE_RENDER_LOUNGE_VISITORS_V232();
  /* Hide rows outside hour range after normal renderer; hourly chart uses same time filter. */
  const rows=geVisitorRowsV232();
  const tbody=document.getElementById('loungeVisitorRows');
  if(tbody){
    const visibleIds=new Set(rows.map(x=>String(x.id)));
    [...tbody.querySelectorAll('tr')].forEach(tr=>{
      const btn=tr.querySelector('[onclick*="openVisitorEdit"]');
      if(!btn)return;
      const m=(btn.getAttribute('onclick')||'').match(/\((\d+)\)/);
      if(m&&!visibleIds.has(m[1]))tr.style.display='none';
    });
  }
  renderVisitorTrafficV232();
};
window.addEventListener('DOMContentLoaded',()=>{
  ['visitorHourFromV232','visitorHourToV232'].forEach(id=>{
    document.getElementById(id)?.addEventListener('change',()=>renderLoungeVisitors());
  });
  renderVisitorTrafficV232();
});

/* ---------- Purchase Access ---------- */
function geCanManagePurchaseV232(){
  const r=(geSession()||{}).role;
  return ['Super Admin','Admin','Lounge Staff','Lounge Luar Biasa'].includes(r);
}
function openPurchaseModalV232(id=null){
  if(!geCanManagePurchaseV232())return;
  const x=id?(data.loungePurchases||[]).find(v=>v.id===id):null;
  purchaseModalTitleV232.textContent=x?'Update Pembelian Akses':'Tambah Pembelian Akses';
  purchaseEditIdV232.value=x?.id||'';
  purchaseNameV232.value=x?.name||'';purchaseFlightV232.value=x?.flight||'';
  purchaseTypeV232.value=x?.accessType||'Walk-in';purchaseReferenceV232.value=x?.reference||'';
  purchaseCurrencyV232.value=x?.currency||'IDR';purchaseAmountV232.value=x?.amount??'';
  purchaseStatusV232.value=x?.status||'Paid';purchaseRemarkV232.value=x?.remark||'';
  fillAirportSelects();
  const ap=document.getElementById('purchaseAirportV232');
  if(ap){ap.innerHTML=[...new Set((geVisibleLoungeRows()||[]).map(v=>v.airport))].sort().map(v=>`<option>${v}</option>`).join('');if(x?.airport)ap.value=x.airport}
  refreshPurchaseServicesV232();
  if(x?.serviceId)purchaseServiceV232.value=String(x.serviceId);
  purchaseModalV232.classList.add('show');
}
function closePurchaseModalV232(){purchaseModalV232?.classList.remove('show')}
function refreshPurchaseServicesV232(){
  const ap=document.getElementById('purchaseAirportV232')?.value||'';
  const sel=document.getElementById('purchaseServiceV232');if(!sel)return;
  const rows=(geVisibleLoungeRows()||[]).filter(x=>x.airport===ap && ['Lounge','Tenant'].includes(x.serviceType||x.serviceCategory||'Lounge'));
  sel.innerHTML=rows.map(x=>`<option value="${x.id}">${geEsc(x.name)} • ${geEsc(x.serviceType||x.serviceCategory||'Lounge')}</option>`).join('');
}
function savePurchaseV232(){
  if(!geCanManagePurchaseV232())return;
  const id=Number(purchaseEditIdV232.value||0),serviceId=Number(purchaseServiceV232.value||0);
  const service=(data.lounges||[]).find(x=>x.id===serviceId);
  const now=new Date();
  const obj={id:id||Date.now(),date:now.toISOString().slice(0,10),time:now.toTimeString().slice(0,5),
    name:purchaseNameV232.value.trim(),flight:purchaseFlightV232.value.trim().toUpperCase(),
    airport:purchaseAirportV232.value,serviceId,serviceName:service?.name||'-',
    accessType:purchaseTypeV232.value,reference:purchaseReferenceV232.value.trim(),
    currency:purchaseCurrencyV232.value.trim().toUpperCase(),amount:Number(purchaseAmountV232.value||0),
    status:purchaseStatusV232.value,remark:purchaseRemarkV232.value.trim()};
  if(!obj.name||!obj.airport||!serviceId)return geStorageNoticeV223('Data Belum Lengkap','Nama Penumpang, Airport, dan Lounge/Tenant wajib diisi.');
  data.loungePurchases=data.loungePurchases||[];
  if(id)Object.assign(data.loungePurchases.find(x=>x.id===id),obj);else data.loungePurchases.push(obj);
  save();closePurchaseModalV232();renderPurchaseV232();
}
function deletePurchaseV232(id){
  if(!geCanManagePurchaseV232()||!confirm('Hapus transaksi pembelian akses ini?'))return;
  data.loungePurchases=data.loungePurchases.filter(x=>x.id!==id);save();renderPurchaseV232();
}
function renderPurchaseV232(){
  const tbody=document.getElementById('purchaseRowsV232');if(!tbody)return;
  const rows=(data.loungePurchases||[]).filter(x=>{
    const s=geSession()||{};
    if(['Lounge Staff','Lounge Luar Biasa'].includes(s.role)&&typeof gxAirportAllowed==='function'&&!gxAirportAllowed(x.airport))return false;
    const q=(purchaseSearchV232?.value||'').toLowerCase(),a=purchaseAirportFilterV232?.value||'',st=purchaseStatusFilterV232?.value||'';
    return(!q||`${x.name} ${x.flight} ${x.reference}`.toLowerCase().includes(q))&&(!a||x.airport===a)&&(!st||x.status===st);
  });
  gePlanningPopulateSelect('purchaseAirportFilterV232',(data.loungePurchases||[]).map(x=>x.airport),'Semua Airport');
  tbody.innerHTML=rows.map((x,i)=>`<tr><td>${i+1}</td><td>${x.date}</td><td>${x.time}</td><td><b>${geEsc(x.name)}</b></td><td>${geEsc(x.flight||'-')}</td><td>${geEsc(x.airport)}</td><td>${geEsc(x.serviceName||'-')}</td><td>${geEsc(x.accessType)}</td><td>${geEsc(x.reference||'-')}</td><td>${geEsc(x.currency)} ${Number(x.amount||0).toLocaleString('id-ID')}</td><td>${geEsc(x.status)}</td><td class="visitor-actions"><button class="btn secondary compact-btn" onclick="openPurchaseModalV232(${x.id})">Update</button><button class="btn danger compact-btn" onclick="deletePurchaseV232(${x.id})">Hapus</button></td></tr>`).join('');
  const all=data.loungePurchases||[],set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  set('purchaseTotalV232',all.length);set('purchasePaidV232',all.filter(x=>x.status==='Paid').length);set('purchasePendingV232',all.filter(x=>x.status==='Pending').length);set('purchaseAirportCountV232',new Set(all.map(x=>x.airport)).size);
  gePlanningEmpty('purchaseEmptyV232',rows);if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}
window.addEventListener('DOMContentLoaded',()=>renderPurchaseV232());


/* ==============================================================
   V2.33 — Unified Navigation Controller / Netlify + Mobile Fix
   ============================================================== */
const GE_NAV_GROUPS_V233={
  service:{id:'serviceNav',key:'GE_SERVICE_COLLAPSED'},
  initiative:{id:'initiativeNav',key:'GE_INIT_COLLAPSED'},
  lounge:{id:'loungeNav',key:'GE_LOUNGE_COLLAPSED'},
  planning:{id:'planningNav',key:'GE_PLANNING_COLLAPSED'}
};

function geIsMobileV233(){
  return window.matchMedia('(max-width:760px)').matches;
}
function geSetNavCollapsedV233(group,collapsed,persist=true){
  const cfg=GE_NAV_GROUPS_V233[group],nav=cfg?document.getElementById(cfg.id):null;
  if(!nav)return;
  nav.classList.toggle('collapsed',!!collapsed);
  const toggle=nav.querySelector('[data-nav-toggle]');
  if(toggle)toggle.setAttribute('aria-expanded',collapsed?'false':'true');
  if(persist)try{geUiSet(cfg.key,collapsed?'true':'false')}catch(e){}
}
function geToggleNavGroupV233(group){
  const cfg=GE_NAV_GROUPS_V233[group],nav=cfg?document.getElementById(cfg.id):null;
  if(!nav)return;
  geSetNavCollapsedV233(group,!nav.classList.contains('collapsed'),true);
}
function geRestoreNavGroupsV233(){
  Object.entries(GE_NAV_GROUPS_V233).forEach(([group,cfg])=>{
    let collapsed=false;
    try{collapsed=geUiGet(cfg.key)==='true'}catch(e){}
    geSetNavCollapsedV233(group,collapsed,false);
  });
}
function geSetMobileDrawerV233(open){
  document.body.classList.toggle('mobile-nav-open-v233',!!open);
  const b=document.getElementById('mobileNavTriggerV233');
  if(b){
    b.setAttribute('aria-expanded',open?'true':'false');
    b.textContent=open?'×':'☰';
    b.setAttribute('aria-label',open?'Tutup menu utama':'Buka menu utama');
  }
}
toggleSidebar=function(){
  if(geIsMobileV233()){
    geSetMobileDrawerV233(!document.body.classList.contains('mobile-nav-open-v233'));
    return;
  }
  document.body.classList.toggle('side-hidden');
  try{geUiSet('GE_SIDE_HIDDEN',document.body.classList.contains('side-hidden')?'true':'false')}catch(e){}
};
toggleServices=function(){geToggleNavGroupV233('service');return false};
toggleInitiatives=function(){geToggleNavGroupV233('initiative');return false};
toggleLounge=function(){geToggleNavGroupV233('lounge');return false};
togglePlanning=function(){geToggleNavGroupV233('planning');return false};

function geInitNavigationV233(){
  geRestoreNavGroupsV233();

  /* Remove desktop collapsed sidebar state from affecting mobile drawer. */
  if(geIsMobileV233()){
    document.body.classList.remove('side-hidden');
    geSetMobileDrawerV233(false);
  }else{
    try{document.body.classList.toggle('side-hidden',geUiGet('GE_SIDE_HIDDEN')==='true')}catch(e){}
  }

  document.getElementById('mobileNavTriggerV233')?.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();toggleSidebar();
  });

  /* One event controller for all four submenu groups. */
  document.querySelector('.side')?.addEventListener('click',e=>{
    const toggle=e.target.closest('[data-nav-toggle]');
    if(toggle){
      e.preventDefault();
      e.stopPropagation();
      geToggleNavGroupV233(toggle.dataset.navToggle);
      return;
    }
    const link=e.target.closest('a[href]');
    if(link && geIsMobileV233())geSetMobileDrawerV233(false);
  });

  document.querySelector('.side')?.addEventListener('keydown',e=>{
    const toggle=e.target.closest('[data-nav-toggle]');
    if(toggle && (e.key==='Enter'||e.key===' ')){
      e.preventDefault();
      geToggleNavGroupV233(toggle.dataset.navToggle);
    }
  });

  /* Tap outside closes mobile drawer. */
  document.addEventListener('click',e=>{
    if(!geIsMobileV233()||!document.body.classList.contains('mobile-nav-open-v233'))return;
    if(e.target.closest('.side')||e.target.closest('#mobileNavTriggerV233'))return;
    geSetMobileDrawerV233(false);
  });

  window.addEventListener('resize',()=>{
    if(!geIsMobileV233())geSetMobileDrawerV233(false);
  });
}

/* RBAC map correction for latest pages */
const GE_APPLY_NAV_OLD_V233=gxApplyNavigationV220;
gxApplyNavigationV220=function(){
  GE_APPLY_NAV_OLD_V233();
  const pageMap={
    'lounge-purchase.html':'lounge-purchase',
    'branch-office-planning.html':'planning',
    'gaso-planning.html':'planning'
  };
  document.querySelectorAll('.side a[href]').forEach(a=>{
    const href=(a.getAttribute('href')||'').split('?')[0],tab=pageMap[href];
    if(tab && typeof gxHasTab==='function'){
      if(gxHasTab(tab) || (tab==='lounge-purchase' && (gxHasTab('lounge-access')||gxHasTab('lounge-visitor')))) geHardShow(a);
      else geHardHide(a);
    }
  });
  const lounge=document.getElementById('loungeNav');
  if(lounge){
    const any=['lounge-access','lounge-visitor','lounge-list','lounge-purchase'].some(t=>typeof gxHasTab==='function'&&gxHasTab(t))
      || (typeof gxHasTab==='function'&&(gxHasTab('lounge-access')||gxHasTab('lounge-visitor')));
    if(any)geHardShow(lounge);
  }
};

window.addEventListener('DOMContentLoaded',geInitNavigationV233);


/* ==============================================================
   V2.34 — Professional Delete Confirmation Modal
   ============================================================== */
let GE_DELETE_CONFIRM_RESOLVE_V234=null;

function geConfirmDeleteV234(options={}){
  const {
    title='Hapus Data?',
    item='Data ini',
    message='Data yang dihapus tidak dapat dikembalikan.',
    confirmLabel='Hapus',
    cancelLabel='Batal'
  }=options;

  return new Promise(resolve=>{
    let modal=document.getElementById('geDeleteConfirmModalV234');
    if(!modal){
      modal=document.createElement('div');
      modal.id='geDeleteConfirmModalV234';
      modal.className='modal-backdrop ge-delete-confirm-backdrop-v234';
      modal.innerHTML=`
        <div class="modal-card ge-delete-confirm-card-v234" role="dialog" aria-modal="true" aria-labelledby="geDeleteTitleV234">
          <button class="modal-x ge-delete-x-v234" type="button" aria-label="Tutup">×</button>
          <div class="ge-delete-icon-v234">!</div>
          <h2 id="geDeleteTitleV234"></h2>
          <p class="ge-delete-item-v234" id="geDeleteItemV234"></p>
          <p class="ge-delete-message-v234" id="geDeleteMessageV234"></p>
          <div class="ge-delete-actions-v234">
            <button class="btn secondary ge-delete-cancel-v234" type="button"></button>
            <button class="btn danger ge-delete-confirm-v234" type="button"></button>
          </div>
        </div>`;
      document.body.appendChild(modal);

      const finish=result=>{
        modal.classList.remove('show');
        document.body.classList.remove('ge-delete-modal-open-v234');
        const fn=GE_DELETE_CONFIRM_RESOLVE_V234;
        GE_DELETE_CONFIRM_RESOLVE_V234=null;
        if(fn)fn(result);
      };

      modal.querySelector('.ge-delete-cancel-v234').addEventListener('click',()=>finish(false));
      modal.querySelector('.ge-delete-x-v234').addEventListener('click',()=>finish(false));
      modal.querySelector('.ge-delete-confirm-v234').addEventListener('click',()=>finish(true));
      modal.addEventListener('click',e=>{if(e.target===modal)finish(false)});
      document.addEventListener('keydown',e=>{
        if(!modal.classList.contains('show'))return;
        if(e.key==='Escape')finish(false);
      });
    }

    if(GE_DELETE_CONFIRM_RESOLVE_V234){
      GE_DELETE_CONFIRM_RESOLVE_V234(false);
    }
    GE_DELETE_CONFIRM_RESOLVE_V234=resolve;

    modal.querySelector('#geDeleteTitleV234').textContent=title;
    modal.querySelector('#geDeleteItemV234').textContent=item;
    modal.querySelector('#geDeleteMessageV234').textContent=message;
    modal.querySelector('.ge-delete-confirm-v234').textContent=confirmLabel;
    modal.querySelector('.ge-delete-cancel-v234').textContent=cancelLabel;

    document.body.classList.add('ge-delete-modal-open-v234');
    modal.classList.add('show');
    setTimeout(()=>modal.querySelector('.ge-delete-cancel-v234')?.focus(),30);
  });
}


/* ---------- V2.34 final delete overrides ---------- */
deleteNews = async function(id){
  const x=(data.news||[]).find(v=>v.id===id);if(!x)return;
  if(!await geConfirmDeleteV234({title:'Hapus Headline?',item:x.title||'Headline',message:'Headline akan dihapus dari Berita & Informasi.'}))return;
  data.news=data.news.filter(v=>v.id!==id);save();renderNews();renderNewsAdmin();
};

deletePortalDocument = async function(id){
  const x=(data.documents||[]).find(v=>v.id===id);if(!x)return;
  if(!await geConfirmDeleteV234({title:'Hapus Dokumen?',item:x.title||x.fileName||'Dokumen',message:'Dokumen akan dihapus dari daftar portal.'}))return;
  data.documents=data.documents.filter(v=>v.id!==id);save();renderDocumentsAdmin();renderDocumentsHome();
};

deleteLounge = async function(id){
  const x=(data.lounges||[]).find(v=>v.id===id);if(!x)return;
  if(!await geConfirmDeleteV234({title:'Hapus Layanan Lounge/Tenant?',item:`${x.airport||''} — ${x.name||'Layanan'}`,message:'Data layanan, periode, harga, dan referensinya akan dihapus dari master.'}))return;
  data.lounges=data.lounges.filter(v=>v.id!==id);save();
  if(typeof renderLounges==='function')renderLounges();
  if(typeof refreshScanLoungeOptions==='function')refreshScanLoungeOptions();
  if(typeof renderLoungeProcurement==='function')renderLoungeProcurement();
};

deleteVisitor = async function(id){
  if(!(typeof geCanManageVisitors==='function'?geCanManageVisitors():geIsAdmin()))return;
  const x=(data.loungeVisitors||[]).find(v=>v.id===id);if(!x)return;
  if(!await geConfirmDeleteV234({
    title:'Hapus Lounge/Tenant Visitor?',
    item:`${x.name||'Penumpang'} • ${x.flight||'-'} • Sequence ${x.seq||'-'}`,
    message:'Record visitor akan dihapus dan tidak lagi dihitung pada summary, traffic, maupun estimasi.'
  }))return;
  data.loungeVisitors=data.loungeVisitors.filter(v=>v.id!==id);save();renderLoungeVisitors();initDashboard();
};

deleteUserAccount = async function(id){
  if(!geCanManageAccounts())return;
  const u=(data.users||[]).find(v=>v.id===id);if(!u)return;
  if(!await geConfirmDeleteV234({
    title:'Hapus Akun?',
    item:`${u.name||u.username} (${u.username})`,
    message:'Akun tidak akan dapat login lagi setelah dihapus.'
  }))return;
  data.users=data.users.filter(v=>v.id!==id);save();renderUserAccounts();
};

deletePersonnel = async function(id){
  if(!geCanManagePersonnel())return;
  const x=(data.personnel||[]).find(v=>v.id===id);if(!x)return;
  if(!await geConfirmDeleteV234({
    title:'Hapus Data Personil?',
    item:`${x.name||'Personil'} • ${x.airport||'HO'}`,
    message:'Data personil akan dihapus dari master Airport & Head Office.'
  }))return;
  data.personnel=data.personnel.filter(v=>v.id!==id);save();renderPersonnel();
};

deleteInbox = async function(id){
  const x=(data.inbox||[]).find(v=>v.id===id);if(!x)return;
  if(!await geConfirmDeleteV234({title:'Hapus Pesan?',item:x.subject||x.name||'Pesan Masuk',message:'Pesan akan dihapus dari Admin / Pengelola.'}))return;
  data.inbox=data.inbox.filter(v=>String(v.id)!==String(id));save();renderAdminInbox();
};

deleteArticle = async function(id){
  if(!geIsAdmin())return;const x=(data.articles||[]).find(v=>v.id===id);if(!x)return;
  if(!await geConfirmDeleteV234({title:'Hapus Artikel?',item:x.title||'Artikel',message:'Artikel yang sudah dipublikasikan akan dihapus.'}))return;
  data.articles=data.articles.filter(v=>v.id!==id);save();renderArticles();
};

deleteAnnouncement = async function(id){
  if(!geIsAdmin())return;const x=(data.announcements||[]).find(v=>v.id===id);if(!x)return;
  if(!await geConfirmDeleteV234({title:'Hapus Pengumuman?',item:x.title||'Pengumuman',message:'Pengumuman akan dihapus dari Berita & Informasi.'}))return;
  data.announcements=data.announcements.filter(v=>v.id!==id);save();renderAnnouncements();
};

deleteFaq = async function(id){
  if(!geIsAdmin())return;const x=(data.faqs||[]).find(v=>v.id===id);if(!x)return;
  if(!await geConfirmDeleteV234({title:'Hapus FAQ?',item:x.question||'FAQ',message:'Pertanyaan dan jawaban akan dihapus.'}))return;
  data.faqs=data.faqs.filter(v=>v.id!==id);save();renderFaqs();
};

deletePlanningRecordV222 = async function(type,id){
  if(!gePlanningCanManage())return;
  const cfg=GE_PLANNING_RECORD_V222[type];if(!cfg)return;
  const x=(data[cfg.collection]||[]).find(v=>v.id===id);if(!x)return;
  if(!await geConfirmDeleteV234({title:'Hapus Planning Record?',item:x.title||x.name||x.location||x.airport||'Planning Record',message:'Record planning akan dihapus dari master terkait.'}))return;
  data[cfg.collection]=data[cfg.collection].filter(v=>v.id!==id);save();
  if(type==='space')renderBOSpaces();
  if(type==='system')renderAirportSystems();
};

window.deleteInitiativeV224 = async function(id){
  if(!geInitiativeAdminV224())return false;
  const key=String(id??'');
  const d=window.GEStore?.get?.()||data;
  d.initiatives=Array.isArray(d.initiatives)?d.initiatives:[];
  const x=d.initiatives.find(v=>String(v.id)===key);
  if(!x)return false;
  if(!await geConfirmDeleteV234({title:'Hapus Inisiatif?',item:x.name||'Inisiatif',message:'Timeline, milestone, dan referensi dokumen yang terkait dengan inisiatif ini akan ikut terhapus dari master inisiatif.'}))return false;
  try{
    d.initiatives=d.initiatives.filter(v=>String(v.id)!==key);
    window.GEStore.save(d);
    await window.GEStore.flush();
    window.renderInitiatives?.();
    geStorageNoticeV223('Inisiatif Dihapus',`${x.name||'Inisiatif'} berhasil dihapus.`,'success');
    return true;
  }catch(error){
    console.error('[Initiative delete]',error);
    geStorageNoticeV223('Penghapusan Gagal',error?.message||'Inisiatif belum terhapus. Silakan coba lagi.','error');
    return false;
  }
};

deleteInitiativeDocumentV227 = async function(id,kind,index){
  if(!geInitiativeAdminV224())return;
  const x=(data.initiatives||[]).find(v=>v.id===id);if(!x)return;
  geInitDocsV227(x);const arr=kind==='trigger'?x.triggerDocuments:x.supportingDocuments,d=arr[index];if(!d)return;
  if(!await geConfirmDeleteV234({title:'Hapus Dokumen Inisiatif?',item:`${d.type||'Dokumen'}${d.referenceNo?' • '+d.referenceNo:''}`,message:'Dokumen akan dilepas dari Initiative Dossier.'}))return;
  arr.splice(index,1);save();openInitiativeTimelineV224(id);
};

deleteInitiativeStepV224 = async function(id,index){
  if(!geInitiativeAdminV224())return;
  const x=(data.initiatives||[]).find(v=>v.id===id),step=x?.workflow?.[index];if(!x||!step)return;
  if(!await geConfirmDeleteV234({title:'Hapus Tahapan?',item:step.title||'Milestone',message:'Tahapan akan dihapus dari Timeline & Alur Pekerjaan.'}))return;
  x.workflow.splice(index,1);save();openInitiativeTimelineV224(id);
};

geDeleteConfirmV231 = async function(label){
  return await geConfirmDeleteV234({title:'Hapus Data?',item:label||'Data',message:'Data yang dihapus tidak dapat dikembalikan.'});
};

/* Functions that formerly called synchronous geDeleteConfirmV231 are explicitly overridden. */
deleteAirportV231 = async function(id){
  if(!geAdminV231())return;const x=(data.airports||[]).find(a=>a.id===id);if(!x)return;
  if(!await geConfirmDeleteV234({title:'Hapus Database Airport?',item:`${x.code} — ${x.city}`,message:'Airport akan dihapus dari master dan tidak lagi menjadi referensi utama portal.'}))return;
  data.airports=data.airports.filter(a=>a.id!==id);data.airports.forEach((a,i)=>a.no=i+1);save();renderAirports();renderAirportMapMarkers();
};
deleteStationMaterialV231 = async function(id){
  if(!geAdminV231())return;const x=(data.stationMaterials||[]).find(v=>v.id===id);if(!x)return;
  if(!await geConfirmDeleteV234({title:'Hapus Station Material?',item:`${x.code||''} — ${x.product||'Material'}`,message:'Data barang cetak kestasiunan akan dihapus dari master.'}))return;
  data.stationMaterials=data.stationMaterials.filter(v=>v.id!==id);save();renderStationMaterials();
};
deleteAirportSystemV231 = async function(id){
  if(!geAdminV231())return;const x=(data.airportSystems||[]).find(v=>v.id===id);if(!x)return;
  if(!await geConfirmDeleteV234({title:'Hapus Airport System?',item:`${x.airport||''} • ${x.provider||'System'}`,message:'Record CUTE/CUPPS/Airport System akan dihapus dari master.'}))return;
  data.airportSystems=data.airportSystems.filter(v=>v.id!==id);save();renderAirportSystems();
};
deleteGasoV231 = async function(type,id){
  if(!geAdminV231())return;const coll=GE_GASO_COLLECTION_V231[type],x=(data[coll]||[]).find(v=>v.id===id);if(!x)return;
  if(!await geConfirmDeleteV234({title:'Hapus Data GASO?',item:`${x.code||'GASO'} — ${x.officeName||x.service||x.item||'Record'}`,message:'Record akan dihapus dari master GASO terkait.'}))return;
  data[coll]=data[coll].filter(v=>v.id!==id);save();renderGasoAllV231();
};

deletePurchaseV232 = async function(id){
  if(!geCanManagePurchaseV232())return;const x=(data.loungePurchases||[]).find(v=>v.id===id);if(!x)return;
  if(!await geConfirmDeleteV234({title:'Hapus Pembelian Akses?',item:`${x.name||'Penumpang'} • ${x.flight||'-'} • ${x.reference||x.accessType||'-'}`,message:'Transaksi akses Lounge/Tenant akan dihapus dari daftar.'}))return;
  data.loungePurchases=data.loungePurchases.filter(v=>v.id!==id);save();renderPurchaseV232();
};


/* ==============================================================
   V2.35 — Deployment/Cache Integrity Guard for Netlify
   ============================================================== */
(function geDeploymentIntegrityV235(){
  const VERSION='2.51.2';
  const KEY='GE_UI_DEPLOY_VERSION';
  try{
    const previous=geUiGet(KEY);
    if(previous!==VERSION){
      [
        'GE_SERVICE_COLLAPSED',
        'GE_INIT_COLLAPSED',
        'GE_LOUNGE_COLLAPSED',
        'GE_PLANNING_COLLAPSED',
        'GE_SIDE_HIDDEN'
      ].forEach(k=>geUiRemove(k));
      geUiSet(KEY,VERSION);
    }
  }catch(e){}
})();

/* Visible build marker for troubleshooting, stored on DOM only. */
window.addEventListener('DOMContentLoaded',()=>{
  document.documentElement.dataset.geBuild='2.51.2';
});


/* ==============================================================
   V2.36 — FINAL LOUNGE/TENANT MODULE
   ============================================================== */
const GE_LOUNGE_FINAL_CATEGORIES_V236=['Business Class','Platinum','Elite Plus','Gold Privilege','Elite','GPS','Kerjasama MPA','EMD'];
const GE_LOUNGE_REF_REQUIRED_V236=new Set(['Platinum','Elite Plus','Gold Privilege','Elite','GPS','Kerjasama MPA','EMD']);
let GE_ZXING_CONTROLS_V236=null;

function geNormalizeSeatV236(v){
  const s=String(v||'').trim().toUpperCase(),m=s.match(/^0*(\d{1,3})([A-Z])$/);
  return m?`${Number(m[1])}${m[2]}`:s;
}
function gePassengerDisplayNameV236(lastName,firstName,fallback=''){
  if(firstName||lastName)return [firstName,lastName].filter(Boolean).join(' ').trim();
  return String(fallback||'').replace('/',' ').trim();
}
function geEligibilityFromCabinMemberV236(cabin,member){
  const c=String(cabin||'').toUpperCase(),m=String(member||'').trim();
  if(c==='C')return'Y';
  if(c==='Y'&&['Platinum','Elite Plus'].includes(m))return'Y';
  if(c==='Y')return'N';
  return'?';
}

parseBoardingScan=function(raw){
  const original=String(raw||'').trim();
  if(original.length<5)return null;

  if(original.startsWith('{')){
    try{
      const j=JSON.parse(original),route=String(j.route||'').toUpperCase(),rm=route.match(/([A-Z]{3})\D*([A-Z]{3})/);
      const name=String(j.name||j.passenger||'').trim(),slash=name.includes('/')?name.split('/'):[];
      const lastName=String(j.lastName||slash[0]||'').trim().toUpperCase(),firstName=String(j.firstName||slash[1]||'').trim().toUpperCase();
      const cabin=String(j.cabin||j.class||'').toUpperCase().slice(0,1),member=String(j.member||'').trim();
      const calc=geEligibilityFromCabinMemberV236(cabin,member),flag=String(j.eligibility||j.eligible||calc).toUpperCase().slice(0,1);
      const origin=String(j.from||j.origin||rm?.[1]||'').toUpperCase(),destination=String(j.to||j.destination||rm?.[2]||'').toUpperCase();
      return{raw:original,source:'qr',lastName,firstName,name:gePassengerDisplayNameV236(lastName,firstName,name),origin,destination,
        route:origin&&destination?`${origin}-${destination}`:'',flight:normalizeFlight(j.flight||j.flightNumber||''),cabin,
        seat:geNormalizeSeatV236(j.seat||''),seq:normalizeSeq(j.sequence||j.seq||''),ticket:String(j.ticket||j.ticketNumber||'').replace(/\D/g,''),
        member,indicator:['Y','N'].includes(flag)?flag:'?'};
    }catch(e){}
  }

  const up=original.toUpperCase().replace(/\s+/g,' ').trim();
  const indicator=/\s([YN])$/.exec(up)?.[1]||(/[YN]$/.test(up)?up.slice(-1):'?');
  let lastName='',firstName='',origin='',destination='',carrier='GA',flight='',cabin='',seat='',seq='',ticket='';

  const core=up.match(/^M\d([A-Z0-9]+)\/([A-Z0-9]+)\s+[A-Z0-9]{5,8}\s+([A-Z]{3})([A-Z]{3})([A-Z]{2})\s*0*(\d{1,4})\s+\d{3}([A-Z])(\d{3}[A-Z])(\d{4})/);
  if(core){
    lastName=core[1];firstName=core[2];origin=core[3];destination=core[4];carrier=core[5];
    flight=carrier+String(Number(core[6]||0));cabin=core[7];seat=geNormalizeSeatV236(core[8]);seq=normalizeSeq(String(Number(core[9]||0)));
  }else{
    const nm=up.match(/^M\d([A-Z0-9]+)\/([A-Z0-9]+)/);if(nm){lastName=nm[1];firstName=nm[2]}
    const rm=up.match(/\b([A-Z]{3})([A-Z]{3})(GA)\s*0*(\d{1,4})\b/);if(rm){origin=rm[1];destination=rm[2];carrier=rm[3];flight=carrier+String(Number(rm[4]||0))}
    const cm=up.match(/\s([CY])(\d{3}[A-Z])(\d{4})\s/);if(cm){cabin=cm[1];seat=geNormalizeSeatV236(cm[2]);seq=normalizeSeq(String(Number(cm[3]||0)))}
  }
  const tm=up.match(/(?:2A)?(126\d{11})/);if(tm)ticket=tm[1];

  return{raw:original,source:'scan',lastName,firstName,name:gePassengerDisplayNameV236(lastName,firstName,lastName||firstName?'':'Passenger'),
    origin,destination,route:origin&&destination?`${origin}-${destination}`:'',flight:flight||'-',cabin,seat,seq,ticket,member:'',
    indicator:['Y','N'].includes(indicator)?indicator:'?'};
};

function geFindFlightReferenceV236(parsed){
  const today=new Date().toISOString().slice(0,10);
  return (data.flightSchedule||[]).find(f=>normalizeFlight(f.flight)===normalizeFlight(parsed.flight)&&
    (!parsed.origin||f.from===parsed.origin)&&(!parsed.destination||f.to===parsed.destination)&&(!f.date||f.date===today))||null;
}
function geParsedPassengerGridV236(parsed){
  const ref=geFindFlightReferenceV236(parsed);
  return `<div class="lounge-parser-grid-v236">
    <div><span>Nama Penumpang</span><b>${geEsc(parsed.name||'-')}</b><small>${parsed.lastName&&parsed.firstName?`${geEsc(parsed.lastName)} / ${geEsc(parsed.firstName)}`:''}</small></div>
    <div><span>Rute</span><b>${geEsc(parsed.route||'-')}</b></div>
    <div><span>Flight Number</span><b>${geEsc(parsed.flight||'-')}</b></div>
    <div><span>Cabin / Seat</span><b>${geEsc(parsed.cabin||'-')} / ${geEsc(parsed.seat||'-')}</b></div>
    <div><span>Sequence Check-in</span><b>${geEsc(parsed.seq||'-')}</b></div>
    <div><span>Ticket Number</span><b>${geEsc(parsed.ticket||'-')}</b></div>
    <div><span>Eligibility</span><b>${geEsc(parsed.indicator||'?')}</b></div>
    <div><span>Flight Reference</span><b>${ref?`${geEsc(ref.status)} • ETD ${geEsc(ref.etd||ref.std||'-')}`:'Belum ada referensi'}</b></div>
  </div>`;
}
showPassengerPreview=function(parsed,status){
  const panel=document.getElementById('eligibilityPanel');if(!panel)return;
  const cls=status==='Y'?'eligible':status==='N'?'not-eligible':'warning-scan';
  panel.innerHTML=`<div class="lounge-preview-shell-v236 ${cls}">
    <div class="lounge-preview-status-v236"><span>${status==='Y'?'✓':status==='N'?'×':'!'}</span><div><small>ELIGIBILITY RESULT</small><h2>${status==='Y'?'Eligible Lounge/Tenant':status==='N'?'Tidak Eligible Lounge':'Perlu Verifikasi'}</h2></div></div>
    ${geParsedPassengerGridV236(parsed||{})}${status==='?'?'<div class="duplicate-warning">Indicator eligibility Y/N belum ditemukan. Scan ulang atau gunakan Input Manual.</div>':''}
  </div>`;
};
verifyBoardingPass=function(){
  const parsed=parseBoardingScan(document.getElementById('boardingScan')?.value||'');
  if(!parsed){showPassengerPreview({},'?');return geStorageNoticeV223('Boarding Pass Tidak Terbaca','Scan ulang atau gunakan Input Manual.')}
  showPassengerPreview(parsed,parsed.indicator);
  if(parsed.indicator==='?')return geStorageNoticeV223('Eligibility Tidak Ditemukan','Indicator Y/N tidak ditemukan pada data boarding pass.');
  if(parsed.indicator==='N'){
    eligibilityModalBody.innerHTML=`<div class="lounge-denied-v236"><div class="status-icon">×</div><h2>Tidak Eligible Lounge</h2>${geParsedPassengerGridV236(parsed)}
    <p>Akses Lounge/Tenant tidak dapat diberikan berdasarkan indicator eligibility.</p><div class="modal-actions"><button class="btn secondary" onclick="closeEligibilityModal();boardingScan.focus()">Scan Ulang</button><button class="btn" onclick="closeEligibilityModal()">Tutup</button></div></div>`;
    eligibilityModal.classList.add('show');return;
  }
  prepareEligibleConfirmation(parsed);
};
verifyManualPassenger=function(){
  const parsed={name:(manualName?.value||'').trim().toUpperCase(),origin:(manualFrom?.value||'').trim().toUpperCase(),destination:(manualTo?.value||'').trim().toUpperCase(),
    flight:normalizeFlight(manualFlight?.value||''),cabin:manualCabin?.value||'',seat:geNormalizeSeatV236(manualSeat?.value||''),seq:normalizeSeq(manualSeq?.value||''),
    ticket:(manualTicket?.value||'').replace(/\D/g,''),member:manualMember?.value||'',raw:'MANUAL',source:'manual'};
  parsed.route=parsed.origin&&parsed.destination?`${parsed.origin}-${parsed.destination}`:'';parsed.indicator=geEligibilityFromCabinMemberV236(parsed.cabin,parsed.member);
  if(!parsed.name||!parsed.flight||!parsed.seq||!parsed.cabin)return geStorageNoticeV223('Data Manual Belum Lengkap','Nama, Flight Number, Cabin, dan Sequence wajib diisi.');
  showPassengerPreview(parsed,parsed.indicator);
  if(parsed.indicator!=='Y'){eligibilityModalBody.innerHTML=`<div class="lounge-denied-v236"><div class="status-icon">×</div><h2>Tidak Eligible Lounge</h2>${geParsedPassengerGridV236(parsed)}<p>Eligibility dihitung otomatis dari Cabin dan Member.</p><div class="modal-actions"><button class="btn" onclick="closeEligibilityModal()">Tutup</button></div></div>`;eligibilityModal.classList.add('show');return}
  prepareEligibleConfirmation(parsed);
};
function geCategoryReferenceLabelV236(category){if(category==='Kerjasama MPA')return'Nama Maskapai / Mitra';if(category==='EMD')return'Nomor EMD';return'Nomor Member'}
prepareEligibleConfirmation=function(parsed){
  window._eligibleScan=parsed;const duplicate=isDuplicateVisitor(parsed);
  if(duplicate){
    eligibilityModalBody.innerHTML=`<div class="lounge-denied-v236 duplicate-v236"><div class="status-icon">!</div><h2>Duplicate Visitor</h2>${geParsedPassengerGridV236(parsed)}
    <p>Kombinasi Nama Penumpang + Flight Number + Sequence Check-in sudah pernah direkam.</p><div class="modal-actions"><button class="btn" onclick="closeEligibilityModal()">Tutup</button></div></div>`;
  }else{
    const initial=parsed.cabin==='C'?'Business Class':(['Platinum','Elite Plus'].includes(parsed.member)?parsed.member:'Business Class');
    eligibilityModalBody.innerHTML=`<div class="lounge-eligible-v236"><div class="lounge-modal-success-v236">✓</div><h2>Eligible Lounge/Tenant</h2><p>Konfirmasi kategori penumpang sebelum visitor direkam.</p>
    ${geParsedPassengerGridV236(parsed)}<div class="lounge-category-box-v236"><label>Kategori Penumpang<select id="eligibleCategoryV236" onchange="geEligibilityCategoryChangedV236()">${GE_LOUNGE_FINAL_CATEGORIES_V236.map(x=>`<option ${x===initial?'selected':''}>${x}</option>`).join('')}</select></label>
    <label id="eligibleReferenceWrapV236" style="display:none"><span id="eligibleReferenceLabelV236">Nomor Member</span><input id="eligibleReferenceV236"></label></div>
    <div class="modal-actions"><button class="btn lounge-primary-v236" onclick="recordEligibleVisitorV236()">Konfirmasi & Rekam Visitor</button><button class="btn secondary" onclick="closeEligibilityModal()">Batal</button></div></div>`;
    setTimeout(geEligibilityCategoryChangedV236,0);
  }
  eligibilityModal.classList.add('show');
};
function geEligibilityCategoryChangedV236(){
  const c=eligibleCategoryV236?.value||'',req=GE_LOUNGE_REF_REQUIRED_V236.has(c);eligibleReferenceWrapV236.style.display=req?'block':'none';
  if(req)eligibleReferenceLabelV236.textContent=geCategoryReferenceLabelV236(c);
}
function recordEligibleVisitorV236(){
  const p=window._eligibleScan;if(!p)return;
  if(isDuplicateVisitor(p))return geStorageNoticeV223('Duplicate Visitor','Data Nama Penumpang + Flight Number + Sequence sudah ada.');
  const category=eligibleCategoryV236?.value||'',ref=(eligibleReferenceV236?.value||'').trim();
  if(GE_LOUNGE_REF_REQUIRED_V236.has(category)&&!ref)return geStorageNoticeV223('Referensi Wajib Diisi',`${geCategoryReferenceLabelV236(category)} wajib diisi untuk ${category}.`);
  const now=new Date(),airport=scanAirport?.value||'',loungeId=Number(scanLounge?.value||0),lounge=(data.lounges||[]).find(x=>x.id===loungeId);
  const record={id:Date.now(),date:now.toISOString().slice(0,10),time:now.toTimeString().slice(0,5),name:p.name||'Passenger',
    lastName:p.lastName||'',firstName:p.firstName||'',origin:p.origin||'',destination:p.destination||'',route:p.route||'',flight:p.flight||'-',
    cabin:p.cabin||'',seat:p.seat||'',seq:normalizeSeq(p.seq||''),ticket:p.ticket||'',eligibility:'Y',airport,loungeId,loungeName:lounge?.name||'',
    category,eligibilityReference:ref,raw:p.raw||'',source:p.source||'scan'};
  data.loungeVisitors=data.loungeVisitors||[];data.loungeVisitors.push(record);save();closeEligibilityModal();resetLoungeAccess();initDashboard();renderLoungeVisitors();
  geStorageNoticeV223('Visitor Berhasil Direkam',`${record.name} • ${record.flight} • Sequence ${record.seq} berhasil direkam sebagai ${category}.`,'success');
}
recordEligibleVisitor=recordEligibleVisitorV236;
resetLoungeAccess=function(){
  if(boardingScan){boardingScan.value='';setTimeout(()=>boardingScan.focus(),50)}
  ['manualName','manualFlight','manualFrom','manualTo','manualSeat','manualSeq','manualTicket'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});
  ['manualCabin','manualMember'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});
  manualEntry?.classList.remove('show');if(eligibilityPanel)eligibilityPanel.innerHTML='<div class="eligibility-idle lounge-idle-v236"><div class="lounge-idle-icon-v236">⌁</div><b>Menunggu Boarding Pass</b><span>Data hasil parsing dan status eligibility akan tampil di sini.</span></div>';window._eligibleScan=null;
};

startCameraScanner=async function(){
  const panel=document.getElementById('cameraPanel'),video=document.getElementById('cameraVideo'),status=document.getElementById('cameraStatus');
  if(!navigator.mediaDevices?.getUserMedia)return geStorageNoticeV223('Kamera Tidak Didukung','Browser/perangkat ini tidak mendukung akses kamera.');
  panel?.classList.add('show');stopCameraScanner();
  try{
    if(window.ZXingBrowser?.BrowserMultiFormatReader){
      const reader=new ZXingBrowser.BrowserMultiFormatReader();
      GE_ZXING_CONTROLS_V236=await reader.decodeFromVideoDevice(undefined,video,(result,error,controls)=>{
        if(result){
          const raw=result.getText?.()||String(result.text||result||'');
          if(raw){boardingScan.value=raw;status.textContent='Kode terdeteksi. Memproses boarding pass...';controls?.stop?.();GE_ZXING_CONTROLS_V236=null;verifyBoardingPass()}
        }
      });
      status.textContent='Kamera aktif. Arahkan PDF417 / QR / barcode boarding pass ke area pemindaian.';return;
    }
    loungeCameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});video.srcObject=loungeCameraStream;await video.play();
    if(!('BarcodeDetector'in window)){status.textContent='Decoder kamera tidak tersedia. Gunakan scanner eksternal atau Input Manual.';return}
    const formats=await BarcodeDetector.getSupportedFormats(),preferred=['pdf417','qr_code','aztec','data_matrix','code_128','ean_13','ean_8'];
    const use=preferred.filter(x=>formats.includes(x)),detector=new BarcodeDetector({formats:use.length?use:formats});status.textContent='Kamera aktif. Arahkan kode boarding pass ke area pemindaian.';
    const loop=async()=>{if(!loungeCameraStream)return;try{const codes=await detector.detect(video);if(codes?.length&&codes[0].rawValue){boardingScan.value=codes[0].rawValue;stopCameraScanner();verifyBoardingPass();return}}catch(e){}loungeCameraLoop=requestAnimationFrame(loop)};
    loungeCameraLoop=requestAnimationFrame(loop);
  }catch(e){status.textContent='Kamera tidak dapat diakses: '+e.message;geStorageNoticeV223('Akses Kamera Gagal','Pastikan izin kamera diberikan dan halaman dibuka melalui HTTPS.')}
};
stopCameraScanner=function(){
  try{GE_ZXING_CONTROLS_V236?.stop?.()}catch(e){}GE_ZXING_CONTROLS_V236=null;
  if(loungeCameraLoop)cancelAnimationFrame(loungeCameraLoop);loungeCameraLoop=null;
  if(loungeCameraStream){loungeCameraStream.getTracks().forEach(t=>t.stop());loungeCameraStream=null}
  const video=document.getElementById('cameraVideo');if(video)video.srcObject=null;
};
window.addEventListener('DOMContentLoaded',()=>{
  const e=document.getElementById('boardingScan');if(e&&!e.dataset.finalScannerV236){e.dataset.finalScannerV236='1';e.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&!ev.shiftKey&&e.value.trim().length>8){ev.preventDefault();verifyBoardingPass()}})}
});

renderLoungeVisitors=function(){
  const rows=loungeVisitorFiltered().map(geResolveVisitorLounge),t=document.getElementById('loungeVisitorRows');if(!t)return;
  const admin=typeof geCanManageVisitors==='function'?geCanManageVisitors():geIsAdmin();
  t.innerHTML=rows.map((x,i)=>`<tr><td>${i+1}</td><td>${x.date||'-'}</td><td>${x.time||'-'}</td><td><b>${geEsc(x.name||'-')}</b></td>
    <td>${geEsc(x.route||((x.origin&&x.destination)?x.origin+'-'+x.destination:'-'))}</td><td>${geEsc(x.flight||'-')}</td>
    <td>${geEsc(x.cabin||'-')} / ${geEsc(x.seat||'-')}</td><td>${geEsc(x.seq||'-')}</td><td>${geEsc(x.airport||'-')}</td><td>${geEsc(x.loungeName||'-')}</td>
    <td>${geEsc(x.category||'-')}</td><td>${geEsc(x.eligibilityReference||'-')}</td><td class="price-cell">${x.priceDisplay||((x.currency&&x.pricePerPax)?`${x.currency} ${Number(x.pricePerPax).toLocaleString('id-ID')}`:'Belum diisi')}</td>
    ${admin?`<td class="visitor-actions"><button class="btn secondary compact-btn" onclick="openVisitorEdit(${x.id})">Update</button><button class="btn danger compact-btn" onclick="deleteVisitor(${x.id})">Hapus</button></td>`:''}</tr>`).join('');
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};set('visitorCount',rows.length);set('visitorBusiness',rows.filter(x=>x.category==='Business Class').length);set('visitorTier',rows.filter(x=>x.category!=='Business Class').length);set('visitorFilteredTotal',rows.length);
  if(typeof renderVisitorCostSummary==='function')renderVisitorCostSummary(rows);if(typeof renderVisitorTrafficV232==='function')renderVisitorTrafficV232();if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
};

/* Flight schedule */
function geCanManageFlightsV236(){return ['Super Admin','Admin','Branch Office'].includes((geSession()||{}).role)}
function geFlightVisibleV236(x){
  const s=geSession()||{};if(['Super Admin','Admin'].includes(s.role)||s.scopeType==='ALL')return true;
  if(['Branch Office','Lounge Staff','Lounge Luar Biasa'].includes(s.role))return typeof gxAirportAllowed==='function'?(gxAirportAllowed(x.from)||gxAirportAllowed(x.to)):true;
  return true;
}
function geFlightActionsVisibilityV236(){const box=document.getElementById('flightManageActionsV236');if(box)box.style.display=geCanManageFlightsV236()?'flex':'none'}
function openFlightModalV236(id=null){
  if(!geCanManageFlightsV236())return;const x=id?(data.flightSchedule||[]).find(v=>v.id===id):null;
  flightModalTitleV236.textContent=x?'Update Penerbangan':'Tambah Penerbangan';flightEditIdV236.value=x?.id||'';flightNoV236.value=x?.flight||'';flightDateV236.value=x?.date||'';flightFromV236.value=x?.from||'';flightToV236.value=x?.to||'';flightStdV236.value=x?.std||'';flightEtdV236.value=x?.etd||'';flightCapacityV236.value=x?.capacity??'';flightStatusV236.value=x?.status||'Scheduled';flightModalV236.classList.add('show');
}
function closeFlightModalV236(){flightModalV236?.classList.remove('show')}
function saveFlightV236(){
  if(!geCanManageFlightsV236())return;const id=Number(flightEditIdV236.value||0),obj={id:id||Date.now(),flight:normalizeFlight(flightNoV236.value),date:flightDateV236.value,from:flightFromV236.value.trim().toUpperCase(),to:flightToV236.value.trim().toUpperCase(),std:flightStdV236.value,etd:flightEtdV236.value,capacity:Number(flightCapacityV236.value||0),status:flightStatusV236.value};
  if(!obj.flight||!obj.from||!obj.to||!obj.date)return geStorageNoticeV223('Data Penerbangan Belum Lengkap','Flight, From, To, dan Tanggal wajib diisi.');
  data.flightSchedule=data.flightSchedule||[];if(id)Object.assign(data.flightSchedule.find(x=>x.id===id),obj);else data.flightSchedule.push(obj);save();closeFlightModalV236();renderFlightsV236();
}
async function deleteFlightV236(id){
  if(!geCanManageFlightsV236())return;const x=(data.flightSchedule||[]).find(v=>v.id===id);if(!x)return;
  if(typeof geConfirmDeleteV234==='function'&&!await geConfirmDeleteV234({title:'Hapus Penerbangan?',item:`${x.flight} • ${x.from}-${x.to} • ${x.date}`,message:'Penerbangan akan dihapus dari referensi Lounge/Tenant Access.'}))return;
  data.flightSchedule=data.flightSchedule.filter(v=>v.id!==id);save();renderFlightsV236();
}
function renderFlightsV236(){
  const tbody=document.getElementById('flightRowsV236');if(!tbody)return;const all=(data.flightSchedule||[]).filter(geFlightVisibleV236),q=(flightSearchV236?.value||'').toLowerCase(),a=flightAirportV236?.value||'',s=flightStatusFilterV236?.value||'',d=flightDateFilterV236?.value||'';
  const rows=all.filter(x=>(!q||`${x.flight} ${x.from}-${x.to}`.toLowerCase().includes(q))&&(!a||(x.from===a||x.to===a))&&(!s||x.status===s)&&(!d||x.date===d));
  gePlanningPopulateSelect('flightAirportV236',[...all.map(x=>x.from),...all.map(x=>x.to)],'Semua Airport');gePlanningPopulateSelect('flightStatusFilterV236',all.map(x=>x.status),'Semua Status');
  tbody.innerHTML=rows.map((x,i)=>`<tr><td>${i+1}</td><td><b>${geEsc(x.flight)}</b></td><td>${geEsc(x.from)}-${geEsc(x.to)}</td><td>${x.date}</td><td>${x.std||'-'}</td><td>${x.etd||'-'}</td><td>${Number(x.capacity||0).toLocaleString('id-ID')}</td><td><span class="flight-status-v236 ${String(x.status||'').toLowerCase().replace(/\s+/g,'-')}">${geEsc(x.status||'-')}</span></td><td>${geCanManageFlightsV236()?`<div class="visitor-actions"><button class="btn secondary compact-btn" onclick="openFlightModalV236(${x.id})">Update</button><button class="btn danger compact-btn" onclick="deleteFlightV236(${x.id})">Hapus</button></div>`:'-'}</td></tr>`).join('');gePlanningEmpty('flightEmptyV236',rows);if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
}
let GE_FLIGHT_BULK_ROWS_V236=[];
function openFlightBulkV236(){if(!geCanManageFlightsV236())return;GE_FLIGHT_BULK_ROWS_V236=[];flightBulkFileV236.value='';flightBulkPreviewV236.innerHTML='Belum ada file dipilih.';flightBulkConfirmV236.disabled=true;flightBulkModalV236.classList.add('show')}
function closeFlightBulkV236(){flightBulkModalV236?.classList.remove('show')}
async function previewFlightBulkV236(file){
  if(!file)return;try{const raw=await geReadTabularFileV223(file),rows=geRowsToObjectsV223(raw,{flight:['flight'],from:['from'],to:['to'],date:['tanggal','date'],std:['std'],etd:['etd'],capacity:['capacity'],status:['status']});GE_FLIGHT_BULK_ROWS_V236=rows;flightBulkPreviewV236.innerHTML=`<div class="bulk-import-summary"><b>${rows.length}</b><span>baris data terbaca</span></div>`;flightBulkConfirmV236.disabled=!rows.length}catch(e){flightBulkPreviewV236.innerHTML=`<div class="bulk-import-error">${geEsc(e.message||String(e))}</div>`}
}
function confirmFlightBulkV236(){
  if(!geCanManageFlightsV236())return;let added=0,skipped=0;data.flightSchedule=data.flightSchedule||[];
  GE_FLIGHT_BULK_ROWS_V236.forEach(r=>{const flight=normalizeFlight(r.flight),from=String(r.from||'').trim().toUpperCase(),to=String(r.to||'').trim().toUpperCase(),date=geNormalizeDateUploadV223(r.date);if(!flight||!from||!to||!date){skipped++;return}data.flightSchedule.push({id:Date.now()+added,flight,from,to,date,std:String(r.std||'').slice(0,5),etd:String(r.etd||'').slice(0,5),capacity:Number(r.capacity||0),status:String(r.status||'Scheduled').trim()});added++});
  save();closeFlightBulkV236();renderFlightsV236();geStorageNoticeV223('Import Selesai',`${added} penerbangan ditambahkan • ${skipped} dilewati.`,'success');
}
window.addEventListener('DOMContentLoaded',()=>{geFlightActionsVisibilityV236();renderFlightsV236()});

if(!GE_TAB_OPTIONS.some(x=>x[0]==='lounge-flights'))GE_TAB_OPTIONS.splice(7,0,['lounge-flights','Daftar Penerbangan']);
const GE_USER_TABS_V236=userDefaultTabs;
userDefaultTabs=function(role){
  if(role==='Lounge Luar Biasa')return['lounge-access','lounge-visitor','lounge-flights'];
  if(role==='Lounge Staff')return['lounge-access','lounge-visitor','lounge-flights'];
  if(role==='Branch Office')return [...new Set([...GE_USER_TABS_V236(role),'lounge-flights'])];
  return GE_USER_TABS_V236(role);
};
window.addEventListener('DOMContentLoaded',()=>{
  const link=document.querySelector('.side a[href="lounge-flights.html"]');if(link){const s=geSession()||{},allowed=['Super Admin','Admin','Branch Office','Lounge Staff','Lounge Luar Biasa'].includes(s.role)||(typeof gxHasTab==='function'&&gxHasTab('lounge-flights'));link.style.display=allowed?'':'none'}
});

/* V2.37 — Lounge/Tenant reference design + paginated master cards */
let GE_LOUNGE_CARD_PAGE_V237=1;
const GE_LOUNGE_CARD_PAGE_SIZE_V237=12;

function geLoungeCardSourceV237(){
  let rows=(data.lounges||[]).slice();
  const q=(document.getElementById('loungeSearch')?.value||document.getElementById('loungeSearchV234')?.value||'').trim().toLowerCase();
  const airport=(document.getElementById('loungeAirportFilter')?.value||document.getElementById('loungeAirportFilterV234')?.value||'');
  if(q) rows=rows.filter(x=>`${x.airport||''} ${x.name||''} ${x.type||''}`.toLowerCase().includes(q));
  if(airport) rows=rows.filter(x=>String(x.airport||'')===airport);
  return rows;
}
function geDaysRemainingV237(end){
  if(!end)return null;
  const d=new Date(end+'T23:59:59'),now=new Date();
  return Math.ceil((d-now)/86400000);
}
function geLoungePriceV237(x){
  const cur=x.currency||'IDR',n=Number(x.pricePerPax||x.price||0);
  if(!n)return 'Belum diisi';
  if(cur==='IDR')return 'Rp '+n.toLocaleString('id-ID');
  return `${cur} ${n.toLocaleString('id-ID')}`;
}
function renderLoungeCardsV237(){
  const grid=document.getElementById('loungeCardGridV237');if(!grid)return;
  const rows=geLoungeCardSourceV237(),pages=Math.max(1,Math.ceil(rows.length/GE_LOUNGE_CARD_PAGE_SIZE_V237));
  GE_LOUNGE_CARD_PAGE_V237=Math.min(Math.max(1,GE_LOUNGE_CARD_PAGE_V237),pages);
  const start=(GE_LOUNGE_CARD_PAGE_V237-1)*GE_LOUNGE_CARD_PAGE_SIZE_V237;
  const slice=rows.slice(start,start+GE_LOUNGE_CARD_PAGE_SIZE_V237);
  grid.innerHTML=slice.map(x=>{
    const days=geDaysRemainingV237(x.endDate||x.contractEnd||x.end);
    const cls=days===null?'neutral':days<90?'danger':days<180?'warning':'good';
    const type=x.type||x.category||'Lounge';
    return `<article class="lounge-master-card-v237">
      <div class="lounge-master-code-v237">${geEsc(x.airport||'-')}</div>
      <div class="lounge-master-card-body-v237">
        <div class="lounge-master-card-top-v237"><span class="lounge-type-pill-v237">${geEsc(type)}</span>
          ${days!==null?`<span class="lounge-days-pill-v237 ${cls}">${days>=0?days+' hari tersisa':'Kontrak berakhir'}</span>`:''}
        </div>
        <h3>${geEsc(x.name||'Lounge/Tenant')}</h3>
        <dl><div><dt>Periode kerja sama</dt><dd>${geEsc(x.startDate||x.contractStart||x.start||'-')} — ${geEsc(x.endDate||x.contractEnd||x.end||'-')}</dd></div>
        <div><dt>Harga per pax</dt><dd>${geEsc(geLoungePriceV237(x))}</dd></div></dl>
        <div class="lounge-card-actions-v237">
          ${typeof geIsAdmin==='function'&&geIsAdmin()?`<button class="btn secondary compact-btn" onclick="openLoungeEdit?.(${Number(x.id)})">Update</button>`:''}
        </div>
      </div>
    </article>`;
  }).join('') || '<div class="lounge-master-empty-v237">Belum ada data Lounge/Tenant pada filter ini.</div>';
  const info=document.getElementById('loungeCardPageInfoV237');if(info)info.textContent=`Halaman ${GE_LOUNGE_CARD_PAGE_V237} dari ${pages} • ${rows.length} data`;
  const prev=document.getElementById('loungeCardPrevV237'),next=document.getElementById('loungeCardNextV237');
  if(prev)prev.disabled=GE_LOUNGE_CARD_PAGE_V237<=1;if(next)next.disabled=GE_LOUNGE_CARD_PAGE_V237>=pages;
}
function changeLoungeCardPageV237(delta){GE_LOUNGE_CARD_PAGE_V237+=delta;renderLoungeCardsV237();document.querySelector('.lounge-open-heading-v237')?.scrollIntoView({behavior:'smooth',block:'start'})}
window.addEventListener('DOMContentLoaded',()=>{
  renderLoungeCardsV237();
  ['loungeSearch','loungeSearchV234','loungeAirportFilter','loungeAirportFilterV234'].forEach(id=>{
    const e=document.getElementById(id);if(e)e.addEventListener(e.tagName==='INPUT'?'input':'change',()=>{GE_LOUNGE_CARD_PAGE_V237=1;renderLoungeCardsV237()});
  });
});
const GE_SAVE_V237=typeof save==='function'?save:null;
if(GE_SAVE_V237){save=function(){const r=GE_SAVE_V237.apply(this,arguments);setTimeout(renderLoungeCardsV237,0);return r}}

/* ===== V2.38 Lounge Access right-panel fallback ===== */
function geManualFallbackMarkupV238(){
  return `<div id="manualEntry" class="manual-entry lounge-manual-v236 lounge-manual-right-v238 show">
    <div class="lounge-section-head-v236"><div><span class="lounge-kicker-v236">FALLBACK</span><h3>Input Manual</h3><p>Digunakan bila barcode/string tidak dapat dibaca. Eligibility dihitung otomatis.</p></div></div>
    <div class="formgrid">
      <label>Nama Penumpang<input id="manualName" placeholder="Nama Penumpang"></label><label>Flight Number<input id="manualFlight" placeholder="GA127"></label>
      <label>From<input id="manualFrom" maxlength="3" placeholder="DJB"></label><label>To<input id="manualTo" maxlength="3" placeholder="CGK"></label>
      <label>Cabin<select id="manualCabin"><option value="">Pilih Cabin</option><option value="C">C / Business</option><option value="Y">Y / Economy</option></select></label><label>Seat<input id="manualSeat" placeholder="7A"></label>
      <label>Sequence Check-in<input id="manualSeq" placeholder="107"></label><label>Ticket Number<input id="manualTicket" placeholder="126xxxxxxxxxxx"></label>
      <label>Member<select id="manualMember"><option value="">Tidak Ada / Lainnya</option><option>Platinum</option><option>Elite Plus</option></select></label>
    </div><div class="scanner-note lounge-note-v236">Eligibility dihitung otomatis: Cabin C/Business = Eligible. Cabin Y/Economy = Eligible untuk Platinum atau Elite Plus; kombinasi lain = Tidak Eligible.</div>
    <div class="scan-actions"><button class="btn lounge-primary-v236" onclick="verifyManualPassenger()">Verifikasi Data Manual</button><button class="btn secondary" onclick="resetLoungeAccess()">Batal</button></div></div>`;
}
toggleManualEntry=function(){
  stopCameraScanner?.();
  const p=document.getElementById('eligibilityPanel'); if(!p)return;
  p.innerHTML=geManualFallbackMarkupV238();
  setTimeout(()=>document.getElementById('manualName')?.focus(),50);
};
const geResetLoungeAccessV238=resetLoungeAccess;
resetLoungeAccess=function(){
  geResetLoungeAccessV238();
  const p=document.getElementById('eligibilityPanel');
  if(p)p.innerHTML='<div class="eligibility-idle lounge-idle-v236"><div class="lounge-idle-icon-v236">⌁</div><b>Menunggu Boarding Pass</b><span>Data hasil parsing dan status eligibility akan tampil di sini.</span></div>';
};

/* V2.39 — Lounge/Tenant management + visitor costing & PDF report */
(function(){
  const oldResolve=window.geResolveVisitorLounge || geResolveVisitorLounge;
  window.geResolveVisitorLounge=geResolveVisitorLounge=function(visitor){
    let v=oldResolve(visitor);
    if(v.currency && Number(v.pricePerPax||0)>0) return v;
    const lounges=data.lounges||[];
    let l=null;
    if(v.loungeId) l=lounges.find(x=>String(x.id)===String(v.loungeId));
    if(!l && v.loungeName && v.loungeName!=='-') l=lounges.find(x=>String(x.airport||'').toUpperCase()===String(v.airport||'').toUpperCase() && String(x.name||'').trim().toLowerCase()===String(v.loungeName||'').trim().toLowerCase());
    if(!l){
      const atAirport=lounges.filter(x=>String(x.airport||'').toUpperCase()===String(v.airport||'').toUpperCase() && Number(x.pricePerPax||0)>0);
      if(atAirport.length===1) l=atAirport[0];
    }
    if(l){v.loungeId=l.id;v.loungeName=l.name||v.loungeName;v.pricePerPax=Number(l.pricePerPax||0);v.currency=l.currency||'IDR';v.priceDisplay=l.priceDisplay||'';v.priceSource='Lounge Master — fallback match';}
    return v;
  };
})();

function deleteLoungeV239(id){
  if(!(typeof gePlanningCanAction==='function'?gePlanningCanAction('Delete'):(typeof geIsAdmin==='function'&&geIsAdmin()))) return;
  const x=(data.lounges||[]).find(a=>String(a.id)===String(id)); if(!x)return;
  const run=()=>{data.lounges=(data.lounges||[]).filter(a=>String(a.id)!==String(id));save();renderLounges();renderLoungeCardsV237();};
  if(typeof geConfirmDeleteV234==='function') geConfirmDeleteV234({title:'Hapus Lounge/Tenant?',item:x.name||'Lounge/Tenant',message:'Data master, harga, periode kerja sama, dan referensi layanan ini akan dihapus.'}).then(ok=>{if(ok)run()});
  else if(confirm(`Hapus ${x.name||'Lounge/Tenant'}?`)) run();
}
window.deleteLoungeV239=deleteLoungeV239;
const GE_RENDER_CARDS_V239=renderLoungeCardsV237;
renderLoungeCardsV237=function(){
  GE_RENDER_CARDS_V239();
  if(!(typeof geIsAdmin==='function'&&geIsAdmin()))return;
  const rows=geLoungeCardSourceV237(); const start=(GE_LOUNGE_CARD_PAGE_V237-1)*GE_LOUNGE_CARD_PAGE_SIZE_V237;
  document.querySelectorAll('#loungeCardGridV237 .lounge-master-card-v237').forEach((card,i)=>{
    const x=rows[start+i]; if(!x)return;
    const actions=card.querySelector('.lounge-card-actions-v237');
    if(actions && !actions.querySelector('.danger')) actions.insertAdjacentHTML('beforeend',`<button class="btn danger compact-btn" onclick="deleteLoungeV239(${Number(x.id)})">Hapus</button>`);
  });
};

function visitorReportTypeChangedV239(){
 const monthly=document.getElementById('visitorReportTypeV239')?.value==='monthly';
 document.getElementById('visitorReportDailyWrapV239').style.display=monthly?'none':'';
 document.getElementById('visitorReportMonthlyWrapV239').style.display=monthly?'':'none';
}
function openVisitorReportModalV239(){
 const m=document.getElementById('visitorReportModalV239');if(!m)return;
 const a=document.getElementById('visitorReportAirportV239');
 const airports=[...new Set((data.lounges||[]).map(x=>x.airport).filter(Boolean))].sort();
 a.innerHTML='<option value="">Pilih Branch Office</option>'+airports.map(x=>`<option>${geEsc(x)}</option>`).join('');
 a.value=document.getElementById('visitorAirport')?.value||'';
 a.onchange=populateVisitorReportLoungesV239; populateVisitorReportLoungesV239();
 const today=new Date().toISOString().slice(0,10);document.getElementById('visitorReportDateV239').value=today;document.getElementById('visitorReportMonthV239').value=today.slice(0,7);
 m.classList.add('show');
}
function closeVisitorReportModalV239(){document.getElementById('visitorReportModalV239')?.classList.remove('show')}
function populateVisitorReportLoungesV239(){
 const airport=document.getElementById('visitorReportAirportV239')?.value||'',s=document.getElementById('visitorReportLoungeV239');if(!s)return;
 const rows=(data.lounges||[]).filter(x=>!airport||x.airport===airport);
 s.innerHTML='<option value="">Pilih Lounge/Tenant</option>'+rows.map(x=>`<option value="${x.id}">${geEsc(x.name||'-')}</option>`).join('');
}
function geReportRowsV239(type,period,airport,loungeId){
 return (data.loungeVisitors||[]).map(geResolveVisitorLounge).filter(v=>{
   const date=String(v.date||''); const periodOk=type==='monthly'?date.startsWith(period):date===period;
   return periodOk && (!airport||v.airport===airport) && (!loungeId||String(v.loungeId)===String(loungeId));
 });
}
function downloadVisitorReportPDFV239(){
 const type=document.getElementById('visitorReportTypeV239').value;
 const period=type==='monthly'?document.getElementById('visitorReportMonthV239').value:document.getElementById('visitorReportDateV239').value;
 const airport=document.getElementById('visitorReportAirportV239').value,loungeId=document.getElementById('visitorReportLoungeV239').value;
 if(!period||!airport||!loungeId)return alert('Lengkapi periode, Branch Office, dan Lounge/Tenant terlebih dahulu.');
 if(!window.jspdf?.jsPDF)return alert('Library PDF belum termuat. Pastikan perangkat terhubung internet lalu coba kembali.');
 const lounge=(data.lounges||[]).find(x=>String(x.id)===String(loungeId)); const rows=geReportRowsV239(type,period,airport,loungeId);
 const {jsPDF}=window.jspdf, doc=new jsPDF({unit:'mm',format:'a4'}); const W=210;
 doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text('LAPORAN VISITOR LOUNGE/TENANT',W/2,18,{align:'center'});
 doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(`Branch Office: ${airport}`,18,29);doc.text(`Lokasi/Layanan: ${lounge?.name||'-'}`,18,35);doc.text(`Periode: ${type==='monthly'?period:'Tanggal '+period}`,18,41);
 doc.line(18,46,192,46);doc.setFont('helvetica','bold');doc.text(`Total Visitor: ${rows.length}`,18,54);
 const totals={};rows.forEach(x=>{if(x.currency&&Number(x.pricePerPax||0))totals[x.currency]=(totals[x.currency]||0)+Number(x.pricePerPax)});
 doc.setFont('helvetica','normal');doc.text('Estimasi biaya: '+(Object.entries(totals).map(([c,v])=>`${c} ${v.toLocaleString('id-ID')}`).join(' | ')||'Belum tersedia'),18,61);
 let y=72;doc.setFont('helvetica','bold');doc.setFontSize(8);['No','Tanggal','Waktu','Nama','Flight','Kategori'].forEach((h,i)=>doc.text(h,[18,28,52,70,132,154][i],y));y+=5;doc.line(18,y,192,y);y+=5;doc.setFont('helvetica','normal');
 rows.forEach((r,i)=>{if(y>250){doc.addPage();y=20}doc.text(String(i+1),18,y);doc.text(String(r.date||'-'),28,y);doc.text(String(r.time||'-'),52,y);doc.text(String(r.name||'-').slice(0,30),70,y);doc.text(String(r.flight||'-'),132,y);doc.text(String(r.category||'-').slice(0,22),154,y);y+=6});
 y=Math.max(y+14,225);if(y>245){doc.addPage();y=210}doc.setFontSize(10);doc.text(lounge?.name||'Vendor Lounge/Tenant',52,y,{align:'center'});doc.text(`Garuda Indonesia - Branch Office ${airport}`,158,y,{align:'center'});doc.text('Nama: ................................',52,y+22,{align:'center'});doc.text('Nama: ................................',158,y+22,{align:'center'});
 doc.save(`Laporan_Visitor_${airport}_${period}.pdf`);closeVisitorReportModalV239();
}

/* ==============================================================
   V2.40 — Lounge/Tenant cost calculation fix
   ============================================================== */
function geResolveVisitorPriceV240(visitor){
  const v=geResolveVisitorLounge(visitor);
  if(v.currency && Number(v.pricePerPax||0)>0) return v;

  const airport=String(v.airport||'').trim().toUpperCase();
  const visitDate=String(v.date||'').slice(0,10);
  const lounges=(data.lounges||[]).filter(l=>String(l.airport||'').trim().toUpperCase()===airport);
  const valid=lounges.filter(l=>{
    if(!visitDate)return true;
    const d=new Date(visitDate+'T12:00:00'); if(Number.isNaN(d.getTime()))return true;
    const s=l.startDate?new Date(l.startDate+'T00:00:00'):null;
    const e=l.endDate?new Date(l.endDate+'T23:59:59'):null;
    return (!s||d>=s)&&(!e||d<=e);
  });

  let lounge=null;
  if(v.loungeId) lounge=valid.find(l=>String(l.id)===String(v.loungeId))||lounges.find(l=>String(l.id)===String(v.loungeId));
  if(!lounge && v.loungeName && v.loungeName!=='-'){
    const n=String(v.loungeName).trim().toLowerCase();
    lounge=valid.find(l=>String(l.name||'').trim().toLowerCase()===n)||lounges.find(l=>String(l.name||'').trim().toLowerCase()===n);
  }
  if(!lounge){
    const priced=valid.filter(l=>l.currency&&Number(l.pricePerPax||0)>0);
    if(priced.length===1) lounge=priced[0];
  }
  if(lounge && lounge.currency && Number(lounge.pricePerPax||0)>0){
    v.loungeId=lounge.id;v.loungeName=lounge.name||v.loungeName||'-';v.currency=lounge.currency;
    v.pricePerPax=Number(lounge.pricePerPax||0);
    v.priceDisplay=lounge.priceDisplay||`${lounge.currency} ${Number(lounge.pricePerPax||0).toLocaleString(lounge.currency==='IDR'?'id-ID':'en-US')}`;
    v.priceSource='Lounge/Tenant Master — V2.40';
  }
  return v;
}

function renderVisitorCostSummary(rows){
  const resolved=(rows||[]).map(geResolveVisitorPriceV240), totals={};
  resolved.forEach(v=>{const c=String(v.currency||'').trim().toUpperCase(),a=Number(v.pricePerPax||0);if(c&&a>0)totals[c]=(totals[c]||0)+a;});
  const box=document.getElementById('visitorEstimatedCost');
  if(box){
    const entries=Object.entries(totals);
    box.innerHTML=entries.length?entries.map(([c,n])=>`<span class="currency-total-v240"><small>${c}</small><strong>${n.toLocaleString(c==='IDR'?'id-ID':'en-US',{maximumFractionDigits:2})}</strong></span>`).join(''):'<span class="currency-total-v240 empty"><strong>Belum tersedia</strong><small>Harga belum dapat direferensikan</small></span>';
  }
  const count=document.getElementById('visitorFilteredTotal'); if(count)count.textContent=resolved.length;
  let changed=false;
  (data.loungeVisitors||[]).forEach(v=>{const b=[v.loungeId,v.loungeName,v.currency,v.pricePerPax,v.priceDisplay].join('|');geResolveVisitorPriceV240(v);const a=[v.loungeId,v.loungeName,v.currency,v.pricePerPax,v.priceDisplay].join('|');if(a!==b)changed=true;});
  if(changed)save();
}

downloadLoungeVisitorsCSV=function(){
  let csv='No,Tanggal,Waktu,Nama Penumpang,Rute,Flight Number,Cabin,Seat,Sequence Check-in,Airport,Nama Lounge/Tenant,Kategori Penumpang,Referensi Eligibility,Harga per Pax\n';
  loungeVisitorFiltered().map(geResolveVisitorPriceV240).forEach((x,i)=>{const e=v=>String(v??'').replaceAll('"','""');csv+=`${i+1},${x.date||''},${x.time||''},"${e(x.name)}","${e(x.route||((x.origin&&x.destination)?x.origin+'-'+x.destination:''))}",${x.flight||''},"${e(x.cabin)}","${e(x.seat)}","${e(x.seq)}","${e(x.airport)}","${e(x.loungeName)}","${e(x.category)}","${e(x.eligibilityReference)}","${e(x.priceDisplay||((x.currency&&x.pricePerPax)?x.currency+' '+x.pricePerPax:''))}"\n`;});
  downloadBlob(csv,'Lounge_Tenant_Visitor.csv','text/csv;charset=utf-8');
};

window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{if(document.getElementById('loungeVisitorRows'))renderLoungeVisitors();},120));


/* ==============================================================
   V2.43 — Provider filter, price insight, map service filter,
           Branch Office Service Procurement
   ============================================================== */

function gePopulateLoungeProviderFilterV243(){
  const e=document.getElementById('loungeNameFilter');if(!e||e.tagName!=='SELECT')return;
  const cur=e.value;
  const names=[...new Set((data.lounges||[]).map(x=>String(x.name||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
  e.innerHTML='<option value="">Semua Nama Layanan / Provider</option>'+names.map(v=>`<option value="${geEsc(v)}">${geEsc(v)}</option>`).join('');
  e.value=names.includes(cur)?cur:'';
}
loungeFiltered=function(){
  const region=document.getElementById('loungeRegionFilter')?.value||'';
  const station=document.getElementById('loungeAirportFilter')?.value||'';
  const provider=document.getElementById('loungeNameFilter')?.value||'';
  const status=document.getElementById('loungeStatusFilter')?.value||'';
  return (data.lounges||[]).filter(x=>(!region||x.region===region)&&(!station||x.airport===station)&&(!provider||String(x.name||'')===provider)&&(!status||x.documentStatus===status));
};
geLoungeCardSourceV237=function(){return loungeFiltered()};

function renderLoungePriceSummaryV243(){
  const box=document.getElementById('loungePriceSummaryV243');if(!box)return;
  const rows=loungeFiltered().filter(x=>x.currency&&Number(x.pricePerPax||0)>0),groups={};
  rows.forEach(x=>{const c=String(x.currency).toUpperCase();(groups[c]||=[]).push(Number(x.pricePerPax))});
  const entries=Object.entries(groups).sort(([a],[b])=>a.localeCompare(b));
  box.innerHTML=entries.length?entries.map(([c,vals])=>{
    const avg=vals.reduce((s,v)=>s+v,0)/vals.length,min=Math.min(...vals),max=Math.max(...vals),locale=c==='IDR'?'id-ID':'en-US';
    const fmt=v=>v.toLocaleString(locale,{maximumFractionDigits:2});
    return `<article class="lounge-price-currency-card-v243"><div class="lounge-price-currency-v243">${geEsc(c)}</div>
      <div><span>Rata-rata</span><b>${fmt(avg)}</b></div><div><span>Terendah</span><b>${fmt(min)}</b></div><div><span>Tertinggi</span><b>${fmt(max)}</b></div>
      <small>${vals.length} harga terfilter</small></article>`;
  }).join(''):'<div class="lounge-price-empty-v243">Belum ada harga pada data yang sesuai dengan filter.</div>';
  const count=document.getElementById('loungePriceSummaryCountV243');if(count)count.textContent=`${rows.length} layanan dengan harga`;
}
const GE_RENDER_LOUNGES_V243=renderLounges;
renderLounges=function(){gePopulateLoungeProviderFilterV243();GE_RENDER_LOUNGES_V243();renderLoungeCardsV237();renderLoungePriceSummaryV243()};
window.addEventListener('DOMContentLoaded',()=>{gePopulateLoungeProviderFilterV243();renderLoungePriceSummaryV243()});

/* Combined Lounge Master + Service Procurement */
function geServiceProcurementRowsV243(){
  const lounge=(geVisibleLoungeRows()||[]).map(x=>({...x,_source:'lounge',categoryService:'Lounge',serviceName:x.name}));
  const extra=gePlanningScoped(data.serviceProcurement||[]).map(x=>({...x,_source:'service',categoryService:x.categoryService||'Service Lainnya',serviceName:x.serviceName||''}));
  return [...lounge,...extra];
}
function geServiceFollowupV243(x){
  if(x._source==='lounge')return geContractNeedsFollowup(x);
  const ds=String(x.documentStatus||'').toLowerCase();
  if(ds==='pending'||ds==='invalid')return true;
  if(x.endDate){const d=new Date(x.endDate+'T23:59:59');if(!Number.isNaN(d.getTime())&&d<new Date())return true}
  return false;
}
function geServicePriceV243(x){
  if(!x.currency||!Number(x.pricePerPax||0))return'-';
  const locale=x.currency==='IDR'?'id-ID':'en-US';
  return `${x.currency} ${Number(x.pricePerPax).toLocaleString(locale,{maximumFractionDigits:2})}`;
}
renderLoungeProcurement=function(){
  const tbody=document.getElementById('loungeProcurementRows');if(!tbody)return;
  const rows=geServiceProcurementRowsV243();
  gePlanningPopulateSelect('procAirportFilter',rows.map(x=>x.airport),'Semua Airport');
  gePlanningPopulateSelect('procCategoryFilterV243',rows.map(x=>x.categoryService),'Semua Kategori Layanan');
  const q=(procSearch?.value||'').toLowerCase(),a=procAirportFilter?.value||'',cat=procCategoryFilterV243?.value||'',st=procContractFilter?.value||'';
  const filtered=rows.filter(x=>{const f=geServiceFollowupV243(x);return(!q||`${x.airport} ${x.serviceName} ${x.categoryService}`.toLowerCase().includes(q))&&(!a||x.airport===a)&&(!cat||x.categoryService===cat)&&(!st||(st==='followup'?f:!f))});
  tbody.innerHTML=filtered.map((x,i)=>{
    const b=geBudgetApprovalForLounge({airport:x.airport,name:x.serviceName}),f=geServiceFollowupV243(x);
    const actions=gePlanningCanManage()
      ? (x._source==='service'?`<td class="visitor-actions"><button class="btn secondary compact-btn" onclick="openServiceProcurementModalV243(${x.id})">Update</button><button class="btn danger compact-btn" onclick="deleteServiceProcurementV243(${x.id})">Hapus</button></td>`:`<td><a class="btn secondary compact-btn" href="lounge-list.html">Kelola di Lounge Master</a></td>`)
      :'';
    return `<tr><td>${i+1}</td><td><b>${geEsc(x.airport||'-')}</b></td><td>${geEsc(x.categoryService||'-')}</td><td>${geEsc(x.serviceName||'-')}</td><td>${geEsc(geServicePriceV243(x))}</td><td>${geEsc(x.startDate||'-')} — ${geEsc(x.endDate||'-')}</td><td><span class="planning-status">${f?'Follow-up':'Covered'}</span></td><td>${b?geEsc(b.title):'Belum terhubung'}</td><td>${geEsc(x.documentNumber||x.documentName||'-')}</td>${actions}</tr>`;
  }).join('');
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  set('procLoungeTotal',rows.length);set('procContractCovered',rows.filter(x=>!geServiceFollowupV243(x)).length);set('procContractPending',rows.filter(geServiceFollowupV243).length);set('procBudgetAvailable',rows.filter(x=>geBudgetApprovalForLounge({airport:x.airport,name:x.serviceName})).length);
  if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
};

function openServiceProcurementModalV243(id=null){
  if(!gePlanningCanManage())return;const x=id?(data.serviceProcurement||[]).find(v=>v.id===id):null;
  serviceProcurementModalTitleV243.textContent=x?'Update Service':'Tambah Service';serviceProcurementEditIdV243.value=x?.id||'';
  serviceAirportV243.value=x?.airport||'';serviceCategoryV243.value=x?.categoryService||'SGHA';serviceNameV243.value=x?.serviceName||'';
  serviceCurrencyV243.value=x?.currency||'';servicePriceV243.value=x?.pricePerPax??'';serviceStartV243.value=x?.startDate||'';serviceEndV243.value=x?.endDate||'';
  serviceDocumentNumberV243.value=x?.documentNumber||'';serviceDocumentTypeV243.value=x?.documentType||'';serviceDocumentStatusV243.value=x?.documentStatus||'Valid';serviceRemarksV243.value=x?.remarks||'';serviceDocumentFileV243.value='';
  serviceProcurementModalV243.classList.add('show');
}
function closeServiceProcurementModalV243(){serviceProcurementModalV243?.classList.remove('show')}
async function saveServiceProcurementV243(){
  if(!gePlanningCanManage())return;const id=Number(serviceProcurementEditIdV243.value||0),old=id?(data.serviceProcurement||[]).find(v=>v.id===id):null,file=serviceDocumentFileV243.files?.[0];
  let documentName=old?.documentName||'',documentKey=old?.documentKey||'';
  if(file){documentKey=`service_procurement_${Date.now()}`;await GEFiles.put(documentKey,file);documentName=file.name}
  const obj={id:id||Date.now(),airport:serviceAirportV243.value.trim().toUpperCase(),categoryService:serviceCategoryV243.value,serviceName:serviceNameV243.value.trim(),currency:serviceCurrencyV243.value.trim().toUpperCase(),pricePerPax:Number(servicePriceV243.value||0),startDate:serviceStartV243.value,endDate:serviceEndV243.value,documentNumber:serviceDocumentNumberV243.value.trim(),documentType:serviceDocumentTypeV243.value.trim(),documentStatus:serviceDocumentStatusV243.value,remarks:serviceRemarksV243.value.trim(),documentName,documentKey};
  if(!obj.airport||!obj.serviceName)return geStorageNoticeV223('Data Belum Lengkap','Airport dan Nama Service / Provider wajib diisi.');
  data.serviceProcurement=data.serviceProcurement||[];if(id)Object.assign(old,obj);else data.serviceProcurement.push(obj);
  save();closeServiceProcurementModalV243();renderLoungeProcurement();renderAirportMapMarkers();
}
async function deleteServiceProcurementV243(id){
  if(!gePlanningCanManage())return;const x=(data.serviceProcurement||[]).find(v=>v.id===id);if(!x)return;
  const ok=typeof geConfirmDeleteV234==='function'?await geConfirmDeleteV234({title:'Hapus Service?',item:`${x.airport} • ${x.categoryService} • ${x.serviceName}`,message:'Service akan dihapus dari Branch Office Planning.'}):confirm('Hapus service ini?');
  if(!ok)return;data.serviceProcurement=data.serviceProcurement.filter(v=>v.id!==id);save();renderLoungeProcurement();renderAirportMapMarkers();
}

GE_IMPORT_SCHEMA_V223['service-procurement-v243']={
  title:'Upload Service Procurement',help:'Gunakan Template Service Procurement.',
  aliases:{airport:['airport'],categoryService:['kategori layanan'],serviceName:['nama service provider','nama service / provider'],currency:['currency'],pricePerPax:['harga pax','harga / pax'],startDate:['tanggal mulai'],endDate:['tanggal berakhir'],documentNumber:['nomor dokumen'],documentType:['jenis dokumen'],documentStatus:['status dokumen'],remarks:['remarks']}
};
function geImportServiceProcurementV243(rows){
  let added=0,skipped=0;data.serviceProcurement=data.serviceProcurement||[];
  rows.forEach(r=>{const airport=String(r.airport||'').trim().toUpperCase(),name=String(r.serviceName||'').trim(),cat=String(r.categoryService||'Service Lainnya').trim();
    if(!airport||!name||!['Lounge','SGHA','Service Lainnya'].includes(cat)){skipped++;return}
    data.serviceProcurement.push({id:Date.now()+added,airport,categoryService:cat,serviceName:name,currency:String(r.currency||'').trim().toUpperCase(),pricePerPax:Number(String(r.pricePerPax||0).replace(/,/g,''))||0,startDate:geNormalizeDateUploadV223(r.startDate),endDate:geNormalizeDateUploadV223(r.endDate),documentNumber:String(r.documentNumber||'').trim(),documentType:String(r.documentType||'').trim(),documentStatus:String(r.documentStatus||'Valid').trim(),remarks:String(r.remarks||'').trim(),documentName:'',documentKey:''});added++});
  save();renderLoungeProcurement();renderAirportMapMarkers();return{added,skipped};
}
async function confirmBulkImportV243(){
  const {type,rows}=GE_BULK_IMPORT_V223;if(!rows.length)return;let result;
  if(type==='service-procurement-v243')result=geImportServiceProcurementV243(rows);
  else if(type==='airport'||type==='personnel'||type==='station-material'||type==='airport-system-v231'||['gaso-master','gaso-support','gaso-planning'].includes(type))result=geImportSimpleV231(type,rows);
  else if(type==='lounge')result=geImportLoungeV230(rows);
  else if(type==='space')result=geImportSpaceV223(rows);
  else if(type==='system')result=geImportSystemV223(rows);
  else if(type==='visitor')result=geImportVisitorV223(rows);
  if(!result)return;
  return geConfirmImportPersistedV240(result,`${result.added} data berhasil ditambahkan • ${result.skipped} baris dilewati.`);
}

/* Map service/facility filter. SGHA records are ready to represent Ground Handling. */
function geAirportServiceInfoV243(code){
  const a=String(code||'').toUpperCase(),lounges=(data.lounges||[]).filter(x=>String(x.airport||'').toUpperCase()===a),services=(data.serviceProcurement||[]).filter(x=>String(x.airport||'').toUpperCase()===a);
  return{lounges,sgha:services.filter(x=>x.categoryService==='SGHA'),other:services.filter(x=>x.categoryService==='Service Lainnya')};
}
const GE_MAP_FILTER_V243=geMapFilteredAirports;
geMapFilteredAirports=function(){
  let rows=GE_MAP_FILTER_V243(),f=document.getElementById('mapServiceFilterV243')?.value||'';
  if(!f)return rows;
  return rows.filter(a=>{const s=geAirportServiceInfoV243(a.code);if(f==='Lounge/Tenant')return s.lounges.length;if(f==='SGHA')return s.sgha.length;if(f==='Service Lainnya')return s.other.length;return true});
};
showAirportTooltip=function(ev,code){
  const d=geAirportInfo(code),t=document.getElementById('mapTooltip'),m=document.getElementById('interactiveMap');if(!d||!t||!m)return;const s=geAirportServiceInfoV243(code);
  t.innerHTML=`<div class="tooltip-airport-head"><b>${d.code} — ${geEsc(d.city)}</b><span class="${d.status==='Active'?'status-active':'status-inactive'}">${d.status}</span></div><small>${geEsc(d.wilayah)} • ${geEsc(d.region||'-')}</small><div class="tooltip-grid"><span>GM<b>${geEsc(d.gm)}</b></span><span>Visitor Lounge<b>${Number(d.visitorLounge).toLocaleString('id-ID')}</b></span><span>Lounge/Tenant<b>${s.lounges.length}</b></span><span>SGHA<b>${s.sgha.length}</b></span><span>Other Service<b>${s.other.length}</b></span><span>Pending<b>${d.pending}</b></span></div>`;
  const mr=m.getBoundingClientRect(),er=ev.currentTarget.getBoundingClientRect(),w=318,h=205;let left=er.left-mr.left+er.width/2,top=er.top-mr.top-h-15;if(top<12)top=er.bottom-mr.top+14;left=Math.max(w/2+12,Math.min(mr.width-w/2-12,left));top=Math.max(12,Math.min(mr.height-h-12,top));t.style.left=left+'px';t.style.top=top+'px';t.classList.add('show');
};
geOpenAirportDetail217=function(code,marker){
  document.querySelectorAll('.airport-marker').forEach(x=>x.classList.remove('active'));marker?.classList.add('active');
  const d=geAirportInfo(code),p=document.getElementById('airportDetail');if(!d||!p)return;const contractRows=geAirportLoungeContracts(code),s=geAirportServiceInfoV243(code);
  p.innerHTML=`<div class="code">${d.code}</div><h2>${geEsc(d.city)}</h2><p class="section-subtitle">${geEsc(d.airportName||'Airport / Branch Office')} • ${geEsc(d.wilayah)} • ${geEsc(d.region||'-')}</p><div class="detail-status-line"><span class="${d.status==='Active'?'status-active':'status-inactive'}">${d.status}</span></div><div class="detail-row">General Manager<b>${geEsc(d.gm)}</b></div><div class="detail-row">Visitor Lounge<b>${Number(d.visitorLounge).toLocaleString('id-ID')} visitor</b></div><div class="detail-row">Lounge/Tenant<b>${s.lounges.length} layanan</b></div><div class="detail-row">Ground Handling / SGHA<b>${s.sgha.length} service</b></div><div class="detail-row">Service Lainnya<b>${s.other.length} service</b></div><div class="detail-row">Pending Contract<b>${d.pending} item</b></div><div class="detail-row">Koordinat<b>${Number(d.lat).toFixed(4)}, ${Number(d.lon).toFixed(4)}</b></div>${geIsSuperAdmin217()?'<div class="map-admin-note-v217">Super Admin dapat memindahkan marker.</div>':''}${contractRows.length?`<div class="map-contract-mini"><span>Provider Lounge/Tenant</span>${contractRows.slice(0,4).map(l=>`<div>${geEsc(l.name)}<b>${geContractNeedsFollowup(l)?'Follow-up':'OK'}</b></div>`).join('')}</div>`:''}${s.sgha.length?`<div class="map-contract-mini"><span>Ground Handling / SGHA</span>${s.sgha.slice(0,4).map(x=>`<div>${geEsc(x.serviceName)}<b>${geServiceFollowupV243(x)?'Follow-up':'OK'}</b></div>`).join('')}</div>`:''}`;
};


/* ==============================================================
   V2.44 — Airport Network Vendor Filter + Tabbed Airport Detail
   ============================================================== */

/* Vendor/provider names come from the same planning sources:
   Lounge/Tenant Master + Service Procurement (SGHA / Other Service). */
function geAirportVendorRowsV244(){
  const lounge=(data.lounges||[]).map(x=>({
    airport:String(x.airport||'').trim().toUpperCase(),
    vendor:String(x.name||'').trim(),
    category:'Lounge',
    source:'Lounge/Tenant Master'
  }));
  const service=(data.serviceProcurement||[]).map(x=>({
    airport:String(x.airport||'').trim().toUpperCase(),
    vendor:String(x.serviceName||x.name||'').trim(),
    category:String(x.categoryService||'Service Lainnya'),
    source:'Branch Office Planning'
  }));
  return [...lounge,...service].filter(x=>x.airport&&x.vendor);
}

function gePopulateMapVendorFilterV244(){
  const e=document.getElementById('mapVendorFilterV244');if(!e)return;
  const cur=e.value;
  const vendors=[...new Set(geAirportVendorRowsV244().map(x=>x.vendor))]
    .sort((a,b)=>a.localeCompare(b,'id'));
  e.innerHTML='<option value="">Semua Vendor / Provider</option>'+
    vendors.map(v=>`<option value="${geEsc(v)}">${geEsc(v)}</option>`).join('');
  e.value=vendors.includes(cur)?cur:'';
}

function geAirportVendorInfoV244(code){
  const airport=String(code||'').trim().toUpperCase();
  return geAirportVendorRowsV244().filter(x=>x.airport===airport);
}

/* Final airport filter: base filters from previous versions + vendor/provider. */
const GE_MAP_FILTER_BASE_V244=geMapFilteredAirports;
geMapFilteredAirports=function(){
  let rows=GE_MAP_FILTER_BASE_V244();
  const vendor=document.getElementById('mapVendorFilterV244')?.value||'';
  if(!vendor)return rows;
  return rows.filter(a=>geAirportVendorInfoV244(a.code).some(x=>x.vendor===vendor));
};

/* Keep vendor dropdown updated when map renders / planning data changes. */
const GE_RENDER_AIRPORT_MAP_V244=renderAirportMapMarkers;
renderAirportMapMarkers=function(){
  gePopulateMapVendorFilterV244();
  GE_RENDER_AIRPORT_MAP_V244();
};

/* ---------- Airport detail tab data ---------- */
function geAirportPersonnelV244(code){
  const c=String(code||'').toUpperCase();
  return (data.personnel||[]).filter(x=>String(x.airport||'').toUpperCase()===c);
}
function geAirportSystemsV244(code){
  const c=String(code||'').toUpperCase();
  return (data.airportSystems||[]).filter(x=>String(x.airport||'').toUpperCase()===c);
}
function geAirportSpacesV244(code){
  const c=String(code||'').toUpperCase();
  return (data.boSpaces||[]).filter(x=>String(x.airport||'').toUpperCase()===c);
}
function geAirportServicesV244(code){
  const c=String(code||'').toUpperCase();
  return (data.serviceProcurement||[]).filter(x=>String(x.airport||'').toUpperCase()===c);
}
function geAirportLoungesV244(code){
  const c=String(code||'').toUpperCase();
  return (data.lounges||[]).filter(x=>String(x.airport||'').toUpperCase()===c);
}

function geAirportDetailTabContentV244(code,tab){
  const d=geAirportInfo(code);if(!d)return'';
  const services=geAirportServicesV244(code),lounges=geAirportLoungesV244(code),
        people=geAirportPersonnelV244(code),spaces=geAirportSpacesV244(code),
        systems=geAirportSystemsV244(code);

  if(tab==='service'){
    const rows=services;
    return rows.length?`<div class="airport-detail-list-v244">${rows.map(x=>`
      <div class="airport-detail-item-v244">
        <div><span>${geEsc(x.categoryService||'Service')}</span><b>${geEsc(x.serviceName||'-')}</b></div>
        <small>${geEsc(x.documentStatus||'-')}${x.endDate?' • s.d. '+geEsc(x.endDate):''}</small>
      </div>`).join('')}</div>`
      :'<div class="airport-detail-empty-v244">Belum ada Service Procurement pada airport ini.</div>';
  }

  if(tab==='lounge'){
    return lounges.length?`<div class="airport-detail-list-v244">${lounges.map(x=>`
      <div class="airport-detail-item-v244">
        <div><span>${geEsc(x.type||x.category||'Lounge/Tenant')}</span><b>${geEsc(x.name||'-')}</b></div>
        <small>${x.currency&&x.pricePerPax?`${geEsc(x.currency)} ${Number(x.pricePerPax).toLocaleString(x.currency==='IDR'?'id-ID':'en-US')}`:'Harga belum diisi'}${x.endDate?' • s.d. '+geEsc(x.endDate):''}</small>
      </div>`).join('')}</div>`
      :'<div class="airport-detail-empty-v244">Belum ada Lounge/Tenant pada airport ini.</div>';
  }

  if(tab==='people'){
    const gm=d.gm&&d.gm!=='Belum tersedia'?`<div class="airport-detail-item-v244 featured"><div><span>General Manager</span><b>${geEsc(d.gm)}</b></div></div>`:'';
    return gm+(people.length?`<div class="airport-detail-list-v244">${people.slice(0,12).map(x=>`
      <div class="airport-detail-item-v244"><div><span>${geEsc(x.function||x.position||'Personnel')}</span><b>${geEsc(x.name||'-')}</b></div><small>${geEsc(x.position||'')}</small></div>`).join('')}</div>`
      :'<div class="airport-detail-empty-v244">Belum ada data personil airport.</div>');
  }

  if(tab==='facility'){
    return spaces.length?`<div class="airport-detail-list-v244">${spaces.map(x=>`
      <div class="airport-detail-item-v244"><div><span>${geEsc(x.function||'Facility')}</span><b>${geEsc(x.location||'-')}</b></div><small>${x.sizeM2?Number(x.sizeM2).toLocaleString('id-ID')+' m² • ':''}${geEsc(x.landlord||'-')}</small></div>`).join('')}</div>`
      :'<div class="airport-detail-empty-v244">Belum ada data Space & Building pada airport ini.</div>';
  }

  if(tab==='system'){
    return systems.length?`<div class="airport-detail-list-v244">${systems.map(x=>`
      <div class="airport-detail-item-v244"><div><span>${geEsc(x.system||'Airport System')}</span><b>${geEsc(x.provider||'-')}</b></div><small>${geEsc(x.terminal||'-')} • ${geEsc(x.availability||'-')}</small></div>`).join('')}</div>`
      :'<div class="airport-detail-empty-v244">Belum ada Airport System pada airport ini.</div>';
  }

  if(tab==='contract'){
    const pending=Number(d.pending||0),contracts=geAirportLoungeContracts(code);
    return `<div class="airport-contract-summary-v244">
      <div><span>Pending Contract</span><b>${pending}</b></div>
      <div><span>Lounge/Tenant Contract</span><b>${contracts.length}</b></div>
      <div><span>Service Procurement</span><b>${services.length}</b></div>
    </div>
    ${contracts.length?`<div class="airport-detail-list-v244">${contracts.slice(0,8).map(x=>`
      <div class="airport-detail-item-v244"><div><span>${geContractNeedsFollowup(x)?'Follow-up':'Covered'}</span><b>${geEsc(x.name||'-')}</b></div><small>${geEsc(x.startDate||'-')} — ${geEsc(x.endDate||'-')}</small></div>`).join('')}</div>`:''}`;
  }

  return '';
}

function geSwitchAirportDetailTabV244(code,tab,btn){
  document.querySelectorAll('#airportDetail .airport-detail-chip-v244').forEach(x=>x.classList.remove('active'));
  btn?.classList.add('active');
  const box=document.getElementById('airportDetailTabBodyV244');
  if(box)box.innerHTML=geAirportDetailTabContentV244(code,tab);
}

/* New detail design modeled on the preferred card reference:
   large airport code, city/name, horizontally-scrollable section chips. */
geOpenAirportDetail217=function(code,marker){
  document.querySelectorAll('.airport-marker').forEach(x=>x.classList.remove('active'));
  marker?.classList.add('active');

  const d=geAirportInfo(code),p=document.getElementById('airportDetail');if(!d||!p)return;
  const vendors=geAirportVendorInfoV244(code);
  const services=geAirportServicesV244(code),lounges=geAirportLoungesV244(code),
        people=geAirportPersonnelV244(code),spaces=geAirportSpacesV244(code),
        systems=geAirportSystemsV244(code);

  p.innerHTML=`<div class="airport-profile-v244">
    <div class="airport-profile-code-v244">${geEsc(d.code)}</div>
    <div class="airport-profile-title-v244">
      <h2>${geEsc(d.city)}</h2>
      <p>${geEsc(d.airportName||'Airport / Branch Office')} • ${geEsc(d.region||d.wilayah||'-')}</p>
    </div>

    <div class="airport-profile-vendor-v244">
      ${vendors.length?`<span>Vendor / Provider</span><div>${[...new Set(vendors.map(x=>x.vendor))].slice(0,4).map(v=>`<b>${geEsc(v)}</b>`).join('')}</div>`:''}
    </div>

    <div class="airport-detail-chip-scroll-v244">
      <div class="airport-detail-chip-track-v244">
        <button class="airport-detail-chip-v244 active" onclick="geSwitchAirportDetailTabV244('${geEsc(code)}','service',this)">Service <small>${services.length}</small></button>
        <button class="airport-detail-chip-v244" onclick="geSwitchAirportDetailTabV244('${geEsc(code)}','lounge',this)">Lounge <small>${lounges.length}</small></button>
        <button class="airport-detail-chip-v244" onclick="geSwitchAirportDetailTabV244('${geEsc(code)}','people',this)">People <small>${people.length}</small></button>
        <button class="airport-detail-chip-v244" onclick="geSwitchAirportDetailTabV244('${geEsc(code)}','facility',this)">Facility <small>${spaces.length}</small></button>
        <button class="airport-detail-chip-v244" onclick="geSwitchAirportDetailTabV244('${geEsc(code)}','system',this)">System <small>${systems.length}</small></button>
        <button class="airport-detail-chip-v244" onclick="geSwitchAirportDetailTabV244('${geEsc(code)}','contract',this)">Contract <small>${Number(d.pending||0)}</small></button>
      </div>
    </div>

    <div id="airportDetailTabBodyV244" class="airport-detail-tab-body-v244">
      ${geAirportDetailTabContentV244(code,'service')}
    </div>

    <div class="airport-profile-meta-v244">
      <div><span>Status</span><b>${geEsc(d.status||'-')}</b></div>
      <div><span>Visitor Lounge</span><b>${Number(d.visitorLounge||0).toLocaleString('id-ID')}</b></div>
      <div><span>Koordinat</span><b>${Number(d.lat).toFixed(4)}, ${Number(d.lon).toFixed(4)}</b></div>
    </div>
    ${geIsSuperAdmin217()?'<div class="map-admin-note-v217">Super Admin dapat memindahkan marker airport dari peta.</div>':''}
  </div>`;
};

/* Tooltip remains concise, but mentions actual provider names rather than just category count. */
showAirportTooltip=function(ev,code){
  const d=geAirportInfo(code),t=document.getElementById('mapTooltip'),m=document.getElementById('interactiveMap');if(!d||!t||!m)return;
  const vendors=geAirportVendorInfoV244(code),vendorNames=[...new Set(vendors.map(x=>x.vendor))];
  t.innerHTML=`<div class="tooltip-airport-head"><b>${d.code} — ${geEsc(d.city)}</b><span class="${d.status==='Active'?'status-active':'status-inactive'}">${d.status}</span></div>
    <small>${geEsc(d.wilayah)} • ${geEsc(d.region||'-')}</small>
    <div class="tooltip-grid">
      <span>GM<b>${geEsc(d.gm)}</b></span>
      <span>Visitor Lounge<b>${Number(d.visitorLounge).toLocaleString('id-ID')}</b></span>
      <span>Vendor / Provider<b>${vendorNames.length}</b></span>
      <span>Pending<b>${d.pending}</b></span>
    </div>
    ${vendorNames.length?`<div class="tooltip-vendor-v244">${vendorNames.slice(0,3).map(v=>`<b>${geEsc(v)}</b>`).join('')}</div>`:''}`;

  const mr=m.getBoundingClientRect(),er=ev.currentTarget.getBoundingClientRect(),w=318,h=220;
  let left=er.left-mr.left+er.width/2,top=er.top-mr.top-h-15;
  if(top<12)top=er.bottom-mr.top+14;
  left=Math.max(w/2+12,Math.min(mr.width-w/2-12,left));
  top=Math.max(12,Math.min(mr.height-h-12,top));
  t.style.left=left+'px';t.style.top=top+'px';t.classList.add('show');
};

window.addEventListener('DOMContentLoaded',()=>{
  gePopulateMapVendorFilterV244();
  renderAirportMapMarkers();
});


/* ==============================================================
   V2.45 — Stable Map Zoom + Searchable Filter Combobox
   ============================================================== */

/* ---------- Stable single-state map zoom ----------
   Legacy versions used several overlapping transform-origin zoom handlers.
   This final override uses a single matrix transform, so map image and markers
   always scale/pan together from the same coordinate system.
*/
let GE_MAP_ZOOM_V245 = 1;

const GE_MAP_PRESET_V245 = {
  '':             {base:1.00, focusX:.62, focusY:.50, label:'Operational Network'},
  'Domestik':     {base:2.12, focusX:.73, focusY:.66, label:'Indonesia / Domestic'},
  'Asia':         {base:1.48, focusX:.67, focusY:.35, label:'Asia'},
  'Middle East':  {base:1.72, focusX:.38, focusY:.39, label:'Middle East'},
  'Europe':       {base:1.66, focusX:.20, focusY:.18, label:'Europe'},
  'Asia Pacific': {base:1.52, focusX:.82, focusY:.68, label:'Asia Pacific'}
};

function geApplyMapView(){
  const stage=document.getElementById('mapStage');
  const viewport=document.getElementById('mapViewport');
  if(!stage||!viewport)return;

  const cfg=GE_MAP_PRESET_V245[GE_MAP_REGION]||GE_MAP_PRESET_V245[''];
  const scale=Math.max(1,Math.min(3.20,cfg.base*GE_MAP_ZOOM_V245));

  const w=viewport.clientWidth||1, h=viewport.clientHeight||1;
  const limitX=Math.max(0,(scale-1)*w/2);
  const limitY=Math.max(0,(scale-1)*h/2);
  const tx=Math.max(-limitX,Math.min(limitX,-(cfg.focusX-.5)*w*scale));
  const ty=Math.max(-limitY,Math.min(limitY,-(cfg.focusY-.5)*h*scale));

  stage.style.transformOrigin='50% 50%';
  stage.style.transform=`matrix(${scale},0,0,${scale},${tx},${ty})`;

  const label=document.getElementById('mapZoomLabel');
  if(label)label.textContent=`${cfg.label} • ${Math.round(scale*100)}%`;
}

function geMapZoomStep(direction){
  GE_MAP_ZOOM_V245=Math.max(.72,Math.min(1.72,GE_MAP_ZOOM_V245+(direction>0?.12:-.12)));
  geApplyMapView();
}
function geMapResetView(){
  GE_MAP_ZOOM_V245=1;
  GE_MAP_REGION='';
  window.GEActiveMapRegion='';
  document.querySelectorAll('.map-chip,.map-region-cards button').forEach(x=>x.classList.remove('active'));
  document.querySelector('.map-region-cards button:first-child')?.classList.add('active');
  document.querySelector('.map-chip[data-region=""]')?.classList.add('active');
  hideAirportTooltip();
  renderAirportMapMarkers();
  geApplyMapView();
}
function filterAirportMap(region,button){
  GE_MAP_REGION=region||'';
  window.GEActiveMapRegion=GE_MAP_REGION;
  GE_MAP_ZOOM_V245=1;
  document.querySelectorAll('.map-chip,.map-region-cards button').forEach(x=>x.classList.remove('active'));
  button?.classList.add('active');
  document.querySelectorAll(`.map-chip[data-region="${GE_MAP_REGION}"]`).forEach(x=>x.classList.add('active'));
  hideAirportTooltip();
  renderAirportMapMarkers();
  geApplyMapView();
  geUpdateMapRegionCounts();
}

/* Capture wheel first so legacy wheel listeners do not create double/contradictory zoom. */
window.addEventListener('DOMContentLoaded',()=>{
  const map=document.getElementById('interactiveMap');
  if(map&&!map.dataset.zoomV245){
    map.dataset.zoomV245='1';
    map.addEventListener('wheel',e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      GE_MAP_ZOOM_V245=Math.max(.72,Math.min(1.72,GE_MAP_ZOOM_V245+(e.deltaY<0?.08:-.08)));
      geApplyMapView();
    },{capture:true,passive:false});
  }
  setTimeout(geApplyMapView,0);
});
window.addEventListener('resize',()=>{if(document.getElementById('mapStage'))geApplyMapView()});

/* ---------- Searchable filter combobox ----------
   Applied only to FILTER selects, not data-entry forms.
   User may either click the dropdown or type part of the option name.
*/
function geIsFilterSelectV245(select){
  if(!select||select.tagName!=='SELECT')return false;
  const id=String(select.id||'').toLowerCase();
  return id.includes('filter') ||
    !!select.closest('.filter-grid,.data-filter-grid,.map-search-tools,.map-filters,.filterbar,.filter-panel');
}

function geRefreshSearchableFilterV245(select){
  const wrap=select?._geSearchWrapV245;if(!wrap)return;
  const input=wrap.querySelector('.search-filter-input-v245');
  const menu=wrap.querySelector('.search-filter-menu-v245');
  const options=[...select.options].map((o,i)=>({value:o.value,label:o.textContent.trim(),disabled:o.disabled,index:i}));
  wrap._geOptionsV245=options;
  const selected=options.find(o=>o.value===select.value);
  if(document.activeElement!==input)input.value=selected?.label||'';
  geRenderSearchableOptionsV245(wrap,input.value,document.activeElement===input);
}

function geRenderSearchableOptionsV245(wrap,query='',preserveQuery=false){
  const menu=wrap.querySelector('.search-filter-menu-v245');
  const input=wrap.querySelector('.search-filter-input-v245');
  const q=String(query||'').trim().toLowerCase();
  const options=wrap._geOptionsV245||[];
  const visible=options.filter(o=>!o.disabled && (!q||o.label.toLowerCase().includes(q)));
  menu.innerHTML=visible.length?visible.map(o=>
    `<button type="button" class="search-filter-option-v245 ${String(wrap._geSelectV245.value)===String(o.value)?'selected':''}" data-value="${geEsc(o.value)}">
      ${geEsc(o.label)}
    </button>`
  ).join(''):`<div class="search-filter-empty-v245">Tidak ada pilihan yang cocok</div>`;
  if(!preserveQuery){
    const selected=options.find(o=>o.value===wrap._geSelectV245.value);
    input.value=selected?.label||'';
  }
}

function geCloseSearchableFiltersV245(except=null){
  document.querySelectorAll('.search-filter-combo-v245.open').forEach(w=>{if(w!==except)w.classList.remove('open')});
}

function geEnhanceFilterSelectV245(select){
  if(window.GEGlobalSelect || select?.dataset?.geGlobalSelectV1)return;
  if(!geIsFilterSelectV245(select)||select.dataset.searchableV245)return;
  select.dataset.searchableV245='1';

  const wrap=document.createElement('div');
  wrap.className='search-filter-combo-v245';
  const input=document.createElement('input');
  input.type='text';
  input.className='search-filter-input-v245';
  input.autocomplete='off';
  input.setAttribute('aria-label',select.getAttribute('aria-label')||'Cari pilihan filter');
  const toggle=document.createElement('button');
  toggle.type='button';
  toggle.className='search-filter-toggle-v245';
  toggle.innerHTML='⌄';
  const menu=document.createElement('div');
  menu.className='search-filter-menu-v245';

  select.parentNode.insertBefore(wrap,select);
  wrap.append(input,toggle,menu,select);
  wrap._geSelectV245=select;
  select._geSearchWrapV245=wrap;
  select.classList.add('search-filter-native-v245');

  geRefreshSearchableFilterV245(select);

  input.addEventListener('focus',()=>{
    geCloseSearchableFiltersV245(wrap);
    wrap.classList.add('open');
    input.select();
    geRenderSearchableOptionsV245(wrap,input.value,true);
  });
  input.addEventListener('input',()=>{
    wrap.classList.add('open');
    geRenderSearchableOptionsV245(wrap,input.value,true);
  });
  input.addEventListener('keydown',e=>{
    if(e.key==='Escape'){wrap.classList.remove('open');geRefreshSearchableFilterV245(select)}
    if(e.key==='ArrowDown'){
      e.preventDefault();
      wrap.classList.add('open');
      menu.querySelector('button')?.focus();
    }
    if(e.key==='Enter'){
      const first=menu.querySelector('button');
      if(first){e.preventDefault();first.click()}
    }
  });
  toggle.addEventListener('click',()=>{
    const willOpen=!wrap.classList.contains('open');
    geCloseSearchableFiltersV245(wrap);
    wrap.classList.toggle('open',willOpen);
    if(willOpen){input.focus();geRenderSearchableOptionsV245(wrap,'',true)}
  });
  menu.addEventListener('click',e=>{
    const b=e.target.closest('.search-filter-option-v245');if(!b)return;
    select.value=b.dataset.value;
    const opt=[...select.options].find(o=>String(o.value)===String(select.value));
    input.value=opt?.textContent.trim()||'';
    wrap.classList.remove('open');
    select.dispatchEvent(new Event('change',{bubbles:true}));
  });
  menu.addEventListener('keydown',e=>{
    if(!e.target.matches('button'))return;
    if(e.key==='ArrowDown'){e.preventDefault();e.target.nextElementSibling?.focus()}
    if(e.key==='ArrowUp'){e.preventDefault();(e.target.previousElementSibling||input).focus()}
    if(e.key==='Escape'){wrap.classList.remove('open');input.focus()}
  });

  select.addEventListener('change',()=>geRefreshSearchableFilterV245(select));

  const observer=new MutationObserver(()=>geRefreshSearchableFilterV245(select));
  observer.observe(select,{childList:true,subtree:true,attributes:true});
  wrap._geObserverV245=observer;
}

function geEnhanceAllFilterSelectsV245(root=document){
  root.querySelectorAll('select').forEach(geEnhanceFilterSelectV245);
}

window.addEventListener('DOMContentLoaded',()=>{
  geEnhanceAllFilterSelectsV245();
  const obs=new MutationObserver(mutations=>{
    mutations.forEach(m=>m.addedNodes.forEach(n=>{
      if(n.nodeType!==1)return;
      if(n.matches?.('select'))geEnhanceFilterSelectV245(n);
      geEnhanceAllFilterSelectsV245(n);
    }));
  });
  obs.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(!e.target.closest('.search-filter-combo-v245'))geCloseSearchableFiltersV245();
  });
});

/* ==============================================================
   V2.46 — Planning governance + initiative cards + announcement library
   ============================================================== */
function geMonthsWarningV246(endDate){
 if(!endDate)return{cls:'',label:'-'}; const d=new Date(endDate+'T23:59:59'),now=new Date();
 const days=Math.ceil((d-now)/86400000); if(days<0)return{cls:'expired',label:'Masa kerja sama telah berakhir'};
 if(days<=90)return{cls:'critical',label:`${days} hari tersisa • < 3 bulan`};
 if(days<=153)return{cls:'warning',label:`${days} hari tersisa • < 5 bulan`};
 return{cls:'normal',label:`${days} hari tersisa`};
}
function geMoneyV246(amount,currency='IDR'){const n=Number(amount||0);return `${currency||'IDR'} ${new Intl.NumberFormat('id-ID',{maximumFractionDigits:0}).format(n)}`}
function geAnnualCostV246(x){
 const explicit=Number(x.annualCost||0);if(explicit)return explicit;
 const monthly=Number(x.monthlyCost||x.rentPerMonth||0);if(monthly)return monthly*12;
 const rate=Number(x.rate||x.price||0),area=Number(x.size||x.areaSize||0);return rate&&area?rate*area*12:0;
}
/* Initiative filters now also include PIC */
const GE_REFRESH_INIT_V246=refreshInitiativeFilters;
refreshInitiativeFilters=function(){GE_REFRESH_INIT_V246();const fp=document.getElementById('fp');if(fp){const cur=fp.value;const vals=[...new Set((data.initiatives||[]).map(x=>x.pic).filter(Boolean))].sort();fp.innerHTML='<option value="">Semua PIC</option>'+vals.map(v=>`<option>${geEsc(v)}</option>`).join('');if(vals.includes(cur))fp.value=cur;geRefreshSearchableFilterV245?.(fp)}};
const GE_CURRENT_INIT_V246=currentInitiativeRows;
currentInitiativeRows=function(){const rows=GE_CURRENT_INIT_V246();const pic=document.getElementById('fp')?.value||'';return rows.filter(x=>!pic||x.pic===pic)};
function geInitiativeStatusV246(x){return achievement(x.plan,x.real)}
function geInitiativeCardV246(x,i){
 const status=geInitiativeStatusV246(x),ratio=progressRatio(x.plan,x.real),due=geDueLabelV224(x),state=geDueStateV224(x);
 return `<article class="initiative-card-v246 ${state}">
  <div class="initiative-card-index-v246"><strong>${String(i+1).padStart(2,'0')}</strong><div class="initiative-ring-v246" style="--p:${Math.min(100,Number(x.real||0))}"><span>${Number(x.real||0)}%</span></div><span class="initiative-status-v246 ${status.toLowerCase()}">${status}</span></div>
  <div class="initiative-card-body-v246"><h3>${geEsc(x.name||'-')}</h3><div class="initiative-meta-v246"><span><b>PIC</b>${geEsc(x.pic||'-')}</span><span><b>Due Date</b>${due}</span><span><b>Touch Point</b>${geEsc(x.tp||'-')}</span><span><b>Station</b>${geEsc(x.airport||'-')}</span></div><div class="initiative-plan-v246"><span>Target <b>${Number(x.plan||0)}%</b></span><span>Realisasi <b>${Number(x.real||0)}%</b></span><div class="mini-progress"><i style="width:${Math.min(100,ratio)}%"></i></div></div><div class="initiative-card-actions-v246">${geInitiativeManageButtonsV224(x)}</div></div>
 </article>`;
}
renderInitiatives=function(){refreshInitiativeFilters();const rows=currentInitiativeRows().filter(geInitiativeScopedV224);const t=document.getElementById('initRows');if(t)t.innerHTML=rows.length?rows.map(geInitiativeCardV246).join(''):'<div class="initiative-empty-v246">Belum ada inisiatif pada filter ini.</div>';renderInitiativeCharts(rows)};
/* Keep progress history instead of silently overwriting the latest value. */
const GE_SAVE_PROGRESS_V246=saveInitiativeProgressV224;
saveInitiativeProgressV224=function(){const id=Number(initiativeProgressIdV224?.value||0),x=(data.initiatives||[]).find(v=>v.id===id);if(x){x.progressHistory=Array.isArray(x.progressHistory)?x.progressHistory:[];x.progressHistory.push({date:new Date().toISOString(),real:Number(initiativeProgressRealV224.value||0),remark:initiativeProgressRemarkV224.value.trim(),by:geInitiativeUserV224().name||geInitiativeUserV224().username||''})}GE_SAVE_PROGRESS_V246()};
/* Station Material V2.46: start/end period and warning */
const GE_OPEN_SM_V246=openStationMaterialModalV231;
openStationMaterialModalV231=function(id=null){GE_OPEN_SM_V246(id);const x=id?(data.stationMaterials||[]).find(v=>v.id===id):null;if(document.getElementById('stationMaterialStartV246'))stationMaterialStartV246.value=x?.startDate||'';if(document.getElementById('stationMaterialEndV246'))stationMaterialEndV246.value=x?.endDate||''};
renderStationMaterials=function(){const tbody=document.getElementById('stationMaterialRows');if(!tbody)return;gePlanningPopulateSelect('materialAreaFilterV231',(data.stationMaterials||[]).map(x=>x.area),'Semua Area');gePlanningPopulateSelect('materialVendorFilterV231',(data.stationMaterials||[]).map(x=>x.vendor),'Semua Provider');const q=(materialSearch?.value||'').toLowerCase(),a=materialAreaFilterV231?.value||'',v=materialVendorFilterV231?.value||'',s=materialStatusFilter?.value||'';const rows=(data.stationMaterials||[]).filter(x=>(!q||`${x.code} ${x.product} ${x.vendor}`.toLowerCase().includes(q))&&(!a||x.area===a)&&(!v||x.vendor===v)&&(!s||x.status===s));tbody.innerHTML=rows.map((x,i)=>{const w=geMonthsWarningV246(x.endDate);return `<tr class="contract-row-v246 ${w.cls}"><td>${i+1}</td><td><b>${geEsc(x.code||'')}</b></td><td>${geEsc(x.product||'')}</td><td>${geEsc(x.area||'-')}</td><td>${geEsc(x.vendor||'-')}</td><td>${x.startDate||'-'}</td><td><b>${x.endDate||'-'}</b><small class="contract-label-v246">${w.label}</small></td><td>${geEsc(x.status||'-')}</td><td>${x.documentKey?`<button class="btn secondary compact-btn" onclick="GEFiles.download('${x.documentKey}','${geEsc(x.documentName||'document')}')">Unduh</button>`:'-'}</td>${geAdminV231()?`<td><div class="manage-inline-v246"><button class="btn secondary compact-btn" onclick="openStationMaterialModalV231(${x.id})">Update</button><button class="btn danger compact-btn" onclick="deleteStationMaterialV231(${x.id})">Hapus</button></div></td>`:''}</tr>`}).join('');if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0)};
/* Announcement library */
window.geAnnouncementLibraryV246=[
 {id:'preboarding',title:'Pre-Boarding Announcement',touchpoint:'Boarding Gate',type:'Group Boarding',variants:['Narrow Body','Wide Body'],languages:['Bahasa Indonesia','English'],summary:'Announcement sebelum boarding dimulai, termasuk prioritas dan urutan boarding group.',groups:['Priority — special assistance, infant/children, elderly, expectant mother','Group 1 — Business / premium frequent flyer priority','Group 2 — priority frequent flyer / priority service','Group 3–6 — Economy berdasarkan seat zone']},
 {id:'boarding',title:'Boarding Announcement',touchpoint:'Boarding Gate',type:'Group Boarding',variants:['Narrow Body','Wide Body'],languages:['Bahasa Indonesia','English'],summary:'Announcement saat proses boarding dimulai dengan urutan priority dan boarding group.',groups:['Priority Boarding','Group 1','Group 2','Group 3','Group 4','Group 5','Group 6']}
];
function renderAnnouncementLibraryV246(){const box=document.getElementById('announcementLibraryV246');if(!box)return;const q=(document.getElementById('announcementSearchV246')?.value||'').toLowerCase(),type=document.getElementById('announcementTypeV246')?.value||'',aircraft=document.getElementById('announcementAircraftV246')?.value||'',lang=document.getElementById('announcementLanguageV246')?.value||'';const rows=geAnnouncementLibraryV246.filter(x=>(!q||`${x.title} ${x.touchpoint} ${x.type}`.toLowerCase().includes(q))&&(!type||x.touchpoint===type)&&(!aircraft||x.variants.includes(aircraft))&&(!lang||x.languages.includes(lang)));box.innerHTML=rows.map((x,i)=>`<article class="announcement-card-v246"><div class="announcement-no-v246">${String(i+1).padStart(2,'0')}</div><div><span class="eyebrow">${geEsc(x.touchpoint)} • ${geEsc(x.type)}</span><h3>${geEsc(x.title)}</h3><p>${geEsc(x.summary)}</p><div class="announcement-tags-v246">${x.variants.map(v=>`<span>${v}</span>`).join('')}${x.languages.map(v=>`<span>${v}</span>`).join('')}</div><button class="btn secondary compact-btn" onclick="openAnnouncementReferenceV246('${x.id}')">Buka Announcement</button></div></article>`).join('')};
function openAnnouncementReferenceV246(id){const x=geAnnouncementLibraryV246.find(v=>v.id===id);if(!x)return;document.getElementById('announcementReferenceTitleV246').textContent=x.title;document.getElementById('announcementReferenceBodyV246').innerHTML=`<div class="announcement-reference-head-v246"><span>${x.touchpoint}</span><span>${x.type}</span></div><p>${geEsc(x.summary)}</p><h4>Urutan / Struktur Announcement</h4><div class="announcement-sequence-v246">${x.groups.map((g,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b><span>${geEsc(g)}</span></div>`).join('')}</div><div class="announcement-note-v246">Script lengkap mengikuti master announcement resmi yang dikelola pada modul ini.</div>`;document.getElementById('announcementReferenceModalV246').classList.add('show')}
function closeAnnouncementReferenceV246(){document.getElementById('announcementReferenceModalV246')?.classList.remove('show')}
window.addEventListener('DOMContentLoaded',()=>{renderAnnouncementLibraryV246()});


/* ==============================================================
   V2.47 — UI STABILIZATION
   - filter behavior & layer stacking
   - initiative card responsive layout
   - Space & Building period/currency
   - Standard Reference follows selected section
   ============================================================== */

/* ---------- Searchable filter: click = show ALL; type = narrow results ---------- */
function geOpenSearchableFilterV247(wrap){
  if(!wrap)return;
  geCloseSearchableFiltersV245(wrap);
  wrap.classList.add('open');
  const input=wrap.querySelector('.search-filter-input-v245');
  if(input){
    input.value='';
    geRenderSearchableOptionsV245(wrap,'',true);
  }
}
function geRestoreSearchableFilterV247(wrap){
  if(!wrap)return;
  const select=wrap._geSelectV245;
  const input=wrap.querySelector('.search-filter-input-v245');
  const options=wrap._geOptionsV245||[];
  const selected=options.find(o=>String(o.value)===String(select?.value||''));
  if(input)input.value=selected?.label||'';
}

/* Rebind all enhanced filters once, while preserving underlying select values. */
function geUpgradeFilterBehaviorV247(){
  document.querySelectorAll('.search-filter-combo-v245').forEach(wrap=>{
    if(wrap.dataset.v247==='1')return;
    wrap.dataset.v247='1';
    const input=wrap.querySelector('.search-filter-input-v245');
    const toggle=wrap.querySelector('.search-filter-toggle-v245');
    const menu=wrap.querySelector('.search-filter-menu-v245');
    if(!input||!toggle||!menu)return;

    /* capture phase runs before previous V2.45 handlers */
    input.addEventListener('focus',e=>{
      e.stopImmediatePropagation();
      geOpenSearchableFilterV247(wrap);
    },true);

    input.addEventListener('click',e=>{
      e.stopImmediatePropagation();
      if(!wrap.classList.contains('open'))geOpenSearchableFilterV247(wrap);
    },true);

    input.addEventListener('input',e=>{
      e.stopImmediatePropagation();
      wrap.classList.add('open');
      geRenderSearchableOptionsV245(wrap,input.value,true);
    },true);

    toggle.addEventListener('click',e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      if(wrap.classList.contains('open')){
        wrap.classList.remove('open');
        geRestoreSearchableFilterV247(wrap);
      }else{
        geOpenSearchableFilterV247(wrap);
        input.focus();
      }
    },true);
  });
}
window.addEventListener('DOMContentLoaded',()=>{
  setTimeout(geUpgradeFilterBehaviorV247,20);
  const obs=new MutationObserver(()=>setTimeout(geUpgradeFilterBehaviorV247,0));
  obs.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(!e.target.closest('.search-filter-combo-v245')){
      document.querySelectorAll('.search-filter-combo-v245.open').forEach(w=>{
        w.classList.remove('open');geRestoreSearchableFilterV247(w);
      });
    }
  },true);
});

/* ---------- Initiative card refinement ---------- */
function geInitiativeCardV247(x,i){
  const status=geInitiativeStatusV246(x);
  const ratio=progressRatio(x.plan,x.real);
  const due=geDueLabelV224(x);
  const state=geDueStateV224(x);
  const real=Math.max(0,Math.min(100,Number(x.real||0)));
  return `<article class="initiative-card-v247 ${state}">
    <aside class="initiative-card-side-v247">
      <strong>${String(i+1).padStart(2,'0')}</strong>
      <div class="initiative-ring-v247" style="--p:${real}"><span>${real}%</span></div>
      <span class="initiative-status-v247 ${String(status).toLowerCase()}">${status}</span>
    </aside>
    <div class="initiative-card-main-v247">
      <h3>${geEsc(x.name||'-')}</h3>
      <div class="initiative-meta-v247">
        <div><span>PIC</span><b>${geEsc(x.pic||'-')}</b></div>
        <div><span>Due Date</span><b>${due}</b></div>
        <div><span>Touch Point</span><b>${geEsc(x.tp||'-')}</b></div>
        <div><span>Station</span><b>${geEsc(x.airport||'-')}</b></div>
      </div>
      <div class="initiative-progress-v247">
        <div><span>Target <b>${Number(x.plan||0)}%</b></span><span>Realisasi <b>${Number(x.real||0)}%</b></span></div>
        <div class="mini-progress"><i style="width:${Math.min(100,ratio)}%"></i></div>
      </div>
      <div class="initiative-card-actions-v247">${geInitiativeManageButtonsV224(x)}</div>
    </div>
  </article>`;
}
renderInitiatives=function(){
  refreshInitiativeFilters();
  const rows=currentInitiativeRows().filter(geInitiativeScopedV224);
  const t=document.getElementById('initRows');
  if(t)t.innerHTML=rows.length?rows.map(geInitiativeCardV247).join(''):'<div class="initiative-empty-v246">Belum ada inisiatif pada filter ini.</div>';
  renderInitiativeCharts(rows);
};

/* ---------- Space & Building: Provider, Start/End, currency-aware annual ---------- */
function geSpaceCurrencyV247(x){
  const c=String(x.currency||'').trim().toUpperCase();
  if(c)return c;
  const airport=String(x.airport||'').trim().toUpperCase();
  const a=(data.airports||[]).find(v=>String(v.code||'').toUpperCase()===airport);
  const region=String(a?.region||a?.wilayah||'').toLowerCase();
  return (region.includes('domest')||region.includes('indonesia')||!region)?'IDR':'';
}
function geSpaceAnnualV247(x){
  return geAnnualCostV246(x);
}
renderBOSpaces=function(){
  const tbody=document.getElementById('boSpaceRows');if(!tbody)return;
  const rows=gePlanningScoped(data.boSpaces||[]);
  gePlanningPopulateSelect('spaceAirportFilter',rows.map(x=>x.airport),'Semua Airport');
  gePlanningPopulateSelect('spaceFunctionFilter',rows.map(x=>x.function),'Semua Function');
  gePlanningPopulateSelect('spaceStatusFilter',rows.map(x=>geMonthsWarningV246(x.endDate).cls),'Semua Status');

  const q=(spaceSearch?.value||'').toLowerCase(),
        a=spaceAirportFilter?.value||'',
        fn=spaceFunctionFilter?.value||'',
        st=spaceStatusFilter?.value||'';

  const filtered=rows.filter(x=>{
    const state=geMonthsWarningV246(x.endDate).cls;
    const provider=x.provider||x.landlord||'';
    return (!q||`${x.airport} ${provider} ${x.location}`.toLowerCase().includes(q)) &&
      (!a||x.airport===a)&&(!fn||x.function===fn)&&(!st||state===st);
  });

  tbody.innerHTML=filtered.map((x,i)=>{
    const w=geMonthsWarningV246(x.endDate);
    const provider=x.provider||x.landlord||'-';
    const cur=geSpaceCurrencyV247(x);
    const annual=geSpaceAnnualV247(x);
    return `<tr class="contract-row-v246 ${w.cls}">
      <td>${i+1}</td><td><b>${geEsc(x.airport||'-')}</b></td>
      <td>${geEsc(x.location||'-')}</td><td>${geEsc(x.function||'-')}</td>
      <td>${Number(x.sizeM2||0).toLocaleString('id-ID')}</td>
      <td>${geEsc(provider)}</td>
      <td>${geEsc(x.startDate||'-')}</td>
      <td><b>${geEsc(x.endDate||'-')}</b><small class="contract-label-v246">${geEsc(w.label)}</small></td>
      <td><b>${annual?geMoneyV246(annual,cur||'IDR'):'-'}</b></td>
      <td><span class="planning-status">${w.cls==='expired'?'Expired':w.cls==='critical'?'Critical':w.cls==='warning'?'Expiring':'Active'}</span></td>
      <td>${geEsc(x.documentName||'-')}</td>${planAction('space',x.id)}
    </tr>`;
  }).join('');

  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  set('spaceTotal',rows.length);
  set('spaceArea',rows.reduce((s,x)=>s+Number(x.sizeM2||0),0).toLocaleString('id-ID')+' m²');
  const totals={};
  rows.forEach(x=>{const c=geSpaceCurrencyV247(x)||'IDR',v=geSpaceAnnualV247(x);if(v)totals[c]=(totals[c]||0)+v});
  set('spaceCommitment',Object.entries(totals).map(([c,v])=>geMoneyV246(v,c)).join(' • ')||'-');
  set('spaceExpiring',rows.filter(x=>['warning','critical','expired'].includes(geMonthsWarningV246(x.endDate).cls)).length);
  gePlanningEmpty('boSpaceEmpty',filtered);
  if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
};

/* ---------- Standard Reference is controlled by selected section ---------- */
let GE_STANDARD_CATEGORY_V247='People';

renderTouchpointStandards=function(){
  const tbody=document.getElementById('touchpointStandardRows');if(!tbody)return;
  const rows=data.touchpointStandards||[];
  const category=GE_STANDARD_CATEGORY_V247;
  const categoryRows=rows.filter(x=>String(x.category||'')===category);

  gePlanningPopulateSelect('tpStdTouchpointFilter',categoryRows.map(x=>x.touchpoint),'Semua Touch Point');
  const tp=document.getElementById('tpStdTouchpointFilter')?.value||'';
  const q=(document.getElementById('tpStdSearch')?.value||'').toLowerCase();

  const filtered=categoryRows.filter(x=>
    (!tp||x.touchpoint===tp)&&
    (!q||`${x.component||''} ${x.requirement||''} ${x.reference||''}`.toLowerCase().includes(q))
  );

  tbody.innerHTML=filtered.map((x,i)=>`<tr>
    <td>${i+1}</td><td><b>${geEsc(x.touchpoint||'-')}</b></td>
    <td>${geEsc(x.category||'-')}</td><td>${geEsc(x.component||'-')}</td>
    <td>${geEsc(x.requirement||'-')}</td><td>${geEsc(x.applicability||'-')}</td>
    <td>${geEsc(x.reference||'-')}</td><td>${geEsc(x.documentName||'-')}</td>
    ${planAction('touchpoint',x.id)}
  </tr>`).join('');

  const title=document.querySelector('.touchpoint-standard-title h3');
  if(title)title.textContent=`${category} Standard Reference`;
  const sub=document.querySelector('.touchpoint-standard-title .section-subtitle');
  if(sub)sub.textContent=`Reference standar ${category} berdasarkan touch point yang dipilih.`;

  gePlanningEmpty('touchpointStandardEmpty',filtered);
  if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
};

showStandardPanel=function(name,button){
  ['people','process','premises','skypriority'].forEach(k=>{
    const el=document.getElementById('standard'+k.charAt(0).toUpperCase()+k.slice(1)+'Panel');
    if(el)el.style.display=k===name?'block':'none';
  });
  document.querySelectorAll('.standard-selector').forEach(x=>x.classList.remove('active'));
  button?.classList.add('active');

  const generic=document.getElementById('touchpointStandardSectionV247');
  if(['people','process','premises'].includes(name)){
    GE_STANDARD_CATEGORY_V247=name.charAt(0).toUpperCase()+name.slice(1);
    if(generic)generic.style.display='block';
    const hidden=document.getElementById('tpStdCategoryFilter');
    if(hidden)hidden.value=GE_STANDARD_CATEGORY_V247;
    const tp=document.getElementById('tpStdTouchpointFilter');
    if(tp)tp.value='';
    renderTouchpointStandards();
  }else if(generic){
    generic.style.display='none';
  }

  if(name==='people')renderPersonnelReadiness();
  if(name==='process')renderAnnouncementLibraryV246();
  if(name==='skypriority')renderSkyPriority();
};

window.addEventListener('DOMContentLoaded',()=>{
  GE_STANDARD_CATEGORY_V247='People';
  const hidden=document.getElementById('tpStdCategoryFilter');if(hidden)hidden.value='People';
  renderTouchpointStandards();
});


/* ==============================================================
   V2.48 — STANDARD CONTENT CMS + SPACE ANNUAL AUTO CALCULATION
   ============================================================== */

/* ---------- Space & Building: annual = area × monthly rate/m² × 12 ---------- */
function geAnnualCostV248(x){
  const area=Number(x.sizeM2||x.size||x.areaSize||0);
  const rate=Number(x.ratePerM2||x.rate||x.pricePerM2||x.price||0);
  if(area>0&&rate>0)return area*rate*12;
  const monthly=Number(x.monthlyCost||x.rentPerMonth||0);if(monthly>0)return monthly*12;
  return Number(x.annualCost||0);
}
geAnnualCostV246=geAnnualCostV248;
geSpaceAnnualV247=geAnnualCostV248;

function geSpaceAnnualPreviewV248(){
  const form=document.getElementById('planningRecordForm');if(!form||GE_PLANNING_EDIT.type!=='space')return;
  const area=Number(form.querySelector('[data-plan-field="sizeM2"]')?.value||0);
  const rate=Number(form.querySelector('[data-plan-field="ratePerM2"]')?.value||0);
  const cur=(form.querySelector('[data-plan-field="currency"]')?.value||'IDR').toUpperCase();
  const box=document.getElementById('spaceAnnualPreviewV248');
  if(box)box.innerHTML=`<span>Annual Cost Otomatis</span><b>${geMoneyV246(area*rate*12,cur)}</b><small>${area.toLocaleString('id-ID')} m² × ${geMoneyV246(rate,cur)} / m² / bulan × 12 bulan</small>`;
}
const GE_OPEN_PLAN_V248=openPlanningRecordModal;
openPlanningRecordModal=function(type,id=null){
  GE_OPEN_PLAN_V248(type,id);
  gePromoteModalViewportV248(document.getElementById('planningRecordModal'));
  if(type==='space'){
    const form=document.querySelector('#planningRecordForm form');if(!form)return;
    const preview=document.createElement('div');preview.id='spaceAnnualPreviewV248';preview.className='space-annual-preview-v248';
    form.querySelector('.modal-actions')?.before(preview);
    form.querySelectorAll('[data-plan-field="sizeM2"],[data-plan-field="ratePerM2"],[data-plan-field="currency"]').forEach(x=>x.addEventListener('input',geSpaceAnnualPreviewV248));
    geSpaceAnnualPreviewV248();
  }
};

function gePromoteModalViewportV248(modal){
  if(!modal)return;
  if(modal.parentElement!==document.body)document.body.appendChild(modal);
  [['position','fixed'],['inset','0'],['width','100vw'],['height','100vh'],['margin','0'],['z-index','2147483000'],['align-items','center'],['justify-content','center'],['padding','24px'],['box-sizing','border-box']].forEach(([k,v])=>modal.style.setProperty(k,v,'important'));
  const card=modal.firstElementChild;if(!card)return;
  [['position','relative'],['inset','auto'],['transform','none'],['margin','auto'],['width','min(1180px, calc(100vw - 48px))'],['max-width','calc(100vw - 48px)'],['max-height','calc(100vh - 48px)'],['overflow','auto'],['box-sizing','border-box']].forEach(([k,v])=>card.style.setProperty(k,v,'important'));
}

savePlanningRecord=function(){
  if(!gePlanningCanManage())return;
  const {type,id}=GE_PLANNING_EDIT,coll=GE_PLANNING_COLLECTION[type],fields=GE_PLANNING_FIELDS[type];if(!coll)return;
  const obj={id:id||Date.now()};
  document.querySelectorAll('#planningRecordForm [data-plan-field]').forEach(el=>{obj[el.dataset.planField]=el.type==='number'?Number(el.value||0):el.value.trim()});
  if(obj.airport)obj.airport=obj.airport.toUpperCase();
  if(type==='space'){
    obj.currency=(obj.currency||'IDR').toUpperCase();
    obj.annualCost=geAnnualCostV248(obj);
  }
  if(id)Object.assign((data[coll]||[]).find(x=>x.id===id),obj);else data[coll].push(obj);
  save();closePlanningRecordModal();geRenderPlanningPage();
};

renderBOSpaces=function(){
  const tbody=document.getElementById('boSpaceRows');if(!tbody)return;
  const rows=gePlanningScoped(data.boSpaces||[]);
  gePlanningPopulateSelect('spaceAirportFilter',rows.map(x=>x.airport),'Semua Airport');
  gePlanningPopulateSelect('spaceFunctionFilter',rows.map(x=>x.function),'Semua Function');
  gePlanningPopulateSelect('spaceStatusFilter',rows.map(x=>geMonthsWarningV246(x.endDate).cls),'Semua Status');
  const q=(spaceSearch?.value||'').toLowerCase(),a=spaceAirportFilter?.value||'',fn=spaceFunctionFilter?.value||'',st=spaceStatusFilter?.value||'';
  const filtered=rows.filter(x=>{const state=geMonthsWarningV246(x.endDate).cls,provider=x.provider||x.landlord||'';return(!q||`${x.airport} ${provider} ${x.location}`.toLowerCase().includes(q))&&(!a||x.airport===a)&&(!fn||x.function===fn)&&(!st||state===st)});
  tbody.innerHTML=filtered.map((x,i)=>{const w=geMonthsWarningV246(x.endDate),provider=x.provider||x.landlord||'-',cur=geSpaceCurrencyV247(x)||'IDR',annual=geAnnualCostV248(x),rate=Number(x.ratePerM2||x.rate||x.pricePerM2||x.price||0);return `<tr class="contract-row-v246 ${w.cls}"><td>${i+1}</td><td><b>${geEsc(x.airport||'-')}</b></td><td>${geEsc(x.location||'-')}</td><td>${geEsc(x.function||'-')}</td><td>${Number(x.sizeM2||0).toLocaleString('id-ID')}</td><td>${rate?geMoneyV246(rate,cur):'-'}</td><td>${geEsc(provider)}</td><td>${geEsc(x.startDate||'-')}</td><td><b>${geEsc(x.endDate||'-')}</b><small class="contract-label-v246">${geEsc(w.label)}</small></td><td><b>${annual?geMoneyV246(annual,cur):'-'}</b></td><td><span class="planning-status">${w.cls==='expired'?'Expired':w.cls==='critical'?'Critical':w.cls==='warning'?'Expiring':'Active'}</span></td><td>${geEsc(x.documentName||'-')}</td>${planAction('space',x.id)}</tr>`}).join('');
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  set('spaceTotal',rows.length);set('spaceArea',rows.reduce((s,x)=>s+Number(x.sizeM2||0),0).toLocaleString('id-ID')+' m²');
  const totals={};rows.forEach(x=>{const c=geSpaceCurrencyV247(x)||'IDR',v=geAnnualCostV248(x);if(v)totals[c]=(totals[c]||0)+v});
  set('spaceCommitment',Object.entries(totals).map(([c,v])=>geMoneyV246(v,c)).join(' • ')||'-');
  set('spaceExpiring',rows.filter(x=>['warning','critical','expired'].includes(geMonthsWarningV246(x.endDate).cls)).length);
  gePlanningEmpty('boSpaceEmpty',filtered);if(typeof geEnhanceAllTables==='function')setTimeout(geEnhanceAllTables,0);
};

/* ---------- Editable Standard Content ---------- */
function geEnsureStandardContentV248(){
  if(!data.standardContent||typeof data.standardContent!=='object')data.standardContent={};
  const sc=data.standardContent;
  sc.hero ||= {title:'Standar Layanan Garuda Indonesia',description:'Framework People • Process • Premises untuk menjaga konsistensi service delivery.'};
  sc.selectors ||= {
    people:{title:'People',points:['Appearance','Seragam','Grooming','Service Attitude'],action:'Lihat Personnel Readiness'},
    process:{title:'Process',points:['Opening','Assisting','Closing','Service Recovery'],action:'Lihat Detail Process'},
    premises:{title:'Premises',points:['Area Touch Point','Signage','Cleanliness','Visual Standard'],action:'Lihat Detail Premises'},
    skypriority:{title:'SkyPriority',points:['Priority Check-in','Priority Baggage','Priority Boarding','Priority Service'],action:'Lihat SkyPriority Reference'}
  };
  sc.mainSections ||= {
    people:{title:'Branch Office Personnel Readiness',description:'Kesiapan fungsi utama di Airport/Branch Office berdasarkan master personil. Airport dengan kategori HO tidak dihitung.'},
    process:{title:'Ground Service Announcement',description:'Operational reference library untuk announcement layanan darat Garuda Indonesia.'},
    premises:{title:'Premises Standard',description:'Reference untuk Area Touch Point, Signage, Cleanliness, dan Visual Standard.'},
    skypriority:{title:'SkyPriority Service Reference',description:'Availability matrix berdasarkan master SkyPriority dan referensi layanan terkait.'}
  };
  sc.extraSections ||= [];
  sc.announcements ||= [
    {id:'preboarding',sectionId:'process-main',title:'Pre-Boarding Announcement',touchpoint:'Boarding Gate',type:'Group Boarding',variants:['Narrow Body','Wide Body'],languages:['Bahasa Indonesia','English'],summary:'Announcement sebelum boarding dimulai, termasuk prioritas dan urutan boarding group.',groups:['Priority — special assistance, infant/children, elderly, expectant mother','Group 1 — Business / premium frequent flyer priority','Group 2 — priority frequent flyer / priority service','Group 3–6 — Economy berdasarkan seat zone']},
    {id:'boarding',sectionId:'process-main',title:'Boarding Announcement',touchpoint:'Boarding Gate',type:'Group Boarding',variants:['Narrow Body','Wide Body'],languages:['Bahasa Indonesia','English'],summary:'Announcement saat proses boarding dimulai dengan urutan priority dan boarding group.',groups:['Priority Boarding','Group 1','Group 2','Group 3','Group 4','Group 5','Group 6']}
  ];
  return sc;
}
function geIsStandardAdminV248(){return typeof geIsAdmin==='function'&&geIsAdmin()}
function geLinesV248(v){return String(v||'').split(/\r?\n|,/).map(x=>x.trim()).filter(Boolean)}

function geApplyStandardContentV248(){
  const sc=geEnsureStandardContentV248();
  const hero=document.querySelector('main.main>.hero');if(hero){hero.querySelector('h2').textContent=sc.hero.title;hero.querySelector('p').textContent=sc.hero.description;}
  ['people','process','premises','skypriority'].forEach(k=>{
    const btn=document.querySelector(`[data-standard-panel="${k}"]`),cfg=sc.selectors[k];if(!btn||!cfg)return;
    btn.querySelector('h3').textContent=cfg.title;const ul=btn.querySelector('ul');if(ul)ul.innerHTML=(cfg.points||[]).map(x=>`<li>${geEsc(x)}</li>`).join('');const a=btn.querySelector('.selector-action');if(a)a.textContent=cfg.action||'';
  });
  const p=sc.mainSections.process, ph=document.querySelector('#standardProcessPanel .page-header');if(ph){ph.querySelector('h2').textContent=p.title;ph.querySelector('p').textContent=p.description}
  const prem=sc.mainSections.premises,pc=document.querySelector('#standardPremisesPanel .standard-coming-panel');if(pc){pc.querySelector('h3').textContent=prem.title;pc.querySelector('p').textContent=prem.description}
  const sky=sc.mainSections.skypriority,st=document.querySelector('#standardSkypriorityPanel>.title');if(st){st.querySelector('h3').textContent=sky.title;const sub=st.querySelector('.section-subtitle');if(sub)sub.textContent=sky.description}
  const ppl=sc.mainSections.people,pt=document.querySelector('.personnel-readiness-title');if(pt){pt.querySelector('h3').textContent=ppl.title;const sub=pt.querySelector('.section-subtitle');if(sub)sub.textContent=ppl.description}
  geRenderExtraStandardSectionsV248();geRenderStandardAdminButtonsV248();
}

function geEnsureStandardModalV248(){
  if(document.getElementById('standardContentModalV248')){gePromoteModalViewportV248(document.getElementById('standardContentModalV248'));gePromoteModalViewportV248(document.getElementById('announcementEditModalV248'));return}
  document.body.insertAdjacentHTML('beforeend',`<div id="standardContentModalV248" class="modal-backdrop"><div class="modal-card standard-content-modal-v248"><button class="modal-x" onclick="geCloseStandardContentModalV248()">×</button><h2 id="standardContentModalTitleV248">Kelola Konten</h2><input type="hidden" id="standardContentModeV248"><input type="hidden" id="standardContentKeyV248"><div id="standardContentFieldsV248" class="formgrid"></div><div class="modal-actions sticky-actions"><button class="btn" onclick="geSaveStandardContentV248()">Simpan</button><button class="btn secondary" onclick="geCloseStandardContentModalV248()">Batal</button></div></div></div>
  <div id="announcementEditModalV248" class="modal-backdrop"><div class="modal-card standard-content-modal-v248"><button class="modal-x" onclick="geCloseAnnouncementEditV248()">×</button><h2 id="announcementEditTitleV248">Tambah Announcement</h2><input type="hidden" id="announcementEditIdV248"><div class="formgrid"><label>Judul<input id="annTitleV248"></label><label>Touch Point<input id="annTouchpointV248"></label><label>Jenis / Type<input id="annTypeV248"></label><label>Aircraft Type<textarea id="annVariantsV248" rows="2" placeholder="Narrow Body\nWide Body"></textarea></label><label>Bahasa<textarea id="annLanguagesV248" rows="2" placeholder="Bahasa Indonesia\nEnglish"></textarea></label><label class="span2">Ringkasan / Isi<textarea id="annSummaryV248" rows="4"></textarea></label><label class="span2">Poin / Urutan Announcement<textarea id="annGroupsV248" rows="7" placeholder="Satu poin per baris"></textarea></label></div><div class="modal-actions sticky-actions"><button class="btn" onclick="geSaveAnnouncementV248()">Simpan Announcement</button><button class="btn secondary" onclick="geCloseAnnouncementEditV248()">Batal</button></div></div></div>`);
  gePromoteModalViewportV248(document.getElementById('standardContentModalV248'));
  gePromoteModalViewportV248(document.getElementById('announcementEditModalV248'));
}
function geCloseStandardContentModalV248(){document.getElementById('standardContentModalV248')?.classList.remove('show')}
function geOpenStandardContentV248(mode,key){
  if(!geIsStandardAdminV248())return;geEnsureStandardModalV248();const sc=geEnsureStandardContentV248();
  standardContentModeV248.value=mode;standardContentKeyV248.value=key||'';let title='Edit Konten',fields='';
  if(mode==='hero'){const x=sc.hero;title='Edit Judul Halaman';fields=`<label class="span2">Judul<input id="scTitleV248" value="${geEsc(x.title)}"></label><label class="span2">Penjelasan<textarea id="scDescriptionV248" rows="4">${geEsc(x.description)}</textarea></label>`}
  if(mode==='selector'){const x=sc.selectors[key];title=`Edit ${x.title}`;fields=`<label>Judul<input id="scTitleV248" value="${geEsc(x.title)}"></label><label>Action Text<input id="scActionV248" value="${geEsc(x.action||'')}"></label><label class="span2">Poin (satu per baris)<textarea id="scPointsV248" rows="6">${geEsc((x.points||[]).join('\n'))}</textarea></label>`}
  if(mode==='main'){const x=sc.mainSections[key];title=`Edit Sub Judul ${key}`;fields=`<label class="span2">Sub Judul<input id="scTitleV248" value="${geEsc(x.title)}"></label><label class="span2">Penjelasan<textarea id="scDescriptionV248" rows="5">${geEsc(x.description||'')}</textarea></label>`}
  if(mode==='extra'){const x=sc.extraSections.find(v=>String(v.id)===String(key))||{panel:key,title:'',description:'',points:[]};title=x.id?'Edit Sub Judul':'Tambah Sub Judul';standardContentKeyV248.value=x.id||key;fields=`<label>Bagian<select id="scPanelV248">${['people','process','premises','skypriority'].map(v=>`<option value="${v}" ${x.panel===v?'selected':''}>${v.charAt(0).toUpperCase()+v.slice(1)}</option>`).join('')}</select></label><label>Sub Judul<input id="scTitleV248" value="${geEsc(x.title||'')}"></label><label class="span2">Penjelasan<textarea id="scDescriptionV248" rows="4">${geEsc(x.description||'')}</textarea></label><label class="span2">Poin (opsional, satu per baris)<textarea id="scPointsV248" rows="6">${geEsc((x.points||[]).join('\n'))}</textarea></label>`}
  standardContentModalTitleV248.textContent=title;standardContentFieldsV248.innerHTML=fields;standardContentModalV248.classList.add('show');
}
function geSaveStandardContentV248(){
  if(!geIsStandardAdminV248())return;const sc=geEnsureStandardContentV248(),mode=standardContentModeV248.value,key=standardContentKeyV248.value;
  const title=document.getElementById('scTitleV248')?.value.trim()||'',desc=document.getElementById('scDescriptionV248')?.value.trim()||'';
  if(mode==='hero'){sc.hero={title,description:desc}}
  else if(mode==='selector'){sc.selectors[key]={...sc.selectors[key],title,action:document.getElementById('scActionV248')?.value.trim()||'',points:geLinesV248(document.getElementById('scPointsV248')?.value)}}
  else if(mode==='main'){sc.mainSections[key]={title,description:desc}}
  else if(mode==='extra'){const panel=document.getElementById('scPanelV248')?.value||key,points=geLinesV248(document.getElementById('scPointsV248')?.value);const old=sc.extraSections.find(v=>String(v.id)===String(key));if(old)Object.assign(old,{panel,title,description:desc,points});else sc.extraSections.push({id:Date.now(),panel,title,description:desc,points})}
  save();geCloseStandardContentModalV248();geApplyStandardContentV248();renderAnnouncementLibraryV246();
}
async function geDeleteExtraStandardSectionV248(id){if(!geIsStandardAdminV248())return;const ok=typeof geConfirmDeleteV234==='function'?await geConfirmDeleteV234({title:'Hapus Sub Judul?',item:'Konten Standar Layanan',message:'Sub judul dan penjelasannya akan dihapus.'}):confirm('Hapus sub judul?');if(!ok)return;const sc=geEnsureStandardContentV248();sc.extraSections=sc.extraSections.filter(x=>String(x.id)!==String(id));save();geApplyStandardContentV248()}

function geRenderExtraStandardSectionsV248(){
  const sc=geEnsureStandardContentV248();['people','process','premises','skypriority'].forEach(panel=>{const host=document.getElementById('standard'+panel.charAt(0).toUpperCase()+panel.slice(1)+'Panel');if(!host)return;let box=host.querySelector('.standard-extra-sections-v248');if(!box){box=document.createElement('div');box.className='standard-extra-sections-v248';host.appendChild(box)}const rows=sc.extraSections.filter(x=>x.panel===panel);box.innerHTML=rows.map(x=>`<article class="card standard-extra-card-v248"><div><span class="eyebrow">${panel.toUpperCase()} STANDARD</span><h3>${geEsc(x.title)}</h3><p>${geEsc(x.description||'')}</p>${x.points?.length?`<ul>${x.points.map(p=>`<li>${geEsc(p)}</li>`).join('')}</ul>`:''}</div>${geIsStandardAdminV248()?`<div class="standard-inline-actions-v248"><button class="btn secondary compact-btn" onclick="geOpenStandardContentV248('extra','${x.id}')">Edit</button><button class="btn danger compact-btn" onclick="geDeleteExtraStandardSectionV248('${x.id}')">Hapus</button></div>`:''}</article>`).join('')});
}
function geRenderStandardAdminButtonsV248(){
  document.querySelectorAll('.standard-admin-toolbar-v248,.standard-card-edit-v248').forEach(x=>x.remove());if(!geIsStandardAdminV248())return;
  const hero=document.querySelector('main.main>.hero');if(hero){hero.insertAdjacentHTML('beforeend','<button class="btn secondary compact-btn standard-admin-toolbar-v248" onclick="geOpenStandardContentV248(\'hero\',\'hero\')">Edit Teks Halaman</button>')}
  ['people','process','premises','skypriority'].forEach(k=>{const btn=document.querySelector(`[data-standard-panel="${k}"]`);if(btn)btn.insertAdjacentHTML('beforeend',`<span class="standard-card-edit-v248" onclick="event.stopPropagation();geOpenStandardContentV248('selector','${k}')">Edit</span>`);const panel=document.getElementById('standard'+k.charAt(0).toUpperCase()+k.slice(1)+'Panel');if(panel){const anchor=panel.querySelector('.page-header,.title,.standard-coming-panel,.personnel-readiness-title');if(anchor)anchor.insertAdjacentHTML('beforeend',`<div class="standard-admin-toolbar-v248"><button class="btn secondary compact-btn" onclick="geOpenStandardContentV248('main','${k}')">Edit Sub Judul</button><button class="btn secondary compact-btn" onclick="geOpenStandardContentV248('extra','${k}')">Tambah Sub Judul</button>${k==='process'?'<button class="btn compact-btn" onclick="geOpenAnnouncementEditV248()">Tambah Announcement</button>':''}</div>`)} });
}

/* ---------- Announcement CRUD ---------- */
geAnnouncementLibraryV246=[];
function geAnnouncementRowsV248(){return geEnsureStandardContentV248().announcements||[]}
renderAnnouncementLibraryV246=function(){
  const box=document.getElementById('announcementLibraryV246');if(!box)return;geAnnouncementLibraryV246=geAnnouncementRowsV248();
  const q=(document.getElementById('announcementSearchV246')?.value||'').toLowerCase(),type=document.getElementById('announcementTypeV246')?.value||'',aircraft=document.getElementById('announcementAircraftV246')?.value||'',lang=document.getElementById('announcementLanguageV246')?.value||'';
  const rows=geAnnouncementLibraryV246.filter(x=>(!q||`${x.title} ${x.touchpoint} ${x.type} ${x.summary}`.toLowerCase().includes(q))&&(!type||x.touchpoint===type)&&(!aircraft||(x.variants||[]).includes(aircraft))&&(!lang||(x.languages||[]).includes(lang)));
  box.innerHTML=rows.map((x,i)=>`<article class="announcement-card-v246"><div class="announcement-no-v246">${String(i+1).padStart(2,'0')}</div><div><span class="eyebrow">${geEsc(x.touchpoint)} • ${geEsc(x.type)}</span><h3>${geEsc(x.title)}</h3><p>${geEsc(x.summary)}</p><div class="announcement-tags-v246">${(x.variants||[]).map(v=>`<span>${geEsc(v)}</span>`).join('')}${(x.languages||[]).map(v=>`<span>${geEsc(v)}</span>`).join('')}</div><div class="announcement-actions-v248"><button class="btn secondary compact-btn" onclick="openAnnouncementReferenceV246('${x.id}')">Buka Announcement</button>${geIsStandardAdminV248()?`<button class="btn secondary compact-btn" onclick="geOpenAnnouncementEditV248('${x.id}')">Update</button><button class="btn danger compact-btn" onclick="geDeleteAnnouncementV248('${x.id}')">Hapus</button>`:''}</div></div></article>`).join('');
};
openAnnouncementReferenceV246=function(id){const x=geAnnouncementRowsV248().find(v=>String(v.id)===String(id));if(!x)return;document.getElementById('announcementReferenceTitleV246').textContent=x.title;document.getElementById('announcementReferenceBodyV246').innerHTML=`<div class="announcement-reference-head-v246"><span>${geEsc(x.touchpoint)}</span><span>${geEsc(x.type)}</span></div><p>${geEsc(x.summary)}</p><h4>Urutan / Struktur Announcement</h4><div class="announcement-sequence-v246">${(x.groups||[]).map((g,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b><span>${geEsc(g)}</span></div>`).join('')}</div>`;document.getElementById('announcementReferenceModalV246').classList.add('show')};
function geOpenAnnouncementEditV248(id=null){if(!geIsStandardAdminV248())return;geEnsureStandardModalV248();const x=id?geAnnouncementRowsV248().find(v=>String(v.id)===String(id)):null;announcementEditTitleV248.textContent=x?'Update Announcement':'Tambah Announcement';announcementEditIdV248.value=x?.id||'';annTitleV248.value=x?.title||'';annTouchpointV248.value=x?.touchpoint||'';annTypeV248.value=x?.type||'';annVariantsV248.value=(x?.variants||[]).join('\n');annLanguagesV248.value=(x?.languages||[]).join('\n');annSummaryV248.value=x?.summary||'';annGroupsV248.value=(x?.groups||[]).join('\n');announcementEditModalV248.classList.add('show')}
function geCloseAnnouncementEditV248(){document.getElementById('announcementEditModalV248')?.classList.remove('show')}
function geSaveAnnouncementV248(){if(!geIsStandardAdminV248())return;const sc=geEnsureStandardContentV248(),id=announcementEditIdV248.value,title=annTitleV248.value.trim();if(!title)return;const obj={id:id||String(Date.now()),sectionId:'process-main',title,touchpoint:annTouchpointV248.value.trim(),type:annTypeV248.value.trim(),variants:geLinesV248(annVariantsV248.value),languages:geLinesV248(annLanguagesV248.value),summary:annSummaryV248.value.trim(),groups:String(annGroupsV248.value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean)};const old=sc.announcements.find(x=>String(x.id)===String(id));if(old)Object.assign(old,obj);else sc.announcements.push(obj);save();geCloseAnnouncementEditV248();renderAnnouncementLibraryV246()}
async function geDeleteAnnouncementV248(id){if(!geIsStandardAdminV248())return;const ok=typeof geConfirmDeleteV234==='function'?await geConfirmDeleteV234({title:'Hapus Announcement?',item:geAnnouncementRowsV248().find(x=>String(x.id)===String(id))?.title||'Announcement',message:'Announcement akan dihapus dari Standard Reference.'}):confirm('Hapus announcement?');if(!ok)return;const sc=geEnsureStandardContentV248();sc.announcements=sc.announcements.filter(x=>String(x.id)!==String(id));save();renderAnnouncementLibraryV246()}

window.addEventListener('DOMContentLoaded',()=>{geEnsureStandardContentV248();geEnsureStandardModalV248();geApplyStandardContentV248();renderAnnouncementLibraryV246()});

/* ========================= V2.50 Portal Management Foundation ========================= */
function pmState(){const x=data.portalManagerR2;return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}
function pmWrite(x){data.portalManagerR2={...(x&&typeof x==='object'?x:{})};save();}
function pmActivity(msg){const e=document.getElementById('pmActivity');if(e)e.textContent=msg;const s=document.getElementById('portalPublishState');if(s)s.textContent='Draft changed';}
function pmSaveDraft(area){const x=pmState();x.updatedAt=new Date().toISOString();x.area=area;x.page=document.getElementById('pmPage')?.value;x.title=document.getElementById('pmTitle')?.value;x.description=document.getElementById('pmDescription')?.value;x.chart=document.getElementById('pmChart')?.value;x.status='Draft';pmWrite(x);pmActivity(area+' disimpan sebagai draft.');}
function pmPreview(){const x=pmState();pmActivity('Preview siap • '+(x.title||'perubahan portal')+'. Pada production preview akan dibuka pada staging route sebelum Publish.');}
function pmPublish(){const x=pmState();x.status='Published';x.publishedAt=new Date().toISOString();pmWrite(x);const s=document.getElementById('portalPublishState');if(s)s.textContent='Published';pmActivity('Perubahan ditandai Published pada prototype V2.50.');if(s)s.textContent='Published';}
function pmNewPage(){document.getElementById('pmTitle').value='';document.getElementById('pmDescription').value='';pmActivity('Draft page baru dibuat. Pilih layout/component sebelum Publish.');}
function pmAddMenu(){const l=document.getElementById('pmMenuList');if(!l)return;const d=document.createElement('div');d.className='portal-menu-item';d.innerHTML='<span class="portal-drag">↕</span><b>Menu Baru</b><small>Draft</small><button class="btn secondary">Kelola</button>';l.appendChild(d);pmActivity('Menu baru ditambahkan ke draft layout.');}
function pmRegisterAssets(){const f=[...(document.getElementById('pmAsset')?.files||[])];if(!f.length){pmActivity('Pilih asset terlebih dahulu.');return}const x=pmState();x.assets=(x.assets||[]).concat(f.map(a=>({name:a.name,size:a.size,type:a.type,registeredAt:new Date().toISOString()})));pmWrite(x);pmActivity(f.length+' asset diregister sebagai metadata prototype.');}
function pmAssetList(){const a=pmState().assets||[];pmActivity(a.length?('Asset Library prototype: '+a.map(x=>x.name).join(', ')):'Asset Library masih kosong.');}

/* ==============================================================
   V2.51 — Garuda Light Refinement, editable visual content,
   compact initiative grid, calendar/project tracking
   ============================================================== */
function geV251Admin(){return typeof geIsAdmin==='function'&&geIsAdmin()}
function geV251Ensure(){
 data.v251 ||= {};
 data.v251.visuals ||= {
  lounge:{title:'Lounge',caption:'Referensi ambience dan premises Garuda Indonesia Lounge.',image:'assets/lounge-garuda.webp'},
  checkin:{title:'Check-in Counter',caption:'Referensi area check-in dan passenger processing.',image:'assets/checkin-garuda.jpg'},
  boarding:{title:'Boarding Gate',caption:'Referensi boarding area dan passenger flow.',image:'assets/boarding-garuda.jpg'}
 };
 data.v251.touchpoints ||= {};
 data.v251.events ||= [];
 data.v251.homeSections ||= {scope:true,progress:true,documents:true};
 return data.v251;
}
function geV251ReadImage(file,cb){if(!file)return;const r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(file)}
function geV251EditVisual(key){if(!geV251Admin())return;const s=geV251Ensure().visuals[key];geV251OpenEditor('Edit Referensi Visual',s,(v)=>{Object.assign(s,v);save();geV251RenderTouchpointPage()})}
function geV251OpenEditor(title,obj,onSave){
 let m=document.getElementById('geV251Editor');if(!m){document.body.insertAdjacentHTML('beforeend',`<div id="geV251Editor" class="modal-backdrop"><div class="modal-card"><button class="modal-x" onclick="geV251CloseEditor()">×</button><h2 id="geV251EditorTitle"></h2><div class="formgrid"><label>Judul<input id="geV251EdTitle"></label><label class="span2">Keterangan<textarea id="geV251EdCaption" rows="4"></textarea></label><label class="span2">Gambar<input id="geV251EdFile" type="file" accept="image/*"></label></div><div class="modal-actions"><button class="btn" id="geV251EdSave">Simpan</button><button class="btn secondary" onclick="geV251CloseEditor()">Batal</button></div></div></div>`);m=document.getElementById('geV251Editor')}
 geV251EditorTitle.textContent=title;geV251EdTitle.value=obj.title||'';geV251EdCaption.value=obj.caption||'';geV251EdFile.value='';geV251EdSave.onclick=()=>{const done=(img)=>{onSave({title:geV251EdTitle.value.trim(),caption:geV251EdCaption.value.trim(),image:img||obj.image||''});geV251CloseEditor()};const f=geV251EdFile.files[0];f?geV251ReadImage(f,done):done(obj.image)};m.classList.add('show')
}
function geV251CloseEditor(){document.getElementById('geV251Editor')?.classList.remove('show')}
const GE_V251_TP={
 'Pre-Journey':['Call Center','Garuda Sales Office','Airport Ticketing Office','Airport Transfer'],
 'Pre-Flight':['Check-in Counter','Security Check Point','Lounge','Buggy Car','Boarding Gate'],
 'Post-Flight':['Transfer Desk','Arrival Hall','Baggage Claim'],
 'Post-Journey':['Airport Transfer','Post Claim','Post Survey']
};
function geV251TPKey(j,n){return `${j}::${n}`}
function geV251TPData(j,n){const s=geV251Ensure(),k=geV251TPKey(j,n);s.touchpoints[k] ||= {title:n,caption:'Area description • Airport • List Inisiatif',images:[]};return s.touchpoints[k]}
function geV251EditTP(j,n){if(!geV251Admin())return;const x=geV251TPData(j,n);geV251OpenEditor(`Edit ${n}`,{title:x.title,caption:x.caption,image:x.images[0]?.src||''},v=>{x.title=v.title||n;x.caption=v.caption;if(v.image){if(x.images.length)x.images[0]={src:v.image,caption:v.caption};else x.images.push({src:v.image,caption:v.caption})}save();geV251RenderTouchpointPage()})}
let geV251Gallery={items:[],i:0,t:null};
function geV251OpenGallery(j,n){const x=geV251TPData(j,n);geV251Gallery.items=x.images.length?x.images:[{src:'',caption:x.caption}];geV251Gallery.i=0;let m=document.getElementById('geV251Gallery');if(!m){document.body.insertAdjacentHTML('beforeend',`<div id="geV251Gallery" class="modal-backdrop"><div class="modal-card ge-gallery-v251"><button class="modal-x" onclick="geV251CloseGallery()">×</button><h2 id="geV251GalleryTitle"></h2><div id="geV251GalleryMedia"></div><div class="ge-gallery-controls-v251"><button class="btn secondary compact-btn" onclick="geV251GalleryMove(-1)">←</button><span id="geV251GalleryDots" class="ge-gallery-dots-v251"></span><button class="btn secondary compact-btn" onclick="geV251GalleryMove(1)">→</button></div><p id="geV251GalleryCaption" class="ge-gallery-caption-v251"></p></div></div>`);m=document.getElementById('geV251Gallery')}geV251GalleryTitle.textContent=x.title;geV251GalleryDraw();m.classList.add('show');clearInterval(geV251Gallery.t);if(geV251Gallery.items.length>1)geV251Gallery.t=setInterval(()=>geV251GalleryMove(1),5000)}
function geV251GalleryDraw(){const a=geV251Gallery.items,i=geV251Gallery.i,x=a[i];geV251GalleryMedia.innerHTML=x.src?`<img class="ge-gallery-image-v251" src="${x.src}" alt="">`:`<div class="ge-gallery-image-v251" style="display:grid;place-items:center;color:#7b939d">Belum ada foto</div>`;geV251GalleryCaption.textContent=x.caption||'';geV251GalleryDots.textContent=a.map((_,k)=>k===i?'●':'○').join(' ')}
function geV251GalleryMove(d){geV251Gallery.i=(geV251Gallery.i+d+geV251Gallery.items.length)%geV251Gallery.items.length;geV251GalleryDraw()}
function geV251CloseGallery(){clearInterval(geV251Gallery.t);document.getElementById('geV251Gallery')?.classList.remove('show')}
function geV251RenderTouchpointPage(){
 if(!location.pathname.endsWith('touchpoint.html'))return;const s=geV251Ensure(),showcase=document.querySelector('.visual-showcase');if(showcase){showcase.innerHTML=['lounge','checkin','boarding'].map(k=>{const x=s.visuals[k];return `<div class="visual-card">${geV251Admin()?`<button class="ge-pencil-v251" onclick="geV251EditVisual('${k}')">✎</button>`:''}<img src="${x.image}" alt="${geEsc(x.title)}"><div class="visual-overlay"><h3>${geEsc(x.title)}</h3><p>${geEsc(x.caption)}</p></div></div>`}).join('')}
 const cards=[...document.querySelectorAll('.main>.card')].filter(c=>c.querySelector('.grid3'));cards.forEach((c,idx)=>{const j=Object.keys(GE_V251_TP)[idx];if(!j)return;const g=c.querySelector('.grid3');g.innerHTML=GE_V251_TP[j].map(n=>{const x=geV251TPData(j,n),img=x.images[0]?.src;return `<div class="card touch touch-v251" onclick="geV251OpenGallery('${j}','${n.replaceAll("'","\\'")}')">${geV251Admin()?`<button class="ge-pencil-v251" onclick="event.stopPropagation();geV251EditTP('${j}','${n.replaceAll("'","\\'")}')">✎</button>`:''}<div class="icon">${img?`<img src="${img}" alt="">`:'✈️'}</div><b>${geEsc(x.title)}</b><p>${geEsc(x.caption)}</p></div>`}).join('')})
}
/* V2.51 initiative card: remove duplicate horizontal progress and use 3-up grid */
function geInitiativeCardV251(x,i){const status=geInitiativeStatusV246(x),real=Math.max(0,Math.min(100,Number(x.real||0))),due=geDueLabelV224(x),state=geDueStateV224(x);return `<article class="initiative-card-v247 ${state}"><aside class="initiative-card-side-v247"><strong>${String(i+1).padStart(2,'0')}</strong><div class="initiative-ring-v247" style="--p:${real}"><span>${real}%</span></div><span class="initiative-status-v247 ${String(status).toLowerCase()}">${status}</span></aside><div class="initiative-card-main-v247"><h3>${geEsc(x.name||'-')}</h3><div class="initiative-meta-v247"><div><span>PIC</span><b>${geEsc(x.pic||'-')}</b></div><div><span>Due Date</span><b>${due}</b></div><div><span>Touch Point</span><b>${geEsc(x.tp||'-')}</b></div><div><span>Station</span><b>${geEsc(x.airport||'-')}</b></div></div><div class="initiative-card-actions-v247">${geInitiativeManageButtonsV224(x)}</div></div></article>`}
renderInitiatives=function(){refreshInitiativeFilters();const rows=currentInitiativeRows().filter(geInitiativeScopedV224);const t=document.getElementById('initRows');if(t)t.innerHTML=rows.length?rows.map(geInitiativeCardV251).join(''):'<div class="initiative-empty-v246">Belum ada inisiatif pada filter ini.</div>';renderInitiativeCharts(rows)};
/* Calendar: initiative due dates + manual events */
let geV251CalDate=new Date();
function geV251AllEvents(){const manual=geV251Ensure().events||[],auto=(data.initiatives||[]).filter(x=>x.dueDate||x.due).map(x=>({id:`init-${x.id}`,title:x.name||'Initiative Due Date',date:x.dueDate||x.due,type:'due',airport:x.airport||'',source:'Initiative'}));return [...manual,...auto]}
function geV251RenderCalendar(){const box=document.getElementById('geCalendarV251');if(!box)return;const y=geV251CalDate.getFullYear(),m=geV251CalDate.getMonth(),first=new Date(y,m,1),start=new Date(y,m,1-first.getDay()),events=geV251AllEvents();geCalendarTitleV251.textContent=new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric'}).format(first);let html=['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(x=>`<div class="cal-head-v251">${x}</div>`).join('');for(let d=0;d<42;d++){const dt=new Date(start);dt.setDate(start.getDate()+d);const iso=dt.toISOString().slice(0,10),rows=events.filter(e=>String(e.date||'').slice(0,10)===iso),muted=dt.getMonth()!==m?' muted':'';html+=`<div class="cal-day-v251${muted}"><div class="cal-num-v251">${dt.getDate()}</div>${rows.slice(0,4).map(e=>`<span class="cal-event-v251 ${e.type||''}" title="${geEsc(e.title)}">${geEsc(e.title)}</span>`).join('')}${rows.length>4?`<small>+${rows.length-4} lainnya</small>`:''}</div>`}box.innerHTML=html;const monthEvents=events.filter(e=>{const d=new Date(e.date);return d.getFullYear()===y&&d.getMonth()===m});geCalendarSummaryV251.innerHTML=`<span>${monthEvents.length} agenda bulan ini</span><span>${monthEvents.filter(e=>e.source==='Initiative').length} dari inisiatif</span><span>${monthEvents.filter(e=>e.source!=='Initiative').length} kegiatan manual</span>`}
function geV251CalMove(n){geV251CalDate=new Date(geV251CalDate.getFullYear(),geV251CalDate.getMonth()+n,1);geV251RenderCalendar()}
function geV251OpenEvent(){if(!geV251Admin())return;geV251EventTitle.value='';geV251EventDate.value=new Date().toISOString().slice(0,10);geV251EventTime.value='';geV251EventAirport.value='';geV251EventCategory.value='Meeting';geV251EventRemark.value='';geV251EventModal.classList.add('show')}
function geV251SaveEvent(){const title=geV251EventTitle.value.trim(),date=geV251EventDate.value;if(!title||!date)return alert('Judul dan tanggal wajib diisi.');geV251Ensure().events.push({id:Date.now(),title,date,time:geV251EventTime.value,airport:geV251EventAirport.value.trim(),category:geV251EventCategory.value,remark:geV251EventRemark.value.trim(),source:'Manual'});save();geV251EventModal.classList.remove('show');geV251RenderCalendar()}
function geV251InitCalendar(){if(!document.getElementById('geCalendarV251'))return;geV251RenderCalendar();const today=new Date().toISOString().slice(0,10),due=geV251AllEvents().filter(e=>String(e.date).slice(0,10)===today);if(due.length&&'Notification'in window&&Notification.permission==='granted')new Notification('Ground Experience Calendar',{body:`${due.length} agenda jatuh tempo hari ini.`})}
window.addEventListener('DOMContentLoaded',()=>{geV251Ensure();geV251RenderTouchpointPage();geV251InitCalendar();});


/* ================= V2.51 Consolidated R1 — Touch Point Multi Photo ================= */
const GE_V251C1_URL_CACHE=new Map();
let GE_V251C1_TP_EDIT={journey:'',name:'',existing:[],newItems:[]};

async function geV251C1ImageURL(item){
  if(!item)return'';
  if(item.src)return item.src;
  if(item.fileKey){
    if(GE_V251C1_URL_CACHE.has(item.fileKey))return GE_V251C1_URL_CACHE.get(item.fileKey);
    try{const f=await GEFiles.get(item.fileKey);if(f){const u=URL.createObjectURL(f);GE_V251C1_URL_CACHE.set(item.fileKey,u);return u}}catch(e){}
  }
  return'';
}
async function geV251C1HydrateImage(img,item){const u=await geV251C1ImageURL(item);if(u&&img?.isConnected)img.src=u}

function geV251C1EnsureTPModal(){
  let m=document.getElementById('geV251C1TPEditor');if(m)return m;
  document.body.insertAdjacentHTML('beforeend',`<div id="geV251C1TPEditor" class="modal-backdrop">
    <div class="modal-card ge-tp-editor-v251c1">
      <button class="modal-x" onclick="geV251C1CloseTPEditor()">×</button>
      <h2 id="geV251C1TPEditTitle">Edit Touch Point</h2>
      <div class="formgrid">
        <label>Judul<input id="geV251C1TPTitle"></label>
        <label class="span2">Keterangan Umum<textarea id="geV251C1TPCaption" rows="3"></textarea></label>
        <label class="span2">Tambah Foto <small class="field-help-v251c1">Bisa memilih beberapa foto sekaligus.</small>
          <input id="geV251C1TPFiles" type="file" accept="image/*" multiple>
        </label>
      </div>
      <div class="ge-tp-photo-head-v251c1"><b>Gallery Touch Point</b><span>Caption dapat berbeda untuk setiap foto.</span></div>
      <div id="geV251C1TPPhotoList" class="ge-tp-photo-list-v251c1"></div>
      <div class="modal-actions sticky-actions"><button class="btn" onclick="geV251C1SaveTP()">Simpan</button><button class="btn secondary" onclick="geV251C1CloseTPEditor()">Batal</button></div>
    </div></div>`);
  m=document.getElementById('geV251C1TPEditor');
  document.getElementById('geV251C1TPFiles').addEventListener('change',e=>{
    const base=document.getElementById('geV251C1TPCaption').value.trim();
    [...e.target.files].forEach(file=>GE_V251C1_TP_EDIT.newItems.push({file,preview:URL.createObjectURL(file),caption:base||file.name.replace(/\.[^.]+$/,'')}));
    e.target.value='';geV251C1RenderTPPhotoList();
  });
  return m;
}
function geV251EditTP(j,n){
  if(!geV251Admin())return;
  const x=geV251TPData(j,n);geV251C1EnsureTPModal();
  GE_V251C1_TP_EDIT={journey:j,name:n,existing:(x.images||[]).map(v=>({...v})),newItems:[]};
  geV251C1TPEditTitle.textContent=`Edit ${x.title||n}`;geV251C1TPTitle.value=x.title||n;geV251C1TPCaption.value=x.caption||'';
  geV251C1RenderTPPhotoList();document.getElementById('geV251C1TPEditor').classList.add('show');
}
function geV251C1CloseTPEditor(){document.getElementById('geV251C1TPEditor')?.classList.remove('show')}
function geV251C1RemoveTPPhoto(kind,index){
  if(kind==='existing')GE_V251C1_TP_EDIT.existing.splice(index,1);
  else{const x=GE_V251C1_TP_EDIT.newItems[index];if(x?.preview)URL.revokeObjectURL(x.preview);GE_V251C1_TP_EDIT.newItems.splice(index,1)}
  geV251C1RenderTPPhotoList();
}
function geV251C1RenderTPPhotoList(){
  const box=document.getElementById('geV251C1TPPhotoList');if(!box)return;
  const ex=GE_V251C1_TP_EDIT.existing, nw=GE_V251C1_TP_EDIT.newItems;
  const rows=[...ex.map((x,i)=>({kind:'existing',i,x})),...nw.map((x,i)=>({kind:'new',i,x}))];
  box.innerHTML=rows.length?rows.map(r=>`<div class="ge-tp-photo-item-v251c1">
    <div class="ge-tp-photo-preview-v251c1">${r.kind==='new'?`<img src="${r.x.preview}" alt="">`:`<img data-tp-existing="${r.i}" alt="">`}</div>
    <label>Keterangan Foto<textarea rows="2" data-tp-caption="${r.kind}:${r.i}">${geEsc(r.x.caption||'')}</textarea></label>
    <button class="btn danger compact-btn" type="button" onclick="geV251C1RemoveTPPhoto('${r.kind}',${r.i})">Hapus</button>
  </div>`).join(''):'<div class="planning-empty">Belum ada foto. Pilih beberapa file pada field Tambah Foto.</div>';
  box.querySelectorAll('[data-tp-existing]').forEach(async img=>{const i=Number(img.dataset.tpExisting),item=GE_V251C1_TP_EDIT.existing[i];await geV251C1HydrateImage(img,item)});
}
async function geV251C1SaveTP(){
  const st=GE_V251C1_TP_EDIT,x=geV251TPData(st.journey,st.name);
  document.querySelectorAll('#geV251C1TPPhotoList [data-tp-caption]').forEach(el=>{const [kind,idxS]=el.dataset.tpCaption.split(':'),idx=Number(idxS);if(kind==='existing'&&st.existing[idx])st.existing[idx].caption=el.value.trim();if(kind==='new'&&st.newItems[idx])st.newItems[idx].caption=el.value.trim()});
  const uploaded=[];
  for(let i=0;i<st.newItems.length;i++){
    const n=st.newItems[i],key=`tp_${Date.now()}_${i}_${Math.random().toString(36).slice(2,8)}`;
    try{await GEFiles.put(key,n.file);uploaded.push({fileKey:key,name:n.file.name,caption:n.caption||''})}catch(e){console.error(e)}
    if(n.preview)URL.revokeObjectURL(n.preview);
  }
  x.title=geV251C1TPTitle.value.trim()||st.name;x.caption=geV251C1TPCaption.value.trim();x.images=[...st.existing,...uploaded];
  save();geV251C1CloseTPEditor();geV251RenderTouchpointPage();
}

/* Gallery keeps each image's natural orientation/aspect ratio. */
async function geV251OpenGallery(j,n){
  const x=geV251TPData(j,n);geV251Gallery.items=x.images.length?x.images:[{src:'',caption:x.caption}];geV251Gallery.i=0;
  let m=document.getElementById('geV251Gallery');if(!m){document.body.insertAdjacentHTML('beforeend',`<div id="geV251Gallery" class="modal-backdrop"><div class="modal-card ge-gallery-v251 ge-gallery-natural-v251c1"><button class="modal-x" onclick="geV251CloseGallery()">×</button><h2 id="geV251GalleryTitle"></h2><div id="geV251GalleryMedia" class="ge-gallery-media-v251c1"></div><div class="ge-gallery-controls-v251"><button class="btn secondary compact-btn" onclick="geV251GalleryMove(-1)">←</button><span id="geV251GalleryDots" class="ge-gallery-dots-v251"></span><button class="btn secondary compact-btn" onclick="geV251GalleryMove(1)">→</button></div><p id="geV251GalleryCaption" class="ge-gallery-caption-v251"></p></div></div>`);m=document.getElementById('geV251Gallery')}
  geV251GalleryTitle.textContent=x.title;await geV251GalleryDraw();m.classList.add('show');clearInterval(geV251Gallery.t);if(geV251Gallery.items.length>1)geV251Gallery.t=setInterval(()=>geV251GalleryMove(1),5000);
}
async function geV251GalleryDraw(){
  const a=geV251Gallery.items,i=geV251Gallery.i,x=a[i],media=document.getElementById('geV251GalleryMedia');if(!media)return;
  const u=await geV251C1ImageURL(x);
  media.innerHTML=u?`<img class="ge-gallery-image-v251" src="${u}" alt="">`:`<div class="ge-gallery-empty-v251c1">Belum ada foto</div>`;
  geV251GalleryCaption.textContent=x.caption||'';geV251GalleryDots.textContent=a.map((_,k)=>k===i?'●':'○').join(' ');
}
function geV251GalleryMove(d){if(!geV251Gallery.items.length)return;geV251Gallery.i=(geV251Gallery.i+d+geV251Gallery.items.length)%geV251Gallery.items.length;geV251GalleryDraw()}

/* Render cover from either legacy data URL or IndexedDB file. */
function geV251RenderTouchpointPage(){
 if(!location.pathname.endsWith('touchpoint.html'))return;const s=geV251Ensure(),showcase=document.querySelector('.visual-showcase');if(showcase){showcase.innerHTML=['lounge','checkin','boarding'].map(k=>{const x=s.visuals[k];return `<div class="visual-card">${geV251Admin()?`<button class="ge-pencil-v251" onclick="geV251EditVisual('${k}')">✎</button>`:''}<img src="${x.image}" alt="${geEsc(x.title)}"><div class="visual-overlay"><h3>${geEsc(x.title)}</h3><p>${geEsc(x.caption)}</p></div></div>`}).join('')}
 const cards=[...document.querySelectorAll('.main>.card')].filter(c=>c.querySelector('.grid3'));cards.forEach((c,idx)=>{const j=Object.keys(GE_V251_TP)[idx];if(!j)return;const g=c.querySelector('.grid3');g.innerHTML=GE_V251_TP[j].map((n,k)=>{const x=geV251TPData(j,n),has=x.images?.length,uid=`tp_${idx}_${k}`;return `<div class="card touch touch-v251" onclick='geV251OpenGallery(${JSON.stringify(j)},${JSON.stringify(n)})'>${geV251Admin()?`<button class="ge-pencil-v251" onclick='event.stopPropagation();geV251EditTP(${JSON.stringify(j)},${JSON.stringify(n)})'>✎</button>`:''}<div class="icon">${has?`<img id="${uid}" alt="">`:'✈️'}</div><b>${geEsc(x.title)}</b><p>${geEsc(x.caption)}</p>${has&&x.images.length>1?`<small class="ge-photo-count-v251c1">${x.images.length} foto</small>`:''}</div>`}).join('');GE_V251_TP[j].forEach(async(n,k)=>{const x=geV251TPData(j,n);if(x.images?.length){const img=document.getElementById(`tp_${idx}_${k}`);await geV251C1HydrateImage(img,x.images[0])}})})
}


/* ==============================================================
   V2.51 CONSOLIDATED R2 — Partial/Not-Done Completion
   ============================================================== */

/* ---------- Global page content / section visibility ---------- */
function pmCfgR2(){data.portalManagerR2||={};data.portalManagerR2.pages||={};data.portalManagerR2.menus||={};return data.portalManagerR2}
function pmPageKeyR2(){const f=(location.pathname.split('/').pop()||'index.html');if(f==='app.html'){const r=String(new URLSearchParams(location.search).get('page')||'index');const a=(window.GE_ROUTE_ALIASES||{})[r]||r;return a.split('?')[0]+'.html'}return f}
function pmApplyPageR2(){
 const cfg=pmCfgR2(),key=pmPageKeyR2(),pc=cfg.pages[key]||{};
 if(pc.title){const hero=document.querySelector('.hero h2,.page-header h2');if(hero)hero.textContent=pc.title}
 if(pc.description){const p=document.querySelector('.hero p,.page-header p');if(p)p.textContent=pc.description}
 const sections=pc.sections||{};
 document.querySelectorAll('[data-pm-section]').forEach(el=>{const id=el.dataset.pmSection,s=sections[id];if(s)el.style.display=s.visible===false?'none':''});
 if(Array.isArray(pc.order)&&pc.order.length){const parent=document.querySelector('.main');if(parent){pc.order.forEach(id=>{const el=document.querySelector(`[data-pm-section="${CSS.escape(id)}"]`);if(el&&el.parentElement===parent)parent.appendChild(el)})}}
 const menus=cfg.menus||{};document.querySelectorAll('.side a').forEach(a=>{const k=(a.getAttribute('href')||'').split('#')[0];if(k&&menus[k]?.visible===false)a.style.display='none'});
}
window.addEventListener('DOMContentLoaded',()=>setTimeout(pmApplyPageR2,0));

const PM_PAGE_SECTIONS_R2={
 'index.html':[
  ['homeHero','Dashboard Header'],['homeKpis','KPI Summary'],['homeLounge','Pre-Flight Lounge Overview'],['homeServiceExperience','Service Experience & Ground Experience'],['homeProgress','Ringkasan Kemajuan'],['homeDocuments','Dokumen & Lampiran']
 ],
 'standar.html':[['standardHero','Page Header']],
 'touchpoint.html':[['touchpointVisual','Referensi Visual Layanan'],['touchpointList','Touch Point Garuda Indonesia']],
 'service-planning.html':[['planningOverview','Planning Overview']],
 'lounge-list.html':[['loungeMaster','Lounge/Tenant Planning']],
 'calendar.html':[['calendarMain','Calendar Event']]
};
function pmLoadPageR2(){
 const key=document.getElementById('pmPage')?.value||'index.html',cfg=pmCfgR2().pages[key]||{};
 const defaults={
  'index.html':['Ground Experience Dashboard','Central workspace untuk memantau service experience, airport, inisiatif, lounge, dokumen, dan informasi Ground Experience.'],
  'standar.html':['Standar Layanan Garuda Indonesia','Framework People • Process • Premises untuk menjaga konsistensi service delivery.'],
  'touchpoint.html':['Touch Point Garuda Indonesia','Referensi visual dan informasi touch point Ground Experience.'],
  'service-planning.html':['Service Planning','Planning workspace Ground Experience.'],
  'lounge-list.html':['Lounge/Tenant Planning','Master layanan Lounge/Tenant seluruh Branch Office.'],
  'calendar.html':['Calendar Event','Due date inisiatif, milestone, dan kegiatan operasional Ground Experience.']
 }[key]||['',''];
 pmTitle.value=cfg.title||defaults[0];pmDescription.value=cfg.description||defaults[1];pmRenderSectionsR2();pmRenderMenusR2();
}
function pmRenderSectionsR2(){
 const key=pmPage.value||'index.html',box=document.getElementById('pmSectionListR2');if(!box)return;const cfg=pmCfgR2().pages[key]||{},sections=cfg.sections||{},order=cfg.order||PM_PAGE_SECTIONS_R2[key]?.map(x=>x[0])||[];const labels=Object.fromEntries(PM_PAGE_SECTIONS_R2[key]||[]);
 box.innerHTML=order.map((id,i)=>{const s=sections[id]||{visible:true};return `<div class="pm-section-row-r2" data-id="${geEsc(id)}"><span class="portal-drag">↕</span><b>${geEsc(labels[id]||id)}</b><label class="pm-switch-r2"><input type="checkbox" ${s.visible===false?'':'checked'}><span></span></label><button class="btn secondary compact-btn" onclick="pmMoveSectionR2('${geEsc(id)}',-1)">↑</button><button class="btn secondary compact-btn" onclick="pmMoveSectionR2('${geEsc(id)}',1)">↓</button></div>`}).join('')||'<div class="portal-note">Section manager untuk page ini belum didefinisikan.</div>';
}
function pmMoveSectionR2(id,dir){const key=pmPage.value,cfg=pmCfgR2();cfg.pages[key]||={};let order=cfg.pages[key].order||PM_PAGE_SECTIONS_R2[key]?.map(x=>x[0])||[];const i=order.indexOf(id),j=i+dir;if(i<0||j<0||j>=order.length)return;[order[i],order[j]]=[order[j],order[i]];cfg.pages[key].order=order;save();pmRenderSectionsR2()}
function pmSaveSectionsR2(){const key=pmPage.value,cfg=pmCfgR2();cfg.pages[key]||={};cfg.pages[key].sections||={};document.querySelectorAll('#pmSectionListR2 .pm-section-row-r2').forEach(r=>cfg.pages[key].sections[r.dataset.id]={visible:r.querySelector('input')?.checked!==false});cfg.pages[key].order=[...document.querySelectorAll('#pmSectionListR2 .pm-section-row-r2')].map(r=>r.dataset.id);cfg.pages[key].draft=true;save();pmActivity('Layout page disimpan sebagai draft.')}
function pmResetSectionsR2(){const key=pmPage.value,cfg=pmCfgR2();delete cfg.pages[key];save();pmLoadPageR2();pmActivity('Konfigurasi page dikembalikan ke default.')}
function pmSavePageR2(){const key=pmPage.value,cfg=pmCfgR2();cfg.pages[key]||={};cfg.pages[key].title=pmTitle.value.trim();cfg.pages[key].description=pmDescription.value.trim();cfg.pages[key].draft=true;save();pmActivity('Page & text disimpan sebagai draft.')}
function pmPreviewR2(){pmActivity('Preview: buka page terkait pada tab baru untuk melihat draft browser saat ini.');window.open(pmPage?.value||'index.html','_blank')}
function pmPublishR2(){const cfg=pmCfgR2();Object.values(cfg.pages).forEach(p=>{p.draft=false;p.publishedAt=new Date().toISOString()});cfg.publishedAt=new Date().toISOString();save();portalPublishState.textContent='Published';pmActivity('Perubahan Portal Management dipublish pada browser prototype ini.')}
function pmRenderMenusR2(){const box=document.getElementById('pmMenuListR2');if(!box)return;const items=[['layanan.html','Layanan Garuda Indonesia'],['inisiatif.html','Kegiatan & Inisiatif'],['service-planning.html','Service Planning'],['data.html','Data'],['berita.html','Berita & Informasi'],['kontak.html','Hubungi Kami'],['admin.html','Admin / Pengelola']];const cfg=pmCfgR2().menus;box.innerHTML=items.map(([k,l])=>`<div class="portal-menu-item"><b>${l}</b><small>${k}</small><label class="pm-switch-r2"><input data-menu="${k}" type="checkbox" ${cfg[k]?.visible===false?'':'checked'}><span></span></label></div>`).join('')}
function pmSaveMenusR2(){const cfg=pmCfgR2().menus;document.querySelectorAll('#pmMenuListR2 input[data-menu]').forEach(x=>{cfg[x.dataset.menu]={visible:x.checked}});save();pmActivity('Menu visibility disimpan sebagai draft.')}
window.addEventListener('DOMContentLoaded',()=>{if(document.getElementById('pmPage'))setTimeout(pmLoadPageR2,20)});

/* ---------- Asset Library: actual IndexedDB files ---------- */
async function pmRegisterAssetsR2(){const files=[...(pmAsset?.files||[])];if(!files.length)return pmActivity('Pilih asset terlebih dahulu.');const cfg=pmCfgR2();cfg.assets||=[];for(const f of files){const key=`portal_asset_${Date.now()}_${Math.random().toString(36).slice(2)}`;await GEFiles.put(key,f);cfg.assets.push({key,name:f.name,size:f.size,type:f.type,createdAt:new Date().toISOString()})}save();pmAsset.value='';pmActivity(`${files.length} asset tersimpan di IndexedDB browser.`);pmAssetListR2()}
async function pmAssetListR2(){const box=document.getElementById('pmAssetLibraryR2');if(!box)return;const rows=pmCfgR2().assets||[];box.innerHTML=rows.length?(await Promise.all(rows.map(async x=>{let preview='';if(String(x.type).startsWith('image/')){try{const f=await GEFiles.get(x.key);if(f)preview=`<img src="${URL.createObjectURL(f)}" alt="">`}catch(e){}}return `<div class="pm-asset-card-r2">${preview||'<div class="pm-asset-file-r2">FILE</div>'}<div><b>${geEsc(x.name)}</b><small>${Math.round(x.size/1024)} KB</small></div><button class="btn danger compact-btn" onclick="pmDeleteAssetR2('${x.key}')">Hapus</button></div>`}))).join(''):'<div class="portal-note">Asset Library masih kosong.</div>'}
async function pmDeleteAssetR2(key){const cfg=pmCfgR2();cfg.assets=(cfg.assets||[]).filter(x=>x.key!==key);try{await GEFiles.del(key)}catch(e){}save();pmAssetListR2()}

/* ---------- Initiative long text / announcement preview ---------- */
const GE_RENDER_ANN_R2=renderAnnouncementLibraryV246;
renderAnnouncementLibraryV246=function(){GE_RENDER_ANN_R2();document.querySelectorAll('#announcementLibraryV246 .announcement-card-v246 p').forEach(p=>{p.classList.add('ge-clamp-v251');if(!p.nextElementSibling?.classList.contains('ge-more-inline-r2')){const b=document.createElement('button');b.className='ge-more-inline-r2';b.textContent='… lihat selengkapnya ›';b.onclick=()=>p.closest('.announcement-card-v246')?.querySelector('.announcement-actions-v248 .btn')?.click();p.after(b)}})};

/* ---------- Calendar Project Tracking R2 ---------- */
let GE_CAL_VIEW_R2='month';
function geV251AllEvents(){
 const s=geV251Ensure(),manual=s.events||[],auto=[];(data.initiatives||[]).forEach(x=>{const due=x.dueDate||x.due;if(due)auto.push({id:`due_${x.id}`,title:x.name||'Initiative Due Date',date:due,time:'',type:'due',category:'Due Date',airport:x.airport||'',pic:x.pic||'',touchpoint:x.tp||'',source:'Initiative',readOnly:true,initiativeId:x.id});(x.workflow||[]).forEach((w,i)=>{if(w.dueDate)auto.push({id:`mile_${x.id}_${i}`,title:`${x.name} — ${w.title||'Milestone'}`,date:w.dueDate,time:'',type:'milestone',category:'Milestone',airport:x.airport||'',pic:w.pic||x.pic||'',touchpoint:x.tp||'',source:'Milestone',readOnly:true,initiativeId:x.id})})});return [...manual,...auto]
}
function geV251SetCalViewR2(v,btn){GE_CAL_VIEW_R2=v;document.querySelectorAll('[data-cal-view]').forEach(x=>x.classList.remove('active'));btn?.classList.add('active');geV251RenderCalendar()}
function geCalEventHTMLR2(e){return `<button class="cal-event-v251 ${e.type||''} ${String(e.priority||'').toLowerCase()}" onclick='geV251OpenEventDetailR2(${JSON.stringify(String(e.id))})' title="${geEsc(e.title)}">${e.time?geEsc(e.time)+' ':''}${geEsc(e.title)}</button>`}
function geV251RenderCalendar(){
 const grid=document.getElementById('geCalendarV251'),agenda=document.getElementById('geCalendarAgendaR2');if(!grid)return;const events=geV251AllEvents(),base=geV251CalDate,y=base.getFullYear(),m=base.getMonth();agenda.style.display='none';grid.style.display='';
 if(GE_CAL_VIEW_R2==='month'){
  const first=new Date(y,m,1),start=new Date(y,m,1-first.getDay());geCalendarTitleV251.textContent=new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric'}).format(first);let html=['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(x=>`<div class="cal-head-v251">${x}</div>`).join('');for(let d=0;d<42;d++){const dt=new Date(start);dt.setDate(start.getDate()+d);const iso=dt.toLocaleDateString('en-CA'),rows=events.filter(e=>String(e.date||'').slice(0,10)===iso),muted=dt.getMonth()!==m?' muted':'';html+=`<div class="cal-day-v251${muted}"><div class="cal-num-v251">${dt.getDate()}</div>${rows.slice(0,4).map(geCalEventHTMLR2).join('')}${rows.length>4?`<small>+${rows.length-4} lainnya</small>`:''}</div>`}grid.className='calendar-grid-v251';grid.innerHTML=html;
 }else if(GE_CAL_VIEW_R2==='week'){
  const start=new Date(base);start.setDate(base.getDate()-base.getDay());geCalendarTitleV251.textContent=`Minggu ${start.toLocaleDateString('id-ID',{day:'numeric',month:'short'})}`;grid.className='calendar-week-r2';grid.innerHTML=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);const iso=d.toLocaleDateString('en-CA'),rows=events.filter(e=>String(e.date).slice(0,10)===iso);return `<div class="calendar-week-col-r2"><h4>${d.toLocaleDateString('id-ID',{weekday:'short',day:'numeric'})}</h4>${rows.map(geCalEventHTMLR2).join('')||'<small>Tidak ada agenda</small>'}</div>`}).join('');
 }else if(GE_CAL_VIEW_R2==='day'){
  const iso=base.toLocaleDateString('en-CA'),rows=events.filter(e=>String(e.date).slice(0,10)===iso).sort((a,b)=>String(a.time||'99:99').localeCompare(String(b.time||'99:99')));geCalendarTitleV251.textContent=base.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});grid.className='calendar-day-r2';grid.innerHTML=rows.map(e=>`<div class="calendar-day-event-r2"><time>${geEsc(e.time||'All day')}</time><div><b>${geEsc(e.title)}</b><span>${geEsc(e.category||e.source||'Event')} • ${geEsc(e.airport||'-')} • PIC ${geEsc(e.pic||'-')}</span></div><button class="btn secondary compact-btn" onclick='geV251OpenEventDetailR2(${JSON.stringify(String(e.id))})'>Detail</button></div>`).join('')||'<div class="planning-empty">Tidak ada agenda.</div>';
 }else{
  grid.style.display='none';agenda.style.display='grid';geCalendarTitleV251.textContent='Agenda';const rows=[...events].filter(e=>e.date).sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(0,120);agenda.innerHTML=rows.map(e=>`<div class="calendar-agenda-item-r2"><time><b>${new Date(e.date+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short'})}</b><span>${geEsc(e.time||'')}</span></time><div><b>${geEsc(e.title)}</b><span>${geEsc(e.category||e.source)} • ${geEsc(e.airport||'-')} • ${geEsc(e.touchpoint||'-')}</span></div><button class="btn secondary compact-btn" onclick='geV251OpenEventDetailR2(${JSON.stringify(String(e.id))})'>Detail</button></div>`).join('')||'<div class="planning-empty">Belum ada agenda.</div>';
 }
 const monthEvents=events.filter(e=>{const d=new Date(e.date+'T00:00:00');return d.getFullYear()===y&&d.getMonth()===m});geCalendarSummaryV251.innerHTML=`<span>${monthEvents.length} agenda bulan ini</span><span>${monthEvents.filter(e=>e.source==='Initiative').length} due date inisiatif</span><span>${monthEvents.filter(e=>e.source==='Milestone').length} milestone</span><span>${monthEvents.filter(e=>e.source==='Manual').length} kegiatan manual</span>`;
}
function geV251CalMove(n){if(GE_CAL_VIEW_R2==='month')geV251CalDate=new Date(geV251CalDate.getFullYear(),geV251CalDate.getMonth()+n,1);else if(GE_CAL_VIEW_R2==='week'){geV251CalDate=new Date(geV251CalDate);geV251CalDate.setDate(geV251CalDate.getDate()+7*n)}else{geV251CalDate=new Date(geV251CalDate);geV251CalDate.setDate(geV251CalDate.getDate()+n)}geV251RenderCalendar()}
function geV251OpenEvent(id=null){if(!geV251Admin())return;const e=id?(geV251Ensure().events||[]).find(x=>String(x.id)===String(id)):null;geV251EventModalTitleR2.textContent=e?'Update Kegiatan':'Tambah Kegiatan';geV251EventIdR2.value=e?.id||'';geV251EventTitle.value=e?.title||'';geV251EventDate.value=e?.date||new Date().toLocaleDateString('en-CA');geV251EventTime.value=e?.time||'';geV251EventAirport.value=e?.airport||'';geV251EventPicR2.value=e?.pic||'';geV251EventTouchpointR2.value=e?.touchpoint||'';geV251EventCategory.value=e?.category||'Meeting';geV251EventPriorityR2.value=e?.priority||'Normal';geV251EventReminderR2.value=String(e?.reminder||0);geV251EventRemark.value=e?.remark||'';geV251DeleteEventR2.style.display=e?'inline-flex':'none';geV251EventModal.classList.add('show')}
function geV251SaveEventR2(){const title=geV251EventTitle.value.trim(),date=geV251EventDate.value;if(!title||!date)return geStorageNoticeV223('Data belum lengkap','Judul dan tanggal wajib diisi.');const s=geV251Ensure(),id=geV251EventIdR2.value,obj={id:id?Number(id):Date.now(),title,date,time:geV251EventTime.value,airport:geV251EventAirport.value.trim().toUpperCase(),pic:geV251EventPicR2.value.trim(),touchpoint:geV251EventTouchpointR2.value.trim(),category:geV251EventCategory.value,priority:geV251EventPriorityR2.value,reminder:Number(geV251EventReminderR2.value||0),remark:geV251EventRemark.value.trim(),source:'Manual'};const old=(s.events||[]).find(x=>String(x.id)===String(id));if(old)Object.assign(old,obj);else s.events.push(obj);save();geV251EventModal.classList.remove('show');geV251RenderCalendar()}
async function geV251DeleteEventR2(){const id=geV251EventIdR2.value;if(!id)return;const ok=typeof geConfirmDeleteV234==='function'?await geConfirmDeleteV234({title:'Hapus Kegiatan?',item:geV251EventTitle.value,message:'Kegiatan manual akan dihapus dari kalender.'}):confirm('Hapus kegiatan?');if(!ok)return;const s=geV251Ensure();s.events=s.events.filter(x=>String(x.id)!==String(id));save();geV251EventModal.classList.remove('show');geV251RenderCalendar()}
function geV251OpenEventDetailR2(id){const e=geV251AllEvents().find(x=>String(x.id)===String(id));if(!e)return;if(e.readOnly){if(e.initiativeId&&typeof openInitiativeTimelineV224==='function')openInitiativeTimelineV224(e.initiativeId);return}geV251OpenEvent(e.id)}
function geV251CheckRemindersR2(){const now=new Date();geV251AllEvents().filter(e=>e.source==='Manual'&&e.date).forEach(e=>{const due=new Date(`${e.date}T${e.time||'09:00'}:00`),minutes=Number(e.reminder||0),alertAt=new Date(due.getTime()-minutes*60000),key=`calrem_${e.id}_${e.date}_${e.time}_${minutes}`;if(now>=alertAt&&now<due&&geUiGet(key)!=='1'){geUiSet(key,'1');if('Notification'in window&&Notification.permission==='granted')new Notification('Ground Experience Calendar',{body:`${e.title} • ${e.airport||''} ${e.time||''}`});else geStorageNoticeV223('Calendar Reminder',`${e.title} • ${e.date} ${e.time||''}`,'warning')}})}
window.addEventListener('DOMContentLoaded',()=>{if(document.getElementById('geCalendarV251')){geV251RenderCalendar();setInterval(geV251CheckRemindersR2,60000);geV251CheckRemindersR2()}});


/* ==============================================================
   V2.52 FUNCTIONAL — Initiative / Activity / Calendar integration
   ============================================================== */
const GE_JOURNEY_OPTIONS_V252=['Pre-Journey','Pre-Flight','Post-Flight','Post-Journey','Cross-Journey / End-to-End','Supporting / Enabler'];
function geArrV252(v){if(Array.isArray(v))return v.filter(Boolean);return String(v||'').split(/[|,;]/).map(x=>x.trim()).filter(Boolean)}
function geScopesV252(x){return geArrV252(x.journeyScopes||x.journey||'')}
function geTPsV252(x){return geArrV252(x.touchpoints||x.tp||x.touchpoint||'')}
function geMatchesJourneyV252(x,j){
  if(!j)return true;
  const s=geScopesV252(x);
  return s.includes(j)||s.includes('Cross-Journey / End-to-End');
}
function geMultiValuesV252(id){return [...(document.getElementById(id)?.selectedOptions||[])].map(o=>o.value).filter(Boolean)}
function geEnsureV252(){
 data.activities=data.activities||[];
 data.events=data.events||[];
 (data.initiatives||[]).forEach(x=>{
   if(!x.journeyScopes)x.journeyScopes=geScopesV252(x);
   if(!x.touchpoints)x.touchpoints=geTPsV252(x);
 });
}
function geUpgradeInitiativeModalV252(){
 /* superseded by canonical compact picker; do not mutate canonical modal fields */ return;
 const old=document.getElementById('initiativeJourneyV224');if(!old||old.dataset.v252)return;
 old.dataset.v252='1';
 old.multiple=true;old.size=6;
 old.innerHTML=GE_JOURNEY_OPTIONS_V252.map(x=>`<option value="${geEsc(x)}">${geEsc(x)}</option>`).join('');
 old.closest('label').firstChild.textContent='Journey Scope (bisa lebih dari satu) ';
 const tp=document.getElementById('initiativeTouchpointV224');
 if(tp){tp.placeholder='Pisahkan beberapa Touch Point dengan koma';tp.closest('label').firstChild.textContent='Touch Point (bisa lebih dari satu) '}
}
const geOldOpenInitV252=typeof openInitiativeModalV224==='function'?openInitiativeModalV224:null;
openInitiativeModalV224=function(id=null){
 if(geOldOpenInitV252)geOldOpenInitV252(id);
 geUpgradeInitiativeModalV252();
 const x=id?(data.initiatives||[]).find(v=>String(v.id)===String(id)):null;
 const sel=document.getElementById('initiativeJourneyV224');
 const values=x?geScopesV252(x):[document.getElementById('journeyPageValue')?.value||'Pre-Flight'];
 [...sel.options].forEach(o=>o.selected=values.includes(o.value));
 if(x&&document.getElementById('initiativeTouchpointV224'))initiativeTouchpointV224.value=geTPsV252(x).join(', ');
}
saveInitiativeV224=function(){
 if(!geInitiativeAdminV224())return;
 const id=document.getElementById('initiativeEditIdV224')?.value;
 const existing=id?(data.initiatives||[]).find(v=>String(v.id)===String(id)):null;
 const name=initiativeNameV224.value.trim(), scopes=geMultiValuesV252('initiativeJourneyV224');
 const tps=geArrV252(initiativeTouchpointV224.value);
 if(!name||!scopes.length||!tps.length)return alert('Nama Inisiatif, Journey Scope, dan Touch Point wajib diisi.');
 const obj={
   ...(existing||{}),id:existing?.id||Date.now(),name,
   journeyScopes:scopes,journey:scopes[0],touchpoints:tps,tp:tps.join(', '),
   airport:initiativeAirportV224.value.trim().toUpperCase(),pic:initiativePicV224.value.trim(),
   dueDate:initiativeDueDateV224.value,plan:Number(initiativePlanV224.value||0),
   real:Number(initiativeRealV224.value||0),remark:initiativeRemarkV224.value.trim()
 };
 if(existing)Object.assign(existing,obj);else{data.initiatives=data.initiatives||[];data.initiatives.push(obj)}
 save();closeInitiativeModalV224();renderInitiatives();
}

/* Journey pages display initiatives assigned to that scope, including cross-journey. */
const geOldCurrentRowsV252=typeof currentInitiativeRows==='function'?currentInitiativeRows:null;
currentInitiativeRows=function(){
 const focused=window.GE_INITIATIVE_FOCUS_ID_R65;
 if(focused)return (data.initiatives||[]).filter(x=>String(x.id)===String(focused));
 let rows=(data.initiatives||[]).slice();
 const page=document.getElementById('journeyPageValue')?.value||activeJourney||'';
 if(page)rows=rows.filter(x=>geMatchesJourneyV252(x,page));
 const q=(document.getElementById('q')?.value||'').toLowerCase();
 const ft=document.getElementById('ft')?.value||'', fs=document.getElementById('fs')?.value||'', fp=document.getElementById('fp')?.value||'';
 return rows.filter(x=>{
   const status=typeof geInitiativeStatusV246==='function'?geInitiativeStatusV246(x):'';
   return (!q||`${x.name||''} ${geTPsV252(x).join(' ')} ${x.airport||''} ${x.pic||''}`.toLowerCase().includes(q)) &&
    (!ft||geTPsV252(x).includes(ft))&&(!fs||status===fs)&&(!fp||x.pic===fp);
 });
}

/* Calendar manual activities: standalone OR linked to an initiative. */
function geUpgradeCalendarModalV252(){
 const modal=document.getElementById('geV251EventModal');if(!modal||modal.dataset.v252)return;
 modal.dataset.v252='1';
 const grid=modal.querySelector('.formgrid');if(!grid)return;
 const anchor=document.getElementById('geV251EventCategory')?.closest('label');
 const html=`
 <label>Jenis Kegiatan<select id="geV252ActivityType"><option value="standalone">Standalone Activity</option><option value="initiative">Terkait Initiative</option></select></label>
 <label>Initiative Terkait<select id="geV252InitiativeLink"><option value="">Tidak terkait Initiative</option></select></label>
 <label>Journey Scope<select id="geV252JourneyScopes" multiple size="7"><option>Tidak Terkait Journey</option>${GE_JOURNEY_OPTIONS_V252.map(x=>`<option>${geEsc(x)}</option>`).join('')}</select></label>
 <label>Touch Point (bisa beberapa)<input id="geV252Touchpoints" placeholder="Contoh: Lounge, Boarding Gate"></label>`;
 anchor?.insertAdjacentHTML('beforebegin',html);
}
function geFillInitiativeLinksV252(){
 const s=document.getElementById('geV252InitiativeLink');if(!s)return;
 const cur=s.value;s.innerHTML='<option value="">Tidak terkait Initiative</option>'+ (data.initiatives||[]).map(x=>`<option value="${geEsc(String(x.id))}">${geEsc(x.name||'-')}</option>`).join('');s.value=cur;
}
const geOldOpenEventV252=typeof geV251OpenEvent==='function'?geV251OpenEvent:null;
geV251OpenEvent=function(){
 if(geOldOpenEventV252)geOldOpenEventV252();
 geUpgradeCalendarModalV252();geFillInitiativeLinksV252();
 geV252ActivityType.value='standalone';geV252InitiativeLink.value='';
 [...geV252JourneyScopes.options].forEach(o=>o.selected=o.value==='Tidak Terkait Journey');
 geV252Touchpoints.value='';
}
geV251SaveEventR2=function(){
 const title=geV251EventTitle.value.trim(),date=geV251EventDate.value;if(!title||!date)return alert('Judul dan tanggal wajib diisi.');
 geEnsureV252();
 const id=geV251EventIdR2.value, old=id?data.events.find(x=>String(x.id)===String(id)):null;
 const scopes=geMultiValuesV252('geV252JourneyScopes');
 if(scopes.includes('Tidak Terkait Journey')&&scopes.length>1)return alert('"Tidak Terkait Journey" tidak dapat digabung dengan Journey Scope lain.');
 const obj={...(old||{}),id:old?.id||Date.now(),title,date,time:geV251EventTime.value,airport:geV251EventAirport.value.trim().toUpperCase(),
   pic:geV251EventPicR2.value.trim(),touchpoint:geV252Touchpoints.value.trim()||geV251EventTouchpointR2.value.trim(),
   touchpoints:geArrV252(geV252Touchpoints.value||geV251EventTouchpointR2.value),category:geV251EventCategory.value,
   priority:geV251EventPriorityR2.value,reminder:Number(geV251EventReminderR2.value||0),remark:geV251EventRemark.value.trim(),
   activityType:geV252ActivityType.value,initiativeId:geV252InitiativeLink.value||'',journeyScopes:scopes,source:'Manual'};
 if(old)Object.assign(old,obj);else data.events.push(obj);save();geV251EventModal.classList.remove('show');geV251RenderCalendar();
}
const geOldAllEventsV252=typeof geV251AllEvents==='function'?geV251AllEvents:null;
geV251AllEvents=function(){
 geEnsureV252();
 const manual=(data.events||[]).map(x=>({...x,source:x.source||'Manual'}));
 const init=(data.initiatives||[]).filter(x=>x.dueDate||x.due).map(x=>({id:`init-${x.id}`,title:x.name||'Initiative Due Date',date:x.dueDate||x.due,type:'due',airport:x.airport||'',pic:x.pic||'',touchpoints:geTPsV252(x),journeyScopes:geScopesV252(x),source:'Initiative',initiativeId:x.id,readOnly:true}));
 const milestones=[];
 (data.initiatives||[]).forEach(x=>(x.timeline||x.milestones||[]).forEach((m,i)=>{if(m.date||m.dueDate)milestones.push({id:`milestone-${x.id}-${i}`,title:`${x.name} — ${m.title||m.name||'Milestone'}`,date:m.date||m.dueDate,type:'milestone',airport:x.airport||'',pic:x.pic||'',touchpoints:geTPsV252(x),journeyScopes:geScopesV252(x),source:'Milestone',initiativeId:x.id,readOnly:true})}));
 return [...manual,...init,...milestones];
}

/* Calendar filter bar */
function geAddCalendarFiltersV252(){
 const cal=document.getElementById('geCalendarV251');if(!cal||document.getElementById('geCalFiltersV252'))return;
 cal.insertAdjacentHTML('beforebegin',`<div id="geCalFiltersV252" class="card ge-cal-filters-v252">
 <select id="geCalJourneyV252" onchange="geV251RenderCalendar()"><option value="">Semua Journey Scope</option>${GE_JOURNEY_OPTIONS_V252.map(x=>`<option>${geEsc(x)}</option>`).join('')}<option>Tidak Terkait Journey</option></select>
 <input id="geCalTouchV252" placeholder="Filter Touch Point" oninput="geV251RenderCalendar()">
 <input id="geCalStationV252" placeholder="Filter Station" oninput="geV251RenderCalendar()">
 <input id="geCalPicV252" placeholder="Filter PIC" oninput="geV251RenderCalendar()">
 <select id="geCalSourceV252" onchange="geV251RenderCalendar()"><option value="">Semua Jenis</option><option>Initiative</option><option>Milestone</option><option>Manual</option></select>
 </div>`);
}
function geFilteredCalendarEventsV252(){
 const all=geOldAllEventsV252?geOldAllEventsV252():[],j=document.getElementById('geCalJourneyV252')?.value||'',tp=(document.getElementById('geCalTouchV252')?.value||'').toLowerCase(),st=(document.getElementById('geCalStationV252')?.value||'').toLowerCase(),pic=(document.getElementById('geCalPicV252')?.value||'').toLowerCase(),src=document.getElementById('geCalSourceV252')?.value||'';
 return all.filter(e=>(!j||geArrV252(e.journeyScopes).includes(j))&&(!tp||geArrV252(e.touchpoints||e.touchpoint).join(' ').toLowerCase().includes(tp))&&(!st||String(e.airport||'').toLowerCase().includes(st))&&(!pic||String(e.pic||'').toLowerCase().includes(pic))&&(!src||e.source===src));
}
/* wrap all-events only during calendar rendering so existing renderer gets filtered data */
const geRenderCalendarBaseV252=geV251RenderCalendar;
geV251RenderCalendar=function(){
 geAddCalendarFiltersV252();
 const original=geV251AllEvents;
 geV251AllEvents=geFilteredCalendarEventsV252;
 try{return geRenderCalendarBaseV252()}finally{geV251AllEvents=original}
}
window.addEventListener('DOMContentLoaded',()=>{geEnsureV252();geUpgradeInitiativeModalV252();geUpgradeCalendarModalV252();geAddCalendarFiltersV252();});
/* ==============================================================
   V2.53 — CALENDAR & PROJECT TRACKING FOCUS
   ============================================================== */
function geProjectMetricsV253(){
 const ev=geV251AllEvents(), today=new Date().toLocaleDateString('en-CA'), month=today.slice(0,7);
 const upcoming=ev.filter(e=>String(e.date||'')>=today).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 return {initiatives:(data.initiatives||[]).length,activities:(data.events||[]).length,dueMonth:ev.filter(e=>String(e.date||'').startsWith(month)).length,overdue:ev.filter(e=>e.date&&String(e.date)<today).length,upcoming};
}
function geRenderProjectSummaryV253(){
 const box=document.getElementById('geProjectSummaryV253');if(!box)return;const m=geProjectMetricsV253();
 box.innerHTML=`<div><b>${m.initiatives}</b><span>Initiative</span></div><div><b>${m.activities}</b><span>Kegiatan Manual</span></div><div><b>${m.dueMonth}</b><span>Agenda Bulan Ini</span></div><div><b>${m.overdue}</b><span>Overdue</span></div>`;
 const up=document.getElementById('geUpcomingV253');if(up)up.innerHTML=m.upcoming.slice(0,6).map(e=>`<button onclick='geV251OpenEventDetailR2(${JSON.stringify(String(e.id))})'><time>${geEsc(String(e.date||'').slice(5))}</time><span><b>${geEsc(e.title||'-')}</b><small>${geEsc(e.source||e.category||'Event')} • ${geEsc(e.airport||'-')}</small></span></button>`).join('')||'<div class="planning-empty">Belum ada agenda berikutnya.</div>';
}
function geTodayV253(){geV251CalDate=new Date();geV251RenderCalendar()}
function geRequestNotificationV253(){if(!('Notification' in window))return geStorageNoticeV223('Notifikasi tidak tersedia','Browser ini tidak mendukung notification.');if(Notification.permission==='granted')return geStorageNoticeV223('Notifikasi aktif','Reminder browser sudah diizinkan.','success');Notification.requestPermission().then(p=>geStorageNoticeV223(p==='granted'?'Notifikasi aktif':'Notifikasi belum aktif',p==='granted'?'Reminder browser sudah diizinkan.':'Izin notification belum diberikan.',p==='granted'?'success':''))}
/* Preserve activity fields while editing. */
const geOpenEventV253=geV251OpenEvent;
geV251OpenEvent=function(id=null){
 geOpenEventV253(id);geUpgradeCalendarModalV252();geFillInitiativeLinksV252();
 const e=id?(data.events||[]).find(x=>String(x.id)===String(id)):null;if(!e)return;
 geV252ActivityType.value=e.activityType||'standalone';geV252InitiativeLink.value=e.initiativeId||'';geV252Touchpoints.value=geArrV252(e.touchpoints||e.touchpoint).join(', ');
 const scopes=geArrV252(e.journeyScopes);[...geV252JourneyScopes.options].forEach(o=>o.selected=scopes.length?scopes.includes(o.value):o.value==='Tidak Terkait Journey');
}
/* Activity linked to initiative can inherit scope/touchpoint. */
document.addEventListener('change',e=>{if(e.target?.id!=='geV252InitiativeLink')return;const x=(data.initiatives||[]).find(v=>String(v.id)===String(e.target.value));if(!x)return;geV252ActivityType.value='initiative';geV252Touchpoints.value=geTPsV252(x).join(', ');const scopes=geScopesV252(x);[...geV252JourneyScopes.options].forEach(o=>o.selected=scopes.includes(o.value));if(!geV251EventAirport.value)geV251EventAirport.value=x.airport||'';if(!geV251EventPicR2.value)geV251EventPicR2.value=x.pic||''});
/* Extend reminders. */
function geUpgradeReminderV253(){const s=document.getElementById('geV251EventReminderR2');if(!s||s.dataset.v253)return;s.dataset.v253='1';s.innerHTML=`<option value="0">Saat jatuh tempo</option><option value="60">1 jam sebelum</option><option value="1440">H-1</option><option value="4320">H-3</option><option value="10080">H-7</option><option value="20160">H-14</option><option value="43200">H-30</option>`}
const geRenderCalV253=geV251RenderCalendar;
geV251RenderCalendar=function(){const r=geRenderCalV253();geRenderProjectSummaryV253();return r}
window.addEventListener('DOMContentLoaded',()=>{geUpgradeReminderV253();geRenderProjectSummaryV253()});

/* V2.53.1 — Calendar navigation self-healing hotfix */
function geEnsureCalendarNavV2531(){
  const nav=document.getElementById('initiativeNav');if(!nav)return;
  let link=nav.querySelector('a[href="calendar.html"]');
  if(!link){
    link=document.createElement('a');
    link.href='calendar.html';
    link.textContent='Calendar & Project Tracking';
    link.className='calendar-project-nav-v2531';
    const toggle=nav.querySelector('.initiative-toggle');
    toggle?.insertAdjacentElement('afterend',link);
  }
  link.classList.remove('rbac-hidden');
  link.removeAttribute('aria-hidden');
  link.style.removeProperty('display');
  link.style.removeProperty('visibility');
}
window.addEventListener('DOMContentLoaded',()=>{
  geEnsureCalendarNavV2531();
  setTimeout(geEnsureCalendarNavV2531,50);
  setTimeout(geEnsureCalendarNavV2531,250);
});


/* ==============================================================
   V2.53.2 — CALENDAR FUNCTIONAL HOTFIX
   Fixes render recursion, add/edit activity, event detail, KPI drilldown,
   and correct active sidebar state.
   ============================================================== */

function geV2532Admin(){ return typeof gxCanManage==='function' ? gxCanManage() : true; }

function geV2532RawEvents(){
  geEnsureV252();
  const manual=(data.events||[]).map(x=>({...x,source:'Manual',readOnly:false}));
  const init=(data.initiatives||[]).filter(x=>x.dueDate||x.due).map(x=>({
    id:`init-${x.id}`,title:x.name||'Initiative Due Date',date:x.dueDate||x.due,
    type:'due',airport:x.airport||'',pic:x.pic||'',touchpoints:geTPsV252(x),
    journeyScopes:geScopesV252(x),source:'Initiative',initiativeId:x.id,readOnly:true
  }));
  const milestones=[];
  (data.initiatives||[]).forEach(x=>(x.timeline||x.milestones||[]).forEach((m,i)=>{
    if(m.date||m.dueDate) milestones.push({
      id:`milestone-${x.id}-${i}`,title:`${x.name||'Initiative'} — ${m.title||m.name||'Milestone'}`,
      date:m.date||m.dueDate,type:'milestone',airport:x.airport||'',pic:x.pic||'',
      touchpoints:geTPsV252(x),journeyScopes:geScopesV252(x),source:'Milestone',
      initiativeId:x.id,readOnly:true
    });
  }));
  return [...manual,...init,...milestones];
}

function geV2532FilteredEvents(){
  const j=document.getElementById('geCalJourneyV252')?.value||'';
  const tp=(document.getElementById('geCalTouchV252')?.value||'').toLowerCase();
  const st=(document.getElementById('geCalStationV252')?.value||'').toLowerCase();
  const pic=(document.getElementById('geCalPicV252')?.value||'').toLowerCase();
  const src=document.getElementById('geCalSourceV252')?.value||'';
  return geV2532RawEvents().filter(e=>
    (!j||geArrV252(e.journeyScopes).includes(j)) &&
    (!tp||geArrV252(e.touchpoints||e.touchpoint).join(' ').toLowerCase().includes(tp)) &&
    (!st||String(e.airport||'').toLowerCase().includes(st)) &&
    (!pic||String(e.pic||'').toLowerCase().includes(pic)) &&
    (!src||e.source===src)
  );
}

function geV2532EventButton(e){
  return `<button class="cal-event-v251 ${geEsc(e.type||'')} ${String(e.priority||'').toLowerCase()}"
    onclick='geV2532OpenDetail(${JSON.stringify(String(e.id))})' title="${geEsc(e.title||'')}">
    ${e.time?geEsc(e.time)+' ':''}${geEsc(e.title||'-')}
  </button>`;
}

function geV2532RenderCalendar(){
  const grid=document.getElementById('geCalendarV251'),agenda=document.getElementById('geCalendarAgendaR2');
  if(!grid)return;
  geAddCalendarFiltersV252();
  const events=geV2532FilteredEvents(),base=geV251CalDate||new Date(),y=base.getFullYear(),m=base.getMonth();
  const view=typeof GE_CAL_VIEW_R2!=='undefined'?GE_CAL_VIEW_R2:'month';
  if(agenda)agenda.style.display='none'; grid.style.display='';

  if(view==='month'){
    const first=new Date(y,m,1),start=new Date(y,m,1-first.getDay());
    geCalendarTitleV251.textContent=new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric'}).format(first);
    let html=['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(x=>`<div class="cal-head-v251">${x}</div>`).join('');
    for(let d=0;d<42;d++){
      const dt=new Date(start);dt.setDate(start.getDate()+d);
      const iso=dt.toLocaleDateString('en-CA'),rows=events.filter(e=>String(e.date||'').slice(0,10)===iso);
      html+=`<div class="cal-day-v251${dt.getMonth()!==m?' muted':''}">
        <div class="cal-num-v251">${dt.getDate()}</div>${rows.slice(0,4).map(geV2532EventButton).join('')}
        ${rows.length>4?`<button class="ge-cal-more-v2532" onclick="geV2532ShowDate('${iso}')">+${rows.length-4} lainnya</button>`:''}
      </div>`;
    }
    grid.className='calendar-grid-v251';grid.innerHTML=html;
  } else if(view==='week'){
    const start=new Date(base);start.setDate(base.getDate()-base.getDay());
    geCalendarTitleV251.textContent=`Minggu ${start.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}`;
    grid.className='calendar-week-r2';
    grid.innerHTML=Array.from({length:7},(_,i)=>{
      const d=new Date(start);d.setDate(start.getDate()+i);const iso=d.toLocaleDateString('en-CA');
      const rows=events.filter(e=>String(e.date||'').slice(0,10)===iso);
      return `<div class="calendar-week-col-r2"><h4>${d.toLocaleDateString('id-ID',{weekday:'short',day:'numeric'})}</h4>${rows.map(geV2532EventButton).join('')||'<small>Tidak ada agenda</small>'}</div>`;
    }).join('');
  } else if(view==='day'){
    const iso=base.toLocaleDateString('en-CA'),rows=events.filter(e=>String(e.date||'').slice(0,10)===iso).sort((a,b)=>String(a.time||'99:99').localeCompare(String(b.time||'99:99')));
    geCalendarTitleV251.textContent=base.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    grid.className='calendar-day-r2';
    grid.innerHTML=rows.map(e=>`<div class="calendar-day-event-r2"><time>${geEsc(e.time||'All day')}</time><div><b>${geEsc(e.title)}</b><span>${geEsc(e.source||e.category||'Event')} • ${geEsc(e.airport||'-')} • PIC ${geEsc(e.pic||'-')}</span></div><button class="btn secondary compact-btn" onclick='geV2532OpenDetail(${JSON.stringify(String(e.id))})'>Detail</button></div>`).join('')||'<div class="planning-empty">Tidak ada agenda.</div>';
  } else {
    grid.style.display='none'; if(agenda)agenda.style.display='grid';
    geCalendarTitleV251.textContent='Agenda';
    const rows=[...events].filter(e=>e.date).sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(0,150);
    if(agenda)agenda.innerHTML=rows.map(e=>`<button class="calendar-agenda-item-r2" onclick='geV2532OpenDetail(${JSON.stringify(String(e.id))})'><time>${geEsc(e.date||'')}</time><div><b>${geEsc(e.title||'-')}</b><span>${geEsc(e.source||e.category||'Event')} • ${geEsc(e.airport||'-')}</span></div></button>`).join('')||'<div class="planning-empty">Belum ada agenda.</div>';
  }

  const monthEvents=events.filter(e=>String(e.date||'').startsWith(`${y}-${String(m+1).padStart(2,'0')}`));
  if(window.geCalendarSummaryV251)geCalendarSummaryV251.innerHTML=`<span>${monthEvents.length} agenda bulan ini</span><span>${monthEvents.filter(e=>e.source==='Initiative').length} initiative</span><span>${monthEvents.filter(e=>e.source==='Manual').length} kegiatan manual</span>`;
  geV2532RenderSummary();
}

function geV2532OpenEvent(id=null){
  if(!geV2532Admin())return;
  geUpgradeCalendarModalV252();geFillInitiativeLinksV252();geUpgradeReminderV253();
  const modal=document.getElementById('geV251EventModal');if(!modal)return;
  const e=id?(data.events||[]).find(x=>String(x.id)===String(id)):null;
  geV251EventIdR2.value=e?.id||'';
  geV251EventModalTitleR2.textContent=e?'Update Kegiatan':'Tambah Kegiatan';
  geV251EventTitle.value=e?.title||'';
  geV251EventDate.value=e?.date||new Date().toLocaleDateString('en-CA');
  geV251EventTime.value=e?.time||'';
  geV251EventAirport.value=e?.airport||'';
  geV251EventPicR2.value=e?.pic||'';
  geV251EventTouchpointR2.value=e?.touchpoint||geArrV252(e?.touchpoints).join(', ')||'';
  geV251EventCategory.value=e?.category||'Meeting';
  geV251EventPriorityR2.value=e?.priority||'Normal';
  geV251EventReminderR2.value=String(e?.reminder||0);
  geV251EventRemark.value=e?.remark||'';
  if(document.getElementById('geV252ActivityType'))geV252ActivityType.value=e?.activityType||'standalone';
  if(document.getElementById('geV252InitiativeLink'))geV252InitiativeLink.value=e?.initiativeId||'';
  if(document.getElementById('geV252Touchpoints'))geV252Touchpoints.value=geArrV252(e?.touchpoints||e?.touchpoint).join(', ');
  if(document.getElementById('geV252JourneyScopes')){
    const scopes=geArrV252(e?.journeyScopes);
    [...geV252JourneyScopes.options].forEach(o=>o.selected=scopes.length?scopes.includes(o.value):o.value==='Tidak Terkait Journey');
  }
  geV251DeleteEventR2.style.display=e?'':'none';
  modal.classList.add('show');
}

function geV2532SaveEvent(){
  const title=geV251EventTitle.value.trim(),date=geV251EventDate.value;
  if(!title||!date)return geStorageNoticeV223('Data belum lengkap','Judul dan tanggal wajib diisi.');
  geEnsureV252();
  const id=geV251EventIdR2.value;
  const old=id?(data.events||[]).find(x=>String(x.id)===String(id)):null;
  const scopes=document.getElementById('geV252JourneyScopes')?geMultiValuesV252('geV252JourneyScopes'):[];
  if(scopes.includes('Tidak Terkait Journey')&&scopes.length>1)return geStorageNoticeV223('Journey Scope tidak sesuai','Tidak Terkait Journey tidak dapat digabung dengan scope lain.');
  const obj={...(old||{}),id:old?.id||Date.now(),title,date,time:geV251EventTime.value,
    airport:geV251EventAirport.value.trim().toUpperCase(),pic:geV251EventPicR2.value.trim(),
    touchpoint:(document.getElementById('geV252Touchpoints')?.value||geV251EventTouchpointR2.value).trim(),
    touchpoints:geArrV252(document.getElementById('geV252Touchpoints')?.value||geV251EventTouchpointR2.value),
    category:geV251EventCategory.value,priority:geV251EventPriorityR2.value,
    reminder:Number(geV251EventReminderR2.value||0),remark:geV251EventRemark.value.trim(),
    activityType:document.getElementById('geV252ActivityType')?.value||'standalone',
    initiativeId:document.getElementById('geV252InitiativeLink')?.value||'',
    journeyScopes:scopes,source:'Manual'};
  if(old)Object.assign(old,obj);else(data.events||=[]).push(obj);
  save();geV251EventModal.classList.remove('show');geV2532RenderCalendar();
}

function geV2532OpenDetail(id){
  const e=geV2532RawEvents().find(x=>String(x.id)===String(id));if(!e)return;
  if(e.source==='Manual')return geV2532OpenEvent(e.id);
  geV2532ShowList(e.source==='Milestone'?'Milestone':'Initiative',[e]);
}
function geV2532ShowDate(iso){geV2532ShowList(`Agenda ${iso}`,geV2532RawEvents().filter(e=>String(e.date||'').slice(0,10)===iso));}

function geV2532EnsureListModal(){
  if(document.getElementById('geV2532ListModal'))return;
  document.body.insertAdjacentHTML('beforeend',`<div id="geV2532ListModal" class="modal-backdrop"><div class="modal-card ge-cal-list-modal-v2532"><button class="modal-x" onclick="geV2532ListModal.classList.remove('show')">×</button><h2 id="geV2532ListTitle">Detail</h2><div id="geV2532ListBody"></div></div></div>`);
}
function geV2532ShowList(title,rows){
  geV2532EnsureListModal();geV2532ListTitle.textContent=title;
  geV2532ListBody.innerHTML=rows.length?rows.map(e=>`<button class="ge-cal-list-row-v2532" onclick='geV2532OpenDetail(${JSON.stringify(String(e.id))})'><time>${geEsc(e.date||'-')} ${geEsc(e.time||'')}</time><span><b>${geEsc(e.title||'-')}</b><small>${geEsc(e.source||e.category||'Event')} • ${geEsc(e.airport||'-')} • PIC ${geEsc(e.pic||'-')}</small></span></button>`).join(''):'<div class="planning-empty">Tidak ada data.</div>';
  geV2532ListModal.classList.add('show');
}

function geV2532RenderSummary(){
  const box=document.getElementById('geProjectSummaryV253');if(!box)return;
  const ev=geV2532RawEvents(),today=new Date().toLocaleDateString('en-CA'),month=today.slice(0,7);
  const initiatives=(data.initiatives||[]),manual=(data.events||[]);
  const monthRows=ev.filter(e=>String(e.date||'').startsWith(month));
  const overdue=ev.filter(e=>e.date&&String(e.date)<today);
  const cards=[
    ['Initiative',initiatives.length,initiatives.map(x=>({id:`init-${x.id}`,title:x.name,date:x.dueDate||x.due||'',source:'Initiative',airport:x.airport||'',pic:x.pic||'',initiativeId:x.id,readOnly:true}))],
    ['Kegiatan Manual',manual.length,manual],
    ['Agenda Bulan Ini',monthRows.length,monthRows],
    ['Overdue',overdue.length,overdue]
  ];
  box.innerHTML=cards.map(([label,num,rows],i)=>`<button class="project-summary-card-v2532" onclick='geV2532SummaryClick(${i})'><b>${num}</b><span>${label}</span><small>Lihat data →</small></button>`).join('');
  window.GE_V2532_SUMMARY_ROWS=cards.map(x=>x[2]); window.GE_V2532_SUMMARY_LABELS=cards.map(x=>x[0]);
  const up=document.getElementById('geUpcomingV253');
  if(up){
    const upcoming=ev.filter(e=>String(e.date||'')>=today).sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(0,8);
    up.innerHTML=upcoming.map(e=>`<button onclick='geV2532OpenDetail(${JSON.stringify(String(e.id))})'><time>${geEsc(String(e.date||'').slice(5))}</time><span><b>${geEsc(e.title||'-')}</b><small>${geEsc(e.source||e.category||'Event')} • ${geEsc(e.airport||'-')}</small></span></button>`).join('')||'<div class="planning-empty">Belum ada agenda berikutnya.</div>';
  }
}
function geV2532SummaryClick(i){geV2532ShowList(window.GE_V2532_SUMMARY_LABELS?.[i]||'Data',window.GE_V2532_SUMMARY_ROWS?.[i]||[])}

function geV2532SetView(v,btn){GE_CAL_VIEW_R2=v;document.querySelectorAll('[data-cal-view]').forEach(x=>x.classList.remove('active'));btn?.classList.add('active');geV2532RenderCalendar()}
function geV2532Move(n){if(GE_CAL_VIEW_R2==='day')geV251CalDate.setDate(geV251CalDate.getDate()+n);else if(GE_CAL_VIEW_R2==='week')geV251CalDate.setDate(geV251CalDate.getDate()+7*n);else geV251CalDate=new Date(geV251CalDate.getFullYear(),geV251CalDate.getMonth()+n,1);geV2532RenderCalendar()}
function geV2532Today(){geV251CalDate=new Date();geV2532RenderCalendar()}

function geV2532FixActiveNav(){
  const page=(location.pathname.split('/').pop()||'index.html');
  document.querySelectorAll('.side a[href]').forEach(a=>{
    const href=(a.getAttribute('href')||'').split('?')[0];
    a.classList.toggle('active',href===page);
  });
}

window.addEventListener('DOMContentLoaded',()=>{
  if(!document.getElementById('geCalendarV251')){geV2532FixActiveNav();return}
  geV2532FixActiveNav();
  geUpgradeCalendarModalV252();geAddCalendarFiltersV252();geUpgradeReminderV253();
  geV2532RenderCalendar();
});


/* ==============================================================
   V2.53.3 — CALENDAR / PROJECT TRACKING FUNCTIONAL FIX
   ============================================================== */

function geCalEscV2533(v){
  return typeof geEsc==='function' ? geEsc(v??'') :
    String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
function geCalArrV2533(v){
  if(Array.isArray(v)) return v.filter(Boolean);
  return String(v||'').split(/[|,;]/).map(x=>x.trim()).filter(Boolean);
}
function geCalScopesV2533(x){return geCalArrV2533(x?.journeyScopes||x?.journey||'')}
function geCalTPV2533(x){return geCalArrV2533(x?.touchpoints||x?.touchpoint||x?.tp||'')}

function geCalAllEventsV2533(){
  data.events=data.events||[];
  const rows=[];

  /* manual activity */
  data.events.forEach(e=>rows.push({
    ...e,
    source:'Manual',
    sourceLabel:'Kegiatan Manual',
    eventType:'manual',
    readOnly:false,
    journeyScopes:geCalArrV2533(e.journeyScopes),
    touchpoints:geCalTPV2533(e)
  }));

  /* initiative due date */
  (data.initiatives||[]).forEach(x=>{
    const due=x.dueDate||x.due||'';
    if(due) rows.push({
      id:`initiative-${x.id}`,
      title:x.name||'Initiative',
      date:due,
      time:'',
      category:'Initiative Due Date',
      eventType:'initiative',
      source:'Initiative',
      sourceLabel:'Initiative',
      airport:x.airport||'',
      pic:x.pic||'',
      initiativeId:x.id,
      journeyScopes:geCalScopesV2533(x),
      touchpoints:geCalTPV2533(x),
      remark:x.remark||'',
      readOnly:true
    });

    /* IMPORTANT: milestone/tahapan is stored in workflow[] in this portal */
    (Array.isArray(x.workflow)?x.workflow:[]).forEach((w,i)=>{
      const md=w.dueDate||w.date||'';
      if(!md)return;
      rows.push({
        id:`milestone-${x.id}-${i}`,
        title:`${x.name||'Initiative'} — ${w.title||'Milestone'}`,
        date:md,
        time:w.time||'',
        category:'Milestone',
        eventType:'milestone',
        source:'Milestone',
        sourceLabel:'Milestone',
        airport:x.airport||'',
        pic:w.pic||x.pic||'',
        initiativeId:x.id,
        milestoneIndex:i,
        milestoneStatus:w.status||'',
        journeyScopes:geCalScopesV2533(x),
        touchpoints:geCalTPV2533(x),
        remark:w.remark||'',
        readOnly:true
      });
    });
  });
  return rows;
}

function geCalUniqueV2533(arr){return [...new Set(arr.filter(Boolean).map(x=>String(x).trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'))}

function geCalMakeFilterV2533(id,label,values){
  const old=document.getElementById(id);
  if(!old)return null;
  const current=old.value||'';
  let sel=old;
  if(old.tagName!=='SELECT'){
    sel=document.createElement('select');
    sel.id=id;
    sel.className=old.className;
    old.replaceWith(sel);
  }
  const options=[['',label],...values.map(v=>[v,v])];
  sel.innerHTML=options.map(([v,l])=>`<option value="${geCalEscV2533(v)}">${geCalEscV2533(l)}</option>`).join('');
  if([...sel.options].some(o=>o.value===current))sel.value=current;
  sel.onchange=()=>geCalRenderV2533();
  return sel;
}

function geCalBuildFiltersV2533(){
  const events=geCalAllEventsV2533();
  const scopes=geCalUniqueV2533([
    'Pre-Journey','Pre-Flight','Post-Flight','Post-Journey',
    'Cross-Journey / End-to-End','Supporting / Enabler','Tidak Terkait Journey',
    ...events.flatMap(e=>geCalArrV2533(e.journeyScopes))
  ]);
  const touchpoints=geCalUniqueV2533(events.flatMap(e=>geCalTPV2533(e)));
  const stations=geCalUniqueV2533(events.map(e=>e.airport));
  const pics=geCalUniqueV2533(events.map(e=>e.pic));

  geCalMakeFilterV2533('geCalJourneyV252','Semua Journey Scope',scopes);
  geCalMakeFilterV2533('geCalTouchV252','Semua Touch Point',touchpoints);
  geCalMakeFilterV2533('geCalStationV252','Semua Station',stations);
  geCalMakeFilterV2533('geCalPicV252','Semua PIC',pics);
  let initSel=document.getElementById('geCalInitiativeV2541');
  if(!initSel){ const host=document.getElementById('geCalFiltersV252'); if(host){initSel=document.createElement('select');initSel.id='geCalInitiativeV2541';host.appendChild(initSel);} }
  if(initSel){const cur=initSel.value||'';initSel.innerHTML='<option value="">Semua Initiative</option>'+((data.initiatives||[]).filter(x=>(x.publicationStatus||'published')!=='draft').map(x=>`<option value="${geCalEscV2533(x.id)}">${geCalEscV2533(x.name||'-')}</option>`).join(''));initSel.value=cur;initSel.onchange=()=>{geCalRenderV2533();if(typeof geV254RenderWorkspace==='function')geV254RenderWorkspace();};}

  const src=document.getElementById('geCalSourceV252');
  if(src){
    const cur=src.value||'';
    src.innerHTML=`
      <option value="">Semua Jenis Event</option>
      <option value="initiative">Initiative Due Date</option>
      <option value="milestone">Milestone / Tahapan</option>
      <option value="manual">Kegiatan Manual</option>`;
    src.value=['initiative','milestone','manual'].includes(cur)?cur:'';
    src.onchange=()=>geCalRenderV2533();
  }

  /* use the portal's standard searchable-dropdown behavior */
  ['geCalJourneyV252','geCalTouchV252','geCalStationV252','geCalPicV252','geCalSourceV252','geCalInitiativeV2541'].forEach(id=>{
    const s=document.getElementById(id);
    if(!s)return;
    if(typeof geEnhanceFilterSelectV245==='function'){
      s.dataset.searchableV245='';
      const existing=s._geSearchWrapV245;
      if(existing){
        if(typeof geRefreshSearchableFilterV245==='function')geRefreshSearchableFilterV245(s);
      }else geEnhanceFilterSelectV245(s);
    }
  });
  if(typeof geUpgradeFilterBehaviorV247==='function')setTimeout(geUpgradeFilterBehaviorV247,0);
}

function geCalFilteredV2533(){
  const j=document.getElementById('geCalJourneyV252')?.value||'';
  const tp=document.getElementById('geCalTouchV252')?.value||'';
  const st=document.getElementById('geCalStationV252')?.value||'';
  const pic=document.getElementById('geCalPicV252')?.value||'';
  const type=document.getElementById('geCalSourceV252')?.value||'';
  const init=document.getElementById('geCalInitiativeV2541')?.value||'';
  return geCalAllEventsV2533().filter(e=>
    (!j || geCalArrV2533(e.journeyScopes).includes(j)) &&
    (!tp || geCalTPV2533(e).includes(tp)) &&
    (!st || String(e.airport||'')===st) &&
    (!pic || String(e.pic||'')===pic) &&
    (!type || e.eventType===type) &&
    (!init || String(e.initiativeId||'')===String(init))
  );
}

function geCalEventHTMLV2533(e){
  return `<button type="button" class="cal-event-v251 ${geCalEscV2533(e.eventType||'')}"
    onclick='geCalOpenDetailV2533(${JSON.stringify(String(e.id))})'>
    ${e.time?`<small>${geCalEscV2533(e.time)}</small> `:''}${geCalEscV2533(e.title||'-')}
  </button>`;
}

function geCalRenderV2533(){
  const grid=document.getElementById('geCalendarV251');
  const agenda=document.getElementById('geCalendarAgendaR2');
  if(!grid)return;

  const events=geCalFilteredV2533();
  const base=window.geV251CalDate instanceof Date?window.geV251CalDate:new Date();
  const y=base.getFullYear(),m=base.getMonth();
  const view=typeof window.GE_CAL_VIEW_R2==='string'?window.GE_CAL_VIEW_R2:'month';

  if(agenda)agenda.style.display='none';
  grid.style.display='';

  if(view==='month'){
    const first=new Date(y,m,1), start=new Date(y,m,1-first.getDay());
    if(window.geCalendarTitleV251)geCalendarTitleV251.textContent=
      new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric'}).format(first);
    let html=['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(x=>`<div class="cal-head-v251">${x}</div>`).join('');
    for(let i=0;i<42;i++){
      const d=new Date(start);d.setDate(start.getDate()+i);
      const iso=d.toLocaleDateString('en-CA');
      const dayRows=events.filter(e=>String(e.date||'').slice(0,10)===iso);
      html+=`<div class="cal-day-v251${d.getMonth()!==m?' muted':''}">
        <div class="cal-num-v251">${d.getDate()}</div>
        ${dayRows.slice(0,4).map(geCalEventHTMLV2533).join('')}
        ${dayRows.length>4?`<button class="ge-cal-more-v2532" onclick="geCalShowDateV2533('${iso}')">+${dayRows.length-4} lainnya</button>`:''}
      </div>`;
    }
    grid.className='calendar-grid-v251';
    grid.innerHTML=html;
  } else if(view==='week'){
    const start=new Date(base);start.setDate(base.getDate()-base.getDay());
    if(window.geCalendarTitleV251)geCalendarTitleV251.textContent=
      `Minggu ${start.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}`;
    grid.className='calendar-week-r2';
    grid.innerHTML=Array.from({length:7},(_,i)=>{
      const d=new Date(start);d.setDate(start.getDate()+i);
      const iso=d.toLocaleDateString('en-CA');
      const rows=events.filter(e=>String(e.date||'').slice(0,10)===iso);
      return `<div class="calendar-week-col-r2"><h4>${d.toLocaleDateString('id-ID',{weekday:'short',day:'numeric'})}</h4>${rows.map(geCalEventHTMLV2533).join('')||'<small>Tidak ada agenda</small>'}</div>`;
    }).join('');
  } else if(view==='day'){
    const iso=base.toLocaleDateString('en-CA');
    const rows=events.filter(e=>String(e.date||'').slice(0,10)===iso)
      .sort((a,b)=>String(a.time||'99:99').localeCompare(String(b.time||'99:99')));
    if(window.geCalendarTitleV251)geCalendarTitleV251.textContent=
      base.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    grid.className='calendar-day-r2';
    grid.innerHTML=rows.map(e=>`<button class="calendar-day-event-r2" onclick='geCalOpenDetailV2533(${JSON.stringify(String(e.id))})'>
      <time>${geCalEscV2533(e.time||'All day')}</time><div><b>${geCalEscV2533(e.title)}</b><span>${geCalEscV2533(e.sourceLabel||e.category||'Event')} • ${geCalEscV2533(e.airport||'-')} • PIC ${geCalEscV2533(e.pic||'-')}</span></div></button>`).join('')||'<div class="planning-empty">Tidak ada agenda.</div>';
  } else {
    grid.style.display='none'; if(agenda)agenda.style.display='grid';
    if(window.geCalendarTitleV251)geCalendarTitleV251.textContent='Agenda';
    const rows=[...events].filter(e=>e.date).sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(0,200);
    if(agenda)agenda.innerHTML=rows.map(e=>`<button class="calendar-agenda-item-r2" onclick='geCalOpenDetailV2533(${JSON.stringify(String(e.id))})'>
      <time>${geCalEscV2533(e.date||'')}</time><div><b>${geCalEscV2533(e.title||'-')}</b><span>${geCalEscV2533(e.sourceLabel||e.category||'Event')} • ${geCalEscV2533(e.airport||'-')}</span></div></button>`).join('')||'<div class="planning-empty">Belum ada agenda.</div>';
  }

  const monthPrefix=`${y}-${String(m+1).padStart(2,'0')}`;
  const monthRows=events.filter(e=>String(e.date||'').startsWith(monthPrefix));
  if(window.geCalendarSummaryV251)geCalendarSummaryV251.innerHTML=
    `<span>${monthRows.length} agenda bulan ini</span><span>${monthRows.filter(e=>e.eventType==='initiative').length} initiative</span><span>${monthRows.filter(e=>e.eventType==='milestone').length} milestone</span><span>${monthRows.filter(e=>e.eventType==='manual').length} kegiatan manual</span>`;

  geCalRenderKPIV2533();
}

function geCalSetViewV2533(v,btn){
  window.GE_CAL_VIEW_R2=v;
  document.querySelectorAll('[data-cal-view]').forEach(x=>x.classList.remove('active'));
  btn?.classList.add('active');
  geCalRenderV2533();
}
function geCalMoveV2533(n){
  if(!(window.geV251CalDate instanceof Date))window.geV251CalDate=new Date();
  const v=window.GE_CAL_VIEW_R2||'month';
  if(v==='day')geV251CalDate.setDate(geV251CalDate.getDate()+n);
  else if(v==='week')geV251CalDate.setDate(geV251CalDate.getDate()+7*n);
  else geV251CalDate=new Date(geV251CalDate.getFullYear(),geV251CalDate.getMonth()+n,1);
  geCalRenderV2533();
}
function geCalTodayV2533(){window.geV251CalDate=new Date();geCalRenderV2533()}

/* self-contained add/update activity modal — avoids dependency on older calendar wrappers */
function geCalOpenActivityV2533(id=null){
  const modal=document.getElementById('geV251EventModal');
  if(!modal)return alert('Form kegiatan tidak tersedia pada halaman ini.');
  const e=id?(data.events||[]).find(x=>String(x.id)===String(id)):null;

  geV251EventIdR2.value=e?.id||'';
  geV251EventModalTitleR2.textContent=e?'Update Kegiatan':'Tambah Kegiatan';
  geV251EventTitle.value=e?.title||'';
  geV251EventDate.value=e?.date||new Date().toLocaleDateString('en-CA');
  geV251EventTime.value=e?.time||'';
  geV251EventAirport.value=e?.airport||'';
  geV251EventPicR2.value=e?.pic||'';
  geV251EventTouchpointR2.value=e?.touchpoint||geCalTPV2533(e).join(', ')||'';
  geV251EventCategory.value=e?.category||'Meeting';
  geV251EventPriorityR2.value=e?.priority||'Normal';
  geV251EventReminderR2.value=String(e?.reminder||0);
  geV251EventRemark.value=e?.remark||'';

  /* inject project fields once */
  if(!document.getElementById('geCalProjectFieldsV2533')){
    const form=modal.querySelector('.formgrid');
    form?.insertAdjacentHTML('beforeend',`
      <div id="geCalProjectFieldsV2533" class="span2 ge-cal-project-fields-v2533">
        <label>Jenis Kegiatan
          <select id="geCalActivityTypeV2533">
            <option value="standalone">Standalone Activity</option>
            <option value="initiative">Terkait Initiative</option>
          </select>
        </label>
        <label>Initiative Terkait
          <select id="geCalInitiativeV2533"><option value="">Tidak terkait Initiative</option></select>
        </label>
        <label>Journey Scope
          <select id="geCalJourneyEditV2533" multiple size="7">
            <option>Tidak Terkait Journey</option>
            <option>Pre-Journey</option><option>Pre-Flight</option><option>Post-Flight</option><option>Post-Journey</option>
            <option>Cross-Journey / End-to-End</option><option>Supporting / Enabler</option>
          </select>
        </label>
        <label>Touch Point
          <select id="geCalTouchEditV2533" multiple size="6"></select>
        </label>
      </div>`);
  }

  const initiativeSel=document.getElementById('geCalInitiativeV2533');
  initiativeSel.innerHTML='<option value="">Tidak terkait Initiative</option>'+
    (data.initiatives||[]).map(x=>`<option value="${geCalEscV2533(x.id)}">${geCalEscV2533(x.name||'-')}</option>`).join('');
  initiativeSel.value=e?.initiativeId||'';

  const allTP=geCalUniqueV2533([
    ...(data.touchpoints||[]).filter(x=>x.status!=='Inactive').map(x=>x.name||x.touchpoint||x.title||'')
  ]);
  geCalTouchEditV2533.innerHTML=allTP.map(x=>`<option>${geCalEscV2533(x)}</option>`).join('');

  geCalActivityTypeV2533.value=e?.activityType||'standalone';
  const scopes=geCalArrV2533(e?.journeyScopes);
  [...geCalJourneyEditV2533.options].forEach(o=>o.selected=scopes.length?scopes.includes(o.value):o.value==='Tidak Terkait Journey');
  const tps=geCalTPV2533(e);
  [...geCalTouchEditV2533.options].forEach(o=>o.selected=tps.includes(o.value));

  geV251DeleteEventR2.style.display=e?'':'none';
  modal.classList.add('show');
}

function geCalSaveActivityV2533(){
  const title=geV251EventTitle.value.trim(),date=geV251EventDate.value;
  if(!title||!date)return alert('Judul dan tanggal wajib diisi.');
  data.events=data.events||[];
  const id=geV251EventIdR2.value;
  const old=id?data.events.find(x=>String(x.id)===String(id)):null;
  const scopes=[...(document.getElementById('geCalJourneyEditV2533')?.selectedOptions||[])].map(o=>o.value);
  if(scopes.includes('Tidak Terkait Journey')&&scopes.length>1)return alert('"Tidak Terkait Journey" tidak dapat digabung dengan Journey Scope lain.');
  const tps=[...(document.getElementById('geCalTouchEditV2533')?.selectedOptions||[])].map(o=>o.value);

  const obj={...(old||{}),id:old?.id||Date.now(),title,date,time:geV251EventTime.value,
    airport:geV251EventAirport.value.trim().toUpperCase(),pic:geV251EventPicR2.value.trim(),
    touchpoint:tps.join(', '),touchpoints:tps,category:geV251EventCategory.value,
    priority:geV251EventPriorityR2.value,reminder:Number(geV251EventReminderR2.value||0),
    remark:geV251EventRemark.value.trim(),activityType:geCalActivityTypeV2533?.value||'standalone',
    initiativeId:geCalInitiativeV2533?.value||'',journeyScopes:scopes,source:'Manual'};
  if(old)Object.assign(old,obj);else data.events.push(obj);
  save();
  geV251EventModal.classList.remove('show');
  geCalBuildFiltersV2533();
  geCalRenderV2533();
}

document.addEventListener('change',e=>{
  if(e.target?.id!=='geCalInitiativeV2533')return;
  const x=(data.initiatives||[]).find(v=>String(v.id)===String(e.target.value));if(!x)return;
  geCalActivityTypeV2533.value='initiative';
  if(!geV251EventAirport.value)geV251EventAirport.value=x.airport||'';
  if(!geV251EventPicR2.value)geV251EventPicR2.value=x.pic||'';
  const scopes=geCalScopesV2533(x),tps=geCalTPV2533(x);
  [...geCalJourneyEditV2533.options].forEach(o=>o.selected=scopes.includes(o.value));
  [...geCalTouchEditV2533.options].forEach(o=>o.selected=tps.includes(o.value));
});

/* read-only detail for initiative / milestone */
function geCalEnsureDetailModalV2533(){
  if(document.getElementById('geCalDetailModalV2533'))return;
  document.body.insertAdjacentHTML('beforeend',`
    <div id="geCalDetailModalV2533" class="modal-backdrop">
      <div class="modal-card ge-cal-detail-v2533">
        <button class="modal-x" onclick="geCalDetailModalV2533.classList.remove('show')">×</button>
        <div id="geCalDetailBodyV2533"></div>
      </div>
    </div>`);
}
function geCalOpenDetailV2533(id){
  const e=geCalAllEventsV2533().find(x=>String(x.id)===String(id));if(!e)return;
  if(e.eventType==='manual')return geCalOpenActivityV2533(e.id);
  geCalEnsureDetailModalV2533();
  geCalDetailBodyV2533.innerHTML=`
    <span class="eyebrow">${geCalEscV2533(e.sourceLabel||e.category||'EVENT')}</span>
    <h2>${geCalEscV2533(e.title||'-')}</h2>
    <div class="ge-cal-detail-grid-v2533">
      <div><span>Tanggal</span><b>${geCalEscV2533(e.date||'-')}</b></div>
      <div><span>Station</span><b>${geCalEscV2533(e.airport||'-')}</b></div>
      <div><span>PIC</span><b>${geCalEscV2533(e.pic||'-')}</b></div>
      <div><span>Touch Point</span><b>${geCalEscV2533(geCalTPV2533(e).join(', ')||'-')}</b></div>
      <div><span>Journey Scope</span><b>${geCalEscV2533(geCalArrV2533(e.journeyScopes).join(', ')||'-')}</b></div>
      ${e.milestoneStatus?`<div><span>Status Milestone</span><b>${geCalEscV2533(e.milestoneStatus)}</b></div>`:''}
    </div>
    ${e.remark?`<p>${geCalEscV2533(e.remark)}</p>`:''}`;
  geCalDetailModalV2533.classList.add('show');
}
function geCalShowDateV2533(iso){
  geCalShowListV2533(`Agenda ${iso}`,geCalAllEventsV2533().filter(e=>String(e.date||'').slice(0,10)===iso));
}

function geCalEnsureListModalV2533(){
  if(document.getElementById('geCalListModalV2533'))return;
  document.body.insertAdjacentHTML('beforeend',`
    <div id="geCalListModalV2533" class="modal-backdrop">
      <div class="modal-card ge-cal-list-modal-v2532">
        <button class="modal-x" onclick="geCalListModalV2533.classList.remove('show')">×</button>
        <h2 id="geCalListTitleV2533">Data</h2>
        <div id="geCalListBodyV2533"></div>
      </div>
    </div>`);
}
function geCalShowListV2533(title,rows){
  geCalEnsureListModalV2533();
  geCalListTitleV2533.textContent=title;
  geCalListBodyV2533.innerHTML=rows.length?rows.map(e=>`
    <button class="ge-cal-list-row-v2532" ${e.id?`onclick='geCalOpenDetailV2533(${JSON.stringify(String(e.id))})'`:''}>
      <time>${geCalEscV2533(e.date||'-')} ${geCalEscV2533(e.time||'')}</time>
      <span><b>${geCalEscV2533(e.title||'-')}</b><small>${geCalEscV2533(e.sourceLabel||e.source||'')} • ${geCalEscV2533(e.airport||'-')}</small></span>
    </button>`).join(''):'<div class="planning-empty">Tidak ada data.</div>';
  geCalListModalV2533.classList.add('show');
}

function geCalRenderKPIV2533(){
  const box=document.getElementById('geProjectSummaryV253');if(!box)return;
  const all=geCalAllEventsV2533();
  const today=new Date().toLocaleDateString('en-CA'),month=today.slice(0,7);
  const initiatives=(data.initiatives||[]).map(x=>({
    id:(x.dueDate||x.due)?`initiative-${x.id}`:'',
    title:x.name||'-',date:x.dueDate||x.due||'',source:'Initiative',sourceLabel:'Initiative',
    airport:x.airport||'',pic:x.pic||'',initiativeId:x.id,eventType:'initiative',
    journeyScopes:geCalScopesV2533(x),touchpoints:geCalTPV2533(x)
  }));
  const manual=all.filter(e=>e.eventType==='manual');
  const monthRows=all.filter(e=>String(e.date||'').startsWith(month));
  const overdue=all.filter(e=>e.date&&String(e.date)<today);
  window.GE_CAL_KPI_ROWS_V2533=[initiatives,manual,monthRows,overdue];
  window.GE_CAL_KPI_LABELS_V2533=['Initiative','Kegiatan Manual','Agenda Bulan Ini','Overdue'];

  box.innerHTML=[
    [initiatives.length,'Initiative',0],[manual.length,'Kegiatan Manual',1],
    [monthRows.length,'Agenda Bulan Ini',2],[overdue.length,'Overdue',3]
  ].map(([n,l,i])=>`<button class="project-summary-card-v2532" onclick="geCalKpiClickV2533(${i})"><b>${n}</b><span>${l}</span><small>Lihat data →</small></button>`).join('');

  const up=document.getElementById('geUpcomingV253');
  if(up){
    const upcoming=all.filter(e=>String(e.date||'')>=today).sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(0,8);
    up.innerHTML=upcoming.map(e=>`<button onclick='geCalOpenDetailV2533(${JSON.stringify(String(e.id))})'><time>${geCalEscV2533(String(e.date||'').slice(5))}</time><span><b>${geCalEscV2533(e.title||'-')}</b><small>${geCalEscV2533(e.sourceLabel||e.source||'Event')} • ${geCalEscV2533(e.airport||'-')}</small></span></button>`).join('')||'<div class="planning-empty">Belum ada agenda berikutnya.</div>';
  }
}
function geCalKpiClickV2533(i){geCalShowListV2533(GE_CAL_KPI_LABELS_V2533[i],GE_CAL_KPI_ROWS_V2533[i]||[])}

/* correct active sidebar page only */
function geCalFixSidebarActiveV2533(){
  const page=(location.pathname.split('/').pop()||'index.html');
  document.querySelectorAll('.side a[href]').forEach(a=>{
    a.classList.toggle('active',(a.getAttribute('href')||'').split('?')[0]===page);
  });
}

window.addEventListener('DOMContentLoaded',()=>{
  geCalFixSidebarActiveV2533();
  if(!document.getElementById('geCalendarV251'))return;
  geCalBuildFiltersV2533();
  geCalRenderV2533();
});


/* ==============================================================
   V2.53.4 — Calendar UI / activity button / upcoming paging
   ============================================================== */

function geCalEventClassV2534(e){
  const t=String(e?.eventType||'').toLowerCase();
  if(t==='initiative') return 'event-initiative-v2534';
  if(t==='milestone') return 'event-milestone-v2534';
  return 'event-manual-v2534';
}

function geCalEventHTMLV2534(e){
  return `<button type="button"
    class="cal-event-v251 ${geCalEventClassV2534(e)}"
    onclick='geCalOpenDetailV2533(${JSON.stringify(String(e.id))})'>
    ${e.time?`<small>${geCalEscV2533(e.time)}</small> `:''}${geCalEscV2533(e.title||'-')}
  </button>`;
}

/* Replace calendar renderer only at event-color output level by wrapping current renderer helpers. */
const geCalRenderBaseV2534 = geCalRenderV2533;
geCalRenderV2533 = function(){
  const original = window.geCalEventHTMLV2533;
  window.geCalEventHTMLV2533 = geCalEventHTMLV2534;
  try { return geCalRenderBaseV2534(); }
  finally { window.geCalEventHTMLV2533 = original; }
};

/* Self-contained activity opener: no dependency on legacy wrappers. */
function geCalOpenActivityV2534(id=null){
  const modal=document.getElementById('geV251EventModal');
  if(!modal) return alert('Form kegiatan tidak ditemukan.');
  const e=id?(data.events||[]).find(x=>String(x.id)===String(id)):null;

  geV251EventIdR2.value=e?.id||'';
  geV251EventModalTitleR2.textContent=e?'Update Kegiatan':'Tambah Kegiatan';
  geV251EventTitle.value=e?.title||'';
  geV251EventDate.value=e?.date||new Date().toLocaleDateString('en-CA');
  geV251EventTime.value=e?.time||'';
  geV251EventAirport.value=e?.airport||'';
  geV251EventPicR2.value=e?.pic||'';
  geV251EventTouchpointR2.value=e?.touchpoint||'';
  geV251EventCategory.value=e?.category||'Meeting';
  geV251EventPriorityR2.value=e?.priority||'Normal';
  geV251EventReminderR2.value=String(e?.reminder||0);
  geV251EventRemark.value=e?.remark||'';
  geV251DeleteEventR2.style.display=e?'':'none';

  modal.classList.add('show');
}

/* Manual event detail should always use the new opener. */
const geCalOpenDetailBaseV2534 = geCalOpenDetailV2533;
geCalOpenDetailV2533 = function(id){
  const e=geCalAllEventsV2533().find(x=>String(x.id)===String(id));
  if(!e) return;
  if(e.eventType==='manual') return geCalOpenActivityV2534(e.id);
  return geCalOpenDetailBaseV2534(id);
};

function geCalRenderKPIV2534(){
  const box=document.getElementById('geProjectSummaryV253');
  if(!box) return;

  const all=geCalAllEventsV2533();
  const today=new Date().toLocaleDateString('en-CA');
  const month=today.slice(0,7);

  const initiatives=(data.initiatives||[]).map(x=>({
    id:(x.dueDate||x.due)?`initiative-${x.id}`:'',
    title:x.name||'-',
    date:x.dueDate||x.due||'',
    source:'Initiative',
    sourceLabel:'Initiative',
    airport:x.airport||'',
    pic:x.pic||'',
    initiativeId:x.id,
    eventType:'initiative',
    journeyScopes:geCalScopesV2533(x),
    touchpoints:geCalTPV2533(x)
  }));

  const manual=all.filter(e=>e.eventType==='manual');
  const monthRows=all.filter(e=>String(e.date||'').startsWith(month));
  const overdue=all.filter(e=>e.date&&String(e.date)<today);

  window.GE_CAL_KPI_ROWS_V2533=[initiatives,manual,monthRows,overdue];
  window.GE_CAL_KPI_LABELS_V2533=['Initiative','Kegiatan Manual','Agenda Bulan Ini','Overdue'];

  box.innerHTML=[
    [initiatives.length,'Initiative',0],
    [manual.length,'Kegiatan Manual',1],
    [monthRows.length,'Agenda Bulan Ini',2],
    [overdue.length,'Overdue',3]
  ].map(([n,l,i])=>`<button class="project-summary-card-v2532" onclick="geCalKpiClickV2533(${i})"><b>${n}</b><span>${l}</span><small>Lihat data →</small></button>`).join('');

  const up=document.getElementById('geUpcomingV253');
  if(up){
    const limit=Number(document.getElementById('geUpcomingLimitV2534')?.value||10);
    const upcoming=all
      .filter(e=>String(e.date||'')>=today)
      .sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.time||'').localeCompare(String(b.time||'')))
      .slice(0,limit);

    up.innerHTML=upcoming.map(e=>`
      <button class="upcoming-item-v2534 ${geCalEventClassV2534(e)}"
        onclick='geCalOpenDetailV2533(${JSON.stringify(String(e.id))})'>
        <time>${geCalEscV2533(String(e.date||'').slice(5))}</time>
        <span><b>${geCalEscV2533(e.title||'-')}</b>
        <small>${geCalEscV2533(e.sourceLabel||e.source||'Event')} • ${geCalEscV2533(e.airport||'-')}</small></span>
      </button>`).join('') || '<div class="planning-empty">Belum ada agenda berikutnya.</div>';
  }
}

/* Replace KPI renderer used by the calendar with the V2.53.4 one. */
const geCalRenderKPIBaseV2534 = geCalRenderKPIV2533;
geCalRenderKPIV2533 = geCalRenderKPIV2534;

window.addEventListener('DOMContentLoaded',()=>{
  if(document.getElementById('geCalendarV251')){
    geCalRenderKPIV2534();
  }
});


/* ==============================================================
   V2.53.5 — ROBUST ADD ACTIVITY MODAL
   Uses explicit DOM lookups; no reliance on element-id window globals.
   ============================================================== */
function geCalElV2535(id){return document.getElementById(id)}

function geCalEnsureProjectFieldsV2535(){
  const modal=geCalElV2535('geV251EventModal');
  if(!modal || geCalElV2535('geCalProjectFieldsV2535')) return;

  const form=modal.querySelector('.formgrid');
  if(!form)return;

  form.insertAdjacentHTML('beforeend',`
    <div id="geCalProjectFieldsV2535" class="span2 ge-cal-project-fields-v2533">
      <label>Jenis Kegiatan
        <select id="geCalActivityTypeV2535">
          <option value="standalone">Standalone Activity</option>
          <option value="initiative">Terkait Initiative</option>
        </select>
      </label>

      <label>Initiative Terkait
        <select id="geCalInitiativeV2535">
          <option value="">Tidak terkait Initiative</option>
        </select>
      </label>

      <label>Journey Scope
        <select id="geCalJourneyEditV2535" multiple size="7">
          <option>Tidak Terkait Journey</option>
          <option>Pre-Journey</option>
          <option>Pre-Flight</option>
          <option>Post-Flight</option>
          <option>Post-Journey</option>
          <option>Cross-Journey / End-to-End</option>
          <option>Supporting / Enabler</option>
        </select>
      </label>

      <label>Touch Point
        <select id="geCalTouchEditV2535" multiple size="6"></select>
      </label>
    </div>`);
}

function geCalPopulateActivitySelectorsV2535(e){
  const initSel=geCalElV2535('geCalInitiativeV2535');
  if(initSel){
    initSel.innerHTML='<option value="">Tidak terkait Initiative</option>'+
      (data.initiatives||[]).map(x=>`<option value="${geCalEscV2533(x.id)}">${geCalEscV2533(x.name||'-')}</option>`).join('');
    initSel.value=e?.initiativeId||'';
  }

  const touchSel=geCalElV2535('geCalTouchEditV2535');
  if(touchSel){
    const values=geCalUniqueV2533([
      ...(data.touchpoints||[]).map(x=>x.name||x.touchpoint||x.title||''),
      ...(data.initiatives||[]).flatMap(x=>geCalTPV2533(x)),
      ...geCalAllEventsV2533().flatMap(x=>geCalTPV2533(x))
    ]);
    touchSel.innerHTML=values.map(x=>`<option value="${geCalEscV2533(x)}">${geCalEscV2533(x)}</option>`).join('');
    const selected=geCalTPV2533(e);
    [...touchSel.options].forEach(o=>o.selected=selected.includes(o.value));
  }

  const scopeSel=geCalElV2535('geCalJourneyEditV2535');
  if(scopeSel){
    const selected=geCalArrV2533(e?.journeyScopes);
    [...scopeSel.options].forEach(o=>o.selected=selected.length?selected.includes(o.value):o.value==='Tidak Terkait Journey');
  }

  const typeSel=geCalElV2535('geCalActivityTypeV2535');
  if(typeSel)typeSel.value=e?.activityType||'standalone';
}

function geCalOpenActivityV2535(id=null){
  const modal=geCalElV2535('geV251EventModal');
  if(!modal){alert('Form Tambah Kegiatan tidak ditemukan.');return}

  data.events=data.events||[];
  const e=id?data.events.find(x=>String(x.id)===String(id)):null;

  geCalEnsureProjectFieldsV2535();

  const set=(id,value)=>{
    const el=geCalElV2535(id);
    if(el)el.value=value??'';
  };

  set('geV251EventIdR2',e?.id||'');
  const title=geCalElV2535('geV251EventModalTitleR2');
  if(title)title.textContent=e?'Update Kegiatan':'Tambah Kegiatan';

  set('geV251EventTitle',e?.title||'');
  set('geV251EventDate',e?.date||new Date().toLocaleDateString('en-CA'));
  set('geV251EventTime',e?.time||'');
  set('geV251EventAirport',e?.airport||'');
  set('geV251EventPicR2',e?.pic||'');
  set('geV251EventTouchpointR2',e?.touchpoint||geCalTPV2533(e).join(', ')||'');
  set('geV251EventCategory',e?.category||'Meeting');
  set('geV251EventPriorityR2',e?.priority||'Normal');
  set('geV251EventReminderR2',String(e?.reminder||0));
  set('geV251EventRemark',e?.remark||'');

  const del=geCalElV2535('geV251DeleteEventR2');
  if(del)del.style.display=e?'':'none';

  geCalPopulateActivitySelectorsV2535(e);
  modal.classList.add('show');

  /* focus confirms immediately to the operator that the modal is active */
  setTimeout(()=>geCalElV2535('geV251EventTitle')?.focus(),50);
}

function geCalSaveActivityV2535(){
  const val=id=>geCalElV2535(id)?.value??'';
  const title=val('geV251EventTitle').trim();
  const date=val('geV251EventDate');
  if(!title||!date){alert('Judul dan tanggal wajib diisi.');return}

  data.events=data.events||[];
  const id=val('geV251EventIdR2');
  const old=id?data.events.find(x=>String(x.id)===String(id)):null;

  const scopeSel=geCalElV2535('geCalJourneyEditV2535');
  const scopes=scopeSel?[...scopeSel.selectedOptions].map(o=>o.value):[];
  if(scopes.includes('Tidak Terkait Journey')&&scopes.length>1){
    alert('"Tidak Terkait Journey" tidak dapat digabung dengan Journey Scope lainnya.');
    return;
  }

  const touchSel=geCalElV2535('geCalTouchEditV2535');
  const touchpoints=touchSel?[...touchSel.selectedOptions].map(o=>o.value):geCalArrV2533(val('geV251EventTouchpointR2'));

  const obj={
    ...(old||{}),
    id:old?.id||Date.now(),
    title,
    date,
    time:val('geV251EventTime'),
    airport:val('geV251EventAirport').trim().toUpperCase(),
    pic:val('geV251EventPicR2').trim(),
    touchpoint:touchpoints.join(', '),
    touchpoints,
    category:val('geV251EventCategory')||'Meeting',
    priority:val('geV251EventPriorityR2')||'Normal',
    reminder:Number(val('geV251EventReminderR2')||0),
    remark:val('geV251EventRemark').trim(),
    activityType:val('geCalActivityTypeV2535')||'standalone',
    initiativeId:val('geCalInitiativeV2535')||'',
    journeyScopes:scopes,
    source:'Manual'
  };

  if(old)Object.assign(old,obj);
  else data.events.push(obj);

  save();

  geCalElV2535('geV251EventModal')?.classList.remove('show');
  if(typeof geCalBuildFiltersV2533==='function')geCalBuildFiltersV2533();
  if(typeof geCalRenderV2533==='function')geCalRenderV2533();
}

function geCalDeleteActivityV2535(){
  const id=geCalElV2535('geV251EventIdR2')?.value||'';
  if(!id)return;
  if(!confirm('Hapus kegiatan ini?'))return;
  data.events=(data.events||[]).filter(x=>String(x.id)!==String(id));
  save();
  geCalElV2535('geV251EventModal')?.classList.remove('show');
  if(typeof geCalBuildFiltersV2533==='function')geCalBuildFiltersV2533();
  if(typeof geCalRenderV2533==='function')geCalRenderV2533();
}

/* Initiative selection auto-populates project context. */
document.addEventListener('change',e=>{
  if(e.target?.id!=='geCalInitiativeV2535')return;
  const x=(data.initiatives||[]).find(v=>String(v.id)===String(e.target.value));
  if(!x)return;

  const type=geCalElV2535('geCalActivityTypeV2535');
  if(type)type.value='initiative';

  const airport=geCalElV2535('geV251EventAirport');
  if(airport&&!airport.value)airport.value=x.airport||'';

  const pic=geCalElV2535('geV251EventPicR2');
  if(pic&&!pic.value)pic.value=x.pic||'';

  const scopes=geCalScopesV2533(x);
  const scopeSel=geCalElV2535('geCalJourneyEditV2535');
  if(scopeSel)[...scopeSel.options].forEach(o=>o.selected=scopes.includes(o.value));

  const tps=geCalTPV2533(x);
  const touchSel=geCalElV2535('geCalTouchEditV2535');
  if(touchSel)[...touchSel.options].forEach(o=>o.selected=tps.includes(o.value));
});

/* Route manual event detail to the same robust editor. */
const geCalOpenDetailBaseV2535=geCalOpenDetailV2533;
geCalOpenDetailV2533=function(id){
  const e=geCalAllEventsV2533().find(x=>String(x.id)===String(id));
  if(!e)return;
  if(e.eventType==='manual')return geCalOpenActivityV2535(e.id);
  return geCalOpenDetailBaseV2535(id);
};

/* Bind by JS as well as inline onclick, for file:// browser reliability. */
window.addEventListener('DOMContentLoaded',()=>{
  const addBtn=document.querySelector('[data-calendar-add-v2535]');
  if(addBtn){
    addBtn.onclick=null;
    addBtn.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      geCalOpenActivityV2535();
    });
  }

  const saveBtn=geCalElV2535('geCalSaveActivityBtnV2535');
  if(saveBtn){
    saveBtn.onclick=null;
    saveBtn.addEventListener('click',e=>{
      e.preventDefault();
      geCalSaveActivityV2535();
    });
  }
});


/* P22/P23/P24 — Planning action visibility follows Access Level + Permission, not Role alone. */
(function(){
'use strict';
const PLANNING_PAGES_P22=new Set(['service-planning.html','planning-workspace.html','lounge-list.html','branch-office-planning.html','gaso-planning.html','planning-documents.html','station-material.html','bo-space.html','airport-systems.html','lounge-procurement.html']);
function applyPlanningActions(){
 const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
 if(!PLANNING_PAGES_P22.has(page))return;
 document.querySelectorAll('[data-admin-only]').forEach(el=>{el.style.display=gePlanningCanAction('Edit')?'':'none'});
}
window.addEventListener('DOMContentLoaded',()=>setTimeout(applyPlanningActions,120));
})();


/* User Management protection: existing Super Admin accounts are not ordinary edit targets. */
(function(){
'use strict';
const originalOpenUserModal=window.openUserModal;
if(originalOpenUserModal){
 window.openUserModal=function(id=null){
   const u=(window.data?.users||[]).find(x=>String(x.id)===String(id));
   if(u?.role==='Super Admin'){
     if(typeof geStorageNoticeV223==='function')geStorageNoticeV223('Super Admin Terlindungi','Akun Super Admin existing tidak dapat diedit melalui User Management.');
     else alert('Akun Super Admin existing tidak dapat diedit melalui User Management.');
     return;
   }
   return originalOpenUserModal(id);
 };
}
const originalRenderUserAccounts=window.renderUserAccounts;
if(originalRenderUserAccounts){
 window.renderUserAccounts=function(){
   const out=originalRenderUserAccounts.apply(this,arguments);
   document.querySelectorAll('#userAccountRows tr').forEach(row=>{
     const role=row.cells?.[5]?.textContent?.trim();
     if(role==='Super Admin'&&row.lastElementChild){row.lastElementChild.innerHTML='<span class="pill">Protected</span>';}
   });
   return out;
 };
}
})();

/* Consolidated project runtime. */
/* Compatibility shim for legacy pages that reference the historical project bundle.
 * The current project-tracking implementation remains in the existing page scripts.
 * This file intentionally has no destructive initialization or data migration.
 */
(function(){
  'use strict';
  window.GXProjectCompat = window.GXProjectCompat || {version:'2.54.4-compat',ready:true};
})();

/* Consolidated modal behavior. */
/* Compatibility shim for legacy modal enhancements. */
(function(){
  'use strict';
  window.GXModalCompat = window.GXModalCompat || {version:'2.54.4-compat',ready:true};
})();

/* Consolidated stability behavior. */

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
 if(title&&!document.getElementById('geInitiativeViewToggleR4')){const v=document.createElement('div');v.id='geInitiativeViewToggleR4';v.className='ge-initiative-view-toggle-r4';v.innerHTML='<button type="button" class="active" data-view="grid">Grid</button><button type="button" data-view="list">List</button>';title.appendChild(v);v.querySelectorAll('button').forEach(b=>b.onclick=()=>{window.GE_INITIATIVE_VIEW_R4=b.dataset.view;v.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));renderInitiatives();});}
 const grid=document.querySelector('.initiative-filter-grid-v226');
 if(grid&&!$('geV2554Priority')){
   const csv=[...grid.querySelectorAll('button')].find(b=>/(Unduh CSV|Unduh Data)/i.test(b.textContent||''));
   const s=document.createElement('select');s.id='geV2554Priority';s.innerHTML='<option value="">Semua Priority</option><option>Critical</option><option>High</option><option>Normal</option><option>Low</option>';s.onchange=()=>renderInitiatives();
   if(csv)grid.insertBefore(s,csv);else grid.appendChild(s);
 }
 const baseRender=window.renderInitiatives;
 window.renderInitiatives=function(){
   refreshInitiativeFilters();
   let rows=currentInitiativeRows().filter(geInitiativeScopedV224);
   const p=$('geV2554Priority')?.value||'';if(p)rows=rows.filter(x=>String(x.priority||'Normal')===p);
   const t=$('initRows');if(t){if(window.GE_INITIATIVE_VIEW_R4==='list'&&rows.length){t.innerHTML=`<div class="ge-initiative-list-r4"><table><thead><tr><th>Initiative</th><th>Journey</th><th>Touch Point</th><th>Station</th><th>PIC</th><th>Due</th><th>Progress</th><th>Action</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${geEsc(x.name||'-')}</b></td><td>${geEsc(geScopesV252(x).join(', '))}</td><td>${geEsc(geTPsV252(x).join(', '))}</td><td>${geEsc(x.airport||'-')}</td><td>${geEsc(x.pic||'-')}</td><td>${geEsc(x.dueDate||'-')}</td><td>${geEsc(String(x.real||0))}% / ${geEsc(String(x.plan||0))}%</td><td><button class="btn secondary compact-btn" onclick="openInitiativeModalV224(${Number(x.id)})">Update</button><button class="btn secondary compact-btn" onclick="openInitiativeTimelineV224(${Number(x.id)})">Milestone</button></td></tr>`).join('')}</tbody></table></div>`;}else t.innerHTML=rows.length?rows.map(geInitiativeCardV251).join(''):'<div class="initiative-empty-v246">Belum ada inisiatif pada filter ini.</div>';}
   renderInitiativeCharts(rows);
 };
 renderInitiatives();
}

/* Draft button: use the established V2.54.2 draft list. */
function bindCalendar(){
 const draft=$('geV2554DraftBtn');
 if(draft)draft.onclick=e=>{e.preventDefault();e.stopPropagation();window.geV2542OpenDrafts?.()};
 const add=document.querySelector('[data-calendar-add-v2535]');
 if(add)add.onclick=e=>{e.preventDefault();e.stopPropagation();if(typeof window.geCalOpenActivityV2535==='function')window.geCalOpenActivityV2535();else if(typeof window.geCalOpenActivityV2534==='function')window.geCalOpenActivityV2534();else if(typeof window.geV254OpenActivity==='function')window.geV254OpenActivity();};
 // Robust calendar navigation: keep one explicit calendar date state and render from it.
 window.geCalMoveV2533=function(n){
   const step=Number(n)||0;
   const view=window.GE_CAL_VIEW_R2||'month';
   const current=(typeof geV251CalDate!=='undefined'&&geV251CalDate instanceof Date)?geV251CalDate:new Date();
   const d=new Date(current.getTime());
   if(view==='day')d.setDate(d.getDate()+step);
   else if(view==='week')d.setDate(d.getDate()+7*step);
   else d.setMonth(d.getMonth()+step,1);
   geV251CalDate=d;
   window.geV251CalDate=new Date(d.getTime());
   if(typeof geCalRenderV2533==='function')geCalRenderV2533();
   else window.geCalRenderV2533?.();
 };
}
window.geBindCalendarControlsCanonical=bindCalendar;

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
 save();$('geV2554BulkModal').classList.remove('show');if(typeof renderInitiatives==='function')renderInitiatives();notice('Import selesai',`${created} dibuat • ${updated} diperbarui • ${skipped} dilewati.`,'success');
}

window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{installInitiativeControls();bindCalendar();ensureBulk();window.geV2554BindGantt?.()},80));
})();

/* SOURCE: assets/lounge-planning.js */
/* Ground Experience P29 — Lounge/Tenant planning, shared input contract,
   multi-period pricing and defensive rendering. No production migration. */
(function(){
  'use strict';

  const TYPES=['Lounge','Tenant','Snack Box'];
  const TYPE_SET=new Set(TYPES);
  const STATUS_VALUES=['Valid','Pending','Invalid'];
  const FIELD_HEADERS={
    region:'Region', station:'Station', name:'Nama Layanan / Provider', serviceType:'Jenis Layanan', pic:'PIC',
    currency:'Mata Uang', pricePerPax:'Harga Per Pax', startDate:'Tanggal Mulai', endDate:'Tanggal Berakhir',
    documentNumber:'Nomor Dokumen', documentType:'Jenis Dokumen', documentStatus:'Status Dokumen', remarks:'Remarks',
    priceEffectiveFrom:'Price Period Effective From', priceEffectiveTo:'Price Period Effective To',
    price:'Price Period Price', priceCurrency:'Price Period Currency', priceBasis:'Price Basis', priceNote:'Price Period Note'
  };

  const state={
    serviceType:'', editId:null, importRows:[], importGroups:[], importFileName:'', importSummary:null
  };

  const esc=v=>typeof geEsc==='function'?geEsc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const val=id=>document.getElementById(id)?.value??'';
  const notice=(title,message,type)=>typeof geStorageNoticeV223==='function'?geStorageNoticeV223(title,message,type):alert(message);
  const canCreate=()=>typeof gePlanningCanAction==='function'?gePlanningCanAction('Create'):typeof gxCanManage==='function'&&gxCanManage();
  const canEdit=()=>typeof gePlanningCanAction==='function'?gePlanningCanAction('Edit'):typeof gxCanManage==='function'&&gxCanManage();
  const canUpload=()=>typeof gePlanningCanAction==='function'?gePlanningCanAction('Upload'):canEdit();

  function validType(v){const s=String(v??'').trim();return TYPE_SET.has(s)?s:''}
  function resolveType(record){
    const rawCat=String(record?.serviceCategory??'').trim(),rawTyp=String(record?.serviceType??'').trim();
    const cat=validType(rawCat),typ=validType(rawTyp);
    if(rawCat&&rawTyp&&cat&&typ&&cat!==typ)return {value:'',status:'REVIEW',reason:'serviceCategory dan serviceType berbeda'};
    if(rawCat&&!cat)return {value:'',status:'REVIEW',reason:'serviceCategory tidak valid'};
    if(rawTyp&&!typ)return {value:'',status:'REVIEW',reason:'serviceType tidak valid'};
    if(cat)return {value:cat,status:'OK',source:'serviceCategory'};
    if(typ)return {value:typ,status:'OK',source:'serviceType'};
    return {value:'',status:'MISSING',reason:'Jenis layanan belum terkonfigurasi'};
  }
  window.geP29ResolveLoungeServiceType=resolveType;

  function validDate(v){
    const s=String(v??'').trim();
    if(!s)return '';
    if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return '';
    const [y,m,dn]=s.split('-').map(Number),d=new Date(Date.UTC(y,m-1,dn));
    if(Number.isNaN(d.getTime())||d.getUTCFullYear()!==y||d.getUTCMonth()!==m-1||d.getUTCDate()!==dn)return '';
    return s;
  }
  function dateLabel(v){
    const s=validDate(v); if(!s)return 'Not Available';
    try{return new Date(s+'T00:00:00').toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})}catch(e){return s}
  }
  const SUPPORTED_CURRENCIES=(()=>{try{return new Set(typeof Intl.supportedValuesOf==='function'?Intl.supportedValuesOf('currency'):['AUD','CAD','CHF','CNY','EUR','GBP','HKD','IDR','INR','JPY','KRW','MYR','NZD','SAR','SGD','THB','USD'])}catch(e){return new Set(['AUD','CAD','CHF','CNY','EUR','GBP','HKD','IDR','INR','JPY','KRW','MYR','NZD','SAR','SGD','THB','USD'])}})();
  function currencyCode(v){
    const s=String(v??'').trim().toUpperCase();
    if(!/^[A-Z]{3}$/.test(s)||!SUPPORTED_CURRENCIES.has(s))return '';
    try{new Intl.NumberFormat(undefined,{style:'currency',currency:s}).format(1);return s}catch(e){return ''}
  }
  function numeric(v){
    if(v===null||v===undefined||String(v).trim()==='')return null;
    const n=Number(String(v).replace(/,/g,''));
    return Number.isFinite(n)?n:null;
  }
  function csvCell(v){return '"'+String(v??'').replaceAll('"','""')+'"'}
  function safePriceDisplay(currency,price){
    const c=currencyCode(currency),n=numeric(price);
    if(!c||n===null)return 'Not Available';
    try{return `${c} ${n.toLocaleString(c==='IDR'?'id-ID':'en-US',{maximumFractionDigits:2})}`}catch(e){return `${c} ${n}`}
  }

  function normalizeSchedule(raw,agreementStart,agreementEnd,index){
    const from=validDate(raw?.effectiveFrom),to=validDate(raw?.effectiveTo),price=numeric(raw?.price),currency=currencyCode(raw?.currency);
    const errors=[];
    if(!from)errors.push('effectiveFrom tidak valid');
    if(!to)errors.push('effectiveTo tidak valid');
    if(from&&to&&to<from)errors.push('effectiveTo sebelum effectiveFrom');
    if(price===null||price<0)errors.push('price harus numerik dan >= 0');
    if(!currency)errors.push('currency tidak valid');
    if(agreementStart&&from&&from<agreementStart)errors.push('effectiveFrom di luar periode Agreement');
    if(agreementEnd&&to&&to>agreementEnd)errors.push('effectiveTo di luar periode Agreement');
    const basis=String(raw?.priceBasis??'').trim();
    return {ok:!errors.length,errors,effectiveFrom:from,effectiveTo:to,price,currency,priceBasis:basis,priceNote:String(raw?.priceNote??'').trim(),index};
  }

  function validateSchedules(schedules,agreementStart,agreementEnd){
    const out=(Array.isArray(schedules)?schedules:[]).map((s,i)=>normalizeSchedule(s,agreementStart,agreementEnd,i));
    const errors=out.flatMap(x=>x.errors.map(e=>`Price Period ${x.index+1}: ${e}`));
    const valid=out.filter(x=>x.ok).sort((a,b)=>a.effectiveFrom.localeCompare(b.effectiveFrom));
    for(let i=1;i<valid.length;i++){
      const prev=valid[i-1],cur=valid[i];
      if(cur.effectiveFrom<=prev.effectiveTo){
        errors.push(`Price Period ${cur.index+1} overlap dengan Price Period ${prev.index+1}`);
      }
    }
    return {schedules:out,valid:!errors.length&&out.length>0,errors};
  }

  function applicablePrice(record,asOf=new Date()){
    try{
      const schedules=Array.isArray(record?.priceSchedules)?record.priceSchedules:[];
      if(schedules.length){
        const d=asOf instanceof Date?asOf:new Date(asOf);
        if(Number.isNaN(d.getTime()))return {status:'INVALID',reason:'Tanggal referensi tidak valid'};
        const iso=d.toISOString().slice(0,10);
        const checked=validateSchedules(schedules,validDate(record.startDate),validDate(record.endDate));
        if(!checked.valid)return {status:'INVALID',reason:checked.errors.join('; ')};
        const matches=checked.schedules.filter(s=>s.ok&&s.effectiveFrom<=iso&&iso<=s.effectiveTo);
        if(matches.length>1)return {status:'INVALID',reason:'Price period overlap'};
        if(matches.length===1)return {status:'CURRENT',...matches[0],scheduleCount:schedules.length};
        return {status:'NOT_APPLICABLE',scheduleCount:schedules.length};
      }
      const n=numeric(record?.pricePerPax),c=currencyCode(record?.currency);
      if(n!==null&&n>0&&c)return {status:'LEGACY',price:n,currency:c,priceBasis:'pax',scheduleCount:0};
      return {status:'UNAVAILABLE',scheduleCount:0};
    }catch(e){return {status:'INVALID',reason:'Price data tidak dapat dibaca'};}
  }
  window.geP29ApplicableLoungePrice=applicablePrice;
  if(typeof window.displayLoungePrice==='function'){
    window.displayLoungePrice=function(record){
      const p=applicablePrice(record,new Date());
      if(p.status==='CURRENT'||p.status==='LEGACY')return safePriceDisplay(p.currency,p.price);
      return p.status==='INVALID'?'Requires Review':'-';
    };
  }
  if(typeof window.geServicePriceV243==='function'){
    const oldServicePrice=window.geServicePriceV243;
    window.geServicePriceV243=function(record){
      try{const p=applicablePrice(record,new Date());if(p.status==='CURRENT'||p.status==='LEGACY')return safePriceDisplay(p.currency,p.price);if(p.status==='INVALID')return 'Requires Review';}catch(e){};
      return oldServicePrice(record);
    };
  }

  function scheduleRowsFromForm(prefix){
    const rows=[...document.querySelectorAll(`#${prefix} .ge-p29-price-row`)].map(row=>({
      effectiveFrom:row.querySelector('[data-price-field="effectiveFrom"]')?.value||'',
      effectiveTo:row.querySelector('[data-price-field="effectiveTo"]')?.value||'',
      price:row.querySelector('[data-price-field="price"]')?.value||'',
      currency:row.querySelector('[data-price-field="currency"]')?.value||'',
      priceBasis:row.querySelector('[data-price-field="priceBasis"]')?.value||'',
      priceNote:row.querySelector('[data-price-field="priceNote"]')?.value||''
    }));
    return rows.filter(r=>Object.values(r).some(v=>String(v??'').trim()!==''));
  }

  function validateInput(raw){
    const errors=[];
    const airport=String(raw.station??raw.airport??'').trim().toUpperCase();
    const name=String(raw.name??raw.serviceName??'').trim();
    const serviceType=validType(raw.serviceType??raw.serviceCategory);
    const region=String(raw.region??'').trim();
    const pic=String(raw.pic??'').trim();
    const start=validDate(raw.startDate??raw.agreementStartDate);
    const end=validDate(raw.endDate??raw.agreementEndDate);
    if(!airport)errors.push('Station wajib diisi');
    if(airport && Array.isArray(data?.airports) && data.airports.length){
      const known=new Set(data.airports.map(a=>String(a.code||'').trim().toUpperCase()).filter(Boolean));
      const parts=airport.split('/').map(x=>x.trim()).filter(Boolean);
      if(parts.some(code=>!known.has(code)))errors.push('Station/Airport tidak ditemukan pada master: '+parts.filter(code=>!known.has(code)).join(', '));
    }
    if(!name)errors.push('Nama Layanan / Provider wajib diisi');
    if(!serviceType)errors.push('Jenis Layanan harus Lounge, Tenant, atau Snack Box');
    if(raw.startDate&&!start)errors.push('Tanggal Mulai tidak valid; gunakan YYYY-MM-DD');
    if(raw.endDate&&!end)errors.push('Tanggal Berakhir tidak valid; gunakan YYYY-MM-DD');
    if(start&&end&&end<start)errors.push('Tanggal Berakhir tidak boleh sebelum Tanggal Mulai');

    const singlePriceRaw=String(raw.pricePerPax??'').trim();
    const singleCurrencyRaw=String(raw.currency??'').trim();
    const singlePrice=singlePriceRaw===''?null:numeric(singlePriceRaw);
    const singleCurrency=singleCurrencyRaw===''?'':currencyCode(singleCurrencyRaw);
    if(singlePriceRaw!==''&&(singlePrice===null||singlePrice<0))errors.push('Harga Per Pax harus numerik dan >= 0');
    if((singlePriceRaw!==''&&singleCurrencyRaw==='')||(singlePriceRaw===''&&singleCurrencyRaw!==''))errors.push('Harga Per Pax dan Mata Uang harus diisi berpasangan');
    if(singleCurrencyRaw&&!singleCurrency)errors.push('Mata Uang tidak valid');

    const schedules=Array.isArray(raw.priceSchedules)?raw.priceSchedules:[];
    const checked=schedules.length?validateSchedules(schedules,start,end):{schedules:[],valid:false,errors:[]};
    errors.push(...checked.errors);
    if(schedules.length&&singlePriceRaw!=='')errors.push('Gunakan Price Schedule atau Harga Per Pax legacy, bukan keduanya sebagai sumber input');

    const status=String(raw.documentStatus??'Valid').trim()||'Valid';
    const normalized={
      region,airport,name,pic,serviceType,
      serviceCategory:serviceType,serviceType,
      startDate:start,endDate:end,startDisplay:start,endDisplay:end,
      documentNumber:String(raw.documentNumber??'').trim(),documentType:String(raw.documentType??'').trim(),
      documentStatus:status,remarks:String(raw.remarks??'').trim(),
      pricePerPax:singlePrice??0,currency:singleCurrency,priceDisplay:singlePrice!==null&&singleCurrency?safePriceDisplay(singleCurrency,singlePrice):'',
      priceSchedules:schedules.length?checked.schedules.filter(x=>x.ok).map(x=>({effectiveFrom:x.effectiveFrom,effectiveTo:x.effectiveTo,price:x.price,currency:x.currency,priceBasis:x.priceBasis||'pax',priceNote:x.priceNote||''})):[],
      capacitySchedules:(Array.isArray(raw.capacitySchedules)?raw.capacitySchedules:[]).map(r=>({effectiveFrom:String(r.effectiveFrom||''),effectiveTo:String(r.effectiveTo||''),capacity:Number(r.capacity||0),note:String(r.note||'')})).filter(r=>r.effectiveFrom||r.effectiveTo||r.capacity||r.note),
      agreementAction:String(raw.agreementAction||'new'),supersedesId:String(raw.supersedesId||'').trim()
    };
    if(errors.length)return {ok:false,errors,model:null};
    if(normalized.priceSchedules.length){
      const current=applicablePrice(normalized,new Date());
      if(current.status==='CURRENT'){
        normalized.pricePerPax=current.price;normalized.currency=current.currency;normalized.priceDisplay=safePriceDisplay(current.currency,current.price);
      }else{
        const first=normalized.priceSchedules[0];
        normalized.pricePerPax=0;normalized.currency=first.currency;normalized.priceDisplay='';
      }
    }
    return {ok:true,errors:[],model:normalized};
  }
  window.geP29NormalizeLoungeInput=validateInput;

  function renderPriceRows(containerId,schedules){
    const box=document.getElementById(containerId);if(!box)return;
    const rows=Array.isArray(schedules)&&schedules.length?schedules:[{}];
    box.innerHTML=rows.map((s,i)=>`<div class="ge-p29-price-row" data-index="${i}">
      <div><label>Effective From<input data-price-field="effectiveFrom" type="date" value="${esc(s.effectiveFrom||'')}"></label></div>
      <div><label>Effective To<input data-price-field="effectiveTo" type="date" value="${esc(s.effectiveTo||'')}"></label></div>
      <div><label>Price<input data-price-field="price" type="number" min="0" step="0.01" value="${esc(s.price??'')}"></label></div>
      <div><label>Currency<input data-price-field="currency" maxlength="3" placeholder="IDR" value="${esc(s.currency||'')}"></label></div>
      <div><label>Price Basis<input data-price-field="priceBasis" value="${esc(s.priceBasis||'pax')}" placeholder="pax"></label></div>
      <div><label>Note<input data-price-field="priceNote" value="${esc(s.priceNote||'')}"></label></div>
      <button type="button" class="btn secondary compact-btn ge-p29-remove-price" ${rows.length===1?'disabled':''}>Hapus</button>
    </div>`).join('');
    box.querySelectorAll('.ge-p29-remove-price').forEach(btn=>btn.addEventListener('click',()=>{btn.closest('.ge-p29-price-row')?.remove();if(!box.querySelector('.ge-p29-price-row'))renderPriceRows(containerId,[{}]);}));
  }
  function addPriceRow(containerId){
    const box=document.getElementById(containerId);if(!box)return;
    const current=scheduleRowsFromForm(containerId);
    current.push({});renderPriceRows(containerId,current);
  }
  window.geP29AddPriceRow=addPriceRow;

  function renderCapacityRows(containerId,schedules){
    const box=document.getElementById(containerId);if(!box)return;
    const rows=Array.isArray(schedules)&&schedules.length?schedules:[{}];
    box.innerHTML=rows.map((r,i)=>`<div class="ge-p29-price-row ge-p29-capacity-row" data-index="${i}">
      <div><label>Effective From<input data-capacity-field="effectiveFrom" type="date" value="${esc(r.effectiveFrom||'')}"></label></div>
      <div><label>Effective To<input data-capacity-field="effectiveTo" type="date" value="${esc(r.effectiveTo||'')}"></label></div>
      <div><label>Capacity (pax)<input data-capacity-field="capacity" type="number" min="0" step="1" value="${esc(r.capacity??'')}"></label></div>
      <div><label>Note<input data-capacity-field="note" value="${esc(r.note||'')}"></label></div>
      <button type="button" class="btn secondary compact-btn ge-p29-remove-capacity" ${rows.length===1?'disabled':''}>Hapus</button>
    </div>`).join('');
    box.querySelectorAll('.ge-p29-remove-capacity').forEach(btn=>btn.addEventListener('click',()=>{btn.closest('.ge-p29-capacity-row')?.remove();if(!box.querySelector('.ge-p29-capacity-row'))renderCapacityRows(containerId,[{}]);}));
  }
  function capacityRowsFromForm(containerId){return [...(document.getElementById(containerId)?.querySelectorAll('.ge-p29-capacity-row')||[])].map(row=>{const o={};row.querySelectorAll('[data-capacity-field]').forEach(el=>o[el.dataset.capacityField]=el.value);if(o.capacity!=='')o.capacity=Number(o.capacity);return o}).filter(o=>o.effectiveFrom||o.effectiveTo||o.capacity!==undefined||o.note)}
  window.geP29AddCapacityRow=function(containerId){const rows=capacityRowsFromForm(containerId);rows.push({});renderCapacityRows(containerId,rows)};
  function applicableCapacity(x,when=new Date()){
    const iso=when instanceof Date?when.toLocaleDateString('en-CA'):String(when||'');
    const rows=Array.isArray(x?.capacitySchedules)?x.capacitySchedules:[];
    const hit=rows.filter(r=>(!r.effectiveFrom||r.effectiveFrom<=iso)&&(!r.effectiveTo||r.effectiveTo>=iso)).sort((a,b)=>String(b.effectiveFrom||'').localeCompare(String(a.effectiveFrom||'')))[0];
    if(hit)return Number(hit.capacity||0);
    return Number(x?.capacity||x?.loungeCapacity||0);
  }
  function commonFormMarkup(prefix,model){
    const m=model||{};
    return `<div class="formgrid ge-p29-form-grid">
      <label>Region<select id="${prefix}Region"><option value="">Pilih Region</option><option ${m.region==='WEST'?'selected':''}>WEST</option><option ${m.region==='EAST'?'selected':''}>EAST</option><option ${m.region==='INT'?'selected':''}>INT</option></select></label>
      <label>Station<input id="${prefix}Airport" required value="${esc(m.airport||'')}" placeholder="CGK"></label>
      <label>Nama Layanan / Provider<input id="${prefix}Name" required value="${esc(m.name||'')}"></label>
      <label>Jenis Layanan<select id="${prefix}ServiceType" required><option value="">Pilih Jenis Layanan</option>${TYPES.map(t=>`<option value="${t}" ${m.serviceType===t?'selected':''}>${t}</option>`).join('')}</select></label>
      <label>PIC<input id="${prefix}Pic" value="${esc(m.pic||'')}"></label>
      <label>Record / Agreement Action<select id="${prefix}AgreementAction"><option value="new" ${!m.supersedesId?'selected':''}>New / Existing Active Agreement</option><option value="replacement" ${m.agreementAction==='replacement'?'selected':''}>Replacement</option><option value="amendment" ${m.agreementAction==='amendment'?'selected':''}>Amendment</option><option value="extension" ${m.agreementAction==='extension'?'selected':''}>Extension / Renewal</option></select></label>
      <label>Replaces Record ID<input id="${prefix}SupersedesId" value="${esc(m.supersedesId||'')}" placeholder="Isi bila menggantikan record lama"></label>
      <label>Agreement Start Date<input id="${prefix}Start" type="date" value="${esc(m.startDate||'')}"></label>
      <label>Agreement End Date<input id="${prefix}End" type="date" value="${esc(m.endDate||'')}"></label>
      <label>Mata Uang (single price)<input id="${prefix}Currency" maxlength="3" value="${esc(m.currency||'')}" placeholder="IDR"></label>
      <label>Harga Per Pax (single price)<input id="${prefix}Price" type="number" min="0" step="0.01" value="${m.pricePerPax?esc(m.pricePerPax):''}"></label>
      <label>Nomor Dokumen / Agreement Identity<input id="${prefix}DocumentNumber" value="${esc(m.documentNumber||'')}"></label>
      <label>Jenis Dokumen<input id="${prefix}DocumentType" value="${esc(m.documentType||'')}"></label>
      <label>Status Dokumen<input id="${prefix}DocumentStatus" list="geP29StatusOptions" value="${esc(m.documentStatus||'Valid')}"><datalist id="geP29StatusOptions">${STATUS_VALUES.map(s=>`<option value="${s}">`).join('')}</datalist></label>
      <label class="ge-p29-span2">Remarks<textarea id="${prefix}Remarks" rows="3">${esc(m.remarks||'')}</textarea></label>
    </div>
    <section class="ge-p29-price-section">
      <div class="ge-p29-section-head"><div><b>Price Schedule</b><small>Opsional. Gunakan ini bila satu Agreement memiliki lebih dari satu periode harga. Agreement Start/End tetap menjadi periode Agreement.</small></div><button type="button" class="btn secondary compact-btn" onclick="geP29AddPriceRow('${prefix}Prices')">+ Add Price Period</button></div>
      <div id="${prefix}Prices" class="ge-p29-price-rows"></div>
      <div class="ge-p29-input-note">Satu sumber input: jika Price Schedule digunakan, jangan isi Harga Per Pax single price. Currency harus berupa kode mata uang ISO 4217 yang dikenali browser.</div>
    </section>
    <section class="ge-p29-price-section ge-p29-capacity-section">
      <div class="ge-p29-section-head"><div><b>Capacity Schedule</b><small>Kapasitas dapat berubah per periode tanpa membuat master Lounge/Tenant baru.</small></div><button type="button" class="btn secondary compact-btn" onclick="geP29AddCapacityRow('${prefix}Capacity')">+ Add Capacity Period</button></div>
      <div id="${prefix}Capacity" class="ge-p29-price-rows"></div>
    </section>
    <label class="ge-p29-file-field">Lampiran Dokumen<input id="${prefix}Document" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"></label>`;
  }

  function setFormError(prefix,errors){
    const box=document.getElementById(prefix+'Errors');if(!box)return;
    box.innerHTML=errors.length?`<div class="ge-p29-form-errors"><b>Periksa input:</b><ul>${errors.map(esc).map(x=>`<li>${x}</li>`).join('')}</ul></div>`:'';
  }

  function collectForm(prefix){
    return {
      region:val(prefix+'Region'),station:val(prefix+'Airport'),name:val(prefix+'Name'),serviceType:val(prefix+'ServiceType'),pic:val(prefix+'Pic'),
      startDate:val(prefix+'Start'),endDate:val(prefix+'End'),currency:val(prefix+'Currency'),pricePerPax:val(prefix+'Price'),
      documentNumber:val(prefix+'DocumentNumber'),documentType:val(prefix+'DocumentType'),documentStatus:val(prefix+'DocumentStatus'),remarks:val(prefix+'Remarks'),
      agreementAction:val(prefix+'AgreementAction')||'new',supersedesId:val(prefix+'SupersedesId'),
      priceSchedules:scheduleRowsFromForm(prefix+'Prices'),capacitySchedules:capacityRowsFromForm(prefix+'Capacity')
    };
  }

  function replaceModalContent(id,title,prefix,model){
    const modal=document.getElementById(id);if(!modal)return;
    const card=modal.querySelector('.modal-card');if(!card)return;
    card.innerHTML=`<button class="modal-x" type="button" onclick="${id==='loungeAddModalV221'?'closeLoungeAddModalV221()':'closeLoungeEdit()'}">×</button>
      <h2>${esc(title)}</h2><p class="section-subtitle">Satu struktur data untuk Add, Update, dan CSV. Lounge dan Tenant tetap merupakan Service Type yang berbeda.</p>
      <form id="${prefix}Form"><div id="${prefix}Errors"></div>${commonFormMarkup(prefix,model)}
      <div class="modal-actions sticky-actions"><button class="btn" type="submit">${id==='loungeAddModalV221'?'Simpan Layanan':'Simpan Update'}</button><button class="btn secondary" type="button" onclick="${id==='loungeAddModalV221'?'closeLoungeAddModalV221()':'closeLoungeEdit()'}">Batal</button></div></form>`;
    renderPriceRows(prefix+'Prices',model?.priceSchedules||[]);
    renderCapacityRows(prefix+'Capacity',model?.capacitySchedules||[]);
    document.getElementById(prefix+'Form').addEventListener('submit',e=>{e.preventDefault();id==='loungeAddModalV221'?saveAdd(prefix):saveEdit(prefix)});
    modal.classList.add('show');
  }

  window.openLoungeAddModalV230=function(){
    if(!canCreate())return;
    state.editId=null;replaceModalContent('loungeAddModalV221','Tambah Layanan Lounge/Tenant','geP29Add',{});
  };
  window.closeLoungeAddModalV221=function(){document.getElementById('loungeAddModalV221')?.classList.remove('show')};
  window.openLoungeEdit=function(id){
    if(!canEdit())return;
    const x=(data.lounges||[]).find(a=>String(a.id)===String(id));if(!x)return;
    const rt=resolveType(x);
    state.editId=x.id;
    const model={...x,serviceType:rt.value};
    if(Array.isArray(x.priceSchedules)&&x.priceSchedules.length){model.pricePerPax='';model.currency='';model.priceDisplay='';}
    replaceModalContent('loungeEditModal','Update Layanan Lounge/Tenant','geP29Edit',model);
    if(rt.status==='REVIEW')setFormError('geP29Edit',[rt.reason+'; koreksi melalui Update sebelum menyimpan.']);
  };
  window.closeLoungeEdit=function(){document.getElementById('loungeEditModal')?.classList.remove('show')};

  async function saveNormalized(model,old,file,prefix){
    let documentName=old?.documentName||'',documentKey=old?.documentKey||'';
    if(file){documentKey='lounge_doc_'+Date.now();try{if(window.GEFiles?.put)await GEFiles.put(documentKey,file);documentName=file.name}catch(e){setFormError(prefix,['Lampiran gagal disimpan: '+(e.message||'Unknown error')]);return false}}
    const obj={...(old||{}),...model,documentName,documentKey,id:old?.id||Date.now(),no:old?.no??'',priceDisplay:model.priceDisplay||old?.priceDisplay||''};
    if(old&&Array.isArray(old.priceSchedules)&&!model.priceSchedules.length)delete obj.priceSchedules;
    data.lounges=data.lounges||[];
    if(old){const i=data.lounges.findIndex(x=>String(x.id)===String(old.id));if(i<0)return false;data.lounges[i]=obj}
    else {
      if(obj.supersedesId&&obj.agreementAction!=='new'){const prior=data.lounges.find(x=>String(x.id)===String(obj.supersedesId));if(prior){prior.supersededBy=obj.id;prior.supersededAt=new Date().toISOString();prior.recordStatus='Superseded';}}
      obj.recordStatus=obj.recordStatus||'Active';data.lounges.push(obj);
    }
    try{save()}catch(e){notice('Data Tidak Tersimpan','Perubahan tidak dapat disimpan: '+(e.message||'Unknown error'),'warning');return false}
    return true;
  }
  async function saveAdd(prefix){
    if(!canCreate())return;
    const raw=collectForm(prefix),check=validateInput(raw);setFormError(prefix,check.errors);
    if(!check.ok)return;
    const file=document.getElementById(prefix+'Document')?.files?.[0];
    if(!await saveNormalized(check.model,null,file,prefix))return;
    closeLoungeAddModalV221();fillAirportSelects?.();renderLounges?.();renderLoungeCardsV237?.();renderLoungePriceSummaryV243?.();
    notice('Layanan Tersimpan',`${check.model.serviceType} — ${check.model.name} berhasil ditambahkan.`,'success');
  }
  async function saveEdit(prefix){
    if(!canEdit())return;
    const old=(data.lounges||[]).find(x=>String(x.id)===String(state.editId));if(!old)return;
    const raw=collectForm(prefix),check=validateInput(raw);setFormError(prefix,check.errors);
    if(!check.ok)return;
    const file=document.getElementById(prefix+'Document')?.files?.[0];
    if(!await saveNormalized(check.model,old,file,prefix))return;
    closeLoungeEdit();fillAirportSelects?.();renderLounges?.();renderLoungeCardsV237?.();renderLoungePriceSummaryV243?.();
    notice('Layanan Diperbarui',`${check.model.serviceType} — ${check.model.name} berhasil diperbarui.`,'success');
  }

  function populateFilterOptions(){
    const provider=document.getElementById('loungeNameFilter'),status=document.getElementById('loungeStatusFilter');
    const put=(el,values,label)=>{if(!el)return;const cur=el.value,items=[...new Set(values.map(v=>String(v??'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));el.innerHTML=`<option value="">${label}</option>`+items.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');el.value=items.includes(cur)?cur:''};
    put(provider,(data.lounges||[]).map(x=>x.name),'Semua Nama Layanan / Provider');
    put(status,(data.lounges||[]).map(x=>x.documentStatus),'Semua Status Dokumen');
  }

  function filterType(){return document.querySelector('[data-ge-p29-service-filter].active')?.dataset.geP29ServiceFilter||''}
  function filteredRows(){
    const base=(data.lounges||[]).slice();
    const region=val('loungeRegionFilter'),station=val('loungeAirportFilter'),provider=val('loungeNameFilter'),status=val('loungeStatusFilter'),type=filterType(),q=(document.getElementById('loungeFilterTextR6')?.value||'').trim().toLowerCase();
    const showHistory=!!document.getElementById('geP29ShowHistory')?.checked;
    return base.filter(x=>{
      const rt=resolveType(x),t=rt.value;
      if(!showHistory&&(x.recordStatus==='Superseded'||x.supersededBy))return false;
      const text=[x.region,x.airport,x.name,t,x.serviceCategory,x.documentNumber,x.documentType,x.documentStatus,x.remarks].map(v=>String(v||'')).join(' ').toLowerCase();
      return (!q||text.includes(q))&&(!region||String(x.region||'')===region)&&(!station||String(x.airport||'')===station)&&(!provider||String(x.name||'')===provider)&&(!status||String(x.documentStatus||'')===status)&&(!type||t===type);
    });
  }
  window.loungeFiltered=function(){return filteredRows()};
  window.geLoungeCardSourceV237=function(){return filteredRows()};

  function statusForAgreement(x){
    const end=validDate(x?.endDate);if(!end)return {label:'Status tidak ditentukan',cls:'neutral'};
    const d=new Date(end+'T23:59:59');if(Number.isNaN(d.getTime()))return {label:'Requires Review',cls:'warning'};
    const now=new Date();if(d<now)return {label:'Agreement expired',cls:'warning'};
    const days=Math.ceil((d-now)/86400000);return days<90?{label:days+' hari tersisa',cls:'warning'}:days<180?{label:days+' hari tersisa',cls:'warning'}:{label:days+' hari tersisa',cls:'good'};
  }

  function renderCards(){
    const grid=document.getElementById('loungeCardGridV237');if(!grid)return;
    const rows=filteredRows(),pageSize=12,pages=Math.max(1,Math.ceil(rows.length/pageSize));
    if(typeof GE_LOUNGE_CARD_PAGE_V237!=='number')GE_LOUNGE_CARD_PAGE_V237=1;
    GE_LOUNGE_CARD_PAGE_V237=Math.min(Math.max(1,GE_LOUNGE_CARD_PAGE_V237),pages);
    const start=(GE_LOUNGE_CARD_PAGE_V237-1)*pageSize,slice=rows.slice(start,start+pageSize);
    grid.innerHTML=slice.map(x=>{
      const rt=resolveType(x),type=rt.value||'Requires Review',stateA=statusForAgreement(x),price=applicablePrice(x,new Date());
      const scheduleCount=Array.isArray(x.priceSchedules)?x.priceSchedules.length:0,capacity=applicableCapacity(x,new Date());
      const priceText=price.status==='CURRENT'||price.status==='LEGACY'?safePriceDisplay(price.currency,price.price):price.status==='NOT_APPLICABLE'?'Not Available':price.status==='INVALID'?'Requires Review':'Not Available';
      const priceMeta=scheduleCount?`${scheduleCount} Price Period${scheduleCount===1?'':'s'}`:'';
      const review=rt.status==='REVIEW'?`<div class="ge-p29-review-note">Requires Review: ${esc(rt.reason)}</div>`:'';
      const update=canEdit()?`<button class="btn secondary compact-btn" type="button" onclick="openLoungeEdit(${Number(x.id)})">Update</button>`:'';
      const del=typeof geIsAdmin==='function'&&geIsAdmin()?`<button class="btn danger compact-btn" type="button" onclick="deleteLoungeV239(${Number(x.id)})">Hapus</button>`:'';
      const detail=scheduleCount?`<button class="btn secondary compact-btn" type="button" onclick="geP29ViewPriceSchedule(${Number(x.id)})">View Price Schedule</button>`:'';
      return `<article class="lounge-master-card-v237 ge-p29-lounge-card">
        <div class="lounge-master-code-v237">${esc(x.airport||'-')}</div>
        <div class="lounge-master-card-body-v237">
          <div class="lounge-master-card-top-v237"><span class="lounge-type-pill-v237">${esc(type)}</span><span class="lounge-days-pill-v237 ${stateA.cls}">${esc(stateA.label)}</span></div>
          <h3 title="${esc(x.name||'')} ">${esc(x.name||'Not Available')}</h3>
          <div class="ge-p29-card-fields">
            <div><dt>Agreement Status</dt><dd>${esc(x.documentStatus||'Not Available')}</dd></div>
            <div><dt>Agreement Period</dt><dd>${dateLabel(x.startDate)} — ${dateLabel(x.endDate)}</dd></div>
            <div><dt>Current Price</dt><dd>${esc(priceText)}</dd></div>
            <div><dt>Current Capacity</dt><dd>${capacity?esc(capacity)+' pax':'Not Available'}</dd></div>
            ${priceMeta?`<div><dt>Price Schedule</dt><dd>${esc(priceMeta)}</dd></div>`:''}
            <div><dt>Agreement</dt><dd>${esc(x.documentNumber||'Not Available')}</dd></div>
          </div>${review}
          <div class="lounge-card-actions-v237">${detail}${update}${del}</div>
        </div>
      </article>`;
    }).join('')||'<div class="lounge-master-empty-v237">Belum ada data Lounge/Tenant pada filter ini.</div>';
    const info=document.getElementById('loungeCardPageInfoV237');if(info)info.textContent=`Halaman ${GE_LOUNGE_CARD_PAGE_V237} dari ${pages} • ${rows.length} data`;
    const prev=document.getElementById('loungeCardPrevV237'),next=document.getElementById('loungeCardNextV237');if(prev)prev.disabled=GE_LOUNGE_CARD_PAGE_V237<=1;if(next)next.disabled=GE_LOUNGE_CARD_PAGE_V237>=pages;
  }
  window.renderLoungeCardsV237=renderCards;

  function renderTable(){
    const tbody=document.getElementById('loungeRows');if(!tbody)return;
    const rows=filteredRows();
    tbody.innerHTML=rows.map((x,i)=>{
      const rt=resolveType(x),p=applicablePrice(x,new Date()),price=p.status==='CURRENT'||p.status==='LEGACY'?safePriceDisplay(p.currency,p.price):'Not Available';
      const action=canEdit()?`<td><div class="row-actions"><button class="btn secondary" onclick="openLoungeEdit(${Number(x.id)})">Update</button><button class="btn btn-danger" onclick="deleteLoungeV239(${Number(x.id)})">Hapus</button></div></td>`:'';
      return `<tr><td>${i+1}</td><td>${esc(x.region||'-')}</td><td><b>${esc(x.airport||'Not Available')}</b></td><td><b>${esc(x.name||'Not Available')}</b></td><td><span class="pill">${esc(rt.value||'Requires Review')}</span></td><td>${esc(price)}</td><td>${dateLabel(x.startDate)}</td><td>${dateLabel(x.endDate)}</td><td>${esc(x.documentNumber||'-')}</td><td>${esc(x.documentType||'-')}</td><td>${esc(x.documentStatus||'Not Available')}</td><td>${esc(x.remarks||'-')}</td><td>${x.documentKey?`<button class="btn secondary" onclick="GEFiles.download('${esc(x.documentKey)}','${esc(x.documentName||'document')}')">Unduh</button>`:esc(x.documentName||'-')}</td>${action}</tr>`;
    }).join('');
  }
  const geP29RenderTableBaseR4=renderTable;renderTable=function(){geP29RenderTableBaseR4();setTimeout(()=>window.geEnhanceAllTables?.(),0)};
  window.renderLounges=function(){try{populateFilterOptions();renderTable();renderCards();renderPriceSummary();}catch(e){console.error('P29 Lounge render guard',e);const g=document.getElementById('loungeCardGridV237');if(g)g.innerHTML='<div class="lounge-master-empty-v237">Data Lounge/Tenant tidak dapat ditampilkan. Periksa data yang memerlukan review.</div>';}};

  function renderPriceSummary(){
    const box=document.getElementById('loungePriceSummaryV243');if(!box)return;
    const groups={};filteredRows().forEach(x=>{const p=applicablePrice(x,new Date());if((p.status==='CURRENT'||p.status==='LEGACY')&&p.currency&&Number.isFinite(p.price)) (groups[p.currency]??=[]).push(p.price)});
    const entries=Object.entries(groups).sort(([a],[b])=>a.localeCompare(b));
    box.innerHTML=entries.length?entries.map(([c,vals])=>{const avg=vals.reduce((s,v)=>s+v,0)/vals.length;return `<article class="lounge-price-currency-card-v243"><div class="lounge-price-currency-v243">${esc(c)}</div><div><span>Rata-rata current</span><b>${esc(safePriceDisplay(c,avg))}</b></div><div><span>Terendah</span><b>${esc(safePriceDisplay(c,Math.min(...vals)))}</b></div><div><span>Tertinggi</span><b>${esc(safePriceDisplay(c,Math.max(...vals)))}</b></div><small>${vals.length} harga current</small></article>`}).join(''):'<div class="lounge-price-empty-v243">Belum ada harga current yang dapat dihitung dari data valid.</div>';
    const count=document.getElementById('loungePriceSummaryCountV243');if(count)count.textContent=`${Object.values(groups).reduce((n,v)=>n+v.length,0)} harga current`;
  }
  window.renderLoungePriceSummaryV243=renderPriceSummary;

  function downloadTemplate(){
    if(!canUpload())return;
    const lines=[
      '# Template CSV Layanan Lounge / Tenant',
      '# Required: Station, Nama Layanan / Provider, Jenis Layanan',
      '# Jenis Layanan: Lounge / Tenant / Snack Box. Date: YYYY-MM-DD. Currency: ISO 4217.',
      '# Single price: isi Harga Per Pax + Mata Uang. Multi price: ulangi Agreement Number yang sama pada beberapa baris dan isi Price Period fields.',
      '# Multi price rows dengan Agreement Number yang sama membentuk SATU Agreement + beberapa Price Period. Import bersifat CREATE-only; duplikat diblokir sebelum commit.',
      Object.values(FIELD_HEADERS).map(csvCell).join(','),
      ''
    ];
    const blob=new Blob(['\ufeff'+lines.join('\r\n')+'\r\n'],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Template_Layanan_Lounge_Tenant_P29.csv';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},300);
  }
  window.downloadLoungeTemplateV230=downloadTemplate;

  function aliases(){
    return Object.fromEntries(Object.entries(FIELD_HEADERS).map(([k,h])=>[k,[h,h.replaceAll(' ','_'),k]]));
  }
  window.geP29CSVContractHeaders=()=>Object.values(FIELD_HEADERS).slice();
  window.geP29NormalizeCSVRows=(rows)=>normalizeImportRows(rows);


  function rowFromObject(r,rowNumber){
    const agreementNumber=String(r.documentNumber??'').trim();
    const scheduleValues=[r.priceEffectiveFrom,r.priceEffectiveTo,r.price,r.priceCurrency,r.priceBasis,r.priceNote].map(v=>String(v??'').trim());
    const requiredScheduleValues=scheduleValues.slice(0,4),anySchedule=scheduleValues.some(Boolean),allSchedule=requiredScheduleValues.every(Boolean);
    const raw={...r};
    raw.station=r.station;raw.name=r.name;raw.serviceType=r.serviceType;
    raw.startDate=geNormalizeDateUploadV223(r.startDate);raw.endDate=geNormalizeDateUploadV223(r.endDate);
    raw.priceSchedules=anySchedule?[{effectiveFrom:geNormalizeDateUploadV223(r.priceEffectiveFrom),effectiveTo:geNormalizeDateUploadV223(r.priceEffectiveTo),price:r.price,currency:r.priceCurrency,priceBasis:r.priceBasis,priceNote:r.priceNote}]:[];
    const check=validateInput(raw);
    const warnings=[];
    if(anySchedule&&!allSchedule)warnings.push('Price Period belum lengkap');
    if(!agreementNumber&&anySchedule)warnings.push('Nomor Dokumen / Agreement Identity wajib untuk grouping multi-price');
    if(anySchedule&&!check.ok){};
    return {rowNumber,raw,check,warnings,agreementNumber};
  }

  function normalizeImportRows(rows){
    const normalized=(rows||[]).map((r,i)=>rowFromObject(r,i+1));
    const groups=new Map(),invalid=[],singleKeys=new Map();
    normalized.forEach(item=>{
      if(item.warnings.length||!item.check.ok){invalid.push(item);return}
      const m=item.check.model;
      const multi=Array.isArray(m.priceSchedules)&&m.priceSchedules.length>0;
      if(!multi){
        const key=`single:${m.airport}|${m.name.toLowerCase()}|${m.documentNumber}`;
        if(singleKeys.has(key)){item.warnings.push(`Potential duplicate within import; same Station + Provider + Nomor Dokumen as row ${singleKeys.get(key)}`);invalid.push(item);return}
        singleKeys.set(key,item.rowNumber);
        groups.set(`row:${item.rowNumber}`,{key,rows:[item],model:{...m,priceSchedules:[]},rowNumbers:[item.rowNumber]});
        return;
      }
      const identity=item.agreementNumber;
      const key=`agreement:${m.airport}|${identity}`;
      if(!groups.has(key))groups.set(key,{key,rows:[],model:null,rowNumbers:[]});
      groups.get(key).rows.push(item);groups.get(key).rowNumbers.push(item.rowNumber);
    });
    for(const g of groups.values()){
      if(g.rows.length>1){
        const first=g.rows[0].check.model;
        const comparable=['airport','name','serviceType','region','startDate','endDate','documentType','documentStatus'];
        const inconsistent=comparable.filter(key=>g.rows.some(r=>String(r.check.model[key]??'')!==String(first[key]??'')));
        if(inconsistent.length){g.error='Field Agreement tidak konsisten antar-row: '+inconsistent.join(', ');continue}
        const scheduleRows=g.rows.map(r=>r.check.model.priceSchedules[0]);
        const base={...first,priceSchedules:scheduleRows};
        const re=validateInput({...base,pricePerPax:'',currency:''});
        g.model=re.ok?re.model:null;
        if(!re.ok){g.error=re.errors.join('; ')}
      }else g.model=g.rows[0].check.model;
    }
    const singleAgreementKeys=new Set([...groups.values()].filter(g=>g.rows.length===1&&!g.rows[0].check.model.priceSchedules.length).map(g=>duplicateKey(g.model)));
    [...groups.values()].filter(g=>g.rows.length>1).forEach(g=>{if(g.model&&singleAgreementKeys.has(duplicateKey(g.model)))g.error='Conflict: single-price row dan multi-price row memakai Agreement identity yang sama';});
    return {normalized,groups:[...groups.values()],invalid};
  }

  function duplicateKey(m){return `${String(m.airport||'').toUpperCase()}|${String(m.name||'').trim().toLowerCase()}|${String(m.documentNumber||'').trim()}`}
  function existingDuplicate(m){
    const key=duplicateKey(m);return (data.lounges||[]).some(x=>duplicateKey(x)===key);
  }
  function buildImportPreview(result){
    const total=result.normalized.length,invalid=result.invalid.length+result.groups.filter(g=>g.error).reduce((n,g)=>n+g.rows.length,0),validGroups=result.groups.filter(g=>!g.error),duplicates=validGroups.filter(g=>existingDuplicate(g.model));
    const warnings=result.normalized.filter(x=>x.warnings.length).length;
    validGroups.forEach(g=>{if(existingDuplicate(g.model))g.error='Potential duplicate existing agreement';});
    const valid=validGroups.filter(g=>!g.error).reduce((n,g)=>n+g.rows.length,0);
    return {total,valid,warnings,invalid:invalid+duplicates.reduce((n,g)=>n+g.rows.length,0),groups:result.groups};
  }

  function previewMarkup(result,summary){
    const rows=result.normalized.map(item=>{
      const m=item.check.model||item.raw,errs=[...(item.warnings||[]),...(item.check.errors||[])];
      const group=result.groups.find(g=>g.rowNumbers.includes(item.rowNumber));
      if(group?.error)errs.push(group.error);
      const dup=group&&!group.error&&existingDuplicate(group.model);if(dup)errs.push('Potential duplicate existing agreement');
      const ok=!errs.length;
      const p=m.priceSchedules?.[0];
      return `<tr><td>${item.rowNumber}</td><td>${esc(m.airport||'-')}</td><td>${esc(m.serviceType||'-')}</td><td>${esc(m.name||'-')}</td><td>${esc(m.documentNumber||'-')}</td><td>${esc(m.startDate||'-')} — ${esc(m.endDate||'-')}</td><td>${esc(p?safePriceDisplay(p.currency,p.price):safePriceDisplay(m.currency,m.pricePerPax))}${p?`<br><small>${esc(p.effectiveFrom)} — ${esc(p.effectiveTo)}</small>`:''}</td><td><span class="ge-p29-import-status ${ok?'ok':'invalid'}">${ok?'CREATE':'INVALID'}</span></td><td>${esc(errs.join('; ')||'Ready')}</td></tr>`;
    }).join('');
    return `<div class="ge-p29-import-summary"><span>Total <b>${summary.total}</b></span><span>Valid <b>${summary.valid}</b></span><span>Warnings <b>${summary.warnings}</b></span><span>Invalid <b>${summary.invalid}</b></span></div><div class="bulk-preview-table ge-p29-import-table"><table><thead><tr><th>Row</th><th>Station</th><th>Type</th><th>Provider</th><th>Agreement Number</th><th>Agreement Period</th><th>Price / Price Period</th><th>Status</th><th>Validation Message</th></tr></thead><tbody>${rows||'<tr><td colspan="9">Tidak ada data</td></tr>'}</tbody></table></div><p class="ge-p29-import-note">Import mode: CREATE-only. Baris invalid dan duplicate tidak ditulis. Baris multi-price dengan Agreement Number yang sama digabung menjadi satu Agreement dengan beberapa Price Period.</p>`;
  }

  const originalOpen=window.openBulkImportV223;
  window.openBulkImportV223=function(type){
    if(type!=='lounge')return originalOpen?.(type);
    if(!canUpload())return;
    state.importRows=[];state.importGroups=[];state.importSummary=null;state.importFileName='';
    const title=document.getElementById('bulkImportTitleV223'),help=document.getElementById('bulkImportHelpV223'),file=document.getElementById('bulkImportFileV223'),preview=document.getElementById('bulkImportPreviewV223'),confirm=document.getElementById('bulkImportConfirmV223'),modal=document.getElementById('bulkImportModalV223');
    if(title)title.textContent='Upload CSV Layanan Lounge / Tenant';if(help)help.textContent='Gunakan CSV Template P29. Parse → Normalize → Validate → Preview → Confirm → Import. Multi-price memakai satu Agreement Number pada beberapa baris.';if(file)file.value='';if(preview)preview.innerHTML='<div class="bulk-import-idle">Belum ada file dipilih.</div>';if(confirm)confirm.disabled=true;modal?.classList.add('show');
  };

  window.previewBulkImportV223=async function(file){
    if(!file)return;
    const preview=document.getElementById('bulkImportPreviewV223'),confirm=document.getElementById('bulkImportConfirmV223');
    if(!canUpload())return;
    preview.innerHTML='<div class="bulk-import-loading">Membaca, menormalisasi, dan memvalidasi file…</div>';if(confirm)confirm.disabled=true;
    try{
      const raw=await geReadTabularFileV223(file);
      const rows=geRowsToObjectsV223(raw,aliases());
      const result=normalizeImportRows(rows);const summary=buildImportPreview(result);
      state.importRows=result.normalized;state.importGroups=result.groups;state.importSummary=summary;state.importFileName=file.name;
      preview.innerHTML=previewMarkup(result,summary);
      if(confirm)confirm.disabled=summary.valid===0;
    }catch(e){preview.innerHTML=`<div class="bulk-import-error">File tidak dapat diproses. ${esc(e.message||String(e))}</div>`;state.importRows=[];state.importGroups=[];if(confirm)confirm.disabled=true;}
  };

  const originalConfirm=window.confirmBulkImportV231;
  window.confirmBulkImportV231=async function(){
    if(state.importFileName){
      if(!canUpload())return;
      const groups=state.importGroups.filter(g=>g.model&&!g.error&&!existingDuplicate(g.model));
      if(!groups.length){notice('Import Tidak Dilakukan','Tidak ada baris valid yang siap dibuat. Periksa duplicate atau validation error.','warning');return;}
      let added=0,failures=0;data.lounges=data.lounges||[];
      groups.forEach(g=>{try{data.lounges.push({...g.model,id:Date.now()+added+Math.floor(Math.random()*10000),no:'',documentName:'',documentKey:''});added++}catch(e){failures++}});
      if(added){
        try{
          data.auditLogs=Array.isArray(data.auditLogs)?data.auditLogs:[];
          const u=typeof geSession==='function'?geSession():{};
          data.auditLogs.unshift({id:Date.now()+Math.floor(Math.random()*10000),timestamp:new Date().toISOString(),username:u?.username||'system',name:u?.name||u?.username||'System',role:u?.role||'System',action:'Bulk Import',module:'Lounge/Tenant Planning',object:`${added} Agreement`,detail:`P29 CSV CREATE-only • file ${state.importFileName} • ${state.importSummary?.total||0} rows • ${state.importSummary?.invalid||0} blocked`});
        }catch(e){}
        save();
        try{if(window.GEStore?.flush)await window.GEStore.flush();}
        catch(e){console.error('[Lounge/Tenant Import Firestore]',e);notice('Import Gagal',`Agreement belum tersimpan ke Firestore. ${e?.message||String(e)}`,'error');return;}
      }
      document.getElementById('bulkImportModalV223')?.classList.remove('show');fillAirportSelects?.();renderLounges?.();renderLoungeCardsV237?.();renderLoungePriceSummaryV243?.();
      notice('Import Selesai',`${added} Agreement dibuat • ${failures} gagal • ${state.importSummary?state.importSummary.invalid:'-'} baris tidak diimport karena validation/duplicate.` ,added?'success':'warning');
      state.importFileName='';return;
    }
    return originalConfirm?.();
  };

  window.downloadLoungesCSV=function(){
    const lines=[Object.values(FIELD_HEADERS).map(csvCell).join(',')];
    filteredRows().forEach(x=>{
      const rt=resolveType(x), schedules=Array.isArray(x.priceSchedules)?x.priceSchedules:[];
      const base={region:x.region||'',station:x.airport||'',name:x.name||'',serviceType:rt.value||'Requires Review',pic:x.pic||'',currency:schedules.length?'':x.currency||'',pricePerPax:schedules.length?'':(x.pricePerPax??''),startDate:x.startDate||'',endDate:x.endDate||'',documentNumber:x.documentNumber||'',documentType:x.documentType||'',documentStatus:x.documentStatus||'',remarks:x.remarks||''};
      const rows=schedules.length?schedules:[null];
      rows.forEach(s=>lines.push([
        base.region,base.station,base.name,base.serviceType,base.pic,base.currency,base.pricePerPax,base.startDate,base.endDate,base.documentNumber,base.documentType,base.documentStatus,base.remarks,
        s?.effectiveFrom||'',s?.effectiveTo||'',s?.price??'',s?.currency||'',s?.priceBasis||'',s?.priceNote||''
      ].map(csvCell).join(',')));
    });
    const blob=new Blob(['\ufeff'+lines.join('\r\n')+'\r\n'],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Daftar_Lounge_Tenant_P29.csv';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},300);
  };

  function setupTypeFilter(){
    const card=document.querySelector('.lounge-filter-grid-ref');if(!card||document.getElementById('geP29ServiceTypeFilter'))return;
    const wrap=document.createElement('div');wrap.id='geP29ServiceTypeFilter';wrap.className='ge-p29-service-filter';wrap.innerHTML=`<span>Service Type</span><div role="group" aria-label="Service Type"><button type="button" class="active" data-ge-p29-service-filter="">All</button><button type="button" data-ge-p29-service-filter="Lounge">Lounge</button><button type="button" data-ge-p29-service-filter="Tenant">Tenant</button></div>`;
    card.parentElement?.insertBefore(wrap,card);wrap.querySelectorAll('[data-ge-p29-service-filter]').forEach(btn=>btn.addEventListener('click',()=>{wrap.querySelectorAll('[data-ge-p29-service-filter]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');GE_LOUNGE_CARD_PAGE_V237=1;renderLounges()}));
  }

  function setup(){
    setupTypeFilter();
    const heading=document.querySelector('.lounge-master-view-label-v237');
    if(heading&&!document.getElementById('geP29ShowHistory')){const history=document.createElement('label');history.className='ge-p29-history-toggle';history.innerHTML='<input id="geP29ShowHistory" type="checkbox"> Tampilkan history agreement';heading.appendChild(history);document.getElementById('geP29ShowHistory').onchange=()=>renderLounges();}
    const templateBtn=[...document.querySelectorAll('button')].find(b=>/Unduh Template/i.test(b.textContent||''));if(templateBtn){templateBtn.textContent='Download CSV Template';templateBtn.title='Download CSV Template P29';}
    ['loungeRegionFilter','loungeAirportFilter','loungeNameFilter','loungeStatusFilter'].forEach(id=>{const e=document.getElementById(id);if(e)e.addEventListener('change',()=>{GE_LOUNGE_CARD_PAGE_V237=1;renderLounges()})});
    try{if(typeof fillAirportSelects==='function')fillAirportSelects()}catch(e){}
    renderLounges();
  }

  window.geP29ViewPriceSchedule=function(id){
    const x=(data.lounges||[]).find(v=>String(v.id)===String(id));if(!x)return;
    const schedules=Array.isArray(x.priceSchedules)?x.priceSchedules:[];
    if(!schedules.length)return;
    let modal=document.getElementById('geP29PriceScheduleModal');if(!modal){modal=document.createElement('div');modal.id='geP29PriceScheduleModal';modal.className='modal-backdrop';modal.innerHTML='<div class="modal-card ge-p29-schedule-modal"></div>';document.body.appendChild(modal)}
    const checked=validateSchedules(schedules,validDate(x.startDate),validDate(x.endDate));
    modal.querySelector('.modal-card').innerHTML=`<button class="modal-x" type="button" onclick="document.getElementById('geP29PriceScheduleModal')?.classList.remove('show')">×</button><h2>Price Schedule</h2><p class="section-subtitle">${esc(x.name||'Lounge/Tenant')} • ${esc(x.documentNumber||'Agreement identity tidak tersedia')}</p>${checked.valid?`<div class="ge-p29-schedule-list">${checked.schedules.map((s,i)=>`<div class="ge-p29-schedule-item"><div><span>Period ${i+1}</span><b>${esc(dateLabel(s.effectiveFrom))} — ${esc(dateLabel(s.effectiveTo))}</b></div><div><span>Price</span><b>${esc(safePriceDisplay(s.currency,s.price))}</b></div><div><span>Basis</span><b>${esc(s.priceBasis||'pax')}</b></div>${s.priceNote?`<small>${esc(s.priceNote)}</small>`:''}</div>`).join('')}</div>`:`<div class="ge-p29-form-errors"><b>Requires Review</b><p>${esc(checked.errors.join('; '))}</p></div>`}<div class="modal-actions"><button class="btn secondary" type="button" onclick="document.getElementById('geP29PriceScheduleModal')?.classList.remove('show')">Tutup</button></div>`;
    modal.classList.add('show');
  };

  // Defensive wrappers for legacy visitor-cost resolution: priceSchedules take precedence by visitor date.
  if(typeof window.geResolveVisitorPriceV240==='function'){
    const legacy=window.geResolveVisitorPriceV240;
    window.geResolveVisitorPriceV240=function(visitor){
      const v=legacy(visitor);const l=(data.lounges||[]).find(x=>String(x.id)===String(v?.loungeId));
      if(l&&Array.isArray(l.priceSchedules)&&l.priceSchedules.length){const date=validDate(v?.date);const p=applicablePrice(l,date?new Date(date+'T12:00:00'):new Date());if(p.status==='CURRENT'){v.currency=p.currency;v.pricePerPax=p.price;v.priceDisplay=safePriceDisplay(p.currency,p.price);v.priceSource='Lounge/Tenant Master — P29 Price Schedule'}}
      return v;
    };
  }

  window.addEventListener('DOMContentLoaded',()=>setTimeout(setup,0));
})();

  // Canonical SPA bridge: legacy inline handlers must remain globally callable after consolidation into this IIFE.
  if(typeof showStandardPanel==='function') window.showStandardPanel=showStandardPanel;
  if(typeof renderTouchpointStandards==='function') window.renderTouchpointStandards=renderTouchpointStandards;
  if(typeof renderPersonnelReadiness==='function') window.renderPersonnelReadiness=renderPersonnelReadiness;
  if(typeof renderSkyPriority==='function') window.renderSkyPriority=renderSkyPriority;
  if(typeof closeAnnouncementReferenceV246==='function') window.closeAnnouncementReferenceV246=closeAnnouncementReferenceV246;
  if(typeof closePlanningRecordModal==='function') window.closePlanningRecordModal=closePlanningRecordModal;
  if(typeof openPlanningRecordModal==='function') window.openPlanningRecordModal=openPlanningRecordModal;
  if(typeof renderAnnouncementLibraryV246==='function') window.renderAnnouncementLibraryV246=renderAnnouncementLibraryV246;
  if(typeof closeInitiativeDocumentV227==='function') window.closeInitiativeDocumentV227=closeInitiativeDocumentV227;
  if(typeof closeInitiativeModalV224==='function') window.closeInitiativeModalV224=closeInitiativeModalV224;
  if(typeof closeInitiativeProgressV224==='function') window.closeInitiativeProgressV224=closeInitiativeProgressV224;
  if(typeof closeInitiativeStepV224==='function') window.closeInitiativeStepV224=closeInitiativeStepV224;
  if(typeof closeInitiativeTimelineV224==='function') window.closeInitiativeTimelineV224=closeInitiativeTimelineV224;
  if(typeof exportCSV==='function') window.exportCSV=exportCSV;
  if(typeof openInitiativeModalV224==='function') window.openInitiativeModalV224=openInitiativeModalV224;
  if(typeof renderInitiatives==='function') window.renderInitiatives=renderInitiatives;
  if(typeof saveInitiativeDocumentV227==='function') window.saveInitiativeDocumentV227=saveInitiativeDocumentV227;
  if(typeof saveInitiativeProgressV224==='function') window.saveInitiativeProgressV224=saveInitiativeProgressV224;
  if(typeof saveInitiativeStepV224==='function') window.saveInitiativeStepV224=saveInitiativeStepV224;
  if(typeof saveInitiativeV224==='function') window.saveInitiativeV224=saveInitiativeV224;
  if(typeof setJourneyFilter==='function') window.setJourneyFilter=setJourneyFilter;
  if(typeof closeInboxDetail==='function') window.closeInboxDetail=closeInboxDetail;
  if(typeof openInboxDetail==='function') window.openInboxDetail=openInboxDetail;
  if(typeof openSupportConversation==='function') window.openSupportConversation=openSupportConversation;
  if(typeof supportList==='function') window.supportList=supportList;
  if(typeof submitContactMessage==='function') window.submitContactMessage=submitContactMessage;
  if(typeof submitGuestbook==='function') window.submitGuestbook=submitGuestbook;
  if(typeof downloadAuditCSV==='function') window.downloadAuditCSV=downloadAuditCSV;
  if(typeof pmAssetListR2==='function') window.pmAssetListR2=pmAssetListR2;
  if(typeof pmLoadPageR2==='function') window.pmLoadPageR2=pmLoadPageR2;
  if(typeof pmNewPage==='function') window.pmNewPage=pmNewPage;
  if(typeof pmPreviewR2==='function') window.pmPreviewR2=pmPreviewR2;
  if(typeof pmPublishR2==='function') window.pmPublishR2=pmPublishR2;
  if(typeof pmRegisterAssetsR2==='function') window.pmRegisterAssetsR2=pmRegisterAssetsR2;
  if(typeof pmResetSectionsR2==='function') window.pmResetSectionsR2=pmResetSectionsR2;
  if(typeof pmSaveDraft==='function') window.pmSaveDraft=pmSaveDraft;
  if(typeof pmSaveMenusR2==='function') window.pmSaveMenusR2=pmSaveMenusR2;
  if(typeof pmSavePageR2==='function') window.pmSavePageR2=pmSavePageR2;
  if(typeof pmSaveSectionsR2==='function') window.pmSaveSectionsR2=pmSaveSectionsR2;
  if(typeof renderAdminInbox==='function') window.renderAdminInbox=renderAdminInbox;
  if(typeof renderAuditLogs==='function') window.renderAuditLogs=renderAuditLogs;
  if(typeof showAdminSection==='function') window.showAdminSection=showAdminSection;
  if(typeof closeAnnouncementEditor==='function') window.closeAnnouncementEditor=closeAnnouncementEditor;
  if(typeof closeArticleEditor==='function') window.closeArticleEditor=closeArticleEditor;
  if(typeof closeArticleProposal==='function') window.closeArticleProposal=closeArticleProposal;
  if(typeof closeArticleView==='function') window.closeArticleView=closeArticleView;
  if(typeof closeFaqEditor==='function') window.closeFaqEditor=closeFaqEditor;
  if(typeof openAnnouncementEditor==='function') window.openAnnouncementEditor=openAnnouncementEditor;
  if(typeof openArticleEditor==='function') window.openArticleEditor=openArticleEditor;
  if(typeof openArticleProposal==='function') window.openArticleProposal=openArticleProposal;
  if(typeof openFaqEditor==='function') window.openFaqEditor=openFaqEditor;
  if(typeof saveAnnouncement==='function') window.saveAnnouncement=saveAnnouncement;
  if(typeof saveArticle==='function') window.saveArticle=saveArticle;
  if(typeof saveFaq==='function') window.saveFaq=saveFaq;
  if(typeof showContentPanel==='function') window.showContentPanel=showContentPanel;
  if(typeof renderArticles==='function') window.renderArticles=renderArticles;
  if(typeof renderAnnouncements==='function') window.renderAnnouncements=renderAnnouncements;
  if(typeof renderFaqs==='function') window.renderFaqs=renderFaqs;
  if(typeof renderAdminOverview==='function') window.renderAdminOverview=renderAdminOverview;
  if(typeof renderLounges==='function') window.renderLounges=renderLounges;
  if(typeof changeLoungeCardPageV237==='function') window.changeLoungeCardPageV237=changeLoungeCardPageV237;
  if(typeof renderLoungeVisitors==='function') window.renderLoungeVisitors=renderLoungeVisitors;
  if(typeof renderPlanningDocuments==='function') window.renderPlanningDocuments=renderPlanningDocuments;
  if(typeof geRenderPlanningPage==='function') window.geRenderPlanningPage=geRenderPlanningPage;
  if(typeof renderPlanningOverview==='function') window.renderPlanningOverview=renderPlanningOverview;
  if(typeof renderBOSpaces==='function') window.renderBOSpaces=renderBOSpaces;
  if(typeof renderLoungeProcurement==='function') window.renderLoungeProcurement=renderLoungeProcurement;
  if(typeof geV251InitCalendar==='function') window.geV251InitCalendar=geV251InitCalendar;
  if(typeof geUpgradeCalendarModalV252==='function') window.geUpgradeCalendarModalV252=geUpgradeCalendarModalV252;
  if(typeof geAddCalendarFiltersV252==='function') window.geAddCalendarFiltersV252=geAddCalendarFiltersV252;
  if(typeof geUpgradeReminderV253==='function') window.geUpgradeReminderV253=geUpgradeReminderV253;
  if(typeof geCalBuildFiltersV2533==='function') window.geCalBuildFiltersV2533=geCalBuildFiltersV2533;
  if(typeof geCalRenderV2533==='function') window.geCalRenderV2533=geCalRenderV2533;
  if(typeof geCalRenderKPIV2534==='function') window.geCalRenderKPIV2534=geCalRenderKPIV2534;
  if(typeof geCalSetViewV2533==='function') window.geCalSetViewV2533=geCalSetViewV2533;
  if(typeof geCalMoveV2533==='function') window.geCalMoveV2533=geCalMoveV2533;
  if(typeof geCalDeleteActivityV2535==='function') window.geCalDeleteActivityV2535=geCalDeleteActivityV2535;
  if(typeof geCalOpenActivityV2535==='function') window.geCalOpenActivityV2535=geCalOpenActivityV2535;
  if(typeof geCalOpenDetailV2533==='function') window.geCalOpenDetailV2533=geCalOpenDetailV2533;
  if(typeof geRequestNotificationV253==='function') window.geRequestNotificationV253=geRequestNotificationV253;
  if(typeof openInitiativeTimelineV224==='function') window.openInitiativeTimelineV224=openInitiativeTimelineV224;
  if(typeof installInitiativeControls==='function') window.installInitiativeControls=installInitiativeControls;
  if(typeof geInitAirportV214==='function') window.geInitAirportV214=geInitAirportV214;
  if(typeof renderAirports==='function') window.renderAirports=renderAirports;
  if(typeof renderAirportMapMarkers==='function') window.renderAirportMapMarkers=renderAirportMapMarkers;
  if(typeof filterAirportMap==='function') window.filterAirportMap=filterAirportMap;
  if(typeof showAirportTooltip==='function') window.showAirportTooltip=showAirportTooltip;
  if(typeof hideAirportTooltip==='function') window.hideAirportTooltip=hideAirportTooltip;
  if(typeof selectAirport==='function') window.selectAirport=selectAirport;
  if(typeof geMapZoomStep==='function') window.geMapZoomStep=geMapZoomStep;
  if(typeof geMapResetView==='function') window.geMapResetView=geMapResetView;
  if(typeof geUpdateMapRegionCounts==='function') window.geUpdateMapRegionCounts=geUpdateMapRegionCounts;

  if(typeof renderStationMaterials==='function') window.renderStationMaterials=renderStationMaterials;
  if(typeof renderAirportSystems==='function') window.renderAirportSystems=renderAirportSystems;
  if(typeof submitArticleProposal==='function') window.submitArticleProposal=submitArticleProposal;
  window.addEventListener=_w;
  document.addEventListener=_d;
})();

/* CANONICAL CONSOLIDATION — R11
 * Repairs only the invalid R10 canonical block. Existing proven V224/V216 business logic remains intact.
 * No parallel modal/page implementation is created.
 */
(function(){
'use strict';
const store=()=>window.GEStore?.get?.()||window.data||{};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v.filter(Boolean):String(v||'').split(/[|,;]/).map(x=>x.trim()).filter(Boolean);
const users=()=> (store().users||[]).filter(u=>String(u.status||'Active').toLowerCase()==='active');
const ukey=u=>String(u.id||u.uid||u.email||u.username||'');
const uname=u=>String(u.name||u.fullName||u.employeeName||u.displayName||u.username||u.email||'-');
const ulabel=u=>uname(u);
const stations=()=>[...new Set([...(store().airports||[]).map(a=>a.code||a.airportCode||a.iata||a.stationCode),...(store().lounges||[]).map(x=>x.airport),...(store().initiatives||[]).flatMap(x=>arr(x.stations||x.airport))].map(x=>String(x||'').trim().toUpperCase()).filter(Boolean))].sort();
const touchpoints=()=>[...new Set((store().touchpoints||[]).filter(x=>typeof x==='string'||x.status!=='Inactive').map(x=>typeof x==='string'?x:(x.name||x.touchpoint||x.label)).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'id'));
const journeys=['Pre-Journey','Pre-Flight','Post-Flight','Post-Journey','Cross-Journey / End-to-End','Supporting / Enabler'];
function picker(id,items,selected=[]){
 const root=document.getElementById(id);if(!root)return;
 const values=[...new Set(arr(selected).map(String))],chosen=new Set(values),allKey='__ALL__';
 root.dataset.values=JSON.stringify(values);
 const list=[...new Set((items||[]).map(x=>String(x).trim()).filter(Boolean))];
 const labels=()=>{try{return JSON.parse(root.dataset.values||'[]')}catch{return[]}};
 const summary=()=>{const vals=labels(),max=3;if(!vals.length)return 'Select';const shown=vals.slice(0,max);return shown.join(', ')+(vals.length>max?` +${vals.length-max}`:'')};
 root.innerHTML=`<button type="button" class="ge-picker-trigger-r11"><span>${esc(summary())}</span><i>⌄</i></button><div class="ge-picker-pop-r11"><input class="ge-picker-search-r11" placeholder="Search..." autocomplete="off"><div class="ge-picker-options-r11"><label data-all-option="1"><input type="checkbox" value="${allKey}"><span>All</span></label>${list.map(v=>`<label data-label="${esc(v.toLowerCase())}"><input type="checkbox" value="${esc(v)}" ${chosen.has(v)?'checked':''}><span>${esc(v)}</span></label>`).join('')||'<div class="ge-picker-empty-r11">No matching data found.</div>'}</div><div class="ge-picker-actions-r11"><button type="button" data-picker-clear>Clear</button><button type="button" data-picker-cancel>Cancel</button><button type="button" class="primary" data-picker-ok>Apply</button></div></div>`;
 const trigger=root.querySelector('.ge-picker-trigger-r11'),pop=root.querySelector('.ge-picker-pop-r11'),search=root.querySelector('.ge-picker-search-r11'),all=root.querySelector('[data-all-option] input');
 const optionInputs=()=>[...root.querySelectorAll('.ge-picker-options-r11 input[type="checkbox"]')].filter(x=>x.value!==allKey);
 const syncAll=()=>{const opts=optionInputs(),checked=opts.filter(x=>x.checked).length;all.checked=opts.length>0&&checked===opts.length;all.indeterminate=checked>0&&checked<opts.length};
 const renderSummary=()=>{trigger.querySelector('span').textContent=summary();syncAll()};
 const close=()=>{pop.classList.remove('show');search.value='';root.querySelectorAll('.ge-picker-options-r11 label').forEach(l=>l.hidden=false)};
 trigger.onclick=()=>{document.querySelectorAll('.ge-picker-pop-r11.show').forEach(x=>x!==pop&&x.classList.remove('show'));pop.classList.toggle('show');if(pop.classList.contains('show')){syncAll();setTimeout(()=>search.focus(),0)}};
 search.oninput=()=>{const q=search.value.trim().toLowerCase();root.querySelectorAll('.ge-picker-options-r11 label').forEach(l=>{if(l.hasAttribute('data-all-option')){l.hidden=false;return}l.hidden=!!q&&!l.dataset.label.includes(q)})};
 all.onchange=()=>{const check=all.checked;optionInputs().forEach(x=>x.checked=check);syncAll()};
 root.querySelector('[data-picker-clear]').onclick=()=>{optionInputs().forEach(x=>x.checked=false);all.checked=false;all.indeterminate=false};
 root.querySelector('[data-picker-cancel]').onclick=close;
 root.querySelector('[data-picker-ok]').onclick=()=>{const vals=optionInputs().filter(x=>x.checked).map(x=>x.value);root.dataset.values=JSON.stringify(vals);renderSummary();close()};
 syncAll();renderSummary();
}
function picked(id){try{return JSON.parse(document.getElementById(id)?.dataset.values||'[]')}catch{return []}}
function fillPic(selectId,freeId,row={}){const el=document.getElementById(selectId);if(!el)return;el.innerHTML='<option value="">Pilih akun User & Access</option>'+users().map(u=>`<option value="${esc(ukey(u))}">${esc(ulabel(u))}</option>`).join('');el.value=row.picUserId||'';const free=document.getElementById(freeId);if(free)free.value=row.picUserId?'':(row.pic||'')}
function assignment(kind,refId,title,userId,dueDate){
 if(!userId)return false;
 const d=store();d.inbox=Array.isArray(d.inbox)?d.inbox:[];
 const key=`${kind}:${refId}:${userId}`;
 if(d.inbox.some(x=>x.assignmentKey===key&&!x.archived))return false;
 const actor=typeof gxGetSession==='function'?(gxGetSession()||{}):window.GX_CURRENT_USER||{};const related=(d.initiatives||[]).find(x=>String(x.id)===String(refId).split(':')[0]);const subject=kind==='Milestone'?`Penugasan Milestone: ${String(title).split(' — ').pop()}`:`Penugasan PIC: ${title}`;d.inbox.unshift({id:String(Date.now())+'-'+Math.random().toString(36).slice(2,7),assignmentKey:key,type:'Task Assignment',subject,title:subject,body:`Anda ditetapkan sebagai PIC ${kind} pada ${title}. Tenggat: ${dueDate||'belum ditentukan'}.`,message:`Anda ditetapkan sebagai PIC ${kind} pada ${title}. Tenggat: ${dueDate||'belum ditentukan'}.`,senderId:String(actor.uid||actor.id||''),senderName:actor.name||actor.username||actor.email||'System',senderArea:related?.airport||'',recipientId:String(userId),userId:String(userId),status:'Unread',createdAt:new Date().toISOString(),dueDate:dueDate||'',referenceType:kind,referenceId:String(refId).split(':')[0],milestoneIndex:kind==='Milestone'?String(refId).split(':')[1]:'',destination:`app.html?page=inisiatif&initiative=${encodeURIComponent(String(refId).split(':')[0])}${kind==='Milestone'?'&milestone='+encodeURIComponent(String(refId).split(':')[1]):''}`});
 window.GEStore.save(d);return true;
}
function setv(id,v){const e=document.getElementById(id);if(e)e.value=v??''}
function initInitiativeForm(row={}){picker('initiativeStationPickerR11',stations(),row.stations||row.airport);picker('initiativeJourneyPickerR11',journeys,row.journeyScopes||row.journey);picker('initiativeTouchpointPickerR11',touchpoints(),row.touchpoints||row.tp||row.touchpoint);fillPic('initiativePicV224','initiativePicFreeR11',row);}
window.openInitiativeModalV224=function(id=null){if(typeof geInitiativeAdminV224==='function'&&!geInitiativeAdminV224())return;const row=id?(store().initiatives||[]).find(x=>String(x.id)===String(id)):null;setv('initiativeEditIdV224',row?.id||'');const title=document.getElementById('initiativeModalTitleV224');if(title)title.textContent=row?'Update Inisiatif':'Tambah Inisiatif';setv('initiativeNameV224',row?.name);setv('initiativeDueDateV224',row?.dueDate);setv('initiativePlanV224',row?.plan??0);setv('initiativeRealV224',row?.real??0);setv('initiativeRemarkV224',row?.remark);setv('initiativeStartDateV10',row?.startDate);setv('initiativeEndDateV10',row?.endDate);setv('initiativeActualDateV10',row?.actualDate);setv('initiativeEstimatedCostV10',row?.estimatedCost||0);setv('initiativeBudgetV10',row?.budget||0);setv('initiativeActualCostV10',row?.actualCost||0);setv('initiativePriorityV10',row?.priority||'Normal');setv('initiativeStatusV10',row?.status||'Not Started');setv('initiativeOutputV10',row?.output);setv('initiativeAchievementV10',row?.achievement);initInitiativeForm(row||{});document.getElementById('initiativeModalV224')?.classList.add('show')};
window.saveInitiativeV224=async function(){if(typeof geInitiativeAdminV224==='function'&&!geInitiativeAdminV224())return;const d=store();d.initiatives=Array.isArray(d.initiatives)?d.initiatives:[];const id=String(document.getElementById('initiativeEditIdV224')?.value||''),name=document.getElementById('initiativeNameV224')?.value.trim()||'',sts=picked('initiativeStationPickerR11'),jrn=picked('initiativeJourneyPickerR11'),tps=picked('initiativeTouchpointPickerR11');if(!name||!sts.length||!jrn.length||!tps.length)return alert('Nama Inisiatif, Station / Area, Journey Scope, dan Touch Point wajib diisi.');const invalid=tps.filter(name=>{const master=(d.touchpoints||[]).find(x=>typeof x==='object'&&x.name===name);return master&&!(master.journeys||[master.journey]).some(j=>jrn.includes(j))});if(invalid.length)return alert('Journey Scope belum sesuai dengan Touch Point: '+invalid.join(', '));const picId=document.getElementById('initiativePicV224')?.value||'',free=document.getElementById('initiativePicFreeR11')?.value.trim()||'',u=users().find(x=>ukey(x)===picId),existing=id?d.initiatives.find(x=>String(x.id)===id):null,row=existing||{id:Date.now(),workflow:[],triggerDocuments:[],supportingDocuments:[]},oldPicId=existing?.picUserId||'';Object.assign(row,{name,stations:sts,airport:sts.join(', '),journeyScopes:jrn,journey:jrn[0],touchpoints:tps,tp:tps[0],touchpointIds:tps.map(name=>(d.touchpoints||[]).find(v=>typeof v==='object'&&v.name===name)?.id).filter(Boolean),picUserId:picId,pic:u?uname(u):free,dueDate:document.getElementById('initiativeDueDateV224')?.value||'',startDate:document.getElementById('initiativeStartDateV10')?.value||'',endDate:document.getElementById('initiativeEndDateV10')?.value||'',actualDate:document.getElementById('initiativeActualDateV10')?.value||'',plan:Number(document.getElementById('initiativePlanV224')?.value||0),real:Number(document.getElementById('initiativeRealV224')?.value||0),estimatedCost:Number(document.getElementById('initiativeEstimatedCostV10')?.value||0),budget:Number(document.getElementById('initiativeBudgetV10')?.value||0),actualCost:Number(document.getElementById('initiativeActualCostV10')?.value||0),priority:document.getElementById('initiativePriorityV10')?.value||'Normal',status:document.getElementById('initiativeStatusV10')?.value||'Not Started',output:document.getElementById('initiativeOutputV10')?.value.trim()||'',achievement:document.getElementById('initiativeAchievementV10')?.value.trim()||'',remark:document.getElementById('initiativeRemarkV224')?.value.trim()||''});if(!existing)d.initiatives.push(row);d.touchpoints=Array.isArray(d.touchpoints)?d.touchpoints:[];tps.forEach(tp=>{if(!d.touchpoints.some(x=>(typeof x==='string'?x:x.name)===tp))d.touchpoints.push(tp)});const previousPic=oldPicId;
 const saveButton=document.querySelector('#initiativeModalV224 form button[type="submit"]');
 if(saveButton){saveButton.disabled=true;saveButton.dataset.originalText=saveButton.textContent;saveButton.textContent='Menyimpan...';}
 try{
  window.GEStore.save(d);await window.GEStore.flush();
  if(picId&&picId!==previousPic){assignment('Initiative',row.id,row.name,picId,row.dueDate);await window.GEStore.flush()}
  document.getElementById('initiativeModalV224')?.classList.remove('show');window.renderInitiatives?.();
  geStorageNoticeV223('Inisiatif Tersimpan',`${row.name} berhasil disimpan.`, 'success');
 }catch(error){console.error('[Initiative save]',error);geStorageNoticeV223('Penyimpanan Gagal',error?.message||'Perubahan belum tersimpan. Silakan coba lagi.','error')}
 finally{if(saveButton){saveButton.disabled=false;saveButton.textContent=saveButton.dataset.originalText||'Simpan';}}};
window.openInitiativeStepV224=function(parentId,index=''){if(typeof geInitiativeAdminV224==='function'&&!geInitiativeAdminV224())return;const x=(store().initiatives||[]).find(v=>String(v.id)===String(parentId));if(!x)return;x.workflow=Array.isArray(x.workflow)?x.workflow:[];const step=index!==''?x.workflow[Number(index)]:null;setv('initiativeStepParentIdV224',parentId);setv('initiativeStepEditIndexV224',index);setv('initiativeStepTitleV224',step?.title);setv('initiativeStepDueDateV224',step?.dueDate);setv('initiativeStepStatusV224',step?.status||'Not Started');setv('initiativeStepRemarkV224',step?.remark);setv('geV254StepType',step?.stepType||'date');setv('geV254StepStart',step?.startDate);setv('geV254StepEnd',step?.endDate);setv('geV254StepEstimate',step?.estimatedCost||0);setv('geV254StepActualCost',step?.actualCost||0);fillPic('initiativeStepPicV224','initiativeStepPicFreeR11',step||{});document.getElementById('initiativeStepModalV224')?.classList.add('show')};
window.saveInitiativeStepV224=async function(){const d=store(),parent=String(document.getElementById('initiativeStepParentIdV224')?.value||''),x=(d.initiatives||[]).find(v=>String(v.id)===parent);if(!x)return;x.workflow=Array.isArray(x.workflow)?x.workflow:[];const idx=document.getElementById('initiativeStepEditIndexV224')?.value||'',title=document.getElementById('initiativeStepTitleV224')?.value.trim()||'';if(!title)return alert('Nama Tahapan / Milestone wajib diisi.');const oldPicId=idx!==''?x.workflow[Number(idx)]?.picUserId||'':'';const picId=document.getElementById('initiativeStepPicV224')?.value||'',free=document.getElementById('initiativeStepPicFreeR11')?.value.trim()||'',u=users().find(v=>ukey(v)===picId),obj={title,picUserId:picId,pic:u?uname(u):free,stepType:document.getElementById('geV254StepType')?.value||'date',startDate:document.getElementById('geV254StepStart')?.value||'',endDate:document.getElementById('geV254StepEnd')?.value||'',dueDate:document.getElementById('initiativeStepDueDateV224')?.value||'',estimatedCost:Number(document.getElementById('geV254StepEstimate')?.value||0),actualCost:Number(document.getElementById('geV254StepActualCost')?.value||0),status:document.getElementById('initiativeStepStatusV224')?.value||'Not Started',remark:document.getElementById('initiativeStepRemarkV224')?.value.trim()||''};if(idx==='')x.workflow.push(obj);else x.workflow[Number(idx)]=obj;try{window.GEStore.save(d);await window.GEStore.flush();if(picId&&picId!==oldPicId){assignment('Milestone',`${parent}:${idx===''?x.workflow.length-1:idx}`,`${x.name||'Initiative'} — ${title}`,picId,obj.dueDate);await window.GEStore.flush()}document.getElementById('initiativeStepModalV224')?.classList.remove('show');window.openInitiativeTimelineV224?.(typeof x.id==='number'?Number(x.id):x.id);geStorageNoticeV223('Milestone Tersimpan',`${title} berhasil disimpan.`,'success')}catch(e){geStorageNoticeV223('Penyimpanan Gagal',e.message||String(e),'error')}};
['closeInitiativeModalV224','closeInitiativeProgressV224','closeInitiativeStepV224','closeInitiativeTimelineV224','openInitiativeTimelineV224','deleteInitiativeV224','deleteInitiativeStepV224','openInitiativeProgressV224','saveInitiativeProgressV224'].forEach(n=>{try{if(typeof eval(n)==='function')window[n]=eval(n)}catch(e){}});
window.geFocusInitiativeR65=function(id,milestone){
 const d=store(),row=(d.initiatives||[]).find(x=>String(x.id)===String(id)),notice=document.getElementById('geInitiativeFocusNoticeR65')||document.createElement('div');notice.id='geInitiativeFocusNoticeR65';notice.className='ge-card';notice.style.padding='12px';const host=document.getElementById('initRows');if(host&&!notice.isConnected)host.before(notice);
 if(!row){notice.textContent='Initiative yang dituju tidak tersedia atau Anda tidak memiliki akses.';return}
 window.GE_INITIATIVE_FOCUS_ID_R65=String(row.id);notice.innerHTML='<b>Menampilkan Initiative yang ditugaskan: '+esc(row.name)+'</b> <button type="button" class="btn secondary compact-btn" id="geClearInitiativeFocusR65">Tampilkan Semua</button>';
 notice.querySelector('#geClearInitiativeFocusR65').onclick=()=>{window.GE_INITIATIVE_FOCUS_ID_R65='';notice.remove();window.renderInitiatives?.()};
 window.renderInitiatives?.();
 const typedId=typeof row.id==='number'?Number(row.id):row.id;window.openInitiativeTimelineV224?.(typedId);
 if(milestone!==null&&milestone!==undefined&&milestone!==''){const index=Number(milestone),step=row.workflow?.[index],cards=document.querySelectorAll('#initiativeTimelineModalV224 .timeline-card-v224');if(!step||!cards[index]){notice.textContent='Milestone yang dituju tidak tersedia dalam Initiative ini.';return}cards[index].style.outline='3px solid #287db5';cards[index].scrollIntoView({block:'center'})}
};
window.geInitInitiativeCanonical=function(){window.renderInitiatives?.()};
window.geFilterInitiativeTouchpoint=tp=>{location.href='app.html?page=calendar&view=gantt&touchpoint='+encodeURIComponent(tp||'')};

let geGanttSortStateR13={key:'title',dir:1};
let geGanttStateR16={scale:'default',from:'',to:'',filters:{journey:'',touchpoint:'',station:'',pic:'',kind:'',initiative:''}};
function projectRows(){const out=[];(store().initiatives||[]).forEach(i=>{const t=arr(i.touchpoints||i.tp||i.touchpoint),base={initiativeId:String(i.id),initiative:i.name||'-',journeys:arr(i.journeyScopes||i.journey),stations:arr(i.stations||i.airport)};out.push({...base,id:String(i.id),kind:'Initiative',title:i.name||'-',touchpoints:t,pic:i.pic||'-',start:i.startDate||'',due:i.dueDate||i.endDate||'',status:i.status||'',progress:Number(i.real||0)});(i.workflow||i.milestones||[]).forEach((m,idx)=>out.push({...base,id:`m-${i.id}-${idx}`,kind:'Milestone',title:m.title||m.name||'Milestone',touchpoints:arr(m.touchpoints||m.touchpoint||t),pic:m.pic||i.pic||'-',start:m.startDate||i.startDate||'',due:m.dueDate||m.endDate||'',status:m.status||'',progress:Number(m.real||0)}))});(store().projectEvents||store().events||[]).forEach(e=>out.push({id:String(e.id),kind:'Activity',initiativeId:String(e.initiativeId||''),initiative:e.initiative||'-',title:e.title||'-',journeys:arr(e.journeyScopes||e.journey),stations:arr(e.stations||e.station||e.airport),touchpoints:arr(e.touchpoints||e.touchpoint),pic:e.pic||'-',start:e.startDate||e.date||'',due:e.dueDate||e.endDate||e.date||'',status:e.status||e.category||'',progress:Number(e.progress||0)}));return out}
function geGanttFilterValuesR15(){return {...geGanttStateR16.filters}}
function filteredRows(){const f=geGanttFilterValuesR15();return projectRows().filter(r=>(!f.journey||r.journeys.includes(f.journey))&&(!f.touchpoint||r.touchpoints.some(x=>String(x).toLowerCase().includes(String(f.touchpoint).toLowerCase())))&&(!f.station||r.stations.includes(f.station))&&(!f.pic||String(r.pic||'')===f.pic)&&(!f.kind||String(r.kind||'')===f.kind)&&(!f.initiative||String(r.initiative||'')===f.initiative))}
function geGanttFiltersR15(){const rows=projectRows(),uniq=a=>[...new Set(a.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'id')),field=(id,label,vals,key)=>`<select id="${id}" data-gantt-filter="${key}"><option value="">${label}</option>${vals.map(v=>`<option value="${esc(v)}" ${geGanttStateR16.filters[key]===String(v)?'selected':''}>${esc(v)}</option>`).join('')}</select>`;return `<div class="ge-gantt-filterbar-r15">${field('geGanttJourneyR15','Semua Journey Scope',journeys,'journey')}${field('geGanttTouchpointR15','Semua Touch Point',uniq((store().touchpoints||[]).map(x=>x.name).filter(Boolean)),'touchpoint')}${field('geGanttStationR15','Semua Station',stations(),'station')}${field('geGanttPicR15','Semua PIC',uniq(rows.map(r=>r.pic).filter(x=>x&&x!=='-')),'pic')}${field('geGanttKindR15','Semua Jenis Event',['Initiative','Milestone','Activity'],'kind')}${field('geGanttInitiativeR15','Semua Initiative',uniq(rows.map(r=>r.initiative).filter(x=>x&&x!=='-')),'initiative')}</div>`}
function geBindGanttFiltersR15(){document.querySelectorAll('[data-gantt-filter]').forEach(el=>{el.onchange=()=>{geGanttStateR16.filters[el.dataset.ganttFilter]=el.value;window.geSetCalendarWorkspace('gantt')}})}
function geDate(v){if(!v)return null;const d=new Date(v+'T00:00:00');return isNaN(d)?null:d}
function geAddDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function geStartOfWeek(d){const x=new Date(d),day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(0,0,0,0);return x}
function geScaleRangeR16(rows){const now=new Date();now.setHours(0,0,0,0);const dates=rows.flatMap(r=>[geDate(r.start),geDate(r.due)]).filter(Boolean);let min=dates.length?new Date(Math.min(...dates)):geAddDays(now,-30),max=dates.length?new Date(Math.max(...dates)):geAddDays(now,90);const sc=geGanttStateR16.scale;if(sc==='week'){min=geStartOfWeek(now);max=geAddDays(min,6)}else if(sc==='month'){min=new Date(now.getFullYear(),now.getMonth(),1);max=new Date(now.getFullYear(),now.getMonth()+1,0)}else if(sc==='3months'){min=new Date(now.getFullYear(),now.getMonth(),1);max=new Date(now.getFullYear(),now.getMonth()+3,0)}else if(sc==='custom'&&geGanttStateR16.from&&geGanttStateR16.to){min=geDate(geGanttStateR16.from)||min;max=geDate(geGanttStateR16.to)||max}else{min=new Date(min.getFullYear(),min.getMonth(),1);max=new Date(max.getFullYear(),max.getMonth()+1,0)}if(max<=min)max=geAddDays(min,1);return{min,max}}
function geTimelineHeaderR16(min,max){const days=Math.max(1,Math.round((max-min)/864e5)+1),cells=[];if(geGanttStateR16.scale==='week'){for(let i=0;i<days;i++){const d=geAddDays(min,i);cells.push({label:d.toLocaleDateString('id-ID',{weekday:'short'}),sub:d.toLocaleDateString('id-ID',{day:'numeric',month:'short'}),days:1})}}else if(geGanttStateR16.scale==='3months'){let d=new Date(min);while(d<=max){const e=new Date(d.getFullYear(),d.getMonth()+1,0),last=e>max?max:e;cells.push({label:d.toLocaleDateString('id-ID',{month:'long',year:'numeric'}),sub:`${d.toLocaleDateString('id-ID',{day:'numeric',month:'short'})} – ${last.toLocaleDateString('id-ID',{day:'numeric',month:'short'})}`,days:Math.round((last-d)/864e5)+1});d=geAddDays(last,1)}}else{let d=new Date(min);while(d<=max){const step=geGanttStateR16.scale==='month'?7:Math.max(7,Math.ceil(days/10)),last=new Date(Math.min(max,geAddDays(d,step-1)));cells.push({label:d.toLocaleDateString('id-ID',{day:'numeric',month:'short'}),sub:last>d?last.toLocaleDateString('id-ID',{day:'numeric',month:'short'}):'',days:Math.round((last-d)/864e5)+1});d=geAddDays(last,1)}}return{cells,days}}
function geScaleControlsR16(){const b=s=>`<button type="button" class="${geGanttStateR16.scale===s?'active':''}" onclick="geSetGanttScaleR16('${s}')">${s==='3months'?'3 Months':s[0].toUpperCase()+s.slice(1)}</button>`;return `<div class="ge-gantt-scale-r16"><div><b>Skala Waktu</b><small>Pilih detail timeline Gantt</small></div><div class="ge-gantt-scale-actions-r16">${b('default')}${b('week')}${b('month')}${b('3months')}${b('custom')}${geGanttStateR16.scale==='custom'?`<div class="ge-gantt-custom-r16"><label>From<input id="geGanttFromR16" type="date" value="${esc(geGanttStateR16.from)}"></label><label>To<input id="geGanttToR16" type="date" value="${esc(geGanttStateR16.to)}"></label><button type="button" class="apply" onclick="geApplyGanttCustomR16()">Terapkan</button></div>`:''}</div></div>`}
window.geSetGanttScaleR16=s=>{geGanttStateR16.scale=s;window.geSetCalendarWorkspace('gantt')};window.geApplyGanttCustomR16=()=>{geGanttStateR16.from=document.getElementById('geGanttFromR16')?.value||'';geGanttStateR16.to=document.getElementById('geGanttToR16')?.value||'';if(geGanttStateR16.from&&geGanttStateR16.to&&geGanttStateR16.from>geGanttStateR16.to)return alert('Tanggal From tidak boleh setelah To.');window.geSetCalendarWorkspace('gantt')};
function geGanttSortR13(key){if(geGanttSortStateR13.key===key)geGanttSortStateR13.dir*=-1;else geGanttSortStateR13={key,dir:1};window.geSetCalendarWorkspace('gantt')}window.geGanttSortR13=geGanttSortR13;
window.geV2554OpenGanttItem=function(id){id=String(id||'');const d=store();if(id.startsWith('m-')){const m=id.match(/^m-(.+)-(\d+)$/);if(!m)return;window.openInitiativeTimelineV224?.(m[1]);setTimeout(()=>{const cards=document.querySelectorAll('#initiativeTimelineModalV224 .timeline-card-v224');cards[Number(m[2])]?.scrollIntoView({behavior:'smooth',block:'center'})},120);return}const act=(d.projectEvents||d.events||[]).find(x=>String(x.id)===id);if(act){if(typeof window.geV254OpenActivity==='function')window.geV254OpenActivity(id);return}const init=(d.initiatives||[]).find(x=>String(x.id)===id);if(init)window.openInitiativeTimelineV224?.(init.id)};
function geSortGanttHierarchyR18(rows){
 const source=[...rows],dir=geGanttSortStateR13.dir,key=geGanttSortStateR13.key;
 const cmp=(a,b)=>String(a?.[key]||'').localeCompare(String(b?.[key]||''),undefined,{numeric:true})*dir;
 const projects=source.filter(r=>r.kind==='Initiative').sort(cmp),seen=new Set(),out=[];
 projects.forEach(project=>{
   out.push(project);seen.add(String(project.id));
   source.forEach(child=>{
     if(child===project||child.kind==='Initiative')return;
     if(String(child.initiativeId||'')===String(project.id)){out.push(child);seen.add(String(child.id));}
   });
 });
 const orphanGroups=new Map(),standalone=[];
 source.forEach(row=>{
   if(seen.has(String(row.id))||row.kind==='Initiative')return;
   const parent=String(row.initiativeId||'');
   if(parent){if(!orphanGroups.has(parent))orphanGroups.set(parent,[]);orphanGroups.get(parent).push(row)}else standalone.push(row);
 });
 [...orphanGroups.values()].sort((a,b)=>cmp(a[0],b[0])).forEach(group=>out.push(...group));
 standalone.sort(cmp).forEach(row=>out.push(row));
 return out;
}
function gantt(rows,tp){
 rows=geSortGanttHierarchyR18(rows);
 const {min,max}=geScaleRangeR16(rows),span=Math.max(864e5,max-min),h=geTimelineHeaderR16(min,max);
 const heads=h.cells.map(c=>`<div style="flex:${c.days}"><b>${esc(c.label)}</b><small>${esc(c.sub)}</small></div>`).join('');
 const arrow=k=>geGanttSortStateR13.key===k?(geGanttSortStateR13.dir>0?' ↑':' ↓'):'';
 const today=new Date();today.setHours(0,0,0,0);const todayPct=(today-min)/span*100;
 const todayLine=todayPct>=0&&todayPct<=100?`<i class="ge-gantt-today-r16" style="left:${todayPct}%" aria-label="Hari ini"></i>`:'';
 const body=rows.map(r=>{
   const rawA=geDate(r.start||r.due),rawB=geDate(r.due||r.start);
   const intersects=rawA&&rawB&&rawB>=min&&rawA<=max;
   const a=intersects?new Date(Math.max(rawA,min)):null,b=intersects?new Date(Math.min(rawB,max)):null;
   const left=a?Math.max(0,Math.min(100,(a-min)/span*100)):0;
   const width=a&&b?Math.max(.7,Math.min(100-left,(b-a)/span*100)):.7;
   const dueInside=rawB&&rawB>=min&&rawB<=max;
   const deadline=dueInside?Math.max(0,Math.min(100,(rawB-min)/span*100)):null;
   const tip=`${esc(r.title||'-')} • PIC: ${esc(r.pic||'-')} • ${esc(r.start||'-')} – ${esc(r.due||'-')} • ${esc(r.status||'-')}`;
   return `<button class="ge-gantt-label-r13 ${r.kind.toLowerCase()}" data-gantt-id="${esc(r.id)}" onclick="geV2554OpenGanttItem('${esc(r.id)}')"><i class="${r.kind.toLowerCase()}"></i><span>${esc(r.title)}</span></button><button class="ge-gantt-deadline-r13" onclick="geV2554OpenGanttItem('${esc(r.id)}')">${esc(r.due||'—')}</button><div class="ge-gantt-track-r13">${todayLine}${intersects?`<button aria-label="${tip}" data-gantt-tip="${tip}" data-gantt-id="${esc(r.id)}" onclick="geV2554OpenGanttItem('${esc(r.id)}')" class="ge-gantt-bar-r13 ${r.kind.toLowerCase()}" style="left:${left}%;width:${width}%"></button>`:''}${deadline!==null?`<i class="ge-gantt-deadline-marker-r16 ${r.kind.toLowerCase()}" style="left:${deadline}%" aria-label="Deadline ${esc(r.due)}"></i>`:''}</div>`;
 }).join('')||'<div class="ge-gantt-empty-r13">Belum ada data.</div>';
 return `<div class="ge-gantt-r13"><div class="ge-gantt-title-r13"><div><b>Gantt Project Tracking</b><small>${min.toLocaleDateString('id-ID')} – ${max.toLocaleDateString('id-ID')}</small></div><div class="ge-gantt-legend-r13"><span class="initiative">Initiative</span><span class="milestone">Milestone</span><span class="activity">Activity</span></div></div><div class="ge-gantt-grid-r13"><div class="ge-gantt-head-r13 ge-gantt-project-head-r13"><button onclick="geGanttSortR13('title')">Project / Milestone / Activity${arrow('title')}</button><i class="ge-gantt-resize-r13" title="Geser untuk mengubah lebar kolom"></i></div><div class="ge-gantt-head-r13 ge-gantt-deadline-head-r13"><button onclick="geGanttSortR13('due')">Deadline${arrow('due')}</button></div><div class="ge-gantt-periods-r13">${heads}</div>${body}</div><div id="geGanttTooltipR17" class="ge-gantt-tooltip-r17" role="tooltip"></div></div>`;
}
function geBindGanttTooltipR17(){
 const root=document.querySelector('.ge-gantt-r13'),tip=document.getElementById('geGanttTooltipR17');if(!root||!tip)return;
 root.querySelectorAll('.ge-gantt-bar-r13[data-gantt-tip]').forEach(bar=>{
  bar.onpointerenter=e=>{tip.textContent=bar.dataset.ganttTip||'';tip.classList.add('show');geMoveGanttTooltipR17(e,tip)};
  bar.onpointermove=e=>geMoveGanttTooltipR17(e,tip);
  bar.onpointerleave=()=>tip.classList.remove('show');
 });
}
function geMoveGanttTooltipR17(e,tip){const pad=14,w=tip.offsetWidth||260,h=tip.offsetHeight||50;tip.style.left=Math.min(innerWidth-w-pad,e.clientX+14)+'px';tip.style.top=Math.max(pad,Math.min(innerHeight-h-pad,e.clientY+14))+'px'}
function geBindGanttResizeR13(){const grid=document.querySelector('.ge-gantt-grid-r13'),grip=document.querySelector('.ge-gantt-resize-r13');if(!grid||!grip||grip.dataset.bound)return;grip.dataset.bound='1';grip.onpointerdown=e=>{e.preventDefault();const x=e.clientX,w=parseFloat(getComputedStyle(grid).getPropertyValue('--ge-gantt-project-width'))||340;const move=ev=>grid.style.setProperty('--ge-gantt-project-width',Math.max(220,Math.min(620,w+ev.clientX-x))+'px');const up=()=>{removeEventListener('pointermove',move);removeEventListener('pointerup',up)};addEventListener('pointermove',move);addEventListener('pointerup',up)}}
window.geSetCalendarWorkspace=function(view){const tabs=document.getElementById('geWorkspaceTabsR10'),cal=document.querySelector('.project-workspace-v253');if(!tabs||!cal)return;let alt=document.getElementById('geWorkspaceAltR10');if(!alt){alt=document.createElement('section');alt.id='geWorkspaceAltR10';cal.insertAdjacentElement('afterend',alt)}tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));cal.style.display=view==='calendar'?'':'none';alt.style.display=view==='calendar'?'none':'';if(view==='calendar'){window.geCalRenderV2533?.();return}const tp=new URLSearchParams(location.search).get('touchpoint')||'';if(tp&&!geGanttStateR16.filters.touchpoint)geGanttStateR16.filters.touchpoint=tp;const rows=filteredRows();if(view==='project'){alt.innerHTML=`${geGanttFiltersR15()}<div class="ge-detail-table-r10"><table><thead><tr><th>Type</th><th>Initiative</th><th>Item</th><th>Touch Point</th><th>PIC</th><th>Start</th><th>Due</th><th>Status</th><th>Progress</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.kind)}</td><td>${esc(r.initiative)}</td><td><b>${esc(r.title)}</b></td><td>${esc(r.touchpoints.join(', ')||'-')}</td><td>${esc(r.pic)}</td><td>${esc(r.start||'-')}</td><td>${esc(r.due||'-')}</td><td>${esc(r.status||'-')}</td><td>${r.progress}%</td></tr>`).join('')||'<tr><td colspan="9">Belum ada project data.</td></tr>'}</tbody></table></div>`;geBindGanttFiltersR15();return}alt.innerHTML=geScaleControlsR16()+geGanttFiltersR15()+gantt(rows,tp);geBindGanttFiltersR15();requestAnimationFrame(()=>{geBindGanttResizeR13();geBindGanttTooltipR17()})};
window.geInitCalendarWorkspaceCanonical=function(){const tabs=document.getElementById('geWorkspaceTabsR10');tabs?.querySelectorAll('button').forEach(b=>b.onclick=()=>window.geSetCalendarWorkspace(b.dataset.view));const q=new URLSearchParams(location.search),view=['calendar','project','gantt'].includes(q.get('view'))?q.get('view'):'calendar';window.geSetCalendarWorkspace(view)};

function airports(){return (store().airports||[]).map(a=>({...a,code:String(a.code||a.airportCode||a.iata||a.stationCode||'').trim().toUpperCase(),city:a.city||a.location||a.airportCity||'',airportName:a.airportName||a.name||a.airport||'',wilayah:a.wilayah||a.serviceRegion||a.networkRegion||a.region||'Domestik',status:a.status||'Active',lat:Number(a.lat??a.latitude??a.coordinates?.lat??0),lon:Number(a.lon??a.lng??a.longitude??a.coordinates?.lng??0)})).filter(a=>a.code)}
function bindMapInteraction(){const map=document.getElementById('interactiveMap'),stage=document.getElementById('mapStage');if(!map||!stage||map.dataset.r11Bound)return;map.dataset.r11Bound='1';let scale=1,panX=0,panY=0,drag=false,sx=0,sy=0,px=0,py=0;const apply=()=>{stage.style.transformOrigin='50% 50%';stage.style.transform=`translate(${panX}px,${panY}px) scale(${scale})`;const l=document.getElementById('mapZoomLabel');if(l)l.textContent=`Operational Network • ${Math.round(scale*100)}%`};map.addEventListener('wheel',e=>{e.preventDefault();scale=Math.max(1,Math.min(3.5,scale*(e.deltaY<0?1.1:.9)));apply()},{passive:false});map.addEventListener('pointerdown',e=>{if(e.target.closest('button,.airport-marker,.map-tooltip,.map-control-rail-v216'))return;drag=true;sx=e.clientX;sy=e.clientY;px=panX;py=panY;map.setPointerCapture?.(e.pointerId);map.classList.add('is-panning-r11')});map.addEventListener('pointermove',e=>{if(!drag)return;panX=px+(e.clientX-sx);panY=py+(e.clientY-sy);apply()});const end=e=>{drag=false;map.classList.remove('is-panning-r11');try{map.releasePointerCapture?.(e.pointerId)}catch{}};map.addEventListener('pointerup',end);map.addEventListener('pointercancel',end);map.addEventListener('dblclick',e=>{if(e.target.closest('button,.airport-marker'))return;scale=1;panX=panY=0;apply()});apply()}
window.geInitAirportCanonical=function(){const rows=(typeof geAirportVisibleRows==='function'?geAirportVisibleRows():airports()),d=store();d.airports=rows;window.renderAirportMapMarkers?.();window.geUpdateMapRegionCounts?.();bindMapInteraction();const body=document.getElementById('rows'),stats=document.getElementById('netStats');if(stats)stats.innerHTML=`<div class="ge-card ge-stat"><small>Stations / Airports</small><b>${rows.length}</b></div><div class="ge-card ge-stat"><small>Active</small><b>${rows.filter(x=>x.status==='Active').length}</b></div><div class="ge-card ge-stat"><small>Regions</small><b>${new Set(rows.map(x=>x.wilayah).filter(Boolean)).size}</b></div>`;if(body)body.innerHTML=rows.length?rows.map(a=>`<tr><td><b>${esc(a.code)}</b></td><td>${esc(a.airportName||'-')}</td><td>${esc(a.city||'-')}</td><td>${esc(a.wilayah||'-')}</td><td>${esc(a.gm||a.generalManager||'-')}</td><td>-</td><td>-</td><td>${esc(a.status)}</td></tr>`).join(''):'<tr><td colspan="8">Data Airport/Station belum tersedia.</td></tr>'};
})();


/* Canonical view controls shared by Initiative and Lounge/Tenant. */
(function(){
 window.geSetLoungeViewR6=function(view){const detail=view==='detail',grid=document.getElementById('loungeCardGridV237'),table=document.querySelector('.lounge-table-fallback-v237'),pager=document.getElementById('loungeCardPageInfoV237')?.parentElement;if(grid)grid.style.display=detail?'none':'';if(table){table.classList.toggle('ge-p29-table-visible',detail);table.style.removeProperty('display');}if(pager)pager.style.display=detail?'none':'';};
 const oldRender=window.renderLounges; if(oldRender)window.renderLounges=function(){oldRender();const v=document.getElementById('geLoungeViewSelectR6')?.value||'grid';window.geSetLoungeViewR6(v)};
})();


/* R12 CANONICAL UI CONTRACT — replaces obsolete mutation behavior; no parallel data model. */
(function(){
'use strict';
const esc12=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function ensureInitiativeCanonicalFields(){
 const modal=document.getElementById('initiativeModalV224'); if(!modal)return;
 const ensure=(hiddenId,pickerId,labelText)=>{const hidden=document.getElementById(hiddenId);if(hidden){hidden.type='hidden';hidden.removeAttribute('multiple');hidden.removeAttribute('size');hidden.style.display='none';}let host=document.getElementById(pickerId);if(!host&&hidden?.parentElement){host=document.createElement('div');host.id=pickerId;host.className='ge-picker-r11';hidden.parentElement.insertBefore(host,hidden);}return host;};
 ensure('initiativeAirportV224','initiativeStationPickerR11','Station / Area');
 ensure('initiativeJourneyV224','initiativeJourneyPickerR11','Journey Scope');
 ensure('initiativeTouchpointV224','initiativeTouchpointPickerR11','Touch Point');
}
const open0=window.openInitiativeModalV224;
window.openInitiativeModalV224=function(id=null){ensureInitiativeCanonicalFields();return open0?.(id)};
window.geEnsureInitiativeCanonicalFieldsR12=ensureInitiativeCanonicalFields;

function installSearchableSelect(select){
 if(window.GEGlobalSelect)return;
 if(!select||select.multiple||select.dataset.comboR12)return;select.dataset.comboR12='1';
 const wrap=document.createElement('div');wrap.className='ge-combo-r12';
 const input=document.createElement('input');input.type='text';input.className='ge-combo-input-r12';input.placeholder=select.options[0]?.textContent||'Pilih atau ketik...';input.autocomplete='off';
 const toggle=document.createElement('button');toggle.type='button';toggle.className='ge-combo-toggle-r12';toggle.setAttribute('aria-label','Buka pilihan');toggle.textContent='⌄';
 const menu=document.createElement('div');menu.className='ge-combo-menu-r12';
 select.parentNode.insertBefore(wrap,select);wrap.append(input,toggle,menu,select);select.classList.add('ge-combo-source-r12');
 const render=()=>{const q=input.value.trim().toLowerCase(),opts=[...select.options].filter((o,i)=>i>0&&(!q||o.textContent.toLowerCase().includes(q)));menu.innerHTML=opts.length?opts.map(o=>`<button type="button" data-value="${esc12(o.value)}">${esc12(o.textContent)}</button>`).join(''):'<div class="ge-combo-empty-r12">Tidak ada pilihan yang cocok.</div>';menu.querySelectorAll('button').forEach(b=>b.onclick=()=>{select.value=b.dataset.value;input.value=b.textContent;menu.classList.remove('show');select.dispatchEvent(new Event('change',{bubbles:true}))})};
 const open=()=>{render();menu.classList.add('show')};toggle.onclick=()=>menu.classList.toggle('show')?render():null;input.onfocus=open;input.oninput=()=>{select.value='';open();select.dispatchEvent(new Event('change',{bubbles:true}))};
 document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target))menu.classList.remove('show')});
 select.addEventListener('change',()=>{const o=select.selectedOptions?.[0];if(o&&select.value)input.value=o.textContent;else if(!select.value&&document.activeElement!==input)input.value=''});
}
window.geInstallLoungeFiltersR12=function(){
 const free=document.getElementById('loungeFilterTextR6');if(free)free.remove();
 ['loungeRegionFilter','loungeAirportFilter','loungeNameFilter','loungeStatusFilter'].forEach(id=>installSearchableSelect(document.getElementById(id)));
};
const lounge0=window.renderLounges;
if(lounge0)window.renderLounges=function(){const r=lounge0();window.geInstallLoungeFiltersR12();const v=document.getElementById('geLoungeViewSelectR6')?.value||'grid';window.geSetLoungeViewR6?.(v);return r};
})();

/* R19 — consolidated interaction fixes: planning actions + canonical list/detail views. */
(function(){
'use strict';
function byId(id){return document.getElementById(id)}
/* Inline handlers rendered by clean pages must resolve on window even when the canonical bundle is evaluated in an isolated scope. */
['openPlanningRecordModal','closePlanningRecordModal','savePlanningRecord','deletePlanningRecord','openServiceProcurementModalV243','closeServiceProcurementModalV243','saveServiceProcurementV243','deleteServiceProcurementV243','renderLoungeProcurement','renderTouchpointStandards'].forEach(name=>{
  try{ if(typeof eval(name)==='function') window[name]=eval(name); }catch(_e){}
});
function setLoungeView(view){
 const detail=view==='detail';
 window.GE_LOUNGE_VIEW_R19=detail?'detail':'grid';
 const grid=byId('loungeCardGridV237'), table=document.querySelector('.lounge-table-fallback-v237');
 const pager=byId('loungeCardPageInfoV237')?.parentElement;
 if(grid)grid.hidden=detail;
 if(table){table.classList.toggle('ge-p29-table-visible',detail);table.hidden=!detail;}
 if(pager)pager.hidden=detail;
 const sel=byId('geLoungeViewSelectR6');if(sel&&sel.value!==window.GE_LOUNGE_VIEW_R19)sel.value=window.GE_LOUNGE_VIEW_R19;
}
window.geSetLoungeViewR6=setLoungeView;
function bindLoungeView(){
 const sel=byId('geLoungeViewSelectR6');if(sel&&!sel.dataset.r19){sel.dataset.r19='1';sel.onchange=()=>setLoungeView(sel.value);}
 setLoungeView(window.GE_LOUNGE_VIEW_R19||sel?.value||'grid');
}
function setInitiativeView(view){
 window.GE_INITIATIVE_VIEW_R4=view==='list'?'list':'grid';
 const sel=byId('geInitiativeViewSelectR6');if(sel&&sel.value!==window.GE_INITIATIVE_VIEW_R4)sel.value=window.GE_INITIATIVE_VIEW_R4;
 document.querySelectorAll('#geInitiativeViewToggleR4 button').forEach(b=>b.classList.toggle('active',b.dataset.view===window.GE_INITIATIVE_VIEW_R4));
 if(typeof window.renderInitiatives==='function')window.renderInitiatives();
}
window.geSetInitiativeViewR19=setInitiativeView;
function bindInitiativeView(){
 const sel=byId('geInitiativeViewSelectR6');if(sel&&!sel.dataset.r19){sel.dataset.r19='1';sel.onchange=()=>setInitiativeView(sel.value);}
 document.querySelectorAll('#geInitiativeViewToggleR4 button').forEach(b=>{if(b.dataset.r19)return;b.dataset.r19='1';b.onclick=()=>setInitiativeView(b.dataset.view);});
}
function bindPlanningActions(){
 document.querySelectorAll('button[onclick*="openPlanningRecordModal"],button[onclick*="openServiceProcurementModalV243"]').forEach(b=>{b.disabled=false;b.style.pointerEvents='auto';});
}
function init(){bindLoungeView();bindInitiativeView();bindPlanningActions();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,80));else setTimeout(init,80);
const mo=new MutationObserver(()=>{bindLoungeView();bindInitiativeView();bindPlanningActions();});
if(document.body)mo.observe(document.body,{childList:true,subtree:true});else document.addEventListener('DOMContentLoaded',()=>mo.observe(document.body,{childList:true,subtree:true}));
})();

/* R20 consolidated browser corrections: Lounge hierarchy, Initiative list, map coordinates, Branch Office polish. */
(function(){'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function store(){return window.GEStore?.get?.()||window.data||{}}
/* Price insight belongs after the operational list/table, never between cards and details. */
function moveLoungePriceSummary(){const price=document.getElementById('loungePriceSummaryV243')?.closest('.lounge-price-summary-v243'),table=document.querySelector('.lounge-table-fallback-v237');if(price&&table&&price.previousElementSibling!==table)table.insertAdjacentElement('afterend',price)}
const loungeRender=window.renderLounges;if(loungeRender)window.renderLounges=function(){const r=loungeRender.apply(this,arguments);moveLoungePriceSummary();setTimeout(()=>window.geEnhanceAllTables?.(),0);return r};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',moveLoungePriceSummary);else moveLoungePriceSummary();

/* Final canonical Initiative Grid/List view. This wrapper is intentionally last so legacy exports cannot overwrite it. */
const initRender=window.renderInitiatives;
if(initRender)window.renderInitiatives=function(){const out=initRender.apply(this,arguments),view=window.GE_INITIATIVE_VIEW_R4||document.getElementById('geInitiativeViewSelectR6')?.value||'grid';if(view!=='list')return out;let rows=[];try{rows=typeof currentInitiativeRows==='function'?currentInitiativeRows().filter(typeof geInitiativeScopedV224==='function'?geInitiativeScopedV224:()=>true):(store().initiatives||[])}catch(e){rows=store().initiatives||[]}const host=document.getElementById('initRows');if(host){host.innerHTML=`<div class="ge-initiative-list-r4"><table data-initiative-list-r26><thead><tr><th data-sort="0">Initiative ↕</th><th data-sort="1">Journey ↕</th><th data-sort="2">Touch Point ↕</th><th data-sort="3">Station ↕</th><th data-sort="4">PIC ↕</th><th data-sort="5">Due ↕</th><th data-sort="6">Progress ↕</th><th>Action</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.name||'-')}</b></td><td>${esc((x.journeyScopes||[x.journey]).filter(Boolean).join(', '))}</td><td>${esc((x.touchpoints||[x.tp||x.touchpoint]).filter(Boolean).join(', '))}</td><td>${esc((x.stations||[x.airport]).filter(Boolean).join(', '))}</td><td>${esc(x.pic||'-')}</td><td>${esc(x.dueDate||x.endDate||'-')}</td><td>${Number(x.real||0)}% / ${Number(x.plan||0)}%</td><td>${typeof geInitiativeManageButtonsV224==='function'?geInitiativeManageButtonsV224(x):''}</td></tr>`).join('')||'<tr><td colspan="8">Belum ada inisiatif pada filter ini.</td></tr>'}</tbody></table></div>`;window.geEnhanceAllTables?.();const t=host.querySelector('table[data-initiative-list-r26]');t?.querySelectorAll('th[data-sort]').forEach(th=>{th.style.cursor='pointer';th.onclick=()=>{const i=Number(th.dataset.sort),body=t.tBodies[0],dir=th.dataset.dir==='asc'?-1:1;[...body.rows].sort((a,b)=>a.cells[i].innerText.localeCompare(b.cells[i].innerText,'id',{numeric:true})*dir).forEach(r=>body.appendChild(r));th.dataset.dir=dir===1?'asc':'desc'}})}return out};
window.geSetInitiativeViewR20=function(v){window.GE_INITIATIVE_VIEW_R4=v;document.querySelectorAll('#geInitiativeViewToggleR4 [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v));window.renderInitiatives?.()};
setTimeout(()=>{document.querySelectorAll('#geInitiativeViewToggleR4 [data-view]').forEach(b=>b.onclick=()=>window.geSetInitiativeViewR20(b.dataset.view));const s=document.getElementById('geInitiativeViewSelectR6');if(s)s.onchange=()=>window.geSetInitiativeViewR20(s.value)},0);

/* Airport map: preserve real Firestore coordinates and provide known station coordinates only when source coordinates are absent. */
const GEO={CGK:[-6.1256,106.6559],DPS:[-8.7482,115.1672],SUB:[-7.3798,112.7873],KNO:[3.6422,98.8853],UPG:[-5.0616,119.554],BPN:[-1.2683,116.8945],HLP:[-6.2666,106.891],YIA:[-7.9053,110.0573],BDO:[-6.9006,107.5763],KOE:[-10.1716,123.6711],AAP:[-0.3744,117.2502],BDJ:[-3.4424,114.7626],BKS:[-3.8637,102.339],PLM:[-2.8983,104.6999],PKU:[0.4608,101.4445],PDG:[-0.7869,100.2806],JOG:[-7.7882,110.4318],SRG:[-6.9707,110.3732],SOC:[-7.5161,110.7575],LOP:[-8.7573,116.2767],MDC:[1.5493,124.9263],AMQ:[-3.7103,128.0891],DJJ:[-2.5769,140.5164],TIM:[-4.5283,136.8874],SOQ:[-0.894,131.287],HKG:[22.308,113.9185],SIN:[1.3644,103.9915],KUL:[2.7456,101.7099],BKK:[13.69,100.7501],NRT:[35.772,140.3929],HND:[35.5494,139.7798],ICN:[37.4602,126.4407],SYD:[-33.9399,151.1753],MEL:[-37.669,144.841],JED:[21.6702,39.1525],MED:[24.5534,39.7051],AMS:[52.3105,4.7683]};
function repairMapCoords(){const d=store(),rows=d.airports||[];let changed=false;rows.forEach(a=>{const c=String(a.code||a.airportCode||a.iata||a.stationCode||'').toUpperCase(),lat=Number(a.lat??a.latitude??a.coordinates?.lat??0),lon=Number(a.lon??a.lng??a.longitude??a.coordinates?.lng??0);if((!Number.isFinite(lat)||!Number.isFinite(lon)||(lat===0&&lon===0))&&GEO[c]){a.lat=GEO[c][0];a.lon=GEO[c][1];changed=true}});return changed}
const mapRender=window.renderAirportMapMarkers;if(mapRender)window.renderAirportMapMarkers=function(){repairMapCoords();return mapRender.apply(this,arguments)};
setTimeout(()=>{repairMapCoords();window.renderAirportMapMarkers?.()},120);

/* Branch Office: provider planning is not labelled as Lounge service; keep action compact. */
function polishBO(){document.querySelectorAll('h1,h2,h3,p,.section-subtitle').forEach(el=>{if(/Layanan Lounge\s*&\s*Service Procurement/i.test(el.textContent||''))el.textContent=(el.textContent||'').replace(/Layanan Lounge\s*&\s*Service Procurement/ig,'Service Provider & Procurement')});document.querySelectorAll('a,button').forEach(el=>{if(/Kelola di Lounge Master/i.test(el.textContent||'')){el.textContent='Kelola';el.classList.add('ge-bo-manage-r20')}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',polishBO);else polishBO();
})();


/* ==============================================================
   R32 — Standalone Airport Map marker renderer.
   Does not depend on private symbols from the legacy runtime IIFE.
   ============================================================== */
(function(){'use strict';
const GEO={CGK:[-6.1256,106.6559],DPS:[-8.7482,115.1672],SUB:[-7.3798,112.7873],KNO:[3.6422,98.8853],UPG:[-5.0616,119.554],BPN:[-1.2683,116.8945],HLP:[-6.2666,106.891],YIA:[-7.9053,110.0573],BDO:[-6.9006,107.5763],KOE:[-10.1716,123.6711],AAP:[-0.3744,117.2502],BDJ:[-3.4424,114.7626],BKS:[-3.8637,102.339],PLM:[-2.8983,104.6999],PKU:[0.4608,101.4445],PDG:[-0.7869,100.2806],JOG:[-7.7882,110.4318],SRG:[-6.9707,110.3732],SOC:[-7.5161,110.7575],LOP:[-8.7573,116.2767],MDC:[1.5493,124.9263],AMQ:[-3.7103,128.0891],DJJ:[-2.5769,140.5164],TIM:[-4.5283,136.8874],SOQ:[-0.894,131.287],HKG:[22.308,113.9185],SIN:[1.3644,103.9915],KUL:[2.7456,101.7099],BKK:[13.69,100.7501],NRT:[35.772,140.3929],HND:[35.5494,139.7798],ICN:[37.4602,126.4407],SYD:[-33.9399,151.1753],MEL:[-37.669,144.841],JED:[21.6702,39.1525],MED:[24.5534,39.7051],AMS:[52.3105,4.7683]};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=()=>window.GEStore?.get?.()||{};
const codeOf=x=>String(x?.code||x?.airportCode||x?.iata||x?.stationCode||x?.station||x?.airport||'').trim().toUpperCase();
function coords(x,c){let lat=Number(x?.lat??x?.latitude??x?.coordinates?.lat),lon=Number(x?.lon??x?.lng??x?.longitude??x?.coordinates?.lng);if((!Number.isFinite(lat)||!Number.isFinite(lon)||(lat===0&&lon===0))&&GEO[c])[lat,lon]=GEO[c];return {lat,lon}}
function rows(){const d=db(),base=[],seen=new Set();const add=x=>{const c=codeOf(x);if(!c||seen.has(c))return;const q=coords(x,c);if(!Number.isFinite(q.lat)||!Number.isFinite(q.lon))return;if(typeof window.gxAirportAllowed==='function'&&!window.gxAirportAllowed(c))return;seen.add(c);base.push({...x,code:c,lat:q.lat,lon:q.lon,city:x.city||x.location||'',airportName:x.airportName||x.name||x.airport||'',wilayah:x.wilayah||x.serviceRegion||x.networkRegion||x.region||'Domestik',status:x.status||'Active'})};(d.airports||[]).forEach(add);['lounges','serviceProcurement','stationMaterials','airportSystems','facilities','assets'].forEach(k=>(d[k]||[]).forEach(add));return base}
function providers(c){const d=db(),today=new Date();today.setHours(0,0,0,0);const state=x=>{const end=x.endDate||x.until||x.effectiveUntil;if(end){const e=new Date(String(end).slice(0,10)+'T23:59:59');if(!isNaN(e)&&e<today)return'expired'}return /inactive|expired|terminate|closed|non.?active/i.test(String(x.status||x.documentStatus||''))?'expired':'active'};const match=x=>{const vals=[x.airport,x.station,x.stationCode,x.code].flat().map(v=>String(v||'').toUpperCase());return vals.includes(c)};return [...(d.lounges||[]).filter(match).map(x=>({type:'lounge',status:state(x),name:x.name||x.provider||'Lounge/Tenant'})),...(d.serviceProcurement||[]).filter(x=>match(x)&&/gha|ground handling|sgha|handling/i.test(String(x.categoryService||x.serviceType||x.scope||x.name||''))).map(x=>({type:'gha',status:state(x),name:x.provider||x.vendor||x.serviceName||x.name||'GHA'}))]}
function pos(lat,lon){return{left:(Math.max(-20,Math.min(180,lon))+20)/200*100,top:(75-Math.max(-50,Math.min(75,lat)))/125*100}}
function controls(){const tools=document.querySelector('.map-search-tools');if(!tools)return;if(!document.getElementById('mapProviderTypeR32'))tools.insertAdjacentHTML('beforeend','<select id="mapProviderTypeR32"><option value="">Semua Service Provider</option><option value="lounge">Lounge / Tenant</option><option value="gha">Ground Handling Agent</option></select><select id="mapProviderStatusR32"><option value="">Semua Provider Status</option><option value="active">Active</option><option value="expired">Expired</option></select>');['mapProviderTypeR32','mapProviderStatusR32','mapAirportSearch','mapStatusFilter','mapPendingFilter','mapVendorFilterV244'].forEach(id=>{const e=document.getElementById(id);if(e&&!e.dataset.bound){e.dataset.bound='1';e.addEventListener(id==='mapAirportSearch'?'input':'change',render)}})}
function filtered(){let a=rows(),q=(document.getElementById('mapAirportSearch')?.value||'').toLowerCase(),st=document.getElementById('mapStatusFilter')?.value||'',type=document.getElementById('mapProviderTypeR32')?.value||'',ps=document.getElementById('mapProviderStatusR32')?.value||'';if(q)a=a.filter(x=>[x.code,x.city,x.airportName,x.gm].join(' ').toLowerCase().includes(q));if(st)a=a.filter(x=>String(x.status)===st);const region=window.GEActiveMapRegion||'';if(region)a=a.filter(x=>String(x.wilayah)===region);const pending=document.getElementById('mapPendingFilter')?.value||'';if(pending)a=a.filter(x=>pending==='pending'?Number(x.pending||0)>0:Number(x.pending||0)===0);const vendor=document.getElementById('mapVendorFilterV244')?.value||'';if(vendor)a=a.filter(x=>providers(x.code).some(p=>p.name===vendor));if(type||ps)a=a.filter(x=>providers(x.code).some(p=>(!type||p.type===type)&&(!ps||p.status===ps)));return a}
function markerState(x){const type=document.getElementById('mapProviderTypeR32')?.value||'',ps=document.getElementById('mapProviderStatusR32')?.value||'',p=providers(x.code).filter(v=>(!type||v.type===type)&&(!ps||v.status===ps));if(type||ps){if(p.some(v=>v.status==='active'))return'provider-active';if(p.some(v=>v.status==='expired'))return'provider-expired';return'provider-none'}return /inactive/i.test(String(x.status))?'airport-inactive':Number(x.pending||0)>0?'airport-pending':'airport-active'}
function detail(c,m){document.querySelectorAll('#airportMarkerLayer .airport-marker').forEach(x=>x.classList.remove('active'));m?.classList.add('active');const x=rows().find(v=>v.code===c),host=document.getElementById('airportDetail');if(!x||!host)return;const p=providers(c);host.innerHTML=`<div class="code">${esc(c)}</div><h2>${esc(x.city||x.airportName||c)}</h2><p class="section-subtitle">${esc(x.airportName||'Airport / Branch Office')}</p><div class="detail-row">Status<b>${esc(x.status)}</b></div><div class="detail-row">Lounge / Tenant<b>${p.filter(v=>v.type==='lounge').length}</b></div><div class="detail-row">Ground Handling Agent<b>${p.filter(v=>v.type==='gha').length}</b></div><div class="detail-row">Active Provider<b>${p.filter(v=>v.status==='active').length}</b></div><div class="detail-row">Expired Provider<b>${p.filter(v=>v.status==='expired').length}</b></div><div class="detail-row">Koordinat<b>${x.lat.toFixed(4)}, ${x.lon.toFixed(4)}</b></div>`}
function updateLegend(layer){const host=document.querySelector('.map-legend-v216');if(!host)return;const type=document.getElementById('mapProviderTypeR32')?.value||'',status=document.getElementById('mapProviderStatusR32')?.value||'',vendor=document.getElementById('mapVendorFilterV244')?.value||'',counts={};layer.querySelectorAll('.r32-marker').forEach(m=>{for(const c of ['provider-active','provider-expired','provider-none','airport-active','airport-pending','airport-inactive'])if(m.classList.contains(c))counts[c]=(counts[c]||0)+1});const mode=type?type==='lounge'?'Lounge / Tenant':'Ground Handling Agent':status||vendor?'Service Provider':'Airport';const meaning=type||status||vendor?[['provider-active','Provider active'],['provider-expired','Provider expired'],['provider-none','Provider belum tercatat']]:[['airport-active','Airport active'],['airport-pending','Pending contract'],['airport-inactive','Airport inactive']];host.innerHTML='<strong>'+esc(mode)+' · '+layer.querySelectorAll('.r32-marker').length+' marker</strong>'+meaning.filter(([c])=>counts[c]).map(([c,label])=>'<span><i class="legend-dot '+c+'"></i>'+esc(label)+' ('+counts[c]+')</span>').join('')+(layer.querySelectorAll('.r32-marker').length?'':'<span>Tidak ada marker sesuai filter.</span>')}
function render(){controls();const layer=document.getElementById('airportMarkerLayer');if(!layer)return;const a=filtered();layer.innerHTML=a.map(x=>{const p=pos(x.lat,x.lon);return `<button type="button" class="airport-marker airport-marker-v214 r32-marker ${markerState(x)}" style="left:${p.left}%;top:${p.top}%" data-code="${esc(x.code)}"><span class="r27-marker-label">${esc(x.code)}</span><i class="r27-selected-pointer"></i></button>`}).join('');layer.querySelectorAll('.r32-marker').forEach(m=>{m.addEventListener('click',e=>{e.stopPropagation();detail(m.dataset.code,m)});m.addEventListener('mouseenter',e=>{if(typeof window.showAirportTooltip==='function')try{window.showAirportTooltip(e,m.dataset.code)}catch(_){}});m.addEventListener('mouseleave',()=>{if(typeof window.hideAirportTooltip==='function')try{window.hideAirportTooltip()}catch(_){}})});layer.dataset.markerCount=String(a.length);updateLegend(layer)}
window.renderAirportMapMarkers=render;window.geR32AirportRows=rows;window.addEventListener('gx-data-background-refresh',render);
const boot=()=>{controls();render();setTimeout(render,250);setTimeout(render,1200)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();


/* ==============================================================
   R40 — Airport Experience map detail / Station 360 navigation.
   Presentation-only enhancement over the canonical R32 marker source.
   ============================================================== */
(function(){'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const db=()=>window.GEStore?.get?.()||{};
const codeOf=x=>String(x?.code||x?.airportCode||x?.iata||x?.stationCode||x?.station||x?.airport||'').trim().toUpperCase();
const match=(x,c)=>[x?.airport,x?.station,x?.stationCode,x?.code,x?.airportCode,x?.iata].flat().some(v=>String(v||'').trim().toUpperCase()===c);
function station(c){return (window.geR32AirportRows?.()||db().airports||[]).find(x=>codeOf(x)===c)||{} }
function collections(c){const d=db();return{
 service:[...(d.lounges||[]).filter(x=>match(x,c)),...(d.serviceProcurement||[]).filter(x=>match(x,c))],
 facility:[...(d.facilities||[]).filter(x=>match(x,c)),...(d.assets||[]).filter(x=>match(x,c))],
 system:(d.airportSystems||[]).filter(x=>match(x,c)),
 contract:[...(d.lounges||[]).filter(x=>match(x,c)&& (x.agreement||x.agreementNo||x.contractNo||x.documentNo)),...(d.serviceProcurement||[]).filter(x=>match(x,c)&& (x.agreement||x.agreementNo||x.contractNo||x.documentNo))]
}}
function providerNames(c){const d=db(),names=[];[...(d.lounges||[]),...(d.serviceProcurement||[])].filter(x=>match(x,c)).forEach(x=>{const n=x.provider||x.vendor||x.operator||x.name||x.serviceName;if(n&&!names.includes(n))names.push(n)});return names}
function itemTitle(x,type){if(type==='system')return x.systemName||x.system||x.provider||x.vendor||x.name||'Airport System';if(type==='facility')return x.assetName||x.facilityName||x.name||x.type||'Facility / Asset';if(type==='contract')return x.agreement||x.agreementNo||x.contractNo||x.documentNo||x.name||'Agreement';return x.serviceName||x.categoryService||x.name||x.provider||x.vendor||'Service'}
function itemSub(x,type){if(type==='contract')return [x.provider||x.vendor,x.effectiveUntil||x.until||x.endDate].filter(Boolean).join(' • ');return [x.provider||x.vendor,x.status||x.documentStatus].filter(Boolean).join(' • ')}
function panel(c){const x=station(c),sets=collections(c),providers=providerNames(c),host=document.getElementById('airportDetail');if(!host)return;const city=x.city||x.location||x.airportName||c,airport=x.airportName||x.name||'Airport / Branch Office',cat=x.category||x.type||x.domInt||x.internationalDomestic||x.wilayah||'';host.innerHTML=`<div class="r40-map-detail"><div class="r40-map-head"><div><h2>${esc(city)}</h2><p>${esc(airport)}${cat?` • ${esc(cat)}`:''}</p></div><a class="r40-station360" href="app.html?page=station-360&station=${encodeURIComponent(c)}">Station 360</a></div><div class="r40-map-label">VENDOR / PROVIDER</div><div class="r40-provider-chips">${providers.length?providers.slice(0,5).map(n=>`<span>${esc(n)}</span>`).join(''):'<span class="muted">Belum ada provider</span>'}</div><div class="r40-map-tabs">${[['service','Service'],['facility','Facility'],['system','System'],['contract','Contract']].map(([k,l],i)=>`<button type="button" class="${i?'':'active'}" data-r40-tab="${k}">${l} <b>${sets[k].length}</b></button>`).join('')}</div><div class="r40-map-tabbody"></div></div>`;
 const body=host.querySelector('.r40-map-tabbody');function draw(k){host.querySelectorAll('[data-r40-tab]').forEach(b=>b.classList.toggle('active',b.dataset.r40Tab===k));const a=sets[k];body.innerHTML=a.length?a.slice(0,12).map(v=>`<div class="r40-map-item"><small>${esc(k.toUpperCase())}</small><b>${esc(itemTitle(v,k))}</b>${itemSub(v,k)?`<span>${esc(itemSub(v,k))}</span>`:''}</div>`).join(''):`<div class="r40-map-empty">Belum ada data ${esc(k)} untuk ${esc(c)}.</div>`}host.querySelectorAll('[data-r40-tab]').forEach(b=>b.onclick=()=>draw(b.dataset.r40Tab));draw('service')}
function bind(){const layer=document.getElementById('airportMarkerLayer');if(!layer)return;layer.querySelectorAll('.r32-marker').forEach(m=>{if(m.dataset.r40Bound)return;m.dataset.r40Bound='1';m.addEventListener('click',()=>setTimeout(()=>panel(m.dataset.code),0))})}
const old=window.renderAirportMapMarkers;if(old&&!old.__r40){const wrapped=function(){const v=old.apply(this,arguments);bind();return v};wrapped.__r40=true;window.renderAirportMapMarkers=wrapped}
function boot(){bind();const layer=document.getElementById('airportMarkerLayer');if(layer)new MutationObserver(bind).observe(layer,{childList:true});document.querySelectorAll('#airportNetworkSummary tbody tr.ge-station-row').forEach(r=>r.classList.add('r40-network-row'))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,120));else setTimeout(boot,120);

/* ==============================================================
   R42 — Airport map presentation / hover summary.
   Keeps click-to-detail behavior; hover is concise and non-blocking.
   ============================================================== */
(function(){'use strict';
const esc42=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db42=()=>window.GEStore?.get?.()||{};
const code42=x=>String(x?.code||x?.airportCode||x?.iata||x?.stationCode||x?.station||x?.airport||'').trim().toUpperCase();
const match42=(x,c)=>[x?.airport,x?.station,x?.stationCode,x?.code,x?.airportCode,x?.iata].flat().some(v=>String(v||'').trim().toUpperCase()===c);
function airport42(c){return (window.geR32AirportRows?.()||db42().airports||[]).find(x=>code42(x)===c)||{code:c}}
function sets42(c){const d=db42(),l=(d.lounges||[]).filter(x=>match42(x,c)),svc=(d.serviceProcurement||[]).filter(x=>match42(x,c)),fac=[...(d.facilities||[]),...(d.assets||[])].filter(x=>match42(x,c)),sys=(d.airportSystems||[]).filter(x=>match42(x,c)),people=(d.personnel||[]).filter(x=>match42(x,c));return{
 service:svc,
 lounge:l,
 people,
 facility:fac,
 system:sys,
 contract:[...l,...svc].filter(x=>x.agreement||x.agreementNo||x.contractNo||x.documentNo)
}}
function provider42(c){const d=db42(),out=[];[...(d.lounges||[]),...(d.serviceProcurement||[])].filter(x=>match42(x,c)).forEach(x=>{const n=x.provider||x.vendor||x.operator||x.name||x.serviceName;if(n&&!out.includes(n))out.push(n)});return out}
function title42(x,k){if(k==='system')return x.systemName||x.system||x.provider||x.vendor||x.name||'Airport System';if(k==='facility')return x.assetName||x.facilityName||x.name||x.type||'Facility / Asset';if(k==='people')return x.name||x.fullName||x.employeeName||x.pic||x.position||'Personnel';if(k==='lounge')return x.name||x.loungeName||x.provider||x.vendor||'Lounge';if(k==='contract')return x.agreement||x.agreementNo||x.contractNo||x.documentNo||x.name||'Agreement';return x.serviceName||x.categoryService||x.name||x.provider||x.vendor||'Service'}
function sub42(x,k){if(k==='contract')return [x.provider||x.vendor,x.effectiveUntil||x.until||x.endDate].filter(Boolean).join(' • ');if(k==='people')return [x.position||x.role,x.unit||x.organization].filter(Boolean).join(' • ');return [x.provider||x.vendor,x.status||x.documentStatus].filter(Boolean).join(' • ')}
function renderPanel42(c){const x=airport42(c),sets=sets42(c),host=document.getElementById('airportDetail');if(!host)return;const city=x.city||x.location||x.airportName||c,airport=x.airportName||x.name||x.airport||'Airport / Branch Office',cat=x.category||x.type||x.domInt||x.internationalDomestic||x.wilayah||x.region||'';const tabs=[['service','Service'],['lounge','Lounge'],['people','People'],['facility','Facility'],['system','System'],['contract','Contract']];host.innerHTML=`<div class="r42-map-detail"><div class="r42-map-head"><div><h2>${esc42(city)}</h2><p>${esc42(airport)}${cat?` • ${esc42(cat)}`:''}</p></div><a class="r42-station360" href="app.html?page=station-360&station=${encodeURIComponent(c)}">Station 360</a></div><div class="r42-map-tabscroll"><div class="r42-map-tabs">${tabs.map(([k,l],i)=>`<button type="button" class="${i?'':'active'}" data-r42-tab="${k}"><span>${l}</span><b>${sets[k].length}</b></button>`).join('')}</div></div><div class="r42-map-tabbody"></div></div>`;
 const body=host.querySelector('.r42-map-tabbody');function draw(k){host.querySelectorAll('[data-r42-tab]').forEach(b=>b.classList.toggle('active',b.dataset.r42Tab===k));const a=sets[k];body.innerHTML=a.length?a.slice(0,12).map(v=>`<div class="r42-map-item"><small>${esc42(k.toUpperCase())}</small><b>${esc42(title42(v,k))}</b>${sub42(v,k)?`<span>${esc42(sub42(v,k))}</span>`:''}</div>`).join(''):`<div class="r42-map-empty">Belum ada data ${esc42(k)} untuk ${esc42(c)}.</div>`}host.querySelectorAll('[data-r42-tab]').forEach(b=>b.onclick=()=>draw(b.dataset.r42Tab));draw('service')}
function hover42(ev,c){const x=airport42(c),sets=sets42(c),providers=provider42(c),t=document.getElementById('mapTooltip'),map=document.getElementById('interactiveMap');if(!t||!map)return;const city=x.city||x.location||x.airportName||c,airport=x.airportName||x.name||x.airport||'',status=x.status||'Active',mr=map.getBoundingClientRect(),er=ev.currentTarget.getBoundingClientRect();t.innerHTML=`<div class="r42-hover-head"><div><b>${esc42(c)} — ${esc42(city)}</b><small>${esc42(airport)}</small></div><span class="${String(status).toLowerCase()==='active'?'active':'inactive'}">${esc42(status)}</span></div><div class="r42-hover-grid"><div><small>Service</small><b>${sets.service.length}</b></div><div><small>Lounge</small><b>${sets.lounge.length}</b></div><div><small>Facility</small><b>${sets.facility.length}</b></div><div><small>System</small><b>${sets.system.length}</b></div></div>${providers.length?`<div class="r42-hover-provider">${esc42(providers[0])}${providers.length>1?` <span>+${providers.length-1}</span>`:''}</div>`:''}`;const tw=Math.min(330,Math.max(270,mr.width*.28));const center=er.left-mr.left+er.width/2;t.style.width=tw+'px';t.style.left=Math.min(mr.width-tw/2-12,Math.max(tw/2+12,center))+'px';const above=er.top-mr.top-t.offsetHeight-14;t.style.top=(above>12?above:Math.min(mr.height-t.offsetHeight-12,er.bottom-mr.top+14))+'px';t.classList.add('show','r42-tooltip')}
function hide42(){const t=document.getElementById('mapTooltip');t?.classList.remove('show','r42-tooltip')}
window.showAirportTooltip=hover42;window.hideAirportTooltip=hide42;
function bind42(){const layer=document.getElementById('airportMarkerLayer');if(!layer)return;layer.querySelectorAll('.r32-marker').forEach(m=>{if(m.dataset.r42Bound)return;m.dataset.r42Bound='1';m.addEventListener('mouseenter',e=>hover42(e,m.dataset.code));m.addEventListener('mouseleave',hide42);m.addEventListener('click',()=>setTimeout(()=>renderPanel42(m.dataset.code),0))})}
const prev42=window.renderAirportMapMarkers;if(prev42&&!prev42.__r42){const w=function(){const v=prev42.apply(this,arguments);bind42();return v};w.__r42=true;window.renderAirportMapMarkers=w}
function boot42(){bind42();const layer=document.getElementById('airportMarkerLayer');if(layer)new MutationObserver(bind42).observe(layer,{childList:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot42,150));else setTimeout(boot42,150);
})();

})();


/* Canonical Airport Experience & Assessment foundation — merged from the validated airport/assessment implementation. */
(function(){'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=k=>Array.isArray(window.GEStore?.get?.()?.[k])?window.GEStore.get()[k]:[];
function codeOf(x){return String(x?.stationCode||x?.station||x?.airportCode||x?.code||x?.iata||'').toUpperCase()}
function stationParam(){return new URLSearchParams(location.search).get('station')||new URLSearchParams(location.search).get('stationId')||''}
function addAirportTabs(){const main=$('#cleanPageOutlet');if(!main||$('.ge-assessment-airport-nav',main))return;const title=$('h1',main)?.textContent||'';if(!/Airport Experience|Station Profile|Station 360|Service Experience|Capability/i.test(title))return;const page=new URLSearchParams(location.search).get('page')||'index';const nav=document.createElement('nav');nav.className='ge-assessment-airport-nav';nav.innerHTML=[['airport-experience','Network & Map'],['station-360','Station 360'],['service-experience','Service Experience'],['capability-classification','Capability & Classification']].map(([p,l])=>`<a href="app.html?page=${p}" class="${page===p?'active':''}">${l}</a>`).join('');main.prepend(nav)}
function fixMap(){const tools=$('.map-search-tools');if(tools)tools.classList.add('ge-assessment-map-filter-row');}
function enhanceStation360(){const content=$('#content');if(!content||content.dataset.r47Bound)return;content.dataset.r47Bound='1';const render=()=>{const select=$('#station'),requested=stationParam();if(select&&requested&&!select.dataset.r47ParamApplied){select.dataset.r47ParamApplied='1';const option=[...select.options].find(o=>o.value===requested||o.textContent.trim().toUpperCase().startsWith(String(requested).toUpperCase()+' '));if(option){select.value=option.value;select.dispatchEvent(new Event('change'));}}const c=String(select?.selectedOptions?.[0]?.textContent||requested||'').split(/\s|—/)[0].toUpperCase();if(!c)return;const airport=arr('airports').find(x=>codeOf(x)===c)||{},airportClass=String(airport.airportClass||airport.classification||airport.class||'').trim().toLowerCase();const required=publishedItems().filter(x=>(!x.applicableStations||String(x.applicableStations).split(/[,;]+/).map(v=>v.trim().toUpperCase()).includes(c))&&(!x.airportClass||String(x.airportClass).trim().toLowerCase()===airportClass)),records=monitoringRecords().filter(x=>codeOf(x)===c&&x.standardLinked),latest=new Map();records.slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))).forEach(r=>(r.answers||[]).forEach(a=>latest.set(a.requirementRef+'|'+a.touchPoint,a)));const answers=required.map(x=>({...x,assessment:latest.get(x.requirementRef+'|'+x.touchPoint)})).filter(x=>x.assessment);const counted=answers.filter(x=>(x.assessment.compliant!==null&&x.assessment.compliant!==undefined||['Yes','No'].includes(x.assessment.result))),yes=counted.filter(x=>(x.assessment.compliant===true||x.assessment.compliant==null&&x.assessment.result==='Yes')).length,no=counted.filter(x=>(x.assessment.compliant===false||x.assessment.compliant==null&&x.assessment.result==='No')).length,alignments=arr('serviceAlignments').filter(x=>codeOf(x)===c),inventory=['facilities','assets','airportSystems','lounges','personnel'].reduce((n,k)=>n+arr(k).filter(x=>codeOf(x)===c).length,0);const existing=$('#r47StationHealth',content);existing?.remove();const block=document.createElement('section');block.id='r47StationHealth';block.className='ge-assessment-station360';const kv=(label,value,note)=>`<article><small>${label}</small><b>${value}</b><span>${note}</span></article>`;const rows=required.map(x=>{const current=alignments.find(v=>String(v.touchPoint||v.touchpoint||'').toLowerCase()===String(x.touchPoint).toLowerCase()&&String(v.requirementRef||v.requirementCode||'')===String(x.requirementRef));const condition=current?String(current.currentStatus||current.status||'Unverified'):'Unverified';const result=latest.get(x.requirementRef+'|'+x.touchPoint)?.result||'Not Assessed';const gap=/not available|missing|absent/i.test(condition)?'Requirement Gap':latest.get(x.requirementRef+'|'+x.touchPoint)?.finding||result==='No'?'Performance Finding':'—';return `<tr><td>${esc(x.touchPoint)}</td><td>${esc(x.pillar)}</td><td>${esc(x.requirementRef)}</td><td>${esc(condition)}</td><td>${esc(result)}</td><td>${esc(gap)}</td></tr>`}).join('');block.innerHTML=`<div class="ge-assessment-360-head"><div><span class="eyebrow">REQUIRED → CURRENT → ASSESSED → EXPERIENCED</span><h2>${esc(c)} Experience Health</h2><p>Source-of-truth tetap di requirement, master capability, monitoring, dan customer insight masing-masing.</p></div><a class="ge-btn" href="app.html?page=monitoring-assessment&station=${encodeURIComponent(c)}">Open Monitoring</a></div><div class="ge-assessment-layer-grid">${kv('REQUIRED',required.length||'—','Published mapped checklist requirements')}${kv('CURRENT',alignments.length||'—',`${inventory} inventory records · explicit mapping only`)}${kv('ASSESSED',counted.length?Math.round(yes/counted.length*100)+'%':'—',`${no} open NO response(s) · N/A excluded`)}${kv('EXPERIENCED','—','Customer voice shown when source mapping is available')}</div><div class="ge-assessment-three-pillar">${['People','Premises','Process'].map(p=>{const a=counted.filter(x=>x.pillar===p),ok=a.filter(x=>(x.assessment.compliant===true||x.assessment.compliant==null&&x.assessment.result==='Yes')).length;return `<article><h3>${p}</h3><b>${a.length?Math.round(ok/a.length*100)+'%':'—'}</b><p>${a.length} assessed · ${a.length-ok} NO finding(s)</p></article>`}).join('')}</div><section class="ge-card ge-assess-card"><h3>Required / Current / Assessed by Touch Point</h3><p>Current hanya menyatakan kondisi yang memang dipetakan. NO pada capability yang ada adalah performance finding; kebutuhan yang belum tersedia adalah requirement gap.</p><div class="table-wrap"><table><thead><tr><th>Touch Point</th><th>3P</th><th>Requirement</th><th>Current</th><th>Assessed</th><th>Gap / Finding</th></tr></thead><tbody>${rows||'<tr><td colspan="6">Belum ada template standard-linked yang published untuk station ini.</td></tr>'}</tbody></table></div></section>`;content.prepend(block)};setTimeout(render,350);$('#station')?.addEventListener('change',()=>setTimeout(render,60));$('#refresh')?.addEventListener('click',()=>setTimeout(render,150))}
function monitoringRecords(){const legacy=arr('monitoringAssessments');const modern=arr('formSubmissions').filter(x=>x.category==='Assessment').map(x=>{const f=x.formSnapshot?.sections?.flatMap(v=>v.fields||[])||[];return {id:x.id,stationCode:x.stationCode,date:x.submittedAt,standardLinked:true,answers:(x.findings||[]).map(a=>{const field=f.find(v=>v.id===a.fieldId)||{};const p=touchFor(a.touchpointId);return {requirementRef:a.requirementRef||'',touchPoint:p?.name||'',pillar:a.pillar||'',result:'No',finding:true,compliant:false}}).concat(f.filter(v=>!x.findings?.some(a=>a.fieldId===v.id)&&v.requirementRef&&v.touchpointId).map(v=>({requirementRef:v.requirementRef,touchPoint:touchFor(v.touchpointId)?.name||'',pillar:v.pillar||'',result:String(x.answers?.[v.id]||''),compliant:v.passValue!==''&&v.passValue!=null?String(x.answers?.[v.id])===String(v.passValue):null})))}});return legacy.concat(modern)}
function publishedItems(){return arr('monitoringTemplates').filter(t=>t.status==='Published'&&t.kind==='Standard-linked').flatMap(t=>(t.items||[]).map(item=>({...item,applicableStations:t.applicableStations||'',airportClass:t.airportClass||''}))).concat(arr('formTemplates').filter(t=>t.status==='Published'&&t.category==='Assessment').flatMap(t=>{const snapshot=t.versions?.find(v=>v.version===t.currentVersion)?.snapshot||t;return (snapshot.sections||[]).flatMap(s=>(s.fields||[]).filter(f=>f.requirementRef&&f.touchpointId&&f.journey&&f.pillar).map(f=>({requirementRef:f.requirementRef,touchpointId:f.touchpointId,touchPoint:touchFor(f.touchpointId)?.name||'',journey:f.journey,pillar:f.pillar,source:f.source||'Garuda Standard',applicableStations:snapshot.stationScope||'',airportClass:snapshot.airportClass||''}))) }))}
function latestFor(station,item){return monitoringRecords().filter(r=>r.standardLinked&&codeOf(r)===station).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).flatMap(r=>r.answers||[]).find(a=>a.requirementRef===item.requirementRef&&a.touchPoint===item.touchPoint)}
function touchMaster(){return arr('touchpoints').filter(x=>typeof x==='object'&&x.status!=='Inactive')}
function touchFor(v){return touchMaster().find(t=>[t.id,t.name,...(t.aliases||[])].some(n=>String(n).toLowerCase()===String(v||'').toLowerCase()))}
function renderServiceExperience(){const page=$('.ge-assessment-service-matrix')?.closest('.ge-assessment-foundation-page');if(!page)return;page.querySelector('.ge-assessment-service-matrix').hidden=true;const legacy=page.querySelector('.ge-assessment-service-matrix + .ge-card');if(legacy)legacy.hidden=true;let host=$('#r47ServiceAnalysis',page);if(!host){host=document.createElement('section');host.id='r47ServiceAnalysis';host.className='ge-card ge-assess-card';page.appendChild(host)}const prev=host.dataset,station=prev.station||'',journey=prev.journey||'',point=prev.point||'',pillar=prev.pillar||'',stations=[...new Set(arr('airports').map(codeOf).filter(Boolean))],masters=touchMaster(),points=masters.filter(t=>!journey||(t.journeys||[t.journey]).includes(journey)),chosen=points.find(t=>t.id===point),published=publishedItems().filter(x=>!chosen||touchFor(x.touchpointId||x.touchPoint)?.id===chosen.id),scoped=published.filter(x=>!station||!x.applicableStations||String(x.applicableStations).split(/[,;]+/).map(v=>v.trim().toUpperCase()).includes(station)).filter(x=>!pillar||x.pillar===pillar),stationSet=station?[station]:stations;const records=stationSet.flatMap(st=>scoped.map(x=>({station:st,...x,answer:latestFor(st,x)})));const cards=['People','Premises','Process'].map(p=>{const set=records.filter(x=>x.pillar===p),assessed=set.filter(x=>(x.answer?.compliant!==null&&x.answer?.compliant!==undefined||['Yes','No'].includes(x.answer?.result)));return `<button type="button" data-pillar="${p}" class="ge-experience-card ${pillar===p?'active':''}"><h3>${p}</h3><b>${assessed.length?Math.round(assessed.filter(x=>(x.answer.compliant===true||x.answer.compliant==null&&x.answer.result==='Yes')).length/assessed.length*100)+'%':'—'}</b><p>${set.length} requirement · ${assessed.filter(x=>(x.answer.finding||x.answer.result==='No')).length} finding</p></button>`}).join('');const voice=arr('customerExperience').filter(x=>String(x.status||'Published')==='Published'&&(!station||codeOf(x)===station)).flatMap(x=>(x.touchpoints||[]).filter(t=>['Pre-Journey','Pre-Flight','Post-Flight','Post-Journey'].includes(t.journey)).filter(t=>!chosen||touchFor(t.id||t.name)?.id===chosen.id).filter(t=>!journey||t.journey===journey).map(t=>({...t,period:x.period||''}))).sort((a,b)=>String(b.period).localeCompare(String(a.period)));host.innerHTML=`<h2>Service Experience · Ground Touch Points</h2><p>Requirement, kondisi, monitoring, dan suara pelanggan tetap ditampilkan menurut sumbernya. Checklist Custom tidak masuk perhitungan.</p><div class="ge-assess-form"><label>Station<select data-station><option value="">All Stations</option>${stations.map(v=>`<option value="${esc(v)}" ${v===station?'selected':''}>${esc(v)}</option>`).join('')}</select></label><label>Journey<select data-journey><option value="">All Ground Journey</option>${['Pre-Journey','Pre-Flight','Post-Flight','Post-Journey','Cross-Journey / End-to-End','Supporting / Enabler'].map(v=>`<option ${v===journey?'selected':''}>${v}</option>`).join('')}</select></label><label>Touch Point<select data-point><option value="">All Touch Points</option>${points.map(v=>`<option value="${esc(v.id)}" ${v.id===point?'selected':''}>${esc(v.name)}</option>`).join('')}</select></label></div><div class="ge-assessment-three-pillar">${cards}</div><p><b>Customer Voice:</b> ${voice.length?`${esc(voice[0].name)} · score ${esc(voice[0].score??'—')} · gap ${esc(voice[0].gap??'—')} (${esc(voice[0].period)})`:'Belum ada hasil CSI touch point pada pilihan ini.'}</p><div class="table-wrap"><table><thead><tr><th>Station</th><th>Touch Point</th><th>3P</th><th>Requirement</th><th>Current</th><th>Assessment</th><th>Finding</th></tr></thead><tbody>${records.map(x=>{const actual=arr('serviceAlignments').find(v=>codeOf(v)===x.station&&String(v.requirementRef||v.requirementCode||'')===x.requirementRef),result=x.answer?.result||'Not Assessed';return `<tr><td><a href="app.html?page=station-360&station=${encodeURIComponent(x.station)}">${esc(x.station)}</a></td><td>${esc(x.touchPoint)}</td><td>${esc(x.pillar)}</td><td>${esc(x.requirementRef)}</td><td>${esc(actual?.currentStatus||actual?.availability||'Unverified')}</td><td>${esc(result)}</td><td>${x.answer?.finding||result==='No'?'Performance Finding':'—'}</td></tr>`}).join('')||'<tr><td colspan="7">Belum ada template standard-linked yang Published untuk pilihan ini. Pilih atau buat di Monitoring & Assessment.</td></tr>'}</tbody></table></div><a class="ge-btn" href="app.html?page=monitoring-assessment">Open Monitoring & Assessment</a>`;host.querySelectorAll('select').forEach(el=>el.onchange=()=>{host.dataset[el.dataset.station!==undefined?'station':el.dataset.journey!==undefined?'journey':'point']=el.value;if(el.dataset.journey!==undefined)host.dataset.point='';renderServiceExperience()});host.querySelectorAll('[data-pillar]').forEach(el=>el.onclick=()=>{host.dataset.pillar=host.dataset.pillar===el.dataset.pillar?'':el.dataset.pillar;renderServiceExperience()})}
function renderCapability(){const page=$('.ge-assessment-four-layer')?.closest('.ge-assessment-foundation-page');if(!page)return;const host=page.querySelector('.ge-card');if(!host)return;const touchpoint=host.dataset.touchpoint||'',source=host.dataset.source||'',stations=arr('airports').map(x=>codeOf(x)).filter(Boolean),chosen=host.querySelector('[data-cap-station]')?.value||stations[0]||'',airport=arr('airports').find(x=>codeOf(x)===chosen)||{},airportClass=String(airport.airportClass||airport.classification||airport.class||'').trim().toLowerCase(),items=publishedItems().filter(x=>(!touchpoint||touchFor(x.touchpointId||x.touchPoint)?.id===touchpoint)&&(!source||String(x.source||'').toLowerCase().includes(source.toLowerCase()))).filter(x=>(!x.applicableStations||String(x.applicableStations).split(/[,;]+/).map(v=>v.trim().toUpperCase()).includes(chosen))&&(!x.airportClass||String(x.airportClass).trim().toLowerCase()===airportClass)),align=arr('serviceAlignments').filter(x=>codeOf(x)===chosen);host.innerHTML=`<h2>Required → Current → Assessed</h2><p>Airport Class memilih requirement yang berlaku. Current hanya berasal dari capability mapping yang diverifikasi.</p><label class="ge-cap-filter">Station <select data-cap-station>${stations.map(x=>`<option ${chosen===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label class="ge-cap-filter">Touch Point <select data-cap-point><option value="">All Ground Touch Points</option>${touchMaster().map(v=>`<option value="${esc(v.id)}" ${touchpoint===v.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select></label><label class="ge-cap-filter">Requirement Source <select data-cap-source><option value="">All Sources</option>${['Garuda','Airport Class','SkyTeam','Interline','Agreement'].map(v=>`<option ${source===v?'selected':''}>${v}</option>`).join('')}</select></label><div class="table-wrap"><table><thead><tr><th>Touch Point</th><th>3P</th><th>Source</th><th>Requirement</th><th>Current</th><th>Assessment</th><th>Gap / Finding</th></tr></thead><tbody>${items.length?items.map(x=>{const actual=align.find(v=>String(v.requirementRef||v.requirementCode||'')===x.requirementRef&&String(v.touchPoint||v.touchpoint||'')===x.touchPoint),current=String(actual?.currentStatus||actual?.status||'Unverified'),answer=latestFor(chosen,x)?.result||'Not Assessed',gap=/not available|missing|absent/i.test(current)?'Requirement Gap':latestFor(chosen,x)?.finding||answer==='No'?'Performance Finding':'—';return `<tr><td>${esc(x.touchPoint)}</td><td>${esc(x.pillar)}</td><td>${esc(x.source)}</td><td>${esc(x.requirementRef)}</td><td>${esc(current)}</td><td>${esc(answer)}</td><td>${esc(gap)}</td></tr>`}).join(''):'<tr><td colspan="7">No published requirement applies to this station/class.</td></tr>'}</tbody></table></div>`;page.querySelectorAll('.ge-assessment-four-layer article').forEach((card,index)=>{card.tabIndex=0;card.setAttribute('role','button');card.style.cursor='pointer';const source=['Airport Class','Garuda','SkyTeam','Agreement'][index];card.onclick=()=>{host.dataset.source=host.dataset.source===source?'':source;renderCapability()};card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();card.click()}};card.classList.toggle('active',host.dataset.source===source)});host.querySelector('[data-cap-station]').onchange=renderCapability;host.querySelector('[data-cap-point]').onchange=e=>{host.dataset.touchpoint=e.target.value;renderCapability()};host.querySelector('[data-cap-source]').onchange=e=>{host.dataset.source=e.target.value;renderCapability()}}
function boot(){addAirportTabs();fixMap();enhanceStation360();renderServiceExperience();renderCapability()}window.geInitAirportExperience=boot;window.addEventListener('gx-data-background-refresh',()=>setTimeout(boot,150));})();

