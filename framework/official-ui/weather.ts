import {ownedOverlaySelector} from '../../src/ui/owned-overlay';
import {visualScope} from '../../src/ui/visual-scope';
import {windowEnvironment} from './window-environment';
import type {SurfaceMotion,Host,Participant} from '../contracts';
import {sourceMotion} from '../../src/ui/source-motion';
import {isMaterialTransformMutation} from '../../src/ui/material-motion-style';
import {precipitationPhase} from '../motion/precipitation-phase';
type WeatherKind='clear'|'cloud'|'rain'|'snow'|'storm'|'fog'|'unknown';
type RainLevel='normal'|'light'|'heavy'|'severe';
export type WeatherSpecial='none'|'blood-moon'|'tentacle'|'heat'|'cold';
type GameWeather={name?:unknown;precipitation?:unknown;precipitationIntensity?:unknown;overcast?:unknown;fog?:unknown;enableLightning?:unknown;dayState?:unknown;bloodMoon?:unknown;temperature?:unknown;Temperature?:{isExtreme?:()=>unknown}};
type WeatherHost={Weather?:GameWeather;SugarCube?:{State?:{variables?:{location?:unknown}}}};

// Read only DoL's public weather getters; missing/throwing providers remain neutral.
export function readGameWeather(root:WeatherHost=window as Window & WeatherHost):{kind:WeatherKind;night:boolean;rain:RainLevel;special?:WeatherSpecial}{
 try{
  const w=root.Weather;if(!w)return{kind:'unknown',night:false,rain:'normal'};
  const {name,precipitation,overcast,fog,enableLightning,dayState,precipitationIntensity:intensity}=w,night=dayState==='night';
  const rain:RainLevel=typeof intensity==='number'&&Number.isFinite(intensity)&&intensity>0?(intensity>=2?'severe':intensity>=1.5?'heavy':'light'):'normal';
  let kind:WeatherKind='unknown';
  if(precipitation==='snow')kind='snow';
  else if(precipitation==='rain')kind=enableLightning===true||name==='storm'||name==='thunderstorm'?'storm':'rain';
  else if(precipitation==='none'){
   if(typeof fog==='number'&&Number.isFinite(fog)&&fog>=.45)kind='fog';
   else if(name==='heavyClouds'||typeof overcast==='number'&&Number.isFinite(overcast)&&overcast>.5)kind='cloud';
   else if(name==='clear'||name==='lightClouds')kind='clear';
  }
  let special:WeatherSpecial='none';
  // Native special skies are independent of precipitation; a blood moon can still rain.
  try{
   if(root.SugarCube?.State?.variables?.location==='tentworld')special='tentacle';
   else if(w.bloodMoon===true)special='blood-moon';
   else if(kind!=='unknown'&&w.Temperature?.isExtreme?.()===true&&typeof w.temperature==='number'&&Number.isFinite(w.temperature))special=w.temperature<=-18?'cold':w.temperature>30?'heat':'none';
  }catch{/* An unavailable special getter must not discard otherwise valid weather. */}
  return{kind,night,rain,special};
 }catch{return{kind:'unknown',night:false,rain:'normal'}}
}

