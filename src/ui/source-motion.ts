/** Official visual effects only. Cancelling these never dispatches or settles a game action. */
export function sourceMotion(){
 const animations=new Map<HTMLElement,Animation>(),ghosts=new Set<HTMLElement>(),scrolling=new Set<HTMLElement>(),scrollFrames=new Map<HTMLElement,number>();let focusGhost:HTMLElement|undefined;
 const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let disposed=false;
 const enabled=()=>!disposed&&!document.hidden&&!!media&&!media.matches&&document.documentElement.hasAttribute('data-dgu-visualMotion');
 function removeGhost(node:HTMLElement){if(ghosts.delete(node)){node.remove();if(focusGhost===node)focusGhost=undefined}}
 function animate(node:HTMLElement,frames:Keyframe[],duration=420){
  animations.get(node)?.cancel();animations.delete(node);if(!enabled()||typeof node.animate!=='function'){removeGhost(node);return}
  try{const a=node.animate(frames,{duration,easing:'cubic-bezier(.16,1,.3,1)'});animations.set(node,a);
   void a.finished.catch(()=>{}).finally(()=>{if(animations.get(node)!==a)return;animations.delete(node);removeGhost(node)});return a;
  }catch{return}
 }
 function cancel(node?:HTMLElement){for(const [n,id]of scrollFrames)if(!node||n===node){cancelAnimationFrame(id);scrollFrames.delete(n)}for(const n of scrolling)if(!node||n===node){n.scrollTo({top:n.scrollTop,behavior:'instant'});scrolling.delete(n)}if(node){animations.get(node)?.cancel();animations.delete(node);removeGhost(node)}else{for(const a of animations.values())a.cancel();animations.clear();for(const n of ghosts)n.remove();ghosts.clear();focusGhost=undefined}}
 function scroll(node:HTMLElement,top:number,arrived?:()=>void){
  if(disposed)return;
  cancel(node);scrolling.add(node);node.scrollTo({top,behavior:enabled()?'smooth':'instant'});
  if(!arrived||!enabled())return;
  const start=performance.now();let stable=0;
  const tick=()=>{scrollFrames.delete(node);if(!enabled()||!node.isConnected)return;const goal=Math.max(0,Math.min(top,node.scrollHeight-node.clientHeight));stable=Math.abs(node.scrollTop-goal)<2?stable+1:0;if(stable>=3){scrolling.delete(node);arrived()}else if(performance.now()-start<1800)scrollFrames.set(node,requestAnimationFrame(tick));else scrolling.delete(node)};
  scrollFrames.set(node,requestAnimationFrame(tick));
 }
 /** A pointer-inert material proxy, never a cloned control or a second data source. */
 function relay(from:DOMRect,to:DOMRect,icon?:HTMLImageElement){
  if(!enabled()||!from.width||!to.width||!to.height)return;
  const n=document.createElement('div');n.className='kw-object-relay';n.setAttribute('aria-hidden','true');
  Object.assign(n.style,{left:to.left+'px',top:to.top+'px',width:to.width+'px',height:to.height+'px'});
  if(icon?.currentSrc){const image=document.createElement('img');image.src=icon.currentSrc;image.alt='';n.append(image)}
  document.body.append(n);ghosts.add(n);
  const dx=from.left+from.width/2-to.left-to.width/2,dy=from.top+from.height/2-to.top-to.height/2;
  const a=animate(n,[{transform:`translate(${dx}px,${dy}px) scale(${from.width/to.width},${from.height/to.height})`,borderRadius:'20px',opacity:.8},{transform:`perspective(1100px) translate(${dx*.38}px,${dy*.3-24}px) rotateY(-18deg) scale(.66,.72)`,borderRadius:'42px',opacity:.5,offset:.45},{transform:'none',borderRadius:'18px',opacity:.12,offset:.78},{transform:'scale(1.025)',opacity:0}],820);
  if(!a){n.remove();ghosts.delete(n)}return a;
 }
 function flight(from:DOMRect,to:DOMRect,label:string){
  if(!enabled())return;const n=document.createElement('div');n.className='sf-source-trace';n.setAttribute('aria-hidden','true');n.textContent=label;
  Object.assign(n.style,{left:from.left+'px',top:from.top+'px',width:Math.min(from.width,240)+'px'});document.body.append(n);ghosts.add(n);
  const x=to.left-from.left,y=to.top-from.top;
  if(!animate(n,[{transform:'translate(0,0) scale(1)',opacity:.8},{transform:`translate(${x*.45}px,${y*.4-18}px) scale(.85)`,opacity:.9,offset:.45},{transform:`translate(${x}px,${y}px) scale(.6)`,opacity:0}],480)){n.remove();ghosts.delete(n)}
 }
 function focus(from:DOMRect,to:DOMRect){
  if(focusGhost)cancel(focusGhost);
  if(!enabled()||!from.width||!to.width)return;
  const node=document.createElement('div');node.className='kw-moving-focus';node.setAttribute('aria-hidden','true');
  Object.assign(node.style,{left:to.left+'px',top:to.top+'px',width:to.width+'px',height:to.height+'px'});document.body.append(node);ghosts.add(node);focusGhost=node;
  if(!animate(node,[{transform:`translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width},${from.height/to.height})`,opacity:.65},{transform:'none',opacity:.8,offset:.72},{transform:'none',opacity:0}],560)){node.remove();ghosts.delete(node)}
 }
 const observer=new MutationObserver(()=>{if(!enabled())cancel()});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-dgu-visualmotion']});
 const changed=()=>{if(!enabled())cancel()};media?.addEventListener('change',changed);
 document.addEventListener('visibilitychange',changed);window.addEventListener('pagehide',cancelAll);
 function cancelAll(){cancel()}
 const resized=()=>cancel();window.addEventListener('resize',resized);window.visualViewport?.addEventListener('resize',resized);
 return {enabled,animate,flight,focus,scroll,relay,cancel,dispose(){if(disposed)return;disposed=true;cancel();observer.disconnect();media?.removeEventListener('change',changed);document.removeEventListener('visibilitychange',changed);window.removeEventListener('pagehide',cancelAll);window.removeEventListener('resize',resized);window.visualViewport?.removeEventListener('resize',resized)}};
}
