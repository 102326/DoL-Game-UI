// @ci-contract {"profiles":["research"],"classification":"contract","granularity":"entry"}
// Lexical census is an audit aid, never a claim of semantic 100% ownership.
import fs = require('node:fs');
import path = require('node:path');
import cp = require('node:child_process');
import crypto = require('node:crypto');
const roots=['src/','framework/official-ui/','framework/motion-hub/','compat/','prototypes/golden-spin-b/','prototypes/settings-refraction-v1/'];
const base=process.argv[3]||cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const files=cp.execFileSync('git',['ls-tree','-r','--name-only',base],{encoding:'utf8'}).trim().split('\n').filter(f=>roots.some(r=>f.startsWith(r))&&/\.(ts|vue|css|js)$/.test(f));
const patterns={motion:/sourceMotion|\.animate\(|gsap|<Transition|transition:|animation:|@keyframes/g,lifecycle:/MutationObserver|ResizeObserver|requestAnimationFrame|setInterval|setTimeout|onBeforeUnmount|\.dispose\(/g,geometry:/getBoundingClientRect|devicePixelRatio|scrollTop|visualViewport/g,material:/backdrop-filter|Acrylic|Weather|canvas|Canvas|WebGL/g};
const consumers=files.flatMap(file=>{const source=cp.execFileSync('git',['show',base+':'+file],{encoding:'utf8'}),signals=Object.fromEntries(Object.entries(patterns).map(([name,re])=>[name,[...source.matchAll(re)].length]));return Object.values(signals).some(Boolean)?[{file,sha256:crypto.createHash('sha256').update(source).digest('hex'),signals}]:[]});
const report={schema:1,scope:'Tracked first-party runtime, official adapters and explicitly retained studies; lexical hits require manual consumer decisions. Does not inspect third-party game/save files.',roots,sourceBase:base,consumers};
const output=process.argv[2]||'tests/artifacts/evolution/inventory.json';fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log('EVO-P0 inventory:',consumers.length,'matching files ->',output);
