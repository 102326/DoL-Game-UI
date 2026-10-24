import type {WeatherFrame} from './surface';

type Box={x:number;y:number;width:number;height:number};
const sample=(buffer:Float32Array,index:number)=>{const value=buffer[index];if(value===undefined)throw Error('Weather texture index out of bounds');return value};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};

/** Original sky/air textures, driven only by the window owner's existing clock. */
export function specialAtmosphere(){
 let seed=0x5a7e19;
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
 const grid=Float32Array.from({length:64*64},random);
 function noise(x:number,y:number,period:number){
  const ix=Math.floor(x),iy=Math.floor(y),u=smooth(0,1,x-ix),v=smooth(0,1,y-iy);
  const at=(a:number,b:number)=>sample(grid,((b%period+period)%period)*64+(a%period+period)%period);
  return(at(ix,iy)*(1-u)+at(ix+1,iy)*u)*(1-v)+(at(ix,iy+1)*(1-u)+at(ix+1,iy+1)*u)*v;
 }
 function field(x:number,y:number){let sum=0,weight=0,a=1,p=4;for(let i=0;i<5;i++){sum+=noise(x,y,p)*a;weight+=a;x*=2;y*=2;p*=2;a*=.5}return sum/weight}
 const make=(w:number,h:number)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
 const cloud=make(640,320),cc=cloud.getContext('2d')!,image=cc.createImageData(640,320);
 for(let y=0;y<320;y++)for(let x=0;x<640;x++){
  const u=x/640*4,v=y/320*4,warp=field(u+.7,v+1.8),f=field(u+warp*1.8,v*.75+field(u,v)*1.4);
  const density=smooth(.35,.72,f)*Math.sin(Math.PI*y/320)**1.5,thread=smooth(.53,.7,f),p=(y*640+x)*4;
  image.data[p]=75+thread*85;image.data[p+1]=49+thread*36;image.data[p+2]=112+thread*92;image.data[p+3]=255*density*.88;
 }
 cc.putImageData(image,0,0);
 const mist=make(640,320),mc=mist.getContext('2d')!,mi=mc.createImageData(640,320),thermal=make(640,320),tc=thermal.getContext('2d')!,ti=tc.createImageData(640,320);
 for(let y=0;y<320;y++)for(let x=0;x<640;x++){
  const f=field(x/640*4,y/320*2+1.5),p=(y*640+x)*4;
  mi.data[p]=130;mi.data[p+1]=176;mi.data[p+2]=199;mi.data[p+3]=255*smooth(.38,.7,f)*Math.sin(Math.PI*y/320)**2*.36;
  ti.data[p]=220;ti.data[p+1]=139;ti.data[p+2]=57;ti.data[p+3]=255*smooth(.4,.68,f)*Math.sin(Math.PI*y/320)**2*.24;
 }
 mc.putImageData(mi,0,0);
 tc.putImageData(ti,0,0);
 const stars=Array.from({length:26},()=>({x:random(),y:random()*.43,r:.45+random()*1.1,phase:random()*6.28}));
 const crystals=Array.from({length:32},(_,i)=>({side:i%4,t:random(),length:24+random()**2*65,angle:(random()-.5)*.6,alpha:.22+random()*.23}));
 const protection=make(1,1),pc=protection.getContext('2d')!;
 let disposed=false,lastBoxes:Box[]|undefined,lastKind='none';
 function glow(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,alpha:number){
  const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.4,`rgba(${color},${alpha*.5})`);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
 }
 function tiled(ctx:CanvasRenderingContext2D,texture:HTMLCanvasElement,w:number,h:number,t:number,speed:number,top:number,depth:number,alpha:number){
  const span=w*1.3,shift=((t*speed)%span+span)%span;ctx.save();ctx.globalAlpha*=alpha;
  for(let i=-1;i<=1;i++)ctx.drawImage(texture,i*span+shift,top,span,Math.min(h*.8,depth));ctx.restore();
 }
 function draw(ctx:CanvasRenderingContext2D,s:WeatherFrame,boxes:Box[]=[]){
  const kind=s.special;if(disposed||!['tentacle','heat','cold'].includes(kind??'')||!Number.isFinite(s.width+s.height+s.time))return;
  const amount=clamp(s.specialAmount??0);if(amount<.002)return;
  const {width:w,height:h,time:t}=s;lastKind=kind!;ctx.save();ctx.globalAlpha=amount;
  if(kind==='tentacle'){
   ctx.fillStyle='rgba(19,9,32,.22)';ctx.fillRect(0,0,w,h);
   ctx.globalCompositeOperation='screen';glow(ctx,w*.69,h*.13,Math.max(w*.6,h*.6),'106,37,170',.4);
   tiled(ctx,cloud,w,h,t,-10,-h*.08,440,.8);tiled(ctx,cloud,w,h,t,6,h*.06,310,.64);
   ctx.fillStyle='rgba(199,171,234,.6)';
   for(const p of stars){ctx.globalAlpha=amount*(.5+.2*Math.sin(t*.45+p.phase));ctx.beginPath();ctx.arc(p.x*w,p.y*h,p.r,0,Math.PI*2);ctx.fill()}
   ctx.globalAlpha=amount;glow(ctx,w*(.55+Math.sin(t*.09)*.08),h*.4,w*.55,'86,37,131',.16);
  }else if(kind==='heat'){
   ctx.globalCompositeOperation='screen';glow(ctx,w*.75,h*.06,Math.max(w*.52,h*.52),'209,111,42',.32);
   glow(ctx,w*.13,h*.5,w*.5,'158,65,24',.12);
   // Nonuniform rising air, without displacing or blurring the actual text.
   const depth=Math.min(h*.65,420),spacing=depth*.85,shift=t*15%spacing;
   for(let i=0;i<4;i++)ctx.drawImage(thermal,-w*.12+Math.sin(t*.18+i*2.7)*w*.06,i*spacing-shift-depth*.5,w*1.25,depth);
   ctx.globalAlpha=amount*.6;glow(ctx,w*(.65+Math.sin(t*.15)*.1),h*.28,w*.35,'255,185,83',.15);
  }else{
   ctx.globalCompositeOperation='screen';glow(ctx,w*.8,h*.05,Math.max(w*.6,h*.55),'93,157,191',.24);
   tiled(ctx,mist,w,h,t,7,-h*.04,380,.55);tiled(ctx,mist,w,h,t,-5,h*.32,320,.35);
   // Glass deposits stay attached; only real snow weather supplies falling flakes.
   const frost=1-clamp(s.snow*2);ctx.strokeStyle='rgba(185,222,238,.65)';
   for(const p of crystals){
    const len=Math.min(p.length,Math.min(w,h)*.17),x=p.side===0?3:p.side===1?w-3:p.t*w,y=p.side===2?3:p.side===3?h-3:p.t*h;
    ctx.save();ctx.globalAlpha=amount*p.alpha*frost;ctx.translate(x,y);ctx.rotate((p.side===0?0:p.side===1?Math.PI:p.side===2?Math.PI/2:-Math.PI/2)+p.angle);ctx.lineWidth=.7;
    ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(len*.55,-len*.08,len,0);
    for(let j=1;j<=5;j++){const a=j/6*len,b=(1-j/7)*len*.28;ctx.moveTo(a,0);ctx.lineTo(a-b*.7,-b);ctx.moveTo(a,0);ctx.lineTo(a-b*.7,b)}ctx.stroke();ctx.restore();
   }
  }
  ctx.restore();
  if(lastBoxes!==boxes||protection.width!==w||protection.height!==h){
   protection.width=w;protection.height=h;pc.fillStyle='black';pc.filter='blur(12px)';for(const p of boxes)pc.fillRect(p.x-24,p.y-24,p.width+48,p.height+48);lastBoxes=boxes;
  }
  ctx.save();ctx.globalCompositeOperation='destination-out';ctx.drawImage(protection,0,0,w,h);ctx.restore();for(const p of boxes)ctx.clearRect(p.x-2,p.y-2,p.width+4,p.height+4);
 }
 return{draw,snapshot:()=>({renderer:'special-atmosphere-s01',kind:lastKind,textures:4,disposed}),dispose(){disposed=true;for(const c of[cloud,mist,thermal,protection])c.width=c.height=0}};
}
