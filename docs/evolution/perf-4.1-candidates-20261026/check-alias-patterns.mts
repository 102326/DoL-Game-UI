import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createCandidate} from './alias-patterns.mts';

type Infer = (mod: unknown, catalog: unknown) => unknown;
type Mod = {description?: string; desc?: string; bootNames?: string[]};
type Identity = {name: string; wikiName?: string; bootNames: string[]; aliases: string[]; identityId?: string | null};
const frozen = new URL('../perf-4.1-evidence-20261026/', import.meta.url);
const source = JSON.parse(readFileSync(new URL('inference-source.json', frozen), 'utf8')) as {code: string};
const original = vm.runInNewContext(source.code + ';inferRequiredDependencies') as Infer;
const serial = (value: unknown) => JSON.stringify(value);
const candidate = createCandidate();
let comparisons = 0;
const compare = (mod: Mod, catalog: Identity[], label: string) => {
    const before = serial([mod, catalog]), expected = serial(original(mod, catalog));
    const result = candidate.inferRequiredDependencies(mod, catalog);
    assert.equal(serial(result), expected, label);
    assert.equal(serial([mod, catalog]), before, label + ': inputs changed');
    if (Array.isArray(result) && result[0]) { result[0].version = 'consumer-edit'; result.push({modName: 'injected'}); }
    assert.equal(serial(candidate.inferRequiredDependencies({...mod}, catalog)), expected, label + ': result escaped');
    comparisons++;
};

let mod: Mod = {description: '工具甲是前置。工具乙是前置'};
let catalog: Identity[] = [{name: '工具甲', bootNames: ['AlphaTools'], aliases: ['Alpha Tools']}, {name: '工具乙', bootNames: ['BetaTools'], aliases: []}];
compare(mod, catalog, 'initial');
mod.description = '新别名是前置'; catalog[0]!.aliases.push('新别名'); compare(mod, catalog, 'alias append in place');
catalog[1]!.aliases.push('新别名'); compare(mod, catalog, 'ambiguity introduced');
catalog[1]!.aliases.pop(); compare(mod, catalog, 'ambiguity removed');
catalog[0]!.bootNames[0] = 'RenamedBoot'; compare(mod, catalog, 'boot identity changed');
catalog[0]!.bootNames.push('Multiple'); compare(mod, catalog, 'multiple boot names');
catalog[0]!.bootNames.pop(); catalog[0]!.identityId = null; compare(mod, catalog, 'disabled identity');
delete catalog[0]!.identityId; catalog[0]!.wikiName = '目录标题'; mod.description = '目录标题是前置'; compare(mod, catalog, 'wiki title added');
catalog = catalog.map(entry => ({...entry, bootNames: [...entry.bootNames], aliases: [...entry.aliases]})); compare({...mod}, catalog, 'replacement catalog and shallow mod');
catalog[0]!.wikiName = '其它标题'; compare(mod, catalog, 'old title removed');
catalog[0]!.name = '目录标题'; compare(mod, catalog, 'display name changed');
mod.bootNames = ['RenamedBoot']; compare(mod, catalog, 'self dependency');
mod = {description: '', desc: '目录标题是前置'}; compare(mod, catalog, 'description fallback');
mod.description = '工具乙是前置'; compare(mod, catalog, 'description precedence');

// Deterministic bounded combinations exercise cache reuse across changing identities, not frozen snapshots.
for (let i = 0; i < 160; i++) {
    catalog = [{name: '名称' + i % 5, bootNames: ['Boot' + i % 3], aliases: ['别名' + i % 7], identityId: i % 11 === 0 ? null : 'id'},
        {name: '另一名称', bootNames: i % 13 === 0 ? ['Other', 'Multi'] : ['Other'], aliases: i % 4 === 0 ? ['别名' + i % 7] : []}];
    mod = {description: (i % 2 ? '别名' + i % 7 : '名称' + i % 5) + (i % 3 ? '是前置' : '可选'), bootNames: i % 9 === 0 ? ['Boot' + i % 3] : []};
    compare(mod, catalog, 'combination ' + i);
}
for (let i = 0; i < 1100; i++) compare({description: '驱逐名' + i + '是前置'}, [{name: '驱逐名' + i, bootNames: ['EvictionBoot'], aliases: []}], 'eviction ' + i);
compare({description: '驱逐名0是前置'}, [{name: '驱逐名0', bootNames: ['EvictionBoot'], aliases: []}], 'evicted rule rebuilt');
const longAlias = '超长' + '别'.repeat(256);
compare({description: longAlias + '是前置'}, [{name: longAlias, bootNames: ['LongBoot'], aliases: []}], 'oversize rule bypass');
const stats = candidate.stats(); assert.ok(stats.evictions > 0 && stats.bypasses > 0 && stats.size <= stats.limit);

