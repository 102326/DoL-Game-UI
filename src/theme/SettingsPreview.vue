<script setup lang="ts">
import {nextTick,onBeforeUnmount,ref} from 'vue';
import GameButton from '../ui/GameButton.vue';
import type {SettingsState} from './preferences';
import {sourceMotion} from '../ui/source-motion';

defineProps<{state:SettingsState}>();
const reference=ref<HTMLElement>();
const inFlight=ref(false);
let revision=0;
const motion=sourceMotion();
function transfer(){
 const node=reference.value;if(!node)return;
 const from=node.getBoundingClientRect(),paint=getComputedStyle(node),fill=paint.backgroundColor,edge=paint.borderColor,shadow=paint.boxShadow,current=++revision;
 inFlight.value=!inFlight.value;
 void nextTick().then(()=>{
  if(current!==revision||reference.value!==node||!node.isConnected)return;
  const to=node.getBoundingClientRect(),surface=getComputedStyle(node);
  motion.animate(node,[{transform:`translate(${from.left-to.left}px,${from.top-to.top}px)`,backgroundColor:fill,borderColor:edge,boxShadow:shadow},{transform:'translate(0,0)',backgroundColor:surface.backgroundColor,borderColor:surface.borderColor,boxShadow:surface.boxShadow}],520);
 });
}
onBeforeUnmount(()=>{revision++;motion.dispose()});
</script>

<template>
 <section class="dmt-preview-lab" aria-labelledby="dmt-preview-heading">
  <header><div><p class="dmt-eyebrow">实时预览</p><h3 id="dmt-preview-heading">材质与空间</h3></div><span>使用实际组件</span></header>
  <div class="dmt-preview-stage sf-material-main">
   <article class="dmt-preview-reading sf-material-reading"><span>稳定阅读区</span><p>正文留在清晰、安定的表面，方便持续阅读。</p><GameButton type="button">普通操作</GameButton></article>
   <article ref="reference" class="dmt-preview-reference sf-material-reference" :class="{'is-floating':inFlight,'sf-material-float':inFlight,'is-focused':inFlight}" :data-preview-state="inFlight?'focused':'idle'">
    <span>参考内容</span><strong>轻薄外套</strong><small>{{inFlight?'已移入浮层':'位于稳定参考区'}}</small>
    <GameButton type="button" :aria-pressed="inFlight" @click="transfer">{{inFlight?'放回参考区':'提取到浮层'}}</GameButton>
   </article>
  </div>
  <p class="dmt-preview-status" role="status">{{inFlight?'同一份参考内容已进入浮层，表面层次与焦点反馈随位置变化。':'参考内容位于稳定区；点击后移动到浮层，再放回原位。'}}{{!state.preferences.visualMotion?' 动效已关闭。':''}}{{!state.preferences.visualGlass?' 玻璃模糊已关闭。':''}}</p>
 </section>
</template>
