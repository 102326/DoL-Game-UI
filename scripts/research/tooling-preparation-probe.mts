import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

// Research only: one process, no persistent or transferable success token.
type Receipt = Readonly<{input: string; output: string}>;
const valid = new WeakSet<object>();
function receipt(input: string, output: string): Receipt {
  const value = Object.freeze({input, output}); valid.add(value); return value;
}
function reusable(value: unknown, input: string, output: string): boolean {
  return typeof value === 'object' && value !== null && valid.has(value) &&
    (value as Receipt).input === input && (value as Receipt).output === output;
}
function prepare(value: unknown, input: string, output: string, build: () => void): 'reused' | 'built' {
  if (reusable(value, input, output)) return 'reused';
  build();
  return 'built';
}
function digestTree(root: string, excluded: Set<string> = new Set()): string {
  const hash = crypto.createHash('sha256');
  function walk(absolute: string, relative: string, ancestors: Set<string>): void {
    if (excluded.has(relative)) return;
    const stat = fs.lstatSync(absolute);
    hash.update(JSON.stringify([relative, stat.mode, stat.isSymbolicLink() ? 'link' : stat.isDirectory() ? 'directory' : 'file']));
    if (stat.isSymbolicLink()) {
      hash.update(fs.readlinkSync(absolute));
      const real = fs.realpathSync(absolute);
      if (ancestors.has(real)) throw Error(`symlink cycle: ${absolute}`);
      walk(real, `${relative}/@target`, new Set([...ancestors, real]));
    } else if (stat.isDirectory()) {
      for (const name of fs.readdirSync(absolute).sort()) walk(path.join(absolute, name), relative ? `${relative}/${name}` : name, ancestors);
    } else if (stat.isFile()) hash.update(fs.readFileSync(absolute));
    else throw Error(`unsupported file: ${absolute}`);
  }
  walk(root, '', new Set([fs.realpathSync(root)])); return hash.digest('hex');
}
function fingerprint(root: string, deps: string, outputs: string[], env: NodeJS.ProcessEnv): {input: string; output: string; ms: number} {
  const start = performance.now();
  const sorted = [...outputs].sort();
  const excluded = new Set(['node_modules', ...sorted]);
  const combine = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const input = combine([digestTree(root, excluded), digestTree(deps), crypto.createHash('sha256').update(fs.readFileSync(process.execPath)).digest('hex'), Object.entries(env).sort(([a], [b]) => a.localeCompare(b))]);
  const output = combine(sorted.map(name => [name, fs.existsSync(path.join(root, name)) ? digestTree(path.join(root, name)) : null]));
  return {input, output, ms: performance.now() - start};
}
function negativeChecks(): string[] {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tooling-fingerprint-fixture-'));
  const root = path.join(dir, 'root'); const deps = path.join(dir, 'deps');
  fs.mkdirSync(root); fs.mkdirSync(deps);
  for (const name of ['source.mts', 'tsconfig.json', 'package-lock.json', 'output.mjs']) fs.writeFileSync(path.join(root, name), name);
  fs.writeFileSync(path.join(deps, 'dependency'), 'original');
  const outputs = ['output.mjs']; const env = {PROBE: 'a'};
  const before = fingerprint(root, deps, outputs, env); const token = receipt(before.input, before.output);
  assert(reusable(token, before.input, before.output));
  assert(!reusable(null, before.input, before.output));
  assert(!reusable({...token}, before.input, before.output));
  const checks = ['no successful receipt', 'forged or corrupt receipt'];
  let fallbackCalls = 0;
  assert.equal(prepare(null, before.input, before.output, () => { fallbackCalls++; }), 'built');
  assert.equal(fallbackCalls, 1);
  let failedToken: Receipt | undefined;
  assert.throws(() => {
    prepare(undefined, before.input, before.output, () => { throw Error('injected build failure'); });
    failedToken = receipt(before.input, before.output);
  }, /injected build failure/);
  assert(!reusable(failedToken, before.input, before.output));
  assert.equal(prepare(failedToken, before.input, before.output, () => { fallbackCalls++; }), 'built');
  assert.equal(fallbackCalls, 2);
  checks.push('failed build leaves no receipt and falls back');
  for (const [label, file] of [['source', 'source.mts'], ['tsconfig', 'tsconfig.json'], ['lockfile', 'package-lock.json'], ['dependency fixture', '../deps/dependency'], ['output tamper', 'output.mjs'], ['new input', 'new-input.mts']] as const) {
    const target = path.resolve(root, file); const original = fs.existsSync(target) ? fs.readFileSync(target) : undefined;
    fs.writeFileSync(target, 'mutation'); const after = fingerprint(root, deps, outputs, env);
    assert.equal(prepare(token, after.input, after.output, () => { fallbackCalls++; }), 'built', label);
    if (original) fs.writeFileSync(target, original); else fs.unlinkSync(target);
    checks.push(label);
  }
  fs.unlinkSync(path.join(root, outputs[0]!));
  const deleted = fingerprint(root, deps, outputs, env); assert(!reusable(token, deleted.input, deleted.output)); checks.push('output deletion');
  fs.writeFileSync(path.join(root, outputs[0]!), outputs[0]!);
  const changedEnv = fingerprint(root, deps, outputs, {PROBE: 'b'}); assert(!reusable(token, changedEnv.input, changedEnv.output)); checks.push('environment');
  fs.rmSync(dir, {recursive: true, force: true}); return checks;
}
const negatives = negativeChecks();
if (process.argv.includes('--negatives-only')) { console.log(JSON.stringify(negatives)); process.exit(0); }
const repo = process.cwd();
const base = execFileSync('git', ['rev-parse', '4b18069^{commit}'], {cwd: repo, encoding: 'utf8'}).trim();
assert.equal(base, '4b18069d06be75fffbc8026f0c7c2b079d8f490a');
const checkoutHead = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: repo, encoding: 'utf8'}).trim();
const artifact = fs.mkdtempSync(path.join(os.tmpdir(), 'tooling-preparation-probe-'));
const root = path.join(artifact, 'checkout'); fs.mkdirSync(root);
const archive = path.join(artifact, 'head.tar');
execFileSync('git', ['archive', '--format=tar', '-o', archive, base], {cwd: repo});
execFileSync('tar', ['-xf', archive, '-C', root]);
const sha256 = (value: Buffer | string) => crypto.createHash('sha256').update(value).digest('hex');
assert.equal(sha256(fs.readFileSync(path.join(repo, 'package-lock.json'))), sha256(fs.readFileSync(path.join(root, 'package-lock.json'))), 'workspace lockfile differs from archived baseline');
const deps = fs.realpathSync(path.join(repo, 'node_modules')); fs.symlinkSync(deps, path.join(root, 'node_modules'), 'dir');
const script = path.join(root, 'scripts/build-tooling.mts'); let source = fs.readFileSync(script, 'utf8');
const originalScriptHash = sha256(source);
const check = "for(const config of configs)execFileSync(process.execPath,[path.join(root,config==='tsconfig.test-tools.json'?'node_modules/vue-tsc/bin/vue-tsc.js':'node_modules/typescript/bin/tsc'),'-p',config],{cwd:root,stdio:'inherit'});";
assert(source.includes(check));
source = source.replace(check, `for(const config of configs){const start=performance.now();execFileSync(process.execPath,[path.join(root,config==='tsconfig.test-tools.json'?'node_modules/vue-tsc/bin/vue-tsc.js':'node_modules/typescript/bin/tsc'),'-p',config],{cwd:root,stdio:'inherit'});fs.appendFileSync(process.env.PROBE_PHASES!,JSON.stringify({phase:config,ms:performance.now()-start})+'\\n');}\nconst generationStart=performance.now();`);
const write = " fs.writeFileSync(file.replace(/\\.cts$/,'.cjs').replace(/\\.mts$/,'.mjs'),result.outputText);";
assert(source.includes(write));
source = source.replace(write, " const output=file.replace(/\\.cts$/,'.cjs').replace(/\\.mts$/,'.mjs');\n fs.writeFileSync(output,result.outputText);\n fs.appendFileSync(process.env.PROBE_OUTPUTS!,path.relative(root,output)+'\\n');");
source = "import {performance} from 'node:perf_hooks';\n" + source + "\nfs.appendFileSync(process.env.PROBE_PHASES!,JSON.stringify({phase:'generation',ms:performance.now()-generationStart})+'\\n');\n";
fs.writeFileSync(script, source);
const instrumentedScriptHash = sha256(source);
const probeHash = sha256(fs.readFileSync(fileURLToPath(import.meta.url)));
const nodeBinaryHash = sha256(fs.readFileSync(process.execPath));
const phases = path.join(artifact, 'phases.jsonl'); const outputLog = path.join(artifact, 'outputs.txt');
const env = {...process.env, PROBE_PHASES: phases, PROBE_OUTPUTS: outputLog};
// Establish the exact output path set before the first build, using the same
// config parsing and filtering as build-tooling itself.
const expectedOutputs = new Set<string>();
for (const configName of ['tsconfig.tools.json', 'tsconfig.test-tools.json', 'tsconfig.device-probe.json']) {
  const config = ts.readConfigFile(path.join(root, configName), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  if (config.error || parsed.errors.length) throw Error(`config parse failed: ${configName}`);
  for (const file of parsed.fileNames.filter(file => /\.[cm]ts$/.test(file))) {
    expectedOutputs.add(path.relative(root, file.replace(/\.cts$/, '.cjs').replace(/\.mts$/, '.mjs')));
  }
}
const outputs = [...expectedOutputs].sort();
assert(outputs.length > 0);
function build(): number {
  fs.writeFileSync(outputLog, ''); const start = performance.now();
  const result = spawnSync(process.execPath, ['--experimental-strip-types', script], {cwd: root, env, encoding: 'utf8'});
  fs.appendFileSync(path.join(artifact, 'build.log'), JSON.stringify({status: result.status, stdout: result.stdout, stderr: result.stderr})+'\n');
  if (result.status !== 0) throw Error(`build failed: ${result.status}; retained ${artifact}`);
  return performance.now() - start;
}
const sequenceStart = performance.now();
const beforeFirst = fingerprint(root, deps, outputs, env);
const first = build();
assert.deepEqual([...new Set(fs.readFileSync(outputLog, 'utf8').trim().split('\n').filter(Boolean))].sort(), outputs);
const afterFirst = fingerprint(root, deps, outputs, env);
assert.equal(beforeFirst.input, afterFirst.input, 'inputs changed during first build');
const token = receipt(afterFirst.input, afterFirst.output);
const guardStart = performance.now();
const forReuse = fingerprint(root, deps, outputs, env);
const result = prepare(token, forReuse.input, forReuse.output, () => { build(); });
const secondPreparationMs = performance.now() - guardStart;
const actualReuseSequenceMs = performance.now() - sequenceStart;
assert.equal(result, 'reused', 'expected actual skip');
const second = build();
assert.deepEqual([...new Set(fs.readFileSync(outputLog, 'utf8').trim().split('\n').filter(Boolean))].sort(), outputs);
const afterSecond = fingerprint(root, deps, outputs, env);
assert(reusable(token, afterSecond.input, afterSecond.output), 'same checkout and output must match');
const identities = {originalScriptHash, instrumentedScriptHash, probeHash, nodeBinaryHash, fingerprints:{beforeFirst:{input:beforeFirst.input, output:beforeFirst.output}, afterFirst:{input:afterFirst.input, output:afterFirst.output}, forReuse:{input:forReuse.input, output:forReuse.output}, afterBaseline:{input:afterSecond.input, output:afterSecond.output}}};
const report = {base, checkoutHead, node:process.version, identities, negatives, dependencyNegative:'isolated fixture, not shared installed tree', outputs:outputs.length, outputList:outputs, buildsMs:[first,second], phases:fs.readFileSync(phases,'utf8').trim().split('\n').map(line=>JSON.parse(line) as unknown), fingerprintMs:{beforeFirst:beforeFirst.ms, afterFirst:afterFirst.ms, forReuse:forReuse.ms, afterBaseline:afterSecond.ms}, baselineTwoBuildsMs:first+second, receiptPreparationMs:beforeFirst.ms+afterFirst.ms, actualSecondPreparationMs:secondPreparationMs, actualReuseSequenceMs, actualReuseResult:result, limitation:'Frozen checkout required; concurrent changes and TOCTOU are not solved.'};
fs.writeFileSync(path.join(artifact, 'report.json'), JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
