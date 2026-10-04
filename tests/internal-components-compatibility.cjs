// Isolated regression for the compatibility guard; beta.40 audit evidence stays in docs/audits.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const project=path.resolve(process.env.DOL_TEST_WORKSPACE||path.resolve(__dirname,'../../..'));
const integrated=!!process.env.DOL_WARDROBE_INTEGRATED,report={baseline:integrated?'integrated':'vanilla',passes:[],risks:{}};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=pathname==='/game'?path.join(project,integrated?'upstream/game-0.5.11.9/Degrees of Lewdity.html':'releases/source-baseline-0.5.11.9/vanilla.html'):path.join(project,'upstream/game-0.5.11.9',pathname);
 if(!file.startsWith(project)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
});
function pass(name,value){assert.ok(value,name);report.passes.push(name)}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
 async function boot(){const p=await browser.newPage({viewport:{width:1704,height:1136}});await p.addInitScript(()=>localStorage.setItem('verifiedAge','true'));await p.goto(`http://127.0.0.1:${server.address().port}/game`,{waitUntil:'load',timeout:90000});await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options,{timeout:60000});await p.waitForLoadState('networkidle');await p.evaluate(()=>SugarCube.Engine.play('Start2'));await p.waitForLoadState('networkidle');return p}
 const p=await boot();await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
 async function open(key){await p.evaluate(key=>{if(!document.querySelector('#customOverlay').classList.contains('hidden'))closeOverlay();new SugarCube.Wikifier(null,`<<overlayReplace "${key}">>`)},key);await p.waitForSelector('.dgp-navigation')}
 await open('options');await p.evaluate(()=>DoLPanelsUI.setEnabled('settings',false));
 await p.evaluate(()=>{
  window.auditBody=document.querySelector('#customOverlayContent');window.auditV=JSON.stringify(V);
  window.auditNodes=[...auditBody.querySelectorAll('*')].map(n=>({n,parent:n.parentNode,attributes:[...n.attributes].filter(a=>a.name!=='style').map(a=>[a.name,a.value])}));
  window.auditPrevious=auditBody.previousElementSibling;
 });
 await p.evaluate(()=>DoLPanelsUI.setEnabled('settings',true));await p.waitForSelector('.dgp-navigation');
 pass('Settings: original node identity, parents and non-style attributes retained',await p.evaluate(()=>auditNodes.every(({n,parent,attributes})=>n.isConnected&&n.parentNode===parent&&JSON.stringify([...n.attributes].filter(a=>a.name!=='style').map(a=>[a.name,a.value]))===JSON.stringify(attributes))));
 pass('Enabling presentation does not write V',await p.evaluate(()=>JSON.stringify(V)===auditV));
 report.risks.bodySiblingChanged=await p.evaluate(()=>auditBody.previousElementSibling!==auditPrevious);
 // Same native label/input, same trusted keyboard activation sequence in both modes.
 const sequences=[];
 for(const enabled of [false,true]){
  await p.evaluate(enabled=>{DoLPanelsUI.setEnabled('settings',enabled);window.auditEvents=[];const e=document.querySelector('#checkbox-optionsnevernudemenus');window.auditEventControl=e;window.auditListener=event=>{if(event.target===e)auditEvents.push({type:event.type,trusted:event.isTrusted})};for(const type of ['click','input','change','focus','blur'])auditBody.addEventListener(type,auditListener,true)},enabled);
  const control=p.locator('#checkbox-optionsnevernudemenus'),before=await control.isChecked();await control.focus();await p.keyboard.press('Space');await control.evaluate(e=>e.blur());
  pass(`Native checkbox callback and keyboard work (${enabled?'skin':'original'})`,await p.evaluate(before=>V.options.neverNudeMenus===!before,before));
  sequences.push(await p.evaluate(()=>{for(const type of ['click','input','change','focus','blur'])auditBody.removeEventListener(type,auditListener,true);return auditEvents}));
 }
 assert.deepEqual(sequences[1],sequences[0]);report.eventSequence=sequences[1];report.passes.push('Native click/input/change/focus/blur sequence identical');
 await p.evaluate(()=>{window.auditCheckbox=document.querySelector('#checkbox-optionsnevernudemenus');auditCheckbox.checked=true});
 pass('Checked state is rendered by the visible original native checkbox',await p.locator('#checkbox-optionsnevernudemenus').evaluate(e=>e.checked&&getComputedStyle(e).appearance!=='none'&&getComputedStyle(e).opacity==='1'));
 await p.evaluate(()=>auditCheckbox.checked=false);
 pass('External checkbox state needs no copied UI state',await p.evaluate(()=>auditCheckbox===document.querySelector('#checkbox-optionsnevernudemenus')&&!auditCheckbox.checked));
 await p.evaluate(()=>{auditCheckbox.checked=!V.options.neverNudeMenus;auditCheckbox.dispatchEvent(new Event('change',{bubbles:true}))});
 pass('Native change updates V after external property assignment',await p.evaluate(()=>auditCheckbox.checked===V.options.neverNudeMenus));
 await p.locator('#customOverlayContent label:has(>input[name="radiobutton-optionsdateformat"])').nth(1).click();
 pass('Native radio label click maps macro value to V',await p.evaluate(()=>V.options.dateFormat==='en-US'));
 const radioGeometry=await p.locator('input[name="radiobutton-optionsdateformat"]').nth(1).evaluate(e=>({input:{width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height},label:{width:e.parentElement.getBoundingClientRect().width,height:e.parentElement.getBoundingClientRect().height}}));
 pass('Visible native radio retains compact shape and 44px label hit area',radioGeometry.label.height>=44&&radioGeometry.input.width>=12&&radioGeometry.input.height>=12&&radioGeometry.input.width<radioGeometry.label.width);
 await p.evaluate(()=>{document.querySelectorAll('input[name="radiobutton-optionsdateformat"]')[2].checked=true});
 pass('External radio selection is rendered by the original visible input',await p.locator('input[name="radiobutton-optionsdateformat"]').nth(2).evaluate(e=>e.checked&&getComputedStyle(e).opacity==='1'&&getComputedStyle(e).appearance!=='none'));
 await p.evaluate(()=>document.querySelectorAll('input[name="radiobutton-optionsdateformat"]')[2].dispatchEvent(new Event('change',{bubbles:true})));
 pass('Native radio change maps external selection to V',await p.evaluate(()=>V.options.dateFormat==='zh-CN'));
 // Known native select semantics are owned by the original SugarCube handler.
 await p.locator('#listbox-optionslistboxoutfitsenabled').selectOption('1');pass('Original select change updates mapped game value',await p.evaluate(()=>V.options.listboxOutfitsEnabled===true));
 await p.evaluate(()=>{
  const mod=document.createElement('section');mod.id='audit-mod';mod.innerHTML='<h3 class="settingsHeader">Injected Mod</h3><form><label><textarea id="audit-unknown" data-mod="kept">unknown</textarea></label><audit-custom>Unknown custom element</audit-custom><select id="audit-select" name="mod-choice"><option value="a">A</option></select><button type="submit">Mod submit</button></form>';
  auditBody.append(mod);window.auditModSelect=mod.querySelector('select');window.auditModEvents=[];
  auditModSelect.addEventListener('change',e=>auditModEvents.push(e.target.value));mod.querySelector('form').addEventListener('submit',e=>{e.preventDefault();window.auditSubmit=true});mod.addEventListener('mod-audit',()=>window.auditCustom=true);
  auditModSelect.add(new Option('B injected dynamically','b'));
 });
 await p.waitForFunction(()=>[...document.querySelectorAll('.dgp-navigation option')].some(e=>e.textContent==='Injected Mod'));
 await p.locator('#audit-select').selectOption('b');await p.locator('#audit-mod button').click();await p.evaluate(()=>document.querySelector('#audit-mod').dispatchEvent(new Event('mod-audit')));
 pass('Unknown controls, dynamic options, submit and custom events retained',await p.evaluate(()=>auditModSelect===document.querySelector('#audit-select')&&auditModSelect.value==='b'&&auditModEvents[0]==='b'&&auditSubmit&&auditCustom&&document.querySelector('#audit-unknown').getClientRects().length>0));
 pass('Unknown custom element remains visible',await p.locator('audit-custom').isVisible());
 await p.evaluate(()=>{auditModSelect.disabled=true;auditModSelect.options[0].selected=true});pass('External select disabled and selected remain authoritative',await p.locator('#audit-select').isDisabled()&&await p.locator('#audit-select').inputValue()==='a');
 await p.evaluate(()=>{auditModSelect.disabled=false;auditModSelect.value='b'});pass('External select value needs no copied UI state',await p.locator('#audit-select').inputValue()==='b');
 await p.evaluate(()=>auditModSelect.options[1].remove());pass('Dynamic option removal remains native',await p.locator('#audit-select option').count()===1);
 await p.waitForTimeout(150); // Let the preceding option removal and Vue render settle.
 await p.evaluate(()=>document.querySelector('#audit-mod h3').firstChild.data='Renamed Mod');await p.waitForTimeout(100);
 report.risks.textOnlyNavigationStale=await p.evaluate(()=>[...document.querySelectorAll('.dgp-navigation option')].some(e=>e.textContent==='Injected Mod'));
 pass('Text-only navigation rename refreshes',!report.risks.textOnlyNavigationStale);
 await p.evaluate(()=>document.querySelector('#audit-mod h3').hidden=true);await p.waitForTimeout(100);
 report.risks.hiddenHeadingStillIndexed=await p.evaluate(()=>[...document.querySelectorAll('.dgp-navigation option')].some(e=>/Injected Mod|Renamed Mod/.test(e.textContent)));
 pass('Hidden heading leaves navigation',!report.risks.hiddenHeadingStillIndexed);
 await p.evaluate(()=>document.querySelector('#audit-mod h3').hidden=false);
 await p.waitForFunction(()=>[...document.querySelectorAll('.dgp-navigation option')].some(e=>e.textContent==='Renamed Mod'));
 await p.evaluate(()=>document.querySelector('#audit-mod h3').remove());
 await p.waitForFunction(()=>![...document.querySelectorAll('.dgp-navigation option')].some(e=>e.textContent==='Renamed Mod'));
 report.passes.push('Heading unhide and removal refresh navigation');
 await p.evaluate(async()=>{await new Promise(r=>setTimeout(r,30));const h=document.createElement('h3');h.className='settingsHeader';h.id='audit-delayed';h.textContent='Delayed Section';auditBody.append(h)});
 await p.waitForFunction(()=>[...document.querySelectorAll('.dgp-navigation option')].some(e=>e.textContent==='Delayed Section'));report.passes.push('Delayed Mod section appears in navigation');
 await p.evaluate(()=>document.querySelector('#audit-delayed').remove());await p.waitForFunction(()=>![...document.querySelectorAll('.dgp-navigation option')].some(e=>e.textContent==='Delayed Section'));
 // Visibility contract: compare exactly the same hidden nodes without/with UI.
 const visibility=[];
 for(const enabled of [false,true]){
  await p.evaluate(enabled=>{
   DoLPanelsUI.setEnabled('settings',enabled);
   document.querySelector('#audit-hidden')?.remove();const node=document.createElement('div');node.id='audit-hidden';node.innerHTML='<label hidden><input type="checkbox">Hidden checkbox</label><label hidden><input type="radio">Hidden radio</label><div hidden class="settingsGrid">Hidden grid</div>';auditBody.append(node);
  },enabled);await p.waitForTimeout(80);
  visibility.push(await p.locator('#audit-hidden > *').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).display)));
 }
 report.risks.hiddenSettings={original:visibility[0],skin:visibility[1]};
 assert.deepEqual(visibility[1],['none','none','none']);report.passes.push('Hidden labels and grids never reappear in adapted settings');
 await p.evaluate(()=>{const row=document.createElement('div');row.id='audit-hidden-parent';row.hidden=true;row.innerHTML='<label><input type="checkbox">Hidden parent</label>';auditBody.append(row)});
 pass('Hidden ancestor suppresses its adapted child',!await p.locator('#audit-hidden-parent label').isVisible());
 await p.evaluate(()=>{const e=document.querySelector('#audit-hidden-parent');e.hidden=false;e.style.display='none'});
 pass('Explicit display:none stays hidden',!await p.locator('#audit-hidden-parent label').isVisible());
 await p.evaluate(()=>{const e=document.querySelector('#audit-hidden-parent');e.style.display='';e.className='hidden'});
 pass('Native hidden class suppresses adapted descendants',!await p.locator('#audit-hidden-parent label').isVisible());
 // Native fallback round trip is value preserving; reopen reads V via original macros.
 await p.evaluate(()=>{DoLPanelsUI.setEnabled('settings',false);document.querySelector('#checkbox-optionsnevernudemenus').click()});
 const fallbackValue=await p.evaluate(()=>V.options.neverNudeMenus);await p.evaluate(()=>DoLPanelsUI.setEnabled('settings',true));
 pass('Original-to-skin round trip retains same native control value',await p.locator('#checkbox-optionsnevernudemenus').isChecked()===fallbackValue);
 await open('options');pass('Page reopening reads original game state',await p.locator('#checkbox-optionsnevernudemenus').isChecked()===fallbackValue);
 await open('traits');
 await p.evaluate(()=>DoLPanelsUI.setEnabled('traits',false));
 await p.evaluate(()=>{window.auditTraitNodes=[...document.querySelectorAll('#customOverlayContent *')].map(n=>({n,parent:n.parentNode}));window.auditTraitV=JSON.stringify(V)});
 await p.evaluate(()=>DoLPanelsUI.setEnabled('traits',true));
 pass('Traits: node identity and parents retained; no game state writes',await p.evaluate(()=>auditTraitNodes.every(({n,parent})=>n.isConnected&&n.parentNode===parent)&&JSON.stringify(V)===auditTraitV));
 await p.evaluate(()=>{const row=document.querySelector('#traitLists .trait'),copy=row.cloneNode(true);copy.id='audit-trait';copy.querySelector('span').textContent='Injected Trait';row.parentElement.append(copy)});
 await p.waitForFunction(()=>document.querySelector('#traitLists [data-dgp-count]').dataset.dgpCount==='2');
 pass('Mod trait retained in native layout and indexed count',await p.locator('#audit-trait').isVisible());
 const hiddenTrait=[];
 for(const enabled of [false,true]){await p.evaluate(enabled=>{DoLPanelsUI.setEnabled('traits',enabled);document.querySelector('#audit-trait').firstElementChild.hidden=true},enabled);hiddenTrait.push(await p.locator('#audit-trait > span').first().evaluate(e=>getComputedStyle(e).display))}
 report.risks.hiddenTraitName={original:hiddenTrait[0],skin:hiddenTrait[1]};
 assert.equal(hiddenTrait[1],'none');report.passes.push('Hidden trait name remains hidden');
 await p.evaluate(()=>document.querySelector('#audit-trait').hidden=true);await p.waitForTimeout(80);
 report.risks.hiddenTraitCount=await p.locator('#traitLists [data-dgp-count]').first().getAttribute('data-dgp-count');
 assert.equal(report.risks.hiddenTraitCount,'1');report.passes.push('Trait count excludes hidden rows');
 for(const mode of ['visible','none','visible']){
  await p.evaluate(mode=>{const e=document.querySelector('#audit-trait');e.hidden=false;e.style.display=mode==='none'?'none':''},mode);
  await p.waitForFunction(count=>document.querySelector('#traitLists [data-dgp-count]').dataset.dgpCount===count,mode==='none'?'1':'2');
 }
 report.passes.push('Trait count follows display:none and restoration');
 await p.evaluate(()=>document.querySelector('#audit-trait').remove());await p.waitForFunction(()=>document.querySelector('#traitLists [data-dgp-count]').dataset.dgpCount==='1');report.passes.push('Removed trait does not leave stale count or target');
 const stable=await p.evaluate(()=>DoLPanelsUI.getLifecycleCounts());await p.waitForTimeout(150);assert.deepEqual(await p.evaluate(()=>DoLPanelsUI.getLifecycleCounts()),stable);report.passes.push('No observer churn while idle after dynamic injection');
 await p.evaluate(()=>{closeOverlay();V.settingsExitPassage='Bedroom';SugarCube.Engine.play('Settings')});await p.waitForSelector('.passage[data-dgp-panel=settings]');
 await p.evaluate(()=>{const h=document.createElement('div');h.className='settingsHeader';h.textContent='Inline Mod Section';document.querySelector('#passages .passage:last-child').append(h)});await p.waitForTimeout(100);
 report.risks.inlineDynamicNavigationMissing=await p.evaluate(()=>![...document.querySelectorAll('.passage .dgp-navigation option')].some(e=>e.textContent==='Inline Mod Section'));
 pass('Inline dynamic section indexed and visible',!report.risks.inlineDynamicNavigationMissing&&await p.locator('.passage .settingsHeader').last().isVisible());
 // Navigation retains the original DOM target even when unrelated siblings appear.
 await p.evaluate(()=>{const node=document.querySelector('.passage .settingsHeader:last-child');window.auditTarget=node;window.auditScrollTarget=null;node.scrollIntoView=function(){auditScrollTarget=this};node.before(document.createElement('div'))});
 await p.waitForTimeout(80);const nav=p.locator('.passage .dgp-navigation select');await nav.selectOption({label:'Inline Mod Section'});
 pass('Navigation goes to the original target after sibling insertion',await p.evaluate(()=>auditScrollTarget===auditTarget));
 // Native options also survive serialization and a fresh runtime without the UI.
 await p.evaluate(()=>SugarCube.Engine.play('Bedroom'));const expected=await p.evaluate(()=>({neverNudeMenus:V.options.neverNudeMenus,dateFormat:V.options.dateFormat,listboxOutfitsEnabled:V.options.listboxOutfitsEnabled}));
 const serialized=await p.evaluate(()=>SugarCube.Save.serialize());await p.reload({waitUntil:'load'});await p.waitForFunction(()=>window.SugarCube?.State?.variables?.options);await p.evaluate(data=>SugarCube.Save.deserialize(data),serialized);
 assert.deepEqual(await p.evaluate(()=>({neverNudeMenus:V.options.neverNudeMenus,dateFormat:V.options.dateFormat,listboxOutfitsEnabled:V.options.listboxOutfitsEnabled})),expected);report.passes.push('Modified options serialize/load in fresh native runtime without UI');
 report.recovery={};
 for(const stage of ['insert','vue','index']){
  const fault=await boot();await fault.evaluate(()=>new SugarCube.Wikifier(null,'<<overlayReplace "options">>'));
  await fault.evaluate(stage=>{
   window.auditFaultV=JSON.stringify(V);window.auditFaultNative=document.querySelector('#checkbox-optionsnevernudemenus');
   window.auditRestore=[];
   const method=stage==='insert'?'before':stage==='vue'?'insertBefore':'querySelectorAll',original=Element.prototype[method];
   auditRestore.push(()=>Element.prototype[method]=original);
   Element.prototype[method]=function(...args){if(stage==='insert'?args.some(n=>n?.classList?.contains('dgp-host')):stage==='vue'?this.classList?.contains('dgp-host'):args[0]==='.settingsHeader')throw new Error('AUDIT_PANEL_'+stage.toUpperCase()+'_FAILURE');return original.apply(this,args)};
  },stage);
  await fault.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});await fault.waitForTimeout(120);
  const result=await fault.evaluate(()=>({globalAPI:!!window.DoLGameUI,panelAPI:!!window.DoLPanelsUI,fallbackButton:!!document.querySelector('.dgp-recovery'),nativeControl:auditFaultNative===document.querySelector('#checkbox-optionsnevernudemenus'),unchanged:JSON.stringify(V)===auditFaultV,lastFailure:DoLPanelsUI.getLastFailure(),failures:DoLPanelsUI.getLifecycleCounts().failures}));
  report.recovery[stage]=result;pass(`${stage} failure preserves global API, native DOM/state and independent fallback`,result.globalAPI&&result.panelAPI&&result.fallbackButton&&result.nativeControl&&result.unchanged&&result.failures===1&&result.lastFailure.includes('AUDIT_PANEL_'));
  await fault.evaluate(()=>{auditRestore.forEach(fn=>fn());document.querySelector('#checkbox-optionsnevernudemenus').click()});pass(`Native settings execute after ${stage} failure`,await fault.evaluate(()=>document.querySelector('#checkbox-optionsnevernudemenus').checked===V.options.neverNudeMenus));
  await fault.locator('.dgp-recovery').click();pass(`Independent ${stage} fallback clickable`,await fault.locator('.dgp-recovery').count()===0);
  await fault.evaluate(()=>DoLPanelsUI.setEnabled('settings',true));await fault.waitForSelector('.dgp-navigation');pass(`Retry after ${stage} recovery preserves original control`,await fault.evaluate(()=>auditFaultNative===document.querySelector('#checkbox-optionsnevernudemenus')));
  await fault.close();
 }
 const observeFault=await boot();await observeFault.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});await observeFault.evaluate(()=>new SugarCube.Wikifier(null,'<<overlayReplace "options">>'));await observeFault.waitForSelector('.dgp-navigation');
 await observeFault.evaluate(()=>{const div=document.createElement('div');div.id='audit-observe-fault';document.querySelector('#customOverlayContent').append(div)});await observeFault.waitForTimeout(100);
 await observeFault.evaluate(()=>{const div=document.querySelector('#audit-observe-fault');div.querySelector=()=>{throw new Error('AUDIT_OBSERVER_FAILURE')};div.style.visibility='hidden'});
 await observeFault.waitForSelector('.dgp-recovery');pass('Mutation callback failure also returns to native UI',await observeFault.evaluate(()=>!!DoLGameUI&&DoLPanelsUI.getLastFailure().includes('AUDIT_OBSERVER_FAILURE')&&!document.querySelector('.dgp-host')&&!!document.querySelector('#checkbox-optionsnevernudemenus')));await observeFault.close();
 // Simulated older selector support: discard enhancement CSS and reject :has in JS.
 const old=await boot();await old.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});
 await old.evaluate(()=>{function strip(sheet){for(let i=sheet.cssRules.length-1;i>=0;i--){const rule=sheet.cssRules[i];if(rule.conditionText?.includes(':has')||rule.selectorText?.includes(':has'))sheet.deleteRule(i);else if(rule.cssRules)strip(rule)}}for(const sheet of document.styleSheets)try{strip(sheet)}catch{}const query=Element.prototype.querySelectorAll;Element.prototype.querySelectorAll=function(selector){if(selector.includes(':has('))throw new DOMException('Unsupported selector','SyntaxError');return query.call(this,selector)}});
 await old.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});await old.evaluate(()=>new SugarCube.Wikifier(null,'<<overlayReplace "options">>'));await old.waitForSelector('.dgp-navigation');
 pass('Without :has enhancement native radio remains visible and usable',await old.locator('input[name="radiobutton-optionsdateformat"]').first().evaluate(e=>getComputedStyle(e).opacity!=='0'&&e.getBoundingClientRect().width>1));
 await old.locator('input[name="radiobutton-optionsdateformat"]').nth(1).check();pass('Selector downgrade retains native radio business callback',await old.evaluate(()=>V.options.dateFormat==='en-US'&&DoLPanelsUI.getLifecycleCounts().failures===0));await old.close();
 const folder=path.join(__dirname,'artifacts');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,`internal-components-compatibility-${report.baseline}.json`),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
