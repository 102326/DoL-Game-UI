<script setup lang="ts">
import GameButton from '../ui/GameButton.vue';
import {onBeforeUnmount,ref} from 'vue';
type DisplayItem={title:string;price:string;owned:string};
type Origin={left:number;top:number;width:number;height:number}|null;
const props=defineProps<{enabled:boolean;hasSelection:boolean;referenceA:DisplayItem|null;comparisonB:DisplayItem|null;target:string|null;origin:Origin}>();
const emit=defineEmits<{pin:[];compare:[origin:HTMLElement];clear:[];close:[]} >();
const compareTrigger=ref<HTMLElement|null>(null);
const fields=[['title','商品名称'],['price','价格文字'],['owned','名称标记']] as const;
const animations=new WeakMap<HTMLElement,Animation>();
const activeAnimations=new Set<Animation>();
function canAnimate(){return document.documentElement.hasAttribute('data-dgu-visualMotion')&&!matchMedia('(prefers-reduced-motion: reduce)').matches}
function cancel(element:Element){const panel=element as HTMLElement,animation=animations.get(panel);animation?.cancel();if(animation)activeAnimations.delete(animation);animations.delete(panel)}
function enter(element:Element,done:()=>void){
 const panel=element as HTMLElement;cancel(panel);if(!canAnimate()||typeof panel.animate!=='function'){done();return}
 const origin=props.origin,box=panel.getBoundingClientRect();
 const dx=origin?origin.left-box.left:0,dy=origin?origin.top-box.top:8;
 const animation=panel.animate([{opacity:0,transform:`translate(${dx}px,${dy}px) scale(.96)`},{opacity:1,transform:'translate(0,0) scale(1)'}],{duration:200,easing:'cubic-bezier(.2,.75,.25,1)'});
 animations.set(panel,animation);activeAnimations.add(animation);animation.finished.then(()=>{if(animations.get(panel)===animation){animations.delete(panel);activeAnimations.delete(animation);done()}},()=>{});
}
function leave(element:Element,done:()=>void){
 const panel=element as HTMLElement;cancel(panel);
 if(!canAnimate()||typeof panel.animate!=='function'){done();return}
 const origin=props.origin,box=panel.getBoundingClientRect(),dx=origin?origin.left-box.left:0,dy=origin?origin.top-box.top:8;
 const animation=panel.animate([{opacity:1,transform:'translate(0,0) scale(1)'},{opacity:0,transform:`translate(${dx}px,${dy}px) scale(.96)`}],{duration:150,easing:'ease-in'});
 animations.set(panel,animation);activeAnimations.add(animation);animation.finished.then(()=>{if(animations.get(panel)===animation){animations.delete(panel);activeAnimations.delete(animation);done()}},()=>{});
}
// Finish the visual transition when motion is withdrawn; keep Vue's completion callback.
const media=matchMedia('(prefers-reduced-motion: reduce)');
function settle(){if(!canAnimate())for(const animation of activeAnimations)animation.finish()}
const themeObserver=new MutationObserver(settle);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-dgu-visualmotion']});media.addEventListener('change',settle);
onBeforeUnmount(()=>{themeObserver.disconnect();media.removeEventListener('change',settle);for(const animation of activeAnimations)animation.cancel();activeAnimations.clear()});
function afterEnter(element:Element){(element as HTMLElement).querySelector<HTMLElement>('[data-shop-close]')?.focus({preventScroll:true})}
function compareFrom(event:MouseEvent){if(event.currentTarget instanceof HTMLElement){compareTrigger.value=event.currentTarget;emit('compare',event.currentTarget)}}
function closeFromPanel(){emit('close');requestAnimationFrame(()=>compareTrigger.value?.isConnected&&compareTrigger.value.focus({preventScroll:true}))}
function relation(a:string,b:string){return !a||!b?'未提供':a===b?'显示文字相同':'显示文字不同'}
</script>
<template>
 <div v-if="enabled&&(referenceA||hasSelection)" class="dgshop-reference-tools" aria-label="只读商品对比">
  <Transition :css="false" @enter="enter" @leave="leave" @enter-cancelled="cancel" @leave-cancelled="cancel"><button v-if="referenceA" class="dgshop-reference-chip" type="button" aria-label="清除固定商品 A" @click="emit('clear')">
   <span class="dgshop-reference-chip-tag">A</span><span class="dgshop-reference-chip-copy"><strong>{{referenceA.title}}</strong><small>{{referenceA.price||'无价格文字'}}</small></span><span class="dgshop-reference-chip-clear" aria-hidden="true">×</span>
  </button></Transition>
  <GameButton v-if="!referenceA" class="dgshop-reference-action" data-shop-pin :disabled="!hasSelection" @click="emit('pin')">固定 A</GameButton>
  <GameButton v-if="referenceA&&hasSelection" class="dgshop-reference-action" data-shop-compare @click="compareFrom">对比当前</GameButton>
  <GameButton v-if="referenceA" class="dgshop-reference-action" data-shop-pin @click="emit('pin')">更新 A</GameButton>
 </div>
 <Teleport :to="target||'body'" :disabled="!target">
  <Transition :css="false" @enter="enter" @leave="leave" @enter-cancelled="cancel" @leave-cancelled="cancel" @after-enter="afterEnter">
   <section v-if="comparisonB&&referenceA" class="dgshop-reference-comparison" role="region" aria-label="商品显示对比">
    <header class="dgshop-reference-comparison-head"><strong>商品对照</strong><button type="button" data-shop-close @click="closeFromPanel">关闭</button></header>
    <div class="dgshop-reference-cards">
     <article class="dgshop-reference-card" data-side="A"><h3><span>A</span>{{referenceA.title}}</h3><p class="dgshop-reference-price">{{referenceA.price||'无价格文字'}}</p><small>原名称：{{referenceA.owned||'无名称行文字'}}</small></article>
     <article class="dgshop-reference-card" data-side="B"><h3><span>B</span>{{comparisonB.title}}</h3><p class="dgshop-reference-price">{{comparisonB.price||'无价格文字'}}</p><small>原名称：{{comparisonB.owned||'无名称行文字'}}</small></article>
    </div>
    <div class="dgshop-reference-relations"><div v-for="[field,label] in fields" :key="field"><span>{{label}}</span><strong>{{relation(referenceA[field],comparisonB[field])}}</strong></div></div>
    <p class="dgshop-reference-note">这里只比较当前显示文本，不表示实时报价、成交结果或持有状态。</p>
   </section>
  </Transition>
 </Teleport>
</template>
