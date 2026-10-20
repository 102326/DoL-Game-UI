import {gsap} from 'gsap';
import {createSphere} from './sphere';

/** Prototype adapter: MotionHub retains its tools, layout, events and logical open state. */
export function sphereHub(root:HTMLElement) {
 const ball=root.querySelector<HTMLButtonElement>('.sf-motion-ball')!;
 const orbit=root.querySelector<HTMLElement>('.sf-motion-orbit')!;
 const canvas=document.createElement('canvas');canvas.className='spin-hub-canvas';canvas.setAttribute('aria-hidden','true');ball.append(canvas);
 const sphere=createSphere(canvas,phase=>{root.dataset.spinBall=phase});
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const saved=new Map<HTMLElement,Map<string,string>>(),tabs=new Map<HTMLElement,string|null>();
 const state={q:0};let target=0,dead=false,timeline:gsap.core.Timeline|undefined,frame=0;
 let nodes:HTMLElement[]=[],targets:{x:number;y:number}[]=[],origin={x:0,y:0},scale={x:1,y:1};
 const expanded=()=>orbit.classList.contains('is-expanded');
 const reduced=()=>media.matches||(document.documentElement.hasAttribute('data-dol-midnight')&&!document.documentElement.hasAttribute('data-dgu-visualMotion'));
 function set(node:HTMLElement,key:string,value:string) {
  let props=saved.get(node);if(!props){props=new Map();saved.set(node,props)}
  if(!props.has(key))props.set(key,node.style.getPropertyValue(key));
  if(value)node.style.setProperty(key,value);else node.style.removeProperty(key);
 }
 function restore(node:HTMLElement){for(const [key,value]of saved.get(node)??[])if(value)node.style.setProperty(key,value);else node.style.removeProperty(key);saved.delete(node)}
 function restoreTab(node:HTMLElement){const value=tabs.get(node);if(value==null)node.removeAttribute('tabindex');else node.setAttribute('tabindex',value)}
 function measure(){
  const previous=nodes;nodes=[...orbit.querySelectorAll<HTMLElement>(':scope>.sf-motion-petal')];
  for(const node of previous)if(!nodes.includes(node)){restore(node);restoreTab(node);tabs.delete(node)}
  for(const node of nodes){if(!tabs.has(node))tabs.set(node,node.getAttribute('tabindex'));set(node,'transform','none')}
  const rect=root.getBoundingClientRect();scale={x:rect.width/Math.max(1,root.offsetWidth),y:rect.height/Math.max(1,root.offsetHeight)};
  const b=ball.getBoundingClientRect();origin={x:b.x+b.width/2,y:b.y+b.height/2};
  targets=nodes.map(node=>{const r=node.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});
 }
 function render(){
  if(dead)return;
  const moving=!!timeline,q=state.q;
  root.dataset.spinPhase=moving?'moving':q===1?'open':'closed';
  set(orbit,'visibility',q>0||target===1?'visible':'hidden');
  set(orbit,'--spin-shell',String(Math.max(0,(q-.25)/.75)));
  for(const [i,node]of nodes.entries()){
   const t=Math.max(0,Math.min(1,(q-i*.035)/(1-i*.035)));
   const dx=origin.x-targets[i].x,dy=origin.y-targets[i].y;
   const bend=Math.sin(t*Math.PI)*Math.min(34,Math.hypot(dx,dy)*.12);
   set(node,'transform',t===1?'none':`translate(${(dx*(1-t)+bend)/scale.x}px,${(dy*(1-t)-bend*.5)/scale.y}px) scale(${.3+.7*t})`);
   set(node,'opacity',String(Math.min(1,t*2)));
   set(node,'pointer-events',!moving&&target===1?'':'none');
   if(!moving&&target===1)restoreTab(node);else node.tabIndex=-1;
  }
  const utility=orbit.querySelector<HTMLElement>('.sf-motion-utilities');
  if(utility){set(utility,'opacity',String(Math.max(0,(q-.65)/.35)));set(utility,'pointer-events',!moving&&target===1?'':'none')}
 }
 function stop(){timeline?.kill();timeline=undefined}
 function animate(next:number){
  if(dead)return;
  stop();target=next;measure();
  if(reduced()){sphere.recover();state.q=next;render();return}
  if(next)sphere.play();else sphere.recover();
  if(!next&&orbit.contains(document.activeElement))ball.focus({preventScroll:true});
  timeline=gsap.timeline({onUpdate:render,onComplete(){timeline=undefined;state.q=next;render()}});
  timeline.to(state,{q:next,delay:next&&state.q===0?1.06:0,duration:Math.max(.2,Math.abs(next-state.q)*(next?.85:.65)),ease:next?'power3.out':'power2.inOut'});
  render();
 }
 function relayout(){frame=0;if(dead)return;measure();render()}
 const schedule=()=>{if(!dead&&!frame)frame=requestAnimationFrame(relayout)};
 const observer=new MutationObserver(records=>{
  if(ball.classList.contains('is-dragging')){stop();target=state.q=0;sphere.recover();schedule();return}
  const next=expanded()?1:0;
  if(next!==target)animate(next);
  else if(records.some(r=>r.type==='childList'))schedule();
 });
 const resize=new ResizeObserver(schedule);
 const preference=()=>{if(reduced()){stop();target=state.q=expanded()?1:0;sphere.recover();render()}};
 const visibility=()=>{if(document.hidden){timeline?.pause()}else{timeline?.resume();schedule()}};
 root.setAttribute('data-spin-hub','');measure();target=state.q=expanded()?1:0;render();
 observer.observe(orbit,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
 observer.observe(ball,{attributes:true,attributeFilter:['class','style']});
 resize.observe(orbit);resize.observe(ball);resize.observe(root);
 media.addEventListener('change',preference);document.addEventListener('visibilitychange',visibility);window.addEventListener('resize',schedule);
 return {sphere,relayout:schedule,inspect:()=>({q:state.q,target,moving:!!timeline,nodes:nodes.length,phase:root.dataset.spinPhase,dead,sphere:sphere.inspect()}),
  destroy(){if(dead)return;stop();dead=true;cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();media.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',schedule);sphere.destroy();canvas.remove();for(const node of saved.keys())restore(node);for(const node of tabs.keys())restoreTab(node);root.removeAttribute('data-spin-hub');delete root.dataset.spinPhase;delete root.dataset.spinBall}
 };
}
