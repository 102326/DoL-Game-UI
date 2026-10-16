import {PROTOCOL, type Host} from './contracts';

/** One consumer owns its own lifecycle subscription; existing Mods need not opt in. */
export function connectConsumer(start: (host: Host) => () => void, root = window) {
 let cleanup: (() => void) | undefined, current: Host | undefined, closed = false;
 function stop() {
  const release = cleanup; cleanup = undefined; current = undefined;
  try {release?.()} catch {console.warn('[Stone Free] Consumer cleanup failed')}
 }
 function bind() {
  const host = root.DoLUiHost;
  if (closed || host === current) return;
  stop();
  if (!host || host.protocolVersion !== PROTOCOL) return;
  try {if (host.getDiagnostics().disposed) return; cleanup = start(host); current = host}
  catch {stop(); console.warn('[Stone Free] Consumer initialization unavailable')}
 }
 root.document.addEventListener('stone-free-host-ready', bind);
 root.document.addEventListener('stone-free-host-stopped', stop);
 root.document.addEventListener('DOMContentLoaded', bind);
 bind();
 return () => {if (closed) return; closed = true; stop(); root.document.removeEventListener('stone-free-host-ready', bind); root.document.removeEventListener('stone-free-host-stopped', stop); root.document.removeEventListener('DOMContentLoaded', bind)};
}
