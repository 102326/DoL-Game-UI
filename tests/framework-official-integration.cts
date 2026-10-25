// Target-owned assertions around real Loader installation; no fake Passage events or game-state writes.
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import assert = require('node:assert/strict');
import crypto = require('node:crypto');
import type {Browser, Page} from 'playwright';
const {createHash}=crypto;
type Client={evaluate(source:string):Promise<unknown>;send(method:string,params?:Record<string,unknown>):Promise<unknown>};
type Context={ensureWebview():Promise<Client>;finish():Promise<unknown>};
type Backup={list:string[];hidden:string[];preferences:Record<string,string|null>;scene:string;game:string;ui?:string};
type Step={stage:string;type:string;selector:string};
type Report={status:string;platform:string;steps:Step[];artifacts:Record<string,{name:string;bytes:number;sha256:string}>;screenshots:string[];errors?:Array<{stage:string;text:string}>;console?:string[];initial?:{scene:string;game:string;ui?:string};inputSha256?:string;missingHost?:{uiNotStarted:boolean;reported:boolean};loaded?:unknown;readonly?:unknown;navigation?:string;quickWear?:{nativeWornVerified:boolean;slot:string};release?:unknown;classicBranch?:{version:string;api:number;reference:boolean;frameworkOwners:string[]};error?:string;failedStage?:string;failureContext?:unknown;cleanup?:string;cleanupError?:string};
function recordOf(value:unknown):Record<string,unknown>{if(value===null||typeof value!=='object'||Array.isArray(value))throw Error('Expected object');return Object.fromEntries(Object.entries(value))}
function stringOf(value:unknown):string{if(typeof value!=='string')throw Error('Expected string');return value}
function booleanOf(value:unknown):boolean{if(typeof value!=='boolean')throw Error('Expected boolean');return value}
function numberOf(value:unknown):number{if(typeof value!=='number'||!Number.isFinite(value))throw Error('Expected number');return value}
function stringsOf(value:unknown):string[]{if(!Array.isArray(value)||!value.every(x=>typeof x==='string'))throw Error('Expected strings');return value}
function backupOf(value:unknown):Backup{const b=recordOf(value),raw=recordOf(b.preferences),preferences:Backup['preferences']={};for(const [key,item]of Object.entries(raw)){if(item!==null&&typeof item!=='string')throw Error('Invalid preference');preferences[key]=item}return {list:stringsOf(b.list),hidden:stringsOf(b.hidden),preferences,scene:stringOf(b.scene),game:stringOf(b.game),ui:b.ui===undefined?undefined:stringOf(b.ui)}}
function peerOf(value:unknown):{diagnostics:{participants:string[]};read:{ok:boolean};native:boolean}{const p=recordOf(value),d=recordOf(p.diagnostics),r=recordOf(p.read);return {diagnostics:{participants:stringsOf(d.participants)},read:{ok:booleanOf(r.ok)},native:booleanOf(p.native)}}
function firstOf(value:unknown):Array<{key:string;name:string}>{if(!Array.isArray(value))throw Error('Expected reference rows');return value.map(item=>{const r=recordOf(item);return {key:stringOf(r.key),name:stringOf(r.name)}})}
function classicOf(value:unknown):NonNullable<Report['classicBranch']>{const r=recordOf(value);return {version:stringOf(r.version),api:numberOf(r.api),reference:booleanOf(r.reference),frameworkOwners:stringsOf(r.frameworkOwners)}}
function expectedOf(value:unknown):{slot:string;variable:string}{const r=recordOf(value);return {slot:stringOf(r.slot),variable:stringOf(r.variable)}}
function screenOf(value:unknown):{data:string}{return {data:stringOf(recordOf(value).data)}}
function errorOf(error:unknown):string{return error instanceof Error?error.message:String(error)}
function portOf(server:http.Server):number{const address=server.address();if(address===null||typeof address==='string')throw Error('HTTP server has no TCP port');return address.port}
const root=path.resolve(__dirname,'..'),android=process.argv.includes('--android'),tools='E:/daima/local-tools/DoL-Dev-Tools-Paisley-Park/6.1.0';
const out=path.join(root,'tests/artifacts/stone-free-r10',(android?'android-':'desktop-')+Date.now());fs.mkdirSync(out,{recursive:true});
const hash=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex'),report:Report={status:'running',platform:android?'Android WebView':'Windows Edge',steps:[],artifacts:{},screenshots:[]};
const H='StoneFreeHost',T='StoneFreeNativeStatus',U='StoneFreeOfficialUICandidate';
const archives={[H]:'StoneFreeHost-0.1.1-experimental.mod.zip',[T]:'StoneFreeNativeStatus-0.1.1-experimental.mod.zip',[U]:'DoLGameUI-3.0.0-lab.10.mod.zip'};
const files:Record<string,Buffer>=Object.fromEntries(Object.entries(archives).map(([key,name])=>{const bytes=fs.readFileSync(path.join(root,'dist/framework',name));report.artifacts[key]={name,bytes:bytes.length,sha256:hash(bytes)};return [key,bytes]}));
let page:Page|undefined,browser:Browser|undefined,server:http.Server|undefined,ctx:Context|undefined,client:Client|undefined,backup:Backup|undefined,installed=false,stage='startup';
function must<T>(value:T|undefined):T{if(value===undefined)throw Error('Runtime prerequisite unavailable');return value}
async function bind(){const {create}:{create(options:{serial:string;package:string},overrides:Record<string,never>,settings:{timeoutMs:number}):Context}=require(tools+'/scripts/lib/execution-context.cjs');ctx=create({serial:'0509B830099C3540',package:'com.vrelnir.dol.lyra.uicompat051213'},{},{timeoutMs:240000});client=await ctx.ensureWebview()}
const evaluate=(source:string):Promise<unknown>=>android?must(client).evaluate(source):must(page).evaluate(source);
async function wait(source:string,ms=30000){const end=Date.now()+ms;while(Date.now()<end){if(await evaluate(source))return;await new Promise(r=>setTimeout(r,150))}throw Error('Not ready: '+source)}
async function restart(){if(android){const {execute}:{execute(context:Context,action:{type:'restart'}):Promise<unknown>}=require(tools+'/scripts/lib/action.cjs');await execute(must(ctx),{type:'restart'});await must(ctx).finish();await new Promise(r=>setTimeout(r,4500));await bind()}else await must(page).reload({waitUntil:'domcontentloaded',timeout:60000});await wait('!!window.SugarCube?.State?.passage')}
async function click(selector:string){
 if(android){const {execute}:{execute(context:Context,action:{type:'web-click';selector:string}):Promise<unknown>}=require(tools+'/scripts/lib/action.cjs');await execute(must(ctx),{type:'web-click',selector})}else await must(page).locator(selector).click();
 report.steps.push({stage,type:'click',selector});await new Promise(r=>setTimeout(r,150));
}
async function input(selector:string,value:string){if(android){const {execute}:{execute(context:Context,action:{type:'web-input';selector:string;value:string}):Promise<unknown>}=require(tools+'/scripts/lib/action.cjs');await execute(must(ctx),{type:'web-input',selector,value})}else await must(page).locator(selector).fill(value);await new Promise(r=>setTimeout(r,180))}
async function shot(name:string){if(android){const result=screenOf(await must(client).send('Page.captureScreenshot',{format:'png'}));fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(result.data,'base64'))}else await must(page).screenshot({path:path.join(out,name+'.png')});report.screenshots.push(name+'.png')}
async function install(){for(const [key,bytes]of Object.entries(files)){await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController(),b=${JSON.stringify(bytes.toString('base64'))};if(typeof await c.checkModZipFileIndexDB(b)==='string')throw Error('ZIP rejected');await c.addModIndexDB(${JSON.stringify(key)},b)})()`);installed=true}await evaluate(`modSC2DataManager.getModLoadController().overwriteModIndexDBModList(${JSON.stringify([H,T,U])})`);await restart()}
async function wardrobeHash(){return hash(stringOf(await evaluate(`JSON.stringify({wardrobe:SugarCube.State.variables.wardrobe,worn:SugarCube.State.variables.worn})`)))}
async function nav(destination:string){const selector='#passages .passage:not(.passage-out) a[data-passage='+JSON.stringify(destination)+']';assert.equal(await evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`),1);await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'nearest'})`);await click(selector);await wait(`SugarCube.State.passage===${JSON.stringify(destination)}`)}
async function context(){return evaluate(`(()=>({query:document.querySelector('.dgw-tools input').value,sort:document.querySelector('.dgw-tools select').value,slot:document.querySelector('.dgw-slot-select').value,scroll:document.querySelector('.dgw-items').scrollTop,firstKey:document.querySelector('.dgw-item')?.dataset.key}))()`)}
async function run(){
 if(android){await bind();const original=backupOf(await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController();return {list:await c.listModIndexDB(),hidden:await c.loadHiddenModList(),preferences:Object.fromEntries(Object.keys(localStorage).filter(k=>['DoLGameUI.','DoLMidnightTheme.','DMTLayout.'].some(prefix=>k.startsWith(prefix))).map(k=>[k,localStorage.getItem(k)])),scene:SugarCube.State.passage,game:StartConfig.version,ui:window.DoLGameUI?.version}})()`));backup=original;assert.equal(original.game,'0.5.12.13');assert.ok(Object.keys(files).every(key=>![...original.list,...original.hidden].includes(key)));fs.writeFileSync(path.join(out,'restore.json'),JSON.stringify(original,null,2));report.initial={scene:original.scene,game:original.game,ui:original.ui}}else{
  const bytes=fs.readFileSync(path.join(root,'tests/artifacts/stone-free-distribution/input/game.html'));report.inputSha256=hash(bytes);let replacements=0;const html=bytes.toString('utf8').replace(/<script\b[^>]*>\s*window\.modDataValueZipList\s*=\s*(\[[\s\S]*?\])\s*;?\s*<\/script>/g,()=>{replacements++;return '<script>window.modDataValueZipList=[];</script>'});assert.equal(replacements,1);
  server=http.createServer((req,res)=>{if(req.url!=='/'){res.writeHead(404);return res.end()}res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html)});await new Promise<void>(resolve=>must(server).listen(0,'127.0.0.1',resolve));
  browser=await require('playwright').chromium.launch({channel:'msedge',headless:true});page=await must(browser).newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(10000);page.on('pageerror',e=>(report.errors??=[]).push({stage,text:e.message}));page.on('console',m=>{if(/warn|error/.test(m.type())&&/DoLGameUI|Stone Free/.test(m.text()))(report.console??=[]).push(m.text().slice(0,500))});await page.goto(`http://127.0.0.1:${portOf(must(server))}/`,{waitUntil:'domcontentloaded',timeout:60000});await wait('!!window.SugarCube?.State?.passage');
  if(/Welcome to Degrees of Lewdity/.test(await page.locator('#ui-dialog-title').textContent()||'')){await page.locator('#ui-dialog-body input[type=checkbox]').check();await page.locator('#ui-dialog-body').getByRole('button',{name:'Enter',exact:true}).click()}
 }
 if(!android){
  stage='missing-host entry';await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController();await c.addModIndexDB(${JSON.stringify(U)},${JSON.stringify(must(files[U]).toString('base64'))});await c.overwriteModIndexDBModList([${JSON.stringify(U)}])})()`);await restart();
  await wait(`modUtils.getModListNameNoAlias().includes('DoLGameUI')`);assert.equal(await evaluate('!!window.DoLGameUI'),false);report.missingHost={uiNotStarted:true,reported:report.console?.some(s=>s.includes('Host missing'))??false};assert.equal(report.missingHost.reported,true);stage='normal install';
 }
 await install();await wait(`window.DoLGameUI?.version==='3.0.0-lab.10'`);
 report.loaded=await evaluate(`({game:StartConfig.version,loader:modUtils.version,ui:DoLGameUI.version,host:DoLUiHost.protocolVersion,viewport:{width:innerWidth,height:innerHeight},agent:navigator.userAgent,mods:modUtils.getModListNameNoAlias().filter(n=>/StoneFree|DoLGameUI/.test(n)).map(name=>({name,version:modUtils.getMod(name).version}))})`);
 assert.equal(await evaluate('SugarCube.State.passage'),'Start');await evaluate(`document.querySelector('#settingsExit button').scrollIntoView({block:'center'})`);await click('#settingsExit button');await wait(`SugarCube.State.passage==='Start2'`);
 for(const destination of ['Orphanage Intro','Bedroom','Wardrobe'])await nav(destination);
 await wait(`!!document.querySelector('.dgw-shell')`);await click('.dgw-slots [data-slot="upper"]');await wait(`document.querySelectorAll('.dgw-reference-action').length>=2`);
 const baselineErrors=report.errors?.length??0;stage='reference';
 assert.equal(await evaluate(`DoLUiHost.getDiagnostics().mounts.filter(m=>m.owner==='SoftWetOfficialUI'&&m.lifetime==='passage').length`),1);
 await evaluate(`window.StoneFreeR10NativeList=document.querySelector('#wardrobeList')`);
 await shot('integrated-wardrobe');const before=await wardrobeHash();
  const first=firstOf(await evaluate(`[...document.querySelectorAll('[data-reference-key]')].slice(0,2).map(n=>({key:n.dataset.referenceKey,name:n.closest('.dgw-item-row').querySelector('strong').textContent}))`));assert.equal(first.length,2);
  const row=(key:string)=>'[data-reference-key='+JSON.stringify(key)+']';await click(row(must(first[0]).key));await wait(`!!document.querySelector('.dgw-reference-chip')`);
  await input('.dgw-tools input',must(first[1]).name);await wait(`document.querySelector('.dgw-reference-action')?.textContent==='对照'`);
  const bKey=stringOf(await evaluate(`document.querySelector('.dgw-reference-action').dataset.referenceKey`)),b=row(bKey);const beforeContext=await context();
 await shot('pinned-during-browse');await click('.dgw-reference-chip input');await click(b);await wait(`!!document.querySelector('.dgw-reference-compare')`);
 const plain=await evaluate(`document.querySelector('.dgw-reference-fields').textContent`);await shot('plain-comparison');await click('[data-reference-back]');
 assert.deepEqual(await context(),beforeContext);assert.equal(await evaluate(`document.activeElement?.dataset.referenceKey`),bKey);assert.equal(await evaluate(`!!document.querySelector('.dgw-reference-chip')`),true);
 await click('.dgw-reference-chip input');await click(b);await wait(`!!document.querySelector('.dgw-reference-compare')`);assert.equal(await evaluate(`document.querySelector('.dgw-reference-fields').textContent`),plain);await shot('spatial-comparison');
 await click('[data-reference-back]');await click(b);await evaluate(`document.querySelector('[data-reference-back]').click()`);await new Promise(r=>setTimeout(r,550));assert.equal(await evaluate(`!!document.querySelector('.dgw-reference-compare')`),false);assert.deepEqual(await context(),beforeContext);
 if(!android){
   await must(page).setViewportSize({width:390,height:844});if(!await evaluate('SugarCube.UIBar.isStowed()'))await click('#ui-bar-toggle');await click(b);await wait(`!!document.querySelector('.dgw-reference-compare')`);await must(page).waitForTimeout(450);
   const box=await must(page).locator('.dgw-reference-compare').boundingBox();assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=390&&box.y+box.height<=844,JSON.stringify(box));await shot('narrow-comparison');
   await click('[data-reference-back]');await must(page).emulateMedia({reducedMotion:'reduce'});await click(b);assert.equal(await evaluate(`document.getAnimations().filter(a=>a.effect?.target?.classList?.contains('dgw-reference-compare')).length`),0);await click('[data-reference-back]');await must(page).setViewportSize({width:1280,height:900});
 }
 assert.equal(await wardrobeHash(),before);report.readonly={before,after:await wardrobeHash(),contextRestored:true,plainEqualsSpatial:true};
 await click(b);await nav('Bedroom');await wait(`!document.querySelector('.dgw-reference-chip,.dgw-reference-compare,.dgw-reference-flight')`);assert.equal(await evaluate(`DoLUiHost.getDiagnostics().mounts.filter(m=>m.owner==='SoftWetOfficialUI').length`),0);
 await nav('Wardrobe');await wait(`!!document.querySelector('.dgw-shell')`);await click('.dgw-slots [data-slot="upper"]');await wait(`!!document.querySelector('.dgw-reference-action')`);assert.equal(await evaluate(`!!document.querySelector('.dgw-reference-chip')`),false);report.navigation='Natural native exit clears scene state; reentry has one owned wardrobe and no old A';
 if(!android){
  // One already-supported native wear path in a fresh game; not a new reference action.
   const expected=expectedOf(await evaluate(`(()=>{const button=document.querySelector('.dgw-item'),[slot,index]=button.dataset.key.split(':');return {slot,variable:SugarCube.State.variables.wardrobe[slot][Number(index)].variable}})()`));await click('.dgw-item-row:first-child .dgw-item');await wait(`SugarCube.State.variables.worn[${JSON.stringify(expected.slot)}].variable===${JSON.stringify(expected.variable)}`);report.quickWear={nativeWornVerified:true,slot:expected.slot};
  await evaluate(`DoLGameUI.setPreference('enabled',false)`);await wait(`!document.querySelector('.dgw-shell')`);assert.equal(await evaluate(`document.querySelector('#wardrobeList')===StoneFreeR10NativeList`),false,'Natural reentry created a new native page; old page must not be resurrected');
  await evaluate(`DoLGameUI.setPreference('enabled',true)`);await wait(`!!document.querySelector('.dgw-shell')`);
 }
 await evaluate(`DoLGameUI.destroy()`);await wait(`!window.DoLGameUI&&!document.querySelector('.dgw-shell,.dgw-reference-chip,.dgw-reference-compare,.dgw-reference-flight')`);
  const peer=peerOf(await evaluate(`(async()=>({diagnostics:DoLUiHost.getDiagnostics(),read:await DoLUiHost.sources('dol.status.experimental')[0].read(DoLUiHost.binding()),native:!!document.querySelector('#wardrobeList')}))()`));assert.ok(peer.diagnostics.participants.includes('NativeStatus'));assert.ok(!peer.diagnostics.participants.includes('SoftWetOfficialUI'));assert.equal(peer.read.ok,true);assert.equal(peer.native,true);report.release={peerLive:true,nativeRestored:true,diagnostics:peer.diagnostics};
 if(!android){
  assert.equal(report.errors?.length??0,baselineErrors,'No new page exceptions during reference/consumer exit');
   stage='classic default entry';await must(page).addStyleTag({path:path.join(root,'tests/artifacts/stone-free-r10/stable-build/game-ui.css')});await must(page).addScriptTag({path:path.join(root,'tests/artifacts/stone-free-r10/stable-build/game-ui.js')});await wait(`window.DoLGameUI?.version==='2.7.0'&&!!document.querySelector('.dgw-shell')`);
   const classic=classicOf(await evaluate(`({version:DoLGameUI.version,api:DoLGameUI.ui?.apiVersion,reference:!!document.querySelector('.dgw-reference-action'),frameworkOwners:DoLUiHost.getDiagnostics().participants})`));report.classicBranch=classic;assert.equal(classic.reference,false);assert.equal(classic.api,1);assert.ok(!classic.frameworkOwners.includes('SoftWetOfficialUI'));await evaluate(`DoLGameUI.destroy()`);
 }
 report.status='passed';
}
(async()=>{try{await run()}catch(e){report.status='failed';report.error=errorOf(e);report.failedStage=stage;try{report.failureContext=await evaluate(`(()=>({scene:SugarCube.State.passage,preferences:window.DoLGameUI?.getPreferences(),wardrobe:!!document.querySelector('.dgw-shell'),reference:!!document.querySelector('.dgw-reference-action'),native:!!document.querySelector('#wardrobeList'),diagnostics:window.DoLUiHost?.getDiagnostics(),text:document.querySelector('.dgw-root')?.innerText.slice(0,700)}))()`);await shot('failure')}catch{}throw e}
 finally{
  if(android&&client&&installed)try{const original=must(backup);await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController();for(const key of ${JSON.stringify(Object.keys(files))})await c.removeModIndexDB(key);await c.overwriteModIndexDBModList(${JSON.stringify(original.list)});await c.overwriteModIndexDBHiddenModList(${JSON.stringify(original.hidden)});for(const key of Object.keys(localStorage).filter(k=>['DoLGameUI.','DoLMidnightTheme.','DMTLayout.'].some(prefix=>k.startsWith(prefix))))if(!Object.hasOwn(${JSON.stringify(original.preferences)},key))localStorage.removeItem(key);for(const [key,value]of Object.entries(${JSON.stringify(original.preferences)}))localStorage.setItem(key,value)})()`);await restart();assert.deepEqual(await evaluate(`modSC2DataManager.getModLoadController().listModIndexDB()`),original.list);report.cleanup='original Mod lists and UI preferences restored'}catch(e){report.cleanup='failed';report.cleanupError=errorOf(e);report.status='cleanup-failed'}
  if(ctx)await ctx.finish();if(browser)await browser.close();if(server)await new Promise<void>(resolve=>server?.close(()=>resolve()));fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2));console.log(out)
 }
 assert.equal(report.status,'passed');
})().catch(e=>{console.error(e);process.exitCode=1});
