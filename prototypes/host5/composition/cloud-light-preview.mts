// Generate a self-contained reviewer page from the boot members of the candidate pair.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {readPackage} from '../panel-budget/package-input.mts';

const [hostZip,uiZip,output]=process.argv.slice(2);
assert.ok(hostZip && uiZip && output,'Pass Host ZIP, UI ZIP, and output HTML');
const host=readPackage(hostZip,'StoneFreeHost'),ui=readPackage(uiZip,'DoLGameUI');
const template=await readFile(new URL('./cloud-light-preview.html',import.meta.url),'utf8');
const fixture=await readFile(new URL('./cloud-light-fixture.html',import.meta.url),'utf8');
const script=(code:string)=>'<script>'+code.replace(/<\/script/gi,'<\\/script')+'</script>';
const document=fixture.replace('<!--package-styles-->',()=>[...host.styles,...ui.styles].map(css=>'<style>'+css+'</style>').join(''))
 .replace('<!--boot-->',()=>[...host.scripts,'window.DoLUiHost.sceneReady()',...ui.scripts].map(script).join(''));
await writeFile(output,template.replace('__PAIR__',()=>host.sha+' / '+ui.sha)
 .replace('__FIXTURE__',()=>JSON.stringify(document).replace(/</g,'\\u003c')));
