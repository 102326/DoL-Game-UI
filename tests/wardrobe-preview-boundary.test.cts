// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import vm = require('node:vm');
import path = require('node:path');
import esbuild = require('esbuild');
import type {Snapshot} from '../src/wardrobe/data';
const output=esbuild.buildSync({entryPoints:[path.resolve('src/wardrobe/render.ts')],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0];assert.ok(output);
const compiled:{exports:unknown}={exports:{}};
vm.runInNewContext(output.text,{module:compiled,exports:compiled.exports,performance,structuredClone});
function exportsOf(value:unknown):value is Pick<typeof import('../src/wardrobe/render'),'prepareOutfit'>{return !!value&&typeof value==='object'&&'prepareOutfit' in value&&typeof value.prepareOutfit==='function'}
assert.ok(exportsOf(compiled.exports));const {prepareOutfit}=compiled.exports;
const root={Renderer:{composeLayers(){},lintRgbStaged(){return {toHexString:()=>''}},mergeLayerData:{},emptyLayerFilter:{}},Skin:{color:{},tanningLayers:{}}};
for(const colours of [undefined,null,{},[],{skin_options:null},{skin_options:[]}]){
 const snapshot:Snapshot={variables:{location:'home',worn:{},wardrobe:{}},setup:{clothes:{},...(colours!==undefined?{colours}:{})},location:'wardrobe',inventory:{},worn:{}};
 const before=JSON.stringify(snapshot);
 assert.throws(()=>prepareOutfit(root,snapshot,{},[]),/肤色定义不可用/);
 assert.equal(JSON.stringify(snapshot),before,'invalid preview definitions do not write native state');
}
console.log('PASS missing/malformed skin definitions reject before private model compilation and retain native data');
