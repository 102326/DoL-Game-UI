// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"entry"}
// Controlled rain-level / snow research. Visual acceptance remains with the owner.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),cp=require('node:child_process'),crypto=require('node:crypto');
const {chromium}=require('playwright'),baseline=process.argv.includes('--baseline'),record=process.argv.includes('--record'),dist=path.resolve('tests/artifacts/evolution/weather-dist'),out=path.resolve('tests/artifacts/evolution/weather-r6-'+(baseline?'baseline-':'')+Date.now());fs.mkdirSync(out,{recursive:true});
const query='candidate=glass&background=day&trail=natural&runoff=1&'+(baseline?'climate-controls=1':'climate=1');
const server=http.createServer((q,r)=>{const name=new URL(q.url,'http://local').pathname,f=path.resolve(dist,'.'+(name==='/'?'/index.html':name));if(!f.startsWith(dist+path.sep)||!fs.existsSync(f)){r.writeHead(404);return r.end()}r.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');fs.createReadStream(f).pipe(r)});
(async()=>{let browser,context,page;const results=[],events=[];try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;browser=await chromium.launch(require('./browser-options.cjs'));
 context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1,recordVideo:record?{dir:path.join(out,'raw'),size:{width:1280,height:900}}:undefined});page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/?'+query);await page.waitForFunction(()=>window.weatherStudy?.snapshot()?.width>0);
 const reading=await page.locator('.dmt-reading-sample').screenshot(),start=Date.now();
 await page.evaluate(()=>{window.paint=[];window.intervals=[];let last=performance.now();const loop=t=>{intervals.push(t-last);last=t;paint.push(weatherStudy.snapshot().paintMs);window.perfRaf=requestAnimationFrame(loop)};perfRaf=requestAnimationFrame(loop)});
 const at=async(ms,label,action)=>{if(record)await page.waitForTimeout(Math.max(0,start+ms-Date.now()));await action();events.push({label,plannedMs:record?ms:null,actualMs:Date.now()-start})};
 await at(1000,'clear',()=>page.screenshot({path:path.join(out,'climate-clear.png')}));
 for(const [i,level,button,target]of[[0,'light','小雨',.32],[1,'normal','常规雨',.65],[2,'heavy','大雨',1],[3,'severe','强雨',1.5]]){
  await at(2000+i*7000,level+' input',()=>page.getByRole('button',{name:button,exact:true}).click());
  if(!baseline)await page.waitForFunction(t=>Math.abs(weatherStudy.snapshot().intensity-t)<.035&&weatherStudy.snapshot().wet>.84,target);
  await at(8000+i*7000,level+' steady',()=>page.screenshot({path:path.join(out,'climate-'+level+'.png')}));
  const s=await page.evaluate(()=>weatherStudy.snapshot());results.push({level,state:s});assert.equal(s.target.rain,level);assert.equal(s.protectedOverlap,0);assert.deepEqual(await page.locator('.dmt-reading-sample').screenshot(),reading);
 }
 if(!baseline)assert.ok(results.every((r,i)=>i===0||r.state.microVisible>results[i-1].state.microVisible),'actual drawn microdrop counts must distinguish all four rain levels');
 await at(30000,'rain to snow',()=>page.evaluate(()=>{const before=weatherStudy.snapshot();weatherStudy.set('snow');const after=weatherStudy.snapshot();if(before.wet!==after.wet||before.snow!==after.snow)throw Error('weather set must not jump continuous material state')}));
 await page.waitForFunction(()=>weatherStudy.snapshot().snow>.78);
 await at(37000,'snow growing',()=>page.screenshot({path:path.join(out,'climate-snow-transition.png')}));
 await page.waitForFunction(()=>weatherStudy.snapshot().snow>.94&&weatherStudy.snapshot().wet<.03);
 await at(45000,'snow steady',()=>page.screenshot({path:path.join(out,'climate-snow.png')}));
 const snow=await page.evaluate(()=>weatherStudy.snapshot());results.push({level:'snow',state:snow});
 if(!baseline){assert.ok(snow.icePlates>8&&snow.snowflakes>0);assert.equal(snow.protectedOverlap,0);assert.deepEqual(await page.locator('.dmt-reading-sample').screenshot(),reading)}
 if(!record){
  await page.getByRole('button',{name:'静止观察',exact:true}).click();const frozen=await page.evaluate(()=>weatherStudy.snapshot());await page.waitForFunction(()=>!document.querySelector('.dmt-close').getAnimations().some(a=>a.playState==='running'));const snowOn=await page.locator('.dmt-settings-shell').screenshot(),close=await page.locator('.dmt-close').screenshot();
  await page.locator('.evo-weather-canvas').evaluate(n=>n.getContext('2d').clearRect(0,0,n.width,n.height));const snowOff=await page.locator('.dmt-settings-shell').screenshot();assert.notDeepEqual(snowOn,snowOff,'snow material must alter actual composed settings pixels');assert.deepEqual(await page.locator('.dmt-reading-sample').screenshot(),reading);assert.ok((await page.locator('.dmt-close').screenshot()).equals(close),'snow must not change settled close-button pixels');fs.writeFileSync(path.join(out,'snow-pixels-on.png'),snowOn);fs.writeFileSync(path.join(out,'snow-pixels-off.png'),snowOff);
  await page.waitForTimeout(100);assert.equal((await page.evaluate(()=>weatherStudy.snapshot())).time,frozen.time);await page.getByRole('button',{name:'继续动态',exact:true}).click();
 }
 await at(46000,'snow to rain',()=>page.getByRole('button',{name:'大雨',exact:true}).click());await page.waitForFunction(()=>weatherStudy.snapshot().snow<.24&&weatherStudy.snapshot().wet>.8);
 await at(52000,'rain return',()=>page.screenshot({path:path.join(out,'climate-return.png')}));
 const perf=await page.evaluate(()=>{cancelAnimationFrame(perfRaf);const q=(a,p)=>{a=a.slice(2).sort((a,b)=>a-b);return a[Math.floor((a.length-1)*p)]};return{intervalMs:{median:q(intervals,.5),p95:q(intervals,.95)},cpuDrawMs:{median:q(paint,.5),p95:q(paint,.95)}}});
 const video=page.video();if(record){await context.close();context=undefined;cp.execFileSync('ffmpeg',['-y','-i',await video.path(),'-c:v','libx264','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'climate-1x.mp4')],{stdio:'pipe'})}
 else{
  await page.getByRole('button',{name:'直接观雪',exact:true}).click();await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>weatherStudy.snapshot().activeFrames===0);const reduced=await page.evaluate(()=>weatherStudy.snapshot());assert.equal(reduced.snow,1);assert.ok(reduced.icePlates>0);await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal((await page.evaluate(()=>weatherStudy.snapshot())).protectedOverlap,0);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});assert.equal((await page.evaluate(()=>weatherStudy.snapshot())).activeFrames,0);assert.equal((await page.evaluate(()=>weatherStudy.snapshot())).activePolls,0);await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));weatherStudy.close()});await page.waitForFunction(()=>weatherStudy.snapshot().disposed);assert.equal(await page.locator('.evo-material-layer').count(),0);await page.evaluate(()=>weatherStudy.reopen());await page.waitForFunction(()=>!weatherStudy.snapshot().disposed);assert.equal(await page.locator('.evo-material-layer').count(),1);await context.close();context=undefined;
 }
 assert.deepEqual(errors,[]);
 if(record){
 // Material close-up is a separate, unrecorded view; it cannot stand in for real settings readability.
 context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1});page=await context.newPage();await page.goto(base+'/glass-optics.html?trail=natural&runoff=1&'+(baseline?'climate-controls=1':'climate=1'));await page.getByRole('button',{name:'雪天',exact:true}).click();await page.waitForFunction(()=>rainOptics.snapshot().snow>.95);await page.getByRole('button',{name:'静止观察',exact:true}).click();for(const [name,label]of[['day','日光'],['night','夜灯']]){await page.getByRole('button',{name:label,exact:true}).click();await page.screenshot({path:path.join(out,'climate-material-'+name+'.png')})}
 }
 const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','src/ui/weather','prototypes/evolution-weather','tests/evolution-weather-levels.cjs','tests/evolution-rain-model.test.cjs','vite.evolution-weather.config.ts'],{encoding:'utf8'}).trim().split('\n');
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({scope:'R6 controlled rain intensity and snow. Record retains 1x waiting and operations; smoke uses state predicates. Not owner visual acceptance or physical-device evidence.',baseline,record,runtime:{node:process.version,platform:process.platform,chromium:browser.version()},viewport:{width:1280,height:900,dpr:1},events,results,perf,errors,hashes:Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))},null,2));console.log('PASS',baseline?'C3 baseline':'C4 rain/snow',JSON.stringify(perf),'Evidence',out);
 }catch(e){try{await page?.screenshot({path:path.join(out,'failure.png')})}catch{}fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:e.stack,events,results},null,2));throw e}finally{await context?.close();await browser?.close();await new Promise(r=>server.close(r))}
})().catch(e=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(e);process.exitCode=1});
