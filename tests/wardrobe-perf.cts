import fs = require('node:fs');
import path = require('node:path');
import os = require('node:os');
import http = require('node:http');
import child = require('node:child_process');
const {execFileSync}=child;
import playwright = require('playwright');
import type {Clothing,WardrobeVariables,PreviewRenderer} from '../src/wardrobe/host';
const {chromium}=playwright;
type FixtureClothing=Clothing&{colour_options?:(string|number)[];accessory_colour_options?:(string|number)[]};
declare const V:WardrobeVariables&{wardrobe:Record<string,FixtureClothing[]>&{upper:FixtureClothing[];lower:FixtureClothing[]};__perfPayload:string},setup:{clothes:Record<string,FixtureClothing[]>};
type Handler=(this:unknown,...args:unknown[])=>unknown;
declare const SugarCube:{State:{variables:{options:unknown}};Engine:{play(name:string):unknown};Wikifier:new(...args:unknown[])=>unknown;Macro:{get(name:string):{handler:Handler}|undefined}};
declare let updateMoment:Handler;
declare const Renderer:PreviewRenderer,DoLWardrobeUI:{performance?:ReturnType<typeof import('../src/wardrobe/performance')['createWardrobePerformance']>};
type Timings={wikifier:number[];updatewardrobe:number[];updateMoment:number[];compose:number[];ownClick:number[];presented:number[];previewFailures:string[];longTasks:number[];categoryClick:number[];counts:{wikifier:number;updatewardrobe:number;updateMoment:number;compose:number}};
declare const __perfStats:Timings;
declare let __perfObserver:PerformanceObserver,__wearBegan:number;
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing performance fixture value');return value;}


const here = __dirname;
const project = path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(here, '../../..'));
const archive = path.join(project, 'releases/mods/DoLGameUI-0.3.3.mod.zip');
const currentJs = path.join(here, '../dist/game-ui.js');
const currentCss = path.join(here, '../dist/game-ui.css');
const outDir = path.join(here, 'artifacts');
const fixture = path.join(project, 'releases/source-baseline-0.5.11.9/vanilla.html');
const oldBuild = fs.mkdtempSync(path.join(os.tmpdir(), 'dol-game-ui-perf-'));
const variants = process.argv.includes('--baseline-only') ? ['current', 'archived'] : ['archived', 'current'];

