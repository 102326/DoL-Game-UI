// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {context,playwrightVersion} from '../scripts/ci/context.ts';

test('run context validates prior JSON, keeps the nonce and bounds the finalization exception',t=>{
 const keys=['MOODY_EVIDENCE_ID','MOODY_PROFILE','MOODY_DEVICE_DEPTH','GITHUB_EVENT_PATH','GITHUB_ACTIONS'],saved=keys.map(key=>[key,process.env[key]] as const);
 t.after(()=>{for(const [key,value]of saved){if(value===undefined)delete process.env[key];else process.env[key]=value}});
 const id='ts-context-'+randomUUID();process.env.MOODY_EVIDENCE_ID=id;process.env.MOODY_PROFILE='standard';process.env.MOODY_DEVICE_DEPTH='standard';delete process.env.GITHUB_EVENT_PATH;delete process.env.GITHUB_ACTIONS;
 const initial=context(),dir=initial.dir,file=path.join(dir,'identity.json');
 t.after(()=>{if(path.basename(dir)!==id||path.basename(path.dirname(dir))!=='ci'||path.basename(path.dirname(path.dirname(dir)))!=='artifacts')throw Error('Unexpected context fixture cleanup');fs.rmSync(dir,{recursive:true,force:true})});
 assert.deepEqual(context().identity,initial.identity);assert.match(initial.identity.nonce,/^[a-f0-9]{32}$/);
 const envelope={schema:1,identity:initial.identity};
 const event=path.join(dir,'event.json');process.env.GITHUB_EVENT_PATH=event;
 for(const value of [null,[],{pull_request:{head:{sha:'head'}}},{pull_request:{head:{sha:1},base:{sha:'base'}}}]){fs.writeFileSync(event,JSON.stringify(value));assert.throws(()=>context(),/Invalid workflow event|Invalid pull request event/)}
 const pr={head:'head',base:'base',merge:process.env.GITHUB_SHA};fs.writeFileSync(event,JSON.stringify({pull_request:{head:{sha:pr.head},base:{sha:pr.base}}}));fs.writeFileSync(file,JSON.stringify({...envelope,identity:{...initial.identity,pr}}));assert.deepEqual(context().identity.pr,pr);
 delete process.env.GITHUB_EVENT_PATH;fs.writeFileSync(file,JSON.stringify(envelope));
 for(const invalid of [null,[],{}, {schema:2,identity:initial.identity},{schema:1,identity:null},{schema:1,identity:{...initial.identity,nonce:{wrong:true}}},{schema:1,identity:{...initial.identity,nonce:'not-a-nonce'}},{schema:1,identity:{...initial.identity,source:{...initial.identity.source,tree:''}}},{schema:1,identity:{...initial.identity,source:{...initial.identity.source,contentSha256:'invalid'}}},{schema:1,identity:{...initial.identity,source:{...initial.identity.source,dirty:'false'}}},{schema:1,identity:{...initial.identity,environment:{wrong:true}}}]){
  const text=JSON.stringify(invalid);fs.writeFileSync(file,text);assert.throws(()=>context(),/Invalid prior identity|Run identity changed/);assert.equal(fs.readFileSync(file,'utf8'),text,'rejecting a prior must not replace it');
 }
 const previous={...initial.identity,source:{...initial.identity.source,contentSha256:'0'.repeat(64)}};fs.writeFileSync(file,JSON.stringify({...envelope,identity:previous}));
 assert.throws(()=>context(),/Run identity changed/);assert.deepEqual(context({allowSourceDrift:true}).identity,previous);
 fs.writeFileSync(file,JSON.stringify({...envelope,identity:{...previous,run:{...previous.run,attempt:'other'}}}));assert.throws(()=>context({allowSourceDrift:true}),/Run identity changed/,'finalization cannot excuse changed run anchors');
});
test('tool version input is checked without asserting a package-lock interface',()=>{
 assert.equal(playwrightVersion({packages:{'node_modules/playwright':{version:'1.63.0',future:true}},future:true}),'1.63.0');
 for(const input of [null,[],{}, {packages:[]},{packages:{'node_modules/playwright':null}},{packages:{'node_modules/playwright':{version:26}}}])assert.throws(()=>playwrightVersion(input),/Invalid Playwright lock version/);
});
