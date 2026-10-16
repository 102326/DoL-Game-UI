// Temporary own packages; only the reviewed original sidebar toggle may execute.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {randomUUID,createHash}=require('node:crypto');
const [toolsRoot,serial,pkg]=process.argv.slice(2),root=path.resolve(__dirname,'..');
const sideWorkspace=process.argv.includes('--side-workspace');
assert.ok(toolsRoot&&serial&&pkg,'Tools root, serial and authorized test package required');
const {create}=require(path.join(toolsRoot,'scripts/lib/execution-context.cjs'));
const {execute}=require(path.join(toolsRoot,'scripts/lib/action.cjs'));
const {screenshot}=require(path.join(toolsRoot,'scripts/lib/collectors.cjs'));
const dir=path.join(root,'tests/artifacts/stone-free-reading','android-'+Date.now());fs.mkdirSync(dir,{recursive:true});
const ctx=create({serial,package:pkg},{},{timeoutMs:90000}),key='stoneFreeReading'+randomUUID().replaceAll('-','');
const report={status:'failed',checks:[],resources:[],sideWorkspace,scope:'UI-only sidebar toggle; no native gameplay, save writes or persisted Mod installation'};
let client,allocated=false;
const own='[data-sf-owner="ReadingControls"][data-sf-mount="toolbar"]';
async function click(selector){await execute(ctx,{type:'web-click',selector});await ctx.pause(120)}
(async()=>{
 try {
  report.stage='bind-and-observe';
  client=await ctx.ensureWebview();
  report.before=await client.evaluate(`(()=>({game:window.StartConfig?.version,ui:window.DoLGameUI?.version,host:!!window.DoLUiHost,stowed:window.SugarCube?.UIBar?.isStowed?.(),passage:window.SugarCube?.State?.passage,dialogs:document.querySelectorAll('dialog[open],body.ui-open').length}))()`);
  assert.equal(report.before.game,'0.5.12.13');assert.equal(report.before.host,false);assert.equal(report.before.dialogs,0);assert.equal(typeof report.before.stowed,'boolean');
  report.document=(await client.send('Page.getFrameTree')).frameTree.frame;
  await client.evaluate(`(()=>{if(Object.hasOwn(window,${JSON.stringify(key)}))throw Error('Namespace conflict');const bar=document.getElementById('ui-bar'),button=document.getElementById('ui-bar-toggle');if(!bar||!button)throw Error('No native target');const run=window[${JSON.stringify(key)}]={bar,button,initial:SugarCube.UIBar.isStowed(),expected:SugarCube.UIBar.isStowed(),clicks:0,modules:[],styles:[]};run.listener=()=>run.clicks++;button.addEventListener('click',run.listener);return true})()`);allocated=true;
  report.stage='temporary-package-loading';
  for(const name of ['host','native-reading','reading-controls','workspace',...(sideWorkspace?['alternate-workspace']:[])]){
   const base=path.join(root,'dist/framework',name),js=fs.readFileSync(path.join(base,'index.js'),'utf8');report.resources.push({name,jsSha256:createHash('sha256').update(js).digest('hex')});
   await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}],key=${JSON.stringify('StoneFree_'+name.replaceAll('-','_'))};if(Object.hasOwn(window,key))throw Error('Package namespace conflict');(0,eval)(${JSON.stringify(js)});run.modules.push({key,api:window[key]});return true})()`);
   if(fs.existsSync(path.join(base,'style.css')))await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}],style=document.createElement('style');style.textContent=${JSON.stringify(fs.readFileSync(path.join(base,'style.css'),'utf8'))};document.head.append(style);run.styles.push(style);return true})()`);
  }
  await ctx.pause(120);
  report.projection=await client.evaluate(`DoLUiHost.sources('dol.reading.experimental')[0].read(DoLUiHost.binding())`);
  assert.equal(report.projection.ok,true);assert.equal(report.projection.value.available,true);
  for(let i=1;i<=2;i++){
   report.stage=`sidebar-action-${i}`;
   await client.evaluate(`(()=>{window[${JSON.stringify(key)}].expected=null;return true})()`);
   await click(`${own} .sf-inline-actions button:first-child`);
   const state=await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}],stowed=SugarCube.UIBar.isStowed();run.expected=stowed;return {stowed,clicks:run.clicks,same:run.bar===document.getElementById('ui-bar')&&run.button===document.getElementById('ui-bar-toggle'),message:document.querySelector('${own} [role="status"]')?.textContent}})()`);
   assert.equal(state.stowed,i===1?!report.before.stowed:report.before.stowed);assert.equal(state.clicks,i);assert.equal(state.same,true);assert.equal(state.message,'原版侧栏已切换。');ctx.resetSideEffect();
  }
  report.checks.push('Standard Tools web-click activated the independent consumer; original button received one event each time; SugarCube state toggled and restored');
  report.stage='toolbar-rectangle';
  report.toolbarRect=await client.evaluate(`(()=>{const r=document.querySelector('${own} section').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()`);
  report.stage='toolbar-native-screenshot';
  const image=await screenshot(ctx);fs.writeFileSync(path.join(dir,'reading.png'),image.binary);report.screenshotSource=image.metadata;
  report.stage='workspace-open';await click('[data-sf-owner="StoneFreeWorkspace"] .sf-workspace-entry>button');
  report.stage='workspace-observe';
  const modal=await client.evaluate(`(()=>{const view=document.querySelector('[data-view="ReadingControls:reading"]');return {open:!!document.querySelector('.sf-workspace[open]'),disabled:view?.querySelector('button')?.disabled,clicks:window[${JSON.stringify(key)}].clicks}})()`);
  assert.equal(modal.open,true);assert.equal(modal.disabled,true);assert.equal(modal.clicks,2);
  report.checks.push('Same public view composes in the workspace and declines the original control while a modal is open');
  if(sideWorkspace){
   report.stage='workspace-handoff';
   await click('[data-sf-owner="StoneFreeWorkspace"] .sf-workspace summary');
   await click('[data-sf-owner="StoneFreeWorkspace"] .sf-workspace details button');
   await click('[data-sf-owner="AlternateWorkspace"] .sf-workspace-entry>button');
   report.stage='side-workspace-observe';
   report.side=await client.evaluate(`(async()=>{const panel=document.querySelector('[data-sf-owner="AlternateWorkspace"] dialog'),r=panel.getBoundingClientRect();return {open:panel.open,modal:panel.matches(':modal'),ariaModal:panel.getAttribute('aria-modal'),claims:DoLUiHost.getDiagnostics().claims.filter(x=>x.kind==='modal').length,rect:{x:r.x,y:r.y,width:r.width,height:r.height},viewport:{width:innerWidth,height:innerHeight},projection:await DoLUiHost.sources('dol.reading.experimental')[0].read(DoLUiHost.binding())}})()`);
   assert.equal(report.side.open,true);assert.equal(report.side.modal,false);assert.equal(report.side.ariaModal,'false');assert.equal(report.side.claims,0);assert.equal(report.side.projection.ok,true);assert.equal(report.side.projection.value.available,true);
   for(let i=3;i<=4;i++){
    report.stage=`side-sidebar-action-${i}`;
    await client.evaluate(`(()=>{window[${JSON.stringify(key)}].expected=null;return true})()`);
    await click('[data-sf-owner="AlternateWorkspace"] [data-view="ReadingControls:reading"] .sf-inline-actions button:first-child');
    const state=await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}],stowed=SugarCube.UIBar.isStowed();run.expected=stowed;return {stowed,clicks:run.clicks,same:run.button===document.getElementById('ui-bar-toggle')}})()`);
    assert.equal(state.stowed,i===3?!report.before.stowed:report.before.stowed);assert.equal(state.clicks,i);assert.equal(state.same,true);ctx.resetSideEffect();
   }
   report.stage='side-native-screenshot';const image=await screenshot(ctx);fs.writeFileSync(path.join(dir,'side-workspace.png'),image.binary);
   report.stage='side-workspace-close';await click('[data-sf-owner="AlternateWorkspace"] .sf-workspace header>button');
   report.checks.push('Modeless side workspace uses the same public view; standard Tools clicks deliver exactly two additional original sidebar events and restore the native state');
  }else {report.stage='workspace-close';await click('[data-sf-owner="StoneFreeWorkspace"] .sf-workspace header>button')}
  report.after=await client.evaluate(`(()=>({stowed:SugarCube.UIBar.isStowed(),ui:DoLGameUI.version,diagnostics:DoLUiHost.getDiagnostics()}))()`);assert.equal(report.after.stowed,report.before.stowed);assert.equal(report.after.ui,report.before.ui);assert.equal(report.after.diagnostics.errors.length,0);report.status='passed';
 } catch(error){report.error=error.message;report.actionDispatched=ctx.actionDispatched;throw error}
 finally {
  if(client&&allocated)try {
   report.cleanup=await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}];if(!run)return {status:'namespace-missing'};let conflicts=0;const hostModule=run.modules.find(x=>x.key==='StoneFree_host')?.api;
    for(const entry of [...run.modules].reverse()){try{entry.api.dispose()}catch{conflicts++}if(window[entry.key]===entry.api)delete window[entry.key];else conflicts++}
    for(const style of run.styles)style.remove();run.button.removeEventListener('click',run.listener);
    const current=SugarCube.UIBar.isStowed();if(current!==run.initial){if(current===run.expected&&run.button===document.getElementById('ui-bar-toggle')&&!document.querySelector('dialog[open],body.ui-open'))run.button.click();else conflicts++}
    let waiting=null;if(!window.DoLUiHost&&hostModule){const probe=hostModule.installHost();waiting=probe?.host.getDiagnostics().participants.length;probe?.dispose()}if(waiting!==0)conflicts++;
    const result={status:conflicts?'conflict':'completed',conflicts,waiting,stowed:SugarCube.UIBar.isStowed(),restored:SugarCube.UIBar.isStowed()===run.initial,owned:document.querySelectorAll('[data-sf-owner]').length,hostAbsent:!window.DoLUiHost};delete window[${JSON.stringify(key)}];return result})()`);
   if(report.cleanup.status!=='completed'||!report.cleanup.restored||report.cleanup.owned!==0||!report.cleanup.hostAbsent)report.status='cleanup-conflict';
  }catch(error){report.cleanup={status:'failed-or-document-changed',error:error.message};report.status='cleanup-failed'}
  report.transportCleanup=await ctx.finish();fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2));
 }
 assert.equal(report.status,'passed');console.log(JSON.stringify({status:report.status,output:dir,checks:report.checks,cleanup:report.cleanup},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