function percentile(values:number[], p:number) {
  if (!values.length) return null;
  const a = [...values].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.ceil((p / 100) * a.length) - 1)];
}
function extractArchived() {
  const script = `import zipfile,sys,os; z=zipfile.ZipFile(sys.argv[1]); [open(os.path.join(sys.argv[3],n),'wb').write(z.read(n)) for n in ('game-ui.js','game-ui.css')]`;
  fs.mkdirSync(path.join(oldBuild, 'assets'), { recursive: true });
  execFileSync(process.platform === 'win32' ? 'python' : 'python3', ['-c', script, archive, oldBuild, path.join(oldBuild, 'assets')], { stdio: 'inherit' });
  return { js: path.join(oldBuild, 'assets/game-ui.js'), css: path.join(oldBuild, 'assets/game-ui.css') };
}
function serverFor() {
  return http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url??'/', 'http://localhost').pathname);
    const file = pathname === '/game' ? fixture : path.join(project, 'upstream/game-0.5.11.9', pathname);
    if (!file.startsWith(project) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', file.endsWith('.png') ? 'image/png' : 'text/html; charset=utf-8');
    fs.createReadStream(file).pipe(res);
  });
}
async function runVariant(browser:playwright.Browser,port:number,name:string,assets:{js:string;css:string}) {
  const page = await browser.newPage({ viewport: { width: 1704, height: 1136 } });
  const errors:string[] = [];
  page.on('pageerror', e => errors.push(String(e.stack || e)));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(()=>{localStorage.setItem('verifiedAge','true');Object.assign(window,{must:<T,>(value:T|null|undefined)=>{if(value==null)throw Error('Missing performance fixture');return value}})});
  await page.goto(`http://127.0.0.1:${port}/game`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => (typeof SugarCube==='undefined'?undefined:SugarCube)?.State?.variables?.options, { timeout: 60000 });
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => SugarCube.Engine.play('Start2'));
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    V.location = 'home'; V.lastWardrobeSlot = 'upper'; V.wardrobe_location = 'wardrobe';
    const add = (slot:string, count:number) => { const defs = must(setup.clothes[slot]).filter(c => c.name !== 'naked' && !c.outfitPrimary && !c.outfitSecondary); for (let n = 0; n < count; n++) { const i = structuredClone(must(defs[n % defs.length])); i.colour = i.colour_options?.[0] ?? 0; i.accessory_colour = i.accessory_colour_options?.[0] ?? 0; must(V.wardrobe[slot]).push(i); } };
    add('upper', 137); add('lower', 43);
    V.__perfPayload = 'x'.repeat(5 * 1024 * 1024);
    SugarCube.Engine.play('Wardrobe');
  });
  await page.waitForLoadState('networkidle');
  await page.addStyleTag({ path: assets.css });
  await page.addScriptTag({ path: assets.js });
  await page.waitForSelector('.dgw-shell', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('.dgw-preview')?.getAttribute('aria-busy') === 'false', { timeout: 30000 });
  const fixtureSetup = await page.evaluate(() => {
    const stats:Timings = { wikifier: [], updatewardrobe: [], updateMoment: [], compose: [], ownClick: [], presented: [], previewFailures: [], longTasks: [], categoryClick: [], counts: { wikifier: 0, updatewardrobe: 0, updateMoment: 0, compose: 0 } };
    const timed = <T,>(arr:number[], key:keyof Timings['counts'], fn:()=>T):T => { const t = performance.now(); try { return fn(); } finally { arr.push(performance.now() - t); stats.counts[key]++; } };
    
    const W = SugarCube.Wikifier;
    if (W) SugarCube.Wikifier = new Proxy(W, { construct(target, args, newTarget) { return timed(stats.wikifier, 'wikifier', () => Reflect.construct(target, args, newTarget)); } });
    const macros = SugarCube.Macro?.get?.('updatewardrobe');
    if (macros?.handler) { const old = macros.handler; macros.handler = function (this:unknown,...args:unknown[]) { return timed(stats.updatewardrobe, 'updatewardrobe', () => old.apply(this, args)); }; }
    if (typeof updateMoment === 'function') { const old = updateMoment; updateMoment = function (this:unknown,...args:unknown[]) { return timed(stats.updateMoment, 'updateMoment', () => old.apply(this, args)); }; }
    if (Renderer?.composeLayers) { const old = Renderer.composeLayers; Renderer.composeLayers = function (...args:Parameters<PreviewRenderer['composeLayers']>) { const t = performance.now(); stats.counts.compose++; const cb = args[3]; if (cb) args[3] = new Proxy(cb, { get(target, prop) { if (typeof Reflect.get(target,prop) === 'function' && (prop === 'renderingDone' || prop === 'loadError' || prop === 'error')) return (...x:unknown[]) => { stats.compose.push(performance.now() - t); return Reflect.apply(Reflect.get(target,prop),target,x); }; return Reflect.get(target,prop); } }); try { return old.apply(this, args); } catch (e) { stats.compose.push(performance.now() - t); throw e; } }; }
    DoLWardrobeUI?.performance?.setEnabled(true);
    if(PerformanceObserver.supportedEntryTypes.includes('longtask')){Object.assign(window,{__perfObserver:new PerformanceObserver(list=>{for(const e of list.getEntries())stats.longTasks.push(e.duration)})});__perfObserver.observe({type:'longtask',buffered:false});}
    Object.assign(window,{__perfStats:stats});
    return { wikifierWrapped: !!W, updateMomentWrapped: typeof updateMoment === 'function', composeWrapped: !!Renderer?.composeLayers, extraBytes: V.__perfPayload.length, inventory: { upper: V.wardrobe.upper.length, lower: V.wardrobe.lower.length } };
  });
  const upper = page.locator('.dgw-slots button').filter({ hasText: '上装' }).first();
  const lower = page.locator('.dgw-slots button').filter({ hasText: '下装' }).first();
  if (!(await upper.count()) || !(await lower.count())) throw new Error('upper/lower category buttons unavailable');
  await upper.click();
  await page.waitForTimeout(100);
  const categories = page.locator('.dgw-slots button');
  for (let i = 0; i < 7; i++) { const b = i % 2 ? lower : upper; const t = await b.evaluate(el => { if(!(el instanceof HTMLElement))throw Error('Missing category control');const s = performance.now(); el.click(); return performance.now() - s; }); await page.evaluate(t => __perfStats.categoryClick.push(t), t); await page.waitForTimeout(80); }
  await page.evaluate(()=>DoLWardrobeUI?.performance?.reset());
  const items = page.locator('.dgw-item');
  for (let i = 0; i < 5; i++) {
    const n = await items.count(); if (!n) throw new Error(`wardrobe item list empty before wear attempt ${i + 1}`);
    await page.evaluate(() => { const b = document.querySelector<HTMLElement>('.dgw-item'); const s = performance.now(); Object.assign(window,{__wearBegan:s});b?.click(); __perfStats.ownClick.push(performance.now() - s); });
    // Allow queued refresh, wait for outfit completion, then cross two animation frames.
    await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
    await page.waitForFunction(()=>document.querySelector('.dgw-preview')?.getAttribute('aria-busy')==='false');
    await page.evaluate(()=>{if(!document.querySelector('.dgw-preview canvas'))__perfStats.previewFailures.push(document.querySelector('.dgw-render-status')?.textContent||'Missing preview')});
    await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>{__perfStats.presented.push(performance.now()-__wearBegan);r()}))));
  }
  const raw = await page.evaluate(({ name, setup }) => ({ variant: name, setup, rawTimings: __perfStats, phases:DoLWardrobeUI?.performance?.report()??null, errors: [...document.querySelectorAll('.error')].map(e => e.textContent?.slice(0, 180)) }), { name, setup:fixtureSetup });
  const result = { variant: raw.variant, setup: raw.setup, timings: { wikifier: summarize(raw.rawTimings.wikifier), updatewardrobe: summarize(raw.rawTimings.updatewardrobe), updateMoment: summarize(raw.rawTimings.updateMoment), compose: summarize(raw.rawTimings.compose), categoryClick: summarize(raw.rawTimings.categoryClick), ownClick: summarize(raw.rawTimings.ownClick), presented: summarize(raw.rawTimings.presented),longTasks:summarize(raw.rawTimings.longTasks) }, phases:raw.phases, rawTimings: raw.rawTimings, counts: raw.rawTimings.counts, errors: raw.errors };
  const complete={...result,pageErrors:errors,syntheticPayload:{bytes:fixtureSetup.extraBytes,explicit:true,description:'Synthetic unrelated V.__perfPayload; not representative of real save data.'}};
  await page.close(); return complete;
}
function summarize(v:number[]) { return { samples: v.length, p50: percentile(v, 50), p95: percentile(v, 95), max: v.length ? Math.max(...v) : null }; }

