// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"named","caseSource":"check"}
import ciCases = require('../scripts/ci-cases.cjs');
const {runCase}=ciCases;
// Real settings source and production CSS; all page content is a first-party fixture.
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import cp = require('node:child_process');
import crypto = require('node:crypto');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import evidence = require('./moody-fixture-evidence.cjs');
import oracles = require('./moody-oracles.cjs');
import type {Preferences,PreferenceKey} from '../src/theme/preferences';
type Theme={openSettings():void;setPreference(key:PreferenceKey,value:boolean|number):void;getPreferences():Preferences;destroy():void};
type SettingsAnimation={node:Element;frames:Keyframe[]|PropertyIndexedKeyframes|null;options:number|KeyframeAnimationOptions|undefined;animation:Animation};
declare const theme:Theme,remount:()=>void,settingsAnimations:SettingsAnimation[],retiredAnimations:Animation[],oldDialog:HTMLDialogElement,oldShell:Element,retiredShellAnimation:Animation,frameEffect:(animation:Animation)=>KeyframeEffect,settingsNode:<T extends Element=Element>(selector:string)=>T,lastAnimation:(items:SettingsAnimation[])=>SettingsAnimation,durationMs:(animation:Animation)=>number;
declare let nativeCalls:number;
async function setupFixture(){const {startTheme}=await import('../src/theme/controller.ts');const isTheme=(value:unknown):value is Theme=>!!value&&typeof value==='object'&&typeof Reflect.get(value,'openSettings')==='function'&&typeof Reflect.get(value,'setPreference')==='function'&&typeof Reflect.get(value,'getPreferences')==='function'&&typeof Reflect.get(value,'destroy')==='function';const mount=()=>{startTheme();const candidate:unknown=Reflect.get(window,'DoLMidnightTheme');if(!isTheme(candidate))throw Error('Missing theme fixture API');Object.assign(window,{theme:candidate})};Object.assign(window,{remount:mount});mount()}
function must<T>(value:T|null|undefined):T{if(value===null||value===undefined)throw Error('Missing settings integration value');return value}
async function verifySettingsIntegration(browser:playwright.Browser,{baseline=false}:{baseline?:boolean}={}){
 const revision='34f4217e8e3278b44623bf20e9df692a771f6f90',files=['src/theme/controller.ts','src/theme/SettingsPanel.vue','src/ui/source-motion.ts'];
 const old=baseline?Object.fromEntries(files.map(f=>[f,cp.execFileSync('git',['show',revision+':'+f],{encoding:'utf8'})])):{};
 const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default;
 const server=await createServer({configFile:false,plugins:[vue(),{name:'settings-integration-source',enforce:'pre',load(id){const f=files.find(f=>id.replaceAll('\\','/').endsWith('/'+f));if(f&&baseline)return old[f]},configureServer(s){s.middlewares.use('/__neutral_integration__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<!doctype html><html data-stone-free><body></body></html>')});s.middlewares.use('/__settings_integration__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end(`<!doctype html><html data-stone-free><body><button id="native">Native page action</button><script type="module">(${setupFixture.toString()})()</script></body></html>`)})}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 const checks:Array<{name:string;status:'PASS'|'FAIL';detail?:unknown;error?:string;errors?:string[]}>=[],failures:Array<{name:string;status:'FAIL';error:string;errors:string[]}>=[],out=path.resolve('tests/artifacts/evolution/settings-integration-'+Date.now());fs.mkdirSync(out,{recursive:true});let page:playwright.Page;
 const check=async(name:string,fn:()=>Promise<unknown>)=>{const errors:string[]=[];page=await browser.newPage({viewport:{width:1280,height:900}});const address=must(must(server.httpServer).address());if(typeof address==='string')throw Error('Expected TCP settings address');page.on('pageerror',e=>errors.push(e.message));try{
  await page.goto('http://127.0.0.1:'+address.port+'/__settings_integration__');await page.waitForFunction(()=>typeof theme!=='undefined');await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
   await page.evaluate(()=>{const native=document.querySelector<HTMLButtonElement>('#native');if(!native)throw Error('Missing native fixture button');const effect=(animation:Animation)=>{const value=animation.effect;if(!(value instanceof KeyframeEffect))throw Error('Missing keyframe effect');return value};const node=<T extends Element=Element>(selector:string):T=>{const value=document.querySelector<T>(selector);if(!value)throw Error('Missing settings node '+selector);return value};const last=(items:SettingsAnimation[])=>{const value=items.at(-1);if(!value)throw Error('Missing settings animation');return value};const duration=(animation:Animation)=>{const value=effect(animation).getTiming().duration;if(typeof value!=='number')throw Error('Expected numeric animation duration');return value};Object.assign(window,{nativeCalls:0,settingsAnimations:[] as SettingsAnimation[],frameEffect:effect,settingsNode:node,lastAnimation:last,durationMs:duration});native.onclick=()=>nativeCalls++;const animate=Element.prototype.animate;Element.prototype.animate=function(frames,options){const a=animate.call(this,frames,options);if(this.matches('.dmt-settings-shell,.dmt-workspace-section'))settingsAnimations.push({node:this,frames,options,animation:a});return a}});
  const detail=await runCase(name,fn);assert.deepEqual(errors,[]);checks.push({name,status:'PASS',detail});console.log('PASS',name);
  }catch(e){await page.screenshot({path:path.join(out,'failure-'+checks.length+'.png')}).catch(()=>{});const failure:{name:string;status:'FAIL';error:string;errors:string[]}={name,status:'FAIL',error:e instanceof Error?e.message:String(e),errors};checks.push(failure);failures.push(failure);if(failures.length===1)await evidence.captureFailure(page,{kind:'settings',error:e,snapshot:{...(await oracles.settingsSnapshot(page)),integrationCase:name}});console.log('FAIL',name,e instanceof Error?e.message:String(e))}finally{await page.close()}};
 const open=()=>page.evaluate(()=>theme.openSettings()),close=()=>page.locator('.dmt-close').click(),closed=()=>page.waitForFunction(()=>!document.querySelector<HTMLDialogElement>('dialog')?.open),frames=()=>page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 try{await server.listen();
 await check('M01 official material without review marker and scoped native surfaces',async()=>{
  assert.equal(await page.locator('html').getAttribute('data-evo41-material-review'),null);
  await open();await page.getByRole('button',{name:'材质',exact:true}).click();
  const slider=page.getByRole('slider',{name:'Acrylic 通透度',exact:true});await slider.waitFor({timeout:3000});assert.equal(await slider.inputValue(),'60');
  assert.equal(await page.locator('html').evaluate(n=>n.hasAttribute('data-dgu-acrylic-adjustment')),true);
  const shell=()=>page.locator('.dmt-settings-shell').evaluate(n=>({fill:getComputedStyle(n).backgroundColor,blur:getComputedStyle(n).backdropFilter}));
  const legacy=await page.locator('.dmt-settings-shell').evaluate(n=>{const root=document.documentElement;root.removeAttribute('data-dgu-acrylic-adjustment');try{const c=getComputedStyle(n);return{fill:c.backgroundColor,blur:c.backdropFilter}}finally{root.setAttribute('data-dgu-acrylic-adjustment','')}});
  assert.match((await shell()).fill,/0\.43/);await slider.fill('0');assert.match((await shell()).fill,/46, 47, 50/);await slider.fill('100');assert.deepEqual(await shell(),legacy,'clear endpoint keeps the actual4.0.1 material contract');
  await page.evaluate(()=>theme.setPreference('visualGlass',false));assert.equal(await page.locator('dialog').evaluate(n=>getComputedStyle(n,'::backdrop').backdropFilter),'none','glass-off includes the modal backdrop');await page.evaluate(()=>theme.setPreference('visualGlass',true));
  await close();await closed();
  await page.evaluate(()=>{const overlay=document.createElement('section');overlay.id='customOverlay';overlay.innerHTML='<div id="customOverlayTitle">Controlled native title</div><div id="customOverlayContent"><button id="material-native-action">Native action</button></div>';overlay.style.cssText='position:fixed;inset:20px;width:640px;height:400px';document.body.append(overlay);document.getElementById('material-native-action')!.onclick=()=>nativeCalls++});
  const overlay=page.locator('#customOverlay'),sample=()=>overlay.evaluate(n=>{const c=getComputedStyle(n);return{fill:c.backgroundColor,image:c.backgroundImage,blur:c.backdropFilter,shadow:c.boxShadow,radius:c.borderRadius}});
  await page.evaluate(()=>theme.setPreference('acrylicTransparency',60));
  const compareUnknown=async()=>{const values=await overlay.evaluate(n=>{const root=document.documentElement,read=()=>{const c=getComputedStyle(n);return{fill:c.backgroundColor,image:c.backgroundImage,blur:c.backdropFilter,shadow:c.boxShadow,radius:c.borderRadius}};root.removeAttribute('data-dgu-acrylic-adjustment');try{const before=read();root.setAttribute('data-dgu-acrylic-adjustment','');return{before,after:read()}}finally{root.setAttribute('data-dgu-acrylic-adjustment','')}});assert.deepEqual(values.after,values.before,'unowned / partial / unknown overlays do not receive the new material')};
  await compareUnknown();const owned=[];
  for(const className of ['dgc-overlay','dgs-overlay','dgp-overlay','dgs-native-tools']){await overlay.evaluate((n,v)=>n.setAttribute('class',v),className);const value=await sample();assert.match(value.fill,/0\.43/);assert.match(value.blur,/blur\(24px\)/);owned.push({className,...value})}
  await overlay.evaluate(n=>n.setAttribute('class',''));
  for(const adapter of ['ModHubSoftWet','MapleBirchSoftWet','DolOptimizationSoftWet','CheatExtendedSoftWet']){await overlay.evaluate((n,v)=>{n.setAttribute('data-dgu-adapter',v);n.setAttribute('data-dgu-adapter-match','full')},adapter);assert.match((await sample()).fill,/0\.43/)}
  for(const [adapter,match] of [['ModHubSoftWet','partial'],['UnknownThirdParty','full']]){await overlay.evaluate((n,[a,m])=>{n.setAttribute('data-dgu-adapter',a!);n.setAttribute('data-dgu-adapter-match',m!)},[adapter,match]);await compareUnknown()}
  await overlay.evaluate(n=>{n.removeAttribute('data-dgu-adapter');n.removeAttribute('data-dgu-adapter-match');n.setAttribute('class','dgp-overlay')});
  await page.locator('#material-native-action').click();assert.equal(await page.evaluate(()=>nativeCalls),1);
  const rect=()=>overlay.evaluate(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}}),before=await rect();
  await page.evaluate(()=>theme.setPreference('acrylicTransparency',0));assert.deepEqual(await rect(),before);await page.evaluate(()=>theme.setPreference('acrylicTransparency',100));assert.deepEqual(await rect(),before);
  await page.evaluate(()=>theme.setPreference('visualGlass',false));assert.equal((await sample()).blur,'none');assert.equal((await sample()).fill,'rgb(29, 38, 43)');
  await page.evaluate(()=>theme.destroy());assert.equal(await page.locator('html').getAttribute('data-dgu-acrylic-adjustment'),null);return{owned,adapters:4,unknownProtected:3,nativeCalls:1};
 });
 if(!baseline)await check('M02 custom appearance previews, applies, persists, and resets within owned UI',async()=>{
  // Represent a ready event host. Late-host recovery runs separate mount passes.
  await page.evaluate(()=>{
   theme.destroy();
   Object.assign(window,{jQuery:()=>({on(){},off(){}})});
   remount();
  });
  await open();await page.getByRole('button',{name:'材质',exact:true}).click();
  const color=page.getByLabel('强调色',{exact:true}),font=page.getByLabel('本机字体',{exact:true});
  const save=page.getByRole('button',{name:'应用并保存'}),reset=page.getByRole('button',{name:'恢复默认外观'});
  const root=page.locator('html'),sheet=page.locator('.sw-appearance'),sample=page.locator('.sw-appearance-sample');
  const getFont=(selector:string)=>page.locator(selector).evaluate(n=>getComputedStyle(n).fontFamily);
  const nativeFont=await getFont('#native');
  const cssColor=(selector:string)=>page.locator(selector).evaluate(n=>getComputedStyle(n).getPropertyValue('--dgu-accent').trim());
  const defaultColor=await cssColor('#dol-midnight-controls');
  const defaultSheet=await sheet.evaluate(n=>getComputedStyle(n).backgroundColor);
  await page.evaluate(()=>{
   document.body.insertAdjacentHTML('beforeend',
    '<section class="sf-motion-hub" data-official><div class="sf-motion-orbit"><button class="sf-motion-petal" id="owned-hub">Tool</button></div>'+
    '<section class="sf-motion-sheet"><header id="owned-hub-heading"><div><h2>Detail</h2></div><button>Close</button></header><main><div class="sf-view-outlet"><header id="external-view-heading" style="font-family:monospace">Example</header></div></main></section></section>'+
    '<section class="dgw-root" id="owned-wardrobe"></section><section class="dgshop-host" id="owned-shop"></section>'+
    '<dialog class="dgu-surface" data-sf-workspace="drawer" id="owned-drawer"></dialog>'+
    '<section id="customOverlay" class="dgc-overlay"><div class="dgc-host"></div><button id="owned-overlay">Attribute</button></section>');
  });
  const unrelated=await page.evaluateHandle(()=>{
   const calls={saves:0,layout:0};
   Object.assign(window,{DoLSavesUI:{getEnabled:()=>true,setV2:()=>calls.saves++},DMTLayout:{sync:()=>calls.layout++,destroy:()=>{}}});
   return calls;
  });
  const fontSize=(selector:string)=>page.locator(selector).evaluate(n=>getComputedStyle(n).fontSize);
  const callerSize=await fontSize('#external-view-heading');
  await page.evaluate(()=>theme.setPreference('fontScale',150));
  assert.equal(await fontSize('#owned-hub-heading h2'),'31.5px');
  assert.equal(await fontSize('#external-view-heading'),callerSize);
  await color.fill('#ffd979');await page.getByLabel('面板',{exact:true}).fill('#ffffff');
  await font.fill('Georgia; color:red');assert.ok(await save.isDisabled());
  await font.fill('Missing Family Contract');
  assert.match(await sample.evaluate(n=>getComputedStyle(n).fontFamily),/Missing Family Contract.*system-ui/);
  assert.equal(await root.getAttribute('data-sw-custom-colors'),null);
  assert.equal(await cssColor('#dol-midnight-controls'),defaultColor);
  assert.notEqual(await sample.getByRole('status').count(),0);
  const effective=await sample.evaluate(n=>getComputedStyle(n).getPropertyValue('--sample-panel').trim());
  assert.notEqual(effective,'#ffffff');
  await save.click();assert.notEqual(await root.getAttribute('data-sw-custom-colors'),null);
  for(const selector of ['.dmt-settings-shell','#owned-hub','#owned-wardrobe','#owned-shop','#owned-overlay','#owned-drawer']){
   assert.equal(await cssColor(selector),'#ffd979');assert.match(await getFont(selector),/Missing Family Contract.*system-ui/);
  }
  assert.deepEqual(await unrelated.jsonValue(),{saves:0,layout:0},'font and appearance edits must skip unrelated page updates');
  const hubFill=()=>page.locator('#owned-hub').evaluate(n=>getComputedStyle(n).backgroundColor);
  const panelFill=await sample.locator('.sw-appearance-sample-panel').evaluate(n=>getComputedStyle(n).backgroundColor);
  assert.match(await hubFill(),/\/ 0\.6\)/);
  await page.evaluate(()=>theme.setPreference('visualGlass',false));assert.equal(await hubFill(),panelFill);
  await page.evaluate(()=>theme.setPreference('visualGlass',true));
  assert.match(await getFont('#owned-hub-heading'),/Missing Family Contract/);
  assert.equal(await getFont('#external-view-heading'),'monospace');
  assert.equal(await getFont('#native'),nativeFont);
  assert.notEqual(await sheet.evaluate(n=>getComputedStyle(n).backgroundColor),defaultSheet);
  await page.locator('#customOverlay').evaluate(n=>{n.removeAttribute('class');n.setAttribute('data-dgu-adapter','ModHubSoftWet');n.setAttribute('data-dgu-adapter-match','partial')});
  assert.notEqual(await cssColor('#owned-overlay'),'#ffd979');assert.doesNotMatch(await getFont('#owned-overlay'),/Missing Family Contract/);
  await page.locator('#customOverlay').evaluate(n=>n.setAttribute('data-dgu-adapter-match','full'));
  assert.equal(await cssColor('#owned-overlay'),'#ffd979');
  await page.addScriptTag({type:'module',content:`
   import {createUiRuntime} from '/src/runtime/ui.ts';
   window.modUtils={getMod:name=>name==='ModHub'?{version:'1.8.0'}:undefined,getSemVerTools:()=>({
    parseVersion:version=>({version}),parseRange:range=>range,satisfies:(v,r)=>v==='1.8.0'&&r==='>=1.3.0'
   })};
   window.probeRuntime=createUiRuntime(window,()=>theme.getPreferences());
   window.DoLGameUI={ui:probeRuntime.api};
   await import('/compat/modhub-soft-wet/modhub-soft-wet.ts');
  `});
  await page.waitForFunction(()=>!!Reflect.get(window,'ModHubSoftWet'));
  await close();await closed();
  await page.evaluate(()=>{
   document.body.insertAdjacentHTML('beforeend',
    '<div class="modhub-modal-backdrop" id="portal-full" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center">'+
    '<div class="modhub-modal-dialog" id="owned-modhub-modal" role="dialog" aria-modal="true" style="width:600px">'+
    '<header class="modhub-modal-header">Install</header><div class="modhub-modal-body"><input id="portal-text" type="text"><input id="portal-number" type="number"><p>'+('LongSampleContent'.repeat(400))+'</p></div>'+
    '<footer class="modhub-modal-footer"><button id="owned-modhub-close">Install sample</button><button>Cancel sample</button></footer></div></div>');
   document.getElementById('owned-modhub-close')!.onclick=()=>nativeCalls++;
  });
  await page.waitForSelector('#portal-full[data-dgu-adapter-match=full]');
  assert.equal(await cssColor('#owned-modhub-modal'),'#ffd979');
  for(const selector of ['#owned-modhub-close','#portal-text','#portal-number'])assert.match(await getFont(selector),/Missing Family Contract/);
  assert.match(await page.locator('#owned-modhub-modal').evaluate(n=>getComputedStyle(n).backgroundColor),/\/ 0\.43\)/);
  assert.equal(await fontSize('#owned-modhub-close'),'19.5px');
  await page.evaluate(()=>theme.setPreference('buttonScale',150));
  for(const width of [1280,390]){
   await page.setViewportSize({width,height:844});
   const geometry=await page.locator('#owned-modhub-modal').evaluate(n=>{const dialog=n.getBoundingClientRect(),body=n.querySelector('.modhub-modal-body')!,button=n.querySelector('button')!.getBoundingClientRect();return{left:dialog.left,right:dialog.right,top:dialog.top,bottom:dialog.bottom,buttonHeight:button.height,bodyScroll:body.scrollHeight>body.clientHeight,overflow:n.scrollWidth>n.clientWidth+1}});
   assert.ok(geometry.left>=0&&geometry.right<=width&&geometry.top>=0&&geometry.bottom<=844);
   assert.ok(geometry.buttonHeight>=66&&!geometry.overflow&&geometry.bodyScroll);
  }
  await page.evaluate(()=>theme.setPreference('visualGlass',false));
  assert.equal(await page.locator('#owned-modhub-modal').evaluate(n=>getComputedStyle(n).backdropFilter),'none');
  await page.locator('#owned-modhub-close').click();assert.equal(await page.evaluate(()=>nativeCalls),1);
  await page.evaluate(()=>{const footer=document.querySelector('.modhub-modal-footer')!;Reflect.set(window,'portalFooter',footer);footer.remove()});
  await page.waitForSelector('#portal-full[data-dgu-adapter-match=partial]');
  assert.doesNotMatch(await getFont('#portal-text'),/Missing Family Contract/);
  await page.locator('#owned-modhub-modal').evaluate(n=>n.classList.remove('modhub-modal-dialog'));
  await page.waitForFunction(()=>Reflect.get(window,'ModHubSoftWet').getDiagnostics().components.modal.status==='unknown');
  assert.equal(await page.locator('#portal-full').getAttribute('data-dgu-adapter'),null);
  assert.doesNotMatch(await getFont('#portal-text'),/Missing Family Contract/);
  await page.locator('#owned-modhub-modal').evaluate(n=>{n.classList.add('modhub-modal-dialog');n.append(Reflect.get(window,'portalFooter'))});
  await page.waitForSelector('#portal-full[data-dgu-adapter-match=full]');
  assert.match(await getFont('#portal-text'),/Missing Family Contract/);
  await page.evaluate(()=>{theme.setPreference('visualGlass',true);theme.setPreference('buttonScale',100);theme.setPreference('fontScale',100)});
  assert.equal(await fontSize('#owned-hub-heading h2'),'21px');
  assert.equal(await fontSize('#owned-modhub-close'),'13px');
  await page.evaluate(()=>{
   Reflect.get(window,'ModHubSoftWet').destroy();Reflect.get(window,'probeRuntime').destroy();
   theme.setPreference('fontScale',150);
  });
  assert.equal(await page.locator('#portal-full').getAttribute('data-dgu-adapter'),null);
  assert.doesNotMatch(await getFont('#portal-text'),/Missing Family Contract/);
  await page.locator('#portal-full').evaluate(n=>n.remove());
  await page.setViewportSize({width:390,height:844});
  const detail=page.locator('.sf-motion-sheet');
  await detail.evaluate(n=>{
   n.classList.add('is-open');Object.assign((n as HTMLElement).style,{left:'10px',top:'20px',width:'350px',height:'430px'});
   n.querySelector('h2')!.textContent='ContinuousLongHeading'.repeat(3);
   n.querySelector('main')!.append('Sample content '.repeat(350));
  });
  const detailClose=detail.locator(':scope > header > button');
  await detailClose.click({trial:true,timeout:3000});
  assert.ok(await detail.evaluate(n=>n.scrollWidth<=n.clientWidth+1));
  assert.ok(await detail.locator('main').evaluate(n=>n.clientHeight>0&&n.scrollHeight>n.clientHeight));
  await page.reload();await page.waitForFunction(()=>typeof theme!=='undefined');await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
  await open();await page.getByRole('button',{name:'材质',exact:true}).click();
  assert.equal(await font.inputValue(),'Missing Family Contract');assert.equal(await color.inputValue(),'#ffd979');
  await page.setViewportSize({width:390,height:844});
  assert.ok(await sheet.evaluate(n=>n.scrollWidth<=n.clientWidth+1),'appearance controls must fit on a phone-width viewport');
  assert.equal(await page.evaluate(()=>theme.getPreferences().fontScale),150);
  assert.ok(await page.locator('.dmt-close').evaluate(n=>{const b=n.getBoundingClientRect();return n.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))}));
  await reset.click();assert.equal(await root.getAttribute('data-sw-custom-colors'),null);
  assert.equal(await root.getAttribute('data-sw-custom-font'),null);
  assert.equal(await cssColor('#dol-midnight-controls'),defaultColor);
  assert.equal(await sheet.evaluate(n=>getComputedStyle(n).backgroundColor),defaultSheet);
  assert.equal(await font.inputValue(),'');
  await font.fill('Georgia');await save.click();
  await page.evaluate(()=>theme.destroy());
  assert.equal(await root.evaluate(n=>(n as HTMLElement).style.getPropertyValue('--sw-custom-font')),'');
  const migration=await page.evaluate(()=>{
   const key='DoLMidnightTheme.preferences.v1';
   localStorage.setItem(key,JSON.stringify({fontScale:135,appearance:{font:'Georgia'},centerOptions:true}));
   remount();
   const initial=theme.getPreferences().fontScale;
   const setItem=Storage.prototype.setItem;
   try{
    Storage.prototype.setItem=()=>{throw Error('synthetic storage failure')};
    theme.setPreference('fontScale',125);
   }finally{Storage.prototype.setItem=setItem}
   const session=theme.getPreferences().fontScale, persisted=JSON.parse(localStorage.getItem(key)!).fontScale;
   theme.setPreference('fontScale',125);
   const saved=JSON.parse(localStorage.getItem(key)!);
   theme.destroy();
   return{initial,session,persisted,retried:saved.fontScale,font:saved.appearance.font,center:saved.centerOptions,marker:saved._scaleBaseline26};
  });
  assert.deepEqual(migration,{initial:100,session:125,persisted:100,retried:125,font:'Georgia',center:true,marker:true});
  return{viewports:[1280,390],nativeOutsideScope:true,adapterMatchComparison:true,migration};
 });
 if(!baseline)await check('M03 registered manager, tools and restore surfaces',()=>verifyManagerSurfaces(page));
 if(!baseline)await check('R01 owned form geometry and unowned control boundaries',async()=>{
  await open();
  await page.getByRole('button',{name:'材质',exact:true}).click();
  await page.getByLabel('本机字体',{exact:true}).fill('Georgia');
  await page.getByRole('button',{name:'应用并保存'}).click();
  await page.getByRole('button',{name:'阅读',exact:true}).click();
  const own=page.getByRole('combobox',{name:'选项文字对齐',exact:true});
  await own.waitFor();
  await page.evaluate(()=>{
   const overlay=document.createElement('section');
   overlay.id='customOverlay';overlay.dataset.overlay='options';
   overlay.innerHTML='<div id="customOverlayContent"><div class="settingsGrid"><div class="settingsToggleItem"><label>示例设置<select><option>Primary</option><option>Alternate</option></select></label></div></div></div>';
   const outside=document.createElement('button');
   outside.id='caller-control';outside.style.cssText='padding:2px 3px;min-height:17px';
   document.body.append(overlay,outside);
  });
  await page.addScriptTag({type:'module',content:"import {startPanels} from '/src/panels/main.ts';window.rolePanels=startPanels(window);"});
  await page.locator('#customOverlay.dgp-overlay>.dgp-host').waitFor({state:'attached'});
  const native=page.locator('#customOverlayContent select');
  const geom=(locator:playwright.Locator)=>locator.evaluate(node=>{
   const style=getComputedStyle(node),box=node.getBoundingClientRect();
   return {hit:box.height,font:parseFloat(style.fontSize),family:style.fontFamily,padding:style.padding,min:style.minHeight};
  });
  const outside=page.locator('#caller-control'),before=await geom(outside);
  for(const width of [390,1280]){
   await page.setViewportSize({width,height:844});
   for(const scale of [100,150]){
    await page.evaluate(scale=>{
     theme.setPreference('buttonScale',scale);theme.setPreference('fontScale',scale);
     theme.setPreference('visualGlass',false);
    },scale);
    const after=await geom(outside);
    assert.equal(after.padding,before.padding,'unowned button padding');assert.equal(after.min,before.min,'unowned hit area');
    for(const center of [false,true]){
     await page.evaluate(center=>theme.setPreference('centerOptions',center),center);
     for(const control of [own,native]){
      const size=await geom(control);
      assert.ok(size.hit>=44*scale/100,'select hit area '+JSON.stringify({width,scale,center,size}));
      assert.equal(size.font,13*scale/100,'control typography');assert.match(size.family,/Georgia/);
     }
    }
    await page.locator('.dmt-close').click({trial:true});
   }
  }
  await close();await closed();
  await native.evaluate(node=>node.addEventListener('change',()=>node.setAttribute('data-calls',String(Number(node.getAttribute('data-calls'))+1))));
  await native.selectOption({label:'Alternate'});assert.equal(await native.getAttribute('data-calls'),'1');
  await page.evaluate(()=>{Reflect.get(window,'rolePanels').destroy();theme.destroy()});
  assert.equal(await page.locator('#customOverlay.dgp-overlay').count(),0);
  assert.equal((await geom(outside)).padding,before.padding);
 });
 if(!baseline)await check('P01 requested page choices survive failure, retry and emergency recovery',async()=>{
  // Start the real application on an empty document: no game content or state.
  await page.goto(new URL('/__neutral_integration__',page.url()).href);
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('DoLGameUI.saves.enabled','false');localStorage.setItem('DoLGameUI.journal.enabled','false');localStorage.setItem('DoLCombatUI.enabled.v1','false')});
  await page.addScriptTag({type:'module',content:"import {startGameUI} from '/src/main.ts'; window.restartGameUI=startGameUI; startGameUI();"});
  await page.waitForFunction(()=>typeof Reflect.get(window,'DoLGameUI')?.getRequestedPreferences==='function');
  const read=()=>page.evaluate(()=>{const api=Reflect.get(window,'DoLGameUI');return{requested:api.getRequestedPreferences(),effective:api.getPreferences()}});
  let state=await read();
  for(const key of ['savesEnabled','journalEnabled','combatEnabled']){assert.equal(state.requested[key],false);assert.equal(state.effective[key],false)}
  for(const key of ['savesEnabled','shopEnabled','combatEnabled','wardrobeEnabled','characteristicsEnabled','socialEnabled','journalEnabled','traitsEnabled','statisticsEnabled','featsEnabled','cheatsEnabled','attitudesEnabled','settingsEnabled'])assert.equal(typeof state.requested[key],'boolean',key+' must always expose a requested boolean');
  await page.evaluate(()=>Reflect.get(window,'DoLGameUI').setPreference('journalEnabled',true));
  assert.equal(await page.evaluate(()=>localStorage.getItem('DoLGameUI.journal.enabled')),'true');
  await page.evaluate(()=>Reflect.get(window,'DoLGameUI').openSettings());
  await page.getByRole('button',{name:'页面',exact:true}).click();await page.locator('.dmt-page-switches summary').click();
  await page.getByLabel('启用新版存档界面',{exact:true}).check();
  state=await read();assert.equal(state.requested.savesEnabled,true);assert.equal(state.effective.savesEnabled,true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('DoLGameUI.saves.enabled')),'true');
  const panelFailure=await page.evaluate(()=>{
   const api=Reflect.get(window,'DoLGameUI'), panels=Reflect.get(window,'DoLPanelsUI');
   const overlay=document.createElement('section'),body=document.createElement('div');
   overlay.id='customOverlay';overlay.dataset.overlay='journal';
   body.id='customOverlayContent';body.textContent='Neutral sample';
   overlay.append(body);document.body.append(overlay);
   const place=body.before;
   try{
    body.before=()=>{throw Error('synthetic mount failure')};
    panels.refresh();
   }finally{body.before=place}
   const request=api.getRequestedPreferences().journalEnabled;
   const effective=api.getPreferences().journalEnabled;
   const disk=localStorage.getItem('DoLGameUI.journal.enabled');
   api.setPreference('journalEnabled',true);
   const mounted=!!overlay.querySelector('.dgp-host');
   const recovered=api.getPreferences().journalEnabled;
   overlay.remove();panels.refresh();
   return {request,effective,disk,mounted,recovered};
  });
  assert.deepEqual(panelFailure,{request:true,effective:false,disk:'true',mounted:true,recovered:true});
  const retry=await page.evaluate(()=>{
   const api=Reflect.get(window,'DoLGameUI'),set=Storage.prototype.setItem;
   try{
    Storage.prototype.setItem=function(key,value){
     if(key==='DoLCombatUI.enabled.v1')throw Error('synthetic write failure');
     return set.call(this,key,value);
    };
    api.setPreference('combatEnabled',true);
   }finally{Storage.prototype.setItem=set}
   const before=localStorage.getItem('DoLCombatUI.enabled.v1');
   api.setPreference('combatEnabled',true);
   return{before,after:localStorage.getItem('DoLCombatUI.enabled.v1'),requested:api.getRequestedPreferences().combatEnabled};
  });
  assert.deepEqual(retry,{before:'false',after:'true',requested:true});
  const boundaries=await page.evaluate(()=>{
   const api=Reflect.get(window,'DoLGameUI'),wardrobe=Reflect.get(window,'DoLWardrobeUI');
   const busy=wardrobe.isBusy, set=Storage.prototype.setItem;
   let writes=0;
   try{
    wardrobe.isBusy=()=>true;
    Storage.prototype.setItem=function(key,value){writes++;return set.call(this,key,value)};
    api.setPreference('enabled',false);
    api.setPreference('wardrobeEnabled',false);
   }finally{wardrobe.isBusy=busy;Storage.prototype.setItem=set}
   const {enabled,wardrobeEnabled}=api.getRequestedPreferences();
   const saves=Reflect.get(window,'DoLSavesUI');
   try{
    Reflect.deleteProperty(window,'DoLSavesUI');
    api.setPreference('savesEnabled',false);
    return {enabled,wardrobeEnabled,writes,requested:api.getRequestedPreferences().savesEnabled,effective:api.getPreferences().savesEnabled};
   }finally{Reflect.set(window,'DoLSavesUI',saves)}
  });
  assert.deepEqual(boundaries,{enabled:true,wardrobeEnabled:true,writes:0,requested:true,effective:undefined});
  const emergency=await page.evaluate(()=>{
   Reflect.get(window,'DoLGameUI').destroy();
   const restart=Reflect.get(window,'restartGameUI'),create=document.createElement;
   try{
    document.createElement=function(tag:string,options?:ElementCreationOptions){
     if(tag==='dialog')throw Error('synthetic settings dialog construction failure');
     return create.call(this,tag,options);
    };
    restart();
   }finally{document.createElement=create}
   const recovery=document.querySelector<HTMLButtonElement>('#dol-ui-recovery');
   if(!recovery||Reflect.get(window,'DoLMidnightTheme'))throw Error('Missing emergency fallback');
   recovery.click();
   const saved=JSON.parse(localStorage.getItem('DoLMidnightTheme.preferences.v1')!);
   Reflect.get(window,'DoLGameUI').destroy();restart();
   const api=Reflect.get(window,'DoLGameUI');
   const restarted=api.getPreferences().enabled;
   api.setPreference('enabled',true);
   return {persisted:saved.enabled,restarted,restored:api.getRequestedPreferences().enabled};
  });
  assert.deepEqual(emergency,{persisted:false,restarted:false,restored:true});
  await page.evaluate(()=>Reflect.get(window,'DoLGameUI').destroy());
  return{panelFailure,retry,emergency};
 });
 await check('S01 approved shell and page timing, real input and single material surface',async()=>{
   const first=await page.evaluate(()=>{theme.openSettings();const shell=settingsNode('.dmt-settings-shell'),a=settingsAnimations.find(x=>x.node===shell),control=settingsNode<HTMLElement>('[aria-label="手机紧凑按钮间距"]'),before=theme.getPreferences().mobileCompactControls;control.click();return{duration:a?frameEffect(a.animation).getTiming().duration:undefined,easing:a?frameEffect(a.animation).getTiming().easing:undefined,inert:!!control.closest('[inert]'),updated:theme.getPreferences().mobileCompactControls!==before,proxyCount:document.querySelectorAll('.dmt-open-material,.rf-stage,.dmt-settings-context,.dmt-settings-material').length,transform:getComputedStyle(shell).transform,backdrop:getComputedStyle(shell).backdropFilter,alpha:Number(getComputedStyle(shell).backgroundColor.match(/[\d.]+/g)?.[3]??1)}});
  assert.equal(first.duration,100);assert.equal(first.easing,'linear');assert.equal(first.inert,false);assert.equal(first.updated,true);assert.equal(first.proxyCount,0);assert.equal(first.transform,'none');assert.match(first.backdrop,/blur\(24px\)/);assert.ok(Math.abs(first.alpha-.43)<.001,'accepted60% material remains visible without a preview marker');await page.waitForTimeout(130);
   await page.getByRole('button',{name:'材质',exact:true}).click();const category=await page.evaluate(()=>settingsAnimations.filter(x=>x.node.matches('.dmt-workspace-section')).map(x=>({duration:frameEffect(x.animation).getTiming().duration,easing:frameEffect(x.animation).getTiming().easing,frames:frameEffect(x.animation).getKeyframes()})));assert.equal(category.length,1,'outgoing page is removed immediately');assert.ok(category.every(x=>x.duration===20&&x.easing==='linear'));assert.deepEqual(category[0]?.frames.map(k=>Number(k.opacity)),[0,1]);assert.ok(category.every(x=>x.frames.every(k=>!k.transform&&!k.clipPath&&!k.filter)),'no 3D page-turn, clipping or blur');
   await page.evaluate(()=>{const a=settingsAnimations.filter(x=>x.node.matches('.dmt-workspace-section'));for(const x of a)x.animation.finish()});await frames();await close();await closed();const last=await page.evaluate(()=>durationMs(lastAnimation(settingsAnimations.filter(x=>x.node.matches('.dmt-settings-shell'))).animation));assert.ok(last<=80);return{first,category};
 });
 await check('S01 reversal samples current opacity before cancellation and latest open wins',async()=>{
   const sample=await page.evaluate(()=>{theme.openSettings();const shell=settingsNode('.dmt-settings-shell'),a=lastAnimation(settingsAnimations).animation;a.pause();a.currentTime=45;const read=()=>Number(getComputedStyle(shell).opacity),initial=read();settingsNode<HTMLElement>('.dmt-close').click();const afterClose=read(),b=lastAnimation(settingsAnimations).animation;b.pause();b.currentTime=10;const beforeOpen=read();theme.openSettings();const afterOpen=read();return{initial,afterClose,beforeOpen,afterOpen,transform:getComputedStyle(shell).transform,inert:!!settingsNode('.dmt-workspace-page').closest('[inert]')}});
   assert.ok(sample.initial>0&&sample.initial<1);assert.ok(Math.abs(sample.initial-sample.afterClose)<.002,'open-to-close opacity must not jump');assert.ok(Math.abs(sample.beforeOpen-sample.afterOpen)<.002,'close-to-open opacity must not jump');assert.equal(sample.transform,'none');assert.equal(sample.inert,false);await page.waitForTimeout(150);assert.equal(await page.locator('dialog').evaluate(n=>n instanceof HTMLDialogElement?n.open:false),true);await close();await closed();assert.equal(await page.evaluate(()=>nativeCalls),0);return sample;
 });
 await check('S01 closing and native close cancel category WAAPI and settle exactly one page',async()=>{
   await open();await page.waitForTimeout(130);await page.getByRole('button',{name:'材质',exact:true}).click();assert.ok(await page.locator('.dmt-workspace-section').evaluateAll(ns=>ns.some(n=>n.getAnimations().length>0)));await close();await closed();await frames();const first=await page.evaluate(()=>({animations:[...document.querySelectorAll('.dmt-workspace-section')].flatMap(n=>n.getAnimations()).length,transition:settingsNode('dialog').hasAttribute('data-workspace-transition'),sections:document.querySelectorAll('.dmt-workspace-section').length}));assert.deepEqual(first,{animations:0,transition:false,sections:1});
   await open();await page.getByRole('button',{name:'入口',exact:true}).click();await page.locator('dialog').evaluate(n=>{if(!(n instanceof HTMLDialogElement))throw Error('Missing dialog');n.close()});await frames();assert.equal(await page.locator('dialog').getAttribute('data-workspace-transition'),null);assert.equal(await page.locator('.dmt-workspace-section').evaluateAll(ns=>ns.flatMap(n=>n.getAnimations()).length),0);return first;
 });
 await check('S01 cancellation, preferences, hidden/resize and teardown keep latest usable state',async()=>{
  await open();for(const name of ['材质','入口','页面','高级','阅读']){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(35)}
  await page.evaluate(()=>theme.setPreference('visualMotion',false));await frames();assert.equal(await page.locator('.dmt-workspace-section').count(),1);assert.equal(await page.locator('[aria-labelledby="dmt-reading-heading"]').getAttribute('inert'),null);await close();await closed();
   await page.evaluate(()=>theme.setPreference('visualMotion',true));await open();await page.getByRole('button',{name:'材质',exact:true}).click();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});await frames();assert.equal(await page.locator('.dmt-workspace-section').evaluateAll(ns=>ns.flatMap(n=>n.getAnimations()).length),0);await page.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'))});
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'入口',exact:true}).click();await frames();assert.equal(await page.locator('dialog').getAttribute('data-workspace-transition'),null);await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'阅读',exact:true}).click();await page.setViewportSize({width:390,height:844});await frames();assert.equal(await page.locator('.dmt-workspace-section').count(),1);
   await page.getByRole('button',{name:'材质',exact:true}).click();const retired=await page.evaluate(()=>{Object.assign(window,{retiredAnimations:settingsAnimations.map(x=>x.animation)});theme.destroy();return retiredAnimations.length});await frames();assert.equal(await page.locator('dialog').count(),0);assert.ok(await page.evaluate(()=>retiredAnimations.every(a=>a.playState==='idle'||a.playState==='finished')));await page.evaluate(()=>remount());await open();await page.waitForTimeout(130);assert.equal(await page.locator('dialog').evaluate(n=>n instanceof HTMLDialogElement?n.open:false),true);return{retired};
 });
 await check('S01 modeless fallback and replaced dialog cancel retired shell work',async()=>{
   await page.evaluate(()=>Reflect.set(HTMLDialogElement.prototype,'showModal',undefined));await open();assert.equal(await page.locator('dialog').evaluate(n=>n.classList.contains('dmt-modeless')),true);const before=await page.evaluate(()=>theme.getPreferences().mobileCompactControls);await page.getByLabel('手机紧凑按钮间距',{exact:true}).click();assert.equal(await page.evaluate(()=>theme.getPreferences().mobileCompactControls),!before);await close();await closed();
   await page.evaluate(()=>{theme.openSettings();const dialog=settingsNode<HTMLDialogElement>('dialog'),shell=settingsNode('.dmt-settings-shell'),animation=lastAnimation(settingsAnimations.filter(x=>x.node===shell)).animation;Object.assign(window,{oldDialog:dialog,oldShell:shell,retiredShellAnimation:animation});retiredShellAnimation.pause();retiredShellAnimation.currentTime=40;oldDialog.remove()});await page.waitForFunction(()=>document.querySelector('dialog')&&document.querySelector('dialog')!==oldDialog);assert.equal(await page.evaluate(()=>retiredShellAnimation.playState),'idle','replacement must cancel retired shell animation');await open();assert.equal(await page.locator('.dmt-close').evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),true);await close();await closed();assert.equal(await page.evaluate(()=>nativeCalls),0);return{fallback:true,retiredCancelled:true};
 });
 const hashes=Object.fromEntries([...files,...(baseline?[]:['src/theme/preference-store.ts','framework/motion-hub/style.css']),'src/theme/settings-workspace.css','src/theme/acrylic-v1.css','tests/evolution-settings-integration.cjs'].map(f=>[f,crypto.createHash('sha256').update(old[f]??fs.readFileSync(f)).digest('hex')]));const result={baseline,source:baseline?revision:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTree:!baseline,hashes,css:{source:'current production build; baseline freezes TS/Vue behavior only',sha256:crypto.createHash('sha256').update(fs.readFileSync('dist/framework/official-ui/style.css')).digest('hex')},runtime:{platform:process.platform,node:process.version,chromium:browser.version()},checks};fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log('Settings integration evidence',out);if(failures.length){const error=new Error(failures.length+' settings integration checks failed');Object.assign(error,{settingsIntegrationEvidence:true});throw error}return result;
 }finally{await server.close()}
}
module.exports={verifySettingsIntegration};
if(require.main===module)(async()=>{const browser=await playwright.chromium.launch(browserOptions);try{await verifySettingsIntegration(browser,{baseline:process.argv.includes('--baseline')})}finally{await browser.close()}})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});

