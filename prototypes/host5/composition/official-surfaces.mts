// Exercise the installed visual code; the fixture only owns native actions and weather inputs.
import type {Locator,Page} from 'playwright';
import assert from 'node:assert/strict';
import {neutralWeatherStory} from '../panel-budget/weather/neutral-story.mts';
import {withVisibleBrowser} from '../panel-budget/weather/visible-browser.mts';
import {loadPackage,readPackage} from '../panel-budget/package-input.mts';

async function cloudPixels(page:Page,shell:Locator){
 const cloud=shell.locator(':scope>.sf-cloud-layer'),rect=await shell.boundingBox();
 assert.ok(rect);
 const clip={x:Math.ceil(rect.x+8),y:Math.ceil(rect.y+8),width:Math.floor(rect.width-16),height:Math.min(160,Math.floor(rect.height-16))};
 const bandEnd=await cloud.evaluate(n=>n.getBoundingClientRect().bottom)-clip.y;
 const image=async()=> (await page.screenshot({clip})).toString('base64');
 // Wait for the entrance first, then freeze unrelated UI decorations at the same sample.
 await page.waitForFunction(n=>!n?.getAnimations().length,await shell.elementHandle());
 const frozen=await page.evaluateHandle(()=>{const running=document.getAnimations().filter(a=>a.playState==='running');running.forEach(a=>a.pause());return running});
 await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
 const before=await image();
 await cloud.locator('.sf-cloud-texture').evaluate(n=>{(n as HTMLElement).style.backgroundImage='none'});
 const hidden=await image();
 await cloud.locator('.sf-cloud-texture').evaluate(n=>{(n as HTMLElement).style.removeProperty('background-image')});
 await frozen.evaluate(list=>list.forEach(a=>{if(a.playState==='paused')a.play()}));await frozen.dispose();
 return page.evaluate(async({before,hidden,bandEnd})=>{
  async function decode(src:string){
   const img=new Image();img.src='data:image/png;base64,'+src;await img.decode();
   const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
   const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);return ctx.getImageData(0,0,img.width,img.height);
  }
  const x=await decode(before),y=await decode(hidden);
  let rim=0,body=0;const outside:number[][]=[];
  for(let i=0;i<x.data.length;i+=4){
   if(![0,1,2].some(k=>Math.abs(x.data[i+k]!-y.data[i+k]!)>3))continue;
   const row=Math.floor(i/4/x.width);if(row<bandEnd)rim++;else if(row>=Math.ceil(bandEnd)+1){body++;if(outside.length<8)outside.push([i/4%x.width,row,x.data[i]!,y.data[i]!])}
  }
  return {rim,body,outside,bandEnd};
 },{before,hidden,bandEnd});
}

