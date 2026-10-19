// Lifecycle and stale-input contracts only; real Mod business is checked separately.
const assert=require('node:assert/strict'),{buildSync}=require('esbuild'),{chromium}=require('playwright');
const source=buildSync({entryPoints:['compat/dol-optimization-soft-wet/dol-optimization-soft-wet.ts'],bundle:true,write:false,format:'iife'}).outputFiles[0].text;
(async()=>{const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.setContent('<html data-stone-free="3.0.2" data-dol-midnight><body><div id="passages"><div class="passage"><div class="dgw-shell"><div class="dgw-equipment"></div></div></div></div><div id="signal"></div></body></html>');
 await page.evaluate(()=>{
  window.enabled=true;window.wardrobeEnabled=true;window.busy=false;window.nativeCalls=0;window.refreshes=0;window.targetVersion='1.1.2';
  window.V={lastWardrobeSlot:'upper',worn:{upper:{index:1}},wornStacking:{},wardrobe:{upper:[]}};
  window.selectWardrobe=()=>V.wardrobe;
  window.DolOptimization={data:{WornStacking:false},wornStackingRemove(){},wornStackingMove(){}};
  window.template='<<set $wornStacking ??= {}>>叠加装备: <<run DolOptimization.wornStackingRemove(1,"upper")>><<run DolOptimization.wornStackingMove(0,-1,"upper")>><<if $worn[_wardrobe_list].name isnot "naked">>';
  window.validTemplate=template;
  window.SugarCube={State:{variables:V},Story:{get:()=>({text:template})},Wikifier:class{constructor(output,text){
   window.nativeSource=text;V.wornStacking[V.lastWardrobeSlot]??=[];
   if(!DolOptimization.data.WornStacking){output.textContent='未启用';return}
   output.innerHTML='<div class="wardrobeItem"><a class="link-internal" href="#">原卸下</a></div>';
   output.querySelector('a').onclick=event=>{event.preventDefault();nativeCalls++;V.wornStacking[V.lastWardrobeSlot].push({index:nativeCalls})};
  }}};
  window.modUtils={getMod:()=>({version:targetVersion}),getPassageData:()=>({content:template}),getSemVerTools:()=>({parseVersion:v=>({version:v}),parseRange:v=>v,satisfies:v=>['1.1.1.5','1.1.2'].includes(v)})};
  window.DoLWardrobeUI={getEnabled:()=>wardrobeEnabled,isBusy:()=>busy,refresh:()=>{refreshes++}};
  window.DoLGameUI={ui:{apiVersion:1,getCapabilities:()=>({enabled,styleAdapters:true,hasSelector:true}),registerStyleAdapter:()=>({getDiagnostics:()=>({status:'inactive'}),destroy(){}})}};
  window.signal=()=>document.querySelector('#signal').textContent=String(Math.random());
 });
 await page.addScriptTag({content:source});await page.waitForSelector('.dgu-optimization-stacking');
 assert.equal(await page.evaluate(()=>DolOptimization.data.WornStacking),false,'No implicit opt-in');assert.equal(await page.locator('.dgu-optimization-stacking a').count(),0);
 await page.evaluate(()=>{DolOptimization.data.WornStacking=true;signal()});await page.waitForSelector('.dgu-optimization-stacking a');
 assert.ok(await page.evaluate(()=>nativeSource.includes('<<capture _wardrobe_list _selectedWardrobe')&&nativeSource.includes('selectWardrobe()')));
 await page.locator('.dgu-optimization-stacking a').evaluate(n=>{n.click();n.click()});await page.waitForFunction(()=>refreshes===1);
 assert.equal(await page.evaluate(()=>nativeCalls),1,'Old node dispatches at most once after state changes');
 await page.evaluate(()=>{window.obsolete=document.querySelector('.dgu-optimization-stacking a');V={...V,wornStacking:{upper:[]}};SugarCube.State.variables=V;obsolete.click()});
 assert.equal(await page.evaluate(()=>nativeCalls),1,'Load/replaced variables invalidate captured controls');await page.waitForTimeout(80);
 await page.evaluate(()=>{busy=true;document.querySelector('.dgw-equipment').inert=true;document.querySelector('.dgu-optimization-stacking a')?.click()});assert.equal(await page.evaluate(()=>nativeCalls),1);await page.waitForFunction(()=>!document.querySelector('.dgu-optimization-stacking'));
 await page.evaluate(()=>{busy=false;document.querySelector('.dgw-equipment').inert=false});await page.waitForSelector('.dgu-optimization-stacking');
 for(const invalid of ['',null,'duplicate']){
  await page.evaluate(()=>{template=validTemplate;signal()});await page.waitForSelector('.dgu-optimization-stacking');
  await page.evaluate(value=>{template=value==='duplicate'?validTemplate+validTemplate:value??'unknown';signal()},invalid);
  await page.waitForFunction(()=>!document.querySelector('.dgu-optimization-stacking'));
 }
 await page.evaluate(()=>{template=validTemplate;signal()});await page.waitForSelector('.dgu-optimization-stacking');
 await page.evaluate(()=>{targetVersion='unknown';signal()});await page.waitForFunction(()=>!document.querySelector('.dgu-optimization-stacking'));
 await page.evaluate(()=>{targetVersion='1.1.1.5';signal()});await page.waitForSelector('.dgu-optimization-stacking');
 await page.evaluate(()=>{enabled=false;document.documentElement.removeAttribute('data-dol-midnight')});await page.waitForFunction(()=>!document.querySelector('.dgu-optimization-stacking'));
 await page.evaluate(()=>{enabled=true;document.documentElement.setAttribute('data-dol-midnight','')});await page.waitForSelector('.dgu-optimization-stacking');
 await page.evaluate(()=>document.querySelector('.passage').remove());await page.waitForFunction(()=>!document.querySelector('.dgu-optimization-stacking'));
 await page.evaluate(()=>{DolOptimizationSoftWet.destroy();document.querySelector('#passages').innerHTML='<div class="passage"><div class="dgw-shell"><div class="dgw-equipment"></div></div></div>'});await page.waitForTimeout(100);
 assert.equal(await page.locator('.dgu-optimization-stacking').count(),0);assert.equal(await page.evaluate(()=>typeof DolOptimizationSoftWet),'undefined');
 console.log('PASS optimization wardrobe native-template projection: opt-in, slot/inventory capture, stale/repeated input, busy, unknown source/version, master off, passage and destroy');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exit(1)});
