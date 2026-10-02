(function(){
  'use strict';
  async function token(){const u=await window.GXFirebase?.currentUser?.();if(!u)throw new Error('Authentication required.');return u.getIdToken()}
  async function put(key,file){const t=await token();const b=await file.arrayBuffer();const bytes=new Uint8Array(b);let binary='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));const r=await fetch('/api/edition1-file?key='+encodeURIComponent(key),{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify({base64:btoa(binary),originalName:file.name,contentType:file.type||'application/octet-stream'})});const p=await r.json().catch(()=>({}));if(!r.ok)throw new Error(p.message||'File upload failed.');return p}
  async function get(key){const t=await token();const r=await fetch('/api/edition1-file?key='+encodeURIComponent(key),{headers:{Authorization:'Bearer '+t},cache:'no-store'});if(!r.ok)return null;return await r.blob()}
  async function del(key){const t=await token();const r=await fetch('/api/edition1-file?key='+encodeURIComponent(key),{method:'DELETE',headers:{Authorization:'Bearer '+t}});return r.ok}
  async function download(key,name){const f=await get(key);if(!f){alert('File tidak ditemukan pada Firebase Storage.');return}const u=URL.createObjectURL(f),a=document.createElement('a');a.href=u;a.download=name||'document';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
  window.GEFiles={put,get,del,download,source:'Firebase Storage'};
})();
