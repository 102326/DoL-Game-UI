// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import playwright = require('playwright');
import esbuild = require('esbuild');
import assert = require('node:assert/strict');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
const {chromium}=playwright,{buildSync}=esbuild;
declare const Transfer:typeof import('../src/saves/transfer.ts');
function installTransferProbe(value:string){
 const required=(id:string)=>{const node=document.getElementById(id);if(!node)throw Error('Missing transfer fixture: '+id);return node};
 const source=required('source'),input=required('saveDataInput');if(!(input instanceof HTMLTextAreaElement))throw Error('Missing transfer textarea');
 const probe={transfer:Transfer.createSaveTransfer(),original:source.innerHTML,input,required};input.value=value;probe.transfer.refresh(true);Object.assign(window,{saveTransferProbe:probe});return probe;
}
declare const saveTransferProbe:ReturnType<typeof installTransferProbe>;

(async()=>{const b=await chromium.launch(browserOptions);try{
 const p=await b.newPage();const js=buildSync({entryPoints:['src/saves/transfer.ts'],bundle:true,write:false,format:'iife',globalName:'Transfer'}).outputFiles[0]?.text??assert.fail('missing compiled transfer output');
 await p.setContent('<div id="customOverlayContent"><div id="source"><input id="saveImport" type="file"><span class="gold">Code</span><textarea id="saveDataInput"></textarea><input id="native-action" type="button" value="Copy"></div></div>');await p.addScriptTag({content:js});
 await p.evaluate(installTransferProbe,'unchanged');
 await p.evaluate(()=>saveTransferProbe.transfer.release());assert.equal(await p.locator('#source').innerHTML(),await p.evaluate(()=>saveTransferProbe.original));assert.ok(await p.evaluate(()=>saveTransferProbe.input===document.querySelector('#saveDataInput')&&saveTransferProbe.input.value==='unchanged'));
 await p.evaluate(()=>{saveTransferProbe.transfer.refresh(true);saveTransferProbe.required('native-action').remove();saveTransferProbe.transfer.release()});assert.equal(await p.locator('#native-action').count(),0,'Removed native controls must not be resurrected on rollback');
 await p.evaluate(()=>{saveTransferProbe.transfer.refresh(true);saveTransferProbe.required('customOverlayContent').innerHTML='<button id="third-party">Cloud</button>';saveTransferProbe.transfer.release()});assert.equal(await p.locator('#third-party').count(),1);assert.equal(await p.locator('.dgs-transfer').count(),0);
 await p.setContent('<div id="customOverlay" data-overlay="export"><div id="customOverlayContent"><div id="source"><input id="saveImport" type="file"><span class="gold">Code</span><textarea id="saveDataInput"></textarea><input id="native-action" type="button" value="Copy"></div></div></div>');
 await p.evaluate(installTransferProbe,'export fixture');
 assert.equal(await p.locator('.dgs-transfer').count(),1,'Original export overlay is recognised');await p.evaluate(()=>saveTransferProbe.transfer.release());assert.equal(await p.locator('#source').innerHTML(),await p.evaluate(()=>saveTransferProbe.original));assert.equal(await p.evaluate(()=>saveTransferProbe.input.value),'export fixture');
 console.log('PASS transfer exact rollback, values, removed control stays removed, replaced overlay retained');
 }finally{await b.close()}})().catch(e=>{receipt.terminalFailure(e);process.exitCode=1});
