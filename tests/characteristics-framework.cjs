const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const [{createServer},{default:vue}]=await Promise.all([import('vite'),import('@vitejs/plugin-vue')]);
 const vite=await createServer({configFile:false,root:process.cwd(),plugins:[vue(),{name:'characteristics-framework-test-page',configureServer(server){server.middlewares.use('/__characteristics_framework_test__',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body></body></html>')})}}],optimizeDeps:{noDiscovery:true,include:['vue']},server:{host:'127.0.0.1',port:0},logLevel:'error'});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{await vite.listen();const page=await browser.newPage(),address=vite.httpServer.address();await page.goto(`http://127.0.0.1:${address.port}/__characteristics_framework_test__`);
  const result=await page.evaluate(async()=>{
   const [{startCharacteristics},{createHost}]=await Promise.all([import('/src/characteristics/main.ts'),import('/framework/host.ts')]);
   document.body.innerHTML='<div id="customOverlay" data-overlay="characteristics"><div id="customOverlayContent"><div id="characteristics-display"><h2 id="base-characteristics">Basics</h2><button id="native-control">Native action</button><div style="height:800px"></div><h2 id="base-skills">Skills</h2><div style="height:800px"></div><div id="unknown-mod-node">Unknown</div></div></div></div><div id="peer"></div>';
   let calls=0;document.querySelector('#native-control').addEventListener('click',()=>calls++);const content=document.querySelector('#customOverlayContent'),nodes=[...content.querySelectorAll('*')];
   const host=createHost(window),owner=host.register('characteristics'),peer=host.register('peer');peer.mount({id:'keep',parent:document.querySelector('#peer'),lifetime:'persistent',setup(){}});
   const api=startCharacteristics(window,{host,owner}),frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));await frame();
   document.documentElement.setAttribute('data-stone-free','');document.documentElement.setAttribute('data-dgu-visualMotion','');content.style.maxHeight='300px';content.style.overflow='auto';
   const initial=!!document.querySelector('.dgc-navigation')&&host.getDiagnostics().mounts.some(m=>m.owner==='characteristics'&&m.id==='characteristics-navigation'&&m.lifetime==='persistent');
   document.querySelector('#native-control').click();const originalIdentity=nodes.every(node=>node.isConnected&&content.contains(node));
   [...document.querySelectorAll('.dgc-navigation button')].find(n=>n.textContent==='生活技能').click();await frame();await new Promise(r=>setTimeout(r,120));const navigated=content.scrollTop>0&&document.querySelector('.dgc-navigation [aria-pressed=true]')?.textContent==='生活技能';document.documentElement.removeAttribute('data-dgu-visualMotion');await frame();const stoppedAt=content.scrollTop;await new Promise(r=>setTimeout(r,160));const motionStopped=Math.abs(content.scrollTop-stoppedAt)<1;
   api.setEnabled(false);await frame();const disabled=!document.querySelector('#customOverlay .dgc-host')&&nodes.every(node=>node.isConnected&&content.contains(node));
   api.setEnabled(true);await frame();const enabled=!!document.querySelector('#customOverlay .dgc-navigation');
   document.querySelector('#customOverlay > .dgc-host').remove();await frame();const hostRemovalReentry=!!document.querySelector('#customOverlay .dgc-navigation');
   const oldOverlay=document.querySelector('#customOverlay'),replacement=document.createElement('div');replacement.id='customOverlay';replacement.dataset.overlay='characteristics';replacement.append(content);oldOverlay.replaceWith(replacement);await frame();
   const overlayReplacement=!!replacement.querySelector('.dgc-navigation')&&nodes.every(node=>node.isConnected&&content.contains(node));
   owner.dispose();await frame();api.refresh();await frame();const ownerDisposed=!document.querySelector('#customOverlay .dgc-host')&&host.getDiagnostics().mounts.some(m=>m.owner==='peer'&&m.id==='keep');
   const noRemount=!document.querySelector('#customOverlay .dgc-host')&&nodes.every(node=>node.isConnected&&content.contains(node));document.querySelector('#native-control').click();
   const classic=startCharacteristics(window);await frame();const classicPath=!!document.querySelector('#customOverlay .dgc-navigation');classic.destroy();api.destroy();peer.dispose();host.dispose();
   return {navigated,motionStopped,initial,originalIdentity,disabled,enabled,hostRemovalReentry,overlayReplacement,ownerDisposed,noRemount,classicPath,calls};
  });
  for(const key of ['navigated','motionStopped','initial','originalIdentity','disabled','enabled','hostRemovalReentry','overlayReplacement','ownerDisposed','noRemount','classicPath'])assert.equal(result[key],true,key);
  assert.equal(result.calls,2,'native handler remains attached to the same node');
  console.log('PASS characteristics persistent mount, disable/enable, host/overlay replacement, owner cleanup, peer and classic path');
 }finally{await browser.close();await vite.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
