import {rainModel, type Trail} from './rain-model';
import './wet-glass.css';
type Box={x:number;y:number;width:number;height:number};
type Frame={wet:number;snow:number;light:number;night:number;time:number;width:number;height:number;dpr:number;kind:string};
let instance=0;
/** Native SVG displacement reads the browser's backdrop. No DOM capture or substitute texture. */
export function wetGlass(canvas:HTMLCanvasElement,invalidate:()=>void,naturalTrails=false){
 const shell=canvas.parentElement!,ctx=canvas.getContext('2d')!,model=rainModel(0x27fa29,naturalTrails);
 const layer=document.createElement('div');layer.className='evo-material-layer evo-glass-layer';layer.setAttribute('aria-hidden','true');
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('width','0');svg.setAttribute('height','0');
 const prefix='evo-rain-'+(++instance),ids:string[]=[];
 for(let shape=0;shape<3;shape++){
  const map=document.createElement('canvas');map.width=96;map.height=96;const c=map.getContext('2d')!,pixels=c.createImageData(96,96);
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){
   const ny=(y-47.5)/48,nx=(x-47.5)/48/(1+ny*(shape-1)*.12),r=Math.hypot(nx,ny),fall=r<1?Math.sqrt(1-r*r):0,i=(y*96+x)*4;
   pixels.data[i]=128+nx*fall*122;pixels.data[i+1]=128+ny*fall*122;pixels.data[i+2]=128;pixels.data[i+3]=255;
  }
  c.putImageData(pixels,0,0);const id=prefix+'-'+shape;ids.push(id);
  const filter=document.createElementNS(ns,'filter');filter.id=id;
  for(const[k,v]of Object.entries({x:'-.5',y:'-.5',width:'2',height:'2',primitiveUnits:'objectBoundingBox','color-interpolation-filters':'sRGB'}))filter.setAttribute(k,v);
  const image=document.createElementNS(ns,'feImage');for(const[k,v]of Object.entries({x:'0',y:'0',width:'1',height:'1',preserveAspectRatio:'none',result:'lens',href:map.toDataURL()}))image.setAttribute(k,v);
  const displace=document.createElementNS(ns,'feDisplacementMap');for(const[k,v]of Object.entries({in:'SourceGraphic',in2:'lens',scale:'7.5',xChannelSelector:'R',yChannelSelector:'G'}))displace.setAttribute(k,v);
  filter.append(image,displace);svg.append(filter);
 }
 layer.append(svg);shell.prepend(layer);
 const wetNodes=Array.from({length:naturalTrails?32:0},()=>{const n=document.createElement('i');n.className='evo-wet-path';n.style.display='none';layer.append(n);return n});
 let wetBounds:Box[]=[];
 const nodes=Array.from({length:90},()=>{const n=document.createElement('i');n.className='evo-glass-drop';n.style.display='none';layer.append(n);return n});
 let seed=18972;const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
 const micro=Array.from({length:380},()=>({x:random(),y:random(),r:.22+Math.pow(random(),3)*.65,a:.25+random()*.75}));
 let protectedBoxes:Box[]=[],frameProtection:Box[]=[],active:Box[]=[],dirty=true,width=0,height=0,lastTime=0,visibleFlow=0,wasMoving=false;
 let layoutAnimations:Animation[]=[];
 const mark=()=>{dirty=true;invalidate()};const observer=new MutationObserver(mark);observer.observe(shell,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-workspace-transition','data-settings-layout','open']});shell.addEventListener('scroll',mark,true);
 const intersects=(a:Box,b:Box)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 function layout(w:number,h:number){
  model.resize(w,h);const base=canvas.getBoundingClientRect(),scale=base.width/w||1;
  const box=(r:DOMRect):Box=>({x:(r.x-base.x)/scale,y:(r.y-base.y)/scale,width:r.width/scale,height:r.height/scale});
  protectedBoxes=[];
  for(const el of shell.querySelectorAll('button,input,select,.dmt-reading-sample,.evo-toolbar,.dmt-settings-footer'))if(el.getClientRects().length)protectedBoxes.push(box(el.getBoundingClientRect()));
  const walker=document.createTreeWalker(shell,NodeFilter.SHOW_TEXT);let text:Node|null;
  while((text=walker.nextNode())){
   if(!text.textContent?.trim()||text.parentElement?.closest('.evo-material-layer,script,style'))continue;
   const range=document.createRange();range.selectNodeContents(text);
   for(const r of range.getClientRects())if(r.width&&r.height)protectedBoxes.push(box(r));
  }
  width=w;height=h;dirty=false;
 }
 function safe(b:Box,padding=5){return b.x>=1&&b.y>=1&&b.x+b.width<width-1&&b.y+b.height<height-1&&!frameProtection.some(p=>intersects(b,{x:p.x-padding,y:p.y-padding,width:p.width+padding*2,height:p.height+padding*2}))}
 // A clipped, translucent footprint changes actual backdrop pixels. It has no
 // continuous bright outline; its banks narrow as the deposited water dries.
 function wetPaths(trails:Trail[],humidity:number){
  const groups:Trail[][]=[];let group:Trail[]=[];
  for(const t of [...trails].sort((a,b)=>(a.strand!-b.strand!)||(a.distance!-b.distance!))){
   const pad=t.width+1,b={x:Math.min(t.x,t.endX)-pad,y:t.y-pad,width:Math.abs(t.x-t.endX)+pad*2,height:t.endY-t.y+pad*2};
   if(t.life<.18||!safe(b,7)){group=[];continue}
   const last=group.at(-1);
   if(!last||t.strand!==last.strand||Math.hypot(t.x-last.endX,t.y-last.endY)>2){group=[];groups.push(group)}
   group.push(t);
  }
  wetBounds=[];
  const visible=groups.filter(g=>g.length>=3).slice(-wetNodes.length);
  wetNodes.forEach((node,i)=>{
   const g=visible[i];if(!g||humidity<.015){node.style.display='none';return}
   const banks=(side:number)=>g.flatMap((t,j)=>{
    const dx=t.endX-t.x,dy=t.endY-t.y,len=Math.hypot(dx,dy)||1;
    const radius=t.width*(.22+.78*t.life)*(.8+side*.12);
    return [[t.x-side*dy/len*radius,t.y+side*dx/len*radius],...(j===g.length-1?[[t.endX-side*dy/len*radius*.7,t.endY+side*dx/len*radius*.7]]:[])];
   });
   const points=[...banks(1),...banks(-1).reverse()],xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
   const bounds={x,y,width:w,height:h};
   // Conservative final bounds avoid a footprint spanning text after a layout change.
   if(!safe(bounds,6)){node.style.display='none';return}
   wetBounds.push(bounds);Object.assign(node.style,{display:'block',left:x+'px',top:y+'px',width:w+'px',height:h+'px',clipPath:`polygon(${points.map(p=>`${(p[0]-x)/w*100}% ${(p[1]-y)/h*100}%`).join(',')})`,opacity:String(humidity*(.25+.55*g.at(-1)!.life))});
  });
 }
 function draw(s:Frame){
  // WAAPI geometry changes do not emit mutations. Protect the moving workspace
  // conservatively, then remeasure its final text/controls after cancellation or finish.
  if(dirty)layoutAnimations=shell.getAnimations({subtree:true}).filter(a=>a.effect instanceof KeyframeEffect&&a.effect.target instanceof Element&&a.effect.target.matches('.dmt-workspace-nav,.dmt-workspace-intro,.dmt-control-sheet,.dmt-reading-sample,.dmt-preview-lab,.dmt-workspace-section'));
  const movingLayout=layoutAnimations.some(a=>a.playState==='running');
  if(dirty||s.width!==width||s.height!==height||wasMoving&&!movingLayout)layout(s.width,s.height);
  frameProtection=protectedBoxes;
  const workspace=shell.querySelector('.dmt-workspace');
  if(movingLayout&&workspace){const r=workspace.getBoundingClientRect(),base=canvas.getBoundingClientRect(),scale=base.width/s.width||1;frameProtection=[...protectedBoxes,{x:(r.x-base.x)/scale-96,y:(r.y-base.y)/scale-48,width:r.width/scale+192,height:r.height/scale+96}]}
  wasMoving=movingLayout;
  const dt=Math.min(.05,Math.max(0,s.time-lastTime));lastTime=s.time;
  const humidity=s.wet*(1-s.snow*.8);model.step(dt,humidity);
  const state=model.snapshot();active=[];visibleFlow=0;ctx.clearRect(0,0,width,height);
  const luminance=.6+s.light*.4-s.night*.15;
  // Tiny attached surface droplets: no travelling particles or uniform screen-space veil.
  for(const p of micro){const x=5+p.x*(width-10),y=5+p.y*(height-10),r=p.r*Math.sqrt(humidity);if(r<.12||!safe({x:x-r,y:y-r,width:2*r,height:2*r},3))continue;
   ctx.strokeStyle=`rgba(194,215,222,${humidity*p.a*.25*luminance})`;ctx.lineWidth=.45;ctx.beginPath();ctx.ellipse(x,y,r,r*.82,-.2,0,Math.PI*.85);ctx.stroke();
   ctx.fillStyle=`rgba(0,9,16,${humidity*p.a*.24})`;ctx.fillRect(x-r*.5,y+r*.3,r,.4);
  }
  if(naturalTrails)wetPaths(state.trails,humidity);
  else for(const t of state.trails){const r={x:Math.min(t.x,t.endX)-2,y:t.y-1,width:Math.abs(t.x-t.endX)+4,height:t.endY-t.y+2};if(!safe(r,7))continue;
   ctx.strokeStyle=`rgba(172,201,207,${t.life*humidity*.085})`;ctx.lineWidth=Math.max(.45,t.width);ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(t.endX,t.endY);ctx.stroke();
  }
  nodes.forEach((node,i)=>{
   const d=state.drops[i];if(!d||humidity<.015){node.style.display='none';return}
   const r=Math.sqrt(d.area),stretch=1+Math.min(.55,d.vy*.012),rx=r/(Math.sqrt(stretch)),ry=r*Math.sqrt(stretch),b={x:d.x-rx,y:d.y-ry,width:rx*2,height:ry*2};
   if(!safe(b)){node.style.display='none';return}
   active.push(b);if(d.vy>0)visibleFlow++;
   const shape=Math.min(2,Math.floor(d.shape*3));
   Object.assign(node.style,{display:'block',left:b.x+'px',top:b.y+'px',width:b.width+'px',height:b.height+'px',borderRadius:d.vy>0?'47% 53% 51% 49% / 41% 38% 62% 59%':`${44+d.shape*9}% ${53-d.shape*7}% 49% 51% / 46% 42% 58% 54%`,backdropFilter:`url(#${ids[shape]})`,opacity:String(Math.min(1,humidity*1.35)),'--drop-light':String(luminance)});
   node.dataset.dropId=String(d.id);node.dataset.moving=String(d.vy>0);
  });
  const rim=ctx.createLinearGradient(0,0,width,height);rim.addColorStop(0,`rgba(184,209,214,${humidity*.28+s.snow*.3})`);rim.addColorStop(.3,'transparent');rim.addColorStop(1,`rgba(130,166,182,${humidity*.16+s.snow*.3})`);ctx.strokeStyle=rim;ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(1.5,1.5,width-3,height-3,21);ctx.stroke();
  if(s.snow>.01){ctx.strokeStyle=`rgba(207,230,238,${s.snow*.4})`;ctx.lineWidth=.5;for(let i=0;i<50;i++){const y=i*height/50,edge=i%2?width-2:2,sign=i%2?-1:1,len=(4+(i*19%17))*s.snow;ctx.beginPath();ctx.moveTo(edge,y);ctx.lineTo(edge+sign*len,y-len*.5);ctx.lineTo(edge+sign*len*.65,y-len*.8);ctx.stroke()}}
 }
 return{draw,count:nodes.length,layoutMoving:()=>wasMoving,snapshot:()=>{const s=model.snapshot();return{material:'glass',trailMode:naturalTrails?'natural-footprint':'linear-stroke',wetBounds,wetPaths:wetBounds.length,activeDrops:active.length,moving:visibleFlow,attached:active.length-visibleFlow,merges:s.merges,slides:s.slides,drained:s.drained,trailSegments:s.trails.length,protected:frameProtection,dropBounds:active,protectedOverlap:[...active,...wetBounds].filter(b=>frameProtection.some(q=>intersects(b,q))).length,backdropSupported:CSS.supports('backdrop-filter',`url(#${ids[0]})`),optics:'Native SVG backdrop displacement; approximate normal field, not a physical refraction solver',drops:s.drops}},dispose(){observer.disconnect();shell.removeEventListener('scroll',mark,true);layer.remove()}};
}
