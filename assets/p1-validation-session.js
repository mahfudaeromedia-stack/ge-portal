/* V2.57 P1 validation session bootstrap.
   Only loaded by core-* validation pages. It intentionally avoids the legacy
   login redirect while P1 foundations are being functionally validated. */
(function(){
  const KEY='GXP_SESSION_V24';
  try{
    if(!sessionStorage.getItem(KEY)){
      sessionStorage.setItem(KEY, JSON.stringify({
        id:'p1-validation-admin',
        name:'P1 Validation Admin',
        employeeNo:'P1TEST',
        username:'p1-validation',
        role:'Admin',
        unit:'Ground Experience',
        scopeType:'ALL',
        airports:[], loungeIds:[], tabs:['ALL'], status:'Active',
        validationSession:true
      }));
    }
    document.documentElement.setAttribute('data-p1-validation','true');
  }catch(e){}
})();
