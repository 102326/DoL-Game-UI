export interface ShopProjection {key:string;title:string;price:string;owned:string}
export interface ShopFacts {variables:Record<string,unknown>|undefined;definition:unknown}

const purchaseSelector='.buy-buttons a.link-internal,.buy-buttons button.link-internal,.try-buttons a.link-internal,.try-buttons button.link-internal';
const text=(node:Element|null)=>node?.textContent?.replace(/^\s*\([^)]*\)\s*/,'').trim()??'';

/** Native controls remain the executors; only display values leave this page source. */
export function createShopSource(shop:HTMLElement,current:()=>boolean,facts:()=>ShopFacts){
 let disposed=false,sequence=0;
 const keys=new WeakMap<Element,string>();
 let selected:Element|null=null,bound:Element[]=[];
 let selectedDisplay='';
 const bindings=new WeakMap<Element,{quote:string;variables:ShopFacts['variables'];definition:unknown}>();
 const consumed=new WeakSet<Element>();
 function key(node:Element){let id=keys.get(node);if(!id){id=`shop:${++sequence}`;keys.set(node,id)}return id}
 function displayIdentity(item:Element){return JSON.stringify([text(item.querySelector('.clothing-name a')), [...item.querySelectorAll('.clothing-icon img.icon')].map(n=>n.getAttribute('ml-src')??n.getAttribute('src'))])}
 function context(){
  const lists=shop.querySelectorAll<HTMLElement>('#clothes-list');
  const list=lists.length===1?lists[0]:null;
  const panels=list?.querySelectorAll<HTMLElement>('.clothing-details');
  return {list,details:panels?.length===1?panels[0]:null};
 }
 function fingerprint(){
  const {details}=context(),v=facts().variables;
  return JSON.stringify({
   selection:v&&['location','clothingShopSlot','clothes_choice','colouraction','accessorycolouraction','patternaction','buyMultiple','money'].map(k=>v[k]),
   returnTo:(v?.wardrobes as {shopReturn?:unknown}|undefined)?.shopReturn,
   definition:facts().definition,
   controls:details&&[...details.querySelectorAll(purchaseSelector)].map(n=>[text(n),n.getAttribute('class'),n.getAttribute('aria-disabled'),n.closest('.disabled')!==null]),
   price:details&&[...details.querySelectorAll('.buy-buttons .gold')].map(n=>text(n)),
   inputs:details&&[...details.querySelectorAll<HTMLInputElement>('input,select')].map(n=>[n.id,n.value,n.disabled])
  });
 }
 function read(){
  if(disposed||!current())return null;
  const native=context();
  bound=native.details?[...native.details.querySelectorAll(purchaseSelector)]:[];
  const f=facts(),quote=fingerprint();
  for(const control of bound)if(!bindings.has(control))bindings.set(control,{quote,variables:f.variables,definition:f.definition});
  if(selected&&!selected.isConnected){
   // Native selection can rebuild the catalog. Reassociate only an unambiguous display;
   // this highlight is never used to identify a purchase or dispatch business.
   const matches=[...shop.querySelectorAll('.clothing-item')].filter(n=>displayIdentity(n)===selectedDisplay);
   selected=matches.length===1?matches[0].querySelector('.clothing-name a'):null;
  }
  const items=[...shop.querySelectorAll<HTMLElement>('.clothing-item')].flatMap(item=>{
   const links=item.querySelectorAll('a.link-internal');
   if(links.length!==1)return [];
   return [Object.freeze({key:key(links[0]),title:text(links[0]),price:text(item.querySelector('.clothing-price')),owned:text(item.querySelector('.clothing-name'))})];
  });
  const selectedKey=selected?.isConnected&&shop.contains(selected)?key(selected):'';
  const body=native.details?.querySelector('.dgshop-detail-body')??native.details;
  const footer=native.details?.querySelector('.dgshop-purchase');
  const hasDetails=[body,footer].some(node=>!!node&&(!!node.textContent?.trim()||!!node.querySelector('input,select,button,a,img,canvas')));
  return {...native,items,selected:items.find(item=>item.key===selectedKey)??null,hasDetails};
 }
 function select(item:HTMLElement){const links=item.querySelectorAll('a.link-internal');selected=links.length===1?links[0]:null;selectedDisplay=displayIdentity(item)}
 function selectedItem(item:HTMLElement){return selected!==null&&item.contains(selected)}
 function guard(target:Element):'native'|'valid'|'stale'{
  const control=target.closest(purchaseSelector);
  if(!control||!shop.contains(control))return 'native';
  const f=facts(),binding=bindings.get(control);
  if(disposed||!current()||consumed.has(control)||!bound.includes(control)||!binding||f.variables!==binding.variables||f.definition!==binding.definition||fingerprint()!==binding.quote)return 'stale';
  // Claim only this dispatch. A native replacement supplies a fresh control/quote.
  for(const node of bound)consumed.add(node);
  return 'valid';
 }
 return {context,read,select,selectedItem,guard,clearSelection(){selected=null},destroy(){disposed=true;selected=null;bound=[]}};
}
