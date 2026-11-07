import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runCommand} from '../../scripts/ci/process.ts';
import {sourceIdentity} from '../../scripts/ci/source.ts';
import {readReport,writeJson} from '../../scripts/ci/records.ts';
import {standaloneProblems} from './standalone-evidence.mts';

const root=fileURLToPath(new URL('../../',import.meta.url));
const parent=path.join(root,'tests/artifacts/ui42/ci-c1/standalone-evidence');mkdirSync(parent,{recursive:true});
const dir=mkdtempSync(path.join(parent,'run-')),file=path.join(dir,'rows.json');
const real=process.argv.includes('--material'),entry=real?'tests/ui41-material.cjs':'controlled-inline-assertion';
const source=sourceIdentity(root);
const outcome=await runCommand(process.execPath,real?[entry]:['-e',"require('node:assert/strict').equal(2+2,4)"],{cwd:root,log:path.join(dir,'contract.log'),execution:'contract',requireAssertions:true,quiet:true});
const rows=[{entry,outcome}];
const identity={source,run:{id:path.basename(dir),attempt:'local'}},ctx={dir,identity};
writeJson(path.join(dir,'standalone-results.json'),{schema:1,identity,results:rows});
assert.deepEqual(standaloneProblems([entry],readReport(ctx,'standalone-results.json')?.results),[]);
assert.equal(readReport({...ctx,identity:{...identity,run:{...identity.run,attempt:'foreign'}}},'standalone-results.json'),null,'Foreign run envelope must not hydrate');
writeFileSync(file,JSON.stringify(rows));
const read=():unknown=>JSON.parse(readFileSync(file,'utf8'));
assert.deepEqual(standaloneProblems([entry],read()),[],'Actual process receipt survives disk roundtrip');
// Reproduce the prior serializer without rerunning its five costly preparation stages.
const legacy=rows.map(({entry,outcome})=>({entry,status:outcome.status}));
assert(standaloneProblems([entry],legacy).includes('StandaloneIncomplete:'+entry),'Old status-only representation loses verifiable completion');
const cases:{id:string;mutate:(value:typeof rows)=>unknown;reason:string}[]=[
 {id:'missing',mutate:()=>[],reason:'StandaloneResultSetMismatch'},
 {id:'duplicate',mutate:v=>[...v,...v],reason:'StandaloneResultSetMismatch'},
 {id:'foreign-entry',mutate:v=>{v[0]!.entry='foreign';return v},reason:'StandaloneResultSetMismatch'},
 {id:'missing-receipt',mutate:v=>{v[0]!.outcome.terminalReceipt=null;return v},reason:'StandaloneReceiptIdentity:'+entry},
 {id:'foreign-execution',mutate:v=>{v[0]!.outcome.terminalReceipt!.executionId='foreign';return v},reason:'StandaloneReceiptIdentity:'+entry},
 {id:'foreign-pid',mutate:v=>{v[0]!.outcome.terminalReceipt!.pid=-1;return v},reason:'StandaloneReceiptIdentity:'+entry},
 {id:'early-exit',mutate:v=>{v[0]!.outcome.terminalReceipt!.naturalCompletion=false;return v},reason:'StandaloneNoAssertions:'+entry},
 {id:'zero-assertions',mutate:v=>{v[0]!.outcome.terminalReceipt!.assertions=0;v[0]!.outcome.terminalReceipt!.nodeTests=[];return v},reason:'StandaloneNoAssertions:'+entry},
 {id:'cancelled',mutate:v=>{v[0]!.outcome.rawStatus='cancelled';return v},reason:'StandaloneIncomplete:'+entry},
 {id:'timeout',mutate:v=>{v[0]!.outcome.rawStatus='timeout';return v},reason:'StandaloneIncomplete:'+entry},
 {id:'failed',mutate:v=>{v[0]!.outcome.status='FAIL';return v},reason:'StandaloneIncomplete:'+entry},
 {id:'contradiction',mutate:v=>{v[0]!.outcome.contradictions=['TerminalFailureWithExitZero'];return v},reason:'StandaloneIncomplete:'+entry}
];
const results=cases.map(({id,mutate,reason})=>{
 writeFileSync(file,JSON.stringify(mutate(structuredClone(rows))));
 const problems=standaloneProblems([entry],read());assert(problems.includes(reason),id+': '+problems.join(','));return {id,problems};
});
writeFileSync(file,JSON.stringify(rows));assert.deepEqual(standaloneProblems([entry],read()),[]);
assert.deepEqual(sourceIdentity(root),source,'Source must remain unchanged during execution/readback');
writeFileSync(path.join(dir,'result.json'),JSON.stringify({schema:1,status:'PASS',scope:real?'actual standalone material receipt readback; not a full standard execution':'controlled process receipt readback',source,entry,outcome,foreignEnvelopeRejected:true,legacyProblems:standaloneProblems([entry],legacy),results},null,2));
console.log(JSON.stringify({status:'PASS',entry,negativeCases:results.length,legacyRejected:true,dir}));
