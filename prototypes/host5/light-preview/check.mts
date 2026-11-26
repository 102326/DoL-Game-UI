// Exercise the delivered HTML directly from disk, through the review controls and native shop actions.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const file=process.argv[2];
assert.ok(file,'Pass the generated offline HTML');
const browser=await chromium.launch({channel:'chrome'});
try {
 const page=await browser.newPage({viewport:{width:1360,height:1000},reducedMotion:'reduce'});
 page.setDefaultTimeout(7500);
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/^https?:/.test(r.url()))errors.push('Network request from offline preview')});
 await page.goto(pathToFileURL(resolve(file)).href);
 const frame=page.frameLocator('iframe'),root=frame.locator('html');
 const ready=async()=>{
  await page.locator('[data-preset=dark]:enabled').waitFor();
  assert.equal(await page.locator('#status').textContent(),'');
 };
 await ready();
 for(const preset of ['mist','porcelain','dark']){
  await page.locator('[data-preset='+preset+']').click();await ready();
  assert.equal(await root.getAttribute('data-sw-theme'),preset==='dark'?null:preset);
  assert.equal(await page.locator('[data-preset='+preset+']').getAttribute('aria-pressed'),'true');
  if(preset==='dark'){
   assert.equal(await root.getAttribute('data-sw-custom-colors'),null);
   continue;
  }
  const marker=frame.locator('#passage-content > p > span.orange');
  assert.equal(await marker.evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(38, 40, 43)');
  const nativeLink=frame.locator('#next');
  await nativeLink.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
  assert.equal(await nativeLink.evaluate(n=>n.matches(':focus-visible') && getComputedStyle(n).outlineStyle==='solid'),true);
  await page.locator('#size').selectOption('390');
  await frame.locator('.dgshop-narrow').waitFor();
  for(const state of ['off','on']){
   await page.locator('#glass').selectOption(state);await ready();
   assert.equal(await root.getAttribute('data-dgu-visualGlass')!==null,state==='on');
   await page.locator('#shop').click();await ready();
   const drawer=frame.locator('.dgshop-detail-open');
   await drawer.waitFor();
   assert.equal(await frame.locator('.dgshop-detail-backdrop').evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(20, 28, 38, 0.42)');
   const paint=await root.evaluate(n=>{
    const css=(sel:string)=>getComputedStyle(n.querySelector(sel)!);
    const panel=css('.clothing-details').backgroundColor;
    const ctx=document.createElement('canvas').getContext('2d')!;
    ctx.fillStyle=panel;ctx.fillRect(0,0,1,1);
    const rgba=Array.from(ctx.getImageData(0,0,1,1).data);
    return {panel,rgba,price:css('.dgshop-catalog .clothing-price').color,select:css('.optionsBar select').colorScheme};
   });
   assert.equal(paint.select,'light');assert.ok(paint.rgba.slice(0,3).every(c=>c>200));
   assert.equal(paint.rgba[3]===255,state==='off');
   for(const id of ['buy','try']){
    await drawer.locator('#'+id).click();
    assert.match(await drawer.locator('#result').innerText(),/中性操作已触发/);
   }
   const back=drawer.getByRole('button',{name:/关闭|返回/}).first();
   await back.click();await drawer.waitFor({state:'hidden'});
   await page.locator('#settings').click();await ready();
   await frame.locator('dialog[open] .dmt-close').click();
   console.log(JSON.stringify({preset,state,...paint}));
  }
  await page.locator('#size').selectOption('1120');
 }
 assert.deepEqual(errors,[]);
} finally {await browser.close()}
