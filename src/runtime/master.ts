let enabled=true;

export function initMaster(initial: boolean){enabled=initial}
export function isMasterEnabled(){return enabled}
export function setMasterEnabled(value:boolean){enabled=value;if(typeof document!=='undefined')document.dispatchEvent(new Event('dol-ui-master-change'))}
