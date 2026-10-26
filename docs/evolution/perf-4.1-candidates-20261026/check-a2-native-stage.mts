// Isolated A2 hypothesis: initialize native weather attributes while detached,
// then insert in the existing synchronous refresh. Never patches product files.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {chromium,type Page} from 'playwright';
import browserOptions from '../../../tests/browser-options.cjs';
// Only the fixture's observed surface; ordinary research tsc cannot load Vue SFCs.
type Starts={startPanels(root:Window):{destroy():void;getLifecycleCounts():{mounts:number;scans:number;failures:number}};startOfficialMotion():()=>void;headerWeather():{set(key:string,header?:HTMLElement,parent?:HTMLElement):void;refresh():void;clear():void;snapshot():{activePolls:number};dispose():void}};
declare global{interface Window{__stageStart:Starts;__stagePanels:ReturnType<Starts['startPanels']>;__stageStop:()=>void;__stageOpen:number;__stageNative:number;__stageWeather:{name:string;precipitation:string;dayState:string};__stageEvents:EffectTiming['duration'][]}}
const root=process.cwd(),sha=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
const mode=process.argv[2]??'native-stage';assert.ok(['native-stage','navigation-first'].includes(mode));
const navigationBaseline='7ac2d593cce707ecbd8eb10174592ad3513ed555';
const original=readFileSync('framework/official-ui/weather.ts','utf8'),currentNavigation=readFileSync('framework/official-ui/navigation.ts','utf8'),originalNavigation=execFileSync('git',['show',navigationBaseline+':framework/official-ui/navigation.ts'],{encoding:'utf8'});
function change(source:string,before:string,after:string){assert.equal(source.split(before).length,2,'Exact candidate boundary: '+before);return source.replace(before,after)}
let candidate=change(original,'revision:number;renderer?:','revision:number;pending?:boolean;renderer?:');
candidate=change(candidate,'opacity=parseFloat(getComputedStyle(s.node).opacity);motion.cancel(s.node);','opacity=s.pending?0:parseFloat(getComputedStyle(s.node).opacity);motion.cancel(s.node);');
candidate=change(candidate,"if(!scope.active()||s.revision!==revision||!s.node.isConnected)return;s.node.dataset.weather=state.kind;","if(!scope.active()||s.revision!==revision||(!s.node.isConnected&&!s.pending))return;if(s.pending&&(!s.header.isConnected||!s.parent.isConnected))return;s.node.dataset.weather=state.kind;");
candidate=change(candidate,"s.node.toggleAttribute('data-night',state.night);if(state.kind", "s.node.toggleAttribute('data-night',state.night);if(s.pending){s.parent.append(s.node);s.pending=false}if(state.kind");
candidate=change(candidate,"node.style.height='0px';parent.append(node);const s:Surface={header,parent,node,key:'',revision:0};", "node.style.height='0px';const s:Surface={header,parent,node,key:'',revision:0,pending:true};");
let candidateNavigation=originalNavigation;
if(mode==='navigation-first'){
 const declaration="const tabs=group('tabs',overlay?.querySelector<HTMLElement>(overlay.dataset.dguAdapter==='CheatExtendedSoftWet'?'#cheat_extended_options':'#overlayTabs')??undefined);";
 const selectionStart="if(tabs){const adapted=!!overlay?.matches(adaptedOverlaySelector),ce=overlay?.dataset.dguAdapter==='CheatExtendedSoftWet';const buttons=";
 const selectionEnd=";for(const n of tabs.attrs.keys())";
 const at=originalNavigation.indexOf(selectionStart),stop=originalNavigation.indexOf(selectionEnd,at);assert.ok(at>=0&&stop>at);
 const selection=originalNavigation.slice(at+selectionStart.length,stop).replaceAll('tabs.node','tabNode');
 const prepare="const tabNode=overlay?.querySelector<HTMLElement>(overlay.dataset.dguAdapter==='CheatExtendedSoftWet'?'#cheat_extended_options':'#overlayTabs')??undefined,adapted=!!overlay?.matches(adaptedOverlaySelector),ce=overlay?.dataset.dguAdapter==='CheatExtendedSoftWet';const tabButtons=tabNode?("+selection+"):[];weather.set('native',tabButtons.length?tabNode?.closest<HTMLElement>('#customOverlayTitle')??undefined:undefined,overlay??undefined);\n  ";
 candidateNavigation=change(candidateNavigation,"const sidebar=group('sidebar',",prepare+"const sidebar=group('sidebar',");
 candidateNavigation=change(candidateNavigation,declaration,"const tabs=group('tabs',tabNode);");
 candidateNavigation=change(candidateNavigation,originalNavigation.slice(at,stop),"if(tabs){const buttons=tabButtons");
 candidateNavigation=change(candidateNavigation,"weather.set('native',tabs?.attrs.size?tabs.node.closest<HTMLElement>('#customOverlayTitle')??undefined:undefined,overlay??undefined);",'');
 candidate=original; // Independent hypothesis; do not stack the earlier insertion candidate.
}
const out=resolve('tests/artifacts/evolution/native-weather-stage-'+Date.now());mkdirSync(out,{recursive:true});
writeFileSync(join(out,'weather-original.ts'),original);writeFileSync(join(out,'weather-candidate.ts'),candidate);
writeFileSync(join(out,'navigation-original.ts'),originalNavigation);writeFileSync(join(out,'navigation-candidate.ts'),candidateNavigation);
const sources=new Set<string>(['framework/official-ui/weather.ts','dist/framework/official-ui/style.css','docs/evolution/perf-4.1-candidates-20261026/check-a2-native-stage.mts']);
const bundles:{variant:string;code:string;sha256:string}[]=[];
for(const [variant,text]of [['original',original],['candidate',candidate]] as const){
 const entry='virtual:a2-native-stage',result=await build({configFile:false,logLevel:'error',plugins:[{name:'a2-native-stage',enforce:'pre',resolveId(id){if(id===entry)return'\0'+entry},load(id){if(id==='\0'+entry)return"import {startPanels} from '/src/panels/main.ts';import {startOfficialMotion} from '/framework/official-ui/motion.ts';import {headerWeather} from '/framework/official-ui/weather.ts';window.__stageStart={startPanels,startOfficialMotion,headerWeather}"},transform(code,id){const file=id.split('?')[0]!.replace(root+'/','');if(!file.startsWith('/')&&!file.startsWith('node_modules/')&&/\.(ts|vue|css)$/.test(file))sources.add(file);if(file==='framework/official-ui/weather.ts'){assert.equal(code,original);return text}if(file==='framework/official-ui/navigation.ts'){assert.equal(code,currentNavigation);return variant==='candidate'?candidateNavigation:originalNavigation}}},vue()],build:{write:false,rollupOptions:{input:entry,output:{format:'iife',inlineDynamicImports:true}}}});
 assert.ok('output'in result);const chunk=result.output.find(a=>a.type==='chunk');assert.ok(chunk?.type==='chunk');bundles.push({variant,code:chunk.code,sha256:sha(chunk.code)});writeFileSync(join(out,variant+'.js'),chunk.code);
}
const sourceHashes=()=>Object.fromEntries([...sources].sort().map(file=>[file,sha(readFileSync(file))]));const before=sourceHashes();
const html=`<!doctype html><html data-stone-free data-dol-midnight data-dgu-visualMotion data-dgu-visualGlass data-dgu-visualGlow><style>body{margin:0}.hidden{display:none!important}#customOverlay{position:fixed;inset:55px;background:#24262a;color:white}#customOverlayTitle{position:relative;padding:12px}#customOverlayContent{height:560px;overflow:auto}button{padding:12px}</style><body><aside id="ui-bar"><div id="overlayButtons"><button id="entry" class="link-internal macro-button">作弊</button></div></aside><div id="passages"><div class="passage" data-passage="Unknown"></div></div><div id="overlay-parent"><div id="customOverlay" class="hidden" data-overlay="cheats"><div id="customOverlayTitle"><div id="overlayTabs"><button class="link-internal macro-button tab-selected">状态</button><button class="link-internal macro-button">外观</button></div></div><div id="customOverlayContent"><div id="cheatsShown" class="settingsGrid"></div><button id="native">Native action</button></div></div></div></body></html>`;
const browser=await chromium.launch(browserOptions),errors:string[]=[],contracts:unknown[]=[],samples:unknown[]=[],traces:unknown[]=[];
let status='FAIL',failure:string|undefined;
async function setup(code:string){
 const p=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});p.on('pageerror',e=>errors.push(e.message));await p.setContent(html);await p.addStyleTag({path:'dist/framework/official-ui/style.css'});
 await p.evaluate(()=>{
  let seed=731;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  document.querySelector('#cheatsShown')!.innerHTML=Array.from({length:20},(_,g)=>'<h2 class="settingsHeader">Group '+g+'</h2>'+Array.from({length:12},(_,i)=>'<div class="settingsToggleItem"><label><input type="checkbox">Setting '+i+'<span>Value</span></label></div>').join('')).join('');
  window.__stageWeather={name:'clear',precipitation:'none',dayState:'day'};Object.defineProperty(window,'Weather',{get:()=>window.__stageWeather});Object.assign(window,{jQuery:()=>({on(){return this},off(){return this}}),__stageOpen:0,__stageNative:0});
  document.getElementById('entry')!.onclick=()=>{window.__stageOpen++;document.getElementById('customOverlay')!.className='dgp-overlay'};
  document.getElementById('native')!.onclick=()=>{window.__stageNative++};
 });
 await p.addScriptTag({content:code});await p.evaluate(()=>{window.__stagePanels=window.__stageStart.startPanels(window);window.__stageStop=window.__stageStart.startOfficialMotion()});
 await p.evaluate(async()=>{for(let i=0;i<3;i++)await new Promise(requestAnimationFrame)});return p;
}
async function dispose(p:Page){await p.evaluate(()=>{window.__stageStop();window.__stagePanels.destroy()});assert.equal(await p.locator('.dgp-host,.kw-heading-weather,.kw-context-plane,.kw-native-orbit').count(),0);await p.close()}
const metricNames=['RecalcStyleCount','RecalcStyleDuration','LayoutCount','LayoutDuration','TaskDuration'] as const;
async function measure(code:string,variant:string,pair:number,trace=false){
 const p=await setup(code),cdp=await p.context().newCDPSession(p);await cdp.send('Performance.enable');
 if(trace)await cdp.send('Tracing.start',{categories:'devtools.timeline,blink.user_timing',transferMode:'ReturnAsStream'});
 const before=await cdp.send('Performance.getMetrics');
 const observation=await p.evaluate(async()=>{const start=performance.mark('A2Stage.begin').startTime;document.getElementById('entry')!.click();const sync=performance.now()-start;let frames=0,last=performance.now(),longest=0;while(performance.now()-start<650){await new Promise(requestAnimationFrame);const now=performance.now();longest=Math.max(longest,now-last);last=now;frames++}performance.mark('A2Stage.end');return{syncMs:sync,longestFrameGapMs:longest,frames}});
 const after=await cdp.send('Performance.getMetrics');
 const delta=Object.fromEntries(metricNames.map(name=>{const a=before.metrics.find(m=>m.name===name)?.value,b=after.metrics.find(m=>m.name===name)?.value;assert.equal(typeof a,'number');assert.equal(typeof b,'number');return[name,b!-a!]}));
 const outcome=await p.evaluate(()=>({open:window.__stageOpen,counts:window.__stagePanels.getLifecycleCounts(),labels:document.querySelectorAll('.dgp-navigation option').length-1,weather:document.querySelector<HTMLElement>('.kw-heading-weather')?.dataset.weather,focus:document.activeElement?.closest('.dgp-host')!==null}));assert.equal(outcome.open,1);assert.equal(outcome.counts.mounts,1);assert.equal(outcome.counts.failures,0);assert.equal(outcome.labels,20);assert.equal(outcome.weather,'clear');assert.equal(outcome.focus,true);
 if(trace){const done=new Promise<{stream?:string}>(resolve=>cdp.once('Tracing.tracingComplete',resolve));await cdp.send('Tracing.end');const{stream}=await done;assert.ok(stream);let raw='';for(;;){const chunk=await cdp.send('IO.read',{handle:stream});raw+=chunk.base64Encoded?Buffer.from(chunk.data,'base64').toString('utf8'):chunk.data;assert.ok(Buffer.byteLength(raw)<16*1024*1024);if(chunk.eof)break}await cdp.send('IO.close',{handle:stream});writeFileSync(join(out,variant+'-trace.json'),raw);type T={name:string;ph:string;pid:number;tid:number;ts:number;dur?:number};const events=(JSON.parse(raw)as{traceEvents:T[]}).traceEvents,begin=events.find(e=>e.name==='A2Stage.begin'),end=events.find(e=>e.name==='A2Stage.end');assert.ok(begin&&end&&begin.pid===end.pid&&begin.tid===end.tid);traces.push({variant,traceSha256:sha(raw),styles:events.filter(e=>e.ph==='X'&&['UpdateLayoutTree','RecalculateStyles','Layout'].includes(e.name)&&e.pid===begin.pid&&e.tid===begin.tid&&e.ts>=begin.ts&&e.ts+(e.dur??0)<=end.ts).map(e=>({name:e.name,timeMs:(e.ts-begin.ts)/1000,durationMs:(e.dur??0)/1000})),outcome});}
 await p.evaluate(()=>document.getElementById('native')!.click());assert.equal(await p.evaluate(()=>window.__stageNative),1);await dispose(p);return{variant,pair,discarded:pair<0,trace,observation,delta,outcome};
}
try{
 // Behavioral checks run separately from timing; no native wrappers in measured pages.
 for(const b of bundles){const p=await setup(b.code);await p.evaluate(()=>{window.__stageStop();window.__stagePanels.destroy()});const result=await p.evaluate(async()=>{
  const api=window.__stageStart.headerWeather(),overlay=document.getElementById('customOverlay')!,header=document.getElementById('customOverlayTitle')!;overlay.className='dgp-overlay';
  const check=(ok:boolean,label:string)=>{if(!ok)throw Error(label)};window.__stageEvents=[];const animate=Element.prototype.animate;
  Element.prototype.animate=function(frames,options){if(this.classList.contains('kw-heading-weather'))window.__stageEvents.push(typeof options==='number'?options:options?.duration);return animate.call(this,frames,options)};
  try{
   api.set('native',header,overlay);api.clear();api.refresh();check(!document.querySelector('.kw-heading-weather'),'clear before first flush');check(api.snapshot().activePolls===0,'cancelled poll');
   api.set('native',header,overlay);header.hidden=true;api.refresh();check(!document.querySelector('.kw-heading-weather'),'hidden before flush');header.hidden=false;
   api.set('native',header,overlay);window.__stageWeather={name:'heavyPrecipitation',precipitation:'rain',dayState:'night'};api.refresh();
   const node=document.querySelector<HTMLElement>('.kw-heading-weather')!;check(!!node&&node.dataset.weather==='rain'&&node.hasAttribute('data-night'),'fresh weather on initial flush');check(node.querySelectorAll('.kw-glass-drop').length===18,'same droplets');check(window.__stageEvents.includes(480),'initial weather fade preserved');
   const attrs={weather:node.dataset.weather,rain:node.dataset.rain,special:node.dataset.special,night:node.hasAttribute('data-night')};
   node.remove();api.refresh();check(!document.querySelector('.kw-heading-weather'),'externally removed node not resurrected');api.clear();
   api.set('native',header,overlay);api.refresh();window.__stageWeather={name:'clear',precipitation:'none',dayState:'day'};api.refresh();const pending=[...document.querySelector('.kw-heading-weather')!.getAnimations()].map(a=>a.finished);api.clear();await Promise.allSettled(pending);check(!document.querySelector('.kw-heading-weather'),'late completion after clear');
   api.set('native',header,overlay);overlay.remove();api.refresh();check(!document.querySelector('.kw-heading-weather')&&api.snapshot().activePolls===0,'detached parent before flush');
   api.dispose();return{attrs,animationDurations:window.__stageEvents,remaining:document.querySelectorAll('.kw-heading-weather').length,polls:api.snapshot().activePolls};
  }finally{Element.prototype.animate=animate;api.dispose()}
 });contracts.push({variant:b.variant,result});assert.equal(result.remaining,0);assert.equal(result.polls,0);await p.close();}
 assert.deepEqual((contracts[0]as{result:unknown}).result,(contracts[1]as{result:unknown}).result,'native weather behavior and fade observations');
 for(let pair=-2;pair<12;pair++){const order=pair%2===0?bundles:[...bundles].reverse();for(const b of order)samples.push(await measure(b.code,b.variant,pair));}
 for(const b of bundles)await measure(b.code,b.variant,0,true);
 assert.deepEqual(errors,[]);assert.deepEqual(sourceHashes(),before);status='PASS';
}catch(error){failure=String(error);throw error}finally{writeFileSync(join(out,'result.json'),JSON.stringify({status,failure,mode,navigationBaseline,baselineNavigationSha256:sha(originalNavigation),environment:{node:process.version,platform:process.platform,arch:process.arch,chromium:browser.version(),viewport:{width:1280,height:900,dpr:1}},hypothesis:mode==='native-stage'?'Only stage native weather insertion until current refresh initializes attributes; no visibility cache, shared scheduler, frame delay, Host or settings renderer change.':'Move native weather set before navigation group/mark writes; preserve weather implementation, no visibility cache, frame delay, Host or settings renderer change.',workingTreeSourceSha256:before,candidateWeatherSha256:sha(candidate),candidateNavigationSha256:sha(candidateNavigation),bundles:bundles.map(({variant,sha256})=>({variant,sha256})),contracts,samples,traces,limits:'Controlled cheats fixture using actual first-party modules and current compiled CSS. Two discarded plus twelve alternating pairs, each fresh page, 650ms window. Uninstrumented timing separate from trace/behavior wrappers. Navigation baseline explicitly substituted from frozen commit, other inputs bound to workingTreeSourceSha256. No game/Android/visual or overall performance acceptance; original/candidate observed once per sample, no repeated selection.'},null,2)+'\n');await browser.close();console.log(out)}
