import {isMasterEnabled} from '../runtime/master';
import {isolate} from '../runtime/presentation';
import './style.css';

type Root=Window & {SugarCube?:{State?:{passage?:string}}};
type Binding={node:HTMLAnchorElement;target:string;label:string};
// shortcut: only reviewed Bedroom navigation; add routes after checking native bindings and outcomes.
const targets=['Wardrobe','Mirror'] as const;
export function startStoryActions(root:Root=window){
 let enabled=false,disposed=false,frame=0,page:HTMLElement|null=null,locked:HTMLElement|null=null;
 let scope:HTMLElement|null=null,dock:HTMLElement|undefined,reserve:HTMLElement|undefined,bindings:Binding[]=[];
 const observer=new MutationObserver(schedule);
 const visible=(n:Element)=>n.getClientRects().length>0&&getComputedStyle(n).visibility!=='hidden'&&!n.closest('[hidden],[inert]');
 function current(){const pages=document.querySelectorAll<HTMLElement>('#passages .passage:not(.passage-out)');return pages.length===1?pages[0]:null}
 function modal(){return [...document.querySelectorAll('dialog[open],#customOverlay,#ui-dialog')].some(visible)}
 function read(p:HTMLElement):Binding[]{
  if(root.SugarCube?.State?.passage!=='Bedroom'||p.querySelector('#listContainer,.dcu-root,#masturbationButtons'))return [];
  const contents=p.querySelectorAll<HTMLElement>('[id="passage-content"]');if(contents.length!==1)return [];
  const content=contents[0];if(content.parentElement!==p)return [];
  return targets.flatMap(target=>{
   const matches=content.querySelectorAll<HTMLAnchorElement>(`a.link-internal.macro-link[data-passage="${target}"]`);
   if(matches.length!==1)return [];
   const node=matches[0],label=node.textContent?.trim()??'';
   if(node.parentElement!==content||!visible(node)||node.matches('[aria-disabled="true"]')||getComputedStyle(node).pointerEvents==='none'||!label||label.length>100)return [];
   return [{node,target,label}];
  });
 }
 function clear(){dock?.remove();reserve?.remove();dock=reserve=undefined;page=null;bindings=[]}
 function position(){
  if(!dock||!reserve||!page)return;
  const v=root.visualViewport,left=v?.offsetLeft??0,top=v?.offsetTop??0,width=v?.width??root.innerWidth,height=v?.height??root.innerHeight;
  const story=document.getElementById('story')?.getBoundingClientRect();
  const x=Math.max(left+8,Math.min(story?.left??left+8,left+width-60));
  const w=Math.max(44,Math.min(680,left+width-x-8,story?.width??width-16));
  dock.style.left=x+'px';dock.style.width=w+'px';dock.style.bottom=Math.max(0,root.innerHeight-top-height)+'px';
  const h=(dock.offsetHeight+12)+'px';if(reserve.style.height!==h)reserve.style.height=h;
 }
 function activate(binding:Binding,originalPage:HTMLElement){
  if(disposed||!enabled||!isMasterEnabled()||locked===originalPage||modal())return;
  const live=current();
  if(live!==originalPage||!binding.node.isConnected||!read(live).some(b=>b.node===binding.node&&b.target===binding.target&&b.label===binding.label)){schedule();return}
  // One native dispatch, never retry an uncertain handler or synthesize game variables.
  locked=originalPage;dock?.querySelectorAll('button').forEach(b=>b.disabled=true);
  try{binding.node.click()}catch(error){console.warn('[DoLGameUI story action] native action failed; no retry',error)}
  schedule();
 }
 function update(){
  if(disposed)return;
  if(!enabled||!isMasterEnabled()){observer.disconnect();scope=null;clear();return}
  const nextScope=document.getElementById('passages');
  if(scope!==nextScope){observer.disconnect();scope=nextScope;if(scope)observer.observe(scope,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','class','disabled','aria-disabled','data-passage','inert']})}
  const p=current();if(locked&&locked!==p)locked=null;
  const next=enabled&&isMasterEnabled()&&p&&!modal()?read(p):[];
  if(!p||!next.length){clear();return}
  const same=page===p&&dock?.isConnected&&reserve?.isConnected&&bindings.length===next.length&&bindings.every((b,i)=>b.node===next[i].node&&b.target===next[i].target&&b.label===next[i].label);
  if(!same){
   clear();page=p;bindings=next;
   dock=document.createElement('nav');dock.id='dol-story-actions';dock.className='no-numberify';dock.setAttribute('aria-label','原版常用动作');
   for(const binding of bindings){const button=document.createElement('button');button.type='button';button.textContent=binding.label;button.disabled=locked===p;button.addEventListener('click',()=>activate(binding,p));dock.append(button)}
   reserve=document.createElement('div');reserve.className='dsf-story-reserve';reserve.setAttribute('aria-hidden','true');p.append(reserve);document.body.append(dock);
  }
  if(locked===p&&dock&&!dock.querySelector('[role="status"]')){const status=document.createElement('p');status.setAttribute('role','status');status.textContent='已发送原操作；页面未变化时，请使用原链接确认结果。';dock.append(status)}
  position();
 }
 function schedule(){if(disposed||frame)return;frame=requestAnimationFrame(()=>{frame=0;isolate('story actions',update,clear)})}
 const events=['dol-ui-master-change','click','keydown','toggle'] as const;
 for(const event of events)document.addEventListener(event,schedule,true);
 root.addEventListener('resize',schedule);root.visualViewport?.addEventListener('resize',schedule);root.visualViewport?.addEventListener('scroll',schedule);
 root.document.addEventListener('DOMContentLoaded',schedule);
 return {setEnabled(value:boolean){enabled=value;if(!value){observer.disconnect();scope=null;clear()}else schedule()},destroy(){disposed=true;observer.disconnect();if(frame)cancelAnimationFrame(frame);clear();for(const event of events)document.removeEventListener(event,schedule,true);root.removeEventListener('resize',schedule);root.visualViewport?.removeEventListener('resize',schedule);root.visualViewport?.removeEventListener('scroll',schedule);root.document.removeEventListener('DOMContentLoaded',schedule)}};
}
