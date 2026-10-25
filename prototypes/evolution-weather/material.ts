export type MaterialKind='beads'|'film';
type Frame={wet:number;snow:number;light:number;night:number;time:number;width:number;height:number;dpr:number;kind:string};
type Box={x:number;y:number;width:number;height:number};
/** Native backdrop filtering + shaded surface geometry. Never samples/captures DOM into a texture. */
export function rainMaterial(canvas:HTMLCanvasElement,kind:MaterialKind){
 const shell=canvas.parentElement!,ctx=canvas.getContext('2d')!;
 const layer=document.createElement('div');layer.className='evo-material-layer';layer.setAttribute('aria-hidden','true');layer.dataset.material=kind;
 const films=Array.from({length:5},()=>{const n=document.createElement('div');n.className='evo-wet-film';layer.append(n);return n});shell.prepend(layer);
 let seed=0x19a7d3;const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
 const drops=Array.from({length:kind==='beads'?54:23},(_,i)=>{
  const node=document.createElement('i');node.className='evo-attached-drop';
  const corner=()=>`${36+random()*38}%`;node.style.borderRadius=`${corner()} ${corner()} ${corner()} ${corner()} / ${corner()} ${corner()} ${corner()} ${corner()}`;
  node.style.rotate=(random()*32-16)+'deg';layer.append(node);
  return{node,zone:i%3===0?'edge':i%7===0?'top':'band',x:random(),y:random(),r:1.6+Math.pow(random(),2.3)*12.8,birth:i<14?-5:random()*20,pin:8+random()*18,speed:6+random()*12,curve:random()*5-2.5,aspect:.88+random()*.6};
 });
 // One composed contact bead makes the slow adhesion-to-drainage transition inspectable in both studies.
 const contact= drops[4];if(!contact)throw Error('Missing contact bead');
 Object.assign(contact,{zone:'band',x:.34,y:.28,r:10.5,birth:-4,pin:8,speed:1.5,aspect:1.1});
 const grains=Array.from({length:190},()=>({x:random(),y:random(),a:random(),r:.5+random()*1.2}));
 let boxes:Box[]=[],band:Box|undefined,dirty=true,oldW=0,oldH=0,active:Box[]=[],moving=0,attached=0;
 const dirtyLayout=()=>{dirty=true};
 const observer=new MutationObserver(dirtyLayout);observer.observe(shell,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-workspace-transition','data-settings-layout']});shell.addEventListener('scroll',dirtyLayout,true);
 function layout(w:number,h:number){
  const base=canvas.getBoundingClientRect(),scale=base.width/w;
  const rect=(n:Element):Box=>{const r=n.getBoundingClientRect();return{x:(r.x-base.x)/scale,y:(r.y-base.y)/scale,width:r.width/scale,height:r.height/scale}};
  boxes=[...shell.querySelectorAll('h2,.dmt-eyebrow,.dmt-close,.evo-toolbar,.dmt-layout-choice,.dmt-workspace,.dmt-settings-footer,.evo-material-window span')].filter(n=>n.getClientRects().length).map(rect);
  const study=shell.querySelector('.evo-material-window');band=study?rect(study):undefined;
  // A nonuniform perimeter boundary and draining gaps, composed by the browser over its real backdrop.
  const safe=boxes.map(b=>`<rect x="${b.x-14}" y="${b.y-14}" width="${b.width+28}" height="${b.height+28}" rx="14" fill="black" filter="url(#feather)"/>`).join('');
  const mist=band&&kind==='film'?`<g mask="url(#fade)"><rect x="${band.x}" y="${band.y}" width="${band.width}" height="${band.height}" fill="white" filter="url(#fog)"/></g>`:'';
  const channels=band&&kind==='film'?[.17,.43,.81].map((f,i)=>{const x=band!.x+band!.width*f;return`<path d="M${x} ${band!.y-14+i*8} c${-12+i*9} 28 ${10-i*3} 41 ${4-i*5} 58 q${-9+i*8} 27 ${2-i*3} 48" fill="none" stroke="black" stroke-opacity="${.32+i*.12}" stroke-width="${5+i*4}" filter="url(#feather)"/>`}).join(''):'';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><filter id="feather"><feGaussianBlur stdDeviation="5"/></filter><filter id="fog"><feTurbulence baseFrequency=".009 .026" numOctaves="3" seed="17"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 .2126 .7152 .0722 0 0"/><feComponentTransfer><feFuncA type="linear" slope="1.2" intercept=".12"/></feComponentTransfer></filter><linearGradient id="soft" x2="0" y2="1"><stop stop-color="white" stop-opacity="0"/><stop offset=".25" stop-color="white" stop-opacity=".8"/><stop offset=".75" stop-color="white" stop-opacity=".8"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="fade"><rect x="${band?.x||0}" y="${band?.y||0}" width="${band?.width||0}" height="${band?.height||0}" fill="url(#soft)"/></mask><mask id="cut" maskUnits="userSpaceOnUse"><rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="none" stroke="white" stroke-width="18" filter="url(#feather)"/>${mist}${channels}${safe}</mask></defs><rect width="100%" height="100%" fill="white" mask="url(#cut)"/></svg>`;
  const regions:Box[]=[{x:0,y:0,width:w,height:24},{x:0,y:h-24,width:w,height:24},{x:0,y:24,width:28,height:h-48},{x:w-28,y:24,width:28,height:h-48},band||{x:0,y:24,width:0,height:0}];
  regions.forEach((r,i)=>{const position={left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px'};const film=films[i];if(!film)throw Error('Missing wet film');Object.assign(film.style,position,{maskImage:`url("data:image/svg+xml,${encodeURIComponent(svg)}")`,maskSize:`${w}px ${h}px`,maskPosition:`${-r.x}px ${-r.y}px`,maskMode:'alpha'});});
  dirty=false;oldW=w;oldH=h;
 }
 const intersects=(a:Box,b:Box)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 function draw(s:Frame){
  if(dirty||oldW!==s.width||oldH!==s.height)layout(s.width,s.height);
  const c=ctx,w=s.width,h=s.height,humidity=Math.max(0,s.wet*(1-s.snow*.8));active=[];moving=0;attached=0;c.clearRect(0,0,w,h);
  for(const film of films)film.style.opacity=String(Math.min(1,humidity*(kind==='film'?.86:.48)+s.snow*.45));layer.style.setProperty('--evo-cool',String(s.snow));
  c.save();c.beginPath();c.rect(0,0,w,h);for(const b of boxes)c.rect(b.x-5,b.y-5,b.width+10,b.height+10);c.clip('evenodd');
  // Warm grazing light yields to a cool wet rim, without tinting the protected reading surface.
  const rim=c.createLinearGradient(0,0,w,h);rim.addColorStop(0,`rgba(${s.snow>.2?'197,226,240':'237,209,163'},${.18*s.light+.12*humidity})`);rim.addColorStop(.35,'transparent');rim.addColorStop(1,`rgba(132,174,196,${humidity*.12+s.snow*.24})`);c.strokeStyle=rim;c.lineWidth=3;c.beginPath();c.roundRect(1.5,1.5,w-3,h-3,21);c.stroke();
  for(const p of drops){
   const age=s.time<p.birth?s.time-p.birth:(s.time-p.birth)%(p.pin+24+p.x*27),volume=Math.min(1,Math.max(0,age/5)),r=p.r*volume*Math.sqrt(humidity),sliding=age>p.pin&&p.r>7.5;
   let x:number,y:number;
   if(p.zone==='band'&&band){x=band.x+18+p.x*Math.max(0,band.width-36);y=band.y+8+p.y*Math.max(0,band.height-22)}
   else if(p.zone==='edge'){x=p.x<.5?8+p.y*9:w-8-p.y*9;y=28+p.y*(h-60)}
   else{x=20+p.x*(w-40);y=8+p.y*8}
   const travel=sliding?Math.pow(age-p.pin,1.35)*p.speed:0,dy=Math.min(travel,band&&p.zone==='band'?band.height:150),fade=travel>dy?Math.max(0,1-(travel-dy)/24):1;
   const yy=y+dy,xx=x+Math.sin(dy*.025)*p.curve,b={x:xx-r-5,y:yy-r*p.aspect-5,width:r*2+10,height:r*p.aspect*2+10};
   const safe=r>.45&&fade>0&&!boxes.some(q=>intersects(b,q))&&b.x>=0&&b.y>=0&&b.x+b.width<w&&b.y+b.height<h;
   p.node.style.display=safe?'block':'none';if(!safe)continue;
   active.push(b);if(sliding)moving++;else attached++;
   Object.assign(p.node.style,{width:r*2+'px',height:r*p.aspect*2+'px',transform:`translate3d(${xx-r}px,${yy-r*p.aspect}px,0)`,opacity:String(Math.min(1,humidity*1.6)*fade)});
   // Only a travelling attached bead leaves a short, tapering wet contact path.
   if(sliding&&dy>1){const g=c.createLinearGradient(x,y,xx,yy);g.addColorStop(0,'transparent');g.addColorStop(.7,`rgba(105,148,166,${.11*humidity*fade})`);g.addColorStop(1,`rgba(221,239,238,${.25*humidity*fade})`);c.strokeStyle=g;c.lineWidth=Math.max(.5,r*.45);c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x-2,y+dy*.4,xx+1,yy-dy*.2,xx,yy);c.stroke()}
  }
  // Condensation is a stationary irregular micro-surface, not looping points crossing the page.
  if(kind==='film'&&band&&humidity>.01){
   c.save();c.beginPath();c.rect(band.x,band.y,band.width,band.height);c.clip();
   for(const g of grains){c.fillStyle=`rgba(219,236,233,${.04*humidity*g.a})`;c.fillRect(band.x+g.x*band.width,band.y+g.y*band.height,g.r,g.r)}c.restore();
  }
  // Frost nucleates at existing wet contact edges; no screen-wide snow-particle overlay.
  if(s.snow>.005){c.strokeStyle=`rgba(207,232,244,${s.snow*.38})`;c.lineWidth=.65;
   for(let side=0;side<2;side++)for(let i=0;i<31;i++){const x=side?w-2:2,y=(i*83.719%997)/997*h,len=(8+((i*37)%29))*s.snow,sign=side?-1:1;c.beginPath();c.moveTo(x,y);c.lineTo(x+sign*len,y-len*.44);for(let b=1;b<4;b++){const bx=x+sign*len*b/4,by=y-len*.44*b/4;c.moveTo(bx,by);c.lineTo(bx-sign*len*.2,by-len*.23)}c.stroke()}
  }
  c.restore();
 }
 return{draw,count:drops.length,snapshot:()=>({material:kind,activeDrops:active.length,moving,attached,protected:boxes,dropBounds:active,protectedOverlap:active.filter(b=>boxes.some(q=>intersects(b,q))).length,backdropSupported:CSS.supports('backdrop-filter','blur(2px)')}),dispose(){observer.disconnect();shell.removeEventListener('scroll',dirtyLayout,true);layer.remove()}};
}
