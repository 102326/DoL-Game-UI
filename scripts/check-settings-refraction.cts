// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"named","caseSource":"check"}
import cases = require('./ci-cases.cjs');
const {runCase}=cases;
// Run against the actual static build. Evidence/recording stays first-party and local.
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import child = require('node:child_process');
import crypto = require('node:crypto');
import playwright = require('playwright');
import browserOptions = require('../tests/browser-options.cjs');
import type {Preferences} from '../src/theme/preferences';
const {chromium}=playwright, {execFileSync}=child, {createHash}=crypto;
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing study DOM value');return value}
const recordValue=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
function provenance(value:unknown):asserts value is {refs:{old:string};files:Record<'old'|'new',Record<string,string>>;patched:{controller:string;panel:string}}{if(!recordValue(value)||!recordValue(value.refs)||typeof value.refs.old!=='string'||!recordValue(value.files)||!recordValue(value.files.old)||!recordValue(value.files.new)||!recordValue(value.patched)||typeof value.patched.controller!=='string'||typeof value.patched.panel!=='string'||!Object.values({...value.files.old,...value.files.new}).every(v=>typeof v==='string'))throw Error('Invalid frozen provenance')}
type Study={variant:'old'|'new';revision:string;act(action:string):void;operations:{action:string;at:number;wallTime:number}[];motionEvidence:{event:string;at:number;[key:string]:unknown}[];preferences():Preferences|undefined;destroy():void;mount():void};
type Rectangle={x:number;y:number;width:number;height:number;right:number;bottom:number};
type ReversalSample={rect:Rectangle;opacity:number;transform:string;clip:string};
type Reversal={initial:ReversalSample;closed:ReversalSample;reopened:ReversalSample;stages:number;inert:boolean};
declare global {interface Window {settingsStudy:Study;__studyInitiallyInert?:boolean}}
declare const settingsStudy:Study;
declare const DoLMidnightTheme:{setPreference(name:'visualMotion',value:boolean):void};
const root=path.resolve('tests/artifacts/settings-refraction-v1'),dist=path.join(root,'dist');
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const output=path.join(root,'review-'+Date.now());fs.mkdirSync(output,{recursive:true});
const record=process.argv.includes('--record'),checks:string[]=[],errors:string[]=[],timingMeasurements:Record<string,{open:number;category:number;close:number}>={},categoryProgress:Record<string,{animationTime:number;opacity:number;clipPath:string;easing:string;transform:string;readableFraction:number}[]>={};
const types:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{const file=path.resolve(dist,'.'+decodeURIComponent(new URL(req.url??'/','http://local').pathname==='/'?'/index.html':new URL(req.url??'/','http://local').pathname));if(!file.startsWith(dist+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
async function check(name:string,fn:()=>Promise<void>){await runCase(name,fn);checks.push(name);console.log('PASS',name)}
const act=(page:playwright.Page,action:string)=>page.evaluate(action=>window.settingsStudy.act(action),action);
const waitOpen=(page:playwright.Page)=>page.waitForFunction(()=>document.querySelector<HTMLDialogElement>('dialog')?.dataset.rfState==='open');
const waitClosed=(page:playwright.Page)=>page.waitForFunction(()=>!document.querySelector<HTMLDialogElement>('dialog')?.open);
const waitPage=(page:playwright.Page,id:string)=>page.waitForFunction(id=>{const d=document.querySelector('dialog'),nodes=[...document.querySelectorAll('.dmt-workspace-section')];return !d?.hasAttribute('data-workspace-transition')&&nodes.length===1&&nodes[0]?.getAttribute('aria-labelledby')==='dmt-'+id+'-heading'&&!nodes[0]?.hasAttribute('inert')},id);
(async()=>{
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();assert.ok(address&&typeof address!=='string');const base='http://127.0.0.1:'+address.port;
  const browser=await chromium.launch({...browserOptions,args:[...(browserOptions.args||[]),'--site-per-process']});let page!:playwright.Page;
 const watch=(page:playwright.Page)=>{page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())})};
 try{
  await check('frozen baseline source identity; only two generated candidate source files differ',async()=>{
   const manifest:unknown=JSON.parse(fs.readFileSync(path.join(root,'provenance.json'),'utf8'));provenance(manifest);assert.equal(manifest.refs.old,'915dcb9e85f3266a73a3e7ce38d769edd0c29ff4');
   for(const variant of ['old','new'] as const)for(const [name,digest]of Object.entries(manifest.files[variant])){
    const actual=sha(fs.readFileSync(path.join(root,variant,name)));
    const expected:string=variant==='new'&&name==='src/theme/controller.ts'?manifest.patched.controller:variant==='new'&&name==='src/theme/SettingsPanel.vue'?manifest.patched.panel:digest;
    assert.equal(actual,expected,variant+': '+name);
   }
  });
  await check('V2.3 open, close and category settlement stay near the actual 3.0.4 baseline',async()=>{
   for(const variant of ['old','new'] as const){
    page=await browser.newPage({viewport:{width:1280,height:900}});watch(page);await page.goto(base+'/scene.html?variant='+variant);await page.waitForFunction(()=>window.settingsStudy);
    timingMeasurements[variant]=await page.evaluate(async variant=>{
     const measure=async(action:string,ready:()=>boolean|undefined)=>{const start=performance.now();settingsStudy.act(action);await new Promise<void>((resolve,reject)=>{const tick=()=>{if(ready())resolve();else if(performance.now()-start>3000)reject(Error('Settlement timeout: '+action));else requestAnimationFrame(tick)};requestAnimationFrame(tick)});return performance.now()-start};
     const opened=():boolean|undefined=>variant==='new'?document.querySelector<HTMLDialogElement>('dialog')?.dataset.rfState==='open':!document.querySelector('.dmt-open-material')&&document.querySelector<HTMLDialogElement>('dialog')?.open&&document.querySelector('.dmt-settings-shell')!.getAnimations().every(a=>a.playState!=='running');
     const open=await measure('打开设置',opened);
     const category=await measure('切换：材质',()=>!document.querySelector('dialog')!.hasAttribute('data-workspace-transition')&&document.querySelectorAll('.dmt-workspace-section').length===1&&!!document.getElementById('dmt-material-heading'));
     const close=await measure('关闭设置',()=>!document.querySelector<HTMLDialogElement>('dialog')?.open);
     return {open,category,close};
    },variant);await page.close();
   }
   for(const action of ['open','close','category'] as const)assert.ok(must(timingMeasurements.new)[action]>=0&&must(timingMeasurements.new)[action]<=must(timingMeasurements.old)[action]+180,action+' is not near baseline: '+JSON.stringify(timingMeasurements));
   console.log('TIMING',JSON.stringify(timingMeasurements));
  });
  await check('category readable progress matches the old release, not only its final duration',async()=>{
   for(const variant of ['old','new'] as const){
    page=await browser.newPage({viewport:{width:1280,height:900}});watch(page);await page.goto(base+'/scene.html?variant='+variant);await page.waitForFunction(()=>window.settingsStudy);await act(page,'打开设置');
    if(variant==='new')await waitOpen(page);else await page.waitForFunction(()=>!document.querySelector('.dmt-open-material')&&document.querySelector<HTMLDialogElement>('dialog')?.open&&document.querySelector('.dmt-settings-shell')!.getAnimations().every(a=>a.playState!=='running'));
    await act(page,'切换：材质');
    await page.waitForFunction(()=>document.querySelector('[aria-labelledby="dmt-material-heading"]')?.getAnimations().some(a=>a.effect?.getTiming().duration===620));
    categoryProgress[variant]=await page.evaluate(()=>{
     const node=document.querySelector('[aria-labelledby="dmt-material-heading"]')!,animation=node.getAnimations().find(a=>a.effect?.getTiming().duration===620)!,samples:{animationTime:number;opacity:number;clipPath:string;easing:string;transform:string;readableFraction:number}[]=[];
     // Seek both actual browser effects to the same animation time. Comparing
     // independent 160ms sleeps can sample different frames under layout load.
     animation.pause();
     for(const target of [160,300]){
      animation.currentTime=target;const style=getComputedStyle(node);
      const inset=style.clipPath.match(/^inset\((.*?)(?: round |\))/)?.[1]?.trim().split(/\s+/).map(parseFloat)??[0];
      const right=inset[1]??inset[0]??0,left=inset[3]??right;
      samples.push({animationTime:target,opacity:Number(style.opacity),clipPath:style.clipPath,easing:animation.effect!.getTiming().easing??'',transform:style.transform,readableFraction:Number(style.opacity)*Math.max(0,1-(left+right)/100)});
     }return samples;
    });await page.close();
   }
   fs.writeFileSync(path.join(output,'category-progress.json'),JSON.stringify(categoryProgress,null,2));
   for(let i=0;i<2;i++)assert.ok(must(categoryProgress.new?.[i]).readableFraction>=must(categoryProgress.old?.[i]).readableFraction-.10,'New category still reveals substantially later than old: '+JSON.stringify(categoryProgress));
  });
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
   page=await browser.newPage({viewport,deviceScaleFactor:1});watch(page);await page.goto(base+'/scene.html?variant=new');await page.waitForFunction(()=>window.settingsStudy);
   await check(viewport.width+': real modal, geometry, hit testing, actual preference input and keyboard close',async()=>{
    await page.evaluate(()=>document.getElementById('dol-midnight-sidebar-button')!.addEventListener('click',()=>{window.__studyInitiallyInert=document.querySelector('.dmt-workspace-page')!.hasAttribute('inert')},{once:true}));
    await page.getByRole('button',{name:'界面设置',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__studyInitiallyInert),false,'Short opacity-only opening must not gate the content');await waitOpen(page);
    const geometry=await page.evaluate(()=>{
     const shell=document.querySelector('.dmt-settings-shell')!,r=shell.getBoundingClientRect();return {modal:document.querySelector('dialog')!.matches(':modal'),rect:{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom},surface:getComputedStyle(shell).backgroundColor,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,hit:[...document.querySelectorAll('.dmt-workspace-nav button,.dmt-close')].map(n=>{const b=n.getBoundingClientRect();return n.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))}),decorative:[...document.querySelectorAll('.rf-stage,.rf-stage *')].every(n=>getComputedStyle(n).pointerEvents==='none')};
    });
    assert.ok(geometry.modal&&geometry.decorative&&geometry.hit.every(Boolean));assert.ok(Number(geometry.surface.match(/[\d.]+/g)?.[3]??1)>=.8,'Static Acrylic face must not become transparent after removing the proxy');assert.ok(geometry.rect.x>=0&&geometry.rect.right<=geometry.width+1);assert.ok(geometry.rect.y>=0&&geometry.rect.bottom<=geometry.height+1);assert.ok(geometry.scrollWidth<=geometry.width+1);assert.ok(Object.values(geometry.rect).every(Number.isFinite));
    fs.writeFileSync(path.join(output,'geometry-'+viewport.width+'.json'),JSON.stringify(geometry,null,2));
    const before=await page.evaluate(()=>settingsStudy.preferences()!.comfortable);await page.getByLabel('舒适阅读间距',{exact:true}).click();assert.equal(await page.evaluate(()=>settingsStudy.preferences()!.comfortable),!before);
    await page.screenshot({path:path.join(output,'candidate-'+viewport.width+'.png')});await page.keyboard.press('Escape');await waitClosed(page);assert.equal(await page.evaluate(()=>document.activeElement?.id),'dol-midnight-sidebar-button');
   });
   await check(viewport.width+': fast latest-intent category switching settles one accessible page',async()=>{
    await act(page,'打开设置');await waitOpen(page);
    for(const category of ['材质','入口','页面','高级','阅读']){await act(page,'切换：'+category);await page.waitForTimeout(70)}
    await waitPage(page,'reading');assert.equal(await page.locator('.dmt-workspace-section[aria-hidden=true]').count(),0);assert.equal(await page.locator('.dmt-workspace-page[inert]').count(),0);
   });
   await check(viewport.width+': short opacity-only open/close keeps latest intent and stationary hitboxes',async()=>{
    await act(page,'关闭设置');await waitClosed(page);
    const values=await page.evaluate(()=>new Promise<Reversal>(resolve=>{
     settingsStudy.act('打开设置');requestAnimationFrame(()=>{
      const shell=document.querySelector('.dmt-settings-shell')!;
      const sample=()=>({rect:(()=>{const r=shell.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}})(),opacity:Number(getComputedStyle(shell).opacity),transform:getComputedStyle(shell).transform,clip:getComputedStyle(shell).clipPath});
      const initial=sample();settingsStudy.act('展开中关闭');const closed=sample();settingsStudy.act('关闭中重新打开');const reopened=sample();resolve({initial,closed,reopened,stages:document.querySelectorAll('.rf-stage,[data-rf-group]').length,inert:document.querySelector('.dmt-workspace-page')!.hasAttribute('inert')});
     });
    }));
    assert.equal(values.stages,0);assert.equal(values.inert,false);
    for(const value of [values.initial,values.closed,values.reopened]){assert.equal(value.transform,'none');assert.equal(value.clip,'none');for(const key of ['x','y','width','height'] as const)assert.ok(Number.isFinite(value.rect[key])&&Math.abs(value.rect[key]-values.initial.rect[key])<=1/64);assert.ok(Math.abs(value.opacity-values.initial.opacity)<.001)}
    fs.writeFileSync(path.join(output,'reversal-'+viewport.width+'.json'),JSON.stringify(values,null,2));await waitOpen(page);
    assert.equal(await page.locator('.rf-stage,[data-rf-group]').count(),0);
    const events=await page.evaluate(()=>settingsStudy.motionEvidence);assert.ok(events.some(e=>e.event==='input-acknowledged'&&e.transition==='opacity-only'&&typeof e.duration==='number'&&e.duration<=.12));
    await page.evaluate(()=>{settingsStudy.act('关闭设置');settingsStudy.act('关闭中重新打开')});await waitOpen(page);
    await act(page,'关闭设置');await waitClosed(page);assert.equal(await page.locator('.rf-stage,.dmt-settings-context').count(),0);
   });
   await check(viewport.width+': reduced motion, preference cancellation and hidden-page settlement',async()=>{
    await page.emulateMedia({reducedMotion:'reduce'});await act(page,'打开设置');await waitOpen(page);assert.equal(await page.locator('.rf-stage').count(),0);await act(page,'切换：材质');await waitPage(page,'material');await page.keyboard.press('Escape');await waitClosed(page);
    await page.emulateMedia({reducedMotion:'no-preference'});await act(page,'打开设置');await page.waitForTimeout(180);await page.evaluate(()=>DoLMidnightTheme.setPreference('visualMotion',false));await waitOpen(page);assert.equal(await page.locator('.dmt-workspace-page[inert]').count(),0);await act(page,'关闭设置');await waitClosed(page);
    await page.evaluate(()=>DoLMidnightTheme.setPreference('visualMotion',true));await act(page,'打开设置');await page.waitForTimeout(180);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});await waitOpen(page);await page.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'))});
   });
   await check(viewport.width+': unmount while moving removes owned nodes and remount preserves preference',async()=>{
    const saved=await page.evaluate(()=>settingsStudy.preferences()!.comfortable);await act(page,'切换：入口');await page.evaluate(()=>settingsStudy.destroy());assert.equal(await page.locator('dialog,.rf-stage,.dmt-settings-context').count(),0);
    await page.evaluate(()=>settingsStudy.mount());assert.equal(await page.evaluate(()=>settingsStudy.preferences()!.comfortable),saved);await act(page,'打开设置');await waitOpen(page);await page.keyboard.press('Escape');await waitClosed(page);
   });
   await page.close();
  }
  await check('resize/rotation and 125% page zoom settle usable controls',async()=>{
   page=await browser.newPage({viewport:{width:390,height:844}});watch(page);await page.goto(base+'/scene.html?variant=new');await page.waitForFunction(()=>window.settingsStudy);await act(page,'打开设置');await page.waitForTimeout(220);await page.setViewportSize({width:844,height:390});await waitOpen(page);
   await page.evaluate(()=>{document.body.style.zoom='1.25';window.dispatchEvent(new Event('resize'))});
   for(const selector of ['.dmt-workspace-nav button','.dmt-close']){const rect=await page.locator(selector).first().boundingBox();assert.ok(rect&&Object.values(rect).every(Number.isFinite));await page.locator(selector).first().click()}
   await waitClosed(page);await act(page,'打开设置');await waitOpen(page);
   const zoomed=await page.evaluate(()=>({shell:(()=>{const r=document.querySelector('.dmt-settings-shell')!.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}})(),stageCount:document.querySelectorAll('.rf-stage').length,transform:getComputedStyle(document.querySelector('.dmt-settings-shell')!).transform}));
   assert.equal(zoomed.stageCount,0);assert.equal(zoomed.transform,'none');for(const key of ['x','y','width','height'] as const)assert.ok(Number.isFinite(zoomed.shell[key]),'125% shell geometry: '+key);
   await page.keyboard.press('Escape');await waitClosed(page);await page.close();
  });
  const recordings=[];
  if(record)for(const [name,viewport]of ([['desktop',{width:1280,height:900}],['narrow',{width:390,height:844}]] as const)){
   const size={width:viewport.width*2+70,height:viewport.height+400};
   const context=await browser.newContext({viewport:size,deviceScaleFactor:1,recordVideo:{dir:path.join(output,'raw-'+name),size}});page=await context.newPage();watch(page);
   await page.goto(base+'/');await page.selectOption('#viewport',viewport.width+','+viewport.height);await page.getByRole('button',{name:'播放同操作对照',exact:true}).click();
   assert.ok(await page.locator('.screen').evaluateAll(nodes=>nodes.every(node=>node.getBoundingClientRect().bottom<=innerHeight)),'Recording must show the entire comparison viewport');
   await page.waitForFunction(()=>document.getElementById('status')!.textContent.startsWith('对照结束'),{},{timeout:25000});
   const frames=page.frames().filter(frame=>frame.url().includes('scene.html'));
   const data=await Promise.all(frames.map(frame=>frame.evaluate(()=>({variant:settingsStudy.variant,revision:settingsStudy.revision,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,zoom:getComputedStyle(document.body).zoom},preferences:settingsStudy.preferences(),operations:settingsStudy.operations,evidence:settingsStudy.motionEvidence,final:{open:document.querySelector<HTMLDialogElement>('dialog')?.open,sections:document.querySelectorAll('.dmt-workspace-section').length,stage:document.querySelectorAll('.rf-stage').length}}))));
   assert.equal(data.length,2);for(const item of data){assert.deepEqual(item.viewport,{...viewport,dpr:1,zoom:'1'});assert.equal(item.operations.length,12);assert.equal(item.final.open,false);assert.equal(item.final.stage,0)}
   assert.deepEqual(must(data[0]).operations.map(x=>x.action),must(data[1]).operations.map(x=>x.action));
   assert.deepEqual(must(data[0]).preferences,must(data[1]).preferences,'Comparison settings must match');
   const skew=must(data[0]).operations.map((x,i)=>Math.abs(x.wallTime-must(must(data[1]).operations[i]).wallTime));fs.writeFileSync(path.join(output,'recording-inputs-'+name+'.json'),JSON.stringify({data,skew},null,2));assert.ok(Math.max(...skew)<80,'Input delivery skew too large: '+Math.max(...skew));
   const video=must(page.video());await context.close();const source=await video.path(),target=path.join(output,'settings-simple-v2-3-'+name+'-1x.mp4');
   execFileSync('ffmpeg',['-y','-i',source,'-c:v','libx264','-crf','23','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',target],{stdio:'pipe'});
   const probe:unknown=JSON.parse(execFileSync('ffprobe',['-v','quiet','-show_format','-show_streams','-of','json',target],{encoding:'utf8'}));
   assert.ok(recordValue(probe)&&recordValue(probe.format)&&Number(probe.format.duration)>=17.4);recordings.push({name,viewport,video:path.basename(target),sha256:sha(fs.readFileSync(target)),bytes:fs.statSync(target).size,inputSkewMs:Math.max(...skew),duration:Number(probe.format.duration),data});console.log('RECORDED',target);
  }
  assert.deepEqual(errors,[]);
  const verifiedProvenance:unknown=JSON.parse(fs.readFileSync(path.join(root,'provenance.json'),'utf8'));provenance(verifiedProvenance);
  const result={scope:'Playwright Chromium static-build controlled real-settings study; actual OS in runtime; not game, physical-device/WebView or owner visual acceptance',checks,errors,recordings,timingMeasurements,categoryProgress,provenance:verifiedProvenance,runtime:{platform:process.platform,node:process.version,chromium:browser.version()},sourceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),prototypeFiles:Object.fromEntries(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','prototypes/settings-refraction-v1','scripts/prepare-settings-refraction.mjs','scripts/check-settings-refraction.cjs','scripts/check-settings-refraction.cts','vite.settings-refraction.config.ts','tsconfig.settings-refraction.json'],{encoding:'utf8'}).trim().split('\n').filter(Boolean).map(file=>[file,sha(fs.readFileSync(file))]))};
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(result,null,2)+'\n');console.log('RESULT',output);
 }catch(error){if(typeof page!=='undefined'&&!page.isClosed())await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({error:error instanceof Error?error.stack:String(error),checks,errors},null,2));throw error}
 finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{require('./ci-process-receipt.cjs').terminalFailure(error);process.exitCode=1});
