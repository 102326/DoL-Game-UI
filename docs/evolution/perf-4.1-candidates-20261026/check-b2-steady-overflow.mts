// Focused lifecycle control: avoid repeated VM allocation while observing the known 400-entry boundary.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';
import {createCandidate as createB1} from './alias-patterns.mts';
import {createCandidate as createB2} from './alias-patterns-b2.mts';

type Mode = 'baseline' | 'b1' | 'b2';
type Infer = (mod: unknown, catalog: unknown) => unknown;
const source = JSON.parse(readFileSync(new URL('../perf-4.1-evidence-20261026/inference-source.json', import.meta.url), 'utf8')) as {code: string};
const old = createB1(), next = createB2();
const functions: Record<Mode, Infer> = {baseline: vm.runInNewContext(source.code + ';inferRequiredDependencies') as Infer, b1: old.inferRequiredDependencies, b2: next.inferRequiredDependencies};
const catalog = Array.from({length: 400}, (_, i) => ({name: '合成工具' + i, bootNames: ['SyntheticTool' + i], aliases: ['Synthetic Tool ' + i, '测试别名' + i]}));
catalog[0] = {name: '工具甲', bootNames: ['AlphaTools'], aliases: ['Alpha Tools']};
catalog[1] = {name: '工具乙', bootNames: ['BetaTools'], aliases: ['Beta Tools']};
const value = {description: '工具甲是前置。工具乙是前置'}, expected = JSON.stringify(functions.baseline(value, catalog));
const orders: readonly (readonly Mode[])[] = [['baseline', 'b1', 'b2'], ['baseline', 'b2', 'b1'], ['b1', 'baseline', 'b2'], ['b1', 'b2', 'baseline'], ['b2', 'baseline', 'b1'], ['b2', 'b1', 'baseline']];
for (let i = 0; i < 20; i++) for (const mode of orders[0]!) assert.equal(JSON.stringify(functions[mode](value, catalog)), expected);
const records: {triple: number; order: readonly Mode[]; ms: Record<Mode, number>; cpuMs: Record<Mode, number>}[] = [];
for (let triple = -2; triple < 12; triple++) {
    const order = orders[(triple + 6) % 6]!, ms: Record<Mode, number> = {baseline: 0, b1: 0, b2: 0}, cpuMs = {...ms};
    for (const mode of order) {
        let result: unknown;
        const cpu = process.cpuUsage(), began = performance.now();
        for (let i = 0; i < 10; i++) result = functions[mode](value, catalog);
        ms[mode] = performance.now() - began; const usage = process.cpuUsage(cpu); cpuMs[mode] = (usage.user + usage.system) / 1000;
        assert.equal(JSON.stringify(result), expected);
    }
    if (triple >= 0) records.push({triple, order, ms, cpuMs});
}
assert.equal(old.stats().builds, 0); assert.equal(next.stats().builds, 0);
const median = (values: number[]) => {const v = [...values].sort((a, b) => a - b), i = v.length / 2; return (v[i - 1]! + v[i]!) / 2;};
console.log(JSON.stringify({status: 'PASS', node: process.version, platform: process.platform, records,
    medianMs: Object.fromEntries(orders[0]!.map(mode => [mode, median(records.map(r => r.ms[mode]))])),
    b2MinusBaselineMedianMs: median(records.map(r => r.ms.b2 - r.ms.baseline)), b2MinusB1MedianMs: median(records.map(r => r.ms.b2 - r.ms.b1)),
    b2SlowerThanBaselineCount: records.filter(r => r.ms.b2 > r.ms.baseline).length,
    b1Cache: old.stats(), b2Cache: next.stats(),
    sources: Object.fromEntries(['alias-patterns.mts', 'alias-patterns-b2.mts', 'check-b2-steady-overflow.mts'].map(name => [name, createHash('sha256').update(readFileSync(new URL(name, import.meta.url))).digest('hex')])),
    limits: 'Focused 400-entry synthetic control, stable VM/function per mode after 20 equal priming calls. Two discarded triples then 12 triples cycling all 6 orders; each measurement 10 inferences. No constructor proxy or tracing. Process CPU includes runtime threads and is diagnostic, not exclusive function cost. PASS means equality/cache/collection only; not statistical equivalence, browser, Android or end-to-end acceptance.'}, null, 2));
