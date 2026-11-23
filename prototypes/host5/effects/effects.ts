import {createParticleField, createPrecipitation} from '../precipitation';
import type {Host, MountContext} from '../../../framework/contracts';

type Weather = 'sunny' | 'rain' | 'snow';
const palette = {sunny: [247,202,108], rain: [110,157,190], snow: [220,235,244]} as const;

const duration = 450;
const weightsFor = (weather: Weather) => ({rain: Number(weather === 'rain'), snow: Number(weather === 'snow')});
type Weights = ReturnType<typeof weightsFor>;
const frameTime = () => Number(document.timeline.currentTime ?? performance.now());
function sampleColor({rain, snow}: Weights) {
 const sunny = 1 - rain - snow;
 const channels = ([0,1,2] as const).map(i => Math.round(palette.sunny[i]*sunny + palette.rain[i]*rain + palette.snow[i]*snow));
 return 'rgb(' + channels.join(', ') + ')';
}

/** One Host claim owns the shared state; consumers only subscribe to it. */
export function createWeather(host: Readonly<Host>, referenceTime = frameTime) {
 const owner = host.register('EffectsWeather');
 const claim = owner.claim('region', 'EffectsWeather');
 if (!claim) {owner.dispose(); throw new Error('Weather resource already owned')}
 let field: ReturnType<typeof createParticleField> | undefined;
 let leases = 0;
 let weather: Weather = 'sunny';
 let start = -duration, from = weightsFor(weather), target = weightsFor(weather);
 function sample(time = referenceTime()) {
  const progress = Math.max(0, Math.min(1, (time-start)/duration));
  return {time, rain: from.rain+(target.rain-from.rain)*progress, snow: from.snow+(target.snow-from.snow)*progress, progress};
 }
 const listeners = new Set<(weather: Weather) => void>();
 const reader = Object.freeze({
  get: () => weather, sample,
  fieldUsers: () => leases,
  leaseField() {
   if (!claim.isCurrent()) throw new Error('Weather provider has been released');
   const current = field ??= createParticleField();
   leases++;
   let released = false;
   return {field: current, release() {
    if (released) return;
    released = true;
    if (--leases === 0) field = undefined;
   }};
  },
  subscribe(listener: (weather: Weather) => void) {
   if (!claim.isCurrent()) throw new Error('Weather provider has been released');
   const subscription = (next: Weather) => listener(next);
   listener(weather);
   if (claim.isCurrent()) listeners.add(subscription);
   return () => {listeners.delete(subscription)};
  },
  count: () => listeners.size
 });
 return {
  reader,
  set(next: Weather) {
   if (!claim.isCurrent()) return;
   const time = referenceTime();
   from = sample(time);
   start = time;
   target = weightsFor(next);
   weather = next;
   for (const listener of [...listeners]) {
    if (listeners.has(listener)) listener(next);
   }
  },
  dispose() {listeners.clear(); field = undefined; owner.dispose()}
 };
}

type WeatherReader = ReturnType<typeof createWeather>['reader'];
export function mountEffects(host: Readonly<Host>, id: string, parent: HTMLElement, shared: WeatherReader, backend: 'canvas' | 'svg' = 'canvas') {
 const participant = host.register(id);
 const handle = participant.mount({id: 'surface', parent, lifetime: 'persistent', setup(context) {setup(context, shared, backend)}});
 return {handle, dispose: () => participant.dispose()};
}

