import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createLabServer} from './server.mts';
import type {GameUiControls} from '../../../src/runtime/game-controls';

const server = await createLabServer();
await server.listen();
const address = server.httpServer!.address();
assert.ok(address && typeof address === 'object');
const browser = await chromium.launch({channel: process.env.HOST5_BROWSER || 'chrome'});
try {
 for (const mode of ['host', 'legacy', 'reduced'] as const) {
  const page = await browser.newPage({reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference'});
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${address.port}/panel-test`);
  await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
  await page.addScriptTag({path:'dist/framework/host/index.js'});
  // Delegate to the built Host and count the settings consumer's ownership boundary.
  const counts = await page.evaluateHandle(mode => {
   const host = window.DoLUiHost!, motion = host.panelEffects!;
   const count = {created:0, released:0};
   window.DoLUiHost = {...host, layerPresets:mode === 'legacy' ? undefined : host.layerPresets,
    panelEffects:mode === 'legacy' ? undefined : {track(...args) {
     const track = motion.track(...args);
     count.created++;
     return {...track, release() {count.released++; track.release()}};
    }}};
   host.sceneReady();
   return count;
  }, mode);
  await page.addScriptTag({path:'dist/framework/official-ui/index.js'});
  const opener = page.locator('#dol-midnight-sidebar-button');
  if (mode === 'reduced') await opener.evaluate(el => el.addEventListener('click', () => {
   const dialog = document.querySelector<HTMLDialogElement>('#dol-midnight-controls')!;
   if (!dialog.open || dialog.querySelector('.dmt-settings-shell')!.getAnimations().length)
    throw Error('Reduced-motion opening must settle synchronously');
  }, {once:true}));
  await opener.click();
  const dialog = page.locator('#dol-midnight-controls');
  const shell = dialog.locator('.dmt-settings-shell');
  const close = dialog.getByRole('button', {name:'关闭', exact:true});
  await page.waitForFunction(() => !document.querySelector('.dmt-settings-shell')!.getAnimations().length);
  // Drive the real close handler and reopen API within one task. Seek halfway
  // through closing so browser scheduling cannot turn a reversal into a fresh open.
  const transition = await close.evaluate((el, mode) => {
   const dialog = el.closest('dialog')!, shell = dialog.querySelector<HTMLElement>('.dmt-settings-shell')!;
   (el as HTMLButtonElement).click();
   const exiting = shell.getAnimations()[0];
   if (mode === 'reduced') return {closed:!dialog.open, animated:!!exiting};
   if (!exiting) throw Error('Expected a closing animation');
   exiting.currentTime = Number(exiting.effect!.getTiming().duration) / 2;
   const opacity = Number(getComputedStyle(shell).opacity);
   const ui = (window as Window & {DoLGameUI?:GameUiControls}).DoLGameUI;
   if (!ui) throw Error('Official settings entry unavailable');
   ui.openSettings();
   const entering = shell.getAnimations()[0];
   return {samePlayer:entering === exiting, forward:!!entering && entering.playbackRate > 0,
    midpoint:Math.abs(opacity - 0.5) < 0.02 && Math.abs(Number(getComputedStyle(shell).opacity) - opacity) < 0.02};
  }, mode);
  if (mode === 'reduced') assert.deepEqual(transition,{closed:true, animated:false});
  else {
   assert.deepEqual(transition,{samePlayer:mode === 'host', forward:true, midpoint:true});
   await page.waitForFunction(() => !document.querySelector('.dmt-settings-shell')!.getAnimations().length);
   assert.ok(await close.evaluate(el => el.closest('dialog')!.open && document.activeElement === el));
   assert.equal((await counts.jsonValue()).released,0);
   await page.keyboard.press('Escape');
  }
  await dialog.waitFor({state:'hidden'});
  assert.ok(await opener.evaluate(el => document.activeElement === el));
  assert.equal(await shell.evaluate(el => el.getAnimations().length),0);
  const ownership = await counts.jsonValue();
  const expected = mode === 'legacy' ? 0 : 1;
  assert.deepEqual(ownership,{created:expected, released:expected});
  assert.deepEqual(errors,[]);
  console.log(browser.version(), mode, transition, ownership, 'focus returned');
  await page.close();
 }
} finally {await browser.close(); await server.close()}
