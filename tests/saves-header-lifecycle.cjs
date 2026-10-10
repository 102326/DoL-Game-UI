const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const {build}=await import('vite'),{default:vue}=await import('@vitejs/plugin-vue');
 const dir=path.resolve(__dirname,'artifacts/save-header');
 await build({configFile:false,plugins:[vue()],define:{'process.env.NODE_ENV':JSON.stringify('production'),__VUE_OPTIONS_API__:false,__VUE_PROD_DEVTOOLS__:false,__VUE_PROD_HYDRATION_MISMATCH_DETAILS__:false},build:{outDir:dir,lib:{entry:path.resolve(__dirname,'../src/saves/main.ts'),name:'SavesTest',formats:['iife'],fileName:()=> 'saves.js'},minify:true}});
 const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:1363,height:876}});
 await p.setContent('<html data-dol-midnight data-dgu-visual="1" data-dgu-visualGlass><body><div id="customOverlay" data-overlay="saves"><div id="customOverlayTitle"><div id="overlayTabs"><button id="native-tab">存档</button></div></div><div id="customOverlayContent"><div id="saveList"><div id="savesListContainer"><div class="savesListRow"><span class="saveId">1</span><span class="saveName">Example</span><div class="saveGroup"><span class="saveButton"><button>保存</button></span><button>读取</button></div><div class="saveDetails"><span class="datestamp">2026/10/03</span><span>Readable summary</span></div></div></div></div></div></div></body></html>');
 await p.addStyleTag({path:path.resolve(__dirname,'../dist/game-ui.css')});await p.addScriptTag({content:fs.readFileSync(path.join(dir,'saves.js'),'utf8')});
 await p.addStyleTag({content:'#customOverlay{position:relative;width:min(90vw,1200px)}'});
 await p.evaluate(()=>{const container=document.createElement('div');container.id='customOverlayContainer';container.style='position:fixed;inset:0;display:flex;justify-content:center;align-items:center;padding:12px';const overlay=document.getElementById('customOverlay');overlay.parentNode.insertBefore(container,overlay);container.append(overlay)});
 await p.evaluate(()=>{window.nativeTab=document.querySelector('#native-tab');window.nativeRow=document.querySelector('.savesListRow');window.nativeActions=[...nativeRow.querySelectorAll('button')];window.saves=SavesTest.startSaves(window)});
 await p.waitForSelector('#customOverlayTitle .dgs-titlebar');
 await p.evaluate(()=>{const close=document.createElement('button');close.className='customOverlayClose';close.textContent='×';close.style='position:absolute;right:0;top:0;width:44px;height:44px';close.onclick=()=>{window.nativeCloseClicked=true};document.querySelector('#customOverlay').append(close)});
 for(const width of [390,700,909,1000,1024,1363]){
  await p.setViewportSize({width,height:876});
  assert.ok(await p.evaluate(()=>{const b=document.querySelector('.dgs-titlebar>button').getBoundingClientRect(),c=document.querySelector('.customOverlayClose').getBoundingClientRect();return !(b.right>c.left&&b.left<c.right&&b.top<c.bottom&&b.bottom>c.top)}),'fallback and original close areas do not overlap at '+width);
 }
 await p.setViewportSize({width:1363,height:876});await p.locator('.customOverlayClose').click();assert.equal(await p.evaluate(()=>nativeCloseClicked),true,'original close handler receives the click');
 assert.equal(await p.locator('#native-tab').evaluate(e=>e===nativeTab),true,'native Tab is neither replaced nor cloned');
 const beforeBox=await p.locator('#customOverlay').boundingBox();
 assert.equal(await p.locator('.dgs-slot-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),2,'default overview has two save columns');
 await p.locator('.dgs-item').click();
 const afterBox=await p.locator('#customOverlay').boundingBox();
 assert.ok(Math.abs(beforeBox.width-afterBox.width)<1&&Math.abs(beforeBox.x-afterBox.x)<1,'opening default details does not shrink or relocate the save overview');
 assert.equal(await p.locator('.dgs-detail:modal').count(),1);
 const material=await p.locator('.dgs-detail').evaluate(e=>({shell:getComputedStyle(e).backgroundColor,blur:getComputedStyle(e).backdropFilter,body:getComputedStyle(e.querySelector('.dgs-detail-content')).backgroundColor,group:getComputedStyle(e.querySelector('.dgs-description')).backgroundColor}));
 assert.equal(material.shell,'rgba(40, 42, 46, 0.58)');assert.equal(material.blur,'blur(24px)');
 assert.equal(material.body,'rgba(0, 0, 0, 0)');assert.equal(material.group,'rgba(26, 28, 32, 0.2)');
 await p.locator('.dgs-close').click();assert.equal(await p.locator('.dgs-detail').evaluate(e=>e.open),false);
 for(const width of [390,1024,1363]){
  await p.setViewportSize({width,height:876});await p.locator('html').evaluate(e=>e.style.fontSize='200%');await p.locator('.dgs-item').click();
  const fit=await p.locator('.dgs-detail').evaluate(e=>{const b=e.getBoundingClientRect(),actions=e.querySelector('.dgs-actions').getBoundingClientRect(),content=e.querySelector('.dgs-detail-content');return {fits:b.left>=0&&b.right<=innerWidth+.5&&b.top>=0&&b.bottom<=innerHeight+.5,dock:actions.bottom<=b.bottom+.5&&actions.top>=b.top,overflow:e.scrollWidth>e.clientWidth,bodyScroll:getComputedStyle(content).overflowY}});
  assert.ok(fit.fits&&fit.dock&&!fit.overflow,'detail and action dock fit at 200% / '+width);assert.equal(fit.bodyScroll,'auto');await p.locator('.dgs-close').click();
 }
 await p.setViewportSize({width:1363,height:876});await p.locator('html').evaluate(e=>e.style.fontSize='100%');
 await p.evaluate(()=>saves.setV2(true));await p.waitForSelector('.dgs-layout.dgs-v2');
 assert.equal(await p.locator('.dgs-slot-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),1,'V2 list is one column');
 assert.equal(await p.locator('.dgs-inline-detail').isVisible(),true);assert.equal(await p.locator('.dgs-detail:modal').count(),0);
 await p.evaluate(()=>saves.setV2(false));await p.waitForSelector('.dgs-layout:not(.dgs-v2)');
 assert.equal(await p.locator('.dgs-slot-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),2);
 await p.locator('input[type=search]').fill('Example');
 await p.evaluate(()=>{document.documentElement.setAttribute('data-dgu-visualMotion','');window.saveShell=document.querySelector('#customOverlay')});await p.waitForTimeout(220);
 await p.evaluate(()=>{window.saveHost=document.querySelector('.dgs-host');window.saveCard=document.querySelector('.dgs-item');window.saveHeader=document.querySelector('.dgs-titlebar');window.shellRestarts=0;saveShell.addEventListener('animationstart',e=>{if(e.target===saveShell&&e.animationName==='dgu-save-shell-in')shellRestarts++})});
 await p.evaluate(()=>{nativeActions[0].disabled=true});await p.waitForFunction(()=>document.querySelector('.dgs-host input[type=search]')?.value==='Example'&&document.querySelector('.dgs-item'));
 await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 assert.equal(await p.evaluate(()=>shellRestarts),0,'native row refresh must not restart the save shell fade');
 assert.equal(await p.locator('#customOverlay').evaluate(e=>getComputedStyle(e).opacity),'1','refreshed save shell remains visible');
 assert.ok(await p.evaluate(()=>document.querySelector('.dgs-host')===saveHost&&document.querySelector('.dgs-titlebar')===saveHeader&&document.querySelector('.dgs-item')===saveCard),'native row refresh preserves header and card DOM while renewing action bindings');
 assert.equal(await p.locator('input[type=search]').inputValue(),'Example','native refresh preserves search');
 await p.evaluate(()=>document.querySelector('#customOverlay').style.width='450px');await p.evaluate(()=>saves.setV2(true));
 await p.waitForFunction(()=>!document.querySelector('.dgs-v2'));
 assert.equal(await p.locator('.dgs-slot-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),1,'wide viewport/narrow actual container stays single column');
 await p.locator('.dgs-item').click();assert.equal(await p.locator('.dgs-detail:modal').count(),1,'narrow actual container uses Drawer even with V2');await p.locator('.dgs-close').click();
 await p.evaluate(()=>saves.setEnabled(false));
 assert.equal(await p.locator('.dgs-titlebar').count(),0,'fallback removes teleported header');
 assert.ok(await p.evaluate(()=>document.querySelector('#native-tab')===nativeTab&&nativeActions.every(e=>e.isConnected)&&nativeRow.isConnected&&!nativeRow.classList.contains('dgs-native-row')),'fallback restores original controls');
 await p.evaluate(()=>{
  window.createElementOriginal=document.createElement;document.createElement=function(tag,...args){if(tag==='section'){document.createElement=createElementOriginal;throw Error('M4-B mount fixture failure')}return createElementOriginal.call(this,tag,...args)};
  saves.setEnabled(true);document.createElement=createElementOriginal;
 });assert.equal(await p.locator('.dgs-host').count(),0,'mount failure restores native view');
 await p.evaluate(()=>{const old=document.getElementById('savesListContainer'),next=old.cloneNode(true);old.replaceWith(next)});await p.waitForSelector('.dgs-host');
 assert.equal(await p.locator('.dgs-host').count(),1,'new native page recovers locally without duplicate hosts');
 await p.evaluate(()=>saves.destroy());
 console.log('PASS save header lifecycle: native Tab/actions retained, default double column and modal, V2 inline detail, 390/1024/1363 at 200%, visible dock, close and exact fallback');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
