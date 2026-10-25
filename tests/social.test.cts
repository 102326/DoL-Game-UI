import playwright = require('playwright');
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import assert = require('node:assert/strict');
import esbuild = require('esbuild');
import type {GameUiControls} from '../src/runtime/game-controls';
const {chromium}=playwright,{buildSync}=esbuild;
declare const V:Record<string,unknown>&{NPCName:{nam:string}[];options:{images:number}},SugarCube:{State:{variables:Record<string,unknown>;passage:string};Engine:{play(passage:string):unknown};Wikifier:new(output:Element|null,source:string)=>unknown};
declare const DoLGameUI:GameUiControls,DoLMidnightTheme:GameUiControls,DoLSocialUI:ReturnType<typeof import('../src/social/main').startSocial>;
declare const originalContent:HTMLElement,originalHTML:string,originalState:string,originalNodes:Element[],detachedOverlay:HTMLElement;
declare let linkCalls:number;
declare function closeOverlay():void;
declare const must:<T>(value:T|null|undefined)=>T;

const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
async function frameworkMountLifecycle(){
 const [{createServer},{default:vue}]=await Promise.all([import('vite'),import('@vitejs/plugin-vue')]);
 const vite=await createServer({configFile:false,root:process.cwd(),plugins:[vue(),{name:'social-test-page',configureServer(server){server.middlewares.use('/__social_framework_test__',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body></body></html>')})}}],optimizeDeps:{noDiscovery:true,include:['vue']},server:{host:'127.0.0.1',port:0},logLevel:'error'});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{await vite.listen();const page=await browser.newPage(),address=vite.httpServer?.address();assert.ok(address&&typeof address!=='string');await page.goto(`http://127.0.0.1:${address.port}/__social_framework_test__`);
  await page.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null|undefined)=>{if(value==null)throw Error('Missing social fixture');return value}}));
  const result=await page.evaluate(async()=>{
   const [{startSocial},{createHost}]=await Promise.all([import('/src/social/main.ts'),import('/framework/host.ts')]);
   document.body.innerHTML='<div id="customOverlay" data-overlay="social"><div id="customOverlayContent"><section id="relation-display"><h2 id="npc-relations">Relations</h2><button id="native-action">Native action</button></section></div></div><div id="peer"></div>';
   let nativeCalls=0;const content=must(document.querySelector<HTMLElement>('#customOverlayContent')),nativeNodes=[...content.querySelectorAll('*')];must(document.querySelector<HTMLElement>('#native-action')).addEventListener('click',()=>nativeCalls++);
   const host=createHost(window),owner=host.register('social'),peer=host.register('peer');
   peer.mount({id:'keep',parent:must(document.querySelector<HTMLElement>('#peer')),lifetime:'persistent',setup(){}});
   const ui=startSocial(window,{host,owner}),frame=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));await frame();
   const initial=!!document.querySelector<HTMLElement>('.dgs-navigation')&&host.getDiagnostics().mounts.some(m=>m.owner==='social'&&m.id==='social-navigation'&&m.lifetime==='persistent');
   const identityBefore= nativeNodes.every(node=>node.isConnected&&content.contains(node));must(document.querySelector<HTMLElement>('#native-action')).click();
   ui.setEnabled(false);await frame();const disabled=!document.querySelector<HTMLElement>('.dgs-host')&&nativeNodes.every(node=>node.isConnected&&content.contains(node));
   ui.setEnabled(true);await frame();const enabledAgain=!!document.querySelector<HTMLElement>('.dgs-navigation');
   content.remove();await frame();const closed=!document.querySelector<HTMLElement>('.dgs-host');must(document.querySelector<HTMLElement>('#customOverlay')).append(content);await frame();const reopened=!!document.querySelector<HTMLElement>('.dgs-navigation');
   const oldOverlay=must(document.querySelector<HTMLElement>('#customOverlay')),replacement=document.createElement('div');replacement.id='customOverlay';replacement.dataset.overlay='social';replacement.append(content);oldOverlay.replaceWith(replacement);await frame();
   const overlayReplacement=!!document.querySelector<HTMLElement>('.dgs-navigation')&&document.querySelector('.dgs-host')?.parentElement===replacement&&nativeNodes.every(node=>node.isConnected&&content.contains(node));
   owner.dispose();await frame();ui.refresh();await frame();
   const ownerDisposed=!document.querySelector<HTMLElement>('.dgs-host')&&!host.getDiagnostics().mounts.some(m=>m.owner==='social')&&host.getDiagnostics().mounts.some(m=>m.owner==='peer'&&m.id==='keep');
   const noRemount=!!document.querySelector<HTMLElement>('#customOverlayContent')&&!document.querySelector<HTMLElement>('.dgs-host');
   const nativeAfterDispose=nativeNodes.every(node=>node.isConnected&&content.contains(node));must(document.querySelector<HTMLElement>('#native-action')).click();
   const classic=startSocial(window);await frame();const classicPath=!!document.querySelector<HTMLElement>('.dgs-navigation');classic.destroy();
   ui.destroy();peer.dispose();host.dispose();
   return {initial,identityBefore,disabled,enabledAgain,closed,reopened,overlayReplacement,ownerDisposed,noRemount,nativeAfterDispose,nativeCalls,classicPath};
  });
  for(const key of ['initial','identityBefore','disabled','enabledAgain','closed','reopened','overlayReplacement','ownerDisposed','noRemount','nativeAfterDispose','classicPath'] as const)assert.equal(result[key],true,key);
  assert.equal(result.nativeCalls,2,'native event handler survives release/remount');
  console.log('PASS social persistent Framework mount, disable/enable, overlay reentry, owner cleanup, peer and classic path');
 }finally{await browser.close();await vite.close()}
}
if(process.argv.includes('--framework-mount-only'))frameworkMountLifecycle().catch(error=>{console.error(error);process.exitCode=1});
else{
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url??'/','http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
(async()=>{await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1704,height:1136}});const errors:string[]=[];p.on('pageerror',e=>errors.push(e.stack??e.message));
 await p.addInitScript(()=>{localStorage.setItem('verifiedAge','true');Object.assign(window,{must:<T,>(value:T|null|undefined)=>{if(value==null)throw Error('Missing social fixture');return value}})});
 await p.goto(`http://127.0.0.1:${(()=>{const a=server.address();assert.ok(a&&typeof a!=='string');return a.port})()}/game`,{waitUntil:'load',timeout:90000});await p.waitForFunction(()=>SugarCube?.State?.variables?.options,{timeout:60000});
 await p.waitForLoadState('networkidle');
 console.log('BOOT',await p.evaluate(()=>({passage:SugarCube.State.passage,keys:Object.keys(V).length,worn:!!V.worn,renderer:!!Reflect.get(window,'Renderer'),skin:!!Reflect.get(window,'Skin')})));
 await p.evaluate(()=>{SugarCube.Engine.play('Start2')});
 await p.waitForLoadState('networkidle');
 console.log('START2',await p.evaluate(()=>({passage:SugarCube.State.passage,worn:!!V.worn,wardrobe:!!V.wardrobe,errors:[...document.querySelectorAll('.error')].map(e=>(e.textContent??'').slice(0,180))})));

 await p.evaluate(()=>{for(const name of ['Robin','Whitney']){const npc=V.NPCName.find(n=>n.nam===name);if(npc)Object.assign(npc,{init:1,love:20,dom:15,lust:10})}new SugarCube.Wikifier(null,'<<overlayReplace "social">>')});
 await p.waitForSelector('#relation-display');
 await p.evaluate(()=>{Object.assign(window,{originalContent:must(document.querySelector<HTMLElement>('#customOverlayContent'))});Object.assign(window,{originalHTML:originalContent.innerHTML});Object.assign(window,{originalNodes:[...originalContent.querySelectorAll('*')]});Object.assign(window,{originalState:JSON.stringify(V)})});
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 await p.waitForSelector('.dgs-navigation');
 assert.equal(await p.evaluate(()=>originalContent.innerHTML===originalHTML),true,'native contents unchanged');
 assert.equal(await p.evaluate(()=>JSON.stringify(V)===originalState),true,'UI mount does not mutate game state');
 assert.ok(await p.locator('.dgs-navigation button').count()>3);
 assert.equal(await p.locator('.dgs-navigation button').filter({hasText:'农场状况'}).count(),0,'locked farm not exposed');
 assert.ok(await p.locator('#npc-relations .relation-stat-percent').count()>0,'nonzero native stats are present');
 await p.getByRole('button',{name:'知名度',exact:true}).click();
 assert.ok(await p.evaluate(()=>must(document.querySelector<HTMLElement>('#customOverlayContent')).scrollTop)>0,'navigation scrolls overlay');
 await p.evaluate(()=>{Object.assign(window,{linkCalls:0});const b=document.createElement('button');b.id='test-mod-control';b.textContent='Mod control';b.onclick=()=>linkCalls++;originalContent.append(b)});
 await p.locator('#test-mod-control').click();assert.equal(await p.evaluate(()=>linkCalls),1,'added mod control remains functional');
 await p.evaluate(()=>DoLGameUI.setPreference('socialEnabled',false));
 assert.equal(await p.locator('.dgs-host').count(),0);
 assert.equal(await p.evaluate(()=>originalNodes.every(e=>e.isConnected)),true,'fallback preserves original nodes');
 await p.evaluate(()=>DoLGameUI.setPreference('socialEnabled',true));await p.waitForSelector('.dgs-navigation');
 for(const [name,width,height] of [['tablet',1704,1136],['phone',390,844]] as const){
  await p.setViewportSize({width,height});await p.evaluate(()=>must(document.querySelector<HTMLElement>('#customOverlayContent')).scrollTop=0);
  for(const size of ['100%','200%']){
   await p.mouse.move(0,0);
   await p.locator('html').evaluate((e,size)=>{if(!(e instanceof HTMLElement))throw Error('Missing html');e.style.fontSize=size},size);
   await p.getByRole('button',{name:'主要关系',exact:true}).click();
   assert.ok(await p.evaluate(()=>{const c=must(document.querySelector<HTMLElement>('#customOverlayContent')),h=must(must(document.querySelector<HTMLElement>('#npc-relations')).previousElementSibling);const r=h.getBoundingClientRect(),v=c.getBoundingClientRect();return r.top>=v.top+8&&r.bottom<=v.bottom}),'native group label stays fully inside the content viewport at '+width+'/'+size);
  }
  await p.locator('html').evaluate(e=>{if(!(e instanceof HTMLElement))throw Error('Missing html');e.style.fontSize='100%'});await p.evaluate(()=>must(document.querySelector<HTMLElement>('#customOverlayContent')).scrollTop=0);
  assert.equal(await p.locator('#customOverlayContent').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true,'social content has no horizontal overflow');
  await p.screenshot({path:path.join(__dirname,`artifacts/social-${process.env.DOL_WARDROBE_INTEGRATED?'lyra':'vanilla'}-${name}.png`)});
  assert.equal(await p.locator('.dgs-navigation').evaluate(e=>e.getBoundingClientRect().right<=innerWidth+1),true,'navigation within viewport');
 }
 await p.evaluate(()=>{closeOverlay()});await p.waitForFunction(()=>!document.querySelector<HTMLElement>('.dgs-host'));
 await p.evaluate(()=>{new SugarCube.Wikifier(null,'<<overlayReplace "social">>')});await p.waitForSelector('.dgs-navigation');
 assert.equal(await p.locator('.dgs-host').count(),1);
 await p.evaluate(()=>{closeOverlay();new SugarCube.Wikifier(null,'<<overlayReplace "characteristics">>')});await p.waitForFunction(()=>!document.querySelector<HTMLElement>('.dgs-host'));
 assert.equal(await p.locator('.dgs-overlay').count(),0,'no styling leaked to social');
 await p.evaluate(()=>{closeOverlay();new SugarCube.Wikifier(null,'<<overlayReplace "social">>')});await p.waitForSelector('.dgs-navigation');
 await p.evaluate(()=>DoLMidnightTheme.setPreference('layout',false));
 await p.getByRole('button',{name:'知名度',exact:true}).click();
 assert.ok(await p.evaluate(()=>must(document.querySelector<HTMLElement>('#customOverlayContent')).scrollTop)>0,'works without global responsive layout');
 await p.getByRole('button',{name:'概况',exact:true}).click();assert.equal(await p.evaluate(()=>must(document.querySelector<HTMLElement>('#customOverlayContent')).scrollTop),0);
 await p.evaluate(()=>DoLMidnightTheme.setPreference('layout',true));
 // Native image-free progress layout remains available.
 await p.evaluate(()=>{closeOverlay();V.options.images=0;new SugarCube.Wikifier(null,'<<overlayReplace "social">>')});await p.waitForSelector('.dgs-navigation');
 assert.ok(await p.locator('#npc-relations .relation-stat-list.no-images').count()>0);
 assert.ok(await p.locator('#npc-relations .progress-bar').count()>0);
 assert.equal(await p.locator('#customOverlayContent').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);
 // Full overlay replacement must release its previous Vue instance.
 await p.evaluate(()=>{const old=must(document.querySelector<HTMLElement>('#customOverlay'));Object.assign(window,{detachedOverlay:old});const next=old.cloneNode(true);if(!(next instanceof HTMLElement))throw Error('Invalid overlay clone');next.querySelector('.dgs-host')?.remove();next.classList.remove('dgs-overlay');old.replaceWith(next)});
 await p.waitForSelector('.dgs-navigation');
 assert.equal(await p.evaluate(()=>detachedOverlay.querySelector('.dgs-host')===null),true);
 assert.equal(await p.locator('.dgs-host').count(),1);
 await p.evaluate(()=>{const item=must(document.querySelector<HTMLElement>('#global-recognition'));if(item)item.remove()});
 await p.waitForFunction(()=>![...document.querySelectorAll('.dgs-navigation button')].some(e=>e.textContent==='知名度'));
 await p.evaluate(()=>DoLGameUI.openSettings());
 await p.getByRole('button',{name:'回退原版界面',exact:true}).click();
 assert.equal(await p.evaluate(()=>DoLGameUI.getPreferences().enabled),false);assert.equal(await p.locator('.dgs-host').count(),0);assert.equal(await p.evaluate(()=>DoLSocialUI.getEnabled()),true,'master off retains individual preference');
 await p.getByRole('button',{name:'启用新版界面',exact:true}).click();
 assert.equal(await p.evaluate(()=>DoLSocialUI.getEnabled()),true);
 await p.locator('.dmt-close').click();
 // Ordinary sidebar changes must not rebuild or scan the attributes content.
 await p.waitForTimeout(100);const counts=await p.evaluate(()=>DoLSocialUI.getLifecycleCounts());
 await p.evaluate(()=>{const node=document.createElement('div');document.body.append(node);for(let i=0;i<20;i++)node.textContent=String(i);node.remove()});await p.waitForTimeout(100);
 assert.deepEqual(await p.evaluate(()=>DoLSocialUI.getLifecycleCounts()),counts);
 await p.evaluate(()=>DoLGameUI.openSettings());await p.locator('.dmt-page-switches>summary').click();await p.getByLabel('启用新版社交界面',{exact:true}).uncheck();await p.locator('.dmt-close').click();assert.equal(await p.locator('.dgs-host').count(),0);
 await p.evaluate(()=>DoLGameUI.setPreference('socialEnabled',true));await p.waitForSelector('.dgs-navigation');
 await p.evaluate(()=>DoLGameUI.destroy());assert.equal(await p.locator('.dgs-host').count(),0);assert.equal(await p.locator('.dgs-overlay').count(),0);
 const newErrors=errors.filter(e=>!(process.env.DOL_WARDROBE_INTEGRATED&&e.includes('skybox')&&e.includes('bannerFallbackImage.onload')));assert.deepEqual(newErrors,[]);
 console.log('PASS social: native DOM/state preservation, navigation, mod handler, fallback, lifecycle, phone/tablet, no unrelated rescans.');
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
}
