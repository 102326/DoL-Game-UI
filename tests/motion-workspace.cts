// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"named","caseSource":"check"}
import cases = require('../scripts/ci-cases.cjs');
const {runCase}=cases;
// Real settings/controller and native-overlay presentation on first-party controlled HTML.
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import playwright = require('playwright');
import oracles = require('./moody-oracles.cjs');
import type {GameUiControls} from '../src/runtime/game-controls';
const {chromium}=playwright,{waitSettings,waitSettingsClosed}=oracles;
declare const DoLMidnightTheme:GameUiControls,motionWorkspace:{calls():number;open():void;destroy():void};
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing workspace fixture node');return value;}

(async()=>{
 const out=path.resolve('tests/artifacts/golden-spin-b/windows-validation-'+Date.now());fs.mkdirSync(out,{recursive:true});
 const {createServer}=await import('vite');const server=await createServer({configFile:path.resolve('vite.golden-spin.config.ts'),server:{port:5184,strictPort:true}});await server.listen();
 const browser=await chromium.launch(require('./browser-options.cjs'));let failedPage:playwright.Page|undefined;const checks:string[]=[],errors:string[]=[];
 const check=async(name:string,fn:()=>Promise<void>)=>{await runCase(name,fn);checks.push(name);console.log('PASS',name)};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});failedPage=page;page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5184/windows.html');await page.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null|undefined)=>{if(value==null)throw Error('Missing workspace fixture node');return value}}));await page.waitForFunction(()=>typeof motionWorkspace!=='undefined'&&typeof DoLMidnightTheme!=='undefined');
  await check('shared motion cancels hidden work and cannot restart after disposal',async()=>{
   const value=await page.evaluate(async moduleUrl=>{
    const loaded:typeof import('../src/ui/source-motion')=await import(moduleUrl);if(typeof loaded.sourceMotion!=='function')throw Error('Missing authored source-motion export');const motion=loaded.sourceMotion();
    const node=document.createElement('div');document.body.append(node);
    const a=motion.animate(node,[{opacity:0},{opacity:1}],60000);
    const own=Object.getOwnPropertyDescriptor(document,'hidden');
    Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
    const hidden=a?.playState;
    if(own)Object.defineProperty(document,'hidden',own);else Reflect.deleteProperty(document,'hidden');
    document.dispatchEvent(new Event('visibilitychange'));motion.dispose();
    const restarted=motion.animate(node,[{opacity:0},{opacity:1}],60000);const result={started:!!a,hidden,restarted:!!restarted};restarted?.cancel();node.remove();return result;
   },'/@fs/'+path.resolve('src/ui/source-motion.ts').split(path.sep).join('/'));
   assert.equal(value.started,true);assert.equal(value.hidden,'idle','hidden document must release owned active animation');assert.equal(value.restarted,false,'disposed motion must stay disposed');
  });
  await check('real settings keep stable hitboxes, directional category completion and modal boundaries',async()=>{
   await page.getByRole('button',{name:'打开真实界面设置',exact:true}).click();
   const dialog=page.locator('#dol-midnight-controls');assert.equal(await dialog.evaluate(n=>n.matches(':modal')),true);
   const before=await page.locator('.dmt-settings-shell').boundingBox();assert.ok(before);
   await page.getByRole('button',{name:'材质',exact:true}).click();await waitSettings(page,'dmt-material-heading');
   assert.equal(await page.locator('.dmt-workspace-section').count(),1);
   for(const name of ['入口','阅读','材质','阅读'])await page.getByRole('button',{name,exact:true}).click();
   await waitSettings(page);assert.equal(await page.locator('.dmt-workspace-section[inert]').count(),0);
   const after=await page.locator('.dmt-settings-shell').boundingBox();assert.ok(after);for(const key of ['x','y','width'] as const)assert.ok(Math.abs(before[key]-after[key])<1);
   const enabled=await page.evaluate(()=>DoLMidnightTheme.getPreferences().comfortable);await page.getByLabel('舒适阅读间距',{exact:true}).click();assert.equal(await page.evaluate(()=>DoLMidnightTheme.getPreferences().comfortable),!enabled);
   assert.equal(await page.evaluate(()=>motionWorkspace.calls()),0);await page.screenshot({path:path.join(out,'settings-desktop.png')});
   await page.locator('.dmt-close').click();await page.evaluate(()=>motionWorkspace.open());await page.waitForFunction(()=>!document.querySelector('#dol-midnight-controls[data-sf-leaving]'));
   assert.equal(await dialog.evaluate(n=>n instanceof HTMLDialogElement&&n.open),true);await page.keyboard.press('Escape');await waitSettingsClosed(page);
  });
  await check('native-window material owns movement while original controls stay stationary and execute once',async()=>{
   const overlay=page.locator('#customOverlay');
   for(const mode of ['center','rise'])for(const zoom of [.8,1,1.25]){
    await page.selectOption('#zoom',zoom===.8?'.8':String(zoom));
    await page.selectOption('#window-style',mode);await page.getByRole('button',{name:'打开模拟原生面板',exact:true}).click();
    await page.waitForSelector('.kw-window-stage');
    if(mode==='center'){const geometry=await page.evaluate(()=>{const box=(selector:string)=>{const r=must(document.querySelector(selector)).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};return {stage:box('.kw-window-stage'),overlay:box('#customOverlay')}});for(const key of ['x','y','width','height'] as const)assert.ok(Math.abs(geometry.stage[key]-geometry.overlay[key])<1,`zoom ${zoom}: material must share final window ${key}`)}
    const snapshot=await overlay.evaluate(n=>{const button=must(n.querySelector('#native-action')),r=button.getBoundingClientRect();return{hit:button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),frames:n.getAnimations().flatMap(a=>a.effect instanceof KeyframeEffect?a.effect.getKeyframes():[]),decorative:[...document.querySelectorAll('.kw-window-stage,.kw-context-plane')].every(n=>getComputedStyle(n).pointerEvents==='none')}});
    assert.ok(snapshot.hit&&snapshot.decorative);assert.ok(snapshot.frames.length>0);assert.ok(snapshot.frames.every(f=>!('top'in f||'transform'in f||'filter'in f||'clipPath'in f)),'live window must not move or establish a new fixed-descendant container');
    const calls=await page.evaluate(()=>motionWorkspace.calls());await page.locator('#native-action').click();assert.equal(await page.evaluate(()=>motionWorkspace.calls()),calls+1);
    await page.screenshot({path:path.join(out,'native-'+mode+'.png')});await page.locator('#close-native').click();
    await page.waitForFunction(()=>!document.querySelector('.kw-window-stage,.kw-context-plane'));
   }
  });
  await check('narrow zoomed settings, reduced motion and disabling during category motion settle',async()=>{
   await page.setViewportSize({width:390,height:844});await page.selectOption('#zoom','1.25');await page.getByRole('button',{name:'打开真实界面设置',exact:true}).click();
   await page.getByRole('button',{name:'材质',exact:true}).click();await page.evaluate(()=>DoLMidnightTheme.setPreference('visualMotion',false));await waitSettings(page,'dmt-material-heading');
   assert.equal(await page.locator('.dmt-workspace-section').evaluate(n=>n.getAnimations().length),0);assert.equal(await page.locator('#toggle-animation').getAttribute('aria-pressed'),'false','preview toggle follows actual setting');await page.screenshot({path:path.join(out,'settings-narrow.png')});
   await page.locator('.dmt-close').click();await waitSettingsClosed(page);await page.emulateMedia({reducedMotion:'reduce'});
   await page.evaluate(()=>DoLMidnightTheme.setPreference('visualMotion',true));await page.getByRole('button',{name:'打开真实界面设置',exact:true}).click();await page.getByRole('button',{name:'入口',exact:true}).click();await waitSettings(page,'dmt-entry-heading');
   assert.equal(await page.locator('.dmt-workspace-section').evaluate(n=>n.getAnimations().length),0);await page.keyboard.press('Escape');await waitSettingsClosed(page);
  });
  await check('unmount during motion removes only owned presentation; remount preserves settings',async()=>{
   await page.emulateMedia({reducedMotion:'no-preference'});const saved=await page.evaluate(()=>DoLMidnightTheme.getPreferences().comfortable);
   await page.evaluate(()=>{motionWorkspace.open();motionWorkspace.destroy()});
   assert.equal(await page.locator('#dol-midnight-controls,.kw-window-stage,.kw-context-plane,.dmt-settings-context').count(),0);
   assert.equal(await page.locator('#native-action').count(),1);
   await page.getByRole('button',{name:'重新挂载',exact:true}).click();assert.equal(await page.evaluate(()=>DoLMidnightTheme.getPreferences().comfortable),saved);
   await page.evaluate(()=>motionWorkspace.destroy());assert.deepEqual(errors,[]);
  });
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({checks,errors,scope:'Mac/CI Chromium controlled real settings; simulated native overlay; not game/device acceptance',visualAcceptance:'window batch pending; sphere accepted by owner'},null,2));
 }catch(e){if(failedPage)await failedPage.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:e instanceof Error?e.stack:String(e),checks,errors},null,2));throw e}
 finally{await browser.close();await server.close()}
})().catch(e=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(e);process.exitCode=1});
