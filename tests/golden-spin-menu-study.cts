import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import esbuild = require('esbuild');
import playwright = require('playwright');
import type {Ref} from 'vue';
import type {goldenSpin} from '../prototypes/golden-spin-b/controller';
const {buildSync}=esbuild,{chromium}=playwright;
type Controller=ReturnType<typeof goldenSpin>;
declare const goldenSpinLab:{controller:Controller;recorded:Ref<string[]>;setZoom(value:number):void;mountExtra():void;settleScene():void;unmount():void;remount():void};
declare const originalTools:HTMLButtonElement[],originalHandlers:Array<HTMLButtonElement['onclick']>,retired:Controller,detachedController:Controller;
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing menu study value');return value;}

const root=path.resolve(__dirname,'..'),out=path.join(root,'tests/artifacts/golden-spin-b/validation-'+Date.now());
fs.mkdirSync(out,{recursive:true});
const model:{exports:Partial<typeof import('../prototypes/golden-spin-b/path')>}={exports:{}};const output=buildSync({entryPoints:[path.join(root,'prototypes/golden-spin-b/path.ts')],bundle:true,write:false,format:'cjs'}).outputFiles?.[0];assert.ok(output,'Path bundle missing');new Function('module','exports',output.text)(model,model.exports);
const {pose,progressAt}=model.exports;assert.ok(pose&&progressAt,'Actual path exports missing');
const origin={x:1200,y:500},target={x:1060,y:320,width:180,height:58},bounds={left:0,top:0,right:1280,bottom:900};
const final=pose(1,0,5,origin,target,bounds);assert.equal(final.x,target.x);assert.equal(final.y,target.y);assert.equal(final.scale,1);
const phasePoints=Array.from({length:31},(_,i)=>pose(i/30,0,5,origin,target,bounds));
assert.ok(phasePoints.some(p=>Math.abs((p.x-origin.x)*(target.y-origin.y)-(p.y-origin.y)*(target.x-origin.x))>3000),'actual path must leave the straight-line chord');
assert.equal(progressAt(0,.4,0,.7,1).q,.4);assert.equal(progressAt(0,.4,0,.7,1).velocity,.7);assert.equal(progressAt(1,.4,0,.7,1).velocity,0);

