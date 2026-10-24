import type {Status} from './contracts.ts';
export const researchFamilies=['hub','settings','production','weather'] as const;
export type ResearchFamily=typeof researchFamilies[number];
export type Maturity='Exploratory'|'Candidate'|'Contract';
export function familyFor(id:string):ResearchFamily{
 if(id.startsWith('prototype-')||id.startsWith('golden-spin-')||id==='motion-workspace')return 'hub';
 if(id.startsWith('settings-')&&id!=='settings-ci')return 'settings';
 if(id.startsWith('weather-')||id.startsWith('evolution-weather')||id.startsWith('evolution-rain'))return 'weather';
 return 'production';
}
export function maturityFor(id:string):Maturity{return familyFor(id)==='production'?'Contract':'Candidate';}
export function dependenciesFor(id:string):string[]{
 if(id==='prototype-build')return ['prototype-check'];
 if(id==='settings-prepare')return ['settings-baselines'];
 if(id==='settings-types')return ['settings-prepare'];
 if(id==='settings-build')return ['settings-prepare','settings-types'];
 if(id==='settings-study')return ['settings-build'];
 if(id==='framework-build')return ['source-check'];
 if(id==='weather-build')return ['weather-types'];
 if(id==='weather-review-pages')return ['weather-build'];
 if(familyFor(id)==='weather'&&id!=='weather-unit'&&!id.startsWith('weather-'))return ['weather-build'];
 if(familyFor(id)==='production'&&!['source-check','framework-build','inventory','evolution-unit'].includes(id))return ['framework-build'];
 return [];
}
interface Result {name:string;status:Status;rawStatus?:string;caseIds?:(string|number)[];[key:string]:unknown}
export function familyReports(identity:unknown,expected:string[],results:Result[],sourceAfter:unknown):{family:ResearchFamily;maturity:Maturity;expected:string[];results:Result[];status:Status;sourceAfter:unknown;seal:{state:string};schema:1;identity:unknown}[]{
 return researchFamilies.map(family=>{
  const names=expected.filter(id=>familyFor(id)===family),entries=results.filter(r=>familyFor(r.name)===family);
  const incomplete=!names.length||entries.length!==names.length||entries.some(r=>['not-run','blocked','running'].includes(r.rawStatus||''));
  const statuses=entries.map(r=>r.status);const status:Status=statuses.includes('FAIL')?'FAIL':statuses.includes('ERROR')?'ERROR':statuses.includes('CANCELLED')?'CANCELLED':incomplete||statuses.some(s=>s!=='PASS')?'UNVERIFIED':'PASS';
  return {schema:1,identity,family,maturity:family==='production'?'Contract':'Candidate',expected:names,results:entries.map(r=>({name:r.name,status:r.status,rawStatus:r.rawStatus,caseIds:r.caseIds})),status,sourceAfter,seal:{state:incomplete?'INCOMPLETE':'SEALED'}};
 });
}
