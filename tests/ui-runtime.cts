import checkpoints = require('../scripts/ci-checkpoints.cjs');
const {checkpoint}=checkpoints;
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import playwright = require('playwright');
import esbuild = require('esbuild');
import mutations = require('./runtime-mutations.cjs');
import type {UiApi,StyleAdapter,AdapterHandle,SurfaceHandle,SurfaceRequest,SurfaceCloseReason,AdapterDiagnostics} from '../src/public/ui';
import type {GameUiControls} from '../src/runtime/game-controls';
import type {createUiRuntime} from '../src/runtime/ui';
const {chromium}=playwright,{build}=esbuild;
declare const UiRuntimeModule:{createUiRuntime:typeof createUiRuntime};
declare const runtime:ReturnType<typeof createUiRuntime>,ui:UiApi;
declare const DoLGameUI:Omit<GameUiControls,'ui'>&{ui:UiApi},DoLSavesUI:{setEnabled(value:boolean):void};
declare const ModHubSoftWet:{getDiagnostics():AdapterDiagnostics;destroy():void},MapleBirchSoftWet:typeof ModHubSoftWet;
declare const SoftWetSurfaceDemo:{openModal():Readonly<SurfaceHandle>|null;openDrawer():Readonly<SurfaceHandle>|null;getLastClose():SurfaceCloseReason|undefined};
declare const spec:StyleAdapter;
declare const styleHandle:Readonly<AdapterHandle>,second:Readonly<AdapterHandle>;
declare const modalHandle:Readonly<SurfaceHandle>,child:Readonly<SurfaceHandle>,options:SurfaceRequest,disableOptions:SurfaceRequest,request:()=>SurfaceRequest,showModal:typeof HTMLDialogElement.prototype.showModal;
declare const inspector:Readonly<SurfaceHandle>|null,sameInspector:typeof inspector;
declare const native:HTMLInputElement,nativeInput:HTMLInputElement,newInput:HTMLInputElement,nativeButton:HTMLElement,nativeSetting:HTMLInputElement,nativeParent:HTMLElement,nativeNext:ChildNode|null;
declare let calls:number,changeCalls:number,newClicks:number,submits:number,copiedDiagnostics:string;
declare const modUtils:{version?:string};
declare const themePrefs:{visualTier:number},versions:Record<string,string>,V:Record<string,unknown>,beforeV:string,savedValue:string,eventsBefore:string,eventCount:number;
declare const observed:Array<{node:string}&MutationObserverInit>,closeReasons:SurfaceCloseReason[],cloudNodes:Array<{n:Element;parent:Node|null}>;
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing runtime fixture value');return value;}

