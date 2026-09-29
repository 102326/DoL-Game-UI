const {chromium}=require('playwright'),{buildSync}=require('esbuild'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage();const js=buildSync({entryPoints:['src/saves/transfer.ts'],bundle:true,write:false,format:'iife',globalName:'Transfer'}).outputFiles[0].text;
 await p.setContent('<div id="customOverlayContent"><div id="source"><input id="saveImport" type="file"><span class="gold">Code</span><textarea id="saveDataInput"></textarea><input id="native-action" type="button" value="Copy"></div></div>');await p.addScriptTag({content:js});
 await p.evaluate(()=>{window.transfer=Transfer.createSaveTransfer();window.original=document.querySelector('#source').innerHTML;window.input=document.querySelector('#saveDataInput');input.value='unchanged';transfer.refresh(true)});
 await p.evaluate(()=>transfer.release());assert.equal(await p.locator('#source').innerHTML(),await p.evaluate(()=>original));assert.ok(await p.evaluate(()=>input===document.querySelector('#saveDataInput')&&input.value==='unchanged'));
 await p.evaluate(()=>{transfer.refresh(true);document.querySelector('#native-action').remove();transfer.release()});assert.equal(await p.locator('#native-action').count(),0,'Removed native controls must not be resurrected on rollback');
 await p.evaluate(()=>{transfer.refresh(true);document.querySelector('#customOverlayContent').innerHTML='<button id="third-party">Cloud</button>';transfer.release()});assert.equal(await p.locator('#third-party').count(),1);assert.equal(await p.locator('.dgs-transfer').count(),0);
 console.log('PASS transfer exact rollback, values, removed control stays removed, replaced overlay retained');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
