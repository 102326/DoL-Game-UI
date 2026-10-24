import assert = require('node:assert/strict');
import path = require('node:path');
import vm = require('node:vm');
import esbuild = require('esbuild');
const {buildSync}=esbuild;
const built=buildSync({entryPoints:[path.join(__dirname,'../src/wardrobe/icons.ts')],bundle:true,write:false,format:'cjs',platform:'node'}),m:{exports:unknown}={exports:{}};
vm.runInNewContext(built.outputFiles[0]?.text ?? assert.fail('missing compiled output'),{module:m,exports:m.exports});
function checkedExports(value:unknown):value is Pick<typeof import('../src/wardrobe/icons.ts'),'clothingIconLayers'> {return !!value&&typeof value==='object'&&'clothingIconLayers' in value&&typeof value.clothingIconLayers==='function';}
assert.ok(checkedExports(m.exports));
const {clothingIconLayers:icons}=m.exports;
const normalise=(s:string)=>s.replace(/ /g,'-');
const d={name:'school shirt',iconFile:1,accIcon:0,accessory:0,colour_options:['white','black']};
let result=icons({name:'school shirt',colour:'black'},d,normalise);assert.equal((result[0] ?? assert.fail('missing icon layer')).src,'img/misc/icon/clothes/school-shirt.png');assert.match((result[0] ?? assert.fail('missing icon layer')).className,/icon-black/);
assert.equal((icons({name:'school shirt',colour:'black'},{...d,colour_options:['black']},normalise)[0] ?? assert.fail('missing icon layer')).className,'icon');
assert.equal((icons({name:'school shirt',colour:'custom',colourCustom:'filter: hue-rotate(45deg);'},d,normalise)[0] ?? assert.fail('missing icon layer')).style,'filter:hue-rotate(45deg)');
assert.equal((icons({name:'school shirt',colour:'custom',colourCustom:'filter: blur(0) url(https://example.com)'},d,normalise)[0] ?? assert.fail('missing icon layer')).style,'');
assert.equal((icons({name:'school shirt',pattern:'dots'},{...d,iconFile:'pattern'},normalise)[0] ?? assert.fail('missing icon layer')).src,'img/misc/icon/clothes/school-shirt-dots.png');
result=icons({name:'school shirt',colour:0,accessory_colour:'black'},{...d,accIcon:1,accessory:1,accessory_colour_options:['black','white']},normalise);assert.equal(result.length,2);assert.equal((result[1] ?? assert.fail('missing icon layer')).src,'img/misc/icon/clothes/school-shirt-acc.png');assert.match((result[1] ?? assert.fail('missing icon layer')).className,/icon-black/);
// @ts-expect-error Deliberately exercise the legacy null descriptor boundary.
assert.equal(icons({name:'unused'},null,normalise).length,0);
assert.equal(icons({name:'school shirt'},{...d,iconFile:'../escape.png'},normalise).length,0);
console.log('PASS icon paths, colour restrictions, custom filters, patterns, accessory layers, missing definitions');
