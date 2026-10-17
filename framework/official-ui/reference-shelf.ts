import type {Host,Participant} from '../contracts';
import type {ReferenceItem} from '../../src/wardrobe/reference';
/** Session-only display copies; never retain original DOM, State or business handles. */
export function referenceShelf(host:Host,owner:Participant){
 const views=new Map<string,()=>void>();
 function remember(id:string,title:string,lines:readonly string[]){
  views.get(id)?.();const copy=Object.freeze([...lines]),generation=host.binding().generation;
  views.set(id,owner.provideView({id,title,setup(context){
   const card=document.createElement('article');card.className='sf-reference-copy';
   copy.forEach((line,i)=>{const n=document.createElement(i?'p':'h3');n.textContent=line;card.append(n)});
   const note=document.createElement('p');note.className='sf-reference-origin';
   note.textContent=host.binding().generation===generation?'来自本场景的只读快照。仍需核对当前目录，不提供业务操作。':'已离开来源场景。这份只读快照可能已过时，不提供穿戴、购买或恢复旧场景操作。';
   const button=document.createElement('button');button.type='button';button.textContent='清除快照';button.onclick=()=>{if(context.isCurrent()){views.get(id)?.();views.delete(id)}};
   context.element.append(card,note,button);return()=>{button.onclick=null};
  }}));
 }
 return {remember(item:ReferenceItem){remember('wardrobe-snapshot','衣柜参考快照',[item.name,`${item.slot} · ${item.colour||'颜色未知'}`])},rememberProduct(item:Readonly<{title:string;price:string;owned:string}>){remember('shop-snapshot','商品参考快照',[item.title,item.price||'未提供价格文字',item.owned])},dispose(){for(const withdraw of views.values())withdraw();views.clear()}};
}
