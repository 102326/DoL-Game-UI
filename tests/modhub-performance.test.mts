// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"native"}
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import {gunzipSync} from 'node:zlib';
import {createHash, webcrypto} from 'node:crypto';
import {buildSync} from 'esbuild';
import {createRuleCache} from '../src/early/dependency-rule-cache.ts';
import {rewriteModHubRules} from '../src/early/modhub-rule-patch.ts';

const original = gunzipSync(fs.readFileSync(new URL('fixtures/modhub-1.9.2-market.js.gz', import.meta.url))).toString('utf8');
assert.equal(createHash('sha256').update(original).digest('hex'), '4082ed4ba8e0d3d64035bf24bcf34376f70572ba0f4cefcce26f9cb0c7e3a648');
const helper = buildSync({entryPoints:['src/early/dependency-rule-cache.ts'],bundle:true,write:false,format:'iife',globalName:'SwModHubDependencyRules',target:'es2022'}).outputFiles[0]!.text;
const compiled = buildSync({entryPoints:['src/early/modhub-performance.ts'],bundle:true,write:false,format:'iife',target:'es2022',define:{__SW_MODHUB_RULE_HELPER__:JSON.stringify(helper)}}).outputFiles[0]!.text;
const patched = rewriteModHubRules(original, helper);
assert.ok(patched);
const record = (value:unknown):value is Record<string,unknown> => !!value && typeof value==='object';
type Identity={name:string;bootNames:string[];aliases?:string[];identityId?:string|null};
type Mod={description:string;[key:string]:unknown};
type Update={version:string;pending:boolean;error?:string;promise:Promise<void>};
interface Market {
  inferRequiredDependencies(mod:unknown,catalog?:unknown):unknown;
  getRequiredDependencies(mod:unknown,catalog?:unknown):unknown;
  getMarketMods():Identity[];
  getReleaseHistoryContext(mod:unknown):{signature:string};
  getModUpdateInfo(mod:unknown,profiles:unknown[]):Update;
}
function isMarket(value:unknown):value is Market {
  return record(value)&&['inferRequiredDependencies','getRequiredDependencies','getMarketMods','getReleaseHistoryContext','getModUpdateInfo'].every(key=>typeof value[key]==='function');
}
function engine(source:string) {
  const window:Record<string,unknown>={addEventListener(){}};
  const context=vm.createContext({window,document:{hidden:true,addEventListener(){},getElementById:()=>null,querySelector:()=>null},localStorage:{getItem:()=>null,setItem(){throw Error('Unexpected storage write')}},console,URL,URLSearchParams,TextEncoder,Map,Set});
  vm.runInContext(source,context);
  const api=window.modHubMarket;
  assert.ok(isMarket(api));
  return {api,context,window};
}
type Hook={afterModLoad(boot:unknown,zip:unknown,info:unknown):Promise<void>};
function hook(crypto:unknown=webcrypto) {
  let result:Hook|undefined;
  const controller={addLifeTimeCircleHook(_id:string,value:Hook){result=value}};
  const context=vm.createContext({window:{modSC2DataManager:{getModLoadController:()=>controller}},crypto,TextEncoder,Map,console});
  vm.runInContext(compiled,context);assert.ok(result);return result;
}
function modInfo(content=original) {
  const item={name:'javascript/modhub-market.js',content};
  return {name:'ModHub',version:'1.9.2',cache:{scriptFileItems:{items:[item],map:new Map([[item.name,item]])}},item};
}

test('guarded Loader hook patches only the reviewed source before execution and retains native fallback',async()=>{
  const install=hook(),info=modInfo();await install.afterModLoad(null,null,info);
  assert.equal(info.item.content,patched);assert.equal(info.cache.scriptFileItems.map.get(info.item.name),info.item);
  await install.afterModLoad(null,null,info);assert.equal(info.item.content,patched,'repeat does not double-patch');
  for(const info of [{...modInfo(),version:'1.9.3'},{...modInfo(),name:'OtherMod'},modInfo(original+' '),{...modInfo(),cache:null}]){
    const before=JSON.stringify(info);await install.afterModLoad(null,null,info);assert.equal(JSON.stringify(info),before);
  }
  const duplicate=modInfo();duplicate.cache.scriptFileItems.items.push({...duplicate.item});await install.afterModLoad(null,null,duplicate);assert.equal(duplicate.item.content,original);
  const mismatch=modInfo();mismatch.cache.scriptFileItems.map.clear();await install.afterModLoad(null,null,mismatch);assert.equal(mismatch.item.content,original);
  const absent=modInfo();await hook(null).afterModLoad(null,null,absent);assert.equal(absent.item.content,original);
  const failed=modInfo();await hook({subtle:{digest:()=>Promise.reject(Error('unavailable'))}}).afterModLoad(null,null,failed);assert.equal(failed.item.content,original);
  let finish:((value:ArrayBuffer)=>void)|undefined;
  const delayed=hook({subtle:{digest:()=>new Promise<ArrayBuffer>(resolve=>{finish=resolve})}}),changed=modInfo();
  const pending=delayed.afterModLoad(null,null,changed);changed.item.content='another owner changed source';assert.ok(finish);finish(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(original)));await pending;assert.equal(changed.item.content,'another owner changed source');
  vm.runInNewContext(compiled,{window:{},console});
  vm.runInNewContext(compiled,{window:{modSC2DataManager:{getModLoadController(){throw Error('unsupported Loader')}}},console});
});

