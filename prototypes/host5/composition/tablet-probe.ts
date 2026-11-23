import './scene';

// This observer runs only in the neutral fixture. It never reads the input's value.
const label = document.createElement('label');
label.textContent = '键盘观测 ';
const input = document.createElement('input');
input.id = 'probe-input';
input.autocomplete = 'off';
label.append(input);
document.querySelector('main')!.prepend(label);

const docId = performance.timeOrigin;
const ids = new WeakMap<Animation, number>();
let nextId = 0;
const sky = () => document.querySelector('.drift')!.getAnimations()[0];
const panel = () => document.querySelector('.signal')!.getAnimations()[0];
let initialSky: Animation | undefined, initialPanel: Animation | undefined;
function track(animation?: Animation) {
  if (!animation) return null;
  if (!ids.has(animation)) ids.set(animation, ++nextId);
  return {id: ids.get(animation), ms: animation.currentTime, state: animation.playState, rate: animation.playbackRate};
}
function record(event: string) {
  const vv = window.visualViewport;
  const panelElement = document.querySelector<HTMLElement>('.panel')!;
  const active = document.activeElement;
  const rect = panelElement.getBoundingClientRect();
  console.info('SW41 ' + JSON.stringify({
    doc: docId, event, at: performance.now(), visibility: document.visibilityState,
    focused: document.hasFocus(), active: active === input ? input.id : active?.tagName ?? null,
    window: [innerWidth, innerHeight], client: [document.documentElement.clientWidth, document.documentElement.clientHeight],
    visual: vv ? [vv.width, vv.height, vv.offsetLeft, vv.offsetTop, vv.scale] : null,
    panelSize: [rect.width, rect.height], panelOpen: !panelElement.hidden,
    sky: track(sky()), panel: track(panel()), initial: [track(initialSky), track(initialPanel)],
    signalTransform: getComputedStyle(document.querySelector('.signal')!).transform
  }));
}
function observe(name: string) {
  record(name);
  // rAF is pre-paint. Don't label a deferred callback from a hidden document as its first frame.
  if (!document.hidden) requestAnimationFrame(() => record('raf:' + name));
}
input.addEventListener('pointerdown', () => {
  document.querySelector<HTMLButtonElement>('#toggle')!.click();
  initialSky = sky();
  initialPanel = panel();
  // Keep the 150 ms decorative feedback observable during manual IME input.
  // Visibility restoration still runs the scene's unmodified lifecycle.
  if (initialPanel) initialPanel.playbackRate = .001;
  if (initialSky) initialSky.playbackRate = .1;
  observe('arm');
}, {once: true});
for (const name of ['focus', 'blur']) {
  input.addEventListener(name, () => observe('input.' + name));
  window.addEventListener(name, () => observe('window.' + name));
}
window.addEventListener('resize', () => observe('window.resize'));
window.visualViewport?.addEventListener('resize', () => observe('visualViewport.resize'));
document.addEventListener('visibilitychange', () => observe('visibility.' + document.visibilityState));
window.addEventListener('pageshow', event => observe('pageshow.' + event.persisted));
window.addEventListener('pagehide', event => record('pagehide.' + event.persisted));
observe('boot');
