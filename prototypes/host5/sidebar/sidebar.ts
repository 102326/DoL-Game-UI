import type {Host, Participant, MountHandle} from '../../../framework/contracts';

/** Optional presentation layer. Native sidebar contents remain owned by the game and Mods. */
export function createSidebar(host: Readonly<Host>, id: string, doc: Document) {
 let participant: Readonly<Participant> | undefined, mount: Readonly<MountHandle> | undefined;
 let enabled = false, disposed = false;
 function disable() {
  enabled = false;
  participant?.dispose(); participant = undefined; mount = undefined;
 }
 function setEnabled(value: boolean): boolean {
  if (disposed || host.getDiagnostics().disposed) return false;
  if (!value) {disable(); return false}
  if (enabled) return !!mount?.isCurrent();
  const bars = doc.querySelectorAll<HTMLElement>('#ui-bar');
  const bar = bars.length === 1 ? bars[0] : undefined;
  if (!bar || bar.querySelectorAll('#ui-bar-body').length !== 1 || bar.querySelectorAll('#ui-bar-toggle').length !== 1 || bar.hasAttribute('data-host5-sidebar')) return false;
  let owner: Readonly<Participant>;
  try {owner = host.register(id)} catch {return false}
  const claim = owner.claim('region', 'Host5Sidebar');
  if (!claim) {owner.dispose(); return false}
  const ownedClaim = claim;
  participant = owner; enabled = true;
  try {
   mount = owner.mount({id:'sidebar', parent:doc.body, lifetime:'persistent', setup(context) {
    const token = id;
    const style = doc.createElement('style');
    style.textContent = `
      #ui-bar[data-host5-sidebar="${token}"]:not(.stowed) { box-sizing:border-box; border-inline-end:1px solid #88958f66; }
      #ui-bar[data-host5-sidebar="${token}"] #ui-bar-body { box-sizing:border-box; padding-inline:12px; }
      #ui-bar[data-host5-sidebar="${token}"] #overlayButtons { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; }
      #ui-bar[data-host5-sidebar="${token}"] #overlayButtons > * { min-width:0; grid-column:1 / -1; }
      #ui-bar[data-host5-sidebar="${token}"] #overlayButtons > button.link-internal.macro-button { grid-column:auto; }
    `;
    let current: HTMLElement | undefined;
    function release() {
     if (current?.getAttribute('data-host5-sidebar') === token) current.removeAttribute('data-host5-sidebar');
     current = undefined; style.remove();
    }
    function refresh() {
     if (!context.isCurrent() || !ownedClaim.isCurrent()) return;
     const list = doc.querySelectorAll<HTMLElement>('#ui-bar');
     const next = list.length === 1 ? list[0] : undefined;
     const supported = next && next.querySelectorAll('#ui-bar-body').length === 1 && next.querySelectorAll('#ui-bar-toggle').length === 1;
     if (!supported || (next !== current && next.hasAttribute('data-host5-sidebar')) || (next === current && next.getAttribute('data-host5-sidebar') !== token)) {release(); return}
     if (next !== current) {release(); current = next; current.setAttribute('data-host5-sidebar', token)}
     if (!style.isConnected) doc.head.append(style);
    }
    // The bar is a direct child of body; caption redraw is owned by SugarCube.
    const observer = new MutationObserver(refresh);
    observer.observe(doc.body, {childList:true});
    context.onScene(refresh);
    context.onCleanup(() => {observer.disconnect(); release(); ownedClaim.release()});
    refresh();
   }});
  } catch (error) {disable(); throw error}
  if (!mount.isCurrent()) {disable(); return false}
  return true;
 }
 return Object.freeze({setEnabled, dispose() {if (disposed) return; disable(); disposed = true}});
}
