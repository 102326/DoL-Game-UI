// Actual persisted Loader installs in a fresh browser profile or the explicitly authorized test App.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto'),{execFileSync}=require('node:child_process'),{buildSync}=require('esbuild');
const root=path.resolve(__dirname,'..'),android=process.argv.includes('--android');
const normalOnly=process.argv.includes('--normal-only');
const dir=path.join(root,'tests/artifacts/stone-free-distribution',(android?'android-':'desktop-')+Date.now());fs.mkdirSync(dir,{recursive:true});
const version='0.1.1-experimental',H='StoneFreeHost',U='StoneFreeMotionHub',T='StoneFreeNativeStatus';
const sha=b=>createHash('sha256').update(b).digest('hex'),files={},records=[],report={status:'running',platform:android?'Android WebView':'Windows Edge',version,records};
function archive(name){return fs.readFileSync(path.join(root,'dist/framework',`${name}-${version}.mod.zip`))}
for(const name of [H,U,T])files[name]=archive(name);
// Explicit fixtures, not additional released versions. Preserve the old consumer JS.
const fixture=(key,base,boot,script)=>{
 const out=path.join(dir,key+'.zip'),spec=path.join(dir,key+'.json');fs.writeFileSync(spec,JSON.stringify({boot,script}));
 execFileSync('python',['-c',`import zipfile,json,sys
base,out,spec=sys.argv[1:]; s=json.load(open(spec,encoding='utf-8')); z=zipfile.ZipFile(base); f={n:z.read(n) for n in z.namelist()}; b=json.loads(f['boot.json']); b.update(s['boot']); f['boot.json']=json.dumps(b).encode()
if s['script'] is not None: f['index.js']=s['script'].encode()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as w:
 for n,v in sorted(f.items()): w.writestr(n,v)
`,base,out,spec],{windowsHide:true});files[key]=fs.readFileSync(out);
};
const candidate=name=>path.join(root,'dist/framework',`${name}-${version}.mod.zip`);
fixture('PreviousUI',path.join(root,'tests/artifacts/stone-free-distribution/baseline-41fba02',`${U}-0.1.0-experimental.mod.zip`),{version:'0.1.0-previous-fixture',dependenceInfo:[{modName:H,version:'='+version}]},null);
fixture('UpgradeHost',candidate(H),{version:'0.1.2-upgrade-fixture'},null);
fixture('UnsupportedHost',candidate(H),{version:'9.0.0-incompatible-fixture'},'window.StoneFreeBadHostExecuted=true;window.DoLUiHost={protocolVersion:"unsupported-fixture"};');
fixture('Occupied',candidate(H),{name:'StoneFreeOccupiedFixture',dependenceInfo:[]},'window.StoneFreeOccupiedExecuted=true;Object.defineProperty(window,"DoLUiHost",{configurable:true,get(){throw Error("occupied fixture")}});');
for(const [key,name,directory] of [['DispatchUI',U,'motion-hub'],['DispatchPeer',T,'native-status']])fixture(key,candidate(name),{version:'0.1.1-dispatch-fixture'},`window.${key}Executed=true;`+fs.readFileSync(path.join(root,'dist/framework',directory,'index.js'),'utf8'));
const probe=buildSync({stdin:{resolveDir:root,contents:`import {connectConsumer} from './framework/connect';
 window.StoneFreeProbeExecuted=true; export const dispose=connectConsumer(h=>{const owner=h.register('HalfInitFixture');try{owner.mount({id:'partial',parent:document.body,lifetime:'persistent',setup(c){const f=()=>window.StoneFreeLeakedListener=true;document.addEventListener('sf-fixture-probe',f);c.onCleanup(()=>document.removeEventListener('sf-fixture-probe',f));c.element.textContent='partial fixture'}});throw Error('deliberate half init')}catch(e){owner.dispose();throw e}});`},bundle:true,write:false,format:'iife',globalName:'StoneFreeHalfInitFixture'}).outputFiles[0].text;
