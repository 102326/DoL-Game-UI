/** Experimental Host service. A track writes animation properties on one caller-owned layer. */
export function createPanelBudget(root: Window, limit = 1) {
 const active = new Map<HTMLElement, () => void>();
 const reduced = root.matchMedia?.('(prefers-reduced-motion: reduce)');
 let disposed = false;
 function stopAll() { for (const stop of [...active.values()]) stop(); }
 function policyChanged() { if (reduced?.matches || root.document.hidden) stopAll(); }
 function listen() {
  reduced?.addEventListener('change', policyChanged);
  root.document.addEventListener('visibilitychange', policyChanged);
  root.addEventListener('pagehide', stopAll);
  root.addEventListener('resize', stopAll);
 }
 function unlisten() {
  reduced?.removeEventListener('change', policyChanged);
  root.document.removeEventListener('visibilitychange', policyChanged);
  root.removeEventListener('pagehide', stopAll);
  root.removeEventListener('resize', stopAll);
 }
 function track(frames: Keyframe[], enter: number, exit: number) {
  let layer: HTMLElement | undefined, animation: Animation | undefined, released = false;
  function cancel() {
   if (!layer) return;
   active.delete(layer);
   layer = undefined;
   const old = animation;
   animation = undefined;
   old?.cancel();
   if (!active.size) unlisten();
  }
  function to(node: HTMLElement, shown: boolean, initial = shown ? 0 : 1) {
   if (layer && layer !== node) cancel();
   if (released || disposed || root.document.hidden || !reduced || reduced.matches ||
       node.ownerDocument !== root.document || !node.isConnected || !node.animate ||
       !(enter > 0 && exit > 0)) {cancel(); return}
   if (!animation) {
    if (active.size >= limit || active.has(node)) return;
    try { animation = node.animate(frames, {duration: enter, easing: 'linear'}); }
    catch {return}
    layer = node;
    if (!active.size) listen();
    active.set(node, cancel);
    animation.currentTime = Math.min(1, Math.max(0, initial)) * enter;
   }
   const time = Number(animation.currentTime);
   if (shown ? time >= enter : time <= 0) {cancel(); return}
   animation.playbackRate = shown ? 1 : -enter / exit;
   animation.play();
   const running = animation;
   running.onfinish = running.oncancel = () => {if (running === animation) cancel()};
   return running;
  }
  return {to, cancel, release() {released = true; cancel()}};
 }
 return {track, activeCount: () => active.size, dispose() {disposed = true; stopAll()}};
}
