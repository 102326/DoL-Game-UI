import {visualScope} from '../../src/ui/visual-scope';
import type {UiApi, StyleAdapter, AdapterHandle, AdapterDiagnostics} from '../../src/public/ui';


declare const window: Window & {
 DoLGameUI?: {ui?: Partial<UiApi>; getPreferences?: () => {savesEnabled?: unknown}};
 DolOptimizationSoftWet?: Readonly<{getDiagnostics(): AdapterDiagnostics | Readonly<{status: 'inactive'; reason: string}>; getWardrobeDiagnostics(): Readonly<{status: string; reason: string}>; getDateDiagnostics(): {pending:number;repaired:number;unavailable:number}; destroy(): void}>;
};

(function () {
 "use strict";
 if (window.DolOptimizationSoftWet) return;
 const wardrobe=createOptimizationWardrobe(window);
 const spec: StyleAdapter = {
  id: "DolOptimizationSoftWet", version: "1.0.3",
  target: {name: "原版优化", versions: [">=1.1.1.2"]},
  scope: ['#customOverlay'],
  fingerprint: {
   id: "optimization-idb-saves-1.1.1.2",
   safe: [['#saveList'], ['#overlayTabs']],
   required: [['#saveList #saves-list-container'], ['#saveList #pageNum'], ['#saveList #pageLen']]
  },
  when: () => document.getElementById('customOverlay')?.dataset.overlay === 'saves' && window.DoLGameUI?.getPreferences?.().savesEnabled === true && window.DoLGameUI?.ui?.getCapabilities?.().hasSelector === true,
  roles: [
   {role: "list", selectors: ['#saves-list-container']},
   {role: "compact-row", selectors: ['#saves-list-container>.savesListRow'], all: true},
   {role: "status", selectors: ['#saves-list-container .datestamp'], all: true},
   {role: "danger-action", selectors: ['#saves-list-container .deleteButton', '#saveList .saves-clear'], all: true}
  ]
 };
 let owner: Partial<UiApi> | null | undefined = null;
 let handle: Readonly<AdapterHandle> | null = null, reason = "runtime-unavailable";
 const dates=createOptimizationDates(window,()=>window.DoLGameUI?.getPreferences?.().savesEnabled===true&&window.DoLGameUI?.ui?.getCapabilities?.().enabled===true&&handle?.getDiagnostics().match==='full');
 function attach() {
  const ui = window.DoLGameUI?.ui;
  if (owner === ui) return;
  handle?.destroy(); owner = ui; handle = null;
  reason = ui ? "runtime-api-unsupported" : "runtime-unavailable";
  if (ui?.apiVersion !== 1 || typeof ui.registerStyleAdapter !== "function" || typeof ui.getCapabilities !== "function") return;
  try {
   if (!ui.getCapabilities().styleAdapters) {reason = "style-adapter-unavailable"; return}
   handle = ui.registerStyleAdapter(spec);
  } catch {reason = "registration-failed"}
 }
 document.addEventListener("dol-ui-runtime-ready", attach);
 window.DolOptimizationSoftWet = Object.freeze({
  getDiagnostics: () => handle?.getDiagnostics() ?? Object.freeze({status: "inactive", reason}),
  getWardrobeDiagnostics: wardrobe.getDiagnostics,
  getDateDiagnostics: dates.getDiagnostics,
  destroy() {dates.destroy();wardrobe.destroy();document.removeEventListener("dol-ui-runtime-ready", attach); handle?.destroy(); handle = null; owner = null; delete window.DolOptimizationSoftWet}
 });
 attach();
})();

type SavedDate={year:number;month:number;day:number;hour:number;minute:number;weekDayName:string};
type DateHost=Window & {
 idb?:{getItem(slot:number):Promise<unknown>};
 SugarCube?:{State?:{deltaDecode(delta:unknown[]):unknown}};
 DateTime?:new(timestamp:number)=>SavedDate;
 getTimeString?:(hour:number,minute:number)=>unknown;
};

