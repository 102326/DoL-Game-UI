// Post-upload sidecar: it cannot be included in the artifact it describes.
import fs from 'node:fs';
import path from 'node:path';
import {transportVerdict} from './transport.ts';
import type {Status} from './contracts.ts';

const run=process.env.MOODY_EVIDENCE_ID;
if(!run||!/^[-\w]{1,100}$/.test(run))throw Error('Missing upload run identity');
const file=path.resolve('tests/artifacts/ci',run,'summary.json');
let summary:{status:Status;assertionResult:string;evidenceIntegrity:string;identity?:unknown}={status:'UNVERIFIED',assertionResult:'UNKNOWN',evidenceIntegrity:'INCOMPLETE'};
if(fs.existsSync(file))summary=JSON.parse(fs.readFileSync(file,'utf8'));
const deliveryFile=path.resolve('tests/artifacts/ci',run,'upload/delivery.json');
if(fs.existsSync(deliveryFile))summary=JSON.parse(fs.readFileSync(deliveryFile,'utf8'));
else if(summary.status==='PASS')summary={...summary,status:'UNVERIFIED',evidenceIntegrity:'INCOMPLETE'};
const result={schema:1,...transportVerdict(summary,{upload:process.env.MOODY_UPLOAD_OUTCOME||'missing'}),uploadOutcome:process.env.MOODY_UPLOAD_OUTCOME||'missing'};
fs.mkdirSync(path.resolve('tests/artifacts'),{recursive:true});fs.writeFileSync('tests/artifacts/evidence-upload.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));process.exitCode=result.status==='PASS'?0:1;
