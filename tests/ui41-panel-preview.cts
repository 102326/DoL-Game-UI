// Manual 4.1 multi-consumer preview smoke, not game or device acceptance.
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import type {PreviewPanel} from '../prototypes/evolution41-ui/panels';
declare const ui41PanelPreview:ReturnType<typeof import('../prototypes/evolution41-ui/panels').createPanelPreview>;
declare const hubPreview:typeof import('../prototypes/evolution-integration/hub-preview').hubPreview;
(async()=>{
 const {createUi41PreviewServer}=await import('../scripts/preview-ui41.mjs'),server=await createUi41PreviewServer(0);
 const address=server.httpServer?.address();if(!address||typeof address==='string')throw Error('Missing preview port');
 const browser=await playwright.chromium.launch(browserOptions),out=path.resolve('tests/artifacts/ui41/panels-'+Date.now()),rows:unknown[]=[],errors:string[]=[];
 fs.mkdirSync(out,{recursive:true});let complete=false,failure:string|undefined;
 try{for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`http://127.0.0.1:${address.port}/`);await page.getByText('共用窗口巡检 · 真实 UI 控制器＋合成内容',{exact:true}).click();
  await page.locator('#review-open-settings').click();const settingsToggle=page.getByRole('checkbox',{name:'手机紧凑按钮间距',exact:true});await settingsToggle.waitFor();
  const readToggle=(locator:playwright.Locator)=>locator.evaluate(async n=>{if(!(n instanceof HTMLInputElement))throw Error('Missing native toggle');await Promise.all(n.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));const c=getComputedStyle(n),p=getComputedStyle(n,'::before');return{appearance:c.appearance,width:c.width,height:c.height,radius:c.borderRadius,fill:c.backgroundColor,border:c.border,knob:p.backgroundColor,transform:p.transform}});
  const cardReference=await page.locator('#dol-midnight-controls .dmt-control-sheet').first().evaluate(n=>{const c=getComputedStyle(n);return{fill:c.backgroundColor,radius:c.borderRadius,border:c.border,shadow:c.boxShadow,padding:c.padding}});
  await settingsToggle.uncheck();const settingsOff=await readToggle(settingsToggle);await settingsToggle.check();const settingsOn=await readToggle(settingsToggle);await settingsToggle.uncheck();
  const settingsReference={card:cardReference,off:settingsOff,on:settingsOn};
  await page.locator('#dol-midnight-controls .dmt-close').click();
  let controlBaseline:unknown;
  // Cache entry must freeze/reuse live controllers, not dispose them.
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
  for(const kind of ['characteristics','social','journal','traits','statistics','feats','cheats','settings','attitudes'] as PreviewPanel[]){
   await page.getByLabel('巡检窗口',{exact:true}).selectOption(kind);await page.getByRole('button',{name:'打开窗口',exact:true}).click();
   const root=page.locator(kind==='attitudes'?'.passage[data-ui41-preview]':'#customOverlay[data-ui41-preview]'),prefix=kind==='characteristics'?'dgc':kind==='social'?'dgs':'dgp';
   await root.locator('.'+prefix+'-navigation').waitFor({timeout:3000});assert.equal(await page.evaluate(()=>ui41PanelPreview.current()),kind);
   if(kind!=='attitudes'){await root.locator('#overlayTabs.kw-heading-nav').waitFor();assert.equal(await root.locator('.kw-heading-weather').count(),1,'one actual navigation weather owner, no duplicate preview renderer');const card=root.locator('.characteristic-box,.relation-box,details.journal,#traitLists>:has(>.traitHeading),#featsList .feat,.settingsGrid').first();if(await card.count()){const style=await card.evaluate(n=>{const c=getComputedStyle(n);return{fill:c.backgroundColor,radius:c.borderRadius,border:c.border,shadow:c.boxShadow,padding:c.padding}});assert.deepEqual(style,settingsReference.card,'owned content wells consume the mature settings surface');}}

   const geometry=await root.evaluate(n=>{const r=n.getBoundingClientRect();return{x:r.x,width:r.width,right:r.right,overflow:n.scrollWidth>n.clientWidth+1}});assert.ok(geometry.x>=0&&geometry.right<=width+1&&!geometry.overflow,JSON.stringify({kind,width,geometry}));
   if(kind!=='attitudes')assert.match(await root.evaluate(n=>getComputedStyle(n).backgroundColor),/0\.43/,'approved material reaches actual owned overlay');
   await page.mouse.move(0,0);
   const controlStyle=await root.locator('.'+prefix+'-fallback').evaluate(n=>{const c=getComputedStyle(n);return{padding:c.padding,radius:c.borderRadius,minHeight:c.minHeight,background:c.backgroundColor,border:c.borderWidth,font:c.fontSize}});
   if(!controlBaseline)controlBaseline=controlStyle;else assert.deepEqual(controlStyle,controlBaseline,'owned navigation button styling agrees across consumers');
   const groupSelect=root.locator('.dgp-navigation select');if(await groupSelect.count()){const style=await groupSelect.evaluate(n=>{const c=getComputedStyle(n);return{padding:c.padding,radius:c.borderRadius,minHeight:c.minHeight,background:c.backgroundColor,border:c.borderWidth,font:c.fontSize}});assert.deepEqual(style,controlBaseline,'group select shares the navigation control surface');}

   if(kind==='attitudes'){
    await page.emulateMedia({reducedMotion:'no-preference'});await root.getByLabel('跳到分组',{exact:true}).selectOption('1');
    await page.waitForFunction(()=>[...document.querySelectorAll('.passage[data-ui41-preview] .settingsHeader')].some(n=>n.textContent==='其它态度'&&n.getAnimations().length>0));
    const feedback=await root.getByRole('heading',{name:'其它态度',exact:true}).evaluate(n=>{const a=n.getAnimations()[0],effect=a?.effect;if(a)a.pause();if(!(effect instanceof KeyframeEffect))throw Error('Missing actual inline heading animation');return{duration:effect.getTiming().duration,frames:effect.getKeyframes(),proxies:document.querySelectorAll('.kw-object-relay,.sf-source-trace,.kw-moving-focus').length}});assert.equal(feedback.duration,360);assert.equal(feedback.proxies,0);assert.ok(feedback.frames.every(f=>!('transform'in f)&&!('boxShadow'in f)));await root.locator('.dgp-fallback').click();assert.equal(await root.getByRole('heading',{name:'其它态度',exact:true}).evaluate(n=>n.getAnimations().length),0,'inline fallback cancels the actually in-flight title flash');await root.getByRole('button',{name:'恢复新版',exact:true}).click();await root.locator('.dgp-navigation').waitFor();await page.emulateMedia({reducedMotion:'reduce'});
   }
   const action=root.locator('[data-demo-action]').first(),before=await page.evaluate(()=>ui41PanelPreview.counts());await action.click();assert.equal(await page.evaluate(()=>ui41PanelPreview.counts()),before+1);
   const input=root.locator('input[type=checkbox]').first();if(await input.count()){
    await input.uncheck();const off=await readToggle(input);await input.check();const on=await readToggle(input);assert.deepEqual(off,settingsReference.off,'native off toggle uses settings rules');assert.deepEqual(on,settingsReference.on,'native on toggle uses settings rules');assert.equal(await input.isChecked(),true)}
   const note=root.locator('textarea');if(await note.count())await note.fill('本页测试笔记');
   await action.evaluate(n=>Reflect.set(window,'originalPanelAction',n));
   await root.locator('.'+prefix+'-fallback').click();await root.locator('.'+prefix+'-navigation').waitFor({state:'detached'});
   assert.equal(await action.evaluate(n=>n===Reflect.get(window,'originalPanelAction')),true,'fallback retains the same native action node');
   await action.click();assert.equal(await page.evaluate(()=>ui41PanelPreview.counts()),before+2);
   await root.getByRole('button',{name:'恢复新版',exact:true}).click();await root.locator('.'+prefix+'-navigation').waitFor({timeout:3000});assert.equal(await action.evaluate(n=>n===Reflect.get(window,'originalPanelAction')),true,'reentry does not clone native controls');
   if(await input.count())assert.equal(await input.isChecked(),true);if(await note.count())assert.equal(await note.inputValue(),'本页测试笔记');
   if(['characteristics','journal','attitudes'].includes(kind))await page.screenshot({path:path.join(out,`${kind}-${width}.png`)});
   await root.getByRole('button',{name:kind==='attitudes'?'返回正文':'关闭窗口',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.dgc-host,.dgs-host,.dgp-host,.kw-heading-weather'));
   rows.push({kind,width,status:'PASS',geometry,nativeCalls:2,scope:'synthetic content with actual source controllers'});console.log('PASS panel preview',kind,width);
  }
  // The same actual motion owner also serves adapters; this batch must not recolor their context.
  await page.locator('#customOverlay').evaluate(n=>{if(!(n instanceof HTMLElement))throw Error('Missing overlay');n.dataset.overlay='modhub';n.dataset.dguAdapter='ModHubSoftWet';n.dataset.dguAdapterMatch='full';n.classList.remove('hidden')});
  await page.locator('.kw-context-plane').waitFor();const adapterContext=await page.locator('.kw-context-plane').evaluate(n=>{const c=getComputedStyle(n);return{fill:c.backgroundColor,blur:c.backdropFilter}});assert.equal(adapterContext.fill,'rgba(8, 9, 11, 0.094)','adapter retains original context fill');assert.equal(adapterContext.blur,'blur(3px) contrast(0.94)','adapter retains original context filter');
  await page.locator('#customOverlay').evaluate(n=>{n.classList.add('hidden');n.removeAttribute('data-dgu-adapter');n.removeAttribute('data-dgu-adapter-match')});await page.waitForFunction(()=>!document.querySelector('.kw-context-plane'));
  await page.evaluate(()=>{ui41PanelPreview.dispose();const root=document.createElement('section');root.id='customOverlay';root.dataset.overlay='characteristics';root.className='dgc-overlay';root.style.cssText='position:fixed;left:20px;top:20px;width:300px;height:300px';root.innerHTML='<div id="customOverlayTitle">Controlled heading</div><nav id="overlayTabs" class="kw-heading-nav"><button data-kw-nav-control="tab">Controlled tab</button></nav><div id="customOverlayContent"><h1 class="header">Controlled preexisting class</h1></div>';document.body.append(root)});
  const retiredStyle=()=>page.locator('#customOverlay').evaluate(n=>[...n.querySelectorAll('#customOverlayTitle,h1.header,#overlayTabs>button')].map(el=>{const c=getComputedStyle(el);return{padding:c.padding,font:c.fontSize,radius:c.borderRadius,background:c.background}}));const originalStyle=await retiredStyle();
  await page.locator('#customOverlay').evaluate(n=>{const host=document.createElement('div');host.className='dgc-host';n.prepend(host)});
  await page.locator('.kw-context-plane[data-kw-settings-family]').waitFor();await page.locator('#customOverlay>.dgc-host').evaluate(n=>n.remove());
  await page.waitForFunction(()=>!document.querySelector('.kw-context-plane')?.hasAttribute('data-kw-settings-family'),{},{timeout:1500});
  assert.deepEqual(await retiredStyle(),originalStyle,'retiring owned host restores title/tab styles despite retained native class');
  assert.equal(await page.locator('#customOverlay').evaluate(n=>n.classList.contains('dgc-overlay')),true,'native preexisting class stays intact after host retirement');
  await page.locator('#customOverlay').evaluate(n=>{const host=document.createElement('div');host.className='dgc-host';n.prepend(host)});await page.locator('.kw-context-plane[data-kw-settings-family]').waitFor();await page.locator('#customOverlay').evaluate(n=>n.remove());await page.waitForFunction(()=>!document.querySelector('.kw-context-plane'));
  await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}));ui41PanelPreview.dispose()});assert.equal(await page.locator('[data-ui41-preview],.dgc-host,.dgs-host,.dgp-host').count(),0);await page.close();
 }assert.deepEqual(errors,[]);complete=true;
 }catch(error){failure=error instanceof Error?error.message:String(error);throw error}finally{fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:complete?'PASS':'FAIL',failure,rows,errors,scope:'Manual source-driven preview; original game, real business, device and weather migration unverified'},null,2));await browser.close();await server.close()}
 console.log('Preview evidence',out);
})().catch(e=>{console.error(e);process.exitCode=1});
