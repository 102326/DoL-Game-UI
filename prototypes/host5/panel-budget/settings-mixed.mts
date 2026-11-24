import assert from 'node:assert/strict';
import {loadPackage,readPackage} from './package-input.mts';
import {chromium, type Page} from 'playwright';
import type {GameUiControls} from '../../../src/runtime/game-controls';
import {createLabServer} from './server.mts';

async function checkBudget(page: Page) {
 const peer = await page.evaluateHandle(async () => {
  const entry = '/prototypes/host5/panel-budget/independent.ts';
  const {attachInspector} = await import(/* @vite-ignore */ entry) as typeof import('./independent');
  const parent = document.querySelector<HTMLElement>('#inspector')!;
  return {remove:attachInspector(window.DoLUiHost!, parent), parent};
 });
 try {
  const result = await peer.evaluate(async ({parent}) => {
   const shadow = parent.firstElementChild!.shadowRoot!;
   const neighbour = shadow.querySelector('button')!, layer = shadow.querySelector('article')!;
   neighbour.click();
   const player = layer.getAnimations()[0]!;
   player.currentTime = 35;
   const opener = document.querySelector<HTMLButtonElement>('#dol-midnight-sidebar-button')!;
   const dialog = document.querySelector<HTMLDialogElement>('#dol-midnight-controls')!;
   const shell = dialog.querySelector<HTMLElement>('.dmt-settings-shell')!;
   let calls = 0;
   const animate = shell.animate;
   shell.animate = function (...args) {calls++; return animate.apply(this, args)};
   opener.focus(); opener.click();
   const opened = dialog.open && getComputedStyle(shell).opacity === '1' && !shell.getAnimations().length;
   dialog.querySelector<HTMLButtonElement>('.dmt-close')!.click();
   const closed = !dialog.open && document.activeElement === opener && !shell.getAnimations().length;
   const retained = layer.getAnimations()[0] === player && player.currentTime === 35 && player.playbackRate > 0;
   await player.finished;
   const stillShown = !layer.hidden && neighbour.getAttribute('aria-expanded') === 'true';
   neighbour.click();
   return {opened, closed, calls, retained, stillShown};
  });
  assert.deepEqual(result,{opened:true,closed:true,calls:0,retained:true,stillShown:true});
  await page.getByRole('button',{name:'Move',exact:true}).waitFor({state:'hidden'});
  assert.ok(await peer.evaluate(({parent}) => parent.firstElementChild!.shadowRoot!.querySelector('article')!.hidden));
  console.log('Occupied foreground track:', result, 'neighbour closed');
 } finally {await peer.evaluate(({remove})=>remove()); await peer.dispose()}
}

const [releasePath, candidatePath, uiPath] = process.argv.slice(2);
assert.ok(releasePath && candidatePath && uiPath, 'Pass the v4.5.2 Host ZIP, candidate Host ZIP and candidate UI ZIP');
const release = readPackage(releasePath,'StoneFreeHost'), candidate = readPackage(candidatePath,'StoneFreeHost');
assert.equal(release.sha,'6f221a29f9a042e9c5f32b4b9be9894d6941df4bebd29a5d326a44a8377cb8b8');
assert.notEqual(candidate.sha, release.sha);
const ui = readPackage(uiPath,'DoLGameUI');
const server = await createLabServer(); await server.listen();
const address = server.httpServer!.address(); assert.ok(address && typeof address === 'object');
const browser = await chromium.launch({channel:'chrome'});
try {
 for (const host of [release, candidate]) {
  const page = await browser.newPage({reducedMotion:'no-preference'});
  page.setDefaultTimeout(6000);
  const errors:string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${address.port}/panel-test`);
  await loadPackage(page, host);
  const capability = await page.evaluate(() => {
   const host = window.DoLUiHost!;
   host.sceneReady();
   return {present:'panelEffects' in host, track:typeof host.panelEffects?.track};
  });
  const current = host === candidate;
  assert.deepEqual(capability,{present:current,track:current ? 'function' : 'undefined'});
  await loadPackage(page, ui);
  const opener = page.locator('#dol-midnight-sidebar-button');
  await opener.focus();
  const opened = await opener.evaluate(el => {
   if (!(el instanceof HTMLButtonElement)) throw Error('Missing settings button');
   el.click();
   const dialog = document.querySelector<HTMLDialogElement>('#dol-midnight-controls')!;
   const player = dialog.querySelector('.dmt-settings-shell')!.getAnimations()[0]!;
   return {open:dialog.open, opacity:(player.effect as KeyframeEffect).getKeyframes().map(f=>f.opacity)};
  });
  assert.deepEqual(opened,{open:true,opacity:['0','1']});
  const settled = () => page.waitForFunction(() => !document.querySelector('.dmt-settings-shell')!.getAnimations().length);
  await settled();
  const dialog = page.locator('#dol-midnight-controls'), close = dialog.getByRole('button',{name:'关闭',exact:true});
  const reversal = await close.evaluate(el => {
   const shell = el.closest('.dmt-settings-shell')!;
   (el as HTMLButtonElement).click();
   const exit = shell.getAnimations()[0]!, frames = (exit.effect as KeyframeEffect).getKeyframes();
   const leavingFor = (exit.playbackRate < 0 ? frames[0] : frames.at(-1))?.opacity;
   exit.currentTime = Number(exit.effect!.getTiming().duration)/2;
   const before = Number(getComputedStyle(shell).opacity);
   const ui = (window as Window & {DoLGameUI?:GameUiControls}).DoLGameUI!;
   ui.openSettings();
   const enter = shell.getAnimations()[0]!;
   return {leavingFor, same:enter === exit, forward:enter.playbackRate > 0,
    continuous:Math.abs(before - .5) < .02 && Math.abs(Number(getComputedStyle(shell).opacity) - before) < .02};
  });
  assert.deepEqual(reversal,{leavingFor:'0',same:current,forward:true,continuous:true});
  await settled();
  assert.ok(await close.evaluate(el => el.closest('dialog')!.open && document.activeElement === el));
  await page.keyboard.press('Escape'); await dialog.waitFor({state:'hidden'});
  assert.ok(await opener.evaluate(el => document.activeElement === el));
  if (current) await checkBudget(page);
  assert.deepEqual(errors,[]);
  console.log(browser.version(),host.version,host.sha,'UI',ui.sha,capability,reversal,'focus returned');
  await page.close();
 }
} finally {await browser.close(); await server.close()}
