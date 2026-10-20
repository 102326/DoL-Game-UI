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
  const radius = Math.min(82, width * .16, height * .21);
  const x = width * .5, y = height * .48;
  const energy = state.energy * strength, heat = state.charge;
  c.save(); c.translate(x,y);
  // Surface reflections and the outgoing energy share a continuous angular state.
  const pool = c.createRadialGradient(0,0,radius*.4,0,0,radius*4.5);
  pool.addColorStop(0,`rgba(185,153,66,${.02 + heat*.035})`); pool.addColorStop(1,'rgba(100,90,40,0)');
  c.fillStyle = pool; c.fillRect(-width,-height,width*2,height*2);
  const halo = c.createRadialGradient(0,0,radius*.8,0,0,radius*2);
  halo.addColorStop(0,`rgba(218,188,83,${heat*.11})`); halo.addColorStop(1,'rgba(200,160,60,0)');
  c.fillStyle = halo; c.fillRect(-radius*2,-radius*2,radius*4,radius*4);

  // Detached tangent traces stay close to the body; no complete loading rings.
  if (heat > .01 || energy > .01) for (let band=0; band<3; band++) {
   const points: Array<[number,number]> = [];
   for (let i=0;i<35;i++) {
    const a = i/34*(.8+heat*1.4) + angle*.72 + band*2.1;
    const r = radius*(1.1 + band*.09 - state.pressure*.05);
    const px = Math.cos(a)*r, py = Math.sin(a)*r*.6;
    const tilt = -.72 + band*.48;
    points.push([px*Math.cos(tilt)-py*Math.sin(tilt), px*Math.sin(tilt)+py*Math.cos(tilt)]);
   }
   stroke(points,`rgba(200,181,104,${heat*.22 + energy*.08})`,1.4-band*.25);
  }
  c.save(); c.scale(1 + state.pressure*.045,1 - state.pressure*.035);
  // Metallic body stays spatially grounded; engraved geometry rotates on its surface.
  const body = c.createRadialGradient(-radius*.37,-radius*.46,radius*.05,radius*.15,radius*.2,radius*1.2);
  body.addColorStop(0,'#b6c09a'); body.addColorStop(.23,'#697f56'); body.addColorStop(.53,'#354b37');
  body.addColorStop(.78,'#17291f'); body.addColorStop(.93,'#0b1713'); body.addColorStop(1,'#5a6240');
  c.beginPath(); c.arc(0,0,radius,0,TAU); c.fillStyle=body; c.fill();
  c.save(); c.clip();
  // Project a rotating spherical engraving, depth-clipped to the front hemisphere.
  const project = (latitude: number, longitude: number, lag=0) => {
   const sx = Math.cos(latitude)*Math.sin(longitude+angle-lag);
   const sz = Math.cos(latitude)*Math.cos(longitude+angle-lag);
   const sy = Math.sin(latitude);
   const tilt=.12, px=sx*Math.cos(tilt)-sy*Math.sin(tilt), py=sx*Math.sin(tilt)+sy*Math.cos(tilt);
   return {x:px*radius, y:py*radius, z:sz};
  };
  for (let latitude=-1.15;latitude<=1.2;latitude+=.38) {
   let points: Array<[number,number]> = [];
   for (let i=0;i<=100;i++) {
    const p=project(latitude,i/100*TAU);
    if(p.z>0)points.push([p.x,p.y]);
    else if(points.length){stroke(points,'rgba(16,29,20,.65)',3.5);stroke(points,`rgba(206,196,115,${.18-heat*.11})`,1);points=[]}
   }
   if(points.length){stroke(points,'rgba(16,29,20,.65)',3.5);stroke(points,`rgba(206,196,115,${.18-heat*.11})`,1)}
  }
  for(let j=0;j<6;j++) {
   let points: Array<[number,number]> = [];
   for(let i=0;i<=40;i++) {
    const p=project(-1.45+i/40*2.9,j/6*TAU + Math.sin(i/40*Math.PI)*.45);
    if(p.z>0)points.push([p.x,p.y]);
    else if(points.length){stroke(points,`rgba(203,197,131,${.12-heat*.08})`,1.5);points=[]}
   }
   if(points.length)stroke(points,`rgba(203,197,131,${.12-heat*.08})`,1.5);
  }
  for(let row=-2;row<=2;row++)for(let col=0;col<10;col++) {
   const p=project(row*.42,col/10*TAU+row*.34);
   if(p.z<=0)continue;
   const dotRadius=(1.5+p.z*2.2)*(radius/82);
   c.beginPath();c.arc(p.x,p.y,dotRadius+1,0,TAU);c.fillStyle='rgba(8,20,14,.7)';c.fill();
   c.beginPath();c.arc(p.x-.4,p.y-.5,dotRadius,0,TAU);c.fillStyle=`rgba(204,207,147,${(.14+p.z*.48)*(1-heat*.7)})`;c.fill();
  }
  // Uneven helical engravings break rotational symmetry and remain identifiable at speed.
  for(let track=0;track<3;track++)for(let echo=2;echo>=0;echo--) {
   if(echo&&!heat)continue;
   let previous:ReturnType<typeof project>|undefined;
   const lag=echo*Math.min(.28,state.speed*.005), alpha=echo?heat*.13/echo:1;
   for(let i=0;i<=65;i++) {
    const latitude=-1.42+i/65*2.84;
    const p=project(latitude,track*2.23+latitude*2.1+.16*Math.sin(latitude*3),lag);
    if(previous&&p.z>0&&previous.z>0) {
     const line:Array<[number,number]>=[[previous.x,previous.y],[p.x,p.y]];
     const depth=Math.min(previous.z,p.z),weight=(radius/82)*(.55+depth*1.5);
     if(!echo)stroke(line,'rgba(5,16,10,.82)',weight*4.1);
     stroke(line,`rgba(224,202,112,${alpha*(.16+depth*(.3+heat*.2))})`,weight*(echo?1.6:1.9));
     if(!echo)stroke(line,`rgba(255,235,168,${depth*(.12+heat*.2)})`,weight*.45);
    }
    previous=p;
   }
  }
  // Brightness travels through projected surface bands; their far-side portions are hidden.
  if(heat>.005)for(let band=0;band<7;band++) {
   const latitude=-1.12+band*.36;
   for(let section=0;section<12;section++) {
    const points:Array<[number,number]>=[];
    for(let i=0;i<=6;i++) {
     const longitude=-Math.PI/2+(section+i/6)/12*Math.PI;
     const p=project(latitude+.025*Math.sin(longitude*3+angle),longitude-angle);
     points.push([p.x,p.y]);
    }
    const longitude=-Math.PI/2+(section+.5)/12*Math.PI;
    const depth=Math.cos(longitude), pulse=Math.pow(.5+.5*Math.cos(longitude-angle+band*1.35),5);
    const opacity=heat*depth*(.11+pulse*.7), weight=(radius/82)*(1.2+pulse*2.5);
    stroke(points,`rgba(125,169,105,${opacity*.35})`,weight*4.5);
    stroke(points,`rgba(213,217,141,${opacity*.75})`,weight*1.8);
    stroke(points,`rgba(251,234,164,${opacity})`,weight*.6);
   }
  }
  // Staggered narrow surface echoes supply a readable directional cadence at high angular speed.
  if(heat>.005)for(let lane=0;lane<5;lane++)for(let echo=0;echo<4;echo++) {
   const points:Array<[number,number]>=[];
   const latitude=-.8+lane*.39;
   for(let i=0;i<=24;i++) {
    const longitude=orbit+lane*1.47-echo*.16-i/24*(.3+heat*.95);
    const p=project(latitude,longitude-angle);
    if(p.z>0)points.push([p.x,p.y]);
    else if(points.length){stroke(points,`rgba(227,223,157,${heat*(.47-echo*.1)})`,(1.65-echo*.23)*(radius/82));points.length=0}
   }
   if(points.length)stroke(points,`rgba(227,223,157,${heat*(.47-echo*.1)})`,(1.65-echo*.23)*(radius/82));
  }
  // Asymmetric surface landmarks leave curved trails, rather than blurring the whole ball.
  for(let mark=0;mark<3;mark++) {
   const latitude=[-.62,.16,.72][mark],longitude=[.2,2.65,4.1][mark];
   const trail:Array<[number,number]>=[];
   for(let i=0;i<=16;i++) {
    const p=project(latitude,longitude,i/16*Math.min(1.2,state.speed*.022));
    if(p.z>0)trail.push([p.x,p.y]);
   }
   if(heat>.05)stroke(trail,`rgba(225,204,125,${heat*.55})`,2.2);
   const p=project(latitude,longitude);
   if(p.z>0){c.save();c.translate(p.x,p.y);c.rotate(.6);c.fillStyle=`rgba(242,220,142,${.25+p.z*.6})`;c.fillRect(-2.4,-3,4.8,6);c.restore()}
  }
  if(heat>.05)for(let i=0;i<4;i++) {
   c.save();c.rotate(-.12);c.scale(1,.48);
   c.beginPath();c.arc(0,0,radius*(.53+i*.07),angle*.5+i*.7,angle*.5+i*.7+.6+heat*1.9);
   c.strokeStyle=`rgba(226,216,142,${heat*.14})`;c.lineWidth=1.2+i*.12;c.stroke();c.restore();
  }
  const sheen=c.createRadialGradient(-radius*.38,-radius*.48,0,-radius*.25,-radius*.32,radius*.8);
  sheen.addColorStop(0,'rgba(243,244,205,.3)');sheen.addColorStop(.4,'rgba(210,222,169,.06)');sheen.addColorStop(1,'rgba(200,210,160,0)');
  c.fillStyle=sheen;c.fillRect(-radius,-radius,radius*2,radius*2);c.restore();
  c.beginPath();c.arc(0,0,radius-.5,0,TAU);c.strokeStyle=`rgba(214,213,147,${.2+heat*.45})`;c.lineWidth=1.2;c.stroke();c.restore();

  // A logarithmic ribbon grows out of the sphere, then unwinds into an afterimage.
  if(energy>.003) {
   const reach=Math.min(width*.43,height*.43,radius*2.65);
   const maxRadius=radius*.82+state.spread*(reach-radius*.82);
   c.save();c.globalCompositeOperation='screen';
   for(let ribbon=0;ribbon<2;ribbon++) {
    const points: Array<[number,number]> = [];
    const total=TAU*.95, growth=Math.log(PHI)/(Math.PI/2);
    for(let i=0;i<=150;i++) {
     const t=i/150, a=t*total + orbit+ribbon*.65+Math.sin(orbit-t*4)*.65*(1-t);
     const r=radius*.76+(maxRadius-radius*.76)*(Math.exp(t*total*growth)-1)/(Math.exp(total*growth)-1);
     const twist=-.28+state.spread*.2;
     const px=Math.cos(a)*r,py=Math.sin(a)*r*(.32+state.spread*.25)+(t-.5)*radius*.55;
     points.push([px*Math.cos(twist)-py*Math.sin(twist),px*Math.sin(twist)+py*Math.cos(twist)]);
    }
    for(let segment=0;segment<10;segment++) {
     const t=segment/10,opacity=energy*(ribbon?.3:.82)*(1-t*.8);
     const part=points.slice(segment*15,segment*15+16);
     stroke(part,`rgba(179,130,39,${opacity*.13})`,7*(1-t*.65));
     stroke(part,`rgba(222,173,63,${opacity*.4})`,3.4*(1-t*.7));
     stroke(part,`rgba(246,218,128,${opacity*.85})`,1.65*(1-t*.65));
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
  timeline.to(state,{speed:16,charge:.45,pressure:.3,energy:0,spread:0,duration:.16*duration,ease:'power2.out'})
   .to(state,{speed:29,charge:.78,pressure:.7,duration:.4*duration,ease:'power2.in'})
   .to(state,{speed:52,charge:1,pressure:1,duration:.55*duration,ease:'power3.in'})
   .call(()=>setPhase('release'))
   .to(state,{speed:60,pressure:0,energy:1,spread:.86,duration:.38*duration,ease:'power3.out'})
   .to(state,{energy:.65,spread:1,charge:.7,duration:.58*duration,ease:'sine.out'})
   .call(()=>setPhase('afterglow'))
   .to(state,{speed:.3,charge:0,energy:0,pressure:0,duration:2.1*duration,ease:'power2.out'});
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
