import renderer = require('../scripts/render-state-fields.cjs');
import png = require('../scripts/ci-png.cjs');
import cases = require('../scripts/ci-cases.cjs');
import policy = require('../scripts/ci-source-policy.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import reporter = require('../scripts/ci-test-reporter.cjs');
import profiles = require('./device-profiles.cjs');

// These rejected calls prove CJS consumers see the implementation's real types.
function rendererContract() {
  const fields:string[]=renderer.fields('const context={V:{}}; const {V}=context; V.foo;');
  // @ts-expect-error Source must be text.
  renderer.fields(12);
  // @ts-expect-error Return values are not numeric.
  const wrong:number=renderer.fields('');
  // @ts-expect-error Only implemented exports are available.
  renderer.missing();
  return {fields,wrong};
}
void rendererContract;

function pngContract(){
  const width:number=png.verifyPng(Buffer.alloc(0)).width;
  // @ts-expect-error The verifier consumes binary data.
  png.verifyPng('not a buffer');
  // @ts-expect-error Width is numeric.
  const wrong:string=png.verifyPng(Buffer.alloc(0)).width;
  return {width,wrong};
}
void pngContract;

async function caseContract(){
  const value:number=await cases.runCase('typed',()=>42);
  // @ts-expect-error Counters return numbers.
  cases.setAssertionCounter(()=> 'wrong');
  // @ts-expect-error Generic case results retain their actual type.
  const wrong:string=await cases.runCase('typed',()=>42);
  return {value,wrong};
}
void caseContract;

function policyContract(){
  const problems:{file:string;reason:string}[]=policy.checkSourcePolicy('.');
  // @ts-expect-error Policy source must be text.
  policy.forbiddenJs(null);
  // @ts-expect-error A source policy result is not numeric.
  const wrong:number=policy.usesNodeTest('');
  return {problems,wrong};
}
void policyContract;

function receiptContract(){
  receipt.recordFailure(null);
  // @ts-expect-error Case issue names are strings.
  receipt.recordNodeCases([],[1]);
  // @ts-expect-error Reporter consumes the real asynchronous Node event stream.
  reporter([]);
}
void receiptContract;

function deviceContract(){
  const width:number|undefined=profiles.buildCases()[0]?.viewport.width;
  // @ts-expect-error Depth is text and is validated at runtime.
  profiles.buildCases(42);
  // @ts-expect-error The device viewport width is numeric.
  const wrong:string=profiles.buildCases()[0]?.viewport.width;
  const typed:0 extends (1&ReturnType<typeof profiles.buildCases>[number]['viewport']['width'])?true:false=false;
  return {width,wrong,typed};
}
void deviceContract;
