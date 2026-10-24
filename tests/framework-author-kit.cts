// Build a source-owned consumer from the exported kit, not the UI checkout's sources.
import fs = require('node:fs');
import path = require('node:path');
import assert = require('node:assert/strict');
import childProcess = require('node:child_process');
import crypto = require('node:crypto');
import playwright = require('playwright');
import type {Host} from '../framework/contracts';
declare const DoLUiHost:Readonly<Host>;
declare const StoneFree_host:typeof import('../framework/boot');
declare const StoneFreeAuthor_KitAuthor:{dispose():void};
const {execFileSync}=childProcess,{createHash}=crypto,{chromium}=playwright;
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing author-kit fixture value');return value}
function objectOf(value:unknown):Record<string,unknown>{if(value===null||typeof value!=='object'||Array.isArray(value))throw Error('Expected JSON object');return Object.fromEntries(Object.entries(value))}
function inspectionOf(value:unknown):{canReplace:boolean;files:Array<{name:string;status:string}>}{const item=objectOf(value);if(typeof item.canReplace!=='boolean'||!Array.isArray(item.files))throw Error('Invalid SDK inspection');const files=item.files.map((value:unknown)=>{const entry=objectOf(value);if(typeof entry.name!=='string'||typeof entry.status!=='string')throw Error('Invalid SDK file entry');return {name:entry.name,status:entry.status}});return {canReplace:item.canReplace,files}}
function inventoryOf(value:unknown):{files:Record<string,string>}{const item=objectOf(value),raw=objectOf(item.files),files:Record<string,string>={};for(const [name,hash]of Object.entries(raw)){if(typeof hash!=='string'||!/^[a-f0-9]{64}$/.test(hash))throw Error('Invalid kit digest');files[name]=hash}return {files}}
function packageOf(value:unknown):{js:string;css:string}{const item=objectOf(value);if(typeof item.js!=='string'||typeof item.css!=='string')throw Error('Invalid packed author resources');return {js:item.js,css:item.css}}
const root=path.resolve(__dirname,'..'),out=path.join(root,'tests/artifacts/stone-free-foundation','author-kit-'+Date.now());fs.mkdirSync(out,{recursive:true});
const kit=path.join(out,'kit'),project=path.join(out,'KitAuthor'),checks:string[]=[];
const archive=path.join(root,'dist/framework/StoneFreeAuthorKit-0.1.4-experimental.source.zip');
function run(command:string,args:string[],cwd=root){try {const stdout=execFileSync(command,args,{cwd,encoding:'utf8',windowsHide:true});fs.appendFileSync(path.join(out,'commands.log'),JSON.stringify({command,args,cwd,status:0,stdout})+'\n');return stdout}
 catch(e){const status=e&&typeof e==='object'?Reflect.get(e,'status'):undefined,stdout=e&&typeof e==='object'?Reflect.get(e,'stdout'):undefined,stderr=e&&typeof e==='object'?Reflect.get(e,'stderr'):undefined;fs.appendFileSync(path.join(out,'commands.log'),JSON.stringify({command,args,cwd,status,stdout,stderr})+'\n');throw e}}
