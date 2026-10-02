'use strict';
const { bad, ok, bearer, firebase } = require('./_firebase');
const { getStorage } = require('firebase-admin/storage');
const MAX_BYTES=5*1024*1024;
async function actor(event){
  const token=bearer(event);if(!token)throw Object.assign(new Error('Authentication required.'),{statusCode:401,code:'AUTH_REQUIRED'});
  const {auth,db}=firebase();let decoded;try{decoded=await auth.verifyIdToken(token,true)}catch{throw Object.assign(new Error('Invalid or expired authentication token.'),{statusCode:401,code:'AUTH_INVALID'})}
  const snap=await db.collection('users').doc(decoded.uid).get();if(!snap.exists)throw Object.assign(new Error('User profile not found.'),{statusCode:403,code:'PROFILE_NOT_FOUND'});
  const profile=snap.data()||{};if(String(profile.status||'Active').toLowerCase()==='inactive')throw Object.assign(new Error('Account inactive.'),{statusCode:403,code:'ACCOUNT_INACTIVE'});
  return {uid:decoded.uid,role:profile.role||'',accessLevel:profile.accessLevel||'Viewer',db};
}
function clean(v,n=240){const s=String(v||'').trim();if(!s||s.length>n)throw Object.assign(new Error('Invalid file reference.'),{statusCode:400,code:'INVALID_FILE'});return s}
exports.handler=async(event)=>{
 try{
  const a=await actor(event);const qs=event.queryStringParameters||{};
  const key=clean(qs.key||'');
  const bucket=getStorage().bucket();
  if(event.httpMethod==='GET'){
    const [buf]=await bucket.file(key).download();
    const [meta]=await bucket.file(key).getMetadata();
    const original=String(meta.metadata?.originalName||key).replace(/\"/g,'');
    return {statusCode:200,headers:{'Content-Type':meta.contentType||'application/octet-stream','Content-Disposition':`attachment; filename=\"${original}\"`},body:buf.toString('base64'),isBase64Encoded:true};
  }
  if(!['Super Admin','Admin'].includes(a.role)&&String(a.accessLevel)!=='Editor')throw Object.assign(new Error('Editor/Admin access required.'),{statusCode:403,code:'FORBIDDEN'});
  if(event.httpMethod==='DELETE'){await bucket.file(key).delete({ignoreNotFound:true});return ok({ok:true,deleted:true,key});}
  if(event.httpMethod==='POST'){
    let body;try{body=JSON.parse(event.body||'{}')}catch{return bad(400,'INVALID_JSON','Invalid JSON.')}
    const b64=String(body.base64||'');if(!b64) return bad(400,'FILE_REQUIRED','File content is required.');
    const buf=Buffer.from(b64,'base64');if(buf.length>MAX_BYTES)return bad(413,'FILE_TOO_LARGE','Maximum file size is 5 MB.');
    const name=clean(body.originalName||key,180);const type=String(body.contentType||'application/octet-stream').slice(0,120);
    const file=bucket.file(key);await file.save(buf,{metadata:{contentType:type,metadata:{originalName:name,uploadedBy:a.uid}}});
    return ok({ok:true,key,name,size:buf.length,contentType:type});
  }
  return bad(405,'METHOD_NOT_ALLOWED','Method not allowed.');
 }catch(e){return bad(e.statusCode||500,e.code||'EDITION1_FILE_ERROR',e.message||'File request failed.');}
};
