// Moody Blues: evidence for the existing CI runner, using Node built-ins only.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const { suites, stages, catalogFor, catalogIdentity,checkpoints,nodeTestCases,researchUnitEntries } = require('./ci-catalog.cjs');
const fixtureChecks = ['settings-ci.cjs', 'combat-focused.cjs', 'moody-historical-regressions.cjs', 'device-layouts.cjs'];
const coverage = 'Controlled fixtures and source contracts only; not real DoL/ModLoader, Windows or Android acceptance.';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sameIdentity = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function sourceIdentity() {
  const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 });
  const files = [...new Set(git('ls-files', '--cached', '--others', '--exclude-standard', '-z').toString().split('\0').filter(Boolean))].sort();
  const content = crypto.createHash('sha256');
  for (const file of files) {
    const absolute = path.join(root, file);
    const stat = fs.existsSync(absolute) ? fs.lstatSync(absolute) : null;
    content.update(file + '\0');
    content.update(stat?.isFile() ? fs.readFileSync(absolute) : stat?.isSymbolicLink() ? fs.readlinkSync(absolute) : '<missing>');
    content.update('\0');
  }
  return {
    head: git('rev-parse', 'HEAD').toString().trim(),
    tree: git('rev-parse', 'HEAD^{tree}').toString().trim(),
    dirty: Boolean(git('status', '--porcelain', '--untracked-files=normal').length),
    contentSha256: content.digest('hex'),
    lockSha256: hash(fs.readFileSync(path.join(root, 'package-lock.json')))
  };
}

