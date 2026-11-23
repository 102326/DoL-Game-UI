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
function record(event:string,pointer?:PointerEvent){
 const panel=dialog(),shell=panel?.querySelector<HTMLElement>('.dmt-settings-shell');
 const header=shell?.querySelector('.dmt-settings-header');
 if(!panel||!shell||!header)return;
 const box=shell.getBoundingClientRect(),player=shell.getAnimations()[0],focus=document.activeElement;
 if(player&&!ids.has(player))ids.set(player,++nextId);
 console.info('SW41 '+JSON.stringify({event,t:performance.now(),open:panel.open,leaving:panel.hasAttribute('data-sf-leaving'),
  rect:[box.x,box.y],track:player?{id:ids.get(player),ms:player.currentTime,rate:player.playbackRate}:null,
  pointer:pointer?{id:pointer.pointerId,type:pointer.pointerType,trusted:pointer.isTrusted,xy:[pointer.clientX,pointer.clientY],
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
  if(!header||!pointer.composedPath().includes(header))return;
  record(event+'.before',pointer);
  // Sample after the consumer's handler even when it stops bubbling on move.
  header.addEventListener(event,()=>{record(event+'.after',pointer);nextFrame()},{once:true});
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
