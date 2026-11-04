import {createHash,randomUUID} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import catalog from '../../scripts/ci-catalog.cjs';
import {candidate,verify} from './candidate.mts';
import {runResearch} from '../../scripts/ci/research-runner.ts';
import {sourceIdentity} from '../../scripts/ci/source.ts';
import {verifiedPass} from '../../scripts/ci/result-status.ts';
import {entryCaseProblems,entryDeclaration} from '../../scripts/ci/lock.ts';
import {safeFile} from '../../scripts/ci/records.ts';
import {dependenciesFor,familyFor} from '../../scripts/ci/research-families.ts';
import {caseIds} from '../../scripts/ci/research-reports.ts';
import {context} from '../../scripts/ci/context.ts';
import {runSuite} from '../../scripts/ci/runner.ts';
import {runCommand} from '../../scripts/ci/process.ts';
import {overall} from '../../scripts/ci/contracts.ts';
import {writeSuite,checkpointEvidence,readReport} from '../../scripts/ci/records.ts';
import {layoutEvidence} from '../../scripts/ci/suite-evidence.ts';
import type {Context} from '../../scripts/ci/upload.ts';

type Plan=ReturnType<typeof candidate>;
type Check=typeof catalog.researchPlan[number];
const hash=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);

/** A consumer drill only; the full standard/research gates remain independent. */
export function checksFor(plan:Plan):Check[]{
 if(plan.mode!=='review-candidate')throw Error('Full-profile fallback requires the existing full entry');
 const ids=new Set(plan.research.map(id=>id.replace(/^research\./,'')));
 const checks:Check[]=catalog.researchPlan.filter(c=>ids.has(c.id));
 if(checks.length!==ids.size)throw Error('Unknown research selection');
 // Also execute the extra standard/standalone consumers, without pretending to run their suite stages.
 const paths=new Set(checks.flatMap(c=>c.args.filter(a=>a.startsWith('tests/'))));
 for(const entry of [...plan.standard.filter(id=>id.startsWith('browser.')).map(id=>'tests/'+id.slice(8)),...plan.standalone]){
  if(paths.has(entry))continue;
  const known=catalog.catalogFor('standard').contracts.some(c=>c.entry.includes(entry));
  if(!known&&!plan.standalone.includes(entry))throw Error('Unreviewed standalone');
  checks.push({id:'shadow-'+path.basename(entry).replace(/\.cjs$/,''),command:process.execPath,args:[entry],execution:'contract'});paths.add(entry);
 }
 const selected=new Set(checks.map(c=>c.id)),seen=new Set<string>();
 for(const check of checks){for(const dep of dependenciesFor(check.id))if(!selected.has(dep)||!seen.has(dep))throw Error('Missing or unordered prerequisite: '+check.id+' -> '+dep);seen.add(check.id)}
 return checks;
}

