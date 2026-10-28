import {createApp,h,reactive,type App} from 'vue';
import OrbitFocus from '../../src/ui/OrbitFocus.vue';
import {mountUI,unmountUI} from '../../src/runtime/presentation';
import {isMasterEnabled} from '../../src/runtime/master';
import {headerWeather} from './weather';
import {visualScope} from '../../src/ui/visual-scope';

export const adaptedOverlaySelector='#customOverlay[data-dgu-adapter-match=full]:is([data-dgu-adapter=ModHubSoftWet],[data-dgu-adapter=MapleBirchSoftWet],[data-dgu-adapter=DolOptimizationSoftWet],[data-dgu-adapter=CheatExtendedSoftWet])';
export const nativeEntryKinds:Readonly<Record<string,string>>={属性:'characteristics',Attributes:'characteristics',社交:'social',Social:'social',特质:'traits',Traits:'traits',日志:'journal',Journal:'journal',统计:'statistics',Statistics:'statistics',成就:'gameFeats',Feats:'gameFeats',选项:'options',Options:'options',存档:'saves',Saves:'saves',作弊:'cheats',Cheats:'cheats'};

// Decoration for reviewed native navigation only; native nodes and handlers stay in place.
export function nativeNavigation(){
 type Group={node:HTMLElement;host?:HTMLElement;app?:App;orbit:boolean;state:{active:string};attrs:Map<HTMLElement,[string|null,string|null]>;className:string;hadClass:boolean;observer:MutationObserver};
 const groups=new Map<'sidebar'|'tabs'|'ce-inline',Group>(),weather=headerWeather(),scope=visualScope();
 scope.own(()=>weather.dispose());for(const key of ['ce-inline','sidebar','tabs'] as const)scope.own(()=>release(key));
 const labels=nativeEntryKinds;
 const tabNames=new Set(['属性','社交','特征','特质','成就','日志','笔记','统计','额外统计 (包含剧透)','模组统计','作弊','选项','游戏设置','Attributes','Social','Characteristics','Traits','Feats','Journal','Notes','Statistics','Extra Statistics (Spoilers)','Mod Statistics','Cheats','Options']);
 const formTabs:Record<string,Set<string>>={
  journal:new Set(['可用物品','Available Items']),
  cheats:new Set(['状态','外观','NPC','传送','其它','模组作弊','Stats','Appearance','Teleport','Other','Mods Cheats']),
  saves:new Set(['存档','导出/载入','云存档','Saves','Export/Import','Cloud Saves']),
  options:new Set(['通用','主题','性能','高级','信息','原版优化','模组设置','General','Theme','Performance','Advanced','Information','Mod Settings'])
 };
 function restore(group:Group,node?:HTMLElement){for(const[n,[role,selected]]of group.attrs){if(node&&node!==n)continue;if(role===null)n.removeAttribute('data-kw-nav-control');else n.setAttribute('data-kw-nav-control',role);if(selected===null)n.removeAttribute('data-kw-selected');else n.setAttribute('data-kw-selected',selected);group.attrs.delete(n)}}
 function release(key:'sidebar'|'tabs'|'ce-inline'){const g=groups.get(key);if(!g)return;groups.delete(key);g.observer.disconnect();unmountUI(g.app);g.host?.remove();restore(g);if(!g.hadClass)g.node.classList.remove(g.className)}
 function schedule(){scope.frame(refresh)}
 function group(key:'sidebar'|'tabs'|'ce-inline',node:HTMLElement|undefined,orbit=key==='sidebar'){
  if(groups.get(key)?.node!==node||groups.get(key)?.orbit!==orbit)release(key);if(!node)return;
  let g=groups.get(key);if(g){if(g.host&&g.host.parentElement!==node)node.append(g.host);return g}
  const state=reactive({active:''}),className=key==='sidebar'?'dgu-orbit-nav':'kw-heading-nav';
  g={node,state,orbit,attrs:new Map(),className,hadClass:node.classList.contains(className),observer:new MutationObserver(schedule)};groups.set(key,g);node.classList.add(className);
  if(orbit){const host=document.createElement('span');host.className='kw-native-orbit';host.setAttribute('aria-hidden','true');const app=createApp({render:()=>h(OrbitFocus,{container:node,selector:'[data-kw-selected=true]',active:state.active})});g.host=host;g.app=app;node.append(host);mountUI(app,host,()=>release(key))}
  if(groups.get(key)!==g)return;g.observer.observe(node,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});return groups.get(key);
 }
 function mark(g:Group,n:HTMLElement,role:string,selected:boolean){if(!g.attrs.has(n))g.attrs.set(n,[n.getAttribute('data-kw-nav-control'),n.getAttribute('data-kw-selected')]);if(n.getAttribute('data-kw-nav-control')!==role)n.setAttribute('data-kw-nav-control',role);if(selected){if(n.getAttribute('data-kw-selected')!=='true')n.setAttribute('data-kw-selected','true')}else if(n.hasAttribute('data-kw-selected'))n.removeAttribute('data-kw-selected')}
 function refresh(){
  if(!scope.active())return;if(!isMasterEnabled()){release('tabs');release('sidebar');release('ce-inline');weather.clear();return}
  const overlay=document.querySelector<HTMLElement>('#customOverlay:not(.hidden):is(.dgs-overlay,.dgc-overlay,.dgp-overlay,.dgs-native-tools),'+adaptedOverlaySelector+':not(.hidden)'),kind=overlay?.dataset.overlay;
  const tabNode=overlay?.querySelector<HTMLElement>(overlay.dataset.dguAdapter==='CheatExtendedSoftWet'?'#cheat_extended_options':'#overlayTabs')??undefined,adapted=!!overlay?.matches(adaptedOverlaySelector),ce=overlay?.dataset.dguAdapter==='CheatExtendedSoftWet';
  const tabButtons=tabNode?(adapted?[...tabNode.querySelectorAll<HTMLElement>(ce?':scope>.CE-category-bar>button,:scope>.CE-subtab-bar>button':':scope>button')]:[...tabNode.querySelectorAll<HTMLElement>(':scope>button.link-internal.macro-button')].filter(n=>{const label=n.textContent?.trim()??'',plain=!n.childElementCount,optimization=kind==='options'&&n.childElementCount===1&&n.firstElementChild?.matches('span#doloptimizationModTab');return (plain||optimization)&&(tabNames.has(label)||!!formTabs[kind??'']?.has(label))})):[];
  // Let weather read visibility before navigation decorations invalidate layout.
  const own=!!overlay?.matches('.dgc-overlay:has(>.dgc-host),.dgs-overlay:has(>.dgs-host),.dgp-overlay:has(>.dgp-host)');
  weather.set('native',tabButtons.length||own?overlay?.querySelector<HTMLElement>('#customOverlayTitle,:scope>.dgc-host,:scope>.dgs-host,:scope>.dgp-host')??undefined:undefined,overlay??undefined);
  const sidebar=group('sidebar',document.querySelector<HTMLElement>('#ui-bar #overlayButtons,#ui-bar #startCaption')??undefined);
  if(sidebar){const buttons=[...sidebar.node.querySelectorAll<HTMLElement>('[data-kw-entry=native-caption],[data-kw-entry=official-settings]')];for(const n of sidebar.attrs.keys())if(!buttons.includes(n))restore(sidebar,n);
   let current='';for(const n of buttons){const own=n.dataset.kwEntry==='official-settings',selected=document.documentElement.hasAttribute('data-dgu-settings-open')?own:!own&&!!kind&&(labels[n.textContent?.trim()??'']===kind||kind==='journalNotes'&&labels[n.textContent?.trim()??'']==='journal');mark(sidebar,n,'entry',selected);if(selected)current=n.textContent??''}sidebar.state.active=current;
  }
  const tabs=group('tabs',tabNode,document.documentElement.hasAttribute('data-dgu-acrylic-adjustment')&&own);
  if(tabs){const buttons=tabButtons;for(const n of tabs.attrs.keys())if(!buttons.includes(n))restore(tabs,n);for(const n of buttons)mark(tabs,n,ce&&n.parentElement?.classList.contains('CE-subtab-bar')?'category':'tab',n.matches('.tab-selected,.CEtabSelected,.CEbuttonBarSelected'));tabs.state.active=buttons.find(n=>n.dataset.kwSelected==='true')?.textContent??''}
  const inline=group('ce-inline',overlay?.querySelector<HTMLElement>('[data-dgu-adapter=CheatExtendedInlineSoftWet][data-dgu-adapter-match=full] #cheat_extended_options')??undefined);
  if(inline){const buttons=[...inline.node.querySelectorAll<HTMLElement>(':scope>.CE-category-bar>button,:scope>.CE-subtab-bar>button')];for(const n of inline.attrs.keys())if(!buttons.includes(n))restore(inline,n);for(const n of buttons)mark(inline,n,n.parentElement?.classList.contains('CE-subtab-bar')?'category':'tab',n.matches('.CEtabSelected,.CEbuttonBarSelected'))}
  const settings=document.querySelector<HTMLElement>('#dol-midnight-controls[open]:not([data-sf-leaving]) .dmt-settings-header');
  watchPassage();
  const passage=document.querySelector<HTMLElement>('#passages>.passage.dgp-overlay:has(>.dgp-host),#passages .passage:last-child.dgp-overlay:has(>.dgp-host)');
  weather.set('passage',passage?.querySelector<HTMLElement>(':scope>.dgp-host')??undefined,passage??undefined);
  weather.set('settings',settings??undefined,settings?.closest<HTMLElement>('.dmt-settings-shell')??undefined);weather.refresh();
 }
 let passageRoot:HTMLElement|null=null,watchedPassage:HTMLElement|null=null;
 const passageObserver=new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'||[...r.addedNodes,...r.removedNodes].some(n=>n instanceof Element&&n.matches('.passage,.dgp-host'))))schedule()});scope.own(()=>passageObserver.disconnect());
 function watchPassage(){const root=document.getElementById('passages'),last=root?.querySelector<HTMLElement>('.passage:last-child')??null;if(root===passageRoot&&last===watchedPassage)return;passageObserver.disconnect();passageRoot=root;watchedPassage=last;if(root)passageObserver.observe(root,{childList:true});if(last)passageObserver.observe(last,{childList:true,attributes:true,attributeFilter:['class','hidden','data-dgp-panel']})}
 const visibility=new MutationObserver(schedule);visibility.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['data-dgu-settings-open','data-dgu-adapter','data-dgu-adapter-match']});
 scope.own(()=>visibility.disconnect());return{refresh,dispose:scope.dispose};
}
