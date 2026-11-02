// Manual browser/source study. No product patching, downloads, installs or real game.
import {readFileSync,mkdirSync,writeFileSync,mkdtempSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {chromium,type Page} from 'playwright';
import browserOptions from '../../../tests/browser-options.cjs';
import {bundles,vendor,proposedVendor as targetVendor,withTargetFilter,withCombinedRules,hybridVendor,digest} from './build-modhub-b3.mts';
import {proposedVendorSource} from './build-alias-browser.mts';
type Identity={name:string;bootNames:string[];aliases:string[];identityId?:string|null};
type Mod={id?:string;name?:string;description:string;bootNames?:string[];aliases?:string[];requiredDependencies?:unknown[];[key:string]:unknown};
type Engine={inferRequiredDependencies(mod:unknown,catalog?:unknown):unknown;getRequiredDependencies(mod:unknown):unknown;setCatalog(value:unknown):void;stats():{builds:number;size:number;limit:number;maxAliasLength:number;bypasses:number;evictions:number}|null;clear():void};
declare const OriginalInference:{createCandidate():Engine},CandidateInference:{createCandidate():Engine},TargetInference:{createCandidate():Engine};
const lazy=process.argv.includes('--lazy'),union=process.argv.includes('--union'),hybrid=process.argv.includes('--hybrid');assert.ok(Number(lazy)+Number(union)+Number(hybrid)<=1);const proposedVendor=hybrid?hybridVendor():union?withCombinedRules(vendor):lazy?withTargetFilter(vendor,true):targetVendor;
const frozen=new URL('../perf-4.1-evidence-20261026/',import.meta.url),built=bundles(lazy,union,hybrid);
const golden=JSON.parse(readFileSync(new URL('inference-cases.json',frozen),'utf8')) as Array<{name:string;mod:Mod;catalog:Identity[];expected:unknown}>;
const sequence=JSON.parse(readFileSync(new URL('inference-sequence.json',frozen),'utf8')) as {mod:Mod;catalog:Identity[];steps:Array<{patch:{description:string;bootNames?:string[];catalogPatch?:{index:number;aliases:string[]}};expected:unknown}>};
const out=resolve('tests/artifacts/evolution/modhub-b3-'+Date.now());mkdirSync(out,{recursive:true});
const sourceNames=['build-modhub-b3.mts','check-modhub-b3.mts'];
const sources=()=>Object.fromEntries(sourceNames.map(n=>[n,digest(readFileSync(new URL(n,import.meta.url)))]));const sourceHashes=sources();
const browser=await chromium.launch(browserOptions),errors:string[]=[];
let status='FAIL',phase='pure',failure:string|undefined,contracts:unknown,measurements:unknown;const full:unknown[]=[];
const newPage=async()=>{const page=await browser.newPage({viewport:{width:1280,height:900}});page.on('pageerror',e=>errors.push(e.message));return page};
try{
 const page=await newPage();await page.setContent('<!doctype html><p>First-party inference fixture</p>');for(const b of Object.values(built))await page.addScriptTag({content:b.code});
 contracts=await page.evaluate(({golden,sequence,hybrid})=>{
  const engines=[OriginalInference,CandidateInference,TargetInference].map(n=>n.createCandidate());
  const check=(ok:boolean,label:string)=>{if(!ok)throw Error(label)},serial=(n:unknown)=>JSON.stringify(n);let comparisons=0;
  const compare=(mod:unknown,catalog:unknown,label:string,expected?:unknown)=>{
   const before=serial([mod,catalog]),results=engines.map(e=>e.inferRequiredDependencies(mod,catalog));if(expected!==undefined)check(serial(results[0])===serial(expected),label+' frozen golden');
   for(const result of results){check(serial(result)===serial(results[0]),label+' equality');check(serial([mod,catalog])===before,label+' input unchanged')}
   const expectedResult=serial(results[0]);for(const result of results)if(Array.isArray(result)){if(result[0])Object.assign(result[0],{version:'consumer-edit'});result.push({modName:'pollution'})}
   for(const e of engines)check(serial(e.inferRequiredDependencies(mod,catalog))===expectedResult,label+' fresh output');comparisons++;
  };
  for(const c of golden)compare(c.mod,c.catalog,c.name,c.expected);
  for(const [i,s]of sequence.steps.entries()){Object.assign(sequence.mod,{description:s.patch.description},s.patch.bootNames?{bootNames:s.patch.bootNames}:{});if(s.patch.catalogPatch)sequence.catalog[s.patch.catalogPatch.index]!.aliases=s.patch.catalogPatch.aliases;compare(sequence.mod,sequence.catalog,'sequence '+i,s.expected)}
  const aliases=['Alpha Tools','A.*[x](y)+?\\','Ωμέγα','İTool','KTools','框架「甲」','A_1','框架\t甲','Emoji🌧Tools','Mixed  CASE'];
  const templates=['需要{a} >=1.2 且 <3.0','基于{a}框架制作','{a}是必需前置','requires {a}','optional {a}','不再依赖{a}','需要{a}Extra','使用{a} v2.0开发'];
  for(const alias of aliases)for(const t of templates){const catalog=[{name:alias,bootNames:['FixtureBoot'],aliases:[alias]}];compare({description:t.replace('{a}',alias)},catalog,alias+'/'+t);compare({description:t.replace('{a}',alias.replace(/\s+/g,''))},catalog,alias+'/no spaces/'+t)}
  compare({description:'需要重名'},[{name:'重名',bootNames:['One'],aliases:[]},{name:'重名',bootNames:['Two'],aliases:[]}],'ambiguous alias');
  for(const description of ['基于工具甲 v2.0制作且工具甲是前置','通过工具甲框架制作且工具甲是必须前置','需要工具甲 >=1.0并基于工具甲框架制作'])compare({description},[{name:'工具甲',bootNames:['AlphaTools'],aliases:[]}],'multiple complete rules/'+description);
  const native=window.RegExp,constructors:Record<string,number>={};
  try{for(const [i,e]of engines.entries()){let count=0;window.RegExp=new Proxy(native,{construct(target,args){count++;return Reflect.construct(target,args)}});const catalog=Array.from({length:400},(_,j)=>({name:'工具'+j,bootNames:['Boot'+j],aliases:['别名'+j]}));e.inferRequiredDependencies({description:'需要工具0 >=1.0'},catalog);constructors[['original','b2','b3'][i]!]=count}}finally{window.RegExp=native}
  check(constructors.b3!<constructors.original!,'negative target work reduced');
  let routing:unknown;
  if(hybrid){
   const p=TargetInference.createCandidate(),small=[{name:'工具甲',bootNames:['AlphaTools'],aliases:[]}],m={description:'需要工具甲 >=1.0'};
   p.inferRequiredDependencies(m,small);const cold=p.stats();check(!!cold&&cold.builds>0,'small catalog uses cache');p.inferRequiredDependencies(m,small);check(p.stats()!.builds===cold!.builds,'small repeated rules reused');
   const wide=[{...small[0]!,aliases:Array.from({length:1100},(_,i)=>'宽别名'+i)}];p.inferRequiredDependencies(m,wide);check(p.stats()!.builds===cold!.builds,'overflow union does not build cache rules');
   wide[0]!.aliases=[];wide[0]!.bootNames=['ChangedBoot'];check(JSON.stringify(p.inferRequiredDependencies(m,wide)).includes('ChangedBoot'),'shrink rereads changed boot');
   for(let i=0;i<1100;i++)p.inferRequiredDependencies({description:'需要驱逐名'+i},[{name:'驱逐名'+i,bootNames:['EvictionBoot'],aliases:[]}]);
   const long='长别名'+('甲'.repeat(257));p.inferRequiredDependencies({description:'需要'+long},[{name:long,bootNames:['LongBoot'],aliases:[]}]);const stats=p.stats()!;
   check(stats.limit===1024&&stats.maxAliasLength===256&&stats.size<=1024&&stats.evictions>0&&stats.bypasses>0,'original budgets, eviction and long bypass retained');p.clear();check(p.stats()!.size===0,'clear releases rule entries');routing={cold,stats,cleared:p.stats()};
  }
  return{comparisons,golden:golden.length,sequence:sequence.steps.length,constructors,routing};
 },{golden,sequence,hybrid});
 phase='timing';
 measurements=await page.evaluate(()=>{
  const factories={original:OriginalInference,b2:CandidateInference,b3:TargetInference};type Key=keyof typeof factories;
  const orders:Key[][]=[['original','b2','b3'],['original','b3','b2'],['b2','original','b3'],['b2','b3','original'],['b3','original','b2'],['b3','b2','original']];
  const records:Array<{size:number;profile:string;phase:string;pair:number;order:Key[];ms:Record<Key,number>}>=[];
  for(const [size,profile]of [[25,'sparse'],[100,'sparse'],[250,'sparse'],[400,'sparse'],[25,'dense']] as const){
   const catalog=Array.from({length:size},(_,i)=>({name:'工具'+i,bootNames:['Boot'+i],aliases:['别名'+i,'Alias '+i]}));
   const mod={description:profile==='sparse'?'需要工具0 >=1.0；基于别名1框架制作；工具2是前置。':'需要'+catalog.flatMap(c=>[c.name,...c.bootNames,...c.aliases]).join('和')};
   const expected=JSON.stringify(factories.original.createCandidate().inferRequiredDependencies(mod,catalog));
   for(const phase of ['cold','warm'])for(let pair=-2;pair<12;pair++){
    const engines={original:factories.original.createCandidate(),b2:factories.b2.createCandidate(),b3:factories.b3.createCandidate()};
    const ms={original:0,b2:0,b3:0},order=orders[(pair+2)%orders.length]!;
    for(const key of order){const engine=engines[key];if(phase==='warm')for(let i=0;i<20;i++)engine.inferRequiredDependencies(mod,catalog);let value:unknown;const start=performance.now();for(let i=0;i<(phase==='warm'?10:1);i++)value=engine.inferRequiredDependencies(mod,catalog);ms[key]=performance.now()-start;if(JSON.stringify(value)!==expected)throw Error('Timing output differs '+size+'/'+profile+'/'+key)}
    if(pair>=0)records.push({size,profile,phase,pair,order,ms});
   }
  }
  const median=(a:number[])=>{const b=[...a].sort((a,b)=>a-b);return(b[(b.length-1)>>1]!+b[b.length>>1]!)/2};
  return{records,summary:[25,100,250,400].flatMap(size=>['cold','warm'].map(phase=>{const r=records.filter(r=>r.size===size&&r.profile==='sparse'&&r.phase===phase);return{size,profile:'sparse',phase,original:median(r.map(r=>r.ms.original)),b2:median(r.map(r=>r.ms.b2)),b3:median(r.map(r=>r.ms.b3)),b3Delta:median(r.map(r=>r.ms.b3-r.ms.original)),b3Slower:r.filter(r=>r.ms.b3>r.ms.original).length}})).concat(['cold','warm'].map(phase=>{const r=records.filter(r=>r.profile==='dense'&&r.phase===phase);return{size:25,profile:'dense',phase,original:median(r.map(r=>r.ms.original)),b2:median(r.map(r=>r.ms.b2)),b3:median(r.map(r=>r.ms.b3)),b3Delta:median(r.map(r=>r.ms.b3-r.ms.original)),b3Slower:r.filter(r=>r.ms.b3>r.ms.original).length}}))};
 });await page.close();
 phase='full-closure';
 for(const [variant,source]of [['original',vendor],['b2',proposedVendorSource()],['b3',proposedVendor]] as const){
  const p=await newPage();let blocked=0;
  await p.route('**/*',route=>route.request().isNavigationRequest()?route.fulfill({contentType:'text/html',body:'<!doctype html><title>Isolated market fixture</title>'}):(blocked++,route.abort()));
  await p.goto('http://modhub.test/');await p.addScriptTag({content:source});
  const result=await fullClosure(p);assert.equal(blocked,0,'no background network expected');full.push({variant,...result,blockedNetwork:blocked});await p.close();
 }
 assert.deepEqual(full.map(n=>{const{variant,...v}=n as Record<string,unknown>;return v})[1],full.map(n=>{const{variant,...v}=n as Record<string,unknown>;return v})[0]);
 assert.deepEqual(full.map(n=>{const{variant,...v}=n as Record<string,unknown>;return v})[2],full.map(n=>{const{variant,...v}=n as Record<string,unknown>;return v})[0]);
 phase='review-patch';
 const temp=mkdtempSync(join(tmpdir(),'modhub-b3-'));writeFileSync(join(temp,'old.js'),vendor);writeFileSync(join(temp,'new.js'),proposedVendor);
 const diff=spawnSync('git',['diff','--no-index','--','old.js','new.js'],{cwd:temp,encoding:'utf8'});assert.equal(diff.status,1);
 const patch=diff.stdout.replace('a/old.js b/new.js','a/javascript/modhub-market.js b/javascript/modhub-market.js').replace('--- a/old.js','--- a/javascript/modhub-market.js').replace('+++ b/new.js','+++ b/javascript/modhub-market.js').replace(/^ $/gm,'-\n+');writeFileSync(join(out,`modhub-1.8.3-${hybrid?'hybrid':union?'union':lazy?'target-lazy':'target-filter'}-review.patch`),patch);writeFileSync(join(temp,'patch.diff'),patch);mkdirSync(join(temp,'javascript'));writeFileSync(join(temp,'javascript/modhub-market.js'),vendor);
 for(const args of [['--check',join(temp,'new.js')],['apply','--check',join(temp,'patch.diff')],['apply',join(temp,'patch.diff')]]){const command=args[0]==='--check'?process.execPath:'git';const r=spawnSync(command,args,{cwd:temp,encoding:'utf8'});assert.equal(r.status,0,r.stderr)}
 assert.equal(digest(readFileSync(join(temp,'javascript/modhub-market.js'))),digest(proposedVendor));assert.deepEqual(errors,[]);assert.deepEqual(sources(),sourceHashes);status='PASS';
}catch(e){failure=String(e);throw e}finally{
 writeFileSync(join(out,'result.json'),JSON.stringify({status,candidateKind:hybrid?'hybrid':union?'union':lazy?'target-lazy':'target-filter',phase,lazy,union,hybrid,failure,environment:{node:process.version,platform:process.platform,chromium:browser.version()},sourceHashes,bundles:Object.fromEntries(Object.entries(built).map(([k,v])=>[k,v.sha256])),vendor:digest(vendor),proposedVendor:digest(proposedVendor),contracts,measurements,full,errors,limits:'Frozen1.8.3 isolated pure engines and complete original market scripts; no live game/real catalog/installation. Full-script external variants/version/history services are explicit controlled providers. Network blocked. Timing has no constructor proxy or trace, two warm-up triples discarded then twelve balanced triples; not a device or end-to-end result.'},null,2));console.log(out);await browser.close();
}

async function fullClosure(page:Page){return page.evaluate(async()=>{
 type Release={version:string};type State={version:string;pending:boolean;release?:Release|null;error?:string;promise:Promise<void>};
 type Market={getMarketMods():Identity[];getRequiredDependencies(mod:Mod):unknown;getReleaseHistoryContext(mod:Mod):{signature:string};getModUpdateInfo(mod:Mod,profiles:unknown[]):State};
 const api=(window as Window&{modHubMarket?:Market}).modHubMarket;if(!api)throw Error('Full market script did not boot');
 const check=(ok:boolean,label:string)=>{if(!ok)throw Error(label)};let game='0.5.11.9';const pending:Array<(value:{candidates:Release[];hasMore:boolean})=>void>=[];
 Object.assign(window,{modHubIsReloadBusy:()=>false,modHubMarketVariants:{normalizePackageEditions:()=>[],normalizeRequiredDependencies:(v:unknown)=>Array.isArray(v)?v:[]},modHubMarketVersions:{getGameVersion:()=>game,getGameIdentity:()=>({name:'ControlledGame'}),getLatestGameCandidate:(_m:unknown,c:Release[])=>c[0]??null,getLatestUpdateCandidate:(_m:unknown,c:Release[])=>c[0]??null,getLatestReleaseCandidate:(_m:unknown,c:Release[])=>c[0]??null,fetchReleases:()=>new Promise(resolve=>pending.push(resolve)),buildCandidates:(_m:unknown,h:{candidates:Release[]})=>h.candidates}});
 const states=[];
 for(const mutation of ['description','catalog-alias','catalog-boot','catalog-replace','boot-identity','game-version']){
  game='0.5.11.9';pending.length=0;const catalog=api.getMarketMods();catalog.splice(0,catalog.length,{name:'工具甲',bootNames:['AlphaTools'],aliases:['Alpha Alias']});
  const mod:Mod={id:'fixture-'+mutation,name:'Controlled target',description:'需要Alpha Alias >=1.0',bootNames:['TargetBoot'],githubUrl:'https://github.com/example/research-fixture',version:'1.0'};
  const old=api.getModUpdateInfo(mod,[]);for(let i=0;i<10&&!pending.length;i++)await Promise.resolve();check(pending.length===1,'old history request queued '+mutation);
  const before=api.getReleaseHistoryContext(mod).signature;
  if(mutation==='description')mod.description='需要工具甲 >=2.0';else if(mutation==='catalog-alias')catalog[0]!.aliases=['Another Alias'];else if(mutation==='catalog-boot')catalog[0]!.bootNames=['ChangedBoot'];else if(mutation==='catalog-replace')catalog.splice(0,1,{name:'Alpha Alias',bootNames:['ReplacementBoot'],aliases:[]});else if(mutation==='boot-identity')mod.bootNames=['AlphaTools'];else game='0.5.12.0';
  check(before!==api.getReleaseHistoryContext(mod).signature,'required signature invalidated '+mutation);const fresh=api.getModUpdateInfo(mod,[]);for(let i=0;i<10&&pending.length<2;i++)await Promise.resolve();check(pending.length===2&&fresh!==old,'new history generation '+mutation);
  pending[1]!({candidates:[{version:'2.0'}],hasMore:false});await fresh.promise;pending[0]!({candidates:[{version:'1.0'}],hasMore:false});await old.promise;
  check(fresh.version==='2.0'&&old.version===''&&!old.pending&&!fresh.pending,'stale result must not publish '+mutation);check(api.getModUpdateInfo(mod,[])===fresh,'fresh cached state retained '+mutation);states.push({mutation,fresh:fresh.version,stale:old.version,pending:old.pending||fresh.pending,error:fresh.error??''});
 }
 return{states,scope:'Complete market closure; controlled variants/version/history providers; no install or real network'};
})}
