// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {Page} from 'playwright';

declare const fixture:{calls:{resolve:(canvas:HTMLCanvasElement)=>void;reject:(error:Error)=>void}[];api:{refresh():void;setEnabled(value:boolean):void}};
const {chromium}=playwright;
(async()=>{
 const [{createServer},{default:vue}]=await Promise.all([import('vite'),import('@vitejs/plugin-vue')]);
 const server=await createServer({root:process.cwd(),configFile:false,plugins:[{name:'controlled-outfit-renderer',enforce:'pre',load(id){if(id.replaceAll('\\','/').endsWith('/src/wardrobe/render.ts'))return `export function renderOutfit(){return new Promise((resolve,reject)=>window.fixture.calls.push({resolve,reject}))}`}},vue(),{name:'preview-loading-fixture',configureServer(s){s.middlewares.use('/__preview_loading__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<html><body></body></html>')})}}],optimizeDeps:{noDiscovery:true,include:['vue']},server:{host:'127.0.0.1',port:0},logLevel:'error'});
 const browser=await chromium.launch(browserOptions);
 try{
  await server.listen();const address=server.httpServer?.address();assert.ok(address&&typeof address!=='string');const port=address.port;
  async function setup(){
   const page=await browser.newPage({viewport:{width:1000,height:800}}),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(`http://127.0.0.1:${port}/__preview_loading__`);
   await page.evaluate(async()=>{
    document.body.innerHTML='<div id="passages"><div class="passage" data-passage="Wardrobe"><div id="wardrobeList"></div></div></div>';
    const item=(index:number)=>({variable:'shirt'+index,name:'shirt'+index,name_cap:'Shirt '+index,accIcon:0,integrity:100,integrity_max:100,type:[],warmth:1});
    const variables={location:'home',lastWardrobeSlot:'upper',worn:{upper:item(0)},wardrobe:{space:20,upper:[item(1)]},wornStacking:{upper:[]},wardrobeDefaults:{}};
    const root={State:{passage:'Wardrobe',variables},setup:{clothes:{upper:[item(0),item(1)]}},Wikifier:class{}};
    const f={calls:[] as typeof fixture.calls,api:null as unknown as typeof fixture.api};Object.assign(window,{fixture:f});
    const modulePath='/src/wardrobe/main.ts';const module=await import(modulePath);f.api=module.startWardrobe(root);
   });
   await page.waitForSelector('.dgw-preview');
   assert.equal(await page.evaluate(()=>fixture.calls.length),1,'mounted preview has already started fallback without a grace timer');
   assert.equal(await page.locator('.dgw-preview').getAttribute('aria-busy'),'true','fallback starts while loading');
   return {page,errors};
  }
  async function resolve(page:Page,index:number){await page.evaluate(index=>{const canvas=document.createElement('canvas');canvas.dataset.previewSource='fallback-'+index;fixture.calls[index]!.resolve(canvas)},index)}
  async function native(page:Page){await page.evaluate(()=>{const container=document.createElement('div');container.id='sidebar-img-container';container.innerHTML='<div id="img"><canvas class="mainCanvas" width="16" height="16"></canvas></div>';document.body.append(container);const canvas=container.querySelector('canvas')!;canvas.getContext('2d')!.fillRect(0,0,16,16)});await page.waitForSelector('.dgw-preview canvas[data-preview-source=sidebar]');}
  async function check(page:Page,errors:string[]){assert.deepEqual(errors,[],'no uncaught page errors');await page.close()}
  {
   const {page,errors}=await setup();await resolve(page,0);await page.waitForSelector('.dgw-preview canvas[data-preview-source=fallback-0]');
   assert.equal(await page.locator('.dgw-preview').getAttribute('aria-busy'),'false');assert.equal(await page.evaluate(()=>fixture.calls.length),1);
   await check(page,errors);
  }
  for(const outcome of ['resolve','reject'] as const){
   const {page,errors}=await setup();await native(page);
   assert.equal(await page.locator('.dgw-preview').getAttribute('aria-busy'),'false');
   if(outcome==='resolve')await resolve(page,0);else await page.evaluate(()=>fixture.calls[0]!.reject(Error('late failure')));
   await page.evaluate(()=>new Promise<void>(resolve=>setTimeout(resolve,0)));
   assert.equal(await page.locator('.dgw-preview canvas[data-preview-source=sidebar]').count(),1,`late ${outcome} does not replace native`);
   assert.doesNotMatch(await page.locator('.dgw-render-status').innerText(),/不可用/);assert.equal(await page.evaluate(()=>fixture.calls.length),1);await check(page,errors);
  }
  {
   const {page,errors}=await setup();await page.evaluate(()=>fixture.api.setEnabled(false));await resolve(page,0);
   await page.evaluate(()=>new Promise<void>(resolve=>setTimeout(resolve,0)));
   assert.equal(await page.locator('.dgw-preview').count(),0,'disabled view stays unmounted');await check(page,errors);
  }
  {
   const {page,errors}=await setup();await page.evaluate(()=>fixture.api.refresh());await page.waitForFunction(()=>fixture.calls.length===2,undefined,{polling:10});
   await resolve(page,1);await page.waitForSelector('.dgw-preview canvas[data-preview-source=fallback-1]');await resolve(page,0);
   await page.evaluate(()=>new Promise<void>(resolve=>setTimeout(resolve,0)));
   assert.equal(await page.locator('.dgw-preview canvas[data-preview-source=fallback-1]').count(),1,'old paint cannot replace newer paint');
   assert.equal(await page.locator('.dgw-preview').getAttribute('aria-busy'),'false');await check(page,errors);
  }
  console.log('PASS actual wardrobe preview orchestration with controlled renderer; native Renderer not tested');
 }finally{await browser.close();await server.close()}
})().catch(error=>{receipt.terminalFailure(error);process.exitCode=1});
