import playwright = require('playwright');
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import child = require('node:child_process');
const {chromium}=playwright,{spawn,execFileSync}=child;
function index(text:string|null){const value:unknown=JSON.parse(text??'null');if(!value||typeof value!=='object'||!('snapshot' in value))throw Error('Missing lab index');const snapshot=value.snapshot;if(!snapshot||typeof snapshot!=='object'||!('digest' in snapshot)||typeof snapshot.digest!=='string'||!('revision' in snapshot)||typeof snapshot.revision!=='string')throw Error('Invalid lab snapshot');return {...value,snapshot:{...snapshot,digest:snapshot.digest,revision:snapshot.revision}};}
function toolStatus(file:string){const value:unknown=JSON.parse(fs.readFileSync(file,'utf8'));if(!value||typeof value!=='object'||!('status' in value)||typeof value.status!=='string')throw Error('Invalid Source Link response');return value.status;}
declare const must:<T>(value:T|null)=>T;

(async()=>{const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'artifacts/stone-free-lab',String(Date.now()));fs.mkdirSync(out,{recursive:true});
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','vite.lab.config.ts','--port','5177'],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});let browser:playwright.Browser|undefined,styleBefore:Buffer|undefined;const style=path.join(root,'src/floating/style.css');const log:string[]=[];server.stdout.on('data',d=>log.push(String(d)));server.stderr.on('data',d=>log.push(String(d)));
 try{let ready=false;for(let i=0;i<60;i++){if(server.exitCode!==null)throw Error('Vite stopped');try{const r=await fetch('http://127.0.0.1:5177');if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}assert.ok(ready);
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:390,height:900}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5177');await page.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null)=>{if(value===null)throw Error('Missing lab node');return value}}));await page.waitForFunction(()=>document.querySelector('#lab-index')?.textContent?.includes('floating.tools'));
 assert.equal(await page.evaluate(()=>typeof Reflect.get(window,'DoLGameUI')),'undefined');const before=index(await page.locator('#lab-index').textContent()),clue:unknown=JSON.parse((await page.locator('#lab-clue').textContent())??'null');
 fs.writeFileSync(path.join(out,'floating-before-index.json'),JSON.stringify(before,null,2));fs.writeFileSync(path.join(out,'floating-before-clue.json'),JSON.stringify(clue,null,2));
 const tools='E:/daima/DoL/experiments/Paisley-Park-5.0-Windows-AB/integrations/soft-and-wet/source-link.cjs';execFileSync(process.execPath,[tools,'--root',root,'--index',path.join(out,'floating-before-index.json'),'--clue',path.join(out,'floating-before-clue.json'),'--out',path.join(out,'floating-tools-result.json')]);
 assert.equal(toolStatus(path.join(out,'floating-tools-result.json')),'unknown','A prototype does not yet map floating.tools');
 await page.getByRole('menuitem',{name:/界面设置/}).click();assert.match((await page.locator('#lab-events').textContent())??'',/floating.run/);
 const blur=()=>page.locator('.dsf-grid').evaluate(n=>getComputedStyle(n).backdropFilter);fs.writeFileSync(path.join(out,'hmr-ready.json'),JSON.stringify({beforeBlur:await blur(),digest:before.snapshot.digest}));
 // Benign HMR transport control; final product bytes are restored in finally.
 styleBefore=fs.readFileSync(style);fs.appendFileSync(style,'\n#dol-stone-free-floating .dsf-grid{outline:1px solid rgb(1,2,3)}\n');
 await page.waitForFunction(()=>getComputedStyle(must(document.querySelector('.dsf-grid'))).outlineColor==='rgb(1, 2, 3)');
 await page.waitForFunction(d=>{const v:unknown=JSON.parse(must(document.querySelector('#lab-index')).textContent??'null');if(!v||typeof v!=='object'||!('snapshot' in v))return false;const snapshot=v.snapshot;return !!snapshot&&typeof snapshot==='object'&&'digest' in snapshot&&typeof snapshot.digest==='string'&&snapshot.digest!==d},before.snapshot.digest);
 const after=index(await page.locator('#lab-index').textContent());fs.writeFileSync(path.join(out,'floating-after-index.json'),JSON.stringify(after,null,2));assert.notEqual(before.snapshot.digest,after.snapshot.digest);assert.equal(before.snapshot.revision,after.snapshot.revision);
 await page.getByLabel('Lab 玻璃',{exact:true}).uncheck();assert.equal(await blur(),'none');await page.getByLabel('Lab 玻璃',{exact:true}).check();assert.notEqual(await blur(),'none');
 fs.writeFileSync(style,styleBefore);await page.waitForFunction(()=>getComputedStyle(must(document.querySelector('.dsf-grid'))).outlineStyle!=='solid');
 await page.getByLabel('Lab 视觉档位',{exact:true}).selectOption('2');assert.match(await page.locator('.dsf-grid').evaluate(n=>getComputedStyle(n).backgroundColor),/0\.74/);await page.screenshot({path:path.join(out,'floating-grid-after.png')});assert.deepEqual(errors,[]);
 await page.getByLabel('Lab 组件',{exact:true}).selectOption('shop.toolbar');await page.waitForFunction(()=>{const value:unknown=JSON.parse(must(document.querySelector('#lab-index')).textContent??'null');return !!value&&typeof value==='object'&&'componentId' in value&&value.componentId==='shop.toolbar'});
 for(const [name,selector]of [['shop-index','#lab-index'],['shop-clue','#lab-clue']] as const)fs.writeFileSync(path.join(out,name+'.json'),(await page.locator(selector).textContent())??'null');
 execFileSync(process.execPath,[tools,'--root',root,'--index',path.join(out,'shop-index.json'),'--clue',path.join(out,'shop-clue.json'),'--out',path.join(out,'shop-tools-result.json')]);assert.equal(toolStatus(path.join(out,'shop-tools-result.json')),'matched');
 console.log('PASS actual component/CSS HMR, capability fallback, memory-only callbacks, 390px, current shop Source Link');
 }finally{if(styleBefore)fs.writeFileSync(style,styleBefore);await browser?.close();server.kill();fs.writeFileSync(path.join(out,'vite-log.txt'),log.join(''))}
})().catch(e=>{console.error(e);process.exitCode=1});
