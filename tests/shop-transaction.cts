import playwright = require('playwright');
import esbuild = require('esbuild');
import assert = require('node:assert/strict');
const {chromium}=playwright,{buildSync}=esbuild;
declare const TransactionTest:typeof import('../src/shop/transaction.ts');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage();await p.setContent('<div id="buy-send-home"><div class="buy-button-inner buy-multiple"><a class="link-internal">Native fixture buy</a></div></div>');
 await p.addScriptTag({content:buildSync({entryPoints:['src/shop/transaction.ts'],bundle:true,format:'iife',globalName:'TransactionTest',write:false}).outputFiles[0]?.text ?? assert.fail('missing shop bundle')});
 const r=await p.evaluate(()=>{const v={money:5000,buyMultiple:1,clothingShopSlot:'upper',wardrobes:{shopReturn:'wardrobe'},wardrobe:{upper:[{variable:'coat'}]}},d:{variable:string;outfitPrimary?:string[]}={variable:'coat'},facts=()=>({variables:v,definition:d}),control=document.querySelector('a');if(!control)throw Error('missing native purchase control');
  const before=TransactionTest.purchaseWitness(control,facts(),()=>1500),unchanged=before&&TransactionTest.purchaseResult(before,facts(),true);
  if(!before)throw Error('missing purchase witness');
  v.money-=1500;v.wardrobe.upper.push({variable:'coat'});const confirmed=TransactionTest.purchaseResult(before,facts(),true),stale=TransactionTest.purchaseResult(before,facts(),false);
  const replaced=TransactionTest.purchaseResult(before,{variables:{...v},definition:d},true);v.wardrobes.shopReturn='private';const destination=TransactionTest.purchaseWitness(control,facts(),()=>1500);v.wardrobes.shopReturn='wardrobe';v.buyMultiple=11;const multiple=TransactionTest.purchaseWitness(control,facts(),()=>1500);v.buyMultiple=1;d.outfitPrimary=['lower'];const outfit=TransactionTest.purchaseWitness(control,facts(),()=>1500);delete d.outfitPrimary;const throwing=TransactionTest.purchaseWitness(control,facts(),()=>{throw Error('unavailable')});return {before:{cost:before.cost,count:before.count},unchanged,confirmed,stale,replaced,destination,multiple,outfit,throwing};
 });assert.deepEqual(r,{before:{cost:1500,count:1},unchanged:'unknown',confirmed:'confirmed',stale:'unknown',replaced:'unknown',destination:null,multiple:null,outfit:null,throwing:null});console.log('PASS native observation only: exact money + one item, unchanged/stale unknown, unsupported destination/multi/outfit/error fallback');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