function context() {
  const started=Date.now();
  const id = process.env.MOODY_EVIDENCE_ID || `local-${Date.now()}-${process.pid}`;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw Error('Invalid MOODY_EVIDENCE_ID');
  process.env.MOODY_EVIDENCE_ID = id;
  const dir = path.join(root, 'tests/artifacts/ci', id);
  fs.mkdirSync(dir, { recursive: true });
  const version = command => { try { return execFileSync(command, ['--version'], { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'] }).trim(); } catch { return null; } };
  const profile=process.env.MOODY_PROFILE||'standard', depth=process.env.MOODY_DEVICE_DEPTH||'standard';
  let event={};if(process.env.GITHUB_EVENT_PATH)event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH));
  const priorFile=path.join(dir,'identity.json');let prior;
  if(fs.existsSync(priorFile)){if(fs.lstatSync(priorFile).isSymbolicLink()||fs.statSync(priorFile).size>262144)throw Error('Unsafe prior identity');prior=JSON.parse(fs.readFileSync(priorFile)).identity;}
  const identity = {
    source: sourceIdentity(),
    run: { id, attempt: process.env.GITHUB_RUN_ATTEMPT || 'local', githubRunId: process.env.GITHUB_RUN_ID || null,
      repository: process.env.GITHUB_REPOSITORY || null, ref: process.env.GITHUB_REF || null,
      event:process.env.GITHUB_EVENT_NAME||'local', workflow: process.env.GITHUB_WORKFLOW || null, job: process.env.GITHUB_JOB || null,
      url: process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null },
    nonce:prior?.nonce||crypto.randomBytes(16).toString('hex'), profile, catalog:catalogIdentity(profile,depth),
    pr:event.pull_request?{head:event.pull_request.head.sha,base:event.pull_request.base.sha,merge:process.env.GITHUB_SHA}:null,
    environment: { platform: process.platform, arch: process.arch, deviceDepth: process.env.MOODY_DEVICE_DEPTH || 'standard', node: process.version, npm: version('npm'), python: version('python'),
      playwright: require('../package-lock.json').packages['node_modules/playwright'].version,
      browser: process.platform === 'win32' ? 'Microsoft Edge (browser suite)' : 'Pinned Playwright Chromium (browser suite)' }
  };
  if(process.env.GITHUB_ACTIONS==='true'&&identity.source.head!==process.env.GITHUB_SHA)throw Error('Checkout differs from workflow SHA');
  if(prior&&!sameIdentity(prior,identity))throw Error('Run identity changed; fresh run directory required');
  if(!prior){writeJson(priorFile,{schema:1,identity});writeJson(path.join(dir,'catalog.json'),{schema:1,identity,catalog:catalogFor(profile,depth)});}
  return {root,dir,identity,preparationMs:Date.now()-started};
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.tmp', JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(file + '.tmp', file);
}

function classify({ code, error, timedOut, cancelled, assertionFailed }) {
  if (cancelled) return 'CANCELLED';
  if (timedOut || error) return 'ERROR';
  if (code === 0) return 'PASS';
  if (assertionFailed) return 'FAIL';
  return code == null ? 'UNVERIFIED' : 'ERROR';
}
function overall(statuses) {
  if (!statuses.length) return 'UNVERIFIED';
  for (const status of ['FAIL','ERROR','CANCELLED','UNVERIFIED']) if (statuses.includes(status)) return status;
  return statuses.every(s=>s==='PASS') ? 'PASS' : 'UNVERIFIED';
}
function verdict(assertionResult, problems=[], status='PASS') {
  const evidenceIntegrity=problems.length ? 'INCOMPLETE' : 'COMPLETE';
  return {status:assertionResult==='FAIL' ? 'FAIL' : status==='PASS'&&problems.length ? 'UNVERIFIED' : status,
    assertionResult,evidenceIntegrity,reasonCodes:[...({ERROR:['InfrastructureError'],CANCELLED:['RunCancelled'],UNVERIFIED:['UnverifiedChecks']}[status]||[]),...(assertionResult==='FAIL'?['AssertionFailed']:[]),...(problems.length?['EvidenceIncomplete']:[])]};
}
function exactIds(expected, actual) {return expected.length>0&&Array.isArray(actual)&&expected.length===actual.length&&new Set(actual).size===actual.length&&expected.every(id=>actual.includes(id))}
function checkpointEvidence(ctx, name) {
 const expected=checkpoints[name];if(!expected) return true;
 const report=readReport(ctx,`fixtures/${name}/checkpoints.json`);
 return report?.schema===1&&report.entry===name&&exactIds(expected,report.reached)&&sameIdentity(expected,report.reached);
}
function runCommand(command, args, { cwd = root, log, timeoutMs = 120000, signal, env = process.env, quiet = false, requireAssertions=false, execution='contract' } = {}) {
  return new Promise(resolve => {
    const start = Date.now(), outputHash = crypto.createHash('sha256');
    let tail = Buffer.alloc(0), bytes = 0, error, timedOut = false, cancelled = false, forceKill;
    const executionId = crypto.randomBytes(16).toString('hex'), receiptFile=log+'.assertion.json';
    fs.rmSync(receiptFile,{force:true});
    const childEnv={...env,MOODY_PROCESS_RECEIPT:receiptFile,MOODY_EXECUTION_ID:executionId,NODE_OPTIONS:[env.NODE_OPTIONS,`--require=${path.join(root,'scripts/ci-process-receipt.cjs')}`].filter(Boolean).join(' ')};
    let nativeSource=false;if(command===process.execPath&&!args.includes('--test')){const source=args[0]==='-e'?args[1]:args.find(a=>/\.(cjs|mjs|js)$/.test(a)&&fs.existsSync(a));if(source)nativeSource=require('./ci-source-policy.cjs').usesNodeTest(args[0]==='-e'?source:fs.readFileSync(source,'utf8'));}
    if(nativeSource&&args[0]==='-e'){const inline=path.join(path.dirname(log),'inline-'+executionId+'.test.cjs');fs.mkdirSync(path.dirname(inline),{recursive:true});fs.writeFileSync(inline,args[1]);args=['--test',inline];}
    const nativeFiles=args.filter(a=>nodeTestCases[path.basename(a)]),expectedNodeIds=nativeFiles.flatMap(file=>nodeTestCases[path.basename(file)].map(name=>path.basename(file)+'::'+name));childEnv.MOODY_EXPECTED_NODE_CASES=JSON.stringify(expectedNodeIds);if(command===process.execPath&&(nativeFiles.length||nativeSource)&&!args.includes('--test'))args=['--test',...args];
    if (command===process.execPath&&args.includes('--test')) args=[`--test-reporter=${path.join(root,'scripts/ci-test-reporter.cjs')}`,...args];
    const child = spawn(command, args, { cwd, env:childEnv, stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32', shell: process.platform === 'win32' && ['npm', 'npx'].includes(command) });
    const stop = () => {
      try { process.platform === 'win32' ? child.kill('SIGTERM') : process.kill(-child.pid, 'SIGTERM'); } catch {}
      forceKill = setTimeout(() => { try { process.platform === 'win32' ? child.kill('SIGKILL') : process.kill(-child.pid, 'SIGKILL'); } catch {} }, 1000);
      forceKill.unref();
    };
    const abort = () => { cancelled = true; stop(); };
    const timer = setTimeout(() => { timedOut = true; stop(); }, timeoutMs);
    const collect = (chunk, stream) => {
      bytes += chunk.length; outputHash.update(chunk);
      tail = Buffer.concat([tail, chunk]);
      if (tail.length > 65536) tail = tail.subarray(tail.length - 65536);
      if (!quiet) stream.write(chunk);
    };
    child.stdout.on('data', chunk => collect(chunk, process.stdout));
    child.stderr.on('data', chunk => collect(chunk, process.stderr));
    child.on('error', e => { error = e.code || e.message; });
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    child.on('close', (code, childSignal) => {
      clearTimeout(timer); clearTimeout(forceKill); signal?.removeEventListener('abort', abort);
      fs.mkdirSync(path.dirname(log), { recursive: true });
      fs.writeFileSync(log, tail);
      let assertionFailed=false,naturalCompletion=false,terminalReceipt=null;const ownReceipt=receiptFile+'.'+child.pid+'.json';
      try {const st=fs.lstatSync(ownReceipt);if(st.isFile()&&!st.isSymbolicLink()&&st.size<=8192){const receipt=JSON.parse(fs.readFileSync(ownReceipt));terminalReceipt=receipt;naturalCompletion=receipt.executionId===executionId&&receipt.pid===child.pid&&receipt.naturalCompletion===true;assertionFailed=receipt.schema===1&&receipt.executionId===executionId&&receipt.pid===child.pid&&receipt.terminal===true&&receipt.kind==='assertion'&&receipt.code==='ERR_ASSERTION'&&receipt.name==='AssertionError';}} catch {}
      const classified=classify({code,error:error||childSignal,timedOut,cancelled,assertionFailed:execution==='contract'&&assertionFailed}),status=classified==='PASS'&&command===process.execPath&&((execution==='contract'&&!naturalCompletion)||(requireAssertions&&!(terminalReceipt?.assertions>0||terminalReceipt?.nodeTests?.length>0)))?'UNVERIFIED':classified==='ERROR'&&terminalReceipt?.nodeCaseIssues?.length?'UNVERIFIED':classified;
      resolve({status,nodeTests:terminalReceipt?.nodeTests,nodeCaseIssues:terminalReceipt?.nodeCaseIssues,assertions:terminalReceipt?.assertions??0,terminalReceipt,assertionResult:status==='PASS'?'PASS':status==='FAIL'?'FAIL':'UNKNOWN',reasonCode:cancelled?'RunCancelled':timedOut?'ProcessTimeout':error?'SpawnError':childSignal?'ProcessSignal':status==='FAIL'?'AssertionFailed':code===0?(status==='PASS'?'ExitZero':naturalCompletion?'NoAssertions':'EarlyExitWithoutCompletion'):'ProcessExitError',
        rawStatus: cancelled ? 'cancelled' : timedOut ? 'timeout' : error ? 'spawn-error' : childSignal ? 'signal' : code === 0 ? 'passed' : 'failed',
        exitCode: code, signal: childSignal, error: error || null, milliseconds: Date.now() - start,
        outputBytes: bytes, outputSha256: outputHash.digest('hex'), logTruncated: bytes > tail.length });
    });
  });
}

function readReport(ctx, file) {
  try {
    const p = path.join(ctx.dir, file);
    if (fs.lstatSync(p).isSymbolicLink() || fs.statSync(p).size > 262144) return null;
    const result = JSON.parse(fs.readFileSync(p, 'utf8'));
    return sameIdentity(result.identity, ctx.identity) ? result : null;
  } catch { return null; }
}

function verifiedPass(result) {
  return result?.status === 'PASS' && result.rawStatus === 'passed' && result.exitCode === 0 &&
    !result.signal && Number.isFinite(result.milliseconds) && result.milliseconds >= 0;
}

function suiteEvidence(ctx,mode,expected=suites[mode]){const suite=readReport(ctx,mode+'.json');return !!suite&&suite.schema===1&&suite.status==='PASS'&&sameIdentity(suite.expected,expected)&&suite.results?.length===expected.length&&suite.results.every((r,i)=>r.name===expected[i]&&verifiedPass(r)&&(r.assertions>0||r.nodeTests?.length>0)&&(!nodeTestCases[r.name]||(exactIds(nodeTestCases[r.name].map(n=>r.name+'::'+n),r.nodeTests?.map(c=>c.id))&&r.nodeTests.every(c=>c.status==='PASS')&&!r.nodeCaseIssues?.length))&&checkpointEvidence(ctx,r.name));}
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

const requiredPackages = ['StoneFreeHost', 'DoLGameUI', 'ModHubSoftWet', 'MapleBirchSoftWet', 'DolOptimizationSoftWet', 'CheatExtendedSoftWet', 'ReOverfitsSoftWet', 'LyraMouthCompat051213'];
function packageEvidence(ctx) {
  // Malformed or partial evidence must not prevent the whole-run summary/upload.
  try {
    const report = readReport(ctx, 'package-contracts.json');
    if (!report || report.kind !== 'package-contracts' || report.status !== 'PASS' || report.versionSources?.status !== 'PASS' || report.reproducibility?.status !== 'PASS' || !Array.isArray(report.reproducibility.differences) || report.reproducibility.differences.length !== 0) return false;
    const namesMatch = values => Array.isArray(values) && values.length === requiredPackages.length && new Set(values).size === requiredPackages.length && values.every(name => requiredPackages.includes(name));
    const negatives = report.negativeTests;
    const requiredNegatives = ['test_rejects_broken_packages', 'test_ignores_source_mtime_and_permissions', 'test_rejects_mismatches_in_independent_sources', 'test_all_six_positive_and_precise_mutations', 'test_joint_manifest_corruption_and_incomplete_compilation', 'test_metadata_drift_and_comparison_diagnostics', 'test_stale_incomplete_receipts_and_report_limit'];
    if (!Array.isArray(report.contracts) || !namesMatch(report.expectedPackages) || !namesMatch(report.contracts.map(p => p.name)) || !report.contracts.every(p => p.status === 'PASS' && /^[a-f0-9]{64}$/.test(p.sha256))) return false;
    if (negatives?.status !== 'PASS' || !Array.isArray(negatives.plan) || !requiredNegatives.every(name => negatives.plan.some(id => typeof id === 'string' && id.endsWith('.' + name))) || new Set(negatives.plan).size !== negatives.plan.length || negatives.testsRun !== negatives.plan.length || ['failures', 'errors', 'skipped', 'expectedFailures', 'unexpectedSuccesses'].some(field => negatives[field] !== 0)) return false;
    if (!Array.isArray(report.builds) || report.builds.length !== 2 || !report.builds.every(b => typeof b.receipt?.invocation === 'string' && b.receipt.invocation && sameIdentity(b.receipt.source, ctx.identity.source) && b.receipt.runId === ctx.identity.run.id && Array.isArray(b.receipt.packages) && namesMatch(b.receipt.packages.map(p => p.name)) && Array.isArray(b.snapshots) && b.snapshots.length === requiredPackages.length && new Set(b.snapshots.map(s => s.file)).size === requiredPackages.length)) return false;
    if (report.builds[0].receipt.invocation === report.builds[1].receipt.invocation) return false;
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
      Object.assign(entry,Object.fromEntries(['name','status','rawStatus','exitCode','signal','milliseconds','reasonCode','assertionResult','log'].filter(k=>Object.hasOwn(result,k)).map(k=>[k,result[k]])),{scope:stage.scope});
      entry.reason = result.status === 'PASS' ? 'Command completed with exit 0' : `Command outcome: ${result.rawStatus}; see bounded log`;
      if (result.status === 'PASS' && !verifiedPass(result)) Object.assign(entry, { status: 'UNVERIFIED', reason: 'Incomplete success record' });
      if (raw === 'failure' && entry.status === 'PASS') Object.assign(entry, { status: 'ERROR', reason: 'Workflow outcome contradicts success record' });
    }
    if (['unit', 'browser'].includes(stage.id)) {
      const suite = readReport(ctx, stage.id + '.json');
      if (!suiteEvidence(ctx,stage.id)) {
        Object.assign(entry,{status:entry.status==='FAIL'?'FAIL':entry.status==='ERROR'?'ERROR':entry.status==='CANCELLED'?'CANCELLED':'UNVERIFIED',evidenceIntegrity:'INCOMPLETE',reason:'Required per-check evidence missing, incomplete or not passing'});
      }
      if (stage.id === 'browser' && entry.status === 'PASS' && !layoutEvidence(ctx)) {
        Object.assign(entry, { status: 'UNVERIFIED', reason: 'Device layout coverage report missing, stale, incomplete or not passing' });
      }
    }
    if(stage.id==='packages'){const p=readReport(ctx,'package-contracts.json');if(p?.status==='FAIL'&&p.assertionResult==='FAIL'&&p.failure?.type==='AssertionError')Object.assign(entry,{status:'FAIL',assertionResult:'FAIL',evidenceIntegrity:'INCOMPLETE',reasonCode:'PackageAssertionFailed'});}
    if (stage.id === 'packages' && entry.status === 'PASS' && !packageEvidence(ctx)) {
      Object.assign(entry, { status: 'UNVERIFIED', reason: 'Eight-package/version/negative/repeated-build evidence missing, stale or incomplete' });
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
  if(profile==='research')return ['unit.json','metrics.json','catalog.json','identity.json','summary.json','research.json','stage-dependencies.json','stage-browser-install.json',...catalogFor('research').contracts.flatMap(c=>[...c.evidence,...c.visualEvidence])];
  return ['metrics.json','catalog.json', ...Object.keys(checkpoints).map(name=>`fixtures/${name}/checkpoints.json`), 'identity.json', 'summary.json', 'unit.json', 'browser.json', 'package-contracts.json', ...stages.map(s=>`stage-${s.id}.json`),'fixtures/device-layouts.cjs/layout-report.json'];
}
function safeFile(base,file) {
 if(typeof file!=='string'||!file||file.includes('\\')||path.isAbsolute(file)||file.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Unsafe evidence path');
 let target=base;
 for(const part of ['',...file.split('/')]){target=path.join(target,part);if(fs.lstatSync(target).isSymbolicLink())throw Error('Evidence symlink');}
 if(!fs.lstatSync(target).isFile()||!fs.realpathSync(target).startsWith(fs.realpathSync(base)+path.sep))throw Error('Unsafe evidence file');
 return target;
}
function readJsonBounded(base,file,limit=262144){const target=safeFile(base,file);if(fs.statSync(target).size>limit)throw Error('Evidence size limit');return JSON.parse(fs.readFileSync(target));}
function captureMeta(base,file,identity){if(!file.startsWith('review/')||!file.endsWith('.png'))return null;const bytes=fs.readFileSync(path.join(base,file)),valid=bytes.length>=24&&bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a';return {format:'PNG',width:valid?bytes.readUInt32BE(16):null,height:valid?bytes.readUInt32BE(20):null,scale:'image-pixels',environment:identity.environment||null,source:identity.source.head,run:identity.run.id}}
function evidenceMeta(file,required,identityFiles) {return {required:required.includes(file),role:file.startsWith('review/')||file.startsWith('builds/')||file.startsWith('build-metadata/')?'T1':required.includes(file)?'T0':'T2',schema:file.endsWith('.json')?(identityFiles.includes(file)?'moody-envelope/v1':required.includes(file)?'research-raw/v1':'historical-json'):'binary',provenance:file.startsWith('builds/')||file.startsWith('build-metadata/')?'historical-comparison':'current-run'};}
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
 writeJson(path.join(ctx.dir,'summary.json'),summary);
 const stageMetrics=stages.map(s=>{const r=readReport(ctx,`stage-${s.id}.json`);return r?{id:s.id,status:r.status,milliseconds:r.milliseconds,cache:r.cache,retry:r.retry}:null}).filter(Boolean),researchMetrics=readReport(ctx,'research.json');
 writeJson(path.join(ctx.dir,'metrics.json'),{schema:1,identity:ctx.identity,preparationMs:ctx.preparationMs??null,stages:stageMetrics,research:researchMetrics?.results.map(r=>({id:r.name,status:r.status,milliseconds:r.milliseconds})),automaticRetries:0,uploadTiming:'GitHub job steps; collected by ci-metrics.cjs',samplesNeededForP95:20});
 const upload=prepareUpload(ctx,{...options,required,identityFiles,candidates:[...required,...(options.candidates||[])]});
 const problems=validateUpload(ctx,required,identityFiles);
 if(summary.evidenceIntegrity==='INCOMPLETE')problems.push({file:'summary.json',reason:'EvidenceIncomplete in required result set'});
 if(!sameIdentity(ctx.identity.catalog,catalogIdentity(ctx.identity.profile||'standard',ctx.identity.environment?.deviceDepth||'standard')))problems.push({file:'catalog.json',reason:'Catalog identity mismatch'});
 const delivery={schema:1,identity:ctx.identity,...verdict(summary.assertionResult|| (summary.status==='FAIL'?'FAIL':summary.status==='PASS'?'PASS':'UNKNOWN'),problems,summary.status),checkStatus:summary.status,problems,files:upload.files.length,bytes:upload.bytes,omitted:upload.omitted,localPreparationMs:Date.now()-start,remoteVerification:'PENDING'};
 const destination=path.join(ctx.dir,'upload');writeJson(path.join(destination,'delivery.json'),delivery);
 const indexPath=path.join(destination,'upload-index.json'),index=JSON.parse(fs.readFileSync(indexPath)),target=path.join(destination,'delivery.json');
 index.files.push({file:'delivery.json',sha256:hash(fs.readFileSync(target)),size:fs.statSync(target).size,capture:null,...evidenceMeta('delivery.json',[...required,'delivery.json'],[...identityFiles,'delivery.json'])});index.required.push('delivery.json');index.bytes+=fs.statSync(target).size;writeJson(indexPath,index);
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`manifest_sha256=${hash(fs.readFileSync(indexPath))}\nevidence_nonce=${ctx.identity.nonce}\n`);
 return delivery;
}
function verifyRemote(directory,expected) {
 const started=Date.now(),problems=[];let identity,delivery,summary;
 try {
  identity=readJsonBounded(directory,'identity.json').identity;delivery=readJsonBounded(directory,'delivery.json');summary=readJsonBounded(directory,'summary.json');
  if(expected.source.head!==expected.checkoutSHA||!sameIdentity(identity.source,expected.source)||identity.source.dirty||!sameIdentity(identity.catalog,catalogIdentity(expected.profile,expected.depth||'standard'))||identity.profile!==expected.profile||identity.nonce!==expected.nonce)throw Error('Source/catalog/profile/nonce mismatch');
  for(const key of ['githubRunId','attempt','repository','ref','workflow','event','job'])if(identity.run[key]!==expected.run[key])throw Error('Run identity mismatch: '+key);
  if(!sameIdentity(identity.pr,expected.pr))throw Error('PR head/base/merge mismatch');
  if(hash(fs.readFileSync(safeFile(directory,'upload-index.json')))!==expected.manifestSha256)throw Error('Anchored manifest hash mismatch');
  if(!sameIdentity(summary.identity,identity)||!sameIdentity(delivery.identity,identity))throw Error('Delivery identity mismatch');
  const ctx={dir:directory,root,identity},required=[...requiredEvidence(expected.profile),'delivery.json'],raw=new Set(catalogFor(expected.profile).contracts.filter(c=>c.group==='research').flatMap(c=>c.evidence));
  problems.push(...validateUpload(ctx,required,required.filter(f=>f.endsWith('.json')&&!raw.has(f)),{destination:directory,remote:true}));
  const index=readJsonBounded(directory,'upload-index.json',1048576),actual=[];let total=0;
  function scan(dir,prefix=''){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const name=prefix+entry.name;if(entry.isSymbolicLink())throw Error('Downloaded symlink');if(entry.isDirectory())scan(path.join(dir,entry.name),name+'/');else{actual.push(name);total+=fs.statSync(path.join(dir,entry.name)).size;if(actual.length>2001||total>(expected.profile==='research'?160:16)*1048576)throw Error('Downloaded evidence budget exceeded')}}}scan(directory);
  if(!exactIds([...index.files.map(e=>e.file),'upload-index.json'],actual))problems.push({file:'upload-index.json',reason:'Actual downloaded set differs from manifest'});
  if(!sameIdentity(readJsonBounded(directory,'catalog.json').catalog,catalogFor(expected.profile,expected.depth||'standard')))problems.push({file:'catalog.json',reason:'Catalog snapshot mismatch'});
  const computed=expected.profile==='research'?require('./ci-research.cjs').researchSummary(ctx):summarize(ctx,{checkout:{outcome:'success'},node:{outcome:'success'},python:{outcome:'success'}});
  if(computed.status!=='PASS'||summary.status!=='PASS'||delivery.status!=='PASS')problems.push({file:'summary.json',reason:'Uploaded result does not establish complete PASS'});
 } catch(error){problems.push({file:'remote-artifact',reason:error.message})}
 const assertionResult=summary?.assertionResult||'UNKNOWN';return{schema:1,identity,...verdict(assertionResult,problems,problems.length?'UNVERIFIED':'PASS'),problems,remoteVerificationMs:Date.now()-started};
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

module.exports = {suiteEvidence, verifyRemote, safeFile, readJsonBounded, verdict, exactIds, checkpointEvidence, sourceIdentity, root, suites, stages, fixtureChecks, coverage, context, writeJson, classify, overall, runCommand, summarize, prepareUpload, finalizeUpload, validateUpload, requiredEvidence, layoutEvidence, packageEvidence, requiredPackages, readReport, verifiedPass, sameIdentity, hash };
