// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"named","caseSource":"check"}
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import cp = require('node:child_process');
import crypto = require('node:crypto');
import playwright = require('playwright');
import cases = require('../scripts/ci-cases.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
import type {wetGlass} from '../src/ui/weather/wet-glass';

type Material=ReturnType<typeof wetGlass>;
declare const rainDOM:{draw(time?:number,wet?:number,snow?:number):void;snapshot:Material['snapshot'];dispose:Material['dispose']};
async function setup(){
 const [{wetGlass},{frostedFeatherSnow}]=await Promise.all([import('../src/ui/weather/wet-glass.ts'),import('../src/ui/weather/edge-frost.ts')]);
 const canvas=document.querySelector<HTMLCanvasElement>('canvas');if(!canvas)throw Error('Missing weather canvas');
 const renderer=wetGlass(canvas,()=>{},true,true,true,true,'scatter',frostedFeatherSnow,true);
 const frame={wet:1,snow:0,light:.25,night:0,time:2,width:960,height:700,dpr:1,intensity:1.5,kind:'storm',special:'none' as const,specialAmount:0};
 const draw=(time?:number,wet?:number,snow?:number)=>{if(time!==undefined)frame.time=time;if(wet!==undefined)frame.wet=wet;if(snow!==undefined)frame.snow=snow;renderer.draw(frame)};
 Object.assign(window,{rainDOM:{draw,snapshot:renderer.snapshot,dispose:renderer.dispose}});for(let i=0;i<10;i++)draw();
}
const baseline=process.argv.includes('--baseline'),file='src/ui/weather/wet-glass.ts',revision='178f8b2b5b1828038b7c3ec304e8995bbe99ee38',old=baseline?cp.execFileSync('git',['show',revision+':'+file],{encoding:'utf8'}):undefined;
const mapBaseline=process.argv.includes('--map-baseline')?cp.execFileSync('git',['show','cfd03500470b5e110d6941c8fa85c86c75e70ad2:'+file],{encoding:'utf8'}):undefined;
const frostBaseline=process.argv.includes('--frost-baseline')?cp.execFileSync('git',['show','ce25f59c3fd7d621c11c94b2dd8431676996f78a:src/ui/weather/edge-frost.ts'],{encoding:'utf8'}):undefined;
async function check(name:string,run:()=>Promise<void>){await cases.runCase(name,run);console.log('PASS',name)}
(async()=>{const {createServer}=await import('vite');const server=await createServer({configFile:false,plugins:[{name:'weather-dom-write-contract',enforce:'pre',load(id){id=id.split('?')[0]!;if(mapBaseline&&id.replaceAll('\\','/').endsWith('/'+file))return mapBaseline;if(frostBaseline&&id.replaceAll('\\','/').endsWith('/src/ui/weather/edge-frost.ts'))return frostBaseline;if(old&&id.replaceAll('\\','/').endsWith('/'+file))return old},configureServer(s){s.middlewares.use('/__weather_dom__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end(`<!doctype html><style>.dmt-settings-shell{position:relative;width:960px;height:700px;overflow:hidden}canvas{position:absolute;inset:0;width:960px;height:700px}.dmt-workspace{position:absolute;left:220px;top:180px;width:300px;height:200px}</style><div class="dmt-settings-shell"><canvas width="960" height="700"></canvas><div class="dmt-workspace"><button>Original control</button><p>Protected reading content.</p></div></div><script type="module">(${setup.toString()})()</script>`)})}}],server:{host:'127.0.0.1',port:0}});let browser:playwright.Browser|undefined;const result:Record<string,unknown>={baseline,mapBaseline:!!mapBaseline,baselineRef:revision,frostBaseline:!!frostBaseline,frostInputSha256:crypto.createHash('sha256').update(frostBaseline??fs.readFileSync('src/ui/weather/edge-frost.ts')).digest('hex'),inputSha256:crypto.createHash('sha256').update(mapBaseline??old??fs.readFileSync(file)).digest('hex')};try{await server.listen();const address=server.httpServer?.address();assert.ok(address&&typeof address!=='string');browser=await playwright.chromium.launch(require('./browser-options.cjs'));const p=await browser.newPage({viewport:{width:1280,height:900}});const errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(`http://127.0.0.1:${address.port}/__weather_dom__`);await p.waitForFunction(()=>typeof rainDOM!=='undefined');
 await check('stationary glass frame does not rewrite DOM',async()=>{const r=await p.evaluate(async()=>{const layer=document.querySelector('.evo-glass-layer');if(!layer)throw Error('Missing layer');const before=rainDOM.snapshot(),nodes=[...layer.querySelectorAll('.evo-glass-drop,.evo-wet-path')],o=new MutationObserver(()=>{});o.observe(layer,{subtree:true,attributes:true,childList:true});for(let i=0;i<12;i++)rainDOM.draw();const mutations=o.takeRecords().length;o.disconnect();return{mutations,active:before.activeDrops,nodesSame:nodes.every((n,i)=>layer.querySelectorAll('.evo-glass-drop,.evo-wet-path')[i]===n),snapshotSame:JSON.stringify(before)===JSON.stringify(rainDOM.snapshot())}});result.stationary=r;assert.ok(r.active>0);assert.equal(r.nodesSame,true);assert.equal(r.snapshotSame,true);assert.equal(r.mutations,0,'unchanged material frame must not rewrite inline styles or data flags')});
 await check('moving glass retains geometry and original controls',async()=>{const r=await p.evaluate(()=>{const root=document.querySelector('.dmt-settings-shell'),layer=document.querySelector('.evo-glass-layer'),button=document.querySelector('button');if(!root||!layer||!button)throw Error('Missing fixture');const before=rainDOM.snapshot(),nodes=[...layer.children],o=new MutationObserver(()=>{});o.observe(layer,{subtree:true,attributes:true,childList:true});const records:MutationRecord[]=[];let maxStyleWritesPerNode=0;for(let i=1;i<=60;i++){rainDOM.draw(2+i/60);const frame=o.takeRecords(),counts=new Map<Node,number>();for(const r of frame)if(r.attributeName==='style')counts.set(r.target,(counts.get(r.target)??0)+1);maxStyleWritesPerNode=Math.max(maxStyleWritesPerNode,...counts.values());records.push(...frame)}o.disconnect();const after=rainDOM.snapshot(),visible=[...layer.querySelectorAll<HTMLElement>('.evo-glass-drop')].filter(n=>n.style.display==='block'),base=root.getBoundingClientRect();const geometry=visible.map(n=>{const d=after.drops.find(d=>String(d.id)===n.dataset.dropId);if(!d)throw Error('Missing real drop');const r=n.getBoundingClientRect(),css=getComputedStyle(n),stretch=Math.sqrt(1+Math.min(.55,d.vy*.012)),rx=Math.sqrt(d.area)/stretch,ry=Math.sqrt(d.area)*stretch;return{dx:Math.abs(r.left-base.left-(d.x-rx)),dy:Math.abs(r.top-base.top-(d.y-ry)),dw:Math.abs(r.width-Math.max(rx*2,parseFloat(css.borderLeftWidth)+parseFloat(css.borderRightWidth))),dh:Math.abs(r.height-Math.max(ry*2,parseFloat(css.borderTopWidth)+parseFloat(css.borderBottomWidth))),filter:css.backdropFilter}});return{writes:records.length,maxStyleWritesPerNode,remounts:records.filter(r=>r.type==='childList').length,nodesSame:nodes.every((n,i)=>layer.children[i]===n),advanced:JSON.stringify(before.drops)!==JSON.stringify(after.drops),geometry:geometry.every(g=>g.dx<.05&&g.dy<.05&&g.dw<.05&&g.dh<.05&&g.filter.includes('url(')),geometryFailures:geometry.filter(g=>g.dx>=.05||g.dy>=.05||g.dw>=.05||g.dh>=.05||!g.filter.includes('url(')).slice(0,4),visible:visible.length,controlSame:document.querySelector('button')===button,overlap:after.protectedOverlap}});result.moving=r;assert.ok(r.writes>0&&r.advanced&&r.visible>0);assert.equal(r.remounts,0);assert.equal(r.nodesSame,true);assert.equal(r.geometry,true);assert.equal(r.controlSame,true);assert.equal(r.overlap,0);if(process.argv.includes('--coalesced'))assert.ok(r.maxStyleWritesPerNode<=1,'each owned node commits its frame style once')});
 await check('same-frame repaint restores changed owned style',async()=>{const r=await p.evaluate(()=>{const n=document.querySelector<HTMLElement>('.evo-glass-drop[data-drop-id]');if(!n)throw Error('Missing visible drop');const expected=n.style.opacity;n.style.opacity='0';rainDOM.draw();return{expected,after:n.style.opacity}});assert.equal(r.after,r.expected);assert.notEqual(r.expected,'0')});
 await check('fixed glass maps reuse pixels with independent owners and atomic retry',async()=>{
  const r=await p.evaluate(async()=>{
   // A fresh module instance exercises cold construction without touching the main fixture.
   const modulePath='/src/ui/weather/wet-glass.ts?map-contract';
   const {wetGlass}:typeof import('../src/ui/weather/wet-glass')=await import(modulePath);
   const shells:HTMLElement[]=[],materials:Material[]=[];
   const make=()=>{const shell=document.createElement('div');shell.style.cssText='position:relative;width:960px;height:700px';const canvas=document.createElement('canvas');canvas.width=960;canvas.height=700;shell.append(canvas);document.body.append(shell);shells.push(shell);return{shell,canvas}};
   const encode=HTMLCanvasElement.prototype.toDataURL;let encodes=0,fail=true;
   HTMLCanvasElement.prototype.toDataURL=function(...args:Parameters<typeof encode>){encodes++;if(fail&&encodes===2)throw Error('controlled map encoding failure');return encode.apply(this,args)};
   try{
    const broken=make();let rejected=false;
    try{materials.push(wetGlass(broken.canvas,()=>{}))}catch(e){rejected=e instanceof Error&&e.message==='controlled map encoding failure'}
    const failedNodes=broken.shell.querySelectorAll('.evo-material-layer').length;
    fail=false;const a=make(),first=wetGlass(a.canvas,()=>{});materials.push(first);const afterRetry=encodes;
    const b=make(),second=wetGlass(b.canvas,()=>{});materials.push(second);const afterSecond=encodes;
    const ids=(root:HTMLElement)=>[...root.querySelectorAll('filter')].map(n=>n.id),maps=(root:HTMLElement)=>[...root.querySelectorAll('feImage')].map(n=>n.getAttribute('href'));
    const idsA=ids(a.shell),idsB=ids(b.shell),imagesA=maps(a.shell),imagesB=maps(b.shell);
    first.dispose();first.dispose();
    const frame={wet:0,snow:0,light:.25,night:0,time:2,width:960,height:700,dpr:1,intensity:1.5,kind:'clear',special:'none' as const,specialAmount:0};
    second.draw(frame);const clear=second.snapshot().activeDrops;
    second.draw({...frame,wet:1,kind:'rain',time:2.05});const rain=second.snapshot().activeDrops;
    const visible=[...b.shell.querySelectorAll<HTMLElement>('.evo-glass-drop')].filter(n=>n.style.display==='block');
    const ownFilters=visible.every(n=>idsB.some(id=>n.style.backdropFilter.includes(id)&&b.shell.querySelector('#'+id)));
    second.dispose();const c=make(),reopened=wetGlass(c.canvas,()=>{});materials.push(reopened);const afterReopen=encodes;reopened.dispose();
    return{rejected,failedNodes,afterRetry,afterSecond,afterReopen,unique:idsA.length===3&&idsB.length===3&&new Set([...idsA,...idsB]).size===6,samePixels:imagesA.length===3&&imagesA.every((v,i)=>v?.startsWith('data:image/png')&&v===imagesB[i]),clear,rain,visible:visible.length,ownFilters,left:shells.reduce((n,s)=>n+s.querySelectorAll('.evo-material-layer').length,0)};
   }finally{HTMLCanvasElement.prototype.toDataURL=encode;materials.forEach(m=>m.dispose());shells.forEach(s=>s.remove())}
  });
  result.maps=r;assert.equal(r.rejected,true);assert.equal(r.failedNodes,0);assert.equal(r.afterRetry,5,'failed partial set must retry all three maps');assert.equal(r.afterSecond,r.afterRetry,'second owner must not re-encode fixed maps');assert.equal(r.afterReopen,r.afterRetry,'reopen reuses bounded immutable pixels');assert.equal(r.unique,true);assert.equal(r.samePixels,true);assert.equal(r.clear,0);assert.ok(r.rain>0&&r.visible>0,'first rainy draw must display drops immediately');assert.equal(r.ownFilters,true,'disposing one owner must not break another filter');assert.equal(r.left,0);
 });
 await check('stable frost reuses paths without caching changing weather',async()=>{
  const r=await p.evaluate(async()=>{
   const modulePath='/src/ui/weather/edge-frost.ts';
   const {frostedFeatherSnow}:typeof import('../src/ui/weather/edge-frost')=await import(modulePath);
   const canvas=document.createElement('canvas');canvas.width=960;canvas.height=700;
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Missing frost canvas');
   const safe=(b:{x:number;y:number;width:number;height:number})=>b.x>=1&&b.y>=1&&b.x+b.width<959&&b.y+b.height<699;
   const material=frostedFeatherSnow(ctx,safe),draw=(snow:number,time:number)=>{ctx.clearRect(0,0,960,700);material.draw(snow,time,960,700)};
   const NativePath=window.Path2D;let created=0;
   window.Path2D=class extends NativePath{constructor(path?:Path2D|string){super(path);created++}};
   try{
    draw(1,4);const cold=created;
    draw(1,4+1/60);const built=created;
    draw(1,4+2/60);const warm=created,before=material.snapshot();
    for(const snow of [.25,.5,.75])draw(snow,5+snow);
    const changing=created;
    draw(.75,6);const rebuilt=created;
    draw(.75,6+1/60);const reused=created,after=material.snapshot();
    draw(0,7);
    return{cold,built,warm,changing,rebuilt,reused,before:before.edgeFrostBounds.length,after:after.edgeFrostBounds.length,safe:after.edgeFrostBounds.every(safe),clear:material.snapshot().edgeFrostBounds.length};
   }finally{window.Path2D=NativePath}
  });
  result.frostPaths=r;assert.equal(r.cold,0,'cold frame draws directly');assert.ok(r.built>0&&r.built<=144*18,'repeated geometry builds bounded owned paths');assert.equal(r.warm,r.built,'warm frame reuses paths');assert.equal(r.changing,r.warm,'changing weather creates no paths');assert.ok(r.rebuilt>r.changing,'new stable geometry replaces paths');assert.equal(r.reused,r.rebuilt);assert.ok(r.before>0&&r.after>0);assert.equal(r.safe,true);assert.equal(r.clear,0);
 });
 await check('official rain stays in its header without compressing the model',async()=>{
  const r=await p.evaluate(async()=>{
   const shell=document.querySelector<HTMLElement>('.dmt-settings-shell'),workspace=document.querySelector<HTMLElement>('.dmt-workspace'),layer=document.querySelector<HTMLElement>('.evo-glass-layer');if(!shell||!workspace||!layer)throw Error('Missing header coverage fixture');
   const before=rainDOM.snapshot(),header=document.createElement('header'),choice=document.createElement('div'),nav=document.createElement('nav');header.className='dmt-settings-header';choice.className='dmt-layout-choice';nav.className='dmt-workspace-nav';
   Object.assign(header.style,{position:'absolute',left:'0',top:'0',width:'960px',height:'80px'});Object.assign(choice.style,{position:'absolute',left:'0',top:'80px',width:'960px',height:'40px'});Object.assign(nav.style,{position:'absolute',left:'-220px',top:'-60px',width:'960px',height:'40px'});
   shell.setAttribute('data-sf-weather-material','');shell.append(header,choice);workspace.dataset.settingsLayout='horizontal';workspace.append(nav);await Promise.resolve();rainDOM.draw();
   const canvas=shell.querySelector('canvas');if(!canvas)throw Error('Missing canvas');const horizontalCanvas=canvas.height;const horizontal=rainDOM.snapshot(),visible=[...layer.querySelectorAll<HTMLElement>('.evo-glass-drop')].filter(n=>n.style.display==='block'),rect=layer.getBoundingClientRect(),base=shell.getBoundingClientRect();
   const geometry=visible.every(n=>{const r=n.getBoundingClientRect();return r.top-base.top<horizontal.rainRegion.height&&getComputedStyle(n).backdropFilter.includes('url(')});
   const o=new MutationObserver(()=>{});o.observe(layer,{subtree:true,attributes:true,childList:true});for(let i=0;i<8;i++)rainDOM.draw();const quiet=o.takeRecords().length;o.disconnect();
   workspace.dataset.settingsLayout='vertical';Object.assign(nav.style,{left:'0',top:'0',width:'140px',height:'400px'});await Promise.resolve();rainDOM.draw();const vertical=rainDOM.snapshot(),verticalCanvas=canvas.height;rainDOM.draw(undefined,undefined,1);const snowCanvas=canvas.height;rainDOM.draw(undefined,undefined,0);
   shell.removeAttribute('data-sf-weather-material');header.remove();choice.remove();nav.remove();delete workspace.dataset.settingsLayout;await Promise.resolve();rainDOM.draw();const restored=rainDOM.snapshot();
   return{horizontalCanvas,verticalCanvas,snowCanvas,restoredCanvas:canvas.height,horizontal:horizontal.rainRegion,vertical:vertical.rainRegion,restored:restored.rainRegion,physicalHeight:rect.height,geometry,quiet,active:horizontal.activeDrops,beforeActive:before.activeDrops,modelSame:JSON.stringify(before.drops)===JSON.stringify(horizontal.drops)&&JSON.stringify(before.drops)===JSON.stringify(vertical.drops),fullHeight:shell.clientHeight,restoredActive:restored.activeDrops};
  });result.header=r;assert.equal(r.horizontal.coverage,'header');assert.equal(r.horizontal.height,208);assert.equal(r.physicalHeight,208);assert.equal(r.horizontalCanvas,208);assert.equal(r.verticalCanvas,168);assert.equal(r.snowCanvas,700,'snow retains its full edge surface');assert.equal(r.restoredCanvas,700);assert.equal(r.vertical.height,168,'vertical navigation must not expand rain through the body');assert.equal(r.fullHeight,700,'original surface dimensions remain unchanged');assert.equal(r.modelSame,true);assert.ok(r.active>0&&r.active<r.beforeActive);assert.equal(r.geometry,true);assert.equal(r.quiet,0);assert.equal(r.restored.coverage,'surface');assert.equal(r.restored.height,700);assert.equal(r.restoredActive,r.beforeActive);
 });
 await check('official rain coalesces sub-frame paints but immediately updates geometry',async()=>{
  const r=await p.evaluate(async()=>{const shell=document.querySelector<HTMLElement>('.dmt-settings-shell');if(!shell)throw Error('Missing shell');const header=document.createElement('header');header.className='dmt-settings-header';Object.assign(header.style,{position:'absolute',top:'0',height:'80px',width:'960px'});shell.setAttribute('data-sf-weather-material','');shell.append(header);document.documentElement.setAttribute('data-dgu-visualmotion','');await Promise.resolve();rainDOM.draw();const initial=rainDOM.snapshot();rainDOM.draw(3+1/120);const skipped=rainDOM.snapshot();header.style.height='90px';shell.setAttribute('data-workspace-transition','probe');await Promise.resolve();rainDOM.draw(3+1/120);const forced=rainDOM.snapshot();rainDOM.draw(3+1/60);const next=rainDOM.snapshot();document.documentElement.removeAttribute('data-dgu-visualmotion');rainDOM.draw(3+1/60+1/240);const motionOff=rainDOM.snapshot();header.remove();shell.removeAttribute('data-sf-weather-material');shell.removeAttribute('data-workspace-transition');await Promise.resolve();rainDOM.draw();return{coalesced:JSON.stringify(initial.drops)===JSON.stringify(skipped.drops),forcedHeight:forced.rainRegion.height,forcedAdvanced:JSON.stringify(initial.drops)!==JSON.stringify(forced.drops),nextAdvanced:JSON.stringify(forced.drops)!==JSON.stringify(next.drops),motionOffAdvanced:JSON.stringify(next.drops)!==JSON.stringify(motionOff.drops),full:rainDOM.snapshot().rainRegion.height};});result.cadence=r;assert.equal(r.coalesced,true);assert.equal(r.forcedHeight,138);assert.equal(r.forcedAdvanced,true);assert.equal(r.nextAdvanced,true);assert.equal(r.motionOffAdvanced,true);assert.equal(r.full,700);
 });
 await check('settings alignment refreshes protected control geometry',async()=>{
  await p.addStyleTag({content:'html[data-dgu-options-centered] .dmt-workspace{left:400px}'});
  const r=await p.evaluate(async()=>{
   const button=document.querySelector('button'),canvas=document.querySelector('canvas');if(!button||!canvas)throw Error('Missing alignment geometry');
   const covered=()=>{const b=button.getBoundingClientRect(),c=canvas.getBoundingClientRect();return rainDOM.snapshot().protected.some(p=>Math.abs(p.x-(b.x-c.x))<.05&&Math.abs(p.y-(b.y-c.y))<.05&&Math.abs(p.width-b.width)<.05)};
   rainDOM.draw();const before=covered();document.documentElement.setAttribute('data-dgu-options-centered','');await Promise.resolve();rainDOM.draw();const centered=covered();document.documentElement.removeAttribute('data-dgu-options-centered');await Promise.resolve();rainDOM.draw();return{before,centered,restored:covered()};
  });result.alignment=r;assert.deepEqual(r,{before:true,centered:true,restored:true});
 });
 await check('dry repeated frame is quiet and material releases',async()=>{const r=await p.evaluate(()=>{rainDOM.draw(3,0);const layer=document.querySelector('.evo-glass-layer');if(!layer)throw Error('Missing layer');const o=new MutationObserver(()=>{});o.observe(layer,{attributes:true,childList:true,subtree:true});for(let i=0;i<8;i++)rainDOM.draw();const writes=o.takeRecords().length;o.disconnect();rainDOM.dispose();rainDOM.dispose();return{writes,left:document.querySelectorAll('.evo-glass-layer').length}});result.dry=r;assert.equal(r.writes,0);assert.equal(r.left,0)});assert.deepEqual(errors,[]);result.status='PASS';
}finally{fs.mkdirSync('tests/artifacts',{recursive:true});fs.writeFileSync(path.resolve('tests/artifacts/weather-dom-writes-'+(baseline?'baseline':'current')+(frostBaseline?'-frost-baseline':'')+(mapBaseline?'-map-baseline':'')+'.json'),JSON.stringify(result,null,2));await browser?.close();await server.close()}})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});
