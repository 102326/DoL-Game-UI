import {createHost} from './host';
import {PROTOCOL} from './contracts';

type NativeWindow = Window & Pick<typeof globalThis, 'MutationObserver' | 'HTMLElement'> & {jQuery?: (doc: Document) => {on(events: string, callback: () => void): void; off(namespace: string): void}};

export function installHost(root: NativeWindow = window) {
 // Unknown implementations are never replaced or disposed by this package.
 try {if ('DoLUiHost' in root || typeof root.MutationObserver !== 'function' || typeof AbortSignal.any !== 'function') return null}
 catch {return null}
 const core = createHost(root), doc = root.document;
 let bridge: ReturnType<NonNullable<NativeWindow['jQuery']>> | undefined, closed = false;
 function bind() {
  if (closed || bridge || typeof root.jQuery !== 'function') return;
  bridge = root.jQuery(doc);
  bridge.on(':passageinit.stoneFreeHost :onloadsave.stoneFreeHost', host.invalidateScene);
  bridge.on(':passageend.stoneFreeHost :storyready.stoneFreeHost', host.sceneReady);
 }
 function dispose() {
  if (closed) return; closed = true;
  bridge?.off('.stoneFreeHost'); doc.removeEventListener('DOMContentLoaded', bind); root.removeEventListener('load', bind);
  core.dispose(); try {if (root.DoLUiHost === host) delete root.DoLUiHost} catch {}
  doc.dispatchEvent(new Event('stone-free-host-stopped'));
 }
 const host = Object.freeze({...core, dispose});
 try {root.DoLUiHost = host} catch {core.dispose(); return null}
 try {bind(); doc.addEventListener('DOMContentLoaded', bind); root.addEventListener('load', bind)}
 catch {try {dispose()} catch {} return null}
 doc.dispatchEvent(new CustomEvent('stone-free-host-ready', {detail: {protocolVersion: PROTOCOL}}));
 return Object.freeze({host, dispose});
}

const installation = installHost();
export const dispose = () => installation?.dispose();
