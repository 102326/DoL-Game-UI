// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
const run=`checkpoint-boundary-${process.pid}-${Date.now()}`;
const dir=path.join(root,'tests/artifacts/ci',run),entry='shop-early-api.test.cjs';
const fixture=path.join(dir,'fixtures',entry),file=path.join(fixture,'checkpoints.json');
const identity={run,source:'controlled'};
function execute(overrides:NodeJS.ProcessEnv={}){
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('MOODY_')));
  return spawnSync(process.execPath,['--experimental-strip-types','-e',"require('./scripts/ci-checkpoints.cjs').checkpoint('default-off')"],{
    cwd:root,env:{...env,MOODY_CHECK_NAME:entry,MOODY_EVIDENCE_ID:run,MOODY_EVIDENCE_DIR:fixture,...overrides},encoding:'utf8',timeout:10000
  });
}
test('checkpoint writer preserves identity and appends only in its declared directory',()=>{
  fs.mkdirSync(fixture,{recursive:true});fs.writeFileSync(path.join(dir,'identity.json'),JSON.stringify({identity}));
  try{
    const first=execute();assert.equal(first.status,0,first.stderr);
    assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),{schema:1,identity,entry,reached:['default-off']});
    const value={schema:1,identity,entry,reached:['existing'],future:{preserved:true}};
    fs.writeFileSync(file,JSON.stringify(value));const second=execute();assert.equal(second.status,0,second.stderr);
    assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),{...value,reached:['existing','default-off']});
    for(const [overrides,reason] of [[{MOODY_EVIDENCE_ID:'../escape'},'Checkpoint run context missing'],[{MOODY_EVIDENCE_DIR:dir},'Checkpoint directory mismatch']] as const){
      const before=fs.readFileSync(file,'utf8'),result=execute(overrides);assert.notEqual(result.status,0);assert.ok(result.stderr.includes(reason),result.stderr);assert.equal(fs.readFileSync(file,'utf8'),before);
    }
  }finally{fs.rmSync(file,{force:true});fs.rmSync(path.join(dir,'identity.json'),{force:true});}
});
test('checkpoint writer rejects stale identities and malformed reports without overwriting them',()=>{
  fs.mkdirSync(fixture,{recursive:true});fs.writeFileSync(path.join(dir,'identity.json'),JSON.stringify({identity}));
  try{
    for(const invalid of [null,{}, {schema:1,identity,entry,reached:[1]}, {schema:1,identity,entry:'other',reached:[]}, {schema:1,identity:{source:'old'},entry,reached:[]}]){
      const before=JSON.stringify(invalid);fs.writeFileSync(file,before);const result=execute();assert.notEqual(result.status,0);assert.match(result.stderr,/Invalid checkpoints|Stale checkpoints/);assert.equal(fs.readFileSync(file,'utf8'),before);
    }
    fs.writeFileSync(path.join(dir,'identity.json'),'{}');const before=fs.readFileSync(file,'utf8');const result=execute();assert.notEqual(result.status,0);assert.match(result.stderr,/Checkpoint identity missing/);assert.equal(fs.readFileSync(file,'utf8'),before);
  }finally{fs.rmSync(file,{force:true});fs.rmSync(path.join(dir,'identity.json'),{force:true});}
});
