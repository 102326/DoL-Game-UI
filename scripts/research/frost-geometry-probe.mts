import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {chromium} from 'playwright';

const out=path.resolve('tests/artifacts/frost-geometry-probe',String(Date.now()));
fs.mkdirSync(out,{recursive:true});
const hash=(data:string|Buffer)=>crypto.createHash('sha256').update(data).digest('hex');
const files=['src/ui/weather/edge-frost.ts','src/ui/weather/snow-material.ts','package-lock.json','scripts/research/frost-geometry-probe.mts'];
const sources=Object.fromEntries(files.map(f=>[f,hash(fs.readFileSync(f))]));
const baselineRef='ce25f59c3fd7d621c11c94b2dd8431676996f78a';
const original=execFileSync('git',['show',`${baselineRef}:src/ui/weather/edge-frost.ts`],{encoding:'utf8'});
const production=fs.readFileSync(files[0]!, 'utf8');
const grain='()=>({x:random()**2,y:random(),size:.35+random()*1.1,angle:random()*Math.PI})';
const replacement='()=>{const x=random()**2,y=random(),size=.35+random()*1.1,angle=random()*Math.PI;return{x,y,size,cos:Math.cos(angle),sin:Math.sin(angle)}}';
const trig='Math.cos(g.angle)*r,dy=Math.sin(g.angle)*r';
if(original.split(grain).length!==2||original.split(trig).length!==2)throw Error('Candidate anchors changed');
const pathMode=process.argv.includes('--path');
const adaptiveMode=process.argv.includes('--adaptive');
const productionMode=process.argv.includes('--production');
const noPath=process.argv.includes('--no-path');
if(Number(pathMode)+Number(adaptiveMode)+Number(productionMode)>1||noPath&&!productionMode)throw Error('Select one candidate; --no-path requires --production');
const loop=`    for(const g of p.grains){
     const x=1+g.x*(depth-2),y=1+g.y*(span-2),r=g.size*(.4+.6*snow);
     const alpha=snow*(1-g.x)*.46;
     ctx.strokeStyle=\`rgba(236,249,255,\${alpha})\`;
     const dx=Math.cos(g.angle)*r,dy=Math.sin(g.angle)*r;
     ctx.beginPath();ctx.moveTo(x-dx,y-dy);ctx.lineTo(x+dx,y+dy);
     ctx.moveTo(x+dy*.65,y-dx*.65);ctx.lineTo(x-dy*.65,y+dx*.65);ctx.stroke();
    }`;
const cached=`    let entry=cache.get(p);
    if(!entry||entry.snow!==snow||entry.depth!==depth||entry.span!==span){
     entry={snow,depth,span,grains:p.grains.map(g=>{
      const x=1+g.x*(depth-2),y=1+g.y*(span-2),r=g.size*(.4+.6*snow);
      const alpha=snow*(1-g.x)*.46;
      const style=\`rgba(236,249,255,\${alpha})\`;
      const dx=Math.cos(g.angle)*r,dy=Math.sin(g.angle)*r;
      const path=new Path2D();path.moveTo(x-dx,y-dy);path.lineTo(x+dx,y+dy);
      path.moveTo(x+dy*.65,y-dx*.65);path.lineTo(x-dy*.65,y+dx*.65);
      return{style,path};
     })};cache.set(p,entry);stats.builds++;stats.paths+=entry.grains.length;
    }else stats.hits++;
    for(const g of entry.grains){ctx.strokeStyle=g.style;ctx.stroke(g.path)} `;
if(original.split(loop).length!==2)throw Error('Path candidate anchor changed');
const pathCandidate=original.replace(' let edgeFrostBounds:Box[]=[];',` const cache=new WeakMap<typeof deposits[number],{snow:number;depth:number;span:number;grains:{style:string;path:Path2D}[]}>();
 const stats={builds:0,hits:0,paths:0};(globalThis as typeof globalThis & {frostPathStats:typeof stats}).frostPathStats=stats;
 let edgeFrostBounds:Box[]=[];`).replace(loop,cached);
