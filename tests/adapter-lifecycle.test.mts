// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import assert from 'node:assert/strict';
import {test} from 'node:test';
import vm from 'node:vm';
import {buildSync} from 'esbuild';

function facade(root:object, name:string): {destroy():void} {
  const value: unknown = Reflect.get(root, name);
  assert.ok(value && typeof value === 'object' && 'destroy' in value && typeof value.destroy === 'function');
  return value as {destroy():void};
}

function checkLifecycle(folder:string, globalName:string, count:number) {
  const output = buildSync({entryPoints:[`compat/${folder}-soft-wet/${folder}-soft-wet.ts`], bundle:true, write:false, format:'iife'}).outputFiles[0];
  assert.ok(output);
  const document = new EventTarget();
  const window: {DoLGameUI?: {ui: typeof ui}} = {};
  const context = vm.createContext({window, document});
  let enabled = false, failureAt = 0, calls = 0;
  const live = new Set<string>();
  const ui = {apiVersion:1, getCapabilities:()=>({styleAdapters:enabled}), registerStyleAdapter(spec:{id:string}) {
   calls++;
   if (calls === failureAt) throw Error('controlled registration failure');
   assert.equal(live.has(spec.id), false, 'no duplicate registrations');
   live.add(spec.id);
   return {getDiagnostics:()=>({status:'active'}), destroy(){live.delete(spec.id)}};
  }};
  const ready = () => document.dispatchEvent(new Event('dol-ui-runtime-ready'));
  vm.runInContext(output.text, context);
  window.DoLGameUI = {ui}; ready();
  assert.equal(live.size, 0);
  enabled = true; failureAt = count; ready();
  assert.equal(live.size, 0, 'partial registration is rolled back');
  failureAt = 0; ready();
  assert.equal(live.size, count, 'same runtime can retry');
  const registeredCalls = calls; ready();
  assert.equal(calls, registeredCalls, 'ready is idempotent after success');
  window.DoLGameUI = {ui:{...ui}}; ready();
  assert.equal(live.size, count, 'new runtime replaces old registrations');
  const old = facade(window, globalName);
  old.destroy(); assert.equal(live.size, 0);
  vm.runInContext(output.text, context);
  const replacement = facade(window, globalName);
  assert.equal(live.size, count);
  old.destroy();
  assert.equal(facade(window, globalName), replacement, 'stale destroy preserves replacement');
  assert.equal(live.size, count);
  replacement.destroy();
  assert.equal(live.size, 0);
  ready(); assert.equal(live.size, 0, 'destroy removes ready listener');
}
test('ModHub retries, rebinds and cleans up', () => checkLifecycle('modhub', 'ModHubSoftWet', 4));
test('MapleBirch retries, rebinds and cleans up', () => checkLifecycle('maplebirch', 'MapleBirchSoftWet', 1));
test('Cheat Extended retries, rebinds and cleans up', () => checkLifecycle('cheat-extended', 'CheatExtendedSoftWet', 2));

function checkReload(folder:string, name:string) {
 const code=buildSync({entryPoints:[`compat/${folder}/${folder}.ts`],bundle:true,write:false,format:'iife',target:'es2022'}).outputFiles[0];
 assert.ok(code);
 const document=Object.assign(new EventTarget(),{documentElement:{},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]});
 const window=Object.assign(new EventTarget(),{document});
 class Observer {observe(){} disconnect(){}}
 const context=vm.createContext({window,document,MutationObserver:Observer,requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}});
 const load=()=>vm.runInContext(code.text,context);
 load();
 const old=facade(window,name);assert.ok(old);
 old.destroy();load();
 const current=facade(window,name);assert.ok(current);assert.notEqual(current,old);
 old.destroy();assert.equal(Reflect.get(window,name),current,`${name}: stale destroy must preserve the new instance`);
 load();assert.equal(Reflect.get(window,name),current,`${name}: duplicate script must not replace or register again`);
 current.destroy();assert.equal(Reflect.get(window,name),undefined);
}
test('Optimization keeps its current instance after reload', () => checkReload('dol-optimization-soft-wet', 'DolOptimizationSoftWet'));
test('ReOverfits keeps its current instance after reload', () => checkReload('reoverfits-soft-wet', 'ReOverfitsSoftWet'));
