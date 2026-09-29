const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
  const page = await browser.newPage({viewport:{width:400,height:821}});
  await page.setContent(`<html data-dol-midnight data-dmt-layout><style>
   .customOverlayContainer{position:fixed;left:281.6px;right:0;top:0;bottom:0}
   .customOverlay{position:absolute;left:-281.6px;right:10px;top:10px;height:780px}
  </style><div class="customOverlayContainer"><div class="customOverlay" data-overlay="modloader">Manager</div></div></html>`);
  const read = () => document.querySelector('.customOverlay').getBoundingClientRect().toJSON();
  const native = await page.evaluate(read);
  await page.addStyleTag({path:'src/theme/layout.css'});
  assert.deepEqual(await page.evaluate(read),native,'Manager retains native positioning');
  await page.locator('.customOverlay').evaluate(e=>e.setAttribute('data-overlay','saves'));
  const saves = await page.evaluate(read);
  assert.ok(saves.left>=0 && saves.right<=400,'Game overlay remains within viewport');
  console.log('PASS manager native geometry and game overlay layout');
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
