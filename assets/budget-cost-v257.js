(function(){
'use strict';
const KEY='GE_V257_BUDGET_COST_P4', SCHEMA='2.57-P4';
const now=()=>new Date().toISOString();
const uid=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const blank=()=>({schemaVersion:SCHEMA,budgets:[],costObjects:[],allocations:[],actuals:[],adjustments:[],createdAt:now(),updatedAt:now()});
function read(){let d;try{d=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){};d=d&&typeof d==='object'?d:blank();['budgets','costObjects','allocations','actuals','adjustments'].forEach(k=>d[k]=Array.isArray(d[k])?d[k]:[]);return d}
function write(d){d.schemaVersion=SCHEMA;d.updatedAt=now();localStorage.setItem(KEY,JSON.stringify(d));return d}
function save(bucket,r){const d=read(), a=d[bucket]; if(!a)throw Error('Unknown bucket'); const x={...r,id:r.id||uid(bucket.slice(0,3)),updatedAt:now()}; const i=a.findIndex(v=>String(v.id)===String(x.id)); if(i>=0)a[i]={...a[i],...x};else a.push({...x,createdAt:now()});write(d);return x}
function list(bucket,filter={}){return (read()[bucket]||[]).filter(x=>Object.entries(filter).every(([k,v])=>v===''||v==null||String(x[k])===String(v)))}
function legacy(){try{return window.GEStore?.get?.()||{}}catch(e){return {}}}
function initiative(id){return (legacy().initiatives||[]).find(x=>String(x.id)===String(id))||null}
function costObject(id){return list('costObjects').find(x=>String(x.id)===String(id))||null}
function budget(id){return list('budgets').find(x=>String(x.id)===String(id))||null}
function amount(v){return v===''||v==null?null:Number(v)}
function sum(vals){const n=vals.filter(v=>v!=null&&Number.isFinite(Number(v))).map(Number);return n.length?n.reduce((a,b)=>a+b,0):null}
function financialForCostObject(id){const co=costObject(id);if(!co)return null;const alloc=list('allocations',{costObjectId:id}), act=list('actuals',{costObjectId:id});const allocated=sum(alloc.map(x=>amount(x.amount))), actual=sum(act.map(x=>amount(x.amount)));return {costObject:co,allocated,actual,variance:allocated==null||actual==null?null:allocated-actual,allocationCount:alloc.length,actualCount:act.length}}
function financialForInitiative(id){const cos=list('costObjects',{initiativeId:String(id)});const rows=cos.map(x=>financialForCostObject(x.id));return {initiative:initiative(id),costObjects:rows,allocated:sum(rows.map(x=>x.allocated)),actual:sum(rows.map(x=>x.actual))}}
function variance(allocated,actual){return allocated==null||actual==null?null:Number(allocated)-Number(actual)}
function utilization(actual,allocated){return actual==null||allocated==null||Number(allocated)===0?null:(Number(actual)/Number(allocated))*100}
function costPerImprovementPoint(actual,improvement){return actual==null||improvement==null||Number(improvement)===0?null:Number(actual)/Number(improvement)}
function financialSummary(id,improvement){const x=financialForInitiative(id);return {...x,variance:variance(x.allocated,x.actual),utilization:utilization(x.actual,x.allocated),costPerImprovementPoint:costPerImprovementPoint(x.actual,improvement)}}
function integrity(){const d=read(), issues=[];d.costObjects.forEach(x=>{if(x.initiativeId&&!initiative(x.initiativeId))issues.push({type:'ORPHAN_INITIATIVE',id:x.id});});d.allocations.forEach(x=>{if(!costObject(x.costObjectId))issues.push({type:'ORPHAN_ALLOCATION',id:x.id});if(x.budgetId&&!budget(x.budgetId))issues.push({type:'ORPHAN_BUDGET',id:x.id});});d.actuals.forEach(x=>{if(!costObject(x.costObjectId))issues.push({type:'ORPHAN_ACTUAL',id:x.id});});return {ok:!issues.length,issues}}
function stats(){const d=read();return {budgets:d.budgets.length,costObjects:d.costObjects.length,allocations:d.allocations.length,actuals:d.actuals.length,integrity:integrity()}}
window.GEBudgetCost={schemaVersion:SCHEMA,read,list,save,budget,costObject,initiative,financialForCostObject,financialForInitiative,variance,utilization,costPerImprovementPoint,financialSummary,integrity,stats,reset:()=>localStorage.removeItem(KEY)};
})();
