import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Isolate the imported policy: a running process must not certify a new policy hash
// while retaining the old module exports in Node's module cache.
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ui42-policy-cache-'));
try {
 for(const name of ['scripts','prototypes/evolution42-ci-c1','project-identity.json','.node-version','tests/device-case-plan.cjs']) {
  const target=path.join(dir,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.cpSync(name,target,{recursive:true});
 }
 const source=path.join(dir,'source');fs.mkdirSync(path.join(source,'framework/official-ui'),{recursive:true});
 const git=(...args:string[])=>execFileSync('git',args,{cwd:source,stdio:'pipe'}).toString().trim();
 git('init','-q');const motion=path.join(source,'framework/official-ui/motion.ts');fs.writeFileSync(motion,'base\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','base');const base=git('rev-parse','HEAD');fs.writeFileSync(motion,'changed\n');
 const script=`import assert from 'node:assert/strict';import fs from 'node:fs';import {candidate,verify} from './prototypes/evolution42-ci-c1/candidate.mts';
 const root=process.argv[1],base=process.argv[2],mode=process.argv[3],plan=candidate(root,base),map='prototypes/evolution42-ci-c1/consumer-map.mts',added='browser.device-layouts.cjs';
 assert(verify(root,base,plan));assert(!plan.standard.includes(added));const original=fs.readFileSync(map,'utf8');
 const changed=original.replace("standard: ['browser.official-game-motion.cjs',", "standard: ['browser.device-layouts.cjs', 'browser.official-game-motion.cjs',");assert.notEqual(changed,original);fs.writeFileSync(map,changed);
 assert(!verify(root,base,plan));
 if(mode==='old'){const stale=candidate(root,base);assert.notEqual(stale.identity.policy,plan.identity.policy);assert(!stale.standard.includes(added));assert(verify(root,base,stale));console.log('OLD_REPRODUCED: new policy hash, old consumers, accepted plan');}
 else {assert.throws(()=>candidate(root,base),/policy changed/i);console.log('NEW_PASS: changed consumer policy rejected');}`;
 const candidateFile=path.join(dir,'prototypes/evolution42-ci-c1/candidate.mts'),mapFile=path.join(dir,'prototypes/evolution42-ci-c1/consumer-map.mts');
 const current=fs.readFileSync(candidateFile,'utf8'),originalMap=fs.readFileSync(mapFile,'utf8');
 const old=current.replace('const loadedPolicy = policyHash();\n','').replace(" const policy = policyHash();\n if (policy !== loadedPolicy) throw Error('policy changed after candidate module loaded');\n",'').replace('const identity = {base, head, policy, committed:', 'const identity = {base, head, policy: policyHash(), committed:');
 assert.notEqual(old,current);fs.writeFileSync(candidateFile,old);
 const run=(mode:string)=>execFileSync(process.execPath,['--input-type=module','-e',script,source,base,mode],{cwd:dir,encoding:'utf8'}).trim();
 const red=run('old');fs.writeFileSync(candidateFile,current);fs.writeFileSync(mapFile,originalMap);const green=run('new');
 const sha256=(name:string)=>createHash('sha256').update(fs.readFileSync(name)).digest('hex');
 const out='tests/artifacts/ui42/ci-c1/policy-cache-result.json';fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify({scope:'isolated cached policy exports; not a full profile or transport',node:process.version,command:'node prototypes/evolution42-ci-c1/policy-cache.test.mts',sourceSha256:Object.fromEntries(['candidate.mts','consumer-map.mts','policy-cache.test.mts'].map(name=>[name,sha256('prototypes/evolution42-ci-c1/'+name)])),red,green},null,2)+'\n');
 console.log(red);console.log(green);console.log('Evidence: '+out);
} finally {fs.rmSync(dir,{recursive:true,force:true})}
