import {visualScope} from '../ui/visual-scope';
import {isolate,mountUI,unmountUI,supportsDialog} from '../runtime/presentation';
import {sourceMotion} from '../ui/source-motion';
import {fadeWindow} from '../ui/window-fade';
import {experiments} from '../runtime/experiments';
import type {PanelKind} from '../panels/main';
import {createApp,reactive,type App} from 'vue';
import SettingsPanel from './SettingsPanel.vue';
import '../ui/owned-select.css';
import {isOpenSelectEscape} from '../ui/native-select';
import {defaults,type Preferences,type PreferenceKey,type SettingsState} from './preferences';
import {pageEnabled, requestPage, type PageKey} from './page-preferences';
import {initMaster,isMasterEnabled,setMasterEnabled} from '../runtime/master';
import {acrylicParameters} from './acrylic';
import {createReadingLayout} from './reading-layout';
import {readingRanges} from './preferences';
import {acrylicPreference, createThemePreferences, preferenceScale} from './preference-store';
import {appearanceFont, appearancePalette, colorRoles, readAppearance, type Appearance} from './appearance';
import type {startLayout} from './layout';
// Only UI controls used here; native game state remains outside this host contract.
type PageControls={getEnabled():boolean;setEnabled(value:boolean):void;refresh?:()=>void};
type Runtime=Window & {
 CSS?: Pick<typeof CSS,'supports'>;
 jQuery?: (target:Document)=>{on(events:string,callback:()=>void):unknown;off(events:string):unknown};
 DMTLayout?: NonNullable<Parameters<typeof startLayout>[0]>['DMTLayout'];
 DoLSavesUI?: PageControls & {setV2?:(value:boolean)=>void};
 DoLShopUI?: PageControls;
 DoLSocialUI?: PageControls;
 DoLCharacteristicsUI?: PageControls;
 DoLCombatUI?: PageControls;
 DoLPanelsUI?: {getEnabled(kind:PanelKind):boolean;setEnabled(kind:PanelKind,value:boolean):void;refresh?:()=>void};
 DoLWardrobeUI?: PageControls & {setNativeHiddenList?:(value:boolean)=>void;isBusy?:()=>boolean};
 DoLShopPageExperiment?: {setEnabled?:(value:boolean)=>unknown};
 DoLMidnightTheme?: {
  setPreference(key:PreferenceKey,value:boolean|number):void;setEnabled(value:boolean):void;
  mount():void;openSettings():void;getPreferences():Preferences;
  getLifecycleCounts():{mounts:number;queued:number};destroy():void;
 };
};
declare const __STONE_FREE_CONSUMER__:boolean;
export function startTheme(root:Runtime=window as Runtime, loaded?:ReturnType<typeof createThemePreferences>){
 if(root.DoLMidnightTheme)return;
 const store=loaded??createThemePreferences(root);
 const official=(typeof __STONE_FREE_CONSUMER__!=='undefined'&&__STONE_FREE_CONSUMER__)||document.documentElement.hasAttribute('data-stone-free');
 const scope=visualScope(),motion=sourceMotion();scope.own(()=>motion.dispose());let transition=0;
 const settingsPanel=()=>controls?.querySelector<HTMLElement>('.dmt-settings-shell')??controls;
 const compactViewport=()=>root.innerWidth<=600||Math.min(root.screen.width,root.screen.height)<=600;
 const scaleMax=150;
 let controls:HTMLDialogElement|undefined,app:App|undefined,expanded:HTMLButtonElement|undefined,lastFocus:HTMLElement|null=null,bar:HTMLElement|null=null,jqAttached=false;
 let shopPageExperimentApi:Runtime['DoLShopPageExperiment']|undefined,shopPageExperimentApplied:boolean|undefined,shopPageExperimentError=false,wardrobeHiddenListApi:Runtime['DoLWardrobeUI']|undefined,wardrobeHiddenListApplied:boolean|undefined;
 const {preferences}=store.model;
 const reading=createReadingLayout();scope.own(()=>reading.destroy());
 initMaster(preferences);
 setMasterEnabled(preferences.enabled);
 const state=reactive<SettingsState>({preferences,get appearance(){return store.model.appearance},scaleMax,saves:false,combat:false,wardrobe:false,characteristics:false,social:false,shop:false,shopPageExperimentAvailable:false,panels:{journal:false,traits:false,statistics:false,feats:false,cheats:false,attitudes:false,settings:false},message:store.storageError?'偏好读取不可用，当前使用默认设置。':'设置自动保存，立即生效。'});
 let appliedAppearance: Appearance | undefined, appearanceEnabled = false;
 function updateAppearance(enabled: boolean) {
  if (appliedAppearance === state.appearance && enabled === appearanceEnabled) return;
  appliedAppearance = state.appearance;
  appearanceEnabled = enabled;
  const html = document.documentElement;
  const hasColors = enabled && colorRoles.some(role => !!state.appearance.colors[role]);
  const hasFont = enabled && !!state.appearance.font;
  const palette = hasColors ? appearancePalette(state.appearance.colors).palette : undefined;
  const colors = [...colorRoles, 'hover', 'onAccent'] as const;
  for (const role of colors) {
   const property = `--sw-custom-${role === 'onAccent' ? 'on-accent' : role}`;
   if (palette) html.style.setProperty(property, palette[role]);
   else html.style.removeProperty(property);
  }
  if (hasFont) html.style.setProperty('--sw-custom-font', appearanceFont(state.appearance.font));
  else html.style.removeProperty('--sw-custom-font');
  html.toggleAttribute('data-sw-custom-colors', hasColors);
  html.toggleAttribute('data-sw-custom-font', hasFont);
 }
 scope.own(() => updateAppearance(false));

 const counts={mounts:0,queued:0};
 function syncShopPageExperiment(){
  const api=root.DoLShopPageExperiment;
  if(api!==shopPageExperimentApi){shopPageExperimentApi=api;shopPageExperimentApplied=undefined;shopPageExperimentError=false}
  state.shopPageExperimentAvailable=!!api&&typeof api.setEnabled==='function'&&!shopPageExperimentError;
  if(!state.shopPageExperimentAvailable){shopPageExperimentApplied=undefined;return}
  const enabled=isMasterEnabled()&&state.preferences.shopPageExperiment;
  if(shopPageExperimentApplied!==enabled){try{api!.setEnabled!(enabled);shopPageExperimentApplied=enabled}catch{shopPageExperimentError=true;state.shopPageExperimentAvailable=false;shopPageExperimentApplied=undefined;if(!store.storageError)state.message='商店分页实验接口不可用；请关闭此项或重启后重试。'}}
 }
 function sync(){
  state.saves=!!root.DoLSavesUI?.getEnabled();
  syncShopPageExperiment();
  state.shop=!!root.DoLShopUI?.getEnabled();
  for(const kind of Object.keys(state.panels) as PanelKind[])state.panels[kind]=!!root.DoLPanelsUI?.getEnabled(kind);
  state.social=!!root.DoLSocialUI?.getEnabled();state.characteristics=!!root.DoLCharacteristicsUI?.getEnabled();state.combat=!!root.DoLCombatUI?.getEnabled();state.wardrobe=!!root.DoLWardrobeUI?.getEnabled();
  const wardrobeApi=root.DoLWardrobeUI;if(wardrobeApi!==wardrobeHiddenListApi){wardrobeHiddenListApi=wardrobeApi;wardrobeHiddenListApplied=undefined}if(wardrobeApi&&typeof wardrobeApi.setNativeHiddenList==='function'){const value=isMasterEnabled()&&state.wardrobe&&state.preferences.wardrobeHiddenList;if(wardrobeHiddenListApplied!==value){try{wardrobeApi.setNativeHiddenList(value);wardrobeHiddenListApplied=value}catch{wardrobeHiddenListApplied=undefined}}}else{wardrobeHiddenListApi=undefined;wardrobeHiddenListApplied=undefined}
 }
 function apply(){
  const html=document.documentElement,visualTier=official?2:state.preferences.visualTier;html.setAttribute('data-dgu-visual',String(state.preferences.enabled?visualTier:0));
  updateAppearance(official && state.preferences.enabled);
  for(const key of ['visualGlass','visualMotion','visualGlow'] as const)html.toggleAttribute(`data-dgu-${key}`,state.preferences.enabled&&visualTier>0&&state.preferences[key]&&(key!=='visualGlass'||!!(root.CSS?.supports?.('backdrop-filter','blur(1px)')||root.CSS?.supports?.('-webkit-backdrop-filter','blur(1px)'))));
  html.toggleAttribute('data-dgu-visualPattern',state.preferences.enabled&&state.preferences.visualPattern);
  html.toggleAttribute('data-dgu-acrylic-adjustment',state.preferences.enabled&&official);
  for(const [key,value] of Object.entries(acrylicParameters(state.preferences.acrylicTransparency)))html.style.setProperty(key,value);
  html.toggleAttribute('data-dgu-options-centered',state.preferences.enabled&&state.preferences.centerOptions);
  html.style.setProperty('--dgu-option-text-align',state.preferences.enabled&&state.preferences.centerOptions?'center':'left');
  html.style.setProperty('--dgu-ui-extra-gap',`${state.preferences.enabled?state.preferences.readingBlockGap:0}px`);
  applyFontScale();
  const buttonScale=Math.min(state.scaleMax,state.preferences.buttonScale);
  document.documentElement.style.setProperty('--dgu-button-scale',String((isMasterEnabled()?buttonScale:100)/100));document.documentElement.toggleAttribute('data-dgu-buttons-scaled',isMasterEnabled()&&buttonScale!==100);isolate('saves layout',()=>root.DoLSavesUI?.setV2?.(isMasterEnabled()&&state.preferences.savesV2));
  experiments.wardrobePaged=isMasterEnabled()&&state.preferences.wardrobePaged;experiments.shopDeferredPaint=isMasterEnabled()&&state.preferences.shopDeferredPaint;
  document.documentElement.toggleAttribute('data-dol-shop-deferred-paint',experiments.shopDeferredPaint);
  state.preferences.showCompact=false;state.preferences.collapsedStats=false;
  document.documentElement.toggleAttribute('data-dol-midnight',state.preferences.enabled);
  document.documentElement.removeAttribute('data-dol-midnight-comfortable');
  reading.update(state.preferences);
  html.toggleAttribute('data-dgu-compact-controls',state.preferences.enabled&&state.preferences.mobileCompactControls&&compactViewport());
  isolate('layout',()=>root.DMTLayout?.sync({...state.preferences,enabled:isMasterEnabled()}));
  sync();
 }
 function applyFontScale(){
  const scale=isMasterEnabled()?state.preferences.fontScale:100;
  const html=document.documentElement;
  html.toggleAttribute('data-dgu-font-scaled',scale!==100);
  html.style.setProperty('--dgu-font-scale',String(scale/100));
 }
 function persist(){
  store.save();
  state.message=store.storageError?'当前页面已应用；偏好无法保存，重启后可能恢复默认。':shopPageExperimentError?'商店分页实验接口不可用；请关闭此项或重启后重试。':'显示设置已保存。';
 }
 function setAppearance(value:Appearance) {
  if(!scope.active()||!official)return;
  const next=readAppearance(value), current=store.model.appearance;
  if(next.font!==current.font || colorRoles.some(role=>next.colors[role]!==current.colors[role])){
   store.model.appearance=next;
   updateAppearance(state.preferences.enabled);
   if(next.font!==current.font)reading.refresh();
  }
  persist();
 }
 function setPreference(key:PreferenceKey,value:boolean|number){
  if(!scope.active()||!Object.hasOwn(defaults,key)||['statusPreview','startupCacheLazy','storyActions','compactStats','comfortable','wideReading'].includes(key))return;
  if(key==='enabled'){
   if(typeof value==='boolean')setMaster(value);
   return;
  }
  if(key==='fontScale'){
   const scale=preferenceScale(value);
   if(scale===undefined)return;
   if(state.preferences.fontScale===scale&&!store.storageError)return;
   state.preferences.fontScale=scale;
   applyFontScale();
   reading.refresh();
   persist();
   return;
  }
  if(key==='readingLineScale'||key==='readingBlockGap'||key==='readingWidth'){
   if(typeof value!=='number'||!Number.isFinite(value))return;
   const range=readingRanges[key];
   state.preferences[key]=Math.max(range.min,Math.min(range.max,Math.round(value)));
  }else if(key==='visualTier'){
   if(typeof value!=='number'||!Number.isInteger(value)||value<0||value>2)return;
   state.preferences[key]=value;
  }else if(key==='acrylicTransparency'){
   const amount=acrylicPreference(value);
   if(amount===undefined)return;
   state.preferences[key]=amount;
  }else if(key==='buttonScale'){
   const scale=preferenceScale(value);
   if(scale===undefined)return;
   state.preferences.buttonScale=scale;
  }else{
   if(typeof value!=='boolean')return;
   state.preferences[key]=value;
  }
  apply();persist();
  if(key==='combatFocused')isolate('combat presentation',()=>root.DoLCombatUI?.refresh?.());
  if(key==='shopPageExperiment'&&!store.storageError&&!shopPageExperimentError)state.message='商店分页实验将在下次进入或重建商店列表时生效。';
 }
 function resizeScale(){
  document.documentElement.toggleAttribute('data-dgu-compact-controls',state.preferences.enabled&&state.preferences.mobileCompactControls&&compactViewport());
  reading.refresh();
 }
 function setPage(page:PageKey,value:boolean){
  requestPage(root,page,value);
  sync();
  if(page==='wardrobe'&&root.DoLWardrobeUI?.isBusy?.()&&state.wardrobe!==value)
   state.message='衣柜正在处理操作，请完成后再切换。';
  else if(pageEnabled(root,page)===undefined)state.message='此界面模块当前不可用，已保留原选择。';
  else if(store.pages.isUnsaved(page))state.message='当前页面已应用；偏好无法保存，重启后可能恢复默认。';
 }
 function setMaster(value:boolean){
  if(state.preferences.enabled===value){if(store.storageError)persist();return}
  if(root.DoLWardrobeUI?.isBusy?.()){state.message='衣柜正在处理操作，请完成后再切换。';return}
  setMasterEnabled(value);
  for(const name of ['DoLSavesUI','DoLShopUI','DoLPanelsUI','DoLSocialUI','DoLCharacteristicsUI','DoLWardrobeUI','DoLCombatUI'] as const)isolate(name,()=>root[name]?.refresh?.());
  apply();persist();
  if(!store.storageError)state.message=value?'Soft & Wet 界面已启用。':'已回到原版界面；显示偏好已保留。';
 }
 function finishClose(){
  document.documentElement.removeAttribute('data-dgu-settings-open');if(!controls)return;controls.removeAttribute('data-sf-leaving');
  if(controls.open&&typeof controls.close==='function')controls.close();else controls.removeAttribute('open');
  if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});lastFocus=null;
 }
 function fadeSettings(target:0|1,initial?:number){
  const panel=settingsPanel();if(!official||!panel)return;
  return fadeWindow(motion,panel,target,initial);
 }
 function closeSettings(){
  if(!controls?.open||controls.hasAttribute('data-sf-leaving'))return;
  const ticket=++transition;controls.setAttribute('data-sf-leaving','');
  const animation=fadeSettings(0);
  if(!animation){finishClose();return}
  void animation.finished.catch(()=>{}).then(()=>{if(ticket===transition&&scope.active())finishClose()});
 }
 function openSettings(){
  if(!scope.active())return;mount();if(!controls)return;sync();
  const opening=!controls.open,reversing=controls.hasAttribute('data-sf-leaving');
  ++transition;controls.removeAttribute('data-sf-leaving');
  if(opening){
   lastFocus=document.activeElement as HTMLElement;document.documentElement.setAttribute('data-dgu-settings-open','');
   if(supportsDialog())controls.showModal();else{controls.classList.add('dmt-modeless');controls.setAttribute('open','')}
  }
  if(opening||reversing)fadeSettings(1,opening?0:undefined);
  controls.querySelector<HTMLButtonElement>('.dmt-close')?.focus({preventScroll:true});
 }
 function nativeSettings(){
  ++transition;motion.cancel();unmountUI(app);app=undefined;if(!controls)return;controls.removeAttribute('data-sf-leaving');
  const text=document.createElement('p');text.textContent='界面设置暂不可用，可以关闭主题并继续使用原版。';
  const fallback=document.createElement('button');fallback.type='button';fallback.textContent='恢复原版界面';fallback.onclick=()=>{setMaster(false);closeSettings()};
  const close=document.createElement('button');close.type='button';close.textContent='关闭';close.onclick=closeSettings;
  const host=document.createElement('div');host.className='dmt-settings-shell';host.append(text,fallback,close);controls.replaceChildren(host);

 }
 function buildControls(){
  ++transition;motion.cancel();
  document.documentElement.removeAttribute('data-dgu-settings-open');unmountUI(app);controls?.remove();controls=document.createElement('dialog');controls.id='dol-midnight-controls';controls.setAttribute('aria-labelledby','dol-midnight-title');
  const host=document.createElement('div');host.className='dmt-settings-shell';controls.append(host);document.body.append(controls);
  app=createApp(SettingsPanel,{state,onSaves:(value:boolean)=>setPage('saves',value),onPreference:setPreference,onAppearance:setAppearance,onCombat:(value:boolean)=>setPage('combat',value),onWardrobe:(value:boolean)=>setPage('wardrobe',value),onCharacteristics:(value:boolean)=>setPage('characteristics',value),onSocial:(value:boolean)=>setPage('social',value),onPanel:setPage,onShop:(value:boolean)=>setPage('shop',value),onClose:closeSettings,onRecovery:setMaster});isolate('settings render',()=>mountUI(app!,host,nativeSettings),nativeSettings);
  // Native modal hit testing does not stop delegated game handlers from receiving our controls' events.
  for(const type of ['click','input','change','pointerdown','pointerup','touchstart','touchend','keyup'])controls.addEventListener(type,event=>event.stopPropagation());
  controls.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'&&!isOpenSelectEscape(event)){event.preventDefault();closeSettings()}});
  controls.addEventListener('close',()=>{if(!controls?.open){document.documentElement.removeAttribute('data-dgu-settings-open');++transition;motion.cancel();controls?.removeAttribute('data-sf-leaving')}});
  controls.addEventListener('cancel',event=>{event.preventDefault();closeSettings()});
  controls.addEventListener('click',event=>{if(event.target===controls)closeSettings()});
 }
 function target(){return document.getElementById('overlayButtons')||document.getElementById('startCaption')||document.getElementById('menu')||document.body}
 function needsMount(){return !controls?.isConnected||!expanded?.isConnected||expanded.parentElement!==target()||bar!==document.getElementById('ui-bar')}
 function updateTheme(){isolate('theme update',()=>{if(needsMount())mount();else{syncShopPageExperiment();reading.refresh()}},nativeSettings)}
 function schedule(){if(scope.frame(updateTheme))counts.queued++}
 const observer=new MutationObserver(()=>{if(needsMount())schedule()});scope.own(()=>observer.disconnect());
 function mount(){
  if(!scope.active()||!document.body)return;counts.mounts++;
  observer.disconnect();
  if(!controls?.isConnected)buildControls();
  if(!expanded){expanded=document.createElement('button');expanded.id='dol-midnight-sidebar-button';expanded.type='button';expanded.textContent='界面设置';expanded.setAttribute('aria-haspopup','dialog');if(official)expanded.setAttribute('data-kw-entry','official-settings');expanded.addEventListener('click',openSettings)}
  const parent=target();if(expanded.parentElement!==parent)parent.append(expanded);expanded.classList.toggle('dmt-fallback',parent===document.body);
  apply();if(root.jQuery&&!jqAttached){root.jQuery(document).on(':storyready.dolMidnight :passageend.dolMidnight',schedule);jqAttached=true}
  observer.observe(document.body,{childList:true});bar=document.getElementById('ui-bar');if(bar)observer.observe(bar,{childList:true,subtree:true});
 }
 function listen(target:EventTarget,type:string,fn:EventListener){target.addEventListener(type,fn);scope.own(()=>target.removeEventListener(type,fn))}
 listen(root,'resize',resizeScale);listen(document,'DOMContentLoaded',schedule);listen(root,'load',schedule);listen(document,'dol-ui-saves-change',sync);listen(document,'dol-ui-combat-change',sync);listen(document,'dol-ui-wardrobe-change',sync);listen(document,'dol-ui-characteristics-change',sync);listen(document,'dol-ui-social-change',sync);listen(document,'dol-ui-panels-change',sync);listen(document,'dol-ui-shop-change',sync);listen(root,'backbutton',()=>{if(controls?.open)closeSettings()});
 root.DoLMidnightTheme={setPreference,setEnabled:(value:boolean)=>setPreference('enabled',value),mount,openSettings,getPreferences:()=>({...state.preferences}),getLifecycleCounts:()=>({...counts}),destroy(){if(!scope.active())return;scope.dispose();++transition;document.documentElement.removeAttribute('data-dgu-settings-open');for(const attribute of ['data-dgu-visual','data-dgu-visualGlass','data-dgu-visualMotion','data-dgu-visualGlow','data-dgu-visualPattern','data-dgu-compact-controls','data-dgu-acrylic-adjustment','data-dgu-options-centered'])document.documentElement.removeAttribute(attribute);document.documentElement.removeAttribute('data-dgu-font-scaled');for(const key of [...Object.keys(acrylicParameters(0)),'--dgu-option-text-align','--dgu-ui-extra-gap'])document.documentElement.style.removeProperty(key);document.documentElement.style.removeProperty('--dgu-font-scale');document.documentElement.style.removeProperty('--dgu-button-scale');document.documentElement.removeAttribute('data-dgu-buttons-scaled');experiments.wardrobePaged=false;experiments.shopDeferredPaint=false;document.documentElement.removeAttribute('data-dol-shop-deferred-paint');if(jqAttached)root.jQuery!(document).off('.dolMidnight');unmountUI(app);controls?.remove();expanded?.remove();root.DMTLayout?.destroy();document.documentElement.removeAttribute('data-dol-midnight');document.documentElement.removeAttribute('data-dol-midnight-comfortable');delete root.DoLMidnightTheme}};
 mount();
 // Early mod injection can precede SugarCube/jQuery. These bounded retries only mount when needed.
 if(!jqAttached)for(const delay of [250,1000,3000]){scope.timeout(()=>{if(!jqAttached||needsMount())isolate('theme retry',mount,nativeSettings)},delay)}
}
