const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'evo-rain-'));
try{require('esbuild').buildSync({entryPoints:['prototypes/evolution-weather/rain-model.ts'],outfile:path.join(dir,'model.cjs'),bundle:true,platform:'node',format:'cjs'});}catch(e){fs.rmSync(dir,{recursive:true});throw e}
const {rainModel}=require(path.join(dir,'model.cjs'));fs.rmSync(dir,{recursive:true});
test('seeded attached drops grow, coalesce and drain with finite bounded geometry',()=>{
 const model=rainModel();model.resize(900,600);model.step(0,1);const initial=model.snapshot();assert.ok(initial.drops.length>0);assert.ok(initial.drops.every(d=>d.vy===0));
 for(let i=0;i<1600;i++)model.step(.025,1);
 const rain=model.snapshot();assert.ok(rain.merges>0);assert.ok(rain.slides>0);assert.ok(rain.drained>0);assert.ok(rain.trails.length>0);assert.ok(rain.drops.length<=90);
 assert.ok(rain.drops.every(d=>Number.isFinite(d.x+d.y+d.area+d.vy)&&d.area>0));
 model.resize(390,750);assert.ok(model.snapshot().drops.every(d=>d.x>=0&&d.x<=390));
 for(let i=0;i<2400;i++)model.step(.025,0);
 assert.equal(model.snapshot().drops.length,0);assert.equal(model.snapshot().trails.length,0);
});
test('same simulation step history reproduces drop identities and trajectories',()=>{
 const run=()=>{const m=rainModel(19);m.resize(900,600);for(let i=0;i<500;i++)m.step(.025,.8);return m.snapshot()};assert.deepEqual(run(),run());
});
test('invalid geometry and time are rejected',()=>{const m=rainModel();assert.throws(()=>m.resize(Infinity,600));assert.throws(()=>m.step(NaN,1));assert.throws(()=>m.step(-1,1));});
