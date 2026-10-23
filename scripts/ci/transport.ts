import type {Status} from './contracts.ts';

interface Verdict {status:Status;assertionResult?:string;evidenceIntegrity?:string;reasonCodes?:string[];problems?:{file:string;reason:string}[]}
export function transportVerdict<T extends Verdict>(result:T,outcomes:{upload?:string;download?:string;producer?:string}):T{
 const errors:string[]=[];
 if(outcomes.upload!==undefined&&outcomes.upload!=='success')errors.push('evidence_upload');
 if(outcomes.download!==undefined&&outcomes.download!=='success')errors.push('evidence_download');
 if(outcomes.producer!==undefined&&outcomes.producer!=='success')errors.push('upstream_job');
 if(!errors.length)return result;
 return {...result,status:result.status==='FAIL'||result.assertionResult==='FAIL'?'FAIL':outcomes.producer==='cancelled'?'CANCELLED':'ERROR',evidenceIntegrity:'INCOMPLETE',reasonCodes:[...new Set([...(result.reasonCodes||[]),...errors,'evidence_incomplete'])],problems:[...(result.problems||[]),...errors.map(reason=>({file:'transport',reason}))]};
}
