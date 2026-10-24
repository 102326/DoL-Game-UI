const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process'),{chromium}=require('playwright');
const {buildSync}=require('esbuild');
const root=path.resolve(__dirname,'..'),base=path.join(root,'tests/artifacts/stone-free-foundation','factory-'+Date.now());
fs.mkdirSync(base,{recursive:true});const target=path.join(base,'author-mod'),factory=path.join(root,'scripts/framework-factory.mjs');
const timings=[],extra=[];
function command(executable,args,cwd=root,expected=0){
 const start=Date.now(),r=spawnSync(executable,args,{cwd,encoding:'utf8',windowsHide:true});
 fs.appendFileSync(path.join(base,'commands.log'),JSON.stringify({executable,args,cwd,status:r.status,stdout:r.stdout,stderr:r.stderr})+'\n');
 assert.equal(r.status,expected,r.stderr||r.stdout);timings.push({operation:args[0],ms:Date.now()-start});return r;
}
(async()=>{
 command(process.execPath,[factory,'create',target,'AuthorNotes']);
 command(process.execPath,[factory,'create',target,'AuthorNotes'],root,1);
 fs.symlinkSync(path.join(root,'node_modules'),path.join(target,'node_modules'),'junction');
 const authorPaths=['src/main.ts','src/preview.ts','index.html','vite.config.mts','package.json'];
 const authorFiles=Object.fromEntries(authorPaths.map(p=>[p,fs.readFileSync(path.join(target,p),'utf8')]));
 const source=path.join(target,'src/Panel.vue'),edited=fs.readFileSync(source,'utf8').replaceAll('界面便笺','作者定制的便笺');
 fs.writeFileSync(source,edited);
 const checkBefore=fs.readFileSync(path.join(target,'stone-free-sdk.json'),'utf8'),checkAligned=JSON.parse(command(process.execPath,[factory,'check-sdk',target]).stdout);assert.equal(checkAligned.canReplace,true);assert.ok(checkAligned.files.every(x=>x.status==='aligned'));assert.equal(fs.readFileSync(path.join(target,'stone-free-sdk.json'),'utf8'),checkBefore);
 const checkFile=path.join(target,'vendor/stone-free/connect.ts'),checkBytes=fs.readFileSync(checkFile);fs.unlinkSync(checkFile);
 assert.equal(JSON.parse(command(process.execPath,[factory,'check-sdk',target]).stdout).files.find(x=>x.name==='connect.ts').status,'missing');fs.mkdirSync(checkFile);
 assert.equal(JSON.parse(command(process.execPath,[factory,'check-sdk',target]).stdout).files.find(x=>x.name==='connect.ts').status,'not-file');fs.rmdirSync(checkFile);fs.writeFileSync(checkFile,checkBytes);assert.equal(fs.readFileSync(path.join(target,'stone-free-sdk.json'),'utf8'),checkBefore);extra.push('SDK inspection reports missing and non-file managed entries without changing the manifest');
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
 const checkModified=JSON.parse(command(process.execPath,[factory,'check-sdk',target]).stdout);assert.equal(checkModified.canReplace,false);assert.equal(checkModified.files.find(x=>x.name==='vue.ts').status,'author-modified');assert.equal(fs.readFileSync(vendor,'utf8'),before);assert.equal(fs.readFileSync(path.join(target,'stone-free-sdk.json'),'utf8'),manifest);extra.push('Read-only SDK inspection identifies the exact author-modified file without changing its manifest or content');
 command(process.execPath,[factory,'upgrade-sdk',target],root,1);
 assert.equal(fs.readFileSync(vendor,'utf8'),before);assert.equal(fs.readFileSync(source,'utf8'),edited);assert.equal(fs.readFileSync(path.join(target,'stone-free-sdk.json'),'utf8'),manifest);
 for(const [p,value] of Object.entries(authorFiles))assert.equal(fs.readFileSync(path.join(target,p),'utf8'),value);
 extra.push('SDK updates preserve author entry, preview and build files');
 const secondEdit=edited.replace('v-model="note"','v-model="note" maxlength="120"');assert.notEqual(secondEdit,edited);fs.writeFileSync(source,secondEdit);
 command(process.execPath,[path.join(root,'node_modules/vue-tsc/bin/vue-tsc.js'),'--noEmit'],target);
 command(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build'],target);
 command('python',[path.join(target,'package.py')],target);
 extra.push('Second author-owned SFC change still checks, builds and packages after SDK updates');
 const historical='d666095647fe31c684eb80e471633efa0500ae6f',seed=path.join(base,'historical-sdk'),legacy=path.join(base,'legacy-author');
 for(const name of ['scripts/framework-factory.mjs','framework/contracts.ts','framework/vue.ts','framework/connect.ts','framework/host.ts','framework/boot.ts','framework/factory/Panel.vue','framework/factory/vite.config.mjs','framework/factory/package.py','LICENSE']){
  const contents=command('git',['show',`${historical}:${name}`]).stdout,dest=path.join(seed,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,contents);
 }
 command(process.execPath,[path.join(seed,'scripts/framework-factory.mjs'),'create',legacy,'LegacyAuthorNotes']);
 fs.symlinkSync(path.join(root,'node_modules'),path.join(legacy,'node_modules'),'junction');
 const oldPanel=path.join(legacy,'src/Panel.vue'),oldMain=path.join(legacy,'src/main.ts');
 fs.writeFileSync(oldPanel,fs.readFileSync(oldPanel,'utf8').replaceAll('界面便笺','历史作者便笺'));
 const mainWithDispose=fs.readFileSync(oldMain,'utf8').replace('\nconnectConsumer(host=>','\nexport const dispose=connectConsumer(host=>');
 assert.ok(mainWithDispose.includes('export const dispose='));fs.writeFileSync(oldMain,mainWithDispose);
 command(process.execPath,[path.join(root,'node_modules/vue-tsc/bin/vue-tsc.js'),'--noEmit'],legacy);
 command(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build'],legacy);
 const oldBytes=fs.readFileSync(path.join(legacy,'dist/index.js'),'utf8'),legacySource=fs.readFileSync(oldPanel,'utf8');
 assert.equal(fs.readFileSync(path.join(legacy,'vendor/stone-free/vue.ts'),'utf8').includes('export function useProjection'),false);
 const oldManifest=fs.readFileSync(path.join(legacy,'stone-free-sdk.json'),'utf8'),checkOld=JSON.parse(command(process.execPath,[factory,'check-sdk',legacy]).stdout);assert.equal(checkOld.canReplace,true);assert.ok(checkOld.files.some(x=>x.status==='source-different'));assert.equal(fs.readFileSync(path.join(legacy,'stone-free-sdk.json'),'utf8'),oldManifest);extra.push('Read-only SDK inspection distinguishes a recorded historical SDK from author customization');
 command(process.execPath,[factory,'upgrade-sdk',legacy]);
 assert.ok(fs.readFileSync(path.join(legacy,'vendor/stone-free/vue.ts'),'utf8').includes('export function useProjection'));
 assert.equal(fs.readFileSync(oldPanel,'utf8'),legacySource);assert.equal(fs.readFileSync(oldMain,'utf8'),mainWithDispose);assert.equal(fs.existsSync(path.join(legacy,'index.html')),false);
 command(process.execPath,[path.join(root,'node_modules/vue-tsc/bin/vue-tsc.js'),'--noEmit'],legacy);
 command(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build'],legacy);command('python',[path.join(legacy,'package.py')],legacy);
 const upgradedBytes=fs.readFileSync(path.join(legacy,'dist/index.js'),'utf8');assert.notEqual(oldBytes,upgradedBytes);
 extra.push('Actual first-round SDK upgrades to current SDK without rewriting legacy author files or adding template files');
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(5000);
  await page.route('http://author.test/',r=>r.fulfill({contentType:'text/html',body:'<main id="passages"></main>'}));await page.goto('http://author.test/');
  await page.addStyleTag({path:path.join(target,'dist/style.css')});
  await page.addScriptTag({path:path.join(root,'dist/framework/host/index.js')});
  // This fixture has no SugarCube events to finish the native scene bridge.
  await page.evaluate(()=>DoLUiHost.sceneReady());
  await page.addScriptTag({path:path.join(target,'dist/index.js')});
  assert.equal(await page.evaluate(()=>!!window.DoLGameUI),false);
  await page.getByRole('button',{name:'作者定制的便笺',exact:true}).click();await page.getByRole('textbox',{name:'作者定制的便笺',exact:true}).fill('作者拥有源码');
  assert.equal(await page.locator('textarea').inputValue(),'作者拥有源码');assert.equal(await page.locator('textarea').getAttribute('maxlength'),'120');
  await page.addStyleTag({path:path.join(root,'dist/framework/workspace/style.css')});await page.addScriptTag({path:path.join(root,'dist/framework/workspace/index.js')});
  const workspace=page.locator('[data-sf-owner="StoneFreeWorkspace"]');await workspace.getByRole('button',{name:'信息工作台',exact:true}).click();
  const inline=workspace.locator('[data-view="AuthorNotes:note"]');await inline.getByRole('textbox',{name:'作者定制的便笺',exact:true}).fill('工作台实例');
  assert.equal(await inline.locator('.author-note').evaluate(n=>getComputedStyle(n).position),'static');
  await workspace.locator('dialog').getByRole('button',{name:'关闭',exact:true}).click();assert.equal(await page.locator('[data-sf-owner="AuthorNotes"][data-sf-mount="panel"] textarea').inputValue(),'作者拥有源码');
  await workspace.getByRole('button',{name:'信息工作台',exact:true}).click();assert.equal(await inline.locator('textarea').inputValue(),'');await workspace.locator('dialog').getByRole('button',{name:'关闭',exact:true}).click();
  await page.evaluate(()=>{StoneFree_workspace.dispose();StoneFreeAuthor_AuthorNotes.dispose();const probe=StoneFree_host.installHost();if(probe)probe.dispose()});
  assert.equal(await page.locator('[data-sf-owner]').count(),0);extra.push('Generated public view composes without moving native DOM; per-view notes and close cleanup stay independent');await page.close();
  const {createServer}=await import('vite');const preview=await createServer({root:target,cacheDir:path.join(base,'preview-cache'),configFile:path.join(target,'vite.config.mts'),server:{host:'127.0.0.1',port:0,hmr:false}});
  try {await preview.listen();const p=await browser.newPage({viewport:{width:390,height:844}});await p.goto(preview.resolvedUrls.local[0]);const note=p.getByRole('textbox',{name:'作者定制的便笺',exact:true});await note.fill('真实 SFC 预览');assert.equal(await note.inputValue(),'真实 SFC 预览');assert.deepEqual(await p.evaluate(()=>({host:!!window.DoLUiHost,game:!!window.SugarCube})),{host:false,game:false});await p.screenshot({path:path.join(base,'component-preview.png')});await p.close();}
  finally {await preview.close()}
  extra.push('Generated ordinary Vite preview uses the author SFC without a game, mock Host or official UI');
  const oldHost=buildSync({entryPoints:[path.join(seed,'framework/boot.ts')],bundle:true,write:false,format:'iife',globalName:'LegacyHost'}).outputFiles[0].text;
  const fallback=await browser.newPage();await fallback.setContent('<main id="passages"></main>');await fallback.addStyleTag({path:path.join(legacy,'dist/style.css')});await fallback.addScriptTag({content:oldHost});
  // This actual 0.1.0 Host predates the documented >=0.1.2 SDK contract.
  assert.equal(await fallback.evaluate(()=>typeof DoLUiHost.getCapabilities),'undefined');
  await fallback.addScriptTag({path:path.join(target,'dist/index.js')});
  assert.equal(await fallback.locator('[data-sf-owner]').count(),0,'Current SDK must reject an unsupported historical Host');
  await fallback.evaluate(()=>StoneFreeAuthor_AuthorNotes.dispose());
  await fallback.addScriptTag({content:oldBytes});
  await fallback.getByRole('button',{name:'历史作者便笺',exact:true}).click();await fallback.getByRole('textbox',{name:'历史作者便笺',exact:true}).fill('旧 Host 入口');
  await fallback.evaluate(()=>{AuthorMod.dispose();DoLUiHost.dispose()});assert.equal(await fallback.locator('[data-sf-owner]').count(),0);await fallback.close();
  extra.push('Historical SDK still runs on its actual 0.1.0 Host; current SDK safely rejects this pre-minimum contract');
  const outcomes=[];
  for(const bytes of [oldBytes,upgradedBytes]){const p=await browser.newPage();await p.setContent('<main id="passages"></main>');await p.addStyleTag({path:path.join(legacy,'dist/style.css')});await p.addScriptTag({path:path.join(root,'dist/framework/host/index.js')});await p.addScriptTag({content:bytes});await p.getByRole('button',{name:'历史作者便笺',exact:true}).click();await p.getByRole('textbox',{name:'历史作者便笺',exact:true}).fill('历史作者内容');const value=await p.locator('textarea').inputValue();await p.evaluate(()=>{AuthorMod.dispose();DoLUiHost.dispose()});outcomes.push({value,roots:await p.locator('[data-sf-owner]').count()});await p.close();}
  assert.deepEqual(outcomes[0],outcomes[1]);assert.deepEqual(outcomes[0],{value:'历史作者内容',roots:0});extra.push('Actual old and upgraded SDK builds preserve the same legacy note interaction and teardown outcome');
 } finally {await browser.close()}
 const styledArchive=path.join(base,'AuthorNotes-with-styles.mod.zip');fs.copyFileSync(path.join(target,'dist/AuthorNotes-0.1.0.mod.zip'),styledArchive);fs.writeFileSync(path.join(base,'author-second-edit.vue'),secondEdit);
 const noCss=fs.readFileSync(source,'utf8').replace(/<style scoped>[\s\S]*?<\/style>/,'');fs.writeFileSync(source,noCss);command(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build'],target);command('python',[path.join(target,'package.py')],target);assert.equal(fs.existsSync(path.join(target,'dist/style.css')),false);
 command('python',['-c',"import json,zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); b=json.loads(z.read('boot.json')); assert b['styleFileList']==[]; assert not any(k in z.namelist() for k in ['index.html','preview.ts','src/preview.ts','stone-free-sdk.json']); assert set(z.namelist())=={'index.js','boot.json','LICENSE','README.md','THIRD-PARTY-NOTICES.txt'}",path.join(target,'dist/AuthorNotes-0.1.0.mod.zip')]);extra.push('An author component without CSS packages successfully; preview and internal SDK manifest never ship');
 const report={status:'passed',checks:['New source-owned project','Existing destination refused','Author-edited SFC checked/built/packaged','No official UI dependency','Same and controlled next SDK update preserve author SFC','Modified vendored SDK refused without partial overwrite','Generated component functions at 390px and cleans up',...extra],historicalSdkBaseline:historical,limitations:['Existing locked dependencies reused through an explicit junction; fresh network installation not tested','Controlled next SDK revision tests update policy; the separate real historical upgrade verifies an actual implementation change','Historical source built with current installed dependencies, not a historical dependency reinstall','No measured comparison against expert manual template/Agent work; timings are this run only','Browser component/workspace checks do not prove Android touch or native gameplay'],timings};
 fs.writeFileSync(path.join(base,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks,directory:base},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
