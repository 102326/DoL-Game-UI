import type {Host, MountContext, Participant} from '../contracts';
import {settingsWeather} from '../../src/ui/weather/settings';
import type {SamplePrecipitation} from '../../src/ui/weather/surface';
import type {readGameWeather} from './weather';

type Drift = NonNullable<Host['layerPresets']>['driftingTexture'];
type CanvasWeather = ReturnType<typeof settingsWeather>;
type Layer = {
 kind: 'cloud' | 'canvas';
 current(): boolean;
 sync(): void;
 pause(): void;
 dispose(): void;
 snapshot?(): ReturnType<CanvasWeather['snapshot']> | undefined;
};

/** Keep exactly one environment renderer for a shell. Geometry stays relative to the real shell. */
export function windowEnvironment(parent: HTMLElement, key: string, read: () => ReturnType<typeof readGameWeather>,
 sample: SamplePrecipitation, owner?: Participant, drift?: Drift) {
 const attribute = 'data-sf-weather-material';
 const previous = parent.getAttribute(attribute);
 let layer: Layer | undefined;
 let cloudFailed = false, canvasFailed = false;

 function restore() {
  if (previous === null) parent.removeAttribute(attribute);
  else parent.setAttribute(attribute, previous);
 }
 function retire() {
  const old = layer;
  layer = undefined;
  old?.dispose();
 }
 function choice() {
  const state = read();
  return owner && drift && !cloudFailed && state.kind === 'cloud' && (!state.special || state.special === 'none') ? 'cloud' : 'canvas';
 }
 function mount(kind: Layer['kind']) {
  let renderer: CanvasWeather | undefined, moving: ((value: boolean) => void) | undefined;
  let canvas: HTMLCanvasElement | undefined, paused = false;
  function setup(context?: MountContext) {
   if (kind === 'cloud' && context && drift) {
    const clip = context.element, texture = document.createElement('span');
    clip.className = 'sf-cloud-layer';
    clip.inert = true;
    clip.setAttribute('aria-hidden', 'true');
    texture.className = 'sf-cloud-texture';
    clip.append(texture);
    moving = drift(context, texture, 7, 16000);
    return;
   }
   // Canvas and its foreground peer must stay direct shell children for dragging and clipping.
   if (context) context.element.hidden = true;
   canvas = document.createElement('canvas');
   canvas.className = 'sf-weather-canvas';
   canvas.setAttribute('aria-hidden', 'true');
   parent.prepend(canvas);
   try { renderer = settingsWeather(canvas, read, sample); }
   catch (error) { canvas.remove(); throw error; }
   const active = renderer;
   context?.onCleanup(() => active.dispose());
  }
  const lease = owner?.mount({id: kind + '.' + key, parent, lifetime: 'persistent', setup});
  if (lease && !lease.isCurrent()) throw Error('Window environment setup failed');
  if (!lease) setup();
  const current = () => lease ? lease.isCurrent() : !!canvas?.isConnected;
  return {
   kind, current,
   sync() {
    moving?.(!document.hidden && document.documentElement.hasAttribute('data-dgu-visualmotion'));
    if (canvas && renderer) {
     const state = read();
     for (const [name, value] of Object.entries({weather: state.kind, rain: state.rain, special: state.special ?? 'none'})) {
      if (canvas.dataset[name] !== value) canvas.dataset[name] = value;
     }
     renderer.refresh();
     if (paused) renderer.pause(false);
    }
    paused = false;
   },
   pause() {
    if (!paused) { moving?.(false); renderer?.pause(true); }
    paused = true;
   },
   snapshot: () => renderer?.snapshot(),
   dispose() { if (lease) lease.dispose(); else renderer?.dispose(); },
  };
 }
 function sync(visible: boolean) {
  const kind = choice();
  if (layer && (layer.kind !== kind || !layer.current())) retire();
  if (!visible) { layer?.pause(); return; }
  if (!layer) {
   if (kind === 'canvas' && canvasFailed) { restore(); return; }
   parent.setAttribute(attribute, '');
   try { layer = mount(kind); }
   catch (error) {
    console.warn('Window environment unavailable', kind, error);
    if (kind === 'cloud') { cloudFailed = true; sync(visible); }
    else { canvasFailed = true; restore(); }
    return;
   }
  }
  layer.sync();
 }
 return {
  sync, pause: () => layer?.pause(),
  snapshot: () => ({material: layer?.kind === 'cloud' ? 'cloud-texture' : layer ? 'glass-scatter' : 'static', state: layer?.snapshot?.()}),
  dispose() { try { retire(); } finally { restore(); } },
 };
}
