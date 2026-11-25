// Keep the same native item/control at its offset when the scroll owner changes.
function scrollOwner(node: Element) {
 for(let p=node.parentElement;p;p=p.parentElement){
  if(/auto|scroll/.test(getComputedStyle(p).overflowY))return p;
 }
 return document.scrollingElement as HTMLElement;
}
function top(owner:HTMLElement){
 return owner===document.scrollingElement?0:owner.getBoundingClientRect().top+owner.clientTop;
}
export function layoutAnchor(container:HTMLElement|null,selector:string,preferred?:HTMLElement|null){
 if(!container)return;
 const nodes=container.querySelectorAll<HTMLElement>(selector);
 const first=nodes[0];if(!first)return;
 const owner=scrollOwner(first),start=Math.max(0,top(owner));
 const end=Math.min(innerHeight,owner===document.scrollingElement?innerHeight:owner.getBoundingClientRect().bottom);
 function visible(n:HTMLElement){const r=n.getBoundingClientRect();return r.height>0&&r.bottom>start&&r.top<end}
 const node=preferred&&container.contains(preferred)&&visible(preferred)?preferred:Array.from(nodes).find(visible);
 if(!node)return;
 const offset=node.getBoundingClientRect().top-top(scrollOwner(node));
 return ()=>{
  if(!node.isConnected||!node.getClientRects().length)return;
  const next=scrollOwner(node);
  next.scrollTop+=node.getBoundingClientRect().top-top(next)-offset;
 };
}
