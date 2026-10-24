// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"entry"}
// Execute the existing three checks through the same runner, with independent expected entries.
import catalog = require('./ci-catalog.cjs');
import receipt = require('./ci-process-receipt.cjs');
const {context}:typeof import('./ci/context.ts')=require('./ci/context.ts');
const {runSuite}:typeof import('./ci/runner.ts')=require('./ci/runner.ts');
(async()=>{const result=await runSuite(context(),'unit',catalog.researchUnitEntries);process.exitCode=result.status==='PASS'?0:1})().catch(error=>{receipt.terminalFailure(error);process.exitCode=1});
