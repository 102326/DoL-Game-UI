import playwright = require('playwright');
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import assert = require('node:assert/strict');
import esbuild = require('esbuild');
import type {prepareOutfit,renderOutfit} from '../src/wardrobe/render';
import type {snapshot} from '../src/wardrobe/data';
import type {createWardrobePerformance} from '../src/wardrobe/performance';
import type {ClothingSlots,WardrobeVariables} from '../src/wardrobe/host';
const {chromium}=playwright,{buildSync}=esbuild;
declare const RenderStateTest:{snapshot:typeof snapshot;prepareOutfit:typeof prepareOutfit;renderOutfit:typeof renderOutfit;createWardrobePerformance:typeof createWardrobePerformance},Skin:{color:unknown},setup:{colours:{hairgradients_prototypes:Record<'sides'|'fringe',Record<string,unknown>>};clothes_all_slots:string[];clothes:ClothingSlots},SugarCube:{State:{variables:{options?:unknown}};Engine:{play(name:string):void}};
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url??'/','http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
const bundle=buildSync({stdin:{contents:`export {prepareOutfit,renderOutfit} from './src/wardrobe/render';export {createWardrobePerformance} from './src/wardrobe/performance';export {snapshot} from './src/wardrobe/data';`,resolveDir:path.resolve(__dirname,'..')},bundle:true,write:false,format:'iife',globalName:'RenderStateTest'}).outputFiles[0]?.text;if(!bundle)throw Error('Missing tanning bundle');
(async()=>{await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage(),address=server.address();assert.ok(address&&typeof address!=='string');await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
 await p.goto(`http://127.0.0.1:${address.port}/game`,{timeout:90000});await p.waitForFunction(()=>typeof SugarCube!=='undefined'&&SugarCube.State?.variables?.options);await p.waitForLoadState('networkidle');await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForLoadState('networkidle');await p.addScriptTag({content:bundle});
 const result=await p.evaluate(async()=>{if(typeof RenderStateTest?.snapshot!=='function'||typeof RenderStateTest.prepareOutfit!=='function'||typeof RenderStateTest.renderOutfit!=='function')throw Error('Missing tanning API');const must=<T,>(value:T|null|undefined):T=>{if(value===null||value===undefined)throw Error('Missing tanning snapshot');return value};const {snapshot,prepareOutfit,renderOutfit}=RenderStateTest,s=must(snapshot(window));if(!s.variables.options)throw Error('Missing tanning options');Reflect.set(s.variables.options,'tanLines',true);s.variables.hairColourStyle='gradient';s.variables.hairColourGradient={style:'high-ombre',colours:['black','red']};
 const skin={color:Skin.color,tanningLayers:[{value:.3,layers:['upper_main'],slots:{upper:{index:1,integrity:'full',colour:'black'}}}],cachedLayers:null};
 const root=new Proxy(window,{get(target,key){return key==='Skin'?skin:Reflect.get(target,key)}});
 const before=JSON.stringify([s.variables,skin,s.setup.clothes]);const out=prepareOutfit(root,s,s.variables.worn,[]);out.model.compile(out.options);
 const canvas=await renderOutfit(root,s,s.variables.worn,[]);const ctx=canvas.getContext('2d');if(!ctx)throw Error('Missing tanning canvas');const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;const painted=pixels.some((value,index)=>index%4===3&&value>0);
 const cases:string[]=[],failures:Array<{name:string;error:string}>=[];
 function check(name:string,change:(variables:WardrobeVariables)=>void){const variables=structuredClone(s.variables);change(variables);try{const prepared=prepareOutfit(root,{...s,variables},variables.worn,[]);prepared.model.compile(prepared.options);cases.push(name)}catch(e){failures.push({name,error:e instanceof Error?e.message:String(e)})}}
 for(const part of ['sides','fringe'] as const)for(const style of Object.keys(setup.colours.hairgradients_prototypes[part]))check('gradient:'+part+':'+style,v=>{const fringe=part==='fringe';v[fringe?'hairFringeColourStyle':'hairColourStyle']='gradient';v[fringe?'hairFringeColourGradient':'hairColourGradient']={style,colours:['black','red']}});
 for(const slot of setup.clothes_all_slots){if(!s.variables.worn[slot])continue;for(const item of setup.clothes[slot]??[]){check(slot+':'+item.variable,v=>{const worn=structuredClone(item),colour=item.colour_options?.[0]||'black',accessory=item.accessory_colour_options?.[0]||'black';if((typeof colour!=='string'&&typeof colour!=='number')||(typeof accessory!=='string'&&typeof accessory!=='number'))throw Error('Invalid native clothing colour');worn.colour=colour;worn.accessory_colour=accessory;v.worn[slot]=worn})}}
 for(const override of [{mannequin:true},{show_clothes:false},{belly:10},{body_type:'curvy'},{body_type:'slender'},{arm_left:'cover',arm_right:'cover'}])check(JSON.stringify(override),v=>{const previous=v.modeloptionsOverride;v.modeloptionsOverride={...(previous&&typeof previous==='object'?previous:{}),...override}});
 if(before!==JSON.stringify([s.variables,skin,s.setup.clothes]))throw Error('Live data changed during matrix');
 const generated:unknown=out.options.generatedLayers;if(!generated||typeof generated!=='object')throw Error('Missing tanning layers');return {painted,cases:cases.length,failures,generated:Object.keys(generated),unchanged:before===JSON.stringify([s.variables,skin,s.setup.clothes]),same:out.model.options===out.options};});
 assert.ok(result.painted);assert.deepEqual(result.failures,[]);assert.ok(result.generated.some(k=>k.startsWith('tan_base')));assert.ok(result.unchanged);assert.ok(result.same);console.log('PASS tanning branch and isolated state',result);
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
