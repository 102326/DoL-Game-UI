let enabled=true;

export function initMaster(root:Window){
 enabled=true;
 try{
  const raw=root.localStorage.getItem('DoLMidnightTheme.preferences.v1');
  if(raw&&raw.length<=2048){const value=JSON.parse(raw);if(typeof value?.enabled==='boolean')enabled=value.enabled}
 }catch{/* Use the theme default when storage is unavailable. */}
}
export function isMasterEnabled(){return enabled}
export function setMasterEnabled(value:boolean){enabled=value}
