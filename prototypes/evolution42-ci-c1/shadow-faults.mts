import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';import path from 'node:path';
import {fileURLToPath} from 'node:url';
import catalog from '../../scripts/ci-catalog.cjs';
import {candidate} from './candidate.mts';
import {checksFor,verifyShadow} from './shadow.mts';
import {sourceIdentity} from '../../scripts/ci/source.ts';
import {runCommand} from '../../scripts/ci/process.ts';
import {safeFile} from '../../scripts/ci/records.ts';
import type {Context} from '../../scripts/ci/upload.ts';
const original=path.resolve(fileURLToPath(new URL('../../',import.meta.url))),root=path.resolve(process.argv[2]||'');
assert(root.startsWith(path.join(original,'tests/artifacts/ui42/ci-shadow')+path.sep),'only owned snapshot');
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
function object(v:unknown){if(!record(v))throw Error('Invalid shadow object');return v}
function string(v:unknown){if(typeof v!=='string'||!v)throw Error('Invalid shadow string');return v}
const provenance=object(JSON.parse(fs.readFileSync(path.join(root,'../provenance.json'),'utf8'))),base=string(provenance.base);
const out=path.join(root,'tests/artifacts/consumer-shadow'),saved=object(JSON.parse(fs.readFileSync(path.join(out,'shadow-result.json'),'utf8'))),oldCtx=object(saved.ctx),identity=object(oldCtx.identity),run=object(identity.run);
assert.equal(string(provenance.head),sourceIdentity(root).head);
const runId=string(run.id);assert(/^[a-zA-Z0-9_-]{1,100}$/.test(runId));
const reportDir=path.join(root,'tests/artifacts/ci',runId),anchor=object(object(JSON.parse(fs.readFileSync(path.join(reportDir,'identity.json'),'utf8'))).identity);
const ctx:Context={root,dir:reportDir,identity:{...anchor,projectId:catalog.projectId,source:sourceIdentity(root),run:{...object(anchor.run),id:runId,attempt:string(object(anchor.run).attempt)},profile:'research',catalog:catalog.catalogIdentity('research'),nonce:string(anchor.nonce)}};
const plan=candidate(root,base),report=saved.report,checks=checksFor(plan);
assert.deepEqual(verifyShadow(ctx,base,plan,report),[],'normal real execution must validate before fault injection');
const faults=path.join(reportDir,'faults-'+Date.now());fs.mkdirSync(faults,{recursive:true});
const variants=['N1-missing-consumer','N2-missing-prerequisite','N3-wrong-base','N3-wrong-attempt','N4-matching-plan-result-deletion','N5-zero-assertions-exit-zero','N5-real-browser-pageerror-exit-zero','N6-missing-report','N6-cancelled-process','N6-timed-out-process','N3-receipt-execution-id','N3-receipt-pid','N4-contradictory-top-status','N6-missing-layout-coverage','N3-observed-stage-source-drift'];
fs.writeFileSync(path.join(faults,'frozen-variants.json'),JSON.stringify({variants,sourceSha256:createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'),base,head:provenance.head},null,2));
const results:{id:string;observed:unknown}[]=[];
function rejected(id:string,p:ReturnType<typeof candidate>,r:unknown,b=base,c=ctx){let reasons:string[];try{reasons=verifyShadow(c,b,p,r)}catch(e){reasons=[String(e)]}assert(reasons.length>0,id+' escaped');results.push({id,observed:reasons});return reasons}
const missing=plan.research.filter(id=>id!=='research.evolution-owner-resources');rejected(variants[0]!,{...plan,research:missing},report);
rejected(variants[1]!,{...plan,research:plan.research.filter(id=>id!=='research.framework-build')},report);
rejected(variants[2]!,plan,report,'HEAD');
rejected(variants[3]!,plan,report,base,{...ctx,identity:{...ctx.identity,run:{...ctx.identity.run,attempt:'wrong'}}});
const edited=structuredClone(object(report));if(!Array.isArray(edited.results)||!Array.isArray(edited.expected))throw Error('Invalid original rows');edited.results=edited.results.filter(r=>object(r).name!=='evolution-owner-resources');edited.expected=edited.expected.filter(id=>id!=='evolution-owner-resources');rejected(variants[4]!,{...plan,research:missing},edited);
async function processFault(id:string,code:string,options:{timeoutMs?:number;signal?:AbortSignal}={}){
 const outcome=await runCommand(process.execPath,['-e',code],{cwd:root,log:path.join(faults,id+'.log'),execution:'contract',requireAssertions:true,quiet:true,...options});
 assert.notEqual(outcome.status,'PASS',id+' escaped');results.push({id,observed:outcome});return outcome;
}
const zero=await processFault(variants[5]!, 'void 0');assert.equal(zero.exitCode,0);assert.equal(zero.reasonCode,'NoAssertions');
const pageError=await processFault(variants[6]!,`const assert=require('node:assert/strict'),{chromium}=require('playwright'),receipt=require('./scripts/ci-process-receipt.cjs');(async()=>{const b=await chromium.launch({headless:true}),p=await b.newPage();p.on('pageerror',e=>receipt.terminalFailure(e));await p.setContent('<script>throw Error("ShadowPageError")</script>');assert.ok(true);await b.close()})().catch(e=>{console.error(e);process.exitCode=1})`);assert.equal(pageError.exitCode,0);assert(pageError.contradictions.includes('TerminalFailureWithExitZero'));
const rows=object(report).results;if(!Array.isArray(rows))throw Error('Invalid original results');const withArtifact=rows.map(object).find(r=>Array.isArray(r.artifacts)&&r.artifacts.length);
if(!withArtifact||!Array.isArray(withArtifact.artifacts))throw Error('Real report artifact required');const artifact=object(withArtifact.artifacts[0]),file=safeFile(reportDir,artifact.file),held=file+'.held';
fs.renameSync(file,held);try{rejected(variants[7]!,plan,report)}finally{fs.renameSync(held,file)}
const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),150);try{const cancelled=await processFault(variants[8]!,'setTimeout(()=>{},10000)',{signal:controller.signal});assert.equal(cancelled.status,'CANCELLED')}finally{clearTimeout(timer)}
const timed=await processFault(variants[9]!,'setTimeout(()=>{},10000)',{timeoutMs:150});assert.equal(timed.rawStatus,'timeout');
for(const [index,key,value]of [[10,'executionId','forged'],[11,'pid',-1]] as const){const changed=structuredClone(object(report));if(!Array.isArray(changed.results))throw Error('Invalid real results');const row=changed.results.map(object).find(r=>r.execution==='contract');if(!row)throw Error('Real contract receipt required');row[key]=value;rejected(variants[index]!,plan,changed)}
rejected(variants[12]!,plan,{...object(report),status:'FAIL'});
const layout=safeFile(reportDir,'fixtures/device-layouts.cjs/layout-report.json'),layoutHeld=layout+'.held';fs.renameSync(layout,layoutHeld);try{assert(rejected(variants[13]!,plan,report).includes('MissingLayoutCoverage'))}finally{fs.renameSync(layoutHeld,layout)}
const browserFile=safeFile(reportDir,'browser.json'),browserBytes=fs.readFileSync(browserFile),browser=object(JSON.parse(browserBytes.toString('utf8')));fs.writeFileSync(browserFile,JSON.stringify({...browser,status:'UNVERIFIED',reasonCodes:['SourceChangedDuringExecution'],sourceAfter:{head:'changed-then-restored'}}));try{assert(rejected(variants[14]!,plan,report).includes('StageBrowserIncomplete'))}finally{fs.writeFileSync(browserFile,browserBytes)}
assert.deepEqual(results.map(r=>r.id),variants);assert.deepEqual(verifyShadow(ctx,base,plan,report),[],'original report must be usable after faults restore');
fs.writeFileSync(path.join(faults,'result.json'),JSON.stringify({scope:'controlled local negative variants; not remote gate certification',variants,selectedChecks:checks.map(c=>c.id),results,status:'PASS'},null,2));
console.log('PASS real consumer execution and'+variants.length+' pre-frozen negative variants: '+faults);
