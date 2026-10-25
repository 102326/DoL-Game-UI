// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"named","caseSource":"check"}
import cases = require('../scripts/ci-cases.cjs');
const {runCase}=cases;
// Controlled lifecycle probes for the real MotionHub fixture; no game/save access.
import fs = require('node:fs');
import path = require('node:path');
import assert = require('node:assert/strict');
import cp = require('node:child_process');
import crypto = require('node:crypto');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {sphereHub} from '../src/ui/golden-spin/hub-motion';
const {chromium}=playwright;
type HubState=ReturnType<ReturnType<typeof sphereHub>['inspect']>;
declare const goldenSpinLab:{controller:ReturnType<typeof sphereHub>;settleScene():void;recorded:{value:unknown[]}};
function must<T>(value:T|null|undefined):T{if(value===null||value===undefined)throw Error('Missing Hub lifecycle value');return value}

(async()=>{
 const baseline=process.argv.includes('--baseline'),revision='21509a89b20f43bec4798b370f31fc6c63d59b69',out=path.resolve('tests/artifacts/golden-spin-b/hub-validation-lifecycle-'+Date.now());fs.mkdirSync(out,{recursive:true});
 const frozen:Record<string,string>=baseline?Object.fromEntries(['hub-motion.ts','sphere.ts'].map(f=>[f,cp.execFileSync('git',['show',revision+':prototypes/golden-spin-b/'+f],{encoding:'utf8'})])):{};
 const {createServer}=await import('vite'),server=await createServer({configFile:path.resolve('vite.golden-spin.config.ts'),plugins:baseline?[{name:'frozen-hub-lifecycle',enforce:'pre' as const,load(id:string){const name=id.replaceAll('\\','/').split('/').pop();return name?frozen[name]:undefined}}]:[],server:{port:5186,strictPort:true}});await server.listen();
 const browser=await chromium.launch(browserOptions),results:Array<{name:string;status:'PASS'|'FAIL';state:HubState|null;errors:string[];error?:string}>=[];let p:playwright.Page;
 const frames=()=>p.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())))),state=()=>p.evaluate(()=>goldenSpinLab.controller.inspect());
 const check=async(name:string,fn:()=>Promise<void>)=>{const errors:string[]=[];p=await browser.newPage({viewport:{width:1280,height:900}});p.on('pageerror',e=>errors.push(e.message));try{await p.goto('http://127.0.0.1:5186/hub.html');await p.waitForFunction(()=>typeof goldenSpinLab!=='undefined'&&!!goldenSpinLab.controller);await runCase(name,fn);assert.deepEqual(errors,[]);results.push({name,status:'PASS',state:await state(),errors});console.log('PASS',name)}catch(e){const error=e instanceof Error?e:new Error(String(e));await p.screenshot({path:path.join(out,'failure-'+results.length+'.png')}).catch(()=>{});results.push({name,status:'FAIL',error:error.stack,state:await state().catch(()=>null),errors});console.log('FAIL',name,error.message)}finally{await p.close()}};
 try{
 await check('H3 release over native ball clears the pressed tool without replay',async()=>{
  await p.locator('.sf-motion-ball').click();await p.waitForFunction(()=>{const s=goldenSpinLab.controller.inspect();return s.q>.7&&s.q<.95});const t=must(await p.locator('.sf-motion-petal').first().boundingBox());await p.mouse.move(t.x+t.width/2,t.y+t.height/2);await p.mouse.down();assert.equal((await state()).pressed,true);const b=must(await p.locator('.sf-motion-ball').boundingBox());await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.up();await p.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='open',null,{timeout:2000});assert.equal((await state()).pressed,false);assert.equal(await p.evaluate(()=>goldenSpinLab.recorded.value.length),0);
 });
 await check('H4 hidden scene replacement freezes both new clocks until visible',async()=>{
  await p.locator('.sf-motion-ball').click();await p.waitForFunction(()=>goldenSpinLab.controller.inspect().q>.7);await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));goldenSpinLab.settleScene()});await frames();const before=await state();await p.waitForTimeout(180);const after=await state();assert.equal(after.q,before.q,'hidden replacement menu clock');for(const key of ['speed','energy','charge','pressure','angle','draws'] as const)assert.equal(after.sphere[key],before.sphere[key],'hidden replacement sphere '+key);assert.equal(after.sphere.running,false);await p.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'))});await p.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='closed');
 });
 await check('H4 zero-root scene replacement retains finite geometry and restores native input',async()=>{
  await p.locator('.sf-motion-ball').click();await p.waitForFunction(()=>goldenSpinLab.controller.inspect().q>.7);await p.evaluate(()=>document.body.classList.add('ui-open'));await frames();assert.equal(await p.locator('.sf-motion-hub').evaluate(n=>n.getBoundingClientRect().width),0);await p.evaluate(()=>{goldenSpinLab.settleScene();goldenSpinLab.controller.relayout()});await frames();const before=await state();await p.waitForTimeout(150);const after=await state();assert.equal(after.q,before.q);assert.equal(after.sphere.draws,before.sphere.draws);assert.equal(after.sphere.speed,before.sphere.speed);assert.ok(await p.locator('.sf-motion-petal').evaluateAll(nodes=>nodes.every(n=>!/(NaN|Infinity)/.test(n.style.transform))));await p.evaluate(()=>document.body.classList.remove('ui-open'));await p.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='closed');await p.locator('.sf-motion-ball').click();await p.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='open');await p.locator('.sf-motion-petal').first().click();await p.waitForFunction(()=>goldenSpinLab.recorded.value.length===1);
 });
 const files=['src/ui/golden-spin/hub-motion.ts','src/ui/golden-spin/sphere.ts','src/ui/golden-spin/hub.css','prototypes/golden-spin-b/hub-motion.ts','prototypes/golden-spin-b/sphere.ts','framework/motion-hub/MotionHub.vue','tests/golden-spin-hub-lifecycle.cjs'];const identity={head:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline:baseline?revision:null,workingTree:!baseline,runtime:{node:process.version,platform:process.platform,chromium:browser.version()},hashes:Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(baseline&&frozen[path.basename(f)]?must(frozen[path.basename(f)]):fs.readFileSync(f)).digest('hex')]))};fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({identity,results},null,2));console.log('Evidence',out);assert.ok(results.every(r=>r.status==='PASS'),'lifecycle checks failed');
 }finally{await browser.close();await server.close()}
})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});
