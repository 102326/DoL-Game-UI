import {visualScope} from '../ui/visual-scope';
import {panelDrag} from '../ui/panel-drag';
import {refreshForeground} from '../ui/foreground-plane';

/** Attributes owns presentation only. Native root, contents, events and position storage stay put. */
export function characteristicsMaterial(shell:HTMLElement,core:HTMLElement){
 const owner=visualScope();let current:{header:HTMLElement;dispose:()=>void}|undefined;
 const eligible=()=>owner.active()&&shell.isConnected&&core.isConnected&&shell.contains(core)&&shell.dataset.overlay==='characteristics'&&!shell.classList.contains('hidden')&&!shell.hidden&&!shell.inert&&!!shell.querySelector(':scope>.dgc-host')&&CSS.supports('translate','1px')&&CSS.supports('scale','1')&&document.documentElement.matches('[data-stone-free][data-dol-midnight][data-dgu-acrylic-adjustment]');
 function refresh(){
  const header=eligible()?shell.querySelector<HTMLElement>(':scope>#customOverlayTitle'):null;
  if(current?.header===header)return;
  current?.dispose();current=undefined;
  if(header){
   const drag=panelDrag(shell,header,core,{eligible,lifecycle:shell,marker:'data-dgu-attributes-material',
    readyMarker:'data-dgu-attributes-drag-ready',onPaint:()=>refreshForeground(shell)});
   current={header,dispose:drag.dispose};
  }
 }
 const changed=new MutationObserver(()=>owner.frame(refresh));
 changed.observe(document.documentElement,{attributes:true,attributeFilter:['data-stone-free','data-dol-midnight','data-dgu-acrylic-adjustment']});owner.own(()=>changed.disconnect());
 return{refresh,dispose(){if(!owner.active())return;owner.dispose();const old=current;current=undefined;old?.dispose()}};
}
