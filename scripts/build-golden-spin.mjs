import {build} from 'vite';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
import {build as esbuild} from 'esbuild';
import {gzipSync} from 'node:zlib';
const out='tests/artifacts/golden-spin-b';
await build({configFile:'vite.golden-spin.config.ts',esbuild:{legalComments:'inline'}});
await mkdir(out+'/comparison',{recursive:true});
const sizes={};
for(const [name,entry]of [['gsap','prototypes/golden-spin-b/gsap-clock.ts'],['waapi','prototypes/golden-spin-b/waapi-clock.ts'],['sphere','prototypes/golden-spin-b/sphere.ts']]){
 const result=await esbuild({entryPoints:[entry],bundle:true,write:false,format:'esm',minify:true,legalComments:'inline',target:'es2022'});
 const bytes=result.outputFiles[0].contents;sizes[name]={bytes:bytes.length,gzipBytes:gzipSync(bytes).length};
 await writeFile(out+'/comparison/'+name+'.js',bytes);
}
await copyFile('prototypes/golden-spin-b/THIRD_PARTY_NOTICES.md',out+'/dist/THIRD_PARTY_NOTICES.md');
await copyFile('LICENSE',out+'/dist/LICENSE');
await writeFile(out+'/bundle-sizes.json',JSON.stringify(sizes,null,2)+'\n');
console.log('Prototype-only bundles:',sizes);
