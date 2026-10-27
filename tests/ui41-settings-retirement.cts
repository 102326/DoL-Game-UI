import assert = require('node:assert/strict');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import type {Preferences,PreferenceKey} from '../src/theme/preferences';
type Theme={openSettings():void;setPreference(key:PreferenceKey,value:boolean|number):void;getPreferences():Preferences;destroy():void};
declare const theme:Theme,restart:()=>void;
(async()=>{
 const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default;
 const server=await createServer({configFile:false,plugins:[vue(),{name:'ui41-settings-fixture',configureServer(s){s.middlewares.use('/__ui41_settings__',(req,res)=>{const official=req.url?.includes('official');res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html ${official?'data-stone-free':''} data-dmt-compact-stats><body><div id="stats"></div><div id="storyCaptionContent"></div><div id="statmeters"><div>status</div></div><script type="module">import {startLayout} from '/src/theme/layout.ts';import {startTheme} from '/src/theme/controller.ts';localStorage.setItem('DoLMidnightTheme.preferences.v1',JSON.stringify({_scaleBaseline26:true,compactStats:true,wideReading:true,mobileCompactControls:true,visualPattern:true,wardrobeHiddenList:false,shopDeferredPaint:false,shopPageExperiment:false}));window.restart=()=>{startLayout();startTheme();window.theme=window.DoLMidnightTheme};window.restart();</script></body></html>`)})}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});
 let browser:playwright.Browser|undefined;
 try{
  await server.listen();const address=server.httpServer?.address();if(!address||typeof address==='string')throw Error('Missing server address');
  browser=await playwright.chromium.launch(browserOptions);
  for(const mode of ['legacy','official']){
   const page=await browser.newPage({viewport:{width:390,height:844}});await page.emulateMedia({reducedMotion:'reduce'});
   await page.goto(`http://127.0.0.1:${address.port}/__ui41_settings__?${mode}`);await page.waitForFunction(()=>typeof theme!=='undefined');
   const before=await page.evaluate(()=>({prefs:theme.getPreferences(),stored:JSON.parse(localStorage.getItem('DoLMidnightTheme.preferences.v1')||'{}'),compact:document.documentElement.hasAttribute('data-dmt-compact-stats'),reading:document.documentElement.dataset.dmtReading,controls:document.documentElement.hasAttribute('data-dgu-compact-controls')}));
   assert.equal(before.prefs.compactStats,false);assert.equal(before.stored.compactStats,false);assert.equal(before.compact,false);assert.equal(before.reading,'wide');assert.equal(before.controls,true);
   for(const key of ['wardrobeHiddenList','shopDeferredPaint','shopPageExperiment'] as const)assert.equal(before.prefs[key],false);
   await page.evaluate(()=>{theme.setPreference('compactStats',true);theme.setPreference('visualMotion',false);theme.openSettings()});
   assert.equal(await page.evaluate(()=>theme.getPreferences().compactStats),false);assert.equal(await page.evaluate(()=>document.documentElement.hasAttribute('data-dmt-compact-stats')),false);
   if(mode==='official')await page.getByRole('button',{name:'材质',exact:true}).click();
   assert.equal(await page.getByLabel('标题边缘纹样',{exact:true}).count(),1);assert.equal(await page.getByLabel('标题边缘纹样',{exact:true}).isChecked(),true);
   if(mode==='official')await page.getByRole('button',{name:'入口',exact:true}).click();
   assert.equal(await page.getByLabel('紧凑状态间距',{exact:true}).count(),0);
   if(mode==='official')await page.getByRole('button',{name:'高级',exact:true}).click();
   assert.equal(await page.getByText('兼容回退与实验选项',{exact:true}).count(),1);
   const experiments=page.locator('.dmt-experiments');assert.equal(await experiments.locator('[aria-label="标题边缘纹样"]').count(),0);
   await experiments.locator('summary').click();for(const label of ['衣柜延迟原版隐藏列表（实验）','商店离屏绘制延后（实验）'])assert.equal(await page.getByLabel(label,{exact:true}).isChecked(),false);
   await page.evaluate(()=>{theme.destroy();restart()});assert.equal(await page.evaluate(()=>theme.getPreferences().compactStats),false);assert.equal(await page.evaluate(()=>document.documentElement.hasAttribute('data-dmt-compact-stats')),false);
   await page.evaluate(()=>theme.destroy());await page.close();
  }
  console.log('PASS legacy compactStats migration and rejected writes; material and compatibility settings in both layouts');
 }finally{await browser?.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
