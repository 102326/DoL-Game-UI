// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import fixtures = require('./ci-fixtures.cjs');
const {healthyCaseFields}=fixtures;
import families = require('../scripts/ci/research-families.ts');
const {familyReports}=families;
import assert = require('node:assert/strict');
import fs = require('node:fs');
import os = require('node:os');
import path = require('node:path');
import research = require('../scripts/ci-research.cjs');
const {plan,caseIds,recordReport,researchSummary,researchUpload,stamp,runResearch}=research;
import catalog = require('../scripts/ci-catalog.cjs');
const {catalogFor,catalogIdentity,visualEvidence,researchUnitEntries,nodeTestCases,nodeCaseIds,commandCaseIds}=catalog;
import evidence = require('../scripts/ci-evidence.cjs');
const {writeJson,hash,runCommand,verifyRemote}=evidence;
type Status='PASS'|'FAIL'|'ERROR'|'UNVERIFIED'|'CANCELLED';
type Artifact={file:string;sha256:string;origin?:string};
type TestResult={name:string;status:Status;rawStatus:string;caseIds:(string|number)[];artifacts:Artifact[];nodeTests?:{id:string;status:string}[];assertions:number;[key:string]:unknown};
type TestReport={schema:number;identity:{projectId:string;profile:string;catalog:ReturnType<typeof catalogIdentity>;source:{head:string};run:{id:string;attempt:string}};suite:string;sourceAfter:{head:string};expected:string[];status:Status;results:TestResult[]};
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const object=(v:unknown):Record<string,unknown>=>{if(!record(v))throw Error('Invalid controlled research object');return v};
const list=(v:unknown,key:string):unknown[]=>{const x=object(v)[key];if(!Array.isArray(x))throw Error('Invalid controlled research list: '+key);return x};
const field=(v:unknown,key:string)=>object(object(v)[key]);
const item=(values:unknown[],index:number)=>object(values[index]);
const must=<T,>(v:T|null|undefined):T=>{if(v==null)throw Error('Missing controlled research value');return v};
const read=(file:string)=>object(JSON.parse(fs.readFileSync(file,'utf8')));
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moody-research-'));
 const projectId=object(JSON.parse(fs.readFileSync(path.resolve('project-identity.json'),'utf8'))).projectId;assert.ok(typeof projectId==='string');
 const ctx={root:dir,dir:path.join(dir,'evidence'),identity:{projectId,profile:'research',catalog:catalogIdentity('research'),source:{head:'controlled-head'},run:{id:'controlled-run',attempt:'2'}}};
 fs.mkdirSync(ctx.dir,{recursive:true});
 const pass:{status:'PASS';rawStatus:string;exitCode:number;milliseconds:number;assertions:number}={status:'PASS',rawStatus:'passed',exitCode:0,milliseconds:1,assertions:1};
 const report:TestReport={schema:1,identity:ctx.identity,suite:'research',sourceAfter:ctx.identity.source,expected:plan.map(c=>c.id),status:'PASS',results:[]};
 try{
  writeJson(path.join(ctx.dir,'unit.json'),{schema:1,identity:ctx.identity,status:'PASS',sourceAfter:ctx.identity.source,suite:'unit',expected:researchUnitEntries,results:researchUnitEntries.map(name=>({name,...pass,...healthyCaseFields(name),assertions:1,nodeTests:nodeTestCases[name]?.map(n=>({id:name+'::'+n,status:'PASS'}))}))});
  writeJson(path.join(ctx.dir,'catalog.json'),{schema:1,identity:ctx.identity,catalog:catalogFor('research')});
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
  for(const [id,files]of Object.entries(visualEvidence))for(const file of files){const target=path.join(ctx.dir,'review',id,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,png)}
  for(const check of plan){
   const spec=check.report;let data:unknown,ids:(string|number)[]=commandCaseIds(check),file:string|undefined;
   if(spec){
    if(spec.fixture){data={identity:ctx.identity,assertion:{code:'ERR_ASSERTION',message:'MOODY_ORBIT_NONFINITE: controlled geometry'},snapshot:{expectedCounterexample:true}};ids=['MOODY_ORBIT_NONFINITE'];file='fixtures/moody-historical-regressions.cjs/snapshot.json'}
    else{
     if(spec.shape==='inventory')data={schema:1,sourceBase:ctx.identity.source.head,consumers:[{file:'controlled.ts'}]};
     else if(spec.shape==='settings')data={mounted:{workspaces:1},queued:{frames:1},disposed:{frames:0,workspaces:0},late:{frames:0,workspaces:0}};
     else if(spec.shape==='glass')data={results:[{scene:'material',displacementPixelCheck:'PASS: controlled'},{candidate:'glass',lifecycleChecked:true}]};
     else if(spec.shape==='shower')data={events:[],transitions:Array(7).fill({}),states:[...(spec.count===3?['light','severe']:['light','normal','heavy','severe']).map(rain=>({target:{kind:'rain',rain}})),{target:{kind:'snow'}}]};
     else{const values=must(spec.expected).map(v=>spec.key?{[spec.key]:v}:v);data=values;if(spec.field){const rootValue:Record<string,unknown>={};data=rootValue;let target=rootValue;const keys=spec.field.split('.');for(const key of keys.slice(0,-1)){const child:Record<string,unknown>={};target[key]=child;target=child}target[must(keys.at(-1))]=values}}
     if(spec.field==='checks')Object.assign(object(data),{errors:[],scope:'Controlled named-check fixture'});
     ids=caseIds(spec,data,ctx);file=`research/${check.id}/result.json`;
    }
    writeJson(path.join(ctx.dir,must(file)),data);
   }
   report.results.push({name:check.id,...healthyCaseFields(check.args.find(a=>a.endsWith('.cjs'))?.split('/').at(-1)??''),nodeTests:nodeCaseIds(check.args).length?nodeCaseIds(check.args).map(id=>({id,status:'PASS'})):undefined,...pass,caseIds:ids,artifacts:spec?[{file:must(file),sha256:hash(fs.readFileSync(path.join(ctx.dir,must(file))))}]:[]});
  }
  const save=()=>{writeJson(path.join(ctx.dir,'research.json'),report);for(const family of familyReports(ctx.identity,report.expected,report.results,report.sourceAfter))writeJson(path.join(ctx.dir,'families',family.family+'.json'),family);};
  const summary=()=>researchSummary(ctx);
  save();for(const id of ['dependencies','browser-install'])writeJson(path.join(ctx.dir,`stage-${id}.json`),{schema:1,identity:ctx.identity,...pass});
  writeJson(path.join(ctx.dir,'identity.json'),{schema:1,identity:ctx.identity});
  assert.equal(summary().status,'PASS');
  assert.equal(researchUpload(ctx,summary()).status,'PASS','complete required evidence; all declared T1 frames present; optional diagnostics absent');
  fs.rmSync(path.join(ctx.dir,'upload'),{recursive:true});
  const visual=path.join(ctx.dir,'review/golden-spin-b/charge.png');fs.unlinkSync(visual);assert.equal(researchUpload(ctx,summary()).status,'UNVERIFIED','missing required T1 frame cannot pass');fs.rmSync(path.join(ctx.dir,'upload'),{recursive:true});fs.writeFileSync(visual,png);
  const proofExpected=()=>({checkoutSHA:ctx.identity.source.head,source:ctx.identity.source,profile:'research',nonce:undefined,run:ctx.identity.run,pr:undefined,manifestSha256:hash(fs.readFileSync(path.join(ctx.dir,'upload/upload-index.json')))});
  const helper=JSON.stringify(path.resolve(__dirname,'../scripts/ci-process-receipt.cjs'));
  for(const [code,status]of ([[`try{require('node:assert/strict').fail('F1 research terminal assertion')}catch(e){require(${helper}).terminalFailure(e)}`,'FAIL'],[`require(${helper}).terminalFailure(new TypeError('F1 research terminal infrastructure'))`,'ERROR']] as const)){
   const actual=await runCommand(process.execPath,['-e',code],{cwd:dir,log:path.join(dir,'terminal.log'),quiet:true});assert.equal(actual.exitCode,0);
   const target=must(report.results.find(r=>r.name==='official-game-motion')),prior=structuredClone(target);Object.assign(target,actual,{status:'PASS',assertionResult:'PASS'});save();
   assert.equal(summary().status,status);assert.equal(researchUpload(ctx,summary()).status,status);assert.equal(verifyRemote(path.join(ctx.dir,'upload'),proofExpected()).status,status);fs.rmSync(path.join(ctx.dir,'upload'),{recursive:true});
   for(const key of Object.keys(target))delete target[key];Object.assign(target,prior);save();
   for(const stage of ['dependencies','browser-install']){
    const file=path.join(ctx.dir,`stage-${stage}.json`),original=read(file);writeJson(file,{...original,...actual,status:'PASS',assertionResult:'PASS'});
    assert.equal(summary().status,'ERROR','F1 research tool stages retain terminal failure despite claimed PASS');writeJson(file,original);
   }
   const unitIndex=read(path.join(ctx.dir,'unit.json')),resultFile=item(list(unitIndex,'results'),0).resultFile;assert.ok(typeof resultFile==='string');const unitFile=path.join(ctx.dir,resultFile),unitOriginal=read(unitFile),unitPoisoned=structuredClone(unitOriginal);Object.assign(field(unitPoisoned,'result'),actual,{status:'PASS',assertionResult:'PASS'});writeJson(unitFile,unitPoisoned);
   assert.equal(summary().status,status,'F1 research required unit subentries retain terminal failure despite claimed PASS');writeJson(unitFile,unitOriginal);
  }
  for(const id of ['official-game-motion','game-first-motion','panels-framework']){
   const check=must(plan.find(c=>c.id===id)),target=must(report.results.find(r=>r.name===id)),prior=structuredClone(target);
   const isolated={...ctx,dir:path.join(dir,'empty-'+id)};
   const empty=await runResearch(isolated,{checks:[{...check,args:['-e','console.log("controlled empty research contract")']}],quiet:true});
   assert.equal(empty.status,'UNVERIFIED','F2 execution rejects '+id+' with zero assertions');
   target.assertions=0;delete target.nodeTests;save();assert.equal(summary().status,'UNVERIFIED','F2 summary rejects empty '+id);
   assert.equal(researchUpload(ctx,summary()).status,'UNVERIFIED');assert.equal(verifyRemote(path.join(ctx.dir,'upload'),proofExpected()).status,'UNVERIFIED','F2 downloaded re-evaluation rejects empty contract');fs.rmSync(path.join(ctx.dir,'upload'),{recursive:true});
   Object.assign(target,prior);save();
   const healthy=await runResearch({...ctx,dir:path.join(dir,'healthy-'+id)},{checks:[{...check,args:['-e','require("node:assert/strict").ok(true)']}],quiet:true});assert.equal(healthy.status,'PASS');
  }
  const compiler=must(plan.find(c=>c.id==='settings-types'));const tool=await runResearch({...ctx,dir:path.join(dir,'zero-assert-tool')},{checks:[{...compiler,args:['-e','process.exit(0)']}],quiet:true});assert.equal(tool.status,'PASS','F2 legitimate compiler tool needs no product assertion');
  assert.equal(summary().status,'PASS');console.log('PASS F1/F2 research execution, summary and downloaded evidence controls');
  const flat=must(must(report.results.find(r=>r.name==='evolution-owner-resources')).artifacts[0]),timed=must(must(report.results.find(r=>r.name==='golden-spin-b')).artifacts[0]);
  flat.origin='tests/artifacts/evolution/owners.json';timed.origin='tests/artifacts/golden-spin-b/sphere-validation-456/result.json';
  writeJson(path.join(dir,flat.origin),{});writeJson(path.join(dir,timed.origin),{});
  const unrelated=path.join(dir,'tests/artifacts/evolution/weather-r9-456/unrelated.png');fs.mkdirSync(path.dirname(unrelated),{recursive:true});fs.writeFileSync(unrelated,'unrelated controlled pixels');
  const timedDir=path.dirname(path.join(dir,timed.origin));fs.writeFileSync(path.join(timedDir,'wanted.png'),'controlled case pixels');writeJson(path.join(timedDir,'geometry.json'),{controlled:true});fs.symlinkSync(path.join(timedDir,'wanted.png'),path.join(timedDir,'linked.png'));fs.mkdirSync(path.join(timedDir,'nested'));fs.writeFileSync(path.join(timedDir,'nested/unrelated.png'),'nested controlled pixels');
  const buildDir=path.join(dir,'tests/artifacts/evolution/weather-dist');fs.mkdirSync(buildDir,{recursive:true});
  for(const file of ['comparison.mp4','baseline.png','provenance.json','private.save'])fs.writeFileSync(path.join(buildDir,file),'controlled first-party fixture');
  for(const file of ['golden-spin-b/bundle-sizes.json','settings-refraction-v1/provenance.json','settings-refraction-v1/unrelated.json'])writeJson(path.join(dir,'tests/artifacts',file),{controlled:true});
  save();researchUpload(ctx,summary());
  assert.equal(fs.existsSync(path.join(ctx.dir,'upload/review/evolution-owner-resources/unrelated.png')),false,'flat report must not sweep sibling weather directories');
  assert.equal(fs.existsSync(path.join(ctx.dir,'upload/review/golden-spin-b/wanted.png')),true,'keep same-case direct review images');
  assert.equal(fs.existsSync(path.join(ctx.dir,'upload/review/golden-spin-b/geometry.json')),true,'keep same-case auxiliary geometry JSON');
  assert.equal(fs.existsSync(path.join(ctx.dir,'upload/review/golden-spin-b/linked.png')),false,'direct review symlink must not be dereferenced');
  assert.equal(fs.existsSync(path.join(ctx.dir,'upload/review/golden-spin-b/unrelated.png')),false,'review whitelist is direct-child only');
  for(const file of ['comparison.mp4','baseline.png','provenance.json'])assert.equal(fs.existsSync(path.join(ctx.dir,'upload/builds/evolution/weather-dist',file)),true,'preserve first-party comparison build asset: '+file);
  assert.equal(fs.existsSync(path.join(ctx.dir,'upload/builds/evolution/weather-dist/private.save')),false,'save files never enter the build whitelist');
  for(const file of ['golden-spin-b/bundle-sizes.json','settings-refraction-v1/provenance.json'])assert.equal(fs.existsSync(path.join(ctx.dir,'upload/build-metadata',file)),true,'preserve explicit original build metadata: '+file);
  assert.equal(fs.existsSync(path.join(ctx.dir,'upload/build-metadata/settings-refraction-v1/unrelated.json')),false,'metadata uses exact paths rather than scanning parent');
  fs.rmSync(path.join(ctx.dir,'upload'),{recursive:true});fs.unlinkSync(path.join(dir,'tests/artifacts/golden-spin-b/bundle-sizes.json'));fs.symlinkSync(path.join(dir,'tests/artifacts/settings-refraction-v1/provenance.json'),path.join(dir,'tests/artifacts/golden-spin-b/bundle-sizes.json'));researchUpload(ctx,summary());
  assert.equal(fs.existsSync(path.join(ctx.dir,'upload/build-metadata/golden-spin-b/bundle-sizes.json')),false,'explicit metadata symlink is rejected');
  fs.rmSync(path.join(ctx.dir,'upload'),{recursive:true});fs.rmSync(path.join(dir,'tests'),{recursive:true});delete flat.origin;delete timed.origin;save();
  const external=fs.mkdtempSync(path.join(os.tmpdir(),'moody-outside-'));
  try {
   fs.writeFileSync(path.join(external,'private.html'),'must never upload');
   const evolution=path.join(dir,'tests/artifacts/evolution');fs.mkdirSync(evolution,{recursive:true});
   fs.symlinkSync(external,path.join(evolution,'weather-dist'),'dir');
   researchUpload(ctx,summary());
   assert.equal(fs.existsSync(path.join(ctx.dir,'upload/builds/evolution/weather-dist/private.html')),false,'dist root symlink rejected before copying');
   fs.rmSync(path.join(ctx.dir,'upload'),{recursive:true});fs.unlinkSync(path.join(evolution,'weather-dist'));fs.rmdirSync(evolution);
   fs.mkdirSync(path.join(external,'weather-dist'));fs.writeFileSync(path.join(external,'weather-dist/private.html'),'must never upload');
   fs.symlinkSync(external,evolution,'dir');researchUpload(ctx,summary());
   assert.equal(fs.existsSync(path.join(ctx.dir,'upload/builds/evolution/weather-dist/private.html')),false,'escaped parent symlink rejected before copying');
   fs.rmSync(path.join(ctx.dir,'upload'),{recursive:true});fs.unlinkSync(evolution);
  } finally {fs.rmSync(external,{recursive:true,force:true})}
  for(const mutate of ([(r:typeof report)=>r.schema=99,(r:typeof report)=>r.identity.run.attempt='1',(r:typeof report)=>r.identity.source.head='old',(r:typeof report)=>r.results.pop(),(r:typeof report)=>r.expected.pop(),(r:typeof report)=>must(r.results[0]).status='FAIL',(r:typeof report)=>must(r.results[0]).rawStatus='cancelled',(r:typeof report)=>must(r.results[0]).caseIds=[]] as const)){
   const original=structuredClone(report);mutate(report);save();assert.notEqual(summary().status,'PASS','schema/source/attempt/plan/failure/cancel/case mutation rejected');Object.assign(report,original);
  }
  save();const native=must(report.results.find(r=>r.name==='weather-unit'));for(const change of ([(r:TestResult)=>must(r.nodeTests).pop(),(r:TestResult)=>must(r.nodeTests).push(must(must(r.nodeTests)[0])),(r:TestResult)=>must(must(r.nodeTests)[0]).id='unknown',(r:TestResult)=>must(must(r.nodeTests)[0]).status='SKIP',(r:TestResult)=>delete r.nodeTests] as const)){const prior=structuredClone(native);change(native);save();assert.notEqual(summary().status,'PASS','native weather cases cannot be missing/duplicated/unknown/skipped');Object.assign(native,prior)}save();
  const historicFile=path.join(ctx.dir,'fixtures/moody-historical-regressions.cjs/snapshot.json'),historic=read(historicFile);
  const historicCheck=must(plan.find(c=>c.id==='moody-historical-regressions'));
  assert.deepEqual(recordReport(ctx,historicCheck,new Map()).caseIds,['MOODY_ORBIT_NONFINITE']);
  for(const assertion of [{code:'ERR_ASSERTION',message:'MOODY_ORBIT_POSITION: different error'},{code:'SyntaxError',message:'MOODY_ORBIT_NONFINITE: fake'}]){
   writeJson(historicFile,{...historic,assertion});assert.throws(()=>recordReport(ctx,historicCheck,new Map()),/wrong failure/);
  }
  writeJson(historicFile,historic);
  const specimen=must(report.results.find(r=>r.name==='golden-spin-b')),rawFile=path.join(ctx.dir,must(specimen.artifacts[0]).file),bytes=fs.readFileSync(rawFile);
  fs.unlinkSync(rawFile);assert.notEqual(summary().status,'PASS','missing required report');fs.writeFileSync(rawFile,bytes);
  fs.appendFileSync(rawFile,' ');assert.notEqual(summary().status,'PASS','invalid raw hash');fs.writeFileSync(rawFile,bytes);
  for(const mutation of ([(data:Record<string,unknown>)=>list(data,'checks').pop(),(data:Record<string,unknown>)=>{const checks=list(data,'checks');checks[1]=checks[0]},(data:Record<string,unknown>)=>data.sourceHead='old',(data:Record<string,unknown>)=>data.identity={head:'old'},(data:Record<string,unknown>)=>delete data.errors] as const)){
   const data=object(JSON.parse(bytes.toString('utf8')));mutation(data);writeJson(rawFile,data);must(specimen.artifacts[0]).sha256=hash(fs.readFileSync(rawFile));save();assert.notEqual(summary().status,'PASS','missing/duplicate cases rejected even with updated hash');
  }
  fs.writeFileSync(rawFile,bytes);must(specimen.artifacts[0]).sha256=hash(bytes);save();assert.equal(summary().status,'PASS');
  const hubSpec=must(must(plan.find(c=>c.id==='golden-spin-hub-input')).report);
  assert.deepEqual(caseIds(hubSpec,{checks:hubSpec.expected,errors:[],baseline:false,revision:'working tree'},ctx),hubSpec.expected,'existing Hub input schema does not require prose metadata');
  const source=path.join(dir,'tests/artifacts/golden-spin-b/sphere-validation-123/result.json');writeJson(source,object(JSON.parse(bytes.toString('utf8'))));
  assert.throws(()=>recordReport(ctx,must(plan.find(c=>c.id==='golden-spin-b')),new Map([[source,stamp(source)]])),/fresh required report/,'stale source cannot be rebound as this run');
  // A dist file alone cannot substitute for any structured report.
  fs.unlinkSync(source);writeJson(path.join(dir,'tests/artifacts/golden-spin-b/dist/result.json'),{});
  assert.throws(()=>recordReport(ctx,must(plan.find(c=>c.id==='golden-spin-b')),new Map()),/fresh required report/);
  assert.notEqual(researchSummary(ctx,{research:{outcome:'cancelled'}}).status,'PASS');
  const result=await runResearch(ctx,{quiet:true,checks:[{id:'fails',command:process.execPath,args:['-e','process.exit(7)']},{id:'blocked',command:process.execPath,args:['-e','throw Error("must not execute")']}]});
  assert.deepEqual(result.results.map(r=>r.status),['ERROR','ERROR']);
  console.log('PASS research evidence: full profile, source/run/attempt/schema, missing/stale/dist-only/hash/case negatives, independent command failure without cross-family fail-fast');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
})().catch(e=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(e);process.exitCode=1});