/** Repair only a malformed target-owned date; never replace a valid upstream result. */
function createOptimizationDates(root:DateHost,matched:()=>boolean){
 const scope=visualScope();
 type Binding={node:HTMLElement;overlay:HTMLElement;row:Element;stamp:HTMLElement;slot:number;realDate:string;text:ChildNode|null;original:string;replacement?:string;replacementText?:ChildNode|null;pending:boolean;unavailable:boolean};
 const records=new Map<HTMLElement,Binding>();
 const malformed=(text:string)=>/^\([^()]*\b(?:NaN|undefined|Infinity)\b[^()]*\)$/.test(text);
 function active(){const overlay=document.querySelector<HTMLElement>('#customOverlay[data-overlay="saves"]');return matched()&&overlay?.getClientRects().length&&!overlay.closest('[hidden],.hidden,[aria-hidden="true"]')?overlay:null}
 function binding(node:HTMLElement,overlay:HTMLElement){
  const stamp=node.parentElement,row=node.closest('.savesListRow'),id=row?.querySelector('.saveId')?.textContent?.trim()??'';
  if(!node.isConnected||node.children.length||!stamp?.matches('.datestamp')||stamp.children.length!==1||!row||!overlay.contains(row)||!row.closest('#saves-list-container')||!/^\d+$/.test(id))return null;
  const slot=Number(id);if(!Number.isSafeInteger(slot)||slot<1)return null;
  const realDate=[...stamp.childNodes].filter(n=>n!==node).map(n=>n.textContent).join('').trim();
  return {node,overlay,row,stamp,slot,realDate,text:node.firstChild};
 }
 function same(record:Binding){const current=binding(record.node,record.overlay);return !!current&&current.row===record.row&&current.stamp===record.stamp&&current.slot===record.slot&&current.realDate===record.realDate}
 function release(node:HTMLElement){const record=records.get(node);records.delete(node);if(record?.replacement!==undefined&&node.firstChild===record.replacementText&&!node.children.length&&node.textContent===record.replacement)node.textContent=record.original}
 function clear(){for(const node of records.keys())release(node)}
 async function repair(record:Binding){
  try{
   const api=root.idb,decode=root.SugarCube?.State?.deltaDecode,C=root.DateTime,time=root.getTimeString;
   if(!api||typeof api.getItem!=='function'||typeof decode!=='function'||typeof C!=='function'||typeof time!=='function')throw Error('Date reader unavailable');
   const item=await api.getItem(record.slot) as {slot?:unknown;data?:{index?:unknown;delta?:unknown}}|undefined;
   if(!scope.active()||records.get(record.node)!==record||active()!==record.overlay||!same(record)||record.node.firstChild!==record.text||record.node.textContent!==record.original)return;
   const data=item?.data,index=data?.index;
   if(item?.slot!==record.slot||!Array.isArray(data?.delta)||typeof index!=='number'||!Number.isInteger(index)||index<0||index>=data.delta.length)throw Error('Unknown save history');
   const history=decode(data.delta) as {variables?:{startDate?:unknown;timeStamp?:unknown}}[];
   if(!Array.isArray(history)||index>=history.length)throw Error('Decoded history unavailable');
   const vars=history[index]?.variables,start=vars?.startDate,elapsed=vars?.timeStamp;
   if(typeof start!=='number'||typeof elapsed!=='number'||!Number.isFinite(start)||!Number.isFinite(elapsed)||!Number.isFinite(start+elapsed))throw Error('Saved time unavailable');
   const date=new C(start+elapsed),clock=time(date.hour,date.minute);
   if(![date.year,date.month,date.day,date.hour,date.minute].every(Number.isInteger)||date.month<1||date.month>12||date.day<1||date.day>31||date.hour<0||date.hour>23||date.minute<0||date.minute>59||typeof date.weekDayName!=='string'||!date.weekDayName.trim()||typeof clock!=='string'||!/^\d{1,2}:\d{2}$/.test(clock))throw Error('Formatted time unavailable');
   record.replacement=`(${date.year}/${date.month}/${date.day} ${('0'+clock).slice(-5)} ${date.weekDayName})`;
   record.node.textContent=record.replacement;
   record.replacementText=record.node.firstChild;
  }catch{record.unavailable=true}
  finally{record.pending=false}
 }
 function refresh(){
  const overlay=active();
  for(const[node,record]of records)if(!overlay||record.overlay!==overlay||!same(record)||node.firstChild!==(record.replacementText??record.text)||node.textContent!==(record.replacement??record.original))release(node);
  if(!overlay)return;
  for(const node of overlay.querySelectorAll<HTMLElement>('#saves-list-container .datestamp > span.pink')){
   if(records.has(node)||!malformed(node.textContent??''))continue;
   const current=binding(node,overlay);if(!current)continue;
   const record:Binding={...current,original:node.textContent??'',pending:true,unavailable:false};records.set(node,record);void repair(record);
  }
 }
 function schedule(){scope.frame(refresh)}
 const observer=new MutationObserver(changes=>{if(changes.some(change=>change.target===document.documentElement||(change.target instanceof Element?change.target:change.target.parentElement)?.closest('#customOverlay')||[...change.addedNodes,...change.removedNodes].some(n=>n instanceof Element&&(n.id==='customOverlay'||n.querySelector('#customOverlay')))))schedule()});
 scope.own(clear);scope.own(()=>observer.disconnect());
 observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','hidden','aria-hidden','data-overlay','data-dol-midnight','data-dgu-adapter','data-dgu-adapter-match']});
 for(const event of ['dol-ui-runtime-ready','dol-ui-saves-change']){document.addEventListener(event,schedule);scope.own(()=>document.removeEventListener(event,schedule))}
 schedule();
 return{getDiagnostics:()=>({pending:[...records.values()].filter(r=>r.pending).length,repaired:[...records.values()].filter(r=>r.replacement!==undefined).length,unavailable:[...records.values()].filter(r=>r.unavailable).length}),destroy:()=>scope.dispose()};
}

