const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});

(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({channel:'msedge',headless:true});try{
const p=await b.newPage({viewport:{width:1500,height:1000}});
await p.addInitScript(()=>{localStorage.setItem('verifiedAge','true');localStorage.setItem('DoLMidnightTheme.preferences.v1',JSON.stringify({enabled:false,fontScale:100,buttonScale:100,visualTier:2,savesV2:false}))});
await p.goto('http://127.0.0.1:'+server.address().port+'/game',{timeout:90000});await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options,{timeout:60000});await p.waitForLoadState('networkidle');
await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForLoadState('networkidle');await p.evaluate(()=>SugarCube.Engine.play('Bedroom'));await p.waitForLoadState('networkidle');
await p.evaluate(async()=>{V.saveName='展示存档';await idb.saveState(1);});
await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
const out=path.join(__dirname,'../docs/screenshots/2.0.2');fs.mkdirSync(out,{recursive:true});
for(const key of ['saves','social']){
await p.evaluate(key=>{closeOverlay();DoLGameUI.setPreference('enabled',false);new SugarCube.Wikifier(null,'<<overlayReplace "'+key+'">>')},key);await p.waitForTimeout(700);
assert.equal(await p.locator('.error').count(),0);await p.screenshot({path:path.join(out,key+'-native.png')});
await p.evaluate(()=>DoLGameUI.setPreference('enabled',true));await p.waitForSelector(key==='saves'?'.dgs-host':'.dgs-host,.dgp-host');await p.waitForTimeout(700);
assert.equal(await p.locator('.error').count(),0);await p.screenshot({path:path.join(out,key+'-v2.png')});
if(key==='saves'){await p.locator('.dgs-entries details').last().locator('.dgs-item').first().click();await p.waitForSelector('.dgs-detail[open]');await p.waitForTimeout(500);await p.screenshot({path:path.join(out,'saves-detail-v2.png')});await p.locator('.dgs-close').click();}
}
console.log('Isolated screenshots generated; no device or user saves accessed');
}finally{await b.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
