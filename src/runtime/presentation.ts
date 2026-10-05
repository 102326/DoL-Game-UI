import type {App} from 'vue';

// Boundaries own only UI work. Native business handlers are never retried here.
export function isolate<T>(name:string,run:()=>T,recover:()=>void=()=>{}):T|undefined{
 try{return run()}catch(error){
  console.warn(`[DoLGameUI ${name}] using native fallback`,error);
  try{recover()}catch(cleanupError){console.warn(`[DoLGameUI ${name}] cleanup`,cleanupError)}
 }
}
export function unmountUI(app:App|undefined){isolate('unmount',()=>app?.unmount())}
// If a Mod removed our anchor, keep the still-live native node on its page.
// Never resurrect a node that the game deliberately removed.
export function restoreNative(node:Node,anchor:Comment,parent:Node|null,keepAnchor=false){
 if(node.isConnected){
  if(anchor.isConnected){if(keepAnchor)anchor.after(node);else anchor.replaceWith(node)}
  else if(parent?.isConnected&&!node.contains(parent))parent.appendChild(node);
 }
 if(!keepAnchor)anchor.remove();
}
export function mountUI(app:App,node:HTMLElement,recover:()=>void){
 let mounting=true,failed=false,failure:unknown;
 app.config.errorHandler=error=>{
  if(mounting){failed=true;failure=error}
  else queueMicrotask(()=>{if(node.isConnected)isolate('render',()=>{throw error},recover)});
 };
 try{const view=app.mount(node);if(failed)throw failure;return view}finally{mounting=false}
}
export function supportsDialog(){
 return typeof HTMLDialogElement!=='undefined'&&typeof HTMLDialogElement.prototype.showModal==='function'&&typeof HTMLDialogElement.prototype.close==='function';
}
