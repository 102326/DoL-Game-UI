import '../check-node.mts';
import {createHash} from 'node:crypto';

export type Status = 'PASS'|'FAIL'|'ERROR'|'UNVERIFIED'|'CANCELLED';
export type CaseStatus = Status|'SKIP'|'BLOCKED'|'NOT_RUN'|'RUNNING';
export type Profile = 'standard'|'research'|'release';
export interface CaseDeclaration {id:string;minimumAssertions:number;renderer?:string}
export interface CaseResult {id:string;status:CaseStatus;milliseconds:number;assertions:number;path:string;failureSignature?:string;checkpoints?:string[]}
export interface EntryDeclaration {entry:string;sourceEntry?:string;profiles:Profile[];classification:'contract'|'candidate'|'exploratory';granularity:'entry'|'named'|'checkpoint'|'native'|'composed';cases:CaseDeclaration[];sourceSha256:string;assertionSites:number;evidence?:string;rendererContexts?:string[]}
export interface ExpectedLock {schema:1;devicePlans:Record<string,string[]>;nativeCases:Record<string,string[]>;researchCases:Record<string,string[]>;entries:EntryDeclaration[]}
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const strings=(value:unknown):value is string[]=>Array.isArray(value)&&value.every((item:unknown)=>typeof item==='string');
const stringMap=(value:unknown):value is Record<string,string[]>=>record(value)&&Object.values(value).every(strings);
const profile=(value:unknown):value is Profile=>value==='standard'||value==='research'||value==='release';
function caseDeclaration(value:unknown):value is CaseDeclaration{
 return record(value)&&typeof value.id==='string'&&typeof value.minimumAssertions==='number'
  &&Number.isSafeInteger(value.minimumAssertions)&&value.minimumAssertions>=1
  &&(value.renderer===undefined||typeof value.renderer==='string');
}
export function parseCasePlan(value:unknown):CaseDeclaration[]{
 if(!Array.isArray(value)||!value.every(caseDeclaration))throw Error('Invalid case plan');
 return value;
}
function entry(value:unknown):value is EntryDeclaration{
 return record(value)&&typeof value.entry==='string'&&(value.sourceEntry===undefined||typeof value.sourceEntry==='string')
  &&Array.isArray(value.profiles)&&value.profiles.every(profile)
  &&typeof value.classification==='string'&&['contract','candidate','exploratory'].includes(value.classification)
  &&typeof value.granularity==='string'&&['entry','named','checkpoint','native','composed'].includes(value.granularity)
  &&Array.isArray(value.cases)&&value.cases.every(caseDeclaration)&&typeof value.sourceSha256==='string'
  &&typeof value.assertionSites==='number'&&Number.isSafeInteger(value.assertionSites)&&value.assertionSites>=0
  &&(value.evidence===undefined||typeof value.evidence==='string')
  &&(value.rendererContexts===undefined||strings(value.rendererContexts));
}
function expectedLock(value:unknown):value is ExpectedLock{
 return record(value)&&value.schema===1&&stringMap(value.devicePlans)&&stringMap(value.nativeCases)&&stringMap(value.researchCases)&&Array.isArray(value.entries)&&value.entries.every(entry);
}
export function parseExpectedLock(value:unknown):ExpectedLock{
 if(!expectedLock(value))throw Error('Invalid Expected Lock schema');
 return value;
}
export interface Seal {state:'SEALED';expectedLockSha256:string;sourceAfter:unknown}
export const digest=(value:string|Buffer):string=>createHash('sha256').update(value).digest('hex');
// Only finalization may retain the original source identity to report its drift.
// Run, profile, contract and environment anchors must still be identical.
export function reconcileIdentity<T extends {source:unknown}>(prior:T,current:T,allowSourceDrift=false):T{
 if(JSON.stringify(prior)===JSON.stringify(current))return current;
 if(allowSourceDrift&&JSON.stringify(prior)===JSON.stringify({...current,source:prior.source}))return prior;
 throw Error('Run identity changed; fresh run directory required');
}
export function caseProblems(expected:CaseDeclaration[],actual:CaseResult[]|undefined):string[]{
 if(!expected.length||!Array.isArray(actual))return ['MissingExpectedCases'];
 if(actual.some(c=>!c||typeof c!=='object'||typeof c.id!=='string'||typeof c.path!=='string'||!c.path.length))return ['InvalidCaseResult'];
 const problems:string[]=[];
 if(actual.length!==expected.length||new Set(actual.map(c=>c.id)).size!==actual.length||actual.some(c=>!expected.some(e=>e.id===c.id)))problems.push('CasePlanMismatch');
 for(const e of expected){const c=actual.find(c=>c.id===e.id);if(!c||c.status!=='PASS'||!Number.isFinite(c.milliseconds)||c.milliseconds<0||!Number.isSafeInteger(c.assertions)||c.assertions<e.minimumAssertions)problems.push('IncompleteCase:'+e.id);if(e.renderer&&c?.path!==e.renderer)problems.push('RendererPathMismatch:'+e.id);}
 return problems;
}
export function sealProblems(value:unknown,expectedLockSha256:string,source:unknown):string[]{
 const seal=record(value)?value:null;
 return [...(!seal||seal.state!=='SEALED'?['EvidenceUnsealed']:[]),...(seal?.expectedLockSha256!==expectedLockSha256?['ExpectedLockMismatch']:[]),...(JSON.stringify(seal?.sourceAfter)!==JSON.stringify(source)?['SourceChangedDuringExecution']:[])];
}
export function orderEntries<T>(entries:readonly T[],seed?:string):T[]{
 if(!seed)return [...entries];
 let state=parseInt(digest(seed).slice(0,8),16);const result=[...entries];
 // Both indices stay within this private copy's length.
 for(let i=result.length-1;i>0;i--){state=(Math.imul(state,1664525)+1013904223)>>>0;const j=state%(i+1);[result[i],result[j]]=[result[j]!,result[i]!];}
 return result;
}
export function canSchedule(dependencies:string[],statuses:Record<string,string>):boolean{return dependencies.every(id=>statuses[id]==='PASS');}

