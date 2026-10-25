// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import vm = require('node:vm');
import esbuild = require('esbuild');
import renderer = require('../scripts/render-state-fields.cjs');
const {buildSync}=esbuild;
const {fields}=renderer;
const source=fs.readFileSync(path.join(__dirname,'../src/wardrobe/vendor/isolated-model.js'),'utf8');
assert.ok(fields(source).includes('leftarm'));assert.ok(fields(source).includes('modeloptionsOverride'));
for(const use of ['consume(V)','Object.keys(V)','V[key]','const alias=V','const {skin}=V'])assert.throws(()=>fields(use),/Unreviewed/);
assert.throws(()=>fields('armPosition(side)'),/Unreviewed/);
const code=buildSync({entryPoints:[path.join(__dirname,'../src/wardrobe/render-state.ts')],bundle:true,write:false,format:'cjs'}).outputFiles[0]?.text ?? assert.fail('missing compiled output');
const m:{exports:unknown}={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,structuredClone});
function checkedExports(value:unknown):value is Pick<typeof import('../src/wardrobe/render-state.ts'),'copyRenderState'> {return !!value&&typeof value==='object'&&'copyRenderState' in value&&typeof value.copyRenderState==='function';}
assert.ok(checkedExports(m.exports));

const {copyRenderState}=m.exports,shared:{nested:number[];self?:unknown}={nested:[1,2]},original={skin:shared,player:shared,wardrobe:{large:['unrelated']},modeloptionsOverride:{unknownModField:{a:1}}};
shared.self=shared;
const result=copyRenderState(original);assert.ok(result.skin&&result.modeloptionsOverride);
assert.equal(result.skin,result.player);assert.equal(result.skin.self,result.skin);assert.equal('wardrobe' in result,false);
result.skin.nested.push(3);result.modeloptionsOverride.unknownModField.a=2;
assert.equal(original.skin.nested.length,2);assert.equal(original.modeloptionsOverride.unknownModField.a,1);
assert.ok(copyRenderState(original,true).wardrobe);
console.log('PASS renderer state boundary, aliases, cycles, nested mod fields, isolation and full-copy fallback');
