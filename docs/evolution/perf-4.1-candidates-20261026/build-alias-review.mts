// Produce a review-only patch. Never applies it to this repository or any installed ModHub.
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {proposedVendorSource, browserBundle, digest} from './build-alias-browser.mts';
const out = resolve('tests/artifacts/evolution/alias-review-' + Date.now()), scratch = mkdtempSync(join(tmpdir(), 'softwet-alias-review-'));
mkdirSync(out, {recursive: true});
const original = readFileSync(new URL('../perf-4.1-evidence-20261026/vendor/modhub-market.js', import.meta.url), 'utf8'), candidate = proposedVendorSource();
writeFileSync(join(scratch, 'source.js'), original); writeFileSync(join(scratch, 'candidate.js'), candidate);
const diff = spawnSync('git', ['diff', '--no-index', '--', 'source.js', 'candidate.js'], {cwd: scratch, encoding: 'utf8'});
assert.equal(diff.status, 1, diff.stderr);
const patch = diff.stdout.replace(/^diff --git a\/source\.js b\/candidate\.js$/m, 'diff --git a/javascript/modhub-market.js b/javascript/modhub-market.js')
    .replace(/^--- a\/source\.js$/m, '--- a/javascript/modhub-market.js').replace(/^\+\+\+ b\/candidate\.js$/m, '+++ b/javascript/modhub-market.js')
    // Express an empty context line as an identical empty replacement: valid hunk counts, no trailing spaces.
    .replace(/^ $/gm, '-\n+');
assert.ok(!patch.includes('/Users/') && patch.startsWith('diff --git a/javascript/'));
writeFileSync(join(out, 'modhub-1.8.3-alias-rules.patch'), patch); writeFileSync(join(scratch, 'proposed.patch'), patch);
const target = join(scratch, 'target'); mkdirSync(join(target, 'javascript'), {recursive: true}); writeFileSync(join(target, 'javascript/modhub-market.js'), original);
const checks: {command: string; exitCode: number | null}[] = [];
for (const [command, args, cwd] of [
    [process.execPath, ['--check', join(scratch, 'candidate.js')], scratch],
    ['git', ['apply', '--check', join(scratch, 'proposed.patch')], target],
    ['git', ['apply', join(scratch, 'proposed.patch')], target]
] as const) {
    const result = spawnSync(command, args, {cwd, encoding: 'utf8'}); checks.push({command: command === process.execPath ? 'node --check candidate.js' : 'git ' + args.slice(0, -1).join(' ') + ' proposed.patch (scratch only)', exitCode: result.status}); assert.equal(result.status, 0, result.stderr);
}
assert.equal(digest(readFileSync(join(target, 'javascript/modhub-market.js'))), digest(candidate));
writeFileSync(join(out, 'NOTICE-ModHub.txt'), readFileSync(new URL('../perf-4.1-evidence-20261026/NOTICE-ModHub.txt', import.meta.url)));
writeFileSync(join(out, 'result.json'), JSON.stringify({status: 'PASS', checks, originalVendorSha256: digest(original), proposedVendorSha256: digest(candidate), patchSha256: digest(patch), browserBundleSha256: browserBundle(true).sha256, sourceSha256: digest(readFileSync(new URL('build-alias-review.mts', import.meta.url))), limits: 'Syntax, clean scratch application and resulting bytes only. No upstream communication, repository/vendor mutation, ModHub installation, full-game boot, update/install or device validation. Patch targets frozen 1.8.3 only.'}, null, 2));
console.log(out);
