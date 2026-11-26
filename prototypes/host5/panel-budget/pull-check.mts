import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {chromium} from 'playwright';

const browser=await chromium.launch({channel:process.env.HOST5_BROWSER||'chrome'});
try {
 const page=await browser.newPage({viewport:{width:1280,height:800},hasTouch:true});
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 const records:{pointer:{origin:string;target:string;capture:{region:string;header:boolean}|null}|null;event:string;open:boolean;leaving:boolean;rect:number[];focus:string;acquired:number;released:number}[]=[];
 page.on('console',msg=>{if(msg.text().startsWith('SW41 '))records.push(JSON.parse(msg.text().slice(5)))});
 await page.goto(pathToFileURL(resolve('tests/artifacts/host5-settings-touch/index.html')).href);
 const cdp=await page.context().newCDPSession(page);
 const title=page.locator('#dol-midnight-title'), grip=page.locator('#pull-grip');
 const opener=page.locator('#dol-midnight-sidebar-button'),dialog=page.locator('#dol-midnight-controls');
 async function swipe(node:typeof title,dx:number,dy:number,cancel=false){
  const box=await node.boundingBox();assert.ok(box);
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=4;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/4,y:y+dy*i/4}]});
  await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
 }
 const close=dialog.getByRole('button',{name:'关闭',exact:true});
 await opener.tap();assert.equal(await grip.count(),0);
 await swipe(title,0,70);assert.ok(await close.isVisible());
 await close.tap();await dialog.waitFor({state:'hidden'});
 await page.locator('#pull-option').check();await opener.tap();
 const shell=dialog.locator('.dmt-settings-shell');
 const x=await shell.evaluate(el=>el.getBoundingClientRect().x);
 await swipe(title,52,0);
 assert.ok(await shell.evaluate(el=>el.getBoundingClientRect().x)>x+40);
 await grip.tap();await swipe(grip,0,24);await swipe(grip,70,15);await swipe(grip,0,68,true);
 assert.ok(await close.isVisible());assert.equal(records.filter(r=>r.event==='close').length,1);
 const material=dialog.getByRole('button',{name:'材质',exact:true});
 await material.tap();await dialog.getByRole('slider',{name:'Acrylic 通透度',exact:true}).waitFor();
 const scroller=await dialog.evaluateHandle(el=>{
  const nodes=[...el.querySelectorAll<HTMLElement>('*')];
  return nodes.find(n=>n.clientHeight>80&&n.scrollHeight>n.clientHeight+40&&/auto|scroll/.test(getComputedStyle(n).overflowY))!;
 });
 assert.ok(await scroller.evaluate(n=>!!n),'scrollable form');
 const scroll=await scroller.evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.left+r.width*.8,y:r.top+r.height*.75,top:n.scrollTop}});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:scroll.x,y:scroll.y}]});
 for(const d of [12,32,60,90])await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:scroll.x,y:scroll.y-d}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.ok(await scroller.evaluate(n=>n.scrollTop)>scroll.top,'form receives native scrolling');
 for(const origin of ['title','grip']){
  assert.ok(records.some(r=>r.event==='pointermove.after'&&r.pointer?.origin===origin&&
   r.pointer.target==='title'&&r.pointer.capture?.header),origin+' drag captured by header');
 }
 assert.ok(records.some(r=>r.event==='pointerdown.after'&&r.pointer?.origin==='form'&&
  r.pointer.target==='form'&&r.pointer.capture?.region==='form'),'form has its own touch capture');
 const offset=records.length;
 await swipe(grip,2,76);
 await dialog.waitFor({state:'hidden'});
 await page.waitForFunction(()=>document.activeElement?.id==='dol-midnight-sidebar-button');
 const actions=records.slice(offset),request=actions.filter(r=>r.event==='click');
 assert.equal(request.length,1);assert.equal(actions.filter(r=>r.event==='close').length,1);
 const first=actions.find(r=>r.event==='pre-paint'&&r.leaving);
 assert.ok(first);assert.ok(Math.hypot(...first.rect.map((v,i)=>v-request[0]!.rect[i]!))<1);
 const end=actions.at(-1)!;assert.equal(end.acquired,end.released);
 // Exercise a reachable reversal while the gesture-triggered exit is running.
 await opener.tap();
 await close.evaluate(el=>{
  el.addEventListener('click',()=>{
   const shell=el.closest('dialog')!.querySelector('.dmt-settings-shell')!;
   requestAnimationFrame(()=>{
    const exit=shell.getAnimations()[0];
    if(!exit||exit.playbackRate>=0){el.setAttribute('data-test-reversal','failed');return}
    exit.currentTime=Number(exit.effect!.getTiming().duration)/2;
    const before=shell.getBoundingClientRect();
    const ui=(window as Window & {DoLGameUI?:{openSettings():void}}).DoLGameUI;
    if(!ui)throw Error('Official settings entry unavailable');
    ui.openSettings();
    const after=shell.getBoundingClientRect();
    el.setAttribute('data-test-reversal',String(shell.getAnimations()[0]===exit&&exit.playbackRate>0&&
     Math.hypot(after.x-before.x,after.y-before.y)<1));
   });
  },{once:true});
 });
 await swipe(grip,0,72);
 await page.waitForFunction(()=>document.querySelector('.dmt-close')?.hasAttribute('data-test-reversal'));
 assert.equal(await close.getAttribute('data-test-reversal'),'true');
 await close.tap();await dialog.waitFor({state:'hidden'});
 assert.equal(records.at(-1)!.released,3);
 assert.deepEqual(errors,[]);
 console.log(browser.version(),{before:request[0]!.rect,first:first.rect,acquired:end.acquired,released:end.released,focus:end.focus});
} finally {await browser.close()}
