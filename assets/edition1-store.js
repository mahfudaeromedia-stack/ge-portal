/* Edition 1 Firebase Store — Firestore is the only business-data source of truth.
 * This object is an in-memory working set only; it is never seeded from local data
 * and is never persisted to localStorage. All reads/writes go through /api/edition1-data.
 */
(function(){
  'use strict';
  const state={
    airports:[],initiatives:[],news:[],touchpoints:[],documents:[],events:[],
    flightSchedule:[],loungePurchases:[],loungeVisitors:[],stationMaterials:[],boSpaces:[],serviceProcurement:[],
    airportSystems:[],skyPriority:[],touchpointStandards:[],gasoMaster:[],gasoServiceSupport:[],gasoPlanningService:[],
    personnel:[],articles:[],announcements:[],faqs:[],inbox:[],auditLogs:[],users:[],lounges:[],
    airlines:[],groundHandlers:[],serviceAlignments:[],airportCosts:[],aircraftConfigs:[],currencies:[],exchangeRates:[],assets:[],facilities:[],
    standardContent:{},portalManagerR2:{},attentionSettings:{},contactMessages:[],guestbook:[],monitoringTemplates:[],monitoringAssessments:[],formTemplates:[],monitoringWorks:[],formSubmissions:[],customerExperience:[],referenceCatalog:[],requirementMatrix:[],stationCapabilities:[]
  };
  const baseline={}; let hydrated=false; let pending=Promise.resolve(); let localRevision=0;
  const CACHE_DB='GE_E1_CACHE_V30'; const CACHE_STORE='collections';
  function session(){return typeof window.gxGetSession==='function'?(window.gxGetSession()||{}):window.GX_CURRENT_USER||{}}
  function cacheAllowed(){return !!String(session().uid||session().id||session().email||'').trim()}
  function cacheIdentity(){const s=session();return String(s.uid||s.id||s.email||'anon')+'|'+String(s.scopeType||'')+'|'+(Array.isArray(s.airports)?s.airports.join(','):'')}
  function cacheKey(k){return cacheIdentity()+':'+collKey(k)}
  function openCache(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return reject(new Error('IndexedDB unavailable'));const q=indexedDB.open(CACHE_DB,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(CACHE_STORE))q.result.createObjectStore(CACHE_STORE)};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}
  async function cacheGet(key){try{const db=await openCache();return await new Promise((resolve,reject)=>{const tx=db.transaction(CACHE_STORE,'readonly'),q=tx.objectStore(CACHE_STORE).get(key);q.onsuccess=()=>resolve(q.result??null);q.onerror=()=>reject(q.error)})}catch{return null}}
  async function cachePut(key,value){if(!cacheAllowed())return;try{const db=await openCache();await new Promise((resolve,reject)=>{const tx=db.transaction(CACHE_STORE,'readwrite');tx.objectStore(CACHE_STORE).put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}catch{}}
  async function readCache(k){const x=await cacheGet(cacheKey(k));return Array.isArray(x?.rows)?x.rows:null}
  async function writeCache(k,rows){return cachePut(cacheKey(k),{rows,at:Date.now()})}
  async function readManifestCache(){return cacheGet(cacheIdentity()+':__manifest__')}
  async function writeManifestCache(x){return cachePut(cacheIdentity()+':__manifest__',{...x,checkedAt:Date.now()})}
  async function clearManifestCache(){try{const db=await openCache();await new Promise((resolve,reject)=>{const tx=db.transaction(CACHE_STORE,'readwrite');tx.objectStore(CACHE_STORE).delete(cacheIdentity()+':__manifest__');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}catch{}}
  function fetchWithTimeout(url,options={},timeoutMs=20000){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);return fetch(url,{...options,signal:controller.signal}).finally(()=>clearTimeout(timer)).catch(e=>{if(e?.name==='AbortError')throw new Error('Permintaan data timeout setelah 20 detik.');throw e})}
  const MAP={events:'projectEvents',projectEvents:'projectEvents'};
  const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
  function collKey(k){if(k==='portalManagerR2')return 'portalManager';return MAP[k]||k}
  function normalizeCollection(key,rows){
    if(key==='attentionSettings') return Array.isArray(rows)?(rows[0]||{}):{};
    if(key==='standardContent') return Array.isArray(rows)?(rows[0]||{}):{};
    if(key==='portalManagerR2') return Array.isArray(rows)?(rows[0]||{}):{};
    const out=Array.isArray(rows)?rows.map(x=>{const y={...x};if(typeof y.id==='string'&&/^\d+$/.test(y.id))y.id=Number(y.id);return y}):[];
    if(key==='events'||key==='projectEvents') return out;
    if(key==='touchpoints') return out.map(x=>typeof x==='string'?{id:'legacy:'+x,name:x,status:'Active'}:x);
    if(key==='documents') return out.map(x=>({...x,blobKey:x.blobKey||x.storagePath||x.documentKey||'',fileName:x.fileName||x.name||''}));
    return out;
  }
  async function token(forceRefresh=false){
    const u=await window.GXFirebase?.currentUser?.();
    if(!u) throw new Error('Authentication required.');
    return u.getIdToken(!!forceRefresh);
  }
  async function apiGet(keys){
    const list=[...new Set(keys.map(collKey))];
    const t=await token();
    const r=await fetchWithTimeout('/api/edition1-data?collections='+encodeURIComponent(list.join(',')),{headers:{Authorization:'Bearer '+t},cache:'no-store'});
    const p=await r.json().catch(()=>({}));
    if(r.ok)return p.collections||{};
    const msg=String(p.message||'');
    if(!/Firebase Admin credentials are not configured/i.test(msg))throw new Error(msg||`Data request failed (${r.status}).`);
    // Netlify server-side Admin credentials are not available in some deployed environments.
    // Keep Firestore as the same source of truth by reading the canonical portalData tree
    // with the already-authenticated Firebase Web SDK and Firestore Security Rules.
    const fb=window.GXFirebase?.state;
    if(!fb?.db)throw new Error(msg);
    const out={};
    for(const key of list){
      if(key==='standardContent'||key==='portalManager'||key==='attentionSettings'){
        const snap=await fb.db.collection('portalMetadata').doc(key).collection('records').doc('global').get();
        out[key]=snap.exists?[{id:'global',...snap.data()}]:[];
      }else if(key==='users'){
        const snap=await fb.db.collection('users').get();
        out[key]=snap.docs.map(d=>({id:d.id,...d.data()}));
      }else{
        const snap=await fb.db.collection('portalData').doc(key).collection('records').get();
        out[key]=snap.docs.map(d=>({id:d.id,...d.data()}));
      }
    }
    return out;
  }

  async function apiManifest(){
    const t=await token();
    const r=await fetchWithTimeout('/api/edition1-data?manifest=1',{headers:{Authorization:'Bearer '+t},cache:'no-store'},8000);
    const p=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(p.message||`Manifest request failed (${r.status}).`);
    return p.manifest||{version:0};
  }

  async function apiPost(body){
    let t=await token(false);
    let r=await fetchWithTimeout('/api/edition1-data',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(r.status===401){
      t=await token(true);
      r=await fetchWithTimeout('/api/edition1-data',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify(body)});
    }
    const p=await r.json().catch(()=>({})); if(!r.ok)throw new Error(p.message||`Save request failed (${r.status}).`); return p.result;
  }
  async function apiPostBatch(collection,changes){
    if(!changes.length)return [];
    const results=[];
    // Keep each request bounded while avoiding one HTTP round-trip per imported row.
    for(let i=0;i<changes.length;i+=75){
      const part=changes.slice(i,i+75);
      const r=await apiPost({collection,action:'BATCH',changes:part});
      results.push(...(Array.isArray(r)?r:[]));
    }
    return results;
  }
  function indexById(rows){const m=new Map();(rows||[]).forEach(x=>m.set(String(x.id),x));return m}
  function same(a,b){return JSON.stringify(a)===JSON.stringify(b)}
  async function persistSnapshot(snapshot){
    const keys=Object.keys(snapshot);
    for(const key of keys){
      const collection=collKey(key);
      if(key==='standardContent'||key==='portalManagerR2'||key==='attentionSettings'){
        const prev=baseline[key]||{}; const next=snapshot[key]||{};
        if(!same(prev,next)) await apiPost({collection,action:'UPDATE',id:'global',data:next});
        baseline[key]=clone(next); continue;
      }
      const prev=baseline[key]||[]; const next=snapshot[key]||[];
      const pm=indexById(prev), nm=indexById(next), changes=[];
      for(const [id,row] of nm){
        if(!pm.has(id)) changes.push({action:'CREATE',id,data:row});
        else if(!same(pm.get(id),row)) changes.push({action:'UPDATE',id,data:row});
      }
      for(const id of pm.keys()) if(!nm.has(id)) changes.push({action:'DELETE',id,data:{}});
      if(changes.length===1) await apiPost({collection,...changes[0]});
      else if(changes.length>1) await apiPostBatch(collection,changes);
      baseline[key]=clone(next);
      if(cacheAllowed()) await writeCache(key,Array.isArray(next)?next:[next]);
    }
    if(cacheAllowed()) await clearManifestCache()
  }
  function save(next){
    localRevision++;
    const snapshot={};
    // Only persist collections that this page actually hydrated. The runtime shares
    // one in-memory state object, so sending untouched empty arrays could otherwise
    // be interpreted as DELETE for collections that were never loaded on this page.
    for(const k of Object.keys(next||{})){
      if(!Object.prototype.hasOwnProperty.call(baseline,k)) continue;
      if(Array.isArray(next[k])||k==='standardContent'||k==='portalManagerR2'||k==='attentionSettings')snapshot[k]=clone(next[k]);
    }
    const previous=pending.catch(()=>undefined); pending=previous.then(()=>persistSnapshot(snapshot)).catch(err=>{console.error('[Edition1 Firebase Store]',err);window.dispatchEvent(new CustomEvent('gx-data-save-error',{detail:err}));throw err});
    return next;
  }
  async function hydrate(keys){
    const requested=[...new Set(keys)];
    // Non-Super Admin pages use a persistent per-user/per-scope cache. This makes page-to-page
    // navigation instant and avoids re-reading entire Firestore collections on every page load.
    if(cacheAllowed()&&!requested.includes('customerExperience')){
      let allCached=true;
      for(const key of requested){
        const cached=await readCache(key); if(!cached){allCached=false;continue}
        const rows=normalizeCollection(key,cached);
        if(key==='projectEvents'){state.events=rows;baseline.events=clone(rows);}else{state[key]=rows;baseline[key]=clone(rows)}
      }
      if(allCached){
        hydrated=true;
        // R29 stale-while-revalidate: cached data is returned immediately. Firestore/network
        // validation is never on the critical path for page rendering on a previously loaded device.
        // The tiny manifest check runs behind the page and refreshes IndexedDB only when data changed.
        const refreshRevision=localRevision;
        Promise.resolve().then(async()=>{
          try{
            const local=await readManifestCache(); const remote=await apiManifest();
            if(local && Number(local.version||0)===Number(remote.version||0)){await writeManifestCache(remote);return}
            const result=await apiGet(requested);
            if(localRevision!==refreshRevision)return;
            for(const key of requested){const apiKey=collKey(key),rows=normalizeCollection(key,result[apiKey]||[]);if(key==='projectEvents'){state.events=rows;baseline.events=clone(rows)}else{state[key]=rows;baseline[key]=clone(rows)};await writeCache(key,result[apiKey]||[])}
            await writeManifestCache(remote);
            window.dispatchEvent(new CustomEvent('gx-data-background-refresh',{detail:{collections:requested}}));
          }catch(e){console.warn('[Edition1 cache] background refresh unavailable; cached data remains active',e)}
        });
        return state;
      }
    }
    const result=await apiGet(requested);
    for(const key of requested){
      const apiKey=collKey(key); const rows=normalizeCollection(key,result[apiKey]||[]);
      if(key==='projectEvents'){state.events=rows;baseline.events=clone(rows);} else {state[key]=rows;baseline[key]=clone(rows);}
      await writeCache(key,result[apiKey]||[]);
    }
    if(cacheAllowed())try{await writeManifestCache(await apiManifest())}catch{}
    hydrated=true;
    return state;
  }
  async function waitAuth(){
    if(window.GX_AUTH_READY) await window.GX_AUTH_READY;
    if(!window.GXFirebase) throw new Error('Firebase runtime unavailable.');
    const u=await window.GXFirebase.currentUser();
    if(!u) throw new Error('Authentication required.');
    const s=typeof window.gxGetSession==='function'?(window.gxGetSession()||{}):window.GX_CURRENT_USER||{};
    if(!s.uid || String(s.uid)!==String(u.uid)) throw new Error('Authoritative user profile/session belum siap.');
    return s;
  }
  async function markInboxRead(id,kind='inbox'){
    const field=kind==='notification'?'notificationStatus':'status',item=state.inbox.find(x=>String(x.id)===String(id));
    if(!item)throw new Error('Pesan tidak tersedia pada akun ini.');
    const s=session();if(String(item.recipientId||'')!==String(s.uid||s.id||''))throw new Error('Status baca hanya dapat diubah oleh penerima.');
    if(item[field]==='Read'||(field==='notificationStatus'&&!item.notificationStatus&&item.status==='Read'))return item;
    await apiPost({collection:'inbox',action:'UPDATE',id:item.id,data:{[field]:'Read'}});
    item[field]='Read';const baselineItem=arr=>arr.find(x=>String(x.id)===String(id));const old=baselineItem(baseline.inbox||[]);if(old)old[field]='Read';
    await writeCache('inbox',state.inbox);await clearManifestCache();return item;
  }
  async function loadInboxThread(id){const t=await token(),r=await fetchWithTimeout('/api/edition1-data?thread='+encodeURIComponent(id),{headers:{Authorization:'Bearer '+t},cache:'no-store'}),p=await r.json();if(!r.ok)throw Error(p.message||'Conversation could not be loaded.');return p.thread||[]}
  async function replyInbox(id,body){const result=await apiPost({collection:'inbox',action:'CREATE',id:globalThis.crypto?.randomUUID?.()||String(Date.now()),data:{replyToId:String(id),body:String(body||'').trim()}});await clearManifestCache();return result}
  window.data=state; window.GEStore={get:()=>state,save,hydrate,waitAuth,markInboxRead,loadInboxThread,replyInbox,isHydrated:()=>hydrated,flush:()=>pending,source:'Firestore',projectId:window.GX_FIREBASE_CONFIG?.projectId||''};
  window.addEventListener('gx-data-save-error',e=>{if(e.detail?.message)console.error('Firestore save failed:',e.detail.message)});
})();
