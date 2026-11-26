// The reviewer toolbar uses the same controls as a person opening Settings.
(() => {
 const dialog=()=>document.querySelector('dialog#dol-midnight-controls');
 function until(find) {
  return new Promise((resolve,reject)=>{
   const observer=new MutationObserver(check);
   const timer=setTimeout(()=>{observer.disconnect();reject(Error('等待设置状态超时'))},4000);
   function check(){const value=find();if(value){observer.disconnect();clearTimeout(timer);resolve(value)}}
   observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true});check();
  });
 }
 const button=label=>[...dialog().querySelectorAll('button')].find(el=>el.textContent.trim()===label);
 async function open(){if(!dialog()?.open)document.querySelector('#dol-midnight-sidebar-button').click();await until(()=>dialog()?.open)}
 async function close(){if(dialog()?.open){dialog().querySelector('.dmt-close').click();await until(()=>!dialog().open)}}
 const reply=value=>parent.postMessage({type:'sw-review-result',...value},'*');
 window.addEventListener('message',async event=>{
  if(event.source!==parent || event.data?.type!=='sw-review')return;
  const {action,value}=event.data;
  try {
   if(action==='preset'){
    const labels={dark:'石墨灰',mist:'雾白玻璃',porcelain:'暖瓷'};
    if(!Object.hasOwn(labels,value))return;
    const keepOpen=dialog()?.open;
    await open();(await until(()=>button('材质'))).click();
    if(value==='dark'){
     (await until(()=>button('恢复默认外观'))).click();
    }else{
     (await until(()=>button(labels[value]))).click();
     await Promise.resolve();
     const apply=button('应用并保存');
     if(!apply.disabled)apply.click();
    }
    await until(()=>value==='dark'?!document.documentElement.dataset.swTheme:document.documentElement.dataset.swTheme===value);
    if(!keepOpen)await close();
    reply({preset:value});return;
   }
   if(action==='settings')await open();
   if(action==='glass')window.DoLGameUI.setPreference('visualGlass',value==='on');
   if(action==='shop'){
    await close();const item=document.querySelector('#item-1 a');item.click();
    (await until(()=>document.querySelector('.clothing-details.dgshop-detail-open'))).scrollIntoView({block:'nearest'});
   }
   reply({});
  } catch(error){reply({error:error.message})}
 });
 const root=document.documentElement;
 const sync=()=>parent.postMessage({type:'sw-review-state',preset:root.dataset.swTheme ||
  (root.hasAttribute('data-sw-custom-colors')?'custom':'dark'),glass:root.hasAttribute('data-dgu-visualGlass')?'on':'off'},'*');
 new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-sw-theme','data-sw-custom-colors','data-dgu-visualGlass']});
 until(()=>document.querySelector('#dol-midnight-sidebar-button')).then(()=>{sync();reply({})});
})();
