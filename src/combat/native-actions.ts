// Adapt contiguous native label runs without rebuilding controls or narrative.
export function wrapActionLists(passage:HTMLElement){
 const lists:HTMLElement[]=[];
 for(const input of passage.querySelectorAll<HTMLInputElement>('input[type=radio]')){
  const label=input.parentElement;
  if(label?.tagName!=='LABEL'||label.closest('[data-dcu-action-list],#listContainer')||!input.name)continue;
  const nodes:Node[]=[label];const prefix=label.previousSibling;
  if(prefix?.nodeType===Node.TEXT_NODE&&/^[\s|\u00a0]*\|[\s|\u00a0]*$/.test(prefix.textContent||''))nodes.unshift(prefix);
  let next=label.nextSibling;
  while(next){
   const same=next instanceof HTMLLabelElement&&next.querySelector<HTMLInputElement>('input[type=radio]')?.name===input.name;
   const separator=next.nodeType===Node.TEXT_NODE&&/^[\s|\u00a0]*$/.test(next.textContent||'');
   if(!same&&!separator)break;
   nodes.push(next);next=next.nextSibling;
  }
  const list=document.createElement('div'),group=document.createElement('div');
  list.dataset.dcuActionList='';group.dataset.dcuActionKey=input.name.replace(/^radiobutton-/,'');
  nodes[0].parentNode!.insertBefore(list,nodes[0]);list.append(group);group.append(...nodes);lists.push(list);
 }
 return {lists,restore(){for(const list of lists){const group=list.firstElementChild;if(group)list.replaceWith(...group.childNodes);else list.remove()}}};
}
