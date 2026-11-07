import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {createEvo42Server} from '../../scripts/preview-evo42.mts';
const out=`tests/artifacts/rigid-spin/${Date.now()}`;fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync('prototypes/evolution-hub-free').filter(f=>/\.(ts|mts|vue|css|html)$/.test(f)).map(f=>'prototypes/evolution-hub-free/'+f).concat('dist/framework/official-ui/style.css');
const hash=(f:string)=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),inputs=Object.fromEntries(files.map(f=>[f,hash(f)]));
const server=await createEvo42Server(0),a=server.httpServer!.address();assert(a&&typeof a==='object');
const browser=await chromium.launch(),errors:string[]=[],rows:unknown[]=[];let status='FAIL',failure:unknown;
try{for(const width of [1280,390]){
 const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:out,size:{width,height:900}}}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(`http://127.0.0.1:${a.port}/prototypes/evolution-hub-free/index.html?variant=free`);const ball=p.locator('.sf-motion-ball');await p.locator('.rigid-spin-body').waitFor({state:'attached'});
 const accepted=p.locator('.spin-hub-canvas:not(.rigid-spin-body)');assert.equal(await accepted.evaluate(n=>getComputedStyle(n).visibility),'visible');
 const beforeOpen=await accepted.evaluate(n=>(n as HTMLCanvasElement).toDataURL());await ball.click();await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-spin-ball')==='release');
 assert.equal(await accepted.evaluate(n=>getComputedStyle(n).visibility),'visible');assert.equal(await p.locator('.rigid-spin-body').evaluate(n=>getComputedStyle(n).visibility),'hidden');assert.notEqual(await accepted.evaluate(n=>(n as HTMLCanvasElement).toDataURL()),beforeOpen);
 await p.screenshot({path:out+`/${width}-accepted-open.png`});await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-spin-ball')==='idle');await ball.press('Escape');
 await p.waitForTimeout(400);const r=await ball.boundingBox();assert(r);await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.mouse.move(2,500,{steps:20});
 await p.waitForFunction(()=>Number(document.querySelector('.sf-motion-hub')?.getAttribute('data-edge-charge'))>=.999);
 const reads=()=>p.evaluate(()=>Reflect.get(document.querySelector('.sf-motion-hub')!,'rigidResearchState'));
 const charged=await reads();await p.waitForTimeout(160);assert((await reads()).draws>charged.draws,'fully charged sphere keeps spinning');
 const pose=await p.locator('.rigid-spin-body').evaluate(n=>{const r=n.getBoundingClientRect();return{w:r.width,h:r.height,scale:getComputedStyle(n).scale}});assert(Math.abs(pose.w-pose.h)<.01);assert(Math.abs(pose.w-175)<.01);assert.equal(pose.scale,'none');
 await p.screenshot({path:out+`/${width}-charge.png`});await p.mouse.move(2,550,{steps:6});await p.mouse.up();
 const samples=await p.evaluate(async()=>{const rows=[];for(let i=0;i<700;i++){await new Promise(requestAnimationFrame);const h=document.querySelector('.sf-motion-hub')!,s=Reflect.get(h,'edgeResearchState'),v=Reflect.get(h,'rigidResearchState'),r=h.querySelector('.rigid-spin-body')!.getBoundingClientRect();rows.push({phase:s.phase,speed:Math.hypot(s.vx,s.vy),bounces:s.bounces,trail:v.trail,w:r.width,h:r.height,x:s.point.x,y:s.point.y});if(s.phase==='idle')break}return rows});
 assert(samples.some(s=>s.speed>2500));assert(samples.some(s=>s.bounces>=2));assert(samples.some(s=>s.trail>2));assert(samples.every(s=>Math.abs(s.w-s.h)<.01&&Math.abs(s.w-175)<.01&&Number.isFinite(s.x)&&Number.isFinite(s.y)));assert.equal(samples.at(-1)!.phase,'idle');
 await p.waitForFunction(()=>{const v=Reflect.get(document.querySelector('.sf-motion-hub')!,'rigidResearchState');return !v.pending&&v.trail===0&&v.hits===0});const resting=await reads();await p.waitForTimeout(150);assert.equal((await reads()).draws,resting.draws,'resting renderer sleeps');
 await ball.click();await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-spin-phase')==='open');await p.screenshot({path:out+`/${width}-menu.png`});
 await p.getByRole('button',{name:'停靠侧边',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.sf-motion-ball')?.classList.contains('is-docked'));assert.equal(await p.locator('.spin-hub-canvas:not(.rigid-spin-body)').evaluate(n=>getComputedStyle(n).visibility),'visible');
 await ball.click();await ball.hover();await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));await p.waitForFunction(()=>!Reflect.get(document.querySelector('.sf-motion-hub')!,'rigidResearchState').pending);const reduced=await reads();await p.waitForTimeout(160);assert.equal((await reads()).draws,reduced.draws,'reduced mode stays still');
 const video=p.video()!;rows.push({width,status:'PASS',frames:samples.length,bounces:Math.max(...samples.map(s=>s.bounces)),peakSpeed:Math.max(...samples.map(s=>s.speed)),pose,scope:'charge rotation, rigid silhouette, gold trail data, sustained ricochet, decay, idle sleep, menu, dock visibility and reduced motion'});
 await p.evaluate(()=>Reflect.get(window,'hubFreePreview').dispose());assert.equal(await p.locator('.rigid-spin-body,.rigid-spin-field').count(),0);await context.close();await video.saveAs(`${out}/${width}-rigid-spin.webm`);
 }
 const failurePage=await browser.newPage();await failurePage.goto(`http://127.0.0.1:${a.port}/prototypes/evolution-hub-free/index.html?variant=direct`);
 const rollback=await failurePage.evaluate(async()=>{
  const {rigidSpin}=await import('/prototypes/evolution-hub-free/rigid-spin.ts');const root=document.createElement('div');root.innerHTML='<button class="sf-motion-ball"></button>';document.body.append(root);
  const MO=window.MutationObserver,RO=window.ResizeObserver;let active=0,threw=false;
  window.MutationObserver=class extends MO{live=true;constructor(cb:MutationCallback){super(cb);active++}disconnect(){super.disconnect();if(this.live){this.live=false;active--}}};
  window.ResizeObserver=class{constructor(){throw Error('controlled initialization failure')}} as unknown as typeof ResizeObserver;
  try{rigidSpin(root)}catch{threw=true}finally{window.MutationObserver=MO;window.ResizeObserver=RO}
  const result={threw,active,canvases:root.querySelectorAll('canvas').length,marked:root.hasAttribute('data-rigid-spin')};root.remove();return result;
 });assert.deepEqual(rollback,{threw:true,active:0,canvases:0,marked:false});await failurePage.close();rows.push({constructionRollback:rollback});
 assert.deepEqual(errors,[]);for(const file of files)assert.equal(hash(file),inputs[file],file+' changed during check');status='PASS';console.log(JSON.stringify(rows));
}catch(e){failure=String(e);throw e}finally{fs.writeFileSync(out+'/result.json',JSON.stringify({status,failure,node:process.version,browser:browser.version(),inputs,rows,errors,limits:'Controlled macOS Chromium only; recordings require owner visual review.'},null,2));console.log(out);await browser.close();await server.close()}
