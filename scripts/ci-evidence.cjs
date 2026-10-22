// Moody Blues: evidence for the existing CI runner, using Node built-ins only.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const suites = {
  unit: ['adapter-build-boundary.test.cjs', 'ci-evidence.test.cjs', 'visual-scope.test.cjs', 'evolution-resource-contract.test.cjs', 'device-profiles.test.cjs', 'floating-preferences.test.cjs', 'test-workflow.test.cjs', 'status.test.cjs', 'target-version.test.cjs', 'wardrobe-data.test.cjs', 'wardrobe-source-m2.test.cjs', 'wardrobe-slot-mappings.test.cjs', 'wardrobe-performance.test.cjs', 'wardrobe-operations.test.cjs', 'render-state.test.cjs', 'startup-cache.test.cjs', 'mouth-compat-adapter.cjs'],
  browser: ['evolution-owner-resources.cjs', 'source-motion-lifecycle.cjs', 'game-first-motion.cjs', 'evolution-navigation.cjs', 'evolution-panels.cjs', 'evolution-orbit.cjs', 'panels-framework.cjs', 'framework.cjs', 'framework-connect.cjs', 'framework-startup.cjs', 'framework-commands.cjs', 'settings-ci.cjs', 'moody-historical-regressions.cjs', 'wardrobe-details-drawer.cjs', 'shop-source.test.cjs', 'save-transfer-lifecycle.cjs', 'header-weather.cjs', 'official-game-motion.cjs', 'kraft-work-adapters.cjs', 'optimization-wardrobe.cjs', 'wardrobe-wear-motion.cjs', 'selection-motion.cjs', 'shop-ripple-motion.cjs', 'official-defaults.cjs', 'combat-focused.cjs', 'combat-select.cjs', 'saves-viewport.cjs', 'adapter-materials.cjs', 'kraft-work-baseline.cjs', 'device-layouts.cjs', 'device-probe.cjs']
};
const stages = [
  { id: 'dependencies', scope: 'Locked npm dependencies and install scripts', args: ['ci'] },
  { id: 'check', scope: 'Render-state generation, TypeScript and Framework contracts', args: ['run', 'ci:check'] },
  { id: 'unit', scope: 'Required unit and source suite', args: ['run', 'ci:unit'] },
  { id: 'build', scope: 'Framework build and two player plus six current optional packages', args: ['run', 'ci:build'] },
  { id: 'packages', scope: 'Eight ZIP/version contracts, exact negative checks and two fresh builds', args: ['run', 'ci:packages'] },
  { id: 'browser-install', scope: 'Lockfile-pinned Playwright Chromium installation', command: 'npx', args: ['playwright', 'install', '--with-deps', 'chromium'] },
  { id: 'browser', scope: 'Required controlled browser suite, including historical negatives', args: ['run', 'ci:browser'] }
];
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
  const id = process.env.MOODY_EVIDENCE_ID || `local-${Date.now()}-${process.pid}`;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw Error('Invalid MOODY_EVIDENCE_ID');
  process.env.MOODY_EVIDENCE_ID = id;
  const dir = path.join(root, 'tests/artifacts/ci', id);
  fs.mkdirSync(dir, { recursive: true });
  const version = command => { try { return execFileSync(command, ['--version'], { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'] }).trim(); } catch { return null; } };
  const identity = {
    source: sourceIdentity(),
    run: { id, attempt: process.env.GITHUB_RUN_ATTEMPT || 'local', githubRunId: process.env.GITHUB_RUN_ID || null,
      repository: process.env.GITHUB_REPOSITORY || null, ref: process.env.GITHUB_REF || null,
      workflow: process.env.GITHUB_WORKFLOW || null, job: process.env.GITHUB_JOB || null,
      url: process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null },
    environment: { platform: process.platform, arch: process.arch, deviceDepth: process.env.MOODY_DEVICE_DEPTH || 'standard', node: process.version, npm: version('npm'), python: version('python'),
      playwright: require('../package-lock.json').packages['node_modules/playwright'].version,
      browser: process.platform === 'win32' ? 'Microsoft Edge (browser suite)' : 'Pinned Playwright Chromium (browser suite)' }
  };
  return { root, dir, identity };
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.tmp', JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(file + '.tmp', file);
}

function classify({ code, error, timedOut, cancelled }) {
  if (cancelled) return 'PARTIAL';
  if (timedOut || error || (code !== null && code !== undefined && code !== 0)) return 'FAIL';
  return code === 0 ? 'PASS' : 'UNVERIFIED';
}

function overall(statuses) {
  if (!statuses.length) return 'UNVERIFIED';
  if (statuses.every(s => s === 'PASS')) return 'PASS';
  if (statuses.includes('FAIL')) return 'FAIL';
  return statuses.some(s => s === 'PASS' || s === 'PARTIAL') ? 'PARTIAL' : 'UNVERIFIED';
}

function runCommand(command, args, { cwd = root, log, timeoutMs = 120000, signal, env = process.env, quiet = false } = {}) {
  return new Promise(resolve => {
    const start = Date.now(), outputHash = crypto.createHash('sha256');
    let tail = Buffer.alloc(0), bytes = 0, error, timedOut = false, cancelled = false, forceKill;
    const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'],
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
      resolve({ status: classify({ code, error: error || childSignal, timedOut, cancelled }),
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

function layoutEvidence(ctx) {
  const report = readReport(ctx, 'fixtures/device-layouts.cjs/layout-report.json');
  if (!report || report.status !== 'PASS') return false;
  try {
    const depth = ctx.identity.environment?.deviceDepth || 'standard';
    const expected = require('../tests/device-layouts.cjs').expectedCaseIds(depth);
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
    results.push({ name, scope, status: raw === 'success' ? 'PASS' : raw === 'failure' ? 'FAIL' : raw === 'skipped' ? 'BLOCKED' : 'UNVERIFIED',
      rawStatus: raw || 'unknown', reason: raw ? 'GitHub action outcome; not a test result' : 'No action outcome supplied (local or unavailable)' });
  }
  for (const stage of stages) {
    const result = readReport(ctx, `stage-${stage.id}.json`), raw = steps[stage.id]?.outcome;
    const entry = { name: stage.id, scope: stage.scope, status: 'UNVERIFIED', rawStatus: raw || 'missing-result', reason: 'Missing, invalid or stale result; cannot verify' };
    if (raw === 'skipped') Object.assign(entry, { status: 'BLOCKED', reason: 'Workflow skipped this required stage' });
    else if (raw === 'cancelled') Object.assign(entry, { status: 'PARTIAL', reason: 'Workflow cancelled this required stage' });
    else if (result?.name === stage.id) {
      Object.assign(entry, result, { scope: stage.scope }); delete entry.identity;
      entry.reason = result.status === 'PASS' ? 'Command completed with exit 0' : `Command outcome: ${result.rawStatus}; see bounded log`;
      if (result.status === 'PASS' && !verifiedPass(result)) Object.assign(entry, { status: 'UNVERIFIED', reason: 'Incomplete success record' });
      if (raw === 'failure' && entry.status === 'PASS') Object.assign(entry, { status: 'FAIL', reason: 'Workflow outcome contradicts success record' });
    }
    if (['unit', 'browser'].includes(stage.id) && entry.status === 'PASS') {
      const suite = readReport(ctx, stage.id + '.json');
      if (!suite || suite.status !== 'PASS' || JSON.stringify(suite.expected) !== JSON.stringify(suites[stage.id]) ||
          suite.results?.length !== suites[stage.id].length || !suite.results.every((r, i) => r.name === suites[stage.id][i] && verifiedPass(r))) {
        Object.assign(entry, { status: 'UNVERIFIED', reason: 'Required per-check evidence missing, incomplete or not passing' });
      }
      if (stage.id === 'browser' && entry.status === 'PASS' && !layoutEvidence(ctx)) {
        Object.assign(entry, { status: 'UNVERIFIED', reason: 'Device layout coverage report missing, stale, incomplete or not passing' });
      }
    }
    if (stage.id === 'packages' && entry.status === 'PASS' && !packageEvidence(ctx)) {
      Object.assign(entry, { status: 'UNVERIFIED', reason: 'Eight-package/version/negative/repeated-build evidence missing, stale or incomplete' });
    }
    results.push(entry);
  }
  if (steps['build-artifacts']) {
    const raw = steps['build-artifacts'].outcome;
    results.push({ name: 'build-artifacts', scope: 'Development ZIP artifact upload (not a Release)', rawStatus: raw,
      status: raw === 'success' ? 'PASS' : raw === 'failure' ? 'FAIL' : raw === 'skipped' ? 'BLOCKED' : 'UNVERIFIED' });
  }
  return { schema: 1, identity: ctx.identity, status: overall(results.map(r => r.status)), coverage, results,
    limitations: ['Hard runner termination can prevent final summary/upload; never infer PASS from absent artifacts.', 'Evidence upload happens after this summary; its final outcome is recorded by the GitHub job.', 'Windows and Android require their own environment-specific evidence.'] };
}

function prepareUpload(ctx) {
  const destination = path.join(ctx.dir, 'upload');
  if (fs.existsSync(destination)) throw Error('Upload directory already exists; use a fresh evidence ID');
  fs.mkdirSync(destination);
  const candidates = ['identity.json', 'unit.json', 'browser.json', 'summary.json', 'package-contracts.json', ...stages.flatMap(s => [`stage-${s.id}.json`, `${s.id}.log`]),
    ...Object.entries(suites).flatMap(([suite, tests]) => tests.map(test => `${suite}/${test}.log`)),
    ...fixtureChecks.flatMap(test => [`fixtures/${test}/snapshot.json`, `fixtures/${test}/viewport.jpg`]), 'fixtures/device-layouts.cjs/layout-report.json'];
  const files = [], omitted = []; let bytes = 0;
  for (const file of candidates) {
    const source = path.join(ctx.dir, file);
    if (!fs.existsSync(source)) continue;
    const stat = fs.lstatSync(source), limit = file.endsWith('.jpg') ? 524288 : file === 'fixtures/device-layouts.cjs/layout-report.json' ? 262144 : file.startsWith('fixtures/') ? 65536 : file.endsWith('.json') ? 262144 : 65536;
    const relativeReal = path.relative(fs.realpathSync(ctx.dir), fs.realpathSync(source));
    if (!stat.isFile() || stat.isSymbolicLink() || relativeReal.startsWith('..') || path.isAbsolute(relativeReal) || stat.size > limit || bytes + stat.size > 16 * 1024 * 1024) {
      omitted.push({ file, reason: 'Non-regular, outside run directory or evidence size limit' }); continue;
    }
    const target = path.join(destination, file);
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(source, target);
    files.push(file); bytes += stat.size;
  }
  writeJson(path.join(destination, 'upload-index.json'), { identity: ctx.identity, files: files.map(file => ({ file, sha256: hash(fs.readFileSync(path.join(destination, file))) })), bytes, omitted });
  return { files, bytes, omitted };
}

module.exports = { sourceIdentity, root, suites, stages, fixtureChecks, coverage, context, writeJson, classify, overall, runCommand, summarize, prepareUpload, layoutEvidence, packageEvidence, requiredPackages };
