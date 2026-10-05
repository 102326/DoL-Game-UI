import {isolate,mountUI,unmountUI} from '../runtime/presentation';
import {createApp,reactive,type App} from 'vue';
import {isMasterEnabled} from '../runtime/master';
import Navigation from './Navigation.vue';
import './style.css';
const groups=[['npc-relations','主要关系'],['secondary-npcs','其他人物'],['faction-reputations','势力声望'],['farm-status','农场状况'],['global-recognition','知名度']];
export function startSocial(root:Window){
 const key='DoLGameUI.social.enabled';
 let enabled=true,destroyed=false,frame=0,overlay:HTMLElement|null=null,content:HTMLElement|null=null,host:HTMLElement|null=null,app:App|undefined;
 try{enabled=root.localStorage.getItem(key)!=='false'}catch{/* Session preference remains available. */}
 const state=reactive({sections:[] as Array<{id:string;label:string}>});
 const counts={mounts:0,scans:0};
 let failed=false;
 function recover(){failed=true;release();document.dispatchEvent(new Event('dol-ui-social-change'))}
 function release(){unmountUI(app);app=undefined;host?.remove();host=null;overlay?.classList.remove('dgs-overlay');content=null}
 function go(id:string){
  let target=id?content?.querySelector<HTMLElement>(`#${id}`):content;
  // Native group labels sit before the grid; include the label in the jump.
  if(id&&target?.previousElementSibling?.matches('.gold,h1,h2,h3,h4'))target=target.previousElementSibling as HTMLElement;
  if(!target||!overlay)return;
  // Scroll only the overlay, never the underlying passage or game sidebar.
  content!.scrollTo({top:id?content!.scrollTop+target.getBoundingClientRect().top-content!.getBoundingClientRect().top-16:0,behavior:'auto'});
 }
 function refresh(){isolate('social',update,recover)}
 function update(){
  if(destroyed)return;
  const next=document.getElementById('customOverlay');
  if(next!==overlay){release();overlay=next;overlayObserver.disconnect();if(overlay)overlayObserver.observe(overlay,{attributes:true,attributeFilter:['data-overlay','class'],childList:true,subtree:true})}
  const nextContent=overlay?.querySelector<HTMLElement>('#customOverlayContent')??null;
  if(!isMasterEnabled()||!enabled||failed||!overlay||overlay.classList.contains('hidden')||overlay.dataset.overlay!=='social'||!nextContent?.querySelector('#relation-display')){if(host)release();return}
  if(content!==nextContent||!host?.isConnected){
   release();content=nextContent;host=document.createElement('div');host.className='dgs-host';content.before(host);
   // A reactive props object keeps navigation in sync when mods replace sections.
   app=createApp(Navigation,{...state,go,fallback:()=>setEnabled(false)});
   mountUI(app,host,recover);overlay.classList.add('dgs-overlay');counts.mounts++;
  }
  counts.scans++;
  const sections=groups.filter(([id])=>content!.querySelector(`#${id}`)).map(([id,label])=>({id,label}));
  // Discover available native groups without regenerating relationship macros.
  if(JSON.stringify(state.sections)!==JSON.stringify(sections))state.sections.splice(0,state.sections.length,...sections);
 }
 function schedule(){if(!destroyed&&!frame)frame=requestAnimationFrame(()=>{frame=0;refresh()})}
 const overlayObserver=new MutationObserver(records=>{
  if(records.some(r=>!(host?.contains(r.target)||r.target===host)&&!(r.type==='attributes'&&r.target!==overlay)))schedule();
 });
 // Watch host replacement only. Ordinary passage text changes do not scan attributes.
 const discovery=new MutationObserver(()=>{if(document.getElementById('customOverlay')!==overlay)schedule()});
 function setEnabled(value:boolean){if(destroyed)return;failed=false;enabled=!!value;try{root.localStorage.setItem(key,String(enabled))}catch{/* No gameplay write required. */}refresh();document.dispatchEvent(new Event('dol-ui-social-change'))}
 discovery.observe(document.body,{childList:true,subtree:true});refresh();
 return {getEnabled:()=>enabled&&!failed,setEnabled,refresh,getLifecycleCounts:()=>({...counts}),destroy(){destroyed=true;if(frame)cancelAnimationFrame(frame);discovery.disconnect();overlayObserver.disconnect();release();overlay=null}};
}
