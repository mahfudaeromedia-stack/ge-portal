/* Compatibility shim for legacy pages that reference the historical project bundle.
 * The current project-tracking implementation remains in the existing page scripts.
 * This file intentionally has no destructive initialization or data migration.
 */
(function(){
  'use strict';
  window.GXProjectCompat = window.GXProjectCompat || {version:'2.54.4-compat',ready:true};
})();
