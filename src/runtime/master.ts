// Independent page entry points start enabled until a theme snapshot is bound.
let requested = {enabled:true};
export function initMaster(preferences: {enabled:boolean}) { requested=preferences }
export function isMasterEnabled() { return requested.enabled }
export function setMasterEnabled(value:boolean) {
 requested.enabled=value;
 if(typeof document!=='undefined')document.dispatchEvent(new Event('dol-ui-master-change'));
}
