import {createWardrobePerformance,type WardrobePerformance} from './performance';
import {createIsolatedModel} from './vendor/isolated-model.js';
import {copy,type Snapshot} from './data';
import {copyRenderState} from './render-state';
// Functions in the pinned model definition keep their private lexical context.
function cloneDefinition(value:any):any {
 if(Array.isArray(value))return value.map(cloneDefinition);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,cloneDefinition(v)]));
 return value;
}
function dataOnly(value:any):any {
 if(typeof value==='function')return undefined;
 if(Array.isArray(value))return value.map(dataOnly);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>typeof v!=='function').map(([k,v])=>[k,dataOnly(v)]));
 return value;
}
// Per-render private arrays retain native indices, including tanning references.
function copyClothesOnRead(clothes:any):any {
 return Object.fromEntries(Object.entries(clothes).map(([slot,items]:[string,any])=>{
  if(!Array.isArray(items))return [slot,dataOnly(items)];
  const copied=new Set<string>();
  return [slot,new Proxy(items.slice(),{get(target,key,receiver){
   if(typeof key==='string'&&/^(0|[1-9]\d*)$/.test(key)&&Object.hasOwn(target,key)&&!copied.has(key)){
    target[Number(key)]=dataOnly(target[Number(key)]);copied.add(key);
   }
   return Reflect.get(target,key,receiver);
  }})];
 }));
}
export function prepareOutfit(root:any,s:Snapshot,worn:any,changed:string[],timing:WardrobePerformance=createWardrobePerformance()){
 const live=root.Renderer;if(!live?.composeLayers||!root.Skin)throw Error('角色绘图接口尚不可用');
 const V=timing.measure('render.copyState',()=>copyRenderState(s.variables,timing.getFullStateCopy()));V.worn=copy(worn);V.options={...V.options,showSidebarEffects:false};
 for(const slot of changed){const stem=slot.replaceAll('_','');V[stem+'wetstage']=0;V[stem+'wet']=0}
 const endSetup=timing.start('render.copyDefinitions');
 const setup:any={};
 for(const key of ['clothes','clothes_all_slots','colours','bodywriting','bodywriting_namebyindex','bodyliquid','foodstuff','hairstyles','breastsizes']){
  if(s.setup[key]!==undefined)setup[key]=key==='clothes'?copyClothesOnRead(s.setup[key]):dataOnly(s.setup[key]);
 }
 setup.colours.getSkinFilter=(type:string,tan:number)=>{const o=setup.colours.skin_options[type];if(!o)throw Error('肤色定义不可用');return {blend:live.lintRgbStaged(Math.min(1,Math.max(0,tan/100)),o.gradient).toHexString(),blendMode:o.blendMode,desaturate:o.desaturate,...(o.alpha?{alpha:o.alpha}:{})}};
 // Wardrobe thumbnails are static outfit views, without transient scene effects.
 setup.bodyliquid={combined:()=>0};
 const skin=root.Skin;
 const context={clothesIndex:(slot:string,item:any)=>s.setup.clothes[slot].findIndex((c:any)=>c.variable===item.variable&&c.modder===item.modder),V,T:{},setup,Skin:{color:dataOnly(skin.color),tanningLayers:dataOnly(skin.tanningLayers),cachedLayers:null},
  Weather:{precipitation:'none',overcast:0,temperature:20,name:'clear'},Time:{isBloodMoon:false},
  Transformations:{defaults:{demon:{colour:root.Transformations?.defaults?.demon?.colour}}},
  C:{tiredness:{max:root.C?.tiredness?.max??1000}},ZIndices:copy(root.ZIndices),ColourUtils:{toHslString:(h:any)=>h?`hsl(${h.h}, ${h.s}%, ${h.l}%)`:'hsl(0, 100%, 50%)'},
  clone:cloneDefinition,renderer:{mergeLayerData:live.mergeLayerData,emptyLayerFilter:live.emptyLayerFilter}};
 endSetup();
 const {model,options}=timing.measure('render.prepareModel',()=>createIsolatedModel(context));
 // Reviewed Lyra asset adapter, no third-party callbacks run with live V/T.
 if(root.modUtils?.getMod?.('Lyra')?.version==='0.5.11.9-1.0.0a-0815-goose-ucb'){
  model.layers.mouth.srcfn=(o:any)=>o.facestyle==='default'&&/^(default|aloof|catty|foxy|gloomy|sweet|modded(?:[1-9]|1[0-9]|2[0-4]))$/.test(o.facevariant)&&/^(chew|cry|frown|neutral|smile)$/.test(o.mouth)?`img/face/${o.facestyle}/${o.facevariant}/mouth-${o.mouth}.png`:`img/face/${o.facestyle}/mouth-${o.mouth}.png`;
 }
 return {model,options};
}
export async function renderOutfit(root:any,s:Snapshot,worn:any,changed:string[],timing:WardrobePerformance=createWardrobePerformance()):Promise<HTMLCanvasElement>{
 const live=root.Renderer,{model,options}=prepareOutfit(root,s,worn,changed,timing);
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
