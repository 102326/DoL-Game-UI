import {visualScope} from '../ui/visual-scope';
import {writeMaterialTransform,clearMaterialTransform,isMaterialTransformMutation} from '../ui/material-motion-style';
import {refreshForeground} from '../ui/foreground-plane';

/** Attributes owns presentation only. Native root, contents, events and position storage stay put. */
export function characteristicsMaterial(shell:HTMLElement,core:HTMLElement){
 const owner=visualScope();let current:{header:HTMLElement;dispose:()=>void}|undefined;
 const eligible=()=>owner.active()&&shell.isConnected&&core.isConnected&&shell.contains(core)&&shell.dataset.overlay==='characteristics'&&!shell.classList.contains('hidden')&&!shell.hidden&&!shell.inert&&!!shell.querySelector(':scope>.dgc-host')&&CSS.supports('translate','1px')&&CSS.supports('scale','1')&&document.documentElement.matches('[data-stone-free][data-dol-midnight][data-dgu-acrylic-adjustment]');
 function refresh(){
  const header=eligible()?shell.querySelector<HTMLElement>(':scope>#customOverlayTitle'):null;
  if(current?.header!==header){const old=current;current=undefined;old?.dispose();if(header)current={header,dispose:attach(shell,header,core,eligible)}}
 }
 const changed=new MutationObserver(()=>owner.frame(refresh));
 changed.observe(document.documentElement,{attributes:true,attributeFilter:['data-stone-free','data-dol-midnight','data-dgu-acrylic-adjustment']});owner.own(()=>changed.disconnect());
 return{refresh,dispose(){if(!owner.active())return;owner.dispose();const old=current;current=undefined;old?.dispose()}};
}

