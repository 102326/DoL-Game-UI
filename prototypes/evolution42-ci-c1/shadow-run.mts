import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,copyFileSync,lstatSync,symlinkSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sourceIdentity} from '../../scripts/ci/source.ts';
import {executeShadow} from './shadow.mts';

const root=path.resolve(fileURLToPath(new URL('../../',import.meta.url)));
const git=(cwd:string,...args:string[])=>execFileSync('git',args,{cwd,maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']}).toString('utf8').trim();
if(process.argv[2]==='--execute'){
 const base=process.argv[3];if(!base)throw Error('Missing independently frozen base');
 const result=await executeShadow(root,base,path.join(root,'tests/artifacts/consumer-shadow'));
 console.log(JSON.stringify({status:result.problems.length?'UNVERIFIED':'PASS',scope:'consumer-shadow-only',problems:result.problems}));
 if(result.problems.length)process.exitCode=1;
}else{
 const before=sourceIdentity(root),out=path.join(root,'tests/artifacts/ui42/ci-shadow',String(Date.now())),checkout=path.join(out,'checkout');
 mkdirSync(checkout,{recursive:true});
 const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root,maxBuffer:64*1024*1024}).toString('utf8').split('\0').filter(Boolean);
 for(const relative of new Set(files)){
  const source=path.resolve(root,relative),target=path.resolve(checkout,relative);
  if(!source.startsWith(root+path.sep)||!target.startsWith(checkout+path.sep)||!lstatSync(source).isFile())throw Error('Unsafe snapshot path: '+relative);
  mkdirSync(path.dirname(target),{recursive:true});copyFileSync(source,target);
 }
 if(JSON.stringify(sourceIdentity(root))!==JSON.stringify(before))throw Error('Source changed during snapshot');
 symlinkSync(path.join(root,'node_modules'),path.join(checkout,'node_modules'),'junction');
 git(checkout,'init','-q');git(checkout,'config','core.autocrlf','false');git(checkout,'add','.');
 const commit=(message:string)=>git(checkout,'-c','user.name=Shadow Fixture','-c','user.email=shadow@example.invalid','commit','-qm',message);
 commit('Derived snapshot of reviewed working inputs');const base=git(checkout,'rev-parse','HEAD');
 // Equivalent representations bind real source changes without changing gameplay or accepted visuals.
 const edits=[['src/theme/acrylic.ts','acrylicDefault=60;','acrylicDefault=60.0;'],['src/ui/golden-spin/hub-motion.ts','duration:.65','duration:65/100'],['framework/official-ui/motion.ts','previousPetal:DOMRect|undefined','previousPetal:DOMRect | undefined']] as const;
 for(const [file,from,to]of edits){const target=path.join(checkout,file),text=readFileSync(target,'utf8');if(text.split(from).length!==2)throw Error('Sample anchor drift: '+file);writeFileSync(target,text.replace(from,to))}
 git(checkout,'add','.');commit('Frozen equivalent consumer-shadow sample');
 writeFileSync(path.join(out,'provenance.json'),JSON.stringify({scope:'isolated source-equivalent consumer drill, not a product commit or full CI',origin:before,base,head:git(checkout,'rev-parse','HEAD'),files:edits.map(e=>e[0]),dependencies:'existing locked installation via directory junction; not a fresh npm ci',checkout},null,2));
 console.log(JSON.stringify({checkout,base}));
 const run=execFileSync(process.execPath,[path.join(checkout,'prototypes/evolution42-ci-c1/shadow-run.mts'),'--execute',base],{cwd:checkout,stdio:'inherit',timeout:15*60*1000});
 void run;
}
