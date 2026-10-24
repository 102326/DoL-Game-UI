// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"named","caseSource":"check","rendererContexts":["sphere:2d"]}
import cases = require('../scripts/ci-cases.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {Page} from 'playwright';
import type {createSphere} from '../src/ui/golden-spin/sphere.ts';
const {runCase}=cases;
declare const goldenSphereLab:ReturnType<typeof createSphere>;
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import playwright = require('playwright');
const {chromium}=playwright;
const root=path.resolve(__dirname,'..'),out=path.join(root,'tests/artifacts/golden-spin-b/sphere-validation-'+Date.now());
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const {createServer}=await import('vite');const server=await createServer({configFile:path.join(root,'vite.golden-spin.config.ts'),server:{port:5182,strictPort:true}});await server.listen();
 const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
 const checks:string[]=[],errors:string[]=[];let p:Page|undefined;
 const check=async(name:string,fn:()=>Promise<void>)=>{await runCase(name,fn);checks.push(name);console.log('PASS',name)};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:960},hasTouch:true});p=page;page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5182/');await page.waitForFunction(()=>!!Reflect.get(window,'goldenSphereLab'));
  const inspect=()=>page.evaluate(()=>goldenSphereLab.inspect());
  const idle=()=>page.waitForFunction(()=>goldenSphereLab.inspect().phase==='idle');
  await check('ball-only stages accelerate, release an expanding spiral, then naturally settle',async()=>{
   assert.equal(await page.locator('.sf-motion-orbit').count(),0);
   const before=await inspect();await page.getByRole('button',{name:'启动球体回旋',exact:true}).click();
   await page.waitForFunction(()=>goldenSphereLab.inspect().phase==='charge'&&goldenSphereLab.inspect().speed>10);
   const corePixels=()=>page.locator('canvas').evaluate(n=>{if(!(n instanceof HTMLCanvasElement))throw Error('Missing sphere canvas');const context=n.getContext('2d');if(!context)throw Error('Missing sphere 2D context');return Array.from(context.getImageData(n.width*.5-32,n.height*.48-32,64,64).data)});
   const coreBefore=await corePixels();await page.waitForTimeout(70);const coreAfter=await corePixels();
   assert.equal(coreAfter.length,coreBefore.length);assert.ok(coreAfter.filter((value,i)=>{const before=coreBefore[i];return i%4!==3&&before!==undefined&&Math.abs(value-before)>12}).length>300,'the ball interior itself must move before the outer release begins');
   await page.screenshot({path:path.join(out,'charge.png')});
   await page.waitForFunction(()=>goldenSphereLab.inspect().phase==='release'&&goldenSphereLab.inspect().spread>.65);
   const release=await inspect();assert.ok(release.energy>.6&&release.speed>40);assert.ok(release.meteors>0&&release.meteors<=28,'meteor trails must be live and bounded');assert.ok(release.running&&release.draws>before.draws+10,'phase labels alone do not prove the canvas is animating');assert.notEqual(release.angle,before.angle);await page.screenshot({path:path.join(out,'release.png')});
   await page.waitForFunction(()=>goldenSphereLab.inspect().phase==='afterglow');await idle();await page.waitForTimeout(80);
   const end=await inspect();assert.ok(end.speed<.31&&end.energy===0&&!end.running&&end.meteors===0);
  });
  await check('rapid restart and mid-flight collection retain angular continuity and release all motion',async()=>{
   await page.evaluate(()=>goldenSphereLab.configure({duration:.5}));
   await page.getByRole('button',{name:'启动球体回旋',exact:true}).press('Enter');await page.waitForTimeout(230);
   const result=await page.evaluate(()=>{const before=goldenSphereLab.inspect();goldenSphereLab.play();const restart=goldenSphereLab.inspect();goldenSphereLab.recover();return {before,restart,after:goldenSphereLab.inspect()}});
   assert.equal(result.before.angle,result.restart.angle);assert.equal(result.restart.angle,result.after.angle);
   assert.equal(result.before.speed,result.restart.speed);assert.equal(result.after.phase,'return');await idle();
   for(let i=0;i<6;i++){await page.evaluate(i=>i%2?goldenSphereLab.recover():goldenSphereLab.play(),i);await page.waitForTimeout(45)}await idle();
   const end=await inspect();await page.waitForTimeout(150);assert.equal((await inspect()).draws,end.draws);
  });
  await check('narrow screen and resize keep the ball hit target inside the stage',async()=>{
   await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'启动球体回旋',exact:true}).tap();
   await page.waitForFunction(()=>goldenSphereLab.inspect().phase==='release'&&goldenSphereLab.inspect().spread>.75);await page.screenshot({path:path.join(out,'narrow.png')});
   const geometry=await page.locator('.sphere-trigger').evaluate(n=>{const r=n.getBoundingClientRect();return {hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===n,left:r.left,right:r.right,viewport:innerWidth}});
   assert.ok(geometry.hit&&geometry.left>=0&&geometry.right<=geometry.viewport);await idle();
   await page.setViewportSize({width:844,height:390});await page.waitForTimeout(50);assert.ok((await inspect()).width>0);
  });
  await check('reduced motion renders a static response with keyboard-accessible controls',async()=>{
   await page.getByRole('button',{name:'启动球体回旋',exact:true}).press('Enter');
   await page.waitForFunction(()=>goldenSphereLab.inspect().speed>5);
   await page.emulateMedia({reducedMotion:'reduce'});
   // Change the preference during motion; both notifications and the active-frame check must stop it.
   await page.waitForFunction(()=>goldenSphereLab.inspect().phase==='reduced');
   await page.getByRole('button',{name:'启动球体回旋',exact:true}).press('Enter');
   const before=await inspect();assert.equal(before.phase,'reduced');assert.equal(before.running,false);assert.equal(before.meteors,0);
   await page.waitForTimeout(180);const after=await inspect();assert.equal(after.angle,before.angle);assert.equal(after.running,false);
   assert.equal(after.draws-before.draws,after.motionChanges-before.motionChanges,'only a delivered preference notification may redraw the static frame');
   await page.getByRole('button',{name:'收束 / 中断',exact:true}).click();assert.equal((await inspect()).phase,'idle');
   await page.emulateMedia({reducedMotion:'no-preference'});
  });
  await check('dispose cancels the timeline, frame, observers and responsive callbacks',async()=>{
   await page.evaluate(()=>{goldenSphereLab.play();goldenSphereLab.destroy()});const before=await inspect();
   await page.setViewportSize({width:800,height:700});await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(120);
   const after=await inspect();assert.ok(after.dead&&!after.running);assert.equal(after.meteors,0);assert.equal(after.phase,'disposed');assert.equal(after.draws,before.draws);
  });
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({stage:'ball-only Prototype A',checks,errors,visualAcceptance:'pending',coverage:'controlled desktop Edge or CI Chromium; no game integration'},null,2));
 }catch(error){const state=p?await p.evaluate(()=>({state:typeof goldenSphereLab==='undefined'?undefined:goldenSphereLab.inspect(),visibility:document.visibilityState})).catch(()=>null):null;fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error instanceof Error?error.stack:String(error),checks,errors,state},null,2));console.error('failure state',state);throw error}
 finally{await browser.close();await server.close()}
})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});
