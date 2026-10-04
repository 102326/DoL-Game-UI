const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const p=await browser.newPage({viewport:{width:1363,height:876}});
  await p.goto(pathToFileURL(path.join(__dirname,'fixture.html')).href);
  await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});
  await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
  assert.equal(await p.evaluate(()=>DoLGameUI.getPreferences().visualTier),1,'new installation defaults to balanced');
  for(const tier of [0,2]){
   const legacy=await browser.newPage();
   try{
    await legacy.goto(pathToFileURL(path.join(__dirname,'fixture.html')).href);
    const raw=JSON.stringify({visualTier:tier,fontScale:125,visualPattern:true});
    await legacy.evaluate(raw=>localStorage.setItem('DoLMidnightTheme.preferences.v1',raw),raw);
    await legacy.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
    assert.equal(await legacy.evaluate(()=>DoLGameUI.getPreferences().visualTier),tier,'saved tier remains explicit');
    assert.equal(await legacy.evaluate(()=>localStorage.getItem('DoLMidnightTheme.preferences.v1')),raw,'load does not rewrite preferences');
   }finally{await legacy.close()}
  }
  await p.evaluate(()=>DoLGameUI.setPreference('visualTier',0));
  await p.evaluate(()=>{
   const host=document.createElement('section');host.id='visual-test';host.className='dgs-host';host.style='position:fixed;inset:20px;background:#19191f;z-index:9999;padding:20px;overflow:auto';
   host.innerHTML='<header class="dgs-toolbar"><h2>存档管理 · 视觉实验</h2><button type="button">原版界面</button></header><div class="dgs-layout dgs-v2"><aside class="dgs-list"><div class="dgs-slot-grid"><button class="dgs-item dgs-recent" aria-pressed="true"><span class="dgs-slot">14</span><span><strong>卧室 · 最近保存</strong><small>游戏内时间：第 182 天 · 夜晚</small><span class="dgs-excerpt">这是合成测试数据，不是真实存档。</span></span></button><button class="dgs-item" aria-pressed="false"><span class="dgs-slot">15</span><span><strong>服装店</strong><small>游戏内时间：第 182 天 · 下午</small></span></button></div></aside><dialog open class="dgs-detail dgs-inline-detail"><h2>卧室</h2><dl><dt>保存时间</dt><dd>2026/10/01</dd></dl><p class="dgs-description">选择存档后显示详情，原存档格式保持不变。</p><div class="dgs-actions"><button id="visual-action">读取</button><button class="dgs-delete">删除</button></div></dialog></div>';
   document.body.append(host);window.visualNodes=[...host.querySelectorAll('button')];window.visualClicks=0;document.getElementById('visual-action').onclick=()=>visualClicks++;
  });
  const surface=()=>p.locator('#visual-test .dgs-detail').evaluate(e=>({blur:getComputedStyle(e).backdropFilter,animation:getComputedStyle(e).animationName}));
  assert.deepEqual(await surface(),{blur:'none',animation:'none'});
  const tools=()=>p.locator('#visual-test .dgs-toolbar').evaluate(e=>({shadow:getComputedStyle(e).boxShadow,blur:getComputedStyle(e).backdropFilter,position:getComputedStyle(e).position}));
  assert.equal((await tools()).shadow,'none');
  for(const [tier,glass,expected] of [[1,true,true],[2,true,true],[2,false,false],[0,true,false]]){
   await p.evaluate(({tier,glass})=>{DoLGameUI.setPreference('visualTier',tier);DoLGameUI.setPreference('visualGlass',glass)}, {tier,glass});
   assert.equal((await tools()).shadow!=='none',expected);
   assert.equal((await tools()).blur,'none');
   assert.equal((await tools()).position,'static');
  }
  const corner=()=>p.locator('#visual-test .dgs-detail').evaluate(e=>({image:getComputedStyle(e).backgroundImage,size:getComputedStyle(e).backgroundSize}));
  assert.equal((await corner()).image,'none');
  const results=[];
  for(const [tier,blur] of [[1,'blur(12px)'],[2,'blur(24px)']]){
   await p.evaluate(tier=>DoLGameUI.setPreference('visualTier',tier),tier);
   assert.equal((await surface()).blur,'none'); // V2 inline content stays solid.
   assert.equal((await corner()).image,'none');
   await p.locator('#visual-test .dgs-detail').evaluate(e=>e.classList.remove('dgs-inline-detail'));
   assert.equal((await surface()).blur,blur);
   if(tier===2){assert.ok((await corner()).image.includes('linear-gradient'));assert.equal((await corner()).size,'auto')}
   else assert.ok(!(await corner()).image.includes('data:image/svg+xml'),'balanced has no lens corner');
   await p.locator('#visual-test .dgs-detail').evaluate(e=>e.classList.add('dgs-inline-detail'));
   await p.locator('#visual-action').click();
   assert.equal(await p.evaluate(()=>visualNodes.every(n=>n.isConnected)),true);
   await p.waitForTimeout(300);
   results.push({tier,...await surface()});
  }
  assert.equal(await p.evaluate(()=>visualClicks),2);
  // Material differences must survive idle/reduced-motion, across owned pages.
  await p.evaluate(()=>{
   const samples=document.createElement('div');samples.id='tier-nav-samples';
   samples.innerHTML='<section class="dgw-root"><nav class="dgw-slots"><button aria-pressed="true">衣柜 · 上装</button></nav></section><section class="dcu-root"><nav class="dcu-nav"><button aria-current="location">战斗 · 左手</button></nav></section><section class="dgshop-content"><button class="category-tab active">商店 · 上装</button><button class="dgshop-selected">选中商品</button></section>';
   document.getElementById('visual-test').append(samples);
   DoLGameUI.setPreference('visualMotion',false);
  });
  const material=()=>p.locator('#visual-test .dgs-item[aria-pressed=true],#tier-nav-samples button').evaluateAll(nodes=>nodes.map(e=>{const s=getComputedStyle(e);return{combat:!!e.closest(".dcu-nav"),image:s.backgroundImage,shadow:s.boxShadow,width:e.offsetWidth,height:e.offsetHeight}}));
  const materials=[];fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});
  for(const tier of [0,1,2]){
   await p.evaluate(tier=>DoLGameUI.setPreference('visualTier',tier),tier);
   await p.waitForFunction(()=>!document.querySelector('#visual-test').getAnimations({subtree:true}).some(a=>a.playState==='running'),null,{timeout:2000});
   materials.push(await material());
   assert.equal(await p.locator('#visual-test').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
   await p.screenshot({path:path.join(__dirname,`artifacts/material-tier-${tier}.png`)});
  }
  for(let i=0;i<materials[0].length;i++){
   assert.equal(materials[0][i].image,'none');
   if(materials[0][i].combat){assert.equal(materials[2][i].image,'none');assert.equal(materials[2][i].shadow,'rgb(141, 199, 255) 0px -2px 0px 0px inset')}
   else {assert.notEqual(materials[1][i].image,materials[2][i].image,'balanced and high differ while idle');assert.notEqual(materials[1][i].shadow,materials[2][i].shadow)}
   assert.deepEqual(materials[1][i].width,materials[2][i].width);assert.deepEqual(materials[1][i].height,materials[2][i].height);
  }
  await p.evaluate(()=>DoLGameUI.setPreference('visualGlow',false));
  assert.ok((await material()).every(s=>s.image==='none'),'glow off removes selected-control material');
  await p.locator('#tier-nav-samples').evaluate(e=>e.remove());
  const edge=()=>p.locator('#visual-action').evaluate(e=>{const s=getComputedStyle(e,'::before');return{content:s.content,opacity:Number(s.opacity),pointer:s.pointerEvents,duration:s.transitionDuration}});
  await p.evaluate(()=>{DoLGameUI.setPreference('visualTier',2);DoLGameUI.setPreference('visualGlow',true);DoLGameUI.setPreference('visualMotion',true)});
  await p.locator('#visual-action').focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');await p.waitForTimeout(200);
  assert.equal((await edge()).opacity,.65);assert.equal((await edge()).pointer,'none');
  const size=await p.locator('#visual-action').evaluate(e=>[e.offsetWidth,e.offsetHeight]);
  await p.locator('#visual-action').hover();await p.mouse.down();await p.waitForTimeout(150);assert.equal((await edge()).opacity,1);
  assert.notEqual(await p.locator('#visual-action').evaluate(e=>getComputedStyle(e,'::before').transform),'none','press contracts only the decorative edge');
  assert.deepEqual(await p.locator('#visual-action').evaluate(e=>[e.offsetWidth,e.offsetHeight]),size);await p.mouse.up();
  await p.locator('#visual-test .dgs-delete').focus();await p.waitForTimeout(250);assert.equal((await edge()).opacity,0);
  assert.equal(await p.locator('#visual-test .dgs-delete').evaluate(e=>getComputedStyle(e,'::before').content),'none');
  for(const [tier,glow,disabled] of [[0,true,false],[1,true,false],[2,false,false],[2,true,true]]){
   await p.evaluate(({tier,glow,disabled})=>{DoLGameUI.setPreference('visualTier',tier);DoLGameUI.setPreference('visualGlow',glow);document.getElementById('visual-action').disabled=disabled},{tier,glow,disabled});assert.equal((await edge()).content,'none');
  }
  await p.evaluate(()=>{document.getElementById('visual-action').disabled=false;DoLGameUI.setPreference('visualTier',2);DoLGameUI.setPreference('visualGlow',true);DoLGameUI.setPreference('visualMotion',false)});assert.equal((await edge()).duration,'0s');
  await p.evaluate(()=>DoLGameUI.setPreference('visualMotion',true));await p.emulateMedia({reducedMotion:'reduce'});assert.equal((await edge()).duration,'0s');await p.emulateMedia({reducedMotion:'no-preference'});
  await p.evaluate(()=>DoLGameUI.setPreference('visualGlass',false));assert.equal((await surface()).blur,'none');assert.equal((await corner()).image,'none');
  await p.evaluate(()=>DoLGameUI.setPreference('visualGlass',true));
  await p.emulateMedia({reducedMotion:'reduce'});assert.equal((await surface()).animation,'none');
  await p.emulateMedia({reducedMotion:'no-preference'});
  await p.evaluate(()=>DoLGameUI.setPreference('visualMotion',false));assert.equal((await surface()).animation,'none');
  await p.evaluate(()=>{DoLGameUI.setPreference('visualMotion',true);DoLGameUI.setPreference('visualTier',9)});assert.equal(await p.evaluate(()=>DoLGameUI.getPreferences().visualTier),2);
  const glint=()=>p.locator('#visual-test .dgs-detail').evaluate(e=>{const s=getComputedStyle(e,'::after');return{content:s.content,animation:s.animationName,iterations:s.animationIterationCount,opacity:Number(s.opacity),pointer:s.pointerEvents}});
  await p.locator('#visual-test .dgs-detail').evaluate(e=>e.classList.remove('dgs-inline-detail'));
  assert.equal((await glint()).animation,'dgu-drawer-glint');assert.equal((await glint()).iterations,'1');assert.equal((await glint()).pointer,'none');
  await p.waitForFunction(()=>!document.querySelector('#visual-test .dgs-detail').getAnimations({subtree:true}).some(a=>a.playState==='running'),null,{timeout:2000});
  assert.equal((await glint()).opacity,0,'opening glint ends quietly');
  for(const [tier,glass,motion] of [[1,true,true],[2,false,true],[2,true,false]]){
   await p.evaluate(({tier,glass,motion})=>{DoLGameUI.setPreference('visualTier',tier);DoLGameUI.setPreference('visualGlass',glass);DoLGameUI.setPreference('visualMotion',motion)},{tier,glass,motion});
   assert.equal((await glint()).content,'none','opening glint respects tier and switches');
  }
  await p.evaluate(()=>{DoLGameUI.setPreference('visualTier',2);DoLGameUI.setPreference('visualGlass',true);DoLGameUI.setPreference('visualMotion',true)});
  await p.emulateMedia({reducedMotion:'reduce'});assert.equal((await glint()).animation,'none');assert.equal((await glint()).content,'none');await p.emulateMedia({reducedMotion:'no-preference'});
  await p.locator('#visual-test .dgs-detail').evaluate(e=>e.classList.add('dgs-inline-detail'));assert.equal((await glint()).content,'none','ordinary V2 content has no lens animation');
  fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});
  for(const width of [390,1363]){
   await p.setViewportSize({width,height:876});
   await p.evaluate(width=>{
    const host=document.getElementById('visual-test'),layout=host.querySelector('.dgs-layout'),detail=host.querySelector('dialog');
    layout.classList.toggle('dgs-v2',width>=760);detail.classList.toggle('dgs-inline-detail',width>=760);
    if(width<760){detail.removeAttribute('open');detail.showModal()}
    else {detail.close();detail.setAttribute('open','')}
   },width);await p.waitForTimeout(300);
   assert.ok(await p.locator('#visual-test').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   await p.screenshot({path:path.join(__dirname,`artifacts/visual-${width}.png`)});
  }
  // Worst-case light/dark surfaces behind the translucent modal, rather than
  // measuring only the uncomposited rgba foreground color.
  const backgrounds=[];
  for(const width of [390,1363]){
   await p.setViewportSize({width,height:876});
   await p.locator('#visual-test .dgs-detail').evaluate(e=>{e.close();e.classList.remove('dgs-inline-detail');e.showModal()});
   for(const background of ['#000000','#ffffff'])for(const glass of [false,true]){
    await p.evaluate(({background,glass})=>{document.body.style.background=background;document.querySelector('#visual-test').style.background=background;DoLGameUI.setPreference('visualGlass',glass)}, {background,glass});
    const contrast=await p.evaluate(()=>{
     const rgb=s=>s.match(/[\d.]+/g).map(Number),over=(a,b)=>a.slice(0,3).map((v,i)=>v*(a[3]??1)+b[i]*(1-(a[3]??1)));
     const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
     return ['.dgs-description','.dgs-detail dt','.dgs-delete'].map(selector=>{
      const e=document.querySelector('#visual-test '+selector),parents=[];for(let n=e;n;n=n.parentElement)parents.unshift(n);
      let bg=[255,255,255];for(const n of parents)bg=over(rgb(getComputedStyle(n).backgroundColor),bg);
      const fg=over(rgb(getComputedStyle(e).color),bg),a=lum(fg),b=lum(bg);
      return{selector,background:bg,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
     });
    });
    assert.ok(contrast.every(c=>c.contrast>=4.5),JSON.stringify({width,background,glass,contrast}));
    for(const scale of [50,100,200]){
     await p.evaluate(scale=>{DoLGameUI.setPreference('fontScale',scale);DoLGameUI.setPreference('buttonScale',scale)},scale);
     assert.ok(await p.locator('#visual-test .dgs-detail').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&e.scrollWidth<=e.clientWidth+1}),`modal bounds ${width}/${background}/${glass}/${scale}`);
    }
    await p.evaluate(()=>{DoLGameUI.setPreference('fontScale',100);DoLGameUI.setPreference('buttonScale',100)});
    backgrounds.push({width,background,glass,contrast});
   }
  }
  fs.writeFileSync(path.join(__dirname,'artifacts/visual-background-contrast.json'),JSON.stringify({scope:'Synthetic modal extremes; calculated alpha composition, no GPU or mod background proof',backgrounds},null,2));
  await p.evaluate(()=>DoLGameUI.setPreference('visualTier',0));assert.deepEqual(await surface(),{blur:'none',animation:'none'});
  await p.evaluate(()=>DoLGameUI.setPreference('visualTier',2));await p.evaluate(()=>DoLGameUI.destroy());
  assert.equal(await p.evaluate(()=>document.documentElement.hasAttribute('data-dgu-visual')),false);
  await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});assert.equal(await p.evaluate(()=>DoLGameUI.getPreferences().visualTier),2);
  await p.evaluate(()=>DoLGameUI.setPreference('enabled',false));assert.deepEqual(await surface(),{blur:'none',animation:'none'});
  console.log('PASS visual tiers, switches, reduced motion, click identity, persistence and teardown; synthetic layout only',results);
 } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
