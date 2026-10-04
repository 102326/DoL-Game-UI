// Reorganize only the known native widget; unknown variants keep their own layout.
export function createOutfitLayout(){
 let cleanup:(()=>void)|undefined,container:HTMLElement|undefined;
 function restore(){cleanup?.();cleanup=undefined;container=undefined}
 function sync(actions:HTMLElement){
  const list=actions.querySelector<HTMLElement>('#listoutfits');
  if(container?.isConnected&&container.parentElement===list)return;
  restore();if(!list)return;
  // SugarCube increments radio IDs on replacement; use the native group/order.
  const modes=[...list.querySelectorAll<HTMLInputElement>(':scope > label > input[type=radio][name="radiobutton-delete-outfit"]')];
  const [wear,remove,overwrite]=modes;
  const links=[...list.querySelectorAll<HTMLElement>(':scope > label.no-numberify')];
  const form=list.querySelector<HTMLElement>(':scope > #newClothingSetFromCurrent');
  if(modes.length!==3||!wear||!remove||!overwrite||links.length!==2||!form||!list.querySelector(':scope > .outfitContainer'))return;
  const details=document.createElement('details'),summary=document.createElement('summary');
  details.className='dgw-outfit-management';details.append(summary);list.prepend(details);container=details;
  const moved:{node:Node;anchor:Comment}[]=[];
  for(const node of [...links,form,remove.parentElement!,overwrite.parentElement!]){
   const anchor=document.createComment('DoL outfit management position');node.before(anchor);moved.push({node,anchor});details.append(node);
  }
  const separators=document.createElement('span');separators.hidden=true;details.append(separators);
  for(const node of [...list.childNodes])if(node.nodeType===Node.TEXT_NODE&&node.textContent?.trim()==='|'){
   const anchor=document.createComment('DoL outfit separator position');node.before(anchor);moved.push({node,anchor});separators.append(node);
  }
  function update(){
   const mode=remove!.checked?'删除':overwrite!.checked?'覆盖':'';
   const text=mode?`套装管理 · ${mode}模式（点击下方套装执行）`:'套装管理：创建、编辑、删除或覆盖';
   if(summary.textContent!==text)summary.textContent=text;
   // Never conceal a native destructive mode; return to Wear before collapsing.
   if(mode&&!details.open)details.open=true;
  }
  list.addEventListener('change',update);details.addEventListener('toggle',update);update();
  cleanup=()=>{list.removeEventListener('change',update);details.removeEventListener('toggle',update);for(const {node,anchor} of moved){if(node.isConnected&&anchor.parentNode)anchor.replaceWith(node);else anchor.remove()}details.remove()};
 }
 return{sync,restore};
}
