// Neutral page only. Observe the real settings track before loading official UI.
export {};
const host=window.DoLUiHost!, motion=host.panelEffects!;
let acquired=0, released=0;
window.DoLUiHost={...host,panelEffects:{track(...args){
 const track=motion.track(...args);
 let settings=false;
 return {...track,to(node,...request){
  if(!settings&&node.matches('.dmt-settings-shell')){settings=true;acquired++}
  return track.to(node,...request);
 },release(){track.release();if(settings){settings=false;released++}}};
}}};
host.sceneReady();

const dialog=()=>document.querySelector<HTMLDialogElement>('#dol-midnight-controls');
const opener=()=>document.querySelector<HTMLButtonElement>('#dol-midnight-sidebar-button');
const ids=new WeakMap<Animation,number>();let nextId=0,frame=0;
function region(node:Element){
 if(node.closest('#pull-grip'))return 'grip';
 if(node.closest('.dmt-close'))return 'close';
 if(node.closest('.dmt-settings-header'))return 'title';
 return 'form';
}
const starts=new Map<number,Element>();
function record(event:string,pointer?:PointerEvent){
 const panel=dialog(),shell=panel?.querySelector<HTMLElement>('.dmt-settings-shell');
 const header=shell?.querySelector('.dmt-settings-header');
 if(!panel||!shell||!header)return;
 const box=shell.getBoundingClientRect(),player=shell.getAnimations()[0],focus=document.activeElement;
 if(player&&!ids.has(player))ids.set(player,++nextId);
 const target=pointer?.target instanceof Element?pointer.target:undefined;
 const start=pointer&&starts.get(pointer.pointerId);
 const owner=pointer&&[header,target,start,...pointer.composedPath()].find(
  (node):node is Element=>node instanceof Element&&node.hasPointerCapture(pointer.pointerId));
 console.info('SW41 '+JSON.stringify({event,t:performance.now(),open:panel.open,leaving:panel.hasAttribute('data-sf-leaving'),
  rect:[box.x,box.y],track:player?{id:ids.get(player),ms:player.currentTime,rate:player.playbackRate}:null,
  pointer:pointer?{id:pointer.pointerId,type:pointer.pointerType,trusted:pointer.isTrusted,xy:[pointer.clientX,pointer.clientY],
   origin:start?region(start):null,target:target?region(target):null,
   capture:owner?{region:region(owner),tag:owner.localName,header:owner===header}:null,
   headerCapture:header.hasPointerCapture(pointer.pointerId)}:null,
  focus:focus===opener()?'opener':focus?.matches('.dmt-close')?'close':panel.contains(focus)?'panel':'outside',
  acquired,released}));
}
function nextFrame(){
 if(!frame)frame=requestAnimationFrame(()=>{frame=0;record('pre-paint');
  if(dialog()?.querySelector('.dmt-settings-shell')?.getAnimations().length)nextFrame();
 });
}
for(const event of ['pointerdown','pointermove','pointerup','pointercancel','gotpointercapture','lostpointercapture']){
 window.addEventListener(event,e=>{
  const pointer=e as PointerEvent;
  const header=dialog()?.querySelector('.dmt-settings-header');
  const target=pointer.target;
  if(!(target instanceof Element)||!header||!dialog()?.contains(target))return;
  if(event==='pointerdown')starts.set(pointer.pointerId,target);
  record(event+'.before',pointer);
  // Sample after the consumer's handler even when it stops bubbling on move.
  const receiver=header.contains(target)?header:target;
  receiver.addEventListener(event,()=>{
   record(event+'.after',pointer);nextFrame();
   if(event==='pointerup'||event==='pointercancel')starts.delete(pointer.pointerId);
  },{once:true});
 },true);
}
document.addEventListener('click',e=>{
 if(e.target instanceof Element&&e.target.closest('#dol-midnight-sidebar-button,.dmt-close')){
  record('click');nextFrame();
 }
},true);
document.addEventListener('close',e=>{if(e.target===dialog()){record('close');nextFrame()}},true);
// Optional countdown gives the operator time to reach the title during normal-speed entry.
document.querySelector('#cue')!.addEventListener('click',()=>setTimeout(()=>{
 const button=opener();if(button&&!dialog()?.open){button.focus();button.click()}
},1000));

// Optional neutral-page affordance. The real title handler owns pointer capture,
// shell displacement and release; this fixture only recognizes close intent.
const option=document.querySelector<HTMLInputElement>('#pull-option')!;
let detach:(()=>void)|undefined;
function syncPullHandle(){
 detach?.();detach=undefined;
 const panel=dialog(),header=panel?.querySelector<HTMLElement>('.dmt-settings-header');
 if(!option.checked||!panel||!header)return;
 const mark=document.createElement('span');
 mark.id='pull-grip';mark.textContent='↓ 下拉收起';
 mark.style.cssText='display:grid;place-items:center;min-height:44px;touch-action:none;user-select:none';
 header.insertBefore(mark,header.querySelector('.dmt-close'));
 let start:{id:number;x:number;y:number}|undefined;
 const begin=(e:PointerEvent)=>{
  if(start||e.target!==mark||e.pointerType!=='touch'||!e.isPrimary||!header.hasPointerCapture(e.pointerId))return;
  start={id:e.pointerId,x:e.clientX,y:e.clientY};
 };
 const finish=(e:PointerEvent)=>{
  if(!start||e.pointerId!==start.id)return;
  const dx=e.clientX-start.x,dy=e.clientY-start.y;start=undefined;
  if(e.type==='pointerup'&&dy>=56&&dy>Math.abs(dx)*1.5&&panel.open&&!panel.hasAttribute('data-sf-leaving'))
   header.querySelector<HTMLButtonElement>('.dmt-close')?.click();
 };
 header.addEventListener('pointerdown',begin);
 const ends=['pointerup','pointercancel','lostpointercapture'] as const;
 for(const type of ends)header.addEventListener(type,finish);
 detach=()=>{header.removeEventListener('pointerdown',begin);for(const type of ends)header.removeEventListener(type,finish);mark.remove()};
}
option.addEventListener('change',syncPullHandle);
document.addEventListener('click',e=>{
 if(e.target instanceof Element&&e.target.closest('#dol-midnight-sidebar-button'))queueMicrotask(syncPullHandle);
},true);
