// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
const root=path.resolve(__dirname,'..');
assert.equal(fs.existsSync(path.join(root,'startup-cache-experiment.ts')),false,'retired loader hook must not exist');
for(const name of ['scripts/build-early.cjs','scripts/package.py','tsconfig.early.json'])assert.equal(fs.readFileSync(path.join(root,name),'utf8').includes('startup-cache-experiment'),false,'retired hook must not be built or shipped: '+name);
assert.equal(fs.readFileSync(path.join(root,'src/main.ts'),'utf8').includes('startStatusPreview'),false,'internal preview must not be started');
console.log('PASS retired experiments: no loader hook build/package entry or preview runtime startup');
