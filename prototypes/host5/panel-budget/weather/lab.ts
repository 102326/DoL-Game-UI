import {createHost} from '../../../../framework/host';
import {createPanelBudget} from '../../../../framework/motion/panel-budget';
import {startTheme} from '../../../../src/theme/controller';
import {attachInspector} from '../independent';

const mode = new URLSearchParams(location.search).get('mode') ?? 'A';
if (!['A','B','C'].includes(mode)) throw Error('Unknown condition');
const shared = createPanelBudget(window), direct = createPanelBudget(window);
let click: Event | undefined, lastGrant = false;
const start = document.querySelector<HTMLButtonElement>('#start')!;
const inspector = document.querySelector<HTMLElement>('#inspector')!;
function activation(e: Event) {
 const origin=e.composedPath()[0];
 if(e.isTrusted && origin instanceof HTMLButtonElement &&
    (origin===start || origin.matches('.dmt-close') || origin===inspector.firstElementChild?.shadowRoot?.querySelector('button'))) click=e;
}
window.addEventListener('click',activation,true);
const base = createHost(window);
// Lab-only routing; a single extra concurrency slot exists only for direct activation.
const host = {...base,panelEffects:{track(frames:Keyframe[],enter:number,exit:number){
 const normal=shared.track(frames,enter,exit), reserved=direct.track(frames,enter,exit);
 let running:Animation|undefined, lane=normal;
 return {to(node:HTMLElement,shown:boolean,initial?:number){
  if(!running || running.playState!=='running')lane=shared.activeCount() && mode==='C' && click?.eventPhase ? reserved : normal;
  running=lane.to(node,shown,initial);
  lastGrant=!!running;return running;
 },cancel(){normal.cancel();reserved.cancel()},release(){normal.release();reserved.release()}};
}}};
window.DoLUiHost=host;
const cloud=document.querySelector<HTMLElement>('#cloud')!;
const weather=shared.track([{transform:'translateX(-12px)'},{transform:'translateX(12px)'}],8000,8000);
let skyAnimation:Animation|undefined, generation=0, legs=0;
function stopWeather(){generation++;weather.cancel();skyAnimation=undefined}
function startWeather(){
 stopWeather();if(mode==='A')return;
 const token=generation;
 function leg(forward:boolean){
  if(token!==generation)return;
  skyAnimation=weather.to(cloud,forward);
  if(!skyAnimation)throw Error('Weather slot unavailable');
  legs++;void skyAnimation.finished.then(()=>{if(token===generation){weather.cancel();leg(!forward)}},()=>{});
 }
 leg(true);
}
startTheme();const ui=Reflect.get(window,'DoLMidnightTheme') as {openSettings():void;destroy():void};
start.onclick=()=>ui.openSettings();
const removeInspector=attachInspector(host,inspector);
const close=document.querySelector<HTMLButtonElement>('.dmt-close')!;
const toggle=inspector.firstElementChild!.shadowRoot!.querySelector<HTMLButtonElement>('button')!;
startWeather();

type Entry={name:string;start:number;duration:number;processing:number};
const entries:Entry[]=[];
const supported=PerformanceObserver.supportedEntryTypes.includes('event');
const collect=(items:PerformanceEntry[])=>{for(const p of items){const e=p as PerformanceEventTiming;
 entries.push({name:e.name,start:e.startTime,duration:e.duration,processing:e.processingEnd-e.processingStart})}};
const observer=supported?new PerformanceObserver(list=>collect(list.getEntries())):undefined;
observer?.observe({type:'event',durationThreshold:16} as PerformanceObserverInit);
const frames:number[]=[];
let frame=0;
function watch(now:number){frames.push(now);frame=requestAnimationFrame(watch)}
frame=requestAnimationFrame(watch);
type Sample={action:string;kind:string;inputStart:number;clickStart:number;grant:boolean;dispatchMs:number;inputToClickEndMs:number;nextRafMs:number;followingRafMs:number;firstVisualChangeMs:number|null;opacityAtFirstRaf:string;hiddenAtFirstRaf:boolean};
const samples:Sample[]=[];
let inputStart=0,kind='',entered=0;
for(const control of [start,close,toggle]){
 control.addEventListener('pointerdown',e=>{if(e.isTrusted){kind='pointerdown';inputStart=e.timeStamp}},true);
 control.addEventListener('keydown',e=>{if(e.isTrusted&&e.key==='Enter'){kind='keydown';inputStart=e.timeStamp}},true);
 control.addEventListener('click',()=>{entered=performance.now();lastGrant=false},true);
 control.addEventListener('click',e=>{
  if(!e.isTrusted)return;
  const article=toggle.getRootNode() as ShadowRoot;
  const layer=control===toggle?article.querySelector('article')!:document.querySelector<HTMLElement>('.dmt-settings-shell')!;
  const end=performance.now();
  const s={action:control===start?'settings-open':control===close?'settings-close':toggle.getAttribute('aria-expanded')==='true'?'inspect-open':'inspect-close',
   kind,inputStart,clickStart:e.timeStamp,grant:lastGrant,dispatchMs:end-entered,inputToClickEndMs:end-inputStart,
   nextRafMs:0,followingRafMs:0,firstVisualChangeMs:null as number|null,opacityAtFirstRaf:'',hiddenAtFirstRaf:false};
  let tick=0;
  function observeFrame(){
   tick++;
   const elapsed=performance.now()-s.inputStart;
   const opacity=getComputedStyle(layer).opacity, hidden=!layer.getClientRects().length;
   const changed=s.action.endsWith('-open') ? !hidden && Number(opacity)>.01 : hidden || Number(opacity)<.99;
   if(changed && s.firstVisualChangeMs===null)s.firstVisualChangeMs=elapsed;
   if(tick===1){s.nextRafMs=elapsed;s.opacityAtFirstRaf=opacity;s.hiddenAtFirstRaf=hidden}
   if(tick===2)s.followingRafMs=elapsed;
   if(tick>=2 && (changed || tick>=10))samples.push(s);else requestAnimationFrame(observeFrame);
  }
  requestAnimationFrame(observeFrame);
 });
}
const counts=()=>({shared:shared.activeCount(),direct:direct.activeCount()});
const sky=()=>({time:Number(skyAnimation?.currentTime??0),rate:skyAnimation?.playbackRate??0,legs});
const lab={samples,entries,frames,supported,counts,sky,startWeather,stopWeather,removeInspector,
 flush(){collect(observer?.takeRecords()??[])},
 dispose(){cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('click',activation,true);stopWeather();weather.release();removeInspector();ui.destroy();shared.dispose();direct.dispose();base.dispose();delete window.DoLUiHost}};
declare global {interface Window {weatherLab:typeof lab}}
window.weatherLab=lab;
