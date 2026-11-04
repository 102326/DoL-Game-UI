// Research only: run after performance sampling, never a replacement for CI.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync, execFileSync} from 'node:child_process';
import ts from 'typescript';

const root=process.cwd(), out=path.resolve('tests/artifacts/settings-wait-probe');
if(!fs.existsSync('tests/settings-ci.cts'))throw Error('Run from repository root');
fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync('tests/settings-ci.cts','utf8');
const oldWait='await page.waitForTimeout(750);';
const newWait="await page.waitForFunction(expected=>document.querySelector('.dmt-workspace')?.getAttribute('data-settings-layout')===expected,label==='左右'?'vertical':'horizontal',{timeout:3000});";
if(source.split(oldWait).length!==2)throw Error('Expected exactly one layout wait inside the loop');
const integration=['ui41-reading','evolution-settings-integration','evolution-weather-integration'];
function compile(name:string, text:string){
 // Resolve existing helpers from their original locations; only three integrations are copied to redirect evidence.
 text=text.replace(/require\((['"])(\.{1,2}\/[^'"]+)\1\)/g,(_all,_q,relative:string)=>{
  const target=integration.some(x=>relative===`./${x}.cjs`)?path.join(out,path.basename(relative)):path.resolve('tests',relative);
  return `require(${JSON.stringify(target)})`;
 });
 const result=ts.transpileModule(text,{fileName:name+'.cts',compilerOptions:{module:ts.ModuleKind.NodeNext,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
 const errors=(result.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error);
 if(errors.length)throw Error(ts.formatDiagnosticsWithColorAndContext(errors,{getCanonicalFileName:x=>x,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));
 const file=path.join(out,name+'.cjs');fs.writeFileSync(file,result.outputText);
 const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(check.status!==0)throw Error(check.stderr);
 return file;
}
for(const name of integration){
 let text=fs.readFileSync(`tests/${name}.cts`,'utf8');
 const prefix=name==='ui41-reading'?'tests/artifacts/ui41/reading-':`tests/artifacts/evolution/${name==='evolution-settings-integration'?'settings-integration':'weather-integration'}-`;
 if(!text.includes(prefix))throw Error(`Missing evidence path ${prefix}`);
 text=text.replace(prefix,path.join(out,'integration',name+'-'));
 compile(name,text);
}
// Preserve all fixture actions, composed integrations, assertions and error paths; redirect only evidence output.
const redirect=(s:string)=>s.replaceAll('tests/artifacts/evolution/settings-resources.json',path.join(out,'settings-resources.json')).replace("fs.mkdirSync('tests/artifacts/evolution'",`fs.mkdirSync(${JSON.stringify(out)}`);
const versionLog="console.log('PROBE_BROWSER_VERSION',browser.version());";
const launch='const errors:string[]=[];page=await browser.newPage';
if(!source.includes(launch))throw Error('Missing browser version insertion point');
const prepared=redirect(source).replace(launch,versionLog+launch);
const old=compile('old',prepared),candidate=compile('candidate',prepared.replace(oldWait,newWait));
const control=`const {chromium}=require('playwright');\n(async()=>{const b=await chromium.launch(require(${JSON.stringify(path.resolve('tests/browser-options.cjs'))}));try{const page=await b.newPage();await page.setContent('<div class="dmt-workspace" data-settings-layout="horizontal"></div>');const label='左右';if(process.argv[2]==='late')await page.evaluate(()=>setTimeout(()=>document.querySelector('.dmt-workspace').setAttribute('data-settings-layout','vertical'),300));${newWait}console.log('TARGET_REACHED');}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});`;
const controlFile=path.join(out,'control.cjs');fs.writeFileSync(controlFile,control);
if(spawnSync(process.execPath,['--check',controlFile]).status!==0)throw Error('Control syntax invalid');
console.log('Prepared probe and syntax-checked temporary builds:',out);
if(process.argv.includes('--prepare'))process.exit(0);
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','src','framework','tests','scripts','package.json','package-lock.json'],{encoding:'utf8'}).trim().split('\n').filter(f=>f&&!f.startsWith('tests/artifacts/')&&(!f.startsWith('scripts/research/')||f==='scripts/research/settings-wait-probe.mts')&&fs.existsSync(f)&&fs.statSync(f).isFile());
files.push(...execFileSync('rg',['--files','--hidden','--no-ignore','-g','*.cjs','tests','scripts'],{encoding:'utf8'}).trim().split('\n').filter(f=>f&&!f.startsWith('tests/artifacts/')),'dist/framework/official-ui/style.css');
const hash=(f:string)=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const hashes=()=>Object.fromEntries([...new Set(files)].sort().map(f=>[f,hash(f)]));
const before=hashes(), results:unknown[]=[];
function run(id:string,file:string,args:string[]=[]){
 const start=performance.now(),result=spawnSync(process.execPath,[file,...args],{cwd:root,encoding:'utf8',env:{...process.env,MOODY_CHECK_NAME:'',MOODY_EVIDENCE_DIR:'',MOODY_EXECUTION_ID:'',MOODY_PROCESS_RECEIPT:''},timeout:180000,maxBuffer:16*1024*1024});
 const row={id,exit:result.status,signal:result.signal,error:result.error?.message??null,elapsedMs:Math.round(performance.now()-start),stdout:result.stdout??'',stderr:result.stderr??''};results.push(row);console.log(id,JSON.stringify({exit:row.exit,signal:row.signal,elapsedMs:row.elapsedMs,error:row.error}));return row;
}
const missing=run('never-target',controlFile,['never']);
const late=run('late-target',controlFile,['late']);
const controlsPassed=missing.exit!==0&&!missing.signal&&!missing.error&&missing.stderr.includes('TimeoutError')&&late.exit===0&&late.stdout.includes('TARGET_REACHED');
if(controlsPassed)outer:for(let i=0;i<4;i++)for(const variant of i%2===0?['old','candidate']:['candidate','old']){const result=run((i===0?'warmup':'sample-'+i)+'-'+variant,variant==='old'?old:candidate);if(result.exit!==0||result.signal||result.error)break outer;}
const after=hashes();
const report={schema:1,scope:'Research only; full settings-ci composed contract in controlled Chromium; not CI migration',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),node:process.version,platform:process.platform,arch:process.arch,lockSha256:hash('package-lock.json'),cssSha256:hash('dist/framework/official-ui/style.css'),temporaryBuilds:{old:hash(old),candidate:hash(candidate),control:hash(controlFile)},controlsPassed,stoppedEarly:results.filter((r:any)=>r.id.startsWith('warmup-')||r.id.startsWith('sample-')).length<8,identityScope:'Conservative source and runtime superset; excludes unrelated research scripts',changedInputs:Object.keys(before).filter(f=>before[f]!==after[f]),inputsBefore:before,inputsAfter:after,inputsStable:JSON.stringify(before)===JSON.stringify(after),results};
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
if(!controlsPassed||!report.inputsStable||results.some((r:any)=>r.id!=='never-target'&&(r.exit!==0||r.signal||r.error)))process.exitCode=1;
