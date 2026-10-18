const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const cases=[
 {folder:'modhub-soft-wet',id:'ModHubSoftWet',target:'ModHub',version:'1.7.0',overlay:'modloader',body:'<div id="modHubModManageContainer" class="modhub-container"><section class="modhub-section"><button id="native" class="modhub-btn-primary">Original</button><input id="value" value="fixture"></section></div>',tabs:' class="modhub-modloader-tabs"',card:'.modhub-section',drift:'#modHubModManageContainer'},
 {folder:'maplebirch-soft-wet',id:'MapleBirchSoftWet',target:'maplebirch',version:'5.4.3',overlay:'saves',body:'<div id="maplebirch-cloud-save" class="maplebirch-cloud-save"><section class="settingsToggleItemWide"><input data-cloud-save-field="endpoint" value="fixture"><input data-cloud-save-field="token" value="fixture"><button id="native">Original</button><input id="value" value="fixture"></section></div>',card:'.settingsToggleItemWide',drift:'[data-cloud-save-field=token]'},
 {folder:'dol-optimization-soft-wet',id:'DolOptimizationSoftWet',target:'原版优化',version:'1.1.1.5',overlay:'saves',body:'<div id="saveList"><input id="pageNum" value="1"><input id="pageLen" value="10"><div id="saves-list-container"><div class="savesListRow"><div class="saveGroup"><span class="saveId">1</span><span class="saveName">Fixture</span><div class="saveDetails"><span>Fixture</span><span class="datestamp">date</span></div><div class="saveButton"><button id="native">Original</button></div></div><input id="value" value="fixture"></div></div></div>',card:'.savesListRow',drift:'#pageLen'},
 {folder:'cheat-extended-soft-wet',id:'CheatExtendedSoftWet',target:'cheat extended',version:'1.20.3.1-rebuild.30',overlay:'CEcheatMenu',title:'<div id="cheat_extended_options" class="CEtab"><div class="CE-category-bar"><button>Category</button></div><div class="CE-subtab-bar"><button>Tab</button></div></div>',body:'<div id="CE_settingsDiv"><button id="native">Original</button><input id="value" value="fixture"></div>',card:'#CE_settingsDiv',drift:'.CE-subtab-bar'}
];
(async()=>{
 const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default;
 const server=await createServer({configFile:false,plugins:[vue(),{name:'adapter-material-fixture',configureServer(s){s.middlewares.use('/__adapter_material__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<!doctype html><html data-stone-free data-dol-midnight data-dgu-visualGlass data-dgu-visualMotion><body></body></html>')})}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 let browser;
 try{
  await server.listen();browser=await chromium.launch(require('./browser-options.cjs'));
  for(const item of cases){
   const page=await browser.newPage({viewport:{width:1100,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__adapter_material__');
   await page.evaluate(item=>{document.body.innerHTML=`<div id="customOverlay" data-overlay="${item.overlay}"><div id="customOverlayTitle"><div id="overlayTabs"${item.tabs||''}><button>Tab</button></div>${item.title||''}</div><div id="customOverlayContent">${item.body}</div></div>`},item);
   await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
   await page.addStyleTag({path:`compat/${item.folder}/${item.folder}.css`});
   await page.evaluate(async item=>{const {createUiRuntime}=await import('/src/runtime/ui.ts');window.modUtils={getMod:name=>name===item.target?{version:item.version}:null,getSemVerTools:()=>({parseVersion:v=>({version:v}),parseRange:r=>r,satisfies:()=>true})};window.DoLSavesUI={getEnabled:()=>true};window.runtime=createUiRuntime(window,()=>({savesEnabled:true}));window.DoLGameUI={ui:runtime.api,getPreferences:()=>({savesEnabled:true})};window.calls=0;window.original=document.querySelector('#native');original.onclick=()=>calls++;window.nativeParent=original.parentNode;window.originalInput=document.querySelector('#value')},item);
   const code=require('esbuild').buildSync({entryPoints:[path.resolve(`compat/${item.folder}/${item.folder}.ts`)],bundle:true,write:false,format:'iife'}).outputFiles[0].text;await page.addScriptTag({content:code});
   await page.waitForFunction(()=>document.querySelector('#customOverlay').dataset.dguAdapterMatch==='full');
   for(const width of [1100,390]){
    await page.setViewportSize({width,height:800});
    await page.locator('#native').click();
    await page.locator('#value').fill('retained');
    assert.ok(await page.locator('#native').evaluate(n=>n.getBoundingClientRect().height>=44),item.id+' touch size');
   }
   assert.equal(await page.evaluate(()=>calls),2);assert.equal(await page.evaluate(()=>original.parentNode===nativeParent&&originalInput===document.querySelector('#value')),true);
   assert.equal(await page.locator('#customOverlayContent').evaluate(n=>getComputedStyle(n).backdropFilter),'none','no nested content blur');
   if(item.card!=='#CE_settingsDiv')assert.match(await page.locator(item.card).first().evaluate(n=>getComputedStyle(n).backgroundColor),/^rgba\(/,item.id+' uses translucent content plane');
   await page.locator(item.drift).evaluate(n=>n.remove());await page.evaluate(()=>runtime.api.rescan());
   assert.notEqual(await page.locator('#customOverlay').getAttribute('data-dgu-adapter-match'),'full','structure drift withdraws full styling');
   await page.evaluate(id=>{window[id].destroy();runtime.destroy()},item.id);
   assert.equal(await page.locator('#native').count(),item.drift==='#modHubModManageContainer'?0:1);
   assert.deepEqual(errors,[]);await page.close();console.log('PASS '+item.id+' 3.x material, native events/input, 44px controls, narrow width and structure fallback');
  }
 }finally{await browser?.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