export function headerWeather(phase=precipitationPhase(),environment?:SurfaceMotion,owner?:Participant,drift?:NonNullable<Host['layerPresets']>['driftingTexture']){
 type Shell={header:HTMLElement;parent:HTMLElement;stopWatch?:()=>void;syncHeader?:()=>void};
 type Legacy=Shell & {material:false;node:HTMLElement;key:string;revision:number;fade?:ReturnType<SurfaceMotion['track']>};
 type Surface=Legacy | (Shell & {material:true;effect:ReturnType<typeof windowEnvironment>});
 const scope=visualScope(),surfaces=new Map<string,Surface>(),motion=environment?undefined:sourceMotion();scope.own(()=>motion?.dispose());let stopTimer:(()=>void)|undefined,state=readGameWeather(),foreground:HTMLElement|null=null;
 function syncPhase(immediate:boolean){
  phase.set(state.kind==='snow'?'snow':state.kind==='rain'||state.kind==='storm'?'rain':'sunny',immediate);
 }
 syncPhase(true);
 const visible=(n:HTMLElement)=>n.isConnected&&!!n.getClientRects().length&&!n.closest('.hidden,[hidden],[inert],[data-sf-leaving]');
 function clean(tasks:Array<()=>void>){const errors:unknown[]=[];for(const task of tasks)try{task()}catch(error){errors.push(error)}if(errors.length)throw new AggregateError(errors,'Weather cleanup failed')}
 function remove(key:string){
  const s=surfaces.get(key);if(!s)return;
  surfaces.delete(key);
  const tasks:Array<()=>void>=[];
  if(s.material)tasks.push(s.effect.dispose);
  else{
   s.revision++;
   tasks.push(()=>s.fade?.release(),()=>motion?.cancel(s.node),()=>s.node.remove());
  }
  tasks.push(()=>s.stopWatch?.(),()=>{if(!surfaces.size){const stop=stopTimer;stopTimer=undefined;stop?.()}});
  clean(tasks);
 }
 function clear(){clean([...surfaces.keys()].map(key=>()=>remove(key)))}
 // Keep legacy CSS peers on their established shared update contract; only
 // material surfaces suspend behind an owned modal.
 const showing=(s:Surface)=>visible(s.header)&&(!s.material||(!foreground||foreground===s.parent||foreground.contains(s.parent))&&s.parent.clientWidth>0&&s.parent.clientHeight>0);
 const headerRegions=':scope>.dgc-host,:scope>.dgs-host,:scope>.dgp-host,.modhub-sticky-toolbar,.CE-category-bar,.CE-subtab-bar';
 function fitHeader(s:Legacy){
  const base=s.parent.getBoundingClientRect(),scale=base.height/s.parent.offsetHeight;if(!Number.isFinite(scale)||scale<=0)return;
  const regions=[s.header,...s.parent.querySelectorAll(headerRegions)].filter(n=>n.getClientRects().length);
  const height=Math.min(s.parent.clientHeight,Math.max(...regions.map(n=>(n.getBoundingClientRect().bottom-base.top)/scale-s.parent.clientTop))+48),value=height+'px';
  if(s.node.style.height!==value)s.node.style.height=value;
 }
 function paint(s:Legacy,state:ReturnType<typeof readGameWeather>){
  const key=state.kind+':'+state.night+':'+state.rain+':'+state.special;if(s.key===key)return;s.key=key;const revision=++s.revision,opacity=parseFloat(getComputedStyle(s.node).opacity);s.fade?.release();motion?.cancel(s.node);
  function transition(shown:boolean,peak:number){
   if(!environment)return motion?.animate(s.node,shown?[{opacity:0},{opacity:peak}]:[{opacity:peak},{opacity:0}],shown?480:180);
   if(!document.documentElement.hasAttribute('data-dgu-visualMotion')||!(peak>0))return;
   s.fade?.release();
   s.fade=environment.track([{opacity:0},{opacity:peak}],480,180);
   return s.fade.to(s.node,shown);
  }
  const apply=()=>{if(!scope.active()||s.revision!==revision||!s.node.isConnected)return;s.node.dataset.weather=state.kind;s.node.dataset.rain=state.rain;s.node.dataset.special=state.special??'none';s.node.toggleAttribute('data-night',state.night);if(state.kind!=='unknown'||state.special&&state.special!=='none')transition(true,parseFloat(getComputedStyle(s.node).opacity))};
  // Retire the old paint before changing it; never keep two particle systems alive.
  const exit=s.node.dataset.weather&&s.node.dataset.weather!=='unknown'?transition(false,opacity):undefined;
  if(exit)void exit.finished.then(apply,apply);else apply();
 }
 function refresh(){
  foreground=document.querySelector<HTMLElement>('dialog#dol-midnight-controls:modal,dialog[data-sf-workspace]:modal');
  stopTimer?.();stopTimer=undefined;if(!scope.active()||!surfaces.size)return;
  if(document.hidden){for(const s of surfaces.values()){if(s.material)s.effect.pause()}return}
  const shown=new Set([...surfaces.values()].filter(showing));
  if(shown.size){state=readGameWeather();syncPhase(false)}
  for(const[key,s]of surfaces){
   if(!shown.has(s)){
    if(s.material&&s.header.closest('dialog[open][data-sf-leaving]'))continue;
    if(s.material&&s.header.isConnected&&s.parent.isConnected&&!s.header.closest('[data-sf-leaving],dialog:not([open])')){
     s.effect.sync(false);
     continue;
    }
    remove(key);continue;
   }
   if(!s.material)paint(s,state);
  }
  // Release hidden peers before asking for the environment slot, in either registration order.
  for(const s of shown)if(s.material)s.effect.sync(true);
  if(shown.size)stopTimer=scope.timeout(refresh,[...shown].some(s=>s.material)?500:2000);
 }
 function set(key:string,header?:HTMLElement,parent?:HTMLElement){
  if(!scope.active())return;const old=surfaces.get(key);
  const html=document.documentElement;
  if(html.hasAttribute('data-dgu-weather-off')||owner&&drift&&!html.hasAttribute('data-dgu-visualGlass')){remove(key);return}
  // The still-open modal keeps its own texture during a reversible exit.
  if(!header&&old?.material&&old.header.closest('dialog[open][data-sf-leaving]'))return;
  const material=key==='settings'||!!parent?.matches('html[data-stone-free][data-dol-midnight][data-dgu-acrylic-adjustment] :is('+ownedOverlaySelector+',.passage.dgp-overlay:has(>.dgp-host),[data-sf-workspace])');
  if(old&&(old.header!==header||old.parent!==parent||old.material!==material))remove(key);
  const liveSettings=material&&header?.isConnected&&parent?.isConnected&&!header.closest('[data-sf-leaving],dialog:not([open])');
  if(!header||!parent||!visible(header)&&!liveSettings){remove(key);return}
  if(!surfaces.has(key)){
   // A change during an unobserved interval has no known transition start.
   if(!surfaces.size){state=readGameWeather();syncPhase(true)}
   if(material){
    const s:Surface={header,parent,material:true,effect:windowEnvironment(parent,key,()=>state,phase.sample,drift ? owner : undefined,drift)};
    surfaces.set(key,s);
    try{
     const watch=visualScope();s.stopWatch=scope.own(()=>watch.dispose());const wake=()=>{if(scope.active()&&surfaces.get(key)===s)refresh()};
     const resize=new ResizeObserver(wake);watch.own(()=>resize.disconnect());resize.observe(parent);
     const change=new MutationObserver(records=>{if(records.some(record=>!isMaterialTransformMutation(record)))wake()});
     watch.own(()=>change.disconnect());
     for(const node of new Set([header,parent,parent.closest('dialog')].filter((n):n is HTMLElement=>!!n))){
      change.observe(node,{attributes:true,attributeOldValue:true,attributeFilter:['style','class','hidden','open','inert','data-dgu-material-moving']});
     }
    }catch(error){remove(key);throw error}return;
   }
   const node=document.createElement('span');node.className='kw-heading-weather';node.setAttribute('aria-hidden','true');const lightning=document.createElement('span');lightning.className='kw-weather-lightning';const atmosphere=document.createElement('span');atmosphere.className='kw-weather-atmosphere';const shower=document.createElement('span');shower.className='kw-weather-shower';node.append(shower,lightning,atmosphere);
   // Sample once per window: bounded, staggered droplets, with no per-frame game reads.
   for(let i=0;i<18;i++){
    const drop=document.createElement('i');drop.className='kw-glass-drop';
    for(const[key,value]of Object.entries({'--kw-x':(3+i*37%91+Math.random()*3)+'%','--kw-y':(3+i*13%35+Math.random()*7)+'%','--kw-size':(3.5+i%4*.9+Math.random()*.7)+'px','--kw-travel':(70+Math.random()*110)+'px','--kw-trail':(18+Math.random()*24)+'px','--kw-duration':(7+Math.random()*9)+'s','--kw-delay':(-Math.random()*16)+'s'}))drop.style.setProperty(key,value);
    node.append(drop);
   }
   node.style.height='0px';parent.append(node);const s:Surface={header,parent,node,key:'',revision:0,material:false};surfaces.set(key,s);
   // Measure after native layout, and only when the actual header regions change.
   const fit=()=>{if(scope.active()&&surfaces.get(key)===s)fitHeader(s)},resize=new ResizeObserver(()=>scope.frame(fit));let regions:Element[]=[];
   s.syncHeader=()=>{const next=[header,...parent.querySelectorAll(headerRegions)];if(next.length===regions.length&&next.every((n,i)=>n===regions[i]))return;resize.disconnect();resize.observe(parent);for(const n of next)resize.observe(n);regions=next;scope.frame(fit)};
   s.stopWatch=()=>{scope.cancelFrame(fit);resize.disconnect()};
  }
  surfaces.get(key)?.syncHeader?.();
 }
 // Resume on a fresh document timeline; visibilitychange may still see the last visible frame.
 const visibilityChanged=()=>{if(document.hidden){scope.cancelFrame(refresh);refresh()}else scope.frame(refresh)};
 document.addEventListener('visibilitychange',visibilityChanged);scope.own(()=>document.removeEventListener('visibilitychange',visibilityChanged));
 return{set,refresh,snapshot:()=>({activePolls:stopTimer?1:0,surfaces:[...surfaces].map(([id,s])=>({id,...(s.material?s.effect.snapshot():{material:'legacy',state:undefined})}))}),clear,dispose(){clean([()=>scope.dispose(),clear])}};
}
