// Actual persisted Loader installs in a fresh browser profile or the explicitly authorized test App.
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import assert = require('node:assert/strict');
import crypto = require('node:crypto');
import child = require('node:child_process');
import esbuild = require('esbuild');
import type {Browser, Page} from 'playwright';
const {createHash}=crypto,{execFileSync}=child,{buildSync}=esbuild;
type Client={evaluate(source:string):Promise<unknown>};
type Context={ensureWebview():Promise<Client>;finish():Promise<unknown>};
type NativeValues=Record<string,number|null>;
type Snapshot={scene:string;game:string;loader:string;mods:Array<{name:string;version:string}>;diagnostics:{participants:string[]}|null;hostError:string|null;badExecuted:boolean;occupiedExecuted:boolean;halfExecuted:boolean;hubScript:boolean;peerScript:boolean;values:NativeValues};
type Backup={list:string[];hidden:string[];scene:string;game:string;ui?:string};
type RecordCase={name:string;keys:string[];state:Snapshot;dependencyLogs:Array<{type:string;text:string}>;status?:string;release?:{diagnostics:{participants:string[]};dom:number};leak?:{listener:boolean;dom:number}};
type Navigation={before:{scene:string;buttons:Array<{text:string;tag:string}>;links:unknown[]};after?:{scene:string;current:boolean;aborted:boolean;cleaned:number;oldCommand:{status:string};diagnostics:{participants:string[]}}};
type Report={status:string;platform:string;version:string;records:RecordCase[];artifacts?:Record<string,{bytes:number;sha256:string}>;navigation?:Navigation;initial?:unknown;input?:{path:string;sha256:string};nativeConfirmation?:string;nativeValues?:NativeValues;hostOnlyValues?:NativeValues;pageErrors?:string[];error?:string;restored?:Snapshot;cleanup?:string;cleanupError?:string};
function recordOf(value:unknown):Record<string,unknown>{if(value===null||typeof value!=='object'||Array.isArray(value))throw Error('Expected object');return Object.fromEntries(Object.entries(value))}
function stringOf(value:unknown):string{if(typeof value!=='string')throw Error('Expected string');return value}
function numberOf(value:unknown):number{if(typeof value!=='number'||!Number.isFinite(value))throw Error('Expected number');return value}
function booleanOf(value:unknown):boolean{if(typeof value!=='boolean')throw Error('Expected boolean');return value}
function stringsOf(value:unknown):string[]{if(!Array.isArray(value)||!value.every(x=>typeof x==='string'))throw Error('Expected strings');return value}
function arrayOf(value:unknown):unknown[]{if(!Array.isArray(value))throw Error('Expected array');return value}
function optionalString(value:unknown):string|undefined{return value===undefined?undefined:stringOf(value)}
function valuesOf(value:unknown):NativeValues{const r=recordOf(value),result:NativeValues={};for(const [key,item]of Object.entries(r))result[key]=item===null?null:numberOf(item);return result}
function snapshotOf(value:unknown):Snapshot{const r=recordOf(value),d=r.diagnostics===null?null:recordOf(r.diagnostics);return {scene:stringOf(r.scene),game:stringOf(r.game),loader:stringOf(r.loader),mods:arrayOf(r.mods).map(item=>{const m=recordOf(item);return {name:stringOf(m.name),version:stringOf(m.version)}}),diagnostics:d===null?null:{...d,participants:stringsOf(d.participants)},hostError:r.hostError===null?null:stringOf(r.hostError),badExecuted:booleanOf(r.badExecuted),occupiedExecuted:booleanOf(r.occupiedExecuted),halfExecuted:booleanOf(r.halfExecuted),hubScript:booleanOf(r.hubScript),peerScript:booleanOf(r.peerScript),values:valuesOf(r.values)}}
function backupOf(value:unknown):Backup{const r=recordOf(value);return {list:stringsOf(r.list),hidden:stringsOf(r.hidden),scene:stringOf(r.scene),game:stringOf(r.game),ui:optionalString(r.ui)}}
function peerOf(value:unknown):{ok:boolean}{return {ok:booleanOf(recordOf(value).ok)}}
function navigationBeforeOf(value:unknown):Navigation['before']{const r=recordOf(value);return {scene:stringOf(r.scene),buttons:arrayOf(r.buttons).map(item=>{const b=recordOf(item);return {text:stringOf(b.text),tag:stringOf(b.tag)}}),links:arrayOf(r.links)}}
function navigationAfterOf(value:unknown):NonNullable<Navigation['after']>{const r=recordOf(value),cmd=recordOf(r.oldCommand),diag=recordOf(r.diagnostics);return {...r,scene:stringOf(r.scene),current:booleanOf(r.current),aborted:booleanOf(r.aborted),cleaned:numberOf(r.cleaned),oldCommand:{...cmd,status:stringOf(cmd.status)},diagnostics:{...diag,participants:stringsOf(diag.participants)}}}
function releaseOf(value:unknown):NonNullable<RecordCase['release']>{const r=recordOf(value),d=recordOf(r.diagnostics);return {...r,diagnostics:{...d,participants:stringsOf(d.participants)},dom:numberOf(r.dom)}}
function leakOf(value:unknown):NonNullable<RecordCase['leak']>{const r=recordOf(value);return {listener:booleanOf(r.listener),dom:numberOf(r.dom)}}
function errorOf(error:unknown):string{return error instanceof Error?error.message:String(error)}
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Runtime prerequisite unavailable');return value}
function portOf(server:http.Server):number{const address=server.address();if(address===null||typeof address==='string')throw Error('HTTP server has no TCP port');return address.port}
const root=path.resolve(__dirname,'..'),android=process.argv.includes('--android');
const normalOnly=process.argv.includes('--normal-only');
const dir=path.join(root,'tests/artifacts/stone-free-distribution',(android?'android-':'desktop-')+Date.now());fs.mkdirSync(dir,{recursive:true});
const version='0.1.1-experimental',H='StoneFreeHost',U='StoneFreeMotionHub',T='StoneFreeNativeStatus';
const sha=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex'),files:Record<string,Buffer>={},records:RecordCase[]=[],report:Report={status:'running',platform:android?'Android WebView':'Windows Edge',version,records};
function archive(name:string){return fs.readFileSync(path.join(root,'dist/framework',`${name}-${version}.mod.zip`))}
for(const name of [H,U,T])files[name]=archive(name);
// Explicit fixtures, not additional released versions. Preserve the old consumer JS.
const fixture=(key:string,base:string,boot:Record<string,unknown>,script:string|null)=>{
 const out=path.join(dir,key+'.zip'),spec=path.join(dir,key+'.json');fs.writeFileSync(spec,JSON.stringify({boot,script}));
 execFileSync('python',['-c',`import zipfile,json,sys
base,out,spec=sys.argv[1:]; s=json.load(open(spec,encoding='utf-8')); z=zipfile.ZipFile(base); f={n:z.read(n) for n in z.namelist()}; b=json.loads(f['boot.json']); b.update(s['boot']); f['boot.json']=json.dumps(b).encode()
if s['script'] is not None: f['index.js']=s['script'].encode()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as w:
 for n,v in sorted(f.items()): w.writestr(n,v)
`,base,out,spec],{windowsHide:true});files[key]=fs.readFileSync(out);
};
const candidate=(name:string)=>path.join(root,'dist/framework',`${name}-${version}.mod.zip`);
fixture('PreviousUI',path.join(root,'tests/artifacts/stone-free-distribution/baseline-41fba02',`${U}-0.1.0-experimental.mod.zip`),{version:'0.1.0-previous-fixture',dependenceInfo:[{modName:H,version:'='+version}]},null);
fixture('UpgradeHost',candidate(H),{version:'0.1.2-upgrade-fixture'},null);
fixture('UnsupportedHost',candidate(H),{version:'9.0.0-incompatible-fixture'},'window.StoneFreeBadHostExecuted=true;window.DoLUiHost={protocolVersion:"unsupported-fixture"};');
fixture('Occupied',candidate(H),{name:'StoneFreeOccupiedFixture',dependenceInfo:[]},'window.StoneFreeOccupiedExecuted=true;Object.defineProperty(window,"DoLUiHost",{configurable:true,get(){throw Error("occupied fixture")}});');
const dispatchFixtures:Array<[string,string,string]>=[['DispatchUI',U,'motion-hub'],['DispatchPeer',T,'native-status']];for(const [key,name,directory] of dispatchFixtures)fixture(key,candidate(name),{version:'0.1.1-dispatch-fixture'},`window.${key}Executed=true;`+fs.readFileSync(path.join(root,'dist/framework',directory,'index.js'),'utf8'));
const probe=must(buildSync({stdin:{resolveDir:root,contents:`import {connectConsumer} from './framework/connect';
 window.StoneFreeProbeExecuted=true; export const dispose=connectConsumer(h=>{const owner=h.register('HalfInitFixture');try{owner.mount({id:'partial',parent:document.body,lifetime:'persistent',setup(c){const f=()=>window.StoneFreeLeakedListener=true;document.addEventListener('sf-fixture-probe',f);c.onCleanup(()=>document.removeEventListener('sf-fixture-probe',f));c.element.textContent='partial fixture'}});throw Error('deliberate half init')}catch(e){owner.dispose();throw e}});`},bundle:true,write:false,format:'iife',globalName:'StoneFreeHalfInitFixture'}).outputFiles[0]).text;
