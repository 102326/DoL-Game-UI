import type {GameUiControls} from './runtime/game-controls';
import {startFloatingTools} from './floating/main';
import {isolate} from './runtime/presentation';
import {createUiRuntime} from './runtime/ui';
import {startSaves} from './saves/main';
import {startShop,type ShopFramework} from './shop/main';
import {startPanels} from './panels/main';
import {startSocial} from './social/main';
import {startCharacteristics} from './characteristics/main';
import {startWardrobe,type WardrobeFramework} from './wardrobe/main';
import {startCombat,type CombatControls} from './combat/main';
import type {PreferenceKey} from './theme/preferences';
import {startLayout} from './theme/layout';
import {pageEnabled, refreshPages, pageKeys, requestPage, type RequestedPages} from './theme/page-preferences';
import {startThemePreferences} from './theme/preference-store';
import {startTheme} from './theme/controller';
import {isMasterEnabled,setMasterEnabled} from './runtime/master';
import './theme/kraft-work-native.css';
import './theme/controls.css';
import './theme/layout.css';
import './tokens.css';
import './theme/visual.css';
import './theme/kraft-work-surfaces.css';
import './theme/mobile.css';
import './theme/sidebar.css';
import './runtime/roles.css';
import './runtime/surfaces.css';
type StartedApis={
 DoLWardrobeUI?:ReturnType<typeof startWardrobe>;
 DoLCharacteristicsUI?:ReturnType<typeof startCharacteristics>;DoLSocialUI?:ReturnType<typeof startSocial>;
 DoLPanelsUI?:ReturnType<typeof startPanels>;DoLShopUI?:ReturnType<typeof startShop>;DoLSavesUI?:ReturnType<typeof startSaves>;
 DoLCombatUI?:CombatControls;DMTLayout?:NonNullable<Parameters<typeof startLayout>[0]>['DMTLayout'];
 DoLMidnightTheme?:NonNullable<Parameters<typeof startTheme>[0]>['DoLMidnightTheme'];
};
type Runtime=Parameters<typeof startWardrobe>[0] & Parameters<typeof startShop>[0] & Parameters<typeof startSaves>[0]
 & NonNullable<Parameters<typeof startTheme>[0]> & NonNullable<Parameters<typeof startLayout>[0]>
 & Parameters<typeof createUiRuntime>[0] & StartedApis & {DoLGameUI?:GameUiControls};
const runtime=window as Runtime;
declare const __STONE_FREE_CONSUMER__:boolean;
export function startGameUI(wardrobeFramework?:WardrobeFramework & ShopFramework){
if(!runtime.DoLGameUI){
 const themePreferences=startThemePreferences(runtime);
 const start=<K extends keyof StartedApis>(name:K,factory:()=>StartedApis[K]|void)=>{const api=isolate(name,factory,()=>{try{runtime[name]?.destroy?.()}finally{delete runtime[name]}});if(api)runtime[name]=api as Runtime[K]};
 for(const name of ['DoLCombatUI','DoLMidnightTheme','DMTLayout'] as const)isolate(name,()=>runtime[name]?.destroy?.());
 start('DoLWardrobeUI',()=>startWardrobe(runtime,wardrobeFramework,themePreferences.pages));
 start('DoLCharacteristicsUI',()=>startCharacteristics(runtime,wardrobeFramework,themePreferences.pages));
 start('DoLSocialUI',()=>startSocial(runtime,wardrobeFramework,themePreferences.pages));
 start('DoLPanelsUI',()=>startPanels(runtime,wardrobeFramework,themePreferences.pages));
 start('DoLShopUI',()=>startShop(runtime,wardrobeFramework,themePreferences.pages));
 start('DoLSavesUI',()=>startSaves(runtime,wardrobeFramework,themePreferences.pages));
 start('DoLCombatUI',()=>startCombat(wardrobeFramework,themePreferences.pages));start('DMTLayout',()=>startLayout());start('DoLMidnightTheme',()=>startTheme(runtime,themePreferences));
 let floating:ReturnType<typeof startFloatingTools>|undefined;
 let uiRuntime:ReturnType<typeof createUiRuntime>|undefined;
 runtime.DoLGameUI={version:'2.7.0',openSettings:()=>runtime.DoLMidnightTheme?.openSettings(),
  wardrobe:runtime.DoLWardrobeUI?Object.freeze({apiVersion:1 as const,registerSlotMapping:runtime.DoLWardrobeUI.registerSlotMapping,getSlotSupport:runtime.DoLWardrobeUI.getSlotSupport}):undefined,
  getPreferences:()=>({...runtime.DoLMidnightTheme?.getPreferences(),enabled:isMasterEnabled(),
   ...Object.fromEntries(pageKeys.map(page=>[page+'Enabled',pageEnabled(runtime,page)]))}),
  getRequestedPreferences:()=>({...themePreferences.model.preferences,
   ...Object.fromEntries(pageKeys.map(page=>[page+'Enabled',themePreferences.pages.get(page)])) as RequestedPages}),
  setPreference(key:string,value:boolean|number){
   const page=pageKeys.find(page=>page+'Enabled'===key);
   if(page){if(typeof value==='boolean')requestPage(runtime,page,value);return}
   if(runtime.DoLMidnightTheme){runtime.DoLMidnightTheme.setPreference(key as PreferenceKey,value);return}
   if(key!=='enabled'||value!==false||runtime.DoLWardrobeUI?.isBusy?.())return;
   setMasterEnabled(false);
   themePreferences.save();
   refreshPages(runtime);
   for(const name of [...document.documentElement.attributes].map(a=>a.name))if(name.startsWith('data-dgu-')||name.startsWith('data-dol-midnight'))document.documentElement.removeAttribute(name);
  },
  destroy(){isolate('floating tools cleanup',()=>floating?.destroy());isolate('UI runtime cleanup',()=>uiRuntime?.destroy());for(const name of ['DoLSavesUI','DoLShopUI','DoLPanelsUI','DoLSocialUI','DoLCharacteristicsUI','DoLWardrobeUI','DoLCombatUI','DoLMidnightTheme','DMTLayout'] as const){isolate(name,()=>runtime[name]?.destroy?.());delete runtime[name]}document.getElementById('dol-ui-recovery')?.remove();delete runtime.DoLGameUI}
 };
 uiRuntime=isolate('UI runtime',()=>createUiRuntime(runtime,()=>runtime.DoLGameUI?.getPreferences()??{}));
 if(uiRuntime){runtime.DoLGameUI.ui=uiRuntime.api;document.dispatchEvent(new Event('dol-ui-runtime-ready'))}
 floating=isolate('floating tools',()=>startFloatingTools(runtime,!wardrobeFramework));
 if(!runtime.DoLMidnightTheme){const button=document.createElement('button');button.id='dol-ui-recovery';button.type='button';button.textContent='关闭 Soft & Wet，恢复原版';button.onclick=()=>{runtime.DoLGameUI!.setPreference('enabled',false);if(!isMasterEnabled())button.remove()};document.body?.append(button)}
}
return runtime.DoLGameUI;
}
if(typeof __STONE_FREE_CONSUMER__==='undefined'||!__STONE_FREE_CONSUMER__)startGameUI();
