// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{buildSync}=require('esbuild');
const bundle=buildSync({entryPoints:[path.join(__dirname,'../src/wardrobe/extras.ts')],bundle:true,write:false,format:'iife',globalName:'WardrobeExtrasBundle',target:'es2022'}).outputFiles[0].text;

(async()=>{
 const browser=await chromium.launch(require('./browser-options.cjs'));
 try{
  const page=await browser.newPage({viewport:{width:900,height:700}});
  await page.setContent('<button id="underlay">Underlying action</button><main id="root"></main>');
  await page.addScriptTag({content:bundle});
  await page.evaluate(()=>{
   window.traitCalls=0;
   const item={name:'shirt',variable:'shirt',description:'Shirt'};
   const variables={worn:{upper:item},wardrobeDefaults:{extraInfo:true}};
   const root={SugarCube:{Wikifier:class{constructor(output,source){const template=document.createElement('template');template.innerHTML=source;output.append(template.content);const details=output.querySelector('.dgw-item-details');if(details){const button=document.createElement('button');button.id='trait-action';button.textContent='Trait action';button.onclick=()=>window.traitCalls++;details.append(button)}}}}};
   const extras=WardrobeExtrasBundle.createWardrobeExtras(root),equipment=document.createElement('section'),services=document.createElement('section'),snapshot={variables,worn:variables.worn,setup:{clothes:{upper:[item]}}},refresh=()=>{};
   document.querySelector('#root').append(equipment,services);extras.render(snapshot,'upper',equipment,services,refresh);
   window.wardrobeTest={extras,equipment,services,snapshot,variables,refresh,node:equipment.querySelector('#trait-action')};
  });
  const summary=page.locator('.dgw-item-details > summary');
  const open=async()=>{await summary.click();await page.waitForSelector('dialog[open][data-dgu-surface="drawer"]')};
  const restored=async(nodeName='trait-action')=>page.waitForFunction(name=>{const node=document.getElementById(name);return node&&node.closest('.dgw-item-details')&&node.parentElement===document.querySelector('.dgw-item-details')},nodeName);
  const identity=async()=>assert.equal(await page.evaluate(()=>document.querySelector('#trait-action')===wardrobeTest.node),true);

  await open();
  assert.equal(await page.locator('.dgw-item-details').evaluate(n=>n.open),true,'the extraInfo open preference stays unchanged');
  assert.equal(await page.evaluate(()=>document.querySelector('dialog[open] #trait-action')===wardrobeTest.node),true,'the same generated child moves into the drawer');
  let blocked=false;try{await page.locator('#underlay').click({timeout:700})}catch{blocked=true}
  assert.equal(blocked,true,'the native modal blocks an underlying user click');
  assert.equal(await page.evaluate(()=>window.traitCalls),0);
  await page.locator('dialog[open] button[aria-label="关闭浮层"]').click();await restored();await identity();
  assert.equal(await page.evaluate(()=>document.querySelector('.dgw-item-details').open),true);
  await page.locator('#trait-action').click();assert.equal(await page.evaluate(()=>window.traitCalls),1,'the original native handler remains attached');

  await open();await page.keyboard.press('Escape');await restored();await identity();
  await open();await page.mouse.move(2,2);await page.mouse.down();await page.mouse.up();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));await restored();await identity();

  await open();
  await page.evaluate(()=>{const item={name:'shirt-new',variable:'shirt-new'};wardrobeTest.variables.worn.upper=item;wardrobeTest.snapshot.setup.clothes.upper=[item];wardrobeTest.extras.render(wardrobeTest.snapshot,'upper',wardrobeTest.equipment,wardrobeTest.services,wardrobeTest.refresh)});
  await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
  assert.equal(await page.locator('.dgw-item-details summary').textContent(),'衣物详情与特质','a signature change closes before replacing the old details');

  const releaseNode=await page.evaluate(()=>{const node=wardrobeTest.equipment.querySelector('#trait-action');wardrobeTest.node=node;return !!node});assert.equal(releaseNode,true);
  await open();await page.evaluate(()=>wardrobeTest.extras.closeDetails());await page.waitForFunction(()=>!document.querySelector('dialog[open]'));await restored();await identity();
  await open();await page.evaluate(()=>wardrobeTest.extras.destroy());await page.waitForFunction(()=>!document.querySelector('dialog[open]'));await restored();await identity();

  await page.evaluate(()=>{
   Object.defineProperty(HTMLDialogElement.prototype,'showModal',{value:undefined,configurable:true});
   const item={name:'shirt-fallback',variable:'shirt-fallback'},variables={worn:{upper:item},wardrobeDefaults:{extraInfo:true}};
   const root={SugarCube:{Wikifier:class{constructor(output,source){const template=document.createElement('template');template.innerHTML=source;output.append(template.content)}}}};
   const extras=WardrobeExtrasBundle.createWardrobeExtras(root),equipment=document.createElement('section'),services=document.createElement('section'),snapshot={variables,worn:variables.worn,setup:{clothes:{upper:[item]}}};
   document.querySelector('#root').append(equipment,services);extras.render(snapshot,'upper',equipment,services,()=>{});window.fallbackDetails=equipment.querySelector('.dgw-item-details');
  });
  await page.locator('#root .dgw-item-details > summary').last().click();
  assert.equal(await page.evaluate(()=>window.fallbackDetails.open),false,'without showModal the native accordion click is not swallowed');
  assert.equal(await page.locator('dialog[open]').count(),0);
  console.log('PASS drawer blocks background input, preserves native node/handler/open state across button, Escape, backdrop, signature refresh and teardown; unsupported dialog keeps native accordion behavior.');
 }finally{await browser.close()}
})().catch(error=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(error);process.exitCode=1});
