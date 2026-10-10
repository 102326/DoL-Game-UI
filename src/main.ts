import {isolate} from './runtime/presentation';
import {createUiRuntime} from './runtime/ui';
import {startSaves} from './saves/main';
import {startShop} from './shop/main';
import {startPanels,type PanelKind} from './panels/main';
import {startSocial} from './social/main';
import {startCharacteristics} from './characteristics/main';
import {startStatusPreview} from './runtime/preview';
import {startWardrobe} from './wardrobe/main';
import type {WardrobeApi} from './public/wardrobe';
import {startCombat,type CombatControls} from './combat/main';
import type {Preferences,PreferenceKey} from './theme/preferences';
import type {UiApi} from './public/ui';
import {startLayout} from './theme/layout';
import {startTheme} from './theme/controller';
import {initMaster,isMasterEnabled,setMasterEnabled} from './runtime/master';
import './theme/midnight.css';
import './theme/controls.css';
import './theme/layout.css';
import './tokens.css';
import './theme/visual.css';
import './theme/eyes.css';
import './theme/mobile.css';
import './theme/sidebar.css';
import './runtime/roles.css';
import './runtime/surfaces.css';
type StartedApis={
 DoLStatusPreview?:ReturnType<typeof startStatusPreview>;DoLWardrobeUI?:ReturnType<typeof startWardrobe>;
 DoLCharacteristicsUI?:ReturnType<typeof startCharacteristics>;DoLSocialUI?:ReturnType<typeof startSocial>;
 DoLPanelsUI?:ReturnType<typeof startPanels>;DoLShopUI?:ReturnType<typeof startShop>;DoLSavesUI?:ReturnType<typeof startSaves>;
 DoLCombatUI?:CombatControls;DMTLayout?:NonNullable<Parameters<typeof startLayout>[0]>['DMTLayout'];
 DoLMidnightTheme?:NonNullable<Parameters<typeof startTheme>[0]>['DoLMidnightTheme'];
};
interface GameUiControls {version:string;openSettings:()=>void;getPreferences:()=>Partial<Preferences> & Record<string,unknown>;setPreference:(key:string,value:boolean|number)=>void;destroy:()=>void;ui?:UiApi;wardrobe?:Readonly<WardrobeApi>}
type Runtime=Parameters<typeof startWardrobe>[0] & Parameters<typeof startShop>[0] & Parameters<typeof startSaves>[0]
 & NonNullable<Parameters<typeof startTheme>[0]> & NonNullable<Parameters<typeof startLayout>[0]>
 & Parameters<typeof createUiRuntime>[0] & Parameters<typeof startStatusPreview>[0] & StartedApis & {DoLGameUI?:GameUiControls};
