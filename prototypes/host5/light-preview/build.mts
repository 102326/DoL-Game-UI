// Keep the actual shop, settings, Hub and owned styles together inside one offline document.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {readPackage} from '../panel-budget/package-input.mts';

const [hostZip,uiZip,destination]=process.argv.slice(2);
assert.ok(hostZip && uiZip && destination,'Pass Host.zip, UI.zip and output.html');
const get=(name:string)=>readFile(new URL(name,import.meta.url),'utf8');
const [index,fixture,neutralCss,shopScript,controls]=await Promise.all([
 get('index.html'),get('../still-water/fixture.html'),get('../still-water/css.css'),
 get('../still-water/fixture.js'),get('controls.js')
]);
const host=readPackage(hostZip,'StoneFreeHost'),ui=readPackage(uiZip,'DoLGameUI');
const tag=(js:string)=>'<script>'+js.replace(/<\/script/gi,'<\\/script')+'</script>';
const content=[
 '<!doctype html><html lang="zh-CN" data-stone-free><meta charset="utf-8">',
 '<meta name="viewport" content="width=device-width,initial-scale=1"><title>中性阅读与商店</title>',
 ...[neutralCss,...host.styles,...ui.styles].map(css=>'<style>'+css+'</style>'),
 '<body>',fixture,tag(shopScript),...host.scripts.map(tag),tag('window.DoLUiHost.sceneReady()'),...ui.scripts.map(tag),tag(controls),'</body></html>'
].join('');
await writeFile(destination,index.replace('__PAIR__',host.sha+' / '+ui.sha)
 .replace('__FIXTURE__',()=>JSON.stringify(content).replace(/</g,'\\u003c')));
