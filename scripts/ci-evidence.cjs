// Moody Blues: evidence for the existing CI runner, using Node built-ins only.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {sealProblems,classify,overall,verdict,exactIds,sameIdentity,requiredPackages}=require('./ci/contracts.ts');
const {writeSuite,hydrateSuite,writeJson,safeFile,readJsonBounded,captureMeta,evidenceMeta,fixtureChecks,readReport,checkpointEvidence}=require('./ci/records.ts');
const {entryDeclaration,entryCaseProblems,expectedLockSha256}=require('./ci/lock.ts');
const root = path.resolve(__dirname, '..');
const { suites, stages, catalogFor, catalogIdentity,checkpoints,nodeTestCases,researchUnitEntries,projectId } = require('./ci-catalog.cjs');
const coverage = 'Controlled fixtures and source contracts only; not real DoL/ModLoader, Windows or Android acceptance.';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

const {sourceIdentity,observeSource}=require('./ci/source.ts');

const {context}=require('./ci/context.ts');

const {runCommand}=require('./ci/process.ts');

function resultStatus(result, execution=result?.execution||'contract') {
  const receipt=result?.terminalReceipt;
  if (!receipt?.terminal) return result?.status||'UNVERIFIED';
  if (receipt.schema!==1 || !result.executionId || receipt.executionId!==result.executionId || !Number.isSafeInteger(result.pid) || receipt.pid!==result.pid) return 'UNVERIFIED';
  if (result.rawStatus==='cancelled') return 'CANCELLED';
  if (['timeout','spawn-error','signal'].includes(result.rawStatus)) return 'ERROR';
  const assertion=execution==='contract' && receipt.kind==='assertion' && receipt.code==='ERR_ASSERTION' && receipt.name==='AssertionError';
  return overall([result.status||'UNVERIFIED', assertion?'FAIL':'ERROR']);
}
function verifiedPass(result, execution=result?.execution||'contract') {
  return result?.status === 'PASS' && resultStatus(result,execution)==='PASS' && result.rawStatus === 'passed' && result.exitCode === 0 &&
    !result.signal && Number.isFinite(result.milliseconds) && result.milliseconds >= 0;
}

function suiteEvidence(ctx,mode,expected=suites[mode]){const suite=readReport(ctx,mode+'.json');return !!suite&&suite.schema===1&&suite.status==='PASS'&&sameIdentity(suite.expected,expected)&&suite.results?.length===expected.length&&suite.results.every((r,i)=>r.name===expected[i]&&verifiedPass(r)&&(r.assertions>0||r.nodeTests?.length>0)&&(!nodeTestCases[r.name]||(exactIds(nodeTestCases[r.name].map(n=>r.name+'::'+n),r.nodeTests?.map(c=>c.id))&&r.nodeTests.every(c=>c.status==='PASS')&&!r.nodeCaseIssues?.length))&&checkpointEvidence(ctx,r.name)&&entryCaseProblems(r.name,r).length===0)&&sameIdentity(suite.sourceAfter,ctx.identity.source);}
function layoutEvidence(ctx) {
  const report = readReport(ctx, 'fixtures/device-layouts.cjs/layout-report.json');
  if (!report || report.status !== 'PASS') return false;
  try {
    const depth = ctx.identity.environment?.deviceDepth || 'standard';
    const expected = require('../tests/device-case-plan.cjs').expectedCaseIds(depth);
    return report.depth === depth && expected.length > 0 && report.results?.length === expected.length &&
      new Set(report.results.map(r => r.id)).size === expected.length &&
      report.results.every(r => expected.includes(r.id) && r.status === 'PASS');
  } catch { return false; }
}


