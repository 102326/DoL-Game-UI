const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{buildSync}=require('esbuild');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'tests/artifacts/stone-free-connect','browser-'+Date.now());fs.mkdirSync(dir,{recursive:true});
const source=path.join(root,'framework/connect.ts'),bundle=path.join(dir,'connect.js'),hostBundle=path.join(dir,'host.js');
buildSync({entryPoints:[source],bundle:true,format:'iife',globalName:'ConnectTest',platform:'browser',outfile:bundle});
buildSync({entryPoints:[path.join(root,'framework/host.ts')],bundle:true,format:'iife',globalName:'HostTest',platform:'browser',outfile:hostBundle});
(async()=>{
 const browser=await chromium.launch(require('./browser-options.cjs'));
 try {
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<!doctype html><body><main id="passages"></main></body>');await page.addScriptTag({path:bundle});await page.addScriptTag({path:hostBundle});
  await page.evaluate(()=>{window.events=[];window.good=HostTest.createHost(window)});
  const result=await page.evaluate(()=>{
   const run=(root,starter=()=>{events.push('start');return ()=>events.push('cleanup')})=>ConnectTest.connectConsumer(starter,root);
   const root=Object.create(window);Object.defineProperty(root,'document',{value:document});
   const out=[];
   for(const [name,setup] of [
    ['throwing global getter',r=>Object.defineProperty(r,'DoLUiHost',{get(){throw Error('secret')}})],
    ['missing Host',()=>{}],
    ['incomplete Host',r=>Object.defineProperty(r,'DoLUiHost',{value:{protocolVersion:'0.1-experimental'}})],
    ['unrecognized Host',r=>Object.defineProperty(r,'DoLUiHost',{value:{...good,getCapabilities(){return {views:true}}}})],
    ['unsupported protocol',r=>Object.defineProperty(r,'DoLUiHost',{value:{...good,protocolVersion:'9'}})],
    ['throwing protocol accessor',r=>Object.defineProperty(r,'DoLUiHost',{value:new Proxy(good,{get(t,k){if(k==='protocolVersion')throw Error();return t[k]}})})],
    ['throwing method accessor',r=>Object.defineProperty(r,'DoLUiHost',{value:new Proxy(good,{get(t,k){if(k==='register')throw Error();return t[k]}})})],
    ['disposed Host',r=>Object.defineProperty(r,'DoLUiHost',{value:{...good,getDiagnostics(){return {disposed:true}}}})]
   ]){const isolated=Object.create(window);Object.defineProperty(isolated,'document',{value:document});const before=events.length;setup(isolated);const disconnect=run(isolated);out.push([name,events.length-before]);disconnect();}
   let target;const live=Object.create(window);Object.defineProperty(live,'document',{value:document});Object.defineProperty(live,'DoLUiHost',{get(){return target},configurable:true});
   target=good;let count=0,listenerCount=0;const unbind=run(live,host=>{const owner=host.register('BrokenEntry');const element=document.createElement('div');element.id='broken-entry';document.body.append(element);const listener=()=>listenerCount++;document.addEventListener('fixture',listener);events.push('half-init');owner.dispose();element.remove();document.removeEventListener('fixture',listener);throw Error('private')});
   const peer=run(live,host=>{count++;const owner=host.register('Peer');events.push('peer-start');return ()=>{owner.dispose();events.push('peer-cleanup')}});
   target={...good,protocolVersion:'9'};document.dispatchEvent(new Event('stone-free-host-ready'));
   const cleanupCount=events.filter(e=>e==='peer-cleanup').length,diagnostics=good.getDiagnostics();document.dispatchEvent(new Event('fixture'));
   peer();unbind();
   return {out,events,count,cleanupCount,owners:diagnostics.participants,dom:!!document.querySelector('#broken-entry'),listenerCount};
  });
  for(const [name,n] of result.out)assert.equal(n,0,name);
  assert.equal(result.count,1);assert.equal(result.cleanupCount,1);assert.ok(result.events.includes('half-init'));assert.deepEqual(result.owners,[]);assert.equal(result.dom,false);assert.equal(result.listenerCount,0);assert.ok(!errors.length,errors.join('\n'));
  await page.close();fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({status:'passed',result},null,2));console.log(dir);
 }finally{await browser.close()}
})().catch(e=>{fs.writeFileSync(path.join(dir,'failure.json'),JSON.stringify({status:'failed',error:e.message},null,2));require('../scripts/ci-process-receipt.cjs').terminalFailure(e);process.exitCode=1});