const [hostZip,uiZip,storyZip]=process.argv.slice(2);
assert.ok(hostZip&&uiZip,'Pass candidate Host and UI player ZIPs');
const host=readPackage(hostZip,'StoneFreeHost'),ui=readPackage(uiZip,'DoLGameUI');
await withVisibleBrowser(async browser=>{
 const context=browser.contexts()[0]!;
 const page=context.pages()[0]!;await page.setViewportSize({width:1280,height:900});page.setDefaultTimeout(6000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='warning')console.warn(msg.text())});
 const url='http://127.0.0.1/composition';
 await page.route('**/*',r=>r.request().url()===url?r.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}):r.abort());
 await page.goto(url);
 await page.evaluate(()=>{
  Object.assign(window,{Weather:{name:'heavyClouds',precipitation:'none',overcast:.9}});
  document.body.innerHTML='<aside id="ui-bar"><div id="overlayButtons"><button id="attributes" class="link-internal macro-button">Attributes</button></div></aside><main id="customOverlayContainer"><section id="customOverlay" class="hidden" data-overlay="characteristics"><header id="customOverlayTitle">Workspace <button id="close">Close</button></header><div id="customOverlayContent"><section id="characteristics-display"><h3 id="base-characteristics">Neutral reading area</h3><button id="action">Increment</button></section></div></section></main>';
  const overlay=document.querySelector<HTMLElement>('#customOverlay')!;
  document.querySelector<HTMLButtonElement>('#attributes')!.onclick=()=>overlay.classList.remove('hidden');
  document.querySelector<HTMLButtonElement>('#close')!.onclick=()=>overlay.classList.add('hidden');
  const action=document.querySelector<HTMLButtonElement>('#action')!;
  action.onclick=()=>action.dataset.count=String(Number(action.dataset.count??0)+1);
 });
 await loadPackage(page,host);await page.evaluate(()=>window.DoLUiHost!.sceneReady());await loadPackage(page,ui);
 await page.addStyleTag({content:'.hidden{display:none!important}#customOverlay{position:fixed;inset:160px auto auto 250px;width:670px;height:400px}#customOverlayTitle{min-height:48px}'});
 const settings=page.locator('#dol-midnight-controls');
 const settingsShell=settings.locator('.dmt-settings-shell');
 const native=page.locator('#customOverlay'),opener=page.locator('#dol-midnight-sidebar-button');
 const motion=(key:string)=>page.waitForFunction(key=>document.querySelector('[data-sf-mount="cloud.'+key+'"] .sf-cloud-texture')?.getAnimations().some(a=>a.playState==='running'),key);
 const retired=async()=>{
  await page.waitForFunction(()=>!window.DoLUiHost!.getDiagnostics().mounts.some(m=>m.id.startsWith('cloud.')));
  assert.equal(await page.locator('.sf-cloud-layer').count(),0,'retired Host mount left a cloud DOM layer');
 };
 await page.locator('#attributes').click();
 if(process.argv.includes('--legacy')){
  assert.equal(await page.evaluate(()=>typeof window.DoLUiHost!.layerPresets?.driftingTexture),'undefined');
  await page.locator('.sf-weather-canvas[data-weather="cloud"]').waitFor({state:'attached'});
  await page.locator('#action').click();
  assert.equal(await page.locator('#action').getAttribute('data-count'),'1');
  await opener.click();await settings.locator('.sf-weather-canvas[data-weather="cloud"]').waitFor({state:'attached'});
  await settings.getByRole('button',{name:'材质',exact:true}).click();
  const toggle=settings.getByLabel('窗口天气',{exact:true});
  await toggle.uncheck();await page.waitForFunction(()=>!document.querySelector('.sf-weather-canvas,.kw-heading-weather'));
  await toggle.check();await settings.locator('.sf-weather-canvas').waitFor({state:'attached'});
  await page.keyboard.press('Escape');await settings.waitFor({state:'hidden'});
  assert.ok(await opener.evaluate(n=>n===document.activeElement));
  assert.equal(await page.locator('.sf-cloud-layer').count(),0);
  assert.deepEqual(errors,[]);console.log(browser.version(),host.sha,ui.sha,'legacy weather on both entry points, toggle, action and focus passed');
  return;
 }
 await motion('native');
 const composition=await native.evaluate(n=>{
  const el=n.querySelector<HTMLElement>('.sf-cloud-layer')!,rect=el.getBoundingClientRect(),root=n.getBoundingClientRect();
  const control=n.querySelector<HTMLButtonElement>('#action')!,b=control.getBoundingClientRect();
  return {texture:getComputedStyle(el.firstElementChild!).backgroundImage.startsWith('url("data:image/png'),blur:getComputedStyle(n).backdropFilter,inert:el.inert,
   hit:document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)===control,band:rect.height,body:root.height};
 });
 assert.ok(composition.texture&&composition.blur.includes('blur(')&&composition.inert&&composition.hit&&composition.band>0&&composition.band<=composition.body*.23+1,JSON.stringify(composition));
 await page.locator('#action').click();assert.equal(await page.locator('#action').getAttribute('data-count'),'1');
 const nativePixels=await cloudPixels(page,native);assert.ok(nativePixels.rim>50&&nativePixels.body===0,JSON.stringify(nativePixels));
 const oldTexture=await native.locator('.sf-cloud-texture').elementHandle();assert.ok(oldTexture);
 // Count synchronous foreground admission at the real click, before its short track can finish.
 await opener.evaluate(n=>n.addEventListener('click',()=>n.setAttribute('data-probe-enter',String(document.querySelector('.dmt-settings-shell')!.getAnimations().some(a=>a.id==='sf-surface-track'))),{once:true}));
 await opener.click();assert.equal(await opener.getAttribute('data-probe-enter'),'true');await motion('settings');
 assert.equal(await oldTexture.evaluate(n=>n.getAnimations().length),0);
 assert.ok(await settingsShell.evaluate(n=>getComputedStyle(n).backdropFilter.includes('blur(')));
 const settingsPixels=await cloudPixels(page,settingsShell);assert.ok(settingsPixels.rim>50&&settingsPixels.body===0,JSON.stringify(settingsPixels));
 const texture=await settings.locator('.sf-cloud-texture').elementHandle();assert.ok(texture);
 // The isolated headed profile has normal tab visibility and no focus emulation.
 const cover=await context.newPage();await cover.bringToFront();
 await page.waitForFunction(()=>document.hidden,{},{polling:50});
 assert.equal(await texture.evaluate(n=>n.getAnimations().length),0);
 await page.bringToFront();await motion('settings');assert.ok(await texture.evaluate(n=>n.isConnected));await cover.close();
 await settings.getByRole('button',{name:'材质',exact:true}).click();
 const weather=settings.getByLabel('窗口天气',{exact:true}),glass=settings.getByLabel('玻璃模糊',{exact:true});
 if(process.argv.includes('--retain-layer')){
  await page.evaluate(()=>{const remove=Element.prototype.remove;Element.prototype.remove=function(){if(!this.matches('[data-sf-mount="cloud.settings"]'))remove.call(this)}});
 }
 await weather.uncheck();await retired();
 assert.ok(await settingsShell.evaluate(n=>getComputedStyle(n).backdropFilter.includes('blur(')));
 assert.ok(await texture.evaluate(n=>!n.isConnected&&!n.getAnimations().length));
 await weather.check();await motion('settings');
 await glass.uncheck();await retired();
 const plain=await settingsShell.evaluate(n=>[getComputedStyle(n).backdropFilter,getComputedStyle(n).backgroundColor]);
 const nativePlain=await native.evaluate(n=>[getComputedStyle(n).backdropFilter,getComputedStyle(n).backgroundColor]);
 assert.equal(nativePlain[0],'none');assert.match(nativePlain[1]!,/^rgb\(/);
 assert.equal(plain[0],'none');assert.match(plain[1]!,/^rgb\(/);
 await glass.check();await motion('settings');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>!document.querySelector('[data-sf-mount="cloud.settings"] .sf-cloud-texture')!.getAnimations().length);
 assert.ok(await settings.getByLabel('窗口天气',{exact:true}).isEnabled());
 await page.emulateMedia({reducedMotion:'no-preference'});await motion('settings');
 const sameLayer=await settings.evaluate(async n=>{
  const cloud=n.querySelector('.sf-cloud-layer')!;
  (n.querySelector('.dmt-close') as HTMLElement).click();
  const player=n.querySelector('.dmt-settings-shell')!.getAnimations().find(a=>a.id==='sf-surface-track')!;
  player.pause();player.currentTime=50;
  await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));
  const during=n.contains(cloud);
  Reflect.get(window,'DoLGameUI').openSettings();
  return during&&n.querySelector('.sf-cloud-layer')===cloud;
 });
 assert.ok(sameLayer,'reversal replaced a still-visible cloud layer');

 await page.keyboard.press('Escape');await settings.waitFor({state:'hidden'});await motion('native');
 assert.ok(await opener.evaluate(n=>n===document.activeElement));
 await page.evaluate(()=>Object.assign(Reflect.get(window,'Weather'),{name:'clear',overcast:0}));
 await page.locator(':is(#customOverlay,[data-sf-foreground-for="customOverlay"]) .sf-weather-canvas[data-weather="clear"]').waitFor({state:'attached'});await retired();
 await page.evaluate(()=>Object.assign(Reflect.get(window,'Weather'),{name:'heavyClouds',overcast:.9}));await motion('native');
 assert.equal(await page.locator('.sf-weather-canvas').count(),0);
 await native.evaluate(n=>{n.setAttribute('data-dgu-adapter','ModHubSoftWet');n.setAttribute('data-dgu-adapter-match','partial')});
 await retired();
 await page.locator('#action').click();assert.equal(await page.locator('#action').getAttribute('data-count'),'2');
 await native.evaluate(n=>{n.removeAttribute('data-dgu-adapter');n.removeAttribute('data-dgu-adapter-match')});
 await motion('native');await page.locator('#close').click();await retired();
 await opener.click();await motion('settings');
 await page.evaluate(()=>window.DoLUiHost!.dispose());
 assert.equal(await page.locator('.sf-cloud-layer,.sf-weather-canvas').count(),0);
 if(storyZip&&!storyZip.startsWith('--')){
  const story=await context.newPage(),storyUrl='http://127.0.0.1/story',html=neutralWeatherStory(storyZip);
  story.setDefaultTimeout(6000);
  story.on('pageerror',e=>errors.push(e.message));
  await story.route('**/*',r=>r.request().url()===storyUrl?r.fulfill({contentType:'text/html',body:html}):r.abort());
  await story.goto(storyUrl);await story.getByRole('link',{name:'Page A'}).waitFor();
  await story.evaluate(()=>Object.assign(window,{Weather:{name:'heavyClouds',precipitation:'none',overcast:.9}})&&true);
  await loadPackage(story,host);await loadPackage(story,ui);
  await story.getByRole('link',{name:'Page A'}).click();
  const layer=story.locator('[data-sf-mount="cloud.passage"]');await layer.waitFor({state:'attached'});
  const old=await layer.elementHandle();assert.ok(old);
  await story.getByRole('link',{name:'Page B'}).click();
  await story.locator('.passage[data-passage="Page B"] [data-sf-mount="cloud.passage"]').waitFor({state:'attached'});
  assert.equal(await old.evaluate(n=>n.isConnected),false);assert.equal(await layer.count(),1);
  await story.getByRole('link',{name:'End'}).click();
  await layer.waitFor({state:'detached'});
  assert.ok(await story.evaluate(()=>!window.DoLUiHost!.getDiagnostics().mounts.some(m=>m.id==='cloud.passage')));
  console.log('Neutral SugarCube 2.37.3 navigation replaced the old layer, then retired the last mount');
  await story.close();
 }
 assert.deepEqual(errors,[]);
 console.log(browser.version(),host.sha,ui.sha,{composition,nativePixels,settingsPixels,plain,nativePlain,sameLayer,backgroundRecovered:true,foregroundAdmitted:true,cleanup:true});
});
