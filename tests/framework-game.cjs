// Real, caller-owned compiled DoL; new browser context/origin; no user storage.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto'),{chromium}=require('playwright');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),file=process.argv[2];
const sha=x=>createHash('sha256').update(x).digest('hex');
(async()=>{
 assert.ok(file&&fs.statSync(file).isFile(),'Pass an existing, licensed compiled game HTML');
 const original=fs.readFileSync(file),text=original.toString('utf8');
 const pattern=/<script\b[^>]*>\s*window\.modDataValueZipList\s*=\s*(\[[\s\S]*?\])\s*;?\s*<\/script>/g;
 assert.equal([...text.matchAll(pattern)].length,1,'One standard embedded Mod block required');
 const workspace=process.argv.includes('--workspace'),shared=process.argv.includes('--shared-vue');
 assert.ok(!(workspace&&shared),'Choose one research variant');
 const names=shared?['StoneFreeHost','StoneFreeVueResearch','StoneFreeNativeStatus','StoneFreeStatusComparison','StoneFreeWorkspace']:['StoneFreeHost','StoneFreeNativeStatus','StoneFreeStatusComparison',...(workspace?['StoneFreeWorkspace','StoneFreeAlternateWorkspace']:[])];
 const archives=names.map(name=>fs.readFileSync(path.join(root,`dist/${shared&&name!=='StoneFreeHost'?'framework-vue-comparison':'framework'}/${name}-0.1.1-experimental.mod.zip`)));
 const authorIndex=process.argv.indexOf('--author-zip');let authorName=null;
 if(authorIndex!==-1){const author=process.argv[authorIndex+1];assert.ok(author&&fs.statSync(author).isFile(),'Pass an existing owned author ZIP');
  const boot=JSON.parse(execFileSync('python',['-c',"import zipfile,sys; print(zipfile.ZipFile(sys.argv[1]).read('boot.json').decode('utf-8'))",author],{encoding:'utf8',windowsHide:true}));
  assert.match(boot.name,/^[A-Za-z][A-Za-z0-9]{0,63}$/);assert.ok(!names.includes(boot.name),'No duplicate author package');authorName=boot.name;names.push(authorName);archives.push(fs.readFileSync(author));
 }
 const html=text.replace(pattern,`<script>window.modDataValueZipList=${JSON.stringify(archives.map(b=>b.toString('base64')))};</script>`);
 const server=http.createServer((req,res)=>{
  if(req.url!=='/'){res.writeHead(404);return res.end()}
  res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Security-Policy',"default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'none'; img-src 'none'; frame-src 'none'; worker-src 'none'; form-action 'none'");res.end(html);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const dir=path.join(root,'tests/artifacts',shared?'stone-free-vue':'stone-free-foundation','game-'+Date.now());fs.mkdirSync(dir,{recursive:true});
 const report={status:'failed',environment:'Real compiled DoL in isolated desktop browser; no gameplay or age confirmation',originalHtmlSha256:sha(original),transformation:'In-memory replacement of embedded Mod ZIP list with the selected owned research packages',packages:names.map((name,i)=>({name,sha256:sha(archives[i])})),checks:[]};
 try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(10000);
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{timeout:60000});
  await page.waitForFunction(()=>window.DoLUiHost&&document.querySelector('[data-sf-owner="StatusComparison"] button'),{},{timeout:60000});
  if(workspace)await page.waitForFunction(()=>DoLUiHost.getDiagnostics().participants.includes('AlternateWorkspace'));
  report.runtime=await page.evaluate(()=>({game:StartConfig?.version,loader:modUtils.version,sugarCube:String(SugarCube.version),officialUi:!!window.DoLGameUI,loaded:modUtils.getModListNameNoAlias().map(name=>({name,version:modUtils.getMod(name)?.version})),host:DoLUiHost.getDiagnostics()}));
  assert.equal(report.runtime.officialUi,false);for(const name of names)assert.ok(report.runtime.loaded.some(x=>x.name===name));
  assert.equal(report.runtime.host.errors.length,0);report.checks.push('Actual ModLoader loaded the selected research ZIPs without official UI or MapleBirch');
  if(shared){report.sharedVue=await page.evaluate(()=>({version:window.StoneFreeVueExperimental?.version,protocol:window.StoneFreeVueExperimental?.protocol}));assert.equal(report.sharedVue.version,JSON.parse(fs.readFileSync(path.join(root,'dist/framework-vue-comparison/inputs.json'),'utf8')).vueVersion);assert.equal(report.runtime.host.views.length,2);report.checks.push('Shared Vue dependency and two source-identical consumers load under the real ModLoader')}
  if(workspace){assert.equal(report.runtime.host.views.length,authorName?3:2);assert.equal(report.runtime.host.claims.filter(c=>c.key==='information-workspace').length,1);report.checks.push('Public views and exclusive layout-region acquisition exist under the real Loader')}
  if(authorName){assert.ok(report.runtime.host.participants.includes(authorName));assert.ok(report.runtime.host.views.some(v=>v.owner===authorName&&v.id==='note'));report.checks.push('Source-owned author ZIP registers its participant and public note view without official UI')}
  const projected=await page.evaluate(async()=>{
   const r=await DoLUiHost.sources('dol.status.experimental')[0].read(DoLUiHost.binding());
   const v=SugarCube.State.variables;const original={};for(const field of ['pain','stress','tiredness'])original[field]=typeof v[field]==='number'&&Number.isFinite(v[field])?v[field]:null;
   return {r,original};
  });assert.equal(projected.r.ok,true);assert.deepEqual(projected.r.value,projected.original);report.checks.push('Projection matches current native values (missing values remain null; no state writes)');
  await page.waitForTimeout(500);
  report.uiObservation=await page.evaluate(()=>({ownRoots:[...document.querySelectorAll('[data-sf-owner]')].map(n=>({owner:n.dataset.sfOwner,ariaHidden:n.getAttribute('aria-hidden'),visible:getComputedStyle(n).visibility,display:getComputedStyle(n).display})),nativeDialogTitle:document.querySelector('#ui-dialog-title')?.textContent?.slice(0,120),bodyClass:document.body.className,diagnostics:DoLUiHost.getDiagnostics()}));
  await page.screenshot({path:path.join(dir,'pre-interaction.png')});
  if(report.uiObservation.ownRoots.every(n=>n.ariaHidden==='true')){
   const knownAgeGate=/WELCOME TO DEGREES OF LEWDITY/i.test(report.uiObservation.nativeDialogTitle??'');
   report.status='passed-with-limitations';report.limitations=[knownAgeGate?'Original age-confirmation dialog blocks subsequent interaction; not acknowledged or bypassed':'Native UI marks research roots aria-hidden; cause unknown, interaction not forced','Actual UI clicks and native bridge event checks remain outside this fresh-game run; browser fixtures and authorized existing Android game are separate evidence'];
   await page.evaluate(()=>DoLUiHost.dispose());assert.equal(await page.locator('[data-sf-owner]').count(),0);
   return;
  }
  await page.getByRole('button',{name:'状态对照',exact:true}).click();await page.getByRole('button',{name:'设为对照',exact:true}).click();
  assert.equal(await page.locator('dialog[open]').count(),1);await page.screenshot({path:path.join(dir,'independent-comparison.png')});
  await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);report.checks.push('Comparison, native dialog, Escape and original opener focus');
  assert.equal(await page.getByRole('button',{name:'状态对照',exact:true}).evaluate(n=>n===document.activeElement),true);
  // Emit only the lifecycle cue; do not navigate or create a game moment.
  const lifecycle=await page.evaluate(()=>{
   const binding=DoLUiHost.binding(),owner=DoLUiHost.register('LifecycleCheck');
   owner.mount({id:'transient',parent:document.querySelector('#passages')||document.body,lifetime:'passage',setup(c){c.element.textContent='own probe'}});
   jQuery(document).triggerHandler(':passageinit');const invalid=!binding.isCurrent()&&binding.signal.aborted&&!DoLUiHost.getDiagnostics().mounts.some(x=>x.owner==='LifecycleCheck');
   jQuery(document).triggerHandler(':passageend');const live=DoLUiHost.binding().isCurrent();owner.dispose();return {invalid,live};
  });assert.deepEqual(lifecycle,{invalid:true,live:true});report.checks.push('Actual jQuery/SugarCube bridge invalidates passage mounts and refreshes persistent consumers');
  await page.evaluate(()=>DoLUiHost.dispose());assert.equal(await page.locator('[data-sf-owner]').count(),0);report.status='passed';
 } finally {fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(resolve=>server.close(resolve))}
 console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
