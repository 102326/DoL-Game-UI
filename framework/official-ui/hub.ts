import {visualScope} from '../../src/ui/visual-scope';
import {mountVue} from '../vue';
import type {Host,Participant,MountHandle} from '../contracts';
import MotionHub from '../motion-hub/MotionHub.vue';
import '../motion-hub/style.css';
import {isMasterEnabled} from '../../src/runtime/master';
import type {FloatingApi} from '../../src/floating/main';
import type {UiApi} from '../../src/public/ui';

/** The existing opt-in floating preference also controls the official public-view Hub. */
export function startOfficialHub(host:Host,owner:Participant){
 const scope=visualScope();let mounted:Readonly<MountHandle>|undefined;
 const root=window as Window & {DoLFloatingTools?:FloatingApi};
 let mode='';
 const game=()=> (window as Window & {DoLGameUI?:{openSettings():void;ui?:UiApi}}).DoLGameUI;
 const visible=(node:Element)=>node.getClientRects().length>0&&getComputedStyle(node).visibility!=='hidden'&&!node.closest('[hidden],[inert]');
 function native(selectors:string,labels:readonly string[]){
  if([...document.querySelectorAll('dialog[open],#customOverlay,#ui-dialog')].some(visible))return '原版面板当前不可用';
  const candidates=[...document.querySelectorAll<HTMLButtonElement>(selectors)].filter(node=>labels.includes(node.textContent?.trim()??'')&&visible(node)&&!node.disabled&&node.getAttribute('aria-disabled')!=='true'&&getComputedStyle(node).pointerEvents!=='none');
  if(candidates.length!==1)return '原版入口当前不可用';
  try{candidates[0].click()}catch(error){console.warn('[Stone Free Hub] native shortcut failed; no retry',error);return '原版操作未确认，请使用原按钮'}
 }
 const directActions:Record<string,()=>string|void>={
  'SoftWetOfficialUI:interface-settings':()=>game()?.openSettings(),
  'SoftWetOfficialUI:runtime-inspector':()=>{game()?.ui?.openInspector?.()},
  'SoftWetOfficialUI:native-saves':()=>native('#overlayButtons>.sidebarButtonSplit>button.link-internal,#startCaption>button.link-internal',['存档','Save','Saves']),
  'SoftWetOfficialUI:native-social':()=>native('#overlayButtons > button.link-internal.macro-button',['社交','Social']),
  'SoftWetOfficialUI:native-attributes':()=>native('#overlayButtons > button.link-internal.macro-button',['属性','Attributes']),
 };
 const settings=owner.provideView({id:'interface-settings',title:'界面设置',setup(context){const button=document.createElement('button');button.type='button';button.textContent='打开界面设置';button.onclick=()=>{if(context.isCurrent())directActions['SoftWetOfficialUI:interface-settings']()};context.element.append(button);return()=>{button.onclick=null}}});
 const inspector=owner.provideView({id:'runtime-inspector',title:'运行检查',setup(context){const button=document.createElement('button');button.type='button';button.textContent='打开只读 Inspector';button.onclick=()=>{if(context.isCurrent())directActions['SoftWetOfficialUI:runtime-inspector']()};context.element.append(button);return()=>{button.onclick=null}}});
 const nativeViews=(['native-saves','native-social','native-attributes'] as const).map((id,index)=>owner.provideView({id,title:['存档','社交','属性'][index],setup(context){const button=document.createElement('button');button.type='button';button.textContent='打开原版入口';button.onclick=()=>{if(context.isCurrent())directActions[`SoftWetOfficialUI:${id}`]()};context.element.append(button);return()=>{button.onclick=null}}}));
 function sync(){
  if(!scope.active())return;
  const p=root.DoLFloatingTools?.getPreferences();
  if(isMasterEnabled()&&p?.enabled&&!p.hidden){
   if(mode!==p.mode){mounted?.dispose();mounted=undefined;mode=p.mode}
   if(!mounted)mounted=mountVue(owner,{id:'official-hub',parent:document.body,lifetime:'persistent',load:()=>MotionHub,props:{host,preferredMode:p.mode,officialPreferences:true,directActions,dismiss:()=>root.DoLFloatingTools?.hide()}});
  }else{mounted?.dispose();mounted=undefined}
 }
 document.addEventListener('dol-floating-change',sync);document.addEventListener('dol-ui-master-change',sync);sync();
 scope.own(settings);scope.own(inspector);for(const stop of nativeViews)scope.own(stop);scope.own(()=>mounted?.dispose());
 scope.own(()=>{document.removeEventListener('dol-floating-change',sync);document.removeEventListener('dol-ui-master-change',sync)});return scope.dispose;
}
