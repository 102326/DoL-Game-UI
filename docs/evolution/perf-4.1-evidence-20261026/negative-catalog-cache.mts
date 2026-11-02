// Deliberately wrong offline counterexample: a catalog can change in place.
import {readFileSync} from 'node:fs';import vm from 'node:vm';
const source=JSON.parse(readFileSync(new URL('./inference-source.json',import.meta.url),'utf8')) as {code:string};
const original=vm.runInNewContext(source.code+';inferRequiredDependencies',{}) as (m:unknown,c:unknown)=>unknown;
const cache=new WeakMap<object,Map<string,unknown>>();
export function inferRequiredDependencies(mod:unknown,catalog:unknown):unknown{if(!catalog||typeof catalog!=='object')return original(mod,catalog);const key=JSON.stringify(mod);let entries=cache.get(catalog);if(!entries){entries=new Map();cache.set(catalog,entries)}if(!entries.has(key))entries.set(key,original(mod,catalog));return JSON.parse(JSON.stringify(entries.get(key)))}
