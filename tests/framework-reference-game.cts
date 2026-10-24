// Live desktop acceptance for the final optional reference Mod; uses only the authorized fresh browser profile.
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import assert = require('node:assert/strict');
import crypto = require('node:crypto');
import playwright = require('playwright');
const {createHash}=crypto,{chromium}=playwright;
type Report={status:string;runtime:string;version:string;sceneRoute:string[];screenshots:string[];input?:{sha256:string};zips?:Record<string,{bytes:number;sha256:string}>;routeBlocker?:{wanted:string;count:number;context:unknown};install?:{keys:string[];mods:unknown};nativeAgeConfirmation?:string;catalog?:{categories:number;knownEntries:number};selection?:{categoryChanged:boolean;searchUsed:boolean;scrollRange:boolean};pageErrors?:Array<{message:string;stage:string;at:string}>;runtimeInfo?:{game:string;protocol:string};wardrobeState?:{before:string;afterCompare?:string;afterAllReference?:string;afterExit?:string};nativeBefore?:{lists:number;buttons:number;passage:string};nativeAfter?:{lists:number;buttons:number;passage:string};exit?:{scene:string;launcher:boolean;panel:boolean;owner:boolean;mount:boolean;claim:boolean};pageErrorsBeforeReference?:Array<{message:string;stage:string;at:string}>;error?:string};
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing reference-game fixture value');return value}
function portOf(server:http.Server):number{const address=server.address();if(address===null||typeof address==='string')throw Error('Missing local game server port');return address.port}
function recordOf(value:unknown):Record<string,unknown>{if(value===null||typeof value!=='object'||Array.isArray(value))throw Error('Expected game observation object');return Object.fromEntries(Object.entries(value))}
function stringOf(value:unknown):string{if(typeof value!=='string')throw Error('Expected game observation string');return value}
function nativeOf(value:unknown):{lists:number;buttons:number;passage:string}{const v=recordOf(value);if(typeof v.lists!=='number'||typeof v.buttons!=='number'||typeof v.passage!=='string')throw Error('Invalid native wardrobe observation');return {lists:v.lists,buttons:v.buttons,passage:v.passage}}
function runtimeOf(value:unknown):{game:string;protocol:string}{const v=recordOf(value);if(typeof v.game!=='string'||typeof v.protocol!=='string')throw Error('Invalid game runtime observation');return {game:v.game,protocol:v.protocol}}
function exitOf(value:unknown):{scene:string;launcher:boolean;panel:boolean;owner:boolean;mount:boolean;claim:boolean}{const v=recordOf(value);if(typeof v.scene!=='string'||typeof v.launcher!=='boolean'||typeof v.panel!=='boolean'||typeof v.owner!=='boolean'||typeof v.mount!=='boolean'||typeof v.claim!=='boolean')throw Error('Invalid native exit observation');return {scene:v.scene,launcher:v.launcher,panel:v.panel,owner:v.owner,mount:v.mount,claim:v.claim}}
const root=path.resolve(__dirname,'..'),dir=path.join(root,'tests/artifacts/stone-free-reference-game','desktop-'+Date.now());fs.mkdirSync(dir,{recursive:true});
const version='0.1.1-experimental',Host='StoneFreeHost',Reference='StoneFreeWardrobeReference';
const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex'),game=path.join(root,'tests/artifacts/stone-free-distribution/input/game.html');
const report:Report={status:'running',runtime:'Windows Edge desktop',version,sceneRoute:['Start','Start2','Orphanage Intro','Bedroom','Wardrobe'],screenshots:[]};
let server:http.Server|undefined,browser:import('playwright').Browser|undefined,page:import('playwright').Page,stage='game startup';
function zip(name:string){return fs.readFileSync(path.join(root,'dist/framework',`${name}-${version}.mod.zip`))}
const artifacts={[Host]:zip(Host),[Reference]:zip(Reference)};
report.input={sha256:hash(fs.readFileSync(game))};
report.zips=Object.fromEntries(Object.entries(artifacts).map(([name,data])=>[name,{bytes:data.length,sha256:hash(data)}]));
async function evaluate(source:string){return page.evaluate(source)}
async function wait(source:string,timeout=60000){const until=Date.now()+timeout;while(Date.now()<until){if(await evaluate(source))return;await new Promise(resolve=>setTimeout(resolve,250))}throw Error(`Readiness timed out: ${source}`)}
async function scene(){return evaluate('String(SugarCube.State.passage)')}
async function click(selector:string){const node=page.locator(selector);assert.equal(await node.count(),1,`Expected one original control: ${selector}`);await node.click()}
async function nativePassage(name:string){
 const selector=`#passages a[data-passage="${name}"]`,count=await page.locator(selector).count();
 if(count!==1){const context=await evaluate(`(()=>({scene:String(SugarCube.State.passage),links:[...document.querySelectorAll('#passages a[data-passage]')].map(a=>({passage:a.dataset.passage,text:a.textContent.trim().slice(0,100)}))}))()`);report.routeBlocker={wanted:name,count,context};throw Error(`Expected one native link to ${name}; inspected current passage links`)}
 await click(selector);await wait(`String(SugarCube.State.passage)===${JSON.stringify(name)}`);
}
async function install(){
 const keys=[];
 for(const [key,data] of Object.entries(artifacts)){
  const base64=data.toString('base64');
  const name=await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController(),data=${JSON.stringify(base64)},boot=await c.checkModZipFileIndexDB(data);if(typeof boot==='string')throw Error('ZIP rejected: '+boot);await c.addModIndexDB(${JSON.stringify(key)},data);return boot.name})()`);
  assert.ok(name);keys.push(key);
 }
 await evaluate(`modSC2DataManager.getModLoadController().overwriteModIndexDBModList(${JSON.stringify(keys)})`);
 await page.reload({waitUntil:'domcontentloaded',timeout:60000});
 await wait('!!window.modUtils && !!window.SugarCube?.State?.passage');
 await wait(`window.DoLUiHost?.protocolVersion==='0.1-experimental' && DoLUiHost.getDiagnostics().participants.includes(${JSON.stringify(Reference)})`);
 report.install={keys,mods:await evaluate(`modUtils.getModListNameNoAlias().filter(n=>[${JSON.stringify(Host)},${JSON.stringify(Reference)}].includes(n)).map(n=>({name:n,version:modUtils.getMod(n)?.version}))`)};
}
async function wardrobeHash(){const text=stringOf(await evaluate(`(()=>{const v=SugarCube.State.variables;return JSON.stringify({wardrobe:v.wardrobe,wardrobes:v.wardrobes??null,worn:v.worn,wardrobe_location:v.wardrobe_location??null,location:v.location??null})})()`));return hash(text)}
async function nav(){
 assert.equal(await scene(),'Start');
 const title=await page.locator('#ui-dialog-title').textContent().catch(()=>'' );
 if(/Welcome to Degrees of Lewdity/i.test(title||'')){
  await page.locator('#ui-dialog-body input[type="checkbox"]').check();
  await page.locator('#ui-dialog-body').getByRole('button',{name:'Enter',exact:true}).click();
  await wait(`String(SugarCube.State.passage)==='Start'`);report.nativeAgeConfirmation='Used original checkbox and Enter controls in the fresh test profile';
 }
 const title2=await page.locator('#ui-dialog-title').textContent().catch(()=>'' );
 if(/Welcome to Degrees of Lewdity/i.test(title2||''))throw Error('Original age confirmation did not close');
 await click('#settingsExit button');await wait(`String(SugarCube.State.passage)==='Start2'`);
 await nativePassage('Orphanage Intro');await nativePassage('Bedroom');await nativePassage('Wardrobe');
}
async function pickItems(panel:import('playwright').Locator){
 const select=panel.getByLabel('衣物部位'),opts=await select.locator('option').evaluateAll(nodes=>nodes.map(n=>{if(!(n instanceof HTMLOptionElement))throw Error('Expected wardrobe category option');return {key:n.value,count:Number((n.textContent?.match(/\((\d+)\)/)||[])[1]||0)}}));
 report.catalog={categories:opts.length,knownEntries:opts.reduce((sum,x)=>sum+x.count,0)};
 const first=opts.filter(x=>x.count>0).sort((a,b)=>b.count-a.count)[0];assert.ok(first,'Actual Wardrobe has no referenceable catalog entries');
 await select.selectOption(first.key);const list=panel.locator('.sf-wardrobe-reference-list'),rows=panel.locator('.sf-wardrobe-reference-item');
 const firstName=await rows.first().locator('b').innerText();await rows.first().getByRole('button',{name:'固定 A'}).click();
 let target=opts.find(x=>x.key!==first.key&&x.count>0),sameCategory=false;
 if(target)await select.selectOption(target.key);else{assert.ok(first.count>1,'Actual wardrobe has no distinct B item');target=first;sameCategory=true}
 const bRows=panel.locator('.sf-wardrobe-reference-item');if(sameCategory)assert.ok(await bRows.count()>1);
 const bIndex=sameCategory?1:0,bName=await bRows.nth(bIndex).locator('b').innerText();
 const query=page.getByRole('searchbox',{name:'搜索'});await query.fill(bName);const found=panel.locator('.sf-wardrobe-reference-item');
 if(await found.count()===0){await query.fill(must(bName.split(/\s+/)[0]))}
 const b=panel.locator('.sf-wardrobe-reference-item').first();await b.getByRole('button',{name:/选为 B|已选 B/}).click();
 const category=await select.inputValue(),search=await query.inputValue();
 await list.evaluate(el=>{el.scrollTop=el.scrollHeight});
 const scroll=await list.evaluate(el=>({top:el.scrollTop,max:el.scrollHeight-el.clientHeight}));
 report.selection={categoryChanged:category!==first.key,searchUsed:!!search,scrollRange:scroll.max>0};
 return {firstName,bName,category,search,scroll,select,query,list};
}
async function run(){
 const bytes=fs.readFileSync(game);assert.equal(hash(bytes),'c6441487307e66b79f34b62a75497bd4cdca911a6ab60beb90a329d7233d65f0');
 let input=bytes.toString('utf8');const pattern=/<script\b[^>]*>\s*window\.modDataValueZipList\s*=\s*(\[[\s\S]*?\])\s*;?\s*<\/script>/g;let replacements=0;
 input=input.replace(pattern,()=>{replacements++;return '<script>window.modDataValueZipList=[];</script>'});assert.equal(replacements,1,'Only the in-memory embedded Mod list should be replaced');
 const localServer=http.createServer((req,res)=>{if(req.url!=='/'){res.writeHead(404);res.end();return}res.writeHead(200,{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'});res.end(input)});server=localServer;await new Promise<void>(resolve=>localServer.listen(0,'127.0.0.1',resolve));
 browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(10000);
 page.on('pageerror',error=>{(report.pageErrors??=[]).push({message:error.message.slice(0,300),stage,at:new Date().toISOString()})});
 await page.goto(`http://127.0.0.1:${portOf(localServer)}/`,{waitUntil:'domcontentloaded',timeout:60000});await wait('!!window.modSC2DataManager?.getModLoadController && !!window.SugarCube?.State?.passage');
 const title=await page.locator('#ui-dialog-title').textContent().catch(()=>'' );
 if(/Welcome to Degrees of Lewdity/i.test(title||'')){
  await page.locator('#ui-dialog-body input[type="checkbox"]').check();await page.locator('#ui-dialog-body').getByRole('button',{name:'Enter',exact:true}).click();await wait(`String(SugarCube.State.passage)==='Start'`);report.nativeAgeConfirmation='Used original checkbox and Enter controls in the fresh test profile';
 }
 const stored=await evaluate('modSC2DataManager.getModLoadController().listModIndexDB()');assert.deepEqual(stored,[],'Fresh browser profile must have no installed test Mod keys');
 await install();
 const runtime=runtimeOf(await evaluate(`({game:StartConfig.version,loader:modUtils.version,scene:String(SugarCube.State.passage),protocol:DoLUiHost.protocolVersion})`));report.runtimeInfo=runtime;assert.equal(runtime.game,'0.5.12.13');assert.equal(runtime.protocol,'0.1-experimental');
 await nav();
 const initialState=await wardrobeHash();report.wardrobeState={before:initialState};
 const nativeBefore=nativeOf(await evaluate(`({lists:document.querySelectorAll('#wardrobeList').length,buttons:document.querySelectorAll('#wardrobeList button').length,passage:String(SugarCube.State.passage)})`));assert.deepEqual(nativeBefore.passage,'Wardrobe');assert.equal(nativeBefore.lists,1);report.nativeBefore=nativeBefore;
 const launcher=page.getByRole('button',{name:'衣柜参考空间',exact:true});await launcher.waitFor();const errorBaseline=report.pageErrors?.length??0;stage='wardrobe reference operations';
 await launcher.click();const panel=page.getByRole('dialog',{name:'衣柜参考空间'});await panel.waitFor();
 const desktop=must(await panel.boundingBox());assert.ok(desktop.x>=0&&desktop.y>=0&&desktop.x+desktop.width<=1280&&desktop.y+desktop.height<=900,JSON.stringify(desktop));
 await page.screenshot({path:path.join(dir,'live-desktop-wardrobe-reference.png')});report.screenshots.push('live-desktop-wardrobe-reference.png');
 const picks=await pickItems(panel);const baselineState=await wardrobeHash();assert.equal(baselineState,initialState,'Reference selection must not change inventory or worn state');
 await panel.getByRole('button',{name:'普通比较'}).click();const plain=await panel.locator('.sf-wardrobe-reference-comparison').innerText();assert.ok(plain.includes(picks.firstName));assert.ok(plain.includes(picks.bName));
 await page.screenshot({path:path.join(dir,'live-desktop-ordinary-comparison.png')});report.screenshots.push('live-desktop-ordinary-comparison.png');
 await panel.getByRole('button',{name:'返回目录'}).click();await page.waitForFunction(()=>document.activeElement?.matches('[data-select-b]'));
 assert.equal(await picks.select.inputValue(),picks.category);assert.equal(await picks.query.inputValue(),picks.search);assert.equal(await picks.list.evaluate(el=>el.scrollTop),picks.scroll.top);
 const backFocus=await picks.list.evaluate(el=>el.ownerDocument.activeElement?.matches('[data-select-b]'));assert.equal(backFocus,true);
 // Start the spatial transition and immediately interrupt it with Back; no transition continuation may replace the restored list.
 await panel.getByRole('button',{name:'空间比较'}).click();await panel.getByRole('button',{name:'返回目录'}).evaluate(button=>{if(!(button instanceof HTMLButtonElement))throw Error('Missing return button');button.click()});
 await page.waitForFunction(()=>document.querySelector('.sf-wardrobe-reference-comparison')===null&&document.activeElement?.matches('[data-select-b]'));
 await page.waitForTimeout(450);assert.equal(await page.locator('.sf-wardrobe-reference-comparison').count(),0);assert.equal(await picks.list.evaluate(el=>el.scrollTop),picks.scroll.top);
 await panel.getByRole('button',{name:'空间比较'}).click();await panel.locator('.sf-wardrobe-reference-comparison').waitFor();await page.waitForTimeout(400);
 const spatial=await panel.locator('.sf-wardrobe-reference-comparison').innerText();assert.equal(spatial,plain,'Ordinary and spatial comparison content must match');
 await page.screenshot({path:path.join(dir,'live-desktop-spatial-comparison.png')});report.screenshots.push('live-desktop-spatial-comparison.png');
 const stateAfterCompare=await wardrobeHash();assert.equal(stateAfterCompare,initialState,'A/B comparison must leave wardrobe and worn data unchanged');report.wardrobeState.afterCompare=stateAfterCompare;
 await panel.getByRole('button',{name:'返回目录'}).click();await page.waitForFunction(()=>document.activeElement?.matches('[data-select-b]'));
 await page.setViewportSize({width:390,height:844});await panel.getByRole('button',{name:'空间比较'}).click();await panel.locator('.sf-wardrobe-reference-comparison').waitFor();await page.waitForTimeout(400);
 const narrow=must(await panel.boundingBox());assert.ok(narrow.x>=0&&narrow.y>=0&&narrow.x+narrow.width<=390&&narrow.y+narrow.height<=844,JSON.stringify(narrow));
 await page.screenshot({path:path.join(dir,'live-narrow-spatial-comparison.png')});report.screenshots.push('live-narrow-spatial-comparison.png');
 await panel.getByRole('button',{name:'返回目录'}).click();await page.emulateMedia({reducedMotion:'reduce'});await panel.getByRole('button',{name:'空间比较'}).click();
 assert.equal(await panel.evaluate(el=>getComputedStyle(el).transitionDuration),'0s');await panel.getByRole('button',{name:'返回目录'}).click();
 await panel.press('Escape');await page.waitForFunction(()=>document.querySelector('.sf-wardrobe-reference-panel')===null&&document.activeElement?.matches('.sf-wardrobe-reference-launch'));
 const nativeAfter=nativeOf(await evaluate(`({lists:document.querySelectorAll('#wardrobeList').length,buttons:document.querySelectorAll('#wardrobeList button').length,passage:String(SugarCube.State.passage)})`));assert.deepEqual(nativeAfter,nativeBefore);report.nativeAfter=nativeAfter;
 const finalState=await wardrobeHash();assert.equal(finalState,initialState,'All reference-only operations must preserve wardrobe and worn data');report.wardrobeState.afterAllReference=finalState;
 assert.equal(report.pageErrors?.length??0,errorBaseline,'No page exceptions during the reference session');
 await page.setViewportSize({width:1280,height:900});
 await page.screenshot({path:path.join(dir,'live-desktop-wardrobe-after-close.png')});report.screenshots.push('live-desktop-wardrobe-after-close.png');
 stage='native wardrobe exit';const stowed=await evaluate('SugarCube.UIBar.isStowed()');if(!stowed){assert.equal(await page.locator('#ui-bar-toggle').count(),1,'Use the original UI-bar toggle if it blocks the native exit');await click('#ui-bar-toggle')}
 const exitSelector='#passages a[data-passage="Bedroom"]';const exits=await page.locator(exitSelector).count();assert.equal(exits,1,'Inspect the original Wardrobe exit; expected its Bedroom link');
 await click(exitSelector);await wait(`String(SugarCube.State.passage)==='Bedroom'`);await page.waitForFunction(()=>document.querySelector('.sf-wardrobe-reference-launch')===null);
 const exit=exitOf(await evaluate(`(()=>{const d=DoLUiHost.getDiagnostics();return {scene:String(SugarCube.State.passage),launcher:!!document.querySelector('.sf-wardrobe-reference-launch'),panel:!!document.querySelector('.sf-wardrobe-reference-panel'),owner:d.participants.includes(${JSON.stringify(Reference)}),mount:d.mounts.some(x=>x.owner===${JSON.stringify(Reference)}),claim:d.claims.some(x=>x.owner===${JSON.stringify(Reference)})}})()`));report.exit=exit;
 assert.equal(exit.launcher,false);assert.equal(exit.panel,false);assert.equal(exit.scene,'Bedroom');
 report.wardrobeState.afterExit=await wardrobeHash();assert.equal(report.wardrobeState.afterExit,initialState);
 report.pageErrorsBeforeReference=(report.pageErrors??[]).slice(0,errorBaseline);
 assert.equal(report.pageErrors?.length??0,errorBaseline,'Natural navigation and exit must not add page exceptions');report.status='passed';
}
(async()=>{try{await run()}catch(error){report.status='failed';report.error=error instanceof Error?error.message:String(error);throw error}
 finally{if(browser)await browser.close();const localServer=server;if(localServer)await new Promise<void>((resolve,reject)=>localServer.close(error=>error?reject(error):resolve()));fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2));console.log(dir)}
 if(report.status!=='passed')process.exitCode=1})().catch(error=>{console.error(error);process.exitCode=1});
