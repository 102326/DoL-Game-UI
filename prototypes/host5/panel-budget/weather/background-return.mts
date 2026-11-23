import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {accessSync,mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename,dirname,join,resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,type Browser} from 'playwright';
import {neutralWeatherStory} from './neutral-story.mts';
import type {} from '../../../../framework/contracts';

const html=neutralWeatherStory(process.argv[2]);
const exe=process.env.CHROME_PATH||join(process.env.ProgramFiles!, 'Google/Chrome/Application/chrome.exe');
accessSync(exe);
const temp=resolve(tmpdir()),profile=mkdtempSync(join(temp,'sw41-background-'));
// Default Playwright focus emulation keeps inactive pages visible. Connect to
// our own headed Chrome without that override, using its ephemeral loopback port.
const child=spawn(exe,[`--user-data-dir=${profile}`,'--remote-debugging-port=0','--no-first-run',
 '--no-default-browser-check','--disable-background-networking','--disable-features=CalculateNativeWinOcclusion','about:blank'],{stdio:'ignore'});
const exited=once(child,'exit');
let browser:Browser|undefined;
try {
 let port='';
 for(let i=0;i<100&&!port;i++){
  try{port=readFileSync(join(profile,'DevToolsActivePort'),'utf8').split(/\r?\n/)[0]??''}
  catch{await delay(50)}
 }
 assert.match(port,/^\d+$/);
 browser=await chromium.connectOverCDP(`http://127.0.0.1:${port}`,{noDefaults:true});
 const [context]=browser.contexts();assert.ok(context);
 const [page]=context.pages();assert.ok(page);
 const cover=await context.newPage();
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 page.setDefaultTimeout(5000);
 await page.route('**/*',r=>r.request().url()==='http://127.0.0.1/neutral'?r.fulfill({contentType:'text/html',body:html}):r.abort());
 await page.bringToFront();
 await page.goto('http://127.0.0.1/neutral');
 await page.getByRole('link',{name:'Page A'}).waitFor();
 const probe=await page.evaluateHandle(()=>{
  const win:Window=window;
  let kind='rain',start=-1,reads=0,draws=0,firstAfterReturn=false,firstRAF=false,inRAF=false;
  const raf=win.requestAnimationFrame.bind(win);
  win.requestAnimationFrame=cb=>raf(time=>{inRAF=true;try{cb(time)}finally{inRAF=false}});
  const pending=new Set<number>(),schedule=win.setTimeout.bind(win),cancel=win.clearTimeout.bind(win);
  win.setTimeout=(cb,ms,...args)=>{
   if(ms!==500||typeof cb!=='function')return schedule(cb,ms,...args);
   const id=schedule(()=>{pending.delete(id);Reflect.apply(cb,win,args)},ms);
   pending.add(id);return id;
  };
  win.clearTimeout=id=>{if(id!==undefined)pending.delete(id);cancel(id)};
  Object.assign(window,{Weather:{get name(){reads++;if(kind==='snow'&&start<0)start=Number(document.timeline.currentTime);return kind},
   get precipitation(){return kind},dayState:'day'}});
  const events:{state:string;trusted:boolean;reads:number;draws:number;at:number}[]=[];
  document.addEventListener('visibilitychange',e=>{
   events.push({state:document.visibilityState,trusted:e.isTrusted,reads,draws,at:performance.now()});
   firstAfterReturn=firstRAF=!document.hidden;
  });
  const rims=new WeakMap<CanvasGradient,number>(),color=CanvasGradient.prototype.addColorStop;
  CanvasGradient.prototype.addColorStop=function(offset,value){
   const prefix='rgba(184,209,214,';
   if(offset===0&&value.startsWith(prefix))rims.set(this,Number(value.slice(prefix.length,-1)));
   return color.call(this,offset,value);
  };
  type Paint={at:number;t:number;alpha:number;pixels:boolean};
  const frames:Paint[]=[],rafFrames:Paint[]=[];
  const stroke=CanvasRenderingContext2D.prototype.stroke,clear=CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.matches('.sf-weather-canvas'))draws++;return clear.apply(this,args)};
  CanvasRenderingContext2D.prototype.stroke=function(...args:[]|[Path2D]){
   Reflect.apply(stroke,this,args);
   if(!(firstAfterReturn||(inRAF&&firstRAF))||!this.canvas.matches('.sf-weather-canvas'))return;
   const alpha=this.strokeStyle instanceof CanvasGradient?rims.get(this.strokeStyle):undefined;
   if(alpha===undefined)return;
   const paint={at:performance.now(),t:Number(document.timeline.currentTime),alpha,
    pixels:this.getImageData(0,0,this.canvas.width,4).data.some((v,i)=>i%4===3&&v>0)};
   if(firstAfterReturn){firstAfterReturn=false;frames.push(paint)}
   if(firstRAF&&inRAF){firstRAF=false;rafFrames.push(paint)}
  };
  let canvas:Element|null,binding:ReturnType<NonNullable<Window['DoLUiHost']>['binding']>;
  return {
   snow(){canvas=document.querySelector('.sf-weather-canvas');binding=window.DoLUiHost!.binding();kind='snow'},
   snapshot(){return {start,reads,draws,polls:pending.size,events,frames,rafFrames,hidden:document.hidden,
    same:!!canvas&&canvas===document.querySelector('.sf-weather-canvas')&&binding.isCurrent()}}
  };
 });
 await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
 await page.addScriptTag({path:'dist/framework/host/index.js'});
 await page.addScriptTag({path:'dist/framework/official-ui/index.js'});
 await page.locator('#dol-midnight-sidebar-button').waitFor({state:'attached'});
 await page.bringToFront();
 await page.waitForFunction(()=>!document.hidden,undefined,{polling:25});
 // Only the subsequent native tab switch is under test. Enter the authored
 // Passage through its link without waiting for unrelated layout animations.
 await page.getByRole('link',{name:'Page A'}).evaluate(link=>(link as HTMLElement).click());
 const canvas=page.locator('.sf-weather-canvas');
 await canvas.waitFor();
 await probe.evaluate(p=>p.snow());
 await page.waitForFunction(()=>document.querySelector('.sf-weather-canvas')?.getAttribute('data-weather')==='snow');
 // Short return discriminates a continuing blend from a jump to all snow.
 // Long return crosses two polling deadlines while Chrome holds the tab hidden.
 const stale:string[]=[];
 for(const [index,wait] of [100,1200].entries()){
  await cover.bringToFront();
  await page.waitForFunction(()=>document.hidden,undefined,{polling:25});
  const hidden=await probe.evaluate(p=>p.snapshot());
  await delay(wait);
  const idle=await probe.evaluate(p=>p.snapshot());
  assert.ok(idle.hidden&&hidden.same&&idle.same);
  assert.deepEqual([hidden.polls,idle.polls,idle.reads-hidden.reads,idle.draws-hidden.draws],[0,0,0,0]);
  await page.bringToFront();
  await page.waitForFunction(({p,n})=>p.snapshot().rafFrames.length>n,{p:probe,n:index});
  const result=await probe.evaluate(p=>p.snapshot());
  const [hide,show]=result.events.slice(-2);
  assert.ok(hide?.trusted&&show?.trusted&&hide.state==='hidden'&&show.state==='visible');
  assert.deepEqual([show.reads-hide.reads,show.draws-hide.draws],[0,0]);
  assert.ok(result.same&&result.polls===1);
  assert.ok(hide.at-result.start>0&&hide.at-result.start<450);
  console.log({chrome:browser.version(),hiddenMs:show.at-hide.at,hidePhaseMs:hide.at-result.start,
   same:result.same,hiddenDraws:show.draws-hide.draws,hiddenReads:show.reads-hide.reads,polls:[idle.polls,result.polls]});
  for(const [stage,paint] of [['first paint',result.frames[index]],['first rAF paint',result.rafFrames[index]]] as const){
   assert.ok(paint?.pixels);
   const phaseMs=paint.t-result.start,wallMs=paint.at-result.start;
   const progress=Math.min(1,Math.max(0,phaseMs/450));
   const expected=.28*(1-progress)*(1-.8*progress)+.3*progress;
   console.log({stage,phaseMs,wallMs,alpha:paint.alpha,expected});
   assert.ok(Math.abs(paint.alpha-expected)<1e-6);
   assert.ok(index===0?wallMs>0&&wallMs<450:wallMs>=450);
   if(Math.abs(Math.min(wallMs,450)-Math.min(phaseMs,450))>=35)stale.push(`${wait}ms: ${stage}`);
  }
 }
 assert.deepEqual(errors,[]);
 assert.deepEqual(stale,[],'weather phase lagged elapsed time on return');
} finally {
 if(browser){
  const session=await browser.newBrowserCDPSession();
  await session.send('Browser.close').catch(()=>{});
 }else child.kill();
 await exited;
 assert.ok(dirname(resolve(profile))===temp&&basename(profile).startsWith('sw41-background-'));
 rmSync(profile,{recursive:true,force:true,maxRetries:3});
}
