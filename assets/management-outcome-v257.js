(function(){
'use strict';
const KEY='GE_V257_MANAGEMENT_OUTCOME_P5',SCHEMA='2.57-P5';
const now=()=>new Date().toISOString(),uid=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const blank=()=>({schemaVersion:SCHEMA,reviews:[],outcomes:[],conditionProposals:[],transformationItems:[],createdAt:now(),updatedAt:now()});
function read(){let d;try{d=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}d=d&&typeof d==='object'?d:blank();['reviews','outcomes','conditionProposals','transformationItems'].forEach(k=>d[k]=Array.isArray(d[k])?d[k]:[]);return d}
function write(d){d.schemaVersion=SCHEMA;d.updatedAt=now();localStorage.setItem(KEY,JSON.stringify(d));return d}
function save(bucket,r){const d=read(),a=d[bucket];if(!a)throw Error('Unknown bucket');const x={...r,id:r.id||uid(bucket.slice(0,3)),updatedAt:now()};const i=a.findIndex(v=>String(v.id)===String(x.id));if(i>=0)a[i]={...a[i],...x};else a.push({...x,createdAt:now()});write(d);return x}
function list(bucket,f={}){return (read()[bucket]||[]).filter(x=>Object.entries(f).every(([k,v])=>v===''||v==null||String(x[k])===String(v)))}
function legacy(){try{return window.GEStore?.get?.()||{}}catch(e){return {}}}
function initiative(id){return (legacy().initiatives||[]).find(x=>String(x.id)===String(id))||null}
function outcomeForInitiative(id){return list('outcomes',{initiativeId:String(id)})}
function reviewForInitiative(id){return list('reviews',{initiativeId:String(id)})}
function proposalForOutcome(id){return list('conditionProposals',{outcomeId:String(id)})}
function transformationForInitiative(id){return list('transformationItems',{initiativeId:String(id)})}
function initiativeView(id){return {initiative:initiative(id),reviews:reviewForInitiative(id),outcomes:outcomeForInitiative(id),transformation:transformationForInitiative(id)}}
function verifyProposal(id,decision,note){const d=read(),p=d.conditionProposals.find(x=>String(x.id)===String(id));if(!p)throw Error('Proposal not found');p.status=decision==='Verified'?'Verified':'Rejected';p.verificationNote=note||'';p.verifiedAt=now();write(d);return p}
function integrity(){const d=read(),issues=[];d.reviews.forEach(x=>{if(x.initiativeId&&!initiative(x.initiativeId))issues.push({type:'ORPHAN_REVIEW',id:x.id})});d.outcomes.forEach(x=>{if(x.initiativeId&&!initiative(x.initiativeId))issues.push({type:'ORPHAN_OUTCOME',id:x.id})});d.conditionProposals.forEach(x=>{if(!d.outcomes.some(o=>String(o.id)===String(x.outcomeId)))issues.push({type:'ORPHAN_CONDITION_PROPOSAL',id:x.id})});d.transformationItems.forEach(x=>{if(x.initiativeId&&!initiative(x.initiativeId))issues.push({type:'ORPHAN_TRANSFORMATION',id:x.id})});return {ok:!issues.length,issues}}
function outcomeMetrics(x={}){const n=v=>Number.isFinite(Number(v))?Number(v):null;const baseline=n(x.baseline),target=n(x.target),actual=n(x.actualOutcome),planned=n(x.plannedImprovement);const improvement=baseline!=null&&actual!=null?actual-baseline:null;const targetAttainment=target!=null&&target!==0&&actual!=null?(actual/target)*100:null;const outcomeAchievement=planned!=null&&planned!==0&&improvement!=null?(improvement/planned)*100:null;return {outcomeImprovement:improvement,targetAttainment,outcomeAchievement}}
function evaluateOutcome(x={}){const m=outcomeMetrics(x);if(m.outcomeImprovement==null||m.targetAttainment==null)return {outcomeStatus:'Awaiting Measurement',...m};if(m.targetAttainment>=100)return {outcomeStatus:'Effective',...m};if(m.targetAttainment>=80)return {outcomeStatus:'Partially Effective',...m};return {outcomeStatus:'Ineffective',...m}}
function outcomeStatus(x={}){return evaluateOutcome(x).outcomeStatus}
function stats(){const d=read();return {reviews:d.reviews.length,outcomes:d.outcomes.length,proposals:d.conditionProposals.length,transformation:d.transformationItems.length,pendingVerification:d.conditionProposals.filter(x=>x.status==='Pending Verification').length,integrity:integrity()}}
window.GEManagementOutcome={schemaVersion:SCHEMA,read,list,save,initiative,outcomeForInitiative,reviewForInitiative,proposalForOutcome,transformationForInitiative,initiativeView,verifyProposal,integrity,outcomeMetrics,evaluateOutcome,outcomeStatus,stats,reset:()=>localStorage.removeItem(KEY)};
})();
