import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {createEvo42Server} from '../../scripts/preview-evo42.mts';

const out='tests/artifacts/evo42/shop';fs.mkdirSync(out,{recursive:true});
const server=await createEvo42Server(0),address=server.httpServer!.address();assert.ok(address&&typeof address!=='string');
const browser=await chromium.launch(),results:unknown[]=[],errors:string[]=[];let failure:string|undefined;
try{
 for(const {width,mode,fallback} of [...[1280,390].flatMap(width=>['baseline','edge','force'].map(mode=>({width,mode,fallback:false}))),{width:390,mode:'force',fallback:true}]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  try{
   if(fallback)await page.addInitScript(()=>{HTMLElement.prototype.showPopover=function(){throw Error('controlled unsupported top layer')}});
   await page.goto('http://127.0.0.1:'+address.port+'/?scene=shop&material='+mode+'&motion=recall');
   const catalog=page.locator('[data-sf-workspace=shop]');await catalog.waitFor();
   await page.waitForFunction(()=>Reflect.get(window,'evo42').snapshot().surfaces?.some((s:{role:string})=>s.role==='shop-catalog'));
   assert.equal(await catalog.getAttribute('data-e42-material'),mode==='baseline'?null:mode);
   const item=page.locator('.clothing-name a').filter({hasText:/^示例衣物 1$/});await item.click();
   const detail=page.locator('.clothing-details');await detail.waitFor({state:'visible'});
   await page.waitForFunction(()=>Reflect.get(window,'evo42').snapshot().surfaces?.some((s:{role:string})=>s.role==='shop-detail'));
   assert.equal(await catalog.evaluate(n=>(n as HTMLElement).style.translate),'','static catalog must not create a new fixed-position containing block');
   const facts=await page.evaluate(()=>Reflect.get(window,'evo42').snapshot().shop);assert.equal(facts.selection,1);assert.equal(facts.nodesIntact,true);
   const picker=detail.getByLabel('示例配色',{exact:true});await picker.selectOption('grey');assert.equal(await picker.inputValue(),'grey');
   await page.evaluate(()=>{const samples:unknown[]=[];Reflect.set(window,'shopMotionSamples',samples);const tick=()=>{const s=Reflect.get(window,'evo42').snapshot().surfaces.find((s:{role:string})=>s.role==='shop-detail');if(s)samples.push({...s});Reflect.set(window,'shopMotionFrame',requestAnimationFrame(tick))};tick()});
   const dragHandle=detail.locator('h3').first();
   if(width===390&&mode==='force'){await detail.locator('.dgshop-detail-body').evaluate(n=>{Reflect.set(window,'shopBodyMaxHeight',(n as HTMLElement).style.maxHeight);(n as HTMLElement).style.maxHeight='100px';n.scrollTop=n.scrollHeight});assert.equal(await dragHandle.evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+Math.min(30,r.width/2),r.y+r.height/2);return hit===n||!!hit&&n.contains(hit)}),false,'controlled short body clips the title; do not drag using stale invisible coordinates');await detail.locator('.dgshop-detail-body').evaluate(n=>{(n as HTMLElement).style.maxHeight=Reflect.get(window,'shopBodyMaxHeight')});}
   await dragHandle.scrollIntoViewIfNeeded();assert.equal(await dragHandle.evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+Math.min(30,r.width/2),r.y+r.height/2);return hit===n||!!hit&&n.contains(hit)}),true,'drag begins on the actual visible title');
   const h=await dragHandle.boundingBox();assert.ok(h);await page.mouse.move(h.x+30,h.y+h.height/2);await page.mouse.down();await page.mouse.move(h.x+55,h.y+h.height/2+8,{steps:8});await page.mouse.up();
   await page.waitForFunction(()=>(()=>{const s=Reflect.get(window,'evo42').snapshot().surfaces.find((s:{role:string})=>s.role==='shop-detail');return !!s&&s.fx===0&&s.fy===0&&s.cx===0&&s.cy===0})());
   const moved=await page.evaluate(()=>{cancelAnimationFrame(Reflect.get(window,'shopMotionFrame'));return{surface:Reflect.get(window,'evo42').snapshot().surfaces.find((s:{role:string})=>s.role==='shop-detail'),samples:Reflect.get(window,'shopMotionSamples') as {cx:number;cy:number}[]}});
   assert.ok(moved.surface&&Math.hypot(moved.surface.x,moved.surface.y)>1,'actual detail surface was dragged: '+JSON.stringify({width,mode,fallback,surface:moved.surface,samples:moved.samples.slice(0,6)}));
   if(width===1280)assert.ok(Math.abs(moved.surface.y-8)<2,'wide stage does not jump vertically on the first small drag: '+JSON.stringify(moved.surface));
   if(mode==='force')assert.ok(moved.samples.some(s=>Math.hypot(s.cx,s.cy)>.1),'detail core actually responded');
   const dragged=await detail.boundingBox();assert.ok(dragged&&dragged.x>=-1&&dragged.x+dragged.width<=width+1&&dragged.y>=-1&&dragged.y+dragged.height<=901,'dragged detail remains bounded before close/reopen');
   if(width===390){assert.equal(await detail.evaluate(n=>n.matches(':popover-open')),!fallback);await picker.click();assert.equal(await picker.evaluate(n=>n.matches(':open')),true);await page.keyboard.press('Escape');await detail.waitFor({state:'visible'});await detail.getByRole('button',{name:'返回商品列表',exact:true}).click();await detail.waitFor({state:'hidden'});await page.getByRole('button',{name:'查看商品详情',exact:true}).click();await detail.waitFor({state:'visible'});}
   const r=await detail.boundingBox();assert.ok(r&&r.x>=-1&&r.x+r.width<=width+1,'detail stays within viewport');
   await detail.getByRole('button',{name:'演示购买',exact:true}).click();const purchase=await page.evaluate(()=>Reflect.get(window,'evo42').snapshot().shop);assert.equal(purchase.purchase,1);assert.equal(purchase.money,100);assert.equal(purchase.nodesIntact,true);
   if(mode!=='baseline'){await page.evaluate(()=>Reflect.get(window,'evo42').setMaterial('baseline'));await page.waitForFunction(()=>!document.querySelector('[data-e42-material]'));assert.equal(await page.evaluate(()=>Reflect.get(window,'evo42').snapshot().shop.nodesIntact),true);await page.evaluate(m=>Reflect.get(window,'evo42').setMaterial(m),mode);await page.waitForFunction(()=>!!document.querySelector('.clothing-details[data-e42-material]'));}
   await page.screenshot({path:out+'/'+mode+'-'+width+(fallback?'-fallback':'')+'.png'});
   await page.evaluate(()=>Reflect.get(window,'evo42').close());await page.waitForFunction(()=>!document.querySelector('[data-e42-material],.dgshop-host,.dgshop-detail-backdrop'));
   await page.evaluate(()=>Reflect.get(window,'evo42').openSettings());await page.locator('#dol-midnight-controls[open]').waitFor();await page.locator('.dmt-close').click();await page.locator('#dol-midnight-controls').waitFor({state:'hidden'});
   await page.evaluate(()=>Reflect.get(window,'evo42').openShop());await page.locator('.clothing-name a').filter({hasText:/^示例衣物 1$/}).click();await detail.waitFor({state:'visible'});
   await detail.locator('h3').first().scrollIntoViewIfNeeded();await page.waitForFunction(()=>Reflect.get(window,'evo42').snapshot().surfaces.some((s:{role:string})=>s.role==='shop-detail'));const active=await detail.locator('h3').first().boundingBox();assert.ok(active);await page.mouse.move(active.x+24,active.y+12);await page.mouse.down();await page.mouse.move(active.x+36,active.y+16);assert.equal(await page.evaluate(()=>Reflect.get(window,'evo42').snapshot().surfaces.find((s:{role:string})=>s.role==='shop-detail')?.dragging),true,'cross-window retirement starts during actual owned input');await page.evaluate(()=>Reflect.get(window,'evo42').openSettings());await page.mouse.up();await page.locator('#dol-midnight-controls[open]').waitFor();assert.equal(await page.locator('[data-e42-role^=shop]').count(),0,'active shop input retires on cross-window switch');await page.evaluate(()=>Reflect.get(window,'evo42').dispose());assert.equal(await page.locator('[data-e42-material],.e42-material-light,.dgshop-detail-backdrop,.sf-motion-hub').count(),0);
   results.push({width,mode,fallback,status:'PASS',detailRect:r,draggedRect:dragged,motion:{x:moved.surface.x,y:moved.surface.y,maxCore:Math.max(...moved.samples.map(s=>Math.hypot(s.cx,s.cy)))}});
  }catch(e){await page.screenshot({path:out+'/failure-'+mode+'-'+width+(fallback?'-fallback':'')+'.png'}).catch(()=>{});results.push({width,mode,fallback,status:'FAIL',snapshot:await page.evaluate(()=>Reflect.get(window,'evo42')?.snapshot()).catch(()=>null)});throw e}finally{await context.close()}
 }
 for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:out+'/video',size:{width,height:900}}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+address.port+'/?scene=shop&material=force&motion=recall');await page.locator('.clothing-name a').first().click();const detail=page.locator('.clothing-details');await detail.waitFor({state:'visible'});await page.waitForTimeout(650);
  const heading=detail.locator('h3').first();await heading.scrollIntoViewIfNeeded();const r=await heading.boundingBox();assert.ok(r);await page.mouse.move(r.x+30,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+50,r.y+r.height/2+8,{steps:10});await page.mouse.up();await page.waitForTimeout(650);await detail.getByLabel('示例配色',{exact:true}).selectOption('grey');await page.waitForTimeout(650);
  const video=page.video()!;await context.close();await video.saveAs(out+'/shop-'+width+'.webm');
 }
 assert.deepEqual(errors,[]);
}catch(e){failure=String(e);throw e}
finally{
 const files=['prototypes/evolution42/shop-check.mts','prototypes/evolution42/shop-fixture.ts','prototypes/evolution42/material.ts','prototypes/evolution42/main.ts','prototypes/evolution42/style.css'];
 fs.writeFileSync(out+'/result.json',JSON.stringify({status:failure?'FAIL':'PASS',sourceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),node:process.version,browser:browser.version(),results,errors,failure,inputs:files.filter(f=>fs.existsSync(f)).map(file=>({file,sha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex')}))},null,2));await browser.close();await server.close();
}
console.log('PASS EVO42 shop: six width/material roles plus controlled top-layer fallback, original nodes/actions, native picker/top-layer detail, close/reopen/cross-window retirement.');
