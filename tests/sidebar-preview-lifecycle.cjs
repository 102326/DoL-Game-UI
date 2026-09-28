const {chromium}=require('playwright'),{buildSync}=require('esbuild'),assert=require('node:assert/strict');
const bundle=buildSync({entryPoints:['src/wardrobe/sidebar-preview.ts'],bundle:true,write:false,format:'iife',globalName:'Mirror'}).outputFiles[0].text;
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage();await page.setContent('<div id="sidebar-img-container"><div id="img"><canvas class="mainCanvas" width="32" height="32"></canvas></div></div><div id="preview" style="height:200px"></div>');await page.addScriptTag({content:bundle});
 const result=await page.evaluate(async()=>{
  const source=document.querySelector('canvas'),host=document.querySelector('#preview'),controller=new AbortController();let failed=0;
  const waiting=Mirror.mirrorSidebar(host,controller.signal,()=>failed++);
  setTimeout(()=>{source.getContext('2d').fillStyle='red';source.getContext('2d').fillRect(0,0,32,32)},200);
  const copy=await waiting;host.append(copy);const initial=copy.toDataURL();
  source.getContext('2d').fillStyle='blue';source.getContext('2d').fillRect(0,0,32,32);
  await new Promise(r=>setTimeout(r,300));const animated=copy.toDataURL()!==initial;
  controller.abort();const stopped=copy.toDataURL();source.getContext('2d').clearRect(0,0,32,32);
  await new Promise(r=>setTimeout(r,300));
  const pending=new AbortController();const cancelled=Mirror.mirrorSidebar(host,pending.signal,()=>failed++);pending.abort();
  return {animated,stopped:copy.toDataURL()===stopped,cancelled:await cancelled===null,failed,original:source.isConnected};
 });assert.deepEqual(result,{animated:true,stopped:true,cancelled:true,failed:0,original:true});console.log('PASS delayed canvas, in-place animation, abort cleanup, pending cancellation, original retained');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