export const sameIdentity=(a:unknown,b:unknown):boolean=>JSON.stringify(a)===JSON.stringify(b);
export function classify({ code, error, timedOut, cancelled, assertionFailed, terminalFailed }:{code?:number|null;error?:unknown;timedOut?:boolean;cancelled?:boolean;assertionFailed?:boolean;terminalFailed?:boolean}):Status {
  if (cancelled) return 'CANCELLED';
  if (timedOut || error) return 'ERROR';
  if (assertionFailed) return 'FAIL';
  if (terminalFailed) return 'ERROR';
  if (code === 0) return 'PASS';
  return code == null ? 'UNVERIFIED' : 'ERROR';
}
export function overall(statuses:readonly unknown[]):Status {
  if (!statuses.length) return 'UNVERIFIED';
  for (const status of ['FAIL','ERROR','CANCELLED','UNVERIFIED'] as const) if (statuses.includes(status)) return status;
  return statuses.every(s=>s==='PASS') ? 'PASS' : 'UNVERIFIED';
}
export interface Verdict<T=unknown> {status:Status;assertionResult:T;evidenceIntegrity:'INCOMPLETE'|'COMPLETE';reasonCodes:string[]}
export function verdict<T>(assertionResult:T, problems:readonly unknown[]=[], status:Status='PASS'):Verdict<T> {
  const evidenceIntegrity=problems.length ? 'INCOMPLETE' : 'COMPLETE';
  return {status:assertionResult==='FAIL' ? 'FAIL' : status==='PASS'&&problems.length ? 'UNVERIFIED' : status,
    assertionResult,evidenceIntegrity,reasonCodes:[...(status==='ERROR'?['InfrastructureError']:status==='CANCELLED'?['RunCancelled']:status==='UNVERIFIED'?['UnverifiedChecks']:[]),...(assertionResult==='FAIL'?['AssertionFailed']:[]),...(problems.length?['EvidenceIncomplete']:[])]};
}
export function exactIds(expected:readonly unknown[], actual:unknown):boolean {return expected.length>0&&Array.isArray(actual)&&expected.length===actual.length&&new Set(actual).size===actual.length&&expected.every(id=>actual.includes(id))}

export const requiredPackages:readonly string[] = ['StoneFreeHost', 'DoLGameUI', 'ModHubSoftWet', 'MapleBirchSoftWet', 'DolOptimizationSoftWet', 'CheatExtendedSoftWet', 'ReOverfitsSoftWet', 'LyraMouthCompat051213', 'SmartPhoneSoftWet'];
