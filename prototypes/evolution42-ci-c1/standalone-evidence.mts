import {verifiedPass} from '../../scripts/ci/result-status.ts';
import type {runCommand} from '../../scripts/ci/process.ts';

export type StandaloneResult={entry:string;outcome:Awaited<ReturnType<typeof runCommand>>};
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);

// Local report readback only. The caller owns the independently selected entries
// and enclosing source/run identity; this does not authenticate remote evidence.
export function standaloneProblems(expected:readonly string[],value:unknown):string[]{
 if(!Array.isArray(value))return ['StandaloneResultSetMismatch'];
 const problems:string[]=[];
 if(new Set(expected).size!==expected.length||JSON.stringify(value.map(row=>record(row)?row.entry:null))!==JSON.stringify(expected))problems.push('StandaloneResultSetMismatch');
 for(const entry of expected){
  const row=value.find(row=>record(row)&&row.entry===entry),outcome=record(row)?row.outcome:null;
  if(!record(outcome)||!verifiedPass(outcome,'contract')||outcome.execution!=='contract'||outcome.assertionResult!=='PASS'||outcome.error!==null||!Array.isArray(outcome.contradictions)||outcome.contradictions.length){problems.push('StandaloneIncomplete:'+entry);continue}
  const receipt=outcome.terminalReceipt;
  if(!record(receipt)||receipt.schema!==1||typeof outcome.executionId!=='string'||!outcome.executionId||!Number.isSafeInteger(outcome.pid)||receipt.executionId!==outcome.executionId||receipt.pid!==outcome.pid){problems.push('StandaloneReceiptIdentity:'+entry);continue}
  if(receipt.naturalCompletion!==true||receipt.terminal===true||!(typeof receipt.assertions==='number'&&Number.isSafeInteger(receipt.assertions)&&receipt.assertions>0||Array.isArray(receipt.nodeTests)&&receipt.nodeTests.length>0))problems.push('StandaloneNoAssertions:'+entry);
 }
 return problems;
}
