// Isolated warm-cache measurement; never attaches to a user's game or writes saves.
import playwright = require('playwright');
const {chromium}=playwright;
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import assert = require('node:assert/strict');
import child = require('node:child_process');
import type {Clothing,WardrobeVariables} from '../src/wardrobe/host';
import type {GameUiControls} from '../src/runtime/game-controls';
const {spawnSync}=child;
type Item=Clothing&{name_cap:string};
declare const V:WardrobeVariables&{shopPage:number;shopItemsPerPage:number;clothes_choice?:number;clothingShopSlot:string;money:number;wardrobe:Record<string,Item[]>},T:{items:Item[];shopNameFilter:string},setup:{clothes:Record<string,Item[]>};
type Handler=(this:unknown,...args:unknown[])=>unknown;
declare const SugarCube:{State:{variables:{options:unknown}};Engine:{play(name:string):unknown};Wikifier:{new(node:Element|null,source:string):unknown;wikifyEval(source:string):DocumentFragment};Macro:{get(name:string):{handler:Handler}}};
declare const DoLGameUI:GameUiControls,DoLShopPageExperiment:{setEnabled(value:boolean):void},DoLShopUI:ReturnType<typeof import('../src/shop/main')['startShop']>,filterShopGroup:(items:Item[])=>Item[],getClothingCost:(item:Item,slot:string)=>number,shopBench:{calls:number;ms:number};
type Transition={name:'switchDuringBuild'|'traverseFilteredCatalogue';pages:number}|{name:'emptySearch';items:number}|{name:'nonzeroBackground';expectedPages:number;pages:number[];visiblePage:number}|{name:'purchase';price:number;moneyBefore:number;moneyAfter:number;countBefore:number;countAfter:number;errors:number};
type Snapshot={pages:{class:string;count:number}[];items:number;nodes:number;visible:string[];expected:string[];total:number};
type Row=Snapshot&{name:string;errors:(string|null)[];syncMs:number;firstReadyMs:number;calls:number;listMs:number;longTasks:number;longTaskMs:number;scans:number;fastPaths:number};
type Round={round:number;enabled:boolean;warmup:boolean;rows:Row[];businessEqual:boolean;callsAfterExit:number;errors:(string|null)[]};
type ValidationRow=Pick<Row,'name'|'errors'|'visible'|'expected'|'items'|'total'>&{pages:unknown[]};
type ValidationReport={rounds:{enabled:boolean;businessEqual:boolean;callsAfterExit:number;errors:unknown[];rows:ValidationRow[]}[];errors:string[];transitions:Transition[];environment?:{variant?:string}};
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing shop baseline fixture');return value;}
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const strings=(value:unknown):value is string[]=>Array.isArray(value)&&value.every((part:unknown)=>typeof part==='string');
const numeric=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value);
function transition(value:unknown):value is Transition{if(!record(value))return false;switch(value.name){case 'switchDuringBuild':case 'traverseFilteredCatalogue':return numeric(value.pages);case 'emptySearch':return numeric(value.items);case 'nonzeroBackground':return numeric(value.expectedPages)&&numeric(value.visiblePage)&&Array.isArray(value.pages)&&value.pages.every(numeric);case 'purchase':return ['price','moneyBefore','moneyAfter','countBefore','countAfter','errors'].every(key=>numeric(value[key]));default:return false}}
function checkedReport(value:unknown):ValidationReport{
 const row=(v:unknown):v is ValidationRow=>record(v)&&typeof v.name==='string'&&Array.isArray(v.errors)&&Array.isArray(v.pages)&&strings(v.visible)&&strings(v.expected)&&numeric(v.items)&&numeric(v.total);
 const round=(v:unknown):v is ValidationReport['rounds'][number]=>record(v)&&typeof v.enabled==='boolean'&&typeof v.businessEqual==='boolean'&&numeric(v.callsAfterExit)&&Array.isArray(v.errors)&&Array.isArray(v.rows)&&v.rows.every(row);
 if(!record(value)||!Array.isArray(value.rounds)||!value.rounds.every(round)||!strings(value.errors)||!Array.isArray(value.transitions)||!value.transitions.every(transition)||(value.environment!==undefined&&(!record(value.environment)||(value.environment.variant!==undefined&&typeof value.environment.variant!=='string'))))throw Error('Invalid shop baseline evidence');
 return {rounds:value.rounds,errors:value.errors,transitions:value.transitions,...(record(value.environment)?{environment:{variant:typeof value.environment.variant==='string'?value.environment.variant:undefined}}:{})};
}

