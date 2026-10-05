import {createWardrobePerformance,type WardrobePerformance} from './performance';
import {createIsolatedModel} from './vendor/isolated-model.js';
import {copy,type Snapshot} from './data';
import {copyRenderState} from './render-state';
import type {Clothing,ClothingSlots,Worn,WardrobeDataHost} from './host';
interface PrivateModel {width:number;height:number;options:Record<string,unknown>;compile:(options:Record<string,unknown>)=>unknown[]}
interface PreviewSetup extends Record<string,unknown> {colours:{skin_options:Record<string,{gradient:unknown;blendMode?:unknown;desaturate?:unknown;alpha?:unknown}>;getSkinFilter?:(type:string,tan:number)=>unknown}}
// Functions in the pinned model definition keep their private lexical context.
function cloneDefinition(value:unknown):unknown {
 if(Array.isArray(value))return value.map(cloneDefinition);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,cloneDefinition(v)]));
 return value;
}
function dataOnly(value:unknown):unknown {
 if(typeof value==='function')return undefined;
 if(Array.isArray(value))return value.map(dataOnly);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>typeof v!=='function').map(([k,v])=>[k,dataOnly(v)]));
 return value;
}
// Per-render private arrays retain native indices, including tanning references.
function copyClothesOnRead(clothes:ClothingSlots):Record<string,unknown> {
 return Object.fromEntries(Object.entries(clothes).map(([slot,items])=>{
  if(!Array.isArray(items))return [slot,dataOnly(items)];
  const copied=new Set<string>();
  return [slot,new Proxy(items.slice(),{get(target,key,receiver){
   if(typeof key==='string'&&/^(0|[1-9]\d*)$/.test(key)&&Object.hasOwn(target,key)&&!copied.has(key)){
    target[Number(key)]=dataOnly(target[Number(key)]) as Clothing;copied.add(key);
   }
   return Reflect.get(target,key,receiver);
  }})];
 }));
}
export function prepareOutfit(root:WardrobeDataHost,s:Snapshot,worn:Worn,changed:string[],timing:WardrobePerformance=createWardrobePerformance()){
 const live=root.Renderer;if(!live?.composeLayers||!root.Skin)throw Error('角色绘图接口尚不可用');
 const V=timing.measure('render.copyState',()=>copyRenderState(s.variables,timing.getFullStateCopy()));V.worn=copy(worn);V.options={...V.options,showSidebarEffects:false};
 for(const slot of changed){const stem=slot.replaceAll('_','');V[stem+'wetstage']=0;V[stem+'wet']=0}
 const endSetup=timing.start('render.copyDefinitions');
 const setup={} as PreviewSetup;
 for(const key of ['clothes','clothes_all_slots','colours','bodywriting','bodywriting_namebyindex','bodyliquid','foodstuff','hairstyles','breastsizes']){
  if(s.setup[key]!==undefined)setup[key]=key==='clothes'?copyClothesOnRead(s.setup[key] as ClothingSlots):dataOnly(s.setup[key]);
 }
 setup.colours.getSkinFilter=(type:string,tan:number)=>{const o=setup.colours.skin_options[type];if(!o)throw Error('肤色定义不可用');return {blend:live.lintRgbStaged(Math.min(1,Math.max(0,tan/100)),o.gradient).toHexString(),blendMode:o.blendMode,desaturate:o.desaturate,...(o.alpha?{alpha:o.alpha}:{})}};
 // Wardrobe thumbnails are static outfit views, without transient scene effects.
 setup.bodyliquid={combined:()=>0};
 const skin=root.Skin;
 const context={clothesIndex:(slot:string,item:Clothing)=>s.setup.clothes[slot].findIndex(c=>c.variable===item.variable&&c.modder===item.modder),V,T:{},setup,Skin:{color:dataOnly(skin.color),tanningLayers:dataOnly(skin.tanningLayers),cachedLayers:null},
  Weather:{precipitation:'none',overcast:0,temperature:20,name:'clear'},Time:{isBloodMoon:()=>false},
  Transformations:{defaults:{demon:{colour:root.Transformations?.defaults?.demon?.colour}}},
  C:{tiredness:{max:root.C?.tiredness?.max??1000}},ZIndices:copy(root.ZIndices),ColourUtils:{toHslString:(h:{h:number;s:number;l:number}|null|undefined)=>h?`hsl(${h.h}, ${h.s}%, ${h.l}%)`:'hsl(0, 100%, 50%)'},
  clone:cloneDefinition,renderer:{mergeLayerData:live.mergeLayerData,emptyLayerFilter:live.emptyLayerFilter}};
 endSetup();
 const {model,options}=timing.measure('render.prepareModel',()=>createIsolatedModel(context) as {model:PrivateModel;options:Record<string,unknown>});
 // Native render/animate binds options before compilation. Tanning postprocess
 // reads this.options as well as its argument; both must use the private snapshot.
 model.options=options;
 // Optional adapters receive only this private preview model, never live V/T.
 if(typeof window!=='undefined')
  window.dispatchEvent(new CustomEvent('dol-ui-outfit-prepared',{detail:{model,options}}));
 return {model,options};
}
export async function renderOutfit(root:WardrobeDataHost,s:Snapshot,worn:Worn,changed:string[],timing:WardrobePerformance=createWardrobePerformance()):Promise<HTMLCanvasElement>{
 const live=root.Renderer!,{model,options}=prepareOutfit(root,s,worn,changed,timing);
 const layers=timing.measure('render.compile',()=>model.compile(options)),canvas=document.createElement('canvas');
 canvas.width=model.width;canvas.height=model.height;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','当前角色完整穿搭预览');
 // The native image resolver is retained so image ZIPs still resolve.
 await new Promise<void>((resolve,reject)=>{
  const endCompose=timing.start('render.compose');
  let finished=false;const timer=setTimeout(()=>finish(Error('图片加载超时，请重试')),15000);
  function finish(error?:Error){if(finished)return;finished=true;endCompose();clearTimeout(timer);error?reject(error):resolve()}
  const ctx=canvas.getContext('2d'),previousCall=live.lastCall;
  try{live.composeLayers(ctx,layers,1,{renderingDone:()=>finish(),loadError:()=>finish(Error('有衣物图片未能加载，请使用原版衣柜')),error:()=>finish(Error('穿搭绘图失败，请使用原版衣柜'))})}catch(error){finish(error as Error)}
  finally{if(live.lastCall?.[0]===ctx)live.lastCall=previousCall}
 });
 return canvas;
}
