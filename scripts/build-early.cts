// Keep each inject-early script independent and retain the manifest's JS names.
import fs = require('node:fs');
import path = require('node:path');
import esbuild = require('esbuild');
const {buildSync}=esbuild;
const root=path.resolve(__dirname,'..');
const checkTwee=process.argv.includes('--check-twee');
if(process.argv.slice(2).some(arg=>arg!=='--check-twee'))throw Error('Unknown early build option');
for(const name of checkTwee?[]:['shop-page-experiment']){
 const source=path.join(root,name+'.ts');
 const output=buildSync({entryPoints:[source],bundle:true,write:false,format:'iife',target:'es2022',metafile:true});
 if(Object.keys(output.metafile.inputs).some(input=>path.resolve(input)!==source))throw Error('Early entry must remain standalone: '+name);
 fs.mkdirSync(path.join(root,'dist'),{recursive:true});
 const [file]=output.outputFiles;
 if(!file)throw Error('Early build produced no output: '+name);
 fs.writeFileSync(path.join(root,'dist',name+'.js'),file.contents);
}

const resizeSource=path.join(root,'src/early/shop-resize.ts');
const resize=buildSync({entryPoints:[resizeSource],absWorkingDir:root,bundle:true,write:false,format:'iife',target:'es2022',metafile:true});
if(Object.keys(resize.metafile.inputs).some(input=>path.resolve(root,input)!==resizeSource))throw Error('Resize body must remain standalone');
const file=resize.outputFiles[0];if(!file)throw Error('Resize body produced no output');
const template=fs.readFileSync(path.join(root,'twee/patch-resize.twee.in'),'utf8');
if(template.split('__SHOP_RESIZE_TYPED__').length!==3)throw Error('Expected two typed resize callbacks');
const result=template.replaceAll('__SHOP_RESIZE_TYPED__',file.text.trimEnd());
const target=path.join(root,'twee/patch-resize.twee');
if(checkTwee){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==result)throw Error('Twee resize output drifted; rebuild with node scripts/build-early.cjs')}
else fs.writeFileSync(target,result);
