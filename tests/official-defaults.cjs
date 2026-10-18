const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http');
(async()=>{
 const html='<!doctype html><html><body><div id="ui-bar"><div id="overlayButtons"></div></div><div id="story"><main id="passages"><div class="passage" data-passage="Fixture"><div id="listContainer"><div id="leftaction"><label><input type="radio" name="leftaction" checked>Rest</label></div><div id="rightaction"><label><input type="radio" name="rightaction" checked>Rest</label></div></div><div id="next"><a href="#">Continue</a></div></div></main></div></body></html>';
 const server=http.createServer((_q,r)=>{r.setHeader('Content-Type','text/html');r.end(html)});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch(require('./browser-options.cjs'));const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  async function boot(){await page.goto('http://127.0.0.1:'+server.address().port);await page.addStyleTag({path:'dist/framework/official-ui/style.css'});await page.addScriptTag({path:'dist/framework/host/index.js'});await page.evaluate(()=>DoLUiHost.sceneReady());await page.addScriptTag({path:'dist/framework/official-ui/index.js'});await page.waitForFunction(()=>window.DoLGameUI?.version==='3.0.0')}
  await boot();await page.waitForSelector('.sf-motion-ball');await page.waitForSelector('.dcu-shell:not([data-focused])');
  const defaults=await page.evaluate(()=>({floating:DoLFloatingTools.getPreferences().enabled,combat:DoLCombatUI.getEnabled(),focused:DoLGameUI.getPreferences().combatFocused,motion:DoLGameUI.getPreferences().visualMotion}));
  assert.deepEqual(defaults,{floating:true,combat:true,focused:false,motion:true});
  assert.equal(await page.locator('#leftaction').isVisible(),true);assert.equal(await page.locator('#rightaction').isVisible(),true);
  await page.evaluate(()=>{DoLFloatingTools.setPreference('enabled',false);DoLCombatUI.setEnabled(false)});
  await boot();await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>DoLFloatingTools.getPreferences().enabled),false,'saved opt-out survives package restart');
  assert.equal(await page.evaluate(()=>DoLCombatUI.getEnabled()),false);
  assert.equal(await page.locator('.sf-motion-ball,.dcu-shell').count(),0);assert.equal(await page.locator('#leftaction').isVisible(),true);
  await page.evaluate(()=>StoneFree_official_ui.dispose());assert.equal(await page.locator('[data-sf-owner=SoftWetOfficialUI]').count(),0);assert.deepEqual(errors,[]);
  console.log('PASS built official package fresh defaults: visible Hub, animated flat combat, B focus off; persisted opt-outs and native restoration on restart; controlled fixture only');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
