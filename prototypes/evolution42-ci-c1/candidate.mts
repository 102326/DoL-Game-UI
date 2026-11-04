import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, readlinkSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import catalog from '../../scripts/ci-catalog.cjs';

import {mappings, type Mapping} from './consumer-map.mts';

const normalize = (id: string) => id.startsWith('research.') ? id : `research.${id}`;
const research = catalog.catalogFor('research').contracts.map(c => {
 if (!('dependencies' in c)) throw Error(`missing dependencies for ${c.id}`);
 return {id: c.id, dependencies: c.dependencies};
});
const standard = catalog.catalogFor('standard').contracts.map(c => c.id);
const byId = new Map(research.map(c => [c.id, c]));
if (byId.size !== research.length || new Set(standard).size !== standard.length) throw Error('duplicate catalog ID');
export function prerequisites(consumers: string[]): string[] {
 const selected = new Set<string>(), visiting = new Set<string>();
 function visit(raw: string): void {
  const id = normalize(raw), contract = byId.get(id);
  if (!contract) throw Error(`unknown research ID: ${id}`);
  if (visiting.has(id)) throw Error(`dependency cycle: ${id}`);
  if (selected.has(id)) return;
  visiting.add(id);
  for (const dep of contract.dependencies) visit(dep);
  visiting.delete(id); selected.add(id);
 }
 for (const id of consumers) visit(id);
 return [...selected].sort();
}
export function standardPrerequisites(consumers: string[]): string[] {
 const stages = consumers.some(id => id.startsWith('browser.')) ? ['stage.dependencies', 'stage.check', 'stage.build', 'stage.packages', 'stage.browser-install'] : consumers.some(id => id.startsWith('unit.')) ? ['stage.dependencies', 'stage.check'] : [];
 return [...new Set([...consumers, ...stages])].sort();
}
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const git = (root: string, ...args: string[]) => execFileSync('git', args, {cwd: root, maxBuffer: 64 * 1024 * 1024});
const text = (b: Buffer) => b.toString('utf8').trim();
const nul = (b: Buffer) => b.toString('utf8').split('\0').filter(Boolean);
type Change = {status: string; paths: string[]};
function parseDiff(data: Buffer): Change[] {
 const fields = nul(data), changes: Change[] = [];
 for (let i = 0; i < fields.length;) {
  const status = fields[i++];
  if (status === undefined) throw Error('missing git change status');
  const n = /^[RC]/.test(status) ? 2 : 1;
  if (i + n > fields.length) throw Error('malformed git diff');
  changes.push({status, paths: fields.slice(i, i + n)}); i += n;
 }
 return changes;
}
const sourceRoot = fileURLToPath(new URL('../../', import.meta.url));
const policyInputs = ['scripts/ci-catalog.cjs', 'scripts/ci-catalog.cts', 'scripts/ci/research-families.ts', 'scripts/ci/lock.ts', 'scripts/expected.lock.json', 'project-identity.json', 'prototypes/evolution42-ci-c1/candidate.mts', 'prototypes/evolution42-ci-c1/consumer-map.mts'];
function policyHash(): string { return hash(JSON.stringify(policyInputs.map(p => [p, hash(readFileSync(path.join(sourceRoot, p)))]))); }
export function candidate(root: string, baseRef: string) {
 const head = text(git(root, 'rev-parse', '--verify', 'HEAD^{commit}'));
 const base = text(git(root, 'rev-parse', '--verify', `${baseRef}^{commit}`));
 const committed = git(root, 'diff', '--name-status', '-z', '-M', base, head, '--');
 const staged = git(root, 'diff', '--cached', '--name-status', '-z', '-M', '--');
 const worktree = git(root, 'diff', '--name-status', '-z', '-M', '--');
 const untracked = nul(git(root, 'ls-files', '--others', '--exclude-standard', '-z'));
 const changes = [...parseDiff(committed), ...parseDiff(staged), ...parseDiff(worktree), ...untracked.map(p => ({status: '?', paths: [p]}))];
 const untrackedIdentity = untracked.map(p => {
  const absolute = path.join(root, p), stat = lstatSync(absolute);
  return [p, stat.isSymbolicLink() ? `link:${readlinkSync(absolute)}` : `file:${hash(readFileSync(absolute))}`];
 });
 const names = [...new Set(changes.flatMap(c => c.paths))].sort();
 const rawFiles = names.filter(p => Object.hasOwn(mappings, p)).map(p => {
  const absolute = path.join(root, p);
  try {
   const stat = lstatSync(absolute);
   return [p, stat.isSymbolicLink() ? `link:${readlinkSync(absolute)}` : `file:${hash(readFileSync(absolute))}`];
  } catch (error) {
   if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [p, 'missing'];
   throw error;
  }
 });
 const identity = {base, head, policy: policyHash(), committed: hash(committed), staged: hash(git(root, 'diff', '--cached', '--binary', '--full-index', '--')), worktree: hash(git(root, 'diff', '--binary', '--full-index', '--')), untracked: hash(JSON.stringify(untrackedIdentity)), rawFiles: hash(JSON.stringify(rawFiles))};
 const fallback = changes.length === 0 || changes.some(c => c.status !== 'M' || c.paths.some(p => !Object.hasOwn(mappings, p)));
 const entries = names.map(p => mappings[p]).filter((x): x is Mapping => x !== undefined);
 const standardConsumers = entries.flatMap(e => e.standard);
 const selectedStandard = fallback ? [...standard].sort() : standardPrerequisites(standardConsumers);
 if (selectedStandard.some(id => !standard.includes(id))) throw Error('unknown standard ID in mapping');
 const selectedResearch = fallback ? research.map(c => c.id).sort() : prerequisites(entries.flatMap(e => e.research));
 return {scope: 'offline candidate only; consumer completeness and execution not established', identity, changes, mode: fallback ? 'full' : 'review-candidate', standard: selectedStandard, research: selectedResearch, standalone: fallback ? [] : [...new Set(entries.flatMap(e => e.standalone))].sort()};
}
export function verify(root: string, expectedBaseRef: string, plan: ReturnType<typeof candidate>): boolean {
 try { return JSON.stringify(candidate(root, expectedBaseRef)) === JSON.stringify(plan); } catch { return false; }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 if (!process.argv[2]) throw Error('usage: node candidate.mts <base-commit>');
 console.log(JSON.stringify(candidate(process.cwd(), process.argv[2]), null, 2));
}
