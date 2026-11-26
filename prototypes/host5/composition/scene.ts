import type {Participant} from '../../../framework/contracts';
import {createHost} from '../../../framework/host';
import {surface as material} from '../../../framework/materials/acrylic-scrim';
import {createPanelBudget,surfaceMotion} from '../../../framework/motion/panel-budget';
import {sourceMotion} from '../../../src/ui/source-motion';
import {cloudTexture} from './cloud';

const stage=document.querySelector<HTMLElement>('#stage')!, toggle=document.querySelector<HTMLButtonElement>('#toggle')!,
 weather=document.querySelector<HTMLButtonElement>('#weather')!, fx=document.querySelector<HTMLButtonElement>('#fx')!;
const integrated=new URLSearchParams(location.search).get('play')!=='independent';
const foreground=createPanelBudget(window), atmosphere=createPanelBudget(window,2);
const host=Object.freeze({...createHost(window,{surface:material}),panelEffects:surfaceMotion(foreground)});
const preference=matchMedia('(prefers-reduced-motion: reduce)');
let effects=true,cloudy=false,shown=false;
const enabled=()=>effects&&!preference.matches&&!document.hidden;

// Control condition: each change samples the old timeline and allocates a new animation.
function independent(motion:ReturnType<typeof sourceMotion>,frames:Keyframe[],duration:number){
 let a:Animation|undefined;
 function cancel(){a?.cancel();a=undefined}
 return {to(node:HTMLElement,forward:boolean,initial=forward?0:1){
  const t=a && a.playState!=='idle' ? Math.min(1,Math.max(0,Number(a.currentTime)/duration)) : initial;
  cancel();if(t===Number(forward))return;
  const anim=motion.animate(node,frames,duration,'linear');if(!anim)return;
  a=anim;anim.currentTime=t*duration;anim.playbackRate=forward?1:-1;
  return anim;
 },release:cancel,cancel};
}
type TrackFactory=(frames:Keyframe[],duration:number)=>{to(node:HTMLElement,shown:boolean,initial?:number): {readonly finished: Promise<unknown>} | undefined; cancel():void; release():void};
function surface(id:string,kind:string,play: TrackFactory,setup:(el:HTMLElement,own:(fn:()=>void)=>void,track:TrackFactory,owner?:Readonly<Participant>)=>void){
 if(integrated){
  const owner=host.register(id);
  try{owner.mount({id:'surface',parent:stage,lifetime:'persistent',setup(c){c.element.className=kind;setup(c.element,c.onCleanup,play,owner)}})}
  catch(e){owner.dispose();throw e}
  return owner.dispose;
 }
 const el=document.createElement('div'),cleanup:(()=>void)[]=[];el.className=kind;stage.append(el);
 const motion=sourceMotion();cleanup.push(motion.dispose);
 setup(el,fn=>cleanup.push(fn),(frames,ms)=>independent(motion,frames,ms));return ()=>{cleanup.splice(0).reverse().forEach(fn=>fn());el.remove()};
}
let refreshSky=()=>{},refreshPanel=()=>{},changeWeather=()=>{},changePanel=()=>{};
function mountSky(){
 return surface('CloudField','sky',(frames,ms)=>atmosphere.track(frames,ms,ms),(el,own,localTrack)=>{
  const drift=document.createElement('div'),dense=document.createElement('div'),texture=cloudTexture();
  drift.className='drift';dense.className='dense';drift.append(texture,dense);el.append(drift);
  const travel=localTrack([{transform:'translateX(-10%)'},{transform:'translateX(10%)'}],8800);
  const blend=localTrack([{opacity:0},{opacity:1}],480);
  let generation=0;
  function leg(forward:boolean,token:number){
   if(token!==generation||!enabled())return;
   const a=travel.to(drift,forward);
   if(a)void a.finished.then(()=>{if(generation===token){travel.cancel();leg(!forward,token)}},()=>{});
  }
  changeWeather=()=>{
   const active=dense.getAnimations().length>0;
   const previous=Number(getComputedStyle(dense).opacity);
   dense.style.opacity=String(Number(cloudy));
   if(enabled())blend.to(dense,cloudy,active?undefined:previous);
  };
  refreshSky=()=>{generation++;travel.cancel();blend.cancel();dense.style.opacity=String(Number(cloudy));leg(true,generation)};
  refreshSky();
  own(()=>{generation++;travel.release();blend.release();texture.width=texture.height=0;refreshSky=changeWeather=()=>{}});
 });
}
function mountPanel(){
 return surface('ControlPanel','panel',(frames,ms)=>host.panelEffects.track(frames,ms,ms),(el,own,localTrack,owner)=>{
  el.innerHTML='<h2>显示设置</h2><div class="signal"></div><label><input type="checkbox">增强对比度</label>';
  const signal=el.querySelector<HTMLElement>('.signal')!;
  // The shell and controls appear synchronously. A separate decorative layer can reverse.
  const track=localTrack([{transform:'scaleX(.12)'},{transform:'scaleX(1)'}],150);
  if(owner){
   owner.mount({id:'scrim',parent:el,lifetime:'persistent',setup:material.setup('acrylic')});
  }else{
   const material=document.createElement('div');
   material.inert=true;material.style.cssText='position:absolute;inset:0;z-index:-1;border-radius:inherit;pointer-events:none;background:var(--sf-scrim-tint);backdrop-filter:blur(var(--sf-scrim-blur))';
   el.prepend(material);
  }
  let ticket=0;
  refreshPanel=()=>{ticket++;track.cancel();el.hidden=!shown;el.style.setProperty('--sf-scrim-blur',enabled()?'8px':'0px')};
  changePanel=()=>{
   const current=++ticket;el.hidden=false;
   const a=enabled()?track.to(signal,shown):undefined;
   const finish=()=>{if(current===ticket)el.hidden=!shown};
   if(a)void a.finished.then(finish,finish);else finish();
  };
  refreshPanel();
  own(()=>{ticket++;track.release();refreshPanel=changePanel=()=>{}});
 });
}
let dropSky:(()=>void)|undefined,dropPanel:(()=>void)|undefined;
function sky(on:boolean){if(on)dropSky??=mountSky();else{dropSky?.();dropSky=undefined}weather.disabled=!on}
function panel(on:boolean){if(on)dropPanel??=mountPanel();else{dropPanel?.();dropPanel=undefined}toggle.disabled=!on}
function refresh(){refreshSky();refreshPanel()}
sky(true);panel(true);
toggle.onclick=()=>{shown=!shown;toggle.setAttribute('aria-expanded',String(shown));toggle.textContent=shown?'收起面板':'打开面板';changePanel()};
weather.onclick=()=>{cloudy=!cloudy;weather.setAttribute('aria-pressed',String(cloudy));changeWeather()};
fx.onclick=()=>{effects=!effects;fx.setAttribute('aria-pressed',String(effects));fx.textContent=effects?'效果开启':'效果关闭';refresh()};
preference.addEventListener('change',refresh);document.addEventListener('visibilitychange',refresh);
// The legacy control cancels on resize. Host tracks use relative geometry and CSS reflows each surface in place.
let resize=0;const resized=()=>{cancelAnimationFrame(resize);resize=requestAnimationFrame(refresh)};
if(!integrated)window.addEventListener('resize',resized);
const scene={sky,panel,counts:()=>({tracks:foreground.activeCount()+atmosphere.activeCount(),mounts:host.getDiagnostics().mounts.length,participants:host.getDiagnostics().participants.length}),
 dispose(){cancelAnimationFrame(resize);window.removeEventListener('resize',resized);document.removeEventListener('visibilitychange',refresh);preference.removeEventListener('change',refresh);sky(false);panel(false);foreground.dispose();atmosphere.dispose();host.dispose();toggle.onclick=weather.onclick=fx.onclick=null}};
declare global{interface Window{composition:typeof scene}}
window.composition=scene;
