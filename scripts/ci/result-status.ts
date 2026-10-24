import {overall} from './contracts.ts';
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
export function resultStatus(value:unknown,execution?:unknown):unknown {
 const result=record(value)?value:null,receipt=record(result?.terminalReceipt)?result.terminalReceipt:null;
 if(execution===undefined)execution=result?.execution||'contract';
 if(!receipt?.terminal)return result?.status||'UNVERIFIED';
 if(receipt.schema!==1||!result?.executionId||receipt.executionId!==result.executionId||!Number.isSafeInteger(result.pid)||receipt.pid!==result.pid)return 'UNVERIFIED';
 if(result.rawStatus==='cancelled')return 'CANCELLED';
 if(['timeout','spawn-error','signal'].some(status=>status===result.rawStatus))return 'ERROR';
 const assertion=execution==='contract'&&receipt.kind==='assertion'&&receipt.code==='ERR_ASSERTION'&&receipt.name==='AssertionError';
 return overall([result.status||'UNVERIFIED',assertion?'FAIL':'ERROR']);
}
export function verifiedPass(value:unknown,execution?:unknown):boolean {
 if(!record(value))return false;
 return value.status==='PASS'&&resultStatus(value,execution)==='PASS'&&value.rawStatus==='passed'&&value.exitCode===0&&!value.signal&&typeof value.milliseconds==='number'&&Number.isFinite(value.milliseconds)&&value.milliseconds>=0;
}
