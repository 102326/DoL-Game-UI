// Local, controlled transport experiment; never a workflow or a full-profile gate.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {candidate} from './candidate.mts';
import {verifyShadow} from './shadow.mts';
import {digestFile,evidenceDigest,type TransportAnchor} from './transport.mts';
import {sourceIdentity} from '../../scripts/ci/source.ts';
import {researchSummary} from '../../scripts/ci/research-summary.ts';
import type {Context} from '../../scripts/ci/upload.ts';

const original=path.resolve(fileURLToPath(new URL('../../',import.meta.url)));
const root=path.resolve(process.argv[2]||'');
assert(root.startsWith(path.join(original,'tests/artifacts/ui42/ci-shadow')+path.sep),'Only a separately owned shadow checkout is allowed');
assert.equal(fs.realpathSync(root),root,'Snapshot must not alias another checkout');
const object=(v:unknown):Record<string,unknown>=>{assert(v&&typeof v==='object'&&!Array.isArray(v));return v as Record<string,unknown>};
const json=(file:string,value:unknown)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');
const read=(file:string):unknown=>JSON.parse(fs.readFileSync(file,'utf8'));
const provenance=object(read(path.join(root,'../provenance.json')));
assert.equal(typeof provenance.base,'string');const base=provenance.base as string;
const saved=object(read(path.join(root,'tests/artifacts/consumer-shadow/shadow-result.json')));
const identity=object(object(saved.ctx).identity) as unknown as Context['identity'];
assert.match(identity.run.id,/^[a-zA-Z0-9_-]{1,100}$/);
const current=sourceIdentity(root);assert.equal(current.head,provenance.head);assert.deepEqual(current,identity.source);
const sourceDir=path.join(root,'tests/artifacts/ci',identity.run.id);
const ctx:Context={root,dir:sourceDir,identity};const plan=candidate(root,base);
assert.deepEqual(plan,saved.plan);assert.deepEqual(verifyShadow(ctx,base,plan,saved.report),[],'Actual consumer execution must pass before transport');
const full=researchSummary(ctx);assert.notEqual(full.status,'PASS','A selected subset must still fail the existing full-profile gate');

