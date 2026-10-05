import {isolate} from './runtime/presentation';
import {createUiRuntime} from './runtime/ui';
import {startSaves} from './saves/main';
import {startShop} from './shop/main';
import {startPanels,type PanelKind} from './panels/main';
import {startSocial} from './social/main';
import {startCharacteristics} from './characteristics/main';
import {startStatusPreview} from './runtime/preview';
import {startWardrobe} from './wardrobe/main';
import {startCombat} from './combat/main';
import {startLayout} from './theme/layout.js';
import {startTheme} from './theme/controller';
import {initMaster,isMasterEnabled,setMasterEnabled} from './runtime/master';
import './theme/midnight.css';
import './theme/controls.css';
import './theme/layout.css';
import './tokens.css';
import './theme/visual.css';
import './theme/eyes.css';
import './theme/sidebar.css';
import './runtime/roles.css';
import './runtime/surfaces.css';
const runtime=window as typeof window & Record<string,any>;
if(!runtime.DoLGameUI){
 initMaster(runtime);
 const start=(name:string,factory:()=>unknown)=>{const api=isolate(name,factory,()=>{try{runtime[name]?.destroy?.()}finally{delete runtime[name]}});if(api)runtime[name]=api};
 for(const name of ['DoLCombatUI','DoLMidnightTheme','DMTLayout'])isolate(name,()=>runtime[name]?.destroy?.());
 start('DoLStatusPreview',()=>startStatusPreview(runtime));
 start('DoLWardrobeUI',()=>startWardrobe(runtime));
 start('DoLCharacteristicsUI',()=>startCharacteristics(runtime));
 start('DoLSocialUI',()=>startSocial(runtime));
 start('DoLPanelsUI',()=>startPanels(runtime));
 start('DoLShopUI',()=>startShop(runtime));
 start('DoLSavesUI',()=>startSaves(runtime));
 start('DoLCombatUI',()=>startCombat());start('DMTLayout',()=>startLayout());start('DoLMidnightTheme',()=>startTheme());
 let uiRuntime:ReturnType<typeof createUiRuntime>|undefined;
 runtime.DoLGameUI={version:'2.1.0',openSettings:()=>runtime.DoLMidnightTheme?.openSettings(),
  getPreferences:()=>({...runtime.DoLMidnightTheme?.getPreferences(),enabled:isMasterEnabled(),savesEnabled:runtime.DoLSavesUI?.getEnabled(),shopEnabled:runtime.DoLShopUI?.getEnabled(),combatEnabled:runtime.DoLCombatUI?.getEnabled(),wardrobeEnabled:runtime.DoLWardrobeUI?.getEnabled(),characteristicsEnabled:runtime.DoLCharacteristicsUI?.getEnabled(),socialEnabled:runtime.DoLSocialUI?.getEnabled(),...Object.fromEntries(['journal','traits','statistics','feats','cheats','attitudes','settings'].map(kind=>[`${kind}Enabled`,runtime.DoLPanelsUI?.getEnabled(kind)]))}),
  setPreference(key:string,value:boolean|number){if(key.endsWith("Enabled")&&typeof value!=="boolean")return;if(key==='savesEnabled')runtime.DoLSavesUI?.setEnabled(value);else if(key==='shopEnabled')runtime.DoLShopUI?.setEnabled(value);else if(['journalEnabled','traitsEnabled','statisticsEnabled','featsEnabled','cheatsEnabled','attitudesEnabled','settingsEnabled'].includes(key))runtime.DoLPanelsUI?.setEnabled(key.replace('Enabled','') as PanelKind,value);else if(key==='socialEnabled')runtime.DoLSocialUI?.setEnabled(value);else if(key==='characteristicsEnabled')runtime.DoLCharacteristicsUI?.setEnabled(value);else if(key==='wardrobeEnabled')runtime.DoLWardrobeUI?.setEnabled(value);else if(key==='combatEnabled')runtime.DoLCombatUI?.setEnabled(value);else if(!runtime.DoLMidnightTheme&&key==='enabled'&&value===false){if(runtime.DoLWardrobeUI?.isBusy?.())return;setMasterEnabled(false);for(const name of ['DoLSavesUI','DoLShopUI','DoLPanelsUI','DoLSocialUI','DoLCharacteristicsUI','DoLWardrobeUI','DoLCombatUI'])isolate(name,()=>runtime[name]?.refresh?.());for(const name of [...document.documentElement.attributes].map(a=>a.name))if(name.startsWith('data-dgu-')||name.startsWith('data-dol-midnight'))document.documentElement.removeAttribute(name)}else runtime.DoLMidnightTheme?.setPreference(key,value)},
  destroy(){isolate('UI runtime cleanup',()=>uiRuntime?.destroy());for(const name of ['DoLSavesUI','DoLShopUI','DoLPanelsUI','DoLSocialUI','DoLCharacteristicsUI','DoLWardrobeUI','DoLStatusPreview','DoLCombatUI','DoLMidnightTheme','DMTLayout']){isolate(name,()=>runtime[name]?.destroy?.());delete runtime[name]}document.getElementById('dol-ui-recovery')?.remove();delete runtime.DoLGameUI}
 };
 uiRuntime=isolate('UI runtime',()=>createUiRuntime(runtime,()=>runtime.DoLGameUI?.getPreferences()??{}));
 if(uiRuntime){runtime.DoLGameUI.ui=uiRuntime.api;document.dispatchEvent(new Event('dol-ui-runtime-ready'))}
 if(!runtime.DoLMidnightTheme){const button=document.createElement('button');button.id='dol-ui-recovery';button.type='button';button.textContent='关闭 Soft & Wet，恢复原版';button.onclick=()=>{runtime.DoLGameUI.setPreference('enabled',false);if(!isMasterEnabled())button.remove()};document.body?.append(button)}
}
