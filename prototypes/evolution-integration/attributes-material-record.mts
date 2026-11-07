import {createEvo42Server} from '../../scripts/preview-evo42.mts';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const output=`tests/artifacts/ui42/attributes-material/comparison-${Date.now()}`;fs.mkdirSync(output,{recursive:true});
const server=await createEvo42Server(0),address=server.httpServer!.address();assert(address&&typeof address!=='string');const browser=await chromium.launch(),errors:string[]=[];
try{
 for(const width of [1280,390])for(const variant of ['baseline','study']){
  const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:output,size:{width,height:900}}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${address.port}/prototypes/evolution-integration/attributes-material.html?variant=${variant}`);await page.locator('.dgc-navigation').waitFor();
  await page.waitForTimeout(600);await page.locator('#weather').selectOption('rain');await page.waitForTimeout(1200);
  const r=await page.locator('#customOverlayTitle').boundingBox();assert(r);const x=r.x+r.width*.4,y=r.y+r.height*.5;
  await page.mouse.move(x,y);await page.mouse.down();for(let i=1;i<=18;i++){await page.mouse.move(x+i*2,y+i*.7);await page.waitForTimeout(20)}if(variant==='study')await page.screenshot({path:`${output}/${width}-drag.png`});await page.mouse.up();await page.waitForTimeout(1200);
  await page.getByRole('button',{name:'学业',exact:true}).click();await page.waitForTimeout(1000);await page.locator('#weather').selectOption('snow');await page.waitForTimeout(2200);
  await page.locator('#close').click();await page.waitForTimeout(500);await page.locator('#open').click();await page.waitForTimeout(1000);
  const video=page.video();await context.close();assert(video);await video.saveAs(`${output}/${width}-${variant}.webm`);
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync('tests/artifacts/ui42/attributes-material/comparison-latest.json',JSON.stringify({output,viewportHeights:900,widths:[1280,390],playbackRate:1,sequence:'rain, title drag, settle, section navigation, snow, close/reopen',note:'Independent recordings of the same operation script; startup timing and browser frame pacing are not synchronized.'},null,2));
 console.log(output);
}finally{await browser.close();await server.close()}
