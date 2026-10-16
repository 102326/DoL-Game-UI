const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),base=path.join(root,'tests/artifacts/stone-free-foundation','factory-'+Date.now());
fs.mkdirSync(base,{recursive:true});const target=path.join(base,'author-mod'),factory=path.join(root,'scripts/framework-factory.mjs');
const timings=[];
function command(executable,args,cwd=root,expected=0){
 const start=Date.now(),r=spawnSync(executable,args,{cwd,encoding:'utf8',windowsHide:true});
 fs.appendFileSync(path.join(base,'commands.log'),JSON.stringify({executable,args,cwd,status:r.status,stdout:r.stdout,stderr:r.stderr})+'\n');
 assert.equal(r.status,expected,r.stderr||r.stdout);timings.push({operation:args[0],ms:Date.now()-start});return r;
}
(async()=>{
 command(process.execPath,[factory,'create',target,'AuthorNotes']);
 command(process.execPath,[factory,'create',target,'AuthorNotes'],root,1);
 fs.symlinkSync(path.join(root,'node_modules'),path.join(target,'node_modules'),'junction');
 const source=path.join(target,'src/Panel.vue'),edited=fs.readFileSync(source,'utf8').replaceAll('界面便笺','作者定制的便笺');
 fs.writeFileSync(source,edited);
 command(process.execPath,[path.join(root,'node_modules/vue-tsc/bin/vue-tsc.js'),'--noEmit'],target);
 command(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build'],target);
 command('python',[path.join(target,'package.py')],target);
 command(process.execPath,[factory,'upgrade-sdk',target]);assert.equal(fs.readFileSync(source,'utf8'),edited);
 // Isolated SDK candidate. No canonical SDK/source is edited for this experiment.
 const tool=path.join(base,'sdk-candidate');
 for(const name of ['scripts/framework-factory.mjs','framework/contracts.ts','framework/vue.ts','framework/connect.ts']){
  const dest=path.join(tool,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,name),dest);
 }
 fs.appendFileSync(path.join(tool,'framework/contracts.ts'),'\n// Controlled next SDK source revision for update-policy verification.\n');
 command(process.execPath,[path.join(tool,'scripts/framework-factory.mjs'),'upgrade-sdk',target]);
 assert.equal(fs.readFileSync(source,'utf8'),edited);assert.ok(fs.readFileSync(path.join(target,'vendor/stone-free/contracts.ts'),'utf8').includes('Controlled next SDK'));
 const vendor=path.join(target,'vendor/stone-free/vue.ts');fs.appendFileSync(vendor,'\n// Author SDK customization\n');
 const manifest=fs.readFileSync(path.join(target,'stone-free-sdk.json'),'utf8'),before=fs.readFileSync(vendor,'utf8');
 command(process.execPath,[factory,'upgrade-sdk',target],root,1);
 assert.equal(fs.readFileSync(vendor,'utf8'),before);assert.equal(fs.readFileSync(source,'utf8'),edited);assert.equal(fs.readFileSync(path.join(target,'stone-free-sdk.json'),'utf8'),manifest);
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}});await page.setContent('<main id="passages"></main>');
  await page.addStyleTag({path:path.join(target,'dist/style.css')});
  await page.addScriptTag({path:path.join(root,'dist/framework/host/index.js')});await page.addScriptTag({path:path.join(target,'dist/index.js')});
  assert.equal(await page.evaluate(()=>!!window.DoLGameUI),false);
  await page.getByRole('button',{name:'作者定制的便笺',exact:true}).click();await page.getByRole('textbox',{name:'作者定制的便笺',exact:true}).fill('作者拥有源码');
  assert.equal(await page.locator('textarea').inputValue(),'作者拥有源码');await page.evaluate(()=>DoLUiHost.dispose());assert.equal(await page.locator('[data-sf-owner]').count(),0);
 } finally {await browser.close()}
 const report={status:'passed',checks:['New source-owned project','Existing destination refused','Author-edited SFC checked/built/packaged','No official UI dependency','Same and controlled next SDK update preserve author SFC','Modified vendored SDK refused without partial overwrite','Generated component functions at 390px and cleans up'],limitations:['Existing locked dependencies reused through an explicit junction; fresh network installation not tested','Next SDK revision is a controlled source revision, not a published functional upgrade','No measured comparison against expert manual template/Agent work; timings are this run only'],timings};
 fs.writeFileSync(path.join(base,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks,directory:base},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
