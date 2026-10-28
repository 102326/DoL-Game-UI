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
 fs.mkdirSync(out,{recursive:true});
 try{for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`http://127.0.0.1:${address.port}/`);await page.getByText('共用窗口巡检 · 真实 UI 控制器＋合成内容',{exact:true}).click();
  // Cache entry must freeze/reuse live controllers, not dispose them.
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
  for(const kind of ['characteristics','social','journal','traits','statistics','feats','cheats','settings','attitudes'] as PreviewPanel[]){
   await page.getByLabel('巡检窗口',{exact:true}).selectOption(kind);await page.getByRole('button',{name:'打开窗口',exact:true}).click();
   const root=page.locator(kind==='attitudes'?'.passage[data-ui41-preview]':'#customOverlay[data-ui41-preview]'),prefix=kind==='characteristics'?'dgc':kind==='social'?'dgs':'dgp';
   await root.locator('.'+prefix+'-navigation').waitFor({timeout:3000});assert.equal(await page.evaluate(()=>ui41PanelPreview.current()),kind);
   const geometry=await root.evaluate(n=>{const r=n.getBoundingClientRect();return{x:r.x,width:r.width,right:r.right,overflow:n.scrollWidth>n.clientWidth+1}});assert.ok(geometry.x>=0&&geometry.right<=width+1&&!geometry.overflow,JSON.stringify({kind,width,geometry}));
   if(kind!=='attitudes')assert.match(await root.evaluate(n=>getComputedStyle(n).backgroundColor),/0\.43/,'approved material reaches actual owned overlay');
   const action=root.locator('[data-demo-action]').first(),before=await page.evaluate(()=>ui41PanelPreview.counts());await action.click();assert.equal(await page.evaluate(()=>ui41PanelPreview.counts()),before+1);
   const input=root.locator('input[type=checkbox]').first();if(await input.count()){await input.check();assert.equal(await input.isChecked(),true)}
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
  await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}));ui41PanelPreview.dispose()});assert.equal(await page.locator('[data-ui41-preview],.dgc-host,.dgs-host,.dgp-host').count(),0);await page.close();
 }assert.deepEqual(errors,[]);
 }finally{fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({rows,errors,scope:'Manual source-driven preview; original game, real business, device and weather migration unverified'},null,2));await browser.close();await server.close()}
 console.log('Preview evidence',out);
})().catch(e=>{console.error(e);process.exitCode=1});
