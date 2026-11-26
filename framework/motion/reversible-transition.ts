/** Consumer-side Host SDK. The caller owns the surface and commits its endpoint. */
export function reversibleTransition(frames: Keyframe[], duration: number, settled: (shown: boolean) => void) {
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 let active: Animation | undefined;
 let target = false;

 function cancel() {
  reduced.removeEventListener('change', preferenceChanged);
  if (!active) return;
  active.onfinish = null;
  active.oncancel = null;
  active.cancel();
  active = undefined;
 }
 function finish() {
  cancel();
  settled(target);
 }
 function preferenceChanged() {
  if (reduced.matches) finish();
 }
 function to(element: HTMLElement, shown: boolean) {
  if (active && target === shown) return;
  target = shown;
  if (reduced.matches || !element.animate || duration <= 0) {
   finish();
   return;
  }
  if (!active) {
   const animation = element.animate(frames, {duration, easing: 'ease-out', fill: 'both'});
   active = animation;
   animation.currentTime = shown ? 0 : duration;
   animation.onfinish = () => {
    if (active === animation && animation.playState === 'finished') finish();
   };
   animation.oncancel = () => {if (active === animation) finish()};
   reduced.addEventListener('change', preferenceChanged);
  }
  // A held time at an endpoint must settle there. play() would wrap to the opposite end.
  const time = Number(active.currentTime);
  if (shown ? time >= duration : time <= 0) {finish(); return}
  active.playbackRate = shown ? 1 : -1;
  active.play();
 }
 return {to, cancel};
}
