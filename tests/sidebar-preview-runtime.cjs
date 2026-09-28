const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1704,height:1136}});const errors=[];p.on('pageerror',e=>errors.push(e.stack));
 await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
 await p.goto(`http://127.0.0.1:${server.address().port}/game`,{waitUntil:'load',timeout:90000});await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options,{timeout:60000});
 await p.waitForLoadState('networkidle');
 console.log('BOOT',await p.evaluate(()=>({passage:SugarCube.State.passage,keys:Object.keys(V).length,worn:!!V.worn,renderer:!!window.Renderer,skin:!!window.Skin})));
 await p.evaluate(()=>{SugarCube.Engine.play('Start2')});
 await p.waitForLoadState('networkidle');
 console.log('START2',await p.evaluate(()=>({passage:SugarCube.State.passage,worn:!!V.worn,wardrobe:!!V.wardrobe,errors:[...document.querySelectorAll('.error')].map(e=>e.textContent.slice(0,180))})));
 if(process.env.DOL_WARDROBE_CONTROL){await p.evaluate(()=>SugarCube.Engine.play('Wardrobe'));await p.waitForLoadState('networkidle');fs.writeFileSync(path.join(__dirname,'artifacts/wardrobe-control.json'),JSON.stringify({scope:'Same integrated game, no new UI injected',errors},null,2));console.log('CONTROL_ERRORS',errors);return}
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 await p.evaluate(()=>{V.location='home';V.lastWardrobeSlot='upper';V.wardrobe_location='wardrobe';for(const d of setup.clothes.upper.filter(c=>c.name!=='naked'&&!c.outfitPrimary&&!c.outfitSecondary).slice(0,3)){const item=structuredClone(d);item.colour=item.colour_options?.[0]??0;item.accessory_colour=item.accessory_colour_options?.[0]??0;V.wardrobe.upper.push(item)}SugarCube.Engine.play('Wardrobe')});
 await p.waitForSelector('.dgw-shell');await p.waitForFunction(()=>document.querySelector('.dgw-preview').getAttribute('aria-busy')==='false');
 console.log('PREVIEW',await p.evaluate(()=>({status:document.querySelector('.dgw-render-status').textContent,message:document.querySelector('.dgw-message').textContent,canvas:!!document.querySelector('.dgw-preview canvas')})));
 assert.equal(await p.locator('.dgw-preview canvas').count(),1);

 await p.waitForSelector('.dgw-preview canvas[data-preview-source="sidebar"]');
 const compare=()=>p.evaluate(()=>{const a=document.querySelector('#sidebar-img-container #img canvas.mainCanvas'),b=document.querySelector('.dgw-preview canvas');return {equal:a.toDataURL()===b.toDataURL(),source:b.dataset.previewSource}});
 await p.waitForFunction(()=>{const a=document.querySelector('#sidebar-img-container #img canvas.mainCanvas'),b=document.querySelector('.dgw-preview canvas');return a.toDataURL()===b.toDataURL()});
 const before=await p.evaluate(()=>document.querySelector('.dgw-preview canvas').toDataURL());
 await p.locator('.dgw-item').first().click();
 await p.waitForFunction(old=>{const a=document.querySelector('#sidebar-img-container #img canvas.mainCanvas'),b=document.querySelector('.dgw-preview canvas');return b?.dataset.previewSource==='sidebar'&&b.toDataURL()!==old&&a.toDataURL()===b.toDataURL()},before);
 await p.evaluate(()=>document.querySelector('#sidebar-img-container').style.display='none');
 await p.locator('.dgw-item').first().click();
 await p.waitForFunction(()=>{const a=document.querySelector('#sidebar-img-container #img canvas.mainCanvas'),b=document.querySelector('.dgw-preview canvas');return b?.dataset.previewSource==='sidebar'&&a.toDataURL()===b.toDataURL()});
 assert.ok((await compare()).equal);
 await p.evaluate(()=>document.querySelector('#sidebar-img-container').style.display='');
 await p.screenshot({path:path.join(__dirname,'artifacts/sidebar-preview'+(process.env.DOL_WARDROBE_INTEGRATED?'-integrated':'')+'.png')});
 await p.evaluate(()=>document.querySelector('#sidebar-img-container').remove());
 await p.waitForFunction(()=>{const b=document.querySelector('.dgw-preview canvas');return b&&!b.dataset.previewSource},{},{timeout:20000});
 assert.equal(await p.locator('.dgw-preview canvas').count(),1);
 console.log('PASS native sidebar pixel copy, wear sync, hidden sidebar, missing-source isolated fallback');
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
