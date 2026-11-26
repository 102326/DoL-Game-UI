import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createLabServer} from '../server.mts';
import type {} from './lab.ts';

const server=await createLabServer();await server.listen();
const address=server.httpServer!.address();assert.ok(address && typeof address==='object');
const browser=await chromium.launch();
try{
 for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:820}});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+address.port+'/prototypes/host5/panel-budget/weather/?mode=C&entry=visible');
  const start=page.locator('#start'),close=page.getByRole('button',{name:'Close',exact:true});
  const idle=()=>page.waitForFunction(()=>window.weatherLab.counts().direct===0);
  await start.focus();await page.keyboard.press('Enter');await idle();
  assert.ok(await close.evaluate(el=>el===document.activeElement));
  // Seek an actual closing animation in its originating trusted event. Four
  // reversals in the same task detect restarts below as well as above 60%.
  await close.evaluate(el=>el.addEventListener('click',()=>{
   const layer=el.closest('.dmt-settings-shell')!, track=layer.getAnimations()[0]!;
   const ui=Reflect.get(window,'DoLMidnightTheme');
   for(const time of [25,75,35,80]){
    track.currentTime=time;const before=getComputedStyle(layer).opacity;
    if(track.playbackRate<0)ui.openSettings();else (el as HTMLButtonElement).click();
    if(layer.getAnimations()[0]!==track || before!==getComputedStyle(layer).opacity ||
       Math.abs(Number(track.currentTime)-time)>1 || document.activeElement!==el)throw Error('Reversal reset time, focus or opacity');
   }
   ui.openSettings();
   if(track.playbackRate<=0)throw Error('Reopen did not resume forward');
  },{once:true}));
  await page.keyboard.press('Enter');await idle();
  assert.ok(await close.isVisible());assert.ok(await close.evaluate(n=>document.activeElement===n));
  await page.keyboard.press('Enter');await close.waitFor({state:'hidden'});
  assert.ok(await start.evaluate(n=>document.activeElement===n));
  const toggle=page.getByRole('button',{name:'Inspector',exact:true});await toggle.focus();
  for(let i=0;i<8;i++)await page.keyboard.press('Enter');
  await idle();assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  assert.ok(await toggle.evaluate(n=>(n.getRootNode() as ShadowRoot).activeElement===n));
  assert.equal(await page.getByRole('button',{name:'Move'}).isVisible(),false);
  const geometry=await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth &&
   document.querySelector('#sky')!.getBoundingClientRect().width===document.querySelector('#inspector')!.getBoundingClientRect().width);
  assert.ok(geometry);
  await page.evaluate(()=>window.weatherLab.dispose());
  assert.deepEqual(await page.evaluate(()=>window.weatherLab.counts()),{shared:0,direct:0});
  assert.deepEqual(errors,[]);console.log('PASS',width,'px: reversal, keyboard focus, rapid input, layout, release');
  await page.close();
 }
}finally{await browser.close();await server.close()}
