// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"checkpoint","caseSource":"checkpoint"}
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import cp = require('node:child_process');
import playwright = require('playwright');
import cases = require('../scripts/ci-cases.cjs');
import type {createStandaloneSurfaces,StandaloneSurfaces} from '../src/runtime/standalone-surfaces';
import type {SurfaceHandle,SurfaceCloseReason} from '../src/public/ui';
declare const surfaceTest:{factory:typeof createStandaloneSurfaces;a:Readonly<StandaloneSurfaces>;b:Readonly<StandaloneSurfaces>;content:HTMLElement;other:HTMLElement;handle:Readonly<SurfaceHandle>;otherHandle:Readonly<SurfaceHandle>;reasons:SurfaceCloseReason[];clicks:number;outside:string};
const checks:string[]=[],checkpoint=(name:string)=>{cases.caseCheckpoint(name);checks.push(name);console.log('PASS',name)};
(async()=>{
 cp.execFileSync(process.execPath,['scripts/build-standalone-surfaces.mjs'],{stdio:'pipe'});
 const {createServer}=await import('vite');
 const server=await createServer({configFile:false,logLevel:'error',server:{host:'127.0.0.1',port:0},plugins:[{name:'neutral-surface-fixture',configureServer(s){s.middlewares.use((req,res,next)=>{if(req.url!=='/')return next();res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta charset="utf-8"><title>Standalone surface contract</title><body><button id="opener">Open</button><div class="dgu-inspector" id="outside">Outside content</div>')})}}]});
 await server.listen();const browser=await playwright.chromium.launch(require('./browser-options.cjs'));
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));const out=path.resolve('tests/artifacts/standalone-surfaces');fs.mkdirSync(out,{recursive:true});
 try{
  const address=server.httpServer?.address();assert.ok(address&&typeof address!=='string');await page.goto(`http://127.0.0.1:${address.port}/`);
  const imported=await page.evaluate(async()=>{
   const before=document.documentElement.outerHTML,url='/dist/standalone-surfaces/index.js';
   const m:unknown=await import(url);if(!m||typeof m!=='object'||!('createStandaloneSurfaces'in m)||typeof m.createStandaloneSurfaces!=='function')throw Error('Missing real standalone export');
   const unchanged=before===document.documentElement.outerHTML,factory=m.createStandaloneSurfaces as typeof createStandaloneSurfaces;
   const outside=document.querySelector('#outside')!;const snapshot=()=>{const s=getComputedStyle(outside);return[s.fontSize,s.lineHeight,s.color,s.backgroundColor].join('|')};const initial=snapshot();
   const a=factory(window),b=factory(window),content=document.createElement('section'),other=document.createElement('section');content.innerHTML='<button>Count</button><pre>{"value":7}</pre>';other.textContent='Second owner';
   Object.assign(window,{surfaceTest:{factory,a,b,content,other,reasons:[],clicks:0,outside:initial}});content.querySelector('button')!.addEventListener('click',()=>surfaceTest.clicks++);
   const selectors:string[]=[];const walk=(rules:CSSRuleList)=>{for(const r of rules){if(r instanceof CSSStyleRule)selectors.push(r.selectorText);if('cssRules'in r)walk((r as CSSGroupingRule).cssRules)}};
   for(const style of document.querySelectorAll<HTMLStyleElement>('style[data-dgu-standalone-style]')){if(!style.sheet)throw Error('Missing styles');walk(style.sheet.cssRules)}
   return{unchanged,outsideUnchanged:initial===snapshot(),styles:document.querySelectorAll('style[data-dgu-standalone-style]').length,available:a.available()&&b.available(),selectors,flags:[document.documentElement.hasAttribute('data-dol-midnight'),document.documentElement.hasAttribute('data-stone-free')],globalUi:typeof Reflect.get(window,'DoLGameUI')};
  });
  assert.equal(imported.unchanged,true,'module import changed DOM: '+JSON.stringify(imported));assert.equal(imported.outsideUnchanged,true,'outside style changed: '+JSON.stringify(imported));assert.equal(imported.available,true,'instance unavailable: '+JSON.stringify(imported));assert.equal(imported.styles,2);assert.deepEqual(imported.flags,[false,false]);assert.equal(imported.globalUi,'undefined');assert.ok(imported.selectors.length>20&&imported.selectors.every(s=>s.startsWith('#dgu-standalone-')));
  checkpoint('pure import and isolated instance styles');

  const opening=await page.evaluate(()=>{
   const t=surfaceTest,h=t.a.openModal({id:'loader-inspector',title:'Inspector',content:t.content,onClose:r=>t.reasons.push(r)});if(!h)throw Error('Actual modal unavailable');t.handle=h;
   const duplicate=t.a.openModal({id:'loader-inspector',title:'Ignored duplicate',content:document.createElement('div')});
   const dialog=document.querySelector('dialog')!,s=getComputedStyle(dialog),r=dialog.getBoundingClientRect(),button=dialog.querySelector('header button')!.getBoundingClientRect();
   return{same:duplicate===h,count:document.querySelectorAll('dialog').length,open:h.isOpen(),background:s.backgroundColor,radius:s.borderRadius,animation:s.animationName,fit:r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight,buttonHeight:button.height};
  });
  assert.ok(opening.same&&opening.open&&opening.fit);assert.equal(opening.count,1);assert.notEqual(opening.background,'rgba(0, 0, 0, 0)');assert.equal(opening.radius,'18px');assert.equal(opening.animation,'none');assert.ok(opening.buttonHeight>=44);
  await page.getByRole('button',{name:'Count',exact:true}).click();await page.getByRole('button',{name:'关闭浮层',exact:true}).click();
  const reopened=await page.evaluate(()=>{const t=surfaceTest,detached=t.content.parentNode===null;t.handle=t.a.openModal({id:'loader-inspector',title:'Inspector',content:t.content,onClose:r=>t.reasons.push(r)})!;return{detached,open:t.handle.isOpen(),clicks:t.clicks,reasons:[...t.reasons],json:t.content.querySelector('pre')!.textContent}});
  assert.ok(reopened.detached&&reopened.open);assert.equal(reopened.clicks,1);assert.deepEqual(reopened.reasons,['button']);assert.equal(reopened.json,'{"value":7}');
  await page.screenshot({path:path.join(out,'modal.png')});checkpoint('real modal close reopen and caller content identity');

  const disposal=await page.evaluate(()=>{const t=surfaceTest;t.otherHandle=t.b.openDrawer({id:'second-inspector',title:'Second',content:t.other})!;const dialog=t.other.closest('dialog')!,before=getComputedStyle(dialog).backgroundColor;t.a.dispose();t.a.dispose();const firstGone=!t.handle.isOpen()&&t.content.parentNode===null,secondOpen=t.otherHandle.isOpen(),styleKept=before===getComputedStyle(dialog).backgroundColor,styles=document.querySelectorAll('style[data-dgu-standalone-style]').length;t.b.dispose();t.b.dispose();t.content.querySelector<HTMLButtonElement>('button')!.click();return{firstGone,secondOpen,styleKept,styles,clicks:t.clicks,contentIntact:t.content.querySelector('pre')!.textContent,otherDetached:t.other.parentNode===null,left:document.querySelectorAll('[data-dgu-standalone],style[data-dgu-standalone-style],dialog').length,deadAvailable:t.a.available()||t.b.available()}});
  assert.ok(disposal.firstGone&&disposal.secondOpen&&disposal.styleKept&&disposal.otherDetached);assert.equal(disposal.styles,1);assert.equal(disposal.left,0);assert.equal(disposal.clicks,2);assert.equal(disposal.contentIntact,'{"value":7}');assert.equal(disposal.deadAvailable,false);checkpoint('two owners dispose independently without destroying content');

  const failures=await page.evaluate(()=>{
   const a=surfaceTest.factory(window),content=document.createElement('section'),reasons:SurfaceCloseReason[]=[];content.textContent='Still owned';
   const add=EventTarget.prototype.addEventListener,remove=EventTarget.prototype.removeEventListener,live=new Map<EventTarget,Map<string,Set<unknown>>>();
   EventTarget.prototype.addEventListener=function(type,listener,options){if(this instanceof Element&&this.closest('dialog.dgu-surface')){let types=live.get(this);if(!types){types=new Map();live.set(this,types)}let listeners=types.get(type);if(!listeners){listeners=new Set();types.set(type,listeners)}listeners.add(listener)}return add.call(this,type,listener,options)};
   EventTarget.prototype.removeEventListener=function(type,listener,options){live.get(this)?.get(type)?.delete(listener);return remove.call(this,type,listener,options)};
   const original=HTMLDialogElement.prototype.showModal;let returnedNull=false;
   try{HTMLDialogElement.prototype.showModal=function(){throw Error('controlled showModal failure')};returnedNull=a.openModal({id:'failed',title:'Failure',content,onClose:r=>reasons.push(r)})===null}finally{HTMLDialogElement.prototype.showModal=original}
   let threw=false;try{a.openModal({id:'invalid',title:'Invalid',content:document.body})}catch(e){threw=e instanceof TypeError}
   const clean=document.querySelectorAll('dialog').length===0&&content.parentNode===null;
   const h=a.openModal({id:'recovered',title:'Recovered',content});if(!h)throw Error('Recovery failed');
   document.querySelector('style[data-dgu-standalone-style]')!.remove();const unavailable=!a.available();const noReplacement=a.openDrawer({id:'new',title:'New',content:document.createElement('div')})===null&&!h.isOpen();
   a.dispose();const listeners=[...live.values()].flatMap(types=>[...types.values()]).reduce((n,set)=>n+set.size,0);EventTarget.prototype.addEventListener=add;EventTarget.prototype.removeEventListener=remove;return{returnedNull,threw,clean,reasons,unavailable,noReplacement,listeners,content:content.textContent,left:document.querySelectorAll('[data-dgu-standalone],dialog,style[data-dgu-standalone-style]').length};
  });
  assert.ok(failures.returnedNull&&failures.threw&&failures.clean&&failures.unavailable&&failures.noReplacement);assert.deepEqual(failures.reasons,['failed']);assert.equal(failures.content,'Still owned');assert.equal(failures.left,0);assert.equal(failures.listeners,0,'all owned shell event listeners are removed');checkpoint('null throw and lost style paths clean without a second surface');

  const realm=await page.evaluate(()=>{
   const frame=document.createElement('iframe');document.body.append(frame);const doc=frame.contentDocument!,win=doc.defaultView!;
   const a=surfaceTest.factory(win),content=doc.createElement('section');content.textContent='Other realm';const h=a.openModal({id:'realm',title:'Realm',content});if(!h)throw Error('Target realm modal unavailable');h.close();
   let foreignRejected=false;try{a.openModal({id:'foreign',title:'Foreign',content:document.createElement('section')})}catch(e){foreignRejected=e instanceof TypeError}
   const original=win.HTMLDialogElement.prototype.showModal;let unavailable=false,noOpen=false;
   try{Reflect.set(win.HTMLDialogElement.prototype,'showModal',undefined);unavailable=!a.available();noOpen=a.openModal({id:'blocked',title:'Blocked',content})===null}finally{win.HTMLDialogElement.prototype.showModal=original}
   const recovered=a.openDrawer({id:'realm',title:'Realm drawer',content});if(!recovered)throw Error('Target realm recovery failed');const own=content.ownerDocument===doc&&doc.querySelectorAll('dialog').length===1&&document.querySelectorAll('dialog').length===0;a.dispose();const clean=doc.querySelectorAll('[data-dgu-standalone],style[data-dgu-standalone-style],dialog').length===0&&content.parentNode===null;frame.remove();return{foreignRejected,unavailable,noOpen,own,clean};
  });
  assert.ok(Object.values(realm).every(Boolean));assert.deepEqual(errors,[]);checkpoint('target realm constructors and capability recovery');
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'PASS',checks,errors,browser:browser.version(),source:JSON.parse(fs.readFileSync('dist/standalone-surfaces/SOURCE.json','utf8')),scope:'Controlled Chromium pages, no Loader/game/provider or export implementation'},null,2));
 }catch(error){await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw error}
 finally{await browser.close();await server.close()}
})().catch(error=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(error);process.exitCode=1});
