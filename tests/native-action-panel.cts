import playwright = require('playwright');
import assert = require('node:assert/strict');
import path = require('node:path');
import url = require('node:url');
import type {CombatControls} from '../src/combat/types';
const {chromium}=playwright,{pathToFileURL}=url;
declare const DoLCombatUI:CombatControls;
function installActionProbe(){
 const passages=document.getElementById('passages');if(!passages)throw Error('Missing passages fixture');
 passages.innerHTML='<div class="passage"><p>First group</p><label><input type="radio" name="radiobutton-leftaction" checked>A</label> | <label><input type="radio" name="radiobutton-leftaction">B</label><br><p>Second group</p><label><input type="radio" name="radiobutton-rightaction" checked>C</label><div id="masturbationButtons"><div id="next"><a href="#">Continue</a></div><div id="stop"><a href="#">Stop</a></div></div></div>';
 const source=document.querySelector('.passage');if(!source)throw Error('Missing native passage');
 const radios=[...document.querySelectorAll<HTMLInputElement>('input[type=radio]')],second=radios[1];if(!second)throw Error('Missing second native radio');
 let modRadio:HTMLInputElement|undefined;
 const probe={original:source.innerHTML,radios,events:0,modEvents:0,get modRadio(){return modRadio},appendMod(){
  const label=document.createElement('label');label.id='mod-action';label.innerHTML='<input type="radio" name="radiobutton-extra">Extra';const input=label.querySelector('input');if(!input)throw Error('Missing Mod radio');modRadio=input;input.addEventListener('change',()=>probe.modEvents++);
  const passage=document.querySelector('.passage');if(!passage)throw Error('Missing native passage');passage.append(label);
 }};
 second.addEventListener('change',()=>probe.events++);Object.assign(window,{actionPanelProbe:probe});return probe;
}
declare const actionPanelProbe:ReturnType<typeof installActionProbe>;

(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{const p=await b.newPage({viewport:{width:1363,height:876}});await p.goto(pathToFileURL(path.join(__dirname,'fixture.html')).href);await p.evaluate(installActionProbe);await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});await p.waitForSelector('.dcu-footer');assert.equal(await p.locator('.dcu-group').count(),2);await p.locator('input[type=radio]').nth(1).check();assert.equal(await p.evaluate(()=>actionPanelProbe.events),1);
for(const width of [1363,390]){await p.setViewportSize({width,height:876});await p.waitForTimeout(150);const m=await p.locator('.dcu-footer').evaluate(e=>{const reserve=document.querySelector('.dcu-bottom-reserve');if(!(e instanceof HTMLElement)||!(reserve instanceof HTMLElement))throw Error('Missing footer reserve');return{bottom:e.getBoundingClientRect().bottom,right:e.getBoundingClientRect().right,reserve:reserve.offsetHeight,height:e.offsetHeight}});assert.ok(Math.abs(m.bottom-876)<2);assert.ok(m.right<=width+1);assert.equal(m.reserve,m.height+16)}
await p.evaluate(()=>DoLCombatUI.setEnabled(false));await p.waitForTimeout(100);assert.equal(await p.locator('[data-dcu-action-list],.dcu-footer').count(),0);assert.ok(await p.evaluate(()=>actionPanelProbe.radios.every(x=>x.isConnected)));assert.equal(await p.locator('.passage').innerHTML(),await p.evaluate(()=>actionPanelProbe.original));await p.evaluate(()=>DoLCombatUI.setEnabled(true));await p.waitForSelector('.dcu-footer');assert.equal(await p.locator('.dcu-group').count(),2);await p.evaluate(()=>actionPanelProbe.appendMod());await p.waitForFunction(()=>document.querySelectorAll('.dcu-group').length===3);await p.locator('#mod-action input').check();assert.equal(await p.evaluate(()=>actionPanelProbe.modEvents),1);await p.evaluate(()=>DoLCombatUI.setEnabled(false));assert.ok(await p.evaluate(()=>{const radio=actionPanelProbe.modRadio;return !!radio&&radio.isConnected&&radio===document.querySelector('#mod-action input')&&radio.checked}));await p.evaluate(()=>DoLCombatUI.destroy());assert.equal(await p.locator('[data-dcu-action-list],.dcu-footer').count(),0);console.log('PASS native grouping, input event/identity, fixed footer/mobile reserve, exact markup rollback, remount/destroy');}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
