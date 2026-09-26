<script setup lang="ts">
import GameButton from '../ui/GameButton.vue';
defineProps<{sections:Array<{id:string;label:string}>;go:(id:string)=>void;fallback:()=>void}>();
</script>
<template>
 <nav class="dgs-navigation cu:flex cu:flex-wrap cu:items-center cu:gap-2" aria-label="社交分组">
  <GameButton @click="go('')">概况</GameButton>
  <GameButton v-for="section in sections" :key="section.id" @click="go(section.id)">{{section.label}}</GameButton>
  <GameButton class="dgs-fallback" @click="fallback">原版社交</GameButton>
 </nav>
</template>
