// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"named","caseSource":"check"}
import cases = require('../scripts/ci-cases.cjs');
const {runCase}=cases;
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import cp = require('node:child_process');
import playwright = require('playwright');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {sphereHub} from '../src/ui/golden-spin/hub-motion';
const {chromium}=playwright,{execFileSync}=cp;
type HubState=ReturnType<ReturnType<typeof sphereHub>['inspect']>;
declare const goldenSpinLab:{controller:ReturnType<typeof sphereHub>;recorded:{value:string[]};setZoom(value:number):void;settleScene():void;unmount():void};
declare let nativeToolClicks:number;
declare const originalTool:Element;
declare const retired:ReturnType<typeof sphereHub>;
declare let hiddenBefore:PropertyDescriptor|undefined;
function must<T>(value:T|null|undefined):T{if(value===null||value===undefined)throw Error('Missing Hub input value');return value}
const reverseModule:unknown=require('./hub-reversal-probe.cjs');if(typeof reverseModule!=='function')throw Error('Missing Hub reversal probe');
const reverseHub=async(page:playwright.Page)=>{const value:unknown=await reverseModule(page);if(!value||typeof value!=='object'||!('before' in value)||!('after' in value)||!value.before||!value.after||typeof value.before!=='object'||typeof value.after!=='object'||!('q' in value.before)||typeof value.before.q!=='number'||!('q' in value.after)||typeof value.after.q!=='number'||!('sphere' in value.before)||!value.before.sphere||typeof value.before.sphere!=='object'||!('angle' in value.before.sphere)||typeof value.before.sphere.angle!=='number'||!('sphere' in value.after)||!value.after.sphere||typeof value.after.sphere!=='object'||!('angle' in value.after.sphere)||typeof value.after.sphere.angle!=='number')throw Error('Invalid Hub reversal sample');return{before:{q:value.before.q,sphere:{angle:value.before.sphere.angle}},after:{q:value.after.q,sphere:{angle:value.after.sphere.angle}}}};

