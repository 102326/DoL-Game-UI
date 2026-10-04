const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url'),{execFileSync}=require('node:child_process');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const archived=execFileSync('python',['-c',"import zipfile,sys; sys.stdout.buffer.write(zipfile.ZipFile(sys.argv[1]).read('game-ui.js'))",path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'),'releases/mods/DoLGameUI-0.5.2.mod.zip')],{maxBuffer:2e6}).toString('utf8');
 const evidence={};
 for(const version of ['0.5.2','current']){
  const p=await b.newPage({viewport:{width:1704,height:1136}});await p.goto(pathToFileURL(path.join(__dirname,'fixture.html')).href);await p.waitForSelector('#listContainer');
  await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag(version==='current'?{path:path.join(__dirname,'../dist/game-ui.js')}:{content:archived});
  await p.waitForTimeout(3200);
  evidence[version]=await p.evaluate(async()=>{
   const host=document.getElementById('ui-bar'),node=document.createElement('span');host.append(node);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
   let calls=0;const sync=DMTLayout.sync;DMTLayout.sync=function(...args){calls++;return sync.apply(this,args)};
   for(let i=0;i<20;i++){node.textContent=String(i);await new Promise(r=>setTimeout(r,20))}
   DMTLayout.sync=sync;return {sidebarTextMutations:20,layoutSyncCalls:calls};
  });
  if(version==='current'){
   assert.equal(evidence[version].layoutSyncCalls,0);
   await p.evaluate(()=>{window.beforeUI=JSON.stringify(SugarCube.State.variables);DoLGameUI.openSettings()});
   await p.getByRole('button',{name:'回退原版界面',exact:true}).click();
   assert.equal(await p.evaluate(()=>document.documentElement.hasAttribute('data-dol-midnight')),false);assert.equal(await p.locator('.dcu-shell').count(),0);assert.equal(await p.evaluate(()=>DoLWardrobeUI.getEnabled()),true);
   await p.getByRole('button',{name:'启用新版界面',exact:true}).click();await p.waitForSelector('.dcu-shell');
   assert.equal(await p.evaluate(()=>JSON.stringify(SugarCube.State.variables)===beforeUI),true);
   // A refused wardrobe switch must not partially disable the remaining UI.
   await p.evaluate(()=>{window.realWardrobe=DoLWardrobeUI.setEnabled;window.realBusy=DoLWardrobeUI.isBusy;DoLWardrobeUI.setEnabled=()=>{};DoLWardrobeUI.isBusy=()=>true});
   await p.locator('#dmt-wardrobe').selectOption('original');assert.equal(await p.locator('#dmt-wardrobe').inputValue(),'new','refused native mode change restores the select');
   await p.getByRole('button',{name:'回退原版界面',exact:true}).click();assert.equal(await p.evaluate(()=>DoLMidnightTheme.getPreferences().enabled),true);assert.ok(await p.getByRole('status').filter({hasText:'衣柜正在处理'}).count());
   await p.evaluate(()=>{DoLWardrobeUI.setEnabled=realWardrobe;DoLWardrobeUI.isBusy=realBusy});await p.locator('.dmt-close').click();
   await p.evaluate(()=>{const old=document.getElementById('overlayButtons')||document.getElementById('menu');const next=document.createElement('div');next.id=old.id;old.replaceWith(next)});
   await p.waitForFunction(()=>{const b=document.getElementById('dol-midnight-sidebar-button');return b?.isConnected&&b.parentElement.id==='overlayButtons'||b?.isConnected&&b.parentElement.id==='menu'});
   assert.equal(await p.locator('#dol-midnight-sidebar-button').count(),1);
   await p.evaluate(async()=>{document.getElementById('dol-midnight-sidebar-button').remove();await Promise.resolve();DoLGameUI.destroy();await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame)});
   assert.equal(await p.locator('#dol-midnight-controls,#dol-midnight-sidebar-button').count(),0);
  }
  await p.close();
 }
 assert.ok(evidence['0.5.2'].layoutSyncCalls>0);
 fs.writeFileSync(path.join(__dirname,'artifacts/settings-lifecycle.json'),JSON.stringify({passed:true,evidence,scope:'Isolated desktop fixture, invocation counts not frame-time or Android benchmark'},null,2));
 console.log('PASS recovery preserves game state, busy refusal, host replacement, queued teardown; sidebar sync counts',evidence);
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
