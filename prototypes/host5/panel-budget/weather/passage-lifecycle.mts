import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import type {} from '../../../../framework/contracts';

// Official standalone Twine 2 format. Supply only our four neutral passages.
const zip = process.argv[2];
assert.ok(zip,'Pass the upstream sugarcube-2.37.3-for-twine-2.1-local.zip');
const bytes = readFileSync(zip);
assert.equal(createHash('sha256').update(bytes).digest('hex'),'da00a8c15ec4e88a9e231a3ff6c516c57055f84231bb999f869ed34ade353dab');
const format = execFileSync('python',['-c',"import sys,io,zipfile;sys.stdout.buffer.write(zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())).read('sugarcube-2/format.js'))"],{input:bytes,encoding:'utf8'});
const prefix='window.storyFormat(';
assert.ok(format.startsWith(prefix) && format.trimEnd().endsWith(');'));
const {source,version}=JSON.parse(format.trimEnd().slice(prefix.length,-2)) as {source:string;version:string};
assert.equal(version,'2.37.3');
const story = `<tw-storydata name="Neutral weather" startnode="1" format="SugarCube" format-version="2.37.3" ifid="8570F7F3-E233-4569-B20E-59D0361CFCC2" hidden>
<script role="script" type="text/twine-javascript" id="twine-user-script">$(document).on(':passagedisplay.fixture',function(){const p=document.querySelector('#passages > .passage:last-child');if(p?.querySelector('.dgp-host'))p.classList.add('dgp-overlay')});</script>
<tw-passagedata pid="1" name="Start">[[Page A]]</tw-passagedata>
<tw-passagedata pid="2" name="Page A">&lt;header class="dgp-host"&gt;A&lt;/header&gt;[[Page B]]</tw-passagedata>
<tw-passagedata pid="3" name="Page B">&lt;header class="dgp-host"&gt;B&lt;/header&gt;[[End]]</tw-passagedata>
<tw-passagedata pid="4" name="End">Done.</tw-passagedata></tw-storydata>`;
const html=source.replaceAll('{{STORY_NAME}}','Neutral weather').replace('{{STORY_DATA}}',()=>story);
const browser=await chromium.launch({channel:'chrome'});
try {
 const page=await browser.newPage({viewport:{width:1000,height:800},reducedMotion:'no-preference'});
 page.setDefaultTimeout(6000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url()==='http://127.0.0.1/neutral' ? r.fulfill({contentType:'text/html',body:html}) : r.abort());
 await page.goto('http://127.0.0.1/neutral');
 await page.getByRole('link',{name:'Page A'}).waitFor();
 const probe=await page.evaluateHandle(()=>{
  const sc=(window as Window & {SugarCube?:{State:{passage:string};version:{toString():string}}}).SugarCube!;
  const events:string[]=[];
  const jq=(window as Window & {jQuery?:(d:Document)=>{on(events:string,fn:(e:{type:string})=>void):void}}).jQuery!;
  jq(document).on(':passageinit.probe :passagestart.probe :passagerender.probe :passagedisplay.probe :passageend.probe',e=>events.push(e.type));
  let kind='rain', time=1000, reads=0;
  const win:Window=window, pending=new Set<number>();
  const schedule=win.setTimeout.bind(win),cancel=win.clearTimeout.bind(win);
  win.setTimeout=(callback,delay,...args)=>{
   if(delay!==500||typeof callback!=='function')return schedule(callback,delay,...args);
   const id=schedule(()=>{pending.delete(id);Reflect.apply(callback,win,args)},delay);
   pending.add(id);return id;
  };
  win.clearTimeout=id=>{if(id!==undefined)pending.delete(id);cancel(id)};
  Object.assign(window,{Weather:{get name(){reads++;return kind},get precipitation(){return kind},dayState:'day'}});
  // Pin only the JS-visible weather sampling time. SugarCube navigation, DOM,
  // WAAPI, timer dispatch and animation frames still run in Chrome.
  Object.defineProperty(document.timeline,'currentTime',{configurable:true,get:()=>time});
  const rims=new WeakMap<CanvasGradient,number>(),first=new WeakMap<HTMLCanvasElement,{alpha:number;pixels:boolean}>();
  const color=CanvasGradient.prototype.addColorStop,stroke=CanvasRenderingContext2D.prototype.stroke;
  CanvasGradient.prototype.addColorStop=function(offset,value){
   const prefix='rgba(184,209,214,';
   if(offset===0&&value.startsWith(prefix))rims.set(this,Number(value.slice(prefix.length,-1)));
   return color.call(this,offset,value);
  };
  CanvasRenderingContext2D.prototype.stroke=function(...args:[]|[Path2D]){
   Reflect.apply(stroke,this,args);
   const alpha=this.strokeStyle instanceof CanvasGradient?rims.get(this.strokeStyle):undefined;
   if(alpha===undefined||first.has(this.canvas)||!this.canvas.matches('.sf-weather-canvas'))return;
   first.set(this.canvas,{alpha,pixels:this.getImageData(0,0,this.canvas.width,4).data.some((v,i)=>i%4===3&&v>0)});
  };
  let old:HTMLCanvasElement, binding:ReturnType<NonNullable<Window['DoLUiHost']>['binding']>,retiredDraws=0;
  const canvas=()=>document.querySelector<HTMLCanvasElement>('#passages .sf-weather-canvas')!;
  let previousPolls:number[]=[];
  return {
   snow(){kind='snow'},
   midpoint(){
    time+=225;old=canvas();binding=window.DoLUiHost!.binding();events.length=0;
    previousPolls=[...pending];
    const ctx=old.getContext('2d')!,clear=ctx.clearRect;
    ctx.clearRect=function(...args){if(!old.isConnected)retiredDraws++;return clear.apply(this,args)};
    return binding.generation;
   },
   after(){return {events:[...events],passage:sc.State.passage,version:String(sc.version),oldDetached:!old.isConnected,
    invalidated:binding.signal.aborted,newCurrent:window.DoLUiHost!.binding().isCurrent(),generation:window.DoLUiHost!.binding().generation,
    pollsA:previousPolls.length,pollsB:pending.size,retainedPolls:previousPolls.filter(id=>pending.has(id)).length,first:first.get(canvas())}},
   counts(){return {reads,retiredDraws,polls:pending.size}}
  };
 });
 await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
 await page.addScriptTag({path:'dist/framework/host/index.js'});
 await page.addScriptTag({path:'dist/framework/official-ui/index.js'});
 await page.locator('#dol-midnight-sidebar-button').waitFor({state:'attached'});
 const cdp=await page.context().newCDPSession(page);
 async function inspect(expression:string){
  const r=await cdp.send('Runtime.evaluate',{expression,includeCommandLineAPI:true,returnByValue:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;
 }
 const listeners='[...(getEventListeners(window).resize||[]),...(getEventListeners(document).visibilitychange||[])].map(e=>e.listener)';
 await inspect('window.__baseListeners=new Set('+listeners+');true');
 await page.getByRole('link',{name:'Page A'}).click();
 const current=page.locator('#passages .passage:not(.passage-out) .sf-weather-canvas');
 await current.waitFor();
 const added=await inspect('window.__pageAListeners='+listeners+'.filter(f=>!__baseListeners.has(f));__pageAListeners.length');
 assert.ok(added>=2,'Page A must add observable weather listeners');
 await probe.evaluate(p=>p.snow());
 await page.waitForFunction(()=>document.querySelector('#passages canvas')?.getAttribute('data-weather')==='snow');
 const oldGeneration=await probe.evaluate(p=>p.midpoint());
 await page.getByRole('link',{name:'Page B'}).click();
 await page.locator('.passage[data-passage="Page B"] canvas[data-weather="snow"]').waitFor();
 const result=await probe.evaluate(p=>p.after());
 assert.deepEqual(result.events,[':passageinit',':passagestart',':passagerender',':passagedisplay',':passageend']);
 assert.ok(result.oldDetached&&result.invalidated&&result.newCurrent&&result.generation===oldGeneration+1);
 assert.deepEqual([result.pollsA,result.pollsB,result.retainedPolls],[1,1,0]);
 const stale=await inspect(listeners+'.filter(f=>__pageAListeners.includes(f)).length');
 assert.equal(stale,0,'old resize/visibility handlers still registered');
 await page.getByRole('link',{name:'End'}).click(); await current.waitFor({state:'detached'});
 assert.equal(await inspect(listeners+'.filter(f=>!__baseListeners.has(f)).length'),0);
 const before=await probe.evaluate(p=>p.counts());
 await page.waitForTimeout(1150); // span two formerly active 500 ms polling intervals
 const after=await probe.evaluate(p=>p.counts());
 assert.deepEqual(after,before);assert.equal(after.retiredDraws,0);assert.equal(after.polls,0);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({browser:browser.version(),result,oldGeneration,added,stale,idle:after.reads-before.reads,retiredDraws:after.retiredDraws}));
 assert.ok(result.first?.pixels&&Math.abs(result.first.alpha-.234)<1e-6,'remounted canvas must first paint the 50/50 rain/snow rim');
} finally {await browser.close()}
