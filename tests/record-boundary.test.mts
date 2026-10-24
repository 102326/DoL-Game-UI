// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {writeSuite,hydrateSuite} from '../scripts/ci/records.ts';
import {sealProblems} from '../scripts/ci/contracts.ts';

test('result shards restore original extra data and reject malformed or contradictory used fields',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sw-records-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const ctx={dir,identity:{source:{head:'controlled'}}},result={name:'typed.test.cjs',status:'PASS',rawStatus:'passed',milliseconds:1,extra:{preserved:true}},report={suite:'unit',results:[result]};
 writeSuite(ctx,report);
 // The index shape comes from this test's exact writeSuite input; disk shards remain unknown.
 const index={suite:'unit',kind:'suite-index',results:[{name:result.name,status:result.status,rawStatus:result.rawStatus,milliseconds:1,resultFile:'checks/unit/typed.test.cjs.json'}]},file=path.join(dir,'checks/unit/typed.test.cjs.json');
 assert.deepEqual(hydrateSuite(ctx,index).results,[result]);
 for(const bad of [null,[],{}, {schema:1,identity:ctx.identity,suite:'unit',result:null}, ...[{...result,name:12},{...result,status:[]},{...result,rawStatus:false},{...result,milliseconds:'1'},{...result,milliseconds:-1},{...result,name:'other.cjs'},{...result,status:'FAIL'}].map(value=>({schema:1,identity:ctx.identity,suite:'unit',result:value}))]){
  fs.writeFileSync(file,JSON.stringify(bad));assert.throws(()=>hydrateSuite(ctx,index),/Stale\/contradictory result shard/);
 }
 fs.writeFileSync(file,JSON.stringify({schema:1,identity:{changed:true},suite:'unit',result}));assert.throws(()=>hydrateSuite(ctx,index),/Stale\/contradictory/);
 assert.equal(hydrateSuite(ctx,report),report,'non-index reports retain their original path');
 assert.throws(()=>hydrateSuite(ctx,{...index,results:[{...index.results[0],name:'../outside',status:'PASS'}]}),/path\/schema mismatch/);
});
test('seal checks reject non-record input without treating a type assertion as validation',()=>{
 for(const value of [null,[],false,'SEALED',5])assert.deepEqual(sealProblems(value,'lock',{head:'source'}),['EvidenceUnsealed','ExpectedLockMismatch','SourceChangedDuringExecution']);
 assert.deepEqual(sealProblems({state:'SEALED',expectedLockSha256:'lock',sourceAfter:{head:'source'}},'lock',{head:'source'}),[]);
 assert.deepEqual(sealProblems({state:'SEALED',expectedLockSha256:'lock',sourceAfter:{head:'other'}},'lock',{head:'source'}),['SourceChangedDuringExecution']);
});
