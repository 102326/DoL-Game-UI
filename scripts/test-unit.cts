import child = require('node:child_process');
import path = require('node:path');
const {spawnSync}=child;
const root=path.resolve(__dirname,'..');
for(const name of ['floating-preferences.test.cjs','test-workflow.test.cjs','status.test.cjs','target-version.test.cjs','wardrobe-data.test.cjs','wardrobe-source-m2.test.cjs','wardrobe-slot-mappings.test.cjs','wardrobe-performance.test.cjs','render-state.test.cjs','startup-cache.test.cjs','shop-early-api.test.cjs']){
 const result=spawnSync(process.execPath,[path.join(root,'tests',name)],{cwd:root,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
