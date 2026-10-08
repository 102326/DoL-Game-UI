import type {Group} from './types';

const titles:Record<string,string>={leftaction:'左手',rightaction:'右手',feetaction:'双脚',mouthaction:'口部',penisaction:'其他行动 · 1',vaginaaction:'私处',anusaction:'臀部',chestaction:'上身',thighaction:'腿部'};
type Control=HTMLInputElement|HTMLSelectElement;
export const visible=(el:HTMLElement)=>el.isConnected&&!el.closest('[hidden],[aria-hidden="true"]')&&!!el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
const usable=(el:HTMLElement)=>visible(el)&&!el.matches(':disabled')&&!el.closest('[aria-disabled="true"]');

/** Original controls own selection and execution. This source only reads and validates. */
export function createCombatSource(lists:HTMLElement[],current:()=>boolean){
 const groups=new Map<string,HTMLElement>();
 const controls=new WeakMap<Control,{parent:HTMLElement|null;name:string;value:string}>();
 let disposed=false,continuing=false;
 function read(){
  groups.clear();const projection:Group[]=[];let unknown=0;
  if(disposed||!current())return {groups:projection,unknown};
  lists.forEach((list,region)=>[...list.children].forEach((child,index)=>{
   if(!(child instanceof HTMLElement)||!visible(child))return;
   const native=[...child.querySelectorAll<Control>('input[type=radio],select')].filter(visible);
   if(!native.length&&!Object.hasOwn(titles,child.id)){unknown++;return}
   const actionKey=child.dataset.dcuActionKey||child.id;
   const known=Object.hasOwn(titles,actionKey),key=region+':'+(child.id||'group-'+index);
   groups.set(key,child);
   for(const control of native)controls.set(control,{parent:control.parentElement,name:control.name,value:control instanceof HTMLInputElement?control.value:''});
   const selections=native.flatMap(control=>control instanceof HTMLSelectElement?[...control.selectedOptions].map(o=>o.textContent?.trim()||''):control.checked?[(control.labels?.[0]?.textContent||control.getAttribute('aria-label')||control.value).replace(/\s+/g,' ').trim()]:[]);
   const count=native.reduce((n,c)=>n+(c instanceof HTMLSelectElement?c.options.length:1),0);
   const available=native.reduce((n,c)=>n+(usable(c)?c instanceof HTMLSelectElement?[...c.options].filter(o=>!o.disabled&&!o.parentElement?.matches('optgroup:disabled')).length:1:0),0);
   projection.push({key,title:known?titles[actionKey]:'附加原生选项 '+(projection.length+1),selected:[...new Set(selections)].join(' · '),count,available,known});
  }));
  return {groups:projection,unknown};
 }
 function group(key:string){const el=groups.get(key);return !disposed&&current()&&el&&lists.some(list=>list.contains(el))&&visible(el)?el:undefined}
 function focusTarget(key:string){return [...group(key)?.querySelectorAll<HTMLElement>('input,select,button,a')??[]].find(usable)}
 function validate(target:Element){
  if(disposed||!current())return false;
  const input=target instanceof HTMLInputElement&&target.type==='radio'||target instanceof HTMLSelectElement?target:target.closest('label')?.querySelector<Control>('input[type=radio],select');
  if(!input||!lists.some(list=>list.contains(input)))return true;
  const binding=controls.get(input);
  return !!binding&&input.parentElement===binding.parent&&input.name===binding.name&&(input instanceof HTMLSelectElement||input.value===binding.value)&&usable(input);
 }
 function beginContinue(target:HTMLElement){
  if(disposed||!current()||continuing||!usable(target))return false;
  // Only block synchronous reentry. Later native turns and repeated selections stay legal.
  continuing=true;queueMicrotask(()=>{continuing=false});return true;
 }
 return {read,group,focusTarget,validate,beginContinue,destroy(){disposed=true;groups.clear()}};
}
