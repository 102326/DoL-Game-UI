<script setup lang="ts">
import GameButton from '../ui/GameButton.vue';
defineProps<{state:{hasDetails:boolean;isEntry:boolean;open:boolean;narrow:boolean;selectedTitle:string;defaultGender:string;message:string};toggle:()=>void;setDefaultGender:(value:string)=>void}>();
</script>
<template><header class="dgshop-toolbar cu:flex cu:items-center cu:justify-between cu:gap-3">
 <h2>服装店</h2>
 <details class="dgshop-entry-settings" :open="!state.isEntry">
 <summary v-show="state.isEntry">进店设置</summary>
 <label class="dgshop-default-filter">进店默认
  <select aria-label="进店默认服装类型" :value="state.defaultGender" @change="setDefaultGender(($event.target as HTMLSelectElement).value)">
   <option value="game">沿用游戏</option><option value="female">女性及中性服装</option><option value="female-only">仅女性服装</option><option value="male">男性及中性服装</option><option value="male-only">仅男性服装</option><option value="all">全部服装</option>
  </select>
 </label></details>
 <GameButton v-if="state.hasDetails&&state.narrow" class="dgshop-open-detail" @click="toggle" :aria-expanded="state.open" :title="state.selectedTitle">{{state.open?'收起详情':'查看商品详情'}}</GameButton>
 </header><p v-if="state.message" class="dgshop-default-message" role="status">{{state.message}}</p></template>
