/* Edition 1 overlay manager.
 * All page dialogs are promoted to document.body so they own the full viewport,
 * including the fixed portal header and sidebar. No page-local stacking context
 * can trap a modal underneath the shell.
 */
(function(){
'use strict';
const selectors=[
  '.initiative-dialog', '.modal-backdrop', '.tp-modal-backdrop',
  '.map-move-modal-backdrop', '#r8InitiativeBackdrop', '#r9InitiativeBackdrop',
  '.r9-portal-dialog', '.ge-viewport-overlay', '#geV251EventModal',
  '#geV2542DraftModal', '#geCalListModalV2533', '#geV2532ListModal'
];
const matches=()=>document.querySelectorAll(selectors.join(','));
function promote(){matches().forEach(el=>{if(el.parentElement!==document.body)document.body.appendChild(el)});}
function install(){
  promote();
  new MutationObserver(promote).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
