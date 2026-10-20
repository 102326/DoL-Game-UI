import {PROTOCOL, type Host, type Binding, type Cleanup, type Contribution, type MountContext,
 type MountRequest, type MountHandle, type Participant, type ResourceKind, type Source, type Json, type View, type ViewContribution, type CommandContribution, type Command} from './contracts';
import {combineSignals} from './signals';

const validId = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_.-]{0,79}$/.test(value);
function requireId(value: unknown) {if (!validId(value)) throw new TypeError('Invalid participant/resource id')}

/** Copies only bounded JSON projections; never publishes mutable native objects. */
function snapshot(value: Json): Json {
 let remaining = 2000, characters = 32000;
 function copy(item: Json, depth: number): Json {
  if (--remaining < 0 || depth > 12) throw new TypeError('Projection too large');
  if (item === null || typeof item === 'boolean') return item;
  if (typeof item === 'string' && item.length <= 16000 && (characters -= item.length) >= 0) return item;
  if (typeof item === 'number' && Number.isFinite(item)) return item;
  if (Array.isArray(item)) return Object.freeze(item.map(x => copy(x, depth + 1))) as Json;
  if (typeof item !== 'object' || Object.getPrototypeOf(item) !== Object.prototype) throw new TypeError('Invalid projection');
  const out: {[key: string]: Json} = {};
  for (const [key, child] of Object.entries(item)) {
   if (key.length > 128 || (characters -= key.length) < 0 || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new TypeError('Unsafe projection key');
   out[key] = copy(child, depth + 1);
  }
  return Object.freeze(out);
 }
 return copy(value, 0);
}

/** No Vue, theme, State, storage, global input handlers or third-party DOM rewrites. */
export function createHost(root: Window & Pick<typeof globalThis, 'MutationObserver' | 'HTMLElement'>): Readonly<Host> {
 if (typeof AbortController !== 'function') throw new Error('AbortController is required by this experimental Host');
 const doc = root.document;
 let disposed = false, scenePending = false, generation = 0, scene = new AbortController();
 const participants = new Map<string, {dispose: Cleanup}>();
 const mounts = new Set<{owner: string; id: string; lifetime: MountRequest['lifetime']; element: HTMLElement; dispose: Cleanup}>();
 const claims = new Map<string, {owner: string; kind: ResourceKind; key: string}>();
 const providers = new Map<string, {owner: string; contribution: Contribution}>();
 const commands = new Map<string, {owner: string; spec: CommandContribution; busy: boolean}>();
 const views = new Map<string, {owner: string; spec: ViewContribution; mount: View['mount']}>();
 const changes = new Set<Cleanup>(), commandChanges = new Set<Cleanup>(), viewChanges = new Set<Cleanup>(), sceneListeners = new Set<Cleanup>();
 const bindings = new WeakSet<Binding>();
 const errors: {owner: string; stage: string}[] = [];
 function report(owner: string, stage: string) {errors.push(Object.freeze({owner, stage})); if (errors.length > 24) errors.shift()}
 function safely(owner: string, stage: string, fn: Cleanup) {
  try {
   const result = fn() as unknown;
   if (result && typeof (result as Promise<unknown>).then === 'function') void Promise.resolve(result).catch(() => report(owner, stage));
  } catch {report(owner, stage)}
 }
 function notify(listeners: Set<Cleanup>) {for (const fn of [...listeners]) if (listeners.has(fn)) safely('Host', 'notification', fn)}
 function binding(): Binding {
  const current = scene, epoch = generation, readyAtCapture = !scenePending;
  const value = Object.freeze({signal: current.signal, generation: epoch, isCurrent: () => readyAtCapture && !disposed && !scenePending && current === scene && !current.signal.aborted});
  bindings.add(value); return value;
 }
 // Watch only ancestor child lists for owned mounts. No whole-document subtree scan.
 const observer = new root.MutationObserver(() => {
  for (const entry of [...mounts]) if (!entry.element.isConnected) entry.dispose();
  watch();
 });
 function watch() {
  observer.disconnect();
  const parents = new Set<Node>();
  for (const entry of mounts) for (let parent = entry.element.parentNode; parent; parent = parent.parentNode) parents.add(parent);
  for (const parent of parents) observer.observe(parent, {childList: true});
 }
 function assertLive() {if (disposed) throw new Error('Host disposed')}
 function register(id: string): Readonly<Participant> {
  assertLive(); requireId(id);
  if (participants.has(id)) throw new Error('Participant already registered');
  let released = false;
  const owned = new Set<Cleanup>(), ids = new Set<string>();
  const alive = () => !released && !disposed;
  const check = () => {if (!alive()) throw new Error('Participant disposed')};
  function dispose() {
   if (released) return;
   released = true;
   for (const release of [...owned].reverse()) safely(id, 'participant-cleanup', release);
   owned.clear(); participants.delete(id);
  }
  participants.set(id, {dispose});
  const participant: Participant = {id, dispose,
   mount(request: MountRequest) {
    check(); requireId(request?.id);
    if (ids.has(request.id)) throw new Error('Mount already registered');
    if (!(request.parent instanceof root.HTMLElement) || request.parent.ownerDocument !== doc || !request.parent.isConnected
     || !['passage', 'persistent'].includes(request.lifetime) || typeof request.setup !== 'function') throw new TypeError('Invalid mount');
    const element = doc.createElement('div'); element.dataset.sfOwner = id; element.dataset.sfMount = request.id;
    const controller = new AbortController(), cleanup: Cleanup[] = [];
    let closed = false, mergedScene:AbortSignal|undefined, mergedSignal:AbortSignal|undefined;
    let stopMerged:Cleanup=()=>{};
    const isCurrent = () => alive() && !closed && element.isConnected;
    function onCleanup(fn: Cleanup) {
     if (typeof fn !== 'function') throw new TypeError('Cleanup must be a function');
     if (closed) safely(id, 'late-cleanup', fn); else cleanup.push(fn);
    }
    function release() {
     if (closed) return;
     closed = true; controller.abort(); stopMerged();
     for (const fn of cleanup.splice(0).reverse()) safely(id, 'mount-cleanup', fn);
     element.remove(); mounts.delete(entry); owned.delete(release); ids.delete(request.id); watch();
    }
    function mountBinding(): Binding {
     const current = binding();
     if(mergedScene!==current.signal){stopMerged();const merged=combineSignals([controller.signal,current.signal]);mergedScene=current.signal;mergedSignal=merged.signal;stopMerged=merged.dispose}
     const value = Object.freeze({...current, signal: mergedSignal!, isCurrent: () => isCurrent() && current.isCurrent()});
     bindings.add(value); return value;
    }
    const context: MountContext = Object.freeze({element, signal: controller.signal, isCurrent, binding: mountBinding,
     fail() {report(id, 'consumer'); release()},
     onCleanup,
     onScene(callback: Cleanup) {
      if (typeof callback !== 'function') throw new TypeError('Scene callback must be a function');
      if (closed) return () => {};
      const listener = () => {if (isCurrent()) safely(id, 'scene', callback)};
      sceneListeners.add(listener);
      const stop = () => sceneListeners.delete(listener);
      onCleanup(stop); return stop;
     }});
    const entry = {owner: id, id: request.id, lifetime: request.lifetime, element, dispose: release};
    ids.add(request.id); owned.add(release); mounts.add(entry); request.parent.append(element); watch();
    // Set up synchronously so cleanup is installed before returning to the caller.
    let result: ReturnType<MountRequest['setup']> = undefined;
    try {result = request.setup(context)} catch {report(id, 'setup'); release()}
    const ready = Promise.resolve(result).then(fn => {if (typeof fn === 'function') onCleanup(fn)}, () => {report(id, 'async-setup'); release()});
    return Object.freeze({dispose: release, isCurrent, ready});
   },
   claim(kind: ResourceKind, key: string) {
    check(); requireId(key);
    if (!['region', 'shortcut', 'modal'].includes(kind)) throw new TypeError('Invalid resource kind');
    const identity = `${kind}:${key}`;
    if (claims.has(identity)) return null;
    const entry = Object.freeze({owner: id, kind, key}); claims.set(identity, entry);
    const release = () => {if (claims.get(identity) === entry) claims.delete(identity); owned.delete(release)};
    owned.add(release);
    return Object.freeze({release, isCurrent: () => alive() && claims.get(identity) === entry});
   },
   provide(spec: Contribution) {
    check(); requireId(spec?.id); requireId(spec?.schema);
    if (typeof spec.read !== 'function') throw new TypeError('Contribution needs a reader');
    const key = `${id}:${spec.id}`;
    if (providers.has(key)) throw new Error('Contribution already registered');
    const entry = {owner: id, contribution: Object.freeze({...spec})}; providers.set(key, entry);
    const release = () => {if (providers.get(key) !== entry) return; providers.delete(key); owned.delete(release); notify(changes)};
    owned.add(release); notify(changes); return release;
   },
   provideCommand(spec: CommandContribution) {
    check(); requireId(spec?.id); requireId(spec?.schema);
    if (typeof spec.title !== 'string' || !spec.title.trim() || spec.title.length > 100 || typeof spec.run !== 'function') throw new TypeError('Command requires a title and handler');
    const key = `${id}:${spec.id}`;
    if (commands.has(key)) throw new Error('Command already registered');
    const entry = {owner: id, spec: Object.freeze({...spec}), busy: false}; commands.set(key, entry);
    const release = () => {if (commands.get(key) !== entry) return; commands.delete(key); owned.delete(release); notify(commandChanges)};
    owned.add(release); notify(commandChanges); return release;
   },
   provideView(spec: ViewContribution) {
    check(); requireId(spec?.id);
    if (typeof spec.title !== 'string' || !spec.title.trim() || spec.title.length > 100 || typeof spec.setup !== 'function') throw new TypeError('View requires a title and setup');
    const key = `${id}:${spec.id}`;
    if (views.has(key)) throw new Error('View already registered');
    const instances = new Set<Readonly<MountHandle>>();
    const definition = Object.freeze({id: spec.id, title: spec.title, setup: spec.setup});
    const entry = {owner: id, spec: definition, mount(request: Omit<MountRequest, 'setup'>) {
     if (views.get(key) !== entry || !alive()) return null;
     let handle: Readonly<MountHandle> | undefined;
     handle = participant.mount({...request, setup(context) {
      context.onCleanup(() => {if (handle) instances.delete(handle)});
      return definition.setup(context);
     }});
     // Setup is caller code and can withdraw this view synchronously.
     if (views.get(key) !== entry || !handle.isCurrent()) {handle.dispose(); return null}
     instances.add(handle); return handle;
    }};
    views.set(key, entry);
    const release = () => {
     if (views.get(key) !== entry) return;
     views.delete(key); owned.delete(release);
     for (const instance of [...instances]) instance.dispose();
     instances.clear(); notify(viewChanges);
    };
    owned.add(release); notify(viewChanges); return release;
   }
  };
  return Object.freeze(participant);
 }
 const api: Host = {
  protocolVersion: PROTOCOL, register, binding,
  getCapabilities: () => Object.freeze({views: !disposed, commands: !disposed}),
  commands(schema: string) {
   requireId(schema);
   return Object.freeze([...commands.entries()].filter(([, entry]) => entry.spec.schema === schema).map(([key, entry]): Command => Object.freeze({
    owner: entry.owner, id: entry.spec.id, schema, title: entry.spec.title,
    async invoke(current: Binding) {
     if (commands.get(key) !== entry || disposed) return Object.freeze({status: 'missing'});
     if (!bindings.has(current) || !current.isCurrent() || current.signal.aborted) return Object.freeze({status: 'stale'});
     if (entry.busy) return Object.freeze({status: 'busy'});
     entry.busy = true;
     try {
      const value = await entry.spec.run(current);
      // After dispatch, expiry is uncertainty, not proof that nothing happened.
      if (commands.get(key) !== entry || disposed || !current.isCurrent() || current.signal.aborted) return Object.freeze({status: 'unknown'});
      return Object.freeze({status: 'returned', value: snapshot(value), generation: current.generation});
     } catch {report(entry.owner, 'command-result'); return Object.freeze({status: 'unknown'})}
     finally {entry.busy = false}
    }
   })));
  },
  onCommands(callback: Cleanup) {assertLive(); if (typeof callback !== 'function') throw new TypeError('Callback required'); commandChanges.add(callback); return () => {commandChanges.delete(callback)}},
  views: () => Object.freeze([...views.values()].map(entry => Object.freeze({owner: entry.owner, id: entry.spec.id, title: entry.spec.title, mount: entry.mount}))),
  onViews(callback: Cleanup) {assertLive(); if (typeof callback !== 'function') throw new TypeError('Callback required'); viewChanges.add(callback); return () => {viewChanges.delete(callback)}},
  sources(schema: string) {
   requireId(schema);
   return Object.freeze([...providers.entries()].filter(([, entry]) => entry.contribution.schema === schema).map(([key, entry]): Source => Object.freeze({
    owner: entry.owner, id: entry.contribution.id, schema,
    async read(current: Binding) {
     if (providers.get(key) !== entry || disposed) return Object.freeze({ok: false, reason: 'missing'});
     if (!bindings.has(current) || !current.isCurrent() || current.signal.aborted) return Object.freeze({ok: false, reason: 'stale'});
     let value: Json;
     try {value = await entry.contribution.read(current)} catch {report(entry.owner, 'projection-read'); return Object.freeze({ok: false, reason: 'failed'})}
     if (!current.isCurrent() || current.signal.aborted) return Object.freeze({ok: false, reason: 'stale'});
     if (providers.get(key) !== entry || disposed) return Object.freeze({ok: false, reason: 'missing'});
     try {return Object.freeze({ok: true, value: snapshot(value), sampledAt: Date.now(), generation: current.generation})}
     catch {report(entry.owner, 'projection-value'); return Object.freeze({ok: false, reason: 'invalid-value'})}
    }
   })));
  },
  onContributions(callback: Cleanup) {assertLive(); if (typeof callback !== 'function') throw new TypeError('Callback required'); changes.add(callback); return () => {changes.delete(callback)}},
  invalidateScene() {
   if (disposed) return;
   scene.abort(); scenePending = true; generation++; scene = new AbortController();
   for (const entry of [...mounts]) if (entry.lifetime === 'passage') entry.dispose();
  },
  sceneReady() {
   if (disposed) return;
   scenePending = false;
   for (const entry of [...mounts]) if (!entry.element.isConnected) entry.dispose();
   notify(sceneListeners);
  },
  getDiagnostics: () => Object.freeze({generation, disposed,
   participants: Object.freeze([...participants.keys()]),
   mounts: Object.freeze([...mounts].map(({owner, id, lifetime}) => Object.freeze({owner, id, lifetime}))),
   claims: Object.freeze([...claims.values()]),
   sources: Object.freeze([...providers.values()].map(({owner, contribution}) => Object.freeze({owner, id: contribution.id, schema: contribution.schema}))),
   commands: Object.freeze([...commands.values()].map(({owner, spec}) => Object.freeze({owner, id: spec.id, schema: spec.schema}))),
   views: Object.freeze([...views.values()].map(({owner, spec}) => Object.freeze({owner, id: spec.id}))),
   errors: Object.freeze([...errors])}),
  dispose() {
   if (disposed) return;
   disposed = true; scene.abort();
   for (const owner of [...participants.values()].reverse()) owner.dispose();
   observer.disconnect(); changes.clear(); commandChanges.clear(); viewChanges.clear(); sceneListeners.clear();
  }
 };
 return Object.freeze(api);
}
