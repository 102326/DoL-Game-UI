// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import path = require('node:path');
import vm = require('node:vm');
import esbuild = require('esbuild');
const result=esbuild.buildSync({entryPoints:[path.join(__dirname,'../src/runtime/status.ts')],bundle:true,write:false,format:'cjs',platform:'node'}),output=result.outputFiles[0];assert.ok(output);
const m:{exports:unknown}={exports:{}};vm.runInNewContext(output.text,{module:m,exports:m.exports});
function statusExports(value:unknown):value is Pick<typeof import('../src/runtime/status.ts'),'createStatusService'>{return !!value&&typeof value==='object'&&'createStatusService' in value&&typeof value.createStatusService==='function';}
assert.ok(statusExports(m.exports));const {createStatusService}=m.exports;
let current:unknown={pain:0,tiredness:2,stress:3,trauma:4,control:5},next=0;const queue=new Map<number,()=>void>();
const service=createStatusService({readVariables:()=>current,schedule:fn=>{queue.set(++next,fn);return next},cancel:id=>queue.delete(id)}),api=service.api;
const flush=()=>{const q=[...queue.values()];queue.clear();q.forEach(fn=>fn())};
let snap=api.getSnapshot();assert.equal(snap.status,'ready');assert.equal(snap.values.pain,0);assert.ok(Object.isFrozen(snap)&&Object.isFrozen(snap.values));assert.equal(Object.isFrozen(current),false);assert.notEqual(snap.values,current);
const before=JSON.stringify(current);api.getSnapshot();assert.equal(JSON.stringify(current),before);
current={pain:NaN,tiredness:Infinity,stress:'3',control:0};snap=api.getSnapshot();assert.equal(snap.status,'partial');assert.equal(snap.values.stress,null);assert.equal(snap.reasons.trauma,'missing');assert.equal(snap.reasons.pain,'invalid');assert.equal(snap.values.control,0);
assert.ok(current&&typeof current==='object');Object.defineProperty(current,'pain',{get(){throw Error('getter')}});assert.equal(api.getSnapshot().reasons.pain,'unreadable');
let calls=0;const fn=()=>calls++;const off=api.subscribe(fn),off2=api.subscribe(fn);api.subscribe(()=>{throw Error('consumer')});let afterThrow=0;api.subscribe(()=>afterThrow++);api.refresh();api.refresh();assert.equal(queue.size,1);off();flush();assert.equal(calls,1);assert.equal(afterThrow,1);off2();
current={pain:12,tiredness:1,stress:2,trauma:3,control:4};assert.equal(api.getSnapshot().values.pain,12);assert.equal(snap.values.control,0);service.beginLoad();assert.equal(api.getSnapshot().status,'loading');assert.equal(api.getSnapshot().values.pain,null);api.refresh();flush();assert.equal(api.getSnapshot().status,'loading');service.renderComplete();assert.equal(api.getSnapshot().values.pain,12);flush();
current=undefined;assert.equal(api.getSnapshot().status,'unavailable');assert.equal(api.getSnapshot().values.pain,null);api.refresh();api.dispose();assert.equal(queue.size,0);api.dispose();api.subscribe(()=>assert.fail('disposed notification'));api.refresh();assert.equal(queue.size,0);assert.equal(api.getSnapshot().status,'disposed');
console.log('PASS status boundary: no writes, zero/invalid/missing/getter failures, frozen copies, replacement, load invalidation, frame batching, unsubscribe, listener isolation, disposal.');
