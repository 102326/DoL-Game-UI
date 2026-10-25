// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import path = require('node:path');
import child = require('node:child_process');
const {spawnSync}=child;
for(const [mutation,group,target]of[
 ['identity','identity','legacy Core identity; official wrapper is checked by framework-startup'],
 ['privacy','inspector','attribute values redacted from export'],
 ['events','inspector','event buffer bounded'],
 ['surfaces','surfaces','a duplicate cannot change kind'],
 ['rebind','compat','independent package rebinds to new Core']
] as const){
 const r=spawnSync(process.execPath,[path.join(__dirname,'ui-runtime.cjs'),'--group='+group,'--mutation='+mutation],{encoding:'utf8',timeout:45000,maxBuffer:1024*1024});
 assert.equal(r.error,undefined);assert.equal(r.signal,null);assert.equal(r.status,1,r.stderr);
 assert.match(r.stderr,/AssertionError \[ERR_ASSERTION\]/);assert.ok(r.stderr.includes(target),r.stderr);
 console.log('PASS precise Runtime negative:',mutation,'=>',target);
}

for(const group of ['inspector','surfaces']){
 const r=spawnSync(process.execPath,[path.join(__dirname,'ui-runtime.cjs'),'--group='+group,'--uncaught-page-error'],{encoding:'utf8',timeout:45000,maxBuffer:1024*1024});
 assert.equal(r.error,undefined);assert.equal(r.signal,null);assert.match(r.stdout,group==='inspector'?/PASS UI Runtime Inspector/:/PASS UI Runtime Surface/,'other DOM and behavior assertions must reach the group boundary');
 assert.equal(r.status,1,'F3 '+group+' must reject an uncaught browser error');assert.match(r.stderr,/AssertionError \[ERR_ASSERTION\]/);assert.ok(r.stderr.includes('UI_RUNTIME_PAGEERROR'),r.stderr);assert.ok(r.stderr.includes('controlled '+group+' unhandled window error'),r.stderr);
 console.log('PASS precise Runtime page-error negative:',group);
}
