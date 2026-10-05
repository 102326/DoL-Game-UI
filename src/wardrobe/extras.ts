import type {WardrobeDataHost,Inventory} from './host';
import type {Snapshot} from './data';
import {descriptor} from './data';
/** Small native widgets keep their rule handlers; the inventory remains Vue-owned. */
export function createWardrobeExtras(root:WardrobeDataHost){
 const signatures=new WeakMap<HTMLElement,string>();
 function write(container:HTMLElement,source:string){
  const W=root.SugarCube?.Wikifier??root.Wikifier;
  if(!W)return;
  const next=document.createElement('div');new W(next,source);
  if(next.querySelector('.error'))throw Error('衣柜细节接口渲染失败');
  container.replaceChildren(...next.childNodes);
 }
 function render(s:Snapshot,slot:string,equipment:HTMLElement,services:HTMLElement,refresh:()=>void){
  const v=s.variables,w=s.worn,item=w[slot],d=item&&descriptor(s,slot,item);
  const key=JSON.stringify([slot,w,v.upperTucked,v.lowerTucked,v.bellyTucked,v.facelayer,v.wardrobeDefaults]);
  if(signatures.get(equipment)!==key){
   const macros:string[]=[];
   if(item&&item.name!=='naked'&&d){
    const value=JSON.stringify(slot);
    macros.push(`<details class="dgw-item-details"${v.wardrobeDefaults?.extraInfo?' open':''}><summary>衣物详情与特质</summary><<set _temp_choice=$worn[${value}]>><<shoptraits>></details>`);
    if(typeof root.isConnectedToHood==='function'&&root.isConnectedToHood(slot))macros.push('<<toggleHoodLink>>');
    if(slot==='upper'&&w.lower?.name!=='naked'&&!d.notuck&&w.upper.outfitPrimary===undefined)macros.push('<<toggleUpperTuck>>');
    if(slot==='lower'&&w.feet?.name!=='naked'&&!d.notuck&&!descriptor(s,'feet',w.feet)?.notuck)macros.push('<<toggleLowerTuck>>');
    if(slot==='lower'&&v.player?.bodyshape==='soft'&&(!d.outfitSecondary||d.outfitSecondary[1]!==w.upper?.name))macros.push('<<toggleBellyTuck>>');
    if(slot==='upper'&&d.altsleeve)macros.push('<div class="toggleAltSleeve"><<toggleAltSleeve>></div>');
    macros.push(`<div class="toggleAltLink"><<toggleAltLink ${value} "wardrobe">></div>`);
    // Unique selector: do not let the hidden native list steal this widget's refresh.
    if(slot==='neck'){
     const collars=['collar','free use collar','leather collar','spiked collar'];
     if(collars.includes(item.name))macros.push('<<link "系上牵引绳">><<attach_leash true true>><<updatesidebarimg>><</link>>');
     else if(collars.map(n=>n+' with leash').includes(item.name))macros.push('<<link "解下牵引绳">><<detach_leash true true>><<updatesidebarimg>><</link>>');
    }
    if(slot==='face')macros.push('<div class="toggleAltLink"><<toggleFaceLayer "wardrobe">></div>');
   }
   write(equipment,macros.join(' '));
   if(d){const description=document.createElement('p');description.className='dgw-muted';description.textContent=d.cn_description??d.description??'';equipment.prepend(description)}
   equipment.onclick=()=>requestAnimationFrame(refresh);
   signatures.set(equipment,key);
  }
  const serviceKey=JSON.stringify([v.location,v.tailorMonthlyService,v.debug,v.settings?.multipleWardrobes,v.wardrobeDefaults,Object.entries(v.wardrobes??{}).map(([key,x]:[string,Inventory])=>[key,x.unlocked,x.name]),s.location]);
  if(signatures.get(services)!==serviceKey){
   const source=['<details class="dgw-preferences"><summary>衣柜显示设置</summary><label><<checkbox "$wardrobeDefaults.showTraits" false true autocheck>> 显示衣物特质</label><label><<checkbox "$wardrobeDefaults.extraInfo" false true autocheck>> 默认展开已穿戴衣物详情</label></details>'];
   if(['home','town'].includes(v.location)&&['repair','discard'].includes(v.tailorMonthlyService as string)){
    const repair=v.tailorMonthlyService==='repair',passage=repair?'Wardrobe Repair Crate':'Wardrobe Sale Crate';
    source.push(`<section class="dgw-tailor"><h3>${repair?'裁缝修理箱':'裁缝出售箱'}</h3>`);
    const options=repair?[['damaged','寄送受损衣物'],['outfits','寄送套装'],['all','寄送所有衣物']]:[['outfits','寄售套装'],['all','寄售所有衣物']];
    for(const [value,label]of options)source.push(`<<link ${JSON.stringify(label)} ${JSON.stringify(passage)}>><<set $wardrobeReturnLink=$passage>><<set $crateContents=${JSON.stringify(value)}>><</link>>`);
    source.push('<<link "取消委托" $passage>><<set $tailorMonthlyService=1>><</link>></section>');
   }
   // The original debug wardrobe chooser is intentionally restricted to debug games.
   if(v.debug&&v.settings?.multipleWardrobes){
    source.push('<details><summary>调试：选择衣柜</summary>');
    for(const [target,meta]of Object.entries(v.wardrobes??{}) as [string,Inventory][]){if(meta.unlocked===undefined)continue;source.push(`<<link ${JSON.stringify(String(meta.name??target))} $passage>><<set $forceWardrobeLocation=${JSON.stringify(target)}>><</link>>`)}
    source.push('</details>');
   }
   write(services,source.join(' '));services.onchange=()=>requestAnimationFrame(refresh);signatures.set(services,serviceKey);
  }
 }
 return {render};
}
