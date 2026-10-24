// Deliberately source-first: create once; upgrades touch only unmodified vendored SDK.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [operation,directory,id]=process.argv.slice(2);
if(!operation||!['create','check-sdk','upgrade-sdk'].includes(operation)||!directory)throw Error('Usage: framework-factory.mjs create NEW_DIRECTORY ModId | check-sdk EXISTING_DIRECTORY | upgrade-sdk EXISTING_DIRECTORY');
const out=path.resolve(directory),files=['contracts.ts','vue.ts','connect.ts'];
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const source=Object.fromEntries(files.map(name=>[name,fs.readFileSync(path.join(root,'framework',name))]));
const manifest={recipe:'stone-free-source-first-0.1',sdkProtocol:'0.1-experimental',files:Object.fromEntries(Object.entries(source).map(([name,bytes])=>[name,sha(bytes)]))};
if(operation==='create'){
 if(!id||!/^[A-Za-z][A-Za-z0-9]{0,63}$/.test(id))throw Error('A simple ModId is required');
 if(fs.existsSync(out))throw Error('Destination already exists; no author files overwritten');
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.mkdirSync(out);fs.mkdirSync(path.join(out,'src'));fs.mkdirSync(path.join(out,'vendor/stone-free'),{recursive:true});
 fs.writeFileSync(path.join(out,'package.json'),JSON.stringify({name:id.toLowerCase(),modName:id,version:'0.1.0',private:true,type:'module',engines:{node:'>=26.0.0'},scripts:{dev:'vite --host 127.0.0.1',check:'vue-tsc --noEmit',build:'npm run check && vite build',package:'npm run build && python package.py'},dependencies:{vue:'^3.5.0'},devDependencies:{vite:'^7.0.0','@vitejs/plugin-vue':'^6.0.0',typescript:'^5.9.0','vue-tsc':'^3.0.0'}},null,2));
 fs.writeFileSync(path.join(out,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',module:'ESNext',moduleResolution:'Bundler',strict:true,lib:['ES2022','DOM','DOM.Iterable'],skipLibCheck:true,noEmit:true},include:['src/**/*.ts','src/**/*.vue','vendor/**/*.ts']},null,2));
 fs.writeFileSync(path.join(out,'src/main.ts'),`import {connectConsumer} from '../vendor/stone-free/connect';\nimport {mountVue,vueView} from '../vendor/stone-free/vue';\nimport Panel from './Panel.vue';\nexport const dispose=connectConsumer(host=>{const owner=host.register('${id}');try {\n if(host.getCapabilities?.().views)owner.provideView({id:'note',title:'界面便笺',setup:vueView({load:()=>Panel,props:{floating:false}})});\n mountVue(owner,{id:'panel',parent:document.body,lifetime:'persistent',load:()=>Panel,props:{floating:true}});\n}catch{owner.dispose();throw Error('Mount failed')}return owner.dispose});\n`);
 for(const [from,to] of [['framework/factory/Panel.vue','src/Panel.vue'],['framework/factory/preview.ts','src/preview.ts'],['framework/factory/index.html','index.html'],['framework/factory/vite.config.mts','vite.config.mts'],['framework/factory/package.py','package.py'],['LICENSE','LICENSE']] as const)fs.copyFileSync(path.join(root,from),path.join(out,to));
 fs.writeFileSync(path.join(out,'README.md'),`# ${id}\n\n这是作者拥有的源码。先安装项目声明的依赖并生成自己的锁文件。npm run dev 启动本机组件预览；它不连接 DoL 或 Host，不能替代游戏验收。npm run package 构建独立 Mod ZIP，启用满足 >=0.1.2-experimental && <0.2.0 的 StoneFreeHost 后加载（推荐本轮 0.1.4-experimental），无须官方 UI 或共享 Vue。\n\nsrc/Panel.vue 和 src/main.ts 由作者修改。同一 SFC 用于浮动入口、可选工作台视图与本地预览；每个实例的便笺相互独立，不持久保存，不写游戏 State 或存档。Host 缺少 views 能力时仍保留浮动入口。\n\nvendor/stone-free 是记录摘要的实验 SDK；upgrade-sdk 只更新未被修改的 SDK 文件，不覆盖作者的 SFC、入口、预览或构建配置。旧项目升级 SDK 不会自动得到新的配方文件。预览入口不进入 Mod ZIP；自定义资源需要作者按实际构建输出调整打包脚本。\n`);
 fs.writeFileSync(path.join(out,'.gitignore'),'node_modules/\ndist/\n');
}else{
 if(fs.lstatSync(path.join(out,'stone-free-sdk.json')).isSymbolicLink())throw Error('SDK manifest alias requires manual review');
 const current=JSON.parse(fs.readFileSync(path.join(out,'stone-free-sdk.json'),'utf8'));
 if(current.recipe!==manifest.recipe||current.sdkProtocol!==manifest.sdkProtocol||Object.keys(current.files??{}).sort().join()!==files.slice().sort().join())throw Error('Unknown SDK manifest; inspect migration manually');
 const inspection=[];
 const aliased=['vendor','vendor/stone-free'].some(p=>fs.lstatSync(path.join(out,p),{throwIfNoEntry:false})?.isSymbolicLink());
 for(const name of files){
  const target=path.join(out,'vendor/stone-free',name);
  let status='aligned';
  const stat=aliased?undefined:fs.lstatSync(target,{throwIfNoEntry:false});
  if(aliased||stat?.isSymbolicLink())status='alias';
  else if(!stat)status='missing';
  else if(!stat.isFile())status='not-file';
  else {const hash=sha(fs.readFileSync(target));if(hash!==current.files[name])status='author-modified';else if(hash!==manifest.files[name])status='source-different'}
  inspection.push({name,status});
 }
 const blocked=inspection.filter(x=>!['aligned','source-different'].includes(x.status));
 if(operation==='check-sdk'){console.log(JSON.stringify({operation,directory:out,sdkProtocol:manifest.sdkProtocol,canReplace:blocked.length===0,files:inspection}));process.exit(0)}
 if(blocked.length)throw Error('SDK requires manual review; no files upgraded: '+blocked.map(x=>`${x.name} (${x.status})`).join(', '));
}
for(const [name,payload] of Object.entries(source))fs.writeFileSync(path.join(out,'vendor/stone-free',name),payload);
fs.writeFileSync(path.join(out,'stone-free-sdk.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({operation,directory:out,sdkProtocol:manifest.sdkProtocol,authorFilesPreserved:operation==='upgrade-sdk'}));
