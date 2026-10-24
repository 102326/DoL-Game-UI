import renderer = require('../scripts/render-state-fields.cjs');
import png = require('../scripts/ci-png.cjs');

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
