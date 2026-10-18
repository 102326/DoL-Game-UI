const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1100,height:900}});
 await page.setContent(`<html data-stone-free="3.0.0" data-dol-midnight data-dgu-visual="2" data-dgu-visualGlass><style>body{margin:0;color:white;background:#111}#customOverlay{position:fixed;inset:10px;width:900px}.relation-box{padding:16px}.relation-box-list{display:grid;grid-template-columns:1fr 1fr}.hidden,[hidden]{display:none!important}</style>
 <div id="foreign" style="background:rgb(120,40,80)">Third-party panel</div>
 <div id="customOverlay" class="dgs-overlay" data-overlay="social"><div id="customOverlayTitle">Native title</div><nav class="dgs-host"><button>Navigation</button></nav><div id="customOverlayContent"><div id="relation-display"><div class="relation-box-list"><div class="relation-box"><div class="relation-top-line">Native person</div><div class="relation-description">Original description</div><button id="original">Original action</button></div><div class="relation-box" hidden>Hidden person</div></div></div></div></div></html>`);
 for(const file of ['src/social/style.css','src/shop/style.css','src/theme/eyes.css','src/theme/stone-free.css','src/theme/dark-acrylic.css'])await page.addStyleTag({path:file});
 const before=await page.evaluate(()=>{window.originalNodes=[...document.querySelectorAll('#customOverlay *')];window.calls=0;document.querySelector('#original').onclick=()=>calls++;return{top:getComputedStyle(document.querySelector('#customOverlay')).background,nav:getComputedStyle(document.querySelector('.dgs-host')).background}});
 await page.addStyleTag({path:'src/theme/kraft-work-pages.css'});
 assert.deepEqual(await page.evaluate(()=>({top:getComputedStyle(document.querySelector('#customOverlay')).background,nav:getComputedStyle(document.querySelector('.dgs-host')).background})),before,'accepted top material is unchanged');
 await page.locator('#original').click();assert.equal(await page.evaluate(()=>calls),1);
 assert.equal(await page.evaluate(()=>originalNodes.every(n=>n.isConnected)),true);
 assert.equal(await page.locator('.relation-box[hidden]').isVisible(),false);
 assert.equal(await page.locator('#foreign').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(120, 40, 80)');
 assert.equal(await page.locator('.relation-box-list').evaluate(n=>getComputedStyle(n).gap),'18px');
 assert.equal(await page.locator('.relation-box').first().evaluate(n=>getComputedStyle(n).backdropFilter),'none');
 await page.evaluate(()=>{const o=document.querySelector('#customOverlay');o.className='dgc-overlay';o.dataset.overlay='characteristics';o.querySelector('.dgs-host').className='dgc-host';o.querySelector('#customOverlayContent').innerHTML='<div class="characteristic-box">Native value <meter value=".5"></meter></div>'});
 assert.match(await page.locator('#customOverlayContent').evaluate(n=>getComputedStyle(n).backgroundColor),/0\.46/);
 await page.evaluate(()=>{document.querySelector('#customOverlay').remove();document.body.insertAdjacentHTML('beforeend','<header class="dgshop-host">Shop</header><main class="dgshop-content dgshop-narrow"><div class="dgshop-layout"><div class="clothing-details dgshop-detail-open"><button class="dgshop-close-detail">Back</button></div></div></main><button class="dgshop-detail-backdrop">Backdrop</button>');document.querySelector('.dgshop-close-detail').onclick=()=>{document.querySelector('.clothing-details').classList.remove('dgshop-detail-open');document.querySelector('.dgshop-detail-backdrop').hidden=true}});
 assert.equal(await page.locator('.dgshop-content').evaluate(n=>getComputedStyle(n).backdropFilter),'none','native fixed-control ancestor never gains blur');
 assert.match(await page.locator('.dgshop-content').evaluate(n=>getComputedStyle(n,'::before').backdropFilter),/blur/);
 const hit=await page.locator('.dgshop-close-detail').evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});assert.equal(hit,true,'drawer control remains above backdrop');
 await page.locator('.dgshop-close-detail').click();assert.equal(await page.locator('.dgshop-detail-backdrop').isVisible(),false);
 await page.evaluate(()=>document.documentElement.removeAttribute('data-dgu-visualGlass'));
 assert.equal(await page.locator('.dgshop-content').evaluate(n=>getComputedStyle(n,'::before').backdropFilter),'none');
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 console.log('PASS accepted top unchanged, native identity/action/hidden, foreign boundary, layered material, drawer hitbox and glass fallback');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
