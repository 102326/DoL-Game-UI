// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"checkpoint","caseSource":"caseCheckpoint"}
import cases = require('../scripts/ci-cases.cjs');
const {caseCheckpoint}=cases;
// Actual built UI CSS on controlled owned/adapter markup; no platform-picker claim.
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import crypto = require('node:crypto');
import playwright = require('playwright');
async function verifyOwnedSelect(browser:playwright.Browser){
 const css=fs.readFileSync(path.resolve('dist/framework/official-ui/style.css'),'utf8'),fallback=fs.readFileSync(path.resolve('src/ui/owned-select.css'),'utf8').split('@supports')[0]!;
 const out=path.resolve('tests/artifacts/ui41/owned-select-'+Date.now());fs.mkdirSync(out,{recursive:true});
 const options='<option value="left">原样 / 靠左</option><option value="blocked" disabled>暂不可用</option><option value="center">居中</option><option value="long">很长的选项内容用于检查窄视口与展开层边界 Long label with words</option>';
 const select=(id:string,attrs='')=>'<select id="'+id+'" aria-label="'+id+'" '+attrs+'>'+options+'</select>';
 const markup='<div id="dol-midnight-controls"><div class="dgu-setting-row">'+select('settings')+select('multiple','multiple')+select('sized','size="3"')+select('disabled','disabled')+'</div></div><nav class="dgp-navigation">'+select('navigation','data-kw-nav-control="action"')+'</nav><header class="dgshop-toolbar"><label class="dgshop-default-filter">'+select('shop')+'</label></header><div class="dgw-root"><div class="dgw-mobile-category">'+select('category')+'</div><div class="dgw-tools">'+select('tools')+'</div><div class="dgw-selection-bar">'+select('selection')+'</div></div><div id="customOverlay" data-dgu-adapter="ModHubSoftWet" data-dgu-adapter-match="full">'+select('modhub','class="modhub-select"')+'<label class="modhub-help-choice">'+select('help')+'</label></div>'+select('unknown');
 const ids=['settings','navigation','shop','category','tools','selection','modhub','help'],rows:unknown[]=[];
 for(const width of [320,1100]){
  const page=await browser.newPage({viewport:{width,height:780}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.setContent('<!doctype html><html data-stone-free="4.0.1" data-dol-midnight><body>'+markup+'</body></html>');await page.addStyleTag({content:css});
   await page.addStyleTag({content:'body{margin:0;background:#181b1d;color:#eee;padding:12px}select{max-width:calc(100vw - 32px);min-height:44px}#dol-midnight-controls{display:block!important;position:static!important;width:auto!important;max-width:none!important;padding:0!important;transform:none!important}#dol-midnight-controls .dgu-setting-row{display:block!important}.dgw-root,.dgw-mobile-category,.dgw-tools,.dgw-selection-bar,.dgshop-toolbar,.dgp-navigation{display:block!important;position:static!important;height:auto!important;width:auto!important}#customOverlay{display:block!important;position:static!important;width:auto!important;height:auto!important}'});
   const supported=await page.evaluate(()=>CSS.supports('appearance','base-select')&&CSS.supports('selector(select::picker(select))'));assert.equal(supported,true,'this Chromium must exercise the enhancement');
   await page.evaluate(()=>{Object.assign(window,{selectEvents:[]});document.addEventListener('change',event=>{const n=event.target;if(n instanceof HTMLSelectElement){Reflect.get(window,'selectEvents').push([n.id,n.value]);if(n.id==='navigation')n.value='left'}})});
   for(const id of ids){
    const n=page.locator('#'+id);assert.equal(await n.evaluate(n=>getComputedStyle(n).appearance),'base-select',id+' enhanced');
    const picker=await n.evaluate(n=>getComputedStyle(n,'::picker(select)').backgroundColor);assert.equal(picker,'rgba(36, 38, 42, 0.98)',id+' picker paint');
    await n.click();const option=n.locator('option[value=center]');await option.click();assert.equal(await n.inputValue(),id==='navigation'?'left':'center',id+' original selection/reset');
    // Escape cancels without a second change. Native element and focus remain intact.
    await n.click();await page.keyboard.press('Escape');assert.equal(await n.evaluate(n=>document.activeElement===n),true,id+' focus return');
    await n.click();const geometry=await n.locator('option[value=long]').evaluate(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,width:r.width,height:r.height}});assert.ok(Number.isFinite(geometry.x)&&geometry.width>0&&geometry.height>=44,id+' finite touch geometry');assert.ok(geometry.x>=-1&&geometry.right<=width+1,id+' picker inline viewport');await page.keyboard.press('Escape');
    rows.push({width,id,picker,geometry});
   }
   const events=await page.evaluate(()=>Reflect.get(window,'selectEvents'));assert.deepEqual(events,ids.map(id=>[id,'center']),'one native change per committed selection');
   await page.locator('#settings').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.equal(await page.locator('#settings').inputValue(),'center','keyboard skips disabled option');
   for(const id of ['multiple','sized','unknown'])assert.notEqual(await page.locator('#'+id).evaluate(n=>getComputedStyle(n).appearance),'base-select',id+' untouched');assert.equal(await page.locator('#disabled').isDisabled(),true);
   await page.locator('#customOverlay').evaluate(n=>n.setAttribute('data-dgu-adapter-match','partial'));assert.notEqual(await page.locator('#modhub').evaluate(n=>getComputedStyle(n).appearance),'base-select','unmatched third party excluded');
   await page.evaluate(()=>document.documentElement.removeAttribute('data-dol-midnight'));assert.notEqual(await page.locator('#settings').evaluate(n=>getComputedStyle(n).appearance),'base-select','off restores native');
   assert.deepEqual(errors,[]);
  }finally{await page.close()}
 }
 const fallbackPage=await browser.newPage();try{await fallbackPage.setContent('<html data-stone-free data-dol-midnight><body>'+markup+'</body></html>');await fallbackPage.addStyleTag({content:fallback});const select=fallbackPage.locator('#settings');assert.notEqual(await select.evaluate(n=>getComputedStyle(n).appearance),'base-select');assert.equal(await select.evaluate(n=>getComputedStyle(n).colorScheme),'dark');await select.selectOption('center');assert.equal(await select.inputValue(),'center');}finally{await fallbackPage.close()}
 caseCheckpoint('native-enhancement');
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'PASS',chromium:browser.version(),builtCssSha256:crypto.createHash('sha256').update(css).digest('hex'),rows,scope:'Eight owned/fully matched adapter structures; 320/1100 CSS px; native changes, navigation reset, focus, keyboard, disabled and excluded controls; fallback CSS branch only. Not actual game/Android/Windows picker or visual acceptance.'},null,2));console.log('PASS shared native selects; '+out);
}
if(require.main===module)(async()=>{const browser=await playwright.chromium.launch(require('./browser-options.cjs'));try{await verifyOwnedSelect(browser)}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
export = {verifyOwnedSelect};
