// Opt-in, temporary UI-only smoke on an explicitly authorized test App.
// Reads built resources and removes only this run's Host, styles and namespace.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {randomUUID,createHash}=require('node:crypto');
const [toolsRoot,serial,pkg]=process.argv.slice(2),root=path.resolve(__dirname,'..');
assert.ok(toolsRoot&&serial&&pkg,'Tools root, serial and test package are required');
const {create}=require(path.join(toolsRoot,'scripts/lib/execution-context.cjs'));
const dir=path.join(root,'tests/artifacts/stone-free-foundation','android-'+Date.now());fs.mkdirSync(dir,{recursive:true});
const ctx=create({serial,package:pkg},{},{timeoutMs:60000}),key='stoneFreeAcceptance'+randomUUID().replaceAll('-','');
const report={status:'failed',scope:'Temporary runtime resources in existing authorized test WebView; no persisted Mod install, game action or save writes',checks:[],resources:[]};
const save=()=>fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2));
const sha=data=>createHash('sha256').update(data).digest('hex');
let client,allocated=false;
(async()=>{
 try {
  client=await ctx.ensureWebview();
  report.before=await client.evaluate(`(()=>({hostExists:!!window.DoLUiHost,ui:window.DoLGameUI?.version,game:window.StartConfig?.version,loader:window.modUtils?.version,sugarCube:window.SugarCube?.version?.toString?.(),viewport:{width:innerWidth,height:innerHeight},nativeValues:Object.fromEntries(['pain','stress','tiredness'].map(k=>[k,window.SugarCube?.State?.variables?.[k]??window.State?.variables?.[k]??null]))}))()`);
  assert.equal(report.before.hostExists,false,'A pre-existing Host must not be replaced');assert.equal(report.before.game,'0.5.12.13');
  const binding=await client.send('Page.getFrameTree');report.document={frame:binding.frameTree.frame.id,loader:binding.frameTree.frame.loaderId};
  await client.evaluate(`(()=>{if(Object.hasOwn(window,${JSON.stringify(key)}))throw Error('Own namespace conflict');window[${JSON.stringify(key)}]={styles:[],host:null};return true})()`);allocated=true;
  for(const name of ['host','native-status','comparison','soft-wet-surface']){
   const js=fs.readFileSync(path.join(root,`dist/framework/${name}/index.js`),'utf8');report.resources.push({name,jsSha256:sha(js)});
   await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}];if(!run)throw Error('Own namespace missing');(0,eval)(${JSON.stringify(js)});${name==='host'?'run.host=window.DoLUiHost;':''}return true})()`);
   const style=path.join(root,`dist/framework/${name}/style.css`);
   if(fs.existsSync(style))await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}],style=document.createElement('style');style.textContent=${JSON.stringify(fs.readFileSync(style,'utf8'))};document.head.append(style);run.styles.push(style);return true})()`);
  }
  await ctx.pause(180);
  report.live=await client.evaluate(`(async()=>{const h=window[${JSON.stringify(key)}].host;if(window.DoLUiHost!==h)throw Error('Host ownership changed');return {diagnostics:h.getDiagnostics(),projection:await h.sources('dol.status.experimental')[0].read(h.binding()),mounts:document.querySelectorAll('[data-sf-owner]').length}})()`);
  assert.equal(report.live.mounts,3);assert.equal(report.live.projection.ok,true);assert.deepEqual(report.live.projection.value,report.before.nativeValues);assert.equal(report.live.diagnostics.errors.length,0);
  report.checks.push('Two independent bundled Vue Apps coexist with the current UI; projection equals original native state');
  await client.evaluate(`(()=>{document.querySelector('[data-sf-owner="StatusComparison"] button').click();return true})()`);await ctx.pause(100);
  const open=await client.evaluate(`(()=>{const d=document.querySelector('[data-sf-owner="StatusComparison"] dialog'),r=d.getBoundingClientRect();return {open:d.open,overflow:d.scrollWidth>d.clientWidth,rect:{x:r.x,y:r.y,width:r.width,height:r.height},width:innerWidth,height:innerHeight}})()`);
  assert.equal(open.open,true);assert.equal(open.overflow,false);assert.ok(open.rect.x>=0&&open.rect.x+open.rect.width<=open.width);report.dialog=open;
  const screenshot=await client.send('Page.captureScreenshot',{format:'png',clip:{...open.rect,scale:1}});fs.writeFileSync(path.join(dir,'comparison.png'),Buffer.from(screenshot.data,'base64'));
  await client.evaluate(`(()=>{document.querySelector('[data-sf-owner="NativeStatus"] button').click();return true})()`);
  assert.equal(await client.evaluate(`document.querySelectorAll('[data-sf-owner] dialog[open]').length`),1);report.checks.push('Participating modal conflict does not stack a second dialog');
  await client.evaluate(`(()=>{document.querySelector('[data-sf-owner="StatusComparison"] dialog header button').click();return true})()`);
  assert.equal(await client.evaluate(`document.querySelectorAll('[data-sf-owner] dialog[open]').length`),0);report.checks.push('CDP DOM click opens/closes the own surface; not trusted-touch proof');
  await client.evaluate(`(()=>{document.querySelector('[data-sf-owner="SoftWetSurface"] button').click();return true})()`);await ctx.pause(100);
  const official=await client.evaluate(`(()=>{const d=[...document.querySelectorAll('.dgu-surface[open]')].find(n=>n.querySelector('h2')?.textContent==='公开状态来源');return d?{open:true,text:d.querySelector('.dgu-surface-content')?.textContent}:null})()`);
  assert.equal(official?.open,true);assert.match(official.text,/疲劳/);
  await client.evaluate(`(()=>{const d=[...document.querySelectorAll('.dgu-surface[open]')].find(n=>n.querySelector('h2')?.textContent==='公开状态来源');d.querySelector('header button').click();return true})()`);report.checks.push('Same public projection displayed through actual Soft & Wet API v1 Drawer');
  report.after=await client.evaluate(`(()=>({ui:window.DoLGameUI?.version,nativeValues:Object.fromEntries(['pain','stress','tiredness'].map(k=>[k,window.SugarCube?.State?.variables?.[k]??window.State?.variables?.[k]??null]))}))()`);
  assert.equal(report.before.ui,report.after.ui);assert.deepEqual(report.before.nativeValues,report.after.nativeValues);report.status='passed';
 } finally {
  if(client&&allocated){
   try {
    report.cleanup=await client.evaluate(`(()=>{const run=window[${JSON.stringify(key)}];if(!run)return {status:'namespace-missing'};if(window.DoLUiHost!==run.host)throw Error('Host cleanup ownership conflict');run.host.dispose();for(const style of run.styles)style.remove();delete window[${JSON.stringify(key)}];return {status:'completed',ownedMounts:document.querySelectorAll('[data-sf-owner]').length,hostAbsent:!window.DoLUiHost,uiVersion:window.DoLGameUI?.version}})()`);
    if(report.cleanup.status!=='completed'||report.cleanup.ownedMounts!==0||!report.cleanup.hostAbsent)report.status='cleanup-conflict';
   }catch{report.cleanup={status:'failed-or-document-changed'};report.status='cleanup-failed'}
  }
  report.transportCleanup=await ctx.finish();save();
 }
 assert.equal(report.status,'passed');console.log(JSON.stringify({status:report.status,output:dir,checks:report.checks,cleanup:report.cleanup},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
