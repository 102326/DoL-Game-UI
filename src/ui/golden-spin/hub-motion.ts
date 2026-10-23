import {gsap} from 'gsap';
import {visualScope} from '../visual-scope';
import {createSphere} from './sphere';

/** Shared visual adapter: MotionHub owns tool activation, native layout and logical open state. */
export function sphereHub(root:HTMLElement) {
 const scope=visualScope();let dead=false;
 try{
 const ball=root.querySelector<HTMLButtonElement>('.sf-motion-ball')!;
 const orbit=root.querySelector<HTMLElement>('.sf-motion-orbit')!;
 const canvas=document.createElement('canvas');canvas.className='spin-hub-canvas';canvas.setAttribute('aria-hidden','true');ball.append(canvas);scope.own(()=>canvas.remove());
 const makeSphere=()=>{const visual=createSphere(canvas,phase=>{root.dataset.spinBall=phase});visual.configure({duration:.65});return visual};
 let sphere:ReturnType<typeof createSphere>;
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 type Property={value:string;priority:string;written:string;writtenPriority:string};
 const saved=new Map<HTMLElement,Map<string,Property>>(),tabs=new Map<HTMLElement,string|null>();
 const state={q:0};let target=0,timeline:gsap.core.Timeline|undefined,frame=0,renders=0;
 let press:{id:number;node:HTMLElement}|undefined;
 let geometryValid=true;
 let nodes:HTMLElement[]=[],controls:HTMLElement[]=[],targets:{x:number;y:number}[]=[],origin={x:0,y:0},scale={x:1,y:1};
 const expanded=()=>orbit.classList.contains('is-expanded');
 const reduced=()=>media.matches||(document.documentElement.hasAttribute('data-dol-midnight')&&!document.documentElement.hasAttribute('data-dgu-visualMotion'));
 function set(node:HTMLElement,key:string,value:string) {
  let props=saved.get(node);if(!props){props=new Map();saved.set(node,props)}
  let before=props.get(key);if(!before){before={value:node.style.getPropertyValue(key),priority:node.style.getPropertyPriority(key),written:'',writtenPriority:''};props.set(key,before)}
  if(value)node.style.setProperty(key,value);else node.style.removeProperty(key);
  before.written=node.style.getPropertyValue(key);before.writtenPriority=node.style.getPropertyPriority(key);
 }
 function restoreProperty(node:HTMLElement,key:string){
  const props=saved.get(node),before=props?.get(key);if(!before)return;
  if(node.style.getPropertyValue(key)===before.written&&node.style.getPropertyPriority(key)===before.writtenPriority){if(before.value)node.style.setProperty(key,before.value,before.priority);else node.style.removeProperty(key)}
  props!.delete(key);if(!props!.size)saved.delete(node);
 }
 function restore(node:HTMLElement){for(const key of [...saved.get(node)?.keys()??[]])restoreProperty(node,key)}
 function restoreTab(node:HTMLElement){if(!tabs.has(node))return;const value=tabs.get(node);if(node.getAttribute('tabindex')==='-1'){if(value==null)node.removeAttribute('tabindex');else node.setAttribute('tabindex',value)}tabs.delete(node)}
 function interactive(node:HTMLElement,ready:boolean){
  if(ready){restoreProperty(node,'pointer-events');restoreTab(node)}
  else{set(node,'pointer-events','none');if(!tabs.has(node))tabs.set(node,node.getAttribute('tabindex'));node.tabIndex=-1}
 }
 function measure(){
  const previous=controls;
  nodes=[...orbit.querySelectorAll<HTMLElement>(':scope>.sf-motion-petal')];
  controls=[...nodes,...orbit.querySelectorAll<HTMLElement>('.sf-motion-utilities button')];
  for(const node of previous)if(!controls.includes(node)){restore(node);restoreTab(node);if(press?.node===node)press=undefined}
  for(const node of nodes)set(node,'transform','none');
  const rect=root.getBoundingClientRect();scale={x:rect.width/Math.max(1,root.offsetWidth),y:rect.height/Math.max(1,root.offsetHeight)};
  geometryValid=Number.isFinite(scale.x)&&Number.isFinite(scale.y)&&scale.x>0&&scale.y>0;
  if(!geometryValid){sphere.pause(true);timeline?.pause();return}
  const b=ball.getBoundingClientRect();origin={x:b.x+b.width/2,y:b.y+b.height/2};
  targets=nodes.map(node=>{const r=node.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});
 }
 function render(){
  if(dead)return;
  // Hosts can report a new preference before sending the corresponding notification.
  if(timeline&&reduced()){settleMotion();return}
  renders++;
  const moving=!!timeline,q=state.q;
  root.dataset.spinPhase=moving?'moving':q===1?'open':'closed';
  set(orbit,'visibility',q>0||target===1?'visible':'hidden');
  set(orbit,'--spin-shell',String(Math.max(0,(q-.25)/.75)));
  for(const [i,node]of nodes.entries()){
   const t=Math.max(0,Math.min(1,(q-i*.035)/(1-i*.035)));
   const point=targets[i]??origin,dx=origin.x-point.x,dy=origin.y-point.y;
   const bend=Math.sin(t*Math.PI)*Math.min(34,Math.hypot(dx,dy)*.12);
   if(geometryValid)set(node,'transform',t===1?'none':`translate(${(dx*(1-t)+bend)/scale.x}px,${(dy*(1-t)-bend*.5)/scale.y}px) scale(${.3+.7*t})`);
   set(node,'opacity',String(Math.min(1,t*2)));
   interactive(node,geometryValid&&target===1&&t>=.65);
  }
  const utility=orbit.querySelector<HTMLElement>('.sf-motion-utilities');
  if(utility){set(utility,'opacity',String(Math.max(0,(q-.65)/.35)));for(const node of utility.querySelectorAll<HTMLElement>('button'))interactive(node,geometryValid&&target===1&&q>=.85)}
 }
 function stop(){timeline?.kill();timeline=undefined}
 function stillSphere(){
  if(media.matches)sphere.recover();
  else{sphere.destroy();sphere=makeSphere()}
 }
 function settleMotion(){stop();press=undefined;state.q=target=expanded()?1:0;stillSphere();render();holdInput()}
 function holdInput(){
  const blocked=document.hidden||!geometryValid||reduced();sphere.pause(blocked);
  if(!timeline)return;
  if(blocked){timeline.pause();return}
  const focused=document.activeElement;
  const keyboard=focused instanceof HTMLElement&&controls.includes(focused)&&focused.matches(':focus-visible');
  if(target===1&&(press||keyboard))timeline.pause();else timeline.resume();
 }
 function animate(next:number){
  if(dead)return;
  stop();target=next;measure();
  if(reduced()){settleMotion();return}
  if(next)sphere.play();else{press=undefined;sphere.recover()}
  if(!next&&orbit.contains(document.activeElement))ball.focus({preventScroll:true});
  timeline=gsap.timeline({onUpdate:render,onComplete(){timeline=undefined;state.q=next;render()}});
  timeline.to(state,{q:next,duration:Math.max(.2,Math.abs(next-state.q)*(next?.24:.65)),ease:next?'power3.out':'power2.inOut'});
  render();holdInput();
 }
 function relayout(){frame=0;if(dead)return;measure();render();holdInput()}
 const schedule=()=>{if(!dead&&!frame)frame=Number(scope.frame(relayout))};
 const observer=new MutationObserver(records=>{
  if(dead)return;
  if(ball.classList.contains('is-dragging')){if(timeline||state.q>0){stop();target=state.q=0;press=undefined;sphere.recover()}schedule();return}
  const next=expanded()?1:0;
  if(next!==target)animate(next);
  else if(records.some(r=>r.type==='childList'))schedule();
 });
 const resize=new ResizeObserver(schedule);
 const preference=()=>{if(dead)return;if(reduced())settleMotion();else holdInput()};
 const visibility=()=>{if(dead)return;holdInput();if(!document.hidden)schedule()};
 const down=(event:PointerEvent)=>{
  const node=event.target instanceof Element?event.target.closest<HTMLElement>('button'):null;
  if(target!==1||!node||!controls.includes(node)||event.button!==0||!event.isPrimary)return;
  press={id:event.pointerId,node};holdInput();
 };
 const up=(event:PointerEvent)=>{if(press?.id===event.pointerId){press=undefined;schedule()}};
 const focus=()=>{holdInput();schedule()};
 const leave=()=>settleMotion();
 const flags=new MutationObserver(preference);
 scope.own(()=>{for(const node of [...saved.keys()])restore(node);for(const node of [...tabs.keys()])restoreTab(node);root.removeAttribute('data-spin-hub');delete root.dataset.spinPhase;delete root.dataset.spinBall});
 scope.own(()=>{stop();press=undefined;scope.cancelFrame(relayout);frame=0});
 scope.own(()=>observer.disconnect());scope.own(()=>flags.disconnect());scope.own(()=>resize.disconnect());
 sphere=makeSphere();scope.own(()=>sphere.destroy());
 root.setAttribute('data-spin-hub','');measure();target=state.q=expanded()?1:0;render();holdInput();
 observer.observe(orbit,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
 observer.observe(ball,{attributes:true,attributeFilter:['class','style']});
 flags.observe(document.documentElement,{attributes:true,attributeFilter:['data-dgu-visualmotion']});
 resize.observe(orbit);resize.observe(ball);resize.observe(root);
 function listen(target:EventTarget,type:string,handler:EventListener,capture=false){target.addEventListener(type,handler,capture);scope.own(()=>target.removeEventListener(type,handler,capture))}
 listen(media,'change',preference);listen(document,'visibilitychange',visibility);listen(window,'resize',schedule);listen(window,'pagehide',leave);
 listen(root,'pointerdown',down as EventListener,true);listen(window,'pointerup',up as EventListener,true);listen(window,'pointercancel',up as EventListener,true);listen(root,'focusin',focus);listen(root,'focusout',focus);
 return {get sphere(){return sphere},relayout:schedule,inspect:()=>({q:state.q,target,moving:!!timeline,paused:!!timeline?.paused(),pressed:!!press,geometryValid,nodes:nodes.length,phase:root.dataset.spinPhase,dead,renders,framePending:!!frame,sphere:sphere.inspect()}),
  destroy(){if(dead)return;dead=true;scope.dispose()}
 };
 }catch(error){dead=true;try{scope.dispose()}catch(cleanup){throw new AggregateError([error,cleanup],'Hub visual construction failed')}throw error}
}
