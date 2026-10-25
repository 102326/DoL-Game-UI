// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import vm = require('node:vm');
import esbuild = require('esbuild');
const {buildSync}=esbuild;
const timers=new Map<number,()=>void>(),pending=new Map<number,()=>void>(),cancelled:number[]=[],moduleObject:{exports:unknown}={exports:{}};let serial=0;
vm.runInNewContext(buildSync({entryPoints:['src/ui/visual-scope.ts'],bundle:true,write:false,format:'cjs'}).outputFiles[0]?.text ?? assert.fail('missing compiled output'),{module:moduleObject,exports:moduleObject.exports,requestAnimationFrame(callback:()=>void){pending.set(++serial,callback);return serial},cancelAnimationFrame(id:number){cancelled.push(id);pending.delete(id)},setTimeout(callback:()=>void){timers.set(++serial,callback);return serial},clearTimeout(id:number){timers.delete(id)}});
function checkedExports(value:unknown):value is Pick<typeof import('../src/ui/visual-scope.ts'),'visualScope'> {return !!value&&typeof value==='object'&&'visualScope' in value&&typeof value.visualScope==='function';}
assert.ok(checkedExports(moduleObject.exports));

const {visualScope}=moduleObject.exports,owner=visualScope(),peer=visualScope();let calls=0,peerCalls=0;
const update=()=>calls++,peerUpdate=()=>peerCalls++;
owner.frame(update);owner.frame(update);peer.frame(peerUpdate);assert.equal(pending.size,2,'same-owner updates coalesce; peers remain independent');
const stale=([...pending.values()][0] ?? assert.fail('missing scheduled callback'));owner.dispose();assert.equal(pending.size,1);stale();assert.equal(calls,0,'already-delivered frame cannot revive a disposed owner');
owner.frame(update);assert.equal(pending.size,1);const peerFrame=([...pending.entries()][0] ?? assert.fail('missing scheduled callback'));pending.delete(peerFrame[0]);peerFrame[1]();assert.equal(peerCalls,1);
let releases=0;owner.own(()=>releases++);assert.equal(releases,1,'late ownership releases immediately');owner.dispose();assert.equal(releases,1);
const live=visualScope();let ticks=0;const repeat=()=>{ticks++;if(ticks===1)live.frame(repeat)};live.frame(repeat);
for(let i=0;i<2;i++){const [id,callback]=([...pending.entries()][0] ?? assert.fail('missing scheduled callback'));pending.delete(id);callback()}assert.equal(ticks,2,'a delivered task may schedule its next frame');
live.frame(repeat);const replaced=([...pending.values()][0] ?? assert.fail('missing scheduled callback'));live.cancelFrame(repeat);live.frame(repeat);replaced();assert.equal(ticks,2,'cancelled delivery must not run or erase the replacement frame');assert.equal(pending.size,1);
const [replacementId,replacement]=([...pending.entries()][0] ?? assert.fail('missing scheduled callback'));pending.delete(replacementId);replacement();assert.equal(ticks,3);live.cancelFrame(repeat);
const order:string[]=[];live.own(()=>order.push('first'));live.own(()=>{order.push('fault');throw Error('controlled cleanup failure')});live.own(()=>order.push('last'));
assert.throws(()=>live.dispose(),error=>!!error&&typeof error==='object'&&'name' in error&&error.name==='AggregateError'&&'errors' in error&&Array.isArray(error.errors)&&error.errors.length===1);assert.deepEqual(order,['last','fault','first']);assert.equal(live.active(),false);live.dispose();peer.dispose();assert.equal(pending.size,0);assert.ok(cancelled.length);
console.log('PASS visual scope: owner/peer isolation, frame coalescing, stale callbacks, late cleanup, requeue and complete failure cleanup');

const timed=visualScope();let timeCalls=0;
const stop=timed.timeout(()=>timeCalls++,20),lateTimer=([...timers.values()][0] ?? assert.fail('missing scheduled callback'));stop();lateTimer();assert.equal(timeCalls,0);assert.equal(timers.size,0);
timed.timeout(()=>timeCalls++,20);const [tid,tick]=([...timers.entries()][0] ?? assert.fail('missing scheduled callback'));timers.delete(tid);tick();assert.equal(timeCalls,1);
let freed=0;const free=timed.own(()=>freed++);free();free();assert.equal(freed,1);timed.timeout(()=>timeCalls++,20);const disposedTimer=([...timers.values()][0] ?? assert.fail('missing scheduled callback'));timed.dispose();disposedTimer();timed.timeout(()=>timeCalls++,20);assert.equal(timeCalls,1);assert.equal(freed,1);assert.equal(timers.size,0);
console.log('PASS visual scope timers and detachable child cleanup: completion, cancellation, late delivery and disposal');
