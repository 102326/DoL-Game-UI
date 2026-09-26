const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');

const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=pathname==='/game'?path.join(project,process.env.DOL_WARDROBE_INTEGRATED?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});

(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
 await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));
 await p.goto(`http://127.0.0.1:${server.address().port}/game`,{waitUntil:'load',timeout:90000});await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options,{timeout:60000});await p.waitForLoadState('networkidle');
 await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForLoadState('networkidle');
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});

 await p.setViewportSize({width:1704,height:1136});
 await p.evaluate(()=>{
  V.location='home';V.wardrobe_location='wardrobe';V.lastWardrobeSlot='upper';
  const d=setup.clothes.upper.find(d=>d.name!=='naked'&&!d.outfitPrimary&&!d.outfitSecondary&&!d.type.includes('cursed'));
  V.wardrobe.upper=Array.from({length:300},(_,i)=>{const item=structuredClone(d);item.cn_name_cap='分页测试'+String(i).padStart(3,'0');item.colour=item.colour_options?.[0]??0;item.accessory_colour=item.accessory_colour_options?.[0]??0;return item});
  SugarCube.Engine.play('Wardrobe');
 });
 await p.waitForSelector('.dgw-shell');await p.waitForFunction(()=>document.querySelector('.dgw-preview')?.getAttribute('aria-busy')==='false');
 const full=await p.locator('.dgw-item').count();assert.equal(full,300);
 const stateBefore=await p.evaluate(()=>JSON.stringify(V));
 await p.evaluate(()=>DoLGameUI.setPreference('wardrobePaged',true));await p.waitForTimeout(100);
 assert.equal(await p.locator('.dgw-item').count(),40);assert.equal(await p.evaluate(()=>JSON.stringify(V)),stateBefore,'enabling display experiment does not mutate game state');
 const firstKey=await p.locator('.dgw-item').first().getAttribute('data-key');
 await p.getByRole('navigation',{name:'衣物分页',exact:true}).getByRole('button',{name:'下一页',exact:true}).click();
 assert.notEqual(await p.locator('.dgw-item').first().getAttribute('data-key'),firstKey);
 await p.getByRole('button',{name:'整理模式',exact:true}).click();
 await p.getByRole('button',{name:'全选当前筛选',exact:true}).click();
 assert.match(await p.locator('.dgw-selection-bar').innerText(),/300 件已选择/,'select all spans unrendered pages');
 await p.getByRole('button',{name:'退出整理',exact:true}).click();
 await p.getByRole('searchbox',{name:'搜索当前分类'}).fill('分页测试299');await p.waitForTimeout(100);
 assert.equal(await p.locator('.dgw-item').count(),1,'search reaches items outside rendered page');
 await p.locator('.dgw-item').click();await p.waitForFunction(()=>V.worn.upper.cn_name_cap==='分页测试299');
 assert.equal(await p.evaluate(()=>V.worn.upper.cn_name_cap),'分页测试299','filtered paged item wears correct inventory entry');
 await p.getByRole('searchbox',{name:'搜索当前分类'}).fill('');
 await p.getByRole('navigation',{name:'衣物分页',exact:true}).getByRole('button',{name:'下一页',exact:true}).click();
 await p.evaluate(()=>{V.wardrobe.upper.splice(3);DoLWardrobeUI.refresh()});await p.waitForTimeout(150);
 assert.equal(await p.locator('.dgw-item').count(),3,'page clamps after inventory shrinks');
 await p.evaluate(()=>DoLGameUI.setPreference('wardrobePaged',false));await p.waitForTimeout(100);
 assert.equal(await p.locator('.dgw-item').count(),3);assert.equal(await p.getByRole('navigation',{name:'衣物分页',exact:true}).count(),0);
 const variant=process.env.DOL_WARDROBE_INTEGRATED?'lyra':'vanilla';
 await p.evaluate(()=>DoLGameUI.setPreference('wardrobePaged',true));
 for(const [width,height] of [[1704,1136],[390,844]]){await p.setViewportSize({width,height});await p.getByRole('navigation',{name:'衣物分页',exact:true}).scrollIntoViewIfNeeded();const r=await p.getByRole('navigation',{name:'衣物分页',exact:true}).boundingBox();assert.ok(r.x>=0&&r.x+r.width<=width+1);await p.screenshot({path:path.join(__dirname,'artifacts',`experiments-${variant}-${width}.png`)})}
 const unexpected=errors.filter(e=>!e.includes('bannerFallbackImage.onload')||!e.includes('skybox'));assert.deepEqual(unexpected,[]);
 fs.writeFileSync(path.join(__dirname,'artifacts',`experiments-${variant}.json`),JSON.stringify({fullRows:full,pagedRows:40,gameStateUnchanged:true,selectAllAcrossPages:true,searchAcrossPages:true,android:false},null,2));
 console.log('PASS wardrobe experiments',variant,'300 -> 40 rows, unchanged game state, paging, search, all-selection, shrink and fallback');
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
