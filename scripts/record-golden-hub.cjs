const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const inputV2=process.argv.includes('--v2');
// Standalone actual MotionHub, with simulated view contents; never connects to a game or device.
(async()=>{
 const dir=path.resolve('tests/artifacts/golden-spin-b/hub-showcase-'+Date.now());fs.mkdirSync(dir,{recursive:true});
 const publicDir=path.resolve(inputV2?'docs/media/evolution-hub-v2':'docs/media/golden-spin-b');fs.mkdirSync(publicDir,{recursive:true});
 const b=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});const outputs=[];
 try{for(const [name,size]of [[inputV2?'hub-input-v2-desktop':'hub-metal-desktop',{width:1280,height:900}],[inputV2?'hub-input-v2-narrow':'hub-metal-narrow',{width:390,height:844}]]){
  const context=await b.newContext({viewport:size,recordVideo:{dir:path.join(dir,name),size},hasTouch:true});
  const p=await context.newPage();await p.goto('http://127.0.0.1:5181/hub.html');await p.waitForFunction(()=>window.goldenSpinLab?.controller);
  const ball=p.locator('.sf-motion-ball'),open=()=>p.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='open'),closed=()=>p.waitForFunction(()=>goldenSpinLab.controller.inspect().phase==='closed');
  await p.waitForTimeout(650);await ball.click();await open();await p.screenshot({path:path.join(publicDir,name+'.png')});await p.waitForTimeout(2400);
  if(inputV2){
   await ball.click();await closed();await p.waitForTimeout(600);
   await ball.click();await p.waitForFunction(()=>{const s=goldenSpinLab.controller.inspect();return s.moving&&s.q>.7&&s.q<.96});
   const tool=p.locator('[data-motion-view$="interface-settings"]'),r=await tool.boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.waitForTimeout(650);await p.screenshot({path:path.join(publicDir,name+'-input.png')});await p.mouse.up();await closed();await p.waitForTimeout(700);
   await p.getByRole('button',{name:'返回工具',exact:true}).click();await p.waitForFunction(()=>{const s=goldenSpinLab.controller.inspect();return s.moving&&s.q>.72});await ball.focus();for(let i=0;i<10;i++){await p.keyboard.press('Shift+Tab');if(await tool.evaluate(n=>n===document.activeElement))break}await p.waitForTimeout(450);await tool.press('Enter');await closed();await p.waitForTimeout(700);await p.getByRole('button',{name:'关闭详情',exact:true}).click();
   await ball.click();await p.waitForFunction(()=>{const s=goldenSpinLab.controller.inspect();return s.moving&&s.q>.7});await ball.click();await p.waitForTimeout(160);await ball.click();await open();await p.waitForTimeout(2200);await ball.press('Escape');await closed();
   await ball.press('ArrowLeft');await ball.click();await p.waitForFunction(()=>{const s=goldenSpinLab.controller.inspect();return s.moving&&s.q>.7});
   const b=await ball.boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.mouse.move(3,b.y+70,{steps:8});await p.mouse.up();await closed();await p.waitForTimeout(600);await ball.click();await ball.click();await open();await p.waitForTimeout(2200);await ball.click();await closed();await p.waitForTimeout(600);
  }else{
  await p.locator('[data-motion-view$="interface-settings"]').click();await closed();await p.waitForTimeout(700);
  await p.getByRole('button',{name:'返回工具',exact:true}).click();await open();await p.waitForTimeout(2300);await ball.click();await closed();await p.waitForTimeout(600);
  await ball.click();await p.waitForTimeout(1400);await ball.click();await p.waitForTimeout(160);await ball.click();await open();await p.waitForTimeout(2400);await ball.press('Escape');await closed();
  await ball.press('ArrowLeft');await ball.click();await open();await p.waitForTimeout(2400);await ball.click();await closed();await p.waitForTimeout(600);
  }
  const video=p.video();await context.close();const source=await video.path(),output=path.join(publicDir,name+'.mp4');
  execFileSync('ffmpeg',['-y','-i',source,'-c:v','libx264','-crf','20','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',output],{stdio:'pipe'});
  outputs.push({name,source,output,bytes:fs.statSync(output).size});
 }fs.writeFileSync(path.join(dir,'recording.json'),JSON.stringify({stage:inputV2?'Hub V2 H1-H4; pointer and keyboard input during motion, collection, reversal and drag':'full Hub; iron surface, charge, release, real tools, collection and rapid reversals',source:'standalone real MotionHub; simulated tool contents',outputs},null,2));console.log(JSON.stringify({dir,outputs},null,2))}finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
