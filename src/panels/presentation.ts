// Rendered native content remains the source. Only presentation metadata and
// trait punctuation change; settings markup is left intact. No inputs are cloned.
import {visible} from './visibility';
export function panelPresentation(){
 const counts=new Map<HTMLElement,string|null>();
 const separators=new Map<Text,{original:string;presented:string}>();
 function quietSeparator(node:ChildNode,pattern:RegExp){
  if(node.nodeType!==Node.TEXT_NODE||separators.has(node as Text)||!pattern.test(node.textContent??''))return;
  const text=node as Text,original=text.data;
  const presented=original.replace(/[-|]/g,'');
  separators.set(text,{original,presented});text.data=presented;
 }
 return {
  refresh(body:HTMLElement,kind:string){
   // Native tabs/filters discard old nodes. Do not retain their detached trees.
   for(const node of counts.keys())if(!body.contains(node))counts.delete(node);
   for(const node of separators.keys())if(!body.contains(node))separators.delete(node);
   if(kind==='traits'){
    for(const heading of body.querySelectorAll<HTMLElement>('#traitLists .traitHeading,#traitLists h4')){
     if(!counts.has(heading))counts.set(heading,heading.getAttribute('data-dgp-count'));
     const count=String([...heading.parentElement?.querySelectorAll('.trait')??[]].filter(visible).length);
     if(heading.dataset.dgpCount!==count)heading.dataset.dgpCount=count;
    }
    for(const row of body.querySelectorAll('#traitLists .trait')){
     const name=row.firstElementChild;
     // Only the native name/description separator, never arbitrary Mod text.
     if(name?.tagName==='SPAN'&&name.nextElementSibling?.matches('small,span')){
      for(let node=name.nextSibling;node&&node!==name.nextElementSibling;node=node.nextSibling)quietSeparator(node,/^\s*-\s*$/);
     }
    }
   }
  },
  release(){
   for(const [node,value] of counts)if(value===null)node.removeAttribute('data-dgp-count');else node.setAttribute('data-dgp-count',value);
   for(const [node,{original,presented}] of separators)if(node.data===presented)node.data=original;
   counts.clear();separators.clear();
  }
 };
}
