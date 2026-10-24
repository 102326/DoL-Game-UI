import {runCommand} from '../scripts/ci/process.ts';
import gateFixture from './ci-fixtures.cjs';
import {readJsonBounded,evidenceMeta} from '../scripts/ci/records.ts';
import {context as evidenceContext} from '../scripts/ci/context.ts';
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


function contextContract(){
 const ctx=evidenceContext();
 const nonce:string=ctx.identity.nonce,head:string=ctx.identity.source.head,version:string=ctx.identity.environment.playwright;
 const profile:import('../scripts/ci/contracts.ts').Profile=ctx.identity.profile;
 const typed:0 extends (1&typeof ctx.identity.source)?true:false=false;
 // @ts-expect-error The finalization exception is a boolean, not a truthy flag.
 evidenceContext({allowSourceDrift:'yes'});
 return {nonce,head,version,profile,typed};
}
void contextContract;


function boundedReadContract(){
 const raw:unknown=readJsonBounded('evidence','data.json');
 // @ts-expect-error Disk JSON has no trusted status without validation.
 const status:string=readJsonBounded('evidence','data.json').status;
 const role:'T0'|'T1'|'T2'=evidenceMeta('data.json',['data.json'],[]).role;
 return {raw,status,role};
}
void boundedReadContract;


function fixtureContract(){
 const fields=gateFixture.healthyCaseFields('controlled.cjs');
 const id:string|undefined=fields.terminalReceipt.cases[0]?.id;
 const typed:0 extends (1&typeof fields.terminalReceipt.cases[number]['id'])?true:false=false;
 // @ts-expect-error Native case identifiers are strings.
 const invalid:number|undefined=fields.terminalReceipt.cases[0]?.id;
 // @ts-expect-error A fixture directory is a path string.
 gateFixture.fixture(1);
 return {id,typed,invalid};
}
void fixtureContract;


async function processContract(){
 const result=await runCommand('node',[],{log:'process.log',execution:'tool'});
 const status:import('../scripts/ci/contracts.ts').Status=result.status;
 const typed:0 extends (1&typeof result.status)?true:false=false;
 const receipt:unknown=result.terminalReceipt;
 // @ts-expect-error The command is text, not an executable object.
 runCommand(1,[],{log:'process.log'});
 // @ts-expect-error Disk receipt assertions are untrusted, not a proven numeric count.
 const count:number=result.assertions;
 // @ts-expect-error Execution semantics must be tool or contract.
 runCommand('node',[],{log:'process.log',execution:'arbitrary'});
 return {status,typed,receipt,count};
}
void processContract;
