import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import type {FloatingApi} from '../../../src/floating/preferences';
type FloatingWindow=Window & {DoLFloatingTools?:FloatingApi};
import {loadPackage,readPackage} from '../panel-budget/package-input.mts';

const [hostPath,uiPath]=process.argv.slice(2);
assert.ok(hostPath&&uiPath,'Pass candidate Host ZIP and UI ZIP');
const host=readPackage(hostPath,'StoneFreeHost'),ui=readPackage(uiPath,'DoLGameUI');
const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0}});await server.listen();
const address=server.httpServer!.address();assert.ok(address&&typeof address==='object');
const browser=await chromium.launch({channel:process.env.HOST5_BROWSER||'chrome'});
try{
 const page=await browser.newPage({viewport:{width:390,height:760}});page.setDefaultTimeout(5000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const url=`http://127.0.0.1:${address.port}/prototypes/host5/theme/sidebar.html`;
 const html=readFileSync(new URL('./sidebar.html',import.meta.url),'utf8').replace(/<script[^>]*><\/script>|<link rel="stylesheet"[^>]*>/g,'');
 await page.route(url,route=>route.fulfill({contentType:'text/html',body:html}));
 await page.goto(url);await page.locator('#ui-bar').evaluate(el=>el.classList.add('stowed'));await loadPackage(page,host);await page.evaluate(()=>window.DoLUiHost!.sceneReady());await loadPackage(page,ui);
 await page.waitForSelector('.sf-motion-hub[data-official] .sf-motion-ball');
 const ball=page.locator('.sf-motion-hub[data-official] .sf-motion-ball');
 // Restore through the same persisted setting that the real hub writes.
 for(const size of [{width:390,height:760},{width:760,height:390}])for(const side of ['left','right'] as const){
  await page.setViewportSize(size);
  await page.evaluate(({side})=>{localStorage.setItem('SoftWet.MotionHub.freePosition.v1',JSON.stringify({version:1,x:side==='left'?0:1,y:.5,docked:true,side}));(window as FloatingWindow).DoLFloatingTools!.hide();(window as FloatingWindow).DoLFloatingTools!.show()}, {side});
  await ball.waitFor();await page.waitForTimeout(650);
  const hit=await ball.evaluate(el=>{const r=el.getBoundingClientRect(),v=el.querySelector('.spin-prism')!.getBoundingClientRect(),points=[];for(let x=1;x<r.width;x+=2)for(let y=1;y<r.height;y+=2){const target=document.elementFromPoint(r.left+x,r.top+y);if(target&&el.contains(target))points.push([x,y])}const line=(horizontal:boolean)=>{let run=0,max=0;for(let i=0;i<56;i++){const target=document.elementFromPoint(r.left+(horizontal?i+.5:28),r.top+(horizontal?28:i+.5));run=target&&el.contains(target)?run+1:0;max=Math.max(max,run)}return max};return {horizontal:line(true),vertical:line(false),x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,visual:{left:v.left,right:v.right,width:v.width,delta:(v.left+v.right-r.left-r.right)/2},points}});
  assert.ok(Math.abs(hit.visual.delta-(side==='left'?-26:26))<1,JSON.stringify(hit.visual));
  assert.ok(Math.abs((Math.min(size.width,hit.visual.right)-Math.max(0,hit.visual.left))-30)<2,JSON.stringify(hit.visual));
  assert.ok(hit.horizontal>=44&&hit.vertical>=44,JSON.stringify({horizontal:hit.horizontal,vertical:hit.vertical}));
  assert.equal(hit.width,56);assert.equal(hit.height,56);assert.ok(hit.points.length>=22*22,JSON.stringify(hit));
  assert.ok(hit.x>=0&&hit.right<=size.width&&hit.y>=0&&hit.bottom<=size.height);
  const outsideX=side==='left'?hit.right+2:hit.x-2;
  assert.equal(await page.evaluate(({x,y})=>!!document.elementFromPoint(x,y)?.closest('.sf-motion-hub'),{x:outsideX,y:hit.y+28}),false,'outside the control must remain available to the page');
  const sample=hit.points[Math.floor(hit.points.length/2)]!;
  await page.mouse.click(hit.x+sample[0]!,hit.y+sample[1]!);
  await page.waitForFunction(()=>!document.querySelector('.sf-motion-ball')?.classList.contains('is-docked'));
  await page.waitForTimeout(550);
  assert.ok(Math.abs(await ball.evaluate(el=>{const r=el.getBoundingClientRect(),v=el.querySelector('.spin-prism')!.getBoundingClientRect();return (v.left+v.right-r.left-r.right)/2}))<1,'restored artwork must center');await ball.focus();await page.keyboard.press('Enter');
  assert.equal(await ball.getAttribute('aria-expanded'),'true');await ball.press('Escape');await page.waitForFunction(()=>document.querySelector('.sf-motion-ball')?.getAttribute('aria-expanded')==='false');
  const box=(await ball.boundingBox())!;await page.mouse.move(box.x+28,box.y+28);await page.mouse.down();await page.mouse.move(size.width/2,size.height/2,{steps:8});await page.mouse.up();
  await page.waitForTimeout(550);const moved=(await ball.boundingBox())!;assert.ok(Math.abs(moved.x-box.x)>30,'drag must change position');
  await ball.click();await page.getByRole('button',{name:'停靠侧边',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.sf-motion-ball')?.classList.contains('is-docked'));await page.waitForTimeout(550);
  const dock=(await ball.boundingBox())!;await page.mouse.move(dock.x+28,dock.y+28);await page.mouse.down();await page.mouse.move(size.width/2,size.height/2,{steps:8});await page.mouse.up();
  await page.waitForTimeout(550);assert.equal(await ball.evaluate(el=>el.classList.contains('is-docked')),false);
  const released=(await ball.boundingBox())!;assert.ok(Math.abs(released.x-dock.x)>30,'dragging a docked ball must restore it');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('SoftWet.MotionHub.freePosition.v1')!).docked),false);
  console.log('dock',JSON.stringify({size,side,hitBox:[hit.x,hit.y,hit.width,hit.height],reachableSamples:hit.points.length,lines:[hit.horizontal,hit.vertical]}));
 }
 await page.waitForTimeout(2500);
 const idle=await ball.evaluate(async el=>{const root=el.closest('.sf-motion-hub')!;let mutations=0;const observer=new MutationObserver(records=>mutations+=records.length);observer.observe(root,{subtree:true,attributes:true,childList:true,characterData:true});await new Promise(resolve=>setTimeout(resolve,500));observer.disconnect();return {mutations,animations:root.getAnimations({subtree:true}).filter(animation=>animation.playState==='running'||animation.pending).length}});
 assert.deepEqual(idle,{mutations:0,animations:0});console.log('idle 500ms',idle);
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{left:24,right:24,top:0,bottom:0}});
 await page.evaluate(()=>{localStorage.setItem('SoftWet.MotionHub.freePosition.v1',JSON.stringify({version:1,x:0,y:.5,docked:true,side:'left'}));(window as FloatingWindow).DoLFloatingTools!.hide();(window as FloatingWindow).DoLFloatingTools!.show();window.dispatchEvent(new Event('resize'))});
 await page.waitForTimeout(650);
 const safe=await ball.evaluate(el=>({left:el.getBoundingClientRect().left,delta:(()=>{const r=el.getBoundingClientRect(),v=el.querySelector('.spin-prism')!.getBoundingClientRect();return (v.left+v.right-r.left-r.right)/2})(),offset:getComputedStyle(el.closest('.sf-motion-hub')!).getPropertyValue('--sf-dock-offset').trim()}));
 assert.ok(safe.left>=24,JSON.stringify(safe));assert.equal(safe.offset,'0px');assert.ok(Math.abs(safe.delta)<1);await cdp.detach();
 await page.evaluate(()=>(window as FloatingWindow).DoLFloatingTools!.hide());assert.equal(await page.locator('.sf-motion-hub').count(),0);assert.deepEqual(errors,[]);
}finally{await browser.close();await server.close()}
