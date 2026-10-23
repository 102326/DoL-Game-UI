// Research profile of the existing Moody runner. Baseline revisions stay in raw reports.
const fs = require('node:fs'), path = require('node:path');
const { writeJson, runCommand, overall, verifiedPass, sameIdentity, sourceIdentity, readReport, hash, finalizeUpload,verdict,suiteEvidence,resultStatus } = require('./ci-evidence.cjs');
const { researchPlan:plan,nodeCaseIds,commandCaseIds} = require('./ci-catalog.cjs');
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
  if (!spec) return {caseIds:commandCaseIds(check),artifacts:[]};
  if (spec.fixture) {
    const relative = 'fixtures/moody-historical-regressions.cjs/snapshot.json', file = path.join(ctx.dir, relative);
    const data = JSON.parse(fs.readFileSync(file));
    if (!sameIdentity(data.identity, ctx.identity) || data.assertion?.code !== 'ERR_ASSERTION' || !data.assertion.message?.startsWith('MOODY_ORBIT_NONFINITE:') || !data.snapshot?.expectedCounterexample) throw Error('Historical target snapshot missing/stale/wrong failure');
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
    let result = { name: check.id, status: signal?.aborted?'CANCELLED':'UNVERIFIED', rawStatus: 'not-run', caseIds: [], artifacts: [] };
    if (!blocked && !signal?.aborted) {
      const before = new Map(reportsFor(ctx, check.report).map(f=>[f,stamp(f)]));
      const env = { ...process.env, MOODY_CHECK_NAME: check.args[0]?.split('/').at(-1), MOODY_EVIDENCE_DIR: path.join(ctx.dir, 'fixtures', check.args[0]?.split('/').at(-1) || check.id) };
      const outcome = await runCommand(check.command, check.args, { cwd: ctx.root, log: path.join(ctx.dir, 'research', check.id + '.log'), timeoutMs: 120000, signal, env, quiet, execution:check.execution||'tool',requireAssertions:check.execution==='contract' });
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
  const observed=overall([report?.status||'UNVERIFIED',...(report?.results||[]).map(r=>resultStatus(r,plan.find(c=>c.id===r.name)?.execution||'tool'))]);
  for (const id of ['dependencies','browser-install']) {
    const r = readReport(ctx, `stage-${id}.json`);
    results.push({ name: id, status:verifiedPass(r)&&r.schema===1?'PASS':r?.status==='ERROR'?'ERROR':r?.status==='FAIL'?'FAIL':r?.status==='CANCELLED'?'CANCELLED':'UNVERIFIED' });
  }
  const unit=readReport(ctx,'unit.json');results.push({name:'research-unit',status:suiteEvidence(ctx,'unit',require('./ci-catalog.cjs').researchUnitEntries)?'PASS':['FAIL','ERROR','CANCELLED'].includes(unit?.status)?unit.status:'UNVERIFIED'});
  try {
    if (report?.schema !== 1 || report.suite !== 'research' || !sameIdentity(report.expected, plan.map(c=>c.id)) || report.results?.length !== plan.length) throw Error('Missing/incomplete research plan');
    for (const [i, check] of plan.entries()) {
      const r = report.results[i];
      const nativeIds=nodeCaseIds(check.args);if(nativeIds.length&&(!Array.isArray(r.nodeTests)||!sameIdentity(r.nodeTests.map(c=>c.id).sort(),[...nativeIds].sort())||r.nodeTests.some(c=>c.status!=='PASS')||r.nodeCaseIssues?.length))throw Error('Missing/duplicate/unknown/skipped native research cases');
      if(check.execution==='contract'&&!(Number.isSafeInteger(r.assertions)&&r.assertions>0||nativeIds.length&&r.nodeTests?.length))throw Error('Required research contract has no valid assertions: '+check.id);
      if (r.name !== check.id || !verifiedPass(r,check.execution||'tool') || !Array.isArray(r.artifacts)) throw Error(`Required command incomplete: ${check.id}`);
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
      } else if (!sameIdentity(r.caseIds, commandCaseIds(check))) throw Error('Command case missing');
    }
    results.push({ name: 'research', status: report.status === 'PASS' ? 'PASS' : 'UNVERIFIED' });
  } catch (error) { results.push({ name: 'research', status: ['FAIL','ERROR','CANCELLED'].includes(observed)?observed:'UNVERIFIED',evidenceIntegrity:'INCOMPLETE',reason:error.message }); }
  for (const id of ['checkout','node','dependencies','browser-install','research']) {
    if (steps[id] && steps[id].outcome !== 'success') results.push({ name: id, status: steps[id].outcome==='cancelled'?'CANCELLED':steps[id].outcome==='skipped'?'UNVERIFIED':'ERROR' });
  }
  const {catalogFor,catalogIdentity}=require('./ci-catalog.cjs'),catalog=readReport(ctx,'catalog.json');if(!catalog||!sameIdentity(catalog.catalog,catalogFor('research',ctx.identity.environment?.deviceDepth||'standard'))||!sameIdentity(ctx.identity.catalog,catalogIdentity('research',ctx.identity.environment?.deviceDepth||'standard')))results.push({name:'catalog',status:'UNVERIFIED',reasonCode:'CatalogMismatch'});
  const status=overall(results.map(r=>r.status));return { schema:1,identity:ctx.identity,...verdict(results.some(r=>r.status==='FAIL')?'FAIL':status==='PASS'?'PASS':'UNKNOWN',results.filter(r=>r.status==='UNVERIFIED'||r.evidenceIntegrity==='INCOMPLETE'),status),results, coverage: 'Controlled research contracts; no visual acceptance, game or physical-device claim.' };
}
function researchUpload(ctx, summary) {
  const report = readReport(ctx, 'research.json');
  const rawFiles = plan.filter(c=>c.report).map(c=>c.report.fixture ? 'fixtures/moody-historical-regressions.cjs/snapshot.json' : `research/${c.id}/result.json`);
  const required = ['catalog.json','identity.json','summary.json','research.json','stage-dependencies.json','stage-browser-install.json', ...rawFiles];
  const optional = plan.map(c=>`research/${c.id}.log`);
  // Keep controlled comparison builds/CSS and newly generated review pixels in a separate bounded layer.
  // Raw player data is never among these roots/extensions.
  const assets = [];
  for (const check of report?.results || []) for (const a of check.artifacts || []) {
    // Flat Evolution reports have no per-case review directory. Never sweep
    // their common parent, or every weather image is copied once per report.
    if (!a.origin || path.basename(a.origin) !== 'result.json') continue;
    const spec = plan.find(c=>c.id === check.name)?.report;
    const normalized = path.relative(path.join(ctx.root,'tests/artifacts'), path.resolve(ctx.root,a.origin)).split(path.sep).join('/');
    if (!spec?.pattern || !new RegExp('^' + spec.pattern.replaceAll('.', '\\.') + '$').test(normalized)) continue;
    const sourceDir = path.dirname(path.join(ctx.root, a.origin));
    if (!safeSource(ctx.root, sourceDir) || !fs.statSync(sourceDir).isDirectory()) continue;
    const siblings = fs.readdirSync(sourceDir, { withFileTypes: true }).filter(e=>e.isFile() && e.name !== 'result.json' && /\.(png|json|mp4|webm)$/.test(e.name));
    for (const entry of siblings) {
      const source = path.join(sourceDir, entry.name);
      const relative = `review/${check.name}/${path.basename(source)}`;
      fs.mkdirSync(path.dirname(path.join(ctx.dir, relative)), { recursive: true }); fs.copyFileSync(source, path.join(ctx.dir, relative)); assets.push(relative);
    }
  }
  for (const folder of ['golden-spin-b/dist','settings-refraction-v1/dist','evolution/weather-dist']) {
    for (const source of filesBelow(path.join(ctx.root, 'tests/artifacts', folder), ctx.root).filter(f=>/\.(css|js|html|svg|md|txt|json|png|jpe?g|webp|mp4|webm|woff2?)$/.test(f) || path.basename(f)==='LICENSE')) {
      const relative = 'builds/' + path.relative(path.join(ctx.root,'tests/artifacts'), source).split(path.sep).join('/');
      fs.mkdirSync(path.dirname(path.join(ctx.dir, relative)), { recursive: true }); fs.copyFileSync(source, path.join(ctx.dir, relative)); assets.push(relative);
    }
  }
  for (const file of ['golden-spin-b/bundle-sizes.json','settings-refraction-v1/provenance.json']) {
    const source = path.join(ctx.root, 'tests/artifacts', file);
    if (!safeSource(ctx.root, source) || !fs.statSync(source).isFile()) continue;
    const relative = 'build-metadata/' + file;
    fs.mkdirSync(path.dirname(path.join(ctx.dir, relative)), { recursive: true }); fs.copyFileSync(source, path.join(ctx.dir, relative)); assets.push(relative);
  }
  return finalizeUpload(ctx, summary, { required, identityFiles: required.filter(f=>!rawFiles.includes(f)), candidates: [...required,...optional,...assets], totalLimit: 160 * 1024 * 1024,
    fileLimit: file => file.startsWith('review/') ? (/\.(png|mp4|webm)$/.test(file) ? 8 : 2) * 1024 * 1024 : file.startsWith('builds/') ? 8 * 1024 * 1024 : file.startsWith('research/') && file.endsWith('.json') ? 2 * 1024 * 1024 : undefined });
}
module.exports = { plan, caseIds, recordReport, runResearch, researchSummary, researchUpload, reportsFor, stamp };
