import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'vite';

const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0}});
await server.listen();
const address=server.httpServer!.address();
assert.ok(address&&typeof address==='object');
const browser=await chromium.launch({channel:'chrome'});
try {
 const page=await browser.newPage({viewport:{width:1680,height:920}});
 await page.goto('http://127.0.0.1:'+address.port+'/prototypes/host5/theme/sidebar.html');
 const settings=page.locator('#dol-midnight-controls');
 const open=()=>page.locator('#dol-midnight-sidebar-button').click();
 const button=(name:string)=>settings.getByRole('button',{name,exact:true});
 const close=async()=>{await button('关闭').click();await settings.waitFor({state:'hidden'})};
 const sample=()=>page.evaluate(()=>{
  const css=(s:string)=>getComputedStyle(document.querySelector(s)!);
  const prose=css('#native-prose'),link=css('a[data-passage]'),island=css('.independent p');
  return {page:css('body').backgroundColor,surface:css('.passage').backgroundColor,ink:prose.color,
   line:prose.lineHeight,gap:prose.marginBlockEnd,link:link.color,underline:link.textDecorationLine,
   inherited:css('#inherited-peer').color,warning:css('.neutral-warning').color,island:[island.color,island.lineHeight,island.marginBlockEnd,css('.independent').backgroundColor]};
 });
 await open();await button('材质').click();
 const before=await sample();
 await button('青灰').click();await settings.getByLabel('主要文字',{exact:true}).fill('#f2dcae');await button('应用并保存').click();
 await settings.getByLabel('玻璃模糊',{exact:true}).uncheck();
 await button('阅读').click();
 await settings.getByRole('slider',{name:'正文行距',exact:true}).press('End');
 await settings.getByRole('slider',{name:'段落与选项间距',exact:true}).press('ArrowRight');
 await close();
 const themed=await sample();
 assert.equal(themed.page,'rgb(18, 23, 28)');assert.equal(themed.surface,themed.page);
 assert.equal(before.page,before.surface);
 assert.notEqual(themed.surface,before.surface);
 assert.equal(themed.link,'rgb(142, 192, 216)');assert.equal(themed.ink,'rgb(242, 220, 174)');
 // Removing the ownership marker exposes the same unstyled text to the normal link cascade.
 const peer=page.locator('#inherited-peer');
 const withoutOwner=await peer.evaluate(n=>{
  const owner=n.getAttribute('data-sf-owner')!;
  n.removeAttribute('data-sf-owner');
  try{return getComputedStyle(n).color}finally{n.setAttribute('data-sf-owner',owner)}
 });
 assert.equal(withoutOwner,themed.link);assert.notEqual(withoutOwner,before.inherited);
 assert.equal(themed.inherited,before.inherited,'an unstyled owned descendant keeps its native inherited color');
 assert.equal(themed.underline,'underline');assert.equal(themed.warning,before.warning);assert.deepEqual(themed.island,before.island);
 assert.notEqual(themed.line,before.line);assert.equal(parseFloat(themed.gap),parseFloat(before.gap)+2);
 await peer.click();
 await page.waitForFunction(()=>document.querySelector('#native-prose')?.textContent?.startsWith('Next')&&!!document.querySelector<HTMLElement>('#native-prose')?.style.lineHeight);
 assert.deepEqual(await sample(),themed);
 await open();await button('阅读').click();await button('恢复原版排版').click();
 await button('材质').click();await button('恢复默认外观').click();await close();
 assert.deepEqual(await sample(),before);
 // A second Host writer changes the resolved palette without changing product preferences.
 const saved=await page.evaluate(()=>JSON.stringify({...localStorage}));
 await page.evaluate(()=>window.DoLUiHost!.theme!.apply({background:'#17212b',accent:'#e0bd89'}));
 const shared=await sample();
 assert.equal(shared.page,'rgb(23, 33, 43)');
 assert.equal(shared.link,'rgb(224, 189, 137)');
 assert.deepEqual(shared.island,before.island);
 assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),saved);
 await page.evaluate(()=>{const controller=Reflect.get(window,'DoLMidnightTheme');controller.destroy()});
 assert.equal(await page.locator('html').getAttribute('data-sw-custom-colors'),null);
 assert.equal(await page.locator('#peer .sample span').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(224, 189, 137)');
 await page.evaluate(()=>window.DoLUiHost!.theme!.apply({accent:'#91d1b9'}));
 assert.equal(await page.locator('html').evaluate(n=>n.style.getPropertyValue('--sw-custom-accent')),'');
 assert.equal(await page.locator('#peer .sample span').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(145, 209, 185)');
 console.log(JSON.stringify({before,themed,nativeNavigation:true,restored:true}));
}finally{await browser.close();await server.close()}
