import './scene';

// The APK supplies the mode with the document; the offline desktop smoke uses its URL.
const mode = document.documentElement.dataset.material ?? new URLSearchParams(location.search).get('material');
if (mode !== 'live' && mode !== 'static') throw Error('Choose live or static at fixture startup');
const toggle = document.querySelector<HTMLButtonElement>('#toggle')!;
const panel = document.querySelector<HTMLElement>('.panel')!;
const scrim = panel.querySelector<HTMLElement>('[aria-hidden="true"]')!;
const sky = document.querySelector<HTMLElement>('.drift')!;
const signal = panel.querySelector<HTMLElement>('.signal')!;
if (mode === 'static') {
  scrim.style.setProperty('backdrop-filter', 'none');
  scrim.style.setProperty('-webkit-backdrop-filter', 'none');
}
function emit(event: string, data: object) {
  console.info('SW41 ' + JSON.stringify({event, mode, ...data}));
}
const style = getComputedStyle(scrim);
emit('ready', {filter: style.backdropFilter, tint: style.backgroundColor, viewport: [innerWidth, innerHeight]});

let pending = false;
let sequence = 0;
toggle.addEventListener('click', event => {
  if (pending) {emit('invalid', {reason: 'overlapping operations'}); return}
  pending = true;
  const index = ++sequence;
  const open = toggle.getAttribute('aria-expanded') === 'true';
  const drift = sky.getAnimations()[0];
  const feedback = signal.getAnimations()[0];
  const panelRect = panel.getBoundingClientRect();
  const filter = style.backdropFilter;
  const tint = style.backgroundColor;
  const viewport = [innerWidth, innerHeight];
  const start = performance.now();
  let interrupted = false;
  const interrupt = () => {interrupted = true};
  document.addEventListener('visibilitychange', interrupt);
  window.addEventListener('resize', interrupt);
  const stamps: number[] = [];
  let firstCallbackMs = 0;
  function frame(stamp: number) {
    if (!stamps.length) firstCallbackMs = performance.now() - event.timeStamp;
    stamps.push(stamp);
    if (stamp < start + 400) {requestAnimationFrame(frame); return}
    window.removeEventListener('resize', interrupt);
    document.removeEventListener('visibilitychange', interrupt);
    pending = false;
    const valid = event.isTrusted && !interrupted && !document.hidden && document.hasFocus()
      && drift?.playbackRate === 1 && feedback?.playbackRate === (open ? 1 : -1)
      && filter === (mode === 'live' ? 'blur(8px)' : 'none') && tint === 'rgba(24, 32, 43, 0.5)'
      && panelRect.width > 0 && panel.hidden === !open && stamps.length >= 2;
    emit(valid ? 'action' : 'invalid', {
      index, open, filter, tint, viewport, size: [panelRect.width, panelRect.height],
      rates: [drift?.playbackRate, feedback?.playbackRate], interrupted, focused: document.hasFocus(),
      trusted: event.isTrusted, hiddenAtEnd: panel.hidden, firstCallbackMs,
      intervalsMs: stamps.slice(1).map((time, i) => +(time - stamps[i]!).toFixed(3))
    });
  }
  requestAnimationFrame(frame);
});
