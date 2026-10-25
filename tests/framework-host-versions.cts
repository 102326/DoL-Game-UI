// Frozen Host versions: compare actual late-bridge and load invalidation semantics.
import fs = require('node:fs');
import path = require('node:path');
import assert = require('node:assert/strict');
import childProcess = require('node:child_process');
import playwright = require('playwright');
const {execFileSync}=childProcess,{chromium}=playwright;
import type {Host} from '../framework/contracts';
type HistoricalHost=Pick<Host,'binding'|'dispose'> & Partial<Pick<Host,'getCapabilities'>>;
type Handler={name:string;fn:()=>void};
declare const DoLUiHost:HistoricalHost;
declare let handlers:Handler[];
declare function publish():void;
function payloadOf(value:unknown):{js:string;sha256:string}{
 assert.ok(value!==null&&typeof value==='object');
 assert.ok('js' in value&&typeof value.js==='string');
 assert.ok('sha256' in value&&typeof value.sha256==='string'&&/^[a-f0-9]{64}$/.test(value.sha256));
 return {js:value.js,sha256:value.sha256};
}
const root=path.resolve(__dirname,'..'),out=path.join(root,'tests/artifacts/stone-free-rc01'),records:Array<{version:string;file:string;sha256:string;before:{current:boolean;methods:string[];caps:ReturnType<Host['getCapabilities']>|undefined};after:{current:boolean;handlers:number}}>=[];
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{for(const version of ['0.1.0','0.1.1','0.1.2','0.1.3',...(process.env.SF_RC01_DIR?['0.1.4']:[])]){const file=version==='0.1.4'?path.join(process.env.SF_RC01_DIR ?? '', 'StoneFreeHost-'+version+'-experimental.mod.zip'):version==='0.1.3'?path.join(root,'dist/rc-r17/StoneFreeHost-'+version+'-experimental.mod.zip'):path.join(root,'dist/framework/StoneFreeHost-'+version+'-experimental.mod.zip');const payload=payloadOf(JSON.parse(execFileSync('python',['-c','import zipfile,json,sys,hashlib; z=zipfile.ZipFile(sys.argv[1]); print(json.dumps({"js":z.read("index.js").decode(),"sha256":hashlib.sha256(open(sys.argv[1],"rb").read()).hexdigest()}))',file],{encoding:'utf8'})));const page=await browser.newPage();await page.setContent('<div id="passages"><div class="passage" data-passage="Start"></div></div>');await page.evaluate(()=>{Object.assign(window,{SugarCube:{State:{passage:'Start'}},handlers:[] as Handler[]});Object.assign(window,{publish:()=>Object.assign(window,{jQuery:()=>({on(events:string,fn:()=>void){for(const name of events.split(' '))handlers.push({name,fn})},off(){handlers=[]}})})})});await page.addScriptTag({content:payload.js});const before=await page.evaluate(()=>({current:DoLUiHost.binding().isCurrent(),methods:Object.keys(DoLUiHost).filter(k=>typeof Object.values(DoLUiHost)[Object.keys(DoLUiHost).indexOf(k)]==='function'),caps:DoLUiHost.getCapabilities?.()}));await page.evaluate(()=>publish());await page.waitForTimeout(350);const after=await page.evaluate(()=>({current:DoLUiHost.binding().isCurrent(),handlers:handlers.length}));if(['0.1.0','0.1.1'].includes(version)){assert.equal(after.handlers,0);assert.equal(before.current,true)}else{assert.equal(before.current,false);assert.equal(after.handlers,4);assert.equal(after.current,true);const x=await page.evaluate(()=>{const b=DoLUiHost.binding();handlers.filter(h=>h.name.split('.')[0]===':onloadsave').forEach(h=>h.fn());const old=b.isCurrent(),pending=DoLUiHost.binding().isCurrent();handlers.filter(h=>h.name.split('.')[0]===':passageend').forEach(h=>h.fn());return {old,pending,fresh:DoLUiHost.binding().isCurrent()}});assert.deepEqual(x,{old:false,pending:false,fresh:true})}records.push({version:version+'-experimental',file,sha256:payload.sha256,before,after});await page.evaluate(()=>DoLUiHost.dispose());await page.close()}fs.writeFileSync(path.join(out,'host-history.json'),JSON.stringify({status:'passed',scope:'actual frozen Host JS in controlled browser; not a ModLoader install',records},null,2));console.log(records.map(r=>({version:r.version,methods:r.before.methods.length,beforeCurrent:r.before.current,lateHandlers:r.after.handlers})));}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
