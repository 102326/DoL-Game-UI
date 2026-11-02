import {createApp,reactive,type App} from 'vue';
import {hubPreview} from '../evolution-integration/hub-preview';
import {startShop} from '../../src/shop/main';
import {startSaves} from '../../src/saves/main';
import {startCombat} from '../../src/combat/main';
import WardrobePanel from '../../src/wardrobe/WardrobePanel.vue';
import {referenceItem} from '../../src/wardrobe/reference';
import type {WardrobeModel} from '../../src/wardrobe/types';
import './panels.css';

export const independentCases={saves:'存档与详情',shop:'商店与筛选',wardrobe:'衣柜与参考',combat:'战斗与原生选项'} as const;
export type IndependentPanel=keyof typeof independentCases;
/** Real controllers/components, synthetic content only. No game, storage payload or native game macro. */
export function createIndependentPreview(){
 const owner=hubPreview.host.register('UI41IndependentPreview'),framework={host:hubPreview.host,owner};
 const passageRoot=document.getElementById('passages')!,original=[...passageRoot.childNodes],notice=document.getElementById('notice')!;
 const originals=new Map(['SugarCube','setup','DoLSavesUI','DoLShopUI','DoLCombatUI'].map(key=>[key,Object.getOwnPropertyDescriptor(window,key)]));
 let current:IndependentPanel|undefined,root:HTMLElement|undefined,overlay:HTMLElement|undefined,app:App|undefined,stop:(()=>void)|undefined,calls=0,disposed=false;
 const act=()=>{notice.textContent=`隔离演示操作：${++calls} 次；未执行真实业务。`};
 function close(){stop?.();stop=undefined;app?.unmount();app=undefined;overlay?.remove();overlay=undefined;root?.remove();root=undefined;passageRoot.replaceChildren(...original);current=undefined;for(const[key,value]of originals){if(value)Object.defineProperty(window,key,value);else Reflect.deleteProperty(window,key)}}
 function open(kind:IndependentPanel){
  if(disposed)return;close();current=kind;passageRoot.replaceChildren();root=document.createElement('section');root.className='passage';root.dataset.passage=kind==='shop'?'Clothing Shop':kind;root.dataset.independentPreview=kind;passageRoot.append(root);
  Object.assign(window,{SugarCube:{State:{passage:root.dataset.passage,variables:{clothingShopSlot:'upper',clothes_choice:0,money:100}}},setup:{clothes:{upper:[{}]}}});
  if(kind==='saves'){
   overlay=document.createElement('section');overlay.id='customOverlay';overlay.dataset.overlay='saves';overlay.dataset.ui41Preview='';overlay.innerHTML='<div id="customOverlayTitle"><div id="overlayTabs"><button class="link-internal macro-button tab-selected">存档</button><button class="link-internal macro-button">导出/载入</button></div></div><div id="customOverlayContent"><div id="saveList"><div id="saves-list-container">'+Array.from({length:8},(_,i)=>`<div class="savesListRow"><div class="saveGroup"><span class="saveId">${i+1}</span><span class="saveName">示例记录 ${i+1}</span><span class="saveButton"><button>保存</button></span><button>载入</button><span class="deleteButton"><button>删除</button></span></div><div class="saveDetails"><span>合成记录，不包含存档内容</span><span class="datestamp">2026-10-28</span></div></div>`).join('')+'</div></div></div>';
   document.body.append(overlay);for(const button of overlay.querySelectorAll<HTMLButtonElement>('#saveList button'))button.onclick=act;
   const controls=startSaves(window,framework);Object.assign(window,{DoLSavesUI:controls});stop=controls.destroy;
  }else if(kind==='shop'){
   root.innerHTML='<div id="clothingShop-div"><div id="clothes-list"><div id="shopCategories"><button class="category-tab active">上装</button><button class="category-tab">下装</button></div><div class="optionsBar"><label>排序 <select aria-label="商品排序"><option>名称</option><option>价格</option><option disabled>不可用</option></select></label></div>'+Array.from({length:10},(_,i)=>`<div class="clothing-item"><span class="clothing-name"><a class="link-internal">示例衣物 ${i+1}</a></span><span class="clothing-price">£${15+i}</span></div>`).join('')+'<div class="clothing-details"><h3>商品详情</h3><p>合成内容用于观察材质、长文本、筛选与窄屏详情。</p><div class="buy-buttons"><button class="buy-button"><span class="buy-button-inner">演示购买</span></button><span class="gold">£15</span></div></div></div></div>';
   for(const n of root.querySelectorAll<HTMLElement>('button,a'))n.onclick=act;
   const controls=startShop(window,framework);Object.assign(window,{DoLShopUI:controls});stop=controls.destroy;
  }else if(kind==='combat'){
   root.innerHTML='<div id="listContainer">'+['leftaction','rightaction','mouthaction'].map((id,i)=>`<div id="${id}"><label><input type="radio" name="${id}" value="rest" checked>休息</label><label><input type="radio" name="${id}" value="guard">防御</label><label>目标 <select id="${i===2?'listbox-askaction':id+'-target'}" aria-label="${id}目标"><option>当前目标</option><option>另一个目标</option><option disabled>不可用目标</option></select></label></div>`).join('')+'<div id="third-party"><button>保留扩展操作</button></div></div><div id="next"><a href="#">继续回合（演示）</a></div>';
   root.addEventListener('change',act);root.querySelector<HTMLElement>('#next a')!.onclick=event=>{event.preventDefault();act()};startCombat(framework);const controls=Reflect.get(window,'DoLCombatUI') as {destroy():void};stop=controls.destroy;
  }else{
   root.classList.add('dgw-root');const mount=document.createElement('div');root.append(mount);
   const items=Array.from({length:16},(_,i)=>({key:'upper:'+i,name:'示例衣物 '+(i+1),colour:i%2?'灰色':'蓝色',warmth:6,durability:100,lewd:20,outfit:'单件',detail:'只读示例说明',icons:[],traits:[],splittable:false}));
   const model=reactive<WardrobeModel>({items,slots:[{key:'upper',label:'上装',count:16,capacity:100},{key:'lower',label:'下装',count:16,capacity:100}],slot:'upper',destinations:[],pending:[],pendingMode:'delete',pendingMinutes:null,owned:16,capacity:100,unknownSlots:[],categoryNote:'',nativeVisible:false,message:'',busy:false,searchAll:false,loading:false,previewStatus:'合成预览，不绘制真实角色',canWear:false,wornItem:null,wornName:'示例穿搭',currentWarmth:null,progress:'',canRepair:false});
   const binding=hubPreview.host.binding();app=createApp(WardrobePanel,{model,reference:{binding,read(key:string){const item=model.items.find(i=>i.key===key);return item?referenceItem(item,'上装'):null}},resolveIcon:async()=>'',onWear:act,onSearch:(value:boolean)=>{model.searchAll=value},onSlot:(value:string)=>{model.slot=value;act()},onNative:(value:boolean)=>{model.nativeVisible=value},onStrip:act,onReview:act,onConfirm:act,onCancel:()=>{},onSplit:act,onRepair:act,onTransfer:act,onTowel:act});app.mount(mount);
  }
 }
 return{open,close,current:()=>current,counts:()=>calls,restore(){if(current)open(current)},dispose(){if(disposed)return;close();disposed=true;owner.dispose()}};
}