const root=path.resolve(__dirname,'..'),workspace=path.resolve(process.env.DOL_TEST_WORKSPACE||path.join(root,'../..'));
const variant=process.env.DOL_WARDROBE_INTEGRATED==='1'?'lyra':'vanilla';
const fixture=path.join(workspace,variant==='lyra'?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html');
function validate({rounds,errors,transitions,environment}:ValidationReport){
 const bannerError=(e:string)=>e.includes("Cannot read properties of undefined (reading 'skybox')")&&e.includes('at bannerFallbackImage.onload');
 if(errors.some(bannerError)){
  const control:unknown=JSON.parse(fs.readFileSync(path.join(__dirname,`artifacts/shop-banner-control-${environment?.variant??variant}.json`),'utf8'));assert.ok(record(control)&&strings(control.errors));
  assert.equal(control.ui,false);assert.ok(control.errors.some(bannerError),'same-fixture no-UI control required');
 }
 assert.deepEqual(errors.filter(e=>!bannerError(e)),[],'unexpected runtime errors');
 for(const r of rounds){
  assert.ok(r.businessEqual,'business unchanged');assert.equal(r.callsAfterExit,0,'no page generation after exit');assert.deepEqual(r.errors,[]);
  for(const row of r.rows){assert.deepEqual(row.errors,[]);assert.deepEqual(row.visible,row.expected,'visible product order '+row.name);if(r.enabled)assert.equal(row.pages.length,1,'only current page');else assert.equal(row.items,row.total,'no stale background duplicates '+row.name);}
 }
 const first=must(transitions[0]),third=must(transitions[2]);assert.ok('pages' in first&&'items' in third);assert.equal(first.pages,1,'switch during background build');assert.equal(third.items,0,'empty search');
 const nonzero=transitions.find(x=>x.name==='nonzeroBackground');
 if(nonzero){assert.deepEqual(nonzero.pages,Array.from({length:nonzero.expectedPages},(_,i)=>i),'prepend and append order');assert.equal(nonzero.visiblePage,5);}
 const purchase=transitions.find(x=>x.name==='purchase');
 if(purchase){assert.equal(purchase.moneyAfter,purchase.moneyBefore-purchase.price);assert.equal(purchase.countAfter,purchase.countBefore+1);assert.equal(purchase.errors,0);}
 console.log('PASS shop assertions; separately reproduced upstream banner errors:',errors.filter(bannerError).length);
}
// Read the released patch contract without rebuilding or overwriting the release ZIP.
const packageData:unknown=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));assert.ok(record(packageData)&&typeof packageData.version==='string');const packageVersion=packageData.version;
const extracted=spawnSync('python',['-X','utf8','-c',
 'import json,sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); b=json.loads(z.read("boot.json")); print(json.dumps(b["addonPlugin"][0]["params"]))',
 path.join(root,'dist',`DoL-SoftWet-GameUI-${packageVersion}.mod.zip`)],{encoding:'utf8'});
assert.equal(extracted.status,0,extracted.stderr);
const rawPatches:unknown=JSON.parse(extracted.stdout);assert.ok(Array.isArray(rawPatches));const patches=rawPatches.map((p:unknown)=>{assert.ok(record(p)&&typeof p.findString==='string'&&typeof p.replaceFile==='string');const resolved=path.resolve(root,p.replaceFile),relative=path.relative(root,resolved);assert.ok(relative!=='..'&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative),'Patch path escapes source root');return {findString:p.findString,replaceFile:p.replaceFile,replacement:fs.readFileSync(resolved,'utf8')}});
const passage=spawnSync('python',['-X','utf8','-c',
 'import sys,re,html,json,pathlib; s=pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"); print(json.dumps(html.unescape(re.search(r\'<tw-passagedata[^>]*name="Clothing Shop v2 Widgets"[^>]*>([\\s\\S]*?)</tw-passagedata>\',s)[1])))',
 fixture],{encoding:'utf8',maxBuffer:8*1024*1024});
