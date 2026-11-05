import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync, renameSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {candidate, prerequisites, standardPrerequisites, verify} from './candidate.mts';
const dir = mkdtempSync(path.join(os.tmpdir(), 'ui42-c1-'));
const git = (...args: string[]) => execFileSync('git', args, {cwd: dir, stdio: 'pipe'}).toString().trim();
try {
 git('init', '-q'); git('config', 'core.autocrlf', 'true'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
 mkdirSync(path.join(dir, 'framework/official-ui'), {recursive: true});
 mkdirSync(path.join(dir, 'src/theme'), {recursive: true});
 mkdirSync(path.join(dir, 'src/ui/golden-spin'), {recursive: true});
 const acrylic = path.join(dir, 'src/theme/acrylic.ts'), hub = path.join(dir, 'src/ui/golden-spin/hub-motion.ts');
 writeFileSync(acrylic, 'original\n'); writeFileSync(hub, 'original\n');
 const motion = path.join(dir, 'framework/official-ui/motion.ts');
 writeFileSync(motion, 'original\n'); writeFileSync(path.join(dir, 'unknown-tracked.txt'), 'original\n'); git('add', '.'); git('commit', '-qm', 'base');
 const base = git('rev-parse', 'HEAD');
 writeFileSync(motion, 'committed\n'); git('add', '.'); git('commit', '-qm', 'change');
 const plan = candidate(dir, base);
 assert.equal(plan.mode, 'review-candidate');
 assert(plan.standard.includes('browser.official-game-motion.cjs'));
 assert(plan.standard.includes('browser.evolution-owner-resources.cjs'));
 assert(plan.research.includes('research.evolution-owner-resources'));
 for (const id of ['stage.dependencies', 'stage.check', 'stage.build', 'stage.packages', 'stage.browser-install']) assert(plan.standard.includes(id));
 assert(!plan.standard.includes('stage.browser'));
 assert.deepEqual(standardPrerequisites(['unit.example']), ['stage.check', 'stage.dependencies', 'unit.example']);
 assert(!verify(dir, base, {...plan, standard: plan.standard.filter(id => id !== 'browser.evolution-owner-resources.cjs')}));
 assert(!verify(dir, base, {...plan, standard: plan.standard.filter(id => id !== 'stage.build')}));
 assert(plan.research.includes('research.source-check'));
 assert(verify(dir, base, plan));
 assert(!verify(dir, base, {...plan, identity: {...plan.identity, head: '0'.repeat(40)}}));
 assert(!verify(dir, base, {...plan, research: plan.research.slice(1)}));
 const head = git('rev-parse', 'HEAD');
 for (const [file, standalone] of [[acrylic, true], [hub, false]] as const) {
  writeFileSync(file, 'changed\n');
  const scoped = candidate(dir, head);
  assert.equal(scoped.mode, 'review-candidate');
  assert(scoped.standard.includes('browser.evolution-owner-resources.cjs'));
  assert(scoped.standard.includes('browser.device-layouts.cjs'));
  assert(scoped.research.includes('research.evolution-owner-resources'));
  assert.equal(scoped.standalone.includes('tests/ui41-material.cjs'), standalone);
  if (standalone) assert(!verify(dir, head, {...scoped, standalone: []}));
  git('checkout', '--', path.relative(dir, file));
 }
 const otherBasePlan = candidate(dir, head);
 assert.equal(otherBasePlan.mode, 'full');
 assert(verify(dir, head, otherBasePlan));
 assert(!verify(dir, base, otherBasePlan));
 writeFileSync(motion, 'committed\r\n');
 assert.equal(git('diff', '--name-only'), '');
 assert(!verify(dir, base, plan));
 assert.notEqual(candidate(dir, base).identity.rawFiles, plan.identity.rawFiles);
 const deps = prerequisites(['settings-study']);
 for (const id of ['settings-study', 'settings-build', 'settings-types', 'settings-prepare', 'settings-baselines']) assert(deps.includes(`research.${id}`));
 assert.throws(() => prerequisites(['missing-id']));
 writeFileSync(motion, 'unstaged\n');
 assert(!verify(dir, base, plan));
 const dirty = candidate(dir, base); assert.equal(dirty.mode, 'review-candidate'); assert(verify(dir, base, dirty));
 git('add', '.'); const staged = candidate(dir, base); assert.equal(staged.mode, 'review-candidate'); assert.notEqual(staged.identity.staged, dirty.identity.staged);
 writeFileSync(path.join(dir, 'unknown.txt'), 'unknown');
 assert.equal(candidate(dir, base).mode, 'full');
 rmSync(path.join(dir, 'unknown.txt')); git('reset', '--hard', '-q', 'HEAD');
 // Index flags hide changes from Git diff. Both flags and unknown paths must widen scope,
 // and the actual bytes must remain bound even while Git keeps hiding subsequent edits.
 for (const [flag, clear, hiddenFile] of [
  ['--assume-unchanged', '--no-assume-unchanged', acrylic],
  ['--skip-worktree', '--no-skip-worktree', path.join(dir, 'unknown-tracked.txt')]
 ] as const) {
  const relative = path.relative(dir, hiddenFile);
  git('update-index', flag, relative);
  writeFileSync(hiddenFile, 'hidden first\n'); writeFileSync(motion, 'visible\n');
  const hiddenPlan = candidate(dir, head);
  assert.equal(hiddenPlan.mode, 'full'); assert(verify(dir, head, hiddenPlan));
  writeFileSync(hiddenFile, 'hidden second\n');
  assert(!verify(dir, head, hiddenPlan));
  rmSync(hiddenFile);
  const missingPlan = candidate(dir, head);
  assert.equal(missingPlan.mode, 'full'); assert(verify(dir, head, missingPlan));
  writeFileSync(hiddenFile, 'hidden second\n');
  assert(!verify(dir, head, missingPlan));
  git('update-index', clear, relative);
  assert(!verify(dir, head, hiddenPlan));
  const revealed = candidate(dir, head);
  assert(revealed.changes.some(c => c.paths.includes(relative)));
  assert.equal(revealed.mode, hiddenFile === acrylic ? 'review-candidate' : 'full');
  git('reset', '--hard', '-q', 'HEAD');
 }
 writeFileSync(motion, 'visible\n');
 assert.equal(candidate(dir, head).mode, 'review-candidate');
 git('reset', '--hard', '-q', 'HEAD');
 renameSync(motion, path.join(dir, 'framework/official-ui/renamed.ts')); git('add', '-A');
 const renamed = candidate(dir, base); assert.equal(renamed.mode, 'full'); assert(renamed.changes.some(c => c.status.startsWith('R')));
 git('reset', '--hard', '-q', 'HEAD'); rmSync(motion);
 const deleted = candidate(dir, base); assert.equal(deleted.mode, 'full'); assert(deleted.changes.some(c => c.status === 'D'));
 console.log('PASS: committed, staged, unstaged, untracked, rename/delete, transitive prerequisites, independent base, raw EOL, empty fallback, tampering');
} finally { rmSync(dir, {recursive: true, force: true}); }
