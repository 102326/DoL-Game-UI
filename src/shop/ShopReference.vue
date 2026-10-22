<script setup lang="ts">
import GameButton from '../ui/GameButton.vue';
import {onBeforeUnmount,ref,watch,nextTick} from 'vue';
import {sourceMotion} from '../ui/source-motion';
import {visualScope} from '../ui/visual-scope';
const scope=visualScope();
type DisplayItem={title:string;price:string;owned:string};
type Origin={left:number;top:number;width:number;height:number}|null;
const props=defineProps<{enabled:boolean;hasSelection:boolean;referenceA:DisplayItem|null;comparisonB:DisplayItem|null;target:string|null;origin:Origin}>();
const emit=defineEmits<{pin:[];compare:[origin:HTMLElement];clear:[];close:[]} >();
const compareTrigger=ref<HTMLElement|null>(null);
const fields=[['title','商品名称'],['price','价格文字'],['owned','名称标记']] as const;
const motion=sourceMotion(),spatial=ref(true),chip=ref<HTMLElement>();
function cancel(element:Element){motion.cancel(element as HTMLElement)}
function transition(element:Element,done:()=>void,returning=false){
 const node=element as HTMLElement;cancel(node);if(!spatial.value){done();return}
 const box=node.getBoundingClientRect(),origin=props.origin,dx=origin?origin.left-box.left:0,dy=origin?origin.top-box.top:12;
 const frames=[{opacity:.15,transform:`translate(${dx}px,${dy}px) scale(.75)`,filter:'blur(3px)'},{opacity:1,transform:'translate(0,0) scale(1)',filter:'blur(0)'}];
 const a=motion.animate(node,returning?frames.reverse():frames,returning?200:420);
 if(a)void a.finished.catch(()=>{}).then(done);else done();
 if(!returning)node.querySelectorAll<HTMLElement>('[data-different="true"] strong').forEach((field,i)=>motion.animate(field,[{opacity:.2,clipPath:'inset(0 100% 0 0)'},{opacity:1,clipPath:'inset(0 0 0 0)'}],300+i*65));
}
const enter=(element:Element,done:()=>void)=>transition(element,done),leave=(element:Element,done:()=>void)=>transition(element,done,true);
watch(spatial,()=>motion.cancel());
watch(()=>props.referenceA,async(item,old)=>{motion.cancel();if(item&&item!==old){await nextTick();if(item===props.referenceA&&spatial.value&&chip.value?.isConnected&&props.origin)motion.flight(DOMRect.fromRect(props.origin),chip.value.getBoundingClientRect(),item.title)}});
scope.own(()=>motion.dispose());onBeforeUnmount(scope.dispose);
function afterEnter(element:Element){if(!element.isConnected)return;(element as HTMLElement).querySelector<HTMLElement>('[data-shop-close]')?.focus({preventScroll:true})}
function compareFrom(event:MouseEvent){if(event.currentTarget instanceof HTMLElement){compareTrigger.value=event.currentTarget;emit('compare',event.currentTarget)}}
function restoreFocus(){if(compareTrigger.value?.isConnected)compareTrigger.value.focus({preventScroll:true})}
function closeFromPanel(){emit('close');scope.frame(restoreFocus)}
function relation(a:string,b:string){return !a||!b?'未提供':a===b?'显示文字相同':'显示文字不同'}
</script>
<template>
 <div v-if="enabled&&(referenceA||hasSelection)" class="dgshop-reference-tools" aria-label="只读商品对比">
  <button v-if="referenceA" ref="chip" class="dgshop-reference-chip" type="button" aria-label="清除固定商品 A" @click="emit('clear')">
   <span class="dgshop-reference-chip-tag">A</span><span class="dgshop-reference-chip-copy"><strong>{{referenceA.title}}</strong><small>{{referenceA.price||'无价格文字'}}</small></span><span class="dgshop-reference-chip-clear" aria-hidden="true">×</span>
  </button>
  <GameButton v-if="!referenceA" class="dgshop-reference-action" data-shop-pin :disabled="!hasSelection" @click="emit('pin')">固定 A</GameButton>
  <GameButton v-if="referenceA&&hasSelection" class="dgshop-reference-action" data-shop-compare @click="compareFrom">对比当前</GameButton>
  <GameButton v-if="referenceA" class="dgshop-reference-action" data-shop-pin @click="emit('pin')">更新 A</GameButton><label v-if="referenceA" class="dgshop-motion-choice"><input v-model="spatial" type="checkbox" data-shop-spatial>空间转场</label>
 </div>
 <Teleport :to="target||'body'" :disabled="!target">
  <Transition :css="false" @enter="enter" @leave="leave" @enter-cancelled="cancel" @leave-cancelled="cancel" @after-enter="afterEnter">
   <section v-if="comparisonB&&referenceA" :key="JSON.stringify(comparisonB)" class="dgshop-reference-comparison" role="region" aria-label="商品显示对比">
    <header class="dgshop-reference-comparison-head"><strong>商品对照</strong><button type="button" data-shop-close @click="closeFromPanel">关闭</button></header>
    <div class="dgshop-reference-cards">
     <article class="dgshop-reference-card" data-side="A"><h3><span>A</span>{{referenceA.title}}</h3><p class="dgshop-reference-price">{{referenceA.price||'无价格文字'}}</p><small>原名称：{{referenceA.owned||'无名称行文字'}}</small></article>
     <article class="dgshop-reference-card" data-side="B"><h3><span>B</span>{{comparisonB.title}}</h3><p class="dgshop-reference-price">{{comparisonB.price||'无价格文字'}}</p><small>原名称：{{comparisonB.owned||'无名称行文字'}}</small></article>
    </div>
    <div class="dgshop-reference-relations"><div v-for="[field,label] in fields" :key="field" :data-different="!!referenceA[field]&&!!comparisonB[field]&&referenceA[field]!==comparisonB[field]"><span>{{label}}</span><strong>{{relation(referenceA[field],comparisonB[field])}}</strong></div></div>
    <p class="dgshop-reference-note">这里只比较当前显示文本，不表示实时报价、成交结果或持有状态。</p>
   </section>
  </Transition>
 </Teleport>
</template>
