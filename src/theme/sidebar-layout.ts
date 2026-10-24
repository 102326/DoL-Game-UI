/* Move only confirmed native regions; unknown Mod output stays in place. */
export function createSidebarLayout(){
 const titles=new Set<HTMLElement>();
 const regions=new Map<HTMLElement,{placements:{node:Node;anchor:Comment}[];wrappers:Element[]}>();
 function restore(){
  for(const title of titles)title.remove();titles.clear();
  for(const [host,{placements,wrappers}] of regions){
   placements.forEach(({node,anchor})=>{
    if(host.isConnected&&host.contains(node)){if(anchor.isConnected)anchor.replaceWith(node);else host.before(node)}
    anchor.remove();
   });
   // Unwrap only our shells; preserve late Mod children, identity and handlers.
   if(host.isConnected){for(const wrapper of wrappers)if(host.contains(wrapper))wrapper.replaceWith(...wrapper.childNodes);host.replaceWith(...host.childNodes)}
   else host.remove();
  }
  regions.clear();
 }
 function move(host:HTMLElement,nodes:Node[],target:HTMLElement){
  const placements=nodes.map(node=>{const anchor=document.createComment('DoL UI sidebar original position');node.parentNode!.insertBefore(anchor,node);return {node,anchor}});
  const first=placements[0];if(!first)return;
  first.anchor.before(host);nodes.forEach(node=>target.append(node));regions.set(host,{placements,wrappers:[...host.children]});
 }
 function sync(active:boolean){
  if(!active){restore();return}
  for(const [host,{placements}] of regions)if(!host.isConnected){for(const {anchor} of placements)anchor.remove();regions.delete(host)}
  for(const title of titles)if(!title.isConnected)titles.delete(title);
  const start=document.querySelector('#startCaption>button.link-internal');
  if(start&&!start.previousElementSibling?.classList.contains('dmt-start-tools')){
   const title=document.createElement('h3');title.className='dmt-start-tools';title.textContent='游戏与工具';start.before(title);titles.add(title);
  }
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
