// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"named","caseSource":"check","rendererContexts":["sphere:2d"]}
import cases = require('../scripts/ci-cases.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {Page} from 'playwright';
import type {Ref} from 'vue';
import type {sphereHub} from '../src/ui/golden-spin/hub-motion.ts';
const {runCase}=cases;
type Controller=ReturnType<typeof sphereHub>;
type Snapshot=ReturnType<Controller['inspect']>;
// Authored HubApp preview surface; no game-host declaration.
declare const goldenSpinLab:{controller:Controller;recorded:Ref<string[]>;setZoom(value:number):void;mountExtra():void;settleScene():void;unmount():void};
declare global {interface Window {chargeSamples?:Promise<{early:Snapshot;settled:Snapshot;pointer:string}>;retired?:Controller}}
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import playwright = require('playwright');
const {chromium}=playwright;
import reverseHub = require('./hub-reversal-probe.cjs');
(async()=>{
 const out=path.resolve('tests/artifacts/golden-spin-b/hub-validation-'+Date.now());fs.mkdirSync(out,{recursive:true});
 const {createServer}=await import('vite');const server=await createServer({configFile:path.resolve('vite.golden-spin.config.ts'),server:{port:5183,strictPort:true}});await server.listen();
 const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
 const checks:string[]=[],errors:string[]=[];let p:Page|undefined;
 const check=async(name:string,fn:()=>Promise<void>)=>{await runCase(name,fn);checks.push(name);console.log('PASS',name)};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900},hasTouch:true});p=page;page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5183/hub.html');await page.waitForFunction(()=>{const value:unknown=Reflect.get(window,'goldenSpinLab');return !!value&&typeof value==='object'&&'controller' in value&&!!value.controller});
  const ball=page.locator('.sf-motion-ball'),nav=page.locator('.sf-motion-orbit');
  const inspect=()=>page.evaluate(()=>goldenSpinLab.controller.inspect());
  const open=()=>page.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='open');
  const closed=()=>page.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='closed');
  await check('real tools unfold promptly alongside the sphere without a half-second gate',async()=>{
   await page.evaluate(()=>{const ball=document.querySelector('.sf-motion-ball');if(!ball)throw Error('Missing charge fixture ball');window.chargeSamples=new Promise(resolve=>ball.addEventListener('click',async()=>{await new Promise(r=>setTimeout(r,120));const early=goldenSpinLab.controller.inspect();await new Promise(r=>setTimeout(r,280));resolve({early,settled:goldenSpinLab.controller.inspect(),pointer:(()=>{const petal=document.querySelector('.sf-motion-petal');if(!petal)throw Error('Missing charge fixture tool');return getComputedStyle(petal).pointerEvents})()})},{once:true}))});
   await ball.click();assert.equal(await ball.evaluate(n=>getComputedStyle(n).outlineStyle),'none','pointer activation must not show the old rectangular focus frame');const samples=await page.evaluate(()=>window.chargeSamples);
   assert.ok(samples);assert.ok(samples.early.q>0,'tools must begin during the initial sphere effect');assert.ok(samples.early.sphere.speed>10);assert.equal(samples.settled.q,1,'menu is settled before the old 500ms gate');assert.notEqual(samples.pointer,'none','settled tools accept input');
   await open();assert.equal((await inspect()).nodes,5);assert.equal(await nav.getAttribute('aria-hidden'),'false');
   for(const node of await page.locator('.sf-motion-petal').all())assert.ok(await node.evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}));
   await page.screenshot({path:path.join(out,'desktop-open.png')});
  });
  await check('closing during expansion cancels the reveal and leaves no visible menu',async()=>{
   await ball.click();await closed();await ball.click();await page.waitForTimeout(100);await ball.click();await closed();await page.waitForTimeout(800);
   assert.equal((await inspect()).q,0);assert.equal(await nav.evaluate(n=>getComputedStyle(n).visibility),'hidden');assert.equal(await nav.getAttribute('inert'),'');
   await ball.click();await open();
  });
  await check('real tool detail opens once and returns to the menu; Escape collects it',async()=>{
   await page.locator('[data-motion-view$="interface-settings"]').click();await closed();
   assert.equal(await page.locator('.sf-motion-sheet').getAttribute('aria-hidden'),'false');
   assert.equal(await page.evaluate(()=>goldenSpinLab.recorded.value.length),1);
   await page.getByRole('button',{name:'返回工具',exact:true}).click();await open();
   await ball.press('Escape');await closed();assert.equal(await nav.getAttribute('inert'),'');
  });
  await check('rapid reversals retain the current menu progress and sphere angle',async()=>{
   await ball.click();const reversal=await reverseHub(page);fs.writeFileSync(path.join(out,'reversal.json'),JSON.stringify(reversal,null,2));
   assert.ok(Math.abs(reversal.before.q-reversal.after.q)<.015,'native reversal must preserve the current progress');
   assert.ok(Math.abs(reversal.before.sphere.angle-reversal.after.sphere.angle)<.015,'native reversal must preserve the sphere angle');
   for(let i=0;i<5;i++){await ball.click();await page.waitForTimeout(85)}
   if((await inspect()).target===1)await open();else await closed();
   if((await inspect()).target===1){await ball.click();await closed()}
  });
  await check('left/right docking, narrow touch, resize and reduced motion preserve interaction',async()=>{
   await ball.press('ArrowLeft');await ball.click();await open();await page.screenshot({path:path.join(out,'left-open.png')});await ball.press('Escape');await closed();
   await ball.press('ArrowRight');await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);await ball.tap();await open();
   const r=await nav.boundingBox();assert.ok(r,'open menu must have bounds');assert.ok(r.x>=0&&r.x+r.width<=390);await page.screenshot({path:path.join(out,'narrow-open.png')});
   await ball.press('Escape');await closed();await page.emulateMedia({reducedMotion:'reduce'});await ball.press('Enter');await open();assert.equal((await inspect()).moving,false);assert.equal((await inspect()).sphere.running,false);
   await page.getByRole('button',{name:'停靠侧边',exact:true}).click();await closed();assert.ok(await ball.evaluate(n=>n.classList.contains('is-docked')));await ball.click();assert.ok(await ball.evaluate(n=>!n.classList.contains('is-docked')));
  });
  await check('dynamic tools, zoom and scene invalidation keep the native Hub owner in control',async()=>{
   await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1280,height:900});
   await page.evaluate(()=>goldenSpinLab.setZoom(125));await page.waitForTimeout(100);await ball.click();await open();
   await page.evaluate(()=>goldenSpinLab.mountExtra());await page.waitForFunction(()=>goldenSpinLab.controller.inspect().nodes===6);
   const hit=await page.locator('[data-motion-view$="lab-extra"]').evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});assert.ok(hit);
   await page.evaluate(()=>goldenSpinLab.settleScene());await closed();assert.equal(await nav.getAttribute('aria-hidden'),'true');
   await page.evaluate(()=>goldenSpinLab.setZoom(100));await page.waitForTimeout(100);
  });
  await check('explicit fan remains curved and reachable with five real tools; closed shells leave no backing box',async()=>{
   const fanPage=await browser.newPage({viewport:{width:390,height:844}});
   try{
    await fanPage.goto('http://127.0.0.1:5183/hub.html?mode=fan');
    await fanPage.waitForFunction(()=>!!goldenSpinLab.controller);
    for(const side of ['ArrowLeft','ArrowRight']){
     const fanBall=fanPage.locator('.sf-motion-ball');await fanBall.press(side);await fanBall.click();
     await fanPage.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='open');
     assert.equal(await fanPage.locator('.sf-motion-orbit').evaluate(n=>n.classList.contains('is-grid')),false);
     const boxes=await fanPage.locator('.sf-motion-petal').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,hit:n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}}));
     assert.equal(boxes.length,5);assert.ok(new Set(boxes.map(r=>Math.round(r.x))).size>1);
     for(const r of boxes)assert.ok(r.hit&&r.x>=0&&r.y>=0&&r.x+r.w<=390&&r.y+r.h<=844,JSON.stringify(r));
     await fanBall.press('Escape');await fanPage.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='closed');
     for(const selector of ['.sf-motion-orbit','.sf-motion-sheet'])assert.equal(await fanPage.locator(selector).evaluate(n=>getComputedStyle(n).display),'none');
    }
   }finally{await fanPage.close()}
  });
  await check('unmount stops both controllers and removes the experimental canvas',async()=>{
   await page.emulateMedia({reducedMotion:'no-preference'});await ball.click();await page.evaluate(()=>{window.retired=goldenSpinLab.controller;goldenSpinLab.unmount()});
   const state=await page.evaluate(()=>{if(!window.retired)throw Error('Missing retired controller');return window.retired.inspect()});assert.ok(state.dead&&state.sphere.dead&&!state.moving&&!state.sphere.running);assert.equal(await page.locator('.spin-hub-canvas').count(),0);
  });
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({checks,errors,coverage:'standalone real MotionHub; simulated tool contents; controlled Edge/CI Chromium',visualAcceptance:'full Hub pending'},null,2));
 }catch(e){if(p)await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:e instanceof Error?e.stack:String(e),checks,errors,state:p?await p.evaluate(()=>typeof goldenSpinLab==='undefined'?undefined:goldenSpinLab.controller?.inspect()).catch(()=>null):null},null,2));throw e}
 finally{await browser.close();await server.close()}
})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});
