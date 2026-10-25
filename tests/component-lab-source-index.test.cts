import nodeTest = require('node:test');
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import os = require('node:os');
import child = require('node:child_process');
const {test}=nodeTest,{execFileSync}=child;
import sourceIndex = require('../component-lab/source-index.cjs');
const producer=path.resolve(__dirname,'../component-lab/source-index.cjs'),{inputs}=sourceIndex;
function isProducer(value:unknown):value is Pick<typeof sourceIndex,'sourceIndex'>{return !!value&&typeof value==='object'&&'sourceIndex' in value&&typeof value.sourceIndex==='function';}
function fixture(t:import('node:test').TestContext){const root=fs.mkdtempSync(path.join(os.tmpdir(),'Lab 索引 空格 '));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));for(const f of inputs){const full=path.join(root,f);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,'synthetic source input')}fs.copyFileSync(producer,path.join(root,'component-lab/source-index.cjs'));execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','.'],{cwd:root});execFileSync('git',['-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-qm','fixture'],{cwd:root});const loaded:unknown=require(path.join(root,'component-lab/source-index.cjs'));assert.ok(isProducer(loaded));return {root,index:loaded.sourceIndex}}
test('producer detects same-HEAD byte changes without publishing root paths',t=>{const f=fixture(t),first=f.index();assert.equal(first.snapshot.dirty,false);fs.appendFileSync(path.join(f.root,'src/shop/Toolbar.vue'),' changed');const second=f.index();assert.equal(second.snapshot.revision,first.snapshot.revision);assert.equal(second.snapshot.dirty,true);assert.notEqual(second.snapshot.digest,first.snapshot.digest);assert.equal(JSON.stringify(second).includes(f.root),false)});
test('floating profile covers its own source and refuses unknown components',t=>{const f=fixture(t),first=f.index('floating.tools'),shop=f.index();assert.equal(first.role,'floating');assert.ok(first.candidates.source.includes('src/floating/FloatingTools.vue'));fs.appendFileSync(path.join(f.root,'src/floating/style.css'),' changed');assert.notEqual(f.index('floating.tools').snapshot.digest,first.snapshot.digest);assert.equal(f.index().snapshot.digest,shop.snapshot.digest);assert.throws(()=>f.index('unknown.component'),/Unknown Lab component/)});
test('producer refuses fixed inputs that resolve outside root or into sensitive paths',t=>{
 const f=fixture(t),input=path.join(f.root,'src/shop/style.css'),outside=fs.mkdtempSync(path.join(os.tmpdir(),'lab-outside-input-'));t.after(()=>fs.rmSync(outside,{recursive:true,force:true}));fs.writeFileSync(path.join(outside,'source.css'),'synthetic outside input');
 if(process.platform==='win32'){
  // Windows file symlinks require elevation; junctions exercise the same canonical boundary.
  const shop=path.join(f.root,'src/shop');fs.renameSync(shop,path.join(f.root,'retained-shop'));fs.writeFileSync(path.join(outside,'Toolbar.vue'),'synthetic outside input');fs.symlinkSync(outside,shop,'junction');assert.throws(()=>f.index(),/outside/);fs.unlinkSync(shop);
  const sensitive=path.join(f.root,'.env-inputs');fs.mkdirSync(sensitive);fs.writeFileSync(path.join(sensitive,'Toolbar.vue'),'synthetic excluded target');fs.symlinkSync(sensitive,shop,'junction');assert.throws(()=>f.index(),/excluded/);
 }else{
  fs.unlinkSync(input);fs.symlinkSync(path.join(outside,'source.css'),input);assert.throws(()=>f.index(),/outside/);fs.unlinkSync(input);fs.writeFileSync(path.join(f.root,'.env'),'synthetic excluded target');fs.symlinkSync(path.join(f.root,'.env'),input);assert.throws(()=>f.index(),/excluded/);
 }
});
