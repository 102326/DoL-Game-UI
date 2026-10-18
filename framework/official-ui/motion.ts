import {sourceMotion} from '../../src/ui/source-motion';
import {isMasterEnabled} from '../../src/runtime/master';
import type {NativeEventsHost} from '../../src/runtime/sugarcube';
import {nativeNavigation,adaptedOverlaySelector} from './navigation';

/** Presentation only: never cancel an event, dispatch an action or read game variables. */
export function startOfficialMotion(root:NativeEventsHost=window){
 const motion=sourceMotion(),navigation=nativeNavigation(),frames=new Set<number>(),marked=new Map<HTMLElement,string|null>(),entries=new Map<HTMLElement,string|null>();
 let overlay:HTMLElement|null=null,active:HTMLElement|null=null,activeKind='',plane:HTMLElement|undefined,dead=false;
 let origin:{rect:DOMRect;node:HTMLElement;time:number;hub:boolean;bedroom:boolean}|undefined,returnTo:HTMLElement|null=null,activeRect:DOMRect|undefined;
 let previousPetal:DOMRect|undefined;
 let sidebarRoots:HTMLElement[]=[];
 let pressed:{node:HTMLElement;pointer:number;before:string|null}|undefined;
 const formButtons='#customOverlay.dgs-native-tools .dgs-transfer :is(button,input[type=button]),#customOverlay.dgp-overlay:is([data-dgp-panel=cheats],[data-dgp-panel=settings]) #customOverlayContent :is(button.macro-button,button.numberStepper,input[type=button],input[type=submit])'+','+adaptedOverlaySelector+' :is(button,input[type=button],input[type=submit])';
 const pressSelector=formButtons+','+'.dgw-exits a.link-internal,[data-kw-entry],[data-kw-nav-control],.sf-motion-hub[data-official] button,#dol-midnight-controls button,.dgc-navigation button,.dgs-navigation button,.dgp-navigation button,.dgw-slots button,.dcu-arrangement button,.dgshop-content .category-tab';
 function clearPress(event?:PointerEvent){if(!pressed||event&&event.pointerId!==pressed.pointer)return;const {node,pointer,before}=pressed;if(node.getAttribute('data-kw-press')===String(pointer)){if(before===null)node.removeAttribute('data-kw-press');else node.setAttribute('data-kw-press',before)}pressed=undefined}
 function press(event:PointerEvent){if(!live()||!event.isPrimary||event.button!==0||!(event.target instanceof Element))return;const node=event.target.closest<HTMLElement>(pressSelector);if(!node||!visible(node)||node.matches(':disabled,[aria-disabled=true]'))return;clearPress();pressed={node,pointer:event.pointerId,before:node.getAttribute('data-kw-press')};node.setAttribute('data-kw-press',String(event.pointerId))}
 let study:'center'|'rise'='center',shell:HTMLElement|undefined;
 const live=()=>!dead&&isMasterEnabled()&&document.documentElement.hasAttribute('data-stone-free');
 const visible=(n:HTMLElement)=>!!n.getClientRects().length&&!n.closest('.hidden,[hidden],[inert]');
 function later(callback:()=>void){const id=requestAnimationFrame(()=>{frames.delete(id);if(live())callback()});frames.add(id)}
 function settle(callback:()=>void){later(()=>later(callback))}
 function clearFrames(){for(const id of frames)cancelAnimationFrame(id);frames.clear()}
 function cancelPresentation(){clearPress();motion.cancel();shell?.remove();shell=undefined}
 // The plane shares the final stage, never a button's origin. Native controls are not cloned.
 function windowStage(rect:DOMRect,mode:'center'|'rise',closing=false){
  shell?.remove();shell=undefined;if(!motion.enabled()||!rect.width||!rect.height)return;
  const n=document.createElement('div');n.className='kw-window-stage';n.dataset.motion=mode;n.setAttribute('aria-hidden','true');
  Object.assign(n.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});document.body.append(n);shell=n;
  const open:Keyframe[]=mode==='center'?[{clipPath:'inset(36% 38% round 64px)',opacity:.88},{clipPath:'inset(0 round 22px)',opacity:.72,offset:.72},{clipPath:'inset(0 round 22px)',opacity:0}]:[{transform:'translateY(140px)',opacity:.35},{transform:'translateY(-5px)',opacity:.55,offset:.72},{transform:'none',opacity:0}];
  const close:Keyframe[]=mode==='center'?[{clipPath:'inset(0 round 22px)',opacity:.65},{clipPath:'inset(30% 34% round 54px)',opacity:0}]:[{transform:'none',opacity:.55},{transform:'translateY(110px)',opacity:0}];
  const a=motion.animate(n,closing?close:open,closing?360:760);
  const remove=()=>{n.remove();if(shell===n)shell=undefined};if(a)void a.finished.then(remove,remove);else remove();
 }
 function clearMarks(){for(const [nodes,attribute]of [[marked,'data-kw-native'],[entries,'data-kw-entry']] as const){for(const [node,value]of nodes)if(value===null)node.removeAttribute(attribute);else node.setAttribute(attribute,value);nodes.clear()}}
 function sidebar(){
  const roots=[...document.querySelectorAll<HTMLElement>('#ui-bar #overlayButtons,#ui-bar #startCaption')];
  if(roots.length!==sidebarRoots.length||roots.some((node,i)=>node!==sidebarRoots[i])){sidebarObserver.disconnect();sidebarRoots=roots;for(const node of roots)sidebarObserver.observe(node,{childList:true,subtree:true})}
  if(!live())return;
  const mark=(node:HTMLElement,owner:string)=>{if(!entries.has(node))entries.set(node,node.getAttribute('data-kw-entry'));node.setAttribute('data-kw-entry',owner)};
  // Reviewed StoryCaption/startCaption macro buttons; nested Mod markup is not a native entry.
  const names=['属性','社交','特质','日志','统计','成就','选项','存档','作弊','Attributes','Social','Traits','Journal','Statistics','Feats','Options','Saves','Cheats'];
  for(const parent of roots){
   for(const node of parent.querySelectorAll<HTMLElement>(':scope>button.link-internal.macro-button,:scope>.sidebarButtonSplit>button.link-internal.macro-button'))if(!node.childElementCount&&names.includes(node.textContent?.trim()??''))mark(node,'native-caption');
   const own=parent.querySelector<HTMLElement>(':scope>#dol-midnight-sidebar-button');if(own)mark(own,'official-settings');
   // Explicit local source contracts: ModHub's entry wrapper and BF's picker marker.
   // Styling only; do not inspect, replace or invoke either Mod's business handlers.
   for(const node of parent.querySelectorAll<HTMLElement>(':scope>.modhub-sidebar-entry>button.link-internal.macro-button'))mark(node,'modhub-entry');
   const tip=parent.querySelector<HTMLElement>(':scope>button.link-internal.macro-button>#bfEntryTip');if(tip?.parentElement)mark(tip.parentElement,'beauty-picker');
  }
  navigation.refresh();
 }
 function bedroom(){
  clearMarks();if(!live())return;sidebar();
  const pages=document.querySelectorAll<HTMLElement>('#passages>.passage:not(.passage-out)');
  if(pages.length!==1||pages[0].dataset.passage!=='Bedroom')return;
  const page=pages[0],contents=page.querySelectorAll<HTMLElement>(':scope>[id="passage-content"]');
  if(contents.length!==1||page.querySelector('#listContainer,.dcu-root,#masturbationButtons'))return;
  // shortcut: only the reviewed direct Bedroom navigation contract; unknown/wrapped links stay native.
  for(const target of ['Wardrobe','Mirror','Bathroom','Kitchen','Orphanage','Domus Street','Settings','Attitudes']){
   const links=contents[0].querySelectorAll<HTMLAnchorElement>(`a.link-internal.macro-link[data-passage="${target}"]`);
   if(links.length!==1||links[0].parentElement!==contents[0]||!visible(links[0]))continue;
   marked.set(links[0],links[0].getAttribute('data-kw-native'));links[0].setAttribute('data-kw-native',target);
  }
 }
 function scrim(open:boolean){
  if(open){
   if(!plane){plane=document.createElement('div');plane.className='kw-context-plane';plane.setAttribute('aria-hidden','true');document.body.append(plane)}
   motion.animate(plane,[{opacity:0},{opacity:1}],300);document.documentElement.setAttribute('data-kw-character-layer','');
  }else{
   document.documentElement.removeAttribute('data-kw-character-layer');const old=plane;if(!old)return;
   const animation=motion.animate(old,[{opacity:1},{opacity:0}],280);
   const remove=()=>{if(!active&&plane===old){old.remove();plane=undefined}};
   if(animation)void animation.finished.then(remove,remove);else remove();
  }
 }
 function known(n:HTMLElement){return n.matches('.dgc-overlay,.dgs-overlay,.dgp-overlay,.dgs-native-tools,'+adaptedOverlaySelector)&&visible(n)&&!n.classList.contains('hidden')}
 function syncOverlay(){
  if(dead)return;
  const next=document.getElementById('customOverlay');
  if(next!==overlay){observer.disconnect();overlay=next;if(overlay)observer.observe(overlay,{attributes:true,attributeFilter:['class','hidden','data-overlay','data-dgp-panel','data-dgu-adapter','data-dgu-adapter-match']})}
  const nextActive=live()&&overlay&&known(overlay)?overlay:null;
  navigation.refresh();
  const kind=nextActive?`${nextActive.dataset.overlay??''}:${nextActive.dataset.dgpPanel??''}`:'';if(nextActive===active&&kind===activeKind)return;
  const old=active,oldStudy=study;active=nextActive;activeKind=kind;cancelPresentation();
  if(active){
   scrim(true);const from=origin&&performance.now()-origin.time<1000?origin:undefined;
   returnTo=from?.hub?document.querySelector<HTMLElement>('.sf-motion-ball'):from?.node??null;
   // Local review choice only: a fixed candidate per opening, no random page assignments.
   study=document.documentElement.getAttribute('data-kw-window-study')==='rise'?'rise':'center';
   activeRect=active.getBoundingClientRect();windowStage(activeRect,study);
   const style=getComputedStyle(active),top=Number.parseFloat(style.top);
   const frames:Keyframe[]=study==='rise'&&style.position!=='static'&&Number.isFinite(top)?[{top:(top+140)+'px',opacity:.12},{top:(top-4)+'px',opacity:1,offset:.76},{top:style.top,opacity:1}]:[{opacity:.12},{opacity:.7,offset:.5},{opacity:1}];
   // Top/opacity preserve the existing fixed-descendant coordinate contract; no root transform/filter/clip.
   motion.animate(active,frames,760);
   const nav=active.querySelector<HTMLElement>('.dgc-host,.dgs-host,.dgp-host');
   if(nav)motion.animate(nav,[{opacity:.2,transform:study==='center'?'translateY(18px)':'translateY(34px)'},{opacity:1,transform:'none'}],650);
   const body=active.querySelector<HTMLElement>('#customOverlayContent');
   if(body)motion.animate(body,[{opacity:.18},{opacity:.6,offset:.38},{opacity:1}],760);
   const focus=active.querySelector<HTMLElement>('.dgc-host button,.dgs-host button,.dgp-host button');
   if(focus&&!active.contains(document.activeElement))focus.focus({preventScroll:true});
  }else{
   if(old){motion.cancel(old);if(activeRect)windowStage(activeRect,oldStudy,true);const target=returnTo;if(target?.isConnected&&visible(target)){if(document.activeElement===document.body||old.contains(document.activeElement))target.focus({preventScroll:true})}}
   scrim(false);returnTo=null;activeRect=undefined;
  }
 }
 function stamp(node:HTMLElement){
  if(!origin?.hub||performance.now()-origin.time>100)origin={rect:node.getBoundingClientRect(),node,time:performance.now(),hub:!!node.closest('.sf-motion-petal'),bedroom:node.hasAttribute('data-kw-native')};
 }
 function response(node:HTMLElement){if(node.dataset.kwNavControl==='tab'){motion.animate(node,[{'--kw-heading-wave':-1,'--kw-heading-wave-opacity':0},{'--kw-heading-wave':-.2,'--kw-heading-wave-opacity':.8,offset:.35},{'--kw-heading-wave':1,'--kw-heading-wave-opacity':0}],720);return}motion.animate(node,[{boxShadow:'inset 0 0 0 1px #8cb3a666',backgroundColor:'#8cb3a617'},{boxShadow:getComputedStyle(node).boxShadow,backgroundColor:getComputedStyle(node).backgroundColor}],360)}
 function click(event:MouseEvent){
  if(!live()||!(event.target instanceof Element))return;
  const detail=event.target.closest<HTMLElement>('#customOverlay.dgp-overlay[data-dgp-panel=traits] .foldoutHeader,#customOverlay.dgp-overlay[data-dgp-panel=feats] .feat');
  if(detail&&visible(detail))response(detail);
  const node=event.target.closest<HTMLElement>(formButtons+',.dgw-exits a.link-internal,.sf-motion-petal,.sf-motion-ball,.dgw-slots button,.dgw-item,.dgshop-content .category-tab,.dgshop-content .clothing-item,.dcu-arrangement button,[data-kw-native],[data-kw-entry],[data-kw-nav-control],.dgp-navigation button');
  if(!node||!visible(node)||node.matches(':disabled,[aria-disabled=true]'))return;
  stamp(node);response(node);
  const nav=node.closest<HTMLElement>('#shopCategories');
  const before=nav?.querySelector<HTMLElement>('[aria-pressed=true],.category-tab.active,[aria-current]')?.getBoundingClientRect();
  const passage=node.closest('.passage');
  settle(()=>{
   if(passage&&!passage.isConnected)return;
   const selected=nav?.querySelector<HTMLElement>('[aria-pressed=true],.category-tab.active,[aria-current]');
   if(before&&selected&&visible(selected))motion.focus(before,selected.getBoundingClientRect());

   syncOverlay();
  });
 }
 function collectionChange(event:Event){
  if(!live()||!(event.target instanceof Element))return;
  const body=event.target.closest<HTMLElement>('#customOverlay.dgp-overlay[data-dgp-panel=traits] #customOverlayContent,#customOverlay.dgp-overlay[data-dgp-panel=feats] #customOverlayContent');
  if(!body)return;
  settle(()=>{if(!body.isConnected||!visible(body))return;const target=body.querySelector<HTMLElement>('#traitLists,#featsList');if(target&&visible(target))motion.animate(target,[{backgroundColor:'#8baea313',boxShadow:'inset 0 2px #8baea344'},{backgroundColor:'transparent',boxShadow:'inset 0 2px transparent'}],700)});
 }
 function hover(event:Event){
  if(!live()||!(event.target instanceof Element))return;
  const node=event.target.closest<HTMLElement>('.sf-motion-petal');if(!node||!visible(node))return;
  if(event instanceof MouseEvent&&event.relatedTarget instanceof Node&&node.contains(event.relatedTarget))return;
  const rect=node.getBoundingClientRect();if(previousPetal)motion.focus(previousPetal,rect);previousPetal=rect;
 }
 function scene(){
  clearFrames();cancelPresentation();previousPetal=undefined;bedroom();settle(()=>{
   syncOverlay();const header=document.querySelector<HTMLElement>('.dgw-header,.dgshop-host');
   if(header&&origin?.bedroom&&performance.now()-origin.time<1000)motion.focus(origin.rect,header.getBoundingClientRect());
  });
 }
 function enabled(){navigation.refresh();if(live())scene();else{clearFrames();cancelPresentation();clearMarks();active=null;activeKind='';study='center';origin=undefined;returnTo=null;activeRect=undefined;previousPetal=undefined;plane?.remove();plane=undefined;document.documentElement.removeAttribute('data-kw-character-layer')}}
 function resize(){cancelPresentation();if(active&&visible(active))activeRect=active.getBoundingClientRect()}
 const observer=new MutationObserver(()=>later(syncOverlay));
 const sidebarObserver=new MutationObserver(()=>later(sidebar));
 const blur=()=>clearPress();
 const parent=document.getElementById('customOverlay')?.parentElement;
 const discovery=new MutationObserver(()=>{if(document.getElementById('customOverlay')!==overlay)later(syncOverlay)});
 if(parent)discovery.observe(parent,{childList:true});
 root.jQuery?.(document).on(':passageend.kwOfficialMotion',scene);
 document.addEventListener('click',click,true);document.addEventListener('change',collectionChange,true);document.addEventListener('pointerover',hover,true);document.addEventListener('focusin',hover,true);document.addEventListener('dol-ui-master-change',enabled);
 document.addEventListener('pointerdown',press,true);document.addEventListener('pointerup',clearPress,true);document.addEventListener('pointercancel',clearPress,true);document.addEventListener('lostpointercapture',clearPress,true);window.addEventListener('blur',blur);
 window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);
 bedroom();syncOverlay();
 return()=>{dead=true;navigation.dispose();clearFrames();cancelPresentation();observer.disconnect();sidebarObserver.disconnect();sidebarRoots=[];discovery.disconnect();root.jQuery?.(document).off('.kwOfficialMotion');document.removeEventListener('click',click,true);document.removeEventListener('change',collectionChange,true);document.removeEventListener('pointerover',hover,true);document.removeEventListener('focusin',hover,true);document.removeEventListener('dol-ui-master-change',enabled);document.removeEventListener('pointerdown',press,true);document.removeEventListener('pointerup',clearPress,true);document.removeEventListener('pointercancel',clearPress,true);document.removeEventListener('lostpointercapture',clearPress,true);window.removeEventListener('blur',blur);window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);motion.dispose();clearMarks();plane?.remove();document.documentElement.removeAttribute('data-kw-character-layer')};
}
