<script setup lang="ts">
import GameButton from '../ui/GameButton.vue';
import {acrylicDefault} from './acrylic';
defineProps<{value:number;disabled?:boolean}>();
defineEmits<{change:[value:number]}>();
</script>
<template>
 <div class="dmt-acrylic-control">
  <label class="dgu-setting-row"><span><strong>Acrylic 通透度</strong><small>向左更沉稳，向右更通透；文字和按钮保持清晰。</small></span><input aria-label="Acrylic 通透度" type="range" min="0" max="100" step="1" :value="value" :disabled="disabled" :aria-valuetext="value+'%，'+(value<35?'沉稳':value>65?'通透':'平衡')" @input="$emit('change',Number(($event.target as HTMLInputElement).value))"/></label>
  <div class="dmt-acrylic-scale" aria-hidden="true"><span>沉稳</span><output>{{value}}%</output><span>通透</span></div>
  <div class="dmt-workspace-actions"><GameButton type="button" :disabled="disabled" @click="$emit('change',acrylicDefault)">恢复默认通透度</GameButton><small v-if="disabled">开启玻璃模糊后可调节通透度。</small></div>
 </div>
</template>
