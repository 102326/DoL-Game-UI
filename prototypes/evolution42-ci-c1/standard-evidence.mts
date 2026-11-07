import {summarize} from '../../scripts/ci/summary.ts';
import type {Context} from '../../scripts/ci/upload.ts';

// Stage exit codes alone do not establish the nested package/build evidence contract.
export function verifyPreparation(ctx:Context,stages:readonly string[]){
 const full=summarize(ctx);
 const problems=stages.filter(id=>!full.results.some(row=>row.name===id&&row.status==='PASS')).map(id=>'PreparationEvidenceIncomplete:'+id);
 return {full,problems};
}
