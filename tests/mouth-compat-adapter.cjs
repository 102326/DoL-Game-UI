const path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const source=buildSync({entryPoints:[path.resolve(__dirname,'../compat/mouth-compat-051213/mouth-compat.ts')],bundle:true,write:false,format:'iife',target:'es2022'}).outputFiles[0].text;
function load(lyra='0.5.12.13-1.0.1a-1004.1-goose-ucb',maple='5.2.3',hasApi=true){
 const calls=[],messages=[],V={facevariant:'sweet'},T={},live={layers:{mouth:{srcfn:()=> 'native'}}};
 const window={V,T,Renderer:{model:live},modUtils:{getMod:name=>({version:name==='Lyra'?lyra:maple})},
  maplebirch:hasApi?{char:{use:(layers,model)=>calls.push({layers,model})}}:{}};
 const before=JSON.stringify({V,T});
 vm.runInNewContext(source,{window,console:{info:m=>messages.push(m),warn:m=>messages.push(m),error:m=>messages.push(m)}});
 assert.equal(JSON.stringify({V,T}),before);assert.equal(live.layers.mouth.srcfn(),'native');
 assert.equal(window.DoLGameUI,undefined,'mouth package works without UI');
 return {calls,messages};
}
const {calls}=load();assert.equal(calls.length,1);assert.equal(calls[0].model,'main');
assert.deepEqual(Object.keys(calls[0].layers),['mouth']);assert.deepEqual(Object.keys(calls[0].layers.mouth),['srcfn']);
const resolve=calls[0].layers.mouth.srcfn;
assert.equal(resolve({facestyle:'default',facevariant:'sweet',mouth:'smile'}),'img/face/default/sweet/mouth-smile.png');
assert.equal(resolve({facestyle:'default',facevariant:'modded24',mouth:'cry'}),'img/face/default/modded24/mouth-cry.png');
assert.equal(resolve({facestyle:'default',facevariant:'unknown',mouth:'smile'}),'img/face/default/mouth-smile.png');
assert.equal(resolve({facestyle:'alternate',facevariant:'sweet',mouth:'smile'}),'img/face/alternate/mouth-smile.png');
assert.equal(resolve({facestyle:'default',facevariant:'sweet',mouth:'none'}),'img/face/default/mouth-none.png');
for(const args of [['unknown'],[undefined,'unknown'],[undefined,undefined,false]]){
 const out=load(...args);assert.equal(out.calls.length,0);assert.equal(out.messages.length,1);
}
assert.doesNotThrow(()=>vm.runInNewContext(source,{window:{},console:{warn(){}}}));
console.log('PASS main mouth adapter: exact versions, missing API, resource fallback, main-only layer patch and no UI/game-state dependency');
