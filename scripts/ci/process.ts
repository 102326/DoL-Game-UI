import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {classify} from './contracts.ts';
import type {Status} from './contracts.ts';
import {entryDeclaration} from './lock.ts';

const require=createRequire(import.meta.url),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const {nodeTestCases,nodeCaseIds}:typeof import('../ci-catalog.cjs')=require('../ci-catalog.cjs');
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
interface Options {cwd?:string;log:string;timeoutMs?:number;signal?:AbortSignal;env?:NodeJS.ProcessEnv;quiet?:boolean;requireAssertions?:boolean;execution?:'tool'|'contract'}
interface ProcessResult {
 status:Status;execution:'tool'|'contract';executionId:string;pid:number|undefined;contradictions:string[];
 nodeTests:unknown;nodeCaseIssues:unknown;assertions:unknown;terminalReceipt:Record<string,unknown>|null;
 assertionResult:'PASS'|'FAIL'|'UNKNOWN';reasonCode:string;rawStatus:string;exitCode:number|null;signal:NodeJS.Signals|null;
 error:string|null;milliseconds:number;outputBytes:number;outputSha256:string;logTruncated:boolean;
}
export function runCommand(command:string, args:readonly string[], { cwd = root, log, timeoutMs = 120000, signal, env = process.env, quiet = false, requireAssertions=false, execution='contract' }:Options):Promise<ProcessResult> {
  return new Promise(resolve => {
    const start = Date.now(), outputHash = crypto.createHash('sha256');
    let tail:Buffer = Buffer.alloc(0), bytes = 0, error:string|undefined, timedOut = false, cancelled = false, forceKill:NodeJS.Timeout|undefined;
    const executionId = crypto.randomBytes(16).toString('hex'), receiptFile=log+'.assertion.json';
    fs.rmSync(receiptFile,{force:true});
    const childEnv:NodeJS.ProcessEnv={...env,MOODY_CASE_PLAN:'[]',MOODY_CASE_GRANULARITY:'',MOODY_CASE_ENTRY:'',MOODY_PROCESS_RECEIPT:receiptFile,MOODY_EXECUTION_ID:executionId,NODE_OPTIONS:[env.NODE_OPTIONS,`--require=${path.join(root,'scripts/ci-process-receipt.cjs')}`].filter(Boolean).join(' ')};
    const caseEntry=execution==='contract'?args.find(a=>/\.[cm]?js$/.test(a)&&entryDeclaration(path.basename(a))):null;
    if(caseEntry){const declaration=entryDeclaration(path.basename(caseEntry));if(declaration&&declaration.granularity!=='native'){childEnv.MOODY_CASE_PLAN=JSON.stringify(declaration.cases);childEnv.MOODY_CASE_GRANULARITY=declaration.granularity;childEnv.MOODY_CASE_ENTRY=path.resolve(cwd,caseEntry);}}
    let nativeSource=false;if(command===process.execPath&&!args.includes('--test')){const source=args[0]==='-e'?args[1]:args.find(a=>/\.(cjs|mjs|js)$/.test(a)&&fs.existsSync(a));if(source){const policy:typeof import('../ci-source-policy.cjs')=require('../ci-source-policy.cjs');nativeSource=policy.usesNodeTest(args[0]==='-e'?source:fs.readFileSync(source,'utf8'));}}
    if(nativeSource&&args[0]==='-e'){const inline=path.join(path.dirname(log),'inline-'+executionId+'.test.cjs');fs.mkdirSync(path.dirname(inline),{recursive:true});if(args[1]===undefined)throw Error('Missing inline test source');fs.writeFileSync(inline,args[1]);args=['--test',inline];}
    const nativeFiles=args.filter(a=>nodeTestCases[path.basename(a)]),expectedNodeIds=nodeCaseIds(args);childEnv.MOODY_EXPECTED_NODE_CASES=JSON.stringify(expectedNodeIds);if(command===process.execPath&&(nativeFiles.length||nativeSource)&&!args.includes('--test'))args=['--test',...args];
    if (command===process.execPath&&args.includes('--test')) args=[`--test-reporter=${pathToFileURL(path.join(root,'scripts/ci-test-reporter.cjs')).href}`,...args];
    const child = spawn(command, args, { cwd, env:childEnv, stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32', shell: process.platform === 'win32' && ['npm', 'npx'].includes(command) });
    const stop = () => {
      try { process.platform === 'win32' ? child.kill('SIGTERM') : child.pid!==undefined&&process.kill(-child.pid, 'SIGTERM'); } catch {}
      forceKill = setTimeout(() => { try { process.platform === 'win32' ? child.kill('SIGKILL') : child.pid!==undefined&&process.kill(-child.pid, 'SIGKILL'); } catch {} }, 1000);
      forceKill.unref();
    };
    const abort = () => { cancelled = true; stop(); };
    const timer = setTimeout(() => { timedOut = true; stop(); }, timeoutMs);
    const collect = (chunk:Buffer, stream:NodeJS.WriteStream) => {
      bytes += chunk.length; outputHash.update(chunk);
      tail = Buffer.concat([tail, chunk]);
      if (tail.length > 65536) tail = tail.subarray(tail.length - 65536);
      if (!quiet) stream.write(chunk);
    };
    child.stdout.on('data', chunk => collect(chunk, process.stdout));
    child.stderr.on('data', chunk => collect(chunk, process.stderr));
    child.on('error', e => { error = 'code' in e&&typeof e.code==='string'?e.code:e.message; });
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    child.on('close', (code, childSignal) => {
      clearTimeout(timer); clearTimeout(forceKill); signal?.removeEventListener('abort', abort);
      fs.mkdirSync(path.dirname(log), { recursive: true });
      fs.writeFileSync(log, tail);
      let assertionFailed=false,terminalFailed=false,naturalCompletion=false;let terminalReceipt:Record<string,unknown>|null=null;const ownReceipt=receiptFile+'.'+child.pid+'.json';
      try {const st=fs.lstatSync(ownReceipt);if(st.isFile()&&!st.isSymbolicLink()&&st.size<=65536){const parsed:unknown=JSON.parse(fs.readFileSync(ownReceipt,'utf8'));if(!record(parsed))throw Error('Invalid process receipt');const receipt=parsed;terminalReceipt=receipt;terminalFailed=receipt.schema===1&&receipt.executionId===executionId&&receipt.pid===child.pid&&receipt.terminal===true;naturalCompletion=receipt.executionId===executionId&&receipt.pid===child.pid&&receipt.naturalCompletion===true;assertionFailed=receipt.schema===1&&receipt.executionId===executionId&&receipt.pid===child.pid&&receipt.terminal===true&&receipt.kind==='assertion'&&receipt.code==='ERR_ASSERTION'&&receipt.name==='AssertionError';}} catch {}
      const classified=classify({code,error:error||childSignal,timedOut,cancelled,assertionFailed:execution==='contract'&&assertionFailed,terminalFailed}),status=classified==='PASS'&&command===process.execPath&&((execution==='contract'&&!naturalCompletion)||(requireAssertions&&!(typeof terminalReceipt?.assertions==='number'&&Number.isSafeInteger(terminalReceipt.assertions)&&terminalReceipt.assertions>0||Array.isArray(terminalReceipt?.nodeTests)&&terminalReceipt.nodeTests.length>0)))?'UNVERIFIED':classified==='ERROR'&&!terminalFailed&&Array.isArray(terminalReceipt?.nodeCaseIssues)&&terminalReceipt.nodeCaseIssues.length?'UNVERIFIED':classified;
      resolve({status,execution,executionId,pid:child.pid,contradictions:terminalFailed&&code===0?['TerminalFailureWithExitZero']:[],nodeTests:terminalReceipt?.nodeTests,nodeCaseIssues:terminalReceipt?.nodeCaseIssues,assertions:terminalReceipt?.assertions??0,terminalReceipt,assertionResult:status==='PASS'?'PASS':status==='FAIL'?'FAIL':'UNKNOWN',reasonCode:cancelled?'RunCancelled':timedOut?'ProcessTimeout':error?'SpawnError':childSignal?'ProcessSignal':status==='FAIL'?'AssertionFailed':terminalFailed?'TerminalFailure':code===0?(status==='PASS'?'ExitZero':naturalCompletion?'NoAssertions':'EarlyExitWithoutCompletion'):'ProcessExitError',
        rawStatus: cancelled ? 'cancelled' : timedOut ? 'timeout' : error ? 'spawn-error' : childSignal ? 'signal' : code === 0 ? 'passed' : 'failed',
        exitCode: code, signal: childSignal, error: error || null, milliseconds: Date.now() - start,
        outputBytes: bytes, outputSha256: outputHash.digest('hex'), logTruncated: bytes > tail.length });
    });
  });
}
