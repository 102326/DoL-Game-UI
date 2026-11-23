import {sourceMotion} from './source-motion';
import {fadeWindow} from './window-fade';
import type {SurfaceMotion} from '../../framework/contracts';

type Budget = Readonly<SurfaceMotion>;
/** Settings owns its dialog, preferences and endpoints. Older Hosts retain native playback. */
export function settingsFade(resolve: () => Budget | undefined) {
 let host: Budget | undefined, track: ReturnType<Budget['track']> | undefined;
 let fallback: ReturnType<typeof sourceMotion> | undefined;
 function cancel() {track?.cancel(); fallback?.cancel()}
 function dispose() {track?.release(); track = undefined; host = undefined; fallback?.dispose(); fallback = undefined}
 function to(panel: HTMLElement, target: 0 | 1, initial?: number) {
  const current = resolve();
  if (host !== current) {dispose(); host = current}
  if (!host) return fadeWindow(fallback ??= sourceMotion(), panel, target, initial);
  if (!document.documentElement.hasAttribute('data-dgu-visualMotion')) {cancel(); return}
  track ??= host.track([{opacity: 0}, {opacity: 1}], 100, 80);
  return track.to(panel, !!target, initial);
 }
 return {to, cancel, dispose};
}
