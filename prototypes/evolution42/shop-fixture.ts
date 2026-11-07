import {visualScope} from '../../src/ui/visual-scope';
/** Enrich only the isolated synthetic page; the real shop controller still owns all nodes and actions. */
export function shopFixture(back:()=>void){
 const scope=visualScope(),page=document.querySelector<HTMLElement>('[data-independent-preview=shop]')!,shop=page.querySelector<HTMLElement>('#clothingShop-div')!,details=shop.querySelector<HTMLElement>('.clothing-details')!,title=details.querySelector<HTMLElement>('h3')!,description=details.querySelector<HTMLElement>('p')!;
 const body=details.querySelector('.dgshop-detail-body')??details,buy=details.querySelector<HTMLButtonElement>('.buy-button')!,links=[...shop.querySelectorAll<HTMLAnchorElement>('.clothing-name a')];
 let selection=0,purchase=0;
 const runtime={SugarCube:Reflect.get(window,'SugarCube') as {State:{variables:Record<string,unknown>}},setup:Reflect.get(window,'setup') as {clothes:{upper:{name:string}[]}}};
 if(!runtime.SugarCube?.State?.variables||!runtime.setup?.clothes)throw Error('Missing isolated shop fixture runtime');
 runtime.setup.clothes.upper=links.map(n=>({name:n.textContent?.trim()??''}));
 // The real list contract has a #shop-list-pages carrier; the old generic preview omitted it.
 const pages=document.createElement('div');pages.id='shop-list-pages';for(const link of links){const item=link.closest('.clothing-item');if(item)pages.append(item)}shop.querySelector('#clothes-list')!.append(pages);
 const banner=document.createElement('button');banner.className='e42-shop-back';banner.textContent='返回研究页';banner.onclick=back;page.prepend(banner);scope.own(()=>banner.remove());
 const fields=document.createElement('div');fields.className='e42-shop-fields clothing-colours-div';fields.innerHTML='<label>示例配色 <select aria-label="示例配色"><option value="blue">雾蓝</option><option value="grey">烟灰</option></select></label><p>这些是合成选项，用于检查真实控件与详情布局。</p>';body.append(fields);scope.own(()=>fields.remove());
 for(const [i,link]of links.entries()){
  const select=()=>{selection++;runtime.SugarCube.State.variables.clothes_choice=i;title.textContent=`商品详情 · ${link.textContent}`;description.textContent='烟色层次、暖冷边缘与正文承载应当共同变化。'+ '这段较长的合成商品说明用于检查窄屏换行、抽屉滚动及购买区的可达性。'.repeat(8)};
  link.addEventListener('click',select);scope.own(()=>link.removeEventListener('click',select));
 }
 const purchaseOnce=()=>{purchase++};buy.addEventListener('click',purchaseOnce);scope.own(()=>buy.removeEventListener('click',purchaseOnce));
 const originals=[buy,title,description,...links];
 return{snapshot:()=>({selection,purchase,money:runtime.SugarCube.State.variables.money,nodesIntact:originals.every(n=>n.isConnected&&shop.contains(n))}),dispose:scope.dispose};
}
