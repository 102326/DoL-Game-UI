const fs=require('node:fs'),path=require('node:path');
const {verifyRemote,sourceIdentity,writeJson}=require('./ci-evidence.cjs');
const profile=process.env.MOODY_PROFILE||'standard';
let event={};if(process.env.GITHUB_EVENT_PATH)event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH));
const expected={checkoutSHA:process.env.GITHUB_SHA,source:sourceIdentity(),profile,depth:process.env.MOODY_DEVICE_DEPTH||'standard',nonce:process.env.MOODY_EXPECTED_NONCE,manifestSha256:process.env.MOODY_MANIFEST_SHA256,
 run:{githubRunId:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,repository:process.env.GITHUB_REPOSITORY,ref:process.env.GITHUB_REF,workflow:process.env.GITHUB_WORKFLOW,event:process.env.GITHUB_EVENT_NAME,job:process.env.MOODY_PRODUCER_JOB},
 pr:event.pull_request?{head:event.pull_request.head.sha,base:event.pull_request.base.sha,merge:process.env.GITHUB_SHA}:null};
const result=require('./ci/transport.ts').transportVerdict(verifyRemote(path.resolve(process.argv[2]),expected),{upload:process.env.MOODY_UPLOAD_OUTCOME||'missing',download:process.env.MOODY_DOWNLOAD_OUTCOME||'missing',producer:process.env.MOODY_PRODUCER_RESULT||'missing'});
writeJson(path.resolve('tests/artifacts/remote-verification.json'),result);
const text=`### Moody Blues remote verification: ${result.status}\n\nAssertion: ${result.assertionResult}; evidence: ${result.evidenceIntegrity}; reasons: ${result.reasonCodes.join(', ')||'CompletePass'}.\n\n${JSON.stringify(result.problems)}\n`;
console.log(text);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,text);process.exitCode=result.status==='PASS'?0:1;
