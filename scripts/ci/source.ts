import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {digest as hash} from './contracts.ts';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export function sourceIdentity(checkout = root) {
  const git = (...args:string[]) => execFileSync('git', args, { cwd: checkout, maxBuffer: 16 * 1024 * 1024 });
  const files = [...new Set(git('ls-files', '--cached', '--others', '--exclude-standard', '-z').toString().split('\0').filter(Boolean))].sort();
  const content = crypto.createHash('sha256');
  for (const file of files) {
    const absolute = path.join(checkout, file);
    const stat = fs.existsSync(absolute) ? fs.lstatSync(absolute) : null;
    content.update(file + '\0');
    content.update(stat?.isFile() ? fs.readFileSync(absolute) : stat?.isSymbolicLink() ? fs.readlinkSync(absolute) : '<missing>');
    content.update('\0');
  }
  return {
    head: git('rev-parse', 'HEAD').toString().trim(),
    tree: git('rev-parse', 'HEAD^{tree}').toString().trim(),
    dirty: Boolean(git('status', '--porcelain', '--untracked-files=normal').length),
    contentSha256: content.digest('hex'),
    lockSha256: hash(fs.readFileSync(path.join(checkout, 'package-lock.json')))
  };
}

export type SourceIdentity=ReturnType<typeof sourceIdentity>;

// Structural source-less contexts are isolated gate fixtures; real identities always have a tree.
export function observeSource(ctx:{root:string;identity:{source:unknown}}):unknown{
 const source=ctx.identity.source;
 if(!source||typeof source!=='object'||!('tree' in source)||!source.tree)return source;
 try{return sourceIdentity(ctx.root)}catch(error){return {error:'SourceUnavailable',message:String(error&&typeof error==='object'&&'message' in error?error.message:undefined).slice(0,200)}}
}
