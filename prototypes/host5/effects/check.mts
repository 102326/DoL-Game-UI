import {createServer} from 'vite';
import {chromium, type Browser} from 'playwright';
import assert from 'node:assert/strict';
import type {Host} from '../../../framework/contracts';
import type {createWeather} from './effects';
declare global {interface Window {effectsDemo: {host: Readonly<Host>; shared: ReturnType<typeof createWeather>; page: {dispose(): void}}; testOverlay?: Element; testPage?: Element; testPageEffect?: Element}}
const server = await createServer({configFile: false, server: {host: '127.0.0.1', port: 0}});
let browser: Browser | undefined;
try {
 await server.listen();
 const address = server.httpServer!.address();
 if (!address || typeof address === 'string') throw new Error('No test server address');
 browser = await chromium.launch({headless: true, channel: 'chrome'});
 const page = await browser.newPage({viewport: {width: 1000, height: 850}});
 const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
 await page.goto(`http://127.0.0.1:${address.port}/prototypes/host5/effects/`);
 await page.waitForFunction(() => !!window.effectsDemo);
 assert.equal(await page.locator('.effects-surface').count(), 2);
 assert.equal(await page.evaluate(() => window.effectsDemo.shared.count()), 2);
 assert.equal(await page.evaluate(() => window.effectsDemo.host.getDiagnostics().claims.length), 1);
 assert.equal(await page.locator('[data-page="one"]').count(), 1);
 await page.getByRole('button', {name:'Rain', exact:true}).click();
 await page.evaluate(() => {window.testOverlay = document.querySelector('#panel .effects-surface')!; window.testPage = document.querySelector('#scene-content article')!; window.testPageEffect = document.querySelector('#page .effects-surface')!});
 // Invalidation freezes the displayed transform, including an unfinished entry.
 const oldShift = await page.locator('#panel .effects-surface').evaluate(el => {
  const move=el.getAnimations().find(a=>(a.effect as KeyframeEffect).getKeyframes().some(k=>k.transform));
  if(move){move.pause();move.currentTime=120}
  return String(Math.round(new DOMMatrixReadOnly(getComputedStyle(el).transform).m41));
 });
 await page.getByRole('button', {name:'New scene'}).click();
 assert.equal(await page.locator('[data-page="two"]').count(), 1);
 assert.equal(await page.evaluate(() => window.testPage !== document.querySelector('#scene-content article')), true);
 assert.equal(await page.evaluate(() => window.testOverlay === document.querySelector('#panel .effects-surface')), true);
 assert.equal(await page.evaluate(() => window.testPageEffect === document.querySelector('#page .effects-surface')), true);
 assert.equal(await page.locator('#panel .effects-surface').getAttribute('data-weather'), 'rain');
 assert.equal(await page.locator('#panel .effects-surface').getAttribute('data-shift'), oldShift);
 const background = page.getByRole('button', {name:'Activate page control'});
 await background.click();
 assert.equal(await page.locator('#scene-content output').textContent(), '1');
 assert.equal(await background.evaluate(el => document.activeElement === el), true);
 await page.locator('#panel .ability').focus();
 assert.equal(await page.locator('#panel .ability').evaluate(el => document.activeElement === el), true);
 await page.getByRole('button', {name:'New scene'}).click();
 assert.equal(await page.locator('[data-page="one"]').count(), 1);
 assert.equal(await page.evaluate(() => window.testOverlay === document.querySelector('#panel .effects-surface')), true);
 // Reopen synchronously and pause at a known opening position before it can finish.
 await page.evaluate(() => {
  (document.querySelector('#remove-panel') as HTMLButtonElement).click();
  (document.querySelector('#open-panel') as HTMLButtonElement).click();
  const el = document.querySelector('#panel .effects-surface')!;
  const animation = el.getAnimations().find(a => (a.effect as KeyframeEffect).getKeyframes().some(k => k.transform));
  if (!animation) throw new Error('Missing opening animation');
  animation.pause(); animation.currentTime = 100;
 });
 const surface = page.locator('#panel .effects-surface');
 const handle = surface.locator('.ability');
 // Freeze the opening transition at a known painted position before pointer takeover.
 const opening = await surface.evaluate(el => {
  const animation = el.getAnimations().find(a => (a.effect as KeyframeEffect).getKeyframes().some(k => k.transform));
  if (!animation) throw new Error('Missing opening animation');
  animation.pause(); animation.currentTime = 100;
  return new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
 });
 assert.ok(opening > 0 && opening < 36);
 const box = await handle.boundingBox(); if (!box) throw new Error('Missing handle');
 const x = box.x + box.width / 2, y = box.y + box.height / 2;
 await handle.evaluate(el => el.addEventListener('pointerdown', e => {el.dataset.testPointer = String((e as PointerEvent).pointerId)}, {once: true}));
 await page.mouse.move(x, y); await page.mouse.down();
 assert.ok(Math.abs(Number(await surface.getAttribute('data-shift')) - opening) <= 1);
 assert.equal(await handle.evaluate(el => document.activeElement === el), true);
 const initialShift = await surface.getAttribute('data-shift');
 await handle.evaluate(el => {const id = Number(el.dataset.testPointer); el.dispatchEvent(new PointerEvent('pointermove', {pointerId: id + 100, clientX: 999})); el.dispatchEvent(new PointerEvent('pointerup', {pointerId: id + 100}))});
 assert.equal(await surface.getAttribute('data-shift'), initialShift);
 await page.mouse.move(x + 50, y);
 assert.ok(Number(await surface.getAttribute('data-shift')) > opening);
 assert.ok(await surface.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41) > opening);
 await page.mouse.move(x - 50, y);
 assert.ok(Number(await surface.getAttribute('data-shift')) < 0);
 await page.mouse.up();
 // Pause settling and take over exactly its current painted position.
 const settling = await surface.evaluate(el => {
  const animation = el.getAnimations().find(a => (a.effect as KeyframeEffect).getKeyframes().some(k => k.transform));
  if (!animation) throw new Error('Missing settling animation');
  animation.pause(); animation.currentTime = 80;
  return new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
 });
 const movedBox = await handle.boundingBox(); if (!movedBox) throw new Error('Missing moved handle');
 await page.mouse.move(movedBox.x + 20, movedBox.y + 15); await page.mouse.down();
 assert.ok(Math.abs(Number(await surface.getAttribute('data-shift')) - settling) <= 1);
 // Invalidate while captured; later events from the old pointer cannot move the new scene.
 const beforeScene = await surface.getAttribute('data-shift');
 assert.equal(await page.evaluate(() => {const b = window.effectsDemo.host.binding(); window.effectsDemo.host.invalidateScene(); return b.isCurrent()}), false);
 await page.evaluate(() => window.effectsDemo.host.sceneReady());
 await page.mouse.move(movedBox.x + 80, movedBox.y + 15); await page.mouse.up();
 assert.equal(await surface.getAttribute('data-shift'), beforeScene);
 assert.equal(await handle.evaluate(el => document.activeElement === el), true);
 // A cancellation clears capture and makes subsequent events inert.
 const cancelBox = await handle.boundingBox(); if (!cancelBox) throw new Error('Missing cancel handle');
 await page.mouse.move(cancelBox.x + 20, cancelBox.y + 15); await page.mouse.down();
 await page.mouse.move(cancelBox.x + 45, cancelBox.y + 15);
 await handle.evaluate(el => el.dispatchEvent(new PointerEvent('pointercancel', {pointerId: Number(el.dataset.testPointer)})));
 const cancelled = await surface.getAttribute('data-shift');
 await page.mouse.move(cancelBox.x + 80, cancelBox.y + 15); await page.mouse.up();
 assert.equal(await surface.getAttribute('data-shift'), cancelled);
 // Color continuity across both weather interruption and generation invalidation.
 const colors = await page.evaluate(() => {
  const el = document.querySelector<HTMLElement>('#panel .effects-surface')!;
  window.effectsDemo.shared.set('rain');
  let animation = el.getAnimations().find(a => (a.effect as KeyframeEffect).getKeyframes().some(k => k.backgroundColor))!;
  animation.pause(); animation.currentTime = 180;
  const mid = getComputedStyle(el).backgroundColor;
  window.effectsDemo.shared.set('snow');
  const interrupted = getComputedStyle(el).backgroundColor;
  animation = el.getAnimations().find(a => (a.effect as KeyframeEffect).getKeyframes().some(k => k.backgroundColor))!;
  animation.pause(); animation.currentTime = 100;
  const preScene = getComputedStyle(el).backgroundColor;
  window.effectsDemo.host.invalidateScene();
  const invalidated = getComputedStyle(el).backgroundColor;
  window.effectsDemo.host.sceneReady();
  return {mid, interrupted, preScene, invalidated, resumed: getComputedStyle(el).backgroundColor};
 });
 assert.equal(colors.mid, colors.interrupted);
 assert.equal(colors.preScene, colors.invalidated);
 assert.equal(colors.invalidated, colors.resumed);
 assert.deepEqual(await page.locator('.effects-surface').evaluateAll(nodes => nodes.map(n => (n as HTMLElement).dataset.weather)), ['snow', 'snow']);
 // Remove a focused panel during settling, then reopen and verify ownership and focus.
 const panelHandle = page.locator('#panel .ability');
 const panelBox = await panelHandle.boundingBox(); if (!panelBox) throw new Error('Missing panel handle');
 await page.mouse.move(panelBox.x + 20, panelBox.y + 15); await page.mouse.down();
 await page.mouse.move(panelBox.x + 70, panelBox.y + 15); await page.mouse.up();
 await page.evaluate(() => (document.querySelector('#remove-panel') as HTMLButtonElement).click());
 assert.equal(await page.evaluate(() => window.effectsDemo.shared.count()), 1);
 assert.equal(await page.evaluate(() => window.effectsDemo.host.getDiagnostics().claims.length), 1);
 assert.equal(await page.getByRole('button', {name:'Open panel'}).evaluate(el => document.activeElement === el), true);
 await page.getByRole('button', {name:'Open panel'}).click();
 assert.equal(await page.evaluate(() => window.effectsDemo.shared.count()), 2);
 assert.equal(await page.locator('#panel .effects-surface').getAttribute('data-weather'), 'snow');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button', {name:'Rain', exact:true}).click();
 assert.equal(await page.locator('#panel .effects-surface').evaluate(el => el.getAnimations().filter(a => a.playState !== 'idle').length), 0);
 const leases = await page.evaluate(() => {
  const {shared, page: background} = window.effectsDemo;
  const probe = shared.leaseField();
  const first = probe.field;
  probe.release();
  background.dispose();
  const stillMounted = shared.leaseField();
  const kept = first === stillMounted.field;
  stillMounted.release();
  document.querySelector<HTMLButtonElement>('#remove-panel')!.click();
  const fresh = shared.leaseField();
  const replaced = first !== fresh.field;
  probe.release(); // An old handle cannot release a newer allocation.
  const concurrent = shared.leaseField();
  const current = fresh.field === concurrent.field;
  concurrent.release(); fresh.release();
  return {kept, replaced, current};
 });
 assert.deepEqual(leases, {kept:true, replaced:true, current:true});
 await page.getByRole('button', {name:'Dispose all'}).click();
 assert.equal(await page.locator('.effects-surface').count(), 0);
 assert.equal(await page.evaluate(() => window.effectsDemo.host.getDiagnostics().claims.length), 0);
 assert.deepEqual(errors, []);
 console.log('Effects checks passed: takeover, reversal, stale pointer, color continuity, shared ownership, focus and teardown.');
} finally {await browser?.close(); await server.close()}
