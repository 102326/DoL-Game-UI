import assert = require('node:assert/strict');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
import fs = require('node:fs');
import path = require('node:path');
import type {PreferenceKey,Preferences} from '../src/theme/preferences';
declare const DoLMidnightTheme:{setPreference(key:PreferenceKey,value:boolean|number):void;getPreferences():Preferences};
const {chromium}=playwright;
async function actualSettings(browser:playwright.Browser){
 const {createUi41PreviewServer}=await import('../scripts/preview-ui41.mjs'),server=await createUi41PreviewServer(0),address=server.httpServer?.address();
 assert.ok(address&&typeof address!=='string');const out=path.resolve('tests/artifacts/ui41/centered-layout-'+Date.now());fs.mkdirSync(out,{recursive:true});
 const rows:unknown[]=[],errors:string[]=[];
 try{
  for(const [width,layout,font] of [[1280,'上下',100],[1280,'左右',100],[390,'上下',100],[390,'上下',150]] as const){
   const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto(`http://127.0.0.1:${address.port}/?settings&weather=clear`);await page.getByLabel('选项文字对齐',{exact:true}).waitFor();
    await page.getByRole('button',{name:layout,exact:true}).click();
    await page.evaluate(font=>DoLMidnightTheme.setPreference('fontScale',font),font);
    if(layout==='左右')await page.waitForFunction(()=>document.querySelector('.dmt-workspace')?.getAttribute('data-settings-layout')==='vertical');
    const sample=()=>page.evaluate(()=>[...document.querySelectorAll<HTMLElement>('.dmt-control-sheet .dgu-setting-row')].map(row=>{const label=row.querySelector<HTMLElement>(':scope>span'),input=row.querySelector<HTMLElement>(':scope>input,:scope>select');if(!label||!input)throw Error('Missing actual setting');const box=(n:HTMLElement)=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,cx:r.x+r.width/2,bottom:r.bottom}};return{row:box(row),label:box(label),input:box(input),type:input instanceof HTMLInputElement?input.type:'select',align:getComputedStyle(label).textAlign,overflow:row.scrollWidth>row.clientWidth+1}}));
    const scrollTop=()=>page.locator('.dmt-controls-content').evaluate(n=>{n.scrollTop=0});await scrollTop();const left=await sample();
    await page.getByLabel('选项文字对齐',{exact:true}).selectOption('center');await scrollTop();const centered=await sample();
    for(const s of centered){assert.ok(Math.abs(s.row.cx-s.label.cx)<1&&Math.abs(s.row.cx-s.input.cx)<1,'actual label/control share the content axis');assert.ok(s.input.y>=s.label.bottom+8,'actual control is below the entire label block');assert.ok(s.row.h>=44&&!s.overflow);if(s.type!=='checkbox')assert.ok(s.input.h>=44)}
    const checkbox=page.getByLabel('手机紧凑按钮间距',{exact:true});await checkbox.check();await checkbox.focus();await page.keyboard.press('Space');assert.equal(await checkbox.isChecked(),false);
    const range=page.getByLabel('按钮大小',{exact:true});await range.focus();await page.keyboard.press('ArrowRight');assert.equal(await range.inputValue(),'105');await page.keyboard.press('ArrowLeft');
    await page.getByLabel('选项文字对齐',{exact:true}).selectOption('left');await scrollTop();assert.deepEqual(await sample(),left,'actual default layout restores exactly');
    await page.getByLabel('选项文字对齐',{exact:true}).selectOption('center');await scrollTop();await page.screenshot({path:path.join(out,`${width}-${layout}-${font}-reading.png`)});
    await page.getByRole('button',{name:'材质',exact:true}).click();
    const material=await sample();for(const s of material)assert.ok(Math.abs(s.row.cx-s.label.cx)<1&&Math.abs(s.row.cx-s.input.cx)<1);
    const scale=await page.evaluate(()=>{const range=document.querySelector<HTMLInputElement>('.dmt-acrylic-control input'),scale=document.querySelector<HTMLElement>('.dmt-acrylic-scale');if(!range||!scale)throw Error('Missing material scale');const a=range.getBoundingClientRect(),b=scale.getBoundingClientRect();return{range:[a.x,a.width],scale:[b.x,b.width]}});assert.deepEqual(scale.range,scale.scale,'scale labels follow slider endpoints');
    await page.getByLabel('Acrylic 通透度',{exact:true}).fill('60');await scrollTop();await page.screenshot({path:path.join(out,`${width}-${layout}-${font}-material.png`)});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.reload();assert.equal(await page.getByLabel('选项文字对齐',{exact:true}).inputValue(),'center');
    rows.push({width,layout,font,centered,material,scale});
   }finally{await page.close()}
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({scope:'Actual source settings and production CSS; no device/visual acceptance',rows,errors},null,2));console.log('PASS actual centered settings: 4 width/layout/font cases, axes, scale, input, persistence and exact default restoration; '+out);
 }finally{await server.close()}
}
(async()=>{const browser=await chromium.launch(browserOptions);try{
 for(const width of [390,1200]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.setContent(`<html data-stone-free data-dol-midnight data-dmt-layout><body><aside id="ui-bar"><div id="overlayButtons"><button data-kw-nav-control="entry">界面设置</button><button id="foreign">第三方</button></div></aside><div id="dol-midnight-controls" open><div class="dmt-settings-shell"><div class="dmt-workspace" data-settings-layout="${width===390?'horizontal':'vertical'}"><nav class="dmt-workspace-nav"><button data-kw-nav-control="category">阅读</button></nav><div class="dmt-control-sheet"><label class="dgu-setting-row"><span><strong>手机紧凑按钮间距</strong><small>一段需要在手机上换行的较长中文说明文字，确保文字仍然清晰可读。</small></span><input type="checkbox" aria-label="选项"></label><label class="dgu-setting-row"><span>输入值</span><input value="不要居中"></label><p id="prose">正文保持原来的对齐方式。</p></div></div></div></div><div id="customOverlay" class="dgp-overlay"><div id="overlayTabs"><button data-kw-nav-control="tab">游戏设置</button><button id="unknown">未知扩展</button></div><nav class="dgp-navigation"><button data-kw-nav-control="category">回到顶部</button></nav></div></body></html>`);
  for(const css of ['src/theme/controls.css','src/theme/stone-free.css','src/theme/settings-workspace.css','src/theme/navigation-material.css','src/theme/option-alignment.css'])await page.addStyleTag({path:css});
  const snapshot=()=>page.evaluate(()=>{
   const pick=(selector:string)=>{const n=document.querySelector<HTMLElement>(selector);if(!n)throw Error('Missing '+selector);const s=getComputedStyle(n),r=n.getBoundingClientRect();return {align:s.textAlign,justify:s.justifyContent,box:[r.x,r.y,r.width,r.height],overflow:n.scrollWidth>n.clientWidth+1}};
   return {category:pick('.dmt-workspace-nav button'),entry:pick('#overlayButtons button'),tab:pick('#overlayTabs button'),nav:pick('.dgp-navigation button'),row:pick('.dgu-setting-row'),label:pick('.dgu-setting-row span'),input:pick('input[type=checkbox]'),value:pick('input[value]'),prose:pick('#prose'),foreign:pick('#foreign'),unknown:pick('#unknown')};
  });
  const before=await snapshot();for(const key of ['category','entry','tab','nav','row','label','input'] as const)assert.ok((before[key].box[2]??0)>0&&(before[key].box[3]??0)>0,`${width} ${key} visible`);await page.evaluate(()=>document.documentElement.setAttribute('data-dgu-options-centered',''));const centered=await snapshot();
  for(const key of ['category','entry','tab','nav','label'] as const)assert.equal(centered[key].align,'center',`${width} ${key}`);
  for(const key of ['category','entry'] as const)assert.equal(centered[key].justify,'center',`${width} ${key} flex`);
  for(const key of ['entry','tab','nav','foreign','unknown'] as const)assert.deepEqual(centered[key].box,before[key].box,`${width} ${key} geometry`);
  // Taller centered rows may move later content, but must not resize navigation,
  // text inputs or prose. Their original layout returns when the mode is off.
  for(const key of ['category','value','prose'] as const)assert.deepEqual(centered[key].box.slice(2),before[key].box.slice(2),`${width} ${key} size`);
  for(const key of ['value','prose','foreign','unknown'] as const)assert.equal(centered[key].align,before[key].align,`${width} ${key} untouched`);
  const axis=(box:number[])=>box[0]!+box[2]!/2;
  assert.ok(Math.abs(axis(centered.label.box)-axis(centered.row.box))<1,'title and description share the row center');
  assert.ok(Math.abs(axis(centered.input.box)-axis(centered.row.box))<1,'control shares the title axis');
  assert.ok(centered.input.box[1]!>=centered.label.box[1]!+centered.label.box[3]!+8,'control follows its label block with deliberate separation');
  assert.ok(centered.row.box[3]!>=44,'full label keeps its touch target');
  assert.equal(centered.label.overflow,false);if(width===390)assert.ok((centered.label.box[3]??0)>40,'long Chinese wraps without clipping on phone: '+JSON.stringify(centered.label));
  await page.getByLabel('选项',{exact:true}).check();assert.equal(await page.getByLabel('选项',{exact:true}).isChecked(),true);
  await page.evaluate(()=>document.documentElement.removeAttribute('data-dgu-options-centered'));assert.deepEqual(await snapshot(),before,`${width} restores defaults`);
  await page.close();
 }
 await actualSettings(browser);
 console.log('PASS option alignment toggles and restores at phone/desktop widths with shared title/control axes, preserved default layout, prose and unknown nodes');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
