<script setup lang="ts">
import GameButton from '../ui/GameButton.vue';
import {readingDefaults,readingRanges,type Preferences,type ReadingKey} from './preferences';
defineProps<{preferences:Preferences}>();
const emit=defineEmits<{change:[key:ReadingKey,value:number]}>();
function valueLabel(key:ReadingKey,value:number){return key==='readingLineScale'?`${value}%${value===100?' · 原版':''}`:key==='readingBlockGap'?`+${value}px${value===0?' · 原版':''}`:value===0?'原版':`放宽 ${value}%`}
function reset(){for(const key of Object.keys(readingDefaults) as ReadingKey[])emit('change',key,readingDefaults[key])}
</script>
<template><div class="dmt-reading-adjustments">
 <label v-for="(item,key) in readingRanges" :key="key" class="dgu-setting-row"><span><strong>{{item.label}} · {{valueLabel(key,preferences[key])}}</strong><small>{{item.description}}</small></span><input type="range" :aria-label="item.label" :aria-valuetext="valueLabel(key,preferences[key])" :min="item.min" :max="item.max" :step="item.step" :value="preferences[key]" @input="emit('change',key,Number(($event.target as HTMLInputElement).value))"/></label>
 <div class="dmt-workspace-actions"><GameButton @click="reset">恢复原版排版</GameButton><p>只恢复这三项，字号和其他设置保持不变。</p></div>
</div></template>
