import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runResearch} from '../../scripts/ci/research-runner.ts';
import {verifiedPass} from '../../scripts/ci/result-status.ts';
import type {Context} from '../../scripts/ci/upload.ts';
import type catalog from '../../scripts/ci-catalog.cjs';

type Check = typeof catalog.researchPlan[number];
const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const artifacts = path.join(root, 'tests/artifacts/ui42/ci-c1/dependency-shadow');
mkdirSync(artifacts, {recursive:true});
const dir = mkdtempSync(path.join(artifacts, 'run-'));
// A source-less context follows observeSource's isolated fixture convention; this is not product execution.
const ctx:Context = {root, dir, identity:{source:{head:'controlled-fixture'}, run:{id:'dependency-shadow', attempt:'1'}}};
const check = (id:string, code:string):Check => ({id, command:process.execPath, args:['-e', code], execution:'contract'});
const checks:Check[] = [
 check('source-check', "require('node:assert/strict').fail('controlled source-check failure')"),
 check('framework-build', "require('node:assert/strict').fail('framework-build must not run')"),
 check('settings-ci', "require('node:assert/strict').fail('settings-ci must not run')"),
 check('prototype-check', "require('node:assert/strict').ok(true); console.log('independent prototype executed')")
];
const report = await runResearch(ctx, {checks, quiet:true});
const row = (name:string) => {const result=report.results.find(r=>r.name===name); assert.ok(result, name); return result;};
const failed = row('source-check');
assert.equal(failed.status, 'FAIL');
assert.equal(failed.rawStatus, 'failed');
assert.equal(failed.reasonCode, 'AssertionFailed');
assert.equal(failed.terminalReceipt && typeof failed.terminalReceipt === 'object' && 'terminal' in failed.terminalReceipt && failed.terminalReceipt.terminal, true);
assert.match(readFileSync(path.join(dir, 'research/source-check.log'), 'utf8'), /controlled source-check failure/);
for (const id of ['framework-build', 'settings-ci']) {
 const blocked = row(id);
 assert.equal(blocked.status, 'UNVERIFIED');
 assert.equal(blocked.rawStatus, 'blocked');
 assert.equal(blocked.reasonCode, 'PrerequisiteFailed');
 assert.equal(blocked.executionId, undefined);
 assert.equal(existsSync(path.join(dir, 'research', id+'.log')), false);
}
const independent = row('prototype-check');
assert.equal(verifiedPass(independent, 'contract'), true);
assert.equal(typeof independent.pid, 'number');
assert.match(readFileSync(path.join(dir, 'research/prototype-check.log'), 'utf8'), /independent prototype executed/);
assert.equal(report.status, 'FAIL');

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 500);
try {
 const cancelled = await runResearch({...ctx, dir:path.join(dir, 'cancelled')}, {checks:[
  check('source-check', "console.log('controlled cancellation started'); setTimeout(() => {}, 10000)"),
  check('prototype-check', "require('node:assert/strict').ok(true)")
 ], signal:controller.signal, quiet:true});
 assert.equal(cancelled.status, 'CANCELLED');
 assert.deepEqual(cancelled.results.map(r=>r.status), ['CANCELLED', 'CANCELLED']);
 assert.deepEqual(cancelled.results.map(r=>r.rawStatus), ['cancelled', 'cancelled']);
 assert.equal(typeof cancelled.results[0]?.pid, 'number');
 assert.equal(cancelled.results[1]?.executionId, undefined);
 assert.equal(cancelled.results.some(r=>verifiedPass(r, 'contract')), false);
} finally {clearTimeout(timer);}
console.log('PASS controlled dependency shadow and cancellation; evidence:', dir);
