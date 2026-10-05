const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{buildSync}=require('esbuild');
const workspace=path.resolve(__dirname,'../../..');
const bundle=buildSync({stdin:{contents:"export {prepareOutfit} from './src/wardrobe/render';export {snapshot} from './src/wardrobe/data';",resolveDir:path.resolve(__dirname,'..')},bundle:true,write:false,format:'iife',globalName:'PreviewTest'}).outputFiles[0].text;
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=pathname==='/game'?path.join(workspace,'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(workspace,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(workspace+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage();await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
 await p.goto(`http://127.0.0.1:${server.address().port}/game`,{timeout:90000});await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options);await p.waitForLoadState('networkidle');
 await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForLoadState('networkidle');await p.addScriptTag({content:bundle});
 await p.evaluate(()=>{window.previewCalls=0;window.addEventListener('dol-ui-outfit-prepared',event=>{previewCalls++;window.lastPreview=event.detail});const s=PreviewTest.snapshot(window),out=PreviewTest.prepareOutfit(window,s,s.worn,[]);out.model.compile(out.options);if(lastPreview.model!==out.model||lastPreview.options!==out.options||out.model.options!==out.options)throw Error('Private preview event contract mismatch');if(out.model.layers.mouth.srcfn({facestyle:'default',facevariant:'sweet',mouth:'smile'})!=='img/face/default/mouth-smile.png')throw Error('Core includes non-native path')});
 await p.evaluate(()=>{window.originalModUtils=window.modUtils;window.modUtils={getMod:()=>({version:'0.5.11.9-1.0.0a-0815-goose-ucb'})}});
 await p.addScriptTag({content:buildSync({entryPoints:[path.resolve(__dirname,'../compat/lyra-wardrobe-mouth-soft-wet/lyra-wardrobe-mouth.ts')],bundle:true,write:false,format:'iife',target:'es2022'}).outputFiles[0].text});
 const result=await p.evaluate(()=>{try{
  const s=PreviewTest.snapshot(window),state=JSON.stringify(SugarCube.State.variables),snapshotBefore=JSON.stringify(s.variables),live=Renderer.locateModel('main'),liveMouth=live.layers.mouth.srcfn;
  const out=PreviewTest.prepareOutfit(window,s,s.worn,[]);out.model.compile(out.options);
  const options={facestyle:'default',facevariant:'sweet',mouth:'smile'};
  if(out.model.layers.mouth.srcfn(options)!=='img/face/default/sweet/mouth-smile.png')throw Error('Adapter not applied to actual preparation');
  if(out.model===live||live.layers.mouth.srcfn!==liveMouth||state!==JSON.stringify(SugarCube.State.variables)||snapshotBefore!==JSON.stringify(s.variables))throw Error('Live/snapshot ownership changed');
  LyraWardrobeMouthSoftWet.destroy();const restored=PreviewTest.prepareOutfit(window,s,s.worn,[]);restored.model.compile(restored.options);
  if(restored.model.layers.mouth.srcfn(options)!=='img/face/default/mouth-smile.png')throw Error('New preview not restored');
  return {calls:previewCalls,privateModelOnly:true,liveStateUnchanged:true,nativeDefaultRestored:true};
 }finally{window.modUtils=originalModUtils;delete window.originalModUtils}});
 assert.equal(result.calls,3);console.log('PASS actual native prepare/compile, optional mouth adapter and cleanup',result);
 }finally{await b.close();server.close()}})().catch(error=>{console.error(error);server.close();process.exitCode=1});
