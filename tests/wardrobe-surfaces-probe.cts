// Neutral browser fixture for the production wardrobe controller and its real Host binding.
import assert = require('node:assert/strict');
import type {Page,Locator} from 'playwright';
declare const theme:{setPreference(key:string,value:boolean|number):void;openSettings():void};
declare const fixture:{
 ui:ReturnType<typeof import('../src/wardrobe/main').startWardrobe>;
 host:ReturnType<typeof import('../framework/host').createHost>;
 native:HTMLElement;trait:HTMLElement;actions:number;exits:number;
};

async function mount(page:Page){
 await page.evaluate(()=>{
  document.body.insertAdjacentHTML('beforeend','<div hidden id="sidebar-img-container"><div id="img"><canvas class="mainCanvas" width="32" height="48"></canvas></div></div><main id="passages"><section class="passage" data-passage="DesignSample"><div id="wardrobeExits"><button id="original-exit" style="font:17px monospace;color:rgb(28, 84, 146)">Return</button></div><div id="wardrobeList">Original list</div></section></main>');
  const ctx=document.querySelector('canvas')!.getContext('2d')!;ctx.fillStyle='#60717a';ctx.fillRect(2,4,28,40);
 });
 await page.evaluate(async()=>{
  const {createHost}=await import('/framework/host.ts'),{startWardrobe}=await import('/src/wardrobe/main.ts');
  const host=createHost(window),owner=host.register('neutral-wardrobe');
  const items=Array.from({length:40},(_,i)=>({
   name:'Sample coat '+i,cn_name:'轻便防风外套'+i+'AlpineFieldCoat'.repeat(3),variable:'sample'+i,
   colour:'slate',warmth:i+1,description:'中性材质样本 '+'WindproofWeave'.repeat(12),
  }));
  const native=document.getElementById('original-exit')!;
  Object.assign(window,{fixture:{host,native,actions:0,exits:0}});native.onclick=()=>fixture.exits++;
  class Wikifier{
   constructor(el:HTMLElement,source:string){
    if(!source.includes('dgw-item-details'))return;
    const details=document.createElement('details'),summary=document.createElement('summary');
    const action=document.createElement('button'),text=document.createElement('p');
    details.className='dgw-item-details';summary.textContent='面料说明';action.textContent='Sample detail';
    action.style.cssText='font:17px monospace;color:rgb(28, 84, 146)';action.onclick=()=>fixture.actions++;
    fixture.trait=action;text.textContent='中性样本 '+'ThreadCount'.repeat(350);
    details.append(summary,action,text);el.append(details);
   }
  }
  const variables={location:'DesignSample',options:{images:0},wardrobe:{upper:items},worn:{upper:items[0]!},wardrobeDefaults:{}};
  const root=Object.assign(window,{State:{passage:'DesignSample',variables},setup:{clothes:{upper:items}},Wikifier});
  fixture.ui=startWardrobe(root,{host,owner});
 });
 await page.locator('.dgw-shell').waitFor();
 // Source imports inject styles in Vite. The shipped stylesheet sets the actual cascade order.
 await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
 await page.locator('.dgw-preview canvas[data-preview-source=sidebar]').waitFor({state:'attached'});
}

