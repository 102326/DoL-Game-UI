import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {createLabServer} from '../server.mts';
const root=process.cwd(),loader=process.env.SF_LOADER_ROOT, entry=process.env.SF_INSPECTOR_SURFACE_ENTRY;
assert.ok(loader&&entry,'Set SF_LOADER_ROOT and SF_INSPECTOR_SURFACE_ENTRY to absolute paths');
const git=(...args:string[])=>execFileSync('git',['-C',loader,...args],{encoding:'utf8'}).trim();
assert.equal(git('rev-parse','HEAD:experiments/native-contract'),'b20026a569c36208aca1f9f65a25fa2c4df42bf2');
assert.equal(git('status','--porcelain','--','experiments/native-contract'),'');
const sha=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
const source=JSON.parse(await readFile(path.join(path.dirname(entry),'SOURCE.json'),'utf8'));
assert.equal(sha(await readFile(entry)),source.output.sha256);
assert.equal(source.output.sha256,'a3174c0f25c6739f9e8a531ef3ac9c004293a94d1266b916f3e9e39d3eeacb71');
for(const [name,expected] of Object.entries(source.inputs))assert.equal(sha(await readFile(path.join(root,name))),expected);
const work=await mkdtemp(path.join(tmpdir(),'sw-sticky-')), adapter=path.join(work,'provider.ts');
await writeFile(adapter,`import {createStandaloneSurfaces as official} from ${JSON.stringify(entry)};
import {inspectorFactory} from ${JSON.stringify(path.resolve('prototypes/host5/panel-budget/sticky/bridge.ts'))};
export function createStandaloneSurfaces(root){return inspectorFactory(root,official)}`);
process.chdir(loader);let built;
try{const {buildMainline}=await import(pathToFileURL(path.join(loader,'experiments/native-contract/build-mainline.ts')).href);built=await buildMainline(adapter)}finally{process.chdir(root)}
const js=(built.outputFiles.find((x:{path:string})=>x.path.endsWith('.js'))??built.outputFiles[0]).text;
const css=built.outputFiles.find((x:{path:string})=>x.path.endsWith('.css'))?.text;
const server=await createLabServer();await server.listen();
const address=server.httpServer!.address();assert.ok(address&&typeof address==='object');
const browser=await chromium.launch();
try{
 for(const [mode,width] of [['window',1150],['plain',1150],['drawer',1150],['window',390]] as const){
  const page=await browser.newPage({viewport:{width,height:780},reducedMotion:mode==='plain'?'reduce':'no-preference'});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+address.port+'/prototypes/host5/panel-budget/sticky/?'+mode);
  await page.waitForFunction(()=>!!window.DoLUiHost);
  const evaluate=(code:string)=>page.evaluate(code);
  await evaluate(`window.__sfInput={enabled:true,inspector:true};window.jQuery=()=>({on(n,f){document.addEventListener(n,f)},off(n,f){document.removeEventListener(n,f)}})`);
  if(css)await page.addStyleTag({content:css});
  await page.addScriptTag({content:js});
  await evaluate(`window.__sfBoot(()=>{document.querySelector('#passages').innerHTML='<div class="passage">SF_E16_ANCHOR</div>';document.dispatchEvent(new Event(':storyready.sfNativeMainline'))},()=>{});void 0`);
  const ordinary=page.locator('#ordinary'),open=page.locator('#sf-native-inspector-open'),settings=page.locator('#dol-midnight-controls');
  await page.locator('#settings').click();await open.click();
  const panel=page.locator('#sf-native-inspector'),dialog=page.locator('dialog').filter({has:panel});
  await panel.waitFor();const original=await panel.elementHandle();
  assert.equal(await dialog.evaluate(d=>d.matches(':modal')),mode==='drawer');
  const report=await panel.locator('#sf-native-inspector-report').textContent();assert.ok(JSON.parse(report!).instances.length);
  await evaluate(`SFNativeMainline.release(SFNativeMainline.read().snapshot.instances.find(i=>i.handle.module==='Consumer').handle);void 0`);
  await page.waitForFunction(()=>JSON.parse(document.querySelector('#sf-native-inspector-report')!.textContent!).instances.some((i:{module:string;state:string})=>i.module==='Consumer'&&i.state==='released'));
  const contentBefore=await original!.evaluate(n=>n.textContent);
  assert.ok(contentBefore?.includes('订阅送达'));
  if(mode!=='drawer'){
   assert.equal(await dialog.evaluate(d=>getComputedStyle(d).animationName),mode==='plain'?'none':'appear');
   assert.equal(await dialog.evaluate(d=>getComputedStyle(d).backdropFilter),mode==='plain'?'none':'blur(4px)');
   await ordinary.click();assert.equal(await ordinary.getAttribute('data-count'),'1');
   // Real browser Tab wraps only in the focused shell.
   const first=dialog.locator('button').first(),last=dialog.locator('button:visible:not(:disabled)').last();
   await last.focus();await page.keyboard.press('Tab');assert.ok(await first.evaluate(n=>document.activeElement===n));
   await page.keyboard.press('Shift+Tab');assert.ok(await last.evaluate(n=>document.activeElement===n));
   await page.locator('#modal').click();await page.keyboard.press('Tab');await page.keyboard.press('Tab');
   assert.ok(await page.locator('#native').evaluate(n=>n.contains(document.activeElement)||document.activeElement===document.body));
   const box=await ordinary.boundingBox();assert.ok(box);await page.mouse.click(box.x+4,box.y+4);
   assert.equal(await ordinary.getAttribute('data-count'),'1');assert.ok(await page.locator('#native').evaluate(n=>n.matches(':modal')));
   await page.keyboard.press('Escape');await page.locator('#native').waitFor({state:'hidden'});assert.ok(await dialog.isVisible()&&await settings.isVisible());
   await ordinary.click();assert.equal(await ordinary.getAttribute('data-count'),'2');
   await first.focus();await page.keyboard.press('Escape');await panel.waitFor({state:'detached'});assert.ok(await settings.isVisible());
   await open.click();assert.ok(await original!.evaluate(n=>n===document.querySelector('#sf-native-inspector')));
   await settings.locator('.dmt-close').focus();await page.keyboard.press('Tab');assert.ok(await settings.locator('.dmt-close').evaluate(n=>document.activeElement===n));
   await page.keyboard.press('Escape');await settings.waitFor({state:'hidden'});assert.ok(await dialog.isVisible());
   await page.locator('#settings').click();
   await first.focus();
   await settings.locator('.dmt-close').evaluate(n=>(n as HTMLButtonElement).click());
   await settings.waitFor({state:'hidden'});assert.ok(await first.evaluate(n=>n===document.activeElement),'old settings stole focus');
   await page.locator('#settings').click();await settings.locator('.dmt-close').focus();
  }else{
   const box=await ordinary.boundingBox();assert.ok(box);await page.mouse.click(box.x+4,box.y+4);
   assert.equal(await ordinary.getAttribute('data-count'),null);
   if(await panel.isVisible())await page.keyboard.press('Escape');await panel.waitFor({state:'detached'});
   await ordinary.click();await open.click();
  }
  const shared=await page.locator('#shared').elementHandle();
  await evaluate(`SFNativeMainline.release(SFNativeMainline.read().snapshot.instances.find(i=>i.handle.module==='sf.inspector').handle);void 0`);
  await panel.waitFor({state:'detached'});assert.ok(await settings.isVisible());assert.ok(await shared!.evaluate(n=>n===document.querySelector('#shared')));
  if(mode!=='drawer')assert.ok(await settings.locator('.dmt-close').evaluate(n=>n===document.activeElement),'older inspector stole focus');
  assert.equal(await page.locator('[data-sf-owner="StickyInspectorWindow"]').count(),0);
  assert.equal(await evaluate('DoLUiHost.getDiagnostics().participants.includes("StickyInspectorWindow")'),false);
  assert.equal(await evaluate('SFNativeMainline.read().snapshot.cleanupFailures'),0);
  const clicks=Number(await ordinary.getAttribute('data-count'));await ordinary.click();
  assert.equal(await ordinary.getAttribute('data-count'),String(clicks+1));
  await evaluate('SFNativeMainline.dispose();void 0');assert.deepEqual(errors,[]);
  await page.close();console.log('PASS real mainline',mode,width);
 }
 console.log(browser.version(),source.output.sha256,git('rev-parse','HEAD'));
}finally{await browser.close();await server.close()}
