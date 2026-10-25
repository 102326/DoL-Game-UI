import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import playwright = require('playwright');
import type {Clothing,WardrobeVariables} from '../src/wardrobe/host';
const {chromium}=playwright;
type FixtureClothing=Clothing&{colour_options?:(string|number)[];accessory_colour_options?:(string|number)[]};
declare const V:WardrobeVariables&{wardrobe:{upper:FixtureClothing[]};worn:{upper:FixtureClothing}},setup:{clothes:{upper:FixtureClothing[]}};
type Handler=(this:unknown,...args:unknown[])=>unknown;
declare const SugarCube:{State:{passage:string;variables:{options:unknown}};Engine:{play(name:string):unknown};Wikifier:new(...args:unknown[])=>unknown;Macro:{get(name:string):{handler:Handler}|undefined}};
declare const DoLWardrobeUI:ReturnType<typeof import('../src/wardrobe/main')['startWardrobe']>;
declare let updateMoment:Handler;
declare const hiddenListTest:{list:HTMLElement;before:string;listCalls:number;originalListHandler?:Handler;momentCalls:number;originalUpdateMoment:Handler;experimentBefore?:string};
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing hidden-list fixture value');return value;}


const here = __dirname;
const project = path.resolve(process.env.DOL_TEST_WORKSPACE || path.resolve(here, '../../..'));
const fixture = path.join(project, 'releases/source-baseline-0.5.11.9/vanilla.html');
const dist = path.join(project, 'frontend/game-ui/dist');
const outputPath = path.join(here, 'artifacts/wardrobe-hidden-list.json');

function serverFor() {
  return http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url??'/', 'http://localhost').pathname);
    const file = pathname === '/game' ? fixture : path.join(project, 'upstream/game-0.5.11.9', pathname);
    if (!file.startsWith(project) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404);
      return res.end();
    }
    res.setHeader('Content-Type', file.endsWith('.png') ? 'image/png' : 'text/html; charset=utf-8');
    fs.createReadStream(file).pipe(res);
  });
}

async function nextFrame(page:playwright.Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
}

