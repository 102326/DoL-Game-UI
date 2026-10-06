import {createSurfaces} from './surfaces';
import {openInspector} from './inspector';
import {UI_ROLES as roles} from '../public/ui';
import {matchesTargetVersion, type VersionToolsHost} from './target-version';
import type {UiRole as Role, SelectorCandidates as Candidates, StyleAdapter, UiApi, UiCapabilities, VisualTier,
 AdapterStatus, AdapterMatch, AdapterDiagnostics, SelectorMapping, CompatibilityEvent, RuntimeDiagnostics} from '../public/ui';

// Only the external fields this module reads; game variables and Mod business state stay private.
type Runtime = Window & Pick<typeof globalThis, 'CSS' | 'MutationObserver'> & {
 modUtils?: VersionToolsHost & {getMod?: (name: string) => {version?: unknown} | null | undefined; version?: unknown};
 DoLGameUI?: {version?: unknown};
 StartConfig?: {version?: unknown};
 SugarCube?: {State?: {passage?: unknown}};
};
interface DiagnosticState {
 status: AdapterStatus; reason: string; match: AdapterMatch; targetVersion: string; targetDetected: boolean;
 mapped: string[]; skipped: string[]; selectors: {selector: string; fallback: boolean}[]; mappings: SelectorMapping[];
}
const tokenNames = Object.freeze({neutral: '--dgu-surface', card: '--dgu-card', ocean: '--dgu-accent', mist: '--dgu-secondary', text: '--dgu-text', danger: '--dgu-danger', radius: '--dgu-radius', cardRadius: '--dgu-card-radius'});

