// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"entry"}
// Controlled built review pages; no game, device or save input.
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
const root=path.resolve('tests/artifacts/evolution/weather-dist');
const server=http.createServer((request,response)=>{
 const file=path.resolve(root,'.'+new URL(request.url??'/','http://localhost').pathname);
 if(!file.startsWith(root+path.sep)||!fs.statSync(file,{throwIfNoEntry:false})?.isFile()){response.writeHead(404);response.end();return;}
 response.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':file.endsWith('.mp4')?'video/mp4':'text/html; charset=utf-8');
 fs.createReadStream(file).pipe(response);
});
async function main(){
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',()=>resolve()));
 const address=server.address();assert.ok(address&&typeof address==='object');
 const base='http://127.0.0.1:'+address.port,browser=await playwright.chromium.launch(browserOptions),checks=[];
 try{
  for(const name of ['climate-review','compare','rain-force-review','rain-review','runoff-review','scatter-review','shower-review','snow-review','trail-review']){
   const page=await browser.newPage(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.goto(base+'/'+name+'.html');
    await page.waitForFunction(()=>{const buttons=[...document.querySelectorAll<HTMLButtonElement>('#play,[data-pair]')];return buttons.length>0&&buttons.every(button=>typeof button.onclick==='function')});
    for(const fail of [false,true]){
     const rows=await page.evaluate(async fail=>{
      const buttons=[...document.querySelectorAll<HTMLButtonElement>('#play,[data-pair]')],results=[];
      for(const button of buttons){
       const videos=[...document.querySelectorAll<HTMLVideoElement>('video')];
       for(const video of videos){video.dataset.pauseCalls='0';video.dataset.playCalls='0';video.currentTime=2;video.playbackRate=2;video.pause=()=>{video.dataset.pauseCalls=String(Number(video.dataset.pauseCalls)+1)};video.play=async()=>{video.dataset.playCalls=String(Number(video.dataset.playCalls)+1);if(fail)throw Error('controlled playback rejection')};}
       button.click();await new Promise<void>(resolve=>setTimeout(resolve,0));
       const selected=videos.filter(video=>Number(video.dataset.playCalls)>0);
       results.push({text:document.querySelector('#status')?.textContent||button.textContent,selected:selected.length,counts:selected.map(video=>({pause:Number(video.dataset.pauseCalls),play:Number(video.dataset.playCalls),time:video.currentTime,rate:video.playbackRate}))});
      }
      return results;
     },fail);
     assert.ok(rows.length>0);
     for(const row of rows){assert.ok(row.selected>=2,name);assert.ok(row.counts.every(value=>value.pause===1&&value.play===1&&value.time===0&&value.rate===1),JSON.stringify(row));assert.match(row.text??'',fail?/请|未能/:/1×|原速|播放中/);}
    }
    assert.deepEqual(errors,[]);checks.push({name,status:'PASS'});
   }finally{await page.close();}
  }
  for(const name of ['optics','glass-optics']){
   const page=await browser.newPage(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.goto(base+'/'+name+'.html?climate=1');
    await page.waitForFunction(()=>typeof document.querySelector<HTMLButtonElement>('#toggle')?.onclick==='function');
    if(name==='glass-optics'){
     await page.getByRole('button',{name:'夜灯',exact:true}).click();assert.equal(await page.locator('#sample').getAttribute('data-background'),'night');
     await page.getByRole('button',{name:'静止观察',exact:true}).click();assert.equal(await page.getByRole('button',{name:'继续动态',exact:true}).count(),1);
     await page.getByRole('button',{name:'关闭背景位移',exact:true}).click();assert.ok(await page.locator('#glass.no-displacement').count()===1);
     await page.getByRole('button',{name:'雪天',exact:true}).click();
     const state=await page.evaluate(async()=>{
      await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
      const value:unknown=Reflect.get(window,'rainOptics');if(!value||typeof value!=='object'||!('snapshot' in value)||typeof value.snapshot!=='function')throw Error('Missing rain optics surface');
      const snapshot:unknown=value.snapshot();if(!snapshot||typeof snapshot!=='object'||!('target' in snapshot)||!snapshot.target||typeof snapshot.target!=='object'||!('kind' in snapshot.target)||typeof snapshot.target.kind!=='string')throw Error('Invalid optics weather snapshot');
      return snapshot.target.kind;
     });assert.equal(state,'snow');
    }else await page.locator('#toggle').click();
    assert.deepEqual(errors,[]);checks.push({name,status:'PASS'});
   }finally{await page.close();}
  }
  console.log(JSON.stringify({status:'PASS',scope:'Built review page scripts, playback success/rejection and optics controls; no visual or physical-device acceptance',checks},null,2));
 }finally{await browser.close();await new Promise<void>(resolve=>server.close(()=>resolve()));}
}
main().catch(error=>{console.error(error);server.close();process.exitCode=1;});
