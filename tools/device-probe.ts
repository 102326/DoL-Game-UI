'use strict';
const samples:ReturnType<typeof observe>[]=[];
const el=(id:string)=>{const node=document.getElementById(id);if(!node)throw Error('Missing device probe control: '+id);return node;};
const outputNode=el('output'),physicalNode=el('physical');
if(!(outputNode instanceof HTMLTextAreaElement)||!(physicalNode instanceof HTMLInputElement))throw Error('Invalid device probe controls');
const output=outputNode,physical=physicalNode;
const manual=(id:string)=>{const node=el(id);if(!(node instanceof HTMLInputElement))throw Error('Invalid manual input: '+id);return node.value.trim()||'UNKNOWN';};
const number=(value:number)=>Number.isFinite(value)?value:null;
function browserFamily(){
  // Parse coarse family/version only; never retain or export the full UA string.
  const ua=navigator.userAgent;
  for(const [family,pattern] of [['Edge',/(?:Edg|EdgiOS|EdgA)\/([\d.]+)/],['Firefox',/(?:Firefox|FxiOS)\/([\d.]+)/],['Chrome',/(?:Chrome|CriOS)\/([\d.]+)/],['Safari',/Version\/([\d.]+).*Safari/]] as const){
    const match=ua.match(pattern);if(match?.[1])return{family,version:match[1].split('.').slice(0,2).join('.')};
  }
  return{family:'UNKNOWN',version:'UNKNOWN'};
}
function payload(){return{schemaVersion:1,scope:'Browser runtime observations; physical-device confirmation is user assertion only; no hardware validation',samples};}
function render(){output.value=JSON.stringify(payload(),null,2);}
function observe(){
  const style=getComputedStyle(el('insets')),vv=window.visualViewport,orientation=screen.orientation;
  const sample={
    type:'browser-runtime-observation',observed:true,observedAt:new Date().toISOString(),
    model:manual('model'),actualBrowser:manual('browser'),gameHost:manual('host'),
    manualSystemDisplayScale:manual('displayScale'),manualBrowserZoom:manual('browserZoom'),
    physicalDeviceConfirmed:physical.checked,physicalConfirmationSource:'user-assertion-only',
    measuredOnPhysicalDevice:physical.checked,
    innerWidth:number(innerWidth),innerHeight:number(innerHeight),devicePixelRatio:number(devicePixelRatio),
    screenCSS:{width:number(screen.width),height:number(screen.height),availWidth:number(screen.availWidth),availHeight:number(screen.availHeight)},
    screenOrientation:orientation?{type:orientation.type||'UNKNOWN',angle:number(orientation.angle)}:null,
    viewportOrientation:innerWidth===innerHeight?'square':innerWidth>innerHeight?'landscape':'portrait',
    visualViewport:vv?{width:number(vv.width),height:number(vv.height),scale:number(vv.scale),offsetLeft:number(vv.offsetLeft),offsetTop:number(vv.offsetTop)}:null,
    safeArea:{top:parseFloat(style.paddingTop)||0,right:parseFloat(style.paddingRight)||0,bottom:parseFloat(style.paddingBottom)||0,left:parseFloat(style.paddingLeft)||0},
    maxTouchPoints:number(navigator.maxTouchPoints),pointerCoarse:matchMedia('(pointer: coarse)').matches,hoverNone:matchMedia('(hover: none)').matches,
    browser:browserFamily()
  };
  return sample;
}
el('record').addEventListener('click',()=>{
  const sample=observe();samples.push(sample);render();el('status').textContent=`已记录 ${samples.length} 次；本次视口 ${sample.innerWidth} × ${sample.innerHeight}（${sample.viewportOrientation==='portrait'?'竖屏':sample.viewportOrientation==='landscape'?'横屏':'方形'}）。请记录另一方向后导出。`;
});
el('copy').addEventListener('click',async()=>{
  try{if(!navigator.clipboard?.writeText)throw Error('unavailable');await navigator.clipboard.writeText(output.value);el('status').textContent='JSON 已复制。';}
  catch{output.focus();output.select();el('status').textContent='此浏览器不允许直接复制，已选中 JSON，请手动复制。';}
});
el('export').addEventListener('click',()=>{
  const url=URL.createObjectURL(new Blob([output.value],{type:'application/json'})),link=document.createElement('a');
  link.href=url;link.download='device-measurements.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);el('status').textContent='已请求导出 device-measurements.json；请检查浏览器下载。';
});
el('clear').addEventListener('click',()=>{samples.length=0;render();el('status').textContent='记录已清空；未保存到浏览器存储。';});
render();
export {};
