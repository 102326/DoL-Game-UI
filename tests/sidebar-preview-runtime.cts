import playwright = require('playwright');
import fs = require('node:fs');
import path = require('node:path');
import http = require('node:http');
import assert = require('node:assert/strict');
import type {startWardrobe} from '../src/wardrobe/main';
import type {WardrobeVariables,WardrobeSetup} from '../src/wardrobe/host';
const {chromium}=playwright;
declare const SugarCube:{State:{passage:string;variables:{options?:unknown}};Engine:{play(name:string):void}},V:WardrobeVariables,setup:WardrobeSetup,DoLWardrobeUI:ReturnType<typeof startWardrobe>,testWardrobeRegions:{header:HTMLElement;footer:HTMLElement;pet:HTMLButtonElement};
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url??'/','http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
(async()=>{await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1704,height:1136}}),address=server.address();assert.ok(address&&typeof address!=='string');const errors:Array<string|undefined>=[];p.on('pageerror',e=>errors.push(e.stack));
 await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
 await p.goto(`http://127.0.0.1:${address.port}/game`,{waitUntil:'load',timeout:90000});await p.waitForFunction(()=>typeof SugarCube!=='undefined'&&SugarCube.State?.variables?.options,{timeout:60000});
 await p.waitForLoadState('networkidle');
 console.log('BOOT',await p.evaluate(()=>({passage:SugarCube.State.passage,keys:Object.keys(V).length,worn:!!V.worn,renderer:!!Reflect.get(window,'Renderer'),skin:!!Reflect.get(window,'Skin')})));
 await p.evaluate(()=>{SugarCube.Engine.play('Start2')});
 await p.waitForLoadState('networkidle');
 console.log('START2',await p.evaluate(()=>({passage:SugarCube.State.passage,worn:!!V.worn,wardrobe:!!V.wardrobe,errors:[...document.querySelectorAll('.error')].map(e=>{if(e.textContent===null)throw Error('Missing native error text');return e.textContent.slice(0,180)})})));
 if(process.env.DOL_WARDROBE_CONTROL){await p.evaluate(()=>SugarCube.Engine.play('Wardrobe'));await p.waitForLoadState('networkidle');fs.writeFileSync(path.join(__dirname,'artifacts/wardrobe-control.json'),JSON.stringify({scope:'Same integrated game, no new UI injected',errors},null,2));console.log('CONTROL_ERRORS',errors);return}
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 await p.evaluate(()=>{V.location='home';V.lastWardrobeSlot='upper';V.wardrobe_location='wardrobe';const upper=setup.clothes.upper;if(!upper)throw Error('Missing native upper clothes');const wardrobeUpper=V.wardrobe.upper;if(!Array.isArray(wardrobeUpper))throw Error('Missing native upper inventory');for(const d of upper.filter(c=>c.name!=='naked'&&!c.outfitPrimary&&!c.outfitSecondary).slice(0,3)){const item=structuredClone(d);const colour=item.colour_options?.[0]??0,accessory=item.accessory_colour_options?.[0]??0;if((typeof colour!=='string'&&typeof colour!=='number')||(typeof accessory!=='string'&&typeof accessory!=='number'))throw Error('Invalid native clothing colour');item.colour=colour;item.accessory_colour=accessory;wardrobeUpper.push(item)}SugarCube.Engine.play('Wardrobe')});
 await p.waitForSelector('.dgw-shell');await p.waitForFunction(()=>document.querySelector('.dgw-preview')?.getAttribute('aria-busy')==='false');
 console.log('PREVIEW',await p.evaluate(()=>({status:document.querySelector('.dgw-render-status')?.textContent,message:document.querySelector('.dgw-message')?.textContent,canvas:!!document.querySelector('.dgw-preview canvas')})));
 assert.equal(await p.locator('.dgw-preview canvas').count(),1);

 // Mod-owned floating controls in SugarCube's footer must not be hidden with the legacy list.
 await p.evaluate(async()=>{
  DoLWardrobeUI.setEnabled(false);await new Promise(requestAnimationFrame);
  const passage=document.querySelector<HTMLElement>('#passages .passage:not(.passage-out)');if(!passage)throw Error('Missing native passage');
  let header=passage.querySelector<HTMLElement>(':scope > #passage-header');if(!header){header=document.createElement('div');header.id='passage-header';passage.prepend(header)}
  let footer=passage.querySelector<HTMLElement>(':scope > #passage-footer');if(!footer){footer=document.createElement('div');footer.id='passage-footer';passage.append(footer)}
  const pet=document.createElement('button');pet.id='test-floating-pet';pet.textContent='pet';pet.onclick=()=>pet.dataset.clicked='true';footer.append(pet);
  Object.assign(window,{testWardrobeRegions:{header,footer,pet}});DoLWardrobeUI.setEnabled(true);
 });
 await p.waitForSelector('.dgw-shell');
 await p.locator('#test-floating-pet').click();
 assert.equal(await p.evaluate(()=>{const {header,footer,pet}=testWardrobeRegions,root=document.querySelector('.dgw-root');if(!root)throw Error('Missing wardrobe root');return header.parentElement===footer.parentElement&&footer.parentElement?.classList.contains('passage')&&pet.dataset.clicked==='true'&&header.compareDocumentPosition(root)===Node.DOCUMENT_POSITION_FOLLOWING}),true);
 await p.evaluate(()=>DoLWardrobeUI.setEnabled(false));await p.waitForSelector('.dgw-shell',{state:'detached'});
 assert.equal(await p.evaluate(()=>testWardrobeRegions.pet===document.querySelector('#test-floating-pet')&&testWardrobeRegions.footer.parentElement?.classList.contains('passage')),true);
 await p.evaluate(()=>DoLWardrobeUI.setEnabled(true));await p.waitForSelector('.dgw-shell');

 await p.waitForSelector('.dgw-preview canvas[data-preview-source="sidebar"]');
 const compare=()=>p.evaluate(()=>{const a=document.querySelector<HTMLCanvasElement>('#sidebar-img-container #img canvas.mainCanvas'),b=document.querySelector<HTMLCanvasElement>('.dgw-preview canvas');if(!a||!b)throw Error('Missing native preview canvas');return {equal:a.toDataURL()===b.toDataURL(),source:b.dataset.previewSource}});
 await p.waitForFunction(()=>{const a=document.querySelector<HTMLCanvasElement>('#sidebar-img-container #img canvas.mainCanvas'),b=document.querySelector<HTMLCanvasElement>('.dgw-preview canvas');return !!a&&!!b&&a.toDataURL()===b.toDataURL()});
 const before=await p.evaluate(()=>(()=>{const canvas=document.querySelector<HTMLCanvasElement>('.dgw-preview canvas');if(!canvas)throw Error('Missing preview canvas');return canvas.toDataURL()})());
 await p.locator('.dgw-item').first().click();
 await p.waitForFunction(old=>{const a=document.querySelector<HTMLCanvasElement>('#sidebar-img-container #img canvas.mainCanvas'),b=document.querySelector<HTMLCanvasElement>('.dgw-preview canvas');return !!a&&!!b&&b.dataset.previewSource==='sidebar'&&b.toDataURL()!==old&&a.toDataURL()===b.toDataURL()},before);
 await p.evaluate(()=>(()=>{const sidebar=document.querySelector<HTMLElement>('#sidebar-img-container');if(!sidebar)throw Error('Missing native sidebar');sidebar.style.display='none'})());
 await p.locator('.dgw-item').first().click();
 await p.waitForFunction(()=>{const a=document.querySelector<HTMLCanvasElement>('#sidebar-img-container #img canvas.mainCanvas'),b=document.querySelector<HTMLCanvasElement>('.dgw-preview canvas');return !!a&&!!b&&b.dataset.previewSource==='sidebar'&&a.toDataURL()===b.toDataURL()});
 assert.ok((await compare()).equal);
 await p.evaluate(()=>(()=>{const sidebar=document.querySelector<HTMLElement>('#sidebar-img-container');if(!sidebar)throw Error('Missing native sidebar');sidebar.style.display=''})());
 await p.screenshot({path:path.join(__dirname,'artifacts/sidebar-preview'+(process.env.DOL_WARDROBE_INTEGRATED?'-integrated':'')+'.png')});
 await p.evaluate(()=>document.querySelector('#sidebar-img-container')?.remove());
 await p.waitForFunction(()=>{const b=document.querySelector<HTMLCanvasElement>('.dgw-preview canvas');return !!b&&!b.dataset.previewSource},{},{timeout:20000});
 assert.equal(await p.locator('.dgw-preview canvas').count(),1);
 console.log('PASS native sidebar pixel copy, wear sync, hidden sidebar, missing-source isolated fallback');
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