test('bounded stateless rule cache releases entries and never stores dependency or catalog state',()=>{
  const cache=createRuleCache(alias=>[new RegExp(alias,'i'),/b/i,/c/i]);
  assert.equal(cache.get('alpha'),cache.get('alpha'));
  for(let i=0;i<1100;i++)cache.get('key'+i);
  const long='x'.repeat(257);assert.notEqual(cache.get(long),cache.get(long));
  assert.equal(cache.stats().size,1024);assert.ok(cache.stats().evictions>0);assert.equal(cache.stats().bypasses,2);
  cache.clear();assert.equal(cache.stats().size,0);
  assert.throws(()=>createRuleCache(()=>[/x/g,/y/i,/z/i]).get('x'),/Stateful/);
});

test('complete current ModHub closure preserves golden cases, mutations, ambiguity and fresh results',()=>{
  const engines=[engine(original),engine(patched)];
  const cases:unknown=JSON.parse(fs.readFileSync(new URL('../docs/evolution/perf-4.1-evidence-20261026/inference-cases.json',import.meta.url),'utf8'));
  assert.ok(Array.isArray(cases));
  const compare=(mod:unknown,catalog:unknown,expected?:unknown)=>{
    const before=JSON.stringify([mod,catalog]);
    const results=engines.map(e=>e.api.inferRequiredDependencies(mod,catalog));
    assert.equal(JSON.stringify(results[0]),JSON.stringify(results[1]));
    if(expected!==undefined)assert.equal(JSON.stringify(results[0]),JSON.stringify(expected));
    for(const e of engines)assert.equal(JSON.stringify(e.api.getRequiredDependencies(mod,catalog)),JSON.stringify(engines[0]!.api.getRequiredDependencies(mod,catalog)));
    assert.equal(JSON.stringify([mod,catalog]),before);
    if(Array.isArray(results[1]))results[1].push({modName:'pollution'});
    assert.equal(JSON.stringify(engines[1]!.api.inferRequiredDependencies(mod,catalog)),JSON.stringify(results[0]));
  };
  for(const c of cases){assert.ok(record(c));compare(c.mod,c.catalog,c.expected)}
  const catalog:Identity[]=[{name:'工具甲',bootNames:['AlphaTools'],aliases:['Alias One']}],mod:Mod={description:'需要Alias One >=1.0'};
  compare(mod,catalog);catalog[0]!.aliases=['Alias Two'];compare(mod,catalog,[]);
  mod.description='需要Alias Two >=2.0';compare(mod,catalog);catalog[0]!.bootNames=['ChangedBoot'];compare(mod,catalog);
  catalog.push({name:'工具乙',bootNames:['AnotherBoot'],aliases:['Alias Two']});compare(mod,catalog,[]);
  for(const alias of ['A.*[x](y)+?\\','Ωμέγα','İTool','KTools','框架「甲」','A_1','框架\t甲','Emoji🌧Tools','Mixed  CASE'])
    for(const template of ['需要{a} >=1.2 且 <3.0','基于{a}框架制作','{a}是必需前置','requires {a}','optional {a}','不再依赖{a}','需要{a}Extra','使用{a} v2.0开发'])
      compare({description:template.replace('{a}',alias)},[{name:alias,bootNames:['FixtureBoot'],aliases:[alias]}]);
  compare({description:'需要Large0'},Array.from({length:1100},(_,i)=>({name:'Large'+i,bootNames:['Boot'+i]})));
  const long='Long'+('x'.repeat(257));compare({description:'requires '+long},[{name:long,bootNames:['LongBoot']}]);// long aliases bypass storage
});

