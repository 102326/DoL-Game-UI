// Deliberately source-first: create once; upgrades touch only unmodified vendored SDK.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [operation,directory,id]=process.argv.slice(2);
if(!['create','upgrade-sdk'].includes(operation)||!directory)throw Error('Usage: framework-factory.mjs create NEW_DIRECTORY ModId | upgrade-sdk EXISTING_DIRECTORY');
const out=path.resolve(directory),files=['contracts.ts','vue.ts','connect.ts'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const source=Object.fromEntries(files.map(name=>[name,fs.readFileSync(path.join(root,'framework',name))]));
const manifest={recipe:'stone-free-source-first-0.1',sdkProtocol:'0.1-experimental',files:Object.fromEntries(files.map(name=>[name,sha(source[name])]))};
if(operation==='create'){
 if(!/^[A-Za-z][A-Za-z0-9]{0,63}$/.test(id??''))throw Error('A simple ModId is required');
 if(fs.existsSync(out))throw Error('Destination already exists; no author files overwritten');
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.mkdirSync(out);fs.mkdirSync(path.join(out,'src'));fs.mkdirSync(path.join(out,'vendor/stone-free'),{recursive:true});
 fs.writeFileSync(path.join(out,'package.json'),JSON.stringify({name:id.toLowerCase(),modName:id,version:'0.1.0',private:true,type:'module',scripts:{check:'vue-tsc --noEmit',build:'npm run check && vite build',package:'npm run build && python package.py'},dependencies:{vue:'^3.5.0'},devDependencies:{vite:'^7.0.0','@vitejs/plugin-vue':'^6.0.0',typescript:'^5.9.0','vue-tsc':'^3.0.0'}},null,2));
 fs.writeFileSync(path.join(out,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',module:'ESNext',moduleResolution:'Bundler',strict:true,lib:['ES2022','DOM','DOM.Iterable'],skipLibCheck:true,noEmit:true},include:['src/**/*.ts','src/**/*.vue','vendor/**/*.ts']},null,2));
 fs.writeFileSync(path.join(out,'src/main.ts'),`import {connectConsumer} from '../vendor/stone-free/connect';\nimport {mountVue} from '../vendor/stone-free/vue';\nimport Panel from './Panel.vue';\nconnectConsumer(host=>{const owner=host.register('${id}');try {mountVue(owner,{id:'panel',parent:document.body,lifetime:'persistent',load:()=>Panel})}catch{owner.dispose();throw Error('Mount failed')}return owner.dispose});\n`);
 for(const [from,to] of [['framework/factory/Panel.vue','src/Panel.vue'],['framework/factory/vite.config.mjs','vite.config.mjs'],['framework/factory/package.py','package.py'],['LICENSE','LICENSE']])fs.copyFileSync(path.join(root,from),path.join(out,to));
 fs.writeFileSync(path.join(out,'README.md'),`# ${id}\n\n这是作者拥有的源码。先安装项目声明的依赖并生成自己的锁文件，再运行 npm run package。启用 StoneFreeHost 0.1.0-experimental 后加载生成的 Mod ZIP，无须官方 UI。\n\nsrc/Panel.vue 和 src/main.ts 由作者修改。vendor/stone-free 是记录摘要的实验 SDK；升级只更新未被修改的 SDK 文件，绝不覆盖作者的 SFC。源码中的便笺只是本次加载的 UI 状态，不写游戏 State 或存档。\n`);
 fs.writeFileSync(path.join(out,'.gitignore'),'node_modules/\ndist/\n');
}else{
 if(fs.lstatSync(path.join(out,'stone-free-sdk.json')).isSymbolicLink())throw Error('SDK manifest alias requires manual review');
 const current=JSON.parse(fs.readFileSync(path.join(out,'stone-free-sdk.json'),'utf8'));
 if(current.recipe!==manifest.recipe||current.sdkProtocol!==manifest.sdkProtocol||Object.keys(current.files??{}).sort().join()!==files.slice().sort().join())throw Error('Unknown SDK manifest; inspect migration manually');
 for(const name of files){
  const target=path.join(out,'vendor/stone-free',name);
  if(fs.lstatSync(path.join(out,'vendor')).isSymbolicLink()||fs.lstatSync(path.join(out,'vendor/stone-free')).isSymbolicLink()||fs.lstatSync(target).isSymbolicLink())throw Error('SDK alias requires manual review');
  if(sha(fs.readFileSync(target))!==current.files[name])throw Error('Author changed SDK; no files upgraded');
 }
}
for(const name of files)fs.writeFileSync(path.join(out,'vendor/stone-free',name),source[name]);
fs.writeFileSync(path.join(out,'stone-free-sdk.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({operation,directory:out,sdkProtocol:manifest.sdkProtocol,authorFilesPreserved:operation==='upgrade-sdk'}));
