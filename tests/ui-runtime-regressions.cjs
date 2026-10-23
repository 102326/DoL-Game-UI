const assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
for(const [mutation,group,target]of[
 ['identity','identity','legacy Core identity; official wrapper is checked by framework-startup'],
 ['privacy','inspector','attribute values redacted from export'],
 ['events','inspector','event buffer bounded'],
 ['surfaces','surfaces','a duplicate cannot change kind'],
 ['rebind','compat','independent package rebinds to new Core']
]){
 const r=spawnSync(process.execPath,[path.join(__dirname,'ui-runtime.cjs'),'--group='+group,'--mutation='+mutation],{encoding:'utf8',timeout:45000,maxBuffer:1024*1024});
 assert.equal(r.error,undefined);assert.equal(r.signal,null);assert.equal(r.status,1,r.stderr);
 assert.match(r.stderr,/AssertionError \[ERR_ASSERTION\]/);assert.ok(r.stderr.includes(target),r.stderr);
 console.log('PASS precise Runtime negative:',mutation,'=>',target);
}
