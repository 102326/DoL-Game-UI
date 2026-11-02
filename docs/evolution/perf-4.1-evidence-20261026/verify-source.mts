import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {resolve,relative,isAbsolute} from 'node:path';import assert from 'node:assert/strict';
const contract=JSON.parse(readFileSync(new URL('./source-contract.json',import.meta.url),'utf8')) as {commit:string;files:Array<{path:string;sha256:string}>};
const root=resolve(process.argv[2]??'.');assert(contract.files.length>0&&contract.files.length<40);
for(const file of contract.files){const target=resolve(root,file.path),r=relative(root,target);assert(r&&!r.startsWith('..')&&!isAbsolute(r),'Source path outside repository');assert.equal(createHash('sha256').update(readFileSync(target)).digest('hex'),file.sha256,file.path+' differs from measured baseline')}
console.log(JSON.stringify({status:'PASS',expectedCommit:contract.commit,files:contract.files.length,meaning:'File identity only; does not run the game or establish performance.'},null,2));
