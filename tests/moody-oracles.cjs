// Bounded, content-free observations shared by the real browser checks and counterexamples.
const assert=require('node:assert/strict');
function check(ok,code,snapshot){assert.ok(ok,`${code}: ${JSON.stringify(snapshot)}`)}
async function settingsSnapshot(page){return page.evaluate(()=>({
 dialog:(()=>{const d=document.querySelector('#dol-midnight-controls');return{present:!!d,open:!!d?.open,modal:!!d?.matches(':modal'),leaving:!!d?.hasAttribute('data-sf-leaving')}})(),
 settingsOpen:document.documentElement.hasAttribute('data-dgu-settings-open'),
 materialCount:document.querySelectorAll('.dmt-settings-context,.dmt-settings-material').length,
 closeAnimations:[...(document.querySelector('.dmt-settings-shell')?.getAnimations()||[])].map(a=>({state:a.playState,time:a.currentTime,duration:a.effect?.getTiming().duration})),
 transition:!!document.querySelector('#dol-midnight-controls[data-workspace-transition]'),
 sections:[...document.querySelectorAll('.dmt-workspace-section')].map(n=>({heading:n.getAttribute('aria-labelledby'),inert:n.hasAttribute('inert'),hidden:n.getAttribute('aria-hidden')==='true'})),
 readingEnabled:!!document.querySelector('[aria-label="舒适阅读间距"]:enabled'),
 animations:document.querySelectorAll('.dmt-workspace-section').length?[...document.querySelectorAll('.dmt-workspace-section')].flatMap(n=>n.getAnimations().map(a=>({state:a.playState,time:a.currentTime,duration:a.effect?.getTiming().duration}))):[]
 }))}
function assertSettings(snapshot,heading='dmt-reading-heading'){
 check(!snapshot.transition,'MOODY_SETTINGS_PENDING',snapshot);
 check(snapshot.sections.length===1,'MOODY_SETTINGS_RESIDUAL',snapshot);
 check(snapshot.sections[0].heading===heading&&!snapshot.sections[0].inert&&!snapshot.sections[0].hidden,'MOODY_SETTINGS_FINAL_STATE',snapshot);
 if(heading==='dmt-reading-heading')check(snapshot.readingEnabled,'MOODY_SETTINGS_DISABLED',snapshot);
}
async function waitSettings(page,heading='dmt-reading-heading',{timeout=3000}={}){
 try{await page.waitForFunction(()=>!document.querySelector('#dol-midnight-controls[data-workspace-transition]')&&document.querySelectorAll('.dmt-workspace-section').length===1,null,{timeout})}
 catch(error){if(error.name!=='TimeoutError')throw error;assertSettings(await settingsSnapshot(page),heading);throw error}
 const snapshot=await settingsSnapshot(page);assertSettings(snapshot,heading);return snapshot;
}
function assertSettingsClosed(snapshot){
 check(snapshot.dialog?.present&&!snapshot.dialog.open&&!snapshot.dialog.modal&&!snapshot.dialog.leaving&&!snapshot.settingsOpen&&snapshot.materialCount===0,'MOODY_SETTINGS_CLOSE_PENDING',snapshot);
}
async function waitSettingsClosed(page,{timeout=3000}={}){
 try{await page.waitForFunction(()=>{const d=document.querySelector('#dol-midnight-controls');return d&&!d.open&&!d.matches(':modal')&&!d.hasAttribute('data-sf-leaving')&&!document.documentElement.hasAttribute('data-dgu-settings-open')&&!document.querySelector('.dmt-settings-context,.dmt-settings-material')},null,{timeout})}
 catch(error){if(error.name!=='TimeoutError')throw error;assertSettingsClosed(await settingsSnapshot(page));throw error}
 const snapshot=await settingsSnapshot(page);assertSettingsClosed(snapshot);return snapshot;
}
async function orbitSnapshot(page){return page.evaluate(()=>{
 const nav=document.querySelector('.dcu-arrangement'),ring=nav?.querySelector('.dmt-orbit-focus'),button=nav?.querySelector('[aria-current]'),base=ring?.offsetParent,shell=document.querySelector('.dcu-shell');
 const rect=n=>{if(!n)return null;const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};
 const size=n=>n?{offsetWidth:n.offsetWidth,offsetHeight:n.offsetHeight,clientWidth:n.clientWidth,scrollWidth:n.scrollWidth}:null;
 return{nav:rect(nav),ring:rect(ring),button:rect(button),base:rect(base),baseSize:size(base),navSize:size(nav),shellSize:size(shell),baseIsNav:base===nav,baseContainsButton:!!base?.contains(button),navDisplay:nav?getComputedStyle(nav).display:null,position:ring?getComputedStyle(ring).position:null,viewBox:ring?.querySelector('svg')?.getAttribute('viewBox')??null,inline:ring?[ring.style.left,ring.style.top,ring.style.width,ring.style.height]:[]};
 })}
function assertOrbit(s){
 check(!!s.ring&&!!s.button&&!!s.base,'MOODY_ORBIT_MISSING',s);
 check(s.viewBox!==null&&s.viewBox.trim().split(/\s+/).length===4&&s.viewBox.trim().split(/\s+/).every(v=>Number.isFinite(Number(v)))&&s.inline.every(v=>!(/NaN|Infinity/.test(v)))&&[s.ring,s.button,s.base].every(r=>Object.values(r).every(Number.isFinite)),'MOODY_ORBIT_NONFINITE',s);
 check(s.position==='absolute','MOODY_ORBIT_POSITION',s);
 check(s.baseContainsButton&&s.base.width>0&&s.base.height>0&&s.baseSize.offsetWidth>0&&s.baseSize.offsetHeight>0&&(s.navDisplay!=='contents'||!s.baseIsNav),'MOODY_ORBIT_POSITIONING_SURFACE',s);
 check(s.ring.width>0&&s.ring.height>0&&['x','y','width','height'].every(k=>Math.abs(s.ring[k]-s.button[k])<2),'MOODY_ORBIT_ALIGNMENT',s);
 check(s.navSize.scrollWidth<=s.navSize.clientWidth+1&&s.shellSize.scrollWidth<=s.shellSize.clientWidth+1,'MOODY_ORBIT_OVERFLOW',s);
}
async function waitOrbit(page,{timeout=3000}={}){
 // Poll the same complete oracle; a timeout is diagnosed by its precise assertion below.
 const until=Date.now()+timeout;let snapshot;
 do{snapshot=await orbitSnapshot(page);try{assertOrbit(snapshot);return snapshot}catch(error){if(error.code!=='ERR_ASSERTION')throw error}if(Date.now()>=until)break;await page.evaluate(()=>new Promise(requestAnimationFrame))}while(true);
 assertOrbit(snapshot);
}
module.exports={settingsSnapshot,assertSettings,waitSettings,assertSettingsClosed,waitSettingsClosed,orbitSnapshot,assertOrbit,waitOrbit};
