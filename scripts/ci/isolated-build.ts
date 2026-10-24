// Second build has its own checkout, outputs and compiler cache. Only the locked
// installed dependency tree is shared; no first-build output is copied.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';

const [source,destination,python]=process.argv.slice(2);
if(!source||!destination||!python||fs.readdirSync(destination).length)throw Error('Expected source and an empty independent build directory');
const git=(...args:string[])=>execFileSync('git',args,{cwd:source,maxBuffer:64*1024*1024});
execFileSync('git',['clone','--quiet','--shared','--no-checkout',source,destination],{stdio:'inherit'});
execFileSync('git',['checkout','--quiet','--detach',git('rev-parse','HEAD').toString().trim()],{cwd:destination,stdio:'inherit'});
const files=[...new Set(git('ls-files','--cached','--others','--exclude-standard','-z').toString().split('\0').filter(Boolean))];
for(const file of files){
 const input=path.join(source,file),output=path.join(destination,file);
 if(!fs.existsSync(input)){fs.rmSync(output,{force:true});continue;}
 const stat=fs.lstatSync(input);fs.mkdirSync(path.dirname(output),{recursive:true});
 if(stat.isSymbolicLink()){fs.rmSync(output,{force:true});fs.symlinkSync(fs.readlinkSync(input),output);}
 else if(stat.isFile()){fs.copyFileSync(input,output);fs.chmodSync(output,stat.mode&0o777);}
}
// A real ignored directory is necessary: a top-level symlink does not match
// Git's `node_modules/` directory rule and would become an extra source input.
const dependencies=path.join(destination,'node_modules');fs.mkdirSync(dependencies);
for(const entry of fs.readdirSync(path.join(source,'node_modules'),{withFileTypes:true})){
 if(['.vite','.vite-temp','.cache'].includes(entry.name))continue;
 const input=path.join(source,'node_modules',entry.name),output=path.join(dependencies,entry.name);
 if(entry.isDirectory())fs.symlinkSync(input,output,process.platform==='win32'?'junction':'dir');else fs.copyFileSync(input,output);
}
const sourceIdentity=createRequire(import.meta.url)('../ci-evidence.cjs').sourceIdentity;
const expected=sourceIdentity(source),actual=sourceIdentity(destination);
if(JSON.stringify(expected)!==JSON.stringify(actual)){
 const copied=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:destination}).toString().split('\0').filter(Boolean);
 throw Error('IsolatedSourceMismatch: '+JSON.stringify({expected,actual,missing:files.filter(f=>!copied.includes(f)),extra:copied.filter(f=>!files.includes(f))}));
}
if(process.argv.includes('--check-inputs')){console.log('PASS isolated source inputs');process.exit(0);}
const oldMask=process.platform==='win32'?null:process.umask(0o027);
const env={...process.env,TZ:'Pacific/Kiritimati',LC_ALL:'C',PYTHONUTF8:'1',PYTHONDONTWRITEBYTECODE:'1',MOODY_BUILD_CACHE:path.join(destination,'tests/artifacts/compiler-cache'),npm_config_cache:path.join(destination,'tests/artifacts/npm-cache')};
try{
 execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-p','tsconfig.tools.json'],{cwd:destination,env,stdio:'inherit'});
 execFileSync(process.execPath,['scripts/build-framework.mjs'],{cwd:destination,env,stdio:'inherit'});
 execFileSync(python,['scripts/check-ci-packages.py','build'],{cwd:destination,env,stdio:'inherit'});
 fs.writeFileSync(path.join(destination,'dist/CJ3C_ISOLATION.json'),JSON.stringify({workspace:'independent Git checkout and source overlay',outputs:'fresh; no first-build outputs copied',compilerCache:'fresh isolated directory',dependencies:'same lockfile and installed dependency tree',environment:{TZ:env.TZ,LC_ALL:env.LC_ALL,umask:oldMask===null?'unsupported':'0027'}},null,2)+'\n');
}finally{if(oldMask!==null)process.umask(oldMask);}
