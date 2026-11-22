import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import type {Host} from '../../../framework/contracts';

type Inputs = {name: string; scripts: string[]; styles: string[]; dependencies: string[]};
const hostPath = process.argv[2];
const workspacePath = process.argv[3];
assert.ok(hostPath && workspacePath, 'Pass the 4.5.1 Host ZIP and an independent StoneFreeWorkspace ZIP');
const hostSha = '6f221a29f9a042e9c5f32b4b9be9894d6941df4bebd29a5d326a44a8377cb8b8';
const hashFile = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
assert.equal(hashFile(hostPath), hostSha);

function loadZip(path: string): Inputs {
  return JSON.parse(execFileSync('python', ['-c', `
import json, sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as archive:
    assert archive.testzip() is None
    meta = json.loads(archive.read("boot.json"))
    def text_members(key):
        return [archive.read(entry).decode("utf-8-sig") for entry in meta.get(key, [])]
    print(json.dumps(dict(name=meta["name"], scripts=text_members("scriptFileList"),
        styles=text_members("styleFileList"), dependencies=[d["modName"] for d in meta["dependenceInfo"]])))
`, path], {encoding: 'utf8', maxBuffer: 8 * 1024 * 1024}));
}
const viewPath = 'dist/host5/workspace-weather/Host5Observatory-0.1.0-prototype.mod.zip';
const providerPath = 'dist/host5/workspace-weather/Host5Atmosphere-0.1.0-prototype.mod.zip';
const inputs = [hostPath, workspacePath, providerPath, viewPath].map(loadZip);
assert.deepEqual(inputs.map(i => i.name), ['StoneFreeHost', 'StoneFreeWorkspace', 'Host5Atmosphere', 'Host5Observatory']);
assert.ok(inputs.every(i => !i.dependencies.includes('DoLGameUI')));

const browser = await chromium.launch({channel: process.env.HOST5_BROWSER || 'msedge'});
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  // Exercise the actual packaged entries on a neutral page. No game, saves or ModLoader runtime.
  await page.setContent('<!doctype html><title>Independent workspace</title>');
  for (const input of inputs) {
    for (const content of input.styles) await page.addStyleTag({content});
    for (const content of input.scripts) await page.addScriptTag({content});
  }
  await page.evaluate(() => window.DoLUiHost!.sceneReady());
  const open = page.getByRole('button', {name: '信息工作台', exact: true});
  const panel = page.getByRole('dialog', {name: '信息工作台'});
  await open.click();
  await panel.getByRole('button', {name: '雨', exact: true}).click();
  await panel.getByRole('button', {name: '雪', exact: true}).click();
  await panel.locator('[data-weather="snow"] canvas').nth(1).waitFor({state: 'visible'});
  const snapshot = () => page.evaluate(() => window.DoLUiHost!.getDiagnostics());
  await panel.getByRole('button', {name: '编辑布局', exact: true}).click();
  const direct = panel.getByRole('checkbox', {name: '天气效果', exact: true});
  await direct.uncheck();
  await page.waitForFunction(() => document.querySelectorAll('.effects-surface').length === 1);
  await panel.getByRole('button', {name: '雨', exact: true}).click();
  await panel.locator('[data-weather="rain"] canvas').waitFor({state: 'visible'});
  await direct.check();
  await panel.locator('[data-weather="rain"] canvas').nth(1).waitFor({state: 'visible'});
  await panel.getByRole('button', {name: '雪', exact: true}).click();
  const before = await snapshot();
  assert.equal(before.errors.length, 0);
  assert.ok(before.participants.includes('Host5Observatory'));
  const surfaceOwners = (diag: ReturnType<Host['getDiagnostics']>) => diag.mounts
    .map(m => m.owner).filter(id => id.startsWith('AtmosphereSurface'));
  assert.equal(surfaceOwners(before).length, 2);
  await panel.getByRole('button', {name: '关闭', exact: true}).click();
  await page.waitForFunction(() => !window.DoLUiHost!.getDiagnostics().mounts.some(m => m.owner.startsWith('AtmosphereSurface')));
  assert.ok(await open.evaluate(el => el === document.activeElement));
  await open.click();
  await panel.locator('[data-weather="snow"] canvas').nth(1).waitFor({state: 'visible'});
  const after = await snapshot();
  assert.equal(surfaceOwners(after).length, 2);
  assert.notDeepEqual(surfaceOwners(after), surfaceOwners(before));
  assert.equal(after.errors.length, 0);
  await page.evaluate(() => window.DoLUiHost!.dispose());
  assert.equal(await page.locator('[data-sf-owner]').count(), 0);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({browser: browser.version(), hostSha, workspaceSha: hashFile(workspacePath),
    providerSha: hashFile(providerPath), observatorySha: hashFile(viewPath), loaded: inputs.map(i => i.name), surfaceOwnersBefore: surfaceOwners(before),
    surfaceOwnersAfterReopen: surfaceOwners(after), hostErrors: after.errors.length}));
} finally {
  await browser.close();
}
