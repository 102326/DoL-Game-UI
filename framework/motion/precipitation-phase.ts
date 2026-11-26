export type Precipitation = 'sunny' | 'rain' | 'snow';
export const duration = 450;
export const frameTime = () => Number(document.timeline.currentTime ?? performance.now());
export const weightsFor = (kind: Precipitation) => ({rain:Number(kind === 'rain'), snow:Number(kind === 'snow')});

/** Sample on demand. Renderers keep their own frame loop and lifetime. */
export function precipitationPhase(now = frameTime) {
 let kind: Precipitation = 'sunny', start = -duration;
 let from = weightsFor(kind), target = from;
 function sample(time = now()) {
  const progress = Math.max(0, Math.min(1, (time - start) / duration));
  return {time, progress, rain:from.rain + (target.rain - from.rain)*progress,
   snow:from.snow + (target.snow - from.snow)*progress};
 }
 function set(next: Precipitation, immediate = false) {
  if (kind === next) return;
  const time = now();
  from = immediate ? weightsFor(next) : sample(time);
  kind = next; target = weightsFor(next); start = immediate ? time - duration : time;
 }
 return {sample, set};
}
