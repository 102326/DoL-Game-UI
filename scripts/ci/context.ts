import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {sourceIdentity} from './source.ts';
import type {SourceIdentity} from './source.ts';
import {sameIdentity,reconcileIdentity} from './contracts.ts';
import {writeJson} from './records.ts';

const require=createRequire(import.meta.url),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const {catalogFor,catalogIdentity,projectId}:typeof import('../ci-catalog.cjs')=require('../ci-catalog.cjs');
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const source=(value:unknown):value is SourceIdentity=>record(value)&&typeof value.dirty==='boolean'&&[value.head,value.tree].every(part=>typeof part==='string'&&/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(part))&&[value.contentSha256,value.lockSha256].every(part=>typeof part==='string'&&/^[a-f0-9]{64}$/.test(part));
export function playwrightVersion(value:unknown):string{
 if(!record(value)||!record(value.packages)||!record(value.packages['node_modules/playwright'])||typeof value.packages['node_modules/playwright'].version!=='string')throw Error('Invalid Playwright lock version');
 return value.packages['node_modules/playwright'].version;
}
function pullRequest(value:unknown){
 if(!record(value))throw Error('Invalid workflow event');
 const pr=value.pull_request;if(!pr)return null;
 if(!record(pr)||!record(pr.head)||!record(pr.base)||typeof pr.head.sha!=='string'||typeof pr.base.sha!=='string')throw Error('Invalid pull request event');
 return {head:pr.head.sha,base:pr.base.sha,merge:process.env.GITHUB_SHA};
}
export function context({allowSourceDrift=false}:{allowSourceDrift?:boolean}={}){
 const started=Date.now(),id=process.env.MOODY_EVIDENCE_ID||`local-${Date.now()}-${process.pid}`;
 if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id))throw Error('Invalid MOODY_EVIDENCE_ID');
 process.env.MOODY_EVIDENCE_ID=id;
 const dir=path.join(root,'tests/artifacts/ci',id);fs.mkdirSync(dir,{recursive:true});
 const version=(command:string)=>{try{return execFileSync(command,['--version'],{encoding:'utf8',timeout:5000,stdio:['ignore','pipe','pipe']}).trim()}catch{return null}};
 const profile=process.env.MOODY_PROFILE||'standard',depth=process.env.MOODY_DEVICE_DEPTH||'standard';
 const event:unknown=process.env.GITHUB_EVENT_PATH?JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
 const priorFile=path.join(dir,'identity.json'),exists=fs.existsSync(priorFile);let prior:unknown;
 if(exists){
  if(fs.lstatSync(priorFile).isSymbolicLink()||fs.statSync(priorFile).size>262144)throw Error('Unsafe prior identity');
  const envelope:unknown=JSON.parse(fs.readFileSync(priorFile,'utf8'));
  if(!record(envelope)||envelope.schema!==1)throw Error('Invalid prior identity');prior=envelope.identity;
 }
 const contract=catalogIdentity(profile,depth),priorNonce=record(prior)&&typeof prior.nonce==='string'?prior.nonce:undefined;
 let identity={
  projectId,source:sourceIdentity(),
  run:{id,attempt:process.env.GITHUB_RUN_ATTEMPT||'local',githubRunId:process.env.GITHUB_RUN_ID||null,repository:process.env.GITHUB_REPOSITORY||null,ref:process.env.GITHUB_REF||null,event:process.env.GITHUB_EVENT_NAME||'local',workflow:process.env.GITHUB_WORKFLOW||null,job:process.env.GITHUB_JOB||null,url:process.env.GITHUB_RUN_ID?`${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`:null},
  nonce:priorNonce||crypto.randomBytes(16).toString('hex'),profile:contract.profile,catalog:contract,pr:pullRequest(event),
  environment:{orderSeed:process.env.MOODY_ORDER_SEED||null,runnerImage:process.env.ImageOS||null,runnerImageVersion:process.env.ImageVersion||null,platform:process.platform,arch:process.arch,deviceDepth:depth,node:process.version,npm:version('npm'),python:version('python'),playwright:playwrightVersion(require('../../package-lock.json')),browser:process.platform==='win32'?'Microsoft Edge (browser suite)':'Pinned Playwright Chromium (browser suite)'}
 };
 // Equality validates every current field; the separately checked source is the only finalization exception.
 function previous(value:unknown):value is typeof identity{return record(value)&&typeof value.nonce==='string'&&/^[a-f0-9]{32}$/.test(value.nonce)&&source(value.source)&&sameIdentity(value,{...identity,source:value.source})}
 if(exists){if(!previous(prior))throw Error('Run identity changed; fresh run directory required');identity=reconcileIdentity(prior,identity,allowSourceDrift)}
 if(process.env.GITHUB_ACTIONS==='true'&&identity.source.head!==process.env.GITHUB_SHA)throw Error('Checkout differs from workflow SHA');
 if(!exists){writeJson(priorFile,{schema:1,identity});writeJson(path.join(dir,'catalog.json'),{schema:1,identity,catalog:catalogFor(profile,depth)})}
 return {root,dir,identity,preparationMs:Date.now()-started};
}