const runtime=window as Runtime;
if(!runtime.DoLGameUI){
 initMaster(runtime);
 const start=<K extends keyof StartedApis>(name:K,factory:()=>StartedApis[K]|void)=>{const api=isolate(name,factory,()=>{try{runtime[name]?.destroy?.()}finally{delete runtime[name]}});if(api)runtime[name]=api as Runtime[K]};
 for(const name of ['DoLCombatUI','DoLMidnightTheme','DMTLayout'] as const)isolate(name,()=>runtime[name]?.destroy?.());
 start('DoLStatusPreview',()=>startStatusPreview(runtime));
 start('DoLWardrobeUI',()=>startWardrobe(runtime));
 start('DoLCharacteristicsUI',()=>startCharacteristics(runtime));
 start('DoLSocialUI',()=>startSocial(runtime));
 start('DoLPanelsUI',()=>startPanels(runtime));
 start('DoLShopUI',()=>startShop(runtime));
 start('DoLSavesUI',()=>startSaves(runtime));
 start('DoLCombatUI',()=>startCombat());start('DMTLayout',()=>startLayout());start('DoLMidnightTheme',()=>startTheme());
 let uiRuntime:ReturnType<typeof createUiRuntime>|undefined;
 runtime.DoLGameUI={version:'2.5.0',openSettings:()=>runtime.DoLMidnightTheme?.openSettings(),
  wardrobe:runtime.DoLWardrobeUI?Object.freeze({apiVersion:1 as const,registerSlotMapping:runtime.DoLWardrobeUI.registerSlotMapping,getSlotSupport:runtime.DoLWardrobeUI.getSlotSupport}):undefined,
  getPreferences:()=>({...runtime.DoLMidnightTheme?.getPreferences(),enabled:isMasterEnabled(),savesEnabled:runtime.DoLSavesUI?.getEnabled(),shopEnabled:runtime.DoLShopUI?.getEnabled(),combatEnabled:runtime.DoLCombatUI?.getEnabled(),wardrobeEnabled:runtime.DoLWardrobeUI?.getEnabled(),characteristicsEnabled:runtime.DoLCharacteristicsUI?.getEnabled(),socialEnabled:runtime.DoLSocialUI?.getEnabled(),...Object.fromEntries((['journal','traits','statistics','feats','cheats','attitudes','settings'] as const).map(kind=>[`${kind}Enabled`,runtime.DoLPanelsUI?.getEnabled(kind)]))}),
  setPreference(key:string,value:boolean|number){if(key.endsWith("Enabled")&&typeof value!=="boolean")return;if(key==='savesEnabled')runtime.DoLSavesUI?.setEnabled(value as boolean);else if(key==='shopEnabled')runtime.DoLShopUI?.setEnabled(value as boolean);else if(['journalEnabled','traitsEnabled','statisticsEnabled','featsEnabled','cheatsEnabled','attitudesEnabled','settingsEnabled'].includes(key))runtime.DoLPanelsUI?.setEnabled(key.replace('Enabled','') as PanelKind,value as boolean);else if(key==='socialEnabled')runtime.DoLSocialUI?.setEnabled(value as boolean);else if(key==='characteristicsEnabled')runtime.DoLCharacteristicsUI?.setEnabled(value as boolean);else if(key==='wardrobeEnabled')runtime.DoLWardrobeUI?.setEnabled(value as boolean);else if(key==='combatEnabled')runtime.DoLCombatUI?.setEnabled(value as boolean);else if(!runtime.DoLMidnightTheme&&key==='enabled'&&value===false){if(runtime.DoLWardrobeUI?.isBusy?.())return;setMasterEnabled(false);for(const name of ['DoLSavesUI','DoLShopUI','DoLPanelsUI','DoLSocialUI','DoLCharacteristicsUI','DoLWardrobeUI','DoLCombatUI'] as const)isolate(name,()=>runtime[name]?.refresh?.());for(const name of [...document.documentElement.attributes].map(a=>a.name))if(name.startsWith('data-dgu-')||name.startsWith('data-dol-midnight'))document.documentElement.removeAttribute(name)}else runtime.DoLMidnightTheme?.setPreference(key as PreferenceKey,value)},
  destroy(){isolate('UI runtime cleanup',()=>uiRuntime?.destroy());for(const name of ['DoLSavesUI','DoLShopUI','DoLPanelsUI','DoLSocialUI','DoLCharacteristicsUI','DoLWardrobeUI','DoLStatusPreview','DoLCombatUI','DoLMidnightTheme','DMTLayout'] as const){isolate(name,()=>runtime[name]?.destroy?.());delete runtime[name]}document.getElementById('dol-ui-recovery')?.remove();delete runtime.DoLGameUI}
 };
 uiRuntime=isolate('UI runtime',()=>createUiRuntime(runtime,()=>runtime.DoLGameUI?.getPreferences()??{}));
 if(uiRuntime){runtime.DoLGameUI.ui=uiRuntime.api;document.dispatchEvent(new Event('dol-ui-runtime-ready'))}
 if(!runtime.DoLMidnightTheme){const button=document.createElement('button');button.id='dol-ui-recovery';button.type='button';button.textContent='关闭 Soft & Wet，恢复原版';button.onclick=()=>{runtime.DoLGameUI!.setPreference('enabled',false);if(!isMasterEnabled())button.remove()};document.body?.append(button)}
}
