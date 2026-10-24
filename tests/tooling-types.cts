import renderer = require('../scripts/render-state-fields.cjs');
import png = require('../scripts/ci-png.cjs');
import cases = require('../scripts/ci-cases.cjs');

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
