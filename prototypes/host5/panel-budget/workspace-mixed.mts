// Both production ZIPs run against a neutral owner of native show/hide and actions.
import type {GameUiControls} from '../../../src/runtime/game-controls';
import assert from 'node:assert/strict';
import {chromium,type Page} from 'playwright';
import {neutralWeatherStory} from './weather/neutral-story.mts';
import {createLabServer} from './server.mts';
import {loadPackage,readPackage} from './package-input.mts';

const [hostPath,uiPath,formatPath]=process.argv.slice(2);
assert.ok(hostPath&&uiPath,'Pass candidate Host and official UI ZIPs');
const host=readPackage(hostPath,'StoneFreeHost'),ui=readPackage(uiPath,'DoLGameUI');
const server=await createLabServer();await server.listen();
const address=server.httpServer!.address();assert.ok(address&&typeof address==='object');
const browser=await chromium.launch({channel:'chrome'});
const frames=(p:Page)=>p.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 page.setDefaultTimeout(5000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+address.port+'/panel-test');
 await page.evaluate(()=>{
  document.body.innerHTML='<div id="sky"></div><aside id="ui-bar"><div id="overlayButtons"><button class="link-internal macro-button" id="native-open">Attributes</button><button class="link-internal macro-button" id="social-open">Social</button></div></aside><div id="customOverlayContainer"><section id="customOverlay" class="hidden" data-overlay="characteristics"><header id="customOverlayTitle" tabindex="-1">Workspace <button id="native-close">Close</button></header><div id="customOverlayContent"><section id="characteristics-display"><h3 id="base-characteristics">Group</h3><button id="action">Neutral action</button></section></div></section></div>';
  const el=(s:string)=>document.querySelector<HTMLElement>(s)!;
  const overlay=el('#customOverlay');
  const content=el('#customOverlayContent'),attributes=content.firstElementChild!;
  el('#native-open').onclick=()=>{overlay.dataset.overlay='characteristics';content.replaceChildren(attributes);overlay.classList.remove('hidden')};
  el('#social-open').onclick=()=>{overlay.dataset.overlay='social';content.innerHTML='<section id="relation-display"><h3 id="npc-relations">Group</h3></section>';overlay.classList.remove('hidden')};
  el('#native-close').onclick=()=>overlay.classList.add('hidden');
  el('#action').onclick=()=>el('#action').dataset.calls=String(Number(el('#action').dataset.calls??0)+1);
 });
 await loadPackage(page,host);
 const ambient=await page.evaluateHandle(()=>{
  const host=window.DoLUiHost!;host.sceneReady();
  const sky=document.querySelector<HTMLElement>('#sky')!;
  sky.style.cssText='position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at left,#989aaa,transparent 70%),#383c48';
  const track=host.environmentEffects!.track([{backgroundPositionX:'0vw'},{backgroundPositionX:'15vw'}],120000,2000);
  const play=track.to(sky,true);if(!play)throw Error('Ambient track denied');
  return {track,player:sky.getAnimations()[0]!};
 });
 await loadPackage(page,ui);
 await page.addStyleTag({content:'.hidden{display:none!important}#customOverlay{position:fixed;inset:150px auto auto 390px;width:530px;height:330px}#customOverlayTitle{min-height:50px}#ui-bar{position:relative}#sky{background-size:140% 100%!important}'});
 await page.evaluate(()=>{
  const animate=Element.prototype.animate;
  Element.prototype.animate=function(...args){
   const player=animate.apply(this,args);
   if(player.id==='sf-surface-track'&&(this.matches('.dmt-settings-shell')||this.id==='customOverlay'))this.setAttribute('data-neutral-plays',String(Number(this.getAttribute('data-neutral-plays')??0)+1));
   return player;
  };
 });
 const native=page.locator('#native-open'),overlay=page.locator('#customOverlay'),settings=page.locator('#dol-midnight-controls'),opener=page.locator('#dol-midnight-sidebar-button');
 const settle=async(selector:string)=>page.waitForFunction(sel=>!document.querySelector(sel)?.getAnimations().some(a=>a.id==='sf-surface-track'),selector);
 async function drag(selector:string){
  const header=page.locator(selector),box=await header.boundingBox();assert.ok(box);
  await header.evaluate(n=>n.addEventListener('pointerdown',e=>n.setAttribute('data-probe-pointer',String((e as PointerEvent).pointerId)),{once:true}));
  const x=box.x+34,y=box.y+12;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+42,y+17,{steps:4});await frames(page);
 }
 // High contrast stripes make a lost backdrop blur observable in actual pixels.
 await page.locator('#sky').evaluate(n=>{(n as HTMLElement).style.background='repeating-linear-gradient(90deg,#fff 0 4px,#000 4px 8px)';n.getAnimations().forEach(a=>a.pause())});
 await opener.click();await settle('.dmt-settings-shell');
 assert.equal(await settings.locator('.dmt-settings-shell').getAttribute('data-neutral-plays'),'1');
 await drag('.dmt-settings-header');
 const reversal=await settings.evaluate(async node=>{
  const shell=node.querySelector<HTMLElement>('.dmt-settings-shell')!,before=shell.getBoundingClientRect().x;
  const offset=parseFloat(shell.style.translate);
  if(!(offset>20))throw Error('Header did not move: '+shell.style.translate);
  (node.querySelector('.dmt-close') as HTMLElement).click();
  const exit=shell.getAnimations().find(a=>a.id==='sf-surface-track')!;
  exit.pause();exit.currentTime=45;
  await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));
  const leaving=shell.getBoundingClientRect().x;
  return {jump:Math.abs(before-leaving)};
 });
 await page.mouse.up();
 const shell=settings.locator('.dmt-settings-shell');
 const clip=await shell.boundingBox();assert.ok(clip);
 const screenshot=()=>page.screenshot({animations:'allow',clip});
 const freeze=()=>page.evaluateHandle(()=>document.getAnimations().filter(a=>a.playState==='running').map(a=>{a.pause();return a}));
 const frozenBefore=await freeze();await frames(page);const exitPixels=await screenshot();const exitRepeat=await screenshot();
 await shell.evaluate(n=>(n as HTMLElement).style.setProperty('backdrop-filter','none','important'));await frames(page);const exitNegative=await screenshot();
 await shell.evaluate(n=>(n as HTMLElement).style.removeProperty('backdrop-filter'));await frames(page);const exitRestored=await screenshot();
 const reversed=await settings.evaluate(node=>{
  const shell=node.querySelector<HTMLElement>('.dmt-settings-shell')!,exit=shell.getAnimations().find(a=>a.id==='sf-surface-track')!,before=shell.getBoundingClientRect().x;
  (window as Window & {DoLGameUI?:GameUiControls}).DoLGameUI!.openSettings();
  const result={jump:Math.abs(before-shell.getBoundingClientRect().x),same:shell.getAnimations().includes(exit),rate:exit.playbackRate};exit.pause();exit.currentTime=45;return result;
 });
 const frozenAfter=await freeze();await frames(page);const reversePixels=await screenshot();const reverseRepeat=await screenshot();
 await shell.evaluate(n=>(n as HTMLElement).style.setProperty('backdrop-filter','none','important'));
 await frames(page);const negativePixels=await screenshot();const negativeRepeat=await screenshot();
 await shell.evaluate(n=>(n as HTMLElement).style.removeProperty('backdrop-filter'));
 const pixelDiff=async(a:Buffer,b:Buffer)=>page.evaluate(async ([left,right]:[string,string])=>{
  const decode=async(data:string)=>{const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);return ctx.getImageData(0,0,canvas.width,canvas.height)};
  const x=await decode(left),y=await decode(right);if(x.width!==y.width||x.height!==y.height)throw Error('screenshot geometry differs');let sum=0;for(let i=0;i<x.data.length;i+=4)for(let j=0;j<3;j++)sum+=Math.abs(x.data[i+j]!-y.data[i+j]!);return sum/(x.width*x.height*3);
 },[a.toString('base64'),b.toString('base64')] as [string,string]);
 const pixels={exitNoise:await pixelDiff(exitPixels,exitRepeat),reverseNoise:await pixelDiff(reversePixels,reverseRepeat),negativeNoise:await pixelDiff(negativePixels,negativeRepeat),sameProgress:await pixelDiff(exitRepeat,reversePixels),exitNoBlur:await pixelDiff(exitRepeat,exitNegative),exitRestored:await pixelDiff(exitRepeat,exitRestored),noBlur:await pixelDiff(reverseRepeat,negativePixels),noBlurRepeat:await pixelDiff(reversePixels,negativeRepeat)};
 assert.ok(reversal.jump<1&&reversed.jump<1&&reversed.same&&reversed.rate>0,JSON.stringify({reversal,reversed}));
 assert.ok(Math.min(pixels.exitNoBlur,pixels.noBlur,pixels.noBlurRepeat)>5 && pixels.exitNoBlur>Math.max(pixels.exitNoise,pixels.exitRestored)*2 && Math.min(pixels.noBlur,pixels.noBlurRepeat)>Math.max(pixels.reverseNoise,pixels.negativeNoise)*2,JSON.stringify(pixels));
 await shell.evaluate(n=>n.getAnimations().find(a=>a.id==='sf-surface-track')!.play());
 await frozenBefore.evaluate(players=>players.forEach(player=>{if(player.playState==='paused')player.play()}));await frozenBefore.dispose();
 await frozenAfter.evaluate(players=>players.forEach(player=>{if(player.playState==='paused')player.play()}));await frozenAfter.dispose();
 await ambient.evaluate(({player})=>player.play());
 await page.keyboard.press('Escape');await settings.waitFor({state:'hidden'});
 assert.ok(await opener.evaluate(n=>n===document.activeElement));
 await native.click();await page.locator('#customOverlay[data-dgu-attributes-drag-ready]').waitFor();
 assert.equal(await overlay.getAttribute('data-neutral-plays'),'1','native entry admitted while ambient is running');
 await drag('#customOverlayTitle');
 assert.ok(await overlay.evaluate(n=>parseFloat((n as HTMLElement).style.translate)>20));
 await page.evaluate(()=>window.visualViewport!.dispatchEvent(new Event('resize')));
 await frames(page);await page.mouse.up();
 assert.equal(await overlay.evaluate(n=>(n as HTMLElement).style.translate),'','viewport resize relinquishes drag and restores layout');
 await page.locator('#action').click();assert.equal(await page.locator('#action').getAttribute('data-calls'),'1');
 await page.locator('#native-close').click();await overlay.waitFor({state:'hidden'});
 await page.waitForFunction(()=>!document.querySelector('.kw-context-plane'));
 assert.ok(await native.evaluate(n=>n===document.activeElement));
 assert.ok(await ambient.evaluate(({player})=>player.playState==='running'&&Number(player.currentTime)>0));
 // Reopen via the native button during the trailing scrim, after native hide.
 await native.click();await page.locator('#customOverlay[data-dgu-attributes-drag-ready]').waitFor();
 await settle('#customOverlay');await settle('.kw-context-plane');
 const nativeReverse=await page.evaluate(async()=>{
  const plane=document.querySelector<HTMLElement>('.kw-context-plane')!;
  const frame=()=>new Promise<void>(r=>requestAnimationFrame(()=>r()));
  document.querySelector<HTMLButtonElement>('#native-close')!.click();
  for(let i=0;i<8&&!plane.getAnimations().length;i++)await frame();
  const player=plane.getAnimations().find(a=>a.id==='sf-surface-track');
  if(!player||player.playbackRate>=0)throw Error('Missing native exit track');
  player.pause();player.currentTime=45;
  document.querySelector<HTMLButtonElement>('#native-open')!.click();
  for(let i=0;i<8&&player.playbackRate<0;i++)await frame();
  return player.playbackRate>0&&plane.isConnected&&plane.getAnimations().includes(player);
 });
 assert.ok(nativeReverse,'native owner reopened while the same surviving scrim reversed');
 // Switch kind through the real social opener while the previous owner's exit is still in flight.
 await page.locator('#native-close').click();
 const oldExit=await page.evaluateHandle(async()=>{
  for(let i=0;i<8;i++){
   const exit=document.querySelector('.kw-context-plane')?.getAnimations().find(a=>a.id==='sf-surface-track'&&a.playbackRate<0);
   if(exit){exit.pause();exit.currentTime=45;return exit}
   await new Promise<void>(r=>requestAnimationFrame(()=>r()));
  }
  throw Error('No old exit to switch during');
 });
 await page.locator('#social-open').click();await page.locator('[data-dgu-workspace-drag-ready]').waitFor();
 await oldExit.evaluate(exit=>{if(exit.playState!=='idle')exit.play()});await oldExit.dispose();
 await page.locator('#customOverlayTitle').evaluate(n=>(n as HTMLElement).focus());
 await page.waitForTimeout(700);
 assert.equal(await overlay.getAttribute('data-overlay'),'social');
 assert.ok(await overlay.isVisible());
 assert.ok(await page.locator('#customOverlayTitle').evaluate(n=>document.activeElement===n));
 assert.ok(await page.locator('.kw-context-plane').count(),'old exit must not remove the new owner scrim');
 await drag('#customOverlayTitle');
 assert.ok(await overlay.evaluate(n=>parseFloat((n as HTMLElement).style.translate)>20));
 const cancelled=await page.locator('#customOverlayTitle').evaluate(title=>{
  const id=Number(title.getAttribute('data-probe-pointer'));
  const captured=title.hasPointerCapture(id);
  title.dispatchEvent(new PointerEvent('pointercancel',{pointerId:id,bubbles:true}));
  return captured&&!title.hasPointerCapture(id);
 });
 assert.ok(cancelled,'cancelling a captured title pointer relinquishes it without closing the window');
 await page.mouse.up();assert.ok(await overlay.isVisible());
 await drag('#customOverlayTitle');
 // The native owner replaces the contents of its still-open shell during a drag.
 // A partial adapter must acquire neither its playback nor its previous title.
 await overlay.evaluate(n=>{(n as HTMLElement).dataset.overlay='unreviewed';n.setAttribute('data-dgu-adapter','ModHubSoftWet');n.setAttribute('data-dgu-adapter-match','partial');n.querySelector('#customOverlayContent')!.replaceChildren()});
 await page.waitForFunction(()=>!document.querySelector('[data-dgu-workspace-material],.kw-context-plane'));
 await page.mouse.up();
 assert.equal(await overlay.evaluate(n=>(n as HTMLElement).style.translate),'');
 await overlay.evaluate(n=>{n.removeAttribute('data-dgu-adapter');n.removeAttribute('data-dgu-adapter-match')});
 await page.locator('#native-close').click();
 const beforeReduced=await overlay.getAttribute('data-neutral-plays');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>!document.querySelector('#sky')!.getAnimations().length);
 await native.click();await page.locator('#action').click();assert.equal(await page.locator('#action').getAttribute('data-calls'),'2');
 assert.equal(await overlay.getAttribute('data-neutral-plays'),beforeReduced,'reduced motion leaves action live without playback');
 await page.locator('#native-close').click();await opener.click();
 await settings.getByRole('button',{name:'材质',exact:true}).click();await settings.getByLabel('玻璃模糊',{exact:true}).uncheck();
 assert.equal(await settings.locator('.dmt-settings-shell').evaluate(n=>getComputedStyle(n).backdropFilter),'none');
 await page.keyboard.press('Escape');await settings.waitFor({state:'hidden'});
 await ambient.evaluate(({track})=>track.release());
 await page.evaluate(()=>window.DoLUiHost!.dispose());await frames(page);
 assert.equal(await page.locator('#dol-midnight-controls,.kw-context-plane,[data-dgu-attributes-material],#sky [data-sf-owner]').count(),0);
 assert.deepEqual(errors,[]);
 if(formatPath){
  const story=await browser.newPage({viewport:{width:1280,height:900}});
  story.setDefaultTimeout(6000);
  const neutral=neutralWeatherStory(formatPath);
  await story.route('http://127.0.0.1/neutral',r=>r.fulfill({contentType:'text/html',body:neutral}));
  await story.goto('http://127.0.0.1/neutral');
  await story.getByRole('link',{name:'Page A'}).waitFor();
  await story.evaluate(()=>{const buttons=document.createElement('div');buttons.id='overlayButtons';document.querySelector('#ui-bar-body')!.prepend(buttons)});
  await loadPackage(story,host);await loadPackage(story,ui);
  await story.locator('#dol-midnight-sidebar-button').click();
  await story.waitForFunction(()=>{const n=document.querySelector('.dmt-settings-shell');return n&&!n.getAnimations().length});
  const header=story.locator('.dmt-settings-header'),box=await header.boundingBox();assert.ok(box);
  await header.evaluate(n=>n.addEventListener('pointerdown',e=>n.setAttribute('data-probe-pointer',String((e as PointerEvent).pointerId)),{once:true}));
  await story.mouse.move(box.x+30,box.y+15);await story.mouse.down();
  await story.mouse.move(box.x+68,box.y+33,{steps:4});await frames(story);
  const crossed=await header.evaluate(n=>{
   const shell=n.closest<HTMLElement>('.dmt-settings-shell')!,id=Number(n.getAttribute('data-probe-pointer'));
   const moving=n.hasPointerCapture(id)&&parseFloat(shell.style.translate)>20;
   const engine=(window as Window & {SugarCube?:{Engine:{play(name:string):void}}}).SugarCube!.Engine;
   engine.play('Page A');
   return {moving,released:!n.hasPointerCapture(id),position:shell.style.translate};
  });
  assert.deepEqual(crossed,{moving:true,released:true,position:''});
  await story.getByRole('link',{name:'Page B'}).waitFor({state:'attached'});
  await story.mouse.up();await story.close();
  console.log('SugarCube 2.37.3 neutral passage change during held settings drag:',crossed);
 }
 console.log(browser.version(),{host:host.sha,ui:ui.sha,reversal,reversed,pixels,nativeReverse,cancelled,socialOwnerReleased:true,nativeActions:2,ambientContinued:true,cleanup:true});
}finally{await browser.close();await server.close()}