function attach(shell:HTMLElement,handle:HTMLElement,core:HTMLElement,eligible:()=>boolean){
 const scope=visualScope(),media=matchMedia('(prefers-reduced-motion: reduce)'),root=document.documentElement;
 const properties=[[shell,'translate'],[shell,'scale'],[core,'translate'],[core,'scale']] as const;
 const saved=properties.map(([node,key])=>({node,key,value:node.style.getPropertyValue(key),priority:node.style.getPropertyPriority(key),written:undefined as string|undefined}));
 const marker=shell.getAttribute('data-dgu-attributes-material'),movingMarker=shell.getAttribute('data-dgu-material-moving'),readyMarker=shell.getAttribute('data-dgu-attributes-drag-ready');
 let drag:{id:number;x:number;y:number;t:number}|undefined,x=0,y=0,paintedX=0,paintedY=0,tx=0,ty=0,fx=0,fy=0,cx=0,cy=0,vx=0,vy=0,last=0,moving=false;
 const visible=()=>scope.active()&&eligible()&&handle.isConnected&&shell.contains(handle)&&!document.hidden&&!shell.hasAttribute('data-sf-leaving');
 const animated=()=>visible()&&!media.matches&&root.hasAttribute('data-dgu-visualMotion');
 function marking(value:boolean){if(moving===value)return;moving=value;if(value)shell.setAttribute('data-dgu-material-moving','');else if(movingMarker===null)shell.removeAttribute('data-dgu-material-moving');else shell.setAttribute('data-dgu-material-moving',movingMarker)}
 function restore(){for(const item of saved)if(item.written!==undefined&&item.node.style.getPropertyValue(item.key)===item.written){item.node.style.setProperty(item.key,item.value,item.priority);item.written=undefined}}
 function paint(){
  const sx=1+(fx-fy)*.022,sy=1/sx,values=[`${x}px ${y}px`,`${sx} ${sy}`,`${cx}px ${cy}px`,`${1/sx} ${1/sy}`];
  writeMaterialTransform(shell,values[0]!,values[1]!);
  for(let i=0;i<saved.length;i++){const item=saved[i]!;if(i>=2)item.node.style.setProperty(item.key,values[i]!);item.written=item.node.style.getPropertyValue(item.key)}
  paintedX=x;paintedY=y;refreshForeground(shell);
 }
 function tick(){
  if(!visible()||saved.some(item=>item.written!==undefined&&item.node.style.getPropertyValue(item.key)!==item.written)){reset();return}
  if(animated()){
   const now=performance.now(),dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
   const steps=Math.ceil(dt*120),h=dt/steps,w=2*Math.PI*3.4;
   for(let i=0;i<steps;i++){tx*=Math.exp(-h*10);ty*=Math.exp(-h*10);fx+=(tx-fx)*(1-Math.exp(-h/.045));fy+=(ty-fy)*(1-Math.exp(-h/.045));vx+=(w*w*(-tx*7-cx)-2*.52*w*vx)*h;vy+=(w*w*(-ty*7-cy)-2*.52*w*vy)*h;cx=Math.max(-7,Math.min(7,cx+vx*h));cy=Math.max(-7,Math.min(7,cy+vy*h))}
  }else tx=ty=fx=fy=cx=cy=vx=vy=last=0;
  const active=Math.abs(tx)+Math.abs(ty)+Math.abs(fx)+Math.abs(fy)+Math.abs(cx)+Math.abs(cy)+Math.abs(vx)+Math.abs(vy)>.012;
  if(!active)tx=ty=fx=fy=cx=cy=vx=vy=last=0;
  paint();if(active)scope.frame(tick);else if(!drag)marking(false);
 }
 function end(e?:PointerEvent){if(!drag||e&&drag.id!==e.pointerId)return;const id=drag.id;drag=undefined;if(handle.hasPointerCapture(id))handle.releasePointerCapture(id);tx=ty=0;scope.frame(tick)}
 function reset(){end();scope.cancelFrame(tick);x=y=paintedX=paintedY=tx=ty=fx=fy=cx=cy=vx=vy=last=0;marking(false);restore();clearMaterialTransform(shell);refreshForeground(shell)}
 function compatible(){
  // Keep unfamiliar native transforms as native fallback; never overwrite their independent axes.
  if(typeof DOMMatrixReadOnly==='undefined'||!CSS.supports('translate','1px')||!CSS.supports('scale','1'))return false;
  const style=getComputedStyle(shell),matrix=new DOMMatrixReadOnly(style.transform==='none'?undefined:style.transform);
  if(!['none','0deg'].includes(style.rotate))return false;
  for(let parent=shell.parentElement;parent;parent=parent.parentElement){const s=getComputedStyle(parent),m=new DOMMatrixReadOnly(s.transform==='none'?undefined:s.transform);if(!m.is2D||m.a<=0||m.d<=0||m.b!==0||m.c!==0||!['none','0deg'].includes(s.rotate)||s.scale.split(' ').some(v=>Number(v)<=0))return false}
  if(!matrix.is2D||matrix.a!==1||matrix.d!==1||matrix.b!==0||matrix.c!==0||shell.getAnimations().some(a=>a.playState==='running'))return false;
  return saved.every(item=>item.written!==undefined?item.node.style.getPropertyValue(item.key)===item.written:(item.key==='translate'?['none','0px','0px 0px'].includes(getComputedStyle(item.node).translate):['none','1','1 1'].includes(getComputedStyle(item.node).scale)));
 }
 const waiting=new WeakSet<Animation>();
 function ready(){
  if(!scope.active())return;
  shell.toggleAttribute('data-dgu-attributes-drag-ready',visible()&&compatible());
  // Entry fade completion does not emit a style mutation. Restore touch readiness
  // before the first gesture without polling or changing the native animation.
  for(const animation of shell.getAnimations())if(animation.playState==='running'&&animation.effect?.getComputedTiming().endTime!==Infinity&&!waiting.has(animation)){
   waiting.add(animation);const done=()=>{waiting.delete(animation);if(scope.active())scope.frame(ready)};animation.finished.then(done,done);
  }
 }
 function down(e:PointerEvent){ready();if(!visible()||!e.isPrimary||e.button!==0||drag||!compatible()||e.target instanceof Element&&e.target.closest('button,a,input,select,textarea,[role=button]'))return;handle.setPointerCapture(e.pointerId);e.preventDefault();drag={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};marking(true)}
 function move(e:PointerEvent){
  if(!drag||e.pointerId!==drag.id)return;e.stopPropagation();if(!visible()){reset();return}
  const rect=shell.getBoundingClientRect(),sx=1+(fx-fy)*.022,sy=1/sx,zx=rect.width/(shell.offsetWidth*sx),zy=rect.height/(shell.offsetHeight*sy);
  if(![zx,zy].every(z=>Number.isFinite(z)&&z>0))return;
  const view=window.visualViewport,left=view?.offsetLeft??0,top=view?.offsetTop??0,right=left+(view?.width??innerWidth),bottom=top+(view?.height??innerHeight),dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  x=rect.width>right-left-16?paintedX:Math.max(paintedX+(left+8-rect.left)/zx,Math.min(paintedX+(right-8-rect.right)/zx,x+dx/zx));
  y=rect.height>bottom-top-16?paintedY:Math.max(paintedY+(top+8-rect.top)/zy,Math.min(paintedY+(bottom-8-rect.bottom)/zy,y+dy/zy));
  const now=performance.now(),dt=Math.max(.008,(now-drag.t)/1000);drag={id:drag.id,x:e.clientX,y:e.clientY,t:now};if(animated()){tx=Math.max(-1,Math.min(1,dx/dt/650));ty=Math.max(-1,Math.min(1,dy/dt/650))}scope.frame(tick);
 }
 const listen=(node:EventTarget,type:string,fn:EventListener)=>{node.addEventListener(type,fn);scope.own(()=>node.removeEventListener(type,fn))};
 listen(handle,'pointerdown',down as EventListener);listen(handle,'pointermove',move as EventListener);for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(handle,type,end as EventListener);
 for(const type of ['blur','resize','pagehide'])listen(window,type,reset);if(window.visualViewport)listen(window.visualViewport,'resize',reset);listen(document,'visibilitychange',reset);listen(media,'change',reset);
 const observer=new MutationObserver(()=>{if(!visible()||!animated())reset()});observer.observe(shell,{attributes:true,attributeFilter:['class','hidden','inert','data-overlay','data-sf-leaving'],childList:true});observer.observe(root,{attributes:true,attributeFilter:['data-dgu-visualmotion']});scope.own(()=>observer.disconnect());
 const readiness=new MutationObserver(records=>{if(records.some(r=>!isMaterialTransformMutation(r)&&!(r.target===core&&r.attributeName==='style'&&saved.filter(i=>i.node===core).every(i=>i.written!==undefined&&i.node.style.getPropertyValue(i.key)===i.written))))scope.frame(ready)});
 readiness.observe(shell,{attributes:true,attributeOldValue:true,attributeFilter:['style','class']});readiness.observe(core,{attributes:true,attributeFilter:['style','class']});scope.own(()=>readiness.disconnect());
 shell.setAttribute('data-dgu-attributes-material','');ready();refreshForeground(shell);scope.own(()=>{reset();if(readyMarker===null)shell.removeAttribute('data-dgu-attributes-drag-ready');else shell.setAttribute('data-dgu-attributes-drag-ready',readyMarker);if(marker===null)shell.removeAttribute('data-dgu-attributes-material');else shell.setAttribute('data-dgu-attributes-material',marker);refreshForeground(shell)});
 return scope.dispose;
}