function packageEvidence(ctx) {
  // Malformed or partial evidence must not prevent the whole-run summary/upload.
  try {
    const report = readReport(ctx, 'package-contracts.json');
    if (!report || report.kind !== 'package-contracts' || report.status !== 'PASS' || (report.versionSources?.status !== 'PASS' || report.versionSources?.projectId!==ctx.identity.projectId) || report.reproducibility?.status !== 'PASS' || !Array.isArray(report.reproducibility.differences) || report.reproducibility.differences.length !== 0) return false;
    const namesMatch = values => Array.isArray(values) && values.length === requiredPackages.length && new Set(values).size === requiredPackages.length && values.every(name => requiredPackages.includes(name));
    const expectedBuild={projectId:ctx.identity.projectId,commit:ctx.identity.source.head,runId:ctx.identity.run.githubRunId||ctx.identity.run.id,attempt:ctx.identity.run.attempt};
    if(!sameIdentity(report.buildIdentity,expectedBuild))return false;
    const negatives = report.negativeTests;
    const requiredNegatives = ['test_rejects_broken_packages', 'test_ignores_source_mtime_and_permissions', 'test_rejects_mismatches_in_independent_sources', 'test_all_current_positive_and_precise_mutations', 'test_joint_manifest_corruption_and_incomplete_compilation', 'test_metadata_drift_and_comparison_diagnostics', 'test_stale_incomplete_receipts_and_report_limit'];
    if (!Array.isArray(report.contracts) || !namesMatch(report.expectedPackages) || !namesMatch(report.contracts.map(p => p.name)) || !report.contracts.every(p => p.status === 'PASS' && /^[a-f0-9]{64}$/.test(p.sha256))) return false;
    if (negatives?.status !== 'PASS' || !Array.isArray(negatives.plan) || !requiredNegatives.every(name => negatives.plan.some(id => typeof id === 'string' && id.endsWith('.' + name))) || new Set(negatives.plan).size !== negatives.plan.length || negatives.testsRun !== negatives.plan.length || ['failures', 'errors', 'skipped', 'expectedFailures', 'unexpectedSuccesses'].some(field => negatives[field] !== 0)) return false;
    if (!Array.isArray(report.builds) || report.builds.length !== 2 || !report.builds.every(b => sameIdentity(b.receipt?.buildIdentity,expectedBuild) && typeof b.receipt?.invocation === 'string' && b.receipt.invocation && sameIdentity(b.receipt.source, ctx.identity.source) && b.receipt.runId === ctx.identity.run.id && Array.isArray(b.receipt.packages) && namesMatch(b.receipt.packages.map(p => p.name)) && Array.isArray(b.snapshots) && b.snapshots.length === requiredPackages.length && new Set(b.snapshots.map(s => s.file)).size === requiredPackages.length)) return false;
    if (report.builds[0].receipt.invocation === report.builds[1].receipt.invocation) return false;
    const isolation=report.builds[1].isolation;if(!isolation||isolation.workspace!=='independent Git checkout and source overlay'||isolation.compilerCache!=='fresh isolated directory'||isolation.environment?.TZ!=='Pacific/Kiritimati'||isolation.environment?.LC_ALL!=='C')return false;
    return report.builds.every(b => b.receipt.packages.every(p => {
      const expected = report.contracts.find(c => c.name === p.name), snapshot = b.snapshots.find(s => s.file === p.file);
      if (p.file !== expected.file || p.sha256 !== expected.sha256 || snapshot?.sha256 !== p.sha256 || snapshot.archiveComment !== '' || !Array.isArray(snapshot.members)) return false;
      const members = expected.members;
      if (!members || !Object.hasOwn(members, 'boot.json') || !Object.hasOwn(members, 'LICENSE') || Object.keys(members).length !== snapshot.members.length || new Set(snapshot.members.map(m => m.name)).size !== snapshot.members.length) return false;
      if (!sameIdentity(snapshot.members.map(m => m.name), Object.keys(members).sort())) return false;
      return snapshot.members.every(m => {
        const meta = m.metadata;
        return /^[a-f0-9]{64}$/.test(m.sha256) && m.sha256 === members[m.name] && /^[a-f0-9]{64}$/.test(m.compressedSha256) &&
          meta && sameIdentity(meta.date_time, [2026, 1, 1, 0, 0, 0]) && meta.compress_type === 8 && meta.create_system === 3 && meta.create_version === 20 && meta.extract_version === 20 && meta.external_attr === (0o600 << 16) && meta.internal_attr === 0 &&
          meta.flag_bits === (/^[\x00-\x7F]*$/.test(m.name) ? 0 : 0x800) && meta.extra === '' && meta.comment === '' && ['file_size', 'compress_size', 'CRC', 'header_offset'].every(field => Number.isSafeInteger(meta[field]) && meta[field] >= 0);
      }) && sameIdentity(snapshot, report.builds[0].snapshots.find(s => s.file === p.file));
    }));
  } catch { return false; }
}

