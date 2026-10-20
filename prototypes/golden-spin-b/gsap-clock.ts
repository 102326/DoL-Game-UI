import {gsap} from 'gsap';
export function gsapClock(seconds:number,update:(t:number)=>void,complete:()=>void) {
 const clock={t:0};
 const timeline=gsap.timeline({onUpdate:()=>update(clock.t),onComplete:complete});
 timeline.addLabel('charge',0).addLabel('transfer',seconds*.14).addLabel('settle',seconds*.8)
  .to(clock,{t:1,duration:seconds,ease:'none'},0);
 return ()=>{timeline.kill()};
}
