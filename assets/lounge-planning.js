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
  let loungeCardPage=1;
  const loungeCardPageSize=12;

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
  function airportMasterOptions(selected=''){
    let airports=[];
    try{airports=typeof GECore?.list==='function'?(GECore.list('airports')||[]):[]}catch(e){airports=[]}
    const rows=airports.map(x=>({code:String(x.code||x.airportCode||x.iata||x.stationCode||x.id||'').trim(),name:String(x.name||x.airportName||x.city||'').trim()})).filter(x=>x.code);
    const seen=new Set();
    return rows.filter(x=>{if(seen.has(x.code))return false;seen.add(x.code);return true}).map(x=>`<option value="${esc(x.code)}" ${x.code===String(selected||'').trim()?'selected':''}>${esc(x.code+(x.name?' — '+x.name:''))}</option>`).join('');
  }
  function currencyMasterOptions(selected=''){
    let rows=[];
    try{const catalog=typeof GEStore?.get==='function'?(GEStore.get()?.referenceCatalog||[]):[];rows=catalog.filter(x=>x&&x.kind==='currency'&&x.status!=='Inactive');}catch(e){rows=[]}
    const codes=[...new Set(rows.map(x=>String(x.code||x.id||'').trim().toUpperCase()).filter(Boolean))];
    return codes.map(code=>`<option value="${esc(code)}" ${code===String(selected||'').trim().toUpperCase()?'selected':''}>${esc(code)}</option>`).join('');
  }
  function moveModalToBody(modal){
    if(modal&&modal.parentElement!==document.body)document.body.appendChild(modal);
    return modal;
  }

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
      priceSchedules:schedules.length?checked.schedules.filter(x=>x.ok).map(x=>({effectiveFrom:x.effectiveFrom,effectiveTo:x.effectiveTo,price:x.price,currency:x.currency,priceBasis:x.priceBasis||'pax',priceNote:x.priceNote||''})):[]
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
      <div><label>Currency<select data-price-field="currency"><option value="">Pilih Mata Uang</option>${currencyMasterOptions(s.currency)}</select></label></div>
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

  function commonFormMarkup(prefix,model){
    const m=model||{};
    return `<div class="formgrid ge-p29-form-grid">
      <label>Region<select id="${prefix}Region"><option value="">Pilih Region</option><option ${m.region==='WEST'?'selected':''}>WEST</option><option ${m.region==='EAST'?'selected':''}>EAST</option><option ${m.region==='INT'?'selected':''}>INT</option></select></label>
      <label>Station<select id="${prefix}Airport" required><option value="">Pilih Station</option>${airportMasterOptions(m.airport)}</select></label>
      <label>Nama Layanan / Provider<input id="${prefix}Name" required value="${esc(m.name||'')}"></label>
      <label>Jenis Layanan<select id="${prefix}ServiceType" required><option value="">Pilih Jenis Layanan</option>${TYPES.map(t=>`<option value="${t}" ${m.serviceType===t?'selected':''}>${t}</option>`).join('')}</select></label>
      <label>PIC<input id="${prefix}Pic" value="${esc(m.pic||'')}"></label>
      <label>Agreement Start Date<input id="${prefix}Start" type="date" value="${esc(m.startDate||'')}"></label>
      <label>Agreement End Date<input id="${prefix}End" type="date" value="${esc(m.endDate||'')}"></label>
      <label>Mata Uang (single price)<select id="${prefix}Currency"><option value="">Pilih Mata Uang</option>${currencyMasterOptions(m.currency)}</select></label>
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
      priceSchedules:scheduleRowsFromForm(prefix+'Prices')
    };
  }

  function replaceModalContent(id,title,prefix,model){
    const modal=moveModalToBody(document.getElementById(id));if(!modal)return;
    const card=modal.querySelector('.modal-card');if(!card)return;
    card.innerHTML=`<button class="modal-x" type="button" onclick="${id==='loungeAddModalV221'?'closeLoungeAddModalV221()':'closeLoungeEdit()'}">×</button>
      <h2>${esc(title)}</h2><p class="section-subtitle">Satu struktur data untuk Add, Update, dan CSV. Lounge dan Tenant tetap merupakan Service Type yang berbeda.</p>
      <form id="${prefix}Form"><div id="${prefix}Errors"></div>${commonFormMarkup(prefix,model)}
      <div class="modal-actions sticky-actions"><button class="btn" type="submit">${id==='loungeAddModalV221'?'Simpan Layanan':'Simpan Update'}</button><button class="btn secondary" type="button" onclick="${id==='loungeAddModalV221'?'closeLoungeAddModalV221()':'closeLoungeEdit()'}">Batal</button></div></form>`;
    renderPriceRows(prefix+'Prices',model?.priceSchedules||[]);
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
    else data.lounges.push(obj);
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
  function comboText(selectId){
    const select=document.getElementById(selectId);
    return String(select?.closest('.ge-combo-r12')?.querySelector('.ge-combo-input-r12')?.value||'').trim().toLowerCase();
  }
  function selectedStations(){
    const select=document.getElementById('loungeAirportFilter');
    if(!select)return [];
    return [...(select.selectedOptions||[])].map(o=>String(o.value||'').trim().toUpperCase()).filter(Boolean);
  }
  function filteredRows(){
    const base=(data.lounges||[]).slice();
    const region=val('loungeRegionFilter'),provider=val('loungeNameFilter'),status=val('loungeStatusFilter'),type=filterType();
    const stations=selectedStations();
    const regionText=comboText('loungeRegionFilter'),providerText=comboText('loungeNameFilter'),statusText=comboText('loungeStatusFilter');
    return base.filter(x=>{
      const rt=resolveType(x),t=rt.value,rv=String(x.region||''),sv=String(x.airport||'').trim().toUpperCase(),pv=String(x.name||''),st=String(x.documentStatus||'');
      return (!region||rv===region)&&(!stations.length||stations.includes(sv))&&(!provider||pv===provider)&&(!status||st===status)&&(!regionText||rv.toLowerCase().includes(regionText))&&(!providerText||pv.toLowerCase().includes(providerText))&&(!statusText||st.toLowerCase().includes(statusText))&&(!type||t===type);
    });
  }
  window.loungeFiltered=function(){return filteredRows()};
  window.geLoungeCardSourceV237=function(){return filteredRows()};

  function statusForAgreement(x){
    const end=validDate(x?.endDate);if(!end)return {label:'Status tidak ditentukan',cls:'neutral'};
    const d=new Date(end+'T23:59:59');if(Number.isNaN(d.getTime()))return {label:'Requires Review',cls:'danger'};
    const now=new Date();if(d<now)return {label:'Agreement expired',cls:'danger'};
    const days=Math.ceil((d-now)/86400000);return days<90?{label:days+' hari tersisa',cls:'danger'}:days<180?{label:days+' hari tersisa',cls:'warning'}:{label:days+' hari tersisa',cls:'good'};
  }

  function renderCards(){
    const grid=document.getElementById('loungeCardGridV237');if(!grid)return;
    const rows=filteredRows(),pageSize=12,pages=Math.max(1,Math.ceil(rows.length/pageSize));
    if(typeof loungeCardPage!=='number')loungeCardPage=1;
    loungeCardPage=Math.min(Math.max(1,loungeCardPage),pages);
    const start=(loungeCardPage-1)*pageSize,slice=rows.slice(start,start+pageSize);
    grid.innerHTML=slice.map(x=>{
      const rt=resolveType(x),type=rt.value||'Requires Review',stateA=statusForAgreement(x),price=applicablePrice(x,new Date());
      const scheduleCount=Array.isArray(x.priceSchedules)?x.priceSchedules.length:0;
      const priceText=price.status==='CURRENT'||price.status==='LEGACY'?safePriceDisplay(price.currency,price.price):price.status==='NOT_APPLICABLE'?'Not Available':price.status==='INVALID'?'Requires Review':'Not Available';
      const priceMeta=scheduleCount?`${scheduleCount} Price Period${scheduleCount===1?'':'s'}`:'';
      const review=rt.status==='REVIEW'?`<div class="ge-p29-review-note">Requires Review: ${esc(rt.reason)}</div>`:'';
      const update=canEdit()?`<button class="btn secondary compact-btn" type="button" onclick="openLoungeEdit(${Number(x.id)})">Update</button>`:'';
      const del=canEdit()?`<button class="btn danger compact-btn" type="button" onclick="deleteLoungeV239(${Number(x.id)})">Hapus</button>`:'';
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
            ${priceMeta?`<div><dt>Price Schedule</dt><dd>${esc(priceMeta)}</dd></div>`:''}
            <div><dt>Agreement</dt><dd>${esc(x.documentNumber||'Not Available')}</dd></div>
          </div>${review}
          <div class="lounge-card-actions-v237">${detail}${update}${del}</div>
        </div>
      </article>`;
    }).join('')||'<div class="lounge-master-empty-v237">Belum ada data Lounge/Tenant pada filter ini.</div>';
    const info=document.getElementById('loungeCardPageInfoV237');if(info)info.textContent=`Halaman ${loungeCardPage} dari ${pages} • ${rows.length} data`;
    const prev=document.getElementById('loungeCardPrevV237'),next=document.getElementById('loungeCardNextV237');if(prev)prev.disabled=loungeCardPage<=1;if(next)next.disabled=loungeCardPage>=pages;
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
  window.renderLounges=function(){try{populateFilterOptions();renderTable();renderCards();renderPriceSummary();window.geSetLoungeViewP87?.(document.getElementById('geLoungeViewSelectR6')?.value||'grid');}catch(e){console.error('P29 Lounge render guard',e);const g=document.getElementById('loungeCardGridV237');if(g)g.innerHTML='<div class="lounge-master-empty-v237">Data Lounge/Tenant tidak dapat ditampilkan. Periksa data yang memerlukan review.</div>';}};

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
  window.confirmBulkImportV231=function(){
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

  function populateStationFilterOptions(){
    const select=document.getElementById('loungeAirportFilter');
    if(!select)return;
    const current=new Set([...(select.selectedOptions||[])].map(o=>String(o.value||'').trim().toUpperCase()).filter(Boolean));
    let rows=[];
    try{rows=(data.airports||[]).map(x=>({code:String(x.code||x.airportCode||x.iata||x.stationCode||x.id||'').trim().toUpperCase(),name:String(x.name||x.airportName||x.city||'').trim()}));}catch(e){}
    try{if(typeof GECore?.list==='function')rows=rows.concat((GECore.list('airports')||[]).map(x=>({code:String(x.code||x.airportCode||x.iata||x.stationCode||x.id||'').trim().toUpperCase(),name:String(x.name||x.airportName||x.city||'').trim()})));}catch(e){}
    rows=rows.concat((data.lounges||[]).map(x=>({code:String(x.airport||'').trim().toUpperCase(),name:''})));
    const seen=new Set(),unique=rows.filter(x=>x.code&&!seen.has(x.code)&&(seen.add(x.code),true)).sort((a,b)=>a.code.localeCompare(b.code));
    select.innerHTML=unique.map(x=>`<option value="${esc(x.code)}" ${current.has(x.code)?'selected':''}>${esc(x.code+(x.name?' — '+x.name:''))}</option>`).join('');
  }

  function setupFilterCombosR12(){
    document.querySelectorAll('.ge-combo-input-r12').forEach(input=>input.setAttribute('autocomplete','off'));
    document.querySelectorAll('.ge-combo-toggle-r12').forEach(btn=>btn.setAttribute('aria-haspopup','listbox'));
  }

  function setupStationMultiSelectR12(){
    const select=document.getElementById('loungeAirportFilter');if(!select)return;
    const existing=select.parentElement?.querySelector('.ge-station-multi-r12');
    if(existing){renderStationMultiOptionsR12(existing,select);return;}
    select.classList.add('ge-station-source-r12');
    const wrap=document.createElement('div');wrap.className='ge-station-multi-r12';
    wrap.innerHTML='<button type="button" class="ge-station-trigger-r12" aria-haspopup="listbox" aria-expanded="false"><span>Semua Station</span><i>▾</i></button><div class="ge-station-menu-r12" role="listbox"><input class="ge-station-search-r12" type="search" placeholder="Cari Station..." autocomplete="off"><div class="ge-station-options-r12"></div><div class="ge-station-menu-actions-r12"><button type="button" data-action="clear">Clear</button><button type="button" data-action="done">Selesai</button></div></div>';
    select.parentNode.insertBefore(wrap,select);
    const trigger=wrap.querySelector('.ge-station-trigger-r12'),menu=wrap.querySelector('.ge-station-menu-r12'),search=wrap.querySelector('.ge-station-search-r12');
    trigger.onclick=()=>{const open=menu.classList.toggle('show');trigger.setAttribute('aria-expanded',String(open));if(open){search.value='';renderStationMultiOptionsR12(wrap,select);search.focus()}};
    search.oninput=()=>renderStationMultiOptionsR12(wrap,select);
    wrap.querySelector('[data-action="clear"]').onclick=()=>{[...select.options].forEach(o=>o.selected=false);renderStationMultiOptionsR12(wrap,select);loungeCardPage=1;renderLounges()};
    wrap.querySelector('[data-action="done"]').onclick=()=>{menu.classList.remove('show');trigger.setAttribute('aria-expanded','false');loungeCardPage=1;renderLounges()};
    select.addEventListener('change',()=>{updateStationTriggerR12(wrap,select);loungeCardPage=1;renderLounges()});
    document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target)){menu.classList.remove('show');trigger.setAttribute('aria-expanded','false')}});
    renderStationMultiOptionsR12(wrap,select);
  }

  function updateStationTriggerR12(wrap,select){
    const selected=[...(select.selectedOptions||[])].filter(o=>o.value);
    const span=wrap.querySelector('.ge-station-trigger-r12 span');
    if(span)span.textContent=!selected.length?'Semua Station':selected.length===1?selected[0].textContent:`${selected.length} Station dipilih`;
  }
  function renderStationMultiOptionsR12(wrap,select){
    const q=String(wrap.querySelector('.ge-station-search-r12')?.value||'').trim().toLowerCase();
    const box=wrap.querySelector('.ge-station-options-r12');
    const opts=[...select.options].filter(o=>o.value&&(!q||o.textContent.toLowerCase().includes(q)));
    box.innerHTML=opts.length?opts.map(o=>`<label><input type="checkbox" value="${esc(o.value)}" ${o.selected?'checked':''}><span>${esc(o.textContent)}</span></label>`).join(''):'<div class="ge-station-empty-r12">Station tidak ditemukan.</div>';
    box.querySelectorAll('input').forEach(cb=>cb.onchange=()=>{const o=[...select.options].find(x=>x.value===cb.value);if(o)o.selected=cb.checked;updateStationTriggerR12(wrap,select);loungeCardPage=1;renderLounges()});
    updateStationTriggerR12(wrap,select);
  }

  function setupTypeFilter(){
    const card=document.querySelector('.lounge-filter-grid-ref');if(!card||document.getElementById('geP29ServiceTypeFilter'))return;
    const wrap=document.createElement('div');wrap.id='geP29ServiceTypeFilter';wrap.className='ge-p29-service-filter';wrap.innerHTML=`<span>Service Type</span><div role="group" aria-label="Service Type"><button type="button" class="active" data-ge-p29-service-filter="">All</button><button type="button" data-ge-p29-service-filter="Lounge">Lounge</button><button type="button" data-ge-p29-service-filter="Tenant">Tenant</button></div>`;
    card.parentElement?.insertBefore(wrap,card);wrap.querySelectorAll('[data-ge-p29-service-filter]').forEach(btn=>btn.addEventListener('click',()=>{wrap.querySelectorAll('[data-ge-p29-service-filter]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');loungeCardPage=1;renderLounges()}));
  }

  function setup(){
    setupFilterCombosR12();
    populateStationFilterOptions();
    setupStationMultiSelectR12();
    setupTypeFilter();
    const templateBtn=[...document.querySelectorAll('button')].find(b=>/Unduh Template/i.test(b.textContent||''));if(templateBtn){templateBtn.textContent='Download CSV Template';templateBtn.title='Download CSV Template P29';}
    ['loungeRegionFilter','loungeNameFilter','loungeStatusFilter'].forEach(id=>{const e=document.getElementById(id);if(e)e.addEventListener('change',()=>{loungeCardPage=1;renderLounges()})});
    try{if(typeof fillAirportSelects==='function')fillAirportSelects()}catch(e){}
    populateStationFilterOptions();
    setupStationMultiSelectR12();
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

  window.geChangeLoungeCardPageP87=function(delta){loungeCardPage+=Number(delta||0);renderCards();document.querySelector('.lounge-open-heading-v237')?.scrollIntoView({behavior:'smooth',block:'start'});};
  window.geLoungeViewSelectR6=function(value){window.geSetLoungeViewP87?.(value);};
  function bindCanonicalLoungeView(){const view=document.getElementById('geLoungeViewSelectR6');if(view)view.onchange=function(){window.geLoungeViewSelectR6(this.value);};}
  window.geSetLoungeViewP87=function(view){const detail=view==='detail',grid=document.getElementById('loungeCardGridV237'),table=document.querySelector('.lounge-table-fallback-v237'),pager=document.querySelector('.lounge-master-pager-v237');if(grid)grid.hidden=detail;if(table){table.hidden=!detail;table.classList.toggle('ge-p29-table-visible',detail)}if(pager)pager.hidden=detail;};
  window.addEventListener('DOMContentLoaded',()=>setTimeout(setup,0));
})();
