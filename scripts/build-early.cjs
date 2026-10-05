// Keep each inject-early script independent and retain the manifest's JS names.
const fs=require('node:fs'),path=require('node:path'),{buildSync}=require('esbuild');
const root=path.resolve(__dirname,'..');
for(const name of ['startup-cache-experiment','shop-page-experiment']){
 const source=path.join(root,name+'.ts');
 const output=buildSync({entryPoints:[source],bundle:true,write:false,format:'iife',target:'es2022',metafile:true});
 if(Object.keys(output.metafile.inputs).some(input=>path.resolve(input)!==source))throw Error('Early entry must remain standalone: '+name);
 fs.mkdirSync(path.join(root,'dist'),{recursive:true});
 fs.writeFileSync(path.join(root,'dist',name+'.js'),output.outputFiles[0].contents);
}
