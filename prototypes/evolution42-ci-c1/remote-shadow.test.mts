import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fixtures from '../../tests/ci-fixtures.cjs';
import {summarize} from '../../scripts/ci/summary.ts';
import {finalizeUpload} from '../../scripts/ci/upload.ts';
import {verifyRemote} from '../../scripts/ci/remote.ts';
import type {Expected} from '../../scripts/ci/remote.ts';

const root=path.resolve(fileURLToPath(new URL('../../',import.meta.url)));
const artifacts=path.join(root,'tests/artifacts/ui42/ci-c1/remote-shadow');
mkdirSync(artifacts,{recursive:true});
const dir=mkdtempSync(path.join(artifacts,'run-'));
const names=['positive-a','positive-b','whole-package-cross-run','run-id-mismatch','attempt-mismatch','swapped-shard','rewritten-index','pr-head','pr-base','pr-merge'];
const results:{name:string;status:string;problems:unknown}[]=[];
const json=(file:string,value:unknown)=>writeFileSync(file,JSON.stringify(value,null,2)+'\n');
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const hash=(file:string)=>createHash('sha256').update(readFileSync(file)).digest('hex');
const steps={checkout:{outcome:'success'},node:{outcome:'success'},python:{outcome:'success'}};

// This is a synthetic complete standard profile, not a selected shadow or real Actions run.
function packageFor(label:string,attempt:string){
 const target=path.join(dir,label);mkdirSync(target);
 const ctx=fixtures.fixture(target);
 const identity={...ctx.identity,run:{...ctx.identity.run,id:'run-'+label,githubRunId:'github-'+label,attempt},nonce:'nonce-'+label,pr:{head:'head-'+label,base:'base-'+label,merge:ctx.identity.source.head}};
 function rewrite(value:unknown):void {
  if(Array.isArray(value)){for(const item of value)rewrite(item);return}
  if(!object(value))return;
  for(const [key,item] of Object.entries(value)){
   if(key==='identity')value[key]=identity;
   else if(key==='buildIdentity'&&object(item)){item.runId=identity.run.githubRunId;item.attempt=attempt;}
   else if(key==='runId'&&item==='controlled-run')value[key]=identity.run.id;
   else rewrite(item);
  }
 }
 function rewriteFiles(folder:string):void {
  for(const entry of readdirSync(folder,{withFileTypes:true})){
   const file=path.join(folder,entry.name);
   if(entry.isDirectory())rewriteFiles(file);
   else if(entry.isFile()&&file.endsWith('.json')){const data:unknown=JSON.parse(readFileSync(file,'utf8'));rewrite(data);json(file,data);}
  }
 }
 rewriteFiles(target);
 const current={...ctx,identity};
 const summary=summarize(current,steps);assert.equal(summary.status,'PASS');
 assert.equal(finalizeUpload(current,summary).status,'PASS');
 const upload=path.join(target,'upload');
 const expected:Expected={checkoutSHA:identity.source.head,source:structuredClone(identity.source),profile:'standard',nonce:identity.nonce,run:structuredClone(identity.run),pr:structuredClone(identity.pr),manifestSha256:hash(path.join(upload,'upload-index.json'))};
 return {upload,expected};
}
function verify(name:string,folder:string,expected:Expected,pass:boolean,reason?:string){
 const result=verifyRemote(folder,expected);results.push({name,status:result.status,problems:result.problems});
 json(path.join(dir,'results.json'),results);
 assert.equal(result.status,pass?'PASS':'UNVERIFIED',name);
 if(reason)assert.ok(result.problems.some(p=>p.reason.includes(reason)),name+' expected '+reason);
}
try {
 const a=packageFor('a','1'),b=packageFor('b','2');
 json(path.join(dir,'frozen-variants.json'),{scope:'synthetic complete standard profile; local contract only',names,anchors:{a:a.expected,b:b.expected}});
 verify('positive-a',a.upload,a.expected,true);verify('positive-b',b.upload,b.expected,true);
 verify('whole-package-cross-run',b.upload,a.expected,false,'Source/catalog/profile/nonce mismatch');
 verify('run-id-mismatch',b.upload,{...b.expected,run:{...b.expected.run,githubRunId:'github-a'}},false,'Run identity mismatch: githubRunId');
 const attemptOnly={...b.expected,run:{...b.expected.run,attempt:'1'}};
 verify('attempt-mismatch',b.upload,attemptOnly,false,'Run identity mismatch: attempt');
 const swapped=path.join(dir,'swapped');cpSync(a.upload,swapped,{recursive:true});
 const shard='checks/unit/'+readdirSync(path.join(a.upload,'checks/unit'))[0];
 assert.ok(shard.endsWith('.json'));cpSync(path.join(b.upload,shard),path.join(swapped,shard));
 verify('swapped-shard',swapped,a.expected,false);
 const rewritten=path.join(dir,'rewritten');cpSync(a.upload,rewritten,{recursive:true});
 const altered=path.join(rewritten,shard);writeFileSync(altered,readFileSync(altered,'utf8')+' ');
 const indexFile=path.join(rewritten,'upload-index.json'),index:unknown=JSON.parse(readFileSync(indexFile,'utf8'));
 assert.ok(object(index)&&Array.isArray(index.files));
 const entry=index.files.find((item:unknown)=>object(item)&&item.file===shard);
 assert.ok(object(entry));entry.sha256=hash(altered);entry.size=statSync(altered).size;json(indexFile,index);
 verify('rewritten-index',rewritten,a.expected,false,'Anchored manifest hash mismatch');
 for(const key of ['head','base','merge'] as const){
  const expected=structuredClone(a.expected);assert.ok(object(expected.pr));expected.pr[key]='wrong';
  verify('pr-'+key,a.upload,expected,false,'PR head/base/merge mismatch');
 }
 console.log('PASS synthetic standard remote trust contracts; evidence:',dir);
} catch(error) {
 writeFileSync(path.join(dir,'failure.log'),error instanceof Error?error.stack||error.message:String(error));
 throw error;
} finally {json(path.join(dir,'results.json'),results);}
