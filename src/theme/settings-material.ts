import {writeMaterialTransform,clearMaterialTransform} from '../ui/material-motion-style';
import {visualScope} from '../ui/visual-scope';

/** Settings owns its live shell; no cloned content or persisted drag position. */
export function settingsMaterial(shell:HTMLElement,handle:HTMLElement,core:HTMLElement,dialog:HTMLDialogElement){
 const scope=visualScope(),media=matchMedia('(prefers-reduced-motion: reduce)'),root=document.documentElement;
 const previousMoving=shell.getAttribute('data-dgu-material-moving');let moving=false;
 function marking(value:boolean){if(moving===value)return;moving=value;if(value)shell.setAttribute('data-dgu-material-moving','');else if(previousMoving===null)shell.removeAttribute('data-dgu-material-moving');else shell.setAttribute('data-dgu-material-moving',previousMoving)}
 const before={translate:shell.style.translate,scale:shell.style.scale,coreTranslate:core.style.translate,coreScale:core.style.scale};
 let drag:{id:number;x:number;y:number;t:number}|undefined,x=0,y=0,tx=0,ty=0,fx=0,fy=0,cx=0,cy=0,vx=0,vy=0,last=0;
 const visible=()=>scope.active()&&dialog.open&&!dialog.hasAttribute('data-sf-leaving')&&!document.hidden;
 const animated=()=>visible()&&!media.matches&&root.hasAttribute('data-dgu-visualMotion');
 function paint(){
  const sx=1+(fx-fy)*.022,sy=1/sx;
  writeMaterialTransform(shell,`${x}px ${y}px`,`${sx} ${sy}`);core.style.scale=`${1/sx} ${1/sy}`;core.style.translate=`${cx}px ${cy}px`;
 }
 function settle(){
  if(!animated()){reset();return}
  const now=performance.now(),dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
  const steps=Math.ceil(dt*120),h=dt/steps,w=2*Math.PI*3.4;
  for(let i=0;i<steps;i++){
   tx*=Math.exp(-h*10);ty*=Math.exp(-h*10);fx+=(tx-fx)*(1-Math.exp(-h/.045));fy+=(ty-fy)*(1-Math.exp(-h/.045));
   vx+=(w*w*(-tx*7-cx)-2*.52*w*vx)*h;vy+=(w*w*(-ty*7-cy)-2*.52*w*vy)*h;
   cx=Math.max(-7,Math.min(7,cx+vx*h));cy=Math.max(-7,Math.min(7,cy+vy*h));
  }
  const active=Math.abs(tx)+Math.abs(ty)+Math.abs(fx)+Math.abs(fy)+Math.abs(cx)+Math.abs(cy)+Math.abs(vx)+Math.abs(vy)>.012;
  if(!active){tx=ty=fx=fy=cx=cy=vx=vy=last=0}paint();if(active)scope.frame(settle);else if(!drag)marking(false);
 }
 function end(e?:PointerEvent){
  if(!drag||e&&drag.id!==e.pointerId)return;
  const id=drag.id;drag=undefined;if(handle.hasPointerCapture(id))handle.releasePointerCapture(id);tx=ty=0;if(animated())scope.frame(settle);else marking(false);
 }
 function reset(){end();scope.cancelFrame(settle);marking(false);clearMaterialTransform(shell);x=y=tx=ty=fx=fy=cx=cy=vx=vy=last=0;paint()}
 function down(e:PointerEvent){
  if(!visible()||!e.isPrimary||e.button!==0||drag||e.target instanceof Element&&e.target.closest('button,a,input,select,textarea,[role=button]'))return;
  handle.setPointerCapture(e.pointerId);e.preventDefault();marking(true);drag={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};
 }
 function move(e:PointerEvent){
  if(!drag||e.pointerId!==drag.id)return;e.stopPropagation();if(!visible()){reset();return}
  const rect=shell.getBoundingClientRect(),sx=1+(fx-fy)*.022;
  const zoom=rect.width/(shell.offsetWidth*sx);if(!Number.isFinite(zoom)||zoom<=0)return;
  const viewport=window.visualViewport,left=viewport?.offsetLeft??0,top=viewport?.offsetTop??0;
  const right=left+(viewport?.width??innerWidth),bottom=top+(viewport?.height??innerHeight);
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  // Oversized windows stay anchored; scrolling remains the way to reach their content.
  x+=rect.width>right-left-16?0:Math.max(left+8-rect.left,Math.min(right-8-rect.right,dx))/zoom;
  y+=rect.height>bottom-top-16?0:Math.max(top+8-rect.top,Math.min(bottom-8-rect.bottom,dy))/zoom;
  const now=performance.now(),dt=Math.max(.008,(now-drag.t)/1000);drag={id:drag.id,x:e.clientX,y:e.clientY,t:now};
  if(animated()){tx=Math.max(-1,Math.min(1,dx/dt/650));ty=Math.max(-1,Math.min(1,dy/dt/650));scope.frame(settle)}paint();
 }
 const listen=(node:EventTarget,type:string,fn:EventListener)=>{node.addEventListener(type,fn);scope.own(()=>node.removeEventListener(type,fn))};
 listen(handle,'pointerdown',down as EventListener);listen(handle,'pointermove',move as EventListener);
 for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(handle,type,end as EventListener);
 for(const type of ['blur','resize','pagehide'])listen(window,type,reset);
 if(window.visualViewport)listen(window.visualViewport,'resize',reset);
 listen(document,'visibilitychange',reset);listen(media,'change',reset);
 const observer=new MutationObserver(()=>{if(!visible()||!animated())reset()});
 observer.observe(dialog,{attributes:true,attributeFilter:['open','data-sf-leaving']});
 observer.observe(root,{attributes:true,attributeFilter:['data-dgu-visualmotion']});scope.own(()=>observer.disconnect());
 shell.setAttribute('data-dgu-settings-material','');
 scope.own(()=>{end();marking(false);clearMaterialTransform(shell);shell.removeAttribute('data-dgu-settings-material');shell.style.translate=before.translate;shell.style.scale=before.scale;core.style.translate=before.coreTranslate;core.style.scale=before.coreScale});
 return{reset,dispose:scope.dispose};
}
