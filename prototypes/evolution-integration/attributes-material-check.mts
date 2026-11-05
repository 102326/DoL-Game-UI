import {createEvo42Server} from '../../scripts/preview-evo42.mts';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
declare const attributesPreview:{close():void;dispose():void;counts():{actions:number;disposed:boolean};theme:{setPreference(key:'visualMotion',value:boolean):void}};
const output=`tests/artifacts/ui42/attributes-material/${Date.now()}`;fs.mkdirSync(output,{recursive:true});
const files=['prototypes/evolution-integration/attributes-material-preview.ts','prototypes/evolution-integration/attributes-material-study.ts','prototypes/evolution-integration/attributes-material.css','prototypes/evolution-integration/attributes-material.html','prototypes/evolution-integration/attributes-material-check.mts','src/theme/settings-material.ts','src/ui/native-overlay-navigation.ts','src/ui/foreground-plane.ts','src/ui/foreground-plane.css','src/ui/navigation-geometry.ts','src/ui/visual-scope.ts','src/characteristics/main.ts','framework/official-ui/navigation.ts','package-lock.json'];
const hashes=()=>Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));const before=hashes();
const server=await createEvo42Server(0),address=server.httpServer!.address();assert(address&&typeof address!=='string');
const browser=await chromium.launch(),errors:string[]=[],results:unknown[]=[];const legacy=process.argv.includes('--legacy-target');
try{
 for(const width of legacy?[1280]:[1280,390])for(const variant of legacy?['study']:['baseline','study']){
  const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:output,size:{width,height:900}}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${address.port}/prototypes/evolution-integration/attributes-material.html?variant=${variant}${legacy?'&legacyTarget=1':''}`);
  const overlay=page.locator('#customOverlay'),header=page.locator('#customOverlayTitle'),body=page.locator('#customOverlayContent'),motionLayer=page.locator('#attributes-motion-layer');await page.locator('.dgc-navigation').waitFor();
  if(variant==='study')await page.locator('[data-e42-attributes-material]').waitFor();
  await page.waitForTimeout(200);const initial=await overlay.boundingBox();assert(initial);assert(initial.width>width*.5&&initial.height>400,'actual usable shell, not compressed');
  await page.locator('#native-action').click();assert.equal(await page.evaluate(()=>attributesPreview.counts().actions),1);
  await page.locator('#weather').selectOption('rain');await page.waitForTimeout(250);
  const aligned=async(phase:string)=>{const alignment=await page.evaluate(()=>{const source=document.querySelector<HTMLElement>('.dmt-orbit-focus[data-sf-foreground-source]'),copy=document.querySelector<HTMLElement>('.sf-foreground-orbit');if(!source||!copy)throw Error('Missing real foreground mirror');const a=source.getBoundingClientRect(),b=copy.getBoundingClientRect();return {dx:Math.abs(a.x-b.x),dy:Math.abs(a.y-b.y),dw:Math.abs(a.width-b.width),dh:Math.abs(a.height-b.height)}});assert(Object.values(alignment).every(v=>v<1),'foreground alignment at '+phase+': '+JSON.stringify(alignment))};
  const drag=async(dx=35,dy=15,check=false)=>{const r=await header.boundingBox();assert(r);const x=r.x+r.width*.45,y=r.y+r.height*.5;await page.mouse.move(x,y);await page.mouse.down();for(const fraction of [.25,.5,1]){await page.mouse.move(x+dx*fraction,y+dy*fraction,{steps:3});if(check)await aligned('drag '+fraction)}};
  assert.equal(await motionLayer.locator(':scope>.sf-foreground-host').count(),1,'one owned foreground host');
  await drag(35,15,true);await page.screenshot({path:`${output}/${width}-${variant}-drag.png`});
  const during=await overlay.boundingBox();assert(during);if(variant==='study')assert(during.x>initial.x+5||during.y>initial.y+5,'study visibly responds to drag');else assert.deepEqual(during,initial);
  await page.mouse.up();await page.waitForFunction(()=>{const n=document.querySelector<HTMLElement>('[data-e42-attributes-material]'),core=document.querySelector<HTMLElement>('#customOverlayContent');const target=document.querySelector<HTMLElement>('#attributes-motion-layer');return !n||!!target&&/^1(?: 1)?$/.test(target.style.scale)&&!!core&&/^0px(?: 0px)?$/.test(core.style.translate)&&/^1(?: 1)?$/.test(core.style.scale)});
  await aligned('settled');
  const stable=await motionLayer.getAttribute('style');await page.waitForTimeout(150);assert.equal(await motionLayer.getAttribute('style'),stable,'idle shell stops writing');
  await page.getByRole('button',{name:'学业',exact:true}).click();await page.waitForFunction(()=>document.getElementById('customOverlayContent')!.scrollTop>100);
  assert(await body.evaluate(n=>n.scrollHeight>n.clientHeight),'native body remains scrollable');
  await page.locator('#weather').selectOption('snow');await page.waitForTimeout(250);await page.screenshot({path:`${output}/${width}-${variant}-snow.png`});await aligned('scrolled and snow');
  // Switch to another native role, then back: the old study must release its styles.
  await page.locator('#overlayTabs').getByRole('button',{name:'社交',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('[data-e42-attributes-material]'));
  assert.equal(await motionLayer.evaluate(n=>(n as HTMLElement).style.translate),'');
  await page.locator('#overlayTabs').getByRole('button',{name:'属性',exact:true}).click();await page.locator('.dgc-navigation').waitFor();
  if(variant==='study'){
   await page.locator('[data-e42-attributes-material]').waitFor();await drag();
   await page.evaluate(()=>attributesPreview.close());await page.mouse.up();await overlay.waitFor({state:'hidden'});assert.equal(await motionLayer.evaluate(n=>(n as HTMLElement).style.translate),'');
   await page.locator('#open').click();await page.locator('[data-e42-attributes-material]').waitFor();
   await page.emulateMedia({reducedMotion:'reduce'});await drag();assert.match(await motionLayer.evaluate(n=>(n as HTMLElement).style.scale),/^1(?: 1)?$/);await page.mouse.up();
   await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>attributesPreview.theme.setPreference('visualMotion',false));await drag();assert.match(await motionLayer.evaluate(n=>(n as HTMLElement).style.scale),/^1(?: 1)?$/);await page.mouse.up();
   await page.evaluate(()=>attributesPreview.theme.setPreference('visualMotion',true));
   await page.locator('#rebuild').click();await page.locator('[data-e42-attributes-material]').waitFor();assert.equal(await page.locator('[data-e42-attributes-material]').count(),1);assert.equal(await motionLayer.locator(':scope>.sf-foreground-host').count(),1,'replacement has one foreground owner');
  }
  await page.evaluate(()=>attributesPreview.dispose());assert.equal(await page.locator('[data-e42-attributes-material]').count(),0);assert.equal(await motionLayer.evaluate(n=>(n as HTMLElement).style.translate),'');
  await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));document.dispatchEvent(new Event('visibilitychange'))});await page.waitForTimeout(50);assert.equal(await page.locator('[data-e42-attributes-material]').count(),0);
  assert.equal(await motionLayer.locator('.sf-foreground-host,.sf-foreground-orbit').count(),0,'disposed owned foreground DOM stays released');
  const count=await page.evaluate(()=>attributesPreview.counts().actions);await page.locator('#native-action').click();assert.equal(await page.evaluate(()=>attributesPreview.counts().actions),count+1,'study disposal preserves native action');
  const video=page.video();await context.close();if(video)await video.saveAs(`${output}/${width}-${variant}.webm`);results.push({width,variant,status:'PASS'});console.log('PASS',width,variant);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(hashes(),before,'review inputs stable');
 fs.writeFileSync(`${output}/result.json`,JSON.stringify({sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),node:process.version,browser:browser.version(),sources:before,results,errors,scope:'Controlled actual characteristics owner and native fixture; selected key input hashes, not a complete module graph. Mirror outer-rectangle samples at three drag points, settled and post-scroll/snow; owned foreground DOM cleanup, not complete observer accounting. No game/device or visual acceptance.'},null,2));
 console.log(output);
}finally{await browser.close();await server.close()}
