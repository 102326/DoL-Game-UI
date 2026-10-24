import fs from 'node:fs';
import path from 'node:path';
import {digest as hash} from './contracts.ts';
type Check=typeof import('../ci-catalog.cjs').researchPlan[number];
export function safeSource(root:string, file:string):boolean {
  const relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return false;
  let current = root;
  for (const part of ['', ...relative.split(path.sep)]) {
    current = path.join(current, part);
    if (!fs.existsSync(current) || fs.lstatSync(current).isSymbolicLink()) return false;
  }
  return fs.realpathSync(file) === path.join(fs.realpathSync(root), relative);
}
export function filesBelow(dir:string, root:string):string[] {
  if (!safeSource(root, dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? filesBelow(path.join(dir, e.name), root) : e.isFile() ? [path.join(dir, e.name)] : []);
}
export function reportsFor(ctx:{root:string}, spec:Check['report']):string[] {
  if (!spec?.pattern) return [];
  const base = path.join(ctx.root, 'tests/artifacts'), regex = new RegExp('^' + spec.pattern.replaceAll('.', '\\.') + '$');
  return filesBelow(base, ctx.root).filter(f => regex.test(path.relative(base, f).split(path.sep).join('/')));
}
export function stamp(file:string):string { const s = fs.statSync(file); return `${s.mtimeMs}:${s.ctimeMs}:${s.size}:${hash(fs.readFileSync(file))}`; }
