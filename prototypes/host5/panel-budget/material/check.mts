import assert from 'node:assert/strict';
import {chromium,type Locator} from 'playwright';
import {createLabServer} from '../server.mts';
import type {} from './lab.ts';
const server=await createLabServer();await server.listen();
const address=server.httpServer!.address();assert.ok(address&&typeof address==='object');
const browser=await chromium.launch();
try{
 for(const width of [320,390]){
  const metrics=[];
  for(const mode of ['fallback','material','nohost','failed']){
   const page=await browser.newPage({viewport:{width,height:820},reducedMotion:'reduce'});
   const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+address.port+'/prototypes/host5/panel-budget/material/?'+mode);
   await page.waitForFunction(()=>!!window.materialLab);
   const start=page.locator('#start'),close=page.getByRole('button',{name:'Close',exact:true}),
    dialog=page.locator('dialog'),toggle=page.getByRole('button',{name:'Inspector',exact:true}),
    layer=page.locator('[data-sf-mount="scrim"]');
   const counts=()=>page.evaluate(()=>{const d=window.materialLab.diagnostics();return [d.participants.length,d.mounts.length,d.errors.length]});
   const expected=mode==='material'?[2,3,0]:mode==='fallback'?[1,1,0]:mode==='failed'?[1,1,2]:[0,0,0];
   assert.deepEqual(await counts(),expected);
   assert.equal(await layer.count(),mode==='material'?2:0);
   const size=async(n:Locator)=>n.evaluate(el=>{const r=el.getBoundingClientRect();return [r.x,r.y,r.width,r.height]});
   if(mode!=='nohost'){await toggle.click();await page.getByRole('button',{name:'Move'}).waitFor()}
   await start.focus();await page.keyboard.press('Enter');
   assert.ok(await close.evaluate(n=>document.activeElement===n));
   const rect=await size(dialog),control=await size(close);
   assert.ok(rect[0]!>=0 && rect[0]!+rect[2]!<=width);
   const stripe=async(surface:Locator=dialog)=>{
    const shot=await surface.screenshot();
    return page.evaluate(async(data)=>{
     const img=await createImageBitmap(await(await fetch('data:image/png;base64,'+data)).blob());
     const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
     const ctx=c.getContext('2d')!;ctx.drawImage(img,0,0);img.close();
     const pixels=ctx.getImageData(c.width-80,12,48,1).data;
     const reds=Array.from({length:48},(_,i)=>pixels[i*4]!);
     return {contrast:Math.max(...reds)-Math.min(...reds),mean:reds.reduce((a,b)=>a+b,0)/reds.length};
    },shot.toString('base64'));
   };
   const pixels=await stripe();
   if(mode==='material'){
    for(const n of await layer.all()){
     const props=await n.evaluate(el=>[el.getAttribute('aria-hidden'),getComputedStyle(el).pointerEvents,(el as HTMLElement).inert]);
     assert.deepEqual(props,['true','none',true]);
    }
    const current=await dialog.locator('[data-sf-mount="scrim"]').elementHandle();
    await dialog.evaluate(n=>n.style.setProperty('--sf-scrim-blur','0px'));
    const tint=await stripe();
    assert.ok(tint.contrast>pixels.contrast+5,'local blur actually softens the stripe');
    const peerBlur=await page.locator('#independent [data-sf-mount="scrim"]').evaluate(n=>getComputedStyle(n).backdropFilter);
    assert.equal(peerBlur,'blur(4px)');
    await dialog.evaluate(n=>n.style.removeProperty('--sf-scrim-blur'));
    await page.evaluate(()=>window.materialLab.removePeer());
    assert.deepEqual(await counts(),[1,1,0]);assert.ok(await current!.evaluate(n=>n.isConnected));
    assert.deepEqual(await size(dialog),rect);assert.deepEqual(await stripe(),pixels);
   }
   await page.keyboard.press('Enter');await dialog.waitFor({state:'hidden'});
   assert.ok(await start.evaluate(n=>n===document.activeElement));
   if(mode==='material'){
    await page.evaluate(()=>window.materialLab.mountPeer());await toggle.click();
    const peer=await page.locator('#independent [data-sf-mount="scrim"]').elementHandle();
    await page.evaluate(()=>window.materialLab.removeSettings());
    assert.ok(await peer!.evaluate(n=>n.isConnected));assert.deepEqual(await counts(),[1,2,0]);
    await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    await page.evaluate(()=>window.materialLab.mountSettings());
    for(let i=0;i<24;i++){
     const counts=await page.evaluate(()=>{
      const l=window.materialLab;l.removePeer();l.removeSettings();
      const empty=l.diagnostics();l.mountSettings();l.mountPeer();
      return [empty.mounts.length,empty.participants.length,l.diagnostics().mounts.length];
     });
     assert.deepEqual(counts,[0,0,3]);
    }
    await start.click();await close.click();await dialog.waitFor({state:'hidden'});
   }
   let peerContrast:number|undefined;
   if(mode!=='nohost'){
    if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
    peerContrast=(await stripe(page.locator('#independent article'))).contrast;
   }
   if(mode==='material'){
    await dialog.evaluate(el=>el.remove());
    await page.waitForFunction(()=>!!document.querySelector('dialog [data-sf-mount="scrim"]'));
    assert.deepEqual(await counts(),expected);
    await page.evaluate(()=>window.DoLUiHost!.dispose());
    assert.equal(await layer.count(),0);
    await start.click();await close.click();await dialog.waitFor({state:'hidden'});
   }
   if(mode==='nohost')assert.equal(await toggle.count(),0);
   metrics.push({mode,rect,control,pixels,peerContrast});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.evaluate(()=>window.materialLab.dispose());
   assert.deepEqual(await counts(),[0,0,expected[2]]);assert.equal(await layer.count(),0);
   assert.deepEqual(errors,[]);await page.close();
  }
  const [fallback,material,nohost,failed]=metrics;
  assert.deepEqual(failed!.rect,fallback!.rect);assert.deepEqual(failed!.pixels,fallback!.pixels);
  assert.deepEqual(material!.rect,fallback!.rect);assert.deepEqual(fallback!.rect,nohost!.rect);
  assert.deepEqual(material!.control,fallback!.control);assert.deepEqual(nohost!.pixels,fallback!.pixels);
  assert.ok(material!.pixels.contrast+8<fallback!.pixels.contrast);
  assert.ok(material!.peerContrast!+8<fallback!.peerContrast!);
  console.log(JSON.stringify({browser:browser.version(),width,metrics}));
 }
}finally{await browser.close();await server.close()}
