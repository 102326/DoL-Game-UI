// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import vm = require('node:vm');
import path = require('node:path');
import esbuild = require('esbuild');
import type {VersionToolsHost} from '../src/runtime/target-version.ts';
const output=esbuild.buildSync({entryPoints:[path.join(__dirname,'../src/runtime/target-version.ts')],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0];assert.ok(output);
const m:{exports:unknown}={exports:{}};vm.runInNewContext(output.text,{module:m,exports:m.exports});
function versionExports(value:unknown):value is Pick<typeof import('../src/runtime/target-version.ts'),'matchesTargetVersion'|'isMinimumVersion'>{return !!value&&typeof value==='object'&&'matchesTargetVersion' in value&&typeof value.matchesTargetVersion==='function'&&'isMinimumVersion' in value&&typeof value.isMinimumVersion==='function';}
assert.ok(versionExports(m.exports));
const {matchesTargetVersion:matches,isMinimumVersion}=m.exports;
const calls:[string,string][]=[],host:VersionToolsHost={getSemVerTools:()=>({parseVersion:v=>({version:{value:v}}),parseRange:r=>({range:r}),satisfies(v,r){assert.ok(v&&typeof v==='object'&&'value' in v&&typeof v.value==='string');assert.ok(r&&typeof r==='object'&&'range' in r&&typeof r.range==='string');calls.push([v.value,r.range]);return ['1.3.0','1.3.1','1.10.0','2.0.0','1.1.1.2','1.1.1.3'].includes(v.value)}})};
assert.equal(matches('1.3.0',['1.3.0']),true);assert.equal(matches('1.3.1',['1.3.0']),false);
for(const v of ['1.3.0','1.3.1','1.10.0','2.0.0']) assert.equal(matches(v,['>=1.3.0'],host),true);
assert.equal(matches('1.2.9',['>=1.3.0'],host),false);
assert.equal(matches('1.1.1.3',['>=1.1.1.2'],host),true);assert.deepEqual(calls.at(-1),['1.1.1.3','>=1.1.1.2']);
for(const v of ['',undefined,'unknown','1.3.invalid']) assert.equal(matches(v,['>=1.3.0'],host),false);
for(const r of ['>=','>=unknown','>1.3.0','>=1.3.0 || anything']) assert.equal(matches('1.3.1',[r],host),false);
assert.equal(matches('1.3.1',['>=1.3.0']),false);assert.equal(matches('1.3.1',['>=1.3.0'],{getSemVerTools(){throw Error('unavailable')}}),false);
assert.equal(isMinimumVersion('>=1.1.1.2'),true);
console.log('PASS target versions: exact compatibility, >= delegation/unwrapping, four-part versions, invalid input and missing/failed loader API');
