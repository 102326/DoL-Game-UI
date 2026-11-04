// Load the actual production styles; the preview define disables src/main's auto-start.
import '../../src/main';
import '../../src/theme/stone-free.css';
import '../../src/theme/dark-acrylic.css';
import '../../src/theme/kraft-work-pages.css';
import '../../src/theme/kraft-work-motion.css';
import '../../src/theme/navigation-material.css';
import {hubPreview} from '../evolution-integration/hub-preview';
import {createIndependentPreview} from '../evolution41-ui/independent';
import {materialStudy,type MaterialMode} from './material';
import {hubStudy,type HubMode} from './hub';
import {shopFixture} from './shop-fixture';
import {visualScope} from '../../src/ui/visual-scope';
import './style.css';

const query=new URLSearchParams(location.search),scope=visualScope();
const node=<T extends HTMLElement>(id:string)=>{const el=document.getElementById(id);if(!el)throw Error('Missing preview '+id);return el as T};
const materialPicker=node<HTMLSelectElement>('material'),motionPicker=node<HTMLSelectElement>('motion');
let material:MaterialMode=query.get('material')==='baseline'?'baseline':query.get('material')==='edge'?'edge':'force';
let motion:HubMode=query.get('motion')==='baseline'?'baseline':query.get('motion')==='recall'?'recall':'soft';
let rain=query.get('rain')!=='0',shopOwner:ReturnType<typeof shopFixture>|undefined,hubOwner:ReturnType<typeof hubStudy>|undefined,scene='home',disposed=false;
let sequenceAbort:AbortController|undefined;
function cancelSequence(){sequenceAbort?.abort();sequenceAbort=undefined}
const theme=Reflect.get(window,'DoLMidnightTheme') as NonNullable<Parameters<typeof import('../../src/theme/controller').startTheme>[0]>['DoLMidnightTheme'];
if(!theme)throw Error('Missing real settings owner');
const panels=createIndependentPreview();hubPreview.enableOfficialMotion();
const status=()=>{node('e42-status').textContent=`材质：${materialPicker.selectedOptions[0]?.textContent} / 操控：${motionPicker.selectedOptions[0]?.textContent} · 仅研究小样`};
function weather(){const source=Reflect.get(window,'Weather') as Record<string,unknown>;Object.assign(source,{name:rain?'rain':'clear',precipitation:rain?'rain':'none',precipitationIntensity:rain?1.7:0});node('rain').textContent=rain?'雨天：开启':'雨天：关闭';hubPreview.navigation.refresh()}
type Surface={node:HTMLElement;handle:HTMLElement;core?:HTMLElement;draggable:boolean;role:string;pseudo?:boolean;study?:ReturnType<typeof materialStudy>};
const surfaces=new Map<HTMLElement,Surface>();
function retireSurfaces(){for(const s of surfaces.values())s.study?.dispose();surfaces.clear()}
function sync(){if(disposed)return;
 const settings=document.querySelector<HTMLElement>('#dol-midnight-controls[open]>.dmt-settings-shell'),shop=document.querySelector<HTMLElement>('[data-sf-workspace=shop]');
 if(scene==='settings'&&!settings)scene='home';
 document.documentElement.dataset.e42Scene=scene;
 const targets:Surface[]=[];
 if(settings){const handle=settings.querySelector<HTMLElement>('.dmt-settings-header');if(handle)targets.push({node:settings,handle,draggable:true,role:'settings'})}
 if(shop){
  const layout=shop.querySelector<HTMLElement>('.dgshop-layout');
  if(layout&&!shop.classList.contains('dgshop-narrow')){const room=`${Math.max(160,innerHeight-layout.getBoundingClientRect().top-16)}px`;if(shop.style.getPropertyValue('--e42-shop-room')!==room)shop.style.setProperty('--e42-shop-room',room)}
  const toolbar=document.querySelector<HTMLElement>('.dgshop-toolbar'),header=shop.querySelector<HTMLElement>('.dgshop-native-header');
  if(toolbar)targets.push({node:toolbar.closest<HTMLElement>('.dgshop-host')!,handle:toolbar,draggable:false,role:'shop-toolbar'});
  if(header)targets.push({node:shop,handle:header,draggable:false,role:'shop-catalog'});
  const detail=shop.querySelector<HTMLElement>('.clothing-details'),handle=detail?.querySelector<HTMLElement>('.dgshop-detail-body h3');
  if(detail&&handle&&detail.getBoundingClientRect().height>10&&getComputedStyle(detail).display!=='none')targets.push({node:detail,handle,core:detail.querySelector<HTMLElement>('.dgshop-detail-body')??undefined,draggable:true,role:'shop-detail',pseudo:true});
 }
 for(const [node,s]of surfaces)if(!targets.some(t=>t.node===node&&t.handle===s.handle&&t.core===s.core)){s.study?.dispose();surfaces.delete(node)}
 for(const s of targets)if(!surfaces.has(s.node)){s.study=materialStudy(s.node,s.handle,material,s);surfaces.set(s.node,s)}
}
const resize=()=>scope.frame(sync);window.addEventListener('resize',resize);scope.own(()=>window.removeEventListener('resize',resize));
const changed=new MutationObserver(()=>scope.frame(sync));changed.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','data-sf-workspace','class']});scope.own(()=>changed.disconnect());
function setMaterial(value:MaterialMode){if(disposed)return;cancelSequence();material=value;materialPicker.value=value;retireSurfaces();sync();status()}
function setMotion(value:HubMode){if(disposed)return;cancelSequence();motion=value;motionPicker.value=value;hubOwner?.dispose();hubOwner=undefined;hubPreview.stop();if(motion==='baseline')hubPreview.remount();else hubOwner=hubStudy(hubPreview.host,motion);status()}
function close(inSequence=false){if(disposed)return;if(!inSequence)cancelSequence();const dialog=document.querySelector<HTMLDialogElement>('#dol-midnight-controls[open]');dialog?.querySelector<HTMLButtonElement>('.dmt-close')?.click();retireSurfaces();shopOwner?.dispose();shopOwner=undefined;panels.close();scene='home';scope.frame(sync)}
function openSettings(inSequence=false){if(disposed)return;if(!inSequence)cancelSequence();retireSurfaces();shopOwner?.dispose();shopOwner=undefined;panels.close();theme!.openSettings();scene='settings';scope.frame(sync)}
function openShop(inSequence=false){if(disposed)return;if(!inSequence)cancelSequence();close(true);panels.open('shop');shopOwner=shopFixture(()=>close());scene='shop';scope.frame(sync)}
materialPicker.onchange=()=>setMaterial(materialPicker.value as MaterialMode);motionPicker.onchange=()=>setMotion(motionPicker.value as HubMode);
node('recall').onclick=()=>document.querySelector<HTMLButtonElement>('[data-e42-recall]')?.click();
node('settings').onclick=()=>openSettings();node('shop').onclick=()=>openShop();node('hub').onclick=()=>hubPreview.floating.show();node('rain').onclick=()=>{cancelSequence();rain=!rain;weather()};
const manual=(event:PointerEvent)=>{if(event.isTrusted&&!(event.target instanceof Element&&event.target.closest('#sequence')))cancelSequence()};
document.addEventListener('pointerdown',manual,true);scope.own(()=>document.removeEventListener('pointerdown',manual,true));
const key=(event:KeyboardEvent)=>{if(event.isTrusted)cancelSequence();if(!event.altKey)return;const modes:Record<string,MaterialMode|undefined>={Digit0:'baseline',KeyA:'edge',KeyB:'force'};if(modes[event.code]){event.preventDefault();setMaterial(modes[event.code]!)}if(event.code==='KeyR'){event.preventDefault();rain=!rain;weather()}};
document.addEventListener('keydown',key,true);scope.own(()=>document.removeEventListener('keydown',key,true));
async function sequence(){if(disposed)return;cancelSequence();const controller=sequenceAbort=new AbortController();
 const wait=(ms:number)=>new Promise<boolean>(resolve=>{if(controller.signal.aborted){resolve(false);return}const done=(value:boolean)=>{clearTimeout(id);controller.signal.removeEventListener('abort',cancel);resolve(value)},cancel=()=>done(false),id=setTimeout(()=>done(true),ms);controller.signal.addEventListener('abort',cancel,{once:true})});
 try{close(true);openSettings(true);if(!await wait(900))return;
 document.querySelector<HTMLButtonElement>('#dol-midnight-controls [data-settings-category=material]')?.click();
 // Use the actual category buttons; no reconstructed settings markup.
 const buttons=[...document.querySelectorAll<HTMLButtonElement>('#dol-midnight-controls nav button')];buttons.find(b=>b.textContent?.trim()==='材质')?.click();if(!await wait(900))return;
 buttons.find(b=>b.textContent?.trim()==='阅读')?.click();if(!await wait(900))return;close(true);if(!await wait(500))return;openShop(true);if(!await wait(900))return;close(true);node('e42-status').textContent='同操作序列完成；没有购买、保存或游戏动作。';
 }finally{if(sequenceAbort===controller)sequenceAbort=undefined}
}
node('sequence').onclick=()=>{void sequence()};
function dispose(){if(disposed)return;cancelSequence();close();disposed=true;scope.dispose();retireSurfaces();shopOwner?.dispose();shopOwner=undefined;hubOwner?.dispose();hubOwner=undefined;delete document.documentElement.dataset.e42Scene;panels.dispose();hubPreview.dispose();for(const control of document.querySelectorAll<HTMLButtonElement|HTMLSelectElement>('.e42-review button,.e42-review select'))control.disabled=true;node('e42-status').textContent='研究资源已释放；刷新页面可重新进入。'}
node('retire').onclick=dispose;
const pagehide=(event:PageTransitionEvent)=>{if(!event.persisted)dispose()};window.addEventListener('pagehide',pagehide);scope.own(()=>window.removeEventListener('pagehide',pagehide));
setMaterial(material);setMotion(motion);weather();hubPreview.floating.show();scope.frame(sync);
Object.assign(window,{evo42:{openSettings,openShop,close,setMaterial,setMotion,setRain(value:boolean){if(disposed)return;cancelSequence();rain=value;weather()},sequence,dispose,snapshot:()=>({scene,disposed,material:[...surfaces.values()][0]?.study?.snapshot(),surfaces:[...surfaces.values()].map(s=>s.study?.snapshot()),shop:shopOwner?.snapshot(),hub:hubOwner?.snapshot(),weatherCanvases:document.querySelectorAll('.sf-weather-canvas').length,native:hubPreview.counts()})}});
if(query.get('scene')==='settings')openSettings();if(query.get('scene')==='shop')openShop();
