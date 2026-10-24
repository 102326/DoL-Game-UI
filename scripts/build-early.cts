// Keep each inject-early script independent and retain the manifest's JS names.
import fs = require('node:fs');
import path = require('node:path');
import esbuild = require('esbuild');
const {buildSync}=esbuild;
const root=path.resolve(__dirname,'..');
for(const name of ['shop-page-experiment']){
 const source=path.join(root,name+'.ts');
 const output=buildSync({entryPoints:[source],bundle:true,write:false,format:'iife',target:'es2022',metafile:true});
 if(Object.keys(output.metafile.inputs).some(input=>path.resolve(input)!==source))throw Error('Early entry must remain standalone: '+name);
 fs.mkdirSync(path.join(root,'dist'),{recursive:true});
 const [file]=output.outputFiles;
 if(!file)throw Error('Early build produced no output: '+name);
 fs.writeFileSync(path.join(root,'dist',name+'.js'),file.contents);
}