function setup(context: MountContext, shared: WeatherReader, backend: 'canvas' | 'svg') {
 const root = context.element;
 root.className = 'effects-surface';
 root.innerHTML = `<div class="effects-content"><span class="weather-label"></span><button class="ability" type="button">Drag surface</button><p>Drag the surface, reverse direction, then release.</p></div>`;
 const lease = shared.leaseField();
 context.onCleanup(lease.release);
 const precipitation = createPrecipitation(root, backend, lease.field);
 const label = root.querySelector<HTMLElement>('.weather-label')!;
 const ability = root.querySelector<HTMLButtonElement>('.ability')!;
 let frame = 0, disposed = false, shift = 0, origin = 0, pointer: number | null = null;
 let transition: Animation | undefined, settling: Animation | undefined;
 const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
 let binding = context.binding();
 function watchScene() {
  const captured = binding;
  captured.signal.addEventListener('abort', () => {
   cancelAnimationFrame(frame); frame = 0;
   const color = getComputedStyle(root).backgroundColor;
   transition?.cancel(); transition = undefined; root.style.backgroundColor = color;
   freezePosition(); cancelPointer();
  }, {once: true});
 }
 watchScene();
 // WAAPI owns only background-color; canvas has its own requestAnimationFrame clock.
 function apply(next: Weather, joining = false) {
  if (!binding.isCurrent()) return;
  const point = shared.sample();
  const previous = joining ? sampleColor(point) : getComputedStyle(root).backgroundColor;
  transition?.cancel(); label.textContent = next; root.dataset.weather = next;
  const endpoint = sampleColor(weightsFor(next));
  root.style.backgroundColor = endpoint;
  if (reducedMotion.matches) {
   cancelAnimationFrame(frame); frame = 0; precipitation.paint(0, weightsFor(next));
   return;
  }
  // A late mount starts at the current mix and has only the remaining interval.
  // An interrupted local animation resumes from its actual painted color.
  const remaining = duration * (1-point.progress);
  if (remaining > 0 || previous !== endpoint) {
   transition = root.animate([{backgroundColor: previous}, {backgroundColor: endpoint}], {duration:remaining || duration, easing:'linear'});
   transition.startTime = frameTime();
  }
  precipitation.paint(point.time, point);
  if (!frame) frame = requestAnimationFrame(draw);
 }
 let first = true;
 const unsubscribe = shared.subscribe(next => {apply(next, first); first = false});
 const motionChanged = () => {if (reducedMotion.matches) {settling?.cancel(); settling = undefined; showShift(0)} apply(shared.get())};
 reducedMotion.addEventListener('change', motionChanged);
 context.onScene(() => {binding = context.binding(); watchScene(); apply(shared.get())});
 function draw() {
  if (disposed || !binding.isCurrent()) {frame = 0; return}
  const point = shared.sample();
  precipitation.paint(point.time, point);
  if (point.progress === 1 && !point.rain && !point.snow) frame = 0;
  else frame = requestAnimationFrame(draw);
 }
 function showShift(value: number) {
  shift = Math.max(-100, Math.min(100, value));
  root.style.transform = `translateX(${shift}px)`; root.dataset.shift = String(Math.round(shift));
 }
 function freezePosition() {
  if (!settling) return;
  const painted = new DOMMatrixReadOnly(getComputedStyle(root).transform).m41;
  settling.cancel(); settling = undefined; showShift(painted);
 }
 function cancelPointer() {
  const active = pointer; pointer = null;
  if (active !== null && ability.hasPointerCapture(active)) ability.releasePointerCapture(active);
 }
 function settle() {
  const start = shift; showShift(0);
  if (!reducedMotion.matches && start !== 0) settling = root.animate([{transform: `translateX(${start}px)`}, {transform: 'translateX(0px)'}], {duration: 280, easing: 'ease-out'});
 }
 function down(event: PointerEvent) {
  if (!binding.isCurrent() || pointer !== null || event.button !== 0) return;
  freezePosition(); pointer = event.pointerId; origin = event.clientX - shift;
  ability.setPointerCapture(event.pointerId); ability.focus();
 }
 function move(event: PointerEvent) {if (binding.isCurrent() && event.pointerId === pointer) showShift(event.clientX - origin)}
 function end(event: PointerEvent) {
  if (!binding.isCurrent() || event.pointerId !== pointer) return;
  cancelPointer(); settle();
 }
 function lost(event: PointerEvent) {if (event.pointerId === pointer) {pointer = null; if (binding.isCurrent()) settle()}}
 ability.addEventListener('pointerdown', down); ability.addEventListener('pointermove', move); ability.addEventListener('pointerup', end); ability.addEventListener('pointercancel', end); ability.addEventListener('lostpointercapture', lost);
 if (!reducedMotion.matches) {showShift(36); settle()}
 context.onCleanup(() => {disposed = true; cancelAnimationFrame(frame); transition?.cancel(); freezePosition(); cancelPointer(); precipitation.dispose(); unsubscribe(); reducedMotion.removeEventListener('change', motionChanged); ability.removeEventListener('pointerdown', down); ability.removeEventListener('pointermove', move); ability.removeEventListener('pointerup', end); ability.removeEventListener('pointercancel', end); ability.removeEventListener('lostpointercapture', lost)});
}
