import type {WardrobePerformance} from './performance';
/** Game rules and side effects remain owned by the native wardrobe. */
export function createNativeWardrobe(root:any,timing:WardrobePerformance){
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
  const targetCode=mode==='transfer'?`<<set _wardrobeTransfer=${JSON.stringify(target||'').replace(/</g,'\\u003c').replace(/>/g,'\\u003e')}>>`:'';
  return execute(`${targetCode}<<set $wardrobeOption="${mode}">><<set $wear_${slot}=${JSON.stringify(index)}>><<updatewardrobe undefined "wear_${slot}">>`,mode==='delete'?'native.discard':mode==='separateOutfits'?'native.split':mode==='repair'?'native.repair':mode==='transfer'?'native.transfer':index==='strip'?'native.strip':'native.wear');
 }
 return {available:()=>!!wikifier(),action,
  setSlot(slot:string){return execute(`<<set $lastWardrobeSlot=${JSON.stringify(slot)}>>`,'native.category')},
  refreshList(){return execute('<<replace "#wardrobeList">><<wardrobeContents>><</replace>>','native.list')},
  message(container:HTMLElement){return container.querySelector('#wardrobewear')?.textContent?.trim()||''},
  resetMode(variables:any){variables.wardrobeOption='wear'}
 };
}
