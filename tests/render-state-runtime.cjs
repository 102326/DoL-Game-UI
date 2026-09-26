const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
const bundle=buildSync({stdin:{contents:`export {prepareOutfit} from './src/wardrobe/render';export {createWardrobePerformance} from './src/wardrobe/performance';export {snapshot} from './src/wardrobe/data';`,resolveDir:path.resolve(__dirname,'..')},bundle:true,write:false,format:'iife',globalName:'RenderStateTest'}).outputFiles[0].text;
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1704,height:1136}});
 await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
 await p.goto(`http://127.0.0.1:${server.address().port}/game`,{waitUntil:'load',timeout:90000});await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options,{timeout:60000});await p.waitForLoadState('networkidle');
 await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForLoadState('networkidle');await p.addScriptTag({content:bundle});
 const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const result=await p.evaluate(()=>{
  const {snapshot,prepareOutfit,createWardrobePerformance}=RenderStateTest,s=snapshot(window),timing=createWardrobePerformance();timing.setEnabled(true);
  const base=structuredClone(s.variables),setupBefore=JSON.stringify(s.setup.clothes),cases=[];
  function encode(value){const seen=new Map();function walk(v){if(typeof v==='function')return String(v);if(!v||typeof v!=='object')return v;if(seen.has(v))return {ref:seen.get(v)};seen.set(v,seen.size);return Array.isArray(v)?v.map(walk):Object.fromEntries(Object.keys(v).sort().map(k=>[k,walk(v[k])]));}return JSON.stringify(walk(value))}
  function run(full){timing.setFullStateCopy(full);const start=performance.now(),out=prepareOutfit(window,s,s.variables.worn,[],timing);const layers=out.model.compile(out.options);return {elapsed:performance.now()-start,value:encode({options:out.options,layers})}}
  const outfits=setup.clothes.upper.filter(d=>d.name!=='naked'&&!d.outfitPrimary&&!d.outfitSecondary).slice(0,8);
  for(let i=0;i<outfits.length+2;i++){
   s.variables=structuredClone(base);
   if(i<outfits.length){s.variables.worn.upper=structuredClone(outfits[i]);s.variables.worn.upper.colour=outfits[i].colour_options?.[0]??0;s.variables.worn.upper.accessory_colour=outfits[i].accessory_colour_options?.[0]??0}
   if(i===outfits.length){s.variables.leftarm='bound';s.variables.rightarm='grappled';s.variables.modeloptionsOverride={...s.variables.modeloptionsOverride,breast_size:2};}
   const before=JSON.stringify(s.variables),a=run(true),b=run(false);
   cases.push({case:i,equal:a.value===b.value,unchanged:before===JSON.stringify(s.variables)});
  }
  const measurements=[];
  for(const heavy of [false,true]){
   s.variables=structuredClone(base);
   // Deliberately unrelated synthetic inventory/payload; never a player save.
   if(heavy){s.variables.__perfPayload='x'.repeat(5*1024*1024);s.variables.__perfInventory=Array.from({length:5000},(_,i)=>({id:i,colour:'black',integrity:100,meta:{a:[1,2,3]}}))}
   for(let i=0;i<4;i++){run(true);run(false)}
   const times={full:[],projected:[]},phases={};
   // Alternate order to limit warmup/order bias; report preparation only, no image I/O.
   for(let i=0;i<20;i++)for(const full of i%2?[false,true]:[true,false]){
    timing.reset();const value=run(full);const key=full?'full':'projected';times[key].push(value.elapsed);(phases[key]??=[]).push(timing.report().phases['render.copyState'].p50);
   }
   const stats=a=>{a=[...a].sort((x,y)=>x-y);return {samples:a.length,p50:a[9],p95:a[18]}};
   measurements.push({fixture:heavy?'synthetic-large-state':'new-game',prepareAndCompileMs:Object.fromEntries(Object.entries(times).map(([k,a])=>[k,stats(a)])),copyStateMs:Object.fromEntries(Object.entries(phases).map(([k,a])=>[k,stats(a)]))});
  }
  return {cases,setupUnchanged:setupBefore===JSON.stringify(s.setup.clothes),measurements,scope:'Desktop Edge, 4x CPU throttle, synthetic new-game states. Preparation and compilation only; not Android or whole-click latency.'};
 });
 assert.ok(result.cases.every(c=>c.equal&&c.unchanged));assert.ok(result.setupUnchanged);
 fs.writeFileSync(path.join(__dirname,'artifacts/render-state-0.5.1'+(process.env.DOL_WARDROBE_INTEGRATED?'-integrated':'')+'.json'),JSON.stringify({passed:true,...result},null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
