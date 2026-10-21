// Run against the actual static build. Evidence/recording stays first-party and local.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve('tests/artifacts/settings-refraction-v1'),dist=path.join(root,'dist');
const sha=b=>createHash('sha256').update(b).digest('hex');
const output=path.join(root,'review-'+Date.now());fs.mkdirSync(output,{recursive:true});
const record=process.argv.includes('--record'),checks=[],errors=[],timingMeasurements={},categoryProgress={};
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{const file=path.resolve(dist,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(dist+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
const browserOptions=require('../tests/browser-options.cjs');
async function check(name,fn){await fn();checks.push(name);console.log('PASS',name)}
const act=(page,action)=>page.evaluate(action=>window.settingsStudy.act(action),action);
const waitOpen=page=>page.waitForFunction(()=>document.querySelector('dialog')?.dataset.rfState==='open');
const waitClosed=page=>page.waitForFunction(()=>!document.querySelector('dialog')?.open);
const waitPage=(page,id)=>page.waitForFunction(id=>{const d=document.querySelector('dialog'),nodes=[...document.querySelectorAll('.dmt-workspace-section')];return !d?.hasAttribute('data-workspace-transition')&&nodes.length===1&&nodes[0].getAttribute('aria-labelledby')==='dmt-'+id+'-heading'&&!nodes[0].hasAttribute('inert')},id);
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({...browserOptions,args:[...(browserOptions.args||[]),'--site-per-process']});let page;
 const watch=page=>{page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())})};
 try{
  await check('frozen baseline source identity; only two generated candidate source files differ',async()=>{
   const manifest=JSON.parse(fs.readFileSync(path.join(root,'provenance.json')));assert.equal(manifest.refs.old,'915dcb9e85f3266a73a3e7ce38d769edd0c29ff4');
   for(const variant of ['old','new'])for(const [name,digest]of Object.entries(manifest.files[variant])){
    const actual=sha(fs.readFileSync(path.join(root,variant,name)));
    const expected=variant==='new'&&name==='src/theme/controller.ts'?manifest.patched.controller:variant==='new'&&name==='src/theme/SettingsPanel.vue'?manifest.patched.panel:digest;
    assert.equal(actual,expected,variant+': '+name);
   }
  });
  await check('V2.2 open, close and category settlement stay near the actual 3.0.4 baseline',async()=>{
   for(const variant of ['old','new']){
    page=await browser.newPage({viewport:{width:1280,height:900}});watch(page);await page.goto(base+'/scene.html?variant='+variant);await page.waitForFunction(()=>window.settingsStudy);
    timingMeasurements[variant]=await page.evaluate(async variant=>{
     const measure=async(action,ready)=>{const start=performance.now();settingsStudy.act(action);await new Promise((resolve,reject)=>{const tick=()=>{if(ready())resolve();else if(performance.now()-start>3000)reject(Error('Settlement timeout: '+action));else requestAnimationFrame(tick)};requestAnimationFrame(tick)});return performance.now()-start};
     const opened=()=>variant==='new'?document.querySelector('dialog')?.dataset.rfState==='open':!document.querySelector('.dmt-open-material')&&document.querySelector('dialog')?.open&&document.querySelector('.dmt-settings-shell').getAnimations().every(a=>a.playState!=='running');
     const open=await measure('打开设置',opened);
     const category=await measure('切换：材质',()=>!document.querySelector('dialog').hasAttribute('data-workspace-transition')&&document.querySelectorAll('.dmt-workspace-section').length===1&&!!document.getElementById('dmt-material-heading'));
     const close=await measure('关闭设置',()=>!document.querySelector('dialog')?.open);
     return {open,category,close};
    },variant);await page.close();
   }
   for(const action of ['open','close','category'])assert.ok(timingMeasurements.new[action]>100&&timingMeasurements.new[action]<=timingMeasurements.old[action]+180,action+' is not near baseline: '+JSON.stringify(timingMeasurements));
   console.log('TIMING',JSON.stringify(timingMeasurements));
  });
  await check('category readable progress matches the old release, not only its final duration',async()=>{
   for(const variant of ['old','new']){
    page=await browser.newPage({viewport:{width:1280,height:900}});watch(page);await page.goto(base+'/scene.html?variant='+variant);await page.waitForFunction(()=>window.settingsStudy);await act(page,'打开设置');
    if(variant==='new')await waitOpen(page);else await page.waitForFunction(()=>!document.querySelector('.dmt-open-material')&&document.querySelector('dialog')?.open&&document.querySelector('.dmt-settings-shell').getAnimations().every(a=>a.playState!=='running'));
    await act(page,'切换：材质');
    await page.waitForFunction(()=>document.querySelector('[aria-labelledby="dmt-material-heading"]')?.getAnimations().some(a=>a.effect?.getTiming().duration===620));
    categoryProgress[variant]=await page.evaluate(()=>{
     const node=document.querySelector('[aria-labelledby="dmt-material-heading"]'),animation=node.getAnimations().find(a=>a.effect.getTiming().duration===620),samples=[];
     // Seek both actual browser effects to the same animation time. Comparing
     // independent 160ms sleeps can sample different frames under layout load.
     animation.pause();
     for(const target of [160,300]){
      animation.currentTime=target;const style=getComputedStyle(node);
      const inset=style.clipPath.match(/^inset\((.*?)(?: round |\))/)?.[1].trim().split(/\s+/).map(parseFloat)??[0];
      const right=inset[1]??inset[0],left=inset[3]??right;
      samples.push({animationTime:target,opacity:Number(style.opacity),clipPath:style.clipPath,easing:animation.effect.getTiming().easing,transform:style.transform,readableFraction:Number(style.opacity)*Math.max(0,1-(left+right)/100)});
     }return samples;
    });await page.close();
   }
   fs.writeFileSync(path.join(output,'category-progress.json'),JSON.stringify(categoryProgress,null,2));
   for(let i=0;i<2;i++)assert.ok(categoryProgress.new[i].readableFraction>=categoryProgress.old[i].readableFraction-.10,'New category still reveals substantially later than old: '+JSON.stringify(categoryProgress));
  });
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
   page=await browser.newPage({viewport,deviceScaleFactor:1});watch(page);await page.goto(base+'/scene.html?variant=new');await page.waitForFunction(()=>window.settingsStudy);
   await check(viewport.width+': real modal, geometry, hit testing, actual preference input and keyboard close',async()=>{
    await page.evaluate(()=>document.getElementById('dol-midnight-sidebar-button').addEventListener('click',()=>{window.__studyInitiallyInert=document.querySelector('.dmt-workspace-page').hasAttribute('inert')},{once:true}));
    await page.getByRole('button',{name:'界面设置',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__studyInitiallyInert),true,'Clipped content must remain inert until the reveal completes');await waitOpen(page);
    const geometry=await page.evaluate(()=>{
     const shell=document.querySelector('.dmt-settings-shell'),r=shell.getBoundingClientRect();return {modal:document.querySelector('dialog').matches(':modal'),rect:r.toJSON(),width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,hit:[...document.querySelectorAll('.dmt-workspace-nav button,.dmt-close')].map(n=>{const b=n.getBoundingClientRect();return n.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))}),decorative:[...document.querySelectorAll('.rf-stage,.rf-stage *')].every(n=>getComputedStyle(n).pointerEvents==='none')};
    });
    assert.ok(geometry.modal&&geometry.decorative&&geometry.hit.every(Boolean));assert.ok(geometry.rect.x>=0&&geometry.rect.right<=geometry.width+1);assert.ok(geometry.rect.y>=0&&geometry.rect.bottom<=geometry.height+1);assert.ok(geometry.scrollWidth<=geometry.width+1);assert.ok(Object.values(geometry.rect).every(Number.isFinite));
    fs.writeFileSync(path.join(output,'geometry-'+viewport.width+'.json'),JSON.stringify(geometry,null,2));
    const before=await page.evaluate(()=>settingsStudy.preferences().comfortable);await page.getByLabel('舒适阅读间距',{exact:true}).click();assert.equal(await page.evaluate(()=>settingsStudy.preferences().comfortable),!before);
    await page.screenshot({path:path.join(output,'candidate-'+viewport.width+'.png')});await page.keyboard.press('Escape');await waitClosed(page);assert.equal(await page.evaluate(()=>document.activeElement?.id),'dol-midnight-sidebar-button');
   });
   await check(viewport.width+': fast latest-intent category switching settles one accessible page',async()=>{
    await act(page,'打开设置');await waitOpen(page);
    for(const category of ['材质','入口','页面','高级','阅读']){await act(page,'切换：'+category);await page.waitForTimeout(70)}
    await waitPage(page,'reading');assert.equal(await page.locator('.dmt-workspace-section[aria-hidden=true]').count(),0);assert.equal(await page.locator('.dmt-workspace-page[inert]').count(),0);
   });
   await check(viewport.width+': close during unfolding and reverse from current geometry without restart',async()=>{
    await act(page,'关闭设置');await waitClosed(page);
    // Start the real opening and install the sampler in one browser task; a
    // separate automation round trip may miss its short intermediate window.
    const values=await page.evaluate(()=>new Promise((resolve,reject)=>{const start=performance.now(),observed=[];settingsStudy.act('打开设置');const tick=()=>{const stage=document.querySelector('.rf-stage'),shell=document.querySelector('.dmt-settings-shell');const ratio=stage&&shell?stage.getBoundingClientRect().width/shell.getBoundingClientRect().width:0;observed.push({elapsed:performance.now()-start,ratio});
     // Sample an actually unfolding frame; a fixed sleep can still land at t=0.
     if(ratio>.10&&ratio<.85){const sample=()=>{const matrix=new DOMMatrixReadOnly(getComputedStyle(stage).transform);return [[0,0],[stage.offsetWidth,0],[0,stage.offsetHeight],[stage.offsetWidth,stage.offsetHeight]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(matrix).toJSON())};const initial=sample();settingsStudy.act('展开中关闭');const closed=sample();settingsStudy.act('关闭中重新打开');const reopened=sample();resolve({initial,closed,reopened,ratio})}
     else if(performance.now()-start>3000)reject(Error('No intermediate unfolding frame observed: '+JSON.stringify(observed)));else requestAnimationFrame(tick)};requestAnimationFrame(tick)}));
    // GSAP rate changes can round a CSS matrix by 0.0001px. Check every corner
    // within one browser layout quantum, rather than decimal string spelling.
    for(const [a,b]of [[values.initial,values.closed],[values.closed,values.reopened]])for(let i=0;i<4;i++)for(const axis of ['x','y','z'])assert.ok(Math.abs(a[i][axis]-b[i][axis])<=1/64,'Reversal corner jumped: '+JSON.stringify(values));
    fs.writeFileSync(path.join(output,'reversal-'+viewport.width+'.json'),JSON.stringify(values,null,2));await waitOpen(page);await act(page,'关闭设置');await waitClosed(page);assert.equal(await page.locator('.rf-stage,.dmt-settings-context').count(),0);
   });
   await check(viewport.width+': reduced motion, preference cancellation and hidden-page settlement',async()=>{
    await page.emulateMedia({reducedMotion:'reduce'});await act(page,'打开设置');await waitOpen(page);assert.equal(await page.locator('.rf-stage').count(),0);await act(page,'切换：材质');await waitPage(page,'material');await page.keyboard.press('Escape');await waitClosed(page);
    await page.emulateMedia({reducedMotion:'no-preference'});await act(page,'打开设置');await page.waitForTimeout(180);await page.evaluate(()=>DoLMidnightTheme.setPreference('visualMotion',false));await waitOpen(page);assert.equal(await page.locator('.dmt-workspace-page[inert]').count(),0);await act(page,'关闭设置');await waitClosed(page);
    await page.evaluate(()=>DoLMidnightTheme.setPreference('visualMotion',true));await act(page,'打开设置');await page.waitForTimeout(180);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});await waitOpen(page);await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
   });
   await check(viewport.width+': unmount while moving removes owned nodes and remount preserves preference',async()=>{
    const saved=await page.evaluate(()=>settingsStudy.preferences().comfortable);await act(page,'切换：入口');await page.evaluate(()=>settingsStudy.destroy());assert.equal(await page.locator('dialog,.rf-stage,.dmt-settings-context').count(),0);
    await page.evaluate(()=>settingsStudy.mount());assert.equal(await page.evaluate(()=>settingsStudy.preferences().comfortable),saved);await act(page,'打开设置');await waitOpen(page);await page.keyboard.press('Escape');await waitClosed(page);
   });
   await page.close();
  }
  await check('resize/rotation and 125% page zoom settle usable controls',async()=>{
   page=await browser.newPage({viewport:{width:390,height:844}});watch(page);await page.goto(base+'/scene.html?variant=new');await page.waitForFunction(()=>window.settingsStudy);await act(page,'打开设置');await page.waitForTimeout(220);await page.setViewportSize({width:844,height:390});await waitOpen(page);
   await page.evaluate(()=>{document.body.style.zoom='1.25';window.dispatchEvent(new Event('resize'))});
   for(const selector of ['.dmt-workspace-nav button','.dmt-close']){const rect=await page.locator(selector).first().boundingBox();assert.ok(rect&&Object.values(rect).every(Number.isFinite));await page.locator(selector).first().click()}
   await waitClosed(page);await act(page,'打开设置');await waitOpen(page);
   const zoomed=await page.evaluate(()=>({shell:document.querySelector('.dmt-settings-shell').getBoundingClientRect().toJSON(),stage:document.querySelector('.rf-stage').getBoundingClientRect().toJSON()}));
   for(const key of ['x','y','width','height'])assert.ok(Number.isFinite(zoomed.stage[key])&&Math.abs(zoomed.shell[key]-zoomed.stage[key])<=3,'125% stage alignment: '+key);
   await page.keyboard.press('Escape');await waitClosed(page);await page.close();
  });
  const recordings=[];
  if(record)for(const [name,viewport]of [['desktop',{width:1280,height:900}],['narrow',{width:390,height:844}]]){
   const size={width:viewport.width*2+70,height:viewport.height+400};
   const context=await browser.newContext({viewport:size,deviceScaleFactor:1,recordVideo:{dir:path.join(output,'raw-'+name),size}});page=await context.newPage();watch(page);
   await page.goto(base+'/');await page.selectOption('#viewport',viewport.width+','+viewport.height);await page.getByRole('button',{name:'播放同操作对照',exact:true}).click();
   assert.ok(await page.locator('.screen').evaluateAll(nodes=>nodes.every(node=>node.getBoundingClientRect().bottom<=innerHeight)),'Recording must show the entire comparison viewport');
   await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('对照结束'),{},{timeout:25000});
   const frames=page.frames().filter(frame=>frame.url().includes('scene.html'));
   const data=await Promise.all(frames.map(frame=>frame.evaluate(()=>({variant:settingsStudy.variant,revision:settingsStudy.revision,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,zoom:getComputedStyle(document.body).zoom},preferences:settingsStudy.preferences(),operations:settingsStudy.operations,evidence:settingsStudy.motionEvidence,final:{open:document.querySelector('dialog')?.open,sections:document.querySelectorAll('.dmt-workspace-section').length,stage:document.querySelectorAll('.rf-stage').length}}))));
   assert.equal(data.length,2);for(const item of data){assert.deepEqual(item.viewport,{...viewport,dpr:1,zoom:'1'});assert.equal(item.operations.length,12);assert.equal(item.final.open,false);assert.equal(item.final.stage,0)}
   assert.deepEqual(data[0].operations.map(x=>x.action),data[1].operations.map(x=>x.action));
   assert.deepEqual(data[0].preferences,data[1].preferences,'Comparison settings must match');
   const skew=data[0].operations.map((x,i)=>Math.abs(x.wallTime-data[1].operations[i].wallTime));fs.writeFileSync(path.join(output,'recording-inputs-'+name+'.json'),JSON.stringify({data,skew},null,2));assert.ok(Math.max(...skew)<80,'Input delivery skew too large: '+Math.max(...skew));
   const video=page.video();await context.close();const source=await video.path(),target=path.join(output,'settings-refraction-v2-response-'+name+'-1x.mp4');
   execFileSync('ffmpeg',['-y','-i',source,'-c:v','libx264','-crf','23','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',target],{stdio:'pipe'});
   const probe=JSON.parse(execFileSync('ffprobe',['-v','quiet','-show_format','-show_streams','-of','json',target],{encoding:'utf8'}));
   assert.ok(Number(probe.format.duration)>=17.4);recordings.push({name,viewport,video:path.basename(target),sha256:sha(fs.readFileSync(target)),bytes:fs.statSync(target).size,inputSkewMs:Math.max(...skew),duration:Number(probe.format.duration),data});console.log('RECORDED',target);
  }
  assert.deepEqual(errors,[]);
  const result={scope:'Playwright Chromium static-build controlled real-settings study; actual OS in runtime; not game, physical-device/WebView or owner visual acceptance',checks,errors,recordings,timingMeasurements,categoryProgress,provenance:JSON.parse(fs.readFileSync(path.join(root,'provenance.json'))),runtime:{platform:process.platform,node:process.version,chromium:browser.version()},sourceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),prototypeFiles:Object.fromEntries(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','prototypes/settings-refraction-v1','scripts/prepare-settings-refraction.mjs','scripts/check-settings-refraction.cjs','vite.settings-refraction.config.ts','tsconfig.settings-refraction.json'],{encoding:'utf8'}).trim().split('\n').filter(Boolean).map(file=>[file,sha(fs.readFileSync(file))]))};
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(result,null,2)+'\n');console.log('RESULT',output);
 }catch(error){if(page&&!page.isClosed())await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({error:error.stack,checks,errors},null,2));throw error}
 finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
