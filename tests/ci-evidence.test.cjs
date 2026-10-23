const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { classify, overall, runCommand, summarize, prepareUpload, finalizeUpload, validateUpload, writeJson, stages, suites, requiredPackages } = require('../scripts/ci-evidence.cjs');
const { runSuite } = require('../scripts/test-ci.cjs');
const { captureFailure, writeLayoutReport } = require('./moody-fixture-evidence.cjs');
const {catalogFor,catalogIdentity,checkpoints,nodeTestCases}=require('../scripts/ci-catalog.cjs');
const { root } = require('../scripts/ci-evidence.cjs');

(async () => {
  assert.equal(classify({ code: 0 }), 'PASS');
  assert.equal(classify({ code: null }), 'UNVERIFIED');
  assert.equal(classify({ code: 0, timedOut: true }), 'ERROR');
  assert.equal(classify({ code: 0, cancelled: true }), 'CANCELLED');
  assert.equal(overall([]), 'UNVERIFIED');
  assert.equal(overall(['PASS', 'UNVERIFIED']), 'UNVERIFIED');
  assert.equal(overall(['PASS', 'FAIL']), 'FAIL');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moody-evidence-'));
  const ctx = { dir, root: dir, identity: {profile:'standard',catalog:catalogIdentity(),source: { head: 'fixture', contentSha256: 'fixture' }, run: { id: 'fixture', attempt: '1' } } };
  try {
    writeJson(path.join(dir,'catalog.json'),{schema:1,identity:ctx.identity,catalog:catalogFor()});
    for(const [entry,reached]of Object.entries(checkpoints))writeJson(path.join(dir,'fixtures',entry,'checkpoints.json'),{schema:1,identity:ctx.identity,entry,reached});
    const execute = (code, extra = {}) => runCommand(process.execPath, ['-e', code], { cwd: dir, log: path.join(dir, 'process.log'), quiet: true, timeoutMs: 5000, ...extra });
    assert.equal((await execute('console.log("executed")')).status, 'PASS');
    const failed = await execute('console.error("controlled assertion");process.exit(7)');
    assert.equal(failed.status, 'ERROR');
    assert.equal(failed.exitCode, 7);
    assert.match(fs.readFileSync(path.join(dir, 'process.log'), 'utf8'), /controlled assertion/);
    const timeout = await execute('setInterval(()=>{},1000)', { timeoutMs: 100 });
    assert.equal(timeout.rawStatus, 'timeout');
    assert.equal(timeout.status, 'ERROR');
    const controller = new AbortController();
    const cancelled = execute('setInterval(()=>{},1000)', { signal: controller.signal });
    setTimeout(() => controller.abort(), 100);
    assert.equal((await cancelled).rawStatus, 'cancelled');
    const noisy = await execute('process.stdout.write("x".repeat(300000))');
    assert.ok(noisy.logTruncated);
    assert.ok(fs.statSync(path.join(dir, 'process.log')).size <= 65536);

    fs.mkdirSync(path.join(dir, 'tests'));
    for (const [name, source] of Object.entries({ 'pass.cjs': 'require("node:assert/strict").equal(1,1);console.log("controlled pass")', 'fail.cjs': 'process.exit(7)', 'slow.cjs': 'setInterval(()=>{},1000)', 'blocked.cjs': 'throw Error("must never run")' })) fs.writeFileSync(path.join(dir, 'tests', name), source);
    const suite = await runSuite(ctx, 'unit', ['pass.cjs', 'fail.cjs', 'blocked.cjs'], { quiet: true });
    assert.equal(suite.status, 'ERROR');
    assert.deepEqual(suite.results.map(r => r.status), ['PASS', 'ERROR', 'UNVERIFIED']);
    assert.equal(suite.results[2].rawStatus, 'not-run');
    assert.ok(!fs.existsSync(path.join(dir, 'unit/blocked.cjs.log')));
    const abortSuite = new AbortController();
    const pendingSuite = runSuite(ctx, 'unit', ['slow.cjs', 'blocked.cjs'], { signal: abortSuite.signal, quiet: true });
    const checkpoint = JSON.parse(fs.readFileSync(path.join(dir, 'unit.json')));
    assert.equal(checkpoint.status, 'CANCELLED');
    assert.equal(checkpoint.results[0].rawStatus, 'running');
    abortSuite.abort();
    const interruptedSuite = await pendingSuite;
    assert.equal(interruptedSuite.status, 'CANCELLED');
    assert.equal(interruptedSuite.results[0].rawStatus, 'cancelled');
    assert.equal(interruptedSuite.results[1].status, 'CANCELLED');

    // A green GitHub step without the matching result is not verification.
    let summary = summarize(ctx, Object.fromEntries(stages.map(s => [s.id, { outcome: 'success' }])));
    assert.notEqual(summary.status, 'PASS');
    assert.equal(summary.results.find(r => r.name === 'check').status, 'UNVERIFIED');
    for (const s of stages) {
      writeJson(path.join(dir, `stage-${s.id}.json`), { schema: 1, identity: ctx.identity, name: s.id, status: 'PASS', rawStatus:'passed',assertions:1,exitCode:0, milliseconds: 1 });
    }
    summary = summarize(ctx, {});
    assert.notEqual(summary.status, 'PASS', 'missing required suite reports cannot pass');
    for (const suite of ['unit', 'browser']) {
      writeJson(path.join(dir, `${suite}.json`), { schema: 1, identity: ctx.identity, suite, status: 'PASS', expected: suites[suite], results: suites[suite].map(name => ({name,nodeTests:nodeTestCases[name]?.map(n=>({id:name+'::'+n,status:'PASS'})),status:'PASS', rawStatus:'passed',assertions:1,exitCode:0, milliseconds: 1 })) });
    }
    assert.equal(summarize(ctx, {}).results.find(r => r.name === 'browser').status, 'UNVERIFIED', 'device file exit 0 alone cannot establish coverage');
    const layoutPath = path.join(dir, 'fixtures/device-layouts.cjs/layout-report.json');
    const layout = { schema: 1, identity: ctx.identity, status: 'PASS', depth: 'standard', results: require('./device-layouts.cjs').expectedCaseIds('standard').map(id => ({ id, status: 'PASS' })) };
    writeJson(layoutPath, layout);
    assert.equal(summarize(ctx, {}).results.find(r => r.name === 'packages').status, 'UNVERIFIED', 'package command exit 0 alone cannot establish eight-package coverage');
    const contracts = requiredPackages.map(name => ({ name, file: name + '.zip', sha256: 'a'.repeat(64), status: 'PASS', members: { 'LICENSE': 'b'.repeat(64), 'boot.json': 'c'.repeat(64) } }));
    const negativePlan = ['test_rejects_broken_packages', 'test_ignores_source_mtime_and_permissions', 'test_rejects_mismatches_in_independent_sources', 'test_all_six_positive_and_precise_mutations', 'test_joint_manifest_corruption_and_incomplete_compilation', 'test_metadata_drift_and_comparison_diagnostics', 'test_stale_incomplete_receipts_and_report_limit'].map(name => 'controlled.' + name);
    const snapshots = contracts.map(p => ({ file: p.file, sha256: p.sha256, archiveComment: '', members: Object.entries(p.members).map(([name, sha256]) => ({ name, sha256, compressedSha256: 'd'.repeat(64), metadata: { date_time: [2026,1,1,0,0,0], compress_type: 8, create_system: 3, create_version: 20, extract_version: 20, flag_bits: 0, internal_attr: 0, external_attr: 0o600 << 16, file_size: 1, compress_size: 3, CRC: 1, header_offset: 0, extra: '', comment: '' } })) }));
    const packageReport = { schema: 1, kind: 'package-contracts', identity: ctx.identity, status: 'PASS', versionSources: { status: 'PASS' },
      expectedPackages: requiredPackages, contracts, reproducibility: { status: 'PASS', differences: [] },
      negativeTests: { status: 'PASS', plan: negativePlan, testsRun: negativePlan.length, failures: 0, errors: 0, skipped: 0, expectedFailures: 0, unexpectedSuccesses: 0 },
      builds: ['first','second'].map(invocation => ({ receipt: { invocation, source: ctx.identity.source, runId: ctx.identity.run.id, packages: contracts }, snapshots })) };
    const packageFile = path.join(dir, 'package-contracts.json');
    writeJson(packageFile, packageReport);
    writeJson(packageFile, { ...packageReport, builds: packageReport.builds.slice(1) });
    assert.equal(summarize(ctx, {}).results.find(r => r.name === 'packages').status, 'UNVERIFIED', 'one build cannot establish repeatability');
    writeJson(packageFile, { ...packageReport, contracts: contracts.slice(1) });
    assert.equal(summarize(ctx, {}).results.find(r => r.name === 'packages').status, 'UNVERIFIED', 'missing optional package cannot pass');
    writeJson(packageFile, { ...packageReport, negativeTests: { ...packageReport.negativeTests, skipped: 1 } });
    assert.equal(summarize(ctx, {}).results.find(r => r.name === 'packages').status, 'UNVERIFIED', 'skipped negative tests cannot pass');
    for (const defect of ['members', 'metadata', 'negative-plan']) {
      const incomplete = structuredClone(packageReport);
      if (defect === 'members') delete incomplete.builds[0].snapshots[0].members;
      if (defect === 'metadata') delete incomplete.builds[0].snapshots[0].members[0].metadata;
      if (defect === 'negative-plan') incomplete.negativeTests.plan = negativePlan.map((_, i) => 'unrelated.' + i);
      writeJson(packageFile, incomplete);
      assert.equal(summarize(ctx, {}).results.find(r => r.name === 'packages').status, 'UNVERIFIED', 'missing member/metadata or required negative identity cannot pass');
    }
    for (const malformed of [{ contracts: {} }, { contracts: [null] }, { builds: { length: 2 } },
      { builds: [null, null] }, { builds: [{ receipt: { invocation: 'bad', packages: [null] } }, null] },
      { identity: {profile:'standard',catalog:catalogIdentity(),source: { head: 'stale' } } }]) {
      writeJson(packageFile, { ...packageReport, ...malformed });
      assert.equal(summarize(ctx, {}).results.find(r => r.name === 'packages').status, 'UNVERIFIED', 'malformed or stale package evidence cannot crash or pass');
    }
    writeJson(packageFile, packageReport);
    summary = summarize(ctx, { checkout: { outcome: 'success' }, node: { outcome: 'success' }, python: { outcome: 'success' } });
    assert.equal(summary.status, 'PASS');
    // E2: individually valid stage files can produce an oversize whole summary.
    const setup = { checkout: { outcome: 'success' }, node: { outcome: 'success' }, python: { outcome: 'success' } };
    writeJson(path.join(dir, 'identity.json'), { schema: 1, identity: ctx.identity });
    for (const stage of stages) {
      const file = path.join(dir, `stage-${stage.id}.json`);
      const record = JSON.parse(fs.readFileSync(file));
      writeJson(file, { ...record, padding: 'x'.repeat(45000) });
    }
    const compactSummary=summarize(ctx,setup);assert.ok(Buffer.byteLength(JSON.stringify(compactSummary))<32768,'summary stays compact despite stage detail growth');
    const largeSummary={...compactSummary,padding:'x'.repeat(303061)};
    assert.equal(largeSummary.status, 'PASS', 'original checks really passed');
    assert.ok(Buffer.byteLength(JSON.stringify(largeSummary)) > 262144);
    writeJson(path.join(dir, 'summary.json'), largeSummary);
    const originalUpload = prepareUpload(ctx);
    assert.ok(originalUpload.omitted.some(p => p.file === 'summary.json'));
    console.log('REPRO E2: summary=PASS, required summary.json omitted by original upload preparation');
    fs.rmSync(path.join(dir, 'upload'), { recursive: true });
    const delivery = finalizeUpload(ctx, largeSummary);
    assert.equal(delivery.status, 'UNVERIFIED', 'omitted required summary cannot certify delivery');
    assert.ok(delivery.problems.some(p => p.file === 'summary.json'));
    for (const stage of stages) {
      const file = path.join(dir, `stage-${stage.id}.json`);
      const record = JSON.parse(fs.readFileSync(file)); delete record.padding; writeJson(file, record);
    }
    fs.rmSync(path.join(dir, 'upload'), { recursive: true });
    const complete = finalizeUpload(ctx, summarize(ctx, setup));
    assert.equal(complete.status, 'PASS');
    const uploadedSummary = path.join(dir, 'upload/summary.json');
    fs.appendFileSync(uploadedSummary, ' ');
    assert.ok(validateUpload(ctx).some(p => p.file === 'summary.json' && /hash/.test(p.reason)));
    fs.rmSync(path.join(dir, 'upload'), { recursive: true });
    writeJson(layoutPath, { ...layout, results: layout.results.slice(1) });
    assert.equal(summarize(ctx, {}).results.find(r => r.name === 'browser').status, 'UNVERIFIED', 'missing device/scan case cannot pass');
    writeJson(layoutPath, { ...layout, depth: 'deep' });
    assert.equal(summarize(ctx, {}).results.find(r => r.name === 'browser').status, 'UNVERIFIED', 'standard evidence cannot certify deep coverage');
    writeJson(layoutPath, layout);
    const browserFile = path.join(dir, 'browser.json');
    const fullBrowser = JSON.parse(fs.readFileSync(browserFile));
    writeJson(browserFile, { ...fullBrowser, results: fullBrowser.results.slice(1) });
    assert.equal(summarize(ctx, {}).results.find(r => r.name === 'browser').status, 'UNVERIFIED');
    writeJson(browserFile, fullBrowser);
    assert.equal(summarize(ctx, { browser: { outcome: 'cancelled' } }).results.find(r => r.name === 'browser').status, 'CANCELLED');
    writeJson(path.join(dir, 'stage-check.json'), { identity: {profile:'standard',catalog:catalogIdentity(),source: { head: 'stale' } }, name: 'check', status: 'PASS', exitCode: 0 });
    assert.equal(summarize(ctx, {}).results.find(r => r.name === 'check').status, 'UNVERIFIED', 'stale report cannot pass');
    assert.equal(summarize(ctx, { build: { outcome: 'skipped' } }).results.find(r => r.name === 'build').status, 'UNVERIFIED');

    // Artifact publishing never sweeps arbitrary fixture outputs, symlinks or saves.
    fs.writeFileSync(path.join(dir, 'private.save'), 'never upload');
    fs.writeFileSync(path.join(dir, 'game.html'), '<private>');
    fs.writeFileSync(path.join(dir, 'check.log'), 'controlled log');
    fs.symlinkSync(path.join(dir, 'private.save'), path.join(dir, 'browser.log'));
    const upload = prepareUpload(ctx);
    assert.ok(upload.files.includes('check.log'));
    assert.ok(!upload.files.includes('private.save'));
    assert.ok(!upload.files.includes('game.html'));
    assert.ok(!upload.files.includes('browser.log'));
    assert.ok(upload.bytes <= 16 * 1024 * 1024);
    const fixture = path.join(dir, 'fixtures/settings-ci.cjs');
    fs.mkdirSync(fixture, { recursive: true });
    fs.writeFileSync(path.join(fixture, 'snapshot.json'), 'x'.repeat(65537));
    fs.rmSync(path.join(dir, 'upload'), { recursive: true });
    assert.ok(!prepareUpload(ctx).files.includes('fixtures/settings-ci.cjs/snapshot.json'));

    const priorEnv = Object.fromEntries(['MOODY_EVIDENCE_ID', 'MOODY_CHECK_NAME', 'MOODY_EVIDENCE_DIR'].map(key => [key, process.env[key]]));
    const captureId = `selftest-capture-${process.pid}`;
    const captureDir = path.join(root, 'tests/artifacts/ci', captureId);
    try {
      process.env.MOODY_EVIDENCE_ID = captureId;
      process.env.MOODY_CHECK_NAME = 'settings-ci.cjs';
      process.env.MOODY_EVIDENCE_DIR = path.join(captureDir, 'fixtures/settings-ci.cjs');
      await captureFailure(null, { kind: 'settings', error: Error('controlled assertion'), snapshot: Array.from({ length: 1000 }, () => ({ a: 'x'.repeat(40) })) });
      const captured = fs.readFileSync(path.join(process.env.MOODY_EVIDENCE_DIR, 'snapshot.json'));
      assert.ok(captured.length <= 65536, 'limit must apply after pretty printing');
      assert.ok(JSON.parse(captured).snapshotOmitted);
      let screenshotOptions;
      await captureFailure({ viewportSize: () => ({ width: 3840, height: 2160 }), screenshot: async options => { screenshotOptions = options; return Buffer.from('controlled screenshot stub'); } }, {
        kind: 'settings', error: Error('controlled wide viewport'), snapshot: { focusRect: { x: NaN, y: Infinity, width: 44, height: 44 } }
      });
      assert.equal(screenshotOptions.scale, 'css');
      assert.equal(screenshotOptions.clip.width, 2048); assert.equal(screenshotOptions.clip.height, 1536);
      assert.ok(Object.values(screenshotOptions.clip).every(Number.isFinite));
      process.env.MOODY_CHECK_NAME = 'device-layouts.cjs';
      process.env.MOODY_EVIDENCE_DIR = path.join(captureDir, 'fixtures/device-layouts.cjs');
      assert.throws(() => writeLayoutReport({ padding: 'x'.repeat(262144) }), /256 KiB/);
      assert.equal(writeLayoutReport({ status: 'FAIL', depth: 'standard', results: [] }), true);
      const layoutFile = JSON.parse(fs.readFileSync(path.join(process.env.MOODY_EVIDENCE_DIR, 'layout-report.json')));
      assert.ok(layoutFile.identity.source.head, 'standalone controlled report binds its observed source');
    } finally {
      for (const [key, value] of Object.entries(priorEnv)) value === undefined ? delete process.env[key] : process.env[key] = value;
      fs.rmSync(captureDir, { recursive: true, force: true });
    }
    console.log('PASS Moody Blues evidence: exit/timeout/cancel, bounded logs, missing/stale evidence, fail-closed summary and artifact allowlist');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch(error => { require('../scripts/ci-process-receipt.cjs').terminalFailure(error); process.exitCode = 1; });
