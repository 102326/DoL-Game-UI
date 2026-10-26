// Diagnostic instrumentation only: never installed in product, never used as an optimization timing.
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {chromium} from 'playwright';
import browserOptions from '../../../tests/browser-options.cjs';

type Event = {kind: string; label: string; time: number; end?: number; frame: number; stack: string[]; node?: string};
type Capture = {anchor: number; end: number; phase: string; events: Event[]};
type Trace = {traceEvents: {name: string; ph: string; ts: number; dur?: number; pid: number; tid: number}[]};
declare global {interface Window {
    __a2: {begin(label: string): number; end(token: number): void; note(label: string): void; capture(phase: string): void; stop(): Capture; dispose(): void};
    __startPanels: (root: Window) => {destroy(): void; getLifecycleCounts(): {mounts: number; scans: number; failures: number}};
    __startMotion: () => () => void;
    __panels: ReturnType<Window['__startPanels']>; __stopMotion: () => void;
    __nativeCalls: number; __openCalls: number;
}}
const root = process.cwd(), sha = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');
const targets: Record<string, string[]> = {
    'framework/official-ui/motion.ts': ['later', 'sidebar', 'syncOverlay', 'scrim'],
    'framework/official-ui/navigation.ts': ['refresh', 'group', 'mark'],
    'framework/official-ui/weather.ts': ['set', 'refresh', 'fitHeader', 'paint'],
    'src/panels/main.ts': ['refreshOverlay']
};
const files = [...Object.keys(targets), 'src/ui/visual-scope.ts', 'dist/framework/official-ui/style.css', 'docs/evolution/perf-4.1-candidates-20261026/probe-a2-opening.mts'];
const hashes = () => Object.fromEntries(files.map(file => [file, sha(readFileSync(file))]));
const before = hashes(), out = resolve('tests/artifacts/evolution/opening-a2-' + Date.now()); mkdirSync(out, {recursive: true});
const transformed: Record<string, string> = {};
function instrument(input: string, file: string) {
    const module = file.split('/').at(-1)!.replace('.ts', '');
    if (file.endsWith('/weather.ts')) input = input.replace("node.style.height='0px';parent.append(node);", "window.__a2.note('weather.append.before');node.style.height='0px';parent.append(node);window.__a2.note('weather.append.after');")
        .replace('s.node.dataset.weather=state.kind;s.node.dataset.rain=state.rain;s.node.dataset.special=state.special', "window.__a2.note('weather.paint.attributes');s.node.dataset.weather=state.kind;s.node.dataset.rain=state.rain;s.node.dataset.special=state.special");
    if (file.endsWith('/motion.ts')) {
        const focus = 'if(focus&&!active.contains(document.activeElement))focus.focus({preventScroll:true});';
        assert.ok(input.includes(focus), 'Missing focus probe boundary');
        input = input.replace(focus, "if(focus&&!active.contains(document.activeElement)){window.__a2.note('motion.focus.before');focus.focus({preventScroll:true});window.__a2.note('motion.focus.after');}");
    }
    const ast = ts.createSourceFile(file, input, ts.ScriptTarget.Latest, true), edits: {at: number; value: string}[] = [], found = new Set<string>();
    function visit(node: ts.Node) {
        if (ts.isFunctionDeclaration(node) && node.name && node.body && targets[file]!.includes(node.name.text)) {
            found.add(node.name.text);
            const extra = file.endsWith('/motion.ts') && node.name.text === 'later' ? "window.__a2.note('motion.request:'+(callback.name||'anonymous'));" : '';
            edits.push({at: node.body.getStart(ast) + 1, value: `const __a2token=window.__a2.begin('${module}.${node.name.text}');try{${extra}`}, {at: node.body.end - 1, value: '}finally{window.__a2.end(__a2token)}'});
        }
        ts.forEachChild(node, visit);
    }
    visit(ast); for (const name of targets[file]!) assert.ok(found.has(name), 'Missing probe target ' + file + ':' + name);
    for (const edit of edits.sort((a, b) => b.at - a.at)) input = input.slice(0, edit.at) + edit.value + input.slice(edit.at);
    transformed[file] = sha(input); return input;
}
const entry = 'virtual:a2-opening', resolved = '\0' + entry;
const bundle = await build({configFile: false, logLevel: 'error', plugins: [{name: 'controlled-a2-probe', enforce: 'pre', resolveId(id) {if (id === entry) return resolved;}, load(id) {if (id === resolved) return "import {startPanels} from '/src/panels/main.ts';import {startOfficialMotion} from '/framework/official-ui/motion.ts';window.__startPanels=startPanels;window.__startMotion=startOfficialMotion";}, transform(code, id) {const relative = id.split('?')[0]!.replace(root + '/', ''); if (targets[relative]) return instrument(code, relative);}}, vue()], build: {write: false, rollupOptions: {input: entry, output: {format: 'iife', inlineDynamicImports: true}}}});
assert.ok('output' in bundle); const chunk = bundle.output.find(item => item.type === 'chunk'); assert.ok(chunk?.type === 'chunk');
const code = chunk.code + '\n//# sourceURL=controlled-a2-opening.js'; writeFileSync(join(out, 'probe.js'), code);
const browser = await chromium.launch(browserOptions), stages: unknown[] = []; let status = 'FAIL', failure: string | undefined;
try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}, deviceScaleFactor: 1}), errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setContent('<!doctype html><html data-stone-free data-dol-midnight data-dgu-visualMotion data-dgu-visualGlass data-dgu-visualGlow><style>body{margin:0}.hidden{display:none!important}#customOverlay{position:fixed;inset:55px;background:#24262a;color:white}#customOverlayTitle{position:relative;padding:12px}#customOverlayContent{height:560px;overflow:auto}button{padding:12px}</style><body><aside id="ui-bar"><div id="overlayButtons"><button id="entry" class="link-internal macro-button">作弊</button></div></aside><div id="passages"><div class="passage" data-passage="Unknown"></div></div><div id="overlay-parent"><div id="customOverlay" class="hidden" data-overlay="cheats"><div id="customOverlayTitle"><div id="overlayTabs"><button class="link-internal macro-button tab-selected">状态</button><button class="link-internal macro-button">外观</button></div></div><div id="customOverlayContent"><div id="cheatsShown" class="settingsGrid"></div><button id="native">Native action</button></div></div></div></body></html>');
    await page.addStyleTag({path: 'dist/framework/official-ui/style.css'});
    await page.evaluate(() => {
        document.querySelector('#cheatsShown')!.innerHTML = Array.from({length: 20}, (_, g) => '<h2 class="settingsHeader">Group ' + g + '</h2>' + Array.from({length: 12}, (_, i) => '<div class="settingsToggleItem"><label><input type="checkbox">Setting ' + i + '<span>Value</span></label></div>').join('')).join('');
        let enabled = false, events: Event[] = [], active: {token: number; label: string}[] = [], frame = 0, serial = 0, anchor = 0, phase = '', monitor = 0;
        const cleanups: (() => void)[] = [], tick = () => {frame++; monitor = requestAnimationFrame(tick);}; monitor = requestAnimationFrame(tick);
        const push = (event: Event) => {if (events.length >= 12000) throw Error('Diagnostic event budget exceeded'); events.push(event);};
        const stack = () => active.map(value => value.label);
        const relevant = (node: unknown): node is Element => node instanceof Element && node.matches('#customOverlay,#customOverlayTitle,.dgp-host,.kw-heading-weather,.kw-context-plane,[data-kw-entry],#customOverlay button');
        function read<T>(label: string, node: Element, fn: () => T): T {
            if (!enabled || !relevant(node)) return fn();
            const time = performance.now(), frames = frame, callers = stack();
            try {return fn();} finally {push({kind: 'read', label, node: node.id || node.classList.value.split(' ')[0], time, end: performance.now(), frame: frames, stack: callers});}
        }
        const rects = Element.prototype.getClientRects, bounds = Element.prototype.getBoundingClientRect;
        Element.prototype.getClientRects = function(this: Element) {return read('getClientRects', this, () => rects.call(this));};
        Element.prototype.getBoundingClientRect = function(this: Element) {return read('getBoundingClientRect', this, () => bounds.call(this));};
        cleanups.push(() => {Element.prototype.getClientRects = rects; Element.prototype.getBoundingClientRect = bounds;});
        const computed = window.getComputedStyle; window.getComputedStyle = function(node, pseudo) {return read('getComputedStyle', node, () => computed.call(window, node, pseudo));}; cleanups.push(() => {window.getComputedStyle = computed;});
        for (const [owner, names] of [[Element.prototype, ['clientWidth', 'clientHeight', 'clientTop']], [HTMLElement.prototype, ['offsetHeight']]] as const) for (const name of names) {
            const descriptor = Object.getOwnPropertyDescriptor(owner, name); if (!descriptor?.get) throw Error('Missing native geometry getter ' + name);
            Object.defineProperty(owner, name, {...descriptor, get(this: Element) {return read(name, this, () => descriptor.get!.call(this));}}); cleanups.push(() => Object.defineProperty(owner, name, descriptor));
        }
        const focus = HTMLElement.prototype.focus; HTMLElement.prototype.focus = function(options) {return read('focus', this, () => focus.call(this, options));}; cleanups.push(() => {HTMLElement.prototype.focus = focus;});
        window.__a2 = {
            begin(label) {if (!enabled) return -1; const token = ++serial; active.push({token, label}); push({kind: 'enter', label, time: performance.now(), frame, stack: stack()}); return token;},
            end(token) {if (token < 0) return; const last = active.pop(); if (last?.token !== token) throw Error('Invalid diagnostic stack'); push({kind: 'exit', label: last.label, time: performance.now(), frame, stack: stack()});},
            note(label) {if (enabled) {performance.mark('A2.' + label); push({kind: 'boundary', label, time: performance.now(), frame, stack: stack()});}},
            capture(next) {if (active.length) throw Error('Capture during active call'); enabled = true; events = []; phase = next; anchor = performance.mark('A2.anchor.' + next).startTime;},
            stop() {if (active.length) throw Error('Unbalanced diagnostic scopes'); enabled = false; return {anchor, end: performance.mark('A2.end.' + phase).startTime, phase, events};},
            dispose() {enabled = false; cancelAnimationFrame(monitor); for (const restore of cleanups.reverse()) restore(); if (Element.prototype.getClientRects !== rects || Element.prototype.getBoundingClientRect !== bounds || window.getComputedStyle !== computed || HTMLElement.prototype.focus !== focus) throw Error('Native methods were not restored');}
        };
        Object.assign(window, {jQuery: () => ({on() {return this;}, off() {return this;}}), Weather: {name: 'clear', precipitation: 'none', dayState: 'day'}, __nativeCalls: 0, __openCalls: 0});
        document.querySelector<HTMLElement>('#entry')!.onclick = () => {window.__openCalls++; document.querySelector<HTMLElement>('#customOverlay')!.className = 'dgp-overlay';};
        document.querySelector<HTMLElement>('#native')!.onclick = () => {window.__nativeCalls++;};
    });
    await page.addScriptTag({content: code}); await page.evaluate(() => {window.__panels = window.__startPanels(window); window.__stopMotion = window.__startMotion();});
    const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable');
    for (const stage of ['native-open', 'controlled-observer-burst']) {
        await cdp.send('Tracing.start', {categories: 'devtools.timeline,blink.user_timing', transferMode: 'ReturnAsStream'});
        const beforeMetrics = await cdp.send('Performance.getMetrics');
        await page.evaluate(name => window.__a2.capture(name), stage);
        if (stage === 'native-open') await page.locator('#entry').click();
        else await page.evaluate(async () => {const node = document.querySelector<HTMLElement>('#customOverlay')!; for (let i = 0; i < 3; i++) {node.setAttribute('data-overlay', 'cheats'); await new Promise<void>(resolve => queueMicrotask(resolve));}});
        await page.evaluate(async () => {for (let i = 0; i < 12; i++) await new Promise(requestAnimationFrame);});
        const capture = await page.evaluate(() => window.__a2.stop()), afterMetrics = await cdp.send('Performance.getMetrics');
        const complete = new Promise<{stream?: string}>(resolve => cdp.once('Tracing.tracingComplete', resolve)); await cdp.send('Tracing.end'); const {stream} = await complete; assert.ok(stream);
        let raw = ''; for (;;) {const part = await cdp.send('IO.read', {handle: stream}); raw += part.base64Encoded ? Buffer.from(part.data, 'base64').toString('utf8') : part.data; assert.ok(Buffer.byteLength(raw) <= 16 * 1024 * 1024, 'Trace budget exceeded'); if (part.eof) break;} await cdp.send('IO.close', {handle: stream});
        writeFileSync(join(out, stage + '-trace.json'), raw);
        const trace = JSON.parse(raw) as Trace, origin = trace.traceEvents.find(e => e.name === 'A2.anchor.' + stage), endMarker = trace.traceEvents.find(e => e.name === 'A2.end.' + stage); assert.ok(origin && endMarker);
        assert.equal(endMarker.pid, origin.pid); assert.equal(endMarker.tid, origin.tid);
        const offset = origin.ts - capture.anchor * 1000;
        const styles = trace.traceEvents.filter(e => e.ph === 'X' && ['UpdateLayoutTree', 'RecalculateStyles', 'Layout'].includes(e.name) && e.pid === origin.pid && e.tid === origin.tid && e.ts >= origin.ts && e.ts + (e.dur ?? 0) <= endMarker.ts).map(e => {
            const time = (e.ts - offset) / 1000, end = time + (e.dur ?? 0) / 1000;
            const readers = capture.events.filter(r => r.kind === 'read' && r.time - .2 <= time && (r.end ?? r.time) + .2 >= end).map(r => ({label: r.label, node: r.node, stack: r.stack}));
            return {name: e.name, time, durationMs: (e.dur ?? 0) / 1000, readers};
        });
        assert.ok(styles.length < 1000, 'Style projection budget exceeded');
        const metric = (result: typeof beforeMetrics, key: string) => {const value = result.metrics.find(m => m.name === key)?.value; assert.equal(typeof value, 'number'); return value!;};
        const counts = Object.fromEntries([...new Set(capture.events.filter(e => e.kind === 'enter').map(e => e.label))].map(label => [label, capture.events.filter(e => e.kind === 'enter' && e.label === label).length]));
        const sameFrame = Object.entries(counts).map(([label]) => {const frames = new Map<number, number>(); for (const e of capture.events) if (e.kind === 'enter' && e.label === label) frames.set(e.frame, (frames.get(e.frame) ?? 0) + 1); return {label, maxCallsInOneFrame: Math.max(...frames.values())};});
        stages.push({stage, counts, sameFrame, capture, styles, traceSha256: sha(raw), metrics: Object.fromEntries(['RecalcStyleCount', 'RecalcStyleDuration', 'LayoutCount', 'LayoutDuration'].map(key => [key, metric(afterMetrics, key) - metric(beforeMetrics, key)]))});
        if (stage === 'native-open') await page.waitForTimeout(600);
    }
    const state = await page.evaluate(() => ({counts: window.__panels.getLifecycleCounts(), open: window.__openCalls, labels: document.querySelectorAll('.dgp-navigation option').length - 1}));
    assert.equal(state.open, 1); assert.equal(state.counts.mounts, 1); assert.equal(state.counts.failures, 0); assert.equal(state.labels, 20);
    await page.locator('#native').click(); assert.equal(await page.evaluate(() => window.__nativeCalls), 1);
    await page.evaluate(() => {window.__stopMotion(); window.__panels.destroy(); window.__a2.dispose();});
    assert.equal(await page.locator('.dgp-host,.kw-context-plane,.kw-heading-weather,.kw-native-orbit').count(), 0); assert.deepEqual(errors, []); assert.deepEqual(hashes(), before); status = 'PASS';
} catch (error) {failure = String(error); throw error;} finally {
    writeFileSync(join(out, 'result.json'), JSON.stringify({status, failure, sourceSha256: before, transformedSha256: transformed, bundleSha256: sha(code), chromium: browser.version(), platform: process.platform, node: process.version, stages, limits: 'Instrumented first-party cheats fixture, not full game/Android or performance acceptance. Boundary marks, named function probes and native read wrappers affect timing. Observer burst is deliberately synthetic, not normal user frequency. Style attribution uses timing containment with 0.2ms tolerance and can be ambiguous; no parent/child cost summation or projected savings. Raw traces stay local; projection contains controlled node labels only.'}, null, 2));
    await browser.close(); console.log(out);
}
