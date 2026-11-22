import {createParticleField, createPrecipitation} from '../precipitation';
import type {Host, MountContext} from '../../../framework/contracts';

type Weather = 'sunny' | 'rain' | 'snow';
const colors: Record<Weather, string> = {sunny: '#f7ca6c', rain: '#6e9dbe', snow: '#dcebf4'};

/** One Host claim owns the shared state; consumers only subscribe to it. */
export function createWeather(host: Readonly<Host>) {
 const owner = host.register('EffectsWeather');
 const claim = owner.claim('region', 'EffectsWeather');
 if (!claim) {owner.dispose(); throw new Error('Weather resource already owned')}
 let field: ReturnType<typeof createParticleField> | undefined;
 let leases = 0;
 let weather: Weather = 'sunny';
 const listeners = new Set<(weather: Weather) => void>();
 return {
  get: () => weather,
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
  set(next: Weather) {if (!claim.isCurrent()) return; weather = next; for (const listener of [...listeners]) listener(next)},
  subscribe(listener: (weather: Weather) => void) {
   if (!claim.isCurrent()) throw new Error('Weather provider has been released');
   listener(weather); listeners.add(listener); return () => {listeners.delete(listener)}},
  count: () => listeners.size,
  dispose() {listeners.clear(); field = undefined; owner.dispose()}
 };
}

export function mountEffects(host: Readonly<Host>, id: string, parent: HTMLElement, shared: ReturnType<typeof createWeather>, backend: 'canvas' | 'svg' = 'canvas') {
 const participant = host.register(id);
 const handle = participant.mount({id: 'surface', parent, lifetime: 'persistent', setup(context) {setup(context, shared, backend)}});
 return {handle, dispose: () => participant.dispose()};
}

function setup(context: MountContext, shared: ReturnType<typeof createWeather>, backend: 'canvas' | 'svg') {
 const root = context.element;
 root.className = 'effects-surface';
 root.innerHTML = `<div class="effects-content"><span class="weather-label"></span><button class="ability" type="button">Drag surface</button><p>Drag the surface, reverse direction, then release.</p></div>`;
 const lease = shared.leaseField();
 context.onCleanup(lease.release);
 const precipitation = createPrecipitation(root, backend, lease.field);
 type Weights = {rain: number; snow: number};
 let weights: Weights = {rain: 0, snow: 0}, from: Weights = {...weights}, target: Weights = {...weights}, started = performance.now();
 function sample(now: number) {
  const t = Math.min(1, Math.max(0, (now - started) / 450));
  weights = {rain: from.rain + (target.rain - from.rain) * t, snow: from.snow + (target.snow - from.snow) * t};
  return t;
 }
 const label = root.querySelector<HTMLElement>('.weather-label')!;
 const ability = root.querySelector<HTMLButtonElement>('.ability')!;
 let frame = 0, disposed = false, shift = 0, origin = 0, pointer: number | null = null;
 let transition: Animation | undefined, settling: Animation | undefined;
 const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
 let binding = context.binding();
 function watchScene() {
  const captured = binding;
  captured.signal.addEventListener('abort', () => {
   sample(performance.now()); from = {...weights}; target = {...weights};
   cancelAnimationFrame(frame); frame = 0;
   const color = getComputedStyle(root).backgroundColor;
   transition?.cancel(); transition = undefined; root.style.backgroundColor = color;
   freezePosition(); cancelPointer();
  }, {once: true});
 }
 watchScene();
 // WAAPI owns only background-color; canvas has its own requestAnimationFrame clock.
 function apply(next: Weather) {
  if (!binding.isCurrent()) return;
  const previous = getComputedStyle(root).backgroundColor;
  transition?.cancel(); label.textContent = next; root.dataset.weather = next;
  root.style.backgroundColor = colors[next];
  if (!reducedMotion.matches) transition = root.animate([{backgroundColor: previous}, {backgroundColor: colors[next]}], {duration: 450, easing: 'ease-out'});
  sample(performance.now()); from = {...weights}; target = {rain: next === 'rain' ? 1 : 0, snow: next === 'snow' ? 1 : 0}; started = performance.now();
  if (reducedMotion.matches) {cancelAnimationFrame(frame); frame = 0; weights = {...target}; from = {...weights}; precipitation.paint(0, weights)}
  else if (!frame) frame = requestAnimationFrame(draw);
 }
 const unsubscribe = shared.subscribe(apply);
 const motionChanged = () => {if (reducedMotion.matches) {settling?.cancel(); settling = undefined; showShift(0)} apply(shared.get())};
 reducedMotion.addEventListener('change', motionChanged);
 context.onScene(() => {binding = context.binding(); watchScene(); apply(shared.get())});
 function draw(time: number) {
  if (disposed || !binding.isCurrent()) {frame = 0; return}
  const done = sample(time);
  precipitation.paint(time, weights);
  if (done === 1 && target.rain === 0 && target.snow === 0) frame = 0;
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
