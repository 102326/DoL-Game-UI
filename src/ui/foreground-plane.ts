import {ownedOverlaySelector} from './owned-overlay';
import {navigationRect} from './navigation-geometry';
import {visualScope} from './visual-scope';
import './foreground-plane.css';

// Internal presentation invalidation only; no native or Host protocol changes.
const refreshers=new WeakMap<HTMLElement,()=>void>();
export function refreshForeground(root:HTMLElement){refreshers.get(root)?.()}

/** Keep animated decoration outside the static glass; native controls and geometry owners stay put. */
export function foregroundPlane(root:HTMLElement,parts:readonly HTMLElement[]){
 if(!root.isConnected||!root.matches(ownedOverlaySelector)||!document.documentElement.hasAttribute('data-dgu-acrylic-adjustment'))return;
 const scope=visualScope(),host=document.createElement('div'),paint=document.createElement('div');
 host.className='sf-foreground-host';host.dataset.sfForegroundFor=root.id;host.setAttribute('aria-hidden','true');
 paint.className='sf-foreground-paint kw-heading-nav';paint.setAttribute('data-sf-weather-material','');host.append(paint);
 const originals=parts.map(node=>({node,parent:node.parentNode,next:node.nextSibling}));
 type Mirror={source:HTMLElement;clip:HTMLDivElement;clone:HTMLElement;observer:MutationObserver};
 const mirrors=new Map<HTMLElement,Mirror>();let active=false,disposed=false;
 const eligible=()=>root.isConnected&&root.matches(ownedOverlaySelector)&&document.documentElement.hasAttribute('data-dgu-acrylic-adjustment');
 const running=(node:HTMLElement)=>node.getAnimations().some(a=>a.playState==='running');
 function restoreParts(){for(const p of [...originals].reverse())if(p.node.parentNode===paint&&p.parent){if(p.next?.parentNode===p.parent)p.parent.insertBefore(p.node,p.next);else p.parent.appendChild(p.node)}}
 function removeMirror(m:Mirror){try{m.observer.disconnect()}finally{if(m.source.getAttribute('data-sf-foreground-source')==='1')m.source.removeAttribute('data-sf-foreground-source');m.clip.remove();mirrors.delete(m.source)}}
 function nested(){
  active=false;host.style.display='none';const errors:unknown[]=[];
  try{restoreParts()}catch(error){errors.push(error)}
  for(const m of [...mirrors.values()])try{removeMirror(m)}catch(error){errors.push(error)}
  if(errors.length)throw new AggregateError(errors,'Foreground restoration failed');
 }
 function tick(){try{sync()}catch(error){try{dispose()}finally{console.warn('Foreground unavailable; keeping nested decoration',error)}}}
 function queue(){scope.frame(tick)}
 function discover(){
  const sources=new Set(root.querySelectorAll<HTMLElement>('.dmt-orbit-focus[data-sf-orbit-owner="1"]'));
  for(const m of [...mirrors.values()])if(!sources.has(m.source))removeMirror(m);
  for(const source of sources){
   if(mirrors.has(source)||source.hasAttribute('data-sf-foreground-source'))continue;
   const svg=source.querySelector('svg');if(!svg||svg.children.length!==3)continue;
   const clone=source.cloneNode(true) as HTMLElement,clip=document.createElement('div');
   clone.removeAttribute('data-sf-orbit-owner');clone.classList.replace('dmt-orbit-focus','sf-foreground-orbit');clip.className='sf-foreground-contour';clip.append(clone);
   for(const name of ['dmt-orbit-flow','dmt-orbit-tail']){
    const original=source.querySelector('.'+name),copy=clone.querySelector<SVGElement>('.'+name);
    const animation=original?.getAnimations()[0];if(copy&&animation&&typeof animation.currentTime==='number')copy.style.animationDelay=-animation.currentTime+'ms';
   }
   const observer=new MutationObserver(queue),m={source,clip,clone,observer};
   observer.observe(source,{subtree:true,attributes:true,attributeFilter:['style','viewBox','width','height','rx']});
   mirrors.set(source,m);paint.append(clip);source.setAttribute('data-sf-foreground-source','1');
  }
 }
 function place(m:Mirror,origin:{left:number;top:number},scaleX=1,scaleY=1){
  const r=m.source.getBoundingClientRect(),style=getComputedStyle(m.source);
  if(!r.width||!r.height||style.visibility==='hidden'||m.source.closest('.hidden,[hidden],[inert]')){m.clip.style.display='none';return}
  let left=r.left,top=r.top,right=r.right,bottom=r.bottom;
  for(let n=m.source.parentElement;n&&n!==root;n=n.parentElement){
   const s=getComputedStyle(n),b=n.getBoundingClientRect();
   if(!b.width||!b.height)continue;
   if(s.overflowX!=='visible'){left=Math.max(left,b.left);right=Math.min(right,b.right)}
   if(s.overflowY!=='visible'){top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom)}
  }
  if(right<=left||bottom<=top){m.clip.style.display='none';return}
  const box=navigationRect(host,r),clip=navigationRect(host,new DOMRect(left,top,right-left,bottom-top));
  if(!box||!clip){m.clip.style.display='none';return}
  Object.assign(m.clip.style,{display:'block',left:(clip.left-origin.left)/scaleX+'px',top:(clip.top-origin.top)/scaleY+'px',width:clip.width/scaleX+'px',height:clip.height/scaleY+'px'});
  Object.assign(m.clone.style,{left:(box.left-clip.left)/scaleX+'px',top:(box.top-clip.top)/scaleY+'px',width:box.width/scaleX+'px',height:box.height/scaleY+'px',visibility:'visible'});
  const from=m.source.querySelector('svg'),to=m.clone.querySelector('svg');if(!from||!to)return;
  for(const attribute of ['viewBox']){const value=from.getAttribute(attribute);if(value!==null&&to.getAttribute(attribute)!==value)to.setAttribute(attribute,value)}
  for(let i=0;i<from.children.length;i++)for(const attribute of ['width','height','rx']){
   const value=from.children[i]?.getAttribute(attribute),target=to.children[i];if(value!=null&&target&&target.getAttribute(attribute)!==value)target.setAttribute(attribute,value);
  }
 }
 function sync(){
  if(!scope.active())return;
  if(!eligible()||!root.getClientRects().length||root.closest('.hidden,[hidden],[inert]')||root.hasAttribute('data-sf-leaving')){nested();return}
  const style=getComputedStyle(root);
  // Keep the original grouped fade during entry; move only its settled foreground.
  if(Number(style.opacity)<1||running(root)){nested();if(running(root))queue();return}
  host.style.display='block';host.style.zIndex=style.zIndex==='auto'?'0':style.zIndex;
  const r=root.getBoundingClientRect(),width=parseFloat(style.width),height=parseFloat(style.height);
  const borderX=parseFloat(style.borderLeftWidth)+parseFloat(style.borderRightWidth),borderY=parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth);
  const cssWidth=width+(style.boxSizing==='border-box'?0:borderX+parseFloat(style.paddingLeft)+parseFloat(style.paddingRight));
  const cssHeight=height+(style.boxSizing==='border-box'?0:borderY+parseFloat(style.paddingTop)+parseFloat(style.paddingBottom));
  const sx=r.width/cssWidth,sy=r.height/cssHeight;
  const box=navigationRect(host,new DOMRect(r.left+parseFloat(style.borderLeftWidth)*sx,r.top+parseFloat(style.borderTopWidth)*sy,r.width-borderX*sx,r.height-borderY*sy));
  if(!box){nested();return}
  // Material motion keeps DOM drops, cropped canvas and contours in the same
  // local coordinates as the original shell, including its independent zoom.
  const material=root.hasAttribute('data-dgu-attributes-material'),paintWidth=material?cssWidth-borderX:box.width,paintHeight=material?cssHeight-borderY:box.height;
  const scaleX=box.width/paintWidth,scaleY=box.height/paintHeight;
  if(![paintWidth,paintHeight,scaleX,scaleY].every(n=>Number.isFinite(n)&&n>0)){nested();return}
  Object.assign(paint.style,{left:box.left+'px',top:box.top+'px',width:paintWidth+'px',height:paintHeight+'px',transformOrigin:'0 0',scale:material?`${scaleX} ${scaleY}`:''});
  if(!active){for(const node of parts)paint.append(node);active=true}
  discover();let moving=false;for(const m of mirrors.values()){place(m,box,scaleX,scaleY);moving=running(m.source)||moving}if(moving)queue();
 }
 function refreshNow(){scope.cancelFrame(tick);tick()}
 function dispose(){if(disposed)return;disposed=true;if(refreshers.get(root)===refreshNow)refreshers.delete(root);try{scope.dispose()}finally{try{nested()}finally{host.remove()}}}
 try{
  root.after(host);
  const resized=new ResizeObserver(queue);scope.own(()=>resized.disconnect());resized.observe(root);
  const changed=new MutationObserver(queue);scope.own(()=>changed.disconnect());
  changed.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','inert','data-sf-leaving']});
  const preferences=new MutationObserver(queue);scope.own(()=>preferences.disconnect());preferences.observe(document.documentElement,{attributes:true,attributeFilter:['style','data-dgu-acrylic-adjustment','data-dgu-visualmotion','data-dgu-visualglow','data-dol-midnight']});
  window.addEventListener('resize',queue);scope.own(()=>window.removeEventListener('resize',queue));
  document.addEventListener('scroll',queue,true);scope.own(()=>document.removeEventListener('scroll',queue,true));
  sync();queue();refreshers.set(root,refreshNow);
 }catch(error){try{dispose()}finally{console.warn('Foreground unavailable; keeping nested decoration',error)}return}
 return dispose;
}
