import {pose,progressAt,smooth,type Point,type Target,type Bounds} from './path';
import {runClock,type Engine} from './engines';
export interface Options {engine:Engine;duration:number;turns:number;motion:boolean}
export function goldenSpin(root:HTMLElement,initial:Partial<Options>={}) {
 if(root.hasAttribute('data-golden-spin-b'))throw Error('This Hub already has a motion owner');
 const nav=root.querySelector<HTMLElement>('.sf-motion-orbit'),ball=root.querySelector<HTMLButtonElement>('.sf-motion-ball');
 if(!nav||!ball)throw Error('Expected the current MotionHub root, orbit and real ball');
 const orbit=nav,hubBall=ball,emblem=ball.querySelector<HTMLElement>(':scope>span')!;
 const options:Options={engine:'gsap',duration:1.65,turns:1.15,motion:true,...initial};
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const saved=new Map<HTMLElement,Map<string,{value:string;priority:string}>>();
 const originalTabs=new Map<HTMLElement,string|null>();
 let dead=false,stopClock:(()=>void)|undefined,layoutFrame=0,q=0,velocity=0,target=0,serial=0;
 let origin:Point={x:0,y:0},bounds:Bounds={left:0,top:0,right:innerWidth,bottom:innerHeight};
 let nodes:HTMLElement[]=[],targets:Target[]=[],correction:Point[]=[],segmentT=1,renderCount=0;
 let scaleX=1,scaleY=1;
 const expanded=()=>orbit.classList.contains('is-expanded');
 const disabled=()=>!options.motion||media.matches||(document.documentElement.hasAttribute('data-dol-midnight')&&!document.documentElement.hasAttribute('data-dgu-visualMotion'));
 function set(node:HTMLElement,key:string,value:string) {
  let props=saved.get(node);if(!props){props=new Map();saved.set(node,props)}
  if(!props.has(key))props.set(key,{value:node.style.getPropertyValue(key),priority:node.style.getPropertyPriority(key)});
  if(value)node.style.setProperty(key,value);else node.style.removeProperty(key);
 }
 function restore(node:HTMLElement) {for(const [key,before]of saved.get(node)??[])if(before.value)node.style.setProperty(key,before.value,before.priority);else node.style.removeProperty(key);saved.delete(node)}
 function stop(){serial++;stopClock?.();stopClock=undefined;velocity=0}
 function measure() {
  const old=nodes;nodes=[...orbit.querySelectorAll<HTMLElement>(':scope>.sf-motion-petal')];
  for(const node of old)if(!nodes.includes(node)){restore(node);restoreTab(node);originalTabs.delete(node)}
  for(const node of nodes){if(!originalTabs.has(node))originalTabs.set(node,node.getAttribute('tabindex'));set(node,'transform','none')}
  const r=root.getBoundingClientRect();scaleX=r.width/Math.max(1,root.offsetWidth);scaleY=r.height/Math.max(1,root.offsetHeight);
  const b=hubBall.getBoundingClientRect();origin={x:b.x+b.width/2,y:b.y+b.height/2};
  const v=visualViewport;bounds={left:v?.offsetLeft??0,top:v?.offsetTop??0,right:(v?.offsetLeft??0)+(v?.width??innerWidth),bottom:(v?.offsetTop??0)+(v?.height??innerHeight)};
  targets=nodes.map(n=>{const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height}});
 }
 function restoreFocus(){if(nodes.some(n=>n.contains(document.activeElement)))hubBall.focus({preventScroll:true})}
 function restoreTab(node:HTMLElement){const before=originalTabs.get(node);if(before==null)node.removeAttribute('tabindex');else node.setAttribute('tabindex',before)}
 function positions(){return nodes.map((_,i)=>{const p=pose(q,i,nodes.length,origin,targets[i],bounds,options.turns),c=correction[i]??{x:0,y:0},w=1-smooth(segmentT);return{x:p.x+c.x*w,y:p.y+c.y*w}})}
 function rebase(){
  const oldNodes=nodes.slice(),old=q>0?positions():[];measure();
  correction=nodes.map((node,i)=>{const previous=old[oldNodes.indexOf(node)],p=pose(q,i,nodes.length,origin,targets[i],bounds,options.turns);return previous?{x:previous.x-p.x,y:previous.y-p.y}:{x:0,y:0}});
 }
 function render() {
  if(dead||!root.isConnected)return;
  renderCount++;
  const active=!!stopClock||q!==target;
  root.dataset.gsPhase=!active&&q<=0?'closed':!active&&q>=1?'open':q<.14?'charge':q<.8?'transfer':'settle';
  root.dataset.gsMoving=String(active);
  // The native inert/aria-hidden state remains the logical owner's decision.
  for(const [i,node]of nodes.entries()) {
   const p=pose(q,i,nodes.length,origin,targets[i],bounds,options.turns),offset=correction[i]??{x:0,y:0};
   const weight=1-smooth(segmentT),dx=(p.x+offset.x*weight-targets[i].x)/scaleX,dy=(p.y+offset.y*weight-targets[i].y)/scaleY;
   if(q>=1&&!active){set(node,'transform','');set(node,'opacity','');set(node,'will-change','')}
   else {set(node,'transform',`translate(${dx}px,${dy}px) perspective(700px) rotate(${p.rotation}deg) rotateX(${p.tiltX}deg) rotateY(${p.tiltY}deg) scale(${p.scale})`);set(node,'opacity',String(p.opacity));set(node,'will-change',active?'transform, opacity':'')}
   set(node,'pointer-events',!active&&q===1&&target===1?'':'none');
   if(!active&&q===1&&target===1)restoreTab(node);else node.tabIndex=-1;
  }
  const charge=smooth(q/.14),release=smooth((q-.14)/.86),rotation=-48*charge+768*release;
  // CSS individual rotate precedes a legacy translate transform; rotate the local shell instead.
  set(hubBall,'--gs-ball-angle',`${rotation}deg`);
  set(hubBall,'--gs-ball-scale',String(1-.16*Math.sin(Math.PI*charge)+.09*Math.sin(Math.PI*release)));
  set(emblem,'transform',q===0?'':`rotate(${rotation}deg) scale(var(--gs-ball-scale))`);
  set(orbit,'--gs-shell',String(smooth((q-.66)/.34)));
  set(orbit,'visibility',q>0?'visible':'');
 }
 function settle(value:number){stop();q=value;target=value;segmentT=1;correction=[];render();if(value===0)restoreFocus()}
 function animate(next:number,refresh=false) {
  if(dead)return;
  const oldVelocity=velocity,from=q;
  stop();target=next;velocity=oldVelocity;
  if(refresh||!targets.length)rebase();
  if(disabled()||Math.abs(next-q)<.00001){settle(next);return}
  if(next===0)restoreFocus();
  segmentT=0;
  render();
  const token=serial,duration=options.duration*Math.max(.32,Math.abs(next-from));
  const complete=()=>{if(!dead&&token===serial){stopClock=undefined;q=next;velocity=0;segmentT=1;correction=[];render()}};
  stopClock=runClock(options.engine,duration,t=>{if(dead||token!==serial)return;segmentT=t;const p=progressAt(t,from,next,oldVelocity,duration);q=p.q;velocity=p.velocity;render()},complete);
 }
 function relayout() {
  layoutFrame=0;if(dead)return;
  rebase();
  if(stopClock)animate(target);else{segmentT=1;render()}
 }
 function schedule(){if(!dead&&!layoutFrame)layoutFrame=requestAnimationFrame(relayout)}
 function changed(records:MutationRecord[]) {
  if(dead)return;
  const next=expanded()?1:0;
  if(hubBall.classList.contains('is-dragging')){measure();settle(0);return}
  if(records.some(r=>r.type==='childList'))schedule();
  if(next!==target)animate(next,true);
 }
 const observer=new MutationObserver(changed),resize=new ResizeObserver(schedule);
 const connectedObserver=new MutationObserver(()=>{if(!root.isConnected)destroy()});
 const bodyObserver=new MutationObserver(()=>{schedule();if(disabled())settle(expanded()?1:0)});
 root.setAttribute('data-golden-spin-b','');measure();q=target=expanded()?1:0;render();
 observer.observe(orbit,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
 observer.observe(hubBall,{attributes:true,attributeFilter:['class']});
 resize.observe(root);resize.observe(orbit);
 for(let ancestor:Node|null=root.parentNode;ancestor;ancestor=ancestor.parentNode)connectedObserver.observe(ancestor,{childList:true});
 bodyObserver.observe(document.body,{attributes:true,attributeFilter:['style']});
 bodyObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-dgu-visualMotion']});
 const reduced=()=>{if(disabled())settle(expanded()?1:0)};
 const leave=()=>settle(expanded()?1:0);
 media.addEventListener('change',reduced);window.addEventListener('resize',schedule);window.addEventListener('pagehide',leave);
 visualViewport?.addEventListener('resize',schedule);orbit.addEventListener('scroll',schedule,{passive:true});
 function destroy(){if(dead)return;stop();dead=true;cancelAnimationFrame(layoutFrame);observer.disconnect();resize.disconnect();connectedObserver.disconnect();bodyObserver.disconnect();media.removeEventListener('change',reduced);window.removeEventListener('resize',schedule);window.removeEventListener('pagehide',leave);visualViewport?.removeEventListener('resize',schedule);orbit.removeEventListener('scroll',schedule);for(const node of [...saved.keys()])restore(node);for(const node of originalTabs.keys())restoreTab(node);root.removeAttribute('data-golden-spin-b');delete root.dataset.gsPhase;delete root.dataset.gsMoving}
 return {
  configure(next:Partial<Options>){const wasMoving=!!stopClock;Object.assign(options,next);if(disabled())settle(expanded()?1:0);else if(wasMoving)animate(target)},
  relayout:schedule,
  inspect:()=>({q,velocity,target,moving:!!stopClock,engine:options.engine,nodes:nodes.length,renderCount,scaleX,scaleY,dead,phase:root.dataset.gsPhase,geometry:{origin,targets,correction,segmentT}}),
  destroy
 };
}
