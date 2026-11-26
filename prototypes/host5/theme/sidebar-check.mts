import {lightDesigns} from '../../../framework/materials/palette.ts';
import {checkDiamond} from './hub-check.mts';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import {loadPackage,readPackage} from '../panel-budget/package-input.mts';
import {createServer} from 'vite';

const paths=process.argv.slice(2);
function packages(){
 if(!paths.length)return;
 assert.equal(paths.length,3,'Pass release Host, candidate Host and candidate UI ZIPs');
 const release=readPackage(paths[0]!,'StoneFreeHost'),candidate=readPackage(paths[1]!,'StoneFreeHost'),ui=readPackage(paths[2]!,'DoLGameUI');
 assert.equal(release.sha,'6f221a29f9a042e9c5f32b4b9be9894d6941df4bebd29a5d326a44a8377cb8b8');
 assert.notEqual(candidate.sha,release.sha);
 return {release,candidate,ui};
}
const inputs=packages();
const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0}});
await server.listen();
const address=server.httpServer!.address();assert.ok(address&&typeof address==='object');
const browser=await chromium.launch({channel:process.env.HOST5_BROWSER||'chrome'});
try{
 for(const legacy of [false,true]){
  const page=await browser.newPage({viewport:{width:1680,height:920}});
  page.setDefaultTimeout(5000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  if(!inputs&&legacy&&process.env.HOST5_LEGACY_BUNDLE){
   await page.route('**/dist/framework/host/index.js',route=>route.fulfill({path:process.env.HOST5_LEGACY_BUNDLE!,contentType:'text/javascript'}));
  }
  const url='http://127.0.0.1:'+address.port+'/prototypes/host5/theme/sidebar.html';
  if(inputs){
   // Reuse only the neutral DOM. Every Host/UI executable and stylesheet comes from boot.json.
   const html=readFileSync(new URL('./sidebar.html',import.meta.url),'utf8')
    .replace(/<script[^>]*><\/script>|<link rel="stylesheet"[^>]*>/g,'');
   await page.route(url,route=>route.fulfill({contentType:'text/html',body:html}));
   page.on('request',req=>{if(new URL(req.url()).pathname.startsWith('/dist/'))errors.push('Unexpected unpackaged runtime request')});
  }
  async function navigate(reload=false){
   if(reload)await page.reload();else await page.goto(url+(!inputs&&legacy?'?legacy':''));
   if(!inputs)return;
   await loadPackage(page,legacy?inputs.release:inputs.candidate);
   const capabilities=await page.evaluate(()=>{
    const host=window.DoLUiHost!;
    host.sceneReady();
    return {theme:'theme' in host,apply:typeof host.theme?.apply,sources:host.sources('host5.theme').length};
   });
   assert.deepEqual(capabilities,{theme:!legacy,apply:legacy?'undefined':'function',sources:legacy?0:1});
   if(!legacy)await page.evaluate(async()=>{
    const path='/prototypes/host5/theme/consumer.ts';
    const {mountConsumer}=await import(/* @vite-ignore */ path) as typeof import('./consumer');
    mountConsumer(window.DoLUiHost!,'ThemeInspector',document.querySelector('#peer')!);
   });
   await loadPackage(page,inputs.ui);
  }
  await navigate();
  const button=(name:string)=>page.getByRole('button',{name,exact:true});
  const open=async()=>{await page.locator('#dol-midnight-sidebar-button').click();await button('材质').click()};
  await open();
  const snapshot=()=>page.evaluate(()=>{
   const css=(selector:string)=>getComputedStyle(document.querySelector(selector)!);
   return {sidebar:css('#ui-bar').backgroundColor,entry:css('#dol-midnight-sidebar-button').color,
    peer:document.querySelector('#peer .sample')?css('#peer .sample').backgroundColor:null,
    chip:document.querySelector('#peer span')?css('#peer span').backgroundColor:null};
  });
  if(!legacy)await checkDiamond(page);
  const storage=()=>page.evaluate(()=>JSON.stringify({...localStorage}));
  const baseline=await snapshot(),previous=await storage();
  const sample=()=>page.locator('.sw-appearance-sample-panel').evaluate(n=>getComputedStyle(n).backgroundColor);
  if(legacy){
   assert.equal(await button('青灰').count(),0);
   await page.getByLabel('强调色',{exact:true}).fill('#92bad5');
   await button('应用并保存').click();
   assert.equal(await page.locator('html').evaluate(n=>n.style.getPropertyValue('--sw-custom-accent')),'#92bad5');
   assert.deepEqual(await snapshot(),baseline);
   await navigate(true);await open();
   assert.equal(await page.getByLabel('强调色',{exact:true}).inputValue(),'#92bad5');
   assert.equal(await page.locator('html').evaluate(n=>n.style.getPropertyValue('--sw-custom-accent')),'#92bad5');
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
   await page.waitForFunction(()=>getComputedStyle(document.querySelector('#dol-midnight-sidebar-button')!).color==='rgb(142, 192, 216)');
   const applied=await snapshot();
   assert.deepEqual(applied,{sidebar:'rgb(25, 32, 39)',peer:'rgb(34, 45, 55)',entry:'rgb(142, 192, 216)',chip:'rgb(142, 192, 216)'});
   await navigate(true);await open();assert.deepEqual(await snapshot(),applied);
  }
  await button('恢复默认外观').click();await page.waitForFunction(color=>getComputedStyle(document.querySelector('#dol-midnight-sidebar-button')!).color===color,baseline.entry);assert.deepEqual(await snapshot(),baseline);
  await navigate(true);await open();assert.deepEqual(await snapshot(),baseline);
  assert.equal(await page.locator('html').evaluate(n=>n.hasAttribute('data-sw-custom-colors')),false);
  assert.equal(await page.getByLabel('强调色',{exact:true}).inputValue(),'#93b5ca');
  if(!legacy){
   const key='DoLMidnightTheme.preferences.v1';
   const envelope={_scaleBaseline26:true,_readingBaseline41:true,readingBlockGap:7,fontScale:120,visualGlass:false};
   const edited={...lightDesigns.mist.colors,accent:'#765432'};
   const states=[
    {saved:{themeMode:'mist',colors:lightDesigns.mist.colors},expected:{}},
    {saved:{themeMode:'porcelain',colors:lightDesigns.porcelain.colors},expected:{}},
    {saved:{themeMode:'mist',colors:edited},expected:edited},
    {saved:{colors:{accent:'#765432'}},expected:{accent:'#765432'}},
   ];
   for(const {saved,expected} of states){
    await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key,value:{...envelope,appearance:{...saved,font:'Georgia'}}});
    for(let i=0;i<2;i++){
     await navigate(true);await open();
     const state=await page.evaluate(key=>({persisted:JSON.parse(localStorage.getItem(key)!),
      mode:document.documentElement.getAttribute('data-sw-theme'),active:document.documentElement.hasAttribute('data-sw-custom-colors'),
      glass:document.documentElement.hasAttribute('data-dgu-visualGlass'),
      font:getComputedStyle(document.querySelector('#native-prose')!).fontFamily}),key);
     assert.deepEqual(state.persisted,{...envelope,appearance:{colors:expected,font:'Georgia'}});
     assert.equal(state.mode,null);assert.equal(state.active,Object.keys(expected).length>0);
     assert.equal(state.glass,false);assert.match(state.font,/Georgia/);
     assert.deepEqual(await page.locator('[aria-label="颜色预设"] button').allTextContents(),['石墨灰','青灰']);
     if(!state.active)assert.deepEqual(await snapshot(),baseline);
    }
   }
   console.log('Player palette migration: both retired presets, edited palette, custom accent, font and other preferences survive two openings');
  }
  if(inputs)console.log('Host',legacy?inputs.release.sha:inputs.candidate.sha,'UI',inputs.ui.sha);
  assert.deepEqual(errors,[]);console.log(browser.version(),legacy?'legacy settings':'sidebar + inspector','apply, reset, reload verified');
  await page.close();
 }
}finally{await browser.close();await server.close()}
