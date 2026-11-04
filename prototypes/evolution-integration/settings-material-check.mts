import {createEvo42Server} from '../../scripts/preview-evo42.mts';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const server=await createEvo42Server(0),address=server.httpServer!.address();assert(address&&typeof address!=='string');
const browser=await chromium.launch(),errors:string[]=[];
const output='tests/artifacts/ui42/settings-material';fs.mkdirSync(output,{recursive:true});
try{
 for(const width of [1280,390])for(const reduced of [false,true]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:reduced?'reduce':'no-preference'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${address.port}/prototypes/evolution-integration/settings-material.html`);
  const dialog=page.locator('#dol-midnight-controls'),shell=dialog.locator('[data-dgu-settings-material]'),header=dialog.locator('.dmt-settings-header');await shell.waitFor();
  await page.waitForTimeout(350);
  const r=await header.boundingBox();assert(r);const x=r.x+r.width*.4,y=r.y+r.height*.5;
  await page.mouse.move(x,y);await page.mouse.down();
  await page.evaluate(()=>{document.body.dataset.dragMoves='0';document.addEventListener('pointermove',()=>{document.body.dataset.dragMoves=String(Number(document.body.dataset.dragMoves)+1)})});
  await page.mouse.move(x+25,y+15,{steps:6});await page.waitForTimeout(30);
  assert.equal(await page.locator('body').getAttribute('data-drag-moves'),'0','drag must not reach delegated game gestures');
  const scale=await shell.evaluate(e=>(e as HTMLElement).style.scale);assert.equal(/^1(?: 1)?$/.test(scale),reduced,'motion preference governs strain');
  await page.mouse.up();await page.waitForTimeout(1800);
  assert.match(await shell.evaluate(e=>(e as HTMLElement).style.scale),/^1(?: 1)?$/);
  const stable=await shell.getAttribute('style');await page.waitForTimeout(200);assert.equal(await shell.getAttribute('style'),stable,'no idle style animation');
  if(width===1280&&!reduced){
   await page.evaluate(()=>{document.body.style.zoom='.8';window.dispatchEvent(new Event('resize'))});
   const zoomed=await header.boundingBox();assert(zoomed);await page.mouse.move(zoomed.x+120,zoomed.y+30);await page.mouse.down();await page.mouse.move(zoomed.x+160,zoomed.y+30,{steps:6});
   const shifted=await header.boundingBox();assert(shifted);assert.ok(shifted.x>zoomed.x+25,'drag follows screen coordinates through CSS zoom');
   await header.dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();
   await page.evaluate(()=>{document.body.style.zoom='';window.dispatchEvent(new Event('resize'))});
   assert.match(await shell.evaluate(e=>(e as HTMLElement).style.translate),/^0px(?: 0px)?$/);
  }
  await dialog.getByRole('button',{name:'材质',exact:true}).click();
  const glass=dialog.getByRole('checkbox',{name:'玻璃模糊',exact:true});await glass.uncheck();assert.equal(await shell.evaluate(e=>getComputedStyle(e).backdropFilter),'none');await glass.check();
  const axis=dialog.getByLabel('Acrylic 通透度',{exact:true});await axis.fill('0');const dark=await shell.evaluate(e=>getComputedStyle(e).backgroundColor);await axis.fill('60');assert.notEqual(await shell.evaluate(e=>getComputedStyle(e).backgroundColor),dark);
  const motion=dialog.getByRole('checkbox',{name:'交互与进入动画',exact:true});await motion.uncheck();
  const r2=await header.boundingBox();assert(r2);await page.mouse.move(r2.x+100,r2.y+30);await page.mouse.down();await page.mouse.move(r2.x+120,r2.y+40,{steps:5});assert.match(await shell.evaluate(e=>(e as HTMLElement).style.scale),/^1(?: 1)?$/);await page.mouse.up();
  await dialog.locator('.dmt-close').click();await dialog.waitFor({state:'hidden'});assert.match(await shell.evaluate(e=>(e as HTMLElement).style.translate),/^0px(?: 0px)?$/);
  await page.locator('#open').click();await dialog.waitFor({state:'visible'});await motion.check();
  await page.screenshot({path:`${output}/${width}-${reduced?'reduced':'motion'}.png`});
  await page.evaluate('window.DoLMidnightTheme.destroy()');assert.equal(await page.locator('#dol-midnight-controls').count(),0);
  await context.close();console.log(width,reduced?'reduced':'motion','PASS');
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();await server.close()}
