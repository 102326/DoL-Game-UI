// Own temporary packages in one authorized WebView; no game/save writes or persisted installation.
import fs = require('node:fs');
import path = require('node:path');
import assert = require('node:assert/strict');
import crypto = require('node:crypto');
const {randomUUID,createHash}=crypto;
type ToolClient={evaluate(source:string):Promise<unknown>;send(method:string,params?:Record<string,unknown>):Promise<unknown>};
type ToolContext={ensureWebview():Promise<ToolClient>;pause(ms:number):Promise<void>;resetSideEffect():void;readonly actionDispatched:boolean;finish():Promise<unknown>};
type Rect={x:number;y:number;right:number;bottom:number};
type Before={game:string;ui:string;scene:string;host:boolean;sidebar:boolean;dialogs:number;viewport:{width:number;height:number}};
type Snapshot={expanded:string|null;docked:boolean;sheet:boolean;sidebar:boolean;nativeClicks:number;rect:Rect;viewport:{width:number;height:number};diagnostics:{errors:unknown[]}};
type Outcome={clicks:number;stowed:boolean;same:boolean;message:string|null};
type Cleanup={status:string;owned?:number;hostAbsent?:boolean;positionRestored?:boolean;sidebar?:boolean;scene?:string;conflicts?:number;waiting?:number;error?:string};
type Report={status:string;checks:string[];resources:Array<{name:string;jsSha256:string}>;scope:string;stage?:string;before?:Before;document?:unknown;fan?:Snapshot;statusView?:{source:{ok:boolean};values:Array<string|null>;focus:boolean};outcomes?:Outcome[];dock?:Snapshot;restored?:Snapshot;scene?:{before:number;after:number};after?:Snapshot;error?:string;actionDispatched?:boolean;cleanup?:Cleanup;transportCleanup?:unknown};
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing Android motion receipt value');return value}
function recordOf(value:unknown):Record<string,unknown>{if(value===null||typeof value!=='object'||Array.isArray(value))throw Error('Expected Android motion object');return Object.fromEntries(Object.entries(value))}
function numberOf(value:unknown):number{if(typeof value!=='number'||!Number.isFinite(value))throw Error('Invalid Android motion number');return value}
function booleanOf(value:unknown):boolean{if(typeof value!=='boolean')throw Error('Invalid Android motion boolean');return value}
function stringOf(value:unknown):string{if(typeof value!=='string')throw Error('Invalid Android motion string');return value}
function rectOf(value:unknown):Rect{const r=recordOf(value);return {x:numberOf(r.x),y:numberOf(r.y),right:numberOf(r.right),bottom:numberOf(r.bottom)}}
function beforeOf(value:unknown):Before{const r=recordOf(value),v=recordOf(r.viewport);return {game:stringOf(r.game),ui:stringOf(r.ui),scene:stringOf(r.scene),host:booleanOf(r.host),sidebar:booleanOf(r.sidebar),dialogs:numberOf(r.dialogs),viewport:{width:numberOf(v.width),height:numberOf(v.height)}}}
function snapshotOf(value:unknown):Snapshot{const r=recordOf(value),v=recordOf(r.viewport),d=recordOf(r.diagnostics);if(r.expanded!==null&&typeof r.expanded!=='string')throw Error('Invalid motion expansion');if(!Array.isArray(d.errors))throw Error('Invalid Host errors');return {expanded:r.expanded,docked:booleanOf(r.docked),sheet:booleanOf(r.sheet),sidebar:booleanOf(r.sidebar),nativeClicks:numberOf(r.nativeClicks),rect:rectOf(r.rect),viewport:{width:numberOf(v.width),height:numberOf(v.height)},diagnostics:{errors:d.errors}}}
function outcomeOf(value:unknown):Outcome{const r=recordOf(value);if(r.message!==null&&typeof r.message!=='string')throw Error('Invalid original action message');return {clicks:numberOf(r.clicks),stowed:booleanOf(r.stowed),same:booleanOf(r.same),message:r.message}}
function cleanupOf(value:unknown):Cleanup{const r=recordOf(value),status=stringOf(r.status);return {status,owned:r.owned===undefined?undefined:numberOf(r.owned),hostAbsent:r.hostAbsent===undefined?undefined:booleanOf(r.hostAbsent),positionRestored:r.positionRestored===undefined?undefined:booleanOf(r.positionRestored),sidebar:r.sidebar===undefined?undefined:booleanOf(r.sidebar),scene:r.scene===undefined?undefined:stringOf(r.scene),conflicts:r.conflicts===undefined?undefined:numberOf(r.conflicts),waiting:r.waiting===undefined||r.waiting===null?undefined:numberOf(r.waiting)}}
function frameOf(value:unknown):unknown{const r=recordOf(value),tree=recordOf(r.frameTree),frame=recordOf(tree.frame);stringOf(frame.id);return frame}
function statusViewOf(value:unknown):{source:{ok:boolean};values:Array<string|null>;focus:boolean}{const r=recordOf(value),source=recordOf(r.source);if(!Array.isArray(r.values)||!r.values.every(x=>x===null||typeof x==='string'))throw Error('Invalid status view values');return {source:{ok:booleanOf(source.ok)},values:r.values,focus:booleanOf(r.focus)}}
function startOf(value:unknown):{x:number;y:number;targetY:number}{const r=recordOf(value);return {x:numberOf(r.x),y:numberOf(r.y),targetY:numberOf(r.targetY)}}
function sceneOf(value:unknown):{before:number;after:number}{const r=recordOf(value);return {before:numberOf(r.before),after:numberOf(r.after)}}
const [toolsRoot,serial,pkg]=process.argv.slice(2),root=path.resolve(__dirname,'..');
assert.ok(toolsRoot&&serial&&pkg,'Tools root, serial and authorized test package required');
const {create}:{create(options:{serial:string;package:string},overrides:Record<string,never>,settings:{timeoutMs:number}):ToolContext}=require(path.join(toolsRoot,'scripts/lib/execution-context.cjs'));
const {execute}:{execute(ctx:ToolContext,action:{type:'web-click';selector:string}):Promise<unknown>}=require(path.join(toolsRoot,'scripts/lib/action.cjs'));
const {screenshot}:{screenshot(ctx:ToolContext):Promise<{binary:Buffer;metadata:{width:number;height:number;source:string;requiresPrivacyReview:boolean}}>} = require(path.join(toolsRoot,'scripts/lib/collectors.cjs'));
const dir=path.join(root,'tests/artifacts/stone-free-motion','android-'+Date.now());fs.mkdirSync(dir,{recursive:true});
const ctx=create({serial,package:pkg},{},{timeoutMs:90000}),key='stoneFreeMotion'+randomUUID().replaceAll('-','');
const report:Report={status:'failed',checks:[],resources:[],scope:'Temporary Motion Hub in the identified DoL WebView; UI-only sidebar operation. CDP touch injection is not physical touch.'};
let client:ToolClient|undefined,allocated=false;
const ball='.sf-motion-hub .sf-motion-ball',orbit='.sf-motion-hub .sf-motion-orbit',sheet='.sf-motion-hub .sf-motion-sheet';
async function click(selector:string){await execute(ctx,{type:'web-click',selector});await ctx.pause(600)}
async function picture(name:string){const image=await screenshot(ctx);fs.writeFileSync(path.join(dir,name+'.png'),image.binary);return image.metadata}
const inspect=async()=>snapshotOf(await must(client).evaluate(`(()=>{const b=document.querySelector('${ball}'),s=document.querySelector('${sheet}'),r=s.getBoundingClientRect();return {expanded:b.getAttribute('aria-expanded'),docked:b.classList.contains('is-docked'),sheet:s.classList.contains('is-open'),sidebar:SugarCube.UIBar.isStowed(),nativeClicks:window[${JSON.stringify(key)}].clicks,rect:{x:r.x,y:r.y,right:r.right,bottom:r.bottom},viewport:{width:visualViewport.width,height:visualViewport.height},diagnostics:DoLUiHost.getDiagnostics()}})()`));
(async()=>{
 try {
  report.stage='bind-and-observe';client=await ctx.ensureWebview();
   const before=beforeOf(await client.evaluate(`(()=>({game:StartConfig.version,ui:DoLGameUI.version,scene:SugarCube.State.passage,host:!!window.DoLUiHost,sidebar:SugarCube.UIBar.isStowed(),dialogs:document.querySelectorAll('dialog[open],body.ui-open').length,viewport:{width:innerWidth,height:innerHeight}}))()`));report.before=before;
   assert.equal(before.game,'0.5.12.13');assert.equal(before.host,false);assert.equal(before.dialogs,0);
   report.document=frameOf(await client.send('Page.getFrameTree'));
  await client.evaluate(`(()=>{if(Object.hasOwn(window,${JSON.stringify(key)}))throw Error('Namespace exists');const button=document.getElementById('ui-bar-toggle');if(!button)throw Error('Original target missing');const run=window[${JSON.stringify(key)}]={modules:[],styles:[],button,parent:button.parentNode,clicks:0,position:localStorage.getItem('StoneFreeMotionHub.position.v1'),expected:null};run.listener=()=>run.clicks++;button.addEventListener('click',run.listener);return true})()`);allocated=true;
  report.stage='temporary-packages';
  for(const name of ['host','motion-hub']){
   const base=path.join(root,'dist/framework',name),js=fs.readFileSync(path.join(base,'index.js'),'utf8'),moduleKey='StoneFree_'+name.replaceAll('-','_');
   report.resources.push({name,jsSha256:createHash('sha256').update(js).digest('hex')});
   await client.evaluate(`(()=>{if(Object.hasOwn(window,${JSON.stringify(moduleKey)}))throw Error('Existing package namespace');const run=window[${JSON.stringify(key)}];(0,eval)(${JSON.stringify(js)});run.modules.push({key:${JSON.stringify(moduleKey)},api:window[${JSON.stringify(moduleKey)}]});return true})()`);
   if(fs.existsSync(path.join(base,'style.css')))await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}],style=document.createElement('style');style.textContent=${JSON.stringify(fs.readFileSync(path.join(base,'style.css'),'utf8'))};document.head.append(style);run.styles.push(style);return true})()`);
  }
  await ctx.pause(650);
  report.stage='fan-expand';await click(ball);report.fan=await inspect();assert.equal(report.fan.expanded,'true');await picture('fan');
  report.stage='status-view';await click(`${orbit} [data-motion-view="StoneFreeMotionHub:status"]`);
   const statusView=statusViewOf(await client.evaluate(`(async()=>({source:await DoLUiHost.sources('dol.status.experimental')[0].read(DoLUiHost.binding()),values:[...document.querySelectorAll('${sheet} dd')].map(n=>n.textContent),focus:document.activeElement===document.querySelector('${sheet} h2')}))()`));report.statusView=statusView;
   assert.equal(statusView.source.ok,true);assert.equal(statusView.values.length,3);assert.equal(statusView.focus,true);await picture('status');
  await click(`${sheet} header>button`);
  report.checks.push('Real Android public status view mounts with scoped heading focus; close releases the view');
  report.stage='reading-original-action';await click(ball);await click(`${orbit} [data-motion-view="StoneFreeMotionHub:reading"]`);
  for(let i=1;i<=2;i++){
   await click(`${sheet} .sf-reading .sf-inline-actions button:first-child`);
    const outcome=outcomeOf(await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}];return {clicks:run.clicks,stowed:SugarCube.UIBar.isStowed(),same:run.button===document.getElementById('ui-bar-toggle')&&run.parent===run.button.parentNode,message:document.querySelector('${sheet} [role="status"]')?.textContent}})()`));
    assert.equal(outcome.clicks,i);assert.equal(outcome.stowed,i===1?!before.sidebar:before.sidebar);assert.equal(outcome.same,true);assert.equal(outcome.message,'原版侧栏已切换。');ctx.resetSideEffect();
   (report.outcomes??=[]).push(outcome);
  }
  await picture('reading');await click(`${sheet} header>button`);
  report.checks.push('Two standard Tools web-clicks reach the original sidebar button once each; SugarCube state toggles and returns');
  report.stage='touch-drag-and-dock';
   const start=startOf(await client.evaluate(`(()=>{const n=document.querySelector('${ball}'),r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,targetY:Math.min(visualViewport.height-100,340)}})()`));
  // Standard Action has tap but no drag. Use bound CDP touch input for this owned control only.
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start.x,y:start.y}]});
  for(let i=1;i<=8;i++){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(12-start.x)*i/8,y:start.y+(start.targetY-start.y)*i/8}]});await ctx.pause(24)}
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await ctx.pause(650);
   report.dock=await inspect();assert.equal(report.dock.docked,true);assert.equal(report.dock.expanded,'false');assert.equal(report.dock.sidebar,before.sidebar,'Owned drag must not activate the page sidebar gesture');assert.equal(report.dock.nativeClicks,2);
  await client.evaluate(`(()=>{window[${JSON.stringify(key)}].expected=localStorage.getItem('StoneFreeMotionHub.position.v1');return true})()`);await picture('docked');
  await click(ball);report.restored=await inspect();assert.equal(report.restored.docked,false);
  await client.evaluate(`(()=>{window[${JSON.stringify(key)}].expected=localStorage.getItem('StoneFreeMotionHub.position.v1');return true})()`);
  report.checks.push('Bound CDP touch drag docks at the left edge; one click restores the floating position without expanding accidentally');
  report.stage='scene-invalidation';await click(ball);await click(`${orbit} [data-motion-view="StoneFreeMotionHub:compare"]`);
   report.scene=sceneOf(await client.evaluate(`(()=>{const before=DoLUiHost.getDiagnostics().generation;DoLUiHost.invalidateScene();return {before,after:DoLUiHost.getDiagnostics().generation}})()`));await ctx.pause(100);
  assert.ok(report.scene.after>report.scene.before);assert.equal((await inspect()).expanded,'false');
  await client.evaluate(`(()=>{DoLUiHost.sceneReady();return true})()`);
  await click(ball);await click(`${orbit} [data-motion-view="StoneFreeMotionHub:status"]`);assert.equal((await inspect()).sheet,true);await click(`${sheet} header>button`);
  report.checks.push('Controlled Host invalidation closes the current view and allows a fresh view; not a natural Passage navigation or a fabricated global game event');
  report.after=await inspect();assert.equal(report.after.diagnostics.errors.length,0);report.status='passed';
  }catch(error){report.error=error instanceof Error?error.message:String(error);report.actionDispatched=ctx.actionDispatched;throw error}
 finally {
  if(client&&allocated)try{
    const cleanup=cleanupOf(await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}];if(!run)return {status:'namespace-missing'};let conflicts=0;const host=run.modules.find(m=>m.key==='StoneFree_host')?.api;
    for(const entry of [...run.modules].reverse()){try{entry.api.dispose()}catch{conflicts++}if(window[entry.key]===entry.api)delete window[entry.key];else conflicts++}
    for(const style of run.styles)style.remove();run.button.removeEventListener('click',run.listener);
    const position=localStorage.getItem('StoneFreeMotionHub.position.v1');if(position===run.expected||position===run.position){if(run.position===null)localStorage.removeItem('StoneFreeMotionHub.position.v1');else localStorage.setItem('StoneFreeMotionHub.position.v1',run.position)}else conflicts++;
    let waiting=null;if(!window.DoLUiHost&&host){const probe=host.installHost();waiting=probe?.host.getDiagnostics().participants.length;probe?.dispose()}if(waiting!==0)conflicts++;
     const result={status:conflicts?'conflict':'completed',conflicts,waiting,owned:document.querySelectorAll('[data-sf-owner]').length,hostAbsent:!window.DoLUiHost,sidebar:SugarCube.UIBar.isStowed(),scene:SugarCube.State.passage,positionRestored:localStorage.getItem('StoneFreeMotionHub.position.v1')===run.position};delete window[${JSON.stringify(key)}];return result})()`));report.cleanup=cleanup;
    if(cleanup.status!=='completed'||cleanup.owned!==0||!cleanup.hostAbsent||!cleanup.positionRestored||cleanup.sidebar!==must(report.before).sidebar)report.status='cleanup-conflict';
   }catch(error){report.cleanup={status:'failed-or-document-changed',error:error instanceof Error?error.message:String(error)};report.status='cleanup-failed'}
  report.transportCleanup=await ctx.finish();fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2));
 }
 assert.equal(report.status,'passed');console.log(JSON.stringify({status:report.status,output:dir,checks:report.checks,cleanup:report.cleanup},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
