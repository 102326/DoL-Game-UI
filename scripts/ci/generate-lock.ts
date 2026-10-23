import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {digest} from './contracts.ts';
import type {EntryDeclaration,ExpectedLock,Profile} from './contracts.ts';

const require=createRequire(import.meta.url),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const catalog=require('../ci-catalog.cjs') as {suites:Record<string,string[]>;researchPlan:{id:string;args:string[];report?:{field?:string;expected?:string[]}}[]};
type Literal=string|number|boolean|null|Literal[]|{[name:string]:Literal};
interface Declaration {profiles:Profile[];classification:EntryDeclaration['classification'];granularity:EntryDeclaration['granularity'];caseSource?:string;source?:string;group?:string;evidence?:string;rendererContexts?:string[];includes?:{prefix:string;source:string}[]}
function literal(node:ts.Node|undefined,env:Map<string,Literal>):Literal|undefined{
 if(!node)return undefined;
 if(ts.isStringLiteralLike(node))return node.text;if(ts.isNumericLiteral(node))return Number(node.text);
 if(node.kind===ts.SyntaxKind.TrueKeyword)return true;if(node.kind===ts.SyntaxKind.FalseKeyword)return false;
 if(ts.isIdentifier(node))return env.get(node.text);
 if(ts.isArrayLiteralExpression(node)){const values=node.elements.map(n=>literal(n,env));if(values.every(v=>v!==undefined))return values as Literal[];}
 if(ts.isObjectLiteralExpression(node)){const obj:Record<string,Literal>={};for(const p of node.properties){if(!ts.isPropertyAssignment(p))return;const value=literal(p.initializer,env);if(value===undefined)return;obj[p.name.getText().replace(/['"]/g,'')]=value;}return obj;}
 if(ts.isPropertyAccessExpression(node)){const obj=literal(node.expression,env);if(obj&&typeof obj==='object'&&!Array.isArray(obj))return obj[node.name.text];}
 if(ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.PlusToken){const a=literal(node.left,env),b=literal(node.right,env);if(a!==undefined&&b!==undefined&&(typeof a==='string'||typeof b==='string'))return String(a)+String(b);}
 if(ts.isTemplateExpression(node)){let value=node.head.text;for(const span of node.templateSpans){const part=literal(span.expression,env);if(part===undefined)return;value+=String(part)+span.literal.text;}return value;}
 return undefined;
}
function namesFrom(source:string,callee:string,group?:string):{names:string[];assertionSites:number}{
 const tree=ts.createSourceFile('contract.cjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),names=new Set<string>();let assertionSites=0;
 function visit(node:ts.Node,env:Map<string,Literal>):void{
  if(ts.isIfStatement(node)&&group){const expression=node.expression.getText(tree);if((expression.includes('.includes(group)')||/^group===/.test(expression))&&/['"](?:identity|inspector|surfaces|compat|all)['"]/.test(expression)){const values=[...expression.matchAll(/['"]([^'"]+)['"]/g)].map(m=>m[1]);if(values.includes(group)){visit(node.thenStatement,new Map(env));}else if(node.elseStatement)visit(node.elseStatement,new Map(env));return;}}
  if(ts.isForOfStatement(node)){const values=literal(node.expression,env);const declaration=ts.isVariableDeclarationList(node.initializer)?node.initializer.declarations[0]:undefined;
   if(Array.isArray(values)&&declaration&&ts.isIdentifier(declaration.name)){for(const value of values){const nested=new Map(env);nested.set(declaration.name.text,value);visit(node.statement,nested);}return;}}
  if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)){const value=literal(node.initializer,env);if(value!==undefined)env.set(node.name.text,value);}
  if(ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.EqualsToken&&ts.isIdentifier(node.left)){const value=literal(node.right,env);if(value!==undefined)env.set(node.left.text,value);}
  if(ts.isCallExpression(node)){const name=node.expression.getText(tree);if(name==='assert'||name.startsWith('assert.'))assertionSites++;
   if(name===callee){const value=literal(node.arguments[0],env);if(typeof value==='string')names.add(value);else throw Error('Unresolved case declaration: '+node.getText(tree).slice(0,150));}}
  ts.forEachChild(node,child=>visit(child,env));
 }
 visit(tree,new Map());return {names:[...names],assertionSites};
}
export function generateLock():ExpectedLock{
 const files=new Set([...Object.values(catalog.suites).flat().map(n=>'tests/'+n),...catalog.researchPlan.flatMap(c=>c.args.filter(a=>/^(tests|scripts)\/.*\.cjs$/.test(a)))]);
 const entries:EntryDeclaration[]=[],nativeCases:Record<string,string[]>={},researchCases:Record<string,string[]>={};
 for(const entry of [...files].sort()){
  const text=fs.readFileSync(path.join(root,entry),'utf8'),match=text.match(/^\/\/ @ci-contract (.+)$/m);if(!match)throw Error('Missing declaration: '+entry);
  const declaration=JSON.parse(match[1]) as Declaration,source=declaration.source?fs.readFileSync(path.join(root,declaration.source),'utf8'):text;
  const callee=declaration.granularity==='native'?'test':declaration.caseSource;
  const parsed=namesFrom(source,callee||'__no_cases__',declaration.group),names=callee?parsed.names:['entry'];
  let sourceInput=source;
  for(const include of declaration.includes||[]){
   const included=fs.readFileSync(path.join(root,include.source),'utf8'),metadata=included.match(/^\/\/ @ci-contract (.+)$/m);
   if(!metadata)throw Error('Missing included declaration: '+include.source);
   const child=JSON.parse(metadata[1]) as Declaration;if(!child.caseSource)throw Error('Included contract needs named cases: '+include.source);
   const cases=namesFrom(included,child.caseSource);if(!cases.names.length)throw Error('Empty included contract: '+include.source);
   names.push(...cases.names.map(id=>include.prefix+':'+id));parsed.assertionSites+=cases.assertionSites;sourceInput+='\n'+include.source+'\n'+included;
  }
  if(!names.length||new Set(names).size!==names.length)throw Error('Empty/duplicate declaration: '+entry);
  if(declaration.granularity==='native')nativeCases[path.basename(entry)]=names;
  const check=catalog.researchPlan.find(c=>c.args.includes(entry)&&['checks','results'].includes(c.report?.field||''));if(check&&callee)researchCases[path.basename(entry,'.cjs')]=names;
  entries.push({entry,profiles:declaration.profiles,classification:declaration.classification,granularity:declaration.granularity,cases:names.map(id=>({id,minimumAssertions:1})),sourceSha256:digest(sourceInput),assertionSites:parsed.assertionSites,...(declaration.evidence?{evidence:declaration.evidence}:{}),...(declaration.rendererContexts?{rendererContexts:declaration.rendererContexts}:{})});
 }
 const {declaredDeviceCases}=require('../../tests/device-profiles.cjs') as {declaredDeviceCases:(depth:string)=>string[]};
 const devicePlans=Object.fromEntries(['standard','deep'].map(depth=>[depth,declaredDeviceCases(depth)]));
 return {schema:1,devicePlans,nativeCases,researchCases,entries};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const destination=path.join(root,'scripts/expected.lock.json'),text=JSON.stringify(generateLock(),null,2)+'\n';
 if(process.argv.includes('--update'))fs.writeFileSync(destination,text);
 else if(fs.readFileSync(destination,'utf8')!==text)throw Error('ExpectedLockDrift: regenerate and review scripts/expected.lock.json');
 console.log('PASS generated expected declarations lock');
}