const root=path.resolve(__dirname,'..');
const coreVersion=fs.readFileSync(path.join(root,'src/main.ts'),'utf8').match(/runtime\.DoLGameUI\s*=\s*\{\s*version\s*:\s*['"]([^'"]+)/)?.[1];assert.ok(coreVersion,'Core version source');
const group=process.argv.find(a=>a.startsWith('--group='))?.split('=')[1]||'all';
assert.ok(['all','identity','inspector','surfaces','compat'].includes(group),'Unknown runtime group');
const uncaughtPageError=process.argv.includes('--uncaught-page-error');
assert.ok(!uncaughtPageError||['inspector','surfaces'].includes(group),'Page-error injection is limited to isolated test groups');
require('node:child_process').execFileSync(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build','--outDir','tests/artifacts/legacy-runtime'],{cwd:root,stdio:'inherit'});
const {plugins,mutation}=mutations;
(async()=>{
const engine=(await build({plugins,entryPoints:[path.join(root,'src/runtime/ui.ts')],bundle:true,write:false,format:'iife',globalName:'UiRuntimeModule'})).outputFiles?.[0]?.text;
assert.ok(engine,'Runtime bundle missing');const read=(name:string)=>{let source=fs.readFileSync(path.join(root,name.startsWith('dist/game-ui.')?name.replace('dist/','tests/artifacts/legacy-runtime/'):name),'utf8');if(name==='dist/game-ui.js'&&mutation==='identity'){const anchor='version:'+JSON.stringify(coreVersion);assert.equal(source.split(anchor).length,2,'Core mutation anchor');source=source.replace(anchor,'version:'+JSON.stringify(coreVersion+'-controlled-wrong'))}return source};
const compile=async(name:string)=>{const result=(await build({plugins,entryPoints:[path.join(root,name)],bundle:true,write:false,format:'iife',target:'es2022'})).outputFiles?.[0]?.text;assert.ok(result,'Adapter bundle missing');return result};
const adapter=(mod:string)=>compile(`compat/${mod}-soft-wet/${mod}-soft-wet.ts`);
const browser=await chromium.launch(require('./browser-options.cjs'));try{
 const errors:string[]=[];
 async function page(html:string){const p=await browser.newPage({viewport:{width:1280,height:900}});p.on('pageerror',e=>errors.push(e.message));await p.route('http://ui-runtime.test/',r=>r.fulfill({contentType:'text/html',body:html}));await p.goto('http://ui-runtime.test/');await p.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null|undefined)=>{if(value==null)throw Error('Missing runtime fixture value');return value}}));if(uncaughtPageError){const message='controlled '+group+' unhandled window error',observed=p.waitForEvent('pageerror',{predicate:e=>e.message===message});await p.evaluate(message=>{setTimeout(()=>{throw new Error(message)},0)},message);await observed;}return p}
 const settle=(p:playwright.Page)=>p.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 let p:playwright.Page;
 if(group==='identity'){
  p=await page('<html><body><div id="passages"></div></body></html>');
  await p.addStyleTag({content:read('dist/game-ui.css')});await p.addScriptTag({content:read('dist/game-ui.js')});await settle(p);
  assert.equal(await p.evaluate(()=>DoLGameUI.version),coreVersion,'legacy Core identity; official wrapper is checked by framework-startup');checkpoint('core-identity');
  await p.evaluate(()=>DoLGameUI.destroy());assert.deepEqual(errors,[]);await p.close();
 }

 if(['all','inspector'].includes(group)){
 p=await page('<html data-dol-midnight data-dgu-visual="1" data-dgu-visualGlass data-dgu-visualMotion><body><main id="foreign-area"></main><div data-surface="test"><div id="toolbar"></div><input data-proof="native" value="untouched"><button id="action">native</button><span class="future" hidden>unknown</span></div></body></html>');
 await p.evaluate(()=>{
  Object.assign(window,{observed:[]});const Original=MutationObserver;
  window.MutationObserver=class extends Original{observe(node:Node,options?:MutationObserverInit){observed.push({node:node===document.body?'body':node instanceof Element?node.id||node.tagName:node.nodeName,...options});super.observe(node,options)}};
  Object.assign(window,{themePrefs:{visualTier:1}});Object.assign(window,{versions:{Target:'1.0',Other:'1.0'}});Object.assign(window,{modUtils:{getMod:(name:string)=>versions[name]?{version:versions[name]}:null}});
  Object.assign(window,{native:must(document.querySelector<HTMLInputElement>('[data-proof]'))});Object.assign(window,{nativeParent:must(native.parentElement)});Object.assign(window,{nativeNext:native.nextSibling});Object.assign(window,{calls:0});must(document.querySelector<HTMLElement>('#action')).onclick=()=>calls++;
 });
 await p.addScriptTag({content:engine});
 await p.evaluate(()=>{
  Object.assign(window,{runtime:UiRuntimeModule.createUiRuntime(window,()=>themePrefs)});Object.assign(window,{ui:runtime.api});
  Object.assign(window,{spec:{id:'Example',version:'1',target:{name:'Target',versions:['1.0']},scope:['#missing-scope','[data-surface="test"]'],fingerprint:{id:'test-v1',safe:[['#toolbar']],required:[['#missing-input','[data-proof="native"]']]},roles:[{role:'page-shell',selectors:[':scope'],safe:true},{role:'toolbar',selectors:['#toolbar'],safe:true},{role:'card',selectors:['#missing-input','[data-proof="native"]']}]}});
  Object.assign(window,{styleHandle:ui.registerStyleAdapter(spec)});
 });
 assert.equal(await p.evaluate(()=>styleHandle.getDiagnostics().status),'active');
 // Inspector snapshots never read native business state, node text or input values.
 await p.addStyleTag({content:read('dist/game-ui.css')});
 await p.evaluate(()=>{Object.assign(window,{StartConfig:{version:'0.5.12.13'}});Object.assign(window,{SugarCube:{State:{passage:'Test Page',get variables(){throw Error('Forbidden business read')}}}});Object.assign(window,{V:{password:'private-game-secret'}});native.value='private-input-secret';Object.assign(window,{DoLGameUI:{version:'2.1.0'}});modUtils.version='2.101.1'});
 const diagnostics=await p.evaluate(()=>ui.getDiagnostics());
 assert.equal(diagnostics.gameVersion,'0.5.12.13');assert.equal(diagnostics.loaderVersion,'2.101.1');assert.equal(diagnostics.page.name,'Test Page');
 assert.equal(JSON.stringify(diagnostics).includes('private-'),false);assert.equal(JSON.stringify(diagnostics).includes('data-proof='),false,'attribute values redacted from export');
 assert.equal(must(must(diagnostics.adapters[0]).mappings.find(x=>x.role==='card')).fallback,true);checkpoint('privacy');
 assert.equal(await p.evaluate(()=>{const d=ui.getDiagnostics();return Object.isFrozen(d)&&Object.isFrozen(d.events)&&Object.isFrozen(must(must(d.adapters[0]).mappings[0]).tags)&&Object.isFrozen(d.capabilities)}),true);
 await p.evaluate(()=>{Object.assign(window,{inspector:ui.openInspector()});Object.assign(window,{sameInspector:ui.openInspector()})});
 assert.equal(await p.evaluate(()=>inspector===sameInspector),true);assert.equal(await p.locator('.dgu-inspector').count(),1);
 await p.getByRole('button',{name:'重新扫描',exact:true}).click();assert.equal(await p.locator('.dgu-inspector [role=status]').innerText(),'已重新检测注册的 Adapter。');
 await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text:string)=>{Object.assign(window,{copiedDiagnostics:text})}}}));
 await p.getByRole('button',{name:'复制诊断',exact:true}).click();await p.waitForFunction(()=>!!copiedDiagnostics);
 assert.equal(await p.evaluate(()=>{const value:unknown=JSON.parse(copiedDiagnostics);return value&&typeof value==='object'&&'schemaVersion' in value?value.schemaVersion:undefined}),1);assert.equal(await p.evaluate(()=>copiedDiagnostics.includes('private-')),false);
 const downloadPromise=p.waitForEvent('download');await p.getByRole('button',{name:'导出 JSON',exact:true}).click();const download=await downloadPromise;
 assert.equal(download.suggestedFilename(),'soft-wet-ui-diagnostics.json');const exported:unknown=JSON.parse(fs.readFileSync(must(await download.path()),'utf8'));assert.ok(exported&&typeof exported==='object'&&'page' in exported&&exported.page&&typeof exported.page==='object'&&'name' in exported.page);assert.equal(exported.page.name,'Test Page');
 await p.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw Error('denied')}});await p.getByRole('button',{name:'复制诊断',exact:true}).click();await p.waitForFunction(()=>must(document.querySelector<HTMLElement>('.dgu-inspector [role=status]')).textContent.includes('操作不可用'));
 await p.keyboard.press('Escape');assert.equal(await p.locator('.dgu-inspector').count(),0);checkpoint('clipboard-export');
 await p.evaluate(()=>{for(let i=0;i<45;i++){versions.Target=i%2?'1.0':'unknown';styleHandle.refresh()}versions.Target='1.0';styleHandle.refresh();Object.assign(window,{eventCount:ui.getDiagnostics().events.length});Object.assign(window,{eventsBefore:JSON.stringify(ui.getDiagnostics().events)});for(let i=0;i<5;i++)ui.rescan()});
 assert.equal(await p.evaluate(()=>ui.getDiagnostics().events.length),32,'event buffer bounded');assert.equal(await p.evaluate(()=>eventCount===ui.getDiagnostics().events.length),true,'stable rescan creates no duplicate events');
 assert.equal(await p.evaluate(()=>eventsBefore===JSON.stringify(ui.getDiagnostics().events)),true,'stable rescan preserves the full event sequence even when buffer is full');checkpoint('bounded-stable-events');
 assert.equal(await p.evaluate(()=>styleHandle.getDiagnostics().selectors.filter(x=>x.fallback).length),3);
 assert.equal(await p.evaluate(()=>{const monitor=new MutationObserver(()=>{});monitor.observe(must(document.querySelector('[data-surface]')),{attributes:true,subtree:true});styleHandle.refresh();const count=monitor.takeRecords().length;monitor.disconnect();return count}),0,'unchanged refresh must not rewrite style attributes');
 assert.equal(await p.evaluate(()=>observed.filter(x=>x.node==='body').every(x=>!x.subtree)),true,'no global body subtree observation');
 assert.equal(await p.evaluate(()=>Object.isFrozen(ui)&&Object.isFrozen(ui.getCapabilities())&&Object.isFrozen(ui.getTheme().tokens)&&Object.isFrozen(styleHandle.getDiagnostics().selectors)),true);
 assert.equal(await p.evaluate(()=>ui.getVisualTier()),'Balanced');
 await p.evaluate(()=>{themePrefs.visualTier=2;document.documentElement.setAttribute('data-dgu-visual','2')});await settle(p);
 assert.equal(await p.evaluate(()=>ui.getCapabilities().visualTier),'Fancy');
 await p.evaluate(()=>{Object.assign(window,{savedValue:native.value});Object.assign(window,{second:ui.registerStyleAdapter({...spec,id:'Other',target:{name:'Other',versions:['1.0']},scope:['#other'],when:()=>{throw Error('UI probe fault')}})});document.body.insertAdjacentHTML('beforeend','<div id="other"><div id="toolbar"></div></div>')});await settle(p);
 assert.equal(await p.evaluate(()=>second.getDiagnostics().status),'failed');assert.equal(await p.evaluate(()=>styleHandle.getDiagnostics().status),'active');
 await p.evaluate(()=>{versions.Target='1.1';styleHandle.refresh()});
 assert.equal(await p.evaluate(()=>styleHandle.getDiagnostics().status),'partial');assert.equal(await p.evaluate(()=>native.hasAttribute('data-dgu-role')),false,'unverified version gets only verified safe roles');
 await p.evaluate(()=>{versions.Target='1.0';native.removeAttribute('data-proof');styleHandle.refresh()});
 assert.equal(await p.evaluate(()=>styleHandle.getDiagnostics().reason),'structure-drift');
 await p.evaluate(()=>{native.setAttribute('data-proof','native');nativeParent.append(native.cloneNode());styleHandle.refresh()});
 assert.equal(await p.evaluate(()=>styleHandle.getDiagnostics().status),'partial','ambiguous critical selector cannot fully match');
 await p.evaluate(()=>{must(nativeParent.lastChild).remove();must(document.querySelector<HTMLElement>('[data-surface] #toolbar')).remove();styleHandle.refresh()});
 assert.equal(await p.evaluate(()=>styleHandle.getDiagnostics().status),'unknown');assert.equal(await p.locator('[data-dgu-adapter="Example"]').count(),0);
 await p.evaluate(()=>{nativeParent.insertAdjacentHTML('afterbegin','<div id="toolbar"></div>');styleHandle.refresh();document.documentElement.removeAttribute('data-dol-midnight')});await settle(p);
 assert.equal(await p.locator('[data-dgu-adapter]').count(),0);assert.equal(await p.evaluate(()=>ui.getCapabilities().enabled||ui.getCapabilities().glass||ui.getCapabilities().motion),false);
 await p.evaluate(()=>document.documentElement.setAttribute('data-dol-midnight',''));await settle(p);
 assert.equal(await p.evaluate(()=>native===document.querySelector('[data-proof]')&&native.parentNode===nativeParent&&native.nextSibling===nativeNext&&native.value===savedValue),true);
 await p.locator('#action').click();assert.equal(await p.evaluate(()=>calls),1);assert.equal(await p.locator('.future[hidden]').count(),1);
 assert.equal(await p.evaluate(()=>{try{ui.registerStyleAdapter({...spec,id:'Invalid',scope:['[']});return false}catch{return true}}),true);
 assert.equal(await p.evaluate(()=>{try{ui.registerStyleAdapter(spec);return false}catch{return true}}),true);
 await p.evaluate(()=>{runtime.destroy();runtime.destroy();must(document.querySelector<HTMLElement>('[data-surface]')).append(document.createElement('button'))});await settle(p);
 assert.equal(await p.locator('[data-dgu-adapter],[data-dgu-role]').count(),0);assert.equal(await p.evaluate(()=>styleHandle.getDiagnostics().status),'disposed');assert.equal(await p.evaluate(()=>ui.getAdapterDiagnostics().length),0);await p.close();

 console.log('PASS UI Runtime Inspector: privacy, clipboard, export, deduplication, bounded events and rescan');checkpoint('cleanup');
 }
 if(['all','surfaces'].includes(group)){
 // Request surfaces own only new content; native dialog owns focus and stacking.
 p=await page('<html data-dol-midnight data-dgu-visual="1" data-dgu-visualGlass data-dgu-visualMotion><body><button id="opener">open</button><div id="original"><input id="original-input" value="native"></div></body></html>');
 await p.addStyleTag({content:read('dist/game-ui.css')});await p.addScriptTag({content:engine});
 await p.evaluate(()=>{Object.assign(window,{runtime:UiRuntimeModule.createUiRuntime(window,()=>({visualTier:1}))});Object.assign(window,{ui:runtime.api});Object.assign(window,{closeReasons:[]});Object.assign(window,{request:()=>{const content=document.createElement('section');content.innerHTML='<label>New field <input value="caller" autofocus></label><span hidden>unknown</span><button>New action</button>';return {id:'ExampleModal',title:'Example',content,onClose:(reason:SurfaceCloseReason)=>closeReasons.push(reason)}}});must(document.querySelector<HTMLElement>('#opener')).focus();Object.assign(window,{nativeInput:document.querySelector('#original-input')});Object.assign(window,{nativeParent:must(nativeInput.parentElement)});Object.assign(window,{options:request()});Object.assign(window,{modalHandle:ui.openModal(options)});Object.assign(window,{newInput:options.content.querySelector('input')});Object.assign(window,{newClicks:0});must(options.content.querySelector('button')).onclick=()=>newClicks++});
 assert.equal(await p.evaluate(()=>ui.getCapabilities().surfaces&&Object.isFrozen(modalHandle)),true);
 assert.equal(await p.locator('.dgu-surface').evaluate(d=>getComputedStyle(d,'::backdrop').backdropFilter),'blur(24px)');
 assert.equal(await p.locator('.dgu-surface').evaluate(d=>getComputedStyle(d).backdropFilter),'none','native backdrop is the single blur surface');
 assert.equal(await p.evaluate(()=>document.activeElement===newInput),true,'caller autofocus is retained');
 for(let i=0;i<5;i++){await p.keyboard.press('Shift+Tab');assert.equal(await p.evaluate(()=>must(document.querySelector<HTMLElement>('.dgu-surface')).contains(document.activeElement)||document.activeElement===document.body),true,'native dialog leaves background controls inert; browser chrome may take focus')}
 await p.evaluate(()=>nativeInput.focus());assert.notEqual(await p.evaluate(()=>must(document.activeElement).id),'original-input','background input cannot receive focus');
 assert.equal(await p.evaluate(()=>ui.openModal(options)===modalHandle),true,'duplicate keeps original modalHandle and content');
 assert.equal(await p.evaluate(()=>{try{ui.openDrawer(options);return false}catch{return true}}),true,'a duplicate cannot change kind');
 await p.locator('.dgu-surface-content button').click();assert.equal(await p.evaluate(()=>newClicks),1);
 await p.locator('.dgu-surface-content input').fill('edited');
 await p.evaluate(()=>{options.id='mutated-after-open';Object.assign(window,{child:ui.openDrawer({...request(),id:'ChildDrawer',title:'Details'})})});
 assert.equal(await p.locator('.dgu-surface[open]').count(),2);await p.keyboard.press('Escape');
 assert.equal(await p.evaluate(()=>modalHandle.isOpen()&&!child.isOpen()),true,'Escape closes only upper surface');
 await p.evaluate(()=>{modalHandle.close();modalHandle.close()});
 assert.equal(await p.evaluate(()=>must(document.activeElement).id),'opener');assert.equal(await p.locator('.dgu-surface').count(),0);
 assert.deepEqual(await p.evaluate(()=>closeReasons),['escape','api']);checkpoint('focus-escape');assert.equal(await p.evaluate(()=>options.content.parentNode===null&&newInput.value==='edited'),true,'caller content detached intact');
 await p.evaluate(()=>{Object.assign(window,{modalHandle:ui.openModal(request())})});await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>closeReasons.at(-1)),'escape');
 await p.evaluate(()=>{Object.assign(window,{modalHandle:ui.openModal(request())})});await p.getByRole('button',{name:'关闭浮层',exact:true}).click();assert.equal(await p.evaluate(()=>closeReasons.at(-1)),'button');
 await p.evaluate(()=>{Object.assign(window,{modalHandle:ui.openModal(request())})});
 const box=await p.locator('.dgu-surface').boundingBox();assert.ok(box);await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(2,2);await p.mouse.up();assert.equal(await p.evaluate(()=>modalHandle.isOpen()),true,'dragging from inside is not a backdrop click');
 await p.mouse.click(2,2);assert.equal(await p.evaluate(()=>closeReasons.at(-1)),'backdrop');
 await p.evaluate(()=>{const form=document.createElement('form');form.method='dialog';const button=document.createElement('button');button.textContent='Native submit';form.append(button);Object.assign(window,{submits:0});form.addEventListener('submit',()=>submits++);Object.assign(window,{modalHandle:ui.openModal({...request(),content:form})})});
 await p.getByRole('button',{name:'Native submit',exact:true}).click();assert.equal(await p.evaluate(()=>submits),1);checkpoint('identity-detach-form');await p.waitForFunction(()=>document.querySelectorAll('.dgu-surface').length===0);assert.equal(await p.evaluate(()=>closeReasons.at(-1)),'native','native submit behavior is not proxied');
 await p.evaluate(()=>{Object.assign(window,{disableOptions:request()});Object.assign(window,{modalHandle:ui.openModal(disableOptions)});document.documentElement.removeAttribute('data-dol-midnight')});
 assert.equal(await p.evaluate(()=>ui.openModal(disableOptions)),null,'disabled theme cannot reuse a still-open modalHandle');await settle(p);
 assert.equal(await p.evaluate(()=>closeReasons.at(-1)),'disabled');assert.equal(await p.evaluate(()=>ui.openModal(request())),null);assert.equal(await p.locator('.dgu-surface').count(),0);
 await p.evaluate(()=>document.documentElement.setAttribute('data-dol-midnight',''));
 assert.equal(await p.evaluate(()=>{try{ui.openModal({...request(),content:nativeInput});return false}catch{return true}}),true,'existing original nodes cannot be moved');
 assert.equal(await p.evaluate(()=>nativeInput.parentNode===nativeParent&&nativeInput.value==='native'),true);
 await p.evaluate(()=>{Object.assign(window,{showModal:HTMLDialogElement.prototype.showModal});HTMLDialogElement.prototype.showModal=()=>{throw Error('unavailable')}});
 assert.equal(await p.evaluate(()=>ui.openModal(request())),null);assert.equal(await p.evaluate(()=>closeReasons.at(-1)),'failed');assert.equal(await p.locator('.dgu-surface').count(),0);
 await p.evaluate(()=>{Reflect.set(HTMLDialogElement.prototype,'showModal',undefined)});assert.equal(await p.evaluate(()=>ui.getCapabilities().surfaces),false);assert.equal(await p.evaluate(()=>ui.openDrawer(request())),null);
 await p.evaluate(()=>{HTMLDialogElement.prototype.showModal=showModal});checkpoint('fallback-errors');
 await p.evaluate(()=>{Object.assign(window,{modalHandle:ui.openDrawer({...request(),onClose:()=>{throw Error('caller close failed')}})});modalHandle.close();Object.assign(window,{modalHandle:ui.openModal(request())});runtime.destroy();runtime.destroy()});
 assert.equal(await p.evaluate(()=>closeReasons.at(-1)),'destroyed');assert.equal(await p.locator('.dgu-surface').count(),0);checkpoint('idempotent-destroy');
 await p.close();

 console.log('PASS UI Runtime Surface: native focus, Esc, form submit, detach, fallback and teardown');
 }
 if(['all','compat'].includes(group)){
 // Real adapter scripts bind before Core, then survive Core teardown/restart.
 const hub='<div id="customOverlay" data-overlay="modloader"><div id="customOverlayTitle"><div id="overlayTabs" class="modhub-modloader-tabs"><button>管理</button></div></div><div id="customOverlayContent"><div id="modHubModManageContainer" class="modhub-container"><div class="modhub-sticky-toolbar"><input id="setting" type="checkbox"></div><ul class="modhub-list"><li class="modhub-item"><button id="native-button">操作</button><span hidden>unknown</span></li></ul></div></div></div>';
 p=await page('<html><body><div id="passages"></div>'+hub+'</body></html>');
 await p.evaluate(()=>{Object.assign(window,{versions:{ModHub:'1.3.0',maplebirch:'5.2.3'}});Object.assign(window,{modUtils:{getMod:(name:string)=>versions[name]?{version:versions[name]}:null,getSemVerTools:()=>({parseVersion:(v:string)=>({version:v}),parseRange:(r:string)=>r,satisfies:(v:string,r:string)=>r==='>=1.3.0'?['1.3.0','1.3.1','2.0.0'].includes(v):r==='>=5.2.3'&&['5.2.3','5.2.4','6.0.0'].includes(v)})}});Object.assign(window,{V:{unchanged:'game'}});Object.assign(window,{beforeV:JSON.stringify(V)});Object.assign(window,{calls:0});Object.assign(window,{nativeButton:document.querySelector('#native-button')});nativeButton.onclick=()=>calls++;Object.assign(window,{nativeSetting:document.querySelector('#setting')});Object.assign(window,{nativeParent:must(nativeButton.parentElement)});Object.assign(window,{nativeNext:nativeButton.nextSibling});Object.assign(window,{changeCalls:0});nativeSetting.onchange=()=>changeCalls++});
 for(const mod of ['modhub','maplebirch']){await p.addStyleTag({content:read(`compat/${mod}-soft-wet/${mod}-soft-wet.css`)});await p.addScriptTag({content:await adapter(mod)})}
 assert.equal(await p.locator('[data-dgu-adapter]').count(),0,'without Core, optional packages do nothing');checkpoint('before-core');
 await p.evaluate(()=>{Object.assign(window,{DoLGameUI:{ui:{apiVersion:1}}});document.dispatchEvent(new Event('dol-ui-runtime-ready'))});assert.equal(await p.evaluate(()=>ModHubSoftWet.getDiagnostics().reason),'runtime-api-unsupported');
 await p.evaluate(()=>{Object.assign(window,{DoLGameUI:{ui:{apiVersion:1,getCapabilities:()=>({styleAdapters:false}),registerStyleAdapter:()=>{throw Error('must not register')}}}});document.dispatchEvent(new Event('dol-ui-runtime-ready'))});assert.equal(await p.evaluate(()=>MapleBirchSoftWet.getDiagnostics().reason),'style-adapter-unavailable');checkpoint('unsupported-api');
 await p.evaluate(()=>Reflect.deleteProperty(window,'DoLGameUI'));
 const inject=async()=>{await p.addStyleTag({content:read('dist/game-ui.css')});await p.addScriptTag({content:read('dist/game-ui.js')});await settle(p)};
 await inject();if(group==='all')assert.equal(await p.evaluate(()=>DoLGameUI.version),coreVersion,'legacy Core identity; official wrapper is checked by framework-startup');assert.equal(await p.evaluate(()=>ModHubSoftWet.getDiagnostics().status),'active');
 assert.equal(await p.evaluate(()=>ModHubSoftWet.getDiagnostics().degraded),false,'absent optional marketplace role is not a downgrade of a full management-page match');checkpoint('core-arrives');
 await p.addStyleTag({content:read('examples/ui-surfaces/surface-demo.css')});await p.addScriptTag({content:await compile('examples/ui-surfaces/surface-demo.ts')});
 await p.evaluate(()=>Object.assign(window,{demo:SoftWetSurfaceDemo.openModal()}));await p.locator('[data-demo-control]').check();await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>SoftWetSurfaceDemo.getLastClose()),'escape');
 await p.evaluate(()=>Object.assign(window,{demo:SoftWetSurfaceDemo.openDrawer()}));
 for(const width of [390,1280]){await p.setViewportSize({width,height:900});await settle(p);assert.equal(await p.locator('.dgu-surface').evaluate(d=>{const b=d.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1&&d.scrollWidth<=d.clientWidth+1}),true,'drawer stays readable within narrow/wide viewport')}
 await p.getByRole('button',{name:'关闭浮层',exact:true}).click();assert.equal(await p.evaluate(()=>SoftWetSurfaceDemo.getLastClose()),'button');
 assert.equal(await p.locator('.modhub-item[data-dgu-role="compact-row"]').count(),1);
 await p.evaluate(()=>{versions.ModHub='1.3.1';DoLGameUI.ui.rescan()});assert.equal(await p.evaluate(()=>ModHubSoftWet.getDiagnostics().status),'active','newer target with unchanged structure remains styled');
 await p.evaluate(()=>{versions.ModHub='1.2.9';DoLGameUI.ui.rescan()});assert.equal(await p.evaluate(()=>ModHubSoftWet.getDiagnostics().status),'partial');assert.equal(await p.locator('.modhub-item[data-dgu-role]').count(),0);
 await p.evaluate(()=>{versions.ModHub='1.3.1';DoLGameUI.ui.rescan()});
 await p.locator('#native-button').click();await p.locator('#setting').check();assert.deepEqual(await p.evaluate(()=>[calls,changeCalls]),[1,1]);
 await p.evaluate(()=>DoLGameUI.setPreference('enabled',false));await settle(p);assert.equal(await p.locator('[data-dgu-adapter]').count(),0);
 assert.equal(await p.evaluate(()=>SoftWetSurfaceDemo.openModal()),null);
 assert.equal(await p.evaluate(()=>nativeButton.isConnected&&nativeButton.parentNode===nativeParent&&nativeButton.nextSibling===nativeNext&&nativeSetting.checked),true);
 await p.evaluate(()=>DoLGameUI.setPreference('enabled',true));await settle(p);assert.equal(await p.evaluate(()=>ModHubSoftWet.getDiagnostics().status),'active');checkpoint('disable-restore');
 await p.evaluate(()=>{must(document.querySelector<HTMLElement>('#customOverlayContent')).insertAdjacentHTML('beforeend','<p id="mod-unknown">new extension</p>');must(document.querySelector<HTMLElement>('#modHubModManageContainer')).classList.remove('modhub-container')});await settle(p);
 assert.equal(await p.evaluate(()=>ModHubSoftWet.getDiagnostics().status),'partial');assert.equal(await p.locator('.modhub-item[data-dgu-role]').count(),0);assert.equal(await p.locator('#mod-unknown').isVisible(),true);
 assert.equal(await p.evaluate(()=>ModHubSoftWet.getDiagnostics().degraded),true);
 await p.evaluate(()=>{const overlay=must(document.querySelector<HTMLElement>('#customOverlay'));overlay.dataset.overlay='saves';must(document.querySelector<HTMLElement>('#customOverlayTitle')).innerHTML='<div id="overlayTabs"><button>云存档</button></div>';must(document.querySelector<HTMLElement>('#customOverlayContent')).innerHTML='<div id="maplebirch-cloud-save" class="maplebirch-cloud-save"><div class="settingsToggleItemWide"><input data-cloud-save-field="endpoint" value="native"><input data-cloud-save-field="token" value="secret"><select id="native-select"><option value="a">A</option></select><div class="maplebirch-cloud-save-actions"><button>connect</button></div></div></div>'});await settle(p);
 assert.equal(await p.evaluate(()=>MapleBirchSoftWet.getDiagnostics().status),'active');assert.equal(await p.locator('[data-dgu-adapter="ModHubSoftWet"]').count(),0);
 await p.evaluate(()=>{versions.maplebirch='5.2.4';DoLGameUI.ui.rescan()});assert.equal(await p.evaluate(()=>MapleBirchSoftWet.getDiagnostics().status),'active','newer MapleBirch is accepted by version range');
 await p.evaluate(()=>{Object.assign(window,{cloudNodes:[...document.querySelectorAll('#maplebirch-cloud-save *')].map(n=>({n,parent:n.parentNode}))});must(document.querySelector<HTMLElement>('#native-select')).append(new Option('Mod choice','new'));DoLSavesUI.setEnabled(false)});await settle(p);
 assert.equal(await p.locator('[data-dgu-adapter="MapleBirchSoftWet"]').count(),0);await p.evaluate(()=>DoLSavesUI.setEnabled(true));await settle(p);
 assert.equal(await p.evaluate(()=>cloudNodes.every(x=>x.n.isConnected&&x.n.parentNode===x.parent)),true);assert.equal(await p.locator('#native-select option').count(),2);
 assert.equal(await p.evaluate(()=>JSON.stringify(DoLGameUI.ui.getAdapterDiagnostics()).includes('secret')),false);
 assert.equal(await p.evaluate(()=>JSON.stringify(DoLGameUI.ui.getDiagnostics()).includes('secret')),false);
 await p.evaluate(()=>{DoLGameUI.openSettings()});await p.locator('details.dmt-debug summary').click();await p.getByRole('button',{name:'Runtime Inspector',exact:true}).click();
 assert.equal(await p.locator('.dgu-inspector').count(),1,'advanced settings entry opens Inspector');
 await p.evaluate(()=>DoLGameUI.setPreference('enabled',false));await settle(p);assert.equal(await p.locator('.dgu-inspector').count(),0);assert.equal(await p.evaluate(()=>DoLGameUI.ui.openInspector()),null);
 await p.evaluate(()=>{DoLGameUI.setPreference('enabled',true);document.querySelector<HTMLDialogElement>('#dol-midnight-controls')?.close()});
 await p.evaluate(()=>DoLGameUI.destroy());await settle(p);assert.equal(await p.locator('[data-dgu-adapter],[data-dgu-role]').count(),0);await inject();
 assert.equal(await p.evaluate(()=>MapleBirchSoftWet.getDiagnostics().status),'active','independent package rebinds to new Core');checkpoint('destroy-reinject');
 const peerAdapters=await p.evaluate(()=>DoLGameUI.ui.getAdapterDiagnostics().filter(d=>d.id!=='MapleBirchSoftWet').map(d=>d.id).sort());
 assert.deepEqual(peerAdapters,['ModHubSoftWet','ModHubSoftWetModal','ModHubSoftWetTools'],'ModHub owns management, tools and modal adapters');
 await p.evaluate(()=>MapleBirchSoftWet.destroy());await settle(p);assert.equal(await p.locator('[data-dgu-adapter="MapleBirchSoftWet"]').count(),0);assert.deepEqual(await p.evaluate(()=>DoLGameUI.ui.getAdapterDiagnostics().map(d=>d.id).sort()),peerAdapters,'disposing MapleBirch removes only its adapter and preserves every peer');
 assert.equal(await p.evaluate(()=>JSON.stringify(V)===beforeV),true);checkpoint('peer-preservation');assert.deepEqual(errors,[]);await p.close();
 }
 assert.deepEqual(errors,[],'UI_RUNTIME_PAGEERROR');
 console.log('PASS UI runtime: readonly Inspector/export/privacy/bounded events, native surfaces, scoped adapters/fallback/rollback/restart and unchanged native business state');
}finally{await browser.close()}})().catch(e=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(e);process.exitCode=1});
