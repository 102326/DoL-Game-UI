import assert = require('node:assert/strict');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');
const {chromium}=playwright;
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
  for(const key of ['category','entry','tab','nav','row','input','value','prose','foreign','unknown'] as const)assert.deepEqual(centered[key].box,before[key].box,`${width} ${key} geometry`);
  for(const key of ['value','prose','foreign','unknown'] as const)assert.equal(centered[key].align,before[key].align,`${width} ${key} untouched`);
  assert.equal(centered.label.overflow,false);if(width===390)assert.ok((centered.label.box[3]??0)>40,'long Chinese wraps without clipping on phone: '+JSON.stringify(centered.label));
  await page.getByLabel('选项',{exact:true}).check();assert.equal(await page.getByLabel('选项',{exact:true}).isChecked(),true);
  await page.evaluate(()=>document.documentElement.removeAttribute('data-dgu-options-centered'));assert.deepEqual(await snapshot(),before,`${width} restores defaults`);
  await page.close();
 }
 console.log('PASS option alignment toggles and restores at phone/desktop widths without changing controls, prose, unknown nodes or hit boxes');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
