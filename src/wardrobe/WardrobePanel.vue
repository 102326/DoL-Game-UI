<script setup lang="ts">
import {computed,ref,watch,nextTick,onMounted,onBeforeUnmount} from 'vue';
import type {WardrobeModel} from './types';
import ClothingIcon from './ClothingIcon.vue';
import ClothingTraits from './ClothingTraits.vue';
import GameButton from '../ui/GameButton.vue';
import {experiments} from '../runtime/experiments';
const props=defineProps<{model:WardrobeModel;resolveIcon:(src:string)=>Promise<string>;onSplit:(keys:string[])=>void;onSlot:(key:string)=>void;onRepair:(keys:string[])=>void;onTransfer:(keys:string[],target:string)=>void;onTowel:(kind:'towel'|'large_towel')=>void;onWear:(key:string)=>void;onNative:(open:boolean)=>void;onReview:(keys:string[])=>void;onConfirm:()=>void;onCancel:()=>void;onStrip:()=>void}>();
const view=computed(()=>props.model);
const preview=ref<HTMLElement>(),native=ref<HTMLElement>(),actions=ref<HTMLElement>(),warmth=ref<HTMLElement>(),equipment=ref<HTMLElement>(),services=ref<HTMLElement>(),confirmationTitle=ref<HTMLElement>();
const exits=ref<HTMLElement>();
const shell=ref<HTMLElement>(),previewOpen=ref(true),quickOpen=ref(true);
const complexContent=computed(()=>props.model.slots.length>11||props.model.items.length>8);
let previewResize:ResizeObserver|undefined,lastNarrow:boolean|undefined,previewFrame=0;
function resizePreview(){
 const root=shell.value?.closest<HTMLElement>('.dgw-root');if(!root)return;
 const nextNarrow=root.clientWidth<=700;
 if(nextNarrow!==lastNarrow){lastNarrow=nextNarrow;previewOpen.value=!nextNarrow;quickOpen.value=!nextNarrow}
}
function schedulePreviewResize(){cancelAnimationFrame(previewFrame);previewFrame=requestAnimationFrame(resizePreview)}
onMounted(()=>{resizePreview();const root=shell.value?.closest<HTMLElement>('.dgw-root');if(root&&typeof ResizeObserver!=='undefined'){previewResize=new ResizeObserver(schedulePreviewResize);previewResize.observe(root)}else window.addEventListener('resize',schedulePreviewResize)});
onBeforeUnmount(()=>{previewResize?.disconnect();cancelAnimationFrame(previewFrame);window.removeEventListener('resize',schedulePreviewResize)});
function capacityWarning(count:number,capacity:number|null){return capacity!==null&&capacity>=0&&(capacity===0||count>=capacity)?'full':capacity!==null&&capacity>0&&count/capacity>=.9?'near':''}
const destination=ref('');
const query=ref(''),sort=ref('name'),descending=ref(false),zoom=ref(false);
const page=ref(0),itemsList=ref<HTMLElement>();
const pageSize=40;
const manageMode=ref(false),checked=ref<string[]>([]);
const items=computed(()=>props.model.items.filter(i=>(i.name+' '+i.colour+' '+i.detail).toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())).sort((a,b)=>{
 let order=sort.value==='warmth'?(a.warmth??-1)-(b.warmth??-1):sort.value==='durability'?(a.durability??-1)-(b.durability??-1):sort.value==='lewd'?(a.lewd??-1)-(b.lewd??-1):sort.value==='colour'?a.colour.localeCompare(b.colour,'zh-CN'):sort.value==='outfit'?a.outfit.localeCompare(b.outfit,'zh-CN'):a.name.localeCompare(b.name,'zh-CN');return descending.value?-order:order;
}));
const busy=computed(()=>view.value.busy===true);
const paging=computed(()=>experiments.wardrobePaged);
const pageCount=computed(()=>paging.value?Math.max(1,Math.ceil(items.value.length/pageSize)):1);
const displayedItems=computed(()=>paging.value?items.value.slice(page.value*pageSize,(page.value+1)*pageSize):items.value);
const canSplit=computed(()=>checked.value.length>0&&checked.value.every(key=>props.model.items.find(item=>item.key===key)?.splittable));
const operationLabel=computed(()=>({delete:'丢弃',separateOutfits:'剪开',repair:'修理',transfer:'转移'}[props.model.pendingMode]));
watch(()=>props.model.destinations,targets=>{if(!targets.some(t=>t.key===destination.value))destination.value=targets[0]?.key??''},{immediate:true});
const pending=computed(()=>view.value.pending??[]);
const allVisibleSelected=computed(()=>items.value.length>0&&items.value.every(item=>checked.value.includes(item.key)));
function slot(key:string){if(busy.value)return;query.value='';checked.value=[];props.onSlot(key)}
function clampPage(){page.value=Math.min(page.value,Math.max(0,pageCount.value-1))}
async function goToPage(next:number){if(busy.value||!paging.value)return;page.value=Math.max(0,Math.min(next,pageCount.value-1));await nextTick();itemsList.value?.scrollTo({top:0})}
function toggleItem(key:string){if(busy.value)return;if(!manageMode.value){props.onWear(key);return}props.onCancel();checked.value=checked.value.includes(key)?checked.value.filter(item=>item!==key):[...checked.value,key]}
function toggleManage(){if(busy.value)return;props.onCancel();manageMode.value=!manageMode.value;if(!manageMode.value)checked.value=[]}
function selectVisible(){if(busy.value)return;props.onCancel();const visible=items.value.map(item=>item.key);checked.value=allVisibleSelected.value?checked.value.filter(key=>!visible.includes(key)):[...new Set([...checked.value,...visible])]}
function review(){if(!checked.value.length||busy.value)return;props.onReview([...checked.value])}
watch(()=>[manageMode.value,props.model.slot],([mode,slotNow],[oldMode,oldSlot])=>{if(mode!==oldMode||slotNow!==oldSlot)checked.value=[]});
watch(()=>props.model.items,()=>{checked.value=[];if(!busy.value)props.onCancel()});
watch([query,sort,descending,()=>props.model.slot],()=>{page.value=0});
watch(()=>props.model.items,clampPage);
watch(()=>props.model.items.length,clampPage);
watch(paging,enabled=>{if(!enabled)page.value=0;else clampPage()});
watch(()=>pending.value.length,async n=>{if(n){await nextTick();confirmationTitle.value?.focus()}});
function clearSelection(){props.onCancel();checked.value=[]}