async function verifyManagerSurfaces(page:playwright.Page){
 const main='#customOverlay',tools='#modHubManagerToolsMenu',restore='#modHubRestorePanelOverlay';
 const full=async(root:string,id:string)=>page.locator(root+'[data-dgu-adapter="'+id+'"][data-dgu-adapter-match=full]').waitFor();
 await page.evaluate(()=>theme.openSettings());
 await page.getByRole('button',{name:'材质',exact:true}).click();
 await page.getByLabel('本机字体',{exact:true}).fill('Georgia');
 await page.getByRole('button',{name:'应用并保存'}).click();
 await page.locator('.dmt-close').click();
 await page.waitForFunction(()=>!document.querySelector<HTMLDialogElement>('dialog')?.open);
 const filler='<p>'+'ContinuousSampleName'.repeat(8)+'</p>';
 await page.addStyleTag({content:[
  '#customOverlay{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(720px,95vw)}#modHubManagerToolsMenu{position:fixed;width:230px;z-index:20}',
  '.modhub-manager-tool-row{display:flex}.modhub-manager-tool-action{flex:1}.modhub-manager-tool-pin{flex:none}',
  '#modHubRestorePanelOverlay{position:fixed;inset:0;display:grid;place-items:center;z-index:30}',
  '#modHubRestorePanel{font:16px/1.6 sans-serif;width:min(720px,95vw);overflow:hidden}.modhub-restore-panel-body{overflow:auto}',
 ].join('\n')});
 await page.locator('body').evaluate((body,filler)=>{
  body.insertAdjacentHTML('beforeend','<div id="customOverlay" data-overlay="modloader"><header id="customOverlayTitle"><div id="overlayTabs" class="modhub-modloader-tabs"><button id="main-action">Workspace preferences and notifications</button><button>Overview</button><button>History</button></div><button id="main-close">Close</button></header><div id="customOverlayContent"><div id="modHubModManageContainer" class="modhub-container"><button id="modHubManagerToolsBtn" aria-haspopup="menu" aria-expanded="false">Tools</button><div class="modhub-btn-group"><button class="btn-delete"><span class="red">Warning</span></button></div><span id="caller-text" style="font:17px monospace">Caller status</span>'+filler.repeat(20)+'</div></div></div>');
  const main=settingsNode<HTMLElement>('#customOverlay');
  settingsNode<HTMLElement>('#main-action').onclick=()=>nativeCalls++;
  settingsNode<HTMLElement>('#main-close').onclick=()=>{main.hidden=true;settingsNode<HTMLElement>('#native').focus()};
 },filler);
 await page.addStyleTag({path:'compat/modhub-soft-wet/modhub-soft-wet.css'});
 await page.addScriptTag({type:'module',content:[
  "import {createUiRuntime} from '/src/runtime/ui.ts';",
  "window.modUtils={getMod:name=>name==='ModHub'?{version:'2.0.2'}:undefined,getSemVerTools:()=>({parseVersion:v=>({version:v}),parseRange:r=>r,satisfies:(v,r)=>v==='2.0.2'&&r==='>=1.3.0'})};",
  "window.probeRuntime=createUiRuntime(window,()=>theme.getPreferences());window.DoLGameUI={ui:probeRuntime.api};",
  "await import('/compat/modhub-soft-wet/modhub-soft-wet.ts');",
 ].join('\n')});
 await full(main,'ModHubSoftWet');
 const warning=page.locator('.btn-delete .red'),warningColor=await warning.evaluate(n=>getComputedStyle(n).color);
 const menuRows=Array.from({length:24},(_,i)=>'<div class="modhub-manager-tool-row" role="none"><button class="modhub-manager-tool-action" role="menuitem" tabindex="-1">'+(i===0?'Workspace preferences and notifications':'Sample '+i)+'</button><button class="modhub-manager-tool-pin" data-modhub-pin-tool="sample" aria-label="Pin" tabindex="-1">+</button></div>').join('');
 await page.locator('#modHubModManageContainer').evaluate((n,rows)=>n.insertAdjacentHTML('afterbegin','<div id="modHubManagerToolsMenu" class="modhub-manager-tools-menu" role="menu" hidden>'+rows+'</div>'),menuRows);
 // Load only the archived menu positioning, keyboard and dismissal function.
 const vendor=fs.readFileSync('docs/evolution/perf-4.1-evidence-20261026/vendor/modhub-manager.js','utf8');
 const start=vendor.indexOf('function modHubBindManagerTools(container)'),end=vendor.indexOf('\nwindow.modHubRenderModManageUI',start);
 assert.ok(start>=0&&end>start);
 await page.addScriptTag({content:vendor.slice(start,end)+'\nmodHubBindManagerTools(document.getElementById("modHubModManageContainer"));'});
 await page.locator('.modhub-manager-tool-action').first().evaluate(n=>n.addEventListener('click',()=>nativeCalls++));
 const trigger=page.locator('#modHubManagerToolsBtn'),menu=page.locator(tools);
 const openTools=async()=>{await trigger.click();await full('body>'+tools,'ModHubSoftWetTools')};
 const restoreHTML='<div id="modHubRestorePanelOverlay" class="modhub-restore-panel-overlay"><section id="modHubRestorePanel" class="modhub-restore-panel" role="dialog" aria-modal="true"><header class="modhub-restore-panel-header">Review</header><div class="modhub-restore-panel-body"><button id="restore-action">Workspace preferences and notifications</button>'+filler.repeat(20)+'</div><footer class="modhub-restore-panel-footer"><button id="restore-close">Close</button></footer></section></div>';
 await page.locator('body').evaluate((n,html)=>{
  n.insertAdjacentHTML('beforeend',html);
  const panel=settingsNode<HTMLElement>('#modHubRestorePanelOverlay');
  settingsNode<HTMLElement>('#restore-action').onclick=()=>nativeCalls++;
  settingsNode<HTMLElement>('#restore-close').onclick=()=>{panel.remove();settingsNode<HTMLElement>('#modHubManagerToolsBtn').focus()};
  Reflect.set(window,'detachedRestore',panel);
 },restoreHTML);
 const releasedRestore=()=>page.waitForFunction(()=>!Reflect.get(window,'detachedRestore').hasAttribute('data-dgu-adapter'));
 const removeRestore=async()=>{await page.locator(restore).evaluate(n=>n.remove());await releasedRestore()};
 const addRestore=async()=>{await page.evaluate(()=>document.body.append(Reflect.get(window,'detachedRestore')));await full(restore,'ModHubSoftWetRestore')};
 await full(restore,'ModHubSoftWetRestore');
 await removeRestore();
 const samples:Array<{root:string;width:number;scale:number;center:boolean;glass:boolean;hitHeight:number;scroll:boolean}>=[];
 async function sample(root:string,action:string,scroll:string,scale:number,center:boolean,glass:boolean){
  const surface=page.locator(root),control=page.locator(action).first(),body=page.locator(scroll);
  await control.scrollIntoViewIfNeeded();
  const geometry=await surface.evaluate(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:innerWidth,h:innerHeight,font:getComputedStyle(n).fontSize,family:getComputedStyle(n).fontFamily,glass:getComputedStyle(n).backdropFilter}});
  assert.ok(geometry.left>=-1&&geometry.right<=geometry.w+1&&geometry.top>=-1&&geometry.bottom<=geometry.h+1,root+' '+JSON.stringify(geometry));
  assert.match(geometry.family,/Georgia/,root);assert.equal(geometry.font,scale===100?'16px':'24px',root);
  assert.equal(geometry.glass!=='none',glass,root+' glass '+geometry.glass);
  const metrics=await control.evaluate(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {height:r.height,family:s.fontFamily,font:s.fontSize,align:s.textAlign,hit:n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),wrap:n.scrollWidth<=n.clientWidth+1}});
  assert.match(metrics.family,/Georgia/,action);assert.equal(metrics.font,scale===100?'13px':'19.5px',action);assert.equal(metrics.align,center?'center':'left',action);
  assert.ok(metrics.height>=44*scale/100&&metrics.hit&&metrics.wrap,action+' '+JSON.stringify(metrics));
  const scrollable=await body.evaluate(n=>{const el=n as HTMLElement,original=el.scrollTop;el.scrollTop=el.scrollHeight;const moved=el.scrollTop>0;el.scrollTop=original;return {moved,noOverflow:el.scrollWidth<=el.clientWidth+1}});
  assert.ok(scrollable.moved&&scrollable.noOverflow,scroll+' '+JSON.stringify(scrollable));
  samples.push({root,width:geometry.w,scale,center,glass,hitHeight:metrics.height,scroll:scrollable.moved});
 }
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:width===390?340:800});
  for(const scale of [100,150]){
   const center=scale===150,glass=width===390?center:!center;
   await page.evaluate(({scale,center,glass})=>{theme.setPreference('fontScale',scale);theme.setPreference('buttonScale',scale);theme.setPreference('centerOptions',center);theme.setPreference('visualGlass',glass)},{scale,center,glass});
   await sample(main,'#main-action','#customOverlayContent',scale,center,glass);
   await openTools();await sample(tools,'.modhub-manager-tool-action',tools,scale,center,glass);
   await page.keyboard.press('Escape');
   assert.ok(await trigger.evaluate(n=>n===document.activeElement));assert.ok(await menu.isHidden());
   await addRestore();await sample('#modHubRestorePanel','#restore-action','.modhub-restore-panel-body',scale,center,glass);
   await page.locator('#restore-close').click();await releasedRestore();assert.ok(await trigger.evaluate(n=>n===document.activeElement));
  }
 }
 assert.equal(await warning.evaluate(n=>getComputedStyle(n).color),warningColor);
 assert.equal(await page.locator('#caller-text').evaluate(n=>getComputedStyle(n).fontFamily),'monospace');
 await page.locator('#main-action').click();await openTools();
 await menu.getByRole('menuitem').first().click();assert.ok(await menu.isHidden());
 await addRestore();await page.locator('#restore-action').click();assert.equal(await page.evaluate(()=>nativeCalls),3);
 // Retain actual native nodes and handlers across recognition changes.
 async function drift(root:string,id:string,required:string,safe:string){
  const host=page.locator(root),control=host.locator('button').first();
  const requiredNode=await page.locator(required).elementHandle(),safeNode=await page.locator(safe).elementHandle();
  assert.ok(requiredNode&&safeNode);
  // Remove the fingerprint without replacing native nodes.
  for(const node of [requiredNode,safeNode]){
   await node.evaluate(n=>{Reflect.set(n,'savedIdentity',[n.getAttribute('id'),n.getAttribute('class')]);n.removeAttribute('id');n.removeAttribute('class')});
   if(node===requiredNode)await page.locator(root+'[data-dgu-adapter-match=partial]').waitFor();
   else await page.waitForFunction(selector=>!settingsNode(selector).hasAttribute('data-dgu-adapter'),root);
   assert.doesNotMatch(await control.evaluate(n=>getComputedStyle(n).fontFamily),/Georgia/);
  }
  for(const node of [safeNode,requiredNode])await node.evaluate(n=>{
   const [id,cls]=Reflect.get(n,'savedIdentity');if(id!==null)n.setAttribute('id',id);if(cls!==null)n.setAttribute('class',cls);
  });
  await full(root,id);
 }
 await drift(restore,'ModHubSoftWetRestore','.modhub-restore-panel-footer','#modHubRestorePanel');
 await removeRestore();await drift(main,'ModHubSoftWet','#modHubModManageContainer','#overlayTabs');
 await openTools();
 const row=menu.locator('.modhub-manager-tool-row').first();await row.evaluate(n=>n.classList.remove('modhub-manager-tool-row'));
 await page.locator(tools+'[data-dgu-adapter-match=partial]').waitFor();
 assert.doesNotMatch(await menu.getByRole('menuitem').first().evaluate(n=>getComputedStyle(n).fontFamily),/Georgia/);
 // The menu's safe fingerprint is :scope. Losing its scope releases it to idle.
 await menu.evaluate(n=>n.classList.remove('modhub-manager-tools-menu'));await page.waitForFunction(()=>!settingsNode('#modHubManagerToolsMenu').hasAttribute('data-dgu-adapter'));
 await menu.evaluate(n=>{n.classList.add('modhub-manager-tools-menu');n.firstElementChild!.classList.add('modhub-manager-tool-row')});
 // Native close and reopen rediscover the same node after its scope was lost.
 await page.keyboard.press('Escape');await openTools();
 // Short lists preserve their intrinsic height and keyboard destination.
 await menu.evaluate(n=>{for(const extra of [...n.children].slice(2))extra.remove()});
 await menu.getByRole('menuitem').first().focus();await page.keyboard.press('End');
 assert.ok(await menu.getByRole('menuitem').last().evaluate(n=>n===document.activeElement));
 assert.ok(await menu.evaluate(n=>{
  const last=n.lastElementChild!.getBoundingClientRect(),box=n.getBoundingClientRect();
  return last.bottom<=box.bottom&&box.bottom-last.bottom<=12;
 }),'short menu should end after its final row');
 await page.keyboard.press('Escape');await page.locator('#main-close').click();await page.waitForFunction(()=>!settingsNode('#customOverlay').hasAttribute('data-dgu-adapter'));
 assert.ok(await page.locator('#native').evaluate(n=>n===document.activeElement));
 await page.locator(main).evaluate(n=>{(n as HTMLElement).hidden=false});await full(main,'ModHubSoftWet');
 await openTools();await addRestore();
 await page.evaluate(()=>{Reflect.get(window,'ModHubSoftWet').destroy();Reflect.get(window,'probeRuntime').destroy()});
 for(const root of [main,tools,restore])assert.equal(await page.locator(root).getAttribute('data-dgu-adapter'),null);
 for(const action of ['#main-action','.modhub-manager-tool-action','#restore-action'])assert.doesNotMatch(await page.locator(action).first().evaluate(n=>getComputedStyle(n).fontFamily),/Georgia/);
 return {surfaces:['manager','tools','restore'],samples,neutralActions:3};
}
