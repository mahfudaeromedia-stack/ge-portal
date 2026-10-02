'use strict';
function canChangeReadState(actorId,previous,data){
  if(!previous||String(previous.recipientId||'')!==String(actorId||''))return false;
  const changed=Object.keys(data).filter(k=>JSON.stringify(data[k])!==JSON.stringify(previous[k]));
  return changed.length>0&&changed.every(k=>['status','notificationStatus'].includes(k))&&
    (!changed.includes('status')||['Read','Handled'].includes(data.status))&&
    (!changed.includes('notificationStatus')||data.notificationStatus==='Read');
}
module.exports={canChangeReadState};
