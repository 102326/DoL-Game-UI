<script setup lang="ts">
import type {Item} from './types';
import GameButton from '../ui/GameButton.vue';
defineProps<{item:Item;busy:boolean}>();
defineEmits<{wear:[key:string];native:[]}>();
</script>
<template>
 <section class="dgw-selected-detail" aria-label="选中衣物详情">
  <h3>{{item.name}}</h3><p>{{item.detail||'原版未提供简短说明；可查看原版及扩展信息。'}}</p>
  <dl><dt>颜色</dt><dd>{{item.colour||'原色'}}</dd><dt>保暖</dt><dd>{{item.warmth??'—'}}</dd><dt>耐久</dt><dd>{{item.durability===null?'—':item.durability+'%'}}</dd><dt>暴露度</dt><dd>{{item.lewd??'—'}}</dd><dt>类型</dt><dd>{{item.outfit}}</dd></dl>
  <GameButton class="dgw-explicit-wear" :disabled="busy" @click="$emit('wear',item.key)">穿戴选中衣物</GameButton>
  <GameButton :disabled="busy" @click="$emit('native')">查看完整原版信息</GameButton>
  <p class="dgw-muted">浏览详情不试穿；角色预览显示实际已穿戴状态。</p>
 </section>
</template>