async function metrics(control:Locator){
 return control.evaluate(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {
  height:r.height,font:parseFloat(s.fontSize),family:s.fontFamily,color:s.color,
  hit:n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),
 }});
}
async function fits(node:Locator){
 const geometry=await node.evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x,right:r.right,width:innerWidth,inner:n.clientWidth,scroll:n.scrollWidth}});
 assert.ok(geometry.x>=-1&&geometry.right<=geometry.width+1&&geometry.scroll<=geometry.inner+1,node+' '+JSON.stringify(geometry));
}
async function scrollable(node:Locator){
 assert.ok(await node.evaluate(n=>{const before=n.scrollTop;n.scrollTop=n.scrollHeight;const moved=n.scrollTop>0;n.scrollTop=before;return moved}),node+' scroll');
}
async function owned(control:Locator,scale:number){
 await control.scrollIntoViewIfNeeded();
 const m=await metrics(control);assert.match(m.family,/Georgia/,String(control));assert.ok(m.height>=44*scale/100&&m.hit,control+' '+JSON.stringify(m));
 return m;
}
async function verify(page:Page){
 await mount(page);
 const shell=page.locator('.dgw-shell'),chip=page.locator('.dgw-reference-chip'),panel=page.locator('.dgw-reference-compare'),drawer=page.locator('body>dialog[data-sf-workspace=drawer]'),summary=page.locator('.dgw-item-details>summary');
 const refs=page.locator('.dgw-reference-action'),back=page.locator('[data-reference-back]'),clear=chip.getByRole('button',{name:'清除参照'});
 const details=page.locator('.dgw-preview-disclosure');
 async function openDrawer(){
  if(!await details.evaluate(n=>(n as HTMLDetailsElement).open))await details.locator(':scope>summary').click();
  await summary.click();await drawer.waitFor();
 }
 async function choosePair(){await refs.first().click();await chip.waitFor();await refs.nth(1).click();await panel.waitFor()}
 async function appearance(reset=false){
  await page.evaluate(()=>theme.openSettings());await page.getByRole('button',{name:'材质',exact:true}).click();
  if(reset)await page.getByRole('button',{name:'恢复默认外观'}).click();
  else {await page.getByLabel('本机字体',{exact:true}).fill('Georgia');await page.getByRole('button',{name:'应用并保存'}).click()}
  await page.locator('.dmt-close').click();await page.waitForFunction(()=>!document.querySelector<HTMLDialogElement>('#dol-midnight-controls')?.open);
 }
 await appearance();await page.evaluate(()=>{theme.setPreference('visualGlass',false);theme.setPreference('visualMotion',false)});
 const samples:Array<{width:number;scale:number;primary:number;reference:number;title:number;pair:number}>=[];
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:width===390?360:800});
  for(const scale of [100,150]){
   await page.evaluate(s=>{theme.setPreference('fontScale',s);theme.setPreference('buttonScale',s)},scale);
   await fits(shell);await fits(page.locator('.dgw-items'));await scrollable(page.locator('.dgw-items'));
   const primary=await owned(page.locator('.dgw-open-original'),scale);
   await owned(page.locator('.dgw-header-actions > button'),scale);await owned(page.locator('.dgw-tools select'),scale);
   assert.match(await shell.locator('h2').first().evaluate(n=>getComputedStyle(n).fontFamily),/Georgia/);
   assert.equal(await shell.evaluate(n=>getComputedStyle(n,'::before').backdropFilter),'none');
   const exitStyle=await metrics(page.locator('#original-exit'));assert.equal(exitStyle.family,'monospace');assert.equal(exitStyle.color,'rgb(28, 84, 146)');
   await openDrawer();await fits(drawer);await scrollable(drawer.locator('.dgu-surface-content'));
   const close=drawer.getByRole('button',{name:'关闭浮层'});await owned(close,scale);
   assert.equal(await drawer.evaluate(n=>getComputedStyle(n,'::backdrop').backdropFilter),'none');
   const native=drawer.getByRole('button',{name:'Sample detail'}),style=await metrics(native);
   assert.equal(style.family,'monospace');assert.equal(style.color,'rgb(28, 84, 146)');
   await native.click();await close.click();
   assert.ok(await summary.evaluate(n=>document.activeElement===n&&n.parentNode?.contains(fixture.trait)));
   await choosePair();await fits(chip);await fits(panel);await scrollable(panel);
   assert.equal(await panel.evaluate(n=>n.parentNode===document.body),width===390);
   assert.equal(await panel.evaluate(n=>getComputedStyle(n).backdropFilter),'none');
   const reference=await owned(back,scale);
   const title=await metrics(panel.locator('h3'));assert.match(title.family,/Georgia/);
   const text=await metrics(panel.locator('.dgw-reference-pair strong').first());
   await back.click();assert.ok(await page.evaluate(()=>document.activeElement?.matches('.dgw-reference-action,.dgw-reference-chip button')));
   await owned(clear,scale);await clear.click();
   samples.push({width,scale,primary:primary.font,reference:reference.font,title:title.font,pair:text.font});
  }
 }
 for(const width of [1280,390]){
  const [base,large]=samples.filter(s=>s.width===width);assert.ok(base&&large);
  for(const role of ['primary','reference','title','pair'] as const)assert.ok(Math.abs(large[role]-base[role]*1.5)<.1,role+' '+JSON.stringify([base,large]));
 }
 assert.equal(await page.evaluate(()=>fixture.actions),4);
 await appearance(true);assert.doesNotMatch((await metrics(page.locator('.dgw-open-original'))).family,/Georgia/);await choosePair();
 assert.doesNotMatch((await metrics(back)).family,/Georgia/);
 await page.evaluate(()=>fixture.ui.setEnabled(false));
 await page.waitForFunction(()=>!document.querySelector('.dgw-shell,.dgw-reference-chip,.dgw-reference-compare'));
 assert.ok(await page.locator('#original-exit').evaluate(n=>n===fixture.native));
 await page.locator('#original-exit').click();assert.equal(await page.evaluate(()=>fixture.exits),1);
 await page.evaluate(()=>fixture.ui.setEnabled(true));await shell.waitFor();
 await openDrawer();assert.doesNotMatch((await metrics(drawer.locator('.dgu-surface-header h2'))).family,/Georgia/);
 await page.evaluate(()=>fixture.host.invalidateScene());
 await page.waitForFunction(()=>!document.querySelector('.dgw-shell,.dgw-reference-chip,.dgw-reference-compare,.dgu-surface'));
 await page.evaluate(()=>{fixture.host.sceneReady();fixture.ui.setEnabled(true)});await shell.waitFor();
 await choosePair();await page.locator('.passage').evaluate(n=>n.remove());
 await page.waitForFunction(()=>!document.querySelector('.dgw-reference-chip,.dgw-reference-compare,.dgu-surface'));
 await page.evaluate(()=>{fixture.ui.destroy();fixture.host.dispose()});
 return samples;
}
export = verify;
