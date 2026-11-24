import assert from 'node:assert/strict';
import {copyFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium,type Page,type BrowserContext} from 'playwright';
import {createServer} from 'vite';

async function renderedFonts(page:Page,selector:string) {
 const session=await page.context().newCDPSession(page);
 try {
  await session.send('DOM.enable');await session.send('CSS.enable');
  const {root}=await session.send('DOM.getDocument');
  const {nodeId}=await session.send('DOM.querySelector',{nodeId:root.nodeId,selector});
  const {fonts}=await session.send('CSS.getPlatformFontsForNode',{nodeId});
  assert.ok(fonts.some(f=>f.glyphCount>0));
  return fonts.filter(f=>f.glyphCount>0);
 } finally {await session.detach()}
}

if(import.meta.main){
 const source=process.argv[2];
 assert.ok(source,'Pass a local Latin .ttf without Chinese glyphs');
 const profile=await mkdtemp(join(tmpdir(),'softwet-ttf-profile-'));
 const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0}});
 let context:BrowserContext|undefined;
 try {
  await server.listen();
  const address=server.httpServer!.address();
  assert.ok(address && typeof address==='object');
  const url='http://127.0.0.1:'+address.port+'/prototypes/host5/theme/sidebar.html';
  async function openMaterial(){
   await context?.close();
   context=await chromium.launchPersistentContext(profile,{channel:'chrome',viewport:{width:1680,height:920}});
   const page=context.pages()[0]!;
   await page.goto(url);
   await page.locator('#dol-midnight-sidebar-button').click();
   await page.getByRole('button',{name:'材质',exact:true}).click();
   return page;
  }
  console.log(await checkLocalTtf(await openMaterial(),openMaterial,source));
 } finally {
  await context?.close();await server.close();
  await rm(profile,{recursive:true,force:true});
 }
}

/** The caller owns the isolated profile and opens the Material tab after each browser restart.
 * Supply a Latin TTF without Chinese glyphs to exercise the existing per-glyph fallback. */
export async function checkLocalTtf(page:Page,restartAtMaterial:()=>Promise<Page>,source:string) {
 const dir=await mkdtemp(join(tmpdir(),'softwet-font-check-'));
 const copy=join(dir,'sample.ttf');
 const sample='.sw-appearance-sample-panel small', title='.dmt-settings-header .dmt-eyebrow';
 const file=()=>page.getByLabel('导入本地 TTF',{exact:true});
 const button=(name:string)=>page.getByRole('button',{name,exact:true});
 const isCustom=async(selector:string)=>(await renderedFonts(page,selector)).some(f=>f.isCustomFont);
 try {
  await copyFile(source,copy);
  const baseline=await renderedFonts(page,title);
  // WebView bubbles the native picker's cancellation from the file input.
  assert.ok(await file().evaluate(input=>{
   input.dispatchEvent(new Event('cancel',{bubbles:true}));
   const dialog=input.closest('dialog');
   return dialog?.open && !dialog.hasAttribute('data-sf-leaving');
  }));
  await file().setInputFiles({name:'invalid.ttf',mimeType:'font/ttf',buffer:Buffer.from('invalid font file')});
  await page.getByText('文件不是支持的 TrueType 字体。',{exact:true}).waitFor();
  assert.ok(await button('应用并保存').isDisabled());
  await file().setInputFiles(copy);
  await page.getByText('待应用 · sample.ttf',{exact:false}).waitFor();
  const preview=await renderedFonts(page,sample);
  assert.ok(preview.some(f=>f.isCustomFont) && preview.some(f=>!f.isCustomFont));
  assert.deepEqual(await renderedFonts(page,title),baseline);
  await button('取消试色').click();
  assert.equal(await isCustom(sample),false);
  await file().setInputFiles(copy);
  await button('应用并保存').click();
  await page.getByText('已应用 · sample.ttf',{exact:false}).waitFor();
  assert.ok(await isCustom(title));
  await rm(copy);
  page=await restartAtMaterial();
  await page.getByText('已应用 · sample.ttf',{exact:false}).waitFor();
  const restored=await renderedFonts(page,title);
  assert.ok(restored.some(f=>f.isCustomFont && preview.some(p=>p.postScriptName===f.postScriptName && p.isCustomFont)));
  await button('恢复默认外观').click();
  await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-sw-custom-font'));
  assert.deepEqual(await renderedFonts(page,title),baseline);
  page=await restartAtMaterial();
  assert.deepEqual(await renderedFonts(page,title),baseline);
  assert.equal(await isCustom(sample),false);
  assert.equal(await page.getByRole('button',{name:'移除导入字体'}).count(),0);
  const saved=await page.evaluate(async()=>{
   const db=await new Promise<IDBDatabase>((res,rej)=>{const req=indexedDB.open('SoftWet.localFont');req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)});
   try{return await new Promise<number>((res,rej)=>{const req=db.transaction('fonts').objectStore('fonts').count();req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)})}
   finally{db.close()}
  });
  assert.equal(saved,0);
  return {preview,restored,default:baseline,savedAfterReset:saved};
 } finally {await rm(dir,{recursive:true,force:true})}
}
