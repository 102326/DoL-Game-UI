const assert=require('node:assert/strict');
const path=require('node:path');
const vm=require('node:vm');
const {buildSync}=require('esbuild');

const built=buildSync({
 entryPoints:[path.join(__dirname,'../src/wardrobe/native.ts')],
 bundle:true,write:false,format:'cjs',platform:'node'
});
const bundledModule={exports:{}};
vm.runInNewContext(built.outputFiles[0].text,{module:bundledModule,exports:bundledModule.exports,document:{createElement(){return {}}}});
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
