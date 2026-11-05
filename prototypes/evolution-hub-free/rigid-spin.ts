import {visualScope} from '../../src/ui/visual-scope';
import type {Snapshot,Point} from './edge-physics';

/** Presentation-only rigid sphere and short-lived world-space trail. No position or input ownership. */
export function rigidSpin(root:HTMLElement){
 const scope=visualScope(),ball=root.querySelector<HTMLButtonElement>('.sf-motion-ball')!;
 const body=document.createElement('canvas'),field=document.createElement('canvas');
 body.className='rigid-spin-body';field.className='rigid-spin-field';body.setAttribute('aria-hidden','true');field.setAttribute('aria-hidden','true');
 ball.append(body);root.prepend(field);
 const c=body.getContext('2d'),f=field.getContext('2d');if(!c||!f){body.remove();field.remove();throw Error('Rigid spin canvas unavailable')}
 const ctx=c,fx=f;let dead=false,pending=false,draws=0,last=0,angle=0,energy=0,oldPhase='idle',lastPhysics=-1,width=0,height=0;
 type Mark=Point&{time:number};type Hit=Mark&{power:number};
 let trail:Mark[]=[],hits:Hit[]=[],previous:Point|undefined;
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const reduced=()=>media.matches||(document.documentElement.hasAttribute('data-dol-midnight')&&!document.documentElement.hasAttribute('data-dgu-visualMotion'));
 const read=()=>Reflect.get(root,'edgeResearchState') as Snapshot&{frames:number;contacts?:Point[];bounces?:number}|undefined;
 function resize(){const dpr=Math.min(devicePixelRatio||1,2);width=root.clientWidth;height=root.clientHeight;body.width=body.height=Math.round(96*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);field.width=Math.round(width*dpr);field.height=Math.round(height*dpr);fx.setTransform(dpr,0,0,dpr,0,0);wake()}
 function sphere(now:number,charging:boolean){
  draws++;ctx.clearRect(0,0,96,96);ctx.save();ctx.translate(48,48);const r=27;
  if(energy>.02){const glow=ctx.createRadialGradient(0,0,25,0,0,46);glow.addColorStop(0,`rgba(255,187,45,${energy*.6})`);glow.addColorStop(1,'rgba(255,164,20,0)');ctx.fillStyle=glow;ctx.fillRect(-48,-48,96,96)}
  const metal=ctx.createRadialGradient(-11,-13,2,2,3,32);metal.addColorStop(0,'#d0d4ab');metal.addColorStop(.19,'#839374');metal.addColorStop(.45,'#344a3d');metal.addColorStop(.68,'#67765c');metal.addColorStop(.83,'#293b31');metal.addColorStop(1,'#101b19');
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fillStyle=metal;ctx.fill();ctx.save();ctx.clip();
  // Project rotating surface meridians onto a sphere. Only the texture rotates; the silhouette never scales.
  ctx.rotate(-.48);for(let k=0;k<10;k++){
   const a=angle+k*Math.PI/5;ctx.beginPath();let started=false;
   for(let j=0;j<=40;j++){const latitude=-Math.PI/2+j*Math.PI/40,x=r*Math.cos(latitude)*Math.sin(a),y=r*Math.sin(latitude),z=Math.cos(latitude)*Math.cos(a);if(z<0){started=false;continue}if(!started){ctx.moveTo(x,y);started=true}else ctx.lineTo(x,y)}
   ctx.strokeStyle=k%2?`rgba(236,208,119,${.28+energy*.28})`:'rgba(5,15,12,.62)';ctx.lineWidth=k%2?1:2.2;ctx.stroke();
  }
  for(const y of [-17,-8,6,17]){ctx.beginPath();ctx.ellipse(0,y,Math.sqrt(r*r-y*y),2.5,0,0,Math.PI*2);ctx.strokeStyle='rgba(19,29,24,.44)';ctx.lineWidth=1;ctx.stroke()}
  ctx.restore();
  const glint=ctx.createRadialGradient(-10,-12,0,-10,-12,14);glint.addColorStop(0,'rgba(255,255,229,.68)');glint.addColorStop(.25,'rgba(255,248,207,.19)');glint.addColorStop(1,'rgba(255,255,229,0)');ctx.fillStyle=glint;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(0,0,26.5,0,Math.PI*2);ctx.strokeStyle=`rgba(223,205,142,${.34+.4*energy})`;ctx.lineWidth=1;ctx.stroke();
  if(energy>.04){for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(0,0,30+k*3,angle*(k%2?-1:1)+k*2,angle*(k%2?-1:1)+k*2+.55+energy*.8);ctx.strokeStyle=`rgba(255,211,94,${energy*(.7-k*.15)})`;ctx.lineWidth=1.5;ctx.stroke()}}
  if(charging){for(let k=0;k<7;k++){const life=(now/420+k*.618)%1,a=angle*.3+k*2.4,rr=30+life*16;ctx.fillStyle=`rgba(255,222,129,${(1-life)*energy})`;ctx.fillRect(Math.cos(a)*rr,Math.sin(a)*rr,1.4,1.4)}}
  ctx.restore();
 }
 function effects(now:number){
  fx.clearRect(0,0,width,height);trail=trail.filter(p=>now-p.time<250);hits=hits.filter(p=>now-p.time<340);
  // Independent aged segments follow recent physical positions, never a tether to the launch point.
  fx.lineCap='round';fx.globalCompositeOperation='lighter';
  for(let i=1;i<trail.length;i++){const a=trail[i-1]!,b=trail[i]!,q=Math.max(0,1-(now-b.time)/250);if(Math.hypot(a.x-b.x,a.y-b.y)<.2)continue;
   for(const [w,alpha,color]of [[17,.09,'255,151,17'],[7,.3,'255,186,44'],[2,.85,'255,240,173']] as const){fx.beginPath();fx.moveTo(a.x+28,a.y+28);fx.lineTo(b.x+28,b.y+28);fx.lineWidth=w*q;fx.strokeStyle=`rgba(${color},${q*q*alpha})`;fx.stroke()}
   const len=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;
   for(const side of [-1,1]){const wa=Math.sin(a.time*.045-now*.02)*7*q*side,wb=Math.sin(b.time*.045-now*.02)*7*q*side;fx.beginPath();fx.moveTo(a.x+28+nx*wa,a.y+28+ny*wa);fx.lineTo(b.x+28+nx*wb,b.y+28+ny*wb);fx.strokeStyle=`rgba(255,205,75,${q*.45})`;fx.lineWidth=1;fx.stroke()}
   if(i%3===0){const nx=-(b.y-a.y),ny=b.x-a.x,len=Math.hypot(nx,ny)||1,wave=Math.sin(i*1.7+now*.018)*6*q;fx.fillStyle=`rgba(255,218,104,${q*.7})`;fx.beginPath();fx.arc(b.x+28+nx/len*wave,b.y+28+ny/len*wave,1.2*q,0,Math.PI*2);fx.fill()}
  }
  for(const h of hits){const t=(now-h.time)/340,q=1-t,x=h.x+28,y=h.y+28;fx.strokeStyle=`rgba(255,218,121,${q*.6*h.power})`;fx.lineWidth=1.5*q;fx.beginPath();fx.arc(x,y,12+t*42,0,Math.PI*2);fx.stroke();
   for(let k=0;k<9;k++){const a=k*2.399;fx.strokeStyle=`rgba(255,210,90,${q*q*.8})`;fx.beginPath();fx.moveTo(x+Math.cos(a)*(12+t*45),y+Math.sin(a)*(12+t*45));fx.lineTo(x+Math.cos(a)*(17+t*65),y+Math.sin(a)*(17+t*65));fx.stroke()}
  }fx.globalCompositeOperation='source-over';
 }
 function frame(){
  pending=false;if(dead)return;const now=performance.now(),s=read();if(!s)return;
  const dt=last?Math.min(50,now-last)/1000:0;last=now;
  const active=s.phase==='charging'||s.phase==='flying';
  if(document.hidden||reduced()){reset();sphere(now,false);return}
  if(s.phase==='charging'&&oldPhase!=='charging'){trail=[];hits=[];previous=undefined}
  if(s.phase==='flying'&&oldPhase!=='flying'){trail=[];if(previous)trail.push({...previous,time:now-16});hits.push({...s.point,time:now,power:1})}
  if(s.phase==='flying'&&s.frames!==lastPhysics){for(const contact of s.contacts??[]){trail.push({...contact,time:now});hits.push({...contact,time:now,power:.9})}trail.push({...s.point,time:now});trail=trail.slice(-100)}
  if(oldPhase==='flying'&&s.phase!=='flying'&&s.phase!=='idle'){trail=[];hits=[]}
  const target=s.phase==='charging'?.18+s.charge*.82:s.phase==='flying'?Math.min(1,Math.hypot(s.vx,s.vy)/2300):0;
  energy=active?target:Math.max(0,energy-dt*3);angle+=energy*68*dt;
  sphere(now,s.phase==='charging');effects(now);previous={...s.point};lastPhysics=s.frames;oldPhase=s.phase;
  if(active||energy>.001||trail.length||hits.length)wake();else last=0;
 }
 function wake(){if(!dead&&!pending){pending=!!scope.frame(frame)}}
 function reset(){scope.cancelFrame(frame);pending=false;last=0;energy=0;trail=[];hits=[];oldPhase='idle';previous=undefined;fx.clearRect(0,0,width,height)}
 scope.own(()=>{reset();body.remove();field.remove();root.removeAttribute('data-rigid-spin');Reflect.deleteProperty(root,'rigidResearchState')});
 try{
 const observer=new MutationObserver(wake);scope.own(()=>observer.disconnect());observer.observe(root,{attributes:true,attributeFilter:['data-edge-phase','data-edge-charge']});
 const flags=new MutationObserver(()=>{if(reduced())reset();wake()});scope.own(()=>flags.disconnect());flags.observe(document.documentElement,{attributes:true,attributeFilter:['data-dgu-visualmotion']});
 const size=new ResizeObserver(resize);scope.own(()=>size.disconnect());size.observe(root);
 const interrupt=()=>{reset();wake()};scope.own(()=>{document.removeEventListener('visibilitychange',interrupt);window.removeEventListener('blur',interrupt);media.removeEventListener('change',interrupt)});document.addEventListener('visibilitychange',interrupt);window.addEventListener('blur',interrupt);media.addEventListener('change',interrupt);
 root.setAttribute('data-rigid-spin','');Object.defineProperty(root,'rigidResearchState',{configurable:true,get:()=>({draws,pending,energy,trail:trail.length,hits:hits.length,phase:oldPhase})});
 resize();return{destroy(){if(dead)return;dead=true;scope.dispose()}};
 }catch(error){dead=true;scope.dispose();throw error}
}