import type {VersionToolsHost} from '../../src/runtime/target-version';

type Variables = Record<string, unknown> & {lastWardrobeSlot?: string; worn?: Record<string, unknown>; wornStacking?: Record<string, unknown>; wardrobeDefaults?: unknown};
type Host = Window & {
 modUtils?: VersionToolsHost & {getMod(name: string): {version?: unknown} | undefined; getPassageData?(name: string): {content?: string} | undefined};
 SugarCube?: {State?: {variables?: Variables}; Wikifier?: new (output: HTMLElement, source: string) => unknown};
 Wikifier?: new (output: HTMLElement, source: string) => unknown;
 selectWardrobe?: () => unknown;
 DolOptimization?: {data?: {WornStacking?: unknown}; wornStackingRemove?: unknown; wornStackingMove?: unknown};
 DoLGameUI?: {ui?: {getCapabilities?(): {enabled?: boolean}}};
 DoLWardrobeUI?: {getEnabled(): boolean; isBusy(): boolean; refresh(): void};
};

/** Render the installed Mod's own management links, not a copy of its equipment rules. */
function stackingSource(text: string): string | null {
 const start='<<set $wornStacking ??= {}>>', end='<<if $worn[_wardrobe_list].name isnot "naked">>';
 const matches: string[]=[];
 for(let at=text.indexOf(start);at!==-1;at=text.indexOf(start,at+start.length)){
  const stop=text.indexOf(end,at);if(stop===-1)continue;
  const source=text.slice(at,stop);
  if(source.includes('<<widget ')||!source.includes('叠加装备:')||!source.includes('DolOptimization.wornStackingRemove(')||!source.includes('DolOptimization.wornStackingMove('))continue;
  matches.push(source);
 }
 return matches.length===1?matches[0]:null;
}

