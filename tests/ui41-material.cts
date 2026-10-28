import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import type {Preferences,PreferenceKey} from '../src/theme/preferences';
type Theme={openSettings():void;setPreference(key:PreferenceKey,value:boolean|number):void;getPreferences():Preferences;destroy():void};
declare const DoLMidnightTheme:Theme;
declare const hubPreview:typeof import('../prototypes/evolution-integration/hub-preview').hubPreview;
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing material fixture');return value}
(async()=>{
 const {acrylicDefault}=await import('../src/theme/acrylic.ts');
 const {createUi41PreviewServer}=await import('../scripts/preview-ui41.mjs');
 const server=await createUi41PreviewServer(0),browser=await playwright.chromium.launch(browserOptions);
 const address=server.httpServer?.address();if(!address||typeof address==='string')throw Error('Missing review port');
 const url=`http://127.0.0.1:${address.port}/?settings`,out=path.resolve('tests/artifacts/ui41/material-'+Date.now());fs.mkdirSync(out,{recursive:true});
 const rows:unknown[]=[],errors:string[]=[];
 try{
 for(const [width,height] of [[1280,900],[390,844]] as const){
  const page=await browser.newPage({viewport:{width,height}});await page.emulateMedia({reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.waitForFunction(()=>!!document.querySelector<HTMLDialogElement>('dialog')?.open);
  await page.getByRole('button',{name:'材质',exact:true}).click();
  const slider=page.getByRole('slider',{name:'Acrylic 通透度',exact:true});await slider.waitFor();
  const sample=(legacy=false)=>page.evaluate(legacy=>{const root=document.documentElement;if(legacy)root.removeAttribute('data-dgu-acrylic-adjustment');try{const n=document.querySelector<HTMLElement>('.dmt-settings-shell'),label=document.querySelector<HTMLElement>('.dmt-acrylic-control strong'),well=document.querySelector<HTMLElement>('.dmt-control-sheet');if(!n||!label||!well)throw Error('Missing material nodes');const c=getComputedStyle(n),r=n.getBoundingClientRect();return{background:c.backgroundColor,blur:c.backdropFilter,well:getComputedStyle(well).backgroundColor,textOpacity:getComputedStyle(label).opacity,textColor:getComputedStyle(label).color,opacity:c.opacity,rect:{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}}}finally{if(legacy)root.setAttribute('data-dgu-acrylic-adjustment','')}},legacy);
  // Disable only the new material axis to sample the retained 4.0.1 cascade.
  const legacy=await sample(true);
  const baseline=await sample();
  for(const value of [0,25,50,acrylicDefault,75,100]){
   await slider.fill(String(value));const actual=await sample();
   assert.equal(actual.opacity,'1');assert.equal(actual.textOpacity,'1');assert.equal(actual.textColor,baseline.textColor);assert.deepEqual(actual.rect,baseline.rect);
   if(value===0){
    const shell=actual.background.match(/[\d.]+/g)!.slice(0,3).map(Number),well=actual.well.match(/[\d.]+/g)!.slice(0,3).map(Number);
    assert.ok(Math.min(...shell)>=42&&Math.max(...shell)<=52&&Math.max(...shell)-Math.min(...shell)<=5,'dense endpoint is subdued neutral gray, neither bright nor near black');
    assert.ok(Math.min(...well)>=36&&Math.max(...well)<=46,'inner well stays subdued gray without re-blackening the endpoint');
   }
   if(value===100){assert.equal(actual.background,legacy.background);assert.equal(actual.blur,legacy.blur);assert.equal(actual.well,legacy.well,'clear endpoint restores 4.0.1 control-plane material');}
   assert.ok(actual.rect.x>=0&&actual.rect.right<=width+1&&actual.rect.bottom<=height+1,'shell fits viewport');
   rows.push({width,value,...actual});
   if([0,acrylicDefault,100].includes(value))await page.screenshot({path:path.join(out,`material-${width}-${value}.png`)});
  }
  await page.getByRole('button',{name:'恢复默认通透度',exact:true}).click();assert.equal(await slider.inputValue(),String(acrylicDefault));
  assert.match((await sample()).background,/0\.43/);assert.match((await sample()).well,/0\.28/);assert.match((await sample()).blur,/blur\(24px\)/);
  await slider.focus();await page.keyboard.press('ArrowRight');assert.equal(await slider.inputValue(),String(acrylicDefault+1));
  await page.evaluate(()=>{DoLMidnightTheme.setPreference('acrylicTransparency',NaN);DoLMidnightTheme.setPreference('acrylicTransparency',Infinity)});assert.equal(await slider.inputValue(),String(acrylicDefault+1));
  await page.evaluate(()=>DoLMidnightTheme.setPreference('acrylicTransparency',250));assert.equal(await slider.inputValue(),'100');
  await page.evaluate(()=>DoLMidnightTheme.setPreference('acrylicTransparency',-20));assert.equal(await slider.inputValue(),'0');
  await slider.fill('73');await page.getByLabel('玻璃模糊',{exact:true}).uncheck();assert.equal(await slider.isDisabled(),true);assert.equal((await sample()).blur,'none');
  await page.getByLabel('玻璃模糊',{exact:true}).check();assert.equal(await slider.inputValue(),'73');
  await page.getByRole('button',{name:'阅读',exact:true}).click();await page.getByLabel('选项文字对齐',{exact:true}).selectOption('center');
  assert.equal(await page.locator('html').evaluate(n=>n.hasAttribute('data-dgu-options-centered')),true);
  assert.equal(await page.getByRole('button',{name:'阅读',exact:true}).evaluate(n=>getComputedStyle(n).textAlign),'center');
  await page.reload();await page.waitForFunction(()=>!!document.querySelector<HTMLDialogElement>('dialog')?.open);
  assert.equal(await page.getByLabel('选项文字对齐',{exact:true}).inputValue(),'center');
  await page.getByRole('button',{name:'材质',exact:true}).click();assert.equal(await page.getByLabel('Acrylic 通透度',{exact:true}).inputValue(),'73');
  // Native modal blocks background activation; a direct page click must time out.
  let blocked=false;try{await page.locator('#body-action').click({timeout:250})}catch{blocked=true}assert.equal(blocked,true);
  const before=await page.locator('#notice').innerText();await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector<HTMLDialogElement>('dialog')?.open);await page.locator('#body-action').click();assert.notEqual(await page.locator('#notice').innerText(),before);
  await page.evaluate(()=>DoLMidnightTheme.setPreference('visualGlass',false));
  for(const mode of ['fan','grid'] as const){
   await page.evaluate(m=>hubPreview.floating.setPreference('mode',m),mode);const ball=page.locator('.sf-motion-ball');await ball.click();await page.locator('.sf-motion-orbit.is-expanded').waitFor();
   const fills=await page.locator('.sf-motion-orbit.is-expanded .sf-motion-petal').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).backgroundColor));assert.ok(fills.length===5&&fills.every(x=>x==='rgb(41, 41, 44)'),'review Hub keeps opaque glass-off tool surfaces');
   if(mode==='grid')assert.equal(await page.locator('.sf-motion-orbit.is-expanded').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(41, 41, 44)');
   assert.equal(await page.locator('.sf-motion-tool-label').first().evaluate(n=>getComputedStyle(n).textAlign),'center');
   await ball.press('Escape');await page.waitForFunction(()=>document.querySelector('.sf-motion-ball')?.getAttribute('aria-expanded')==='false');
  }
  await page.evaluate(()=>DoLMidnightTheme.setPreference('enabled',false));assert.equal(await page.locator('html').getAttribute('data-dgu-options-centered'),null);assert.equal(await page.locator('html').getAttribute('data-dgu-acrylic-adjustment'),null);
  await page.evaluate(()=>DoLMidnightTheme.setPreference('enabled',true));assert.equal(await page.locator('html').evaluate(n=>n.hasAttribute('data-dgu-options-centered')),true);
  await page.evaluate(()=>DoLMidnightTheme.destroy());assert.equal(await page.locator('html').getAttribute('data-dgu-acrylic-adjustment'),null);assert.equal(await page.locator('html').evaluate(n=>(n as HTMLElement).style.getPropertyValue('--dgu-acrylic-axis-shell-alpha')),'');
  await page.close();
 }
 // Storage failure applies the current choice but cannot promise persistence.
 const p=await browser.newPage({viewport:{width:1280,height:900}});await p.emulateMedia({reducedMotion:'reduce'});await p.goto(url);await p.waitForFunction(()=>!!document.querySelector<HTMLDialogElement>('dialog')?.open);
 await p.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('controlled storage failure')};DoLMidnightTheme.setPreference('acrylicTransparency',23)});
 assert.equal(await p.evaluate(()=>DoLMidnightTheme.getPreferences().acrylicTransparency),23);assert.match(await p.locator('.dmt-settings-footer').innerText(),/无法保存/);await p.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({node:process.version,browser:browser.version(),scope:'Controlled source preview; no game, device, visual or performance acceptance',rows,errors},null,2));
 console.log('PASS material: neutral-gray dense endpoint, V1 default, 4.0.1 clear endpoint, input validation, storage/reload/failure, text opacity, modal input, master and cleanup; '+out);
 }catch(error){fs.writeFileSync(path.join(out,'failure.txt'),String(error));throw error}finally{await browser.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
