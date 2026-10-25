import {readGameWeather} from '../../framework/official-ui/weather';
type Weather=ReturnType<typeof readGameWeather>;
/** Owned research surface. The provider uses the same authority mapping as production. */
export function weatherSurface(canvas:HTMLCanvasElement,read:()=>Weather=readGameWeather){
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable; static Acrylic remains usable');
 const context=ctx,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let dead=false,frame=0,timer:ReturnType<typeof setTimeout>|undefined,last=0,time=0,reads=0,width=1,height=1,dpr=1;
 let target=read(),wet=0,snow=0,light=1,night=0,frames=0;
 const points=Array.from({length:42},(_,i)=>({x:((i*73+19)%997)/997,y:((i*137+53)%991)/991,r:2.5+i%5*.75,speed:12+i%7*3,phase:i*.73}));
 const clamp=(x:number)=>Math.max(0,Math.min(1,x));
 const targets=()=>({wet:target.kind==='rain'||target.kind==='storm'?1:0,snow:target.kind==='snow'?1:0,light:target.kind==='clear'?1:target.kind==='unknown'?0:.25,night:target.night?1:0});
 const initial=targets();wet=initial.wet;snow=initial.snow;light=initial.light;night=initial.night;
 function draw(){
  context.clearRect(0,0,width,height);const c=context;
  if(target.kind==='unknown'&&wet<.001&&snow<.001)return;
  const glow=c.createRadialGradient(width*.2,0,0,width*.2,0,width*.9);glow.addColorStop(0,`rgba(${night>.5?'117,148,202':'243,205,142'},${(.13*light+.035)*(1-night*.4)})`);glow.addColorStop(1,'transparent');c.fillStyle=glow;c.fillRect(0,0,width,height);
  c.save();c.beginPath();c.roundRect(0,0,width,height,22);c.clip();
  // Beads, narrow wet tracks and reflected rims change on the same surface.
  for(const [i,p]of points.entries()){
   const edge=(p.x<.18||p.x>.84)?1:.16,x=p.x*width+Math.sin(time*.12+p.phase)*4,y=(p.y*height+time*p.speed)%height;
   if(wet>.005){const r=p.r*(.4+.6*wet),alpha=wet*edge;
    c.strokeStyle=`rgba(189,218,237,${.12*alpha})`;c.lineWidth=Math.max(.6,r*.5);c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x-3,y-18,x+3,y-34,x+1,y-58);c.stroke();
    const bead=c.createRadialGradient(x-r*.3,y-r*.4,.2,x,y,r);bead.addColorStop(0,`rgba(239,251,255,${.6*alpha})`);bead.addColorStop(.28,`rgba(152,195,225,${.13*alpha})`);bead.addColorStop(.75,`rgba(5,13,23,${.5*alpha})`);bead.addColorStop(1,`rgba(195,231,246,${.5*alpha})`);c.fillStyle=bead;c.beginPath();c.ellipse(x,y,r,r*1.32,0,0,Math.PI*2);c.fill();
   }
   if(snow>.005){const sx=(p.x*width+Math.sin(time*.3+p.phase)*17+width)%width,sy=(p.y*height+time*(9+i%4*5))%height;c.fillStyle=`rgba(216,239,255,${snow*.35*edge})`;c.beginPath();c.arc(sx,sy,1+i%3*.5,0,Math.PI*2);c.fill()}
  }
  // Persistent frost grows from edges rather than replacing an old particle layer.
  if(snow>.002){
   const frost=c.createLinearGradient(0,0,0,height);frost.addColorStop(0,`rgba(178,213,237,${snow*.24})`);frost.addColorStop(.2,'transparent');frost.addColorStop(.86,'transparent');frost.addColorStop(1,`rgba(178,213,237,${snow*.2})`);c.fillStyle=frost;c.fillRect(0,0,width,height);
   for(let side=0;side<2;side++)for(let i=0;i<24;i++){const x=side?width:0,y=i*height/24+7,span=(18+i%5*11)*snow,sign=side?-1:1;c.strokeStyle=`rgba(206,234,251,${snow*(.16+i%3*.03)})`;c.lineWidth=.7;c.beginPath();c.moveTo(x,y);c.lineTo(x+sign*span,y-span*.32);for(let b=1;b<5;b++){const bx=x+sign*span*b/5,by=y-span*.32*b/5;c.moveTo(bx,by);c.lineTo(bx-sign*7,by-8*snow);c.moveTo(bx,by);c.lineTo(bx-sign*5,by+7*snow)}c.stroke()}
  }
  c.restore();canvas.dataset.weather=target.kind;canvas.style.setProperty('--evo-wet',String(wet));
 }
 function request(){if(!dead&&!document.hidden&&!frame)frame=requestAnimationFrame(tick)}
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
 return{refresh,snapshot:()=>({target:{...target},wet,snow,light,night,frames,reads,width,height,dpr,activeFrames:frame?1:0,activePolls:timer?1:0,disposed:dead,particles:points.length}),dispose(){if(dead)return;dead=true;if(frame)cancelAnimationFrame(frame);frame=0;clearTimeout(timer);timer=undefined;resize.disconnect();window.removeEventListener('resize',resized);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',request);canvas.remove()}};
}
