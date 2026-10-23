// Terminal failure receipts: caught diagnostic errors and stderr text are not proof.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
// Count actual built-in assertion calls in required script contracts, including direct assert().
const caseRuntime=require('./ci-cases.cjs'),renderer=require('./ci/renderer.ts');
const Module=require('node:module'),load=Module._load,proxies=new WeakMap();let assertions=0;caseRuntime.setAssertionCounter(()=>assertions);
function counted(target){if(proxies.has(target))return proxies.get(target);const proxy=new Proxy(target,{apply(fn,receiver,args){assertions++;return Reflect.apply(fn,receiver,args)},get(fn,key){const value=Reflect.get(fn,key);return typeof value==='function'&&!['AssertionError','CallTracker'].includes(String(key))?counted(value):value}});proxies.set(target,proxy);return proxy}
Module._load=function(request,parent,isMain){const value=load.apply(this,arguments);if(request==='playwright'&&process.env.MOODY_EXECUTION_ID)renderer.instrumentChromium(value.chromium);return ['assert','node:assert','assert/strict','node:assert/strict'].includes(request)?counted(value):value};
function recordFailure(error,{nodeTest=false}={}){
 const file=process.env.MOODY_PROCESS_RECEIPT?process.env.MOODY_PROCESS_RECEIPT+'.'+process.pid+'.json':null,executionId=process.env.MOODY_EXECUTION_ID;if(!file||!executionId)return;
 const assertion=error instanceof assert.AssertionError||(nodeTest&&error?.code==='ERR_ASSERTION'&&error?.name==='AssertionError');
 try{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify({schema:1,executionId,pid:process.pid,terminal:true,kind:assertion?'assertion':'infrastructure',source:nodeTest?'node:test':'terminal',code:error?.code||null,name:error?.name||null,message:String(error?.message||error).slice(0,2000)}));}catch{}
}
function terminalFailure(error){recordFailure(error);console.error(error)}
process.on('uncaughtExceptionMonitor',recordFailure);
process.on('beforeExit',()=>{
 const file=process.env.MOODY_PROCESS_RECEIPT?process.env.MOODY_PROCESS_RECEIPT+'.'+process.pid+'.json':null,executionId=process.env.MOODY_EXECUTION_ID;if(!file||!executionId)return;
 try{let report={schema:1,executionId};if(fs.existsSync(file)){const prior=JSON.parse(fs.readFileSync(file));if(prior.executionId===executionId&&prior.pid===process.pid)report=prior}fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify({...report,pid:process.pid,naturalCompletion:true,assertions,...caseRuntime.finishCases(report.terminal?report:undefined),graphics:renderer.graphicsSnapshot()}));}catch{}
});
module.exports={recordFailure,terminalFailure};
function recordNodeCases(nodeTests,nodeCaseIssues){const executionId=process.env.MOODY_EXECUTION_ID,base=process.env.MOODY_PROCESS_RECEIPT;if(!base||!executionId)return;const file=base+'.'+process.pid+'.json';try{let report={schema:1,executionId,pid:process.pid};if(fs.existsSync(file))report=JSON.parse(fs.readFileSync(file));fs.writeFileSync(file,JSON.stringify({...report,nodeTests,nodeCaseIssues}));}catch{}}
module.exports.recordNodeCases=recordNodeCases;
