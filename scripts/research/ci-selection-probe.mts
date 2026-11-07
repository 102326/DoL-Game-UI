// Run npm run tooling:build first to refresh the generated catalog consumed below.
// Offline hypothetical samples plus one controlled existing full-profile verifier check.
// Does not prove source identity, execution order or PASS evidence for a selected run.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import catalog from '../ci-catalog.cjs';

const contracts = catalog.catalogFor('research').contracts.map(c => {
 assert('dependencies' in c, `missing research dependencies: ${c.id}`);
 return {id: c.id, dependencies: c.dependencies};
});
const normalize = (id: string) => id.startsWith('research.') ? id : `research.${id}`;
const byId = new Map(contracts.map(c => [c.id, c] as const));
assert.equal(byId.size, contracts.length, 'duplicate catalog IDs');
const hash = (path: string) => createHash('sha256').update(readFileSync(new URL(path, import.meta.url))).digest('hex');

// Human review candidates, not an impact graph or an executable selection policy.
// Incomplete consumer discovery requires full-profile fallback for every example.
const standardIds = new Set(catalog.catalogFor('standard').contracts.map(c => c.id));
const scenarios = [
 {name: 'official-motion', files: ['framework/official-ui/motion.ts'],
  standard: ['browser.official-game-motion.cjs', 'browser.source-motion-lifecycle.cjs', 'browser.settings-ci.cjs', 'browser.evolution-navigation.cjs', 'browser.evolution-panels.cjs', 'browser.kraft-work-adapters.cjs'],
  research: ['official-game-motion', 'source-motion-lifecycle', 'settings-ci', 'evolution-navigation', 'evolution-panels', 'framework-build', 'source-check'], standalone: []},
 {name: 'shared-weather', files: ['framework/official-ui/weather.ts', 'src/ui/weather/surface.ts'],
  standard: ['browser.header-weather.cjs', 'browser.weather-dom-writes.cjs', 'browser.weather-special.cjs', 'browser.kraft-work-adapters.cjs', 'browser.evolution-owner-resources.cjs'],
  research: ['settings-ci', 'evolution-owner-resources', 'framework-build', 'source-check'], standalone: ['tests/evolution-weather-integration.cjs']},
 {name: 'ci-probe', files: ['scripts/research/ci-selection-probe.mts'], standard: [], research: [], standalone: ['scripts/research/ci-selection-probe.mts']}
];
function validateScenario(s: typeof scenarios[number]): string[] {
 const errors: string[] = [];
 for (const [label, ids, known] of [['standard', s.standard, standardIds], ['research', s.research.map(normalize), new Set(byId.keys())]] as const) {
  const seen = new Set<string>();
  for (const id of ids) {
   if (!known.has(id)) errors.push(`${label}: unknown ${id}`);
   if (seen.has(id)) errors.push(`${label}: duplicate ${id}`);
   seen.add(id);
  }
 }
 const selected = new Set(s.research.map(normalize));
 const visit = (id: string, path: string[]) => {
  for (const dep of byId.get(id)?.dependencies ?? []) {
   const next = normalize(dep), nextPath = [...path, next];
   if (!byId.has(next)) errors.push(`unknown dependency: ${nextPath.join(' -> ')}`);
   if (!selected.has(next)) errors.push(`missing dependency: ${nextPath.join(' -> ')}`);
   if (path.includes(next)) errors.push(`dependency cycle: ${nextPath.join(' -> ')}`);
   else visit(next, nextPath);
  }
 };
 for (const id of selected) visit(id, [id]);
 return errors;
}
for (const scenario of scenarios) assert.deepEqual(validateScenario(scenario), []);
assert(validateScenario({...scenarios[0], research: scenarios[0].research.filter(id => id !== 'source-check')}).some(e => e.includes('missing dependency:')));
assert(validateScenario({...scenarios[0], standard: [...scenarios[0].standard, 'browser.unknown.cjs']}).some(e => e.includes('standard: unknown')));
assert(validateScenario({...scenarios[1], standard: [...scenarios[1].standard, scenarios[1].standard[0]]}).some(e => e.includes('standard: duplicate')));

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
// Exercise the existing full-profile verifier, not a future selection verifier.
// Both producer lists omit the same entry; even family evidence is regenerated.
const require = createRequire(import.meta.url);
const {researchSummary, plan} = require('../ci-research.cjs');
const {familyReports} = require('../ci/research-families.ts');
const {writeJson} = require('../ci-evidence.cjs');
const dir = mkdtempSync(path.join(os.tmpdir(), 'moody-offline-selection-'));
let fullProfileRejection: {omitted: string; status: string; reason: string};
try {
 const identity = {profile: 'research', source: {head: 'controlled'}, run: {id: 'controlled', attempt: '1'}, catalog: catalog.catalogIdentity('research')};
 const ctx = {root: dir, dir, identity};
 const expected: string[] = plan.map((c: {id: string}) => c.id);
 const omitted = expected.at(-1)!;
 const reduced = expected.slice(0, -1);
 const results = reduced.map(name => ({name, status: 'PASS', rawStatus: 'passed', caseIds: []}));
 writeJson(path.join(dir, 'research.json'), {schema: 1, identity, suite: 'research', sourceAfter: identity.source, expected: reduced, status: 'PASS', results});
 // Recreate the verifier's family input so this reaches the independent plan check.
 for (const family of familyReports(identity, expected, results, identity.source)) writeJson(path.join(dir, 'families', `${family.family}.json`), family);
 const outcome = researchSummary(ctx);
 const check = outcome.results.find((r: {name: string}) => r.name === 'research');
 assert.equal(check?.status, 'UNVERIFIED');
 assert.equal(check?.reason, 'Missing/incomplete research plan');
 fullProfileRejection = {omitted, status: check.status, reason: check.reason};
} finally { rmSync(dir, {recursive: true, force: true}); }
console.log(JSON.stringify({scope: 'offline hypothetical and controlled existing full-profile verifier; no CI execution; no selected-run source authenticity, execution order or PASS evidence verification',
 fullProfileRejection,
 manualScenarios: scenarios.map(s => ({...s, research: s.research.map(normalize), fallback: 'full standard and research profiles; consumer completeness unproven', omittedFromFull: {standard: standardIds.size - s.standard.length, research: byId.size - s.research.length}})),
 fallbackCases: ['unknown impact', 'rename or delete', 'CI rules change'].map(reason => ({reason, fallback: 'full standard and research profiles; review separately'})),
 fullCatalogCounts: {standard: standardIds.size, research: byId.size},
 sample: {manualConsumers: consumers, counts: valid.counts}, negativeCases: ['indirect-baselines', 'manual-consumer', 'unknown-id', 'duplicate-id', 'missing-terminal', 'duplicate-terminal', 'count-mismatch', 'scenario-missing-prerequisite', 'standard-unknown-and-duplicate'], missingBaselinePaths: missingBaseline.filter(e => e.startsWith('missing dependency: research.settings-study')), sourceSha256: {'scripts/ci-catalog.cjs': hash('../ci-catalog.cjs'), 'scripts/ci-catalog.cts': hash('../ci-catalog.cts'), 'scripts/ci/research-families.ts': hash('../ci/research-families.ts'), 'scripts/ci/lock.ts': hash('../ci/lock.ts'), 'scripts/expected.lock.json': hash('../expected.lock.json'), 'project-identity.json': hash('../../project-identity.json')}}, null, 2));