const baseline=process.argv.includes('--baseline'),revision='5a656c602cdf5d9bf569ba9364ee46f5475e5c66';
(async()=>{
 const out=path.resolve('tests/artifacts/golden-spin-b/hub-validation-input-'+Date.now());fs.mkdirSync(out,{recursive:true});
 const {createServer}=await import('vite');
 const old=baseline?execFileSync('git',['show',revision+':prototypes/golden-spin-b/hub-motion.ts'],{encoding:'utf8'}):null;
 const server=await createServer({configFile:path.resolve('vite.golden-spin.config.ts'),plugins:baseline?[{name:'frozen-hub-input-baseline',enforce:'pre',load(id){if(id.replaceAll('\\','/').endsWith('/prototypes/golden-spin-b/hub-motion.ts'))return old}}]:[],server:{port:5184,strictPort:true}});await server.listen();
 const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
 type PointerEvidence={before:{x:number;y:number;pointer:string;tab:number;hit:boolean};press:HubState;held:HubState;after:HubState;native:number;calls:string[];sameNode:boolean};
 const evidence:{baseline:boolean;revision:string;checks:string[];errors:string[];pointer?:PointerEvidence;reversal?:Awaited<ReturnType<typeof reverseHub>>;failure?:string;state?:HubState|null}={baseline,revision:baseline?revision:'working tree',checks:[],errors:[]};let p:playwright.Page|undefined;
 const check=async(name:string,fn:()=>Promise<void>)=>{await runCase(name,fn);evidence.checks.push(name);console.log('PASS',name)};
 try{
  p=await browser.newPage({viewport:{width:1280,height:900},hasTouch:true});const page=p;page.on('pageerror',e=>evidence.errors.push(e.message));
  await page.goto('http://127.0.0.1:5184/hub.html');await page.waitForFunction(()=>typeof goldenSpinLab!=='undefined'&&goldenSpinLab.controller);
  const ball=page.locator('.sf-motion-ball'),nav=page.locator('.sf-motion-orbit'),tool=page.locator('[data-motion-view$="interface-settings"]');
  const inspect=()=>page.evaluate(()=>goldenSpinLab.controller.inspect()),open=()=>page.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='open'),closed=()=>page.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='closed');
  const mid=()=>page.waitForFunction(()=>{const s=goldenSpinLab.controller.inspect();return s.moving&&s.q>.68&&s.q<.96});
  const keyboardTool=async()=>{await ball.focus();for(let i=0;i<10;i++){await page.keyboard.press('Shift+Tab');if(await tool.evaluate(n=>n===document.activeElement))return}throw Error('native keyboard traversal did not reach the tool')};
  await check('H3 visible moving tool accepts a real pointer once without moving beneath the press',async()=>{
   await tool.evaluate(n=>{Object.assign(window,{originalTool:n,nativeToolClicks:0});n.addEventListener('click',()=>nativeToolClicks++)});
   await ball.click();await mid();
   const before=await tool.evaluate(n=>{const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,pointer:getComputedStyle(n).pointerEvents,tab:n.tabIndex,hit:n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}});
   await page.mouse.move(before.x,before.y);await page.mouse.down();const press=await inspect();await page.waitForTimeout(100);const held=await inspect();await page.mouse.up();await page.waitForTimeout(250);
   evidence.pointer={before,press,held,after:await inspect(),native:await page.evaluate(()=>nativeToolClicks),calls:await page.evaluate(()=>goldenSpinLab.recorded.value.slice()),sameNode:await tool.evaluate(n=>n===originalTool)};
   fs.writeFileSync(path.join(out,'pointer.json'),JSON.stringify(evidence.pointer,null,2));
   assert.ok(before.hit&&before.pointer!=='none'&&before.tab===0,'visible tools must not be locked until the whole animation ends');
   assert.ok(Math.abs(held.q-press.q)<.015,'hold the current pose during the pointer transaction');
   assert.equal(evidence.pointer.native,1);assert.deepEqual(evidence.pointer.calls,['interface-settings']);assert.ok(evidence.pointer.sameNode);
   await closed();assert.equal(await page.locator('.sf-motion-sheet').getAttribute('aria-hidden'),'false');
   assert.ok(await page.locator('.sf-motion-sheet h2').evaluate(n=>n===document.activeElement));await page.screenshot({path:path.join(out,'pointer-tool-open.png')});
  });
  await check('H3 keyboard activation and cancel during opening retain native focus and single activation',async()=>{
   await page.getByRole('button',{name:'返回工具',exact:true}).click();await mid();await keyboardTool();const before=await inspect();await page.waitForTimeout(100);assert.ok(Math.abs((await inspect()).q-before.q)<.015);
   await tool.press('Enter');await closed();assert.equal(await page.evaluate(()=>nativeToolClicks),2);assert.equal(await page.evaluate(()=>goldenSpinLab.recorded.value.length),2);
   await page.getByRole('button',{name:'返回工具',exact:true}).click();await mid();await keyboardTool();await tool.press('Escape');await closed();assert.ok(await ball.evaluate(n=>n===document.activeElement));assert.equal(await nav.getAttribute('inert'),'');
  });
  await check('H3 releasing a pointer outside cancels activation and resumes instead of pinning pointer focus',async()=>{
   const prior=await page.evaluate(()=>nativeToolClicks);await ball.click();await mid();const r=must(await tool.boundingBox());await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();assert.equal((await inspect()).pressed,true);
   await page.mouse.move(700,240);await page.mouse.up();await open();assert.equal(await page.evaluate(()=>nativeToolClicks),prior);assert.equal((await inspect()).paused,false);await ball.press('Escape');await closed();
  });
  await check('H1 H2 opening and closing reverse continuously, keep native terminal layout and settle resources',async()=>{
   await ball.click();evidence.reversal=await reverseHub(page);assert.ok(Math.abs(evidence.reversal.before.q-evidence.reversal.after.q)<.015);assert.ok(Math.abs(evidence.reversal.before.sphere.angle-evidence.reversal.after.sphere.angle)<.015);
   await page.waitForTimeout(100);await ball.click();await open();
   for(const n of await page.locator('.sf-motion-petal').all())assert.equal(await n.evaluate(n=>n.style.transform),'none');
   await ball.click();await closed();await page.waitForFunction(()=>!goldenSpinLab.controller.inspect().sphere.running);
   const settled=await inspect();await page.waitForTimeout(120);assert.equal((await inspect()).sphere.draws,settled.sphere.draws);
  });
  await check('H3 H4 drag during opening closes safely, then dock and restore work during the next opening',async()=>{
   await ball.click();await mid();const r=must(await ball.boundingBox());await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(4,r.y+70,{steps:6});await page.mouse.up();await closed();
   assert.ok(await ball.evaluate(n=>n.classList.contains('is-docked')));await ball.click();assert.ok(await ball.evaluate(n=>!n.classList.contains('is-docked')));
   await ball.click();await page.waitForFunction(()=>{const s=goldenSpinLab.controller.inspect();return s.moving&&s.q>.9});
   const dock=page.getByRole('button',{name:'停靠侧边',exact:true});const b=must(await dock.boundingBox());await page.mouse.click(b.x+b.width/2,b.y+b.height/2);await closed();assert.ok(await ball.evaluate(n=>n.classList.contains('is-docked')));await ball.click();
  });
  await check('H4 narrow touch and zoom preserve targets; active reduced/disabled motion settles immediately',async()=>{
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);await ball.tap();await mid();const touchTarget=must(await tool.boundingBox()),prior=await page.evaluate(()=>nativeToolClicks);await page.touchscreen.tap(touchTarget.x+touchTarget.width/2,touchTarget.y+touchTarget.height/2);await closed();assert.equal(await page.evaluate(()=>nativeToolClicks),prior+1);await page.getByRole('button',{name:'返回工具',exact:true}).click();await open();const r=must(await nav.boundingBox());assert.ok(r.x>=0&&r.x+r.width<=390);await page.screenshot({path:path.join(out,'narrow.png')});await ball.press('Escape');await closed();
   await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>goldenSpinLab.setZoom(125));await page.waitForTimeout(100);await ball.click();await mid();await page.emulateMedia({reducedMotion:'reduce'});await open();assert.equal((await inspect()).moving,false);assert.equal((await inspect()).sphere.running,false);await ball.press('Escape');await closed();await page.emulateMedia({reducedMotion:'no-preference'});
   await ball.click();await mid();await page.evaluate(()=>document.documentElement.removeAttribute('data-dgu-visualMotion'));await open();assert.equal((await inspect()).sphere.running,false);await ball.press('Escape');await closed();await page.evaluate(()=>document.documentElement.setAttribute('data-dgu-visualMotion',''));await page.evaluate(()=>goldenSpinLab.setZoom(100));
  });
  await check('H4 hidden view pauses both layers and resumes the latest intent',async()=>{
   await ball.click();await mid();await page.evaluate(()=>{hiddenBefore=Object.getOwnPropertyDescriptor(document,'hidden');Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
   const before=await inspect();await page.waitForTimeout(120);const hidden=await inspect();assert.equal(hidden.q,before.q);assert.equal(hidden.sphere.angle,before.sphere.angle);assert.equal(hidden.sphere.running,false);
   await page.evaluate(()=>{if(hiddenBefore)Object.defineProperty(document,'hidden',hiddenBefore);else Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'))});await open();await ball.press('Escape');await closed();
  });
  await check('H4 scene exit, owner teardown and re-mount cannot replay activation or retain callbacks',async()=>{
   await ball.click();await mid();await page.evaluate(()=>goldenSpinLab.settleScene());await closed();
   await ball.click();await mid();await keyboardTool();await page.evaluate(()=>{Object.assign(window,{retired:goldenSpinLab.controller});goldenSpinLab.unmount()});
   const before=await page.evaluate(()=>retired.inspect());await page.setViewportSize({width:900,height:700});await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);const after=await page.evaluate(()=>retired.inspect());
   assert.ok(after.dead&&!after.moving&&after.sphere.dead&&!after.sphere.running);assert.equal(after.renders,before.renders);assert.equal(await page.locator('.spin-hub-canvas').count(),0);
   await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'重新挂载',exact:true}).click();await page.waitForSelector('.spin-hub-canvas');assert.equal(await page.locator('.spin-hub-canvas').count(),1);await ball.click();await open();
  });
  assert.deepEqual(evidence.errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(evidence,null,2));console.log('Evidence',out);
 }catch(e){evidence.failure=e instanceof Error?e.stack:String(e);evidence.state=p?await p.evaluate(()=>typeof goldenSpinLab==='undefined'?null:goldenSpinLab.controller.inspect()).catch(()=>null):null;if(p)await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(evidence,null,2));console.error('Evidence',out);throw e}
 finally{await browser.close();await server.close()}
})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});
