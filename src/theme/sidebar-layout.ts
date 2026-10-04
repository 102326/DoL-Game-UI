/* Move only confirmed native regions; unknown Mod output stays in place. */
export function createSidebarLayout(){
 const titles=new Set<HTMLElement>();
 const regions=new Map<HTMLElement,{nodes:Node[];anchors:Comment[]}>();
 function restore(){for(const title of titles)title.remove();titles.clear();for(const [host,{nodes,anchors}] of regions){nodes.forEach((node,i)=>{if(anchors[i].isConnected&&host.contains(node))anchors[i].replaceWith(node);else anchors[i].remove()});host.remove()}regions.clear()}
 function move(host:HTMLElement,nodes:Node[],target:HTMLElement){
  const anchors=nodes.map(node=>{const a=document.createComment('DoL UI sidebar original position');node.parentNode!.insertBefore(a,node);return a});
  anchors[0].before(host);nodes.forEach(node=>target.append(node));regions.set(host,{nodes,anchors});
 }
 function sync(active:boolean){
  if(!active){restore();return}
  for(const [host] of regions)if(!host.isConnected)regions.delete(host);
  for(const title of titles)if(!title.isConnected)titles.delete(title);
  const meters=document.querySelector('#storyCaptionContent>#statmeters'),gap=meters?.nextElementSibling,label=gap?.nextElementSibling;
  if(gap?.tagName==='BR'&&label instanceof HTMLElement&&label.matches('span.gold')&&['小贴士：','Tip:','Tips:'].includes(label.textContent?.trim()||'')){
   const text:Node[]=[];let next=label.nextSibling;
   while(next?.nodeType===Node.TEXT_NODE){text.push(next);next=next.nextSibling}
   if(text.some(n=>n.textContent?.trim())&&next instanceof HTMLBRElement){
    const host=document.createElement('details');host.className='dmt-sidebar-tip';
    const summary=document.createElement('summary'),body=document.createElement('div');host.append(summary,body);
    move(host,[label,...text],body);summary.append(label);
   }
  }
  const center=document.querySelector('#overlayButtons>#dmc-sidebar-button'),settings=center?.nextElementSibling;
  if(center&&settings?.id==='dol-midnight-sidebar-button'&&!center.previousElementSibling?.classList.contains('dmt-system-tools')){
   // Entry owners require direct children. Group visually without reparenting their buttons.
   const title=document.createElement('h3');title.className='dmt-system-tools';title.textContent='系统工具';center.before(title);titles.add(title);
  }
 }
 return{sync,destroy:restore};
}
