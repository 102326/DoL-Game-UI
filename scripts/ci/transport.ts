import {sameIdentity,type Status} from './contracts.ts';

interface Verdict {status:Status;assertionResult?:unknown;evidenceIntegrity?:string;reasonCodes?:string[];problems?:{file:unknown;reason:string}[]}
export function transportVerdict<T extends Verdict>(result:T,outcomes:{upload?:string;download?:string;producer?:string}):Omit<T,keyof Verdict>&Verdict{
 const errors:string[]=[];
 if(outcomes.upload!==undefined&&outcomes.upload!=='success')errors.push('evidence_upload');
 if(outcomes.download!==undefined&&outcomes.download!=='success')errors.push('evidence_download');
 if(outcomes.producer!==undefined&&outcomes.producer!=='success')errors.push('upstream_job');
 if(!errors.length)return result;
 return {...result,status:result.status==='FAIL'||result.assertionResult==='FAIL'?'FAIL':result.status==='ERROR'?'ERROR':outcomes.producer==='cancelled'?'CANCELLED':'ERROR',evidenceIntegrity:'INCOMPLETE',reasonCodes:[...new Set([...(result.reasonCodes||[]),...errors,'evidence_incomplete'])],problems:[...(result.problems||[]),...errors.map(reason=>({file:'transport',reason}))]};
}

/** Validate the post-upload receipt before using its status; remote verification remains independent. */
export function uploadSummary(value:unknown,identity:unknown){
 const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
 const status=(v:unknown):v is Status=>typeof v==='string'&&['PASS','FAIL','ERROR','UNVERIFIED','CANCELLED'].includes(v);
 const problem=(v:unknown):v is {file:unknown;reason:string}=>record(v)&&'file' in v&&typeof v.reason==='string';
 if(!record(identity)||!record(identity.run)||typeof identity.run.id!=='string'||!record(value)||value.schema!==1||!sameIdentity(value.identity,identity)||!status(value.status)||(typeof value.assertionResult!=='string'||!['PASS','FAIL','UNKNOWN'].includes(value.assertionResult))||(typeof value.evidenceIntegrity!=='string'||!['COMPLETE','INCOMPLETE'].includes(value.evidenceIntegrity))||(value.reasonCodes!==undefined&&(!Array.isArray(value.reasonCodes)||!value.reasonCodes.every((v:unknown)=>typeof v==='string')))||(value.problems!==undefined&&(!Array.isArray(value.problems)||!value.problems.every(problem))))throw Error('Invalid upload evidence schema or identity');
 const reasonCodes:string[]=value.reasonCodes??[],problems:{file:unknown;reason:string}[]=value.problems??[];
 if(value.status==='PASS'&&(value.assertionResult!=='PASS'||value.evidenceIntegrity!=='COMPLETE'||reasonCodes.length||problems.length))throw Error('Contradictory upload PASS');
 return {...value,status:value.status,assertionResult:String(value.assertionResult),evidenceIntegrity:String(value.evidenceIntegrity),identity,reasonCodes,problems};
}
