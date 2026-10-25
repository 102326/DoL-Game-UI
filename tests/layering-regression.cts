import playwright = require('playwright');
import assert = require('node:assert/strict');
import path = require('node:path');
import url = require('node:url');
import type {CombatControls} from '../src/combat/types';
import type {GameUiControls} from '../src/runtime/game-controls';
const {chromium}=playwright,{pathToFileURL}=url;
declare const DoLCombatUI:CombatControls;
declare const DoLGameUI:GameUiControls;
declare const originalNext:Element;
declare let continueClicks:number;
declare const savedPopover:typeof HTMLElement.prototype.showPopover;
declare const tip:HTMLElement;
declare const tipParent:Node|null;
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1000,height:700}});await p.goto(pathToFileURL(path.join(__dirname,'fixture.html')).href);await p.waitForSelector('#listContainer');await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});
 await p.evaluate(()=>{const passage=document.querySelector<HTMLElement>('.passage'),next=document.querySelector('#next');if(!passage||!next)throw Error('Missing combat fixture');passage.style.filter='blur(0px)';Object.assign(window,{originalNext:next,continueClicks:0,savedPopover:HTMLElement.prototype.showPopover});Object.defineProperty(HTMLElement.prototype,'showPopover',{value:undefined});originalNext.addEventListener('click',()=>continueClicks++)});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});await p.waitForSelector('.dcu-footer');await p.evaluate(()=>scrollTo(0,250));await p.waitForTimeout(100);const control=await p.locator('.dcu-footer').boundingBox();if(!control)throw Error('Missing legacy footer');assert.ok(Math.abs(control.y+control.height-700)>5,'filtered ancestor reproduces legacy fixed positioning');await p.evaluate(()=>{HTMLElement.prototype.showPopover=savedPopover;DoLCombatUI.refresh()});await p.waitForSelector('.dcu-footer:popover-open');
 const settle=()=>p.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
 for(const width of [390,1000]){await p.setViewportSize({width,height:700});for(const transform of ['none','translateY(40px)']){await p.evaluate(t=>{const n=document.querySelector<HTMLElement>('.passage');if(!n)throw Error('Missing passage');n.style.transform=t},transform);await settle();for(const y of [0,250]){await p.evaluate(y=>scrollTo(0,y),y);await settle();const r=await p.locator('.dcu-footer').boundingBox();if(!r)throw Error('Missing active footer');assert.ok(Math.abs(r.y+r.height-700)<2,JSON.stringify({width,transform,y,r}));assert.ok(r.x>=0&&r.x+r.width<=width+2);assert.equal(await p.evaluate(()=>document.querySelector('.dcu-footer #next')===originalNext),true)}}}
 await p.evaluate(()=>DoLGameUI.openSettings());await settle();assert.equal(await p.locator('.dcu-footer:popover-open').count(),0,'native modal takes priority');await p.locator('.dmt-close').click();await settle();assert.equal(await p.locator('.dcu-footer:popover-open').count(),1);
 await p.evaluate(()=>{const n=document.querySelector<HTMLElement>('.dcu-footer #next a');if(!n)throw Error('Missing native continue');n.click()});assert.equal(await p.evaluate(()=>continueClicks),1,'same native handler');await p.evaluate(()=>DoLGameUI.setPreference('combatEnabled',false));await settle();assert.equal(await p.locator('.dcu-footer:popover-open').count(),0);
 // A native body popup overlapping the shop shield must be above it, without moving nodes.
 await p.evaluate(()=>{document.documentElement.setAttribute('data-dol-midnight','');document.body.insertAdjacentHTML('beforeend','<div class="dgshop-content"><div id="shield" style="position:fixed;inset:0;z-index:10000;background:#222"><div class="filters-div">Filters</div></div></div><div class="tooltip-popup" data-tooltip-id="native-test" style="position:absolute;left:200px;top:200px;width:180px;height:80px;background:#444">Trait details</div>');const n=document.querySelector<HTMLElement>('.tooltip-popup[data-tooltip-id="native-test"]');if(!n)throw Error('Missing native tooltip');Object.assign(window,{tip:n,tipParent:n.parentNode});scrollTo(0,0)});await settle();
 const hit=()=>p.evaluate(()=>{const r=tip.getBoundingClientRect();return tip.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});assert.equal(await hit(),true);await p.evaluate(()=>tip.style.zIndex='1000');assert.equal(await hit(),false,'native 1000 control reproduces obstruction');await p.evaluate(()=>tip.style.removeProperty('z-index'));assert.equal(await hit(),true);assert.equal(await p.evaluate(()=>tip.parentNode===tipParent),true);
 console.log('PASS layering: filtered/transformed ancestors, scroll, two widths, native continuation identity/event, modal priority/rollback, shop shield tooltip hit-test and native-node retention. Synthetic desktop scope.');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
