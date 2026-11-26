import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import type {createHost} from '../../../framework/host';
import type {createSidebar} from './sidebar';

type FixtureMacro = {handler(this: {output: Element}): void};
declare global {
 interface Window {
  api: {createHost: typeof createHost; createSidebar: typeof createSidebar};
  handlers: Record<string, FixtureMacro>;
  Macro: {add(name: string, definition: FixtureMacro): void};
  V: {CE_Toggle?: number};
  setup: {CE_features: {isEnabled(name: string): boolean}};
  $: (() => {wiki(): void}) & {wiki(): void};
 }
}

const [gamePath, zipPath, originalPath] = process.argv.slice(2);
if (!gamePath || !zipPath || !originalPath) throw Error('Usage: node prototypes/host5/sidebar/sidebar.test.mjs <fixed-game-html> <published-rebuild-zip> <original-ce-zip>');
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const game = await readFile(gamePath), zip = await readFile(zipPath);
assert.equal(sha(game), '9ecc02d91e481054bed564a4fe1975dd5c2e38edc051e9fac350ae5bebe282a5');
assert.equal(sha(zip), '92db93acb221731334d72ef0922adf5c5f777550f621f09cc51b609236b91e89');
assert.equal(sha(await readFile(originalPath)), '980ba672661b0171923343dd03a242670fd3553208438355b5270e101ab8e134');
const positive = execFileSync('python', ['-c', `
import sys,zipfile,json,re,html,hashlib
z=zipfile.ZipFile(sys.argv[2]); boot=json.loads(z.read('boot.json'))
def walk(v):
 if isinstance(v,dict):
  if v.get('passage')=='StoryCaption' and 'findString' in v: yield v
  for x in v.values(): yield from walk(x)
 elif isinstance(v,list):
  for x in v: yield from walk(x)
rules=list(walk(boot)); assert len(rules)==1
rule=rules[0]; replacement=z.read(rule['replaceFile']); assert hashlib.sha256(replacement).hexdigest()=='ab96097398f8ef33970f008d4273adec0ca91eae2ddd1603fce2f2d72e4d071c'
s=open(sys.argv[1],encoding='utf8').read(); match=re.search(r'<tw-passagedata[^>]*name="StoryCaption"[^>]*>(.*?)</tw-passagedata>',s,re.S); assert match
caption=html.unescape(match.group(1)); needle=rule['findString']; assert caption.count(needle)==1
patched=caption.replace(needle,replacement.decode('utf8'),1); assert patched.count('<<CE_sideBarIcon>>')==1 and patched.count(needle)==1
print('PASS original CE unique pre-render replacement')
`, gamePath, originalPath], {encoding:'utf8'});
assert.match(positive, /PASS original CE unique pre-render replacement/);
const script = execFileSync('python', ['-c', 'import sys,zipfile;sys.stdout.buffer.write(zipfile.ZipFile(sys.argv[1]).read("scripts/CE_sideBarIcon.js"))', zipPath]);
assert.equal(sha(script), '857598d06c16d730969fd1ebb9c9cdbb1328e8413f1e13b87c65f5ec6e9f32fc');
const bundle = await build({stdin:{contents:`import {createHost} from './framework/host'; import {createSidebar} from './prototypes/host5/sidebar/sidebar'; window.api={createHost,createSidebar};`, resolveDir:process.cwd(), loader:'ts'}, bundle:true, write:false, format:'iife'});
const browser = await chromium.launch({channel:'msedge', headless:true});
try {
 const page = await browser.newPage();
 await page.setContent('<div id="ui-bar"><button id="ui-bar-toggle">Toggle</button><div id="ui-bar-body"><div id="story-caption"><div id="storyCaptionContent"><div id="overlayButtons"><button id="native">Native</button></div><div id="macro-output"></div></div></div></div></div><main id="story">Story</main>');
 await page.addScriptTag({content:bundle.outputFiles![0]!.text});
 await page.evaluate(() => {
  window.handlers = {}; window.Macro = {add(name, definition) {window.handlers[name] = definition}};
  window.V = {}; window.setup = {CE_features:{isEnabled:() => true}};
  window.$ = Object.assign(() => ({wiki() {}}), {wiki() {}});
 });
 await page.addScriptTag({content:script.toString('utf8')});
 const result = await page.evaluate(async () => {
  let renders = 0, nativeClicks = 0;
  const bar = document.querySelector<HTMLElement>('#ui-bar')!, output = document.querySelector<HTMLElement>('#macro-output')!, native = document.querySelector<HTMLButtonElement>('#native')!;
  native.addEventListener('click', () => nativeClicks++);
  const render = () => {renders++; window.handlers.CEstatebox!.handler.call({output})};
  render();
  const button = output.querySelector<HTMLButtonElement>('.CE-statebox-toggle-btn')!;
  button.focus(); button.click(); const before = window.V.CE_Toggle;
  // CE's own click replaces its toggle button; retain its current live identity after that dispatch.
  const live = output.querySelector<HTMLButtonElement>('.CE-statebox-toggle-btn')!; live.focus();
  const host = window.api.createHost(window), sidebar = window.api.createSidebar(host, 'SidebarTest', document);
  const defaultOff = !bar.hasAttribute('data-host5-sidebar');
  const overlay = document.querySelector<HTMLElement>('#overlayButtons')!;
  const beforeGrid = getComputedStyle(overlay).display;
  const on = sidebar.setEnabled(true);
  const duringGrid = getComputedStyle(overlay).display;
  const identity = output.querySelector('.CE-statebox-toggle-btn') === live && document.activeElement === live;
  live.click(); native.click(); const during = window.V.CE_Toggle;
  const current = output.querySelector<HTMLButtonElement>('.CE-statebox-toggle-btn')!; current.focus();
  sidebar.setEnabled(false);
  const afterGrid = getComputedStyle(overlay).display;
  const offIdentity = output.querySelector('.CE-statebox-toggle-btn') === current && document.activeElement === current;
  current.click(); const after = window.V.CE_Toggle;
  const cleanup = !bar.hasAttribute('data-host5-sidebar') && host.getDiagnostics().claims.length === 0 && host.getDiagnostics().mounts.length === 0;
  sidebar.dispose(); const stale = !sidebar.setEnabled(true);
  host.dispose();
  return {defaultOff,on,identity,offIdentity,before,during,after,renders,nativeClicks,cleanup,stale,beforeGrid,duringGrid,afterGrid};
 });
 assert.deepEqual(result, {defaultOff:true,on:true,identity:true,offIdentity:true,before:1,during:0,after:1,renders:1,nativeClicks:1,cleanup:true,stale:true,beforeGrid:'block',duringGrid:'grid',afterGrid:'block'});
 const lifecycle = await page.evaluate(async () => {
  const host = window.api.createHost(window), first = window.api.createSidebar(host, 'First', document), second = window.api.createSidebar(host, 'Second', document);
  const other = host.register('Duplicate'), duplicate = window.api.createSidebar(host, 'Duplicate', document);
  const duplicateFallback = !duplicate.setEnabled(true) && host.getDiagnostics().participants.includes('Duplicate');
  duplicate.dispose();
  const otherKept = host.getDiagnostics().participants.includes('Duplicate'); other.dispose();
  const firstOn = first.setEnabled(true), conflict = !second.setEnabled(true);
  const original = document.querySelector<HTMLElement>('#ui-bar')!, replacement = original.cloneNode(true) as HTMLElement;
  replacement.removeAttribute('data-host5-sidebar'); original.replaceWith(replacement);
  await new Promise(resolve => setTimeout(resolve, 0));
  const rebound = !original.hasAttribute('data-host5-sidebar') && replacement.hasAttribute('data-host5-sidebar');
  replacement.querySelector('#ui-bar-toggle')!.remove(); host.invalidateScene(); host.sceneReady();
  const fallback = !replacement.hasAttribute('data-host5-sidebar');
  first.dispose();
  const released = host.getDiagnostics().claims.length === 0 && !first.setEnabled(true);
  second.dispose(); host.dispose();
  return {firstOn,conflict,rebound,fallback,released,duplicateFallback,otherKept};
 });
 assert.deepEqual(lifecycle, {firstOn:true,conflict:true,rebound:true,fallback:true,released:true,duplicateFallback:true,otherKept:true});
 const server = await createServer({configFile:false, server:{host:'127.0.0.1', port:0}});
 try {
  await server.listen();
  const address = server.httpServer!.address();
  if (!address || typeof address === 'string') throw Error('Missing demo server port');
  await page.goto(`http://127.0.0.1:${address.port}/prototypes/host5/sidebar/`);
  await page.locator('#enable').click();
  assert.equal(await page.locator('#status').textContent(), 'Layout enabled');
  await page.locator('#mod').click();
  await page.locator('#disable').click();
  assert.equal(await page.locator('#mod').textContent(), 'Simulated Mod (1)');
  assert.equal(await page.locator('#status').textContent(), 'Native layout');
 } finally {await server.close()}
 console.log('PASS hash-verified published CE handler in neutral DOM: one render, one native dispatch, CE state and live focus/identity through Host takeover and rollback');
} finally {await browser.close()}
