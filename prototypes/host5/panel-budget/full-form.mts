import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createLabServer} from './server.mts';

const server = await createLabServer();
await server.listen();
const address = server.httpServer!.address();
assert.ok(address && typeof address === 'object');
const browser = await chromium.launch({channel: process.env.HOST5_BROWSER || 'chrome'});
try {
 const page = await browser.newPage({viewport:{width:900,height:820}});
 page.setDefaultTimeout(6000);
 const errors: string[] = [];
 page.on('pageerror', e => errors.push(e.message));
 await page.goto(`http://127.0.0.1:${address.port}/panel-test`);
 // Inject the built entries. The neutral form substitution only applies to Vite source imports.
 await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
 await page.addScriptTag({path:'dist/framework/host/index.js'});
 await page.addScriptTag({path:'dist/framework/official-ui/index.js'});
 await page.evaluate(async () => {
  const host = window.DoLUiHost!;
  if (!host.layerPresets?.surface || !host.panelEffects) throw Error('Expected both capabilities from the built Host');
  host.sceneReady();
  const entry = '/prototypes/host5/panel-budget/independent.ts';
  const {attachInspector} = await import(/* @vite-ignore */ entry) as typeof import('./independent');
  attachInspector(host,document.querySelector('#inspector')!);
 });
 const inspector = page.getByRole('button',{name:'Inspector',exact:true});
 await inspector.click();
 await page.getByRole('button',{name:'Move',exact:true}).waitFor();
 const scrim = page.locator('#inspector [data-sf-mount="scrim"]');
 const original = await scrim.elementHandle();
 assert.ok(original);
 const opener = page.locator('#dol-midnight-sidebar-button');
 await opener.click();
 const dialog = page.locator('#dol-midnight-controls');
 await dialog.getByRole('button',{name:'材质',exact:true}).click();
 const glass = dialog.getByLabel('玻璃模糊',{exact:true});
 const shell = dialog.locator('.dmt-settings-shell');
 const filter = () => shell.evaluate(el=>getComputedStyle(el).backdropFilter);
 const before = await filter();
 assert.match(before,/blur\(/);
 await glass.uncheck();
 assert.equal(await filter(),'none');
 await glass.check();
 assert.equal(await filter(),before);
 await dialog.getByRole('button',{name:'关闭',exact:true}).click();
 await dialog.waitFor({state:'hidden'});
 assert.ok(await opener.evaluate(el=>document.activeElement===el));
 assert.ok(await original.evaluate(el=>el.isConnected && getComputedStyle(el).backdropFilter.includes('blur(')));
 await inspector.click();
 await page.getByRole('button',{name:'Move',exact:true}).waitFor({state:'hidden'});
 assert.deepEqual(errors,[]);
 console.log({browser:browser.version(),settingsFilter:before,staticFilter:'none',focusReturned:true,peerRetained:true});
} finally {await browser.close();await server.close()}
