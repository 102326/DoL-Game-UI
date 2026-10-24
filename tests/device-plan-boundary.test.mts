// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
type API=typeof import('./device-case-plan.cjs');
const code=fs.readFileSync(new URL('./device-case-plan.cjs',import.meta.url),'utf8');
function load(value:unknown){
  const target:{exports:Partial<API>}={exports:{}};
  vm.runInNewContext(code,{module:target,exports:target.exports,require(name:string){assert.equal(name,'../scripts/expected.lock.json');return value}});
  const ids=target.exports.expectedCaseIds;assert.ok(ids);
  return ids;
}
test('device plans retain exact string IDs, copy outputs and reject malformed lock projections',()=>{
  const value={devicePlans:{standard:['a','b'],deep:['c']}};
  const ids=load(value),copy=ids();assert.deepEqual([...copy],['a','b']);copy.push('changed');assert.deepEqual(value.devicePlans.standard,['a','b']);
  assert.deepEqual([...ids('deep')],['c']);assert.throws(()=>ids('unknown'),/Unknown device depth/);
  for(const invalid of [null,{}, {devicePlans:null}, {devicePlans:[]}])assert.throws(()=>load(invalid),/device plans/);
  for(const invalid of [{devicePlans:{standard:null}}, {devicePlans:{standard:[1]}}])assert.throws(()=>load(invalid)(),/Invalid device case IDs/);
});
