import {weatherSurface} from './renderer';
const canvas=document.querySelector('canvas'),toggle=document.querySelector<HTMLButtonElement>('#toggle');
if(!canvas||!toggle)throw Error('Missing optics controls');
const surface=weatherSurface(canvas,()=>({kind:'rain',night:false,rain:'normal'}),'beads');
Object.assign(window,{optics:surface});
let enabled=true;
toggle.onclick=()=>{enabled=!enabled;document.querySelectorAll<HTMLElement>('.evo-attached-drop').forEach(n=>n.style.backdropFilter=enabled?'':'none')};
