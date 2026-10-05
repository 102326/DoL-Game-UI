const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const name of ['test-workflow.test.cjs','status.test.cjs','wardrobe-data.test.cjs','wardrobe-slot-mappings.test.cjs','wardrobe-performance.test.cjs','render-state.test.cjs','startup-cache.test.cjs','shop-pagination-package.test.cjs']){
 const result=spawnSync(process.execPath,[path.join(root,'tests',name)],{cwd:root,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
