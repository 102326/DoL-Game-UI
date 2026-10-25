import playwright = require('playwright');
import assert = require('node:assert/strict');
const {chromium}=playwright;
declare global {interface Window {originalCanvases?:HTMLCanvasElement[]}}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage();
 for(const width of [320,390,1000]){
  await page.setViewportSize({width,height:844});
  await page.setContent(`<html><style>body{margin:0}#story{margin:0 16px 0 38px}.passage{box-sizing:border-box;padding:12px;border:1px solid} .combat-grid{display:grid;grid-template-columns:1fr}.combat-main,.combat-close{display:flex;justify-content:center}.combat-main{position:relative}.lighting{position:absolute}.combat-close>div{width:65px;flex-shrink:0}</style><div id="story"><div id="passages"><div class="passage"><div class="combat-grid"><div class="combat-centre"><div class="combat-close">${[0,1,2,3,4].map(i=>`<div>${i<3?'<canvas width="64" height="64"></canvas>':''}</div>`).join('')}</div><div class="combat-main"><canvas class="lighting" width="256" height="256"></canvas><canvas width="256" height="256"></canvas></div></div></div></div></div></div></html>`);
  const read=()=>{const content=document.querySelector('.passage');if(!content)throw Error('Missing combat content');const s=getComputedStyle(content),r=content.getBoundingClientRect();return{left:r.left+parseFloat(s.paddingLeft)+1,right:r.right-parseFloat(s.paddingRight)-1,canvases:Array.from(content.querySelectorAll('canvas')).map(n=>n.getBoundingClientRect().toJSON())}};
  const native=await page.evaluate(read);await page.addStyleTag({path:'src/theme/mobile.css'});assert.deepEqual(await page.evaluate(read),native,'theme-off geometry remains native');
  await page.evaluate(()=>{document.documentElement.setAttribute('data-dol-midnight','');window.originalCanvases=Array.from(document.querySelectorAll('canvas'))});
  const current=await page.evaluate(read);
  if(width<=600){for(const r of current.canvases)assert.ok(r.left>=current.left-.1&&r.right<=current.right+.1,'native combat canvas stays inside padded content');assert.ok(Math.abs((current.canvases[3]??assert.fail('missing lighting canvas')).width-(current.canvases[4]??assert.fail('missing main canvas')).width)<.1,'lighting and main canvas scale together')}
  else assert.deepEqual(current,native,'wide geometry unchanged');
  assert.ok(await page.evaluate(()=>!!window.originalCanvases&&window.originalCanvases.every(n=>n.isConnected)),'original renderer nodes retained');
  await page.evaluate(()=>document.documentElement.removeAttribute('data-dol-midnight'));assert.deepEqual(await page.evaluate(read),native,'theme-off restores native layout');
 }
 console.log('PASS combat illustration narrow layout / layers / native fallback');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
