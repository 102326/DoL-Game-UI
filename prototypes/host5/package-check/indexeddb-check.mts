import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {chromium} from 'playwright';
type Boot = {version: string; dependenceInfo: {modName: string; version: string}[]};
type ModUtils = {getModListNameNoAlias(): string[]; getAnyModByNameNoAlias(name: string): {bootJson: Boot}; getModZip(name: string): {getZipFile(): {file(name: string): {async(type: 'uint8array'): Promise<Uint8Array<ArrayBuffer>>}}}; getModZipReaderStaticClassRef(): {IndexDBLoader: {addMod(name: string, data: string): Promise<void>; listMod(): Promise<string[]>}}};
type TestWindow = Window & {modUtils: ModUtils; DoLUiHost: {layerPresets?: {driftingTexture?: unknown}}; addonTweeReplacer: unknown; modSC2DataManager: {getDependenceChecker(): {check(): boolean}}};
const [pagePath, tweePath, oldPath, hostPath, uiPath] = process.argv.slice(2);
assert.ok(pagePath && tweePath && oldPath && hostPath && uiPath,
  'expected neutral HTML, TweeReplacer, old Host, candidate Host, candidate UI');
const html = await readFile(pagePath);
const inputs = await Promise.all([tweePath, oldPath, hostPath, uiPath].map(path => readFile(path)));
assert.deepEqual(inputs.map(data => createHash('sha256').update(data).digest('hex')), [
  '291b83e9f3ea584cf7223e6701abb8e7a345026df746dc57a755c28f33ae308b',
  '6f221a29f9a042e9c5f32b4b9be9894d6941df4bebd29a5d326a44a8377cb8b8',
  '1070dba995d3e2638824257f4c8283e017e9438baf53c674348f184130d76138',
  '8357604f00475147d62f820b830501ca22a5d2d87141918de3172076255f4e1c',
]);
const [twee, oldHost, host, ui] = inputs.map(data => data.toString('base64'));
const order = ['TweeReplacer', 'StoneFreeHost', 'DoLGameUI'];
const oldScript = '86b828ae8aa2f389f17ac10eb887752d2972cdfddf172c06a8237e25a43ef7bd';
const newScript = 'e6f24046c8715f772500ce53f99326d49417cd2207da45bb691e01b773715abf';
const server = createServer((req, res) => {
  if (req.url !== '/') {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}).end(html);
});
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}/`;
try {
  const browser = await chromium.launch({channel: 'chrome'});
  try {
    for (const mode of ['clean', 'upgrade']) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(url);
      await page.waitForFunction(() => (window as unknown as TestWindow).modUtils);

      async function add(name: string, data: string) {
        await page.evaluate(async ({name, data}) => {
          const {modUtils} = window as unknown as TestWindow;
          await modUtils.getModZipReaderStaticClassRef().IndexDBLoader.addMod(name, data);
        }, {name, data});
      }
      async function reloadAndInspect() {
        await page.reload();
        await page.waitForFunction(() => {
          const w = window as unknown as TestWindow;
          return w.modUtils?.getModListNameNoAlias().includes('DoLGameUI') && w.DoLUiHost && w.addonTweeReplacer;
        });
        return page.evaluate(async () => {
          const w = window as unknown as TestWindow;
          const u = w.modUtils;
          const zip = u.getModZip('StoneFreeHost').getZipFile();
          const bytes = await zip.file('index.js').async('uint8array');
          const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
          return {
            mods: u.getModListNameNoAlias(),
            version: u.getAnyModByNameNoAlias('StoneFreeHost').bootJson.version,
            digest: Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join(''),
            capability: typeof w.DoLUiHost.layerPresets?.driftingTexture,
            dependent: u.getAnyModByNameNoAlias('DoLGameUI').bootJson.dependenceInfo,
            check: w.modSC2DataManager.getDependenceChecker().check(),
            stored: await u.getModZipReaderStaticClassRef().IndexDBLoader.listMod(),
          };
        });
      }
      await add('TweeReplacer', twee!);
      await add('StoneFreeHost', mode === 'upgrade' ? oldHost! : host!);
      await add('DoLGameUI', ui!);
      const first = await reloadAndInspect();
      assert.deepEqual(first.mods, order);
      assert.equal(first.check, true);
      assert.equal(first.digest, mode === 'upgrade' ? oldScript : newScript);
      assert.equal(first.capability, mode === 'upgrade' ? 'undefined' : 'function');
      assert.equal(first.version, '0.1.5-experimental');
      let final = first;
      if (mode === 'upgrade') {
        await add('StoneFreeHost', host!);
        final = await reloadAndInspect();
      }
      assert.deepEqual(final.mods, order);
      assert.deepEqual(final.stored, order);
      assert.equal(final.version, '0.1.5-experimental');
      assert.equal(final.digest, newScript);
      assert.equal(final.capability, 'function');
      assert.equal(final.check, true);
      await page.locator('#dol-midnight-sidebar-button').click({timeout: 5000});
      await page.locator('#dol-midnight-controls .dmt-settings-shell').waitFor({state: 'visible'});
      await page.keyboard.press('Escape');
      await page.locator('#dol-midnight-controls').waitFor({state: 'hidden'});
      console.log(JSON.stringify({mode, browser: browser.version(), before: first, after: final}));
      await context.close();
    }
  } finally {
    await browser.close();
  }
} finally {
  server.close();
}
