const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:1200,height:900}});
 await p.route('http://preferences.test/',r=>r.fulfill({contentType:'text/html',body:'<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="story"><div id="passages"></div></main></body></html>'}));
 await p.goto('http://preferences.test/');await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 const prefs=()=>p.evaluate(()=>[DoLGameUI.getPreferences().fontScale,DoLGameUI.getPreferences().buttonScale]);
 const stored=()=>p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('DoLMidnightTheme.preferences.v1'));return[s.fontScale,s.buttonScale]});
 const applied=()=>p.evaluate(()=>['--dgu-font-scale','--dgu-button-scale'].map(k=>document.documentElement.style.getPropertyValue(k)));
 await p.evaluate(()=>{DoLGameUI.setPreference('fontScale',200);DoLGameUI.setPreference('buttonScale',200)});
 assert.deepEqual(await prefs(),[200,200]);assert.deepEqual(await applied(),['2','2']);
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(150);
 assert.deepEqual(await prefs(),[200,200],'narrow resize preserves requested preferences');assert.deepEqual(await stored(),[200,200]);assert.deepEqual(await applied(),['1.5','1.5']);
 await p.evaluate(()=>DoLGameUI.setPreference('visualPattern',true));assert.deepEqual(await stored(),[200,200],'unrelated setting must not persist temporary caps');
 await p.evaluate(()=>DoLGameUI.destroy());await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 assert.deepEqual(await prefs(),[200,200],'narrow restart preserves saved scales');assert.deepEqual(await applied(),['1.5','1.5']);
 await p.evaluate(()=>DoLGameUI.openSettings());assert.equal(await p.getByRole('slider',{name:'字体大小',exact:true}).getAttribute('max'),'200');
 assert.ok(await p.getByText('当前实际显示：字体 150%，按钮 150%。').isVisible());
 for(const [width,height] of [[320,568],[360,640],[390,320],[768,1024],[1024,768],[1200,900]]){
  await p.setViewportSize({width,height});await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.ok(await p.locator('#dol-midnight-controls').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'settings content fits '+width);
  assert.ok(await p.locator('.dmt-close').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}),'close remains reachable '+width+'x'+height);
 }
 await p.waitForFunction(()=>document.documentElement.style.getPropertyValue('--dgu-font-scale')==='2');assert.deepEqual(await applied(),['2','2']);
 await p.evaluate(()=>DoLGameUI.setPreference('enabled',false));assert.deepEqual(await applied(),['1','1']);assert.deepEqual(await prefs(),[200,200]);
 await p.evaluate(()=>DoLGameUI.setPreference('enabled',true));assert.deepEqual(await applied(),['2','2']);
 await p.evaluate(()=>{DoLGameUI.setPreference('fontScale',NaN);DoLGameUI.setPreference('buttonScale',250)});assert.deepEqual(await prefs(),[200,200]);
 await p.evaluate(()=>DoLGameUI.destroy());assert.equal(await p.evaluate(()=>document.documentElement.style.getPropertyValue('--dgu-font-scale')),'');
 console.log('PASS saved versus applied scales: resize, restart, unrelated save, settings, restore, master toggle, validation and teardown');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
