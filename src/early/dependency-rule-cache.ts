/** Browser-only rule cache; no Node, VM, game state or dependency results. */
export type RulePatterns = readonly [RegExp, RegExp, RegExp];
export function createRuleCache(compile: (alias: string) => RulePatterns) {
    const entries = new Map<string, RulePatterns>(), limit = 1024, maxAliasLength = 256;
    let builds = 0, hits = 0, evictions = 0, bypasses = 0;
    return {
        limit,
        get(alias: string): RulePatterns {
            const found = entries.get(alias);
            if (found) {entries.delete(alias); entries.set(alias, found); hits++; return found;}
            const patterns = compile(alias); builds++;
            if (patterns.some(pattern => pattern.global || pattern.sticky)) throw Error('Stateful rules cannot be cached');
            if (alias.length > maxAliasLength) {bypasses++; return patterns;}
            if (entries.size === limit) {entries.delete(entries.keys().next().value!); evictions++;}
            entries.set(alias, patterns); return patterns;
        },
        clear() {entries.clear();},
        stats: () => ({builds, hits, evictions, bypasses, size: entries.size, limit, maxAliasLength})
    };
}
