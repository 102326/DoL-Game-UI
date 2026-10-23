const path=require('node:path'),{recordFailure,recordNodeCases}=require('./ci-process-receipt.cjs');
module.exports=async function*(source){let assertion,summary;const cases=[];const expected=JSON.parse(process.env.MOODY_EXPECTED_NODE_CASES||'[]');
 for await(const event of source){
  if(['test:pass','test:fail'].includes(event.type)&&event.data.file){const id=path.basename(event.data.file)+'::'+event.data.name;cases.push({id,status:event.data.skip||event.data.todo?'SKIP':event.type==='test:fail'?'FAIL':'PASS'});}
  if(event.type==='test:fail'){const error=event.data.details?.error?.cause||event.data.details?.error;if(error?.code==='ERR_ASSERTION')assertion=error;recordFailure(assertion||error,{nodeTest:true})}
  if(event.type==='test:summary')summary=event.data;
  yield JSON.stringify({type:event.type,name:event.data.name,counts:event.data.counts,message:event.data.details?.error?.message})+'\n';
 }
 // Native Node emits per-file summaries before the aggregate summary. Compare
 // the complete frozen plan only after the event stream has finished.
 const issues=[];if(!expected.length||cases.length!==expected.length||new Set(cases.map(c=>c.id)).size!==cases.length||cases.some(c=>!expected.includes(c.id)))issues.push('NodeCasePlanMismatch');
 if(!summary?.counts?.tests||summary.counts.skipped||summary.counts.todo||summary.counts.cancelled||cases.some(c=>c.status==='SKIP'))issues.push('EmptyOrSkippedNodeTests');
 recordNodeCases(cases,issues);if(issues.length)process.exitCode=1;
};