function createOptimizationWardrobe(root: Host){
 const scope=visualScope();let section: HTMLElement | undefined, reason='wardrobe-unavailable';
 let binding: {passage: Element; variables: Variables; inventory: unknown; slot: string; key: string; template: string} | undefined;
 let focusIndex: number | undefined;
 const observer=new MutationObserver(schedule);scope.own(()=>observer.disconnect());
 function observe(){if(scope.active())observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['inert','data-dol-midnight']})}
 function clear(){section?.remove();section=undefined;binding=undefined;focusIndex=undefined}
 function context(){
  try{
  const ui=root.DoLWardrobeUI, variables=root.SugarCube?.State?.variables, slot=variables?.lastWardrobeSlot;
  if(!root.DoLGameUI?.ui?.getCapabilities?.().enabled||!ui?.getEnabled()||ui.isBusy())return null;
  if(!targetSupported(root))return null;
  const mod=root.DolOptimization;
  if(typeof mod?.data?.WornStacking!=='boolean'||typeof mod.wornStackingRemove!=='function'||typeof mod.wornStackingMove!=='function'||typeof root.selectWardrobe!=='function')return null;
  if(!variables||!slot||!/^[a-z_]+$/.test(slot)||!variables.worn?.[slot])return null;
  const passages=document.querySelectorAll('#passages .passage:not(.passage-out)');if(passages.length!==1)return null;
  const passage=passages[0], equipment=passage.querySelector<HTMLElement>('.dgw-shell .dgw-equipment');
  if(!equipment||equipment.inert||passage.querySelectorAll('.dgw-equipment').length!==1)return null;
  const key=JSON.stringify([slot,variables.worn[slot],variables.wornStacking?.[slot],variables.wardrobeDefaults,mod.data.WornStacking]);
  return {passage,equipment,variables,inventory:root.selectWardrobe(),slot,key};
  }catch{return null}
 }
 function refresh(){
  observer.disconnect();
  try{
   const current=context();
   if(!current){reason='wardrobe-unavailable';clear();return}
   const template=root.modUtils?.getPassageData?.('Widgets Wardrobe')?.content??'';
   if(binding&&section?.isConnected&&binding.passage===current.passage&&binding.variables===current.variables&&binding.inventory===current.inventory&&binding.key===current.key&&binding.template===template)return;
   const source=stackingSource(template);
   const W=root.SugarCube?.Wikifier??root.Wikifier;
   if(!source||!W){reason='native-stacking-template-unavailable';clear();return}
   const next=document.createElement('section');next.className='dgu-optimization-stacking';next.setAttribute('aria-label','原版优化叠穿管理');
   // Capture the same slot/inventory context as the native wardrobe links.
   new W(next,`<<capture _wardrobe_list _selectedWardrobe _allowStacking _i _item _itemData _name _keys _broken _j _n _trait>><<set _wardrobe_list=${JSON.stringify(current.slot)}>><<set _selectedWardrobe=selectWardrobe()>>${source}<</capture>>`);
   if(next.querySelector('.error')){reason='native-stacking-template-error';clear();return}
   const rendered=context();
   if(!rendered||rendered.variables!==current.variables||rendered.passage!==current.passage||rendered.slot!==current.slot||rendered.inventory!==current.inventory){reason='wardrobe-context-changed';clear();return}
   next.addEventListener('click',event=>{
    const link=event.target instanceof Element?event.target.closest('a,button,input'):null;if(!link)return;
    const fresh=context();
    let templateCurrent=false;try{templateCurrent=!!binding&&root.modUtils?.getPassageData?.('Widgets Wardrobe')?.content===binding.template}catch{}
    if(!fresh||!binding||!templateCurrent||fresh.passage!==binding.passage||fresh.variables!==binding.variables||fresh.inventory!==binding.inventory||fresh.key!==binding.key){event.preventDefault();event.stopImmediatePropagation();schedule();return}
    focusIndex=[...next.querySelectorAll('a,button,input')].indexOf(link);
    // Let the original handler run once; refresh only its presentation afterwards.
    scope.frame(()=>{if(!scope.active()||!next.isConnected)return;root.DoLWardrobeUI?.refresh();schedule()});
   },true);
   const focused=section?.contains(document.activeElement);
   section?.remove();section=next;binding={...rendered,template};current.equipment.after(next);reason='active';
   if(focused&&focusIndex!==undefined){const links=next.querySelectorAll<HTMLElement>('a,button,input');links[Math.min(focusIndex,links.length-1)]?.focus()}
   focusIndex=undefined;
  }catch{reason='native-stacking-unavailable';clear()}
  finally{observe()}
 }
 function schedule(){scope.frame(refresh)}
 document.addEventListener('dol-ui-runtime-ready',schedule);document.addEventListener('dol-ui-wardrobe-change',schedule);
 observe();schedule();
 return {getDiagnostics:()=>Object.freeze({status:reason==='active'?'active':'inactive',reason}),destroy(){scope.dispose();document.removeEventListener('dol-ui-runtime-ready',schedule);document.removeEventListener('dol-ui-wardrobe-change',schedule);clear()}};
}

function targetSupported(root: Host){
 const version=root.modUtils?.getMod('原版优化')?.version;
 if(typeof version!=='string'||!/^\d+(?:\.\d+){1,3}(?:-[\w.-]+)?(?:\+[\w.-]+)?$/.test(version))return false;
 try{const tools=root.modUtils?.getSemVerTools?.();return !!tools&&tools.satisfies(tools.parseVersion(version).version,tools.parseRange('>=1.1.1.2'))}catch{return false}
}
