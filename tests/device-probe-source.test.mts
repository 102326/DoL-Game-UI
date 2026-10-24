// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
test('offline HTML is reproducible from TS and its checker rejects drift without rewriting input',t=>{
 const artifacts=path.join(root,'tests/artifacts');fs.mkdirSync(artifacts,{recursive:true});
 const dir=fs.mkdtempSync(path.join(artifacts,'probe-source-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 for(const file of ['scripts/build-device-probe.mjs','tools/device-probe.ts','tools/device-probe.template.html','tools/device-probe.html']){const target=path.join(dir,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);}
 const html=path.join(dir,'tools/device-probe.html'),source=path.join(dir,'tools/device-probe.ts'),original=fs.readFileSync(html,'utf8'),typed=fs.readFileSync(source,'utf8');
 const run=(mode:string)=>spawnSync(process.execPath,[path.join(dir,'scripts/build-device-probe.mjs'),mode],{cwd:root,encoding:'utf8'});
 let result=run('--check');assert.equal(result.status,0,result.stderr);assert.equal(fs.readFileSync(html,'utf8'),original);
 fs.appendFileSync(html,'\n<!-- controlled drift -->');result=run('--check');assert.notEqual(result.status,0);assert.match(result.stderr,/differs from its TypeScript source/);assert.ok(fs.readFileSync(html,'utf8').includes('controlled drift'));assert.equal(fs.readFileSync(source,'utf8'),typed);
 result=run('--write');assert.equal(result.status,0,result.stderr);assert.equal(fs.readFileSync(html,'utf8'),original);assert.equal(run('--check').status,0);
 assert.notEqual(run('--unknown').status,0);
});
