const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { classify, overall, runCommand, summarize, prepareUpload, writeJson, stages, suites } = require('../scripts/ci-evidence.cjs');
const { runSuite } = require('../scripts/test-ci.cjs');
const { captureFailure } = require('./moody-fixture-evidence.cjs');
const { root } = require('../scripts/ci-evidence.cjs');

(async () => {
  assert.equal(classify({ code: 0 }), 'PASS');
  assert.equal(classify({ code: null }), 'UNVERIFIED');
  assert.equal(classify({ code: 0, timedOut: true }), 'FAIL');
  assert.equal(classify({ code: 0, cancelled: true }), 'PARTIAL');
  assert.equal(overall([]), 'UNVERIFIED');
  assert.equal(overall(['PASS', 'BLOCKED']), 'PARTIAL');
  assert.equal(overall(['PASS', 'FAIL']), 'FAIL');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moody-evidence-'));
  const ctx = { dir, root: dir, identity: { source: { head: 'fixture', contentSha256: 'fixture' }, run: { id: 'fixture', attempt: '1' } } };
  try {
    const execute = (code, extra = {}) => runCommand(process.execPath, ['-e', code], { cwd: dir, log: path.join(dir, 'process.log'), quiet: true, timeoutMs: 5000, ...extra });
    assert.equal((await execute('console.log("executed")')).status, 'PASS');
    const failed = await execute('console.error("controlled assertion");process.exit(7)');
    assert.equal(failed.status, 'FAIL');
    assert.equal(failed.exitCode, 7);
    assert.match(fs.readFileSync(path.join(dir, 'process.log'), 'utf8'), /controlled assertion/);
    const timeout = await execute('setInterval(()=>{},1000)', { timeoutMs: 100 });
    assert.equal(timeout.rawStatus, 'timeout');
    assert.equal(timeout.status, 'FAIL');
    const controller = new AbortController();
    const cancelled = execute('setInterval(()=>{},1000)', { signal: controller.signal });
    setTimeout(() => controller.abort(), 100);
    assert.equal((await cancelled).rawStatus, 'cancelled');
    const noisy = await execute('process.stdout.write("x".repeat(300000))');
    assert.ok(noisy.logTruncated);
    assert.ok(fs.statSync(path.join(dir, 'process.log')).size <= 65536);

    fs.mkdirSync(path.join(dir, 'tests'));
    for (const [name, source] of Object.entries({ 'pass.cjs': 'console.log("controlled pass")', 'fail.cjs': 'process.exit(7)', 'slow.cjs': 'setInterval(()=>{},1000)', 'blocked.cjs': 'throw Error("must never run")' })) fs.writeFileSync(path.join(dir, 'tests', name), source);
    const suite = await runSuite(ctx, 'unit', ['pass.cjs', 'fail.cjs', 'blocked.cjs'], { quiet: true });
    assert.equal(suite.status, 'FAIL');
    assert.deepEqual(suite.results.map(r => r.status), ['PASS', 'FAIL', 'BLOCKED']);
    assert.equal(suite.results[2].rawStatus, 'not-run');
    assert.ok(!fs.existsSync(path.join(dir, 'unit/blocked.cjs.log')));
    const abortSuite = new AbortController();
    const pendingSuite = runSuite(ctx, 'unit', ['slow.cjs', 'blocked.cjs'], { signal: abortSuite.signal, quiet: true });
    const checkpoint = JSON.parse(fs.readFileSync(path.join(dir, 'unit.json')));
    assert.equal(checkpoint.status, 'PARTIAL');
    assert.equal(checkpoint.results[0].rawStatus, 'running');
    abortSuite.abort();
    const interruptedSuite = await pendingSuite;
    assert.equal(interruptedSuite.status, 'PARTIAL');
    assert.equal(interruptedSuite.results[0].rawStatus, 'cancelled');
    assert.equal(interruptedSuite.results[1].status, 'BLOCKED');

    // A green GitHub step without the matching result is not verification.
    let summary = summarize(ctx, Object.fromEntries(stages.map(s => [s.id, { outcome: 'success' }])));
    assert.notEqual(summary.status, 'PASS');
    assert.equal(summary.results.find(r => r.name === 'check').status, 'UNVERIFIED');
    for (const s of stages) {
      writeJson(path.join(dir, `stage-${s.id}.json`), { identity: ctx.identity, name: s.id, status: 'PASS', rawStatus: 'passed', exitCode: 0, milliseconds: 1 });
    }
    summary = summarize(ctx, {});
    assert.notEqual(summary.status, 'PASS', 'missing required suite reports cannot pass');
    for (const suite of ['unit', 'browser']) {
      writeJson(path.join(dir, `${suite}.json`), { identity: ctx.identity, suite, status: 'PASS', expected: suites[suite], results: suites[suite].map(name => ({ name, status: 'PASS', rawStatus: 'passed', exitCode: 0, milliseconds: 1 })) });
    }
    summary = summarize(ctx, { checkout: { outcome: 'success' }, node: { outcome: 'success' }, python: { outcome: 'success' } });
    assert.equal(summary.status, 'PASS');
    const browserFile = path.join(dir, 'browser.json');
    const fullBrowser = JSON.parse(fs.readFileSync(browserFile));
    writeJson(browserFile, { ...fullBrowser, results: fullBrowser.results.slice(1) });
    assert.equal(summarize(ctx, {}).results.find(r => r.name === 'browser').status, 'UNVERIFIED');
    writeJson(browserFile, fullBrowser);
    assert.equal(summarize(ctx, { browser: { outcome: 'cancelled' } }).results.find(r => r.name === 'browser').status, 'PARTIAL');
    writeJson(path.join(dir, 'stage-check.json'), { identity: { source: { head: 'stale' } }, name: 'check', status: 'PASS', exitCode: 0 });
    assert.equal(summarize(ctx, {}).results.find(r => r.name === 'check').status, 'UNVERIFIED', 'stale report cannot pass');
    assert.equal(summarize(ctx, { build: { outcome: 'skipped' } }).results.find(r => r.name === 'build').status, 'BLOCKED');

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
    } finally {
      for (const [key, value] of Object.entries(priorEnv)) value === undefined ? delete process.env[key] : process.env[key] = value;
      fs.rmSync(captureDir, { recursive: true, force: true });
    }
    console.log('PASS Moody Blues evidence: exit/timeout/cancel, bounded logs, missing/stale evidence, fail-closed summary and artifact allowlist');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
