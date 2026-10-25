// Authorized isolated test App only. Uses normal Loader storage and original navigation.
import fs = require('node:fs');
import path = require('node:path');
import assert = require('node:assert/strict');
import crypto = require('node:crypto');
const {createHash}=crypto;
type ToolClient={evaluate(source:string):Promise<unknown>;send(method:string,params?:Record<string,unknown>):Promise<unknown>};
type ToolContext={ensureWebview():Promise<ToolClient>;finish():Promise<unknown>};
type Backup={list:string[];hidden:string[];scene:string;game:string;loader:unknown;autosave:string[]};
type Report={status:string;artifacts:Record<string,{bytes:number;sha256:string}>;steps:Array<{type:string;selector:string}>;initial?:Backup;nativeRouteTags?:Array<{name:string;tags:string[]}>;scene?:unknown;wardrobeState?:{before:string;after:string;unchanged:boolean};navigation?:{scene:string;referenceHidden:boolean};error?:string;cleanup?:string;cleanupError?:string};
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing Android reference fixture value');return value}
function recordOf(value:unknown):Record<string,unknown>{if(value===null||typeof value!=='object'||Array.isArray(value))throw Error('Expected Android reference object');return Object.fromEntries(Object.entries(value))}
function stringsOf(value:unknown):string[]{if(!Array.isArray(value)||!value.every(x=>typeof x==='string'))throw Error('Expected Android reference string list');return value}
function stringOf(value:unknown):string{if(typeof value!=='string')throw Error('Expected Android reference string');return value}
function backupOf(value:unknown):Backup{const v=recordOf(value);if(typeof v.scene!=='string'||typeof v.game!=='string')throw Error('Invalid Android reference identity');return {list:stringsOf(v.list),hidden:stringsOf(v.hidden),scene:v.scene,game:v.game,loader:v.loader,autosave:stringsOf(v.autosave)}}
function tagsOf(value:unknown):Array<{name:string;tags:string[]}>{if(!Array.isArray(value))throw Error('Invalid native route tags');return value.map(item=>{const v=recordOf(item);if(typeof v.name!=='string')throw Error('Invalid route name');return {name:v.name,tags:stringsOf(v.tags)}})}
const root=path.resolve(__dirname,'..'),tools='E:/daima/local-tools/DoL-Dev-Tools-Paisley-Park/6.1.0';
const {create}:{create(options:{serial:string;package:string},overrides:Record<string,never>,settings:{timeoutMs:number}):ToolContext}=require(tools+'/scripts/lib/execution-context.cjs');
const {execute}:{execute(ctx:ToolContext,action:{type:'restart'}|{type:'web-click';selector:string}):Promise<unknown>}=require(tools+'/scripts/lib/action.cjs');
const out=path.join(root,'tests/artifacts/stone-free-reference','android-'+Date.now());fs.mkdirSync(out,{recursive:true});
const names=['StoneFreeHost','StoneFreeWardrobeReference'],hash=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex'),report:Report={status:'running',artifacts:{},steps:[]};
let ctx:ToolContext|undefined,client:ToolClient|undefined,backup:Backup|undefined,installed=false;
async function bind(){ctx=create({serial:'0509B830099C3540',package:'com.vrelnir.dol.lyra.uicompat051213'},{},{timeoutMs:180000});client=await ctx.ensureWebview()}
const evaluate=(s:string)=>must(client).evaluate(s);
async function wait(s:string){const end=Date.now()+15000;while(Date.now()<end){if(await evaluate(s))return;await new Promise(r=>setTimeout(r,200))}throw Error('Not ready: '+s)}
async function restart(){const active=must(ctx);await execute(active,{type:'restart'});await active.finish();await new Promise(r=>setTimeout(r,4500));await bind();await wait('!!window.SugarCube?.State?.passage')}
async function click(selector:string){await execute(must(ctx),{type:'web-click',selector});await new Promise(r=>setTimeout(r,350));report.steps.push({type:'web-click',selector})}
async function shot(name:string){const image=recordOf(await must(client).send('Page.captureScreenshot',{format:'png'}));fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(stringOf(image.data),'base64'))}
const state=`JSON.stringify({wardrobe:SugarCube.State.variables.wardrobe,worn:SugarCube.State.variables.worn})`;
(async()=>{try{
 await bind();const captured=backupOf(await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController();return {list:await c.listModIndexDB(),hidden:await c.loadHiddenModList(),scene:SugarCube.State.passage,game:StartConfig.version,loader:modUtils.version,autosave:SugarCube.Config.saves.autosave}})()`));backup=captured;
 assert.equal(captured.game,'0.5.12.13');assert.equal(captured.scene,'Start');assert.deepEqual(captured.autosave,['autosave']);assert.ok(names.every(n=>!captured.list.includes(n)));report.initial=captured;fs.writeFileSync(path.join(out,'restore-list.json'),JSON.stringify(captured,null,2));
 for(const name of names){const b=fs.readFileSync(path.join(root,'dist/framework',name+'-0.1.1-experimental.mod.zip'));report.artifacts[name]={bytes:b.length,sha256:hash(b)};await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController(),b=${JSON.stringify(b.toString('base64'))};if(typeof await c.checkModZipFileIndexDB(b)==='string')throw Error('ZIP rejected');await c.addModIndexDB(${JSON.stringify(name)},b)})()`);installed=true}
 await evaluate(`modSC2DataManager.getModLoadController().overwriteModIndexDBModList(${JSON.stringify(names)})`);await restart();
 const tags=tagsOf(await evaluate(`['Orphanage Intro','Bedroom','Wardrobe'].map(n=>({name:n,tags:SugarCube.Story.get(n).tags}))`));assert.ok(tags.every(p=>!p.tags.includes('autosave')));report.nativeRouteTags=tags;
 await evaluate(`document.querySelector('#settingsExit button').scrollIntoView({block:'center'})`);await click('#settingsExit button');await wait(`SugarCube.State.passage==='Start2'`);
 for(const destination of ['Orphanage Intro','Bedroom','Wardrobe']){const selector='#passages .passage:not(.passage-out) a[data-passage='+JSON.stringify(destination)+']';assert.equal(await evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`),1);await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);await click(selector);await wait(`SugarCube.State.passage===${JSON.stringify(destination)}`)}
 await wait(`!!document.querySelector('.sf-wardrobe-reference-launch')`);report.scene=await evaluate(`({game:StartConfig.version,loader:modUtils.version,scene:SugarCube.State.passage,viewport:{width:innerWidth,height:innerHeight},agent:navigator.userAgent,mods:modUtils.getModListNameNoAlias().map(name=>({name,version:modUtils.getMod(name)?.version})),nativeWardrobe:!!document.querySelector('#wardrobeList')})`);
 const before=hash(stringOf(await evaluate(state)));await click('.sf-wardrobe-reference-launch');
 // Select the first nonempty native category through its original HTML select.
 const category=stringOf(await evaluate(`(()=>{const s=document.querySelector('.sf-wardrobe-reference-tools select');return [...s.options].find(o=>!/\\(0\\)$/.test(o.textContent))?.value})()`));assert.ok(category);
 await evaluate(`(()=>{const s=document.querySelector('.sf-wardrobe-reference-tools select');s.value=${JSON.stringify(category)};s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
 await wait(`document.querySelectorAll('[data-reference-item]').length>=2`);
 const rows=stringsOf(await evaluate(`[...document.querySelectorAll('[data-reference-item]')].slice(0,2).map(n=>n.dataset.referenceItem)`));assert.equal(rows.length,2);
 const row=(k:string)=>'[data-reference-item='+JSON.stringify(k)+']';
 await click(row(must(rows[0]))+' .sf-wardrobe-reference-item-actions button:first-child');await click(row(must(rows[1]))+' [data-select-b]');
 const scroll=await evaluate(`(()=>{const n=document.querySelector('.sf-wardrobe-reference-list');n.scrollTop=30;return n.scrollTop})()`);
 await shot('catalog-tablet');await click('.sf-wardrobe-reference-browse footer button:first-child');
 const plain=await evaluate(`document.querySelector('.sf-wardrobe-reference-comparison').textContent`);await shot('plain-tablet');
 await click('.sf-wardrobe-reference-comparison-screen footer button');
 assert.equal(await evaluate(`document.querySelector('.sf-wardrobe-reference-list').scrollTop`),scroll);assert.equal(await evaluate(`document.activeElement?.closest('[data-reference-item]')?.dataset.referenceItem`),rows[1]);
 await click('.sf-wardrobe-reference-browse footer button:last-child');assert.equal(await evaluate(`document.querySelector('.sf-wardrobe-reference-comparison').textContent`),plain);await shot('spatial-tablet');
 await click('.sf-wardrobe-reference-comparison-screen footer button');await click('.sf-wardrobe-reference-browse footer button:last-child');await click('[data-reference-close]');
 assert.equal(hash(stringOf(await evaluate(state))),before);report.wardrobeState={before,after:hash(stringOf(await evaluate(state))),unchanged:true};
 // Leave by an observed native link: reference state must disappear on real navigation.
 const exit='#passages .passage:not(.passage-out) a[data-passage="Bedroom"]';assert.equal(await evaluate(`document.querySelectorAll(${JSON.stringify(exit)}).length`),1);await evaluate(`document.querySelector(${JSON.stringify(exit)}).scrollIntoView({block:'center'})`);await click(exit);await wait(`SugarCube.State.passage==='Bedroom'`);await wait(`!document.querySelector('.sf-wardrobe-reference-launch')`);
 report.navigation={scene:stringOf(await evaluate('SugarCube.State.passage')),referenceHidden:true};report.status='passed';
 }catch(e){report.status='failed';report.error=e instanceof Error?e.message:String(e);throw e}
 finally{if(client&&installed)try{const saved=must(backup);await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController();for(const name of ${JSON.stringify(names)})await c.removeModIndexDB(name);await c.overwriteModIndexDBModList(${JSON.stringify(saved.list)});await c.overwriteModIndexDBHiddenModList(${JSON.stringify(saved.hidden)})})()`);await restart();const restored=stringsOf(await evaluate(`modSC2DataManager.getModLoadController().listModIndexDB()`));assert.deepEqual(restored,saved.list);report.cleanup='original Mod list restored'}catch(e){report.cleanup='failed';report.cleanupError=e instanceof Error?e.message:String(e);report.status='cleanup-failed'}const active=ctx;if(active)await active.finish();fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2));console.log(out)}
 assert.equal(report.status,'passed');
})().catch(e=>{console.error(e);process.exitCode=1});
