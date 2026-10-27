// Isolated review input. Never patches installed ModHub or the frozen vendor.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {digest,browserBundle} from './build-alias-browser.mts';
export {digest};
const root=new URL('../perf-4.1-evidence-20261026/',import.meta.url);
export const vendor=readFileSync(new URL('vendor/modhub-market.js',root),'utf8');
assert.equal(digest(vendor),'cb46981ebf5998beb0605813cfe9208e3a27f705cd13892f66ccc390a12ad85c');
const source=(JSON.parse(readFileSync(new URL('inference-source.json',root),'utf8')) as {code:string}).code;
assert.equal(digest(source),'91b2a5b6330482745c6cf09d50d10d32eff5645ffbe756f876f4fab9e721b5bb');
const anchor='                const target = name + boundary;';
export function withTargetFilter(input:string,lazy=false){
 assert.equal(input.split(anchor).length,2,'unique frozen target boundary');
 let result=input.replace(anchor,anchor+'\n                // Each complete rule contains this exact target; a miss cannot match it.\n                if (!new RegExp(target, \'i\').test(clause)) continue;');
 if(lazy){
  const line=(name:string)=>{const found=input.split('\n').filter(l=>l.includes(`const ${name} = new RegExp(`));assert.equal(found.length,1);return found[0]!};
  const explicit=line('explicit'),framework=line('framework'),required=line('requiredAs');
  const expression=(line:string)=>line.slice(line.indexOf('new RegExp('),-1);
  result=result.replace(explicit,explicit.slice(0,-1)+'.test(clause);').replace(framework+'\n','').replace(required,'                let requiredAs;');
  const condition='if (!explicit.test(clause) && !framework.test(clause) && !requiredAs.test(clause)) continue;';assert.ok(result.includes(condition));
  result=result.replace(condition,`if (!explicit && !${expression(framework)}.test(clause) && !(requiredAs = ${expression(required)}).test(clause)) continue;`);
  const range='explicit.test(clause) || requiredAs.test(clause)';assert.ok(result.includes(range));
  // Framework matches still need requiredAs for the original version-range decision.
  result=result.replace(range,`explicit || (requiredAs || ${expression(required)}).test(clause)`);
 }
 return result;
}
export const proposedVendor=withTargetFilter(vendor);
export function withCombinedRules(input:string){
 let result=input;
 for(const name of ['explicit','framework','requiredAs']){
  const lines=input.split('\n').filter(l=>l.includes(`const ${name} = new RegExp(`));assert.equal(lines.length,1);const line=lines[0]!,start=line.indexOf('new RegExp(')+'new RegExp('.length,end=line.lastIndexOf(", 'i')");assert.ok(end>start);
  result=result.replace(line,`                const ${name} = ${line.slice(start,end)};`);
 }
 const condition='if (!explicit.test(clause) && !framework.test(clause) && !requiredAs.test(clause)) continue;';assert.ok(result.includes(condition));
 // All alternatives are unanchored noncapturing rules; only their Boolean union
 // is used here. Preserve separate explicit/requiredAs decisions for versions.
 result=result.replace(condition,"if (!new RegExp('(?:' + explicit + ')|(?:' + framework + ')|(?:' + requiredAs + ')', 'i').test(clause)) continue;");
 const range=input.split('\n').find(l=>l.includes('const range = (explicit.test(clause)'));assert.ok(range);
 const begin=range.indexOf('const range = '),question=range.indexOf(' ? '),gate=range.slice(range.indexOf('&& ')+3,question);assert.ok(question>begin);
 result=result.replace(range,range.slice(0,begin)+`const range = ${gate} && (new RegExp(explicit, 'i').test(clause) || new RegExp(requiredAs, 'i').test(clause))`+range.slice(question));
 return result;
}
const from=vendor.indexOf('    function getRequiredDependencies('),to=vendor.indexOf('\n    function getCatalogRequiredDependencies(',from);
assert.ok(from>0&&to>from);
export function bundles(lazy=false,union=false){
 const input=`export function createCandidate(){let marketModList=[];${union?withCombinedRules(source):withTargetFilter(source,lazy)}\n${vendor.slice(from,to)}\nreturn{inferRequiredDependencies,getRequiredDependencies,setCatalog(v){marketModList=v},stats:()=>null,clear(){}}}`;
 const code=buildSync({stdin:{contents:input,sourcefile:'modhub-b3-review.js'},bundle:true,platform:'browser',format:'iife',globalName:'TargetInference',target:'es2022',write:false}).outputFiles[0]!.text;
 assert.ok(!/node:|new Function\(|eval\(/.test(code));
 return{original:browserBundle(false),b2:browserBundle(true),b3:{code,sha256:digest(code)}};
}
