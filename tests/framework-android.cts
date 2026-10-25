// Opt-in, temporary UI-only smoke on an explicitly authorized test App.
// Reads built resources and removes only this run's Host, styles and namespace.
import fs = require('node:fs');
import path = require('node:path');
import assert = require('node:assert/strict');
import crypto = require('node:crypto');
const {randomUUID,createHash}=crypto;
type ToolClient={evaluate(source:string):Promise<unknown>;send(method:string,params?:Record<string,unknown>):Promise<unknown>};
type ToolContext={ensureWebview():Promise<ToolClient>;pause(ms:number):Promise<void>;finish():Promise<unknown>};
type NativeValues=Record<string,number|null>;
type Rect={x:number;y:number;width:number;height:number};
type Before={hostExists:boolean;ui:string|undefined;game:string;loader:string|undefined;sugarCube:string|undefined;viewport:{width:number;height:number};nativeValues:NativeValues};
type Live={diagnostics:{errors:unknown[];mounts?:unknown[]};projection:{ok:boolean;value:NativeValues};mounts:number};
type Dialog={open:boolean;overflow:boolean;rect:Rect;width:number;height:number};
type Official={views:string[];values:Array<string|null>;overflow:boolean;rect:Rect;viewport:{width:number;height:number}};
type Workspace={open:boolean;viewKeys:string[];overflow:boolean;rect:Rect;width:number;claims:Array<{owner:string}>};
type LayoutReset={own:{order:string[];hidden:string[];density:string};peerUnchanged:boolean;density:string;values:NativeValues};
type Cleanup={status:string;ownedMounts?:number;hostAbsent?:boolean;preferences?:string;conflicts?:number;waitingParticipants?:number;uiVersion?:string;error?:string};
type Report={status:string;surfaceOnly:boolean;scope:string;checks:string[];resources:Array<{name:string;jsSha256:string}>;before?:Before;document?:{frame:string;loader:string};live?:Live;dialog?:Dialog;stage?:string;official?:Official;screenshotSource?:unknown;workspace?:Workspace;layoutReset?:LayoutReset;after?:{ui:string|undefined;nativeValues:NativeValues};error?:string;cleanup?:Cleanup;transportCleanup?:unknown};
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing Android framework receipt value');return value}
function recordOf(value:unknown):Record<string,unknown>{if(value===null||typeof value!=='object'||Array.isArray(value))throw Error('Expected Android framework object');return Object.fromEntries(Object.entries(value))}
function stringOf(value:unknown):string{if(typeof value!=='string')throw Error('Invalid Android framework string');return value}
function optionalString(value:unknown):string|undefined{if(value===undefined)return undefined;return stringOf(value)}
function numberOf(value:unknown):number{if(typeof value!=='number'||!Number.isFinite(value))throw Error('Invalid Android framework number');return value}
function booleanOf(value:unknown):boolean{if(typeof value!=='boolean')throw Error('Invalid Android framework boolean');return value}
function stringsOf(value:unknown):string[]{if(!Array.isArray(value)||!value.every(x=>typeof x==='string'))throw Error('Invalid Android framework strings');return value}
function nativeValuesOf(value:unknown):NativeValues{const raw=recordOf(value),result:NativeValues={};for(const [key,item]of Object.entries(raw)){if(item!==null&&typeof item!=='number')throw Error('Invalid native value');result[key]=item}return result}
function rectOf(value:unknown):Rect{const r=recordOf(value);return {x:numberOf(r.x),y:numberOf(r.y),width:numberOf(r.width),height:numberOf(r.height)}}
function beforeOf(value:unknown):Before{const r=recordOf(value),v=recordOf(r.viewport);return {hostExists:booleanOf(r.hostExists),ui:optionalString(r.ui),game:stringOf(r.game),loader:optionalString(r.loader),sugarCube:optionalString(r.sugarCube),viewport:{width:numberOf(v.width),height:numberOf(v.height)},nativeValues:nativeValuesOf(r.nativeValues)}}
function frameOf(value:unknown):{frame:string;loader:string}{const r=recordOf(value),tree=recordOf(r.frameTree),frame=recordOf(tree.frame);return {frame:stringOf(frame.id),loader:stringOf(frame.loaderId)}}
function liveOf(value:unknown):Live{const r=recordOf(value),d=recordOf(r.diagnostics),p=recordOf(r.projection);if(!Array.isArray(d.errors))throw Error('Invalid Host diagnostics');return {diagnostics:{errors:d.errors},projection:{ok:booleanOf(p.ok),value:nativeValuesOf(p.value)},mounts:numberOf(r.mounts)}}
function dialogOf(value:unknown):Dialog{const r=recordOf(value);return {open:booleanOf(r.open),overflow:booleanOf(r.overflow),rect:rectOf(r.rect),width:numberOf(r.width),height:numberOf(r.height)}}
function officialOf(value:unknown):Official{const r=recordOf(value),v=recordOf(r.viewport);if(!Array.isArray(r.values)||!r.values.every(x=>x===null||typeof x==='string'))throw Error('Invalid official view values');return {views:stringsOf(r.views),values:r.values,overflow:booleanOf(r.overflow),rect:rectOf(r.rect),viewport:{width:numberOf(v.width),height:numberOf(v.height)}}}
function workspaceOf(value:unknown):Workspace{const r=recordOf(value);if(!Array.isArray(r.claims))throw Error('Invalid workspace claims');const claims=r.claims.map((item:unknown)=>({owner:stringOf(recordOf(item).owner)}));return {open:booleanOf(r.open),viewKeys:stringsOf(r.viewKeys),overflow:booleanOf(r.overflow),rect:rectOf(r.rect),width:numberOf(r.width),claims}}
function layoutResetOf(value:unknown):LayoutReset{const r=recordOf(value),own=recordOf(r.own);return {own:{order:stringsOf(own.order),hidden:stringsOf(own.hidden),density:stringOf(own.density)},peerUnchanged:booleanOf(r.peerUnchanged),density:stringOf(r.density),values:nativeValuesOf(r.values)}}
function cleanupOf(value:unknown):Cleanup{const r=recordOf(value);return {status:stringOf(r.status),ownedMounts:r.ownedMounts===undefined?undefined:numberOf(r.ownedMounts),hostAbsent:r.hostAbsent===undefined?undefined:booleanOf(r.hostAbsent),preferences:r.preferences===undefined?undefined:stringOf(r.preferences),conflicts:r.conflicts===undefined?undefined:numberOf(r.conflicts),waitingParticipants:r.waitingParticipants===undefined||r.waitingParticipants===null?undefined:numberOf(r.waitingParticipants),uiVersion:optionalString(r.uiVersion)}}
function officialSurfaceOf(value:unknown):{open:boolean;text:string}{const r=recordOf(value);return {open:booleanOf(r.open),text:stringOf(r.text)}}
function afterOf(value:unknown):{ui:string|undefined;nativeValues:NativeValues}{const r=recordOf(value);return {ui:optionalString(r.ui),nativeValues:nativeValuesOf(r.nativeValues)}}
const [toolsRoot,serial,pkg,mode]=process.argv.slice(2),root=path.resolve(__dirname,'..'),workspace=mode==='--workspace';
const surfaceOnly=mode==='--surface';
assert.ok(toolsRoot&&serial&&pkg,'Tools root, serial and test package are required');
const {create}:{create(options:{serial:string;package:string},overrides:Record<string,never>,settings:{timeoutMs:number}):ToolContext}=require(path.join(toolsRoot,'scripts/lib/execution-context.cjs'));
const {execute}:{execute(ctx:ToolContext,action:{type:'web-click';selector:string}):Promise<unknown>}=require(path.join(toolsRoot,'scripts/lib/action.cjs'));
const {screenshot}:{screenshot(ctx:ToolContext):Promise<{binary:Buffer;metadata:{width:number;height:number;source:string;requiresPrivacyReview:boolean}}>} = require(path.join(toolsRoot,'scripts/lib/collectors.cjs'));
const dir=path.join(root,'tests/artifacts',workspace?'stone-free-workspace':'stone-free-foundation','android-'+Date.now());fs.mkdirSync(dir,{recursive:true});
const ctx=create({serial,package:pkg},{},{timeoutMs:60000}),key='stoneFreeAcceptance'+randomUUID().replaceAll('-','');
const report:Report={status:'failed',surfaceOnly,scope:'Temporary runtime resources in existing authorized test WebView; no persisted Mod install, game action or save writes',checks:[],resources:[]};
const save=()=>fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2));
const sha=(data:string|Buffer)=>createHash('sha256').update(data).digest('hex');
let client:ToolClient|undefined,allocated=false;
(async()=>{
 try {
  client=await ctx.ensureWebview();
  const before=beforeOf(await client.evaluate(`(()=>({hostExists:!!window.DoLUiHost,ui:window.DoLGameUI?.version,game:window.StartConfig?.version,loader:window.modUtils?.version,sugarCube:window.SugarCube?.version?.toString?.(),viewport:{width:innerWidth,height:innerHeight},nativeValues:Object.fromEntries(['pain','stress','tiredness'].map(k=>[k,window.SugarCube?.State?.variables?.[k]??window.State?.variables?.[k]??null]))}))()`));report.before=before;
  assert.equal(before.hostExists,false,'A pre-existing Host must not be replaced');assert.equal(before.game,'0.5.12.13');
  report.document=frameOf(await client.send('Page.getFrameTree'));
  await client.evaluate(`(()=>{if(Object.hasOwn(window,${JSON.stringify(key)}))throw Error('Own namespace conflict');const run=window[${JSON.stringify(key)}]={styles:[],host:null,modules:[],preferences:{}};if(${workspace})for(const name of ['StoneFreeWorkspace','AlternateWorkspace']){const key='StoneFreeWorkspace.'+name+'.v1',value=localStorage.getItem(key);run.preferences[key]={before:value,expected:value}}return true})()`);allocated=true;
  for(const name of ['host','native-status','comparison','soft-wet-surface',...(workspace?['workspace','alternate-workspace']:[])]){
   const js=fs.readFileSync(path.join(root,`dist/framework/${name}/index.js`),'utf8');report.resources.push({name,jsSha256:sha(js)});
   await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}];if(!run)throw Error('Own namespace missing');const key=${JSON.stringify('StoneFree_'+name.replaceAll('-','_'))};if(Object.hasOwn(window,key))throw Error('Existing package namespace requires review');(0,eval)(${JSON.stringify(js)});run.modules.push({key,api:window[key]});${name==='host'?'run.host=window.DoLUiHost;':''}return true})()`);
   const style=path.join(root,`dist/framework/${name}/style.css`);
   if(fs.existsSync(style))await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}],style=document.createElement('style');style.textContent=${JSON.stringify(fs.readFileSync(style,'utf8'))};document.head.append(style);run.styles.push(style);return true})()`);
  }
  await ctx.pause(180);
  const live=liveOf(await client.evaluate(`(async()=>{const h=window[${JSON.stringify(key)}].host;if(window.DoLUiHost!==h)throw Error('Host ownership changed');return {diagnostics:h.getDiagnostics(),projection:await h.sources('dol.status.experimental')[0].read(h.binding()),mounts:document.querySelectorAll('[data-sf-owner]').length}})()`));report.live=live;
  assert.equal(live.mounts,workspace?5:3);assert.equal(live.projection.ok,true);assert.deepEqual(live.projection.value,before.nativeValues);assert.equal(live.diagnostics.errors.length,0);
  report.checks.push('Two independent bundled Vue Apps coexist with the current UI; projection equals original native state');
  if(!surfaceOnly){
  await client.evaluate(`(()=>{document.querySelector('[data-sf-owner="StatusComparison"] button').click();return true})()`);await ctx.pause(100);
  const open=dialogOf(await client.evaluate(`(()=>{const d=document.querySelector('[data-sf-owner="StatusComparison"] dialog'),r=d.getBoundingClientRect();return {open:d.open,overflow:d.scrollWidth>d.clientWidth,rect:{x:r.x,y:r.y,width:r.width,height:r.height},width:innerWidth,height:innerHeight}})()`));
  assert.equal(open.open,true);assert.equal(open.overflow,false);assert.ok(open.rect.x>=0&&open.rect.x+open.rect.width<=open.width);report.dialog=open;
  const comparisonImage=await screenshot(ctx);fs.writeFileSync(path.join(dir,'comparison.png'),comparisonImage.binary);
  await client.evaluate(`(()=>{document.querySelector('[data-sf-owner="NativeStatus"] button').click();return true})()`);
  assert.equal(await client.evaluate(`document.querySelectorAll('[data-sf-owner] dialog[open]').length`),1);report.checks.push('Participating modal conflict does not stack a second dialog');
  await client.evaluate(`(()=>{document.querySelector('[data-sf-owner="StatusComparison"] dialog header button').click();return true})()`);
  assert.equal(await client.evaluate(`document.querySelectorAll('[data-sf-owner] dialog[open]').length`),0);report.checks.push('CDP DOM click opens/closes the own surface; not trusted-touch proof');
  }
  report.stage='official-drawer-open';await execute(ctx,{type:'web-click',selector:'[data-sf-owner="SoftWetSurface"] button'});await ctx.pause(100);
  const official=officialSurfaceOf(await client.evaluate(`(()=>{const d=[...document.querySelectorAll('.dgu-surface[open]')].find(n=>n.querySelector('h2')?.textContent==='公开贡献视图');return d?{open:true,text:d.querySelector('.dgu-surface-content')?.textContent}:null})()`));
  assert.equal(official.open,true);assert.match(official.text,/疲劳/);
  report.stage='official-drawer-observe';const officialView=officialOf(await client.evaluate(`(()=>{const d=document.querySelector('.dgu-surface[open]'),r=d.getBoundingClientRect();return {views:[...d.querySelectorAll('[data-view]')].map(n=>n.dataset.view),values:[...d.querySelectorAll('[data-view="NativeStatus:status"] dd')].map(n=>n.textContent),overflow:d.scrollWidth>d.clientWidth,rect:{x:r.x,y:r.y,width:r.width,height:r.height},viewport:{width:innerWidth,height:innerHeight}}})()`));report.official=officialView;
  assert.deepEqual(officialView.views,['NativeStatus:status','StatusComparison:comparison']);assert.equal(officialView.overflow,false);
  assert.deepEqual(officialView.values,Object.values(before.nativeValues).map(x=>x===null?'未知':String(x)));
  report.stage='official-native-screenshot';const image=await screenshot(ctx);fs.writeFileSync(path.join(dir,'official-drawer.png'),image.binary);report.screenshotSource=image.metadata;
  report.stage='official-drawer-close';await execute(ctx,{type:'web-click',selector:'.dgu-surface[open] .dgu-surface-header button'});await ctx.pause(100);
  assert.equal(await client.evaluate(`document.querySelectorAll('.dgu-surface[open]').length`),0);
  assert.equal(await client.evaluate(`DoLUiHost.getDiagnostics().mounts.filter(x=>x.id.startsWith('official-view-')).length`),0);
  report.checks.push('Public views displayed through actual Soft & Wet API v1 Drawer; native values match, no horizontal overflow, standard Tools close releases contributed mounts');
  if(workspace){
   const alpha='[data-sf-owner="StoneFreeWorkspace"]',beta='[data-sf-owner="AlternateWorkspace"]';
   const click=async(selector:string,text:string)=>{const suffixes:Record<string,string>={'信息工作台':'.sf-workspace-entry>button','侧边工作台':'.sf-workspace-entry>button','编辑布局':'.sf-workspace nav>button','布局提供者':'.sf-workspace summary','释放工作区':'.sf-workspace details button','恢复本布局':'.sf-layout-options>button','关闭':'.sf-workspace header>button'},suffix=suffixes[text];assert.ok(suffix,'Reviewed own action required');report.stage='workspace-action:'+text;await execute(ctx,{type:'web-click',selector:selector+' '+suffix});await ctx.pause(60)};
   await click(beta,'侧边工作台');assert.equal(await client.evaluate(`!!document.querySelector('${beta} dialog').open`),false);
   await click(alpha,'信息工作台');
   const workspaceView=workspaceOf(await client.evaluate(`(()=>{const d=document.querySelector('${alpha} dialog'),r=d.getBoundingClientRect();return {open:d.open,viewKeys:[...d.querySelectorAll('article')].map(n=>n.dataset.view),overflow:d.scrollWidth>d.clientWidth,rect:{x:r.x,y:r.y,width:r.width,height:r.height},width:innerWidth,claims:DoLUiHost.getDiagnostics().claims.filter(c=>c.key==='information-workspace'||c.key==='workspace-k')}})()`));report.workspace=workspaceView;
   assert.equal(workspaceView.open,true);assert.equal(workspaceView.overflow,false);assert.equal(workspaceView.viewKeys.length,2);assert.ok(workspaceView.claims.every(c=>c.owner==='StoneFreeWorkspace'));
   const image=await screenshot(ctx);fs.writeFileSync(path.join(dir,'workspace.png'),image.binary);
   await click(alpha,'编辑布局');
   await client.evaluate(`(()=>{const d=document.querySelector('${alpha} dialog'),select=d.querySelector('select');select.value='compact';select.dispatchEvent(new Event('change',{bubbles:true}));const run=window[${JSON.stringify(key)}];for(const key of Object.keys(run.preferences))run.preferences[key].expected=localStorage.getItem(key);return true})()`);
   await ctx.pause(60);await click(alpha,'恢复本布局');
   const layoutReset=layoutResetOf(await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}],own='StoneFreeWorkspace.StoneFreeWorkspace.v1',peer='StoneFreeWorkspace.AlternateWorkspace.v1';run.preferences[own].expected=localStorage.getItem(own);return {own:JSON.parse(localStorage.getItem(own)),peerUnchanged:localStorage.getItem(peer)===run.preferences[peer].before,density:document.querySelector('${alpha} select').value,values:Object.fromEntries(['pain','stress','tiredness'].map(k=>[k,window.SugarCube?.State?.variables?.[k]??window.State?.variables?.[k]??null]))}})()`));report.layoutReset=layoutReset;
   assert.deepEqual(layoutReset.own,{order:[],hidden:[],density:'comfortable'});assert.equal(layoutReset.peerUnchanged,true);assert.equal(layoutReset.density,'comfortable');assert.deepEqual(layoutReset.values,before.nativeValues);
   report.checks.push('Local reset restores only the active layout; peer preferences and native state remain unchanged');
   await click(alpha,'布局提供者');await click(alpha,'释放工作区');
   await click(beta,'侧边工作台');
   assert.equal(await client.evaluate(`document.querySelectorAll('.sf-workspace[open]').length`),1);
   assert.equal(await client.evaluate(`DoLUiHost.getDiagnostics().claims.find(c=>c.key==='information-workspace')?.owner`),'AlternateWorkspace');
   await click(beta,'布局提供者');await click(beta,'释放工作区');await click(alpha,'信息工作台');
   assert.equal(await client.evaluate(`document.querySelector('${alpha} dialog select').value`),'comfortable');await click(alpha,'关闭');
   report.checks.push('Two actual layout bundles negotiate region/shortcut/modal and hand off the same contributed views','Workspace density persists locally during the test; prior own preferences restored in cleanup');
   const negative=await client.evaluate(`(()=>{const node=document.createElement('div'),input=document.createElement('input');node.append(input);document.body.append(node);const key=new KeyboardEvent('keydown',{key:'k',bubbles:true,cancelable:true}),ime=new KeyboardEvent('keydown',{key:'k',isComposing:true,bubbles:true,cancelable:true});input.dispatchEvent(key);document.querySelector('${alpha} button').dispatchEvent(ime);node.remove();return {nativePrevented:key.defaultPrevented,imePrevented:ime.defaultPrevented,open:document.querySelectorAll('.sf-workspace[open]').length}})()`);
   assert.deepEqual(negative,{nativePrevented:false,imePrevented:false,open:0});report.checks.push('Unregistered input and composing-marked events remain unclaimed (synthetic event check, not physical IME)');
  }
  const after=afterOf(await client.evaluate(`(()=>({ui:window.DoLGameUI?.version,nativeValues:Object.fromEntries(['pain','stress','tiredness'].map(k=>[k,window.SugarCube?.State?.variables?.[k]??window.State?.variables?.[k]??null]))}))()`));report.after=after;
  assert.equal(before.ui,after.ui);assert.deepEqual(before.nativeValues,after.nativeValues);report.status='passed';
 } catch(error) {report.error=error instanceof Error?error.message:String(error);throw error} finally {
  if(client&&allocated){
   try {
    const cleanup=cleanupOf(await client.evaluate(`(()=>{
     const run=window[${JSON.stringify(key)}];if(!run)return {status:'namespace-missing'};
     let conflicts=window.DoLUiHost!==run.host?1:0;
     const hostModule=run.modules.find(x=>x.key==='StoneFree_host')?.api;
     for(const entry of [...run.modules].reverse()){
      try{entry.api.dispose()}catch{conflicts++}
      if(window[entry.key]!==entry.api){conflicts++;continue}
      if(!delete window[entry.key])conflicts++;
     }
     run.host.dispose();for(const style of run.styles)style.remove();
     let preferences='restored';
     for(const [key,value] of Object.entries(run.preferences)){
      try{if(localStorage.getItem(key)!==value.expected){preferences='external-change-preserved';continue}if(value.before===null)localStorage.removeItem(key);else localStorage.setItem(key,value.before)}catch{preferences='unavailable'}
     }
     let waitingParticipants=null;
     if(!window.DoLUiHost&&hostModule){const probe=hostModule.installHost();if(probe){waitingParticipants=probe.host.getDiagnostics().participants.length;probe.dispose()}}
     if(waitingParticipants!==0)conflicts++;
     delete window[${JSON.stringify(key)}];
     return {status:preferences==='restored'&&!conflicts?'completed':'cleanup-conflict',preferences,conflicts,waitingParticipants,ownedMounts:document.querySelectorAll('[data-sf-owner]').length,hostAbsent:!window.DoLUiHost,uiVersion:window.DoLGameUI?.version};
    })()`));report.cleanup=cleanup;
    if(cleanup.status!=='completed'||cleanup.ownedMounts!==0||!cleanup.hostAbsent)report.status='cleanup-conflict';
   }catch{report.cleanup={status:'failed-or-document-changed'};report.status='cleanup-failed'}
  }
  report.transportCleanup=await ctx.finish();save();
 }
 assert.equal(report.status,'passed');console.log(JSON.stringify({status:report.status,output:dir,checks:report.checks,cleanup:report.cleanup},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
