import child = require('node:child_process');
const {execFileSync}=child;
// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"checkpoint","caseSource":"checkpoint","evidence":"checkpoints"}
import checkpoints = require('../scripts/ci-checkpoints.cjs');
import fs = require('node:fs');
import path = require('node:path');
import assert = require('node:assert/strict');
import vm = require('node:vm');
const {checkpoint}=checkpoints;

const root=path.resolve(__dirname,'..');
execFileSync(process.execPath,[path.join(root,'scripts/build-early.cjs')],{cwd:root});
// Exercise the compiled early global, including repeat loading and foreign fields.
const source=fs.readFileSync(path.join(root,'dist/shop-page-experiment.js'),'utf8');
const window:Record<string,unknown>={};vm.runInNewContext(source,{window});
interface EarlyApi {enabled:boolean;setEnabled(value:unknown):boolean;reset():boolean;foreign?:string}
function isApi(value:unknown):value is EarlyApi{return !!value&&typeof value==='object'&&'enabled' in value&&typeof value.enabled==='boolean'&&'setEnabled' in value&&typeof value.setEnabled==='function'&&'reset' in value&&typeof value.reset==='function';}
const api=window.DoLShopPageExperiment;assert.ok(isApi(api));
assert.equal(api.enabled,false);checkpoint('default-off');assert.equal(api.setEnabled(true),true);
assert.equal(api.setEnabled('true'),false);checkpoint('strict-boolean');api.setEnabled(true);api.foreign='kept';
vm.runInNewContext(source,{window});assert.equal(window.DoLShopPageExperiment,api);checkpoint('repeat-identity');
assert.equal(api.enabled,true);assert.equal(api.foreign,'kept');checkpoint('foreign-fields');assert.equal(api.reset(),false);checkpoint('reset');
console.log('PASS compiled early shop API: default-off, strict boolean, repeat identity, foreign fields and reset');
