import type {NativeWidgetHost,WardrobeVariables} from './host';
import type {WardrobePerformance} from './performance';
/** Game rules and side effects remain owned by the native wardrobe. */
export function createNativeWardrobe(root:NativeWidgetHost,timing:WardrobePerformance){
 const wikifier=()=>root.SugarCube?.Wikifier??root.Wikifier;
 function execute(source:string,phase:string){
  const W=wikifier();if(!W)throw Error('衣柜处理接口尚不可用');
  const output=document.createElement('div');
  timing.measure(phase,()=>new W(output,source));return output;
 }
 function action(mode:'wear'|'delete'|'separateOutfits'|'repair'|'transfer',slot:string,index:number|'strip'|'towel'|'large_towel',target?:string){
  if(!/^[a-z_]+$/.test(slot)||!(index==='strip'||index==='towel'||index==='large_towel'||Number.isSafeInteger(index)&&index>=0))throw Error('衣柜操作参数无效');
  if(typeof index==='string'&&mode!=='wear')throw Error('衣柜操作参数无效');
  if(index==='large_towel'&&slot!=='upper'||index==='towel'&&!['upper','lower'].includes(slot))throw Error('毛巾不适用于该部位');
  if(mode==='transfer'&&(!target||typeof target!=='string'))throw Error('目标衣柜无效');
  if(mode==='wear'){
   // Use the source widget as well as its update macro: Mods can patch the link's selection semantics.
   const output=execute(`<<set $wardrobeOption="wear">><<capture _wardrobe_list _selectedWardrobe _wear>><<set _wardrobe_list=${JSON.stringify(slot)}>><<set _selectedWardrobe=selectWardrobe()>><<set _wear="wear_${slot}">><<wearlink_norefresh "Soft & Wet" ${JSON.stringify(index)}>><</capture>>`,index==='strip'?'native.strip':'native.wear');
   const links=output.querySelectorAll<HTMLAnchorElement>('a.link-internal');
   if(output.querySelector('.error')||links.length!==1)throw Error('原版衣柜操作入口结构未知，请使用原版衣柜');
   links[0].click();return output;
  }
  const targetCode=mode==='transfer'?`<<set _wardrobeTransfer=${JSON.stringify(target||'').replace(/</g,'\\u003c').replace(/>/g,'\\u003e')}>>`:'';
  return execute(`${targetCode}<<set $wardrobeOption="${mode}">><<set $wear_${slot}=${JSON.stringify(index)}>><<updatewardrobe undefined "wear_${slot}">>`,mode==='delete'?'native.discard':mode==='separateOutfits'?'native.split':mode==='repair'?'native.repair':mode==='transfer'?'native.transfer':index==='strip'?'native.strip':'native.wear');
 }
 return {available:()=>!!wikifier(),action,
  setSlot(slot:string){return execute(`<<set $lastWardrobeSlot=${JSON.stringify(slot)}>>`,'native.category')},
  refreshList(){return execute('<<replace "#wardrobeList">><<wardrobeContents>><</replace>>','native.list')},
  message(container:HTMLElement){return container.querySelector('#wardrobewear')?.textContent?.trim()||''},
  resetMode(variables:WardrobeVariables,expectedMode:string,currentVariables:WardrobeVariables|undefined){
   if(variables===currentVariables&&variables.wardrobeOption===expectedMode)variables.wardrobeOption='wear';
  }
 };
}
