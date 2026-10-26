// Node-only experiment, never imported by the UI or installed into ModHub.
// Upstream source and MIT notice: ../perf-4.1-evidence-20261026/NOTICE-ModHub.txt
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';

type Infer = (mod: unknown, catalog: unknown) => unknown;
type Patterns = readonly [RegExp, RegExp, RegExp];
const source = JSON.parse(readFileSync(new URL('../perf-4.1-evidence-20261026/inference-source.json', import.meta.url), 'utf8')) as {code: string};
assert.equal(createHash('sha256').update(source.code).digest('hex'), '91b2a5b6330482745c6cf09d50d10d32eff5645ffbe756f876f4fab9e721b5bb');
// Extract the exact original expressions: do not silently repair its matching semantics.
const start = source.code.indexOf("                const name = ");
const end = source.code.indexOf('\n                if (!explicit.test(clause)', start);
assert.ok(start > 0 && end > start);
const block = source.code.slice(start, end);
assert.equal((block.match(/new RegExp\(/g) ?? []).length, 3);
const escapeLine = source.code.split('\n').find(line => line.includes('const escapePattern ='));
assert.ok(escapeLine);
const compileCode = `(alias) => { ${escapeLine}\n${block.replaceAll('entry.alias', 'alias')}\nreturn [explicit, framework, requiredAs]; }`;
// A catalog larger than the budget must keep the original path, not churn an LRU per clause.
const cachedBlock = '                const cachedPatterns = names.size <= patternCacheLimit ? patternsForAlias(entry.alias) : undefined;\n' +
    block.replace('const explicit = new RegExp(', 'const explicit = cachedPatterns?.[0] ?? new RegExp(')
        .replace('const framework = new RegExp(', 'const framework = cachedPatterns?.[1] ?? new RegExp(')
        .replace('const requiredAs = new RegExp(', 'const requiredAs = cachedPatterns?.[2] ?? new RegExp(');
const patched = source.code.replace(block, cachedBlock);
assert.notEqual(patched, source.code);

export function createCandidate(regexp?: RegExpConstructor) {
    // Cache only immutable matching rules; rebuild identity ambiguity and results on every call.
    // No catalog/mod object references, descriptions, dependency results or installation state retained.
    const cache = new Map<string, Patterns>();
    const limit = 1024, maxAliasLength = 256;
    // Optional constructor instrumentation is used only for work-count observations, not timings.
    const environment = regexp ? {RegExp: regexp} : {};
    const compile = vm.runInNewContext(compileCode, environment) as (alias: string) => Patterns;
    let builds = 0, hits = 0, evictions = 0, bypasses = 0;
    const patternsForAlias = (alias: string): Patterns => {
        const found = cache.get(alias);
        if (found) { cache.delete(alias); cache.set(alias, found); hits++; return found; }
        const patterns = compile(alias); builds++;
        assert.ok(patterns.every(pattern => !pattern.global && !pattern.sticky), 'Stateful patterns cannot be reused');
        if (alias.length > maxAliasLength) { bypasses++; return patterns; }
        if (cache.size === limit) { cache.delete(cache.keys().next().value!); evictions++; }
        cache.set(alias, patterns);
        return patterns;
    };
    const infer = vm.runInNewContext(patched + ';inferRequiredDependencies', {patternsForAlias, patternCacheLimit: limit, ...environment}) as Infer;
    return {
        inferRequiredDependencies: infer,
        stats: () => ({builds, hits, evictions, bypasses, size: cache.size, limit, maxAliasLength})
    };
}

const candidate = createCandidate();
export const inferRequiredDependencies: Infer = candidate.inferRequiredDependencies;
