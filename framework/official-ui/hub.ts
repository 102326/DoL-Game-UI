import {mountVue} from '../vue';
import type {Host,Participant,MountHandle} from '../contracts';
import MotionHub from '../motion-hub/MotionHub.vue';
import '../motion-hub/style.css';
import {isMasterEnabled} from '../../src/runtime/master';
import type {FloatingApi} from '../../src/floating/main';
import type {UiApi} from '../../src/public/ui';

/** The existing opt-in floating preference also controls the official public-view Hub. */
export function startOfficialHub(host:Host,owner:Participant){
 let mounted:Readonly<MountHandle>|undefined,stopped=false;
 const root=window as Window & {DoLFloatingTools?:FloatingApi};
 let mode='';
 const settings=owner.provideView({id:'interface-settings',title:'界面设置',setup(context){const button=document.createElement('button');button.type='button';button.textContent='打开界面设置';button.onclick=()=>{if(context.isCurrent())(window as Window & {DoLGameUI?:{openSettings():void}}).DoLGameUI?.openSettings()};context.element.append(button);return()=>{button.onclick=null}}});
 const inspector=owner.provideView({id:'runtime-inspector',title:'运行检查',setup(context){const button=document.createElement('button');button.type='button';button.textContent='打开只读 Inspector';button.onclick=()=>{if(context.isCurrent())(window as Window & {DoLGameUI?:{ui?:UiApi}}).DoLGameUI?.ui?.openInspector?.()};context.element.append(button);return()=>{button.onclick=null}}});
 function sync(){
  if(stopped)return;
  const p=root.DoLFloatingTools?.getPreferences();
  if(isMasterEnabled()&&p?.enabled&&!p.hidden){
   if(mode!==p.mode){mounted?.dispose();mounted=undefined;mode=p.mode}
   if(!mounted)mounted=mountVue(owner,{id:'official-hub',parent:document.body,lifetime:'persistent',load:()=>MotionHub,props:{host,preferredMode:p.mode,officialPreferences:true,dismiss:()=>root.DoLFloatingTools?.hide()}});
  }else{mounted?.dispose();mounted=undefined}
 }
 document.addEventListener('dol-floating-change',sync);document.addEventListener('dol-ui-master-change',sync);sync();
 return()=>{stopped=true;document.removeEventListener('dol-floating-change',sync);document.removeEventListener('dol-ui-master-change',sync);mounted?.dispose();settings();inspector()};
}
