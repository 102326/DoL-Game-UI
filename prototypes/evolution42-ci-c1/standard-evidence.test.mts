import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fixtures from '../../tests/ci-fixtures.cjs';
import {verifyPreparation} from './standard-evidence.mts';

const root=fileURLToPath(new URL('../../',import.meta.url)),parent=path.join(root,'tests/artifacts/ui42/ci-c1/standard-evidence');mkdirSync(parent,{recursive:true});
const dir=mkdtempSync(path.join(parent,'run-')),ctx=fixtures.fixture(dir),file=path.join(dir,'package-contracts.json'),saved=readFileSync(file);
const stages=['dependencies','check','build','packages','browser-install'];
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
assert.deepEqual(verifyPreparation(ctx,stages).problems,[]);
const outcomes:{id:string;problems:string[]}[]=[];
for(const id of ['failed-inner','missing-second-build','wrong-inner-identity']){
 const value:unknown=JSON.parse(saved.toString('utf8'));assert.ok(object(value));
 if(id==='failed-inner')value.status='FAIL';
 if(id==='missing-second-build'){assert.ok(Array.isArray(value.builds));value.builds=value.builds.slice(0,1)}
 if(id==='wrong-inner-identity')value.identity={source:{head:'foreign'},run:{id:'foreign'}};
 writeFileSync(file,JSON.stringify(value));
 const {problems}=verifyPreparation(ctx,stages);assert(problems.includes('PreparationEvidenceIncomplete:packages'),id);outcomes.push({id,problems});
}
writeFileSync(file,saved);assert.deepEqual(verifyPreparation(ctx,stages).problems,[]);
writeFileSync(path.join(dir,'result.json'),JSON.stringify({scope:'synthetic preparation evidence contract, not actual package builds',status:'PASS',outcomes},null,2));
console.log('PASS preparation inner-evidence rejection; evidence:',dir);
