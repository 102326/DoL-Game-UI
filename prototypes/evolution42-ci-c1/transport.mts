import {createHash} from 'node:crypto';
import {closeSync, constants, fstatSync, lstatSync, openSync, readSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {candidate} from './candidate.mts';
import {verifyShadow} from './shadow.mts';
import {safeFile} from '../../scripts/ci/records.ts';
import {sourceIdentity} from '../../scripts/ci/source.ts';
import type {Context} from '../../scripts/ci/upload.ts';

// The caller owns these anchors. This local drill does not authenticate their origin,
// Actions transport, or PR platform identity.
export type TransportAnchor = {base:string; identity:Context['identity']; planSha256:string; reportSha256:string; evidenceSha256:string};
const limit = 16 * 1024 * 1024, fileLimit = 2000;
const hash = (bytes:Buffer|string) => createHash('sha256').update(bytes).digest('hex');
const same = (a:unknown,b:unknown) => JSON.stringify(a) === JSON.stringify(b);
const record = (v:unknown):v is Record<string,unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function readBounded(file:string,maxBytes:number):Buffer {
 if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) throw Error('Invalid byte limit');
 const stat = lstatSync(file);
 if (!stat.isFile() || stat.isSymbolicLink()) throw Error('Not a regular file');
 if (stat.size > maxBytes) throw Error('File byte limit exceeded');
 const fd = openSync(file,constants.O_RDONLY | constants.O_NOFOLLOW);
 try {
  const opened = fstatSync(fd);
  if (!opened.isFile() || opened.dev !== stat.dev || opened.ino !== stat.ino || opened.size !== stat.size) throw Error('File changed during open');
  const bytes = Buffer.alloc(stat.size + 1);
  let offset = 0, n:number;
  while (offset < bytes.length && (n = readSync(fd,bytes,offset,bytes.length-offset,null)) > 0) offset += n;
  if (offset !== stat.size) throw Error('File changed or byte limit exceeded');
  return bytes.subarray(0,offset);
 } finally { closeSync(fd); }
}
export function digestFile(file:string,maxBytes:number):string { return hash(readBounded(file,maxBytes)); }

export function evidenceDigest(dir:string):string {
 const root = lstatSync(dir);
 if (!root.isDirectory() || root.isSymbolicLink()) throw Error('Unsafe evidence directory');
 const files:{path:string;size:number;sha256:string}[] = [];
 let bytes = 0, directories = 0;
 function walk(relative:string):void {
  if (++directories > fileLimit) throw Error('Evidence directory limit exceeded');
  const folder = relative ? path.join(dir, ...relative.split('/')) : dir;
  for (const entry of readdirSync(folder,{withFileTypes:true})) {
   const name = relative ? relative + '/' + entry.name : entry.name;
   const target = path.join(folder,entry.name), stat = lstatSync(target);
   if (stat.isSymbolicLink()) throw Error('Evidence symlink: ' + name);
   if (stat.isDirectory()) walk(name);
   else if (stat.isFile()) {
    if (files.length >= fileLimit) throw Error('Evidence file limit exceeded');
    bytes += stat.size;
    if (bytes > limit) throw Error('Evidence byte limit exceeded');
    files.push({path:name,size:stat.size,sha256:digestFile(safeFile(dir,name),stat.size)});
   } else throw Error('Non-regular evidence entry: ' + name);
  }
 }
 walk('');
 files.sort((a,b)=>a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
 return hash(JSON.stringify(files));
}

export function verifyTransport(root:string,bundle:string,anchor:TransportAnchor):{status:'PASS'|'UNVERIFIED';problems:string[]} {
 const problems:string[] = [];
 const fail = (label:string,error:unknown) => problems.push(label + ': ' + (error instanceof Error ? error.message : String(error)));
 try {
  if (!record(anchor) || typeof anchor.base !== 'string' || !anchor.base || !record(anchor.identity) || !record(anchor.identity.source) || !record(anchor.identity.run) || typeof anchor.identity.run.id !== 'string' || !anchor.identity.run.id || typeof anchor.identity.run.attempt !== 'string' || !anchor.identity.run.attempt || ![anchor.planSha256,anchor.reportSha256,anchor.evidenceSha256].every(v=>typeof v==='string' && /^[a-f0-9]{64}$/.test(v))) throw Error('Invalid external anchor');
  const bundleStat = lstatSync(bundle);
  if (!bundleStat.isDirectory() || bundleStat.isSymbolicLink()) throw Error('Unsafe bundle directory');
  const planFile = safeFile(bundle,'plan.json'), reportFile = safeFile(bundle,'report.json'), evidence = path.join(bundle,'evidence');
  if (digestFile(planFile,limit) !== anchor.planSha256) problems.push('PlanDigestMismatch');
  if (digestFile(reportFile,limit) !== anchor.reportSha256) problems.push('ReportDigestMismatch');
  if (evidenceDigest(evidence) !== anchor.evidenceSha256) problems.push('EvidenceDigestMismatch');
  if (problems.length) return {status:'UNVERIFIED',problems};
  let plan:unknown, report:unknown;
  try { const bytes=readBounded(safeFile(bundle,'plan.json'),limit); if(hash(bytes)!==anchor.planSha256)throw Error('Digest mismatch'); plan=JSON.parse(bytes.toString('utf8')); } catch(error) { fail('Invalid plan JSON',error); }
  try { const bytes=readBounded(safeFile(bundle,'report.json'),limit); if(hash(bytes)!==anchor.reportSha256)throw Error('Digest mismatch'); report=JSON.parse(bytes.toString('utf8')); } catch(error) { fail('Invalid report JSON',error); }
  if (problems.length) return {status:'UNVERIFIED',problems};
  const expected = candidate(root,anchor.base);
  if (!same(plan,expected)) problems.push('Plan mismatch');
  if (!same(sourceIdentity(root),anchor.identity.source)) problems.push('Source identity mismatch');
  if (!problems.length) {
   const ctx:Context = {root,dir:evidence,identity:anchor.identity};
   problems.push(...verifyShadow(ctx,anchor.base,expected,report));
  }
  if (!same(candidate(root,anchor.base),expected)) problems.push('Plan changed during verification');
  if (!same(sourceIdentity(root),anchor.identity.source)) problems.push('Source changed during verification');
  if (digestFile(safeFile(bundle,'plan.json'),limit) !== anchor.planSha256) problems.push('Plan changed during verification');
  if (digestFile(safeFile(bundle,'report.json'),limit) !== anchor.reportSha256) problems.push('Report changed during verification');
  if (evidenceDigest(evidence) !== anchor.evidenceSha256) problems.push('Evidence changed during verification');
 } catch(error) { fail('Transport verification failed',error); }
 return {status:problems.length ? 'UNVERIFIED' : 'PASS',problems};
}