export function verifyShadow(ctx:Context,base:string,plan:Plan,value:unknown):string[]{
 const problems:string[]=[];
 if(!verify(ctx.root,base,plan))problems.push('PlanOrSourceChanged');
 if(!record(value))return [...problems,'InvalidReport'];
 if(value.schema!==1||value.suite!=='research'||value.scope!=='selected-contract-only'||value.status!=='PASS'||value.reasonCode!==undefined)problems.push('ReportEnvelopeMismatch');
 const checks=checksFor(plan),expected=checks.map(c=>c.id);
 const researchNames=new Set(catalog.researchPlan.map(c=>c.id)),researchChecks=checks.filter(c=>researchNames.has(c.id));
 for(const family of new Set(researchChecks.map(c=>familyFor(c.id)))){
  const phase=readReport(ctx,'families/'+family+'.json'),names=researchChecks.filter(c=>familyFor(c.id)===family).map(c=>c.id);
  if(!phase||phase.status!=='PASS'||!same(phase.sourceAfter,ctx.identity.source)||!same(phase.expected,names))problems.push('StageResearchIncomplete:'+family);
 }
 const standardNames=checks.filter(c=>!researchNames.has(c.id)&&c.args[0]&&catalog.suites.browser.includes(path.basename(c.args[0]))).map(c=>path.basename(c.args[0]!));
 if(standardNames.length){const phase=readReport(ctx,'browser.json');if(!phase||phase.status!=='PASS'||!same(phase.sourceAfter,ctx.identity.source)||!same(phase.expected,standardNames)||!Array.isArray(phase.reasonCodes)||phase.reasonCodes.length)problems.push('StageBrowserIncomplete')}
 if(!same(value.identity,ctx.identity)||!same(value.sourceAfter,ctx.identity.source)||!same(sourceIdentity(ctx.root),ctx.identity.source))problems.push('SourceOrRunMismatch');
 if(!same(value.expected,expected)||!Array.isArray(value.results))return [...problems,'ExpectedMismatch'];
 const rows=value.results;
 if(!same(rows.map(r=>record(r)?r.name:null),expected))problems.push('ResultSetMismatch');
 for(const check of checks){
  const result=rows.find(r=>record(r)&&r.name===check.id);
  if(!record(result)||!verifiedPass(result,check.execution||'tool')){problems.push('Incomplete:'+check.id);continue}
  const entry=check.args.find(a=>/\.cjs$/.test(a));
  if(check.execution==='contract'&&entry&&entryDeclaration(path.basename(entry))&&entryCaseProblems(path.basename(entry),result).length)problems.push('CaseContract:'+check.id);
  if(entry&&!checkpointEvidence(ctx,path.basename(entry)))problems.push('MissingCheckpoint:'+check.id);
  if(entry&&path.basename(entry)==='device-layouts.cjs'&&!layoutEvidence(ctx))problems.push('MissingLayoutCoverage');
  if(check.execution==='contract'){
   const receipt=result.terminalReceipt;
   if(!record(receipt)||receipt.schema!==1||typeof result.executionId!=='string'||!result.executionId||receipt.executionId!==result.executionId||!Number.isSafeInteger(result.pid)||receipt.pid!==result.pid)problems.push('ReceiptIdentity:'+check.id);
   if(!record(receipt)||receipt.naturalCompletion!==true||!(typeof receipt.assertions==='number'&&receipt.assertions>0||Array.isArray(receipt.nodeTests)&&receipt.nodeTests.length>0))problems.push('NoAssertions:'+check.id);
  }
  if(!Array.isArray(result.artifacts)){problems.push('MissingArtifacts:'+check.id);continue}
  if(check.report&&result.artifacts.length!==1)problems.push('RequiredReport:'+check.id);
  for(const a of result.artifacts)try{
   if(!record(a)||typeof a.file!=='string'||typeof a.sha256!=='string')throw Error('artifact');
   const bytes=readFileSync(safeFile(ctx.dir,a.file));if(hash(bytes)!==a.sha256)throw Error('artifact hash');
   if(check.report&&!same(result.caseIds,caseIds(check.report,JSON.parse(bytes.toString('utf8')),ctx)))throw Error('artifact cases');
  }catch{problems.push('ArtifactMismatch:'+check.id)}
 }
 return problems;
}

export async function executeShadow(root:string,base:string,out:string){
 const plan=candidate(root,base),checks=checksFor(plan);
 process.env.MOODY_EVIDENCE_ID='shadow-'+randomUUID();process.env.MOODY_PROFILE='research';
 const ctx=context();if(path.resolve(ctx.root)!==path.resolve(root))throw Error('Execute shadow from its own frozen checkout');
 if(!verify(root,base,plan))throw Error('Unstable plan inputs');
 mkdirSync(out,{recursive:true});writeFileSync(path.join(out,'trusted-plan.json'),JSON.stringify(plan,null,2));
 const researchNames=new Set(catalog.researchPlan.map(c=>c.id));
 const report=await runResearch(ctx,{checks:checks.filter(c=>researchNames.has(c.id)),quiet:false});
 const phases=[report.status];if(!same(report.sourceAfter,ctx.identity.source)||report.reasonCode)phases.push('UNVERIFIED');
 const extras=checks.filter(c=>!researchNames.has(c.id));
 const standard=extras.filter(c=>c.args[0]&&catalog.suites.browser.includes(path.basename(c.args[0])));
 if(standard.length){
  const suite=await runSuite(ctx,'browser',standard.map(c=>path.basename(c.args[0]!)));
  phases.push(suite.status);if(!same(suite.sourceAfter,ctx.identity.source)||suite.reasonCodes.length)phases.push('UNVERIFIED');
  for(const check of standard){const row=suite.results.find(r=>r.name===path.basename(check.args[0]!));if(!row)throw Error('Missing standard result');
   const files=row.evidence;if(!Array.isArray(files)||!files.every((f:unknown):f is string=>typeof f==='string'))throw Error('Invalid standard evidence');
   report.results.push({...row,name:check.id,caseIds:[],artifacts:files.map(file=>({file,sha256:hash(readFileSync(safeFile(ctx.dir,file)))}))});
  }
 }
 for(const check of extras.filter(c=>!standard.includes(c))){
  const row=await runCommand(check.command,check.args,{cwd:root,log:path.join(ctx.dir,'standalone',check.id+'.log'),requireAssertions:true,execution:'contract'});
  report.results.push({...row,name:check.id,caseIds:[],artifacts:[]});
 }
 report.expected=checks.map(c=>c.id);report.status=overall([...phases,...report.results.map(r=>r.status)]);report.sourceAfter=sourceIdentity(root);writeSuite(ctx,report);
 const problems=verifyShadow(ctx,base,plan,report);
 writeFileSync(path.join(out,'shadow-result.json'),JSON.stringify({scope:'bounded consumer drill; not a standard/research gate',ctx,plan,report,problems},null,2));
 return {ctx,plan,report,problems};
}
