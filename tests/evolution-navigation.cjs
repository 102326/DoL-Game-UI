// @ci-contract {"profiles":["standard","research"],"classification":"contract","granularity":"entry"}
// Controlled actual consumers + actual Host, not a full game/device acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default;
 const server=await createServer({configFile:false,plugins:[vue(),{name:'evolution-navigation',configureServer(s){s.middlewares.use('/__evo_nav__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<!doctype html><html><body></body></html>')})}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 let browser;const results=[];fs.mkdirSync('tests/artifacts/evolution',{recursive:true});
 try{await server.listen();browser=await chromium.launch(require('./browser-options.cjs'));
 for(const kind of ['characteristics','social']){
  const page=await browser.newPage({viewport:{width:1100,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__evo_nav__');await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
  const r=await page.evaluate(async kind=>{
   const [{startCharacteristics},{startSocial},{createHost}]=await Promise.all([import('/src/characteristics/main.ts'),import('/src/social/main.ts'),import('/framework/host.ts')]);
   const first=kind==='social'?'npc-relations':'base-characteristics',last=kind==='social'?'global-recognition':'school-grades',marker=kind==='social'?'relation-display':'characteristics-display',prefix=kind==='social'?'dgs':'dgc',claimKey=kind==='social'?'social-navigation-lifecycle':'characteristics-navigation-life';
   document.body.innerHTML=`<div id="customOverlay" data-overlay="${kind}" style="width:750px;height:420px"><div id="customOverlayContent" style="height:240px;max-height:240px;overflow:auto"><div id="${marker}"><h2>First</h2><section id="${first}" style="height:600px"><button id="native">Native</button></section><h2 id="last-heading">Last</h2><section id="${last}" style="height:600px"></section></div></div></div><div id="peer"></div>`;
   const content=document.getElementById('customOverlayContent'),original=[...content.querySelectorAll('*')];let calls=0;document.getElementById('native').onclick=()=>calls++;
   const host=createHost(window),owner=host.register('consumer'),peer=host.register('peer'),start=kind==='social'?startSocial:startCharacteristics;
   const ui=start(window,{host,owner}),frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   await frame();const mounted=!!document.querySelector('.'+prefix+'-navigation');
   document.querySelector('#native').click();document.querySelector('#customOverlay').classList.add('hidden');await frame();
   const disabled=!document.querySelector('.'+prefix+'-host');const lease=peer.claim('region',claimKey),leaseReleased=!!lease;
   document.querySelector('#customOverlay').classList.remove('hidden');ui.refresh();await frame();const respectsLease=!document.querySelector('.'+prefix+'-host');lease?.release();ui.refresh();await frame();const reentered=!!document.querySelector('.'+prefix+'-host');
   document.documentElement.setAttribute('data-stone-free','');const zoom=[];
   for(const value of [1,1.25,.85]){document.body.style.zoom=String(value);content.scrollTop=0;const button=[...document.querySelectorAll('.'+prefix+'-navigation button')].find(n=>n.textContent===(kind==='social'?'知名度':'学业'));if(!button)throw Error('Expected actual navigation button: '+kind);button.click();await frame();const a=document.getElementById('last-heading').getBoundingClientRect(),b=content.getBoundingClientRect();zoom.push({zoom:value,gap:a.top-b.top,expected:16*value});}
   let proxyZoom=true,proxyGeometry;
   if(kind==='characteristics'){
    document.body.style.zoom='1.25';document.documentElement.setAttribute('data-dgu-visualMotion','');
    [...document.querySelectorAll('.'+prefix+'-navigation button')].find(n=>n.textContent==='学业').click();
    const proxy=await new Promise((resolve,reject)=>{const begin=performance.now();const tick=()=>{const n=document.querySelector('.kw-object-relay');if(n)resolve(n);else if(performance.now()-begin>2500)reject(Error('Expected real characteristics relay'));else requestAnimationFrame(tick)};requestAnimationFrame(tick)});
    const animation=proxy.getAnimations()[0];animation.pause();let lo=0,hi=animation.effect.getTiming().duration;for(let i=0;i<28;i++){animation.currentTime=(lo+hi)/2;if(animation.effect.getComputedTiming().progress<.78)lo=animation.currentTime;else hi=animation.currentTime}
    const a=proxy.getBoundingClientRect(),g=document.getElementById(last).getBoundingClientRect(),v=content.getBoundingClientRect(),expectedTop=Math.max(g.top,v.top);
    proxyGeometry={rect:a.toJSON(),group:g.toJSON(),viewport:v.toJSON(),progress:animation.effect.getComputedTiming().progress};proxyZoom=Math.abs(a.x-g.x)<3&&Math.abs(a.y-expectedTop)<3&&Math.abs(a.width-g.width)<3;
    document.documentElement.removeAttribute('data-dgu-visualMotion');await frame();
   }
   const before=ui.getLifecycleCounts();const unrelated=document.createElement('div');document.body.append(unrelated);unrelated.textContent='outside';unrelated.remove();await frame();const noUnrelatedScan=JSON.stringify(before)===JSON.stringify(ui.getLifecycleCounts());
   const old=document.getElementById('customOverlay'),replacement=document.createElement('div');replacement.id='customOverlay';replacement.dataset.overlay=kind;replacement.append(content);old.replaceWith(replacement);await frame();const replacementSafe=!old.querySelector('.'+prefix+'-host')&&!!replacement.querySelector('.'+prefix+'-navigation');
   document.documentElement.setAttribute('data-dgu-visualMotion','');for(const id of [first,last,first,last])[...document.querySelectorAll('.'+prefix+'-navigation button')].find(n=>n.textContent===(id===first?(kind==='social'?'主要关系':'基础属性'):(kind==='social'?'知名度':'学业'))).click();ui.setEnabled(false);await frame();const cancelled=!document.querySelector('.'+prefix+'-host');ui.setEnabled(true);await frame();
   const shared=ui.getLifecycleCounts();owner.dispose();await frame();ui.refresh();await frame();const ownerReleased=!document.querySelector('.'+prefix+'-host');
   document.getElementById('native').click();const nativeSafe=original.every(n=>n.isConnected&&content.contains(n))&&calls===2;
   ui.destroy();peer.dispose();host.dispose();
   // Actual shared adapter must recover a failed mount and relinquish its lease.
   const h2=createHost(window),o2=h2.register('fault'),raw=o2.mount.bind(o2);let fail=true;
   const wrapper={...o2,mount(request){if(fail){fail=false;throw Error('controlled mount failure')}return raw(request)}};
   const retry=start(window,{host:h2,owner:wrapper});await frame();const faultClean=!document.querySelector('.'+prefix+'-host');retry.setEnabled(true);await frame();const recovered=!!document.querySelector('.'+prefix+'-navigation');retry.destroy();o2.dispose();h2.dispose();
   const classic=start(window);await frame();const classicMounted=!!document.querySelector('.'+prefix+'-navigation');classic.destroy();
   return{kind,mounted,disabled,leaseReleased,respectsLease,reentered,zoom,proxyZoom,proxyGeometry,noUnrelatedScan,replacementSafe,cancelled,ownerReleased,nativeSafe,faultClean,recovered,classicMounted,shared,finalNodes:document.querySelectorAll('.'+prefix+'-host').length};
  },kind);
  results.push(r);fs.writeFileSync('tests/artifacts/evolution/navigation.json',JSON.stringify({results,errors},null,2));
  for(const key of ['mounted','disabled','leaseReleased','respectsLease','reentered','noUnrelatedScan','replacementSafe','cancelled','ownerReleased','nativeSafe','proxyZoom','faultClean','recovered','classicMounted'])assert.equal(r[key],true,kind+': '+key);
  for(const z of r.zoom)assert.ok(Math.abs(z.gap-z.expected)<=3,kind+': zoom coordinate '+JSON.stringify(z));
  assert.equal(r.shared.implementation,'native-overlay-navigation/v1');assert.equal(r.shared.mountContract,'navigation-mount/v1');assert.equal(r.finalNodes,0);assert.deepEqual(errors,[]);console.log('PASS EVO-A1',kind);await page.close();
 }
 }finally{await browser?.close();await server.close()}
})().catch(e=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(e);process.exitCode=1});
