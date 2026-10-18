const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

async function waitForSettled(page){
 await page.waitForFunction(()=>{
  const active=document.querySelectorAll('.dmt-workspace-section:not([aria-hidden="true"])');
  return active.length===1&&!document.querySelector('#dol-midnight-controls')?.hasAttribute('data-workspace-transition');
 },null,{timeout:2500});
}

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.join(__dirname,'fixture.html')).href);
  await page.waitForSelector('#listContainer');
  await page.addStyleTag({path:path.join(__dirname,'../dist/framework/official-ui/style.css')});
  await page.addScriptTag({path:path.join(__dirname,'../dist/framework/host/index.js')});
  await page.addScriptTag({path:path.join(__dirname,'../dist/framework/official-ui/index.js')});
  await page.waitForFunction(()=>!!window.DoLGameUI);
  await page.evaluate(()=>DoLGameUI.openSettings());

  assert.equal(await page.locator('.dmt-workspace-nav button').count(),5);
  assert.equal(await page.locator('.dmt-workspace-nav [aria-current=page]').textContent(),'阅读');
  assert.equal(await page.locator('.dmt-workspace-section:not([aria-hidden="true"])').count(),1);
  assert.equal(await page.getByLabel('启用 Soft & Wet 界面',{exact:true}).isVisible(),true);
  const initialFont=await page.locator('.dmt-reading-sample p').evaluate(element=>getComputedStyle(element).fontSize);
  await page.getByLabel('字体大小').evaluate(element=>{element.value='125';element.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.equal(await page.evaluate(()=>DoLGameUI.getPreferences().fontScale),125);
  assert.notEqual(await page.locator('.dmt-reading-sample p').evaluate(element=>getComputedStyle(element).fontSize),initialFont);

  const legacyTier=await page.evaluate(()=>DoLGameUI.getPreferences().visualTier);
  assert.equal(await page.getByLabel('视觉效果档位').count(),0);
  await page.getByRole('button',{name:'材质',exact:true}).click();
  await page.locator('#dol-midnight-controls[data-workspace-transition]').waitFor({timeout:1200});
  await page.getByText('看见层次如何变化').waitFor();
  await waitForSettled(page);
  assert.equal(await page.locator('.dmt-preview-stage.sf-material-main').count(),1);
  assert.equal(await page.evaluate(()=>DoLGameUI.getPreferences().visualTier),legacyTier);
  const neutral=await page.locator('#dol-midnight-controls').evaluate(element=>getComputedStyle(element).getPropertyValue('--sf-main').trim());
  const channels=neutral.startsWith('#')?[1,3,5].map(index=>parseInt(neutral.slice(index,index+2),16)):neutral.match(/\d+/g)?.slice(0,3).map(Number);
  assert.ok(channels&&Math.max(...channels)-Math.min(...channels)<=12,`Expected a neutral charcoal main surface, got ${neutral}`);

  await page.locator('.dmt-preview-reference button').click();
  await page.getByText(/同一份参考内容已进入浮层/).waitFor();
  assert.ok(await page.locator('.dmt-preview-reference button').evaluate(element=>element.getBoundingClientRect().height>=44));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('.dmt-preview-reference button').click();
  await page.getByText(/参考内容位于稳定区/).waitFor();

  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.getByRole('button',{name:'入口',exact:true}).click();
  await page.getByRole('button',{name:'页面',exact:true}).click();
  await waitForSettled(page);
  assert.equal(await page.locator('.dmt-workspace-section[aria-labelledby="dmt-pages-heading"]').count(),1);
  await page.locator('.dmt-page-switches summary').click();
  const focused=page.getByLabel('战斗聚焦编辑（实验）',{exact:true});
  assert.equal(await focused.isChecked(),false);
  await focused.check();
  assert.equal(await page.evaluate(()=>DoLGameUI.getPreferences().combatFocused),true);

  await page.getByRole('button',{name:'材质',exact:true}).click();
  await waitForSettled(page);
  await page.getByLabel('交互与进入动画').uncheck();
  assert.equal(await page.evaluate(()=>DoLGameUI.getPreferences().visualMotion),false);
  await page.getByRole('button',{name:'阅读',exact:true}).click();
  await waitForSettled(page);
  assert.equal(await page.locator('#dol-midnight-controls').getAttribute('data-workspace-transition'),null);

  for(const [width,height] of [[390,844],[844,390],[1280,900]]){
   await page.setViewportSize({width,height});
   const box=await page.locator('#dol-midnight-controls').evaluate(element=>{const rect=element.getBoundingClientRect();return{left:rect.left,right:rect.right,scroll:element.scrollWidth>element.clientWidth+1}});
   assert.ok(box.left>=0&&box.right<=width+1,JSON.stringify({width,box}));
   assert.equal(box.scroll,false);
  }
  assert.deepEqual(errors,[]);
  await page.keyboard.press('Escape');
  await page.evaluate(()=>DoLGameUI.destroy());

  const classic=await browser.newPage();
  await classic.goto(pathToFileURL(path.join(__dirname,'fixture.html')).href);
  await classic.waitForSelector('#listContainer');
  await classic.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});
  await classic.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});
  await classic.evaluate(()=>DoLGameUI.openSettings());
  assert.equal(await classic.locator('.dmt-workspace-nav').count(),0);
  assert.equal(await classic.getByLabel('视觉效果档位').count(),1);
  assert.equal(await classic.locator('.dmt-page-switches').count(),1);
  await classic.evaluate(()=>DoLGameUI.destroy());
  console.log('PASS official settings categories, actual scale preview, legacy tier retention, interruptible/reduced-motion transitions, live surface transfer, combat experiment default, viewport bounds, and classic layout');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
