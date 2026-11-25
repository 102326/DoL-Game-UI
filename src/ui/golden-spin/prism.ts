/** The official Hub's static, CSS-animated crown. It owns only visual nodes. */
export function createPrism(ball:HTMLButtonElement, changed:(phase:'idle'|'disposed')=>void) {
 const visual=document.createElement('span');visual.className='spin-prism';visual.setAttribute('aria-hidden','true');
 visual.innerHTML=`
  <span class="spin-prism-ripple"></span>
  <span class="spin-prism-shell"></span>
  <span class="spin-prism-parallax">
   <svg viewBox="0 0 44 44" fill="none">
    <g class="astro-outer-arcs" stroke="currentColor" stroke-linecap="round">
     <path d="M11.4 6.5A19 19 0 0 1 32.6 6.5M37.5 11.4A19 19 0 0 1 37.5 32.6M32.6 37.5A19 19 0 0 1 11.4 37.5M6.5 32.6A19 19 0 0 1 6.5 11.4" stroke-width="1.15"/>
     <path d="M22 2.2v3.2M41.8 22h-3.2M22 41.8v-3.2M2.2 22h3.2" stroke-width="1.35"/>
    </g>
    <g class="astro-inner-emblem">
     <path d="M22 7.5 36.5 22 22 36.5 7.5 22Z" fill="currentColor" fill-opacity=".04" stroke="currentColor" stroke-width="1.15"/>
     <path d="M22 13 13 22h9Z" fill="#fff" fill-opacity=".24"/>
     <path d="M22 13 31 22h-9ZM22 31 13 22h9Z" fill="currentColor" fill-opacity=".26"/>
     <path d="M22 31 31 22h-9Z" fill="#060a0e" fill-opacity=".56"/>
     <path d="M22 13 31 22 22 31 13 22Z" stroke="currentColor" stroke-width="1.35"/>
     <path d="M22 13v18M13 22h18" stroke="#fff" stroke-opacity=".2" stroke-width=".7"/>
    </g>
    <g class="astro-core-spark">
     <path d="m22 18.2 1.1 2.7 2.7 1.1-2.7 1.1-1.1 2.7-1.1-2.7-2.7-1.1 2.7-1.1Z" fill="currentColor"/>
     <circle cx="22" cy="22" r="1.2" fill="#fff" fill-opacity=".88"/>
    </g>
   </svg>
  </span>`;
 ball.append(visual);
 let dead=false,paused=false,last:{x:number;y:number;time:number}|undefined;
 const reset=()=>{last=undefined;visual.style.removeProperty('--px');visual.style.removeProperty('--py')};
 const down=(e:PointerEvent)=>{last={x:e.clientX,y:e.clientY,time:e.timeStamp}};
 const move=(e:PointerEvent)=>{
  if(!last)return;
  const factor=16/Math.max(8,Math.min(48,e.timeStamp-last.time));
  const dx=(e.clientX-last.x)*factor,dy=(e.clientY-last.y)*factor;
  last={x:e.clientX,y:e.clientY,time:e.timeStamp};
  if(!ball.classList.contains('is-dragging')||paused)return;
  visual.style.setProperty('--px',`${Math.max(-3.8,Math.min(3.8,-dx*.35))}px`);
  visual.style.setProperty('--py',`${Math.max(-3.8,Math.min(3.8,-dy*.35))}px`);
 };
 const listeners:[string,EventListener][]=[['pointerdown',down as EventListener],['pointermove',move as EventListener],
  ['pointerup',reset],['pointercancel',reset],['lostpointercapture',reset]];
 for(const [type,handler] of listeners)ball.addEventListener(type,handler);
 changed('idle');
 return {play(){},recover(){reset()},pause(value:boolean){paused=value;if(value)reset()},configure(_options:{duration?:number;strength?:number}){},
  // Legacy diagnostics describe Canvas activity only; browser animations are sampled separately.
  inspect:()=>({appearance:'diamond' as const,phase:dead?'disposed' as const:'idle' as const,speed:0,charge:0,energy:0,spread:0,pressure:0,angle:0,orbit:0,draws:0,meteors:0,running:false,dead,paused,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,motionChanges:0,width:56,height:56}),
  destroy(){if(dead)return;dead=true;for(const [type,handler] of listeners)ball.removeEventListener(type,handler);visual.remove();changed('disposed')}
 };
}