(async()=>{
 const inventory=inventoryOf(JSON.parse(run('python',['-c',`import json,zipfile,hashlib,sys
from pathlib import Path
z=zipfile.ZipFile(sys.argv[1]); names=z.namelist()
expected={'LICENSE','README.md','stone-free-author-kit.json','scripts/framework-factory.mts','scripts/framework-factory.mjs','framework/contracts.ts','framework/vue.ts','framework/connect.ts','framework/factory/Panel.vue','framework/factory/index.html','framework/factory/preview.ts','framework/factory/vite.config.mts','framework/factory/package.py'}
assert len(names)==len(expected) and set(names)==expected and z.testzip() is None
m=json.loads(z.read('stone-free-author-kit.json')); assert m['kind']=='source-kit' and m['sdkProtocol']=='0.1-experimental' and m['version']=='0.1.4-experimental'
assert set(m['files'])==expected-{'stone-free-author-kit.json'}
assert all(hashlib.sha256(z.read(n)).hexdigest()==h for n,h in m['files'].items())
p=Path(sys.argv[2]); p.mkdir(); z.extractall(p)
print(json.dumps(m))`,archive,kit])));
 checks.push('Export has exactly the documented 13 files and matching digests; no UI implementation, runtime boot, dependencies or evidence');
 for(const match of fs.readFileSync(path.join(kit,'README.md'),'utf8').matchAll(/\]\(([^)]+)\)/g))assert.ok(fs.existsSync(path.join(kit,must(match[1]))),`Offline guide target missing: ${match[1]}`);
 const factory=path.join(kit,'scripts/framework-factory.mjs');run(process.execPath,[factory,'create',project,'KitAuthor'],kit);
 fs.symlinkSync(path.join(root,'node_modules'),path.join(project,'node_modules'),'junction');
 const panel=path.join(project,'src/Panel.vue'),edited=fs.readFileSync(panel,'utf8').replaceAll('界面便笺','独立源码包便笺');fs.writeFileSync(panel,edited);
 const inspected=inspectionOf(JSON.parse(run(process.execPath,[factory,'check-sdk',project],kit)));assert.equal(inspected.canReplace,true);assert.ok(inspected.files.every(x=>x.status==='aligned'));
 run(process.execPath,[factory,'upgrade-sdk',project],kit);assert.equal(fs.readFileSync(panel,'utf8'),edited);
 run(process.execPath,[path.join(root,'node_modules/vue-tsc/bin/vue-tsc.js'),'--noEmit'],project);
 run(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build'],project);run('python',[path.join(project,'package.py')],project);
 checks.push('Extracted kit creates an editable independent project; SDK inspection/update preserves the author edit; typecheck, build and package pass');
 const mod=path.join(project,'dist/KitAuthor-0.1.0.mod.zip');
 const packed=packageOf(JSON.parse(run('python',['-c',`import zipfile,json,sys
z=zipfile.ZipFile(sys.argv[1]); b=json.loads(z.read('boot.json')); assert z.testzip() is None
assert set(z.namelist())=={'boot.json','index.js','style.css','LICENSE','README.md','THIRD-PARTY-NOTICES.txt'}
assert b['name']=='KitAuthor' and b['version']=='0.1.0'
assert {x['modName'] for x in b['dependenceInfo']}=={'ModLoader','StoneFreeHost'}
assert next(x['version'] for x in b['dependenceInfo'] if x['modName']=='StoneFreeHost')=='>=0.1.2-experimental && <0.2.0'
print(json.dumps({'boot':b,'js':z.read('index.js').decode(),'css':z.read('style.css').decode()}))`,mod])));
 checks.push('Generated Mod ZIP contains runtime resources and notices only; official UI and shared Vue are not dependencies');
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const p=await browser.newPage({viewport:{width:390,height:844}}),errors:string[]=[];p.setDefaultTimeout(5000);p.on('pageerror',e=>errors.push(e.message));await p.setContent('<main id="passages"></main><input id="native" value="untouched">');
  await p.addScriptTag({path:path.join(root,'dist/framework/host/index.js')});await p.addStyleTag({content:packed.css});await p.addScriptTag({content:packed.js});
  await p.getByRole('button',{name:'独立源码包便笺',exact:true}).click();await p.getByRole('textbox',{name:'独立源码包便笺',exact:true}).fill('从源码制品创建');
  assert.equal(await p.locator('textarea').inputValue(),'从源码制品创建');assert.deepEqual(await p.evaluate(()=>({ui:!!Reflect.get(window,'DoLGameUI'),game:!!Reflect.get(window,'SugarCube'),view:DoLUiHost.views().some(v=>v.owner==='KitAuthor'&&v.id==='note')})),{ui:false,game:false,view:true});
  await p.locator('.author-note').screenshot({path:path.join(out,'author-390.png')});
  const cleanup=await p.evaluate(()=>{StoneFreeAuthor_KitAuthor.dispose();StoneFree_host.dispose();const probe=StoneFree_host.installHost();if(!probe)throw Error('Missing Host probe');const waiting=probe.host.getDiagnostics().participants.length;probe.dispose();return {waiting,owned:document.querySelectorAll('[data-sf-owner]').length,native:document.querySelector<HTMLInputElement>('#native')?.value}});
  assert.deepEqual(cleanup,{waiting:0,owned:0,native:'untouched'});assert.deepEqual(errors,[]);
 }finally{await browser.close()}
 checks.push('Packed author JS/CSS works at 390px without game or official UI, publishes its optional view and cleans up without waiting consumers');
 const report={status:'passed',checks,kitSha256:createHash('sha256').update(fs.readFileSync(archive)).digest('hex'),files:inventory.files,node:process.version,limits:['Current installed dependencies reused via a junction; fresh network installation not tested','Browser receipt is not physical touch, actual ModLoader installation or game business proof','No measured comparison against a manual Vite template/Agent workflow']};
 fs.copyFileSync(archive,path.join(out,path.basename(archive)));fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks,out},null,2));
})().catch(e=>{fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({status:'failed',checks,error:e instanceof Error?e.message:String(e)},null,2));console.error(e);process.exitCode=1});
