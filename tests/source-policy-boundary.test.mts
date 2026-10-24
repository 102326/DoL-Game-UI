// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import policy from '../scripts/ci-source-policy.cjs';
import catalog from '../scripts/ci-catalog.cjs';

test('source policy reads TS import forms and retains selection and workflow negatives',()=>{
  for(const text of ["import {test} from 'node:test';", "import test = require('node:test');", "const test=require('node:test');"])assert.equal(policy.usesNodeTest(text),true);
  assert.equal(policy.usesNodeTest("import './other';"),false);
  for(const text of ['test.only("x",()=>{});','test["skip"]("x",()=>{});','test("x",{todo:true},()=>{});','test("x",{skip},()=>{});'])assert.ok(policy.forbiddenJs(text).length);
  assert.deepEqual(policy.forbiddenJs('test("x",{skip:false},()=>{});'),[]);
  assert.deepEqual(policy.forbiddenWorkflow('shell: bash\ncontinue-on-error: false\n'),[]);
  assert.ok(policy.forbiddenWorkflow('shell: bash\ncontinue-on-error: true\n').includes('ContinueOnError'));
});
test('source policy validates package commands before checking masked CI exits',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sw-policy-'));
  t.after(()=>{
    if(path.dirname(path.resolve(root))!==path.resolve(os.tmpdir())||!path.basename(root).startsWith('sw-policy-'))throw Error('Unexpected policy fixture path');
    fs.rmSync(root,{recursive:true,force:true});
  });
  const files=new Set([...Object.values(catalog.suites).flat().map(file=>'tests/'+file),...catalog.researchPlan.flatMap(check=>check.args.filter(arg=>/^(tests|scripts)\/.*\.(cjs|mjs|js)$/.test(arg))),'tests/ui-runtime.cjs']);
  for(const file of files){const absolute=path.join(root,file);fs.mkdirSync(path.dirname(absolute),{recursive:true});fs.writeFileSync(absolute,'');}
  fs.mkdirSync(path.join(root,'.github/workflows'),{recursive:true});
  const manifest=path.join(root,'package.json');
  for(const invalid of [null,{}, {scripts:null},{scripts:[]},{scripts:{'ci:check':1}}]){
    fs.writeFileSync(manifest,JSON.stringify(invalid));assert.throws(()=>policy.checkSourcePolicy(root),/Invalid package/);
  }
  fs.writeFileSync(manifest,JSON.stringify({scripts:{'ci:check':'node test.cjs || true'}}));assert.deepEqual(policy.checkSourcePolicy(root),[{file:'package.json#ci:check',reason:'MaskedOrUncontrolledPipeline'}]);
  fs.writeFileSync(manifest,JSON.stringify({scripts:{'ci:check':'node test.cjs'}}));assert.deepEqual(policy.checkSourcePolicy(root),[]);
});
