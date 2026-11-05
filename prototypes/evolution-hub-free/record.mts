import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {createEvo42Server} from '../../scripts/preview-evo42.mts';
const id=String(Date.now()),out=`tests/artifacts/evo42-hub-edge/${id}`;fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync('prototypes/evolution-hub-free').filter(f=>/\.(ts|mts|vue|css|html)$/.test(f)).map(f=>'prototypes/evolution-hub-free/'+f).concat('dist/framework/official-ui/style.css');
const hash=(f:string)=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),inputs=Object.fromEntries(files.map(f=>[f,hash(f)]));
const server=await createEvo42Server(0),address=server.httpServer!.address();assert(address&&typeof address!=='string');
const browser=await chromium.launch();const cases:unknown[]=[];
try{for(const width of [1280,390])for(const variant of ['direct','free']){
 const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:out,size:{width,height:900}}}),p=await context.newPage(),errors:string[]=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(`http://127.0.0.1:${address.port}/prototypes/evolution-hub-free/index.html?variant=${variant}`);
 const ball=p.locator('.sf-motion-ball');await ball.waitFor();await p.waitForTimeout(800);
 const r=await ball.boundingBox();assert(r);await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();
 await p.mouse.move(width/2,620,{steps:24});await p.mouse.up();await p.waitForTimeout(800);
 const held=await ball.boundingBox();assert(held);await p.mouse.move(held.x+held.width/2,held.y+held.height/2);await p.mouse.down();await p.mouse.move(2,610,{steps:20});await p.waitForTimeout(1100);await p.mouse.move(2,665,{steps:12});await p.waitForTimeout(350);
 await p.screenshot({path:`${out}/${width}-${variant}-charge.png`});await p.mouse.up();await p.waitForTimeout(2600);
 await ball.click();await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-spin-phase')==='open');await p.waitForTimeout(1600);
 await p.screenshot({path:`${out}/${width}-${variant}.png`});
 await p.locator('[data-motion-view$="native-social"]').click();await p.waitForTimeout(800);
 await p.locator('#layout').selectOption('grid');await ball.waitFor();await ball.click();
 await p.waitForFunction(()=>document.querySelector('.sf-motion-hub')?.getAttribute('data-spin-phase')==='open');await p.waitForTimeout(1600);
 await ball.press('Escape');await p.waitForTimeout(800);assert.deepEqual(errors,[]);
 const video=p.video();await context.close();assert(video);await video.saveAs(`${out}/${width}-${variant}.webm`);cases.push({width,variant,errors});
}for(const f of files)assert.equal(hash(f),inputs[f],f+' changed during recording');fs.writeFileSync(out+'/recording.json',JSON.stringify({status:'PASS',browser:browser.version(),node:process.version,inputs,cases,note:'Same operation script, viewport, waits and 1x playback; independent captures are not frame-synchronized or performance measurements.'},null,2));console.log(`/prototypes/evolution-hub-free/compare.html?run=${id}`)}finally{await browser.close();await server.close()}
