import assert = require('node:assert/strict');
import path = require('node:path');
import vm = require('node:vm');
import esbuild = require('esbuild');
const {buildSync}=esbuild;

const built=buildSync({
 entryPoints:[path.join(__dirname,'../src/wardrobe/native.ts')],
 bundle:true,write:false,format:'cjs',platform:'node'
});
const bundledModule:{exports:unknown}={exports:{}};
vm.runInNewContext(built.outputFiles[0]?.text ?? assert.fail('missing native output'),{module:bundledModule,exports:bundledModule.exports,document:{createElement(){return {}}}});
function nativeExports(value:unknown):value is Pick<typeof import('../src/wardrobe/native.ts'),'createNativeWardrobe'>{return !!value&&typeof value==='object'&&'createNativeWardrobe' in value&&typeof value.createNativeWardrobe==='function';}
assert.ok(nativeExports(bundledModule.exports));
const native=bundledModule.exports.createNativeWardrobe({}, {measure:(_phase,run)=>run()});

const active={wardrobeOption:'delete'};
native.resetMode(active,'delete',active);
assert.equal(active.wardrobeOption,'wear','same-state cleanup restores the native default');

const abandoned={wardrobeOption:'delete'};
const replacement={wardrobeOption:'delete'};
native.resetMode(abandoned,'delete',replacement);
assert.equal(abandoned.wardrobeOption,'delete','cleanup does not mutate variables from a replaced State');
assert.equal(replacement.wardrobeOption,'delete','cleanup does not mutate the replacement State');

const changed={wardrobeOption:'repair'};
native.resetMode(changed,'delete',changed);
assert.equal(changed.wardrobeOption,'repair','cleanup preserves a mode changed by a later operation');

console.log('PASS wardrobe mode cleanup is limited to the current variables object and expected operation mode.');
