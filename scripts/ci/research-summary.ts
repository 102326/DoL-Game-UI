import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {sameIdentity,overall,verdict,digest as hash} from './contracts.ts';
import type {Status} from './contracts.ts';
import {readReport} from './records.ts';
import {resultStatus,verifiedPass} from './result-status.ts';
import {suiteEvidence} from './suite-evidence.ts';
import {familyReports} from './research-families.ts';
import {entryDeclaration,entryCaseProblems} from './lock.ts';
import {caseIds,recordReport} from './research-reports.ts';
import type {Context} from './upload.ts';
import type {Steps} from './summary.ts';
const require=createRequire(import.meta.url);
const {researchPlan:plan,researchUnitEntries,nodeCaseIds,commandCaseIds,catalogFor,catalogIdentity}:typeof import('../ci-catalog.cjs')=require('../ci-catalog.cjs');
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const object=(v:unknown)=>{if(!record(v))throw Error('Invalid research record');return v};
type FamilyResult=Parameters<typeof familyReports>[2][number];
function familyResult(v:unknown):v is FamilyResult{return record(v)&&typeof v.name==='string'&&['PASS','FAIL','ERROR','UNVERIFIED','CANCELLED'].some(s=>s===v.status)&&(v.rawStatus===undefined||typeof v.rawStatus==='string')&&(v.caseIds===undefined||Array.isArray(v.caseIds)&&v.caseIds.every((c:unknown)=>typeof c==='string'||typeof c==='number'))}
interface Result {name:string;status:Status;evidenceIntegrity?:string;reason?:string;reasonCode?:string}
export function researchSummary(ctx:Context, steps:Steps = {}) {
  const report = readReport(ctx, 'research.json'), results:Result[] = [];
  const observed=overall([report?.status||'UNVERIFIED',...(Array.isArray(report?.results)?report.results:[]).map((r:unknown)=>resultStatus(r,plan.find(c=>record(r)&&c.id===r.name)?.execution||'tool'))]);
  for (const id of ['dependencies','browser-install']) {
    const r = readReport(ctx, `stage-${id}.json`);
    const status=resultStatus(r,'tool');
    results.push({ name: id, status:verifiedPass(r,'tool')&&r?.schema===1?'PASS':status==='ERROR'||status==='FAIL'||status==='CANCELLED'?status:'UNVERIFIED' });
  }
  const unit=readReport(ctx,'unit.json'),unitStatus=overall([unit?.status||'UNVERIFIED',...(Array.isArray(unit?.results)?unit.results:[]).map((r:unknown)=>resultStatus(r,'contract'))]);results.push({name:'research-unit',status:suiteEvidence(ctx,'unit',researchUnitEntries)?'PASS':['FAIL','ERROR','CANCELLED'].includes(unitStatus)?unitStatus:'UNVERIFIED'});
  try {
    if (!sameIdentity(report?.sourceAfter,ctx.identity.source))throw Error('SourceChangedDuringExecution');
    const entries=report?.results;if(!Array.isArray(entries)||!entries.every(familyResult))throw Error('Invalid research result records');
    for(const family of familyReports(ctx.identity,plan.map(c=>c.id),entries,report?.sourceAfter)){const actual=readReport(ctx,'families/'+family.family+'.json');if(!actual||!sameIdentity(actual,family))throw Error('Research family evidence mismatch: '+family.family);}
    if (report?.schema !== 1 || report.suite !== 'research' || !sameIdentity(report.expected, plan.map(c=>c.id)) || entries.length !== plan.length) throw Error('Missing/incomplete research plan');
    for (const [i, check] of plan.entries()) {
      const r = entries[i];if(!r)throw Error('Missing research result');
      const nativeIds=nodeCaseIds(check.args);if(nativeIds.length&&(!Array.isArray(r.nodeTests)||!sameIdentity(r.nodeTests.map((c:unknown)=>object(c).id).sort(),[...nativeIds].sort())||r.nodeTests.some((c:unknown)=>object(c).status!=='PASS')||(Array.isArray(r.nodeCaseIssues)?r.nodeCaseIssues.length:!!r.nodeCaseIssues)))throw Error('Missing/duplicate/unknown/skipped native research cases');
      const entry=check.args.find(a=>/\.cjs$/.test(a)&&entryDeclaration(path.basename(a)));if(check.execution==='contract'&&entry&&entryCaseProblems(path.basename(entry),r).length)throw Error('Internal cases or renderer mismatch: '+check.id);
      if(check.execution==='contract'&&!(Number.isSafeInteger(r.assertions)&&typeof r.assertions==='number'&&r.assertions>0||nativeIds.length&&(Array.isArray(r.nodeTests)&&r.nodeTests.length)))throw Error('Required research contract has no valid assertions: '+check.id);
      if (r.name !== check.id || !verifiedPass(r,check.execution||'tool') || !Array.isArray(r.artifacts)) throw Error(`Required command incomplete: ${check.id}`);
      if (check.report) {
        if (r.artifacts.length !== 1) throw Error('Required report missing');
        const a = object(r.artifacts[0]);if(typeof a.file!=='string')throw Error('Invalid artifact path');
        const expectedFile = check.report.fixture ? 'fixtures/moody-historical-regressions.cjs/snapshot.json' : `research/${check.id}/result.json`;
        if (a.file !== expectedFile) throw Error('Unexpected report path');
        const bytes = fs.readFileSync(path.join(ctx.dir, a.file));
        if (hash(bytes) !== a.sha256) throw Error('Research report hash mismatch');
        const raw:unknown = JSON.parse(bytes.toString('utf8'));
        const ids = check.report.fixture ? recordReport(ctx, check, new Map()).caseIds : caseIds(check.report, raw, ctx);
        if (!sameIdentity(r.caseIds, ids)) throw Error('Research case envelope mismatch');
      } else if (!sameIdentity(r.caseIds, commandCaseIds(check))) throw Error('Command case missing');
    }
    results.push({ name: 'research', status: report.status === 'PASS' ? 'PASS' : 'UNVERIFIED' });
  } catch (error) { results.push({ name: 'research', status: ['FAIL','ERROR','CANCELLED'].includes(observed)?observed:'UNVERIFIED',evidenceIntegrity:'INCOMPLETE',reason:error instanceof Error?error.message:String(error) }); }
  for (const id of ['checkout','node','dependencies','browser-install','research']) {
    if (steps[id] && steps[id]?.outcome !== 'success') results.push({ name: id, status: steps[id]?.outcome==='cancelled'?'CANCELLED':steps[id]?.outcome==='skipped'?'UNVERIFIED':'ERROR' });
  }
  const catalog=readReport(ctx,'catalog.json');if(!catalog||!sameIdentity(catalog.catalog,catalogFor('research',ctx.identity.environment?.deviceDepth||'standard'))||!sameIdentity(ctx.identity.catalog,catalogIdentity('research',ctx.identity.environment?.deviceDepth||'standard')))results.push({name:'catalog',status:'UNVERIFIED',reasonCode:'CatalogMismatch'});
  const status=overall(results.map(r=>r.status));return { schema:1,identity:ctx.identity,...verdict(results.some(r=>r.status==='FAIL')?'FAIL':status==='PASS'?'PASS':'UNKNOWN',results.filter(r=>r.status==='UNVERIFIED'||r.evidenceIntegrity==='INCOMPLETE'),status),results, coverage: 'Controlled research contracts; no visual acceptance, game or physical-device claim.' };
}
