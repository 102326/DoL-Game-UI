const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{buildSync}=require('esbuild');
(async()=>{
 const js=buildSync({entryPoints:[path.resolve(__dirname,'../src/saves/source.ts')],bundle:true,write:false,format:'iife',globalName:'SaveSource'}).outputFiles[0].text;
 const metadataJs=buildSync({entryPoints:[path.resolve(__dirname,'../src/saves/metadata.ts')],bundle:true,write:false,format:'iife',globalName:'SaveMetadata'}).outputFiles[0].text;
 const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage();await p.setContent('<div id="saves-list-container"></div>');await p.addScriptTag({content:js});await p.addScriptTag({content:metadataJs});
 const result=await p.evaluate(async()=>{
  const container=document.getElementById('saves-list-container');let calls=0,revision='initial',active=true,deferred;
  const source=SaveSource.createSaveSource(c=>active&&c===container,async()=>deferred?await deferred:revision);
  function row(slot=1,extra='',empty=false){return `<div class="savesListRow"><div class="saveGroup"><span class="saveId">${slot}</span><span class="saveButton"><button>保存</button></span><button ${empty?'disabled':''}>读取</button></div><span class="saveName">${empty?'':'存档'}</span><div class="saveDetails"><span>${empty?'':'摘要'}</span>${extra}</div><span class="deleteButton"><button ${empty?'disabled':''}>删除</button></span></div>`}
  function read(){const projection=source.read(container);source.seal(projection.entries,new Map(projection.entries.map(e=>[e.key,revision])));return projection}
  function setup(html=row()){container.innerHTML=html;container.querySelectorAll('button').forEach(n=>n.onclick=()=>calls++);return read()}
  const check=(condition,label)=>{if(!condition)throw Error(label)};const passed=[];
  let projection=setup();check(!projection.entries[0].empty,'missing date remains occupied');passed.push('missing date');
  const first=projection.entries[0];revision='external overwrite';check(!!await source.dispatch(first.key,0)&&calls===0,'actual details change blocks old target');passed.push('native details changed');
  projection=read();const second=projection.entries[0];check(first.key!==second.key,'binding keys never reused');check(!!await source.dispatch(first.key,0)&&calls===0,'old key cannot target new slot');passed.push('expired binding');
  await source.dispatch(second.key,0);check(calls===1,'native handler once');check(!!await source.dispatch(second.key,0)&&calls===1,'unknown outcome not replayed');
  projection=read();check(!!await source.dispatch(projection.entries[0].key,0)&&calls===1,'remount cannot clear unknown outcome');passed.push('pending across remount');
  for(const [label,mutate] of [
   ['disabled',()=>container.querySelector('button').disabled=true],
   ['hidden',()=>container.hidden=true],
   ['replaced handler',()=>container.querySelector('button').onclick=()=>calls+=10],
   ['moved button',()=>container.append(container.querySelector('button'))],
   ['different slot',()=>container.querySelector('.saveId').textContent='8'],
   ['foreign node',()=>container.querySelector('.saveDetails').append(document.createElement('input'))],
   ['closed page',()=>active=false]
  ]){active=true;container.hidden=false;projection=setup();mutate();check(!!await source.dispatch(projection.entries[0].key,0)&&calls===1,label+' rejected');passed.push(label)}
  active=true;container.hidden=false;projection=setup();let resolve;deferred=new Promise(r=>resolve=r);const operation=source.dispatch(projection.entries[0].key,0);source.clear();resolve(revision);check(!!await operation&&calls===1,'page expires during async details read');deferred=null;passed.push('async expiry');
  projection=setup(row(3,'',true));check(projection.entries[0].empty,'native disabled load plus empty content');await source.dispatch(projection.entries[0].key,0);check(calls===2,'empty save still original control');passed.push('empty native save');
  projection=setup(row(4,'<input type="text" value="mod description">')+row('A'));check(projection.unknown===1&&projection.entries.length===1,'unknown editable row preserved');check(!container.firstElementChild.classList.contains('dgs-native-row'),'unknown row untouched');passed.push('unknown extension');
  projection=setup();container.querySelector('.savesListRow').classList.add('dgs-native-row');const css=document.createElement('style');css.textContent='.dgs-native-row{display:none}';document.head.append(css);await source.dispatch(projection.entries[0].key,0);check(calls===3,'intentional native proxy hiding is allowed');passed.push('proxy ownership');
  projection=setup(row(1).replace('class="savesListRow"','class="savesListRow" hidden'));check(projection.entries.length===0&&projection.unknown===0,'semantic hidden never projected');passed.push('hidden projection');
  projection=setup(row(1)+row(1));check(projection.entries.length===0&&projection.unknown===2,'duplicate slots remain native');passed.push('ambiguous slots');
  let onSave;const details=[{slot:1,data:{date:123,id:'game',metadata:{saveName:'native'}}}];
  const metadata=SaveMetadata.createSaveMetadata({localStorage:{getItem:()=>null},Time:{year:2022,month:9,monthDay:7,hour:8,minute:3},SugarCube:{Save:{onSave:{add:fn=>onSave=fn,delete:()=>{}}}},idb:{getSaveDetails:async()=>details}});
  projection=setup(row(1,'',true));const info=await metadata.read(projection.entries,true);check(!info.revisions.has(projection.entries[0].key),'native empty/storage occupied mismatch never sealed');
  const guarded=SaveSource.createSaveSource(c=>c===container,metadata.revision),gp=guarded.read(container);guarded.seal(gp.entries,info.revisions);check(!!await guarded.dispatch(gp.entries[0].key,0)&&calls===3,'mismatch refuses overwrite');passed.push('empty occupancy mismatch');
  const payload={metadata:{saveName:'native'}};onSave(payload);check(payload.metadata.dolGameUI.gameTime==='2022/9/7 08:03'&&payload.metadata.saveName==='native','existing metadata write unchanged');passed.push('metadata preserved');
  const missing=SaveMetadata.createSaveMetadata({localStorage:{getItem:()=>null}});let rejected=false;try{await missing.revision(projection.entries[0],false)}catch{rejected=true}check(rejected,'no native details fails closed');passed.push('missing native details');metadata.destroy();missing.destroy();
  return {passed,calls};
 });assert.equal(result.passed.length,20);console.log('PASS save source M4-B:',result);
 }finally{await b.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
