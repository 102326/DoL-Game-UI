// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
(async()=>{
 const browser=await playwright.chromium.launch(browserOptions);
 try{
  const page=await browser.newPage({viewport:{width:1100,height:850}});
  await page.setContent(`<!doctype html><html data-stone-free data-dol-midnight data-dmt-layout><head><style>
   #ui-bar-toggle::before{content:"<";color:#ccc}#ui-bar{background:#1f1f1f;color:#e5e5e5}#ui-bar-body{color:#e5e5e5}#menu li a{color:inherit}#ui-bar-toggle,#ui-bar-history button{color:#eee;background:#1f1f1f;border:1px solid #626269}#ui-bar button:disabled{color:#626269;background:transparent}
   #ui-bar-toggle::before{content:"‹";color:#ddd}
   #foreign{color:rgb(9,8,7);background:rgb(4,5,6)}
   .passage a.link-internal{color:#8ab4e8}.passage a.semantic{color:gold}.passage button{color:#e5e5e5;background:#1f1f1f;border:1px solid #626269}.gold{color:gold}.buttonStartSelected>button{color:gold;border-color:gold}
  </style></head><body><div id="ui-bar"><button id="ui-bar-toggle">Toggle</button><div id="ui-bar-history"><button id="history-backward" disabled>Back</button></div><div id="ui-bar-body"><div id="title"><h1 id="story-title">Degrees of Lewdity</h1></div><nav id="menu"><ul id="menu-core"><li id="menu-item-saves"><a href="#saves">Saves</a></li></ul></nav><div id="startCaption"><h3>Version</h3><h4>Edition</h4></div><div id="overlayButtons"><button id="foreign">Third party</button></div></div></div><div id="passages"><div class="passage"><div id="passage-content"><div id="startOptions"><div class="containerStart"><div id="startSelectionDefault" class="buttonSettings"><div class="gold buttonStartSelected"><button id="selected" class="link-internal macro-button">Basic</button></div></div><div id="startSelectionCustom" class="buttonSettings"><div class="buttonStart"><button id="custom" class="link-internal macro-button">Custom</button></div></div></div><div class="containerStart"><div class="buttonSettings"><button id="regular" class="link-internal macro-button">Character</button></div></div></div><div id="settingsOptions"><div class="containerStart"><div class="buttonStart"><button id="disabled" class="link-internal macro-button" disabled>Quick</button></div></div></div><div id="settingsExit"><div style="margin-top:15px"><button id="exit" class="link-internal macro-button">Start</button></div></div><div class="dgw-root"><div class="dgw-tools"><input id="wardrobe-search" type="search" aria-label="搜索衣柜"></div><div class="dgw-actions" style="background:var(--sw-custom-panel,#242426)"><div class="wardrobe-action"><a id="wardrobe-action" href="#action" class="link-internal macro-link">整理套装</a> <a id="wardrobe-semantic" href="#semantic" class="link-internal macro-link semantic">特殊状态</a></div><div data-sf-owner="Other"><div class="wardrobe-action"><a id="wardrobe-foreign" href="#other" class="link-internal macro-link" style="color:rgb(9, 8, 7)">Other</a></div></div></div></div><div id="modhub"><button id="foreign-main" class="modhub-core-tab">ModHub</button></div><div data-sf-owner="Other"><div id="settingsExit"><div style="margin-top:15px"><button id="owned" class="link-internal macro-button">Other</button></div></div></div></div></div></div><div id="customOverlay" data-overlay="saves"><div id="saveList"><div class="dgs-host"><div class="dgs-layout"><aside class="dgs-list"><div class="dgs-search"><input id="save-search" type="search" aria-label="搜索当前页存档" placeholder="搜索当前页存档…"></div><div class="dgs-entries"><details open><summary id="save-summary">手动存档</summary><div class="dgs-slot-grid"><button class="dgs-item"><span><small id="save-date">示例日期</small></span></button></div></details></div></aside></div></div></div></div></body></html>`);
  await page.locator('#passages').evaluate(root=>{
   root.insertAdjacentHTML('beforeend','<div id="passage-settings" class="passage dgp-overlay" data-dgp-panel="settings"><div class="dgp-host"></div></div>');
  });
  await page.addStyleTag({content:'.passage.dgp-overlay {background-color:#1f1f1f}'});
  await page.addStyleTag({path:'src/wardrobe/style.css'});
  await page.addStyleTag({path:'src/saves/style.css'});
  await page.addStyleTag({path:'src/theme/kraft-work-native.css'});
  await page.addStyleTag({path:'src/theme/stone-free.css'});
  await page.addStyleTag({path:'src/theme/custom-appearance.css'});
  await page.addStyleTag({content:'*,*::before,*::after{transition:none!important}'});
  const read=async(selector:string)=>page.locator(selector).evaluate(n=>{const s=getComputedStyle(n);return {color:s.color,background:s.backgroundColor,border:s.borderTopColor}});
  const contrast=async(fg:string,bg:string)=>page.evaluate(({foreground,background})=>{
   const luminance=(color:string)=>{
    const rgb=/^rgb\((\d+), (\d+), (\d+)\)$/.exec(color);
    if(!rgb) throw Error('Expected an opaque RGB color: '+color);
    const linear=(channel:string)=>{const value=Number(channel)/255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4};
    return .2126*linear(rgb[1]!)+.7152*linear(rgb[2]!)+.0722*linear(rgb[3]!);
   };
   const ink=luminance(getComputedStyle(document.querySelector(foreground)!).color);
   const face=luminance(getComputedStyle(document.querySelector(background)!).backgroundColor);
   return (Math.max(ink,face)+.05)/(Math.min(ink,face)+.05);
  },{foreground:fg,background:bg});
  const saveDark=await Promise.all(['#save-search','#save-summary','#save-date'].map(read));
  const wardrobeDark=await read('#wardrobe-search'),actionDark=await read('#wardrobe-action'),semantic=await read('#wardrobe-semantic'),wardrobeForeign=await read('#wardrobe-foreign');
  const dark=await read('#story-title'),darkButton=await read('#custom'),foreign=await read('#foreign'),foreignMain=await read('#foreign-main'),owned=await read('#owned'),selected=await read('#selected');
  for(const [mode,text,panel,hover,muted,focus,link] of [['mist','#1a232e','#f7f9fc','#f1f3f6','#465160','#1c537f','#21537c'],['porcelain','#22201d','#faf9f6','#f4f3f0','#57534c','#2d596a','#315869']] as const){
   await page.locator('html').evaluate((n,values)=>{n.setAttribute('data-sw-theme',values.mode);n.setAttribute('data-sw-sidebar-theme','');for(const [k,v] of Object.entries(values.tokens))n.style.setProperty('--sw-custom-'+k,v)}, {mode,tokens:{text,panel,hover,muted,focus,link,well:panel}});
   await page.locator('html').evaluate((root,color)=>root.style.setProperty('--sw-custom-canvas',color),panel);
   const expected=await page.evaluate(color=>{const e=document.createElement('i');e.style.color=color;document.body.append(e);const result=getComputedStyle(e).color;e.remove();return result},text);
   assert.equal((await read('#passage-settings')).background,(await read('#wardrobe-search')).background,mode+' native settings reading surface');
   assert.equal((await read('#story-title')).color,expected);assert.equal((await read('#menu-core a')).color,expected);assert.equal((await read('#startCaption h3')).color,expected);assert.equal((await read('#ui-bar-toggle')).color,expected);assert.equal(await page.locator('#ui-bar-toggle').evaluate(n=>getComputedStyle(n,'::before').color),expected);
   assert.notEqual((await read('#history-backward')).color,expected);assert.deepEqual(await read('#foreign'),foreign);
   for(const id of ['custom','regular','exit'])assert.equal((await read('#'+id)).color,expected,id+' uses preset ink');
   assert.notEqual((await read('#disabled')).color,expected);assert.deepEqual(await read('#selected'),selected);assert.deepEqual(await read('#foreign-main'),foreignMain);assert.deepEqual(await read('#owned'),owned);
   await page.locator('#custom').hover();const hovered=await read('#custom');await page.mouse.move(1090,840);assert.notEqual(hovered.background,(await read('#custom')).background);await page.locator('#custom').focus();assert.equal(await page.locator('#custom').evaluate(n=>getComputedStyle(n).outlineStyle),'solid');
   const expectedPanel=await page.evaluate(color=>{const e=document.createElement('i');e.style.backgroundColor=color;document.body.append(e);const result=getComputedStyle(e).backgroundColor;e.remove();return result},panel);
   assert.equal((await read('#wardrobe-search')).color,expected,mode+' wardrobe search ink');assert.equal((await read('#wardrobe-search')).background,expectedPanel,mode+' wardrobe search surface');
   assert.ok(await contrast('#wardrobe-search','#wardrobe-search')>=4.5,mode+' wardrobe search text contrast');
   assert.ok(await contrast('#wardrobe-action','.dgw-actions')>=4.5,mode+' wardrobe action link contrast');
   assert.deepEqual(await read('#wardrobe-semantic'),semantic);assert.deepEqual(await read('#wardrobe-foreign'),wardrobeForeign);
   await page.locator('#wardrobe-search').focus();assert.ok(await contrast('#wardrobe-search','#wardrobe-search')>=4.5,mode+' focused search contrast');assert.equal(await page.locator('#wardrobe-search').evaluate(n=>getComputedStyle(n).outlineStyle),'solid');
   await page.locator('#wardrobe-action').focus();assert.equal(await page.locator('#wardrobe-action').evaluate(n=>getComputedStyle(n).outlineStyle),'solid');
   assert.equal((await read('#save-search')).color,expected,mode+' save search ink');assert.equal((await read('#save-search')).background,expectedPanel,mode+' save search surface');
   assert.equal((await read('#save-summary')).color,expected,mode+' save summary ink');
   const expectedMuted=await page.evaluate(color=>{const e=document.createElement('i');e.style.color=color;document.body.append(e);const result=getComputedStyle(e).color;e.remove();return result},muted);
   assert.equal((await read('#save-date')).color,expectedMuted,mode+' save metadata ink');
   await page.locator('#save-search').focus();assert.ok(await contrast('#save-search','#save-search')>=4.5,mode+' focused save search contrast');assert.equal(await page.locator('#save-search').evaluate(n=>getComputedStyle(n).outlineStyle),'solid');
   await page.locator('#save-search').blur();await page.locator('#customOverlay').evaluate(n=>n.setAttribute('data-dgu-adapter','Other'));assert.deepEqual(await Promise.all(['#save-search','#save-summary','#save-date'].map(read)),saveDark,mode+' adapter remains native');await page.locator('#customOverlay').evaluate(n=>n.removeAttribute('data-dgu-adapter'));
   await page.locator('#ui-bar-toggle').hover();assert.notEqual((await read('#ui-bar-toggle')).background,(await read('#history-backward')).background);
   await page.locator('#ui-bar-toggle').focus();assert.equal(await page.locator('#ui-bar-toggle').evaluate(n=>getComputedStyle(n).outlineStyle),'solid');
  }
  await page.locator('html').evaluate(n=>{n.removeAttribute('data-sw-theme');n.style.setProperty('--sw-custom-text','#c1ccd3')});
  assert.deepEqual(await Promise.all(['#save-search','#save-summary','#save-date'].map(read)),saveDark);
  assert.deepEqual(await read('#wardrobe-search'),wardrobeDark);assert.deepEqual(await read('#wardrobe-action'),actionDark);assert.deepEqual(await read('#wardrobe-semantic'),semantic);assert.deepEqual(await read('#wardrobe-foreign'),wardrobeForeign);
  assert.equal((await read('#story-title')).color,'rgb(193, 204, 211)');assert.equal((await read('#regular')).color,'rgb(193, 204, 211)');
  await page.locator('html').evaluate(n=>n.removeAttribute('data-sw-sidebar-theme'));assert.deepEqual(await read('#story-title'),dark);assert.deepEqual(await read('#custom'),darkButton);assert.deepEqual(await read('#foreign'),foreign);
  console.log('PASS native theme title and navigation: two light presets, hover/focus/disabled, dark and foreign isolation');
 }finally{await browser.close()}
})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});
