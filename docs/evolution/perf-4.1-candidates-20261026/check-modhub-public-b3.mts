// Explicit public JSON snapshot only; no game storage or live network access.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import browserOptions from '../../../tests/browser-options.cjs';
import {bundles,digest} from './build-modhub-b3.mts';
const file=process.argv[2];assert.ok(file,'Pass a captured public release-index JSON explicitly');
const raw=readFileSync(file);assert.ok(raw.byteLength<2_000_000);const data:unknown=JSON.parse(raw.toString());
assert.ok(data&&typeof data==='object'&&'schemaVersion'in data&&data.schemaVersion===1&&'mods'in data&&Array.isArray(data.mods)&&data.mods.length>0);
const mods=data.mods as Array<Record<string,unknown>>,built=bundles(false,true),out=resolve('tests/artifacts/evolution/modhub-public-b3-'+Date.now());mkdirSync(out,{recursive:true});
type Engine={inferRequiredDependencies(mod:unknown,catalog?:unknown):unknown};
declare const OriginalInference:{createCandidate():Engine},CandidateInference:{createCandidate():Engine},TargetInference:{createCandidate():Engine};
const browser=await chromium.launch(browserOptions);let status='FAIL',failure:string|undefined,result:unknown;const errors:string[]=[];
try{
 const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));await p.setContent('<!doctype html><title>Public catalog replay</title>');for(const b of Object.values(built))await p.addScriptTag({content:b.code});
 result=await p.evaluate(mods=>{
  const factories={original:OriginalInference,b2:CandidateInference,union:TargetInference};type Key=keyof typeof factories;const keys=Object.keys(factories) as Key[];
  const before=JSON.stringify(mods),baseline=factories.original.createCandidate();const expected=mods.map(m=>JSON.stringify(baseline.inferRequiredDependencies(m,mods)));
  for(const key of keys){const engine=factories[key].createCandidate();mods.forEach((m,i)=>{if(JSON.stringify(engine.inferRequiredDependencies(m,mods))!==expected[i])throw Error('Public output mismatch '+key+'/'+i)});if(JSON.stringify(mods)!==before)throw Error('Public input changed')}
  const orders:Key[][]=[['original','b2','union'],['original','union','b2'],['b2','original','union'],['b2','union','original'],['union','original','b2'],['union','b2','original']];
  const records:Array<{phase:string;pair:number;order:Key[];ms:Record<Key,number>}>=[];
  for(const phase of ['first-batch','warm-batch'])for(let pair=-2;pair<12;pair++){
   const ms={original:0,b2:0,union:0},order=orders[(pair+2)%6]!;
   for(const key of order){const e=factories[key].createCandidate();if(phase==='warm-batch')for(let n=0;n<2;n++)for(const mod of mods)e.inferRequiredDependencies(mod,mods);const result:unknown[]=[],start=performance.now();for(const mod of mods)result.push(e.inferRequiredDependencies(mod,mods));ms[key]=performance.now()-start;if(result.some((v,i)=>JSON.stringify(v)!==expected[i]))throw Error('Timed output mismatch')}
   if(pair>=0)records.push({phase,pair,order,ms});
  }
  const median=(a:number[])=>{const b=[...a].sort((a,b)=>a-b);return(b[(b.length-1)>>1]!+b[b.length>>1]!)/2};
  return{mods:mods.length,descriptions:mods.filter(m=>m.description||m.desc).length,dependencyItems:expected.reduce((n,v)=>n+(JSON.parse(v) as unknown[]).length,0),records,summary:['first-batch','warm-batch'].map(phase=>{const r=records.filter(r=>r.phase===phase);return{phase,original:median(r.map(r=>r.ms.original)),b2:median(r.map(r=>r.ms.b2)),union:median(r.map(r=>r.ms.union)),unionDelta:median(r.map(r=>r.ms.union-r.ms.original)),unionSlower:r.filter(r=>r.ms.union>r.ms.original).length}})};
 },mods);assert.deepEqual(errors,[]);status='PASS';
}catch(e){failure=String(e);throw e}finally{
 writeFileSync(out+'/result.json',JSON.stringify({status,failure,environment:{node:process.version,platform:process.platform,chromium:browser.version()},sourceSha256:digest(readFileSync(new URL('check-modhub-public-b3.mts',import.meta.url))),publicSnapshot:{url:'https://dol.alseece.top/release-index.json',bytes:raw.length,sha256:digest(raw)},bundleSha256:Object.fromEntries(Object.entries(built).map(([k,v])=>[k,v.sha256])),result,errors,limits:'Unmodified public release-index snapshot; not actual normalized loaded game catalog. Raw descriptions remain local and are not included in this result. First batch=new factory/one whole catalog pass, warm=two whole catalog primes then one pass. Two triples discarded, twelve balanced triples retained per phase; no constructor proxy/trace; browser caches and host activity uncontrolled.'},null,2));console.log(out);await browser.close();
}
