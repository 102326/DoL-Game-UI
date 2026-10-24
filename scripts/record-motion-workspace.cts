// Self-authored localhost preview only. No game, device or save access.
import playwright = require('playwright');
import fs = require('node:fs');
import path = require('node:path');
import cp = require('node:child_process');
import assert = require('node:assert/strict');
const {chromium}=playwright,{execFileSync}=cp;
import oracles = require('../tests/moody-oracles.cjs');
import browserOptions = require('../tests/browser-options.cjs');
const {waitSettings,waitSettingsClosed}=oracles;
(async()=>{
 const dir=path.resolve('tests/artifacts/golden-spin-b/windows-showcase-'+Date.now()),media=path.resolve('docs/media/golden-spin-b');fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(media,{recursive:true});
 const browser=await chromium.launch(browserOptions),outputs=[];
 try{for(const [name,size]of [['windows-desktop',{width:1280,height:900}],['windows-narrow',{width:390,height:844}]] as const){
  const context=await browser.newContext({viewport:size,recordVideo:{dir:path.join(dir,name),size}}),page=await context.newPage();
  await page.goto('http://127.0.0.1:5181/windows.html');await page.waitForFunction(()=>!!Reflect.get(window,'motionWorkspace'));await page.waitForTimeout(600);
  await page.getByRole('button',{name:'打开真实界面设置',exact:true}).click();await waitSettings(page);await page.waitForTimeout(500);
  await page.screenshot({path:path.join(media,name+'.png')});
  for(const [label,heading]of [['材质','material'],['入口','entry'],['阅读','reading']]){await page.getByRole('button',{name:label,exact:true}).click();await waitSettings(page,'dmt-'+heading+'-heading');await page.waitForTimeout(500)}
  await page.getByRole('button',{name:'材质',exact:true}).click();await page.waitForTimeout(100);await page.getByRole('button',{name:'阅读',exact:true}).click();await waitSettings(page);
  await page.locator('.dmt-close').click();await waitSettingsClosed(page);
  for(const mode of ['center','rise']){await page.selectOption('#window-style',mode);await page.getByRole('button',{name:'打开模拟原生面板',exact:true}).click();await page.waitForTimeout(1000);await page.locator('#native-action').click();await page.waitForTimeout(600);await page.locator('#close-native').click();await page.waitForTimeout(600)}
  await page.getByRole('button',{name:'打开真实界面设置',exact:true}).click();await page.waitForTimeout(150);await page.keyboard.press('Escape');await waitSettingsClosed(page);await page.waitForTimeout(500);
  const video=page.video();assert.ok(video,'configured recording must provide a video');await context.close();const source=await video.path(),output=path.join(media,name+'.mp4');
  execFileSync('ffmpeg',['-y','-i',source,'-c:v','libx264','-crf','23','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',output],{stdio:'pipe'});outputs.push({name,output,bytes:fs.statSync(output).size});
 }fs.writeFileSync(path.join(dir,'recording.json'),JSON.stringify({scope:'standalone real settings; simulated native panel; original-speed recording; visual pending',outputs},null,2));console.log(JSON.stringify(outputs,null,2))}
 finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
