// Bounded, content-free observations shared by the real browser checks and counterexamples.
import assert = require('node:assert/strict');
import type {Page} from 'playwright';
function check(ok:unknown,code:string,snapshot:unknown):asserts ok{assert.ok(ok,`${code}: ${JSON.stringify(snapshot)}`)}
function readSettingsSnapshot(){return {
 dialog:(()=>{const d=document.querySelector<HTMLDialogElement>('#dol-midnight-controls');return{present:!!d,open:!!d?.open,modal:!!d?.matches(':modal'),leaving:!!d?.hasAttribute('data-sf-leaving')}})(),
 settingsOpen:document.documentElement.hasAttribute('data-dgu-settings-open'),
 materialCount:document.querySelectorAll('.dmt-settings-context,.dmt-settings-material').length,
 closeAnimations:[...(document.querySelector('.dmt-settings-shell')?.getAnimations()||[])].map(a=>({state:a.playState,time:a.currentTime,duration:a.effect?.getTiming().duration})),
 transition:!!document.querySelector('#dol-midnight-controls[data-workspace-transition]'),
 sections:[...document.querySelectorAll('.dmt-workspace-section')].map(n=>({heading:n.getAttribute('aria-labelledby'),inert:n.hasAttribute('inert'),hidden:n.getAttribute('aria-hidden')==='true'})),
 readingEnabled:!!document.querySelector('[aria-label="舒适阅读间距"]:enabled'),
 animations:document.querySelectorAll('.dmt-workspace-section').length?[...document.querySelectorAll('.dmt-workspace-section')].flatMap(n=>n.getAnimations().map(a=>({state:a.playState,time:a.currentTime,duration:a.effect?.getTiming().duration}))):[]
 }}
async function settingsSnapshot(page:Page){return page.evaluate(readSettingsSnapshot)}
async function settingsSample(page:Page,condition:()=>boolean){
 // Both callbacks are trusted, closure-free browser code; capture in the predicate task, before driver latency can advance the animation.
 const handle=await page.waitForFunction<ReturnType<typeof readSettingsSnapshot>>(`(()=>{if(!(${condition.toString()})())return false;return (${readSettingsSnapshot.toString()})();})()`);
 try{return await handle.jsonValue()}finally{await handle.dispose()}
}
function assertSettings(snapshot:Awaited<ReturnType<typeof settingsSnapshot>>,heading='dmt-reading-heading'){
 check(!snapshot.transition,'MOODY_SETTINGS_PENDING',snapshot);
 check(snapshot.sections.length===1,'MOODY_SETTINGS_RESIDUAL',snapshot);
 const section=snapshot.sections[0];
 check(section&&section.heading===heading&&!section.inert&&!section.hidden,'MOODY_SETTINGS_FINAL_STATE',snapshot);
 if(heading==='dmt-reading-heading')check(snapshot.readingEnabled,'MOODY_SETTINGS_DISABLED',snapshot);
}
async function waitSettings(page:Page,heading='dmt-reading-heading',{timeout=3000}={}){
 try{await page.waitForFunction(()=>!document.querySelector('#dol-midnight-controls[data-workspace-transition]')&&document.querySelectorAll('.dmt-workspace-section').length===1,null,{timeout})}
 catch(error){if(!(error instanceof Error)||error.name!=='TimeoutError')throw error;assertSettings(await settingsSnapshot(page),heading);throw error}
 const snapshot=await settingsSnapshot(page);assertSettings(snapshot,heading);return snapshot;
}
function assertSettingsClosed(snapshot:Awaited<ReturnType<typeof settingsSnapshot>>){
 check(snapshot.dialog?.present&&!snapshot.dialog.open&&!snapshot.dialog.modal&&!snapshot.dialog.leaving&&!snapshot.settingsOpen&&snapshot.materialCount===0,'MOODY_SETTINGS_CLOSE_PENDING',snapshot);
}
async function waitSettingsClosed(page:Page,{timeout=3000}={}){
 try{await page.waitForFunction(()=>{const d=document.querySelector<HTMLDialogElement>('#dol-midnight-controls');return d&&!d.open&&!d.matches(':modal')&&!d.hasAttribute('data-sf-leaving')&&!document.documentElement.hasAttribute('data-dgu-settings-open')&&!document.querySelector('.dmt-settings-context,.dmt-settings-material')},null,{timeout})}
 catch(error){if(!(error instanceof Error)||error.name!=='TimeoutError')throw error;assertSettingsClosed(await settingsSnapshot(page));throw error}
 const snapshot=await settingsSnapshot(page);assertSettingsClosed(snapshot);return snapshot;
}
async function orbitSnapshot(page:Page){return page.evaluate(()=>{
 const nav=document.querySelector<HTMLElement>('.dcu-arrangement'),ring=nav?.querySelector<HTMLElement>('.dmt-orbit-focus'),button=nav?.querySelector('[aria-current]'),base=ring?.offsetParent,shell=document.querySelector('.dcu-shell');
 const rect=(n:Element|null|undefined)=>{if(!n)return null;const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};
 const size=(n:Element|null|undefined)=>n?{offsetWidth:n instanceof HTMLElement?n.offsetWidth:undefined,offsetHeight:n instanceof HTMLElement?n.offsetHeight:undefined,clientWidth:n.clientWidth,scrollWidth:n.scrollWidth}:null;
 return{nav:rect(nav),ring:rect(ring),button:rect(button),base:rect(base),baseSize:size(base),navSize:size(nav),shellSize:size(shell),baseIsNav:base===nav,baseContainsButton:!!base?.contains(button??null),navDisplay:nav?getComputedStyle(nav).display:null,position:ring?getComputedStyle(ring).position:null,viewBox:ring?.querySelector('svg')?.getAttribute('viewBox')??null,inline:ring?[ring.style.left,ring.style.top,ring.style.width,ring.style.height]:[]};
 })}
