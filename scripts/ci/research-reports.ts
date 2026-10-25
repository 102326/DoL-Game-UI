import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {sameIdentity,digest as hash} from './contracts.ts';
import {reportsFor,stamp} from './research-files.ts';
import type {Context} from './upload.ts';
const require=createRequire(import.meta.url);
const {commandCaseIds}:typeof import('../ci-catalog.cjs')=require('../ci-catalog.cjs');
type Check=typeof import('../ci-catalog.cjs').researchPlan[number];
type Spec=NonNullable<Check['report']>;
export type CaseId=string|number;
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
function field(value:unknown,route:string):unknown {for(const key of route.split('.')){if(value==null||typeof value!=='object')return undefined;value=Reflect.get(value,key)}return value}
function list(value:unknown):unknown[]{if(!Array.isArray(value))throw Error('Incomplete report list');return value}
const populated=(value:unknown)=>Array.isArray(value)||typeof value==='string'?!!value.length:record(value)&&!!value.length;
export function caseIds(spec:Spec,data:unknown,ctx:Pick<Context,'identity'>):CaseId[]{
 if(populated(field(data,'errors'))||field(data,'baseline')===true||field(data,'record')===true)throw Error('Report contains errors or an unexpected baseline/record mode');
 const head=field(data,'sourceHead'),identityHead=field(data,'identity.head');if(head&&head!==ctx.identity.source.head||identityHead&&identityHead!==ctx.identity.source.head)throw Error('Raw report source identity mismatch');
 if(spec.field==='checks'&&!Array.isArray(field(data,'errors')))throw Error('Incomplete named-check report structure');
 let ids:unknown;
 if(spec.shape==='inventory'){
  const consumers=field(data,'consumers');if(field(data,'schema')!==1||field(data,'sourceBase')!==ctx.identity.source.head||!Array.isArray(consumers)||!consumers.length)throw Error('Incomplete inventory/source identity');ids=['inventory'];
 }else if(spec.shape==='settings'){
  const frames=field(data,'queued.frames');if(field(data,'mounted.workspaces')!==1||!(typeof frames==='number'&&frames>0)||field(data,'disposed.frames')!==0||field(data,'disposed.workspaces')!==0||!sameIdentity(field(data,'disposed'),field(data,'late')))throw Error('Incomplete settings resources');ids=['settings-resources'];
 }else if(spec.shape==='glass'){
  const results=list(field(data,'results'));ids=results.map(r=>field(r,'scene')||field(r,'candidate'));const pixel=field(results[0],'displacementPixelCheck');if(!sameIdentity(ids,['material','glass'])||typeof pixel!=='string'||!pixel.startsWith('PASS:')||field(results[1],'lifecycleChecked')!==true)throw Error('Incomplete glass cases');
 }else if(spec.shape==='shower'){
  const states=field(data,'states'),events=field(data,'events'),transitions=field(data,'transitions');if(!Array.isArray(states)||states.length!==spec.count||states.some((s:unknown)=>!field(s,'target.kind'))||!Array.isArray(events)||spec.scatter&&(!Array.isArray(transitions)||transitions.length!==7))throw Error('Incomplete shower states/transitions');
  ids=states.map((s:unknown,i:number)=>`${i}:${field(s,'target.kind')}:${field(s,'target.rain')??''}`);const rain=spec.count===3?['light','severe']:['light','normal','heavy','severe'];if(!sameIdentity(states.slice(0,-1).map((s:unknown)=>field(s,'target.rain')),rain)||field(states.at(-1),'target.kind')!=='snow')throw Error('Unexpected shower case identity');
 }else{
  const values=spec.field?field(data,spec.field):data;if(!Array.isArray(values)||values.some((v:unknown)=>field(v,'status')&&field(v,'status')!=='PASS'))throw Error('Incomplete report cases');ids=spec.key?values.map((v:unknown)=>field(v,spec.key??'')):values;if(!sameIdentity(ids,spec.expected))throw Error('Required case plan mismatch');
 }
 if(!Array.isArray(ids)||!ids.every((id:unknown):id is CaseId=>typeof id==='string'||typeof id==='number')||!ids.length||new Set(ids).size!==ids.length)throw Error('Missing or duplicate case IDs');return ids;
}
export function recordReport(ctx:Context,check:Check,before:ReadonlyMap<string,string>){
 const spec=check.report;if(!spec)return {caseIds:commandCaseIds(check),artifacts:[]};
 if(spec.fixture){const relative='fixtures/moody-historical-regressions.cjs/snapshot.json',file=path.join(ctx.dir,relative),data:unknown=JSON.parse(fs.readFileSync(file,'utf8')),message=field(data,'assertion.message');if(!sameIdentity(field(data,'identity'),ctx.identity)||field(data,'assertion.code')!=='ERR_ASSERTION'||typeof message!=='string'||!message.startsWith('MOODY_ORBIT_NONFINITE:')||!field(data,'snapshot.expectedCounterexample'))throw Error('Historical target snapshot missing/stale/wrong failure');return {caseIds:['MOODY_ORBIT_NONFINITE'],artifacts:[{file:relative,sha256:hash(fs.readFileSync(file))}]};}
 const fresh=reportsFor(ctx,spec).filter(f=>before.get(f)!==stamp(f));if(fresh.length!==1||!fresh[0])throw Error(`Expected one fresh required report for ${check.id}; got ${fresh.length}`);const source=fresh[0],bytes=fs.readFileSync(source);if(bytes.length>2*1024*1024)throw Error('Required research report exceeds 2 MiB');const data:unknown=JSON.parse(bytes.toString('utf8')),ids=caseIds(spec,data,ctx),file=`research/${check.id}/result.json`;fs.mkdirSync(path.dirname(path.join(ctx.dir,file)),{recursive:true});fs.copyFileSync(source,path.join(ctx.dir,file));return {caseIds:ids,artifacts:[{file,sha256:hash(bytes),origin:path.relative(ctx.root,source)}]};
}
