// Display metadata only. Never inspect game variables or hidden definitions.
export function visible(node:Element){
 if(!node.isConnected||node.closest('[hidden],.hidden'))return false;
 const style=getComputedStyle(node);
 return style.visibility!=='hidden'&&style.visibility!=='collapse'&&node.getClientRects().length>0;
}
