import {visualScope} from '../../src/ui/visual-scope';
import type {UiApi, StyleAdapter, AdapterHandle, AdapterDiagnostics} from '../../src/public/ui';


declare const window: Window & {
 DoLGameUI?: {ui?: Partial<UiApi>; getPreferences?: () => {savesEnabled?: unknown}};
 DolOptimizationSoftWet?: Readonly<{getDiagnostics(): AdapterDiagnostics | Readonly<{status: 'inactive'; reason: string}>; getWardrobeDiagnostics(): Readonly<{status: string; reason: string}>; destroy(): void}>;
};

(function () {
 "use strict";
 if (window.DolOptimizationSoftWet) return;
 const wardrobe=createOptimizationWardrobe(window);
 const spec: StyleAdapter = {
  id: "DolOptimizationSoftWet", version: "1.0.1",
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
  destroy() {wardrobe.destroy();document.removeEventListener("dol-ui-runtime-ready", attach); handle?.destroy(); handle = null; owner = null; delete window.DolOptimizationSoftWet}
 });
 attach();
})();

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
