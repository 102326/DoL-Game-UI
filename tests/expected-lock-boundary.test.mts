// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {parseExpectedLock,parseCasePlan} from '../scripts/ci/contracts.ts';
import {declarationSource,namesFrom,generateLock} from '../scripts/ci/generate-lock.ts';

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
test('typed declaration hashes require repository LF instead of silently normalizing input',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sw-lock-eol-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 for(const extension of ['ts','cts','mts']){
  const file=path.join(dir,'owned.'+extension),lf='// exact input\nexport {};\n',crlf=lf.replaceAll('\n','\r\n');
  fs.writeFileSync(file,lf);assert.equal(declarationSource(file),lf);
  fs.writeFileSync(file,crlf);assert.throws(()=>declarationSource(file),/ExpectedLockSourceEol/);assert.equal(fs.readFileSync(file,'utf8'),crlf,'rejected source bytes must remain untouched');
 }
});


test('typed literal wrappers preserve expanded assertion sites and named cases',()=>{
 const body=`for(const key of keys){checkpoint(key);assert.equal(actual[key],expected[key]);}`;
 const plain=namesFrom(`const keys=['first','second'];${body}`,'checkpoint');
 assert.deepEqual(plain,{names:['first','second'],assertionSites:2});
 for(const initializer of ["(['first','second'])","['first','second'] as const","(['first','second'] as const) satisfies readonly string[]","<readonly string[]>['first','second']"]){
  assert.deepEqual(namesFrom(`const keys=${initializer};${body}`,'checkpoint'),plain);
 }
 assert.throws(()=>namesFrom('checkpoint(dynamicName())','checkpoint'),/Unresolved case declaration/,'type wrappers must not permit unresolved runtime names');
});

test('group plans follow AST conditions in both authored TS and spaced CJS output',()=>{
 for(const identity of ["group==='identity'","group === 'identity'","('identity' === group)"]){
  for(const inspector of ["['all','inspector'].includes(group)","(['all', 'inspector'] as const).includes(group)"]){
   const source=`if(${identity}){checkpoint('core-identity');assert.ok(identity)} if(${inspector}){checkpoint('privacy');assert.ok(privacy)}`;
   assert.deepEqual(namesFrom(source,'checkpoint','identity'),{names:['core-identity'],assertionSites:1});
   assert.deepEqual(namesFrom(source,'checkpoint','inspector'),{names:['privacy'],assertionSites:1});
  }
 }
 const lock=generateLock();
 for(const group of ['identity','inspector','surfaces','compat']){
  const entry=lock.entries.find(e=>e.entry===`tests/ui-runtime-${group}.cjs`);assert.ok(entry);
  const ownSource=fs.readFileSync('tests/ui-runtime.cts','utf8');
  assert.deepEqual(entry.cases.map(c=>c.id),namesFrom(ownSource,'checkpoint',group).names);
  assert.equal(entry.cases.some(c=>c.id==='core-identity'),group==='identity');
 }
});
