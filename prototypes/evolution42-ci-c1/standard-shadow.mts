import assert from 'node:assert/strict';
import {lstatSync, mkdirSync, openSync, closeSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import catalog from '../../scripts/ci-catalog.cjs';
import {context} from '../../scripts/ci/context.ts';
import {runCommand} from '../../scripts/ci/process.ts';
import {runSuite} from '../../scripts/ci/runner.ts';
import {readReport, writeJson} from '../../scripts/ci/records.ts';
import {verifiedPass} from '../../scripts/ci/result-status.ts';
import {sourceIdentity} from '../../scripts/ci/source.ts';
import {candidate, verify} from './candidate.mts';
import {verifyPreparation} from './standard-evidence.mts';
import {standaloneProblems} from './standalone-evidence.mts';
import type {StandaloneResult} from './standalone-evidence.mts';

const root=path.resolve(fileURLToPath(new URL('../../',import.meta.url))),base=process.argv[2];
assert(base,'Expected independently frozen base');
assert.equal(path.resolve(process.cwd()),root,'Run the copy inside its isolated checkout');
assert(root.includes(path.join('tests','artifacts','ui42','ci-standard')+path.sep),'Only an isolated standard-shadow checkout');
assert(!lstatSync(path.join(root,'node_modules'),{throwIfNoEntry:false})?.isSymbolicLink(),'Fresh npm ci must not touch a shared dependency junction');
process.env.MOODY_EVIDENCE_ID='standard-shadow-'+randomUUID();process.env.MOODY_PROFILE='standard';
const ctx=context(),plan=candidate(root,base);
assert.equal(plan.mode,'review-candidate','Unknown scope must use the existing full profile');
const stages=catalog.stages.filter(s=>plan.standard.includes('stage.'+s.id));
assert.equal(stages.length,plan.standard.filter(id=>id.startsWith('stage.')).length);
const browser=plan.standard.filter(id=>id.startsWith('browser.')).map(id=>id.slice(8));
assert.equal(plan.standard.length,stages.length+browser.length,'This bounded drill supports browser consumers only');
const problems:string[]=[],stageResults:{id:string;status:unknown;reason?:string}[]=[];
let browserReport:Awaited<ReturnType<typeof runSuite>>|undefined;
const standalone:StandaloneResult[]=[];
mkdirSync(path.join(ctx.dir,'orchestration'),{recursive:true});
writeJson(path.join(ctx.dir,'selected-plan.json'),{schema:1,identity:ctx.identity,plan});
try{
 // This positive-path drill stops at a failed preparation; it does not replace the Actions dependency graph.
 for(const stage of stages){
  if(problems.length){stageResults.push({id:stage.id,status:'UNVERIFIED',reason:'PriorPreparationFailed'});continue}
  // The tracked CLI owns bootstrap; wrapping it in runCommand needs generated policy before npm ci.
  const log=openSync(path.join(ctx.dir,'orchestration',stage.id+'.log'),'w');
  let outcome;
  try{outcome=spawnSync(process.execPath,['scripts/test-ci.cjs','stage',stage.id],{cwd:root,stdio:['ignore',log,log],timeout:13*60000})}finally{closeSync(log)}
  const report=readReport(ctx,'stage-'+stage.id+'.json');
  const valid=outcome.status===0&&!outcome.error&&report?.name===stage.id&&verifiedPass(report,'tool');
  stageResults.push({id:stage.id,status:valid?'PASS':'UNVERIFIED',...valid?{}:{reason:'ChildOrStageIncomplete'}});
  if(!valid)problems.push('PreparationIncomplete:'+stage.id);
  if(JSON.stringify(sourceIdentity(root))!==JSON.stringify(ctx.identity.source))problems.push('SourceChangedAfter:'+stage.id);
 }
 if(!problems.length){
  browserReport=await runSuite(ctx,'browser',browser);
  if(browserReport.status!=='PASS'||browserReport.reasonCodes.length||JSON.stringify(browserReport.sourceAfter)!==JSON.stringify(ctx.identity.source))problems.push('SelectedBrowserIncomplete');
  for(const entry of plan.standalone){
   const outcome=await runCommand(process.execPath,[entry],{cwd:root,log:path.join(ctx.dir,'orchestration',path.basename(entry)+'.log'),execution:'contract',requireAssertions:true,timeoutMs:120000,quiet:false});
   standalone.push({entry,outcome});if(!verifiedPass(outcome,'contract'))problems.push('StandaloneIncomplete:'+entry);
  }
 }
}catch(error){problems.push(error instanceof Error?error.message:String(error))}
writeJson(path.join(ctx.dir,'standalone-results.json'),{schema:1,identity:ctx.identity,results:standalone});
const savedStandalone=readReport(ctx,'standalone-results.json');
if(savedStandalone?.schema!==1||JSON.stringify(savedStandalone.identity)!==JSON.stringify(ctx.identity))problems.push('StandaloneReportIdentity');
problems.push(...standaloneProblems(plan.standalone,savedStandalone?.results));
const sourceAfter=sourceIdentity(root);
if(!verify(root,base,plan)||JSON.stringify(sourceAfter)!==JSON.stringify(ctx.identity.source))problems.push('PlanOrSourceChanged');
// A selected result must still be refused by the unchanged full-profile summarizer.
const {full,problems:evidenceProblems}=verifyPreparation(ctx,stages.map(s=>s.id));problems.push(...evidenceProblems);
for(const stage of stageResults)if(evidenceProblems.includes('PreparationEvidenceIncomplete:'+stage.id)){stage.status='UNVERIFIED';stage.reason='NativeEvidenceIncomplete'}
assert.notEqual(full.status,'PASS','A subset cannot establish the complete standard profile');
writeJson(path.join(ctx.dir,'standard-shadow.json'),{
 schema:1,identity:ctx.identity,scope:'Five actual preparation stages plus reviewed browser consumers; not a full standard gate',
 status:problems.length?'UNVERIFIED':'PASS',plan,stages:stageResults,browser:browserReport,standalone,sourceAfter,problems,
 fullProfileStatus:full.status,fullProfileMissing:full.results.filter(r=>r.status!=='PASS').map(r=>r.name),
 preparationPolicy:'fresh npm ci; native stages and budgets; stop on preparation failure, not an Actions scheduler replacement'
});
console.log(JSON.stringify({status:problems.length?'UNVERIFIED':'PASS',dir:ctx.dir,problems,fullProfileStatus:full.status}));
if(problems.length)process.exitCode=1;
