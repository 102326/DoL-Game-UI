// Existing licensed game + isolated browser/origin; only generated test state, no user saves.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{createHash}=require('crypto'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),[game,inputs]=process.argv.slice(2),sha=b=>createHash('sha256').update(b).digest('hex');
const adapterVersion=JSON.parse(fs.readFileSync(path.join(root,'compat/smartphone-soft-wet/boot.json'),'utf8')).version;
(async()=>{
 assert.ok(game&&inputs,'Usage: node tests/smartphone-game.cjs GAME_HTML INPUT_DIRECTORY');
 const out=path.join(root,'tests/artifacts/smartphone-compat-20261020','game-'+Date.now());fs.mkdirSync(out,{recursive:true});
 const original=fs.readFileSync(game),files=['StoneFreeHost-0.1.4-experimental.mod.zip','DoLGameUI-3.0.2.mod.zip','SmartPhone.Alpha-v0.3.91.mod.zip'].map(n=>path.join(inputs,n));
 files.push(path.join(root,`compat/smartphone-soft-wet/dist/SmartPhoneSoftWet-SmartPhone Alpha-0.3.91-v${adapterVersion}.mod.zip`));
 const packages=files.map(f=>fs.readFileSync(f));
 const report={status:'failed',gameSha256:sha(original),packages:files.map((f,i)=>({file:path.basename(f),sha256:sha(packages[i])})),checks:[],pageErrors:[],network:'External requests blocked; missing vanilla image files are not a visual asset acceptance',data:'Fresh non-persistent browser context; generated phone/memos only'};
 let count=0;const html=original.toString('utf8').replace(/<script\b[^>]*>\s*window\.modDataValueZipList\s*=\s*(\[[\s\S]*?\])\s*;?\s*<\/script>/g,(_,list)=>{count++;return '<script>window.modDataValueZipList='+JSON.stringify([...JSON.parse(list),...packages.map(b=>b.toString('base64'))])+';</script>'});assert.equal(count,1);
 const server=http.createServer((req,res)=>{if(req.url!=='/'){res.writeHead(404);return res.end()}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch(require('./browser-options.cjs'));
 try{
  const p=await browser.newPage({viewport:{width:1363,height:900}});p.setDefaultTimeout(12000);p.on('pageerror',e=>report.pageErrors.push(e.message));
  const origin='http://127.0.0.1:'+server.address().port+'/';await p.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
  await p.goto(origin,{timeout:90000});await p.getByRole('button',{name:'\u4e86\u89e3',exact:true}).click({timeout:30000});
  await p.waitForFunction(()=>window.SmartPhoneSoftWet&&window.DoLGameUI&&window.SugarCube?.State?.variables?.Phone,{},{timeout:60000});
  report.runtime=await p.evaluate(()=>({game:StartConfig.version,loader:modUtils.version,ui:DoLGameUI.version,phone:modUtils.getMod('SmartPhone Alpha')?.version,adapter:modUtils.getMod('SmartPhoneSoftWet')?.version,browser:navigator.userAgent}));
  assert.equal(report.runtime.game,'0.5.12.13');assert.equal(report.runtime.phone,'0.3.91');assert.equal(report.runtime.adapter,adapterVersion);report.checks.push('Actual Loader executes author, UI, Host and candidate ZIPs');
  await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForFunction(()=>SugarCube.State.passage==='Start2');await p.waitForTimeout(100);
  await p.evaluate(()=>{smartphone.BuyPhone(smartphone.PhoneModelsMain[0]);smartphone.PhoneAddInit();smartphone.PhoneUIInit(true,true)});
  await p.waitForFunction(()=>document.querySelector('#phone-wrapper')?.dataset.dguAdapterMatch==='full').catch(async e=>{report.matchFailure=await p.evaluate(()=>({diagnostics:SmartPhoneSoftWet.getDiagnostics(),html:[...document.documentElement.attributes].map(a=>[a.name,a.value]),phone:document.querySelector('#smart-phone-container')?.outerHTML.slice(0,1000)}));await p.screenshot({path:path.join(out,'match-failure.png')});throw e});await p.waitForTimeout(500);
  await p.screenshot({path:path.join(out,'desktop.png')});
  await p.locator('#smart-phone-debug-switch').click();await p.waitForFunction(()=>document.querySelector('#smartphone_debug')?.dataset.dguAdapterMatch==='full');
  await p.locator('#excute-js').fill('1 + 1');await p.locator('#excute-js+a').click();await p.waitForFunction(()=>document.querySelector('#smartphone_debug_msg>div>span')?.textContent.trim()==='2');
  for(const [width,height] of [[1363,900],[390,700]]){await p.setViewportSize({width,height});const r=await p.locator('#smart-phone-debug-container').boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1);assert.ok(await p.locator('#smart-phone-debug-container').evaluate(n=>{n.scrollTop=0;return n.scrollHeight>n.clientHeight}));await p.screenshot({path:path.join(out,`debug-${width}.png`)})}
  await p.setViewportSize({width:1363,height:900});await p.locator('#smart-phone-debug-switch').click();await p.waitForSelector('#smartphone_debug',{state:'detached'});report.checks.push('Author debug toggle, harmless 1+1 command, original result, responsive scroll window and close work');
  await p.locator('.phone-app-icon[onclick*="memo"]').click();await p.waitForSelector('#new_task_text',{state:'attached'});await p.evaluate(()=>smartphone.Guide.closeTutorial());
  await p.waitForTimeout(400);await p.locator('.footer-actions button').first().click();await p.locator('#new_task_text').fill('isolated compatibility check');await p.locator('#new_task_text').press('Enter');
  assert.equal(await p.evaluate(()=>Object.values(V.Phone.Memos).filter(m=>m.text==='isolated compatibility check').length),1);
  await p.locator('.todo-item label').first().click();assert.equal(await p.evaluate(()=>Object.values(V.Phone.Memos)[0].isFinished),true);report.checks.push('Original app icon, memo creation via keyboard and checkbox callback update author state');
  await p.evaluate(()=>{for(let i=0;i<24;i++){const id='compat-fixture-'+i;V.Phone.Memos[id]={text:'Test scroll '+i,isImportant:false,isFinished:false};smartphone.addMemoTask(id,'Test scroll '+i)}});
  for(const [width,height,scale] of [[390,700,1],[900,390,1],[320,568,1.5]]){
   await p.setViewportSize({width,height});await p.evaluate(scale=>document.documentElement.style.setProperty('--phone-scale',String(scale)),scale);await p.waitForTimeout(450);
   const rect=await p.locator('#smart-phone-container').boundingBox();assert.ok(rect.x>=-1&&rect.y>=-1&&rect.x+rect.width<=width+1&&rect.y+rect.height<=height+1,JSON.stringify(rect));
   const scroll=await p.locator('#phone-content').evaluate(n=>{n.scrollTop=n.scrollHeight;return {top:n.scrollTop,max:n.scrollHeight-n.clientHeight}});assert.ok(scroll.top>0&&Math.abs(scroll.top-scroll.max)<2);
   await p.screenshot({path:path.join(out,`${width}x${height}-${scale}.png`)});
  }
  report.checks.push('Real memo content scrolls to bottom and window stays within portrait, landscape and 1.5x viewport bounds');
  await p.setViewportSize({width:1363,height:900});await p.evaluate(()=>document.documentElement.style.setProperty('--phone-scale','1'));
  await p.locator('.phone-tool-bar span[onclick*="toggleApp"]').click();await p.waitForSelector('.phone-desktop');
  await p.locator('.phone-app-icon[onclick*="settings"]').click();await p.waitForSelector('#phone-wallpaper-upload');
  const check=p.locator('#phone-content input[type=checkbox]').last(),before=await check.isChecked();await check.click();assert.equal(await p.evaluate(()=>V.Phone.Settings.NotificationClose),!before);report.checks.push('Native home navigation and settings checkbox callback preserved');
  await p.locator('.phone-tool-bar span[onclick*="togglePhone"]').click();await p.waitForFunction(()=>!document.querySelector('#smart-phone-container').classList.contains('phone-open'));
  await p.locator('#smart-phone-container').click();await p.waitForFunction(()=>document.querySelector('#smart-phone-container').classList.contains('phone-open'));report.checks.push('Native lock and reopen work');
  await p.evaluate(()=>{window.compatState=JSON.stringify(V.Phone);window.compatNode=document.querySelector('#phone-wallpaper-upload');SmartPhoneSoftWet.destroy()});
  assert.equal(await p.locator('[data-dgu-adapter=SmartPhoneSoftWet]').count(),0);assert.equal(await p.evaluate(()=>JSON.stringify(V.Phone)===compatState&&compatNode===document.querySelector('#phone-wallpaper-upload')),true);report.checks.push('Destroy removes presentation marks and preserves original nodes/phone state');
  await p.waitForTimeout(450);await p.screenshot({path:path.join(out,'native-after-destroy.png')});
  // Baseline without this adapter also emits one generic Event; reject additional errors.
  assert.ok(report.pageErrors.length<=1&&report.pageErrors.every(e=>e==='Event'),JSON.stringify(report.pageErrors));
  report.status='passed';
 }catch(e){report.error=e.message;throw e}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(out);await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