(async()=>{
 const {createServer}=await import('vite');const server=await createServer({configFile:path.join(root,'vite.golden-spin.config.ts'),server:{port:5182,strictPort:true}});await server.listen();
 const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
 const checks:string[]=[],metrics:Array<{engine:string;elapsedMs:number;renderCalls:number;layoutCount:number;styleRecalcs:number;taskSeconds:number}>=[],errors:string[]=[];let failedPage:playwright.Page|undefined;
 const check=async(name:string,fn:()=>Promise<void>)=>{await fn();checks.push(name);console.log('PASS',name)};
 try{
  const p=await browser.newPage({viewport:{width:1280,height:900}});failedPage=p;p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5182/menu-study.html');await p.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null|undefined)=>{if(value==null)throw Error('Missing menu study value');return value}}));await p.waitForFunction(()=>typeof goldenSpinLab!=='undefined');
  const ball=p.locator('.sf-motion-ball'),nav=p.locator('.sf-motion-orbit');
  const wait=()=>p.waitForFunction(()=>goldenSpinLab.controller&&!goldenSpinLab.controller.inspect().moving);
  const toggle=()=>ball.evaluate(n=>{if(!(n instanceof HTMLElement))throw Error('Missing menu ball');n.click()});
  await p.evaluate(()=>{Object.assign(window,{originalTools:[...document.querySelectorAll<HTMLButtonElement>('.sf-motion-petal')]});Object.assign(window,{originalHandlers:originalTools.map(n=>n.onclick)})});
  await check('real grid tools spiral out, land without a residual transform and dispatch exactly one callback',async()=>{
   await toggle();await p.waitForTimeout(650);
   assert.equal(await nav.evaluate(n=>getComputedStyle(n).clipPath),'none');assert.equal(await nav.evaluate(n=>getComputedStyle(n).transform),'none');
   assert.equal(await p.locator('.sf-motion-petal').first().evaluate(n=>getComputedStyle(n).pointerEvents),'none');
   assert.equal(await p.locator('.sf-motion-petal').first().evaluate(n=>n.tabIndex),-1);
   await p.screenshot({path:path.join(out,'transfer.png')});await wait();
   assert.equal(await p.locator('.sf-motion-petal').first().evaluate(n=>n.style.transform),'');
   assert.equal(await p.evaluate(()=>originalTools.every((n,i)=>n===document.querySelectorAll('.sf-motion-petal')[i])),true);
   await p.locator('[data-motion-view$=native-social]').click();assert.equal(await p.evaluate(()=>goldenSpinLab.recorded.value.length),1);await wait();
  });
  await check('rapid reversal preserves current position and brakes before changing direction',async()=>{
   await toggle();await p.waitForFunction(()=>goldenSpinLab.controller.inspect().q>.35);
   const values=await p.evaluate(async()=>{const c=goldenSpinLab.controller,b=must(document.querySelector<HTMLElement>('.sf-motion-ball')),nav=must(document.querySelector('.sf-motion-orbit')),n=must(document.querySelector('.sf-motion-petal')),r=n.getBoundingClientRect(),before=c.inspect();return await new Promise<{before:ReturnType<Controller['inspect']>;after:ReturnType<Controller['inspect']>;jump:number}>(resolve=>{const watch=new MutationObserver(()=>{watch.disconnect();const after=n.getBoundingClientRect();resolve({before,after:c.inspect(),jump:Math.hypot(r.x-after.x,r.y-after.y)})});watch.observe(nav,{attributes:true,attributeFilter:['class']});b.click()})});
   assert.ok(values.jump<.5,JSON.stringify(values));assert.ok(values.after.velocity>0,'reverse starts by braking forward velocity: '+JSON.stringify(values));
   await p.waitForTimeout(100);await toggle();await wait();assert.equal(await p.evaluate(()=>goldenSpinLab.controller.inspect().q),1);
   for(let i=0;i<8;i++){await toggle();await p.waitForTimeout(35)}await wait();assert.equal(await ball.getAttribute('aria-expanded'),'true');
   await toggle();await wait();
  });
  await check('GSAP and native WAAPI retain end positions and hit targets on both sides and representative screens',async()=>{
   for(const engine of ['gsap','waapi'] as const)for(const size of [{width:1280,height:900},{width:390,height:844},{width:844,height:390}])for(const key of ['ArrowLeft','ArrowRight']){
    await p.setViewportSize(size);await p.waitForTimeout(50);await p.evaluate(engine=>goldenSpinLab.controller.configure({engine,duration:.4}),engine);
    await ball.press(key);await toggle();await p.waitForFunction(()=>goldenSpinLab.controller.inspect().q>.18);
    const launch=await p.evaluate(()=>{const b=must(document.querySelector<HTMLElement>('.sf-motion-ball')).getBoundingClientRect(),t=must(document.querySelector<HTMLElement>('.sf-motion-petal')).getBoundingClientRect();return {distance:Math.hypot((b.x+b.width/2)-(t.x+t.width/2),(b.y+b.height/2)-(t.y+t.height/2)),ball:{x:b.x+b.width/2,y:b.y+b.height/2},tool:{x:t.x+t.width/2,y:t.y+t.height/2},motion:goldenSpinLab.controller.inspect()}});assert.ok(launch.distance<110,JSON.stringify({engine,size,key,launch}));await wait();
    const rows=await p.locator('.sf-motion-petal').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.sf-motion-petal')===n}}));
    for(const r of rows)assert.ok(r.hit&&r.x>=-1&&r.y>=-1&&r.right<=size.width+1&&r.bottom<=size.height+1,JSON.stringify({engine,size,key,r}));
    await toggle();await wait();
   }
  });
  await check('CSS Zoom uses the measured physical-to-local scale and returns actual targets',async()=>{
   await p.setViewportSize({width:1280,height:900});await ball.press('ArrowLeft');
   for(const z of [80,100,125])for(const key of ['ArrowLeft','ArrowRight']){
    await p.evaluate(z=>goldenSpinLab.setZoom(z),z);await p.waitForTimeout(80);await ball.press(key);await toggle();await wait();
    const result=await p.evaluate(()=>{const c=goldenSpinLab.controller.inspect(),n=must(document.querySelector<HTMLElement>('.sf-motion-petal')),r=n.getBoundingClientRect();return {c,transform:n.style.transform,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.sf-motion-petal')===n}});
    assert.ok(Math.abs(result.c.scaleX-z/100)<.02,JSON.stringify(result));assert.equal(result.transform,'');assert.equal(result.hit,true);
    await toggle();await wait();
   }
   await p.evaluate(()=>goldenSpinLab.setZoom(100));
  });
  await check('dynamic tools, resize, drag and scene invalidation stop stale motion',async()=>{
   await p.evaluate(()=>goldenSpinLab.controller.configure({duration:1.2}));await toggle();await p.waitForTimeout(350);await p.evaluate(()=>goldenSpinLab.mountExtra());await wait();assert.equal(await p.locator('.sf-motion-petal').count(),6);
   await p.evaluate(()=>goldenSpinLab.mountExtra());await p.waitForTimeout(60);assert.equal(await p.locator('.sf-motion-petal').count(),5);
   await toggle();await p.waitForTimeout(300);await p.setViewportSize({width:760,height:600});await wait();
   await toggle();await p.waitForTimeout(350);const b=await ball.boundingBox();assert.ok(b);await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.mouse.move(250,300,{steps:6});await p.mouse.up();await wait();assert.equal(await ball.getAttribute('aria-expanded'),'false');
   await toggle();await p.waitForTimeout(300);await p.evaluate(()=>goldenSpinLab.settleScene());await wait();assert.equal(await ball.getAttribute('aria-expanded'),'false');
  });
  await check('focus returns to the ball; reduced motion and motion off still execute original tools',async()=>{
   await p.evaluate(()=>goldenSpinLab.controller.configure({duration:.3}));await toggle();await wait();await p.locator('.sf-motion-petal').first().focus();await p.keyboard.press('Escape');await wait();assert.equal(await ball.evaluate(n=>n===document.activeElement),true);
   for(const reduced of [true,false]){
    await p.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});await p.evaluate(reduced=>goldenSpinLab.controller.configure({motion:reduced}),reduced);
    await toggle();await p.waitForTimeout(30);assert.equal(await p.evaluate(()=>goldenSpinLab.controller.inspect().moving),false);
    const before=await p.evaluate(()=>goldenSpinLab.recorded.value.length);await p.locator('[data-motion-view$=native-saves]').click();await p.waitForTimeout(30);assert.equal(await p.evaluate(()=>goldenSpinLab.recorded.value.length),before+1);
   }
   await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>goldenSpinLab.controller.configure({motion:true}));
  });
  await check('unmount releases timers, animations, marks and observers; remount starts clean',async()=>{
   await toggle();await p.waitForTimeout(180);await p.evaluate(()=>{Object.assign(window,{retired:goldenSpinLab.controller});goldenSpinLab.unmount()});const before=await p.evaluate(()=>retired.inspect().renderCount);await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>retired.inspect().renderCount),before);assert.equal(await p.evaluate(()=>retired.inspect().dead),true);assert.equal(await p.locator('[data-golden-spin-b]').count(),0);await p.evaluate(()=>goldenSpinLab.remount());await p.waitForFunction(()=>goldenSpinLab.controller&&!goldenSpinLab.controller.inspect().dead);assert.equal(await p.locator('.sf-motion-hub').count(),1);
  });
  await check('external root removal stops an old instance before another mount can receive callbacks',async()=>{
   await toggle();await p.waitForTimeout(160);await p.evaluate(()=>{Object.assign(window,{detachedController:goldenSpinLab.controller});must(document.querySelector<HTMLElement>('.sf-motion-hub')).remove()});await p.waitForFunction(()=>detachedController.inspect().dead);const before=await p.evaluate(()=>detachedController.inspect().renderCount);await p.evaluate(()=>goldenSpinLab.remount());await p.waitForFunction(()=>goldenSpinLab.controller&&!goldenSpinLab.controller.inspect().dead);await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>detachedController.inspect().renderCount),before);assert.equal(await p.locator('.sf-motion-hub').count(),1);
  });
  await check('bounded runtime observations for the same open-close motion, not an FPS claim',async()=>{
   await p.setViewportSize({width:1280,height:900});const cdp=await p.context().newCDPSession(p);await cdp.send('Performance.enable');
   for(const engine of ['gsap','waapi'] as const){
    await p.evaluate(engine=>goldenSpinLab.controller.configure({engine,duration:.7}),engine);
    const before=(await cdp.send('Performance.getMetrics')).metrics;const count=await p.evaluate(()=>goldenSpinLab.controller.inspect().renderCount),start=Date.now();
    for(let i=0;i<4;i++){await toggle();await wait()}
    const after=(await cdp.send('Performance.getMetrics')).metrics;
    const delta=(name:string)=>must(after.find(m=>m.name===name)).value-must(before.find(m=>m.name===name)).value;
    metrics.push({engine,elapsedMs:Date.now()-start,renderCalls:await p.evaluate(()=>goldenSpinLab.controller.inspect().renderCount)-count,layoutCount:delta('LayoutCount'),styleRecalcs:delta('RecalcStyleCount'),taskSeconds:delta('TaskDuration')});
   }await cdp.detach();
  });
  await check('prototype can be switched off to restore the original Hub and enabled again',async()=>{
   await p.getByRole('button',{name:'恢复 3.0 Hub',exact:true}).click();await p.waitForFunction(()=>!document.querySelector('[data-golden-spin-b]'));assert.equal(await p.locator('.sf-motion-ball').evaluate(n=>n.style.rotate),'');await toggle();await p.waitForTimeout(650);assert.equal(await ball.getAttribute('aria-expanded'),'true');await p.getByRole('button',{name:'开启 Golden Spin B',exact:true}).click();await p.waitForFunction(()=>goldenSpinLab.controller&&!goldenSpinLab.controller.inspect().dead);assert.equal(await p.locator('[data-golden-spin-b]').count(),1);
  });
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'passed',checks,metrics,limits:['Controlled Edge/Chromium and simulated business, not physical touch or game acceptance','GSAP and WAAPI share a JS-rendered model; WAAPI is a native timing effect, not a compositor-only implementation','Experimental viewport conversion is enabled only by the opt-in Vue motion hook; attaching to an unchanged game Hub retains its native placement']},null,2));console.log(out);
 }catch(e){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({status:'failed',checks,error:e instanceof Error?e.stack:String(e),errors},null,2));if(failedPage)await failedPage.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e}
 finally{await browser.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
