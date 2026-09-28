/** Copy the native full-character canvas; never move it or rerun its renderer. */
export function mirrorSidebar(host:HTMLElement,signal:AbortSignal,onUnavailable:()=>void):Promise<HTMLCanvasElement|null>{
 if(!document.querySelector('#sidebar-img-container #img canvas.mainCanvas'))return Promise.resolve(null);
 return new Promise(resolve=>{
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  const probe=document.createElement('canvas');probe.width=probe.height=16;
  const sample=probe.getContext('2d',{willReadFrequently:true});
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label','当前角色完整穿搭预览');
  canvas.dataset.previewSource='sidebar';
  let timer:ReturnType<typeof setTimeout>|undefined,finished=false,stopped=false,visible=true;
  let source:HTMLCanvasElement|null=null,missingSince=performance.now();
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true});
  observer.observe(host);
  function stop(){stopped=true;clearTimeout(timer);observer.disconnect();signal.removeEventListener('abort',abort)}
  function abort(){stop();if(!finished){finished=true;resolve(null)}}
  function unavailable(){stop();if(!finished){finished=true;resolve(null)}else onUnavailable()}
  function tick(){
   if(stopped)return;
   if(!finished||(!document.hidden&&visible)){
    // Only the native main canvas contract is supported. Lighting is deliberately
    // excluded: it is a scene overlay, not part of the character's outfit.
    const candidates=document.querySelectorAll<HTMLCanvasElement>('#sidebar-img-container #img canvas.mainCanvas');
    const next=candidates.length===1?candidates[0]:null;
    let ready=false;
    try{
     if(next&&next.width>0&&next.height>0&&ctx&&sample){
      ready=next===source;
      if(!ready){sample.clearRect(0,0,16,16);sample.drawImage(next,0,0,16,16);
       ready=sample.getImageData(0,0,16,16).data.some((v,i)=>i%4===3&&v>0)}
      if(ready){
       if(canvas.width!==next.width||canvas.height!==next.height){canvas.width=next.width;canvas.height=next.height}
       ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(next,0,0);
       source=next;missingSince=performance.now();
       if(!finished){finished=true;resolve(canvas)}
      }
     }
    }catch{unavailable();return}
    if(!ready){
     // Do not keep showing the previous outfit while a replacement is loading.
     if(source&&source!==next){ctx?.clearRect(0,0,canvas.width,canvas.height);source=null}
     if(performance.now()-missingSince>1500){unavailable();return}
    }
   }
   // Bounded sampling also observes in-place canvas animation, which a DOM
   // MutationObserver cannot see. Pause copies while the preview is offscreen.
   timer=setTimeout(tick,125);
  }
  signal.addEventListener('abort',abort,{once:true});
  if(signal.aborted)abort();else tick();
 });
}
