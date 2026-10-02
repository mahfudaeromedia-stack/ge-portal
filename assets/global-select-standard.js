/* GLOBAL SELECT STANDARD — canonical searchable select / multi-select
 * One reusable UI component for predefined-value selects across the portal.
 * The native <select> remains the data source of truth; this layer only owns presentation/input.
 */
(function(){
'use strict';
const GLOBAL='geGlobalSelectV1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const optionData=select=>[...select.options].map((o,index)=>({value:String(o.value??''),label:o.textContent.trim(),disabled:o.disabled,index,selected:o.selected}));
const isExcluded=select=>{
 if(!select||select.tagName!=='SELECT')return true;
 if(select.dataset[GLOBAL])return true;
 if(select.closest('.ge-station-multi-r12'))return true; /* already a canonical station picker */
 if(select.closest('[data-ge-native-select-exempt]'))return true;
 if(select.classList.contains('ge-combo-source-r12')||select.classList.contains('search-filter-native-v245'))return false;
 return false;
};
function selectedValues(select){return [...select.options].filter(o=>o.selected).map(o=>String(o.value));}
function isAllOption(o){const v=String(o.value||'').trim(),l=String(o.textContent||'').trim();return /^all(?:\b|[-_])/i.test(v)||/^all(?:\b|[-_])/i.test(l)||/^semua(?:\b|[-_])/i.test(l);}
function syncSelect(select,values){
 const set=new Set(values.map(String));
 [...select.options].forEach(o=>{o.selected=set.has(String(o.value))});
}
function labelForValues(select,values){
 const map=new Map([...select.options].map(o=>[String(o.value),o.textContent.trim()]));
 return values.map(v=>map.get(String(v))).filter(Boolean);
}
function updateSingle(wrap){
 const s=wrap._select, input=wrap._input;
 const o=s.selectedOptions?.[0];
 input.value=o?.textContent.trim()||'';
 input.placeholder=s.dataset.placeholder||'Search or select';
 wrap.classList.toggle('has-value',!!o?.value);
 let clear=wrap.querySelector('.ge-select-clear');
 if(o?.value&&!clear){clear=document.createElement('button');clear.type='button';clear.className='ge-select-clear';clear.setAttribute('aria-label','Clear selection');clear.textContent='×';clear.onclick=e=>{e.preventDefault();e.stopPropagation();s.value='';s.dispatchEvent(new Event('change',{bubbles:true}));input.value='';open(wrap)};wrap._display.appendChild(clear)}
 if(!o?.value&&clear)clear.remove();
}
function updateMulti(wrap){
 const s=wrap._select, values=selectedValues(s), labels=labelForValues(s,values), box=wrap._display;
 box.querySelectorAll('.ge-select-chip').forEach(x=>x.remove());
 const input=wrap._input;
 const max=3;
 labels.slice(0,max).forEach((label,i)=>{
   const chip=document.createElement('span');chip.className='ge-select-chip';chip.textContent=label;
   const remove=document.createElement('button');remove.type='button';remove.className='ge-select-chip-remove';remove.setAttribute('aria-label','Remove '+label);remove.textContent='×';
   remove.onclick=e=>{e.stopPropagation();setMultiValue(s,values.filter(v=>v!==String(values[i])));renderMenu(wrap,input.value)};
   chip.appendChild(remove);box.insertBefore(chip,input);
 });
 if(labels.length>max){const more=document.createElement('span');more.className='ge-select-overflow';more.textContent=`+${labels.length-max}`;box.insertBefore(more,input)}
 input.placeholder=labels.length?'Search...':(s.dataset.placeholder||'Search or select');
 wrap.classList.toggle('has-value',labels.length>0);
}
function setMultiValue(select,values){
 const opts=[...select.options];
 const all=opts.find(isAllOption);
 const real=opts.filter(o=>!isAllOption(o)&&!o.disabled);
 const allSelected=real.length>0&&real.every(o=>values.includes(String(o.value)));
 let next=values.filter(v=>real.some(o=>String(o.value)===String(v)));
 if(allSelected&&all)next=real.map(o=>String(o.value));
 syncSelect(select,next);
 if(all){all.selected=allSelected;all.indeterminate=!allSelected&&next.length>0;}
 select.dispatchEvent(new Event('change',{bubbles:true}));
}
function renderMenu(wrap,query=''){
 const s=wrap._select,menu=wrap._menu,q=String(query||'').trim().toLowerCase();
 const opts=optionData(s).filter(o=>!o.disabled && (!q||o.label.toLowerCase().includes(q)));
 if(!opts.length){menu.innerHTML='<div class="ge-select-empty">No matching data found.</div>';return}
 if(s.multiple){
   const selected=new Set(selectedValues(s));
   menu.innerHTML=opts.map(o=>{
     const checked=selected.has(o.value)||isAllOption(o)&&selected.size===s.options.length-1;
     const all=isAllOption(o);
     return `<button type="button" class="ge-select-option ${checked?'is-selected':''}" data-value="${esc(o.value)}" role="option" aria-selected="${checked}"><span class="ge-select-check ${checked?'checked':''}${all&&selected.size>0&&selected.size<s.options.length-1?' indeterminate':''}">${checked?'✓':''}</span><span>${esc(o.label)}</span></button>`;
   }).join('');
 }else{
   const current=String(s.value||'');
   menu.innerHTML=opts.map(o=>`<button type="button" class="ge-select-option ${o.value===current?'is-selected':''}" data-value="${esc(o.value)}" role="option" aria-selected="${o.value===current}">${esc(o.label)}</button>`).join('');
 }
}
function open(wrap){
 document.querySelectorAll('.ge-global-select.open').forEach(x=>{if(x!==wrap)x.classList.remove('open')});
 wrap.classList.add('open');
 wrap._input.focus();
 wrap._input.select();
 renderMenu(wrap,'');
}
function close(wrap){wrap.classList.remove('open');wrap._input.value='';wrap._input.setAttribute('aria-expanded','false');if(wrap._select.multiple)updateMulti(wrap);else updateSingle(wrap)}
function choose(wrap,value){
 const s=wrap._select;
 if(s.multiple){
   const opts=[...s.options], all=opts.find(isAllOption), real=opts.filter(o=>!isAllOption(o)&&!o.disabled);
   if(all&&String(all.value)===String(value)){
     const currentlyAll=real.length>0&&real.every(o=>o.selected);
     syncSelect(s,currentlyAll?[]:real.map(o=>String(o.value)));
     all.selected=!currentlyAll;
     all.indeterminate=false;
   }else{
     const values=new Set(selectedValues(s));
     values.has(String(value))?values.delete(String(value)):values.add(String(value));
     const next=[...values].filter(v=>real.some(o=>String(o.value)===v));
     syncSelect(s,next);
     if(all){const allNow=real.length>0&&real.every(o=>o.selected);all.selected=allNow;all.indeterminate=!allNow&&next.length>0;}
   }
   s.dispatchEvent(new Event('change',{bubbles:true}));
   updateMulti(wrap);renderMenu(wrap,wrap._input.value);
 }else{
   s.value=value;s.dispatchEvent(new Event('change',{bubbles:true}));updateSingle(wrap);close(wrap);
 }
}
function enhance(select){
 if(isExcluded(select))return;
 select.dataset[GLOBAL]='1';
 const wrap=document.createElement('div');wrap.className='ge-global-select'+(select.multiple?' is-multi':' is-single');
 const display=document.createElement('div');display.className='ge-select-display';
 const input=document.createElement('input');input.type='text';input.className='ge-select-input';input.autocomplete='off';input.setAttribute('role','combobox');input.setAttribute('aria-expanded','false');input.setAttribute('aria-autocomplete','list');
 const arrow=document.createElement('span');arrow.className='ge-select-arrow';arrow.textContent='⌄';
 const menu=document.createElement('div');menu.className='ge-select-menu';menu.setAttribute('role','listbox');
 display.appendChild(input);wrap.append(display,arrow,menu);
 select.parentNode.insertBefore(wrap,select);wrap.appendChild(select);
 select.classList.add('ge-global-select-source');
 wrap._select=select;wrap._input=input;wrap._menu=menu;wrap._display=display;
 input.addEventListener('focus',()=>{open(wrap);input.setAttribute('aria-expanded','true')});
 input.addEventListener('click',()=>{if(!wrap.classList.contains('open'))open(wrap);input.setAttribute('aria-expanded','true')});
 input.addEventListener('input',()=>{wrap.classList.add('open');renderMenu(wrap,input.value)});
 input.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();close(wrap);return}
   if(e.key==='ArrowDown'){e.preventDefault();if(!wrap.classList.contains('open'))open(wrap);wrap._menu.querySelector('.ge-select-option')?.focus();return}
   if(e.key==='Enter'&&!wrap.classList.contains('open')){e.preventDefault();open(wrap)}
 });
 arrow.addEventListener('click',e=>{e.preventDefault();wrap.classList.contains('open')?close(wrap):open(wrap)});
 menu.addEventListener('click',e=>{const b=e.target.closest('.ge-select-option');if(b)choose(wrap,b.dataset.value)});
 menu.addEventListener('keydown',e=>{const b=e.target.closest('.ge-select-option');if(!b)return;const items=[...menu.querySelectorAll('.ge-select-option')],i=items.indexOf(b);if(e.key==='ArrowDown'){e.preventDefault();items[i+1]?.focus()}else if(e.key==='ArrowUp'){e.preventDefault();(items[i-1]||input).focus()}else if(e.key==='Home'){e.preventDefault();items[0]?.focus()}else if(e.key==='End'){e.preventDefault();items.at(-1)?.focus()}else if(e.key==='Escape'){e.preventDefault();close(wrap);input.focus()}});
 select.addEventListener('change',()=>{if(select.multiple)updateMulti(wrap);else updateSingle(wrap);if(wrap.classList.contains('open'))renderMenu(wrap,wrap._input.value)});
 const observer=new MutationObserver(()=>{if(select.multiple)updateMulti(wrap);else updateSingle(wrap);if(wrap.classList.contains('open'))renderMenu(wrap,wrap._input.value)});
 observer.observe(select,{childList:true,subtree:true,attributes:true});
 wrap._observer=observer;
 if(select.multiple)updateMulti(wrap);else updateSingle(wrap);
}
function enhanceAll(root=document){root.querySelectorAll?.('select').forEach(enhance)}
window.GEGlobalSelect={enhance,enhanceAll,closeAll:()=>document.querySelectorAll('.ge-global-select.open').forEach(close)};
window.addEventListener('DOMContentLoaded',()=>{
 enhanceAll();
 const observer=new MutationObserver(m=>m.forEach(x=>x.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.matches?.('select'))enhance(n);enhanceAll(n)}})));
 observer.observe(document.body,{childList:true,subtree:true});
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.ge-global-select'))window.GEGlobalSelect.closeAll()},true);
});
})();
