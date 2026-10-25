// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import metrics from '../scripts/ci-metrics.cjs';

test('saved run metrics retain failures, metadata grouping and qualified percentile samples',()=>{
 const make=(conclusion:string)=>metrics.parseRun({id:10,attempt:2,head_sha:'source',event:'push',moodyMetadata:{profile:'standard',depth:'standard',catalog:'locked',cache:false},jobs:[{name:'validate',conclusion,startedAt:'2026-01-01T00:00:00Z',completedAt:'2026-01-01T00:00:02Z',steps:[{name:'check',conclusion,startedAt:'2026-01-01T00:00:00Z',completedAt:'2026-01-01T00:00:01Z'}]}]});
 const report=metrics.measure([...Array.from({length:20},()=>make('success')),make('failure')]),group=report.groups['validate|standard|standard|locked|false'];
 assert.ok(group);assert.equal(report.rows.length,21);assert.equal(report.rows.at(-1)?.status,'failure');assert.equal(group.samples,21);assert.equal(group.successfulSamples,20);assert.equal(group.p95,2000);assert.equal(report.rows[0]?.steps[0]?.milliseconds,1000);
 assert.equal(metrics.measure([make('success')]).groups['validate|standard|standard|locked|false']?.p95,null);
 const partial=metrics.parseRun({jobs:[{name:'validate',conclusion:null,startedAt:null,completedAt:'0001-01-01',steps:null}],moodyMetadata:null});assert.equal(metrics.measure([partial]).rows[0]?.jobMs,null);assert.deepEqual(metrics.measure([metrics.parseRun({jobs:null})]).rows,[]);
});
test('malformed saved metrics are rejected and the real CJS CLI reads UTF-8 JSON',t=>{
 for(const value of [null,[],{jobs:{}},{jobs:[null]},{jobs:[{steps:[{completedAt:42}]}]},{headSha:12},{moodyMetadata:[]},{attempt:1.5}])assert.throws(()=>metrics.parseRun(value),/Invalid saved run metrics/);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'metrics 中文 '));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'run.json');fs.writeFileSync(file,JSON.stringify({id:1,jobs:[{name:'验证',conclusion:'failure'}]}));
 const result=spawnSync(process.execPath,['scripts/ci-metrics.cjs',file],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),JSON.stringify(metrics.measure([metrics.parseRun(JSON.parse(fs.readFileSync(file,'utf8')))]),null,2));
});
