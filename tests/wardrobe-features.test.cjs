const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');

const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});

(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
 await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
 await p.goto(`http://127.0.0.1:${server.address().port}/game`,{waitUntil:'load',timeout:90000});await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options,{timeout:60000});await p.waitForLoadState('networkidle');
 await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForLoadState('networkidle');
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 await p.evaluate(()=>{
   V.location='home';V.sewingKit=1;V.wardrobe_location='wardrobe';V.lastWardrobeSlot='upper';V.settings.multipleWardrobes=true;
   const slots=Object.keys(V.wardrobe).filter(k=>Array.isArray(V.wardrobe[k]));
   const target={name:'测试转移衣柜',unlocked:true,shopSend:true,transfer:true,space:4};
   for(const slot of slots)target[slot]=[];
   V.wardrobes={...(V.wardrobes||{}),dgwTest:target};
   const defs=setup.clothes.upper.filter(d=>d.name!=='naked'&&!d.outfitPrimary&&!d.outfitSecondary).slice(0,2);
   window.repairNames=defs.map((d,i)=>{d.cn_name_cap=`修理测试${i+1}`;const item=structuredClone(d);item.cn_name_cap=d.cn_name_cap;item.integrity=Math.max(1,Math.floor((d.integrity_max??100)/2));item.integrity_max=d.integrity_max??100;item.colour=item.colour_options?.[0]??0;item.accessory_colour=item.accessory_colour_options?.[0]??0;V.wardrobe.upper.push(item);return item.cn_name_cap});
   SugarCube.Engine.play('Wardrobe');
 });
 await p.waitForSelector('.dgw-shell');await p.waitForFunction(()=>document.querySelector('.dgw-preview')?.getAttribute('aria-busy')==='false');
 await p.evaluate(()=>{window.repairItems=repairNames.map(name=>V.wardrobe.upper.find(item=>item.cn_name_cap===name))});
 assert.equal(await p.locator('.error').count(),0,'feature fixture has no native error nodes');
 const prefs=p.locator('.dgw-preferences');await prefs.locator('summary').click();
 const prefChecks=prefs.locator('input[type=checkbox]');assert.equal(await prefChecks.count(),2,'native wardrobe display settings expose both fields');
 await prefChecks.nth(0).check();await p.locator('.dgw-preferences summary').click();await p.locator('.dgw-preferences input[type=checkbox]').nth(1).check();assert.deepEqual(await p.evaluate(()=>({showTraits:V.wardrobeDefaults.showTraits,extraInfo:V.wardrobeDefaults.extraInfo})),{showTraits:true,extraInfo:true},'display settings write native wardrobeDefaults fields');
 await prefs.locator('summary').click();
 await p.getByRole('button',{name:'裹上毛巾',exact:true}).click();await p.waitForFunction(()=>V.worn.upper.variable===setup.clothes.upper[3].variable);assert.equal(await p.evaluate(()=>V.worn.upper.variable),await p.evaluate(()=>setup.clothes.upper[3].variable),'towel action changes worn upper through native macro');
 await p.getByRole('button',{name:'裹上大浴巾',exact:true}).click();await p.waitForFunction(()=>V.worn.upper.variable===setup.clothes.upper[14].variable&&V.worn.lower.variable===setup.clothes.lower[15].variable);assert.equal(await p.evaluate(()=>V.worn.lower.variable),await p.evaluate(()=>setup.clothes.lower[15].variable),'large towel changes both worn slots through native macro');
 await p.evaluate(()=>{V.tailorMonthlyService='repair';DoLWardrobeUI.refresh()});assert.ok(await p.locator('.dgw-tailor a').count()>0,'repair service entry is exposed');await p.evaluate(()=>{V.tailorMonthlyService=1;DoLWardrobeUI.refresh()});
 assert.equal(await p.evaluate(()=>({sewingKit:V.sewingKit,location:V.location,multiple:V.settings.multipleWardrobes})).then(x=>JSON.stringify(x)),JSON.stringify({sewingKit:1,location:'home',multiple:true}),'repair fixture matches native prerequisites');
 await p.getByRole('button',{name:'整理模式',exact:true}).click();
 assert.ok(await p.getByRole('button',{name:'修理衣物',exact:true}).isVisible(),'repair action is exposed when sewing kit and home conditions match');
 assert.ok(await p.getByRole('combobox',{name:'转移到衣柜'}).isVisible(),'transfer target selector is exposed when multiple wardrobes allow it');
 const repairKeys=await p.evaluate(()=>repairItems.map(item=>'upper:'+V.wardrobe.upper.indexOf(item)));
 for(const key of repairKeys)await p.locator(`.dgw-item[data-key="${key}"]`).click();
 const beforeRepair=await p.evaluate(()=>repairItems.map(item=>item.integrity));
 const beforeRepairTime=await p.evaluate(()=>V.timeStamp);
 await p.getByRole('button',{name:'修理衣物',exact:true}).click();
 assert.match(await p.locator('.dgw-confirm').textContent(),/确认修理/);assert.match(await p.locator('.dgw-confirm').textContent(),/10 分钟/);
 assert.deepEqual(await p.evaluate(()=>repairItems.map(item=>item.integrity)),beforeRepair,'repair review performs no write');
 await p.getByRole('button',{name:'确认修理',exact:true}).click();
 await p.waitForFunction(()=>repairItems.every(item=>item.integrity>=item.integrity_max));
 assert.ok((await p.locator('.dgw-message').textContent()).includes('已修理 2'),'batch repair reports both selected items');
 assert.equal(await p.evaluate(time=>V.timeStamp-time,beforeRepairTime),600,'repair costs five minutes per selected item');
 assert.equal(await p.evaluate(()=>V.wardrobeOption),'wear','repair resets native mode after batch processing');

 await p.getByRole('button',{name:'退出整理',exact:true}).click();await p.getByRole('button',{name:'整理模式',exact:true}).click();
 const targetBefore=await p.evaluate(()=>({source:V.wardrobe.upper.length,target:V.wardrobes.dgwTest.upper.length,item:repairItems[0]}));
 const transferKey=await p.evaluate(()=>'upper:'+V.wardrobe.upper.indexOf(repairItems[0]));await p.locator(`.dgw-item[data-key="${transferKey}"]`).click();
 await p.getByRole('combobox',{name:'转移到衣柜'}).selectOption('dgwTest');await p.getByRole('button',{name:'转移衣物',exact:true}).click();
 assert.match(await p.locator('.dgw-confirm').textContent(),/确认转移/);assert.match(await p.locator('.dgw-confirm').textContent(),/转入所选衣柜/);
 await p.getByRole('button',{name:'确认转移',exact:true}).click();await p.waitForFunction(()=>!V.wardrobe.upper.includes(repairItems[0]));
 assert.equal(await p.evaluate(()=>V.wardrobes.dgwTest.upper.includes(repairItems[0])),true,'transfer moves the selected native object to target inventory');
 assert.equal(await p.evaluate(()=>V.wardrobe.upper.length),targetBefore.source-1);

 // The new UI prechecks capacity at <=; the upstream macro itself uses >.
 await p.evaluate(()=>{
   const target=V.wardrobes.dgwTest;target.upper.length=0;for(let i=0;i<target.space;i++)target.upper.push(structuredClone(repairItems[1]));
   V.wardrobe.upper.push(repairItems[0]);DoLWardrobeUI.refresh();
 });
 const fullTargetKey=await p.evaluate(()=>'upper:'+V.wardrobe.upper.indexOf(repairItems[0]));await p.locator(`.dgw-item[data-key="${fullTargetKey}"]`).click();
 await p.getByRole('button',{name:'转移衣物',exact:true}).click();
 await p.waitForTimeout(250);
 assert.equal(await p.evaluate(()=>V.wardrobe.upper.includes(repairItems[0])),true,'full target refuses transfer');
 assert.equal(await p.evaluate(()=>V.wardrobes.dgwTest.upper.length),await p.evaluate(()=>V.wardrobes.dgwTest.space),'full target remains at exact capacity');
 assert.match(await p.locator('.dgw-message').textContent(),/空间|无法转移|容量/);

 // Paired outfit repair, stale destination and linked-slot capacity guards.
 await p.evaluate(()=>{
  const d=setup.clothes.upper.find(d=>d.outfitPrimary?.lower&&!['broken','split'].includes(d.outfitPrimary.lower)&&Object.keys(d.outfitPrimary).length===1);
  const lower=setup.clothes.lower.find(x=>x.name===d.outfitPrimary.lower&&x.modder===d.modder);
  window.pairedPrimary=structuredClone(d);window.pairedSecondary=structuredClone(lower);
  for(const item of [pairedPrimary,pairedSecondary]){item.colour=0;item.accessory_colour=0;item.integrity=1}
  pairedPrimary.cn_name_cap='关联修理转移测试';V.wardrobe.upper.push(pairedPrimary);V.wardrobe.lower.push(pairedSecondary);
  const target=V.wardrobes.dgwTest;for(const key of Object.keys(target))if(Array.isArray(target[key]))target[key]=[];target.space=2;
  DoLWardrobeUI.refresh();
 });
 if(await p.getByRole('button',{name:'清除选择',exact:true}).isEnabled())await p.getByRole('button',{name:'清除选择',exact:true}).click();await p.getByRole('searchbox').fill('关联修理转移测试');await p.locator('.dgw-item').click();
 await p.getByRole('button',{name:'修理衣物',exact:true}).click();assert.match(await p.locator('.dgw-confirm').textContent(),/10 分钟/);
 const pairedBefore=await p.evaluate(()=>V.timeStamp);await p.getByRole('button',{name:'确认修理',exact:true}).click();
 await p.waitForFunction(()=>document.querySelector('.dgw-message').textContent.includes('已修理 1'));
 assert.ok(await p.evaluate(()=>pairedPrimary.integrity===clothingData('upper',pairedPrimary,'integrity_max')&&pairedSecondary.integrity===clothingData('lower',pairedSecondary,'integrity_max')));
 assert.equal(await p.evaluate(t=>V.timeStamp-t,pairedBefore),600,'repair counts the linked part');
 await p.locator('.dgw-item').click();await p.getByRole('button',{name:'转移衣物',exact:true}).click();
 await p.evaluate(()=>V.wardrobes.dgwTest.head.push({name:'concurrent change'}));await p.getByRole('button',{name:'确认转移',exact:true}).click();
 await p.waitForFunction(()=>document.querySelector('.dgw-message').textContent.includes('目标衣柜发生变化'));
 assert.ok(await p.evaluate(()=>V.wardrobe.upper.includes(pairedPrimary)&&V.wardrobe.lower.includes(pairedSecondary)),'stale destination does not transfer either part');
 await p.evaluate(()=>{V.wardrobes.dgwTest.lower=[{},{}];DoLWardrobeUI.refresh()});
 await p.getByRole('button',{name:'转移衣物',exact:true}).click();assert.equal(await p.locator('.dgw-confirm').count(),0);assert.match(await p.locator('.dgw-message').textContent(),/容量/);
 await p.evaluate(()=>{V.wardrobes.dgwTest.lower=[];DoLWardrobeUI.refresh()});await p.getByRole('button',{name:'转移衣物',exact:true}).click();
 await p.getByRole('button',{name:'确认转移',exact:true}).evaluate(button=>{button.click();DoLWardrobeUI.setEnabled(false);window.busySwitchBlocked=DoLWardrobeUI.getEnabled()});
 assert.equal(await p.evaluate(()=>busySwitchBlocked),true,'settings switch is blocked during batch mutation');
 await p.waitForFunction(()=>document.querySelector('.dgw-message').textContent.includes('已转移 1'));
 assert.ok(await p.evaluate(()=>V.wardrobes.dgwTest.upper.includes(pairedPrimary)&&V.wardrobes.dgwTest.lower.includes(pairedSecondary)&&!V.wardrobe.upper.includes(pairedPrimary)&&!V.wardrobe.lower.includes(pairedSecondary)),'both linked objects reach destination');
 await p.evaluate(()=>{V.sewingKit=0;DoLWardrobeUI.refresh()});assert.equal(await p.getByRole('button',{name:'修理衣物',exact:true}).count(),0,'repair disappears without sewing kit');
 assert.equal(await p.locator('.error').count(),0,'no native macro errors after feature actions');
 const upstreamErrors=errors.filter(e=>e.includes('bannerFallbackImage.onload')&&e.includes("reading 'skybox'"));
 if(upstreamErrors.length){const control=JSON.parse(fs.readFileSync(path.join(__dirname,'artifacts/wardrobe-control.json'),'utf8'));assert.ok(control.errors.some(e=>e.includes('bannerFallbackImage.onload')&&e.includes("reading 'skybox'")),'known error exclusion requires no-UI control evidence')}
 assert.deepEqual(errors.filter(e=>!upstreamErrors.includes(e)),[],'feature runtime has no non-upstream page errors');
 fs.writeFileSync(path.join(__dirname,'artifacts/wardrobe-features-verification'+(process.env.DOL_WARDROBE_INTEGRATED?'-integrated':'')+'.json'),JSON.stringify({passed:true,scope:'isolated new-game runtime; no user save',repair:'batch and paired item repair, readonly review, 5 minutes per part, availability',transfer:'successful linked object transfer, strict capacity, stale target refusal, busy fallback guard',upstreamErrors},null,2));
 console.log('PASS repair batch, transfer success, strict full-capacity rejection, native mode reset.');
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
