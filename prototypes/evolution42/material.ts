import {visualScope} from '../../src/ui/visual-scope';
export type MaterialMode='baseline'|'edge'|'force';
/** One live shell and live content core: no DOM clone, screenshot texture or gameplay state. */
export function materialStudy(face:HTMLElement,handle:HTMLElement,mode:MaterialMode,options:{core?:HTMLElement;draggable?:boolean;role?:string;pseudo?:boolean}={}){
 const scope=visualScope(),media=matchMedia('(prefers-reduced-motion: reduce)'),light=document.createElement('div');
 const draggable=options.draggable!==false,core=draggable?(options.core??face.querySelector<HTMLElement>('.dmt-controls-content,.dgshop-detail-body')):undefined;
 const before={translate:face.style.translate,scale:face.style.scale,mode:face.getAttribute('data-e42-material'),role:face.getAttribute('data-e42-role'),coreTranslate:core?.style.translate,coreScale:core?.style.scale};
 let drag:{id:number;x:number;y:number;originX:number;originY:number}|undefined,x=0,y=0,fx=0,fy=0,tx=0,ty=0,cx=0,cy=0,cvx=0,cvy=0,frames=0,disposed=false,last=0,sample={x:0,y:0,t:0};
 light.className='e42-material-light';light.setAttribute('aria-hidden','true');light.innerHTML='<i class="e42-sheen"></i><i class="e42-stress"></i><i class="e42-rim"></i>';
 if(mode!=='baseline'){face.dataset.e42Material=mode;if(!options.pseudo)face.append(light)}if(options.role)face.dataset.e42Role=options.role;
 function paint(){if(draggable)face.style.translate=`${x}px ${y}px`;if(mode==='baseline')return;
  face.style.setProperty('--e42-force-x',fx.toFixed(3));face.style.setProperty('--e42-force-y',fy.toFixed(3));face.style.setProperty('--e42-core-x',`${cx.toFixed(2)}px`);face.style.setProperty('--e42-core-y',`${cy.toFixed(2)}px`);
  if(mode==='force'&&draggable){
   const sx=1+(fx-fy)*.022,sy=1/sx;face.style.scale=`${sx} ${sy}`;
   if(core){core.style.translate=`${cx}px ${cy}px`;core.style.scale=`${1/sx} ${1/sy}`}
  }
 }
 function settle(){if(!scope.active())return;frames++;const now=performance.now(),dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
  const steps=Math.ceil(dt/(1/120)),h=dt/steps;
  for(let i=0;i<steps;i++){
   tx*=Math.exp(-h*10);ty*=Math.exp(-h*10);fx+=(tx-fx)*(1-Math.exp(-h/.045));fy+=(ty-fy)*(1-Math.exp(-h/.045));
   const w=2*Math.PI*3.4;cvx+=(w*w*(-tx*7-cx)-2*.52*w*cvx)*h;cvy+=(w*w*(-ty*7-cy)-2*.52*w*cvy)*h;
   cx=Math.max(-7,Math.min(7,cx+cvx*h));cy=Math.max(-7,Math.min(7,cy+cvy*h));
  }
  const active=Math.abs(fx)+Math.abs(fy)+Math.abs(tx)+Math.abs(ty)+Math.abs(cx)+Math.abs(cy)+Math.abs(cvx)+Math.abs(cvy)>.012;
  if(!active){fx=fy=tx=ty=cx=cy=cvx=cvy=0;last=0}paint();if(active)scope.frame(settle);
 }
 function force(a:number,b:number){if(media.matches||mode!=='force')return;tx=Math.max(-1,Math.min(1,a));ty=Math.max(-1,Math.min(1,b));scope.frame(settle)}
 function down(e:PointerEvent){if(!draggable||e.button!==0||!e.isPrimary||drag||e.target instanceof Element&&e.target.closest('button,a,input,select,textarea,[role=button]'))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,originX:x,originY:y};sample={x:e.clientX,y:e.clientY,t:performance.now()};handle.setPointerCapture(e.pointerId)}
 function move(e:PointerEvent){if(!scope.active())return;const r=face.getBoundingClientRect();face.style.setProperty('--e42-light-x',`${Math.max(0,Math.min(r.width,e.clientX-r.left))}px`);face.style.setProperty('--e42-light-y',`${Math.max(0,Math.min(r.height,e.clientY-r.top))}px`);if(!drag||drag.id!==e.pointerId)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y,baseX=r.left-x,baseY=r.top-y;
  x=Math.max(8-baseX,Math.min(innerWidth-8-baseX-r.width,drag.originX+dx));y=Math.max(8-baseY,Math.min(innerHeight-8-baseY-r.height,drag.originY+dy));
  const now=performance.now(),dt=Math.max(.008,(now-sample.t)/1000);force((e.clientX-sample.x)/dt/650,(e.clientY-sample.y)/dt/650);sample={x:e.clientX,y:e.clientY,t:now};paint();
 }
 function end(e?:PointerEvent){if(!drag||e&&e.pointerId!==drag.id)return;const id=drag.id;drag=undefined;if(handle.hasPointerCapture(id))handle.releasePointerCapture(id);tx=ty=0;if(mode==='force')scope.frame(settle)}
 function reset(){end();scope.cancelFrame(settle);x=y=fx=fy=tx=ty=cx=cy=cvx=cvy=last=0;paint()}
 const listen=(node:EventTarget,type:string,fn:EventListener)=>{node.addEventListener(type,fn);scope.own(()=>node.removeEventListener(type,fn))};
 listen(handle,'pointerdown',down as EventListener);listen(face,'pointermove',move as EventListener);listen(handle,'pointerup',end as EventListener);listen(handle,'pointercancel',end as EventListener);listen(handle,'lostpointercapture',end as EventListener);listen(window,'resize',reset);listen(window,'blur',reset);listen(document,'visibilitychange',reset);listen(media,'change',reset);
 scope.own(()=>{end();light.remove();face.style.translate=before.translate;face.style.scale=before.scale;if(core){core.style.translate=before.coreTranslate??'';core.style.scale=before.coreScale??''}if(before.role===null)face.removeAttribute('data-e42-role');else face.setAttribute('data-e42-role',before.role);if(before.mode===null)face.removeAttribute('data-e42-material');else face.setAttribute('data-e42-material',before.mode);for(const key of ['--e42-force-x','--e42-force-y','--e42-core-x','--e42-core-y','--e42-light-x','--e42-light-y'])face.style.removeProperty(key)});
 return{reset,snapshot:()=>({mode,role:options.role??'settings',draggable,frames,x,y,fx,fy,cx,cy,dragging:!!drag,active:scope.active()}),dispose(){if(disposed)return;disposed=true;scope.dispose()}};
}
