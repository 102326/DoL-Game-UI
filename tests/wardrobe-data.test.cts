// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import vm = require('node:vm');
import path = require('node:path');
import esbuild = require('esbuild');
import type {Clothing,Inventory,WardrobeVariables} from '../src/wardrobe/host.ts';
const {buildSync}=esbuild;
const built=buildSync({entryPoints:[path.join(__dirname,'../src/wardrobe/data.ts')],bundle:true,write:false,format:'cjs',platform:'node'}),m:{exports:unknown}={exports:{}};
vm.runInNewContext(built.outputFiles[0]?.text ?? assert.fail('missing compiled output'),{module:m,exports:m.exports,structuredClone});
function checkedExports(value:unknown):value is Pick<typeof import('../src/wardrobe/data.ts'),'snapshot'|'entries'|'project'|'validate'|'slotCapacity'|'itemView'>{return !!value&&typeof value==='object'&&'snapshot' in value&&typeof value.snapshot==='function'&&'entries' in value&&typeof value.entries==='function'&&'project' in value&&typeof value.project==='function'&&'validate' in value&&typeof value.validate==='function'&&'slotCapacity' in value&&typeof value.slotCapacity==='function'&&'itemView' in value&&typeof value.itemView==='function';}
assert.ok(checkedExports(m.exports));
const {snapshot,entries,project,validate}=m.exports;
const garment=(name:string,extra:Partial<Clothing>={}):Clothing=>({name,variable:name,colour:'blue',accessory:0,type:[],integrity:100,integrity_max:100,state_base:'waist',...extra});
const naked=()=>garment('naked'),shirt=garment('shirt'),pants=garment('pants'),dress=garment('dress',{outfitPrimary:{lower:'dress skirt'}}),skirt=garment('dress skirt',{outfitSecondary:['upper','dress']});
const V:WardrobeVariables&{wardrobe:Inventory&{upper:Clothing[];lower:Clothing[]}}={location:'home',worn:{upper:shirt,lower:pants,feet:garment('shoes')},wardrobe:{upper:[dress,garment('spare shirt')],lower:[skirt]},wardrobe_location:'wardrobe'};
const root={V,setup:{clothes:{upper:[naked(),shirt,dress,V.wardrobe.upper[1] ?? assert.fail('missing spare shirt')],lower:[naked(),pants,skirt],feet:[naked(),V.worn.feet ?? assert.fail('missing shoes')]}}};
function read(){const value=snapshot(root);assert.ok(value);return value;}
const before=JSON.stringify(root),s=read(),e=entries(s,'upper')[0] ?? assert.fail('missing dress'),out=project(s,e);
assert.equal(out.worn.upper?.name,'dress');assert.equal(out.worn.lower?.name,'dress skirt');assert.equal(out.worn.feet?.name,'shoes');assert.equal(out.worn.upper?.state,'waist');assert.equal(JSON.stringify(root),before);
assert.equal(entries(s,'lower').length,0,'intact secondary not independently listed');
V.worn=out.worn;const s2=read(),e2=entries(s2,'upper')[1] ?? assert.fail('missing spare shirt'),out2=project(s2,e2);assert.equal(out2.worn.lower?.name,'naked');assert.equal(out2.worn.upper?.name,'spare shirt');
(V.worn.upper ?? assert.fail('missing worn upper')).cursed=1;assert.throws(()=>project(read(),entries(read(),'upper')[1] ?? assert.fail('missing spare shirt')),/限制/);(V.worn.upper ?? assert.fail('missing worn upper')).cursed=0;
V.wardrobe.lower=[];assert.throws(()=>project(read(),entries(read(),'upper')[0] ?? assert.fail('missing dress')),/不完整/);
V.wardrobe.upper.reverse();assert.equal(validate(read(),e),false);assert.throws(()=>project(read(),e),/变化/);
V.wardrobe_location='other';V.wardrobes={other:{locationRequirement:['school'],upper:[]}};V.location='home';assert.equal(snapshot(root),null);assert.equal(V.wardrobe_location,'other','read must not repair/write location');
console.log('PASS readonly inventory, outfit secondary match, removing old outfit, unchanged other pieces, state reset, curse guard, missing piece refusal, stale index, restricted location.');

const {slotCapacity,itemView}=m.exports;
V.wardrobe_location='wardrobe';V.wardrobe.space=10000;V.wardrobe.lower=[skirt];
assert.equal(slotCapacity(read()),10000);
assert.equal(entries(read(),'lower').length,0);const lower=read().inventory.lower;assert.ok(Array.isArray(lower));assert.equal(lower.length,1,'hidden secondary consumes space');
assert.equal(itemView(read(),'upper',dress,'worn:upper').splittable,true);
assert.equal(itemView(read(),'upper',{...dress,outfitPrimary:{lower:'split'}},'worn:upper').splittable,false);
// @ts-expect-error Deliberately exercise invalid native capacity input.
V.wardrobe.space='bad';assert.equal(slotCapacity(read()),null);
console.log('PASS native capacity semantics and split eligibility');