assert.equal(passage.status,0,passage.stderr);
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url??'/','http://localhost').pathname);
 const file=pathname==='/game'?fixture:path.join(workspace,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(workspace)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
(async()=>{
 if(process.env.DOL_SHOP_VERIFY_ARTIFACT){validate(checkedReport(JSON.parse(fs.readFileSync(process.env.DOL_SHOP_VERIFY_ARTIFACT,'utf8'))));return}
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1363,height:876}}),errors:string[]=[];
  p.on('pageerror',e=>errors.push(e.stack??e.message));
  await p.addInitScript(()=>{localStorage.setItem('verifiedAge','true');Object.assign(window,{must:<T,>(value:T|null|undefined)=>{if(value==null)throw Error('Missing shop baseline fixture');return value}})});
  if(process.env.DOL_SHOP_BANNER_CONTROL==='1'){
   await p.route('**/img/misc/banner.png',async route=>{await new Promise(r=>setTimeout(r,800));await route.continue()});
   await p.goto(`http://127.0.0.1:${(()=>{const a=server.address();assert.ok(a&&typeof a!=='string');return a.port})()}/game`,{waitUntil:'domcontentloaded',timeout:90000});
   await p.waitForFunction(()=>(typeof SugarCube==='undefined'?undefined:SugarCube)?.State?.variables?.options);
   await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForTimeout(1300);
   const control={variant,scope:'same selected fixture, no UI/runtime/patch injected, delayed native banner image',errors,ui:await p.evaluate(()=>typeof DoLGameUI!=='undefined')};
   fs.writeFileSync(path.join(__dirname,`artifacts/shop-banner-control-${variant}.json`),JSON.stringify(control,null,2));
   assert.equal(control.ui,false);assert.ok(errors.some(e=>e.includes('bannerFallbackImage.onload')&&e.includes('skybox')));
   console.log('PASS no-UI banner error reproduction');return;
  }
  await p.goto(`http://127.0.0.1:${(()=>{const a=server.address();assert.ok(a&&typeof a!=='string');return a.port})()}/game`,{waitUntil:'load',timeout:90000});
  await p.waitForFunction(()=>(typeof SugarCube==='undefined'?undefined:SugarCube)?.State?.variables?.options);
  await p.waitForLoadState('networkidle');
  await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForLoadState('networkidle');
  await p.addScriptTag({path:path.join(root,'dist/shop-page-experiment.js')});
  await p.evaluate(({patches,source})=>{
   let text=source;
   for(const patch of patches){
    if(text.split(patch.findString).length!==2)throw Error('nonunique patch '+patch.replaceFile+' '+JSON.stringify({find:patch.findString,actual:text.split('\n').filter(l=>l.includes('shop-list-pages')).slice(0,3)}));
    text=text.replace(patch.findString,patch.replacement);
   }
   // Re-register exactly the patched native widgets, like loader pre-start replacement.
   const output=SugarCube.Wikifier.wikifyEval(text);
   if(output.querySelector('.error'))throw Error(output.textContent??'Native patch failed');
  },{patches,source:(()=>{const value:unknown=JSON.parse(passage.stdout);assert.equal(typeof value,'string');if(typeof value!=='string')throw Error('Missing native passage');return value})()});
  await p.addStyleTag({path:path.join(root,'dist/game-ui.css')});
  await p.addScriptTag({path:path.join(root,'dist/game-ui.js')});
  const environment=await p.evaluate(variant=>({variant,ui:DoLGameUI.version,userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight]}),variant);
  await p.evaluate(()=>{
   Object.assign(window,{shopBench:{calls:0,ms:0}});const macro=SugarCube.Macro.get('generateshoppage'),original=macro.handler;
   macro.handler=function(...args){shopBench.calls++;const start=performance.now();try{return original.apply(this,args)}finally{shopBench.ms+=performance.now()-start}};
  });
  const rounds:Round[]=[];
  for(let round=0;round<(process.env.DOL_SHOP_LIFECYCLE_ONLY==='1'?0:4);round++)for(const enabled of round%2?[true,false]:[false,true]){
   const result=await p.evaluate(async({enabled,round})=>{
    const delay=(ms:number)=>new Promise(r=>setTimeout(r,ms)),frame=()=>new Promise<void>(r=>requestAnimationFrame(()=>r()));
    SugarCube.Engine.play('Bedroom');await delay(50);
    DoLShopPageExperiment.setEnabled(enabled);
    V.shopPage=0;V.shopItemsPerPage=12;delete V.clothes_choice;
    new SugarCube.Wikifier(null,'<<shopClothingFilterReset>>');
    const business=()=>JSON.stringify({money:V.money,wardrobe:V.wardrobe,worn:V.worn,time:V.timeStamp});
    const before=business();SugarCube.Engine.play('Clothing Shop');await frame();await frame();
    const rows:Row[]=[];
    function snapshot(){
     const pages=[...document.querySelectorAll('#shop-list-pages > .clothing-shop-page')];
     return {pages:pages.map(e=>({class:e.className,count:e.querySelectorAll('.clothing-item').length})),items:document.querySelectorAll('#shop-list-pages .clothing-item').length,nodes:document.querySelectorAll('#shop-list-pages *').length,visible:[...document.querySelectorAll('#shop-list-pages > .clothing-shop-page:not(.hidden) .clothing-name')].map(e=>(e.querySelector('a, .lblue')?.textContent??'').replace(/^\s*\([^)]*\)\s*/,'').trim()),expected:filterShopGroup(T.items).slice(V.shopPage*V.shopItemsPerPage,(V.shopPage+1)*V.shopItemsPerPage).map(x=>x.name_cap),total:filterShopGroup(T.items).length};
    }
    async function measure(name:string,action:()=>unknown,settle?:number){
     const tasks:{start:number;duration:number}[]=[],observer=new PerformanceObserver(l=>tasks.push(...l.getEntries().map(e=>({start:e.startTime,duration:e.duration}))));observer.observe({type:'longtask'});
     let start=0,syncMs=0;const calls=shopBench.calls,ms=shopBench.ms,counts=DoLShopUI.getLifecycleCounts();
     await new Promise<void>((resolve,reject)=>setTimeout(async()=>{start=performance.now();try{const pending=action();syncMs=performance.now()-start;await pending;resolve()}catch(e){reject(e)}},0));
     await frame();await frame();const firstReadyMs=performance.now()-start;
     await delay(settle??Math.max(700,Math.ceil(filterShopGroup(T.items).length/V.shopItemsPerPage)*100+500));
     tasks.push(...observer.takeRecords().map(e=>({start:e.startTime,duration:e.duration})));observer.disconnect();
     const endCounts=DoLShopUI.getLifecycleCounts();
     rows.push({name,errors:[...document.querySelectorAll('.error')].map(e=>e.textContent),syncMs,firstReadyMs,calls:shopBench.calls-calls,listMs:shopBench.ms-ms,longTasks:tasks.length,longTaskMs:tasks.reduce((n,e)=>n+e.duration,0),scans:endCounts.scans-counts.scans,fastPaths:endCounts.fastPaths-counts.fastPaths,...snapshot()});
    }
    await measure('enter',()=>{
     const link=[...document.querySelectorAll<HTMLAnchorElement>('#clothingShop-div a')].find(e=>/View All|查看全部|查看所有|全部服/.test(e.textContent??''));
     if(!link)throw Error('missing View All');link.click();
    });
    await measure('next',()=>must(document.querySelector<HTMLElement>('#shop-pagination .next a')).click(),100);
    await measure('previous',()=>must(document.querySelector<HTMLElement>('#shop-pagination .prev a')).click(),100);
    // Native filter controls and apply handler; three replacements before delayed generation completes.
    await measure('rapidFilters',()=>{
     for(const gender of ['female','male','female']){
      must(document.querySelector<HTMLElement>('.filters-button a')).click();
      for(const g of ['female','neutral','male']){
       const input=must(document.querySelector<HTMLInputElement>('#checkbox-shopclothingfiltergender'+g));
       if(input.checked!==(g===gender))input.click();
      }
      must(document.querySelector<HTMLElement>('#filters .button-apply a')).click();
     }
    });
    await measure('midBuildFilters',async()=>{
     must(document.querySelector<HTMLElement>('.filters-button a')).click();must(document.querySelector<HTMLElement>('#filters .button-reset a')).click();
     await delay(350);
     for(const gender of ['male','female']){
      must(document.querySelector<HTMLElement>('.filters-button a')).click();
      for(const g of ['female','neutral','male']){
       const input=must(document.querySelector<HTMLInputElement>('#checkbox-shopclothingfiltergender'+g));
       if(input.checked!==(g===gender))input.click();
      }
      must(document.querySelector<HTMLElement>('#filters .button-apply a')).click();await delay(350);
     }
    });
    // Leave before newly scheduled background jobs run, then ensure nothing leaks into another passage.
    must(document.querySelector<HTMLElement>('.filters-button a')).click();must(document.querySelector<HTMLElement>('#filters .button-apply a')).click();
    SugarCube.Engine.play('Bedroom');const exitCalls=shopBench.calls;await delay(700);
    return {round,enabled,warmup:round===0,rows,businessEqual:before===business(),callsAfterExit:shopBench.calls-exitCalls,errors:[...document.querySelectorAll('.error')].map(e=>e.textContent)};
   },{enabled,round});
   rounds.push(result);console.log('ROUND',round,enabled,result.rows.map(r=>[r.name,r.calls,r.items,r.total]));
  }
  const median=(a:number[])=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
  const summary=[false,true].flatMap(enabled=>(rounds[0]?.rows??[]).map(({name})=>{
   const r=rounds.filter(r=>!r.warmup&&r.enabled===enabled).flatMap(r=>r.rows.filter(x=>x.name===name));
   return {enabled,name,firstReadyMedian:median(r.map(x=>x.firstReadyMs)),listMsMedian:median(r.map(x=>x.listMs)),calls:r.map(x=>x.calls),nodes:r.map(x=>x.nodes),longTasks:r.reduce((n,x)=>n+x.longTasks,0),scans:r.map(x=>x.scans),items:r.map(x=>x.items),total:r.map(x=>x.total)};
  }));
  const transitions=await p.evaluate(async()=>{
   const delay=(ms:number)=>new Promise(r=>setTimeout(r,ms)),result:Transition[]=[];
   SugarCube.Engine.play('Clothing Shop');await delay(50);DoLShopPageExperiment.setEnabled(false);
   must([...document.querySelectorAll<HTMLAnchorElement>('#clothingShop-div a')].find(e=>/View All|查看全部|查看所有|全部服/.test(e.textContent??''))).click();
   for(const enabled of [true,false,true]){
    await delay(350);DoLShopPageExperiment.setEnabled(enabled);new SugarCube.Wikifier(null,'<<updateclotheslist>>');
   }
   await delay(1000);
   result.push({name:'switchDuringBuild',pages:document.querySelectorAll('#shop-list-pages>.clothing-shop-page').length});
   const max=Math.ceil(filterShopGroup(T.items).length/V.shopItemsPerPage);
   for(let page=0;page<max;page++){
    V.shopPage=page;new SugarCube.Wikifier(null,'<<clothingshopChangePage>>');
    const actual=[...document.querySelectorAll('.clothing-shop-page:not(.hidden) .clothing-name')].map(e=>(e.querySelector('a, .lblue')?.textContent??'').replace(/^\s*\([^)]*\)\s*/,'').trim());
    const expected=filterShopGroup(T.items).slice(page*V.shopItemsPerPage,(page+1)*V.shopItemsPerPage).map(x=>x.name_cap);
    if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('paged traversal mismatch '+page);
   }
   result.push({name:'traverseFilteredCatalogue',pages:max});
   T.shopNameFilter='NoSuchItem_Baseline';new SugarCube.Wikifier(null,'<<updateclotheslist>>');await delay(350);
   result.push({name:'emptySearch',items:document.querySelectorAll('.clothing-item').length});
   T.shopNameFilter='';DoLShopPageExperiment.setEnabled(false);V.shopPage=5;
   new SugarCube.Wikifier(null,'<<updateclotheslist>>');
   const expectedPages=Math.ceil(filterShopGroup(T.items).length/V.shopItemsPerPage);await delay(expectedPages*100+600);
   result.push({name:'nonzeroBackground',expectedPages,pages:[...document.querySelectorAll('#shop-list-pages>.clothing-shop-page')].map(e=>Number(must(e.className.match(/\bpage-(\d+)/))[1])),visiblePage:Number(must(document.querySelector<HTMLElement>('.clothing-shop-page:not(.hidden)')).className.match(/\bpage-(\d+)/)?.[1])});
   DoLShopPageExperiment.setEnabled(true);V.shopPage=0;V.money=1000000;
   new SugarCube.Wikifier(null,'<<updateclotheslist>>');await delay(50);
   must(document.querySelector<HTMLElement>('.clothing-name a')).click();await delay(50);
   const slot=V.clothingShopSlot,price=getClothingCost(must(must(setup.clothes[slot])[must(V.clothes_choice)]),slot),moneyBefore=V.money,countBefore=must(V.wardrobe[slot]).length;
   must(document.querySelector<HTMLElement>('#buy-send-home a')).click();await delay(400);
   result.push({name:'purchase',price,moneyBefore,moneyAfter:V.money,countBefore,countAfter:must(V.wardrobe[slot]).length,errors:document.querySelectorAll('.error').length});
   return result;
  });
  const output=path.join(__dirname,'artifacts',`shop-current-baseline-${Date.now()}.json`);
  fs.writeFileSync(output,JSON.stringify({environment,scope:'Desktop warm-cache selected fixture, 1 warmup + 3 alternating pairs. Same inventory, no purchase. Four released find strings plus current working-tree replacements applied in isolated runtime, not installed-package proof. First ready includes two frame waits; not physical paint. Background work observed for page-count-based fixed window, not a claimed settled latency. Rapid filters via original controls in same task stresses overlapping jobs, not human input timing. midBuildFilters includes 350ms gaps in firstReadyMs, which is not an interaction latency; syncMs only covers initial synchronous segment.',rounds,summary,transitions,errors},null,2));
  console.log(JSON.stringify({output,summary},null,2));
  validate({rounds,errors,transitions,environment});
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
