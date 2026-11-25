import playwright = require('playwright');
import esbuild = require('esbuild');
import assert = require('node:assert/strict');
import browserOptions = require('./browser-options.cjs');
declare const Core:typeof import('../framework/host');
declare const Shelf:typeof import('../framework/official-ui/reference-shelf');

async function run(){
 const browser=await playwright.chromium.launch(browserOptions);
 try{
  const page=await browser.newPage();
  await page.setContent('<div id="passages"></div><main id="views"></main>');
  for(const [entry,name] of [['framework/host.ts','Core'],['framework/official-ui/reference-shelf.ts','Shelf']] as const){
   const bundle=esbuild.buildSync({entryPoints:[entry],bundle:true,format:'iife',globalName:name,write:false});
   const code=bundle.outputFiles[0]?.text;
   if(!code)throw Error('Missing reference bundle');
   await page.addScriptTag({content:code});
  }
  const result=await page.evaluate(async()=>{
   const host=Core.createHost(window),owner=host.register('Official'),peer=host.register('OtherLayout');
   const shelf=Shelf.referenceShelf(host,owner);
   shelf.remember({name:'Test coat',slot:'upper',colour:'blue',warmth:null,durability:null,lewd:null,outfit:'',detail:''});
   peer.provideView({id:'peer-view',title:'独立视图',setup(){}});
   const parent=document.querySelector<HTMLElement>('#views')!;
   for(const view of host.views()){
    const mount=view.mount({id:view.id,parent,lifetime:'persistent'});
    if(!mount)throw Error('Reference view refused mount');
    await mount.ready;
   }
   const status=parent.querySelector('[role=status]');
   const current=status?.textContent.includes('来自本场景');
   host.invalidateScene();host.sceneReady();
   const stale=status?.isConnected&&status.textContent.includes('已离开来源场景');
   const clear=parent.querySelector('button');
   if(!clear)throw Error('Missing clear button');
   clear.click();
   const remaining=host.views().map(v=>v.id);
   shelf.dispose();peer.dispose();owner.dispose();
   const cleaned=host.getDiagnostics().mounts.length===0&&host.views().length===0;
   host.dispose();return {current,stale,remaining,cleaned};
  });
  assert.deepEqual(result,{current:true,stale:true,remaining:['peer-view'],cleaned:true});
  console.log('PASS persistent wardrobe snapshot updates across scenes, clears independently and releases');
 }finally{await browser.close()}
}
run().catch(error=>{console.error(error);process.exitCode=1});
