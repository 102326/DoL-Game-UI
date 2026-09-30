// Isolated warm-cache measurement; never attaches to a user's game or writes saves.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),workspace=path.resolve(process.env.DOL_TEST_WORKSPACE||path.join(root,'../..'));
const variant=process.env.DOL_WARDROBE_INTEGRATED==='1'?'lyra':'vanilla';
const fixture=path.join(workspace,variant==='lyra'?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html');
function validate({rounds,errors,transitions,environment}){
 const bannerError=e=>e.includes("Cannot read properties of undefined (reading 'skybox')")&&e.includes('at bannerFallbackImage.onload');
 if(errors.some(bannerError)){
  const control=JSON.parse(fs.readFileSync(path.join(__dirname,`artifacts/shop-banner-control-${environment?.variant??variant}.json`),'utf8'));
  assert.equal(control.ui,false);assert.ok(control.errors.some(bannerError),'same-fixture no-UI control required');
 }
 assert.deepEqual(errors.filter(e=>!bannerError(e)),[],'unexpected runtime errors');
 for(const r of rounds){
  assert.ok(r.businessEqual,'business unchanged');assert.equal(r.callsAfterExit,0,'no page generation after exit');assert.deepEqual(r.errors,[]);
  for(const row of r.rows){assert.deepEqual(row.errors,[]);assert.deepEqual(row.visible,row.expected,'visible product order '+row.name);if(r.enabled)assert.equal(row.pages.length,1,'only current page');else assert.equal(row.items,row.total,'no stale background duplicates '+row.name);}
 }
 assert.equal(transitions[0].pages,1,'switch during background build');assert.equal(transitions[2].items,0,'empty search');
 const nonzero=transitions.find(x=>x.name==='nonzeroBackground');
 if(nonzero){assert.deepEqual(nonzero.pages,Array.from({length:nonzero.expectedPages},(_,i)=>i),'prepend and append order');assert.equal(nonzero.visiblePage,5);}
 const purchase=transitions.find(x=>x.name==='purchase');
 if(purchase){assert.equal(purchase.moneyAfter,purchase.moneyBefore-purchase.price);assert.equal(purchase.countAfter,purchase.countBefore+1);assert.equal(purchase.errors,0);}
 console.log('PASS shop assertions; separately reproduced upstream banner errors:',errors.filter(bannerError).length);
}
// Read the released patch contract without rebuilding or overwriting the release ZIP.
const extracted=spawnSync('python',['-X','utf8','-c',
 'import json,sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); b=json.loads(z.read("boot.json")); print(json.dumps(b["addonPlugin"][0]["params"]))',
 path.join(root,'dist',`DoLGameUI-${JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version}.mod.zip`)],{encoding:'utf8'});
assert.equal(extracted.status,0,extracted.stderr);
const patches=JSON.parse(extracted.stdout).map(p=>({...p,replacement:fs.readFileSync(path.join(root,p.replaceFile),'utf8')}));
const passage=spawnSync('python',['-X','utf8','-c',
 'import sys,re,html,json,pathlib; s=pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"); print(json.dumps(html.unescape(re.search(r\'<tw-passagedata[^>]*name="Clothing Shop v2 Widgets"[^>]*>([\\s\\S]*?)</tw-passagedata>\',s)[1])))',
 fixture],{encoding:'utf8',maxBuffer:8*1024*1024});
assert.equal(passage.status,0,passage.stderr);
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=pathname==='/game'?fixture:path.join(workspace,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(workspace)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
(async()=>{
 if(process.env.DOL_SHOP_VERIFY_ARTIFACT){validate(JSON.parse(fs.readFileSync(process.env.DOL_SHOP_VERIFY_ARTIFACT,'utf8')));return}
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1363,height:876}}),errors=[];
  p.on('pageerror',e=>errors.push(e.stack));
  await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
  if(process.env.DOL_SHOP_BANNER_CONTROL==='1'){
   await p.route('**/img/misc/banner.png',async route=>{await new Promise(r=>setTimeout(r,800));await route.continue()});
   await p.goto(`http://127.0.0.1:${server.address().port}/game`,{waitUntil:'domcontentloaded',timeout:90000});
   await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options);
   await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForTimeout(1300);
   const control={variant,scope:'same selected fixture, no UI/runtime/patch injected, delayed native banner image',errors,ui:await p.evaluate(()=>!!window.DoLGameUI)};
   fs.writeFileSync(path.join(__dirname,`artifacts/shop-banner-control-${variant}.json`),JSON.stringify(control,null,2));
   assert.equal(control.ui,false);assert.ok(errors.some(e=>e.includes('bannerFallbackImage.onload')&&e.includes('skybox')));
   console.log('PASS no-UI banner error reproduction');return;
  }
  await p.goto(`http://127.0.0.1:${server.address().port}/game`,{waitUntil:'load',timeout:90000});
  await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options);
  await p.waitForLoadState('networkidle');
  await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForLoadState('networkidle');
  await p.addScriptTag({path:path.join(root,'shop-page-experiment.js')});
  await p.evaluate(({patches,source})=>{
   let text=source;
   for(const patch of patches){
    if(text.split(patch.findString).length!==2)throw Error('nonunique patch '+patch.replaceFile+' '+JSON.stringify({find:patch.findString,actual:text.split('\n').filter(l=>l.includes('shop-list-pages')).slice(0,3)}));
    text=text.replace(patch.findString,patch.replacement);
   }
   // Re-register exactly the patched native widgets, like loader pre-start replacement.
   const output=SugarCube.Wikifier.wikifyEval(text);
   if(output.querySelector('.error'))throw Error(output.textContent);
  },{patches,source:JSON.parse(passage.stdout)});
  await p.addStyleTag({path:path.join(root,'dist/game-ui.css')});
  await p.addScriptTag({path:path.join(root,'dist/game-ui.js')});
  const environment=await p.evaluate(variant=>({variant,ui:DoLGameUI.version,userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight]}),variant);
  await p.evaluate(()=>{
   window.shopBench={calls:0,ms:0};const macro=SugarCube.Macro.get('generateshoppage'),original=macro.handler;
   macro.handler=function(...args){shopBench.calls++;const start=performance.now();try{return original.apply(this,args)}finally{shopBench.ms+=performance.now()-start}};
  });
  const rounds=[];
  for(let round=0;round<(process.env.DOL_SHOP_LIFECYCLE_ONLY==='1'?0:4);round++)for(const enabled of round%2?[true,false]:[false,true]){
   const result=await p.evaluate(async({enabled,round})=>{
    const delay=ms=>new Promise(r=>setTimeout(r,ms)),frame=()=>new Promise(r=>requestAnimationFrame(r));
    SugarCube.Engine.play('Bedroom');await delay(50);
    DoLShopPageExperiment.setEnabled(enabled);
    V.shopPage=0;V.shopItemsPerPage=12;delete V.clothes_choice;
    new SugarCube.Wikifier(null,'<<shopClothingFilterReset>>');
    const business=()=>JSON.stringify({money:V.money,wardrobe:V.wardrobe,worn:V.worn,time:V.timeStamp});
    const before=business();SugarCube.Engine.play('Clothing Shop');await frame();await frame();
    const rows=[];
    function snapshot(){
     const pages=[...document.querySelectorAll('#shop-list-pages > .clothing-shop-page')];
     return {pages:pages.map(e=>({class:e.className,count:e.querySelectorAll('.clothing-item').length})),items:document.querySelectorAll('#shop-list-pages .clothing-item').length,nodes:document.querySelectorAll('#shop-list-pages *').length,visible:[...document.querySelectorAll('#shop-list-pages > .clothing-shop-page:not(.hidden) .clothing-name')].map(e=>(e.querySelector('a, .lblue')?.textContent??'').replace(/^\s*\([^)]*\)\s*/,'').trim()),expected:filterShopGroup(T.items).slice(V.shopPage*V.shopItemsPerPage,(V.shopPage+1)*V.shopItemsPerPage).map(x=>x.name_cap),total:filterShopGroup(T.items).length};
    }
    async function measure(name,action,settle){
     const tasks=[],observer=new PerformanceObserver(l=>tasks.push(...l.getEntries().map(e=>({start:e.startTime,duration:e.duration}))));observer.observe({type:'longtask'});
     let start,syncMs;const calls=shopBench.calls,ms=shopBench.ms,counts=DoLShopUI.getLifecycleCounts();
     await new Promise((resolve,reject)=>setTimeout(async()=>{start=performance.now();try{const pending=action();syncMs=performance.now()-start;await pending;resolve()}catch(e){reject(e)}},0));
     await frame();await frame();const firstReadyMs=performance.now()-start;
     await delay(settle??Math.max(700,Math.ceil(filterShopGroup(T.items).length/V.shopItemsPerPage)*100+500));
     tasks.push(...observer.takeRecords().map(e=>({start:e.startTime,duration:e.duration})));observer.disconnect();
     const endCounts=DoLShopUI.getLifecycleCounts();
     rows.push({name,errors:[...document.querySelectorAll('.error')].map(e=>e.textContent),syncMs,firstReadyMs,calls:shopBench.calls-calls,listMs:shopBench.ms-ms,longTasks:tasks.length,longTaskMs:tasks.reduce((n,e)=>n+e.duration,0),scans:endCounts.scans-counts.scans,fastPaths:endCounts.fastPaths-counts.fastPaths,...snapshot()});
    }
    await measure('enter',()=>{
     const link=[...document.querySelectorAll('#clothingShop-div a')].find(e=>/View All|查看全部|查看所有|全部服/.test(e.textContent));
     if(!link)throw Error('missing View All');link.click();
    });
    await measure('next',()=>document.querySelector('#shop-pagination .next a').click(),100);
    await measure('previous',()=>document.querySelector('#shop-pagination .prev a').click(),100);
    // Native filter controls and apply handler; three replacements before delayed generation completes.
    await measure('rapidFilters',()=>{
     for(const gender of ['female','male','female']){
      document.querySelector('.filters-button a').click();
      for(const g of ['female','neutral','male']){
       const input=document.querySelector('#checkbox-shopclothingfiltergender'+g);
       if(input.checked!==(g===gender))input.click();
      }
      document.querySelector('#filters .button-apply a').click();
     }
    });
    await measure('midBuildFilters',async()=>{
     document.querySelector('.filters-button a').click();document.querySelector('#filters .button-reset a').click();
     await delay(350);
     for(const gender of ['male','female']){
      document.querySelector('.filters-button a').click();
      for(const g of ['female','neutral','male']){
       const input=document.querySelector('#checkbox-shopclothingfiltergender'+g);
       if(input.checked!==(g===gender))input.click();
      }
      document.querySelector('#filters .button-apply a').click();await delay(350);
     }
    });
    // Leave before newly scheduled background jobs run, then ensure nothing leaks into another passage.
    document.querySelector('.filters-button a').click();document.querySelector('#filters .button-apply a').click();
    SugarCube.Engine.play('Bedroom');const exitCalls=shopBench.calls;await delay(700);
    return {round,enabled,warmup:round===0,rows,businessEqual:before===business(),callsAfterExit:shopBench.calls-exitCalls,errors:[...document.querySelectorAll('.error')].map(e=>e.textContent)};
   },{enabled,round});
   rounds.push(result);console.log('ROUND',round,enabled,result.rows.map(r=>[r.name,r.calls,r.items,r.total]));
  }
  const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
  const summary=[false,true].flatMap(enabled=>(rounds[0]?.rows??[]).map(({name})=>{
   const r=rounds.filter(r=>!r.warmup&&r.enabled===enabled).flatMap(r=>r.rows.filter(x=>x.name===name));
   return {enabled,name,firstReadyMedian:median(r.map(x=>x.firstReadyMs)),listMsMedian:median(r.map(x=>x.listMs)),calls:r.map(x=>x.calls),nodes:r.map(x=>x.nodes),longTasks:r.reduce((n,x)=>n+x.longTasks,0),scans:r.map(x=>x.scans),items:r.map(x=>x.items),total:r.map(x=>x.total)};
  }));
  const transitions=await p.evaluate(async()=>{
   const delay=ms=>new Promise(r=>setTimeout(r,ms)),result=[];
   SugarCube.Engine.play('Clothing Shop');await delay(50);DoLShopPageExperiment.setEnabled(false);
   [...document.querySelectorAll('#clothingShop-div a')].find(e=>/View All|查看全部|查看所有|全部服/.test(e.textContent)).click();
   for(const enabled of [true,false,true]){
    await delay(350);DoLShopPageExperiment.setEnabled(enabled);new SugarCube.Wikifier(null,'<<updateclotheslist>>');
   }
   await delay(1000);
   result.push({name:'switchDuringBuild',pages:document.querySelectorAll('#shop-list-pages>.clothing-shop-page').length});
   const max=Math.ceil(filterShopGroup(T.items).length/V.shopItemsPerPage);
   for(let page=0;page<max;page++){
    V.shopPage=page;new SugarCube.Wikifier(null,'<<clothingshopChangePage>>');
    const actual=[...document.querySelectorAll('.clothing-shop-page:not(.hidden) .clothing-name')].map(e=>(e.querySelector('a, .lblue')?.textContent??'').replace(/^\s*\([^)]*\)\s*/,'').trim());
    const expected=filterShopGroup(T.items).slice(page*V.shopItemsPerPage,(page+1)*V.shopItemsPerPage).map(x=>x.name_cap);
    if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('paged traversal mismatch '+page);
   }
   result.push({name:'traverseFilteredCatalogue',pages:max});
   T.shopNameFilter='NoSuchItem_Baseline';new SugarCube.Wikifier(null,'<<updateclotheslist>>');await delay(350);
   result.push({name:'emptySearch',items:document.querySelectorAll('.clothing-item').length});
   T.shopNameFilter='';DoLShopPageExperiment.setEnabled(false);V.shopPage=5;
   new SugarCube.Wikifier(null,'<<updateclotheslist>>');
   const expectedPages=Math.ceil(filterShopGroup(T.items).length/V.shopItemsPerPage);await delay(expectedPages*100+600);
   result.push({name:'nonzeroBackground',expectedPages,pages:[...document.querySelectorAll('#shop-list-pages>.clothing-shop-page')].map(e=>Number(e.className.match(/\bpage-(\d+)/)[1])),visiblePage:Number(document.querySelector('.clothing-shop-page:not(.hidden)').className.match(/\bpage-(\d+)/)[1])});
   DoLShopPageExperiment.setEnabled(true);V.shopPage=0;V.money=1000000;
   new SugarCube.Wikifier(null,'<<updateclotheslist>>');await delay(50);
   document.querySelector('.clothing-name a').click();await delay(50);
   const slot=V.clothingShopSlot,price=getClothingCost(setup.clothes[slot][V.clothes_choice],slot),moneyBefore=V.money,countBefore=V.wardrobe[slot].length;
   document.querySelector('#buy-send-home a').click();await delay(400);
   result.push({name:'purchase',price,moneyBefore,moneyAfter:V.money,countBefore,countAfter:V.wardrobe[slot].length,errors:document.querySelectorAll('.error').length});
   return result;
  });
  const output=path.join(__dirname,'artifacts',`shop-current-baseline-${Date.now()}.json`);
  fs.writeFileSync(output,JSON.stringify({environment,scope:'Desktop warm-cache selected fixture, 1 warmup + 3 alternating pairs. Same inventory, no purchase. Four released find strings plus current working-tree replacements applied in isolated runtime, not installed-package proof. First ready includes two frame waits; not physical paint. Background work observed for page-count-based fixed window, not a claimed settled latency. Rapid filters via original controls in same task stresses overlapping jobs, not human input timing. midBuildFilters includes 350ms gaps in firstReadyMs, which is not an interaction latency; syncMs only covers initial synchronous segment.',rounds,summary,transitions,errors},null,2));
  console.log(JSON.stringify({output,summary},null,2));
  validate({rounds,errors,transitions,environment});
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
