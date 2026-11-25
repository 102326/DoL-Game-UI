import assert from 'node:assert/strict';
import type {Page} from 'playwright';

// Called with the real settings material page open, before the sidebar comparison.
export async function checkDiamond(page:Page){
 const ball=page.locator('.sf-motion-hub[data-official][data-diamond-hub] .sf-motion-ball');
 const dialog=page.locator('#dol-midnight-controls');
 const button=(name:string)=>dialog.getByRole('button',{name,exact:true});
 const glass=dialog.getByLabel('玻璃模糊',{exact:true});
 const sample=()=>ball.evaluate(el=>{
  const canvas=el.querySelector('canvas')!;
  const copy=new OffscreenCanvas(canvas.width,canvas.height);
  const ctx=copy.getContext('2d',{willReadFrequently:true})!;
  ctx.drawImage(canvas,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let coverage=0,mask=0,peak=0,ink='';
  for(let i=0;i<pixels.length;i+=4){
   const alpha=pixels[i+3]!;
   if(alpha){coverage++;mask=(Math.imul(mask,31)+i+alpha)>>>0}
   if(alpha>peak){peak=alpha;ink=[...pixels.slice(i,i+3)].join(',')}
  }
  const css=getComputedStyle(el);
  return {ink,coverage,mask,background:css.backgroundImage,solid:css.backgroundColor,
   blur:css.backdropFilter,rim:getComputedStyle(el,'::before').borderTopColor};
 });
 const original=await sample();
 assert.ok(original.coverage>0);assert.equal(original.ink,'217,233,237');
 await button('青灰').click();assert.deepEqual(await sample(),original);
 await button('应用并保存').click();
 const themed=await sample();
 assert.equal(themed.ink,'142,192,216');assert.equal(themed.mask,original.mask);
 assert.notEqual(themed.background,original.background);assert.notEqual(themed.rim,original.rim);
 await glass.uncheck();
 const opaque=await sample();
 assert.equal(opaque.blur,'none');assert.equal(opaque.background,'none');assert.equal(opaque.solid,'rgb(18, 23, 28)');
 assert.equal(opaque.ink,themed.ink);
 await button('关闭').click();await dialog.waitFor({state:'hidden'});
 for(let i=0;i<20&&!await ball.evaluate(el=>el.matches(':focus-visible'));i++)await page.keyboard.press('Tab');
 const focus=await ball.evaluate(el=>({active:el===document.activeElement,color:getComputedStyle(el).outlineColor,width:getComputedStyle(el).outlineWidth}));
 assert.deepEqual(focus,{active:true,color:'rgb(142, 192, 216)',width:'2px'});
 await page.keyboard.press('Enter');assert.equal(await ball.getAttribute('aria-expanded'),'true');
 await page.waitForFunction(()=>{
  const el=document.querySelector('.sf-motion-ball.is-open');
  return el&&getComputedStyle(el,'::before').opacity==='1';
 });
 await page.locator('[data-motion-view="SoftWetOfficialUI:interface-settings"]').click();
 await button('材质').click();await glass.check();await button('恢复默认外观').click();
 assert.deepEqual(await sample(),original);
 console.log('Official Hub canvas RGB',original.ink,'->',themed.ink,'->',original.ink,'same shape;',original.coverage,'painted pixels');
}
