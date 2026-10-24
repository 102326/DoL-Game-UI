import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {sealProblems,sameIdentity,overall,verdict,exactIds,digest as hash} from './contracts.ts';
import {safeFile,readJsonBounded} from './records.ts';
import {expectedLockSha256} from './lock.ts';
import {requiredEvidence,validateUpload} from './upload.ts';
import type {Context,Problem} from './upload.ts';
import {summarize} from './summary.ts';
import {researchSummary} from './research-summary.ts';
const require=createRequire(import.meta.url),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const {projectId,catalogFor,catalogIdentity}:typeof import('../ci-catalog.cjs')=require('../ci-catalog.cjs');
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const object=(v:unknown)=>{if(!record(v))throw Error('Invalid evidence object');return v};
function identityRecord(v:unknown):v is Context['identity']&Record<string,unknown>{
 return record(v)&&record(v.source)&&typeof v.source.head==='string'&&record(v.run)&&typeof v.run.id==='string'&&typeof v.run.attempt==='string'&&(v.run.githubRunId==null||typeof v.run.githubRunId==='string')&&(v.projectId===undefined||typeof v.projectId==='string')&&(v.profile===undefined||typeof v.profile==='string')&&(v.nonce===undefined||typeof v.nonce==='string')&&(v.environment===undefined||record(v.environment)&&(v.environment.deviceDepth===undefined||typeof v.environment.deviceDepth==='string'));
}
export interface Expected {checkoutSHA?:string;source:{head:string};profile:string;depth?:string;nonce?:string;manifestSha256?:string;run:Partial<Record<'githubRunId'|'attempt'|'repository'|'ref'|'workflow'|'event'|'job',unknown>>;pr:unknown}
export function verifyRemote(directory:string,expected:Expected) {
 const started=Date.now(),problems:Problem[]=[];let identity:(Context['identity']&Record<string,unknown>)|undefined,summary:Record<string,unknown>|undefined,computed:Record<string,unknown>|undefined;
 try {
  const candidate=object(readJsonBounded(directory,'identity.json')).identity;if(!identityRecord(candidate))throw Error('Invalid evidence identity');identity=candidate;if(identity.projectId!==projectId)throw Error('Project ID mismatch');const delivery=object(readJsonBounded(directory,'delivery.json'));summary=object(readJsonBounded(directory,'summary.json'));
  if(expected.source.head!==expected.checkoutSHA||!sameIdentity(identity.source,expected.source)||object(identity.source).dirty||!sameIdentity(identity.catalog,catalogIdentity(expected.profile,expected.depth||'standard'))||identity.profile!==expected.profile||identity.nonce!==expected.nonce)throw Error('Source/catalog/profile/nonce mismatch');
  for(const key of ['githubRunId','attempt','repository','ref','workflow','event','job'] as const)if(object(identity.run)[key]!==expected.run[key])throw Error('Run identity mismatch: '+key);
  if(!sameIdentity(identity.pr,expected.pr))throw Error('PR head/base/merge mismatch');
  if(hash(fs.readFileSync(safeFile(directory,'upload-index.json')))!==expected.manifestSha256)throw Error('Anchored manifest hash mismatch');
  if(!sameIdentity(summary.identity,identity)||!sameIdentity(delivery.identity,identity))throw Error('Delivery identity mismatch');
  const ctx={dir:directory,root,identity},required=[...requiredEvidence(expected.profile),'delivery.json'],raw=new Set(catalogFor(expected.profile).contracts.filter(c=>c.group==='research').flatMap(c=>c.evidence));
  problems.push(...validateUpload(ctx,required,required.filter(f=>f.endsWith('.json')&&!raw.has(f)),{destination:directory,remote:true}));
  const index=object(readJsonBounded(directory,'upload-index.json',1048576)),actual:string[]=[];let total=0;
  for(const reason of sealProblems(index.seal,expectedLockSha256,expected.source))problems.push({file:'upload-index.json',reason});
  function scan(dir:string,prefix=''){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const name=prefix+entry.name;if(entry.isSymbolicLink())throw Error('Downloaded symlink');if(entry.isDirectory())scan(path.join(dir,entry.name),name+'/');else{actual.push(name);total+=fs.statSync(path.join(dir,entry.name)).size;if(actual.length>2001||total>(expected.profile==='research'?160:16)*1048576)throw Error('Downloaded evidence budget exceeded')}}}scan(directory);
  if(!Array.isArray(index.files)||!exactIds([...index.files.map((e:unknown)=>object(e).file),'upload-index.json'],actual))problems.push({file:'upload-index.json',reason:'Actual downloaded set differs from manifest'});
  if(!sameIdentity(object(readJsonBounded(directory,'catalog.json')).catalog,catalogFor(expected.profile,expected.depth||'standard')))problems.push({file:'catalog.json',reason:'Catalog snapshot mismatch'});
  const computedValue:unknown=expected.profile==='research'?researchSummary(ctx):summarize(ctx,{checkout:{outcome:'success'},node:{outcome:'success'},python:{outcome:'success'}});computed=object(computedValue);
  if(computed.status!=='PASS'||summary.status!=='PASS'||delivery.status!=='PASS')problems.push({file:'summary.json',reason:'Uploaded result does not establish complete PASS'});
 } catch(error){problems.push({file:'remote-artifact',reason:error instanceof Error?error.message:String(error)})}
 const assertionResult=computed?.assertionResult==='FAIL'?'FAIL':summary?.assertionResult||'UNKNOWN';return{schema:1,identity,...verdict(assertionResult,problems,problems.length?overall([computed?.status||'UNVERIFIED','UNVERIFIED']):'PASS'),problems,remoteVerificationMs:Date.now()-started};
}
