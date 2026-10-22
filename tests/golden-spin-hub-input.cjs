const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const reverseHub=require('./hub-reversal-probe.cjs');
const baseline=process.argv.includes('--baseline'),revision='5a656c602cdf5d9bf569ba9364ee46f5475e5c66';
(async()=>{
 const out=path.resolve('tests/artifacts/golden-spin-b/hub-validation-input-'+Date.now());fs.mkdirSync(out,{recursive:true});
 const {createServer}=await import('vite');
 const old=baseline?execFileSync('git',['show',revision+':prototypes/golden-spin-b/hub-motion.ts'],{encoding:'utf8'}):null;
 const server=await createServer({configFile:path.resolve('vite.golden-spin.config.ts'),plugins:baseline?[{name:'frozen-hub-input-baseline',enforce:'pre',load(id){if(id.replaceAll('\\','/').endsWith('/prototypes/golden-spin-b/hub-motion.ts'))return old}}]:[],server:{port:5184,strictPort:true}});await server.listen();
 const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
 const evidence={baseline,revision:baseline?revision:'working tree',checks:[],errors:[]};let p;
 const check=async(name,fn)=>{await fn();evidence.checks.push(name);console.log('PASS',name)};
 try{
  p=await browser.newPage({viewport:{width:1280,height:900},hasTouch:true});p.on('pageerror',e=>evidence.errors.push(e.message));
  await p.goto('http://127.0.0.1:5184/hub.html');await p.waitForFunction(()=>window.goldenSpinLab?.controller);
  const ball=p.locator('.sf-motion-ball'),nav=p.locator('.sf-motion-orbit'),tool=p.locator('[data-motion-view$="interface-settings"]');
  const inspect=()=>p.evaluate(()=>goldenSpinLab.controller.inspect()),open=()=>p.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='open'),closed=()=>p.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='closed');
  const mid=()=>p.waitForFunction(()=>{const s=goldenSpinLab.controller.inspect();return s.moving&&s.q>.68&&s.q<.96});
  const keyboardTool=async()=>{await ball.focus();for(let i=0;i<10;i++){await p.keyboard.press('Shift+Tab');if(await tool.evaluate(n=>n===document.activeElement))return}throw Error('native keyboard traversal did not reach the tool')};
  await check('H3 visible moving tool accepts a real pointer once without moving beneath the press',async()=>{
   await tool.evaluate(n=>{window.originalTool=n;window.nativeToolClicks=0;n.addEventListener('click',()=>window.nativeToolClicks++)});
   await ball.click();await mid();
   const before=await tool.evaluate(n=>{const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,pointer:getComputedStyle(n).pointerEvents,tab:n.tabIndex,hit:n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}});
   await p.mouse.move(before.x,before.y);await p.mouse.down();const press=await inspect();await p.waitForTimeout(100);const held=await inspect();await p.mouse.up();await p.waitForTimeout(250);
   evidence.pointer={before,press,held,after:await inspect(),native:await p.evaluate(()=>nativeToolClicks),calls:await p.evaluate(()=>goldenSpinLab.recorded.value.slice()),sameNode:await tool.evaluate(n=>n===window.originalTool)};
   fs.writeFileSync(path.join(out,'pointer.json'),JSON.stringify(evidence.pointer,null,2));
   assert.ok(before.hit&&before.pointer!=='none'&&before.tab===0,'visible tools must not be locked until the whole animation ends');
   assert.ok(Math.abs(held.q-press.q)<.015,'hold the current pose during the pointer transaction');
   assert.equal(evidence.pointer.native,1);assert.deepEqual(evidence.pointer.calls,['interface-settings']);assert.ok(evidence.pointer.sameNode);
   await closed();assert.equal(await p.locator('.sf-motion-sheet').getAttribute('aria-hidden'),'false');
   assert.ok(await p.locator('.sf-motion-sheet h2').evaluate(n=>n===document.activeElement));await p.screenshot({path:path.join(out,'pointer-tool-open.png')});
  });
  await check('H3 keyboard activation and cancel during opening retain native focus and single activation',async()=>{
   await p.getByRole('button',{name:'返回工具',exact:true}).click();await mid();await keyboardTool();const before=await inspect();await p.waitForTimeout(100);assert.ok(Math.abs((await inspect()).q-before.q)<.015);
   await tool.press('Enter');await closed();assert.equal(await p.evaluate(()=>nativeToolClicks),2);assert.equal(await p.evaluate(()=>goldenSpinLab.recorded.value.length),2);
   await p.getByRole('button',{name:'返回工具',exact:true}).click();await mid();await keyboardTool();await tool.press('Escape');await closed();assert.ok(await ball.evaluate(n=>n===document.activeElement));assert.equal(await nav.getAttribute('inert'),'');
  });
  await check('H3 releasing a pointer outside cancels activation and resumes instead of pinning pointer focus',async()=>{
   const prior=await p.evaluate(()=>nativeToolClicks);await ball.click();await mid();const r=await tool.boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();assert.equal((await inspect()).pressed,true);
   await p.mouse.move(700,240);await p.mouse.up();await open();assert.equal(await p.evaluate(()=>nativeToolClicks),prior);assert.equal((await inspect()).paused,false);await ball.press('Escape');await closed();
  });
  await check('H1 H2 opening and closing reverse continuously, keep native terminal layout and settle resources',async()=>{
   await ball.click();evidence.reversal=await reverseHub(p);assert.ok(Math.abs(evidence.reversal.before.q-evidence.reversal.after.q)<.015);assert.ok(Math.abs(evidence.reversal.before.sphere.angle-evidence.reversal.after.sphere.angle)<.015);
   await p.waitForTimeout(100);await ball.click();await open();
   for(const n of await p.locator('.sf-motion-petal').all())assert.equal(await n.evaluate(n=>n.style.transform),'none');
   await ball.click();await closed();await p.waitForFunction(()=>!goldenSpinLab.controller.inspect().sphere.running);
   const settled=await inspect();await p.waitForTimeout(120);assert.equal((await inspect()).sphere.draws,settled.sphere.draws);
  });
  await check('H3 H4 drag during opening closes safely, then dock and restore work during the next opening',async()=>{
   await ball.click();await mid();const r=await ball.boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.mouse.move(4,r.y+70,{steps:6});await p.mouse.up();await closed();
   assert.ok(await ball.evaluate(n=>n.classList.contains('is-docked')));await ball.click();assert.ok(await ball.evaluate(n=>!n.classList.contains('is-docked')));
   await ball.click();await p.waitForFunction(()=>{const s=goldenSpinLab.controller.inspect();return s.moving&&s.q>.9});
   const dock=p.getByRole('button',{name:'停靠侧边',exact:true});const b=await dock.boundingBox();await p.mouse.click(b.x+b.width/2,b.y+b.height/2);await closed();assert.ok(await ball.evaluate(n=>n.classList.contains('is-docked')));await ball.click();
  });
  await check('H4 narrow touch and zoom preserve targets; active reduced/disabled motion settles immediately',async()=>{
   await p.setViewportSize({width:390,height:844});await p.waitForTimeout(100);await ball.tap();await mid();const touchTarget=await tool.boundingBox(),prior=await p.evaluate(()=>nativeToolClicks);await p.touchscreen.tap(touchTarget.x+touchTarget.width/2,touchTarget.y+touchTarget.height/2);await closed();assert.equal(await p.evaluate(()=>nativeToolClicks),prior+1);await p.getByRole('button',{name:'返回工具',exact:true}).click();await open();const r=await nav.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=390);await p.screenshot({path:path.join(out,'narrow.png')});await ball.press('Escape');await closed();
   await p.setViewportSize({width:1280,height:900});await p.evaluate(()=>goldenSpinLab.setZoom(125));await p.waitForTimeout(100);await ball.click();await mid();await p.emulateMedia({reducedMotion:'reduce'});await open();assert.equal((await inspect()).moving,false);assert.equal((await inspect()).sphere.running,false);await ball.press('Escape');await closed();await p.emulateMedia({reducedMotion:'no-preference'});
   await ball.click();await mid();await p.evaluate(()=>document.documentElement.removeAttribute('data-dgu-visualMotion'));await open();assert.equal((await inspect()).sphere.running,false);await ball.press('Escape');await closed();await p.evaluate(()=>document.documentElement.setAttribute('data-dgu-visualMotion',''));await p.evaluate(()=>goldenSpinLab.setZoom(100));
  });
  await check('H4 hidden view pauses both layers and resumes the latest intent',async()=>{
   await ball.click();await mid();await p.evaluate(()=>{window.hiddenBefore=Object.getOwnPropertyDescriptor(document,'hidden');Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
   const before=await inspect();await p.waitForTimeout(120);const hidden=await inspect();assert.equal(hidden.q,before.q);assert.equal(hidden.sphere.angle,before.sphere.angle);assert.equal(hidden.sphere.running,false);
   await p.evaluate(()=>{if(window.hiddenBefore)Object.defineProperty(document,'hidden',window.hiddenBefore);else delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});await open();await ball.press('Escape');await closed();
  });
  await check('H4 scene exit, owner teardown and re-mount cannot replay activation or retain callbacks',async()=>{
   await ball.click();await mid();await p.evaluate(()=>goldenSpinLab.settleScene());await closed();
   await ball.click();await mid();await keyboardTool();await p.evaluate(()=>{window.retired=goldenSpinLab.controller;goldenSpinLab.unmount()});
   const before=await p.evaluate(()=>retired.inspect());await p.setViewportSize({width:900,height:700});await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(150);const after=await p.evaluate(()=>retired.inspect());
   assert.ok(after.dead&&!after.moving&&after.sphere.dead&&!after.sphere.running);assert.equal(after.renders,before.renders);assert.equal(await p.locator('.spin-hub-canvas').count(),0);
   await p.emulateMedia({reducedMotion:'no-preference'});await p.getByRole('button',{name:'重新挂载',exact:true}).click();await p.waitForSelector('.spin-hub-canvas');assert.equal(await p.locator('.spin-hub-canvas').count(),1);await ball.click();await open();
  });
  assert.deepEqual(evidence.errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(evidence,null,2));console.log('Evidence',out);
 }catch(e){evidence.failure=e.stack;evidence.state=p?await p.evaluate(()=>window.goldenSpinLab?.controller?.inspect()).catch(()=>null):null;if(p)await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(evidence,null,2));console.error('Evidence',out);throw e}
 finally{await browser.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
