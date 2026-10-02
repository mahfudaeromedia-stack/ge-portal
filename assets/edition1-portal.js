(function(){
  'use strict';
  function cfg(){data.portalManagerR2||={pages:{},menus:{},assets:[]};return data.portalManagerR2}
  function write(){save();}
  function activity(msg){document.getElementById('pmActivity')&&(document.getElementById('pmActivity').textContent=msg);document.getElementById('portalPublishState')&&(document.getElementById('portalPublishState').textContent='Draft changed')}
  window.pmSaveDraft=function(area){const c=cfg();const key=document.getElementById('pmPage')?.value||'index.html';c.pages[key]||={};Object.assign(c.pages[key],{title:document.getElementById('pmTitle')?.value||'',description:document.getElementById('pmDescription')?.value||'',chart:document.getElementById('pmChart')?.value||'',draft:true,updatedAt:new Date().toISOString(),lastArea:area});write();activity(area+' disimpan sebagai draft di Firestore.')};
  window.pmNewPage=function(){const p=document.getElementById('pmPage');if(p)p.value='';document.getElementById('pmTitle')&&(document.getElementById('pmTitle').value='');document.getElementById('pmDescription')&&(document.getElementById('pmDescription').value='');activity('Draft page baru dibuat. Simpan setelah memilih route.')};
})();
