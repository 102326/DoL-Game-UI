<script setup lang="ts">
import GameButton from '../ui/GameButton.vue';
import {ref} from 'vue';
import OrbitFocus from '../ui/OrbitFocus.vue';
const props=defineProps<{sections:Array<{id:string;label:string}>;go:(id:string)=>boolean;fallback:()=>void}>();
const selected=ref(''),official=document.documentElement.hasAttribute('data-stone-free');
function select(id:string){if(props.go(id))selected.value=id}
</script>
<template>
 <nav class="dgc-navigation dgu-orbit-nav cu:flex cu:flex-wrap cu:items-center cu:gap-2" aria-label="属性分组">
  <OrbitFocus v-if="official" :active="selected" selector="[aria-pressed=true]"/>
  <GameButton data-kw-nav-control="category" :aria-pressed="selected===''" @click="select('')">概况</GameButton>
  <GameButton data-kw-nav-control="category" v-for="section in sections" :key="section.id" :data-section="section.id" :aria-pressed="selected===section.id" @click="select(section.id)">{{section.label}}</GameButton>
  <GameButton data-kw-nav-control="category" class="dgc-fallback" @click="fallback">原版属性</GameButton>
 </nav>
</template>
