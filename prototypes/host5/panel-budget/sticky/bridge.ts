import type {StandaloneSurfaces} from '../../../../src/runtime/standalone-surfaces';
import type {SurfaceRequest,SurfaceCloseReason} from '../../../../src/public/ui';

// Handle only keys originating inside the active, non-modal shell.
export function windowKeys(dialog:HTMLDialogElement,close:()=>void){
 function key(e:KeyboardEvent){
  if(e.defaultPrevented || !dialog.contains(dialog.ownerDocument.activeElement) || dialog.ownerDocument.querySelector(':modal'))return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return}
  if(e.key!=='Tab')return;
  const items=[...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')].filter(n=>n.tabIndex>=0 && n.getClientRects().length);
  const end=e.shiftKey?items[0]:items.at(-1), target=e.shiftKey?items.at(-1):items[0];
  if(end && dialog.ownerDocument.activeElement===end){e.preventDefault();target?.focus()}
 }
 dialog.addEventListener('keydown',key);return ()=>dialog.removeEventListener('keydown',key);
}
export function inspectorFactory(root:Window, standalone:(w:Window)=>StandaloneSurfaces){
 const host=root.DoLUiHost, doc=root.document, parent=doc.getElementById('shared');
 if(!host || !parent)return standalone(root);
 const target=parent;
 const owner=host.register('StickyInspectorWindow');
 const formal=new URLSearchParams(root.location.search).has('drawer');
 let closeLive:((why:SurfaceCloseReason)=>void)|undefined;
 let formalUI:StandaloneSurfaces|undefined, disposed=false;
 function openModal(request:SurfaceRequest){
  if(disposed || closeLive)return null;
  if(formal){formalUI??=standalone(root);return formalUI.openDrawer(request)}
  const previous=doc.activeElement, dialog=doc.createElement('dialog');
  dialog.dataset.stickyWindow='';dialog.setAttribute('aria-label',request.title);
  const dismiss=doc.createElement('button');dismiss.textContent='关闭检查器';
  const mount=owner.mount({id:'window',lifetime:'persistent',parent:target,setup(context){
   context.element.append(dialog);dialog.append(dismiss,request.content);
   let reason:SurfaceCloseReason='destroyed';
   function close(why:SurfaceCloseReason){reason=why;handle.close()}
   const handle={close:()=>mount.dispose(),isOpen:()=>dialog.open};
   const stopKeys=windowKeys(dialog,()=>close('escape'));
   context.onCleanup(()=>{
    const inside=dialog.contains(doc.activeElement);
    closeLive=undefined;stopKeys();dialog.close();request.content.remove();dialog.remove();
    if(inside && doc.activeElement===doc.body && previous instanceof HTMLElement && previous.isConnected)previous.focus({preventScroll:true});
    request.onClose?.(reason);
   });
   closeLive=close;dismiss.onclick=()=>close('button');dialog.show();dismiss.focus();
  }});
  return mount.isCurrent()?{close:()=>{if(mount.isCurrent())closeLive?.('api')},isOpen:()=>mount.isCurrent()&&dialog.open}:null;
 }
 return {openModal,dispose(){if(disposed)return;disposed=true;closeLive?.('destroyed');formalUI?.dispose();owner.dispose()}};
}
