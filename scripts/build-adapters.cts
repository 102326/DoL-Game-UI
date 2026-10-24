// Compile only the TS entries named by a package's existing JS manifest.
import fs = require('node:fs');
import path = require('node:path');
import esbuild = require('esbuild');
const {buildSync}=esbuild;
const folder=path.resolve(process.argv[2]||'');
if(!process.argv[2])throw Error('Usage: node scripts/build-adapters.cjs compat/<adapter>');
const boot:unknown=JSON.parse(fs.readFileSync(path.join(folder,'boot.json'),'utf8'));
if(!boot||typeof boot!=='object'||Array.isArray(boot))throw Error('Adapter manifest must be an object');
const entries:string[]=[];
for(const key of ['scriptFileList','scriptFileList_inject_early'] as const){
 const list:unknown=Reflect.get(boot,key);
 if(list===undefined)continue;
 if(!Array.isArray(list)||!list.every((name:unknown):name is string=>typeof name==='string'))throw Error('Adapter script list must contain strings: '+key);
 entries.push(...list);
}
const visualOwner=path.resolve(__dirname,'../src/ui/visual-scope.ts');
for(const name of entries){
 const source=path.join(folder,name.replace(/\.js$/,'.ts'));
 if(!fs.existsSync(source))continue;
 // Only the isolated resource-owner primitive may be copied; never a second Runtime.
 const output=buildSync({entryPoints:[source],bundle:true,write:false,format:'iife',target:'es2022',metafile:true});
 if(Object.keys(output.metafile.inputs).some(input=>![source,visualOwner].includes(path.resolve(input))))throw Error('Adapter must not bundle runtime imports: '+name);
 const target=path.join(folder,'dist/scripts',name);
 const [file]=output.outputFiles;if(!file)throw Error('Adapter build produced no output: '+name);
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,file.contents);
}
