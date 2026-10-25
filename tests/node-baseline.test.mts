// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {minimumNode,supportsNode} from '../scripts/check-node.mts';

test('Node 26 Only accepts the patch baseline and rejects other majors or prereleases',()=>{
  assert.equal(minimumNode,'26.12.1');
  for(const version of ['26.12.1','26.12.2','26.13.0'])assert.equal(supportsNode(version),true,version);
  for(const version of ['24.18.0','25.0.0','26.0.0','26.12.0','27.0.0','26.12.1-rc.1','26.12.NaN','26.9007199254740992.0'])assert.equal(supportsNode(version),false,version);
  assert.equal(supportsNode(process.versions.node),true);
});
test('native TS and MTS plus compiled CTS interoperate in an independent Node process',()=>{
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('MOODY_')&&!key.startsWith('NODE_TEST_')&&key!=='NODE_OPTIONS'));
  const source="const a=require('node:assert/strict'),c=require('./scripts/ci-cases.cjs'),d=require('./scripts/ci/contracts.ts');a.equal(d.digest('x').length,64);c.runCase('interop',()=>42).then(v=>{a.equal(v,42);return import('./scripts/check-node.mts')}).then(m=>{a.equal(m.supportsNode(process.versions.node),true);console.log('PASS TS/MTS/CTS')}).catch(e=>{console.error(e);process.exitCode=1})";
  const result=spawnSync(process.execPath,['-e',source],{encoding:'utf8',env,timeout:10000});
  assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/PASS TS\/MTS\/CTS/);
});
