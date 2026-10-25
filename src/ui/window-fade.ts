import type {sourceMotion} from './source-motion';

/** Settings and reviewed native windows share the accepted short opening/closing cadence. */
export function fadeWindow(motion:Pick<ReturnType<typeof sourceMotion>,'animate'>,panel:HTMLElement,target:0|1,initial?:number){
 const opacity=initial??Number(getComputedStyle(panel).opacity),from=Number.isFinite(opacity)?Math.max(0,Math.min(1,opacity)):1;
 return motion.animate(panel,[{opacity:from},{opacity:target}],(target?100:80)*Math.abs(target-from),'linear');
}
