// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {writeSuite,hydrateSuite,safeFile,readJsonBounded} from '../scripts/ci/records.ts';
import {caseProblems,sealProblems} from '../scripts/ci/contracts.ts';
import {rendererProblems} from '../scripts/ci/renderer.ts';

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


test('bounded evidence reads preserve JSON fields and reject unsafe paths or sizes',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sw-evidence-read-'));
 t.after(()=>{if(path.dirname(path.resolve(dir))!==path.resolve(os.tmpdir())||!path.basename(dir).startsWith('sw-evidence-read-'))throw Error('Unexpected read fixture cleanup');fs.rmSync(dir,{recursive:true,force:true})});
 const file=path.join(dir,'data.json'),value={schema:1,future:{keep:['opaque',3]}};fs.writeFileSync(file,JSON.stringify(value));
 assert.equal(safeFile(dir,'data.json'),file);assert.deepEqual(readJsonBounded(dir,'data.json'),value);
 const before=fs.readFileSync(file);assert.throws(()=>readJsonBounded(dir,'data.json',3),/Evidence size limit/);assert.deepEqual(fs.readFileSync(file),before);
 for(const unsafe of [null,undefined,4,[],{},'', '../escape','nested/../escape','nested\\escape','/absolute'])assert.throws(()=>safeFile(dir,unsafe),/Unsafe evidence path/);
 fs.mkdirSync(path.join(dir,'nested'));assert.throws(()=>safeFile(dir,'nested'),/Unsafe evidence file/);
 fs.writeFileSync(file,'{');assert.throws(()=>readJsonBounded(dir,'data.json'),SyntaxError);assert.equal(fs.readFileSync(file,'utf8'),'{');
});


test('untrusted case and graphics receipts are checked without declaring disk data trusted',()=>{
 const expected=[{id:'case',minimumAssertions:1}],valid={id:'case',status:'PASS',path:'controlled',milliseconds:0,assertions:1};
 assert.deepEqual(caseProblems(expected,[valid]),[]);
 for(const invalid of [null,{},'case'])assert.deepEqual(caseProblems(expected,invalid),['MissingExpectedCases']);
 for(const invalid of [null,[],{}, {...valid,id:1},{...valid,path:''}])assert.deepEqual(caseProblems(expected,[invalid]),['InvalidCaseResult']);
 for(const invalid of [{...valid,milliseconds:'0'},{...valid,assertions:'1'},{...valid,assertions:NaN},{...valid,milliseconds:Infinity}])assert.deepEqual(caseProblems(expected,[invalid]),['IncompleteCase:case']);
 assert.deepEqual(rendererProblems(['weather:2d'],{contexts:{'weather:2d':1}}),[]);
 for(const invalid of [null,[],{contexts:[]},{contexts:{'weather:2d':'1'}},{contexts:{'weather:2d':0}},{contexts:{'weather:2d':NaN}}])assert.deepEqual(rendererProblems(['weather:2d'],invalid),['RendererPathMismatch:weather:2d']);
});
