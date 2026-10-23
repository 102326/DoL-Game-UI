// Research profile of the existing Moody runner. Baseline revisions stay in raw reports.
const fs = require('node:fs'), path = require('node:path');
const { writeJson, runCommand, overall, verifiedPass, sameIdentity, sourceIdentity, readReport, hash, finalizeUpload } = require('./ci-evidence.cjs');
const cases = require('./research-cases.json');
const node = (id, args, report) => ({ id, command: process.execPath, args, report });
const npm = (id, name) => ({ id, command: 'npm', args: ['run', name] });
const test = (name, report, flags = []) => node(name + flags.join(''), ['tests/' + name + '.cjs', ...flags], report);
const checks = (name, pattern, field = 'checks', key) => ({ pattern, field, key, expected: cases[name] });
const list = (pattern, field, key, expected) => ({ pattern, field, key, expected });
const plan = [
  npm('prototype-check', 'prototype:golden-spin:check'), npm('source-check', 'ci:check'), npm('prototype-build', 'prototype:golden-spin:build'),
  test('golden-spin-b', checks('golden-spin-b', 'golden-spin-b/sphere-validation-[0-9]+/result.json')),
  test('golden-spin-hub', checks('golden-spin-hub', 'golden-spin-b/hub-validation-[0-9]+/result.json')),
  test('motion-workspace', checks('motion-workspace', 'golden-spin-b/windows-validation-[0-9]+/result.json')),
  test('golden-spin-hub-input', checks('golden-spin-hub-input', 'golden-spin-b/hub-validation-input-[0-9]+/result.json')),
  test('golden-spin-hub-lifecycle', checks('golden-spin-hub-lifecycle', 'golden-spin-b/hub-validation-lifecycle-[0-9]+/result.json', 'results', 'name')),
  { id: 'settings-baselines', command: 'git', args: ['fetch', '--no-tags', '--depth=1', 'origin', '915dcb9e85f3266a73a3e7ce38d769edd0c29ff4', 'b507f1a7d18d4d77067fa0c793aea44d7de96b57'] },
  node('settings-prepare', ['scripts/prepare-settings-refraction.mjs']),
  node('settings-types', ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit', '-p', 'tsconfig.settings-refraction.json']),
  node('settings-build', ['node_modules/vite/bin/vite.js', 'build', '--config', 'vite.settings-refraction.config.ts']),
  node('settings-study', ['scripts/check-settings-refraction.cjs'], checks('check-settings-refraction', 'settings-refraction-v1/review-[0-9]+/result.json')),
  node('framework-build', ['scripts/build-framework.mjs']),
  test('settings-ci', { pattern: 'evolution/settings-resources.json', shape: 'settings' }),
  test('moody-historical-regressions', { fixture: true }),
  test('official-game-motion'),
  test('source-motion-lifecycle', list('evolution/source-motion.json', 'result.arrivals', null, ['latest','peer','peer-again','other-node'])),
  test('game-first-motion'),
  node('evolution-unit', ['--test', 'tests/adapter-build-boundary.test.cjs', 'tests/visual-scope.test.cjs', 'tests/evolution-resource-contract.test.cjs']),
  test('evolution-owner-resources', list('evolution/owners.json', 'results', 'kind', ['settings','layout','attributes','social','panels','shop','wardrobe','saves','combat','floating','official-motion','weather','hub'])),
  node('inventory', ['scripts/evolution-inventory.cjs'], { pattern: 'evolution/inventory.json', shape: 'inventory' }),
  test('evolution-navigation', list('evolution/navigation.json', 'results', 'kind', ['characteristics','social'])),
  test('evolution-panels', list('evolution/panels.json', '', 'kind', ['journal','traits','statistics','feats','cheats','options'])),
  test('evolution-orbit', list('evolution/orbit.json', 'results', 'zoom', [1,1.25,.85])), test('panels-framework'),
  node('weather-types', ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit', '-p', 'tsconfig.evolution.json']),
  node('weather-build', ['node_modules/vite/bin/vite.js', 'build', '--config', 'vite.evolution-weather.config.ts']),
  test('evolution-weather', checks('evolution-weather', 'evolution/weather-review-[0-9]+/result.json')),
  test('evolution-weather-candidates', list('evolution/weather-r2-[0-9]+/result.json', 'results', 'candidate', ['v1','beads','film'])),
  node('weather-unit', ['--test', 'tests/evolution-rain-model.test.cjs', 'tests/evolution-scattered-shower.test.cjs']),
  ...[['', 'r3'], ['--natural-trails','r4'], ['--runoff','r5']].map(([flag, rev]) => test('evolution-rain-glass', { pattern: `evolution/weather-${rev}-[0-9]+/result.json`, shape: 'glass' }, flag ? [flag] : [])),
  test('evolution-weather-levels', list('evolution/weather-r6-[0-9]+/result.json', 'results', 'level', ['light','normal','heavy','severe','snow'])),
  ...[['','r7'],['--force','r8'],['--scatter','r9']].map(([flag, rev]) => test('evolution-weather-shower', { pattern: `evolution/weather-${rev}-[0-9]+/result.json`, shape: 'shower', count: flag ? 5 : 3, scatter: flag === '--scatter' }, flag ? [flag] : []))
];
function safeSource(root, file) {
  const relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return false;
  let current = root;
  for (const part of ['', ...relative.split(path.sep)]) {
    current = path.join(current, part);
    if (!fs.existsSync(current) || fs.lstatSync(current).isSymbolicLink()) return false;
  }
  return fs.realpathSync(file) === path.join(fs.realpathSync(root), relative);
}
function filesBelow(dir, root) {
  if (!safeSource(root, dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? filesBelow(path.join(dir, e.name), root) : e.isFile() ? [path.join(dir, e.name)] : []);
}
function reportsFor(ctx, spec) {
  if (!spec?.pattern) return [];
  const base = path.join(ctx.root, 'tests/artifacts'), regex = new RegExp('^' + spec.pattern.replaceAll('.', '\\.') + '$');
  return filesBelow(base, ctx.root).filter(f => regex.test(path.relative(base, f).split(path.sep).join('/')));
}
function stamp(file) { const s = fs.statSync(file); return `${s.mtimeMs}:${s.ctimeMs}:${s.size}:${hash(fs.readFileSync(file))}`; }
function caseIds(spec, data, ctx) {
  if (data?.errors?.length || data?.baseline === true || data?.record === true) throw Error('Report contains errors or an unexpected baseline/record mode');
  if ((data.sourceHead && data.sourceHead !== ctx.identity.source.head) || (data.identity?.head && data.identity.head !== ctx.identity.source.head)) throw Error('Raw report source identity mismatch');
  if (spec.field === 'checks' && !Array.isArray(data.errors)) throw Error('Incomplete named-check report structure');
  let ids;
  if (spec.shape === 'inventory') {
    if (data.schema !== 1 || data.sourceBase !== ctx.identity.source.head || !Array.isArray(data.consumers) || !data.consumers.length) throw Error('Incomplete inventory/source identity');
    ids = ['inventory'];
  } else if (spec.shape === 'settings') {
    if (data.mounted?.workspaces !== 1 || !(data.queued?.frames > 0) || data.disposed?.frames !== 0 || data.disposed?.workspaces !== 0 || !sameIdentity(data.disposed, data.late)) throw Error('Incomplete settings resources');
    ids = ['settings-resources'];
  } else if (spec.shape === 'glass') {
    ids = data.results?.map(r => r.scene || r.candidate);
    if (!sameIdentity(ids, ['material','glass']) || !data.results[0].displacementPixelCheck?.startsWith('PASS:') || data.results[1].lifecycleChecked !== true) throw Error('Incomplete glass cases');
  } else if (spec.shape === 'shower') {
    if (!Array.isArray(data.states) || data.states.length !== spec.count || data.states.some(s => !s.target?.kind) || !Array.isArray(data.events) || (spec.scatter && data.transitions?.length !== 7)) throw Error('Incomplete shower states/transitions');
    ids = data.states.map((s, i) => `${i}:${s.target.kind}:${s.target.rain ?? ''}`);
    const expectedRain = spec.count === 3 ? ['light','severe'] : ['light','normal','heavy','severe'];
    if (!sameIdentity(data.states.slice(0,-1).map(s=>s.target.rain), expectedRain) || data.states.at(-1).target.kind !== 'snow') throw Error('Unexpected shower case identity');
  } else {
    const values = spec.field ? spec.field.split('.').reduce((v,k)=>v?.[k], data) : data;
    if (!Array.isArray(values) || values.some(v => v?.status && v.status !== 'PASS')) throw Error('Incomplete report cases');
    ids = spec.key ? values.map(v=>v?.[spec.key]) : values;
    if (!sameIdentity(ids, spec.expected)) throw Error('Required case plan mismatch');
  }
  if (!ids?.length || new Set(ids).size !== ids.length) throw Error('Missing or duplicate case IDs');
  return ids;
}
function recordReport(ctx, check, before) {
  const spec = check.report;
  if (!spec) return { caseIds: ['command:' + check.id], artifacts: [] };
  if (spec.fixture) {
    const relative = 'fixtures/moody-historical-regressions.cjs/snapshot.json', file = path.join(ctx.dir, relative);
    const data = JSON.parse(fs.readFileSync(file));
    if (!sameIdentity(data.identity, ctx.identity) || data.assertion?.code !== 'MOODY_ORBIT_NONFINITE' || !data.snapshot?.expectedCounterexample) throw Error('Historical target snapshot missing/stale/wrong failure');
    return { caseIds: ['MOODY_ORBIT_NONFINITE'], artifacts: [{ file: relative, sha256: hash(fs.readFileSync(file)) }] };
  }
  const fresh = reportsFor(ctx, spec).filter(f=>before.get(f) !== stamp(f));
  if (fresh.length !== 1) throw Error(`Expected one fresh required report for ${check.id}; got ${fresh.length}`);
  const bytes = fs.readFileSync(fresh[0]);
  if (bytes.length > 2 * 1024 * 1024) throw Error('Required research report exceeds 2 MiB');
  const data = JSON.parse(bytes), ids = caseIds(spec, data, ctx);
  // Raw baseline/revision fields are preserved; actual source/run identity is in the envelope.
  const file = `research/${check.id}/result.json`;
  fs.mkdirSync(path.dirname(path.join(ctx.dir, file)), { recursive: true }); fs.copyFileSync(fresh[0], path.join(ctx.dir, file));
  return { caseIds: ids, artifacts: [{ file, sha256: hash(bytes), origin: path.relative(ctx.root, fresh[0]) }] };
}
async function runResearch(ctx, { signal, quiet = false, checks: selected = plan } = {}) {
  const report = { schema: 1, identity: ctx.identity, suite: 'research', expected: selected.map(c=>c.id), status: 'UNVERIFIED', results: [] };
  let blocked = false;
  for (const check of selected) {
    let result = { name: check.id, status: 'BLOCKED', rawStatus: 'not-run', caseIds: [], artifacts: [] };
    if (!blocked && !signal?.aborted) {
      const before = new Map(reportsFor(ctx, check.report).map(f=>[f,stamp(f)]));
      const env = { ...process.env, MOODY_CHECK_NAME: check.args[0]?.split('/').at(-1), MOODY_EVIDENCE_DIR: path.join(ctx.dir, 'fixtures', check.args[0]?.split('/').at(-1) || check.id) };
      const outcome = await runCommand(check.command, check.args, { cwd: ctx.root, log: path.join(ctx.dir, 'research', check.id + '.log'), timeoutMs: 120000, signal, env, quiet });
      Object.assign(result, outcome);
      if (verifiedPass(result)) {
        try { Object.assign(result, recordReport(ctx, check, before)); }
        catch (error) { Object.assign(result, { status: 'UNVERIFIED', reason: error.message }); }
      }
      blocked = result.status !== 'PASS';
    }
    report.results.push(result);
    report.status = overall([...report.results.map(r=>r.status), ...(report.results.length < selected.length ? ['UNVERIFIED'] : [])]);
    writeJson(path.join(ctx.dir, 'research.json'), report);
    if (!quiet) console.log(`${result.status} ${check.id}`, result.reason || result.rawStatus);
  }
  return report;
}
function researchSummary(ctx, steps = {}) {
  const report = readReport(ctx, 'research.json'), results = [];
  for (const id of ['dependencies','browser-install']) {
    const r = readReport(ctx, `stage-${id}.json`);
    results.push({ name: id, status: verifiedPass(r) && r.schema === 1 ? 'PASS' : 'UNVERIFIED' });
  }
  try {
    if (report?.schema !== 1 || report.suite !== 'research' || !sameIdentity(report.expected, plan.map(c=>c.id)) || report.results?.length !== plan.length) throw Error('Missing/incomplete research plan');
    for (const [i, check] of plan.entries()) {
      const r = report.results[i];
      if (r.name !== check.id || !verifiedPass(r) || !Array.isArray(r.artifacts)) throw Error(`Required command incomplete: ${check.id}`);
      if (check.report) {
        if (r.artifacts.length !== 1) throw Error('Required report missing');
        const a = r.artifacts[0];
        const expectedFile = check.report.fixture ? 'fixtures/moody-historical-regressions.cjs/snapshot.json' : `research/${check.id}/result.json`;
        if (a.file !== expectedFile) throw Error('Unexpected report path');
        const bytes = fs.readFileSync(path.join(ctx.dir, a.file));
        if (hash(bytes) !== a.sha256) throw Error('Research report hash mismatch');
        const raw = JSON.parse(bytes);
        const ids = check.report.fixture ? recordReport(ctx, check, new Map()).caseIds : caseIds(check.report, raw, ctx);
        if (!sameIdentity(r.caseIds, ids)) throw Error('Research case envelope mismatch');
      } else if (!sameIdentity(r.caseIds, ['command:' + check.id])) throw Error('Command case missing');
    }
    results.push({ name: 'research', status: report.status === 'PASS' ? 'PASS' : 'UNVERIFIED' });
  } catch (error) { results.push({ name: 'research', status: report?.status === 'FAIL' ? 'FAIL' : 'UNVERIFIED', reason: error.message }); }
  for (const id of ['checkout','node','dependencies','browser-install','research']) {
    if (steps[id] && steps[id].outcome !== 'success') results.push({ name: id, status: steps[id].outcome === 'cancelled' ? 'PARTIAL' : 'FAIL' });
  }
  return { schema: 1, identity: ctx.identity, status: overall(results.map(r=>r.status)), results, coverage: 'Controlled research contracts; no visual acceptance, game or physical-device claim.' };
}
function researchUpload(ctx, summary) {
  const report = readReport(ctx, 'research.json');
  const rawFiles = plan.filter(c=>c.report).map(c=>c.report.fixture ? 'fixtures/moody-historical-regressions.cjs/snapshot.json' : `research/${c.id}/result.json`);
  const required = ['identity.json','summary.json','research.json','stage-dependencies.json','stage-browser-install.json', ...rawFiles];
  const optional = plan.map(c=>`research/${c.id}.log`);
  // Keep controlled comparison builds/CSS and newly generated review pixels in a separate bounded layer.
  // Raw player data is never among these roots/extensions.
  const assets = [];
  for (const check of report?.results || []) for (const a of check.artifacts || []) {
    if (!a.origin) continue;
    const spec = plan.find(c=>c.id === check.name)?.report;
    const normalized = path.relative(path.join(ctx.root,'tests/artifacts'), path.resolve(ctx.root,a.origin)).split(path.sep).join('/');
    if (!spec?.pattern || !new RegExp('^' + spec.pattern.replaceAll('.', '\\.') + '$').test(normalized)) continue;
    const sourceDir = path.dirname(path.join(ctx.root, a.origin));
    for (const source of filesBelow(sourceDir, ctx.root).filter(f=>/\.(png|json)$/.test(f))) {
      const relative = `review/${check.name}/${path.basename(source)}`;
      fs.mkdirSync(path.dirname(path.join(ctx.dir, relative)), { recursive: true }); fs.copyFileSync(source, path.join(ctx.dir, relative)); assets.push(relative);
    }
  }
  for (const folder of ['golden-spin-b/dist','settings-refraction-v1/dist','evolution/weather-dist']) {
    for (const source of filesBelow(path.join(ctx.root, 'tests/artifacts', folder), ctx.root).filter(f=>/\.(css|js|html|svg|md|txt)$/.test(f) || path.basename(f)==='LICENSE')) {
      const relative = 'builds/' + path.relative(path.join(ctx.root,'tests/artifacts'), source).split(path.sep).join('/');
      fs.mkdirSync(path.dirname(path.join(ctx.dir, relative)), { recursive: true }); fs.copyFileSync(source, path.join(ctx.dir, relative)); assets.push(relative);
    }
  }
  return finalizeUpload(ctx, summary, { required, identityFiles: required.filter(f=>!rawFiles.includes(f)), candidates: [...required,...optional,...assets], totalLimit: 160 * 1024 * 1024,
    fileLimit: file => file.startsWith('review/') ? (file.endsWith('.png') ? 8 : 2) * 1024 * 1024 : file.startsWith('builds/') ? 8 * 1024 * 1024 : file.startsWith('research/') && file.endsWith('.json') ? 2 * 1024 * 1024 : undefined });
}
module.exports = { plan, caseIds, recordReport, runResearch, researchSummary, researchUpload, reportsFor, stamp };
