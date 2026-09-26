<script setup lang="ts">
import {ref} from 'vue';
import type {CombatModel} from './types';
defineProps<{model:CombatModel;onJump:(key:string)=>void;onClassic:()=>void}>();
const native=ref<HTMLElement>();
const dock=ref<HTMLElement>();
const summaryOpen=ref(false);
defineExpose({native,dock});
</script>
<template>
 <section class="dcu-shell" aria-label="新版战斗面板" data-dcu-vue>
  <header class="dcu-header"><span>行动选择</span><button type="button" @click="onClassic">原版界面 ↗</button></header>
  <div class="dcu-workspace"><div ref="native" class="dcu-native"></div></div>
  <footer ref="dock" class="dcu-footer" aria-label="战斗操作栏"><aside v-if="summaryOpen" class="dcu-summary" aria-label="本回合选择"><div class="dcu-summary-heading"><h3>本回合选择</h3><span>{{model.groups.length}} 组</span></div><p class="dcu-hint">摘要随原控件更新，不会自动提交。</p><dl><template v-for="g in model.groups" :key="g.key"><dt>{{g.title}}</dt><dd>{{g.selected||'暂无已选动作'}}</dd></template></dl></aside><button type="button" class="dcu-summary-toggle" :aria-expanded="summaryOpen" @click="summaryOpen=!summaryOpen">{{summaryOpen?'收起摘要':'选择摘要'}}<span>{{model.groups.length}}</span></button><div class="dcu-dock-native" aria-label="原生战斗操作"></div></footer>
 </section>
</template>
