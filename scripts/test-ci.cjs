const fs = require('node:fs');
const path = require('node:path');
const {testArgs}=require('./ci-catalog.cjs');
const { suites, stages, coverage, context, writeJson, overall, runCommand, summarize, finalizeUpload, layoutEvidence, checkpointEvidence } = require('./ci-evidence.cjs');

// Existing CommonJS CLI bridge; substantive scheduling is strict erasable TS.
const {runSuite}=require('./ci/runner.ts');

async function main() {
  const mode = process.argv[2];
  if (!Object.hasOwn(suites, mode) && !['stage', 'summary', 'research', 'research-summary'].includes(mode)) throw Error('Expected unit, browser, research, research-summary, stage <id>, or summary');
  const ctx = context({allowSourceDrift:['summary','research-summary'].includes(mode)}), controller = new AbortController();
  let interrupted;
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { interrupted = signal; controller.abort(); });
  writeJson(path.join(ctx.dir, 'identity.json'), { schema: 1, identity: ctx.identity, coverage });
  const execute = (command, args, log, env, timeoutMs) => runCommand(command, args, { cwd: ctx.root, log: path.join(ctx.dir, log), env, timeoutMs, signal: controller.signal, execution:'tool' });

  if (mode.startsWith('research')) {
    const { runResearch, researchSummary, researchUpload } = require('./ci-research.cjs');
    if (mode === 'research') {
      const report = await runResearch(ctx, { signal: controller.signal });
      process.exitCode = interrupted ? interrupted === 'SIGINT' ? 130 : 143 : report.status === 'PASS' ? 0 : 1;
    } else {
      const summary = researchSummary(ctx, JSON.parse(process.env.MOODY_STEPS || '{}'));
      const delivery = researchUpload(ctx, summary);
      const text = `Motion Evolution local preparation: ${delivery.status} (remote verification pending); source ${ctx.identity.source.head}; run ${ctx.identity.run.id}; ${delivery.files} files / ${delivery.bytes} bytes; ${delivery.omitted.length} optional omissions.\n${JSON.stringify({ results: summary.results, problems: delivery.problems }, null, 2)}\n`;
      console.log(text);
      if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
      process.exitCode = delivery.status === 'PASS' ? 0 : 1;
    }
    return;
  }

  if (mode === 'summary') {
    const summary = summarize(ctx, JSON.parse(process.env.MOODY_STEPS || '{}'));
    const upload = finalizeUpload(ctx, summary);
    const text = `\n### Moody Blues local preparation: ${upload.status} (remote verification pending)\n\nSource: \`${ctx.identity.source.head}\` (${ctx.identity.source.dirty ? 'dirty' : 'clean'}); content SHA-256: \`${ctx.identity.source.contentSha256}\`.\n\n| Required stage | Status | Raw outcome | Reason |\n| --- | --- | --- | --- |\n${summary.results.map(r => `| ${r.name} | ${r.status} | ${r.rawStatus} | ${r.reason || 'See result and bounded log'} |`).join('\n')}\n\n${coverage}\n\nEvidence: \`kraft-work-checks-${process.env.GITHUB_SHA || ctx.identity.source.head}\`, ${upload.files} files / ${upload.bytes} bytes; omissions: ${upload.omitted.length}. Source/run identity and relative paths are in summary.json and upload-index.json.\n`;
    console.log(text);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
    console.log(`Evidence delivery: ${upload.status}`, upload.problems);
    process.exitCode = upload.status === 'PASS' ? 0 : 1;
    return;
  }

  if (mode === 'stage') {
    const stage = stages.find(s => s.id === process.argv[3]);
    if (!stage) throw Error('Unknown CI stage');
    const file = path.join(ctx.dir, `stage-${stage.id}.json`);
    const record = { schema:1,identity:ctx.identity,cache:{npm:process.env.MOODY_NPM_CACHE_HIT||'unknown'},retry:{attempt:ctx.identity.run.attempt,automaticRetries:0},name: stage.id, scope: stage.scope, status: 'CANCELLED', rawStatus: 'running', startedAt: new Date().toISOString(), log: `${stage.id}.log` };
    writeJson(file, record);
    const result = await execute(stage.command || 'npm', stage.args, record.log, process.env, 12 * 60 * 1000);
    Object.assign(record,result);
    if(['unit','browser','packages'].includes(stage.id)){try{const inner=JSON.parse(fs.readFileSync(path.join(ctx.dir,stage.id==='packages'?'package-contracts.json':stage.id+'.json')));if(result.reasonCode==='ProcessExitError'&&inner.status!=='PASS')record.status=inner.status;record.assertionResult=record.status==='FAIL'?'FAIL':record.status==='PASS'?'PASS':'UNKNOWN';}catch{record.evidenceIntegrity='INCOMPLETE';record.status=overall([record.status,'UNVERIFIED']);}}
    writeJson(file,record);
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
