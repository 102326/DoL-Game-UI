import {PROTOCOL, type Host} from './contracts';

/** One consumer owns its own lifecycle subscription; existing Mods need not opt in. */
export function connectConsumer(start: (host: Host) => () => void, root = window, onStatus?: (reason:string|null)=>void) {
 let cleanup: (() => void) | undefined, current: Host | undefined, closed = false, lastReason = '';
 function status(reason:string|null){try{onStatus?.(reason)}catch{/* Diagnostics cannot invalidate a consumer. */}}
 function warn(reason: string) {if (reason !== lastReason) console.warn(`[Stone Free] Consumer unavailable: ${reason}`); lastReason = reason;status(reason)}
 function stop() {
  const release = cleanup; cleanup = undefined; current = undefined;
  try {release?.()} catch {console.warn('[Stone Free] Consumer cleanup failed')}
 }
 function bind() {
  if (closed) return;
  let host: Host | undefined;
  let failure = 'Host access failed';
  try {
   host = root.DoLUiHost;
   if (!host) {stop(); warn('Host missing'); return}
   if (host === current) return;
   stop();
   const protocol = host.protocolVersion;
   if (typeof protocol !== 'string' || !protocol) {warn('Host unrecognized'); return}
   if (protocol !== PROTOCOL) {warn('unsupported protocol'); return}
   const methods: (keyof Host)[] = ['getDiagnostics', 'getCapabilities', 'register', 'binding', 'sources', 'commands', 'onCommands', 'views', 'onViews', 'onContributions', 'invalidateScene', 'sceneReady', 'dispose'];
   for (const method of methods)
    if (typeof host[method] !== 'function') {warn(`Host method missing: ${method}`); return}
   const diagnostics = host.getDiagnostics(), capabilities = host.getCapabilities();
   if (!diagnostics || typeof diagnostics.disposed !== 'boolean' || !capabilities || typeof capabilities.views !== 'boolean' || typeof capabilities.commands !== 'boolean') {warn('Host unrecognized'); return}
   if (diagnostics.disposed) {warn('Host disposed'); return}
   failure = 'Consumer initialization failed'; cleanup = start(host); current = host; lastReason = '';status(null);
  } catch {stop(); warn(failure)}
 }
 const stopped=()=>{stop();warn('Host stopped')};
 try {
  root.document.addEventListener('stone-free-host-ready', bind);
  root.document.addEventListener('stone-free-host-stopped', stopped);
  root.document.addEventListener('DOMContentLoaded', bind);
  bind();
 } catch {stop(); warn('Host connection unavailable')}
 return () => {if (closed) return; closed = true; stop(); try {root.document.removeEventListener('stone-free-host-ready', bind); root.document.removeEventListener('stone-free-host-stopped', stopped); root.document.removeEventListener('DOMContentLoaded', bind)} catch {}}
}
