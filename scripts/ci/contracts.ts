import {createHash} from 'node:crypto';

export type Status = 'PASS'|'FAIL'|'ERROR'|'UNVERIFIED'|'CANCELLED';
export type CaseStatus = Status|'SKIP'|'BLOCKED'|'NOT_RUN'|'RUNNING';
export type Profile = 'standard'|'research'|'release';
export interface CaseDeclaration {id:string;minimumAssertions:number;renderer?:string}
export interface CaseResult {id:string;status:CaseStatus;milliseconds:number;assertions:number;path:string;failureSignature?:string;checkpoints?:string[]}
export interface EntryDeclaration {entry:string;profiles:Profile[];classification:'contract'|'candidate'|'exploratory';granularity:'entry'|'named'|'checkpoint'|'native'|'composed';cases:CaseDeclaration[];sourceSha256:string;assertionSites:number;evidence?:string;rendererContexts?:string[]}
export interface ExpectedLock {schema:1;devicePlans:Record<string,string[]>;nativeCases:Record<string,string[]>;researchCases:Record<string,string[]>;entries:EntryDeclaration[]}
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
 const problems:string[]=[];
 if(actual.length!==expected.length||new Set(actual.map(c=>c.id)).size!==actual.length||actual.some(c=>!expected.some(e=>e.id===c.id)))problems.push('CasePlanMismatch');
 for(const e of expected){const c=actual.find(c=>c.id===e.id);if(!c||c.status!=='PASS'||!Number.isFinite(c.milliseconds)||c.milliseconds<0||!Number.isSafeInteger(c.assertions)||c.assertions<e.minimumAssertions)problems.push('IncompleteCase:'+e.id);if(e.renderer&&c?.path!==e.renderer)problems.push('RendererPathMismatch:'+e.id);}
 return problems;
}
export function sealProblems(value:unknown,expectedLockSha256:string,source:unknown):string[]{
 const seal=value as Partial<Seal>|null;
 return [...(!seal||seal.state!=='SEALED'?['EvidenceUnsealed']:[]),...(seal?.expectedLockSha256!==expectedLockSha256?['ExpectedLockMismatch']:[]),...(JSON.stringify(seal?.sourceAfter)!==JSON.stringify(source)?['SourceChangedDuringExecution']:[])];
}
export function orderEntries<T>(entries:T[],seed?:string):T[]{
 if(!seed)return [...entries];
 let state=parseInt(digest(seed).slice(0,8),16);const result=[...entries];
 for(let i=result.length-1;i>0;i--){state=(Math.imul(state,1664525)+1013904223)>>>0;const j=state%(i+1);[result[i],result[j]]=[result[j],result[i]];}
 return result;
}
export function canSchedule(dependencies:string[],statuses:Record<string,string>):boolean{return dependencies.every(id=>statuses[id]==='PASS');}
