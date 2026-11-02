import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createCandidate} from './alias-patterns-b2.mts';
import {createCandidate as createB1} from './alias-patterns.mts';

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

// Same input object crosses the budget in both directions; no cached identity/result may escape.
const wide: Identity[] = [{name: '工具甲', bootNames: ['AlphaTools'], aliases: Array.from({length: 1100}, (_, i) => '宽目录别名' + i)}];
const beforeWide = candidate.stats().builds;
compare({description: '工具甲是前置'}, wide, 'many aliases in one identity');
assert.equal(candidate.stats().builds, beforeWide);
wide[0]!.aliases.splice(1); compare({description: '工具甲是前置'}, wide, 'return below budget');
wide[0]!.bootNames[0] = 'ChangedAfterFallback'; compare({description: '工具甲是前置'}, wide, 'identity mutation after fallback');

type Mode = 'baseline' | 'b1' | 'b2';
type Row = {size: number; phase: string; pair: number; order: readonly Mode[]; ms: Record<Mode, number>};
const orders: readonly (readonly Mode[])[] = [['baseline', 'b1', 'b2'], ['baseline', 'b2', 'b1'], ['b1', 'baseline', 'b2'], ['b1', 'b2', 'baseline'], ['b2', 'baseline', 'b1'], ['b2', 'b1', 'baseline']];
const records: Row[] = [], work: unknown[] = [], sizes = [25, 100, 250, 400];
for (const size of sizes) {
    const identities: Identity[] = Array.from({length: size}, (_, i) => ({name: '合成工具' + i, bootNames: ['SyntheticTool' + i], aliases: ['Synthetic Tool ' + i, '测试别名' + i]}));
    identities[0] = {name: '工具甲', bootNames: ['AlphaTools'], aliases: ['Alpha Tools']};
    identities[1] = {name: '工具乙', bootNames: ['BetaTools'], aliases: ['Beta Tools']};
    const value = {description: '工具甲是前置。工具乙是前置'}, expected = serial(original(value, identities));
    const constructors: Record<Mode, number> = {baseline: 0, b1: 0, b2: 0};
    const counter = (mode: Mode) => new Proxy(RegExp, {construct(target, args) {constructors[mode]++; return Reflect.construct(target, args);}});
    const old = createB1(counter('b1')), next = createCandidate(counter('b2'));
    const counted: Record<Mode, Infer> = {baseline: vm.runInNewContext(source.code + ';inferRequiredDependencies', {RegExp: counter('baseline')}) as Infer, b1: old.inferRequiredDependencies, b2: next.inferRequiredDependencies};
    for (const mode of orders[0]!) assert.equal(serial(counted[mode](value, identities)), expected);
    const cold = {...constructors}; constructors.baseline = constructors.b1 = constructors.b2 = 0;
    for (let i = 0; i < 10; i++) for (const mode of orders[0]!) counted[mode](value, identities);
    if (size <= 250) {assert.equal(constructors.b1, 0); assert.equal(constructors.b2, 0);}
    else {assert.equal(constructors.b2, constructors.baseline); assert.equal(next.stats().builds, 0);}
    work.push({size, cold, warm10Calls: {...constructors}, b1Cache: old.stats(), b2Cache: next.stats()});
    for (const phase of ['cold', 'warm']) for (let pair = -2; pair < 12; pair++) {
        const order = orders[(pair + orders.length) % orders.length]!;
        const b1 = createB1(), b2 = createCandidate();
        const functions: Record<Mode, Infer> = {baseline: vm.runInNewContext(source.code + ';inferRequiredDependencies') as Infer, b1: b1.inferRequiredDependencies, b2: b2.inferRequiredDependencies};
        if (phase === 'warm') for (let i = 0; i < 10; i++) for (const mode of order) functions[mode](value, identities);
        const ms: Record<Mode, number> = {baseline: 0, b1: 0, b2: 0};
        for (const mode of order) {
            let result: unknown;
            const began = performance.now(); for (let i = 0; i < (phase === 'cold' ? 1 : 10); i++) result = functions[mode](value, identities);
            ms[mode] = performance.now() - began; assert.equal(serial(result), expected);
        }
        if (pair >= 0) records.push({size, phase, pair, order, ms});
    }
}
const median = (values: number[]) => {const v = [...values].sort((a, b) => a - b), i = Math.floor(v.length / 2); return v.length % 2 ? v[i]! : (v[i - 1]! + v[i]!) / 2;};
const summary = sizes.flatMap(size => ['cold', 'warm'].map(phase => {
    const rows = records.filter(r => r.size === size && r.phase === phase);
    return {size, phase, triples: rows.length, medianMs: Object.fromEntries(orders[0]!.map(mode => [mode, median(rows.map(row => row.ms[mode]))])), b2MinusBaselineMedianMs: median(rows.map(row => row.ms.b2 - row.ms.baseline)), b2MinusB1MedianMs: median(rows.map(row => row.ms.b2 - row.ms.b1)), b2SlowerThanBaselineCount: rows.filter(row => row.ms.b2 > row.ms.baseline).length};
}));
console.log(JSON.stringify({status: 'PASS', node: process.version, platform: process.platform, comparisons, stats: candidate.stats(), work, records, summary,
    sources: Object.fromEntries(['alias-patterns.mts', 'alias-patterns-b2.mts', 'check-alias-patterns-b2.mts'].map(name => [name, createHash('sha256').update(readFileSync(new URL(name, import.meta.url))).digest('hex')])),
    limits: 'Node-only synthetic three-way observation; PASS is equivalence/resource/collection, not a performance budget, browser or Android acceptance. Each side fresh VM/function per triple. 10 equal priming calls for warm; measured cold=1 and warm=10 calls. Two discarded triples then 12 recorded, cycling all 6 orders equally. VM setup excluded; engine/process caches not reset; no tracing/proxy in timing.'}, null, 2));

