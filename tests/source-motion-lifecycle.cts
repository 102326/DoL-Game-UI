// @ci-contract {"profiles":["standard","research"],"classification":"contract","granularity":"entry"}
// Actual sourceMotion with controlled frame delivery; game-first-motion checks real scrolling.
import assert = require('node:assert/strict');
import fs = require('node:fs');
import esbuild = require('esbuild');
import playwright = require('playwright');
import child = require('node:child_process');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {sourceMotion} from '../src/ui/source-motion';
declare const createSourceMotion:typeof sourceMotion;
const {build}=esbuild,{chromium}=playwright;
(async()=>{
 const baseline=process.argv.includes('--baseline'),revision='98936442f11899e97aea49595ffda580f4af923b';
 const old=baseline?child.execFileSync('git',['show',revision+':src/ui/source-motion.ts'],{encoding:'utf8'}):undefined;
 const browser=await chromium.launch(browserOptions);
 try{
  const page=await browser.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<html data-dgu-visualmotion><body><button id="native">Native</button>'+['one','two'].map(id=>`<div id="${id}" style="height:120px;overflow:auto"><div style="height:1200px"></div></div>`).join('')+'</body></html>');
  const bundled=await build({stdin:{contents:"import {sourceMotion} from './src/ui/source-motion';window.createSourceMotion=sourceMotion",resolveDir:process.cwd()},bundle:true,write:false,format:'iife',plugins:baseline?[{name:'frozen-source-motion',setup(build){build.onLoad({filter:/[\\/]src[\\/]ui[\\/]source-motion\.ts$/},()=>({contents:old,loader:'ts'}))}}]:[]});const output=bundled.outputFiles?.[0];assert.ok(output);await page.addScriptTag({content:output.text});
  const result=await page.evaluate(()=>{
   const pending=new Map<number,FrameRequestCallback>(),observers=new Set<MutationObserver>(),listeners=new Map<EventListenerOrEventListenerObject|null,number>();let serial=0,tracking=false;
   window.requestAnimationFrame=callback=>{pending.set(++serial,callback);return serial};window.cancelAnimationFrame=id=>pending.delete(id);
   const NativeMutation=window.MutationObserver,add=EventTarget.prototype.addEventListener,remove=EventTarget.prototype.removeEventListener;
   window.MutationObserver=class extends NativeMutation{constructor(callback:MutationCallback){super(callback);observers.add(this)}disconnect(){observers.delete(this);super.disconnect()}};
   EventTarget.prototype.addEventListener=function(type,callback,...rest){if(tracking)listeners.set(callback,(listeners.get(callback)||0)+1);return add.call(this,type,callback,...rest)};
   EventTarget.prototype.removeEventListener=function(type,callback,...rest){const count=listeners.get(callback)??0;if(count>1)listeners.set(callback,count-1);else listeners.delete(callback);return remove.call(this,type,callback,...rest)};
   const listenerCount=()=>[...listeners.values()].reduce((a,b)=>a+b,0);
   tracking=true;const owner=createSourceMotion(),peer=createSourceMotion();tracking=false;
   const initial={observers:observers.size,listeners:listenerCount()},one=document.getElementById('one'),two=document.getElementById('two'),arrivals:string[]=[];
   if(!one||!two)throw Error('Missing scroll fixtures');
   for(const node of [one,two])node.scrollTo=((options:ScrollToOptions)=>{node.scrollTop=options.top??node.scrollTop}) as typeof node.scrollTo;
   owner.scroll(one,200,()=>arrivals.push('old'));const late=[...pending.values()][0];
   owner.scroll(one,300,()=>arrivals.push('latest'));peer.scroll(two,400,()=>arrivals.push('peer'));
   if(!late)throw Error('Missing cancelled frame');late(0);const afterCancelledDelivery=pending.size;
   const flush=()=>{const batch=[...pending.entries()];pending.clear();for(const [,callback]of batch)callback(performance.now())};
   for(let i=0;i<3;i++)flush();
   owner.scroll(one,500,()=>arrivals.push('disposed'));const lateDisposed=[...pending.values()][0];
   peer.scroll(two,600,()=>arrivals.push('peer-again'));owner.relay(one.getBoundingClientRect(),two.getBoundingClientRect());
   const proxyBefore=!!document.querySelector('.kw-object-relay');owner.dispose();owner.dispose();if(!lateDisposed)throw Error('Missing disposed frame');lateDisposed(0);
   const afterDispose={frames:pending.size,observers:observers.size,listeners:listenerCount(),proxies:document.querySelectorAll('.kw-object-relay').length};
   for(let i=0;i<3;i++)flush();
   // Cancelling one node on a live owner must preserve its other scroll task.
   peer.scroll(one,700,()=>arrivals.push('cancelled-node'));peer.scroll(two,800,()=>arrivals.push('other-node'));peer.cancel(one);
   for(let i=0;i<3;i++)flush();
   peer.scroll(one,900,()=>arrivals.push('detached'));one.remove();flush();
   peer.dispose();owner.scroll(two,100,()=>arrivals.push('revived'));window.dispatchEvent(new Event('resize'));
   return{initial,afterCancelledDelivery,proxyBefore,afterDispose,arrivals,final:{frames:pending.size,observers:observers.size,listeners:listenerCount()}};
  });
  fs.mkdirSync('tests/artifacts/evolution',{recursive:true});fs.writeFileSync('tests/artifacts/evolution/source-motion'+(baseline?'-baseline':'')+'.json',JSON.stringify({baseline,revision,result},null,2));
  assert.equal(result.initial.observers,2);assert.ok(result.initial.listeners>0);assert.equal(result.afterCancelledDelivery,2,'cancelled delivery cannot queue a second arrival loop');
  assert.equal(result.proxyBefore,true);assert.equal(result.afterDispose.frames,1);assert.equal(result.afterDispose.observers,1);assert.equal(result.afterDispose.listeners,result.initial.listeners/2);assert.equal(result.afterDispose.proxies,0);
  assert.deepEqual(result.arrivals,['latest','peer','peer-again','other-node']);assert.deepEqual(result.final,{frames:0,observers:0,listeners:0});assert.deepEqual(errors,[]);
  console.log('PASS sourceMotion: cancelled and disposed deliveries stay dead, peer/node isolation, detached target, proxy/listener/observer/frame cleanup');
 }finally{await browser.close()}
})().catch(error=>{receipt.terminalFailure(error);process.exitCode=1});
