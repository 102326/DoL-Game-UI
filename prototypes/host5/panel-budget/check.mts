import assert from 'node:assert/strict';
import {createLabServer} from './server.mts';
import {chromium} from 'playwright';
import {build} from 'esbuild';

const server = await createLabServer();
await server.listen();
const browser = await chromium.launch({channel:process.env.HOST5_BROWSER || undefined});
try {
 const address=server.httpServer!.address(); assert.ok(address && typeof address==='object');
 const origin='http://127.0.0.1:'+address.port, results=[];
 for(const mode of ['independent','legacy','shared']){
  const page=await browser.newPage({viewport:{width:390,height:820},isMobile:true});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/panel-test');
  const result=await page.evaluate(async mode=>{
   // Vite serves these checked-in modules over loopback.
   const load=(url:string)=>import(/* @vite-ignore */ url);
   if(mode!=='legacy')await load('/framework/boot.ts');
   const host=window.DoLUiHost;
   let remove:(()=>void)|undefined;
   if(host){const {attachInspector}=await load('/prototypes/host5/panel-budget/independent.ts');
    remove=attachInspector(host,document.querySelector('#inspector'));}
   const shadow=document.querySelector('#inspector > *')?.shadowRoot;
   const button=shadow?.querySelector('button'), layer=shadow?.querySelector('article');
   function check(ok:unknown,why:string){if(!ok)throw Error(why)}
   if(mode==='independent'){
    // A consumer may await completion after release. Neither the receipt nor its value grants player control.
    const track=host!.panelEffects!.track([{opacity:0},{opacity:1}],100,80);
    const playback=track.to(button!,true);
    check(playback && !(playback instanceof Animation) && !('cancel' in playback),'private player');
    button!.getAnimations()[0]!.currentTime=50;
    const exit=track.to(button!,false)!;
    check(await playback!.finished==='cancelled','superseded open request must not report completion of the subsequent close');
    check(await exit.finished==='finished','new target completes');
    const interrupted=track.to(button!,true)!;
    track.release();
    check(await interrupted.finished==='cancelled','released cycle settles later reads');
    button!.click();
    const opening=layer!.getAnimations()[0];
    check(opening,'independent animates without UI');
    opening!.currentTime=50;
    const midpoint=getComputedStyle(layer!).opacity;
    button!.click();
    check(layer!.getAnimations()[0]===opening && opening!.playbackRate<0,'independent reverses the live track');
    button!.click();
    check(layer!.getAnimations()[0]===opening && opening!.playbackRate>0 &&
     midpoint===getComputedStyle(layer!).opacity && !layer!.hidden,'independent reopens at midpoint');
    remove!();
    check(!layer!.isConnected&&!layer!.getAnimations().length,'dispose during flight');
    check(!host!.getDiagnostics().mounts.length,'host releases mount');host!.dispose();
    return {mode};
   }
   const {startTheme}=await load('/src/theme/controller.ts');startTheme();
   const ui=Reflect.get(window,'DoLMidnightTheme') as {openSettings():void;destroy():void};
   const trigger=document.querySelector<HTMLButtonElement>('#start')!;
   trigger.onclick=()=>ui.openSettings();trigger.focus();trigger.click();
   const dialog=document.querySelector<HTMLDialogElement>('#dol-midnight-controls')!;
   const skin=dialog.querySelector<HTMLElement>('.dmt-settings-shell')!,close=dialog.querySelector<HTMLButtonElement>('.dmt-close')!;
   const first=skin.getAnimations()[0];check(first,'opening animation');first!.currentTime=50;
   const allocations=new Set<Animation>([first!]), started=performance.now();
   for(let i=0;i<12;i++){
    const a=skin.getAnimations()[0]!;a.currentTime=Number(a.effect!.getTiming().duration)/2;
    const before=Number(getComputedStyle(skin).opacity);
    if(i%2===0)close.click();else ui.openSettings();
    const next=skin.getAnimations()[0];check(next,'animation on reversal');allocations.add(next!);
    check(Math.abs(before-Number(getComputedStyle(skin).opacity))<.025,'reversal discontinuity');
   }
   const handlerMs=performance.now()-started;
   const gaps:number[]=[];
   await new Promise<void>(resolve=>{
    let previous:number|undefined;
    function sample(now:number){
     if(previous!==undefined)gaps.push(now-previous);
     previous=now;
     if(gaps.length===24){resolve();return}
     if(gaps.length%2===0)close.click();else ui.openSettings();
     requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
   });
   check(dialog.open&&document.activeElement===close,'settings controls live during reversals');
   const width=dialog.getBoundingClientRect().width;
   if(button){
    button.click();check(!layer!.hidden&&!layer!.getAnimations().length,'budget exhausted: immediate endpoint');
    check(skin.getAnimations().length===1,'first owner retained');remove!();
    check(dialog.getBoundingClientRect().width===width&&skin.getAnimations().length===1,'other owner removal isolated');
   }
   close.click();await new Promise<void>(r=>dialog.addEventListener('close',()=>r(),{once:true}));
   check(document.activeElement===trigger,'focus restoration');ui.destroy();host?.dispose();
   check(!document.getAnimations().length,'all animations released');
   return {mode,allocations:allocations.size,handlerMs,width,frameIntervals:gaps.length,maxFrameMs:Math.max(...gaps),over50:gaps.filter(n=>n>50).length};
  },mode);
  if(mode!=='independent')assert.equal(result.allocations,mode==='shared'?1:13);
  if(mode==='independent'){
   await page.reload();
   await page.evaluate(async()=>{
    const load=(p:string)=>import(/* @vite-ignore */ p);
    await load('/framework/boot.ts');
    const {attachInspector}=await load('/prototypes/host5/panel-budget/independent.ts');
    attachInspector(window.DoLUiHost,document.querySelector('#inspector'));
   });
   const toggle=page.getByRole('button',{name:'Inspector'}),handle=page.getByRole('button',{name:'Move'});
   await toggle.click();
   const box=await handle.boundingBox();assert.ok(box);
   await page.mouse.move(box.x+5,box.y+5);await page.mouse.down();await page.mouse.move(box.x+19,box.y+5);await page.mouse.up();
   assert.ok(await handle.evaluate(n=>n.parentElement!.style.transform.includes('14px')));
   await toggle.evaluate(n=>{if(n instanceof HTMLButtonElement){n.click();n.click()}});
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.waitForFunction(()=>document.querySelector('#inspector > *')?.shadowRoot?.querySelector('article')?.getAnimations().length===0);
   await toggle.click();assert.equal(await handle.isVisible(),false);
   await toggle.click();assert.equal(await handle.isVisible(),true);
   assert.equal(await handle.evaluate(n=>n.parentElement!.getAnimations().length),0);
  }
  const cdp=await page.context().newCDPSession(page);
  const heap=await cdp.send('Runtime.getHeapUsage');
  assert.deepEqual(errors,[]);results.push({...result,usedHeapBytesAtEnd:heap.usedSize});await page.close();
 }
 const preview=await browser.newPage();
 for(const mode of ['old','shared','only']){
  await preview.goto(origin+'/prototypes/host5/panel-budget/?'+mode);
  if(mode==='only'){
   await preview.getByRole('button',{name:'Inspector'}).click();
   await preview.getByRole('button',{name:'Move'}).waitFor();
  }else{
   await preview.locator('#start').click();await preview.getByRole('button',{name:'Close'}).click();
   await preview.locator('dialog').waitFor({state:'hidden'});
  }
 }
 await preview.close();
 const size=async(file:string)=>(await build({entryPoints:[file],bundle:true,minify:true,write:false})).outputFiles[0]!.contents.length;
 console.log(JSON.stringify({browser:browser.version(),results,hostBytes:await size('framework/boot.ts'),standaloneBytes:await size('prototypes/host5/panel-budget/independent.ts')},null,2));
}finally{await browser.close();await server.close()}
