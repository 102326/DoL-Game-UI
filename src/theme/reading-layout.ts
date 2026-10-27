import {visualScope} from '../ui/visual-scope';
import type {Preferences} from './preferences';

type Reading=Pick<Preferences,'enabled'|'readingLineScale'|'readingBlockGap'|'readingWidth'>;
type Saved={value:string;priority:string;written:string;writtenPriority:string};
const excluded='[data-sf-owner],[data-dgu-adapter],dialog,.dgw-root,.dgshop-content,.dgp-host,.dgs-host,.dgc-host,.dcu-root,.dgshop-host';
/** Optional presentation only: native nodes/actions remain owned by the game. */
export function createReadingLayout(){
 const scope=visualScope(),saved=new Map<HTMLElement,Map<string,Saved>>();
 let options:Reading={enabled:false,readingLineScale:100,readingBlockGap:0,readingWidth:0};
 let observer:MutationObserver|undefined,observed:HTMLElement|null=null,observedParent:HTMLElement|null=null;
 const active=()=>options.enabled&&(options.readingLineScale!==100||options.readingBlockGap!==0||options.readingWidth!==0);
 function restore(){
  for(const [node,properties]of saved)for(const [key,before]of properties){
   if(node.style.getPropertyValue(key)!==before.written||node.style.getPropertyPriority(key)!==before.writtenPriority)continue;
   if(before.value)node.style.setProperty(key,before.value,before.priority);else node.style.removeProperty(key);
  }
  saved.clear();
 }
 function write(node:HTMLElement,key:string,value:string){
  let properties=saved.get(node);if(!properties){properties=new Map();saved.set(node,properties)}
  const before={value:node.style.getPropertyValue(key),priority:node.style.getPropertyPriority(key),written:'',writtenPriority:''};
  node.style.setProperty(key,value,before.priority);before.written=node.style.getPropertyValue(key);before.writtenPriority=node.style.getPropertyPriority(key);properties.set(key,before);
 }
 function disconnect(){observer?.disconnect();observer=undefined;observed=null;observedParent=null}
 function observe(container:HTMLElement|null){
  const target=container??document.body;
  if(!target||(observed===target&&observedParent===target.parentElement))return;disconnect();
  try{
   const next=new MutationObserver(records=>{
    const relevant=records.some(r=>container&&(r.target===container||container.contains(r.target)||[...r.removedNodes].some(n=>n===container||n.contains(container)))||
     [...r.addedNodes].some(n=>n instanceof Element&&(n.id==='passages'||!!n.querySelector('#passages'))));
    if(relevant)refresh();
   });
   observer=next;next.observe(target,{childList:true,subtree:true});
   // Only direct children of ancestors are watched, so whole-story replacement is visible.
   if(container)for(let parent=container.parentElement;parent;parent=parent.parentElement)next.observe(parent,{childList:true});
   observed=target;observedParent=target.parentElement;
  }catch{disconnect();console.warn('[Soft & Wet] reading observer unavailable; preference and scene updates remain active')}
 }
 function normalLineHeight(style:CSSStyleDeclaration){
  const line=parseFloat(style.lineHeight);if(Number.isFinite(line))return line;
  // Measure one empty line using the actual font, without cloning any game content.
  const probe=document.createElement('div');probe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;white-space:pre;padding:0;border:0;margin:0;contain:layout style';probe.style.font=style.font;probe.style.fontSize=style.fontSize;probe.style.fontFamily=style.fontFamily;probe.style.lineHeight='normal';probe.textContent='\u200b';
  try{document.body.append(probe);const height=probe.getBoundingClientRect().height;return height>0?height:undefined}finally{probe.remove()}
 }
 function apply(){
  if(!scope.active())return;
  restore();
  if(!active()){disconnect();return}
  const container=document.getElementById('passages');if(!container){observe(null);return}if(container.closest(excluded)){disconnect();return}observe(container);
  const writes:Array<[HTMLElement,string,string]>=[];
  const passages=[...container.children].filter((n):n is HTMLElement=>n instanceof HTMLElement&&n.matches('.passage')&&!n.matches(excluded)&&!n.querySelector(excluded));
  for(const passage of passages){
   if(options.readingLineScale!==100){
    for(const node of [passage,...passage.querySelectorAll<HTMLElement>('p,li,h1,h2,h3,h4,h5,h6,blockquote,dd,dt')]){
     const style=getComputedStyle(node),line=normalLineHeight(style),font=parseFloat(style.fontSize);
     if(line!==undefined&&Number.isFinite(font)&&font>0)writes.push([node,'line-height',String(line/font*options.readingLineScale/100)]);
    }
   }
   if(options.readingBlockGap){
    for(const child of passage.querySelectorAll('p,ul,ol,.options,.optionsBar,.options-list')){
     if(!(child instanceof HTMLElement)||child.matches(excluded)||!child.matches('p,ul,ol,.options,.optionsBar,.options-list'))continue;
     const style=getComputedStyle(child),margin=parseFloat(style.marginBlockEnd);
     if(Number.isFinite(margin))writes.push([child,'margin-block-end',`${margin+options.readingBlockGap}px`]);
     if(child.matches('.options,.optionsBar,.options-list')&&/^(inline-)?(flex|grid)$/.test(style.display)){
      const gap=style.rowGap==='normal'?0:parseFloat(style.rowGap);if(Number.isFinite(gap))writes.push([child,'row-gap',`${gap+options.readingBlockGap}px`]);
     }
    }
   }
  }
  if(options.readingWidth&&passages.length&&!container.querySelector(excluded)){
   const width=getComputedStyle(container).maxWidth,factor=options.readingWidth/100,value=`calc(${width} * ${1-factor} + 100% * ${factor})`;
   if(width!=='none'&&CSS.supports('max-width',value))writes.push([container,'max-width',value]);
  }
  // All native baselines above are read before applying any new override.
  for(const [node,key,value]of writes)write(node,key,value);
 }
 function refresh(){schedule()}
 function run(){try{apply()}catch(error){restore();disconnect();console.warn('[Soft & Wet] reading layout restored after failure',error)}}
 function schedule(){if(scope.active()&&active())scope.frame(run)}
 scope.own(restore);scope.own(disconnect);
 return{
  update(value:Reading){options={...value};if(active())schedule();else{scope.cancelFrame(run);restore();disconnect()}},
  refresh:schedule,
  destroy(){scope.dispose()},
 };
}
