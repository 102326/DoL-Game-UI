// Isolated visual studies. No extra clock, DOM capture, assets or production selection.
type Box={x:number;y:number;width:number;height:number};
type Safe=(b:Box,padding?:number)=>boolean;
type Mode='feather'|'powder';
export const featherSnow=(ctx:CanvasRenderingContext2D,safe:Safe)=>snowMaterial(ctx,safe,'feather');
export const powderSnow=(ctx:CanvasRenderingContext2D,safe:Safe)=>snowMaterial(ctx,safe,'powder');
function snowMaterial(ctx:CanvasRenderingContext2D,safe:Safe,mode:Mode){
 let seed=0x48b51;const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
 // Geometry stays fixed while weather interpolates. Unequal sizes and clusters avoid a tiled border.
 const crystals=Array.from({length:64},(_,i)=>({side:i%4,t:rand(),size:10+rand()**2*33,inset:rand()*6,angle:(rand()-.5)*.7,branches:Array.from({length:7},()=>({length:.25+rand()*.65,spread:.3+rand()*.3,asym:.65+rand()*.7}))}));
 const powder=Array.from({length:124},(_,i)=>({side:i%4,t:rand(),r:1.8+rand()**2*7,inset:rand()**2*15,a:.12+rand()*.35}));
 const flakes=Array.from({length:18},()=>({x:rand(),y:rand(),r:.65+rand()**2*2.1,phase:rand()*Math.PI*2,speed:8+rand()*15}));
 let iceBounds:Box[]=[],flakeBounds:Box[]=[];
 function position(side:number,t:number,inset:number,w:number,h:number){return{x:side===0?inset:side===1?w-inset:8+t*(w-16),y:side===2?inset:side===3?h-inset:8+t*(h-16)}}
 function draw(snow:number,time:number,width:number,height:number){
  iceBounds=[];flakeBounds=[];if(snow<.005)return;
  const growth=.4+.6*snow;
  ctx.save();ctx.lineCap='round';
  if(mode==='feather')for(const p of crystals){
   const len=p.size*growth,pos=position(p.side,p.t,len*.65+7+p.inset,width,height),r=len*.62,b={x:pos.x-r,y:pos.y-r,width:r*2,height:r*2};
   if(!safe(b,5))continue;iceBounds.push(b);
   const haze=ctx.createRadialGradient(pos.x,pos.y,0,pos.x,pos.y,r);haze.addColorStop(0,`rgba(182,219,241,${snow*.13})`);haze.addColorStop(1,'transparent');ctx.fillStyle=haze;ctx.fillRect(b.x,b.y,b.width,b.height);
   ctx.save();ctx.translate(pos.x,pos.y);ctx.rotate((p.side===0?Math.PI/2:p.side===1?-Math.PI/2:p.side===2?Math.PI:0)+p.angle);
   // Fine asymmetric fern arms grow off one crystalline spine, with a shadow below the lit facets.
   for(const shadow of [true,false]){
    ctx.strokeStyle=shadow?`rgba(25,56,76,${snow*.22})`:`rgba(222,244,255,${snow*.58})`;ctx.lineWidth=shadow?1.4:.55;const dy=shadow?.6:0;
    ctx.beginPath();ctx.moveTo(0,len*.5+dy);ctx.quadraticCurveTo(len*.06,dy,0,-len*.5+dy);
    for(let j=0;j<7;j++){const t=(j+1)/9,y=len*(.43-t),a=p.branches[j]!,l=len*a.length*(1-t)*.4;for(const sign of [-1,1]){const sideLength=l*(sign>0?a.asym:1),bx=sign*sideLength,by=y-sideLength*a.spread;ctx.moveTo(0,y+dy);ctx.lineTo(bx,by+dy);ctx.moveTo(bx*.6,y+(by-y)*.6+dy);ctx.lineTo(bx*.88,y+(by-y)*.6-l*.2+dy)}}ctx.stroke();
   }
   ctx.restore();
  }
  else for(const p of powder){
   const radius=p.r*growth,pos=position(p.side,p.t,radius+3+(p.side<2?p.inset:p.inset*.15),width,height),b={x:pos.x-radius*1.6,y:pos.y-radius,width:radius*3.2,height:radius*2};
   // Fine powder gathers on horizontal ledges; side specks stay thinner.
   if((p.side<2&&p.r>4)||!safe(b,5))continue;iceBounds.push(b);
   const g=ctx.createLinearGradient(0,pos.y-radius,0,pos.y+radius);g.addColorStop(0,`rgba(249,253,255,${snow*(p.a+.15)})`);g.addColorStop(.45,`rgba(212,229,244,${snow*p.a})`);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.beginPath();for(let k=0;k<12;k++){const angle=k*Math.PI/6,rough=.7+.3*Math.sin(k*7+p.t*67);const x=pos.x+Math.cos(angle)*radius*1.5*rough,y=pos.y+Math.sin(angle)*radius*.65*rough;k?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();

   ctx.fillStyle=`rgba(244,251,255,${snow*.5})`;for(let k=0;k<5;k++){const gx=pos.x+Math.sin(k*13+p.t*17)*radius,gy=pos.y+Math.cos(k*7+p.t*11)*radius*.4;ctx.fillRect(gx,gy,.55+(k%2)*.4,.6)}
  }
  for(const p of flakes){
   const r=p.r,x=p.x*width+Math.sin(time*.23+p.phase)*13,y=(p.y*(height+20)+time*p.speed)%(height+20)-10,b={x:x-r*2,y:y-r*2,width:r*4,height:r*4};if(!safe(b,6))continue;flakeBounds.push(b);
   const fade=Math.max(0,Math.min(1,y/22,(height-y)/22)),g=ctx.createRadialGradient(x,y,0,x,y,r*1.8);g.addColorStop(0,`rgba(240,250,255,${snow*fade*(mode==='powder'?.65:.4)})`);g.addColorStop(.3,`rgba(222,240,250,${snow*fade*.25})`);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(b.x,b.y,b.width,b.height);
  }
  ctx.restore();
 }
 return{draw,snapshot:()=>({snowStudy:mode,iceBounds,flakeBounds,icePlates:iceBounds.length,snowflakes:flakeBounds.length})};
}
