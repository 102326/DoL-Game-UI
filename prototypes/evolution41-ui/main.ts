import {hubPreview} from '../evolution-integration/hub-preview';
import {createPanelPreview,panelCases,type PreviewPanel} from './panels';

const required=<T extends Element>(selector:string)=>{const n=document.querySelector<T>(selector);if(!n)throw Error(`Missing preview control ${selector}`);return n};
const theme=(window as Window & {DoLMidnightTheme?:{openSettings():void}}).DoLMidnightTheme;
if(!theme)throw Error('Settings owner is unavailable');
required<HTMLButtonElement>('#review-open-settings').onclick=()=>theme.openSettings();
required<HTMLButtonElement>('#review-find-hub').onclick=()=>hubPreview.floating.show();
const panels=createPanelPreview(),panelPicker=required<HTMLSelectElement>('#review-panel');
hubPreview.enableOfficialMotion();
for(const [key,label] of Object.entries(panelCases)){const option=document.createElement('option');option.value=key;option.textContent=label;panelPicker.append(option)}
required<HTMLButtonElement>('#review-open-panel').onclick=()=>panels.open(panelPicker.value as PreviewPanel);
required<HTMLButtonElement>('#review-restore-panel').onclick=()=>panels.restore();
Object.assign(window,{ui41PanelPreview:panels});
const picker=required<HTMLSelectElement>('#review-weather');
function weather(kind:string){
 const value=Reflect.get(window,'Weather') as {name:string;precipitation:string;precipitationIntensity:number;dayState:string};
 Object.assign(value,{name:kind==='snow'?'snow':kind==='heavy'?'rain':'clear',precipitation:kind==='snow'?'snow':kind==='heavy'?'rain':'none',precipitationIntensity:kind==='heavy'?1.7:0});
 picker.value=kind;
}
picker.onchange=()=>weather(picker.value);
const keys:Record<string,string|undefined>={Digit1:'clear',Digit2:'heavy',Digit3:'snow'};
const onKey=(e:KeyboardEvent)=>{const kind=e.altKey?keys[e.code]:undefined;if(kind){e.preventDefault();weather(kind)}};
window.addEventListener('keydown',onKey,true);
function onPageHide(event:PageTransitionEvent){
 // BFCache restores this module's live page; only a final departure retires owners.
 if(event.persisted)return;
 window.removeEventListener('pagehide',onPageHide);window.removeEventListener('keydown',onKey,true);panels.dispose();hubPreview.dispose();
}
window.addEventListener('pagehide',onPageHide);
weather(new URLSearchParams(location.search).get('weather')??'clear');
if(new URLSearchParams(location.search).has('settings'))theme.openSettings();
