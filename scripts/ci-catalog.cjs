"use strict";
// Edit CTS; generated CJS is retained for CI startup before npm installation.
const crypto = require("node:crypto");
const path = require("node:path");
const project = require('../project-identity.json');
if (!project || typeof project !== 'object' || !('schema' in project) || project.schema !== 1 || !('projectId' in project) || typeof project.projectId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(project.projectId))
    throw Error('Invalid permanent Project ID');
const projectId = project.projectId;
// Expected contracts are versioned source, never inferred from a run's result files.
const { expectedLock, expectedLockSha256, entryDeclaration } = require('./ci/lock.ts');
const { familyFor, maturityFor, dependenciesFor } = require('./ci/research-families.ts');
const suites = {
    unit: ['ci-v12.test.cjs', 'metrics-boundary.test.mts', 'record-boundary.test.mts', 'source-identity-boundary.test.mts', 'context-boundary.test.mts', 'device-probe-source.test.mts', 'isolation-inputs.test.mts', 'node-baseline.test.mts', 'receipt-boundary.test.mts', 'source-policy-boundary.test.mts', 'checkpoint-boundary.test.mts', 'expected-lock-boundary.test.mts', 'device-plan-boundary.test.mts', 'native-tooling.test.mts', 'source-link.test.mts', 'save-metadata-boundary.test.mts', 'ci-gate.test.cjs', 'shop-early-api.test.cjs', 'research-evidence.test.cjs', 'adapter-build-boundary.test.cjs', 'ci-evidence.test.cjs', 'visual-scope.test.cjs', 'evolution-resource-contract.test.cjs', 'device-profiles.test.cjs', 'floating-preferences.test.cjs', 'test-workflow.test.cjs', 'status.test.cjs', 'target-version.test.cjs', 'wardrobe-data.test.cjs', 'wardrobe-preview-boundary.test.cjs', 'wardrobe-source-m2.test.cjs', 'wardrobe-slot-mappings.test.cjs', 'wardrobe-performance.test.cjs', 'wardrobe-operations.test.cjs', 'render-state.test.cjs', 'startup-cache.test.cjs', 'mouth-compat-adapter.cjs'],
    browser: ['ui-runtime-identity.cjs', 'ui-runtime-inspector.cjs', 'ui-runtime-surfaces.cjs', 'ui-runtime-compat.cjs', 'ui-runtime-regressions.cjs', 'evolution-owner-resources.cjs', 'source-motion-lifecycle.cjs', 'game-first-motion.cjs', 'evolution-navigation.cjs', 'evolution-panels.cjs', 'evolution-orbit.cjs', 'panels-framework.cjs', 'framework.cjs', 'framework-connect.cjs', 'framework-startup.cjs', 'framework-commands.cjs', 'settings-ci.cjs', 'moody-historical-regressions.cjs', 'moody-oracles.test.cjs', 'wardrobe-details-drawer.cjs', 'shop-source.test.cjs', 'save-transfer-lifecycle.cjs', 'save-revision-source.cjs', 'weather-dom-writes.cjs', 'header-weather.cjs', 'weather-special.cjs', 'official-game-motion.cjs', 'kraft-work-adapters.cjs', 'optimization-wardrobe.cjs', 'optimization-date.cjs', 'smartphone-adapter.cjs', 'wardrobe-wear-motion.cjs', 'selection-motion.cjs', 'shop-ripple-motion.cjs', 'official-defaults.cjs', 'combat-focused.cjs', 'combat-select.cjs', 'saves-viewport.cjs', 'adapter-materials.cjs', 'kraft-work-baseline.cjs', 'device-layouts.cjs', 'device-probe.cjs']
};
const stages = [
    { id: 'dependencies', scope: 'Locked npm dependencies and install scripts', args: ['ci'] },
    { id: 'check', scope: 'Render-state generation, TypeScript and Framework contracts', args: ['run', 'ci:check'] },
    { id: 'unit', scope: 'Required unit and source suite', args: ['run', 'ci:unit'] },
    { id: 'build', scope: 'Framework build and two player plus seven current optional packages', args: ['run', 'ci:build'] },
    { id: 'packages', scope: 'Nine ZIP/version contracts, exact negative checks and two fresh builds', args: ['run', 'ci:packages'] },
    { id: 'browser-install', scope: 'Lockfile-pinned Playwright Chromium installation', command: 'npx', args: ['playwright', 'install', '--with-deps', 'chromium'] },
    { id: 'browser', scope: 'Required controlled browser suite, including historical negatives', args: ['run', 'ci:browser'] }
];
const cases = expectedLock.researchCases;
const node = (id, args, report, execution = args[0]?.startsWith('node_modules/') ? 'tool' : 'contract') => ({ id, command: process.execPath, args, report, execution });
const npm = (id, name) => ({ id, command: 'npm', args: ['run', name] });
const test = (name, report, flags = []) => node(name + flags.join(''), ['tests/' + name + '.cjs', ...flags], report);
const checks = (name, pattern, field = 'checks', key) => ({ pattern, field, key, expected: cases[name] });
const list = (pattern, field, key, expected) => ({ pattern, field, key, expected });
const researchPlan = [
    npm('prototype-check', 'prototype:golden-spin:check'), npm('source-check', 'ci:check'), npm('prototype-build', 'prototype:golden-spin:build'),
    test('golden-spin-b', checks('golden-spin-b', 'golden-spin-b/sphere-validation-[0-9]+/result.json')),
    test('golden-spin-hub', checks('golden-spin-hub', 'golden-spin-b/hub-validation-[0-9]+/result.json')),
    test('motion-workspace', checks('motion-workspace', 'golden-spin-b/windows-validation-[0-9]+/result.json')),
    test('golden-spin-hub-input', checks('golden-spin-hub-input', 'golden-spin-b/hub-validation-input-[0-9]+/result.json')),
    test('golden-spin-hub-lifecycle', checks('golden-spin-hub-lifecycle', 'golden-spin-b/hub-validation-lifecycle-[0-9]+/result.json', 'results', 'name')),
    { id: 'settings-baselines', command: 'git', args: ['fetch', '--no-tags', '--depth=1', 'origin', '915dcb9e85f3266a73a3e7ce38d769edd0c29ff4', 'b507f1a7d18d4d77067fa0c793aea44d7de96b57'] },
    node('settings-prepare', ['scripts/prepare-settings-refraction.mjs'], undefined, 'tool'),
    node('settings-types', ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit', '-p', 'tsconfig.settings-refraction.json']),
    node('settings-build', ['node_modules/vite/bin/vite.js', 'build', '--config', 'vite.settings-refraction.config.ts']),
    node('settings-study', ['scripts/check-settings-refraction.cjs'], checks('check-settings-refraction', 'settings-refraction-v1/review-[0-9]+/result.json')),
    node('framework-build', ['scripts/build-framework.mjs'], undefined, 'tool'),
    test('integration-preview-pages'),
    test('settings-ci', { pattern: 'evolution/settings-resources.json', shape: 'settings' }),
    test('moody-oracles.test'),
    test('moody-historical-regressions', { fixture: true }),
    test('official-game-motion'),
    test('source-motion-lifecycle', list('evolution/source-motion.json', 'result.arrivals', null, ['latest', 'peer', 'peer-again', 'other-node'])),
    test('game-first-motion'),
    node('evolution-unit', ['scripts/ci-research-unit.cjs'], undefined, 'tool'),
    test('evolution-owner-resources', list('evolution/owners.json', 'results', 'kind', ['settings', 'layout', 'attributes', 'social', 'panels', 'shop', 'wardrobe', 'saves', 'combat', 'floating', 'official-motion', 'weather', 'hub'])),
    node('inventory', ['scripts/evolution-inventory.cjs'], { pattern: 'evolution/inventory.json', shape: 'inventory' }, 'tool'),
    test('evolution-navigation', list('evolution/navigation.json', 'results', 'kind', ['characteristics', 'social'])),
    test('evolution-panels', list('evolution/panels.json', '', 'kind', ['journal', 'traits', 'statistics', 'feats', 'cheats', 'options'])),
    test('evolution-orbit', list('evolution/orbit.json', 'results', 'zoom', [1, 1.25, .85])), test('panels-framework'),
    node('weather-types', ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit', '-p', 'tsconfig.evolution.json']),
    node('weather-build', ['node_modules/vite/bin/vite.js', 'build', '--config', 'vite.evolution-weather.config.ts']),
    test('weather-review-pages'),
    test('evolution-weather', checks('evolution-weather', 'evolution/weather-review-[0-9]+/result.json')),
    test('evolution-weather-candidates', list('evolution/weather-r2-[0-9]+/result.json', 'results', 'candidate', ['v1', 'beads', 'film'])),
    node('weather-unit', ['--test', 'tests/evolution-rain-model.test.cjs', 'tests/evolution-scattered-shower.test.cjs']),
    ...[['', 'r3'], ['--natural-trails', 'r4'], ['--runoff', 'r5']].map(([flag, rev]) => test('evolution-rain-glass', { pattern: `evolution/weather-${rev}-[0-9]+/result.json`, shape: 'glass' }, flag ? [flag] : [])),
    test('evolution-weather-levels', list('evolution/weather-r6-[0-9]+/result.json', 'results', 'level', ['light', 'normal', 'heavy', 'severe', 'snow'])),
    ...[['', 'r7'], ['--force', 'r8'], ['--scatter', 'r9']].map(([flag, rev]) => test('evolution-weather-shower', { pattern: `evolution/weather-${rev}-[0-9]+/result.json`, shape: 'shower', count: flag ? 5 : 3, scatter: flag === '--scatter' }, flag ? [flag] : []))
];
const nodeTestCases = expectedLock.nativeCases;
const researchUnitEntries = ['adapter-build-boundary.test.cjs', 'visual-scope.test.cjs', 'evolution-resource-contract.test.cjs'];
const testArgs = (name) => [...(nodeTestCases[name] ? ['--test'] : []), 'tests/' + name];
const nodeCaseIds = (args) => args.filter(a => nodeTestCases[path.basename(a)]).flatMap(file => { const ids = nodeTestCases[path.basename(file)]; if (!ids)
    throw Error('Missing native case declaration'); return ids.map(name => path.basename(file) + '::' + name); });
const commandCaseIds = (check) => check.id === 'evolution-unit' ? researchUnitEntries.map(n => 'unit:' + n) : nodeCaseIds(check.args).length ? nodeCaseIds(check.args) : ['command:' + check.id];
const version = '1.3.0';
// Same-run review frames are necessary where the research contract promises pixels.
// Historical original-speed comparison builds remain T1, explicitly historical.
const visualEvidence = {
    'golden-spin-b': ['charge.png', 'release.png', 'narrow.png'],
    'golden-spin-hub': ['desktop-open.png', 'left-open.png', 'narrow-open.png'],
    'motion-workspace': ['settings-desktop.png', 'settings-narrow.png'],
    'golden-spin-hub-input': ['pointer-tool-open.png', 'narrow.png'],
    'settings-study': ['candidate-1280.png', 'candidate-390.png'],
    'evolution-weather': ['W1-clear.png', 'W2-rain.png', 'W3-snow-interrupt.png'],
    'evolution-weather-candidates': ['v1-rain.png', 'beads-rain.png', 'film-rain.png'],
    'evolution-rain-glass': ['displacement-on.png', 'displacement-off.png', 'material-day.png'],
    'evolution-rain-glass--natural-trails': ['wet-path-on.png', 'wet-path-off.png', 'material-day.png'],
    'evolution-rain-glass--runoff': ['runoff-bottom-visible.png', 'runoff-bottom-hidden.png', 'material-day.png'],
    'evolution-weather-levels': ['climate-light.png', 'climate-normal.png', 'climate-heavy.png', 'climate-severe.png', 'climate-snow.png'],
    'evolution-weather-shower': ['shower-after-light.png', 'shower-after-severe.png', 'shower-after-snow.png'],
    'evolution-weather-shower--force': ['shower-after-light.png', 'shower-after-normal.png', 'shower-after-heavy.png', 'shower-after-severe.png', 'shower-after-snow.png'],
    'evolution-weather-shower--scatter': ['shower-after-light.png', 'shower-after-normal.png', 'shower-after-heavy.png', 'shower-after-severe.png', 'shower-after-snow.png']
};
const checkpoints = Object.fromEntries(expectedLock.entries.filter(e => e.evidence === 'checkpoints').map(e => [path.basename(e.entry), e.cases.map(c => c.id)]));
function deepFreeze(value) { if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const item of Object.values(value))
        deepFreeze(item);
} return value; }
function deviceCaseIds(depth) {
    const api = require('../tests/device-case-plan.cjs');
    return api.expectedCaseIds(depth);
}
[suites, stages, researchPlan, checkpoints, visualEvidence, nodeTestCases, researchUnitEntries].forEach(deepFreeze);
function catalogFor(profile = 'standard', depth = 'standard') {
    if ((profile !== 'standard' && profile !== 'research' && profile !== 'release') || (depth !== 'standard' && depth !== 'deep'))
        throw Error('Unknown catalog profile/depth');
    const contracts = profile === 'research' ? researchPlan.map(c => ({ id: 'research.' + c.id, group: 'research', family: familyFor(c.id), maturity: maturityFor(c.id), dependencies: dependenciesFor(c.id), profiles: ['research'], necessity: 'required', execution: c.execution || 'tool', entry: [c.command === process.execPath ? 'node' : c.command, ...c.args], result: 'research.json#' + c.id, evidence: c.report ? [c.report.fixture ? 'fixtures/moody-historical-regressions.cjs/snapshot.json' : 'research/' + c.id + '/result.json'] : [], subEntries: c.id === 'evolution-unit' ? researchUnitEntries.map(name => ({ id: 'unit:' + name, entry: ['node', ...testArgs(name)], checkpoints: nodeTestCases[name] || [] })) : [], checkpoints: c.report?.expected || (c.report?.fixture ? ['MOODY_ORBIT_NONFINITE'] : c.report?.shape === 'glass' ? ['material', 'glass'] : c.report?.shape === 'settings' ? ['settings-resources'] : c.report?.shape === 'inventory' ? ['inventory'] : c.report?.shape === 'shower' ? (c.report.count === 3 ? ['0:rain:light', '1:rain:severe', '2:snow:'] : ['0:rain:light', '1:rain:normal', '2:rain:heavy', '3:rain:severe', '4:snow:']) : commandCaseIds(c)), visualEvidence: (visualEvidence[c.id] || []).map(f => 'review/' + c.id + '/' + f), negative: c.report?.fixture ? 'ERR_ASSERTION:MOODY_ORBIT_NONFINITE:' : null })) : [
        ...stages.map(s => ({ id: 'stage.' + s.id, group: 'stage', profiles: ['standard', 'release'], necessity: 'required', entry: [s.command || 'npm', ...s.args], result: 'stage-' + s.id + '.json', evidence: [], checkpoints: [] })),
        ...Object.entries(suites).flatMap(([group, names]) => names.map(name => ({ id: group + '.' + name, group, cases: entryDeclaration(name)?.cases, granularity: entryDeclaration(name)?.granularity, rendererContexts: entryDeclaration(name)?.rendererContexts, profiles: ['standard', 'release'], necessity: 'required', entry: ['node', ...testArgs(name)], result: group + '.json#' + name, evidence: checkpoints[name]?.length ? ['fixtures/' + name + '/checkpoints.json'] : [], checkpoints: name === 'device-layouts.cjs' ? deviceCaseIds(depth) : checkpoints[name] || nodeTestCases[name] || [] })))
    ];
    const selectedProfile = profile, selectedDepth = depth;
    return { schema: 1, projectId, expectedLockSha256, version, profile: selectedProfile, depth: selectedDepth, automaticRelease: false, releaseAuthorization: profile === 'release' ? 'owner approval required; design only' : null, contracts };
}
function catalogIdentity(profile = 'standard', depth = 'standard') { const c = catalogFor(profile, depth); return { version, profile: c.profile, depth: c.depth, expectedLockSha256, sha256: crypto.createHash('sha256').update(JSON.stringify(c)).digest('hex') }; }
module.exports = { expectedLock, expectedLockSha256, entryDeclaration, projectId, suites, stages, researchPlan, checkpoints, visualEvidence, nodeTestCases, researchUnitEntries, testArgs, nodeCaseIds, commandCaseIds, catalogFor, catalogIdentity };
