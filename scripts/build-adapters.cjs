// Compile only the TS entries named by a package's existing JS manifest.
const fs=require('node:fs'),path=require('node:path');
const {buildSync}=require('esbuild');
const folder=path.resolve(process.argv[2]||'');
if(!process.argv[2])throw Error('Usage: node scripts/build-adapters.cjs compat/<adapter>');
const boot=JSON.parse(fs.readFileSync(path.join(folder,'boot.json'),'utf8'));
for(const name of [...boot.scriptFileList||[],...boot.scriptFileList_inject_early||[]]){
 const source=path.join(folder,name.replace(/\.js$/,'.ts'));
 if(!fs.existsSync(source))continue;
 // Adapter imports must be type-only: packages cannot bundle a second Runtime.
 const output=buildSync({entryPoints:[source],bundle:true,write:false,format:'iife',target:'es2022',metafile:true});
 if(Object.keys(output.metafile.inputs).some(input=>path.resolve(input)!==source))throw Error('Adapter must not bundle runtime imports: '+name);
 const target=path.join(folder,'dist/scripts',name);
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,output.outputFiles[0].contents);
}
