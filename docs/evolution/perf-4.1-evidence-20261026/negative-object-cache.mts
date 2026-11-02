// Deliberately wrong offline counterexample: object identity misses metadata changes.
import {readFileSync} from 'node:fs';import vm from 'node:vm';
const source=JSON.parse(readFileSync(new URL('./inference-source.json',import.meta.url),'utf8')) as {code:string};
const original=vm.runInNewContext(source.code+';inferRequiredDependencies',{}) as (m:unknown,c:unknown)=>unknown;
const cache=new WeakMap<object,unknown>();
export function inferRequiredDependencies(mod:unknown,catalog:unknown):unknown{if(!mod||typeof mod!=='object')return original(mod,catalog);if(!cache.has(mod))cache.set(mod,original(mod,catalog));return JSON.parse(JSON.stringify(cache.get(mod)))}
