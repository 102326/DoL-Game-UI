import {visualScope} from '../visual-scope';
import type {readGameWeather,WeatherSpecial} from '../../../framework/official-ui/weather';
type Weather=ReturnType<typeof readGameWeather>;
export type WeatherFrame={wet:number;snow:number;light:number;night:number;time:number;width:number;height:number;dpr:number;intensity:number;kind:string;special?:WeatherSpecial;specialAmount?:number};
type Material={draw:(s:WeatherFrame)=>void;count:number;snapshot:()=>object;dispose:()=>void;layoutMoving?:()=>boolean;shower?:(value:boolean)=>void};

/** Shared owned clock. Production can supply the owner's shared polling source. */
export function weatherSurface<M extends Material>(canvas:HTMLCanvasElement,read:()=>Weather,makeMaterial:(invalidate:()=>void)=>M,{pace=1,climate=false,managedPoll=false,respectMotion=false}={}){
 const context=canvas.getContext('2d');if(!context)throw Error('Canvas unavailable; static Acrylic remains usable');
 const scope=visualScope(),reduced=matchMedia('(prefers-reduced-motion: reduce)'),parent=canvas.parentElement!;
 let frame=false,stopPoll:(()=>void)|undefined,last=0,time=0,reads=0,width=0,height=0,dpr=1,frames=0,paused=false,paintMs=0;
 let target=read(),wet=0,snow=0,light=1,night=0,intensity=1,specialAmount=target.special&&target.special!=='none'?1:0,special:WeatherSpecial=target.special??'none';
 const material=makeMaterial(()=>request(true));scope.own(()=>material.dispose());
 const targets=()=>({wet:target.kind==='rain'||target.kind==='storm'?1:0,snow:target.kind==='snow'?1:0,intensity:climate?({light:.32,normal:.65,heavy:1,severe:1.5}[target.rain]):1,light:target.kind==='clear'?1:target.kind==='unknown'?0:.25,night:target.night?1:0});
 const initial=targets();wet=initial.wet;snow=initial.snow;light=initial.light;night=initial.night;intensity=initial.intensity;
 const dynamic=()=>!reduced.matches&&(!respectMotion||document.documentElement.hasAttribute('data-dgu-visualmotion'));
 const valid=()=>width>0&&height>0&&Number.isFinite(width+height+dpr);
 function cancel(){scope.cancelFrame(tick);frame=false}
 function draw(){if(!scope.active()||!valid())return;const start=performance.now();material.draw({wet,snow,light,night,time,width,height,dpr,intensity,kind:target.kind,special,specialAmount});paintMs=performance.now()-start}
 function request(geometryOnly=false){if(scope.active()&&!document.hidden&&valid()&&(!paused||geometryOnly))frame=scope.frame(tick)||frame}
 function tick(){frame=false;if(!scope.active()||document.hidden||!valid())return;const now=performance.now(),dt=paused||!dynamic()?0:last?Math.min(.05,(now-last)/1000):0;last=now;time+=dt;frames++;
  const to=targets(),step=(a:number,b:number,tau:number)=>a+(b-a)*(1-Math.exp(-dt/(tau*pace)));
  if(!dynamic()){wet=to.wet;snow=to.snow;light=to.light;night=to.night;intensity=to.intensity}else{wet=step(wet,to.wet,2.2);snow=step(snow,to.snow,3.1);light=step(light,to.light,2.8);night=step(night,to.night,2.8);intensity=step(intensity,to.intensity,.9)}
  const specialTarget=target.special&&target.special!=='none'?1:0;if(specialTarget)special=target.special!;specialAmount=dynamic()?step(specialAmount,specialTarget,1.4):specialTarget;
  draw();if(material.layoutMoving?.())request(true);else if(!paused&&dynamic()&&(wet>.002||snow>.002||specialAmount>.002||specialTarget||Math.abs(wet-to.wet)+Math.abs(snow-to.snow)+Math.abs(light-to.light)+Math.abs(night-to.night)+Math.abs(intensity-to.intensity)>.002))request();
 }
 function refresh(){if(!scope.active()||document.hidden)return;reads++;const next=read(),changed=JSON.stringify(next)!==JSON.stringify(target);target=next;if(changed)request()}
 function poll(){stopPoll?.();stopPoll=undefined;if(!scope.active()||document.hidden)return;refresh();stopPoll=scope.timeout(poll,500)}
 function resized(){if(!scope.active()||document.hidden)return;width=parent.clientWidth;height=parent.clientHeight;dpr=devicePixelRatio||1;if(!valid()){cancel();last=0;return}canvas.width=Math.max(1,Math.round(width*dpr));canvas.height=Math.max(1,Math.round(height*dpr));context!.setTransform(dpr,0,0,dpr,0,0);draw();request(true)}
 function visibility(){if(!scope.active())return;if(document.hidden){cancel();stopPoll?.();stopPoll=undefined;last=0}else{if(!managedPoll)poll();else refresh();resized()}}
 function motionChanged(){if(!scope.active())return;cancel();last=0;request(true)}
 try{
  const resize=new ResizeObserver(resized);scope.own(()=>resize.disconnect());resize.observe(parent);
  window.addEventListener('resize',resized);scope.own(()=>window.removeEventListener('resize',resized));
  document.addEventListener('visibilitychange',visibility);scope.own(()=>document.removeEventListener('visibilitychange',visibility));
  reduced.addEventListener('change',motionChanged);scope.own(()=>reduced.removeEventListener('change',motionChanged));
  if(respectMotion){const motion=new MutationObserver(motionChanged);scope.own(()=>motion.disconnect());motion.observe(document.documentElement,{attributes:true,attributeFilter:['data-dgu-visualmotion']})}
  resized();if(!managedPoll)poll();
 }catch(error){scope.dispose();throw error}
 return{refresh,shower(value:boolean){material.shower?.(value);request(true)},pause(value:boolean){paused=value;last=0;if(value)cancel();if(!value)request();else if(material.layoutMoving?.())request(true)},snapshot:()=>({target:{...target},wet,snow,light,night,intensity,specialAmount,frames,reads,width,height,dpr,activeFrames:frame?1:0,activePolls:stopPoll?1:0,disposed:!scope.active(),particles:material.count,paused,paintMs,time,...material.snapshot()}),dispose(){if(!scope.active())return;cancel();stopPoll?.();stopPoll=undefined;try{scope.dispose()}finally{canvas.remove()}}};
}
