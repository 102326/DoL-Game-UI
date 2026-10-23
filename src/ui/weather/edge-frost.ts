import {featherSnow} from './snow-material';

type Box={x:number;y:number;width:number;height:number};
type Safe=(box:Box,padding?:number)=>boolean;

/** Settings-only frost glaze. R11's original feather study stays unchanged. */
export function frostedFeatherSnow(ctx:CanvasRenderingContext2D,safe:Safe){
 const feather=featherSnow(ctx,safe);
 let seed=0x107ac9;
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
 // Fixed asymmetric deposits: no per-frame random sparkle or separate clock.
 const deposits=Array.from({length:144},(_,i)=>({
  side:i%4,t:random(),depth:15+random()**2*29,span:24+random()*68,opacity:.18+random()*.2,
  grains:Array.from({length:18},()=>({x:random()**2,y:random(),size:.35+random()*1.1,angle:random()*Math.PI}))
 }));
 let edgeFrostBounds:Box[]=[];

 function draw(snow:number,time:number,width:number,height:number){
  edgeFrostBounds=[];
  if(snow>=.005&&width>8&&height>8){
   const growth=.25+.75*snow;
   ctx.save();
   for(const p of deposits){
    const vertical=p.side<2,along=vertical?height:width,across=vertical?width:height;
    const span=Math.min(p.span,along-4),depth=Math.min(p.depth*growth,across-4);
    const offset=2+p.t*(along-span-4);
    const b=vertical
     ?{x:p.side===0?2:width-depth-2,y:offset,width:depth,height:span}
     :{x:offset,y:p.side===2?2:height-depth-2,width:span,height:depth};
    if(!safe(b,5))continue;
    edgeFrostBounds.push(b);
    ctx.save();
    // Local x points into the glass, y follows its edge. All paint is clipped
    // to the same conservative box reported to the existing protection audit.
    ctx.beginPath();ctx.rect(b.x,b.y,b.width,b.height);ctx.clip();
    if(p.side===0)ctx.translate(b.x,b.y);
    else if(p.side===1){ctx.translate(b.x+b.width,b.y);ctx.scale(-1,1)}
    else if(p.side===2){ctx.translate(b.x,b.y);ctx.transform(0,1,1,0,0,0)}
    else{ctx.translate(b.x,b.y+b.height);ctx.transform(0,-1,1,0,0,0)}
    ctx.save();ctx.scale(depth,span*.5);
    const glaze=ctx.createRadialGradient(0,1,0,0,1,1);
    glaze.addColorStop(0,`rgba(216,235,246,${snow*p.opacity})`);
    glaze.addColorStop(.38,`rgba(190,217,236,${snow*p.opacity*.65})`);
    glaze.addColorStop(1,'rgba(190,217,236,0)');
    ctx.fillStyle=glaze;ctx.fillRect(0,0,1,2);ctx.restore();
    // Tiny uneven facets connect the thin glaze to the existing fern crystals.
    ctx.lineWidth=.5;
    for(const g of p.grains){
     const x=1+g.x*(depth-2),y=1+g.y*(span-2),r=g.size*(.4+.6*snow);
     const alpha=snow*(1-g.x)*.46;
     ctx.strokeStyle=`rgba(236,249,255,${alpha})`;
     const dx=Math.cos(g.angle)*r,dy=Math.sin(g.angle)*r;
     ctx.beginPath();ctx.moveTo(x-dx,y-dy);ctx.lineTo(x+dx,y+dy);
     ctx.moveTo(x+dy*.65,y-dx*.65);ctx.lineTo(x-dy*.65,y+dx*.65);ctx.stroke();
    }
    ctx.restore();
   }
   ctx.restore();
  }
  feather.draw(snow,time,width,height);
 }
 return{draw,snapshot:()=>{
  const base=feather.snapshot();
  return{...base,edgeFrostBounds,iceBounds:[...base.iceBounds,...edgeFrostBounds],icePlates:base.icePlates+edgeFrostBounds.length};
 }};
}
