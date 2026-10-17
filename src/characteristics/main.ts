import {isolate,mountUI,unmountUI} from '../runtime/presentation';
import {createApp,reactive,type App} from 'vue';
import {isMasterEnabled} from '../runtime/master';
import type {Host,Participant,MountHandle,Claim} from '../../framework/contracts';
import Navigation from './Navigation.vue';
import './style.css';
const groups=[['base-characteristics','基础属性'],['base-skills','生活技能'],['sex-skills','身体技能'],['sex-diagram','身体技能'],['school-grades','学业'],['prof','武器技能']];
export function startCharacteristics(root:Window,framework?:{host:Host;owner:Participant}){
 const key='DoLGameUI.characteristics.enabled';
 let enabled=true,destroyed=false,ownerExited=false,claimUnavailable=false,disposingMount=false,frame=0,overlay:HTMLElement|null=null,content:HTMLElement|null=null,host:HTMLElement|null=null,app:App|undefined,frameworkMount:Readonly<MountHandle>|undefined,ownerLease:Readonly<Claim>|undefined;
 try{enabled=root.localStorage.getItem(key)!=='false'}catch{/* Session preference remains available. */}
 const state=reactive({sections:[] as Array<{id:string;label:string}>});
 const counts={mounts:0,scans:0};
 let failed=false;
 function recover(){failed=true;release();document.dispatchEvent(new Event('dol-ui-characteristics-change'))}
 function release(){const mount=frameworkMount;frameworkMount=undefined;unmountUI(app);app=undefined;if(mount){disposingMount=true;mount.dispose();disposingMount=false}host?.remove();host=null;overlay?.classList.remove('dgc-overlay');content=null}
 function mountNavigation(parent:HTMLElement){app=createApp(Navigation,{...state,go,fallback:()=>setEnabled(false)});mountUI(app,parent,recover);counts.mounts++}
 function go(id:string){
  let target=id?content?.querySelector<HTMLElement>(`#${id}`):content;
  // Native group labels sit before the grid; include the label in the jump.
  if(id&&target?.previousElementSibling?.matches('.gold,h1,h2,h3,h4'))target=target.previousElementSibling as HTMLElement;
  if(!target||!overlay)return;
  // Scroll only the overlay, never the underlying passage or game sidebar.
  content!.scrollTo({top:id?content!.scrollTop+target.getBoundingClientRect().top-content!.getBoundingClientRect().top-16:0,behavior:'auto'});
 }
 function refresh(){isolate('characteristics',update,recover)}
 function update(){
  if(destroyed)return;
  const next=document.getElementById('customOverlay');
  if(next!==overlay){release();overlay=next;overlayObserver.disconnect();if(overlay)overlayObserver.observe(overlay,{attributes:true,attributeFilter:['data-overlay','class'],childList:true,subtree:true})}
  const nextContent=overlay?.querySelector<HTMLElement>('#customOverlayContent')??null;
  if(framework&&ownerLease&&!ownerLease.isCurrent())ownerExited=true;
  if(!isMasterEnabled()||!enabled||failed||ownerExited||claimUnavailable||!overlay||overlay.classList.contains('hidden')||overlay.dataset.overlay!=='characteristics'||!nextContent?.querySelector('#characteristics-display')){if(host)release();return}
  if(content!==nextContent||!host?.isConnected||!!framework&&!frameworkMount?.isCurrent()){
   release();content=nextContent;host=document.createElement('div');host.className='dgc-host';content.before(host);
   // A reactive props object keeps navigation in sync when mods replace sections.
   if(framework){
    ownerLease?.release();ownerLease=undefined;
    try{frameworkMount=framework.owner.mount({id:'characteristics-navigation',parent:host,lifetime:'persistent',setup(context){context.onCleanup(()=>{if(disposingMount)return;if(!ownerLease?.isCurrent())ownerExited=true;frameworkMount=undefined;release()});mountNavigation(context.element)}})}catch(error){ownerExited=true;throw error}
    if(!frameworkMount.isCurrent()){frameworkMount=undefined;release();ownerExited=true;return}
    ownerLease=framework.owner.claim('region','characteristics-navigation-life')??undefined;
    if(!ownerLease){claimUnavailable=true;release();return}
   }else mountNavigation(host);
   overlay.classList.add('dgc-overlay');
  }
  counts.scans++;
  const sections=groups.filter(([id])=>content!.querySelector(`#${id}`)).map(([id,label])=>({id,label}));
  // The native diagram and list are alternative layouts; each actual section stays visible.
  if(JSON.stringify(state.sections)!==JSON.stringify(sections))state.sections.splice(0,state.sections.length,...sections);
 }
 function schedule(){if(!destroyed&&!frame)frame=requestAnimationFrame(()=>{frame=0;refresh()})}
 const overlayObserver=new MutationObserver(records=>{
  if(records.some(r=>!(host?.contains(r.target)||r.target===host)&&!(r.type==='attributes'&&r.target!==overlay)))schedule();
 });
 // Watch host replacement only. Ordinary passage text changes do not scan attributes.
 const discovery=new MutationObserver(()=>{if(document.getElementById('customOverlay')!==overlay)schedule()});
 function setEnabled(value:boolean){if(destroyed)return;failed=false;enabled=!!value;try{root.localStorage.setItem(key,String(enabled))}catch{/* No gameplay write required. */}refresh();document.dispatchEvent(new Event('dol-ui-characteristics-change'))}
 discovery.observe(document.body,{childList:true,subtree:true});refresh();
 return {getEnabled:()=>enabled&&!failed,setEnabled,refresh,getLifecycleCounts:()=>({...counts}),destroy(){destroyed=true;if(frame)cancelAnimationFrame(frame);discovery.disconnect();overlayObserver.disconnect();release();ownerLease?.release();ownerLease=undefined;overlay=null}};
}
