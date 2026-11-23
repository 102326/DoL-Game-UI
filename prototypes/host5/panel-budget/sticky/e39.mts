import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {Page} from 'playwright';

export const e39 = '1bea13e7c99c57fdcaffe5e54e08b518981356a8';
const tree = '88e1149d6f453503b8e4d42d1d02053b11b8aa7f';

export async function buildE39(loader: string, factory: string) {
 const git = (...args: string[]) => execFileSync('git', ['-C', loader, ...args], {maxBuffer: 32 * 1024 * 1024});
 assert.equal(git('rev-parse', e39 + '^{commit}').toString().trim(), e39);
 assert.equal(git('rev-parse', e39 + ':experiments/native-contract').toString().trim(), tree);
 const archives = ['experiments/native-contract', 'experiments/core-context-capabilities'];
 const parent = path.resolve('tests/artifacts');
 await mkdir(parent, {recursive: true});
 const work = await mkdtemp(path.join(parent, 'sticky-e39-'));
 try {
  execFileSync('tar', ['-xf', '-', '-C', work], {input: git('archive', e39, 'package.json', ...archives)});
  const manifest = JSON.parse(await readFile(path.join(work, 'package.json'), 'utf8'));
  // Count subscriptions across the real startup without replacing or invoking any listener.
  const probe = `
import {NativeSession} from './experiments/native-contract/native.ts';
const subscribe = NativeSession.prototype.subscribe;
const stops = new Map();
const counts = {added:0, stopped:0};
window.__e39Subscriptions = counts;
NativeSession.prototype.subscribe = function(listener) {
 const stop = subscribe.call(this, listener);
 if (!stops.has(stop)) {
  counts.added++;
  stops.set(stop, () => {
   if (stops.delete(stop)) counts.stopped++;
   stop();
  });
 }
 return stops.get(stop);
};`;
  const adapter = path.join(work, 'provider.ts');
  await writeFile(adapter, factory + probe);
  const buildFile = 'experiments/native-contract/build-mainline.ts';
  // esbuild captures its default working directory when loaded. Start it in the pinned snapshot.
  const script = `import {buildMainline} from './${buildFile}';
import {version} from 'esbuild';
const result = await buildMainline('./provider.ts');
process.stdout.write(JSON.stringify({version,inputs:Object.keys(result.metafile.inputs),
 outputFiles:result.outputFiles.map(({path,text})=>({path,text}))}));`;
  const built = JSON.parse(execFileSync(process.execPath, ['--input-type=module','-e',script], {
   cwd: work, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024
  })) as {version: string; inputs: string[]; outputFiles: {path:string; text:string}[]};
  assert.equal(built.version, manifest.devDependencies.esbuild);
  const inputs = built.inputs.filter(name => name.startsWith('experiments/'));
  for (const name of ['mainline.ts', 'inspector.ts', 'native.ts']) assert.ok(inputs.includes('experiments/native-contract/' + name));
  for (const name of [buildFile, ...inputs]) assert.ok((await readFile(path.join(work, name))).equals(git('show', e39 + ':' + name)), name);
  console.log('E39 verified', tree, inputs.length, 'bundled Loader sources; esbuild', built.version);
  return built;
 } finally {
  assert.equal(path.dirname(work), parent);
  await rm(work, {recursive: true, force: true});
 }
}

