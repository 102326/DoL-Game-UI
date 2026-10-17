const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const [{createServer},{default:vue}]=await Promise.all([import('vite'),import('@vitejs/plugin-vue')]);
 const vite=await createServer({configFile:false,root:process.cwd(),plugins:[vue(),{name:'panels-framework-test-page',configureServer(server){server.middlewares.use('/__panels_framework_test__',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body></body></html>')})}}],optimizeDeps:{noDiscovery:true,include:['vue']},server:{host:'127.0.0.1',port:0},logLevel:'error'});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{await vite.listen();const page=await browser.newPage(),address=vite.httpServer.address();await page.goto(`http://127.0.0.1:${address.port}/__panels_framework_test__`);
  const result=await page.evaluate(async()=>{
   const [{startPanels},{createHost}]=await Promise.all([import('/src/panels/main.ts'),import('/framework/host.ts')]);
   document.body.innerHTML='<div id="customOverlay" data-overlay="traits"><div id="customOverlayContent"><div id="traitLists"><div><h4 id="native-heading" class="traitHeading" data-dgp-count="original">Trait group</h4><div class="trait" id="native-trait">Native trait</div></div></div><button id="overlay-control">Overlay action</button><div id="unknown-mod-node">Unknown</div></div></div><div id="passages"><div class="passage" data-passage="Settings"><h2 class="settingsHeader" id="passage-heading">Settings group</h2><button id="settings-control">Settings action</button></div></div><div id="peer"></div>';
   window.jQuery=()=>({on(){},off(){}});let calls=0;document.querySelector('#overlay-control').addEventListener('click',()=>calls++);
   const content=document.querySelector('#customOverlayContent'),nodes=[...content.querySelectorAll('*')],nativeHeading=document.querySelector('#native-heading');
   const host=createHost(window),owner=host.register('panels'),peer=host.register('peer');peer.mount({id:'keep',parent:document.querySelector('#peer'),lifetime:'persistent',setup(){}});
   const api=startPanels(window,{host,owner}),frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));await frame();
   const overlayMount=host.getDiagnostics().mounts.some(m=>m.owner==='panels'&&m.id==='panels-overlay'&&m.lifetime==='persistent');
   const passageMount=host.getDiagnostics().mounts.some(m=>m.owner==='panels'&&m.id==='panels-passage'&&m.lifetime==='passage');
   document.querySelector('#overlay-control').click();const originalIdentity=nodes.every(node=>node.isConnected&&content.contains(node))&&nativeHeading.dataset.dgpCount!=='original';
   api.setEnabled('traits',false);await frame();const disabled=!document.querySelector('#customOverlay .dgp-host')&&nativeHeading.dataset.dgpCount==='original'&&nodes.every(node=>node.isConnected&&content.contains(node));
   api.setEnabled('traits',true);await frame();const enabled=!!document.querySelector('#customOverlay .dgp-navigation');
   document.querySelector('#customOverlay > .dgp-host').remove();await frame();const hostRemovalReentry=!!document.querySelector('#customOverlay .dgp-navigation');
   const oldOverlay=document.querySelector('#customOverlay'),replacement=document.createElement('div');replacement.id='customOverlay';replacement.dataset.overlay='traits';replacement.append(content);oldOverlay.replaceWith(replacement);await frame();
   const overlayReplacement=!!replacement.querySelector('.dgp-navigation')&&nodes.every(node=>node.isConnected&&content.contains(node));
   host.invalidateScene();await frame();const passageInvalidated=!document.querySelector('#passages .dgp-host')&&!!document.querySelector('#customOverlay .dgp-navigation');
   host.sceneReady();api.refresh();await frame();const passageReentry=!!document.querySelector('#passages .dgp-navigation')&&host.getDiagnostics().mounts.some(m=>m.id==='panels-passage'&&m.lifetime==='passage');
   api.setEnabled('settings',false);await frame();const passageDisabled=!document.querySelector('#passages .dgp-host');api.setEnabled('settings',true);await frame();const passageEnabled=!!document.querySelector('#passages .dgp-navigation');
   api.setEnabled('traits',true);owner.dispose();await frame();api.refresh();await frame();
   const ownerDisposed=!document.querySelector('#customOverlay .dgp-host')&&!document.querySelector('#passages .dgp-host')&&host.getDiagnostics().mounts.some(m=>m.owner==='peer'&&m.id==='keep');
   const noRemount=!document.querySelector('.dgp-host')&&nodes.every(node=>node.isConnected&&content.contains(node));document.querySelector('#overlay-control').click();
   const classic=startPanels(window);await frame();const classicPath=!!document.querySelector('#customOverlay .dgp-navigation')&&!!document.querySelector('#passages .dgp-navigation');classic.destroy();api.destroy();peer.dispose();host.dispose();
   return {overlayMount,passageMount,originalIdentity,disabled,enabled,hostRemovalReentry,overlayReplacement,passageInvalidated,passageReentry,passageDisabled,passageEnabled,ownerDisposed,noRemount,classicPath,calls};
  });
  for(const key of ['overlayMount','passageMount','originalIdentity','disabled','enabled','hostRemovalReentry','overlayReplacement','passageInvalidated','passageReentry','passageDisabled','passageEnabled','ownerDisposed','noRemount','classicPath'])assert.equal(result[key],true,key);
  assert.equal(result.calls,2,'native overlay handler remains attached to the same node');
  console.log('PASS panels persistent overlay and passage mounts, host/overlay replacement, scene lifetime, owner cleanup and classic path');
 }finally{await browser.close();await vite.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
