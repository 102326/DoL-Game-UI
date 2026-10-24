'use strict';
import fs = require('node:fs');
import path = require('node:path');
import crypto = require('node:crypto');
import child = require('node:child_process');
const {createHash}=crypto,{execFileSync}=child;
const root=fs.realpathSync(path.resolve(__dirname,'..'));
const shopInputs=['src/shop/Toolbar.vue','src/ui/GameButton.vue','src/shop/style.css','src/tokens.css','src/theme/midnight.css','src/theme/controls.css','src/shop/main.ts','src/runtime/ui.ts','src/public/ui.ts','component-lab/App.vue','component-lab/main.ts','component-lab/lab.css','component-lab/source-index.cts','component-lab/source-link.ts','vite.lab.config.ts','tsconfig.lab.json','package.json','package-lock.json'];
const sha=(b:crypto.BinaryLike)=>createHash('sha256').update(b).digest('hex');
const floatingInputs=shopInputs.filter(p=>!p.startsWith('src/shop/')).concat(['src/floating/FloatingTools.vue','src/floating/main.ts','src/floating/preferences.ts','src/floating/style.css','src/theme/visual.css','src/theme/eyes.css','src/theme/layout.css','src/theme/mobile.css']);
const inputs=[...new Set([...shopInputs,...floatingInputs])];
function sourceIndex(componentId='shop.toolbar'){
 if(!['shop.toolbar','floating.tools'].includes(componentId))throw Error('Unknown Lab component');
 const floating=componentId==='floating.tools',selected=floating?floatingInputs:shopInputs;
 let total=0;
 const files=selected.map(file=>{const full=fs.realpathSync(path.join(root,file)),rel=path.relative(root,full);
  if(rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw Error('Source input outside authorized root');
  if(rel.split(path.sep).some(s=>s.toLowerCase()==='.git'||s.toLowerCase().startsWith('.env'))||/\.(pem|key|p12)$/i.test(rel))throw Error('Source input resolves to excluded path');
  const stat=fs.statSync(full);total+=stat.size;if(!stat.isFile()||stat.size>512*1024||total>4*1024*1024)throw Error('Source input bounds exceeded');
  return {path:file,sha256:sha(fs.readFileSync(full))};});
 return {format:'dol-ui-source-index',version:1,componentId,role:floating?'floating':'toolbar',
  snapshot:{revision:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),dirty:execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim().length>0,files,digest:sha(JSON.stringify(files))},
  runtime:{kind:'vite-dev-server',coverage:'Listed component, styles, parent wiring, lab and toolchain inputs; not the entire project or a loaded Mod'},
  candidates:{source:floating?['src/floating/FloatingTools.vue','src/ui/GameButton.vue']:['src/shop/Toolbar.vue','src/ui/GameButton.vue'],styles:floating?['src/floating/style.css','src/tokens.css','src/theme/visual.css','src/theme/eyes.css']:['src/shop/style.css','src/tokens.css','src/theme/midnight.css','src/theme/controls.css']},
  callbacks:floating?[{name:'run',production:'src/floating/main.ts',lab:'component-lab/App.vue'}]:[{name:'setDefaultGender',production:'src/shop/main.ts',lab:'component-lab/App.vue'},{name:'toggleCategories',production:'src/shop/main.ts',lab:'component-lab/App.vue'},{name:'toggle',production:'src/shop/main.ts',lab:'component-lab/App.vue'}]};
}
if(require.main===module){
 const args=process.argv.slice(2);if(![2,4].includes(args.length)||args[0]!=='--out'||(args.length===4&&args[2]!=='--component'))throw Error('Use --out NEW_JSON [--component shop.toolbar|floating.tools]');
 const target=args[1];if(!target)throw Error('Missing output path');
 fs.writeFileSync(path.resolve(target),JSON.stringify(sourceIndex(args[3]),null,2)+'\n',{flag:'wx'});
}
export = {sourceIndex,inputs,root};
