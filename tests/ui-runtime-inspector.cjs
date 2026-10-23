// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"checkpoint","caseSource":"checkpoint","source":"tests/ui-runtime.cjs","group":"inspector","evidence":"checkpoints"}
// Independently reported legacy runtime contract, portable browser selection.
process.argv.push('--group=inspector');
require('./ui-runtime.cjs');
