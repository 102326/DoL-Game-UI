const assert=require('node:assert/strict'),vm=require('node:vm'),{buildSync}=require('esbuild');
const m={exports:{}};vm.runInNewContext(buildSync({entryPoints:['src/floating/preferences.ts'],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text,{module:m,exports:m.exports});
const {readFloatingPreferences:read,displayPosition:display,positionIntent:intent}=m.exports;
assert.equal(read('{bad').mode,'fan');assert.equal(read(JSON.stringify({enabled:'yes',x:'0.4',y:null})).enabled,false);
assert.equal(read(null).enabled,false);assert.equal(read(JSON.stringify({enabled:true,x:.42})).enabled,true,'explicit saved choice is preserved');
const p=read(JSON.stringify({x:.9,y:.7,tools:['settings','unknown','settings','move'],script:'alert(1)'}));assert.deepEqual([...p.tools],['settings','move']);assert.equal(p.script,undefined);
const saved=JSON.stringify(p);const wide={left:0,top:0,width:1200,height:900},narrow={left:14,top:20,width:320,height:400};const original=display(p,wide),small=display(p,narrow);assert.ok(small.x>=14&&small.x+52<=334&&small.y+52<=420);assert.equal(JSON.stringify(p),saved);assert.deepEqual(display(p,wide),original);
const moved=intent(400,250,wide);const again=display(moved,wide);assert.ok(Math.abs(again.x-400)<1e-6&&Math.abs(again.y-250)<1e-6);assert.equal(read(JSON.stringify({x:2,y:-1})).x,1);
console.log('PASS floating preference sanitization, stable IDs, independent defaults, free intent and temporary viewport projection');
