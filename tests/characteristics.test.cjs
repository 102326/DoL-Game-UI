const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1704,height:1136}});const errors=[];p.on('pageerror',e=>errors.push(e.stack));
 await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
 await p.goto(`http://127.0.0.1:${server.address().port}/game`,{waitUntil:'load',timeout:90000});await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options,{timeout:60000});
 await p.waitForLoadState('networkidle');
 console.log('BOOT',await p.evaluate(()=>({passage:SugarCube.State.passage,keys:Object.keys(V).length,worn:!!V.worn,renderer:!!window.Renderer,skin:!!window.Skin})));
 await p.evaluate(()=>{SugarCube.Engine.play('Start2')});
 await p.waitForLoadState('networkidle');
 console.log('START2',await p.evaluate(()=>({passage:SugarCube.State.passage,worn:!!V.worn,wardrobe:!!V.wardrobe,errors:[...document.querySelectorAll('.error')].map(e=>e.textContent.slice(0,180))})));

 await p.evaluate(()=>{new SugarCube.Wikifier(null,'<<overlayReplace "characteristics">>')});
 await p.waitForSelector('#characteristics-display');
 await p.evaluate(()=>{window.originalContent=document.querySelector('#customOverlayContent');window.originalHTML=originalContent.innerHTML;window.originalNodes=[...originalContent.querySelectorAll('*')];window.originalState=JSON.stringify(V)});
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 await p.waitForSelector('.dgc-navigation');
 assert.equal(await p.evaluate(()=>originalContent.innerHTML===originalHTML),true,'native contents unchanged');
 assert.equal(await p.evaluate(()=>JSON.stringify(V)===originalState),true,'UI mount does not mutate game state');
 assert.ok(await p.locator('.dgc-navigation button').count()>3);
 await p.getByRole('button',{name:'学业',exact:true}).click();
 assert.ok(await p.evaluate(()=>document.querySelector('#customOverlayContent').scrollTop)>0,'navigation scrolls overlay');
 await p.evaluate(()=>{window.linkCalls=0;const b=document.createElement('button');b.id='test-mod-control';b.textContent='Mod control';b.onclick=()=>linkCalls++;originalContent.append(b)});
 await p.locator('#test-mod-control').click();assert.equal(await p.evaluate(()=>linkCalls),1,'added mod control remains functional');
 await p.evaluate(()=>DoLGameUI.setPreference('characteristicsEnabled',false));
 assert.equal(await p.locator('.dgc-host').count(),0);
 assert.equal(await p.evaluate(()=>originalNodes.every(e=>e.isConnected)),true,'fallback preserves original nodes');
 await p.evaluate(()=>DoLGameUI.setPreference('characteristicsEnabled',true));await p.waitForSelector('.dgc-navigation');
 for(const [name,width,height] of [['tablet',1704,1136],['phone',390,844]]){
  await p.setViewportSize({width,height});await p.evaluate(()=>document.querySelector('#customOverlayContent').scrollTop=0);
  await p.screenshot({path:path.join(__dirname,`artifacts/characteristics-${process.env.DOL_WARDROBE_INTEGRATED?'lyra':'vanilla'}-${name}.png`)});
  assert.equal(await p.locator('.dgc-navigation').evaluate(e=>e.getBoundingClientRect().right<=innerWidth+1),true,'navigation within viewport');
 }
 await p.evaluate(()=>{closeOverlay()});await p.waitForFunction(()=>!document.querySelector('.dgc-host'));
 await p.evaluate(()=>{new SugarCube.Wikifier(null,'<<overlayReplace "characteristics">>')});await p.waitForSelector('.dgc-navigation');
 assert.equal(await p.locator('.dgc-host').count(),1);
 await p.evaluate(()=>{closeOverlay();new SugarCube.Wikifier(null,'<<overlayReplace "social">>')});await p.waitForFunction(()=>!document.querySelector('.dgc-host'));
 assert.equal(await p.locator('.dgc-overlay').count(),0,'no styling leaked to social');
 await p.evaluate(()=>{closeOverlay();new SugarCube.Wikifier(null,'<<overlayReplace "characteristics">>')});await p.waitForSelector('.dgc-navigation');
 await p.evaluate(()=>DoLMidnightTheme.setPreference('layout',false));
 await p.getByRole('button',{name:'学业',exact:true}).click();
 assert.ok(await p.evaluate(()=>document.querySelector('#customOverlayContent').scrollTop)>0,'works without global responsive layout');
 await p.getByRole('button',{name:'概况',exact:true}).click();assert.equal(await p.evaluate(()=>document.querySelector('#customOverlayContent').scrollTop),0);
 await p.evaluate(()=>DoLMidnightTheme.setPreference('layout',true));
 // Full overlay replacement must release its previous Vue instance.
 await p.evaluate(()=>{const old=document.querySelector('#customOverlay');window.detachedOverlay=old;const next=old.cloneNode(true);next.querySelector('.dgc-host')?.remove();next.classList.remove('dgc-overlay');old.replaceWith(next)});
 await p.waitForSelector('.dgc-navigation');
 assert.equal(await p.evaluate(()=>detachedOverlay.querySelector('.dgc-host')===null),true);
 assert.equal(await p.locator('.dgc-host').count(),1);
 await p.evaluate(()=>{const item=document.querySelector('#prof');if(item)item.remove()});
 await p.waitForFunction(()=>![...document.querySelectorAll('.dgc-navigation button')].some(e=>e.textContent==='武器技能'));
 // Ordinary sidebar changes must not rebuild or scan the attributes content.
 await p.waitForTimeout(100);const counts=await p.evaluate(()=>DoLCharacteristicsUI.getLifecycleCounts());
 await p.evaluate(()=>{const node=document.createElement('div');document.body.append(node);for(let i=0;i<20;i++)node.textContent=String(i);node.remove()});await p.waitForTimeout(100);
 assert.deepEqual(await p.evaluate(()=>DoLCharacteristicsUI.getLifecycleCounts()),counts);
 await p.evaluate(()=>DoLGameUI.openSettings());await p.getByLabel('启用新版属性界面',{exact:true}).uncheck();await p.locator('.dmt-close').click();assert.equal(await p.locator('.dgc-host').count(),0);
 await p.evaluate(()=>DoLGameUI.setPreference('characteristicsEnabled',true));await p.waitForSelector('.dgc-navigation');
 await p.evaluate(()=>DoLGameUI.destroy());assert.equal(await p.locator('.dgc-host').count(),0);assert.equal(await p.locator('.dgc-overlay').count(),0);
 const newErrors=errors.filter(e=>!(process.env.DOL_WARDROBE_INTEGRATED&&e.includes('skybox')&&e.includes('bannerFallbackImage.onload')));assert.deepEqual(newErrors,[]);
 console.log('PASS characteristics: native DOM/state preservation, navigation, mod handler, fallback, lifecycle, phone/tablet, no unrelated rescans.');
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
