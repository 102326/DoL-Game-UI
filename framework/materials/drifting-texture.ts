import type {MountContext, SurfaceMotion} from '../contracts';

/** Paint a caller-styled texture inside its own mount. A denied slot leaves the texture static. */
export function driftingTexture(motion:SurfaceMotion){
 return (context:MountContext, texture:HTMLElement, distance:number, duration:number)=>{
  if(!context.element.contains(texture)||!Number.isFinite(distance)||distance<=0||!Number.isFinite(duration)||duration<=0)throw Error('Invalid mounted texture');
  const track=motion.track([{transform:`translateX(-${distance}%)`},{transform:`translateX(${distance}%)`}],duration,duration);
  let pending=false,epoch=0;
  function stop(){++epoch;pending=false;track.cancel()}
  function play(){
   if(pending||!context.isCurrent())return;
   // Late consumers join the same phase without a separate frame clock.
   const phase=(Number(texture.ownerDocument.timeline.currentTime)||0)/duration%2;
   const forward=phase<1,progress=forward?phase:2-phase;
   const request=track.to(texture,forward,progress);
   if(!request)return;
   pending=true;const ticket=epoch;
   void request.finished.then(outcome=>{
    if(ticket!==epoch)return;
    pending=false;
    if(outcome==='finished'&&context.isCurrent()){track.cancel();play()}
   });
  }
  context.onCleanup(()=>{stop();track.release()});
  return (moving:boolean)=>{if(moving)play();else if(pending)stop()};
 };
}
