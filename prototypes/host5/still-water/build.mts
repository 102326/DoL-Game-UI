// Build an offline, neutral comparison from the boot entries of three actual ZIP pairs.
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {readPackage} from '../panel-budget/package-input.mts';

const [releaseHost, releaseUI, beforeHost, beforeUI, candidateHost, candidateUI, output, candidateLabel] = process.argv.slice(2);
assert.ok(releaseHost && releaseUI && beforeHost && beforeUI && candidateHost && candidateUI && output && candidateLabel,
 'Expected release Host/UI, before Host/UI, candidate Host/UI, output directory, and candidate identity');

const versions = [
 {
  label: '正式 4.5.1 · Release v4.5.1 · d643674',
  hostPath: releaseHost, uiPath: releaseUI,
  hostHash: '6f221a29f9a042e9c5f32b4b9be9894d6941df4bebd29a5d326a44a8377cb8b8',
  uiHash: '4a0479c5842b54b1086b164e87296af829b39149b952b5cac8257bb2f7d30b39'
 },
 {
  label: '5.0 改前 · 1fcbfe0',
  hostPath: beforeHost, uiPath: beforeUI,
  hostHash: '1070dba995d3e2638824257f4c8283e017e9438baf53c674348f184130d76138',
  uiHash: '0e5e651c2b071eef8bd3daddf25e88dedece49c94ffcc265b5160d24efd09aed'
 },
 {label: `5.0 新候选 · ${candidateLabel}`, hostPath: candidateHost, uiPath: candidateUI}
];

const fixture = await readFile(new URL('./fixture.html', import.meta.url), 'utf8');
const setup = await readFile(new URL('./fixture.js', import.meta.url), 'utf8');
const css = await readFile(new URL('./css.css', import.meta.url), 'utf8');
const index = await readFile(new URL('./index.html', import.meta.url), 'utf8');
const script = (content: string) => '<script>' + content.replace(/<\/script/gi, '<\\/script') + '</script>';
const manifests: {label: string; host: string; ui: string}[] = [];
await mkdir(output, {recursive: true});

for (const [i, version] of versions.entries()) {
 const host = readPackage(version.hostPath, 'StoneFreeHost');
 const ui = readPackage(version.uiPath, 'DoLGameUI');
 if (version.hostHash) {
  assert.deepEqual([host.sha, ui.sha], [version.hostHash, version.uiHash], `${version.label}: ZIP digest mismatch`);
 }
 manifests.push({label: version.label, host: host.sha, ui: ui.sha});
 const html = [
  '<!doctype html><html lang="zh-CN" data-stone-free><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1"><title>中性页面</title>',
  '<style>', css, '</style>',
  ...host.styles.map(content => '<style>' + content + '</style>'),
  ...ui.styles.map(content => '<style>' + content + '</style>'),
  '<body>', fixture, script(setup),
  ...host.scripts.map(script), script('window.DoLUiHost.sceneReady()'),
  ...ui.scripts.map(script), '</body></html>'
 ].join('');
 await writeFile(`${output}/${i}.html`, html);
}
const data = JSON.stringify(manifests).replace(/</g, '\\u003c');
await writeFile(`${output}/index.html`, index.replace('__MANIFEST__', data));
console.log(JSON.stringify(manifests, null, 2));
