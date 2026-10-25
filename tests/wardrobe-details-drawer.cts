// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import path = require('node:path');
import playwright = require('playwright');
import esbuild = require('esbuild');
import browserOptions = require('./browser-options.cjs');
import receipt = require('../scripts/ci-process-receipt.cjs');
type Item={name:string;variable:string;description?:string};
type Snapshot={variables:{worn:{upper:Item};wardrobeDefaults:{extraInfo:boolean}};worn:{upper:Item};setup:{clothes:{upper:Item[]}}};
type ExtrasApi={render(snapshot:Snapshot,slot:string,equipment:HTMLElement,services:HTMLElement,refresh:()=>void):void;closeDetails():void;destroy():void};
declare const WardrobeExtrasBundle:{createWardrobeExtras(root:unknown):unknown};
declare const createExtras:(root:unknown)=>ExtrasApi;
declare const must:<T>(value:T|null)=>T;
declare const wardrobeTest:{extras:ExtrasApi;equipment:HTMLElement;services:HTMLElement;snapshot:Snapshot;variables:Snapshot['variables'];refresh:()=>void;node:Element|null};
declare let traitCalls:number;
declare const fallbackDetails:HTMLDetailsElement;
const {chromium}=playwright,{buildSync}=esbuild;
const output=buildSync({entryPoints:[path.join(__dirname,'../src/wardrobe/extras.ts')],bundle:true,write:false,format:'iife',globalName:'WardrobeExtrasBundle',target:'es2022'}).outputFiles[0];assert.ok(output);const bundle=output.text;

(async()=>{
 const browser=await chromium.launch(browserOptions);
 try{
  const page=await browser.newPage({viewport:{width:900,height:700}});
  await page.setContent('<button id="underlay">Underlying action</button><main id="root"></main>');
  await page.addScriptTag({content:bundle});await page.evaluate(()=>Object.assign(window,{must:<T,>(value:T|null)=>{if(!value)throw Error('Missing drawer fixture');return value},createExtras:(root:unknown)=>{if(typeof WardrobeExtrasBundle?.createWardrobeExtras!=='function')throw Error('Missing extras export');const api=WardrobeExtrasBundle.createWardrobeExtras(root);if(!api||typeof api!=='object'||!('render' in api)||typeof api.render!=='function'||!('closeDetails' in api)||typeof api.closeDetails!=='function'||!('destroy' in api)||typeof api.destroy!=='function')throw Error('Invalid extras API');return api}}));
  await page.evaluate(()=>{
   Object.assign(window,{traitCalls:0});
   const item={name:'shirt',variable:'shirt',description:'Shirt'};
   const variables={worn:{upper:item},wardrobeDefaults:{extraInfo:true}};
   const root={SugarCube:{Wikifier:class{constructor(output:Element,source:string){const template=document.createElement('template');template.innerHTML=source;output.append(template.content);const details=output.querySelector('.dgw-item-details');if(details){const button=document.createElement('button');button.id='trait-action';button.textContent='Trait action';button.onclick=()=>traitCalls++;details.append(button)}}}}};
   const extras=createExtras(root),equipment=document.createElement('section'),services=document.createElement('section'),snapshot={variables,worn:variables.worn,setup:{clothes:{upper:[item]}}},refresh=()=>{};
   must(document.querySelector('#root')).append(equipment,services);extras.render(snapshot,'upper',equipment,services,refresh);
   Object.assign(window,{wardrobeTest:{extras,equipment,services,snapshot,variables,refresh,node:equipment.querySelector('#trait-action')}});
  });
  const summary=page.locator('.dgw-item-details > summary');
  const open=async()=>{await summary.click();await page.waitForSelector('dialog[open][data-dgu-surface="drawer"]')};
  const restored=async(nodeName='trait-action')=>page.waitForFunction(name=>{const node=document.getElementById(name);return node&&node.closest('.dgw-item-details')&&node.parentElement===document.querySelector('.dgw-item-details')},nodeName);
  const identity=async()=>assert.equal(await page.evaluate(()=>document.querySelector('#trait-action')===wardrobeTest.node),true);

  await open();
  assert.equal(await page.locator('.dgw-item-details').evaluate(n=>{if(!(n instanceof HTMLDetailsElement))throw Error('Missing details');return n.open}),true,'the extraInfo open preference stays unchanged');
  assert.equal(await page.evaluate(()=>document.querySelector('dialog[open] #trait-action')===wardrobeTest.node),true,'the same generated child moves into the drawer');
  let blocked=false;try{await page.locator('#underlay').click({timeout:700})}catch{blocked=true}
  assert.equal(blocked,true,'the native modal blocks an underlying user click');
  assert.equal(await page.evaluate(()=>traitCalls),0);
  await page.locator('dialog[open] button[aria-label="关闭浮层"]').click();await restored();await identity();
  assert.equal(await page.evaluate(()=>must(document.querySelector<HTMLDetailsElement>('.dgw-item-details')).open),true);
  await page.locator('#trait-action').click();assert.equal(await page.evaluate(()=>traitCalls),1,'the original native handler remains attached');

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
   const root={SugarCube:{Wikifier:class{constructor(output:Element,source:string){const template=document.createElement('template');template.innerHTML=source;output.append(template.content)}}}};
   const extras=createExtras(root),equipment=document.createElement('section'),services=document.createElement('section'),snapshot={variables,worn:variables.worn,setup:{clothes:{upper:[item]}}};
   must(document.querySelector('#root')).append(equipment,services);extras.render(snapshot,'upper',equipment,services,()=>{});Object.assign(window,{fallbackDetails:must(equipment.querySelector<HTMLDetailsElement>('.dgw-item-details'))});
  });
  await page.locator('#root .dgw-item-details > summary').last().click();
  assert.equal(await page.evaluate(()=>fallbackDetails.open),false,'without showModal the native accordion click is not swallowed');
  assert.equal(await page.locator('dialog[open]').count(),0);
  console.log('PASS drawer blocks background input, preserves native node/handler/open state across button, Escape, backdrop, signature refresh and teardown; unsupported dialog keeps native accordion behavior.');
 }finally{await browser.close()}
})().catch(error=>{receipt.terminalFailure(error);process.exitCode=1});
