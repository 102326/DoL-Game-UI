import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import ts from 'typescript';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist/standalone-surfaces');
await build({root,configFile:false,logLevel:'error',build:{target:'es2022',outDir:out,emptyOutDir:true,
 lib:{entry:path.join(root,'src/runtime/standalone-surfaces.ts'),formats:['es'],fileName:()=> 'index.js'},sourcemap:false,minify:true}});
const config=ts.readConfigFile(path.join(root,'tsconfig.json'),ts.sys.readFile);
if(config.error)throw Error('Invalid project TypeScript configuration');
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,root);
const program=ts.createProgram([path.join(root,'src/runtime/standalone-surfaces.ts'),path.join(root,'src/env.d.ts')].filter(fs.existsSync),{
 ...parsed.options,noEmit:false,declaration:true,emitDeclarationOnly:true,noEmitOnError:true,rootDir:path.join(root,'src'),outDir:path.join(out,'types')});
const diagnostics=ts.getPreEmitDiagnostics(program);
if(diagnostics.length)throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));
program.emit(undefined,(file,text)=>{
 if(!/\/(?:runtime\/standalone-surfaces|public\/ui)\.d\.ts$/.test(file.replaceAll('\\','/')))return;
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,text.replace(/(from\s+['"])(\.[^'"]+)(['"])/g,(_all:string,start:string,name:string,end:string)=>start+name+'.js'+end));
});
fs.writeFileSync(path.join(out,'index.d.ts'),"export {createStandaloneSurfaces} from './types/runtime/standalone-surfaces.js';\nexport type {StandaloneSurfaces} from './types/runtime/standalone-surfaces.js';\n");
fs.copyFileSync(path.join(root,'LICENSE'),path.join(out,'LICENSE'));
const inputs=['src/runtime/standalone-surfaces.ts','src/runtime/surfaces.ts','src/runtime/surfaces.css','src/runtime/presentation.ts','src/public/ui.ts','scripts/build-standalone-surfaces.mts'];
const sha=(file:string)=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const identity={schema:1,entry:'src/runtime/standalone-surfaces.ts',source:{head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),dirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim()},
 inputs:Object.fromEntries(inputs.map(file=>[file,sha(file)])),output:{file:'index.js',sha256:sha('dist/standalone-surfaces/index.js'),bytes:fs.statSync(path.join(out,'index.js')).size}};
fs.writeFileSync(path.join(out,'SOURCE.json'),JSON.stringify(identity,null,2)+'\n');
console.log(JSON.stringify(identity));
