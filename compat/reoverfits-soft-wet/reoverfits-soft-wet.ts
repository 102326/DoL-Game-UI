import type {UiApi} from '../../src/public/ui';
import type {WardrobeApi, WardrobeSlotMappingHandle} from '../../src/public/wardrobe';

(() => {
 const host = window as Window & {
  DoLGameUI?: {ui?: Partial<UiApi>; wardrobe?: Readonly<WardrobeApi>};
  modUtils?: {getMod(name: string): {version?: string} | undefined};
  ReOverfitsSoftWet?: {destroy(): void};
 };
 if (host.ReOverfitsSoftWet) return;
 const icons: Record<string, string> = {overhead:'外层头饰', overupper:'外套上装', overlower:'外套下装'};
 const undo = new Map<Element, Map<string, {before: string | null; applied: string | null}>>();
 let owner: Readonly<WardrobeApi> | undefined, mapping: Readonly<WardrobeSlotMappingHandle> | undefined;
 let frame = 0, destroyed = false, reason = 'runtime-unavailable';
 function attribute(el: Element, name: string, value: string) {
  if (el.getAttribute(name) === value) return;
  let changes = undo.get(el); if (!changes) {changes = new Map(); undo.set(el, changes)}
  if (!changes.has(name)) changes.set(name, {before:el.getAttribute(name), applied:value});
  else changes.get(name)!.applied = value;
  el.setAttribute(name, value);
 }
 function restore() {
  for (const [el, changes] of undo) for (const [name, change] of changes) {
   if (el.getAttribute(name) !== change.applied) continue;
   if (change.before === null) el.removeAttribute(name); else el.setAttribute(name, change.before);
  }
  undo.clear();
 }
 function attach() {
  const api = host.DoLGameUI?.wardrobe;
  const supported = host.modUtils?.getMod('ReOverfits')?.version === '4.1.1';
  if (supported && owner === api && mapping) return;
  mapping?.destroy(); mapping = undefined; owner = api;
  reason = 'wardrobe-api-unavailable';
  if (!supported) {reason = 'target-version-mismatch'; return}
  if (api?.apiVersion !== 1 || typeof api.registerSlotMapping !== 'function') return;
  try {
   mapping = api.registerSlotMapping({id:'ReOverfitsSoftWet', target:{name:'ReOverfits', versions:['4.1.1']}, slots:{over_head:'外层头饰', over_upper:'外套上装', over_lower:'外套下装'}});
   reason = 'model-registered';
  } catch {reason = 'registration-failed'}
 }
 function refresh() {
  observer.disconnect(); attach();
  for (const el of undo.keys()) if (!el.isConnected) undo.delete(el);
  const ui = host.DoLGameUI?.ui;
  if (!mapping || host.modUtils?.getMod('ReOverfits')?.version !== '4.1.1' || !ui?.getCapabilities?.().enabled) restore();
  else for (const img of document.querySelectorAll<HTMLImageElement>('.passage:not(.passage-out) #clothingShop-div img')) {
   const match = /^img\/ui\/clothes\/categories\/(overhead|overupper|overlower)\.png$/.exec(img.getAttribute('ml-src') ?? img.getAttribute('src') ?? '');
   if (!match) continue;
   const tab = img.closest('.category-tab'), link = tab?.querySelector('a.link-internal');
   if (tab && link && !link.textContent?.trim()) {
    attribute(tab, 'data-reoverfits-category', icons[match[1]]);
    attribute(link, 'aria-label', icons[match[1]]); attribute(tab, 'title', icons[match[1]]);
   } else if (img.nextElementSibling?.matches('a.link-internal')) {
    attribute(img, 'data-reoverfits-entry-icon', '');
    attribute(img.nextElementSibling, 'data-reoverfits-entry', '');
   }
  }
  if (!destroyed) {
   const passages = document.getElementById('passages');
   if (passages) observer.observe(passages, {childList:true, subtree:true});
  }
 }
 function schedule() {if (!destroyed && !frame) frame = requestAnimationFrame(() => {frame = 0; refresh()})}
 const observer = new MutationObserver(schedule), themeObserver = new MutationObserver(schedule);
 themeObserver.observe(document.documentElement, {attributes:true, attributeFilter:['data-dol-midnight']});
 document.addEventListener('dol-ui-runtime-ready', schedule);
 Object.assign(host, {ReOverfitsSoftWet:Object.freeze({
  getDiagnostics:() => Object.freeze({adapterVersion:'0.2.0', target:'ReOverfits', targetVersion:'4.1.1', level:'UI Model Extension', reason}),
  destroy() {destroyed = true; cancelAnimationFrame(frame); observer.disconnect(); themeObserver.disconnect(); document.removeEventListener('dol-ui-runtime-ready', schedule); mapping?.destroy(); mapping = undefined; owner = undefined; restore(); delete host.ReOverfitsSoftWet}
 })});
 refresh();
})();
