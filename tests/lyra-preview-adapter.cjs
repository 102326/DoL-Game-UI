const path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const source=buildSync({entryPoints:[path.resolve(__dirname,'../compat/lyra-wardrobe-mouth-soft-wet/lyra-wardrobe-mouth.ts')],bundle:true,write:false,format:'iife',target:'es2022'}).outputFiles[0].text;
const target=new EventTarget();let version='0.5.11.9-1.0.0a-0815-goose-ucb',registrations=0;
const liveModel={layers:{mouth:{srcfn:()=> 'live-mouth'}}},V={facevariant:'sweet'},T={};
const root={modUtils:{getMod:()=>({version})},Renderer:{model:liveModel},V,T,
 addEventListener(...args){registrations++;target.addEventListener(...args)},removeEventListener(...args){target.removeEventListener(...args)}};
const context=vm.createContext({window:root});vm.runInContext(source,context);vm.runInContext(source,context);assert.equal(registrations,1);
function prepare(){const original=()=> 'native-mouth';const model={layers:{mouth:{srcfn:original}}};const options={};target.dispatchEvent(new CustomEvent('dol-ui-outfit-prepared',{detail:{model,options}}));return {model,original,options}}
let out=prepare();assert.equal(out.model.layers.mouth.srcfn({facestyle:'default',facevariant:'sweet',mouth:'smile'}),'img/face/default/sweet/mouth-smile.png');
assert.equal(out.model.layers.mouth.srcfn({facestyle:'default',facevariant:'modded24',mouth:'cry'}),'img/face/default/modded24/mouth-cry.png');
assert.equal(out.model.layers.mouth.srcfn({facestyle:'default',facevariant:'unknown',mouth:'smile'}),'img/face/default/mouth-smile.png');
assert.equal(out.model.layers.mouth.srcfn({facestyle:'alternate',facevariant:'sweet',mouth:'smile'}),'img/face/alternate/mouth-smile.png');
assert.equal(out.model.layers.mouth.srcfn({facestyle:'default',facevariant:'sweet',mouth:'none'}),'img/face/default/mouth-none.png');
assert.equal(liveModel.layers.mouth.srcfn(),'live-mouth');assert.deepEqual(V,{facevariant:'sweet'});assert.deepEqual(T,{});assert.deepEqual(out.options,{});
version='0.5.12.13-1.0.1a-1004.1-goose-ucb';out=prepare();assert.equal(out.model.layers.mouth.srcfn,out.original,'other Lyra versions untouched');
version='0.5.11.9-1.0.0a-0815-goose-ucb';root.LyraWardrobeMouthSoftWet.destroy();out=prepare();assert.equal(out.model.layers.mouth.srcfn,out.original,'new models use native paths after adapter cleanup');
console.log('PASS preview mouth adapter: exact version, known/unknown resources, no live model/state changes, duplicate load and cleanup');
