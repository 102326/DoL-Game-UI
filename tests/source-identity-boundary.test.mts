// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {sourceIdentity,observeSource} from '../scripts/ci/source.ts';

test('source identity retains raw byte drift even when Git normalizes a clean file',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sw-source-'));
 t.after(()=>{if(path.dirname(path.resolve(dir))!==path.resolve(os.tmpdir())||!path.basename(dir).startsWith('sw-source-'))throw Error('Unexpected source fixture cleanup');fs.rmSync(dir,{recursive:true,force:true})});
 const git=(...args:string[])=>execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe']});
 git('init','-q');git('config','core.autocrlf','false');git('config','core.filemode','false');
 fs.writeFileSync(path.join(dir,'.gitattributes'),'* text eol=lf\n');
 fs.writeFileSync(path.join(dir,'package-lock.json'),'{}\n');fs.writeFileSync(path.join(dir,'owned.txt'),'first\nsecond\n');
 git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-qm','source fixture');
 const refreshUnchanged=()=>{assert.equal(git('hash-object','--path=owned.txt','owned.txt').trim(),git('rev-parse','HEAD:owned.txt').trim());git('update-index','--','owned.txt');assert.equal(git('diff','--cached','--name-only'),'','fixture refresh must not stage content')};
 const clean=sourceIdentity(dir);assert.equal(clean.dirty,false);assert.deepEqual(sourceIdentity(dir),clean);
 fs.writeFileSync(path.join(dir,'owned.txt'),'first\r\nsecond\r\n');refreshUnchanged();
 const bytes=sourceIdentity(dir);assert.equal(bytes.head,clean.head);assert.equal(bytes.tree,clean.tree);assert.equal(bytes.dirty,false);assert.notEqual(bytes.contentSha256,clean.contentSha256,'raw bytes cannot be normalized into a previous identity');
 fs.writeFileSync(path.join(dir,'owned.txt'),'first\nsecond\n');refreshUnchanged();assert.deepEqual(sourceIdentity(dir),clean);
 fs.writeFileSync(path.join(dir,'untracked.txt'),'new');const untracked=sourceIdentity(dir);assert.equal(untracked.dirty,true);assert.notEqual(untracked.contentSha256,clean.contentSha256);fs.unlinkSync(path.join(dir,'untracked.txt'));
 fs.writeFileSync(path.join(dir,'package-lock.json'),'{"changed":true}\n');const lock=sourceIdentity(dir);assert.equal(lock.dirty,true);assert.notEqual(lock.lockSha256,clean.lockSha256);assert.notEqual(lock.contentSha256,clean.contentSha256);
 fs.writeFileSync(path.join(dir,'package-lock.json'),'{}\n');fs.unlinkSync(path.join(dir,'owned.txt'));const missing=sourceIdentity(dir);assert.equal(missing.dirty,true);assert.notEqual(missing.contentSha256,clean.contentSha256);
});
test('source-less structural fixtures remain opaque and unavailable real source cannot become PASS',()=>{
 for(const source of [undefined,null,0,'fixture',{future:{keep:true}}, {tree:'',opaque:true}])assert.equal(observeSource({root:'not-used',identity:{source}}),source);
 const absent=path.join(os.tmpdir(),'sw-source-missing-'+process.pid+'-'+Date.now());assert.equal(fs.existsSync(absent),false);
 const result=observeSource({root:absent,identity:{source:{tree:'real'}}});assert.ok(result&&typeof result==='object'&&'error' in result&&'message' in result);assert.equal(result.error,'SourceUnavailable');assert.ok(typeof result.message==='string');assert.ok(result.message.length<=200);
});
