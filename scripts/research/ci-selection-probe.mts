// Run npm run tooling:build first to refresh the generated catalog consumed below.
// Offline hypothetical only: validates sample structure, closure and counts, not
// source identity authenticity, execution order or evidence for PASS results.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import catalog from '../ci-catalog.cjs';

const contracts = catalog.catalogFor('research').contracts.map(c => {
 assert('dependencies' in c, `missing research dependencies: ${c.id}`);
 return {id: c.id, dependencies: c.dependencies};
});
const normalize = (id: string) => id.startsWith('research.') ? id : `research.${id}`;
const byId = new Map(contracts.map(c => [c.id, c] as const));
assert.equal(byId.size, contracts.length, 'duplicate catalog IDs');
const hash = (path: string) => createHash('sha256').update(readFileSync(new URL(path, import.meta.url))).digest('hex');

// These are illustrative, manually declared consumers, not a discovered impact graph.
const consumers = ['research.settings-study', 'research.settings-ci'];
const selected = ['settings-study', 'settings-build', 'settings-types', 'settings-prepare', 'settings-baselines', 'settings-ci', 'framework-build', 'source-check'];
type Terminal = {id: string; status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_RUN'; executed: boolean};
const terminals: Terminal[] = selected.map(id => ({id, status: id === 'source-check' ? 'FAIL' : id === 'framework-build' || id === 'settings-ci' ? 'BLOCKED' : 'PASS', executed: id !== 'framework-build' && id !== 'settings-ci'}));
type Sample = {selected: string[]; consumers: string[]; terminals: Terminal[]; counts: {selected: number; terminal: number; executed: number}};
const valid: Sample = {selected, consumers, terminals, counts: {selected: 8, terminal: 8, executed: 6}};

function validate(sample: Sample): string[] {
 const errors: string[] = [];
 const uniqueIds = (ids: string[], label: string) => {
  const seen = new Set<string>();
  for (const raw of ids) {
   const id = normalize(raw);
   if (!byId.has(id)) errors.push(`${label}: unknown ${id}`);
   if (seen.has(id)) errors.push(`${label}: duplicate ${id}`);
   seen.add(id);
  }
  return seen;
 };
 const chosen = uniqueIds(sample.selected, 'selected');
 const declared = uniqueIds(sample.consumers, 'consumers');
 const finished = uniqueIds(sample.terminals.map(t => t.id), 'terminal');
 for (const id of declared) if (!chosen.has(id)) errors.push(`missing consumer: ${id}`);
 for (const id of chosen) if (!finished.has(id)) errors.push(`missing terminal: ${id}`);
 for (const id of finished) if (!chosen.has(id)) errors.push(`terminal not selected: ${id}`);
 for (const t of sample.terminals) if ((t.status === 'BLOCKED' || t.status === 'NOT_RUN') === t.executed) errors.push(`inconsistent execution: ${normalize(t.id)}`);
 // Traverse every path, including through missing nodes, to expose indirect omissions.
 const visit = (id: string, path: string[]) => {
  const entry = byId.get(id);
  if (!entry) return;
  for (const dependency of entry.dependencies) {
   const next = normalize(dependency);
   const nextPath = [...path, next];
   if (!byId.has(next)) errors.push(`unknown dependency: ${nextPath.join(' -> ')}`);
   if (!chosen.has(next)) errors.push(`missing dependency: ${nextPath.join(' -> ')}`);
   if (path.includes(next)) errors.push(`dependency cycle: ${nextPath.join(' -> ')}`);
   else visit(next, nextPath);
  }
 };
 for (const id of chosen) visit(id, [id]);
 if (sample.counts.selected !== sample.selected.length || sample.counts.terminal !== sample.terminals.length || sample.counts.executed !== sample.terminals.filter(t => t.executed).length || sample.counts.selected !== sample.counts.terminal) errors.push('count mismatch');
 return errors;
}
assert.deepEqual(validate(valid), []);
const without = (id: string): Sample => {
 const remaining = terminals.filter(x => x.id !== id);
 return {...valid, selected: selected.filter(x => x !== id), terminals: remaining, counts: {selected: selected.length - 1, terminal: remaining.length, executed: remaining.filter(t => t.executed).length}};
};
const missingBaseline = validate(without('settings-baselines'));
assert(missingBaseline.some(e => e.includes('research.settings-study -> research.settings-build -> research.settings-prepare -> research.settings-baselines')));
assert(missingBaseline.some(e => e.includes('research.settings-study -> research.settings-build -> research.settings-types -> research.settings-prepare -> research.settings-baselines')));
assert(validate(without('settings-ci')).some(e => e.includes('missing consumer: research.settings-ci')));
assert(validate({...valid, selected: [...selected, 'unknown']}).some(e => e.includes('selected: unknown research.unknown')));
assert(validate({...valid, selected: [...selected, 'research.settings-study']}).some(e => e.includes('selected: duplicate research.settings-study')));
assert(validate({...valid, terminals: terminals.slice(1)}).some(e => e.includes('missing terminal: research.settings-study')));
assert(validate({...valid, terminals: [...terminals, terminals[0]]}).some(e => e.includes('terminal: duplicate research.settings-study')));
assert(validate({...valid, counts: {...valid.counts, executed: 5}}).includes('count mismatch'));
console.log(JSON.stringify({scope: 'offline hypothetical; no CI execution; sample structure, closure and counts only; no source authenticity, execution order or PASS evidence verification', sample: {manualConsumers: consumers, counts: valid.counts}, negativeCases: ['indirect-baselines', 'manual-consumer', 'unknown-id', 'duplicate-id', 'missing-terminal', 'duplicate-terminal', 'count-mismatch'], missingBaselinePaths: missingBaseline.filter(e => e.startsWith('missing dependency: research.settings-study')), sourceSha256: {'scripts/ci-catalog.cjs': hash('../ci-catalog.cjs'), 'scripts/ci-catalog.cts': hash('../ci-catalog.cts'), 'scripts/ci/research-families.ts': hash('../ci/research-families.ts'), 'scripts/ci/lock.ts': hash('../ci/lock.ts'), 'scripts/expected.lock.json': hash('../expected.lock.json'), 'project-identity.json': hash('../../project-identity.json')}}, null, 2));
