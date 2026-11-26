import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createLabServer} from '../panel-budget/server.mts';

const baseline=process.argv.includes('--baseline');
const server=await createLabServer(); await server.listen();
const address=server.httpServer!.address(); assert.ok(address && typeof address==='object');
const browser=await chromium.launch({channel:process.env.HOST5_BROWSER || 'chrome'});
try {
 const page=await browser.newPage({viewport:{width:900,height:820},reducedMotion:'no-preference'});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const path=baseline ? '/tests/artifacts/viewport-freeze-6552b8e/prototypes/host5/composition/' : '/prototypes/host5/composition/';
 await page.goto(`http://127.0.0.1:${address.port}${path}?play=host`);
 await page.waitForFunction(()=>!!window.composition);
 const before=await page.evaluate(()=>{
  document.querySelector<HTMLButtonElement>('#toggle')!.click();
  const drift=document.querySelector<HTMLElement>('.drift')!,signal=document.querySelector<HTMLElement>('.signal')!;
  const sky=drift.getAnimations()[0]!,panel=signal.getAnimations()[0]!;
  if(!sky||!panel)throw Error('both animations must be active');
  sky.currentTime=4000;panel.currentTime=70;sky.playbackRate=.01;panel.playbackRate=.01;
  Object.assign(window,{viewportAnimations:{sky,panel}});
  return {wall:performance.now(),stage:document.querySelector('#stage')!.getBoundingClientRect().width,signal:signal.offsetWidth,
   skyTime:Number(sky.currentTime),panelTime:Number(panel.currentTime),states:[sky.playState,panel.playState],tracks:window.composition.counts().tracks};
 });
 assert.deepEqual(before.states,['running','running']);assert.equal(before.tracks,2);
 await page.setViewportSize({width:700,height:820});
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 const after=await page.evaluate(()=>{
  const saved=(window as Window & {viewportAnimations?: {sky:Animation;panel:Animation}}).viewportAnimations;
  if(!saved) throw Error('Missing baseline track identities');
  const drift=document.querySelector<HTMLElement>('.drift')!,signal=document.querySelector<HTMLElement>('.signal')!;
  const sky=drift.getAnimations()[0],panel=signal.getAnimations()[0];
  return {wall:performance.now(),stage:document.querySelector('#stage')!.getBoundingClientRect().width,signal:signal.offsetWidth,
   oldStates:[saved.sky.playState,saved.panel.playState],same:[saved.sky===sky,saved.panel===panel],
   oldTimes:[saved.sky.currentTime,saved.panel.currentTime],newTimes:[sky?.currentTime??null,panel?.currentTime??null],tracks:window.composition.counts().tracks};
 });
 assert.ok(after.stage<before.stage,JSON.stringify({before,after}));
 assert.ok(Math.abs(after.signal-before.signal)<.1,JSON.stringify({before,after}));
 if(baseline){assert.deepEqual(after.oldStates,['idle','idle']);assert.deepEqual(after.same,[false,false]);}
 else {assert.deepEqual(after.oldStates,['running','running']);assert.deepEqual(after.same,[true,true]);assert.equal(after.tracks,2);
  const maxAdvance=(after.wall-before.wall)*.01+2;
  for(const [i,initial] of [before.skyTime,before.panelTime].entries()){
   const advance=Number(after.oldTimes[i])-initial;
   assert.ok(advance>0 && advance<=maxAdvance,'original timeline advances across viewport resize');
  }}
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({mode:baseline?'baseline':'current',browser:browser.version(),before,after},null,2));
 await page.close();
} finally {await browser.close();await server.close()}
