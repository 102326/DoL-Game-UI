// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
const assert=require('node:assert/strict');
const path=require('node:path');
const {transportVerdict}=require('../scripts/ci/transport.ts');
const {rendererProblems}=require('../scripts/ci/renderer.ts');
const {familyReports,dependenciesFor,familyFor,maturityFor}=require('../scripts/ci/research-families.ts');
const {caseProblems,sealProblems,orderEntries,canSchedule,reconcileIdentity}=require('../scripts/ci/contracts.ts');
(async()=>{
 const {spawnSync}=require('node:child_process');
 for(const composed of [false,true]){
  const plan=[{id:'entry',minimumAssertions:1},...(composed?[{id:'healthy:child',minimumAssertions:1}]:[])],entry=path.resolve('/ci-parent.cjs');
  const script=`process.argv[1]=${JSON.stringify(entry)};const assert=require('node:assert/strict'),c=require(${JSON.stringify(require.resolve('../scripts/ci/cases.ts'))});let count=0;c.setAssertionCounter(()=>count);(async()=>{await c.runCase('foreign',()=>{count++;});await assert.rejects(c.runCase('expected-failure',()=>{count++;throw Error('controlled')}));if(${composed})await c.withCaseScope('healthy',()=>c.runCase('child',()=>{count++;}));const receipt=c.finishCases();assert.deepEqual(receipt.caseIssues,[]);assert.deepEqual(receipt.cases.map(r=>r.id).sort(),${JSON.stringify(plan.map(c=>c.id).sort())});})().catch(e=>{console.error(e);process.exitCode=1})`;
  const child=spawnSync(process.execPath,['-e',script],{encoding:'utf8',env:{...process.env,NODE_OPTIONS:'--experimental-strip-types',MOODY_PROCESS_RECEIPT:'',MOODY_CASE_ENTRY:entry,MOODY_CASE_PLAN:JSON.stringify(plan),MOODY_CASE_GRANULARITY:composed?'composed':'entry'}});
  assert.equal(child.status,0,child.stderr);
 }
 const expected=[{id:'a',minimumAssertions:1},{id:'b',minimumAssertions:1}];
 const original={source:{head:'before'},run:'same',profile:'standard'},changed={...original,source:{head:'after'}};
 assert.throws(()=>reconcileIdentity(original,changed),/Run identity changed/);
 assert.deepEqual(reconcileIdentity(original,changed,true),original);
 for(const current of [{...changed,run:'other'},{...changed,profile:'research'}])assert.throws(()=>reconcileIdentity(original,current,true),/Run identity changed/);
 const healthy=expected.map(c=>({id:c.id,status:'PASS',milliseconds:1,assertions:1,path:'controlled'}));
 for(const malformed of [[null],[false],[{}],healthy.map(c=>({...c,path:null}))])assert.ok(caseProblems(expected,malformed).length);
 for(const contexts of [undefined,null,[],{'sphere:2d':'1'},{'sphere:2d':0},{'sphere:2d':1.5}])assert.ok(rendererProblems(['sphere:2d'],{contexts}).length);
 assert.deepEqual(rendererProblems(['sphere:2d'],{contexts:{'sphere:2d':1}}),[]);assert.ok(rendererProblems(['sphere:webgl'],{contexts:{'sphere:2d':1}}).length);
 assert.deepEqual(caseProblems(expected,healthy),[]);
 for(const actual of [[],healthy.slice(1),[healthy[0],healthy[0]],healthy.map(c=>({...c,assertions:0})),healthy.map(c=>({...c,status:'SKIP'}))])assert.ok(caseProblems(expected,actual).length);
 assert.ok(caseProblems([{id:'gl',minimumAssertions:1,renderer:'webgl'}],[{id:'gl',status:'PASS',assertions:1,milliseconds:1,path:'canvas2d'}]).length);
 assert.deepEqual(sealProblems({state:'SEALED',expectedLockSha256:'same',sourceAfter:{head:'x'}},'same',{head:'x'}),[]);
 for(const seal of [{},{state:'OPEN'},{state:'SEALED',expectedLockSha256:'old',sourceAfter:{head:'x'}},{state:'SEALED',expectedLockSha256:'same',sourceAfter:{head:'changed'}}])assert.ok(sealProblems(seal,'same',{head:'x'}).length);
 assert.deepEqual(orderEntries(['a','b','c'],'fixed'),orderEntries(['a','b','c'],'fixed'));
 assert.deepEqual([...orderEntries(['a','b','c'],'fixed')].sort(),['a','b','c']);
 assert.equal(canSchedule(['build'],{build:'FAIL'}),false);assert.equal(canSchedule([],{other:'FAIL'}),true);
 assert.deepEqual(dependenciesFor('golden-spin-hub'),[]);assert.deepEqual(dependenciesFor('evolution-weather-levels'),['weather-build']);assert.equal(familyFor('settings-ci'),'production');assert.equal(maturityFor('settings-ci'),'Contract');
 const families=familyReports({},['golden-spin-hub','settings-build','settings-ci','weather-unit'],[{name:'golden-spin-hub',status:'ERROR'},{name:'settings-build',status:'PASS'},{name:'settings-ci',status:'PASS'},{name:'weather-unit',status:'PASS'}],{});
 assert.deepEqual(families.map(f=>f.status),['ERROR','PASS','PASS','PASS']);assert.ok(familyReports({},[],[],{}).every(f=>f.status==='UNVERIFIED'&&f.seal.state==='INCOMPLETE'));
 assert.equal(transportVerdict({status:'PASS'},{upload:'failure'}).status,'ERROR');assert.equal(transportVerdict({status:'FAIL',assertionResult:'FAIL'},{upload:'failure'}).status,'FAIL');assert.ok(transportVerdict({status:'PASS'},{download:'failure'}).reasonCodes.includes('evidence_download'));
 const timed=transportVerdict({status:'ERROR',reasonCodes:['ProcessTimeout']},{producer:'cancelled'});assert.equal(timed.status,'ERROR');assert.ok(timed.reasonCodes.includes('ProcessTimeout'));
 console.log('PASS V1.2 exact cases, assertions, renderer, seal, source, lock and independent dependencies');
})().catch(e=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(e);process.exitCode=1});
