import assert = require('node:assert/strict');
import path = require('node:path');
import playwright = require('playwright');
import esbuild = require('esbuild');
declare const SaveSource:typeof import('../src/saves/source');
declare const SaveMetadata:typeof import('../src/saves/metadata');
(async()=>{
 const js=esbuild.buildSync({entryPoints:[path.resolve(__dirname,'../src/saves/source.ts')],bundle:true,write:false,format:'iife',globalName:'SaveSource'}).outputFiles[0]?.text??assert.fail('missing save source bundle');
 const metadataJs=esbuild.buildSync({entryPoints:[path.resolve(__dirname,'../src/saves/metadata.ts')],bundle:true,write:false,format:'iife',globalName:'SaveMetadata'}).outputFiles[0]?.text??assert.fail('missing metadata bundle');
 const b=await playwright.chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage();await p.setContent('<div id="saves-list-container"></div>');await p.addScriptTag({content:js});await p.addScriptTag({content:metadataJs});
 const result=await p.evaluate(async()=>{
  const required=<T extends HTMLElement>(value:T|null,label:string):T=>{if(!value)throw Error('Missing '+label);return value};const container=required(document.getElementById('saves-list-container'),'saves container');const node=<T extends HTMLElement=HTMLElement>(selector:string):T=>required(container.querySelector<T>(selector),'save fixture '+selector);const entry=(entries:import('../src/saves/source').SaveEntry[])=>{const value=entries[0];if(!value)throw Error('Missing save entry');return value};let calls=0,revision='initial',active=true,deferred:Promise<string>|null=null;
  const source=SaveSource.createSaveSource(c=>active&&c===container,async()=>deferred?await deferred:revision);
  function row(slot:string|number=1,extra='',empty=false){return `<div class="savesListRow"><div class="saveGroup"><span class="saveId">${slot}</span><span class="saveButton"><button>保存</button></span><button ${empty?'disabled':''}>读取</button></div><span class="saveName">${empty?'':'存档'}</span><div class="saveDetails"><span>${empty?'':'摘要'}</span>${extra}</div><span class="deleteButton"><button ${empty?'disabled':''}>删除</button></span></div>`}
  function read(){const projection=source.read(container);source.seal(projection.entries,new Map(projection.entries.map(e=>[e.key,revision])));return projection}
  function setup(html=row()){container.innerHTML=html;container.querySelectorAll('button').forEach(n=>n.onclick=()=>calls++);return read()}
  const check=(condition:unknown,label:string)=>{if(!condition)throw Error(label)};const passed:string[]=[];
  let projection=setup();check(!entry(projection.entries).empty,'missing date remains occupied');passed.push('missing date');
  const first=entry(projection.entries);revision='external overwrite';check(!!await source.dispatch(first.key,0)&&calls===0,'actual details change blocks old target');passed.push('native details changed');
  projection=read();const second=entry(projection.entries);check(first.key!==second.key,'binding keys never reused');check(!!await source.dispatch(first.key,0)&&calls===0,'old key cannot target new slot');passed.push('expired binding');
  await source.dispatch(second.key,0);check(calls===1,'native handler once');check(!!await source.dispatch(second.key,0)&&calls===1,'unknown outcome not replayed');
  projection=read();check(!!await source.dispatch(entry(projection.entries).key,0)&&calls===1,'remount cannot clear unknown outcome');passed.push('pending across remount');
  for(const [label,mutate] of [
   ['disabled',()=>node<HTMLButtonElement>('button').disabled=true],
   ['hidden',()=>container.hidden=true],
   ['replaced handler',()=>node<HTMLButtonElement>('button').onclick=()=>{calls+=10}],
   ['moved button',()=>container.append(node<HTMLButtonElement>('button'))],
   ['different slot',()=>node('.saveId').textContent='8'],
   ['foreign node',()=>node('.saveDetails').append(document.createElement('input'))],
   ['closed page',()=>active=false]
  ] as const){active=true;container.hidden=false;projection=setup();mutate();check(!!await source.dispatch(entry(projection.entries).key,0)&&calls===1,label+' rejected');passed.push(label)}
  active=true;container.hidden=false;projection=setup();let resolve:(value:string)=>void=()=>{throw Error('Missing deferred resolver')};deferred=new Promise<string>(r=>resolve=r);const operation=source.dispatch(entry(projection.entries).key,0);source.clear();resolve(revision);check(!!await operation&&calls===1,'page expires during async details read');deferred=null;passed.push('async expiry');
  projection=setup(row(3,'',true));check(entry(projection.entries).empty,'native disabled load plus empty content');await source.dispatch(entry(projection.entries).key,0);check(calls===2,'empty save still original control');passed.push('empty native save');
  projection=setup(row(4,'<input type="text" value="mod description">')+row('A'));check(projection.unknown===1&&projection.entries.length===1,'unknown editable row preserved');const firstElement=container.firstElementChild;if(!firstElement)throw Error('Missing unknown native row');check(!firstElement.classList.contains('dgs-native-row'),'unknown row untouched');passed.push('unknown extension');
  projection=setup();node('.savesListRow').classList.add('dgs-native-row');const css=document.createElement('style');css.textContent='.dgs-native-row{display:none}';document.head.append(css);await source.dispatch(entry(projection.entries).key,0);check(calls===3,'intentional native proxy hiding is allowed');passed.push('proxy ownership');
  projection=setup(row(1).replace('class="savesListRow"','class="savesListRow" hidden'));check(projection.entries.length===0&&projection.unknown===0,'semantic hidden never projected');passed.push('hidden projection');
  projection=setup(row(1)+row(1));check(projection.entries.length===0&&projection.unknown===2,'duplicate slots remain native');passed.push('ambiguous slots');
  type SavePayload={metadata?:Record<string,unknown>};let onSave:((save:SavePayload)=>void)|null=null;const invoke=(save:SavePayload)=>{if(!onSave)throw Error('Missing native onSave hook');onSave(save)};const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);const details=[{slot:1,data:{date:123,id:'game',metadata:{saveName:'native'} as {saveName:string;dolGameUI?:{gameTime:string;other:boolean}}}}];
  const metadata=SaveMetadata.createSaveMetadata({localStorage:{getItem:()=>null,setItem:()=>{}},Time:{year:2022,month:9,monthDay:7,hour:8,minute:3},SugarCube:{Save:{onSave:{add:fn=>{onSave=fn},delete:()=>{}}}},idb:{getSaveDetails:async()=>details}});
  projection=setup(row(1,'',true));const info=await metadata.read(projection.entries,true);if(!info)throw Error('Missing metadata revision');check(!info.revisions.has(entry(projection.entries).key),'native empty/storage occupied mismatch never sealed');
  const guarded=SaveSource.createSaveSource(c=>c===container,metadata.revision),gp=guarded.read(container);guarded.seal(gp.entries,info.revisions);check(!!await guarded.dispatch(entry(gp.entries).key,0)&&calls===3,'mismatch refuses overwrite');passed.push('empty occupancy mismatch');
  const payload:{metadata:{saveName:string;dolGameUI?:{gameTime?:unknown}}}={metadata:{saveName:'native'}};invoke(payload);check(payload.metadata.dolGameUI?.gameTime==='2022/9/7 08:03'&&payload.metadata.saveName==='native','existing metadata write unchanged');passed.push('metadata preserved');
  const shared={metadata:{saveName:'native',dolGameUI:{gameTime:'old',extension:{kept:true},format:2}}};invoke(shared);
  check(shared.metadata.dolGameUI.gameTime==='2022/9/7 08:03'&&shared.metadata.dolGameUI.extension.kept&&shared.metadata.dolGameUI.format===2,'other namespace fields preserved');
  const plain:unknown=JSON.parse(JSON.stringify(shared));if(!record(plain)||!record(plain.metadata)||!record(plain.metadata.dolGameUI)||!record(plain.metadata.dolGameUI.extension))throw Error('Invalid JSON round trip');check(plain.metadata.dolGameUI.extension.kept&&plain.metadata.saveName==='native','ordinary JSON round trip needs no UI runtime');
  for(const previous of [[],42,'unknown',new Date()]){const unsupported={metadata:{dolGameUI:previous}};invoke(unsupported);check(unsupported.metadata.dolGameUI===previous,'unsupported namespace left untouched')}
  const frozen={metadata:Object.freeze({dolGameUI:Object.freeze({gameTime:'historical',other:true})})};invoke(frozen);check(frozen.metadata.dolGameUI.gameTime==='historical','frozen metadata does not interrupt save');
  const nullRecord=Object.assign(Object.create(null) as object,{other:true});const nullPayload={metadata:{dolGameUI:nullRecord}};invoke(nullPayload);check(nullPayload.metadata.dolGameUI.other,'null-prototype fields preserved');
  const detail=details[0];if(!detail)throw Error('Missing native detail');detail.data.metadata.dolGameUI={gameTime:'2020/1/2 03:04',other:true};projection=setup();await metadata.read(projection.entries,true);check(entry(projection.entries).gameTime==='2020/1/2 03:04','historical gameTime remains readable');
  const missing=SaveMetadata.createSaveMetadata({localStorage:{getItem:()=>null,setItem:()=>{}}});let rejected=false;try{await missing.revision(entry(projection.entries),false)}catch{rejected=true}check(rejected,'no native details fails closed');passed.push('missing native details');metadata.destroy();missing.destroy();
  return {passed,calls};
 });assert.equal(result.passed.length,20);console.log('PASS save source M4-B:',result);
 }finally{await b.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
