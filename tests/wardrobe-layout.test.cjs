const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const out=process.env.DOL_TEST_OUT||path.join(__dirname,'artifacts');fs.mkdirSync(out,{recursive:true});
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
 if(process.env.DOL_WARDROBE_CONTROL){await p.evaluate(()=>SugarCube.Engine.play('Wardrobe'));await p.waitForLoadState('networkidle');fs.writeFileSync(path.join(__dirname,'artifacts/wardrobe-control.json'),JSON.stringify({scope:'Same integrated game, no new UI injected',errors},null,2));console.log('CONTROL_ERRORS',errors);return}
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 await p.evaluate(()=>{V.location='home';V.lastWardrobeSlot='upper';V.wardrobe_location='wardrobe';for(const d of setup.clothes.upper.filter(c=>c.name!=='naked'&&!c.outfitPrimary&&!c.outfitSecondary).slice(0,3)){const item=structuredClone(d);item.colour=item.colour_options?.[0]??0;item.accessory_colour=item.accessory_colour_options?.[0]??0;V.wardrobe.upper.push(item)}SugarCube.Engine.play('Wardrobe')});
 await p.waitForSelector('.dgw-shell');await p.waitForFunction(()=>document.querySelector('.dgw-preview').getAttribute('aria-busy')==='false');
 console.log('PREVIEW',await p.evaluate(()=>({status:document.querySelector('.dgw-render-status').textContent,message:document.querySelector('.dgw-message').textContent,canvas:!!document.querySelector('.dgw-preview canvas')})));
 assert.equal(await p.locator('.dgw-preview canvas').count(),1);
 await p.evaluate(()=>{V.money=820005000;V.intro=0;for(let i=0;i<40;i++)V.wardrobe.upper.push(structuredClone(V.wardrobe.upper[0]));SugarCube.Engine.play('Wardrobe')});
 await p.waitForSelector('.dgw-shell');await p.waitForFunction(()=>document.querySelector('.dgw-preview')?.getAttribute('aria-busy')==='false');
 assert.equal(await p.locator('.dgw-exits #wardrobeExits a').count()>0,true);
 assert.equal(await p.locator('.dgw-slots small').count(),0);
 await p.evaluate(()=>{DoLMidnightTheme.setPreference('collapsedStats',true)});
 assert.equal(await p.locator('#dmt-status-toggle').count(),0);
 assert.equal(await p.evaluate(()=>document.documentElement.hasAttribute('data-dmt-stats-collapsed')),false);
 await p.evaluate(()=>{window.capacityBefore=V.wardrobe.space;V.wardrobe.space=Math.ceil(V.wardrobe.upper.length/0.95);DoLWardrobeUI.refresh()});
 await p.waitForSelector('.dgw-capacity-alert.near');
 await p.evaluate(()=>{V.wardrobe.space=V.wardrobe.upper.length;DoLWardrobeUI.refresh()});await p.waitForSelector('.dgw-capacity-alert.full');
 await p.evaluate(()=>{V.wardrobe.space=capacityBefore;DoLWardrobeUI.refresh()});
 await p.getByRole('button',{name:'整理模式',exact:true}).click();
 await p.locator('.dgw-item').first().click(); // Management selects; this does not wear the garment.
 const visualBefore=await p.evaluate(()=>({V:JSON.stringify(V),prefs:DoLGameUI.getPreferences()}));
 const visualNodes=await p.evaluateHandle(()=>[...document.querySelectorAll('.dgw-root button,.dgw-root input,.dgw-root select')].map(node=>({node,parent:node.parentNode})));
 await p.mouse.move(0,0);
 for(const tier of [0,1,2]){
  await p.evaluate(tier=>{DoLGameUI.setPreference('visualTier',tier);DoLGameUI.setPreference('visualGlow',true)},tier);await p.waitForTimeout(200);
  for(const selector of ['.dgw-slots button[aria-pressed=true]','.dgw-item[aria-pressed=true]','.dgw-equipped']){
   const quiet=await p.locator(selector).first().evaluate(e=>{const s=getComputedStyle(e),rgb=s.backgroundColor.match(/[\d.]+/g).slice(0,3).map(Number);return{neutral:Math.max(...rgb)-Math.min(...rgb)<=8,image:s.backgroundImage,blur:s.backdropFilter,animation:getComputedStyle(e,'::after').animationName,shadow:s.boxShadow,border:s.borderTopColor}});
   assert.ok(quiet.neutral&&quiet.image==='none'&&quiet.blur==='none'&&quiet.animation==='none'&&quiet.shadow.includes('inset'),'quiet wardrobe selection '+JSON.stringify({tier,selector,quiet}));
   assert.ok(Number(quiet.border.match(/[\d.]+/g)[3]??1)<=.1,'weak wardrobe full edge');
  }
 }
 assert.ok(await p.evaluate(nodes=>nodes.every(({node,parent})=>node.isConnected&&node.parentNode===parent),visualNodes),'style tier retains control identity and parent');await visualNodes.dispose();
 assert.equal(await p.evaluate(()=>JSON.stringify(V)),visualBefore.V,'material changes do not write game state');
 await p.evaluate(prefs=>{DoLGameUI.setPreference('visualTier',prefs.visualTier);DoLGameUI.setPreference('visualGlow',prefs.visualGlow)},visualBefore.prefs);

 for(const [width,height] of [[1704,1136],[1136,1704],[390,844],[844,390],[1440,900]]){
  await p.setViewportSize({width,height});
  await p.evaluate(()=>{SugarCube.UIBar.stow();document.querySelector('.dgw-items').scrollIntoView({block:'start'})});
  await p.waitForTimeout(100);
  const geometry=await p.locator('.dgw-selection-bar').evaluate(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,overflow:e.scrollWidth>e.clientWidth+1}});
  assert.ok(geometry.left>=0&&geometry.right<=width+1&&geometry.top>=0&&geometry.bottom<=height+1,JSON.stringify({width,height,geometry}));assert.equal(geometry.overflow,false);
  await p.screenshot({path:path.join(out,`wardrobe-layout-${width}x${height}.png`)});
 }
 await p.setViewportSize({width:1704,height:1136});await p.evaluate(()=>SugarCube.UIBar.unstow());await p.waitForTimeout(300);
 const stats=await p.locator('#stats').evaluate(e=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll('.centered-elements>div')].map(n=>{const b=n.getBoundingClientRect();return {text:n.textContent.trim(),fits:b.left>=r.left-1&&b.right<=r.right+1,contentFits:n.scrollWidth<=n.clientWidth+1}})});
 assert.ok(stats.length>0&&stats.every(s=>s.fits&&s.contentFits),JSON.stringify(stats));assert.ok(await p.locator('#statmeters').isVisible());
 await p.screenshot({path:path.join(out,'wardrobe-layout-sidebar.png')});
 assert.equal(await p.locator('.dgw-preview-disclosure').isVisible(),false,'management intentionally hides character preview');
 await p.getByRole('button',{name:'退出整理',exact:true}).click();
 await p.locator('.dgw-root').evaluate(e=>e.style.width='540px');
 const narrow=await p.locator('.dgw-workspace').evaluate(e=>({columns:getComputedStyle(e).gridTemplateColumns.split(' ').length,overflow:e.scrollWidth>e.clientWidth+1}));
 assert.equal(narrow.columns,1);assert.equal(narrow.overflow,false);
 await p.waitForFunction(()=>!document.querySelector('.dgw-preview-disclosure').open);
 const previewState=await p.evaluate(()=>JSON.stringify(V));
 const canvas=await p.locator('.dgw-preview canvas').elementHandle();
 const disclosure=p.locator('.dgw-preview-disclosure');
 assert.equal(await p.locator('.dgw-preview').isVisible(),false,'narrow preview starts collapsed, leaving inventory available');
 await disclosure.locator('summary').click();
 assert.ok(await p.locator('.dgw-preview').isVisible());
 await p.locator('.dgw-root').evaluate(e=>e.style.width='560px');
 await p.waitForTimeout(100);
 assert.ok(await disclosure.evaluate(e=>e.open),'ordinary resize retains the user choice');
 assert.ok(await p.evaluate(canvas=>document.querySelector('.dgw-preview canvas')===canvas,canvas),'disclosure preserves the current canvas');
 assert.equal(await p.evaluate(()=>JSON.stringify(V)),previewState,'preview disclosure does not change game state');
 await disclosure.locator('summary').click();
 await p.locator('.dgw-root').evaluate(e=>e.style.removeProperty('width'));
 await p.waitForFunction(()=>document.querySelector('.dgw-preview-disclosure').open);

 console.log('PASS sidebar full money/time/day, always visible character status, category warnings, header exit, side/mobile management dock across five viewports');
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
