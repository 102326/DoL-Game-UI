// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import playwright = require('playwright');
import assert = require('node:assert/strict');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
type ShopUi={getLifecycleCounts():{scans:number};setEnabled(value:boolean):void;destroy():void};
declare const ui:ShopUi,originals:HTMLAnchorElement[],calls:number[];
declare let purchase:number;
declare const must:<T>(value:T|null)=>T;
declare const SugarCube:{State:{variables:{money:number;clothingShopSlot:string;clothes_choice:number}}};
const {chromium}=playwright;
(async()=>{const [{createServer},{default:vue}]=await Promise.all([import('vite'),import('@vitejs/plugin-vue')]);const v=await createServer({configFile:false,root:process.cwd(),plugins:[vue(),{name:'shop-motion-test',configureServer(s){s.middlewares.use('/__shop_motion__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<html><body></body></html>')})}}],optimizeDeps:{noDiscovery:true,include:['vue']},server:{host:'127.0.0.1',port:0},logLevel:'error'});const b=await chromium.launch(browserOptions);try{await v.listen();const address=v.httpServer?.address();assert.ok(address&&typeof address!=='string');const port=address.port;const p=await b.newPage({viewport:{width:1280,height:900}});p.on('response',r=>{if(r.status()>=400)console.log('HTTP',r.status(),r.url())});p.on('console',m=>{if(m.type()==='error')console.log('PAGE',m.text())});await p.goto('http://127.0.0.1:'+port+'/__shop_motion__');await p.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null)=>{if(!value)throw Error('Missing shop fixture');return value}}));for(const path of ['src/theme/kraft-work-pages.css','src/theme/kraft-work-motion.css','src/ui/owned-select.css'])await p.addStyleTag({path});await p.evaluate(async()=>{const modulePath='/src/shop/main.ts',module:unknown=await import(modulePath);if(!module||typeof module!=='object'||!('startShop' in module)||typeof module.startShop!=='function')throw Error('Missing shop export');const startShop=module.startShop;document.documentElement.setAttribute('data-stone-free','');document.documentElement.setAttribute('data-dol-midnight','');document.documentElement.setAttribute('data-dgu-visualMotion','');document.body.innerHTML='<div id="passages"><div class="passage" data-passage="Clothing Shop"><div id="clothingShop-div"><div id="clothes-list"><div id="shop-list-pages"><div class="clothing-item" id="one"><span class="clothing-name"><a class="link-internal">Coat A</a></span></div><div class="clothing-item" id="two"><span class="clothing-name"><a class="link-internal">Coat B</a></span></div></div><div class="clothing-details"></div></div></div></div></div>';Object.assign(window,{SugarCube:{State:{passage:'Clothing Shop',variables:{money:10000,clothingShopSlot:'upper',clothes_choice:0}}},setup:{clothes:{upper:[{},{}]}},calls:[0,0],purchase:0,originals:[...document.querySelectorAll<HTMLAnchorElement>('.clothing-name a')]});originals.forEach((n,i)=>n.onclick=()=>{calls[i]=(calls[i]??0)+1;SugarCube.State.variables.clothes_choice=i;const body=must(document.querySelector<HTMLElement>('.clothing-details'));body.innerHTML='<p>Coat '+(i?'B':'A')+' £'+(i?20:10)+'</p><div class="buy-buttons"><a class="link-internal" id="buy">Buy</a><span class="gold">£'+(i?20:10)+'</span></div>';must(body.querySelector<HTMLElement>('#buy')).onclick=()=>purchase++});const started:unknown=startShop(window);if(!started||typeof started!=='object'||!('getLifecycleCounts' in started)||typeof started.getLifecycleCounts!=='function'||!('setEnabled' in started)||typeof started.setEnabled!=='function'||!('destroy' in started)||typeof started.destroy!=='function')throw Error('Invalid shop API');Object.assign(window,{ui:started})});
async function verifySelected(id:string,title:string){
 const card=p.locator('#'+id+'.dgshop-selected');
 await card.waitFor();
 assert.equal(await p.locator('.dgshop-selected').count(),1);
 assert.equal(await p.locator('.kw-shop-ripple,.kw-shop-stream,.kw-shop-ring,.kw-object-relay').count(),0);
 assert.equal(await card.evaluate(n=>n.getAnimations({subtree:true}).filter(a=>a.effect?.getTiming().iterations===Infinity).length),0);
 assert.equal(await p.locator('.clothing-details').evaluate(n=>getComputedStyle(n).transform),'none');
 assert.ok((await p.locator('.dgshop-detail-body').textContent()??'').includes(title));
 assert.ok(await p.evaluate(()=>originals.every(n=>n.isConnected)));
}
await p.locator('#one a').click();await verifySelected('one','Coat A £10');
await p.locator('#two a').click();await verifySelected('two','Coat B £20');
assert.deepEqual(await p.evaluate(()=>calls),[1,1]);
const scans=await p.evaluate(()=>ui.getLifecycleCounts().scans);await p.waitForTimeout(300);
assert.ok(await p.evaluate(()=>ui.getLifecycleCounts().scans)-scans<3,'selection must not trigger an observer loop');
await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#one a').click();await verifySelected('one','Coat A £10');
// The remaining catalog width, including space taken by the sidebar, chooses the detail presentation.
await p.setViewportSize({width:768,height:1024});
await p.locator('.dgshop-content').evaluate(n=>Object.assign((n as HTMLElement).style,{width:'550px',maxWidth:'100%',boxSizing:'border-box'}));
const onRight=()=>p.locator('.clothing-details').evaluate(n=>{const catalog=document.querySelector('.dgshop-catalog');return !!catalog&&n.getBoundingClientRect().left>=catalog.getBoundingClientRect().right&&!n.hasAttribute('popover')});
await p.waitForFunction(()=>document.querySelector('.clothing-details')?.matches(':popover-open'));
assert.equal(await onRight(),false,'550px container uses a drawer on a tablet');
await p.setViewportSize({width:390,height:844});
await p.waitForFunction(()=>document.querySelector('.clothing-details')?.matches(':popover-open'));
await p.emulateMedia({reducedMotion:'no-preference'});
assert.equal(await p.locator('.clothing-details').evaluate(n=>getComputedStyle(n).animationName),'dgshop-slide','phone uses the bottom entrance when motion is enabled');
await p.emulateMedia({reducedMotion:'reduce'});
assert.equal(await p.locator('.clothing-details').evaluate(n=>getComputedStyle(n).animationName),'none');
const drawer=await p.locator('.clothing-details').evaluate(n=>{const r=n.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width,bottomGap:innerHeight-r.bottom,viewport:innerWidth,popover:n.matches(':popover-open'),closeVisible:!!n.querySelector('.dgshop-close-detail')?.getClientRects().length}});
assert.ok(drawer.bottomGap>=0&&drawer.bottomGap<=16);assert.equal(drawer.popover,true);assert.equal(drawer.closeVisible,true);assert.ok(drawer.left>=0&&drawer.right<=drawer.viewport+1&&drawer.width<=900,'drawer stays bounded instead of spanning the viewport');
await p.locator('.dgshop-content').evaluate(n=>(n as HTMLElement).style.removeProperty('width'));await p.setViewportSize({width:1280,height:900});await p.waitForFunction(()=>!document.querySelector('.dgshop-content')?.classList.contains('dgshop-narrow'));
assert.ok(await onRight(),'desktop restores the right column and retires the popover');
await p.locator('.dgshop-content').evaluate(n=>n.removeAttribute('style'));
const picker=p.getByLabel('进店默认服装类型',{exact:true});await picker.click();assert.equal(await picker.evaluate(n=>n.matches(':open')),true);await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('[aria-label="进店默认服装类型"]')?.matches(':open'));assert.equal(await p.locator('.clothing-details').evaluate(n=>n.classList.contains('dgshop-detail-open')),true,'closing the native picker must preserve the shop detail');await p.keyboard.press('Escape');assert.equal(await p.locator('.clothing-details').evaluate(n=>n.classList.contains('dgshop-detail-open')),false,'a subsequent Escape still closes the shop detail');
await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>ui.setEnabled(false));assert.equal(await p.locator('.kw-shop-ripple,.dgshop-host').count(),0);assert.equal(await p.evaluate(()=>originals.every(n=>n.isConnected)),true);await p.evaluate(()=>ui.destroy());assert.deepEqual(await p.evaluate(()=>calls),[2,1]);assert.equal(await p.evaluate(()=>purchase),0);console.log('PASS native shop selection, single dispatch, actual detail/quote, no persistent animation, stable observer, reduced and restoration');}finally{await b.close();await v.close()}})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});
