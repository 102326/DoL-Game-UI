import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {readPackage} from '../panel-budget/package-input.mts';

const [hostPath,uiPath,output]=process.argv.slice(2);
assert.ok(hostPath && uiPath && output,'Expected Host ZIP, UI ZIP, and a new output HTML path');
const host=readPackage(hostPath,'StoneFreeHost'), ui=readPackage(uiPath,'DoLGameUI');
const script=(js:string)=>'<script>'+js.replace(/<\/script/gi,'<\\/script')+'</script>';
const styles=[...host.styles,...ui.styles].map(css=>'<style>'+css+'</style>');
const html=['<!doctype html><html lang="zh-CN" data-stone-free><meta charset="utf-8">',
 '<meta name="viewport" content="width=device-width,initial-scale=1"><title>SoftWet TTF QA</title>',
 ...styles,'<body><div id="ui-bar"><div id="overlayButtons"></div></div>',
 ...host.scripts.map(script),script('window.DoLUiHost.sceneReady()'),...ui.scripts.map(script),'</body></html>'];
await writeFile(output,html.join(''),{flag:'wx'});
console.log('Host',host.sha,'UI',ui.sha);
