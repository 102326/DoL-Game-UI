// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import fs = require('node:fs');
import os = require('node:os');
import path = require('node:path');
import fixtures = require('./ci-fixtures.cjs');
const {fixture}=fixtures;
import evidence = require('../scripts/ci-evidence.cjs');
const {summarize,finalizeUpload,verifyRemote,hash,writeJson,runCommand,resultStatus}=evidence;
import catalog = require('../scripts/ci-catalog.cjs');
const {catalogFor,suites}=catalog;
import sourcePolicy = require('../scripts/ci-source-policy.cjs');
const {forbiddenJs,forbiddenWorkflow,checkSourcePolicy}=sourcePolicy;
const jsonRecord=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const asRecord=(v:unknown):Record<string,unknown>=>{if(!jsonRecord(v))throw Error('Invalid fixture object');return v};
const field=(v:unknown,key:string)=>asRecord(asRecord(v)[key]);
const list=(v:unknown,key:string):unknown[]=>{const x=asRecord(v)[key];if(!Array.isArray(x))throw Error('Invalid fixture list: '+key);return x};
const item=(v:unknown[],n:number)=>asRecord(v[n]);
const read=(file:string)=>asRecord(JSON.parse(fs.readFileSync(file,'utf8')));
const setup={checkout:{outcome:'success'},node:{outcome:'success'},python:{outcome:'success'}};
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moody-gate-v11-'));let ctx!:ReturnType<typeof fixture>;
 const reset=()=>{fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir);ctx=fixture(dir);return summarize(ctx,setup)};
 const mutate=(file:string,fn:(r:Record<string,unknown>)=>void)=>{const p=path.join(dir,file),r=read(p);fn(r);writeJson(p,r)};
 const expected=()=>({checkoutSHA:ctx.identity.source.head,source:ctx.identity.source,profile:'standard',nonce:ctx.identity.nonce,run:ctx.identity.run,pr:ctx.identity.pr,manifestSha256:hash(fs.readFileSync(path.join(dir,'upload/upload-index.json')))});
 const test=(id:string,fn:()=>void)=>{fn();console.log('PASS',id)};
 try{
  test('positive local and uploaded bytes',()=>{assert.equal(reset().status,'PASS');assert.equal(finalizeUpload(ctx,summarize(ctx,setup)).status,'PASS');assert.equal(verifyRemote(path.join(dir,'upload'),expected()).status,'PASS')});
  test('G01',()=>{const s=reset();Object.assign(s,{padding:'x'.repeat(303061)});const d=finalizeUpload(ctx,s);assert.equal(d.status,'UNVERIFIED');assert.equal(d.evidenceIntegrity,'INCOMPLETE')});
  test('G02',()=>{reset();fs.unlinkSync(path.join(dir,'package-contracts.json'));assert.equal(finalizeUpload(ctx,summarize(ctx,setup)).status,'UNVERIFIED')});
  for(const [id,change]of [['G03',(r:Record<string,unknown>)=>field(field(r,'identity'),'run').githubRunId='old-run'],['G04',(r:Record<string,unknown>)=>field(field(r,'identity'),'source').head='old-sha']] as const)test(id,()=>{reset();mutate('unit.json',change);assert.equal(summarize(ctx,setup).status,'UNVERIFIED')});
  test('G05',()=>{reset();finalizeUpload(ctx,summarize(ctx,setup));const e=expected();fs.appendFileSync(path.join(dir,'upload/unit.json'),' ');assert.equal(verifyRemote(path.join(dir,'upload'),e).status,'UNVERIFIED')});
  test('G06',()=>{reset();mutate('browser.json',r=>list(r,'results').pop());assert.equal(summarize(ctx,setup).status,'UNVERIFIED');reset();mutate('fixtures/ui-runtime-compat.cjs/checkpoints.json',r=>list(r,'reached').splice(2,1));assert.equal(summarize(ctx,setup).status,'UNVERIFIED')});
  test('G07',()=>{for(const mutateIds of [(r:Record<string,unknown>)=>list(r,'results').push(item(list(r,'results'),0)),(r:Record<string,unknown>)=>item(list(r,'results'),0).name='undeclared']){reset();mutate('unit.json',mutateIds);assert.equal(summarize(ctx,setup).status,'UNVERIFIED')}reset();mutate('catalog.json',r=>list(field(r,'catalog'),'contracts').pop());assert.equal(summarize(ctx,setup).status,'UNVERIFIED');assert.throws(()=>Reflect.apply(Array.prototype.pop,suites.unit,[]),TypeError)});
  reset();const execute=(code:string)=>runCommand(process.execPath,['-e',code],{cwd:dir,log:path.join(dir,'command.log'),quiet:true});
  const crash=await execute('console.error("AssertionError [ERR_ASSERTION]: fake text");process.exit(7)');assert.equal(crash.status,'ERROR');assert.equal((await runCommand(process.execPath,['-e','console.log("empty required check")'],{cwd:dir,log:path.join(dir,'empty.log'),quiet:true,requireAssertions:true})).status,'UNVERIFIED');const diagnostic=await execute('try{require("node:assert/strict").fail("expected")}catch(e){console.error(e)}throw new TypeError("infrastructure")');assert.equal(diagnostic.status,'ERROR');assert.equal((await execute('process.exit(0)')).status,'UNVERIFIED');const tool=await runCommand(process.execPath,['-e','process.exit(0)'],{cwd:dir,log:path.join(dir,'tool.log'),quiet:true,execution:'tool'});assert.equal(tool.status,'PASS','compiler CLI explicit zero exit is a tool outcome, not an assertion contract');const badTool=await runCommand(process.execPath,['-e','process.exit(2)'],{cwd:dir,log:path.join(dir,'bad-tool.log'),quiet:true,execution:'tool'});assert.equal(badTool.status,'ERROR');const brokenTool=await runCommand(process.execPath,['-e','require("node:assert/strict").fail("compiler internal assertion")'],{cwd:dir,log:path.join(dir,'broken-tool.log'),quiet:true,execution:'tool'});assert.equal(brokenTool.status,'ERROR');const testFile=path.join(dir,'actual.test.cjs');fs.writeFileSync(testFile,"require('node:test')('actual',()=>require('node:assert/strict').equal(1,2))");assert.equal((await runCommand(process.execPath,['--test',testFile],{cwd:dir,log:path.join(dir,'node-test.log'),quiet:true})).status,'FAIL');fs.writeFileSync(testFile,"require('node:test')('skipped',{skip:true},()=>{})");assert.notEqual((await runCommand(process.execPath,['--test',testFile],{cwd:dir,log:path.join(dir,'node-test.log'),quiet:true})).status,'PASS');const multi=await runCommand(process.execPath,['--test','tests/evolution-rain-model.test.cjs','tests/evolution-scattered-shower.test.cjs'],{cwd:path.resolve(__dirname,'..'),log:path.join(dir,'multi-native.log'),quiet:true});assert.equal(multi.status,'PASS',JSON.stringify(multi));assert.ok(Array.isArray(multi.nodeTests));assert.equal(multi.nodeTests.length,9);assert.deepEqual(multi.nodeCaseIssues,[]);console.log('PASS G08');
  const receiptHelper=JSON.stringify(path.resolve(__dirname,'../scripts/ci-process-receipt.cjs'));
  const terminalAssert=await execute(`try{require('node:assert/strict').fail('F1 real terminal assertion')}catch(e){require(${receiptHelper}).terminalFailure(e)}`);
  assert.equal(terminalAssert.exitCode,0,'preserve the contradictory raw exit instead of forcing a failure code');
  assert.equal(terminalAssert.status,'FAIL','F1 terminal assertion must survive natural exit zero');
  assert.equal(terminalAssert.assertionResult,'FAIL');assert.equal(terminalAssert.terminalReceipt?.terminal,true);
  const terminalInfra=await execute(`require(${receiptHelper}).terminalFailure(new TypeError('F1 real infrastructure failure'))`);
  assert.equal(terminalInfra.exitCode,0);assert.equal(terminalInfra.status,'ERROR');
  const caught=await execute(`try{require('node:assert/strict').fail('expected caught assertion')}catch(e){console.error(e)}`);assert.equal(caught.status,'PASS');
  const toolTerminal=await runCommand(process.execPath,['-e',`try{require('node:assert/strict').fail('compiler internal assertion')}catch(e){require(${receiptHelper}).terminalFailure(e)}`],{cwd:dir,log:path.join(dir,'tool-terminal.log'),quiet:true,execution:'tool'});assert.equal(toolTerminal.status,'ERROR');assert.equal(toolTerminal.exitCode,0);
  const lingering=`try{require('node:assert/strict').fail('terminal before interruption')}catch(e){require(${receiptHelper}).terminalFailure(e)}setInterval(()=>{},1000)`;
  const timedTerminal=await runCommand(process.execPath,['-e',lingering],{cwd:dir,log:path.join(dir,'terminal-timeout.log'),quiet:true,timeoutMs:500});assert.equal(timedTerminal.terminalReceipt?.terminal,true);assert.equal(timedTerminal.status,'ERROR');assert.equal(resultStatus(timedTerminal),'ERROR');
  const controller=new AbortController(),cancelLog=path.join(dir,'terminal-cancel.log'),pendingTerminal=runCommand(process.execPath,['-e',lingering],{cwd:dir,log:cancelLog,quiet:true,signal:controller.signal});
  for(let waited=0;waited<100&& !fs.readdirSync(dir).some(n=>n.startsWith('terminal-cancel.log.assertion.json.')&&n.endsWith('.json'));waited++)await new Promise<void>(resolve=>setTimeout(resolve,20));
  controller.abort();const cancelledTerminal=await pendingTerminal;assert.equal(cancelledTerminal.terminalReceipt?.terminal,true);assert.equal(cancelledTerminal.status,'CANCELLED');assert.equal(resultStatus(cancelledTerminal),'CANCELLED');
  for(const change of [(r:typeof terminalAssert)=>{if(typeof r.pid!=='number')throw Error('Missing process id');r.pid++},(r:typeof terminalAssert)=>r.executionId='other',(r:typeof terminalAssert)=>{if(!r.terminalReceipt)throw Error('Missing terminal receipt');r.terminalReceipt.schema=99}]){const invalid=structuredClone(terminalAssert);invalid.status='PASS';change(invalid);assert.equal(resultStatus(invalid),'UNVERIFIED','terminal failure must be bound to this execution');}
  for(const [outcome,status]of [[terminalAssert,'FAIL'],[terminalInfra,'ERROR'],[timedTerminal,'ERROR'],[cancelledTerminal,'CANCELLED']] as const){
   reset();mutate('unit.json',r=>Object.assign(item(list(r,'results'),0),outcome,{status:'PASS',assertionResult:'PASS'}));
   const summary=summarize(ctx,setup);assert.equal(summary.status,status,'F1 aggregate must independently reject contradictory PASS');
   const delivery=finalizeUpload(ctx,summary);assert.equal(delivery.status,status);assert.equal(delivery.evidenceIntegrity,'INCOMPLETE');
   assert.equal(verifyRemote(path.join(dir,'upload'),expected()).status,status,'F1 downloaded evidence must keep the same failure classification');
  }
  console.log('PASS F1 terminal receipts override exit zero in execution, summary and downloaded evidence');
  for(const fields of [{assertions:'1',nodeTests:[]},{assertions:0,nodeTests:'not a test list'},{assertions:0,nodeTests:{length:1}}]){
   const code=`process.on('beforeExit',()=>{const f=require('node:fs'),p=process.env.MOODY_PROCESS_RECEIPT+'.'+process.pid+'.json',r=JSON.parse(f.readFileSync(p,'utf8'));f.writeFileSync(p,JSON.stringify({...r,...${JSON.stringify(fields)}}))})`;
   const malformed=await runCommand(process.execPath,['-e',code],{cwd:dir,log:path.join(dir,'malformed-count.log'),quiet:true,requireAssertions:true});
   assert.equal(malformed.rawStatus,'passed');assert.equal(malformed.status,'UNVERIFIED','malformed receipt fields cannot prove assertions');
  }
  console.log('PASS malformed process counts cannot satisfy required assertion evidence');

  const failed=await execute('require("node:assert/strict").equal(1,2,"controlled contract")');assert.equal(failed.status,'FAIL');
  test('G09',()=>{reset();mutate('stage-unit.json',r=>Object.assign(r,failed));fs.unlinkSync(path.join(dir,'package-contracts.json'));const d=finalizeUpload(ctx,summarize(ctx,setup));assert.equal(d.status,'FAIL');assert.equal(d.assertionResult,'FAIL');assert.equal(d.evidenceIntegrity,'INCOMPLETE');assert.ok(d.reasonCodes.includes('EvidenceIncomplete'))});
  test('G10',()=>{reset();const f=path.join(dir,'fixtures/settings-ci.cjs/viewport.jpg');fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,Buffer.alloc(524289));const d=finalizeUpload(ctx,summarize(ctx,setup));assert.equal(d.status,'PASS');assert.ok(d.omitted.some(e=>e.file.endsWith('viewport.jpg')))});
  const dependency=await runCommand('moody-missing-executable',[],{cwd:dir,log:path.join(dir,'dependency.log'),quiet:true});assert.equal(dependency.status,'ERROR');assert.equal(dependency.reasonCode,'SpawnError');console.log('PASS G11');
  const direct=await execute("const {test}=require('node:test'),assert=require('node:assert/strict');const skip=true;test('healthy',()=>assert.ok(true));test('required',{skip},()=>assert.fail())");assert.notEqual(direct.status,'PASS','direct native test cannot hide skip behind one healthy assertion');
  test('G12',()=>{assert.deepEqual(forbiddenJs("test('case',{skip:true},()=>{})"),['UndeclaredTestSelection:skip']);assert.deepEqual(forbiddenJs("const skip=true;test('required',{skip},()=>{})"),['UndeclaredTestSelection:skip']);assert.deepEqual(forbiddenJs('test.only("focused",()=>{})'),['UndeclaredTestSelection:only']);assert.deepEqual(forbiddenJs('test["skip"]("skipped",()=>{})'),['UndeclaredTestSelection:skip']);assert.deepEqual(forbiddenJs('// test.only\nconst text="test.skip";'),[]);assert.ok(forbiddenWorkflow('continue-on-error: true').includes('ContinueOnError'));assert.ok(forbiddenWorkflow('run: task || true').includes('MaskedExitCode'));assert.deepEqual(checkSourcePolicy(path.resolve(__dirname,'..')),[])});
  test('required PNG corruption',()=>{const {verifyPng}=require('../scripts/ci-png.cjs');const short=Buffer.alloc(24);Buffer.from('89504e470d0a1a0a','hex').copy(short);short.writeUInt32BE(1,16);short.writeUInt32BE(1,20);assert.throws(()=>verifyPng(short),/PNG/);const valid=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');assert.equal(verifyPng(valid).width,1);valid[valid.length-1]=(valid[valid.length-1]??0)^1;assert.throws(()=>verifyPng(valid),/PNG/)});
  test('remote trust negatives',()=>{reset();finalizeUpload(ctx,summarize(ctx,setup));const e=expected();for(const change of [(x:ReturnType<typeof expected>)=>x.run.attempt='2',(x:ReturnType<typeof expected>)=>x.nonce='old',(x:ReturnType<typeof expected>)=>x.pr.head='other',(x:ReturnType<typeof expected>)=>x.profile='research']){const wrong=structuredClone(e);change(wrong);assert.notEqual(verifyRemote(path.join(dir,'upload'),wrong).status,'PASS')}fs.writeFileSync(path.join(dir,'upload/undeclared.txt'),'extra');assert.equal(verifyRemote(path.join(dir,'upload'),e).status,'UNVERIFIED')});
  test('post-upload verifier without npm dependencies',()=>{reset();finalizeUpload(ctx,summarize(ctx,setup));const isolated=path.join(dir,'isolated'),root=path.resolve(__dirname,'..');for(const file of ['.node-version','scripts/check-node.mts','project-identity.json','scripts/ci-evidence.cjs','scripts/ci-catalog.cjs','scripts/ci-research.cjs','scripts/expected.lock.json','scripts/ci/contracts.ts','scripts/ci/source.ts','scripts/ci/context.ts','scripts/ci/process.ts','scripts/ci/lock.ts','scripts/ci/records.ts','scripts/ci/package-evidence.ts','scripts/ci/result-status.ts','scripts/ci/suite-evidence.ts','scripts/ci/upload.ts','scripts/ci/summary.ts','scripts/ci/remote.ts','scripts/ci/research-reports.ts','scripts/ci/research-upload.ts','scripts/ci/research-summary.ts','scripts/ci/renderer.ts','scripts/ci/research-families.ts','scripts/ci/research-runner.ts','scripts/ci/research-files.ts','scripts/ci-png.cjs','tests/device-case-plan.cjs']){const target=path.join(isolated,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target)}const code='const v=require('+JSON.stringify(path.join(isolated,'scripts/ci-evidence.cjs'))+').verifyRemote;const r=v('+JSON.stringify(path.join(dir,'upload'))+','+JSON.stringify(expected())+');if(r.status!=="PASS")throw Error(JSON.stringify(r))';const r=require('node:child_process').spawnSync(process.execPath,['-e',code],{cwd:isolated,encoding:'utf8'});assert.equal(r.status,0,r.stderr)});
  test('permanent project and build identity',()=>{
   for(const key of ['projectId','commit','runId','attempt']){reset();mutate('package-contracts.json',r=>field(field(item(list(r,'builds'),0),'receipt'),'buildIdentity')[key]='other');assert.equal(summarize(ctx,setup).status,'UNVERIFIED','reject stale build identity '+key)}
   reset();finalizeUpload(ctx,summarize(ctx,setup));const file=path.join(dir,'upload/identity.json'),record=read(file);field(record,'identity').projectId='00000000-0000-4000-8000-000000000000';writeJson(file,record);
   const indexFile=path.join(dir,'upload/upload-index.json'),index=read(indexFile),entry=list(index,'files').map(asRecord).find(e=>e.file==='identity.json');if(!entry)throw Error('Missing identity index entry');entry.sha256=hash(fs.readFileSync(file));entry.size=fs.statSync(file).size;writeJson(indexFile,index);
   const remote=verifyRemote(path.join(dir,'upload'),expected());assert.equal(remote.status,'UNVERIFIED');assert.ok(remote.problems.some(p=>p.reason==='Project ID mismatch'));
  });
  test('V12 sealed expected lock and terminal source',()=>{
   for(const change of [(index:Record<string,unknown>)=>delete index.seal,(index:Record<string,unknown>)=>field(index,'seal').state='OPEN',(index:Record<string,unknown>)=>field(index,'seal').expectedLockSha256='old',(index:Record<string,unknown>)=>field(index,'seal').sourceAfter={head:'changed'}]){
    reset();finalizeUpload(ctx,summarize(ctx,setup));const file=path.join(dir,'upload/upload-index.json'),index=read(file);change(index);writeJson(file,index);assert.equal(verifyRemote(path.join(dir,'upload'),expected()).status,'UNVERIFIED');
   }
   reset();mutate('browser.json',r=>r.sourceAfter={head:'changed'});assert.equal(summarize(ctx,setup).status,'UNVERIFIED');
   reset();mutate('browser.json',r=>field(item(list(r,'results'),0),'terminalReceipt').cases=[]);assert.equal(summarize(ctx,setup).status,'UNVERIFIED');
   reset();mutate('browser.json',r=>field(field(asRecord(list(r,'results').find(c=>jsonRecord(c)&&c.name==='settings-ci.cjs')),'terminalReceipt'),'graphics').contexts={});assert.equal(summarize(ctx,setup).status,'UNVERIFIED');
  });
  test('V12 deterministic indexed-byte mutations',()=>{
   for(let seed=0;seed<12;seed++){
    reset();finalizeUpload(ctx,summarize(ctx,setup));const index=read(path.join(dir,'upload/upload-index.json')),selector=Buffer.from(hash(Buffer.from('v12-corruption-'+seed)),'hex').readUInt32BE(0),entry=asRecord(list(index,'files')[selector%list(index,'files').length]);assert.ok(typeof entry.file==='string');const file=path.join(dir,'upload',entry.file),bytes=fs.readFileSync(file);bytes[selector%bytes.length]=(bytes[selector%bytes.length]??0)^1;fs.writeFileSync(file,bytes);assert.notEqual(verifyRemote(path.join(dir,'upload'),expected()).status,'PASS');
   }
  });
  assert.equal(catalogFor('release').automaticRelease,false);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
})().catch(e=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(e);process.exitCode=1});