export async function checkE39(page: Page) {
 const launcher = page.locator('#sf-native-inspector-open');
 const panel = page.locator('#sf-native-inspector');
 const shell = page.locator('dialog[data-sticky-window]');
 const settings = page.locator('#dol-midnight-controls');
 const ordinary = page.locator('#ordinary');
 const focus = (selector: string) => page.locator(selector).evaluate(n => n === document.activeElement);
 const subs = (): Promise<{added:number; stopped:number}> => page.evaluate('({...window.__e39Subscriptions})');
 const release = (id: string) => page.evaluate(`SFNativeMainline.release(SFNativeMainline.read().snapshot.instances.find(i=>i.handle.module===${JSON.stringify(id)}).handle);void 0`);
 const ownerNodes = page.locator('[data-sf-owner="StickyInspectorWindow"]');
 const participants = (): Promise<string[]> => page.evaluate('DoLUiHost.getDiagnostics().participants');
 await launcher.waitFor();
 assert.equal(await settings.count(), 0);
 assert.equal(await page.evaluate('typeof window.DoLMidnightTheme'), 'undefined');
 assert.equal(await page.evaluate('SFNativeMainline.read().snapshot.phase'), 'running');
 const baseline = await subs();
 const shared = await page.locator('#shared').elementHandle();
 await launcher.click();
 await shell.waitFor();
 assert.equal(await ownerNodes.count(), 1);
 assert.ok((await participants()).includes('StickyInspectorWindow'));
 const original = await panel.elementHandle();
 assert.ok(original && shared);
 assert.equal(await shell.evaluate(n => n.matches(':modal')), false);
 assert.ok(await focus('dialog[data-sticky-window] > button'));
 await ordinary.click();
 assert.equal(await ordinary.getAttribute('data-count'), '1');
 await release('Consumer');
 await page.waitForFunction(() => {
  const node = document.querySelector('#sf-native-inspector-report')!;
  return JSON.parse(node.textContent!).instances.some((i:{module:string;state:string}) => i.module === 'Consumer' && i.state === 'released');
 });
 assert.match(await panel.locator('#sf-native-inspector-observation').innerText(), /订阅送达/);
 await shell.locator('button').first().focus();
 await page.keyboard.press('Escape');
 await shell.waitFor({state: 'detached'});
 assert.ok(await focus('#sf-native-inspector-open'));
 assert.equal(await ownerNodes.count(), 0);
 assert.ok(await original.evaluate(n => !n.isConnected && !n.parentNode));
 await launcher.click();
 assert.ok(await original.evaluate(n => n === document.querySelector('#sf-native-inspector')));
 assert.deepEqual(await subs(), baseline);

 await page.locator('#settings').click();
 await settings.waitFor();
 assert.equal(await settings.evaluate(n => n.matches(':modal')), false);
 const closeSettings = settings.locator('.dmt-close');
 await closeSettings.focus();
 await page.evaluate("SFNativeMainline.mount('Consumer');void 0");
 const consumer = panel.locator('tr[data-module="Consumer"]');
 assert.match(await consumer.innerText(), /第 2 代 · active/);
 assert.match(await panel.locator('#sf-native-inspector-observation').innerText(), /订阅送达/);
 await page.keyboard.press('Tab');
 assert.ok(await closeSettings.evaluate(n => n === document.activeElement));
 await page.keyboard.press('Escape');
 await settings.waitFor({state: 'hidden'});
 assert.ok(await focus('#settings'));
 assert.ok(await panel.isVisible());
 assert.ok(await original.evaluate(n => n === document.querySelector('#sf-native-inspector')));
 await panel.locator('[data-action="refresh"]').click();
 assert.match(await panel.locator('#sf-native-inspector-observation').innerText(), /手动读取/);
 await page.locator('#settings').click();
 await shell.locator('button:visible').last().focus();
 await page.keyboard.press('Tab');
 assert.ok(await focus('dialog[data-sticky-window] > button'));
 await page.keyboard.press('Escape');
 await shell.waitFor({state: 'detached'});
 assert.ok(await settings.isVisible());
 await launcher.click();
 assert.ok(await original.evaluate(n => n === document.querySelector('#sf-native-inspector')));
 await closeSettings.focus();
 assert.deepEqual(await subs(), baseline);
 const peers = (await participants()).filter(id => id !== 'StickyInspectorWindow');
 await release('sf.inspector');
 await launcher.waitFor({state: 'detached'});
 assert.equal(await ownerNodes.count(), 0);
 assert.deepEqual(await participants(), peers);
 assert.deepEqual(await subs(), {added: baseline.added, stopped: baseline.stopped + 1});
 assert.ok(await closeSettings.evaluate(n => n === document.activeElement));
 assert.ok(await shared.evaluate(n => n === document.querySelector('#shared')));
 await ordinary.click();
 assert.equal(await ordinary.getAttribute('data-count'), '2');
 await closeSettings.click();
 await settings.waitFor({state: 'hidden'});
 const afterRelease = await subs();
 await page.evaluate("SFNativeMainline.mount('sf.inspector');void 0");
 await launcher.click();
 await page.evaluate('DoLMidnightTheme.destroy();void 0');
 assert.equal(await settings.count(), 0);
 assert.ok(await focus('dialog[data-sticky-window] > button'));
 assert.equal(await ownerNodes.count(), 1);
 assert.deepEqual(await subs(), {added: afterRelease.added + 1, stopped: afterRelease.stopped});
 await release('Consumer');
 assert.match(await consumer.innerText(), /第 2 代 · released/);
 await release('sf.inspector');
 assert.deepEqual(await subs(), {added: afterRelease.added + 1, stopped: afterRelease.stopped + 1});
 assert.equal(await page.evaluate('SFNativeMainline.read().snapshot.cleanupFailures'), 0);
 assert.equal(await page.evaluate('SFNativeMainline.read().snapshot.observerFailures'), 0);
 console.log('PASS E39 modeless solo + Settings; subscriptions', baseline, '->', afterRelease, '->', await subs());
 await page.evaluate('SFNativeMainline.dispose();void 0');
}