(async () => {
  if (!fs.existsSync(archive)) throw new Error(`Archived source ZIP missing: ${archive}`);
  if (!fs.existsSync(currentJs) || !fs.existsSync(currentCss)) throw new Error('Current dist assets missing');
  const archived = extractArchived();
  const server = serverFor(); await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const results = [];
    for (const name of variants) results.push(await runVariant(browser, (()=>{const a=server.address();if(!a||typeof a==='string')throw Error('Missing server port');return a.port})(), name, name === 'current' ? { js: currentJs, css: currentCss } : archived));
    const output = { passed: results.every(r => !r.rawTimings.previewFailures.length && !r.pageErrors.length && !r.errors.length && r.counts.updatewardrobe === 5 && r.counts.updateMoment === 5 && r.timings.categoryClick.samples === 7 && r.timings.ownClick.samples === 5), version: '0.4.0', variants: results, methodology: { cpuThrottleRate: 4, freshPagePerVariant: true, fixture: 'vanilla.html', operations: '7 alternating category switches after warmup; 5 fixed simple-item wear attempts', syntheticPayload: '5 MiB unrelated V.__perfPayload; explicitly synthetic', timingUnits: 'milliseconds', presented: 'click through completed preview and two animation frames; includes automation scheduling, not physical display latency', baseline:'0.3.3', phases:'nested timings overlap and must not be added together' }, realDevice: false, android: false, noUserdata: true };
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `wardrobe-perf-${process.argv.includes('--baseline-only') ? 'baseline' : 'comparison'}.json`), JSON.stringify(output, null, 2));
    console.log(JSON.stringify(output, null, 2));
    if (!output.passed) process.exitCode = 1;
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
