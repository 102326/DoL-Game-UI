import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'vite';

const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0}});
await server.listen();
const address=server.httpServer!.address();assert.ok(address&&typeof address==='object');
const browser=await chromium.launch({channel:process.env.HOST5_BROWSER||'chrome'});
try{
 for(const legacy of [false,true]){
  const page=await browser.newPage({viewport:{width:1680,height:920}});
  page.setDefaultTimeout(5000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  if(legacy&&process.env.HOST5_LEGACY_BUNDLE){
   await page.route('**/dist/framework/host/index.js',route=>route.fulfill({path:process.env.HOST5_LEGACY_BUNDLE!,contentType:'text/javascript'}));
  }
  await page.goto('http://127.0.0.1:'+address.port+'/prototypes/host5/theme/sidebar.html'+(legacy?'?legacy':''));
  const button=(name:string)=>page.getByRole('button',{name,exact:true});
  const open=async()=>{await page.locator('#dol-midnight-sidebar-button').click();await button('材质').click()};
  await open();
  const snapshot=()=>page.evaluate(()=>{
   const css=(selector:string)=>getComputedStyle(document.querySelector(selector)!);
   return {sidebar:css('#ui-bar').backgroundColor,entry:css('#dol-midnight-sidebar-button').color,
    peer:document.querySelector('#peer .sample')?css('#peer .sample').backgroundColor:null,
    chip:document.querySelector('#peer span')?css('#peer span').backgroundColor:null};
  });
  const storage=()=>page.evaluate(()=>JSON.stringify({...localStorage}));
  const baseline=await snapshot(),previous=await storage();
  const sample=()=>page.locator('.sw-appearance-sample-panel').evaluate(n=>getComputedStyle(n).backgroundColor);
  if(legacy){
   assert.equal(await button('青灰').count(),0);
   await page.getByLabel('强调色',{exact:true}).fill('#92bad5');
   await button('应用并保存').click();
   assert.equal(await page.locator('html').evaluate(n=>n.style.getPropertyValue('--sw-custom-accent')),'#92bad5');
   assert.deepEqual(await snapshot(),baseline);
  }else{
   const visibleTogether=await page.evaluate(()=>{
    const rect=(selector:string)=>document.querySelector(selector)!.getBoundingClientRect();
    const left=rect('#dol-midnight-sidebar-button'),panel=rect('.dmt-settings-shell'),right=rect('#peer .sample');
    return left.width>0&&left.right<=panel.left&&panel.right<=right.left&&right.right<=innerWidth;
   });
   assert.ok(visibleTogether,'sidebar entry, modal settings and inspector share the viewport');
   const oldDraft=await sample();
   await button('青灰').click();assert.notEqual(await sample(),oldDraft);
   assert.deepEqual(await snapshot(),baseline);assert.equal(await storage(),previous);
   await button('取消试色').click();assert.equal(await sample(),oldDraft);
   assert.deepEqual(await snapshot(),baseline);assert.equal(await storage(),previous);
   await button('青灰').click();await button('应用并保存').click();
   await page.waitForFunction(()=>getComputedStyle(document.querySelector('#dol-midnight-sidebar-button')!).color==='rgb(146, 186, 213)');
   const applied=await snapshot();
   assert.deepEqual(applied,{sidebar:'rgb(32, 39, 50)',peer:'rgb(32, 39, 50)',entry:'rgb(146, 186, 213)',chip:'rgb(146, 186, 213)'});
   await page.reload();await open();assert.deepEqual(await snapshot(),applied);
  }
  await button('恢复默认外观').click();await page.waitForFunction(color=>getComputedStyle(document.querySelector('#dol-midnight-sidebar-button')!).color===color,baseline.entry);assert.deepEqual(await snapshot(),baseline);
  await page.reload();await open();assert.deepEqual(await snapshot(),baseline);
  assert.deepEqual(errors,[]);console.log(browser.version(),legacy?'legacy settings':'sidebar + inspector','apply, reset, reload verified');
  await page.close();
 }
}finally{await browser.close();await server.close()}
