import {visualScope} from '../visual-scope';
import type {Point} from '../../../framework/motion-hub/edge-physics';
import type {PlacementMotion} from '../../../framework/motion-hub/placement-motion';
import {createSphere,type HubAppearance} from './sphere';

/** Presentation-only rigid sphere and short-lived world-space trail. No position or input ownership. */
export function rigidSpin(root:HTMLElement,placement:PlacementMotion,acceptedPose?:()=>{angle:number}|undefined,appearance:HubAppearance='metal'){
 const scope=visualScope(),ball=root.querySelector<HTMLButtonElement>('.sf-motion-ball')!;
 const body=document.createElement('canvas'),field=document.createElement('canvas');
 body.className='spin-hub-canvas rigid-spin-body';field.className='rigid-spin-field';body.setAttribute('aria-hidden','true');field.setAttribute('aria-hidden','true');
 ball.append(body);root.prepend(field);
 const f=field.getContext('2d');if(!f){body.remove();field.remove();throw Error('Rigid spin canvas unavailable')}
 const fx=f;let surface:ReturnType<typeof createSphere>;let dead=false,pending=false,draws=0,last=0,energy=0,oldPhase='idle',lastPhysics=-1,width=0,height=0;
 type Mark=Point&{time:number};type Hit=Mark&{power:number};
 let trail:Mark[]=[],hits:Hit[]=[],previous:Point|undefined;
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const reduced=()=>media.matches||(document.documentElement.hasAttribute('data-dol-midnight')&&!document.documentElement.hasAttribute('data-dgu-visualMotion'));
 const read=()=>placement.read();
 function resize(){const dpr=Math.min(devicePixelRatio||1,2);width=root.clientWidth;height=root.clientHeight;field.width=Math.round(width*dpr);field.height=Math.round(height*dpr);fx.setTransform(dpr,0,0,dpr,0,0);wake()}
 function effects(now:number){
  fx.clearRect(0,0,width,height);trail=trail.filter(p=>now-p.time<250);hits=hits.filter(p=>now-p.time<340);
  const s=read();if(s&&energy>.02){
   const x=s.point.x+28,y=s.point.y+28,angle=surface.inspect().angle;
   const glow=fx.createRadialGradient(x,y,25,x,y,46);glow.addColorStop(0,`rgba(255,187,45,${energy*.6})`);glow.addColorStop(1,'rgba(255,164,20,0)');fx.fillStyle=glow;fx.fillRect(x-48,y-48,96,96);
   for(let k=0;k<3;k++){const a=angle*(k%2?-1:1)+k*2;fx.beginPath();fx.arc(x,y,30+k*3,a,a+.55+energy*.8);fx.strokeStyle=`rgba(255,211,94,${energy*(.7-k*.15)})`;fx.lineWidth=1.5;fx.stroke()}
   if(s.phase==='charging')for(let k=0;k<7;k++){const life=(now/420+k*.618)%1,a=angle*.3+k*2.4,r=30+life*16;fx.fillStyle=`rgba(255,222,129,${(1-life)*energy})`;fx.fillRect(x+Math.cos(a)*r,y+Math.sin(a)*r,1.4,1.4)}
  }
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
  if(document.hidden||reduced()){reset();surface.drive({energy:0,dt:0});return}
  if(s.phase==='charging'&&oldPhase!=='charging'){trail=[];hits=[];previous=undefined}
  if(s.phase==='flying'&&oldPhase!=='flying'){trail=[];if(previous)trail.push({...previous,time:now-16});hits.push({...s.point,time:now,power:1})}
  if(s.phase==='flying'&&s.frames!==lastPhysics){for(const contact of s.contacts??[]){trail.push({...contact,time:now});hits.push({...contact,time:now,power:.9})}trail.push({...s.point,time:now});trail=trail.slice(-100)}
  if(oldPhase==='flying'&&s.phase!=='flying'&&s.phase!=='idle'){trail=[];hits=[]}
  const target=s.phase==='charging'?.18+s.charge*.82:s.phase==='flying'?Math.min(1,Math.hypot(s.vx,s.vy)/2300):0;
  energy=active?target:Math.max(0,energy-dt*3);
  root.toggleAttribute('data-rigid-active',active||energy>.001);
  surface.drive({energy,dt,angle:active&&oldPhase!=='charging'&&oldPhase!=='flying'?acceptedPose?.()?.angle:undefined});draws++;effects(now);previous={...s.point};lastPhysics=s.frames;oldPhase=s.phase;
  if(active||energy>.001||trail.length||hits.length)wake();else last=0;
 }
 function wake(){if(!dead&&!pending&&!document.hidden&&!reduced()){pending=!!scope.frame(frame)}}
 function reset(){scope.cancelFrame(frame);pending=false;last=0;energy=0;trail=[];hits=[];oldPhase='idle';previous=undefined;root.removeAttribute('data-rigid-active');fx.clearRect(0,0,width,height)}
 scope.own(()=>{reset();body.remove();field.remove();root.removeAttribute('data-rigid-spin')});
 try{
 surface=createSphere(body,()=>{},appearance);scope.own(()=>surface.destroy());
 scope.own(placement.subscribe(wake));
 const flags=new MutationObserver(()=>{if(reduced())reset();wake()});scope.own(()=>flags.disconnect());flags.observe(document.documentElement,{attributes:true,attributeFilter:['data-dgu-visualmotion']});
 const size=new ResizeObserver(resize);scope.own(()=>size.disconnect());size.observe(root);
 const interrupt=()=>{reset();wake()};scope.own(()=>{document.removeEventListener('visibilitychange',interrupt);window.removeEventListener('blur',interrupt);media.removeEventListener('change',interrupt)});document.addEventListener('visibilitychange',interrupt);window.addEventListener('blur',interrupt);media.addEventListener('change',interrupt);
 root.setAttribute('data-rigid-spin','');
 resize();return{inspect:()=>({draws,pending,energy,trail:trail.length,hits:hits.length,bounces:read().bounces,phase:oldPhase}),destroy(){if(dead)return;dead=true;scope.dispose()}};
 }catch(error){dead=true;scope.dispose();throw error}
}
