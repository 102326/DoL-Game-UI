const fs = require('node:fs');
const path = require('node:path');
const { suites, stages, coverage, context, writeJson, overall, runCommand, summarize, prepareUpload, layoutEvidence } = require('./ci-evidence.cjs');

async function runSuite(ctx, mode, tests = suites[mode], { signal, timeoutMs = 120000, quiet = false } = {}) {
  const report = { schema: 1, identity: ctx.identity, suite: mode, coverage, expected: tests, status: 'UNVERIFIED',
    results: tests.map(name => ({ name, scope: mode === 'unit' ? 'Unit/source contract' : 'Controlled browser fixture', status: 'UNVERIFIED', rawStatus: 'not-run', milliseconds: null, exitCode: null, signal: null })) };
  const save = () => { report.status = overall(report.results.map(r => r.status)); writeJson(path.join(ctx.dir, mode + '.json'), report); };
  save(); let blocked;
  for (const check of report.results) {
    if (blocked || signal?.aborted) { Object.assign(check, { status: 'BLOCKED', reason: blocked || 'cancelled' }); save(); continue; }
    Object.assign(check, { status: 'PARTIAL', rawStatus: 'running', startedAt: new Date().toISOString(), log: `${mode}/${check.name}.log`, evidence: [] }); save();
    const env = { ...process.env, MOODY_CHECK_NAME: check.name, MOODY_EVIDENCE_DIR: path.join(ctx.dir, 'fixtures', check.name) };
    const checkTimeout = check.name === 'device-layouts.cjs' ? (process.env.MOODY_DEVICE_DEPTH === 'deep' ? 10 : 6) * 60 * 1000 : timeoutMs;
    const result = await runCommand(process.execPath, [path.join(ctx.root, 'tests', check.name)], { cwd: ctx.root, log: path.join(ctx.dir, check.log), env, timeoutMs: checkTimeout, signal, quiet });
    Object.assign(check, result);
    if (check.name === 'device-layouts.cjs' && check.status === 'PASS' && !layoutEvidence(ctx)) {
      Object.assign(check, { status: 'UNVERIFIED', reason: 'Required device coverage evidence missing or incomplete' });
    }
    check.evidence = ['snapshot.json', 'viewport.jpg', 'layout-report.json'].map(file => `fixtures/${check.name}/${file}`).filter(file => fs.existsSync(path.join(ctx.dir, file)));
    if (check.status !== 'PASS') blocked = `Fail-fast after ${check.name} (${check.rawStatus})`;
    save(); if (!quiet) console.log(`${check.status} ${check.name} (${check.milliseconds}ms, exit=${check.exitCode}, signal=${check.signal})`);
  }
  return report;
}

async function main() {
  const mode = process.argv[2];
  if (!Object.hasOwn(suites, mode) && !['stage', 'summary'].includes(mode)) throw Error('Expected unit, browser, stage <id>, or summary');
  const ctx = context(), controller = new AbortController();
  let interrupted;
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { interrupted = signal; controller.abort(); });
  writeJson(path.join(ctx.dir, 'identity.json'), { schema: 1, identity: ctx.identity, coverage });
  const execute = (command, args, log, env, timeoutMs) => runCommand(command, args, { cwd: ctx.root, log: path.join(ctx.dir, log), env, timeoutMs, signal: controller.signal });

  if (mode === 'summary') {
    const summary = summarize(ctx, JSON.parse(process.env.MOODY_STEPS || '{}'));
    writeJson(path.join(ctx.dir, 'summary.json'), summary);
    const upload = prepareUpload(ctx);
    const text = `\n### Moody Blues: ${summary.status}\n\nSource: \`${ctx.identity.source.head}\` (${ctx.identity.source.dirty ? 'dirty' : 'clean'}); content SHA-256: \`${ctx.identity.source.contentSha256}\`.\n\n| Required stage | Status | Raw outcome | Reason |\n| --- | --- | --- | --- |\n${summary.results.map(r => `| ${r.name} | ${r.status} | ${r.rawStatus} | ${r.reason || 'See result and bounded log'} |`).join('\n')}\n\n${coverage}\n\nEvidence: \`kraft-work-checks-${process.env.GITHUB_SHA || ctx.identity.source.head}\`, ${upload.files.length} files / ${upload.bytes} bytes; omissions: ${upload.omitted.length}. Source/run identity and relative paths are in summary.json and upload-index.json.\n`;
    console.log(text);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
    process.exitCode = summary.status === 'PASS' ? 0 : 1;
    return;
  }

  if (mode === 'stage') {
    const stage = stages.find(s => s.id === process.argv[3]);
    if (!stage) throw Error('Unknown CI stage');
    const file = path.join(ctx.dir, `stage-${stage.id}.json`);
    const record = { schema: 1, identity: ctx.identity, name: stage.id, scope: stage.scope, status: 'PARTIAL', rawStatus: 'running', startedAt: new Date().toISOString(), log: `${stage.id}.log` };
    writeJson(file, record);
    const result = await execute(stage.command || 'npm', stage.args, record.log, process.env, 12 * 60 * 1000);
    Object.assign(record, result); writeJson(file, record);
    console.log(`${record.status} ${stage.id} (${record.milliseconds}ms, exit=${record.exitCode}, signal=${record.signal})`);
    process.exitCode = interrupted ? interrupted === 'SIGINT' ? 130 : 143 : record.status === 'PASS' ? 0 : 1;
    return;
  }

  const report = await runSuite(ctx, mode, suites[mode], { signal: controller.signal });
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n### ${mode}: ${report.status}\n\n| Check | Status | Raw outcome | Milliseconds | Exit / signal |\n| --- | --- | --- | --- | --- |\n${report.results.map(r => `| ${r.name} | ${r.status} | ${r.rawStatus} | ${r.milliseconds ?? '-'} | ${r.exitCode ?? '-'} / ${r.signal ?? '-'} |`).join('\n')}\n\n${coverage}\n`);
  process.exitCode = interrupted ? interrupted === 'SIGINT' ? 130 : 143 : report.status === 'PASS' ? 0 : 1;
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { runSuite };
