const path=require('node:path'),{recordFailure,recordNodeCases}=require('./ci-process-receipt.cjs');
module.exports=async function*(source){let assertion;const cases=[];const expected=JSON.parse(process.env.MOODY_EXPECTED_NODE_CASES||'[]');
 for await(const event of source){
  if(['test:pass','test:fail'].includes(event.type)&&event.data.file){const id=path.basename(event.data.file)+'::'+event.data.name;cases.push({id,status:event.data.skip||event.data.todo?'SKIP':event.type==='test:fail'?'FAIL':'PASS'});}
  if(event.type==='test:fail'){const error=event.data.details?.error?.cause||event.data.details?.error;if(error?.code==='ERR_ASSERTION')assertion=error;recordFailure(assertion||error,{nodeTest:true})}
  if(event.type==='test:summary'){const issues=[];if(!expected.length||cases.length!==expected.length||new Set(cases.map(c=>c.id)).size!==cases.length||cases.some(c=>!expected.includes(c.id)))issues.push('NodeCasePlanMismatch');if(!event.data.counts?.tests||event.data.counts.skipped||event.data.counts.todo||event.data.counts.cancelled)issues.push('EmptyOrSkippedNodeTests');recordNodeCases(cases,issues);if(issues.length)process.exitCode=1;}
  yield JSON.stringify({type:event.type,name:event.data.name,message:event.data.details?.error?.message})+'\n';
 }
};
