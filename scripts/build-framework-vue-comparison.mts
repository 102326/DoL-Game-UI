// Same consumer sources and compiler settings; default packages are not replaced.
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import type {Rollup} from 'vite';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist/framework-vue-comparison');
const version=JSON.parse(fs.readFileSync(path.join(root,'node_modules/vue/package.json'),'utf8')).version;
const define={'process.env.NODE_ENV':JSON.stringify('production'),__VUE_OPTIONS_API__:false,__VUE_PROD_DEVTOOLS__:false,__VUE_PROD_HYDRATION_MISMATCH_DETAILS__:false};
await build({root,configFile:false,define,build:{target:'es2022',outDir:path.join(out,'runtime'),emptyOutDir:true,minify:true,
 lib:{entry:path.join(root,'framework/experiments/shared-vue.ts'),name:'StoneFreeSharedVuePackage',formats:['iife'],fileName:()=> 'index.js'}}});
const consumers=[['native-status','examples/status-mod.ts','StoneFreeNativeStatus'],['comparison','examples/comparison-mod.ts','StoneFreeStatusComparison'],['workspace','examples/workspace-mod.ts','StoneFreeWorkspace'],['reading-controls','examples/reading-controls-mod.ts','StoneFreeReadingControls']] as const;
const metadata=[];
for(const [name,entry,modName] of [...consumers,['sdk-probe','vue.ts',null] as const]){
 const result=await build({root,configFile:false,plugins:[vue()],define,build:{target:'es2022',write:false,minify:true,
  lib:{entry:path.join(root,'framework',entry),name:'SharedConsumer',formats:['iife'],fileName:()=> 'index.js',cssFileName:'style'},
  rollupOptions:{external:['vue'],output:{globals:{vue:'StoneFreeVueExternal'}}}}});
 if('on' in result)throw Error('Unexpected watch build');
 const outputs=Array.isArray(result)?result.flatMap(r=>r.output):result.output,chunk=outputs.find((x):x is Rollup.OutputChunk=>x.type==='chunk'&&x.isEntry);
 if(!chunk)throw Error('Missing consumer entry');
 const required=chunk.importedBindings.vue??[];
 const target=path.join(out,name);fs.mkdirSync(target,{recursive:true});
 const source=`var StoneFree_${name.replaceAll('-','_')}=(()=>{const unavailable=()=>Object.freeze({status:'runtime-unavailable',dispose(){}});let StoneFreeVueExternal;try{const runtime=window.StoneFreeVueExperimental,api=runtime?.vue;if(!runtime||runtime.protocol!=='0.1-experimental'||runtime.version!==${JSON.stringify(version)}||!api||typeof api.createApp!=='function'||!${JSON.stringify(required)}.every(key=>Object.hasOwn(api,key)))return unavailable();StoneFreeVueExternal=api;}catch{return unavailable();}\n${chunk.code}\nreturn SharedConsumer;})();\n`;
 fs.writeFileSync(path.join(target,'index.js'),source);
 for(const asset of outputs.filter(x=>x.type==='asset'))fs.writeFileSync(path.join(target,asset.fileName),asset.source);
 if(modName)metadata.push({name,modName,required});
}
fs.writeFileSync(path.join(out,'inputs.json'),JSON.stringify({vueVersion:version,protocol:'0.1-experimental',consumers:metadata},null,2));
