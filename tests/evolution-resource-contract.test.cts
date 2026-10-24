// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
// Prevent migrated presentation owners from reintroducing a private native scheduler.

const exceptions=new Map([
 ['src/ui/visual-scope.ts','Shared presentation resource owner'],
 ['src/runtime/ui.ts','Existing shared UiApi v1 adapter/surface owner and injected Window scheduler'],
 ['src/runtime/sugarcube.ts','Native status controller scheduler contract'],
 ['src/runtime/inspector.ts','Download URL revocation must outlive the inspector'],
 ['src/story-actions/main.ts','Retired by default; outside the approved active migration'],
 ['src/wardrobe/main.ts','Native batch operation yield must settle before mode restoration']
]);
const found=new Set();
function scan(dir:string){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.posix.join(dir,entry.name);if(entry.isDirectory()){if(!['vendor','dist'].includes(entry.name))scan(file);continue}if(!/\.(ts|vue|js)$/.test(file))continue;const source=fs.readFileSync(file,'utf8');if(!/\b(?:requestAnimationFrame|cancelAnimationFrame|setTimeout|setInterval)\s*\(/.test(source))continue;assert.ok(exceptions.has(file),'Unowned presentation scheduler: '+file);found.add(file);if(file==='src/wardrobe/main.ts'){const calls=source.match(/\b(?:requestAnimationFrame|cancelAnimationFrame|setTimeout|setInterval)\s*\(/g);assert.ok(calls);assert.equal(calls.length,1,'Only the native operation yield is exempt');assert.ok(source.includes('await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()))'))}}}
for(const dir of ['src','framework/official-ui','framework/motion-hub','compat'])scan(dir);
assert.deepEqual([...found].sort(),[...exceptions.keys()].sort(),'Update the evidence when retiring a documented exception');
console.log('PASS migrated presentation schedulers use shared ownership; six explicit native/shared/retired exceptions remain');
