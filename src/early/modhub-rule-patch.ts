/** Only rule compilation changes; identities, clauses and dependency results stay upstream. */
export function rewriteModHubRules(source: string, helper: string): string | undefined {
  const normalized = source.replaceAll('\r\n', '\n');
  const start = normalized.indexOf('    function inferRequiredDependencies(');
  const end = normalized.indexOf('\n    function getRequiredDependencies(', start);
  if (start < 0 || end <= start || normalized.includes('__swDependencyRules')) return;
  const infer = normalized.slice(start, end);
  const blockStart = infer.indexOf('                const name = ');
  const blockEnd = infer.indexOf('\n                if (!explicit.test(clause)', blockStart);
  const escape = infer.split('\n').find(line => line.includes('const escapePattern ='));
  if (blockStart < 0 || blockEnd <= blockStart || !escape) return;
  const block = infer.slice(blockStart, blockEnd);
  if ((block.match(/new RegExp\(/g) ?? []).length !== 3) return;
  const setup = `${helper}\nconst __swDependencyCompile = alias => {\n${escape}\n${block.replaceAll('entry.alias', 'alias')}\nreturn [explicit, framework, requiredAs];\n};
const __swDependencyRules = SwModHubDependencyRules.createRuleCache(__swDependencyCompile);\n`;
  const replacement = '                const [explicit, framework, requiredAs] = names.size <= __swDependencyRules.limit ? __swDependencyRules.get(entry.alias) : __swDependencyCompile(entry.alias);';
  const rewritten = normalized.slice(0, start) + setup + infer.slice(0, blockStart) + replacement + infer.slice(blockEnd) + normalized.slice(end);
  // Preserve the target's original line endings, including other authors' source outside this block.
  return source.includes('\r\n') ? rewritten.replaceAll('\n', '\r\n') : rewritten;
}
