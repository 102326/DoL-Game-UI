// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import vm = require('node:vm');
import path = require('node:path');
import esbuild = require('esbuild');
import type {Clothing,Inventory,WardrobeVariables} from '../src/wardrobe/host.ts';
const {buildSync}=esbuild;
const code=buildSync({entryPoints:[path.join(__dirname,'../src/wardrobe/source.ts')],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0]?.text ?? assert.fail('missing compiled output');
const moduleObject:{exports:unknown}={exports:{}};vm.runInNewContext(code,{module:moduleObject,exports:moduleObject.exports});
function checkedExports(value:unknown):value is Pick<typeof import('../src/wardrobe/source.ts'),'createWardrobeSource'>{return !!value&&typeof value==='object'&&'createWardrobeSource' in value&&typeof value.createWardrobeSource==='function';}
assert.ok(checkedExports(moduleObject.exports));

const definition={name:'coat',variable:'coat',description:'native description',warmth:5,integrity_max:100},item={...definition,integrity:80,type:['formal'],colour:'blue'};
const root:{V:WardrobeVariables&{wardrobe:Inventory&{upper:Clothing[];lower?:Clothing[]}};setup:{clothes:Record<string,Clothing[]>;colourName:()=>string}}={V:{location:'home',wardrobe_location:'wardrobe',wardrobe:{upper:[item],mystery:[item],space:20},worn:{upper:{name:'naked'},mystery:{name:'naked'}},options:{images:0},wardrobeDefaults:{showTraits:true}},setup:{clothes:{upper:[definition],mystery:[definition]},colourName:()=> 'blue'}};
function read(model:ReturnType<typeof import('../src/wardrobe/source.ts').createWardrobeSource>,slot:string,all=false){const value=model.read(slot,all);assert.ok(value);return value;}
let current=true;const source=moduleObject.exports.createWardrobeSource(root,()=>({upper:'上装'}),()=>current);
const before=JSON.stringify(root.V),first=read(source,'upper'),key=(first.items[0] ?? assert.fail('missing projected item')).key;
assert.equal((source.resolveMany([key,key]) ?? assert.fail('missing resolved batch')).length,1,'batch resolves unique keys in one validation');assert.equal(source.resolveMany([key,'unknown']),null,'unknown action aborts entire review');

assert.equal((first.items[0] ?? assert.fail('missing projected item')).detail,'native description');assert.ok(!('raw' in (first.items[0] ?? assert.fail('missing projected item'))));assert.ok(!('descriptor' in (first.items[0] ?? assert.fail('missing projected item'))));assert.equal((source.resolve(key) ?? assert.fail('missing resolved item')).raw,item);assert.equal(first.unknownSlots[0],'mystery');
(first.items[0] ?? assert.fail('missing projected item')).traits.push('UI only');assert.equal(item.type.length,1);assert.equal(JSON.stringify(root.V),before);
(root.setup.clothes.upper ?? assert.fail('missing upper definitions'))[0]={...definition};assert.equal(source.resolve(key),null,'same-value definition replacement invalidates binding');source.read('upper');const descriptorKey=(read(source,'upper').items[0] ?? assert.fail('missing projected item')).key;assert.equal((source.resolveMany([descriptorKey]) ?? assert.fail('missing resolved batch')).length,1);
item.integrity=60;assert.equal(source.resolve(key),null,'in-place native update invalidates old operation');const second=read(source,'upper');assert.notEqual((second.items[0] ?? assert.fail('missing projected item')).key,key);assert.equal((second.items[0] ?? assert.fail('missing projected item')).durability,60);
root.setup.colourName=()=> 'translated';assert.equal(source.resolve((second.items[0] ?? assert.fail('missing projected item')).key),null,'derived display changes invalidate projection');assert.equal((read(source,'upper').items[0] ?? assert.fail('missing projected item')).colour,'translated');
const contextualKey=(read(source,'upper').items[0] ?? assert.fail('missing projected item')).key;root.setup.colourName=()=>{current=false;return 'translated'};assert.equal(source.resolve(contextualKey),null,'page changes during native display helper invalidate dispatch');current=true;root.setup.colourName=()=> 'translated';
const fresh=(read(source,'upper').items[0] ?? assert.fail('missing projected item')).key;root.V.wardrobe.upper[0]={...item};assert.equal(source.resolve(fresh),null,'same-value replacement is not same native identity');
const replacement=(read(source,'upper').items[0] ?? assert.fail('missing projected item')).key;current=false;assert.equal(source.resolve(replacement),null,'page ownership lost');assert.equal(source.read('upper'),null);current=true;
root.V.wardrobe.over_upper=[item];root.V.worn.over_upper={name:'naked'};root.setup.clothes.over_upper=[definition];
const extension=moduleObject.exports.createWardrobeSource(root,()=>({over_upper:'外套上装'}),()=>current);
root.V.wardrobe.charm=[];root.V.worn.charm={name:'naked'};root.setup.clothes.charm=[definition];
assert.ok(read(source,'upper').unknownSlots.includes('charm'),'empty new slot remains discoverable');
root.V.wardrobe.over_head=[];root.V.worn.over_head={name:'naked'};root.setup.clothes.over_head=[definition];
assert.ok(!read(source,'upper').unknownSlots.includes('over_head'),'empty optional vanilla slots do not flood unknown-content notices');
assert.equal((read(extension,'over_upper').items[0] ?? assert.fail('missing projected item')).detail,'native description');assert.equal(read(extension,'over_upper').categoryNote,'','no experimental category copy');extension.destroy();
// Search bindings span only known categories and retain original slot/object identity.
root.V.wardrobe.lower=[{...item}];root.V.worn.lower={name:'naked'};root.setup.clothes.lower=[{...definition}];
const cross=moduleObject.exports.createWardrobeSource(root,()=>({upper:'上装',lower:'下装'}),()=>current);
const all=read(cross,'upper',true);assert.equal(all.items.length,2);assert.equal((all.items[0] ?? assert.fail('missing projected item')).name,(all.items[1] ?? assert.fail('missing projected item')).name);
assert.deepEqual(Array.from(all.items,i=>i.slotLabel),['上装','下装']);assert.notEqual((all.items[0] ?? assert.fail('missing projected item')).key,(all.items[1] ?? assert.fail('missing projected item')).key);
assert.equal((cross.resolve((all.items[1] ?? assert.fail('missing projected item')).key) ?? assert.fail('missing resolved item')).slot,'lower');assert.equal((cross.resolve((all.items[1] ?? assert.fail('missing projected item')).key) ?? assert.fail('missing resolved item')).raw,root.V.wardrobe.lower[0]);
assert.ok(all.unknownSlots.includes('mystery'));assert.ok(!all.items.some(i=>i.key.startsWith('mystery:')));
root.V.wardrobe.lower[0]={...(root.V.wardrobe.lower[0] ?? assert.fail('missing lower garment'))};assert.equal(cross.resolve((all.items[1] ?? assert.fail('missing projected item')).key),null,'same-valued cross-category replacement refuses stale wear');
let searched=read(cross,'upper',true);root.V.wardrobe.lower.unshift({...item});assert.equal(cross.resolve((searched.items[1] ?? assert.fail('missing projected item')).key),null,'index changes refuse stale wear');
searched=read(cross,'upper',true);root.setup.clothes.lower[0]={...definition};assert.equal(cross.resolve((searched.items[1] ?? assert.fail('missing projected item')).key),null,'definition replacement refuses stale wear');
const normal=read(cross,'upper');assert.ok(normal.items.every(i=>i.slotLabel===undefined));assert.equal(cross.resolve((searched.items[0] ?? assert.fail('missing projected item')).key),null,'changing search scope expires old keys');
const labelsOnly=moduleObject.exports.createWardrobeSource(root,()=>({upper:'上装'}),()=>current);labelsOnly.read('upper');assert.equal((read(labelsOnly,'upper',true).items[0] ?? assert.fail('missing projected item')).slotLabel,'上装','single-category search still labels results');labelsOnly.destroy();
const final=read(cross,'upper',true);root.V.location='school';assert.equal(cross.resolve((final.items[0] ?? assert.fail('missing projected item')).key),null,'scene change refuses search result');root.V.location='home';cross.destroy();
source.destroy();assert.equal(source.resolve(replacement),null);assert.equal(source.read('upper'),null);assert.equal(source.resolveMany([replacement]),null);
assert.equal(source.resolveMany([replacement]),null);
console.log('PASS M2 projection: no native refs/writes; content/identity/page invalidation; unknown slots; disposal');
