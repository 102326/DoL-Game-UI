// Manual paired preparation observation, not a CI performance budget or device result.
import fs = require('node:fs');
import path = require('node:path');
import cp = require('node:child_process');
import crypto = require('node:crypto');
import assert = require('node:assert/strict');
import playwright = require('playwright');
import browserOptions = require('../tests/browser-options.cjs');
import type {PanelControls} from '../src/panels/types';
declare let prep:PanelControls;
declare let prepReads:number;
declare let prepRects:number;
declare let prepNative:number;
const base='936ec63288f1e6f66314cde84cebb17c8e77adee',sha=(b:string|Buffer)=>crypto.createHash('sha256').update(b).digest('hex');
type Metric='elapsedMs'|'maxRafGapMs'|'reads'|'rects'|'styleCount'|'styleMs'|'layoutCount'|'layoutMs'|'taskMs';
type Observation=Record<Metric,number>&{pair:number;warmup:boolean;mode:string;fixture:{headings:number;descendants:number};counts:ReturnType<PanelControls['getLifecycleCounts']>;labels:number};
const oldSource=cp.execFileSync('git',['show',base+':src/panels/main.ts'],{encoding:'utf8'});
const sourceFiles=['src/panels/main.ts','src/panels/presentation.ts','src/panels/visibility.ts','dist/framework/official-ui/style.css','package-lock.json','scripts/measure-evolution-panel-preparation.cts'];
const sources=()=>Object.fromEntries(sourceFiles.map(f=>[f,sha(fs.readFileSync(f))]));
(async()=>{
 const out=path.resolve('tests/artifacts/evolution/panel-preparation-paired-'+Date.now());fs.mkdirSync(out,{recursive:true});
 const before=sources(),browser=await playwright.chromium.launch(browserOptions),servers:Awaited<ReturnType<(typeof import('vite'))['createServer']>>[]=[],records:Observation[]=[];
 let status='FAIL',failure:string|undefined;
 try{
  const [{createServer},{default:vue}]=await Promise.all([import('vite'),import('@vitejs/plugin-vue')]);
  for(const baseline of [true,false]){
   const server=await createServer({configFile:false,cacheDir:path.join(out,baseline?'baseline-cache':'candidate-cache'),plugins:[{name:'paired-original-panels',enforce:'pre',load(id){if(baseline&&id.split('?')[0]===path.resolve('src/panels/main.ts'))return oldSource}},vue(),{name:'panel-pair-page',configureServer(s){s.middlewares.use('/__panel_pair__',(_req,res)=>res.end('<!doctype html><html><body></body></html>'))}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});await server.listen();servers.push(server);
  }
  // Two warmup pairs, then 12 recorded pairs. Alternate first/second to reduce order bias.
  for(let pair=-2;pair<12;pair++)for(const mode of pair%2===0?['baseline','candidate']:['candidate','baseline']){
   const server=servers[mode==='baseline'?0:1],address=server?.httpServer?.address();assert.ok(address&&typeof address!=='string');
   const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto('http://127.0.0.1:'+address.port+'/__panel_pair__');await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
    await page.addScriptTag({type:'module',content:"import {startPanels} from '/src/panels/main.ts';window.preparePanels=startPanels"});
    await page.waitForFunction(()=>typeof (window as unknown as {preparePanels:unknown}).preparePanels==='function');
    const fixture=await page.evaluate(()=>{
     document.body.innerHTML='<style>.hidden{display:none!important}</style><div id="customOverlay" data-overlay="cheats" class="hidden"><div id="customOverlayContent"><div id="cheatsShown" class="settingsGrid">'+Array.from({length:40},(_,g)=>'<h2 class="settingsHeader">Group '+g+'</h2>'+Array.from({length:12},(_,i)=>'<div class="settingsToggleItem"><label><input type="checkbox">Setting '+g+'/'+i+'<span> Value</span></label></div>').join('')).join('')+'<button id="native">Native action</button></div></div></div>';
     Object.assign(window,{prepReads:0,prepRects:0,prepNative:0});document.querySelector<HTMLButtonElement>('#native')!.onclick=()=>prepNative++;
     const computed=window.getComputedStyle,rects=Element.prototype.getClientRects;
     window.getComputedStyle=function(node,pseudo){if(node.matches('.settingsHeader'))prepReads++;return computed.call(window,node,pseudo)};
     Element.prototype.getClientRects=function(){if(this.matches('.settingsHeader'))prepRects++;return rects.call(this)};
     const prepare=(window as unknown as {preparePanels:(root:Window)=>PanelControls}).preparePanels;Object.assign(window,{prep:prepare(window)});
     return{headings:40,descendants:document.querySelectorAll('#customOverlayContent *').length};
    });
    const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
    const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));const start=await metrics();
    const observed=await page.evaluate(async()=>{
     const began=performance.now();document.querySelector('#customOverlay')!.classList.remove('hidden');const gaps:number[]=[];let previous:number|undefined;
     for(let i=0;i<4;i++){const t=await new Promise<number>(r=>requestAnimationFrame(r));if(previous!==undefined)gaps.push(t-previous);previous=t}
     return{elapsedMs:performance.now()-began,maxRafGapMs:Math.max(...gaps),reads:prepReads,rects:prepRects,counts:prep.getLifecycleCounts(),labels:document.querySelectorAll('.dgp-navigation option').length-1};
    });
    const end=await metrics(),delta=(key:string)=>{assert.equal(typeof start[key],'number');assert.equal(typeof end[key],'number');return end[key]!-start[key]!};
    assert.equal(observed.labels,40);assert.equal(observed.counts.mounts,1);assert.equal(observed.counts.failures,0);
    await page.locator('#native').click();const native=await page.evaluate(()=>{const same=document.querySelector('#native');prep.destroy();return{calls:prepNative,nativeConnected:same?.isConnected,remaining:document.querySelectorAll('.dgp-host').length}});assert.deepEqual(native,{calls:1,nativeConnected:true,remaining:0});assert.deepEqual(errors,[]);
    records.push({pair,warmup:pair<0,mode,fixture,...observed,styleCount:delta('RecalcStyleCount'),styleMs:delta('RecalcStyleDuration')*1000,layoutCount:delta('LayoutCount'),layoutMs:delta('LayoutDuration')*1000,taskMs:delta('TaskDuration')*1000});
   }finally{await page.close()}
  }
  assert.deepEqual(sources(),before);status='PASS';
 }catch(e){failure=String(e);throw e}finally{
  const median=(v:number[])=>{const s=[...v].sort((a,b)=>a-b);return s[Math.floor(s.length/2)]},summaries=['baseline','candidate'].map(mode=>{const rows=records.filter(r=>!r.warmup&&r.mode===mode);return{mode,n:rows.length,median:Object.fromEntries((['elapsedMs','maxRafGapMs','reads','rects','styleCount','styleMs','layoutCount','layoutMs','taskMs'] as const).map(k=>[k,median(rows.map(r=>r[k]))]))}});
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status,failure,base,baselineMainSha256:sha(oldSource),sourceHead:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),candidateSources:before,environment:{platform:process.platform,node:process.version,chromium:browser.version(),viewport:{width:1280,height:900,dpr:1}},scope:'Synthetic first-party dense cheats panel, cold mount per opening, 2 warmup pairs then 12 alternating pairs. CDP Performance counters and instrumented heading reads; no CPU timeline, full game, Android, GPU or performance acceptance. PASS means observations and behavior checks completed, not a performance budget.',records,summaries},null,2));
  console.log('Evidence',out);console.log(JSON.stringify(summaries,null,2));await browser.close();for(const server of servers)await server.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
