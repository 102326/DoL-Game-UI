<script setup lang="ts">
import GameButton from '../ui/GameButton.vue';
import OrbitFocus from '../ui/OrbitFocus.vue';
defineProps<{items:readonly {id:string;label:string}[];active:string;layout?:'horizontal'|'vertical'}>();
defineEmits<{select:[id:string]}>();
</script>
<template>
 <nav class="dmt-workspace-nav" aria-label="设置分类">
  <OrbitFocus :active="active" :layout="layout"/>
  <GameButton data-kw-nav-control="category" v-for="item in items" :key="item.id" type="button" :aria-current="active===item.id?'page':undefined" @click="$emit('select',item.id)">{{item.label}}</GameButton>
 </nav>
</template>
