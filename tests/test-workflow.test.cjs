const assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
const run=(...args)=>spawnSync(process.execPath,[path.join(__dirname,'../scripts/test-workflow.cjs'),...args],{encoding:'utf8'});
for(const mode of ['quick','release','performance']){
 const r=run(mode,'--plan');assert.equal(r.status,0,r.stderr);
 const plan=JSON.parse(r.stdout);assert.deepEqual(plan.steps.slice(0,2),['build','unit']);
 assert.ok(plan.tests.every(x=>!x.startsWith('adb-')));
 if(mode==='quick')assert.deepEqual(plan.tests,[]);
 if(mode==='release')for(const test of ['save-compatibility.cjs','wardrobe-m2.cjs','shop-source.test.cjs','saves-source-m4b.cjs','combat-m4a.cjs'])assert.ok(plan.tests.includes(test),test);
 if(mode==='performance')assert.deepEqual(plan.tests,['shop-current-baseline.cjs','wardrobe-current-baseline.cjs']);
}
assert.notEqual(run('quick','unknown','--plan').status,0);
assert.notEqual(run('release','shop','--plan').status,0);
for(const [group,test] of [['wardrobe','wardrobe-search.test.cjs'],['shop','shop-source.test.cjs'],['saves','saves-source-m4b.cjs'],['combat','combat-m4a.cjs']]){
 const plan=JSON.parse(run('quick',group,group,'--plan').stdout);
 assert.equal(plan.tests.filter(name=>name===test).length,1);
 assert.ok(!plan.tests.includes('wardrobe-m2.cjs'),'slow wardrobe integration is release-only');
}
assert.deepEqual(JSON.parse(run('quick','layout','layout','--plan').stdout).tests,['ui-runtime.cjs','resilience.cjs','master-toggle.cjs','master-native.cjs','mobile-density.cjs','display-scale.cjs','overlay-manager-layout.cjs','kitchen-layout.cjs']);
console.log('PASS workflow selection, deduplication and invalid arguments');
