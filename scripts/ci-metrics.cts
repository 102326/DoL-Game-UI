// Read saved GitHub run JSON; no token, external service, retries or release authority.
import fs = require('node:fs');
interface Timed {name?:string;conclusion?:string|null;startedAt?:string|null;completedAt?:string|null}
interface Job extends Timed {steps?:Timed[]|null}
interface Run {databaseId?:string|number;id?:string|number;attempt?:number;headSha?:string;head_sha?:string;event?:string;moodyMetadata?:Record<string,unknown>|null;jobs?:Job[]|null}

function measure(runs:readonly Run[]){const rows=[];for(const run of runs){for(const job of run.jobs||[]){const duration=(a?:string|null,b?:string|null)=>a&&b&&!b.startsWith('0001-')?Date.parse(b)-Date.parse(a):null;rows.push({run:run.databaseId||run.id,attempt:run.attempt||1,source:run.headSha||run.head_sha,event:run.event,profile:run.moodyMetadata?.profile||null,depth:run.moodyMetadata?.depth||null,catalog:run.moodyMetadata?.catalog||null,cache:run.moodyMetadata?.cache??null,job:job.name,status:job.conclusion,jobMs:duration(job.startedAt,job.completedAt),steps:(job.steps||[]).map(s=>({name:s.name,status:s.conclusion,milliseconds:duration(s.startedAt,s.completedAt)}))})}}
 const groups:Record<string,typeof rows>={};for(const r of rows){const group=groups[[r.job,r.profile,r.depth,r.catalog,r.cache].join('|')]||=[];group.push(r)}
 return{schema:1,rows,groups:Object.fromEntries(Object.entries(groups).map(([name,rows])=>{const values=rows.filter(r=>r.status==='success'&&Number.isFinite(r.jobMs)).map(r=>r.jobMs).filter((ms):ms is number=>ms!==null).sort((a,b)=>a-b);return[name,{samples:rows.length,successfulSamples:values.length,min:values[0]??null,max:values.at(-1)??null,p95:values.length>=20&&rows.every(r=>r.profile&&r.depth&&r.catalog&&r.cache!==null)?values[Math.ceil(values.length*.95)-1]:null,qualification:'No controlled cold/warm attribution from job names alone; combine metrics.json cache/depth/catalog identity. Failed/cancelled/rerun observations remain separate.'}]}))};}
function record(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value);}
function timed(value:unknown):value is Timed{return record(value)&&(value.name===undefined||typeof value.name==='string')&&['conclusion','startedAt','completedAt'].every(key=>value[key]==null||typeof value[key]==='string');}
function job(value:unknown):value is Job{return timed(value)&&(!('steps' in value)||value.steps==null||Array.isArray(value.steps)&&value.steps.every(timed));}
function parseRun(value:unknown):Run{
 if(!record(value)||!['databaseId','id'].every(key=>value[key]===undefined||typeof value[key]==='string'||typeof value[key]==='number')||!['headSha','head_sha','event'].every(key=>value[key]===undefined||typeof value[key]==='string')||(value.attempt!==undefined&&(typeof value.attempt!=='number'||!Number.isSafeInteger(value.attempt)))||(value.moodyMetadata!=null&&!record(value.moodyMetadata))||(value.jobs!=null&&(!Array.isArray(value.jobs)||!value.jobs.every(job))))throw Error('Invalid saved run metrics');
 return value;
}
if(require.main===module)console.log(JSON.stringify(measure(process.argv.slice(2).map(f=>parseRun(JSON.parse(fs.readFileSync(f,'utf8'))))),null,2));
export = {measure,parseRun};
