// Post-upload sidecar: it cannot be included in the artifact it describes.
import fs from 'node:fs';
import path from 'node:path';
import {transportVerdict,uploadSummary} from './transport.ts';
import {readJsonBounded} from './records.ts';

const run=process.env.MOODY_EVIDENCE_ID;
if(!run||!/^[-\w]{1,100}$/.test(run))throw Error('Missing upload run identity');
const dir=path.resolve('tests/artifacts/ci',run);
let summary:Omit<ReturnType<typeof uploadSummary>,'identity'>&{identity?:unknown}={status:'UNVERIFIED',assertionResult:'UNKNOWN',evidenceIntegrity:'INCOMPLETE',identity:undefined,reasonCodes:[],problems:[]};
try{
 const envelope=readJsonBounded(dir,'identity.json');
 if(!envelope||typeof envelope!=='object'||!('schema' in envelope)||envelope.schema!==1||!('identity' in envelope))throw Error('Missing upload identity');
 const identity=envelope.identity;
 if(!identity||typeof identity!=='object'||!('run' in identity)||!identity.run||typeof identity.run!=='object'||!('id' in identity.run)||identity.run.id!==run)throw Error('Mismatched upload run');
 if(fs.existsSync(path.join(dir,'summary.json')))summary=uploadSummary(readJsonBounded(dir,'summary.json'),identity);
 if(fs.existsSync(path.join(dir,'upload/delivery.json')))summary=uploadSummary(readJsonBounded(dir,'upload/delivery.json'),identity);
 else if(summary.status==='PASS')summary={...summary,status:'UNVERIFIED',evidenceIntegrity:'INCOMPLETE'};
}catch(error){summary={...summary,status:'ERROR',evidenceIntegrity:'INCOMPLETE',reasonCodes:[...summary.reasonCodes,'InvalidUploadEvidence'],problems:[...summary.problems,{file:'upload-result',reason:error instanceof Error?error.message:String(error)}]}}
const result={schema:1,...transportVerdict(summary,{upload:process.env.MOODY_UPLOAD_OUTCOME||'missing'}),uploadOutcome:process.env.MOODY_UPLOAD_OUTCOME||'missing'};
fs.mkdirSync(path.resolve('tests/artifacts'),{recursive:true});fs.writeFileSync('tests/artifacts/evidence-upload.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));process.exitCode=result.status==='PASS'?0:1;
