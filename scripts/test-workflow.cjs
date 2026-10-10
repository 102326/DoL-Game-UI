const fs=require('node:fs'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const groups={
 wardrobe:['wardrobe-operations.test.cjs','wardrobe-search.test.cjs','wardrobe-layout.test.cjs','sidebar-preview-lifecycle.cjs'],
 shop:['shop-source.test.cjs','shop.test.cjs'],
 saves:['saves-source-m4b.cjs','saves-runtime.cjs','save-transfer-lifecycle.cjs','save-compatibility.cjs'],
 layout:['ui-runtime.cjs','resilience.cjs','master-toggle.cjs','master-native.cjs','mobile-density.cjs','display-scale.cjs','overlay-manager-layout.cjs','kitchen-layout.cjs'],
 combat:['combat-m4a.cjs','acceptance.cjs','combat-resize.test.cjs','native-action-panel.cjs'],
};
const args=process.argv.slice(2),mode=args.shift(),planOnly=args.includes('--plan');
const selected=args.filter(a=>a!=='--plan');
if(!['quick','release','performance'].includes(mode))throw Error('Use quick [wardrobe|shop|saves|layout|combat], release, or performance [shop|wardrobe]; add --plan to inspect without running');
if(mode==='release'&&selected.length)throw Error('release takes no test group');
if(mode==='performance'&&selected.some(x=>!['shop','wardrobe'].includes(x)))throw Error('Unknown performance group');
if(mode==='quick'&&selected.some(x=>!Object.hasOwn(groups,x)))throw Error('Unknown quick group');
const variant=process.env.DOL_WARDROBE_INTEGRATED==='1'?'lyra':'vanilla';
// Existing tests use truthiness for this flag; normalize once to avoid "0" selecting Lyra.
const env={...process.env};delete env.DOL_WARDROBE_INTEGRATED;
if(variant==='lyra')env.DOL_WARDROBE_INTEGRATED='1';
// Local validation must never overwrite an externally supplied release directory.
delete env.DOL_RELEASE_DIR;
if(env.DOL_WARDROBE_CONTROL)throw Error('Unset DOL_WARDROBE_CONTROL: diagnostic control is not UI regression');
if(mode==='performance'&&['DOL_SHOP_LIFECYCLE_ONLY','DOL_SHOP_BANNER_CONTROL','DOL_SHOP_VERIFY_ARTIFACT'].some(k=>env[k]))throw Error('Unset shop diagnostic flags before performance sampling');
const tests=mode==='performance'?(selected.length?selected:['shop','wardrobe']).map(x=>`${x}-current-baseline.cjs`)
 :[...new Set([...((mode==='release'?Object.keys(groups):selected).flatMap(x=>groups[x])),...(mode==='release'?['wardrobe-m2.cjs']:[])])];
const gameTests=['master-native.cjs','wardrobe-search.test.cjs','wardrobe-layout.test.cjs','wardrobe-m2.cjs','shop.test.cjs','saves-runtime.cjs','save-compatibility.cjs','shop-current-baseline.cjs','wardrobe-current-baseline.cjs'];
const needsGame=tests.some(x=>gameTests.includes(x));
const needsFixture=tests.some(x=>!['wardrobe-operations.test.cjs','sidebar-preview-lifecycle.cjs',...gameTests].includes(x));
const workspace=path.resolve(env.DOL_TEST_WORKSPACE||path.join(root,'../..'));
const required=tests.map(x=>path.join(root,'tests',x));
if(needsFixture)required.push(path.join(root,'tests/fixture.html'));
if(needsGame)required.push(path.join(workspace,variant==='lyra'?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'),path.join(workspace,'upstream/game-0.5.11.9/img'));
// Use the existing build pipeline including render-field and TypeScript checks.
const steps=[{name:'build',command:process.execPath,args:[process.env.npm_execpath||path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),'run','build']}];
steps.push({name:'unit',command:process.execPath,args:[path.join(root,'scripts/test-unit.cjs')]});
steps.push(...tests.map(name=>({name,command:process.execPath,args:[path.join(root,'tests',name)]})));
const plan={mode,variant,tests,steps:steps.map(s=>s.name),required,missing:required.filter(p=>!fs.existsSync(p)),scope:'Isolated desktop tests only; no ADB, user saves, install or publication'};
if(planOnly){console.log(JSON.stringify(plan,null,2));process.exit(0)}
if(plan.missing.length)throw Error('Missing test resources (no tests started): '+plan.missing.join(', '));
const out=path.join(root,'tests/artifacts');fs.mkdirSync(out,{recursive:true});
const git=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'});
const dirty=spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'});
const report={...plan,version:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,node:process.version,commit:git.status===0?git.stdout.trim():null,dirty:dirty.status===0?Boolean(dirty.stdout.trim()):null,started:new Date().toISOString(),results:[]};
const file=path.join(out,`workflow-${mode}-${Date.now()}.json`);
for(const step of steps){
 console.log('\nRUN',step.name);
 const start=Date.now(),r=spawnSync(step.command,step.args,{cwd:root,env,stdio:'inherit',timeout:15*60*1000});
 report.results.push({name:step.name,status:r.status===0&&!r.error?'passed':'failed',exit:r.status,signal:r.signal,error:r.error?.message??null,ms:Date.now()-start});
 if(r.status!==0||r.error){process.exitCode=r.status||1;break}
}
report.finished=new Date().toISOString();report.status=process.exitCode?'failed':'passed';
report.notRun=steps.slice(report.results.length).map(s=>s.name);
fs.writeFileSync(file,JSON.stringify(report,null,2));console.log('REPORT',file,report.status);
