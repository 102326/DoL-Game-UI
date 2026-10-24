import './check-node.mts';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const configFile=path.join(root,'tsconfig.tools.json');
// Check the whole dependency graph, then emit only explicit tooling roots.
execFileSync(process.execPath,[path.join(root,'node_modules/typescript/bin/tsc'),'-p',configFile],{cwd:root,stdio:'inherit'});
const config=ts.readConfigFile(configFile,ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,root);
const format=(diagnostics:readonly ts.Diagnostic[])=>ts.formatDiagnostics(diagnostics,{getCanonicalFileName:name=>name,getCurrentDirectory:()=>root,getNewLine:()=> '\n'});
if(config.error||parsed.errors.length)throw Error(format(config.error?[config.error]:parsed.errors));
for(const file of parsed.fileNames.filter(file=>/\.[cm]ts$/.test(file))){
 const result=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{...parsed.options,noEmit:false,noEmitOnError:false,allowImportingTsExtensions:false},reportDiagnostics:true});
 const errors=(result.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
 if(errors.length)throw Error(format(errors));
 fs.writeFileSync(file.replace(/\.cts$/,'.cjs').replace(/\.mts$/,'.mjs'),result.outputText);
}
