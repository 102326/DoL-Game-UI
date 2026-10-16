// Opt-in, temporary UI-only smoke on an explicitly authorized test App.
// Reads built resources and removes only this run's Host, styles and namespace.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {randomUUID,createHash}=require('node:crypto');
const [toolsRoot,serial,pkg,mode]=process.argv.slice(2),root=path.resolve(__dirname,'..'),workspace=mode==='--workspace';
const surfaceOnly=mode==='--surface';
assert.ok(toolsRoot&&serial&&pkg,'Tools root, serial and test package are required');
const {create}=require(path.join(toolsRoot,'scripts/lib/execution-context.cjs'));
const {execute}=require(path.join(toolsRoot,'scripts/lib/action.cjs'));
const {screenshot}=require(path.join(toolsRoot,'scripts/lib/collectors.cjs'));
const dir=path.join(root,'tests/artifacts',workspace?'stone-free-workspace':'stone-free-foundation','android-'+Date.now());fs.mkdirSync(dir,{recursive:true});
const ctx=create({serial,package:pkg},{},{timeoutMs:60000}),key='stoneFreeAcceptance'+randomUUID().replaceAll('-','');
const report={status:'failed',surfaceOnly,scope:'Temporary runtime resources in existing authorized test WebView; no persisted Mod install, game action or save writes',checks:[],resources:[]};
const save=()=>fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2));
const sha=data=>createHash('sha256').update(data).digest('hex');
let client,allocated=false;
(async()=>{
 try {
  client=await ctx.ensureWebview();
  report.before=await client.evaluate(`(()=>({hostExists:!!window.DoLUiHost,ui:window.DoLGameUI?.version,game:window.StartConfig?.version,loader:window.modUtils?.version,sugarCube:window.SugarCube?.version?.toString?.(),viewport:{width:innerWidth,height:innerHeight},nativeValues:Object.fromEntries(['pain','stress','tiredness'].map(k=>[k,window.SugarCube?.State?.variables?.[k]??window.State?.variables?.[k]??null]))}))()`);
  assert.equal(report.before.hostExists,false,'A pre-existing Host must not be replaced');assert.equal(report.before.game,'0.5.12.13');
  const binding=await client.send('Page.getFrameTree');report.document={frame:binding.frameTree.frame.id,loader:binding.frameTree.frame.loaderId};
  await client.evaluate(`(()=>{if(Object.hasOwn(window,${JSON.stringify(key)}))throw Error('Own namespace conflict');const run=window[${JSON.stringify(key)}]={styles:[],host:null,modules:[],preferences:{}};if(${workspace})for(const name of ['StoneFreeWorkspace','AlternateWorkspace']){const key='StoneFreeWorkspace.'+name+'.v1',value=localStorage.getItem(key);run.preferences[key]={before:value,expected:value}}return true})()`);allocated=true;
  for(const name of ['host','native-status','comparison','soft-wet-surface',...(workspace?['workspace','alternate-workspace']:[])]){
   const js=fs.readFileSync(path.join(root,`dist/framework/${name}/index.js`),'utf8');report.resources.push({name,jsSha256:sha(js)});
   await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}];if(!run)throw Error('Own namespace missing');const key=${JSON.stringify('StoneFree_'+name.replaceAll('-','_'))};if(Object.hasOwn(window,key))throw Error('Existing package namespace requires review');(0,eval)(${JSON.stringify(js)});run.modules.push({key,api:window[key]});${name==='host'?'run.host=window.DoLUiHost;':''}return true})()`);
   const style=path.join(root,`dist/framework/${name}/style.css`);
   if(fs.existsSync(style))await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}],style=document.createElement('style');style.textContent=${JSON.stringify(fs.readFileSync(style,'utf8'))};document.head.append(style);run.styles.push(style);return true})()`);
  }
  await ctx.pause(180);
  report.live=await client.evaluate(`(async()=>{const h=window[${JSON.stringify(key)}].host;if(window.DoLUiHost!==h)throw Error('Host ownership changed');return {diagnostics:h.getDiagnostics(),projection:await h.sources('dol.status.experimental')[0].read(h.binding()),mounts:document.querySelectorAll('[data-sf-owner]').length}})()`);
  assert.equal(report.live.mounts,workspace?5:3);assert.equal(report.live.projection.ok,true);assert.deepEqual(report.live.projection.value,report.before.nativeValues);assert.equal(report.live.diagnostics.errors.length,0);
  report.checks.push('Two independent bundled Vue Apps coexist with the current UI; projection equals original native state');
  if(!surfaceOnly){
  await client.evaluate(`(()=>{document.querySelector('[data-sf-owner="StatusComparison"] button').click();return true})()`);await ctx.pause(100);
  const open=await client.evaluate(`(()=>{const d=document.querySelector('[data-sf-owner="StatusComparison"] dialog'),r=d.getBoundingClientRect();return {open:d.open,overflow:d.scrollWidth>d.clientWidth,rect:{x:r.x,y:r.y,width:r.width,height:r.height},width:innerWidth,height:innerHeight}})()`);
  assert.equal(open.open,true);assert.equal(open.overflow,false);assert.ok(open.rect.x>=0&&open.rect.x+open.rect.width<=open.width);report.dialog=open;
  const screenshot=await client.send('Page.captureScreenshot',{format:'png',clip:{...open.rect,scale:1}});fs.writeFileSync(path.join(dir,'comparison.png'),Buffer.from(screenshot.data,'base64'));
  await client.evaluate(`(()=>{document.querySelector('[data-sf-owner="NativeStatus"] button').click();return true})()`);
  assert.equal(await client.evaluate(`document.querySelectorAll('[data-sf-owner] dialog[open]').length`),1);report.checks.push('Participating modal conflict does not stack a second dialog');
  await client.evaluate(`(()=>{document.querySelector('[data-sf-owner="StatusComparison"] dialog header button').click();return true})()`);
  assert.equal(await client.evaluate(`document.querySelectorAll('[data-sf-owner] dialog[open]').length`),0);report.checks.push('CDP DOM click opens/closes the own surface; not trusted-touch proof');
  }
  report.stage='official-drawer-open';await execute(ctx,{type:'web-click',selector:'[data-sf-owner="SoftWetSurface"] button'});await ctx.pause(100);
  const official=await client.evaluate(`(()=>{const d=[...document.querySelectorAll('.dgu-surface[open]')].find(n=>n.querySelector('h2')?.textContent==='公开贡献视图');return d?{open:true,text:d.querySelector('.dgu-surface-content')?.textContent}:null})()`);
  assert.equal(official?.open,true);assert.match(official.text,/疲劳/);
  report.stage='official-drawer-observe';report.official=await client.evaluate(`(()=>{const d=document.querySelector('.dgu-surface[open]'),r=d.getBoundingClientRect();return {views:[...d.querySelectorAll('[data-view]')].map(n=>n.dataset.view),values:[...d.querySelectorAll('[data-view="NativeStatus:status"] dd')].map(n=>n.textContent),overflow:d.scrollWidth>d.clientWidth,rect:{x:r.x,y:r.y,width:r.width,height:r.height},viewport:{width:innerWidth,height:innerHeight}}})()`);
  assert.deepEqual(report.official.views,['NativeStatus:status','StatusComparison:comparison']);assert.equal(report.official.overflow,false);
  assert.deepEqual(report.official.values,Object.values(report.before.nativeValues).map(x=>x===null?'未知':String(x)));
  report.stage='official-native-screenshot';const image=await screenshot(ctx);fs.writeFileSync(path.join(dir,'official-drawer.png'),image.binary);report.screenshotSource=image.metadata;
  report.stage='official-drawer-close';await execute(ctx,{type:'web-click',selector:'.dgu-surface[open] .dgu-surface-header button'});await ctx.pause(100);
  assert.equal(await client.evaluate(`document.querySelectorAll('.dgu-surface[open]').length`),0);
  assert.equal(await client.evaluate(`DoLUiHost.getDiagnostics().mounts.filter(x=>x.id.startsWith('official-view-')).length`),0);
  report.checks.push('Public views displayed through actual Soft & Wet API v1 Drawer; native values match, no horizontal overflow, standard Tools close releases contributed mounts');
  if(workspace){
   const alpha='[data-sf-owner="StoneFreeWorkspace"]',beta='[data-sf-owner="AlternateWorkspace"]';
   const click=async(selector,text)=>{await client.evaluate(`(()=>{const root=document.querySelector(${JSON.stringify(selector)}),button=[...root.querySelectorAll('button,summary')].find(n=>n.textContent===${JSON.stringify(text)});if(!button)throw Error('Reviewed own button unavailable');button.click();return true})()`);await ctx.pause(60)};
   await click(beta,'侧边工作台');assert.equal(await client.evaluate(`!!document.querySelector('${beta} dialog').open`),false);
   await click(alpha,'信息工作台');
   report.workspace=await client.evaluate(`(()=>{const d=document.querySelector('${alpha} dialog'),r=d.getBoundingClientRect();return {open:d.open,viewKeys:[...d.querySelectorAll('article')].map(n=>n.dataset.view),overflow:d.scrollWidth>d.clientWidth,rect:{x:r.x,y:r.y,width:r.width,height:r.height},width:innerWidth,claims:DoLUiHost.getDiagnostics().claims.filter(c=>c.key==='information-workspace'||c.key==='workspace-k')}})()`);
   assert.equal(report.workspace.open,true);assert.equal(report.workspace.overflow,false);assert.equal(report.workspace.viewKeys.length,2);assert.ok(report.workspace.claims.every(c=>c.owner==='StoneFreeWorkspace'));
   const image=await client.send('Page.captureScreenshot',{format:'png',clip:{...report.workspace.rect,scale:1}});fs.writeFileSync(path.join(dir,'workspace.png'),Buffer.from(image.data,'base64'));
   await click(alpha,'编辑布局');
   await client.evaluate(`(()=>{const d=document.querySelector('${alpha} dialog'),select=d.querySelector('select');select.value='compact';select.dispatchEvent(new Event('change',{bubbles:true}));const run=window[${JSON.stringify(key)}];for(const key of Object.keys(run.preferences))run.preferences[key].expected=localStorage.getItem(key);return true})()`);
   await ctx.pause(60);await click(alpha,'布局提供者');await click(alpha,'释放工作区');
   await click(beta,'侧边工作台');
   assert.equal(await client.evaluate(`document.querySelectorAll('.sf-workspace[open]').length`),1);
   assert.equal(await client.evaluate(`DoLUiHost.getDiagnostics().claims.find(c=>c.key==='information-workspace')?.owner`),'AlternateWorkspace');
   await click(beta,'布局提供者');await click(beta,'释放工作区');await click(alpha,'信息工作台');
   assert.equal(await client.evaluate(`document.querySelector('${alpha} dialog select').value`),'compact');await click(alpha,'关闭');
   report.checks.push('Two actual layout bundles negotiate region/shortcut/modal and hand off the same contributed views','Workspace density persists locally during the test; prior own preferences restored in cleanup');
   const negative=await client.evaluate(`(()=>{const node=document.createElement('div'),input=document.createElement('input');node.append(input);document.body.append(node);const key=new KeyboardEvent('keydown',{key:'k',bubbles:true,cancelable:true}),ime=new KeyboardEvent('keydown',{key:'k',isComposing:true,bubbles:true,cancelable:true});input.dispatchEvent(key);document.querySelector('${alpha} button').dispatchEvent(ime);node.remove();return {nativePrevented:key.defaultPrevented,imePrevented:ime.defaultPrevented,open:document.querySelectorAll('.sf-workspace[open]').length}})()`);
   assert.deepEqual(negative,{nativePrevented:false,imePrevented:false,open:0});report.checks.push('Unregistered input and composing-marked events remain unclaimed (synthetic event check, not physical IME)');
  }
  report.after=await client.evaluate(`(()=>({ui:window.DoLGameUI?.version,nativeValues:Object.fromEntries(['pain','stress','tiredness'].map(k=>[k,window.SugarCube?.State?.variables?.[k]??window.State?.variables?.[k]??null]))}))()`);
  assert.equal(report.before.ui,report.after.ui);assert.deepEqual(report.before.nativeValues,report.after.nativeValues);report.status='passed';
 } finally {
  if(client&&allocated){
   try {
    report.cleanup=await client.evaluate(`(()=>{
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
    })()`);
    if(report.cleanup.status!=='completed'||report.cleanup.ownedMounts!==0||!report.cleanup.hostAbsent)report.status='cleanup-conflict';
   }catch{report.cleanup={status:'failed-or-document-changed'};report.status='cleanup-failed'}
  }
  report.transportCleanup=await ctx.finish();save();
 }
 assert.equal(report.status,'passed');console.log(JSON.stringify({status:report.status,output:dir,checks:report.checks,cleanup:report.cleanup},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
