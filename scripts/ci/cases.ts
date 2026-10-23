import path from 'node:path';
import {AsyncLocalStorage} from 'node:async_hooks';
import type {CaseDeclaration,CaseResult,CaseStatus} from './contracts.ts';
import {caseProblems} from './contracts.ts';

let assertions=()=>0,start=performance.now(),previous=0;
const records:CaseResult[]=[];
const scopes=new AsyncLocalStorage<{prefix:string;start:number;previous:number}>();
const ownEntry=!!process.argv[1]&&path.resolve(process.argv[1])===process.env.MOODY_CASE_ENTRY;
const plan:CaseDeclaration[]=ownEntry?JSON.parse(process.env.MOODY_CASE_PLAN||'[]'):[];
export function withCaseScope<T>(prefix:string,fn:()=>T):T{return scopes.run({prefix,start:performance.now(),previous:assertions()},fn);}
function declaredId(id:string):string|undefined{const scope=scopes.getStore(),qualified=scope?scope.prefix+':'+id:id;return plan.some(c=>c.id===qualified)?qualified:undefined;}
export function setAssertionCounter(counter:()=>number):void{assertions=counter;}
export async function runCase<T>(id:string,fn:()=>Promise<T>|T,path='controlled'):Promise<T>{
 const qualified=declaredId(id);if(!qualified)return await fn();
 const started=performance.now(),before=assertions();
 const record:CaseResult={id:qualified,status:'RUNNING',milliseconds:0,assertions:0,path};records.push(record);
 try{const value=await fn();record.status='PASS';return value;}catch(error){record.status=(error as {code?:string})?.code==='ERR_ASSERTION'?'FAIL':'ERROR';record.failureSignature=String((error as Error)?.message||error).slice(0,500);throw error;}finally{record.milliseconds=performance.now()-started;record.assertions=assertions()-before;}
}
export function caseCheckpoint(id:string,path='controlled'):string{
 const qualified=declaredId(id);if(!qualified)return id;
 const now=performance.now(),count=assertions(),scope=scopes.getStore();records.push({id:qualified,status:'PASS',milliseconds:now-(scope?.start??start),assertions:count-(scope?.previous??previous),path,checkpoints:[qualified]});if(scope){scope.start=now;scope.previous=count;}else{start=now;previous=count;}return id;
}
export function finishCases(terminal?:{kind?:string;message?:string}):{cases:CaseResult[];caseIssues:string[]}{
 if(ownEntry&&['entry','composed'].includes(process.env.MOODY_CASE_GRANULARITY||'')&&plan.some(c=>c.id==='entry')&&!records.some(c=>c.id==='entry')){const status:CaseStatus=terminal?(terminal.kind==='assertion'?'FAIL':'ERROR'):'PASS';records.push({id:'entry',status,milliseconds:performance.now()-start,assertions:assertions(),path:'entry',...(terminal?{failureSignature:terminal.message}:{} )});}
 return {cases:records,caseIssues:plan.length?caseProblems(plan,records):[]};
}
