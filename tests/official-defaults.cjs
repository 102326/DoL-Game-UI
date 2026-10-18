const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http');
(async()=>{
 const html='<!doctype html><html><body><div id="ui-bar"><div id="overlayButtons"></div></div><div id="fixture-overlays"><div id="customOverlay" class="hidden"></div></div><div id="story"><main id="passages"><div class="passage" data-passage="Fixture"><div id="listContainer"><div id="leftaction"><label><input type="radio" name="leftaction" checked>Rest</label></div><div id="rightaction"><label><input type="radio" name="rightaction" checked>Rest</label></div></div><div id="next"><a href="#">Continue</a></div></div></main></div></body></html>';
 const server=http.createServer((_q,r)=>{r.setHeader('Content-Type','text/html');r.end(html)});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch(require('./browser-options.cjs'));const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  async function boot(){await page.goto('http://127.0.0.1:'+server.address().port);await page.addStyleTag({path:'dist/framework/official-ui/style.css'});await page.addScriptTag({path:'dist/framework/host/index.js'});await page.evaluate(()=>DoLUiHost.sceneReady());await page.addScriptTag({path:'dist/framework/official-ui/index.js'});await page.waitForFunction(()=>window.DoLGameUI?.version==='3.0.1')}
  await boot();await page.waitForSelector('.sf-motion-ball');await page.waitForSelector('.dcu-shell:not([data-focused])');
  const defaults=await page.evaluate(()=>({floating:DoLFloatingTools.getPreferences().enabled,combat:DoLCombatUI.getEnabled(),focused:DoLGameUI.getPreferences().combatFocused,motion:DoLGameUI.getPreferences().visualMotion}));
  assert.deepEqual(defaults,{floating:true,combat:true,focused:false,motion:true});
  assert.equal(await page.locator('#leftaction').isVisible(),true);assert.equal(await page.locator('#rightaction').isVisible(),true);
  await page.evaluate(()=>DoLGameUI.setPreference('combatFocused',true));await page.waitForSelector('.dcu-shell[data-focused]');await page.getByRole('button',{name:'全部展开',exact:true}).click();assert.equal(await page.evaluate(()=>DoLGameUI.getPreferences().combatFocused),false);
  await boot();await page.waitForSelector('.dcu-shell:not([data-focused])');assert.equal(await page.evaluate(()=>DoLGameUI.getPreferences().combatFocused),false,'expanded mode survives package restart');
  await page.evaluate(()=>{const n=document.createElement('div');n.id='customOverlay';n.dataset.overlay='saves';n.innerHTML='<div id="customOverlayTitle"><div id="overlayTabs"><button class="link-internal macro-button">存档</button><button class="link-internal macro-button tab-selected">导出/载入</button></div></div><div id="customOverlayContent"><input id="saveImport" type="file"><span class="gold">Code</span><textarea id="saveDataInput"></textarea><input id="copy-native" class="saveMenuButton" type="button" value="Copy"></div>';document.getElementById('customOverlay').replaceWith(n);window.originalCode=document.querySelector('#saveDataInput')});
  await page.addStyleTag({content:'.saveMenuButton{background:#333!important}'});await page.waitForSelector('.dgs-transfer');await page.waitForFunction(()=>document.querySelectorAll('#overlayTabs [data-kw-nav-control=tab]').length===2);
  await page.waitForSelector('.dgs-titlebar');assert.equal(await page.locator('.dgs-titlebar').count(),1,'transfer uses the same save management header');
  assert.equal(await page.evaluate(()=>originalCode===document.querySelector('#saveDataInput')),true);assert.match(await page.locator('#copy-native').evaluate(n=>getComputedStyle(n).backgroundColor),/^rgba\(/,'3.x paint overrides the native important save button background');assert.match(await page.locator('.dgs-transfer-card').first().evaluate(n=>getComputedStyle(n).backgroundColor),/^rgba\(/);assert.equal(await page.locator('#customOverlayContent').evaluate(n=>getComputedStyle(n).backdropFilter),'none');
  for(const width of [390,1363]){await page.setViewportSize({width,height:700});assert.ok(await page.locator('.dgs-transfer').evaluate(n=>n.scrollWidth<=n.clientWidth+1),'native transfer fits viewport')}
  assert.equal(await page.locator('#customOverlayContent').evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)','no legacy second material layer behind transfer controls');
  await page.evaluate(()=>{const o=document.querySelector('#customOverlay');o.querySelector('#customOverlayContent').innerHTML='<div id="maplebirch-cloud-save"><input data-cloud-save-field="endpoint"><input data-cloud-save-field="token"><button id="cloud-native">Connect</button></div>';o.dataset.dguAdapter='MapleBirchSoftWet';o.dataset.dguAdapterMatch='full';window.cloudNode=document.querySelector('#cloud-native');window.cloudCalls=0;cloudNode.onclick=()=>cloudCalls++});
  await page.waitForFunction(()=>document.querySelector('.dgs-titlebar .dgs-muted')?.textContent.includes('MapleBirch'));assert.equal(await page.locator('.dgs-titlebar').count(),1);assert.equal(await page.evaluate(()=>cloudNode===document.querySelector('#cloud-native')&&cloudCalls===0),true,'cloud header does not replace or dispatch native controls');
  await page.evaluate(()=>DoLSavesUI.setEnabled(false));await page.waitForFunction(()=>!document.querySelector('.dgs-titlebar'));assert.equal(await page.locator('#cloud-native').count(),1);await page.evaluate(()=>DoLSavesUI.setEnabled(true));await page.waitForSelector('.dgs-titlebar');
  await page.evaluate(()=>document.querySelector('#customOverlay').remove());
  await page.evaluate(()=>{DoLFloatingTools.setPreference('enabled',false);DoLCombatUI.setEnabled(false)});
  await boot();await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>DoLFloatingTools.getPreferences().enabled),false,'saved opt-out survives package restart');
  assert.equal(await page.evaluate(()=>DoLCombatUI.getEnabled()),false);
  assert.equal(await page.locator('.sf-motion-ball,.dcu-shell').count(),0);assert.equal(await page.locator('#leftaction').isVisible(),true);
  await page.evaluate(()=>StoneFree_official_ui.dispose());assert.equal(await page.locator('[data-sf-owner=SoftWetOfficialUI]').count(),0);assert.deepEqual(errors,[]);
  console.log('PASS built official package fresh defaults: visible Hub, animated flat combat, B focus off; persisted opt-outs and native restoration on restart; controlled fixture only');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
