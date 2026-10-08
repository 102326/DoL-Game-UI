import {isolate,unmountUI,restoreNative} from '../runtime/presentation';
import {createApp,reactive,type App} from 'vue';
import CombatPanel from './CombatPanel.vue';
import type {CombatModel} from './types';
import {createCombatSource,visible} from './source';
import './style.css';
import {wrapActionLists} from './native-actions';
import {isMasterEnabled} from '../runtime/master';
import type {NativeEventsHost} from '../runtime/sugarcube';
export interface CombatControls {version:string;getEnabled:()=>boolean;refresh:()=>void;setEnabled:(value:boolean)=>void;destroy:()=>void}

export function startCombat(){
const KEY='DoLCombatUI.enabled.v1';
const runtime=window as NativeEventsHost & {DoLCombatUI?:CombatControls};
interface Docked {node:HTMLElement;anchor:Comment;slot:HTMLElement}
interface Region {list:HTMLElement;anchor:Comment;host?:HTMLElement}
interface Session {regions:Region[];list:HTMLElement;anchor:Comment;host:HTMLElement;toggle:HTMLButtonElement;app?:App;model:CombatModel;source:ReturnType<typeof createCombatSource>;groups:Map<string,HTMLElement>;decorated:Set<HTMLElement>;separators:Map<Text,string>;dock:HTMLElement;docked:Docked[];resize?:ResizeObserver;resizeFrame?:number;spacer?:HTMLElement}
let active:Session|undefined,enabled=true,queued=false,disposed=false;
let actionLists:ReturnType<typeof wrapActionLists>|undefined;
try{enabled=localStorage.getItem(KEY)!=='false'}catch{/* optional preference */}
function clearDecorations(s:Session){for(const el of s.decorated){el.classList.remove('dcu-group');el.removeAttribute('data-dcu-title');el.removeAttribute('data-dcu-active');el.removeAttribute('data-dcu-dense');el.removeAttribute('data-dcu-unavailable')}s.decorated.clear();for(const [node,text]of s.separators)if(node.isConnected&&node.data==='')node.data=text;s.separators.clear()}
function focusGroup(s:Session,key:string){s.model.activeKey=key;for(const [groupKey,el] of s.groups)el.toggleAttribute('data-dcu-active',groupKey===key)}
function restoreDock(s:Session){
 for(const d of s.docked){const current=d.slot.querySelector<HTMLElement>('[id="'+d.node.id+'"]')||d.node;restoreNative(current,d.anchor,s.list.closest('.passage'));d.slot.remove()}
 s.docked=[];
}
function release(s:Session){s.resize?.disconnect();if(s.resizeFrame!==undefined){cancelAnimationFrame(s.resizeFrame);s.resizeFrame=undefined}clearDecorations(s);restoreDock(s);for(const region of s.regions){if(region.list.isConnected&&(s.host.contains(region.list)||region.host?.contains(region.list)))restoreNative(region.list,region.anchor,s.host.closest('.passage'),true);region.host?.remove();region.host=undefined}s.spacer?.remove();s.spacer=undefined;unmountUI(s.app);s.app=undefined;s.host.remove();s.groups.clear()}
function disposeSession(){const s=active;if(!s)return;release(s);s.source.destroy();s.toggle.remove();for(const region of s.regions)region.anchor.remove();active=undefined;actionLists?.restore();actionLists=undefined}
function setEnabled(value:boolean){if(value===enabled&&!failed)return;failed=false;enabled=value;try{localStorage.setItem(KEY,String(value))}catch{}if(active&&actionLists&&!enabled)disposeSession();if(active){release(active);active.toggle.hidden=enabled;active.toggle.textContent='启用新版战斗面板';if(enabled)mount(active)}document.dispatchEvent(new Event("dol-ui-combat-change"));schedule()}
function readGroups(s:Session){
 const snapshot=s.source.read();s.groups.clear();
 for(const el of s.decorated)if(!s.regions.some(r=>r.list.contains(el)))s.decorated.delete(el);
 for(const node of s.separators.keys())if(!s.regions.some(r=>r.list.contains(node)))s.separators.delete(node);
 for(const g of snapshot.groups){const child=s.source.group(g.key);if(!child)continue;s.groups.set(g.key,child);
  if(enabled){if(!child.classList.contains('dcu-group'))child.classList.add('dcu-group');if(child.dataset.dcuTitle!==g.title)child.dataset.dcuTitle=g.title;child.toggleAttribute('data-dcu-active',s.model.activeKey===g.key);child.toggleAttribute('data-dcu-dense',g.available>8);child.toggleAttribute('data-dcu-unavailable',g.available===0);s.decorated.add(child);
   const walk=document.createTreeWalker(child,NodeFilter.SHOW_TEXT);let n:Node|null;while((n=walk.nextNode())){const t=n as Text;if(/^[\s|\u00a0]*\|[\s|\u00a0]*$/.test(t.data)){if(!s.separators.has(t))s.separators.set(t,t.data);t.data=''}}
  }
 }
 s.model.unknown=snapshot.unknown;s.model.selectedGroups=snapshot.groups.filter(g=>g.selected).length;s.model.availableActions=snapshot.groups.reduce((n,g)=>n+g.available,0);s.model.phase=!s.model.availableActions?'unavailable':s.model.selectedGroups?'selected':'selecting';
 return snapshot.groups;
}
function dockCandidates(s:Session){
 const passage=s.list.closest('.passage');if(!passage)return [] as HTMLElement[];
 const unique=(id:string)=>{const matches=passage.querySelectorAll<HTMLElement>('#'+id);return matches.length===1?matches[0]:undefined};
 const menu=unique('cbtToggleMenu'),mast=unique('masturbationButtons'),next=unique('next');
 const out:HTMLElement[]=[];if(menu)out.push(menu);if(mast)out.push(mast);if(next&&!mast?.contains(next))out.push(next);return out;
}
function syncDock(s:Session){
 if(!s.app||!s.dock.isConnected)return;
 const candidates=dockCandidates(s);
 for(const d of [...s.docked]){
  if(candidates.includes(d.node))continue;
  const replacement=candidates.find(n=>n.id===d.node.id&&d.slot.contains(n));
  if(replacement){d.node=replacement;continue}
  if(d.node.isConnected&&d.anchor.parentNode)d.anchor.parentNode.insertBefore(d.node,d.anchor.nextSibling);
  d.anchor.remove();d.slot.remove();s.docked.splice(s.docked.indexOf(d),1);
 }
 for(const node of candidates){
  if(s.docked.some(d=>d.node===node))continue;
  const anchor=document.createComment('DoLCombatUI native control position');node.before(anchor);
  const slot=document.createElement('div');slot.className='dcu-control-slot';if(node.id==='cbtToggleMenu')slot.classList.add('dcu-menu-slot');
  s.dock.querySelector('.dcu-dock-native')!.append(slot);slot.append(node);s.docked.push({node,anchor,slot});
 }
 const r=s.host.getBoundingClientRect();
 const set=(key:string,value:string)=>{if(s.dock.style.getPropertyValue(key)!==value)s.dock.style.setProperty(key,value)};
 set('--dcu-left',`${r.left}px`);set('--dcu-width',`${r.width}px`);
 const passage=s.list.closest('.passage');
 if(passage){if(!s.spacer){s.spacer=document.createElement('div');s.spacer.className='dcu-bottom-reserve';s.spacer.setAttribute('aria-hidden','true')}if(passage.lastElementChild!==s.spacer)passage.append(s.spacer);const reserve=`${s.dock.offsetHeight+16}px`;if(s.spacer.style.height!==reserve)s.spacer.style.height=reserve}
}
function sync(s:Session){s.host.toggleAttribute('data-dcu-narrow',s.host.clientWidth<700);const groups=readGroups(s);s.host.toggleAttribute('data-dcu-complex',groups.length>3||groups.some(g=>g.available>8));s.host.toggleAttribute('data-dcu-multiple',groups.length>1);if(s.model.activeKey&&!s.groups.has(s.model.activeKey))s.model.activeKey='';if(JSON.stringify(groups)!==JSON.stringify(s.model.groups))s.model.groups=groups;syncDock(s)}
function mount(s:Session){if(s.app||!s.list.isConnected)return;s.host=document.createElement('div');s.host.className='dcu-root dcu-candidate';s.anchor.parentNode?.insertBefore(s.host,s.anchor.nextSibling);const app=createApp(CombatPanel,{model:s.model,onClassic:()=>setEnabled(false),onJump:(key:string)=>{focusGroup(s,key);const el=s.source.group(key);el?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});s.source.focusTarget(key)?.focus({preventScroll:true})}});app.config.errorHandler=error=>{console.error('[DoLCombatUI]',error);queueMicrotask(()=>{if(active===s)recover()})};s.app=app;try{const vm=app.mount(s.host) as unknown as {native:HTMLElement;dock:HTMLElement};if(!vm.native||!vm.dock)throw Error('Missing native hosts');s.dock=vm.dock;vm.native.append(s.list);for(const region of s.regions.slice(1)){const host=document.createElement('div');host.className='dcu-root dcu-extension dcu-candidate';const native=document.createElement('div');native.className='dcu-native';host.append(native);region.anchor.parentNode?.insertBefore(host,region.anchor.nextSibling);native.append(region.list);region.host=host}if(typeof ResizeObserver==='function'){s.resize=new ResizeObserver(()=>{if(s.resizeFrame!==undefined)return;s.resizeFrame=requestAnimationFrame(()=>{s.resizeFrame=undefined;if(s.app&&s.host.isConnected)isolate('combat resize',()=>{s.host.toggleAttribute('data-dcu-narrow',s.host.clientWidth<700);syncDock(s)},recover)})});s.resize.observe(s.host);s.resize.observe(s.dock);const story=document.getElementById("story");if(story)s.resize.observe(story)}sync(s)}catch(error){recover();console.error('[DoLCombatUI mount]',error)}}
let failed=false,failedPassage:Element|null=null;
function recover(){failed=true;failedPassage=active?.list.closest('.passage')??null;disposeSession();document.dispatchEvent(new Event('dol-ui-combat-change'))}
function scan(){isolate('combat',update,recover)}
function update(){
 if(disposed)return;observeScope();if(failed&&document.querySelector('#passages .passage:not(.passage-out)')!==failedPassage){failed=false;failedPassage=null}
 if(!isMasterEnabled()||failed){disposeSession();return}
 // Original struggle scenes deliberately emit several listContainer IDs.
 // Keep each region in place rather than gathering narrative into one panel.
 let lists=[...document.querySelectorAll<HTMLElement>('#passages .passage:not(.passage-out) [id="listContainer"],#passages .passage:not(.passage-out) [data-dcu-action-list]')].filter(visible);
 if(actionLists&&enabled){
  const page=lists[0]?.closest('.passage');
  const added=page&&[...page.querySelectorAll<HTMLInputElement>('input[type=radio]')].some(input=>input.name&&input.parentElement?.tagName==='LABEL'&&!input.closest('[data-dcu-action-list],#listContainer'));
  if(added){disposeSession();lists=[]}
 }
 if(!lists.length&&enabled){disposeSession();const page=[...document.querySelectorAll<HTMLElement>('#passages .passage:not(.passage-out)')].find(page=>page.querySelector('#masturbationButtons'));if(page){actionLists=wrapActionLists(page);lists=actionLists.lists.filter(visible)}}
 const passage=lists[0]?.closest('.passage');
 if(!lists.length||lists.some(list=>list.closest('.passage')!==passage||lists.some(other=>other!==list&&other.contains(list)))){disposeSession();return}
 if(active&&(active.regions.length!==lists.length||active.regions.some((r,i)=>r.list!==lists[i]))){
  // A script may replace the primary list inside our host. Rescue it before unmounting.
  for(const list of lists)if(active.host.contains(list)&&!active.regions.some(r=>r.list===list)&&active.anchor.parentNode)active.anchor.parentNode.insertBefore(list,active.anchor.nextSibling);
  for(const region of active.regions)for(const list of lists)if(region.host?.contains(list)&&list!==region.list&&region.anchor.parentNode)region.anchor.parentNode.insertBefore(list,region.anchor.nextSibling);
  disposeSession();
 }
 if(!active){
  const regions=lists.map(list=>{const anchor=document.createComment('DoLCombatUI original list position');list.before(anchor);return{list,anchor}});
  const {list,anchor}=regions[0];const toggle=document.createElement('button');toggle.type='button';toggle.className='dcu-toggle';toggle.hidden=enabled;toggle.textContent='启用新版战斗面板';toggle.onclick=()=>setEnabled(!enabled);anchor.parentNode!.insertBefore(toggle,anchor);
  const source=createCombatSource(lists,()=>!disposed&&isMasterEnabled()&&list.isConnected&&list.closest('.passage')===document.querySelector('#passages .passage:not(.passage-out)'));
  active={regions,list,anchor,toggle,host:document.createElement('div'),source,model:reactive({groups:[],unknown:0,selectedGroups:0,availableActions:0,phase:'selecting',message:''}),groups:new Map(),decorated:new Set(),separators:new Map(),dock:document.createElement('div'),docked:[]};if(enabled)mount(active)
 }
 if(active)sync(active)
}
function schedule(){if(queued||disposed)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}
const observer=new MutationObserver(records=>{if(records.some(r=>{const el=r.target instanceof Element?r.target:r.target.parentElement;return !!el?.closest('.dcu-native,.dcu-dock-native')||!el?.closest('.dcu-root')}))schedule()});
function nativeClick(event:Event){
 const s=active;if(!enabled||failed||!s?.app||!(event.target instanceof Element)||(!s.host.contains(event.target)&&!s.regions.some(r=>r.list.contains(event.target as Node))))return;
 const target=event.target,continuation=target.closest<HTMLElement>('#next a,#next button,button#next,#skip a,#stop a');
 if(!s.source.validate(target)||(continuation&&!s.source.beginContinue(continuation))){event.preventDefault();event.stopImmediatePropagation();s.model.message='原动作已隐藏、禁用或更新。本次未操作，请使用当前控件。';schedule()}else s.model.message='';
}
function focusAction(e:Event){if(!active||!enabled||!(e.target instanceof Element))return;const group=e.target.closest('.dcu-group');if(group)for(const [key,el] of active.groups)if(el===group){focusGroup(active,key);break}}
function change(e:Event){if(active?.regions.some(r=>r.list.contains(e.target as Node)))schedule()}
let observedRoot:HTMLElement|undefined;function observeScope(){const target=document.getElementById('passages')||document.body;if(target===observedRoot)return;observer.disconnect();observedRoot=target;observer.observe(target,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','hidden','style','aria-disabled','aria-hidden','class','checked']})}
function start(){if(disposed)return;observeScope();if(failed&&document.querySelector('#passages .passage:not(.passage-out)')!==failedPassage){failed=false;failedPassage=null}document.addEventListener('click',nativeClick,true);document.addEventListener('focusin',focusAction);document.addEventListener('pointerdown',focusAction);document.addEventListener('change',change);document.addEventListener('input',change);window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,true);if(runtime.jQuery)runtime.jQuery(document).on(':passageend.dcu :storyready.dcu',schedule);schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
runtime.DoLCombatUI={version:'0.2.0',getEnabled:()=>enabled&&!failed,refresh:scan,setEnabled,destroy(){disposed=true;observer.disconnect();document.removeEventListener('click',nativeClick,true);document.removeEventListener('focusin',focusAction);document.removeEventListener('pointerdown',focusAction);document.removeEventListener('change',change);document.removeEventListener('input',change);window.removeEventListener('resize',schedule);window.removeEventListener('scroll',schedule,true);document.removeEventListener('DOMContentLoaded',start);runtime.jQuery?.(document).off('.dcu');disposeSession();delete runtime.DoLCombatUI}};

}
