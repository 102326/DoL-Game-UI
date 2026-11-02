<script setup lang="ts">
import GameButton from '../ui/GameButton.vue';
import {ref} from 'vue';
const props=defineProps<{sections:Array<{id:string;label:string}>;go:(id:string)=>boolean;fallback:()=>void}>();
const selected=ref('');
function select(id:string){if(props.go(id))selected.value=id}
</script>
<template>
 <nav class="dgs-navigation dgu-orbit-nav cu:flex cu:flex-wrap cu:items-center cu:gap-2" aria-label="社交分组">
  <GameButton data-kw-nav-control="category" :aria-pressed="selected===''" @click="select('')">概况</GameButton>
  <GameButton data-kw-nav-control="category" v-for="section in sections" :key="section.id" :aria-pressed="selected===section.id" @click="select(section.id)">{{section.label}}</GameButton>
  <GameButton data-kw-nav-control="category" class="dgs-fallback" @click="fallback">原版社交</GameButton>
 </nav>
</template>
