import * as verdictTools from '../scripts/ci/contracts.ts';
import renderer from '../scripts/render-state-fields.cjs';
import producer from '../component-lab/source-index.cjs';
import catalog from '../scripts/ci-catalog.cjs';
import metrics from '../scripts/ci-metrics.cjs';

function esmContract() {
  const fields:string[]=renderer.fields('');
  // @ts-expect-error ESM receives the same CJS parameter contract.
  renderer.fields(false);
  // @ts-expect-error ESM receives the same CJS return contract.
  const wrong:boolean=renderer.fields('');
  // @ts-expect-error CJS default interop does not invent exports.
  renderer.missing();
  return {fields,wrong};
}
void esmContract;

function sourceIndexContract(){
  const digest:string=producer.sourceIndex().snapshot.digest;
  // @ts-expect-error The CJS source-index argument is text.
  producer.sourceIndex(1);
  // @ts-expect-error The CJS digest is text.
  const wrong:number=producer.sourceIndex().snapshot.digest;
  return {digest,wrong};
}
void sourceIndexContract;

function catalogContract(){
  const digest:string=catalog.catalogIdentity().sha256;
  const profile:'standard'|'research'|'release'=catalog.catalogFor().profile;
  const checkpointsAreTyped:0 extends (1&ReturnType<typeof catalog.catalogFor>['contracts'][number]['checkpoints'])?true:false=false;
  // @ts-expect-error Entry names are strings.
  catalog.testArgs(2);
  // @ts-expect-error The exported suite is frozen at runtime.
  catalog.suites.unit.pop();
  return {digest,profile,checkpointsAreTyped};
}
void catalogContract;

function metricsContract(){
  const rows=metrics.measure([metrics.parseRun({})]).rows;
  // @ts-expect-error The runner cannot pass untyped string input as a list of runs.
  metrics.measure('runs');
  // @ts-expect-error Elapsed milliseconds remain numeric or null.
  const wrong:string=rows[0]?.jobMs;
  const typed:0 extends (1&typeof rows[number]['jobMs'])?true:false=false;
  return {wrong,typed};
}
void metricsContract;


function ciVerdictContract(){
 const status:import('../scripts/ci/contracts.ts').Status=verdictTools.classify({code:0});
 const verdictStatus:import('../scripts/ci/contracts.ts').Status=verdictTools.verdict('PASS').status;
 const integrity:'COMPLETE'|'INCOMPLETE'=verdictTools.verdict('PASS').evidenceIntegrity;
 const combined:import('../scripts/ci/contracts.ts').Status=verdictTools.overall(['PASS',undefined]);
 // @ts-expect-error Raw process exit codes are numeric or null.
 verdictTools.classify({code:'0'});
 // @ts-expect-error A verdict cannot declare an arbitrary success status.
 verdictTools.verdict('PASS',[],'finished');
 // @ts-expect-error An external assertion outcome remains opaque until validated.
 const assertion:string=verdictTools.verdict({untrusted:true}).assertionResult;
 const typed:0 extends (1&typeof status)?true:false=false;
 return {status,verdictStatus,integrity,combined,assertion,typed};
}
void ciVerdictContract;
