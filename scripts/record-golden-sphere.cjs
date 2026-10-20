const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),assert=require('node:assert/strict');
// Run against the standalone prototype server; never connects to a game or device.
(async()=>{
 const dir=path.resolve('tests/artifacts/golden-spin-b/sphere-showcase-'+Date.now());fs.mkdirSync(dir,{recursive:true});
 const publicDir=path.resolve('docs/media/golden-spin-b');fs.mkdirSync(publicDir,{recursive:true});
 const b=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
 const outputs=[];
 try{
  for(const [name,size]of [['sphere-gs03-desktop',{width:1280,height:960}],['sphere-gs03-narrow',{width:390,height:844}]]){
   const context=await b.newContext({viewport:size,recordVideo:{dir:path.join(dir,name),size},hasTouch:true});
   const p=await context.newPage();await p.goto('http://127.0.0.1:5181/');await p.waitForFunction(()=>window.goldenSphereLab);
   const play=()=>p.getByRole('button',{name:'启动球体回旋',exact:true}).click(),idle=()=>p.waitForFunction(()=>goldenSphereLab.inspect().phase==='idle');
   await p.waitForTimeout(650);await play();
   await p.waitForFunction(()=>goldenSphereLab.inspect().phase==='release'&&goldenSphereLab.inspect().spread>.85);
   assert.ok(await p.evaluate(()=>{const s=goldenSphereLab.inspect();return s.running&&s.draws>20}),'record actual canvas motion, not just phase captions');
   await p.screenshot({path:path.join(publicDir,name+'.png')});await idle();await p.waitForTimeout(550);
   await play();await p.waitForTimeout(1750);await p.getByRole('button',{name:'收束 / 中断',exact:true}).click();await idle();
   await p.waitForTimeout(450);await play();await p.waitForTimeout(850);await play();await idle();await p.waitForTimeout(650);
   const video=p.video();await context.close();const source=await video.path(),output=path.join(publicDir,name+'.mp4');
   execFileSync('ffmpeg',['-y','-i',source,'-c:v','libx264','-crf','20','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',output],{stdio:'pipe'});
   outputs.push({name,source,output,bytes:fs.statSync(output).size});
  }
  fs.writeFileSync(path.join(dir,'recording.json'),JSON.stringify({stage:'ball-only surface motion revision 3',source:'standalone controlled browser; no game footage',outputs},null,2));console.log(JSON.stringify({dir,outputs},null,2));
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
