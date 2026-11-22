import {build} from 'esbuild';
import type {Page} from 'playwright';
import assert from 'node:assert/strict';
import type {Host} from '../../../framework/contracts';
import type {createSidebar} from './sidebar';

type GameState = {passage?: string; variables?: {CE_SFflag?: unknown; CE_sideBarIconEnable?: unknown; CE_Toggle?: unknown}};
type GameWindow = Window & {SugarCube?: {State?: GameState}; State?: GameState;
 modUtils?: {getMod(name: string): {bootJson?: {version?: string}} | undefined}; closeOverlay?: () => void;
 __sidebarOriginal?: Element | null; __sidebarBar?: Element | null; __ceOriginal?: Element | null;
 __realSidebarCheck?: {host: Readonly<Host>; sidebar: ReturnType<typeof createSidebar>; cleanup(): void}};


/** Use only the caller's already-loaded game and existing release Host. */
export async function checkRealSidebar(page: Page, links: [] | [string, string]) {
 const prereq = await page.evaluate(() => {
  const w = window as GameWindow, v = w.SugarCube?.State?.variables ?? w.State?.variables;
  let version: string | undefined; try {version = w.modUtils?.getMod('cheat extended')?.bootJson?.version} catch {}
  return {version, flag:v?.CE_SFflag,
   iconEnabled:v?.CE_sideBarIconEnable, icons:document.querySelectorAll('#story-caption .CE_sideBarIconBtn').length,
   bars:document.querySelectorAll('#ui-bar').length, stow:document.querySelectorAll('#ui-bar-toggle').length,
   host:!!w.DoLUiHost, passage:w.SugarCube?.State?.passage ?? w.State?.passage};
 });
 if (!prereq.host || prereq.bars !== 1 || prereq.stow !== 1 || !prereq.passage)
  throw Error(`Real Host/sidebar prerequisites missing: ${JSON.stringify(prereq)}`);
 if (await page.locator('#customOverlay:not(.hidden)').isVisible().catch(() => false)) throw Error('Close the existing overlay before starting');
 const bundle = await build({stdin:{contents:`import {createSidebar} from './prototypes/host5/sidebar/sidebar';
 const host = window.DoLUiHost; if (!host) throw Error('Installed Host missing');
 if (window.__realSidebarCheck) throw Error('Check already attached');
 const sidebar = createSidebar(host, 'RealSidebarCheck', document);
 window.__realSidebarCheck = {host, sidebar, cleanup() {sidebar.dispose(); delete window.__realSidebarCheck}};`,
  resolveDir:process.cwd(), loader:'ts'}, bundle:true, write:false, format:'iife'});
 const scenes: string[] = [prereq.passage];
 const initialStowed = await page.locator('#ui-bar').evaluate(el => el.classList.contains('stowed'));
 let attached = false, captured = false, overlayOpened = false;
 let ceMenu = false, ceStatebox = false;
 let ceInitial: number | undefined;
 try {
  if (initialStowed) await page.locator('#ui-bar-toggle').click();
  const stateButton = page.locator('#ui-bar .CE-statebox-toggle-btn');
  const hasStateButton = prereq.version === '1.20.4' && await stateButton.count() === 1 && await stateButton.isVisible();
  if (hasStateButton) {
   ceInitial = await page.evaluate(() => {const w = window as GameWindow; const v = w.SugarCube?.State?.variables ?? w.State?.variables; return typeof v?.CE_Toggle === 'number' ? v.CE_Toggle : undefined});
   assert.ok(ceInitial === 0 || ceInitial === 1, 'CE toggle must have a numeric 0/1 state');
   await stateButton.focus();
  } else await page.locator('#ui-bar-toggle').focus();
  await page.evaluate(() => {const w = window as GameWindow; if (w.__realSidebarCheck || w.__sidebarOriginal || w.__sidebarBar || w.__ceOriginal) throw Error('Check already attached'); w.__sidebarOriginal = document.querySelector('#ui-bar-toggle'); w.__sidebarBar = document.querySelector('#ui-bar'); w.__ceOriginal = document.querySelector('#ui-bar .CE-statebox-toggle-btn')}); captured = true;
  await page.addScriptTag({content:bundle.outputFiles[0]!.text}); attached = true;
  assert.equal(await page.evaluate(() => (window as GameWindow).__realSidebarCheck!.sidebar.setEnabled(true)), true, 'sidebar attach');
  assert.deepEqual(await page.evaluate((hasStateButton) => ({same:document.querySelector('#ui-bar-toggle') === (window as GameWindow).__sidebarOriginal,
   focused:document.activeElement === (hasStateButton ? (window as GameWindow).__ceOriginal : (window as GameWindow).__sidebarOriginal), ceSame: !hasStateButton || document.querySelector('#ui-bar .CE-statebox-toggle-btn') === (window as GameWindow).__ceOriginal, owned:!!document.querySelector('#ui-bar[data-host5-sidebar="RealSidebarCheck"]')}), hasStateButton),
   {same:true, focused:true, ceSame:true, owned:true}, 'ownership and focus on attach');
  await page.locator('#ui-bar-toggle').click();
  assert.equal(await page.locator('#ui-bar').evaluate(el => el.classList.contains('stowed')), true, 'native stow');
  await page.locator('#ui-bar-toggle').click();
  assert.equal(await page.locator('#ui-bar').evaluate(el => el.classList.contains('stowed')), false, 'native unstow');
  for (const selector of links) {
   const link = page.locator(selector);
   assert.equal(await link.count(), 1, `passage link must be unique: ${selector}`);
   assert.equal(await link.evaluate(el => el.matches('a.link-internal, button.link-internal')), true, `not an ordinary game passage link: ${selector}`);
   const previous = await page.evaluate(() => (window as GameWindow).SugarCube?.State?.passage ?? (window as GameWindow).State?.passage);
   await link.click();
   await page.waitForFunction(old => ((window as GameWindow).SugarCube?.State?.passage ?? (window as GameWindow).State?.passage) !== old, previous);
   const scene = await page.evaluate(() => (window as GameWindow).SugarCube?.State?.passage ?? (window as GameWindow).State?.passage);
   assert.ok(scene, 'passage name available'); scenes.push(scene);
   assert.deepEqual(await page.evaluate(() => {const w = window as GameWindow; return {
    bar:document.querySelector('#ui-bar') === w.__sidebarBar,
    toggle:document.querySelector('#ui-bar-toggle') === w.__sidebarOriginal,
    owned:!!document.querySelector('#ui-bar[data-host5-sidebar="RealSidebarCheck"]')};}),
    {bar:true, toggle:true, owned:true}, 'original sidebar and toggle survive passage');
  }
  if (hasStateButton) {
   const readToggle = () => page.evaluate(() => {const w = window as GameWindow; return (w.SugarCube?.State?.variables ?? w.State?.variables)?.CE_Toggle});
   await stateButton.click();
   assert.equal(await readToggle(), ceInitial === 0 ? 1 : 0, 'CE real button flips state');
   await stateButton.click();
   assert.equal(await readToggle(), ceInitial, 'CE real button restores state');
   ceStatebox = true;
  }
  const ce = await page.evaluate(() => {const w = window as GameWindow, v = w.SugarCube?.State?.variables ?? w.State?.variables;
   let version: string | undefined; try {version = w.modUtils?.getMod('cheat extended')?.bootJson?.version} catch {}
   return {version, flag:v?.CE_SFflag, iconEnabled:v?.CE_sideBarIconEnable,
    icons:document.querySelectorAll('#story-caption .CE_sideBarIconBtn').length}});
  if (ce.version === '1.20.4' && ce.flag === true && ce.iconEnabled === true && ce.icons === 1) {
   await page.locator('#story-caption .CE_sideBarIconBtn').click(); overlayOpened = true;
   await page.locator('#customOverlay[data-overlay="CEcheatMenu"] #CE_settingsDiv').waitFor({state:'visible'}); ceMenu = true;
   await page.evaluate(() => {const w = window as GameWindow; if (typeof w.closeOverlay !== 'function') throw Error('Native closeOverlay unavailable'); w.closeOverlay()}); overlayOpened = false;
   await page.locator('#customOverlay').waitFor({state:'hidden'});
  }
  const rollbackTarget = ceStatebox ? stateButton : page.locator('#ui-bar-toggle');
  await rollbackTarget.focus();
  await page.evaluate((useCE) => {const w = window as GameWindow; w.__ceOriginal = useCE ? document.querySelector('#ui-bar .CE-statebox-toggle-btn') : null}, ceStatebox);
  await page.evaluate(() => {(window as GameWindow).__sidebarOriginal = document.querySelector('#ui-bar-toggle'); (window as GameWindow).__realSidebarCheck!.sidebar.setEnabled(false)});
  assert.deepEqual(await page.evaluate((useCE) => ({same:document.querySelector('#ui-bar-toggle') === (window as GameWindow).__sidebarOriginal,
   focused:document.activeElement === (useCE ? (window as GameWindow).__ceOriginal : (window as GameWindow).__sidebarOriginal),
   ceSame:!useCE || document.querySelector('#ui-bar .CE-statebox-toggle-btn') === (window as GameWindow).__ceOriginal, marker:!!document.querySelector('#ui-bar[data-host5-sidebar]'),
   ownClaims:(window as GameWindow).__realSidebarCheck!.host.getDiagnostics().claims.filter((x) => x.owner === 'RealSidebarCheck').length,
   ownMounts:(window as GameWindow).__realSidebarCheck!.host.getDiagnostics().mounts.filter((x) => x.owner === 'RealSidebarCheck').length}), ceStatebox),
   {same:true, focused:true, ceSame:true, marker:false, ownClaims:0, ownMounts:0}, 'rollback preserves native node and focus');
  return {initialPassage:prereq.passage, finalPassage:await page.evaluate(() => (window as GameWindow).SugarCube?.State?.passage ?? (window as GameWindow).State?.passage), transitions:links.length, scenes, ceMenu, ceStatebox, ce};
 } finally {
  try {
  if (ceInitial !== undefined) {
   const current = await page.evaluate(() => {const w = window as GameWindow; return (w.SugarCube?.State?.variables ?? w.State?.variables)?.CE_Toggle});
   if (current !== ceInitial) {
    await page.locator('#ui-bar .CE-statebox-toggle-btn').click();
    const restored = await page.evaluate(() => {const w = window as GameWindow; return (w.SugarCube?.State?.variables ?? w.State?.variables)?.CE_Toggle});
    assert.equal(restored, ceInitial, 'CE state restored during cleanup');
   }
  }
  if (overlayOpened) await page.evaluate(() => {const w = window as GameWindow; if (typeof w.closeOverlay !== 'function') throw Error('Native closeOverlay unavailable during cleanup'); w.closeOverlay()});
  } finally {
  if (attached) await page.evaluate(() => (window as GameWindow).__realSidebarCheck?.cleanup());
  if (captured) await page.evaluate(() => {const w = window as GameWindow; delete w.__sidebarOriginal; delete w.__sidebarBar; delete w.__ceOriginal});
  const stowed = await page.locator('#ui-bar').evaluate(el => el.classList.contains('stowed')).catch(() => initialStowed);
  if (stowed !== initialStowed) await page.locator('#ui-bar-toggle').click();
  }
 }
}
