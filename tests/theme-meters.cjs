const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage();
 await page.setContent('<style>body{background:#181818}.meter{position:relative;height:4px;background:#777;z-index:-10}.meter>div{position:absolute;height:100%;width:50%;background:gold}</style><div class="passage"><div class="meter"><div></div></div><div id="oxygencaption"><div class="meter"><div></div></div></div></div>');
 await page.addStyleTag({path:'src/theme/midnight.css'});
 const hit=()=>page.evaluate(()=>[...document.querySelectorAll('.meter')].map(m=>{const r=m.getBoundingClientRect();return m.contains(document.elementFromPoint(r.x+5,r.y+2))}));
 assert.deepEqual(await hit(),[false,false]);
 await page.evaluate(()=>document.documentElement.setAttribute('data-dol-midnight',''));
 assert.deepEqual(await hit(),[true,true]);
 await page.evaluate(()=>document.documentElement.removeAttribute('data-dol-midnight'));
 assert.deepEqual(await hit(),[false,false]);
 console.log('PASS theme meter paint order and native fallback');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
