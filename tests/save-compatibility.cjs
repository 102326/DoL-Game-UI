const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1500,height:1000}});const resizeErrors=[];p.on('pageerror',e=>{if(e.message.includes('ResizeObserver'))resizeErrors.push(e.message);console.log('PAGE ERROR',e.message)});p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
 await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
 await p.goto(`http://127.0.0.1:${server.address().port}/game`,{waitUntil:'load',timeout:90000});
 await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options,{timeout:60000});await p.waitForLoadState('networkidle');
 await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForLoadState('networkidle');
 await p.evaluate(()=>SugarCube.Engine.play('Bedroom'));await p.waitForLoadState('networkidle');
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});

 await p.evaluate(async()=>{V.uiCompatibilityProbe='with-ui';SugarCube.Engine.play('Bedroom');await idb.saveState(1)});
 assert.ok(await p.evaluate(async()=>(await idb.getSaveDetails()).find(d=>d.slot===1).data.metadata.dolGameUI.gameTime));
 const exported=await p.evaluate(()=>SugarCube.Save.serialize());
 assert.equal(typeof exported,'string');
 await p.reload({waitUntil:'load'});await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options);
 assert.equal(await p.evaluate(()=>!!window.DoLGameUI),false,'fresh runtime has no UI');
 await p.evaluate(async()=>{await idb.getSaveDetails();await idb.loadState(1)});
 assert.equal(await p.evaluate(()=>V.uiCompatibilityProbe),'with-ui','native runtime loads UI-created IDB save');
 await p.evaluate(()=>V.uiCompatibilityProbe='changed');
 assert.notEqual(await p.evaluate(data=>SugarCube.Save.deserialize(data),exported),false);
 assert.equal(await p.evaluate(()=>V.uiCompatibilityProbe),'with-ui','native runtime imports UI export');
 // The old localStorage backend must also tolerate the display metadata.
 await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 await p.evaluate(()=>{idb.active=false;V.uiCompatibilityProbe='legacy-ui';SugarCube.Engine.play('Bedroom');SugarCube.Save.slots.save(0)});
 await p.reload({waitUntil:'load'});await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options);
 assert.equal(await p.evaluate(()=>SugarCube.Save.slots.load(0)),true);
 assert.equal(await p.evaluate(()=>V.uiCompatibilityProbe),'legacy-ui');
 console.log('PASS fresh no-UI runtime loads IDB and legacy UI saves and imports serialized save');
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
