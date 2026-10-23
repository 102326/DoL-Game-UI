// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"entry"}
// Execute the existing three checks through the same runner, with independent expected entries.
const {context}=require('./ci-evidence.cjs'),{runSuite}=require('./test-ci.cjs'),{researchUnitEntries}=require('./ci-catalog.cjs');
(async()=>{const result=await runSuite(context(),'unit',researchUnitEntries);process.exitCode=result.status==='PASS'?0:1})().catch(error=>{require('./ci-process-receipt.cjs').terminalFailure(error);process.exitCode=1});
