import {visualScope} from './visual-scope';
import {createApp,reactive,type Component,type App} from 'vue';
import type {Host,Participant} from '../../framework/contracts';
import {isolate,mountUI,unmountUI} from '../runtime/presentation';
import {isMasterEnabled} from '../runtime/master';
import {sourceMotion} from './source-motion';
import {navigationScrollTop} from './navigation-geometry';
import {navigationHeading,flashNavigationHeading} from './navigation-feedback';
import {navigationMount} from './navigation-mount';

type Options={kind:string;prefix:string;marker:string;claimKey:string;groups:readonly (readonly [string,string])[];component:Component};
/** Internal adapter for this reviewed native family; never owns/rebuilds native content. */
export function nativeOverlayNavigation(root:Window,options:Options,framework?:{host:Host;owner:Participant}){
 const key=`DoLGameUI.${options.kind}.enabled`,state=reactive({sections:[] as {id:string;label:string}[]}),motion=sourceMotion();
 const scope=visualScope();scope.own(()=>motion.dispose());let enabled=true,failed=false,generation=0,intent=0;
 let overlay:HTMLElement|null=null,content:HTMLElement|null=null,host:HTMLElement|null=null,app:App|undefined,hadClass=false,decorated:HTMLElement|null=null;
 const life=framework?navigationMount(framework.owner,options.claimKey,release):undefined;
 const counts={mounts:0,scans:0,failures:0};
 try{enabled=root.localStorage.getItem(key)!=='false'}catch{/* Session preference remains available. */}
 function release(){
  generation++;intent++;motion.cancel();content?.scrollTo({top:content.scrollTop,behavior:'instant'});
  unmountUI(app);app=undefined;life?.release();host?.remove();host=null;
  if(decorated&&!hadClass)decorated.classList.remove(options.prefix+'-overlay');decorated=null;content=null;
 }
 function recover(){failed=true;counts.failures++;release();document.dispatchEvent(new Event(`dol-ui-${options.kind}-change`))}
 function go(id:string){
  if(!scope.active()||failed||!host?.isConnected||!content?.isConnected||!overlay||overlay.classList.contains('hidden')||overlay.dataset.overlay!==options.kind)return false;
  if(life&&!life.current())return false;
  const pane=content,group=id?pane.querySelector<HTMLElement>(`#${id}`):null;
  const heading=group?navigationHeading(group):undefined,target=id?heading??group:pane;
  if(!target||!pane.contains(target))return false;
  const top=id?navigationScrollTop(pane,target,16):0;
  if(top===undefined)return false;
  motion.cancel();const ticket=++intent,epoch=generation;
  const current=()=>scope.active()&&!failed&&intent===ticket&&generation===epoch&&pane===content&&!!host?.isConnected&&target.isConnected;
  if(document.documentElement.hasAttribute('data-stone-free'))motion.scroll(pane,top,()=>{if(current()&&heading)flashNavigationHeading(motion,heading)});
  else pane.scrollTo({top,behavior:'auto'});
  return true;
 }
 function refresh(){isolate(options.kind,update,recover)}
 function update(){
  if(!scope.active())return;
  const next=document.getElementById('customOverlay');
  if(next!==overlay){release();overlay=next;observer.disconnect();if(overlay)observer.observe(overlay,{attributes:true,attributeFilter:['data-overlay','class'],childList:true,subtree:true})}
  const pane=overlay?.querySelector<HTMLElement>('#customOverlayContent')??null;
  if(!isMasterEnabled()||!enabled||failed||life?.exited()||!overlay||overlay.classList.contains('hidden')||overlay.dataset.overlay!==options.kind||!pane?.querySelector('#'+options.marker)){
   if(host||life?.active())release();return;
  }
  if(content!==pane||!host?.isConnected||!!life&&!life.current()){
   release();
   // Claim before touching DOM. Contention leaves native content available and
   // a later explicit refresh may retry without creating a mutation loop.
   if(life&&!life.acquire())return;
   content=pane;host=document.createElement('div');host.className=options.prefix+'-host';pane.before(host);hadClass=overlay.classList.contains(options.prefix+'-overlay');
   const epoch=generation;
   const setup=(parent:HTMLElement)=>{app=createApp(options.component,{...state,go,fallback:()=>setEnabled(false)});mountUI(app,parent,()=>{if(generation===epoch)recover()});counts.mounts++};
   if(life){
    if(!life.mount({id:options.kind+'-navigation',parent:host,lifetime:'persistent',setup:context=>setup(context.element)})){
     if(scope.active()&&!life.exited()&&!failed)recover();return;
    }
   }else setup(host);
   decorated=overlay;overlay.classList.add(options.prefix+'-overlay');
  }
  counts.scans++;
  const sections=options.groups.filter(([id])=>content!.querySelector(`#${id}`)).map(([id,label])=>({id,label}));
  if(JSON.stringify(state.sections)!==JSON.stringify(sections))state.sections.splice(0,state.sections.length,...sections);
 }
 function schedule(){scope.frame(refresh)}
 const observer=new MutationObserver(records=>{if(records.some(r=>!(host?.contains(r.target)||r.target===host)&&!(r.type==='attributes'&&r.target!==overlay)))schedule()});
 const discovery=new MutationObserver(()=>{if(document.getElementById('customOverlay')!==overlay)schedule()});
 function setEnabled(value:boolean){if(!scope.active())return;failed=false;enabled=!!value;try{root.localStorage.setItem(key,String(enabled))}catch{/* No gameplay write. */}refresh();document.dispatchEvent(new Event(`dol-ui-${options.kind}-change`))}
 discovery.observe(document.body,{childList:true,subtree:true});refresh();

 scope.own(()=>discovery.disconnect());scope.own(()=>observer.disconnect());
 return{getEnabled:()=>enabled&&!failed,setEnabled,refresh,getLifecycleCounts:()=>({...counts,implementation:'native-overlay-navigation/v1',consumer:options.kind,mountContract:life?.implementation??'classic',generation,mounted:!!host?.isConnected}),destroy(){if(!scope.active())return;scope.dispose();release();overlay=null}};
}
