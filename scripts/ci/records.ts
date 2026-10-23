import fs from 'node:fs';
import path from 'node:path';

interface Context {dir:string;identity:unknown}
interface Result {name:string;status:string;rawStatus?:string;milliseconds?:number|null;[key:string]:unknown}
interface Report {suite:string;results:Result[];kind?:string}
function write(file:string,value:unknown):void{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(value,null,2)+'\n');fs.renameSync(file+'.tmp',file);}
export function writeSuite(ctx:Context,report:Report):void{
 const results=report.results.map(result=>{
  if(!/^[\w.-]+$/.test(result.name))throw Error('Unsafe result name');
  const resultFile=`checks/${report.suite}/${result.name}.json`;
  write(path.join(ctx.dir,resultFile),{schema:1,identity:ctx.identity,suite:report.suite,result});
  return {name:result.name,status:result.status,rawStatus:result.rawStatus,milliseconds:result.milliseconds,resultFile};
 });
 write(path.join(ctx.dir,report.suite+'.json'),{...report,kind:'suite-index',results});
}
export function hydrateSuite(ctx:Context,report:Report):Report{
 if(report.kind!=='suite-index')return report;
 return {...report,results:report.results.map(ref=>{
  const relative=`checks/${report.suite}/${ref.name}.json`;if(ref.resultFile!==relative||!/^[\w.-]+$/.test(ref.name)||Object.keys(ref).some(key=>!['name','status','rawStatus','milliseconds','resultFile'].includes(key)))throw Error('Result index path/schema mismatch');
  const file=path.join(ctx.dir,relative),stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>262144)throw Error('Unsafe/oversized result shard');
  const data=JSON.parse(fs.readFileSync(file,'utf8')) as {schema:number;identity:unknown;suite:string;result:Result};
  if(data.schema!==1||JSON.stringify(data.identity)!==JSON.stringify(ctx.identity)||data.suite!==report.suite||data.result.name!==ref.name||data.result.status!==ref.status||data.result.rawStatus!==ref.rawStatus)throw Error('Stale/contradictory result shard');
  return data.result;
 })};
}