function summarize(ctx, steps = {}) {
  const results = [];
  for (const [name, scope] of [['checkout', 'Source checkout'], ['node', 'Node environment'], ['python', 'Python environment']]) {
    const raw = steps[name]?.outcome;
    results.push({ name, scope, status: raw === 'success' ? 'PASS' : raw === 'failure' ? 'ERROR' : raw === 'cancelled' ? 'CANCELLED' : raw === 'skipped' ? 'UNVERIFIED' : 'UNVERIFIED',
      rawStatus: raw || 'unknown', reason: raw ? 'GitHub action outcome; not a test result' : 'No action outcome supplied (local or unavailable)' });
  }
  for (const stage of stages) {
    const result = readReport(ctx, `stage-${stage.id}.json`), raw = steps[stage.id]?.outcome;
    const entry = { name: stage.id, scope: stage.scope, status:'UNVERIFIED',reasonCode:'MissingInvalidOrStaleResult',rawStatus:raw||'missing-result', reason: 'Missing, invalid or stale result; cannot verify' };
    if (raw === 'skipped') Object.assign(entry, { status: 'UNVERIFIED', reasonCode:'UnexpectedSkip',reason:'Workflow skipped this required stage' });
    else if (raw === 'cancelled') Object.assign(entry, { status: 'CANCELLED', reason: 'Workflow cancelled this required stage' });
    else if (result?.name === stage.id) {
      Object.assign(entry,Object.fromEntries(['name','status','rawStatus','exitCode','signal','milliseconds','reasonCode','assertionResult','log'].filter(k=>Object.hasOwn(result,k)).map(k=>[k,result[k]])),{scope:stage.scope,status:resultStatus(result,'tool')});
      entry.reason = result.status === 'PASS' ? 'Command completed with exit 0' : `Command outcome: ${result.rawStatus}; see bounded log`;
      if (entry.status === 'PASS' && !verifiedPass(result,'tool')) Object.assign(entry, { status: 'UNVERIFIED', reason: 'Incomplete success record' });
      if (raw === 'failure' && entry.status === 'PASS') Object.assign(entry, { status: 'ERROR', reason: 'Workflow outcome contradicts success record' });
    }
    if (['unit', 'browser'].includes(stage.id)) {
      const suite = readReport(ctx, stage.id + '.json');
      if(suite?.results?.length)entry.status=overall([entry.status,...suite.results.map(r=>resultStatus(r,'contract'))]);
      if (!suiteEvidence(ctx,stage.id)) {
        Object.assign(entry,{status:entry.status==='FAIL'?'FAIL':entry.status==='ERROR'?'ERROR':entry.status==='CANCELLED'?'CANCELLED':'UNVERIFIED',evidenceIntegrity:'INCOMPLETE',reason:'Required per-check evidence missing, incomplete or not passing'});
      }
      if (stage.id === 'browser' && entry.status === 'PASS' && !layoutEvidence(ctx)) {
        Object.assign(entry, { status: 'UNVERIFIED', reason: 'Device layout coverage report missing, stale, incomplete or not passing' });
      }
    }
    if(stage.id==='packages'){const p=readReport(ctx,'package-contracts.json');if(p?.status==='FAIL'&&p.assertionResult==='FAIL'&&p.failure?.type==='AssertionError')Object.assign(entry,{status:'FAIL',assertionResult:'FAIL',evidenceIntegrity:'INCOMPLETE',reasonCode:'PackageAssertionFailed'});}
    if (stage.id === 'packages' && entry.status === 'PASS' && !packageEvidence(ctx)) {
      Object.assign(entry, { status: 'UNVERIFIED', reason: 'Nine-package/version/negative/repeated-build evidence missing, stale or incomplete' });
    }
    results.push(entry);
  }
  if (steps['build-artifacts']) {
    const raw = steps['build-artifacts'].outcome;
    results.push({ name: 'build-artifacts', scope: 'Development ZIP artifact upload (not a Release)', rawStatus: raw,
      status: raw === 'success' ? 'PASS' : raw === 'failure' ? 'ERROR' : raw === 'cancelled' ? 'CANCELLED' : raw === 'skipped' ? 'UNVERIFIED' : 'UNVERIFIED' });
  }
  const catalog=readReport(ctx,'catalog.json');
  if(!catalog||!sameIdentity(catalog.catalog,catalogFor(ctx.identity.profile||'standard',ctx.identity.environment?.deviceDepth||'standard'))||!sameIdentity(ctx.identity.catalog,catalogIdentity(ctx.identity.profile||'standard',ctx.identity.environment?.deviceDepth||'standard')))results.push({name:'catalog',status:'UNVERIFIED',reasonCode:'CatalogMismatch'});
  const status=overall(results.map(r=>r.status));
  return { schema: 1, identity: ctx.identity, ...verdict(results.some(r=>r.status==='FAIL')?'FAIL':status==='PASS'?'PASS':'UNKNOWN',results.filter(r=>r.status==='UNVERIFIED'||r.evidenceIntegrity==='INCOMPLETE').map(r=>r.name),status), coverage, results,
    limitations: ['Hard runner termination can prevent final summary/upload; never infer PASS from absent artifacts.', 'Evidence upload happens after this summary; its final outcome is recorded by the GitHub job.', 'Windows and Android require their own environment-specific evidence.'] };
}

