const assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
const run=(...args)=>spawnSync(process.execPath,[path.join(__dirname,'../scripts/test-workflow.cjs'),...args],{encoding:'utf8'});
for(const mode of ['quick','release','performance']){
 const r=run(mode,'--plan');assert.equal(r.status,0,r.stderr);
 const plan=JSON.parse(r.stdout);assert.deepEqual(plan.steps.slice(0,2),['build','unit']);
 assert.ok(plan.tests.every(x=>!x.startsWith('adb-')));
 if(mode==='quick')assert.deepEqual(plan.tests,[]);
 if(mode==='release')assert.ok(plan.tests.includes('save-compatibility.cjs'));
 if(mode==='performance')assert.deepEqual(plan.tests,['shop-current-baseline.cjs','wardrobe-current-baseline.cjs']);
}
assert.notEqual(run('quick','unknown','--plan').status,0);
assert.notEqual(run('release','shop','--plan').status,0);
assert.deepEqual(JSON.parse(run('quick','layout','layout','--plan').stdout).tests,['display-scale.cjs','overlay-manager-layout.cjs','kitchen-layout.cjs']);
console.log('PASS workflow selection, deduplication and invalid arguments');
