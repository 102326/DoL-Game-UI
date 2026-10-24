// Terminal failure receipts: caught diagnostic errors and stderr text are not proof.
import fs = require('node:fs');
import path = require('node:path');
import assert = require('node:assert/strict');
import Module = require('node:module');
import caseRuntime = require('./ci-cases.cjs');
const renderer:typeof import('./ci/renderer.ts')=require('./ci/renderer.ts');
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
type Load=(this:unknown,request:string,parent?:NodeModule,isMain?:boolean)=>unknown;
function moduleLoader(value:unknown):value is {_load:Load}{return (typeof value==='function'||record(value))&&'_load' in value&&typeof value._load==='function';}
function chromium(value:unknown):value is Parameters<typeof renderer.instrumentChromium>[0]{return record(value)&&typeof value.launch==='function';}
// _load is a Node-private API; its real preload/receipt path is checked on Node 26.
if(!moduleLoader(Module))throw Error('Node module loader unavailable');
const load=Module._load,proxies=new WeakMap<Function,Function>();let assertions=0;
caseRuntime.setAssertionCounter(()=>assertions);
function counted(target:Function):Function{
 const existing=proxies.get(target);if(existing)return existing;
 const proxy=new Proxy(target,{
  apply(fn,receiver,args:unknown[]){assertions++;return Reflect.apply(fn,receiver,args);},
  get(fn,key){const value:unknown=Reflect.get(fn,key);return typeof value==='function'&&!['AssertionError','CallTracker'].includes(String(key))?counted(value):value;}
 });
 proxies.set(target,proxy);return proxy;
}
Module._load=function(request,parent,isMain){
 const value=load.call(this,request,parent,isMain);
 if(request==='playwright'&&process.env.MOODY_EXECUTION_ID){
  if(!record(value)||!chromium(value.chromium))throw Error('Playwright Chromium unavailable');
  renderer.instrumentChromium(value.chromium);
 }
 return ['assert','node:assert','assert/strict','node:assert/strict'].includes(request)&&typeof value==='function'?counted(value):value;
};
function recordFailure(error:unknown,{nodeTest=false}:{nodeTest?:boolean}={}):void{
 const file=process.env.MOODY_PROCESS_RECEIPT?process.env.MOODY_PROCESS_RECEIPT+'.'+process.pid+'.json':null,executionId=process.env.MOODY_EXECUTION_ID;if(!file||!executionId)return;
 const detail=record(error)?error:undefined;
 const assertion=error instanceof assert.AssertionError||(nodeTest&&detail?.code==='ERR_ASSERTION'&&detail?.name==='AssertionError');
 try{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify({schema:1,executionId,pid:process.pid,terminal:true,kind:assertion?'assertion':'infrastructure',source:nodeTest?'node:test':'terminal',code:detail?.code||null,name:detail?.name||null,message:String(detail?.message||error).slice(0,2000)}));}catch{}
}
function terminalFailure(error:unknown):void{recordFailure(error);console.error(error);}
process.on('uncaughtExceptionMonitor',error=>recordFailure(error));
process.on('beforeExit',()=>{
 const file=process.env.MOODY_PROCESS_RECEIPT?process.env.MOODY_PROCESS_RECEIPT+'.'+process.pid+'.json':null,executionId=process.env.MOODY_EXECUTION_ID;if(!file||!executionId)return;
 try{
  let report:Record<string,unknown>={schema:1,executionId};
  if(fs.existsSync(file)){const prior:unknown=JSON.parse(fs.readFileSync(file,'utf8'));if(record(prior)&&prior.executionId===executionId&&prior.pid===process.pid)report=prior;}
  const terminal=report.terminal?{kind:typeof report.kind==='string'?report.kind:undefined,message:typeof report.message==='string'?report.message:undefined}:undefined;
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify({...report,pid:process.pid,naturalCompletion:true,assertions,...caseRuntime.finishCases(terminal),graphics:renderer.graphicsSnapshot()}));
 }catch{}
});
interface NativeCase {id:string;status:'SKIP'|'FAIL'|'PASS';milliseconds:number|null;assertions:null;assertionEvidence:string;path:'node:test';failureSignature?:string}
function recordNodeCases(nodeTests:NativeCase[],nodeCaseIssues:string[]):void{
 const executionId=process.env.MOODY_EXECUTION_ID,base=process.env.MOODY_PROCESS_RECEIPT;if(!base||!executionId)return;
 const file=base+'.'+process.pid+'.json';
 try{let report:Record<string,unknown>={schema:1,executionId,pid:process.pid};if(fs.existsSync(file)){const prior:unknown=JSON.parse(fs.readFileSync(file,'utf8'));if(!record(prior))throw Error('Invalid process receipt');report=prior;}fs.writeFileSync(file,JSON.stringify({...report,nodeTests,nodeCaseIssues}));}catch{}
}
export = {recordFailure,terminalFailure,recordNodeCases};
