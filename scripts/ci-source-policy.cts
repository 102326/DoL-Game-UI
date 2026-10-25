import fs = require('node:fs');
import path = require('node:path');
import type TS = require('typescript');
import catalog = require('./ci-catalog.cjs');
const {suites,researchPlan,nodeTestCases}=catalog;
const {entrySource}:typeof import('./ci/lock.ts')=require('./ci/lock.ts');
function usesNodeTest(source:string):boolean{const ts:typeof TS=require('typescript'),tree=ts.createSourceFile('selection.cjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);let found=false;function walk(n:TS.Node):void{if(ts.isCallExpression(n)&&n.expression.getText(tree)==='require'&&n.arguments[0]&&ts.isStringLiteral(n.arguments[0])&&n.arguments[0].text==='node:test')found=true;if(ts.isImportDeclaration(n)&&ts.isStringLiteral(n.moduleSpecifier)&&n.moduleSpecifier.text==='node:test')found=true;if(ts.isImportEqualsDeclaration(n)&&ts.isExternalModuleReference(n.moduleReference)&&n.moduleReference.expression&&ts.isStringLiteral(n.moduleReference.expression)&&n.moduleReference.expression.text==='node:test')found=true;ts.forEachChild(n,walk)}walk(tree);return found}
function forbiddenJs(source:string):string[]{
 const ts:typeof TS=require('typescript'),tree=ts.createSourceFile('policy.cjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS),issues:string[]=[];
 function walk(node:TS.Node):void{if(ts.isShorthandPropertyAssignment(node)&&['only','skip','todo'].includes(node.name.text))issues.push('UndeclaredTestSelection:'+node.name.text);if(ts.isPropertyAssignment(node)&&['only','skip','todo'].includes(node.name.getText(tree).replace(/['"]/g,''))&&node.initializer.kind!==ts.SyntaxKind.FalseKeyword)issues.push('UndeclaredTestSelection:'+node.name.getText(tree).replace(/['"]/g,''));if(ts.isCallExpression(node)){const callee=node.expression;let name:string|undefined;if(ts.isPropertyAccessExpression(callee))name=callee.name.text;else if(ts.isElementAccessExpression(callee)&&ts.isStringLiteral(callee.argumentExpression))name=callee.argumentExpression.text;if(name&&['only','skip','todo'].includes(name))issues.push('UndeclaredTestSelection:'+name);}ts.forEachChild(node,walk)}walk(tree);return issues;
}
function forbiddenWorkflow(source:string):string[]{const issues:string[]=[];for(const line of source.split('\n')){if(/^\s*#/.test(line))continue;
 if(/continue-on-error:/.test(line)&&line.slice(line.indexOf('continue-on-error:')+'continue-on-error:'.length).trim()!=='false')issues.push('ContinueOnError');
 if(/\|\|\s*true\b|\bset\s+\+e\b/.test(line))issues.push('MaskedExitCode');
 if(/uses:\s*[^.\s]/.test(line)&&!/@[a-f0-9]{40}(?:\s|$)/.test(line))issues.push('UnpinnedAction');
 if(/pull_request_target|workflow_run|secrets\.|permissions:\s*write-all/.test(line))issues.push('PrivilegedWorkflow');
 }if(!/shell:\s*bash\b/.test(source))issues.push('ImplicitPipelineShell');return issues;}
function checkSourcePolicy(root:string):{file:string;reason:string}[]{const problems:{file:string;reason:string}[]=[];
 const files=new Set([...Object.values(suites).flat().map(f=>'tests/'+f),...researchPlan.flatMap(c=>c.args.filter(a=>/^(tests|scripts)\/.*\.(cjs|mjs|js)$/.test(a))), 'tests/ui-runtime.cjs']);
 for(const file of files){if(!fs.existsSync(path.join(root,file))){problems.push({file,reason:'MissingTestEntry'});continue}const text=fs.readFileSync(path.join(root,entrySource(root,file)),'utf8');if(usesNodeTest(text)&&!nodeTestCases[path.basename(file)])problems.push({file,reason:'UndeclaredNodeTestEntry'});for(const reason of forbiddenJs(text))problems.push({file,reason});}
 for(const file of fs.readdirSync(path.join(root,'.github/workflows')).filter(f=>/\.ya?ml$/.test(f)))for(const reason of forbiddenWorkflow(fs.readFileSync(path.join(root,'.github/workflows',file),'utf8')))problems.push({file,reason});
 const manifest:unknown=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 if(!manifest||typeof manifest!=='object'||!('scripts' in manifest)||!manifest.scripts||typeof manifest.scripts!=='object'||Array.isArray(manifest.scripts))throw Error('Invalid package scripts');
 for(const [name,command]of Object.entries(manifest.scripts)){if(typeof command!=='string')throw Error('Invalid package command: '+name);if(name.startsWith('ci:')&&/\|\|\s*true\b|\bset\s+\+e\b|(?<!\|)\|(?!\|)/.test(command))problems.push({file:'package.json#'+name,reason:'MaskedOrUncontrolledPipeline'});}
 return problems;
}
if(require.main===module){const p=checkSourcePolicy(path.resolve(__dirname,'..'));console.log(JSON.stringify(p));process.exitCode=p.length?1:0}
export = {usesNodeTest,forbiddenJs,forbiddenWorkflow,checkSourcePolicy};
