import {createHost} from '../../../../framework/host';
import {acrylicScrim} from '../../../../framework/materials/acrylic-scrim';
import {startTheme} from '../../../../src/theme/controller';
import {attachInspector} from '../independent';
const params=new URLSearchParams(location.search);
const preset=params.has('failed')?()=>{throw Error('Controlled material setup failure')}:acrylicScrim;
const host=createHost(window,params.has('fallback')?undefined:{acrylicScrim:preset});
if(!params.has('nohost'))window.DoLUiHost=host;
const start=document.querySelector<HTMLButtonElement>('#start')!, parent=document.querySelector<HTMLElement>('#independent')!;
let stopPeer:(()=>void)|undefined;
const theme=()=>Reflect.get(window,'DoLMidnightTheme') as {openSettings():void;destroy():void}|undefined;
function mountSettings(){startTheme();start.onclick=()=>theme()?.openSettings()}
function mountPeer(){if(!stopPeer && window.DoLUiHost){
 stopPeer=attachInspector(host,parent);
 const article=parent.firstElementChild?.shadowRoot?.querySelector('article');
 if(article)article.style.backgroundImage='repeating-linear-gradient(90deg,#30343c 0 4px,#606770 4px 8px)';
}}
function removePeer(){stopPeer?.();stopPeer=undefined}
function removeSettings(){theme()?.destroy();start.onclick=null}
mountSettings();mountPeer();
const lab={mountSettings,removeSettings,mountPeer,removePeer,diagnostics:()=>host.getDiagnostics(),
 dispose(){removePeer();removeSettings();host.dispose();delete window.DoLUiHost}};
declare global{interface Window{materialLab:typeof lab}}
window.materialLab=lab;
