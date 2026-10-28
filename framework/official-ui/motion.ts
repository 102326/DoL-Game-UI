import {ownedOverlaySelector} from '../../src/ui/owned-overlay';
import {visualScope} from '../../src/ui/visual-scope';
import {sourceMotion} from '../../src/ui/source-motion';
import {fadeWindow} from '../../src/ui/window-fade';
import {workspaceEnterFrames} from '../../src/ui/workspace-transition';
import {isMasterEnabled} from '../../src/runtime/master';
import type {NativeEventsHost} from '../../src/runtime/sugarcube';
import {nativeNavigation,adaptedOverlaySelector,nativeEntryKinds} from './navigation';

/** Presentation only: never cancel an event, dispatch an action or read game variables. */
export function startOfficialMotion(root:NativeEventsHost=window){
 const scope=visualScope(),motion=sourceMotion(),navigation=nativeNavigation(),marked=new Map<HTMLElement,string|null>(),entries=new Map<HTMLElement,string|null>();
 let overlay:HTMLElement|null=null,active:HTMLElement|null=null,presented:HTMLElement|null=null,activeKind='',plane:HTMLElement|undefined;
 scope.own(()=>motion.dispose());scope.own(()=>navigation.dispose());
 let origin:{rect:DOMRect;node:HTMLElement;time:number;hub:boolean;bedroom:boolean;expected?:string}|undefined,returnTo:HTMLElement|null=null;
 let previousPetal:DOMRect|undefined;
 let sidebarRoots:HTMLElement[]=[];
 let pressed:{node:HTMLElement;pointer:number;before:string|null}|undefined;
 const ownedContent=':is(#customOverlay:is(.dgc-overlay,.dgs-overlay,.dgp-overlay):has(>.dgc-host,>.dgs-host,>.dgp-host) #customOverlayContent,.passage.dgp-overlay:has(>.dgp-host),[data-sf-workspace=saves])';
 const formButtons='[data-sf-workspace] :is(button,input[type=button],input[type=submit]),#customOverlay.dgs-native-tools .dgs-transfer :is(button,input[type=button]),'+ownedContent+' :is(button.macro-button,button.numberStepper,input[type=button],input[type=submit]),'+adaptedOverlaySelector+' :is(button,input[type=button],input[type=submit])';
 const pressSelector=formButtons+','+'.dgw-exits a.link-internal,[data-kw-entry],[data-kw-nav-control],.sf-motion-hub[data-official] button,#dol-midnight-controls button,.dgc-navigation button,.dgs-navigation button,.dgp-navigation button,.dgw-slots button,.dcu-arrangement button,.dgshop-content .category-tab';
 function clearPress(event?:PointerEvent){if(!pressed||event&&event.pointerId!==pressed.pointer)return;const {node,pointer,before}=pressed;if(node.getAttribute('data-kw-press')===String(pointer)){if(before===null)node.removeAttribute('data-kw-press');else node.setAttribute('data-kw-press',before)}pressed=undefined}
 function press(event:PointerEvent){if(!live()||!event.isPrimary||event.button!==0||!(event.target instanceof Element))return;const node=event.target.closest<HTMLElement>(pressSelector);if(!node||!visible(node)||node.matches(':disabled,[aria-disabled=true]'))return;clearPress();pressed={node,pointer:event.pointerId,before:node.getAttribute('data-kw-press')};node.setAttribute('data-kw-press',String(event.pointerId))}
 const live=()=>scope.active()&&isMasterEnabled()&&document.documentElement.hasAttribute('data-stone-free');
 const visible=(n:HTMLElement)=>!!n.getClientRects().length&&!n.closest('.hidden,[hidden],[inert]');
 function later(callback:()=>void){scope.frame(()=>{if(live())callback()})}
 function settle(callback:()=>void){later(()=>later(callback))}
 const clearFrames=scope.cancelFrames;
 function cancelPresentation(preserveOpening?:HTMLElement){clearPress();motion.cancel(undefined,preserveOpening)}
 function clearMarks(){for(const [nodes,attribute]of [[marked,'data-kw-native'],[entries,'data-kw-entry']] as const){for(const [node,value]of nodes)if(value===null)node.removeAttribute(attribute);else node.setAttribute(attribute,value);nodes.clear()}}
 function sidebar(){
  const roots=[...document.querySelectorAll<HTMLElement>('#ui-bar #overlayButtons,#ui-bar #startCaption')];
  if(roots.length!==sidebarRoots.length||roots.some((node,i)=>node!==sidebarRoots[i])){sidebarObserver.disconnect();sidebarRoots=roots;for(const node of roots)sidebarObserver.observe(node,{childList:true,subtree:true})}
  if(!live())return;
  const mark=(node:HTMLElement,owner:string)=>{if(!entries.has(node))entries.set(node,node.getAttribute('data-kw-entry'));if(node.getAttribute('data-kw-entry')!==owner)node.setAttribute('data-kw-entry',owner)};
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
  const page=pages[0];if(pages.length!==1||!page||page.dataset.passage!=='Bedroom')return;
  const contents=page.querySelectorAll<HTMLElement>(':scope>[id="passage-content"]');
  const content=contents[0];if(contents.length!==1||!content||page.querySelector('#listContainer,.dcu-root,#masturbationButtons'))return;
  // shortcut: only the reviewed direct Bedroom navigation contract; unknown/wrapped links stay native.
  for(const target of ['Wardrobe','Mirror','Bathroom','Kitchen','Orphanage','Domus Street','Settings','Attitudes']){
   const links:NodeListOf<HTMLAnchorElement>=content.querySelectorAll<HTMLAnchorElement>(`a.link-internal.macro-link[data-passage="${target}"]`);
   const link:HTMLAnchorElement|undefined=links[0];if(links.length!==1||!link||link.parentElement!==content||!visible(link))continue;
   marked.set(link,link.getAttribute('data-kw-native'));link.setAttribute('data-kw-native',target);
  }
 }
 function markScrimFamily(node:HTMLElement|null){
  plane?.toggleAttribute('data-kw-settings-family',!!node?.matches('.dgc-overlay:has(>.dgc-host),.dgs-overlay:has(>.dgs-host),.dgp-overlay:has(>.dgp-host),[data-sf-workspace=saves]'));
 }
 function scrim(open:boolean,enter=true,initial=0){
  if(open){
   if(!plane){plane=document.createElement('div');plane.className='kw-context-plane';plane.setAttribute('aria-hidden','true');document.body.append(plane)}
   markScrimFamily(active);
   if(enter)fadeWindow(motion,plane,1,initial);else motion.cancel(plane);
   document.documentElement.setAttribute('data-kw-character-layer','');
  }else{
   document.documentElement.removeAttribute('data-kw-character-layer');const old=plane;if(!old)return;
   const animation=fadeWindow(motion,old,0,initial);
   const remove=()=>{if(!active&&plane===old){old.remove();plane=undefined}};
   if(animation)void animation.finished.then(remove,remove);else remove();
  }
 }
 function known(n:HTMLElement){return n.matches('.dgc-overlay,.dgs-overlay,.dgp-overlay,.dgs-native-tools,[data-sf-workspace=saves],'+adaptedOverlaySelector)&&visible(n)&&!n.classList.contains('hidden')}
 function beginExpected(){
  if(!live()||!origin?.expected||performance.now()-origin.time>=1000)return;
  const node=document.getElementById('customOverlay');
  if(!node||node===presented||node.hidden||node.classList.contains('hidden')||node.dataset.overlay!==origin.expected)return;
  // Start before the first paint; a late adapter match must never fade an already visible window again.
  presented=node;fadeWindow(motion,node,1,0);
 }
 function syncOverlay(){
  if(!scope.active())return;
  const next=document.getElementById('customOverlay');
  if(next!==overlay){observer.disconnect();overlay=next;if(presented!==next)presented=null;if(overlay)observer.observe(overlay,{childList:true,attributes:true,attributeFilter:['class','hidden','inert','data-overlay','data-dgp-panel','data-dgu-adapter','data-dgu-adapter-match']})}
  const shown=live()&&overlay&&visible(overlay);if(!shown)presented=null;
  if(pageTransition&&(!shown||!overlay?.matches(ownWindowSelector)))clearPage();
  const nextActive=live()&&overlay&&known(overlay)?overlay:null;
  navigation.refresh();
  if(plane&&nextActive)markScrimFamily(nextActive);
  const kind=nextActive?.dataset.overlay??'';if(nextActive===active&&kind===activeKind)return;
  const old=active,adopting=!active&&!!nextActive&&presented===nextActive,opacity=plane?Number(getComputedStyle(plane).opacity):0;active=nextActive;activeKind=kind;cancelPresentation(adopting?nextActive??undefined:undefined);
  if(active){
   const entering=presented!==active;presented=active;scrim(true,entering,opacity);const from=origin&&performance.now()-origin.time<1000?origin:undefined;
   if(entering||adopting)returnTo=from?.hub?document.querySelector<HTMLElement>('.sf-motion-ball'):from?.node??null;
   if(entering)fadeWindow(motion,active,1,0);
   const focus=active.querySelector<HTMLElement>('.dgc-host button,.dgs-host button,.dgp-host button');
   if(focus&&!active.contains(document.activeElement))focus.focus({preventScroll:true});
  }else{
   if(old&&!shown){motion.cancel(old);const target=returnTo;if(target?.isConnected&&visible(target)){if(document.activeElement===document.body||old.contains(document.activeElement))target.focus({preventScroll:true})}}
   scrim(false,true,opacity);if(!shown)returnTo=null;
  }
 }
 function stamp(node:HTMLElement){
  const expected=node.dataset.kwEntry==='modhub-entry'?'modloader':node.dataset.kwEntry==='native-caption'?nativeEntryKinds[node.textContent?.trim()??'']:undefined;
  if(!origin?.hub||performance.now()-origin.time>100)origin={rect:node.getBoundingClientRect(),node,time:performance.now(),hub:!!node.closest('.sf-motion-petal'),bedroom:node.hasAttribute('data-kw-native'),expected};else if(expected)origin.expected=expected;
 }
 const ownWindowSelector='html[data-dgu-acrylic-adjustment] '+ownedOverlaySelector;
 let pageTransition:{body:HTMLElement;root:HTMLElement;before:string|null}|undefined,pageRevision=0;
 type PageIntent={navSelector:string;root:HTMLElement;parent:HTMLElement|null;body:HTMLElement|null;title:HTMLElement|null;renderRoots:Set<Node>;views:Map<HTMLElement,boolean>;oldKind:string;expectedKind:string;oldSelected:number;oldLabel:string|null|undefined;requested:string;direction:number;changed:boolean;observer:MutationObserver;stop:()=>void;ticket:number};
 let pageIntent:PageIntent|undefined;
 function stopPageIntent(){const intent=pageIntent;pageIntent=undefined;scope.cancelFrame(commitPage);if(intent){intent.observer.disconnect();intent.stop()}}
 function clearPage(){pageRevision++;stopPageIntent();if(pageTransition){const {body,root,before}=pageTransition;motion.cancel(body);if(root.getAttribute('data-workspace-transition')===''){if(before===null)root.removeAttribute('data-workspace-transition');else root.setAttribute('data-workspace-transition',before)}pageTransition=undefined}}
 scope.own(clearPage);
 const hiddenView=(node:HTMLElement)=>node.hidden||node.classList.contains('hidden')||node.getAttribute('aria-hidden')==='true'||node.style.display==='none'||node.style.visibility==='hidden';
 function watchPage(intent:PageIntent){
  intent.renderRoots=new Set(intent.body?[intent.body,...intent.body.querySelectorAll<HTMLElement>(':scope>#cheatsShown')]:[]);
  intent.views=new Map([...intent.renderRoots].flatMap(node=>[...node.childNodes].filter((n):n is HTMLElement=>n instanceof HTMLElement)).map(node=>[node,hiddenView(node)]));
  intent.observer.disconnect();if(intent.parent)intent.observer.observe(intent.parent,{childList:true});intent.observer.observe(intent.root,{childList:true,attributes:true,attributeFilter:['class','hidden','inert','data-overlay','data-dgp-panel']});
  if(intent.title)intent.observer.observe(intent.title,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  if(intent.body)intent.observer.observe(intent.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','aria-hidden','style']});
 }
 function commitPage(){
  const intent=pageIntent;if(!intent||intent.ticket!==pageRevision)return;
  if(!live()){stopPageIntent();return}
  const current=document.getElementById('customOverlay');
  if(current!==intent.root){
   if(!current)return;
   if(current.parentElement!==intent.parent||current.dataset.overlay!==intent.expectedKind){stopPageIntent();return}
   intent.root=current;intent.body=current.querySelector('#customOverlayContent');intent.title=current.querySelector('#customOverlayTitle');intent.changed=true;watchPage(intent);
  }
  if(!visible(intent.root)){stopPageIntent();return}
  const kind=intent.root.dataset.overlay??'';
  if(kind!==intent.oldKind&&kind!==intent.expectedKind){stopPageIntent();return}
  if(kind!==intent.expectedKind)return;
  syncOverlay();
  if(pageIntent!==intent||intent.ticket!==pageRevision)return;
  const body=intent.root.querySelector<HTMLElement>('#customOverlayContent'),title=intent.root.querySelector<HTMLElement>('#customOverlayTitle');
  if(body!==intent.body||title!==intent.title){intent.changed||=body!==intent.body;intent.body=body;intent.title=title;watchPage(intent)}
  const buttons=[...intent.root.querySelectorAll<HTMLElement>(intent.navSelector+'>button')],selected=buttons.findIndex(n=>n.matches('.tab-selected,.CEtabSelected,.CEbuttonBarSelected')),label=buttons[selected]?.textContent;
  if(!intent.changed||!body||!visible(body)||!intent.root.matches(ownWindowSelector)||label?.trim()!==intent.requested||intent.root.dataset.overlay===intent.oldKind&&selected===intent.oldSelected&&label===intent.oldLabel)return;
  stopPageIntent();const ticket=intent.ticket;
  pageTransition={body,root:intent.root,before:intent.root.getAttribute('data-workspace-transition')};intent.root.setAttribute('data-workspace-transition','');const animation=motion.animate(body,workspaceEnterFrames(intent.direction),620);
  const finish=()=>{if(ticket===pageRevision)clearPage()};if(animation)void animation.finished.then(finish,finish);else finish();
 }
 function expectPage(root:HTMLElement,node:HTMLElement,buttons:HTMLElement[],selected:number,navSelector:string){
  if(buttons[selected]===node)return;
  const requested=node.textContent?.trim()??'',oldKind=root.dataset.overlay??'',expectedKind=root.hasAttribute('data-dgu-adapter')?oldKind:nativeEntryKinds[requested]??({'特征':'characteristics',Characteristics:'characteristics','笔记':'journalNotes',Notes:'journalNotes'} as Record<string,string>)[requested]??oldKind;
  const intent:PageIntent={navSelector,root,parent:root.parentElement,body:root.querySelector('#customOverlayContent'),title:root.querySelector('#customOverlayTitle'),renderRoots:new Set(),views:new Map(),oldKind,expectedKind,oldSelected:selected,oldLabel:buttons[selected]?.textContent,requested,direction:buttons.indexOf(node)>=selected?1:-1,changed:false,ticket:pageRevision,stop:()=>{},observer:new MutationObserver(records=>{
   if(pageIntent!==intent)return;
   if(records.some(record=>record.type==='childList'&&intent.renderRoots.has(record.target)||record.type==='attributes'&&record.target instanceof HTMLElement&&intent.views.has(record.target)&&intent.views.get(record.target)!==hiddenView(record.target)))intent.changed=true;
   scope.frame(commitPage);
  })};pageIntent=intent;watchPage(intent);
  // Observe the native commit; this deadline only retires abandoned presentation intent.
  intent.stop=scope.timeout(()=>{if(pageIntent===intent)stopPageIntent()},1000);
 }
 function response(node:HTMLElement){if(node.dataset.kwNavControl==='tab'&&!node.closest(ownWindowSelector)){motion.animate(node,[{'--kw-heading-wave':-1,'--kw-heading-wave-opacity':0},{'--kw-heading-wave':-.2,'--kw-heading-wave-opacity':.8,offset:.35},{'--kw-heading-wave':1,'--kw-heading-wave-opacity':0}],720);return}motion.animate(node,[{boxShadow:'inset 0 0 0 1px #8cb3a666',backgroundColor:'#8cb3a617'},{boxShadow:getComputedStyle(node).boxShadow,backgroundColor:getComputedStyle(node).backgroundColor}],360)}
 function click(event:MouseEvent){
  if(!live()||!(event.target instanceof Element))return;
  const detail=event.target.closest<HTMLElement>('#customOverlay.dgp-overlay[data-dgp-panel=traits] .foldoutHeader,#customOverlay.dgp-overlay[data-dgp-panel=feats] .feat');
  if(detail&&visible(detail))response(detail);
  const node=event.target.closest<HTMLElement>(formButtons+',.dgw-exits a.link-internal,.sf-motion-petal,.sf-motion-ball,.dgw-slots button,.dgw-item,.dgshop-content .category-tab,.dgshop-content .clothing-item,.dcu-arrangement button,[data-kw-native],[data-kw-entry],[data-kw-nav-control],.dgp-navigation button');
  if(!node||!visible(node)||node.matches(':disabled,[aria-disabled=true]'))return;
  const top=(node.dataset.kwNavControl==='tab'||node.dataset.kwNavControl==='category')&&node.closest<HTMLElement>(ownWindowSelector),navSelector=node.closest('.CE-category-bar')?'#cheat_extended_options>.CE-category-bar':node.closest('.CE-subtab-bar')?'#cheat_extended_options>.CE-subtab-bar':'#overlayTabs',topButtons=top?[...top.querySelectorAll<HTMLElement>(navSelector+'>button')]:[],oldSelected=topButtons.findIndex(n=>n.matches('.tab-selected,.CEtabSelected,.CEbuttonBarSelected'));
  clearPage();if(top)expectPage(top,node,topButtons,oldSelected,navSelector);
  stamp(node);response(node);queueMicrotask(beginExpected);
  const passage=node.closest('.passage');
  settle(()=>{
   if(passage&&!passage.isConnected)return;


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
  clearPage();clearFrames();cancelPresentation();previousPetal=undefined;bedroom();settle(()=>{
   syncOverlay();const header=document.querySelector<HTMLElement>('.dgw-header,.dgshop-host');
   if(header&&origin?.bedroom&&performance.now()-origin.time<1000)motion.focus(origin.rect,header.getBoundingClientRect());
  });
 }
 function enabled(){navigation.refresh();if(live())scene();else{clearPage();clearFrames();cancelPresentation();clearMarks();active=presented=null;activeKind='';origin=undefined;returnTo=null;previousPetal=undefined;plane?.remove();plane=undefined;document.documentElement.removeAttribute('data-kw-character-layer')}}
 function resize(){clearPage();cancelPresentation()}
 const observer=new MutationObserver(records=>{
  if(!records.some(record=>record.type==='attributes'||[...record.addedNodes,...record.removedNodes].some(node=>node instanceof Element&&node.matches('.dgc-host,.dgs-host,.dgp-host'))))return;
  beginExpected();later(syncOverlay);
 });scope.own(()=>observer.disconnect());
 const sidebarObserver=new MutationObserver(()=>later(sidebar));scope.own(()=>sidebarObserver.disconnect());
 const blur=()=>clearPress();
 const parent=document.getElementById('customOverlay')?.parentElement;
 const discovery=new MutationObserver(()=>{if(document.getElementById('customOverlay')!==overlay)later(syncOverlay)});scope.own(()=>discovery.disconnect());
 if(parent)discovery.observe(parent,{childList:true});
 root.jQuery?.(document).on(':passageend.kwOfficialMotion',scene);
 document.addEventListener('click',click,true);document.addEventListener('change',collectionChange,true);document.addEventListener('pointerover',hover,true);document.addEventListener('focusin',hover,true);document.addEventListener('dol-ui-master-change',enabled);
 document.addEventListener('pointerdown',press,true);document.addEventListener('pointerup',clearPress,true);document.addEventListener('pointercancel',clearPress,true);document.addEventListener('lostpointercapture',clearPress,true);window.addEventListener('blur',blur);
 window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);
 bedroom();syncOverlay();
 scope.own(()=>{cancelPresentation();sidebarRoots=[];root.jQuery?.(document).off('.kwOfficialMotion');document.removeEventListener('click',click,true);document.removeEventListener('change',collectionChange,true);document.removeEventListener('pointerover',hover,true);document.removeEventListener('focusin',hover,true);document.removeEventListener('dol-ui-master-change',enabled);document.removeEventListener('pointerdown',press,true);document.removeEventListener('pointerup',clearPress,true);document.removeEventListener('pointercancel',clearPress,true);document.removeEventListener('lostpointercapture',clearPress,true);window.removeEventListener('blur',blur);window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);clearMarks();plane?.remove();document.documentElement.removeAttribute('data-kw-character-layer')});
 return scope.dispose;
}
