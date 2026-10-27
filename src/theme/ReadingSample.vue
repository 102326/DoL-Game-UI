<script setup lang="ts">
import {ref} from 'vue';
import GameButton from '../ui/GameButton.vue';
import type {Preferences} from './preferences';
defineProps<{preferences:Preferences}>();
const selected=ref('');
</script>
<template><aside class="dmt-reading-sample"><span>文字与控件预览</span>
 <div class="dmt-reading-demo" :style="{width:`${72+preferences.readingWidth*.28}%`,lineHeight:String(1.5*preferences.readingLineScale/100),'--reading-demo-gap':`${preferences.readingBlockGap}px`}">
  <p>这段正文按当前字号显示。窗外的光落在纸面上，短句与较长的句子交替出现，可以比较每行距离、段落留白和换行位置。</p>
  <p>调整上方滑杆，查看适合自己的阅读节奏。以下按钮仅用于预览。</p>
  <div class="dmt-reading-demo-options"><GameButton type="button" :aria-pressed="selected==='current'" @click="selected='current'">当前按钮比例</GameButton><GameButton type="button" :aria-pressed="selected==='continue'" @click="selected='continue'">继续阅读（示例）</GameButton></div>
 </div>
 <small class="dmt-reading-demo-note">此处是缩略排版示例；真实正文以游戏当前样式为基准。</small>
</aside></template>
