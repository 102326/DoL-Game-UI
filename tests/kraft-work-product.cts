import playwright = require('playwright');
import url = require('node:url');
import path = require('node:path');
import assert = require('node:assert/strict');
import type {FloatingApi} from '../src/floating/preferences';
import type {GameUiControls} from '../src/runtime/game-controls';
const {chromium}=playwright,{pathToFileURL}=url;
declare const DoLFloatingTools:FloatingApi;
declare const DoLGameUI:GameUiControls;
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:1280,height:900}}),errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.join(process.cwd(),'tests/fixture.html')).href);await p.waitForSelector('#listContainer');await p.addStyleTag({path:'dist/framework/official-ui/style.css'});for(const name of ['host','official-ui'])await p.addScriptTag({path:`dist/framework/${name}/index.js`});await p.waitForFunction(()=>typeof DoLFloatingTools!=='undefined');await p.evaluate(()=>DoLFloatingTools.show());await p.locator('.sf-motion-ball').waitFor();
 for(const design of ['official']){
  await p.evaluate(()=>document.documentElement.removeAttribute('data-kw-hub-design'));
  for(const [width,height]of [[1280,900],[390,844],[844,390],[280,320]] as const){
   await p.setViewportSize({width,height});await p.waitForTimeout(200);await p.locator('.sf-motion-ball').click();await p.waitForTimeout(750);
   const r=await p.locator('.sf-motion-orbit').evaluate(n=>{const ballNode=document.querySelector('.sf-motion-ball');if(!ballNode)throw Error('Missing official Hub ball');const a=n.getBoundingClientRect(),ball=ballNode.getBoundingClientRect();return{inside:a.left>=0&&a.top>=0&&a.right<=innerWidth+1&&a.bottom<=innerHeight+1,cols:getComputedStyle(n).gridTemplateColumns,overlap:a.left<ball.right&&a.right>ball.left&&a.top<ball.bottom&&a.bottom>ball.top,controls:[...n.querySelectorAll('button')].filter(b=>{const r=b.getBoundingClientRect();return r.top>=a.top&&r.bottom<=a.bottom}).every(b=>{const r=b.getBoundingClientRect();return r.height>=44&&b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})}});
   assert.equal(r.inside,true,JSON.stringify({design,width,r}));assert.equal(r.overlap,false);assert.equal(r.controls,true);if(width===1280)assert.equal(r.cols.split(' ').length,2);await p.locator('.sf-motion-ball').press('Escape');
  }
 }
 assert.equal(await p.locator('.sf-motion-tool-label').count(),5,'one official constellation with readable labels');
 await p.setViewportSize({width:1280,height:900});await p.evaluate(()=>DoLGameUI.openSettings());await p.waitForTimeout(700);
 const nav=await p.locator('.dmt-workspace-nav button').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().top));const first=nav[0];assert.notEqual(first,undefined);assert.ok(nav.every(y=>first!==undefined&&Math.abs(y-first)<1),'wide settings navigation forms a shared top rail');
 assert.equal(await p.locator('.dmt-reading-controls.sf-material-reading').count(),0,'controls are continuous rows rather than nested material cards');
 assert.equal(await p.locator('.dmt-reading-sample').evaluate(n=>n.getBoundingClientRect().height<300),true,'preview does not stretch into an empty second panel');
 await p.emulateMedia({reducedMotion:'reduce'});await p.getByRole('button',{name:'材质',exact:true}).click();await p.waitForTimeout(100);assert.equal(await p.locator('.dmt-workspace-section').evaluate(n=>n.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
 await p.evaluate(()=>DoLGameUI.destroy());assert.equal(await p.locator('.sf-motion-hub,[data-kw-entry],[data-kw-native]').count(),0);assert.deepEqual(errors,[]);
 await p.setContent('<html data-stone-free data-dol-midnight data-dmt-layout><aside id="ui-bar"><div id="overlayButtons"><button class="link-internal" data-kw-entry>Attributes</button><button class="link-internal" id="foreign" style="background:rgb(100,40,80)">Foreign</button></div></aside></html>');for(const css of ['src/theme/stone-free.css','src/theme/dark-acrylic.css','src/theme/kraft-work-motion.css'])await p.addStyleTag({path:css});
 const row=await p.locator('[data-kw-entry]').evaluate(n=>({radius:getComputedStyle(n).borderRadius,bg:getComputedStyle(n).backgroundColor,height:n.getBoundingClientRect().height}));assert.equal(row.radius,'11px','accepted rectangular sidebar with slight corner radius matches official-game-motion contract');assert.equal(row.bg,'rgba(0, 0, 0, 0)');assert.ok(row.height>=44);await p.locator('[data-kw-entry]').focus();assert.equal(await p.locator('[data-kw-entry]').evaluate(n=>getComputedStyle(n).outlineWidth),'1px');assert.equal(await p.locator('#foreign').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(100, 40, 80)');
 console.log('PASS fused official Hub, bounded/nonoverlapping hitboxes, continuous settings rows, native sidebar cascade/unknown boundary and reduced/disposal');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
