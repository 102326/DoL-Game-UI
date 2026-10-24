import {createRequire} from 'node:module';
import {readReport,checkpointEvidence} from './records.ts';
import {sameIdentity,exactIds} from './contracts.ts';
import {entryCaseProblems} from './lock.ts';
import {verifiedPass} from './result-status.ts';
const require=createRequire(import.meta.url);
const {suites,nodeTestCases}:typeof import('../ci-catalog.cjs')=require('../ci-catalog.cjs');
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
type Context={dir:string;identity:{source:unknown;environment?:{deviceDepth?:string}}};
export const coverage='Controlled fixtures and source contracts only; not real DoL/ModLoader, Windows or Android acceptance.';
export function suiteEvidence(ctx:Context,mode:string,expected?:readonly string[]):boolean {
 expected=expected??(mode==='unit'||mode==='browser'?suites[mode]:undefined);if(!expected)return false;
 const suite=readReport(ctx,mode+'.json');
 if(!suite||suite.schema!==1||suite.status!=='PASS'||!sameIdentity(suite.expected,expected)||!Array.isArray(suite.results)||suite.results.length!==expected.length)return false;
 return suite.results.every((value:unknown,i:number)=>{
  if(!record(value)||typeof value.name!=='string'||value.name!==expected[i]||!verifiedPass(value))return false;
  const nodeTests=Array.isArray(value.nodeTests)?value.nodeTests:[],assertions=value.assertions;
  if(!(typeof assertions==='number'&&assertions>0||nodeTests.length>0))return false;
  const planned=nodeTestCases[value.name];
  if(planned&&(!exactIds(planned.map(n=>value.name+'::'+n),nodeTests.map((c:unknown)=>record(c)?c.id:undefined))||!nodeTests.every((c:unknown)=>record(c)&&c.status==='PASS')||value.nodeCaseIssues!=null&&(!Array.isArray(value.nodeCaseIssues)||value.nodeCaseIssues.length>0)))return false;
  return checkpointEvidence(ctx,value.name)&&entryCaseProblems(value.name,value).length===0;
 })&&sameIdentity(suite.sourceAfter,ctx.identity.source);
}
export function layoutEvidence(ctx:Context):boolean {
 const report=readReport(ctx,'fixtures/device-layouts.cjs/layout-report.json');if(!report||report.status!=='PASS')return false;
 try{
  const {expectedCaseIds}:typeof import('../../tests/device-case-plan.cjs')=require('../../tests/device-case-plan.cjs');
  const depth=ctx.identity.environment?.deviceDepth||'standard',expected=expectedCaseIds(depth),results=report.results;
  return report.depth===depth&&expected.length>0&&Array.isArray(results)&&results.length===expected.length&&new Set(results.map((r:unknown)=>record(r)?r.id:undefined)).size===expected.length&&results.every((r:unknown)=>record(r)&&typeof r.id==='string'&&expected.includes(r.id)&&r.status==='PASS');
 }catch{return false}
}
