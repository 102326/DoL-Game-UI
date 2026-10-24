export {};
// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"checkpoint","caseSource":"checkpoint","source":"tests/ui-runtime.cjs","group":"identity","evidence":"checkpoints"}
// Core identity is independent from the complete compatibility behavior sequence.
process.argv.push('--group=identity');
require('./ui-runtime.cjs');
