import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=['scripts','scripts/ci'].flatMap(folder=>fs.readdirSync(path.join(root,folder)).filter(name=>name.endsWith('.ts')).map(name=>path.join(root,folder,name))).concat(path.join(root,'scripts/check-node.mts'),process.argv.slice(2).map(file=>path.resolve(file)));
const roots=new Set(files.map(file=>path.resolve(file)));
const config=ts.readConfigFile(path.join(root,'tsconfig.research-tools.json'),ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,root);
if(config.error||parsed.errors.length)throw Error('Invalid native tooling check configuration');
// This is the additional erasure check, not a replacement for strict typechecking.
// Imported CTS/MTS tools are compiled; these roots and the bootstrap MTS erase only.
const program=ts.createProgram(files,{...parsed.options,erasableSyntaxOnly:true,noEmit:true});
const errors=ts.getPreEmitDiagnostics(program).filter(d=>d.code===1294&&d.file&&roots.has(path.resolve(d.file.fileName)));
if(errors.length)throw Error(ts.formatDiagnostics(errors,{getCanonicalFileName:name=>name,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));
console.log(`PASS native erasable syntax: ${files.length} TS tools`);
