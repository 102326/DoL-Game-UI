import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {rendererProblems} from './renderer.ts';
import {digest,caseProblems,parseExpectedLock} from './contracts.ts';
import type {EntryDeclaration} from './contracts.ts';

const file=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../expected.lock.json');
export const expectedLock=parseExpectedLock(JSON.parse(fs.readFileSync(file,'utf8')));
if(expectedLock.schema!==1||!expectedLock.entries.length||new Set(expectedLock.entries.map(e=>e.entry)).size!==expectedLock.entries.length||expectedLock.entries.some(e=>!e.cases.length))throw Error('Invalid/empty Expected Lock');
export const expectedLockSha256=digest(fs.readFileSync(file));
// Runtime paths stay stable; the declaration hash must follow authored TS.
export function entrySource(root:string,entry:string):string{
 const source=entry.replace(/\.cjs$/,'.cts').replace(/\.mjs$/,'.mts');
 return fs.existsSync(path.join(root,source))?source:entry;
}
export function entryDeclaration(name:string):EntryDeclaration|undefined{return expectedLock.entries.find(e=>path.basename(e.entry)===name);}
export function entryCaseProblems(name:string,result:unknown):string[]{
 const declaration=entryDeclaration(name);if(!declaration)return ['UndeclaredEntry'];
 if(declaration.granularity==='native')return [];// Existing native reporter verifies exact names and no skip/todo.
 const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
 const receipt=record(result)&&record(result.terminalReceipt)?result.terminalReceipt:undefined;
 return [...caseProblems(declaration.cases,receipt?.cases),...rendererProblems(declaration.rendererContexts,receipt?.graphics)];
}
