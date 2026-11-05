import {visualScope} from '../../src/ui/visual-scope';

/** Isolated second-role study derived from settings-material at ae91732.
 * Same accepted motion; native overlay visibility/ownership replaces dialog.open.
 * Not imported by production. No content clones or persisted position. */
export function attributesMaterialStudy(shell:HTMLElement,handle:HTMLElement,core:HTMLElement,motionTarget:HTMLElement=shell){
 const scope=visualScope(),media=matchMedia('(prefers-reduced-motion: reduce)'),root=document.documentElement;
 const before={translate:motionTarget.style.translate,scale:motionTarget.style.scale,origin:motionTarget.style.transformOrigin,coreTranslate:core.style.translate,coreScale:core.style.scale};
 let drag:{id:number;x:number;y:number;t:number}|undefined,x=0,y=0,tx=0,ty=0,fx=0,fy=0,cx=0,cy=0,vx=0,vy=0,last=0;
 const visible=()=>scope.active()&&shell.isConnected&&core.isConnected&&shell.contains(core)&&shell.dataset.overlay==='characteristics'&&!shell.classList.contains('hidden')&&!shell.hidden&&!!shell.querySelector(':scope>.dgc-host')&&!document.hidden;
 const animated=()=>visible()&&!media.matches&&root.hasAttribute('data-dgu-visualMotion');
 function origin(){if(motionTarget!==shell)motionTarget.style.transformOrigin=`${shell.offsetLeft+shell.offsetWidth/2}px ${shell.offsetTop+shell.offsetHeight/2}px`}
 origin();
 function paint(){
  motionTarget.style.translate=`${x}px ${y}px`;
  const sx=1+(fx-fy)*.022,sy=1/sx;
  motionTarget.style.scale=`${sx} ${sy}`;core.style.scale=`${1/sx} ${1/sy}`;core.style.translate=`${cx}px ${cy}px`;
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
  if(!active){tx=ty=fx=fy=cx=cy=vx=vy=last=0}paint();if(active)scope.frame(settle);
 }
 function end(e?:PointerEvent){
  if(!drag||e&&drag.id!==e.pointerId)return;
  const id=drag.id;drag=undefined;if(handle.hasPointerCapture(id))handle.releasePointerCapture(id);tx=ty=0;
 }
 function reset(){end();scope.cancelFrame(settle);x=y=tx=ty=fx=fy=cx=cy=vx=vy=last=0;origin();paint()}
 function down(e:PointerEvent){
  if(!visible()||!e.isPrimary||e.button!==0||drag||e.target instanceof Element&&e.target.closest('button,a,input,select,textarea,[role=button]'))return;
  handle.setPointerCapture(e.pointerId);e.preventDefault();drag={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};
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
 observer.observe(shell,{attributes:true,attributeFilter:['class','hidden','data-overlay'],childList:true});
 observer.observe(root,{attributes:true,attributeFilter:['data-dgu-visualmotion']});scope.own(()=>observer.disconnect());
 shell.setAttribute('data-e42-attributes-material','');
 scope.own(()=>{end();shell.removeAttribute('data-e42-attributes-material');motionTarget.style.translate=before.translate;motionTarget.style.scale=before.scale;motionTarget.style.transformOrigin=before.origin;core.style.translate=before.coreTranslate;core.style.scale=before.coreScale});
 return{reset,dispose:scope.dispose};
}
