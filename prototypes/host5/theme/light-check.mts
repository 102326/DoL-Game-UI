import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium, type Locator, type Page} from 'playwright';
import {createServer} from 'vite';
import {loadPackage,readPackage} from '../panel-budget/package-input.mts';

// node prototypes/host5/theme/light-check.mts <candidate-host.zip> <candidate-ui.zip>
const [hostPath,uiPath]=process.argv.slice(2);
assert.ok(hostPath&&uiPath,'Pass candidate Host and UI ZIPs');
const host=readPackage(hostPath,'StoneFreeHost'),ui=readPackage(uiPath,'DoLGameUI');
const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0}});
await server.listen();const address=server.httpServer!.address();assert.ok(address&&typeof address==='object');
const url=`http://127.0.0.1:${address.port}/prototypes/host5/theme/sidebar.html`;
const browser=await chromium.launch({channel:process.env.HOST5_BROWSER||'chrome'});
// Pair screenshots with and without text. Background is the browser's actual composite,
// including backdrop filters; the upper percentile avoids treating anti-aliased edges as ink.
async function contrast(page:Page,locator:Locator){
 await locator.scrollIntoViewIfNeeded();
 const original=await locator.screenshot({animations:'disabled'});
 const saved=await locator.evaluate(el=>{const s=(el as HTMLElement).style;const old=s.getPropertyValue('color'),priority=s.getPropertyPriority('color');s.setProperty('color','transparent','important');return {old,priority}});
 let background:Buffer;
 try{background=await locator.screenshot({animations:'disabled'})}finally{await locator.evaluate((el,saved)=>{const s=(el as HTMLElement).style;if(saved.old)s.setProperty('color',saved.old,saved.priority);else s.removeProperty('color')},saved)}
 return page.evaluate(async({a,b})=>{
  async function pixels(data:string){const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);return ctx.getImageData(0,0,image.width,image.height).data}
  const [fg,bg]=await Promise.all([pixels(a),pixels(b)]),ratios:number[]=[],background=[0,0,0];
  const lum=(p:Uint8ClampedArray,i:number)=>[0,1,2].reduce((v,n)=>{const c=p[i+n]!/255;return v+[.2126,.7152,.0722][n]!*(c<=.04045?c/12.92:((c+.055)/1.055)**2.4)},0);
  for(let i=0;i<fg.length;i+=4){if(Math.max(...[0,1,2].map(n=>Math.abs(fg[i+n]!-bg[i+n]!)))<12)continue;for(let n=0;n<3;n++)background[n]!+=bg[i+n]!;const x=lum(fg,i),y=lum(bg,i);ratios.push((Math.max(x,y)+.05)/(Math.min(x,y)+.05))}
  ratios.sort((x,y)=>x-y);if(ratios.length<8)throw Error('Insufficient rendered text pixels: '+ratios.length);
  return {ratio:ratios[Math.floor((ratios.length-1)*.95)]!,pixels:ratios.length,background:background.map(x=>Math.round(x/ratios.length))};
 },{a:original.toString('base64'),b:background.toString('base64')});
}
try{
 const page=await browser.newPage({viewport:{width:1680,height:920},reducedMotion:'reduce'});page.setDefaultTimeout(7000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const html=readFileSync(new URL('./sidebar.html',import.meta.url),'utf8').replace(/<script[^>]*><\/script>|<link rel="stylesheet"[^>]*>/g,'');
 await page.route(url,route=>route.fulfill({contentType:'text/html',body:html}));
 page.on('request',req=>{if(new URL(req.url()).pathname.startsWith('/dist/'))errors.push('Unexpected unpackaged runtime request')});
 async function navigate(reload=false){if(reload)await page.reload();else await page.goto(url);await loadPackage(page,host);await page.evaluate(()=>window.DoLUiHost!.sceneReady());await loadPackage(page,ui)}
 const dialog=page.locator('#dol-midnight-controls'),button=(name:string)=>dialog.getByRole('button',{name,exact:true});
 const open=async()=>{await page.locator('#dol-midnight-sidebar-button').click();await button('材质').click()};
 const close=async()=>{await button('关闭').click();await dialog.waitFor({state:'hidden'})};
 const snapshot=()=>page.evaluate(()=>{const css=(s:string)=>getComputedStyle(document.querySelector(s)!);return {body:css('body').backgroundColor,ink:css('#native-prose').color,link:css('a[data-passage]').color,sidebar:css('#ui-bar').backgroundColor,independent:[css('.independent p').color,css('.independent p').fontFamily,css('.independent').backgroundColor],warning:css('.neutral-warning').color}});
 await navigate();const baseline=await snapshot();await open();
 const storage=()=>page.evaluate(()=>JSON.stringify({...localStorage}));
 const output=[];
 for(const preset of ['雾白玻璃','暖瓷']){
  const beforeStorage=await storage(),before=await snapshot();await button(preset).click();assert.deepEqual(await snapshot(),before,'draft must not alter active theme');assert.equal(await storage(),beforeStorage,'draft must not persist');
  await button('取消试色').click();assert.deepEqual(await snapshot(),before);await button(preset).click();await button('应用并保存').click();
  if(process.env.LIGHT_CHECK_SCREENSHOTS)await page.screenshot({path:`${process.env.LIGHT_CHECK_SCREENSHOTS}/${preset}-settings.png`,animations:'disabled'});
  const applied=await snapshot();assert.notEqual(applied.body,baseline.body,preset);assert.deepEqual(applied.independent,baseline.independent);assert.equal(applied.warning,baseline.warning);
  const previewReading=await contrast(page,dialog.locator('.dmt-preview-reading p'));
  const previewIdle=await contrast(page,dialog.locator('.dmt-preview-reference strong'));
  await button('提取到浮层').click();
  const previewFloating=await contrast(page,dialog.locator('.dmt-preview-reference strong'));
  await button('放回参考区').click();
  assert.ok(previewReading.ratio>=4.5&&previewIdle.ratio>=4.5&&previewFloating.ratio>=4.5,`${preset} preview ${JSON.stringify({previewReading,previewIdle,previewFloating})}`);
  const composites=[];
  for(const level of [0,100]){
   const slider=dialog.getByRole('slider',{name:'Acrylic 通透度'});await slider.fill(String(level));
   for(const backdrop of ['#ffffff','#000000']){
    await page.evaluate(color=>{let n=document.querySelector<HTMLElement>('#contrast-backdrop');if(!n){n=document.createElement('div');n.id='contrast-backdrop';Object.assign(n.style,{position:'fixed',inset:'0',zIndex:'2147483647',pointerEvents:'none'});document.body.append(n)}n.style.background=color},backdrop);
    const title=dialog.locator('#dol-midnight-title'),eyebrow=dialog.locator('.dmt-settings-header .dmt-eyebrow');
    const closeButton=button('关闭'),closeColor=await closeButton.evaluate(n=>getComputedStyle(n).color),closeInk=await contrast(page,closeButton);
    const color=await title.evaluate(n=>getComputedStyle(n).color),mutedColor=await eyebrow.evaluate(n=>getComputedStyle(n).color),ink=await contrast(page,title),muted=await contrast(page,eyebrow);composites.push({level,backdrop,color,mutedColor,ink,muted,closeColor,closeInk});
    if(process.env.LIGHT_CHECK_SCREENSHOTS)await page.screenshot({path:`${process.env.LIGHT_CHECK_SCREENSHOTS}/${preset}-${level}-${backdrop.slice(1)}.png`,animations:'disabled'});
    assert.ok(closeInk.ratio>=4.5,`${preset} close button ${JSON.stringify(composites.at(-1))}`);assert.ok(ink.ratio>=3,`${preset} settings title ${JSON.stringify(composites.at(-1))}`);assert.ok(muted.ratio>=4.5,`${preset} settings eyebrow ${JSON.stringify(composites.at(-1))}`);
   }
  }
  await page.locator('#contrast-backdrop').evaluate(n=>n.remove());await button('恢复默认通透度').click();
  for(const glass of [true,false]){
   await dialog.getByLabel('玻璃模糊',{exact:true}).setChecked(glass);
   const shell=dialog.locator('.dmt-settings-shell');assert.equal(await shell.isVisible(),true);
   const crown=page.locator('.sf-motion-hub[data-official] .spin-prism-shell');assert.ok(await crown.count());
   if(!glass)assert.equal(await crown.evaluate(n=>getComputedStyle(n).backdropFilter),'none');
  }
  await dialog.getByLabel('玻璃模糊',{exact:true}).check();await close();
  if(process.env.LIGHT_CHECK_SCREENSHOTS)await page.screenshot({path:`${process.env.LIGHT_CHECK_SCREENSHOTS}/${preset}-reading.png`,animations:'disabled'});
  const prose=await contrast(page,page.locator('#native-prose'));const link=await contrast(page,page.locator('a[data-passage]').first());const warning=await contrast(page,page.locator('.neutral-warning'));
  assert.ok(prose.ratio>=4.5,`${preset} prose composited ${JSON.stringify(prose)}`);assert.ok(link.ratio>=4.5,`${preset} link composited ${JSON.stringify(link)}`);
  await open();await close();assert.deepEqual(await snapshot(),applied);
  await navigate(true);assert.deepEqual(await snapshot(),applied);
  await open();await button('恢复默认外观').click();await close();assert.deepEqual(await snapshot(),baseline);
  await navigate(true);assert.deepEqual(await snapshot(),baseline);
  output.push({preset,applied,prose,link,warning,previewReading,previewIdle,previewFloating,composites});await open();
 }
 // Previously saved custom colors still round-trip through the existing product store.
 await button('青灰').click();await button('应用并保存').click();await close();const dark=await snapshot();assert.notEqual(dark.body,baseline.body);
 await navigate(true);assert.deepEqual(await snapshot(),dark);await open();
 await dialog.getByLabel('强调色',{exact:true}).fill('#92bad5');await button('应用并保存').click();await close();
 await navigate(true);await open();assert.equal(await dialog.getByLabel('强调色',{exact:true}).inputValue(),'#92bad5');
 await button('恢复默认外观').click();await close();assert.deepEqual(await snapshot(),baseline);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({host:host.sha,ui:ui.sha,browser:browser.version(),output}));
}finally{await browser.close();await server.close()}
