import {visualScope} from '../../src/ui/visual-scope';
import {sourceMotion} from '../../src/ui/source-motion';
type WeatherKind='clear'|'cloud'|'rain'|'snow'|'storm'|'fog'|'unknown';
type RainLevel='normal'|'light'|'heavy'|'severe';
type GameWeather={name?:unknown;precipitation?:unknown;precipitationIntensity?:unknown;overcast?:unknown;fog?:unknown;enableLightning?:unknown;dayState?:unknown};

// Read only DoL's public weather getters; missing/throwing providers remain neutral.
export function readGameWeather(root:{Weather?:GameWeather}=window as Window & {Weather?:GameWeather}):{kind:WeatherKind;night:boolean;rain:RainLevel}{
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
  return{kind,night,rain};
 }catch{return{kind:'unknown',night:false,rain:'normal'}}
}

export function headerWeather(){
 type Surface={header:HTMLElement;parent:HTMLElement;node:HTMLElement;key:string;revision:number};
 const scope=visualScope(),surfaces=new Map<string,Surface>(),motion=sourceMotion();scope.own(()=>motion.dispose());let stopTimer:(()=>void)|undefined;
 const visible=(n:HTMLElement)=>n.isConnected&&!!n.getClientRects().length&&!n.closest('.hidden,[hidden],[inert],[data-sf-leaving]');
 function remove(key:string){const s=surfaces.get(key);if(!s)return;s.revision++;motion.cancel(s.node);s.node.remove();surfaces.delete(key);if(!surfaces.size){stopTimer?.();stopTimer=undefined}}
 function paint(s:Surface,state:ReturnType<typeof readGameWeather>){
  const key=state.kind+':'+state.night+':'+state.rain;if(s.key===key)return;s.key=key;const revision=++s.revision,opacity=parseFloat(getComputedStyle(s.node).opacity);motion.cancel(s.node);
  const apply=()=>{if(!scope.active()||s.revision!==revision||!s.node.isConnected)return;s.node.dataset.weather=state.kind;s.node.dataset.rain=state.rain;s.node.toggleAttribute('data-night',state.night);if(state.kind!=='unknown')motion.animate(s.node,[{opacity:0},{opacity:parseFloat(getComputedStyle(s.node).opacity)}],480)};
  // Retire the old paint before changing it; never keep two particle systems alive.
  const exit=s.node.dataset.weather&&s.node.dataset.weather!=='unknown'?motion.animate(s.node,[{opacity},{opacity:0}],180):undefined;
  if(exit)void exit.finished.then(apply,apply);else apply();
 }
 function refresh(){
  stopTimer?.();stopTimer=undefined;if(!scope.active()||!surfaces.size||document.hidden)return;
  const state=readGameWeather();
  for(const[key,s]of surfaces){if(!visible(s.header)){remove(key);continue}paint(s,state)}
  // One shared low-frequency read, only while an owned header and document are visible.
  if(surfaces.size&&!document.hidden)stopTimer=scope.timeout(refresh,2000);
 }
 function set(key:string,header?:HTMLElement,parent?:HTMLElement){
  if(!scope.active())return;const old=surfaces.get(key);
  if(old&&(old.header!==header||old.parent!==parent))remove(key);
  if(!header||!parent||!visible(header)){remove(key);return}
  if(!surfaces.has(key)){
   const node=document.createElement('span');node.className='kw-heading-weather';node.setAttribute('aria-hidden','true');const lightning=document.createElement('span');lightning.className='kw-weather-lightning';node.append(lightning);
   // Sample once per window: bounded, staggered droplets, with no per-frame game reads.
   for(let i=0;i<18;i++){
    const drop=document.createElement('i');drop.className='kw-glass-drop';
    for(const[key,value]of Object.entries({'--kw-x':(3+i*37%91+Math.random()*3)+'%','--kw-y':(3+i*13%35+Math.random()*7)+'%','--kw-size':(3.5+i%4*.9+Math.random()*.7)+'px','--kw-travel':(70+Math.random()*110)+'px','--kw-trail':(18+Math.random()*24)+'px','--kw-duration':(7+Math.random()*9)+'s','--kw-delay':(-Math.random()*16)+'s'}))drop.style.setProperty(key,value);
    node.append(drop);
   }
   parent.append(node);surfaces.set(key,{header,parent,node,key:'',revision:0});
  }
 }
 document.addEventListener('visibilitychange',refresh);scope.own(()=>document.removeEventListener('visibilitychange',refresh));
 return{set,refresh,clear(){for(const key of surfaces.keys())remove(key)},dispose(){scope.dispose();for(const key of surfaces.keys())remove(key)}};
}
