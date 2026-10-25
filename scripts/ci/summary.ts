import {readReport} from './records.ts';
import {overall,verdict,sameIdentity} from './contracts.ts';
import type {Status} from './contracts.ts';
import {resultStatus,verifiedPass} from './result-status.ts';
import {suiteEvidence,layoutEvidence,coverage} from './suite-evidence.ts';
import {packageEvidence} from './package-evidence.ts';
import {createRequire} from 'node:module';
import type {Context} from './upload.ts';
const require=createRequire(import.meta.url);
const {stages,catalogFor,catalogIdentity}:typeof import('../ci-catalog.cjs')=require('../ci-catalog.cjs');
interface Result {name:string;status:Status;scope?:string;rawStatus?:unknown;reason?:string;reasonCode?:string;evidenceIntegrity?:string;[key:string]:unknown}
export type Steps=Readonly<Record<string,{outcome?:unknown}|undefined>>;
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function parseSteps(value:unknown):Steps{
 if(!record(value))throw Error('Invalid workflow steps');const result:Record<string,{outcome?:unknown}|undefined>={};
 for(const [key,step] of Object.entries(value)){if(step==null){result[key]=undefined;continue}if(!record(step))throw Error('Invalid workflow step '+key);result[key]={outcome:step.outcome};}return result;
}
export function summarize(ctx:Context, steps:Steps = {}) {
  const results:Result[] = [];
  for (const [name, scope] of [['checkout', 'Source checkout'], ['node', 'Node environment'], ['python', 'Python environment']] as const) {
    const raw = steps[name]?.outcome;
    results.push({ name, scope, status: raw === 'success' ? 'PASS' : raw === 'failure' ? 'ERROR' : raw === 'cancelled' ? 'CANCELLED' : raw === 'skipped' ? 'UNVERIFIED' : 'UNVERIFIED',
      rawStatus: raw || 'unknown', reason: raw ? 'GitHub action outcome; not a test result' : 'No action outcome supplied (local or unavailable)' });
  }
  for (const stage of stages) {
    const result = readReport(ctx, `stage-${stage.id}.json`), raw = steps[stage.id]?.outcome;
    const entry:Result = { name: stage.id, scope: stage.scope, status:'UNVERIFIED',reasonCode:'MissingInvalidOrStaleResult',rawStatus:raw||'missing-result', reason: 'Missing, invalid or stale result; cannot verify' };
    if (raw === 'skipped') Object.assign(entry, { status: 'UNVERIFIED', reasonCode:'UnexpectedSkip',reason:'Workflow skipped this required stage' });
    else if (raw === 'cancelled') Object.assign(entry, { status: 'CANCELLED', reason: 'Workflow cancelled this required stage' });
    else if (result?.name === stage.id) {
      Object.assign(entry,Object.fromEntries(['name','status','rawStatus','exitCode','signal','milliseconds','reasonCode','assertionResult','log'].filter(k=>Object.hasOwn(result,k)).map(k=>[k,result[k]])),{scope:stage.scope,status:overall([resultStatus(result,'tool')])});
      entry.reason = result.status === 'PASS' ? 'Command completed with exit 0' : `Command outcome: ${result.rawStatus}; see bounded log`;
      if (entry.status === 'PASS' && !verifiedPass(result,'tool')) Object.assign(entry, { status: 'UNVERIFIED', reason: 'Incomplete success record' });
      if (raw === 'failure' && entry.status === 'PASS') Object.assign(entry, { status: 'ERROR', reason: 'Workflow outcome contradicts success record' });
    }
    if (['unit', 'browser'].includes(stage.id)) {
      const suite = readReport(ctx, stage.id + '.json');
      if(Array.isArray(suite?.results)&&suite.results.length)entry.status=overall([entry.status,...suite.results.map((r:unknown)=>resultStatus(r,'contract'))]);
      if (!suiteEvidence(ctx,stage.id)) {
        Object.assign(entry,{status:entry.status==='FAIL'?'FAIL':entry.status==='ERROR'?'ERROR':entry.status==='CANCELLED'?'CANCELLED':'UNVERIFIED',evidenceIntegrity:'INCOMPLETE',reason:'Required per-check evidence missing, incomplete or not passing'});
      }
      if (stage.id === 'browser' && entry.status === 'PASS' && !layoutEvidence(ctx)) {
        Object.assign(entry, { status: 'UNVERIFIED', reason: 'Device layout coverage report missing, stale, incomplete or not passing' });
      }
    }
    if(stage.id==='packages'){const p=readReport(ctx,'package-contracts.json');if(p?.status==='FAIL'&&p.assertionResult==='FAIL'&&record(p.failure)&&p.failure.type==='AssertionError')Object.assign(entry,{status:'FAIL',assertionResult:'FAIL',evidenceIntegrity:'INCOMPLETE',reasonCode:'PackageAssertionFailed'});}
    if (stage.id === 'packages' && entry.status === 'PASS' && !packageEvidence(ctx)) {
      Object.assign(entry, { status: 'UNVERIFIED', reason: 'Nine-package/version/negative/repeated-build evidence missing, stale or incomplete' });
    }
    results.push(entry);
  }
  if (steps['build-artifacts']) {
    const raw = steps['build-artifacts']?.outcome;
    results.push({ name: 'build-artifacts', scope: 'Development ZIP artifact upload (not a Release)', rawStatus: raw,
      status: raw === 'success' ? 'PASS' : raw === 'failure' ? 'ERROR' : raw === 'cancelled' ? 'CANCELLED' : raw === 'skipped' ? 'UNVERIFIED' : 'UNVERIFIED' });
  }
  const catalog=readReport(ctx,'catalog.json');
  if(!catalog||!sameIdentity(catalog.catalog,catalogFor(ctx.identity.profile||'standard',ctx.identity.environment?.deviceDepth||'standard'))||!sameIdentity(ctx.identity.catalog,catalogIdentity(ctx.identity.profile||'standard',ctx.identity.environment?.deviceDepth||'standard')))results.push({name:'catalog',status:'UNVERIFIED',reasonCode:'CatalogMismatch'});
  const status=overall(results.map(r=>r.status));
  return { schema: 1, identity: ctx.identity, ...verdict(results.some(r=>r.status==='FAIL')?'FAIL':status==='PASS'?'PASS':'UNKNOWN',results.filter(r=>r.status==='UNVERIFIED'||r.evidenceIntegrity==='INCOMPLETE').map(r=>r.name),status), coverage, results,
    limitations: ['Hard runner termination can prevent final summary/upload; never infer PASS from absent artifacts.', 'Evidence upload happens after this summary; its final outcome is recorded by the GitHub job.', 'Windows and Android require their own environment-specific evidence.'] };
}

