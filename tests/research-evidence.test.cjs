const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {plan,caseIds,recordReport,researchSummary,researchUpload,stamp,runResearch}=require('../scripts/ci-research.cjs');
const {writeJson,hash}=require('../scripts/ci-evidence.cjs');
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moody-research-'));
 const ctx={root:dir,dir:path.join(dir,'evidence'),identity:{source:{head:'controlled-head'},run:{id:'controlled-run',attempt:'2'}}};
 fs.mkdirSync(ctx.dir,{recursive:true});
 const pass={status:'PASS',rawStatus:'passed',exitCode:0,milliseconds:1};
 const report={schema:1,identity:ctx.identity,suite:'research',expected:plan.map(c=>c.id),status:'PASS',results:[]};
 try{
  for(const check of plan){
   const spec=check.report;let data,ids=['command:'+check.id],file;
   if(spec){
    if(spec.fixture){data={identity:ctx.identity,assertion:{code:'ERR_ASSERTION',message:'MOODY_ORBIT_NONFINITE: controlled geometry'},snapshot:{expectedCounterexample:true}};ids=['MOODY_ORBIT_NONFINITE'];file='fixtures/moody-historical-regressions.cjs/snapshot.json'}
    else{
     if(spec.shape==='inventory')data={schema:1,sourceBase:ctx.identity.source.head,consumers:[{file:'controlled.ts'}]};
     else if(spec.shape==='settings')data={mounted:{workspaces:1},queued:{frames:1},disposed:{frames:0,workspaces:0},late:{frames:0,workspaces:0}};
     else if(spec.shape==='glass')data={results:[{scene:'material',displacementPixelCheck:'PASS: controlled'},{candidate:'glass',lifecycleChecked:true}]};
     else if(spec.shape==='shower')data={events:[],transitions:Array(7).fill({}),states:[...(spec.count===3?['light','severe']:['light','normal','heavy','severe']).map(rain=>({target:{kind:'rain',rain}})),{target:{kind:'snow'}}]};
     else{const values=spec.expected.map(v=>spec.key?{[spec.key]:v}:v);data=values;if(spec.field){data={};let target=data;const keys=spec.field.split('.');for(const key of keys.slice(0,-1))target=target[key]={};target[keys.at(-1)]=values}}
     if(spec.field==='checks')Object.assign(data,{errors:[],scope:'Controlled named-check fixture'});
     ids=caseIds(spec,data,ctx);file=`research/${check.id}/result.json`;
    }
    writeJson(path.join(ctx.dir,file),data);
   }
   report.results.push({name:check.id,...pass,caseIds:ids,artifacts:spec?[{file,sha256:hash(fs.readFileSync(path.join(ctx.dir,file)))}]:[]});
  }
  const save=()=>writeJson(path.join(ctx.dir,'research.json'),report);
  const summary=()=>researchSummary(ctx);
  save();for(const id of ['dependencies','browser-install'])writeJson(path.join(ctx.dir,`stage-${id}.json`),{schema:1,identity:ctx.identity,...pass});
  writeJson(path.join(ctx.dir,'identity.json'),{schema:1,identity:ctx.identity});
  assert.equal(summary().status,'PASS');
  assert.equal(researchUpload(ctx,summary()).status,'PASS','complete required evidence; optional screenshots absent');
  fs.rmSync(path.join(ctx.dir,'upload'),{recursive:true});
  const flat=report.results.find(r=>r.name==='evolution-owner-resources').artifacts[0],timed=report.results.find(r=>r.name==='golden-spin-b').artifacts[0];
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
  for(const mutate of [r=>r.schema=99,r=>r.identity.run.attempt='1',r=>r.identity.source.head='old',r=>r.results.pop(),r=>r.expected.pop(),r=>r.results[0].status='FAIL',r=>r.results[0].rawStatus='cancelled',r=>r.results[0].caseIds=[]]){
   const original=structuredClone(report);mutate(report);save();assert.notEqual(summary().status,'PASS','schema/source/attempt/plan/failure/cancel/case mutation rejected');Object.assign(report,original);
  }
  save();
  const historicFile=path.join(ctx.dir,'fixtures/moody-historical-regressions.cjs/snapshot.json'),historic=JSON.parse(fs.readFileSync(historicFile));
  const historicCheck=plan.find(c=>c.id==='moody-historical-regressions');
  assert.deepEqual(recordReport(ctx,historicCheck,new Map()).caseIds,['MOODY_ORBIT_NONFINITE']);
  for(const assertion of [{code:'ERR_ASSERTION',message:'MOODY_ORBIT_POSITION: different error'},{code:'SyntaxError',message:'MOODY_ORBIT_NONFINITE: fake'}]){
   writeJson(historicFile,{...historic,assertion});assert.throws(()=>recordReport(ctx,historicCheck,new Map()),/wrong failure/);
  }
  writeJson(historicFile,historic);
  const specimen=report.results.find(r=>r.name==='golden-spin-b'),rawFile=path.join(ctx.dir,specimen.artifacts[0].file),bytes=fs.readFileSync(rawFile);
  fs.unlinkSync(rawFile);assert.notEqual(summary().status,'PASS','missing required report');fs.writeFileSync(rawFile,bytes);
  fs.appendFileSync(rawFile,' ');assert.notEqual(summary().status,'PASS','invalid raw hash');fs.writeFileSync(rawFile,bytes);
  for(const mutation of [data=>data.checks.pop(),data=>data.checks[1]=data.checks[0],data=>data.sourceHead='old',data=>data.identity={head:'old'},data=>delete data.errors]){
   const data=JSON.parse(bytes);mutation(data);writeJson(rawFile,data);specimen.artifacts[0].sha256=hash(fs.readFileSync(rawFile));save();assert.notEqual(summary().status,'PASS','missing/duplicate cases rejected even with updated hash');
  }
  fs.writeFileSync(rawFile,bytes);specimen.artifacts[0].sha256=hash(bytes);save();assert.equal(summary().status,'PASS');
  const hubSpec=plan.find(c=>c.id==='golden-spin-hub-input').report;
  assert.deepEqual(caseIds(hubSpec,{checks:hubSpec.expected,errors:[],baseline:false,revision:'working tree'},ctx),hubSpec.expected,'existing Hub input schema does not require prose metadata');
  const source=path.join(dir,'tests/artifacts/golden-spin-b/sphere-validation-123/result.json');writeJson(source,JSON.parse(bytes));
  assert.throws(()=>recordReport(ctx,plan.find(c=>c.id==='golden-spin-b'),new Map([[source,stamp(source)]])),/fresh required report/,'stale source cannot be rebound as this run');
  // A dist file alone cannot substitute for any structured report.
  fs.unlinkSync(source);writeJson(path.join(dir,'tests/artifacts/golden-spin-b/dist/result.json'),{});
  assert.throws(()=>recordReport(ctx,plan.find(c=>c.id==='golden-spin-b'),new Map()),/fresh required report/);
  assert.notEqual(researchSummary(ctx,{research:{outcome:'cancelled'}}).status,'PASS');
  const result=await runResearch(ctx,{quiet:true,checks:[{id:'fails',command:process.execPath,args:['-e','process.exit(7)']},{id:'blocked',command:process.execPath,args:['-e','throw Error("must not execute")']}]});
  assert.deepEqual(result.results.map(r=>r.status),['FAIL','BLOCKED']);
  console.log('PASS research evidence: full profile, source/run/attempt/schema, missing/stale/dist-only/hash/case negatives, command failure and fail-fast');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
