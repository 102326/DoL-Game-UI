import assert from 'node:assert/strict';
import type {Page} from 'playwright';

// Called with the real settings material page open, before the sidebar comparison.
export async function checkDiamond(page:Page){
 const ball=page.locator('.sf-motion-hub[data-official][data-diamond-hub] .sf-motion-ball');
 const dialog=page.locator('#dol-midnight-controls');
 const button=(name:string)=>dialog.getByRole('button',{name,exact:true});
 const glass=dialog.getByLabel('玻璃模糊',{exact:true});
 const sample=()=>ball.evaluate(el=>{
  const visual=el.querySelector<HTMLElement>('.spin-prism')!,shell=el.querySelector<HTMLElement>('.spin-prism-shell')!;
  const css=getComputedStyle(shell);
  return {ink:getComputedStyle(visual).color,shape:visual.querySelector('svg')?.innerHTML,background:css.backgroundImage,
   blur:css.backdropFilter,rim:css.boxShadow};
 });
 const original=await sample();
 assert.ok(original.shape?.includes('astro-inner-emblem'));assert.equal(original.ink,'rgb(217, 233, 237)');
 await button('青灰').click();assert.deepEqual(await sample(),original);
 await button('应用并保存').click();
 const themed=await sample();
 assert.equal(themed.ink,'rgb(142, 192, 216)');assert.equal(themed.shape,original.shape);
 assert.notEqual(themed.background,original.background);assert.notEqual(themed.rim,original.rim);
 await glass.uncheck();
 const opaque=await sample();
 assert.equal(opaque.blur,'none');assert.match(opaque.background,/radial-gradient/);
 assert.equal(opaque.ink,themed.ink);
 await button('关闭').click();await dialog.waitFor({state:'hidden'});
 for(let i=0;i<20&&!await ball.evaluate(el=>el.matches(':focus-visible'));i++)await page.keyboard.press('Tab');
 const focus=await ball.evaluate(el=>{const shell=el.querySelector('.spin-prism-shell')!;return {active:el===document.activeElement,color:getComputedStyle(shell).outlineColor,width:getComputedStyle(shell).outlineWidth}});
 assert.deepEqual(focus,{active:true,color:'rgb(142, 192, 216)',width:'2px'});
 await page.keyboard.press('Enter');assert.equal(await ball.getAttribute('aria-expanded'),'true');
 await page.waitForFunction(()=>{
  const el=document.querySelector('.sf-motion-ball.is-open .astro-outer-arcs');
  return el&&getComputedStyle(el).transform!=='none';
 });
 await page.locator('[data-motion-view="SoftWetOfficialUI:interface-settings"]').click();
 await button('材质').click();await glass.check();await button('恢复默认外观').click();
 assert.deepEqual(await sample(),original);
 console.log('Official Hub prism color',original.ink,'->',themed.ink,'->',original.ink,'same SVG geometry');
}
