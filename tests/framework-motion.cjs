const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{buildSync}=require('esbuild');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'tests/artifacts/stone-free-motion','browser-'+Date.now());fs.mkdirSync(dir,{recursive:true});
const checks=[],check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS',name)};
const geometry=buildSync({entryPoints:[path.join(root,'framework/motion-hub/geometry.ts')],bundle:true,write:false,format:'cjs'}).outputFiles[0].text;
const moduleGeometry={exports:{}};new Function('module','exports',geometry)(moduleGeometry,moduleGeometry.exports);
const {readPosition,locate}=moduleGeometry.exports;
assert.deepEqual(readPosition('{"side":"left","y":2,"docked":true}'),{side:'left',y:1,docked:true});
for(const input of ['null','{}','{"side":"left","y":"1","docked":true}','x'.repeat(1025)])assert.deepEqual(readPosition(input),{side:'right',y:.58,docked:false});
assert.deepEqual(locate({side:'right',y:1,docked:true},{left:5,top:10,width:390,height:400}),{x:357,y:326});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const p=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];p.setDefaultTimeout(5000);p.on('pageerror',e=>errors.push(e.message));
  await p.route('http://motion.test/',r=>r.fulfill({contentType:'text/html',body:'<style>body{margin:0;background:radial-gradient(ellipse at 80% 40%,#60728070,transparent 50%),linear-gradient(120deg,#18242e,#323736);color:#e4e9ed;font:16px/1.7 system-ui;height:1600px}main{max-width:660px;margin:100px auto}#ui-bar{position:fixed;top:12px;left:12px}#foreign{display:block}</style><div id="ui-bar"><button id="ui-bar-toggle">Native sidebar</button></div><main id="passages"><h1>DoL fixture · reading space</h1><p>Original content remains interactive beneath the modeless hub.</p><input id="foreign" aria-label="Native input"><button id="next">Next passage</button></main>'}));await p.goto('http://motion.test/');
  await p.evaluate(()=>{window.State={variables:{pain:4,stress:12,tiredness:8,money:1234}};window.SugarCube={State,UIBar:{isStowed:()=>document.querySelector('#ui-bar').classList.contains('stowed')}};window.native=document.querySelector('#ui-bar-toggle');window.nativeParent=native.parentNode;window.nativeClicks=0;native.addEventListener('click',()=>{nativeClicks++;native.parentNode.classList.toggle('stowed')});localStorage.setItem('ForeignMod.settings','untouched')});
  async function load(name){const base=path.join(root,'dist/framework',name);if(fs.existsSync(path.join(base,'style.css')))await p.addStyleTag({path:path.join(base,'style.css')});await p.addScriptTag({path:path.join(base,'index.js')})}
  await load('host');await load('motion-hub');
  const hub=p.locator('.sf-motion-hub'),ball=hub.locator('.sf-motion-ball'),orbit=hub.locator('.sf-motion-orbit'),sheet=hub.locator('.sf-motion-sheet');
  const choose=async id=>{await ball.click();await hub.locator(`[data-motion-view="StoneFreeMotionHub:${id}"]`).click();await sheet.locator('[data-sf-mount]').waitFor()};
  const bounds=async locator=>locator.evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,overflow:n.scrollWidth>n.clientWidth}});
  await check('spatial fan and sheet transitions remain interruptible; original state view is genuinely mounted',async()=>{
   await ball.click();await p.waitForTimeout(70);await p.screenshot({path:path.join(dir,'fan-in-motion.png')});
   const during=await orbit.locator('.sf-motion-petal').first().evaluate(n=>({transform:getComputedStyle(n).transform,duration:getComputedStyle(n).transitionDuration}));assert.ok(during.transform!=='none');assert.ok(during.duration.includes('0.48s'));
   await p.waitForTimeout(500);await p.screenshot({path:path.join(dir,'fan-wide.png')});
   await orbit.locator('[data-motion-view="StoneFreeMotionHub:status"]').click();await p.waitForFunction(()=>document.querySelector('.sf-motion-sheet dd')?.textContent==='4');
   assert.equal(await sheet.locator('h2').evaluate(n=>n===document.activeElement),true);await p.waitForTimeout(550);await p.screenshot({path:path.join(dir,'status-wide.png')});
   await sheet.getByRole('button',{name:'关闭详情',exact:true}).click();assert.equal(await ball.evaluate(n=>n===document.activeElement),true);
   await p.evaluate(()=>{const b=document.querySelector('.sf-motion-ball');for(let i=0;i<7;i++)b.click()});await p.waitForTimeout(40);await ball.press('Escape');
   assert.equal(await orbit.getAttribute('inert'),'');assert.equal(await sheet.locator('[data-sf-mount]').count(),0);
  });
  await check('two independently mounted views consume the same source; original sidebar outcome is witnessed once',async()=>{
   await choose('compare');await sheet.getByRole('button',{name:'设为对照',exact:true}).click();await sheet.getByRole('button',{name:'刷新对照',exact:true}).click();assert.ok((await sheet.innerText()).includes('4'));
   await sheet.getByRole('button',{name:'关闭详情',exact:true}).click();await choose('reading');await sheet.getByRole('button',{name:'切换侧栏',exact:true}).click();await p.waitForFunction(()=>nativeClicks===1);
   assert.deepEqual(await p.evaluate(()=>({stowed:SugarCube.UIBar.isStowed(),same:native===document.querySelector('#ui-bar-toggle')&&native.parentNode===nativeParent,money:State.variables.money,modal:DoLUiHost.getDiagnostics().claims.some(x=>x.kind==='modal')})),{stowed:true,same:true,money:1234,modal:false});
   await sheet.getByRole('button',{name:'切换侧栏',exact:true}).click();await p.waitForFunction(()=>nativeClicks===2);await sheet.getByRole('button',{name:'关闭详情',exact:true}).click();
  });
  await check('real pointer drag docks and restores; cancellation and viewport changes do not persist a partial drag',async()=>{
   let box=await ball.boundingBox();await p.mouse.move(box.x+28,box.y+28);await p.mouse.down();await p.mouse.move(9,330,{steps:10});await p.mouse.up();await p.waitForTimeout(550);
   assert.equal(await ball.evaluate(n=>n.classList.contains('is-docked')),true);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('StoneFreeMotionHub.position.v1')).side),'left');
   await p.screenshot({path:path.join(dir,'docked.png')});await ball.click();await p.waitForTimeout(550);assert.equal(await ball.evaluate(n=>n.classList.contains('is-docked')),false);
   const saved=await p.evaluate(()=>localStorage.getItem('StoneFreeMotionHub.position.v1'));box=await ball.boundingBox();await p.mouse.move(box.x+28,box.y+28);await p.mouse.down();await p.mouse.move(260,450,{steps:5});await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await p.mouse.up();assert.equal(await p.evaluate(()=>localStorage.getItem('StoneFreeMotionHub.position.v1')),saved);
   box=await ball.boundingBox();await p.mouse.move(box.x+20,box.y+20);await p.mouse.down();await p.mouse.move(300,500,{steps:5});await p.setViewportSize({width:390,height:844});await p.mouse.up();await p.waitForTimeout(550);assert.equal(await p.evaluate(()=>localStorage.getItem('StoneFreeMotionHub.position.v1')),saved);
  });
  await check('narrow, landscape and short/IME-sized viewports retain reachable controls without horizontal overflow',async()=>{
   for(const size of [{width:390,height:844},{width:844,height:390},{width:760,height:800},{width:390,height:260}]){
    await p.setViewportSize(size);await p.waitForTimeout(550);await ball.click();await p.waitForTimeout(550);
    for(const node of [ball,orbit]){const b=await bounds(node);assert.ok(b.x>=0&&b.y>=0&&b.right<=size.width&&b.bottom<=size.height&&(node===ball||!b.overflow),JSON.stringify({size,b}))}
    await orbit.locator('[data-motion-view="StoneFreeMotionHub:reading"]').click();await p.waitForTimeout(550);const b=await bounds(sheet);assert.ok(b.x>=0&&b.y>=0&&b.right<=size.width&&b.bottom<=size.height&&!b.overflow,JSON.stringify({size,b}));
    await sheet.getByRole('button',{name:'关闭详情',exact:true}).click();
   }
   await p.setViewportSize({width:390,height:844});await p.waitForTimeout(550);await choose('status');await p.waitForTimeout(550);await p.screenshot({path:path.join(dir,'status-narrow.png')});await sheet.getByRole('button',{name:'关闭详情',exact:true}).click();
  });
  await check('native input is not trapped; reduced motion keeps outcome and local position reset works',async()=>{
   await choose('status');await p.locator('#foreign').focus();assert.equal(await sheet.getAttribute('inert'),'');
   await choose('status');await p.evaluate(()=>{window.nativeModal=document.createElement('dialog');nativeModal.innerHTML='<button>Native modal</button>';document.body.append(nativeModal);nativeModal.showModal()});assert.equal(await hub.isVisible(),false);await p.evaluate(()=>{nativeModal.close();nativeModal.remove()});assert.equal(await sheet.getAttribute('inert'),'');
   await p.locator('#foreign').fill('native input');await p.keyboard.press('Escape');assert.equal(await p.locator('#foreign').inputValue(),'native input');
   await ball.click();await orbit.getByRole('button',{name:'恢复位置',exact:true}).click();
   await p.emulateMedia({reducedMotion:'reduce'});await choose('reading');assert.equal(await sheet.evaluate(n=>getComputedStyle(n).transitionDuration),'0s');await sheet.getByRole('button',{name:'切换侧栏',exact:true}).click();await p.waitForFunction(()=>nativeClicks===3);
   await sheet.getByRole('button',{name:'关闭详情',exact:true}).click();await ball.click();await orbit.getByRole('button',{name:'恢复位置',exact:true}).click();assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('StoneFreeMotionHub.position.v1'))),{side:'right',y:.58,docked:false});
   await p.emulateMedia({reducedMotion:'no-preference'});
  });
  await check('public late views use bounded grid; provider withdrawal and scene invalidation clean mounted views',async()=>{
   await p.evaluate(()=>{window.author=DoLUiHost.register('IndependentAuthor');author.provideView({id:'extra',title:'作者新视图',setup(c){c.element.textContent='Independent content';return ()=>window.authorCleaned=true}})});
   await ball.click();assert.equal(await orbit.evaluate(n=>n.classList.contains('is-grid')),true);await orbit.getByRole('button',{name:'作者新视图',exact:false}).click();await sheet.getByText('Independent content',{exact:true}).waitFor();
   await p.evaluate(()=>author.dispose());assert.equal(await p.evaluate(()=>authorCleaned),true);assert.equal(await sheet.getAttribute('inert'),'');
   await choose('status');await p.evaluate(()=>DoLUiHost.invalidateScene());await p.waitForFunction(()=>document.querySelector('.sf-motion-sheet').inert);assert.equal(await sheet.locator('[data-sf-mount]').count(),0);await p.evaluate(()=>DoLUiHost.sceneReady());await choose('reading');await sheet.getByRole('button',{name:'关闭详情',exact:true}).click();
  });
  await check('exit releases owned adapters, public views, capture and listeners; persisted UI location reopens cleanly',async()=>{
   const events=await p.evaluate(()=>{let touches=0;const handler=()=>touches++;document.addEventListener('touchend',handler);try{document.querySelector('.sf-motion-ball').dispatchEvent(new TouchEvent('touchend',{bubbles:true}));const own=touches;document.querySelector('#foreign').dispatchEvent(new TouchEvent('touchend',{bubbles:true}));return {own,native:touches}}finally{document.removeEventListener('touchend',handler)}});assert.deepEqual(events,{own:0,native:1});
   await ball.click();await orbit.getByRole('button',{name:'退出原型',exact:true}).click();assert.equal(await hub.count(),0);
   const after=await p.evaluate(()=>({d:DoLUiHost.getDiagnostics(),foreign:localStorage.getItem('ForeignMod.settings'),input:document.querySelector('#foreign').value,native:native.isConnected}));
   assert.equal(after.d.participants.length,0);assert.equal(after.d.mounts.length,0);assert.equal(after.d.sources.length,0);assert.equal(after.d.commands.length,0);assert.equal(after.d.views.length,0);assert.equal(after.foreign,'untouched');assert.equal(after.input,'native input');assert.equal(after.native,true);
   await load('motion-hub');await ball.waitFor();assert.equal(await ball.getAttribute('aria-expanded'),'false');await p.evaluate(()=>StoneFree_motion_hub.dispose());await p.waitForTimeout(550);assert.equal(await hub.count(),0);assert.deepEqual(errors,[]);
  });
  await p.close();fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({status:'passed',checks,limits:['Browser fixture and controlled input, not physical touch','Viewport resize is not an actual Android keyboard','Natural Passage navigation is not covered by this fixture; the Android receipt defines its own scope']},null,2));console.log(dir);
 }finally{await browser.close()}
})().catch(e=>{fs.writeFileSync(path.join(dir,'failure.json'),JSON.stringify({status:'failed',checks,error:e.message},null,2));console.error(e);process.exitCode=1});
