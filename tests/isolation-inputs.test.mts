// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const runner=fileURLToPath(new URL('../scripts/ci/isolated-build.ts',import.meta.url));
test('independent checkout keeps exact CRLF input without staging or hiding real edits',t=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'sw-isolation-')),source=path.join(folder,'source');
 t.after(()=>{
  if(path.dirname(path.resolve(folder))!==path.resolve(os.tmpdir())||!path.basename(folder).startsWith('sw-isolation-'))throw Error('Unexpected isolation fixture cleanup');
  fs.rmSync(folder,{recursive:true,force:true});
 });
 fs.mkdirSync(source);fs.mkdirSync(path.join(source,'node_modules'));
 const git=(cwd:string,...args:string[])=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']});
 git(source,'init','-q');git(source,'config','core.autocrlf','false');git(source,'config','core.filemode','false');
 fs.writeFileSync(path.join(source,'.gitattributes'),'* text eol=lf\n');fs.writeFileSync(path.join(source,'.gitignore'),'node_modules/\n');fs.writeFileSync(path.join(source,'package-lock.json'),'{}\n');
 const content='first\r\nsecond\r\n';fs.writeFileSync(path.join(source,'lines.txt'),content);
 git(source,'add','.');git(source,'-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-qm','controlled CRLF source');
 assert.equal(git(source,'status','--porcelain'),'', 'source fixture starts clean');
 for(const changed of [false,true]){
  const actualContent=changed?'changed\r\nsecond\r\n':content;
  fs.writeFileSync(path.join(source,'lines.txt'),actualContent);
  const destination=path.join(folder,changed?'dirty':'clean');fs.mkdirSync(destination);
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('MOODY_')&&!key.startsWith('NODE_TEST_')&&key!=='NODE_OPTIONS'));
  const result=spawnSync(process.execPath,[runner,source,destination,'python','--check-inputs'],{encoding:'utf8',env,timeout:30000});
  assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/PASS isolated source inputs/);
  assert.equal(fs.readFileSync(path.join(destination,'lines.txt'),'utf8'),actualContent);
  assert.equal(git(destination,'diff','--cached','--name-only'),'','refresh never stages a change');
  if(changed){assert.match(git(destination,'status','--porcelain'),/lines\.txt/);assert.match(git(destination,'diff','--','lines.txt'),/changed/);}
  else assert.equal(git(destination,'status','--porcelain'),'');
 }
});
