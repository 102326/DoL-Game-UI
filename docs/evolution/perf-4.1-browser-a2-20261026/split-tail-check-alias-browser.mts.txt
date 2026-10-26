import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import browserOptions from '../../../tests/browser-options.cjs';
import {browserBundle, digest} from './build-alias-browser.mts';

type Stats = {builds: number; hits: number; evictions: number; bypasses: number; size: number; limit: number; maxAliasLength: number};
type Engine = {inferRequiredDependencies(mod: unknown, catalog?: unknown): unknown; getRequiredDependencies(mod: unknown): unknown; setCatalog(catalog: unknown): void; stats(): Stats | null; clear(): void};
declare const OriginalInference: {createCandidate(): Engine}, CandidateInference: {createCandidate(): Engine};
type Identity = {name: string; bootNames: string[]; aliases: string[]};
type Golden = {name: string; mod: unknown; catalog: unknown; expected: unknown};
type Sequence = {mod: {description: string; bootNames?: string[]}; catalog: Identity[]; steps: {patch: {description: string; bootNames?: string[]; catalogPatch?: {index: number; aliases: string[]}}; expected: unknown}[]};
const frozen = new URL('../perf-4.1-evidence-20261026/', import.meta.url);
const cases = JSON.parse(readFileSync(new URL('inference-cases.json', frozen), 'utf8')) as Golden[];
const sequence = JSON.parse(readFileSync(new URL('inference-sequence.json', frozen), 'utf8')) as Sequence;
assert.equal(cases.length, 26); assert.equal(sequence.steps.length, 6);
const old = browserBundle(false), next = browserBundle(true);
const out = resolve('tests/artifacts/evolution/alias-browser-' + Date.now()); mkdirSync(out, {recursive: true});
writeFileSync(join(out, 'original.js'), old.code); writeFileSync(join(out, 'candidate.js'), next.code);
const sourceNames = ['alias-browser-cache.mts', 'build-alias-browser.mts', 'check-alias-browser.mts'];
const sources = () => Object.fromEntries(sourceNames.map(name => [name, digest(readFileSync(new URL(name, import.meta.url)))]));
const sourceHashes = sources(), browser = await chromium.launch(browserOptions);
let phase = 'setup', status = 'FAIL', error: string | undefined, contracts: unknown, measurements: unknown;
try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}, deviceScaleFactor: 1}), errors: string[] = [];
    page.on('pageerror', value => errors.push(value.message));
    await page.setContent('<!doctype html><html><body>Controlled dependency inference research</body></html>');
    await page.addScriptTag({content: old.code}); await page.addScriptTag({content: next.code});
    phase = 'contracts';
    contracts = await page.evaluate(({cases, sequence}) => {
        const original = OriginalInference.createCandidate(), candidate = CandidateInference.createCandidate();
        const serial = (v: unknown) => JSON.stringify(v), check = (ok: boolean, label: string) => {if (!ok) throw Error(label);};
        let comparisons = 0;
        const compare = (mod: unknown, catalog: unknown, label: string, expected?: unknown) => {
            const before = serial([mod, catalog]), wanted = serial(original.inferRequiredDependencies(mod, catalog));
            if (expected !== undefined) check(wanted === serial(expected), label + ': original golden');
            const result = candidate.inferRequiredDependencies(mod, catalog);
            check(serial(result) === wanted, label + ': candidate'); check(serial([mod, catalog]) === before, label + ': input mutation');
            if (Array.isArray(result) && result[0] && typeof result[0] === 'object') {Object.assign(result[0], {version: 'consumer-edit'}); result.push({modName: 'injected'});}
            check(serial(candidate.inferRequiredDependencies(mod, catalog)) === wanted, label + ': output isolation'); comparisons++;
        };
        for (const c of cases) compare(c.mod, c.catalog, c.name, c.expected);
        for (const [i, step] of sequence.steps.entries()) {
            sequence.mod.description = step.patch.description;
            if (step.patch.bootNames) sequence.mod.bootNames = step.patch.bootNames;
            if (step.patch.catalogPatch) sequence.catalog[step.patch.catalogPatch.index]!.aliases = step.patch.catalogPatch.aliases;
            compare(sequence.mod, sequence.catalog, 'sequence ' + i, step.expected);
        }
        for (let i = 0; i < 1100; i++) compare({description: '驱逐名' + i + '是前置'}, [{name: '驱逐名' + i, bootNames: ['EvictionBoot'], aliases: []}], 'eviction ' + i);
        compare({description: '驱逐名0是前置'}, [{name: '驱逐名0', bootNames: ['EvictionBoot'], aliases: []}], 'evicted rule rebuilt');
        const longAlias = '超长' + '别'.repeat(256);
        compare({description: longAlias + '是前置'}, [{name: longAlias, bootNames: ['LongBoot'], aliases: []}], 'long alias');
        const wide = [{name: '工具甲', bootNames: ['AlphaTools'], aliases: Array.from({length: 1100}, (_, i) => '宽目录' + i)}];
        const before = candidate.stats()!.builds;
        compare({description: '工具甲是前置'}, wide, 'wide identity'); check(candidate.stats()!.builds === before, 'large input bypass');
        wide[0]!.aliases.splice(1); compare({description: '工具甲是前置'}, wide, 'shrink');
        wide[0]!.bootNames[0] = 'ChangedBoot'; compare({description: '工具甲是前置'}, wide, 'mutation after shrink');

        // Controlled external provider only. This does not certify the actual variants/install business.
        Object.assign(window, {modHubMarketVariants: {normalizeRequiredDependencies: (value: unknown) => Array.isArray(value) ? value : []}});
        const catalog = [{name: '工具甲', bootNames: ['AlphaTools'], aliases: []}], mod = {description: '工具甲是前置', requiredDependencies: [{modName: 'AlphaTools', version: '*', source: 'declared'}]};
        original.setCatalog(catalog); candidate.setCatalog(catalog);
        const expected = serial(original.getRequiredDependencies(mod));
        check(serial(candidate.getRequiredDependencies(mod)) === expected, 'actual lexical getRequiredDependencies');
        const saved = candidate.inferRequiredDependencies; candidate.inferRequiredDependencies = () => [{modName: 'wrong-export'}];
        check(serial(candidate.getRequiredDependencies(mod)) === expected, 'export replacement must not impersonate internal interception'); candidate.inferRequiredDependencies = saved;
        const nativeRegExp = window.RegExp; let constructions = 0, coldConstructors = 0, warmConstructors = 0;
        try {
            window.RegExp = new Proxy(nativeRegExp, {construct(target, args) {constructions++; return Reflect.construct(target, args);}});
            const probe = CandidateInference.createCandidate(); probe.setCatalog(catalog);
            check(serial(probe.getRequiredDependencies(mod)) === expected, 'cold lexical path'); coldConstructors = constructions; constructions = 0;
            check(serial(probe.getRequiredDependencies(mod)) === expected, 'warm lexical path'); warmConstructors = constructions;
            check(coldConstructors > 0 && warmConstructors === 0, 'lexical consumer actually uses cached rules'); probe.clear(); check(probe.stats()!.size === 0, 'probe clear');
        } finally {window.RegExp = nativeRegExp;}
        const stats = candidate.stats()!; check(stats.size <= 1024 && stats.evictions > 0 && stats.bypasses > 0, 'bounded cache');
        candidate.clear(); check(candidate.stats()!.size === 0, 'cache clear');
        return {comparisons, goldenCases: cases.length, mutationSteps: sequence.steps.length, coldConstructors, warmConstructors, lexicalRequiredPath: true, exportReplacementControl: true, stats, cleared: candidate.stats()!.size === 0};
    }, {cases, sequence});
    phase = 'native-browser-timing';
    measurements = await page.evaluate(() => {
        const records: {size: number; phase: string; pair: number; first: string; originalMs: number; candidateMs: number}[] = [];
        const factories = {original: OriginalInference, candidate: CandidateInference};
        for (const size of [25, 100, 250, 400]) {
            const catalog = Array.from({length: size}, (_, i) => ({name: '合成工具' + i, bootNames: ['SyntheticTool' + i], aliases: ['Synthetic Tool ' + i, '测试别名' + i]}));
            catalog[0] = {name: '工具甲', bootNames: ['AlphaTools'], aliases: ['Alpha Tools']}; catalog[1] = {name: '工具乙', bootNames: ['BetaTools'], aliases: ['Beta Tools']};
            const mod = {description: '工具甲是前置。工具乙是前置'}, expected = JSON.stringify(OriginalInference.createCandidate().inferRequiredDependencies(mod, catalog));
            const steady = {original: OriginalInference.createCandidate(), candidate: CandidateInference.createCandidate()};
            for (const phase of ['cold', 'warm']) {
            if (phase === 'warm') for (let i = 0; i < 20; i++) for (const key of ['original', 'candidate'] as const) steady[key].inferRequiredDependencies(mod, catalog);
            for (let pair = -2; pair < 12; pair++) {
                const instances = phase === 'warm' ? steady : {original: factories.original.createCandidate(), candidate: factories.candidate.createCandidate()};
                const order = pair % 2 === 0 ? ['original', 'candidate'] as const : ['candidate', 'original'] as const;
                const elapsed = {original: 0, candidate: 0};
                for (const key of order) {
                    let result: unknown; const began = performance.now();
                    for (let i = 0; i < (phase === 'warm' ? 10 : 1); i++) result = instances[key].inferRequiredDependencies(mod, catalog);
                    elapsed[key] = performance.now() - began;
                    if (JSON.stringify(result) !== expected) throw Error('Timing output mismatch ' + size + '/' + phase);
                }
                if (pair >= 0) records.push({size, phase, pair, first: order[0], originalMs: elapsed.original, candidateMs: elapsed.candidate});
            }
            }
            steady.candidate.clear();
        }
        const median = (values: number[]) => {const v = [...values].sort((a, b) => a - b), i = v.length / 2; return (v[i - 1]! + v[i]!) / 2;};
        return {records, summary: [25, 100, 250, 400].flatMap(size => ['cold', 'warm'].map(phase => {
            const rows = records.filter(r => r.size === size && r.phase === phase);
            return {size, phase, pairs: rows.length, originalMedianMs: median(rows.map(r => r.originalMs)), candidateMedianMs: median(rows.map(r => r.candidateMs)), pairedDeltaMedianMs: median(rows.map(r => r.candidateMs - r.originalMs)), slowerCount: rows.filter(r => r.candidateMs > r.originalMs).length};
        }))};
    });
    assert.deepEqual(errors, []); assert.deepEqual(sources(), sourceHashes); status = 'PASS';
} catch (value) {error = String(value); throw value;} finally {
    writeFileSync(join(out, 'result.json'), JSON.stringify({status, phase, error, environment: {platform: process.platform, node: process.version, chromium: browser.version(), viewport: {width: 1280, height: 900, dpr: 1}}, sourceSha256: sourceHashes, bundles: {original: old.sha256, candidate: next.sha256, requiredFunction: next.requiredSha256}, contracts, measurements, limits: 'Controlled browser-native generated source from frozen ModHub 1.8.3, no Node VM/eval in browser and no actual ModHub/game installation. External dependency normalization is a controlled stub. PASS is functional/resource/collection, not device or end-to-end performance acceptance. Timing no proxy/trace; 2 discarded then 12 alternating pairs per size/phase, cold=first call/new factory; warm=10 calls/stable factory, 20 primes immediately before warm phase after cold observations. Browser engine caches not reset.'}, null, 2));
    await browser.close(); console.log(out);
}
