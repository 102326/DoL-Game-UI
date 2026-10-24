import type {WeatherFrame} from './surface';

type Box={x:number;y:number;width:number;height:number};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(a:number,b:number,x:number)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};

/** Original procedural textures. The host supplies time, opacity, clipping and disposal. */
export function bloodMoonSky(){
 let seed=0x4b100d;
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
 const grid=Float32Array.from({length:128*128},random);
 function noise(x:number,y:number,period=128){
  const ix=Math.floor(x),iy=Math.floor(y),u=smooth(0,1,x-ix),v=smooth(0,1,y-iy);
  const at=(a:number,b:number)=>grid[((b%period+period)%period)*128+(a%period+period)%period];
  return(at(ix,iy)*(1-u)+at(ix+1,iy)*u)*(1-v)+(at(ix,iy+1)*(1-u)+at(ix+1,iy+1)*u)*v;
 }
 function fbm(x:number,y:number,octaves=5,period=4){
  let sum=0,weight=0,amplitude=1;
  for(let i=0;i<octaves;i++){sum+=noise(x,y,period)*amplitude;weight+=amplitude;x*=2;y*=2;period*=2;amplitude*=.5}
  return sum/weight;
 }
 function texture(w:number,h:number){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas}

 const size=384,moon=texture(size,size),height=new Float32Array(size*size),albedo=new Float32Array(size*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=y*size+x,u=x/size,v=y/size;
  height[i]=fbm(u*12,v*12,4,16)*.15;
  const sea=fbm(u*4+1.7,v*4+.8,5,8);
  albedo[i]=.33+.48*smooth(.33,.66,sea)+.18*(noise(u*100,v*100)-.5);
  for(const[cx,cy,rx,ry]of[[.42,.35,.19,.16],[.61,.41,.14,.18],[.34,.62,.16,.11],[.65,.68,.11,.13]]){
   const q=Math.hypot((u-cx)/rx,(v-cy)/ry)+(noise(u*14,v*14)-.5)*.4;
   albedo[i]*=1-.38*(1-smooth(.45,1.2,q));
  }
 }
 for(let i=0;i<240;i++){
  const cx=12+random()*(size-24),cy=12+random()*(size-24),r=1.2+Math.pow(random(),4)*18;
  for(let y=Math.max(0,Math.floor(cy-r*1.6));y<Math.min(size,Math.ceil(cy+r*1.6));y++)for(let x=Math.max(0,Math.floor(cx-r*1.6));x<Math.min(size,Math.ceil(cx+r*1.6));x++){
   const q=Math.hypot(x-cx,y-cy)/r;if(q>1.6)continue;const k=y*size+x;
   height[k]+=.035*Math.exp(-(((q-1)*8)**2))-.018*Math.exp(-((q*1.5)**4));
   albedo[k]*=1-.1*Math.exp(-((q*1.5)**4));
  }
 }
 const mc=moon.getContext('2d')!,mp=mc.createImageData(size,size),radius=size/2-2;
 for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++){
  const nx=(x-size/2)/radius,ny=(y-size/2)/radius,rr=nx*nx+ny*ny;if(rr>=1)continue;
  const i=y*size+x,z=Math.sqrt(1-rr),dx=(height[i+1]-height[i-1])*5,dy=(height[i+size]-height[i-size])*5;
  const illumination=clamp(.67+.22*z-.16*nx-.18*ny-dx*.8-dy*.7);
  const value=clamp(albedo[i]*illumination),shadow=.7+.3*smooth(-.9,.7,nx-ny*.2),p=i*4;
  mp.data[p]=Math.min(255,(28+value*182)*shadow);mp.data[p+1]=(10+value*61)*shadow;mp.data[p+2]=(16+value*51)*shadow;
  mp.data[p+3]=255*smooth(0,.035,1-Math.sqrt(rr));
 }
 mc.putImageData(mp,0,0);

 const cloudWidth=640,cloudHeight=256;
 function clouds(offset:number){
  const body=texture(cloudWidth,cloudHeight),rim=texture(cloudWidth,cloudHeight),density=new Float32Array(cloudWidth*cloudHeight);
  for(let y=0;y<cloudHeight;y++)for(let x=0;x<cloudWidth;x++){
   const u=x/cloudWidth*4,v=y/cloudHeight*4,warp=fbm(u+.9,v+offset,3)*1.8;
   const field=fbm(u+warp,v*.85+offset+fbm(u+2,v,3)*.6);
   const envelope=Math.pow(Math.sin(Math.PI*y/cloudHeight),.75);
   density[y*cloudWidth+x]=smooth(.36,.66,field)*envelope;
  }
  const bc=body.getContext('2d')!,rc=rim.getContext('2d')!,bp=bc.createImageData(cloudWidth,cloudHeight),rp=rc.createImageData(cloudWidth,cloudHeight);
  for(let y=0;y<cloudHeight;y++)for(let x=0;x<cloudWidth;x++){
   const i=y*cloudWidth+x,d=density[i],upper=density[Math.max(0,y-4)*cloudWidth+x],edge=clamp((d-upper)*4+.11*d*(1-d)),p=i*4;
   bp.data[p]=16+d*19;bp.data[p+1]=18+d*17;bp.data[p+2]=27+d*21;bp.data[p+3]=255*d*.92;
   rp.data[p]=132;rp.data[p+1]=57;rp.data[p+2]=53;rp.data[p+3]=255*edge*.65;
  }
  bc.putImageData(bp,0,0);rc.putImageData(rp,0,0);return{body,rim};
 }
 const far=clouds(3.7),near=clouds(8.2),cloudLight=texture(384,256),lc=cloudLight.getContext('2d')!;
 const protection=texture(1,1),pc=protection.getContext('2d')!;
 let disposed=false,lastMoon:Box|undefined,lastProtection:Box[]|undefined;
 function draw(ctx:CanvasRenderingContext2D,s:WeatherFrame,protectedBoxes:Box[]=[]){
  if(disposed||s.special!=='blood-moon'||!Number.isFinite(s.width+s.height+s.time))return;
  const amount=clamp(s.specialAmount??0);if(amount<.002)return;
  const {width:w,height:h,time:t}=s,r=Math.max(32,Math.min(76,w*.085,h*.095));
  const x=w*.73,y=Math.max(r+15,Math.min(119,h*.16));lastMoon={x:x-r,y:y-r,width:r*2,height:r*2};
  ctx.save();ctx.globalAlpha=amount;
  const sky=ctx.createRadialGradient(x,y,r*.3,x,y,Math.min(w*.7,h*.8));
  sky.addColorStop(0,'rgba(99,25,38,.29)');sky.addColorStop(.4,'rgba(55,18,34,.18)');sky.addColorStop(1,'transparent');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  const horizon=ctx.createLinearGradient(0,0,0,h*.66);horizon.addColorStop(0,'rgba(10,12,24,.24)');horizon.addColorStop(.48,'rgba(33,21,39,.14)');horizon.addColorStop(1,'transparent');ctx.fillStyle=horizon;ctx.fillRect(0,0,w,h*.66);
  function cloudLayer(texture:{body:HTMLCanvasElement;rim:HTMLCanvasElement},speed:number,top:number,ch:number,alpha:number){
   const cw=w*1.45,shift=((t*speed)%cw+cw)%cw;ctx.save();ctx.globalAlpha=amount*alpha;
   for(let i=-1;i<=1;i++)ctx.drawImage(texture.body,i*cw+shift,top,cw,ch);
   const px=x-r*2.4,py=y-r*1.6,pw=r*4.8,ph=r*3.2;
   lc.setTransform(1,0,0,1,0,0);lc.globalCompositeOperation='source-over';lc.clearRect(0,0,384,256);
   lc.setTransform(384/pw,0,0,256/ph,-px*384/pw,-py*256/ph);
   for(let i=-1;i<=1;i++)lc.drawImage(texture.rim,i*cw+shift,top,cw,ch);
   lc.globalCompositeOperation='destination-in';const spill=lc.createRadialGradient(x,y,r*.35,x,y,r*2.4);spill.addColorStop(0,'white');spill.addColorStop(1,'transparent');lc.fillStyle=spill;lc.fillRect(px,py,pw,ph);
   ctx.globalCompositeOperation='screen';ctx.globalAlpha=amount*alpha*.8;ctx.drawImage(cloudLight,px,py,pw,ph);
   ctx.restore();
  }
  cloudLayer(far,-4,y-r*1.4,Math.min(350,h*.46),.42);
  const corona=ctx.createRadialGradient(x,y,r*.78,x,y,r*2.8);corona.addColorStop(0,'rgba(199,39,45,.34)');corona.addColorStop(.38,'rgba(156,22,37,.18)');corona.addColorStop(1,'transparent');ctx.fillStyle=corona;ctx.fillRect(x-r*3,y-r*3,r*6,r*6);
  ctx.globalAlpha=amount*.9;ctx.drawImage(moon,x-r,y-r,r*2,r*2);
  cloudLayer(near,11,y-r*.8+Math.sin(t*.1)*5,Math.min(280,h*.34),.95);
  cloudLayer(far,-7,y-r*.55,Math.min(190,h*.24),.54);
  ctx.globalAlpha=amount;
  ctx.globalCompositeOperation='screen';
  const reflection=ctx.createRadialGradient(x,y+r*.8,r*.3,x,y+r*.8,Math.max(w*.62,h*.6));reflection.addColorStop(0,'rgba(197,27,39,.22)');reflection.addColorStop(.4,'rgba(153,15,33,.14)');reflection.addColorStop(1,'transparent');ctx.fillStyle=reflection;ctx.fillRect(0,0,w,h);
  ctx.restore();
  if(lastProtection!==protectedBoxes||protection.width!==w||protection.height!==h){
   protection.width=w;protection.height=h;pc.fillStyle='black';pc.filter='blur(12px)';
   for(const p of protectedBoxes)pc.fillRect(p.x-24,p.y-24,p.width+48,p.height+48);
   lastProtection=protectedBoxes;
  }
  ctx.save();ctx.globalCompositeOperation='destination-out';ctx.drawImage(protection,0,0,w,h);ctx.restore();
  // Keep protected pixels exact while the outside edge fades into the environment.
  for(const p of protectedBoxes)ctx.clearRect(p.x-2,p.y-2,p.width+4,p.height+4);
 }
 return{draw,snapshot:()=>({renderer:'blood-moon-study-01',textures:7,moon:lastMoon,disposed}),dispose(){disposed=true;for(const c of[moon,far.body,far.rim,near.body,near.rim,cloudLight,protection])c.width=c.height=0}};
}
