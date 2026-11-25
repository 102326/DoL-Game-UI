import type {MountContext} from '../contracts';
import type {createPanelBudget} from '../motion/panel-budget';

/** Consumers use their own texture. All legs follow the document timeline, including late joins. */
export function driftingTexture(budget: Pick<ReturnType<typeof createPanelBudget>, 'track'>) {
 return (context: MountContext, texture: HTMLElement, distance: number, duration: number) => {
  if (!context.element.contains(texture) || !Number.isFinite(distance) || distance <= 0 ||
      !Number.isFinite(duration) || duration <= 0) throw Error('Invalid mounted texture');

  const track = budget.track([{transform: `translateX(-${distance}%)`}, {transform: `translateX(${distance}%)`}], duration, duration);
  let active: Animation | undefined;
  function stop() {
   active = undefined;
   track.cancel();
  }
  function play() {
   if (active || !context.isCurrent()) return;
   const time = Number(texture.ownerDocument.timeline.currentTime);
   const leg = Math.floor(time / duration);
   const forward = leg % 2 === 0;
   const elapsed = time - leg * duration;
   const player = track.to(texture, forward, forward ? elapsed / duration : 1 - elapsed / duration);
   if (!player) return; // A denied slot keeps the texture static.
   active = player;
   // A pending WAAPI play normally starts on a later frame. Pin its origin to the
   // leg boundary so a resize, tab return or consumer handoff cannot accumulate lag.
   player.startTime = (forward ? leg : leg + 1) * duration;
   void player.finished.then(() => {
    if (active !== player) return;
    stop();
    play();
   }, () => { if (active === player) active = undefined; });
  }
  context.onCleanup(() => { stop(); track.release(); });
  return (moving: boolean) => { if (moving) play(); else stop(); };
 };
}
