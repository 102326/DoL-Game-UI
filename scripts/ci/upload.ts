import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {sameIdentity,exactIds,verdict,digest as hash} from './contracts.ts';
import type {Status} from './contracts.ts';
import {safeFile,readJsonBounded,evidenceMeta,captureMeta,writeJson,readReport,writeSuite,fixtureChecks} from './records.ts';
import {expectedLockSha256} from './lock.ts';
import {observeSource} from './source.ts';
import {researchFamilies} from './research-families.ts';
const require=createRequire(import.meta.url);
const {catalogFor,catalogIdentity,suites,stages,checkpoints,researchUnitEntries,researchPlan}:typeof import('../ci-catalog.cjs')=require('../ci-catalog.cjs');
const {verifyPng}:typeof import('../ci-png.cjs')=require('../ci-png.cjs');
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const object=(v:unknown)=>{if(!record(v))throw Error('Invalid evidence object');return v};
const rows=(v:unknown)=>{if(!Array.isArray(v))throw Error('Invalid evidence list');return v.map((v:unknown)=>object(v))};
const message=(e:unknown)=>e instanceof Error?e.message:String(e);
export type Context={root:string;dir:string;identity:{projectId?:string;source:{head:string};run:{id:string;attempt:string;githubRunId?:string|null};profile?:string;catalog?:unknown;nonce?:string;environment?:{deviceDepth?:string}};preparationMs?:number};
export type Summary={status:Status;assertionResult?:unknown;evidenceIntegrity?:unknown};
export interface UploadOptions{candidates?:readonly string[];totalLimit?:number;fileLimit?:(file:string)=>number|undefined;required?:readonly string[];identityFiles?:readonly string[]}
export interface Problem{file:unknown;reason:string}
export function requiredEvidence(profile='standard'):string[] {
  const shards=profile==='research'?[...researchUnitEntries.map(n=>'checks/unit/'+n+'.json'),...researchPlan.map(c=>'checks/research/'+c.id+'.json')]:Object.entries(suites).flatMap(([mode,names])=>names.map(n=>'checks/'+mode+'/'+n+'.json'));

  if(profile==='research')return [...researchFamilies.map(f=>'families/'+f+'.json'),...shards,'unit.json','metrics.json','catalog.json','identity.json','summary.json','research.json','stage-dependencies.json','stage-browser-install.json',...catalogFor('research').contracts.flatMap(c=>{if(!('visualEvidence' in c))throw Error('Missing research visual evidence contract');return [...c.evidence,...c.visualEvidence]})];
  return [...shards,'metrics.json','catalog.json', ...Object.keys(checkpoints).map(name=>`fixtures/${name}/checkpoints.json`), 'identity.json', 'summary.json', 'unit.json', 'browser.json', 'package-contracts.json', ...stages.map(s=>`stage-${s.id}.json`),'fixtures/device-layouts.cjs/layout-report.json'];
}
export function validateUpload(ctx:Context, required:readonly string[]=requiredEvidence(ctx.identity.profile), identityFiles:readonly string[]=required, options:{destination?:string;remote?:boolean}={}):Problem[] {
 const destination=options.destination||path.join(ctx.dir,'upload'),problems:Problem[]=[];let index:Record<string,unknown>;
 if(fs.existsSync(path.join(destination,'delivery.json'))&&!required.includes('delivery.json')){required=[...required,'delivery.json'];identityFiles=[...identityFiles,'delivery.json'];}
 try{index=object(readJsonBounded(destination,'upload-index.json',1048576))}catch(error){return[{file:'upload-index.json',reason:message(error)}]}
 if(index.schema!==2||!sameIdentity(index.identity,ctx.identity)||!exactIds(required,index.required)||!Array.isArray(index.files)||index.files.length>2000||new Set(index.files.map((e:unknown)=>record(e)?e.file:undefined)).size!==index.files.length)return[{file:'upload-index.json',reason:'Manifest identity/schema/required set/duplicate mismatch'}];
 for(const rawEntry of index.files){try{const entry=object(rawEntry);
  if(typeof entry.file!=='string'||typeof entry.sha256!=='string'||typeof entry.size!=='number')throw Error('Invalid manifest entry');const target=safeFile(destination,entry.file),stat=fs.statSync(target);
  if(!/^[a-f0-9]{64}$/.test(entry.sha256)||entry.size!==stat.size||entry.size>8*1024*1024||hash(fs.readFileSync(target))!==entry.sha256)throw Error('Indexed size/hash mismatch');
  const expected=evidenceMeta(entry.file,required,identityFiles);if(!Object.entries(expected).every(([k,v])=>entry[k]===v)||!sameIdentity(entry.capture,captureMeta(destination,entry.file,ctx.identity)))throw Error('Manifest role/schema/necessity/capture mismatch');
 }catch(error){problems.push({file:record(rawEntry)?rawEntry.file:undefined,reason:message(error)})}}
 for(const file of required){try{
  const entry=rows(index.files).find(e=>e.file===file);if(!entry)throw Error('Missing required file');
  const bytes=fs.readFileSync(safeFile(destination,file));
  if(file.endsWith('.png'))verifyPng(bytes);
  if(!options.remote&&hash(bytes)!==hash(fs.readFileSync(safeFile(ctx.dir,file))))throw Error('Required source hash mismatch');
  if(bytes.length>(file.endsWith('.png')?8388608:file.startsWith('research/')?2097152:262144))throw Error('Required evidence size limit');
  if(identityFiles.includes(file)){const report=object(JSON.parse(bytes.toString('utf8')));if(report.schema!==1||!sameIdentity(report.identity,ctx.identity))throw Error('Required file identity/schema mismatch');}
 }catch(error){problems.push({file,reason:message(error)})}}
 return problems;
}
export function finalizeUpload(ctx:Context,summary:Summary,options:UploadOptions={}) {
 const start=Date.now(),required=requiredEvidence(ctx.identity.profile),raw=new Set(catalogFor(ctx.identity.profile||'standard').contracts.filter(c=>c.group==='research').flatMap(c=>c.evidence)),identityFiles=required.filter(f=>f.endsWith('.json')&&!raw.has(f));
 for(const mode of ['unit','browser','research']){const suite=readReport(ctx,mode+'.json');if(suite?.results&&suite.suite){const suiteResults=rows(suite.results);if(typeof suite.suite!=='string'||!suiteResults.every((r):r is typeof r&{name:string;status:string}=>typeof r.name==='string'&&typeof r.status==='string'))throw Error('Invalid suite for upload');writeSuite(ctx,{...suite,suite:suite.suite,results:suiteResults});}}
 writeJson(path.join(ctx.dir,'summary.json'),summary);
 const stageMetrics=stages.map(s=>{const r=readReport(ctx,`stage-${s.id}.json`);return r?{id:s.id,status:r.status,milliseconds:r.milliseconds,cache:r.cache,retry:r.retry}:null}).filter(Boolean),researchMetrics=readReport(ctx,'research.json');
 writeJson(path.join(ctx.dir,'metrics.json'),{schema:1,identity:ctx.identity,preparationMs:ctx.preparationMs??null,stages:stageMetrics,research:researchMetrics?rows(researchMetrics.results).map(r=>({id:r.name,status:r.status,milliseconds:r.milliseconds})):undefined,automaticRetries:0,uploadTiming:'GitHub job steps; collected by ci-metrics.cjs',samplesNeededForP95:20});
 const upload=prepareUpload(ctx,{...options,required,identityFiles,candidates:[...required,...(options.candidates||[])]});
 const problems=validateUpload(ctx,required,identityFiles);
 if(summary.evidenceIntegrity==='INCOMPLETE')problems.push({file:'summary.json',reason:'EvidenceIncomplete in required result set'});
 if(!sameIdentity(ctx.identity.catalog,catalogIdentity(ctx.identity.profile||'standard',ctx.identity.environment?.deviceDepth||'standard')))problems.push({file:'catalog.json',reason:'Catalog identity mismatch'});
 const sourceAfter=observeSource(ctx);
 if(!sameIdentity(sourceAfter,ctx.identity.source))problems.push({file:'source-after',reason:'SourceChangedDuringExecution'});
 const delivery={schema:1,identity:ctx.identity,...verdict(summary.assertionResult|| (summary.status==='FAIL'?'FAIL':summary.status==='PASS'?'PASS':'UNKNOWN'),problems,summary.status),checkStatus:summary.status,problems,files:upload.files.length,bytes:upload.bytes,omitted:upload.omitted,localPreparationMs:Date.now()-start,remoteVerification:'PENDING'};
 const destination=path.join(ctx.dir,'upload');writeJson(path.join(destination,'delivery.json'),delivery);
 const indexPath=path.join(destination,'upload-index.json'),index=object(JSON.parse(fs.readFileSync(indexPath,'utf8'))),target=path.join(destination,'delivery.json');
 const indexFiles=index.files,indexRequired=index.required;if(!Array.isArray(indexFiles)||!Array.isArray(indexRequired)||typeof index.bytes!=='number')throw Error('Invalid upload index');
 indexFiles.push({file:'delivery.json',sha256:hash(fs.readFileSync(target)),size:fs.statSync(target).size,capture:null,...evidenceMeta('delivery.json',[...required,'delivery.json'],[...identityFiles,'delivery.json'])});indexRequired.push('delivery.json');index.bytes+=fs.statSync(target).size;index.seal={state:problems.length?'INCOMPLETE':'SEALED',expectedLockSha256,sourceAfter};writeJson(indexPath,index);
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`manifest_sha256=${hash(fs.readFileSync(indexPath))}\nevidence_nonce=${ctx.identity.nonce}\n`);
 return delivery;
}
export function prepareUpload(ctx:Context, { candidates: extra = [], totalLimit = 16 * 1024 * 1024, fileLimit, required=requiredEvidence(ctx.identity.profile), identityFiles=required }:UploadOptions = {}) {
  const destination = path.join(ctx.dir, 'upload');
  if (fs.existsSync(destination)) throw Error('Upload directory already exists; use a fresh evidence ID');
  fs.mkdirSync(destination);
  const candidates = [...extra,...required, 'identity.json', 'unit.json', 'browser.json', 'summary.json', 'package-contracts.json', ...stages.flatMap(s => [`stage-${s.id}.json`, `${s.id}.log`]),
    ...Object.entries(suites).flatMap(([suite, tests]) => tests.map(test => `${suite}/${test}.log`)),
    ...fixtureChecks.flatMap(test => [`fixtures/${test}/snapshot.json`, `fixtures/${test}/viewport.jpg`]), 'fixtures/device-layouts.cjs/layout-report.json'];
  const files:string[] = [], omitted:{file:string;reason:string;size?:number}[] = []; let bytes = 0;
  for (const file of [...new Set(candidates)]) {
    if (path.isAbsolute(file) || file.split(/[\\/]/).includes('..')) throw Error('Unsafe evidence candidate');
    const source = path.join(ctx.dir, file);
    if(!fs.existsSync(source)){if(required.includes(file))omitted.push({file,...evidenceMeta(file,required,identityFiles),reason:'MissingRequired'});continue;}
    const stat = fs.lstatSync(source), limit = fileLimit?.(file) ?? (file.endsWith('.jpg') ? 524288 : file === 'fixtures/device-layouts.cjs/layout-report.json' ? 262144 : file.startsWith('fixtures/') ? 65536 : file.endsWith('.json') ? 262144 : 65536);
    const relativeReal = path.relative(fs.realpathSync(ctx.dir), fs.realpathSync(source));
    if (!stat.isFile() || stat.isSymbolicLink() || relativeReal.startsWith('..') || path.isAbsolute(relativeReal) || stat.size > limit || bytes + stat.size > totalLimit - 1048576) {
      omitted.push({file,...evidenceMeta(file,required,identityFiles),size:stat.size,reason: 'Non-regular, outside run directory or evidence size limit' }); continue;
    }
    const target = path.join(destination, file);
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(source, target);
    files.push(file); bytes += stat.size;
  }
  writeJson(path.join(destination, 'upload-index.json'), {schema:2,identity:ctx.identity,required,files:files.map(file=>({file,capture:captureMeta(destination,file,ctx.identity),size:fs.statSync(path.join(destination,file)).size,sha256:hash(fs.readFileSync(path.join(destination,file))),...evidenceMeta(file,required,identityFiles)})),bytes,omitted});
  return { files, bytes, omitted };
}
