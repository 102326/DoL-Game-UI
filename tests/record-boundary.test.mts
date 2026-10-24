import fixtureEvidence from './moody-fixture-evidence.cjs';
import type {Page} from 'playwright';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {writeSuite,hydrateSuite,safeFile,readJsonBounded,readReport} from '../scripts/ci/records.ts';
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


test('fixture capture keeps size and path limits without replacing the original error',async t=>{
 const root=fileURLToPath(new URL('../',import.meta.url)),id='typed-capture-'+randomUUID(),dir=path.join(root,'tests/artifacts/ci',id);
 const keys=['MOODY_EVIDENCE_ID','MOODY_CHECK_NAME','MOODY_EVIDENCE_DIR'],saved=keys.map(key=>[key,process.env[key]] as const);
 t.after(()=>{for(const [key,value]of saved){if(value===undefined)delete process.env[key];else process.env[key]=value}if(path.dirname(dir)!==path.join(root,'tests/artifacts/ci')||path.basename(dir)!==id)throw Error('Unexpected capture cleanup');fs.rmSync(dir,{recursive:true,force:true})});
 process.env.MOODY_EVIDENCE_ID=id;process.env.MOODY_CHECK_NAME='settings-ci.cjs';process.env.MOODY_EVIDENCE_DIR=path.join(dir,'fixtures/settings-ci.cjs');
 await fixtureEvidence.captureFailure(null,{kind:'settings',error:Error('original assertion'),snapshot:Array.from({length:1000},()=>({a:'x'.repeat(40)}))});
 const captured=fs.readFileSync(path.join(process.env.MOODY_EVIDENCE_DIR,'snapshot.json'));
 assert.ok(captured.length<=65536);const raw:unknown=JSON.parse(captured.toString('utf8'));assert.ok(raw&&typeof raw==='object'&&'snapshotOmitted' in raw);
 const screenshots:Parameters<Page['screenshot']>[0][]=[];
 await fixtureEvidence.captureFailure({viewportSize:()=>({width:3840,height:2160}),screenshot:async options=>{screenshots.push(options);return Buffer.from('controlled image stub')}},{kind:'settings',error:Error('wide assertion'),snapshot:{focusRect:{x:NaN,y:Infinity,width:44,height:44}}});
 const options=screenshots[0];assert.equal(options?.scale,'css');assert.ok(options?.clip);assert.equal(options.clip.width,2048);assert.equal(options.clip.height,1536);assert.ok(Object.values(options.clip).every(Number.isFinite));
 process.env.MOODY_CHECK_NAME='device-layouts.cjs';process.env.MOODY_EVIDENCE_DIR=path.join(dir,'fixtures/device-layouts.cjs');
 assert.throws(()=>fixtureEvidence.writeLayoutReport({padding:'x'.repeat(262144)}),/256 KiB/);
 assert.equal(fixtureEvidence.writeLayoutReport({status:'FAIL',depth:'standard',results:[]}),true);
 process.env.MOODY_EVIDENCE_DIR=path.join(dir,'outside');assert.equal(fixtureEvidence.writeLayoutReport({status:'PASS'}),false);assert.equal(fs.existsSync(process.env.MOODY_EVIDENCE_DIR),false);
});


test('report loading validates JSON identity and reconstructs checked suite indexes',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sw-report-'));
 t.after(()=>{if(path.dirname(path.resolve(dir))!==path.resolve(os.tmpdir())||!path.basename(dir).startsWith('sw-report-'))throw Error('Unexpected report cleanup');fs.rmSync(dir,{recursive:true,force:true})});
 const ctx={dir,identity:{source:'current'}},file=path.join(dir,'raw.json'),plain={identity:ctx.identity,future:{preserved:[1,'opaque']}};
 fs.writeFileSync(file,JSON.stringify(plain));assert.deepEqual(readReport(ctx,'raw.json'),plain);
 for(const invalid of [null,[],{...plain,identity:{source:'old'}},{...plain,kind:'suite-index',suite:'unit',results:[null]}]){fs.writeFileSync(file,JSON.stringify(invalid));assert.equal(readReport(ctx,'raw.json'),null)}
 fs.writeFileSync(file,'{');assert.equal(readReport(ctx,'raw.json'),null);fs.writeFileSync(file,' '.repeat(262145));assert.equal(readReport(ctx,'raw.json'),null);
 const check={name:'actual.cjs',status:'PASS',rawStatus:'passed',milliseconds:1,extra:{keep:true}},suite={identity:ctx.identity,suite:'unit',results:[check]};writeSuite(ctx,suite);
 assert.deepEqual(readReport(ctx,'unit.json')?.results,[check]);fs.writeFileSync(path.join(dir,'checks/unit/actual.cjs.json'),JSON.stringify({identity:{source:'stale'},suite:'unit',result:check}));assert.equal(readReport(ctx,'unit.json'),null);
});
