// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"named","caseSource":"check","rendererContexts":["sphere:2d"]}
const {runCase}=require('../scripts/ci-cases.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const reverseHub=require('./hub-reversal-probe.cjs');
(async()=>{
 const out=path.resolve('tests/artifacts/golden-spin-b/hub-validation-'+Date.now());fs.mkdirSync(out,{recursive:true});
 const {createServer}=await import('vite');const server=await createServer({configFile:path.resolve('vite.golden-spin.config.ts'),server:{port:5183,strictPort:true}});await server.listen();
 const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
 const checks=[],errors=[];let p;
 const check=async(name,fn)=>{await runCase(name,fn);checks.push(name);console.log('PASS',name)};
 try{
  p=await browser.newPage({viewport:{width:1280,height:900},hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:5183/hub.html');await p.waitForFunction(()=>window.goldenSpinLab?.controller);
  const ball=p.locator('.sf-motion-ball'),nav=p.locator('.sf-motion-orbit');
  const inspect=()=>p.evaluate(()=>goldenSpinLab.controller.inspect());
  const open=()=>p.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='open');
  const closed=()=>p.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='closed');
  await check('real tools unfold immediately alongside sphere charge and remain hittable in their native layout',async()=>{
   await ball.click();assert.equal(await ball.evaluate(n=>getComputedStyle(n).outlineStyle),'none','pointer activation must not show the old rectangular focus frame');await p.waitForTimeout(120);const charge=await inspect();assert.ok(charge.q>0,'menu must not wait for sphere charge');assert.ok(charge.sphere.speed>10);
   assert.notEqual(await p.locator('.sf-motion-petal').first().evaluate(n=>getComputedStyle(n).pointerEvents),'none','visible tools must already accept input');
   await open();assert.equal((await inspect()).nodes,5);assert.equal(await nav.getAttribute('aria-hidden'),'false');
   for(const node of await p.locator('.sf-motion-petal').all())assert.ok(await node.evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}));
   await p.screenshot({path:path.join(out,'desktop-open.png')});
  });
  await check('real tool detail opens once and returns to the menu; Escape collects it',async()=>{
   await p.locator('[data-motion-view$="interface-settings"]').click();await closed();
   assert.equal(await p.locator('.sf-motion-sheet').getAttribute('aria-hidden'),'false');
   assert.equal(await p.evaluate(()=>goldenSpinLab.recorded.value.length),1);
   await p.getByRole('button',{name:'返回工具',exact:true}).click();await open();
   await ball.press('Escape');await closed();assert.equal(await nav.getAttribute('inert'),'');
  });
  await check('rapid reversals retain the current menu progress and sphere angle',async()=>{
   await ball.click();const reversal=await reverseHub(p);fs.writeFileSync(path.join(out,'reversal.json'),JSON.stringify(reversal,null,2));
   assert.ok(Math.abs(reversal.before.q-reversal.after.q)<.015,'native reversal must preserve the current progress');
   assert.ok(Math.abs(reversal.before.sphere.angle-reversal.after.sphere.angle)<.015,'native reversal must preserve the sphere angle');
   for(let i=0;i<5;i++){await ball.click();await p.waitForTimeout(85)}
   if((await inspect()).target===1)await open();else await closed();
   if((await inspect()).target===1){await ball.click();await closed()}
  });
  await check('left/right docking, narrow touch, resize and reduced motion preserve interaction',async()=>{
   await ball.press('ArrowLeft');await ball.click();await open();await p.screenshot({path:path.join(out,'left-open.png')});await ball.press('Escape');await closed();
   await ball.press('ArrowRight');await p.setViewportSize({width:390,height:844});await p.waitForTimeout(100);await ball.tap();await open();
   const r=await nav.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=390);await p.screenshot({path:path.join(out,'narrow-open.png')});
   await ball.press('Escape');await closed();await p.emulateMedia({reducedMotion:'reduce'});await ball.press('Enter');await open();assert.equal((await inspect()).moving,false);assert.equal((await inspect()).sphere.running,false);
   await p.getByRole('button',{name:'停靠侧边',exact:true}).click();await closed();assert.ok(await ball.evaluate(n=>n.classList.contains('is-docked')));await ball.click();assert.ok(await ball.evaluate(n=>!n.classList.contains('is-docked')));
  });
  await check('dynamic tools, zoom and scene invalidation keep the native Hub owner in control',async()=>{
   await p.emulateMedia({reducedMotion:'no-preference'});await p.setViewportSize({width:1280,height:900});
   await p.evaluate(()=>goldenSpinLab.setZoom(125));await p.waitForTimeout(100);await ball.click();await open();
   await p.evaluate(()=>goldenSpinLab.mountExtra());await p.waitForFunction(()=>goldenSpinLab.controller.inspect().nodes===6);
   const hit=await p.locator('[data-motion-view$="lab-extra"]').evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});assert.ok(hit);
   await p.evaluate(()=>goldenSpinLab.settleScene());await closed();assert.equal(await nav.getAttribute('aria-hidden'),'true');
   await p.evaluate(()=>goldenSpinLab.setZoom(100));await p.waitForTimeout(100);
  });
  await check('unmount stops both controllers and removes the experimental canvas',async()=>{
   await p.emulateMedia({reducedMotion:'no-preference'});await ball.click();await p.evaluate(()=>{window.retired=goldenSpinLab.controller;goldenSpinLab.unmount()});
   const state=await p.evaluate(()=>retired.inspect());assert.ok(state.dead&&state.sphere.dead&&!state.moving&&!state.sphere.running);assert.equal(await p.locator('.spin-hub-canvas').count(),0);
  });
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({checks,errors,coverage:'standalone real MotionHub; simulated tool contents; controlled Edge/CI Chromium',visualAcceptance:'full Hub pending'},null,2));
 }catch(e){if(p)await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:e.stack,checks,errors,state:p?await p.evaluate(()=>window.goldenSpinLab?.controller?.inspect()).catch(()=>null):null},null,2));throw e}
 finally{await browser.close();await server.close()}
})().catch(e=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(e);process.exitCode=1});
