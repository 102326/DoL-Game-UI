'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=fs.realpathSync(path.resolve(__dirname,'..'));
const inputs=['src/shop/Toolbar.vue','src/ui/GameButton.vue','src/shop/style.css','src/ui/utilities.css','src/tokens.css','src/theme/midnight.css','src/theme/controls.css','src/shop/main.ts','src/runtime/ui.ts','src/public/ui.ts','component-lab/App.vue','component-lab/main.ts','component-lab/lab.css','component-lab/source-index.cjs','vite.lab.config.ts','tsconfig.lab.json','package.json','package-lock.json'];
const sha=b=>createHash('sha256').update(b).digest('hex');
function sourceIndex(){
 let total=0;
 const files=inputs.map(file=>{const full=fs.realpathSync(path.join(root,file)),rel=path.relative(root,full);
  if(rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw Error('Source input outside authorized root');
  if(rel.split(path.sep).some(s=>s.toLowerCase()==='.git'||s.toLowerCase().startsWith('.env'))||/\.(pem|key|p12)$/i.test(rel))throw Error('Source input resolves to excluded path');
  const stat=fs.statSync(full);total+=stat.size;if(!stat.isFile()||stat.size>512*1024||total>4*1024*1024)throw Error('Source input bounds exceeded');
  return {path:file,sha256:sha(fs.readFileSync(full))};});
 return {format:'dol-ui-source-index',version:1,componentId:'shop.toolbar',role:'toolbar',
  snapshot:{revision:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),dirty:execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim().length>0,files,digest:sha(JSON.stringify(files))},
  runtime:{kind:'vite-dev-server',coverage:'Listed component, styles, parent wiring, lab and toolchain inputs; not the entire project or a loaded Mod'},
  candidates:{source:['src/shop/Toolbar.vue','src/ui/GameButton.vue'],styles:['src/shop/style.css','src/ui/utilities.css','src/tokens.css','src/theme/midnight.css','src/theme/controls.css']},
  callbacks:[{name:'setDefaultGender',production:'src/shop/main.ts',lab:'component-lab/App.vue'},{name:'toggleCategories',production:'src/shop/main.ts',lab:'component-lab/App.vue'},{name:'toggle',production:'src/shop/main.ts',lab:'component-lab/App.vue'}]};
}
if(require.main===module){
 const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--out')throw Error('Use --out NEW_JSON');
 fs.writeFileSync(path.resolve(args[1]),JSON.stringify(sourceIndex(),null,2)+'\n',{flag:'wx'});
}else module.exports={sourceIndex,inputs,root};
