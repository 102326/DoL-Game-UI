import playwright = require('playwright');
import assert = require('node:assert/strict');
import path = require('node:path');
import type {GameUiControls} from '../src/runtime/game-controls';
const {chromium}=playwright;
declare const DoLGameUI:GameUiControls;
function preferenceSnapshot(){
 const text=localStorage.getItem('DoLMidnightTheme.preferences.v1');if(text===null)throw Error('Missing stored preference fixture');
 const stored:unknown=JSON.parse(text);if(!stored||typeof stored!=='object'||Array.isArray(stored)||!('fontScale' in stored)||!('buttonScale' in stored)||!('_scaleBaseline26' in stored))throw Error('Invalid stored preference fixture');
 return {prefs:DoLGameUI.getPreferences(),stored};
}

(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:1200,height:900}});
 await p.route('http://preferences.test/',r=>r.fulfill({contentType:'text/html',body:'<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="story"><div id="passages"></div></main></body></html>'}));
 await p.goto('http://preferences.test/');
 await p.evaluate(()=>localStorage.setItem('DoLMidnightTheme.preferences.v1',JSON.stringify({fontScale:200,buttonScale:75,comfortable:false,visualTier:2,visualGlass:false,visualPattern:true,mobileCompactControls:true,wideReading:true})));
await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 const prefs=()=>p.evaluate(()=>[DoLGameUI.getPreferences().fontScale,DoLGameUI.getPreferences().buttonScale]);
 const stored=async()=>{const {stored:s}=await p.evaluate(preferenceSnapshot);return[s.fontScale,s.buttonScale]};
 const applied=()=>p.evaluate(()=>['--dgu-font-scale','--dgu-button-scale'].map(k=>document.documentElement.style.getPropertyValue(k)));
 const migrated=await p.evaluate(preferenceSnapshot);
 assert.deepEqual(await prefs(),[100,100],'first 2.6 upgrade resets only both scales');
 assert.equal(migrated.stored._scaleBaseline26,true);
 for(const [key,value] of Object.entries({comfortable:false,visualTier:2,visualGlass:false,visualPattern:true,mobileCompactControls:true,wideReading:true}))assert.equal(migrated.prefs[key],value,'other preference retained: '+key);
 await p.evaluate(()=>{DoLGameUI.setPreference('fontScale',150);DoLGameUI.setPreference('buttonScale',150)});
 assert.deepEqual(await prefs(),[150,150]);assert.deepEqual(await applied(),['1.5','1.5']);
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(150);
 assert.deepEqual(await prefs(),[150,150],'narrow resize preserves requested preferences');assert.deepEqual(await stored(),[150,150]);assert.deepEqual(await applied(),['1.5','1.5']);
 await p.evaluate(()=>DoLGameUI.setPreference('visualPattern',true));assert.deepEqual(await stored(),[150,150],'unrelated setting must not persist temporary caps');
 await p.evaluate(()=>DoLGameUI.destroy());await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 assert.deepEqual(await prefs(),[150,150],'narrow restart preserves saved scales');assert.deepEqual(await applied(),['1.5','1.5']);
 await p.evaluate(()=>DoLGameUI.openSettings());assert.equal(await p.getByRole('slider',{name:'字体大小',exact:true}).getAttribute('max'),'150');
 assert.equal(await p.getByRole('slider',{name:'按钮大小',exact:true}).getAttribute('max'),'150');
 for(const [width,height] of [[320,568],[360,640],[390,320],[768,1024],[1024,768],[1200,900]] as const){
  await p.setViewportSize({width,height});await p.evaluate(()=>new Promise<number>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.ok(await p.locator('#dol-midnight-controls').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'settings content fits '+width);
  assert.ok(await p.locator('.dmt-close').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}),'close remains reachable '+width+'x'+height);
 }
 await p.waitForFunction(()=>document.documentElement.style.getPropertyValue('--dgu-font-scale')==='1.5');assert.deepEqual(await applied(),['1.5','1.5']);
 await p.evaluate(()=>DoLGameUI.setPreference('enabled',false));assert.deepEqual(await applied(),['1','1']);assert.deepEqual(await prefs(),[150,150]);
 await p.evaluate(()=>DoLGameUI.setPreference('enabled',true));assert.deepEqual(await applied(),['1.5','1.5']);
 await p.evaluate(()=>{DoLGameUI.setPreference('fontScale',NaN);DoLGameUI.setPreference('buttonScale',250)});assert.deepEqual(await prefs(),[150,150]);
 // A future build uses the same marker, regardless of unrelated version metadata.
 await p.evaluate(()=>{const key='DoLMidnightTheme.preferences.v1',text=localStorage.getItem(key);if(text===null)throw Error('Missing future preference fixture');const value:unknown=JSON.parse(text);if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid future preference fixture');const saved={...value,futureVersion:'3.0',fontScale:125,buttonScale:75};localStorage.setItem(key,JSON.stringify(saved));DoLGameUI.destroy()});
 await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});assert.deepEqual(await prefs(),[125,75],'future upgrade marker prevents another reset');
 await p.evaluate(()=>DoLGameUI.destroy());await p.reload();await p.evaluate(()=>localStorage.clear());await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});assert.deepEqual(await prefs(),[100,100],'new installation defaults');
 assert.equal(await p.evaluate(preferenceSnapshot).then(value=>value.stored._scaleBaseline26),true);
 await p.evaluate(()=>DoLGameUI.destroy());assert.equal(await p.evaluate(()=>document.documentElement.style.getPropertyValue('--dgu-font-scale')),'');
 console.log('PASS saved versus applied scales: resize, restart, unrelated save, settings, restore, master toggle, validation and teardown');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
