// @ci-contract {"profiles":["standard","research"],"classification":"contract","granularity":"entry"}
// Real characteristics owner, synthetic native overlay: no game assets or save data.
import assert = require('node:assert/strict');
import fs = require('node:fs');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {Page} from 'playwright';

declare const attributesPreview:{close():void;create():void;dispose():void;counts():{actions:number;disposed:boolean};theme:{setPreference(key:string,value:boolean|number):void}};
const results:string[]=[],errors:string[]=[];
const frame=(page:Page)=>page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
async function drag(page:Page,dx=30,dy=18){
 const box=await page.locator('#customOverlayTitle').boundingBox();assert.ok(box);
 const x=box.x+box.width*.4,y=box.y+box.height*.5;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:4});await frame(page);
}
async function aligned(page:Page,label:string){
 const boxes=await page.evaluate(()=>{
  const source=document.querySelector<HTMLElement>('.dmt-orbit-focus[data-sf-foreground-source]'),clone=document.querySelector<HTMLElement>('.sf-foreground-orbit');
  if(!source||!clone)throw Error('Missing foreground orbit source or clone');
  const a=source.getBoundingClientRect(),b=clone.getBoundingClientRect();return [a.x-b.x,a.y-b.y,a.width-b.width,a.height-b.height];
 });
 assert.ok(boxes.every(value=>Math.abs(value)<1),`${label}: ${JSON.stringify(boxes)}`);
}
async function rainGeometry(page:Page,label:string){
 await page.waitForFunction(()=>[...document.querySelectorAll<HTMLElement>('.sf-foreground-paint .evo-glass-drop')].some(node=>{const s=getComputedStyle(node),r=node.getBoundingClientRect(),clip=node.closest('.sf-foreground-paint')!.getBoundingClientRect();return s.display!=='none'&&s.visibility==='visible'&&Number(s.opacity)>.01&&r.width>0&&r.height>0&&r.left>=clip.left&&r.top>=clip.top&&r.right<=clip.right&&r.bottom<=clip.bottom}),null,{timeout:10000});
 const geometry=await page.evaluate(()=>{
  const shell=document.querySelector<HTMLElement>('#customOverlay')!,paint=document.querySelector<HTMLElement>('#customOverlay+.sf-foreground-host .sf-foreground-paint')!;
  const root=shell.getBoundingClientRect(),ps=getComputedStyle(paint),ss=getComputedStyle(shell),pr=paint.getBoundingClientRect();
  const cssWidth=parseFloat(ss.width)+(ss.boxSizing==='border-box'?0:parseFloat(ss.paddingLeft)+parseFloat(ss.paddingRight)+parseFloat(ss.borderLeftWidth)+parseFloat(ss.borderRightWidth));
  const cssHeight=parseFloat(ss.height)+(ss.boxSizing==='border-box'?0:parseFloat(ss.paddingTop)+parseFloat(ss.paddingBottom)+parseFloat(ss.borderTopWidth)+parseFloat(ss.borderBottomWidth));
  const sx=root.width/cssWidth,sy=root.height/cssHeight;
  const drop=[...paint.querySelectorAll<HTMLElement>('.evo-glass-drop')].find(node=>{const s=getComputedStyle(node),r=node.getBoundingClientRect();return s.display!=='none'&&s.visibility==='visible'&&Number(s.opacity)>.01&&r.width>0&&r.height>0&&r.left>=pr.left&&r.top>=pr.top&&r.right<=pr.right&&r.bottom<=pr.bottom});
  if(!drop)throw Error('Missing visible, unclipped rain drop');const d=drop.getBoundingClientRect(),ds=getComputedStyle(drop),layer=drop.parentElement!,ls=getComputedStyle(layer);
  const originX=root.left+parseFloat(ss.borderLeftWidth)*sx,originY=root.top+parseFloat(ss.borderTopWidth)*sy;
  return{scaleX:pr.width-parseFloat(ps.width)*sx,scaleY:pr.height-parseFloat(ps.height)*sy,x:d.left-(originX+(parseFloat(ls.left)+parseFloat(ds.left))*sx),y:d.top-(originY+(parseFloat(ls.top)+parseFloat(ds.top))*sy),width:d.width-parseFloat(ds.width)*sx,height:d.height-parseFloat(ds.height)*sy};
 });
 assert.ok(Object.values(geometry).every(value=>Number.isFinite(value)&&Math.abs(value)<1),`${label}: paint and rain geometry ${JSON.stringify(geometry)}`);
}
async function released(page:Page,label:string){
 await page.waitForFunction(()=>!document.querySelector('[data-dgu-attributes-material]'));
 const value=await page.locator('#customOverlay').evaluate((node:HTMLElement)=>({translate:node.style.translate,scale:node.style.scale,moving:node.hasAttribute('data-dgu-material-moving'),coreTranslate:node.querySelector<HTMLElement>('#customOverlayContent')!.style.translate,coreScale:node.querySelector<HTMLElement>('#customOverlayContent')!.style.scale}));
 assert.deepEqual(value,{translate:'',scale:'',moving:false,coreTranslate:'',coreScale:''},label);
}
(async()=>{
 const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default,tailwind=(await import('@tailwindcss/vite')).default;
 const server=await createServer({configFile:false,plugins:[vue(),tailwind()],define:{__STONE_FREE_CONSUMER__:true,__VUE_OPTIONS_API__:false,__VUE_PROD_DEVTOOLS__:false},server:{host:'127.0.0.1',port:0},logLevel:'error'});let browser:playwright.Browser|undefined;
 try{
  await server.listen();const address=server.httpServer?.address();assert.ok(address&&typeof address!=='string');browser=await playwright.chromium.launch(browserOptions);
  for(const width of [1280,390])for(const zoom of [1,1.25]){
   const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',error=>errors.push(error.message));
   await page.goto(`http://127.0.0.1:${address.port}/prototypes/evolution-integration/attributes-material.html?variant=study`);
   await page.locator('[data-dgu-attributes-material]').waitFor();await page.waitForTimeout(300);
   await page.evaluate(({z,w})=>{document.documentElement.style.zoom=String(z);const shell=document.querySelector<HTMLElement>('#customOverlay')!;Object.assign(shell.style,{left:'50%',top:'50%',width:Math.min(880,w/z-80)+'px',height:Math.min(600,900/z-100)+'px',transform:'translate(-50%, -50%)'});Object.assign(window,{contractRoot:shell,contractParent:shell.parentNode,contractAction:document.querySelector('#native-action')})},{z:zoom,w:width});
   await frame(page);await page.locator('#weather').selectOption('rain');await rainGeometry(page,`${width}/${zoom} rain ready`);
   await page.locator('#native-action').click();assert.equal(await page.evaluate(()=>attributesPreview.counts().actions),1);
   const before=await page.locator('#customOverlay').boundingBox();assert.ok(before);
   await drag(page);assert.equal(await page.locator('#customOverlay').getAttribute('data-dgu-material-moving'),'');await aligned(page,`${width}/${zoom} dragging`);await rainGeometry(page,`${width}/${zoom} dragging`);
   assert.equal(await page.evaluate(()=>{const w=window as unknown as {contractRoot:Element;contractParent:Node;contractAction:Element};return document.querySelector('#customOverlay')===w.contractRoot&&w.contractRoot.parentNode===w.contractParent&&document.querySelector('#native-action')===w.contractAction}),true,'native root, parent and action remain identical');
   const during=await page.locator('#customOverlay').boundingBox();assert.ok(during);assert.ok(Math.abs(during.x-before.x)+Math.abs(during.y-before.y)>3,'gesture moves real window');
   await page.mouse.up();await page.waitForFunction(()=>!document.querySelector('#customOverlay')?.hasAttribute('data-dgu-material-moving'));await aligned(page,`${width}/${zoom} settled`);
   const stable=await page.locator('#customOverlay').getAttribute('style');await page.waitForTimeout(150);assert.equal(await page.locator('#customOverlay').getAttribute('style'),stable,'idle stops writes');
   await page.getByRole('button',{name:'学业',exact:true}).click();await page.waitForFunction(()=>document.querySelector<HTMLElement>('#customOverlayContent')!.scrollTop>100);await page.locator('#weather').selectOption('snow');await page.waitForTimeout(200);await aligned(page,`${width}/${zoom} scroll and snow`);
   await page.evaluate(()=>attributesPreview.dispose());await released(page,'dispose restores styles');assert.equal(await page.locator('#customOverlay+.sf-foreground-host').count(),0,'dispose releases foreground');
   await page.locator('#native-action').click();assert.equal(await page.evaluate(()=>attributesPreview.counts().actions),2,'native action remains functional');
   results.push(`geometry ${width} zoom ${zoom}: real native nodes, rain/snow, scroll, drag, settle, disposal`);await page.close();
  }
  const page=await browser.newPage({viewport:{width:1280,height:900}});page.on('pageerror',error=>errors.push(error.message));await page.goto(`http://127.0.0.1:${address.port}/prototypes/evolution-integration/attributes-material.html?variant=study`);await page.locator('[data-dgu-attributes-material]').waitFor();await page.waitForTimeout(300);
  // One real pointer capture followed by a synchronous burst: inspect only the first
  // animation frame, so later spring frames cannot be mistaken for burst writes.
  await page.evaluate(()=>document.querySelector('#customOverlayTitle')!.addEventListener('pointerdown',event=>{const e=event as PointerEvent;Object.assign(window,{burstPointer:{id:e.pointerId,x:e.clientX,y:e.clientY}})},{once:true}));
  const grip=await page.locator('#customOverlayTitle').boundingBox();assert.ok(grip);await page.mouse.move(grip.x+grip.width*.4,grip.y+grip.height*.5);await page.mouse.down();
  const burst=await page.evaluate(async()=>{
   const shell=document.querySelector<HTMLElement>('#customOverlay')!,header=document.querySelector<HTMLElement>('#customOverlayTitle')!,pointer=(window as unknown as {burstPointer:{id:number;x:number;y:number}}).burstPointer;
   const before=shell.getBoundingClientRect(),records:MutationRecord[]=[];const observer=new MutationObserver(entries=>records.push(...entries));observer.observe(shell,{attributes:true,attributeFilter:['style']});
   for(let i=1;i<=12;i++)header.dispatchEvent(new PointerEvent('pointermove',{pointerId:pointer.id,pointerType:'mouse',isPrimary:true,buttons:1,clientX:pointer.x+i*2,clientY:pointer.y+i,bubbles:true}));
   const immediate=observer.takeRecords().length;await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));records.push(...observer.takeRecords());observer.disconnect();const after=shell.getBoundingClientRect();return{immediate,writes:records.length,dx:after.x-before.x,dy:after.y-before.y};
  });
  assert.equal(burst.immediate,0,'pointermove burst does not synchronously write root style');assert.ok(burst.writes>0&&burst.writes<=2,'one frame writes root translate and scale at most once: '+JSON.stringify(burst));assert.ok(Math.abs(burst.dx)+Math.abs(burst.dy)>3,'coalesced movement is applied');await page.mouse.up();await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await frame(page);results.push('12 pointer moves coalesce into one root transform paint');
  await drag(page);await page.evaluate(()=>attributesPreview.close());await page.mouse.up();await released(page,'close');await page.locator('#open').click();await page.locator('[data-dgu-attributes-material]').waitFor();
  await drag(page);await page.locator('#overlayTabs').getByRole('button',{name:'社交',exact:true}).evaluate((node:HTMLElement)=>node.click());await page.mouse.up();await released(page,'role switch');await page.locator('#overlayTabs').getByRole('button',{name:'属性',exact:true}).click();await page.locator('[data-dgu-attributes-material]').waitFor();
  await drag(page);await page.evaluate(()=>attributesPreview.theme.setPreference('enabled',false));await page.mouse.up();await released(page,'disable');await page.evaluate(()=>attributesPreview.theme.setPreference('enabled',true));await page.locator('[data-dgu-attributes-material]').waitFor();
  await page.waitForSelector('#customOverlay+.sf-foreground-host .sf-foreground-paint');await page.evaluate(()=>Object.assign(window,{stoneRoot:document.querySelector('#customOverlay'),stoneHost:document.querySelector('#customOverlay+.sf-foreground-host')}));
  await drag(page);await page.evaluate(()=>document.documentElement.removeAttribute('data-stone-free'));await page.mouse.up();await released(page,'stone-free off');
  assert.equal(await page.locator('#customOverlay+.sf-foreground-host .sf-foreground-paint').evaluate((node:HTMLElement)=>node.style.scale),'','foreground returns to native geometry when material exits');
  assert.equal(await page.evaluate(()=>{const w=window as unknown as {stoneRoot:Element;stoneHost:Element};return document.querySelector('#customOverlay')===w.stoneRoot&&document.querySelector('#customOverlay+.sf-foreground-host')===w.stoneHost}),true,'native root and foreground survive stone-free toggle');
  await page.evaluate(()=>document.documentElement.setAttribute('data-stone-free',''));await page.locator('[data-dgu-attributes-material]').waitFor();await drag(page);
  const restoredScale=await page.evaluate(()=>{const shell=document.querySelector<HTMLElement>('#customOverlay')!,paint=document.querySelector<HTMLElement>('#customOverlay+.sf-foreground-host .sf-foreground-paint')!,r=shell.getBoundingClientRect(),p=paint.getBoundingClientRect(),s=getComputedStyle(shell),ps=getComputedStyle(paint);return{scale:paint.style.scale,dx:p.width-parseFloat(ps.width)*r.width/parseFloat(s.width),dy:p.height-parseFloat(ps.height)*r.height/parseFloat(s.height)}});
  assert.notEqual(restoredScale.scale,'','foreground material scaling restored');assert.ok(Math.abs(restoredScale.dx)<1&&Math.abs(restoredScale.dy)<1,JSON.stringify(restoredScale));await page.mouse.up();await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await frame(page);results.push('stone-free off/on retains native root and foreground and restores correct scale');
  const originalTranslate=await page.evaluate(()=>{const n=document.querySelector<HTMLElement>('#customOverlay')!;n.style.translate='9px 0px';return n.style.translate});await page.waitForFunction(()=>!document.querySelector('#customOverlay')?.hasAttribute('data-dgu-attributes-drag-ready'));assert.notEqual(await page.locator('#customOverlayTitle').evaluate(node=>getComputedStyle(node).touchAction),'none','foreign transform preserves native touch before pointerdown');const beforeFallback=await page.locator('#customOverlay').boundingBox();await drag(page);await page.mouse.up();assert.equal(await page.locator('#customOverlay').evaluate((n:HTMLElement)=>n.style.translate),originalTranslate);assert.deepEqual(await page.locator('#customOverlay').boundingBox(),beforeFallback,'native independent transform keeps fallback');assert.equal(await page.locator('#customOverlay').getAttribute('data-dgu-material-moving'),null);await page.evaluate(()=>document.querySelector<HTMLElement>('#customOverlay')!.style.removeProperty('translate'));
  for(const reduced of [true,false]){if(reduced)await page.emulateMedia({reducedMotion:'reduce'});else{await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>attributesPreview.theme.setPreference('visualMotion',false))}await drag(page);assert.match(await page.locator('#customOverlay').evaluate((n:HTMLElement)=>n.style.scale),/^1(?: 1)?$/);await page.mouse.up();await page.waitForFunction(()=>!document.querySelector('#customOverlay')?.hasAttribute('data-dgu-material-moving'))}
  await page.evaluate(()=>attributesPreview.theme.setPreference('visualMotion',true));await drag(page);await page.evaluate(()=>{const old=document.querySelector('#customOverlay')!;Object.assign(window,{contractOld:old});attributesPreview.create()});await page.mouse.up();await page.locator('[data-dgu-attributes-material]').waitFor();assert.equal(await page.locator('#customOverlay+.sf-foreground-host').count(),1);assert.equal(await page.evaluate(()=>{const old=(window as unknown as {contractOld:HTMLElement}).contractOld;return !old.isConnected&&!old.hasAttribute('data-dgu-attributes-material')&&!old.hasAttribute('data-dgu-material-moving')&&!old.style.translate&&!old.style.scale}),true,'replacement releases former native root');
  await page.waitForFunction(()=>document.querySelector('#customOverlay')?.hasAttribute('data-dgu-attributes-drag-ready'));
  const startFade=async()=>{await page.evaluate(()=>{const root=document.querySelector<HTMLElement>('#customOverlay')!,fade=root.animate([{opacity:.85},{opacity:1}],{duration:180});Object.assign(window,{contractFade:fade});root.classList.toggle('contract-fade-probe')});await page.waitForFunction(()=>!document.querySelector('#customOverlay')?.hasAttribute('data-dgu-attributes-drag-ready'));assert.equal(await page.evaluate(()=>(window as unknown as {contractFade:Animation}).contractFade.playState),'running')};
  await startFade();await page.evaluate(async()=>{await (window as unknown as {contractFade:Animation}).contractFade.finished});await page.waitForFunction(()=>document.querySelector('#customOverlay')?.hasAttribute('data-dgu-attributes-drag-ready'));
  await startFade();await page.evaluate(()=>(window as unknown as {contractFade:Animation}).contractFade.cancel());await page.waitForFunction(()=>document.querySelector('#customOverlay')?.hasAttribute('data-dgu-attributes-drag-ready'));
  await startFade();await page.evaluate(()=>{attributesPreview.dispose();(window as unknown as {contractFade:Animation}).contractFade.cancel()});await released(page,'destroy');await frame(page);assert.equal(await page.locator('[data-dgu-attributes-drag-ready]').count(),0,'late animation cancellation cannot revive disposed readiness');assert.equal(await page.locator('.sf-foreground-host').count(),0);results.push('finite native fade finish/cancel restores readiness without pointerdown; disposal prevents revival');results.push('close, role switch, disable, native transform fallback, reduced motion, replacement and destroy');await page.close();
  const unsupported=await browser.newPage({viewport:{width:1280,height:900}});unsupported.on('pageerror',error=>errors.push(error.message));await unsupported.addInitScript(()=>{const supports=CSS.supports.bind(CSS);CSS.supports=((property:string,value?:string)=>property==='translate'||property==='scale'?false:value===undefined?supports(property):supports(property,value)) as typeof CSS.supports});await unsupported.goto(`http://127.0.0.1:${address.port}/prototypes/evolution-integration/attributes-material.html?variant=study`);await unsupported.locator('.dgc-navigation').waitFor();await unsupported.waitForTimeout(300);const fallback=await unsupported.locator('#customOverlay').boundingBox();await drag(unsupported);await unsupported.mouse.up();assert.deepEqual(await unsupported.locator('#customOverlay').boundingBox(),fallback,'unsupported independent transforms retain native window');assert.equal(await unsupported.locator('#customOverlay').getAttribute('data-dgu-material-moving'),null);results.push('unsupported independent transforms retain native behavior');await unsupported.close();
  const baseline=await browser.newPage({viewport:{width:1280,height:900}});baseline.on('pageerror',error=>errors.push(error.message));await baseline.goto(`http://127.0.0.1:${address.port}/prototypes/evolution-integration/attributes-material.html?variant=baseline`);await baseline.locator('.dgc-navigation').waitFor();await baseline.waitForTimeout(300);const position=await baseline.locator('#customOverlay').boundingBox();await drag(baseline);await baseline.mouse.up();assert.deepEqual(await baseline.locator('#customOverlay').boundingBox(),position);assert.equal(await baseline.locator('[data-dgu-attributes-material]').count(),0);results.push('baseline keeps native window without new motion');await baseline.close();assert.deepEqual(errors,[]);
  fs.mkdirSync('tests/artifacts/evolution',{recursive:true});fs.writeFileSync('tests/artifacts/evolution/attributes-material.json',JSON.stringify({results,errors},null,2));console.log('PASS attributes material: '+results.join('; '));
 }finally{await browser?.close();await server.close()}
})().catch(error=>{receipt.terminalFailure(error);process.exitCode=1});
