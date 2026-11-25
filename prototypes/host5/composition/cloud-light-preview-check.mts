// Verify the delivered offline page, including controls outside an open modal.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const [preview,capture]=process.argv.slice(2);
assert.ok(preview,'Pass the generated neutral HTML');
const browser=await chromium.launch({channel:'chrome'});
try {
 const page=await browser.newPage({viewport:{width:1120,height:800}});
 page.setDefaultTimeout(7000);
 await page.goto(pathToFileURL(resolve(preview)).href);
 const demo=page.frameLocator('iframe');
 const workspace=demo.locator('#customOverlay');
 const shell=demo.locator('.dmt-settings-shell');
 const settings=demo.locator('#dol-midnight-controls');
 const modes=['base','light','still','solid'] as const;
 for(const region of [workspace,shell]){
  if(region===shell) await demo.locator('#dol-midnight-sidebar-button').click();
  for(const mode of modes){
   await page.locator('[data-mode="'+mode+'"]').click();
   const texture=region.locator('.sf-cloud-texture');
   if(mode==='solid'){
    await texture.waitFor({state:'detached'});
    assert.equal(await region.evaluate(el=>getComputedStyle(el).backdropFilter),'none');
    continue;
   }
   await texture.waitFor({state:'attached'});
   const expectedMoving=mode!=='still';
   await texture.evaluate(async(el,wantsMotion)=>{
    for(let i=0;i<120;i++){
     if(el.getAnimations().some(a=>a.playState==='running')===wantsMotion)return;
     await new Promise<void>(done=>requestAnimationFrame(()=>done()));
    }
    throw Error('Cloud motion did not reach selected quality');
   },expectedMoving);
   const paint=await texture.evaluate(el=>getComputedStyle(el,'::after').maskImage);
   assert.equal(paint.startsWith('url('),mode!=='base');
   if(mode==='light'&&capture) await page.screenshot({path:resolve(capture,region===shell?'settings.png':'workspace.png')});
   if(region===workspace) await demo.locator('#action').click();
  }
  await page.locator('[data-mode="light"]').click();
 }
 assert.equal(await demo.locator('#count').innerText(),'3');
 // Real wall-clock intervals between animation callbacks, not display presentation times.
 const samples:Record<string,number[]>={};
 for(const mode of ['base','light','still','still','light','base']){
  await page.locator('[data-mode="'+mode+'"]').click();
  await shell.locator('.sf-cloud-texture').waitFor();
  const times=await shell.evaluate(async el=>{
   const win=el.ownerDocument.defaultView!;
   const tick=()=>new Promise<number>(resolve=>win.requestAnimationFrame(resolve));
   await tick();await tick();let last=await tick();const intervals:number[]=[];
   for(let i=0;i<30;i++){const time=await tick();intervals.push(time-last);last=time}
   return intervals;
  });
  (samples[mode]??=[]).push(...times);
 }
 await settings.getByRole('button',{name:'关闭',exact:true}).click();
 await settings.waitFor({state:'hidden'});
 console.log(browser.version(),Object.fromEntries(Object.entries(samples).map(([mode,times])=>{
  times.sort((a,b)=>a-b);
  return [mode,{n:times.length,median:times[Math.floor(times.length*.5)],p95:times[Math.ceil(times.length*.95)-1],max:times.at(-1)}];
 })));
} finally {await browser.close()}
