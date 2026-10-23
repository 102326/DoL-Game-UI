// Short controlled observations, deliberately not a GPU/FPS or device acceptance.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const out=path.resolve('tests/artifacts/evolution/acrylic-observation-'+Date.now());fs.mkdirSync(out,{recursive:true});
 const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),reference=JSON.parse(fs.readFileSync('docs/media/evolution-acrylic-read01/result.json'));
 assert.equal(reference.status,'PASS');const sources={...reference.sources,'scripts/measure-evolution-acrylic.cjs':hash('scripts/measure-evolution-acrylic.cjs')};for(const[f,h]of Object.entries(sources))assert.equal(hash(f),h,f);
 const {createAcrylicPreviewServer}=await import('./preview-evolution-acrylic.mjs'),browser=await chromium.launch(require('../tests/browser-options.cjs')),records=[],errors=[];let server,page,status='FAIL',failure;
 const probe={name:'acrylic-short-observation',enforce:'pre',transform(code,id){if(id.split('?')[0].replaceAll('\\','/').endsWith('/framework/official-ui/weather.ts'))return code.replace('export function headerWeather(','function actualHeaderWeather(')+'\nexport function headerWeather(){return window.acrylicWeather=actualHeaderWeather()}';}};
 try{
  for(const candidate of [false,true]){
   server=await createAcrylicPreviewServer(0,candidate,[probe]);
   for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
    page=await browser.newPage({viewport,deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/?weather=clear');await page.getByRole('button',{name:'界面设置',exact:true}).click();
    for(const kind of ['heavy','snow']){
     await page.keyboard.press(kind==='snow'?'Alt+3':'Alt+2');await page.waitForFunction(kind=>{const s=acrylicWeather.snapshot().surfaces.find(s=>s.id==='settings')?.state;return s&&s[kind==='snow'?'snow':'wet']>.99},kind);const observation=await page.evaluate(async()=>{
      const intervals=[],draws=[],started=performance.now();let last,observer;const long=[];
      if(PerformanceObserver.supportedEntryTypes.includes('longtask')){observer=new PerformanceObserver(list=>long.push(...list.getEntries().map(e=>e.duration)));observer.observe({entryTypes:['longtask']});}
      await new Promise(resolve=>{function frame(t){if(last!==undefined)intervals.push(t-last);last=t;draws.push(acrylicWeather.snapshot().surfaces.find(s=>s.id==='settings').state.paintMs);if(t-started<6000)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)});if(observer){long.push(...observer.takeRecords().map(e=>e.duration));observer.disconnect();}
      const quant=(a,q)=>{const v=[...a].sort((a,b)=>a-b);return v[Math.floor((v.length-1)*q)]};const owner=acrylicWeather.snapshot(),s=owner.surfaces.find(s=>s.id==='settings').state;
      return{elapsedMs:performance.now()-started,samples:intervals.length,rafMs:{median:quant(intervals,.5),p95:quant(intervals,.95),max:Math.max(...intervals)},weatherJsMs:{median:quant(draws,.5),p95:quant(draws,.95)},longTasks:observer?{count:long.length,maxMs:long.length?Math.max(...long):0}:null,owner:{polls:owner.activePolls,frames:s.activeFrames,protectedOverlap:s.protectedOverlap}};
     });assert.ok(observation.samples>0);assert.deepEqual(observation.owner,{polls:1,frames:1,protectedOverlap:0});records.push({mode:candidate?'candidate':'current',viewport:{...viewport,dpr:1},weather:kind,...observation});
    }
    await page.locator('.dmt-close').click();await page.waitForFunction(()=>!document.querySelector('.sf-weather-canvas'));assert.equal(await page.evaluate(()=>acrylicWeather.snapshot().activePolls),0);await page.close();page=undefined;
   }await server.close();server=undefined;
  }
  assert.deepEqual(errors,[]);for(const[f,h]of Object.entries(sources))assert.equal(hash(f),h,f);status='PASS';console.log('PASS short observation: 8 cases, 6s each; single weather owner and teardown, no performance threshold claimed');
 }catch(e){failure={name:e.name,message:e.message};if(page&&!page.isClosed())await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e}finally{
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status,failure,scope:'8 controlled observations, 6s each, sequential current/candidate, no video capture; rAF and JS call costs only. GPU completion, heap, physical devices and long-term performance unverified. Other host activity was not controlled.',inputHead:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTree:!!cp.execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),runtime:reference.runtime,records,errors,sources},null,2));console.log('Evidence',out);await page?.close();await browser.close();await server?.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
