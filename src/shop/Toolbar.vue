<script setup lang="ts">
import {ref} from 'vue';
import {useWorkspaceSurface} from '../ui/workspace-surface';
const toolbar=ref<HTMLElement>();useWorkspaceSurface(toolbar,'shop',node=>{const next=node.closest('.dgshop-host')?.nextElementSibling;return next instanceof HTMLElement&&next.matches('.dgshop-content')?next:undefined});
import GameButton from '../ui/GameButton.vue';
import ShopReference from './ShopReference.vue';
defineProps<{state:{hasDetails:boolean;isEntry:boolean;open:boolean;narrow:boolean;compact:boolean;categoriesOpen:boolean;selectedTitle:string;referenceEnabled:boolean;referenceA:{title:string;price:string;owned:string}|null;comparisonB:{title:string;price:string;owned:string}|null;comparisonTarget:string|null;comparisonOrigin:{left:number;top:number;width:number;height:number}|null;transactionStatus:''|'pending'|'confirmed'|'unknown';transactionMessage:string;defaultGender:string;message:string};toggle:()=>void;toggleCategories:()=>void;setDefaultGender:(value:string)=>void;pinReference:()=>void;compareReference:(origin:HTMLElement)=>void;clearReference:()=>void;closeComparison:()=>void}>();
</script>
<template><header ref="toolbar" class="dgshop-toolbar cu:flex cu:items-center cu:justify-between cu:gap-3">
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
 </header><ShopReference :enabled="state.referenceEnabled" :has-selection="state.hasDetails&&!!state.selectedTitle" :reference-a="state.referenceA" :comparison-b="state.comparisonB" :target="state.comparisonTarget" :origin="state.comparisonOrigin" @pin="pinReference" @compare="compareReference" @clear="clearReference" @close="closeComparison"/><p v-if="state.transactionMessage" class="dgshop-transaction" :data-transaction-status="state.transactionStatus" role="status">{{state.transactionMessage}}</p><p v-if="state.message" class="dgshop-default-message" role="status">{{state.message}}</p></template>
