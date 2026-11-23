import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {createLabServer} from '../panel-budget/server.mts';
import type {} from './scene.ts';
const server=await createLabServer();await server.listen();
const address=server.httpServer!.address();assert.ok(address&&typeof address==='object');
const browser=await chromium.launch(),results=[];
try{
 for(const [order,mode] of ['independent','host','host','independent'].entries()){
  const page=await browser.newPage({viewport:{width:390,height:820},reducedMotion:'no-preference'});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+address.port+'/prototypes/host5/composition/?play='+mode);
  await page.waitForFunction(()=>!!window.composition);
  const toggle=page.locator('#toggle'),weather=page.locator('#weather'),fx=page.locator('#fx'),field=page.getByRole('checkbox');
  const obs=await page.evaluateHandle(()=>{
   const frames:number[]=[],opens:{ms:number;opacity:number;available:boolean}[]=[];
   let id=0,start=0;
   const watch=(now:number)=>{frames.push(now);id=requestAnimationFrame(watch)};id=requestAnimationFrame(watch);
   const button=document.querySelector<HTMLButtonElement>('#toggle')!;
   for(const type of ['pointerdown','keydown'])button.addEventListener(type,e=>{start=e.timeStamp});
   button.addEventListener('click',()=>{if(button.getAttribute('aria-expanded')==='true')requestAnimationFrame(()=>{
    const panel=document.querySelector<HTMLElement>('.panel')!;
    opens.push({ms:performance.now()-start,opacity:Number(getComputedStyle(panel).opacity),available:!!panel.getClientRects().length&&!panel.querySelector('input')!.disabled});
   })});
   return {frames,opens,stop:()=>cancelAnimationFrame(id)};
  });
  for(let i=0;i<12;i++){
   const before=await page.evaluate(()=>performance.now());
   if(i%4<2)await toggle.click();else{await toggle.focus();await page.keyboard.press('Enter')}
   if(i%4===0)await weather.click();
   await page.waitForFunction(t=>performance.now()-t>=215,before);
  }
  const sample=await obs.evaluate(o=>{o.stop();return {opens:o.opens,gaps:o.frames.slice(1).map((t,i)=>t-o.frames[i]!)}});
  assert.equal(sample.opens.length,6);assert.ok(sample.opens.every(x=>x.available&&x.opacity===1));
  // Deterministic interruption; both arms must keep the same computed transform, only Host reuses the player.
  const proof=await page.evaluate(()=>{
   const toggle=document.querySelector<HTMLButtonElement>('#toggle')!,weather=document.querySelector<HTMLButtonElement>('#weather')!;
   const line=document.querySelector<HTMLElement>('.signal')!,drift=document.querySelector<HTMLElement>('.drift')!,dense=document.querySelector<HTMLElement>('.dense')!;
   const driftAnim=drift.getAnimations()[0]!;
   toggle.click();const a=line.getAnimations()[0]!;a.currentTime=75;
   const before=getComputedStyle(line).transform;weather.click();
   const intact=a===line.getAnimations()[0]&&before===getComputedStyle(line).transform;
   const w=dense.getAnimations()[0]!;w.currentTime=240;const wet=getComputedStyle(dense).opacity;
   weather.click();const sameBlend=wet===getComputedStyle(dense).opacity;
   const distinct=new Set<Animation>([a]);let continuous=true;
   for(let i=0;i<8;i++){toggle.click();const next=line.getAnimations()[0]!;distinct.add(next);continuous&&=before===getComputedStyle(line).transform}
   return {intact,sameBlend,continuous,objects:distinct.size,drift:driftAnim===drift.getAnimations()[0]};
  });
  assert.deepEqual(proof,{intact:true,sameBlend:true,continuous:true,objects:mode==='host'?1:9,drift:true});
  await field.check();await field.uncheck();
  await page.waitForFunction(()=>!document.querySelector('.signal')!.getAnimations().length);
  // Hold only the weather phase for pixel comparisons; same panel, no text in the sample rectangle.
  await page.waitForFunction(()=>!document.querySelector('.dense')!.getAnimations().length);
  const samplePixels=async(time:number,blur:number)=>{
   await page.evaluate(({time,blur})=>{const d=document.querySelector('.drift')!.getAnimations()[0]!;d.pause();d.currentTime=time;
    document.querySelector<HTMLElement>('.panel')!.style.setProperty('--sf-scrim-blur',blur+'px')},{time,blur});
   const rect=await page.locator('.panel').boundingBox();assert.ok(rect);
   const png=await page.screenshot({clip:{x:Math.floor(rect.x+rect.width-70),y:Math.floor(rect.y+14),width:50,height:50}});
   return page.evaluate(async encoded=>{const img=await createImageBitmap(await(await fetch('data:image/png;base64,'+encoded)).blob());
    const c=document.createElement('canvas');c.width=c.height=50;const ctx=c.getContext('2d')!;ctx.drawImage(img,0,0);img.close();
    return Array.from(ctx.getImageData(0,0,50,50).data).filter((_,i)=>i%4===0)},png.toString('base64'));
  };
  const first=await samplePixels(500,8),moved=await samplePixels(7000,8),sharp=await samplePixels(7000,0);
  const delta=(a:number[],b:number[])=>a.reduce((n,v,i)=>n+Math.abs(v-b[i]!),0)/a.length;
  const pixels={weather:delta(first,moved),blur:delta(moved,sharp)};assert.ok(pixels.weather>.5&&pixels.blur>.1,JSON.stringify(pixels));
  // Each removed consumer relinquishes its actual WAAPI instances and its baked texture.
  const cleanup=await page.evaluate(()=>{
   const s=window.composition;const d=document.querySelector('.drift')!.getAnimations()[0]!;d.play();
   const counts=s.counts();s.panel(false);const skyKept=document.querySelector('.drift')!.getAnimations()[0]===d && d.playState==='running';
   s.panel(true);
   const toggle=document.querySelector<HTMLButtonElement>('#toggle')!;toggle.click();const anim=document.querySelector('.signal')!.getAnimations()[0]!;
   anim.currentTime=70;const canvas=document.querySelector('canvas')!;s.sky(false);
   const panelKept=document.querySelector('.signal')!.getAnimations()[0]===anim;
   const released=!canvas.isConnected&&canvas.width===0 && d.playState==='idle';
   s.sky(true);return {counts,skyKept,panelKept,released};
  });assert.ok(cleanup.skyKept&&cleanup.panelKept&&cleanup.released);
  await fx.click();await toggle.click();await field.check();await weather.click();
  assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
  assert.ok(await field.isChecked());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.evaluate(()=>{const s=window.composition;for(let i=0;i<12;i++){s.panel(false);s.sky(false);s.panel(true);s.sky(true)}});
  const beforeDispose=await page.evaluate(()=>window.composition.counts());
  assert.deepEqual(beforeDispose,{tracks:0,mounts:mode==='host'?3:0,participants:mode==='host'?2:0});
  const end=await page.evaluate(()=>{window.composition.dispose();return {...window.composition.counts(),animations:document.getAnimations().length,nodes:document.querySelector('#stage')!.childElementCount}});
  assert.deepEqual(end,{tracks:0,mounts:0,participants:0,animations:0,nodes:0});assert.deepEqual(errors,[]);
  results.push({order,mode,...sample,proof,pixels,cleanup,beforeDispose,end});await page.close();
 }
 if(process.argv[2])await writeFile(process.argv[2],JSON.stringify({browser:browser.version(),node:process.version,results},null,2)+'\n');
 console.log('PASS',results.map(x=>[x.mode,x.opens.length,x.gaps.length,x.pixels]));
}finally{await browser.close();await server.close()}
