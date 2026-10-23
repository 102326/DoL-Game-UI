// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
const assert=require('node:assert/strict'),{buildSync}=require('esbuild'),{chromium}=require('playwright');
const adapter=buildSync({entryPoints:['compat/dol-optimization-soft-wet/dol-optimization-soft-wet.ts'],bundle:true,write:false,format:'iife'}).outputFiles[0].text;
const runtime=buildSync({entryPoints:['src/runtime/ui.ts'],bundle:true,write:false,format:'iife',globalName:'UiModule'}).outputFiles[0].text;
const bad='(1/1/NaN aN:aN undefined)',good='(2022/9/4 07:00 星期日)';
(async()=>{
 const browser=await chromium.launch(require('./browser-options.cjs'));
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  async function setup({text=bad,mode='ready',broken=null}={}){
   await page.goto('about:blank');
   await page.setContent('<html data-stone-free data-dol-midnight><body><div id="customOverlay" data-overlay="saves"><div id="overlayTabs"></div><div id="saveList"><input id="pageNum"><input id="pageLen"><div id="saves-list-container"><div class="savesListRow"><span class="saveId">4</span><span class="datestamp">2026/10/24 00:43:53 <span class="pink"></span></span><button id="native">Native load</button></div></div></div></div></body></html>');
   await page.addScriptTag({content:runtime});
   await page.evaluate(({text,mode,broken})=>{
    window.enabled=true;window.reads=0;window.calls=0;window.pending=[];
    window.dateNode=document.querySelector('.pink');dateNode.textContent=text;
    window.nativeRow=dateNode.closest('.savesListRow');window.nativeButton=document.querySelector('#native');nativeButton.onclick=()=>calls++;
    window.item={slot:4,data:{index:3,delta:[{variables:{startDate:63797871600,timeStamp:undefined}},{variables:{timeStamp:[2,1257100]}},{variables:{timeStamp:[2,0]}},{}]}};
    if(broken==='missing'){delete item.data.delta[1].variables.timeStamp;delete item.data.delta[2].variables.timeStamp}
    if(broken==='NaN')item.data.delta[2].variables.timeStamp=[2,NaN];
    if(broken==='Infinity')item.data.delta[2].variables.startDate=[2,Infinity];
    if(broken==='index')item.data.index=99;
    window.before=JSON.stringify(item);
    window.idb={getItem(slot){reads++;if(mode==='deferred')return new Promise(resolve=>pending.push(resolve));return Promise.resolve({...item,slot})}};
    // Model only the native [2,value] variable patches used by this four-frame save.
    window.SugarCube={State:{deltaDecode(delta){const result=[structuredClone(delta[0])];for(const patch of delta.slice(1)){const next=structuredClone(result.at(-1));for(const[key,value]of Object.entries(patch.variables??{})){if(!Array.isArray(value)||value[0]!==2)throw Error('Unsupported fixture patch');next.variables[key]=value[1]}result.push(next)}return result}}};
    // Compute from game seconds; an invalid timestamp stays invalid, never a fixed normal date.
    window.DateTime=class{constructor(seconds){const d=new Date((seconds-62135596800)*1000);this.year=d.getUTCFullYear();this.month=d.getUTCMonth()+1;this.day=d.getUTCDate();this.hour=d.getUTCHours();this.minute=d.getUTCMinutes();this.weekDayName=['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][d.getUTCDay()]}};
    window.getTimeString=(hour,minute)=>hour+':'+String(minute).padStart(2,'0');
    window.modUtils={getMod:()=>({version:'1.1.2.1'}),getSemVerTools:()=>({parseVersion:v=>({version:v}),parseRange:v=>v,satisfies:()=>true})};
    window.runtime=UiModule.createUiRuntime(window,()=>({}));window.DoLGameUI={ui:runtime.api,getPreferences:()=>({savesEnabled:enabled})};
   },{text,mode,broken});
   await page.addScriptTag({content:adapter});
   await page.waitForFunction(()=>DolOptimizationSoftWet.getDiagnostics().match==='full');
  }
  const waitIdle=()=>page.waitForFunction(()=>reads===1&&DolOptimizationSoftWet.getDateDiagnostics().pending===0);
  const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await setup();await page.waitForFunction(expected=>dateNode.textContent===expected,good);
  assert.equal(await page.evaluate(()=>reads),1,'Only the malformed date reads its saved history');
  assert.equal(await page.evaluate(()=>JSON.stringify(item)),await page.evaluate(()=>before),'Stored history is unchanged');
  assert.ok(await page.evaluate(()=>dateNode===document.querySelector('.pink')&&nativeRow===dateNode.closest('.savesListRow')&&nativeButton===document.querySelector('#native')),'Native nodes retained');
  await page.locator('#native').click();assert.equal(await page.evaluate(()=>calls),1,'Native action still runs once');
  await page.evaluate(()=>document.querySelector('#saveList').append(document.createElement('p')));await settle();
  assert.equal(await page.evaluate(()=>reads),1,'Own text and unrelated mutations do not reread');
  await page.evaluate(()=>{enabled=false;document.dispatchEvent(new Event('dol-ui-saves-change'))});
  await page.waitForFunction(expected=>dateNode.textContent===expected,bad);
  await page.evaluate(()=>{enabled=true;document.dispatchEvent(new Event('dol-ui-saves-change'))});await page.waitForFunction(expected=>dateNode.textContent===expected,good);
  await page.evaluate(()=>DolOptimizationSoftWet.destroy());assert.equal(await page.evaluate(()=>dateNode.textContent),bad,'Destroy restores only owned fallback text');

  await setup({text:good});await settle();assert.equal(await page.evaluate(()=>reads),0,'Valid upstream result is an automatic no-op');
  await page.evaluate(()=>{dateNode.textContent='(2022/9/5 08:30 星期一)';document.querySelector('#saveList').append(document.createElement('p'))});await settle();
  assert.equal(await page.evaluate(()=>reads),0);assert.equal(await page.evaluate(()=>dateNode.textContent),'(2022/9/5 08:30 星期一)');

  for(const broken of ['missing','NaN','Infinity','index']){
   await setup({broken});await waitIdle();assert.equal(await page.evaluate(()=>dateNode.textContent),bad,broken+' never fabricates a current date');
   assert.equal(await page.evaluate(()=>DolOptimizationSoftWet.getDateDiagnostics().unavailable),1);
   await page.evaluate(()=>document.querySelector('#saveList').append(document.createElement('p')));await settle();assert.equal(await page.evaluate(()=>reads),1,'Unavailable date does not repeatedly read');
  }

  for(const change of ['close','native-fix','slot','real-date','destroy','structure']){
   await setup({mode:'deferred'});await page.waitForFunction(()=>reads===1);
   await page.evaluate(change=>{
    if(change==='close')document.querySelector('#customOverlay').remove();
    if(change==='native-fix')dateNode.textContent='(2022/9/6 09:00 星期二)';
    if(change==='slot')nativeRow.querySelector('.saveId').textContent='5';
    if(change==='real-date')dateNode.parentNode.firstChild.textContent='2026/10/25 10:00:00 ';
    if(change==='destroy')DolOptimizationSoftWet.destroy();
    if(change==='structure')document.querySelector('#pageLen').remove();
    pending.shift()(structuredClone(item));
   },change);await settle();
   assert.equal(await page.evaluate(()=>dateNode.textContent),change==='native-fix'?'(2022/9/6 09:00 星期二)':bad,change+' rejects a stale async result');
   if(change==='destroy'){await page.evaluate(()=>document.querySelector('#saveList').append(document.createElement('p')));await settle();assert.equal(await page.evaluate(()=>reads),1,'Disposed observer cannot start another request')}
  }

  await setup();await page.waitForFunction(expected=>dateNode.textContent===expected,good);
  await page.evaluate(()=>{dateNode.textContent='(2022/9/7 10:00 星期三)';DolOptimizationSoftWet.destroy()});
  assert.equal(await page.evaluate(()=>dateNode.textContent),'(2022/9/7 10:00 星期三)','Cleanup preserves a newer upstream result');
  await setup({mode:'deferred'});await page.waitForFunction(()=>reads===1);
  await page.evaluate(()=>{dateNode.innerHTML='<b>NaN</b>';pending.shift()(item)});await settle();assert.equal(await page.locator('.pink b').count(),1,'Unknown rich markup stays target-owned');
  assert.deepEqual(errors,[]);
  console.log('PASS optimization date: decoded active frame, valid upstream no-op, native nodes/events, invalid data, async fences, opt-out and destroy');
 }finally{await browser.close()}
})().catch(error=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(error);process.exitCode=1});
