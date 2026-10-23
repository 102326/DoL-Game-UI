// Manual material study. Current settings/W01 and accepted weather stay unchanged.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const out=path.resolve('tests/artifacts/evolution/acrylic-readability-'+Date.now()),media=path.resolve('docs/media/evolution-acrylic-read01');fs.mkdirSync(out,{recursive:true});fs.mkdirSync(media,{recursive:true});
 fs.writeFileSync(path.join(media,'result.json'),JSON.stringify({status:'RUNNING',scope:'Manual study in progress; not accepted evidence'}));fs.rmSync(path.join(media,'manifest.json'),{force:true});
 const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
 const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','src/ui/weather','src/theme','framework/official-ui','scripts/preview-evolution-settings.mjs','scripts/preview-evolution-acrylic.mjs','scripts/check-evolution-acrylic.cjs','tests/evolution-weather-integration.cjs','prototypes/settings-acrylic-v1/readability.css','package-lock.json'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);files.push('dist/framework/official-ui/style.css');const sources=()=>Object.fromEntries(files.map(f=>[f,hash(fs.readFileSync(f))])),before=sources();
 const {createAcrylicPreviewServer}=await import('./preview-evolution-acrylic.mjs'),records=[],errors=[],members=[];
 let status='FAIL',failure,browser,server,context,page,weatherChecks,step='initialize';
 const probe={name:'readability-weather-observation',enforce:'pre',transform(code,id){if(id.split('?')[0].replaceAll('\\','/').endsWith('/framework/official-ui/weather.ts')){assert.ok(code.includes('export function headerWeather('));return code.replace('export function headerWeather(','function actualHeaderWeather(')+'\nexport function headerWeather(){return window.acrylicWeather=actualHeaderWeather()}';}}};
 const snapshot=()=>page.evaluate(()=>acrylicWeather.snapshot().surfaces.find(s=>s.id==='settings')?.state);
 const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const save=async name=>{const pixels=await page.screenshot();fs.writeFileSync(path.join(out,name),pixels);fs.writeFileSync(path.join(media,name),pixels);members.push(name)};
 try{
  browser=await chromium.launch(require('../tests/browser-options.cjs'));
  for(const candidate of [false,true]){
   const mode=candidate?'candidate':'current';server=await createAcrylicPreviewServer(0,candidate,[probe]);
   for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
    const name=mode+'-'+viewport.width;step=name+': setup';context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce'});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/?weather=clear');await page.getByRole('button',{name:'界面设置',exact:true}).click();await page.waitForSelector('.sf-weather-canvas');await settle();
    const state=await page.locator('.dmt-settings-shell').evaluate(n=>({filter:getComputedStyle(n).backdropFilter,background:getComputedStyle(n).backgroundColor,rect:n.getBoundingClientRect().toJSON()}));assert.equal(state.filter,candidate?'blur(24px) saturate(0.9)':'none');
    // A real composited witness: same foreground, only the background title changes.
    step=name+': background witness';const titleVisible=await page.locator('.dmt-settings-shell').screenshot();fs.writeFileSync(path.join(out,name+'-title-visible.png'),titleVisible);await page.locator('#settings-demo h1').evaluate(n=>n.style.visibility='hidden');await settle();const titleHidden=await page.locator('.dmt-settings-shell').screenshot();fs.writeFileSync(path.join(out,name+'-title-hidden.png'),titleHidden);await page.locator('#settings-demo h1').evaluate(n=>n.style.visibility='');await settle();
    const witness=await page.evaluate(async({visible,hidden})=>{
     const decode=async data=>{const image=await createImageBitmap(await(await fetch('data:image/png;base64,'+data)).blob()),canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);image.close();return{width:canvas.width,height:canvas.height,data:ctx.getImageData(0,0,canvas.width,canvas.height).data}};
     const a=await decode(visible),b=await decode(hidden),diff=new Float32Array(a.width*a.height);let energy=0,total=0;
     for(let i=0;i<diff.length;i++){diff[i]=(a.data[i*4]-b.data[i*4])*.2126+(a.data[i*4+1]-b.data[i*4+1])*.7152+(a.data[i*4+2]-b.data[i*4+2])*.0722;total+=Math.abs(diff[i]);}
     for(let y=1;y<a.height;y++)for(let x=1;x<a.width;x++){const i=y*a.width+x;energy+=Math.abs(diff[i]-diff[i-1])+Math.abs(diff[i]-diff[i-a.width]);}
     return{highFrequencyEnergy:energy,absoluteDifference:total};
    },{visible:titleVisible.toString('base64'),hidden:titleHidden.toString('base64')});assert.ok(witness.absoluteDifference>0,'actual background must be present, not hidden for screenshots');
    step=name+': preferences and weather';await save(name+'-clear.png');
    await page.evaluate(()=>DoLMidnightTheme.setPreference('visualGlass',false));await settle();assert.equal(await page.locator('.dmt-settings-shell').evaluate(n=>getComputedStyle(n).backdropFilter),'none');const glassOff=hash(await page.locator('.dmt-settings-shell').screenshot());await page.evaluate(()=>DoLMidnightTheme.setPreference('visualGlass',true));await settle();
    const comfortable=await page.evaluate(()=>DoLMidnightTheme.getPreferences().comfortable);await page.getByLabel('舒适阅读间距',{exact:true}).click();assert.equal(await page.evaluate(()=>DoLMidnightTheme.getPreferences().comfortable),!comfortable);await page.getByLabel('舒适阅读间距',{exact:true}).click();
    for(const kind of ['heavy','snow']){await page.keyboard.press(kind==='snow'?'Alt+3':'Alt+2');await settle();const s=await snapshot();assert.equal(s.protectedOverlap,0);assert.equal(s.target.kind,kind==='heavy'?'rain':'snow');await save(name+'-'+kind+'.png');}
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.locator('.dmt-close').click();await page.waitForFunction(()=>!document.querySelector('.sf-weather-canvas'));await page.getByRole('button',{name:'正文操作',exact:true}).click();assert.match(await page.locator('#native-status').innerText(),/1 次/);
    records.push({mode,viewport:{...viewport,dpr:1},state,witness,glassOff,protectedOverlap:0,nativeAction:'PASS'});await context.close();context=undefined;
   }
   // Two desktop clips use the same operation schedule at original speed.
   step=mode+': original-speed recording';context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1,recordVideo:{dir:path.join(out,mode),size:{width:1280,height:900}}});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/?weather=clear');await page.waitForSelector('#dol-midnight-sidebar-button');const began=Date.now(),events=[];
   const event=async(label,fn)=>{await fn();events.push({label,actualMs:Date.now()-began})};
   await page.waitForTimeout(500);await event('Open settings',()=>page.getByRole('button',{name:'界面设置',exact:true}).click());await page.waitForTimeout(900);await event('Rain',()=>page.keyboard.press('Alt+2'));await page.waitForTimeout(3500);await event('Material category',()=>page.getByRole('button',{name:'材质',exact:true}).click());await page.waitForTimeout(720);await event('Reading category',()=>page.getByRole('button',{name:'阅读',exact:true}).click());await page.waitForTimeout(720);await event('Snow',()=>page.keyboard.press('Alt+3'));await page.waitForTimeout(3500);await event('Reverse toward rain',()=>page.keyboard.press('Alt+2'));await page.waitForTimeout(650);await event('Return to snow',()=>page.keyboard.press('Alt+3'));await page.waitForTimeout(2500);const finalSnow=await snapshot();assert.equal(finalSnow.protectedOverlap,0);assert.ok(finalSnow.snow>.95&&finalSnow.edgeFrostBounds.length>4);
   await event('Close settings',()=>page.locator('.dmt-close').click());await page.waitForFunction(()=>!document.querySelector('.sf-weather-canvas'));await page.waitForTimeout(500);await event('Native action',()=>page.getByRole('button',{name:'正文操作',exact:true}).click());await page.waitForTimeout(500);const video=page.video();await context.close();context=undefined;const file=mode+'-desktop-1x.mp4';cp.execFileSync('ffmpeg',['-y','-i',await video.path(),'-c:v','libx264','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',path.join(media,file)],{stdio:'pipe'});members.push(file);records.push({mode,recording:'1280x900 DPR1 original speed; same schedule, actual event times retained',events,finalSnow:{snow:finalSnow.snow,protectedOverlap:finalSnow.protectedOverlap}});
   await server.close();server=undefined;
  }
  step='paired composition checks';for(const width of [1280,390]){const old=records.find(r=>r.mode==='current'&&r.viewport?.width===width),next=records.find(r=>r.mode==='candidate'&&r.viewport?.width===width);assert.deepEqual(next.state.rect,old.state.rect,'material must not alter layout');assert.equal(next.glassOff,old.glassOff,'glass-off composition must stay identical');assert.ok(next.witness.highFrequencyEnergy<old.witness.highFrequencyEnergy,'candidate must suppress actual background text edges');}
  // Reuse all current W01 health checks with only the research CSS appended.
  const baseNewPage=browser.newPage.bind(browser),wrapped={version:()=>browser.version(),newPage:async(...args)=>{const p=await baseNewPage(...args),add=p.addStyleTag.bind(p);p.addStyleTag=async options=>{const result=await add(options);if(options.path==='dist/framework/official-ui/style.css')await add({path:'prototypes/settings-acrylic-v1/readability.css'});return result};return p}};
  step='candidate: reused W01';weatherChecks=await require('../tests/evolution-weather-integration.cjs').verifyWeatherIntegration(wrapped);assert.equal(weatherChecks.length,9);step='final source and error checks';assert.deepEqual(errors,[]);assert.deepEqual(sources(),before);status='PASS';console.log('PASS acrylic study: two viewports, real background witness, glass-off equivalence, real input/close and existing W01 nine checks');
 }catch(e){
  failure={name:e.name,message:e.message,step};
  if(page&&!page.isClosed()){
   await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
   const state=await page.evaluate(()=>({dialogOpen:document.querySelector('dialog')?.open,filter:document.querySelector('.dmt-settings-shell')?getComputedStyle(document.querySelector('.dmt-settings-shell')).backdropFilter:null,weather:window.acrylicWeather?.snapshot?.()})).catch(()=>({unavailable:true}));fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify({step,state},null,2));
  }else if(e.settingsIntegrationEvidence){
   // W01 closes its page after saving its own failure scene; preserve that exact child directory here.
   const root=path.resolve('tests/artifacts/evolution'),dirs=fs.readdirSync(root).filter(n=>n.startsWith('weather-integration-')).sort((a,b)=>fs.statSync(path.join(root,b)).mtimeMs-fs.statSync(path.join(root,a)).mtimeMs),child=dirs[0];
   if(child){const copy=path.join(out,'w01-failure');fs.mkdirSync(copy,{recursive:true});for(const name of ['failure.png','failure.json','result.json']){const f=path.join(root,child,name);if(fs.existsSync(f))fs.copyFileSync(f,path.join(copy,name));}failure.childEvidence=child;}
  }
  throw e;
 }finally{
  const result={status,failure,scope:'Isolated CSS research only; default accepted settings remains unchanged. Background edge metric is not a visual acceptance or GPU/device result.',inputHead:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTree:!!cp.execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),runtime:{platform:process.platform,node:process.version,chromium:browser?.version()??'not-launched'},records,weatherChecks,errors,sources:before};
  const writeResult=()=>{const text=JSON.stringify(result,null,2);fs.writeFileSync(path.join(out,'result.json'),text);fs.writeFileSync(path.join(media,'result.json'),text)};
  try{
   if(status==='PASS'){
    const text=JSON.stringify(result,null,2),files=Object.fromEntries(members.map(f=>[f,{bytes:fs.statSync(path.join(media,f)).size,sha256:hash(fs.readFileSync(path.join(media,f)))}]));files['result.json']={bytes:Buffer.byteLength(text),sha256:hash(text)};
    const manifest=JSON.stringify({scope:result.scope,files},null,2);assert.ok(Object.values(files).reduce((n,f)=>n+f.bytes,Buffer.byteLength(manifest))<=16*1024*1024,'controlled study exceeds16MiB; do not truncate');
    const expected=[...members,'result.json','manifest.json'].sort(),actual=[...new Set([...fs.readdirSync(media),'manifest.json'])].sort();assert.deepEqual(actual,expected,'only controlled study members may be published');writeResult();fs.writeFileSync(path.join(media,'manifest.json'),manifest);console.log('Media',media);
   }else{writeResult();fs.rmSync(path.join(media,'manifest.json'),{force:true});}
  }catch(e){result.status='FAIL';result.failure??={name:e.name,message:e.message};writeResult();fs.rmSync(path.join(media,'manifest.json'),{force:true});throw e;}
  finally{console.log('Evidence',out);await context?.close();await browser?.close();await server?.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