const adaptiveCached=`    let entry=cache.get(p);
    if(!entry||entry.snow!==snow||entry.depth!==depth||entry.span!==span){
     entry={snow,depth,span};cache.set(p,entry);
${loop}
    }else{
     if(!entry.grains){
      entry.grains=p.grains.map(g=>{
       const x=1+g.x*(depth-2),y=1+g.y*(span-2),r=g.size*(.4+.6*snow);
       const alpha=snow*(1-g.x)*.46;
       const style=\`rgba(236,249,255,\${alpha})\`;
       const dx=Math.cos(g.angle)*r,dy=Math.sin(g.angle)*r;
       const path=new Path2D();path.moveTo(x-dx,y-dy);path.lineTo(x+dx,y+dy);
       path.moveTo(x+dy*.65,y-dx*.65);path.lineTo(x-dy*.65,y+dx*.65);
       return{style,path};
      });stats.builds++;stats.paths+=entry.grains.length;
     }else stats.hits++;
     for(const g of entry.grains){ctx.strokeStyle=g.style;ctx.stroke(g.path)}
    }`;
const adaptiveCandidate=original.replace(' let edgeFrostBounds:Box[]=[];',` const cache=new WeakMap<typeof deposits[number],{snow:number;depth:number;span:number;grains?:{style:string;path:Path2D}[]}>();
 const stats={builds:0,hits:0,paths:0};(globalThis as typeof globalThis & {frostPathStats:typeof stats}).frostPathStats=stats;
 let edgeFrostBounds:Box[]=[];`).replace(loop,adaptiveCached);
