import {visualScope} from '../visual-scope';
import {rainModel, type Trail} from './rain-model';
import './wet-glass.css';
import showerUrl from '../../theme/kw-weather-shower.svg';
import forceUrl from './shower-force.svg';
import {frostSurface} from './frost';
import {scatteredShower} from './scattered-shower';
import {bloodMoonSky} from './blood-moon';
import {specialAtmosphere} from './special-atmosphere';
import type {WeatherFrame as Frame} from './surface';
type Box={x:number;y:number;width:number;height:number};
type Frost=ReturnType<typeof frostSurface>;
type FrostSnapshot=ReturnType<Frost['snapshot']>;
type FrostFactory<T extends FrostSnapshot=FrostSnapshot>=(...args:Parameters<typeof frostSurface>)=>Omit<Frost,'snapshot'>&{snapshot:()=>T};
let instance=0;
/** Native SVG displacement reads the browser's backdrop. No DOM capture or substitute texture. */
export function wetGlass<T extends FrostSnapshot>(canvas:HTMLCanvasElement,invalidate:()=>void,naturalTrails:boolean,runoff:boolean,climate:boolean,withShower:boolean,withForce:boolean|'scatter',makeFrost:FrostFactory<T>,specialSkies?:boolean):ReturnType<typeof createWetGlass<T>>;
export function wetGlass(canvas:HTMLCanvasElement,invalidate:()=>void,naturalTrails?:boolean,runoff?:boolean,climate?:boolean,withShower?:boolean,withForce?:boolean|'scatter',makeFrost?:FrostFactory,specialSkies?:boolean):ReturnType<typeof createWetGlass<FrostSnapshot>>;
export function wetGlass(canvas:HTMLCanvasElement,invalidate:()=>void,naturalTrails=false,runoff=false,climate=false,withShower=false,withForce:boolean|'scatter'=false,makeFrost:FrostFactory=frostSurface,specialSkies=false){
 return createWetGlass(canvas,invalidate,naturalTrails,runoff,climate,withShower,withForce,makeFrost,specialSkies);
}
function createWetGlass<T extends FrostSnapshot>(canvas:HTMLCanvasElement,invalidate:()=>void,naturalTrails:boolean,runoff:boolean,climate:boolean,withShower:boolean,withForce:boolean|'scatter',makeFrost:FrostFactory<T>,specialSkies:boolean){
 const scope=visualScope();
 try{
 const scatter=withForce==='scatter',field=scatter?scatteredShower():undefined;let showerGeometry:ReturnType<ReturnType<typeof scatteredShower>['step']>['streaks']=[];
 let showerEnabled=withShower,showerPhase=0;const showerImage=withShower&&!scatter?new Image():undefined;if(showerImage){showerImage.onload=()=>invalidate();showerImage.src=withForce?forceUrl:showerUrl;scope.own(()=>{showerImage.onload=null})}
 const shell=canvas.parentElement!,ctx=canvas.getContext('2d')!,model=rainModel(0x27fa29,naturalTrails,runoff);
 // Build special textures only when first needed; ordinary settings open without this work.
 let blood:ReturnType<typeof bloodMoonSky>|undefined,atmosphere:ReturnType<typeof specialAtmosphere>|undefined;
 scope.own(()=>blood?.dispose());scope.own(()=>atmosphere?.dispose());
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
 layer.append(svg);shell.prepend(layer);scope.own(()=>layer.remove());
 const wetNodes=Array.from({length:naturalTrails?32:0},()=>{const n=document.createElement('i');n.className='evo-wet-path';n.style.display='none';layer.append(n);return n});
 let wetBounds:Box[]=[];
 const nodes=Array.from({length:90},()=>{const n=document.createElement('i');n.className='evo-glass-drop';n.style.display='none';layer.append(n);return n});
 let seed=18972;const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
 const micro=Array.from({length:scatter?380:withForce?912:climate?570:380},()=>({x:random(),y:random(),r:.22+Math.pow(random(),3)*.65,a:.25+random()*.75}));
 let rainEnergy=1,rainAmount=1,showerDensity=0,showerSpeed=0,microVisible=0;const frost=climate?makeFrost(ctx,safe):undefined;
 let protectedBoxes:Box[]=[],frameProtection:Box[]=[],active:Box[]=[],dirty=true,width=0,height=0,lastTime=0,visibleFlow=0,wasMoving=false;
 let layoutAnimations:Animation[]=[];
 const mark=()=>{if(!scope.active())return;dirty=true;invalidate()};const observer=new MutationObserver(mark);scope.own(()=>observer.disconnect());observer.observe(shell,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-workspace-transition','data-settings-layout','open']});shell.addEventListener('scroll',mark,true);scope.own(()=>shell.removeEventListener('scroll',mark,true));
 const intersects=(a:Box,b:Box)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 function layout(w:number,h:number){
  model.resize(w,h);const base=canvas.getBoundingClientRect(),scale=base.width/w||1,scaleY=base.height/h||1;
  const box=(r:DOMRect):Box=>({x:(r.x-base.x)/scale,y:(r.y-base.y)/scaleY,width:r.width/scale,height:r.height/scaleY});
  protectedBoxes=[];
  for(const el of shell.querySelectorAll('button,input,select,.dmt-reading-sample'+(runoff?'':',.evo-toolbar,.dmt-settings-footer')))if(el.getClientRects().length)protectedBoxes.push(box(el.getBoundingClientRect()));
  const walker=document.createTreeWalker(shell,NodeFilter.SHOW_TEXT);let text:Node|null;
  while((text=walker.nextNode())){
   if(!text.textContent?.trim()||text.parentElement?.closest('.evo-material-layer,script,style'))continue;
   const range=document.createRange();range.selectNodeContents(text);
   for(const r of range.getClientRects())if(r.width&&r.height)protectedBoxes.push(box(r));
  }
  width=w;height=h;dirty=false;
 }
 function safe(b:Box,padding=5,edge=false){if(edge)b={x:Math.max(0,b.x),y:Math.max(0,b.y),width:Math.min(width,b.x+b.width)-Math.max(0,b.x),height:Math.min(height,b.y+b.height)-Math.max(0,b.y)};return (edge?b.width>0&&b.height>0: b.x>=1&&b.y>=1&&b.x+b.width<width-1&&b.y+b.height<height-1)&&!frameProtection.some(p=>intersects(b,{x:p.x-padding,y:p.y-padding,width:p.width+padding*2,height:p.height+padding*2}))}
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
   const banks=(side:number):[number,number][]=>g.flatMap((t,j):[number,number][]=>{
    const dx=t.endX-t.x,dy=t.endY-t.y,len=Math.hypot(dx,dy)||1;
    const radius=t.width*(.22+.78*t.life)*(.8+side*.12);
    const start:[number,number]=[t.x-side*dy/len*radius,t.y+side*dx/len*radius];return j===g.length-1?[start,[t.endX-side*dy/len*radius*.7,t.endY+side*dx/len*radius*.7]]:[start];
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
  if(dirty||specialSkies&&movingLayout||s.width!==width||s.height!==height||wasMoving&&!movingLayout)layout(s.width,s.height);
  frameProtection=protectedBoxes;
  const workspace=shell.querySelector('.dmt-workspace');
  if(movingLayout&&workspace){const r=workspace.getBoundingClientRect(),base=canvas.getBoundingClientRect(),scale=base.width/s.width||1;frameProtection=[...protectedBoxes,{x:(r.x-base.x)/scale-96,y:(r.y-base.y)/scale-48,width:r.width/scale+192,height:r.height/scale+96}]}
  wasMoving=movingLayout;
  const dt=Math.min(.05,Math.max(0,s.time-lastTime));lastTime=s.time;
  const humidity=s.wet*(1-s.snow*.8);rainEnergy=withForce?1.05+s.intensity*.85:1;rainAmount=climate?Math.min(2,s.intensity*(scatter?.8:withForce?1.4:1)):1;model.step(dt,humidity,rainAmount,rainEnergy);
  const state=model.snapshot();active=[];visibleFlow=0;ctx.clearRect(0,0,width,height);
  const special=s.special??'none',amount=s.specialAmount??0;
  if(specialSkies&&special==='blood-moon'&&amount>.002){
   blood??=bloodMoonSky();blood.draw(ctx,s,protectedBoxes);
  }else if(specialSkies&&['tentacle','heat','cold'].includes(special)&&amount>.002){
   atmosphere??=specialAtmosphere();atmosphere.draw(ctx,s,protectedBoxes);
  }else if(special!=='none'&&amount>.002){
   const color=({'blood-moon':'171,45,51',tentacle:'125,68,175',heat:'211,139,65',cold:'133,189,215'} as const)[special];
   const x=width*(.76+Math.sin(s.time*.12)*.035),y=Math.min(90,height*.16),radius=Math.min(width*.3,height*.34);
   const halo=ctx.createRadialGradient(x,y,0,x,y,radius);halo.addColorStop(0,`rgba(${color},${amount*.38})`);halo.addColorStop(.45,`rgba(${color},${amount*.16})`);halo.addColorStop(1,'transparent');ctx.fillStyle=halo;ctx.fillRect(0,0,width,height);
   if(special==='blood-moon'){
    const r=Math.min(28,width*.035),moon=ctx.createRadialGradient(x-r*.3,y-r*.3,1,x,y,r);moon.addColorStop(0,`rgba(224,132,118,${amount*.7})`);moon.addColorStop(.7,`rgba(140,40,47,${amount*.65})`);moon.addColorStop(1,`rgba(57,13,24,${amount*.25})`);ctx.fillStyle=moon;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
   }
   const shadow=ctx.createRadialGradient(width*(.55+Math.sin(s.time*.17)*.12),height*.16,0,width*.55,height*.16,width*.48);shadow.addColorStop(0,`rgba(4,6,12,${amount*(.14+Math.sin(s.time*.3)*.05)})`);shadow.addColorStop(1,'transparent');ctx.fillStyle=shadow;ctx.fillRect(0,0,width,height*.7);
   for(const p of frameProtection)ctx.clearRect(p.x-7,p.y-7,p.width+14,p.height+14);
  }
  // Reuse the owned 3.x shower artwork and down-right tile motion. Draw first,
  // then erase the union of protected rectangles before painting the existing glass.
  // No second canvas, timer or RAF; pause/hidden/reduced motion share the original clock.
  showerDensity=0;showerSpeed=0;showerGeometry=[];
  if(showerEnabled&&field&&humidity*(1-s.snow)>.005){
   const rain=field.step(dt,width,height,s.intensity);showerPhase=rain.clock;showerDensity=rain.budget;showerSpeed=rain.speed;
   ctx.save();ctx.lineCap='round';
   for(const p of rain.streaks){
    const b={x:Math.min(p.x,p.tailX)-2,y:Math.min(p.y,p.tailY)-2,width:Math.abs(p.x-p.tailX)+4,height:Math.abs(p.y-p.tailY)+4};
    if(p.opacity<=.005||!safe(b,4,true))continue;showerGeometry.push(p);
    const g=ctx.createLinearGradient(p.tailX,p.tailY,p.x,p.y),alpha=p.opacity*humidity*(1-s.snow);g.addColorStop(0,'transparent');g.addColorStop(.65,`rgba(200,222,231,${alpha*.5})`);g.addColorStop(1,`rgba(229,243,247,${alpha})`);ctx.strokeStyle=g;ctx.lineWidth=p.width;ctx.beginPath();ctx.moveTo(p.tailX,p.tailY);ctx.lineTo(p.x,p.y);ctx.stroke();
   }
   ctx.restore();
  }
  else if(showerEnabled&&showerImage?.complete&&showerImage.naturalWidth&&humidity*(1-s.snow)>.005){
   const scale=withForce?1.1-.1*s.intensity:1.3-.25*s.intensity,tw=560*scale,th=320*scale,rate=withForce?(.85+s.intensity*1.5)/(2.89*scale):(.5+s.intensity*.5)/2.89;
   showerPhase=(showerPhase+dt*rate)%1;showerDensity=withForce?.75+s.intensity*1.5:1;showerSpeed=3*th*rate;
   ctx.save();for(let layer=0;layer<Math.ceil(showerDensity);layer++){
    const dx=(showerPhase+layer*.371)%1*tw,dy=(showerPhase*3+layer*.613)%1*th;
    ctx.globalAlpha=Math.min(1,humidity*(1-s.snow)*(withForce?.8+s.intensity*.3:.55+s.intensity*.35))*Math.min(1,showerDensity-layer);
    for(let y=-th+dy;y<height;y+=th)for(let x=-tw+dx;x<width;x+=tw)ctx.drawImage(showerImage,x,y,tw,th);
   }
   ctx.restore();for(const p of frameProtection)ctx.clearRect(p.x-7,p.y-7,p.width+14,p.height+14);
  }
  const luminance=.6+s.light*.4-s.night*.15;
  // Tiny attached surface droplets: no travelling particles or uniform screen-space veil.
  microVisible=0;for(const [i,p] of micro.entries()){const density=climate?Math.min(1,Math.max(0,380*s.intensity*(scatter?.65:withForce?1.6:1)-i)):1;if(!density)continue;const x=5+p.x*(width-10),y=5+p.y*(height-10),r=p.r*Math.sqrt(humidity);if(r<.12||!safe({x:x-r,y:y-r,width:2*r,height:2*r},3))continue;microVisible++;
   ctx.strokeStyle=`rgba(194,215,222,${humidity*p.a*.25*luminance*density})`;ctx.lineWidth=.45;ctx.beginPath();ctx.ellipse(x,y,r,r*.82,-.2,0,Math.PI*.85);ctx.stroke();
   ctx.fillStyle=`rgba(0,9,16,${humidity*p.a*.24*density})`;ctx.fillRect(x-r*.5,y+r*.3,r,.4);
  }
  if(naturalTrails)wetPaths(state.trails,humidity);
  else for(const t of state.trails){const r={x:Math.min(t.x,t.endX)-2,y:t.y-1,width:Math.abs(t.x-t.endX)+4,height:t.endY-t.y+2};if(!safe(r,7))continue;
   ctx.strokeStyle=`rgba(172,201,207,${t.life*humidity*.085})`;ctx.lineWidth=Math.max(.45,t.width);ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(t.endX,t.endY);ctx.stroke();
  }
  nodes.forEach((node,i)=>{
   const d=state.drops[i];if(!d||humidity<.015){node.style.display='none';delete node.dataset.dropId;delete node.dataset.runoff;delete node.dataset.moving;return}
   const r=Math.sqrt(d.area),stretch=1+Math.min(.55,d.vy*.012),rx=r/(Math.sqrt(stretch)),ry=r*Math.sqrt(stretch),b={x:d.x-rx,y:d.y-ry,width:rx*2,height:ry*2};
   const density=climate&&!d.runoff?Math.min(1,Math.max(0,(s.intensity-.1-d.shape*.72)/.16)):1;
   if(density<=.001||!safe(b,5,!!d.runoff)){node.style.display='none';delete node.dataset.dropId;delete node.dataset.runoff;delete node.dataset.moving;return}
   active.push(b);if(d.vy>0)visibleFlow++;
   const shape=Math.min(2,Math.floor(d.shape*3));
   Object.assign(node.style,{display:'block',left:b.x+'px',top:b.y+'px',width:b.width+'px',height:b.height+'px',borderRadius:d.vy>0?'47% 53% 51% 49% / 41% 38% 62% 59%':`${44+d.shape*9}% ${53-d.shape*7}% 49% 51% / 46% 42% 58% 54%`,backdropFilter:`url(#${ids[shape]})`,opacity:String(Math.min(1,humidity*1.35)*(d.runoff?Math.min(1,d.age/.6):1)*density),'--drop-light':String(luminance)});
   if(node.dataset.dropId!==String(d.id))node.dataset.dropId=String(d.id);
   if(node.dataset.moving!==String(d.vy>0))node.dataset.moving=String(d.vy>0);
   if(node.dataset.runoff!==String(!!d.runoff))node.dataset.runoff=String(!!d.runoff);
  });
  const rim=ctx.createLinearGradient(0,0,width,height);rim.addColorStop(0,`rgba(184,209,214,${humidity*.28+s.snow*.3})`);rim.addColorStop(.3,'transparent');rim.addColorStop(1,`rgba(130,166,182,${humidity*.16+s.snow*.3})`);ctx.strokeStyle=rim;ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(1.5,1.5,width-3,height-3,21);ctx.stroke();
  if(frost)frost.draw(s.snow,s.time,width,height);
  else if(s.snow>.01){ctx.strokeStyle=`rgba(207,230,238,${s.snow*.4})`;ctx.lineWidth=.5;for(let i=0;i<50;i++){const y=i*height/50,edge=i%2?width-2:2,sign=i%2?-1:1,len=(4+(i*19%17))*s.snow;ctx.beginPath();ctx.moveTo(edge,y);ctx.lineTo(edge+sign*len,y-len*.5);ctx.lineTo(edge+sign*len*.65,y-len*.8);ctx.stroke()}}
 }
 return{draw,shower(value:boolean){showerEnabled=withShower&&value},count:nodes.length,layoutMoving:()=>wasMoving,snapshot:()=>{const s=model.snapshot();const cold:Partial<T>=frost?.snapshot()??{};return Object.assign({material:'glass',specialSkiesEnabled:specialSkies,specialSkyModels:[blood?.snapshot(),atmosphere?.snapshot()].filter(Boolean),forceEnabled:!!withForce,scatterEnabled:scatter,showerPattern:scatter?'independent-streaks':'tiled-svg',showerGeometry,rainEnergy,rainAmount,showerDensity,showerSpeed,showerEnabled,showerReady:scatter||!!(showerImage?.complete&&showerImage.naturalWidth),showerPhase,climateEnabled:climate,microVisible},cold,{runoffEnabled:runoff,runoffBorn:s.runoffBorn,runoffDrained:s.runoffDrained,trailMode:naturalTrails?'natural-footprint':'linear-stroke',wetBounds,wetPaths:wetBounds.length,activeDrops:active.length,moving:visibleFlow,attached:active.length-visibleFlow,merges:s.merges,slides:s.slides,drained:s.drained,trailSegments:s.trails.length,protected:frameProtection,dropBounds:active,protectedOverlap:[...active,...wetBounds,...(cold?.iceBounds??[]),...(cold?.flakeBounds??[])].filter(b=>frameProtection.some(q=>intersects(b,q))).length,backdropSupported:CSS.supports('backdrop-filter',`url(#${ids[0]})`),optics:'Native SVG backdrop displacement; approximate normal field, not a physical refraction solver',drops:s.drops})},dispose(){if(showerImage)showerImage.onload=null;scope.dispose();layer.remove()}};
 }catch(error){scope.dispose();throw error}
}
