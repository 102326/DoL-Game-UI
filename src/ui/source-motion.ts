/** Official visual effects only. Cancelling these never dispatches or settles a game action. */
export function sourceMotion(){
 const animations=new Map<HTMLElement,Animation>(),ghosts=new Set<HTMLElement>();
 const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const enabled=()=>!!media&&!media.matches&&document.documentElement.hasAttribute('data-dgu-visualMotion');
 function animate(node:HTMLElement,frames:Keyframe[],duration=420){
  animations.get(node)?.cancel();if(!enabled()||typeof node.animate!=='function')return;
  try{const a=node.animate(frames,{duration,easing:'cubic-bezier(.16,1,.3,1)'});animations.set(node,a);
   void a.finished.catch(()=>{}).finally(()=>{if(animations.get(node)===a)animations.delete(node);if(ghosts.delete(node))node.remove()});return a;
  }catch{return}
 }
 function cancel(node?:HTMLElement){if(node){animations.get(node)?.cancel();animations.delete(node)}else{for(const a of animations.values())a.cancel();animations.clear();for(const n of ghosts)n.remove();ghosts.clear()}}
 function flight(from:DOMRect,to:DOMRect,label:string){
  if(!enabled())return;const n=document.createElement('div');n.className='sf-source-trace';n.setAttribute('aria-hidden','true');n.textContent=label;
  Object.assign(n.style,{left:from.left+'px',top:from.top+'px',width:Math.min(from.width,240)+'px'});document.body.append(n);ghosts.add(n);
  const x=to.left-from.left,y=to.top-from.top;
  if(!animate(n,[{transform:'translate(0,0) scale(1)',opacity:.8},{transform:`translate(${x*.45}px,${y*.4-18}px) scale(.85)`,opacity:.9,offset:.45},{transform:`translate(${x}px,${y}px) scale(.6)`,opacity:0}],480)){n.remove();ghosts.delete(n)}
 }
 const observer=new MutationObserver(()=>{if(!enabled())cancel()});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-dgu-visualmotion']});
 const changed=()=>{if(!enabled())cancel()};media?.addEventListener('change',changed);
 return {enabled,animate,flight,cancel,dispose(){cancel();observer.disconnect();media?.removeEventListener('change',changed)}};
}
