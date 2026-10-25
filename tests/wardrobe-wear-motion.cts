// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {Host,Participant} from '../framework/contracts';
declare const testWardrobe:{destroy():void;setEnabled(value:boolean):void};
declare const releaseTest:{host:Pick<Host,'invalidateScene'|'dispose'>;root:unknown;list:Element};
declare const must:<T>(value:T|null)=>T;
declare const rect:(value:DOMRect)=>{x:number;y:number;width:number;height:number;top:number;right:number;bottom:number;left:number};
declare let nativeCalls:number,listRefreshes:number;
const {chromium}=playwright;
(async()=>{
 const [{createServer},{default:vue}]=await Promise.all([import('vite'),import('@vitejs/plugin-vue')]);
 const server=await createServer({root:process.cwd(),configFile:false,plugins:[vue(),{name:'wardrobe-wear-fixture',configureServer(s){s.middlewares.use('/__wardrobe_wear__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<html><body></body></html>')})}}],optimizeDeps:{noDiscovery:true,include:['vue']},server:{host:'127.0.0.1',port:0},logLevel:'error'});
 const browser=await chromium.launch(browserOptions);
 try{
  await server.listen();const address=server.httpServer?.address();assert.ok(address&&typeof address!=='string');const port=address.port;const page=await browser.newPage({viewport:{width:1000,height:800}});
  await page.goto('http://127.0.0.1:'+port+'/__wardrobe_wear__');await page.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null)=>{if(!value)throw Error('Missing wardrobe fixture');return value},rect:(r:DOMRect)=>({x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,right:r.right,bottom:r.bottom,left:r.left})}));
  await page.addStyleTag({path:'src/theme/kraft-work-pages.css'});
  for(const zoom of [.8,1,1.25]){
   await page.evaluate(async zoom=>{
    (()=>{const previous:unknown=Reflect.get(window,'testWardrobe');if(previous&&typeof previous==='object'&&'destroy' in previous&&typeof previous.destroy==='function')previous.destroy()})();document.body.innerHTML='<div style="height:150px"></div><div id="passages"><div class="passage" data-passage="Wardrobe"><div id="wardrobeList"></div></div></div><div style="height:1000px"></div>';
    document.body.style.zoom=String(zoom);document.documentElement.setAttribute('data-stone-free','');document.documentElement.setAttribute('data-dgu-visualMotion','');
    const item=(index:number)=>({index,variable:'shirt'+index,name:'shirt'+index,name_cap:'Shirt '+index,accIcon:0,integrity:100,integrity_max:100,type:[],warmth:1});
    const variables={location:'home',lastWardrobeSlot:'upper',worn:{upper:item(0)},wardrobe:{space:20,upper:[item(1),item(2)]},wornStacking:{upper:new Array<ReturnType<typeof item>>()},wardrobeDefaults:{}};
    Object.assign(window,{nativeCalls:0});
    const root={State:{passage:'Wardrobe',variables},setup:{clothes:{upper:[item(0),item(1),item(2)]}},Wikifier:class{constructor(output:Element,source:string){const match=source.match(/wearlink_norefresh "Soft & Wet" (\d+)/);if(!match)return;const a=document.createElement('a');a.className='link-internal';a.onclick=()=>{nativeCalls++;const moved=variables.wardrobe.upper.splice(Number(match[1]),1)[0];if(!moved)throw Error('Missing worn fixture item');variables.wornStacking.upper.push(moved);must(document.querySelector<HTMLElement>('#growth')).style.height=(nativeCalls*140)+'px'};output.append(a)}}};
    const modulePath='/src/wardrobe/main.ts',module:unknown=await import(modulePath);if(!module||typeof module!=='object'||!('startWardrobe' in module)||typeof module.startWardrobe!=='function')throw Error('Missing wardrobe export');const started:unknown=module.startWardrobe(root);if(!started||typeof started!=='object'||!('destroy' in started)||typeof started.destroy!=='function'||!('setEnabled' in started)||typeof started.setEnabled!=='function')throw Error('Invalid wardrobe API');Object.assign(window,{testWardrobe:started});
   },zoom);
   await page.waitForSelector('.dgw-item');
   await page.evaluate(()=>{const list=must(document.querySelector<HTMLElement>('.dgw-items')),growth=document.createElement('div'),filler=document.createElement('div');growth.id='growth';list.before(growth);filler.style.height='500px';list.append(filler);list.style.height='180px';list.style.overflow='auto';window.scrollTo(0,100)});
   const before=await page.evaluate(()=>{const item=must(document.querySelector<HTMLElement>('.dgw-item')),list=must(item.closest<HTMLElement>('.dgw-items'));const box=item.getBoundingClientRect(),parent=list.getBoundingClientRect();item.click();return {box:rect(box),parent:rect(parent)}});
   await page.waitForTimeout(90);
   const after=await page.evaluate(()=>{const n=document.querySelector('.kw-wardrobe-press'),p=must(document.querySelector<HTMLElement>('.dgw-items'));return {parent:n?.parentElement===p,box:n?rect(n.getBoundingClientRect()):null,list:rect(p.getBoundingClientRect()),pointer:n&&getComputedStyle(n).pointerEvents,calls:nativeCalls}});
   assert.equal(after.parent,true);assert.equal(after.pointer,'none');assert.equal(after.calls,1);assert.ok(after.box);
   for(const axis of ['x','y'] as const)assert.ok(Math.abs((after.box[axis]-after.list[axis])-(before.box[axis]-before.parent[axis]))<1.5,`Ripple follows inventory at zoom ${zoom}: ${axis}`);
   for(const size of ['width','height'] as const)assert.ok(Math.abs(after.box[size]-before.box[size])<1.5,`Ripple size at zoom ${zoom}`);
   const scrolled=await page.evaluate(()=>{const list=must(document.querySelector<HTMLElement>('.dgw-items'));const before=list.scrollTop;list.scrollTop+=32;return {delta:list.scrollTop-before,box:rect(must(document.querySelector<HTMLElement>('.kw-wardrobe-press')).getBoundingClientRect())}});
   assert.ok(scrolled.delta>30&&scrolled.delta<34);assert.ok(Math.abs(after.box.y-scrolled.box.y-scrolled.delta*zoom)<1.5,'Inner scrolling carries the material with the list');
   await page.evaluate(()=>{window.scrollBy(0,60);must(document.querySelector<HTMLElement>('.dgw-item')).click()});await page.waitForTimeout(80);
   assert.equal(await page.locator('.kw-wardrobe-press').count(),1,'Repeated wear replaces only its own material');
   await page.evaluate(()=>testWardrobe.destroy());await page.waitForTimeout(30);assert.equal(await page.locator('.kw-wardrobe-press').count(),0);
  }
  for(const stale of [false,true]){
   await page.evaluate(async()=>{
    document.body.style.zoom='1';document.body.innerHTML='<div id="passages"><div class="passage" data-passage="Wardrobe"><div id="wardrobeList"></div></div></div>';
    const item={index:1,variable:'shirt',name:'shirt',name_cap:'Shirt',integrity:100,type:[]},naked={index:0,name:'naked'};
    const variables={location:'home',lastWardrobeSlot:'upper',worn:{upper:item,head:naked},wardrobe:{space:20,upper:[],head:[]},wardrobeDefaults:{},options:{images:0}};
    Object.assign(window,{listRefreshes:0});
    const root={State:{passage:'Wardrobe',variables},setup:{clothes:{upper:[naked,item],head:[naked]}},Wikifier:class{constructor(output:Element,source:string){const slot=source.match(/\$lastWardrobeSlot="([a-z_]+)"/);if(slot?.[1])variables.lastWardrobeSlot=slot[1];if(source.includes('<<wardrobeContents>>'))listRefreshes++}}};
    const {createHost}=await import('/framework/host.ts');const host=createHost(window),owner=host.register('wardrobe-release');Object.assign(window,{releaseTest:{host,root,list:must(document.querySelector('#wardrobeList'))}});
    const wardrobePath='/src/wardrobe/main.ts',module:unknown=await import(wardrobePath);if(!module||typeof module!=='object'||!('startWardrobe' in module)||typeof module.startWardrobe!=='function')throw Error('Missing wardrobe export');const started:unknown=module.startWardrobe(root,{host,owner});if(!started||typeof started!=='object'||!('destroy' in started)||typeof started.destroy!=='function'||!('setEnabled' in started)||typeof started.setEnabled!=='function')throw Error('Invalid wardrobe API');Object.assign(window,{testWardrobe:started});
   });
   await page.waitForSelector('.dgw-slots button');
   await page.locator('.dgw-slots button').filter({hasText:'头饰'}).click();
   assert.equal(await page.evaluate(()=>listRefreshes),0,'closed native category defers its list');
   await page.evaluate(stale=>{if(stale)releaseTest.host.invalidateScene();else testWardrobe.setEnabled(false)},stale);
   await page.waitForFunction(()=>!document.querySelector('.dgw-shell'));
   assert.equal(await page.evaluate(()=>listRefreshes),stale?0:1,'scene abort must not execute native widgets after temporary State is reset; current-scene fallback must refresh');
   assert.equal(await page.evaluate(()=>releaseTest.list===document.querySelector('#wardrobeList')),true,'both release paths restore the original node');
   await page.evaluate(()=>{testWardrobe.destroy();releaseTest.host.dispose();localStorage.removeItem('DoLGameUI.wardrobe.v1')});
  }
  console.log('PASS actual wardrobe wear material at 80/100/125% zoom, native callback/teardown, and current versus stale-scene native-list release');
 }finally{await browser.close();await server.close()}
})().catch(error=>{receipt.terminalFailure(error);process.exitCode=1});