test('internal update consumers reuse rules while changed descriptions still rebuild inference',()=>{
  const current=engine(patched),native=engine(original),catalog:Identity[]=[{name:'工具甲',bootNames:['AlphaTools'],aliases:['Alpha Alias']}],mod={description:'需要Alpha Alias >=1.0'};
  for(const e of [current,native])e.api.getMarketMods().push(...catalog);
  const count=(e:ReturnType<typeof engine>)=>{
    vm.runInContext('globalThis.builds=0;globalThis.RegExp=new Proxy(RegExp,{construct(target,args){globalThis.builds++;return Reflect.construct(target,args)}})',e.context);
    e.api.getRequiredDependencies(mod);const cold:unknown=vm.runInContext('builds',e.context);
    e.api.getRequiredDependencies(mod);const warm:unknown=vm.runInContext('builds',e.context);assert.ok(typeof cold==='number'&&typeof warm==='number');return {cold,warm};
  };
  const before=count(native),after=count(current);assert.ok(before.warm>before.cold);assert.ok(after.cold>0);assert.equal(after.warm,after.cold);
  mod.description='需要Alpha Alias >=2.0';assert.equal(JSON.stringify(current.api.getRequiredDependencies(mod)),JSON.stringify(native.api.getRequiredDependencies(mod)));
});

test('current full update closure rejects stale responses across all six identity mutations',async()=>{
  for(const source of [original,patched])for(const mutation of ['description','catalog-alias','catalog-boot','catalog-replace','boot-identity','game-version']){
    const e=engine(source),pending:Array<(value:{candidates:Array<{version:string}>;hasMore:boolean})=>void>=[];let game='0.5.11.9';
    // 1.9.2 pauses background update work; expose the fixture after startup registration.
    vm.runInContext('document.hidden=false',e.context);
    Object.assign(e.window,{modHubIsReloadBusy:()=>false,modHubMarketVariants:{normalizePackageEditions:()=>[],normalizeRequiredDependencies:(value:unknown)=>Array.isArray(value)?value:[]},modHubMarketVersions:{getGameVersion:()=>game,getGameIdentity:()=>({name:'ControlledGame'}),getLatestGameCandidate:(_m:unknown,c:Array<{version:string}>)=>c[0]??null,getLatestUpdateCandidate:(_m:unknown,c:Array<{version:string}>)=>c[0]??null,getLatestReleaseCandidate:(_m:unknown,c:Array<{version:string}>)=>c[0]??null,fetchReleases:()=>new Promise(resolve=>pending.push(resolve)),buildCandidates:(_m:unknown,h:{candidates:unknown[]})=>h.candidates}});
    const catalog=e.api.getMarketMods();catalog.push({name:'工具甲',bootNames:['AlphaTools'],aliases:['Alpha Alias']});
    const mod:Mod={id:'fixture-'+mutation,name:'Controlled target',description:'需要Alpha Alias >=1.0',bootNames:['TargetBoot'],githubUrl:'https://github.com/example/fixture',version:'1.0'};
    const old=e.api.getModUpdateInfo(mod,[]);for(let i=0;i<10&&!pending.length;i++)await Promise.resolve();assert.equal(pending.length,1);
    const before=e.api.getReleaseHistoryContext(mod).signature;
    if(mutation==='description')mod.description='需要工具甲 >=2.0';else if(mutation==='catalog-alias')catalog[0]!.aliases=['Another Alias'];else if(mutation==='catalog-boot')catalog[0]!.bootNames=['ChangedBoot'];else if(mutation==='catalog-replace')catalog.splice(0,1,{name:'Alpha Alias',bootNames:['ReplacementBoot']});else if(mutation==='boot-identity')mod.bootNames=['AlphaTools'];else game='0.5.12.0';
    assert.notEqual(e.api.getReleaseHistoryContext(mod).signature,before);
    const fresh=e.api.getModUpdateInfo(mod,[]);for(let i=0;i<10&&pending.length<2;i++)await Promise.resolve();assert.equal(pending.length,2);assert.notEqual(fresh,old);
    pending[1]!({candidates:[{version:'2.0'}],hasMore:false});await fresh.promise;pending[0]!({candidates:[{version:'1.0'}],hasMore:false});await old.promise;
    assert.equal(fresh.version,'2.0');assert.equal(old.version,'');assert.equal(old.pending||fresh.pending,false);assert.equal(e.api.getModUpdateInfo(mod,[]),fresh);
  }
});