// Style-only contracts. No native values, events, parents or business state are owned here.
export function createUiRuntime(root: Runtime, preferences: () => {visualTier?: number}) {
 const doc = root.document;
 let destroyed = false, frame = 0;
 const entries = new Map<string, ReturnType<typeof createEntry>>();
 const events: CompatibilityEvent[] = [];
 function record(source: string, message: string, level = 'info') {events.push(Object.freeze({time: new Date().toISOString(), level, source, message})); if (events.length > 32) events.shift()}
 const surfaces = createSurfaces(root, () => !destroyed && doc.documentElement.hasAttribute('data-dol-midnight'), event => record('Surface', event));
 const supports = (property: string, value?: string) => {try {return value === undefined ? !!root.CSS?.supports?.(property) : !!root.CSS?.supports?.(property, value)} catch {return false}};
 const media = (query: string) => {try {return !!root.matchMedia?.(query).matches} catch {return false}};
 const prefs = () => {try {return preferences()} catch {return {}}};
 const getVisualTier = (): VisualTier => {const tier = prefs().visualTier; return (['Smooth', 'Balanced', 'Fancy'] as const)[[0, 1, 2].includes(tier!) ? tier! : 0]};
 function getCapabilities(): UiCapabilities {
  const html = doc.documentElement;
  const enabled = !destroyed && html.hasAttribute('data-dol-midnight');
  const backdropFilter = supports('backdrop-filter', 'blur(1px)') || supports('-webkit-backdrop-filter', 'blur(1px)');
  const reducedMotion = media('(prefers-reduced-motion: reduce)');
  return Object.freeze({enabled, visualTier: getVisualTier(), backdropFilter, reducedMotion,
   glass: enabled && backdropFilter && html.hasAttribute('data-dgu-visualGlass'),
   motion: enabled && !reducedMotion && html.hasAttribute('data-dgu-visualMotion'),
   layout: root.innerWidth <= 600 ? 'mobile' : root.innerWidth <= 899 ? 'tablet' : 'desktop',
   hasSelector: supports('selector(:has(*))'),
   styleAdapters: !destroyed && typeof root.MutationObserver === 'function', surfaces: surfaces.available(), surfaceApiVersion: 1, inspector: surfaces.available()});
 }
 function find(scope: ParentNode, candidates: Candidates, all = false) {
  for (const [index, selector] of candidates.entries()) {
   const nodes = scope instanceof Element && selector === ':scope' ? [scope] : [...scope.querySelectorAll(selector)];
   if (nodes.length > 1 && !all) return {nodes: [] as Element[], selector, fallback: index > 0, reason: 'ambiguous-selector'};
   if (nodes.length) return {nodes, selector, fallback: index > 0, reason: ''};
  }
  return {nodes: [] as Element[], selector: '', fallback: false, reason: 'missing-selector'};
 }
 function validate(input: StyleAdapter): StyleAdapter {
  if (!input || !/^[A-Za-z][A-Za-z0-9-]{0,63}$/.test(input.id) || entries.has(input.id)) throw new TypeError('Invalid or duplicate style adapter id');
  const candidates = (value: unknown): Candidates => {
   if (!Array.isArray(value) || !value.length || value.length > 8 || value.some(s => typeof s !== 'string' || !s.trim() || s.length > 256)) throw new TypeError('Invalid adapter selectors');
   for (const selector of value) doc.createElement('div').querySelector(selector);
   return [...value];
  };
  const groups = (value: unknown) => {
   if (!Array.isArray(value) || !value.length || value.length > 16) throw new TypeError('Missing adapter fingerprint');
   return value.map(candidates);
  };
  if (typeof input.version !== 'string' || input.version.length > 64 || typeof input.target?.name !== 'string' || !input.target.name || input.target.name.length > 64
   || !Array.isArray(input.target.versions) || !input.target.versions.length || input.target.versions.length > 16 || input.target.versions.some(v => typeof v !== 'string' || !v || v.length > 64)
   || typeof input.fingerprint?.id !== 'string' || !input.fingerprint.id || input.fingerprint.id.length > 64
   || !Array.isArray(input.roles) || input.roles.length > 32 || (input.when !== undefined && typeof input.when !== 'function')) throw new TypeError('Invalid style adapter contract');
  if (input.attributes !== undefined && (!Array.isArray(input.attributes) || input.attributes.length > 8 || input.attributes.some(name => typeof name !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(name) || name.startsWith('data-dgu-')))) throw new TypeError('Invalid adapter observed attributes');
  return {id: input.id, version: input.version, target: {name: input.target.name, versions: [...input.target.versions]}, scope: candidates(input.scope), attributes: [...input.attributes ?? []],
   fingerprint: {id: input.fingerprint.id, required: groups(input.fingerprint.required), safe: groups(input.fingerprint.safe)},
   roles: input.roles.map(rule => {
    if (!roles.includes(rule.role) || (rule.all !== undefined && typeof rule.all !== 'boolean') || (rule.safe !== undefined && typeof rule.safe !== 'boolean')) throw new TypeError('Invalid adapter role');
    return {role: rule.role, selectors: candidates(rule.selectors), all: rule.all, safe: rule.safe};
   }), when: input.when};
 }
 function createEntry(spec: StyleAdapter) {
  let scope: Element | null = null, body: HTMLElement | null = null, parent: Element | null = null, disposed = false;
  const owned = new Map<Element, Map<string, {before: string | null; value: string}>>();
  let signature = '';
  let diagnostic: DiagnosticState = {status: 'idle', reason: 'page-not-present', match: 'none', targetVersion: '', targetDetected: false, mapped: [] as string[], skipped: [] as string[], selectors: [] as {selector: string; fallback: boolean}[], mappings: [] as SelectorMapping[]};
  const observer = new root.MutationObserver(schedule);
  const discovery = new root.MutationObserver(schedule);
  function releaseMarks(keep = new Map<Element, Map<string, string>>()) {
   for (const [node, attributes] of owned) for (const [name, original] of attributes) {
    if (keep.get(node)?.has(name) && node.getAttribute(name) === original.value) continue;
    // A third party's newer edit takes precedence over our saved value.
    if (node.getAttribute(name) === original.value) {
     if (original.before === null) node.removeAttribute(name); else node.setAttribute(name, original.before);
    }
    attributes.delete(name);
   }
   for (const [node, attributes] of owned) if (!attributes.size) owned.delete(node);
  }
  function mark(node: Element, name: string, value: string) {
   let attributes = owned.get(node);
   if (!attributes) {attributes = new Map(); owned.set(node, attributes)}
   if (!attributes.has(name)) attributes.set(name, {before: node.getAttribute(name), value});
   attributes.get(name)!.value = value;
   if (node.getAttribute(name) !== value) node.setAttribute(name, value);
  }
  function watch(next: Element | null) {
   const nextParent = next?.parentElement ?? null;
   if (scope === next && body === doc.body && parent === nextParent) return;
   observer.disconnect(); discovery.disconnect(); scope = next; body = doc.body; parent = nextParent;
   if (body) discovery.observe(body, {childList: true});
   if (parent && parent !== body) discovery.observe(parent, {childList: true});
   if (next) observer.observe(next, {childList: true, subtree: true, attributes: true, attributeFilter: [...new Set(['class', 'hidden', 'data-overlay', 'id', ...spec.attributes ?? []])]});
  }
  function refresh() {
   if (disposed || destroyed) return;
   diagnostic = {status: 'idle', reason: 'page-not-present', match: 'none', targetVersion: '', targetDetected: false, mapped: [], skipped: [], selectors: [], mappings: []};
   try {
    const mod = root.modUtils?.getMod?.(spec.target.name);
    diagnostic.targetDetected = !!mod;
    diagnostic.targetVersion = typeof mod?.version === 'string' ? mod.version.slice(0, 64) : '';
    const trace = (role: string, candidates: Candidates, all = false, blocked = '') => {
     const hit = blocked ? {nodes: [] as Element[], selector: '', fallback: false, reason: blocked} : find(role === 'scope' ? doc : scope!, candidates, all);
     diagnostic.mappings.push({role, primary: candidates[0], matched: hit.selector, fallback: hit.fallback, count: hit.nodes.length, reason: hit.reason, tags: [...new Set(hit.nodes.map(node => node.tagName.toLowerCase()))]});
     return hit;
    };
    const located = trace('scope', spec.scope);
    const next = located.nodes[0] ?? null;
    watch(next);
    if (!next) {diagnostic.reason = located.reason; releaseMarks(); return}
    diagnostic.selectors.push({selector: located.selector, fallback: located.fallback});
    if (!getCapabilities().enabled || spec.when?.() === false || next.closest('[hidden],.hidden')) {diagnostic.status = 'inactive'; diagnostic.reason = 'ui-or-page-disabled'; releaseMarks(); return}
    if (!mod) {diagnostic.reason = 'target-not-detected'; releaseMarks(); return}
    const safe = spec.fingerprint.safe.map(group => trace('fingerprint:safe', group));
    if (safe.some(hit => !hit.nodes.length)) {diagnostic.status = 'unknown'; diagnostic.reason = 'safe-fingerprint-mismatch'; releaseMarks(); return}
    const required = spec.fingerprint.required.map(group => trace('fingerprint:required', group));
    const supported = matchesTargetVersion(diagnostic.targetVersion, spec.target.versions, root.modUtils);
    const full = supported && required.every(hit => hit.nodes.length);
    diagnostic.match = full ? 'full' : 'partial';
    diagnostic.status = full ? 'active' : 'partial';
    diagnostic.reason = full ? 'matched' : supported ? 'structure-drift' : 'version-unverified';
    diagnostic.selectors.push(...[...safe, ...required].filter(hit => hit.nodes.length).map(hit => ({selector: hit.selector, fallback: hit.fallback})));
    const mapped = new Map<Element, Set<Role>>();
    for (const rule of spec.roles) {
     if (!full && !rule.safe) {trace(rule.role, rule.selectors, rule.all, 'requires-full-match'); diagnostic.skipped.push(`${rule.role}:requires-full-match`); continue}
     const hit = trace(rule.role, rule.selectors, rule.all);
     if (!hit.nodes.length) {diagnostic.skipped.push(`${rule.role}:${hit.reason}`); continue}
     diagnostic.selectors.push({selector: hit.selector, fallback: hit.fallback});
     for (const node of hit.nodes) {
      if (node.closest('[hidden],.hidden')) continue;
      let set = mapped.get(node); if (!set) {set = new Set(); mapped.set(node, set)} set.add(rule.role);
     }
    }
    // A different adapter owns this surface; do not overwrite its contract.
    if (next.hasAttribute('data-dgu-adapter') && next.getAttribute('data-dgu-adapter') !== spec.id) {diagnostic.status = 'unknown'; diagnostic.reason = 'surface-already-owned'; releaseMarks(); return}
    const planned = new Map<Element, Map<string, string>>();
    planned.set(next, new Map([['data-dgu-adapter', spec.id], ['data-dgu-adapter-match', diagnostic.match]]));
    for (const [node, set] of mapped) {
     if (node.hasAttribute('data-dgu-role') && node.getAttribute('data-dgu-role') !== owned.get(node)?.get('data-dgu-role')?.value) {diagnostic.skipped.push('role:already-owned'); continue}
     const attributes = planned.get(node) ?? new Map(); planned.set(node, attributes); attributes.set('data-dgu-role', [...set].join(' '));
     for (const role of set) if (!diagnostic.mapped.includes(role)) diagnostic.mapped.push(role);
    }
    // Stable native updates must not repeatedly remove/reapply our attributes.
    releaseMarks(planned);
    for (const [node, attributes] of planned) for (const [name, value] of attributes) mark(node, name, value);
   } catch {
    releaseMarks(); diagnostic.status = 'failed'; diagnostic.reason = 'adapter-error'; diagnostic.match = 'none'; diagnostic.mapped = [];
   } finally {
    const nextSignature = JSON.stringify([diagnostic.status, diagnostic.reason, diagnostic.targetVersion, diagnostic.skipped, diagnostic.mappings.map(hit => [hit.role,hit.matched,hit.fallback,hit.count,hit.reason])]);
    if (nextSignature !== signature) {signature = nextSignature; record(spec.id, `${diagnostic.status}: ${diagnostic.reason}`, ['unknown','partial','failed'].includes(diagnostic.status) || diagnostic.skipped.length || diagnostic.mappings.some(hit => hit.fallback) ? 'warn' : 'info')}
   }
  }
  const snapshot = (): AdapterDiagnostics => Object.freeze({id: spec.id, adapterVersion: spec.version, target: spec.target.name, fingerprint: spec.fingerprint.id, level: diagnostic.mapped.length ? 'Style Only' : 'Disabled', ...diagnostic,
   supportedVersions: Object.freeze([...spec.target.versions]), degraded: ['unknown','partial','failed'].includes(diagnostic.status),
   mapped: Object.freeze([...diagnostic.mapped]), skipped: Object.freeze([...diagnostic.skipped]), selectors: Object.freeze(diagnostic.selectors.map(hit => Object.freeze({...hit}))),
   mappings: Object.freeze(diagnostic.mappings.map(hit => Object.freeze({...hit, tags: Object.freeze([...hit.tags])})))});
  function destroy() {if (disposed) return; disposed = true; observer.disconnect(); discovery.disconnect(); releaseMarks(); scope = null; diagnostic.status = 'disposed'; diagnostic.reason = 'adapter-detached'; diagnostic.match = 'none'; diagnostic.mapped = []; entries.delete(spec.id)}
  // Discovery is shallow; only this explicitly selected surface is observed recursively.
  if (doc.body) discovery.observe(doc.body, {childList: true});
  return {refresh, destroy, getDiagnostics: snapshot};
 }
 function schedule() {
  if (destroyed || frame) return;
  frame = root.requestAnimationFrame(() => {frame = 0; surfaces.refresh(); for (const entry of entries.values()) entry.refresh()});
 }
 function registerStyleAdapter(input: StyleAdapter) {
  if (destroyed) throw new Error('UI runtime disposed');
  if (typeof root.MutationObserver !== 'function') throw new Error('Style adapter observation unavailable');
  const spec = validate(input), entry = createEntry(spec);
  entries.set(spec.id, entry); entry.refresh();
  return Object.freeze({refresh: entry.refresh, destroy: entry.destroy, getDiagnostics: entry.getDiagnostics});
 }
 const preferencesObserver = typeof root.MutationObserver === 'function' ? new root.MutationObserver(schedule) : null;
 preferencesObserver?.observe(doc.documentElement, {attributes: true, attributeFilter: ['data-dol-midnight', 'data-dgu-visual', 'data-dgu-visualGlass', 'data-dgu-visualMotion']});
 doc.addEventListener('DOMContentLoaded', schedule);
 doc.addEventListener('dol-ui-saves-change', schedule);
 const api: Readonly<UiApi> = Object.freeze({apiVersion: 1, getTheme: () => Object.freeze({id: 'soft-wet', enabled: getCapabilities().enabled, tokens: tokenNames}), getVisualTier, getCapabilities, registerStyleAdapter,
  openModal: surfaces.openModal, openDrawer: surfaces.openDrawer,
  getDiagnostics, rescan,
  openInspector: () => openInspector(root, surfaces.openModal, getDiagnostics, rescan),
  getAdapterDiagnostics: () => Object.freeze([...entries.values()].map(entry => entry.getDiagnostics()))});
 function rescan() {if (!destroyed) {surfaces.refresh(); for (const entry of entries.values()) entry.refresh()} return getDiagnostics()}
 function getDiagnostics(): RuntimeDiagnostics {
  // Only structural metadata enters this export. Never traverse State.variables, inputs or node text.
  const readVersion = (read: () => unknown) => {try {const value = read(); return typeof value === 'string' && /^[0-9A-Za-z._()+-]{1,64}$/.test(value) ? value : 'unknown'} catch {return 'unknown'}};
  const selector = (value: string) => value.replace(/\[([^\]=~|^$*\s]+)[^\]]*\]/g, '[$1]'); // attribute values may contain private input
  const adapters = [...entries.values()].map(entry => {const d = entry.getDiagnostics(); return Object.freeze({...d,
   selectors: Object.freeze(d.selectors.map(hit => Object.freeze({...hit, selector: selector(hit.selector)}))),
   mappings: Object.freeze(d.mappings.map(hit => Object.freeze({...hit, primary: selector(hit.primary), matched: selector(hit.matched)})))});});
  const overlay = doc.getElementById('customOverlay');
  const visibleOverlay = overlay && !overlay.closest('[hidden],.hidden') && root.getComputedStyle(overlay).display !== 'none';
  const overlayAdapter = visibleOverlay ? overlay.getAttribute('data-dgu-adapter') : null;
  const activeSurfaces: Readonly<{kind: string; source: string; owner: string}>[] = [...surfaces.getDiagnostics()];
  if (visibleOverlay) activeSurfaces.push(Object.freeze({kind: 'native-overlay', source: overlayAdapter ? 'Adapter' : 'Native / Third-party', owner: overlayAdapter || 'original controls'}));
  let pageName = 'unrecognized';
  try {const passage = root.SugarCube?.State?.passage; if (typeof passage === 'string' && /^[\p{L}\p{N} _().-]{1,100}$/u.test(passage)) pageName = passage} catch {/* optional native metadata */}
  return Object.freeze({schemaVersion: 1, uiVersion: readVersion(() => root.DoLGameUI?.version), runtimeVersion: '1',
   gameVersion: readVersion(() => root.StartConfig?.version ?? root.modUtils?.getMod?.('GameVersion')?.version), loaderVersion: readVersion(() => typeof root.modUtils?.version === 'function' ? root.modUtils.version() : root.modUtils?.version),
   capabilities: getCapabilities(), viewport: Object.freeze({width: root.innerWidth, height: root.innerHeight}),
   platform: /Android/i.test(root.navigator.userAgent) ? 'Android' : /iPhone|iPad/i.test(root.navigator.userAgent) ? 'iOS' : 'Desktop / Other',
   page: Object.freeze({name: pageName, root: doc.getElementById('passages') ? '#passages' : 'unrecognized', source: 'Native', adapter: overlayAdapter || null}),
   surfaces: Object.freeze(activeSurfaces), adapters: Object.freeze(adapters), events: Object.freeze([...events])});
 }
 return {api, destroy() {if (destroyed) return; destroyed = true; surfaces.destroy(); if (frame) root.cancelAnimationFrame(frame); preferencesObserver?.disconnect(); doc.removeEventListener('DOMContentLoaded', schedule); doc.removeEventListener('dol-ui-saves-change', schedule); for (const entry of [...entries.values()]) entry.destroy()}};
}
