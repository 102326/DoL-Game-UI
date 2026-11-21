import playwright = require('playwright');
import esbuild = require('esbuild');
const {chromium}=playwright,{buildSync}=esbuild;
import assert = require('node:assert/strict');
import options = require('./browser-options.cjs');
declare const Mirror:typeof import('../src/wardrobe/sidebar-preview');
const bundle=buildSync({entryPoints:['src/wardrobe/sidebar-preview.ts'],bundle:true,write:false,format:'iife',globalName:'Mirror'}).outputFiles[0]?.text;
if(!bundle)throw Error('Missing sidebar bundle');
(async()=>{const browser=await chromium.launch(options);try{
 const page=await browser.newPage();await page.setContent('<div id="sidebar-img-container"><div id="img"><canvas class="mainCanvas" width="32" height="32"></canvas></div></div><div id="preview" style="height:200px"></div>');await page.addScriptTag({content:bundle});
 const result=await page.evaluate(async()=>{
  const source=document.querySelector('canvas'),host=document.querySelector('#preview'),controller=new AbortController();let failed=0;
  if(!source||!(host instanceof HTMLElement))throw Error('Missing preview fixture');
  const context=source.getContext('2d');if(!context)throw Error('Canvas 2D unavailable');
  const recovered=()=>{throw Error('Unexpected recovery during continuous mirror test')};
  const waiting=Mirror.mirrorSidebar(host,controller.signal,()=>failed++,recovered);
  setTimeout(()=>{context.fillStyle='red';context.fillRect(0,0,32,32)},200);
  const copy=await waiting;if(!copy)throw Error('Expected initial canvas mirror');host.append(copy);const initial=copy.toDataURL();
  context.fillStyle='blue';context.fillRect(0,0,32,32);
  await new Promise(r=>setTimeout(r,300));const animated=copy.toDataURL()!==initial;
  controller.abort();const stopped=copy.toDataURL();context.clearRect(0,0,32,32);
  await new Promise(r=>setTimeout(r,300));
  const pending=new AbortController();const cancelled=Mirror.mirrorSidebar(host,pending.signal,()=>failed++,recovered);pending.abort();
  return {animated,stopped:copy.toDataURL()===stopped,cancelled:await cancelled===null,failed,original:source.isConnected};
 });assert.deepEqual(result,{animated:true,stopped:true,cancelled:true,failed:0,original:true});console.log('PASS delayed canvas, in-place animation, abort cleanup, pending cancellation, original retained');
 await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));
 // Simulate two confirmed choices on a single native canvas. The final paint
 // arrives after the first sampling interval, without a DOM mutation.
 const stoppedMirror=await page.evaluateHandle(async()=>{
  const source=document.querySelector<HTMLCanvasElement>('canvas.mainCanvas')!;
  const host=document.querySelector<HTMLElement>('#preview')!;
  const ctx=source.getContext('2d')!;
  const first=new AbortController();
  ctx.fillStyle='red';ctx.fillRect(0,0,32,32);
  const obsolete=await Mirror.mirrorSidebar(host,first.signal,()=>{},()=>{});
  if(!obsolete)throw Error('First choice has no mirror');
  host.replaceChildren(obsolete);
  first.abort();
  const latest=await Mirror.mirrorSidebar(host,new AbortController().signal,()=>{},()=>{});
  if(!latest)throw Error('Second choice has no mirror');
  host.replaceChildren(latest);
  setTimeout(()=>{ctx.fillStyle='blue';ctx.fillRect(0,0,32,32)},180);
  return obsolete;
 });
 const pixel=()=>page.locator('#preview canvas').evaluate(n=>(n as HTMLCanvasElement).getContext('2d')!.getImageData(0,0,1,1).data[2]);
 await page.clock.runFor(179);assert.equal(await pixel(),0,'old pixels persist until the native painter runs');
 await page.clock.runFor(151);
 assert.equal(await page.locator('canvas.mainCanvas').evaluate(n=>(n as HTMLCanvasElement).getContext('2d')!.getImageData(0,0,1,1).data[2]),255);
 assert.equal(await pixel(),255,'the active mirror must converge to the final outfit');
 assert.equal(await stoppedMirror.evaluate(n=>n.getContext('2d')!.getImageData(0,0,1,1).data[2]),0,'retired mirror must not consume subsequent paints');
 await stoppedMirror.dispose();
 console.log('PASS late final paint reaches the active mirror only');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
