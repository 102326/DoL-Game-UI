import {isolate, supportsDialog} from './presentation';
import type {SurfaceCloseReason, SurfaceRequest} from '../public/ui';
export type {SurfaceCloseReason, SurfaceRequest} from '../public/ui';

// Only newly supplied content belongs in these shells. Existing Mod pages stay native.
export function createSurfaces(root: Window, enabled: () => boolean, report: (event: string) => void = () => {}) {
 const doc = root.document;
 const opened = new Map<string, {kind: string; handle: Readonly<{close: () => void; isOpen: () => boolean}>; close: (reason: SurfaceCloseReason) => void}>();
 let disposed = false, sequence = 0;
 const available = () => !disposed && enabled() && supportsDialog() && typeof MutationObserver === 'function' && !!doc.body;
 function open(kind: 'modal' | 'drawer', request: SurfaceRequest) {
  if (!request || typeof request.id !== 'string' || !/^[A-Za-z][A-Za-z0-9-]{0,63}$/.test(request.id)) throw new TypeError('Invalid surface id');
  const id = request.id;
  if (!available()) {closeAll('disabled'); return null}
  let existing = opened.get(id);
  if (existing && !existing.handle.isOpen()) {existing.close('native'); existing = opened.get(id)}
  if (existing) {
   if (existing.kind !== kind) throw new TypeError('Surface id already has a different kind');
   return existing.handle; // Duplicate requests never replace the caller's live controls.
  }
  if (typeof request.title !== 'string' || !request.title.trim() || request.title.length > 160
   || !(request.content instanceof HTMLElement) || request.content.ownerDocument !== doc || request.content.parentNode
   || (request.onClose !== undefined && typeof request.onClose !== 'function')) throw new TypeError('Surface requires a title and newly detached content');
  const {content, onClose} = request;
  const restore = doc.activeElement as HTMLElement | null;
  const dialog = doc.createElement('dialog');
  dialog.className = 'dgu-surface'; dialog.dataset.dguSurface = kind;
  const heading = doc.createElement('h2'); do {heading.id = `dgu-surface-title-${++sequence}`} while (doc.getElementById(heading.id)); heading.textContent = request.title;
  dialog.setAttribute('aria-labelledby', heading.id);
  const header = doc.createElement('header'); header.className = 'dgu-surface-header';
  const button = doc.createElement('button'); button.type = 'button'; button.textContent = '关闭'; button.setAttribute('aria-label', '关闭浮层');
  const body = doc.createElement('div'); body.className = 'dgu-surface-content';
  header.append(heading, button); body.append(content); dialog.append(header, body);
  let closed = false, backdropPressed = false;
  function close(reason: SurfaceCloseReason) {
   if (closed) return;
   closed = true;
   const hadFocus = dialog.contains(doc.activeElement);
   dialog.removeEventListener('cancel', cancel); dialog.removeEventListener('close', nativeClose);
   if (dialog.open) isolate('surface close', () => dialog.close());
   content.remove(); dialog.remove(); opened.delete(id); report(`${kind}:closed:${reason}`);
   // Native dialog restores focus. Only recover if its original target still exists.
   if (hadFocus && restore?.isConnected && doc.activeElement === doc.body) isolate('surface focus', () => restore.focus({preventScroll: true}));
   if (onClose) isolate('surface onClose', () => onClose(reason));
  }
  function cancel(event: Event) {event.preventDefault(); close('escape')}
  function nativeClose() {close('native')}
  const outside = (event: MouseEvent) => {const box = dialog.getBoundingClientRect(); return event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)};
  button.addEventListener('click', () => close('button'));
  dialog.addEventListener('cancel', cancel); dialog.addEventListener('close', nativeClose);
  dialog.addEventListener('pointerdown', event => {backdropPressed = outside(event)});
  dialog.addEventListener('click', event => {const dismiss = backdropPressed && outside(event); backdropPressed = false; if (dismiss) close('backdrop')});
  const handle = Object.freeze({close: () => close('api'), isOpen: () => !closed && dialog.isConnected && dialog.open});
  opened.set(id, {kind, handle, close}); doc.body.append(dialog);
  try {dialog.showModal(); report(`${kind}:opened`); return handle} catch {close('failed'); return null}
 }
 function closeAll(reason: SurfaceCloseReason) {for (const entry of [...opened.values()].reverse()) entry.close(reason)}
 return {available, getDiagnostics: () => Object.freeze([...opened.values()].filter(entry => entry.handle.isOpen()).map(entry => Object.freeze({kind: entry.kind, source: 'Soft & Wet', owner: 'caller content / Runtime shell'}))), openModal: (request: SurfaceRequest) => open('modal', request), openDrawer: (request: SurfaceRequest) => open('drawer', request),
  refresh() {if (!available()) closeAll('disabled')}, destroy() {if (disposed) return; disposed = true; closeAll('destroyed')}};
}
