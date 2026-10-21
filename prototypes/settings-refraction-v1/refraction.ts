// An isolated settings study: no global motion adapter or game action ownership.
import {gsap} from 'gsap';
// Keep the new visual path; match the release category response curve, not just duration.
const revision=new URLSearchParams(location.search).get('revision');
export const timing=revision==='v1'?{revision:'v1',open:1.30,close:1.30,enter:.83,leave:.42}:revision==='v2'?{revision:'v2',open:.56,close:.30,enter:.62,leave:.30}:revision==='v2.1'?{revision:'v2.1',open:.50,close:.26,enter:.62,leave:.30}:revision==='v2.2'?{revision:'v2.2',open:.50,close:.26,enter:.62,leave:.62}:{revision:'v2.3',open:.10,close:.08,enter:.62,leave:.62};
const simple=timing.revision==='v2.3';
type Evidence={event:string;at:number;[key:string]:unknown};
export const evidence:Evidence[]=[];
const note=(event:string,detail:Record<string,unknown>={})=>evidence.push({event,at:performance.now(),...detail});
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const enabled=()=>!document.hidden&&!reduced.matches&&document.documentElement.hasAttribute('data-dgu-visualMotion');
const pages=new Map<HTMLElement,{timeline?:gsap.core.Timeline;animation?:Animation;finish:()=>void}>();
export function cancelRefractedPage(element:Element){const job=pages.get(element as HTMLElement);if(job){job.timeline?.kill();job.animation?.cancel();job.finish()}}
export function disposeRefractedPages(){for(const element of [...pages.keys()])cancelRefractedPage(element)}
export function refractPage(node:HTMLElement,direction:number,entering:boolean,done:()=>void){
 cancelRefractedPage(node);
 const dialog=node.closest('dialog');
 node.toggleAttribute('inert',!entering);if(entering)node.removeAttribute('aria-hidden');else node.setAttribute('aria-hidden','true');
 if(!enabled()){done();return}
 dialog?.setAttribute('data-workspace-transition','');let finished=false;
 const finish=()=>{if(finished)return;finished=true;pages.delete(node);gsap.set(node,{clearProps:'transform,opacity,filter,clipPath,transformOrigin'});if(!pages.size)dialog?.removeAttribute('data-workspace-transition');done();note('category-settled',{entering,heading:node.getAttribute('aria-labelledby')})};
 if(timing.revision==='v2.2'||simple){
  // The release's 620ms curve does most visible work early. Retain the new
  // fold/rotation, remove its dead lead-in and reveal clipping early as well.
  const origin=direction>0?'0% 0%':'100% 0%';
  const animation=node.animate(entering?[
   {transformOrigin:origin,transform:`translate3d(${direction*80}px,16px,-100px) rotateY(${-direction*24}deg) rotateX(7deg)`,opacity:0,clipPath:direction>0?'inset(0 96% 0 0 round 16px)':'inset(0 0 0 96% round 16px)'},
   {clipPath:'inset(0 0% 0 0% round 0px)',offset:.55},
   {transformOrigin:origin,transform:'translate3d(0,0,0) rotateY(0deg) rotateX(0deg)',opacity:1,clipPath:'inset(0 0% 0 0% round 0px)',offset:.78},
   {transformOrigin:origin,transform:'translate3d(0,0,0) rotateY(0deg) rotateX(0deg)',opacity:1,clipPath:'inset(0 0% 0 0% round 0px)'}
  ]:[
   {transformOrigin:direction>0?'100% 0%':'0% 0%',transform:'translate3d(0,0,0) rotateY(0deg)',opacity:1,filter:'blur(0px)'},
   {transformOrigin:direction>0?'100% 0%':'0% 0%',transform:`translate3d(${direction*-45}px,0,-100px) rotateY(${direction*20}deg)`,opacity:0,filter:'blur(3px)'}
  ],{duration:1000*(entering?timing.enter:timing.leave),easing:'cubic-bezier(.16,1,.3,1)'});
  pages.set(node,{animation,finish});void animation.finished.then(finish,finish);
  note('category-start',{entering,direction,heading:node.getAttribute('aria-labelledby'),duration:entering?timing.enter:timing.leave,revision:timing.revision,easing:'cubic-bezier(.16,1,.3,1)'});return;
 }
 const timeline=gsap.timeline({onComplete:finish});pages.set(node,{timeline,finish});
 if(entering){
  gsap.set(node,{transformOrigin:direction>0?'0% 0%':'100% 0%',rotationY:direction*-24,rotationX:7,x:direction*80,y:16,z:-100,opacity:0,clipPath:direction>0?'inset(0 96% 0 0 round 16px)':'inset(0 0 0 96% round 16px)'});
  timeline.to(node,{rotationY:0,rotationX:0,x:0,y:0,z:0,opacity:1,clipPath:'inset(0 0% 0 0% round 0px)',duration:.76,ease:'power3.out'},.07);
 }else{
  timeline.to(node,{transformOrigin:direction>0?'100% 0%':'0% 0%',rotationY:direction*20,x:direction*-45,z:-100,opacity:0,filter:'blur(3px)',duration:.42,ease:'power2.inOut'},0);
 }
 timeline.timeScale((entering?.83:.42)/(entering?timing.enter:timing.leave));
 note('category-start',{entering,direction,heading:node.getAttribute('aria-labelledby'),duration:entering?timing.enter:timing.leave,revision:timing.revision});
}
export function createSettingsRefraction(){
 let timeline:gsap.core.Timeline|undefined,shell:HTMLElement|undefined,dialog:HTMLDialogElement|undefined,stage:HTMLElement|undefined;
 let content:HTMLElement|undefined,origin:HTMLElement|null=null,closing=false,disposed=false,onClosed:(()=>void)|undefined,usable=false;
 const clean=()=>{timeline?.kill();timeline=undefined;stage?.remove();stage=undefined;if(shell)gsap.set([shell,...shell.querySelectorAll<HTMLElement>('[data-rf-group]')],{clearProps:'transform,opacity,clipPath,filter,transformOrigin'});content?.removeAttribute('inert');shell?.querySelectorAll('[data-rf-group]').forEach(n=>n.removeAttribute('data-rf-group'));dialog?.removeAttribute('data-rf-state')};
 function update(){
  if(!timeline||!dialog)return;
  // The page's reveal ends at .525 + .61. Do not advertise partly clipped inputs as ready.
  const time=timeline.time();const nextUsable=!closing&&(simple||time>=1.14);
  content?.toggleAttribute('inert',!nextUsable);dialog.dataset.rfState=closing?'closing':time>=timeline.duration()?'open':nextUsable?'afterglow':'unfolding';
  if(nextUsable&&!usable)note('content-usable',{time});usable=nextUsable;
 }
 function settle(){
  disposeRefractedPages();
  if(closing){clean();onClosed?.();onClosed=undefined}else{timeline?.progress(1).pause();update()}
 }
 const changed=()=>{if(!enabled())settle()};
 const observer=new MutationObserver(changed);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-dgu-visualmotion']});
 reduced.addEventListener('change',changed);document.addEventListener('visibilitychange',changed);
 const resize=()=>{if(dialog?.open)settle()};window.addEventListener('resize',resize);
 function open(nextDialog:HTMLDialogElement,nextShell:HTMLElement,glass?:HTMLElement,lastFocus?:HTMLElement|null){
  if(disposed)return;dialog=nextDialog;shell=nextShell;closing=false;onClosed=undefined;origin=lastFocus??origin;
  note('open-request');
  if(timeline){timeline.timeScale(timeline.duration()/timing.open).play();update();return}
  if(!enabled()){dialog.dataset.rfState='open';return}
  if(glass)glass.style.opacity='0';
  content=shell.querySelector<HTMLElement>('.dmt-workspace-page')??undefined;
  if(simple){
   timeline=gsap.timeline({paused:true,onUpdate:update,onComplete:()=>{update();note('visual-settled')},onReverseComplete:()=>{clean();onClosed?.();onClosed=undefined;note('closed')}});
   timeline.fromTo(shell,{opacity:0},{opacity:1,duration:timing.open,ease:'none'}).play();update();
   note('input-acknowledged',{duration:timing.open,revision:timing.revision,transition:'opacity-only'});return;
  }
  const rect=shell.getBoundingClientRect(),from=origin?.isConnected?origin.getBoundingClientRect():null;
  const scale=rect.width/shell.offsetWidth;
  const unit=Number.isFinite(scale)&&scale>0?scale:1;
  const dx=(from&&from.width?from.x+from.width/2-rect.x-rect.width/2:0)/unit;
  const dy=(from&&from.height?from.y+from.height/2-rect.y-rect.height/2:rect.height*.3)/unit;
  stage=document.createElement('div');stage.className='rf-stage';stage.setAttribute('aria-hidden','true');
  stage.innerHTML='<div class="rf-plane rf-back"></div><div class="rf-plane rf-mid"></div><div class="rf-plane rf-face"></div><div class="rf-ridge"></div><div class="rf-caustic"></div>';
  shell.prepend(stage);
  const back=stage.querySelector('.rf-back'),mid=stage.querySelector('.rf-mid'),face=stage.querySelector('.rf-face'),ridge=stage.querySelector('.rf-ridge'),caustic=stage.querySelector('.rf-caustic');
  const groups=[...shell.querySelectorAll<HTMLElement>(':scope>.dmt-settings-header,:scope>.dmt-layout-choice,.dmt-workspace-nav,.dmt-workspace-page,:scope>.dmt-settings-footer')];
  groups.forEach(n=>n.setAttribute('data-rf-group',''));
  timeline=gsap.timeline({paused:true,onUpdate:update,onComplete:()=>{update();note('visual-settled')},onReverseComplete:()=>{clean();onClosed?.();onClosed=undefined;note('closed')}});
  timeline.fromTo(stage,{x:dx,y:dy,scaleX:.025,scaleY:.065,rotation:-18},{x:0,y:0,scaleX:1,scaleY:1,rotation:0,duration:.72,ease:'expo.inOut'},0)
   .fromTo(back,{clipPath:'inset(48% 50% 48% 50% round 24px)',opacity:0},{clipPath:'inset(0% 0% 0% 0% round 22px)',opacity:.7,duration:.66,ease:'power3.inOut'},.06)
   .fromTo(mid,{clipPath:'polygon(0 0, 4% 0, 0 8%, 0 8%)',rotationY:-25,opacity:0},{clipPath:'polygon(0 0, 100% 0, 100% 100%, 0 100%)',rotationY:0,opacity:.8,duration:.7,ease:'power3.inOut'},.17)
   .fromTo(face,{clipPath:'polygon(0 0, 3% 0, 0 6%, 0 6%)',opacity:0},{clipPath:'polygon(0 0, 100% 0, 100% 100%, 0 100%)',opacity:1,duration:.76,ease:'power3.inOut'},.23)
   .fromTo(ridge,{xPercent:-60,opacity:0},{xPercent:90,opacity:1,duration:.74,ease:'power2.inOut'},.13)
   .to(ridge,{opacity:0,duration:.28},.87)
   .fromTo(caustic,{xPercent:-100,opacity:0},{xPercent:100,opacity:.45,duration:1,ease:'power2.inOut'},.24)
   .to(caustic,{opacity:0,duration:.3},1.0);
  groups.forEach((group,index)=>timeline!.fromTo(group,{y:26+index*4,rotationX:-9,opacity:0,clipPath:'inset(0 90% 0 0 round 12px)'},{y:0,rotationX:0,opacity:1,clipPath:'inset(0 0% 0 0 round 0px)',duration:.61,ease:'power3.out'},.30+index*.075));
  if(origin?.isConnected)gsap.fromTo(origin,{scale:.94},{scale:1,duration:.3,clearProps:'transform'});
  timeline.timeScale(timeline.duration()/timing.open).play();update();note('input-acknowledged',{duration:timing.open,virtualDuration:timeline.duration(),origin:!!from,revision:timing.revision});
 }
 function close(done:()=>void){closing=true;onClosed=done;note('close-request',{time:timeline?.time()??0,duration:timing.close,revision:timing.revision});disposeRefractedPages();if(!enabled()||!timeline||timeline.time()===0){clean();onClosed=undefined;done();return}timeline.timeScale(timeline.duration()/timing.close).reverse();update()}
 return {open,close,dispose(){disposed=true;clean();if(origin){gsap.killTweensOf(origin);gsap.set(origin,{clearProps:'transform'})}disposeRefractedPages();observer.disconnect();reduced.removeEventListener('change',changed);document.removeEventListener('visibilitychange',changed);window.removeEventListener('resize',resize)}};
}
