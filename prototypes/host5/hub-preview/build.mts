// Produce a standalone neutral page from the boot files in the supplied player ZIPs.
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {readPackage} from '../panel-budget/package-input.mts';

const [hostPath, uiPath, output, identity = '本地候选'] = process.argv.slice(2);
assert.ok(hostPath && uiPath && output, 'Pass Host ZIP, UI ZIP and output HTML');
const host = readPackage(hostPath, 'StoneFreeHost');
const ui = readPackage(uiPath, 'DoLGameUI');
const template = await readFile(new URL('./index.html', import.meta.url), 'utf8');
const fixture = await readFile(new URL('./fixture.html', import.meta.url), 'utf8');
const script = (content: string) => '<script>' + content.replace(/<\/script/gi, '<\\/script') + '</script>';
const document = fixture
 .replace('<!--package-styles-->', () => [...host.styles, ...ui.styles].map(css => '<style>' + css + '</style>').join(''))
 .replace('<!--boot-->', () => [...host.scripts, 'window.DoLUiHost.sceneReady()', ...ui.scripts].map(script).join(''));
await writeFile(output, template
 .replace('__IDENTITY__', () => identity.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'))
 .replace('__PAIR__', () => host.sha + ' / ' + ui.sha)
 .replace('__FIXTURE__', () => JSON.stringify(document).replace(/</g, '\\u003c')));
console.log({host: host.sha, ui: ui.sha, output});
