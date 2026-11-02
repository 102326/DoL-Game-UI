import {ownedOverlaySelector} from '../../src/ui/owned-overlay';
import {visualScope} from '../../src/ui/visual-scope';
import {sourceMotion} from '../../src/ui/source-motion';
import {settingsWeather} from '../../src/ui/weather/settings';
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

export function headerWeather(){
 type Surface={header:HTMLElement;parent:HTMLElement;node:HTMLElement;key:string;revision:number;material:boolean;renderer?:ReturnType<typeof settingsWeather>;materialAttribute?:string|null;static?:boolean;suspended?:boolean;stopWatch?:()=>void;syncHeader?:()=>void};
 const scope=visualScope(),surfaces=new Map<string,Surface>(),motion=sourceMotion();scope.own(()=>motion.dispose());let stopTimer:(()=>void)|undefined,state=readGameWeather(),foreground:HTMLElement|null=null;
 const visible=(n:HTMLElement)=>n.isConnected&&!!n.getClientRects().length&&!n.closest('.hidden,[hidden],[inert],[data-sf-leaving]');
 function clean(tasks:Array<()=>void>){const errors:unknown[]=[];for(const task of tasks)try{task()}catch(error){errors.push(error)}if(errors.length)throw new AggregateError(errors,'Weather cleanup failed')}
 function remove(key:string){const s=surfaces.get(key);if(!s)return;surfaces.delete(key);s.revision++;clean([()=>motion.cancel(s.node),()=>s.renderer?.dispose(),()=>s.stopWatch?.(),()=>s.node.remove(),()=>{if(s.materialAttribute!==undefined){if(s.materialAttribute===null)s.parent.removeAttribute('data-sf-weather-material');else s.parent.setAttribute('data-sf-weather-material',s.materialAttribute)}},()=>{if(!surfaces.size){const stop=stopTimer;stopTimer=undefined;stop?.()}}])}
 function clear(){clean([...surfaces.keys()].map(key=>()=>remove(key)))}
 // Keep legacy CSS peers on their established shared update contract; only
 // complete Canvas renderers suspend behind an owned modal.
 const showing=(s:Surface)=>visible(s.header)&&(!s.renderer||(!foreground||foreground===s.parent||foreground.contains(s.parent))&&s.parent.clientWidth>0&&s.parent.clientHeight>0);
 const headerRegions=':scope>.dgc-host,:scope>.dgs-host,:scope>.dgp-host,.modhub-sticky-toolbar,.CE-category-bar,.CE-subtab-bar';
 function fitHeader(s:Surface){
  if(s.renderer||s.static)return;
  const base=s.parent.getBoundingClientRect(),scale=base.height/s.parent.offsetHeight;if(!Number.isFinite(scale)||scale<=0)return;
  const regions=[s.header,...s.parent.querySelectorAll(headerRegions)].filter(n=>n.getClientRects().length);
  const height=Math.min(s.parent.clientHeight,Math.max(...regions.map(n=>(n.getBoundingClientRect().bottom-base.top)/scale-s.parent.clientTop))+48),value=height+'px';
  if(s.node.style.height!==value)s.node.style.height=value;
 }
 function paint(s:Surface,state:ReturnType<typeof readGameWeather>){
  const key=state.kind+':'+state.night+':'+state.rain+':'+state.special;if(s.key===key)return;s.key=key;const revision=++s.revision,opacity=parseFloat(getComputedStyle(s.node).opacity);motion.cancel(s.node);
  const apply=()=>{if(!scope.active()||s.revision!==revision||!s.node.isConnected)return;s.node.dataset.weather=state.kind;s.node.dataset.rain=state.rain;s.node.dataset.special=state.special??'none';s.node.toggleAttribute('data-night',state.night);if(state.kind!=='unknown'||state.special&&state.special!=='none')motion.animate(s.node,[{opacity:0},{opacity:parseFloat(getComputedStyle(s.node).opacity)}],480)};
  // Retire the old paint before changing it; never keep two particle systems alive.
  const exit=s.node.dataset.weather&&s.node.dataset.weather!=='unknown'?motion.animate(s.node,[{opacity},{opacity:0}],180):undefined;
  if(exit)void exit.finished.then(apply,apply);else apply();
 }
 function refresh(){
  foreground=document.querySelector<HTMLElement>('dialog#dol-midnight-controls:modal,dialog[data-sf-workspace]:modal');
  stopTimer?.();stopTimer=undefined;if(!scope.active()||!surfaces.size||document.hidden)return;
  if([...surfaces.values()].some(showing))state=readGameWeather();
  for(const[key,s]of surfaces){if(!showing(s)){
    // A still-open settings owner can regain geometry without a new navigation intent.
    if(s.renderer&&s.header.isConnected&&s.parent.isConnected&&!s.header.closest('[data-sf-leaving],dialog:not([open])')){if(!s.suspended){s.suspended=true;s.renderer.pause(true)}continue}
    remove(key);continue;
   }if(s.renderer){if(s.suspended){s.suspended=false;s.renderer.pause(false)}s.node.dataset.weather=state.kind;s.node.dataset.rain=state.rain;s.node.dataset.special=state.special??'none';s.renderer.refresh()}else if(!s.static)paint(s,state)}
  // One shared low-frequency read, only while an owned header and document are visible.
  if([...surfaces.values()].some(showing)&&!document.hidden)stopTimer=scope.timeout(refresh,[...surfaces.values()].some(s=>s.renderer)?500:2000);
 }
 function set(key:string,header?:HTMLElement,parent?:HTMLElement){
  if(!scope.active())return;const old=surfaces.get(key);
  const material=key==='settings'||!!parent?.matches('html[data-stone-free][data-dol-midnight][data-dgu-acrylic-adjustment] :is('+ownedOverlaySelector+',.passage.dgp-overlay:has(>.dgp-host),[data-sf-workspace])');
  if(old&&(old.header!==header||old.parent!==parent||old.material!==material))remove(key);
  const liveSettings=material&&header?.isConnected&&parent?.isConnected&&!header.closest('[data-sf-leaving],dialog:not([open])');
  if(!header||!parent||!visible(header)&&!liveSettings){remove(key);return}
  if(!surfaces.has(key)){
   if(material){
    const canvas=document.createElement('canvas');canvas.className='sf-weather-canvas';canvas.setAttribute('aria-hidden','true');parent.prepend(canvas);
    const s:Surface={header,parent,node:canvas,key:'',revision:0,material,materialAttribute:parent.getAttribute('data-sf-weather-material')};
    // Establish absolute positioning before the material measures text/control geometry.
    parent.setAttribute('data-sf-weather-material','');
    try{s.renderer=settingsWeather(canvas,()=>state)}
    catch(error){canvas.remove();if(s.materialAttribute===null)parent.removeAttribute('data-sf-weather-material');else parent.setAttribute('data-sf-weather-material',s.materialAttribute!);s.static=true;console.warn('Window weather unavailable; keeping static Acrylic',error)}
    surfaces.set(key,s);
    if(s.renderer){
     const watch=visualScope();s.stopWatch=scope.own(()=>watch.dispose());const wake=()=>{if(scope.active()&&surfaces.get(key)===s)refresh()};
     try{const resize=new ResizeObserver(wake);watch.own(()=>resize.disconnect());resize.observe(parent);const change=new MutationObserver(wake);watch.own(()=>change.disconnect());for(const node of new Set([header,parent,parent.closest('dialog')].filter((n):n is HTMLElement=>!!n)))change.observe(node,{attributes:true,attributeFilter:['style','class','hidden','open','inert']})}
     catch(error){remove(key);throw error}
    }return;
   }
   const node=document.createElement('span');node.className='kw-heading-weather';node.setAttribute('aria-hidden','true');const lightning=document.createElement('span');lightning.className='kw-weather-lightning';const atmosphere=document.createElement('span');atmosphere.className='kw-weather-atmosphere';const shower=document.createElement('span');shower.className='kw-weather-shower';node.append(shower,lightning,atmosphere);
   // Sample once per window: bounded, staggered droplets, with no per-frame game reads.
   for(let i=0;i<18;i++){
    const drop=document.createElement('i');drop.className='kw-glass-drop';
    for(const[key,value]of Object.entries({'--kw-x':(3+i*37%91+Math.random()*3)+'%','--kw-y':(3+i*13%35+Math.random()*7)+'%','--kw-size':(3.5+i%4*.9+Math.random()*.7)+'px','--kw-travel':(70+Math.random()*110)+'px','--kw-trail':(18+Math.random()*24)+'px','--kw-duration':(7+Math.random()*9)+'s','--kw-delay':(-Math.random()*16)+'s'}))drop.style.setProperty(key,value);
    node.append(drop);
   }
   node.style.height='0px';parent.append(node);const s:Surface={header,parent,node,key:'',revision:0,material};surfaces.set(key,s);
   // Measure after native layout, and only when the actual header regions change.
   const fit=()=>{if(scope.active()&&surfaces.get(key)===s)fitHeader(s)},resize=new ResizeObserver(()=>scope.frame(fit));let regions:Element[]=[];
   s.syncHeader=()=>{const next=[header,...parent.querySelectorAll(headerRegions)];if(next.length===regions.length&&next.every((n,i)=>n===regions[i]))return;resize.disconnect();resize.observe(parent);for(const n of next)resize.observe(n);regions=next;scope.frame(fit)};
   s.stopWatch=()=>{scope.cancelFrame(fit);resize.disconnect()};
  }
  surfaces.get(key)?.syncHeader?.();
 }
 document.addEventListener('visibilitychange',refresh);scope.own(()=>document.removeEventListener('visibilitychange',refresh));
 return{set,refresh,snapshot:()=>({activePolls:stopTimer?1:0,surfaces:[...surfaces].map(([id,s])=>({id,material:s.renderer?'glass-scatter':s.static?'static':'legacy',state:s.renderer?.snapshot()}))}),clear,dispose(){clean([()=>scope.dispose(),clear])}};
}
