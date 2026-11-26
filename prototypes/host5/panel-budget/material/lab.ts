import {createHost} from '../../../../framework/host';
import {acrylicScrim,surface} from '../../../../framework/materials/acrylic-scrim';
import {startTheme} from '../../../../src/theme/controller';
import {attachInspector} from '../independent';
import '../../../../src/theme/controls.css';
import '../../../../src/theme/acrylic-v1.css';
const params=new URLSearchParams(location.search);
const preset=params.has('failed')?{resolve:()=>{throw Error('Controlled material resolve failure')},setup:()=>()=>{throw Error('Controlled material setup failure')}}:surface;
const host=createHost(window,params.has('fallback')?{acrylicScrim}:{surface:preset});
if(!params.has('nohost'))window.DoLUiHost=host;
const start=document.querySelector<HTMLButtonElement>('#start')!, parent=document.querySelector<HTMLElement>('#independent')!;
parent.style.backgroundImage='repeating-linear-gradient(90deg,#30343c 0 4px,#606770 4px 8px)';
let stopPeer:(()=>void)|undefined;
const theme=()=>Reflect.get(window,'DoLMidnightTheme') as {openSettings():void;destroy():void}|undefined;
function mountSettings(){startTheme();start.onclick=()=>theme()?.openSettings()}
function mountPeer(){if(!stopPeer && window.DoLUiHost){
 stopPeer=attachInspector(host,parent,params.has('static')?'static':'acrylic');
}}
function removePeer(){stopPeer?.();stopPeer=undefined}
function removeSettings(){theme()?.destroy();start.onclick=null}
mountSettings();mountPeer();
const lab={mountSettings,removeSettings,mountPeer,removePeer,diagnostics:()=>host.getDiagnostics(),
 dispose(){removePeer();removeSettings();host.dispose();delete window.DoLUiHost}};
declare global{interface Window{materialLab:typeof lab}}
window.materialLab=lab;