function requiredEvidence(profile='standard') {
  const shards=profile==='research'?[...researchUnitEntries.map(n=>'checks/unit/'+n+'.json'),...require('./ci-catalog.cjs').researchPlan.map(c=>'checks/research/'+c.id+'.json')]:Object.entries(suites).flatMap(([mode,names])=>names.map(n=>'checks/'+mode+'/'+n+'.json'));

  if(profile==='research')return [...require('./ci/research-families.ts').researchFamilies.map(f=>'families/'+f+'.json'),...shards,'unit.json','metrics.json','catalog.json','identity.json','summary.json','research.json','stage-dependencies.json','stage-browser-install.json',...catalogFor('research').contracts.flatMap(c=>[...c.evidence,...c.visualEvidence])];
  return [...shards,'metrics.json','catalog.json', ...Object.keys(checkpoints).map(name=>`fixtures/${name}/checkpoints.json`), 'identity.json', 'summary.json', 'unit.json', 'browser.json', 'package-contracts.json', ...stages.map(s=>`stage-${s.id}.json`),'fixtures/device-layouts.cjs/layout-report.json'];
}
function validateUpload(ctx, required=requiredEvidence(ctx.identity.profile), identityFiles=required, options={}) {
 const destination=options.destination||path.join(ctx.dir,'upload'),problems=[];let index;
 if(fs.existsSync(path.join(destination,'delivery.json'))&&!required.includes('delivery.json')){required=[...required,'delivery.json'];identityFiles=[...identityFiles,'delivery.json'];}
 try{index=readJsonBounded(destination,'upload-index.json',1048576)}catch(error){return[{file:'upload-index.json',reason:error.message}]}
 if(index.schema!==2||!sameIdentity(index.identity,ctx.identity)||!exactIds(required,index.required)||!Array.isArray(index.files)||index.files.length>2000||new Set(index.files.map(e=>e?.file)).size!==index.files.length)return[{file:'upload-index.json',reason:'Manifest identity/schema/required set/duplicate mismatch'}];
 for(const entry of index.files){try{
  const target=safeFile(destination,entry.file),stat=fs.statSync(target);
  if(!/^[a-f0-9]{64}$/.test(entry.sha256)||entry.size!==stat.size||entry.size>8*1024*1024||hash(fs.readFileSync(target))!==entry.sha256)throw Error('Indexed size/hash mismatch');
  const expected=evidenceMeta(entry.file,required,identityFiles);if(!Object.entries(expected).every(([k,v])=>entry[k]===v)||!sameIdentity(entry.capture,captureMeta(destination,entry.file,ctx.identity)))throw Error('Manifest role/schema/necessity/capture mismatch');
 }catch(error){problems.push({file:entry.file,reason:error.message})}}
 for(const file of required){try{
  const entry=index.files.find(e=>e.file===file);if(!entry)throw Error('Missing required file');
  const bytes=fs.readFileSync(safeFile(destination,file));
  if(file.endsWith('.png'))require('./ci-png.cjs').verifyPng(bytes);
  if(!options.remote&&hash(bytes)!==hash(fs.readFileSync(safeFile(ctx.dir,file))))throw Error('Required source hash mismatch');
  if(bytes.length>(file.endsWith('.png')?8388608:file.startsWith('research/')?2097152:262144))throw Error('Required evidence size limit');
  if(identityFiles.includes(file)){const report=JSON.parse(bytes);if(report.schema!==1||!sameIdentity(report.identity,ctx.identity))throw Error('Required file identity/schema mismatch');}
 }catch(error){problems.push({file,reason:error.message})}}
 return problems;
}
function finalizeUpload(ctx,summary,options={}) {
 const start=Date.now(),required=requiredEvidence(ctx.identity.profile),raw=new Set(catalogFor(ctx.identity.profile||'standard').contracts.filter(c=>c.group==='research').flatMap(c=>c.evidence)),identityFiles=required.filter(f=>f.endsWith('.json')&&!raw.has(f));
 for(const mode of ['unit','browser','research']){const suite=readReport(ctx,mode+'.json');if(suite?.results&&suite.suite)writeSuite(ctx,suite);}
 writeJson(path.join(ctx.dir,'summary.json'),summary);
 const stageMetrics=stages.map(s=>{const r=readReport(ctx,`stage-${s.id}.json`);return r?{id:s.id,status:r.status,milliseconds:r.milliseconds,cache:r.cache,retry:r.retry}:null}).filter(Boolean),researchMetrics=readReport(ctx,'research.json');
 writeJson(path.join(ctx.dir,'metrics.json'),{schema:1,identity:ctx.identity,preparationMs:ctx.preparationMs??null,stages:stageMetrics,research:researchMetrics?.results.map(r=>({id:r.name,status:r.status,milliseconds:r.milliseconds})),automaticRetries:0,uploadTiming:'GitHub job steps; collected by ci-metrics.cjs',samplesNeededForP95:20});
 const upload=prepareUpload(ctx,{...options,required,identityFiles,candidates:[...required,...(options.candidates||[])]});
 const problems=validateUpload(ctx,required,identityFiles);
 if(summary.evidenceIntegrity==='INCOMPLETE')problems.push({file:'summary.json',reason:'EvidenceIncomplete in required result set'});
 if(!sameIdentity(ctx.identity.catalog,catalogIdentity(ctx.identity.profile||'standard',ctx.identity.environment?.deviceDepth||'standard')))problems.push({file:'catalog.json',reason:'Catalog identity mismatch'});
 const sourceAfter=observeSource(ctx);
 if(!sameIdentity(sourceAfter,ctx.identity.source))problems.push({file:'source-after',reason:'SourceChangedDuringExecution'});
 const delivery={schema:1,identity:ctx.identity,...verdict(summary.assertionResult|| (summary.status==='FAIL'?'FAIL':summary.status==='PASS'?'PASS':'UNKNOWN'),problems,summary.status),checkStatus:summary.status,problems,files:upload.files.length,bytes:upload.bytes,omitted:upload.omitted,localPreparationMs:Date.now()-start,remoteVerification:'PENDING'};
 const destination=path.join(ctx.dir,'upload');writeJson(path.join(destination,'delivery.json'),delivery);
 const indexPath=path.join(destination,'upload-index.json'),index=JSON.parse(fs.readFileSync(indexPath)),target=path.join(destination,'delivery.json');
 index.files.push({file:'delivery.json',sha256:hash(fs.readFileSync(target)),size:fs.statSync(target).size,capture:null,...evidenceMeta('delivery.json',[...required,'delivery.json'],[...identityFiles,'delivery.json'])});index.required.push('delivery.json');index.bytes+=fs.statSync(target).size;index.seal={state:problems.length?'INCOMPLETE':'SEALED',expectedLockSha256,sourceAfter};writeJson(indexPath,index);
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`manifest_sha256=${hash(fs.readFileSync(indexPath))}\nevidence_nonce=${ctx.identity.nonce}\n`);
 return delivery;
}
function verifyRemote(directory,expected) {
 const started=Date.now(),problems=[];let identity,delivery,summary,computed;
 try {
  identity=readJsonBounded(directory,'identity.json').identity;if(identity.projectId!==projectId)throw Error('Project ID mismatch');delivery=readJsonBounded(directory,'delivery.json');summary=readJsonBounded(directory,'summary.json');
  if(expected.source.head!==expected.checkoutSHA||!sameIdentity(identity.source,expected.source)||identity.source.dirty||!sameIdentity(identity.catalog,catalogIdentity(expected.profile,expected.depth||'standard'))||identity.profile!==expected.profile||identity.nonce!==expected.nonce)throw Error('Source/catalog/profile/nonce mismatch');
  for(const key of ['githubRunId','attempt','repository','ref','workflow','event','job'])if(identity.run[key]!==expected.run[key])throw Error('Run identity mismatch: '+key);
  if(!sameIdentity(identity.pr,expected.pr))throw Error('PR head/base/merge mismatch');
  if(hash(fs.readFileSync(safeFile(directory,'upload-index.json')))!==expected.manifestSha256)throw Error('Anchored manifest hash mismatch');
  if(!sameIdentity(summary.identity,identity)||!sameIdentity(delivery.identity,identity))throw Error('Delivery identity mismatch');
  const ctx={dir:directory,root,identity},required=[...requiredEvidence(expected.profile),'delivery.json'],raw=new Set(catalogFor(expected.profile).contracts.filter(c=>c.group==='research').flatMap(c=>c.evidence));
  problems.push(...validateUpload(ctx,required,required.filter(f=>f.endsWith('.json')&&!raw.has(f)),{destination:directory,remote:true}));
  const index=readJsonBounded(directory,'upload-index.json',1048576),actual=[];let total=0;
  for(const reason of sealProblems(index.seal,expectedLockSha256,expected.source))problems.push({file:'upload-index.json',reason});
  function scan(dir,prefix=''){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const name=prefix+entry.name;if(entry.isSymbolicLink())throw Error('Downloaded symlink');if(entry.isDirectory())scan(path.join(dir,entry.name),name+'/');else{actual.push(name);total+=fs.statSync(path.join(dir,entry.name)).size;if(actual.length>2001||total>(expected.profile==='research'?160:16)*1048576)throw Error('Downloaded evidence budget exceeded')}}}scan(directory);
  if(!exactIds([...index.files.map(e=>e.file),'upload-index.json'],actual))problems.push({file:'upload-index.json',reason:'Actual downloaded set differs from manifest'});
  if(!sameIdentity(readJsonBounded(directory,'catalog.json').catalog,catalogFor(expected.profile,expected.depth||'standard')))problems.push({file:'catalog.json',reason:'Catalog snapshot mismatch'});
  computed=expected.profile==='research'?require('./ci-research.cjs').researchSummary(ctx):summarize(ctx,{checkout:{outcome:'success'},node:{outcome:'success'},python:{outcome:'success'}});
  if(computed.status!=='PASS'||summary.status!=='PASS'||delivery.status!=='PASS')problems.push({file:'summary.json',reason:'Uploaded result does not establish complete PASS'});
 } catch(error){problems.push({file:'remote-artifact',reason:error.message})}
 const assertionResult=computed?.assertionResult==='FAIL'?'FAIL':summary?.assertionResult||'UNKNOWN';return{schema:1,identity,...verdict(assertionResult,problems,problems.length?overall([computed?.status||'UNVERIFIED','UNVERIFIED']):'PASS'),problems,remoteVerificationMs:Date.now()-started};
}
function prepareUpload(ctx, { candidates: extra = [], totalLimit = 16 * 1024 * 1024, fileLimit, required=requiredEvidence(ctx.identity.profile), identityFiles=required } = {}) {
  const destination = path.join(ctx.dir, 'upload');
  if (fs.existsSync(destination)) throw Error('Upload directory already exists; use a fresh evidence ID');
  fs.mkdirSync(destination);
  const candidates = [...extra,...required, 'identity.json', 'unit.json', 'browser.json', 'summary.json', 'package-contracts.json', ...stages.flatMap(s => [`stage-${s.id}.json`, `${s.id}.log`]),
    ...Object.entries(suites).flatMap(([suite, tests]) => tests.map(test => `${suite}/${test}.log`)),
    ...fixtureChecks.flatMap(test => [`fixtures/${test}/snapshot.json`, `fixtures/${test}/viewport.jpg`]), 'fixtures/device-layouts.cjs/layout-report.json'];
  const files = [], omitted = []; let bytes = 0;
  for (const file of [...new Set(candidates)]) {
    if (path.isAbsolute(file) || file.split(/[\\/]/).includes('..')) throw Error('Unsafe evidence candidate');
    const source = path.join(ctx.dir, file);
    if(!fs.existsSync(source)){if(required.includes(file))omitted.push({file,...evidenceMeta(file,required,identityFiles),reason:'MissingRequired'});continue;}
    const stat = fs.lstatSync(source), limit = fileLimit?.(file) ?? (file.endsWith('.jpg') ? 524288 : file === 'fixtures/device-layouts.cjs/layout-report.json' ? 262144 : file.startsWith('fixtures/') ? 65536 : file.endsWith('.json') ? 262144 : 65536);
    const relativeReal = path.relative(fs.realpathSync(ctx.dir), fs.realpathSync(source));
    if (!stat.isFile() || stat.isSymbolicLink() || relativeReal.startsWith('..') || path.isAbsolute(relativeReal) || stat.size > limit || bytes + stat.size > totalLimit - 1048576) {
      omitted.push({file,...evidenceMeta(file,required,identityFiles),size:stat.size,reason: 'Non-regular, outside run directory or evidence size limit' }); continue;
    }
    const target = path.join(destination, file);
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(source, target);
    files.push(file); bytes += stat.size;
  }
  writeJson(path.join(destination, 'upload-index.json'), {schema:2,identity:ctx.identity,required,files:files.map(file=>({file,capture:captureMeta(destination,file,ctx.identity),size:fs.statSync(path.join(destination,file)).size,sha256:hash(fs.readFileSync(path.join(destination,file))),...evidenceMeta(file,required,identityFiles)})),bytes,omitted});
  return { files, bytes, omitted };
}

module.exports = {observeSource,resultStatus,suiteEvidence, verifyRemote, safeFile, readJsonBounded, verdict, exactIds, checkpointEvidence, sourceIdentity, root, suites, stages, fixtureChecks, coverage, context, writeJson, classify, overall, runCommand, summarize, prepareUpload, finalizeUpload, validateUpload, requiredEvidence, layoutEvidence, packageEvidence, requiredPackages, readReport, verifiedPass, sameIdentity, hash };