defineExpose({exits,preview,native,actions,warmth,equipment,services});
</script>
<template>
 <section ref="shell" class="dgw-shell dgw-candidate" :class="{'dgw-managing':manageMode,'dgw-complex':complexContent}" aria-label="穿搭衣柜">
  <header class="dgw-header"><div><h2>衣柜</h2><p>快速穿戴：点选即换装，预览为当前实际穿搭</p></div><div class="dgw-header-actions"><div ref="exits" class="dgw-exits"></div><GameButton :disabled="busy" @click="toggleManage">{{manageMode?'退出整理':'整理模式'}}</GameButton></div></header>
  <details class="dgw-quick" :open="quickOpen" @toggle="quickOpen=($event.target as HTMLDetailsElement).open"><summary>常用操作与套装</summary><div ref="actions" class="dgw-actions"></div></details>
  <div ref="services" class="dgw-services" :inert="busy"></div>
  <section class="dgw-original-access"><GameButton class="dgw-open-original" :disabled="busy" :aria-expanded="model.nativeVisible" @click="onNative(!model.nativeVisible)">{{model.nativeVisible?'收起原版及扩展信息':'查看原版及扩展信息'}}</GameButton><p v-if="model.unknownSlots.length">未接管分类：{{model.unknownSlots.join('、')}}。请打开原版信息查看与操作。</p><div ref="native" class="dgw-native" :hidden="!model.nativeVisible" :aria-hidden="!model.nativeVisible"></div></section>
  <nav class="dgw-slots" aria-label="服装分类"><GameButton v-for="s in model.slots" :key="s.key" :disabled="busy" :aria-pressed="s.key===model.slot" @click="slot(s.key)">{{s.label}} <span v-if="capacityWarning(s.count,s.capacity)" class="dgw-capacity-alert" :class="capacityWarning(s.count,s.capacity)" :aria-label="capacityWarning(s.count,s.capacity)==='full'?'容量已满':'容量即将用尽'" :title="`${s.count} / ${s.capacity}`">!</span></GameButton></nav>
  <div class="dgw-mobile-category"><select class="dgw-slot-select" aria-label="服装分类" :value="model.slot" :disabled="busy" @change="slot(($event.target as HTMLSelectElement).value)"><option v-for="s in model.slots" :key="s.key" :value="s.key">{{s.label}}{{capacityWarning(s.count,s.capacity)?' · 容量提醒':''}}</option></select></div>
  <p v-if="model.categoryNote" class="dgw-category-note">{{model.categoryNote}}</p>
  <div class="dgw-workspace">
   <div class="dgw-inventory">
    <div class="dgw-tools"><input v-model="query" :disabled="busy" type="search" aria-label="搜索当前分类" placeholder="搜索当前分类的全部衣物…"><select v-model="sort" :disabled="busy" aria-label="衣物排序"><option value="name">名称</option><option value="warmth">保暖</option><option value="durability">耐久</option><option value="colour">颜色</option><option value="lewd">暴露度</option><option value="outfit">套装</option></select><GameButton :disabled="busy" :aria-label="descending?'切换升序':'切换降序'" @click="descending=!descending">{{descending?'↓':'↑'}}</GameButton></div>
    <div v-if="model.wornItem" class="dgw-equipped"><ClothingIcon :layers="model.wornItem.icons" :resolve="resolveIcon"/><span><strong>{{model.wornItem.name}}</strong><small>{{model.wornItem.colour || '原色'}} · 耐久 {{model.wornItem.durability ?? '—'}}% · 暴露 {{model.wornItem.lewd ?? '—'}}</small></span><span class="dgw-equipped-badge">已穿戴</span></div>
    <GameButton class="dgw-strip" :disabled="busy||manageMode" @click="onStrip">脱下当前部位</GameButton>
    <div ref="equipment" class="dgw-equipment" :inert="busy"></div><div class="dgw-towels"><GameButton v-if="model.slot==='upper'" :disabled="busy||manageMode" @click="onTowel('large_towel')">裹上大浴巾</GameButton><GameButton v-if="['upper','lower'].includes(model.slot)" :disabled="busy||manageMode" @click="onTowel('towel')">裹上毛巾</GameButton></div><p class="dgw-message dgw-operation-status" role="status">{{model.message}}</p><p class="dgw-count"><strong>{{model.owned}} / {{model.capacity ?? '—'}}</strong> 件<span v-if="query"> · 筛选结果 {{items.length}} 件</span> · {{manageMode?'选择要整理的衣物':'点选即穿上'}}</p>
    <div v-if="manageMode" class="dgw-select-tools"><GameButton :disabled="busy||!items.length" @click="selectVisible">{{allVisibleSelected?'清除当前筛选':'全选当前筛选'}}</GameButton><GameButton :disabled="busy||!checked.length" @click="clearSelection">清除选择</GameButton></div>
    <div ref="itemsList" class="dgw-items" aria-label="衣物列表"><GameButton v-for="item in displayedItems" :key="item.key" class="dgw-item" :data-key="item.key" :disabled="busy" :aria-pressed="manageMode&&checked.includes(item.key)" @click="toggleItem(item.key)"><span class="dgw-item-main"><ClothingIcon :layers="item.icons" :resolve="resolveIcon"/><span v-if="manageMode" class="dgw-check" aria-hidden="true">{{checked.includes(item.key)?'✓':''}}</span><span><strong>{{item.name}}</strong><small>{{item.colour || '原色'}}</small><ClothingTraits :traits="item.traits"/></span></span><span class="dgw-metrics"><small>{{item.outfit}} · 暴露 {{item.lewd ?? '—'}}</small><small>保暖 {{item.warmth ?? '—'}}</small><small>耐久 {{item.durability===null?'—':item.durability+'%'}}</small></span></GameButton><p v-if="!items.length" class="dgw-empty">{{query ? '没有符合条件的衣物' : model.owned ? '该分类的关联部件随套装主件显示，可查看原版信息。' : '这个分类还没有衣物'}}</p></div>
    <nav v-if="paging&&items.length" class="dgw-pagination" aria-label="衣物分页"><GameButton :disabled="busy||page===0" aria-label="上一页" @click="goToPage(page-1)">上一页</GameButton><span aria-live="polite">第 {{page+1}} / {{pageCount}} 页</span><GameButton :disabled="busy||page>=pageCount-1" aria-label="下一页" @click="goToPage(page+1)">下一页</GameButton><small>分页仅影响显示；全选当前筛选会选择全部结果。</small></nav>

   </div>
   <div class="dgw-side"><details class="dgw-preview-disclosure" v-show="!manageMode" :open="previewOpen" @toggle="previewOpen=($event.target as HTMLDetailsElement).open"><summary>当前穿搭与保暖 · 展开预览</summary><aside class="dgw-detail" aria-label="完整穿搭预览"><div class="dgw-preview-heading"><h3>当前穿搭</h3><GameButton :disabled="busy" :aria-pressed="zoom" @click="zoom=!zoom">{{zoom?'缩小':'放大'}}</GameButton></div><div ref="preview" class="dgw-preview" :class="{'dgw-zoom':zoom}" :aria-busy="model.loading" aria-label="角色全身穿搭"></div><p class="dgw-render-status" role="status">{{model.previewStatus}}</p><h3>{{model.wornName}}</h3><p class="dgw-muted">当前部位保暖：{{model.currentWarmth ?? "—"}}</p><section class="dgw-warmth"><h3>整套保暖</h3><div ref="warmth" class="dgw-warmth-content"></div></section><p class="dgw-note">点击列表中的衣物直接穿上。穿脱限制由游戏判断。</p></aside></details>
    <div v-if="manageMode" class="dgw-selection-bar"><span>{{checked.length}} 件已选择</span><GameButton :disabled="busy||!checked.length" @click="review">审查丢弃</GameButton><GameButton :disabled="busy||!canSplit" @click="onSplit([...checked])">剪开套装</GameButton><GameButton v-if="model.canRepair" :disabled="busy||!checked.length" @click="onRepair([...checked])">修理衣物</GameButton><template v-if="model.destinations.length"><select v-model="destination" :disabled="busy" aria-label="转移到衣柜" @change="onCancel"><option v-for="target in model.destinations" :key="target.key" :value="target.key">{{target.label}}</option></select><GameButton :disabled="busy||!checked.length||!destination" @click="onTransfer([...checked],destination)">转移衣物</GameButton></template><span v-if="busy" class="dgw-progress" role="status">{{view.progress||'处理中…'}}</span><div v-if="pending.length" class="dgw-confirm" role="region" aria-labelledby="dgw-confirm-title"><h4 id="dgw-confirm-title" ref="confirmationTitle" tabindex="-1">确认{{operationLabel}}以下衣物</h4><ul><li v-for="item in pending" :key="item.key"><strong>{{item.name}}</strong><span>{{item.colour||'原色'}}</span><small v-if="item.linked">{{model.pendingMode==='separateOutfits'?'关联部件将分离，可独立穿戴':'套装关联部件将一并处理'}}</small></li></ul><p>{{model.pendingMinutes!==null?`预计消耗 ${model.pendingMinutes} 分钟。`:model.pendingMode==='transfer'?'转入所选衣柜，按各部位检查容量。':'此操作不可撤销。'}}</p><div><GameButton :disabled="busy" @click="onConfirm">确认{{operationLabel}}</GameButton><GameButton :disabled="busy" @click="onCancel">取消</GameButton></div></div></div>
   </div>
  </div>

 </section>
</template>