const out=path.join(root,'tests/artifacts/transport-shadow-'+Date.now());fs.mkdirSync(out);
const bundle=path.join(out,'received');fs.mkdirSync(bundle);
json(path.join(bundle,'plan.json'),plan);json(path.join(bundle,'report.json'),saved.report);
fs.cpSync(sourceDir,path.join(bundle,'evidence'),{recursive:true,errorOnExist:true,force:false});
// This controller has just verified the source-bound local execution. Its anchor is kept
// outside the received package. No claim of platform authentication or remote transport.
const anchor:TransportAnchor={base,identity:structuredClone(identity),planSha256:digestFile(path.join(bundle,'plan.json'),1024*1024),reportSha256:digestFile(path.join(bundle,'report.json'),16*1024*1024),evidenceSha256:evidenceDigest(path.join(bundle,'evidence'))};
const anchorPath=path.join(out,'controller-anchor.json');json(anchorPath,anchor);
const variants=['positive','missing-plan','malformed-json','self-asserted-anchor','changed-plan-with-fixed-anchor','wrong-base','wrong-head','wrong-attempt','wrong-run','joint-plan-result-deletion','wrong-report-identity','cancelled-report','duplicate-result','missing-evidence','changed-evidence','source-drift','policy-drift','restored-positive'] as const;
json(path.join(out,'frozen-variants.json'),{scope:'Actual selected execution, local copied bytes and fresh receiver processes; not all S1-S8/N1-N6 full-profile scenarios',variants,origin:provenance.origin,base,head:current.head,fullProfileStatus:full.status,driverSha256:digestFile(fileURLToPath(import.meta.url),1024*1024)});
const results:Array<{id:string;status:string;problems:string[];exitCode:number|null}>=[];
const receiver=`import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const [module,root,bundle,anchorFile]=process.argv.slice(1);
try { const b=fs.realpathSync(bundle),a=fs.realpathSync(anchorFile);if(a===b||a.startsWith(b+path.sep))throw Error('AnchorInsideReceivedBundle');
 const {verifyTransport}=await import(pathToFileURL(module).href);const result=verifyTransport(root,bundle,JSON.parse(fs.readFileSync(a,'utf8')));console.log(JSON.stringify(result));process.exitCode=result.status==='PASS'?0:2;
}catch(error){console.log(JSON.stringify({status:'UNVERIFIED',problems:[String(error)]}));process.exitCode=2;}`;
function receive(id:string,pass:boolean,expectedReason?:RegExp,expected:TransportAnchor=anchor,anchorFile=anchorPath){
 json(anchorFile,expected);
 const r=spawnSync(process.execPath,['--input-type=module','-e',receiver,path.join(root,'prototypes/evolution42-ci-c1/transport.mts'),root,bundle,anchorFile],{cwd:root,encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});
 fs.writeFileSync(path.join(out,id+'.stderr.log'),r.stderr||'');assert.ifError(r.error);assert.equal(r.signal,null);
 const v=object(JSON.parse(r.stdout));assert.equal(v.status,pass?'PASS':'UNVERIFIED',id);assert.equal(r.status,pass?0:2,id);assert(Array.isArray(v.problems)&&v.problems.every(p=>typeof p==='string'));
 const problems=v.problems as string[];if(expectedReason)assert(problems.some(p=>expectedReason.test(p)),id+': '+problems.join(','));
 results.push({id,status:v.status as string,problems,exitCode:r.status});json(path.join(out,'results.json'),{status:'RUNNING',results});console.log(id,v.status,problems.join(','));
}
function mutateFile(file:string,mutate:(bytes:Buffer)=>Buffer|string,body:()=>void){const before=fs.readFileSync(file);try{fs.writeFileSync(file,mutate(before));body()}finally{fs.writeFileSync(file,before)}}
function reportVariant(id:string,mutate:(r:Record<string,unknown>)=>void,reason:RegExp){const f=path.join(bundle,'report.json');mutateFile(f,bytes=>{const r=object(JSON.parse(bytes.toString('utf8')));mutate(r);return JSON.stringify(r)},()=>receive(id,false,reason,{...anchor,reportSha256:digestFile(f,16*1024*1024)}))}
try{
 receive('positive',true);
 const p=path.join(bundle,'plan.json'),bytes=fs.readFileSync(p);fs.unlinkSync(p);try{receive('missing-plan',false)}finally{fs.writeFileSync(p,bytes)}
 mutateFile(p,()=>'{invalid',()=>receive('malformed-json',false,undefined,{...anchor,planSha256:digestFile(p,1024*1024)}));
 receive('self-asserted-anchor',false,/AnchorInsideReceivedBundle/,anchor,path.join(bundle,'attacker-anchor.json'));fs.unlinkSync(path.join(bundle,'attacker-anchor.json'));
 mutateFile(p,b=>b.toString('utf8')+' ',()=>receive('changed-plan-with-fixed-anchor',false,/PlanDigest/));
 receive('wrong-base',false,/Plan/,{...anchor,base:current.head});
 receive('wrong-head',false,/Source/,{...anchor,identity:{...anchor.identity,source:{...anchor.identity.source,head:'0'.repeat(40)}}});
 receive('wrong-attempt',false,/SourceOrRunMismatch/,{...anchor,identity:{...anchor.identity,run:{...anchor.identity.run,attempt:'other-attempt'}}});
 receive('wrong-run',false,/SourceOrRunMismatch/,{...anchor,identity:{...anchor.identity,run:{...anchor.identity.run,id:'other-run'}}});
 const reportFile=path.join(bundle,'report.json'),reportBytes=fs.readFileSync(reportFile);
 mutateFile(p,b=>{const v=object(JSON.parse(b.toString('utf8')));assert(Array.isArray(v.research));v.research=v.research.filter(id=>id!=='research.evolution-owner-resources');return JSON.stringify(v)},()=>{
  try{const v=object(saved.report),r=structuredClone(v);assert(Array.isArray(r.results)&&Array.isArray(r.expected));r.results=r.results.filter(v=>object(v).name!=='evolution-owner-resources');r.expected=r.expected.filter(v=>v!=='evolution-owner-resources');json(reportFile,r);
   receive('joint-plan-result-deletion',false,/Plan/,{...anchor,planSha256:digestFile(p,1024*1024),reportSha256:digestFile(reportFile,16*1024*1024)});
  }finally{fs.writeFileSync(reportFile,reportBytes)}
 });
 reportVariant('wrong-report-identity',r=>{const i=object(r.identity);i.run={...object(i.run),attempt:'wrong'}},/SourceOrRunMismatch/);
 reportVariant('cancelled-report',r=>{r.status='CANCELLED'},/ReportEnvelopeMismatch/);
 reportVariant('duplicate-result',r=>{assert(Array.isArray(r.results));r.results.push(structuredClone(r.results[0]))},/ResultSetMismatch/);
 const f=path.join(bundle,'evidence/identity.json'),before=fs.readFileSync(f);fs.unlinkSync(f);try{receive('missing-evidence',false,/EvidenceDigest/)}finally{fs.writeFileSync(f,before)}
 mutateFile(f,b=>b.toString('utf8')+' ',()=>receive('changed-evidence',false,/EvidenceDigest/));
 mutateFile(path.join(root,'src/theme/acrylic.ts'),b=>b.toString('utf8')+'\n// transport negative source drift\n',()=>receive('source-drift',false,/Source|Plan/));
 mutateFile(path.join(root,'prototypes/evolution42-ci-c1/consumer-map.mts'),b=>b.toString('utf8')+'\n// transport negative policy drift\n',()=>receive('policy-drift',false,/Source|Plan/));
 receive('restored-positive',true);assert.deepEqual(results.map(r=>r.id),variants);
 assert.deepEqual(sourceIdentity(root),current);assert.deepEqual(verifyShadow(ctx,base,plan,saved.report),[]);
 json(path.join(out,'results.json'),{status:'PASS',scope:'LOCAL_SELECTED_TRANSPORT_ONLY',results,fullProfileStatus:full.status,productionGateChanged:false});
 console.log('PASS selected transport drill; evidence:',out);
}catch(error){json(path.join(out,'results.json'),{status:'FAIL',results,error:String(error)});throw error}
