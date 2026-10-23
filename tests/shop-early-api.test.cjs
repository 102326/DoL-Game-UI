const {checkpoint}=require('../scripts/ci-checkpoints.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
require('node:child_process').execFileSync(process.execPath,[path.join(root,'scripts/build-early.cjs')],{cwd:root});
// Exercise the compiled early global, including repeat loading and foreign fields.
const source=fs.readFileSync(path.join(root,'dist/shop-page-experiment.js'),'utf8');
const window={};vm.runInNewContext(source,{window});
const api=window.DoLShopPageExperiment;
assert.equal(api.enabled,false);checkpoint('default-off');assert.equal(api.setEnabled(true),true);
assert.equal(api.setEnabled('true'),false);checkpoint('strict-boolean');api.setEnabled(true);api.foreign='kept';
vm.runInNewContext(source,{window});assert.equal(window.DoLShopPageExperiment,api);checkpoint('repeat-identity');
assert.equal(api.enabled,true);assert.equal(api.foreign,'kept');checkpoint('foreign-fields');assert.equal(api.reset(),false);checkpoint('reset');
console.log('PASS compiled early shop API: default-off, strict boolean, repeat identity, foreign fields and reset');
