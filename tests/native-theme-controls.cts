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
   #ui-bar{background:#1f1f1f;color:#e5e5e5}#ui-bar-body{color:#e5e5e5}#menu li a{color:inherit}#ui-bar-toggle,#ui-bar-history button{color:#eee;background:#1f1f1f;border:1px solid #626269}#ui-bar button:disabled{color:#626269;background:transparent}
   #foreign{color:rgb(9,8,7);background:rgb(4,5,6)}
   .passage button{color:#e5e5e5;background:#1f1f1f;border:1px solid #626269}.gold{color:gold}.buttonStartSelected>button{color:gold;border-color:gold}
  </style></head><body><div id="ui-bar"><button id="ui-bar-toggle">Toggle</button><div id="ui-bar-history"><button id="history-backward" disabled>Back</button></div><div id="ui-bar-body"><div id="title"><h1 id="story-title">Degrees of Lewdity</h1></div><nav id="menu"><ul id="menu-core"><li id="menu-item-saves"><a href="#saves">Saves</a></li></ul></nav><div id="startCaption"><h3>Version</h3><h4>Edition</h4></div><div id="overlayButtons"><button id="foreign">Third party</button></div></div></div><div id="passages"><div class="passage"><div id="passage-content"><div id="startOptions"><div class="containerStart"><div id="startSelectionDefault" class="buttonSettings"><div class="gold buttonStartSelected"><button id="selected" class="link-internal macro-button">Basic</button></div></div><div id="startSelectionCustom" class="buttonSettings"><div class="buttonStart"><button id="custom" class="link-internal macro-button">Custom</button></div></div></div><div class="containerStart"><div class="buttonSettings"><button id="regular" class="link-internal macro-button">Character</button></div></div></div><div id="settingsOptions"><div class="containerStart"><div class="buttonStart"><button id="disabled" class="link-internal macro-button" disabled>Quick</button></div></div></div><div id="settingsExit"><div style="margin-top:15px"><button id="exit" class="link-internal macro-button">Start</button></div></div><div id="modhub"><button id="foreign-main" class="modhub-core-tab">ModHub</button></div><div data-sf-owner="Other"><div id="settingsExit"><div style="margin-top:15px"><button id="owned" class="link-internal macro-button">Other</button></div></div></div></div></div></div></body></html>`);
  await page.addStyleTag({path:'src/theme/custom-appearance.css'});
  const read=async(selector:string)=>page.locator(selector).evaluate(n=>{const s=getComputedStyle(n);return {color:s.color,background:s.backgroundColor,border:s.borderTopColor}});
  const dark=await read('#story-title'),darkButton=await read('#custom'),foreign=await read('#foreign'),foreignMain=await read('#foreign-main'),owned=await read('#owned'),selected=await read('#selected');
  for(const [mode,text,panel,hover,muted,focus] of [['mist','#1a232e','#f7f9fc','#f1f3f6','#546273','#1f5b8a'],['porcelain','#22201d','#faf9f6','#f4f3f0','#656058','#2e5a6c']] as const){
   await page.locator('html').evaluate((n,values)=>{n.setAttribute('data-sw-theme',values.mode);n.setAttribute('data-sw-sidebar-theme','');for(const [k,v] of Object.entries(values.tokens))n.style.setProperty('--sw-custom-'+k,v)}, {mode,tokens:{text,panel,hover,muted,focus,well:panel}});
   const expected=await page.evaluate(color=>{const e=document.createElement('i');e.style.color=color;document.body.append(e);const result=getComputedStyle(e).color;e.remove();return result},text);
   assert.equal((await read('#story-title')).color,expected);assert.equal((await read('#menu-core a')).color,expected);assert.equal((await read('#startCaption h3')).color,expected);assert.equal((await read('#ui-bar-toggle')).color,expected);
   assert.notEqual((await read('#history-backward')).color,expected);assert.deepEqual(await read('#foreign'),foreign);
   for(const id of ['custom','regular','exit'])assert.equal((await read('#'+id)).color,expected,id+' uses preset ink');
   assert.notEqual((await read('#disabled')).color,expected);assert.deepEqual(await read('#selected'),selected);assert.deepEqual(await read('#foreign-main'),foreignMain);assert.deepEqual(await read('#owned'),owned);
   await page.locator('#custom').hover();const hovered=await read('#custom');await page.mouse.move(1090,840);assert.notEqual(hovered.background,(await read('#custom')).background);await page.locator('#custom').focus();assert.equal(await page.locator('#custom').evaluate(n=>getComputedStyle(n).outlineStyle),'solid');
   await page.locator('#ui-bar-toggle').hover();assert.notEqual((await read('#ui-bar-toggle')).background,(await read('#history-backward')).background);
   await page.locator('#ui-bar-toggle').focus();assert.equal(await page.locator('#ui-bar-toggle').evaluate(n=>getComputedStyle(n).outlineStyle),'solid');
  }
  await page.locator('html').evaluate(n=>{n.removeAttribute('data-sw-theme');n.style.setProperty('--sw-custom-text','#c1ccd3')});
  assert.equal((await read('#story-title')).color,'rgb(193, 204, 211)');assert.equal((await read('#regular')).color,'rgb(193, 204, 211)');
  await page.locator('html').evaluate(n=>n.removeAttribute('data-sw-sidebar-theme'));assert.deepEqual(await read('#story-title'),dark);assert.deepEqual(await read('#custom'),darkButton);assert.deepEqual(await read('#foreign'),foreign);
  console.log('PASS native theme title and navigation: two light presets, hover/focus/disabled, dark and foreign isolation');
 }finally{await browser.close()}
})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});
