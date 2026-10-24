import playwright = require('playwright');
import assert = require('node:assert/strict');
import path = require('node:path');
import url = require('node:url');
import type {GameUiControls} from '../src/runtime/game-controls';
const {chromium}=playwright,{pathToFileURL}=url;
declare const DoLGameUI:GameUiControls;
import type {CombatControls} from '../src/combat/types';
declare const DoLCombatUI:CombatControls;
declare const DoLWardrobeUI:{isBusy:()=>boolean};
declare const SugarCube:{State:{variables:unknown}};
declare const nativeControls:Element[],nativeParents:(ParentNode|null)[],nativeBefore:string;
declare let nativeChanges:number;
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1363,height:876}}),errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 const inject=async()=>{await page.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await page.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});await page.waitForFunction(()=>typeof DoLGameUI!=='undefined'&&!!DoLGameUI)};
 const settle=()=>page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 const noCapture=async()=>{await settle();assert.equal(await page.locator('.dcu-root,.dcu-toggle,.dgw-root,.dgshop-host,.dgp-host,.dgs-host').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.hasAttribute('data-dol-midnight')||document.documentElement.hasAttribute('data-dmt-layout')||document.documentElement.hasAttribute('data-dgu-font-scaled')||document.documentElement.hasAttribute('data-dgu-buttons-scaled')),false)};
 await page.goto(pathToFileURL(path.join(__dirname,'fixture.html')).href);await page.waitForSelector('#listContainer');
 await page.evaluate(()=>{
  localStorage.setItem('DoLMidnightTheme.preferences.v1',JSON.stringify({_scaleBaseline26:true,enabled:false,fontScale:125,buttonScale:150,layout:true,savesV2:true,wardrobePaged:true,shopDeferredPaint:true,shopPageExperiment:true,startupCacheLazy:true}));
  localStorage.setItem('DoLGameUI.social.enabled','false');
  Object.assign(window,{nativeControls:[...document.querySelectorAll('#listContainer input,#listContainer select')]});
  Object.assign(window,{nativeParents:nativeControls.map(n=>n.parentNode),nativeBefore:JSON.stringify(SugarCube.State.variables),nativeChanges:0});
  const first=nativeControls[0];if(!first)throw Error('Missing original controls');first.addEventListener('change',()=>nativeChanges++);
 });await inject();await noCapture();
 assert.equal(await page.evaluate(()=>DoLGameUI.getPreferences().fontScale),125);
 // API choices remain writable while the master gate prevents mounting.
 await page.evaluate(()=>{DoLGameUI.setPreference('combatEnabled',false);DoLCombatUI.setEnabled(true);DoLGameUI.setPreference('socialEnabled',false);Object.assign(window,{savedPreferences:JSON.stringify(DoLGameUI.getPreferences())})});await noCapture();
 await page.evaluate(()=>DoLGameUI.setPreference('enabled',true));await page.waitForSelector('.dcu-shell');
 assert.equal(await page.evaluate(()=>DoLGameUI.getPreferences().socialEnabled),false);
 assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--dgu-font-scale')),'1.25');
 // Busy refusal is atomic, including local storage and existing DOM identity.
 const busy=await page.evaluate(()=>{
  const prefs=JSON.stringify(DoLGameUI.getPreferences()),storage=JSON.stringify({...localStorage}),shell=document.querySelector('.dcu-shell'),real=DoLWardrobeUI.isBusy;
  DoLWardrobeUI.isBusy=()=>true;DoLGameUI.setPreference('enabled',false);DoLWardrobeUI.isBusy=real;
  return {prefs:JSON.stringify(DoLGameUI.getPreferences())===prefs,storage:JSON.stringify({...localStorage})===storage,shell:document.querySelector('.dcu-shell')===shell};
 });assert.deepEqual(busy,{prefs:true,storage:true,shell:true});
 // Queue observer work before closing; it must not reattach afterward.
 await page.evaluate(()=>{(()=>{const n=document.querySelector('#listContainer');if(!n)throw Error('Missing actions');n.append(document.createTextNode(' '))})();dispatchEvent(new Event('resize'));DoLGameUI.setPreference('enabled',false)});await noCapture();
 assert.ok(await page.evaluate(()=>nativeControls.every((n,i)=>n.isConnected&&n.parentNode===nativeParents[i])));
 const prefs=await page.evaluate(()=>({...DoLGameUI.getPreferences(),enabled:false}));
 assert.equal(prefs.fontScale,125);assert.equal(prefs.buttonScale,150);assert.equal(prefs.savesV2,true);assert.equal(prefs.shopDeferredPaint,true);
 assert.equal(await page.evaluate(()=>JSON.stringify(SugarCube.State.variables)===nativeBefore),true);
 await page.evaluate(()=>{const first=nativeControls[0];if(!first)throw Error('Missing original control');return first.dispatchEvent(new Event('change',{bubbles:true}))});assert.equal(await page.evaluate(()=>nativeChanges),1);
 await page.reload();await page.waitForSelector('#listContainer');await inject();await noCapture();assert.deepEqual(await page.evaluate(()=>DoLGameUI.getPreferences()),prefs);
 await page.evaluate(()=>DoLGameUI.openSettings());await page.getByRole('button',{name:'启用新版界面',exact:true}).click();await page.waitForSelector('.dcu-shell');
 await page.getByRole('button',{name:'回退原版界面',exact:true}).click();await noCapture();assert.deepEqual(await page.evaluate(()=>DoLGameUI.getPreferences()),prefs);
 await page.getByLabel('启用 Soft & Wet 界面',{exact:true}).check();await page.waitForSelector('.dcu-shell');assert.equal(await page.evaluate(()=>DoLGameUI.getPreferences().buttonScale),150);
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>DoLGameUI.setPreference('enabled',false));await noCapture();
 await page.reload();await page.waitForSelector('#listContainer');await inject();await noCapture();
 assert.deepEqual(await page.evaluate(()=>DoLGameUI.getPreferences()),prefs);
 await page.evaluate(()=>DoLGameUI.setPreference('enabled',true));await page.waitForSelector('.dcu-shell');
 await page.evaluate(()=>DoLGameUI.destroy());assert.deepEqual(errors,[]);
 console.log('PASS master off/on/reload, retained mixed preferences, atomic busy refusal, queued teardown and native identity/events.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
