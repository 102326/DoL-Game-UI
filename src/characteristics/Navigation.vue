<script setup lang="ts">
import GameButton from '../ui/GameButton.vue';
defineProps<{sections:Array<{id:string;label:string}>;go:(id:string)=>void;fallback:()=>void}>();
</script>
<template>
 <nav class="dgc-navigation cu:flex cu:flex-wrap cu:items-center cu:gap-2" aria-label="属性分组">
  <GameButton @click="go('')">概况</GameButton>
  <GameButton v-for="section in sections" :key="section.id" @click="go(section.id)">{{section.label}}</GameButton>
  <GameButton class="dgc-fallback" @click="fallback">原版属性</GameButton>
 </nav>
</template>
