// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import path = require('node:path');
import vm = require('node:vm');
import assert = require('node:assert/strict');
import esbuild = require('esbuild');
import type {MouthLayers} from '../compat/mouth-compat-051213/mouth-compat.ts';
const {buildSync}=esbuild;
const source=buildSync({entryPoints:[path.resolve(__dirname,'../compat/mouth-compat-051213/mouth-compat.ts')],bundle:true,write:false,format:'iife',target:'es2022'}).outputFiles[0]?.text ?? assert.fail('missing adapter output');
function load(lyra='0.5.12.13-1.0.1a-1004.1-goose-ucb',maple='5.2.3',hasApi=true){
 const calls:{layers:MouthLayers;model:'main'}[]=[],messages:unknown[]=[],V={facevariant:'sweet'},T={},live={layers:{mouth:{srcfn:()=> 'native'}}};
 const window={V,T,Renderer:{model:live},modUtils:{getMod:(name:string)=>({version:name==='Lyra'?lyra:maple})},
  maplebirch:hasApi?{char:{use:(layers:MouthLayers,model:'main')=>calls.push({layers,model})}}:{}};
 const before=JSON.stringify({V,T});
 vm.runInNewContext(source,{window,console:{info:(m:unknown)=>messages.push(m),warn:(m:unknown)=>messages.push(m),error:(m:unknown)=>messages.push(m)}});
 assert.equal(JSON.stringify({V,T}),before);assert.equal(live.layers.mouth.srcfn(),'native');
 assert.equal(Reflect.get(window,'DoLGameUI'),undefined,'mouth package works without UI');
 return {calls,messages};
}
const {calls}=load();assert.equal(calls.length,1);const applied=calls[0];assert.ok(applied);assert.equal(applied.model,'main');
assert.deepEqual(Object.keys(applied.layers),['mouth']);assert.deepEqual(Object.keys(applied.layers.mouth),['srcfn']);
const resolve=applied.layers.mouth.srcfn;
assert.equal(resolve({facestyle:'default',facevariant:'sweet',mouth:'smile'}),'img/face/default/sweet/mouth-smile.png');
assert.equal(resolve({facestyle:'default',facevariant:'modded24',mouth:'cry'}),'img/face/default/modded24/mouth-cry.png');
assert.equal(resolve({facestyle:'default',facevariant:'unknown',mouth:'smile'}),'img/face/default/mouth-smile.png');
assert.equal(resolve({facestyle:'alternate',facevariant:'sweet',mouth:'smile'}),'img/face/alternate/mouth-smile.png');
assert.equal(resolve({facestyle:'default',facevariant:'sweet',mouth:'none'}),'img/face/default/mouth-none.png');
const rejected:readonly [string?,string?,boolean?][]=[['unknown'],[undefined,'unknown'],[undefined,undefined,false]];
for(const args of rejected){
 const out=load(...args);assert.equal(out.calls.length,0);assert.equal(out.messages.length,1);
}
assert.doesNotThrow(()=>vm.runInNewContext(source,{window:{},console:{warn(){}}}));
for(const version of ['5.2.3','5.4.2','5.4.3','5.5.0','5.9.0+build.1'])assert.equal(load(undefined,version).calls.length,1,version);
for(const version of ['5.2.2','6.0.0','5.4.3-beta.1','unknown'])assert.equal(load(undefined,version).calls.length,0,version);
console.log('PASS main mouth adapter: published 0.1.2 minimum/range gate, missing API, resource fallback, main-only layer patch and no UI/game-state dependency');
