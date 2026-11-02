// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');

(async()=>{
 const {createSettingsPreviewServer}=await import('../scripts/preview-evolution-settings.mjs');
 const {createHubPreviewServer}=await import('../scripts/preview-evolution-hub.mjs');
 const {createBloodMoonPreview}=await import('../scripts/preview-evolution-blood-moon.ts');
 const browser=await playwright.chromium.launch(browserOptions);
 try{
  for(const mode of ['settings','settings-weather','hub','blood','special'] as const){
   const server=mode==='hub'?await createHubPreviewServer(0):mode==='blood'||mode==='special'?await createBloodMoonPreview(0,mode==='special'):await createSettingsPreviewServer(0);
   const address=server.httpServer?.address();assert.ok(address&&typeof address==='object');
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors:string[]=[];
   page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.goto('http://127.0.0.1:'+address.port+'/?'+(mode==='settings-weather'?'weather=heavy':''));
    assert.equal(await page.locator('script[type=module][src*="/evolution-integration/"]').count(),1,'preview logic must load the checked source');
    if(mode==='settings'||mode==='settings-weather')await page.waitForFunction(()=>typeof document.getElementById('native')?.onclick==='function');
    if(mode==='hub'){
     const ball=page.locator('.sf-motion-ball');await ball.click();
     await page.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-spin-phase')==='open');
     await page.locator('[data-motion-view$="native-social"]').click();
     await page.waitForFunction(()=>document.querySelector('#notice')?.textContent?.includes('原生动作：1 次'));
     await page.locator('#body-action').click();assert.equal(await page.locator('#notice').textContent(),'正文操作成功');
    }else{
     await page.locator(mode==='blood'||mode==='special'?'#open-review':'#dol-midnight-sidebar-button').click();
     await page.waitForFunction(()=>document.querySelector('dialog')?.open);
     const comfortable=page.getByLabel('手机紧凑按钮间距',{exact:true}),before=await comfortable.isChecked();await comfortable.click();assert.equal(await comfortable.isChecked(),!before);
     const keys=mode==='special'?['Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0']:mode==='blood'?['Digit2','Digit3','Digit1']:mode==='settings-weather'?['Digit3','Digit2','Digit1']:[];
     const states:unknown[]=[];
     for(const code of keys){await page.keyboard.press('Alt+'+code.replace('Digit',''));const state=await page.evaluate(()=>{const weather:unknown=Reflect.get(window,'Weather');if(!weather||typeof weather!=='object')throw Error('Missing preview Weather');return JSON.stringify(weather)});const parsed:unknown=JSON.parse(state);states.push(parsed)}
     if(mode==='special'){
      assert.deepEqual(states.map(value=>{assert.ok(value&&typeof value==='object');return ['bloodMoon','precipitation','temperature'].map(key=>Reflect.get(value,key))}),[[true,'none',20],[true,'rain',20],[false,'none',20],[false,'none',42],[false,'none',-22],[false,'snow',20],[false,'rain',20],[false,'snow',-22],[false,'rain',20]]);
     }
     if(mode==='blood'||mode==='special')assert.match(await page.locator('#review-caption').textContent()??'',/原速 \/ 受控预览/);
     await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('dialog')?.open);
     if(mode==='settings'||mode==='settings-weather'){await page.locator('#native').click();assert.equal(await page.locator('#native-status').textContent(),'正文操作：1 次')}
    }
    assert.deepEqual(errors,[]);console.log('PASS checked integration preview',mode);
   }finally{await page.close();await server.close()}
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
