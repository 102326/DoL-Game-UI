import fs from 'node:fs';
import path from 'node:path';

interface Context {dir:string;identity:unknown}
interface Result {name:string;status:string;rawStatus?:string;milliseconds?:number|null;[key:string]:unknown}
interface Report {suite:string;results:Result[];kind?:string}
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
function result(value:unknown):value is Result{return record(value)&&typeof value.name==='string'&&typeof value.status==='string'&&(value.rawStatus===undefined||typeof value.rawStatus==='string')&&(value.milliseconds==null||typeof value.milliseconds==='number'&&Number.isFinite(value.milliseconds)&&value.milliseconds>=0);}
export function writeJson(file:string,value:unknown):void{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(value,null,2)+'\n');fs.renameSync(file+'.tmp',file);}
export function writeSuite(ctx:Context,report:Report):void{
 const results=report.results.map(result=>{
  if(!/^[\w.-]+$/.test(result.name))throw Error('Unsafe result name');
  const resultFile=`checks/${report.suite}/${result.name}.json`;
  writeJson(path.join(ctx.dir,resultFile),{schema:1,identity:ctx.identity,suite:report.suite,result});
  return {name:result.name,status:result.status,rawStatus:result.rawStatus,milliseconds:result.milliseconds,resultFile};
 });
 writeJson(path.join(ctx.dir,report.suite+'.json'),{...report,kind:'suite-index',results});
}
export function hydrateSuite(ctx:Context,report:Report):Report{
 if(report.kind!=='suite-index')return report;
 return {...report,results:report.results.map(ref=>{
  const relative=`checks/${report.suite}/${ref.name}.json`;if(ref.resultFile!==relative||!/^[\w.-]+$/.test(ref.name)||Object.keys(ref).some(key=>!['name','status','rawStatus','milliseconds','resultFile'].includes(key)))throw Error('Result index path/schema mismatch');
  const file=path.join(ctx.dir,relative),stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>262144)throw Error('Unsafe/oversized result shard');
  const data:unknown=JSON.parse(fs.readFileSync(file,'utf8'));
  if(!record(data)||data.schema!==1||JSON.stringify(data.identity)!==JSON.stringify(ctx.identity)||data.suite!==report.suite||!result(data.result)||data.result.name!==ref.name||data.result.status!==ref.status||data.result.rawStatus!==ref.rawStatus)throw Error('Stale/contradictory result shard');
  return data.result;
 })};
}

interface EvidenceMeta {required:boolean;role:'T0'|'T1'|'T2';schema:'moody-envelope/v1'|'research-raw/v1'|'historical-json'|'binary';provenance:'historical-comparison'|'current-run'}
export function safeFile(base:string,file:unknown):string {
 if(typeof file!=='string'||!file||file.includes('\\')||path.isAbsolute(file)||file.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Unsafe evidence path');
 let target=base;
 for(const part of ['',...file.split('/')]){target=path.join(target,part);if(fs.lstatSync(target).isSymbolicLink())throw Error('Evidence symlink');}
 if(!fs.lstatSync(target).isFile()||!fs.realpathSync(target).startsWith(fs.realpathSync(base)+path.sep))throw Error('Unsafe evidence file');
 return target;
}
export function readJsonBounded(base:string,file:unknown,limit=262144):unknown{const target=safeFile(base,file);if(fs.statSync(target).size>limit)throw Error('Evidence size limit');return JSON.parse(fs.readFileSync(target,'utf8'));}
export function captureMeta(base:string,file:string,identity:{environment?:unknown;source:{head:string};run:{id:string}}){if(!file.startsWith('review/')||!file.endsWith('.png'))return null;const bytes=fs.readFileSync(path.join(base,file)),valid=bytes.length>=24&&bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a';return {format:'PNG' as const,width:valid?bytes.readUInt32BE(16):null,height:valid?bytes.readUInt32BE(20):null,scale:'image-pixels' as const,environment:identity.environment||null,source:identity.source.head,run:identity.run.id}}
export function evidenceMeta(file:string,required:readonly string[],identityFiles:readonly string[]):EvidenceMeta {return {required:required.includes(file),role:file.startsWith('review/')||file.startsWith('builds/')||file.startsWith('build-metadata/')?'T1':required.includes(file)?'T0':'T2',schema:file.endsWith('.json')?(identityFiles.includes(file)?'moody-envelope/v1':required.includes(file)?'research-raw/v1':'historical-json'):'binary',provenance:file.startsWith('builds/')||file.startsWith('build-metadata/')?'historical-comparison':'current-run'};}

export const fixtureChecks:readonly string[]=['settings-ci.cjs','combat-focused.cjs','moody-historical-regressions.cjs','device-layouts.cjs'];
