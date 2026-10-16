// Own temporary packages in one authorized WebView; no game/save writes or persisted installation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {randomUUID,createHash}=require('node:crypto');
const [toolsRoot,serial,pkg]=process.argv.slice(2),root=path.resolve(__dirname,'..');
assert.ok(toolsRoot&&serial&&pkg,'Tools root, serial and authorized test package required');
const {create}=require(path.join(toolsRoot,'scripts/lib/execution-context.cjs'));
const {execute}=require(path.join(toolsRoot,'scripts/lib/action.cjs'));
const {screenshot}=require(path.join(toolsRoot,'scripts/lib/collectors.cjs'));
const dir=path.join(root,'tests/artifacts/stone-free-motion','android-'+Date.now());fs.mkdirSync(dir,{recursive:true});
const ctx=create({serial,package:pkg},{},{timeoutMs:90000}),key='stoneFreeMotion'+randomUUID().replaceAll('-','');
const report={status:'failed',checks:[],resources:[],scope:'Temporary Motion Hub in the identified DoL WebView; UI-only sidebar operation. CDP touch injection is not physical touch.'};
let client,allocated=false;
const ball='.sf-motion-hub .sf-motion-ball',orbit='.sf-motion-hub .sf-motion-orbit',sheet='.sf-motion-hub .sf-motion-sheet';
async function click(selector){await execute(ctx,{type:'web-click',selector});await ctx.pause(600)}
async function picture(name){const image=await screenshot(ctx);fs.writeFileSync(path.join(dir,name+'.png'),image.binary);return image.metadata}
const inspect=()=>client.evaluate(`(()=>{const b=document.querySelector('${ball}'),s=document.querySelector('${sheet}'),r=s.getBoundingClientRect();return {expanded:b.getAttribute('aria-expanded'),docked:b.classList.contains('is-docked'),sheet:s.classList.contains('is-open'),sidebar:SugarCube.UIBar.isStowed(),nativeClicks:window[${JSON.stringify(key)}].clicks,rect:{x:r.x,y:r.y,right:r.right,bottom:r.bottom},viewport:{width:visualViewport.width,height:visualViewport.height},diagnostics:DoLUiHost.getDiagnostics()}})()`);
(async()=>{
 try {
  report.stage='bind-and-observe';client=await ctx.ensureWebview();
  report.before=await client.evaluate(`(()=>({game:StartConfig.version,ui:DoLGameUI.version,scene:SugarCube.State.passage,host:!!window.DoLUiHost,sidebar:SugarCube.UIBar.isStowed(),dialogs:document.querySelectorAll('dialog[open],body.ui-open').length,viewport:{width:innerWidth,height:innerHeight}}))()`);
  assert.equal(report.before.game,'0.5.12.13');assert.equal(report.before.host,false);assert.equal(report.before.dialogs,0);
  report.document=(await client.send('Page.getFrameTree')).frameTree.frame;
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
  report.statusView=await client.evaluate(`(async()=>({source:await DoLUiHost.sources('dol.status.experimental')[0].read(DoLUiHost.binding()),values:[...document.querySelectorAll('${sheet} dd')].map(n=>n.textContent),focus:document.activeElement===document.querySelector('${sheet} h2')}))()`);
  assert.equal(report.statusView.source.ok,true);assert.equal(report.statusView.values.length,3);assert.equal(report.statusView.focus,true);await picture('status');
  await click(`${sheet} header>button`);
  report.checks.push('Real Android public status view mounts with scoped heading focus; close releases the view');
  report.stage='reading-original-action';await click(ball);await click(`${orbit} [data-motion-view="StoneFreeMotionHub:reading"]`);
  for(let i=1;i<=2;i++){
   await click(`${sheet} .sf-reading .sf-inline-actions button:first-child`);
   const outcome=await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}];return {clicks:run.clicks,stowed:SugarCube.UIBar.isStowed(),same:run.button===document.getElementById('ui-bar-toggle')&&run.parent===run.button.parentNode,message:document.querySelector('${sheet} [role="status"]')?.textContent}})()`);
   assert.equal(outcome.clicks,i);assert.equal(outcome.stowed,i===1?!report.before.sidebar:report.before.sidebar);assert.equal(outcome.same,true);assert.equal(outcome.message,'原版侧栏已切换。');ctx.resetSideEffect();
   (report.outcomes??=[]).push(outcome);
  }
  await picture('reading');await click(`${sheet} header>button`);
  report.checks.push('Two standard Tools web-clicks reach the original sidebar button once each; SugarCube state toggles and returns');
  report.stage='touch-drag-and-dock';
  const start=await client.evaluate(`(()=>{const n=document.querySelector('${ball}'),r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,targetY:Math.min(visualViewport.height-100,340)}})()`);
  // Standard Action has tap but no drag. Use bound CDP touch input for this owned control only.
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start.x,y:start.y}]});
  for(let i=1;i<=8;i++){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(12-start.x)*i/8,y:start.y+(start.targetY-start.y)*i/8}]});await ctx.pause(24)}
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await ctx.pause(650);
  report.dock=await inspect();assert.equal(report.dock.docked,true);assert.equal(report.dock.expanded,'false');assert.equal(report.dock.sidebar,report.before.sidebar,'Owned drag must not activate the page sidebar gesture');assert.equal(report.dock.nativeClicks,2);
  await client.evaluate(`(()=>{window[${JSON.stringify(key)}].expected=localStorage.getItem('StoneFreeMotionHub.position.v1');return true})()`);await picture('docked');
  await click(ball);report.restored=await inspect();assert.equal(report.restored.docked,false);
  await client.evaluate(`(()=>{window[${JSON.stringify(key)}].expected=localStorage.getItem('StoneFreeMotionHub.position.v1');return true})()`);
  report.checks.push('Bound CDP touch drag docks at the left edge; one click restores the floating position without expanding accidentally');
  report.stage='scene-invalidation';await click(ball);await click(`${orbit} [data-motion-view="StoneFreeMotionHub:compare"]`);
  report.scene=await client.evaluate(`(()=>{const before=DoLUiHost.getDiagnostics().generation;DoLUiHost.invalidateScene();return {before,after:DoLUiHost.getDiagnostics().generation}})()`);await ctx.pause(100);
  assert.ok(report.scene.after>report.scene.before);assert.equal((await inspect()).expanded,'false');
  await client.evaluate(`(()=>{DoLUiHost.sceneReady();return true})()`);
  await click(ball);await click(`${orbit} [data-motion-view="StoneFreeMotionHub:status"]`);assert.equal((await inspect()).sheet,true);await click(`${sheet} header>button`);
  report.checks.push('Controlled Host invalidation closes the current view and allows a fresh view; not a natural Passage navigation or a fabricated global game event');
  report.after=await inspect();assert.equal(report.after.diagnostics.errors.length,0);report.status='passed';
 }catch(error){report.error=error.message;report.actionDispatched=ctx.actionDispatched;throw error}
 finally {
  if(client&&allocated)try{
   report.cleanup=await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}];if(!run)return {status:'namespace-missing'};let conflicts=0;const host=run.modules.find(m=>m.key==='StoneFree_host')?.api;
    for(const entry of [...run.modules].reverse()){try{entry.api.dispose()}catch{conflicts++}if(window[entry.key]===entry.api)delete window[entry.key];else conflicts++}
    for(const style of run.styles)style.remove();run.button.removeEventListener('click',run.listener);
    const position=localStorage.getItem('StoneFreeMotionHub.position.v1');if(position===run.expected||position===run.position){if(run.position===null)localStorage.removeItem('StoneFreeMotionHub.position.v1');else localStorage.setItem('StoneFreeMotionHub.position.v1',run.position)}else conflicts++;
    let waiting=null;if(!window.DoLUiHost&&host){const probe=host.installHost();waiting=probe?.host.getDiagnostics().participants.length;probe?.dispose()}if(waiting!==0)conflicts++;
    const result={status:conflicts?'conflict':'completed',conflicts,waiting,owned:document.querySelectorAll('[data-sf-owner]').length,hostAbsent:!window.DoLUiHost,sidebar:SugarCube.UIBar.isStowed(),scene:SugarCube.State.passage,positionRestored:localStorage.getItem('StoneFreeMotionHub.position.v1')===run.position};delete window[${JSON.stringify(key)}];return result})()`);
   if(report.cleanup.status!=='completed'||report.cleanup.owned!==0||!report.cleanup.hostAbsent||!report.cleanup.positionRestored||report.cleanup.sidebar!==report.before.sidebar)report.status='cleanup-conflict';
  }catch(error){report.cleanup={status:'failed-or-document-changed',error:error.message};report.status='cleanup-failed'}
  report.transportCleanup=await ctx.finish();fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2));
 }
 assert.equal(report.status,'passed');console.log(JSON.stringify({status:report.status,output:dir,checks:report.checks,cleanup:report.cleanup},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
