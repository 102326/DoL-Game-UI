import {createApp,reactive,type App} from 'vue';
import CombatPanel from './CombatPanel.vue';
import type {CombatModel,Group} from './types';
import './style.css';

export function startCombat(){
const KEY='DoLCombatUI.enabled.v1';
const runtime=window as typeof window & Record<string,any>;
const titles:Record<string,string>={leftaction:'左手',rightaction:'右手',feetaction:'双脚',mouthaction:'口部',penisaction:'其他行动 · 1',vaginaaction:'私处',anusaction:'臀部',chestaction:'上身',thighaction:'腿部'};
interface Docked {node:HTMLElement;anchor:Comment;slot:HTMLElement}
interface Region {list:HTMLElement;anchor:Comment;host?:HTMLElement}
interface Session {regions:Region[];list:HTMLElement;anchor:Comment;host:HTMLElement;toggle:HTMLButtonElement;app?:App;model:CombatModel;groups:Map<string,HTMLElement>;decorated:Set<HTMLElement>;separators:Map<Text,string>;dock:HTMLElement;docked:Docked[];resize?:ResizeObserver;resizeFrame?:number;spacer?:HTMLElement}
let active:Session|undefined,enabled=true,queued=false,disposed=false;
try{enabled=localStorage.getItem(KEY)!=='false'}catch{/* optional preference */}
const visible=(el:HTMLElement)=>el.isConnected&&!!el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
function clearDecorations(s:Session){for(const el of s.decorated){el.classList.remove('dcu-group');el.removeAttribute('data-dcu-title')}s.decorated.clear();for(const [node,text]of s.separators)if(node.isConnected&&node.data==='')node.data=text;s.separators.clear()}
function restoreDock(s:Session){
 for(const d of s.docked){if(d.anchor.parentNode){const current=d.slot.querySelector<HTMLElement>('[id="'+d.node.id+'"]')||d.node;if(current.isConnected)d.anchor.parentNode.insertBefore(current,d.anchor.nextSibling)}d.anchor.remove();d.slot.remove()}
 s.docked=[];
}
function release(s:Session){s.resize?.disconnect();if(s.resizeFrame!==undefined){cancelAnimationFrame(s.resizeFrame);s.resizeFrame=undefined}clearDecorations(s);restoreDock(s);for(const region of s.regions){if(region.list.isConnected&&(s.host.contains(region.list)||region.host?.contains(region.list))&&region.anchor.parentNode)region.anchor.parentNode.insertBefore(region.list,region.anchor.nextSibling);region.host?.remove();region.host=undefined}s.spacer?.remove();s.spacer=undefined;s.app?.unmount();s.app=undefined;s.host.remove();s.groups.clear()}
function disposeSession(){const s=active;if(!s)return;release(s);s.toggle.remove();for(const region of s.regions)region.anchor.remove();active=undefined}
function setEnabled(value:boolean){if(value===enabled)return;enabled=value;try{localStorage.setItem(KEY,String(value))}catch{}if(active){release(active);active.toggle.hidden=enabled;active.toggle.textContent='启用新版战斗面板';if(enabled)mount(active)}document.dispatchEvent(new Event("dol-ui-combat-change"));schedule()}
function readGroups(s:Session){const result:Group[]=[];s.groups.clear();for(const el of s.decorated)if(!s.regions.some(r=>r.list.contains(el)))s.decorated.delete(el);for(const node of s.separators.keys())if(!s.regions.some(r=>r.list.contains(node)))s.separators.delete(node);s.regions.forEach((region,regionIndex)=>Array.from(region.list.children).forEach((child,index)=>{if(!(child instanceof HTMLElement)||!visible(child))return;const controls=[...child.querySelectorAll<HTMLInputElement|HTMLSelectElement>('input[type=radio],select')].filter(visible);if(!controls.length&&!Object.hasOwn(titles,child.id))return;const key=regionIndex+':'+(child.id||'group-'+index),title=titles[child.id]||'附加行动 '+(result.length+1);s.groups.set(key,child);if(enabled){child.classList.add('dcu-group');child.dataset.dcuTitle=title;s.decorated.add(child);for(const label of child.querySelectorAll('label')){const walk=document.createTreeWalker(label,NodeFilter.SHOW_TEXT);let n:Node|null;while((n=walk.nextNode())){const t=n as Text;if(/^[\s|\u00a0]*\|[\s|\u00a0]*$/.test(t.data)){if(!s.separators.has(t))s.separators.set(t,t.data);t.data=''}}}}const selections=controls.flatMap(control=>{if(control instanceof HTMLSelectElement)return control.selectedOptions.length?[control.selectedOptions[0].textContent?.trim()||'']:[];if(!control.checked)return[];return[(control.labels?.[0]?.textContent||control.getAttribute('aria-label')||control.value).replace(/\s+/g,' ').trim()]});const count=controls.reduce((n,c)=>n+(c instanceof HTMLSelectElement?c.options.length:1),0);result.push({key,title,selected:[...new Set(selections)].join(' · '),count})}));return result}
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
function sync(s:Session){const groups=readGroups(s);if(JSON.stringify(groups)!==JSON.stringify(s.model.groups))s.model.groups=groups;syncDock(s)}
function mount(s:Session){if(s.app||!s.list.isConnected)return;s.host=document.createElement('div');s.host.className='dcu-root';s.anchor.parentNode?.insertBefore(s.host,s.anchor.nextSibling);const app=createApp(CombatPanel,{model:s.model,onClassic:()=>setEnabled(false),onJump:(key:string)=>{const el=s.groups.get(key);el?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});el?.querySelector<HTMLElement>('input:not(:disabled),select:not(:disabled),button:not(:disabled)')?.focus({preventScroll:true})}});app.config.errorHandler=error=>{console.error('[DoLCombatUI]',error);queueMicrotask(()=>{if(active===s)setEnabled(false)})};s.app=app;try{const vm=app.mount(s.host) as unknown as {native:HTMLElement;dock:HTMLElement};if(!vm.native||!vm.dock)throw Error('Missing native hosts');s.dock=vm.dock;vm.native.append(s.list);for(const region of s.regions.slice(1)){const host=document.createElement('div');host.className='dcu-root dcu-extension';const native=document.createElement('div');native.className='dcu-native';host.append(native);region.anchor.parentNode?.insertBefore(host,region.anchor.nextSibling);native.append(region.list);region.host=host}s.resize=new ResizeObserver(()=>{if(s.resizeFrame!==undefined)return;s.resizeFrame=requestAnimationFrame(()=>{s.resizeFrame=undefined;if(s.app&&s.host.isConnected)syncDock(s)})});s.resize.observe(s.host);s.resize.observe(s.dock);const story=document.getElementById("story");if(story)s.resize.observe(story);sync(s)}catch(error){release(s);enabled=false;s.toggle.hidden=false;s.toggle.textContent='启用新版战斗面板';console.error('[DoLCombatUI mount]',error)}}
function scan(){
 if(disposed)return;observeScope();
 // Original struggle scenes deliberately emit several listContainer IDs.
 // Keep each region in place rather than gathering narrative into one panel.
 const lists=[...document.querySelectorAll<HTMLElement>('#passages .passage [id="listContainer"]')].filter(visible);
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
  active={regions,list,anchor,toggle,host:document.createElement('div'),model:reactive({groups:[]}),groups:new Map(),decorated:new Set(),separators:new Map(),dock:document.createElement('div'),docked:[]};if(enabled)mount(active)
 }
 if(active)sync(active)
}
function schedule(){if(queued||disposed)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}
const observer=new MutationObserver(records=>{if(records.some(r=>{const el=r.target instanceof Element?r.target:r.target.parentElement;return !!el?.closest('.dcu-native,.dcu-dock-native')||!el?.closest('.dcu-root')}))schedule()});
function change(e:Event){if(active?.regions.some(r=>r.list.contains(e.target as Node)))schedule()}
let observedRoot:HTMLElement|undefined;function observeScope(){const target=document.getElementById('passages')||document.body;if(target===observedRoot)return;observer.disconnect();observedRoot=target;observer.observe(target,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','hidden','style','aria-disabled']})}
function start(){if(disposed)return;observeScope();document.addEventListener('change',change);document.addEventListener('input',change);window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,true);if(runtime.jQuery)runtime.jQuery(document).on(':passageend.dcu :storyready.dcu',schedule);schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
runtime.DoLCombatUI={version:'0.2.0',getEnabled:()=>enabled,refresh:schedule,setEnabled,destroy(){disposed=true;observer.disconnect();document.removeEventListener('change',change);document.removeEventListener('input',change);window.removeEventListener('resize',schedule);window.removeEventListener('scroll',schedule,true);document.removeEventListener('DOMContentLoaded',start);runtime.jQuery?.(document).off('.dcu');disposeSession();delete runtime.DoLCombatUI}};

}
