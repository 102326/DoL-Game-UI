import type {Host,Participant} from '../contracts';
import type {ReferenceItem} from '../../src/wardrobe/reference';
/** Session-only copied display fields. No old DOM, Passage or action survives the scene. */
export function referenceShelf(host:Host,owner:Participant){
 let withdraw:(()=>void)|undefined;
 return {remember(item:ReferenceItem){
  withdraw?.();const snapshot=Object.freeze({...item}),generation=host.binding().generation;
  withdraw=owner.provideView({id:'wardrobe-snapshot',title:'衣柜参考快照',setup(context){
   const title=document.createElement('h3'),info=document.createElement('p'),note=document.createElement('p');
   title.textContent=snapshot.name;info.textContent=`${snapshot.slot} · ${snapshot.colour||'颜色未知'}`;
   note.textContent=host.binding().generation===generation?'来自当前衣柜的只读快照；原参照入口可返回仍有效的上下文。':'已离开来源场景。这份只读快照可能已过时，不提供穿戴或恢复旧场景操作。';
   const button=document.createElement('button');button.type='button';button.textContent='清除快照';button.onclick=()=>{if(context.isCurrent()){withdraw?.();withdraw=undefined}};
   context.element.append(title,info,note,button);return()=>{button.onclick=null};
  }});
 },dispose(){withdraw?.();withdraw=undefined}};
}