fixture('HalfInit',candidate(H),{name:'StoneFreeHalfInitFixture',dependenceInfo:[{modName:H,version:'='+version}]},probe);
report.artifacts=Object.fromEntries(Object.entries(files).map(([key,b])=>[key,{bytes:b.length,sha256:sha(b)}]));
let page,browser,server,ctx,client,originalList,originalHidden,installed=false,logs=[],backup;
const tools='E:/daima/local-tools/DoL-Dev-Tools-Paisley-Park/6.1.0';
async function bind(){
 const {create}=require(path.join(tools,'scripts/lib/execution-context.cjs'));
 ctx=create({serial:'0509B830099C3540',package:'com.vrelnir.dol.lyra.uicompat051213'},{},{timeoutMs:90000});client=await ctx.ensureWebview();
}
async function evaluate(source){return android?client.evaluate(source):page.evaluate(source)}
async function wait(source,timeout=45000){const end=Date.now()+timeout;while(Date.now()<end){if(await evaluate(source))return;await new Promise(r=>setTimeout(r,250))}throw Error('Readiness timed out: '+source)}
async function reload(){
 if(android){const {execute}=require(path.join(tools,'scripts/lib/action.cjs'));await execute(ctx,{type:'restart'});await ctx.finish();await new Promise(r=>setTimeout(r,4500));await bind()}
 else await page.reload({waitUntil:'domcontentloaded',timeout:60000});
 await wait('!!window.modUtils && !!window.SugarCube?.State?.passage');await new Promise(r=>setTimeout(r,650));
}
async function snapshot(){return evaluate(`(()=>{let host=null,hostError=null;try{host=window.DoLUiHost}catch{hostError='access-failed'};return {scene:SugarCube.State.passage,game:StartConfig.version,loader:modUtils.version,mods:modUtils.getModListNameNoAlias().map(name=>({name,version:modUtils.getMod(name)?.version})),diagnostics:host?.protocolVersion==='0.1-experimental'?host.getDiagnostics():null,hostError,badExecuted:!!window.StoneFreeBadHostExecuted,occupiedExecuted:!!window.StoneFreeOccupiedExecuted,halfExecuted:!!window.StoneFreeProbeExecuted,hubScript:!!document.querySelector('.sf-motion-ball')||!!window.DispatchUIExecuted,peerScript:!!document.querySelector('[data-sf-owner="NativeStatus"]')||!!window.DispatchPeerExecuted,values:Object.fromEntries(['money','pain','stress','tiredness'].map(k=>[k,SugarCube.State.variables[k]??null]))}})()`)}
async function install(keys){
 logs=[];
 for(const key of keys){const base64=files[key].toString('base64');
  const result=await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController(),data=${JSON.stringify(base64)},boot=await c.checkModZipFileIndexDB(data);if(typeof boot==='string')throw Error('ZIP rejected');await c.addModIndexDB(${JSON.stringify(key)},data);return boot.name})()`);assert.ok(result);
 }
 installed=true;await evaluate(`modSC2DataManager.getModLoadController().overwriteModIndexDBModList(${JSON.stringify(keys)})`);await reload();
}
async function observe(name,keys,assertion){await install(keys);const state=await snapshot();const record={name,keys,state,dependencyLogs:[...logs]};records.push(record);await assertion(state,record);record.status='passed';console.log('PASS',name);fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2))}
function peerLive(s){assert.ok(s.diagnostics?.participants.includes('NativeStatus'));assert.equal(s.peerScript,true)}
async function click(selector){
 if(android){const {execute}=require(path.join(tools,'scripts/lib/action.cjs'));await execute(ctx,{type:'web-click',selector})}
 else await page.locator(selector).click();
 await new Promise(r=>setTimeout(r,600));
}
async function usePeer(){const value=await evaluate(`DoLUiHost.sources('dol.status.experimental')[0].read(DoLUiHost.binding())`);assert.equal(value.ok,true);return value}
async function naturalNavigation(){
 const selector='#settingsExit button';
 const before=await evaluate(`(()=>{const nodes=[...document.querySelectorAll(${JSON.stringify(selector)})];return {scene:SugarCube.State.passage,buttons:nodes.map(n=>({text:n.textContent,tag:n.tagName})),links:[...document.querySelectorAll('#passages a.link-internal')].map(n=>({text:n.textContent,passage:n.dataset.passage})).slice(-12)}})()`);
 report.navigation={before};assert.equal(before.scene,'Start','Natural navigation requires the reviewed original start scene');
 assert.equal(before.buttons.length,1,JSON.stringify(before));assert.match(before.buttons[0].text,/Start Game|开始游戏/);
 await click('.sf-motion-ball');await click('[data-motion-view="StoneFreeMotionHub:status"]');
 assert.equal(await evaluate('!!document.querySelector(".sf-motion-sheet.is-open main [data-sf-mount]")'),true);
 await click('.sf-motion-sheet header button');
 await evaluate(`(()=>{const h=DoLUiHost,binding=h.binding(),owner=h.register('DistributionNavigationProbe');window.StoneFreeNavigationProbe={binding,owner,command:h.commands('dol.reading.experimental')[0],cleaned:0};owner.mount({id:'scene',parent:document.querySelector('#passages .passage:not(.passage-out)'),lifetime:'passage',setup(c){c.onCleanup(()=>StoneFreeNavigationProbe.cleaned++)}});document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})})()`);
 await click(selector);await wait("SugarCube.State.passage !== 'Start'");
 report.navigation.after=await evaluate(`(async()=>{const p=StoneFreeNavigationProbe;return {scene:SugarCube.State.passage,current:p.binding.isCurrent(),aborted:p.binding.signal.aborted,cleaned:p.cleaned,oldCommand:await p.command.invoke(p.binding),diagnostics:DoLUiHost.getDiagnostics()}})()`);
 assert.equal(report.navigation.after.current,false);assert.equal(report.navigation.after.aborted,true);assert.equal(report.navigation.after.cleaned,1);assert.equal(report.navigation.after.oldCommand.status,'stale');
 assert.ok(report.navigation.after.diagnostics.participants.includes(U));await usePeer();
 await evaluate('StoneFreeNavigationProbe.owner.dispose();delete window.StoneFreeNavigationProbe');
 if(!android)await page.screenshot({path:path.join(dir,'natural-navigation.png')});
}
(async()=>{try{
 if(android){await bind();backup=await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController();return {list:await c.listModIndexDB(),hidden:await c.loadHiddenModList(),scene:SugarCube.State.passage,game:StartConfig.version,ui:window.DoLGameUI?.version}})()`);assert.equal(backup.game,'0.5.12.13');originalList=backup.list;originalHidden=backup.hidden;
  assert.ok(Object.keys(files).every(key=>!originalList.includes(key)),'Research storage keys already exist; refuse overwrite');fs.writeFileSync(path.join(dir,'restore-list.json'),JSON.stringify(backup,null,2));
  report.initial=backup;
 }else{
  const game=process.argv[2];assert.ok(game&&fs.existsSync(game),'Pass owned compiled HTML');const input=fs.readFileSync(game);report.input={path:path.resolve(game),sha256:sha(input)};
  const pattern=/<script\b[^>]*>\s*window\.modDataValueZipList\s*=\s*(\[[\s\S]*?\])\s*;?\s*<\/script>/g;let replacements=0;
  const html=input.toString('utf8').replace(pattern,()=>{replacements++;return '<script>window.modDataValueZipList=[];</script>'});assert.equal(replacements,1);
  server=http.createServer((req,res)=>{if(req.url!=='/'){res.writeHead(404);return res.end()}res.setHeader('Content-Type','text/html;charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const {chromium}=require('playwright');browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('console',m=>{if(/DependenceChecker|Consumer unavailable/.test(m.text()))logs.push({type:m.type(),text:m.text().slice(0,700)})});page.on('pageerror',e=>{(report.pageErrors??=[]).push(e.message.slice(0,300))});
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded',timeout:60000});await wait('!!window.modSC2DataManager?.getModLoadController && !!window.SugarCube?.State?.passage',60000);
  // The user already completed the native adult confirmation in the authorized test environment.
  // Use the original controls in this fresh desktop profile; do not write its confirmation flag.
  const title=await page.locator('#ui-dialog-title').textContent();if(/Welcome to Degrees of Lewdity/.test(title||'')){await page.locator('#ui-dialog-body input[type="checkbox"]').check();await page.locator('#ui-dialog-body').getByRole('button',{name:'Enter',exact:true}).click();await page.waitForTimeout(300);report.nativeConfirmation='Original checkbox and Enter controls, fresh test profile'}
  originalList=await evaluate('modSC2DataManager.getModLoadController().listModIndexDB()');assert.deepEqual(originalList,[]);report.initial=await snapshot();
 }
 if(android)await observe('Native baseline with no research Mods',[],async s=>{report.nativeValues=s.values});
 await observe('A1 Host alone',[H],async s=>{assert.equal(s.diagnostics.participants.length,0);assert.ok(!s.mods.some(m=>m.name==='DoLGameUI'));report.hostOnlyValues=s.values;assert.deepEqual(s.values,android?report.nativeValues:report.initial.values)});
 await observe('A1 Host plus independent T',[H,T],async s=>{peerLive(s);assert.ok(!s.mods.some(m=>m.name==='DoLGameUI'));await usePeer()});
 if(!normalOnly){
 await observe('A1 coexistence, previous UI fixture',[H,T,'PreviousUI'],async s=>{peerLive(s);assert.ok(s.diagnostics.participants.includes(U));await usePeer()});
 await observe('A2 update U; H and T unchanged',[H,T,U],async(s,r)=>{peerLive(s);assert.ok(s.diagnostics.participants.includes(U));assert.equal(s.mods.find(m=>m.name===U).version,version);const before=await usePeer();
  await click('.sf-motion-ball');await click('.sf-motion-utilities button:last-child');r.release=await evaluate(`(()=>({diagnostics:DoLUiHost.getDiagnostics(),dom:document.querySelectorAll('[data-sf-owner="StoneFreeMotionHub"]').length}))()`);assert.equal(r.release.dom,0);assert.ok(!r.release.diagnostics.participants.includes(U));assert.ok(r.release.diagnostics.participants.includes('NativeStatus'));assert.equal((await usePeer()).ok,before.ok);
 });
 await observe('A2 disable U and restart',[H,T],async s=>{peerLive(s);assert.equal(s.hubScript,false);await usePeer()});
 await observe('A2 restore U and restart',[H,T,U],async s=>{peerLive(s);assert.equal(s.diagnostics.participants.filter(x=>x===U).length,1)});
 await observe('A3 new Host upgrade fixture, old U and T bytes unchanged',['UpgradeHost',T,U],async s=>{peerLive(s);assert.ok(s.diagnostics.participants.includes(U));await usePeer()});
 await observe('A4 missing Host, dispatch-instrumented consumers',['DispatchUI','DispatchPeer'],async s=>{assert.equal(s.diagnostics,null);assert.equal(s.hubScript,true);assert.equal(s.peerScript,true)});
 await observe('A4 unsupported Host, dispatch-instrumented consumers',['UnsupportedHost','DispatchUI','DispatchPeer'],async s=>{assert.equal(s.badExecuted,true);assert.equal(s.diagnostics,null);assert.equal(s.hubScript,true);assert.equal(s.peerScript,true)});
 await observe('A4 reversed order',[U,T,H],async s=>{peerLive(s);assert.ok(s.diagnostics.participants.includes(U));await usePeer()});
 await observe('A4 duplicate same-name Host in storage',[H,'UpgradeHost',T,U],async s=>{peerLive(s);assert.equal(s.mods.filter(m=>m.name===H).length,1);assert.equal(s.mods.find(m=>m.name===H).version,'0.1.2-upgrade-fixture')});
 await observe('A4 occupied global name',['Occupied',H,'DispatchPeer','DispatchUI'],async s=>{assert.equal(s.occupiedExecuted,true);assert.equal(s.hostError,'access-failed');assert.equal(s.diagnostics,null);assert.equal(s.hubScript,true)});
 await observe('A5 half-initialization fixture',[H,T,U,'HalfInit'],async(s,r)=>{peerLive(s);assert.equal(s.halfExecuted,true);assert.ok(!s.diagnostics.participants.includes('HalfInitFixture'));r.leak=await evaluate(`(()=>{document.dispatchEvent(new Event('sf-fixture-probe'));return {listener:!!window.StoneFreeLeakedListener,dom:document.querySelectorAll('[data-sf-owner="HalfInitFixture"]').length}})()`);assert.deepEqual(r.leak,{listener:false,dom:0});await usePeer()});
 }
 await observe('Final paired installation restored',[H,T,U],async s=>{peerLive(s);assert.ok(s.diagnostics.participants.includes(U))});
 await naturalNavigation();
 report.status='passed';
}catch(error){report.status='failed';report.error=error.message;throw error}
finally{
 if(android&&client)try{if(installed){await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController();for(const key of ${JSON.stringify(Object.keys(files))})await c.removeModIndexDB(key);await c.overwriteModIndexDBModList(${JSON.stringify(originalList)});await c.overwriteModIndexDBHiddenModList(${JSON.stringify(originalHidden)});return true})()`);await reload();report.restored=await snapshot();assert.ok(report.restored.mods.some(m=>m.name==='DoLGameUI'));assert.equal(await evaluate(`(async()=>JSON.stringify(await modSC2DataManager.getModLoadController().listModIndexDB())===${JSON.stringify(JSON.stringify(originalList))})()`),true)}report.cleanup='restored'}catch(e){report.cleanup='failed';report.cleanupError=e.message;report.status='cleanup-failed'}
 if(ctx)await ctx.finish();if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2));console.log(dir);
}
assert.equal(report.status,'passed');})().catch(e=>{console.error(e);process.exitCode=1});
