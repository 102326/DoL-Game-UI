// @ci-contract {"profiles":["standard","research"],"classification":"contract","granularity":"checkpoint","caseSource":"caseCheckpoint","rendererContexts":["sphere:2d"]}
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import playwright = require('playwright');
import cases = require('../scripts/ci-cases.cjs');
import type {hubPreview as preview} from '../prototypes/evolution-integration/hub-preview';

declare const hubPreview: typeof preview;
const {caseCheckpoint} = cases;
const key = 'SoftWet.MotionHub.freePosition.v1';
const legacyKey = 'StoneFreeMotionHub.position.v1';
const stored = (page: playwright.Page) => page.evaluate(key => localStorage.getItem(key), key);

async function dragTo(page: playwright.Page, ball: playwright.Locator, x: number, y: number) {
 await ball.hover();
 const box = await ball.boundingBox();
 assert.ok(box);
 await page.mouse.move(box.x + box.width * .75, box.y + box.height / 2);
 await page.mouse.down();
 await page.mouse.move(x, y, {steps: 5});
 assert.equal(await ball.evaluate(node => node.classList.contains('is-dragging')), true);
}

async function verifyHubPlacement(browser: playwright.Browser) {
 await import('./hub-placement.test.mts');
 const {createHubPreviewServer} = await import('../scripts/preview-evolution-hub.mjs');
 const server = await createHubPreviewServer(0);
 const out = path.resolve('tests/artifacts/evolution/hub-placement-' + Date.now());
 const rows: unknown[] = [], errors: string[] = [];
 fs.mkdirSync(out, {recursive: true});
 let status = 'FAIL', stage = 'startup', page: playwright.Page | undefined;
 try {
  const address = server.httpServer?.address();
  assert.ok(address && typeof address !== 'string');
  for (const width of [1280, 390]) {
   page = await browser.newPage({viewport: {width, height: 900}});
   const p = page, ball = p.locator('.sf-motion-ball');
   p.on('pageerror', error => errors.push(error.message));
   const legacy = JSON.stringify({side: 'right', y: .58, docked: false});
   await p.addInitScript(({key, legacy}) => localStorage.setItem(key, legacy), {key: legacyKey, legacy});
   await p.goto(`http://127.0.0.1:${address.port}/`);
   await p.waitForSelector('.sf-motion-hub[data-diamond-hub]');
   stage = `${width} interior drop`;
   await dragTo(p, ball, width / 2, 590);
   await p.mouse.up();
   const interior = await ball.boundingBox();
   assert.ok(interior);
   assert.ok(Math.abs(interior.x + interior.width * .75 - width / 2) < 3);
   assert.ok(Math.abs(interior.y + interior.height / 2 - 590) < 3);
   assert.equal(await ball.getAttribute('aria-expanded'), 'false', 'drag release must not open the menu');
   assert.equal(await p.evaluate(key => localStorage.getItem(key), legacyKey), legacy);

   stage = `${width} held edge drop`;
   await dragTo(p, ball, 2, 500);
   // Hold past the retired charge threshold, then move along the edge before release.
   await p.waitForTimeout(900);
   await p.mouse.move(2, 550, {steps: 4});
   const atEdge = await ball.boundingBox();
   assert.ok(atEdge && Math.abs(atEdge.x - 12) < 1);
   await p.mouse.up();
   const samples = await ball.evaluate(async node => {
    const result = [];
    for (let frame = 0; frame < 12; frame++) {
     await new Promise(requestAnimationFrame);
     const rect = node.getBoundingClientRect();
     result.push({x: rect.x, y: rect.y});
    }
    return result;
   });
   assert.ok(samples.every(({x, y}) => Math.abs(x - atEdge.x) < 1 && Math.abs(y - atEdge.y) < 1),
    'holding and releasing at the edge must leave the Hub at the drop position');
   const drop = await stored(p);
   assert.ok(drop);
   assert.deepEqual(JSON.parse(drop).docked, false, 'edge drop must not dock automatically');
   await p.evaluate(() => {hubPreview.stop(); hubPreview.remount()});
   const restored = await ball.boundingBox();
   assert.ok(restored && Math.abs(restored.x - atEdge.x) < 1 && Math.abs(restored.y - atEdge.y) < 1);
   assert.equal(await p.locator('.edge-aim,.rigid-spin-field,.rigid-spin-body').count(), 0);
   assert.equal(await p.locator('.sf-motion-hub .spin-prism svg').count(), 1, 'the official entry uses one prism renderer');

   for (const reason of ['escape', 'blur', 'resize', 'scene', 'hidden'] as const) {
    stage = `${width} cancel ${reason}`;
    await dragTo(p, ball, width / 2, 400);
    if (reason === 'escape') await p.keyboard.press('Escape');
    if (reason === 'blur') await p.evaluate(() => window.dispatchEvent(new Event('blur')));
    if (reason === 'resize') {
     const resized = p.evaluate(() => new Promise<void>(resolve => {
      window.addEventListener('resize', () => resolve(), {once: true});
     }));
     await p.setViewportSize({width, height: 880});
     await resized;
    }
    if (reason === 'scene') await p.evaluate(() => {hubPreview.host.invalidateScene(); hubPreview.host.sceneReady()});
    if (reason === 'hidden') await p.evaluate(() => {
     Object.defineProperty(document, 'hidden', {configurable: true, value: true});
     document.dispatchEvent(new Event('visibilitychange'));
    });
    await p.mouse.up();
    assert.equal(await stored(p), drop, `${reason} cannot commit a partial drag`);
    assert.equal(await ball.evaluate(node => node.classList.contains('is-dragging')), false);
    if (reason === 'resize') await p.setViewportSize({width, height: 900});
    if (reason === 'hidden') await p.evaluate(() => {
     Reflect.deleteProperty(document, 'hidden');
     document.dispatchEvent(new Event('visibilitychange'));
    });
   }

   stage = `${width} menu and disposal`;
   await ball.click();
   await p.locator('[data-motion-view$="native-social"]').click();
   assert.equal(await p.evaluate(() => hubPreview.counts().native), 1);
   await ball.click();
   await p.getByRole('button', {name: '停靠侧边'}).click();
   assert.equal(await ball.evaluate(node => node.classList.contains('is-docked')), true);
   await ball.click();
   assert.equal(await ball.evaluate(node => node.classList.contains('is-docked')), false);
   await dragTo(p, ball, width / 2, 400);
   await p.evaluate(() => hubPreview.dispose());
   await p.mouse.up();
   assert.equal(await p.locator('.sf-motion-hub,.spin-hub-canvas,.rigid-spin-field').count(), 0);
   rows.push({width, interior, atEdge, samples, status: 'PASS'});
   await p.close();
   page = undefined;
  }
  assert.deepEqual(errors, []);
  caseCheckpoint('entry');
  status = 'PASS';
  return rows;
 } catch (error) {
  await page?.screenshot({path: path.join(out, 'failure.png')}).catch(() => {});
  throw error;
 } finally {
  fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({status, stage, rows, errors, node: process.version, browser: browser.version()}, null, 2));
  console.log(out);
  await page?.close();
  await server.close();
 }
}

export = {verifyHubPlacement};
if (require.main === module) (async () => {
 const browser = await playwright.chromium.launch(require('./browser-options.cjs'));
 try { await verifyHubPlacement(browser); } finally { await browser.close(); }
})().catch(error => {
 require('../scripts/ci-process-receipt.cjs').terminalFailure(error);
 process.exitCode = 1;
});
