import assert = require('node:assert/strict');
import vm = require('node:vm');
import esbuild = require('esbuild');
const {buildSync}=esbuild;
let source='',clicks=0,count=1,error=false;const m:{exports:unknown}={exports:{}};
vm.runInNewContext(buildSync({entryPoints:['src/wardrobe/native.ts'],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0]?.text ?? assert.fail('missing native output'),{module:m,exports:m.exports,document:{createElement:()=>({querySelectorAll:()=>Array.from({length:count},()=>({click(){clicks++}})),querySelector:()=>error?{}:null})}});
function nativeExports(value:unknown):value is Pick<typeof import('../src/wardrobe/native.ts'),'createNativeWardrobe'>{return !!value&&typeof value==='object'&&'createNativeWardrobe' in value&&typeof value.createNativeWardrobe==='function';}
assert.ok(nativeExports(m.exports));
const native=m.exports.createNativeWardrobe({Wikifier:class{constructor(_out:HTMLElement,text:string){source=text}}},{measure:(_name,fn)=>fn()});
native.action('wear','head',2);assert.equal(clicks,1);assert.ok(source.includes('<<wearlink_norefresh "Soft & Wet" 2>>'));assert.ok(source.includes('selectWardrobe()'));assert.ok(source.includes('<<capture _wardrobe_list _selectedWardrobe _wear>>'));assert.ok(!source.includes('<<set $wear_head='));
native.action('wear','head','strip');assert.equal(clicks,2);assert.ok(source.includes('"strip"'));
for(const n of [0,2]){count=n;assert.throws(()=>native.action('wear','head',2),/入口结构未知/);assert.equal(clicks,2)}count=1;error=true;assert.throws(()=>native.action('wear','head',2),/入口结构未知/);assert.equal(clicks,2);
assert.throws(()=>native.action('wear','head;alert(1)',0),/参数/);assert.equal(clicks,2);console.log('PASS original wear-link dispatch once, captured native slot/inventory context, unknown/error/multiple links reject without fallback');
