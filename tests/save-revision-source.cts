// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"named","caseSource":"check"}
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import crypto = require('node:crypto');
import child = require('node:child_process');
import esbuild = require('esbuild');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import cases = require('../scripts/ci-cases.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
declare const SaveMetadataModule:typeof import('../src/saves/metadata');
declare const SaveSourceModule:typeof import('../src/saves/source');

const baseline=process.argv.includes('--baseline'),ref='ff7942dc78fed54b5451d7cdcdf6c454a83caf01';
const inputs:Record<string,{sha256:string;gitBlob?:string}>={};
function bundle(file:string,globalName:string){
 const bytes=baseline?child.execFileSync('git',['show',`${ref}:${file}`]):fs.readFileSync(file);
 const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
 if(baseline){
  const gitBlob=child.execFileSync('git',['rev-parse',`${ref}:${file}`],{encoding:'utf8'}).trim();
  assert.equal(crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes])).digest('hex'),gitBlob);
  inputs[file]={sha256,gitBlob};
 }else inputs[file]={sha256};
 const output=esbuild.buildSync({stdin:{contents:bytes.toString('utf8'),sourcefile:path.basename(file),resolveDir:path.resolve(path.dirname(file)),loader:'ts'},bundle:true,write:false,format:'iife',globalName}).outputFiles[0];
 assert.ok(output);return output.text;
}
const results:unknown[]=[],failures:unknown[]=[];
async function check(name:string,run:()=>Promise<void>){
 try{await cases.runCase(name,run);console.log('PASS',name)}
 catch(error){failures.push({name,error:error instanceof Error?error.message:String(error)});console.error('FAIL',name,error)}
}
(async()=>{
 const metadata=bundle('src/saves/metadata.ts','SaveMetadataModule'),source=bundle('src/saves/source.ts','SaveSourceModule');
 const browser=await playwright.chromium.launch(browserOptions);
 try{
  const page=await browser.newPage();await page.setContent('<main id="fixture"></main>');
  await page.addScriptTag({content:metadata});await page.addScriptTag({content:source});
  for(const backend of ['idb','legacy'] as const){
   for(const scenario of ['empty stable','null empty stable','occupied stable','occupied changed','empty to occupied','empty to string','empty to array','initial string','initial array','string to array','array to string','malformed to empty','other slot malformed','container becomes malformed','initial malformed container','occupied malformed'] as const){
    await check(`${backend}: ${scenario}`,async()=>{
     const result=await page.evaluate(async({backend,scenario})=>{
      const container=document.createElement('div');container.id=backend==='idb'?'saves-list-container':'savesListContainer';
      document.getElementById('fixture')!.replaceChildren(container);
      const occupied=scenario==='occupied stable'||scenario==='occupied changed'||scenario==='occupied malformed';
      container.innerHTML=`<div class="savesListRow"><div class="saveGroup"><span class="saveId">1</span><span class="saveButton"><button>保存</button></span><button ${occupied?'':'disabled'}>读取</button></div><span class="saveName">${occupied?'native':''}</span><div class="saveDetails"><span>${occupied?'native summary':''}</span></div><span class="deleteButton"><button ${occupied?'':'disabled'}>删除</button></span></div>`;
      let clicks=0,writes=0;const button=container.querySelector<HTMLButtonElement>('button');if(!button)throw Error('Missing original save control');
      const handler=()=>{clicks++};button.onclick=handler;
      const valid={date:123,id:'native',metadata:{saveName:'native',extension:{preserve:true}}};
      const initial:unknown=scenario==='initial string'||scenario==='string to array'||scenario==='malformed to empty'||scenario==='occupied malformed'?'invalid':scenario==='initial array'||scenario==='array to string'?[1,2]:occupied?valid:scenario==='null empty stable'?null:undefined;
      const data=(value:unknown,malformed=false):unknown=>malformed?(backend==='idb'?{}:{slots:'invalid'}):backend==='idb'?[...(value===undefined?[]:[{slot:1,data:value}]),...(scenario==='other slot malformed'?[{slot:2,data:'invalid'}]:[])]:{slots:[value,...(scenario==='other slot malformed'?['invalid']:[])]};
      let details=data(initial,scenario==='initial malformed container');const before=JSON.stringify(details);
      const metadata=SaveMetadataModule.createSaveMetadata({localStorage:{getItem:key=>key==='dolSaveDetails'?JSON.stringify(details):null,setItem:()=>{writes++}},idb:{getSaveDetails:async()=>details}});
      const source=SaveSourceModule.createSaveSource(node=>node===container&&node.isConnected,metadata.revision);
      try{
       const projection=source.read(container),entry=projection.entries[0];if(!entry||projection.entries.length!==1)throw Error('Missing unique native slot');
       const read=await metadata.read(projection.entries,backend==='idb');source.seal(projection.entries,read?.revisions);
       const readUnchanged=JSON.stringify(details)===before,sealed=!!read?.revisions.has(entry.key);
       const next:unknown=scenario==='empty to string'||scenario==='array to string'?'invalid':scenario==='empty to array'||scenario==='string to array'?[1,2]:scenario==='occupied changed'||scenario==='empty to occupied'?{...valid,date:456}:scenario==='malformed to empty'?undefined:initial;
       details=data(next,scenario==='container becomes malformed'||scenario==='initial malformed container');const afterChange=JSON.stringify(details);
       const message=await source.dispatch(entry.key,0);
       return{backend,scenario,clicks,writes,sealed,readUnchanged,dispatchUnchanged:JSON.stringify(details)===afterChange,originalControl:container.querySelector('button')===button&&button.onclick===handler,disabledLoad:!!container.querySelectorAll('button')[1]?.disabled,message};
      }finally{source.destroy();metadata.destroy()}
     },{backend,scenario});
     results.push(result);
     const allowed=scenario==='empty stable'||scenario==='null empty stable'||scenario==='occupied stable'||scenario==='other slot malformed';
     assert.equal(result.clicks,allowed?1:0,`${backend} ${scenario}: original handler dispatch`);
     assert.equal(result.message==='',allowed);assert.equal(result.writes,0);assert.equal(result.readUnchanged,true);assert.equal(result.dispatchUnchanged,true);assert.equal(result.originalControl,true);assert.equal(result.disabledLoad,!scenario.startsWith('occupied'));
     if(scenario==='initial string'||scenario==='initial array'||scenario==='string to array'||scenario==='array to string'||scenario==='malformed to empty'||scenario==='initial malformed container'||scenario==='occupied malformed')assert.equal(result.sealed,false,'unknown target cannot be sealed as empty');
    });
   }
  }
 }finally{await browser.close();const file=`tests/artifacts/save-revision-source-${baseline?'baseline':'current'}-${Date.now()}.json`;fs.writeFileSync(file,JSON.stringify({baseline,source:baseline?ref:child.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),inputs,results,failures,scope:'Actual original metadata/source modules in browser DOM; controlled storage only, no SugarCube or real-save claim'},null,2));console.log('Evidence',file)}
 assert.equal(failures.length,0,'save revision joint failures');
})().catch(error=>{receipt.terminalFailure(error);process.exitCode=1});
