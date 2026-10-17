<script setup lang="ts">
import GameButton from '../ui/GameButton.vue';
defineProps<{state:{hasDetails:boolean;isEntry:boolean;open:boolean;narrow:boolean;compact:boolean;categoriesOpen:boolean;selectedTitle:string;referenceEnabled:boolean;referenceA:{title:string;price:string;owned:string}|null;comparisonB:{title:string;price:string;owned:string}|null;defaultGender:string;message:string};toggle:()=>void;toggleCategories:()=>void;setDefaultGender:(value:string)=>void;pinReference:()=>void;compareReference:()=>void;clearReference:()=>void;closeComparison:()=>void}>();
const comparisonFields=[['title','商品名称'],['price','原版价格文字'],['owned','名称行标记']] as const;
</script>
<template><header class="dgshop-toolbar cu:flex cu:items-center cu:justify-between cu:gap-3">
 <h2>服装店</h2>
 <details class="dgshop-entry-settings" :open="!state.isEntry&&!state.narrow">
 <summary v-show="state.isEntry||state.narrow">进店设置</summary>
 <label class="dgshop-default-filter">进店默认
  <select aria-label="进店默认服装类型" :value="state.defaultGender" @change="setDefaultGender(($event.target as HTMLSelectElement).value)">
   <option value="game">沿用游戏</option><option value="female">女性及中性服装</option><option value="female-only">仅女性服装</option><option value="male">男性及中性服装</option><option value="male-only">仅男性服装</option><option value="all">全部服装</option>
  </select>
 </label></details>
 <GameButton v-if="state.compact&&!state.isEntry" class="dgshop-categories-toggle" @click="toggleCategories" :aria-expanded="state.categoriesOpen" aria-controls="shopCategories">分类</GameButton>
 <GameButton v-if="state.hasDetails&&state.narrow" class="dgshop-open-detail" @click="toggle" :aria-expanded="state.open" :title="state.selectedTitle">{{state.open?'收起详情':'查看商品详情'}}</GameButton>
 </header><section v-if="state.referenceEnabled&&(state.referenceA||state.hasDetails&&state.selectedTitle)" class="dgshop-reference-tools" aria-label="商品只读对比">
  <GameButton data-shop-pin :disabled="!state.hasDetails||!state.selectedTitle" @click="pinReference">{{state.referenceA?'更新 A 商品':'固定为 A'}}</GameButton>
  <GameButton v-if="state.referenceA" data-shop-compare :disabled="!state.hasDetails||!state.selectedTitle" @click="compareReference">与 A 对比当前商品</GameButton>
  <GameButton v-if="state.referenceA" @click="clearReference">清除 A</GameButton>
  <GameButton v-if="state.comparisonB" @click="closeComparison">关闭对比</GameButton>
  <p v-if="state.referenceA" class="dgshop-reference-status" role="status">A：{{state.referenceA.title}} · {{state.referenceA.price}} · {{state.referenceA.owned}}</p>
  <p class="dgshop-reference-note">仅为商品当前的原版显示文本快照，不代表实时交易结果或持有状态。</p>
  <dl v-if="state.comparisonB" class="dgshop-reference-comparison"><div v-for="[field,label] in comparisonFields" :key="field"><dt>{{label}}</dt><dd>A：{{state.referenceA?.[field]||'—'}}</dd><dd>B：{{state.comparisonB[field]||'—'}}</dd></div></dl>
 </section><p v-if="state.message" class="dgshop-default-message" role="status">{{state.message}}</p></template>
