/** Rehouse native transfer controls without replacing their events or values. */
export function createSaveTransfer(){
 let host:HTMLElement|null=null,overlay:HTMLElement|null=null;
 const moved:{node:Node;anchor:Comment}[]=[];
 function release(){for(const {node,anchor} of moved){if(anchor.isConnected&&node.isConnected)anchor.replaceWith(node);else anchor.remove()}moved.length=0;host?.remove();host=null;overlay?.classList.remove('dgs-native-tools');overlay=null}
 function refresh(enabled:boolean){
  const input=document.querySelector('#customOverlayContent #saveDataInput');
  if(enabled&&host?.isConnected&&host.contains(input))return;
  release();if(!enabled)return;
  const nextOverlay=document.querySelector<HTMLElement>('#customOverlay[data-overlay=saves]');
  // Native confirmations release the list proxy; keep their shell styled in place.
  if(nextOverlay?.querySelector('#customOverlayContent #saveList>.saveBorder>:is(input[type=button],button).saveMenuConfirm')){overlay=nextOverlay;overlay.classList.add('dgs-native-tools');return}
  // Known MapleBirch panel: CSS only, with native DOM and service ownership.
  if(nextOverlay?.querySelector('#customOverlayContent>#maplebirch-cloud-save.maplebirch-cloud-save')){overlay=nextOverlay;overlay.classList.add('dgs-native-tools');return}
  if(!(input instanceof HTMLTextAreaElement))return;
  const parent=input.parentElement,file=parent?.querySelector('#saveImport'),heading=parent?.querySelector(':scope > .gold');
  // Unknown/cloud layouts stay native. Only adapt the known export widget.
  if(!parent||file?.parentElement!==parent||!heading||heading.parentElement!==parent)return;
  overlay=nextOverlay;overlay?.classList.add('dgs-native-tools');
  const nodes=[...parent.childNodes],split=nodes.indexOf(heading),textIndex=nodes.indexOf(input);
  if(split<0||textIndex<split)return;
  host=document.createElement('section');host.className='dgs-transfer';parent.append(host);
  function card(title:string){const card=document.createElement('section');card.className='dgs-transfer-card';const h=document.createElement('h3');h.textContent=title;card.append(h);host!.append(card);return card}
  const files=card('文件导入 / 导出'),code=card('存档码');
  const help=document.createElement('details'),summary=document.createElement('summary');summary.textContent='使用说明与注意事项';help.append(summary);code.append(help);
  const actions=document.createElement('div');actions.className='dgs-transfer-actions';
  const settings=document.createElement('div');settings.className='dgs-transfer-settings';
  function move(node:Node,target:HTMLElement){const anchor=document.createComment('dol-save-transfer');node.parentNode!.insertBefore(anchor,node);moved.push({node,anchor});target.append(node)}
  nodes.forEach((node,index)=>{
   if(index<split){move(node,files);return}
   if(index<textIndex){move(node,node instanceof Element&&node.matches('.red')?code:help);return}
   if(node===input){move(node,code);return}
   if(node instanceof HTMLInputElement&&node.type==='button'){move(node,actions);return}
   move(node,settings);
  });
  code.append(actions,settings);
 }
 return {refresh,release};
}
