// Manual visual-layer proof; no expansion of the default CI device matrix.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const out=path.resolve('tests/artifacts/evolution/edge-frost-'+Date.now());fs.mkdirSync(out,{recursive:true});
 const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),files=['src/ui/weather/edge-frost.ts','src/ui/weather/snow-material.ts','src/ui/weather/settings.ts','tests/evolution-edge-frost.cjs','package-lock.json'];
 const sources=()=>Object.fromEntries(files.map(f=>[f,hash(fs.readFileSync(f))])),before=sources();
 const {createSettingsPreviewServer}=await import('../scripts/preview-evolution-settings.mjs'),server=await createSettingsPreviewServer(0),browser=await chromium.launch(require('./browser-options.cjs'));
 let status='FAIL',failure,proof;const errors=[];
 try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/');
  proof=await page.evaluate(async()=>{
   const {featherSnow}=await import('/src/ui/weather/snow-material.ts'),{frostedFeatherSnow}=await import('/src/ui/weather/edge-frost.ts');
   const check=(value,message)=>{if(!value)throw Error(message)},results=[];
   for(const [w,h]of [[360,640],[940,760]])for(const dpr of [1,2])for(const snow of [0,.25,.65,1]){
    const blocked={x:48,y:60,width:w-96,height:h-120};
    const safe=(b,p=5)=>b.x>=1&&b.y>=1&&b.x+b.width<w-1&&b.y+b.height<h-1&&!(b.x<blocked.x+blocked.width+p&&b.x+b.width>blocked.x-p&&b.y<blocked.y+blocked.height+p&&b.y+b.height>blocked.y-p);
    const render=make=>{const c=document.createElement('canvas');c.width=w*dpr;c.height=h*dpr;const ctx=c.getContext('2d');ctx.scale(dpr,dpr);const material=make(ctx,safe);material.draw(snow,3,w,h);return{c,ctx,material,data:ctx.getImageData(0,0,c.width,c.height).data}};
    const base=render(featherSnow),now=render(frostedFeatherSnow),state=now.material.snapshot();let changed=0;
    for(let y=0;y<h*dpr;y++)for(let x=0;x<w*dpr;x++){
     const i=(y*w*dpr+x)*4;if(![0,1,2,3].some(k=>base.data[i+k]!==now.data[i+k]))continue;changed++;
     const px=x/dpr,py=y/dpr;
     check(Math.min(px,py,w-px,h-py)<=45,'frost escaped perimeter');
     check(!(px>=blocked.x&&px<blocked.x+blocked.width&&py>=blocked.y&&py<blocked.y+blocked.height),'frost altered protected pixels');
     check(state.edgeFrostBounds.some(b=>px>=b.x-1&&px<=b.x+b.width+1&&py>=b.y-1&&py<=b.y+b.height+1),'paint missing from evidence geometry');
    }
    check(snow?changed>100:changed===0,'visible frost only during snow');
    check(state.edgeFrostBounds.every(b=>Object.values(b).every(Number.isFinite)&&b.width>0&&b.height>0&&safe(b,5)),'unsafe frost geometry');
    now.ctx.clearRect(0,0,w,h);now.material.draw(0,3,w,h);
    check(now.material.snapshot().edgeFrostBounds.length===0,'clear weather retained frost geometry');
    check(!now.ctx.getImageData(0,0,w*dpr,h*dpr).data.some(Boolean),'clear weather retained frost pixels');
    results.push({w,h,dpr,snow,changedPixels:changed,deposits:state.edgeFrostBounds.length});
   }
   const c=document.createElement('canvas');c.width=940;c.height=760;const ctx=c.getContext('2d');
   const material=frostedFeatherSnow(ctx,()=>false);material.draw(1,3,940,760);
   check(material.snapshot().edgeFrostBounds.length===0&&!ctx.getImageData(0,0,940,760).data.some(Boolean),'fully protected surface must stay clear');
   const timing={};
   for(const [name,make]of [['feather',featherSnow],['frosted',frostedFeatherSnow]]){
    const m=make(ctx,()=>true),samples=[];
    for(let i=0;i<80;i++){ctx.clearRect(0,0,940,760);const start=performance.now();m.draw(1,i/60,940,760);const ms=performance.now()-start;if(i>=10)samples.push(ms)}
    samples.sort((a,b)=>a-b);timing[name]={meanMs:samples.reduce((a,b)=>a+b,0)/samples.length,p95Ms:samples[Math.floor(samples.length*.95)]};
   }
   return{cases:results,fullyProtected:'PASS',timing};
  });
  assert.equal(proof.cases.length,16);assert.deepEqual(errors,[]);assert.deepEqual(sources(),before);status='PASS';console.log('PASS edge frost: 16 raster checks, snow-only perimeter paint, real pixel protection, clearing and bounded geometry');console.log(JSON.stringify(proof.timing));
 }catch(e){failure={name:e.name,message:e.message};throw e}finally{
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status,failure,proof,errors,inputHead:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTree:!!cp.execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),runtime:{node:process.version,platform:process.platform,chromium:browser.version()},sources:before},null,2));console.log('Evidence',out);await browser.close();await server.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
