// Real save/theme modules with isolated rows and a representative native overlay wrapper.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default;
 const rows=Array.from({length:40},(_,i)=>`<div class="savesListRow"><span class="saveId">${i+1}</span><span class="saveName">Fixture ${i+1}</span><div class="saveGroup"><span class="saveButton"><button>Save</button></span><button>Load</button></div><div class="saveDetails"><span class="datestamp">2026/10/19</span><span>Isolated description ${i+1}</span></div></div>`).join('');
 const html=`<!doctype html><html data-stone-free data-dol-midnight><head><style>body{margin:0}#customOverlayContainer{position:fixed;inset:0;display:grid;place-items:center}#customOverlay{position:relative;display:flex;flex-direction:column;width:min(1000px,calc(100% - 24px));height:800px;max-height:calc(100% - 24px);box-sizing:border-box;padding:8px}#customOverlayTitle{display:flex;flex:none;flex-direction:column}#customOverlayContent{flex:1;min-height:0;overflow:auto}.hidden{display:none}</style></head><body><div id="customOverlayContainer"><div id="customOverlay" data-overlay="saves"><div id="customOverlayTitle"><div id="overlayTabs"><button>Saves</button><button>Import / Export</button></div></div><div id="customOverlayContent"><div id="saveList"><div id="savesListContainer">${rows}</div><ul class="buttons"><li><button id="fixture-bottom-action">Bottom native action</button></li></ul></div></div></div></div><script type="module">import {startSaves} from '/src/saves/main.ts';import {startTheme} from '/src/theme/controller.ts';window.businessCalls=0;document.querySelectorAll('#saveList button').forEach(n=>n.onclick=()=>businessCalls++);window.saves=startSaves(window);window.DoLSavesUI=saves;startTheme();window.theme=window.DoLMidnightTheme;</script></body></html>`;
 const server=await createServer({configFile:false,plugins:[vue(),{name:'save-viewport-fixture',configureServer(s){s.middlewares.use('/__save_viewport__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end(html)})}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 let browser;
 try{
  await server.listen();browser=await chromium.launch(require('./browser-options.cjs'));
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url='http://127.0.0.1:'+server.httpServer.address().port+'/__save_viewport__';
  const sizes=[{width:2560,height:1440},{width:2048,height:1152},{width:1363,height:876},{width:1024,height:768},{width:768,height:1024},{width:844,height:390}];
  for(const size of sizes){
   await page.setViewportSize(size);
   for(const v2 of [false,true]){
    await page.goto(url);await page.waitForSelector('.dgs-item');await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
    await page.evaluate(value=>theme.setPreference('savesV2',value),v2);
    if(v2)await page.reload();
    if(v2){await page.waitForSelector('.dgs-item');await page.addStyleTag({path:'dist/framework/official-ui/style.css'})}
    await page.waitForTimeout(150);assert.equal(await page.locator('.dgs-titlebar').count(),1,'one shared save management header');
    assert.equal(await page.evaluate(()=>theme.getPreferences().savesV2),v2,'actual preference persists across fixture reload');
    assert.equal(await page.evaluate(()=>theme.getPreferences().fontScale),100,'no scaling workaround');
    await page.locator('.dgs-item').first().click();
    const inline=await page.locator('.dgs-layout').evaluate(n=>n.classList.contains('dgs-v2'));
    if(v2&&size.width>=1024)assert.equal(inline,true,'wide non-drawer layout is exercised');
    const detail=page.locator('.dgs-detail');
    if(!inline)await detail.locator('.dgs-close').click();
    const bottom=page.locator('#fixture-bottom-action');await bottom.scrollIntoViewIfNeeded();
    const bounds=await bottom.boundingBox();assert.ok(bounds&&bounds.y>=0&&bounds.y+bounds.height<=size.height+1,JSON.stringify({size,v2,bounds}));
    assert.equal(await bottom.evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),true,'bottom native control is actually hittable');
    assert.equal(await page.evaluate(()=>businessCalls),0,'inspection never saves or loads');
   }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS save drawer/non-drawer, 2K/tablet/narrow viewports at 100%, bottom native hitbox and persisted mode after fixture reload; not physical iPad or real save/load proof');
 }finally{await browser?.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
