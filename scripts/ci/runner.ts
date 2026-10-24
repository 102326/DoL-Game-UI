import {runCommand} from './process.ts';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {orderEntries} from './contracts.ts';
import type {Status} from './contracts.ts';
import {entryDeclaration,entryCaseProblems} from './lock.ts';
import {writeSuite} from './records.ts';
import {observeSource} from './source.ts';

const require=createRequire(import.meta.url);
interface Context {dir:string;root:string;identity:{source:unknown;[key:string]:unknown}}
interface Check {name:string;scope:string;status:Status;rawStatus:string;milliseconds:number|null;exitCode:number|null;signal:string|null;[key:string]:unknown}
interface Suite {schema:1;identity:Context['identity'];suite:string;coverage:string;expected:readonly string[];status:Status;results:Check[];sourceAfter:unknown;order:string[];seed:string|null;budgetMs:number;reasonCodes:string[]}
interface Options {signal?:AbortSignal;timeoutMs?:number;quiet?:boolean;budgetMs?:number;seed?:string}
export async function runSuite(ctx:Context,mode:string,tests?:readonly string[],{signal,timeoutMs=120000,quiet=false,budgetMs=mode==='browser'?720000:180000,seed=process.env.MOODY_ORDER_SEED}:Options={}):Promise<Suite>{
 const e=require('../ci-evidence.cjs');
 const {testArgs,suites}:typeof import('../ci-catalog.cjs')=require('../ci-catalog.cjs');
 tests=tests||(mode==='unit'||mode==='browser'?suites[mode]:undefined);if(!tests?.length||!Number.isFinite(budgetMs)||budgetMs<=0)throw Error('Empty suite or invalid time budget');
 const order=orderEntries(tests,seed),deadline=Date.now()+budgetMs;
 const report:Suite={schema:1,identity:ctx.identity,suite:mode,coverage:e.coverage,expected:tests,status:'UNVERIFIED',sourceAfter:ctx.identity.source,order,seed:seed||null,budgetMs,reasonCodes:[],results:tests.map(name=>({name,scope:mode==='unit'?'Unit/source contract':'Controlled browser fixture',status:'UNVERIFIED',rawStatus:'not-run',milliseconds:null,exitCode:null,signal:null}))};
 const save=()=>{report.status=e.overall(report.results.map(r=>r.status));if(report.reasonCodes.length&&report.status==='PASS')report.status='UNVERIFIED';writeSuite(ctx,report);};
 save();
 for(const name of order){const check=report.results.find(r=>r.name===name)!;
  if(signal?.aborted||Date.now()>=deadline){Object.assign(check,{status:signal?.aborted?'CANCELLED':'UNVERIFIED',reasonCode:signal?.aborted?'RunCancelled':'SuiteBudgetExhausted',caseStatus:'NOT_RUN'});save();continue;}
  Object.assign(check,{status:'CANCELLED',rawStatus:'running',startedAt:new Date().toISOString(),log:`${mode}/${name}.log`,evidence:[]});save();
  fs.rmSync(path.join(ctx.dir,'fixtures',name,'checkpoints.json'),{force:true});
  const env={...process.env,MOODY_CHECK_NAME:name,MOODY_EVIDENCE_DIR:path.join(ctx.dir,'fixtures',name)};
  const checkTimeout=name==='device-layouts.cjs'?(process.env.MOODY_DEVICE_DEPTH==='deep'?10:6)*60000:timeoutMs;
  const result=await runCommand(process.execPath,testArgs(name).map(arg=>arg.startsWith('tests/')?path.join(ctx.root,arg):arg),{cwd:ctx.root,log:path.join(ctx.dir,String(check.log)),env,timeoutMs:Math.min(checkTimeout,Math.max(1,deadline-Date.now())),signal,quiet,requireAssertions:true});
  Object.assign(check,result);
  if(name==='device-layouts.cjs'&&check.status==='PASS'&&!e.layoutEvidence(ctx))Object.assign(check,{status:'UNVERIFIED',reasonCode:'MissingLayoutCoverage'});
  if(check.status==='PASS'&&(!e.checkpointEvidence(ctx,name)||entryDeclaration(name)&&entryCaseProblems(name,result).length))Object.assign(check,{status:'UNVERIFIED',reasonCode:'MissingCheckpointOrCase',caseIssues:entryCaseProblems(name,result)});
  check.evidence=['checkpoints.json','snapshot.json','viewport.jpg','layout-report.json'].map(file=>`fixtures/${name}/${file}`).filter(file=>fs.existsSync(path.join(ctx.dir,file)));
  save();if(!quiet)console.log(`${check.status} ${name} (${check.milliseconds}ms, exit=${check.exitCode}, signal=${check.signal})`);
 }
 report.sourceAfter=observeSource(ctx);
 if(JSON.stringify(report.sourceAfter)!==JSON.stringify(ctx.identity.source))report.reasonCodes.push('SourceChangedDuringExecution');
 save();return report;
}
