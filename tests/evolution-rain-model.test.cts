import esbuild = require('esbuild');
// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"native"}
import nodeTest = require('node:test');
import assert = require('node:assert/strict');
import fs = require('node:fs');
import os = require('node:os');
import path = require('node:path');
const {test}=nodeTest;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'evo-rain-'));
try{esbuild.buildSync({entryPoints:['prototypes/evolution-weather/rain-model.ts'],outfile:path.join(dir,'model.cjs'),bundle:true,platform:'node',format:'cjs'});}catch(e){fs.rmSync(dir,{recursive:true});throw e}
const loaded:unknown=require(path.join(dir,'model.cjs'));
function isModel(value:unknown):value is Pick<typeof import('../prototypes/evolution-weather/rain-model.ts'),'rainModel'>{return !!value&&typeof value==='object'&&'rainModel' in value&&typeof value.rainModel==='function';}
assert.ok(isModel(loaded));const {rainModel}=loaded;fs.rmSync(dir,{recursive:true});
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

test('natural wet trails follow a non-straight drop route, vary in width, and reset on resize',()=>{
 const m=rainModel(19,true);m.resize(900,600);
 for(let i=0;i<900;i++)m.step(.025,1);
 const s=m.snapshot(),groups=new Map<number|undefined,import('../src/ui/weather/rain-model.ts').Trail[]>();
 assert.ok(s.trails.length>0&&s.trails.length<=900);
 for(const t of s.trails){assert.ok(Number.isFinite(t.x+t.y+t.endX+t.endY+t.width));const g=groups.get(t.strand)||[];g.push(t);groups.set(t.strand,g)}
 const long=[...groups.values()].filter(g=>g.length>50);assert.ok(long.length>0);
 assert.ok(long.some(g=>Math.max(...g.map(t=>t.width))/Math.min(...g.map(t=>t.width))>1.1));
 assert.ok(long.some(g=>{const a=g[0],b=g.at(-1);assert.ok(a&&b);const dx=b.endX-a.x,dy=b.endY-a.y;return Math.max(...g.map(t=>Math.abs((t.x-a.x)*dy-(t.y-a.y)*dx)/Math.hypot(dx,dy)))>1}),'route deviates from a ruler-straight chord');
 for(const g of groups.values())for(let i=1;i<g.length;i++){const current=g[i],previous=g[i-1];assert.ok(current&&previous);assert.equal(current.x,previous.endX);assert.equal(current.y,previous.endY)}
 m.resize(390,844);assert.equal(m.snapshot().trails.length,0,'old-coordinate trails must not bridge a resize');
 for(let i=0;i<2400;i++)m.step(.025,0);assert.equal(m.snapshot().trails.length,0);assert.equal(m.snapshot().drops.length,0);
});

test('runoff renews through sustained rain and leaves only after crossing the bottom',()=>{
 const m=rainModel(19,true,true);m.resize(900,600);let seen=new Map<number,import('../src/ui/weather/rain-model.ts').Drop>(),bottom=new Set<number>(),exited=new Set<number>(),midBorn=0;
 for(let i=0;i<4800;i++){
  m.step(.025,1);const s=m.snapshot();assert.ok(s.drops.length<=90);
  for(const d of s.drops.filter(d=>d.runoff)){assert.ok(Number.isFinite(d.x+d.y+d.area+d.vy));seen.set(d.id,d);if(d.y>600)bottom.add(d.id)}
  for(const id of bottom)if(!s.drops.some(d=>d.id===id))exited.add(id);
  if(i===2400)midBorn=s.runoffBorn;
 }
 const rain=m.snapshot();assert.ok(rain.runoffBorn>midBorn+4,'new flowing drops continue after the initial population');assert.ok(exited.size>0&&rain.runoffDrained>0,'generated water crosses the bottom and is reclaimed');
 for(let i=0;i<2400;i++)m.step(.025,0);assert.equal(m.snapshot().drops.length,0);assert.equal(m.snapshot().trails.length,0);
});

test('rain intensity changes replenishment while default intensity preserves the existing model',()=>{
 const born=[.32,.65,1,1.5].map(amount=>{const m=rainModel(19,true,true);m.resize(900,600);for(let i=0;i<2400;i++)m.step(.025,1,amount);return m.snapshot().runoffBorn});
 assert.ok(born.every((n,i)=>i===0||n>(born[i-1] ?? assert.fail('missing previous intensity'))),JSON.stringify(born));
 const a=rainModel(19,true,true),b=rainModel(19,true,true);a.resize(900,600);b.resize(900,600);for(let i=0;i<500;i++){a.step(.025,1);b.step(.025,1,1)}assert.deepEqual(a.snapshot(),b.snapshot());assert.throws(()=>a.step(.025,1,NaN));
});

test('optional rain energy makes the same runoff drop descend faster and keeps default behavior',()=>{
 const distances=[1,1.32,1.6,1.9,2.325].map(energy=>{const m=rainModel(19,true,true);m.resize(900,600);let id;for(let i=0;i<20;i++){m.step(.025,1,1,energy);id??=m.snapshot().drops.find(d=>d.runoff)?.id}assert.ok(id);const start=m.snapshot().drops.find(d=>d.id===id);assert.ok(start);for(let i=0;i<70;i++)m.step(.025,1,1,energy);const end=m.snapshot().drops.find(d=>d.id===id);assert.ok(end);return end.y-start.y});
 assert.ok(distances.every((n,i)=>i===0||n>(distances[i-1] ?? assert.fail('missing previous energy'))),JSON.stringify(distances));
 const a=rainModel(19,true,true),b=rainModel(19,true,true);a.resize(900,600);b.resize(900,600);for(let i=0;i<500;i++){a.step(.025,1,1);b.step(.025,1,1,1)}assert.deepEqual(a.snapshot(),b.snapshot());assert.throws(()=>a.step(.025,1,1,Infinity));
});
