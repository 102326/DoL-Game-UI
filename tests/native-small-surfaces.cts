import playwright = require('playwright');
import assert = require('node:assert/strict');
import path = require('node:path');
import url = require('node:url');
import type {GameUiControls} from '../src/runtime/game-controls';
declare const DoLGameUI:GameUiControls;
type TooltipOptions={title?:string;message?:string;position?:string;delay?:number};
type TooltipAction='show'|'hide'|'enable'|'disable';
declare const jQuery:{(node:Element):{tooltip(options:TooltipOptions):void;tooltip(action:TooltipAction):void};fn:{tooltip:unknown}};
declare const SugarCube:{State:{variables:Record<string,unknown>};Dialog:{setup(title:string):void;append(html:string):void;open():void;isOpen():boolean}};
declare const probe:HTMLButtonElement,probeParent:Node|null,originalTooltip:HTMLElement,extra:HTMLButtonElement;
declare let modCalls:number,actionCalls:number,changeCalls:number;
declare const dialogNodes:Element[],dialogParents:(Node|null)[];
const {chromium}=playwright,{pathToFileURL}=url;
declare const must:<T>(node:T|null)=>T;
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:1363,height:876}});
 await p.goto(pathToFileURL(path.join(__dirname,'fixture.html')).href);await p.evaluate(()=>Object.assign(window,{must:<T,>(node:T|null)=>{if(!node)throw Error('Missing native fixture');return node}}));
 if(!await p.evaluate(()=>typeof jQuery.fn.tooltip==='function')){
  await p.addStyleTag({path:path.resolve(__dirname,'../../../upstream/vanilla-0.5.11.9-source/modules/css/tooltip.css')});
  await p.addScriptTag({path:path.resolve(__dirname,'../../../upstream/vanilla-0.5.11.9-source/game/03-JavaScript/jQuery/tooltip.js')});
 }
 await p.evaluate(()=>{const node=document.createElement('button');Object.assign(window,{probe:node});probe.textContent='Native tooltip anchor';probe.id='native-tooltip-probe';probe.style='position:fixed;left:20px;top:80px';document.body.append(probe);jQuery(probe).tooltip({title:'原生说明',message:'保持原版内容。<span style="color:rgb(180,50,50)">语义状态</span>',position:'bottom',delay:0});Object.assign(window,{probeParent:probe.parentNode});jQuery(probe).tooltip('show')});
 await p.waitForSelector('body>.tooltip-popup[data-tooltip-id]');
 const original=await p.locator('.tooltip-popup').evaluate(e=>({radius:getComputedStyle(e).borderRadius,blur:getComputedStyle(e).backdropFilter}));
 await p.evaluate(()=>jQuery(probe).tooltip('hide'));
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 const before=await p.evaluate(()=>JSON.stringify(SugarCube.State.variables));
 for(const width of [390,1363])for(const scale of [100,200]){
  await p.setViewportSize({width,height:876});
  await p.evaluate(scale=>{document.documentElement.style.fontSize=scale+'%';jQuery(probe).tooltip({message:'保持原版内容。<span style="color:rgb(180,50,50)">语义状态</span>'+('LongUnbrokenModText'.repeat(12))});jQuery(probe).tooltip('show')},scale);
  for(const [tier,glass,blur] of [[0,true,'none'],[1,true,'blur(24px)'],[2,true,'blur(24px)'],[2,false,'none']] as const){
   await p.evaluate(({tier,glass})=>{DoLGameUI.setPreference('visualTier',tier);DoLGameUI.setPreference('visualGlass',glass)},{tier,glass});
   const m=await p.locator('.tooltip-popup').evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{radius:s.borderRadius,blur:s.backdropFilter,edge:s.borderColor,animation:s.animationName,position:s.position,bodyBlur:getComputedStyle(must(e.querySelector('.tooltip-body'))).backdropFilter,semantic:getComputedStyle(must(e.querySelector('span'))).color,inside:r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1,overflow:e.scrollWidth>e.clientWidth+1}});
   assert.equal(m.radius,'12px');assert.equal(m.edge,'rgba(255, 255, 255, 0.08)');assert.equal(m.blur,blur);assert.equal(m.bodyBlur,'none');assert.equal(m.animation,'none');assert.equal(m.position,'fixed');assert.equal(m.semantic,'rgb(180, 50, 50)');assert.ok(m.inside,width+'/'+scale);assert.equal(m.overflow,false);
  }
  await p.evaluate(()=>jQuery(probe).tooltip('hide'));assert.equal(await p.locator('.tooltip-popup').count(),0);
 }
 await p.evaluate(()=>{document.documentElement.style.fontSize='100%';jQuery(probe).tooltip({message:'原生内容'});jQuery(probe).tooltip('disable');jQuery(probe).tooltip('show')});assert.equal(await p.locator('.tooltip-popup').count(),0);
 await p.evaluate(()=>{jQuery(probe).tooltip('enable');jQuery(probe).tooltip('show');const tooltip=document.querySelector<HTMLElement>('.tooltip-popup');if(!tooltip)throw Error('Missing native tooltip');const button=document.createElement('button');Object.assign(window,{originalTooltip:tooltip,extra:button,modCalls:0});extra.textContent='Mod control';extra.onclick=()=>modCalls++;must(originalTooltip.querySelector('.tooltip-body')).append(extra)});
 await p.locator('.tooltip-popup button').click();assert.equal(await p.evaluate(()=>modCalls),1);assert.ok(await p.evaluate(()=>extra.parentElement===originalTooltip.querySelector('.tooltip-body')));
 await p.evaluate(()=>DoLGameUI.setPreference('enabled',false));assert.deepEqual(await p.locator('.tooltip-popup').evaluate(e=>({radius:getComputedStyle(e).borderRadius,blur:getComputedStyle(e).backdropFilter})),original);
 assert.notEqual(await p.evaluate(()=>{DoLGameUI.setPreference('enabled',true);jQuery(probe).tooltip('hide');const unknown=document.createElement('div');unknown.className='tooltip-popup';unknown.textContent='Unknown popup';document.body.append(unknown);const radius=getComputedStyle(unknown).borderRadius;unknown.remove();return radius}),'12px');
 // Native SugarCube owns the content nodes, events and every close path.
 await p.evaluate(()=>{SugarCube.Dialog.setup('原生确认窗口');SugarCube.Dialog.append('<p>只读控件样例，不连接游戏操作。</p><label><input type="checkbox" id="native-dialog-check">原版开关</label><select id="native-dialog-select"><option value="1">原版选项</option></select><input type="file" id="native-dialog-file"><button id="native-dialog-action">检查回调</button><button disabled id="native-dialog-disabled">不可用</button><div hidden id="native-dialog-unknown">Unknown Mod</div>');const nodes=[...document.querySelectorAll('#ui-dialog-body *')];Object.assign(window,{dialogNodes:nodes,dialogParents:nodes.map(n=>n.parentNode),actionCalls:0,changeCalls:0});must(document.querySelector<HTMLElement>('#native-dialog-action')).onclick=()=>actionCalls++;must(document.querySelector('#native-dialog-check')).addEventListener('change',()=>changeCalls++);SugarCube.Dialog.open()});
 await p.locator('#native-dialog-action').click();await p.locator('#native-dialog-check').check();assert.equal(await p.evaluate(()=>actionCalls),1);assert.equal(await p.evaluate(()=>changeCalls),1);assert.equal(await p.locator('#native-dialog-unknown').isVisible(),false);assert.ok(await p.locator('#native-dialog-disabled').isDisabled());
 await p.locator('#native-dialog-file').focus();await p.keyboard.press('Tab');assert.ok(await p.locator('#native-dialog-action').evaluate(e=>e===document.activeElement));assert.equal(await p.locator('#native-dialog-action').evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
 for(const width of [390,1363])for(const scale of [100,200]){
  await p.setViewportSize({width,height:876});await p.evaluate(scale=>document.documentElement.style.fontSize=scale+'%',scale);
  assert.ok(await p.locator('#ui-dialog-body').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'native dialog fits '+width+'/'+scale);
 }
 assert.ok(await p.evaluate(()=>dialogNodes.every((n,i)=>n.isConnected&&n.parentNode===dialogParents[i])),'native dialog nodes/parents unchanged');
 await p.locator('#ui-dialog-close').hover();await p.waitForFunction(()=>getComputedStyle(must(document.querySelector('#ui-dialog-close'))).backgroundColor==='rgb(43, 45, 50)');
 await p.locator('#ui-dialog-close').click();assert.equal(await p.evaluate(()=>SugarCube.Dialog.isOpen()),false);
 await p.evaluate(()=>{SugarCube.Dialog.setup('Escape');SugarCube.Dialog.append('Native close');SugarCube.Dialog.open()});await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>SugarCube.Dialog.isOpen()),false);
 await p.evaluate(()=>{SugarCube.Dialog.setup('Shade');SugarCube.Dialog.append('Native close');SugarCube.Dialog.open()});const shade=await p.locator('#ui-overlay').boundingBox();if(!shade)throw Error('Missing dialog shade');await p.locator('#ui-overlay').click({position:{x:20-shade.x,y:20-shade.y}});assert.equal(await p.evaluate(()=>SugarCube.Dialog.isOpen()),false);
 assert.equal(await p.evaluate(()=>JSON.stringify(SugarCube.State.variables)),before);
 await p.evaluate(()=>{jQuery(probe).tooltip('show');probe.remove()});await p.waitForFunction(()=>!document.querySelector('.tooltip-popup'));
 assert.equal(await p.locator('#native-tooltip-probe').count(),0);
 console.log('PASS native small surfaces: original tooltip lifetime/position/Mod content/semantic colours/fallback, widths/200%/tiers/single blur; Dialog native controls/events/disabled/hidden/parents/focus/three close paths; game state unchanged');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
