// Test-only controlled source mutations; compilation errors never count as rejection.
const fs=require('node:fs'),assert=require('node:assert/strict');
const mutation=process.argv.find(a=>a.startsWith('--mutation='))?.split('=')[1];
const edits={
 privacy:['src/runtime/ui.ts','primary: selector(hit.primary), matched: selector(hit.matched)','primary: hit.primary, matched: hit.matched'],
 events:['src/runtime/ui.ts','if (events.length > 32) events.shift()','if (events.length > 3200) events.shift()'],
 surfaces:['src/runtime/surfaces.ts',"if (existing.kind !== kind) throw new TypeError('Surface id already has a different kind');",'/* controlled missing kind guard */'],
 rebind:['compat/maplebirch-soft-wet/maplebirch-soft-wet.ts','if (owner === ui) return;','if (owner === ui || handle?.getDiagnostics().status === "disposed") return;']
};
if(mutation)assert.ok(mutation==='identity'||Object.hasOwn(edits,mutation),'Unknown controlled mutation');
module.exports={mutation,plugins:mutation&&edits[mutation]?[{name:'controlled-runtime-negative',setup(build){build.onLoad({filter:/\.(ts|tsx)$/},args=>{
 const [suffix,before,after]=edits[mutation];if(!args.path.replaceAll('\\','/').endsWith('/'+suffix))return;
 const source=fs.readFileSync(args.path,'utf8');assert.equal(source.split(before).length,2,'Mutation anchor must match exactly once');return{contents:source.replace(before,after),loader:'ts'};
})}}]:[]};
