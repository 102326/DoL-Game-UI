// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import assert = require('node:assert/strict');
import fs = require('node:fs');
import os = require('node:os');
import path = require('node:path');
import child = require('node:child_process');
import nodeTest = require('node:test');
const {spawnSync}=child,{test}=nodeTest;
const root=path.resolve(__dirname,'..'),builder=path.join(root,'scripts/build-adapters.cjs');
test('standalone adapter may copy the resource primitive but cannot bundle Runtime or other modules',()=>{
 // macOS /var is a symlink; esbuild reports the canonical /private path.
 const folder=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sw-adapter-boundary-')));
 try{
  fs.writeFileSync(path.join(folder,'boot.json'),JSON.stringify({scriptFileList:['adapter.js']}));
  const source=path.join(folder,'adapter.ts'),output=path.join(folder,'dist/scripts/adapter.js');
  const modulePath=(file:string)=>JSON.stringify(path.join(root,file).replaceAll('\\','/'));
  fs.writeFileSync(source,`import {visualScope} from ${modulePath('src/ui/visual-scope.ts')}; globalThis.adapterOwner=visualScope();`);
  let result=spawnSync(process.execPath,[builder,folder],{encoding:'utf8',cwd:root});
  assert.equal(result.status,0,result.stderr);assert.match(fs.readFileSync(output,'utf8'),/Visual scope cleanup failed/);
  for(const [file,symbol]of [['src/runtime/ui.ts','createUiRuntime'],['src/runtime/target-version.ts','matchesTargetVersion']] as const){
   fs.rmSync(output,{force:true});
   fs.writeFileSync(source,`import {${symbol}} from ${modulePath(file)}; globalThis.forbidden=${symbol};`);
   result=spawnSync(process.execPath,[builder,folder],{encoding:'utf8',cwd:root});
   assert.notEqual(result.status,0);assert.match(result.stderr,/Adapter must not bundle runtime imports: adapter\.js/);
   assert.equal(fs.existsSync(output),false,'Rejected imports must not produce a package member');
  }
 }finally{fs.rmSync(folder,{recursive:true,force:true})}
});
test('adapter build rejects malformed script lists before emitting code',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'sw-adapter-manifest-'));
 try{
  for(const boot of [{scriptFileList:'adapter.js'},{scriptFileList:[null]},{scriptFileList_inject_early:[12]}]){
   fs.writeFileSync(path.join(folder,'boot.json'),JSON.stringify(boot));
   const result=spawnSync(process.execPath,[builder,folder],{encoding:'utf8',cwd:root});
   assert.notEqual(result.status,0);assert.match(result.stderr,/Adapter script list must contain strings/);
   assert.equal(fs.existsSync(path.join(folder,'dist')),false);
  }
 }finally{fs.rmSync(folder,{recursive:true,force:true})}
});
