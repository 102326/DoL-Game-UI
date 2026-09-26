<script setup lang="ts">
import GameButton from '../ui/GameButton.vue';
import type {NavigationState} from './main';
defineProps<{state:NavigationState;go:(index:number)=>void;fallback:()=>void}>();
function navigate(event:Event,go:(index:number)=>void){const select=event.target as HTMLSelectElement;go(Number(select.value));select.value=''}
</script>
<template>
 <nav class="dgp-navigation cu:flex cu:flex-wrap cu:items-center cu:gap-2" :aria-label="`${state.title}导航`">
  <GameButton @click="go(-1)">回到顶部</GameButton>
  <select v-if="state.sections.length" aria-label="跳到分组" value="" @change="navigate($event,go)">
   <option disabled value="">跳到分组</option>
   <option v-for="(section,index) in state.sections" :key="index" :value="index">{{section}}</option>
  </select>
  <GameButton class="dgp-fallback" @click="fallback">原版{{state.title}}</GameButton>
 </nav>
</template>
