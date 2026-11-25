// Run against the generated offline comparison, including its actual sandboxed frames.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const dir=process.argv[2];
assert.ok(dir,'Pass the generated preview directory');
const browser=await chromium.launch({channel:'chrome'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});
 page.setDefaultTimeout(10000);
 await page.goto(pathToFileURL(resolve(dir,'index.html')).href);
 const frames=page.locator('iframe');
 assert.equal(await frames.count(),3);
 const result=[];
 for(let i=0;i<3;i++){
  await page.locator('#version').selectOption(String(i));
  const f=frames.nth(i).contentFrame(),settings=f.locator('#dol-midnight-controls');
  const entry=f.locator('#dol-midnight-sidebar-button');
  await entry.waitFor();
  const reading=await entry.evaluate(()=>{
   const css=(s:string)=>getComputedStyle(document.querySelector(s)!);
   return {width:innerWidth,root:css('html').backgroundColor,canvas:css('body').backgroundColor,reading:css('.passage').backgroundColor,
    border:css('.passage').borderTopWidth,rail:css('#ui-bar').backgroundColor,
    railBlur:css('#ui-bar').backdropFilter,warning:css('#passage-content [style*="color"]').color};
  });
  if(i===2){
   assert.equal(reading.canvas,reading.root);assert.equal(reading.canvas,reading.reading);assert.equal(reading.border,'0px');
   assert.notEqual(reading.rail,reading.canvas);assert.equal(reading.railBlur,'none');
  }
  const shop=f.locator('#clothingShop-div');
  await shop.locator('#item-1 a').click();await entry.click();
  await settings.getByRole('button',{name:'材质',exact:true}).click();
  const glass=settings.getByLabel('玻璃模糊',{exact:true});
  const material=[];
  for(const on of [true,false]){
   await glass.setChecked(on);
   const paint=await settings.evaluate(n=>{
    const d=n.ownerDocument,css=(s:string,pseudo?:string)=>getComputedStyle(d.querySelector(s)!,pseudo);
    const well=css('.dmt-control-sheet'),shell=css('.dmt-settings-shell'),shop=css('#clothingShop-div','::before');
    return {shell:shell.backgroundColor,shellBlur:shell.backdropFilter,well:well.backgroundColor,wellBlur:well.backdropFilter,
     backdrop:getComputedStyle(n,'::backdrop').backdropFilter,shop:shop.backgroundColor,shopBlur:shop.backdropFilter,
     detail:css('.clothing-details').backgroundColor,detailBlur:css('.clothing-details').backdropFilter,
     item:css('.clothing-item.dgshop-selected').boxShadow};
   });
   material.push(paint);
   if(i===2){
    assert.equal(paint.backdrop,'none');assert.equal(paint.wellBlur,'none');assert.equal(paint.detailBlur,'none');
    assert.equal(paint.shellBlur.includes('blur('),on);assert.equal(paint.shopBlur.includes('blur('),on);
    assert.notEqual(paint.well,paint.shell);assert.notEqual(paint.detail,paint.shop);
    assert.ok(paint.item.includes('147, 181, 202'),paint.item);
    if(!on){
     assert.equal(paint.shell,'rgb(37, 42, 50)');assert.equal(paint.shop,paint.shell);
     assert.equal(paint.well,'rgb(29, 33, 40)');assert.equal(paint.detail,paint.well);
    }
   }
  }
  await glass.check();await settings.getByRole('button',{name:'关闭',exact:true}).click();
  result.push({version:i,reading,material});
 }
 assert.equal(new Set(result.map(r=>r.reading.width)).size,1);
 assert.equal(new Set(result.map(r=>r.reading.warning)).size,1);
 assert.notEqual(result[1]!.reading.border,result[2]!.reading.border);
 const colors = page.locator('#colors');
 for (const mode of ['shared', 'default']) {
  await colors.selectOption(mode);
  await page.waitForFunction(() => document.querySelector<HTMLSelectElement>('#colors')?.disabled === false);
  assert.equal(await page.locator('#color-status').innerText(), '已更新 3/3');
  for (const frame of await frames.all()) {
   const theme = await frame.contentFrame().locator('html').evaluate(root => ({
    custom: root.hasAttribute('data-sw-custom-colors'),
    accent: getComputedStyle(root).getPropertyValue('--sw-custom-accent').trim().toLowerCase()
   }));
   assert.equal(theme.custom, mode === 'shared');
   if (theme.custom) assert.equal(theme.accent, '#92bad5');
  }
 }
 console.log(JSON.stringify(result,null,2));
} finally {await browser.close()}
