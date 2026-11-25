import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'vite';
const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0}});
await server.listen();const address=server.httpServer!.address();assert.ok(address&&typeof address==='object');
const browser=await chromium.launch({channel:'chrome'});
try{
 const p=await browser.newPage({viewport:{width:1360,height:900}});p.setDefaultTimeout(5000);
 await p.goto('http://127.0.0.1:'+address.port+'/prototypes/host5/theme/sidebar.html');
 const dialog=p.locator('#dol-midnight-controls'),btn=(name:string)=>dialog.getByRole('button',{name,exact:true});
 const settings=()=>p.locator('#dol-midnight-sidebar-button').click();
 const close=async()=>{await btn('关闭').click();await dialog.waitFor({state:'hidden'})};
 await p.locator('#overlayButtons').evaluate(n=>n.insertAdjacentHTML('afterbegin','<button class="macro-button link-internal">Saves</button>'));
 await settings();await btn('材质').click();await btn('青灰').click();await btn('应用并保存').click();await dialog.getByLabel('玻璃模糊',{exact:true}).uncheck();
 const observations=[];
 for(const layout of ['drawer','list','fan']){
  await btn('入口').click();await dialog.getByLabel('悬浮球展开模式').selectOption(layout);await close();
  const hub=p.locator('.sf-motion-hub[data-official]'),ball=hub.locator('.sf-motion-ball');
  async function toggle(open:boolean){
   const result=await ball.evaluateHandle(el=>{
    let resolve!:(s:string)=>void;
    const promise=new Promise<string>(r=>resolve=r);
    el.addEventListener('click',()=>requestAnimationFrame(function sample(){
     const root=el.closest<HTMLElement>('.sf-motion-hub')!;
     if(root.dataset.spinPhase==='moving')resolve(getComputedStyle(root.querySelector('.sf-motion-petal')!).backgroundColor);
     else resolve(root.dataset.spinPhase??'unknown');
    }),{once:true});return {promise};
   });
   await ball.click();
   const moving=await result.evaluate(r=>r.promise);await result.dispose();
   await p.waitForFunction(phase=>document.querySelector<HTMLElement>('.sf-motion-hub')?.dataset.spinPhase===phase,open?'open':'closed');
   return moving;
  }
  const opening=await toggle(true);
  const styles=await hub.evaluate(root=>{
   const css=(q:string,pseudo?:string)=>getComputedStyle(root.querySelector(q)!,pseudo);
   return {row:css('.sf-motion-petal').backgroundColor,icon:css('.sf-motion-tool-icon').color,label:css('.sf-motion-tool-label').color,
    tools:root.querySelector('.sf-motion-utility-icon')?css('.sf-motion-utility-icon').color:null,
    plate:css('.sf-motion-orbit','::before').backgroundColor,plateContent:css('.sf-motion-orbit','::before').content};
  });
  const closing=await toggle(false);
  const row=layout==='fan'?'rgb(32, 39, 50)':'rgba(0, 0, 0, 0)';
  assert.deepEqual([opening,styles.row,closing],[row,row,row],layout+' row through transition');
  assert.equal(styles.plateContent,layout==='list'?'""':'none');
  if(layout==='list')assert.equal(styles.plate,'rgb(32, 39, 50)');
  assert.equal(styles.icon,'rgb(146, 186, 213)');
  if(layout!=='drawer')assert.equal(styles.tools,styles.icon);
  assert.equal(styles.label,'rgb(230, 230, 232)');
  observations.push({layout,opening,...styles,closing});
  await settings();
 }
 await close();
 const native=p.locator('#overlayButtons [data-kw-entry=native-caption]').first();
 await p.keyboard.press('Tab');await native.focus();
 await p.waitForFunction(()=>document.activeElement?.matches('[data-kw-entry=native-caption]:focus-visible'));
 const highlight=await native.evaluate(n=>{const probe=document.createElement('span');probe.style.color='var(--sw-custom-hover)';document.body.append(probe);try{return getComputedStyle(probe).color}finally{probe.remove()}});
 await p.waitForFunction(color=>getComputedStyle(document.activeElement!).backgroundColor===color,highlight);
 const focus=await native.evaluate(n=>({outline:getComputedStyle(n).outlineColor,highlight:getComputedStyle(n).backgroundColor}));
 assert.equal(focus.outline,'rgb(146, 186, 213)');
 await p.setViewportSize({width:390,height:820});
 const surfaces=await p.evaluate(()=>{
  const box=document.createElement('div');box.innerHTML='<dialog open class="dgu-surface" data-sf-workspace="drawer">Neutral</dialog><section class="dgshop-content dgshop-narrow" data-sf-workspace="shop"><div class="dgshop-layout"><div class="clothing-details">Detail</div></div></section>';
  document.body.append(box);return [...box.querySelectorAll('dialog,.clothing-details')].map(n=>getComputedStyle(n).backgroundColor);
 });
 assert.deepEqual(surfaces,['rgb(32, 39, 50)','rgb(32, 39, 50)']);
 console.log(JSON.stringify({observations,focus,surfaces}));
}finally{await browser.close();await server.close()}
