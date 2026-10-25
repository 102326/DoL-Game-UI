export function waapiClock(seconds:number,update:(t:number)=>void,complete:()=>void) {
 // A native timing effect, not an invisible copy of a tool.
 const animation=new Animation(new KeyframeEffect(null,[],{duration:seconds*1000,fill:'both'}),document.timeline);
 let frame=0,stopped=false;
 function tick(){if(stopped)return;update(Math.min(1,Number(animation.currentTime??0)/(seconds*1000)));if(animation.playState!=='finished')frame=requestAnimationFrame(tick)}
 animation.onfinish=()=>{if(stopped)return;cancelAnimationFrame(frame);update(1);animation.onfinish=null;animation.cancel();complete()};
 animation.play();frame=requestAnimationFrame(tick);
 return ()=>{stopped=true;cancelAnimationFrame(frame);animation.onfinish=null;animation.cancel()};
}
