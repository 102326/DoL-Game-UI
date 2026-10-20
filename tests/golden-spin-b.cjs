const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'tests/artifacts/golden-spin-b/sphere-validation-'+Date.now());
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const {createServer}=await import('vite');const server=await createServer({configFile:path.join(root,'vite.golden-spin.config.ts'),server:{port:5182,strictPort:true}});await server.listen();
 const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
 const checks=[],errors=[];let p;
 const check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS',name)};
 try{
  p=await browser.newPage({viewport:{width:1280,height:960},hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:5182/');await p.waitForFunction(()=>window.goldenSphereLab);
  const inspect=()=>p.evaluate(()=>goldenSphereLab.inspect());
  const idle=()=>p.waitForFunction(()=>goldenSphereLab.inspect().phase==='idle');
  await check('ball-only stages accelerate, release an expanding spiral, then naturally settle',async()=>{
   assert.equal(await p.locator('.sf-motion-orbit').count(),0);
   const before=await inspect();await p.getByRole('button',{name:'启动球体回旋',exact:true}).click();
   await p.waitForFunction(()=>goldenSphereLab.inspect().phase==='charge'&&goldenSphereLab.inspect().speed>10);
   await p.screenshot({path:path.join(out,'charge.png')});
   await p.waitForFunction(()=>goldenSphereLab.inspect().phase==='release'&&goldenSphereLab.inspect().spread>.65);
   const release=await inspect();assert.ok(release.energy>.6&&release.speed>40);assert.ok(release.running&&release.draws>before.draws+10,'phase labels alone do not prove the canvas is animating');assert.notEqual(release.angle,before.angle);await p.screenshot({path:path.join(out,'release.png')});
   await p.waitForFunction(()=>goldenSphereLab.inspect().phase==='afterglow');await idle();await p.waitForTimeout(80);
   const end=await inspect();assert.ok(end.speed<.31&&end.energy===0&&!end.running);
  });
  await check('rapid restart and mid-flight collection retain angular continuity and release all motion',async()=>{
   await p.evaluate(()=>goldenSphereLab.configure({duration:.5}));
   await p.getByRole('button',{name:'启动球体回旋',exact:true}).press('Enter');await p.waitForTimeout(230);
   const result=await p.evaluate(()=>{const before=goldenSphereLab.inspect();goldenSphereLab.play();const restart=goldenSphereLab.inspect();goldenSphereLab.recover();return {before,restart,after:goldenSphereLab.inspect()}});
   assert.equal(result.before.angle,result.restart.angle);assert.equal(result.restart.angle,result.after.angle);
   assert.equal(result.before.speed,result.restart.speed);assert.equal(result.after.phase,'return');await idle();
   for(let i=0;i<6;i++){await p.evaluate(i=>i%2?goldenSphereLab.recover():goldenSphereLab.play(),i);await p.waitForTimeout(45)}await idle();
   const end=await inspect();await p.waitForTimeout(150);assert.equal((await inspect()).draws,end.draws);
  });
  await check('narrow screen and resize keep the ball hit target inside the stage',async()=>{
   await p.setViewportSize({width:390,height:844});await p.getByRole('button',{name:'启动球体回旋',exact:true}).tap();
   await p.waitForFunction(()=>goldenSphereLab.inspect().phase==='release'&&goldenSphereLab.inspect().spread>.75);await p.screenshot({path:path.join(out,'narrow.png')});
   const geometry=await p.locator('.sphere-trigger').evaluate(n=>{const r=n.getBoundingClientRect();return {hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===n,left:r.left,right:r.right,viewport:innerWidth}});
   assert.ok(geometry.hit&&geometry.left>=0&&geometry.right<=geometry.viewport);await idle();
   await p.setViewportSize({width:844,height:390});await p.waitForTimeout(50);assert.ok((await inspect()).width>0);
  });
  await check('reduced motion renders a static response with keyboard-accessible controls',async()=>{
   await p.emulateMedia({reducedMotion:'reduce'});await p.getByRole('button',{name:'启动球体回旋',exact:true}).press('Enter');
   const before=await inspect();assert.equal(before.phase,'reduced');assert.equal(before.running,false);
   await p.waitForTimeout(180);assert.equal((await inspect()).draws,before.draws);
   await p.getByRole('button',{name:'收束 / 中断',exact:true}).click();assert.equal((await inspect()).phase,'idle');
   await p.emulateMedia({reducedMotion:'no-preference'});
  });
  await check('dispose cancels the timeline, frame, observers and responsive callbacks',async()=>{
   await p.evaluate(()=>{goldenSphereLab.play();goldenSphereLab.destroy()});const before=await inspect();
   await p.setViewportSize({width:800,height:700});await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(120);
   const after=await inspect();assert.ok(after.dead&&!after.running);assert.equal(after.phase,'disposed');assert.equal(after.draws,before.draws);
  });
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({stage:'ball-only Prototype A',checks,errors,visualAcceptance:'pending',coverage:'controlled desktop Edge or CI Chromium; no game integration'},null,2));
 }catch(error){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.stack,checks,errors},null,2));throw error}
 finally{await browser.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