const candidate=productionMode?production:adaptiveMode?adaptiveCandidate:pathMode?pathCandidate:original.replace(grain,replacement).replace(trig,'g.cos*r,dy=g.sin*r');
const result:Record<string,unknown>={status:'FAIL',baselineRef,baselineHash:hash(original),candidate:productionMode?'production':adaptiveMode?'adaptive':pathMode?'path2d':'trigonometry',noPath,command:`node --experimental-strip-types scripts/research/frost-geometry-probe.mts${productionMode?' --production':adaptiveMode?' --adaptive':pathMode?' --path':''}${noPath?' --no-path':''}`,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources,candidateHash:hash(candidate),node:process.version,platform:process.platform,notes:'60 consecutive draws amplify cost and do not represent normal frame frequency; timings measure synchronous JS/Canvas calls, not GPU completion or FPS.'};
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try{
 const bundle=async(source:string,name:string)=>(await build({stdin:{contents:source,resolveDir:path.resolve('src/ui/weather'),sourcefile:'edge-frost.ts',loader:'ts'},bundle:true,write:false,format:'iife',globalName:name,platform:'browser'})).outputFiles[0]!.text;
 const [baseCode,candidateCode]=await Promise.all([bundle(original,'FrostBase'),bundle(candidate,'FrostCandidate')]);
 browser=await chromium.launch({headless:true});result.browser=browser.version();
 const page=await browser.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addScriptTag({content:baseCode});await page.addScriptTag({content:candidateCode});
 if(noPath)await page.evaluate(()=>{(globalThis as unknown as {Path2D:unknown}).Path2D=undefined});
 const proof=await page.evaluate(({pathMode,adaptiveMode,productionMode,noPath}:{pathMode:boolean;adaptiveMode:boolean;productionMode:boolean;noPath:boolean})=>{
  type Box={x:number;y:number;width:number;height:number};
  type Make=(ctx:CanvasRenderingContext2D,safe:(b:Box,p?:number)=>boolean)=>{draw:(snow:number,time:number,w:number,h:number)=>void;snapshot:()=>unknown};
  const globals=globalThis as unknown as {FrostBase:{frostedFeatherSnow:Make};FrostCandidate:{frostedFeatherSnow:Make}};
  const makes=[globals.FrostBase.frostedFeatherSnow,globals.FrostCandidate.frostedFeatherSnow];
  function fixture(w:number,h:number,dpr:number,kind:number,make:Make){
   const canvas=document.createElement('canvas');canvas.width=w*dpr;canvas.height=h*dpr;
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('No 2D context');ctx.scale(dpr,dpr);if(productionMode){ctx.globalAlpha=.6;ctx.globalCompositeOperation='source-over'}
   let blocked:Box=kind===0?{x:48,y:60,width:w-96,height:h-120}:kind===1?{x:0,y:0,width:w,height:h}:{x:w*.7,y:0,width:w*.3,height:h*.4};
   const safe=(b:Box,p=0)=>b.x>=1&&b.y>=1&&b.x+b.width<w-1&&b.y+b.height<h-1&&!(b.x<blocked.x+blocked.width+p&&b.x+b.width>blocked.x-p&&b.y<blocked.y+blocked.height+p&&b.y+b.height>blocked.y-p);
   return{canvas,ctx,material:make(ctx,safe),change:()=>{blocked={x:0,y:h*.65,width:w*.35,height:h*.35}}};
  }
  const cases=[];
  for(const [w,h] of [[360,640],[940,760],[8,8]] as const)for(const dpr of [1,2])for(const snow of [0,.0049,.005,.25,.65,1])for(const protection of [0,1,2]){
   const a=fixture(w,h,dpr,protection,makes[0]!),b=fixture(w,h,dpr,protection,makes[1]!);
   for(let phase=0;phase<2;phase++){
    if(phase){a.change();b.change()}
    for(const x of [a,b]){x.ctx.clearRect(0,0,w,h);x.material.draw(snow,3+phase,w,h)}
    const x=a.ctx.getImageData(0,0,a.canvas.width,a.canvas.height).data,y=b.ctx.getImageData(0,0,b.canvas.width,b.canvas.height).data;
    let unequalBytes=0,maxDifference=0;for(let i=0;i<x.length;i++){const diff=Math.abs(x[i]!-y[i]!);if(diff)unequalBytes++;maxDifference=Math.max(maxDifference,diff)}
    cases.push({w,h,dpr,snow,protection,phase,unequalBytes,maxDifference,snapshotEqual:JSON.stringify(a.material.snapshot())===JSON.stringify(b.material.snapshot())});
   }
  }
  const sequenceCases=[];
  for(const dpr of [1,2]){
   let w=360,h=640,blocked:Box={x:48,y:60,width:264,height:520};
   const fixtures=makes.map(make=>{const canvas=document.createElement('canvas');canvas.width=940*dpr;canvas.height=760*dpr;const ctx=canvas.getContext('2d');if(!ctx)throw Error('No context');ctx.scale(dpr,dpr);if(productionMode){ctx.globalAlpha=.6;ctx.globalCompositeOperation='source-over'}const safe=(b:Box,p=0)=>b.x>=1&&b.y>=1&&b.x+b.width<w-1&&b.y+b.height<h-1&&!(b.x<blocked.x+blocked.width+p&&b.x+b.width>blocked.x-p&&b.y<blocked.y+blocked.height+p&&b.y+b.height>blocked.y-p);return{canvas,ctx,material:make(ctx,safe)}});
   for(const [i,snow] of (adaptiveMode||productionMode?[0,.005,.25,1,.65,0,1].flatMap(snow=>[snow,snow,snow]):[0,.005,.25,1,.65,0,1]).entries()){
    const state=adaptiveMode||productionMode?Math.floor(i/3):i;
    if(productionMode&&i===9){for(const f of fixtures){const nextDpr=dpr===1?2:1;f.canvas.width=940*nextDpr;f.canvas.height=760*nextDpr;f.ctx.scale(nextDpr,nextDpr);f.ctx.globalAlpha=.6;f.ctx.globalCompositeOperation='source-over'}}
    w=state>=3?940:360;h=state>=3?760:640;blocked=state%2?{x:0,y:0,width:w*.25,height:h*.4}:{x:w*.2,y:h*.2,width:w*.6,height:h*.6};
    for(const f of fixtures){f.ctx.clearRect(0,0,940,760);f.material.draw(snow,i/3,w,h)}
    const a=fixtures[0]!,b=fixtures[1]!,x=a.ctx.getImageData(0,0,a.canvas.width,a.canvas.height).data,y=b.ctx.getImageData(0,0,b.canvas.width,b.canvas.height).data;
    let unequalBytes=0,maxDifference=0;for(let k=0;k<x.length;k++){const diff=Math.abs(x[k]!-y[k]!);if(diff)unequalBytes++;maxDifference=Math.max(maxDifference,diff)}
    sequenceCases.push({dpr,currentDpr:productionMode&&i>=9?(dpr===1?2:1):dpr,i,snow,w,h,blocked,unequalBytes,maxDifference,snapshotEqual:JSON.stringify(a.material.snapshot())===JSON.stringify(b.material.snapshot())});
   }
  }
  const samples:{pair:number;order:number[];initializationMs:number[];firstDrawMs:number[];draw60Ms:number[];changing60Ms:number[];pathStats:unknown[];mixed60Ms?:number[];changingBuilds?:number[]}[]=[];
  for(let pair=-2;pair<(noPath?-2:8);pair++){
   const order=pair%2===0?[0,1]:[1,0],initializationMs=[0,0],firstDrawMs=[0,0],draw60Ms=[0,0],changing60Ms=[0,0],pathStats:unknown[]=[null,null],mixed60Ms=[0,0],changingBuilds=[0,0];
   for(const index of order){
    const start=performance.now();const f=fixture(940,760,1,0,makes[index]!);initializationMs[index]=performance.now()-start;
    const firstStart=performance.now();f.material.draw(1,0,940,760);firstDrawMs[index]=performance.now()-firstStart;
    const drawStart=performance.now();for(let frame=0;frame<60;frame++){f.ctx.clearRect(0,0,940,760);f.material.draw(1,frame/60,940,760)}draw60Ms[index]=performance.now()-drawStart;
    const stats=()=>({...((globalThis as unknown as {frostPathStats:Record<string,number>}).frostPathStats)});
    const beforeChanging=index===1&&adaptiveMode?stats().builds!:0;
    const changingStart=performance.now();for(let frame=0;frame<60;frame++){f.ctx.clearRect(0,0,940,760);f.material.draw(.2+.8*(frame%10)/9,frame/60,940,760)}changing60Ms[index]=performance.now()-changingStart;
    if(index===1&&adaptiveMode)changingBuilds[index]=stats().builds!-beforeChanging;
    if(adaptiveMode||productionMode){const mixedStart=performance.now();for(let frame=0;frame<60;frame++){f.ctx.clearRect(0,0,940,760);const phase=frame%20;f.material.draw(phase<10?.8:.2+.6*(phase-10)/10,frame/60,940,760)}mixed60Ms[index]=performance.now()-mixedStart}
    if(index===1&&(pathMode||adaptiveMode))pathStats[index]=stats();
   }
   samples.push({pair,order,initializationMs,firstDrawMs,draw60Ms,changing60Ms,pathStats,...(adaptiveMode?{mixed60Ms,changingBuilds}:productionMode?{mixed60Ms}:{})});
  }
  return{cases,sequenceCases,samples};
 },{pathMode,adaptiveMode,productionMode,noPath});
 result.proof=proof;result.pageErrors=errors;
 if(adaptiveMode&&proof.samples.some(s=>s.changingBuilds?.[1]!==0))throw Error('Continuous change unexpectedly built cached paths');
 if(errors.length||[...proof.cases,...proof.sequenceCases].some(c=>c.unequalBytes||!c.snapshotEqual))throw Error('Pixel, snapshot or page error');
 const after=Object.fromEntries(files.map(f=>[f,hash(fs.readFileSync(f))]));if(JSON.stringify(sources)!==JSON.stringify(after))throw Error('Input changed during run');
 result.status='PASS';
}catch(e){result.failure={name:e instanceof Error?e.name:'Error',message:e instanceof Error?e.message:String(e),stack:e instanceof Error?e.stack:undefined};process.exitCode=1}
finally{if(browser)await browser.close();fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,failure:result.failure,out}));}
