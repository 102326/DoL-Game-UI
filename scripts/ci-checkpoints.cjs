const fs=require('node:fs'),path=require('node:path');
const {checkpoints}=require('./ci-catalog.cjs');
function checkpoint(id){
 const entry=process.env.MOODY_CHECK_NAME;if(!checkpoints[entry])return;
 const root=path.resolve(__dirname,'..'),run=process.env.MOODY_EVIDENCE_ID;
 if(!/^[\w-]{1,100}$/.test(run||''))throw Error('Checkpoint run context missing');
 const dir=path.join(root,'tests/artifacts/ci',run),file=path.join(dir,'fixtures',entry,'checkpoints.json');
 if(path.resolve(process.env.MOODY_EVIDENCE_DIR||'')!==path.dirname(file))throw Error('Checkpoint directory mismatch');
 const identity=JSON.parse(fs.readFileSync(path.join(dir,'identity.json'))).identity;
 const report=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{schema:1,identity,entry,reached:[]};
 if(JSON.stringify(report.identity)!==JSON.stringify(identity))throw Error('Stale checkpoints');
 report.reached.push(id);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
}
module.exports={checkpoint};
