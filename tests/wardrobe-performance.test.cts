// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import path = require('node:path');
import vm = require('node:vm');
import esbuild = require('esbuild');

const {buildSync}=esbuild;
const code=buildSync({entryPoints:[path.join(__dirname,'../src/wardrobe/performance.ts')],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0]?.text ?? assert.fail('missing compiled output');
const context:{module:{exports:unknown}}={module:{exports:{}}};vm.runInNewContext(code,context);
function checkedExports(value:unknown):value is Pick<typeof import('../src/wardrobe/performance.ts'),'createWardrobePerformance'> {return !!value&&typeof value==='object'&&'createWardrobePerformance' in value&&typeof value.createWardrobePerformance==='function';}
assert.ok(checkedExports(context.module.exports));
let now=0;const p=context.module.exports.createWardrobePerformance(()=>now);
p.measure('disabled',()=>now+=2);assert.equal(Object.keys(p.report().phases).length,0);
p.setEnabled(true);for(let i=0;i<200;i++)p.measure('work',()=>now+=3);assert.equal((p.report().phases.work ?? assert.fail('missing timing phase')).samples,128);assert.equal((p.report().phases.work ?? assert.fail('missing timing phase')).p50,3);
const end=p.start('stale');p.reset();now+=4;end();assert.equal(Object.keys(p.report().phases).length,0);
const cancel=p.start('cancelled');p.setEnabled(false);p.setEnabled(true);cancel();assert.equal(Object.keys(p.report().phases).length,0);
assert.throws(()=>p.measure('error',()=>{now+=5;throw Error('expected')}));assert.equal((p.report().phases.error ?? assert.fail('missing timing phase')).max,5);
const snapshot=p.report();const error=snapshot.phases.error;assert.ok(error);error.max=99;assert.equal((p.report().phases.error ?? assert.fail('missing timing phase')).max,5);
console.log('PASS opt-in bounded numeric timings, reset/disable invalidates pending spans, exception propagation and report isolation');