fixture('HalfInit',candidate(H),{name:'StoneFreeHalfInitFixture',dependenceInfo:[{modName:H,version:'='+version}]},probe);
report.artifacts=Object.fromEntries(Object.entries(files).map(([key,b])=>[key,{bytes:b.length,sha256:sha(b)}]));
let page:Page|undefined,browser:Browser|undefined,server:http.Server|undefined,ctx:Context|undefined,client:Client|undefined,originalList:string[]|undefined,originalHidden:string[]|undefined,installed=false,logs:Array<{type:string;text:string}>=[],backup:Backup|undefined,initialSnapshot:Snapshot|undefined;
const tools='E:/daima/local-tools/DoL-Dev-Tools-Paisley-Park/6.1.0';
async function bind(){
 const {create}:{create(options:{serial:string;package:string},overrides:Record<string,never>,settings:{timeoutMs:number}):Context}=require(path.join(tools,'scripts/lib/execution-context.cjs'));
 ctx=create({serial:'0509B830099C3540',package:'com.vrelnir.dol.lyra.uicompat051213'},{},{timeoutMs:90000});client=await ctx.ensureWebview();
}
async function evaluate(source:string):Promise<unknown>{return android?must(client).evaluate(source):must(page).evaluate(source)}
async function wait(source:string,timeout=45000){const end=Date.now()+timeout;while(Date.now()<end){if(await evaluate(source))return;await new Promise(r=>setTimeout(r,250))}throw Error('Readiness timed out: '+source)}
async function reload(){
 if(android){const {execute}:{execute(context:Context,action:{type:'restart'}):Promise<unknown>}=require(path.join(tools,'scripts/lib/action.cjs'));await execute(must(ctx),{type:'restart'});await must(ctx).finish();await new Promise(r=>setTimeout(r,4500));await bind()}
 else await must(page).reload({waitUntil:'domcontentloaded',timeout:60000});
 await wait('!!window.modUtils && !!window.SugarCube?.State?.passage');await new Promise(r=>setTimeout(r,650));
}
async function snapshot():Promise<Snapshot>{return snapshotOf(await evaluate(`(()=>{let host=null,hostError=null;try{host=window.DoLUiHost}catch{hostError='access-failed'};return {scene:SugarCube.State.passage,game:StartConfig.version,loader:modUtils.version,mods:modUtils.getModListNameNoAlias().map(name=>({name,version:modUtils.getMod(name)?.version})),diagnostics:host?.protocolVersion==='0.1-experimental'?host.getDiagnostics():null,hostError,badExecuted:!!window.StoneFreeBadHostExecuted,occupiedExecuted:!!window.StoneFreeOccupiedExecuted,halfExecuted:!!window.StoneFreeProbeExecuted,hubScript:!!document.querySelector('.sf-motion-ball')||!!window.DispatchUIExecuted,peerScript:!!document.querySelector('[data-sf-owner="NativeStatus"]')||!!window.DispatchPeerExecuted,values:Object.fromEntries(['money','pain','stress','tiredness'].map(k=>[k,SugarCube.State.variables[k]??null]))}})()`))}
async function install(keys:string[]){
 logs=[];
 for(const key of keys){const base64=must(files[key]).toString('base64');
  const result=await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController(),data=${JSON.stringify(base64)},boot=await c.checkModZipFileIndexDB(data);if(typeof boot==='string')throw Error('ZIP rejected');await c.addModIndexDB(${JSON.stringify(key)},data);return boot.name})()`);assert.ok(result);
 }
 installed=true;await evaluate(`modSC2DataManager.getModLoadController().overwriteModIndexDBModList(${JSON.stringify(keys)})`);await reload();
}
async function observe(name:string,keys:string[],assertion:(state:Snapshot,record:RecordCase)=>Promise<void>){await install(keys);const state=await snapshot();const record:RecordCase={name,keys,state,dependencyLogs:[...logs]};records.push(record);await assertion(state,record);record.status='passed';console.log('PASS',name);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2))}
function peerLive(s:Snapshot){assert.ok(s.diagnostics?.participants.includes('NativeStatus'));assert.equal(s.peerScript,true)}
async function click(selector:string){
 if(android){const {execute}:{execute(context:Context,action:{type:'web-click';selector:string}):Promise<unknown>}=require(path.join(tools,'scripts/lib/action.cjs'));await execute(must(ctx),{type:'web-click',selector})}
 else await must(page).locator(selector).click();
 await new Promise(r=>setTimeout(r,600));
}
async function usePeer(){const value=peerOf(await evaluate(`DoLUiHost.sources('dol.status.experimental')[0].read(DoLUiHost.binding())`));assert.equal(value.ok,true);return value}
async function naturalNavigation(){
 const selector='#settingsExit button';
 const before=navigationBeforeOf(await evaluate(`(()=>{const nodes=[...document.querySelectorAll(${JSON.stringify(selector)})];return {scene:SugarCube.State.passage,buttons:nodes.map(n=>({text:n.textContent,tag:n.tagName})),links:[...document.querySelectorAll('#passages a.link-internal')].map(n=>({text:n.textContent,passage:n.dataset.passage})).slice(-12)}})()`));
 report.navigation={before};assert.equal(before.scene,'Start','Natural navigation requires the reviewed original start scene');
 assert.equal(before.buttons.length,1,JSON.stringify(before));assert.match(must(before.buttons[0]).text,/Start Game|开始游戏/);
 await click('.sf-motion-ball');await click('[data-motion-view="StoneFreeMotionHub:status"]');
 assert.equal(await evaluate('!!document.querySelector(".sf-motion-sheet.is-open main [data-sf-mount]")'),true);
 await click('.sf-motion-sheet header button');
 await evaluate(`(()=>{const h=DoLUiHost,binding=h.binding(),owner=h.register('DistributionNavigationProbe');window.StoneFreeNavigationProbe={binding,owner,command:h.commands('dol.reading.experimental')[0],cleaned:0};owner.mount({id:'scene',parent:document.querySelector('#passages .passage:not(.passage-out)'),lifetime:'passage',setup(c){c.onCleanup(()=>StoneFreeNavigationProbe.cleaned++)}});document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})})()`);
 await click(selector);await wait("SugarCube.State.passage !== 'Start'");
 const after=navigationAfterOf(await evaluate(`(async()=>{const p=StoneFreeNavigationProbe;return {scene:SugarCube.State.passage,current:p.binding.isCurrent(),aborted:p.binding.signal.aborted,cleaned:p.cleaned,oldCommand:await p.command.invoke(p.binding),diagnostics:DoLUiHost.getDiagnostics()}})()`));report.navigation.after=after;
 assert.equal(after.current,false);assert.equal(after.aborted,true);assert.equal(after.cleaned,1);assert.equal(after.oldCommand.status,'stale');
 assert.ok(after.diagnostics.participants.includes(U));await usePeer();
 await evaluate('StoneFreeNavigationProbe.owner.dispose();delete window.StoneFreeNavigationProbe');
 if(!android)await must(page).screenshot({path:path.join(dir,'natural-navigation.png')});
}
(async()=>{try{
 if(android){await bind();const original=backupOf(await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController();return {list:await c.listModIndexDB(),hidden:await c.loadHiddenModList(),scene:SugarCube.State.passage,game:StartConfig.version,ui:window.DoLGameUI?.version}})()`));backup=original;assert.equal(original.game,'0.5.12.13');originalList=original.list;originalHidden=original.hidden;
  assert.ok(Object.keys(files).every(key=>!must(originalList).includes(key)),'Research storage keys already exist; refuse overwrite');fs.writeFileSync(path.join(dir,'restore-list.json'),JSON.stringify(backup,null,2));
  report.initial=backup;
 }else{
  const game=process.argv[2];assert.ok(game&&fs.existsSync(game),'Pass owned compiled HTML');const input=fs.readFileSync(game);report.input={path:path.resolve(game),sha256:sha(input)};
  const pattern=/<script\b[^>]*>\s*window\.modDataValueZipList\s*=\s*(\[[\s\S]*?\])\s*;?\s*<\/script>/g;let replacements=0;
  const html=input.toString('utf8').replace(pattern,()=>{replacements++;return '<script>window.modDataValueZipList=[];</script>'});assert.equal(replacements,1);
  server=http.createServer((req,res)=>{if(req.url!=='/'){res.writeHead(404);return res.end()}res.setHeader('Content-Type','text/html;charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(html)});await new Promise<void>(resolve=>must(server).listen(0,'127.0.0.1',resolve));
  const {chromium}=require('playwright');browser=await chromium.launch({channel:'msedge',headless:true});page=await must(browser).newPage({viewport:{width:1280,height:900}});
  page.on('console',m=>{if(/DependenceChecker|Consumer unavailable/.test(m.text()))logs.push({type:m.type(),text:m.text().slice(0,700)})});page.on('pageerror',e=>{(report.pageErrors??=[]).push(e.message.slice(0,300))});
  await must(page).goto(`http://127.0.0.1:${portOf(must(server))}/`,{waitUntil:'domcontentloaded',timeout:60000});await wait('!!window.modSC2DataManager?.getModLoadController && !!window.SugarCube?.State?.passage',60000);
  // The user already completed the native adult confirmation in the authorized test environment.
  // Use the original controls in this fresh desktop profile; do not write its confirmation flag.
  const title=await must(page).locator('#ui-dialog-title').textContent();if(/Welcome to Degrees of Lewdity/.test(title||'')){await must(page).locator('#ui-dialog-body input[type="checkbox"]').check();await must(page).locator('#ui-dialog-body').getByRole('button',{name:'Enter',exact:true}).click();await must(page).waitForTimeout(300);report.nativeConfirmation='Original checkbox and Enter controls, fresh test profile'}
  originalList=stringsOf(await evaluate('modSC2DataManager.getModLoadController().listModIndexDB()'));assert.deepEqual(originalList,[]);initialSnapshot=await snapshot();report.initial=initialSnapshot;
 }
 if(android)await observe('Native baseline with no research Mods',[],async s=>{report.nativeValues=s.values});
 await observe('A1 Host alone',[H],async s=>{assert.equal(must(s.diagnostics).participants.length,0);assert.ok(!s.mods.some(m=>m.name==='DoLGameUI'));report.hostOnlyValues=s.values;assert.deepEqual(s.values,android?report.nativeValues:must(initialSnapshot).values)});
 await observe('A1 Host plus independent T',[H,T],async s=>{peerLive(s);assert.ok(!s.mods.some(m=>m.name==='DoLGameUI'));await usePeer()});
 if(!normalOnly){
 await observe('A1 coexistence, previous UI fixture',[H,T,'PreviousUI'],async s=>{peerLive(s);assert.ok(must(s.diagnostics).participants.includes(U));await usePeer()});
 await observe('A2 update U; H and T unchanged',[H,T,U],async(s,r)=>{peerLive(s);assert.ok(must(s.diagnostics).participants.includes(U));assert.equal(must(s.mods.find(m=>m.name===U)).version,version);const before=await usePeer();
  await click('.sf-motion-ball');await click('.sf-motion-utilities button:last-child');r.release=releaseOf(await evaluate(`(()=>({diagnostics:DoLUiHost.getDiagnostics(),dom:document.querySelectorAll('[data-sf-owner="StoneFreeMotionHub"]').length}))()`));assert.equal(must(r.release).dom,0);assert.ok(!must(r.release).diagnostics.participants.includes(U));assert.ok(must(r.release).diagnostics.participants.includes('NativeStatus'));assert.equal((await usePeer()).ok,before.ok);
 });
 await observe('A2 disable U and restart',[H,T],async s=>{peerLive(s);assert.equal(s.hubScript,false);await usePeer()});
 await observe('A2 restore U and restart',[H,T,U],async s=>{peerLive(s);assert.equal(must(s.diagnostics).participants.filter(x=>x===U).length,1)});
 await observe('A3 new Host upgrade fixture, old U and T bytes unchanged',['UpgradeHost',T,U],async s=>{peerLive(s);assert.ok(must(s.diagnostics).participants.includes(U));await usePeer()});
 await observe('A4 missing Host, dispatch-instrumented consumers',['DispatchUI','DispatchPeer'],async s=>{assert.equal(s.diagnostics,null);assert.equal(s.hubScript,true);assert.equal(s.peerScript,true)});
 await observe('A4 unsupported Host, dispatch-instrumented consumers',['UnsupportedHost','DispatchUI','DispatchPeer'],async s=>{assert.equal(s.badExecuted,true);assert.equal(s.diagnostics,null);assert.equal(s.hubScript,true);assert.equal(s.peerScript,true)});
 await observe('A4 reversed order',[U,T,H],async s=>{peerLive(s);assert.ok(must(s.diagnostics).participants.includes(U));await usePeer()});
 await observe('A4 duplicate same-name Host in storage',[H,'UpgradeHost',T,U],async s=>{peerLive(s);assert.equal(s.mods.filter(m=>m.name===H).length,1);assert.equal(must(s.mods.find(m=>m.name===H)).version,'0.1.2-upgrade-fixture')});
 await observe('A4 occupied global name',['Occupied',H,'DispatchPeer','DispatchUI'],async s=>{assert.equal(s.occupiedExecuted,true);assert.equal(s.hostError,'access-failed');assert.equal(s.diagnostics,null);assert.equal(s.hubScript,true)});
 await observe('A5 half-initialization fixture',[H,T,U,'HalfInit'],async(s,r)=>{peerLive(s);assert.equal(s.halfExecuted,true);assert.ok(!must(s.diagnostics).participants.includes('HalfInitFixture'));r.leak=leakOf(await evaluate(`(()=>{document.dispatchEvent(new Event('sf-fixture-probe'));return {listener:!!window.StoneFreeLeakedListener,dom:document.querySelectorAll('[data-sf-owner="HalfInitFixture"]').length}})()`));assert.deepEqual(r.leak,{listener:false,dom:0});await usePeer()});
 }
 await observe('Final paired installation restored',[H,T,U],async s=>{peerLive(s);assert.ok(must(s.diagnostics).participants.includes(U))});
 await naturalNavigation();
 report.status='passed';
}catch(error){report.status='failed';report.error=errorOf(error);throw error}
finally{
 if(android&&client)try{if(installed){await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController();for(const key of ${JSON.stringify(Object.keys(files))})await c.removeModIndexDB(key);await c.overwriteModIndexDBModList(${JSON.stringify(originalList)});await c.overwriteModIndexDBHiddenModList(${JSON.stringify(originalHidden)});return true})()`);await reload();report.restored=await snapshot();assert.ok(must(report.restored).mods.some(m=>m.name==='DoLGameUI'));assert.equal(await evaluate(`(async()=>JSON.stringify(await modSC2DataManager.getModLoadController().listModIndexDB())===${JSON.stringify(JSON.stringify(originalList))})()`),true)}report.cleanup='restored'}catch(e){report.cleanup='failed';report.cleanupError=errorOf(e);report.status='cleanup-failed'}
 if(ctx)await ctx.finish();if(browser)await browser.close();if(server)await new Promise<void>(resolve=>server?.close(()=>resolve()));fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2));console.log(dir);
}
assert.equal(report.status,'passed');})().catch(e=>{console.error(e);process.exitCode=1});
