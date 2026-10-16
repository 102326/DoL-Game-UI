import type {Host, Json} from '../contracts';

type NativeWindow = Window & {SugarCube?: {UIBar?: {isStowed(): boolean}}};
/** Only the known original sidebar button executes. No State or gameplay writes. */
export function provideNativeReading(host: Host, root: NativeWindow, ownerId = 'NativeReading') {
 const owner = host.register(ownerId), doc = root.document;
 try {
 const bar = doc.getElementById('ui-bar'), button = doc.getElementById('ui-bar-toggle'), api = root.SugarCube?.UIBar;
 function read(): {available: boolean; stowed: boolean | null; reason: string} {
  if (!bar || !button || button.tagName !== 'BUTTON' || !bar.contains(button) || !bar.isConnected || !button.isConnected
   || doc.querySelectorAll('#ui-bar').length !== 1 || doc.querySelectorAll('#ui-bar-toggle').length !== 1
   || doc.getElementById('ui-bar') !== bar || doc.getElementById('ui-bar-toggle') !== button || !api
   || root.SugarCube?.UIBar !== api || typeof api.isStowed !== 'function') return {available: false, stowed: null, reason: 'unsupported-structure'};
  let stowed: boolean;
  try {stowed = api.isStowed()} catch {return {available: false, stowed: null, reason: 'native-unavailable'}}
  if (typeof stowed !== 'boolean' || stowed !== bar.classList.contains('stowed')) return {available: false, stowed: null, reason: 'inconsistent-native-state'};
  const modal = [...doc.querySelectorAll('dialog[open]')].some(node => {try {return node.matches(':modal')} catch {return true}});
  if (modal || doc.querySelector('body.ui-open,#ui-overlay.open') || button.closest('[hidden],[inert],[aria-hidden="true"]')
   || button.hasAttribute('disabled') || button.getAttribute('aria-disabled') === 'true'
   || root.getComputedStyle(button).visibility !== 'visible' || button.getClientRects().length === 0) return {available: false, stowed, reason: 'native-control-unavailable'};
  const rect = button.getBoundingClientRect(), hit = doc.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
  if (!hit || !button.contains(hit)) return {available: false, stowed, reason: 'native-control-obscured'};
  return {available: true, stowed, reason: ''};
 }
 owner.provide({id: 'sidebar', schema: 'dol.reading.experimental', read: () => read()});
 if (host.getCapabilities?.().commands) owner.provideCommand({id: 'toggle-sidebar', schema: 'dol.reading.experimental', title: '切换原版侧栏', run(binding): Json {
  const before = read();
  if (!binding.isCurrent() || !before.available) return {applied: false, reason: before.reason || 'stale'};
  button!.click();
  const after = read();
  return {applied: after.stowed === !before.stowed, before: before.stowed, after: after.stowed, reason: after.reason};
 }});
 return owner;
 } catch (error) {owner.dispose(); throw error}
}
