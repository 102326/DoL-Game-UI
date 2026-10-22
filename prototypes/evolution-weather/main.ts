import './style.css';
import {readGameWeather} from '../../framework/official-ui/weather';
import {weatherSurface} from './renderer';
const html=document.documentElement;html.dataset.variant='new';html.dataset.settingsStudy='simple';html.setAttribute('data-stone-free','research');
const {startTheme}=await import('../settings-refraction-v1/new');
startTheme(window as Parameters<typeof startTheme>[0]);
const root=window as Window&{DoLMidnightTheme?:{openSettings:()=>void;destroy:()=>void}};
let sample={name:'clear',precipitation:'none',dayState:'day',overcast:0,fog:0,precipitationIntensity:0},renderer:ReturnType<typeof weatherSurface>|undefined,lastSnapshot:ReturnType<ReturnType<typeof weatherSurface>['snapshot']>|undefined,interrupt:ReturnType<typeof setTimeout>|undefined;
const read=()=>readGameWeather({Weather:sample});
function set(kind:string){sample=kind==='snow'?{...sample,name:'snow',precipitation:'snow',overcast:.8}:kind==='rain'?{...sample,name:'rain',precipitation:'rain',precipitationIntensity:1.7,overcast:.8}:{name:'clear',precipitation:'none',dayState:'day',overcast:0,fog:0,precipitationIntensity:0};renderer?.refresh();document.querySelector('#weather-caption')!.textContent='受控输入：'+kind+' · 原速材质演进'}
function attach(){const dialog=document.querySelector<HTMLDialogElement>('#dol-midnight-controls'),shell=dialog?.querySelector<HTMLElement>('.dmt-settings-shell');if(!dialog?.open||!shell||renderer)return;
 if(!shell.querySelector('.evo-toolbar')){const bar=document.createElement('div');bar.className='evo-toolbar';bar.innerHTML='<span id="weather-caption">受控输入：clear · 非游戏天气实录</span><div><button data-weather="clear">W1 晴天</button><button data-weather="rain">W2 晴转雨</button><button data-weather="interrupt">W3 雨途中转雪</button><button data-weather="snow">直接观雪</button></div>';bar.onclick=event=>{const kind=(event.target as Element).closest<HTMLButtonElement>('[data-weather]')?.dataset.weather;if(!kind)return;clearTimeout(interrupt);if(kind==='interrupt'){set('rain');interrupt=setTimeout(()=>set('snow'),900)}else set(kind)};shell.querySelector('.dmt-settings-header')?.after(bar)}
 const canvas=document.createElement('canvas');canvas.className='evo-weather-canvas';canvas.setAttribute('aria-hidden','true');shell.prepend(canvas);renderer=weatherSurface(canvas,read);
}
const observer=new MutationObserver(()=>{const dialog=document.querySelector<HTMLDialogElement>('#dol-midnight-controls');if(dialog?.open)attach();else if(renderer){clearTimeout(interrupt);renderer.dispose();lastSnapshot=renderer.snapshot();renderer=undefined}});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
root.DoLMidnightTheme?.openSettings();attach();
document.querySelector('#reopen')!.addEventListener('click',()=>{root.DoLMidnightTheme?.openSettings();attach()});
Object.assign(window,{weatherStudy:{set,snapshot:()=>renderer?.snapshot()??lastSnapshot,read,close:()=>document.querySelector<HTMLButtonElement>('.dmt-close')?.click(),reopen:()=>{root.DoLMidnightTheme?.openSettings();attach()}}});
window.addEventListener('pagehide',()=>{clearTimeout(interrupt);observer.disconnect();renderer?.dispose();root.DoLMidnightTheme?.destroy()},{once:true});
