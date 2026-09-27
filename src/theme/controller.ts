import {experiments} from '../runtime/experiments';
import type {PanelKind} from '../panels/main';
import {createApp,reactive,type App} from 'vue';
import SettingsPanel from './SettingsPanel.vue';
import {defaults,type Preferences,type PreferenceKey,type SettingsState} from './preferences';
type Runtime=Window & Record<string,any>;
export function startTheme(root:Runtime=window as Runtime){
 if(root.DoLMidnightTheme)return;
 const KEY='DoLMidnightTheme.preferences.v1';
 let destroyed=false,frame=0,controls:HTMLDialogElement|undefined,app:App|undefined,expanded:HTMLButtonElement|undefined,lastFocus:HTMLElement|null=null,bar:HTMLElement|null=null,jqAttached=false,previewEnabled:boolean|undefined;
 let storageError=false,shopPageExperimentApi:Runtime['DoLShopPageExperiment']|undefined,shopPageExperimentApplied:boolean|undefined,shopPageExperimentError=false,wardrobeHiddenListApi:Runtime['DoLWardrobeUI']|undefined,wardrobeHiddenListApplied:boolean|undefined;
 const preferences:Preferences={...defaults};
 try{const raw=root.localStorage.getItem(KEY);if(raw&&raw.length<=512){const value=JSON.parse(raw);for(const key of Object.keys(defaults) as PreferenceKey[])if(typeof value?.[key]==='boolean')preferences[key]=value[key]}}catch{storageError=true}
 const state=reactive<SettingsState>({preferences,combat:false,wardrobe:false,characteristics:false,social:false,shop:false,shopPageExperimentAvailable:false,panels:{journal:false,traits:false,statistics:false,feats:false},message:storageError?'偏好读取不可用，当前使用默认设置。':'设置自动保存，立即生效。'});
 const cleanups:Array<()=>void>=[],timers=new Set<ReturnType<typeof setTimeout>>();
 const counts={mounts:0,queued:0};
 function syncShopPageExperiment(){
  const api=root.DoLShopPageExperiment;
  if(api!==shopPageExperimentApi){shopPageExperimentApi=api;shopPageExperimentApplied=undefined;shopPageExperimentError=false}
  state.shopPageExperimentAvailable=!!api&&typeof api.setEnabled==='function'&&!shopPageExperimentError;
  if(!state.shopPageExperimentAvailable){shopPageExperimentApplied=undefined;return}
  const enabled=state.preferences.shopPageExperiment;
  if(shopPageExperimentApplied!==enabled){try{api.setEnabled(enabled);shopPageExperimentApplied=enabled}catch{shopPageExperimentError=true;state.shopPageExperimentAvailable=false;shopPageExperimentApplied=undefined;if(!storageError)state.message='商店分页实验接口不可用；请关闭此项或重启后重试。'}}
 }
 function sync(){
  syncShopPageExperiment();
  state.shop=!!root.DoLShopUI?.getEnabled();
  for(const kind of Object.keys(state.panels) as PanelKind[])state.panels[kind]=!!root.DoLPanelsUI?.getEnabled(kind);
  state.social=!!root.DoLSocialUI?.getEnabled();state.characteristics=!!root.DoLCharacteristicsUI?.getEnabled();state.combat=!!root.DoLCombatUI?.getEnabled();state.wardrobe=!!root.DoLWardrobeUI?.getEnabled();
  const wardrobeApi=root.DoLWardrobeUI;if(wardrobeApi!==wardrobeHiddenListApi){wardrobeHiddenListApi=wardrobeApi;wardrobeHiddenListApplied=undefined}if(wardrobeApi&&typeof wardrobeApi.setNativeHiddenList==='function'){const value=state.wardrobe&&state.preferences.wardrobeHiddenList;if(wardrobeHiddenListApplied!==value){try{wardrobeApi.setNativeHiddenList(value);wardrobeHiddenListApplied=value}catch{wardrobeHiddenListApplied=undefined}}}else{wardrobeHiddenListApi=undefined;wardrobeHiddenListApplied=undefined}
 }
 function apply(){
  experiments.wardrobePaged=state.preferences.wardrobePaged;experiments.shopDeferredPaint=state.preferences.shopDeferredPaint;
  document.documentElement.toggleAttribute('data-dol-shop-deferred-paint',experiments.shopDeferredPaint);
  state.preferences.showCompact=false;state.preferences.collapsedStats=false;
  document.documentElement.toggleAttribute('data-dol-midnight',state.preferences.enabled);
  document.documentElement.toggleAttribute('data-dol-midnight-comfortable',state.preferences.enabled&&state.preferences.comfortable);
  root.DMTLayout?.sync(state.preferences);
  if(previewEnabled!==state.preferences.statusPreview){previewEnabled=state.preferences.statusPreview;root.DoLStatusPreview?.setEnabled(previewEnabled)}
  sync();
 }
 function persist(){apply();try{root.localStorage.setItem(KEY,JSON.stringify(state.preferences));storageError=false}catch{storageError=true}state.message=storageError?'当前页面已应用；偏好无法保存，重启后可能恢复默认。':shopPageExperimentError?'商店分页实验接口不可用；请关闭此项或重启后重试。':'显示设置已保存。'}
 function setPreference(key:PreferenceKey,value:boolean){if(destroyed||!Object.hasOwn(defaults,key)||typeof value!=='boolean')return;state.preferences[key]=value;persist();if(key==='shopPageExperiment'&&!storageError&&!shopPageExperimentError)state.message='商店分页实验将在下次进入或重建商店列表时生效。';if(key==='startupCacheLazy'&&!storageError)state.message='启动缓存实验设置已保存，请先保存游戏进度，再重启游戏生效。'}
 function setPanel(kind:PanelKind,value:boolean){root.DoLPanelsUI?.setEnabled(kind,value);sync()}
 function setShop(value:boolean){root.DoLShopUI?.setEnabled(value);sync()}
 function setSocial(value:boolean){root.DoLSocialUI?.setEnabled(value);sync()}
 function setCharacteristics(value:boolean){root.DoLCharacteristicsUI?.setEnabled(value);sync()}
 function setCombat(value:boolean){root.DoLCombatUI?.setEnabled(value);sync()}
 function setWardrobe(value:boolean){root.DoLWardrobeUI?.setEnabled(value);sync();if(state.wardrobe!==value)state.message='衣柜正在处理操作，请完成后再切换。'}
 function recover(value:boolean){
  // The wardrobe owns its busy guard. Do not partially reset other panels if it refuses.
  setWardrobe(value);if(state.wardrobe!==value)return;
  if(!value){state.preferences.wardrobePaged=false;state.preferences.wardrobeHiddenList=false;state.preferences.shopDeferredPaint=false;state.preferences.shopPageExperiment=false;state.preferences.startupCacheLazy=false}
  setShop(value);setCombat(value);setCharacteristics(value);setSocial(value);for(const kind of Object.keys(state.panels) as PanelKind[])setPanel(kind,value);state.preferences.enabled=value;state.preferences.layout=value;state.preferences.statusPreview=false;persist();
  if(!storageError)state.message=value?'新版界面已启用。':'已回退原版界面；若曾启用启动缓存实验，请保存进度并重启。';
 }
 function closeSettings(){if(!controls)return;if(controls.open)controls.close();else controls.removeAttribute('open');if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});lastFocus=null}
 function openSettings(){if(destroyed)return;mount();if(!controls)return;sync();lastFocus=document.activeElement as HTMLElement;if(!controls.open)controls.showModal();controls.querySelector<HTMLButtonElement>('.dmt-close')?.focus();}
 function buildControls(){
  app?.unmount();controls?.remove();controls=document.createElement('dialog');controls.id='dol-midnight-controls';controls.setAttribute('aria-labelledby','dol-midnight-title');
  const host=document.createElement('div');controls.append(host);document.body.append(controls);
  app=createApp(SettingsPanel,{state,onPreference:setPreference,onCombat:setCombat,onWardrobe:setWardrobe,onCharacteristics:setCharacteristics,onSocial:setSocial,onPanel:setPanel,onShop:setShop,onClose:closeSettings,onRecovery:recover});app.mount(host);
  controls.addEventListener('cancel',event=>{event.preventDefault();closeSettings()});
  controls.addEventListener('click',event=>{if(event.target!==controls)return;const r=controls!.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeSettings()});
  previewEnabled=undefined;
 }
 function target(){return document.getElementById('overlayButtons')||document.getElementById('startCaption')||document.getElementById('menu')||document.body}
 function needsMount(){return !controls?.isConnected||!expanded?.isConnected||expanded.parentElement!==target()||bar!==document.getElementById('ui-bar')}
 function schedule(){if(destroyed||frame)return;counts.queued++;frame=requestAnimationFrame(()=>{frame=0;if(needsMount())mount();else syncShopPageExperiment()})}
 const observer=new MutationObserver(()=>{if(needsMount())schedule()});
 function mount(){
  if(destroyed||!document.body)return;counts.mounts++;
  observer.disconnect();
  if(!controls?.isConnected)buildControls();
  if(!expanded){expanded=document.createElement('button');expanded.id='dol-midnight-sidebar-button';expanded.type='button';expanded.textContent='界面设置';expanded.setAttribute('aria-haspopup','dialog');expanded.addEventListener('click',openSettings)}
  const parent=target();if(expanded.parentElement!==parent)parent.append(expanded);expanded.classList.toggle('dmt-fallback',parent===document.body);
  apply();if(root.jQuery&&!jqAttached){root.jQuery(document).on(':storyready.dolMidnight :passageend.dolMidnight',schedule);jqAttached=true}
  observer.observe(document.body,{childList:true});bar=document.getElementById('ui-bar');if(bar)observer.observe(bar,{childList:true,subtree:true});
 }
 function listen(target:EventTarget,type:string,fn:EventListener){target.addEventListener(type,fn);cleanups.push(()=>target.removeEventListener(type,fn))}
 listen(document,'DOMContentLoaded',schedule);listen(root,'load',schedule);listen(document,'dol-ui-combat-change',sync);listen(document,'dol-ui-wardrobe-change',sync);listen(document,'dol-ui-characteristics-change',sync);listen(document,'dol-ui-social-change',sync);listen(document,'dol-ui-panels-change',sync);listen(document,'dol-ui-shop-change',sync);listen(root,'backbutton',()=>{if(controls?.open)closeSettings()});
 root.DoLMidnightTheme={setPreference,setEnabled:(value:boolean)=>setPreference('enabled',value),mount,openSettings,getPreferences:()=>({...state.preferences}),getLifecycleCounts:()=>({...counts}),destroy(){experiments.wardrobePaged=false;experiments.shopDeferredPaint=false;document.documentElement.removeAttribute('data-dol-shop-deferred-paint');destroyed=true;if(frame)cancelAnimationFrame(frame);timers.forEach(clearTimeout);cleanups.forEach(off=>off());observer.disconnect();if(jqAttached)root.jQuery(document).off('.dolMidnight');app?.unmount();controls?.remove();expanded?.remove();root.DMTLayout?.destroy();document.documentElement.removeAttribute('data-dol-midnight');document.documentElement.removeAttribute('data-dol-midnight-comfortable');delete root.DoLMidnightTheme}};
 mount();
 // Early mod injection can precede SugarCube/jQuery. These bounded retries only mount when needed.
 if(!jqAttached)for(const delay of [250,1000,3000]){const timer=setTimeout(()=>{timers.delete(timer);if(!jqAttached||needsMount())mount()},delay);timers.add(timer)}
}
