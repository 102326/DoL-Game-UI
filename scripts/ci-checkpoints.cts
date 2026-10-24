import fs = require('node:fs');
import path = require('node:path');
import catalog = require('./ci-catalog.cjs');
import cases = require('./ci-cases.cjs');
const {checkpoints}=catalog;
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
function checkpoint(id:string){
 cases.caseCheckpoint(id);
 const entry=process.env.MOODY_CHECK_NAME;if(!entry||!checkpoints[entry])return;
 const root=path.resolve(__dirname,'..'),run=process.env.MOODY_EVIDENCE_ID;
 if(!run||!/^[\w-]{1,100}$/.test(run))throw Error('Checkpoint run context missing');
 const dir=path.join(root,'tests/artifacts/ci',run),file=path.join(dir,'fixtures',entry,'checkpoints.json');
 if(path.resolve(process.env.MOODY_EVIDENCE_DIR||'')!==path.dirname(file))throw Error('Checkpoint directory mismatch');
 const envelope:unknown=JSON.parse(fs.readFileSync(path.join(dir,'identity.json'),'utf8'));
 if(!record(envelope)||!('identity' in envelope))throw Error('Checkpoint identity missing');
 const identity=envelope.identity;
 const value:unknown=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{schema:1,identity,entry,reached:[]};
 if(!record(value)||value.schema!==1||value.entry!==entry||!Array.isArray(value.reached)||!value.reached.every((item:unknown):item is string=>typeof item==='string'))throw Error('Invalid checkpoints');
 const report={...value,identity:value.identity,reached:value.reached};
 if(JSON.stringify(report.identity)!==JSON.stringify(identity))throw Error('Stale checkpoints');
 report.reached.push(id);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
}
export = {checkpoint};
