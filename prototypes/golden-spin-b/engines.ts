import {gsapClock} from './gsap-clock';
import {waapiClock} from './waapi-clock';
export type Engine = 'gsap'|'waapi';
export function runClock(engine:Engine,seconds:number,update:(t:number)=>void,complete:()=>void) {
 return (engine==='gsap'?gsapClock:waapiClock)(seconds,update,complete);
}