type Pair = {size: number; phase: string; pair: number; first: string; baselineMs: number; candidateMs: number};
const records: Pair[] = [], work: unknown[] = [];
const elapsed = (fn: Infer, value: Mod, identities: Identity[], calls: number) => {
    const began = performance.now(); for (let i = 0; i < calls; i++) fn(value, identities); return performance.now() - began;
};
const sizes = [25, 100, 250, 400]; // 400 deliberately exceeds the 1024-rule budget.
for (const size of sizes) {
    const identities: Identity[] = Array.from({length: size}, (_, i) => ({name: '合成工具' + i, bootNames: ['SyntheticTool' + i], aliases: ['Synthetic Tool ' + i, '测试别名' + i]}));
    identities[0] = {name: '工具甲', bootNames: ['AlphaTools'], aliases: ['Alpha Tools']};
    identities[1] = {name: '工具乙', bootNames: ['BetaTools'], aliases: ['Beta Tools']};
    const value = {description: '工具甲是前置。工具乙是前置'};
    let constructions = 0;
    const counted = vm.runInNewContext(source.code + ';inferRequiredDependencies', {RegExp: new Proxy(RegExp, {construct(target, args) {constructions++; return Reflect.construct(target, args);}})}) as Infer;
    let candidateConstructions = 0;
    const countedCandidate = createCandidate(new Proxy(RegExp, {construct(target, args) {candidateConstructions++; return Reflect.construct(target, args);}}));
    assert.equal(serial(countedCandidate.inferRequiredDependencies(value, identities)), serial(counted(value, identities)));
    const cold = {baselineConstructors: constructions, candidateConstructors: candidateConstructions};
    constructions = 0; candidateConstructions = 0;
    for (let i = 0; i < 10; i++) { counted(value, identities); countedCandidate.inferRequiredDependencies(value, identities); }
    const warm = {calls: 10, baselineConstructors: constructions, candidateConstructors: candidateConstructions};
    if (size <= 250) assert.equal(warm.candidateConstructors, 0);
    else {assert.equal(countedCandidate.stats().builds, 0, 'oversized catalog must use original rules'); assert.equal(warm.candidateConstructors, warm.baselineConstructors);}
    assert.ok(warm.baselineConstructors > 0);
    work.push({size, cold, warm, cachedAliases: countedCandidate.stats().size});
    for (const phase of ['cold', 'warm']) for (let pair = -2; pair < 12; pair++) {
        const base = vm.runInNewContext(source.code + ';inferRequiredDependencies') as Infer;
        const next = createCandidate(); // Fresh function/realm on BOTH sides; setup excluded, not startup timing.
        const calls = phase === 'cold' ? 1 : 10;
        if (phase === 'warm') for (let i = 0; i < 10; i++) {base(value, identities); next.inferRequiredDependencies(value, identities);}
        const first = pair % 2 === 0 ? 'baseline' : 'candidate';
        let baselineMs: number, candidateMs: number;
        if (first === 'baseline') {baselineMs = elapsed(base, value, identities, calls); candidateMs = elapsed(next.inferRequiredDependencies, value, identities, calls);}
        else {candidateMs = elapsed(next.inferRequiredDependencies, value, identities, calls); baselineMs = elapsed(base, value, identities, calls);}
        if (pair >= 0) records.push({size, phase, pair, first, baselineMs, candidateMs});
    }
}
const median = (values: number[]) => {const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;};
const summary = sizes.flatMap(size => ['cold', 'warm'].map(phase => {
    const pairs = records.filter(record => record.size === size && record.phase === phase);
    return {size, phase, pairs: pairs.length, baselineMedianMs: median(pairs.map(record => record.baselineMs)), candidateMedianMs: median(pairs.map(record => record.candidateMs)), pairedDeltaMedianMs: median(pairs.map(record => record.candidateMs - record.baselineMs))};
}));
console.log(JSON.stringify({status: 'PASS', node: process.version, platform: process.platform, comparisons, stats, work, records, summary,
    sources: Object.fromEntries(['alias-patterns.mts', 'check-alias-patterns.mts'].map(name => [name, createHash('sha256').update(readFileSync(new URL(name, import.meta.url))).digest('hex')])),
    limits: 'Node-only immutable-rule cache experiment against frozen ModHub 1.8.3. No dependency/result cache, signature/current() changes, browser integration, Android or end-to-end performance claim. PASS means equivalence/resource assertions, not performance acceptance. Two discarded warmup pairs then 12 alternating pairs; fresh function/VM on both sides per pair; cold=one inference, warm=10 after 10 equal priming calls; VM setup excluded, process/engine caches not reset.'}, null, 2));
