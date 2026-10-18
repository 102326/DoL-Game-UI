const {spawnSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');
const suites={
 unit:['floating-preferences.test.cjs','test-workflow.test.cjs','status.test.cjs','target-version.test.cjs','wardrobe-data.test.cjs','wardrobe-source-m2.test.cjs','wardrobe-slot-mappings.test.cjs','wardrobe-performance.test.cjs','wardrobe-operations.test.cjs','render-state.test.cjs','startup-cache.test.cjs','mouth-compat-adapter.cjs'],
 browser:['framework.cjs','framework-connect.cjs','framework-commands.cjs','settings-ci.cjs','wardrobe-details-drawer.cjs','shop-source.test.cjs','save-transfer-lifecycle.cjs','header-weather.cjs','official-game-motion.cjs','kraft-work-adapters.cjs','selection-motion.cjs','shop-ripple-motion.cjs','official-defaults.cjs','combat-focused.cjs','combat-select.cjs','saves-viewport.cjs','adapter-materials.cjs']
};
const suite=process.argv[2];
if(!Object.hasOwn(suites,suite))throw Error('Expected unit or browser');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'tests/artifacts/ci');
fs.mkdirSync(dir,{recursive:true});
const report=[];let failed=false;
for(const test of suites[suite]){
 if(failed){report.push({test,status:'not-run'});continue}
 const start=Date.now(),result=spawnSync(process.execPath,[path.join(root,'tests',test)],{cwd:root,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
 const output=(result.stdout||'')+(result.stderr||'')+(result.error?'\n'+result.error.message:'');
 fs.writeFileSync(path.join(dir,test+'.log'),output);
 failed=!!result.error||result.status!==0;
 report.push({test,status:failed?'failed':'passed',seconds:(Date.now()-start)/1000});
 console.log(`${failed?'FAIL':'PASS'} ${test} (${report.at(-1).seconds}s)\n${output}`);
}
fs.writeFileSync(path.join(dir,suite+'.json'),JSON.stringify({suite,platform:process.platform,browser:suite==='browser'?(process.platform==='win32'?'Edge':'Playwright Chromium'):null,coverage:'Controlled fixtures and source tests; not real DoL, ModLoader or Android acceptance',results:report},null,2)+'\n');
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`\n### ${suite}\n\n| Test | Result | Seconds |\n| --- | --- | --- |\n${report.map(r=>`| ${r.test} | ${r.status} | ${r.seconds??'-'} |`).join('\n')}\n\nControlled fixtures only; no real game or Android acceptance.\n`);
process.exitCode=failed?1:0;
