import '../../src/main';
import '../../src/theme/stone-free.css';
import '../../src/theme/dark-acrylic.css';
import '../../src/theme/kraft-work-pages.css';
import '../../src/theme/kraft-work-motion.css';
import '../../src/theme/navigation-material.css';
import {hubPreview} from '../evolution-integration/hub-preview';
import {materialStudy} from '../evolution42/material';
import {visualScope} from '../../src/ui/visual-scope';
import './style.css';

const theme=Reflect.get(window,'DoLMidnightTheme') as NonNullable<Parameters<typeof import('../../src/theme/controller').startTheme>[0]>['DoLMidnightTheme'];
if(!theme)throw Error('Missing real settings owner');
const scope=visualScope(),status=document.querySelector<HTMLElement>('#status')!;
let mode:'baseline'|'study'=new URLSearchParams(location.search).get('mode')==='baseline'?'baseline':'study';
let owner:ReturnType<typeof materialStudy>|undefined,shell:HTMLElement|undefined;
function sync(){
 if(!scope.active())return;
 const current=document.querySelector<HTMLElement>('#dol-midnight-controls[open]>.dmt-settings-shell');
 if(current===shell)return;
 owner?.dispose();owner=undefined;shell=current??undefined;
 if(shell){const header=shell.querySelector<HTMLElement>('.dmt-settings-header');if(header){shell.toggleAttribute('data-study04',mode==='study');owner=materialStudy(shell,header,mode==='study'?'force':'baseline',{pseudo:true})}}
}
function select(value:'baseline'|'study'){
 if(!scope.active())return;
 owner?.dispose();owner=undefined;shell?.removeAttribute('data-study04');shell=undefined;mode=value;
 status.textContent=value==='baseline'?'4.1 材质对照（共用研究拖动） · Alt+1 切换':'Study 04 · Alt+0 切换 4.1 材质对照';sync();
}
function open(){if(!scope.active())return;theme!.openSettings();scope.frame(sync)}
const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});scope.own(()=>observer.disconnect());
const openButton=document.querySelector<HTMLButtonElement>('#open')!,modeButton=document.querySelector<HTMLButtonElement>('#mode')!;
openButton.onclick=open;modeButton.onclick=()=>select(mode==='baseline'?'study':'baseline');scope.own(()=>{openButton.onclick=null;modeButton.onclick=null});
const key=(e:KeyboardEvent)=>{if(e.altKey&&(e.code==='Digit0'||e.code==='Digit1')){e.preventDefault();select(e.code==='Digit0'?'baseline':'study')}};
document.addEventListener('keydown',key);scope.own(()=>document.removeEventListener('keydown',key));
function dispose(){if(!scope.active())return;scope.dispose();owner?.dispose();owner=undefined;shell?.removeAttribute('data-study04');shell=undefined;hubPreview.dispose()}
const pagehide=(e:PageTransitionEvent)=>{if(!e.persisted)dispose()};window.addEventListener('pagehide',pagehide);scope.own(()=>window.removeEventListener('pagehide',pagehide));
select(mode);open();
Object.assign(window,{study04:{select,open,dispose,snapshot:()=>({mode,active:scope.active(),motion:owner?.snapshot()})}});
