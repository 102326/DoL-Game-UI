// Real, caller-owned compiled DoL; new browser context/origin; no user storage.
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import assert = require('node:assert/strict');
import crypto = require('node:crypto');
import playwright = require('playwright');
import childProcess = require('node:child_process');
import type {Host} from '../framework/contracts';
declare const DoLUiHost:Readonly<Host>;
declare const StartConfig:{version:string};
declare const modUtils:{version:string;getModListNameNoAlias():string[];getMod(name:string):{version?:string}|undefined};
declare const SugarCube:{version:unknown;State:{variables:Record<string,unknown>}};
declare function jQuery(doc:Document):{triggerHandler(event:string):void};
const {createHash}=crypto,{chromium}=playwright,{execFileSync}=childProcess;
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing framework-game fixture value');return value}
function bootName(value:unknown):string{if(value===null||typeof value!=='object'||!('name' in value)||typeof value.name!=='string')throw Error('Invalid author boot JSON');return value.name}
function versionOf(value:unknown):string{if(value===null||typeof value!=='object'||!('vueVersion' in value)||typeof value.vueVersion!=='string')throw Error('Invalid shared Vue metadata');return value.vueVersion}
function addressPort(value:ReturnType<http.Server['address']>):number{if(value===null||typeof value==='string')throw Error('Missing local server port');return value.port}
type RuntimeObservation={game:string;loader:string;sugarCube:string;officialUi:boolean;loaded:Array<{name:string;version?:string}>;host:ReturnType<Host['getDiagnostics']>};
type UiObservation={ownRoots:Array<{owner:string|undefined;ariaHidden:string|null;visible:string;display:string}>;nativeDialogTitle:string|undefined;bodyClass:string;diagnostics:ReturnType<Host['getDiagnostics']>};
type Report={status:string;environment:string;originalHtmlSha256:string;transformation:string;packages:Array<{name:string;sha256:string}>;checks:string[];runtime?:RuntimeObservation;sharedVue?:{version:string|undefined;protocol:string|undefined};uiObservation?:UiObservation;limitations?:string[]};
const root=path.resolve(__dirname,'..'),file=process.argv[2];
const sha=(x:string|Buffer)=>createHash('sha256').update(x).digest('hex');
(async()=>{
 assert.ok(file&&fs.statSync(file).isFile(),'Pass an existing, licensed compiled game HTML');
 const original=fs.readFileSync(file),text=original.toString('utf8');
 const pattern=/<script\b[^>]*>\s*window\.modDataValueZipList\s*=\s*(\[[\s\S]*?\])\s*;?\s*<\/script>/g;
 assert.equal([...text.matchAll(pattern)].length,1,'One standard embedded Mod block required');
 const workspace=process.argv.includes('--workspace'),shared=process.argv.includes('--shared-vue');
 assert.ok(!(workspace&&shared),'Choose one research variant');
 const names=shared?['StoneFreeHost','StoneFreeVueResearch','StoneFreeNativeStatus','StoneFreeStatusComparison','StoneFreeWorkspace']:['StoneFreeHost','StoneFreeNativeStatus','StoneFreeStatusComparison',...(workspace?['StoneFreeWorkspace','StoneFreeAlternateWorkspace']:[])];
 const archives=names.map(name=>fs.readFileSync(path.join(root,`dist/${shared&&name!=='StoneFreeHost'?'framework-vue-comparison':'framework'}/${name}-0.1.1-experimental.mod.zip`)));
 const authorIndex=process.argv.indexOf('--author-zip');let authorName=null;
  if(authorIndex!==-1){const author=process.argv[authorIndex+1];assert.ok(author&&fs.statSync(author).isFile(),'Pass an existing owned author ZIP');
   const name=bootName(JSON.parse(execFileSync('python',['-c',"import zipfile,sys; print(zipfile.ZipFile(sys.argv[1]).read('boot.json').decode('utf-8'))",author],{encoding:'utf8',windowsHide:true})));
   assert.match(name,/^[A-Za-z][A-Za-z0-9]{0,63}$/);assert.ok(!names.includes(name),'No duplicate author package');authorName=name;names.push(authorName);archives.push(fs.readFileSync(author));
 }
 const html=text.replace(pattern,`<script>window.modDataValueZipList=${JSON.stringify(archives.map(b=>b.toString('base64')))};</script>`);
 const server=http.createServer((req,res)=>{
  if(req.url!=='/'){res.writeHead(404);return res.end()}
  res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Security-Policy',"default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'none'; img-src 'none'; frame-src 'none'; worker-src 'none'; form-action 'none'");res.end(html);
 });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const dir=path.join(root,'tests/artifacts',shared?'stone-free-vue':'stone-free-foundation','game-'+Date.now());fs.mkdirSync(dir,{recursive:true});
  const report:Report={status:'failed',environment:'Real compiled DoL in isolated desktop browser; no gameplay or age confirmation',originalHtmlSha256:sha(original),transformation:'In-memory replacement of embedded Mod ZIP list with the selected owned research packages',packages:names.map((name,i)=>({name,sha256:sha(must(archives[i]))})),checks:[]};
 try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(10000);
   await page.goto(`http://127.0.0.1:${addressPort(server.address())}/`,{timeout:60000});
  await page.waitForFunction(()=>window.DoLUiHost&&document.querySelector('[data-sf-owner="StatusComparison"] button'),{},{timeout:60000});
  if(workspace)await page.waitForFunction(()=>DoLUiHost.getDiagnostics().participants.includes('AlternateWorkspace'));
   const runtime:RuntimeObservation=await page.evaluate(()=>({game:StartConfig.version,loader:modUtils.version,sugarCube:String(SugarCube.version),officialUi:!!Reflect.get(window,'DoLGameUI'),loaded:modUtils.getModListNameNoAlias().map(name=>({name,version:modUtils.getMod(name)?.version})),host:DoLUiHost.getDiagnostics()}));report.runtime=runtime;
   assert.equal(runtime.officialUi,false);for(const name of names)assert.ok(runtime.loaded.some(x=>x.name===name));
   assert.equal(runtime.host.errors.length,0);report.checks.push('Actual ModLoader loaded the selected research ZIPs without official UI or MapleBirch');
   if(shared){const sharedVue=await page.evaluate(()=>{const value:unknown=Reflect.get(window,'StoneFreeVueExperimental');if(!value||typeof value!=='object'||!('version' in value)||typeof value.version!=='string'||!('protocol' in value)||typeof value.protocol!=='string')throw Error('Missing shared Vue runtime');return {version:value.version,protocol:value.protocol}});report.sharedVue=sharedVue;assert.equal(sharedVue.version,versionOf(JSON.parse(fs.readFileSync(path.join(root,'dist/framework-vue-comparison/inputs.json'),'utf8'))));assert.equal(runtime.host.views.length,2);report.checks.push('Shared Vue dependency and two source-identical consumers load under the real ModLoader')}
   if(workspace){assert.equal(runtime.host.views.length,authorName?3:2);assert.equal(runtime.host.claims.filter(c=>c.key==='information-workspace').length,1);report.checks.push('Public views and exclusive layout-region acquisition exist under the real Loader')}
   if(authorName){assert.ok(runtime.host.participants.includes(authorName));assert.ok(runtime.host.views.some(v=>v.owner===authorName&&v.id==='note'));report.checks.push('Source-owned author ZIP registers its participant and public note view without official UI')}
  const projected=await page.evaluate(async()=>{
   const source=DoLUiHost.sources('dol.status.experimental')[0];if(!source)throw Error('Missing status source');const r=await source.read(DoLUiHost.binding());
   const v=SugarCube.State.variables,original:Record<string,number|null>={};for(const field of ['pain','stress','tiredness']){const value=v[field];original[field]=typeof value==='number'&&Number.isFinite(value)?value:null}
   return {r,original};
  });assert.equal(projected.r.ok,true);if(!projected.r.ok)throw Error('Status projection unreadable');assert.deepEqual(projected.r.value,projected.original);report.checks.push('Projection matches current native values (missing values remain null; no state writes)');
  await page.waitForTimeout(500);
  const uiObservation:UiObservation=await page.evaluate(()=>({ownRoots:[...document.querySelectorAll<HTMLElement>('[data-sf-owner]')].map(n=>({owner:n.dataset.sfOwner,ariaHidden:n.getAttribute('aria-hidden'),visible:getComputedStyle(n).visibility,display:getComputedStyle(n).display})),nativeDialogTitle:document.querySelector('#ui-dialog-title')?.textContent?.slice(0,120),bodyClass:document.body.className,diagnostics:DoLUiHost.getDiagnostics()}));report.uiObservation=uiObservation;
  await page.screenshot({path:path.join(dir,'pre-interaction.png')});
  if(uiObservation.ownRoots.every(n=>n.ariaHidden==='true')){
   const knownAgeGate=/WELCOME TO DEGREES OF LEWDITY/i.test(uiObservation.nativeDialogTitle??'');
   report.status='passed-with-limitations';report.limitations=[knownAgeGate?'Original age-confirmation dialog blocks subsequent interaction; not acknowledged or bypassed':'Native UI marks research roots aria-hidden; cause unknown, interaction not forced','Actual UI clicks and native bridge event checks remain outside this fresh-game run; browser fixtures and authorized existing Android game are separate evidence'];
   await page.evaluate(()=>DoLUiHost.dispose());assert.equal(await page.locator('[data-sf-owner]').count(),0);
   return;
  }
  await page.getByRole('button',{name:'状态对照',exact:true}).click();await page.getByRole('button',{name:'设为对照',exact:true}).click();
  assert.equal(await page.locator('dialog[open]').count(),1);await page.screenshot({path:path.join(dir,'independent-comparison.png')});
  await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);report.checks.push('Comparison, native dialog, Escape and original opener focus');
  assert.equal(await page.getByRole('button',{name:'状态对照',exact:true}).evaluate(n=>n===document.activeElement),true);
  // Emit only the lifecycle cue; do not navigate or create a game moment.
  const lifecycle=await page.evaluate(()=>{
   const binding=DoLUiHost.binding(),owner=DoLUiHost.register('LifecycleCheck');
   owner.mount({id:'transient',parent:document.querySelector('#passages')||document.body,lifetime:'passage',setup(c){c.element.textContent='own probe'}});
   jQuery(document).triggerHandler(':passageinit');const invalid=!binding.isCurrent()&&binding.signal.aborted&&!DoLUiHost.getDiagnostics().mounts.some(x=>x.owner==='LifecycleCheck');
   jQuery(document).triggerHandler(':passageend');const live=DoLUiHost.binding().isCurrent();owner.dispose();return {invalid,live};
  });assert.deepEqual(lifecycle,{invalid:true,live:true});report.checks.push('Actual jQuery/SugarCube bridge invalidates passage mounts and refreshes persistent consumers');
  await page.evaluate(()=>DoLUiHost.dispose());assert.equal(await page.locator('[data-sf-owner]').count(),0);report.status='passed';
 } finally {fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(resolve=>server.close(resolve))}
 console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
