type Box={x:number;y:number;width:number;height:number};
/** Bounded attached ice plates and a few slow flakes, clipped away from reading/control geometry. */
export function frostSurface(ctx:CanvasRenderingContext2D,safe:(b:Box,padding?:number)=>boolean){
 let seed=0x619c;const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
 const plates=Array.from({length:84},(_,i)=>({side:i%4,t:random(),r:2.5+random()*5.5,inset:random()*15,angle:random()*Math.PI,aspect:.45+random()*.5,tone:random()}));
 const flakes=Array.from({length:24},()=>({x:random(),y:random(),r:.9+random()*1.7,speed:11+random()*13,phase:random()*Math.PI*2}));
 let iceBounds:Box[]=[],flakeBounds:Box[]=[];
 function draw(snow:number,time:number,width:number,height:number){
  iceBounds=[];flakeBounds=[];if(snow<.005)return;
  for(const p of plates){
   const r=p.r*(.3+.7*snow),inset=r+3+p.inset,t=p.t<.5?p.t*p.t*2:1-(1-p.t)*(1-p.t)*2;
   const x=p.side===0?inset:p.side===1?width-inset:inset+t*Math.max(0,width-inset*2),y=p.side===2?inset:p.side===3?height-inset:inset+t*Math.max(0,height-inset*2),b={x:x-r*1.6,y:y-r*1.6,width:r*3.2,height:r*3.2};
   if(!safe(b,4))continue;iceBounds.push(b);
   const haze=ctx.createRadialGradient(x,y,0,x,y,r*1.5);haze.addColorStop(0,`rgba(204,230,243,${snow*.19})`);haze.addColorStop(1,'transparent');ctx.fillStyle=haze;ctx.fillRect(b.x,b.y,b.width,b.height);
   ctx.save();ctx.translate(x,y);ctx.rotate(p.angle);ctx.scale(1,p.aspect);ctx.beginPath();
   for(let k=0;k<6;k++){const a=k*Math.PI/3,radius=r*(.7+.25*Math.sin(k*5+p.angle*3)),px=Math.cos(a)*radius,py=Math.sin(a)*radius;k?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();
   const ice=ctx.createLinearGradient(-r,-r,r,r);ice.addColorStop(0,`rgba(241,250,255,${snow*(.22+p.tone*.16)})`);ice.addColorStop(.5,`rgba(172,208,228,${snow*.13})`);ice.addColorStop(1,`rgba(231,245,252,${snow*.38})`);ctx.fillStyle=ice;ctx.fill();
   ctx.lineWidth=.55;ctx.strokeStyle=`rgba(229,246,255,${snow*.55})`;ctx.beginPath();for(let k=0;k<3;k++){const a=k*2.1+p.tone,len=r*(.55+k*.16),x=Math.cos(a)*len,y=Math.sin(a)*len;ctx.moveTo(0,0);ctx.lineTo(x,y);ctx.moveTo(x*.55,y*.55);ctx.lineTo(x*.55-Math.sin(a)*r*.24,y*.55+Math.cos(a)*r*.24)}ctx.stroke();ctx.restore();
  }
  for(const p of flakes){
   const r=p.r,x=p.x*width+Math.sin(time*.32+p.phase)*9,y=(p.y*(height+24)+time*p.speed)%(height+24)-12,b={x:x-r*2,y:y-r*2,width:r*4,height:r*4};
   if(!safe(b,5))continue;flakeBounds.push(b);
   const fade=Math.min(1,Math.max(0,y/18),Math.max(0,(height-y)/18)),alpha=snow*fade*(.5+p.r*.12);
   const glow=ctx.createRadialGradient(x,y,0,x,y,r*1.7);glow.addColorStop(0,`rgba(246,253,255,${alpha})`);glow.addColorStop(.38,`rgba(223,241,251,${alpha*.6})`);glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(b.x,b.y,b.width,b.height);
   if(r>1.7){ctx.strokeStyle=`rgba(234,248,255,${alpha*.7})`;ctx.lineWidth=.6;ctx.beginPath();for(let k=0;k<3;k++){const a=k*Math.PI/3+p.phase;ctx.moveTo(x-Math.cos(a)*r,y-Math.sin(a)*r);ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.stroke()}
  }
 }
 return{draw,snapshot:()=>({iceBounds,flakeBounds,icePlates:iceBounds.length,snowflakes:flakeBounds.length})};
}
