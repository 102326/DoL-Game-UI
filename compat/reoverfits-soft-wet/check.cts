import assert = require('node:assert/strict');
import path = require('node:path');
import playwright = require('playwright');
import type {WardrobeSlotMapping} from '../../src/public/wardrobe.ts';
const {chromium}=playwright;
function installFixture(){
 let registration:WardrobeSlotMapping|null=null,revokes=0,clicks=0;
 const nativeNode=document.querySelector<HTMLButtonElement>('#wear');if(!nativeNode)throw Error('Missing native wear fixture');nativeNode.onclick=()=>{clicks++};
 const modUtils={getMod:()=>({version:'4.1.1'}),getSemVerTools:()=>({parseVersion:(v:string)=>({version:v}),parseRange:(r:string)=>r,satisfies:(v:string,r:string)=>r==='>=4.1.1'&&['4.1.1','4.2.0'].includes(v)})};
 const DoLGameUI={ui:{getCapabilities:()=>({enabled:document.documentElement.hasAttribute('data-dol-midnight')})},wardrobe:{apiVersion:1,registerSlotMapping(spec:WardrobeSlotMapping){registration=spec;return{destroy(){revokes++}}}}};
 function adapter(){
  const value:unknown=Reflect.get(window,'ReOverfitsSoftWet');
  if(!value||typeof value!=='object'||!('getDiagnostics' in value)||typeof value.getDiagnostics!=='function'||!('destroy' in value)||typeof value.destroy!=='function')throw Error('Adapter API missing');
  const diagnostic:unknown=Reflect.apply(value.getDiagnostics,value,[]);
  if(!diagnostic||typeof diagnostic!=='object'||!('reason' in diagnostic)||typeof diagnostic.reason!=='string')throw Error('Adapter diagnostic reason missing');
  const destroy=value.destroy;return {reason:diagnostic.reason,destroy:()=>Reflect.apply(destroy,value,[])};
 }
 const probe={nativeNode,modUtils,adapter,get registration(){if(!registration)throw Error('Slot mapping not registered');return registration},get revokes(){return revokes},get clicks(){return clicks}};
 Object.assign(window,{modUtils,DoLGameUI,reoverfitsProbe:probe});return probe;
}
declare const reoverfitsProbe:ReturnType<typeof installFixture>;

(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage();await p.setContent('<html data-dol-midnight><body><div id="passages"><div class="passage"><div class="dgw-native" hidden><button id="wear">Wear</button></div><div class="dgw-list">Vue cards</div><div id="clothingShop-div"><div class="category-tab"><img ml-src="img/ui/clothes/categories/overupper.png"><a class="link-internal"></a></div></div></div></div></body></html>');
 await p.evaluate(installFixture);
 await p.addScriptTag({path:path.join(__dirname,'dist/scripts/reoverfits-soft-wet.js')});
 assert.deepEqual(await p.evaluate(()=>reoverfitsProbe.registration.slots),{over_head:'外层头饰',over_upper:'外套上装',over_lower:'外套下装'});
 assert.deepEqual(await p.evaluate(()=>reoverfitsProbe.registration.target.versions),['>=4.1.1']);
 assert.equal(await p.locator('.dgw-native').getAttribute('hidden'),'');assert.equal(await p.locator('.dgw-list').isVisible(),true);
 assert.equal(await p.locator('.category-tab a').getAttribute('aria-label'),'外套上装');assert.equal(await p.evaluate(()=>document.querySelector('#wear')===reoverfitsProbe.nativeNode),true);
 await p.addStyleTag({path:path.join(__dirname,'reoverfits-soft-wet.css')});await p.evaluate(()=>{document.documentElement.setAttribute('data-stone-free','');document.documentElement.style.setProperty('--dgu-font-scale','1.5');document.documentElement.style.setProperty('--dgu-button-scale','1.5');document.documentElement.style.setProperty('--dgu-option-text-align','center')});
 assert.equal(await p.locator('.category-tab a').evaluate(n=>getComputedStyle(n).fontSize),'21px');assert.ok(await p.locator('.category-tab a').evaluate(n=>n.getBoundingClientRect().height>=66));assert.equal(await p.locator('.category-tab a').evaluate(n=>getComputedStyle(n).textAlign),'center');
 await p.evaluate(()=>document.documentElement.removeAttribute('data-dol-midnight'));await p.waitForFunction(()=>{const link=document.querySelector('.category-tab a');return !!link&&!link.hasAttribute('aria-label')});assert.equal(await p.evaluate(()=>reoverfitsProbe.revokes),0);
 await p.evaluate(()=>{document.documentElement.setAttribute('data-dol-midnight','');reoverfitsProbe.modUtils.getMod=()=>({version:'4.1.0'});const list=document.querySelector('.dgw-list');if(!list)throw Error('Missing wardrobe fixture');list.append(document.createElement('span'))});await p.waitForFunction(()=>reoverfitsProbe.adapter().reason==='target-version-mismatch');assert.equal(await p.evaluate(()=>reoverfitsProbe.revokes),1);
 await p.evaluate(()=>{reoverfitsProbe.modUtils.getMod=()=>({version:'4.2.0'});const list=document.querySelector('.dgw-list');if(!list)throw Error('Missing wardrobe fixture');list.append(document.createElement('span'))});await p.waitForFunction(()=>reoverfitsProbe.adapter().reason==='model-registered');
 await p.evaluate(()=>{const adapter=reoverfitsProbe.adapter();adapter.destroy();adapter.destroy();reoverfitsProbe.nativeNode.click()});assert.equal(await p.evaluate(()=>reoverfitsProbe.revokes),2);assert.equal(await p.evaluate(()=>reoverfitsProbe.clicks),1);assert.equal(await p.locator('.category-tab a').getAttribute('aria-label'),null);assert.equal(await p.locator('.dgw-native').getAttribute('hidden'),'');
 console.log('PASS model registration/revoke, Vue retained, native identity/event, theme/version gates and cleanup');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
