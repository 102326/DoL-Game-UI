import renderer = require('../scripts/render-state-fields.cjs');

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
