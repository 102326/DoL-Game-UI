import assert = require('node:assert/strict');
import vm = require('node:vm');
import path = require('node:path');
import esbuild = require('esbuild');
const {buildSync}=esbuild;
const moduleObject:{exports:unknown}={exports:{}};
vm.runInNewContext(buildSync({entryPoints:[path.join(__dirname,'../src/wardrobe/reference.ts')],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0]?.text ?? assert.fail('missing compiled output'),{module:moduleObject,exports:moduleObject.exports});
function checkedExports(value:unknown):value is Pick<typeof import('../src/wardrobe/reference.ts'),'referenceItem'|'compareReferences'> {return !!value&&typeof value==='object'&&'referenceItem' in value&&typeof value.referenceItem==='function'&&'compareReferences' in value&&typeof value.compareReferences==='function';}
assert.ok(checkedExports(moduleObject.exports));

const {referenceItem,compareReferences}=moduleObject.exports;
const raw={key:'upper:0:r4',name:'shirt',colour:'blue',warmth:6,durability:100,lewd:200,outfit:'单件',detail:'native description',raw:{private:true},icons:[],traits:[],splittable:false};
const a=referenceItem(raw,'上装'),same=compareReferences(a,a);
assert.ok(Object.isFrozen(a));assert.ok(!('raw' in a)&&!('key' in a)&&!('icons' in a));assert.ok(same.every(row=>row.status==='same'));
raw.name='changed';assert.equal(a.name,'shirt');
const diff=compareReferences(a,{...a,warmth:8,durability:null,colour:''});
assert.equal((diff.find(r=>r.field==='warmth') ?? assert.fail('missing comparison field')).status,'different');assert.equal((diff.find(r=>r.field==='durability') ?? assert.fail('missing comparison field')).status,'unknown');assert.equal((diff.find(r=>r.field==='colour') ?? assert.fail('missing comparison field')).status,'unknown');
assert.equal((diff.find(r=>r.field==='lewd') ?? assert.fail('missing comparison field')).status,'same');
console.log('PASS readonly copied fields; same/different/unknown field semantics; no action or native object retained');
