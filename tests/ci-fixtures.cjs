const fs=require('node:fs'),path=require('node:path');
const {suites,stages,catalogFor,catalogIdentity,checkpoints,nodeTestCases}=require('../scripts/ci-catalog.cjs');
const {writeJson,requiredPackages}=require('../scripts/ci-evidence.cjs');
function healthyCaseFields(name){const d=require('../scripts/ci/lock.ts').entryDeclaration(name);return {terminalReceipt:{graphics:{pages:1,contexts:Object.fromEntries((d?.rendererContexts||[]).map(k=>[k,1])),failedContexts:{},webgl:[],css:{backdrop:true,filter:true},errors:[]},cases:(d?.cases||[]).map(c=>({id:c.id,status:'PASS',milliseconds:1,assertions:1,path:'controlled'}))}};}
function fixture(dir){
 const identity={projectId:require('../project-identity.json').projectId,source:{head:'controlled-head',dirty:false},run:{id:'controlled-run',githubRunId:'controlled-run',attempt:'1',repository:'controlled/repo',ref:'refs/pull/1/merge',workflow:'controlled',event:'pull_request',job:'validate'},nonce:'controlled-nonce',profile:'standard',catalog:catalogIdentity(),environment:{deviceDepth:'standard'},pr:{head:'head',base:'base',merge:'controlled-head'}};
 const ctx={dir,root:dir,identity},pass={status:'PASS',assertionResult:'PASS',rawStatus:'passed',assertions:1,exitCode:0,milliseconds:1};
 writeJson(path.join(dir,'identity.json'),{schema:1,identity});writeJson(path.join(dir,'catalog.json'),{schema:1,identity,catalog:catalogFor()});
 for(const s of stages)writeJson(path.join(dir,'stage-'+s.id+'.json'),{schema:1,identity,name:s.id,...pass});
 for(const [suite,tests]of Object.entries(suites))writeJson(path.join(dir,suite+'.json'),{schema:1,identity,suite,sourceAfter:identity.source,status:'PASS',expected:tests,results:tests.map(name=>({name,...pass,...healthyCaseFields(name),nodeTests:nodeTestCases[name]?.map(n=>({id:name+'::'+n,status:'PASS'}))}))});
 for(const [entry,reached]of Object.entries(checkpoints))writeJson(path.join(dir,'fixtures',entry,'checkpoints.json'),{schema:1,identity,entry,reached});
 writeJson(path.join(dir,'fixtures/device-layouts.cjs/layout-report.json'),{schema:1,identity,status:'PASS',depth:'standard',results:require('./device-case-plan.cjs').expectedCaseIds().map(id=>({id,status:'PASS'}))});
    const contracts = requiredPackages.map(name => ({ name, file: name + '.zip', sha256: 'a'.repeat(64), status: 'PASS', members: { 'LICENSE': 'b'.repeat(64), 'boot.json': 'c'.repeat(64) } }));
    const negativePlan = ['test_rejects_broken_packages', 'test_ignores_source_mtime_and_permissions', 'test_rejects_mismatches_in_independent_sources', 'test_all_current_positive_and_precise_mutations', 'test_joint_manifest_corruption_and_incomplete_compilation', 'test_metadata_drift_and_comparison_diagnostics', 'test_stale_incomplete_receipts_and_report_limit'].map(name => 'controlled.' + name);
    const snapshots = contracts.map(p => ({ file: p.file, sha256: p.sha256, archiveComment: '', members: Object.entries(p.members).map(([name, sha256]) => ({ name, sha256, compressedSha256: 'd'.repeat(64), metadata: { date_time: [2026,1,1,0,0,0], compress_type: 8, create_system: 3, create_version: 20, extract_version: 20, flag_bits: 0, internal_attr: 0, external_attr: 0o600 << 16, file_size: 1, compress_size: 3, CRC: 1, header_offset: 0, extra: '', comment: '' } })) }));
    const buildIdentity={projectId:ctx.identity.projectId,commit:ctx.identity.source.head,runId:ctx.identity.run.githubRunId||ctx.identity.run.id,attempt:ctx.identity.run.attempt};
    const packageReport = { schema: 1, kind: 'package-contracts', identity: ctx.identity, status: 'PASS', buildIdentity, versionSources: { status: 'PASS', projectId:ctx.identity.projectId },
      expectedPackages: requiredPackages, contracts, reproducibility: { status: 'PASS', differences: [] },
      negativeTests: { status: 'PASS', plan: negativePlan, testsRun: negativePlan.length, failures: 0, errors: 0, skipped: 0, expectedFailures: 0, unexpectedSuccesses: 0 },
      builds: ['first','second'].map(invocation => ({ isolation:{workspace:'independent Git checkout and source overlay',compilerCache:'fresh isolated directory',environment:{TZ:'Pacific/Kiritimati',LC_ALL:'C'}},receipt: { invocation, buildIdentity, source: ctx.identity.source, runId: ctx.identity.run.id, packages: contracts }, snapshots })) };

 writeJson(path.join(dir,'package-contracts.json'),packageReport);return ctx;
}
module.exports={fixture,healthyCaseFields};
