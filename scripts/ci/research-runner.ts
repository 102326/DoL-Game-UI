import {runCommand} from './process.ts';
import path from 'node:path';
import {createRequire} from 'node:module';
import {canSchedule,overall} from './contracts.ts';
import {observeSource} from './source.ts';
import type {Status} from './contracts.ts';
import {entryDeclaration,entryCaseProblems} from './lock.ts';
import {familyFor,maturityFor,dependenciesFor,familyReports} from './research-families.ts';
import {writeSuite,writeJson} from './records.ts';

const require=createRequire(import.meta.url);
interface Context {root:string;dir:string;identity:{source:unknown;[key:string]:unknown}}
interface Check {id:string;command:string;args:string[];execution?:'tool'|'contract';report?:unknown}
interface Result {name:string;status:Status;rawStatus:string;caseIds:string[];artifacts:unknown[];[key:string]:unknown}
interface Report {schema:1;identity:Context['identity'];suite:string;expected:string[];status:Status;sourceAfter:unknown;scope:string;results:Result[];reasonCode?:string}
export async function runResearch(ctx:Context,{signal,quiet=false,checks}:{signal?:AbortSignal;quiet?:boolean;checks?:Check[]}={}):Promise<Report>{
 const e=require('../ci-evidence.cjs'),r=require('../ci-research.cjs'),plan=r.plan as Check[],selected=checks||plan;
 if(!selected.length)throw Error('Empty research selection');
 const budget=Number(process.env.MOODY_RESEARCH_BUDGET_MS||15*60000);if(!Number.isFinite(budget)||budget<=0)throw Error('Invalid research budget');
 const report:Report={schema:1,identity:ctx.identity,suite:'research',expected:selected.map(c=>c.id),status:'UNVERIFIED',sourceAfter:ctx.identity.source,scope:selected===plan?'complete-profile':'selected-contract-only',results:[]};
 const statuses:Record<string,Status>={},selectedIds=new Set(selected.map(c=>c.id)),deadline=Date.now()+budget;
 for(const check of selected){
  const dependencies=dependenciesFor(check.id).filter(id=>selectedIds.has(id));
  const result:Result={name:check.id,family:familyFor(check.id),maturity:maturityFor(check.id),dependencies,status:signal?.aborted?'CANCELLED':'UNVERIFIED',rawStatus:'not-run',caseIds:[],artifacts:[]};
  if(!signal?.aborted&&Date.now()<deadline&&canSchedule(dependencies,statuses)){
   const before=new Map((r.reportsFor(ctx,check.report) as string[]).map(file=>[file,r.stamp(file)]));
   const env={...process.env,MOODY_CHECK_NAME:check.args[0]?.split('/').at(-1),MOODY_EVIDENCE_DIR:path.join(ctx.dir,'fixtures',check.args[0]?.split('/').at(-1)||check.id)};
   const outcome=await runCommand(check.command,check.args,{cwd:ctx.root,log:path.join(ctx.dir,'research',check.id+'.log'),timeoutMs:Math.min(120000,Math.max(1,deadline-Date.now())),signal,env,quiet,execution:check.execution||'tool',requireAssertions:check.execution==='contract'});
   Object.assign(result,outcome);
   if(e.verifiedPass(result))try{
    const entry=check.args.find(a=>/\.cjs$/.test(a)&&entryDeclaration(path.basename(a)));
    if(check.execution==='contract'&&entry&&entryCaseProblems(path.basename(entry),outcome).length)throw Error('Missing required internal case/renderer: '+check.id);
    Object.assign(result,r.recordReport(ctx,check,before));
   }catch(error){Object.assign(result,{status:'UNVERIFIED',reason:(error as Error).message});}
  }
  if(result.rawStatus==='not-run')Object.assign(result,{rawStatus:signal?.aborted?'cancelled':Date.now()>=deadline?'not-run':'blocked',reasonCode:signal?.aborted?'RunCancelled':Date.now()>=deadline?'ResearchBudgetExhausted':'PrerequisiteFailed',caseStatus:'NOT_RUN'});
  statuses[check.id]=result.status;report.results.push(result);
  report.status=overall([...report.results.map(r=>r.status),...(report.results.length<selected.length?['UNVERIFIED']:[])]);
  writeSuite(ctx,report);if(!quiet)console.log(`${result.status} ${check.id}`,result.reason||result.rawStatus);
 }
 report.sourceAfter=observeSource(ctx);
 if(JSON.stringify(report.sourceAfter)!==JSON.stringify(ctx.identity.source)){report.status=overall([report.status,'UNVERIFIED']);report.reasonCode='SourceChangedDuringExecution';}
 writeSuite(ctx,report);
 for(const family of familyReports(ctx.identity,report.expected,report.results,report.sourceAfter))writeJson(path.join(ctx.dir,'families',family.family+'.json'),family);
 return report;
}
