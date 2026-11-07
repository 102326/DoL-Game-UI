// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import playwright = require('playwright');
import esbuild = require('esbuild');
import options = require('./browser-options.cjs');
import assert = require('node:assert/strict');
import receipt = require('../scripts/ci-process-receipt.cjs');
const {chromium}=playwright,{buildSync}=esbuild;
declare const Mirror:typeof import('../src/wardrobe/sidebar-preview');
declare let ctrl:AbortController,recovered:number,lost:number,result:'pending'|'canvas'|'fallback';
(async()=>{const b=await chromium.launch(options);try{
 const p=await b.newPage(),errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install();
 await p.setContent('<div id="sidebar-img-container"><div id="img"></div></div><div id="preview" style="height:200px"></div>');
 const code=buildSync({entryPoints:['src/wardrobe/sidebar-preview.ts'],bundle:true,format:'iife',globalName:'Mirror',write:false}).outputFiles[0]?.text;if(!code)throw Error('Missing sidebar bundle');await p.addScriptTag({content:code});
 const start=()=>p.evaluate(async()=>{Object.assign(window,{ctrl:new AbortController(),recovered:0,lost:0,result:'pending'});const host=document.querySelector('#preview');if(!(host instanceof HTMLElement))throw Error('Missing preview fixture');Mirror.mirrorSidebar(host,ctrl.signal,()=>lost++,canvas=>{recovered++;host.replaceChildren(canvas)}).then(canvas=>result=canvas?'canvas':'fallback');await Promise.resolve();return result});
 const add=(paint:boolean)=>p.evaluate(paint=>{const c=document.createElement('canvas');c.className='mainCanvas';c.width=c.height=16;const ctx=c.getContext('2d'),host=document.querySelector('#img');if(!ctx||!host)throw Error('Missing canvas fixture');if(paint)ctx.fillRect(0,0,16,16);host.append(c)},paint);
 assert.equal(await start(),'fallback','absent native canvas starts fallback without waiting for a timer');
 await add(true);await p.clock.runFor(501);assert.equal(await p.evaluate(()=>recovered),1,'late native canvas still replaces fallback');
 await p.evaluate(()=>document.querySelector('#img canvas')?.remove());await p.clock.runFor(2200);assert.equal(await p.evaluate(()=>lost),1,'lost mirror falls back once');
 await add(true);await p.clock.runFor(501);assert.equal(await p.evaluate(()=>recovered),2);
 await p.evaluate(()=>{ctrl.abort();document.querySelector('#img canvas')?.remove()});await p.clock.runFor(2200);assert.equal(await p.evaluate(()=>lost),1,'aborted owner never reports later loss');
 // An existing blank canvas may actually be painting: retain its grace period.
 await add(false);assert.equal(await start(),'pending');await p.clock.runFor(250);assert.equal(await p.evaluate(()=>result),'pending');
 await p.evaluate(()=>document.querySelector<HTMLCanvasElement>('canvas.mainCanvas')?.getContext('2d')?.fillRect(0,0,16,16));await p.clock.runFor(251);assert.equal(await p.evaluate(()=>result),'canvas','delayed paint uses native full character instead of private fallback');
 await p.evaluate(()=>{ctrl.abort();document.querySelector('#img canvas')?.remove()});await add(false);assert.equal(await start(),'pending');await p.clock.runFor(2200);assert.equal(await p.evaluate(()=>result),'fallback','blank canvas still has bounded fallback');await p.evaluate(()=>ctrl.abort());
 // Ambiguous native sources are unsupported, not a reason for an empty wait.
 await add(true);assert.equal(await start(),'fallback');await p.evaluate(()=>ctrl.abort());
 assert.deepEqual(errors,[]);console.log('PASS immediate missing/ambiguous fallback, delayed native paint, bounded blank wait, recovery, loss and abort');
 }finally{await b.close()}})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});
