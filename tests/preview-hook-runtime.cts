import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import assert = require('node:assert/strict');
import playwright = require('playwright');
import esbuild = require('esbuild');
import type {prepareOutfit} from '../src/wardrobe/render';
import type {snapshot} from '../src/wardrobe/data';
const {chromium}=playwright,{buildSync}=esbuild;
type MouthOptions={facestyle:string;facevariant:string;mouth:string};
declare const PreviewTest:{snapshot:typeof snapshot;prepareOutfit:typeof prepareOutfit},Renderer:{locateModel(name:string):unknown},SugarCube:{State:{variables:{options?:unknown}};Engine:{play(name:string):void}},LyraWardrobeMouthSoftWet:{destroy():void},originalModUtils:unknown;declare let previewCalls:number,lastPreview:{model:unknown;options:unknown};
declare const mouthSource:(model:unknown)=>(options:MouthOptions)=>unknown;
function must<T>(value:T|null|undefined):T{if(value===null||value===undefined)throw Error('Missing preview fixture');return value}
const workspace=path.resolve(__dirname,'../../..');
const bundle=buildSync({stdin:{contents:"export {prepareOutfit} from './src/wardrobe/render';export {snapshot} from './src/wardrobe/data';",resolveDir:path.resolve(__dirname,'..')},bundle:true,write:false,format:'iife',globalName:'PreviewTest'}).outputFiles[0]?.text;if(!bundle)throw Error('Missing preview bundle');
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url??'/','http://localhost').pathname);
 const file=pathname==='/game'?path.join(workspace,'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(workspace,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(workspace+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
(async()=>{await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage(),address=server.address();assert.ok(address&&typeof address!=='string');await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
 await p.goto(`http://127.0.0.1:${address.port}/game`,{timeout:90000});await p.waitForFunction(()=>typeof SugarCube!=='undefined'&&SugarCube.State?.variables?.options);await p.waitForLoadState('networkidle');
 await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForLoadState('networkidle');await p.addScriptTag({content:bundle});
 await p.evaluate(()=>{if(typeof PreviewTest?.snapshot!=='function'||typeof PreviewTest.prepareOutfit!=='function')throw Error('Missing preview API');const isSource=(value:unknown):value is (options:MouthOptions)=>unknown=>typeof value==='function';Object.assign(window,{mouthSource:(model:unknown)=>{if(!model||typeof model!=='object')throw Error('Missing preview model');const layers:unknown=Reflect.get(model,'layers');if(!layers||typeof layers!=='object')throw Error('Missing preview layers');const mouth:unknown=Reflect.get(layers,'mouth');if(!mouth||typeof mouth!=='object')throw Error('Missing preview mouth');const source:unknown=Reflect.get(mouth,'srcfn');if(!isSource(source))throw Error('Missing preview mouth source');return source}});Object.assign(window,{previewCalls:0});window.addEventListener('dol-ui-outfit-prepared',event=>{previewCalls++;if(!(event instanceof CustomEvent))throw Error('Missing preview event detail');Object.assign(window,{lastPreview:event.detail})});const s=PreviewTest.snapshot(window);if(!s)throw Error('Missing wardrobe snapshot');const out=PreviewTest.prepareOutfit(window,s,s.worn,[]);out.model.compile(out.options);if(lastPreview.model!==out.model||lastPreview.options!==out.options||out.model.options!==out.options)throw Error('Private preview event contract mismatch');if(mouthSource(out.model)({facestyle:'default',facevariant:'sweet',mouth:'smile'})!=='img/face/default/mouth-smile.png')throw Error('Core includes non-native path')});
 await p.evaluate(()=>{Object.assign(window,{originalModUtils:Reflect.get(window,'modUtils'),modUtils:{getMod:()=>({version:'0.5.11.9-1.0.0a-0815-goose-ucb'})}})});
 await p.addScriptTag({content:must(buildSync({entryPoints:[path.resolve(__dirname,'../compat/lyra-wardrobe-mouth-soft-wet/lyra-wardrobe-mouth.ts')],bundle:true,write:false,format:'iife',target:'es2022'}).outputFiles[0]).text});
 const result=await p.evaluate(()=>{try{
  const s=PreviewTest.snapshot(window);if(!s)throw Error('Missing wardrobe snapshot');const state=JSON.stringify(SugarCube.State.variables),snapshotBefore=JSON.stringify(s.variables),live=Renderer.locateModel('main'),liveMouth=mouthSource(live);
  const out=PreviewTest.prepareOutfit(window,s,s.worn,[]);out.model.compile(out.options);
  const options={facestyle:'default',facevariant:'sweet',mouth:'smile'};
  if(mouthSource(out.model)(options)!=='img/face/default/sweet/mouth-smile.png')throw Error('Adapter not applied to actual preparation');
  if(out.model===live||mouthSource(live)!==liveMouth||state!==JSON.stringify(SugarCube.State.variables)||snapshotBefore!==JSON.stringify(s.variables))throw Error('Live/snapshot ownership changed');
  LyraWardrobeMouthSoftWet.destroy();const restored=PreviewTest.prepareOutfit(window,s,s.worn,[]);restored.model.compile(restored.options);
  if(mouthSource(restored.model)(options)!=='img/face/default/mouth-smile.png')throw Error('New preview not restored');
  return {calls:previewCalls,privateModelOnly:true,liveStateUnchanged:true,nativeDefaultRestored:true};
 }finally{Object.assign(window,{modUtils:originalModUtils});Reflect.deleteProperty(window,'originalModUtils')}});
 assert.equal(result.calls,3);console.log('PASS actual native prepare/compile, optional mouth adapter and cleanup',result);
 }finally{await b.close();server.close()}})().catch(error=>{console.error(error);server.close();process.exitCode=1});
