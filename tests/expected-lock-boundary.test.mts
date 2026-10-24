// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseExpectedLock,parseCasePlan} from '../scripts/ci/contracts.ts';

test('expected lock validates the real file and preserves unknown metadata',()=>{
  const value:unknown=JSON.parse(fs.readFileSync(new URL('../scripts/expected.lock.json',import.meta.url),'utf8'));
  assert.equal(parseExpectedLock(value),value);
  const sample={schema:1,devicePlans:{standard:['a'],deep:['b']},nativeCases:{},researchCases:{},entries:[],future:{preserve:true}};
  assert.equal(parseExpectedLock(sample),sample);assert.deepEqual(sample.future,{preserve:true});
});
test('expected lock rejects wrong maps, discriminator values and invalid numeric declarations',()=>{
  const entry={entry:'tests/owned.cjs',profiles:['standard'],classification:'contract',granularity:'entry',cases:[{id:'entry',minimumAssertions:1}],sourceSha256:'owned',assertionSites:1};
  const sample={schema:1,devicePlans:{standard:['a']},nativeCases:{},researchCases:{},entries:[entry]};
  assert.equal(parseExpectedLock(sample),sample);
  for(const value of [null,{}, {...sample,nativeCases:{bad:[3]}}, {...sample,entries:[null]},
    {...sample,entries:[{...entry,classification:'unknown'}]}, {...sample,entries:[{...entry,profiles:['unknown']}]},
    {...sample,entries:[{...entry,cases:[{id:'entry',minimumAssertions:NaN}]}]},
    {...sample,entries:[{...entry,cases:[{id:'entry',minimumAssertions:0}]}]},
    {...sample,entries:[{...entry,assertionSites:Infinity}]}])assert.throws(()=>parseExpectedLock(value),/Expected Lock schema/);
});
test('case environment plans validate counts and keep empty or opaque valid data',()=>{
  assert.deepEqual(parseCasePlan([]),[]);
  const plan=[{id:'entry',minimumAssertions:1,future:{preserve:true}}];assert.equal(parseCasePlan(plan),plan);
  for(const value of [null,{},[null],[{id:'entry',minimumAssertions:NaN}],[{id:'entry',minimumAssertions:0}]])assert.throws(()=>parseCasePlan(value),/Invalid case plan/);
});
