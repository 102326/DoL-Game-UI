import {createApp,type ComponentPublicInstance} from 'vue';
import type {Host,MountHandle} from '../../framework/contracts';
import {visualScope} from '../../src/ui/visual-scope';
import {sphereHub} from '../../src/ui/golden-spin/hub-motion';
import FreeHub from './FreeHub.vue';
export type HubMode='baseline'|'soft'|'recall';
interface HubSnapshot {phase:string;frames:number;settled:boolean;reduced:boolean;held:boolean;x:number;y:number}
/** Isolated consumer adaptation, using real Host/View and sphere rendering, not a second public protocol. */
export function hubStudy(host:Host,mode:Exclude<HubMode,'baseline'>){
 const scope=visualScope(),owner=host.register('Evo42ResearchHub');let mount:Readonly<MountHandle>|undefined,api:(ComponentPublicInstance&{snapshot:()=>HubSnapshot})|undefined;
 const game=()=>Reflect.get(window,'DoLGameUI') as {openSettings():void;ui:{openInspector():void}};
 const native=(name:string)=>{const buttons=[...document.querySelectorAll<HTMLButtonElement>('#overlayButtons button')].filter(b=>b.textContent?.trim()===name);if(buttons.length!==1||buttons[0]!.disabled)return '原入口当前不可用';buttons[0]!.click()};
 const actions:Record<string,()=>string|void>={};
 for(const [id,title,action]of [['interface-settings','界面设置',()=>game().openSettings()],['runtime-inspector','运行检查',()=>game().ui.openInspector()],['native-saves','存档',()=>native('存档')],['native-social','社交',()=>native('社交')],['native-attributes','属性',()=>native('属性')]] as const){
  actions[`Evo42ResearchHub:${id}`]=action;scope.own(owner.provideView({id,title,setup(context){const button=document.createElement('button');button.textContent=title;button.onclick=()=>{if(context.isCurrent())action()};context.element.append(button);return()=>{button.onclick=null}}}));
 }
 const floating=()=>Reflect.get(window,'DoLFloatingTools') as {getPreferences():{enabled:boolean;hidden:boolean;mode:'fan'|'grid'};hide():void};
 let layout='';
 function sync(){if(!scope.active())return;const p=floating().getPreferences();if(!p.enabled||p.hidden){mount?.dispose();mount=undefined;api=undefined;return}if(mount&&layout===p.mode)return;mount?.dispose();layout=p.mode;
  mount=owner.mount({id:'free-hub',parent:document.body,lifetime:'persistent',setup(context){
   const app=createApp(FreeHub,{host,hostContext:context,motionMode:mode,preferredMode:p.mode,officialPreferences:true,directActions:actions,experimentalMotion:(root:HTMLElement)=>{const sphere=sphereHub(root);return()=>sphere.destroy()},dismiss:()=>floating().hide()});
   app.config.errorHandler=e=>{console.error('[EVO42 research Hub]',e);context.fail()};api=app.mount(context.element) as typeof api;context.onCleanup(()=>{app.unmount();api=undefined});
  }});
 }
 document.addEventListener('dol-floating-change',sync);scope.own(()=>document.removeEventListener('dol-floating-change',sync));scope.own(()=>owner.dispose());sync();
 return{snapshot:()=>api?.snapshot(),dispose:scope.dispose};
}
