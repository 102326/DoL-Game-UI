import child = require('node:child_process');
import crypto = require('node:crypto');
const {execFileSync}=child;
// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"checkpoint","caseSource":"checkpoint","evidence":"checkpoints"}
import checkpoints = require('../scripts/ci-checkpoints.cjs');
import fs = require('node:fs');
import path = require('node:path');
import assert = require('node:assert/strict');
import vm = require('node:vm');
const {checkpoint}=checkpoints;

const root=path.resolve(__dirname,'..');
execFileSync(process.execPath,[path.join(root,'scripts/build-early.cjs')],{cwd:root});
// Exercise the compiled early global, including repeat loading and foreign fields.
const source=fs.readFileSync(path.join(root,'dist/shop-page-experiment.js'),'utf8');
const window:Record<string,unknown>={};vm.runInNewContext(source,{window});
interface EarlyApi {enabled:boolean;setEnabled(value:unknown):boolean;reset():boolean;foreign?:string}
function isApi(value:unknown):value is EarlyApi{return !!value&&typeof value==='object'&&'enabled' in value&&typeof value.enabled==='boolean'&&'setEnabled' in value&&typeof value.setEnabled==='function'&&'reset' in value&&typeof value.reset==='function';}
const api=window.DoLShopPageExperiment;assert.ok(isApi(api));
assert.equal(api.enabled,false);checkpoint('default-off');assert.equal(api.setEnabled(true),true);
assert.equal(api.setEnabled('true'),false);checkpoint('strict-boolean');api.setEnabled(true);api.foreign='kept';
vm.runInNewContext(source,{window});assert.equal(window.DoLShopPageExperiment,api);checkpoint('repeat-identity');
assert.equal(api.enabled,true);assert.equal(api.foreign,'kept');checkpoint('foreign-fields');assert.equal(api.reset(),false);checkpoint('reset');
console.log('PASS compiled early shop API: default-off, strict boolean, repeat identity, foreign fields and reset');

// The original and generated Twee callbacks must keep the same jQuery effects.
// Frozen data from ff7942d:twee/patch-resize.twee; keep this oracle unchanged.
const oldResize=fs.readFileSync(path.join(__dirname,'fixtures/shop-resize-before-ts.twee'),'utf8');
assert.equal(crypto.createHash('sha256').update(oldResize).digest('hex'),'4d604afceeb23ee0d17733fe248f24736ed01b1284be467daab6039223305da3');
const newResize=fs.readFileSync(path.join(root,'twee/patch-resize.twee'),'utf8');
type ResizeInput={width:number|undefined;buttonWidth:number|undefined;count:number};
type Query={find(selector:string):Query;width():number|undefined;outerWidth():number|undefined;children():{length:number};toggleClass(name:string,enabled:boolean):Query;on(event:string,handler:()=>void):Query;off(event:string):Query};
function resizeEffects(text:string,input:ResizeInput){
 const blocks=[...text.matchAll(/<<run ([\s\S]*?)>>/g)].map(match=>match[1]);assert.equal(blocks.length,3);
 return blocks.map(block=>{assert.ok(block);const effects:{off:string[];on:string[];toggles:[string,string,boolean][]}={off:[],on:[],toggles:[]},handlers:Array<()=>void>=[];
  const queries=new Map<string,Query>();
  const make=(name:string):Query=>{const query:Query={find(selector){const next=queries.get(selector);if(!next)throw Error('Unknown fixture selector '+selector);return next},width:()=>input.width,outerWidth:()=>input.buttonWidth,children:()=>({length:input.count}),toggleClass(className,enabled){effects.toggles.push([name,className,enabled]);return query},on(event,handler){effects.on.push(event);handlers.push(handler);return query},off(event){effects.off.push(event);return query}};return query};
  for(const name of ['#shop-pagination','.shop-pages','.btn-pagination','.shop-pages-number'])queries.set(name,make(name));
  const testWindow={},windowQuery=make('window');
  const query=(target:unknown)=>{if(target===testWindow)return windowQuery;if(typeof target==='string'){const result=queries.get(target);if(result)return result}else{const result=[...queries.values()].find(value=>value===target);if(result)return result}throw Error('Unknown query target')};
  vm.runInNewContext(block.replace(/\s+/g,' '),{window:testWindow,$:query});for(const handler of handlers)handler();return effects;
 });
}
for(const input of [{width:300,buttonWidth:32,count:4},{width:100,buttonWidth:32,count:4},{width:undefined,buttonWidth:32,count:4},{width:300,buttonWidth:undefined,count:4},{width:300,buttonWidth:32,count:0},{width:10,buttonWidth:32,count:0},{width:NaN,buttonWidth:32,count:4},{width:Infinity,buttonWidth:32,count:4}])assert.deepEqual(resizeEffects(newResize,input),resizeEffects(oldResize,input));
checkpoint('typed-twee-resize');
console.log('PASS generated Twee callbacks survive Widget whitespace folding and preserve both native/experimental events and eight width/empty cases');
const commented=newResize.replaceAll('"use strict";','\n// src/early/shop-resize.ts\n"use strict";');
assert.notEqual(commented,newResize);assert.throws(()=>resizeEffects(commented,{width:300,buttonWidth:32,count:4}),/Unexpected end of input/);
checkpoint('widget-line-comment-rejected');

const generatedTwee=path.join(root,'twee/patch-resize.twee'),saved=fs.readFileSync(generatedTwee);
try{const drift=Buffer.concat([saved,Buffer.from('\n<!-- controlled output drift -->\n')]);fs.writeFileSync(generatedTwee,drift);const result=child.spawnSync(process.execPath,[path.join(root,'scripts/build-early.cjs'),'--check-twee'],{cwd:root,encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/Twee resize output drifted/);assert.deepEqual(fs.readFileSync(generatedTwee),drift,'check must not rewrite a drifted output')}finally{fs.writeFileSync(generatedTwee,saved)}
execFileSync(process.execPath,[path.join(root,'scripts/build-early.cjs'),'--check-twee'],{cwd:root});
checkpoint('typed-twee-drift');
