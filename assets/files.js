
window.GEFiles=(()=>{
 const DB='GE_PORTAL_FILES_V28', STORE='files';
 function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
 async function put(key,file){const d=await db();return new Promise((res,rej)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put(file,key);tx.oncomplete=()=>res(key);tx.onerror=()=>rej(tx.error)})}
 async function get(key){const d=await db();return new Promise((res,rej)=>{const r=d.transaction(STORE).objectStore(STORE).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
 async function del(key){const d=await db();return new Promise((res,rej)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error)})}
 async function download(key,name){const f=await get(key);if(!f){alert('File belum tersimpan pada browser ini.');return}const u=URL.createObjectURL(f);const a=document.createElement('a');a.href=u;a.download=name||f.name||'document';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
 return{put,get,del,download};
})();