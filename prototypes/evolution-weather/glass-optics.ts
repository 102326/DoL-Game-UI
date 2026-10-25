import {weatherSurface,type Weather} from './renderer';
const canvas=document.querySelector('canvas'),sample=document.querySelector<HTMLElement>('#sample'),glass=document.querySelector('#glass'),pause=document.querySelector<HTMLButtonElement>('#pause'),toggle=document.querySelector<HTMLButtonElement>('#toggle');
if(!canvas||!sample||!glass||!pause||!toggle)throw Error('Missing glass optics controls');
const state:Weather={kind:'rain',night:false,rain:'heavy'};
const surface=weatherSurface(canvas,()=>state,new URLSearchParams(location.search).get('climate')==='1'?'glass-weather':new URLSearchParams(location.search).get('runoff')==='1'?'glass-runoff':new URLSearchParams(location.search).get('trail')==='natural'?'glass-natural':'glass');
Object.assign(window,{rainOptics:surface});
if(new URLSearchParams(location.search).has('climate')||new URLSearchParams(location.search).has('climate-controls')){
 const bar=document.createElement('div');
 for(const [label,kind,rain]of [['小雨','rain','light'],['常规雨','rain','normal'],['大雨','rain','heavy'],['强雨','rain','severe'],['雪天','snow','normal']] as const){
  const button=document.createElement('button');button.textContent=label;button.onclick=()=>{state.kind=kind;state.rain=rain;surface.refresh()};bar.append(button);
 }
 sample.before(bar);
}
document.querySelectorAll<HTMLButtonElement>('[data-bg]').forEach(button=>button.onclick=()=>{const bg=button.dataset.bg;if(bg!==undefined)sample.dataset.background=bg});
let paused=false,enabled=true;
pause.onclick=()=>{paused=!paused;surface.pause(paused);pause.textContent=paused?'继续动态':'静止观察'};
toggle.onclick=()=>{enabled=!enabled;glass.classList.toggle('no-displacement',!enabled);toggle.textContent=enabled?'关闭背景位移':'开启背景位移'};
window.addEventListener('pagehide',()=>surface.dispose(),{once:true});
