import {gsap} from 'gsap';

type Phase = 'idle' | 'charge' | 'release' | 'afterglow' | 'return' | 'reduced' | 'disposed';
const TAU = Math.PI * 2;
const PHI = (1 + Math.sqrt(5)) / 2;

/** Ball-only visual study. No game state, menu layout or business handlers. */
export function createSphere(canvas: HTMLCanvasElement, changed: (phase: Phase) => void) {
 const ctx = canvas.getContext('2d');
 if (!ctx) throw new Error('Canvas 2D is unavailable');
 const c = ctx;
 const media = matchMedia('(prefers-reduced-motion: reduce)');
 const state = {speed: .3, charge: 0, energy: 0, spread: 0, pressure: 0};
 let phase: Phase = 'idle', angle = 0, orbit = 0, last = 0, frame = 0, draws = 0;
 let width = 1, height = 1, dead = false, timeline: gsap.core.Timeline | undefined;
 let duration = 1, strength = 1, motionChanges = 0;
 const setPhase = (value: Phase) => {phase = value; changed(value)};

 function resize() {
  const rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  width = rect.width; height = rect.height;
  canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr));
  c.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
 }
 function stroke(points: Array<[number, number]>, color: string, lineWidth: number) {
  c.beginPath(); points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
  c.strokeStyle = color; c.lineWidth = lineWidth; c.stroke();
 }
 function draw() {
  if (dead) return;
  draws++;
  c.clearRect(0,0,width,height);
  const radius = Math.min(65, width * .137, height * .17);
  const x = width * .5, y = height * .48;
  const energy = state.energy * strength, heat = state.charge;
  c.save(); c.translate(x,y);
  // Surface reflections and the outgoing energy share a continuous angular state.
  const pool = c.createRadialGradient(0,0,radius*.4,0,0,radius*4.5);
  pool.addColorStop(0,`rgba(185,153,66,${.04 + heat*.07})`); pool.addColorStop(1,'rgba(100,90,40,0)');
  c.fillStyle = pool; c.fillRect(-width,-height,width*2,height*2);
  const halo = c.createRadialGradient(0,0,radius*.8,0,0,radius*2);
  halo.addColorStop(0,`rgba(218,188,83,${heat*.16})`); halo.addColorStop(1,'rgba(200,160,60,0)');
  c.fillStyle = halo; c.fillRect(-radius*2,-radius*2,radius*4,radius*4);

  // Behind the ball: two tilted orbital sheets, rather than a rotating flat icon.
  if (heat > .01 || energy > .01) for (let band=0; band<3; band++) {
   const points: Array<[number,number]> = [];
   for (let i=0;i<85;i++) {
    const a = i/84*TAU + angle*.28 + band*2.1;
    const r = radius*(1.25 + band*.14 + state.pressure*.12);
    const px = Math.cos(a)*r, py = Math.sin(a)*r*.42;
    const tilt = -.65 + band*.63;
    points.push([px*Math.cos(tilt)-py*Math.sin(tilt), px*Math.sin(tilt)+py*Math.cos(tilt)]);
   }
   stroke(points,`rgba(200,181,104,${heat*.14 + energy*.06})`,.65);
  }
  c.save(); c.scale(1 + state.pressure*.07,1 - state.pressure*.06);
  // Metallic body stays spatially grounded; engraved geometry rotates on its surface.
  const body = c.createRadialGradient(-radius*.37,-radius*.46,radius*.05,radius*.15,radius*.2,radius*1.2);
  body.addColorStop(0,'#b6c09a'); body.addColorStop(.23,'#697f56'); body.addColorStop(.53,'#354b37');
  body.addColorStop(.78,'#17291f'); body.addColorStop(.93,'#0b1713'); body.addColorStop(1,'#5a6240');
  c.beginPath(); c.arc(0,0,radius,0,TAU); c.fillStyle=body; c.fill();
  c.save(); c.clip();
  // Project a rotating spherical engraving, depth-clipped to the front hemisphere.
  const project = (latitude: number, longitude: number) => {
   const sx = Math.cos(latitude)*Math.sin(longitude+angle);
   const sz = Math.cos(latitude)*Math.cos(longitude+angle);
   const sy = Math.sin(latitude);
   const tilt=.43, px=sx*Math.cos(tilt)-sy*Math.sin(tilt), py=sx*Math.sin(tilt)+sy*Math.cos(tilt);
   return {x:px*radius, y:py*radius, z:sz};
  };
  for (let latitude=-1.15;latitude<=1.2;latitude+=.38) {
   let points: Array<[number,number]> = [];
   for (let i=0;i<=100;i++) {
    const p=project(latitude,i/100*TAU);
    if(p.z>0)points.push([p.x,p.y]);
    else if(points.length){stroke(points,'rgba(16,29,20,.65)',3.5);stroke(points,`rgba(206,196,115,${.18+heat*.25})`,1);points=[]}
   }
   if(points.length){stroke(points,'rgba(16,29,20,.65)',3.5);stroke(points,`rgba(206,196,115,${.18+heat*.25})`,1)}
  }
  for(let j=0;j<9;j++) {
   let points: Array<[number,number]> = [];
   for(let i=0;i<=40;i++) {
    const p=project(-1.45+i/40*2.9,j/9*TAU + Math.sin(i/40*Math.PI)*.45);
    if(p.z>0)points.push([p.x,p.y]);
    else if(points.length){stroke(points,`rgba(203,197,131,${.12+heat*.22})`,1.5);points=[]}
   }
   if(points.length)stroke(points,`rgba(203,197,131,${.12+heat*.22})`,1.5);
  }
  for(let row=-2;row<=2;row++)for(let col=0;col<10;col++) {
   const p=project(row*.42,col/10*TAU+row*.34);
   if(p.z<=0)continue;
   const dotRadius=(1.5+p.z*2.2)*(radius/65);
   c.beginPath();c.arc(p.x,p.y,dotRadius+1,0,TAU);c.fillStyle='rgba(8,20,14,.7)';c.fill();
   c.beginPath();c.arc(p.x-.4,p.y-.5,dotRadius,0,TAU);c.fillStyle=`rgba(204,207,147,${.14+p.z*.48})`;c.fill();
  }
  // A brief curved smear conveys speed while the spherical texture remains visible.
  if(heat>.05)for(let i=0;i<8;i++) {
   c.save();c.rotate(-.7);c.scale(1,.48);
   c.beginPath();c.arc(0,0,radius*(.53+i*.07),angle*.5+i*.7,angle*.5+i*.7+.6+heat*1.9);
   c.strokeStyle=`rgba(226,216,142,${heat*.14})`;c.lineWidth=1.2+i*.12;c.stroke();c.restore();
  }
  const sheen=c.createRadialGradient(-radius*.38,-radius*.48,0,-radius*.25,-radius*.32,radius*.8);
  sheen.addColorStop(0,'rgba(243,244,205,.3)');sheen.addColorStop(.4,'rgba(210,222,169,.06)');sheen.addColorStop(1,'rgba(200,210,160,0)');
  c.fillStyle=sheen;c.fillRect(-radius,-radius,radius*2,radius*2);c.restore();
  c.beginPath();c.arc(0,0,radius-.5,0,TAU);c.strokeStyle=`rgba(214,213,147,${.2+heat*.45})`;c.lineWidth=1.2;c.stroke();c.restore();

  // A logarithmic ribbon grows out of the sphere, then unwinds into an afterimage.
  if(energy>.003) {
   const reach=Math.min(width*.46,height*.45,radius*4.8);
   const maxRadius=radius*.82+state.spread*(reach-radius*.82);
   c.save();c.globalCompositeOperation='screen';
   for(let ribbon=0;ribbon<3;ribbon++) {
    const points: Array<[number,number]> = [];
    const total=TAU*1.8, growth=Math.log(PHI)/(Math.PI/2);
    for(let i=0;i<=150;i++) {
     const t=i/150, a=t*total + orbit+ribbon*TAU/3;
     const r=maxRadius*Math.exp((t-1)*total*growth);
     const twist=-.28+state.spread*.2;
     const px=Math.cos(a)*r,py=Math.sin(a)*r*(.66+state.spread*.14);
     points.push([px*Math.cos(twist)-py*Math.sin(twist),px*Math.sin(twist)+py*Math.cos(twist)]);
    }
    const opacity=energy*(.85-ribbon*.16);
    stroke(points,`rgba(179,130,39,${opacity*.12})`,13-ribbon*2);
    stroke(points,`rgba(222,173,63,${opacity*.3})`,4.6-ribbon*.7);
    stroke(points,`rgba(246,218,128,${opacity*.83})`,1.25-ribbon*.18);
    // Short staggered arcs carry the release direction beyond the ribbon tip.
    for(let segment=0;segment<4;segment++) {
     const a=orbit+ribbon*TAU/3+segment*.24;
     c.save();c.rotate(-.14);c.scale(1,.78);c.beginPath();
     c.arc(0,0,maxRadius*(.88+segment*.035),a,a+.09+energy*.19);
     c.strokeStyle=`rgba(239,205,115,${opacity*(.36-segment*.07)})`;c.lineWidth=2-segment*.3;c.stroke();c.restore();
    }
   }
   c.restore();
  }
  c.restore();
 }
 function tick(now: number) {
  frame=0;
  if(dead || document.hidden)return;
  // Also sample while active: a host may update matches before dispatching its change event.
  if(media.matches){reduced();return}
  const dt=last?Math.min((now-last)/1000,.05):0;last=now;
  angle=(angle+state.speed*dt)%TAU;orbit=(orbit+(1.1+state.speed*.17)*dt)%TAU;
  draw();
  // The first RAF may precede GSAP's first tick; isActive() is false during that gap.
  if(timeline)frame=requestAnimationFrame(tick);
 }
 function wake() {if(!dead&&!frame&&!document.hidden&&!media.matches){last=0;frame=requestAnimationFrame(tick)}}
 function stop() {timeline?.kill();timeline=undefined;cancelAnimationFrame(frame);frame=0;last=0}
 function reduced() {stop();Object.assign(state,{speed:0,charge:.18,energy:.28,spread:.45,pressure:0});setPhase('reduced');draw()}
 function play() {
  if(dead)return;
  if(media.matches){reduced();return}
  stop();setPhase('charge');
  timeline=gsap.timeline({onComplete(){timeline=undefined;setPhase('idle');draw()}});
  timeline.to(state,{speed:8,charge:.5,pressure:.4,energy:0,spread:0,duration:.52*duration,ease:'power2.inOut'})
   .to(state,{speed:46,charge:1,pressure:1,duration:.95*duration,ease:'power3.in'})
   .call(()=>setPhase('release'))
   .to(state,{speed:58,pressure:0,energy:1,spread:.92,duration:.48*duration,ease:'power3.out'})
   .to(state,{energy:.75,spread:1,charge:.7,duration:.48*duration,ease:'sine.out'})
   .call(()=>setPhase('afterglow'))
   .to(state,{speed:.3,charge:0,energy:0,pressure:0,duration:2.3*duration,ease:'power2.out'});
  wake();
 }
 function recover() {
  if(dead)return;
  if(media.matches){stop();Object.assign(state,{speed:0,charge:0,energy:0,spread:0,pressure:0});setPhase('idle');draw();return}
  stop();setPhase('return');
  timeline=gsap.timeline({onComplete(){timeline=undefined;setPhase('idle');draw()}})
   .to(state,{energy:Math.min(.65,state.energy+.15),spread:0,charge:.2,speed:10,pressure:.2,duration:.55*duration,ease:'power2.inOut'})
   .to(state,{energy:0,charge:0,speed:.3,pressure:0,duration:.55*duration,ease:'power2.out'});
  wake();
 }
 const visibility=()=>{if(document.hidden){timeline?.pause();cancelAnimationFrame(frame);frame=0;last=0}else{timeline?.resume();wake()}};
 const motion=()=>{motionChanges++;if(media.matches)reduced();else{stop();Object.assign(state,{speed:.3,charge:0,energy:0,spread:0,pressure:0});setPhase('idle');draw()}};
 const observer=new ResizeObserver(resize);observer.observe(canvas);
 media.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);resize();
 return {play,recover,
  configure(options:{duration?:number;strength?:number}){duration=Math.max(.5,Math.min(2,options.duration??duration));strength=Math.max(.3,Math.min(1.3,options.strength??strength));draw()},
  // GSAP adds a circular private cache to its target; do not expose that as research state.
  inspect:()=>({phase,speed:state.speed,charge:state.charge,energy:state.energy,spread:state.spread,pressure:state.pressure,angle,orbit,draws,running:!!frame,dead,reduced:media.matches,motionChanges,width,height}),
  destroy(){if(dead)return;stop();observer.disconnect();media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);dead=true;setPhase('disposed');c.clearRect(0,0,width,height)}
 };
}