(async () => {
  assert.ok(fs.existsSync(fixture), `Fixture missing: ${fixture}`);
  assert.ok(fs.existsSync(path.join(dist, 'game-ui.js')), 'game-ui dist is missing; build first');
  const server = serverFor();
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1704, height: 1136 } });
  const pageErrors:string[] = [];
  page.on('pageerror', error => pageErrors.push(String(error.stack || error)));
  try {
    await page.addInitScript(()=>{localStorage.setItem('verifiedAge','true');Object.assign(window,{must:<T,>(value:T|null|undefined)=>{if(value==null)throw Error('Missing hidden-list fixture value');return value}})});
    await page.goto(`http://127.0.0.1:${(()=>{const a=server.address();assert.ok(a&&typeof a!=='string');return a.port})()}/game`, { waitUntil: 'load', timeout: 90000 });
    await page.waitForFunction(() => (typeof SugarCube==='undefined'?undefined:SugarCube)?.State?.variables?.options, { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => SugarCube.Engine.play('Start2'));
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      V.location = 'home';
      V.lastWardrobeSlot = 'upper';
      V.wardrobe_location = 'wardrobe';
      const defs = setup.clothes.upper.filter(c => c.name !== 'naked' && !c.outfitPrimary && !c.outfitSecondary);
      for (const def of defs.slice(0, 3)) {
        const item = structuredClone(def);
        item.colour = item.colour_options?.[0] ?? 0;
        item.accessory_colour = item.accessory_colour_options?.[0] ?? 0;
        V.wardrobe.upper.push(item);
      }
      SugarCube.Engine.play('Wardrobe');
    });
    await page.waitForLoadState('networkidle');
    await page.addStyleTag({ path: path.join(dist, 'game-ui.css') });
    await page.addScriptTag({ path: path.join(dist, 'game-ui.js') });
    await page.waitForSelector('.dgw-shell', { timeout: 30000 });
    await page.waitForSelector('#wardrobeList', { state: 'attached', timeout: 30000 });
    await page.waitForFunction(() => document.querySelector('.dgw-preview')?.getAttribute('aria-busy') === 'false', { timeout: 30000 });

    const fixtureSetup = await page.evaluate(() => {
      const macro = SugarCube.Macro?.get?.('wardrobeList');
      Object.assign(window,{hiddenListTest:{
        list:must(document.querySelector<HTMLElement>('#wardrobeList')),
        before: document.querySelector('#wardrobeList')?.innerHTML ?? '',
        listCalls: 0,
        originalListHandler: macro?.handler,
        momentCalls: 0,
        originalUpdateMoment:updateMoment}});
      if (macro?.handler) {
        macro.handler = function (this:unknown,...args:unknown[]) {
          hiddenListTest.listCalls++;
          return must(hiddenListTest.originalListHandler).apply(this, args);
        };
      }
      if (typeof updateMoment === 'function') {
        updateMoment = function (this:unknown,...args:unknown[]) {
          hiddenListTest.momentCalls++;
          return hiddenListTest.originalUpdateMoment.apply(this, args);
        };
      }
      DoLWardrobeUI.setNativeHiddenList(false);
      return {
        passage: SugarCube.State.passage,
        inventory: V.wardrobe.upper.length,
        listBytes: hiddenListTest.before.length,
      };
    });

    // Control: with the experiment disabled, native list generation is allowed.
    const control = await page.evaluate(() => {
      const beforeCalls = hiddenListTest.listCalls;
      const beforeMoments = hiddenListTest.momentCalls;
      const beforeWorn = V.worn.upper?.variable ?? null;
      const item = document.querySelector<HTMLElement>('.dgw-item:nth-child(1)');
      item?.click();
      return { beforeCalls, beforeMoments, beforeWorn };
    });
    await page.waitForFunction(before => (V.worn.upper?.variable ?? null) !== before.beforeWorn, control, { timeout: 30000 });
    await nextFrame(page);
    const controlResult = await page.evaluate(() => ({
      worn: V.worn.upper?.variable ?? null,
      listCalls: hiddenListTest.listCalls,
      momentCalls: hiddenListTest.momentCalls,
      listConnected: hiddenListTest.list?.isConnected === true,
    }));
    assert.notEqual(controlResult.worn, control.beforeWorn, 'control wear must reach the original game rule');
    assert.ok(controlResult.listCalls > control.beforeCalls, 'control wear should rebuild the native list');
    assert.ok(controlResult.momentCalls > control.beforeMoments, 'control wear must update game history');

    // Experiment: the original wear macro still runs, while its hidden list is
    // kept in place and is not rebuilt during the operation.
    const experiment = await page.evaluate(() => {
      DoLWardrobeUI.setNativeHiddenList(true);
      const list = document.querySelector('#wardrobeList');
      const before = list?.innerHTML ?? '';
      const beforeCalls = hiddenListTest.listCalls;
      const beforeMoments = hiddenListTest.momentCalls;
      const beforeWorn = V.worn.upper?.variable ?? null;
      hiddenListTest.experimentBefore = before;
      document.querySelector<HTMLElement>('.dgw-item:nth-child(2)')?.click();
      return { beforeCalls, beforeMoments, beforeWorn };
    });
    await page.waitForFunction(before => (V.worn.upper?.variable ?? null) !== before.beforeWorn, experiment, { timeout: 30000 });
    await nextFrame(page);
    const experimentResult = await page.evaluate(() => {
      const list = document.querySelector('#wardrobeList');
      return {
        worn: V.worn.upper?.variable ?? null,
        listCalls: hiddenListTest.listCalls,
        momentCalls: hiddenListTest.momentCalls,
        sameNode: list === hiddenListTest.list,
        listConnected: !!list?.isConnected,
        idRestored: list?.id === 'wardrobeList',
        sameMarkup: list?.innerHTML === hiddenListTest.experimentBefore,
        inventory: V.wardrobe.upper.length,
      };
    });
    assert.notEqual(experimentResult.worn, experiment.beforeWorn, 'experiment wear must preserve original wear behavior');
    assert.equal(experimentResult.listCalls, experiment.beforeCalls, 'experiment wear must defer native list generation');
    assert.ok(experimentResult.momentCalls > experiment.beforeMoments, 'experiment wear must update game history');
    assert.equal(experimentResult.sameNode, true, 'experiment must preserve the native list node');
    assert.equal(experimentResult.listConnected, true, 'native list must remain connected');
    assert.equal(experimentResult.idRestored, true, 'native list id must be restored after the operation');
    assert.equal(experimentResult.sameMarkup, true, 'experiment must not mutate the hidden native list');
    assert.equal(experimentResult.inventory, fixtureSetup.inventory, 'experiment wear must not change inventory');

    // Strip uses the same hidden-list guard as wear. It must still reach the
    // native rule, update history, and restore the id afterwards.
    const strip = await page.evaluate(() => {
      const beforeCalls = hiddenListTest.listCalls;
      const beforeMoments = hiddenListTest.momentCalls;
      const beforeWorn = V.worn.upper?.variable ?? null;
      document.querySelector<HTMLElement>('.dgw-strip')?.click();
      return { beforeCalls, beforeMoments, beforeWorn };
    });
    await page.waitForFunction(() => V.worn.upper?.name === 'naked', { timeout: 30000 });
    await nextFrame(page);
    const stripResult = await page.evaluate(() => ({
      worn: V.worn.upper?.variable ?? null,
      wornName: V.worn.upper?.name ?? null,
      listCalls: hiddenListTest.listCalls,
      momentCalls: hiddenListTest.momentCalls,
      idRestored: document.querySelector('#wardrobeList') === hiddenListTest.list,
    }));
    assert.equal(stripResult.wornName, 'naked', 'experiment strip must reach the native wardrobe rule');
    assert.equal(stripResult.listCalls, strip.beforeCalls, 'experiment strip must defer native list generation');
    assert.ok(stripResult.momentCalls > strip.beforeMoments, 'experiment strip must update game history');
    assert.equal(stripResult.idRestored, true, 'native list id must be restored after strip');

    // Both towel paths must reach the native rule and preserve the hidden list.
    const towelPaths = [];
    for (const label of ['裹上毛巾', '裹上大浴巾']) {
      const button = page.getByRole('button', { name: label, exact: true });
      assert.equal(await button.count(), 1, `${label} button must exist in the fixture`);
      const before = await page.evaluate(() => ({
        upper: V.worn.upper?.variable ?? null,
        lower: V.worn.lower?.variable ?? null,
        listCalls: hiddenListTest.listCalls,
      }));
      await button.click();
      await nextFrame(page);
      const after = await page.evaluate(() => ({
        upper: V.worn.upper?.variable ?? null,
        lower: V.worn.lower?.variable ?? null,
        listCalls: hiddenListTest.listCalls,
        idRestored: document.querySelector('#wardrobeList') === hiddenListTest.list,
      }));
      assert.notDeepEqual([after.upper, after.lower], [before.upper, before.lower], `${label} must change worn clothing`);
      assert.equal(after.listCalls, before.listCalls, `${label} must defer native list generation`);
      assert.equal(after.idRestored, true, `${label} must restore the native list id`);
      towelPaths.push({ label, before, after });
    }

    // Force the native action to throw. The wrapper's finally block must still
    // restore the id; this is the regression path most likely to strand the
    // original list in an invisible state.
    const thrown = await page.evaluate(() => {
      const original = SugarCube.Wikifier;
      try {
        SugarCube.Wikifier = class { constructor(){throw new Error('hidden-list-test')} };
        document.querySelector<HTMLElement>('.dgw-strip')?.click();
      } finally {
        SugarCube.Wikifier = original;
      }
      return {
        idRestored: document.querySelector('#wardrobeList') === hiddenListTest.list,
        message: document.querySelector('.dgw-message')?.textContent ?? '',
      };
    });
    await nextFrame(page);
    const thrownAfter = await page.evaluate(() => ({
      message: document.querySelector('.dgw-message')?.textContent ?? '',
      idRestored: document.querySelector('#wardrobeList') === hiddenListTest.list,
    }));
    assert.equal(thrown.idRestored, true, 'thrown native action must restore the native list id');
    assert.equal(thrownAfter.idRestored, true, 'thrown native action must keep the native list id after refresh');
    assert.match(thrownAfter.message, /脱下操作未完成|原版处理接口不可用/, 'thrown native action must surface recovery feedback');

    // Malformed DOM must take the safe original-operation path instead of
    // attempting to hide an ambiguous list. Verify both zero and duplicate
    // #wardrobeList cases with actual native wear operations.
    const malformed:{zero?:{worn:string|null;listId:string;listCount:number};duplicate?:{worn:string|null;listCount:number}}={};
    const zero = await page.evaluate(() => {
      const list = hiddenListTest.list;
      list.id = 'wardrobeList-missing';
      const beforeWorn = V.worn.upper?.variable ?? null;
      document.querySelector<HTMLElement>('.dgw-item:nth-child(1)')?.click();
      return { beforeWorn, id: list.id };
    });
    await page.waitForFunction(before => (V.worn.upper?.variable ?? null) !== before.beforeWorn, zero, { timeout: 30000 });
    malformed.zero = await page.evaluate(() => ({
      worn: V.worn.upper?.variable ?? null,
      listId: hiddenListTest.list.id,
      listCount: document.querySelectorAll('#wardrobeList').length,
    }));
    assert.notEqual(malformed.zero.worn, zero.beforeWorn, 'zero-list fallback must preserve native wear behavior');
    assert.equal(malformed.zero.listId, 'wardrobeList-missing', 'zero-list fallback must not invent a list id');
    assert.equal(malformed.zero.listCount, 0, 'zero-list fallback must observe the malformed DOM');
    await page.evaluate(() => { hiddenListTest.list.id = 'wardrobeList'; });

    const duplicate = await page.evaluate(() => {
      const list = hiddenListTest.list;
      const copy = list.cloneNode(false);if(!(copy instanceof HTMLElement))throw Error('Missing copied native list');
      copy.id = 'wardrobeList';
      must(list.parentNode).appendChild(copy);
      const beforeWorn = V.worn.upper?.variable ?? null;
      document.querySelector<HTMLElement>('.dgw-item:nth-child(2)')?.click();
      return { beforeWorn };
    });
    await page.waitForFunction(before => (V.worn.upper?.variable ?? null) !== before.beforeWorn, duplicate, { timeout: 30000 });
    malformed.duplicate = await page.evaluate(() => {
      const count = document.querySelectorAll('#wardrobeList').length;
      const copies = [...document.querySelectorAll('#wardrobeList')];
      const duplicate = copies.find(node => node !== hiddenListTest.list);
      duplicate?.remove();
      return { worn: V.worn.upper?.variable ?? null, listCount: count };
    });
    assert.notEqual(malformed.duplicate.worn, duplicate.beforeWorn, 'duplicate-list fallback must preserve native wear behavior');
    assert.equal(malformed.duplicate.listCount, 2, 'duplicate-list fallback must observe both native list nodes');

    // Disabling the experiment flushes the pending native list before the UI
    // remains available for normal use.
    const beforeFlush = experimentResult.listCalls;
    await page.evaluate(() => DoLWardrobeUI.setNativeHiddenList(false));
    await nextFrame(page);
    const flushResult = await page.evaluate(() => ({
      listCalls: hiddenListTest.listCalls,
      connected: !!document.querySelector('#wardrobeList')?.isConnected,
      enabled: DoLWardrobeUI.getNativeHiddenList(),
    }));
    assert.ok(flushResult.listCalls > beforeFlush, 'turning the experiment off must flush the native list');
    assert.equal(flushResult.connected, true);
    assert.equal(flushResult.enabled, false);

    // Re-enable, trigger a category state change, then switch to the original
    // wardrobe. Releasing the new UI must flush before original controls return.
    await page.evaluate(() => {
      DoLWardrobeUI.setNativeHiddenList(true);
      DoLWardrobeUI.refresh();
      V.lastWardrobeSlot = 'upper';
    });
    const fallbackWear = await page.evaluate(() => {
      const beforeWorn = V.worn.upper?.variable ?? null;
      const beforeCalls = hiddenListTest.listCalls;
      document.querySelector<HTMLElement>('.dgw-item:nth-child(3)')?.click();
      return { beforeWorn, beforeCalls };
    });
    await page.waitForFunction(before => (V.worn.upper?.variable ?? null) !== before.beforeWorn, fallbackWear, { timeout: 30000 });
    await nextFrame(page);
    const beforeFallback = await page.evaluate(() => hiddenListTest.listCalls);
    await page.evaluate(() => DoLWardrobeUI.setEnabled(false));
    await page.waitForFunction(() => !document.querySelector('.dgw-shell'), { timeout: 30000 });
    const fallback = await page.evaluate(() => ({
      listCalls: hiddenListTest.listCalls,
      listConnected: !!document.querySelector('#wardrobeList')?.isConnected,
      newUi: !!document.querySelector('.dgw-shell'),
    }));
    assert.ok(fallback.listCalls > beforeFallback, 'original wardrobe fallback must flush the pending list');
    assert.equal(fallback.listConnected, true);
    assert.equal(fallback.newUi, false);

    const result = {
      passed: !pageErrors.length,
      fixture: 'releases/source-baseline-0.5.11.9/vanilla.html',
      operation: 'isolated original game, synthetic upper inventory, control/experiment/fallback wear paths',
      setup:fixtureSetup,
      control: { ...control, ...controlResult },
      experiment: { ...experiment, ...experimentResult },
      strip: { ...strip, ...stripResult },
      towelPaths,
      thrown: { ...thrown, ...thrownAfter },
      malformed,
      flush: flushResult,
      fallbackWear: await page.evaluate(() => ({ worn: V.worn.upper?.variable ?? null, listCalls: hiddenListTest.listCalls })),
      fallback,
      pageErrors,
      noUserdata: true,
      limitations: ['does not assert a speed threshold', 'runs in desktop Edge headless, not Android WebView', 'uses the current built game-ui dist'],
    };
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ outputPath, ...result }, null, 2));
    if (!result.passed) process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error:unknown) => { console.error(error instanceof Error?error.stack:error); process.exitCode = 1; });
