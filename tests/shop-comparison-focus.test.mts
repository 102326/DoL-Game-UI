import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {test} from 'node:test';
import {build} from 'vite';
import vue from '@vitejs/plugin-vue';
import {chromium} from 'playwright';
import type {Host,Participant} from '../framework/contracts.ts';

type Scenario='normal'|'replaced'|'removed'|'no-item'|'navigate'|'dispose';
type Result={width:number;scenario:Scenario;final:string;focus:string[]};
declare const Fixture:{
 startShop(root:Window,framework:{host:Host;owner:Participant}):{refresh():void;destroy():void};
 createHost:typeof import('../framework/host.ts').createHost;
};

test('shop comparison closes to a single live focus destination',async()=>{
 // Bundle only the shop component tree and its existing Host; the page loads no external resources.
 const entry=resolve('neutral-shop-focus.ts');
 const result=await build({configFile:false,define:{'process.env.NODE_ENV':JSON.stringify('production')},publicDir:false,logLevel:'error',plugins:[vue(),{
  name:'neutral-shop-focus',resolveId(id){if(id===entry)return '\0'+entry},
  load(id){if(id==='\0'+entry)return ['src/shop/main.ts','framework/host.ts'].map((path,i)=>
   'export {'+(i?'createHost':'startShop')+'} from '+JSON.stringify(resolve(path))).join('\n')}
 }],build:{write:false,lib:{entry,name:'Fixture',formats:['iife']}}});
 const files=(Array.isArray(result)?result[0]:result);
 if(!files||!('output' in files))throw Error('Missing in-memory build');
 const script=files.output.find(file=>file.type==='chunk'),style=files.output.find(file=>file.type==='asset'&&file.fileName.endsWith('.css'));
 if(script?.type!=='chunk'||style?.type!=='asset'||typeof style.source!=='string')throw Error('Missing shop component bundle or CSS');
 const browser=await chromium.launch();
 const results:Result[]=[];
 try{
  for(const width of [1280,390])for(const scenario of ['normal','replaced','removed','no-item','navigate','dispose'] as const){
   const page=await browser.newPage({viewport:{width,height:800},reducedMotion:'reduce'});
   await page.route('**/*',route=>route.abort());
   await page.setContent('<!doctype html><button id="next">Next</button><div id="passages"><div class="passage" data-passage="Sample"><div id="clothingShop-div"><div id="clothes-list"><div id="shop-list-pages"><div class="clothing-item"><span class="clothing-name"><a href="#sample" class="link-internal" id="item">Sample</a></span></div></div><div class="clothing-details"><p>Details</p></div></div></div></div></div>');
   await page.addStyleTag({content:style.source});await page.addScriptTag({content:script.code});
   const observed=await page.evaluate(async({width,scenario})=>{
    const el=(selector:string)=>{const node=document.querySelector<HTMLElement>(selector);if(!node)throw Error('Missing '+selector);return node};
    const frames=()=>new Promise<void>(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>done())));
    const host=Fixture.createHost(window),owner=host.register('focus-fixture'),ui=Fixture.startShop(window,{host,owner});
    await frames();
    if(el('#clothingShop-div').classList.contains('dgshop-narrow')!==(width===390))throw Error('Unexpected shop layout');
    el('#item').click();await frames();el('[data-shop-pin]').click();await frames();
    const trigger=el('[data-shop-compare]');trigger.id='compare';trigger.click();await frames();
    const close=el('[data-shop-close]');if(document.activeElement!==close)throw Error('Close was not focused on entry');
    const focus:string[]=[];document.addEventListener('focusin',event=>{const node=event.target as HTMLElement;focus.push(node.id||node.tagName)});
    close.click();
    if(scenario==='replaced'){const replacement=trigger.cloneNode(true) as HTMLElement;replacement.id='replacement';trigger.replaceWith(replacement)}
    if(scenario==='removed')trigger.remove();
    if(scenario==='no-item'){el('.dgshop-reference-chip').id='pinned';el('#item').remove();ui.refresh()}
    if(scenario==='navigate'){el('.passage').classList.add('passage-out');el('#next').focus()}
    if(scenario==='dispose'){ui.destroy();el('#next').focus()}
    await frames();const active=document.activeElement;
    const final=active?.id||active?.tagName||'';
    const observed={width,scenario,final,focus:[...focus]};
    if(scenario!=='dispose')ui.destroy();owner.dispose();host.dispose();
    return observed;
   },{width,scenario});
   results.push(observed);await page.close();
  }
 }finally{await browser.close()}
 console.log(JSON.stringify(results));
 for(const row of results){
  const expected={normal:'compare',replaced:'replacement',removed:'item','no-item':'pinned',navigate:'next',dispose:'next'}[row.scenario];
  assert.equal(row.final,expected,JSON.stringify(row));assert.deepEqual(row.focus,[expected],JSON.stringify(row));
 }
});
