// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"checkpoint","caseSource":"checkpoint","source":"tests/ui-runtime.cjs","group":"surfaces","evidence":"checkpoints"}
// Independently reported legacy runtime contract, portable browser selection.
process.argv.push('--group=surfaces');
require('./ui-runtime.cjs');
