/** Standalone owned diagnostic: it must also work when the Host cannot start. */
export function startupNotice(){
 let node:HTMLElement|undefined,current:string|null=null,dismissed=false,closed=false;
 function render(){
  if(closed||!current||dismissed){node?.remove();node=undefined;return}
  if(!document.body)return;
  if(!node){node=document.createElement('aside');node.id='soft-wet-startup-notice';node.setAttribute('role','alert');
   node.style.cssText='position:fixed;bottom:16px;right:16px;max-width:min(380px,calc(100vw - 32px));max-height:80vh;overflow:auto;padding:16px;box-sizing:border-box;border:1px solid #777;border-radius:12px;background:#222;color:#fff;font:14px/1.6 sans-serif;z-index:2147483647';document.body.append(node)}
  const text=document.createElement('p');
  const message=current==='Host missing'?'未检测到已启动的 Host。请同时更新并启用配套 StoneFreeHost 0.1.5-experimental 和 UI，再按加载器提示重启。'
   :current==='unsupported protocol'?'Host 协议不兼容。请使用本次发布的配套 Host，停用重复版本后重启。'
   :current==='Host stopped'||current==='Host disposed'?'Host 已停止，请重新启动游戏。'
   :current==='Consumer initialization failed'?'界面初始化失败，请检查模组冲突和加载日志。'
   :'Host 连接不可用，请检查配套包版本、加载状态和日志。';
  text.textContent='Soft & Wet 未启动：'+message+' 无需清空存档或应用数据。';
  const close=document.createElement('button');close.type='button';close.textContent='关闭启动提示';close.style.cssText='min-height:44px;padding:8px 16px;background:#444;color:white;border:1px solid #aaa;border-radius:6px';close.onclick=()=>{dismissed=true;render()};node.replaceChildren(text,close);
 }
 document.addEventListener('DOMContentLoaded',render);
 return {set(reason:string|null){if(current!==reason)dismissed=false;current=reason;render()},dispose(){closed=true;document.removeEventListener('DOMContentLoaded',render);node?.remove();node=undefined}};
}
