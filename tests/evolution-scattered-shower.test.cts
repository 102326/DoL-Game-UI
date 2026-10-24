import esbuild = require('esbuild');
// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"native"}
import nodeTest = require('node:test');
import assert = require('node:assert/strict');
import fs = require('node:fs');
import os = require('node:os');
import path = require('node:path');
const {test}=nodeTest;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'evo-shower-'));esbuild.buildSync({entryPoints:['prototypes/evolution-weather/scattered-shower.ts'],outfile:path.join(dir,'shower.cjs'),bundle:true,platform:'node',format:'cjs'});const loaded:unknown=require(path.join(dir,'shower.cjs'));
function isModel(value:unknown):value is Pick<typeof import('../prototypes/evolution-weather/scattered-shower.ts'),'scatteredShower'>{return !!value&&typeof value==='object'&&'scatteredShower' in value&&typeof value.scatteredShower==='function';}
assert.ok(isModel(loaded));const {scatteredShower}=loaded;fs.rmSync(dir,{recursive:true});
test('seeded rain is reproducible, sparse and has independent motion rather than a common tile translation',()=>{
 const a=scatteredShower(19),b=scatteredShower(19);const first=a.step(0,1000,876,1.5);assert.ok(first.budget<=50);assert.equal(first.streaks.length,49);assert.ok(Math.max(...first.streaks.map(p=>p.vy))/Math.min(...first.streaks.map(p=>p.vy))>1.3);assert.ok(new Set(first.streaks.map(p=>p.length)).size>30);
 const next=a.step(.025,1000,876,1.5);b.step(0,1000,876,1.5);assert.deepEqual(next,b.step(.025,1000,876,1.5));
 const moves=next.streaks.map((p,i)=>({x:p.x-(first.streaks[i] ?? assert.fail('missing initial streak')).x,y:p.y-(first.streaks[i] ?? assert.fail('missing initial streak')).y}));assert.ok(Math.max(...moves.map(p=>p.x))-Math.min(...moves.map(p=>p.x))>1);assert.ok(Math.max(...moves.map(p=>p.y))-Math.min(...moves.map(p=>p.y))>1);assert.deepEqual(a.step(0,1000,876,1.5),next);
});
test('rain levels increase budget/speed while renewal remains finite, bounded and staggered',()=>{
 const m=scatteredShower(19),levels=[.32,.65,1,1.5].map(i=>m.step(0,1000,876,i));assert.ok(levels.every((s,i)=>{if(i===0)return true;const previous=levels[i-1];assert.ok(previous);return s.budget>previous.budget&&s.speed>previous.speed;}));let s=levels[0];
 for(let i=0;i<4000;i++){s=m.step(.025,1000,876,1.5);assert.ok(s.streaks.length<=64);assert.ok(s.streaks.every(p=>Number.isFinite(p.x+p.y+p.vx+p.vy+p.opacity)&&p.x>=-32&&p.x<=1032&&p.y>=-32&&p.y<=908&&p.opacity>=0&&p.opacity<=1))}
 assert.ok(s);assert.ok(s.streaks.every(p=>p.cycle>0));assert.ok(new Set(s.streaks.map(p=>p.cycle)).size>2);assert.ok(new Set(s.streaks.map(p=>p.x)).size>30);const resized=m.step(0,390,844,1.5);assert.ok(resized.streaks.every(p=>Number.isFinite(p.x+p.y)));assert.throws(()=>m.step(.1,390,844,1));assert.throws(()=>m.step(.025,390,844,NaN));
});
