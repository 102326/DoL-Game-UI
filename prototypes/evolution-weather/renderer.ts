import {rainMaterial,type MaterialKind} from './material';
import {readGameWeather} from '../../framework/official-ui/weather';
type Weather=ReturnType<typeof readGameWeather>;
/** Owned research surface. The provider uses the same authority mapping as production. */
export function weatherSurface(canvas:HTMLCanvasElement,read:()=>Weather=readGameWeather,kind:MaterialKind='beads'){
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable; static Acrylic remains usable');
 const context=ctx,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let dead=false,frame=0,timer:ReturnType<typeof setTimeout>|undefined,last=0,time=0,reads=0,width=1,height=1,dpr=1;
 let target=read(),wet=0,snow=0,light=1,night=0,frames=0,paused=false,paintMs=0;
 const material=rainMaterial(canvas,kind);
 const targets=()=>({wet:target.kind==='rain'||target.kind==='storm'?1:0,snow:target.kind==='snow'?1:0,light:target.kind==='clear'?1:target.kind==='unknown'?0:.25,night:target.night?1:0});
 const initial=targets();wet=initial.wet;snow=initial.snow;light=initial.light;night=initial.night;
 function draw(){const start=performance.now();material.draw({wet,snow,light,night,time,width,height,dpr,kind:target.kind});paintMs=performance.now()-start}
 function request(){if(!dead&&!document.hidden&&!paused&&!frame)frame=requestAnimationFrame(tick)}
 function tick(now:number){frame=0;if(dead||document.hidden)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;time+=dt;frames++;
  const to=targets(),step=(a:number,b:number,tau:number)=>a+(b-a)*(1-Math.exp(-dt/tau));
  if(reduced.matches){wet=to.wet;snow=to.snow;light=to.light;night=to.night}else{wet=step(wet,to.wet,2.2);snow=step(snow,to.snow,3.1);light=step(light,to.light,2.8);night=step(night,to.night,2.8)}
  draw();if(!reduced.matches&&(wet>.002||snow>.002||Math.abs(wet-to.wet)+Math.abs(snow-to.snow)+Math.abs(light-to.light)+Math.abs(night-to.night)>.002))request();
 }
 function refresh(){if(dead)return;reads++;const next=read(),changed=JSON.stringify(next)!==JSON.stringify(target);target=next;if(changed)request()}
 function poll(){clearTimeout(timer);timer=undefined;if(dead||document.hidden)return;refresh();timer=setTimeout(poll,500)}
 function resized(){if(dead)return;const p=canvas.parentElement!;width=p.clientWidth;height=p.clientHeight;dpr=devicePixelRatio||1;canvas.width=Math.max(1,Math.round(width*dpr));canvas.height=Math.max(1,Math.round(height*dpr));context.setTransform(dpr,0,0,dpr,0,0);draw();request()}
 function visibility(){if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;clearTimeout(timer);timer=undefined;last=0}else{poll();resized()}}
 const resize=new ResizeObserver(resized);resize.observe(canvas.parentElement!);window.addEventListener('resize',resized);document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',request);
 resized();poll();
 return{refresh,pause(value:boolean){paused=value;last=0;if(value&&frame){cancelAnimationFrame(frame);frame=0}else if(!value)request()},snapshot:()=>({target:{...target},wet,snow,light,night,frames,reads,width,height,dpr,activeFrames:frame?1:0,activePolls:timer?1:0,disposed:dead,particles:material.count,paused,paintMs,time,...material.snapshot()}),dispose(){if(dead)return;dead=true;if(frame)cancelAnimationFrame(frame);frame=0;clearTimeout(timer);timer=undefined;material.dispose();resize.disconnect();window.removeEventListener('resize',resized);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',request);canvas.remove()}};
}
