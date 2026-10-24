// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runCommand} from '../scripts/ci/process.ts';

const root=fileURLToPath(new URL('../',import.meta.url));
test('real native reporter rejects malformed expected plans instead of reporting success',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sw-receipt-'));
  t.after(()=>{
    if(path.dirname(path.resolve(dir))!==path.resolve(os.tmpdir())||!path.basename(dir).startsWith('sw-receipt-'))throw Error('Unexpected receipt fixture path');
    fs.rmSync(dir,{recursive:true,force:true});
  });
  const entry=path.join(dir,'actual.test.cjs');fs.writeFileSync(entry,"require('node:test')('actual',()=>require('node:assert/strict').equal(1,1));\n");
  // This child is an independent runner, not a worker in the parent's test stream.
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('MOODY_')&&!key.startsWith('NODE_TEST_')&&key!=='NODE_OPTIONS'));
  const args=['--require',path.join(root,'scripts/ci-process-receipt.cjs'),'--test','--test-reporter='+pathToFileURL(path.join(root,'scripts/ci-test-reporter.cjs')).href,entry];
  const valid=spawnSync(process.execPath,args,{encoding:'utf8',timeout:10000,env:{...env,MOODY_EXPECTED_NODE_CASES:JSON.stringify(['actual.test.cjs::actual'])}});
  assert.equal(valid.status,0,valid.stderr);assert.match(valid.stdout,/test:pass/);
  for(const invalid of ['{}','[1]','null']){
    const result=spawnSync(process.execPath,args,{encoding:'utf8',timeout:10000,env:{...env,MOODY_EXPECTED_NODE_CASES:invalid}});
    assert.notEqual(result.status,0);assert.match(result.stderr,/Invalid expected node cases/);
  }
});


test('typed process execution retains bounded logs, full-byte digests and original error outcomes',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sw-process-'));
 t.after(()=>{if(path.dirname(path.resolve(dir))!==path.resolve(os.tmpdir())||!path.basename(dir).startsWith('sw-process-'))throw Error('Unexpected process fixture cleanup');fs.rmSync(dir,{recursive:true,force:true})});
 const log=path.join(dir,'actual.log'),text='x'.repeat(70000);
 const result=await runCommand(process.execPath,['-e',`process.stdout.write('x'.repeat(70000))`],{cwd:dir,log,quiet:true,execution:'tool'});
 assert.equal(result.status,'PASS');assert.equal(result.exitCode,0);assert.equal(result.outputBytes,Buffer.byteLength(text));
 assert.equal(result.outputSha256,createHash('sha256').update(text).digest('hex'));assert.equal(result.logTruncated,true);
 assert.equal(fs.statSync(log).size,65536);assert.equal(fs.readFileSync(log,'utf8'),text.slice(-65536));
 assert.equal(typeof result.pid,'number');assert.equal(result.assertions,0);assert.equal(result.terminalReceipt?.naturalCompletion,true);
 const missing=await runCommand('moody-nonexistent-typed-command',[],{cwd:dir,log,quiet:true});
 assert.equal(missing.status,'ERROR');assert.equal(missing.reasonCode,'SpawnError');assert.equal(missing.rawStatus,'spawn-error');
});
