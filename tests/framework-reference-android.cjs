// Authorized isolated test App only. Uses normal Loader storage and original navigation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),tools='E:/daima/local-tools/DoL-Dev-Tools-Paisley-Park/6.1.0';
const {create}=require(tools+'/scripts/lib/execution-context.cjs'),{execute}=require(tools+'/scripts/lib/action.cjs');
const out=path.join(root,'tests/artifacts/stone-free-reference','android-'+Date.now());fs.mkdirSync(out,{recursive:true});
const names=['StoneFreeHost','StoneFreeWardrobeReference'],hash=b=>createHash('sha256').update(b).digest('hex'),report={status:'running',artifacts:{},steps:[]};
let ctx,client,backup,installed=false;
async function bind(){ctx=create({serial:'0509B830099C3540',package:'com.vrelnir.dol.lyra.uicompat051213'},{},{timeoutMs:180000});client=await ctx.ensureWebview()}
const evaluate=s=>client.evaluate(s);
async function wait(s){const end=Date.now()+15000;while(Date.now()<end){if(await evaluate(s))return;await new Promise(r=>setTimeout(r,200))}throw Error('Not ready: '+s)}
async function restart(){await execute(ctx,{type:'restart'});await ctx.finish();await new Promise(r=>setTimeout(r,4500));await bind();await wait('!!window.SugarCube?.State?.passage')}
async function click(selector){await execute(ctx,{type:'web-click',selector});await new Promise(r=>setTimeout(r,350));report.steps.push({type:'web-click',selector})}
async function shot(name){const image=await client.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(image.data,'base64'))}
const state=`JSON.stringify({wardrobe:SugarCube.State.variables.wardrobe,worn:SugarCube.State.variables.worn})`;
(async()=>{try{
 await bind();backup=await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController();return {list:await c.listModIndexDB(),hidden:await c.loadHiddenModList(),scene:SugarCube.State.passage,game:StartConfig.version,loader:modUtils.version,autosave:SugarCube.Config.saves.autosave}})()`);
 assert.equal(backup.game,'0.5.12.13');assert.equal(backup.scene,'Start');assert.deepEqual(backup.autosave,['autosave']);assert.ok(names.every(n=>!backup.list.includes(n)));report.initial=backup;fs.writeFileSync(path.join(out,'restore-list.json'),JSON.stringify(backup,null,2));
 for(const name of names){const b=fs.readFileSync(path.join(root,'dist/framework',name+'-0.1.1-experimental.mod.zip'));report.artifacts[name]={bytes:b.length,sha256:hash(b)};await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController(),b=${JSON.stringify(b.toString('base64'))};if(typeof await c.checkModZipFileIndexDB(b)==='string')throw Error('ZIP rejected');await c.addModIndexDB(${JSON.stringify(name)},b)})()`);installed=true}
 await evaluate(`modSC2DataManager.getModLoadController().overwriteModIndexDBModList(${JSON.stringify(names)})`);await restart();
 const tags=await evaluate(`['Orphanage Intro','Bedroom','Wardrobe'].map(n=>({name:n,tags:SugarCube.Story.get(n).tags}))`);assert.ok(tags.every(p=>!p.tags.includes('autosave')));report.nativeRouteTags=tags;
 await evaluate(`document.querySelector('#settingsExit button').scrollIntoView({block:'center'})`);await click('#settingsExit button');await wait(`SugarCube.State.passage==='Start2'`);
 for(const destination of ['Orphanage Intro','Bedroom','Wardrobe']){const selector='#passages .passage:not(.passage-out) a[data-passage='+JSON.stringify(destination)+']';assert.equal(await evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`),1);await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);await click(selector);await wait(`SugarCube.State.passage===${JSON.stringify(destination)}`)}
 await wait(`!!document.querySelector('.sf-wardrobe-reference-launch')`);report.scene=await evaluate(`({game:StartConfig.version,loader:modUtils.version,scene:SugarCube.State.passage,viewport:{width:innerWidth,height:innerHeight},agent:navigator.userAgent,mods:modUtils.getModListNameNoAlias().map(name=>({name,version:modUtils.getMod(name)?.version})),nativeWardrobe:!!document.querySelector('#wardrobeList')})`);
 const before=hash(await evaluate(state));await click('.sf-wardrobe-reference-launch');
 // Select the first nonempty native category through its original HTML select.
 const category=await evaluate(`(()=>{const s=document.querySelector('.sf-wardrobe-reference-tools select');return [...s.options].find(o=>!/\\(0\\)$/.test(o.textContent))?.value})()`);assert.ok(category);
 await evaluate(`(()=>{const s=document.querySelector('.sf-wardrobe-reference-tools select');s.value=${JSON.stringify(category)};s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
 await wait(`document.querySelectorAll('[data-reference-item]').length>=2`);
 const rows=await evaluate(`[...document.querySelectorAll('[data-reference-item]')].slice(0,2).map(n=>n.dataset.referenceItem)`);assert.equal(rows.length,2);
 const row=k=>'[data-reference-item='+JSON.stringify(k)+']';
 await click(row(rows[0])+' .sf-wardrobe-reference-item-actions button:first-child');await click(row(rows[1])+' [data-select-b]');
 const scroll=await evaluate(`(()=>{const n=document.querySelector('.sf-wardrobe-reference-list');n.scrollTop=30;return n.scrollTop})()`);
 await shot('catalog-tablet');await click('.sf-wardrobe-reference-browse footer button:first-child');
 const plain=await evaluate(`document.querySelector('.sf-wardrobe-reference-comparison').textContent`);await shot('plain-tablet');
 await click('.sf-wardrobe-reference-comparison-screen footer button');
 assert.equal(await evaluate(`document.querySelector('.sf-wardrobe-reference-list').scrollTop`),scroll);assert.equal(await evaluate(`document.activeElement?.closest('[data-reference-item]')?.dataset.referenceItem`),rows[1]);
 await click('.sf-wardrobe-reference-browse footer button:last-child');assert.equal(await evaluate(`document.querySelector('.sf-wardrobe-reference-comparison').textContent`),plain);await shot('spatial-tablet');
 await click('.sf-wardrobe-reference-comparison-screen footer button');await click('.sf-wardrobe-reference-browse footer button:last-child');await click('[data-reference-close]');
 assert.equal(hash(await evaluate(state)),before);report.wardrobeState={before,after:hash(await evaluate(state)),unchanged:true};
 // Leave by an observed native link: reference state must disappear on real navigation.
 const exit='#passages .passage:not(.passage-out) a[data-passage="Bedroom"]';assert.equal(await evaluate(`document.querySelectorAll(${JSON.stringify(exit)}).length`),1);await evaluate(`document.querySelector(${JSON.stringify(exit)}).scrollIntoView({block:'center'})`);await click(exit);await wait(`SugarCube.State.passage==='Bedroom'`);await wait(`!document.querySelector('.sf-wardrobe-reference-launch')`);
 report.navigation={scene:await evaluate('SugarCube.State.passage'),referenceHidden:true};report.status='passed';
 }catch(e){report.status='failed';report.error=e.message;throw e}
 finally{if(client&&installed)try{await evaluate(`(async()=>{const c=modSC2DataManager.getModLoadController();for(const name of ${JSON.stringify(names)})await c.removeModIndexDB(name);await c.overwriteModIndexDBModList(${JSON.stringify(backup.list)});await c.overwriteModIndexDBHiddenModList(${JSON.stringify(backup.hidden)})})()`);await restart();const restored=await evaluate(`modSC2DataManager.getModLoadController().listModIndexDB()`);assert.deepEqual(restored,backup.list);report.cleanup='original Mod list restored'}catch(e){report.cleanup='failed';report.cleanupError=e.message;report.status='cleanup-failed'}if(ctx)await ctx.finish();fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2));console.log(out)}
 assert.equal(report.status,'passed');
})().catch(e=>{console.error(e);process.exitCode=1});