function assertOrbit(s:Awaited<ReturnType<typeof orbitSnapshot>>){
 const {ring,button,base}=s;
 check(!!ring&&!!button&&!!base,'MOODY_ORBIT_MISSING',s);
 check(s.viewBox!==null&&s.viewBox.trim().split(/\s+/).length===4&&s.viewBox.trim().split(/\s+/).every(v=>Number.isFinite(Number(v)))&&s.inline.every(v=>!(/NaN|Infinity/.test(v)))&&[ring,button,base].every(r=>Object.values(r).every(Number.isFinite)),'MOODY_ORBIT_NONFINITE',s);
 check(s.position==='absolute','MOODY_ORBIT_POSITION',s);
 check(s.baseSize&&s.baseContainsButton&&base.width>0&&base.height>0&&(s.baseSize.offsetWidth??0)>0&&(s.baseSize.offsetHeight??0)>0&&(s.navDisplay!=='contents'||!s.baseIsNav),'MOODY_ORBIT_POSITIONING_SURFACE',s);
 check(ring.width>0&&ring.height>0&&(['x','y','width','height'] as const).every(k=>Math.abs(ring[k]-button[k])<2),'MOODY_ORBIT_ALIGNMENT',s);
 check(s.navSize&&s.shellSize&&s.navSize.scrollWidth<=s.navSize.clientWidth+1&&s.shellSize.scrollWidth<=s.shellSize.clientWidth+1,'MOODY_ORBIT_OVERFLOW',s);
}
async function waitOrbit(page:Page,{timeout=3000}={}){
 // Poll the same complete oracle; a timeout is diagnosed by its precise assertion below.
 const until=Date.now()+timeout;let snapshot;
 do{snapshot=await orbitSnapshot(page);try{assertOrbit(snapshot);return snapshot}catch(error){if(!(error instanceof Error)||!('code' in error)||error.code!=='ERR_ASSERTION')throw error}if(Date.now()>=until)break;await page.evaluate(()=>new Promise(requestAnimationFrame))}while(true);
 assertOrbit(snapshot);
}
export = {settingsSnapshot,settingsSample,assertSettings,waitSettings,assertSettingsClosed,waitSettingsClosed,orbitSnapshot,assertOrbit,waitOrbit};
